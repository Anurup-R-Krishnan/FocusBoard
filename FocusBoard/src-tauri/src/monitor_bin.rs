use std::sync::{Arc, atomic::{AtomicBool, AtomicU64}};
use std::sync::mpsc;
use std::thread;
use std::time::Duration;
use std::fs;
use std::path::PathBuf;

use focusboard_lib::monitor::{run_monitor_loop, ActivityEvent};

fn load_token() -> Option<String> {
    let token_file = std::env::var("FOCUSBOARD_TOKEN_FILE").ok()
        .map(PathBuf::from)
        .or_else(|| {
            let home = std::env::var("HOME").ok()?;
            Some(PathBuf::from(home).join(".config/focusboard/monitor-token"))
        })?;
    if token_file.exists() {
        fs::read_to_string(&token_file).ok().map(|s| s.trim().to_string())
    } else {
        None
    }
}

fn post_activity(event: ActivityEvent) {
    let backend_url = std::env::var("FOCUSBOARD_BACKEND_URL")
        .unwrap_or_else(|_| "http://localhost:5000".to_string());
    let url = format!("{}/api/activities", backend_url.trim_end_matches('/'));

    let payload = serde_json::json!({
        "app_name": event.app_name,
        "window_title": event.window_title,
        "start_time": event.timestamp.to_rfc3339(),
        "end_time": (event.timestamp + chrono::Duration::seconds(1)).to_rfc3339(),
        "idle": event.idle_time >= 30,
    });

    let mut req = ureq::post(&url)
        .set("Content-Type", "application/json");
    if let Some(ref token) = load_token() {
        req = req.set("Authorization", &format!("Bearer {}", token));
    }
    let _ = req.send_json(&payload);
}

fn main() {
    let tracking_enabled = Arc::new(AtomicBool::new(true));
    let idle_threshold = Arc::new(AtomicU64::new(30));

    let (shutdown_tx, shutdown_rx) = mpsc::channel::<()>();

    let handle = thread::spawn(move || {
        run_monitor_loop(
            tracking_enabled,
            idle_threshold,
            post_activity,
            || false,
            shutdown_rx,
        );
    });

    let shutdown_signal = shutdown_tx.clone();
    ctrlc::set_handler(move || {
        let _ = shutdown_signal.send(());
    }).expect("Failed to set Ctrl-C handler");

    // Keep the main thread alive while the monitor thread runs
    loop {
        if handle.is_finished() {
            break;
        }
        thread::sleep(Duration::from_secs(1));
    }
}
