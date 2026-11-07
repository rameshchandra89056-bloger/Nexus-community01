// ================= DM.JS (LIVE EMERGENCY FIX): 💬 RESTORES 1:1 DIRECT MESSAGING & CLICK TO OPEN DM =================

(function() {
    let activeDmSub = null;
    let partnerUsername = '';

    function getRoomKey(u1, u2) {
        return [String(u1 || '').toLowerCase().trim(), String(u2 || '').toLowerCase().trim()].sort().join('__');
    }

    function renderLiveDmMessages(list) {
        const box = document.getElementById('nx-dm-msgs-box');
        if (!box) return;
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let myU = me && me.username ? me.username.toLowerCase().trim() : '';

        if (!list.length) {
            box.innerHTML = `<div style="text-align:center; padding:30px 15px; color:#64748b; font-size:12.5px;">👋 Say Hello to start your 1:1 private chat!</div>`;
            return;
        }

        box.innerHTML = list.map(m => {
            let isMine = String(m.fromUser || '').toLowerCase().trim() === myU;
            if (m.deleted) return '';

            let mHtml = '';
            let pics = (Array.isArray(m.imgUrls) && m.imgUrls.length) ? m.imgUrls : (m.imgUrl ? [m.imgUrl] : []);
            if (pics.length) {
                mHtml += `<img src="${pics[0]}" onclick="window.open('${pics[0]}','_blank')" style="max-width:210px; width:100%; border-radius:10px; margin:4px 0; display:block; cursor:pointer;">`;
            }
            if (m.audioData) {
                mHtml += `<div style="margin:4px 0;"><audio src="${m.audioData}" controls style="height:30px; max-width:200px;"></audio></div>`;
            }

            return `<div style="display:flex; flex-direction:column; align-items:${isMine ? 'flex-end' : 'flex-start'}; margin:5px 0;">
                <div style="max-width:80%; background:${isMine ? '#005c4b' : '#1f2c34'}; color:#f8fafc; padding:8px 11px; border-radius:${isMine ? '14px 4px 14px 14px' : '4px 14px 14px 14px'}; box-shadow:0 2px 6px rgba(0,0,0,0.3);">
                    ${mHtml}
                    ${m.text ? `<div style="font-size:13.5px; line-height:1.4; word-break:break-word;">${(m.text || '').replace(/</g, '&lt;')}</div>` : ''}
                </div>
            </div>`;
        }).join('');

        box.scrollTop = box.scrollHeight;
    }

    window.NexusDM = {
        activePartner: '',
        openDirectChat: function(username, name, dp) {
            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (!me) { Nexus.switchTab('tab-profile'); return; }
            let targetU = String(username || '').replace(/^@/, '').trim();
            if (!targetU) return;

            this.activePartner = targetU;
            partnerUsername = targetU;

            const gm = document.getElementById('nx-global-modal');
            if (gm) gm.style.display = 'none';

            const root = document.getElementById('nx-dm-dedicated-root');
            if (!root) return;
            root.style.display = 'flex';

            const nameEl = document.getElementById('nx-dm-partner-name');
            if (nameEl) nameEl.innerText = name || targetU;

            let rk = getRoomKey(me.username, targetU);
            if (activeDmSub) activeDmSub();

            if (Nexus.db) {
                activeDmSub = Nexus.db.collection("nexus_private_dms")
                    .where("roomKey", "==", rk)
                    .onSnapshot(snap => {
                        let arr = [];
                        snap.forEach(doc => arr.push(Object.assign({ id: doc.id }, doc.data())));
                        arr.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                        renderLiveDmMessages(arr);
                    }, () => {});
            }
        },
        closeDirectChat: function() {
            if (activeDmSub) { activeDmSub(); activeDmSub = null; }
            const root = document.getElementById('nx-dm-dedicated-root');
            if (root) root.style.display = 'none';
        },
        sendDM: async function() {
            const inp = document.getElementById('nx-dm-input');
            if (!inp || !inp.value.trim()) return;
            let txt = inp.value.trim();
            inp.value = '';
            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (!me || !Nexus.db || !partnerUsername) return;

            await Nexus.db.collection("nexus_private_dms").add({
                roomKey: getRoomKey(me.username, partnerUsername),
                fromUser: me.username,
                fromName: me.name || me.username,
                toUser: partnerUsername,
                text: txt,
                createdAt: Date.now(),
                seen: false
            }).catch(() => {});
        }
    };
})();
