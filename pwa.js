// ================= PWA.JS (DEDICATED OFFICIAL APP INSTALLER MODULE): 📲 AUTO-GENERATES REAL 192px & 512px PNG APP ICONS FOR ANDROID WEBAPK + CAPTURES NATIVE INSTALL PROMPT + FIXES '+ App' BUTTON =================

(function() {
    let deferredInstallPrompt = window.__nxDeferredPwaPrompt || null;
    let isAppInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferredInstallPrompt = e;
        window.__nxDeferredPwaPrompt = e;
        const appBtn = document.getElementById('nx-pwa-install-btn');
        if (appBtn) {
            appBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            appBtn.style.color = '#020617';
        }
    });

    window.addEventListener('appinstalled', () => {
        isAppInstalled = true;
        deferredInstallPrompt = null;
        const modal = document.getElementById('nx-global-modal');
        if (modal) modal.style.display = 'none';
        if (window.Nexus) Nexus.toast("🎉 Official Nexus App Installed on your phone!");
    });

    // Generate real PNG icons via Canvas so Android Chrome WebAPK builder accepts the manifest 100%
    function generateNexusPngIcon(size) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            // Dark Navy Rounded Background
            ctx.fillStyle = '#090d16';
            ctx.fillRect(0, 0, size, size);

            // Glowing Gradient Circle
            const grad = ctx.createLinearGradient(0, 0, size, size);
            grad.addColorStop(0, '#10b981');
            grad.addColorStop(1, '#2563eb');
            ctx.strokeStyle = grad;
            ctx.lineWidth = Math.round(size * 0.06);
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size * 0.38, 0, Math.PI * 2);
            ctx.stroke();

            // Bold "N" Logo
            ctx.fillStyle = '#38bdf8';
            ctx.font = `900 ${Math.round(size * 0.48)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('N', size / 2, size * 0.53);

            return canvas.toDataURL('image/png');
        } catch (e) {
            return '';
        }
    }

    function setupValidPngManifestAndWorker() {
        if ('serviceWorker' in navigator && !window.__nxSwRegPwa) {
            window.__nxSwRegPwa = true;
            navigator.serviceWorker.register('sw.js').catch(() => {});
        }

        // Inject dynamic manifest with real PNG icons if needed
        let icon192 = generateNexusPngIcon(192);
        let icon512 = generateNexusPngIcon(512);
        if (icon192 && icon512) {
            let dynManifest = {
                name: "Nexus Community Official",
                short_name: "Nexus",
                description: "Nexus Official Student & Creator Community App",
                start_url: window.location.origin + "/index.html",
                scope: window.location.origin + "/",
                display: "standalone",
                orientation: "portrait",
                background_color: "#090d16",
                theme_color: "#0f172a",
                icons: [
                    { src: icon192, sizes: "192x192", type: "image/png", purpose: "any maskable" },
                    { src: icon512, sizes: "512x512", type: "image/png", purpose: "any maskable" }
                ]
            };
            let blob = new Blob([JSON.stringify(dynManifest)], { type: 'application/manifest+json' });
            let manifestUrl = URL.createObjectURL(blob);
            let link = document.querySelector('link[rel="manifest"]');
            if (!link) {
                link = document.createElement('link');
                link.rel = 'manifest';
                document.head.appendChild(link);
            }
            link.href = manifestUrl;
        }
    }

    window.NexusPWA = {
        triggerInstallFlow: async function() {
            // 1. If Native Android Install Prompt is ready, open it immediately in 1 tap!
            if (deferredInstallPrompt) {
                try {
                    deferredInstallPrompt.prompt();
                    const choice = await deferredInstallPrompt.userChoice;
                    if (choice && choice.outcome === 'accepted') {
                        deferredInstallPrompt = null;
                        if (window.Nexus) Nexus.toast("📲 Installing Official Nexus App...");
                    }
                    return;
                } catch (e) {}
            }

            // 2. If already running inside Installed Standalone App
            if (isAppInstalled) {
                if (window.Nexus) Nexus.toast("✅ Official Nexus App is already installed!");
                return;
            }

            // 3. Smart Interactive Installer Modal (Detects Chrome vs In-App Browser)
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;

            let ua = navigator.userAgent || '';
            let isWebView = /wv|Instagram|FBAN|FBAV|Telegram|WhatsApp/i.test(ua);
            let cleanUrl = window.location.href.replace(/^https?:\/\//, '');
            let chromeIntent = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;

            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid #10b981; text-align:center; background:#090d16; padding:18px; max-width:385px;">
                    <div style="width:60px; height:60px; border-radius:16px; background:linear-gradient(135deg,#10b981,#2563eb); color:white; font-size:30px; font-weight:900; display:flex; align-items:center; justify-content:center; margin:0 auto 10px; box-shadow:0 8px 22px rgba(16,185,129,0.35);">N</div>
                    <h3 style="color:#f8fafc; font-size:17px; margin-bottom:6px;">📲 Install Official Nexus App</h3>

                    ${isWebView ? `
                        <p style="font-size:12.5px; color:#cbd5e1; line-height:1.5; margin-bottom:14px;">
                            Aap abhi in-app browser mein hain. Official App install karne ke liye niche green button dabakar Chrome mein kholein:
                        </p>
                        <a href="${chromeIntent}" style="display:block; background:linear-gradient(135deg,#10b981,#059669); color:#020617; text-decoration:none; padding:12px; border-radius:12px; font-weight:900; font-size:13.5px; margin-bottom:8px;">🚀 Open in Chrome to Install</a>
                    ` : `
                        <div style="background:#111827; border:1.5px dashed #38bdf8; border-radius:14px; padding:12px; text-align:left; font-size:12.5px; color:#e2e8f0; line-height:1.6; margin-bottom:14px;">
                            <div style="color:#10b981; font-weight:900; margin-bottom:4px;">⚡ 2-Second Direct Install Steps:</div>
                            <div>1️⃣ Apne Chrome ke kone mein <b>3-Dots (⋮)</b> button par tap karein.</div>
                            <div>2️⃣ Menu mein <b>"📲 Add to Home screen"</b> (ya <b>"Install app"</b>) par tap karein aur <b>Install</b> daba dein!</div>
                        </div>
                    `}

                    <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="width:100%; background:#1e293b; color:#cbd5e1; border:1px solid #334155; padding:11px; border-radius:12px; font-weight:800; cursor:pointer;">Got It ✓</button>
                </div>
            `;
            modal.style.display = 'flex';
        }
    };

    function bindPwaButtonsEverywhere() {
        if (window.NexusPower) {
            NexusPower.installPWA = () => window.NexusPWA.triggerInstallFlow();
        }
        const appBtn = document.getElementById('nx-pwa-install-btn');
        if (appBtn && !appBtn.getAttribute('data-pwa-v18')) {
            appBtn.setAttribute('data-pwa-v18', '1');
            appBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.NexusPWA.triggerInstallFlow();
            };
        }
    }

    setupValidPngManifestAndWorker();
    setInterval(bindPwaButtonsEverywhere, 800);
    setTimeout(bindPwaButtonsEverywhere, 150);
})(); // === END OF PWA.JS ===
