use std::process::Command;
use std::fs;
use std::path::PathBuf;

#[tauri::command]
pub fn setup_systemd_service() -> Result<String, String> {
    let output = Command::new("systemctl")
        .args([
            "--user",
            "enable",
            "--now",
            "focusboard-backend",
            "focusboard-monitor",
        ])
        .output()
        .map_err(|e| format!("Failed to run systemctl: {e}"))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
pub fn write_monitor_token(token: String) -> Result<String, String> {
    let home = std::env::var("HOME").map_err(|_| "HOME not set".to_string())?;
    let dir = PathBuf::from(&home).join(".config/focusboard");
    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create dir: {e}"))?;
    let token_path = dir.join("monitor-token");
    fs::write(&token_path, token.trim()).map_err(|e| format!("Failed to write token: {e}"))?;
    Ok(format!("Token written to {}", token_path.display()))
}
