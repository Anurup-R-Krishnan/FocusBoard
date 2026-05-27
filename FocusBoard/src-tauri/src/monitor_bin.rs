use std::sync::{Arc, atomic::{AtomicBool, AtomicU64}};
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

use focusboard_lib::monitor::{run_monitor_loop, ActivityEvent};

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

    let _ = ureq::post(&url)
        .set("Content-Type", "application/json")
        .send_json(&payload);
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
