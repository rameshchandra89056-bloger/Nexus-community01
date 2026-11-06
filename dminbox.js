// ================= DMINBOX.JS (v2.0 STRUCTURED 2x2 50%-50% COMMUNITY GRID & DEDICATED FULL-SCREEN 1:1 DM HUB): 📐 ROW-1: [💬 1:1 PERSONAL DM 50%] + [🤖 PRIVATE AI STUDIO 50%] | ROW-2: [📝 LIVE TEST SERIES 50% WITH SMOOTH ANIMATED BEAM] + [📚 PDF STUDY VAULT 50%] + 👉 SMOOTH HORIZONTAL SCROLLING ONLINE FRIENDS & FILTERS =================

(function() {
    let activeInboxFilter = 'all';
    let searchFriendQuery = '';
    let pinnedFriends = [];
    try { pinnedFriends = JSON.parse(localStorage.getItem('nx_pinned_dm_friends_v2') || '[]'); } catch (e) { pinnedFriends = []; }
    let dmSummaryMap = {};
    let totalUnreadDms = 0;
    let inboxWatchUnsub = null;

    const st = document.createElement('style');
    st.innerHTML = `
        /* Hide old stacked messy cards inside #nx-dm-inbox-banner so ONLY our clean 2x2 50%-50% grid shows! */
        #nx-dm-inbox-banner > *:not(#nx-structured-4card-grid) {
            display: none !important;
        }
        #nx-structured-4card-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 10px !important;
            width: 100% !important;
            margin-bottom: 6px !important;
        }
        .nx-grid-half-card {
            position: relative;
            background: linear-gradient(145deg, #111827 0%, #090d16 100%);
            border: 1.5px solid #1e293b;
            border-radius: 18px;
            padding: 13px 12px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 112px;
            cursor: pointer;
            overflow: hidden;
            transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease;
            box-shadow: 0 8px 22px rgba(0,0,0,0.55);
        }
        .nx-grid-half-card:active {
            transform: scale(0.96);
        }
        /* Ultra-Light Smooth Animated Running Line on Top of Challenger Live Test Card */
        @keyframes nxSmoothBeamRun {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
        }
        .nx-test-animated-line {
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 3px;
            background: rgba(245, 158, 11, 0.15);
            overflow: hidden;
        }
        .nx-test-animated-line::after {
            content: '';
            position: absolute;
            top: 0; left: 0;
            width: 55%; height: 100%;
            background: linear-gradient(90deg, transparent, #fde047, #10b981, transparent);
            animation: nxSmoothBeamRun 2.4s linear infinite;
            will-change: transform;
        }

        /* Dedicated Full-Screen 1:1 DM Home Screen Modal */
        #nx-dedicated-dm-home-screen {
            position: fixed; inset: 0; width: 100%; max-width: 640px; height: 100dvh;
            margin: 0 auto; background: #090d16; z-index: 100080;
            display: none; flex-direction: column; overflow: hidden;
        }
        /* Smooth Right-Side Horizontal Scroll for Online Friends & Filter Chips */
        .nx-horiz-scroll-bar {
            display: flex !important;
            flex-wrap: nowrap !important;
            gap: 10px;
            overflow-x: auto !important;
            overflow-y: hidden !important;
            -webkit-overflow-scrolling: touch !important;
            touch-action: pan-x !important;
            scrollbar-width: none;
            padding: 6px 12px 10px;
        }
        .nx-horiz-scroll-bar::-webkit-scrollbar { display: none; }

        .nx-dm-filter-pill {
            flex-shrink: 0 !important;
            padding: 7px 14px; border-radius: 999px; font-size: 11.5px; font-weight: 800;
            border: 1px solid #334155; background: #161f33; color: #94a3b8;
            cursor: pointer; transition: all 0.18s ease; white-space: nowrap;
        }
        .nx-dm-filter-pill.active {
            background: linear-gradient(135deg, #10b981, #059669);
            color: #020617; border-color: #10b981;
        }
        .nx-dm-user-row {
            display: flex; align-items: center; justify-content: space-between;
            padding: 11px 13px; background: #111827; border: 1px solid #1e293b;
            border-radius: 16px; margin-bottom: 8px; cursor: pointer;
            transition: transform 0.15s ease, background 0.18s ease;
        }
        .nx-dm-user-row:active { transform: scale(0.98); background: #1e293b; }
        .nx-online-badge-dot {
            position: absolute; bottom: 0; right: 0; width: 12px; height: 12px;
            border-radius: 50%; background: #10b981; border: 2px solid #090d16;
        }
        .nx-viewonce-card {
            background: linear-gradient(135deg, #31102f, #0f172a);
            border: 1.5px dashed #f43f5e; border-radius: 14px; padding: 10px 13px;
            margin: 4px 0; min-width: 210px; cursor: pointer;
        }
    `;
    document.head.appendChild(st);

    function startDmInboxWatcher() {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        if (!me || !me.username || !Nexus.db || inboxWatchUnsub) return;
        let myU = me.username.toLowerCase().trim();

        inboxWatchUnsub = Nexus.db.collection("nexus_private_dms")
            .orderBy("createdAt", "desc")
            .limit(90)
            .onSnapshot(snap => {
                dmSummaryMap = {};
                totalUnreadDms = 0;
                snap.forEach(doc => {
                    let m = doc.data();
                    if (!m) return;
                    let fU = String(m.fromUser || '').toLowerCase().trim();
                    let tU = String(m.toUser || '').toLowerCase().trim();
                    if (fU !== myU && tU !== myU) return;

                    let partnerU = fU === myU ? tU : fU;
                    if (!partnerU) return;

                    if (!dmSummaryMap[partnerU]) {
                        let preview = m.deleted ? '🚫 Message deleted'
                                    : ((m.text || '').startsWith('🔥VIEWONCE|') ? '🔥 1-Time Secret Message'
                                    : ((m.text || '').startsWith('🎵VOICE|') ? '🎤 Voice Note'
                                    : (m.text || '📷 Photo / Media')));
                        dmSummaryMap[partnerU] = {
                            lastText: preview,
                            lastTime: m.createdAt || 0,
                            unreadCount: 0
                        };
                    }
                    if (tU === myU && !m.seen && !m.deleted) {
                        dmSummaryMap[partnerU].unreadCount = (dmSummaryMap[partnerU].unreadCount || 0) + 1;
                        totalUnreadDms++;
                    }
                });
                renderStructuredFourCardGrid();
                const dmHome = document.getElementById('nx-dedicated-dm-home-screen');
                if (dmHome && dmHome.style.display === 'flex') {
                    renderFullScreenDmHubList();
                }
            }, () => {});
    }

    function formatShortTime(ts) {
        if (!ts) return '';
        let sec = Math.floor((Date.now() - ts) / 1000);
        if (sec < 60) return 'Now';
        if (sec < 3600) return Math.floor(sec / 60) + 'm';
        if (sec < 86400) return Math.floor(sec / 3600) + 'h';
        return Math.floor(sec / 86400) + 'd';
    }

    // =========================================================================
    // 1. 📐 RENDER CLEAN 2x2 EQUAL (50% - 50%) CARDS ON COMMUNITY SCREEN
    // Row 1: [💬 1:1 Personal DM (50%)] + [🤖 Private AI Studio (50%)]
    // Row 2: [📝 Challenger Live Test (50% + Animated Beam)] + [📚 PDF Study Vault (50%)]
    // =========================================================================
    function renderStructuredFourCardGrid() {
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
            <!-- CARD 1 (50% Width): 1:1 Personal DM Hub -->
            <div class="nx-grid-half-card" style="border-color:rgba(16,185,129,0.5);" onclick="NexusDmInbox.openFullScreenDmHub()">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="width:36px; height:36px; border-radius:11px; background:rgba(16,185,129,0.18); border:1px solid #10b981; display:flex; align-items:center; justify-content:center; font-size:18px;">💬</div>
                    <span style="background:rgba(16,185,129,0.2); color:#10b981; font-size:10px; font-weight:900; padding:2px 7px; border-radius:99px;">
                        ${totalUnreadDms > 0 ? `${totalUnreadDms} New` : `${onlineCount} Live`}
                    </span>
                </div>
                <div style="margin-top:8px;">
                    <div style="font-size:13.5px; font-weight:900; color:#f8fafc; line-height:1.25;">1:1 Personal DM</div>
                    <div style="font-size:10.5px; color:#6ee7b7; margin-top:2px; font-weight:700;">${allUsers.length} Friends • Calls &amp; DJ →</div>
                </div>
            </div>

            <!-- CARD 2 (50% Width): 1:1 Private AI Studio -->
            <div class="nx-grid-half-card" style="border-color:rgba(167,139,250,0.5);" onclick="if(window.NexusAI) NexusAI.openStudio(); else if(window.NexusCore) NexusCore.openAiStudio();">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="width:36px; height:36px; border-radius:11px; background:rgba(139,92,246,0.2); border:1px solid #a78bfa; display:flex; align-items:center; justify-content:center; font-size:18px;">🤖</div>
                    <span style="background:rgba(167,139,250,0.2); color:#d8b4fe; font-size:10px; font-weight:900; padding:2px 7px; border-radius:99px;">11 Servers</span>
                </div>
                <div style="margin-top:8px;">
                    <div style="font-size:13.5px; font-weight:900; color:#f8fafc; line-height:1.25;">Private AI Studio</div>
                    <div style="font-size:10.5px; color:#d8b4fe; margin-top:2px; font-weight:700;">🔊 Swara • 🎨 Image Gen →</div>
                </div>
            </div>

            <!-- CARD 3 (50% Width): Challenger Live Test Series (With Smooth Animated Top Line!) -->
            <div class="nx-grid-half-card" style="border-color:rgba(245,158,11,0.45);" onclick="NexusDmInbox.openChallengerLiveTest()">
                <div class="nx-test-animated-line"></div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="width:36px; height:36px; border-radius:11px; background:rgba(245,158,11,0.18); border:1px solid #f59e0b; display:flex; align-items:center; justify-content:center; font-size:18px;">📝</div>
                    <span style="background:rgba(245,158,11,0.2); color:#fde047; font-size:10px; font-weight:900; padding:2px 7px; border-radius:99px;">🔥 Challenger</span>
                </div>
                <div style="margin-top:8px;">
                    <div style="font-size:13.5px; font-weight:900; color:#f8fafc; line-height:1.25;">Live Test Series</div>
                    <div style="font-size:10.5px; color:#fde047; margin-top:2px; font-weight:700;">JEE / NEET Mock Arena →</div>
                </div>
            </div>

            <!-- CARD 4 (50% Width): PDF Study Vault -->
            <div class="nx-grid-half-card" style="border-color:rgba(56,189,248,0.45);" onclick="NexusDmInbox.openPdfStudyVault()">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="width:36px; height:36px; border-radius:11px; background:rgba(56,189,248,0.18); border:1px solid #38bdf8; display:flex; align-items:center; justify-content:center; font-size:18px;">📚</div>
                    <span style="background:rgba(56,189,248,0.2); color:#38bdf8; font-size:10px; font-weight:900; padding:2px 7px; border-radius:99px;">Free PDFs</span>
                </div>
                <div style="margin-top:8px;">
                    <div style="font-size:13.5px; font-weight:900; color:#f8fafc; line-height:1.25;">PDF Study Vault</div>
                    <div style="font-size:10.5px; color:#38bdf8; margin-top:2px; font-weight:700;">Notes, Books &amp; PYQs →</div>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // 2. 💬 DEDICATED FULL-SCREEN 1:1 DM HOME SCREEN (With Smooth Right-Scrolling Online Bar)
    // =========================================================================
    function renderFullScreenDmHubList() {
        let screen = document.getElementById('nx-dedicated-dm-home-screen');
        if (!screen) return;

        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let myU = me && me.username ? me.username.toLowerCase().trim() : '';

        let allUsers = (window.Nexus && Nexus.users || []).filter(u =>
            u && u.username && u.username.toLowerCase() !== myU && u.username !== 'nexus_official'
        );

        allUsers.sort((a, b) => {
            let kA = a.username.toLowerCase().trim();
            let kB = b.username.toLowerCase().trim();
            let pA = pinnedFriends.includes(kA) ? 1 : 0;
            let pB = pinnedFriends.includes(kB) ? 1 : 0;
            if (pA !== pB) return pB - pA;
            let tA = (dmSummaryMap[kA] && dmSummaryMap[kA].lastTime) || a.lastOnline || 0;
            let tB = (dmSummaryMap[kB] && dmSummaryMap[kB].lastTime) || b.lastOnline || 0;
            return tB - tA;
        });

        let onlineList = allUsers.filter(u => (Date.now() - (u.lastOnline || 0)) < 180000);

        let filtered = allUsers.filter(u => {
            let k = u.username.toLowerCase().trim();
            let n = (u.name || '').toLowerCase();
            if (searchFriendQuery && !k.includes(searchFriendQuery) && !n.includes(searchFriendQuery)) return false;
            if (activeInboxFilter === 'online') return (Date.now() - (u.lastOnline || 0)) < 180000;
            if (activeInboxFilter === 'pinned') return pinnedFriends.includes(k);
            return true;
        });

        const onlineBox = document.getElementById('nx-dmhub-online-strip');
        if (onlineBox) {
            onlineBox.innerHTML = allUsers.slice(0, 25).map(u => {
                let isOn = (Date.now() - (u.lastOnline || 0)) < 180000;
                let safeU = u.username.replace(/'/g, "\\'");
                let safeN = (u.name || u.username).replace(/'/g, "\\'");
                let ch = (u.name || u.username || 'U').charAt(0).toUpperCase();
                return `
                    <div onclick="NexusDmInbox.startChatFromHub('${safeU}', '${safeN}')" style="display:flex; flex-direction:column; align-items:center; gap:4px; min-width:58px; flex-shrink:0; cursor:pointer;">
                        <div style="position:relative; width:46px; height:46px; border-radius:50%; background:linear-gradient(135deg,#10b981,#2563eb); padding:2px;">
                            ${u.dp ? `<img src="${u.dp}" style="width:100%; height:100%; border-radius:50%; object-fit:cover; background:#090d16;">` : `<div style="width:100%; height:100%; border-radius:50%; background:#090d16; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:15px;">${ch}</div>`}
                            ${isOn ? `<span class="nx-online-badge-dot"></span>` : ''}
                        </div>
                        <span style="font-size:10px; font-weight:800; color:#e2e8f0; max-width:56px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${(u.name || u.username).split(' ')[0]}</span>
                    </div>
                `;
            }).join('');
        }

        const chipsBox = document.getElementById('nx-dmhub-filter-strip');
        if (chipsBox) {
            chipsBox.innerHTML = `
                <button type="button" class="nx-dm-filter-pill ${activeInboxFilter === 'all' ? 'active' : ''}" onclick="NexusDmInbox.setFilter('all')">💬 All Chats (${allUsers.length})</button>
                <button type="button" class="nx-dm-filter-pill ${activeInboxFilter === 'online' ? 'active' : ''}" onclick="NexusDmInbox.setFilter('online')">🟢 Online Now (${onlineList.length})</button>
                <button type="button" class="nx-dm-filter-pill ${activeInboxFilter === 'pinned' ? 'active' : ''}" onclick="NexusDmInbox.setFilter('pinned')">📌 Pinned (${pinnedFriends.length})</button>
                ${me ? `<button type="button" class="nx-dm-filter-pill" style="border-color:#38bdf8; color:#38bdf8;" onclick="NexusDmInbox.startChatFromHub('${me.username}', 'Saved Messages (Personal Cloud)')">🔖 Saved Cloud</button>` : ''}
            `;
        }

        const listBox = document.getElementById('nx-dmhub-rows-container');
        if (listBox) {
            listBox.innerHTML = filtered.map(u => {
                let k = u.username.toLowerCase().trim();
                let info = dmSummaryMap[k] || {};
                let isOn = (Date.now() - (u.lastOnline || 0)) < 180000;
                let isPin = pinnedFriends.includes(k);
                let safeU = u.username.replace(/'/g, "\\'");
                let safeN = (u.name || u.username).replace(/'/g, "\\'");
                let ch = (u.name || u.username || 'U').charAt(0).toUpperCase();

                return `
                    <div class="nx-dm-user-row" onclick="NexusDmInbox.startChatFromHub('${safeU}', '${safeN}')">
                        <div style="display:flex; align-items:center; gap:11px; min-width:0; flex:1;">
                            <div style="position:relative; width:44px; height:44px; border-radius:50%; background:#1e293b; flex-shrink:0;">
                                ${u.dp ? `<img src="${u.dp}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">` : `<div style="width:100%; height:100%; border-radius:50%; background:#2563eb; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:16px;">${ch}</div>`}
                                ${isOn ? `<span class="nx-online-badge-dot"></span>` : ''}
                            </div>
                            <div style="min-width:0; flex:1;">
                                <div style="display:flex; align-items:center; gap:5px;">
                                    <span style="font-size:14px; font-weight:900; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${u.name || u.username}</span>
                                    ${u.verified ? `<span style="font-size:11px;">✅</span>` : ''}
                                    ${isPin ? `<span style="font-size:11px;">📌</span>` : ''}
                                </div>
                                <div style="font-size:11.5px; color:${info.unreadCount ? '#10b981' : '#94a3b8'}; font-weight:${info.unreadCount ? '800' : '500'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                    ${(info.lastText || `👋 Tap to chat with @${u.username}`).replace(/</g, '&lt;')}
                                </div>
                            </div>
                        </div>
                        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:5px; flex-shrink:0;">
                            <span style="font-size:10px; color:#64748b; font-weight:700;">${formatShortTime(info.lastTime || u.lastOnline)}</span>
                            <div style="display:flex; align-items:center; gap:6px;">
                                ${info.unreadCount ? `<span style="background:#10b981; color:#020617; font-size:10px; font-weight:900; padding:2px 7px; border-radius:99px;">${info.unreadCount} new</span>` : ''}
                                <button type="button" onclick="event.stopPropagation(); NexusDmInbox.togglePin('${safeU}')" style="background:none; border:none; font-size:13px; cursor:pointer; opacity:${isPin ? '1' : '0.4'};">📌</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    function upgradeDmChatViewOnce() {
        const tray = document.getElementById('nx-dm-bottom-tray');
        if (tray && !tray.querySelector('.nx-viewonce-tray-btn')) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'nx-viewonce-tray-btn';
            btn.style.cssText = "background:#182229; border:1.5px solid #f43f5e; color:#fda4af; border-radius:12px; padding:8px 4px; font-size:11px; font-weight:800; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;";
            btn.innerHTML = `<span style="font-size:18px;">🔥</span><span>1-Time Secret</span>`;
            btn.onclick = () => { tray.style.display = 'none'; NexusDmInbox.sendViewOncePrompt(); };
            tray.appendChild(btn);
        }

        document.querySelectorAll('#nx-dm-msgs-box span').forEach(sp => {
            let raw = (sp.innerText || '').trim();
            if (raw.startsWith('🔥VIEWONCE|') && !sp.getAttribute('data-vo-parsed')) {
                sp.setAttribute('data-vo-parsed', '1');
                let b64 = raw.split('|')[1] || '';
                let rowEl = sp.closest('.nx-dm-bubble-anim');
                let msgId = rowEl ? (rowEl.getAttribute('data-message-id') || '') : '';
                sp.innerHTML = `
                    <div class="nx-viewonce-card" onclick="event.stopPropagation(); NexusDmInbox.openViewOnceModal('${msgId}', '${b64}')">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size:20px;">🔥</span>
                            <div>
                                <div style="font-size:12.5px; font-weight:900; color:#fda4af;">1-Time Secret Message</div>
                                <div style="font-size:10.5px; color:#cbd5e1;">Tap to view once (Self-destructs!)</div>
                            </div>
                        </div>
                    </div>
                `;
            }
        });
    }

    window.NexusDmInbox = {
        openFullScreenDmHub: function() {
            let screen = document.getElementById('nx-dedicated-dm-home-screen');
            if (!screen) {
                screen = document.createElement('div');
                screen.id = 'nx-dedicated-dm-home-screen';
                document.body.appendChild(screen);
            }

            screen.innerHTML = `
                <!-- Header -->
                <div style="height:56px; background:#0f172a; border-bottom:1.5px solid #10b981; display:flex; align-items:center; justify-content:space-between; padding:0 14px; flex-shrink:0;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <button type="button" onclick="NexusDmInbox.closeFullScreenDmHub()" style="background:none; border:none; color:#f8fafc; font-size:20px; cursor:pointer; padding:4px;">←</button>
                        <div>
                            <div style="font-size:15px; font-weight:900; color:#f8fafc;">💬 1:1 Direct Messages Hub</div>
                            <div style="font-size:10.5px; color:#10b981; font-weight:700;">Swipe friends right 👉 or tap to chat</div>
                        </div>
                    </div>
                    <button type="button" onclick="NexusDmInbox.closeFullScreenDmHub()" style="background:#1e293b; border:1px solid #334155; color:#cbd5e1; padding:5px 10px; border-radius:10px; font-size:11.5px; font-weight:800; cursor:pointer;">Close ✕</button>
                </div>

                <!-- Search Bar -->
                <div style="padding:10px 12px 4px; background:#090d16; flex-shrink:0;">
                    <input type="text" placeholder="🔍 Search friend name or @username..." oninput="NexusDmInbox.searchFriends(this.value)" style="width:100%; padding:10px 14px; border-radius:12px; border:1px solid #334155; background:#111827; color:white; font-size:13px; outline:none;">
                </div>

                <!-- Smooth Right-Scrolling Active Friends Carousel -->
                <div id="nx-dmhub-online-strip" class="nx-horiz-scroll-bar" style="border-bottom:1px solid #1e293b; flex-shrink:0;"></div>

                <!-- Smooth Right-Scrolling Filter Tabs -->
                <div id="nx-dmhub-filter-strip" class="nx-horiz-scroll-bar" style="padding-top:8px; padding-bottom:8px; flex-shrink:0;"></div>

                <!-- Vertical Scrollable Friends Chat List -->
                <div id="nx-dmhub-rows-container" style="flex:1; overflow-y:auto; padding:6px 12px 24px;"></div>
            `;
            screen.style.display = 'flex';
            searchFriendQuery = '';
            renderFullScreenDmHubList();
        },

        closeFullScreenDmHub: function() {
            const screen = document.getElementById('nx-dedicated-dm-home-screen');
            if (screen) screen.style.display = 'none';
        },

        startChatFromHub: function(username, name) {
            this.closeFullScreenDmHub();
            if (window.NexusDM) NexusDM.openDirectChat(username, name, '');
        },

        searchFriends: function(q) {
            searchFriendQuery = (q || '').toLowerCase().trim();
            renderFullScreenDmHubList();
        },

        setFilter: function(f) {
            activeInboxFilter = f;
            renderFullScreenDmHubList();
        },

        togglePin: function(username) {
            let k = String(username || '').toLowerCase().trim();
            if (!k) return;
            if (pinnedFriends.includes(k)) pinnedFriends = pinnedFriends.filter(x => x !== k);
            else pinnedFriends.push(k);
            try { localStorage.setItem('nx_pinned_dm_friends_v2', JSON.stringify(pinnedFriends)); } catch (e) {}
            renderFullScreenDmHubList();
        },

        openChallengerLiveTest: function() {
            if (window.NexusAdvance && NexusAdvance.openPartnerTestModal) return NexusAdvance.openPartnerTestModal();
            if (window.NexusUltra && NexusUltra.openLiveTestModal) return NexusUltra.openLiveTestModal();
            if (window.NexusChat) NexusChat.openChatRoom('jee_pcm', '📝 Challenger Live Test Arena', 'JEE/NEET Mock Tests');
        },

        openPdfStudyVault: function() {
            if (window.NexusUltra && NexusUltra.openPdfLibraryModal) return NexusUltra.openPdfLibraryModal();
            if (window.NexusPro && NexusPro.openPdfVault) return NexusPro.openPdfVault();
            if (window.NexusChat) NexusChat.openChatRoom('notes_lib', '📚 PDF Study Vault', 'Notes & Books');
        },

        sendViewOncePrompt: function() {
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;
            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid #f43f5e; background:#090d16; padding:16px; max-width:380px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <strong style="color:#fda4af; font-size:15px;">🔥 Send 1-Time Secret Message</strong>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>
                    <textarea id="nx-vo-secret-in" rows="3" placeholder="Write secret message..." style="width:100%; padding:10px; border-radius:12px; border:1px solid #f43f5e; background:#111827; color:white; font-size:13.5px; outline:none; margin-bottom:10px;"></textarea>
                    <button type="button" onclick="NexusDmInbox.confirmSendViewOnce()" style="width:100%; background:linear-gradient(135deg,#f43f5e,#e11d48); color:white; border:none; padding:11px; border-radius:12px; font-weight:900; font-size:13.5px; cursor:pointer;">🔥 Send View-Once Secret</button>
                </div>
            `;
            modal.style.display = 'flex';
        },

        confirmSendViewOnce: function() {
            const inp = document.getElementById('nx-vo-secret-in');
            const modal = document.getElementById('nx-global-modal');
            if (!inp || !inp.value.trim()) return;
            let secretText = inp.value.trim();
            if (modal) modal.style.display = 'none';
            let b64 = btoa(unescape(encodeURIComponent(secretText)));
            const dmInp = document.getElementById('nx-dm-input');
            if (dmInp && window.NexusDM) {
                dmInp.value = `🔥VIEWONCE|${b64}`;
                NexusDM.sendDM();
                Nexus.toast("🔥 1-Time Secret Sent!");
            }
        },

        openViewOnceModal: function(msgId, b64) {
            let secret = '';
            try { secret = decodeURIComponent(escape(atob(b64))); } catch (e) { secret = 'Expired'; }
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;
            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid #f43f5e; background:#090d16; padding:18px; text-align:center; max-width:375px;">
                    <div style="font-size:32px; margin-bottom:6px;">🔥</div>
                    <h3 style="color:#fda4af; font-size:16px; margin-bottom:10px;">1-Time Secret Message</h3>
                    <div style="background:#161f33; border:1px dashed #f43f5e; padding:14px; border-radius:12px; color:#f8fafc; font-size:14.5px; font-weight:700; margin-bottom:14px; word-break:break-word;">${secret.replace(/</g, '&lt;')}</div>
                    <button type="button" onclick="NexusDmInbox.destroyViewOnce('${msgId}')" style="width:100%; background:#ef4444; color:white; border:none; padding:11px; border-radius:12px; font-weight:900; cursor:pointer;">💨 Close &amp; Self-Destruct</button>
                </div>
            `;
            modal.style.display = 'flex';
        },

        destroyViewOnce: async function(msgId) {
            const modal = document.getElementById('nx-global-modal');
            if (modal) modal.style.display = 'none';
            if (msgId && Nexus.db) {
                let me = Nexus.getCurrentUser();
                await Nexus.db.collection("nexus_private_dms").doc(msgId).set({
                    deleted: true, deletedBy: me ? me.username : 'viewer',
                    deletedByName: '🔥 1-Time Secret Opened & Self-Destructed', text: ''
                }, { merge: true }).catch(() => {});
            }
            if (window.Nexus) Nexus.toast("💨 Secret self-destructed!");
        }
    };

    function loopDmStructuredUI() {
        startDmInboxWatcher();
        renderStructuredFourCardGrid();
        upgradeDmChatViewOnce();
    }

    setInterval(loopDmStructuredUI, 1000);
    setTimeout(loopDmStructuredUI, 150);
})(); // === END OF DMINBOX.JS ===
