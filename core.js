// ================= CORE.JS (v80.0 VERCEL PRODUCTION EDITION): LOADS ADD-ONS ONCE cleanly — NEVER OVERWRITES DM.JS OR CHAT.JS & ZERO BLINKING! =================

(function() {
    // On Vercel, files deploy in 5 seconds automatically!
    // Load add-on modules ONCE without destroying dm.js, chat.js, power.js or dotsmenu.js!
    const SAFE_MODULES = [
        'aifix.js',
        'dmtools.js',
        'notify.js',
        'voice.js',
        'ytparty.js',
        'screen.js'
    ];

    // Clear old service worker caches that might hold 3-day-old broken files
    if ('caches' in window) {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {});
    }
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
            regs.forEach(r => r.update().catch(() => {}));
        }).catch(() => {});
    }

    SAFE_MODULES.forEach(file => {
        if (document.querySelector(`script[src*="${file}"], script[data-nx-v80="${file}"]`)) return;
        const s = document.createElement('script');
        s.setAttribute('data-nx-v80', file);
        s.src = `${file}?v=80`;
        document.body.appendChild(s);
    });
})();
// === END OF CORE.JS ===
