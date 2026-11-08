// ================= CORE.JS (v45.0 ULTRA-FAST LIVE GITHUB BRIDGE — ZERO NETLIFY CREDITS & INSTANT LIVE UPDATES WITHOUT REFRESH!) =================

(function() {
    const GH_RAW = 'https://raw.githubusercontent.com/rameshchandra89056-bioger/Nexus-community01/main/';
    const MODULES = [
        'aifix.js', 'profilefix.js', 'cards.js', 'notify.js',
        'dmtools.js', 'live.js', 'dminbox.js', 'ai.js',
        'pwa.js', 'dotsmenu.js', 'screen.js', 'voice.js',
        'board.js', 'ytparty.js'
    ];
    const loadedHash = {};
    let isTyping = false, typingTimer = null;

    const markTyping = () => {
        isTyping = true;
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => { isTyping = false; }, 1000);
    };
    document.addEventListener('keydown', markTyping, { passive: true });
    document.addEventListener('input', markTyping, { passive: true });

    function fastHash(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = ((h << 5) - h) + str.charCodeAt(i);
            h |= 0;
        }
        return h + '_' + str.length;
    }

    async function hotReloadModule(file) {
        let code = '';
        const bust = Date.now() + '_' + Math.random().toString(36).substring(2, 7);

        // 1. Primary: Fetch directly from GitHub Raw Server (Bypasses paused Netlify builds 100%!)
        try {
            const res = await fetch(`${GH_RAW}${file}?v=${bust}`, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
            });
            if (res.ok) code = await res.text();
        } catch (e) {}

        // 2. Fallback: Local relative file if offline/local
        if (!code || code.trim().startsWith('<!DOCTYPE') || code.trim().startsWith('<html') || code.trim() === '404: Not Found') {
            try {
                const res2 = await fetch(`${file}?v=${bust}`, { cache: 'no-store' });
                if (res2.ok) code = await res2.text();
            } catch (e) {}
        }

        if (!code || code.trim().startsWith('<!DOCTYPE') || code.trim().startsWith('<html') || code.trim() === '404: Not Found') return;

        const sig = fastHash(code);
        if (loadedHash[file] === sig) return;
        loadedHash[file] = sig;

        const prevScript = document.querySelector(`script[data-nx-live-mod="${file}"]`);
        if (prevScript) prevScript.remove();

        const s = document.createElement('script');
        s.setAttribute('data-nx-live-mod', file);
        s.textContent = code;
        document.body.appendChild(s);
    }

    function syncAllModules(forceNow) {
        if (!forceNow && isTyping) return;
        MODULES.forEach(hotReloadModule);
    }

    // Clear any stale Service Worker caches so old files never get stuck
    if ('caches' in window) {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {});
    }

    // Initial instant load + Fast 4-second live background sync + Instant sync on tab focus
    syncAllModules(true);
    setInterval(() => syncAllModules(false), 4000);
    window.addEventListener('focus', () => syncAllModules(true));
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) syncAllModules(true);
    });
})();
// === END OF CORE.JS ===
