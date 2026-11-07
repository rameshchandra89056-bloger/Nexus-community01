// ================= CHAT.JS (LIVE EMERGENCY FIX): 🌐 RESTORES COMMUNITY GROUP CHATS & FIXES BLANK SCREEN =================

(function() {
    let activeGrpSub = null;

    function renderLiveGroupMsgs(messagesList) {
        const box = document.getElementById('nx-room-messages');
        if (!box) return;
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let myU = me && me.username ? me.username.toLowerCase().trim() : '';

        if (!messagesList.length) {
            box.innerHTML = `<div style="text-align:center; padding:30px 15px; color:#64748b; font-size:12.5px;">👋 Start the discussion! Type a message below.</div>`;
            return;
        }

        box.innerHTML = messagesList.map(m => {
            let sU = String(m.username || m.sender || '').toLowerCase().trim();
            let isMine = sU === myU;
            if (m.deleted) return '';

            let pics = (Array.isArray(m.imgUrls) && m.imgUrls.length) ? m.imgUrls : (m.imgUrl ? [m.imgUrl] : []);
            let mHtml = '';
            if (pics.length) {
                mHtml += `<img src="${pics[0]}" onclick="window.open('${pics[0]}','_blank')" style="max-width:210px; width:100%; border-radius:10px; margin:4px 0; display:block; cursor:pointer;">`;
            }
            if (m.audioData) {
                mHtml += `<div style="margin:4px 0;"><audio src="${m.audioData}" controls style="height:30px; max-width:200px;"></audio></div>`;
            }

            return `<div style="display:flex; flex-direction:column; align-items:${isMine ? 'flex-end' : 'flex-start'}; margin:5px 0;">
                <div style="max-width:80%; background:${isMine ? '#005c4b' : '#1f2c34'}; color:#f8fafc; padding:8px 11px; border-radius:${isMine ? '14px 4px 14px 14px' : '4px 14px 14px 14px'}; box-shadow:0 2px 6px rgba(0,0,0,0.3);">
                    ${!isMine ? `<div style="font-size:11px; font-weight:900; color:#38bdf8; margin-bottom:2px;">@${(m.username || m.sender || 'member').replace(/</g, '&lt;')}</div>` : ''}
                    ${mHtml}
                    ${m.text ? `<div style="font-size:13.5px; line-height:1.4; word-break:break-word;">${(m.text || '').replace(/</g, '&lt;')}</div>` : ''}
                </div>
            </div>`;
        }).join('');

        box.scrollTop = box.scrollHeight;
    }

    window.NexusChat = {
        activeRoom: 'casual_chat',
        openChatRoom: function(roomId, title, subtitle) {
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
            if (tEl) tEl.innerText = title || 'Community Room';
            if (sEl) sEl.innerText = subtitle || 'Live Room';

            if (activeGrpSub) activeGrpSub();
            if (window.Nexus && Nexus.db) {
                activeGrpSub = Nexus.db.collection("nexus_real_msgs")
                    .where("roomId", "==", this.activeRoom)
                    .onSnapshot(snap => {
                        let arr = [];
                        snap.forEach(doc => arr.push(Object.assign({ id: doc.id }, doc.data())));
                        arr.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                        renderLiveGroupMsgs(arr.slice(-60));
                    }, () => {});
            }
        },
        closeChatRoom: function() {
            if (activeGrpSub) { activeGrpSub(); activeGrpSub = null; }
            const roomEl = document.getElementById('nx-chat-room');
            if (roomEl) roomEl.style.display = 'none';
        },
        sendChatMessage: async function() {
            const inp = document.getElementById('nx-chat-msg-in');
            if (!inp || !inp.value.trim()) return;
            let txt = inp.value.trim();
            inp.value = '';
            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (!me || !Nexus.db) return;

            await Nexus.db.collection("nexus_real_msgs").add({
                roomId: this.activeRoom,
                sender: me.name || me.username,
                username: me.username,
                text: txt,
                createdAt: Date.now()
            }).catch(() => {});
        }
    };
})();
