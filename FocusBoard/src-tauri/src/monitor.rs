use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::process::Command;
use std::thread;
use std::sync::mpsc;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, Listener};
use regex::Regex;

fn sanitize_title(input: &str) -> String {
    let mut s = input.to_string();
    if let Ok(email_re) = Regex::new(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}") {
        s = email_re.replace_all(&s, "[REDACTED_EMAIL]").to_string();
    }
    if let Ok(ip_re) = Regex::new(r"\b(?:\d{1,3}\.){3}\d{1,3}\b") {
        s = ip_re.replace_all(&s, "[REDACTED_IP]").to_string();
    }
    if let Ok(path_re) = Regex::new(r"(/[^ \n]+|[A-Za-z]:\\\\S+)") {
        s = path_re.replace_all(&s, "[REDACTED_PATH]").to_string();
    }
    if s.len() > 200 {
        s.truncate(200);
    }
    s
}

fn log_json(level: &str, message: &str, fields: Value) {
    let payload = json!({
        "ts": Local::now().to_rfc3339(),
        "level": level,
        "message": message,
        "fields": fields,
    });
    println!("{}", payload);
}

#[derive(Deserialize, Serialize)]
pub struct ActivityEvent {
    pub app_name: String,
    pub window_title: String,
    pub idle_time: u64,
    pub timestamp: DateTime<Local>,
}

fn try_hyprctl_active_window() -> Option<(String, String)> {
    let output = Command::new("hyprctl")
        .arg("activewindow")
        .arg("-j")
        .output()
        .ok()?;
    if !output.status.success() {
        return None;
    }
    let parsed: Value = serde_json::from_slice(&output.stdout).ok()?;
    let title = parsed.get("title").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let class = parsed
        .get("class")
        .and_then(|v| v.as_str())
        .filter(|v| !v.is_empty())
        .or_else(|| parsed.get("initialClass").and_then(|v| v.as_str()))
        .unwrap_or("Unknown")
        .to_string();
    if title.is_empty() && class == "Unknown" {
        None
    } else {
        Some((class, title))
    }
}

pub fn start_monitor(app: AppHandle) {
    let app_handle = app.clone();
    let (shutdown_tx, shutdown_rx) = mpsc::channel::<()>();
    let monitor_handle: Arc<Mutex<Option<thread::JoinHandle<()>>>> = Arc::new(Mutex::new(None));

    let monitor_thread = thread::spawn(move || {
        let mut last_app = String::new();
        let mut last_title = String::new();
        let mut was_idle = false;
        let idle_threshold: u64 = std::env::var("FOCUSBOARD_IDLE_THRESHOLD").ok().and_then(|s| s.parse::<u64>().ok()).unwrap_or(30);
        let allow_x11 = std::env::var("FOCUSBOARD_ALLOW_X11")
            .ok()
            .map(|v| v == "1" || v.eq_ignore_ascii_case("true"))
            .unwrap_or(false);
        let base_poll_secs: u64 = std::env::var("FOCUSBOARD_POLL_SECS").ok().and_then(|s| s.parse::<u64>().ok()).unwrap_or(1);
        let max_poll_secs: u64 = std::env::var("FOCUSBOARD_MAX_POLL_SECS").ok().and_then(|s| s.parse::<u64>().ok()).unwrap_or(5);
        let background_poll_secs: u64 = std::env::var("FOCUSBOARD_BACKGROUND_POLL_SECS").ok().and_then(|s| s.parse::<u64>().ok()).unwrap_or(10);
        let mut poll_secs = base_poll_secs;

        loop {
            if shutdown_rx.try_recv().is_ok() {
                break;
            }

            let mut current_app = "Unknown".to_string();
            let mut current_title = "Unknown".to_string();
            let current_idle_secs = 0;

            // Prefer Hyprland (Wayland) to avoid X11/Xlib instability in some environments.
            if let Some((app, title)) = try_hyprctl_active_window() {
                current_app = app;
                current_title = title;
            } else if allow_x11 {
                if let Ok(window) = active_win_pos_rs::get_active_window() {
                    current_app = window.app_name;
                    current_title = window.title;
                }
            }

            let is_idle = current_idle_secs >= idle_threshold;

            let window_changed = current_app != last_app || current_title != last_title;
            let idle_status_changed = is_idle != was_idle;

            if window_changed || idle_status_changed {
                last_app = current_app.clone();
                last_title = current_title.clone();
                was_idle = is_idle;

                let sanitized_app = if is_idle {
                    "Idle".to_string()
                } else {
                    sanitize_title(&current_app)
                };
                let sanitized_title = if is_idle {
                    "System Idle".to_string()
                } else {
                    sanitize_title(&current_title)
                };

                let event = ActivityEvent {
                    app_name: sanitized_app,
                    window_title: sanitized_title,
                    idle_time: current_idle_secs,
                    timestamp: Local::now(),
                };

                // Emit and handle potential error
                if let Err(err) = app_handle.emit("activity-update", &event) {
                    log_json("error", "emit_failed", json!({ "error": format!("{:?}", err) }));
                }

                log_json("info", "activity_update", json!({
                    "app_name": event.app_name,
                    "idle_seconds": current_idle_secs,
                }));
                poll_secs = base_poll_secs;
            } else if is_idle {
                poll_secs = std::cmp::min(poll_secs.saturating_add(1), max_poll_secs);
            } else {
                poll_secs = base_poll_secs;
            }

            let is_backgrounded = app_handle
                .get_webview_window("main")
                .and_then(|window| window.is_visible().ok().map(|visible| !visible))
                .unwrap_or(false)
                || app_handle
                    .get_webview_window("main")
                    .and_then(|window| window.is_minimized().ok())
                    .unwrap_or(false);

            if is_backgrounded {
                poll_secs = background_poll_secs;
            }

            thread::sleep(Duration::from_secs(poll_secs));
        }
    });

    if let Ok(mut handle) = monitor_handle.lock() {
        *handle = Some(monitor_thread);
    }

    let handle_for_shutdown = monitor_handle.clone();
    let shutdown_signal = shutdown_tx.clone();
    app.listen_any("tauri://close-requested", move |_| {
        let _ = shutdown_signal.send(());
        if let Ok(mut handle) = handle_for_shutdown.lock() {
            if let Some(join_handle) = handle.take() {
                let _ = join_handle.join();
            }
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_email_redaction() {
        let input = "Hello someone@example.com!";
        let out = sanitize_title(input);
        assert!(!out.contains("someone@example.com"));
        assert!(out.contains("[REDACTED_EMAIL]"));
    }

    #[test]
    fn test_ip_redaction() {
        let input = "Connected from 192.168.0.1";
        let out = sanitize_title(input);
        assert!(!out.contains("192.168.0.1"));
        assert!(out.contains("[REDACTED_IP]"));
    }

    #[test]
    fn test_path_redaction_unix() {
        let input = "/home/user/documents/secrets.txt - Editor";
        let out = sanitize_title(input);
        assert!(!out.contains("/home/user/documents/secrets.txt"));
        assert!(out.contains("[REDACTED_PATH]"));
    }

    #[test]
    fn test_truncation() {
        let long = "a".repeat(300);
        let out = sanitize_title(&long);
        assert!(out.len() <= 200);
    }

    #[test]
    fn test_no_change_short() {
        let input = "Short Title";
        let out = sanitize_title(input);
        assert_eq!(out, "Short Title");
    }
}
