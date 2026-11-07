// ================= DMINBOX.JS (v3.0 ZERO-OVERLAP CLEAN MODULE): 💬 HANDLES ONLY THE FULL-SCREEN 1:1 DM FRIENDS HUB (ALL OVERLAPPING 4-CARD GRID, ANIMATION, jee_pcm & notes_lib CODE COMPLETELY REMOVED!) =================

(function() {
    let activeInboxFilter = 'all';
    let searchFriendQuery = '';
    let pinnedFriends = [];
    try { pinnedFriends = JSON.parse(localStorage.getItem('nx_pinned_dm_friends_v3') || '[]'); } catch (e) { pinnedFriends = []; }
    let dmSummaryMap = {};
    let totalUnreadDms = 0;
    let inboxWatchUnsub = null;

    if (!document.getElementById('nx-dminbox-clean-style-v3')) {
        const st = document.createElement('style');
        st.id = 'nx-dminbox-clean-style-v3';
        st.innerHTML = `
            #nx-dedicated-dm-home-screen {
                position: fixed; inset: 0; width: 100%; max-width: 640px; height: 100dvh;
                margin: 0 auto; background: #090d16; z-index: 100280;
                display: none; flex-direction: column; overflow: hidden;
            }
            .nx-horiz-scroll-bar {
                display: flex !important; flex-wrap: nowrap !important; gap: 10px;
                overflow-x: auto !important; overflow-y: hidden !important;
                -webkit-overflow-scrolling: touch !important; touch-action: pan-x !important;
                scrollbar-width: none; padding: 6px 12px 10px;
            }
            .nx-horiz-scroll-bar::-webkit-scrollbar { display: none; }
            .nx-dm-filter-pill {
                flex-shrink: 0 !important; padding: 7px 14px; border-radius: 999px;
                font-size: 11.5px; font-weight: 800; border: 1px solid #334155;
                background: #161f33; color: #94a3b8; cursor: pointer; white-space: nowrap;
            }
            .nx-dm-filter-pill.active {
                background: #10b981; color: #020617; border-color: #10b981;
            }
            .nx-dm-user-row {
                display: flex; align-items: center; justify-content: space-between;
                padding: 11px 13px; background: #111827; border: 1px solid #1e293b;
                border-radius: 16px; margin-bottom: 8px; cursor: pointer;
            }
            .nx-online-badge-dot {
                position: absolute; bottom: 0; right: 0; width: 12px; height: 12px;
                border-radius: 50%; background: #10b981; border: 2px solid #090d16;
            }
        `;
        document.head.appendChild(st);
    }

    function startDmSummaryListener() {
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
                                    : (m.audioData ? '🎤 Voice Note'
                                    : (m.imgUrl ? '📸 Photo' : (m.text || '📷 Media')));
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
                window.__nxTotalUnreadDms = totalUnreadDms;
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
            onlineBox.innerHTML = allUsers.slice(0, 30).map(u => {
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

    window.NexusDmInbox = {
        openFullScreenDmHub: function() {
            let screen = document.getElementById('nx-dedicated-dm-home-screen');
            if (!screen) {
                screen = document.createElement('div');
                screen.id = 'nx-dedicated-dm-home-screen';
                document.body.appendChild(screen);
            }
            screen.innerHTML = `
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
                <div style="padding:10px 12px 4px; background:#090d16; flex-shrink:0;">
                    <input type="text" placeholder="🔍 Search friend name or @username..." oninput="NexusDmInbox.searchFriends(this.value)" style="width:100%; padding:10px 14px; border-radius:12px; border:1px solid #334155; background:#111827; color:white; font-size:13px; outline:none;">
                </div>
                <div id="nx-dmhub-online-strip" class="nx-horiz-scroll-bar" style="border-bottom:1px solid #1e293b; flex-shrink:0;"></div>
                <div id="nx-dmhub-filter-strip" class="nx-horiz-scroll-bar" style="padding-top:8px; padding-bottom:8px; flex-shrink:0;"></div>
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
            try { localStorage.setItem('nx_pinned_dm_friends_v3', JSON.stringify(pinnedFriends)); } catch (e) {}
            renderFullScreenDmHubList();
        },
        // Redirect legacy calls to NexusCards so jee_pcm and notes_lib NEVER open!
        openChallengerLiveTest: function() {
            if (window.NexusCards) NexusCards.openChallengerApp();
        },
        openPdfStudyVault: function() {
            if (window.NexusCards) NexusCards.openPdfVaultApp();
        }
    };

    startDmSummaryListener();
})(); // === END OF DMINBOX.JS ===
