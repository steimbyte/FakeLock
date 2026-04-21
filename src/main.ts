/**
 * FakeLock - Main Application (TypeScript)
 * Inspired by BlurAutoClicker design system
 */

import type { HexColor } from "./types";
import "./styles.css";
import { invoke } from "@tauri-apps/api/core";

// =============================================================================
// TYPES
// =============================================================================

interface Settings {
    readonly text_size: number;
    readonly overlay_transparency: number;
    readonly overlay_color: HexColor;
    readonly text_color: HexColor;
    readonly password: string;
    readonly show_running_animation: boolean;
    readonly lock_message: string;
    readonly accent_color: HexColor;
    readonly use_all_monitors: boolean;
    readonly selected_monitors: readonly string[];
    readonly animation_type: string;
    readonly keep_awake: boolean;
    readonly password_placeholder: string;
    readonly unlock_hint: string;
    readonly arm_button_text: string;
    readonly disarm_button_text: string;
    readonly status_armed_text: string;
    readonly status_standby_text: string;
}

interface MonitorInfo {
    readonly name: string;
    readonly width: number;
    readonly height: number;
    readonly x: number;
    readonly y: number;
    readonly is_primary: boolean;
}

type Tab = "home" | "settings";

interface AppState {
    settings: Settings | null;
    isLocked: boolean;
    monitors: readonly MonitorInfo[];
    currentTab: Tab;
}

// =============================================================================
// DESIGN TOKENS (from CSS)
// =============================================================================

const DesignTokens = {
    accents: [
        { name: "Amber", color: "#f59e0b" },
        { name: "Coral", color: "#e94560" },
        { name: "Cyan", color: "#00d4ff" },
        { name: "Emerald", color: "#22c55e" },
        { name: "Violet", color: "#a855f7" },
        { name: "Orange", color: "#f97316" },
    ],
    presets: [
        { name: "Charcoal", overlay: "#1a1a1a", opacity: 95 },
        { name: "Midnight", overlay: "#0f0f14", opacity: 92 },
        { name: "Deep Navy", overlay: "#0a0f1a", opacity: 94 },
        { name: "Forest", overlay: "#0a120f", opacity: 92 },
    ],
    animations: {
        neonRings: { id: "neon-rings", name: "Neon", icon: "◎" },
        pulseDots: { id: "pulse-dots", name: "Pulse", icon: "●" },
        bounceDots: { id: "bounce-dots", name: "Bounce", icon: "⬤" },
        waveDots: { id: "wave-dots", name: "Wave", icon: "〰" },
        orbit: { id: "orbit", name: "Orbit", icon: "⊛" },
        spinner: { id: "spinner", name: "Spin", icon: "◐" },
        running: { id: "running", name: "Run", icon: "🏃" },
        dance: { id: "dance", name: "Dance", icon: "💃" },
        infinity: { id: "infinity", name: "Inf", icon: "∞" },
        geo: { id: "geo", name: "Geo", icon: "⬡" },
        blob: { id: "blob", name: "Blob", icon: "◉" },
        dna: { id: "dna", name: "DNA", icon: "⚛" },
    },
} as const;

// =============================================================================
// STATE
// =============================================================================

let state: AppState = {
    settings: null,
    isLocked: false,
    monitors: [],
    currentTab: "home",
};

// =============================================================================
// API
// =============================================================================

const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

const mockSettings: Settings = {
    text_size: 48,
    overlay_transparency: 95,
    overlay_color: "#0a0a1a",
    text_color: "#FFFFFF",
    password: "unlock",
    show_running_animation: true,
    lock_message: "System Locked",
    accent_color: "#e94560",
    use_all_monitors: true,
    selected_monitors: [],
    animation_type: "neon-rings",
    keep_awake: true,
    password_placeholder: "Enter password...",
    unlock_hint: "Press Enter to unlock",
    arm_button_text: "ARM",
    disarm_button_text: "DISARM",
    status_armed_text: "ARMED",
    status_standby_text: "STANDBY",
};

const mockMonitors: MonitorInfo[] = [
    { name: "Primary", width: 1920, height: 1080, x: 0, y: 0, is_primary: true },
];

const api = {
    async getSettings(): Promise<Settings> {
        if (!isTauri) return mockSettings;
        return invoke<Settings>("get_settings");
    },
    async saveSettings(newSettings: Settings): Promise<void> {
        if (!isTauri) { console.log("Mock save:", newSettings); return; }
        return invoke("save_settings", { newSettings });
    },
    async lockSystem(): Promise<void> {
        if (!isTauri) { console.log("Mock lock"); return; }
        return invoke("lock_system");
    },
    async unlockSystem(): Promise<void> {
        if (!isTauri) { console.log("Mock unlock"); return; }
        return invoke("unlock_system");
    },
    async getMonitors(): Promise<MonitorInfo[]> {
        if (!isTauri) return mockMonitors;
        return invoke<MonitorInfo[]>("get_monitors");
    },
    async isLocked(): Promise<boolean> {
        if (!isTauri) return false;
        return invoke<boolean>("is_locked");
    },
};

// =============================================================================
// UTILITIES
// =============================================================================

const queryElement = <T extends Element>(selector: string): T | null => {
    return document.querySelector<T>(selector);
};

const getElementById = <T extends HTMLElement>(id: string): T | null => {
    return document.getElementById(id) as T | null;
};

const escapeHtml = (str: string): string => {
    const htmlEntities: Record<string, string> = {
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    };
    return str.replace(/[&<>"']/g, (char) => htmlEntities[char] ?? char);
};

const applyAccentColor = (color: string): void => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    document.documentElement.style.setProperty("--accent", color);
    document.documentElement.style.setProperty("--accent-h", String(Math.round(h * 360)));
    document.documentElement.style.setProperty("--accent-s", String(Math.round(s * 100)));
    document.documentElement.style.setProperty("--accent-l", String(Math.round(l * 100)));
    document.documentElement.style.setProperty("--accent-dim", `hsla(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%, 0.15)`);
    document.documentElement.style.setProperty("--accent-glow", `hsla(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%, 0.3)`);
};

// =============================================================================
// RENDER
// =============================================================================

const renderApp = (): void => {
    const app = queryElement<HTMLDivElement>("#app");
    if (!app) return;

    const s = state.settings;
    const accent = s?.accent_color ?? "#e94560";

    app.innerHTML = `
        <div class="app-root">
            ${renderTitleBar(accent)}
            <main class="panel-area">
                ${state.currentTab === "home" ? renderHomeView(accent) : renderSettingsView(accent)}
            </main>
        </div>
    `;

    attachEventListeners();
};

const renderTitleBar = (_accent: string): string => `
    <header class="title-bar">
        <div class="title-bar-left">
            <div class="brand">
                <span class="brand-mark">■</span>
                <span>FAKELOCK</span>
            </div>
        </div>
        <div class="title-bar-center">
            <nav class="tab-nav">
                <button class="tab-btn ${state.currentTab === "home" ? "active" : ""}" data-tab="home">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                        <polyline points="9,22 9,12 15,12 15,22"/>
                    </svg>
                    Home
                </button>
                <button class="tab-btn ${state.currentTab === "settings" ? "active" : ""}" data-tab="settings">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    Settings
                </button>
            </nav>
        </div>
        <div class="title-bar-right">
            <button class="win-btn close" id="closeBtn" title="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
    </header>
`;

const renderHomeView = (accent: string): string => {
    const s = state.settings;
    const isLocked = state.isLocked;
    const statusClass = isLocked ? "armed" : "standby";
    const armText = s?.arm_button_text ?? "ARM";
    const disarmText = s?.disarm_button_text ?? "DISARM";
    const armedText = s?.status_armed_text ?? "ARMED";
    const standbyText = s?.status_standby_text ?? "STANDBY";

    return `
        <div class="status-panel">
            <div class="status-indicator">
                <div class="status-ring" style="border-color: ${accent}"></div>
                <div class="status-ring" style="border-color: ${accent}"></div>
                <div class="status-core ${isLocked ? "armed" : ""}" style="${!isLocked ? `background: ${accent}; box-shadow: 0 0 20px var(--accent-glow);` : ""}"></div>
            </div>
            <div class="status-text">
                <div class="status-label ${statusClass}">${isLocked ? armedText : standbyText}</div>
                <div class="status-message">${s?.lock_message ?? "System Locked"}</div>
            </div>
            <button class="action-btn ${isLocked ? "armed" : ""}" id="lockBtn" style="--accent: ${accent}">
                <span class="action-icon">${isLocked ? "◉" : "○"}</span>
                <span>${isLocked ? disarmText : armText}</span>
            </button>
        </div>
        <div class="info-grid">
            <div class="info-card">
                <span class="info-label">Monitors</span>
                <span class="info-value">${state.monitors.length}</span>
            </div>
            <div class="info-card">
                <span class="info-label">Primary</span>
                <span class="info-value">${state.monitors.filter((m) => m.is_primary).length}</span>
            </div>
            <div class="info-card">
                <span class="info-label">Animation</span>
                <span class="info-value">${s?.show_running_animation ? "ON" : "OFF"}</span>
            </div>
            <div class="info-card">
                <span class="info-label">Keep Awake</span>
                <span class="info-value">${s?.keep_awake ? "ON" : "OFF"}</span>
            </div>
        </div>
        <div class="shortcuts-block">
            <div class="shortcuts-label">Keyboard Shortcuts</div>
            <div class="shortcut-row">
                <span class="shortcut-cmd">Lock / Unlock</span>
                <kbd class="shortcut-key">Ctrl+Shift+L</kbd>
            </div>
            <div class="shortcut-row">
                <span class="shortcut-cmd">Settings</span>
                <kbd class="shortcut-key">Ctrl+Shift+,</kbd>
            </div>
        </div>
    `;
};

const renderSettingsView = (accent: string): string => {
    const s = state.settings;
    if (!s) return '<div class="status-message">Loading...</div>';

    return `
        <div class="settings-panel">
            <section class="settings-section">
                <div class="settings-header">
                    <span class="settings-title">
                        <span class="settings-title-icon">🔐</span>
                        Password
                    </span>
                </div>
                <div class="settings-body">
                    <div class="password-change">
                        <input type="password" class="text-input" id="currentPassword" placeholder="Current password">
                        <input type="password" class="text-input" id="newPassword" placeholder="New password">
                        <input type="password" class="text-input" id="confirmPassword" placeholder="Confirm new password">
                        <span class="password-hint">Leave blank to keep current</span>
                    </div>
                </div>
            </section>

            <section class="settings-section">
                <div class="settings-header">
                    <span class="settings-title">
                        <span class="settings-title-icon">📝</span>
                        Custom Text
                    </span>
                </div>
                <div class="settings-body">
                    <div class="text-customization">
                        <input type="text" class="text-input" id="lockMessage" value="${escapeHtml(s.lock_message)}" placeholder="Lock message">
                        <input type="text" class="text-input" id="armButtonText" value="${escapeHtml(s.arm_button_text)}" placeholder="Arm button text">
                        <input type="text" class="text-input" id="disarmButtonText" value="${escapeHtml(s.disarm_button_text)}" placeholder="Disarm button text">
                        <input type="text" class="text-input" id="statusArmedText" value="${escapeHtml(s.status_armed_text)}" placeholder="Armed status text">
                        <input type="text" class="text-input" id="statusStandbyText" value="${escapeHtml(s.status_standby_text)}" placeholder="Standby status text">
                    </div>
                </div>
            </section>

            <section class="settings-section">
                <div class="settings-header">
                    <span class="settings-title">
                        <span class="settings-title-icon">🎨</span>
                        Appearance
                    </span>
                </div>
                <div class="settings-body">
                    <div class="settings-row">
                        <div class="settings-row-group">
                            <span class="settings-label">Accent Color</span>
                        </div>
                        <div class="color-row">
                            ${DesignTokens.accents.map(({ name, color }) => `
                                <button class="color-btn ${s.accent_color === color ? "active" : ""}" style="--c: ${color}" data-color="${color}" title="${name}"></button>
                            `).join("")}
                        </div>
                    </div>
                    <div class="settings-divider"></div>
                    <div class="settings-row">
                        <div class="settings-row-group">
                            <span class="settings-label">Animation</span>
                        </div>
                    </div>
                    <div class="anim-grid">
                        ${Object.values(DesignTokens.animations).map((anim) => `
                            <button class="anim-btn ${s.animation_type === anim.id ? "active" : ""}" data-animation="${anim.id}">
                                <span class="anim-icon">${anim.icon}</span>
                                <span class="anim-name">${anim.name}</span>
                            </button>
                        `).join("")}
                    </div>
                    <div class="anim-preview">
                        <div class="preview-container" id="animPreviewContainer">
                            ${getAnimationPreviewHTML(s.animation_type, accent)}
                        </div>
                    </div>
                </div>
            </section>

            <section class="settings-section">
                <div class="settings-header">
                    <span class="settings-title">
                        <span class="settings-title-icon">⚙</span>
                        Options
                    </span>
                </div>
                <div class="settings-body">
                    <div class="settings-row">
                        <div class="settings-row-group">
                            <span class="settings-label">Show Running Animation</span>
                        </div>
                        <div class="seg-group">
                            <button class="seg-btn ${s.show_running_animation ? "active" : ""}" data-bool="showAnimation" data-value="true">On</button>
                            <button class="seg-btn ${!s.show_running_animation ? "active" : ""}" data-bool="showAnimation" data-value="false">Off</button>
                        </div>
                    </div>
                    <div class="settings-row">
                        <div class="settings-row-group">
                            <span class="settings-label">Keep System Awake</span>
                        </div>
                        <div class="seg-group">
                            <button class="seg-btn ${s.keep_awake ? "active" : ""}" data-bool="keepAwake" data-value="true">On</button>
                            <button class="seg-btn ${!s.keep_awake ? "active" : ""}" data-bool="keepAwake" data-value="false">Off</button>
                        </div>
                    </div>
                    <div class="settings-row">
                        <div class="settings-row-group">
                            <span class="settings-label">Lock All Monitors</span>
                        </div>
                        <div class="seg-group">
                            <button class="seg-btn ${s.use_all_monitors ? "active" : ""}" data-bool="useAllMonitors" data-value="true">On</button>
                            <button class="seg-btn ${!s.use_all_monitors ? "active" : ""}" data-bool="useAllMonitors" data-value="false">Off</button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
        <footer class="app-footer">
            <button class="footer-btn secondary" id="cancelBtn">Cancel</button>
            <button class="footer-btn primary" id="saveBtn" style="--accent: ${accent}">Save Changes</button>
        </footer>
    `;
};

const getAnimationPreviewHTML = (animType: string, _accent: string): string => {
    const templates: Record<string, string> = {
        "neon-rings": `<div class="neon-rings-loader"><div class="ring"></div><div class="ring"></div><div class="ring"></div></div>`,
        "pulse-dots": `<div class="pulse-dots-loader"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`,
        "bounce-dots": `<div class="bounce-dots-loader"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`,
        "wave-dots": `<div class="wave-dots-loader"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`,
        "orbit": `<div class="orbit-loader"><div class="center"></div><div class="trail"></div><div class="trail"></div><div class="orbit-dot"></div></div>`,
        "spinner": `<div class="spinner-loader"><div class="circle"></div><div class="circle"></div><div class="circle"></div></div>`,
        "running": `<div class="running-loader"><div class="figure"><div class="head"></div><div class="body"></div><div class="arm left"></div><div class="arm right"></div><div class="leg left"></div><div class="leg right"></div></div><div class="shadow"></div></div>`,
        "dance": `<div class="dance-loader"><div class="disc"></div><div class="dot"></div></div>`,
        "infinity": `<div class="infinity-loader"><div class="path"></div><div class="path"></div></div>`,
        "geo": `<div class="geo-loader"><div class="shape"></div><div class="shape"></div><div class="shape"></div></div>`,
        "blob": `<div class="blob-loader"><div class="blob"></div><div class="blob-inner"></div></div>`,
        "dna": `<div class="dna-loader"><div class="strand"></div><div class="strand"></div><div class="connector"></div></div>`,
    };
    return templates[animType] || templates["neon-rings"];
};

// =============================================================================
// EVENT HANDLERS
// =============================================================================

const attachEventListeners = (): void => {
    document.querySelectorAll<HTMLButtonElement>(".tab-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const tab = btn.dataset.tab as Tab;
            if (tab) {
                state.currentTab = tab;
                renderApp();
            }
        });
    });

    getElementById<HTMLButtonElement>("closeBtn")?.addEventListener("click", () => {
        if (isTauri) {
            invoke("close_window").catch(console.error);
        }
    });

    getElementById<HTMLButtonElement>("lockBtn")?.addEventListener("click", handleToggleLock);

    getElementById<HTMLButtonElement>("cancelBtn")?.addEventListener("click", () => {
        state.currentTab = "home";
        renderApp();
    });

    getElementById<HTMLButtonElement>("saveBtn")?.addEventListener("click", handleSaveSettings);

    document.querySelectorAll<HTMLButtonElement>(".color-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            if (btn.dataset.color && state.settings) {
                state.settings = { ...state.settings, accent_color: btn.dataset.color as HexColor };
                applyAccentColor(btn.dataset.color);
                renderApp();
            }
        });
    });

    document.querySelectorAll<HTMLButtonElement>(".anim-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            if (btn.dataset.animation && state.settings) {
                state.settings = { ...state.settings, animation_type: btn.dataset.animation };
                renderApp();
                const previewEl = getElementById<HTMLDivElement>("animPreviewContainer");
                if (previewEl) {
                    const accent = state.settings.accent_color;
                    previewEl.innerHTML = getAnimationPreviewHTML(btn.dataset.animation, accent);
                }
            }
        });
    });

    document.querySelectorAll<HTMLButtonElement>(".seg-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const boolKey = btn.dataset.bool;
            const value = btn.dataset.value === "true";
            if (boolKey && state.settings) {
                state.settings = { ...state.settings, [boolKey]: value };
                renderApp();
            }
        });
    });
};

const handleToggleLock = async (): Promise<void> => {
    try {
        if (state.isLocked) {
            await api.unlockSystem();
        } else {
            await api.lockSystem();
        }
        state.isLocked = !state.isLocked;
        renderApp();
    } catch (e) {
        console.error("Toggle lock failed:", e);
    }
};

const handleSaveSettings = async (): Promise<void> => {
    if (!state.settings) return;

    const currentPasswordInput = getElementById<HTMLInputElement>("currentPassword");
    const newPasswordInput = getElementById<HTMLInputElement>("newPassword");
    const confirmPasswordInput = getElementById<HTMLInputElement>("confirmPassword");
    const lockMessageInput = getElementById<HTMLInputElement>("lockMessage");
    const armButtonTextInput = getElementById<HTMLInputElement>("armButtonText");
    const disarmButtonTextInput = getElementById<HTMLInputElement>("disarmButtonText");
    const statusArmedTextInput = getElementById<HTMLInputElement>("statusArmedText");
    const statusStandbyTextInput = getElementById<HTMLInputElement>("statusStandbyText");

    let password = state.settings.password;

    const currentPass = currentPasswordInput?.value ?? "";
    const newPass = newPasswordInput?.value ?? "";
    const confirmPass = confirmPasswordInput?.value ?? "";

    if (currentPass || newPass || confirmPass) {
        if (!currentPass) { alert("Please enter current password"); return; }
        if (currentPass !== state.settings.password) { alert("Current password is incorrect"); return; }
        if (!newPass) { alert("Please enter a new password"); return; }
        if (newPass.length < 4) { alert("Password must be at least 4 characters"); return; }
        if (newPass !== confirmPass) { alert("New passwords do not match"); return; }
        password = newPass;
    }

    const updatedSettings: Settings = {
        ...state.settings,
        password,
        lock_message: lockMessageInput?.value || state.settings.lock_message,
        arm_button_text: armButtonTextInput?.value || state.settings.arm_button_text,
        disarm_button_text: disarmButtonTextInput?.value || state.settings.disarm_button_text,
        status_armed_text: statusArmedTextInput?.value || state.settings.status_armed_text,
        status_standby_text: statusStandbyTextInput?.value || state.settings.status_standby_text,
    };

    try {
        await api.saveSettings(updatedSettings);
        state.settings = updatedSettings;
        console.log("Settings saved!");
        state.currentTab = "home";
        renderApp();
    } catch (e) {
        console.error("Save failed:", e);
    }
};

// =============================================================================
// KEYBOARD SHORTCUTS
// =============================================================================

document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;
    if (e.ctrlKey && e.shiftKey) {
        if (e.key === "L") { e.preventDefault(); void handleToggleLock(); }
        if (e.key === ",") { e.preventDefault(); state.currentTab = "settings"; renderApp(); }
    }
    if (e.key === "Escape" && state.currentTab === "settings") {
        state.currentTab = "home";
        renderApp();
    }
});

// =============================================================================
// INIT
// =============================================================================

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const [settings, monitors, isLocked] = await Promise.all([
            api.getSettings(),
            api.getMonitors(),
            api.isLocked(),
        ]);
        state = { settings, monitors, isLocked, currentTab: "home" };
        applyAccentColor(settings.accent_color);
        renderApp();

        setInterval(async () => {
            try {
                const locked = await api.isLocked();
                if (state.isLocked !== locked) {
                    state.isLocked = locked;
                    renderApp();
                }
            } catch { /* ignore */ }
        }, 500);
    } catch (e) {
        console.error("Init failed:", e);
    }
});