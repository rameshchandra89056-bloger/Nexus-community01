// ================= CORE.JS (v22.0 PURE ZERO-REFRESH HOT-SWAP ENGINE): 🔄 CHECKS ALL SEPARATE FEATURE FILES EVERY 12 SECONDS & UPDATES ACTIVE USERS LIVE WITHOUT PAGE REFRESH =================

(function() {
    // 1. All Independent Feature Micro-Modules
    const NEXUS_MODULES = [
        'aifix.js',
        'profilefix.js',
        'cards.js',
        'notify.js',
        'dmtools.js',
        'live.js',
        'dminbox.js',
        'ai.js',
        'pwa.js',
        'dotsmenu.js',
        'screen.js',
        'voice.js',
        'board.js'
    ];

    const loadedCodeSignatures = {};
    let isUserTypingNow = false;
    let typingTimer = null;

    const markTyping = () => {
        isUserTypingNow = true;
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => { isUserTypingNow = false; }, 1200);
    };
    document.addEventListener('keydown', markTyping, { passive: true });
    document.addEventListener('input', markTyping, { passive: true });

    // 2. Clear old blocking Service Worker caches automatically
    function flushOldCaches() {
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(n => {
                    if (n !== 'nexus-turbo-v21') caches.delete(n);
                });
            }).catch(() => {});
        }
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(regs => {
                regs.forEach(r => { try { r.update(); } catch (e) {} });
            }).catch(() => {});
        }
    }

    // 3. Fast String Hash to detect even a 1-character change in any GitHub file!
    function getFastHash(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = ((h << 5) - h) + str.charCodeAt(i);
            h |= 0;
        }
        return h + '_' + str.length;
    }

    // 4. Zero-Refresh Hot-Swapper: Fetches fresh JS & executes immediately in RAM without reloading page!
    async function syncAndHotSwapModule(file, isInitialLoad) {
        try {
            const res = await fetch(`${file}?nocache=${Date.now()}`, { cache: 'no-store' });
            if (!res.ok) return;
            const codeText = await res.text();
            if (!codeText || codeText.trim().startsWith('<!DOCTYPE') || codeText.trim().startsWith('<html')) return;

            const newSig = getFastHash(codeText);
            if (loadedCodeSignatures[file] === newSig) return; // No change in this file

            const hadOldVersion = Boolean(loadedCodeSignatures[file]);
            loadedCodeSignatures[file] = newSig;

            // Remove old script tag for this module if present
            const oldScript = document.querySelector(`script[data-nx-live-mod="${file}"]`);
            if (oldScript) oldScript.remove();

            // Inject & execute new updated module code seamlessly without page refresh
            const s = document.createElement('script');
            s.setAttribute('data-nx-live-mod', file);
            s.textContent = codeText;
            document.body.appendChild(s);

            if (hadOldVersion && !isInitialLoad && window.Nexus && Nexus.toast) {
                console.log(`[Nexus Hot-Swap] Live updated ${file} without refresh!`);
            }
        } catch (e) {}
    }

    function checkAllModulesLive(isInitial) {
        if (!isInitial && isUserTypingNow) return;
        NEXUS_MODULES.forEach(file => {
            syncAndHotSwapModule(file, isInitial);
        });
    }

    // Initial instant boot + 12-second live background hot-swap loop
    flushOldCaches();
    checkAllModulesLive(true);
    setInterval(() => checkAllModulesLive(false), 12000);
    setInterval(flushOldCaches, 45000);
})(); // === END OF CORE.JS ===
