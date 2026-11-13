// ================= SETTINGS.JS (FIRESTORE NATIVE MASTER): ⚙️ ACCOUNT CONTROLS + 🎨 EYE-FRIENDLY SMOOTH THEMES (SOFT WHITE / DARK) + 🔔 SOUND MUTE =================

(function() {
    const THEMES = {
        dark: {
            name: "🌙 Midnight Dark",
            bg: "#090d16",
            card: "#0f172a",
            subcard: "#161f33",
            border: "#1e293b",
            text: "#f8fafc",
            muted: "#94a3b8"
        },
        softwhite: {
            name: "☀️ Soft Daylight White",
            bg: "#f1f5f9",
            card: "#ffffff",
            subcard: "#f8fafc",
            border: "#cbd5e1",
            text: "#0f172a",
            muted: "#475569"
        },
        emerald: {
            name: "🌿 Emerald Forest",
            bg: "#051411",
            card: "#0b241e",
            subcard: "#11332b",
            border: "#164e41",
            text: "#ecfdf5",
            muted: "#6ee7b7"
        },
        amethyst: {
            name: "🔮 Royal Amethyst",
            bg: "#11091a",
            card: "#1b1029",
            subcard: "#261738",
            border: "#3b2357",
            text: "#faf5ff",
            muted: "#d8b4fe"
        }
    };

    window.applyNexusTheme = function(themeKey) {
        const t = THEMES[themeKey] || THEMES.dark;
        localStorage.setItem('nexus_active_theme', themeKey);

        let st = document.getElementById('nx-smooth-theme-style');
        if (!st) {
            st = document.createElement('style');
            st.id = 'nx-smooth-theme-style';
            document.head.appendChild(st);
        }

        const isLight = (themeKey === 'softwhite');
        st.innerHTML = `
            body, html {
                background-color: ${t.bg} !important;
                color: ${t.text} !important;
                transition: background-color 0.22s ease, color 0.22s ease !important;
            }
            .nx-header, .nx-bottom-nav, .nx-post-card, .nx-prof-hero, .nx-modal-box, #nx-stories-bar {
                background: ${t.card} !important;
                color: ${t.text} !important;
                border-color: ${t.border} !important;
                transition: background 0.22s ease, color 0.22s ease, border-color 0.22s ease !important;
            }
            ${isLight ? `
                .nx-post-card div, .nx-post-card span, .nx-story-username-lbl, .nx-header .nx-icon-btn {
                    color: ${t.text} !important;
                }
                .nx-act-pill {
                    background: #e2e8f0 !important;
                    border-color: #cbd5e1 !important;
                    color: #1e293b !important;
                }
                #nx-chat-directory > div {
                    background: #ffffff !important;
                    border-color: #cbd5e1 !important;
                    color: #0f172a !important;
                }
            ` : ''}
        `;
    };

    window.applyNexusTheme(localStorage.getItem('nexus_active_theme') || 'dark');

    function renderSettingsTab() {
        const settingsScreen = document.getElementById('tab-settings');
        if (!settingsScreen) return;

        const me = (window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null) || {
            username: 'guest_user',
            name: 'Nexus Visitor',
            bio: 'IIT-JEE Aspirant'
        };
        const activeTheme = localStorage.getItem('nexus_active_theme') || 'dark';
        const isMuted = localStorage.getItem('nexus_mute_notifications') === 'true';

        settingsScreen.innerHTML = `
            <div style="padding: 14px; max-width: 500px; margin: 0 auto 30px auto;">
                <!-- Card 0: Official Nexus Feature Manual -->
                <div id="nx-about-guide-btn-wrap" style="background:linear-gradient(135deg,#0f172a,#1e1b4b); border:1.5px solid #38bdf8; border-radius:18px; padding:15px; margin-bottom:14px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <div>
                            <h3 style="font-size:15px; color:#38bdf8; margin:0; font-weight:900;">📘 What is Nexus? &amp; All Features</h3>
                            <p style="font-size:11.5px; color:#cbd5e1; margin:2px 0 0 0;">Complete guide to all Nexus tools &amp; features</p>
                        </div>
                        <span style="font-size:22px;">🚀</span>
                    </div>
                    <button type="button" onclick="if(window.NexusAbout) NexusAbout.openGuide(); else if(window.NexusPower) NexusPower.openNexusGuideModal(false);" style="width:100%; background:#38bdf8; color:#020617; border:none; padding:11px 14px; border-radius:12px; font-size:13px; font-weight:900; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                        <span>📖 Open Complete Nexus Guide</span><span>→</span>
                    </button>
                </div>

                <!-- Card 1: Smooth Themes & Notification Sound Mute -->
                <div style="background:#0f172a; border:1.5px solid #6366f1; border-radius:20px; padding:16px; margin-bottom:14px;">
                    <div style="font-weight:900; font-size:15px; color:#93c5fd; margin-bottom:10px;">🎨 Smooth Eye-Friendly Themes &amp; Sound</div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:12px;">
                        ${Object.keys(THEMES).map(k => `
                            <button type="button" class="nx-theme-select-btn" data-theme="${k}" style="padding:11px 10px; border-radius:12px; border:2px solid ${activeTheme === k ? '#10b981' : '#334155'}; background:${THEMES[k].bg}; color:${THEMES[k].text}; font-weight:800; font-size:12px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                                <span>${THEMES[k].name}</span><span>${activeTheme === k ? '✔' : ''}</span>
                            </button>
                        `).join('')}
                    </div>

                    <button type="button" id="nx-settings-mute-btn" style="width:100%; padding:12px 14px; border-radius:13px; border:1px solid #38bdf8; background:#161f33; color:#f8fafc; font-weight:800; font-size:13px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
                        <span>🔔 Notification Ring Sound</span>
                        <span id="nx-settings-mute-badge" style="background:${isMuted ? '#ef4444' : '#10b981'}; color:#020617; padding:3px 10px; border-radius:999px; font-size:11px; font-weight:900;">
                            ${isMuted ? '🔇 Muted' : '🔊 Sound ON'}
                        </span>
                    </button>
                </div>

                <!-- Card 2: Account & Profile Security -->
                <div style="background:#0f172a; border:1px solid #1e293b; border-radius:20px; padding:16px; margin-bottom:14px; display:flex; flex-direction:column; gap:9px;">
                    <div style="font-weight:900; font-size:15px; color:#f8fafc; margin-bottom:2px;">👤 Account Controls (@${me.username})</div>

                    <button type="button" id="nx-set-edit-profile" style="width:100%; background:#161f33; color:#f8fafc; border:1px solid #26334d; padding:12px 14px; border-radius:13px; font-weight:700; font-size:13.5px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
                        <span>✏️ Edit Display Name &amp; Bio</span><span>→</span>
                    </button>

                    <button type="button" id="nx-set-change-pin" style="width:100%; background:#161f33; color:#f8fafc; border:1px solid #26334d; padding:12px 14px; border-radius:13px; font-weight:700; font-size:13.5px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
                        <span>🔐 Change Secret Login PIN</span><span>→</span>
                    </button>

                    <button type="button" id="nx-set-remove-dp" style="width:100%; background:#161f33; color:#fda4af; border:1px solid rgba(244,63,94,0.3); padding:12px 14px; border-radius:13px; font-weight:700; font-size:13.5px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
                        <span>🖼️ Remove Current Profile Photo</span><span>✕</span>
                    </button>

                    <button type="button" id="nx-set-logout" style="width:100%; background:rgba(234,179,8,0.12); color:#fde047; border:1px solid rgba(234,179,8,0.4); padding:12px 14px; border-radius:13px; font-weight:800; font-size:13.5px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
                        <span>🚪 Log Out of @${me.username}</span><span>→</span>
                    </button>
                </div>

                <!-- Card 3: Official App & Speed Boost -->
                <div style="background:#0f172a; border:1px solid #1e293b; border-radius:20px; padding:16px; display:flex; flex-direction:column; gap:9px;">
                    <div style="font-weight:900; font-size:15px; color:#f8fafc; margin-bottom:2px;">📲 Official App &amp; Speed Controls</div>

                    <button type="button" onclick="if(window.NexusPWA) NexusPWA.triggerInstallFlow();" style="width:100%; background:linear-gradient(90deg,#10b981,#059669); color:#020617; border:none; padding:13px 16px; border-radius:13px; font-weight:900; font-size:13.5px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
                        <span>📲 1-Click Install Official Nexus App</span><span>Install ↓</span>
                    </button>

                    <button type="button" id="nx-set-speed-boost" style="width:100%; background:#161f33; color:#38bdf8; border:1px solid #26334d; padding:12px 14px; border-radius:13px; font-weight:800; font-size:13.5px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
                        <span>⚡ 1-Tap Speed Boost (Clear Cache)</span><span>🚀</span>
                    </button>
                </div>
            </div>
        `;

        settingsScreen.querySelectorAll('.nx-theme-select-btn').forEach(btn => {
            btn.onclick = () => {
                window.applyNexusTheme(btn.dataset.theme);
                renderSettingsTab();
                if (window.Nexus && Nexus.toast) Nexus.toast(`🎨 Theme Changed!`);
            };
        });

        document.getElementById('nx-settings-mute-btn').onclick = () => {
            const nextMute = localStorage.getItem('nexus_mute_notifications') !== 'true';
            localStorage.setItem('nexus_mute_notifications', nextMute ? 'true' : 'false');
            renderSettingsTab();
            if (!nextMute && window.NexusNotify && NexusNotify.playRing) NexusNotify.playRing();
            if (window.Nexus && Nexus.toast) Nexus.toast(nextMute ? "🔇 Notifications Muted" : "🔊 Notification Sound ON");
        };

        document.getElementById('nx-set-edit-profile').onclick = async () => {
            const cur = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (!cur) return Nexus.switchTab('tab-profile');
            const newName = prompt("Apna naya Display Name likhein:", cur.name);
            if (!newName || !newName.trim()) return;
            const newBio = prompt("Apna Stream / Bio likhein (e.g. IIT-JEE Aspirant):", cur.bio || "IIT-JEE Aspirant");
            cur.name = newName.trim();
            if (newBio !== null) cur.bio = newBio.trim();
            localStorage.setItem('nx_active_account', JSON.stringify(cur));
            if (Nexus.db) {
                await Nexus.db.collection("nexus_accounts").doc(cur.username).set({
                    name: cur.name,
                    bio: cur.bio
                }, { merge: true }).catch(() => {});
            }
            if (Nexus.rebuildAllUsersMasterList) Nexus.rebuildAllUsersMasterList();
            if (Nexus.notifyAll) Nexus.notifyAll();
            renderSettingsTab();
            Nexus.toast("✅ Name & Bio Updated!");
        };

        document.getElementById('nx-set-change-pin').onclick = async () => {
            const cur = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (!cur) return Nexus.switchTab('tab-profile');
            const newPin = prompt("Apna naya Secret Login PIN dalein (kam se kam 4 digits):");
            if (newPin && newPin.trim().length >= 4) {
                cur.pin = newPin.trim();
                localStorage.setItem('nx_active_account', JSON.stringify(cur));
                if (Nexus.db) {
                    await Nexus.db.collection("nexus_accounts").doc(cur.username).set({ pin: newPin.trim() }, { merge: true }).catch(() => {});
                }
                Nexus.toast("🔐 Secret Login PIN Updated!");
            }
        };

        document.getElementById('nx-set-remove-dp').onclick = async () => {
            const cur = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (!cur) return;
            cur.dp = '';
            localStorage.setItem('nx_active_account', JSON.stringify(cur));
            localStorage.removeItem('nx_backup_my_dp_' + cur.username.toLowerCase());
            if (Nexus.db) {
                await Nexus.db.collection("nexus_accounts").doc(cur.username).set({ dp: '' }, { merge: true }).catch(() => {});
            }
            if (Nexus.notifyAll) Nexus.notifyAll();
            Nexus.toast("🖼️ Profile Photo Removed!");
        };

        document.getElementById('nx-set-logout').onclick = () => {
            if (confirm("Kya aap Log Out karna chahte hain?")) {
                localStorage.removeItem('nx_active_account');
                localStorage.removeItem('nexus_user');
                localStorage.removeItem('currentUser');
                window.location.reload();
            }
        };

        document.getElementById('nx-set-speed-boost').onclick = () => {
            if ('caches' in window) {
                caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
            }
            Nexus.toast("⚡ Cache Cleared & Speed Boosted!");
        };
    }

    document.addEventListener('DOMContentLoaded', renderSettingsTab);
    if (window.Nexus && Nexus.listeners && Nexus.listeners.onUsers) {
        Nexus.listeners.onUsers.push(renderSettingsTab);
    }
    setTimeout(renderSettingsTab, 200);
})();
// === END OF SETTINGS.JS ===
