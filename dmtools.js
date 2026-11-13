// ================= DMTOOLS.JS (CLEAN MASTER): ❤️ 1:1 DM REACTIONS, REPLY, EDIT, DELETE & 👑 ADMIN OFFICIAL DM STUDIO =================

(function() {
    if (!document.getElementById('nx-dmtools-clean-style')) {
        const st = document.createElement('style');
        st.id = 'nx-dmtools-clean-style';
        st.innerHTML = `
            #nx-msg-action-modal, #nx-cmsg-action-modal, #nx-admin-official-modal {
                position: fixed !important; inset: 0 !important;
                background: rgba(2, 6, 23, 0.86) !important;
                z-index: 200500 !important; display: none;
                align-items: center !important; justify-content: center !important; padding: 16px !important;
            }
            .nx-msg-action-sheet, .nx-cmsg-sheet {
                width: 100% !important; max-width: 345px !important;
                background: #111b21 !important; border: 1.5px solid #334155 !important;
                border-radius: 20px !important; padding: 14px !important;
                display: flex !important; flex-direction: column !important; gap: 8px !important;
                box-shadow: 0 20px 50px rgba(0,0,0,0.95) !important;
            }
            .nx-emoji-bar, .nx-cmsg-emoji-bar {
                display: flex !important; align-items: center !important; justify-content: space-between !important;
                background: #0b141a !important; padding: 8px 10px !important; border-radius: 16px !important;
                border: 1px solid #233138 !important;
            }
            .nx-emoji-btn, .nx-cmsg-emoji-btn {
                background: transparent !important; border: none !important;
                font-size: 23px !important; cursor: pointer !important; padding: 2px 4px !important;
            }
            .nx-menu-opt-btn, .nx-cmsg-opt-btn {
                width: 100% !important; padding: 11px 13px !important; border-radius: 12px !important;
                background: #1f2c34 !important; border: 1px solid #2a3942 !important;
                color: #f8fafc !important; font-size: 13.5px !important; font-weight: 800 !important;
                display: flex !important; align-items: center !important; gap: 10px !important;
                text-align: left !important; cursor: pointer !important;
            }
            /* Hide any leftover Diwali banner */
            #nx-diwali-special-hub, #nx-onscreen-diya-altar {
                display: none !important;
            }
        `;
        document.head.appendChild(st);
    }

    function getMe() {
        try {
            if (window.Nexus && Nexus.getCurrentUser) {
                let u = Nexus.getCurrentUser();
                if (u && u.username) return u;
            }
        } catch (e) {}
        return { username: 'guest', name: 'Student' };
    }

    function isAdminUser() {
        const me = getMe();
        const u = String(me && me.username || '').toLowerCase().trim();
        return u === 'mohiy' || u === 'mohit_01' || u === 'nexus_official' || localStorage.getItem('nx_mohit_admin_unlocked') === '1';
    }

    function getRoomKey(u1, u2) {
        return [String(u1 || '').toLowerCase().trim(), String(u2 || '').toLowerCase().trim()].sort().join('__');
    }

    function extractBubbleText(msgId) {
        const row = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
        if (!row) return '';
        const span = row.querySelector('.nx-dm-msg-text');
        if (span) return (span.innerText || '').trim();
        let clone = row.cloneNode(true);
        clone.querySelectorAll('button, audio, img, video').forEach(e => e.remove());
        return (clone.innerText || '').replace(/\d{1,2}:\d{2}.*$/s, '').replace(/\(edited\)/gi, '').trim();
    }

    window.NexusDmTools = {
        openMenu: function(msgId) {
            if (!msgId) return;
            let modal = document.getElementById('nx-msg-action-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'nx-msg-action-modal';
                modal.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };
                document.body.appendChild(modal);
            }
            let safeId = String(msgId).replace(/'/g, "\\'");
            const emojis = ['❤️', '😂', '🔥', '👍', '🙏', '💯'];
            modal.innerHTML = `
                <div class="nx-msg-action-sheet" onclick="event.stopPropagation();">
                    <div class="nx-emoji-bar">
                        ${emojis.map(em => `<button type="button" class="nx-emoji-btn" onclick="NexusDmTools.react('${safeId}','${em}')">${em}</button>`).join('')}
                        <button type="button" class="nx-emoji-btn" style="border:1.5px dashed #10b981 !important; color:#10b981 !important; font-size:14px !important; border-radius:8px; padding:3px 7px !important;" onclick="const b=document.getElementById('nx-kb-em-v50');if(b){b.style.display='flex';document.getElementById('nx-kb-in-v50').focus();}">➕</button>
                    </div>
                    <div id="nx-kb-em-v50" style="display:none; background:#090d16; border:1.5px solid #10b981; border-radius:10px; padding:6px 10px;">
                        <input type="text" id="nx-kb-in-v50" placeholder="Type any emoji 😊..." oninput="if(this.value.trim()) NexusDmTools.react('${safeId}', this.value.trim())" style="width:100%; background:none; border:none; color:#fff; font-size:14px; outline:none;">
                    </div>
                    <button type="button" class="nx-menu-opt-btn" onclick="NexusDmTools.reply('${safeId}')"><span>↩️</span> <span>Reply to Message</span></button>
                    <button type="button" class="nx-menu-opt-btn" onclick="NexusDmTools.copy('${safeId}')"><span>📋</span> <span>Copy Message Text</span></button>
                    <button type="button" class="nx-menu-opt-btn" style="color:#38bdf8 !important;" onclick="NexusDmTools.editMessage('${safeId}')"><span>✏️</span> <span>Edit Message</span></button>
                    <button type="button" class="nx-menu-opt-btn" style="color:#cbd5e1 !important;" onclick="NexusDmTools.deleteForMe('${safeId}')"><span>🧹</span> <span>Delete for Me</span></button>
                    <button type="button" class="nx-menu-opt-btn" style="color:#f87171 !important;" onclick="NexusDmTools.deleteForEveryone('${safeId}')"><span>🗑️</span> <span>Delete for Everyone</span></button>
                    <button type="button" class="nx-menu-opt-btn" style="justify-content:center !important; background:transparent !important; border:none !important; color:#94a3b8 !important;" onclick="document.getElementById('nx-msg-action-modal').style.display='none'">Cancel</button>
                </div>
            `;
            modal.style.display = 'flex';
        },

        react: async function(msgId, emoji) {
            const m = document.getElementById('nx-msg-action-modal');
            if (m) m.style.display = 'none';
            if (!msgId || !emoji) return;
            const me = getMe();

            const row = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            if (row) {
                let badge = row.querySelector('.nx-live-dm-react');
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'nx-live-dm-react';
                    badge.style.cssText = 'background:#182229; border:1.5px solid #00a884; color:#fff; padding:2px 8px; border-radius:12px; font-size:11.5px; font-weight:800; margin-top:3px; display:inline-flex; align-items:center; gap:4px; z-index:5;';
                    row.appendChild(badge);
                }
                badge.innerHTML = `${emoji} 1`;
            }

            if (window.Nexus && Nexus.db) {
                try {
                    const ref = Nexus.db.collection("nexus_private_dms").doc(msgId);
                    const doc = await ref.get();
                    let likes = [];
                    if (doc && doc.exists) {
                        const d = doc.data() || {};
                        likes = Array.isArray(d.likes) ? [...d.likes] : [];
                    }
                    if (!likes.includes(me.username)) likes.push(me.username);
                    await ref.set({ reaction: emoji, likes: likes }, { merge: true });
                    if (Nexus.toast) Nexus.toast(`${emoji} Reacted!`);
                } catch (e) {}
            }
        },

        reply: function(msgId) {
            const m = document.getElementById('nx-msg-action-modal'); if (m) m.style.display = 'none';
            let txt = extractBubbleText(msgId).substring(0, 60) || 'Media';
            let pName = document.getElementById('nx-dm-partner-name')?.innerText || 'Friend';
            if (window.NexusDM && NexusDM.startReply) NexusDM.startReply(pName, txt);
        },

        copy: function(msgId) {
            const m = document.getElementById('nx-msg-action-modal'); if (m) m.style.display = 'none';
            let txt = extractBubbleText(msgId);
            if (txt) { try { navigator.clipboard.writeText(txt); if (window.Nexus) Nexus.toast("📋 Copied!"); } catch (e) {} }
        },

        editMessage: function(msgId) {
            const m = document.getElementById('nx-msg-action-modal'); if (m) m.style.display = 'none';
            let oldTxt = extractBubbleText(msgId);
            if (window.NexusDM && NexusDM.startEdit) return NexusDM.startEdit(msgId, oldTxt);
        },

        deleteForMe: function(msgId) {
            const m = document.getElementById('nx-msg-action-modal'); if (m) m.style.display = 'none';
            const me = getMe();
            const key = 'nexus_dm_hidden_for_me_v1_' + encodeURIComponent(String(me.username || 'guest').toLowerCase());
            try {
                const arr = JSON.parse(localStorage.getItem(key) || '[]');
                if (!arr.includes(String(msgId))) arr.push(String(msgId));
                localStorage.setItem(key, JSON.stringify(arr));
            } catch (e) {}
            const row = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            if (row) row.style.display = 'none';
            if (window.Nexus && Nexus.toast) Nexus.toast("🧹 Deleted for you!");
        },

        deleteForEveryone: async function(msgId) {
            const m = document.getElementById('nx-msg-action-modal'); if (m) m.style.display = 'none';
            const me = getMe();
            const row = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            if (row) {
                row.innerHTML = `<div class="nx-single-deleted-pill">🚫 This message was deleted by <b>${me.name || me.username}</b></div>`;
            }
            if (window.Nexus && Nexus.db && msgId) {
                await Nexus.db.collection("nexus_private_dms").doc(msgId).set({
                    deleted: true,
                    deletedAt: Date.now(),
                    deletedBy: me.username,
                    deletedByName: me.name || me.username,
                    text: '',
                    imgUrl: '',
                    imgUrls: [],
                    videoUrl: '',
                    audioData: '',
                    sticker: null
                }, { merge: true }).catch(() => {});
                if (Nexus.toast) Nexus.toast("🗑️ Deleted for everyone!");
            }
        }
    };

    setInterval(() => {
        if (window.NexusDM) {
            NexusDM.openMsgActionMenu = (id) => NexusDmTools.openMenu(id);
            NexusDM.reactToDM = (id, em) => NexusDmTools.react(id, em);
        }
    }, 600);
})();
