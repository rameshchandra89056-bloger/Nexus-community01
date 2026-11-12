/* ============================================================================
   settings.js — COMPLETE CODE (INNER SETTINGS CARD ONLY, NO FLOATING BUTTON,
   DIWALI BANNER REMOVER, SMOOTH EYE-FRIENDLY WHITE/DARK THEMES & + DRAWER FIX)
   ============================================================================ */

(function() {
    // 1. Immediately destroy any floating purple theme button if present
    function removeFloatingPill() {
        const pill = document.getElementById("nx-inline-theme-btn");
        if (pill) pill.remove();
        document.querySelectorAll("button").forEach(b => {
            if ((b.innerText || "").includes("Smooth Themes (Soft White / Dark)")) {
                b.remove();
            }
        });
    }
    removeFloatingPill();

    // 2. Smooth Eye-Friendly Theme Definitions
    const THEMES = {
        dark: {
            name: "🌙 Midnight Dark",
            bg: "#090d16",
            card: "#111827",
            border: "#1e293b",
            text: "#f8fafc",
            subtext: "#94a3b8"
        },
        softwhite: {
            name: "☀️ Soft Daylight White",
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

        let styleEl = document.getElementById("nx-theme-engine-style");
        if (!styleEl) {
            styleEl = document.createElement("style");
            styleEl.id = "nx-theme-engine-style";
            document.head.appendChild(styleEl);
        }

        styleEl.innerHTML = `
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
            /* Fix 1:1 Chat (+) 12-Icon Drawer so Sketch, Pass Lock, Status Card & Send Code never get cut off */
            div[style*="grid-template-columns: repeat(4"],
            div[style*="grid-template-columns:repeat(4"] {
                max-height: 275px !important;
                overflow-y: auto !important;
                padding-bottom: 16px !important;
                box-sizing: border-box !important;
            }
            #nx-inline-theme-btn {
                display: none !important;
                visibility: hidden !important;
            }
        `;
    };

    window.applyNexusTheme(localStorage.getItem("nexus_active_theme") || "dark");

    // 3. Remove Old Diwali Celebration Card from Home Feed
    function removeDiwaliCelebrationCard() {
        document.querySelectorAll("div, section").forEach(el => {
            const txt = el.innerText || "";
            if ((txt.includes("Happy Diwali Nexus Family") || txt.includes("Live Community Diyas") || txt.includes("दीया जलाएं")) &&
                el.offsetHeight > 40 && el.offsetHeight < 250) {
                el.style.setProperty("display", "none", "important");
            }
        });
    }

    // 4. Inject Theme & Notification Sound Mute strictly inside the Settings Tab
    function renderSettingsTabCard() {
        removeFloatingPill();
        removeDiwaliCelebrationCard();

        // Locate the Settings Tab container by finding "Official App & Speed Controls"
        let settingsWrapper = null;
        document.querySelectorAll("div").forEach(d => {
            const txt = d.innerText || "";
            if (txt.includes("Official App & Speed Controls") && txt.includes("Edit Display Name & Bio") && d.children.length >= 2) {
                settingsWrapper = d;
            }
        });

        if (!settingsWrapper || document.getElementById("nx-settings-permanent-card")) return;

        const activeTheme = localStorage.getItem("nexus_active_theme") || "dark";
        const isMuted = localStorage.getItem("nexus_mute_notifications") === "true";

        const card = document.createElement("div");
        card.id = "nx-settings-permanent-card";
        card.style.cssText = `
            background: rgba(17, 24, 39, 0.92);
            border: 1px solid rgba(99, 102, 241, 0.35);
            border-radius: 20px;
            padding: 16px;
            margin: 14px 0 24px 0;
            color: #f8fafc;
            font-family: system-ui, sans-serif;
        `;

        card.innerHTML = `
            <div style="font-weight:800;font-size:15px;margin-bottom:12px;color:#93c5fd;">
                🎨 Appearance Themes & Notification Sound
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
                ${Object.keys(THEMES).map(k => `
                    <button type="button" class="nx-set-theme-opt" data-theme="${k}" style="padding:11px 10px;border-radius:12px;border:2px solid ${activeTheme === k ? "#10b981" : "rgba(148,163,184,0.22)"};background:${THEMES[k].bg};color:${THEMES[k].text};font-weight:700;font-size:12px;cursor:pointer;text-align:left;display:flex;justify-content:space-between;align-items:center;">
                        <span>${THEMES[k].name}</span>
                        <span>${activeTheme === k ? "✔" : ""}</span>
                    </button>
                `).join("")}
            </div>

            <button type="button" id="nx-set-mute-toggle" style="width:100%;padding:12px 14px;border-radius:12px;border:1px solid rgba(99,102,241,0.45);background:rgba(99,102,241,0.12);color:#ffffff;font-weight:700;font-size:13px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;">
                <span>🔔 Notification Ring Sound</span>
                <span id="nx-set-mute-badge" style="background:${isMuted ? "#ef4444" : "#10b981"};color:#000;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:800;">
                    ${isMuted ? "🔇 Muted" : "🔊 Active"}
                </span>
            </button>
        `;

        settingsWrapper.appendChild(card);

        card.querySelectorAll(".nx-set-theme-opt").forEach(btn => {
            btn.onclick = () => {
                window.applyNexusTheme(btn.dataset.theme);
                card.remove();
                renderSettingsTabCard();
            };
        });

        const muteBtn = document.getElementById("nx-set-mute-toggle");
        if (muteBtn) {
            muteBtn.onclick = () => {
                const nextMute = localStorage.getItem("nexus_mute_notifications") !== "true";
                localStorage.setItem("nexus_mute_notifications", nextMute ? "true" : "false");
                const badge = document.getElementById("nx-set-mute-badge");
                if (badge) {
                    badge.innerText = nextMute ? "🔇 Muted" : "🔊 Active";
                    badge.style.background = nextMute ? "#ef4444" : "#10b981";
                }
                if (!nextMute && window.NexusNotify && window.NexusNotify.playRing) {
                    window.NexusNotify.playRing();
                }
            };
        }
    }

    setInterval(renderSettingsTabCard, 400);
})();
