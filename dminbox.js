// ================= DMINBOX.JS (DEDICATED TAILWIND CSS 1:1 DM HOME SCREEN & SECRET VIEW-ONCE MODULE): 💬 WHATSAPP/INSTAGRAM PRO DM INBOX + 🟢 LIVE ONLINE FRIENDS CAROUSEL + 📌 PINNED CHATS & UNREAD BADGES + 🔥 1-TIME VIEW-ONCE SELF-DESTRUCT MESSAGES =================

(function() {
    let activeInboxFilter = 'all'; // 'all' | 'online' | 'pinned'
    let pinnedFriends = [];
    try { pinnedFriends = JSON.parse(localStorage.getItem('nx_pinned_dm_friends_v1') || '[]'); } catch (e) { pinnedFriends = []; }
    let dmSummaryMap = {};
    let inboxWatchUnsub = null;

    const dmInboxStyle = document.createElement('style');
    dmInboxStyle.innerHTML = `
        @keyframes nxPulseGreen {
            0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            50% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
        }
        #nx-pro-dm-home-card {
            background: linear-gradient(145deg, #0f172a 0%, #090d16 100%);
            border: 1.5px solid #1e293b; border-radius: 20px; padding: 14px;
            margin-bottom: 14px; box-shadow: 0 12px 32px rgba(0,0,0,0.65);
        }
        .nx-dm-filter-chip {
            padding: 6px 13px; border-radius: 999px; font-size: 11.5px; font-weight: 800;
            border: 1px solid #334155; background: #161f33; color: #94a3b8;
            cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); white-space: nowrap;
        }
        .nx-dm-filter-chip.active {
            background: linear-gradient(135deg, #10b981, #059669);
            color: #020617; border-color: #10b981; transform: scale(1.03);
        }
        .nx-dm-friend-row {
            display: flex; align-items: center; justify-content: space-between;
            padding: 10px 12px; background: rgba(22, 31, 51, 0.85);
            border: 1px solid #1e293b; border-radius: 16px; margin-bottom: 8px;
            cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nx-dm-friend-row:active { transform: scale(0.97); background: #1e293b; }
        .nx-online-dot-ring {
            position: absolute; bottom: 0; right: 0; width: 12px; height: 12px;
            border-radius: 50%; background: #10b981; border: 2px solid #090d16;
            animation: nxPulseGreen 2s infinite;
        }
        /* View-Once Secret Bomb Card in 1:1 Chat */
        .nx-viewonce-card {
            background: linear-gradient(135deg, #31102f, #0f172a);
            border: 1.5px dashed #f43f5e; border-radius: 14px; padding: 10px 13px;
            margin: 4px 0; min-width: 210px; cursor: pointer;
            transition: transform 0.18s ease;
        }
        .nx-viewonce-card:active { transform: scale(0.95); }
    `;
    document.head.appendChild(dmInboxStyle);

    function startDmInboxRealtimeListener() {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        if (!me || !me.username || !Nexus.db || inboxWatchUnsub) return;
        let myU = me.username.toLowerCase().trim();

        inboxWatchUnsub = Nexus.db.collection("nexus_private_dms")
            .orderBy("createdAt", "desc")
            .limit(80)
            .onSnapshot(snap => {
                dmSummaryMap = {};
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
                                    : ((m.text || '').startsWith('🔥VIEWONCE|') ? '🔥 Secret View-Once Message'
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
                    }
                });
                renderProDmHomeScreen();
            }, () => {});
    }

    function formatShortAgo(ts) {
        if (!ts) return '';
        let sec = Math.floor((Date.now() - ts) / 1000);
        if (sec < 60) return 'Just now';
        if (sec < 3600) return Math.floor(sec / 60) + 'm';
        if (sec < 86400) return Math.floor(sec / 3600) + 'h';
        return Math.floor(sec / 86400) + 'd';
    }

    function renderProDmHomeScreen() {
        const banner = document.getElementById('nx-dm-inbox-banner');
        if (!banner) return;

        let proCard = document.getElementById('nx-pro-dm-home-card');
        if (!proCard) {
            proCard = document.createElement('div');
            proCard.id = 'nx-pro-dm-home-card';
            banner.insertBefore(proCard, banner.firstChild);
        }

        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let myU = me && me.username ? me.username.toLowerCase().trim() : '';

        let allUsers = (window.Nexus && Nexus.users || []).filter(u =>
            u && u.username && u.username.toLowerCase() !== myU && u.username !== 'nexus_official'
        );

        // Sort by recent DM activity first, then online status
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

        let onlineUsers = allUsers.filter(u => (Date.now() - (u.lastOnline || 0)) < 180000);

        let filteredUsers = allUsers.filter(u => {
            let k = u.username.toLowerCase().trim();
            if (activeInboxFilter === 'online') return (Date.now() - (u.lastOnline || 0)) < 180000;
            if (activeInboxFilter === 'pinned') return pinnedFriends.includes(k);
            return true;
        }).slice(0, 12);

        proCard.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div>
                    <div style="font-size:15px; font-weight:900; color:#f8fafc; display:flex; align-items:center; gap:6px;">
                        <span>💬 1:1 Direct Messages</span>
                        <span style="background:rgba(16,185,129,0.18); color:#10b981; border:1px solid #10b981; padding:1px 7px; border-radius:99px; font-size:10.5px;">${onlineUsers.length} Online</span>
                    </div>
                    <div style="font-size:11px; color:#94a3b8;">Tap any friend for instant 1:1 chat, Voice Note or View-Once</div>
                </div>
                ${me ? `<button type="button" onclick="NexusDM.openDirectChat('${me.username}', 'Saved Messages (Personal Cloud)', '')" style="background:#1e293b; border:1px solid #38bdf8; color:#38bdf8; padding:5px 10px; border-radius:10px; font-size:11px; font-weight:800; cursor:pointer;">🔖 Saved</button>` : ''}
            </div>

            <!-- Horizontal Active Online Friends Carousel -->
            <div style="display:flex; gap:10px; overflow-x:auto; padding:4px 2px 10px; scrollbar-width:none; border-bottom:1px solid #1e293b; margin-bottom:10px;">
                ${allUsers.slice(0, 10).map(u => {
                    let isOn = (Date.now() - (u.lastOnline || 0)) < 180000;
                    let safeU = u.username.replace(/'/g, "\\'");
                    let safeN = (u.name || u.username).replace(/'/g, "\\'");
                    let ch = (u.name || u.username || 'U').charAt(0).toUpperCase();
                    return `
                        <div onclick="NexusDM.openDirectChat('${safeU}', '${safeN}', '')" style="display:flex; flex-direction:column; align-items:center; gap:4px; min-width:56px; cursor:pointer;">
                            <div style="position:relative; width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg,#2563eb,#10b981); padding:2px;">
                                ${u.dp ? `<img src="${u.dp}" style="width:100%; height:100%; border-radius:50%; object-fit:cover; background:#090d16;">` : `<div style="width:100%; height:100%; border-radius:50%; background:#090d16; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:15px;">${ch}</div>`}
                                ${isOn ? `<span class="nx-online-dot-ring"></span>` : ''}
                            </div>
                            <span style="font-size:10px; font-weight:800; color:#e2e8f0; max-width:54px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${(u.name || u.username).split(' ')[0]}</span>
                        </div>
                    `;
                }).join('')}
            </div>

            <!-- Filter Chips -->
            <div style="display:flex; gap:7px; overflow-x:auto; padding-bottom:10px; scrollbar-width:none;">
                <button type="button" class="nx-dm-filter-chip ${activeInboxFilter === 'all' ? 'active' : ''}" onclick="NexusDmInbox.setFilter('all')">💬 All Chats (${allUsers.length})</button>
                <button type="button" class="nx-dm-filter-chip ${activeInboxFilter === 'online' ? 'active' : ''}" onclick="NexusDmInbox.setFilter('online')">🟢 Online Now (${onlineUsers.length})</button>
                <button type="button" class="nx-dm-filter-chip ${activeInboxFilter === 'pinned' ? 'active' : ''}" onclick="NexusDmInbox.setFilter('pinned')">📌 Pinned (${pinnedFriends.length})</button>
            </div>

            <!-- Recent 1:1 Conversations List -->
            <div style="display:flex; flex-direction:column; max-height:290px; overflow-y:auto;">
                ${filteredUsers.map(u => {
                    let k = u.username.toLowerCase().trim();
                    let info = dmSummaryMap[k] || {};
                    let isOn = (Date.now() - (u.lastOnline || 0)) < 180000;
                    let isPin = pinnedFriends.includes(k);
                    let safeU = u.username.replace(/'/g, "\\'");
                    let safeN = (u.name || u.username).replace(/'/g, "\\'");
                    let ch = (u.name || u.username || 'U').charAt(0).toUpperCase();

                    return `
                        <div class="nx-dm-friend-row" onclick="NexusDM.openDirectChat('${safeU}', '${safeN}', '')">
                            <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
                                <div style="position:relative; width:42px; height:42px; border-radius:50%; background:#1e293b; flex-shrink:0;">
                                    ${u.dp ? `<img src="${u.dp}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">` : `<div style="width:100%; height:100%; border-radius:50%; background:#2563eb; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:900;">${ch}</div>`}
                                    ${isOn ? `<span class="nx-online-dot-ring"></span>` : ''}
                                </div>
                                <div style="min-width:0; flex:1;">
                                    <div style="display:flex; align-items:center; gap:5px;">
                                        <span style="font-size:13.5px; font-weight:900; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${u.name || u.username}</span>
                                        ${u.verified ? `<span style="font-size:11px;">✅</span>` : ''}
                                        ${isPin ? `<span style="font-size:11px;">📌</span>` : ''}
                                    </div>
                                    <div style="font-size:11.5px; color:${info.unreadCount ? '#10b981' : '#94a3b8'}; font-weight:${info.unreadCount ? '800' : '500'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                        ${(info.lastText || `👋 Tap to chat with @${u.username}`).replace(/</g, '&lt;')}
                                    </div>
                                </div>
                            </div>
                            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px; flex-shrink:0;">
                                <span style="font-size:10px; color:#64748b; font-weight:700;">${formatShortAgo(info.lastTime || u.lastOnline)}</span>
                                <div style="display:flex; align-items:center; gap:6px;">
                                    ${info.unreadCount ? `<span style="background:#10b981; color:#020617; font-size:10px; font-weight:900; padding:2px 7px; border-radius:99px;">${info.unreadCount} new</span>` : ''}
                                    <button type="button" onclick="event.stopPropagation(); NexusDmInbox.togglePin('${safeU}')" style="background:none; border:none; font-size:13px; cursor:pointer; opacity:${isPin ? '1' : '0.45'};">📌</button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // Inject "🔥 View-Once Secret Message" Button into 1:1 DM Bottom + Tray & Parse View-Once Bubbles!
    function upgradeDmChatWithViewOnce() {
        const tray = document.getElementById('nx-dm-bottom-tray');
        if (tray && !tray.querySelector('.nx-viewonce-tray-btn')) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'nx-viewonce-tray-btn';
            btn.style.cssText = "background:#182229; border:1.5px solid #f43f5e; color:#fda4af; border-radius:12px; padding:8px 4px; font-size:11px; font-weight:800; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;";
            btn.innerHTML = `<span style="font-size:18px;">🔥</span><span>1-Time Secret</span>`;
            btn.onclick = () => {
                tray.style.display = 'none';
                NexusDmInbox.sendViewOncePrompt();
            };
            tray.appendChild(btn);
        }

        // Transform `🔥VIEWONCE|secretBase64` into Self-Destructing 1-Tap Cards!
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
                                <div style="font-size:10.5px; color:#cbd5e1;">Tap to view once (Self-destructs on close!)</div>
                            </div>
                        </div>
                    </div>
                `;
            }
        });
    }

    window.NexusDmInbox = {
        setFilter: function(f) {
            activeInboxFilter = f;
            renderProDmHomeScreen();
        },

        togglePin: function(username) {
            let k = String(username || '').toLowerCase().trim();
            if (!k) return;
            if (pinnedFriends.includes(k)) {
                pinnedFriends = pinnedFriends.filter(x => x !== k);
                if (window.Nexus) Nexus.toast(`📌 Unpinned @${username}`);
            } else {
                pinnedFriends.push(k);
                if (window.Nexus) Nexus.toast(`📌 Pinned @${username} to top!`);
            }
            try { localStorage.setItem('nx_pinned_dm_friends_v1', JSON.stringify(pinnedFriends)); } catch (e) {}
            renderProDmHomeScreen();
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
                    <p style="font-size:11.5px; color:#cbd5e1; margin-bottom:10px;">Samne wala dost is message ko sirf 1 baar dekh sakega — band karte hi yeh hamesha ke liye delete ho jayega!</p>
                    <textarea id="nx-vo-secret-in" rows="3" placeholder="Write secret message, password or note..." style="width:100%; padding:10px; border-radius:12px; border:1px solid #f43f5e; background:#111827; color:white; font-size:13.5px; outline:none; margin-bottom:10px;"></textarea>
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
                Nexus.toast("🔥 1-Time Secret Message Sent!");
            }
        },

        openViewOnceModal: function(msgId, b64) {
            let secret = '';
            try { secret = decodeURIComponent(escape(atob(b64))); } catch (e) { secret = 'Secret expired'; }
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;

            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid #f43f5e; background:#090d16; padding:18px; text-align:center; max-width:375px;">
                    <div style="font-size:32px; margin-bottom:6px;">🔥</div>
                    <h3 style="color:#fda4af; font-size:16px; margin-bottom:10px;">1-Time Secret Message</h3>
                    <div style="background:#161f33; border:1px dashed #f43f5e; padding:14px; border-radius:12px; color:#f8fafc; font-size:14.5px; font-weight:700; line-height:1.5; margin-bottom:14px; word-break:break-word;">
                        ${secret.replace(/</g, '&lt;')}
                    </div>
                    <button type="button" onclick="NexusDmInbox.destroyViewOnce('${msgId}')" style="width:100%; background:#ef4444; color:white; border:none; padding:11px; border-radius:12px; font-weight:900; cursor:pointer;">💨 Close &amp; Self-Destruct Now</button>
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
                    deleted: true,
                    deletedBy: me ? me.username : 'viewer',
                    deletedByName: '🔥 1-Time Secret Opened & Self-Destructed',
                    text: ''
                }, { merge: true }).catch(() => {});
            }
            if (window.Nexus) Nexus.toast("💨 Secret message self-destructed!");
        }
    };

    function loopDmInbox() {
        startDmInboxRealtimeListener();
        renderProDmHomeScreen();
        upgradeDmChatWithViewOnce();
    }

    setInterval(loopDmInbox, 1100);
    setTimeout(loopDmInbox, 200);
})(); // === END OF DMINBOX.JS ===
