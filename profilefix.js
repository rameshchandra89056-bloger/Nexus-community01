// === PROFILEFIX.JS (v18.0 ORIGINAL PROFILE + COMPLETE 1:1 DIRECT MESSAGE ENGINE BUILT-IN!) ===
(function() {
    let dmSub = null, pUser = '', pName = '';
    const rKey = (a, b) => [String(a || '').toLowerCase().trim(), String(b || '').toLowerCase().trim()].sort().join('__');

    function getMe() {
        try { if (window.Nexus && Nexus.getCurrentUser) { let u = Nexus.getCurrentUser(); if (u) return u; } } catch (e) {}
        try { if (window.Nexus && Nexus.currentUser) return Nexus.currentUser; } catch (e) {}
        try {
            let s = localStorage.getItem('nexus_current_user') || localStorage.getItem('nexus_user');
            if (s) return JSON.parse(s);
        } catch (e) {}
        return { username: 'mohiy', name: 'Mohit_01' };
    }

    function ensureDmWindow() {
        let r = document.getElementById('nx-dm-dedicated-root');
        if (!r) { r = document.createElement('div'); r.id = 'nx-dm-dedicated-root'; document.body.appendChild(r); }
        if (!r.getAttribute('data-v18')) {
            r.setAttribute('data-v18', '1');
            r.style.cssText = 'position:fixed;inset:0;width:100%;max-width:640px;height:100dvh;margin:0 auto;background:#0b141a;z-index:100480;display:none;flex-direction:column;';
            r.innerHTML = `<div style="height:54px;background:#111b21;border-bottom:1px solid #1e293b;display:flex;align-items:center;justify-content:space-between;padding:0 12px;"><div style="display:flex;align-items:center;gap:10px;"><button onclick="NexusDM.closeDirectChat()" style="background:none;border:none;color:#fff;font-size:20px;">←</button><div><div id="nx-dm-partner-name" style="font-size:14.5px;font-weight:900;color:#fff;">Friend</div><div style="font-size:10.5px;color:#10b981;">🟢 1:1 Direct Chat</div></div></div><div style="display:flex;gap:6px;"><button onclick="if(window.NexusWatchParty)NexusWatchParty.openModal(true,'mp3');" style="background:#1e293b;color:#10b981;border:1px solid #10b981;padding:5px 9px;border-radius:8px;font-size:11px;font-weight:900;">🎵 DJ</button><button onclick="if(window.NexusWatchParty)NexusWatchParty.openModal(true,'yt');" style="background:#1e293b;color:#fca5a5;border:1px solid #ef4444;padding:5px 9px;border-radius:8px;font-size:11px;font-weight:900;">▶️ TV</button></div></div>
            <div id="nx-dm-msgs-box" style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:6px;"></div>
            <div style="padding:8px 10px;background:#111b21;display:flex;align-items:center;gap:7px;"><input id="nx-dm-input" placeholder="Message..." onkeydown="if(event.key==='Enter')NexusDM.sendDM()" style="flex:1;background:#1f2c34;border:1px solid #334155;color:#fff;padding:10px 14px;border-radius:99px;outline:none;"><button onclick="if(window.NexusVoice)NexusVoice.pickPhotos('dm');" style="width:38px;height:38px;border-radius:50%;background:#1f2c34;color:#10b981;border:1.5px solid #10b981;font-weight:900;">+</button><button onclick="if(window.NexusVoice)NexusVoice.startRec('dm');" style="width:38px;height:38px;border-radius:50%;background:#1f2c34;color:#38bdf8;border:none;">🎙️</button><button onclick="NexusDM.sendDM()" style="width:42px;height:42px;border-radius:50%;background:#10b981;color:#020617;border:none;font-weight:900;">➤</button></div>`;
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
                            if (m.deleted) return `<div style="display:flex;justify-content:${mine?'flex-end':'flex-start'};"><div style="background:rgba(239,68,68,0.15);border:1px dashed #f87171;color:#fecaca;padding:5px 10px;border-radius:10px;font-size:11.5px;">🚫 Message deleted</div></div>`;
                            let pics = (Array.isArray(m.imgUrls) && m.imgUrls.length) ? m.imgUrls : (m.imgUrl ? [m.imgUrl] : []);
                            let media = pics.length ? `<div style="display:flex;gap:6px;overflow-x:auto;max-width:230px;">${pics.map(x => `<img src="${x}" onclick="event.stopPropagation();window.open('${x}','_blank')" style="width:185px;height:190px;object-fit:cover;border-radius:10px;">`).join('')}</div>` : '';
                            if (m.audioData) media += `<audio src="${m.audioData}" controls style="height:32px;max-width:200px;"></audio>`;
                            return `<div class="nx-dm-bubble-anim" data-message-id="${m.id}" onclick="if(window.NexusDmTools&&NexusDmTools.openMenu)NexusDmTools.openMenu('${m.id}')" style="display:flex;flex-direction:column;align-items:${mine?'flex-end':'flex-start'};margin:4px 0;cursor:pointer;"><div style="max-width:78%;background:${mine?'#005c4b':'#1f2c34'};color:#fff;padding:8px 11px;border-radius:12px;">${media}<div style="font-size:13.5px;">${(m.text || '').replace(/</g, '&lt;')}</div></div></div>`;
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
            await Nexus.db.collection("nexus_private_dms").add({ roomKey: rKey(me.username, pUser), fromUser: me.username, fromName: me.name || me.username, toUser: pUser, text: txt, createdAt: Date.now(), seen: false });
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

        btns.forEach(b => { if (b !== followBtn && !b.classList.contains('nx-msg-v18') && ((b.innerText || '').includes('Message') || b.id === 'nx-dm-trigger-btn')) b.remove(); });
        let row = followBtn.parentElement;
        if (!row) return;
        row.style.cssText = 'display:grid !important; grid-template-columns:1fr 1fr !important; gap:10px !important; width:100% !important;';
        followBtn.style.cssText += ';width:100% !important; height:44px !important; margin:0 !important;';

        let msgBtn = row.querySelector('.nx-msg-v18');
        if (!msgBtn) {
            msgBtn = document.createElement('button'); msgBtn.type = 'button'; msgBtn.className = 'nx-msg-v18';
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
