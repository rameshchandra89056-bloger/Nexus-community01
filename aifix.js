// ================= AIFIX.JS (v40.0): BLOCKS DUPLICATE AI BANNER (1000073945.jpg FIX) + SLOW INTERNET SKELETON & CACHED FEED (1000073941.jpg FIX) + ANIMATED APP SPLASH =================

(function() {
    if (!document.getElementById('nx-aifix-v40-css')) {
        const st = document.createElement('style');
        st.id = 'nx-aifix-v40-css';
        st.innerHTML = `
            /* 1. PERMANENTLY HIDE DUPLICATE PURPLE AI BANNER IN COMMUNITY TAB (1000073945.jpg & 1000073942.jpg FIX) */
            #nx-ai-community-banner,
            #nx-ai-promo-card,
            .nx-ai-banner-dup,
            #tab-community div[onclick*="NexusAI.openStudio"]:not(.nx-half-card) {
                display: none !important;
            }

            /* 2. ANIMATED APP SPLASH & SLOW INTERNET SHIMMER */
            @keyframes nxPulseRing {
                0% { transform: scale(0.85); opacity: 0.9; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                70% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 18px rgba(16, 185, 129, 0); }
                100% { transform: scale(0.85); opacity: 0.9; box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            }
            @keyframes nxShimmerSweep {
                0% { background-position: -400px 0; }
                100% { background-position: 400px 0; }
            }
            .nx-shimmer-card {
                background: #111827;
                background-image: linear-gradient(90deg, #111827 0px, #1e293b 40px, #111827 80px);
                background-size: 600px;
                animation: nxShimmerSweep 1.4s infinite linear;
                border: 1px solid #1e293b;
                border-radius: 18px;
                padding: 16px;
                margin-bottom: 12px;
            }
            #nx-animated-boot-splash {
                position: fixed; inset: 0; background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
                z-index: 300000; display: flex; flex-direction: column; align-items: center; justify-content: center;
                transition: opacity 0.35s ease;
            }
        `;
        document.head.appendChild(st);
    }

    // Show a sleek animated splash for 0.9s on cold start so app NEVER looks blank
    function showAnimatedBootLoader() {
        if (sessionStorage.getItem('nx_boot_shown_v40')) return;
        sessionStorage.setItem('nx_boot_shown_v40', '1');
        const splash = document.createElement('div');
        splash.id = 'nx-animated-boot-splash';
        splash.innerHTML = `
            <div style="width:74px; height:74px; border-radius:22px; background:linear-gradient(135deg,#10b981,#2563eb); display:flex; align-items:center; justify-content:center; font-size:36px; font-weight:900; color:#fff; animation:nxPulseRing 1.5s infinite;">N</div>
            <div style="margin-top:14px; font-size:20px; font-weight:900; color:#f8fafc; letter-spacing:0.5px;">Nexus <span style="color:#10b981;">Live</span></div>
            <div style="margin-top:4px; font-size:11.5px; color:#38bdf8; font-weight:700;">⚡ India's IIT-JEE &amp; Student Community</div>
            <div style="width:140px; height:4px; background:#1e293b; border-radius:99px; overflow:hidden; margin-top:16px;">
                <div style="width:100%; height:100%; background:linear-gradient(90deg,#10b981,#38bdf8,#a855f7); animation:nxShimmerSweep 1s infinite linear;"></div>
            </div>
        `;
        document.body.appendChild(splash);
        setTimeout(() => {
            splash.style.opacity = '0';
            setTimeout(() => splash.remove(), 350);
        }, 900);
    }

    // Remove the duplicate purple AI banner circled in green in 1000073945.jpg
    function removeDuplicateAiBanner() {
        const comm = document.getElementById('tab-community');
        if (!comm) return;
        comm.querySelectorAll('div, section, a, button').forEach(el => {
            if (el.classList.contains('nx-half-card') || el.id === 'nx-structured-4card-grid' || el.id === 'nx-chat-directory' || el.id === 'nx-dm-inbox-banner') return;
            const txt = (el.innerText || '').trim();
            if (txt.includes('Nexus 1:1 Private AI Studio') || (txt.includes('Ask 1:1') && txt.includes('Cloud Servers'))) {
                if (!el.querySelector('#nx-channels-list')) {
                    el.style.setProperty('display', 'none', 'important');
                    el.remove();
                }
            }
        });
    }

    // Prevent Blank Home Screen on Slow Internet (1000073941.jpg & 1000073940.jpg Fix)
    function preventBlankHomeOnSlowNet() {
        const home = document.getElementById('tab-home');
        if (!home) return;
        const textLen = (home.innerText || '').trim().length;

        // Save snapshot when feed loads so offline/slow net has instant real posts
        if (textLen > 180 && !home.querySelector('.nx-shimmer-card')) {
            try { localStorage.setItem('nx_cached_home_html_v40', home.innerHTML); } catch (e) {}
            const skel = document.getElementById('nx-slow-net-placeholder');
            if (skel) skel.remove();
            return;
        }

        // If #tab-home is empty/blank on slow internet, show cached feed or animated skeleton immediately
        if (textLen < 40 && !document.getElementById('nx-slow-net-placeholder')) {
            const cached = localStorage.getItem('nx_cached_home_html_v40');
            if (cached && cached.length > 100) {
                home.innerHTML = cached;
            } else {
                const wrap = document.createElement('div');
                wrap.id = 'nx-slow-net-placeholder';
                wrap.style.padding = '12px';
                wrap.innerHTML = `
                    <div style="background:rgba(16,185,129,0.12); border:1px solid #10b981; color:#6ee7b7; padding:8px 12px; border-radius:12px; font-size:11.5px; font-weight:800; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between;">
                        <span>⚡ Slow Network Mode Active — Loading live feed...</span>
                        <button onclick="location.reload()" style="background:#10b981; color:#020617; border:none; padding:3px 8px; border-radius:6px; font-weight:900; font-size:10.5px;">Retry</button>
                    </div>
                    <div class="nx-shimmer-card" style="height:110px;"></div>
                    <div class="nx-shimmer-card" style="height:165px;"></div>
                    <div class="nx-shimmer-card" style="height:165px;"></div>
                `;
                home.appendChild(wrap);
            }
        }
    }

    showAnimatedBootLoader();
    removeDuplicateAiBanner();
    preventBlankHomeOnSlowNet();
    setInterval(() => {
        removeDuplicateAiBanner();
        preventBlankHomeOnSlowNet();
    }, 350);
})();
// === END OF AIFIX.JS ===
