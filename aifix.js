// ================= AIFIX.JS (v90.0 MASTER): 📌 LOCKS BOTTOM NAV BAR TO BOTTOM (1000075584.jpg & 1000075585.jpg FIX) + 🗂️ RESTORES 4-CARD COMMUNITY GRID + 🔵 GOOGLE & INSTANT LOGIN WITH ACTIVE FIREBASE PROJECT ID =================

(function() {
    // 1. Auto-load Firebase Auth v8 SDK for Google Login
    if (window.firebase && !firebase.auth && !document.getElementById('nx-fb-auth-v8')) {
        const sc = document.createElement('script');
        sc.id = 'nx-fb-auth-v8';
        sc.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js';
        document.head.appendChild(sc);
    }

    if (!document.getElementById('nx-aifix-v90-css')) {
        const st = document.createElement('style');
        st.id = 'nx-aifix-v90-css';
        st.innerHTML = `
            /* 1. PREVENT TRANSFORM/FILTER ON ROOT SO FIXED BOTTOM BAR NEVER FLOATS IN MIDDLE OF SCREEN! */
            html, body, #app, .app-container, main {
                transform: none !important;
                filter: none !important;
                perspective: none !important;
            }
            body {
                padding-bottom: 72px !important;
            }

            /* 2. PIN BOTTOM NAVIGATION BAR STRICTLY TO THE VERY BOTTOM (FIXES 1000075584.jpg & 1000075585.jpg!) */
            nav, .bottom-nav, .nx-bottom-nav, #bottom-nav, #nx-bottom-nav, [data-nx-bottom-bar="1"] {
                position: fixed !important;
                bottom: 0px !important;
                top: auto !important;
                left: 0px !important;
                right: 0px !important;
                width: 100% !important;
                max-width: 640px !important;
                margin: 0 auto !important;
                z-index: 99990 !important;
                transform: none !important;
            }

            /* 3. KEEP DM & GROUP CHAT MESSAGE INPUT BARS VISIBLE AT BOTTOM OF CHAT */
            #nx-dm-composer, #nx-chat-room > div:last-child {
                display: flex !important;
                visibility: visible !important;
                opacity: 1 !important;
                z-index: 99999 !important;
            }

            /* 4. HIDE DUPLICATE AI BANNERS & OLD 2-BUTTON ROW IN COMMUNITY TAB */
            #nx-ai-community-banner,
            #nx-ai-promo-card,
            #tab-community div[onclick*="NexusAI.openStudio"]:not(.nx-half-card) {
                display: none !important;
            }

            #nx-v90-auth-modal {
                position: fixed !important; inset: 0 !important;
                background: rgba(2, 6, 23, 0.92) !important;
                z-index: 290000 !important; display: none;
                align-items: center !important; justify-content: center !important; padding: 16px !important;
            }
        `;
        document.head.appendChild(st);
    }

    // Automatically detect the Bottom Bar (with Home, Chat, +, Profile, Settings) and lock it to bottom: 0px!
    function lockBottomNavBarToBottom() {
        document.querySelectorAll('nav, div, footer').forEach(el => {
            if (el.id === 'nx-dm-dedicated-root' || el.id === 'nx-chat-room' || el.id === 'tab-home' || el.id === 'tab-community') return;
            const html = el.innerHTML || '';
            if (
                (html.includes('tab-home') && html.includes('tab-community') && html.includes('tab-profile')) ||
                (el.children && el.children.length === 5 && el.querySelector('svg') && el.offsetHeight > 42 && el.offsetHeight < 95)
            ) {
                el.setAttribute('data-nx-bottom-bar', '1');
                el.style.setProperty('position', 'fixed', 'important');
                el.style.setProperty('bottom', '0px', 'important');
                el.style.setProperty('top', 'auto', 'important');
                el.style.setProperty('left', '0px', 'important');
                el.style.setProperty('right', '0px', 'important');
                el.style.setProperty('z-index', '99990', 'important');
            }
        });
    }

    // Restore Clean 4-Card Grid in Community Tab & Hide Old 2-Button Duplicate Row (Fixes 1000075585.jpg!)
    function restoreCleanFourCardGrid() {
        const banner = document.getElementById('nx-dm-inbox-banner');
        if (banner && !document.getElementById('nx-structured-4card-grid')) {
            banner.innerHTML = `
                <div id="nx-structured-4card-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; width:100%; margin-bottom:4px;">
                    <div class="nx-half-card" onclick="if(window.NexusDmInbox) NexusDmInbox.openFullScreenDmHub(); else if(window.NexusDM) NexusDM.openInboxModal();" style="background:#111827; border:1.5px solid #10b981; border-radius:18px; padding:13px; cursor:pointer;">
                        <div style="font-size:20px;">💬</div>
                        <div style="font-size:13.5px; font-weight:900; color:#f8fafc; margin-top:6px;">1:1 Personal DM</div>
                        <div style="font-size:10.5px; color:#6ee7b7; font-weight:700; margin-top:2px;">Friends • Calls &amp; DJ →</div>
                    </div>
                    <div class="nx-half-card" onclick="if(window.NexusAI) NexusAI.openStudio();" style="background:#111827; border:1.5px solid #a78bfa; border-radius:18px; padding:13px; cursor:pointer;">
                        <div style="font-size:20px;">🤖</div>
                        <div style="font-size:13.5px; font-weight:900; color:#f8fafc; margin-top:6px;">Private AI Studio</div>
                        <div style="font-size:10.5px; color:#d8b4fe; font-weight:700; margin-top:2px;">Swara • Image Gen →</div>
                    </div>
                    <div class="nx-half-card" onclick="if(window.NexusCards) NexusCards.openChallengerApp(); else if(window.NexusChat) NexusChat.openLiveTestSeries();" style="background:#111827; border:1.5px solid #f59e0b; border-radius:18px; padding:13px; cursor:pointer;">
                        <div style="font-size:20px;">📝</div>
                        <div style="font-size:13.5px; font-weight:900; color:#f8fafc; margin-top:6px;">Live Test Series</div>
                        <div style="font-size:10.5px; color:#fde047; font-weight:700; margin-top:2px;">JEE / NEET Arena →</div>
                    </div>
                    <div class="nx-half-card" onclick="if(window.NexusCards) NexusCards.openPdfVaultApp(); else if(window.NexusChat) NexusChat.openPdfVaultModal();" style="background:#111827; border:1.5px solid #38bdf8; border-radius:18px; padding:13px; cursor:pointer;">
                        <div style="font-size:20px;">📚</div>
                        <div style="font-size:13.5px; font-weight:900; color:#f8fafc; margin-top:6px;">PDF Study Vault</div>
                        <div style="font-size:10.5px; color:#38bdf8; font-weight:700; margin-top:2px;">Notes, Books &amp; PYQs →</div>
                    </div>
                </div>
            `;
        }
        // Hide the old 2-button row (#nx-music-btn parent) in #nx-chat-directory so cards aren't duplicated
        const oldMusicBtn = document.getElementById('nx-music-btn');
        if (oldMusicBtn && oldMusicBtn.parentElement && oldMusicBtn.parentElement.id !== 'nx-structured-4card-grid') {
            oldMusicBtn.parentElement.style.setProperty('display', 'none', 'important');
        }
    }

    function getActiveFirebaseProjectId() {
        try {
            if (window.firebase && firebase.app && firebase.app().options && firebase.app().options.projectId) {
                return firebase.app().options.projectId;
            }
        } catch (e) {}
        return 'nexus-community';
    }

    function getLoggedUser() {
        try { if (window.Nexus && Nexus.getCurrentUser) { let u = Nexus.getCurrentUser(); if (u && u.username) return u; } } catch (e) {}
        try {
            let raw = localStorage.getItem('nexus_current_user') || localStorage.getItem('nexus_user') || localStorage.getItem('nx_user');
            if (raw) { let p = JSON.parse(raw); if (p && p.username) return p; }
        } catch (e) {}
        return null;
    }

    function activateUserSession(userObj) {
        if (!userObj || !userObj.username) return;
        const raw = JSON.stringify(userObj);
        try {
            localStorage.setItem('nexus_current_user', raw);
            localStorage.setItem('nexus_user', raw);
            localStorage.setItem('nx_user', raw);
            localStorage.setItem('currentUser', raw);
        } catch (e) {}

        if (window.Nexus) {
            Nexus.currentUser = userObj;
            Nexus.getCurrentUser = () => userObj;
            if (!Array.isArray(Nexus.users)) Nexus.users = [];
            const idx = Nexus.users.findIndex(u => u && u.username && u.username.toLowerCase() === userObj.username.toLowerCase());
            if (idx >= 0) Nexus.users[idx] = Object.assign({}, Nexus.users[idx], userObj);
            else Nexus.users.unshift(userObj);
        }

        const gBar = document.getElementById('nx-v90-guest-bar'); if (gBar) gBar.remove();
        const pBar = document.getElementById('nx-v90-prof-bar'); if (pBar) pBar.remove();
        const hub = document.getElementById('nx-diwali-special-hub'); if (hub) hub.removeAttribute('data-role-mode');

        if (window.Nexus && Nexus.db) {
            Nexus.db.collection("nexus_accounts").doc(userObj.username).set(userObj, { merge: true }).catch(() => {});
        }
        setTimeout(() => {
            if (window.Nexus && Nexus.renderProfile) { try { Nexus.renderProfile(); } catch (e) {} }
            if (window.NexusChat && NexusChat.renderChannelCards) { try { NexusChat.renderChannelCards(); } catch (e) {} }
        }, 150);
    }

    const savedU = getLoggedUser();
    if (savedU) activateUserSession(savedU);

    function checkAndMountLoginUI() {
        const me = getLoggedUser();
        const home = document.getElementById('tab-home');
        if (!me && home && !document.getElementById('nx-v90-guest-bar')) {
            const bar = document.createElement('div');
            bar.id = 'nx-v90-guest-bar';
            bar.style.cssText = 'margin:8px 12px; padding:11px 14px; background:linear-gradient(135deg,#0f172a,#1e3a8a); border:1.5px solid #38bdf8; border-radius:16px; display:flex; align-items:center; justify-content:space-between; gap:10px;';
            bar.innerHTML = `
                <div>
                    <div style="font-size:13px; font-weight:900; color:#fff;">👋 Welcome to Nexus Live!</div>
                    <div style="font-size:11px; color:#93c5fd; font-weight:700;">Tap Login to restore your chats &amp; account</div>
                </div>
                <button type="button" onclick="NexusGoogleAuth.openModal()" style="background:#fff; color:#0f172a; border:none; padding:8px 13px; border-radius:12px; font-size:12px; font-weight:900; cursor:pointer; display:flex; align-items:center; gap:6px; flex-shrink:0;">
                    <span style="color:#ea4335; font-weight:900; font-size:14px;">G</span> <span>Login →</span>
                </button>
            `;
            home.insertBefore(bar, home.firstChild);
        }
    }

    window.NexusGoogleAuth = {
        openModal: function() {
            let m = document.getElementById('nx-v90-auth-modal');
            if (!m) {
                m = document.createElement('div');
                m.id = 'nx-v90-auth-modal';
                m.onclick = e => { if (e.target === m) m.style.display = 'none'; };
                document.body.appendChild(m);
            }
            const activePid = getActiveFirebaseProjectId();
            m.innerHTML = `
                <div style="width:100%; max-width:355px; background:#111827; border:2px solid #38bdf8; border-radius:22px; padding:18px; color:#fff; box-shadow:0 20px 60px rgba(0,0,0,0.95);" onclick="event.stopPropagation();">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <strong style="font-size:16px; color:#38bdf8;">🔐 Login / Join Nexus</strong>
                        <button type="button" onclick="document.getElementById('nx-v90-auth-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>
                    <div style="font-size:10.5px; color:#6ee7b7; background:rgba(16,185,129,0.12); border:1px solid #10b981; padding:5px 9px; border-radius:8px; margin-bottom:12px;">
                        🔥 Active Firebase Project: <b>${activePid}</b>
                    </div>

                    <button type="button" onclick="NexusGoogleAuth.signInWithGoogleNow()" style="width:100%; background:#ffffff; color:#0f172a; border:none; padding:12px; border-radius:12px; font-size:13.5px; font-weight:900; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:12px;">
                        <span style="font-size:17px; font-weight:900; color:#ea4335;">G</span>
                        <span>Continue with Google (1-Click)</span>
                    </button>

                    <div id="nx-google-err-box" style="display:none; background:#450a0a; border:1px solid #ef4444; color:#fecaca; font-size:11px; padding:8px 10px; border-radius:10px; margin-bottom:10px; line-height:1.4;"></div>

                    <div style="text-align:center; font-size:11px; color:#64748b; font-weight:800; margin-bottom:8px;">— OR INSTANT USERNAME LOGIN —</div>

                    <input type="text" id="nx-v90-name" placeholder="Full Name (e.g. Mohit_01)" style="width:100%; padding:10px 12px; border-radius:10px; border:1px solid #334155; background:#090d16; color:#fff; font-size:13px; margin-bottom:8px; outline:none;">
                    <input type="text" id="nx-v90-uname" placeholder="Username (e.g. mohiy)" style="width:100%; padding:10px 12px; border-radius:10px; border:1px solid #334155; background:#090d16; color:#fff; font-size:13px; margin-bottom:12px; outline:none;">
                    <button type="button" onclick="NexusGoogleAuth.quickUsernameLogin()" style="width:100%; background:#10b981; color:#020617; border:none; padding:11px; border-radius:12px; font-size:13.5px; font-weight:900; cursor:pointer;">🚀 Instant Login / Restore Account</button>
                </div>
            `;
            m.style.display = 'flex';
        },

        signInWithGoogleNow: async function() {
            const activePid = getActiveFirebaseProjectId();
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                const res = await firebase.auth().signInWithPopup(provider);
                const gu = res.user;
                if (!gu) return;
                const uname = String(gu.email || 'user').split('@')[0].replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
                const prof = {
                    username: uname,
                    name: gu.displayName || uname,
                    email: gu.email || '',
                    dp: gu.photoURL || '',
                    bio: 'IIT-JEE & Nexus Verified Student',
                    verified: true,
                    isOnlineNow: true,
                    lastOnline: Date.now()
                };
                activateUserSession(prof);
                document.getElementById('nx-v90-auth-modal').style.display = 'none';
                if (window.Nexus && Nexus.toast) Nexus.toast(`🎉 Signed in as ${prof.name}!`);
            } catch (e) {
                const errBox = document.getElementById('nx-google-err-box');
                if (errBox) {
                    errBox.style.display = 'block';
                    errBox.innerHTML = `⚡ In Firebase Console, open project <b>${activePid}</b> ➔ <b>Authentication</b> ➔ <b>Sign-in method</b> (Enable Google) &amp; <b>Settings ➔ Authorized domains</b> (Add <b>nexus-community01.vercel.app</b>).<br>👇 Or type <b>mohiy</b> below for Instant Login right now!`;
                }
            }
        },

        quickUsernameLogin: async function() {
            const nameIn = (document.getElementById('nx-v90-name')?.value || '').trim();
            const rawU = (document.getElementById('nx-v90-uname')?.value || '').trim().replace(/^@/, '').toLowerCase();
            if (!rawU) return;

            let userProfile = {
                username: rawU,
                name: nameIn || rawU,
                bio: 'IIT-JEE Aspirant',
                dp: '',
                verified: rawU === 'mohiy' || rawU === 'nexus_official',
                isOnlineNow: true,
                lastOnline: Date.now()
            };

            if (window.Nexus && Nexus.db) {
                try {
                    const doc = await Nexus.db.collection("nexus_accounts").doc(rawU).get();
                    if (doc && doc.exists) {
                        userProfile = Object.assign({}, doc.data(), { username: rawU, isOnlineNow: true });
                    }
                } catch (e) {}
            }

            activateUserSession(userProfile);
            document.getElementById('nx-v90-auth-modal').style.display = 'none';
            if (window.Nexus && Nexus.toast) Nexus.toast(`🎉 Welcome back ${userProfile.name} (@${rawU})!`);
        }
    };

    lockBottomNavBarToBottom();
    restoreCleanFourCardGrid();
    checkAndMountLoginUI();
    setInterval(() => {
        lockBottomNavBarToBottom();
        restoreCleanFourCardGrid();
        checkAndMountLoginUI();
    }, 350);
})();
// === END OF AIFIX.JS ===
