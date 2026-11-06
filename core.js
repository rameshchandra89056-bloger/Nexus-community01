// ================= CORE.JS (v18.0 ALL-IN-ONE SIMPLE & FAST MASTER): ✨ 4-CARD GLOWING GRID (NO DUPLICATES) + 📝 IN-APP CHALLENGER WEBSITE PORTAL + 🔔 100% WORKING NOTIFICATIONS (NO CLOCK BUG) + ➕ UNLIMITED EMOJI REACTIONS & POST LIKES + ▶️ INSTant YOUTUBE WATCH-PARTY & FULL MP3 DJ + 📹 2-WAY 1:1 & GROUP VIDEO CALL =================

(function() {
    const PROTO = 'https:' + '//';
    const RTC_ICE = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" }
        ]
    };

    // Flush old cache once so new changes apply immediately
    if ('caches' in window && !sessionStorage.getItem('nx_flushed_v18')) {
        sessionStorage.setItem('nx_flushed_v18', '1');
        caches.keys().then(names => names.forEach(n => caches.delete(n))).catch(() => {});
    }

    let isTyping = false, typTimer = null;
    let aiChatHistory = [];
    let isSwaraSpeaking = false;
    let aiRequestInProgress = false;
    try {
        const storedAiHistory = JSON.parse(localStorage.getItem('nx_private_ai_history_v1') || '[]');
        aiChatHistory = Array.isArray(storedAiHistory) ? storedAiHistory.slice(-20) : [];
    } catch (e) {
        aiChatHistory = [];
    }
    const markTyping = () => {
        isTyping = true;
        clearTimeout(typTimer);
        typTimer = setTimeout(() => { isTyping = false; }, 1200);
    };
    document.addEventListener('keydown', markTyping, { passive: true });
    document.addEventListener('input', markTyping, { passive: true });

    // State for Notifications (Zero Clock-Skew Diff Engine)
    let dmUnsub = null, notifUnsub = null, callUnsub = null;
    let initialDmLoaded = false, initialNotifLoaded = false;
    let knownDmIds = new Set(), knownNotifIds = new Set();
    let dmSummaryMap = {}, totalUnreadDms = 0;
    let pinnedFriends = [];
    try { pinnedFriends = JSON.parse(localStorage.getItem('nx_pinned_friends_v18') || '[]'); } catch (e) { pinnedFriends = []; }
    let activeInboxFilter = 'all', friendSearchQ = '';

    // State for Watch-Party & Full MP3 Song DJ
    let wpUnsub = null, activeWpRoom = '', currentMediaKey = '', currentMode = 'yt';
    let isMainHidden = false, isRelHidden = false, isRemoteSync = false;
    let relatedCache = [], audioSpeed = 1;

    // State for 2-Way WebRTC Video Call
    let activeStreams = [], activeCallRoom = '', callPc = null, callSigUnsub = null, ringInterval = null;

    // Default Challenger Website URL (Can be updated in-app anytime)
    let challengerSiteUrl = localStorage.getItem('nx_challenger_site_url_v18') || 'https://challenger-classes.netlify.app';

    const st = document.createElement('style');
    st.innerHTML = `
        /* Hide only the old DM shortcut that is replaced by the two-card grid. */
        #nx-dm-inbox-banner > [onclick*="NexusDM.openInboxModal"],
        #nx-pro-dm-home-card, #nx-grp-wp-box, #nx-dm-wp-box, #nx-watch-party-box {
            display: none !important;
        }
        #nx-structured-4card-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
            width: 100% !important;
            margin-bottom: 10px !important;
        }
        .nx-half-card {
            position: relative;
            background: linear-gradient(145deg, #111827 0%, #090d16 100%);
            border: 1.5px solid #1e293b;
            border-radius: 18px;
            padding: 13px 12px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 110px;
            cursor: pointer;
            overflow: hidden;
            transition: transform 0.16s ease;
            box-shadow: 0 8px 22px rgba(0,0,0,0.55);
        }
        .nx-half-card:active { transform: scale(0.96); }

        /* Simple static accent line: no moving beam or flashing animation. */
        .nx-card-glow-beam {
            position: absolute; top: 0; left: 12px; right: 12px; height: 1px;
            background: var(--beam-color, rgba(148, 163, 184, 0.45));
            opacity: 0.42;
            border-radius: 999px;
            pointer-events: none;
        }

        /* Clean Deleted Message Pill */
        .nx-single-deleted-pill {
            background: rgba(239,68,68,0.14) !important; border: 1.5px dashed rgba(248,113,113,0.65) !important;
            color: #fecaca !important; padding: 7px 13px !important; border-radius: 12px !important;
            font-size: 12.5px !important; font-style: italic !important; display: block !important; width: fit-content !important;
        }
        .nx-single-deleted-pill *, .nx-dm-bubble-anim.nx-deleted-row-clean {
            border: none !important; background: transparent !important; padding: 0 !important; display: inline !important;
        }
        .nx-dm-bubble-anim.nx-deleted-row-clean { display: flex !important; margin: 2px 0 !important; }
        .nx-dm-live-react-pill {
            display: inline-flex; align-items: center; gap: 4px; background: #182229;
            border: 1.5px solid #00a884; color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 11.5px; font-weight: 800; margin-top: 3px;
        }

        /* Top Instant Notification Banner */
        #nx-top-push-banner {
            position: fixed; top: 10px; left: 50%; transform: translateX(-50%) translateY(-160%);
            width: 94%; max-width: 415px; background: linear-gradient(135deg, #0f172a, #064e3b);
            border: 2px solid #10b981; border-radius: 16px; padding: 12px 14px; z-index: 100400;
            display: flex; align-items: center; justify-content: space-between; gap: 10px;
            box-shadow: 0 16px 40px rgba(0,0,0,0.92); transition: transform 0.25s ease; cursor: pointer;
        }
        #nx-top-push-banner.show { transform: translateX(-50%) translateY(0); }

        /* Full-Screen Modals (1:1 DM Hub, Challenger Portal, Video Call, AI Studio) */
        .nx-fullscreen-overlay {
            position: fixed; inset: 0; width: 100%; max-width: 640px; height: 100dvh;
            margin: 0 auto; background: #090d16; z-index: 100200;
            display: none; flex-direction: column; overflow: hidden;
        }
        .nx-horiz-scroll {
            display: flex !important; flex-wrap: nowrap !important; gap: 9px;
            overflow-x: auto !important; overflow-y: hidden !important;
            -webkit-overflow-scrolling: touch !important; touch-action: pan-x !important;
            scrollbar-width: none; padding: 6px 12px 10px;
        }
        .nx-horiz-scroll::-webkit-scrollbar { display: none; }
        .nx-tw-pill {
            background: #1e293b; border: 1px solid #334155; color: #f8fafc;
            padding: 5px 10px; border-radius: 9px; font-size: 11px; font-weight: 800;
            cursor: pointer; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; flex-shrink: 0;
        }
        .nx-tw-pill:active { transform: scale(0.94); }
        /* Private AI Studio panel */
        #nx-private-ai-studio {
            position: fixed; inset: 0; left: 50%; transform: translateX(-50%);
            width: 100%; max-width: 640px; height: 100dvh; margin: 0 auto;
            background: #090d16; z-index: 100500; display: none;
            flex-direction: column; overflow: hidden; color: #f8fafc;
        }
        #nx-private-ai-studio .nx-ai-studio-header {
            min-height: 58px; display: flex; align-items: center; justify-content: space-between;
            gap: 8px; padding: 8px 12px; background: #111827; border-bottom: 1px solid #293548;
        }
        #nx-private-ai-studio .nx-ai-studio-messages {
            flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 12px;
            display: flex; flex-direction: column; gap: 10px; background: #090d16;
        }
        #nx-private-ai-studio .nx-ai-studio-composer {
            display: flex; align-items: center; gap: 8px; padding: 9px 10px;
            background: #111827; border-top: 1px solid #293548; flex-shrink: 0;
        }
        #nx-private-ai-studio .nx-ai-studio-composer input {
            flex: 1; min-width: 0; height: 42px; padding: 9px 14px; border-radius: 22px;
            border: 1px solid #334155; background: #202c33; color: #fff; font-size: 14px; outline: none;
        }
        #nx-private-ai-studio button:disabled { opacity: .55; cursor: wait; }
        #nx-wp-dock {
            background: #0f172a; border-bottom: 2px solid #10b981; width: 100%;
            flex-shrink: 0; z-index: 35; display: none; flex-direction: column;
        }
        @keyframes nxSpinVinyl { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .nx-vinyl-spin {
            width: 46px; height: 46px; border-radius: 50%; object-fit: cover;
            border: 2px solid #10b981; animation: nxSpinVinyl 6s linear infinite; flex-shrink: 0;
        }
    `;
    document.head.appendChild(st);

    // =========================================================================
    // 1. 🧹 HIDE DUPLICATE BOTTOM CARDS ("Live Test Series" & "PDF Study Vault")
    // Captures any original URL before hiding the duplicate row in Screenshot 1000073344.jpg!
    // =========================================================================
    function removeDuplicateCommunityCards() {
        const comm = document.getElementById('tab-community');
        if (!comm) return;

        comm.querySelectorAll('div, button, a').forEach(el => {
            if (el.closest('#nx-structured-4card-grid') || el.id === 'nx-structured-4card-grid') return;
            const txt = (el.innerText || '').trim();
            if (txt !== 'Live Test Series' && !txt.startsWith('PDF Study Vault')) return;

            // Hide only the old duplicate row containing BOTH cards. Do not hide
            // a standalone PDF library entry or the primary Challenger portal.
            const parentRow = el.parentElement;
            const rowText = (parentRow && parentRow.innerText || '').trim();
            const isDuplicatePair = parentRow && parentRow.id !== 'tab-community' &&
                rowText.includes('Live Test Series') && rowText.includes('PDF Study Vault');
            if (!isDuplicatePair) return;

            const onclickText = el.getAttribute('onclick') || '';
            const urlMatch = onclickText.match(/https?:\/\/[^\s'"]+/) || (el.href ? [el.href] : null);
            if (urlMatch && urlMatch[0] && !urlMatch[0].includes('netlify.app/#')) {
                challengerSiteUrl = urlMatch[0];
            }
            parentRow.style.setProperty('display', 'none', 'important');
        });
    }

    // =========================================================================
    // 2. 📐 RENDER ONLY THE TWO PRIMARY SHORTCUT CARDS
    // =========================================================================
    function renderFourGlowingCards() {
        const banner = document.getElementById('nx-dm-inbox-banner');
        if (!banner) return;

        let grid = document.getElementById('nx-structured-4card-grid');
        if (!grid) {
            grid = document.createElement('div');
            grid.id = 'nx-structured-4card-grid';
            banner.insertBefore(grid, banner.firstChild);
        }

        let allUsers = (window.Nexus && Nexus.users || []).filter(u => u && u.username && u.username !== 'nexus_official');
        let onlineCount = allUsers.filter(u => (Date.now() - (u.lastOnline || 0)) < 180000).length;

        grid.innerHTML = `
            <!-- CARD 1: 1:1 Personal DM -->
            <div class="nx-half-card" style="border-color:rgba(16,185,129,0.5);" role="button" tabindex="0" onclick="NexusDmInbox.openFullScreenDmHub()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();NexusDmInbox.openFullScreenDmHub();}">
                <div class="nx-card-glow-beam" style="--beam-color:#10b981;"></div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="width:36px; height:36px; border-radius:11px; background:rgba(16,185,129,0.18); border:1px solid #10b981; display:flex; align-items:center; justify-content:center; font-size:18px;">💬</div>
                    <span style="background:rgba(16,185,129,0.2); color:#10b981; font-size:10px; font-weight:900; padding:2px 7px; border-radius:99px;">
                        ${totalUnreadDms > 0 ? `${totalUnreadDms} New` : `${onlineCount} Live`}
                    </span>
                </div>
                <div style="margin-top:8px;">
                    <div style="font-size:13.5px; font-weight:900; color:#f8fafc;">1:1 Personal DM</div>
                    <div style="font-size:10.5px; color:#6ee7b7; margin-top:2px; font-weight:700;">${allUsers.length} Friends • Calls &amp; DJ →</div>
                </div>
            </div>

            <!-- CARD 2: Private AI Studio -->
            <div class="nx-half-card" style="border-color:rgba(167,139,250,0.5);" role="button" tabindex="0" onclick="NexusCore.openAiStudio()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();NexusCore.openAiStudio();}">
                <div class="nx-card-glow-beam" style="--beam-color:#a78bfa;"></div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="width:36px; height:36px; border-radius:11px; background:rgba(139,92,246,0.2); border:1px solid #a78bfa; display:flex; align-items:center; justify-content:center; font-size:18px;">🤖</div>
                    <span style="background:rgba(167,139,250,0.2); color:#d8b4fe; font-size:10px; font-weight:900; padding:2px 7px; border-radius:99px;">11 Servers</span>
                </div>
                <div style="margin-top:8px;">
                    <div style="font-size:13.5px; font-weight:900; color:#f8fafc;">Private AI Studio</div>
                    <div style="font-size:10.5px; color:#d8b4fe; margin-top:2px; font-weight:700;">🔊 Swara • 🎨 Image Gen →</div>
                </div>
            </div>

        `;
    }

    // =========================================================================
    // 3. 🔔 100% WORKING REALTIME NOTIFICATIONS (Snapshot Diff Engine — Zero Clock Bug!)
    // =========================================================================
    function playBeepChime() {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            const ctx = new Ctx();
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.frequency.setValueAtTime(659.25, ctx.currentTime);
            o.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
            g.gain.setValueAtTime(0.15, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            o.connect(g); g.connect(ctx.destination);
            o.start(); o.stop(ctx.currentTime + 0.35);
            if (navigator.vibrate) navigator.vibrate([140, 70, 140]);
        } catch (e) {}
    }

    function showLiveNotificationBanner(icon, title, subtitle, onClickFn) {
        playBeepChime();
        let bar = document.getElementById('nx-top-push-banner');
        if (!bar) { bar = document.createElement('div'); bar.id = 'nx-top-push-banner'; document.body.appendChild(bar); }
        bar.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
                <div style="width:38px; height:38px; border-radius:12px; background:linear-gradient(135deg,#10b981,#2563eb); color:#fff; display:flex; align-items:center; justify-content:center; font-size:19px; flex-shrink:0;">${icon}</div>
                <div style="min-width:0; flex:1;">
                    <div style="font-size:13px; font-weight:900; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${title}</div>
                    <div style="font-size:11.5px; color:#6ee7b7; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${subtitle}</div>
                </div>
            </div>
            <span style="background:#10b981; color:#020617; padding:5px 10px; border-radius:8px; font-size:11px; font-weight:900; flex-shrink:0;">View →</span>
        `;
        bar.onclick = () => { bar.classList.remove('show'); if (onClickFn) onClickFn(); };
        bar.classList.add('show');
        clearTimeout(bar.__t);
        bar.__t = setTimeout(() => bar.classList.remove('show'), 5000);

        const dot = document.getElementById('nx-notif-dot');
        if (dot) { dot.innerText = '●'; dot.style.display = 'inline-block'; }

        if ('Notification' in window && Notification.permission === 'granted') {
            try { new Notification(title, { body: subtitle }); } catch (e) {}
        }
    }

    function startBulletproofNotificationWatchers() {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        if (!me || !me.username || !Nexus.db) return;
        let myU = me.username.toLowerCase().trim();

        // Watcher 1: 1:1 DMs, Replies, Voice Notes & Inbox Summary (Zero Clock Bug!)
        if (!dmUnsub) {
            dmUnsub = Nexus.db.collection("nexus_private_dms")
                .orderBy("createdAt", "desc")
                .limit(70)
                .onSnapshot(snap => {
                    dmSummaryMap = {};
                    totalUnreadDms = 0;

                    snap.forEach(doc => {
                        let m = doc.data();
                        if (!m) return;
                        let fU = String(m.fromUser || '').toLowerCase().trim();
                        let tU = String(m.toUser || '').toLowerCase().trim();

                        if (!initialDmLoaded) {
                            knownDmIds.add(doc.id);
                        } else if (!knownDmIds.has(doc.id)) {
                            knownDmIds.add(doc.id);
                            if (tU === myU && fU !== myU && !m.deleted) {
                                let txt = m.text || '';
                                let preview = txt.startsWith('🎵VOICE|') ? '🎤 Sent a Voice Note'
                                            : (txt.startsWith('🔥VIEWONCE|') ? '🔥 Sent a 1-Time Secret' : (txt || '📷 Sent a photo'));
                                showLiveNotificationBanner('💬', `New Message from ${m.fromName || '@' + m.fromUser}`, preview, () => {
                                    if (window.NexusDM) NexusDM.openDirectChat(m.fromUser, m.fromName || m.fromUser, '');
                                });
                            }
                        }

                        if (fU === myU || tU === myU) {
                            let partnerU = fU === myU ? tU : fU;
                            if (partnerU && !dmSummaryMap[partnerU]) {
                                dmSummaryMap[partnerU] = {
                                    lastText: m.deleted ? '🚫 Message deleted' : (m.text || '📷 Media'),
                                    lastTime: m.createdAt || 0,
                                    unreadCount: 0
                                };
                            }
                            if (tU === myU && !m.seen && !m.deleted && partnerU) {
                                dmSummaryMap[partnerU].unreadCount++;
                                totalUnreadDms++;
                            }
                        }
                    });
                    initialDmLoaded = true;
                    renderFourGlowingCards();
                }, () => {});
        }

        // Watcher 2: Cloud Notifications (Follows, Likes, Comments, Calls)
        if (!notifUnsub) {
            notifUnsub = Nexus.db.collection("nexus_notifications")
                .limit(45)
                .onSnapshot(snap => {
                    snap.forEach(doc => {
                        let d = doc.data();
                        if (!d) return;
                        if (!initialNotifLoaded) {
                            knownNotifIds.add(doc.id);
                        } else if (!knownNotifIds.has(doc.id)) {
                            knownNotifIds.add(doc.id);
                            if (String(d.toUser || '').toLowerCase().trim() === myU && String(d.fromUser || '').toLowerCase().trim() !== myU) {
                                showLiveNotificationBanner(
                                    d.type === 'call' ? '📹' : '🔔',
                                    `@${d.fromUser || 'member'}`,
                                    d.text || 'interacted with you',
                                    () => { if (Nexus.openNotifications) Nexus.openNotifications(); }
                                );
                            }
                        }
                    });
                    initialNotifLoaded = true;
                }, () => {});
        }

        // Watcher 3: Incoming 1:1 & Group Video Calls
        if (!callUnsub) {
            callUnsub = Nexus.db.collection("nexus_group_video_rooms").onSnapshot(snap => {
                let inc = null;
                snap.forEach(doc => {
                    let d = doc.data();
                    if (!d || !d.active || (Date.now() - (d.updatedAt || 0) > 55000)) return;
                    if (activeCallRoom === doc.id) return;
                    if (String(d.targetUser || '').toLowerCase().trim() === myU && String(d.hostUser || '').toLowerCase().trim() !== myU) {
                        inc = Object.assign({ id: doc.id }, d);
                    }
                });
                let callBar = document.getElementById('nx-inc-call-banner');
                if (!callBar) {
                    callBar = document.createElement('div');
                    callBar.id = 'nx-inc-call-banner';
                    callBar.style.cssText = "position:fixed; top:12px; left:50%; transform:translateX(-50%); width:94%; max-width:415px; background:linear-gradient(135deg,#0f172a,#064e3b); border:2px solid #10b981; border-radius:20px; padding:13px 15px; z-index:100450; display:none; align-items:center; justify-content:space-between; gap:10px; box-shadow:0 20px 50px rgba(0,0,0,0.95);";
                    document.body.appendChild(callBar);
                }
                if (inc) {
                    callBar.style.display = 'flex';
                    callBar.innerHTML = `
                        <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
                            <div style="width:42px; height:42px; border-radius:50%; background:#10b981; color:#020617; display:flex; align-items:center; justify-content:center; font-size:20px;">📹</div>
                            <div style="min-width:0; flex:1;">
                                <div style="font-size:13.5px; font-weight:900; color:#fff;">Incoming Video Call</div>
                                <div style="font-size:11.5px; color:#6ee7b7;">@${inc.hostUser} is calling you live!</div>
                            </div>
                        </div>
                        <div style="display:flex; gap:6px;">
                            <button type="button" onclick="NexusWatchParty.joinVideoCall('${inc.id}', '${(inc.title || 'Video Call').replace(/'/g, "\\'")}', false)" style="background:#10b981; color:#020617; border:none; padding:8px 13px; border-radius:10px; font-weight:900; font-size:12px; cursor:pointer;">✅ Join</button>
                            <button type="button" onclick="NexusWatchParty.endVideoMeeting('${inc.id}')" style="background:#ef4444; color:white; border:none; padding:8px 11px; border-radius:10px; font-weight:900; font-size:12px; cursor:pointer;">📴</button>
                        </div>
                    `;
                    clearInterval(ringInterval);
                    playBeepChime();
                    ringInterval = setInterval(playBeepChime, 2200);
                } else {
                    callBar.style.display = 'none';
                    clearInterval(ringInterval);
                }
            }, () => {});
        }
    }

    // =========================================================================
    // 4. ➕ MESSAGE REACTION '+' BUTTON (40+ EMOJIS) & WORKING POST REACTIONS
    // =========================================================================
    function getHiddenSet() {
        let me = Nexus.getCurrentUser();
        let u = me && me.username ? me.username.toLowerCase().trim() : 'guest';
        try { return new Set(JSON.parse(localStorage.getItem('nexus_dm_hidden_for_me_v1_' + encodeURIComponent(u)) || '[]')); } catch (e) { return new Set(); }
    }

    function installMessageMenuWithPlusEmoji() {
        if (!window.NexusDM) return;
        let hidden = getHiddenSet();
        document.querySelectorAll('#nx-dm-msgs-box .nx-dm-bubble-anim').forEach(row => {
            let id = row.getAttribute('data-message-id') || '';
            if (id && hidden.has(id) && !row.getAttribute('data-hid')) {
                row.setAttribute('data-hid', '1');
                row.innerHTML = `<div class="nx-dm-local-deleted">🧹 You deleted this message for yourself</div>`;
            } else if ((row.innerText || '').includes('This message was deleted by') && !row.classList.contains('nx-deleted-row-clean')) {
                let raw = (row.innerText || '').trim();
                row.classList.add('nx-deleted-row-clean');
                row.innerHTML = `<div class="nx-single-deleted-pill">🚫 ${raw.replace(/^🚫\s*/, '')}</div>`;
            }
        });

        NexusDM.openMsgActionMenu = function(msgId) {
            if (!msgId) return;
            let modal = document.getElementById('nx-msg-action-modal');
            if (!modal) return;
            const row = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            let isMine = row ? (row.style.alignItems === 'flex-end') : true;
            let safeId = String(msgId).replace(/'/g, "\\'");
            const mainEmojis = ['❤️', '😂', '🔥', '👍', '🙏', '💯'];
            const extraEmojis = ['🥰','😎','🤩','😭','😡','🤔','🎉','⚡','👑','🙌','💔','🤣','🥺','🤗','🧠','🚀','🎯','🏆','❤️‍🔥','👏','🫡','🤝','✨','💐'];

            modal.innerHTML = `
                <div class="nx-msg-action-sheet">
                    <div class="nx-emoji-bar" style="display:flex; align-items:center; justify-content:space-between; gap:4px;">
                        ${mainEmojis.map(em => `<button type="button" class="nx-emoji-btn" onclick="NexusCore.execDmReaction('${safeId}', '${em}')">${em}</button>`).join('')}
                        <button type="button" class="nx-emoji-btn" style="border:1.5px dashed #10b981; color:#10b981; font-size:16px; font-weight:900;" onclick="const g=document.getElementById('nx-extra-emoji-drawer'); if(g) g.style.display=g.style.display==='none'?'grid':'none';">➕</button>
                    </div>
                    <div id="nx-extra-emoji-drawer" style="display:none; grid-template-columns:repeat(6, 1fr); gap:6px; padding:10px; background:#090d16; border:1px solid #334155; border-radius:14px; margin-bottom:10px; max-height:150px; overflow-y:auto;">
                        ${extraEmojis.map(em => `<button type="button" style="background:#161f33; border:none; border-radius:8px; padding:6px; font-size:20px; cursor:pointer;" onclick="NexusCore.execDmReaction('${safeId}', '${em}')">${em}</button>`).join('')}
                    </div>
                    <button type="button" class="nx-menu-opt-btn" onclick="NexusCore.execDmReply('${safeId}')"><span>↩️</span> <span>Reply to Message</span></button>
                    <button type="button" class="nx-menu-opt-btn" onclick="NexusCore.execDmCopy('${safeId}')"><span>📋</span> <span>Copy Message Text</span></button>
                    <button type="button" class="nx-menu-opt-btn" style="color:#cbd5e1;" onclick="NexusCore.execDmDeleteForMe('${safeId}')"><span>🧹</span> <span>Delete for Me</span></button>
                    ${isMine ? `<button type="button" class="nx-menu-opt-btn" style="color:#f87171;" onclick="NexusCore.execDmDeleteForEveryone('${safeId}')"><span>🗑️</span> <span>Delete for Everyone</span></button>` : ''}
                    <button type="button" class="nx-menu-opt-btn" style="justify-content:center; background:transparent; border:none; color:#8696a0;" onclick="document.getElementById('nx-msg-action-modal').style.display='none'">Cancel</button>
                </div>
            `;
            modal.style.display = 'flex';
        };

        // Ensure Group Chat message menu also gets the ➕ Emoji Picker button!
        const grpModal = document.getElementById('nx-global-modal');
        if (grpModal && grpModal.style.display === 'flex' && grpModal.innerHTML.includes('reactGroupMsg') && !grpModal.querySelector('#nx-grp-plus-emoji-btn')) {
            const bar = grpModal.querySelector('.nx-emoji-bar');
            let m = grpModal.innerHTML.match(/reactGroupMsg\('([^']+)'/);
            if (bar && m && m[1]) {
                let gMsgId = m[1];
                const plusBtn = document.createElement('button');
                plusBtn.id = 'nx-grp-plus-emoji-btn';
                plusBtn.type = 'button';
                plusBtn.className = 'nx-emoji-btn';
                plusBtn.style.cssText = 'border:1.5px dashed #10b981; color:#10b981; font-size:16px; font-weight:900;';
                plusBtn.innerText = '➕';
                plusBtn.onclick = () => {
                    let customEm = prompt('Pick or type any Emoji to react:', '🔥');
                    if (customEm && window.NexusSuperChat) NexusSuperChat.reactGroupMsg(gMsgId, customEm.trim());
                };
                bar.appendChild(plusBtn);
            }
        }
    }

    // Ensure Home Feed Post Like / Reaction works 100% instantaneously
    function fixHomePostReactions() {
        if (!window.Nexus || Nexus.__nxPostLikePatchedV18) return;
        Nexus.__nxPostLikePatchedV18 = true;
        const origLike = Nexus.toggleLike ? Nexus.toggleLike.bind(Nexus) : null;
        Nexus.toggleLike = async function(postId) {
            let me = Nexus.getCurrentUser();
            if (!me) { Nexus.switchTab('tab-profile'); return; }
            let p = (Nexus.posts || []).find(x => x && x.id === postId);
            if (p) {
                p.likedBy = Array.isArray(p.likedBy) ? p.likedBy : [];
                let idx = p.likedBy.indexOf(me.username);
                if (idx === -1) {
                    p.likedBy.push(me.username);
                    Nexus.toast("❤️ Liked Post!");
                    if (Nexus.pushRealNotification && p.username) {
                        Nexus.pushRealNotification(p.username, 'like', `❤️ liked your post!`);
                    }
                } else {
                    p.likedBy.splice(idx, 1);
                }
                if (Nexus.notifyAll) Nexus.notifyAll();
                if (Nexus.db) {
                    Nexus.db.collection("nexus_real_posts").doc(postId).set({ likedBy: p.likedBy, likes: p.likedBy.length }, { merge: true }).catch(() => {});
                }
                return;
            }
            if (origLike) return origLike(postId);
        };
    }

    // =========================================================================
    // 5. ▶️🎵 INSTANT YOUTUBE WATCH-PARTY & FULL 4-5 MIN MP3 SONG ENGINE
    // Fixes the bug where clicking Play didn't open the player on screen!
    // =========================================================================
    function fetchFast(url, ms) {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), ms || 6000);
        return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t));
    }

    function getChatCtx(isDmExplicit) {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let myU = me && me.username ? me.username.toLowerCase().trim() : 'guest';
        const dmRoot = document.getElementById('nx-dm-dedicated-root');
        const isDm = isDmExplicit === true || (dmRoot && dmRoot.style.display !== 'none');
        if (isDm) {
            let pName = document.getElementById('nx-dm-partner-name')?.innerText || '';
            let uObj = (Nexus.users || []).find(u => u && ((u.name && u.name.toLowerCase() === pName.trim().toLowerCase()) || (u.username && u.username.toLowerCase() === pName.trim().toLowerCase())));
            let pU = uObj ? uObj.username.toLowerCase().trim() : (pName.toLowerCase().replace(/[^a-z0-9_]/g, '') || myU);
            return { isDm: true, roomId: 'dm_' + [myU, pU].sort().join('__'), title: `Video Call • ${pName || '@' + pU}`, targetUser: pU };
        }
        let rTitle = document.getElementById('nx-room-title')?.innerText || 'Study Room';
        return { isDm: false, roomId: 'grp_' + rTitle.toLowerCase().replace(/[^a-z0-9]/g, '_'), title: `${rTitle} • Group Video`, targetUser: '' };
    }

    async function searchSongsAndVideosParallel(rawQ, mode) {
        let q = (rawQ || 'Hindi Hit Songs').trim();
        let cleanQ = q.replace(/\b(song|songs|mp3|full|audio|video)\b/gi, '').replace(/\s+/g, ' ').trim() || q;
        let mp3List = [], ytList = [], seen = new Set();

        const addMp3 = (it) => { if (it && it.url && !seen.has(it.url)) { seen.add(it.url); mp3List.push(it); } };
        const addYt = (it) => { if (it && it.videoId && !seen.has(it.videoId)) { seen.add(it.videoId); ytList.push(it); } };

        let directId = (q.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/) || [])[1];
        if (directId) {
            addYt({ id: 'yt_' + directId, videoId: directId, title: "YouTube Direct Video", channel: "▶️ YouTube Live Sync", thumb: `https://i.ytimg.com/vi/${directId}/mqdefault.jpg`, url: `https://www.youtube.com/embed/${directId}?autoplay=1&playsinline=1&rel=0`, type: 'yt' });
            return ytList;
        }

        const parseSaavn = (d) => {
            let arr = (d && d.data && Array.isArray(d.data.results)) ? d.data.results : (d && Array.isArray(d.results) ? d.results : []);
            arr.forEach(s => {
                let dl = s.downloadUrl || [];
                let best = dl.length ? (dl[dl.length - 1].url || dl[dl.length - 1].link) : '';
                if (!best && s.more_info && s.more_info.media_preview_url) {
                    best = s.more_info.media_preview_url.replace('preview.saavncdn.com', 'aac.saavncdn.com').replace('_96_p.mp4', '_160.mp4');
                }
                let im = s.image || [];
                let th = Array.isArray(im) && im.length ? (im[im.length - 1].url || im[im.length - 1].link) : (typeof im === 'string' ? im : '');
                let dur = Number(s.duration || (s.more_info && s.more_info.duration) || 240);
                if (best && dur >= 50) {
                    let m = Math.floor(dur / 60), sec = dur % 60;
                    addMp3({
                        id: 'mp3_' + (s.id || Math.random()),
                        title: (s.name || s.title || 'Song').replace(/&quot;/g, '"'),
                        channel: `${s.primaryArtists || 'Bollywood'} • 🎵 Full MP3 (${m}:${sec < 10 ? '0' + sec : sec})`,
                        thumb: th || 'https://placehold.co/100x100/10b981/020617?text=MP3',
                        url: best,
                        type: 'mp3'
                    });
                }
            });
        };

        const parseYtHtml = (html) => {
            if (!html || typeof html !== 'string') return;
            let parts = html.split('"videoRenderer":{"videoId":"');
            for (let i = 1; i < parts.length && ytList.length < 12; i++) {
                let chunk = parts[i].substring(0, 1200);
                let vid = chunk.substring(0, 11);
                if (/^[a-zA-Z0-9_-]{11}$/.test(vid)) {
                    let tm = chunk.match(/"title":\{"runs":\[\{"text":"([^"]+)"/) || chunk.match(/"title":\{"simpleText":"([^"]+)"/);
                    let title = tm ? tm[1].replace(/\\u0026/g, '&').replace(/\\"/g, '"') : 'YouTube Video';
                    addYt({ id: 'yt_' + vid, videoId: vid, title: title, channel: '▶️ YouTube Video', thumb: `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`, url: `https://www.youtube.com/embed/${vid}?autoplay=1&playsinline=1&rel=0`, type: 'yt' });
                }
            }
        };

        const saavnOfficial = `${PROTO}www.jiosaavn.com/api.php?p=1&q=${encodeURIComponent(cleanQ)}&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=12&__call=search.getResults`;
        const ytPage = `${PROTO}www.youtube.com/results?search_query=${encodeURIComponent(q)}&hl=en`;

        await Promise.allSettled([
            fetchFast(`${PROTO}api.allorigins.win/get?url=${encodeURIComponent(saavnOfficial)}`, 6000).then(r => r.json()).then(d => parseSaavn(JSON.parse(d.contents))),
            fetchFast(`${PROTO}saavn.dev/api/search/songs?query=${encodeURIComponent(cleanQ)}&limit=10`, 5500).then(r => r.json()).then(parseSaavn),
            fetchFast(`${PROTO}jiosaavn-api-privatecvc2.vercel.app/search/songs?query=${encodeURIComponent(cleanQ)}&limit=10`, 5500).then(r => r.json()).then(parseSaavn),
            fetchFast(`${PROTO}api.allorigins.win/get?url=${encodeURIComponent(ytPage)}`, 6500).then(r => r.json()).then(d => parseYtHtml(d.contents)),
            fetchFast(`${PROTO}api.codetabs.com/v1/proxy?quest=${encodeURIComponent(ytPage)}`, 6500).then(r => r.text()).then(parseYtHtml),
            fetchFast(`${PROTO}inv.nadeko.net/api/v1/search?q=${encodeURIComponent(q)}&type=video`, 5500).then(r => r.json()).then(arr => {
                (Array.isArray(arr) ? arr : []).slice(0, 10).forEach(v => {
                    if (v && v.videoId) addYt({ id: 'yt_' + v.videoId, videoId: v.videoId, title: v.title || 'Video', channel: `▶️ ${v.author || 'YouTube'}`, thumb: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`, url: `https://www.youtube.com/embed/${v.videoId}?autoplay=1&playsinline=1&rel=0`, type: 'yt' });
                });
            })
        ]);

        return mode === 'mp3' ? [...mp3List, ...ytList] : [...ytList, ...mp3List];
    }

    function renderPlayerDockNow(docData, isDm) {
        let dock = document.getElementById('nx-wp-dock');
        if (!dock) { dock = document.createElement('div'); dock.id = 'nx-wp-dock'; }
        const target = isDm ? document.getElementById('nx-dm-msgs-box') : document.getElementById('nx-room-messages');
        if (target && target.parentNode && dock.nextSibling !== target) {
            target.parentNode.insertBefore(dock, target);
        }

        if (!docData || !docData.active || !docData.url) {
            dock.style.display = 'none'; dock.innerHTML = ''; currentMediaKey = ''; return;
        }

        dock.style.display = 'flex';
        let mKey = (docData.url || '') + '_' + (docData.startOffset || 0);
        let relList = Array.isArray(docData.related) && docData.related.length ? docData.related : relatedCache;
        let isMp3 = docData.mediaType === 'mp3';

        if (mKey !== currentMediaKey) {
            currentMediaKey = mKey;
            let startSec = Math.max(0, Math.round(docData.currentTime || 0));

            let stageHTML = isMp3 ? `
                <div style="display:flex; align-items:center; gap:12px; padding:10px 14px; background:#090d16;">
                    <img src="${docData.thumb || 'https://placehold.co/100x100/10b981/020617?text=MP3'}" class="nx-vinyl-spin">
                    <div style="flex:1; min-width:0;">
                        <div style="font-size:12.5px; font-weight:900; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">🎵 ${(docData.title || 'Full MP3 Song').replace(/</g, '&lt;')}</div>
                        <div id="nx-wp-live-status" style="font-size:10.5px; color:#10b981; font-weight:800; margin-bottom:4px;">🟢 Synced Full MP3 • @${docData.startedBy || 'member'}</div>
                        <audio id="nx-wp-audio-el" src="${docData.url}" controls autoplay style="width:100%; height:34px;"></audio>
                    </div>
                </div>
            ` : `
                <div style="position:relative; width:100%; height:195px; background:#000;">
                    <iframe src="${docData.videoId ? `https://www.youtube.com/embed/${docData.videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1&start=${startSec}` : docData.url}" sandbox="allow-scripts allow-same-origin allow-presentation" style="width:100%; height:195px; border:none; background:#000;" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
                </div>
                <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 10px; background:#0f172a; border-top:1px solid #1e293b; gap:6px;">
                    <span id="nx-wp-live-status" style="font-size:10.5px; color:#10b981; font-weight:800; flex:1;">🟢 Playing in Sync • @${docData.startedBy || 'member'}</span>
                    <button type="button" class="nx-tw-pill" onclick="NexusWatchParty.seekYtVideo(-15)">⏪ -15s</button>
                    <button type="button" class="nx-tw-pill" onclick="NexusWatchParty.seekYtVideo(15)">⏩ +15s</button>
                    <button type="button" class="nx-tw-pill" style="background:#10b981; color:#020617; border:none;" onclick="NexusWatchParty.restartYtTogether()">🔄 Sync Both</button>
                </div>
            `;

            dock.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 10px; background:#182229; border-bottom:1px solid #2a3942; gap:5px;">
                    <span style="font-size:11.5px; font-weight:900; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;">${isMp3 ? '🎵' : '▶️'} ${(docData.title || 'Live Media').replace(/</g, '&lt;')}</span>
                    <button type="button" class="nx-tw-pill" style="border-color:#38bdf8; color:#38bdf8;" onclick="NexusWatchParty.openModal(${isDm}, '${isMp3 ? 'mp3' : 'yt'}')">🔍 Search</button>
                    <button type="button" id="nx-btn-toggle-main" class="nx-tw-pill" onclick="NexusWatchParty.toggleMainPlayer()">${isMainHidden ? '🔼 Show Song' : '🔽 Hide Song'}</button>
                    <button type="button" id="nx-btn-toggle-rel" class="nx-tw-pill" style="border-color:#a78bfa; color:#d8b4fe;" onclick="NexusWatchParty.toggleRelatedStrip()">${isRelHidden ? '🔥 Show Related' : '🔥 Hide Related'}</button>
                    <button type="button" class="nx-tw-pill" style="background:#ef4444; border:none; color:white;" onclick="NexusWatchParty.stop()">✕</button>
                </div>
                <div id="nx-wp-main-stage" style="display:${isMainHidden ? 'none' : 'flex'}; flex-direction:column;">${stageHTML}</div>
                <div id="nx-wp-related-stage" style="display:${isRelHidden ? 'none' : 'flex'}; flex-direction:column;">
                    <div style="padding:4px 10px 2px; background:#050811; font-size:10px; font-weight:900; color:#93c5fd;">🔥 RELATED SONGS &amp; VIDEOS (SWIPE 👉):</div>
                    <div class="nx-horiz-scroll" style="background:#050811; padding:6px 10px;">
                        ${relList.map((r, i) => `
                            <div onclick="NexusWatchParty.playByIndex(${i}, ${isDm})" style="min-width:165px; max-width:165px; background:#111827; border:1px solid #26334d; border-radius:12px; padding:6px; display:flex; align-items:center; gap:8px; cursor:pointer; flex-shrink:0;">
                                <img src="${r.thumb}" style="width:40px; height:40px; border-radius:8px; object-fit:cover; flex-shrink:0;">
                                <div style="min-width:0; flex:1;">
                                    <div style="font-size:11px; font-weight:800; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${(r.title || '').replace(/</g, '&lt;')}</div>
                                    <div style="font-size:9.5px; color:#10b981; font-weight:800;">Play Here ▶</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    function ensureWatchPartySubscription() {
        if (!window.Nexus || !Nexus.db) return;
        const dmRoot = document.getElementById('nx-dm-dedicated-root');
        const grpRoom = document.getElementById('nx-chat-room');
        let isDm = dmRoot && dmRoot.style.display !== 'none';
        let isGrp = grpRoom && grpRoom.style.display !== 'none';
        if (!isDm && !isGrp) return;

        let ctx = getChatCtx(isDm);
        if (ctx.roomId === activeWpRoom && wpUnsub) return;
        activeWpRoom = ctx.roomId;

        if (wpUnsub) wpUnsub();
        wpUnsub = Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).onSnapshot(doc => {
            renderPlayerDockNow(doc.exists ? doc.data() : null, isDm);
        }, () => {});
    }

    // =========================================================================
    // 6. GLOBAL APIS: NEXUSWATCHPARTY, NEXUSDMINBOX & NEXUSCORE
    // =========================================================================
    window.NexusWatchParty = {
        openModal: function(isDm, modeTab) {
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;
            currentMode = modeTab || 'yt';

            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid ${currentMode === 'mp3' ? '#10b981' : '#ef4444'}; background:#090d16; padding:15px; max-width:400px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <strong style="color:#fff; font-size:15px;">${currentMode === 'mp3' ? '🎵 Full MP3 Song DJ (4-5+ Min)' : '▶️ YouTube Watch-Party TV'}</strong>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:19px; cursor:pointer;">✕</button>
                    </div>
                    <div style="display:flex; gap:6px; margin-bottom:10px;">
                        <button type="button" onclick="NexusWatchParty.openModal(${Boolean(isDm)}, 'yt')" style="flex:1; padding:8px; border-radius:10px; border:none; background:${currentMode === 'yt' ? '#ef4444' : '#1e293b'}; color:white; font-weight:900; font-size:12px; cursor:pointer;">▶️ YouTube TV</button>
                        <button type="button" onclick="NexusWatchParty.openModal(${Boolean(isDm)}, 'mp3')" style="flex:1; padding:8px; border-radius:10px; border:none; background:${currentMode === 'mp3' ? '#10b981' : '#1e293b'}; color:${currentMode === 'mp3' ? '#020617' : 'white'}; font-weight:900; font-size:12px; cursor:pointer;">🎵 Full MP3 Songs</button>
                    </div>
                    <div style="display:flex; gap:6px; margin-bottom:10px;">
                        <input type="text" id="nx-wp-in" placeholder="Search any Song, Movie, Motu Patlu or paste link..." onkeydown="if(event.key==='Enter') NexusWatchParty.search(${Boolean(isDm)})" style="flex:1; padding:9px 12px; border-radius:10px; border:1px solid #334155; background:#111827; color:white; font-size:12.5px; outline:none;">
                        <button type="button" onclick="NexusWatchParty.search(${Boolean(isDm)})" style="background:${currentMode === 'mp3' ? '#10b981' : '#ef4444'}; color:${currentMode === 'mp3' ? '#020617' : 'white'}; border:none; padding:0 14px; border-radius:10px; font-weight:900; font-size:12px; cursor:pointer;">Search</button>
                    </div>
                    <div id="nx-wp-results" style="display:flex; flex-direction:column; gap:7px; max-height:52vh; overflow-y:auto;"></div>
                </div>
            `;
            modal.style.display = 'flex';
            const inp = document.getElementById('nx-wp-in');
            if (inp) inp.focus();
            this.search(Boolean(isDm), currentMode === 'mp3' ? 'Arijit Singh' : 'Hindi Hit Songs');
        },

        search: async function(isDm, fallbackQ) {
            const inp = document.getElementById('nx-wp-in');
            const box = document.getElementById('nx-wp-results');
            if (!box) return;
            let q = (inp && inp.value.trim()) ? inp.value.trim() : (fallbackQ || 'Hindi Hit Songs');
            box.innerHTML = `<div style="text-align:center; padding:16px; color:#38bdf8; font-size:12.5px; font-weight:800;">⚡ Searching "${q}"...</div>`;

            let list = await searchSongsAndVideosParallel(q, currentMode);
            relatedCache = list.slice(0, 10);

            if (!list.length) {
                box.innerHTML = `<div style="text-align:center; padding:14px; color:#94a3b8; font-size:12px;">Tap Search once more to load "${q}"!</div>`;
                return;
            }

            box.innerHTML = list.map((v, idx) => `
                <div onclick="NexusWatchParty.playByIndex(${idx}, ${Boolean(isDm)})" style="display:flex; align-items:center; gap:10px; padding:8px; background:#161f33; border:1px solid #26334d; border-radius:12px; cursor:pointer;">
                    <img src="${v.thumb}" style="width:58px; height:44px; border-radius:8px; object-fit:cover; flex-shrink:0; background:#000;">
                    <div style="min-width:0; flex:1;">
                        <div style="font-weight:800; font-size:12px; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${(v.title || '').replace(/</g, '&lt;')}</div>
                        <div style="font-size:10.5px; color:#10b981; font-weight:700;">${(v.channel || '').replace(/</g, '&lt;')}</div>
                    </div>
                    <span style="background:${v.type === 'mp3' ? '#10b981' : '#ef4444'}; color:${v.type === 'mp3' ? '#020617' : 'white'}; padding:5px 10px; border-radius:8px; font-size:10.5px; font-weight:900; flex-shrink:0;">Play ▶</span>
                </div>
            `).join('');
        },

        playByIndex: async function(idx, isDm) {
            const modal = document.getElementById('nx-global-modal');
            if (modal) modal.style.display = 'none';
            let item = relatedCache[idx];
            if (!item) return;

            let me = Nexus.getCurrentUser();
            let ctx = getChatCtx(isDm);
            isMainHidden = false;
            isRelHidden = false;
            currentMediaKey = '';

            let payload = {
                active: true,
                title: item.title || 'Live Media',
                url: item.url,
                videoId: item.videoId || '',
                thumb: item.thumb || '',
                mediaType: item.type || 'yt',
                playState: 'PLAYING',
                currentTime: 0,
                startOffset: Date.now() % 1000,
                related: relatedCache.filter((_, i) => i !== idx).slice(0, 8),
                startedBy: me ? me.username : 'member',
                updatedAt: Date.now()
            };

            // 1. Mount and open the player dock IMMEDIATELY on screen in 0.01s!
            renderPlayerDockNow(payload, ctx.isDm);
            ensureWatchPartySubscription();

            // 2. Sync to Firestore for partner
            if (Nexus.db) {
                await Nexus.db.collection("nexus_watch_party").doc(ctx.roomId).set(payload).catch(() => {});
            }
            Nexus.toast(`🎵 Playing "${item.title}"!`);
        },

        toggleMainPlayer: function() {
            isMainHidden = !isMainHidden;
            const el = document.getElementById('nx-wp-main-stage');
            const btn = document.getElementById('nx-btn-toggle-main');
            if (el) el.style.display = isMainHidden ? 'none' : 'flex';
            if (btn) btn.innerText = isMainHidden ? '🔼 Show Song' : '🔽 Hide Song';
        },

        toggleRelatedStrip: function() {
            isRelHidden = !isRelHidden;
            const el = document.getElementById('nx-wp-related-stage');
            const btn = document.getElementById('nx-btn-toggle-rel');
            if (el) el.style.display = isRelHidden ? 'none' : 'flex';
            if (btn) btn.innerText = isRelHidden ? '🔥 Show Related' : '🔥 Hide Related';
        },

        seekYtVideo: async function(deltaSec) {
            if (!activeWpRoom || !Nexus.db) return;
            const doc = await Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).get();
            if (!doc.exists) return;
            let d = doc.data();
            let nextSec = Math.max(0, Math.round((d.currentTime || 0) + deltaSec));
            await Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).set({
                currentTime: nextSec, startOffset: nextSec, updatedAt: Date.now()
            }, { merge: true });
        },

        restartYtTogether: async function() {
            if (!activeWpRoom || !Nexus.db) return;
            await Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).set({
                currentTime: 0, startOffset: Date.now() % 1000, updatedAt: Date.now()
            }, { merge: true });
        },

        stop: function() {
            if (Nexus.db && activeWpRoom) {
                Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).set({ active: false }, { merge: true }).catch(() => {});
            }
            const dock = document.getElementById('nx-wp-dock');
            if (dock) { dock.style.display = 'none'; dock.innerHTML = ''; }
            currentMediaKey = '';
        },

        // 📹 2-WAY WEBRTC 1:1 & GROUP VIDEO CALL (With Instant Partner Ring & Camera Auto-Off)
        startVideoMeeting: async function(isDm) {
            let me = Nexus.getCurrentUser();
            if (!me) { Nexus.switchTab('tab-profile'); return; }
            let ctx = getChatCtx(isDm);
            if (Nexus.db) {
                await Nexus.db.collection("nexus_group_video_rooms").doc(ctx.roomId).set({
                    active: true, title: ctx.title, hostUser: me.username,
                    targetUser: ctx.targetUser || '', updatedAt: Date.now()
                }, { merge: true });
            }
            await this.joinVideoCall(ctx.roomId, ctx.title, true);
        },

        joinVideoCall: async function(roomId, title, isCaller) {
            clearInterval(ringInterval);
            const b = document.getElementById('nx-inc-call-banner');
            if (b) b.style.display = 'none';
            this.stopCameraTracksOnly();

            let stream = null;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
                activeStreams.push(stream);
            } catch (e) {
                Nexus.toast("⚠️ Please allow Camera & Microphone permission!");
                return;
            }

            activeCallRoom = roomId;
            let mod = document.getElementById('nx-vcall-overlay');
            if (!mod) { mod = document.createElement('div'); mod.id = 'nx-vcall-overlay'; mod.className = 'nx-fullscreen-overlay'; document.body.appendChild(mod); }

            mod.innerHTML = `
                <div style="height:54px; background:#0f172a; border-bottom:1.5px solid #10b981; display:flex; align-items:center; justify-content:space-between; padding:0 14px;">
                    <div>
                        <strong style="color:#fff; font-size:14px;">📹 ${title || 'Live Video Call'}</strong>
                        <div id="nx-vcall-status" style="font-size:10.5px; color:#10b981; font-weight:800;">🟢 Ringing partner...</div>
                    </div>
                    <button type="button" onclick="NexusWatchParty.endVideoMeeting('${roomId}')" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:10px; font-weight:900; font-size:11.5px; cursor:pointer;">End Call ✕</button>
                </div>
                <div style="flex:1; display:grid; grid-template-rows:1fr 1fr; gap:8px; padding:10px; background:#050811;">
                    <div style="position:relative; background:#0f172a; border:1.5px solid #38bdf8; border-radius:16px; overflow:hidden; display:flex; align-items:center; justify-content:center;">
                        <video id="nx-vcall-remote" autoplay playsinline style="width:100%; height:100%; object-fit:cover;"></video>
                        <div style="position:absolute; bottom:8px; left:8px; background:rgba(9,13,22,0.85); color:#38bdf8; padding:3px 9px; border-radius:99px; font-size:11px; font-weight:800;">👤 Partner Video</div>
                    </div>
                    <div style="position:relative; background:#0f172a; border:1.5px solid #10b981; border-radius:16px; overflow:hidden; display:flex; align-items:center; justify-content:center;">
                        <video id="nx-vcall-local" autoplay playsinline muted style="width:100%; height:100%; object-fit:cover; transform:scaleX(-1);"></video>
                        <div style="position:absolute; bottom:8px; left:8px; background:rgba(9,13,22,0.85); color:#10b981; padding:3px 9px; border-radius:99px; font-size:11px; font-weight:800;">🟢 You</div>
                    </div>
                </div>
                <div style="padding:12px; background:#0f172a; display:grid; grid-template-columns:repeat(3, 1fr); gap:10px;">
                    <button type="button" class="nx-tw-pill" style="justify-content:center; padding:10px;" onclick="NexusWatchParty.toggleCallMic(this)">🎤 Mute/Unmute</button>
                    <button type="button" class="nx-tw-pill" style="justify-content:center; padding:10px;" onclick="NexusWatchParty.toggleCallCam(this)">📹 Cam On/Off</button>
                    <button type="button" class="nx-tw-pill" style="justify-content:center; padding:10px; background:#ef4444; border:none; color:white;" onclick="NexusWatchParty.endVideoMeeting('${roomId}')">📴 End Call</button>
                </div>
            `;
            mod.style.display = 'flex';
            document.getElementById('nx-vcall-local').srcObject = stream;

            // Connect 2-Way WebRTC Video
            if (Nexus.db) {
                callPc = new RTCPeerConnection(RTC_ICE);
                stream.getTracks().forEach(t => callPc.addTrack(t, stream));
                callPc.ontrack = ev => {
                    const remVid = document.getElementById('nx-vcall-remote');
                    if (remVid && ev.streams && ev.streams[0]) {
                        remVid.srcObject = ev.streams[0];
                        const stEl = document.getElementById('nx-vcall-status');
                        if (stEl) stEl.innerText = '🟢 Connected Face-to-Face!';
                    }
                };
                const sigRef = Nexus.db.collection("nexus_video_calls").doc('vc_' + roomId);
                let myField = isCaller ? 'callerCands' : 'calleeCands';
                let remField = isCaller ? 'calleeCands' : 'callerCands';
                let myCands = [], seenCands = new Set();

                callPc.onicecandidate = ev => {
                    if (ev.candidate) {
                        myCands.push(ev.candidate.toJSON());
                        sigRef.set({ [myField]: myCands }, { merge: true }).catch(() => {});
                    }
                };

                if (isCaller) {
                    await sigRef.set({ offer: null, answer: null, callerCands: [], calleeCands: [] });
                    let off = await callPc.createOffer();
                    await callPc.setLocalDescription(off);
                    await sigRef.set({ offer: { type: off.type, sdp: off.sdp } }, { merge: true });
                }

                if (callSigUnsub) callSigUnsub();
                callSigUnsub = sigRef.onSnapshot(async s => {
                    if (!s.exists || !callPc) return;
                    let d = s.data();
                    if (!isCaller && d.offer && !callPc.currentRemoteDescription) {
                        await callPc.setRemoteDescription(new RTCSessionDescription(d.offer)).catch(() => {});
                        let ans = await callPc.createAnswer().catch(() => null);
                        if (ans) {
                            await callPc.setLocalDescription(ans);
                            await sigRef.set({ answer: { type: ans.type, sdp: ans.sdp } }, { merge: true });
                        }
                    } else if (isCaller && d.answer && !callPc.currentRemoteDescription) {
                        await callPc.setRemoteDescription(new RTCSessionDescription(d.answer)).catch(() => {});
                    }
                    if (Array.isArray(d[remField]) && callPc.currentRemoteDescription) {
                        d[remField].forEach(c => {
                            let k = JSON.stringify(c);
                            if (!seenCands.has(k)) { seenCands.add(k); callPc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {}); }
                        });
                    }
                });
            }
        },

        toggleCallMic: function(btn) {
            activeStreams.forEach(s => s.getAudioTracks().forEach(t => { t.enabled = !t.enabled; if (btn) btn.innerText = t.enabled ? '🎤 Mic ON' : '🔇 Muted'; }));
        },

        toggleCallCam: function(btn) {
            activeStreams.forEach(s => s.getVideoTracks().forEach(t => { t.enabled = !t.enabled; if (btn) btn.innerText = t.enabled ? '📹 Cam ON' : '🚫 Cam OFF'; }));
        },

        stopCameraTracksOnly: function() {
            activeStreams.forEach(s => s.getTracks().forEach(t => { try { t.stop(); } catch (e) {} }));
            activeStreams = [];
            if (callPc) { try { callPc.close(); } catch (e) {} callPc = null; }
            if (callSigUnsub) { callSigUnsub(); callSigUnsub = null; }
        },

        endVideoMeeting: function(roomId) {
            clearInterval(ringInterval);
            this.stopCameraTracksOnly();
            const mod = document.getElementById('nx-vcall-overlay');
            if (mod) { mod.style.display = 'none'; mod.innerHTML = ''; }
            const b = document.getElementById('nx-inc-call-banner');
            if (b) b.style.display = 'none';
            let rId = roomId || activeCallRoom;
            activeCallRoom = '';
            if (Nexus.db && rId) {
                Nexus.db.collection("nexus_group_video_rooms").doc(rId).set({ active: false, targetUser: '' }, { merge: true }).catch(() => {});
            }
            Nexus.toast("📴 Video Call Ended");
        }
    };

    window.NexusYTParty = window.NexusWatchParty;
    window.NexusMP3DJ = { openModal: (isDm) => window.NexusWatchParty.openModal(isDm, 'mp3') };
    window.NexusLive = {
        openMediaHubModal: (isDm, mode) => window.NexusWatchParty.openModal(isDm, mode || 'yt'),
        startOrJoinVideoRoom: (isDm) => window.NexusWatchParty.startVideoMeeting(isDm),
        leaveRoom: () => window.NexusWatchParty.endVideoMeeting()
    };

    // =========================================================================
    // PRIVATE AI STUDIO HELPERS
    // =========================================================================
    function nxEscapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[ch]);
    }

    function nxEncodeBase64(value) {
        return btoa(unescape(encodeURIComponent(String(value == null ? '' : value))));
    }

    function nxPersistAiHistory() {
        try {
            aiChatHistory = aiChatHistory.slice(-20);
            localStorage.setItem('nx_private_ai_history_v1', JSON.stringify(aiChatHistory));
        } catch (e) {
            if (window.Nexus && typeof Nexus.toast === 'function') Nexus.toast('AI history device storage is full.');
        }
    }

    function isUnsafeOrHackingQuery(q) {
        return /\b(hack|hacking|exploit|ddos|phishing|crack|bypass|sql injection|steal|keylogger|malware|virus|admin pin|password leak|dark web|illegal)\b/i.test(String(q || ''));
    }

    function formatAiStudioMessageHTML(msgObj) {
        const raw = String(msgObj && msgObj.text || '');
        if (msgObj && msgObj.role === 'user') {
            return `<div style="align-self:flex-end; max-width:88%; background:#064e3b; color:#f8fafc; padding:10px 13px; border-radius:14px 3px 14px 14px; font-size:14px; line-height:1.5; white-space:pre-wrap; overflow-wrap:anywhere;">${nxEscapeHtml(raw)}</div>`;
        }

        const fullEncoded = nxEncodeBase64(raw);
        let bodyHtml = '';
        let cursor = 0;
        const codeRe = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
        let match;
        while ((match = codeRe.exec(raw)) !== null) {
            const before = raw.slice(cursor, match.index);
            if (before) bodyHtml += `<div style="white-space:pre-wrap; overflow-wrap:anywhere;">${nxEscapeHtml(before)}</div>`;
            const lang = (match[1] || 'CODE').toUpperCase();
            const code = match[2].replace(/^\n|\n$/g, '');
            const encodedCode = nxEncodeBase64(code);
            bodyHtml += `
                <div style="margin:9px 0; overflow:hidden; border:1px solid #334155; border-left:3px solid #38bdf8; border-radius:10px; background:#050811;">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:6px 9px; background:#111827; color:#7dd3fc; font-size:11px; font-weight:800;">
                        <span>${lang}</span>
                        <button type="button" onclick="NexusCore.copyBase64Text('${encodedCode}','📋 Code copied')" style="background:#0f766e; border:0; border-radius:7px; color:#fff; padding:5px 9px; font-size:10px; font-weight:800;">Copy code</button>
                    </div>
                    <pre style="margin:0; padding:10px; color:#e2e8f0; font:12px/1.5 ui-monospace,monospace; white-space:pre-wrap; overflow-wrap:anywhere;">${nxEscapeHtml(code)}</pre>
                </div>`;
            cursor = codeRe.lastIndex;
        }
        const after = raw.slice(cursor);
        if (after) bodyHtml += `<div style="white-space:pre-wrap; overflow-wrap:anywhere;">${nxEscapeHtml(after)}</div>`;

        return `
            <div style="align-self:flex-start; width:fit-content; max-width:94%; padding:11px 12px; border-radius:3px 15px 15px 15px; background:#182229; border:1px solid #2a3942; border-left:3px solid #a78bfa; color:#f1f5f9; font-size:13.5px; line-height:1.55; overflow-wrap:anywhere;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:8px; padding-bottom:6px; border-bottom:1px solid #334155;">
                    <b style="font-size:11px; color:#c4b5fd;">🤖 NEXUS AI TUTOR</b>
                    <div style="display:flex; gap:6px; flex-shrink:0;">
                        <button type="button" onclick="NexusCore.speakSwaraVoice('${fullEncoded}', this)" style="background:#064e3b; border:1px solid #10b981; color:#a7f3d0; padding:5px 8px; border-radius:8px; font-size:10px; font-weight:800;">🔊 Listen</button>
                        <button type="button" onclick="NexusCore.copyBase64Text('${fullEncoded}','📋 Response copied')" style="background:#1e293b; border:1px solid #475569; color:#bae6fd; padding:5px 8px; border-radius:8px; font-size:10px; font-weight:800;">Copy</button>
                    </div>
                </div>
                ${bodyHtml}
            </div>`;
    }

    function renderAiStudioMessages(showThinking) {
        const box = document.getElementById('nx-ai-studio-msgs');
        if (!box) return;
        box.innerHTML = aiChatHistory.map(formatAiStudioMessageHTML).join('') + (showThinking ?
            `<div id="nx-ai-thinking-bubble" style="align-self:flex-start; background:#182229; border:1px solid #a78bfa; color:#d8b4fe; padding:9px 13px; border-radius:12px; font-size:12px;">⏳ Nexus AI is preparing your answer…</div>` : '');
        box.scrollTop = box.scrollHeight;
    }

    // =========================================================================
    // 7. 📝 IN-APP CHALLENGER TEST SERIES PORTAL & 1:1 DM HUB
    // =========================================================================
    window.NexusDmInbox = Object.assign(window.NexusDmInbox || {}, {
        // Open the existing 1:1 inbox implementation from dm.js.
        openFullScreenDmHub: function() {
            try {
                if (window.NexusDM && typeof NexusDM.openInboxModal === 'function') {
                    return NexusDM.openInboxModal();
                }
                if (window.NexusDM && typeof NexusDM.openInbox === 'function') {
                    return NexusDM.openInbox();
                }
            } catch (error) {
                console.error('Nexus DM inbox open failed:', error);
                if (window.Nexus && typeof Nexus.toast === 'function') Nexus.toast('1:1 Inbox nahi khul paaya. Dobara try karein.');
                return false;
            }
            if (window.Nexus && typeof Nexus.toast === 'function') {
                Nexus.toast('1:1 Chat module load nahi hua. Page refresh karke dobara try karein.');
            }
            return false;
        },

        // Opens the Challenger Website right inside the App in a clean Fullscreen View.
        openChallengerPortal: function() {
            let portal = document.getElementById('nx-challenger-inapp-portal');
            if (!portal) {
                portal = document.createElement('div');
                portal.id = 'nx-challenger-inapp-portal';
                portal.className = 'nx-fullscreen-overlay';
                document.body.appendChild(portal);
            }

            portal.innerHTML = `
                <div style="height:54px; background:#0f172a; border-bottom:1.5px solid #f59e0b; display:flex; align-items:center; justify-content:space-between; padding:0 12px; flex-shrink:0;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <button type="button" onclick="document.getElementById('nx-challenger-inapp-portal').style.display='none'" style="background:none; border:none; color:#fff; font-size:20px; cursor:pointer;">←</button>
                        <div>
                            <div style="font-size:14px; font-weight:900; color:#fde047;">🔥 Challenger Live Test Series</div>
                            <div style="font-size:10px; color:#10b981; font-weight:700;">In-App Official Exam Portal</div>
                        </div>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button type="button" onclick="NexusDmInbox.changeChallengerUrl()" class="nx-tw-pill" style="border-color:#f59e0b; color:#fde047;">🔗 Set Link</button>
                        <button type="button" onclick="document.getElementById('nx-challenger-inapp-portal').style.display='none'" class="nx-tw-pill" style="background:#ef4444; border:none; color:white;">Close ✕</button>
                    </div>
                </div>
                <iframe id="nx-challenger-iframe" src="${challengerSiteUrl}" style="flex:1; width:100%; border:none; background:#090d16;" allow="fullscreen; clipboard-write"></iframe>
            `;
            portal.style.display = 'flex';
        },

        changeChallengerUrl: function() {
            let nextUrl = prompt("Enter Challenger Test Series Website URL:", challengerSiteUrl);
            if (nextUrl && nextUrl.trim().startsWith('http')) {
                challengerSiteUrl = nextUrl.trim();
                localStorage.setItem('nx_challenger_site_url_v18', challengerSiteUrl);
                const ifr = document.getElementById('nx-challenger-iframe');
                if (ifr) ifr.src = challengerSiteUrl;
                Nexus.toast("✅ Challenger Website Linked!");
            }
        },

        openPdfVaultPortal: function() {
            if (window.NexusUltra && typeof NexusUltra.openPdfLibraryModal === 'function') return NexusUltra.openPdfLibraryModal();
            if (window.NexusChat && typeof NexusChat.openChatRoom === 'function') return NexusChat.openChatRoom('notes_lib', '📚 PDF Study Vault', 'Notes, Books & PYQs');
            if (window.Nexus && typeof Nexus.toast === 'function') Nexus.toast('PDF Library module load nahi hua.');
            return false;
        }
    });

    window.NexusCore = Object.assign(window.NexusCore || {}, {
        // The AI option now opens its own working Private AI Studio.
        openAiStudio: function() {
            return this.openPrivateAiStudio();
        },

        openPrivateAiStudio: function() {
            const me = window.Nexus && typeof Nexus.getCurrentUser === 'function' ? Nexus.getCurrentUser() : null;
            if (!me) {
                if (window.Nexus && typeof Nexus.toast === 'function') Nexus.toast('AI use karne ke liye pehle login karein.');
                if (window.Nexus && typeof Nexus.switchTab === 'function') Nexus.switchTab('tab-profile');
                return false;
            }

            let studio = document.getElementById('nx-private-ai-studio');
            if (!studio) {
                studio = document.createElement('section');
                studio.id = 'nx-private-ai-studio';
                document.body.appendChild(studio);
            }

            if (!aiChatHistory.length) {
                aiChatHistory.push({
                    role: 'ai',
                    text: "Namaste! Main Nexus ka Private AI Tutor & Coding Assistant hoon.\n\nAap Physics, Chemistry, Maths (JEE), HTML, CSS, JavaScript aur Python ke sawal pooch sakte hain.\n\nApna sawal neeche likhkar Send dabaiye."
                });
                nxPersistAiHistory();
            }

            studio.innerHTML = `
                <div class="nx-ai-studio-header">
                    <div style="display:flex; align-items:center; gap:9px; min-width:0;">
                        <div style="width:38px; height:38px; flex:0 0 38px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#8b5cf6,#38bdf8); color:#020617; font-size:19px;">🤖</div>
                        <div style="min-width:0;">
                            <div style="font-weight:900; font-size:14px; color:#f8fafc;">Nexus Private AI Studio</div>
                            <div style="font-size:10.5px; color:#a7f3d0;">JEE Tutor • Coding Assistant</div>
                        </div>
                    </div>
                    <div style="display:flex; gap:6px; flex-shrink:0;">
                        <button type="button" onclick="NexusCore.clearAiStudioHistory()" style="border:1px solid #475569; background:#1e293b; color:#fca5a5; padding:7px 9px; border-radius:9px; font-size:10px; font-weight:800;">Clear</button>
                        <button type="button" onclick="NexusCore.closePrivateAiStudio()" aria-label="Close AI Studio" style="border:0; background:transparent; color:#cbd5e1; padding:4px 7px; font-size:22px;">×</button>
                    </div>
                </div>
                <div id="nx-ai-studio-msgs" class="nx-ai-studio-messages"></div>
                <div class="nx-ai-studio-composer">
                    <input type="text" id="nx-ai-studio-in" maxlength="6000" placeholder="Physics, Chemistry, Maths ya coding ka sawal…" autocomplete="off">
                    <button type="button" id="nx-ai-studio-send" onclick="NexusCore.sendPrivateAiMessage()" style="width:44px; height:44px; flex:0 0 44px; border:0; border-radius:50%; background:linear-gradient(135deg,#8b5cf6,#38bdf8); color:#020617; font-size:18px; font-weight:900;">➤</button>
                </div>
            `;
            studio.style.display = 'flex';
            renderAiStudioMessages(false);
            const input = document.getElementById('nx-ai-studio-in');
            if (input) {
                input.addEventListener('keydown', event => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        this.sendPrivateAiMessage();
                    }
                });
                window.setTimeout(() => input.focus(), 40);
            }
            return true;
        },

        closePrivateAiStudio: function() {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            isSwaraSpeaking = false;
            const studio = document.getElementById('nx-private-ai-studio');
            if (studio) studio.style.display = 'none';
        },

        clearAiStudioHistory: function() {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            isSwaraSpeaking = false;
            aiChatHistory = [];
            try { localStorage.removeItem('nx_private_ai_history_v1'); } catch (e) {}
            this.openPrivateAiStudio();
        },

        sendPrivateAiMessage: async function() {
            const input = document.getElementById('nx-ai-studio-in');
            const sendButton = document.getElementById('nx-ai-studio-send');
            if (!input || !input.value.trim() || aiRequestInProgress) return;

            const userQuestion = input.value.trim();
            const me = window.Nexus && typeof Nexus.getCurrentUser === 'function' ? Nexus.getCurrentUser() : null;
            if (!me) {
                if (window.Nexus && typeof Nexus.toast === 'function') Nexus.toast('Session expire ho gaya. Dobara login karein.');
                return;
            }

            input.value = '';
            aiChatHistory.push({ role: 'user', text: userQuestion });

            if (isUnsafeOrHackingQuery(userQuestion)) {
                aiChatHistory.push({
                    role: 'ai',
                    text: "🛡️ Main unauthorized access, password theft, malware ya security bypass mein madad nahi kar sakta. Main safe cyber-safety, defensive security, web development aur JEE PCM doubts mein madad kar sakta hoon."
                });
                nxPersistAiHistory();
                renderAiStudioMessages(false);
                return;
            }

            aiRequestInProgress = true;
            if (sendButton) sendButton.disabled = true;
            input.disabled = true;
            renderAiStudioMessages(true);

            let answer = '';
            try {
                const response = await fetch('/.netlify/functions/ai', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        question: userQuestion,
                        history: aiChatHistory.slice(-11, -1).map(item => ({
                            role: item.role === 'ai' ? 'assistant' : 'user',
                            content: String(item.text || '').slice(0, 10000)
                        }))
                    })
                });

                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    const detail = data && (data.error || data.message);
                    throw new Error(detail || `AI service returned HTTP ${response.status}`);
                }
                answer = String(data && data.reply || '').trim();
                if (!answer) throw new Error('AI service returned an empty answer');
            } catch (error) {
                console.error('Nexus AI request failed:', error);
                answer = `⚠️ Nexus AI abhi jawab nahi de paaya.\n\n${String(error && error.message || 'Network or server error')}\n\nAgar yeh error baar-baar aaye, Netlify mein /.netlify/functions/ai function aur uske API environment variables check karein.`;
            } finally {
                aiRequestInProgress = false;
                const currentButton = document.getElementById('nx-ai-studio-send');
                const currentInput = document.getElementById('nx-ai-studio-in');
                if (currentButton) currentButton.disabled = false;
                if (currentInput) currentInput.disabled = false;
            }

            aiChatHistory.push({ role: 'ai', text: answer });
            nxPersistAiHistory();
            renderAiStudioMessages(false);
            const currentInput = document.getElementById('nx-ai-studio-in');
            if (currentInput) currentInput.focus();
        },

        speakSwaraVoice: function(base64Text, buttonElement) {
            if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
                if (window.Nexus && typeof Nexus.toast === 'function') Nexus.toast('Voice reading is not supported in this browser.');
                return;
            }
            if (isSwaraSpeaking) {
                window.speechSynthesis.cancel();
                isSwaraSpeaking = false;
                if (buttonElement) buttonElement.textContent = '🔊 Listen';
                return;
            }

            let rawText = '';
            try { rawText = decodeURIComponent(escape(atob(base64Text))); } catch (e) { return; }
            const cleanText = rawText.replace(/```[\s\S]*?```/g, ' code block omitted ')
                .replace(/[*#_`~>]/g, ' ').replace(/\s+/g, ' ').trim();
            if (!cleanText) return;

            window.speechSynthesis.cancel();
            const voices = window.speechSynthesis.getVoices() || [];
            const voice = voices.find(v => /swara/i.test(v.name)) ||
                voices.find(v => v.lang === 'hi-IN' && /google|female|natural/i.test(v.name)) ||
                voices.find(v => v.lang === 'hi-IN') || voices.find(v => v.lang === 'en-IN');
            const chunks = cleanText.match(/[^.!?।\n]{1,150}[.!?।\n]?/g) || [cleanText];
            let index = 0;
            isSwaraSpeaking = true;
            if (buttonElement) buttonElement.textContent = '⏹ Stop';

            const speakNext = () => {
                if (!isSwaraSpeaking || index >= chunks.length) {
                    isSwaraSpeaking = false;
                    if (buttonElement) buttonElement.textContent = '🔊 Listen';
                    return;
                }
                const utterance = new SpeechSynthesisUtterance(chunks[index++].trim());
                if (voice) utterance.voice = voice;
                utterance.lang = voice ? voice.lang : 'hi-IN';
                utterance.rate = 1.0;
                utterance.pitch = 1.0;
                utterance.onend = speakNext;
                utterance.onerror = () => {
                    isSwaraSpeaking = false;
                    if (buttonElement) buttonElement.textContent = '🔊 Listen';
                };
                window.speechSynthesis.speak(utterance);
            };
            speakNext();
        },

        copyBase64Text: async function(encodedText, toastMessage) {
            let value = '';
            try { value = decodeURIComponent(escape(atob(encodedText))); } catch (e) { return false; }
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(value);
                } else {
                    const temp = document.createElement('textarea');
                    temp.value = value;
                    temp.setAttribute('readonly', '');
                    temp.style.position = 'fixed';
                    temp.style.opacity = '0';
                    document.body.appendChild(temp);
                    temp.select();
                    const ok = document.execCommand('copy');
                    temp.remove();
                    if (!ok) throw new Error('Copy command failed');
                }
                if (window.Nexus && typeof Nexus.toast === 'function') Nexus.toast(toastMessage || 'Copied!');
                return true;
            } catch (error) {
                console.error('Nexus copy failed:', error);
                if (window.Nexus && typeof Nexus.toast === 'function') Nexus.toast('Copy nahi ho paaya. Text select karke copy karein.');
                return false;
            }
        },

        execDmReaction: async function(msgId, emoji) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            let me = Nexus.getCurrentUser();
            if (!me || !Nexus.db || !msgId) return;
            const row = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            if (row) {
                let p = row.querySelector('.nx-dm-live-react-pill');
                if (!p) { p = document.createElement('div'); p.className = 'nx-dm-live-react-pill'; row.appendChild(p); }
                p.innerHTML = `<span>${emoji}</span> <span>@${me.username}</span>`;
            }
            Nexus.toast(`${emoji} Reacted!`);
            try {
                const ref = Nexus.db.collection("nexus_private_dms").doc(msgId);
                let s = await ref.get();
                let likes = (s.exists && Array.isArray(s.data().likes)) ? [...s.data().likes] : [];
                if (!likes.includes(me.username)) likes.push(me.username);
                await ref.set({ likes: likes, reaction: emoji }, { merge: true });
            } catch (e) {}
        },

        execDmReply: function(msgId) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            const row = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            let txt = row ? (row.innerText || 'Message').replace(/\n+/g, ' ').substring(0, 40) : 'Message';
            let pName = document.getElementById('nx-dm-partner-name')?.innerText || 'Partner';
            if (window.NexusDM && NexusDM.startReply) NexusDM.startReply(pName, txt);
        },

        execDmCopy: function(msgId) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            const row = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            if (row) { try { navigator.clipboard.writeText((row.innerText || '').trim()); Nexus.toast("📋 Copied!"); } catch (e) {} }
        },

        execDmDeleteForMe: function(msgId) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            let me = Nexus.getCurrentUser();
            let u = me && me.username ? me.username.toLowerCase().trim() : 'guest';
            let key = 'nexus_dm_hidden_for_me_v1_' + encodeURIComponent(u);
            let set = getHiddenSet();
            set.add(String(msgId));
            try { localStorage.setItem(key, JSON.stringify(Array.from(set))); } catch (e) {}
            const row = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            if (row) row.innerHTML = `<div class="nx-dm-local-deleted">🧹 You deleted this message for yourself</div>`;
            Nexus.toast("🧹 Deleted for you!");
        },

        execDmDeleteForEveryone: async function(msgId) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            let me = Nexus.getCurrentUser();
            if (!me || !Nexus.db || !msgId) return;
            let lbl = `${me.name || me.username} (@${me.username})`;
            const row = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            if (row) {
                row.classList.add('nx-deleted-row-clean');
                row.innerHTML = `<div class="nx-single-deleted-pill">🚫 This message was deleted by <b>${lbl}</b></div>`;
            }
            Nexus.toast("🗑️ Deleted for everyone!");
            try {
                await Nexus.db.collection("nexus_private_dms").doc(msgId).set({
                    deleted: true, deletedAt: Date.now(), deletedBy: me.username, deletedByName: lbl,
                    text: '', imgUrl: '', imgUrls: [], sticker: null, replyTo: null
                }, { merge: true });
            } catch (e) {}
        }
    });

    // Add a Message button to another member's public profile.
    // This runs from core.js after profile.js and dm.js have loaded.
    function addProfileMessageButton(targetKey) {
        const nx = window.Nexus;
        const modal = document.getElementById('nx-global-modal');
        if (!nx || !modal || modal.style.display === 'none') return;

        const profileKey = targetKey && typeof targetKey === 'object' ? (targetKey.username || targetKey.name || '') : targetKey;
        const key = String(profileKey || '').trim().toLowerCase();
        if (!key) return;

        const me = typeof nx.getCurrentUser === 'function' ? nx.getCurrentUser() : null;
        const user = (nx.users || []).find(u => u && u.username && (
            String(u.username).trim().toLowerCase() === key ||
            String(u.name || '').trim().toLowerCase() === key
        ));
        if (!user || !user.username || (me && String(me.username).toLowerCase() === String(user.username).toLowerCase())) return;
        if (modal.querySelector('#nx-dm-trigger-btn')) return;

        const dmBtn = document.createElement('button');
        dmBtn.type = 'button';
        dmBtn.id = 'nx-dm-trigger-btn';
        dmBtn.textContent = '💬 Message';
        dmBtn.style.cssText = 'flex:1; min-width:110px; background:#00a884; color:#04130f; border:0; padding:10px 14px; border-radius:10px; font-weight:800; cursor:pointer;';
        dmBtn.addEventListener('click', function() {
            if (!window.NexusDM || typeof NexusDM.openDirectChat !== 'function') {
                if (typeof nx.toast === 'function') nx.toast('1:1 Chat module load nahi hua. Page refresh karke dobara try karein.');
                return;
            }
            try {
                modal.style.display = 'none';
                NexusDM.openDirectChat(user.username, user.name || user.username, user.dp || '');
            } catch (error) {
                console.error('Nexus profile Message action failed:', error);
                if (typeof nx.toast === 'function') nx.toast('Chat open nahi ho paaya. Dobara try karein.');
            }
        });

        const followBtn = modal.querySelector('button[onclick*="Nexus.toggleFollow"]');
        if (followBtn && followBtn.parentNode) {
            const parent = followBtn.parentNode;
            let actionRow = parent.querySelector('.nx-profile-message-actions');
            if (!actionRow) {
                actionRow = document.createElement('div');
                actionRow.className = 'nx-profile-message-actions';
                actionRow.style.cssText = 'display:flex; align-items:stretch; gap:8px; width:100%; margin:0 0 14px;';
                parent.insertBefore(actionRow, followBtn);
                followBtn.style.flex = '1';
                followBtn.style.minWidth = '0';
                followBtn.style.marginBottom = '0';
                actionRow.appendChild(followBtn);
            }
            actionRow.appendChild(dmBtn);
        } else {
            const box = modal.querySelector('.nx-modal-box') || modal.firstElementChild || modal;
            dmBtn.style.margin = '8px 0 14px';
            box.insertBefore(dmBtn, box.firstChild);
        }
    }

    function installPublicProfileMessageHook() {
        const nx = window.Nexus;
        if (!nx || typeof nx.openPublicProfile !== 'function' || nx.__nxProfileMessageHookV1) return;

        const originalOpenPublicProfile = nx.openPublicProfile;
        nx.openPublicProfile = function(targetKey) {
            const result = originalOpenPublicProfile.apply(this, arguments);
            window.setTimeout(() => addProfileMessageButton(targetKey), 80);
            window.setTimeout(() => addProfileMessageButton(targetKey), 260);
            return result;
        };
        nx.__nxProfileMessageHookV1 = true;
    }

    function installAiHeaderButton() {
        const headerActions = document.querySelector('.nx-header-actions');
        if (!headerActions) return;
        let aiButton = document.getElementById('nx-top-ai-studio-btn') ||
            headerActions.querySelector('button[onclick*="NexusCore.openPrivateAiStudio"], button[onclick*="NexusCore.openAiStudio"]');
        if (!aiButton) {
            aiButton = document.createElement('button');
            aiButton.id = 'nx-top-ai-studio-btn';
            aiButton.type = 'button';
            aiButton.className = 'nx-icon-btn';
            aiButton.style.cssText = 'background:rgba(139,92,246,0.16); border:1px solid rgba(167,139,250,0.65); color:#ddd6fe; padding:6px 10px; border-radius:12px; font-size:12px; font-weight:900; gap:5px;';
            aiButton.innerHTML = '<span aria-hidden="true">🤖</span><span>AI</span>';
            headerActions.insertBefore(aiButton, headerActions.firstChild);
        }
        aiButton.onclick = () => window.NexusCore && NexusCore.openAiStudio();
        aiButton.setAttribute('aria-label', 'Open Nexus AI Studio');
    }

    function runMasterLoop() {
        installPublicProfileMessageHook();
        installAiHeaderButton();
        if (isTyping) return;
        removeDuplicateCommunityCards();
        renderFourGlowingCards();
        startBulletproofNotificationWatchers();
        installMessageMenuWithPlusEmoji();
        fixHomePostReactions();
        ensureWatchPartySubscription();

        // Hook all legacy buttons to our instant working functions
        if (window.NexusAdvance) {
            NexusAdvance.openInAppYouTubeTV = (isDm) => window.NexusWatchParty.openModal(isDm, 'yt');
            NexusAdvance.startVideoCall = (isDm) => window.NexusWatchParty.startVideoMeeting(isDm);
        }
        if (window.NexusPower) {
            NexusPower.openWatchPartyModal = () => window.NexusWatchParty.openModal(true, 'yt');
            NexusPower.openSongSearchModal = () => window.NexusWatchParty.openModal(true, 'mp3');
        }
        if (window.NexusSuperChat) {
            NexusSuperChat.openGroupSongModal = () => window.NexusWatchParty.openModal(false, 'mp3');
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        runMasterLoop();
        setInterval(runMasterLoop, 700);
    });
    setTimeout(runMasterLoop, 100);
})(); // === END OF CORE.JS ===
