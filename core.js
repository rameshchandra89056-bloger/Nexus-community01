// === CORE.JS (v27.0 NON-DESTRUCTIVE MODULE LOADER — NEVER OVERWRITES DM.JS, CHAT.JS OR POWER.JS) ===
(function() {
    const GH_RAW = 'https://raw.githubusercontent.com/rameshchandra89056-bioger/Nexus-community01/main/';
    // Only loads add-on modules so original dm.js, chat.js, power.js & superchat.js stay 100% intact!
    const MODULES = [
        'aifix.js', 'profilefix.js', 'cards.js', 'notify.js',
        'dmtools.js', 'live.js', 'dminbox.js', 'ai.js',
        'pwa.js', 'dotsmenu.js', 'screen.js', 'voice.js', 'board.js'
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
        let code = '';
        try {
            const r1 = await fetch(`${GH_RAW}${file}?t=${Date.now()}`, { cache: 'no-store' });
            if (r1.ok) code = await r1.text();
        } catch (e) {}
        if (!code || code.trim().startsWith('<!DOCTYPE') || code.trim().startsWith('<html') || code.trim() === '404: Not Found') {
            try {
                const r2 = await fetch(`${file}?t=${Date.now()}`, { cache: 'no-store' });
                if (r2.ok) code = await r2.text();
            } catch (e) {}
        }
        if (!code || code.trim().startsWith('<!DOCTYPE') || code.trim().startsWith('<html') || code.trim() === '404: Not Found') return;

        const sig = hash(code);
        if (loadedHash[file] === sig) return;
        loadedHash[file] = sig;

        const old = document.querySelector(`script[data-nx-mod="${file}"]`);
        if (old) old.remove();
        const s = document.createElement('script');
        s.setAttribute('data-nx-mod', file);
        s.textContent = code;
        document.body.appendChild(s);
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
