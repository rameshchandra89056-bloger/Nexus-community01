// ================= CORE.JS (v24.0 ZERO-OVERLAP INSTANT HOT-SWAP LOADER): 🔄 LOADS CLEAN DM.JS, CHAT.JS & ALL MODULAR FEATURE FILES LIVE WITHOUT PAGE REFRESH =================

(function() {
    const MODULES = [
        'dm.js',
        'chat.js',
        'aifix.js',
        'profilefix.js',
        'cards.js',
        'dminbox.js',
        'dmtools.js',
        'voice.js',
        'notify.js',
        'live.js',
        'ai.js',
        'pwa.js',
        'dotsmenu.js',
        'screen.js',
        'board.js'
    ];

    const signatures = {};
    let isTyping = false, tTimer = null;

    const markTyping = () => {
        isTyping = true;
        clearTimeout(tTimer);
        tTimer = setTimeout(() => { isTyping = false; }, 1200);
    };
    document.addEventListener('keydown', markTyping, { passive: true });
    document.addEventListener('input', markTyping, { passive: true });

    function hashCode(s) {
        let h = 0;
        for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
        return h + '_' + s.length;
    }

    async function hotSwapFile(file) {
        let code = '';
        try {
            const r1 = await fetch(`${file}?t=${Date.now()}`, { cache: 'no-store' });
            if (r1.ok) code = await r1.text();
        } catch (e) {}

        if (!code || code.trim().startsWith('<!DOCTYPE') || code.trim().startsWith('<html')) return;

        const sig = hashCode(code);
        if (signatures[file] === sig) return;
        signatures[file] = sig;

        const prev = document.querySelector(`script[data-nx-hot="${file}"]`);
        if (prev) prev.remove();

        const s = document.createElement('script');
        s.setAttribute('data-nx-hot', file);
        s.textContent = code;
        document.body.appendChild(s);
    }

    function syncAll(initial) {
        if (!initial && isTyping) return;
        MODULES.forEach(hotSwapFile);
    }

    if ('caches' in window) {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {});
    }

    syncAll(true);
    setInterval(() => syncAll(false), 12000);
})(); // === END OF CORE.JS ===
