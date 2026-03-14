// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod monitor;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_cli::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let disable_monitor = std::env::var("FOCUSBOARD_DISABLE_MONITOR")
                .ok()
                .map(|v| v == "1" || v.eq_ignore_ascii_case("true"))
                .unwrap_or(false);
            if !disable_monitor {
                monitor::start_monitor(app.handle().clone());
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler!());

    match builder.run(tauri::generate_context!()) {
        Ok(_) => (),
        Err(e) => {
            eprintln!("Tauri application failed to run: {:?}", e);
            // Consider showing a user-friendly dialog or attempting recovery here.
        }
    }
}
