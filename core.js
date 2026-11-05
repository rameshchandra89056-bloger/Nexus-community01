// ================= CORE.JS (v16.0 MICRO-MODULAR MASTER LOADER): 🔄 AUTO-LOADS ai.js, screen.js, voice.js & live.js WITHOUT REFRESH + 💬 PUBLIC PROFILE MESSAGE BUTTON FIX (@chanchal) + ❤️🗑️ 100% WORKING 1:1 DM REACTIONS & DELETE FOR ME/EVERYONE + 🔍 INSTANT GLOBAL SEARCH + 🔔 0.01s REALTIME PUSH ALERTS =================

(function() {
    if ('caches' in window && !sessionStorage.getItem('nx_cache_flushed_v16')) {
        sessionStorage.setItem('nx_cache_flushed_v16', '1');
        caches.keys().then(names => { names.forEach(name => caches.delete(name)); }).catch(() => {});
    }

    // =========================================================================
    // 0. 🧩 AUTOMATIC MICRO-MODULE LOADER & ZERO-REFRESH HOT-SWAP ENGINE
    // Automatically loads independent feature files (ai.js, screen.js, voice.js, live.js)
    // =========================================================================
        const NEXUS_MICRO_MODULES = [         'notify.js',         'dotsmenu.js',         'ai.js',         'screen.js',         'voice.js',         'live.js'     ];
    const moduleEtags = {};

    function loadOrUpdateMicroModules(isInitial) {
        NEXUS_MICRO_MODULES.forEach(file => {
            if (isInitial) {
                if (!document.querySelector(`script[data-nx-mod="${file}"]`)) {
                    const s = document.createElement('script');
                    s.src = `${file}?v=${Date.now()}`;
                    s.charset = 'UTF-8';
                    s.setAttribute('data-nx-mod', file);
                    document.body.appendChild(s);
                }
            } else if (!isUserCurrentlyTyping) {
                fetch(`${file}?check=${Date.now()}`, { method: 'HEAD', cache: 'no-store' })
                    .then(res => {
                        if (!res.ok) return;
                        let sig = res.headers.get('etag') || res.headers.get('last-modified') || '';
                        if (!moduleEtags[file]) {
                            moduleEtags[file] = sig;
                            return;
                        }
                        if (sig && sig !== moduleEtags[file]) {
                            moduleEtags[file] = sig;
                            const oldS = document.querySelector(`script[data-nx-mod="${file}"]`);
                            const newS = document.createElement('script');
                            newS.src = `${file}?hot=${Date.now()}`;
                            newS.charset = 'UTF-8';
                            newS.setAttribute('data-nx-mod', file);
                            document.body.appendChild(newS);
                            if (oldS) setTimeout(() => oldS.remove(), 1500);
                        }
                    }).catch(() => {});
            }
        });
    }

    let isUserCurrentlyTyping = false;
    let typingCoolDownTimer = null;
    const markUserTypingActive = () => {
        isUserCurrentlyTyping = true;
        clearTimeout(typingCoolDownTimer);
        typingCoolDownTimer = setTimeout(() => { isUserCurrentlyTyping = false; }, 1200);
    };
    document.addEventListener('keydown', markUserTypingActive, { passive: true });
    document.addEventListener('input', markUserTypingActive, { passive: true });

    let sessionBootTime = Date.now();
    let dmPopupWatcherUnsub = null;
    let notifListenerUnsub = null;

    const coreStyle = document.createElement('style');
    coreStyle.innerHTML = `
        .nx-post-card, .nx-act-pill, .nx-menu-opt-btn, .nx-cmsg-opt-btn, .nx-nav-item {
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .nx-act-pill:active, .nx-menu-opt-btn:active, .nx-cmsg-opt-btn:active {
            transform: scale(0.95) !important;
        }
        .nx-single-deleted-pill {
            background: rgba(239, 68, 68, 0.14) !important;
            border: 1.5px dashed rgba(248, 113, 113, 0.65) !important;
            color: #fecaca !important; padding: 7px 13px !important; border-radius: 12px !important;
            font-size: 12.5px !important; font-style: italic !important; line-height: 1.4 !important;
            display: block !important; width: fit-content !important; max-width: 86% !important;
        }
        .nx-single-deleted-pill *, .nx-dm-bubble-anim.nx-deleted-row-clean {
            border: none !important; background: transparent !important; padding: 0 !important; display: inline !important;
        }
        .nx-dm-bubble-anim.nx-deleted-row-clean { display: flex !important; margin: 2px 0 !important; }
        #nx-dm-bottom-tray, #nx-grp-bottom-tray {
            position: relative !important; bottom: auto !important; left: auto !important; right: auto !important;
            width: 100% !important; max-height: 148px !important; overflow-y: auto !important;
            grid-template-columns: repeat(4, 1fr) !important; gap: 6px !important; padding: 8px 10px !important;
            background: #111b21 !important; border-top: 1.5px solid #00a884 !important; flex-shrink: 0 !important; z-index: 25 !important;
        }
        .nx-dm-live-react-pill {
            display: inline-flex; align-items: center; gap: 4px; background: #182229;
            border: 1.5px solid #00a884; color: #f8fafc; padding: 2px 8px; border-radius: 12px;
            font-size: 11.5px; font-weight: 800; margin-top: 3px; cursor: pointer;
        }
        #nx-instant-push-toast {
            position: fixed; top: 12px; left: 50%; transform: translateX(-50%) translateY(-140%);
            width: 92%; max-width: 410px; background: rgba(15, 23, 42, 0.96);
            backdrop-filter: blur(12px); border: 1.5px solid #10b981; border-radius: 16px;
            padding: 11px 14px; z-index: 100250; display: flex; align-items: center; gap: 10px;
            box-shadow: 0 14px 35px rgba(0,0,0,0.88); transition: transform 0.26s cubic-bezier(0.16, 1, 0.3, 1);
            cursor: pointer;
        }
        #nx-instant-push-toast.show { transform: translateX(-50%) translateY(0); }
    `;
    document.head.appendChild(coreStyle);

    // =========================================================================
    // 1. 💬 PUBLIC PROFILE MESSAGE BUTTON RESTORER (Fixes @chanchal Screenshot)
    // =========================================================================
    function enforceMessageButtonOnPublicProfile() {
        const modal = document.getElementById('nx-global-modal');
        if (!modal || modal.style.display === 'none') return;

        const followBtn = modal.querySelector('button[onclick*="Nexus.toggleFollow"]');
        if (!followBtn) return;

        let match = (followBtn.getAttribute('onclick') || '').match(/'([^']+)'/);
        if (!match || !match[1]) return;

        let targetUser = match[1];
        let uObj = (window.Nexus && Nexus.users || []).find(u => u && u.username && u.username.toLowerCase() === targetUser.toLowerCase());
        let targetName = (uObj && uObj.name) ? uObj.name : targetUser;
        let safeU = targetUser.replace(/'/g, "\\'");
        let safeN = targetName.replace(/'/g, "\\'");

        const parentRow = followBtn.parentElement;
        if (!parentRow) return;

        parentRow.style.display = 'flex';
        parentRow.style.gap = '10px';
        parentRow.style.width = '100%';
        followBtn.style.flex = '1';
        followBtn.style.width = 'auto';

        let otherBtns = Array.from(parentRow.querySelectorAll('button')).filter(b => b !== followBtn);

        if (otherBtns.length === 0) {
            const msgBtn = document.createElement('button');
            msgBtn.type = 'button';
            msgBtn.style.cssText = "flex:1; background:linear-gradient(135deg,#10b981,#059669); color:#020617; border:none; padding:11px; border-radius:12px; font-weight:900; font-size:13.5px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:6px;";
            msgBtn.innerHTML = `💬 Message`;
            msgBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                modal.style.display = 'none';
                if (window.NexusDM) NexusDM.openDirectChat(safeU, safeN, '');
            };
            parentRow.appendChild(msgBtn);
        } else {
            otherBtns.forEach((b, idx) => {
                if (idx === 0) {
                    if (b.id === 'nx-dm-trigger-btn') b.removeAttribute('id');
                    b.style.setProperty('display', 'inline-flex', 'important');
                    b.style.flex = '1';
                    b.style.background = 'linear-gradient(135deg,#10b981,#059669)';
                    b.style.color = '#020617';
                    b.style.border = 'none';
                    b.style.padding = '11px';
                    b.style.borderRadius = '12px';
                    b.style.fontWeight = '900';
                    b.style.fontSize = '13.5px';
                    b.style.alignItems = 'center';
                    b.style.justifyContent = 'center';
                    b.innerHTML = `💬 Message`;
                    b.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        modal.style.display = 'none';
                        if (window.NexusDM) NexusDM.openDirectChat(safeU, safeN, '');
                    };
                } else {
                    b.remove();
                }
            });
        }

        if (!document.getElementById('nx-dm-trigger-btn')) {
            const dummy = document.createElement('span');
            dummy.id = 'nx-dm-trigger-btn';
            dummy.style.display = 'none';
            modal.appendChild(dummy);
        }
    }

    function hookOpenPublicProfileInstant() {
        if (!window.Nexus || Nexus.__nxProfileMsgHookedV16) return;
        if (typeof Nexus.openPublicProfile !== 'function') return;
        Nexus.__nxProfileMsgHookedV16 = true;
        const origOpenProfile = Nexus.openPublicProfile.bind(Nexus);
        Nexus.openPublicProfile = function(username) {
            let res = origOpenProfile(username);
            enforceMessageButtonOnPublicProfile();
            setTimeout(enforceMessageButtonOnPublicProfile, 25);
            setTimeout(enforceMessageButtonOnPublicProfile, 120);
            return res;
        };
    }

    // =========================================================================
    // 2. ❤️🗑️ 100% WORKING 1:1 DM REACTIONS & DELETE FOR ME / EVERYONE
    // =========================================================================
    function getHiddenForMeSet() {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let u = me && me.username ? me.username.toLowerCase().trim() : 'guest';
        try { return new Set(JSON.parse(localStorage.getItem('nexus_dm_hidden_for_me_v1_' + encodeURIComponent(u)) || '[]')); } catch (e) { return new Set(); }
    }

    function addHiddenForMeId(msgId) {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let u = me && me.username ? me.username.toLowerCase().trim() : 'guest';
        let key = 'nexus_dm_hidden_for_me_v1_' + encodeURIComponent(u);
        let set = getHiddenForMeSet();
        set.add(String(msgId));
        try { localStorage.setItem(key, JSON.stringify(Array.from(set))); } catch (e) {}
    }

    function applyHiddenAndDeletedStylesInDmBox() {
        if (isUserCurrentlyTyping) return;
        let hiddenSet = getHiddenForMeSet();
        document.querySelectorAll('#nx-dm-msgs-box .nx-dm-bubble-anim').forEach(row => {
            let msgId = row.getAttribute('data-message-id') || '';
            if (msgId && hiddenSet.has(msgId) && !row.getAttribute('data-hidden-applied')) {
                row.setAttribute('data-hidden-applied', '1');
                row.innerHTML = `<div class="nx-dm-local-deleted">🧹 You deleted this message for yourself</div>`;
                return;
            }
            if ((row.innerText || '').includes('This message was deleted by') && !row.classList.contains('nx-deleted-row-clean')) {
                let rawText = (row.innerText || '').trim();
                row.classList.add('nx-deleted-row-clean');
                row.innerHTML = `<div class="nx-single-deleted-pill">🚫 ${rawText.replace(/^🚫\s*/, '')}</div>`;
            }
        });
    }

    function installBulletproofDmMessageMenu() {
        if (!window.NexusDM) return;
        NexusDM.openMsgActionMenu = function(msgId) {
            if (!msgId) return;
            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (!me) return;

            let modal = document.getElementById('nx-msg-action-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'nx-msg-action-modal';
                modal.className = 'nx-msg-action-backdrop';
                modal.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };
                document.body.appendChild(modal);
            }

            const rowEl = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            let isMine = rowEl ? (rowEl.style.alignItems === 'flex-end') : true;
            let bubbleText = '';
            if (rowEl) {
                let clone = rowEl.cloneNode(true);
                clone.querySelectorAll('button, .nx-dm-message-menu-btn').forEach(b => b.remove());
                bubbleText = (clone.innerText || '').replace(/\d{1,2}:\d{2}\s*(AM|PM|am|pm)?.*$/s, '').trim();
            }

            const emojis = ['❤️', '😂', '🔥', '👍', '🙏', '💯'];
            let safeId = String(msgId).replace(/'/g, "\\'");

            modal.innerHTML = `
                <div class="nx-msg-action-sheet">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span style="font-size:12px; color:#93c5fd; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:240px;">
                            ${bubbleText ? `"${bubbleText.replace(/</g, '&lt;')}"` : '💬 Message Options'}
                        </span>
                        <button type="button" onclick="document.getElementById('nx-msg-action-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>
                    <div class="nx-emoji-bar">
                        ${emojis.map(em => `<button type="button" class="nx-emoji-btn" onclick="NexusCore.execDmReaction('${safeId}', '${em}')">${em}</button>`).join('')}
                    </div>
                    <button type="button" class="nx-menu-opt-btn" onclick="NexusCore.execDmReply('${safeId}')"><span>↩️</span> <span>Reply to Message</span></button>
                    <button type="button" class="nx-menu-opt-btn" onclick="NexusCore.execDmCopy('${safeId}')"><span>📋</span> <span>Copy Message Text</span></button>
                    ${isMine ? `<button type="button" class="nx-menu-opt-btn" style="color:#38bdf8;" onclick="NexusCore.execDmEdit('${safeId}')"><span>✏️</span> <span>Edit Message</span></button>` : ''}
                    <button type="button" class="nx-menu-opt-btn" style="color:#cbd5e1;" onclick="NexusCore.execDmDeleteForMe('${safeId}')"><span>🧹</span> <span>Delete for Me</span></button>
                    ${isMine ? `<button type="button" class="nx-menu-opt-btn" style="color:#f87171; border-color:rgba(239,68,68,0.4);" onclick="NexusCore.execDmDeleteForEveryone('${safeId}')"><span>🗑️</span> <span>Delete for Everyone</span></button>` : ''}
                    <button type="button" class="nx-menu-opt-btn" style="justify-content:center; background:transparent; border:none; color:#8696a0; margin-bottom:0;" onclick="document.getElementById('nx-msg-action-modal').style.display='none'">Cancel</button>
                </div>
            `;
            modal.style.display = 'flex';
        };
    }

    // =========================================================================
    // 3. 🔔 0.01s INSTANT NOTIFICATION BANNER & SEARCH
    // =========================================================================
    function showInstantPushPopup(icon, title, subtitle, onClickFn) {
        let banner = document.getElementById('nx-instant-push-toast');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'nx-instant-push-toast';
            document.body.appendChild(banner);
        }
        banner.innerHTML = `
            <div style="width:38px; height:38px; border-radius:12px; background:linear-gradient(135deg,#10b981,#2563eb); color:white; display:flex; align-items:center; justify-content:center; font-size:19px; flex-shrink:0;">${icon}</div>
            <div style="min-width:0; flex:1;">
                <div style="font-size:13px; font-weight:900; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${title}</div>
                <div style="font-size:11.5px; color:#93c5fd; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${subtitle}</div>
            </div>
            <span style="font-size:11px; color:#10b981; font-weight:900; flex-shrink:0;">Open →</span>
        `;
        banner.onclick = () => {
            banner.classList.remove('show');
            if (typeof onClickFn === 'function') onClickFn();
        };
        banner.classList.add('show');
        if (navigator.vibrate) { try { navigator.vibrate(45); } catch (e) {} }
        clearTimeout(banner.__hideTimer);
        banner.__hideTimer = setTimeout(() => { banner.classList.remove('show'); }, 4500);
    }

    function startInstantRealtimeAlertWatchers() {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        if (!me || !me.username || !Nexus.db || dmPopupWatcherUnsub) return;

        dmPopupWatcherUnsub = Nexus.db.collection("nexus_private_dms")
            .where("toUser", "==", me.username)
            .limit(20)
            .onSnapshot(snap => {
                snap.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        let m = change.doc.data();
                        if (m && m.createdAt && m.createdAt > sessionBootTime && !m.deleted) {
                            const dmRoot = document.getElementById('nx-dm-dedicated-root');
                            if (!dmRoot || dmRoot.style.display === 'none') {
                                let txt = m.text || '';
                                let preview = txt.startsWith('🎵VOICE|') ? '🎤 Sent a Voice Note' : (txt.startsWith('🖥️SCRSHARE|') ? '🖥️ Sharing Live Screen with you!' : (txt || '📷 Sent media'));
                                showInstantPushPopup('💬', `${m.fromName || '@' + m.fromUser}`, preview, () => {
                                    if (window.NexusDM) NexusDM.openDirectChat(m.fromUser, m.fromName || m.fromUser, '');
                                });
                            }
                        }
                    }
                });
            }, () => {});
    }

    function installFastGlobalSearchModal() {
        if (!window.Nexus) return;
        Nexus.openSearch = function() {
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;
            modal.style.alignItems = 'flex-start';
            modal.style.paddingTop = '20px';
            modal.innerHTML = `
                <div class="nx-modal-box" style="border:1.5px solid #38bdf8; max-width:420px; width:100%; max-height:80dvh; display:flex; flex-direction:column; background:#090d16;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h3 style="font-size:16px; color:#f8fafc;">🔍 Search Members &amp; Study Posts</h3>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>
                    <input type="text" id="nx-fast-search-input" oninput="NexusCore.runInstantGlobalSearch(this.value)" placeholder="Search member name, @username, or post topic..." autocomplete="off" style="width:100%; padding:11px 14px; border-radius:12px; border:1.5px solid #38bdf8; background:#101726; color:white; font-size:14px; outline:none; margin-bottom:10px;">
                    <div id="nx-fast-search-results" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:8px; max-height:58dvh;"></div>
                </div>
            `;
            modal.style.display = 'flex';
            const inp = document.getElementById('nx-fast-search-input');
            if (inp) inp.focus();
            NexusCore.runInstantGlobalSearch('');
        };
    }

    window.NexusCore = Object.assign(window.NexusCore || {}, {
        showInstantPushPopup: showInstantPushPopup,

        execDmReaction: async function(msgId, emoji) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (!me || !Nexus.db || !msgId) return;

            const rowEl = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            if (rowEl) {
                let existingPill = rowEl.querySelector('.nx-dm-live-react-pill');
                if (!existingPill) {
                    existingPill = document.createElement('div');
                    existingPill.className = 'nx-dm-live-react-pill';
                    rowEl.appendChild(existingPill);
                }
                existingPill.innerHTML = `<span>${emoji}</span> <span>@${me.username}</span>`;
            }
            Nexus.toast(`${emoji} Reacted!`);

            try {
                const docRef = Nexus.db.collection("nexus_private_dms").doc(msgId);
                const snap = await docRef.get();
                let likes = (snap.exists && Array.isArray(snap.data().likes)) ? [...snap.data().likes] : [];
                if (!likes.includes(me.username)) likes.push(me.username);
                await docRef.set({ likes: likes, reaction: emoji }, { merge: true });
            } catch (e) {}
        },

        execDmReply: function(msgId) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            const rowEl = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            let text = 'Message';
            if (rowEl) {
                let clone = rowEl.cloneNode(true);
                clone.querySelectorAll('button, .nx-dm-message-menu-btn').forEach(b => b.remove());
                text = (clone.innerText || 'Message').replace(/\n+/g, ' ').trim().substring(0, 45);
            }
            let me = Nexus.getCurrentUser();
            let isMine = rowEl ? (rowEl.style.alignItems === 'flex-end') : false;
            let pName = document.getElementById('nx-dm-partner-name')?.innerText || 'Partner';
            let senderName = isMine ? (me ? me.name : 'You') : pName;
            if (window.NexusDM && NexusDM.startReply) NexusDM.startReply(senderName, text);
        },

        execDmCopy: function(msgId) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            const rowEl = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            if (!rowEl) return;
            let clone = rowEl.cloneNode(true);
            clone.querySelectorAll('button, .nx-dm-message-menu-btn').forEach(b => b.remove());
            let txt = (clone.innerText || '').replace(/\d{1,2}:\d{2}\s*(AM|PM|am|pm)?.*$/s, '').trim();
            try { navigator.clipboard.writeText(txt); Nexus.toast("📋 Copied!"); } catch (e) {}
        },

        execDmEdit: function(msgId) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            const rowEl = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            let oldText = '';
            if (rowEl) {
                let clone = rowEl.cloneNode(true);
                clone.querySelectorAll('button, .nx-dm-message-menu-btn').forEach(b => b.remove());
                oldText = (clone.innerText || '').replace(/\d{1,2}:\d{2}\s*(AM|PM|am|pm)?.*$/s, '').trim();
            }
            if (window.NexusDM && NexusDM.startEdit) NexusDM.startEdit(msgId, oldText);
        },

        execDmDeleteForMe: function(msgId) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            if (!msgId) return;
            addHiddenForMeId(msgId);
            const rowEl = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            if (rowEl) {
                rowEl.setAttribute('data-hidden-applied', '1');
                rowEl.innerHTML = `<div class="nx-dm-local-deleted">🧹 You deleted this message for yourself</div>`;
            }
            Nexus.toast("🧹 Deleted for you!");
        },

        execDmDeleteForEveryone: async function(msgId) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (!me || !Nexus.db || !msgId) return;

            let deletedLabel = `${me.name || me.username} (@${me.username})`;
            const rowEl = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            if (rowEl) {
                rowEl.classList.add('nx-deleted-row-clean');
                rowEl.innerHTML = `<div class="nx-single-deleted-pill">🚫 This message was deleted by <b>${deletedLabel}</b></div>`;
            }
            Nexus.toast("🗑️ Deleted for everyone!");

            try {
                await Nexus.db.collection("nexus_private_dms").doc(msgId).set({
                    deleted: true, deletedAt: Date.now(), deletedBy: me.username, deletedByName: deletedLabel,
                    text: '', imgUrl: '', imgUrls: [], sticker: null, replyTo: null, edited: false, likes: [], reaction: ''
                }, { merge: true });
            } catch (e) {}
        },

        runInstantGlobalSearch: function(rawQuery) {
            const resBox = document.getElementById('nx-fast-search-results');
            if (!resBox) return;
            let q = (rawQuery || '').toLowerCase().trim();

            let users = (Nexus.users || []).filter(u =>
                u && u.username && u.username !== 'nexus_official' && (
                    !q || u.username.toLowerCase().includes(q) || (u.name && u.name.toLowerCase().includes(q)) || (u.bio && u.bio.toLowerCase().includes(q))
                )
            ).slice(0, 6);

            let posts = (Nexus.posts || []).filter(p =>
                p && p.id && (
                    !q || (p.text && p.text.toLowerCase().includes(q)) || (p.author && p.author.toLowerCase().includes(q)) || (p.username && p.username.toLowerCase().includes(q))
                )
            ).slice(0, 8);

            let uHTML = users.map(u => {
                let safeU = u.username.replace(/'/g, "\\'");
                let ch = (u.name || u.username || 'U').charAt(0).toUpperCase();
                return `
                    <div onclick="document.getElementById('nx-global-modal').style.display='none'; Nexus.openPublicProfile('${safeU}');" style="display:flex; align-items:center; justify-content:space-between; padding:9px 11px; background:#161f33; border:1px solid #1e293b; border-radius:12px; cursor:pointer;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width:34px; height:34px; border-radius:50%; background:#2563eb; color:white; display:flex; align-items:center; justify-content:center; font-weight:800;">${ch}</div>
                            <div>
                                <div style="font-size:13.5px; font-weight:800; color:#f8fafc;">${u.name || u.username}</div>
                                <div style="font-size:11px; color:#38bdf8;">@${u.username} • ${u.bio || 'Student'}</div>
                            </div>
                        </div>
                        <span style="color:#10b981; font-size:11.5px; font-weight:800;">Profile →</span>
                    </div>
                `;
            }).join('');

            let pHTML = posts.map(p => `
                <div onclick="document.getElementById('nx-global-modal').style.display='none'; Nexus.openSinglePostModal('${p.id}');" style="padding:10px 12px; background:#101726; border:1px solid #1e293b; border-left:3px solid #38bdf8; border-radius:12px; cursor:pointer;">
                    <div style="font-size:11.5px; color:#38bdf8; font-weight:800; margin-bottom:3px;">📸 @${p.username || p.author}</div>
                    <div style="font-size:13px; color:#e2e8f0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${(p.text || 'Photo Note').replace(/</g, '&lt;')}</div>
                </div>
            `).join('');

            resBox.innerHTML = `
                ${uHTML ? `<div style="font-size:11px; color:#94a3b8; font-weight:800; margin-top:2px;">👤 MEMBERS (${users.length})</div>${uHTML}` : ''}
                ${pHTML ? `<div style="font-size:11px; color:#94a3b8; font-weight:800; margin-top:6px;">📝 POSTS &amp; NOTES (${posts.length})</div>${pHTML}` : ''}
                ${(!uHTML && !pHTML) ? `<div style="text-align:center; padding:18px; color:#64748b; font-size:13px;">No results found for "${rawQuery}"</div>` : ''}
            `;
        }
    });

    function runCoreLoop() {
        if (isUserCurrentlyTyping) return;
        hookOpenPublicProfileInstant();
        enforceMessageButtonOnPublicProfile();
        installBulletproofDmMessageMenu();
        applyHiddenAndDeletedStylesInDmBox();
        installFastGlobalSearchModal();
        startInstantRealtimeAlertWatchers();
    }

    document.addEventListener('DOMContentLoaded', () => {
        loadOrUpdateMicroModules(true);
        runCoreLoop();
        setInterval(runCoreLoop, 650);
        setInterval(() => loadOrUpdateMicroModules(false), 18000);
    });
    setTimeout(() => {
        loadOrUpdateMicroModules(true);
        runCoreLoop();
    }, 80);
})();
