/* ============================================================================
   settings.js — COMPLETE SETTINGS TAB BUILDER + BLACK SCREEN FIX + THEMES
   Restores Full Settings UI (Edit Bio, PIN, Logout, Speed Boost) + Inner Themes
   ============================================================================ */

(function() {
    // 1. Remove any floating purple button & reset broken black/green screen CSS
    const oldFloat = document.getElementById("nx-inline-theme-btn");
    if (oldFloat) oldFloat.remove();

    function getMyUser() {
        const keys = ["nexus_user", "currentUser", "nx_user", "user"];
        for (const k of keys) {
            try {
                const u = JSON.parse(localStorage.getItem(k));
                if (u && (u.name || u.username || u.handle)) {
                    const clean = (u.handle || u.username || u.name).replace(/^@/, "");
                    return {
                        uid: u.uid || clean,
                        name: u.name || clean,
                        username: clean,
                        handle: "@" + clean,
                        stream: u.stream || u.bio || "IIT-JEE Aspirant",
                        avatar: u.avatar || u.photoURL || ""
                    };
                }
            } catch (e) {}
        }
        return { uid: "mohiy", name: "Mohit_01", username: "mohiy", handle: "@mohiy", stream: "IIT-JEE Aspirant", avatar: "" };
    }

    function showToast(msg) {
        if (window.Nexus && typeof window.Nexus.toast === "function") {
            window.Nexus.toast(msg);
        } else {
            const t = document.getElementById("nx-toast");
            if (t) {
                t.innerText = msg;
                t.style.display = "block";
                setTimeout(() => { t.style.display = "none"; }, 2200);
            } else {
                alert(msg);
            }
        }
    }

    // 2. Smooth Themes Engine
    const THEMES = {
        dark: { name: "🌙 Midnight Dark", bg: "#090d16", card: "#111827", text: "#f8fafc", border: "#1e293b" },
        softwhite: { name: "☀️ Soft Daylight White", bg: "#f1f5f9", card: "#ffffff", text: "#0f172a", border: "#cbd5e1" },
        emerald: { name: "🌿 Emerald Forest", bg: "#061512", card: "#0d2621", text: "#ecfdf5", border: "#144239" },
        amethyst: { name: "🔮 Royal Amethyst", bg: "#12091c", card: "#1e112f", text: "#faf5ff", border: "#341d52" }
    };

    window.applyNexusTheme = function(themeKey) {
        const t = THEMES[themeKey] || THEMES.dark;
        localStorage.setItem("nexus_active_theme", themeKey);

        let st = document.getElementById("nx-theme-engine-style");
        if (!st) {
            st = document.createElement("style");
            st.id = "nx-theme-engine-style";
            document.head.appendChild(st);
        }

        st.innerHTML = `
            body, html {
                background-color: ${t.bg} !important;
                color: ${t.text} !important;
            }
            .nx-tab-screen {
                display: none;
            }
            .nx-tab-screen.active {
                display: block !important;
                min-height: calc(100vh - 130px);
                padding-bottom: 85px;
            }
            #nx-inline-theme-btn {
                display: none !important;
            }
        `;
    };

    window.applyNexusTheme(localStorage.getItem("nexus_active_theme") || "dark");

    // 3. Find Settings Tab Container & Render Full Settings UI (Fixes Black Screen!)
    function getTabContainerByIndex(navIndex, fallbackIds) {
        const navBtns = document.querySelectorAll(".nx-nav-item, footer button, nav button");
        if (navBtns[navIndex]) {
            const tabId = navBtns[navIndex].getAttribute("data-tab");
            if (tabId && document.getElementById(tabId)) {
                return document.getElementById(tabId);
            }
        }
        for (const id of fallbackIds) {
            if (document.getElementById(id)) return document.getElementById(id);
        }
        const allScreens = document.querySelectorAll(".nx-tab-screen");
        return allScreens[navIndex] || null;
    }

    function renderFullSettingsScreen() {
        // Settings is the last icon in bottom nav (index 4 or 3 depending on + button)
        const navBtns = document.querySelectorAll(".nx-nav-item");
        const lastNav = navBtns[navBtns.length - 1];
        let settingsScreen = null;
        if (lastNav && lastNav.getAttribute("data-tab")) {
            settingsScreen = document.getElementById(lastNav.getAttribute("data-tab"));
        }
        if (!settingsScreen) {
            settingsScreen = getTabContainerByIndex(4, ["tab-settings", "settings-screen", "settings", "nx-settings"]);
        }
        if (!settingsScreen) return;

        // Only render if Settings screen is empty or missing our main controls
        if (settingsScreen.innerHTML.trim() !== "" && settingsScreen.innerText.includes("Official App & Speed Controls")) {
            return;
        }

        const me = getMyUser();
        const activeTheme = localStorage.getItem("nexus_active_theme") || "dark";
        const isMuted = localStorage.getItem("nexus_mute_notifications") === "true";

        settingsScreen.innerHTML = `
            <div style="padding: 16px; max-width: 480px; margin: 0 auto; font-family: system-ui, sans-serif;">
                <!-- Card 1: Account & Profile Controls -->
                <div style="background:#111827;border:1px solid #1e293b;border-radius:20px;padding:16px;margin-bottom:16px;display:flex;flex-direction:column;gap:10px;">
                    <div style="font-weight:800;font-size:15px;color:#93c5fd;margin-bottom:4px;">👤 Account & Security Settings (${me.handle})</div>

                    <button id="nx-set-edit-bio" style="width:100%;background:#1e293b;color:#f8fafc;border:1px solid #334155;padding:13px 16px;border-radius:14px;font-weight:700;font-size:14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
                        <span>✏️ Edit Display Name & Bio</span><span>→</span>
                    </button>

                    <button id="nx-set-change-pin" style="width:100%;background:#1e293b;color:#f8fafc;border:1px solid #334155;padding:13px 16px;border-radius:14px;font-weight:700;font-size:14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
                        <span>🔐 Change Secret Login PIN</span><span>→</span>
                    </button>

                    <button id="nx-set-remove-pic" style="width:100%;background:#1e293b;color:#fda4af;border:1px solid rgba(244,63,94,0.3);padding:13px 16px;border-radius:14px;font-weight:700;font-size:14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
                        <span>🖼️ Remove Current Profile Photo</span><span>✕</span>
                    </button>

                    <button id="nx-set-logout" style="width:100%;background:rgba(234,179,8,0.12);color:#fde047;border:1px solid rgba(234,179,8,0.4);padding:13px 16px;border-radius:14px;font-weight:700;font-size:14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
                        <span>🚪 Log Out of ${me.handle}</span><span>→</span>
                    </button>

                    <button id="nx-set-delete-acc" style="width:100%;background:rgba(239,68,68,0.12);color:#f87171;border:1px solid rgba(239,68,68,0.4);padding:13px 16px;border-radius:14px;font-weight:700;font-size:14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
                        <span>🗑️ Delete My Account Permanently</span><span>⚠️</span>
                    </button>
                </div>

                <!-- Card 2: Official App & Speed Controls -->
                <div style="background:#111827;border:1px solid #1e293b;border-radius:20px;padding:16px;margin-bottom:16px;display:flex;flex-direction:column;gap:10px;">
                    <div style="font-weight:800;font-size:15px;color:#f8fafc;margin-bottom:4px;">📲 Official App & Speed Controls</div>

                    <button id="nx-set-dl-app" style="width:100%;background:linear-gradient(90deg,#10b981,#059669);color:#000;border:none;padding:14px 16px;border-radius:14px;font-weight:800;font-size:14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
                        <span>📲 1-Click Download Official Nexus App</span><span>Download ↓</span>
                    </button>

                    <button id="nx-set-speed-boost" style="width:100%;background:#1e293b;color:#38bdf8;border:1px solid #334155;padding:13px 16px;border-radius:14px;font-weight:700;font-size:14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
                        <span>⚡ 1-Tap Speed Boost (Clear Lag Cache)</span><span>🚀</span>
                    </button>

                    <button id="nx-set-share-link" style="width:100%;background:#1e293b;color:#c4b5fd;border:1px solid #334155;padding:13px 16px;border-radius:14px;font-weight:700;font-size:14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
                        <span>🔗 Copy & Share Website Link</span><span>📋</span>
                    </button>
                </div>

                <!-- Card 3: Appearance Themes & Notification Sound (Inside Settings Only) -->
                <div style="background:#111827;border:1px solid rgba(99,102,241,0.4);border-radius:20px;padding:16px;margin-bottom:24px;">
                    <div style="font-weight:800;font-size:15px;color:#93c5fd;margin-bottom:12px;">🎨 Smooth Themes & Notification Sound</div>

                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
                        ${Object.keys(THEMES).map(k => `
                            <button type="button" class="nx-theme-card-btn" data-theme="${k}" style="padding:11px 10px;border-radius:12px;border:2px solid ${activeTheme === k ? "#10b981" : "#334155"};background:${THEMES[k].bg};color:${THEMES[k].text};font-weight:700;font-size:12px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;">
                                <span>${THEMES[k].name}</span><span>${activeTheme === k ? "✔" : ""}</span>
                            </button>
                        `).join("")}
                    </div>

                    <button type="button" id="nx-set-mute-btn" style="width:100%;padding:13px 16px;border-radius:14px;border:1px solid #6366f1;background:rgba(99,102,241,0.12);color:#fff;font-weight:700;font-size:13px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;">
                        <span>🔔 Notification Ring Sound</span>
                        <span id="nx-mute-pill" style="background:${isMuted ? "#ef4444" : "#10b981"};color:#000;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:800;">
                            ${isMuted ? "🔇 Muted" : "🔊 Active"}
                        </span>
                    </button>
                </div>
            </div>
        `;

        // Bind Settings Actions
        document.getElementById("nx-set-edit-bio").onclick = () => {
            const newName = prompt("Enter New Display Name:", me.name);
            if (!newName) return;
            const newBio = prompt("Enter Stream / Bio (e.g., IIT-JEE Aspirant):", me.stream);
            me.name = newName.trim();
            if (newBio) me.stream = newBio.trim();
            localStorage.setItem("nexus_user", JSON.stringify(me));
            localStorage.setItem("currentUser", JSON.stringify(me));
            if (window.firebase && firebase.database) {
                firebase.database().ref("users/" + me.username).update({ name: me.name, stream: me.stream, bio: me.stream });
            }
            showToast("✅ Name & Bio Updated!");
        };

        document.getElementById("nx-set-change-pin").onclick = () => {
            const newPin = prompt("Enter New 6-Character Secret Login PIN:");
            if (newPin && newPin.trim().length >= 4) {
                if (window.firebase && firebase.database) {
                    firebase.database().ref("users/" + me.username).update({ password: newPin.trim() });
                }
                showToast("🔐 Secret Login PIN Updated!");
            }
        };

        document.getElementById("nx-set-remove-pic").onclick = () => {
            me.avatar = "";
            localStorage.setItem("nexus_user", JSON.stringify(me));
            localStorage.setItem("currentUser", JSON.stringify(me));
            if (window.firebase && firebase.database) {
                firebase.database().ref("users/" + me.username).update({ avatar: "", photoURL: "" });
            }
            showToast("🖼️ Profile Photo Removed!");
        };

        document.getElementById("nx-set-logout").onclick = () => {
            if (confirm("Kya aap sach mein Log Out karna chahte hain?")) {
                localStorage.removeItem("nexus_user");
                localStorage.removeItem("currentUser");
                localStorage.removeItem("nx_logged_in");
                window.location.reload();
            }
        };

        document.getElementById("nx-set-delete-acc").onclick = () => {
            if (confirm("⚠️ Kya aap apna account permanently delete karna chahte hain?")) {
                if (window.firebase && firebase.database) {
                    firebase.database().ref("users/" + me.username).remove();
                }
                localStorage.clear();
                window.location.reload();
            }
        };

        document.getElementById("nx-set-dl-app").onclick = () => {
            if (window.installNexusPWA) window.installNexusPWA();
            else alert("📲 Browser ke 3-dots (⋮) par tap karke 'Add to Home screen' ya 'Install App' chunein!");
        };

        document.getElementById("nx-set-speed-boost").onclick = () => {
            if ("caches" in window) {
                caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
            }
            showToast("⚡ Speed Boost Complete! Lag Cache Cleared.");
        };

        document.getElementById("nx-set-share-link").onclick = () => {
            navigator.clipboard.writeText("https://nexus-community01.vercel.app/");
            showToast("🔗 Nexus Link Copied to Clipboard!");
        };

        settingsScreen.querySelectorAll(".nx-theme-card-btn").forEach(btn => {
            btn.onclick = () => {
                window.applyNexusTheme(btn.dataset.theme);
                settingsScreen.innerHTML = "";
                renderFullSettingsScreen();
            };
        });

        document.getElementById("nx-set-mute-btn").onclick = () => {
            const nextMute = localStorage.getItem("nexus_mute_notifications") !== "true";
            localStorage.setItem("nexus_mute_notifications", nextMute ? "true" : "false");
            const pill = document.getElementById("nx-mute-pill");
            if (pill) {
                pill.innerText = nextMute ? "🔇 Muted" : "🔊 Active";
                pill.style.background = nextMute ? "#ef4444" : "#10b981";
            }
        };
    }

    // 4. Also Fix Profile Tab If Blank
    function ensureProfileTabNotBlank() {
        const navBtns = document.querySelectorAll(".nx-nav-item");
        if (navBtns.length < 3) return;
        const profNav = navBtns[navBtns.length - 2];
        const tabId = profNav ? profNav.getAttribute("data-tab") : null;
        const profScreen = tabId ? document.getElementById(tabId) : document.getElementById("tab-profile");

        if (profScreen && profScreen.innerHTML.trim() === "") {
            if (window.Nexus && typeof window.Nexus.renderProfile === "function") {
                try { window.Nexus.renderProfile(); return; } catch (e) {}
            }
            const me = getMyUser();
            profScreen.innerHTML = `
                <div style="padding:20px;max-width:440px;margin:0 auto;font-family:system-ui,sans-serif;">
                    <div style="background:#111827;border:1px solid #1e293b;border-radius:22px;padding:24px;text-align:center;">
                        <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#10b981,#2563eb);margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:#fff;">
                            ${(me.name || "M").charAt(0).toUpperCase()}
                        </div>
                        <div style="font-size:20px;font-weight:800;color:#fff;">${me.name} <span style="color:#10b981;">✔</span></div>
                        <div style="font-size:13px;color:#38bdf8;margin-top:4px;">${me.handle} • ${me.stream}</div>
                        <div style="margin-top:16px;padding:12px;background:#1e293b;border-radius:14px;font-size:13px;color:#cbd5e1;">
                            🟢 Cloud Account Active & Synced
                        </div>
                    </div>
                </div>
            `;
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        renderFullSettingsScreen();
        ensureProfileTabNotBlank();
    });
    document.addEventListener("click", () => {
        setTimeout(() => {
            renderFullSettingsScreen();
            ensureProfileTabNotBlank();
        }, 50);
    });
    setTimeout(renderFullSettingsScreen, 300);
})();
