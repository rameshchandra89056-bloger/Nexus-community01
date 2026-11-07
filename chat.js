// ================= CHAT.JS (v10.0 FINAL CLEAN GROUP CHAT ENGINE — ZERO OVERLAP): 🌐 PURE COMMUNITY GROUP ROOMS + 🔒 AUTOMATICALLY REDIRECTS 'jee_pcm' TO CHALLENGER WEBSITE & 'notes_lib' TO PDF VAULT + 📸 NATIVE MULTI-PHOTO & VOICE NOTE RENDERING =================

(function() {
    let grpUnsub = null;
    let activeGroupRoomId = 'casual_chat';

    function formatGrpTime(ts) {
        if (!ts) return '';
        try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }); } catch (e) { return ''; }
    }

    function renderGroupMessages(list) {
        const box = document.getElementById('nx-room-messages');
        if (!box) return;
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let myU = me && me.username ? me.username.toLowerCase().trim() : '';

        if (!list.length) {
            box.innerHTML = `<div style="text-align:center; padding:30px 15px; color:#64748b; font-size:12.5px;">👋 Start the discussion! Type a message below.</div>`;
            return;
        }

        box.innerHTML = list.map(m => {
            let sU = String(m.username || m.sender || '').toLowerCase().trim();
            let isMine = sU === myU;

            if (m.deleted) {
                return `<div style="display:flex; justify-content:${isMine ? 'flex-end' : 'flex-start'}; margin:4px 0;">
                    <div class="nx-single-deleted-pill">🚫 Deleted by ${m.deletedBy || m.sender || 'member'}</div>
                </div>`;
            }

            let pics = (Array.isArray(m.imgUrls) && m.imgUrls.length) ? m.imgUrls : (m.imgUrl ? [m.imgUrl] : []);
            let mediaHTML = '';
            if (pics.length === 1) {
                mediaHTML += `<img src="${pics[0]}" onclick="window.open('${pics[0]}','_blank')" style="max-width:220px; width:100%; max-height:240px; object-fit:cover; border-radius:12px; border:1.5px solid #38bdf8; margin:4px 0; cursor:pointer; display:block;">`;
            } else if (pics.length > 1) {
                mediaHTML += `<div class="nx-vip-dm-carousel">${pics.map(u => `<div class="nx-vip-dm-slide" onclick="window.open('${u}','_blank')"><img src="${u}"></div>`).join('')}</div>`;
            }

            if (m.audioData) {
                mediaHTML += `<div style="margin:4px 0;"><audio src="${m.audioData}" controls style="height:32px; max-width:215px;"></audio></div>`;
            }

            let safeU = String(m.username || m.sender || '').replace(/'/g, "\\'");

            return `<div style="display:flex; flex-direction:column; align-items:${isMine ? 'flex-end' : 'flex-start'}; margin:6px 0;">
                <div style="max-width:80%; background:${isMine ? '#005c4b' : '#1f2c34'}; color:#f8fafc; padding:8px 12px; border-radius:${isMine ? '14px 4px 14px 14px' : '4px 14px 14px 14px'}; box-shadow:0 2px 8px rgba(0,0,0,0.3);">
                    ${!isMine ? `<div onclick="Nexus.openPublicProfile('${safeU}')" style="font-size:11px; font-weight:900; color:#38bdf8; margin-bottom:3px; cursor:pointer;">@${(m.username || m.sender || 'member').replace(/</g, '&lt;')}</div>` : ''}
                    ${mediaHTML}
                    ${m.text ? `<div style="font-size:13.5px; line-height:1.45; word-break:break-word;">${(m.text || '').replace(/</g, '&lt;')}</div>` : ''}
                    <div style="text-align:right; font-size:9.5px; color:rgba(255,255,255,0.65); margin-top:3px;">${formatGrpTime(m.createdAt)}</div>
                </div>
            </div>`;
        }).join('');

        box.scrollTop = box.scrollHeight;
    }

    window.NexusChat = {
        activeRoom: 'casual_chat',

        openChatRoom: function(roomId, title, subtitle) {
            // 🔒 HARD BLOCK: Never allow 'jee_pcm' or 'notes_lib' to open as empty chat rooms!
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
            activeGroupRoomId = this.activeRoom;

            const roomEl = document.getElementById('nx-chat-room');
            if (!roomEl) return;
            roomEl.style.display = 'flex';

            const tEl = document.getElementById('nx-room-title');
            const sEl = document.getElementById('nx-room-subtitle');
            if (tEl) tEl.innerText = title || 'Community Room';
            if (sEl) sEl.innerText = subtitle || 'Live Room • Swipe or Tap';

            if (grpUnsub) grpUnsub();
            if (window.Nexus && Nexus.db) {
                grpUnsub = Nexus.db.collection("nexus_real_msgs")
                    .where("roomId", "==", activeGroupRoomId)
                    .onSnapshot(snap => {
                        let list = [];
                        snap.forEach(doc => list.push(Object.assign({ id: doc.id }, doc.data())));
                        list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                        renderGroupMessages(list.slice(-70));
                    }, () => {});
            }
        },

        closeChatRoom: function() {
            if (grpUnsub) { grpUnsub(); grpUnsub = null; }
            const roomEl = document.getElementById('nx-chat-room');
            if (roomEl) roomEl.style.display = 'none';
        },

        sendChatMessage: async function() {
            const inp = document.getElementById('nx-chat-msg-in');
            if (!inp || !inp.value.trim()) return;
            let txt = inp.value.trim();
            inp.value = '';

            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (!me || !Nexus.db) { Nexus.switchTab('tab-profile'); return; }

            await Nexus.db.collection("nexus_real_msgs").add({
                roomId: activeGroupRoomId,
                sender: me.name || me.username,
                username: me.username,
                text: txt,
                createdAt: Date.now()
            }).catch(() => {});
        },

        startVoiceInput: function() {
            if (window.NexusVoice && NexusVoice.startRec) {
                NexusVoice.startRec('group');
            }
        }
    };
})(); // === END OF CHAT.JS ===
