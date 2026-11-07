// === CARDS.JS (v22.0 GROUP CHAT WITH HEADER ⋮ MENU + MESSAGE ⋯ DOTS MENU + 12-OPTION '+' TRAY) ===
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

    function getMe() {
        try { if (window.Nexus && Nexus.getCurrentUser) return Nexus.getCurrentUser(); } catch (e) {}
        return (window.Nexus && Nexus.currentUser) || { username: 'mohiy', name: 'Mohit_01' };
    }

    function mountMasterCommunityUI() {
        const tab = document.getElementById('tab-community');
        if (tab && !document.getElementById('nx-v22-comm-root')) {
            tab.innerHTML = `<div id="nx-v22-comm-root" style="padding:10px 12px 90px; display:block !important;">
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
                <div id="nx-v22-rooms-list" style="display:flex !important; flex-direction:column; gap:10px;"></div>
            </div>`;
            renderRoomsList();
        }
        let m = document.getElementById('nx-chat-room');
        if (!m) { m = document.createElement('div'); m.id = 'nx-chat-room'; document.body.appendChild(m); }
        if (!m.getAttribute('data-v22')) {
            m.setAttribute('data-v22', '1');
            m.style.cssText = 'position:fixed;inset:0;width:100%;max-width:640px;height:100dvh;margin:0 auto;background:#090d16;z-index:100300;display:none;flex-direction:column;';
            m.innerHTML = `
                <div style="height:56px;background:#111b21;border-bottom:1px solid #1e293b;display:flex;align-items:center;justify-content:space-between;padding:0 12px;flex-shrink:0;">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <button onclick="NexusChat.closeChatRoom()" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">←</button>
                        <div>
                            <div id="nx-room-title" style="font-size:14.5px;font-weight:900;color:#fff;">Chat</div>
                            <div style="font-size:11px;color:#10b981;">Live Room • Tap ⋯ on any message</div>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <button onclick="if(window.NexusWatchParty)NexusWatchParty.openModal(false,'yt');" style="background:#1e293b;color:#fff;border:1px solid #334155;padding:5px 9px;border-radius:8px;font-size:11px;font-weight:800;cursor:pointer;">▶️ TV</button>
                        <button onclick="NexusCards.openPdfVaultApp()" style="background:#1e293b;color:#fff;border:1px solid #334155;padding:5px 9px;border-radius:8px;font-size:11px;font-weight:800;cursor:pointer;">📄 PDF</button>
                        <button onclick="if(window.NexusDM)NexusDM.openHeaderDotsMenu();" style="width:34px;height:34px;border-radius:50%;background:#1f2c34;border:1px solid #334155;color:#e2e8f0;font-size:18px;font-weight:900;cursor:pointer;">⋮</button>
                    </div>
                </div>
                <div id="nx-room-messages" style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;"></div>

                <!-- FULL 12-OPTION '+' TRAY FOR GROUP CHAT (INSTEAD OF OPENING GALLERY DIRECTLY!) -->
                <div id="nx-grp-bottom-tray" style="display:none;grid-template-columns:repeat(4,1fr);gap:8px;padding:12px;background:#111b21;border-top:1.5px solid #10b981;">
                    <button type="button" onclick="document.getElementById('nx-grp-bottom-tray').style.display='none';if(window.NexusVoice)NexusVoice.pickPhotos('group');" style="background:#182229;border:1px solid #f43f5e;color:#fff;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">📷<br>Photo</button>
                    <button type="button" onclick="document.getElementById('nx-grp-bottom-tray').style.display='none';if(window.NexusVoice)NexusVoice.pickPhotos('group');" style="background:#182229;border:1px dashed #10b981;color:#10b981;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">1️⃣<br>View-Once</button>
                    <button type="button" onclick="document.getElementById('nx-grp-bottom-tray').style.display='none';NexusCards.openPdfVaultApp();" style="background:#182229;border:1px solid #64748b;color:#e2e8f0;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">📁<br>PDF/File</button>
                    <button type="button" onclick="document.getElementById('nx-grp-bottom-tray').style.display='none';if(window.NexusWatchParty)NexusWatchParty.openModal(false,'mp3');" style="background:#182229;border:1px solid #a855f7;color:#d8b4fe;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">🎵<br>Full Song</button>
                    <button type="button" onclick="document.getElementById('nx-grp-bottom-tray').style.display='none';if(window.NexusWatchParty)NexusWatchParty.openModal(false,'yt');" style="background:#182229;border:1px solid #ef4444;color:#fca5a5;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">▶️<br>Watch TV</button>
                    <button type="button" onclick="document.getElementById('nx-grp-bottom-tray').style.display='none';NexusChat.quickSend('🎮 Let\\'s play 2P Quiz Battle!');" style="background:#182229;border:1px solid #3b82f6;color:#93c5fd;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">🎮<br>2P Game</button>
                    <button type="button" onclick="document.getElementById('nx-grp-bottom-tray').style.display='none';if(window.NexusAI)NexusAI.openStudio();" style="background:#182229;border:1px solid #8b5cf6;color:#c4b5fd;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">🤖<br>Ask AI</button>
                    <button type="button" onclick="document.getElementById('nx-grp-bottom-tray').style.display='none';NexusChat.promptSend('⚡ 30s QUIZ: ');" style="background:#182229;border:1px solid #eab308;color:#fde047;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">⚡<br>30s Quiz</button>
                    <button type="button" onclick="document.getElementById('nx-grp-bottom-tray').style.display='none';if(window.NexusBoard)NexusBoard.openWhiteboard('group');" style="background:#182229;border:1px solid #10b981;color:#6ee7b7;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">🎨<br>Sketch</button>
                    <button type="button" onclick="document.getElementById('nx-grp-bottom-tray').style.display='none';NexusChat.promptSend('🔑 Pass-Locked Note: ');" style="background:#182229;border:1px solid #f59e0b;color:#fcd34d;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">🔑<br>Pass-Lock</button>
                    <button type="button" onclick="document.getElementById('nx-grp-bottom-tray').style.display='none';NexusChat.promptSend('✨ STATUS: ');" style="background:#182229;border:1px solid #ec4899;color:#f9a8d4;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">📸<br>Status Card</button>
                    <button type="button" onclick="document.getElementById('nx-grp-bottom-tray').style.display='none';NexusChat.promptSend('💻 CODE:\\n');" style="background:#182229;border:1px solid #06b6d4;color:#67e8f9;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">💻<br>Send Code</button>
                </div>

                <div style="padding:8px 10px;background:#111b21;display:flex;align-items:center;gap:7px;flex-shrink:0;">
                    <input id="nx-chat-msg-in" placeholder="Message..." onkeydown="if(event.key==='Enter')NexusChat.sendChatMessage()" style="flex:1;background:#1f2c34;border:1px solid #334155;color:#fff;padding:10px 14px;border-radius:99px;outline:none;">
                    <button type="button" onclick="const t=document.getElementById('nx-grp-bottom-tray');if(t)t.style.display=t.style.display==='none'?'grid':'none';" style="width:38px;height:38px;border-radius:50%;background:#1f2c34;color:#10b981;border:1.5px solid #10b981;font-size:18px;font-weight:900;cursor:pointer;">+</button>
                    <button type="button" onclick="if(window.NexusVoice)NexusVoice.startRec('group');" style="width:38px;height:38px;border-radius:50%;background:#1f2c34;color:#38bdf8;border:none;font-size:16px;cursor:pointer;">🎙️</button>
                    <button type="button" onclick="NexusChat.sendChatMessage()" style="width:42px;height:42px;border-radius:50%;background:#10b981;color:#020617;border:none;font-size:17px;font-weight:900;cursor:pointer;">➤</button>
                </div>
            `;
        }
    }

    function renderRoomsList() {
        const box = document.getElementById('nx-v22-rooms-list');
        if (!box) return;
        box.innerHTML = ROOMS.filter(r => curCat === 'all' || r.cat === curCat).map(r => `<div onclick="NexusChat.openChatRoom('${r.id}','${r.t}','${r.s}')" style="background:#111827;border:1.5px solid #1e293b;border-radius:16px;padding:13px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;"><div style="display:flex;align-items:center;gap:11px;"><div style="width:42px;height:42px;border-radius:12px;border:1px solid ${r.c};display:flex;align-items:center;justify-content:center;font-size:19px;">${r.ic}</div><div><div style="font-size:14px;font-weight:900;color:#fff;">${r.t}</div><div style="font-size:11.5px;color:#10b981;">${prevMap[r.id] || r.s}</div></div></div><span style="background:#10b981;color:#020617;font-size:11px;font-weight:900;padding:3px 8px;border-radius:99px;">${r.b}</span></div>`).join('');
    }

    window.NexusCards = {
        openChallengerApp: function() {
            let p = document.getElementById('nx-challenger-v22');
            if (!p) { p = document.createElement('div'); p.id = 'nx-challenger-v22'; p.style.cssText = 'position:fixed;inset:0;width:100%;max-width:640px;height:100dvh;margin:0 auto;background:#090d16;z-index:100450;display:none;flex-direction:column;'; document.body.appendChild(p); }
            p.innerHTML = `<div style="height:52px;background:#0f172a;border-bottom:1.5px solid #f59e0b;display:flex;align-items:center;justify-content:space-between;padding:0 12px;"><strong style="color:#fde047;font-size:14px;">🔥 Challenger Live Test Series</strong><button onclick="document.getElementById('nx-challenger-v22').style.display='none'" style="background:#ef4444;border:none;color:#fff;padding:6px 12px;border-radius:8px;font-weight:900;">Close ✕</button></div><iframe src="https://challengers-live.netlify.app" style="flex:1;width:100%;border:none;background:#090d16;" allow="fullscreen"></iframe>`;
            p.style.display = 'flex';
        },
        openPdfVaultApp: function() {
            let v = document.getElementById('nx-pdf-v22');
            if (!v) { v = document.createElement('div'); v.id = 'nx-pdf-v22'; v.style.cssText = 'position:fixed;inset:0;width:100%;max-width:640px;height:100dvh;margin:0 auto;background:#090d16;z-index:100450;display:none;flex-direction:column;'; document.body.appendChild(v); }
            v.innerHTML = `<div style="height:52px;background:#0f172a;border-bottom:1.5px solid #38bdf8;display:flex;align-items:center;justify-content:space-between;padding:0 12px;"><strong style="color:#38bdf8;font-size:14px;">📚 Nexus PDF Study Vault</strong><button onclick="document.getElementById('nx-pdf-v22').style.display='none'" style="background:#ef4444;border:none;color:#fff;padding:6px 12px;border-radius:8px;font-weight:900;">Close ✕</button></div><div style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:10px;">${PDFS.map(it => `<div style="background:#111827;border:1px solid #1e293b;border-left:4px solid #38bdf8;border-radius:12px;padding:12px;display:flex;align-items:center;justify-content:space-between;"><div><div style="font-size:13px;font-weight:900;color:#fff;">${it.title}</div><div style="font-size:11px;color:#10b981;">🏷️ ${it.sub}</div></div><a href="${it.url}" target="_blank" style="background:#38bdf8;color:#020617;text-decoration:none;padding:7px 12px;border-radius:8px;font-size:11.5px;font-weight:900;">Open PDF ↗</a></div>`).join('')}</div>`;
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
                    sn.forEach(d => { let x = d.data(); if ((x.roomId || 'casual_chat') === this.activeRoom && !x.deleted) arr.push(Object.assign({ id: d.id }, x)); });
                    arr.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                    const b = document.getElementById('nx-room-messages');
                    if (b) {
                        b.innerHTML = arr.map(m => {
                            let mine = String(m.username || '').toLowerCase() === myU;
                            let safeId = String(m.id || '').replace(/'/g, "\\'");
                            let safeTxt = String(m.text || '').replace(/'/g, "\\'");
                            return `<div style="display:flex;flex-direction:column;align-items:${mine?'flex-end':'flex-start'};margin:4px 0;">
                                <div style="max-width:80%;min-width:115px;background:${mine?'#005c4b':'#1f2c34'};color:#fff;padding:8px 11px;border-radius:12px;">
                                    <div onclick="if(window.Nexus&&Nexus.openPublicProfile)Nexus.openPublicProfile('${m.username||m.sender}')" style="font-size:10.5px;color:#38bdf8;font-weight:900;cursor:pointer;margin-bottom:2px;">@${m.username || m.sender || 'user'}</div>
                                    ${m.imgUrl?`<img src="${m.imgUrl}" style="max-width:200px;border-radius:8px;margin:4px 0;display:block;">`:''}
                                    <div style="font-size:13.5px;word-break:break-word;">${(m.text || '').replace(/</g, '&lt;')}</div>
                                    <div style="display:flex;justify-content:flex-end;margin-top:4px;">
                                        <button type="button" onclick="NexusChat.openGrpMsgMenu('${safeId}','${safeTxt}')" style="background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.2);color:#cbd5e1;border-radius:10px;padding:1px 7px;font-size:12px;font-weight:900;cursor:pointer;">⋯</button>
                                    </div>
                                </div>
                            </div>`;
                        }).join('');
                        b.scrollTop = b.scrollHeight;
                    }
                });
            }
        },
        openGrpMsgMenu: function(msgId, oldTxt) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (!modal) return;
            modal.innerHTML = `<div style="width:100%;max-width:340px;background:#111b21;border:1.5px solid #334155;border-radius:20px;padding:14px;display:flex;flex-direction:column;gap:8px;">
                <button onclick="document.getElementById('nx-msg-action-modal').style.display='none';const i=document.getElementById('nx-chat-msg-in');if(i){i.value='↩️ ${oldTxt.substring(0,25)}: ';i.focus();}" style="padding:10px;border-radius:12px;background:#1f2c34;border:none;color:#fff;font-weight:800;text-align:left;cursor:pointer;">↩️ Reply to Message</button>
                <button onclick="document.getElementById('nx-msg-action-modal').style.display='none';navigator.clipboard.writeText('${oldTxt}');if(window.Nexus)Nexus.toast('📋 Copied!');" style="padding:10px;border-radius:12px;background:#1f2c34;border:none;color:#fff;font-weight:800;text-align:left;cursor:pointer;">📋 Copy Text</button>
                <button onclick="document.getElementById('nx-msg-action-modal').style.display='none';let n=prompt('Edit Message:','${oldTxt}');if(n&&Nexus.db)Nexus.db.collection('nexus_real_msgs').doc('${msgId}').set({text:n},{merge:true});" style="padding:10px;border-radius:12px;background:#1f2c34;border:none;color:#38bdf8;font-weight:800;text-align:left;cursor:pointer;">✏️ Edit Message</button>
                <button onclick="document.getElementById('nx-msg-action-modal').style.display='none';if(Nexus.db)Nexus.db.collection('nexus_real_msgs').doc('${msgId}').set({deleted:true},{merge:true});" style="padding:10px;border-radius:12px;background:#1f2c34;border:none;color:#f87171;font-weight:800;text-align:left;cursor:pointer;">🗑️ Delete for Everyone</button>
                <button onclick="document.getElementById('nx-msg-action-modal').style.display='none'" style="padding:8px;background:none;border:none;color:#94a3b8;font-weight:800;cursor:pointer;">Cancel</button>
            </div>`;
            modal.style.display = 'flex';
        },
        quickSend: function(t) { const i = document.getElementById('nx-chat-msg-in'); if (i) { i.value = t; this.sendChatMessage(); } },
        promptSend: function(prefix) { let v = prompt("Enter text:"); if (v) this.quickSend(prefix + v); },
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
