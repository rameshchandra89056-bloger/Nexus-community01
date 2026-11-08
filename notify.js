// ================= NOTIFY.JS (v40.0): LIVE TOP POPUP BANNER + RED UNREAD BADGE ON BELL ICON + ANDROID SYSTEM NOTIFICATION BAR =================

(function() {
    let dmWatchUnsub = null;
    let notifWatchUnsub = null;
    let bootTs = Date.now();
    let seenIds = new Set();
    let unreadNotifList = [];

    function getMe() {
        try { if (window.Nexus && Nexus.getCurrentUser) return Nexus.getCurrentUser(); } catch (e) {}
        try { let s = localStorage.getItem('nexus_current_user') || localStorage.getItem('nexus_user'); if (s) return JSON.parse(s); } catch (e) {}
        return null;
    }

    // Request Browser / Android System Notification Bar Permission on first tap
    document.addEventListener('click', function askNotifPerm() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
        }
        document.removeEventListener('click', askNotifPerm);
    }, { once: true });

    // Trigger Real Android / Chrome System Notification Bar
    function fireSystemNotificationBar(title, bodyText, partnerU) {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        try {
            if (navigator.serviceWorker && navigator.serviceWorker.ready) {
                navigator.serviceWorker.ready.then(reg => {
                    reg.showNotification(title, {
                        body: bodyText,
                        icon: '/icon-192.png',
                        badge: '/icon-192.png',
                        vibrate: [150, 80, 150],
                        tag: 'nx_msg_' + Date.now(),
                        data: { partnerU: partnerU || '' }
                    });
                }).catch(() => {
                    new Notification(title, { body: bodyText });
                });
            } else {
                new Notification(title, { body: bodyText });
            }
        } catch (e) {}
    }

    // Show WhatsApp/Instagram-style Top Slide-Down Banner inside the app
    function showTopLiveBanner(title, subtitle, onClickFn) {
        let old = document.getElementById('nx-v40-top-push-banner');
        if (old) old.remove();

        const b = document.createElement('div');
        b.id = 'nx-v40-top-push-banner';
        b.style.cssText = 'position:fixed; top:10px; left:50%; transform:translateX(-50%); width:94%; max-width:410px; background:linear-gradient(135deg,#0f172a,#1e293b); border:1.5px solid #10b981; border-radius:16px; padding:11px 14px; z-index:250000; display:flex; align-items:center; justify-content:space-between; gap:10px; box-shadow:0 14px 35px rgba(0,0,0,0.9); cursor:pointer;';
        b.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
                <div style="width:38px; height:38px; border-radius:50%; background:#10b981; color:#020617; display:flex; align-items:center; justify-content:center; font-size:18px; font-weight:900; flex-shrink:0;">💬</div>
                <div style="min-width:0; flex:1;">
                    <div style="font-size:13px; font-weight:900; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${title}</div>
                    <div style="font-size:11.5px; color:#6ee7b7; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${subtitle}</div>
                </div>
            </div>
            <span style="background:#10b981; color:#020617; font-size:10.5px; font-weight:900; padding:4px 9px; border-radius:99px; flex-shrink:0;">Reply →</span>
        `;
        b.onclick = () => {
            b.remove();
            if (typeof onClickFn === 'function') onClickFn();
        };
        document.body.appendChild(b);
        setTimeout(() => { if (b.parentNode) b.remove(); }, 5500);
    }

    // Update Red Unread Counter Badge on Top Bell Icon
    function updateBellIconBadge(count) {
        const bells = Array.from(document.querySelectorAll('header button, header svg, [onclick*="Notif"], [onclick*="notif"]'));
        let bellContainer = document.querySelector('header') || document.body;
        let badge = document.getElementById('nx-v40-bell-badge');

        const svgBell = bellContainer.querySelector('svg path[d*="M18 8A6"], svg path[d*="M15 17h5l-1.405"]');
        const targetBtn = (svgBell && (svgBell.closest('button') || svgBell.parentElement)) || bells[0];
        if (!targetBtn) return;

        targetBtn.style.position = 'relative';
        if (!badge) {
            badge = document.createElement('span');
            badge.id = 'nx-v40-bell-badge';
            badge.style.cssText = 'position:absolute; top:-4px; right:-4px; background:#ef4444; color:#fff; font-size:10px; font-weight:900; min-width:17px; height:17px; padding:0 4px; border-radius:99px; display:none; align-items:center; justify-content:center; border:1.5px solid #090d16; z-index:20;';
            targetBtn.appendChild(badge);
        }

        if (count > 0) {
            badge.innerText = count > 99 ? '99+' : String(count);
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }
    }

    function startRealtimeNotifWatchers() {
        const me = getMe();
        if (!me || !me.username || !window.Nexus || !Nexus.db) return;
        const myU = me.username.toLowerCase().trim();

        if (!dmWatchUnsub) {
            dmWatchUnsub = Nexus.db.collection("nexus_private_dms")
                .where("toUser", "==", me.username)
                .limit(45)
                .onSnapshot(snap => {
                    let unreadDmCount = 0;
                    snap.forEach(doc => {
                        const d = doc.data();
                        if (!d || d.deleted) return;
                        if (!d.seen) unreadDmCount++;

                        const ts = Number(d.createdAt || 0);
                        if (ts > bootTs && !seenIds.has(doc.id)) {
                            seenIds.add(doc.id);
                            const senderName = d.fromName || d.fromUser || 'Friend';
                            const msgPreview = d.text || (d.imgUrl ? '📷 Sent a photo' : '🎤 Sent a voice note');

                            // Add to notification history
                            unreadNotifList.unshift({
                                id: doc.id,
                                fromUser: d.fromUser,
                                fromName: senderName,
                                text: `💬 Messaged you: "${msgPreview.substring(0, 45)}"`,
                                time: d.time || 'Just now'
                            });

                            const activeP = (window.NexusDM && NexusDM.activePartner || '').toLowerCase();
                            const dmOpen = document.getElementById('nx-dm-dedicated-root')?.style.display !== 'none';
                            if (!dmOpen || activeP !== String(d.fromUser || '').toLowerCase()) {
                                showTopLiveBanner(`💬 ${senderName} (@${d.fromUser})`, msgPreview, () => {
                                    if (window.NexusDM) NexusDM.openDirectChat(d.fromUser, senderName, '');
                                });
                                fireSystemNotificationBar(`💬 New Message from ${senderName}`, msgPreview, d.fromUser);
                            }
                        }
                    });
                    updateBellIconBadge(unreadDmCount + unreadNotifList.length);
                }, () => {});
        }
    }

    setInterval(startRealtimeNotifWatchers, 1500);
})();
// === END OF NOTIFY.JS ===
