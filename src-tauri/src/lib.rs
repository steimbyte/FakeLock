// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod monitor;
pub mod settings;

use std::sync::Mutex;
use parking_lot::Mutex as ParkingMutex;
use tauri::{Manager, State, WebviewUrl, WebviewWindowBuilder};

/// Application state shared across all commands
pub struct AppState {
    /// Whether the system is currently locked
    pub is_locked: ParkingMutex<bool>,
    /// User settings
    pub settings: Mutex<settings::Settings>,
    /// Handles to overlay windows
    pub overlay_handles: Mutex<Vec<String>>,
    /// Whether sleep was prevented (for cleanup on unlock)
    pub sleep_prevented: ParkingMutex<bool>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            is_locked: ParkingMutex::new(false),
            settings: Mutex::new(settings::Settings::load()),
            overlay_handles: Mutex::new(Vec::new()),
            sleep_prevented: ParkingMutex::new(false),
        }
    }
}

/// Custom error type for Tauri commands
#[derive(Debug, thiserror::Error)]
pub enum CommandError {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Settings error: {0}")]
    Settings(String),
    #[error("Window error: {0}")]
    Window(String),
}

impl serde::Serialize for CommandError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

type CommandResult<T> = Result<T, CommandError>;

/// Get current settings
#[tauri::command]
fn get_settings(state: State<AppState>) -> settings::Settings {
    state.settings.lock().unwrap().clone()
}

/// Save new settings
#[tauri::command]
fn save_settings(
    state: State<AppState>,
    new_settings: settings::Settings,
) -> CommandResult<()> {
    let mut settings = state.settings.lock().unwrap();
    *settings = new_settings;
    settings::Settings::save(&settings).map_err(|e| CommandError::Settings(e.to_string()))?;
    Ok(())
}

/// Verify password - uses constant-time comparison to prevent timing attacks
#[tauri::command]
fn verify_password(state: State<AppState>, password: String) -> bool {
    use subtle::ConstantTimeEq;
    let settings = state.settings.lock().unwrap();
    bool::from(settings.password.as_bytes().ct_eq(password.as_bytes()))
}

/// Lock the system by creating overlay windows on all monitors
#[tauri::command]
async fn lock_system(
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> CommandResult<()> {
    // Check if already locked - use early return pattern
    {
        let mut is_locked = state.is_locked.lock();
        if *is_locked {
            log::info!("Already locked, skipping");
            return Ok(());
        }
        *is_locked = true;
    }

    // Get monitors and settings
    let monitors = monitor::get_all_monitors();
    if monitors.is_empty() {
        log::warn!("No monitors detected, creating single overlay");
    }

    let settings = state.settings.lock().unwrap().clone();

    // Keep PC awake if setting is enabled
    {
        let mut sleep_prevented = state.sleep_prevented.lock();
        if settings.keep_awake {
            monitor::prevent_sleep();
            *sleep_prevented = true;
            log::info!("PC sleep prevented");
        } else {
            *sleep_prevented = false;
        }
    }

    // Create overlay windows
    let mut handles = state.overlay_handles.lock().unwrap();
    let mut success_count = 0;

    for (i, monitor) in monitors.iter().enumerate() {
        let label = format!("overlay_{}", i);
        let show_anim = if settings.show_running_animation { "true" } else { "false" };
        let overlay_url = format!(
            "overlay.html?accent={}&text={}&size={}&bg={}&msg={}&anim={}&showAnim={}&placeholder={}&hint={}",
            urlencoding::encode(&settings.accent_color),
            urlencoding::encode(&settings.text_color),
            settings.text_size,
            urlencoding::encode(&settings.overlay_color),
            urlencoding::encode(&settings.lock_message),
            urlencoding::encode(&settings.animation_type),
            show_anim,
            urlencoding::encode(&settings.password_placeholder),
            urlencoding::encode(&settings.unlock_hint)
        );

        let build_result = WebviewWindowBuilder::new(
            &app,
            &label,
            WebviewUrl::App(overlay_url.into()),
        )
        .title("FakeLock")
        .inner_size(monitor.width as f64, monitor.height as f64)
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .skip_taskbar(true)
        .resizable(false)
        .closable(false)
        .focused(false)
        .build();

        match build_result {
            Ok(w) => {
                // Set position after creation for reliability
                let pos_result = w.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
                    x: monitor.x,
                    y: monitor.y,
                }));
                if let Err(e) = pos_result {
                    log::error!("Failed to set position for {}: {}", label, e);
                }

                // Ensure window covers full monitor area
                let size_result = w.set_size(tauri::Size::Physical(tauri::PhysicalSize {
                    width: monitor.width as u32,
                    height: monitor.height as u32,
                }));
                if let Err(e) = size_result {
                    log::error!("Failed to set size for {}: {}", label, e);
                }

                // Request focus - best effort
                let _ = w.set_focus();
                handles.push(label.clone());
                success_count += 1;
                log::debug!("Created overlay {} at ({}, {}) size {}x{}", label, monitor.x, monitor.y, monitor.width, monitor.height);
            }
            Err(e) => {
                log::error!("Failed to create overlay {}: {}", label, e);
            }
        }
    }

    log::info!("Lock system: created {}/{} overlays", success_count, monitors.len());
    Ok(())
}

/// Unlock the system by closing all overlay windows
#[tauri::command]
async fn unlock_system(
    state: State<'_, AppState>,
    app: tauri::AppHandle,
) -> CommandResult<()> {
    // Check if not locked - early return pattern
    {
        let mut is_locked = state.is_locked.lock();
        if !*is_locked {
            log::info!("Not locked, skipping unlock");
            return Ok(());
        }
        *is_locked = false;
    }

    // Close all overlay windows - drain handles first to avoid deadlock
    let handles: Vec<String> = state.overlay_handles.lock().unwrap().drain(..).collect();
    let mut closed_count = 0;

    for label in handles {
        if let Some(window) = app.get_webview_window(&label) {
            match window.close() {
                Ok(_) => {
                    closed_count += 1;
                    log::debug!("Closed overlay {}", label);
                }
                Err(e) => {
                    log::error!("Failed to close window {}: {}", label, e);
                }
            }
        } else {
            log::warn!("Window {} not found", label);
        }
    }

    // Re-enable sleep only if we prevented it
    {
        let mut sleep_prevented = state.sleep_prevented.lock();
        if *sleep_prevented {
            monitor::allow_sleep();
            *sleep_prevented = false;
            log::info!("PC sleep restored");
        }
    }

    log::info!("Unlock system: closed {}/{} overlays", closed_count, closed_count);
    Ok(())
}

/// Check if system is locked
#[tauri::command]
fn is_locked(state: State<AppState>) -> bool {
    *state.is_locked.lock()
}

/// Get list of monitors
#[tauri::command]
fn get_monitors() -> Vec<monitor::MonitorInfo> {
    monitor::get_all_monitors()
}

/// Close the main window (exit app)
#[tauri::command]
fn close_window(app: tauri::AppHandle) -> CommandResult<()> {
    if let Some(window) = app.get_webview_window("main") {
        window.close().map_err(|e| CommandError::Window(e.to_string()))?;
    } else {
        // Exit the app if no main window found
        app.exit(0);
    }
    Ok(())
}

/// Main entry point
pub fn run() {
    // Initialize logger
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            get_settings,
            save_settings,
            verify_password,
            lock_system,
            unlock_system,
            is_locked,
            get_monitors,
            close_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}