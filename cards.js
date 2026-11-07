// === CARDS.JS (v18.0 MASTER COMMUNITY TAB + 4 CARDS + GROUP CHAT + CHALLENGER & PDF VAULT) ===
(function() {
    let grpSub = null, curCat = 'all', prevMap = {};
    const ROOMS = [
        { id: 'casual_chat', t: 'Casual Student Chat', s: 'Live Room • Chill & Talk', ic: '💬', c: '#10b981', cat: 'chill', b: 129 },
        { id: 'pcm_doubt', t: 'PCM Doubt Solving', s: 'Physics, Chemistry & Maths', ic: '❓', c: '#ef4444', cat: 'study', b: 42 },
        { id: 'jee_study', t: 'JEE Study Material', s: 'Notes, Strategy & PYQs', ic: '📚', c: '#38bdf8', cat: 'study', b: 64 },
        { id: 'coding_hub', t: 'Coding & Web Dev Hub', s: 'HTML, CSS, JS & Python', ic: '💻', c: '#a78bfa', cat: 'chill', b: 31 }
    ];
    const PDFS = [
        { title: '📐 JEE Main & Advanced Formula Handbook (PCM)', sub: 'JEE PCM', url: 'https://ncert.nic.in/textbook/pdf/keph103.pdf' },
        { title: '⚡ Physics Class 11 & 12 Revision Notes', sub: 'Physics', url: 'https://ncert.nic.in/textbook/pdf/leph101.pdf' },
        { title: '🧪 Organic & Physical Chemistry Sheet', sub: 'Chemistry', url: 'https://ncert.nic.in/textbook/pdf/lech201.pdf' }
    ];

    // Remove old style tags that hid #tab-community elements
    ['nx-cards-mod-style-v2', 'nx-cards-mod-style-v3'].forEach(id => { const el = document.getElementById(id); if (el) el.remove(); });

    function getMe() {
        try { if (window.Nexus && Nexus.getCurrentUser) return Nexus.getCurrentUser(); } catch (e) {}
        return (window.Nexus && Nexus.currentUser) || { username: 'mohiy', name: 'Mohit_01' };
    }

    function mountMasterCommunityUI() {
        const tab = document.getElementById('tab-community');
        if (tab && !document.getElementById('nx-v18-comm-root')) {
            tab.innerHTML = `<div id="nx-v18-comm-root" style="padding:10px 12px 90px; display:block !important;">
                <div style="display:grid !important; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">
                    <div onclick="if(window.NexusDmInbox)NexusDmInbox.openFullScreenDmHub();else if(window.NexusDM)NexusDM.openDmHubFallback();" style="background:#111827;border:1.5px solid #10b981;border-radius:18px;padding:13px;cursor:pointer;"><div style="font-size:20px;">💬</div><div style="font-size:13.5px;font-weight:900;color:#fff;margin-top:6px;">1:1 Personal DM</div><div style="font-size:10.5px;color:#6ee7b7;font-weight:700;">Friends • Calls & DJ →</div></div>
                    <div onclick="if(window.NexusAI)NexusAI.openStudio();" style="background:#111827;border:1.5px solid #a78bfa;border-radius:18px;padding:13px;cursor:pointer;"><div style="font-size:20px;">🤖</div><div style="font-size:13.5px;font-weight:900;color:#fff;margin-top:6px;">Private AI Studio</div><div style="font-size:10.5px;color:#d8b4fe;font-weight:700;">Swara • Image Gen →</div></div>
                    <div onclick="NexusCards.openChallengerApp()" style="background:#111827;border:1.5px solid #f59e0b;border-radius:18px;padding:13px;cursor:pointer;"><div style="font-size:20px;">📝</div><div style="font-size:13.5px;font-weight:900;color:#fff;margin-top:6px;">Live Test Series</div><div style="font-size:10.5px;color:#fde047;font-weight:700;">JEE / NEET Arena →</div></div>
                    <div onclick="NexusCards.openPdfVaultApp()" style="background:#111827;border:1.5px solid #38bdf8;border-radius:18px;padding:13px;cursor:pointer;"><div style="font-size:20px;">📚</div><div style="font-size:13.5px;font-weight:900;color:#fff;margin-top:6px;">PDF Study Vault</div><div style="font-size:10.5px;color:#38bdf8;font-weight:700;">Notes, Books & PYQs →</div></div>
                </div>
                <div style="display:flex !important; gap:8px; margin-bottom:12px;">
                    <button onclick="NexusChat.filter('all')" style="background:#10b981;color:#020617;border:none;padding:7px 14px;border-radius:99px;font-size:12px;font-weight:900;">All Channels</button>
                    <button onclick="NexusChat.filter('study')" style="background:#111827;color:#cbd5e1;border:1px solid #1e293b;padding:7px 14px;border-radius:99px;font-size:12px;font-weight:800;">Study & JEE</button>
                    <button onclick="NexusChat.filter('chill')" style="background:#111827;color:#cbd5e1;border:1px solid #1e293b;padding:7px 14px;border-radius:99px;font-size:12px;font-weight:800;">Chill & Tech</button>
                </div>
                <div id="nx-v18-rooms-list" style="display:flex !important; flex-direction:column; gap:10px;"></div>
            </div>`;
            renderRoomsList();
        }
        let m = document.getElementById('nx-chat-room');
        if (!m) { m = document.createElement('div'); m.id = 'nx-chat-room'; document.body.appendChild(m); }
        if (!m.getAttribute('data-v18')) {
            m.setAttribute('data-v18', '1');
            m.style.cssText = 'position:fixed;inset:0;width:100%;max-width:640px;height:100dvh;margin:0 auto;background:#090d16;z-index:100300;display:none;flex-direction:column;';
            m.innerHTML = `<div style="height:54px;background:#111b21;border-bottom:1px solid #1e293b;display:flex;align-items:center;justify-content:space-between;padding:0 12px;"><div style="display:flex;align-items:center;gap:10px;"><button onclick="NexusChat.closeChatRoom()" style="background:none;border:none;color:#fff;font-size:20px;">←</button><div><div id="nx-room-title" style="font-size:14px;font-weight:900;color:#fff;">Chat</div><div style="font-size:11px;color:#10b981;">Live Room</div></div></div><div style="display:flex;gap:6px;"><button onclick="if(window.NexusWatchParty)NexusWatchParty.openModal(false,'yt');" style="background:#1e293b;color:#fff;border:1px solid #334155;padding:5px 9px;border-radius:8px;font-size:11px;font-weight:800;">▶️ TV</button><button onclick="NexusCards.openPdfVaultApp()" style="background:#1e293b;color:#fff;border:1px solid #334155;padding:5px 9px;border-radius:8px;font-size:11px;font-weight:800;">📄 PDF</button></div></div>
            <div id="nx-room-messages" style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:6px;"></div>
            <div style="padding:8px 10px;background:#111b21;display:flex;align-items:center;gap:7px;"><input id="nx-chat-msg-in" placeholder="Message..." onkeydown="if(event.key==='Enter')NexusChat.sendChatMessage()" style="flex:1;background:#1f2c34;border:1px solid #334155;color:#fff;padding:10px 14px;border-radius:99px;outline:none;"><button onclick="if(window.NexusVoice)NexusVoice.pickPhotos('group');" style="width:38px;height:38px;border-radius:50%;background:#1f2c34;color:#10b981;border:1px solid #10b981;font-weight:900;">+</button><button onclick="if(window.NexusVoice)NexusVoice.startRec('group');" style="width:38px;height:38px;border-radius:50%;background:#1f2c34;color:#38bdf8;border:none;">🎙️</button><button onclick="NexusChat.sendChatMessage()" style="width:42px;height:42px;border-radius:50%;background:#10b981;color:#020617;border:none;font-weight:900;">➤</button></div>`;
        }
    }

    function renderRoomsList() {
        const box = document.getElementById('nx-v18-rooms-list');
        if (!box) return;
        box.innerHTML = ROOMS.filter(r => curCat === 'all' || r.cat === curCat).map(r => `<div onclick="NexusChat.openChatRoom('${r.id}','${r.t}','${r.s}')" style="background:#111827;border:1.5px solid #1e293b;border-radius:16px;padding:13px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;"><div style="display:flex;align-items:center;gap:11px;"><div style="width:42px;height:42px;border-radius:12px;border:1px solid ${r.c};display:flex;align-items:center;justify-content:center;font-size:19px;">${r.ic}</div><div><div style="font-size:14px;font-weight:900;color:#fff;">${r.t}</div><div style="font-size:11.5px;color:#10b981;">${prevMap[r.id] || r.s}</div></div></div><span style="background:#10b981;color:#020617;font-size:11px;font-weight:900;padding:3px 8px;border-radius:99px;">${r.b}</span></div>`).join('');
    }

    window.NexusCards = {
        openChallengerApp: function() {
            let p = document.getElementById('nx-challenger-v18');
            if (!p) { p = document.createElement('div'); p.id = 'nx-challenger-v18'; p.style.cssText = 'position:fixed;inset:0;width:100%;max-width:640px;height:100dvh;margin:0 auto;background:#090d16;z-index:100450;display:none;flex-direction:column;'; document.body.appendChild(p); }
            p.innerHTML = `<div style="height:52px;background:#0f172a;border-bottom:1.5px solid #f59e0b;display:flex;align-items:center;justify-content:space-between;padding:0 12px;"><strong style="color:#fde047;font-size:14px;">🔥 Challenger Live Test Series</strong><button onclick="document.getElementById('nx-challenger-v18').style.display='none'" style="background:#ef4444;border:none;color:#fff;padding:6px 12px;border-radius:8px;font-weight:900;">Close ✕</button></div><iframe src="https://challengers-live.netlify.app" style="flex:1;width:100%;border:none;background:#090d16;" allow="fullscreen"></iframe>`;
            p.style.display = 'flex';
        },
        openPdfVaultApp: function() {
            let v = document.getElementById('nx-pdf-v18');
            if (!v) { v = document.createElement('div'); v.id = 'nx-pdf-v18'; v.style.cssText = 'position:fixed;inset:0;width:100%;max-width:640px;height:100dvh;margin:0 auto;background:#090d16;z-index:100450;display:none;flex-direction:column;'; document.body.appendChild(v); }
            v.innerHTML = `<div style="height:52px;background:#0f172a;border-bottom:1.5px solid #38bdf8;display:flex;align-items:center;justify-content:space-between;padding:0 12px;"><strong style="color:#38bdf8;font-size:14px;">📚 Nexus PDF Study Vault</strong><button onclick="document.getElementById('nx-pdf-v18').style.display='none'" style="background:#ef4444;border:none;color:#fff;padding:6px 12px;border-radius:8px;font-weight:900;">Close ✕</button></div><div style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px;">${PDFS.map(it => `<div style="background:#111827;border:1px solid #1e293b;border-left:4px solid #38bdf8;border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between;"><div><div style="font-size:13px;font-weight:900;color:#fff;">${it.title}</div><div style="font-size:11px;color:#10b981;">🏷️ ${it.sub}</div></div><a href="${it.url}" target="_blank" style="background:#38bdf8;color:#020617;text-decoration:none;padding:7px 12px;border-radius:8px;font-size:11.5px;font-weight:900;">Open PDF ↗</a></div>`).join('')}</div>`;
            v.style.display = 'flex';
        }
    };

    window.NexusChat = {
        activeRoom: 'casual_chat',
        filter: function(c) { curCat = c; renderRoomsList(); },
        openChatRoom: function(id, t, s) {
            mountMasterCommunityUI();
            if (id === 'jee_pcm') return NexusCards.openChallengerApp();
            if (id === 'notes_lib') return NexusCards.openPdfVaultApp();
            this.activeRoom = id || 'casual_chat';
            document.getElementById('nx-chat-room').style.display = 'flex';
            document.getElementById('nx-room-title').innerText = t || 'Chat Room';
            if (grpSub) grpSub();
            if (window.Nexus && Nexus.db) {
                grpSub = Nexus.db.collection("nexus_real_msgs").orderBy("createdAt", "desc").limit(90).onSnapshot(sn => {
                    let arr = [], me = getMe(), myU = (me && me.username ? me.username : '').toLowerCase();
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
            let txt = i.value.trim(); i.value = ''; let me = getMe(); if (!Nexus.db) return;
            await Nexus.db.collection("nexus_real_msgs").add({ roomId: this.activeRoom, sender: me.name || me.username, username: me.username, text: txt, createdAt: Date.now() });
        }
    };

    mountMasterCommunityUI();
    setInterval(mountMasterCommunityUI, 350);
})();
// === END CARDS.JS ===
