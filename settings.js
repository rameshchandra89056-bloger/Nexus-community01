/* ============================================================================
   settings.js — SETTINGS TAB INNER CARD (NO FLOATING PILL), SMOOTH THEMES,
   DIWALI BANNER REMOVER & 1:1 CHAT (+) DRAWER OVERLAP FIX
   ============================================================================ */

(function() {
    // Remove any old floating purple button immediately
    const oldFloat = document.getElementById("nx-inline-theme-btn");
    if (oldFloat) oldFloat.remove();

    const THEMES = {
        dark: {
            name: "🌙 Midnight Dark (Default)",
            bg: "#090d16",
            card: "#111827",
            border: "#1e293b",
            text: "#f8fafc",
            subtext: "#94a3b8"
        },
        softwhite: {
            name: "☀️ Soft Daylight White (Eye-Friendly)",
            bg: "#f1f5f9",
            card: "#ffffff",
            border: "#cbd5e1",
            text: "#0f172a",
            subtext: "#475569"
        },
        emerald: {
            name: "🌿 Emerald Forest",
            bg: "#061512",
            card: "#0d2621",
            border: "#144239",
            text: "#ecfdf5",
            subtext: "#6ee7b7"
        },
        amethyst: {
            name: "🔮 Royal Amethyst",
            bg: "#12091c",
            card: "#1e112f",
            border: "#341d52",
            text: "#faf5ff",
            subtext: "#d8b4fe"
        }
    };

    window.applyNexusTheme = function(themeKey) {
        const t = THEMES[themeKey] || THEMES.dark;
        localStorage.setItem("nexus_active_theme", themeKey);

        let styleTag = document.getElementById("nx-dynamic-theme-css");
        if (!styleTag) {
            styleTag = document.createElement("style");
            styleTag.id = "nx-dynamic-theme-css";
            document.head.appendChild(styleTag);
        }

        styleTag.innerHTML = `
            :root {
                --nx-bg: ${t.bg};
                --nx-card: ${t.card};
                --nx-text: ${t.text};
                --nx-subtext: ${t.subtext};
            }
            body, html, main, .nx-tab-screen {
                background-color: ${t.bg} !important;
                color: ${t.text} !important;
                transition: background-color 0.2s ease, color 0.2s ease !important;
            }
            /* Fix 1:1 Chat + Drawer Overlap so all 12 icons (Sketch, Pass Lock, Send Code) fit cleanly */
            div[style*="grid-template-columns: repeat(4"],
            div[style*="grid-template-columns:repeat(4"] {
                max-height: 250px !important;
                overflow-y: auto !important;
                padding-bottom: 14px !important;
                box-sizing: border-box !important;
            }
            /* Hide floating purple theme button if cached anywhere */
            #nx-inline-theme-btn {
                display: none !important;
            }
        `;
    };

    // Apply saved theme on load
    window.applyNexusTheme(localStorage.getItem("nexus_active_theme") || "dark");

    // 1. HIDE OLD DIWALI CELEBRATION BANNER AUTOMATICALLY
    function hideDiwaliBanner() {
        document.querySelectorAll("div, section").forEach(el => {
            const txt = el.innerText || "";
            if ((txt.includes("Happy Diwali Nexus Family") || txt.includes("Live Community Diyas") || txt.includes("दीया जलाएं")) &&
                el.offsetHeight > 40 && el.offsetHeight < 240) {
                el.style.setProperty("display", "none", "important");
            }
        });
    }

    // 2. INJECT THEME & SOUND SETTINGS DIRECTLY INSIDE THE SETTINGS TAB ONLY
    function injectInsideSettingsTab() {
        hideDiwaliBanner();

        // Find the Settings screen container by locating "Official App & Speed Controls" or "Edit Display Name & Bio"
        let settingsContainer = null;
        document.querySelectorAll("div").forEach(div => {
            const txt = div.innerText || "";
            if (txt.includes("Official App & Speed Controls") && txt.includes("Edit Display Name & Bio") && div.children.length >= 2) {
                settingsContainer = div;
            }
        });

        if (!settingsContainer || document.getElementById("nx-settings-inner-card")) return;

        const currentTheme = localStorage.getItem("nexus_active_theme") || "dark";
        const isMuted = localStorage.getItem("nexus_mute_notifications") === "true";

        const card = document.createElement("div");
        card.id = "nx-settings-inner-card";
        card.style.cssText = `
            background: rgba(17, 24, 39, 0.9);
            border: 1px solid rgba(99, 102, 241, 0.35);
            border-radius: 20px;
            padding: 16px;
            margin-top: 14px;
            margin-bottom: 20px;
            color: #f8fafc;
            font-family: system-ui, sans-serif;
        `;

        card.innerHTML = `
            <div style="font-weight:800;font-size:15px;margin-bottom:12px;display:flex;align-items:center;gap:8px;color:#93c5fd;">
                🎨 Appearance (Smooth Themes) & Sound Controls
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
                ${Object.keys(THEMES).map(k => `
                    <button type="button" class="nx-inner-theme-btn" data-theme="${k}" style="padding:10px;border-radius:12px;border:2px solid ${currentTheme === k ? "#6366f1" : "rgba(148,163,184,0.2)"};background:${THEMES[k].bg};color:${THEMES[k].text};font-weight:700;font-size:12px;cursor:pointer;text-align:left;">
                        ${THEMES[k].name.split(" (")[0]} ${currentTheme === k ? "✔" : ""}
                    </button>
                `).join("")}
            </div>

            <button type="button" id="nx-inner-mute-btn" style="width:100%;padding:12px;border-radius:12px;border:1px solid rgba(99,102,241,0.45);background:rgba(99,102,241,0.12);color:#e0e7ff;font-weight:700;font-size:13px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;">
                <span>🔔 Notification Ring Sound</span>
                <span id="nx-mute-status-label" style="background:${isMuted ? "#ef4444" : "#10b981"};color:#000;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:800;">
                    ${isMuted ? "🔇 Muted" : "🔊 Active"}
                </span>
            </button>
        `;

        settingsContainer.appendChild(card);

        card.querySelectorAll(".nx-inner-theme-btn").forEach(btn => {
            btn.onclick = () => {
                window.applyNexusTheme(btn.dataset.theme);
                card.remove();
                injectInsideSettingsTab();
            };
        });

        const muteBtn = document.getElementById("nx-inner-mute-btn");
        if (muteBtn) {
            muteBtn.onclick = () => {
                const nowMuted = localStorage.getItem("nexus_mute_notifications") !== "true";
                localStorage.setItem("nexus_mute_notifications", nowMuted ? "true" : "false");
                const lbl = document.getElementById("nx-mute-status-label");
                if (lbl) {
                    lbl.innerText = nowMuted ? "🔇 Muted" : "🔊 Active";
                    lbl.style.background = nowMuted ? "#ef4444" : "#10b981";
                }
                if (!nowMuted && window.NexusNotify && window.NexusNotify.playRing) {
                    window.NexusNotify.playRing();
                }
            };
        }
    }

    setInterval(injectInsideSettingsTab, 500);
})();
