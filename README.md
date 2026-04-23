[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/steimerbyte)

> ⭐ If you find this useful, consider [supporting me on Ko-fi](https://ko-fi.com/steimerbyte)!

<img src="https://storage.ko-fi.com/cdn/generated/fhfuc7slzawvi/2026-04-23_rest-162bec27f642a562eb8401eb0ceb3940-onjpojl8.jpg?w=250" alt="steimerbyte" style="border-radius: 5%; margin: 16px 0; max-width: 100%;"/>

# FakeLock

A modern desktop privacy screen application with multi-monitor support and customizable overlays. Built with Tauri 2.x and TypeScript.

![FakeLock](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Windows-blue.svg)

## Features

### 🎨 Modern Glass UI
- Glassmorphism design inspired by BlurAutoClicker
- Dynamic accent color theming with HSL color system
- Tab-based navigation (Home / Settings)
- Card-based settings layout with segmented controls

### 🖥️ Multi-Monitor Support
- Fullscreen overlay windows on all connected monitors
- Automatic monitor detection and positioning
- Option to lock all monitors or select specific ones

### 🔐 Security
- Password-protected lock/unlock (default: `unlock`)
- Constant-time password comparison to prevent timing attacks
- Always-on-top overlay windows

### ⚡ Functionality
- Keep system awake while locked
- 12 animation types with live preview
- Fully customizable text fields:
  - Lock message
  - Arm/Disarm button text
  - Status text (Armed/Standby)
  - Password placeholder
  - Unlock hint

### ⌨️ Keyboard Shortcuts
- `Ctrl+Shift+L` - Lock/Unlock system
- `Ctrl+Shift+,` - Open Settings
- `Escape` - Return to Home from Settings

## Installation

### Pre-built Executable
Download the latest release from the [Releases](https://github.com/alephtex/FakeLock/releases) page:
- `fakelock-ts.exe` - Portable executable (just run it, no installation needed)

### Build from Source

#### Prerequisites
- Node.js 18+
- Rust 1.70+
- npm or pnpm

#### Steps

```bash
# Clone the repository
git clone https://github.com/alephtex/FakeLock.git
cd FakeLock

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## Usage

1. **Launch FakeLock** - The main window opens showing the Home tab
2. **ARM** - Click the ARM button or press `Ctrl+Shift+L` to lock
3. **Unlock** - Enter password `unlock` on any overlay to unlock
4. **Customize** - Go to Settings to change colors, animations, and text

## Configuration

Settings are stored in `%APPDATA%\FakeLock\settings.json`

### Default Settings

```json
{
  "text_size": 48,
  "overlay_transparency": 95,
  "overlay_color": "#0a0a1a",
  "text_color": "#FFFFFF",
  "password": "unlock",
  "show_running_animation": true,
  "lock_message": "System Locked",
  "accent_color": "#e94560",
  "use_all_monitors": true,
  "selected_monitors": [],
  "animation_type": "neon-rings",
  "keep_awake": true,
  "password_placeholder": "Enter password...",
  "unlock_hint": "Press Enter to unlock",
  "arm_button_text": "ARM",
  "disarm_button_text": "DISARM",
  "status_armed_text": "ARMED",
  "status_standby_text": "STANDBY"
}
```

## Animation Types

| Name | Icon | Description |
|------|------|-------------|
| Neon | ◎ | Spinning neon rings |
| Pulse | ● | Breathing pulse dots (9 dots) |
| Bounce | ⬤ | Bouncing dots |
| Wave | 〰 | Wave motion dots |
| Orbit | ⊛ | Orbiting dot with trail |
| Spin | ◐ | Elegant spinner |
| Run | 🏃 | Running figure |
| Dance | 💃 | Disco ball animation |
| Inf | ∞ | Infinity path |
| Geo | ⬡ | Geometric shapes |
| Blob | ◉ | Morphing blob |
| DNA | ⚛ | DNA strand |

## Accent Colors

Choose from 6 preset accent colors:
- Amber `#f59e0b`
- Coral `#e94560`
- Cyan `#00d4ff`
- Emerald `#22c55e`
- Violet `#a855f7`
- Orange `#f97316`

## Tech Stack

- **Frontend**: TypeScript, Vite, HTML/CSS
- **Backend**: Rust, Tauri 2.x
- **UI Design**: Glassmorphism with HSL theming

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+L` | Toggle Lock/Unlock |
| `Ctrl+Shift+,` | Open Settings |
| `Escape` | Return to Home |

## License

MIT License - See [LICENSE](LICENSE) for details.

## Credits

Design inspired by [BlurAutoClicker](https://github.com/riven314/BlurAutoClicker)
