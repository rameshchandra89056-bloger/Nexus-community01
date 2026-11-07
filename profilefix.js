// === PROFILEFIX.JS (v20.0 FULL 1:1 DM + MESSAGE ACTION MENU + FULL + TRAY OPTIONS + DIWALI SPECIAL THEME!) ===
(function() {
    let dmSub = null, pUser = '', pName = '';
    const rKey = (a, b) => [String(a || '').toLowerCase().trim(), String(b || '').toLowerCase().trim()].sort().join('__');

    function getMe() {
        try { if (window.Nexus && Nexus.getCurrentUser) { let u = Nexus.getCurrentUser(); if (u) return u; } } catch (e) {}
        try { let s = localStorage.getItem('nexus_current_user') || localStorage.getItem('nexus_user'); if (s) return JSON.parse(s); } catch (e) {}
        return { username: 'mohiy', name: 'Mohit_01' };
    }

    function ensureDmWindow() {
        let r = document.getElementById('nx-dm-dedicated-root');
        if (!r) { r = document.createElement('div'); r.id = 'nx-dm-dedicated-root'; document.body.appendChild(r); }
        if (!r.getAttribute('data-v20')) {
            r.setAttribute('data-v20', '1');
            r.style.cssText = 'position:fixed;inset:0;width:100%;max-width:640px;height:100dvh;margin:0 auto;background:#0b141a;z-index:100480;display:none;flex-direction:column;';
            r.innerHTML = `<div style="height:54px;background:#111b21;border-bottom:1px solid #1e293b;display:flex;align-items:center;justify-content:space-between;padding:0 12px;"><div style="display:flex;align-items:center;gap:10px;"><button onclick="NexusDM.closeDirectChat()" style="background:none;border:none;color:#fff;font-size:20px;">←</button><div><div id="nx-dm-partner-name" style="font-size:14.5px;font-weight:900;color:#fff;">Friend</div><div style="font-size:10.5px;color:#10b981;">🪔 Happy Diwali • Direct Chat</div></div></div><div style="display:flex;gap:6px;"><button onclick="if(window.NexusWatchParty)NexusWatchParty.openModal(true,'mp3');" style="background:#1e293b;color:#10b981;border:1px solid #10b981;padding:5px 9px;border-radius:8px;font-size:11px;font-weight:900;">🎵 DJ</button><button onclick="if(window.NexusWatchParty)NexusWatchParty.openModal(true,'yt');" style="background:#1e293b;color:#fca5a5;border:1px solid #ef4444;padding:5px 9px;border-radius:8px;font-size:11px;font-weight:900;">▶️ TV</button></div></div>
            <div id="nx-dm-msgs-box" style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:6px;"></div>
            
            <!-- Full Restored + Tray Options -->
            <div id="nx-dm-bottom-tray" style="display:none;grid-template-columns:repeat(4,1fr);gap:8px;padding:12px;background:#111b21;border-top:1.5px solid #10b981;">
                <button type="button" onclick="document.getElementById('nx-dm-bottom-tray').style.display='none';if(window.NexusVoice)NexusVoice.pickPhotos('dm');" style="background:#182229;border:1px solid #334155;color:#fff;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">📷<br>Photo</button>
                <button type="button" onclick="document.getElementById('nx-dm-bottom-tray').style.display='none';if(window.NexusVoice)NexusVoice.pickPhotos('dm');" style="background:#182229;border:1px dashed #10b981;color:#10b981;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">1️⃣<br>View-Once</button>
                <button type="button" onclick="document.getElementById('nx-dm-bottom-tray').style.display='none';if(window.NexusWatchParty)NexusWatchParty.openModal(true,'mp3');" style="background:#182229;border:1px solid #a78bfa;color:#d8b4fe;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">🎵<br>Full Song</button>
                <button type="button" onclick="document.getElementById('nx-dm-bottom-tray').style.display='none';if(window.NexusWatchParty)NexusWatchParty.openModal(true,'yt');" style="background:#182229;border:1px solid #ef4444;color:#fca5a5;padding:10px 4px;border-radius:12px;font-size:11px;font-weight:800;cursor:pointer;">▶️<br>Watch TV</button>
            </div>

            <div style="padding:8px 10px;background:#111b21;display:flex;align-items:center;gap:7px;"><input id="nx-dm-input" placeholder="Message..." onkeydown="if(event.key==='Enter')NexusDM.sendDM()" style="flex:1;background:#1f2c34;border:1px solid #334155;color:#fff;padding:10px 14px;border-radius:99px;outline:none;"><button onclick="const t=document.getElementById('nx-dm-bottom-tray');if(t)t.style.display=t.style.display==='none'?'grid':'none';" style="width:38px;height:38px;border-radius:50%;background:#1f2c34;color:#10b981;border:1.5px solid #10b981;font-weight:900;cursor:pointer;">+</button><button onclick="if(window.NexusVoice)NexusVoice.startRec('dm');" style="width:38px;height:38px;border-radius:50%;background:#1f2c34;color:#38bdf8;border:none;cursor:pointer;">🎙️</button><button onclick="NexusDM.sendDM()" style="width:42px;height:42px;border-radius:50%;background:#10b981;color:#020617;border:none;font-weight:900;cursor:pointer;">➤</button></div>`;
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
                            if (m.deleted) return `<div style="display:flex;justify-content:${mine?'flex-end':'flex-start'};"><div style="background:rgba(239,68,68,0.15);border:1px dashed #f87171;color:#fecaca;padding:5px 10px;border-radius:10px;font-size:11.5px;">🚫 Message deleted</div></div>`;
                            let pics = (Array.isArray(m.imgUrls) && m.imgUrls.length) ? m.imgUrls : (m.imgUrl ? [m.imgUrl] : []);
                            let media = pics.length ? `<div style="display:flex;gap:6px;overflow-x:auto;max-width:230px;margin-bottom:4px;">${pics.map(x => `<img src="${x}" onclick="event.stopPropagation();window.open('${x}','_blank')" style="width:185px;height:190px;object-fit:cover;border-radius:10px;">`).join('')}</div>` : '';
                            if (m.audioData) media += `<audio src="${m.audioData}" controls style="height:32px;max-width:200px;margin-bottom:4px;"></audio>`;
                            return `<div class="nx-dm-bubble-anim" data-message-id="${m.id}" onclick="NexusDM.openMsgActionMenu('${safeId}')" style="display:flex;flex-direction:column;align-items:${mine?'flex-end':'flex-start'};margin:4px 0;cursor:pointer;"><div style="max-width:78%;background:${mine?'#005c4b':'#1f2c34'};color:#fff;padding:8px 11px;border-radius:12px;">${media}<div style="font-size:13.5px;">${(m.text || '').replace(/</g, '&lt;')}</div></div>${m.reaction?`<span style="font-size:11px;background:#182229;padding:2px 6px;border-radius:10px;">${m.reaction}</span>`:''}</div>`;
                        }).join('') : `<div style="text-align:center;padding:30px;color:#94a3b8;font-size:12.5px;">🪔 Say Happy Diwali to start chatting with ${pName}!</div>`;
                        box.scrollTop = box.scrollHeight;
                    }
                });
            }
        },
        closeDirectChat: function() { if (dmSub) dmSub(); document.getElementById('nx-dm-dedicated-root').style.display = 'none'; },
        sendDM: async function() {
            const i = document.getElementById('nx-dm-input'); if (!i || !i.value.trim()) return;
            let txt = i.value.trim(); i.value = ''; let me = getMe(); if (!Nexus.db || !pUser) return;
            await Nexus.db.collection("nexus_private_dms").add({ roomKey: rKey(me.username, pUser), fromUser: me.username, fromName: me.name || me.username, toUser: pUser, text: txt, createdAt: Date.now(), seen: false });
        },
        openMsgActionMenu: function(msgId) {
            ensureDmWindow();
            const modal = document.getElementById('nx-msg-action-modal');
            if (!modal) return;
            let safeId = String(msgId).replace(/'/g, "\\'");
            const emojis = ['❤️', '😂', '🔥', '👍', '🙏', '💯'];
            modal.innerHTML = `<div style="width:100%;max-width:340px;background:#111b21;border:1.5px solid #334155;border-radius:20px;padding:14px;display:flex;flex-direction:column;gap:8px;">
                <div style="display:flex;justify-content:space-between;gap:4px;background:#0b141a;padding:8px;border-radius:14px;">${emojis.map(em => `<button type="button" onclick="if(window.NexusDmTools)NexusDmTools.react('${safeId}','${em}');else document.getElementById('nx-msg-action-modal').style.display='none';" style="background:none;border:none;font-size:22px;cursor:pointer;">${em}</button>`).join('')}</div>
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

        btns.forEach(b => { if (b !== followBtn && !b.classList.contains('nx-msg-v20') && ((b.innerText || '').includes('Message') || b.id === 'nx-dm-trigger-btn')) b.remove(); });
        let row = followBtn.parentElement;
        if (!row) return;
        row.style.cssText = 'display:grid !important; grid-template-columns:1fr 1fr !important; gap:10px !important; width:100% !important;';
        followBtn.style.cssText += ';width:100% !important; height:44px !important; margin:0 !important;';

        let msgBtn = row.querySelector('.nx-msg-v20');
        if (!msgBtn) {
            msgBtn = document.createElement('button'); msgBtn.type = 'button'; msgBtn.className = 'nx-msg-v20';
            msgBtn.style.cssText = 'width:100% !important; height:44px !important; background:#10b981 !important; color:#020617 !important; border:none !important; border-radius:12px !important; font-weight:900 !important; font-size:13.5px !important; cursor:pointer !important; display:flex !important; align-items:center !important; justify-content:center !important; gap:6px !important;';
            msgBtn.innerHTML = '💬 Message';
            row.appendChild(msgBtn);
        }
        msgBtn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); modal.style.display = 'none'; window.NexusDM.openDirectChat(targetU, targetN, ''); };
    }

    // --- DIWALI SPECIAL GREETING BANNER FOR USERS ---
    function injectDiwaliBanner() {
        const topHeader = document.querySelector('header') || document.querySelector('.nexus-top-bar') || document.getElementById('nx-dm-inbox-banner');
        if (topHeader && !document.getElementById('nx-diwali-banner-v20')) {
            const banner = document.createElement('div');
            banner.id = 'nx-diwali-banner-v20';
            banner.style.cssText = 'background:linear-gradient(135deg,#7c2d12,#ea580c,#f59e0b); color:#fff; padding:7px 12px; font-size:11.5px; font-weight:900; text-align:center; border-bottom:1.5px solid #fde047; box-shadow:0 3px 10px rgba(245,158,11,0.4); z-index:100;';
            banner.innerHTML = '🪔 Happy Diwali & Chhoti Diwali from Nexus Family! May your code compile without errors! ✨';
            topHeader.parentNode.insertBefore(banner, topHeader);
        }
    }

    bindOriginalProfileMessageBtn();
    injectDiwaliBanner();
    setInterval(bindOriginalProfileMessageBtn, 250);
})();
// === END PROFILEFIX.JS ===
