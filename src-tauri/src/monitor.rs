use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitorInfo {
    pub name: String,
    pub width: i32,
    pub height: i32,
    pub x: i32,
    pub y: i32,
    pub is_primary: bool,
}

#[cfg(windows)]
pub fn prevent_sleep() {
    // Use Windows API to prevent sleep
    // SetThreadExecutionState(ES_CONTINUOUS | ES_SYSTEM_REQUIRED)
    unsafe {
        windows::Win32::System::Power::SetThreadExecutionState(
            windows::Win32::System::Power::ES_CONTINUOUS |
            windows::Win32::System::Power::ES_SYSTEM_REQUIRED
        );
    }
}

#[cfg(windows)]
pub fn allow_sleep() {
    // Clear the execution state
    unsafe {
        windows::Win32::System::Power::SetThreadExecutionState(
            windows::Win32::System::Power::ES_CONTINUOUS
        );
    }
}

#[cfg(not(windows))]
pub fn prevent_sleep() {
    log::warn!("prevent_sleep not implemented for this platform");
}

#[cfg(not(windows))]
pub fn allow_sleep() {
    log::warn!("allow_sleep not implemented for this platform");
}

#[cfg(windows)]
pub fn get_all_monitors() -> Vec<MonitorInfo> {
    use windows::Win32::Foundation::{LPARAM, RECT};
    use windows::Win32::Graphics::Gdi::{MONITORINFOEXW, EnumDisplayMonitors, GetMonitorInfoW, HMONITOR};
    use windows::core::BOOL;
    use std::mem::size_of;

    let mut monitors: Vec<MonitorInfo> = Vec::new();

    unsafe extern "system" fn enum_callback(
        hmonitor: HMONITOR,
        _hdc: windows::Win32::Graphics::Gdi::HDC,
        _rc: *mut RECT,
        lparam: LPARAM,
    ) -> BOOL {
        let monitors = &mut *(lparam.0 as *mut Vec<MonitorInfo>);

        let mut info = MONITORINFOEXW::default();
        info.monitorInfo.cbSize = size_of::<MONITORINFOEXW>() as u32;

        if GetMonitorInfoW(hmonitor, &mut info as *mut _ as *mut _).as_bool() {
            let name = String::from_utf16_lossy(&info.szDevice);
            let is_primary = (info.monitorInfo.dwFlags & 1) != 0;

            monitors.push(MonitorInfo {
                name,
                width: info.monitorInfo.rcMonitor.right - info.monitorInfo.rcMonitor.left,
                height: info.monitorInfo.rcMonitor.bottom - info.monitorInfo.rcMonitor.top,
                x: info.monitorInfo.rcMonitor.left,
                y: info.monitorInfo.rcMonitor.top,
                is_primary,
            });
        }

        BOOL(1)
    }

    unsafe {
        let monitors_ptr = &mut monitors as *mut Vec<MonitorInfo>;
        let _ = EnumDisplayMonitors(
            None,
            None,
            Some(enum_callback),
            LPARAM(monitors_ptr as isize),
        );
    }

    monitors
}

#[cfg(not(windows))]
pub fn get_all_monitors() -> Vec<MonitorInfo> {
    vec![MonitorInfo {
        name: "Primary".to_string(),
        width: 1920,
        height: 1080,
        x: 0,
        y: 0,
        is_primary: true,
    }]
}