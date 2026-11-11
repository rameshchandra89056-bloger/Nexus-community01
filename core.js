// ================= CORE.JS (v95.0 CLEAN VERCEL LOADER — ZERO OVERWRITE & ZERO BLINKING) =================
(function() {
    const SAFE_MODULES = ['aifix.js', 'profilefix.js', 'cards.js', 'dmtools.js', 'notify.js', 'voice.js', 'ytparty.js', 'screen.js'];
    if ('caches' in window) {
        caches.keys().then(keys => keys.forEach(k => caches.delete(k))).catch(() => {});
    }
    SAFE_MODULES.forEach(file => {
        if (document.querySelector(`script[src*="${file}"], script[data-nx-v95="${file}"]`)) return;
        const s = document.createElement('script');
        s.setAttribute('data-nx-v95', file);
        s.src = `${file}?v=95`;
        document.body.appendChild(s);
    });
})();
