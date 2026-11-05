// ================= NOTIFY.JS (DEDICATED REAL-TIME NOTIFICATION ENGINE): 🔔 CASE-INSENSITIVE 0.01s DM/REPLY/CALL/FOLLOW WATCHER + 📲 REAL ANDROID SYSTEM STATUS-BAR NOTIFICATIONS + 🔊 CHIME SOUND + TOP SLIDE-DOWN BANNER + HEADER BELL MODAL =================

(function() {
    let bootTime = Date.now();
    let dmWatchUnsub = null;
    let cloudNotifUnsub = null;
    let groupCallWatchUnsub = null;
    let officialWatchUnsub = null;
    let seenDocIds = new Set();
    let allMyNotifications = [];
    let lastSeenCount = Number(localStorage.getItem('nx_notify_seen_cnt_v1') || 0);

    const notifyStyle = document.createElement('style');
    notifyStyle.innerHTML = `
        #nx-top-live-alert-bar {
            position: fixed; top: 10px; left: 50%; transform: translateX(-50%) translateY(-150%);
            width: 94%; max-width: 415px; background: linear-gradient(135deg, #0f172a 0%, #064e3b 100%);
            border: 2px solid #10b981; border-radius: 18px; padding: 12px 14px;
            z-index: 100300; display: flex; align-items: center; justify-content: space-between;
            gap: 10px; box-shadow: 0 18px 45px rgba(0,0,0,0.92);
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1); cursor: pointer;
        }
        #nx-top-live-alert-bar.visible {
            transform: translateX(-50%) translateY(0);
        }
    `;
    document.head.appendChild(notifyStyle);

    // Request Real Android / Chrome Notification Permission on first user tap
    function requestNativeNotificationPermissionOnce() {
        if (!('Notification' in window)) return;
        if (Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
        }
    }
    document.addEventListener('click', requestNativeNotificationPermissionOnce, { once: true, passive: true });

    function playAlertSound() {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            const ctx = new Ctx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(659.25, ctx.currentTime);
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.11);
            gain.gain.setValueAtTime(0.14, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.32);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.32);
            if (navigator.vibrate) navigator.vibrate([120, 60, 120]);
        } catch (e) {}
    }

    // Fires BOTH In-App Slide-Down Popup AND Real Android Top Status-Bar Notification!
    function triggerUniversalAlert(icon, title, bodyText, onClickAction) {
        playAlertSound();

        // 1. In-App Top Slide-Down Popup
        let bar = document.getElementById('nx-top-live-alert-bar');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'nx-top-live-alert-bar';
            document.body.appendChild(bar);
        }
        bar.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
                <div style="width:40px; height:40px; border-radius:12px; background:linear-gradient(135deg,#10b981,#2563eb); color:white; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;">${icon}</div>
                <div style="min-width:0; flex:1;">
                    <div style="font-size:13px; font-weight:900; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${title}</div>
                    <div style="font-size:11.5px; color:#6ee7b7; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${bodyText}</div>
                </div>
            </div>
            <span style="background:#10b981; color:#020617; padding:5px 10px; border-radius:10px; font-size:11px; font-weight:900; flex-shrink:0;">View →</span>
        `;
        bar.onclick = () => {
            bar.classList.remove('visible');
            if (typeof onClickAction === 'function') onClickAction();
        };
        bar.classList.add('visible');
        clearTimeout(bar.__hideTimer);
        bar.__hideTimer = setTimeout(() => { bar.classList.remove('visible'); }, 5000);

        // 2. Real Android Chrome System Notification (Works even when phone screen is in background!)
        if ('Notification' in window && Notification.permission === 'granted') {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(reg => {
                    reg.showNotification(title, {
                        body: bodyText,
                        vibrate: [150, 70, 150],
                        tag: 'nx-live-' + Date.now()
                    }).catch(() => {});
                }).catch(() => {});
            } else {
                try { new Notification(title, { body: bodyText }); } catch (e) {}
            }
        }
    }

    function refreshBellBadgeUI() {
        const dot = document.getElementById('nx-notif-dot');
        if (!dot) return;
        let unread = Math.max(0, allMyNotifications.length - lastSeenCount);
        if (unread > 0) {
            dot.innerText = unread > 9 ? '9+' : String(unread);
            dot.style.display = 'inline-block';
        } else {
            dot.style.display = 'none';
        }
    }

    function rebuildCombinedNotificationList() {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        if (!me || !me.username) return;
        let myU = me.username.toLowerCase().trim();
        let myN = (me.name || '').toLowerCase().trim();
        let list = [];

        // Add Cloud Notifications
        (window.__nxCloudNotifItems || []).forEach(n => {
            list.push({
                icon: n.type === 'follow' ? '👋' : (n.type === 'call' ? '📹' : '🔔'),
                fromUser: n.fromUser || 'member',
                fromName: n.fromName || n.fromUser || 'Member',
                html: `<b>@${n.fromUser || 'member'}</b> ${n.text || 'sent you an update'}`,
                time: n.createdAt || 0,
                actionType: n.type === 'call' ? 'dm' : 'profile'
            });
        });

        // Add Recent Incoming 1:1 DMs
        (window.__nxRecentIncomingDms || []).forEach(m => {
            let preview = (m.text || '').startsWith('🎵VOICE|') ? '🎤 Sent a Voice Note'
                        : ((m.text || '').startsWith('🖥️SCRSHARE|') ? '🖥️ Started Live Screen Share'
                        : ((m.text || '').startsWith('📹VROOM|') ? '📹 Started a Video Call' : (m.text || '📷 Sent a photo')));
            list.push({
                icon: '💬',
                fromUser: m.fromUser,
                fromName: m.fromName || m.fromUser,
                html: `<b>${m.fromName || '@' + m.fromUser}</b>: "${preview.substring(0, 42)}"`,
                time: m.createdAt || 0,
                actionType: 'dm'
            });
        });

        // Add Post Likes & Comments on My Posts
        (window.Nexus && Nexus.posts || []).forEach(p => {
            if (!p) return;
            let pU = (p.username || '').toLowerCase().trim();
            let pA = (p.author || '').toLowerCase().trim();
            if (pU === myU || (myN && pA === myN)) {
                (p.likedBy || []).forEach(liker => {
                    if (String(liker).toLowerCase().trim() !== myU) {
                        list.push({
                            icon: '❤️',
                            fromUser: liker,
                            fromName: liker,
                            html: `<b>@${liker}</b> liked your post: "${(p.text || 'Photo').substring(0, 30)}"`,
                            time: p.createdAt || 0,
                            actionType: 'profile'
                        });
                    }
                });
                (p.comments || []).forEach(c => {
                    if (c && c.username && c.username.toLowerCase().trim() !== myU) {
                        list.push({
                            icon: '💭',
                            fromUser: c.username,
                            fromName: c.author || c.username,
                            html: `<b>@${c.username}</b> commented: "${(c.text || '').substring(0, 35)}"`,
                            time: c.createdAt || p.createdAt || 0,
                            actionType: 'profile'
                        });
                    }
                });
            }
        });

        list.sort((a, b) => (b.time || 0) - (a.time || 0));
        allMyNotifications = list.slice(0, 40);
        refreshBellBadgeUI();
    }

    function startRealtimeNotificationListeners() {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        if (!me || !me.username || !Nexus.db) return;
        let myU = me.username.toLowerCase().trim();

        // 1. CASE-INSENSITIVE 1:1 DM, REPLY, VOICE NOTE & CALL WATCHER
        // Listens to last 35 DMs globally and checks `toUser.toLowerCase() === myU` so capital/small letters NEVER block notifications!
        if (!dmWatchUnsub) {
            dmWatchUnsub = Nexus.db.collection("nexus_private_dms")
                .orderBy("createdAt", "desc")
                .limit(35)
                .onSnapshot(snap => {
                    let myIncoming = [];
                    snap.forEach(doc => {
                        let m = doc.data();
                        if (!m || m.deleted) return;
                        if (String(m.toUser || '').toLowerCase().trim() === myU && String(m.fromUser || '').toLowerCase().trim() !== myU) {
                            m.id = doc.id;
                            myIncoming.push(m);

                            if ((m.createdAt || 0) > bootTime && !seenDocIds.has(doc.id)) {
                                seenDocIds.add(doc.id);
                                let txt = m.text || '';
                                let preview = txt.startsWith('🎵VOICE|') ? '🎤 Sent you a Voice Note!'
                                            : (txt.startsWith('🖥️SCRSHARE|') ? '🖥️ Sharing Live Screen with you!'
                                            : (txt.startsWith('📹VROOM|') ? '📹 Calling you on Live Video!'
                                            : (m.replyTo ? `↩️ Replied: "${txt.substring(0, 35)}"` : (txt || '📷 Sent a photo/sticker'))));

                                triggerUniversalAlert('💬', `New Message from ${m.fromName || '@' + m.fromUser}`, preview, () => {
                                    if (window.NexusDM) NexusDM.openDirectChat(m.fromUser, m.fromName || m.fromUser, '');
                                });
                            }
                        }
                    });
                    window.__nxRecentIncomingDms = myIncoming.slice(0, 15);
                    rebuildCombinedNotificationList();
                }, () => {});
        }

        // 2. CLOUD NOTIFICATIONS WATCHER (Follows, Likes, Mentions, Calls)
        if (!cloudNotifUnsub) {
            cloudNotifUnsub = Nexus.db.collection("nexus_notifications")
                .limit(50)
                .onSnapshot(snap => {
                    let mine = [];
                    snap.forEach(doc => {
                        let d = doc.data();
                        if (d && String(d.toUser || '').toLowerCase().trim() === myU) {
                            d.id = doc.id;
                            mine.push(d);
                            if ((d.createdAt || 0) > bootTime && !seenDocIds.has(doc.id)) {
                                seenDocIds.add(doc.id);
                                triggerUniversalAlert(
                                    d.type === 'call' ? '📹' : '🔔',
                                    `@${d.fromUser || 'member'}`,
                                    d.text || 'sent you an update',
                                    () => { window.NexusNotify.openBellModal(); }
                                );
                            }
                        }
                    });
                    window.__nxCloudNotifItems = mine;
                    rebuildCombinedNotificationList();
                }, () => {});
        }

        // 3. OFFICIAL NEXUS BROADCAST WATCHER
        if (!officialWatchUnsub) {
            officialWatchUnsub = Nexus.db.collection("nexus_config").doc("official_broadcast")
                .onSnapshot(doc => {
                    if (!doc.exists) return;
                    let d = doc.data();
                    if (d && (d.updatedAt || 0) > bootTime && !seenDocIds.has('off_' + d.updatedAt)) {
                        seenDocIds.add('off_' + d.updatedAt);
                        triggerUniversalAlert('📢', `Nexus Official ✅: ${d.storyTitle || 'Update'}`, d.storyText || 'Tap to view official announcement', () => {
                            if (window.NexusHome && NexusHome.openOfficialStoryModal) NexusHome.openOfficialStoryModal();
                        });
                    }
                }, () => {});
        }
    }

    window.NexusNotify = {
        triggerAlert: triggerUniversalAlert,

        openBellModal: function() {
            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (!me) { Nexus.switchTab('tab-profile'); return; }
            requestNativeNotificationPermissionOnce();
            rebuildCombinedNotificationList();

            lastSeenCount = allMyNotifications.length;
            localStorage.setItem('nx_notify_seen_cnt_v1', String(lastSeenCount));
            refreshBellBadgeUI();

            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;

            modal.innerHTML = `
                <div class="nx-modal-box" style="border:1.5px solid #10b981; max-width:415px; background:#090d16;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <h3 style="font-size:16px; color:#f8fafc;">🔔 Live Notifications (${allMyNotifications.length})</h3>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:8px; max-height:60vh; overflow-y:auto;">
                        ${allMyNotifications.length === 0
                            ? `<div style="text-align:center; padding:22px; color:#64748b; font-size:13px;">All caught up! New messages, calls, likes &amp; follows will appear here live.</div>`
                            : allMyNotifications.map(item => {
                                let safeU = String(item.fromUser || '').replace(/'/g, "\\'");
                                let safeN = String(item.fromName || item.fromUser || '').replace(/'/g, "\\'");
                                let clickCode = item.actionType === 'dm'
                                    ? `document.getElementById('nx-global-modal').style.display='none'; if(window.NexusDM) NexusDM.openDirectChat('${safeU}', '${safeN}', '');`
                                    : `document.getElementById('nx-global-modal').style.display='none'; Nexus.openPublicProfile('${safeU}');`;
                                return `
                                    <div onclick="${clickCode}" style="padding:10px 12px; background:#161f33; border:1px solid #1e293b; border-left:3.5px solid #10b981; border-radius:12px; font-size:12.5px; color:#e2e8f0; display:flex; align-items:center; gap:10px; cursor:pointer;">
                                        <span style="font-size:19px;">${item.icon}</span>
                                        <div style="flex:1; line-height:1.4;">${item.html}</div>
                                        <span style="font-size:10.5px; color:#38bdf8; font-weight:800;">Open →</span>
                                    </div>
                                `;
                            }).join('')
                        }
                    </div>
                </div>
            `;
            modal.style.display = 'flex';
        }
    };

    function bindBellIconToNotifyEngine() {
        if (window.Nexus) {
            Nexus.openNotifications = () => window.NexusNotify.openBellModal();
            Nexus.pushRealNotification = function(toUser, type, text) {
                let me = Nexus.getCurrentUser();
                if (!me || !Nexus.db || !toUser) return;
                if (String(toUser).toLowerCase().trim() === me.username.toLowerCase().trim()) return;
                Nexus.db.collection("nexus_notifications").add({
                    toUser: String(toUser).toLowerCase().trim(),
                    fromUser: me.username,
                    fromName: me.name || me.username,
                    type: type || 'info',
                    text: text || 'interacted with you',
                    createdAt: Date.now()
                }).catch(() => {});
            };
        }
        startRealtimeNotificationListeners();
    }

    setInterval(bindBellIconToNotifyEngine, 1200);
    setTimeout(bindBellIconToNotifyEngine, 150);
})();
