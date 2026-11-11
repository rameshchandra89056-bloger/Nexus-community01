// ================= AIFIX.JS (v80.0 MASTER): 🔵 1-CLICK GOOGLE LOGIN + ⚡ INSTANT USERNAME LOGIN + RESTORES ALL CHAT BARS & USERS =================

(function() {
    // Load Firebase Auth v8 SDK automatically for Google Sign-In
    if (window.firebase && !firebase.auth && !document.getElementById('nx-fb-auth-v8')) {
        const sc = document.createElement('script');
        sc.id = 'nx-fb-auth-v8';
        sc.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js';
        document.head.appendChild(sc);
    }

    if (!document.getElementById('nx-aifix-v80-css')) {
        const st = document.createElement('style');
        st.id = 'nx-aifix-v80-css';
        st.innerHTML = `
            /* Always keep DM & Group Chat Input Bars visible */
            #nx-dm-composer, #nx-chat-room > div:last-child {
                display: flex !important; visibility: visible !important; opacity: 1 !important; z-index: 99999 !important;
            }
            /* Hide duplicate purple AI banner in Community Tab */
            #nx-ai-community-banner, #nx-ai-promo-card, #tab-community div[onclick*="NexusAI.openStudio"]:not(.nx-half-card) {
                display: none !important;
            }
            /* Hide Netlify promo link if any */
            a[href*="netlify.com"], iframe[src*="netlify.com"] {
                display: none !important; pointer-events: none !important;
            }
            #nx-v80-auth-modal {
                position: fixed !important; inset: 0 !important; background: rgba(2, 6, 23, 0.90) !important;
                z-index: 290000 !important; display: none; align-items: center !important; justify-content: center !important; padding: 16px !important;
            }
        `;
        document.head.appendChild(st);
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

        const gBar = document.getElementById('nx-v80-guest-bar'); if (gBar) gBar.remove();
        const pBar = document.getElementById('nx-v80-prof-bar'); if (pBar) pBar.remove();
        const hub = document.getElementById('nx-diwali-special-hub'); if (hub) hub.removeAttribute('data-role-mode');

        if (window.Nexus && Nexus.db) {
            Nexus.db.collection("nexus_accounts").doc(userObj.username).set(userObj, { merge: true }).catch(() => {});
        }
        setTimeout(() => {
            if (window.Nexus && Nexus.renderProfile) { try { Nexus.renderProfile(); } catch (e) {} }
            if (window.NexusChat && NexusChat.renderChannelCards) { try { NexusChat.renderChannelCards(); } catch (e) {} }
        }, 200);
    }

    const savedU = getLoggedUser();
    if (savedU) activateUserSession(savedU);

    function checkAndMountLoginUI() {
        const me = getLoggedUser();
        const home = document.getElementById('tab-home');
        if (!me && home && !document.getElementById('nx-v80-guest-bar')) {
            const bar = document.createElement('div');
            bar.id = 'nx-v80-guest-bar';
            bar.style.cssText = 'margin:8px 12px; padding:12px 14px; background:linear-gradient(135deg,#0f172a,#1e3a8a); border:1.5px solid #38bdf8; border-radius:16px; display:flex; align-items:center; justify-content:space-between; gap:10px;';
            bar.innerHTML = `
                <div>
                    <div style="font-size:13px; font-weight:900; color:#fff;">👋 Welcome to Nexus Vercel Live!</div>
                    <div style="font-size:11px; color:#93c5fd; font-weight:700;">Login with Google or your Username (@mohiy)</div>
                </div>
                <button type="button" onclick="NexusGoogleAuth.openModal()" style="background:#fff; color:#0f172a; border:none; padding:8px 13px; border-radius:12px; font-size:12px; font-weight:900; cursor:pointer; display:flex; align-items:center; gap:6px; flex-shrink:0;">
                    <span style="color:#ea4335; font-weight:900; font-size:14px;">G</span> <span>Login →</span>
                </button>
            `;
            home.insertBefore(bar, home.firstChild);
        }

        const prof = document.getElementById('tab-profile');
        if (!me && prof && !document.getElementById('nx-v80-prof-bar')) {
            const wrap = document.createElement('div');
            wrap.id = 'nx-v80-prof-bar';
            wrap.style.cssText = 'padding:12px;';
            wrap.innerHTML = `
                <button type="button" onclick="NexusGoogleAuth.openModal()" style="width:100%; background:#ffffff; color:#0f172a; border:2px solid #38bdf8; padding:12px; border-radius:14px; font-size:14px; font-weight:900; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                    <span style="font-size:17px; font-weight:900; color:#ea4335;">G</span> <span>Sign in with Google / Username</span>
                </button>
            `;
            prof.insertBefore(wrap, prof.firstChild);
        }
    }

    window.NexusGoogleAuth = {
        openModal: function() {
            let m = document.getElementById('nx-v80-auth-modal');
            if (!m) {
                m = document.createElement('div');
                m.id = 'nx-v80-auth-modal';
                m.onclick = e => { if (e.target === m) m.style.display = 'none'; };
                document.body.appendChild(m);
            }
            m.innerHTML = `
                <div style="width:100%; max-width:355px; background:#111827; border:2px solid #38bdf8; border-radius:22px; padding:18px; color:#fff; box-shadow:0 20px 60px rgba(0,0,0,0.95);" onclick="event.stopPropagation();">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <strong style="font-size:16px; color:#38bdf8;">🔐 Login / Join Nexus</strong>
                        <button type="button" onclick="document.getElementById('nx-v80-auth-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>

                    <button type="button" onclick="NexusGoogleAuth.signInWithGoogleNow()" style="width:100%; background:#ffffff; color:#0f172a; border:none; padding:12px; border-radius:12px; font-size:13.5px; font-weight:900; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:14px;">
                        <span style="font-size:17px; font-weight:900; color:#ea4335;">G</span>
                        <span>Continue with Google (1-Click)</span>
                    </button>

                    <div style="text-align:center; font-size:11px; color:#64748b; font-weight:800; margin-bottom:10px;">— OR LOGIN WITH USERNAME —</div>

                    <input type="text" id="nx-v80-name" placeholder="Full Name (e.g. Mohit_01)" style="width:100%; padding:10px 12px; border-radius:10px; border:1px solid #334155; background:#090d16; color:#fff; font-size:13px; margin-bottom:8px; outline:none;">
                    <input type="text" id="nx-v80-uname" placeholder="Username (e.g. mohiy)" style="width:100%; padding:10px 12px; border-radius:10px; border:1px solid #334155; background:#090d16; color:#fff; font-size:13px; margin-bottom:12px; outline:none;">
                    <button type="button" onclick="NexusGoogleAuth.quickUsernameLogin()" style="width:100%; background:#10b981; color:#020617; border:none; padding:11px; border-radius:12px; font-size:13.5px; font-weight:900; cursor:pointer;">🚀 Instant Login / Restore Account</button>
                </div>
            `;
            m.style.display = 'flex';
        },

        signInWithGoogleNow: async function() {
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
                document.getElementById('nx-v80-auth-modal').style.display = 'none';
                if (window.Nexus && Nexus.toast) Nexus.toast(`🎉 Welcome ${prof.name}!`);
            } catch (e) {
                alert("Note: To use Google Popup on nexus-community01.vercel.app, add 'nexus-community01.vercel.app' in Firebase Console -> Authentication -> Settings -> Authorized domains. Until then, type your username below and tap Instant Login!");
            }
        },

        quickUsernameLogin: async function() {
            const nameIn = (document.getElementById('nx-v80-name')?.value || '').trim();
            const rawU = (document.getElementById('nx-v80-uname')?.value || '').trim().replace(/^@/, '').toLowerCase();
            if (!rawU) { alert("Please enter your username!"); return; }

            let userProfile = {
                username: rawU,
                name: nameIn || rawU,
                bio: 'IIT-JEE Aspirant',
                dp: '',
                verified: rawU === 'mohiy' || rawU === 'nexus_official',
                isOnlineNow: true,
                lastOnline: Date.now()
            };

            // Fetch existing profile from Firestore if present
            if (window.Nexus && Nexus.db) {
                try {
                    const doc = await Nexus.db.collection("nexus_accounts").doc(rawU).get();
                    if (doc && doc.exists) {
                        userProfile = Object.assign({}, doc.data(), { username: rawU, isOnlineNow: true });
                    }
                } catch (e) {}
            }

            activateUserSession(userProfile);
            document.getElementById('nx-v80-auth-modal').style.display = 'none';
            if (window.Nexus && Nexus.toast) Nexus.toast(`🎉 Logged in as ${userProfile.name} (@${rawU})!`);
        }
    };

    checkAndMountLoginUI();
    setInterval(checkAndMountLoginUI, 500);
})();
// === END OF AIFIX.JS ===
