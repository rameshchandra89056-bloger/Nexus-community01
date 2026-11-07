// ================= CHAT.JS (COMPLETE SELF-BUILDING COMMUNITY TAB & REAL FIREBASE GROUP CHAT ENGINE): 🛠️ REBUILDS BLANK #tab-community (SCREENSHOT 1000073628 FIX) + 🌐 LIVE CHANNELS LIST + 💬 FULL GROUP CHAT MODAL =================

(function() {
    let activeGrpUnsub = null;
    let previewUnsub = null;
    let currentFilter = 'all';
    let roomPreviews = {};

    const COMMUNITY_ROOMS = [
        { id: 'casual_chat', title: 'Casual Student Chat', sub: 'Live Room • Chill & Talk', icon: '💬', color: '#10b981', cat: 'chill', badge: 129 },
        { id: 'pcm_doubt', title: 'PCM Doubt Solving', sub: 'Physics, Chemistry & Maths Help', icon: '❓', color: '#ef4444', cat: 'study', badge: 42 },
        { id: 'jee_study', title: 'JEE Study Material', sub: 'Notes, Strategy & Daily Targets', icon: '📚', color: '#38bdf8', cat: 'study', badge: 64 },
        { id: 'coding_hub', title: 'Coding & Web Dev Hub', sub: 'HTML, CSS, JS, Python & AI', icon: '💻', color: '#a78bfa', cat: 'chill', badge: 31 }
    ];

    // 1. Rebuild #tab-community and #nx-chat-room if missing or blank (Fixes Screenshot 1000073628.jpg!)
    function ensureCommunityAndChatRoomDOM() {
        const commTab = document.getElementById('tab-community');
        if (commTab && !document.getElementById('nx-community-rooms-list')) {
            commTab.innerHTML = `
                <div style="padding: 10px 12px 85px;">
                    <div id="nx-dm-inbox-banner">
                        <div id="nx-structured-4card-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; width:100%; margin-bottom:12px;">
                            <div class="nx-half-card" onclick="if(window.NexusDmInbox) NexusDmInbox.openFullScreenDmHub(); else if(window.NexusDM) NexusDM.openDmHubFallback();" style="background:#111827; border:1.5px solid rgba(16,185,129,0.5); border-radius:18px; padding:13px 12px; cursor:pointer; display:flex; flex-direction:column; justify-content:space-between; min-height:108px;">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                    <div style="width:36px; height:36px; border-radius:11px; background:rgba(16,185,129,0.18); border:1px solid #10b981; display:flex; align-items:center; justify-content:center; font-size:18px;">💬</div>
                                    <span style="background:rgba(16,185,129,0.2); color:#10b981; font-size:10px; font-weight:900; padding:2px 7px; border-radius:99px;">Live DM</span>
                                </div>
                                <div style="margin-top:8px;">
                                    <div style="font-size:13.5px; font-weight:900; color:#f8fafc;">1:1 Personal DM</div>
                                    <div style="font-size:10.5px; color:#6ee7b7; margin-top:2px; font-weight:700;">Friends • Calls &amp; DJ →</div>
                                </div>
                            </div>

                            <div class="nx-half-card" onclick="if(window.NexusAI) NexusAI.openStudio();" style="background:#111827; border:1.5px solid rgba(167,139,250,0.5); border-radius:18px; padding:13px 12px; cursor:pointer; display:flex; flex-direction:column; justify-content:space-between; min-height:108px;">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                    <div style="width:36px; height:36px; border-radius:11px; background:rgba(139,92,246,0.2); border:1px solid #a78bfa; display:flex; align-items:center; justify-content:center; font-size:18px;">🤖</div>
                                    <span style="background:rgba(167,139,250,0.2); color:#d8b4fe; font-size:10px; font-weight:900; padding:2px 7px; border-radius:99px;">11 Servers</span>
                                </div>
                                <div style="margin-top:8px;">
                                    <div style="font-size:13.5px; font-weight:900; color:#f8fafc;">Private AI Studio</div>
                                    <div style="font-size:10.5px; color:#d8b4fe; margin-top:2px; font-weight:700;">🔊 Swara • 🎨 Image Gen →</div>
                                </div>
                            </div>

                            <div class="nx-half-card" onclick="if(window.NexusCards) NexusCards.openChallengerApp(); else window.open('https://challengers-live.netlify.app','_blank');" style="background:#111827; border:1.5px solid rgba(245,158,11,0.5); border-radius:18px; padding:13px 12px; cursor:pointer; display:flex; flex-direction:column; justify-content:space-between; min-height:108px;">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                    <div style="width:36px; height:36px; border-radius:11px; background:rgba(245,158,11,0.18); border:1px solid #f59e0b; display:flex; align-items:center; justify-content:center; font-size:18px;">📝</div>
                                    <span style="background:rgba(245,158,11,0.2); color:#fde047; font-size:10px; font-weight:900; padding:2px 7px; border-radius:99px;">🔥 Challenger</span>
                                </div>
                                <div style="margin-top:8px;">
                                    <div style="font-size:13.5px; font-weight:900; color:#f8fafc;">Live Test Series</div>
                                    <div style="font-size:10.5px; color:#fde047; margin-top:2px; font-weight:700;">JEE / NEET Mock Arena →</div>
                                </div>
                            </div>

                            <div class="nx-half-card" onclick="if(window.NexusCards) NexusCards.openPdfVaultApp();" style="background:#111827; border:1.5px solid rgba(56,189,248,0.5); border-radius:18px; padding:13px 12px; cursor:pointer; display:flex; flex-direction:column; justify-content:space-between; min-height:108px;">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                    <div style="width:36px; height:36px; border-radius:11px; background:rgba(56,189,248,0.18); border:1px solid #38bdf8; display:flex; align-items:center; justify-content:center; font-size:18px;">📚</div>
                                    <span style="background:rgba(56,189,248,0.2); color:#38bdf8; font-size:10px; font-weight:900; padding:2px 7px; border-radius:99px;">Free PDFs</span>
                                </div>
                                <div style="margin-top:8px;">
                                    <div style="font-size:13.5px; font-weight:900; color:#f8fafc;">PDF Study Vault</div>
                                    <div style="font-size:10.5px; color:#38bdf8; margin-top:2px; font-weight:700;">Notes, Books &amp; PYQs →</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div id="nx-channel-filters" style="display:flex; gap:8px; overflow-x:auto; padding:4px 0 12px; scrollbar-width:none;">
                        <button type="button" onclick="NexusChat.filterChannels('all')" id="nx-filt-all" style="background:#10b981; color:#020617; border:none; padding:7px 15px; border-radius:99px; font-size:12px; font-weight:900; cursor:pointer; white-space:nowrap;">All Channels</button>
                        <button type="button" onclick="NexusChat.filterChannels('study')" id="nx-filt-study" style="background:#111827; color:#cbd5e1; border:1px solid #1e293b; padding:7px 15px; border-radius:99px; font-size:12px; font-weight:800; cursor:pointer; white-space:nowrap;">Study &amp; JEE</button>
                        <button type="button" onclick="NexusChat.filterChannels('chill')" id="nx-filt-chill" style="background:#111827; color:#cbd5e1; border:1px solid #1e293b; padding:7px 15px; border-radius:99px; font-size:12px; font-weight:800; cursor:pointer; white-space:nowrap;">Chill &amp; Tech</button>
                    </div>

                    <div id="nx-community-rooms-list" style="display:flex; flex-direction:column; gap:10px;"></div>
                </div>
            `;
            renderChannelsList();
        }

        if (!document.getElementById('nx-chat-room')) {
            const roomModal = document.createElement('div');
            roomModal.id = 'nx-chat-room';
            roomModal.style.cssText = 'position:fixed; inset:0; width:100%; max-width:640px; height:100dvh; margin:0 auto; background:#090d16; z-index:100150; display:none; flex-direction:column; overflow:hidden;';
            roomModal.innerHTML = `
                <div style="height:56px; background:#111b21; border-bottom:1px solid #1e293b; display:flex; align-items:center; justify-content:space-between; padding:0 12px; flex-shrink:0;">
                    <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
                        <button type="button" onclick="NexusChat.closeChatRoom()" style="background:none; border:none; color:#f8fafc; font-size:20px; cursor:pointer;">←</button>
                        <div id="nx-room-avatar" style="width:38px; height:38px; border-radius:50%; background:#10b981; color:#020617; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:16px; flex-shrink:0;">C</div>
                        <div style="min-width:0; flex:1;">
                            <div id="nx-room-title" style="font-size:14.5px; font-weight:900; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Casual Student Chat</div>
                            <div id="nx-room-subtitle" style="font-size:11px; color:#10b981; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Live Room • Swipe or Tap</div>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:6px;">
                        <button type="button" onclick="if(window.NexusWatchParty) NexusWatchParty.openModal(false, 'yt');" style="background:#1e293b; border:1px solid #334155; color:#f8fafc; padding:6px 10px; border-radius:10px; font-size:11.5px; font-weight:800; cursor:pointer;">▶️ TV</button>
                        <button type="button" onclick="if(window.NexusCards) NexusCards.openPdfVaultApp();" style="background:#1e293b; border:1px solid #334155; color:#f8fafc; padding:6px 10px; border-radius:10px; font-size:11.5px; font-weight:800; cursor:pointer;">📄 PDF</button>
                    </div>
                </div>
                <div style="background:#0d1f22; border-left:3px solid #10b981; padding:6px 12px; font-size:11.5px; color:#cbd5e1; flex-shrink:0;">📌 Live Community Room — Tap any member's name to view profile or DM!</div>
                <div id="nx-room-messages" style="flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:6px;"></div>
                <div style="padding:8px 10px; background:#111b21; border-top:1px solid #1e293b; display:flex; align-items:center; gap:8px; flex-shrink:0;">
                    <input type="text" id="nx-chat-msg-in" placeholder="Message..." onkeydown="if(event.key==='Enter') NexusChat.sendChatMessage()" style="flex:1; background:#1f2c34; border:1px solid #334155; color:#fff; padding:11px 14px; border-radius:99px; font-size:13.5px; outline:none;">
                    <button type="button" onclick="if(window.NexusVoice) NexusVoice.pickPhotos('group');" style="width:40px; height:40px; border-radius:50%; background:#1f2c34; border:1px solid #10b981; color:#10b981; font-size:18px; font-weight:900; cursor:pointer;">+</button>
                    <button type="button" onclick="NexusChat.startVoiceInput()" style="width:40px; height:40px; border-radius:50%; background:#1f2c34; border:none; color:#38bdf8; font-size:17px; cursor:pointer;">🎙️</button>
                    <button type="button" onclick="NexusChat.sendChatMessage()" style="width:44px; height:44px; border-radius:50%; background:#10b981; border:none; color:#020617; font-size:18px; font-weight:900; cursor:pointer;">➤</button>
                </div>
            `;
            document.body.appendChild(roomModal);
        }
    }

    function renderChannelsList() {
        const listEl = document.getElementById('nx-community-rooms-list');
        if (!listEl) return;
        let filtered = COMMUNITY_ROOMS.filter(r => currentFilter === 'all' || r.cat === currentFilter);
        listEl.innerHTML = filtered.map(r => {
            let prev = roomPreviews[r.id] || 'Tap to join live discussion →';
            let safeT = r.title.replace(/'/g, "\\'");
            let safeS = r.sub.replace(/'/g, "\\'");
            return `
                <div onclick="NexusChat.openChatRoom('${r.id}', '${safeT}', '${safeS}')" style="background:#111827; border:1.5px solid #1e293b; border-radius:18px; padding:14px 13px; display:flex; align-items:center; justify-content:space-between; gap:12px; cursor:pointer;">
                    <div style="display:flex; align-items:center; gap:12px; min-width:0; flex:1;">
                        <div style="width:44px; height:44px; border-radius:13px; background:rgba(255,255,255,0.05); border:1px solid ${r.color}; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;">${r.icon}</div>
                        <div style="min-width:0; flex:1;">
                            <div style="font-size:14.5px; font-weight:900; color:#f8fafc;">${r.title}</div>
                            <div style="font-size:12px; color:#10b981; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px;">${prev}</div>
                        </div>
                    </div>
                    <span style="background:#10b981; color:#020617; font-size:11px; font-weight:900; padding:3px 9px; border-radius:99px; flex-shrink:0;">${r.badge}</span>
                </div>
            `;
        }).join('');
    }

    function startRoomPreviewListener() {
        if (!window.Nexus || !Nexus.db || previewUnsub) return;
        previewUnsub = Nexus.db.collection("nexus_real_msgs").orderBy("createdAt", "desc").limit(80).onSnapshot(snap => {
            snap.forEach(doc => {
                let d = doc.data();
                if (!d || d.deleted) return;
                let rId = d.roomId || 'casual_chat';
                if (!roomPreviews[rId]) {
                    let s = (d.sender || d.username || 'Member').split(' ')[0];
                    roomPreviews[rId] = `${s}: ${(d.text || '📷 Shared media').substring(0, 34).replace(/</g, '&lt;')}`;
                }
            });
            renderChannelsList();
        }, () => {});
    }

    function renderGroupMessages(messagesList) {
        const box = document.getElementById('nx-room-messages');
        if (!box) return;
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let myU = me && me.username ? me.username.toLowerCase().trim() : '';

        if (!messagesList.length) {
            box.innerHTML = `<div style="text-align:center; padding:30px 15px; color:#94a3b8; font-size:12.5px;">👋 Start the discussion! Type a message below.</div>`;
            return;
        }

        box.innerHTML = messagesList.map(m => {
            let sU = String(m.username || m.sender || '').toLowerCase().trim();
            let isMine = myU && sU === myU;
            if (m.deleted) {
                return `<div style="display:flex; justify-content:${isMine ? 'flex-end' : 'flex-start'}; margin:3px 0;"><div style="background:rgba(239,68,68,0.14); border:1px dashed #f87171; color:#fecaca; padding:5px 11px; border-radius:10px; font-size:11.5px; font-style:italic;">🚫 Message deleted</div></div>`;
            }

            let pics = (Array.isArray(m.imgUrls) && m.imgUrls.length) ? m.imgUrls : (m.imgUrl ? [m.imgUrl] : []);
            let mHtml = '';
            if (pics.length) {
                mHtml += `<img src="${pics[0]}" onclick="window.open('${pics[0]}','_blank')" style="max-width:215px; width:100%; border-radius:10px; margin:4px 0; display:block; cursor:pointer;">`;
            }
            if (m.audioData) {
                mHtml += `<div style="margin:4px 0;"><audio src="${m.audioData}" controls style="height:32px; max-width:205px;"></audio></div>`;
            }
            let safeU = String(m.username || m.sender || '').replace(/'/g, "\\'");

            return `<div style="display:flex; flex-direction:column; align-items:${isMine ? 'flex-end' : 'flex-start'}; margin:4px 0;">
                <div style="max-width:80%; background:${isMine ? '#005c4b' : '#1f2c34'}; color:#f8fafc; padding:8px 12px; border-radius:${isMine ? '14px 4px 14px 14px' : '4px 14px 14px 14px'};">
                    ${!isMine ? `<div onclick="if(window.Nexus && Nexus.openPublicProfile) Nexus.openPublicProfile('${safeU}')" style="font-size:11px; font-weight:900; color:#38bdf8; margin-bottom:3px; cursor:pointer;">${(m.sender || '@' + m.username || 'Member').replace(/</g, '&lt;')}</div>` : ''}
                    ${mHtml}
                    ${m.text ? `<div style="font-size:13.5px; line-height:1.45; word-break:break-word;">${(m.text || '').replace(/</g, '&lt;')}</div>` : ''}
                </div>
            </div>`;
        }).join('');

        box.scrollTop = box.scrollHeight;
    }

    window.NexusChat = {
        activeRoom: 'casual_chat',

        filterChannels: function(cat) {
            currentFilter = cat || 'all';
            ['all', 'study', 'chill'].forEach(c => {
                const btn = document.getElementById('nx-filt-' + c);
                if (btn) {
                    btn.style.background = (c === currentFilter) ? '#10b981' : '#111827';
                    btn.style.color = (c === currentFilter) ? '#020617' : '#cbd5e1';
                }
            });
            renderChannelsList();
        },

        openChatRoom: function(roomId, title, subtitle) {
            ensureCommunityAndChatRoomDOM();
            if (roomId === 'jee_pcm') {
                if (window.NexusCards && NexusCards.openChallengerApp) return NexusCards.openChallengerApp();
                window.open('https://challengers-live.netlify.app', '_blank');
                return;
            }
            if (roomId === 'notes_lib') {
                if (window.NexusCards && NexusCards.openPdfVaultApp) return NexusCards.openPdfVaultApp();
                return;
            }

            this.activeRoom = roomId || 'casual_chat';
            const roomEl = document.getElementById('nx-chat-room');
            if (!roomEl) return;
            roomEl.style.display = 'flex';

            const tEl = document.getElementById('nx-room-title');
            const sEl = document.getElementById('nx-room-subtitle');
            const avEl = document.getElementById('nx-room-avatar');
            if (tEl) tEl.innerText = title || 'Community Room';
            if (sEl) sEl.innerText = subtitle || 'Live Room';
            if (avEl) avEl.innerText = (title || 'C').charAt(0).toUpperCase();

            if (activeGrpUnsub) activeGrpUnsub();
            if (window.Nexus && Nexus.db) {
                // Index-free fast query so messages NEVER fail to load!
                activeGrpUnsub = Nexus.db.collection("nexus_real_msgs")
                    .orderBy("createdAt", "desc")
                    .limit(120)
                    .onSnapshot(snap => {
                        let arr = [];
                        snap.forEach(doc => {
                            let d = doc.data();
                            if (!d) return;
                            let r = d.roomId || 'casual_chat';
                            if (r === this.activeRoom || (this.activeRoom === 'casual_chat' && !d.roomId)) {
                                arr.push(Object.assign({ id: doc.id }, d));
                            }
                        });
                        arr.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                        renderGroupMessages(arr);
                    }, () => {});
            }
        },

        closeChatRoom: function() {
            if (activeGrpUnsub) { activeGrpUnsub(); activeGrpUnsub = null; }
            const roomEl = document.getElementById('nx-chat-room');
            if (roomEl) roomEl.style.display = 'none';
        },

        sendChatMessage: async function() {
            const inp = document.getElementById('nx-chat-msg-in');
            if (!inp || !inp.value.trim()) return;
            let txt = inp.value.trim();
            inp.value = '';
            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (!me || !Nexus.db) { if (window.Nexus) Nexus.switchTab('tab-profile'); return; }

            await Nexus.db.collection("nexus_real_msgs").add({
                roomId: this.activeRoom || 'casual_chat',
                sender: me.name || me.username,
                username: me.username,
                text: txt,
                createdAt: Date.now()
            }).catch(() => {});
        },

        startVoiceInput: function() {
            if (window.NexusVoice && NexusVoice.startRec) NexusVoice.startRec('group');
        }
    };

    ensureCommunityAndChatRoomDOM();
    startRoomPreviewListener();
    setInterval(() => {
        ensureCommunityAndChatRoomDOM();
        startRoomPreviewListener();
    }, 500);
})(); // === END OF CHAT.JS ===
