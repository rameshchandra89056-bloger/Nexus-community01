// ================= NOTIFY.JS (FIRESTORE NATIVE v10.0): 🔔 HEADER BELL ICON DRAWER + REAL-TIME LIKE ❤️, FOLLOW 👤 & 1:1 DM 💬 POPUP WITH RING SOUND =================

(function() {
    let dmNotifUnsub = null;
    let customNotifUnsub = null;
    let bootTimestamp = Date.now();
    let alertedIds = new Set();

    function getMe() {
        try {
            if (window.Nexus && typeof Nexus.getCurrentUser === 'function') {
                return Nexus.getCurrentUser();
            }
        } catch (e) {}
        return null;
    }

    // Crystal-Clear Web Audio Notification Chime (Respects Mute Setting in Settings Tab)
    function playNotificationRing() {
        if (localStorage.getItem('nexus_mute_notifications') === 'true') return;
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

    function saveAndPopupNotification(notif) {
        if (!notif || !notif.id || alertedIds.has(notif.id)) return;
        alertedIds.add(notif.id);

        const stored = JSON.parse(localStorage.getItem('nexus_notifications_v10') || '[]');
        if (!stored.some(x => x.id === notif.id)) {
            stored.unshift(notif);
            localStorage.setItem('nexus_notifications_v10', JSON.stringify(stored.slice(0, 50)));
        }

        // Show red badge on Header Bell Icon (#nx-notif-dot in index.html)
        const dot = document.getElementById('nx-notif-dot');
        if (dot) {
            const count = Math.min(99, stored.filter(x => !x.read).length || 1);
            dot.innerText = count;
            dot.style.display = 'inline-block';
        }

        playNotificationRing();

        // Sleek Tailwind-Styled Floating Popup Banner
        const pop = document.createElement('div');
        pop.style.cssText = `
            position: fixed; top: 12px; left: 50%; transform: translateX(-50%);
            z-index: 2147483647; width: calc(100% - 24px); max-width: 390px;
            background: rgba(15, 23, 42, 0.96); backdrop-filter: blur(12px);
            border: 1.5px solid #38bdf8; border-left: 4px solid #10b981;
            border-radius: 16px; padding: 12px 15px; color: #f8fafc;
            display: flex; align-items: center; gap: 12px;
            box-shadow: 0 16px 40px rgba(0,0,0,0.75); cursor: pointer;
            font-family: system-ui, sans-serif;
        `;
        const icon = notif.type === 'like' ? '❤️' : (notif.type === 'follow' ? '👤' : '💬');
        pop.innerHTML = `
            <div style="width:38px;height:38px;border-radius:12px;background:rgba(16,185,129,0.16);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${icon}</div>
            <div style="flex:1;min-width:0;">
                <div style="font-weight:800;font-size:13px;color:#5eead4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${notif.title || 'New Notification'}</div>
                <div style="font-size:12px;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${notif.body || ''}</div>
            </div>
            <span style="font-size:10px;color:#38bdf8;font-weight:800;">View</span>
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
        setTimeout(() => { if (pop.parentNode) pop.remove(); }, 4000);
    }

    // Official Notification Center Modal (Opened when clicking Header Bell Icon 🔔)
    window.openNotificationDrawer = function() {
        const dot = document.getElementById('nx-notif-dot');
        if (dot) dot.style.display = 'none';

        const me = getMe();
        const stored = JSON.parse(localStorage.getItem('nexus_notifications_v10') || '[]');
        stored.forEach(x => { x.read = true; });
        localStorage.setItem('nexus_notifications_v10', JSON.stringify(stored));

        // Also gather real likes & comments on current user's posts from Nexus.posts
        const postActivity = [];
        if (me && Array.isArray(window.Nexus && Nexus.posts)) {
            const myU = me.username.toLowerCase();
            Nexus.posts.forEach(p => {
                if (p && p.username && p.username.toLowerCase() === myU) {
                    (p.likedBy || []).forEach(liker => {
                        if (String(liker).toLowerCase() !== myU) {
                            postActivity.push({
                                type: 'like',
                                title: `❤️ @${liker} liked your post`,
                                body: (p.text || 'Photo Post').substring(0, 48),
                                timeStr: 'Post Activity',
                                fromUser: liker
                            });
                        }
                    });
                    (p.comments || []).forEach(c => {
                        if (c && c.username && c.username.toLowerCase() !== myU) {
                            postActivity.push({
                                type: 'comment',
                                title: `💬 @${c.username} commented on your post`,
                                body: (c.text || '').substring(0, 55),
                                timeStr: c.time || 'Recent',
                                fromUser: c.username
                            });
                        }
                    });
                }
            });
        }

        const combined = [...stored, ...postActivity].slice(0, 45);
        const modal = document.getElementById('nx-global-modal');
        if (!modal) return;

        modal.innerHTML = `
            <div class="nx-modal-box" style="border:1.5px solid #38bdf8; max-width:410px; width:100%; background:#0f172a; padding:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:10px; border-bottom:1px solid #1e293b; margin-bottom:12px;">
                    <div style="font-weight:900; font-size:16px; color:#f8fafc;">🔔 Activity &amp; Notifications (${combined.length})</div>
                    <div style="display:flex; gap:6px;">
                        <button type="button" onclick="localStorage.setItem('nexus_notifications_v10','[]'); window.openNotificationDrawer();" style="background:#1e293b; color:#94a3b8; border:1px solid #334155; padding:4px 9px; border-radius:8px; font-size:11px; font-weight:800; cursor:pointer;">Clear</button>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:#ef4444; color:white; border:none; padding:4px 10px; border-radius:8px; font-weight:900; cursor:pointer;">✕</button>
                    </div>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px; max-height:64dvh; overflow-y:auto;">
                    ${combined.length === 0
                        ? `<div style="text-align:center; padding:28px 14px; color:#64748b; font-size:13px;">Abhi koi naya Like, Follow ya 1:1 Message notification nahi hai.</div>`
                        : combined.map(n => {
                            const safeU = (n.fromUser || '').replace(/'/g, "\\'");
                            const borderCol = n.type === 'like' ? '#f43f5e' : (n.type === 'follow' ? '#38bdf8' : '#10b981');
                            return `
                                <div onclick="document.getElementById('nx-global-modal').style.display='none'; ${safeU ? `if('${n.type}'==='dm' && window.NexusDM){NexusDM.openDirectChat('${safeU}','${safeU}','');}else if(window.Nexus){Nexus.openPublicProfile('${safeU}');}` : ''}" style="background:#161f33; border:1px solid #1e293b; border-left:3.5px solid ${borderCol}; padding:10px 12px; border-radius:12px; cursor:pointer;">
                                    <div style="display:flex; justify-content:space-between; align-items:center;">
                                        <span style="font-weight:800; font-size:13px; color:#f8fafc;">${(n.title || '').replace(/</g, '&lt;')}</span>
                                        <span style="font-size:10px; color:#38bdf8; font-weight:700;">${n.timeStr || 'Now'}</span>
                                    </div>
                                    <div style="font-size:12px; color:#cbd5e1; margin-top:3px;">${(n.body || '').replace(/</g, '&lt;')}</div>
                                </div>
                            `;
                        }).join('')}
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    };

    // Connect Firestore Listeners for Incoming 1:1 DMs, Likes & Follows
    function connectFirestoreNotifications() {
        const me = getMe();
        if (!me || !me.username || !window.Nexus || !Nexus.db) return;
        const myU = me.username.toLowerCase().trim();

        if (window.Nexus) {
            Nexus.openNotifications = window.openNotificationDrawer;
            Nexus.pushRealNotification = function(targetUsername, type, actionText, snippet) {
                if (!targetUsername || !Nexus.db) return;
                const cleanTarget = String(targetUsername).toLowerCase().trim();
                if (cleanTarget === myU) return;
                Nexus.db.collection("nexus_notifications").add({
                    toUser: cleanTarget,
                    fromUser: me.username,
                    fromName: me.name || me.username,
                    type: type || 'activity',
                    title: `${type === 'like' ? '❤️' : (type === 'follow' ? '👤' : '💬')} ${me.name || '@' + me.username}`,
                    body: `${actionText} ${snippet ? '"' + snippet.substring(0, 40) + '"' : ''}`.trim(),
                    timeStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    createdAt: Date.now()
                }).catch(() => {});
            };
        }

        // 1. Watch Incoming 1:1 Private DMs in Real-Time
        if (!dmNotifUnsub) {
            dmNotifUnsub = Nexus.db.collection("nexus_private_dms")
                .where("toUser", "==", me.username)
                .limit(20)
                .onSnapshot(snap => {
                    snap.docChanges().forEach(change => {
                        if (change.type === 'added') {
                            const m = change.doc.data();
                            if (m && m.createdAt && m.createdAt >= bootTimestamp && !m.deleted && String(m.fromUser || '').toLowerCase() !== myU) {
                                saveAndPopupNotification({
                                    id: 'dm_' + change.doc.id,
                                    type: 'dm',
                                    fromUser: m.fromUser,
                                    fromName: m.fromName || m.fromUser,
                                    title: `💬 Message from ${m.fromName || '@' + m.fromUser}`,
                                    body: m.text || (m.imgUrl ? '📷 Sent a Photo' : (m.videoUrl ? '🎬 Sent a Video' : '🎤 Sent a Voice Note')),
                                    timeStr: m.time || 'Just now'
                                });
                            }
                        }
                    });
                }, () => {});
        }

        // 2. Watch Incoming Follow & Like Notifications in Real-Time
        if (!customNotifUnsub) {
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
    }

    // Hook into Post Like button in Home Feed so liking any post sends a real-time notification to the post owner!
    function hookHomeLikeNotification() {
        if (window.NexusHome && NexusHome.toggleLike && !NexusHome.__nxLikeNotifHooked) {
            NexusHome.__nxLikeNotifHooked = true;
            const origLike = NexusHome.toggleLike.bind(NexusHome);
            NexusHome.toggleLike = function(postId) {
                origLike(postId);
                const me = getMe();
                const p = (window.Nexus && Nexus.posts || []).find(x => x && x.id === postId);
                if (me && p && p.username && Array.isArray(p.likedBy) && p.likedBy.some(u => String(u).toLowerCase() === me.username.toLowerCase())) {
                    if (Nexus.pushRealNotification) {
                        Nexus.pushRealNotification(p.username, 'like', 'liked your post ❤️:', p.text || 'Photo');
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
        playRing: playNotificationRing
    };

    setInterval(() => {
        connectFirestoreNotifications();
        hookHomeLikeNotification();
        if (window.Nexus) Nexus.openNotifications = window.openNotificationDrawer;
    }, 800);
    setTimeout(connectFirestoreNotifications, 300);
})();
// === END OF NOTIFY.JS ===
