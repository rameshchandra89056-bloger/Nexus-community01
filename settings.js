/* ============================================================================
   settings.js — COMPLETE RESTORED SETTINGS SCREEN + EMBEDDED THEMES & MUTE
   (Fixes Black Settings Screen & Removes Floating Purple Pill)
   ============================================================================ */

(function() {
    // 1. Remove any old floating purple button from all screens immediately
    const removeFloatingTrash = () => {
        const oldFloat = document.getElementById("nx-inline-theme-btn");
        if (oldFloat) oldFloat.remove();
        document.querySelectorAll("button").forEach(b => {
            if ((b.innerText || "").includes("Smooth Themes (Soft White / Dark)")) {
                b.remove();
            }
        });
    };
    removeFloatingTrash();

    const THEMES = {
        dark: { name: "🌙 Midnight Dark", bg: "#090d16", card: "#111827", border: "#1e293b", text: "#f8fafc" },
        softwhite: { name: "☀️ Soft Daylight White", bg: "#f1f5f9", card: "#ffffff", border: "#cbd5e1", text: "#0f172a" },
        emerald: { name: "🌿 Emerald Forest", bg: "#061512", card: "#0d2621", border: "#144239", text: "#ecfdf5" },
        amethyst: { name: "🔮 Royal Amethyst", bg: "#12091c", card: "#1e112f", border: "#341d52", text: "#faf5ff" }
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
            }
            body, html, main, .nx-tab-screen {
                background-color: ${t.bg} !important;
                color: ${t.text} !important;
            }
            #nx-inline-theme-btn { display: none !important; }
            /* Fix 1:1 Chat + Drawer icons so bottom row never cuts off */
            div[style*="grid-template-columns: repeat(4"],
            div[style*="grid-template-columns:repeat(4"] {
                max-height: 260px !important;
                overflow-y: auto !important;
                padding-bottom: 12px !important;
            }
        `;
    };

    window.applyNexusTheme(localStorage.getItem("nexus_active_theme") || "dark");

    function getMyUser() {
        try {
            const u = JSON.parse(localStorage.getItem("nexus_user") || localStorage.getItem("currentUser") || "{}");
            const h = (u.handle || u.username || u.name || "mohiy").replace(/^@/, "");
            return { name: u.name || "Member", username: h, handle: "@" + h, bio: u.bio || u.stream || "IIT-JEE Aspirant" };
        } catch (e) {
            return { name: "Member", username: "mohiy", handle: "@mohiy", bio: "IIT-JEE Aspirant" };
        }
    }

    // 2. RENDER FULL SETTINGS PAGE (Fixes Black Screen & Restores All Original Controls)
    window.renderNexusSettingsScreen = function(targetBox) {
        removeFloatingTrash();
        const me = getMyUser();
        const curTheme = localStorage.getItem("nexus_active_theme") || "dark";
        const isMuted = localStorage.getItem("nexus_mute_notifications") === "true";

        targetBox.style.cssText = "display:block !important; padding: 14px 14px 90px 14px; overflow-y: auto; min-height: calc(100vh - 120px); box-sizing: border-box;";

        targetBox.innerHTML = `
            <!-- Card 1: Account & Profile Controls -->
            <div style="background:#0f172a;border:1px solid #1e293b;border-radius:20px;padding:16px;margin-bottom:14px;display:flex;flex-direction:column;gap:10px;">
                <div style="font-weight:800;font-size:15px;color:#93c5fd;margin-bottom:4px;">👤 Account & Profile Settings (${me.handle})</div>

                <button type="button" id="nx-set-edit-bio" style="width:100%;background:#1e293b;border:1px solid #334155;color:#f8fafc;padding:13px 16px;border-radius:14px;font-weight:700;font-size:14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
                    <span>✏️ Edit Display Name & Bio</span><span>→</span>
                </button>

                <button type="button" id="nx-set-edit-pin" style="width:100%;background:#1e293b;border:1px solid #334155;color:#f8fafc;padding:13px 16px;border-radius:14px;font-weight:700;font-size:14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
                    <span>🔐 Change Secret Login PIN</span><span>→</span>
                </button>

                <button type="button" id="nx-set-rem-dp" style="width:100%;background:#1e293b;border:1px solid #334155;color:#f8fafc;padding:13px 16px;border-radius:14px;font-weight:700;font-size:14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
                    <span>🖼️ Remove Current Profile Photo</span><span>✕</span>
                </button>

                <button type="button" id="nx-set-logout" style="width:100%;background:rgba(234,179,8,0.12);border:1px solid rgba(234,179,8,0.4);color:#fde047;padding:13px 16px;border-radius:14px;font-weight:700;font-size:14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
                    <span>🚪 Log Out of ${me.handle}</span><span>→</span>
                </button>

                <button type="button" id="nx-set-del-acc" style="width:100%;background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.4);color:#fca5a5;padding:13px 16px;border-radius:14px;font-weight:700;font-size:14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
                    <span>🗑️ Delete My Account Permanently</span><span>⚠️</span>
                </button>
            </div>

            <!-- Card 2: Smooth Themes & Notification Sound Mute (Strictly Inside Settings!) -->
            <div style="background:#0f172a;border:1px solid rgba(99,102,241,0.4);border-radius:20px;padding:16px;margin-bottom:14px;">
                <div style="font-weight:800;font-size:15px;color:#a5b4fc;margin-bottom:12px;">🎨 Smooth Eye-Friendly Themes & Sound</div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
                    ${Object.keys(THEMES).map(k => `
                        <button type="button" class="nx-theme-pick-btn" data-t="${k}" style="padding:11px;border-radius:12px;border:2px solid ${curTheme === k ? "#6366f1" : "#334155"};background:${THEMES[k].bg};color:${THEMES[k].text};font-weight:700;font-size:12px;cursor:pointer;text-align:left;">
                            ${THEMES[k].name} ${curTheme === k ? "✔" : ""}
                        </button>
                    `).join("")}
                </div>

                <button type="button" id="nx-set-mute-toggle" style="width:100%;background:#1e293b;border:1px solid #6366f1;color:#f8fafc;padding:13px 16px;border-radius:14px;font-weight:700;font-size:14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
                    <span>🔔 Notification Ring Sound</span>
                    <span style="background:${isMuted ? "#ef4444" : "#10b981"};color:#000;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:800;">
                        ${isMuted ? "🔇 Muted" : "🔊 Sound On"}
                    </span>
                </button>
            </div>

            <!-- Card 3: Official App & Speed Controls -->
            <div style="background:#0f172a;border:1px solid #1e293b;border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:10px;">
                <div style="font-weight:800;font-size:15px;color:#6ee7b7;margin-bottom:4px;">📲 Official App & Speed Controls</div>

                <button type="button" id="nx-set-dl-app" style="width:100%;background:#10b981;border:none;color:#000;padding:14px 16px;border-radius:14px;font-weight:800;font-size:14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
                    <span>📲 1-Click Download Official Nexus App</span><span>Download ↓</span>
                </button>

                <button type="button" id="nx-set-boost" style="width:100%;background:#1e293b;border:1px solid #334155;color:#38bdf8;padding:13px 16px;border-radius:14px;font-weight:700;font-size:14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
                    <span>⚡ 1-Tap Speed Boost (Clear Lag Cache)</span><span>🚀</span>
                </button>
            </div>
        `;

        // Bind Settings Button Actions
        targetBox.querySelectorAll(".nx-theme-pick-btn").forEach(btn => {
            btn.onclick = () => {
                window.applyNexusTheme(btn.dataset.t);
                window.renderNexusSettingsScreen(targetBox);
            };
        });

        document.getElementById("nx-set-mute-toggle").onclick = () => {
            const next = localStorage.getItem("nexus_mute_notifications") !== "true";
            localStorage.setItem("nexus_mute_notifications", next ? "true" : "false");
            window.renderNexusSettingsScreen(targetBox);
        };

        document.getElementById("nx-set-edit-bio").onclick = () => {
            const newName = prompt("Apna naya Display Name dalein:", me.name);
            if (!newName) return;
            const newBio = prompt("Apni Stream / Bio dalein (jaise IIT-JEE / NEET):", me.bio);
            const raw = JSON.parse(localStorage.getItem("nexus_user") || localStorage.getItem("currentUser") || "{}");
            raw.name = newName.trim();
            if (newBio) { raw.bio = newBio.trim(); raw.stream = newBio.trim(); }
            localStorage.setItem("nexus_user", JSON.stringify(raw));
            localStorage.setItem("currentUser", JSON.stringify(raw));
            if (window.firebase && firebase.database) {
                firebase.database().ref("users/" + me.username).update({ name: raw.name, bio: raw.bio, stream: raw.stream });
            }
            alert("✅ Profile Updated!");
            window.renderNexusSettingsScreen(targetBox);
        };

        document.getElementById("nx-set-edit-pin").onclick = () => {
            const pin = prompt("Naya 6-digit Secret Login PIN dalein:");
            if (pin && pin.trim().length >= 4) {
                if (window.firebase && firebase.database) {
                    firebase.database().ref("users/" + me.username).update({ password: pin.trim() });
                }
                alert("✅ Secret PIN Updated!");
            }
        };

        document.getElementById("nx-set-rem-dp").onclick = () => {
            const raw = JSON.parse(localStorage.getItem("nexus_user") || localStorage.getItem("currentUser") || "{}");
            raw.avatar = ""; raw.photoURL = "";
            localStorage.setItem("nexus_user", JSON.stringify(raw));
            localStorage.setItem("currentUser", JSON.stringify(raw));
            alert("✅ Profile Photo Removed!");
        };

        document.getElementById("nx-set-logout").onclick = () => {
            if (confirm("Kya aap log out karna chahte hain?")) {
                localStorage.removeItem("nexus_user");
                localStorage.removeItem("currentUser");
                localStorage.removeItem("nx_logged_in");
                window.location.reload();
            }
        };

        document.getElementById("nx-set-del-acc").onclick = () => {
            if (confirm("⚠️ Kya aap sach mein apna account delete karna chahte hain?")) {
                if (window.firebase && firebase.database) {
                    firebase.database().ref("users/" + me.username).remove();
                }
                localStorage.clear();
                window.location.reload();
            }
        };

        document.getElementById("nx-set-dl-app").onclick = () => {
            if (window.installNexusPWA) window.installNexusPWA();
            else alert("📲 Browser ke 3-dots (⋮) par click karke 'Install App' ya 'Add to Home Screen' dabayein!");
        };

        document.getElementById("nx-set-boost").onclick = () => {
            if ("caches" in window) {
                caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
            }
            alert("⚡ Lag Cache Cleared! Speed Boosted.");
        };
    };

    // Detect when user clicks the 5th bottom nav icon (Settings Gear ⚙️) and render immediately if empty/black
    function openSettingsOnGearTap() {
        const screens = document.querySelectorAll(".nx-tab-screen");
        let settingsEl = document.getElementById("tab-settings") || document.getElementById("settings-tab") || document.getElementById("settings") || (screens.length >= 5 ? screens[4] : null);

        if (!settingsEl) {
            // If settings container doesn't exist, create one cleanly inside main area
            settingsEl = document.getElementById("nx-custom-settings-view");
            if (!settingsEl) {
                settingsEl = document.createElement("div");
                settingsEl.id = "nx-custom-settings-view";
                settingsEl.className = "nx-tab-screen active";
                const mainArea = document.querySelector("main") || document.body;
                mainArea.appendChild(settingsEl);
            }
        }

        if (!(settingsEl.innerText || "").includes("Account & Profile Settings")) {
            window.renderNexusSettingsScreen(settingsEl);
        }
    }

    document.addEventListener("click", (e) => {
        const navBtns = document.querySelectorAll(".nx-nav-item, footer button, nav button");
        if (navBtns.length >= 5) {
            if (navBtns[4].contains(e.target)) {
                setTimeout(openSettingsOnGearTap, 10);
            } else if (navBtns[0].contains(e.target) || navBtns[1].contains(e.target) || navBtns[2].contains(e.target) || navBtns[3].contains(e.target)) {
                const customView = document.getElementById("nx-custom-settings-view");
                if (customView) customView.style.display = "none";
            }
        }
    });
})();
