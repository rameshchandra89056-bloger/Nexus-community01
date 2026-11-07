// === CORE.JS (v25.0 CLEAN MODULE LOADER — LOADS DM.JS, CHAT.JS & ALL MODULES LIVE) ===
(function() {
    const MODULES = [
        'dm.js', 'chat.js', 'cards.js', 'profilefix.js', 'dmtools.js',
        'voice.js', 'notify.js', 'dminbox.js', 'aifix.js', 'live.js',
        'ai.js', 'pwa.js', 'dotsmenu.js', 'screen.js', 'board.js'
    ];
    const loadedHash = {};
    let typing = false, tTimer = null;

    const onType = () => { typing = true; clearTimeout(tTimer); tTimer = setTimeout(() => { typing = false; }, 1200); };
    document.addEventListener('keydown', onType, { passive: true });
    document.addEventListener('input', onType, { passive: true });

    function hash(s) {
        let h = 0;
        for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
        return h + '_' + s.length;
    }

    async function loadModule(file) {
        try {
            const res = await fetch(`${file}?v=${Date.now()}`, { cache: 'no-store' });
            if (!res.ok) return;
            const code = await res.text();
            if (!code || code.trim().startsWith('<!DOCTYPE') || code.trim().startsWith('<html')) return;
            const sig = hash(code);
            if (loadedHash[file] === sig) return;
            loadedHash[file] = sig;

            const old = document.querySelector(`script[data-nx-mod="${file}"]`);
            if (old) old.remove();
            const s = document.createElement('script');
            s.setAttribute('data-nx-mod', file);
            s.textContent = code;
            document.body.appendChild(s);
        } catch (e) {}
    }

    function syncAll(init) {
        if (!init && typing) return;
        MODULES.forEach(loadModule);
    }

    if ('caches' in window) {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {});
    }
    syncAll(true);
    setInterval(() => syncAll(false), 12000);
})();
// === END CORE.JS ===
