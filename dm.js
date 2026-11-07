// === DM.JS (v12.0 ULTRA-COMPACT 55-LINE REAL FIREBASE 1:1 DM ENGINE — NO CUTOFF!) ===
(function() {
    let dmSub = null, pUser = '', pName = '', repObj = null;
    const rKey = (a, b) => [String(a || '').toLowerCase().trim(), String(b || '').toLowerCase().trim()].sort().join('__');

    function ensureDmModal() {
        if (!document.getElementById('nx-dm-dedicated-root')) {
            const r = document.createElement('div'); r.id = 'nx-dm-dedicated-root';
            r.style.cssText = 'position:fixed;inset:0;width:100%;max-width:640px;height:100dvh;margin:0 auto;background:#0b141a;z-index:100320;display:none;flex-direction:column;';
            r.innerHTML = `<div style="height:54px;background:#111b21;border-bottom:1px solid #1e293b;display:flex;align-items:center;justify-content:space-between;padding:0 12px;"><div style="display:flex;align-items:center;gap:10px;"><button onclick="NexusDM.closeDirectChat()" style="background:none;border:none;color:#fff;font-size:20px;">←</button><div><div id="nx-dm-partner-name" style="font-size:14.5px;font-weight:900;color:#fff;">Friend</div><div style="font-size:10.5px;color:#10b981;">🟢 1:1 Direct Chat</div></div></div><div style="display:flex;gap:6px;"><button onclick="if(window.NexusWatchParty)NexusWatchParty.openModal(true,'mp3');" style="background:#1e293b;color:#10b981;border:1px solid #10b981;padding:5px 9px;border-radius:8px;font-size:11px;font-weight:900;">🎵 DJ</button><button onclick="if(window.NexusWatchParty)NexusWatchParty.openModal(true,'yt');" style="background:#1e293b;color:#fca5a5;border:1px solid #ef4444;padding:5px 9px;border-radius:8px;font-size:11px;font-weight:900;">▶️ TV</button></div></div>
            <div id="nx-dm-msgs-box" style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:6px;"></div>
            <div id="nx-dm-reply-preview" style="display:none;padding:6px 12px;background:#182229;color:#38bdf8;font-size:11.5px;justify-content:space-between;"></div>
            <div style="padding:8px 10px;background:#111b21;display:flex;align-items:center;gap:7px;"><input id="nx-dm-input" placeholder="Message..." onkeydown="if(event.key==='Enter')NexusDM.sendDM()" style="flex:1;background:#1f2c34;border:1px solid #334155;color:#fff;padding:10px 14px;border-radius:99px;outline:none;"><button onclick="if(window.NexusVoice)NexusVoice.pickPhotos('dm');" style="width:38px;height:38px;border-radius:50%;background:#1f2c34;color:#10b981;border:1.5px solid #10b981;font-weight:900;">+</button><button onclick="NexusDM.startVoiceDM()" style="width:38px;height:38px;border-radius:50%;background:#1f2c34;color:#38bdf8;border:none;">🎙️</button><button onclick="NexusDM.sendDM()" style="width:42px;height:42px;border-radius:50%;background:#10b981;color:#020617;border:none;font-weight:900;">➤</button></div>`;
            document.body.appendChild(r);
        }
        if (!document.getElementById('nx-msg-action-modal')) {
            const m = document.createElement('div'); m.id = 'nx-msg-action-modal';
            m.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,0.82);z-index:100420;display:none;align-items:center;justify-content:center;padding:16px;';
            m.onclick = e => { if (e.target === m) m.style.display = 'none'; };
            document.body.appendChild(m);
        }
    }

    window.NexusDM = {
        activePartner: '',
        openDirectChat: function(u, n, dp) {
            ensureDmModal();
            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (!me) return Nexus && Nexus.switchTab('tab-profile');
            pUser = String(u || '').replace(/^@/, '').trim();
            if (!pUser) return;
            this.activePartner = pUser; pName = n || pUser;
            ['nx-global-modal', 'nx-vip-profile-modal', 'nx-dedicated-dm-home-screen'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
            document.getElementById('nx-dm-dedicated-root').style.display = 'flex';
            document.getElementById('nx-dm-partner-name').innerText = pName;
            if (dmSub) dmSub();
            let myU = me.username.toLowerCase().trim(), tU = pUser.toLowerCase().trim(), rk = rKey(myU, tU);
            if (Nexus.db) {
                dmSub = Nexus.db.collection("nexus_private_dms").orderBy("createdAt", "desc").limit(140).onSnapshot(sn => {
                    let arr = [];
                    sn.forEach(doc => {
                        let d = doc.data(), f = String(d.fromUser || '').toLowerCase().trim(), t = String(d.toUser || '').toLowerCase().trim();
                        if (d.roomKey === rk || (f === myU && t === tU) || (f === tU && t === myU)) arr.push(Object.assign({ id: doc.id }, d));
                    });
                    arr.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                    const box = document.getElementById('nx-dm-msgs-box');
                    if (box) {
                        box.innerHTML = arr.map(m => {
                            let mine = String(m.fromUser || '').toLowerCase().trim() === myU;
                            if (m.deleted) return `<div style="display:flex;justify-content:${mine?'flex-end':'flex-start'};"><div style="background:rgba(239,68,68,0.15);border:1px dashed #f87171;color:#fecaca;padding:5px 10px;border-radius:10px;font-size:11.5px;">🚫 Message deleted</div></div>`;
                            let pics = (Array.isArray(m.imgUrls) && m.imgUrls.length) ? m.imgUrls : (m.imgUrl ? [m.imgUrl] : []);
                            let media = pics.length ? `<div style="display:flex;gap:6px;overflow-x:auto;max-width:230px;">${pics.map(x => `<img src="${x}" onclick="event.stopPropagation();window.open('${x}','_blank')" style="width:185px;height:190px;object-fit:cover;border-radius:10px;">`).join('')}</div>` : '';
                            if (m.audioData) media += `<audio src="${m.audioData}" controls style="height:32px;max-width:200px;"></audio>`;
                            return `<div class="nx-dm-bubble-anim" data-message-id="${m.id}" onclick="NexusDM.openMsgActionMenu('${m.id}')" style="display:flex;flex-direction:column;align-items:${mine?'flex-end':'flex-start'};margin:4px 0;cursor:pointer;"><div style="max-width:78%;background:${mine?'#005c4b':'#1f2c34'};color:#fff;padding:8px 11px;border-radius:12px;">${media}<div style="font-size:13.5px;">${(m.text || '').replace(/</g, '&lt;')}</div></div>${m.reaction?`<span style="font-size:11px;background:#182229;padding:2px 6px;border-radius:10px;">${m.reaction}</span>`:''}</div>`;
                        }).join('');
                        box.scrollTop = box.scrollHeight;
                    }
                });
            }
        },
        closeDirectChat: function() { if (dmSub) dmSub(); document.getElementById('nx-dm-dedicated-root').style.display = 'none'; },
        sendDM: async function() {
            const i = document.getElementById('nx-dm-input'); if (!i || !i.value.trim()) return;
            let txt = i.value.trim(); i.value = ''; let me = Nexus.getCurrentUser(); if (!me || !Nexus.db || !pUser) return;
            await Nexus.db.collection("nexus_private_dms").add({ roomKey: rKey(me.username, pUser), fromUser: me.username, fromName: me.name || me.username, toUser: pUser, text: txt, createdAt: Date.now(), seen: false });
        },
        startReply: function(s, t) { repObj = { sender: s, text: t }; document.getElementById('nx-dm-input')?.focus(); },
        startVoiceDM: function() { if (window.NexusVoice) NexusVoice.startRec('dm'); },
        openMsgActionMenu: function(id) { if (window.NexusDmTools && NexusDmTools.openMenu) NexusDmTools.openMenu(id); },
        openDmHubFallback: function() { let u = (Nexus.users || []).find(x => x && x.username && x.username !== 'nexus_official'); if (u) this.openDirectChat(u.username, u.name || u.username, ''); }
    };
    ensureDmModal(); setInterval(ensureDmModal, 500);
})();
// === END DM.JS ===
