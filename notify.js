// ================= NOTIFY.JS (v11.0 UNIFIED PRO MASTER): 🔔 SINGLE AUTHORITATIVE NOTIFICATION ENGINE (ZERO CONFLICT WITH PROFILE.JS) + SUPABASE & FIREBASE DUAL-SYNC + FILTER TABS + OS WEB PUSH + QUICK DND + SOUND CHIME =================

(function() {
    if (window.__NEXUS_NOTIFY_MASTER_V11__) return;
    window.__NEXUS_NOTIFY_MASTER_V11__ = true;

    let dmNotifUnsub = null;
    let customNotifUnsub = null;
    let sbMsgChannel = null;
    let bootTimestamp = Date.now();
    let alertedIds = new Set();
    let activeNotifFilter = 'all'; // 'all' | 'dm' | 'social'

    const escHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
    const normU = (u) => String(u || '').toLowerCase().replace(/^@/, '').trim();

    function getMe() {
        try {
            if (window.Nexus && typeof Nexus.getCurrentUser === 'function') {
                const u = Nexus.getCurrentUser();
                if (u && u.username) return u;
            }
            const raw = localStorage.getItem('nx_active_account');
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return null;
    }

    function getSettingsPrefs() {
        try {
            return JSON.parse(localStorage.getItem('nx_ig_user_preferences_v1') || '{}');
        } catch (e) { return {}; }
    }

    function isNotificationsMutedOrDnd() {
        if (localStorage.getItem('nexus_mute_notifications') === 'true') return true;
        const prefs = getSettingsPrefs();
        return Boolean(prefs.dndMode === true || prefs.pushNotifications === false);
    }

    function formatShortAgo(ts) {
        const num = Number(ts || 0);
        if (!num || num < 1000000000000) return 'Now';
        const sec = Math.max(1, Math.floor((Date.now() - num) / 1000));
        if (sec < 60) return 'Just now';
        if (sec < 3600) return Math.floor(sec / 60) + 'm ago';
        if (sec < 86400) return Math.floor(sec / 3600) + 'h ago';
        return Math.floor(sec / 86400) + 'd ago';
    }

    // Crystal-Clear Web Audio Notification Chime (Respects Settings DND & Push Toggle)
    function playNotificationRing() {
        if (isNotificationsMutedOrDnd()) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioCtx();
            const now = ctx.currentTime;
            [587.33, 880].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.11);
                gain.gain.setValueAtTime(0.18, now + i * 0.11);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.11 + 0.28);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.11);
                osc.stop(now + i * 0.11 + 0.3);
            });
        } catch (e) {}
    }

    function sendOsWebPushIfHidden(notif) {
        if (isNotificationsMutedOrDnd()) return;
        if (document.visibilityState === 'visible') return;
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        try {
            const osN = new Notification(notif.title || 'Nexus Community', {
                body: notif.body || 'New activity on Nexus',
                tag: notif.id || 'nx_notif',
                renotify: false
            });
            osN.onclick = () => {
                window.focus();
                osN.close();
                if (notif.type === 'dm' && notif.fromUser && window.NexusDM) {
                    NexusDM.openDirectChat(notif.fromUser, notif.fromName || notif.fromUser, '');
                } else {
                    window.openNotificationDrawer();
                }
            };
        } catch (e) {}
    }

    function updateNotifBellBadge() {
        const dot = document.getElementById('nx-notif-dot');
        if (!dot) return;
        try {
            const stored = JSON.parse(localStorage.getItem('nexus_notifications_v10') || '[]');
            const unread = stored.filter(x => x && !x.read).length;
            if (unread > 0) {
                dot.innerText = unread > 99 ? '99+' : String(unread);
                dot.style.display = 'inline-block';
            } else {
                dot.style.display = 'none';
            }
        } catch (e) {}
    }

    function saveAndPopupNotification(notif) {
        if (!notif || !notif.id || alertedIds.has(notif.id)) return;
        alertedIds.add(notif.id);

        // Don't pop up DM toast if currently chatting with the exact same person!
        const activeChatPartner = normU((window.NexusDM && NexusDM.activePartner) || window.activeDMUser || '');
        const dmRoot = document.getElementById('nx-dm-dedicated-root');
        const isCurrentlyChattingWithSender = Boolean(
            notif.type === 'dm' &&
            dmRoot && dmRoot.style.display !== 'none' &&
            activeChatPartner && activeChatPartner === normU(notif.fromUser)
        );
        if (isCurrentlyChattingWithSender) return;

        const stored = JSON.parse(localStorage.getItem('nexus_notifications_v10') || '[]');
        if (!stored.some(x => x.id === notif.id)) {
            stored.unshift(Object.assign({ createdAt: Date.now(), read: false }, notif));
            try { localStorage.setItem('nexus_notifications_v10', JSON.stringify(stored.slice(0, 60))); } catch (e) {}
        }

        updateNotifBellBadge();
        if (isNotificationsMutedOrDnd()) return;

        playNotificationRing();
        sendOsWebPushIfHidden(notif);

        // Remove any previous banner so banners never stack on top of each other
        document.getElementById('nx-live-notif-banner')?.remove();

        const pop = document.createElement('div');
        pop.id = 'nx-live-notif-banner';
        pop.style.cssText = `
            position: fixed; top: 12px; left: 50%; transform: translateX(-50%);
            z-index: 298000; width: calc(100% - 24px); max-width: 390px;
            background: rgba(15, 23, 42, 0.96); backdrop-filter: blur(10px);
            border: 1.5px solid #38bdf8; border-left: 4px solid #10b981;
            border-radius: 16px; padding: 12px 15px; color: #f8fafc;
            display: flex; align-items: center; gap: 12px;
            box-shadow: 0 16px 40px rgba(0,0,0,0.75); cursor: pointer;
            font-family: system-ui, sans-serif;
        `;
        const icon = notif.type === 'like' ? '❤️' : (notif.type === 'follow' ? '👤' : (notif.type === 'comment' ? '💬' : '✉️'));
        pop.innerHTML = `
            <div style="width:38px;height:38px;border-radius:12px;background:rgba(16,185,129,0.16);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${icon}</div>
            <div style="flex:1;min-width:0;">
                <div style="font-weight:800;font-size:13px;color:#5eead4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(notif.title || 'New Notification')}</div>
                <div style="font-size:12px;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(notif.body || '')}</div>
            </div>
            <span style="font-size:10.5px;color:#38bdf8;font-weight:900;">Open</span>
        `;
        pop.onclick = () => {
            pop.remove();
            if (notif.type === 'dm' && notif.fromUser && window.NexusDM) {
                NexusDM.openDirectChat(notif.fromUser, notif.fromName || notif.fromUser, '');
            } else {
                window.openNotificationDrawer();
            }
        };
        document.body.appendChild(pop);
        setTimeout(() => { if (pop.parentNode) pop.remove(); }, 4200);
    }

    function gatherAllCombinedNotifications() {
        const me = getMe();
        const stored = JSON.parse(localStorage.getItem('nexus_notifications_v10') || '[]');
        const seenKeys = new Set(stored.map(x => x && x.id));
        const extra = [];

        if (me && me.username) {
            const myU = normU(me.username);
            // Likes & Comments on current user's posts
            if (Array.isArray(window.Nexus && Nexus.posts)) {
                Nexus.posts.forEach(p => {
                    if (!p || normU(p.username) !== myU) return;
                    const snip = String(p.content || p.text || 'Media Post').slice(0, 48);
                    (Array.isArray(p.likedBy) ? p.likedBy : []).forEach(liker => {
                        const lk = normU(liker);
                        if (!lk || lk === myU) return;
                        const k = `like_${p.id}_${lk}`;
                        if (!seenKeys.has(k)) {
                            seenKeys.add(k);
                            extra.push({
                                id: k, type: 'like', fromUser: lk, fromName: '@' + lk,
                                title: `❤️ @${lk} liked your post`, body: snip,
                                timeStr: formatShortAgo(p.createdAt), createdAt: Number(p.createdAt || 0), read: true
                            });
                        }
                    });
                    (Array.isArray(p.comments) ? p.comments : []).forEach((c, idx) => {
                        if (!c) return;
                        const cu = normU(c.username || c.author);
                        if (!cu || cu === myU) return;
                        const k = `comm_${p.id}_${idx}`;
                        if (!seenKeys.has(k)) {
                            seenKeys.add(k);
                            extra.push({
                                id: k, type: 'comment', fromUser: cu, fromName: c.author || '@' + cu,
                                title: `💬 ${c.author || '@' + cu} commented`, body: String(c.text || c.content || '').slice(0, 60),
                                timeStr: c.time || formatShortAgo(c.createdAt || p.createdAt), createdAt: Number(c.createdAt || p.createdAt || 0), read: true
                            });
                        }
                    });
                });
            }

            // Real Followers from Master Users List
            const myEntry = ((window.Nexus && Nexus.users) || []).find(u => u && normU(u.username) === myU) || me;
            (Array.isArray(myEntry.followersList) ? myEntry.followersList : []).forEach(f => {
                const fu = normU(f);
                if (!fu || fu === myU) return;
                const k = `fol_${fu}`;
                if (!seenKeys.has(k)) {
                    seenKeys.add(k);
                    extra.push({
                        id: k, type: 'follow', fromUser: fu, fromName: '@' + fu,
                        title: `👤 @${fu} follows you`, body: 'Tap to view profile or message',
                        timeStr: 'Follower', createdAt: Date.now() - 86400000, read: true
                    });
                }
            });
        }

        return [...stored, ...extra].sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)).slice(0, 60);
    }

    // SINGLE AUTHORITATIVE NOTIFICATION CENTER (Filter Tabs + Quick DND + Mark All Read + Clear)
    window.openNotificationDrawer = function() {
        const dot = document.getElementById('nx-notif-dot');
        if (dot) dot.style.display = 'none';

        const stored = JSON.parse(localStorage.getItem('nexus_notifications_v10') || '[]');
        stored.forEach(x => { if (x) x.read = true; });
        try { localStorage.setItem('nexus_notifications_v10', JSON.stringify(stored)); } catch (e) {}

        const combined = gatherAllCombinedNotifications();
        const filtered = combined.filter(n => {
            if (activeNotifFilter === 'dm') return n.type === 'dm';
            if (activeNotifFilter === 'social') return n.type === 'like' || n.type === 'comment' || n.type === 'follow';
            return true;
        });

        const modal = document.getElementById('nx-global-modal');
        if (!modal) return;
        modal.style.zIndex = '272000';

        const isDnd = isNotificationsMutedOrDnd();
        const tabBtn = (id, label) => `<button type="button" data-nflt="${id}" style="flex:1;padding:7px 4px;border-radius:9px;border:none;background:${activeNotifFilter === id ? '#10b981' : '#090d16'};color:${activeNotifFilter === id ? '#020617' : '#94a3b8'};font-size:11.5px;font-weight:900;cursor:pointer;">${label}</button>`;

        modal.innerHTML = `
            <div class="nx-modal-box" style="border:1.5px solid #10b981; max-width:420px; width:100%; background:#0f172a; padding:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:10px; border-bottom:1px solid #1e293b; margin-bottom:10px;">
                    <div>
                        <div style="font-weight:900; font-size:16px; color:#f8fafc;">🔔 Activity Center (${filtered.length})</div>
                        <div style="font-size:10.5px; color:#34d399; font-weight:700;">Live DMs, Likes, Comments &amp; Followers</div>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button type="button" id="nx-notif-dnd-btn" style="background:${isDnd ? '#f59e0b' : '#1e293b'}; color:${isDnd ? '#020617' : '#cbd5e1'}; border:1px solid #334155; padding:4px 9px; border-radius:8px; font-size:11px; font-weight:800; cursor:pointer;">${isDnd ? '🔕 Muted' : '🔊 Sound'}</button>
                        <button type="button" id="nx-notif-clear-btn" style="background:#1e293b; color:#94a3b8; border:1px solid #334155; padding:4px 9px; border-radius:8px; font-size:11px; font-weight:800; cursor:pointer;">Clear</button>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:#ef4444; color:white; border:none; padding:4px 10px; border-radius:8px; font-weight:900; cursor:pointer;">✕</button>
                    </div>
                </div>

                <div style="display:flex; gap:6px; margin-bottom:10px;">
                    ${tabBtn('all', `All (${combined.length})`)}
                    ${tabBtn('dm', `💬 DMs (${combined.filter(x => x.type === 'dm').length})`)}
                    ${tabBtn('social', `❤️ Social (${combined.filter(x => x.type !== 'dm').length})`)}
                </div>

                <div style="display:flex; flex-direction:column; gap:8px; max-height:60dvh; overflow-y:auto;">
                    ${filtered.length === 0
                        ? `<div style="text-align:center; padding:30px 14px; color:#64748b; font-size:13px;">Abhi is category mein koi notification nahi hai.</div>`
                        : filtered.map((n, idx) => {
                            const borderCol = n.type === 'like' ? '#f43f5e' : (n.type === 'follow' ? '#38bdf8' : (n.type === 'comment' ? '#a855f7' : '#10b981'));
                            return `
                                <div data-nclick="${idx}" style="background:#161f33; border:1px solid #1e293b; border-left:3.5px solid ${borderCol}; padding:10px 12px; border-radius:12px; cursor:pointer;">
                                    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                                        <span style="font-weight:800; font-size:13px; color:#f8fafc;">${escHtml(n.title || 'Activity')}</span>
                                        <span style="font-size:10px; color:#38bdf8; font-weight:700; flex-shrink:0;">${escHtml(n.timeStr || formatShortAgo(n.createdAt))}</span>
                                    </div>
                                    <div style="font-size:12px; color:#cbd5e1; margin-top:3px;">${escHtml(n.body || '')}</div>
                                </div>
                            `;
                        }).join('')}
                </div>
            </div>
        `;
        modal.style.display = 'flex';

        modal.querySelectorAll('[data-nflt]').forEach(b => {
            b.onclick = () => { activeNotifFilter = b.getAttribute('data-nflt'); window.openNotificationDrawer(); };
        });

        const dndBtn = modal.querySelector('#nx-notif-dnd-btn');
        if (dndBtn) dndBtn.onclick = () => {
            const prefs = getSettingsPrefs();
            const nextMute = !isNotificationsMutedOrDnd();
            localStorage.setItem('nexus_mute_notifications', nextMute ? 'true' : 'false');
            prefs.pushNotifications = !nextMute;
            try { localStorage.setItem('nx_ig_user_preferences_v1', JSON.stringify(prefs)); } catch (e) {}
            window.openNotificationDrawer();
            if (window.Nexus && Nexus.toast) Nexus.toast(nextMute ? '🔕 Notifications Muted' : '🔊 Notification Sound ON');
        };

        const clrBtn = modal.querySelector('#nx-notif-clear-btn');
        if (clrBtn) clrBtn.onclick = () => {
            localStorage.setItem('nexus_notifications_v10', '[]');
            window.openNotificationDrawer();
            if (window.Nexus && Nexus.toast) Nexus.toast('🧹 Notifications Cleared!');
        };

        modal.querySelectorAll('[data-nclick]').forEach(row => {
            row.onclick = () => {
                const n = filtered[Number(row.getAttribute('data-nclick'))];
                modal.style.display = 'none';
                if (!n || !n.fromUser) return;
                if (n.type === 'dm' && window.NexusDM) {
                    NexusDM.openDirectChat(n.fromUser, n.fromName || n.fromUser, '');
                } else if (window.openPublicUserProfileModal) {
                    window.openPublicUserProfileModal(n.fromUser);
                } else if (window.Nexus && Nexus.openPublicProfile) {
                    Nexus.openPublicProfile(n.fromUser);
                }
            };
        });
    };

    // Neutralize duplicate notification modal inside profile.js so ONLY ONE unified drawer opens!
    window.openNexusRealNotificationsModal = window.openNotificationDrawer;

    // Connect BOTH Firebase & Supabase Real-Time Listeners (Zero Duplicate Listeners!)
    function connectAllNotificationStreams() {
        const me = getMe();
        if (!me || !me.username) return;
        const myU = normU(me.username);

        if (window.Nexus) {
            Nexus.openNotifications = window.openNotificationDrawer;
            Nexus.pushRealNotification = function(targetUsername, type, actionText, snippet) {
                if (!targetUsername || !Nexus.db) return;
                const cleanTarget = normU(targetUsername);
                if (!cleanTarget || cleanTarget === myU) return;
                Nexus.db.collection("nexus_notifications").add({
                    toUser: cleanTarget,
                    fromUser: myU,
                    fromName: me.name || me.username,
                    type: type || 'activity',
                    title: `${type === 'like' ? '❤️' : (type === 'follow' ? '👤' : '💬')} ${me.name || '@' + myU}`,
                    body: `${actionText} ${snippet ? '"' + String(snippet).substring(0, 45) + '"' : ''}`.trim(),
                    timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    createdAt: Date.now()
                }).catch(() => {});
            };
        }

        // 1. Firebase 1:1 DM Listener (FIXED: lowercase myU matches dm.js toUser!)
        if (window.Nexus && Nexus.db && !dmNotifUnsub) {
            dmNotifUnsub = Nexus.db.collection("nexus_private_dms")
                .where("toUser", "==", myU)
                .limit(20)
                .onSnapshot(snap => {
                    snap.docChanges().forEach(change => {
                        if (change.type === 'added') {
                            const m = change.doc.data();
                            if (m && m.createdAt && m.createdAt >= bootTimestamp && !m.deleted && normU(m.fromUser) !== myU) {
                                saveAndPopupNotification({
                                    id: 'dm_' + change.doc.id,
                                    type: 'dm',
                                    fromUser: normU(m.fromUser),
                                    fromName: m.fromName || m.fromUser,
                                    title: `💬 Message from ${m.fromName || '@' + m.fromUser}`,
                                    body: m.text || (m.imgUrl || (m.imgUrls && m.imgUrls.length) ? '📷 Sent a Photo' : (m.videoUrl ? '🎬 Sent a Video' : '🎤 Sent a Voice Note')),
                                    timeStr: m.time || 'Just now',
                                    createdAt: m.createdAt
                                });
                            }
                        }
                    });
                }, () => {});
        }

        // 2. Firebase Like/Follow/Comment Listener
        if (window.Nexus && Nexus.db && !customNotifUnsub) {
            customNotifUnsub = Nexus.db.collection("nexus_notifications")
                .where("toUser", "==", myU)
                .limit(20)
                .onSnapshot(snap => {
                    snap.docChanges().forEach(change => {
                        if (change.type === 'added') {
                            const n = change.doc.data();
                            if (n && n.createdAt && n.createdAt >= bootTimestamp) {
                                saveAndPopupNotification(Object.assign({ id: 'ntf_' + change.doc.id }, n));
                            }
                        }
                    });
                }, () => {});
        }

        // 3. Supabase Real-Time 1:1 Messages Listener (When logged into Supabase)
        if (!sbMsgChannel && window.NexusSecurity && window.NexusSecurity.sb && me.id) {
            try {
                sbMsgChannel = window.NexusSecurity.sb.channel('nx_sb_notif_' + me.id)
                    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${me.id}` }, (payload) => {
                        const row = payload && payload.new;
                        if (!row || row.sender_id === me.id) return;
                        const senderObj = ((window.Nexus && Nexus.users) || []).find(u => u && String(u.id) === String(row.sender_id));
                        const sU = (senderObj && senderObj.username) || 'member';
                        const sName = (senderObj && senderObj.name) || '@' + sU;
                        saveAndPopupNotification({
                            id: 'sbdm_' + row.id,
                            type: 'dm',
                            fromUser: sU,
                            fromName: sName,
                            title: `🔐 Encrypted DM from ${sName}`,
                            body: row.is_view_once ? '1️⃣ View-Once Secret Media' : (row.msg_type === 'image' ? '📸 Photo' : row.msg_type === 'video' ? '🎬 Video' : '💬 New encrypted message'),
                            timeStr: 'Just now',
                            createdAt: Date.now()
                        });
                    })
                    .subscribe();
            } catch (e) {}
        }
    }

    function hookHomeLikeNotification() {
        if (window.NexusHome && NexusHome.toggleLike && !NexusHome.__nxLikeNotifHooked) {
            NexusHome.__nxLikeNotifHooked = true;
            const origLike = NexusHome.toggleLike.bind(NexusHome);
            NexusHome.toggleLike = function(postId) {
                origLike(postId);
                const me = getMe();
                const p = (window.Nexus && Nexus.posts || []).find(x => x && x.id === postId);
                if (me && p && p.username && Array.isArray(p.likedBy) && p.likedBy.some(u => normU(u) === normU(me.username))) {
                    if (Nexus.pushRealNotification) {
                        Nexus.pushRealNotification(p.username, 'like', 'liked your post ❤️:', p.content || p.text || 'Photo');
                    }
                }
            };
        }
    }

    window.NexusNotify = {
        push: function(obj) {
            if (window.Nexus && Nexus.pushRealNotification && obj.toUser) {
                Nexus.pushRealNotification(obj.toUser, obj.type || 'activity', obj.title || '', obj.body || '');
            } else {
                saveAndPopupNotification(Object.assign({ id: 'local_' + Date.now() }, obj));
            }
        },
        openDrawer: window.openNotificationDrawer,
        playRing: playNotificationRing
    };

    // Single lightweight boot (Replaces 800ms CPU loop with 4s background-safe check!)
    setTimeout(() => {
        connectAllNotificationStreams();
        hookHomeLikeNotification();
        updateNotifBellBadge();
    }, 350);
    setInterval(() => {
        if (document.visibilityState === 'hidden') return;
        connectAllNotificationStreams();
        hookHomeLikeNotification();
        if (window.Nexus && Nexus.openNotifications !== window.openNotificationDrawer) {
            Nexus.openNotifications = window.openNotificationDrawer;
        }
        window.openNexusRealNotificationsModal = window.openNotificationDrawer;
    }, 4000);
})();
// === END OF NOTIFY.JS ===
