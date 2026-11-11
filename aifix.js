// ================= AIFIX.JS (v96.0 MASTER): 🔓 PASSWORDLESS OLD ACCOUNT RECOVERY + 👀 GUEST REAL-DB VIEW (LOGIN ONLY ON SEND/POST) + 📌 BOTTOM BAR LOCK + 🔵 GOOGLE LOGIN =================

(function() {
    // 1. Inject Google Search Console Verification Tag in Head too
    if (!document.querySelector('meta[name="google-site-verification"]')) {
        const meta = document.createElement('meta');
        meta.name = 'google-site-verification';
        meta.content = 'St-XEDZblKFItxe1p0K3Wrinq22wuVgi0_cSYmJ4d-4';
        document.head.insertBefore(meta, document.head.firstChild);
    }

    // 2. Auto-load Firebase Auth v8 SDK for Google Login
    if (window.firebase && !firebase.auth && !document.getElementById('nx-fb-auth-v8')) {
        const sc = document.createElement('script');
        sc.id = 'nx-fb-auth-v8';
        sc.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js';
        document.head.appendChild(sc);
    }

    if (!document.getElementById('nx-aifix-v96-css')) {
        const st = document.createElement('style');
        st.id = 'nx-aifix-v96-css';
        st.innerHTML = `
            html, body, #app, .app-container, main {
                transform: none !important; filter: none !important; perspective: none !important;
            }
            body { padding-bottom: 72px !important; }

            /* Lock Bottom Navigation Bar Strictly to Bottom */
            nav, .bottom-nav, .nx-bottom-nav, #bottom-nav, #nx-bottom-nav, [data-nx-bottom-bar="1"] {
                position: fixed !important; bottom: 0px !important; top: auto !important;
                left: 0px !important; right: 0px !important; width: 100% !important;
                max-width: 640px !important; margin: 0 auto !important;
                z-index: 99990 !important; transform: none !important;
            }

            /* Keep Chat Input Bars Visible */
            #nx-dm-composer, #nx-chat-room > div:last-child {
                display: flex !important; visibility: visible !important; opacity: 1 !important; z-index: 99999 !important;
            }

            /* Hide Duplicate Purple AI Banner */
            #nx-ai-community-banner, #nx-ai-promo-card,
            #tab-community div[onclick*="NexusAI.openStudio"]:not(.nx-half-card) {
                display: none !important;
            }

            #nx-v96-auth-modal {
                position: fixed !important; inset: 0 !important;
                background: rgba(2, 6, 23, 0.92) !important;
                z-index: 290000 !important; display: none;
                align-items: center !important; justify-content: center !important; padding: 16px !important;
            }
        `;
        document.head.appendChild(st);
    }

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
        const oldMusicBtn = document.getElementById('nx-music-btn');
        if (oldMusicBtn && oldMusicBtn.parentElement && oldMusicBtn.parentElement.id !== 'nx-structured-4card-grid') {
            oldMusicBtn.parentElement.style.setProperty('display', 'none', 'important');
        }
    }

    function getLoggedUser() {
        try {
            let raw = localStorage.getItem('nexus_current_user') || localStorage.getItem('nexus_user') || localStorage.getItem('nx_user');
            if (raw) {
                let p = JSON.parse(raw);
                if (p && p.username && p.username !== 'guest') return p;
            }
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

        const gBar = document.getElementById('nx-v96-guest-bar'); if (gBar) gBar.remove();
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

    // Intercept Send Message / Create Post if Guest (Not Logged In) — Let them browse everything freely first!
    function guardGuestActionsOnlyOnSend() {
        const me = getLoggedUser();
        const home = document.getElementById('tab-home');

        if (!me && home && !document.getElementById('nx-v96-guest-bar')) {
            const bar = document.createElement('div');
            bar.id = 'nx-v96-guest-bar';
            bar.style.cssText = 'margin:8px 12px; padding:11px 14px; background:linear-gradient(135deg,#0f172a,#1e3a8a); border:1.5px solid #38bdf8; border-radius:16px; display:flex; align-items:center; justify-content:space-between; gap:10px;';
            bar.innerHTML = `
                <div>
                    <div style="font-size:12.5px; font-weight:900; color:#fff;">🔓 Purana Account Logout Ho Gaya?</div>
                    <div style="font-size:10.5px; color:#93c5fd; font-weight:700;">Bina password ke 1-Click mein apni ID wapas kholein!</div>
                </div>
                <button type="button" onclick="NexusGoogleAuth.openModal()" style="background:#10b981; color:#020617; border:none; padding:8px 12px; border-radius:12px; font-size:11.5px; font-weight:900; cursor:pointer; flex-shrink:0;">
                    🔐 Login / Recover →
                </button>
            `;
            home.insertBefore(bar, home.firstChild);
        }

        // If user is a Guest and taps Chat Input or Send button, open Login Modal smoothly
        if (!me) {
            ['#nx-chat-msg-in', '#nx-dm-input'].forEach(sel => {
                const inp = document.querySelector(sel);
                if (inp && !inp.getAttribute('data-guest-guard')) {
                    inp.setAttribute('data-guest-guard', '1');
                    inp.addEventListener('focus', () => {
                        if (!getLoggedUser()) {
                            inp.blur();
                            NexusGoogleAuth.openModal('💬 Message bhejne ke liye 1-Click mein Login ya Account Recover karein!');
                        }
                    });
                }
            });
        }
    }

    window.NexusGoogleAuth = {
        openModal: function(customSubtitle) {
            let m = document.getElementById('nx-v96-auth-modal');
            if (!m) {
                m = document.createElement('div');
                m.id = 'nx-v96-auth-modal';
                m.onclick = e => { if (e.target === m) m.style.display = 'none'; };
                document.body.appendChild(m);
            }

            // Build dropdown of existing users so old users can recover account in 1 tap WITHOUT password!
            const knownUsers = (window.Nexus && Array.isArray(Nexus.users) ? Nexus.users : []).filter(u =>
                u && u.username && u.username !== 'guest' && u.username !== 'nexus_official'
            );
            const userOptions = knownUsers.map(u => `<option value="${u.username}">${u.name || u.username} (@${u.username})</option>`).join('');

            m.innerHTML = `
                <div style="width:100%; max-width:365px; background:#111827; border:2px solid #10b981; border-radius:22px; padding:18px; color:#fff; box-shadow:0 20px 60px rgba(0,0,0,0.95);" onclick="event.stopPropagation();">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                        <strong style="font-size:16px; color:#10b981;">🔐 1-Click Login &amp; ID Recovery</strong>
                        <button type="button" onclick="document.getElementById('nx-v96-auth-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>
                    <div style="font-size:11.5px; color:#fde047; font-weight:700; margin-bottom:12px;">
                        ${customSubtitle || '✨ Password bhool gaye? Apni purani ID chunein ya Google se 1-Click Login karein!'}
                    </div>

                    <!-- OPTION 1: 1-CLICK GOOGLE LOGIN -->
                    <button type="button" onclick="NexusGoogleAuth.signInWithGoogleNow()" style="width:100%; background:#ffffff; color:#0f172a; border:none; padding:11px; border-radius:12px; font-size:13.5px; font-weight:900; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:12px;">
                        <span style="font-size:17px; font-weight:900; color:#ea4335;">G</span>
                        <span>Continue with Google (1-Click)</span>
                    </button>

                    <!-- OPTION 2: OLD USERS 1-TAP RECOVERY (NO PASSWORD NEEDED!) -->
                    <div style="background:#090d16; border:1px solid #334155; border-radius:14px; padding:10px; margin-bottom:10px;">
                        <label style="font-size:11px; font-weight:900; color:#38bdf8; display:block; margin-bottom:5px;">🔄 Purane Users Apni ID Yahan Se Chunein (No Password):</label>
                        <select id="nx-v96-existing-select" onchange="if(this.value){document.getElementById('nx-v96-uname').value=this.value;}" style="width:100%; padding:9px; border-radius:9px; border:1px solid #38bdf8; background:#111827; color:#fff; font-size:12.5px; font-weight:800; outline:none; margin-bottom:8px;">
                            <option value="">-- Apna Purana Account Chunein --</option>
                            ${userOptions}
                        </select>
                        <input type="text" id="nx-v96-uname" placeholder="Ya apna @username likhein (e.g. mohiy, raghu)" style="width:100%; padding:9px 11px; border-radius:9px; border:1px solid #334155; background:#111827; color:#fff; font-size:13px; margin-bottom:8px; outline:none;">
                        <input type="text" id="nx-v96-name" placeholder="Full Name (Naye users ke liye)" style="width:100%; padding:9px 11px; border-radius:9px; border:1px solid #334155; background:#111827; color:#fff; font-size:13px; outline:none;">
                    </div>

                    <button type="button" onclick="NexusGoogleAuth.quickUsernameLogin()" style="width:100%; background:linear-gradient(135deg,#10b981,#059669); color:#020617; border:none; padding:12px; border-radius:12px; font-size:13.5px; font-weight:900; cursor:pointer;">🚀 Recover ID / Instant Login →</button>
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
                document.getElementById('nx-v96-auth-modal').style.display = 'none';
                if (window.Nexus && Nexus.toast) Nexus.toast(`🎉 Signed in as ${prof.name}!`);
            } catch (e) {
                if (window.Nexus && Nexus.toast) Nexus.toast("⚡ Niche list se apna username chunein aur Instant Login dabayein!");
            }
        },

        quickUsernameLogin: async function() {
            const selU = (document.getElementById('nx-v96-existing-select')?.value || '').trim();
            const typedU = (document.getElementById('nx-v96-uname')?.value || '').trim();
            const nameIn = (document.getElementById('nx-v96-name')?.value || '').trim();
            const rawU = (typedU || selU).replace(/^@/, '').replace(/\s+/g, '_').toLowerCase();

            if (!rawU) {
                alert("Kripya list se apna naam chunein ya username likhein!");
                return;
            }

            let userProfile = {
                username: rawU,
                name: nameIn || rawU,
                bio: 'IIT-JEE Aspirant',
                dp: '',
                verified: rawU === 'mohiy' || rawU === 'nexus_official',
                isOnlineNow: true,
                lastOnline: Date.now()
            };

            // Check memory & Firestore to restore exact old profile (DP, Name, Bio) without needing password!
            if (window.Nexus && Array.isArray(Nexus.users)) {
                const found = Nexus.users.find(u => u && u.username && u.username.toLowerCase() === rawU);
                if (found) userProfile = Object.assign({}, found, { isOnlineNow: true, lastOnline: Date.now() });
            }
            if (window.Nexus && Nexus.db) {
                try {
                    const doc = await Nexus.db.collection("nexus_accounts").doc(rawU).get();
                    if (doc && doc.exists) {
                        userProfile = Object.assign({}, doc.data(), { username: rawU, isOnlineNow: true, lastOnline: Date.now() });
                    }
                } catch (e) {}
            }

            activateUserSession(userProfile);
            document.getElementById('nx-v96-auth-modal').style.display = 'none';
            if (window.Nexus && Nexus.toast) Nexus.toast(`🎉 Welcome back ${userProfile.name} (@${rawU})!`);
        }
    };

    lockBottomNavBarToBottom();
    restoreCleanFourCardGrid();
    guardGuestActionsOnlyOnSend();
    setInterval(() => {
        lockBottomNavBarToBottom();
        restoreCleanFourCardGrid();
        guardGuestActionsOnlyOnSend();
    }, 400);
})();
// === END OF AIFIX.JS ===
/* ==========================================================
   NEXUS DEEP FIX: INSTANT POSTER, BADGE REMOVER, LOADER & APP
   ========================================================== */

(function() {
    const NEW_VERCEL_URL = "https://nexus-community01.vercel.app";

    // Helper: Bina DOMContentLoaded ka wait kiye turant code chalane ke liye
    function runImmediately(callback) {
        if (document.body) {
            callback();
        } else {
            const timer = setInterval(() => {
                if (document.body) {
                    clearInterval(timer);
                    callback();
                }
            }, 30);
        }
    }

    // 1. "Powered by Netlify" BADGE HATAO (Jo niche chat/+ button chhupa raha hai)
    const hideNetlifyBadge = () => {
        const style = document.createElement("style");
        style.innerHTML = `
            a[href*="netlify.com"], 
            iframe[src*="netlify"], 
            div[class*="netlify"],
            #netlify-badge {
                display: none !important;
                opacity: 0 !important;
                pointer-events: none !important;
                visibility: hidden !important;
            }
        `;
        document.head.appendChild(style);

        // Text se dhoondh kar bhi "Powered by Netlify" hatao
        document.querySelectorAll("a, div, span, button").forEach(el => {
            if ((el.innerText || "").trim() === "Powered by Netlify") {
                el.style.setProperty("display", "none", "important");
                if (el.parentElement && el.parentElement.innerText.trim() === "Powered by Netlify") {
                    el.parentElement.style.setProperty("display", "none", "important");
                }
            }
        });
    };
    runImmediately(hideNetlifyBadge);
    setInterval(hideNetlifyBadge, 1500);

    // 2. NETLIFY LINK PAR TURANT ENERGETIC POSTER DIKHAO
    if (window.location.hostname.includes("netlify.app")) {
        runImmediately(() => {
            if (document.getElementById("nx-migration-poster")) return;
            const poster = document.createElement("div");
            poster.id = "nx-migration-poster";
            poster.style.cssText = `
                position: fixed; inset: 0; z-index: 2147483647;
                background: radial-gradient(circle at top, #1e1b4b, #090d16 80%);
                display: flex; flex-direction: column; align-items: center;
                justify-content: center; padding: 24px; text-align: center;
                color: #ffffff; font-family: system-ui, sans-serif;
            `;
            poster.innerHTML = `
                <div style="background: rgba(15,23,42,0.85); border: 2px solid #6366f1; border-radius: 24px; padding: 32px 22px; max-width: 370px; width: 100%; box-shadow: 0 0 50px rgba(99,102,241,0.4);">
                    <div style="font-size: 52px; margin-bottom: 10px;">⚡</div>
                    <h1 style="font-size: 25px; font-weight: 800; margin: 0 0 12px; color: #fff;">
                        Nexus Naye Server Par Shift Ho Gaya Hai!
                    </h1>
                    <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
                        Purane Netlify link par chat aur DM band kar diye gaye hain. Bina kisi problem ke superfast DM, Voice Chat aur Live Feed chalane ke liye niche button dabayein!
                    </p>
                    <a href="${NEW_VERCEL_URL}" style="display: block; background: linear-gradient(90deg, #4f46e5, #9333ea); color: #fff; text-decoration: none; padding: 15px 20px; border-radius: 14px; font-weight: 800; font-size: 16px; box-shadow: 0 8px 25px rgba(147,51,234,0.5);">
                        🚀 Open New Nexus Website
                    </a>
                </div>
            `;
            document.body.appendChild(poster);
        });
        return;
    }

    // 3. SLOW INTERNET BLACK SCREEN FIX (Instant Loader)
    runImmediately(() => {
        if (document.getElementById("nexus-instant-loader")) return;
        const loader = document.createElement("div");
        loader.id = "nexus-instant-loader";
        loader.style.cssText = `
            position: fixed; top: 58px; bottom: 68px; left: 0; right: 0;
            background: #0b0f19; z-index: 998; display: flex;
            flex-direction: column; align-items: center; justify-content: center;
            color: #e2e8f0; font-family: system-ui, sans-serif; transition: opacity 0.3s ease;
        `;
        loader.innerHTML = `
            <div style="width: 42px; height: 42px; border: 4px solid rgba(99,102,241,0.2); border-top-color: #6366f1; border-radius: 50%; animation: nxSpinFast 0.7s linear infinite;"></div>
            <p style="margin-top: 12px; font-size: 14px; font-weight: 600;">Loading Nexus Feed...</p>
            <style>@keyframes nxSpinFast { to { transform: rotate(360deg); } }</style>
        `;
        document.body.appendChild(loader);

        const removeLoader = () => {
            const el = document.getElementById("nexus-instant-loader");
            if (el) {
                el.style.opacity = "0";
                setTimeout(() => el.remove(), 300);
            }
        };
        window.addEventListener("load", () => setTimeout(removeLoader, 500));
        setTimeout(removeLoader, 3500);
    });

    // 4. WHATSAPP INVITE LINK SECURITY (Koi dusre ka account open nahi kar payega)
    const params = new URLSearchParams(window.location.search);
    if (params.has("user") || params.has("uid") || params.has("invite")) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 5. TOP HEADER "+ App" BUTTON WORKING FIX
    let deferredInstallPrompt = null;
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
    });

    document.addEventListener("click", async (e) => {
        const el = e.target.closest("button, a, div, span");
        if (!el) return;
        const text = (el.innerText || "").trim().toLowerCase();

        // Upar wale "📲 App" button ko pehchano
        if (text === "app" || text.includes("📲 app") || text.includes("install app") || el.id === "pwa-btn") {
            e.preventDefault();
            e.stopPropagation();

            if (deferredInstallPrompt) {
                deferredInstallPrompt.prompt();
                await deferredInstallPrompt.userChoice;
                deferredInstallPrompt = null;
            } else {
                alert("📲 Nexus App Install karne ka tarika:\n\n1. Browser ke upar right coone mein 3-dots (⋮) par tap karein.\n2. 'Add to Home screen' ya 'Install app' par click karein!\n\nIsse Nexus App sidhe aapke phone mein install ho jayega.");
            }
        }
    }, true);
})();
            
