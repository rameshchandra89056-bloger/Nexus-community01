// ================= CORE.JS (v19.0 PERMANENT MASTER ENGINE): 🧩 AUTO-LOADS ALL MODULAR FILES + 👤 DP CLICK '+ FOLLOW' & '💬 MESSAGE' GUARANTEED FIX + 🔍 INSTANT GLOBAL SEARCH (USERS & POSTS) + ✨ 4 GLOWING CARDS WITH https://challengers-live.netlify.app PRE-INSTALLED + ❤️➕ DM REACTIONS & DELETE FOR ME/EVERYONE + 🔔 0.01s NOTIFICATIONS =================

(function() {
    const PROTO = 'https:' + '//';

    // 1. Pre-installed Official Challenger Live Test URL (No manual line edit needed!)
    let challengerSiteUrl = 'https://challengers-live.netlify.app';

    // 2. Auto-Flush Stale Cache Once
    if ('caches' in window && !sessionStorage.getItem('nx_flushed_v19')) {
        sessionStorage.setItem('nx_flushed_v19', '1');
        caches.keys().then(names => names.forEach(n => caches.delete(n))).catch(() => {});
    }

    // 3. Automatic Micro-Module Loader (Loads all your separate feature files without refresh!)
    const MICRO_MODULES = ['live.js', 'dminbox.js', 'ai.js', 'pwa.js', 'notify.js', 'dotsmenu.js', 'screen.js', 'voice.js', 'board.js'];
    function loadAllModularFiles() {
        MICRO_MODULES.forEach(file => {
            if (!document.querySelector(`script[data-nx-mod="${file}"]`)) {
                const s = document.createElement('script');
                s.src = `${file}?v=${Date.now()}`;
                s.charset = 'UTF-8';
                s.setAttribute('data-nx-mod', file);
                document.body.appendChild(s);
            }
        });
    }

    let isTyping = false, typTimer = null;
    const markTyping = () => {
        isTyping = true;
        clearTimeout(typTimer);
        typTimer = setTimeout(() => { isTyping = false; }, 1200);
    };
    document.addEventListener('keydown', markTyping, { passive: true });
    document.addEventListener('input', markTyping, { passive: true });

    let dmUnsub = null, notifUnsub = null;
    let initialDmLoaded = false, initialNotifLoaded = false;
    let knownDmIds = new Set(), knownNotifIds = new Set();
    let dmSummaryMap = {}, totalUnreadDms = 0;

    const st = document.createElement('style');
    st.innerHTML = `
        /* Hide duplicate community banners & broken watch-party boxes */
        #nx-dm-inbox-banner > *:not(#nx-structured-4card-grid),
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

        @keyframes nxBeamRun {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
        }
        .nx-card-glow-beam {
            position: absolute; top: 0; left: 0; right: 0; height: 3px;
            background: rgba(255, 255, 255, 0.08); overflow: hidden;
        }
        .nx-card-glow-beam::after {
            content: ''; position: absolute; top: 0; left: 0; width: 55%; height: 100%;
            background: linear-gradient(90deg, transparent, var(--beam-color, #10b981), #ffffff, transparent);
            animation: nxBeamRun 2.5s linear infinite;
            will-change: transform;
        }

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

        #nx-top-push-banner {
            position: fixed; top: 10px; left: 50%; transform: translateX(-50%) translateY(-160%);
            width: 94%; max-width: 415px; background: linear-gradient(135deg, #0f172a, #064e3b);
            border: 2px solid #10b981; border-radius: 16px; padding: 12px 14px; z-index: 100400;
            display: flex; align-items: center; justify-content: space-between; gap: 10px;
            box-shadow: 0 16px 40px rgba(0,0,0,0.92); transition: transform 0.25s ease; cursor: pointer;
        }
        #nx-top-push-banner.show { transform: translateX(-50%) translateY(0); }

        .nx-fullscreen-overlay {
            position: fixed; inset: 0; width: 100%; max-width: 640px; height: 100dvh;
            margin: 0 auto; background: #090d16; z-index: 100200;
            display: none; flex-direction: column; overflow: hidden;
        }
        .nx-tw-pill {
            background: #1e293b; border: 1px solid #334155; color: #f8fafc;
            padding: 5px 10px; border-radius: 9px; font-size: 11px; font-weight: 800;
            cursor: pointer; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; flex-shrink: 0;
        }
        .nx-tw-pill:active { transform: scale(0.94); }
    `;
    document.head.appendChild(st);

    // =========================================================================
    // 1. 👤 DP CLICK PUBLIC PROFILE '+ FOLLOW' & '💬 MESSAGE' GUARANTEED FIX
    // Works even if pro.js/ultra.js hides buttons or if Follow button was missing!
    // =========================================================================
    function enforceFollowAndMessageOnProfileModal() {
        const modal = document.getElementById('nx-global-modal');
        if (!modal || modal.style.display === 'none') return;

        // Detect if Member Public Profile modal is open
        const isProfileModal = modal.innerText.includes('Member Full Profile') ||
                               modal.innerText.includes('SHARED POSTS') ||
                               modal.querySelector('button[onclick*="Nexus.toggleFollow"]');
        if (!isProfileModal) return;

        // Extract target username from modal (@username text or toggleFollow button)
        let targetUser = '';
        const followBtn = modal.querySelector('button[onclick*="Nexus.toggleFollow"]');
        if (followBtn) {
            let m = (followBtn.getAttribute('onclick') || '').match(/'([^']+)'/);
            if (m && m[1]) targetUser = m[1];
        }
        if (!targetUser) {
            let atMatch = (modal.innerText || '').match(/@([a-zA-Z0-9_.-]+)/);
            if (atMatch && atMatch[1]) targetUser = atMatch[1];
        }
        if (!targetUser) return;

        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let uObj = (window.Nexus && Nexus.users || []).find(u => u && u.username && u.username.toLowerCase() === targetUser.toLowerCase());
        let targetName = (uObj && uObj.name) ? uObj.name : targetUser;
        let safeU = targetUser.replace(/'/g, "\\'");
        let safeN = targetName.replace(/'/g, "\\'");
        let isFollowing = me && Array.isArray(me.followingList) && me.followingList.includes(targetUser);

        // Find or create the dedicated 50%-50% Action Row inside the profile card
        let actionRow = modal.querySelector('#nx-guaranteed-profile-action-row');
        if (!actionRow) {
            actionRow = document.createElement('div');
            actionRow.id = 'nx-guaranteed-profile-action-row';
            actionRow.style.cssText = 'display:flex !important; gap:10px !important; width:100% !important; margin:12px 0 !important;';

            if (followBtn && followBtn.parentElement) {
                followBtn.parentElement.style.display = 'none';
                followBtn.parentElement.insertAdjacentElement('afterend', actionRow);
            } else {
                const box = modal.querySelector('.nx-modal-box');
                if (box) box.appendChild(actionRow);
            }
        }

        if (actionRow.getAttribute('data-rendered-user') !== `${targetUser}_${isFollowing}`) {
            actionRow.setAttribute('data-rendered-user', `${targetUser}_${isFollowing}`);
            actionRow.innerHTML = `
                <button type="button" onclick="Nexus.toggleFollow('${safeU}'); setTimeout(()=>{ if(window.NexusCore) NexusCore.refreshProfileButtons(); }, 80);" style="flex:1; background:${isFollowing ? '#1e293b' : 'linear-gradient(135deg,#2563eb,#4f46e5)'}; color:#ffffff; border:${isFollowing ? '1px solid #38bdf8' : 'none'}; padding:11px; border-radius:12px; font-weight:900; font-size:13.5px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 4px 14px rgba(37,99,235,0.3);">
                    ${isFollowing ? '✓ Following' : '+ Follow'}
                </button>
                <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusDM) NexusDM.openDirectChat('${safeU}', '${safeN}', '');" style="flex:1; background:linear-gradient(135deg,#10b981,#059669); color:#020617; border:none; padding:11px; border-radius:12px; font-weight:900; font-size:13.5px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 4px 14px rgba(16,185,129,0.3);">
                    💬 Message
                </button>
            `;
        }

        // Keep dummy #nx-dm-trigger-btn so old dm.js never throws errors
        if (!document.getElementById('nx-dm-trigger-btn')) {
            const dummy = document.createElement('span');
            dummy.id = 'nx-dm-trigger-btn';
            dummy.style.display = 'none';
            modal.appendChild(dummy);
        }
    }

    function hookPublicProfileOpen() {
        if (!window.Nexus || Nexus.__nxProfileHookedV19) return;
        if (typeof Nexus.openPublicProfile !== 'function') return;
        Nexus.__nxProfileHookedV19 = true;
        const origOpen = Nexus.openPublicProfile.bind(Nexus);
        Nexus.openPublicProfile = function(username) {
            let r = origOpen(username);
            enforceFollowAndMessageOnProfileModal();
            setTimeout(enforceFollowAndMessageOnProfileModal, 30);
            setTimeout(enforceFollowAndMessageOnProfileModal, 150);
            return r;
        };
    }

    // =========================================================================
    // 2. 🔍 100% WORKING TOP HEADER GLOBAL SEARCH (MEMBERS, @USERNAMES & POSTS)
    // =========================================================================
    function installWorkingGlobalSearch() {
        if (!window.Nexus) return;
        Nexus.openSearch = function() {
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;
            modal.style.alignItems = 'flex-start';
            modal.style.paddingTop = '18px';

            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid #38bdf8; max-width:420px; width:100%; max-height:82dvh; display:flex; flex-direction:column; background:#090d16; padding:15px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <strong style="font-size:15.5px; color:#f8fafc;">🔍 Search Members, Friends &amp; Posts</strong>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:19px; cursor:pointer;">✕</button>
                    </div>
                    <input type="text" id="nx-global-search-in" oninput="NexusCore.execGlobalSearch(this.value)" placeholder="Type member name, @username, or study post..." autocomplete="off" style="width:100%; padding:11px 14px; border-radius:12px; border:1.5px solid #38bdf8; background:#111827; color:white; font-size:13.5px; outline:none; margin-bottom:10px;">
                    <div id="nx-global-search-results" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:8px; max-height:60dvh;"></div>
                </div>
            `;
            modal.style.display = 'flex';
            const inp = document.getElementById('nx-global-search-in');
            if (inp) inp.focus();
            NexusCore.execGlobalSearch('');
        };

        // Also bind the top header search icon button directly
        document.querySelectorAll('.nx-header-actions button').forEach(btn => {
            let oc = btn.getAttribute('onclick') || '';
            if (oc.includes('openSearch') && !btn.getAttribute('data-search-v19')) {
                btn.setAttribute('data-search-v19', '1');
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    Nexus.openSearch();
                };
            }
        });
    }

    // =========================================================================
    // 3. 📐 CLEAN 4 GLOWING CARDS ON COMMUNITY TAB & REMOVE DUPLICATES
    // =========================================================================
    function removeDuplicateBottomCards() {
        const comm = document.getElementById('tab-community');
        if (!comm) return;
        comm.querySelectorAll('div, button, a').forEach(el => {
            if (el.closest('#nx-structured-4card-grid') || el.id === 'nx-structured-4card-grid') return;
            let txt = (el.innerText || '').trim();
            if ((txt === 'Live Test Series' || txt.startsWith('PDF Study Vault')) && el.tagName !== 'BODY') {
                let parentRow = el.parentElement;
                if (parentRow && parentRow.id !== 'tab-community' && (parentRow.innerText || '').includes('Live Test Series') && (parentRow.innerText || '').includes('PDF Study Vault')) {
                    parentRow.style.setProperty('display', 'none', 'important');
                } else {
                    el.style.setProperty('display', 'none', 'important');
                }
            }
        });
    }

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
            <div class="nx-half-card" style="border-color:rgba(16,185,129,0.5);" onclick="if(window.NexusDmInbox && NexusDmInbox.openFullScreenDmHub) NexusDmInbox.openFullScreenDmHub(); else if(window.NexusDM) NexusDM.openDirectChat('${allUsers[0] ? allUsers[0].username : 'mohiy'}', '${allUsers[0] ? (allUsers[0].name || allUsers[0].username) : 'Chat'}', '');">
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

            <div class="nx-half-card" style="border-color:rgba(167,139,250,0.5);" onclick="if(window.NexusAI) NexusAI.openStudio(); else NexusCore.openAiStudio();">
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

            <div class="nx-half-card" style="border-color:rgba(245,158,11,0.5);" onclick="NexusCore.openChallengerPortal()">
                <div class="nx-card-glow-beam" style="--beam-color:#f59e0b;"></div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="width:36px; height:36px; border-radius:11px; background:rgba(245,158,11,0.18); border:1px solid #f59e0b; display:flex; align-items:center; justify-content:center; font-size:18px;">📝</div>
                    <span style="background:rgba(245,158,11,0.2); color:#fde047; font-size:10px; font-weight:900; padding:2px 7px; border-radius:99px;">🔥 Challenger</span>
                </div>
                <div style="margin-top:8px;">
                    <div style="font-size:13.5px; font-weight:900; color:#f8fafc;">Live Test Series</div>
                    <div style="font-size:10.5px; color:#fde047; margin-top:2px; font-weight:700;">Open Challenger App →</div>
                </div>
            </div>

            <div class="nx-half-card" style="border-color:rgba(56,189,248,0.5);" onclick="if(window.NexusUltra && NexusUltra.openPdfLibraryModal) NexusUltra.openPdfLibraryModal(); else if(window.NexusChat) NexusChat.openChatRoom('notes_lib', '📚 PDF Study Vault', 'Notes, Books & PYQs');">
                <div class="nx-card-glow-beam" style="--beam-color:#38bdf8;"></div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="width:36px; height:36px; border-radius:11px; background:rgba(56,189,248,0.18); border:1px solid #38bdf8; display:flex; align-items:center; justify-content:center; font-size:18px;">📚</div>
                    <span style="background:rgba(56,189,248,0.2); color:#38bdf8; font-size:10px; font-weight:900; padding:2px 7px; border-radius:99px;">Free PDFs</span>
                </div>
                <div style="margin-top:8px;">
                    <div style="font-size:13.5px; font-weight:900; color:#f8fafc;">PDF Study Vault</div>
                    <div style="font-size:10.5px; color:#38bdf8; margin-top:2px; font-weight:700;">Notes, Books &amp; PYQs →</div>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // 4. 🔔 0.01s NOTIFICATIONS & ➕ EMOJI REACTIONS / DELETE MENU
    // =========================================================================
    function playChime() {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            const ctx = new Ctx(), o = ctx.createOscillator(), g = ctx.createGain();
            o.frequency.setValueAtTime(659.25, ctx.currentTime);
            o.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
            g.gain.setValueAtTime(0.15, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            o.connect(g); g.connect(ctx.destination);
            o.start(); o.stop(ctx.currentTime + 0.35);
            if (navigator.vibrate) navigator.vibrate([140, 70, 140]);
        } catch (e) {}
    }

    function showBanner(icon, title, sub, fn) {
        playChime();
        let bar = document.getElementById('nx-top-push-banner');
        if (!bar) { bar = document.createElement('div'); bar.id = 'nx-top-push-banner'; document.body.appendChild(bar); }
        bar.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
                <div style="width:38px; height:38px; border-radius:12px; background:linear-gradient(135deg,#10b981,#2563eb); color:#fff; display:flex; align-items:center; justify-content:center; font-size:19px; flex-shrink:0;">${icon}</div>
                <div style="min-width:0; flex:1;">
                    <div style="font-size:13px; font-weight:900; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${title}</div>
                    <div style="font-size:11.5px; color:#6ee7b7; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${sub}</div>
                </div>
            </div>
            <span style="background:#10b981; color:#020617; padding:5px 10px; border-radius:8px; font-size:11px; font-weight:900;">Open →</span>
        `;
        bar.onclick = () => { bar.classList.remove('show'); if (fn) fn(); };
        bar.classList.add('show');
        clearTimeout(bar.__t);
        bar.__t = setTimeout(() => bar.classList.remove('show'), 5000);
    }

    function startNotificationWatchers() {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        if (!me || !me.username || !Nexus.db) return;
        let myU = me.username.toLowerCase().trim();

        if (!dmUnsub) {
            dmUnsub = Nexus.db.collection("nexus_private_dms")
                .orderBy("createdAt", "desc")
                .limit(65)
                .onSnapshot(snap => {
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
                                let txt = m.text || '📷 Sent media';
                                showBanner('💬', `New Message from ${m.fromName || '@' + m.fromUser}`, txt.substring(0, 45), () => {
                                    if (window.NexusDM) NexusDM.openDirectChat(m.fromUser, m.fromName || m.fromUser, '');
                                });
                            }
                        }
                        if (tU === myU && !m.seen && !m.deleted) totalUnreadDms++;
                    });
                    initialDmLoaded = true;
                    renderFourGlowingCards();
                }, () => {});
        }
    }

    function getHiddenSet() {
        let me = Nexus.getCurrentUser();
        let u = me && me.username ? me.username.toLowerCase().trim() : 'guest';
        try { return new Set(JSON.parse(localStorage.getItem('nexus_dm_hidden_for_me_v1_' + encodeURIComponent(u)) || '[]')); } catch (e) { return new Set(); }
    }

    function installDmMessageMenu() {
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
    }

    // =========================================================================
    // 5. PUBLIC API ON WINDOW.NEXUSCORE
    // =========================================================================
    window.NexusCore = Object.assign(window.NexusCore || {}, {
        refreshProfileButtons: function() {
            const row = document.getElementById('nx-guaranteed-profile-action-row');
            if (row) row.removeAttribute('data-rendered-user');
            enforceFollowAndMessageOnProfileModal();
        },

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
                            <div style="font-size:10px; color:#10b981; font-weight:700;">challengers-live.netlify.app</div>
                        </div>
                    </div>
                    <button type="button" onclick="document.getElementById('nx-challenger-inapp-portal').style.display='none'" class="nx-tw-pill" style="background:#ef4444; border:none; color:white;">Close ✕</button>
                </div>
                <iframe src="${challengerSiteUrl}" style="flex:1; width:100%; border:none; background:#090d16;" allow="fullscreen; clipboard-write"></iframe>
            `;
            portal.style.display = 'flex';
        },

        execGlobalSearch: function(rawQuery) {
            const resBox = document.getElementById('nx-global-search-results');
            if (!resBox) return;
            let q = (rawQuery || '').toLowerCase().trim().replace(/^@/, '');

            let users = (Nexus.users || []).filter(u =>
                u && u.username && u.username !== 'nexus_official' && (
                    !q || u.username.toLowerCase().includes(q) || (u.name && u.name.toLowerCase().includes(q)) || (u.bio && u.bio.toLowerCase().includes(q))
                )
            ).slice(0, 12);

            let posts = (Nexus.posts || []).filter(p =>
                p && p.id && (
                    !q || (p.text && p.text.toLowerCase().includes(q)) || (p.author && p.author.toLowerCase().includes(q)) || (p.username && p.username.toLowerCase().includes(q))
                )
            ).slice(0, 10);

            let uHTML = users.map(u => {
                let safeU = u.username.replace(/'/g, "\\'");
                let safeN = (u.name || u.username).replace(/'/g, "\\'");
                let ch = (u.name || u.username || 'U').charAt(0).toUpperCase();
                return `
                    <div style="display:flex; align-items:center; justify-content:space-between; padding:9px 11px; background:#161f33; border:1px solid #1e293b; border-radius:12px;">
                        <div onclick="document.getElementById('nx-global-modal').style.display='none'; Nexus.openPublicProfile('${safeU}');" style="display:flex; align-items:center; gap:10px; flex:1; cursor:pointer;">
                            <div style="width:36px; height:36px; border-radius:50%; background:#2563eb; color:white; display:flex; align-items:center; justify-content:center; font-weight:800; overflow:hidden;">
                                ${u.dp ? `<img src="${u.dp}" style="width:100%; height:100%; object-fit:cover;">` : ch}
                            </div>
                            <div>
                                <div style="font-size:13.5px; font-weight:800; color:#f8fafc;">${u.name || u.username}</div>
                                <div style="font-size:11px; color:#38bdf8;">@${u.username} • ${u.bio || 'Student'}</div>
                            </div>
                        </div>
                        <div style="display:flex; gap:6px;">
                            <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'; Nexus.openPublicProfile('${safeU}');" style="background:#1e293b; border:1px solid #38bdf8; color:#38bdf8; padding:5px 9px; border-radius:8px; font-size:11px; font-weight:800; cursor:pointer;">👤 Profile</button>
                            <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusDM) NexusDM.openDirectChat('${safeU}', '${safeN}', '');" style="background:#10b981; border:none; color:#020617; padding:5px 9px; border-radius:8px; font-size:11px; font-weight:900; cursor:pointer;">💬 Chat</button>
                        </div>
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
                ${uHTML ? `<div style="font-size:11px; color:#94a3b8; font-weight:800;">👤 MEMBERS (${users.length})</div>${uHTML}` : ''}
                ${pHTML ? `<div style="font-size:11px; color:#94a3b8; font-weight:800; margin-top:6px;">📝 POSTS (${posts.length})</div>${pHTML}` : ''}
                ${(!uHTML && !pHTML) ? `<div style="text-align:center; padding:18px; color:#64748b; font-size:13px;">No results found for "${rawQuery}"</div>` : ''}
            `;
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

    function runCoreMasterLoop() {
        if (isTyping) return;
        loadAllModularFiles();
        hookPublicProfileOpen();
        enforceFollowAndMessageOnProfileModal();
        installWorkingGlobalSearch();
        removeDuplicateBottomCards();
        renderFourGlowingCards();
        startNotificationWatchers();
        installDmMessageMenu();
    }

    document.addEventListener('DOMContentLoaded', () => {
        runCoreMasterLoop();
        setInterval(runCoreMasterLoop, 600);
    });
    setTimeout(runCoreMasterLoop, 80);
})(); // === END OF CORE.JS ===
