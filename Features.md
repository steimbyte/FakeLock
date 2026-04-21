# FakeLock - System Lock Screen

A modern, beautiful system lock screen for Windows with customizable animations and multi-monitor support.

## Features

### Core Functionality

- **Lock/Unlock System** - Create overlay windows across all monitors to lock the screen
- **Password Protection** - Unlock with password (default: `unlock`)
- **Multi-Monitor Support** - Automatic detection and overlay creation on all connected displays
- **Keep Awake** - Prevent PC from sleeping while locked
- **Single Instance** - Only one instance allowed

### Visual Design

Inspired by modern Windows apps with a clean, professional aesthetic:

- **DMSans Typography** - Clean, modern sans-serif font family
- **HSL Color System** - Professional color palette with CSS custom properties
- **Dynamic Accent Color** - User-customizable accent that propagates through entire UI
  - 6 preset colors: Amber, Coral, Cyan, Emerald, Violet, Orange
  - Accent affects: buttons, rings, glows, active states, borders
- **Dark Theme Base** - Deep dark backgrounds (7% lightness) with layered surfaces
- **Segmented Controls** - Clean toggle/segment button groups for settings
- **Card-based Sections** - Settings organized in elevated surface cards with subtle borders
- **GPU-Optimized** - Only `transform` and `opacity` animated
- **Micro-interactions** - Smooth 150ms transitions on all interactive elements

### Color System

```
--accent: #e94560 (dynamic)
--accent-h, --accent-s, --accent-l: HSL components for theming
--accent-dim: hsla(accent, 0.15) - subtle fills
--accent-glow: hsla(accent, 0.30) - glow effects

--bg-base: hsl(0, 0%, 7%) - deepest background
--bg-surface: hsl(0, 0%, 10%) - card backgrounds
--bg-elevated: hsl(0, 0%, 14%) - inputs, hover states
--bg-input: hsl(0, 0%, 20%) - form controls

--border-subtle: hsl(0, 0%, 16%)
--border: hsl(0, 0%, 20%)
--border-focus: hsl(0, 0%, 30%)

--text-primary: hsl(0, 0%, 98%)
--text-muted: hsl(0, 0%, 65%)
--text-dim: hsl(0, 0%, 40%)
```

### Animations

12 beautiful, GPU-optimized lock screen animations:

| Animation | Description |
|-----------|-------------|
| **Neon Rings** | Glowing concentric rings spinning |
| **Pulse** | Breathing dots in radial pattern (9 dots) |
| **Bounce** | Classic bouncing balls |
| **Wave** | Smooth wave motion |
| **Orbit** | Orbiting dot with trails |
| **Spinner** | Multi-layer elegant spinner |
| **Run** | Animated running figure |
| **Dance** | Disco ball with bouncing dot |
| **Infinity** | Figure-8 infinity symbol |
| **Geo** | Rotating geometric shapes |
| **Blob** | Organic morphing shape |
| **DNA** | Double helix animation |

### Customization

- **Accent Color** - Choose from 6 preset colors or define custom
- **Lock Message** - Customize the main overlay text
- **Running Animation** - Choose which animation plays when locked
- **Displayed Text** - Customize all user-facing text:
  - Arm/Disarm button text
  - Armed/Standby status labels
  - Password placeholder
  - Unlock hint text

### User Interface

- **Tab Navigation** - Simple/Advanced/Settings tabs in title bar
- **Settings Sections** - Card-based layout with headers
- **Segmented Toggles** - On/Off buttons for boolean settings
- **Color Picker Row** - Circular color swatches with active ring
- **Animation Grid** - 4-column grid with icon + name
- **Live Preview** - Real-time animation preview in settings
- **Resizable Window** - Settings window is resizable (min: 480×600)

### System Integration

- **Desktop Shortcut** - Creates desktop shortcut on install
- **Start Menu** - Available from Windows Start Menu
- **System Tray** - Runs in background
- **Correct Permissions** - Rust backend has proper Tauri capabilities

## Technical Details

### Architecture

- **Backend**: Rust with Tauri 2.x
- **Frontend**: TypeScript + Vite (HTML + CSS)
- **Styling**: CSS with HSL custom properties
- **Typography**: DMSans font family

### Performance

- Only animates `transform` and `opacity` properties
- Hardware-accelerated CSS animations
- Minimal CPU/GPU usage
- Animation duration: 100-350ms for UI interactions
- `will-change` hints on animated elements

### Permissions

Tauri 2.x capabilities configured for:
- Window management (create, position, fullscreen overlay windows)
- System tray integration
- Keyboard input capture for global shortcuts

### File Locations

- **Settings**: `%APPDATA%\FakeLock\settings.json`
- **Logs**: Application logs via `env_logger`
- **Install**: `C:\Program Files\FakeLock\` (MSI)

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+L` | Lock/Unlock |
| `Ctrl+Shift+,` | Open Settings |
| `Enter` | Unlock (on overlay) |

## Password

Default password: `unlock`

To change: Settings → Password → Enter current password → Enter new password → Confirm → Save

## Version

v2.0.0

---

## Developer Reference

### Project Structure

```
FakeLockTS/
├── src/                    # TypeScript frontend
│   ├── main.ts            # App entry, UI rendering, state management
│   ├── styles.css         # All styles
│   └── types.ts           # Type definitions
├── src-tauri/             # Rust backend
│   ├── src/
│   │   ├── lib.rs         # Main Tauri commands (lock/unlock/settings)
│   │   ├── main.rs        # Entry point
│   │   ├── settings.rs    # Settings persistence
│   │   └── monitor.rs     # Monitor detection, sleep control
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri config (window 520x680)
├── dist/                  # Built frontend
├── index.html             # Main window
└── overlay.html          # Lock overlay window
```

### Code Map

| Symbol | Type | Location | Role |
|--------|------|----------|------|
| AppState | Struct | lib.rs | Shared state (locked, settings, overlays) |
| lock_system | Command | lib.rs | Create overlay windows |
| unlock_system | Command | lib.rs | Close overlays, restore sleep |
| get_settings | Command | lib.rs | Load user settings |
| save_settings | Command | lib.rs | Persist settings |
| api | Object | main.ts | Tauri invoke wrapper |
| state | Variable | main.ts | Frontend app state |
| DesignTokens | Const | main.ts | Colors, animations, presets |

### Build Commands

```bash
npm run dev        # Start Vite dev server (port 1420)
npm run build      # Build frontend (tsc && vite build)
npm run tauri      # Tauri CLI
```

### Conventions

- **Rust**: parking_lot::Mutex (not std::sync::Mutex), thiserror for errors, early return pattern
- **TypeScript**: strict mode, noUnusedLocals/Parameters enabled
- **Tauri**: Uses WebviewWindowBuilder for overlays, always_on_top + decorations:false
- **Timing attacks**: Password verification uses subtle::ConstantTimeEq

### Anti-Patterns

- DO NOT use std::sync::Mutex in Tauri state (use parking_lot)
- DO NOT create windows without setting position AFTER creation (tauri bug)
- DO NOT call .unwrap() on mutex locks (use if let or expect with message)

### Unique Implementation Details

- Mock API when not running in Tauri (isTauri check in api object)
- CSS custom properties for accent color theming (--accent, --accent-h, --accent-s, --accent-l)
- Animation previews render inline in settings panel
- Overlay windows use transparent:true + decorations:false for seamless lock screen
- Multi-monitor: creates one overlay per monitor at correct positions
- Sleep prevention via Win32 API when keep_awake enabled
