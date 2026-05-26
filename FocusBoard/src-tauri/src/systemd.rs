use std::process::Command;

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
