// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod monitor;

use std::sync::{Arc, atomic::{AtomicBool, Ordering}};
use std::sync::atomic::AtomicU64;
use tauri::Manager;

#[derive(Clone)]
struct TrackingState(Arc<AtomicBool>);

#[derive(Clone)]
struct IdleThreshold(Arc<AtomicU64>);

#[tauri::command]
fn set_tracking_enabled(state: tauri::State<TrackingState>, enabled: bool) {
    state.0.store(enabled, Ordering::SeqCst);
}

#[tauri::command]
fn set_idle_threshold(state: tauri::State<IdleThreshold>, seconds: u64) {
    state.0.store(seconds, Ordering::SeqCst);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let tracking_state = TrackingState(Arc::new(AtomicBool::new(true)));
    let idle_threshold = IdleThreshold(Arc::new(AtomicU64::new(30)));
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_cli::init())
        .plugin(tauri_plugin_opener::init())
        .manage(tracking_state.clone())
        .manage(idle_threshold.clone())
        .setup(|app| {
            let disable_monitor = std::env::var("FOCUSBOARD_DISABLE_MONITOR")
                .ok()
                .map(|v| v == "1" || v.eq_ignore_ascii_case("true"))
                .unwrap_or(false);
            if !disable_monitor {
                let state = app.state::<TrackingState>().0.clone();
                let idle_state = app.state::<IdleThreshold>().0.clone();
                monitor::start_monitor(app.handle().clone(), state, idle_state);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![set_tracking_enabled, set_idle_threshold]);

    match builder.run(tauri::generate_context!()) {
        Ok(_) => (),
        Err(e) => {
            eprintln!("Tauri application failed to run: {:?}", e);
            // Consider showing a user-friendly dialog or attempting recovery here.
        }
    }
}
