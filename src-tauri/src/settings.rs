use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

/// Application settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub text_size: u32,
    pub overlay_transparency: u32,
    pub overlay_color: String,
    pub text_color: String,
    pub password: String,
    pub show_running_animation: bool,
    pub lock_message: String,
    pub accent_color: String,
    pub use_all_monitors: bool,
    pub selected_monitors: Vec<String>,
    pub animation_type: String,
    pub keep_awake: bool,
    // Customizable text fields
    pub password_placeholder: String,
    pub unlock_hint: String,
    pub arm_button_text: String,
    pub disarm_button_text: String,
    pub status_armed_text: String,
    pub status_standby_text: String,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            text_size: 48,
            overlay_transparency: 95,
            overlay_color: "#0a0a1a".to_string(),
            text_color: "#FFFFFF".to_string(),
            password: "unlock".to_string(),
            show_running_animation: true,
            lock_message: "System Locked".to_string(),
            accent_color: "#e94560".to_string(),
            use_all_monitors: true,
            selected_monitors: Vec::new(),
            animation_type: "neon-rings".to_string(),
            keep_awake: true,
            // Default customizable text
            password_placeholder: "Enter password...".to_string(),
            unlock_hint: "Press Enter to unlock".to_string(),
            arm_button_text: "ARM".to_string(),
            disarm_button_text: "DISARM".to_string(),
            status_armed_text: "ARMED".to_string(),
            status_standby_text: "STANDBY".to_string(),
        }
    }
}

impl Settings {
    /// Get the settings file path
    fn get_path() -> PathBuf {
        let app_data = std::env::var("APPDATA")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("."));
        let fakelock_dir = app_data.join("FakeLock");
        fs::create_dir_all(&fakelock_dir).ok();
        fakelock_dir.join("settings.json")
    }

    /// Load settings from disk
    pub fn load() -> Self {
        let path = Self::get_path();
        log::info!("Loading settings from: {:?}", path);

        if path.exists() {
            match fs::read_to_string(&path) {
                Ok(content) => {
                    match serde_json::from_str(&content) {
                        Ok(settings) => {
                            log::info!("Settings loaded successfully");
                            return settings;
                        }
                        Err(e) => {
                            log::warn!("Failed to parse settings: {}, using defaults", e);
                        }
                    }
                }
                Err(e) => {
                    log::warn!("Failed to read settings file: {}, using defaults", e);
                }
            }
        } else {
            log::info!("Settings file not found, using defaults");
        }

        let default_settings = Self::default();
        // Save defaults on first run
        if let Err(e) = Self::save(&default_settings) {
            log::error!("Failed to save default settings: {}", e);
        }
        default_settings
    }

    /// Save settings to disk
    pub fn save(&self) -> Result<(), Box<dyn std::error::Error>> {
        let path = Self::get_path();
        let content = serde_json::to_string_pretty(self)?;
        fs::write(path, content)?;
        log::info!("Settings saved successfully");
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_settings() {
        let settings = Settings::default();
        assert_eq!(settings.password, "unlock");
        assert_eq!(settings.text_size, 48);
    }

    #[test]
    fn test_settings_serialization() {
        let settings = Settings::default();
        let json = serde_json::to_string(&settings).unwrap();
        let parsed: Settings = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.password, settings.password);
    }
}
