// === PROFILEFIX.JS (v22.0 RESTORES HEADER ⋮ DOTS + MESSAGE ⋯ DOTS + 12-OPTION '+' TRAY IN 1:1 DM) ===
(function() {
    let dmSub = null, pUser = '', pName = '', repObj = null;
    const rKey = (a, b) => [String(a || '').toLowerCase().trim(), String(b || '').toLowerCase().trim()].sort().join('__');

    function getMe() {
        try { if (window.Nexus && Nexus.getCurrentUser) { let u = Nexus.getCurrentUser(); if (u) return u; } } catch (e) {}
        try { let s = localStorage.getItem('nexus_current_user') || localStorage.getItem('nexus_user'); if (s) return JSON.parse(s); } catch (e) {}
        return { username: 'mohiy', name: 'Mohit_01' };
    }

    function fmtTime(ts) {
        if (!ts) return '';
        try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }); } catch (e) { return ''; }
    }

    function ensureDmWindow() {
        let r = document.getElementById('nx-dm-dedicated-root');
        if (!r) { r = document.createElement('div'); r.id = 'nx-dm-dedicated-root'; document.body.appendChild(r); }
        if (!r.getAttribute('data-v22')) {
            r.setAttribute('data-v22', '1');
            r.style.cssText = 'position:fixed;inset:0;width:100%;max-width:640px;height:100dvh;margin:0 auto;background:#0b141a;z-index:100480;display:none;flex-direction:column;';
            r.innerHTML = `
                <div style="height:56px;background:#111b21;border-bottom:1px solid #1e293b;display:flex;align-items:center;justify-content:space-between;padding:0 12px;flex-shrink:0;">
                    <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
                        <button onclick="NexusDM.closeDirectChat()" style="background:none;border:none;color:#fff;font-size:20px;cursor:pointer;">←</button>
                        <div id="nx-dm-partner-dp" style="width:36px;height:36px;border-radius:50%;background:#2563eb;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;overflow:hidden;flex-shrink:0;">U</div>
                        <div style="min-width:0;flex:1;">
                            <div id="nx-dm-partner-name" style="font-size:14.5px;font-weight:900;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Friend</div>
                            <div style="font-size:10.5px;color:#10b981;">🟢 1:1 Direct Chat</div>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <button onclick="if(window.NexusWatchParty)NexusWatchParty.openModal(true,'mp3');" style="background:#1e293b;color:#10b981;border:1px solid #10b981;padding:5px 9px;border-radius:8px;font-size:11px;font-weight:900;cursor:pointer;">🎵 DJ</button>
                        <button onclick="if(window.NexusWatchParty)NexusWatchParty.openModal(true,'yt');" style="background:#1e293b;color:#fca5a5;border:1px solid #ef4444;padding:5px 9px;border-radius:8px;font-size:11px;font-weight:900;cursor:pointer;">▶️ TV</button>
                        <button onclick="NexusDM.openHeaderDotsMenu()" style="width:34px;height:34px;border-radius:50%;background:#1f2c34;border:1px solid #334155;color:#e2e8f0;font-size:18px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;">⋮</button>
                    </div>
                </div>

                <div id="nx-dm-msgs-box" style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;"></div>
                <div id="nx-dm-reply-preview" style="display:none;padding:6px 12px;background:#182229;border-left:4px solid #38bdf8;color:#38bdf8;font-size:11.5px;align-items:center;justify-content:space-between;"></div>

                <!-- FULL 12-OPTION '+' TRAY (AS IN SCREENSHOT 1000073553.jpg) -->
                <div id="nx-dm-bottom-tray" style="display:none;grid-template-columns:repeat(4,1fr);gap:8px;padding:12px;background:#111b21;border-top:1.5px solid #10b981;">
                    <button type="button" onclick="NexusDM.trayAct('photo')" style="background:#182229;border:1px solid #f43f5e;color:#fff;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">📷<br>Photo</button>
                    <button type="button" onclick="NexusDM.trayAct('viewonce')" style="background:#182229;border:1px dashed #10b981;color:#10b981;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">1️⃣<br>View-Once</button>
                    <button type="button" onclick="NexusDM.trayAct('pdf')" style="background:#182229;border:1px solid #64748b;color:#e2e8f0;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">📁<br>PDF/File</button>
                    <button type="button" onclick="NexusDM.trayAct('song')" style="background:#182229;border:1px solid #a855f7;color:#d8b4fe;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">🎵<br>Full Song</button>
                    <button type="button" onclick="NexusDM.trayAct('tv')" style="background:#182229;border:1px solid #ef4444;color:#fca5a5;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">▶️<br>Watch TV</button>
                    <button type="button" onclick="NexusDM.trayAct('game')" style="background:#182229;border:1px solid #3b82f6;color:#93c5fd;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">🎮<br>2P Game</button>
                    <button type="button" onclick="NexusDM.trayAct('ai')" style="background:#182229;border:1px solid #8b5cf6;color:#c4b5fd;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">🤖<br>Ask AI</button>
                    <button type="button" onclick="NexusDM.trayAct('quiz')" style="background:#182229;border:1px solid #eab308;color:#fde047;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">⚡<br>30s Quiz</button>
                    <button type="button" onclick="NexusDM.trayAct('sketch')" style="background:#182229;border:1px solid #10b981;color:#6ee7b7;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">🎨<br>Sketch</button>
                    <button type="button" onclick="NexusDM.trayAct('lock')" style="background:#182229;border:1px solid #f59e0b;color:#fcd34d;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">🔑<br>Pass-Lock</button>
                    <button type="button" onclick="NexusDM.trayAct('status')" style="background:#182229;border:1px solid #ec4899;color:#f9a8d4;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">📸<br>Status Card</button>
                    <button type="button" onclick="NexusDM.trayAct('code')" style="background:#182229;border:1px solid #06b6d4;color:#67e8f9;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">💻<br>Send Code</button>
                </div>

                <div style="padding:8px 10px;background:#111b21;display:flex;align-items:center;gap:7px;flex-shrink:0;">
                    <input id="nx-dm-input" placeholder="Message..." onkeydown="if(event.key==='Enter')NexusDM.sendDM()" style="flex:1;background:#1f2c34;border:1px solid #334155;color:#fff;padding:10px 14px;border-radius:99px;outline:none;">
                    <button type="button" onclick="const t=document.getElementById('nx-dm-bottom-tray');if(t)t.style.display=t.style.display==='none'?'grid':'none';" style="width:38px;height:38px;border-radius:50%;background:#1f2c34;color:#10b981;border:1.5px solid #10b981;font-size:18px;font-weight:900;cursor:pointer;">+</button>
                    <button type="button" onclick="if(window.NexusVoice)NexusVoice.startRec('dm');" style="width:38px;height:38px;border-radius:50%;background:#1f2c34;color:#38bdf8;border:none;font-size:16px;cursor:pointer;">🎙️</button>
                    <button type="button" onclick="NexusDM.sendDM()" style="width:42px;height:42px;border-radius:50%;background:#10b981;color:#020617;border:none;font-size:17px;font-weight:900;cursor:pointer;">➤</button>
                </div>
            `;
        }
        if (!document.getElementById('nx-msg-action-modal')) {
            let m = document.createElement('div'); m.id = 'nx-msg-action-modal';
            m.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,0.85);z-index:100550;display:none;align-items:center;justify-content:center;padding:16px;';
            m.onclick = e => { if (e.target === m) m.style.display = 'none'; };
            document.body.appendChild(m);
        }
    }

    window.NexusDM = {
        activePartner: '',
        openDirectChat: function(u, n, dp) {
            ensureDmWindow();
            let me = getMe();
            pUser = String(u || '').replace(/^@/, '').trim();
            if (!pUser) return;
            this.activePartner = pUser; pName = n || pUser;
            ['nx-global-modal', 'nx-vip-profile-modal', 'nx-dedicated-dm-home-screen'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
            const root = document.getElementById('nx-dm-dedicated-root');
            if (root) root.style.setProperty('display', 'flex', 'important');
            const nameEl = document.getElementById('nx-dm-partner-name');
            if (nameEl) nameEl.innerText = pName;
            if (dmSub) dmSub();
            let myU = (me && me.username ? me.username : 'mohiy').toLowerCase().trim(), tU = pUser.toLowerCase().trim(), rk = rKey(myU, tU);
            if (window.Nexus && Nexus.db) {
                dmSub = Nexus.db.collection("nexus_private_dms").orderBy("createdAt", "desc").limit(140).onSnapshot(sn => {
                    let arr = [];
                    sn.forEach(doc => {
                        let d = doc.data(), f = String(d.fromUser || '').toLowerCase().trim(), t = String(d.toUser || '').toLowerCase().trim();
                        if (d.roomKey === rk || (f === myU && t === tU) || (f === tU && t === myU)) arr.push(Object.assign({ id: doc.id }, d));
                    });
                    arr.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                    const box = document.getElementById('nx-dm-msgs-box');
                    if (box) {
                        box.innerHTML = arr.length ? arr.map(m => {
                            let mine = String(m.fromUser || '').toLowerCase().trim() === myU;
                            let safeId = String(m.id || '').replace(/'/g, "\\'");
                            if (m.deleted) return `<div style="display:flex;justify-content:${mine?'flex-end':'flex-start'};"><div style="background:rgba(239,68,68,0.15);border:1px dashed #f87171;color:#fecaca;padding:6px 12px;border-radius:12px;font-size:12px;font-style:italic;">🚫 This message was deleted by <b>${m.deletedByName || '@' + (m.deletedBy || 'user')}</b></div></div>`;
                            let pics = (Array.isArray(m.imgUrls) && m.imgUrls.length) ? m.imgUrls : (m.imgUrl ? [m.imgUrl] : []);
                            let media = pics.length ? `<div style="display:flex;gap:6px;overflow-x:auto;max-width:230px;margin-bottom:4px;">${pics.map(x => `<img src="${x}" onclick="event.stopPropagation();window.open('${x}','_blank')" style="width:185px;height:190px;object-fit:cover;border-radius:10px;">`).join('')}</div>` : '';
                            if (m.audioData) media += `<audio src="${m.audioData}" controls style="height:32px;max-width:200px;margin-bottom:4px;"></audio>`;
                            let repH = m.replyTo ? `<div style="background:rgba(0,0,0,0.28);border-left:3px solid #38bdf8;padding:4px 8px;border-radius:6px;font-size:11px;color:#cbd5e1;margin-bottom:4px;"><b>${m.replyTo.sender}:</b> ${m.replyTo.text}</div>` : '';
                            return `<div class="nx-dm-bubble-anim" data-message-id="${m.id}" onclick="NexusDM.openMsgActionMenu('${safeId}')" style="display:flex;flex-direction:column;align-items:${mine?'flex-end':'flex-start'};margin:4px 0;cursor:pointer;">
                                <div style="max-width:80%;min-width:110px;background:${mine?'#005c4b':'#1f2c34'};color:#fff;padding:8px 11px;border-radius:${mine?'14px 4px 14px 14px':'4px 14px 14px 14px'};box-shadow:0 2px 6px rgba(0,0,0,0.3);">
                                    ${repH}${media}
                                    <div style="font-size:13.5px;line-height:1.4;word-break:break-word;">${(m.text || '').replace(/</g, '&lt;')}</div>
                                    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:5px;">
                                        <span style="font-size:10px;color:rgba(255,255,255,0.65);">${m.edited ? '(edited) ' : ''}${fmtTime(m.createdAt)} ${mine ? '✓' : ''}</span>
                                        <button type="button" onclick="event.stopPropagation();NexusDM.openMsgActionMenu('${safeId}')" style="background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.2);color:#cbd5e1;border-radius:10px;padding:1px 7px;font-size:12px;font-weight:900;cursor:pointer;">⋯</button>
                                    </div>
                                </div>
                                ${m.reaction ? `<span style="font-size:11px;background:#182229;border:1px solid #10b981;padding:2px 7px;border-radius:10px;margin-top:2px;">${m.reaction}</span>` : ''}
                            </div>`;
                        }).join('') : `<div style="text-align:center;padding:30px;color:#94a3b8;font-size:12.5px;">👋 Say Hello to start chatting with ${pName}!</div>`;
                        box.scrollTop = box.scrollHeight;
                    }
                });
            }
        },
        closeDirectChat: function() { if (dmSub) dmSub(); document.getElementById('nx-dm-dedicated-root').style.display = 'none'; },
        sendDM: async function() {
            const i = document.getElementById('nx-dm-input'); if (!i || !i.value.trim()) return;
            let txt = i.value.trim(); i.value = ''; let me = getMe(); if (!Nexus.db || !pUser) return;
            let payload = { roomKey: rKey(me.username, pUser), fromUser: me.username, fromName: me.name || me.username, toUser: pUser, text: txt, replyTo: repObj || null, createdAt: Date.now(), seen: false };
            repObj = null; const rb = document.getElementById('nx-dm-reply-preview'); if (rb) rb.style.display = 'none';
            await Nexus.db.collection("nexus_private_dms").add(payload);
        },
        startReply: function(s, t) {
            repObj = { sender: s, text: t };
            const rb = document.getElementById('nx-dm-reply-preview');
            if (rb) { rb.style.display = 'flex'; rb.innerHTML = `<span>↩️ Replying to <b>${s}</b>: "${t}"</span><button onclick="NexusDM.cancelReply()" style="background:none;border:none;color:#f87171;font-weight:900;">✕</button>`; }
            document.getElementById('nx-dm-input')?.focus();
        },
        cancelReply: function() { repObj = null; const rb = document.getElementById('nx-dm-reply-preview'); if (rb) rb.style.display = 'none'; },
        trayAct: function(type) {
            const tr = document.getElementById('nx-dm-bottom-tray'); if (tr) tr.style.display = 'none';
            if (type === 'photo' || type === 'viewonce') return window.NexusVoice && NexusVoice.pickPhotos('dm');
            if (type === 'song') return window.NexusWatchParty && NexusWatchParty.openModal(true, 'mp3');
            if (type === 'tv') return window.NexusWatchParty && NexusWatchParty.openModal(true, 'yt');
            if (type === 'pdf') return window.NexusCards && NexusCards.openPdfVaultApp();
            if (type === 'ai') return window.NexusAI && NexusAI.openStudio();
            if (type === 'sketch') return window.NexusBoard && NexusBoard.openWhiteboard('dm');
            let inp = document.getElementById('nx-dm-input');
            if (type === 'code') { let c = prompt("Paste Code Snippet:"); if (c && inp) { inp.value = "💻 CODE:\n" + c; this.sendDM(); } }
            if (type === 'quiz') { let q = prompt("Enter 30s Quiz Question:"); if (q && inp) { inp.value = "⚡ 30s QUIZ: " + q; this.sendDM(); } }
            if (type === 'game') { if (inp) { inp.value = "🎮 Let's play 2P Tic-Tac-Toe Game!"; this.sendDM(); } }
            if (type === 'lock') { let p = prompt("Enter Secret Message:"); if (p && inp) { inp.value = "🔑 Locked Message: " + p; this.sendDM(); } }
            if (type === 'status') { let s = prompt("Enter Status Card Text:"); if (s && inp) { inp.value = "✨ STATUS: " + s; this.sendDM(); } }
        },
        openHeaderDotsMenu: function() {
            ensureDmWindow();
            const modal = document.getElementById('nx-msg-action-modal');
            if (!modal) return;
            modal.innerHTML = `<div style="width:100%;max-width:355px;background:#111b21;border:1.5px solid #10b981;border-radius:20px;padding:14px;display:flex;flex-direction:column;gap:8px;">
                <div style="font-size:14px;font-weight:900;color:#10b981;margin-bottom:4px;">⚙️ 1:1 Chat Tools & Options</div>
                <button onclick="document.getElementById('nx-msg-action-modal').style.display='none';if(window.NexusWatchParty)NexusWatchParty.openModal(true,'mp3');" style="padding:10px;border-radius:12px;background:#1f2c34;border:none;color:#6ee7b7;font-weight:800;text-align:left;cursor:pointer;">🎵 Listen Full Song Together (Search)</button>
                <button onclick="document.getElementById('nx-msg-action-modal').style.display='none';if(window.NexusWatchParty)NexusWatchParty.openModal(true,'yt');" style="padding:10px;border-radius:12px;background:#1f2c34;border:none;color:#fca5a5;font-weight:800;text-align:left;cursor:pointer;">▶️ In-App YouTube Watch-Party TV</button>
                <button onclick="document.getElementById('nx-msg-action-modal').style.display='none';NexusDM.trayAct('code');" style="padding:10px;border-radius:12px;background:#1f2c34;border:none;color:#fff;font-weight:800;text-align:left;cursor:pointer;">📁 Send PDF, Code or Document File</button>
                <button onclick="document.getElementById('nx-msg-action-modal').style.display='none';if(window.NexusBoard)NexusBoard.openWhiteboard('dm');" style="padding:10px;border-radius:12px;background:#1f2c34;border:none;color:#38bdf8;font-weight:800;text-align:left;cursor:pointer;">🎨 Live Doubt Whiteboard / Sketch</button>
                <button onclick="document.getElementById('nx-msg-action-modal').style.display='none';if(window.NexusScreen)NexusScreen.startShare('dm');" style="padding:10px;border-radius:12px;background:#1f2c34;border:none;color:#fde047;font-weight:800;text-align:left;cursor:pointer;">🖥️ Live Screen Share</button>
                <button onclick="document.getElementById('nx-msg-action-modal').style.display='none'" style="padding:8px;background:none;border:none;color:#94a3b8;font-weight:800;cursor:pointer;">Cancel</button>
            </div>`;
            modal.style.display = 'flex';
        },
        openMsgActionMenu: function(msgId) {
            ensureDmWindow();
            const modal = document.getElementById('nx-msg-action-modal');
            if (!modal) return;
            let safeId = String(msgId).replace(/'/g, "\\'");
            const emojis = ['❤️', '😂', '🔥', '👍', '🙏', '💯'];
            modal.innerHTML = `<div style="width:100%;max-width:345px;background:#111b21;border:1.5px solid #334155;border-radius:20px;padding:14px;display:flex;flex-direction:column;gap:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:4px;background:#0b141a;padding:8px;border-radius:14px;">
                    ${emojis.map(em => `<button type="button" onclick="if(window.NexusDmTools)NexusDmTools.react('${safeId}','${em}');else document.getElementById('nx-msg-action-modal').style.display='none';" style="background:none;border:none;font-size:22px;cursor:pointer;">${em}</button>`).join('')}
                    <button type="button" onclick="const b=document.getElementById('nx-kb-em-box');if(b){b.style.display='flex';document.getElementById('nx-kb-em-in').focus();}" style="background:#1f2c34;border:1.5px dashed #10b981;color:#10b981;border-radius:8px;padding:4px 8px;font-weight:900;cursor:pointer;">➕</button>
                </div>
                <div id="nx-kb-em-box" style="display:none;padding:6px;background:#090d16;border:1px solid #10b981;border-radius:10px;"><input id="nx-kb-em-in" placeholder="Type any keyboard emoji 😊..." oninput="if(this.value.trim()&&window.NexusDmTools)NexusDmTools.react('${safeId}',this.value.trim())" style="width:100%;background:none;border:none;color:#fff;outline:none;"></div>
                <button type="button" onclick="if(window.NexusDmTools)NexusDmTools.reply('${safeId}');" style="padding:10px;border-radius:12px;background:#1f2c34;border:none;color:#fff;font-weight:800;text-align:left;cursor:pointer;">↩️ Reply to Message</button>
                <button type="button" onclick="if(window.NexusDmTools)NexusDmTools.copy('${safeId}');" style="padding:10px;border-radius:12px;background:#1f2c34;border:none;color:#fff;font-weight:800;text-align:left;cursor:pointer;">📋 Copy Message Text</button>
                <button type="button" onclick="if(window.NexusDmTools)NexusDmTools.editMessage('${safeId}');" style="padding:10px;border-radius:12px;background:#1f2c34;border:none;color:#38bdf8;font-weight:800;text-align:left;cursor:pointer;">✏️ Edit Message</button>
                <button type="button" onclick="if(window.NexusDmTools)NexusDmTools.deleteForMe('${safeId}');" style="padding:10px;border-radius:12px;background:#1f2c34;border:none;color:#cbd5e1;font-weight:800;text-align:left;cursor:pointer;">🧹 Delete for Me</button>
                <button type="button" onclick="if(window.NexusDmTools)NexusDmTools.deleteForEveryone('${safeId}');" style="padding:10px;border-radius:12px;background:#1f2c34;border:none;color:#f87171;font-weight:800;text-align:left;cursor:pointer;">🗑️ Delete for Everyone</button>
                <button type="button" onclick="document.getElementById('nx-msg-action-modal').style.display='none'" style="padding:8px;background:none;border:none;color:#94a3b8;font-weight:800;cursor:pointer;">Cancel</button>
            </div>`;
            modal.style.display = 'flex';
        },
        openDmHubFallback: function() { let u = (Nexus.users || []).find(x => x && x.username && x.username !== 'nexus_official'); if (u) this.openDirectChat(u.username, u.name || u.username, ''); }
    };

    function bindOriginalProfileMessageBtn() {
        ensureDmWindow();
        const modal = document.getElementById('nx-global-modal');
        if (!modal || modal.style.display === 'none' || !(modal.innerText || '').includes('Member Full Profile')) return;
        const btns = Array.from(modal.querySelectorAll('button'));
        const followBtn = btns.find(b => { let t = (b.innerText || '').trim(), oc = b.getAttribute('onclick') || ''; return oc.includes('toggleFollow') || t === '+ Follow' || t === '✓ Following' || t === 'Following'; });
        if (!followBtn) return;
        let uMatch = (followBtn.getAttribute('onclick') || '').match(/'([^']+)'/) || (modal.innerText || '').match(/@([a-zA-Z0-9_.-]+)/);
        if (!uMatch || !uMatch[1]) return;
        let targetU = uMatch[1].trim();
        let uObj = (window.Nexus && Nexus.users || []).find(u => u && u.username && u.username.toLowerCase() === targetU.toLowerCase());
        let targetN = (uObj && uObj.name) ? uObj.name : targetU;

        btns.forEach(b => { if (b !== followBtn && !b.classList.contains('nx-msg-v22') && ((b.innerText || '').includes('Message') || b.id === 'nx-dm-trigger-btn')) b.remove(); });
        let row = followBtn.parentElement;
        if (!row) return;
        row.style.cssText = 'display:grid !important; grid-template-columns:1fr 1fr !important; gap:10px !important; width:100% !important;';
        followBtn.style.cssText += ';width:100% !important; height:44px !important; margin:0 !important;';

        let msgBtn = row.querySelector('.nx-msg-v22');
        if (!msgBtn) {
            msgBtn = document.createElement('button'); msgBtn.type = 'button'; msgBtn.className = 'nx-msg-v22';
            msgBtn.style.cssText = 'width:100% !important; height:44px !important; background:#10b981 !important; color:#020617 !important; border:none !important; border-radius:12px !important; font-weight:900 !important; font-size:13.5px !important; cursor:pointer !important; display:flex !important; align-items:center !important; justify-content:center !important; gap:6px !important;';
            msgBtn.innerHTML = '💬 Message';
            row.appendChild(msgBtn);
        }
        msgBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); modal.style.display = 'none'; window.NexusDM.openDirectChat(targetU, targetN, ''); };
    }

    bindOriginalProfileMessageBtn();
    setInterval(bindOriginalProfileMessageBtn, 250);
})();
// === END PROFILEFIX.JS ===
