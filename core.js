// ================= CORE.JS (v60.0): SMART GITHUB PAGES LIVE BRIDGE — ZERO BLINKING & ZERO NETLIFY CREDITS! =================

(function() {
    const GH_PAGES = 'https://rameshchandra89056-bioger.github.io/Nexus-community01/';
    const GH_RAW = 'https://raw.githubusercontent.com/rameshchandra89056-bioger/Nexus-community01/main/';
    const MODULES = [
        'aifix.js', 'profilefix.js', 'cards.js', 'notify.js',
        'dmtools.js', 'live.js', 'dminbox.js', 'ai.js',
        'pwa.js', 'dotsmenu.js', 'screen.js', 'voice.js',
        'board.js', 'ytparty.js'
    ];
    const loadedHash = {};
    let isTyping = false, tTimer = null;

    const onType = () => {
        isTyping = true;
        clearTimeout(tTimer);
        tTimer = setTimeout(() => { isTyping = false; }, 1500);
    };
    document.addEventListener('keydown', onType, { passive: true });
    document.addEventListener('input', onType, { passive: true });

    function getHash(s) {
        let h = 0;
        for (let i = 0; i < s.length; i++) {
            h = ((h << 5) - h) + s.charCodeAt(i);
            h |= 0;
        }
        return h + '_' + s.length;
    }

    async function loadModule(file) {
        let code = '';
        const t = Date.now();
        try {
            const r1 = await fetch(`${GH_PAGES}${file}?v=${t}`, { cache: 'no-store' });
            if (r1.ok) code = await r1.text();
        } catch (e) {}

        if (!code || code.trim().startsWith('<!DOCTYPE') || code.trim().startsWith('<html') || code.trim() === '404: Not Found') {
            try {
                const r2 = await fetch(`${GH_RAW}${file}?v=${t}`, { cache: 'no-store' });
                if (r2.ok) code = await r2.text();
            } catch (e) {}
        }

        if (!code || code.trim().startsWith('<!DOCTYPE') || code.trim().startsWith('<html') || code.trim() === '404: Not Found') return;

        // IMPORTANT: Only execute if file code ACTUALLY changed! (Stops all UI blinking!)
        const sig = getHash(code);
        if (loadedHash[file] === sig) return;
        loadedHash[file] = sig;

        const old = document.querySelector(`script[data-nx-mod="${file}"]`);
        if (old) old.remove();

        const s = document.createElement('script');
        s.setAttribute('data-nx-mod', file);
        s.textContent = code;
        document.body.appendChild(s);
    }

    function syncModules(force) {
        if (!force && isTyping) return;
        MODULES.forEach(loadModule);
    }

    syncModules(true);
    setInterval(() => syncModules(false), 6000);
})();
// === END OF CORE.JS ===
