use chrono::{DateTime, Local};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::process::Command;
use std::thread;
use std::sync::mpsc;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Listener, Manager};
use user_idle::UserIdle;
use regex::Regex;
use std::os::unix::net::UnixStream;
use std::io::{BufRead, BufReader};
use sysinfo::System;
use notify_rust::Notification;
use std::sync::OnceLock;

static EMAIL_RE: OnceLock<Regex> = OnceLock::new();
static IP_RE: OnceLock<Regex> = OnceLock::new();
static PATH_RE: OnceLock<Regex> = OnceLock::new();

fn sanitize_title(input: &str) -> String {
    let mut s = input.to_string();
    
    let email_re = EMAIL_RE.get_or_init(|| Regex::new(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}").unwrap());
    s = email_re.replace_all(&s, "[REDACTED_EMAIL]").to_string();

    let ip_re = IP_RE.get_or_init(|| Regex::new(r"\b(?:\d{1,3}\.){3}\d{1,3}\b").unwrap());
    s = ip_re.replace_all(&s, "[REDACTED_IP]").to_string();

    let path_re = PATH_RE.get_or_init(|| Regex::new(r"(/[^ \n]+|[A-Za-z]:\\\\S+)").unwrap());
    s = path_re.replace_all(&s, "[REDACTED_PATH]").to_string();

    if s.len() > 200 {
        s.truncate(200);
    }
    s
}

fn check_zen_mode_and_kill(app_name: &str) {
    if app_name == "Unknown" || app_name == "Idle" {
        return;
    }
    
    let config_path = match std::env::var("HOME") {
        Ok(home) => format!("{}/.config/focusboard/zen_mode.json", home),
        Err(_) => return,
    };

    if let Ok(config_str) = std::fs::read_to_string(&config_path) {
        if let Ok(config) = serde_json::from_str::<Value>(&config_str) {
            if config["active"].as_bool().unwrap_or(false) {
                if let Some(blocked_apps) = config["blockedApps"].as_array() {
                    for blocked in blocked_apps {
                        if let Some(blocked_str) = blocked.as_str() {
                            if app_name.to_lowercase().contains(&blocked_str.to_lowercase()) {
                                println!("Zen Mode: Killing distracted app '{}'", app_name);
                                let _ = Command::new("killall")
                                    .arg("-9")
                                    .arg(app_name)
                                    .spawn();
                                let _ = Notification::new()
                                    .summary("Zen Mode Enforced")
                                    .body(&format!("Blocked distracting app: {}", app_name))
                                    .icon("dialog-warning")
                                    .show();
                                break;
                            }
                        }
                    }
                }
            }
        }
    }
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

#[derive(Clone, Deserialize, Serialize)]
pub struct ActivityEvent {
    pub app_name: String,
    pub window_title: String,
    pub idle_time: u64,
    pub timestamp: DateTime<Local>,
    pub cpu_usage: Option<f32>,
    pub ram_usage_mb: Option<u64>,
}

fn try_hyprctl_active_window() -> Option<(String, String, u32)> {
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
    let pid = parsed.get("pid").and_then(|v| v.as_u64()).unwrap_or(0) as u32;
    if title.is_empty() && class == "Unknown" {
        None
    } else {
        Some((class, title, pid))
    }
}

fn is_hyprland_session() -> bool {
    std::env::var("XDG_SESSION_DESKTOP")
        .map(|v| v.to_lowercase().contains("hyprland"))
        .unwrap_or_else(|_| {
            std::env::var("XDG_CURRENT_DESKTOP")
                .map(|v| v.to_lowercase().contains("hyprland"))
                .unwrap_or_else(|_| {
                    std::env::var("HYPRLAND_INSTANCE_SIGNATURE").is_ok()
                })
        })
}

fn is_x11_session() -> bool {
    std::env::var("XDG_SESSION_TYPE")
        .map(|v| v.eq_ignore_ascii_case("x11"))
        .unwrap_or(false)
}

pub fn run_monitor_loop<F, B>(
    tracking_enabled: Arc<AtomicBool>,
    idle_threshold: Arc<AtomicU64>,
    on_activity: F,
    is_backgrounded: B,
    shutdown_rx: mpsc::Receiver<()>,
) where
    F: Fn(ActivityEvent) + Send + Sync + 'static,
    B: Fn() -> bool + Send + Sync + 'static,
{
    let mut last_app = String::new();
    let mut last_title = String::new();
    let mut was_idle = false;
    let mut last_emit_time = Instant::now();
    let hyprland_active = is_hyprland_session();
    let env_idle_threshold: u64 = std::env::var("FOCUSBOARD_IDLE_THRESHOLD")
        .ok()
        .and_then(|s| s.parse::<u64>().ok())
        .unwrap_or(30);
    idle_threshold.store(env_idle_threshold, Ordering::SeqCst);
    let allow_x11 = std::env::var("FOCUSBOARD_ALLOW_X11")
        .ok()
        .map(|v| v == "1" || v.eq_ignore_ascii_case("true"))
        .unwrap_or_else(|| is_x11_session());
    let base_poll_secs: u64 = std::env::var("FOCUSBOARD_POLL_SECS")
        .ok()
        .and_then(|s| s.parse::<u64>().ok())
        .unwrap_or(1);
    let max_poll_secs: u64 = std::env::var("FOCUSBOARD_MAX_POLL_SECS")
        .ok()
        .and_then(|s| s.parse::<u64>().ok())
        .unwrap_or(5);
    let background_poll_secs: u64 = std::env::var("FOCUSBOARD_BACKGROUND_POLL_SECS")
        .ok()
        .and_then(|s| s.parse::<u64>().ok())
        .unwrap_or(10);
    let mut poll_secs = base_poll_secs;

    let (wake_tx, wake_rx) = mpsc::channel::<()>();

    if hyprland_active {
        let wake_tx_clone = wake_tx.clone();
        thread::spawn(move || {
            let signature = match std::env::var("HYPRLAND_INSTANCE_SIGNATURE") {
                Ok(s) => s,
                Err(_) => return,
            };
            let runtime_dir = match std::env::var("XDG_RUNTIME_DIR") {
                Ok(s) => s,
                Err(_) => return,
            };
            let socket_path = format!("{}/hypr/{}/.socket2.sock", runtime_dir, signature);
            loop {
                if let Ok(stream) = UnixStream::connect(&socket_path) {
                    let reader = BufReader::new(stream);
                    for line in reader.lines() {
                        let line = match line {
                            Ok(l) => l,
                            Err(_) => break,
                        };
                        if line.starts_with("activewindow>>") {
                            let _ = wake_tx_clone.send(());
                        }
                    }
                }
                thread::sleep(Duration::from_secs(2));
            }
        });
    }

    let mut sys = System::new_all();
    loop {
        if shutdown_rx.try_recv().is_ok() {
            break;
        }

        let tracking_active = tracking_enabled.load(Ordering::SeqCst);
        let mut current_app = "Unknown".to_string();
        let mut current_title = "Unknown".to_string();
        let current_idle_secs = if hyprland_active {
            // user-idle crate uses X11, which segfaults on Wayland
            0
        } else {
            UserIdle::get_time()
                .map(|idle| idle.as_seconds())
                .unwrap_or(0)
        };

        let active_idle_threshold = std::cmp::max(1, idle_threshold.load(Ordering::SeqCst));
        if !tracking_active {
            let is_idle = current_idle_secs >= active_idle_threshold;
            if was_idle != is_idle {
                was_idle = is_idle;
            }
            thread::sleep(Duration::from_secs(background_poll_secs));
            continue;
        }

        let mut active_pid: Option<u32> = None;

        // Prefer Hyprland (Wayland) when available to avoid X11/Xlib instability.
        if hyprland_active {
            if let Some((app, title, pid)) = try_hyprctl_active_window() {
                current_app = app;
                current_title = title;
                active_pid = Some(pid);
            }
        }

        if current_app == "Unknown" && allow_x11 {
            if let Ok(window) = active_win_pos_rs::get_active_window() {
                current_app = window.app_name;
                current_title = window.title;
            }
        }
        
        let mut cpu_usage = None;
        let mut ram_usage_mb = None;

        if let Some(pid) = active_pid {
            sys.refresh_all();
            if let Some(process) = sys.process(sysinfo::Pid::from_u32(pid)) {
                cpu_usage = Some(process.cpu_usage());
                ram_usage_mb = Some(process.memory() / 1024 / 1024);
            }
        }

        // Active enforcement of Zen Mode blocklist
        check_zen_mode_and_kill(&current_app);

        let is_idle = current_idle_secs >= active_idle_threshold;

        let window_changed = current_app != last_app || current_title != last_title;
        let idle_status_changed = is_idle != was_idle;

        if window_changed || idle_status_changed {
            let now = Instant::now();
            let time_since_last_emit = now.duration_since(last_emit_time).as_millis();
            
            // Debounce rapid title changes within the same app (1000ms threshold)
            if window_changed && !idle_status_changed && current_app == last_app && time_since_last_emit < 1000 {
                // Wait for next poll or immediate wake from IPC
                let _ = wake_rx.recv_timeout(Duration::from_millis(100));
                continue;
            }

            last_app = current_app.clone();
            last_title = current_title.clone();
            was_idle = is_idle;
            last_emit_time = now;

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
                cpu_usage,
                ram_usage_mb,
            };

            on_activity(event.clone());

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

        if is_backgrounded() {
            poll_secs = background_poll_secs;
        }

        // Wait for next poll or immediate wake from IPC
        let _ = wake_rx.recv_timeout(Duration::from_secs(poll_secs));
    }
}

pub fn start_monitor(app: AppHandle, tracking_enabled: Arc<AtomicBool>, idle_threshold: Arc<AtomicU64>) {
    let app_handle = app.clone();
    let (shutdown_tx, shutdown_rx) = mpsc::channel::<()>();
    let monitor_handle: Arc<Mutex<Option<thread::JoinHandle<()>>>> = Arc::new(Mutex::new(None));

    let monitor_thread = thread::spawn(move || {
        let emit_handle = app_handle.clone();
        let on_activity = move |event: ActivityEvent| {
            if let Err(err) = emit_handle.emit("activity-update", &event) {
                log_json("error", "emit_failed", json!({ "error": format!("{:?}", err) }));
            }
        };
        let is_backgrounded = move || {
            app_handle
                .get_webview_window("main")
                .and_then(|window| window.is_visible().ok().map(|visible| !visible))
                .unwrap_or(false)
                || app_handle
                    .get_webview_window("main")
                    .and_then(|window| window.is_minimized().ok())
                    .unwrap_or(false)
        };

        run_monitor_loop(tracking_enabled, idle_threshold, on_activity, is_backgrounded, shutdown_rx);
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
