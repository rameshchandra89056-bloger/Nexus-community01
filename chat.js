// === CHAT.JS (v16.0 FORCED DOM BUILDER — FIXES BLANK SCREEN 1000073674.jpg) ===
(function() {
    let grpSub = null, curCat = 'all', prevMap = {};
    const ROOMS = [
        { id: 'casual_chat', t: 'Casual Student Chat', s: 'Live Room • Chill & Talk', ic: '💬', c: '#10b981', cat: 'chill', b: 129 },
        { id: 'pcm_doubt', t: 'PCM Doubt Solving', s: 'Physics, Chemistry & Maths', ic: '❓', c: '#ef4444', cat: 'study', b: 42 },
        { id: 'jee_study', t: 'JEE Study Material', s: 'Notes, Strategy & PYQs', ic: '📚', c: '#38bdf8', cat: 'study', b: 64 },
        { id: 'coding_hub', t: 'Coding & Web Dev Hub', s: 'HTML, CSS, JS & Python', ic: '💻', c: '#a78bfa', cat: 'chill', b: 31 }
    ];

    function getMe() {
        try { if (window.Nexus && Nexus.getCurrentUser) return Nexus.getCurrentUser(); } catch (e) {}
        try { return (window.Nexus && Nexus.currentUser) || JSON.parse(localStorage.getItem('nexus_current_user') || localStorage.getItem('nexus_user') || 'null'); } catch (e) { return null; }
    }

    function forceBuildCommunityTab() {
        const tab = document.getElementById('tab-community');
        if (tab && !tab.getAttribute('data-nx-v16')) {
            tab.setAttribute('data-nx-v16', '1');
            tab.innerHTML = `<div style="padding:10px 12px 85px; display:block !important;">
                <div id="nx-dm-inbox-banner" style="display:block !important;"><div id="nx-structured-4card-grid" style="display:grid !important;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
                    <div onclick="if(window.NexusDmInbox)NexusDmInbox.openFullScreenDmHub();else if(window.NexusDM)NexusDM.openDmHubFallback();" style="background:#111827;border:1.5px solid #10b981;border-radius:18px;padding:12px;cursor:pointer;"><div style="font-size:20px;">💬</div><div style="font-size:13.5px;font-weight:900;color:#fff;margin-top:6px;">1:1 Personal DM</div><div style="font-size:10.5px;color:#6ee7b7;font-weight:700;">Friends • Calls & DJ →</div></div>
                    <div onclick="if(window.NexusAI)NexusAI.openStudio();" style="background:#111827;border:1.5px solid #a78bfa;border-radius:18px;padding:12px;cursor:pointer;"><div style="font-size:20px;">🤖</div><div style="font-size:13.5px;font-weight:900;color:#fff;margin-top:6px;">Private AI Studio</div><div style="font-size:10.5px;color:#d8b4fe;font-weight:700;">Swara • Image Gen →</div></div>
                    <div onclick="if(window.NexusCards)NexusCards.openChallengerApp();else window.open('https://challengers-live.netlify.app','_blank');" style="background:#111827;border:1.5px solid #f59e0b;border-radius:18px;padding:12px;cursor:pointer;"><div style="font-size:20px;">📝</div><div style="font-size:13.5px;font-weight:900;color:#fff;margin-top:6px;">Live Test Series</div><div style="font-size:10.5px;color:#fde047;font-weight:700;">JEE / NEET Arena →</div></div>
                    <div onclick="if(window.NexusCards)NexusCards.openPdfVaultApp();" style="background:#111827;border:1.5px solid #38bdf8;border-radius:18px;padding:12px;cursor:pointer;"><div style="font-size:20px;">📚</div><div style="font-size:13.5px;font-weight:900;color:#fff;margin-top:6px;">PDF Study Vault</div><div style="font-size:10.5px;color:#38bdf8;font-weight:700;">Notes, Books & PYQs →</div></div>
                </div></div>
                <div style="display:flex !important;gap:8px;margin-bottom:12px;">
                    <button onclick="NexusChat.filter('all')" style="background:#10b981;color:#020617;border:none;padding:7px 14px;border-radius:99px;font-size:12px;font-weight:900;">All Channels</button>
                    <button onclick="NexusChat.filter('study')" style="background:#111827;color:#cbd5e1;border:1px solid #1e293b;padding:7px 14px;border-radius:99px;font-size:12px;font-weight:800;">Study & JEE</button>
                    <button onclick="NexusChat.filter('chill')" style="background:#111827;color:#cbd5e1;border:1px solid #1e293b;padding:7px 14px;border-radius:99px;font-size:12px;font-weight:800;">Chill & Tech</button>
                </div>
                <div id="nx-community-rooms-list" style="display:flex !important;flex-direction:column;gap:10px;"></div>
            </div>`;
            renderRooms();
        }
        let m = document.getElementById('nx-chat-room');
        if (!m) { m = document.createElement('div'); m.id = 'nx-chat-room'; document.body.appendChild(m); }
        if (!m.getAttribute('data-nx-v16')) {
            m.setAttribute('data-nx-v16', '1');
            m.style.cssText = 'position:fixed;inset:0;width:100%;max-width:640px;height:100dvh;margin:0 auto;background:#090d16;z-index:100250;display:none;flex-direction:column;';
            m.innerHTML = `<div style="height:54px;background:#111b21;border-bottom:1px solid #1e293b;display:flex;align-items:center;justify-content:space-between;padding:0 12px;"><div style="display:flex;align-items:center;gap:10px;"><button onclick="NexusChat.closeChatRoom()" style="background:none;border:none;color:#fff;font-size:20px;">←</button><div><div id="nx-room-title" style="font-size:14px;font-weight:900;color:#fff;">Chat</div><div id="nx-room-subtitle" style="font-size:11px;color:#10b981;">Live Room</div></div></div><div style="display:flex;gap:6px;"><button onclick="if(window.NexusWatchParty)NexusWatchParty.openModal(false,'yt');" style="background:#1e293b;color:#fff;border:1px solid #334155;padding:5px 9px;border-radius:8px;font-size:11px;font-weight:800;">▶️ TV</button><button onclick="if(window.NexusCards)NexusCards.openPdfVaultApp();" style="background:#1e293b;color:#fff;border:1px solid #334155;padding:5px 9px;border-radius:8px;font-size:11px;font-weight:800;">📄 PDF</button></div></div>
            <div id="nx-room-messages" style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:6px;"></div>
            <div style="padding:8px 10px;background:#111b21;display:flex;align-items:center;gap:7px;"><input id="nx-chat-msg-in" placeholder="Message..." onkeydown="if(event.key==='Enter')NexusChat.sendChatMessage()" style="flex:1;background:#1f2c34;border:1px solid #334155;color:#fff;padding:10px 14px;border-radius:99px;outline:none;"><button onclick="if(window.NexusVoice)NexusVoice.pickPhotos('group');" style="width:38px;height:38px;border-radius:50%;background:#1f2c34;color:#10b981;border:1px solid #10b981;font-weight:900;">+</button><button onclick="NexusChat.startVoiceInput()" style="width:38px;height:38px;border-radius:50%;background:#1f2c34;color:#38bdf8;border:none;">🎙️</button><button onclick="NexusChat.sendChatMessage()" style="width:42px;height:42px;border-radius:50%;background:#10b981;color:#020617;border:none;font-weight:900;">➤</button></div>`;
        }
    }

    function renderRooms() {
        const box = document.getElementById('nx-community-rooms-list');
        if (!box) return;
        box.innerHTML = ROOMS.filter(r => curCat === 'all' || r.cat === curCat).map(r => `<div onclick="NexusChat.openChatRoom('${r.id}','${r.t}','${r.s}')" style="background:#111827;border:1.5px solid #1e293b;border-radius:16px;padding:13px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;"><div style="display:flex;align-items:center;gap:11px;"><div style="width:42px;height:42px;border-radius:12px;border:1px solid ${r.c};display:flex;align-items:center;justify-content:center;font-size:19px;">${r.ic}</div><div><div style="font-size:14px;font-weight:900;color:#fff;">${r.t}</div><div style="font-size:11.5px;color:#10b981;">${prevMap[r.id] || r.s}</div></div></div><span style="background:#10b981;color:#020617;font-size:11px;font-weight:900;padding:3px 8px;border-radius:99px;">${r.b}</span></div>`).join('');
    }

    window.NexusChat = {
        activeRoom: 'casual_chat',
        filter: function(c) { curCat = c; renderRooms(); },
        openChatRoom: function(id, t, s) {
            forceBuildCommunityTab();
            if (id === 'jee_pcm') return window.NexusCards ? NexusCards.openChallengerApp() : window.open('https://challengers-live.netlify.app', '_blank');
            if (id === 'notes_lib') return window.NexusCards && NexusCards.openPdfVaultApp();
            this.activeRoom = id || 'casual_chat';
            document.getElementById('nx-chat-room').style.display = 'flex';
            document.getElementById('nx-room-title').innerText = t || 'Chat Room';
            if (grpSub) grpSub();
            if (window.Nexus && Nexus.db) {
                grpSub = Nexus.db.collection("nexus_real_msgs").orderBy("createdAt", "desc").limit(90).onSnapshot(sn => {
                    let arr = [], me = getMe(), myU = me && me.username ? me.username.toLowerCase() : '';
                    sn.forEach(d => { let x = d.data(); if ((x.roomId || 'casual_chat') === this.activeRoom) arr.push(x); });
                    arr.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                    const b = document.getElementById('nx-room-messages');
                    if (b) { b.innerHTML = arr.map(m => `<div style="display:flex;flex-direction:column;align-items:${String(m.username||'').toLowerCase()===myU?'flex-end':'flex-start'};margin:4px 0;"><div style="max-width:80%;background:${String(m.username||'').toLowerCase()===myU?'#005c4b':'#1f2c34'};color:#fff;padding:8px 11px;border-radius:12px;"><div onclick="if(window.Nexus&&Nexus.openPublicProfile)Nexus.openPublicProfile('${m.username||m.sender}')" style="font-size:10.5px;color:#38bdf8;font-weight:900;cursor:pointer;">@${m.username || m.sender || 'user'}</div>${m.imgUrl?`<img src="${m.imgUrl}" style="max-width:200px;border-radius:8px;margin:4px 0;">`:''}<div style="font-size:13.5px;">${(m.text || '').replace(/</g, '&lt;')}</div></div></div>`).join(''); b.scrollTop = b.scrollHeight; }
                });
            }
        },
        closeChatRoom: function() { if (grpSub) grpSub(); document.getElementById('nx-chat-room').style.display = 'none'; },
        sendChatMessage: async function() {
            const i = document.getElementById('nx-chat-msg-in'); if (!i || !i.value.trim()) return;
            let txt = i.value.trim(); i.value = ''; let me = getMe(); if (!me || !Nexus.db) return;
            await Nexus.db.collection("nexus_real_msgs").add({ roomId: this.activeRoom, sender: me.name || me.username, username: me.username, text: txt, createdAt: Date.now() });
        },
        startVoiceInput: function() { if (window.NexusVoice) NexusVoice.startRec('group'); }
    };
    forceBuildCommunityTab(); setInterval(forceBuildCommunityTab, 400);
})();
// === END CHAT.JS ===
