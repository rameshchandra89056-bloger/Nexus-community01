// ================= DMTOOLS.JS (DEDICATED 1:1 DM MESSAGE ACTION MENU, ➕ 40+ EMOJI REACTIONS & DELETE FOR ME / EVERYONE MODULE) =================

(function() {
    function getHiddenSet() {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let u = me && me.username ? me.username.toLowerCase().trim() : 'guest';
        try { return new Set(JSON.parse(localStorage.getItem('nexus_dm_hidden_for_me_v1_' + encodeURIComponent(u)) || '[]')); } catch (e) { return new Set(); }
    }

    function bindDmTools() {
        if (!window.NexusDM) return;
        let hidden = getHiddenSet();
        document.querySelectorAll('#nx-dm-msgs-box .nx-dm-bubble-anim').forEach(row => {
            let id = row.getAttribute('data-message-id') || '';
            if (id && hidden.has(id) && !row.getAttribute('data-hid')) {
                row.setAttribute('data-hid', '1');
                row.innerHTML = `<div class="nx-dm-local-deleted">🧹 You deleted this message for yourself</div>`;
            } else if ((row.innerText || '').includes('This message was deleted by') && !row.classList.contains('nx-deleted-row-clean')) {
                let raw = (row.innerText || '').trim();
                row.classList.add('nx-deleted-row-clean');
                row.innerHTML = `<div class="nx-single-deleted-pill">🚫 ${raw.replace(/^🚫\s*/, '')}</div>`;
            }
        });

        NexusDM.openMsgActionMenu = function(msgId) {
            if (!msgId) return;
            let modal = document.getElementById('nx-msg-action-modal');
            if (!modal) return;
            const row = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            let isMine = row ? (row.style.alignItems === 'flex-end') : true;
            let safeId = String(msgId).replace(/'/g, "\\'");
            const mainEmojis = ['❤️', '😂', '🔥', '👍', '🙏', '💯'];
            const extraEmojis = ['🥰','😎','🤩','😭','😡','🤔','🎉','⚡','👑','🙌','💔','🤣','🥺','🤗','🧠','🚀','🎯','🏆','❤️‍🔥','👏','🫡','🤝','✨','💐'];

            modal.innerHTML = `
                <div class="nx-msg-action-sheet">
                    <div class="nx-emoji-bar" style="display:flex; align-items:center; justify-content:space-between; gap:4px;">
                        ${mainEmojis.map(em => `<button type="button" class="nx-emoji-btn" onclick="NexusDmTools.react('${safeId}', '${em}')">${em}</button>`).join('')}
                        <button type="button" class="nx-emoji-btn" style="border:1.5px dashed #10b981; color:#10b981; font-size:16px; font-weight:900;" onclick="const g=document.getElementById('nx-extra-emoji-drawer'); if(g) g.style.display=g.style.display==='none'?'grid':'none';">➕</button>
                    </div>
                    <div id="nx-extra-emoji-drawer" style="display:none; grid-template-columns:repeat(6, 1fr); gap:6px; padding:10px; background:#090d16; border:1px solid #334155; border-radius:14px; margin-bottom:10px; max-height:150px; overflow-y:auto;">
                        ${extraEmojis.map(em => `<button type="button" style="background:#161f33; border:none; border-radius:8px; padding:6px; font-size:20px; cursor:pointer;" onclick="NexusDmTools.react('${safeId}', '${em}')">${em}</button>`).join('')}
                    </div>
                    <button type="button" class="nx-menu-opt-btn" onclick="NexusDmTools.reply('${safeId}')"><span>↩️</span> <span>Reply to Message</span></button>
                    <button type="button" class="nx-menu-opt-btn" onclick="NexusDmTools.copy('${safeId}')"><span>📋</span> <span>Copy Message Text</span></button>
                    <button type="button" class="nx-menu-opt-btn" style="color:#cbd5e1;" onclick="NexusDmTools.deleteForMe('${safeId}')"><span>🧹</span> <span>Delete for Me</span></button>
                    ${isMine ? `<button type="button" class="nx-menu-opt-btn" style="color:#f87171;" onclick="NexusDmTools.deleteForEveryone('${safeId}')"><span>🗑️</span> <span>Delete for Everyone</span></button>` : ''}
                    <button type="button" class="nx-menu-opt-btn" style="justify-content:center; background:transparent; border:none; color:#8696a0;" onclick="document.getElementById('nx-msg-action-modal').style.display='none'">Cancel</button>
                </div>
            `;
            modal.style.display = 'flex';
        };
    }

    window.NexusDmTools = {
        react: async function(msgId, emoji) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            let me = Nexus.getCurrentUser();
            if (!me || !Nexus.db || !msgId) return;
            const row = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            if (row) {
                let p = row.querySelector('.nx-dm-live-react-pill');
                if (!p) { p = document.createElement('div'); p.className = 'nx-dm-live-react-pill'; row.appendChild(p); }
                p.innerHTML = `<span>${emoji}</span> <span>@${me.username}</span>`;
            }
            Nexus.toast(`${emoji} Reacted!`);
            try {
                const ref = Nexus.db.collection("nexus_private_dms").doc(msgId);
                let s = await ref.get();
                let likes = (s.exists && Array.isArray(s.data().likes)) ? [...s.data().likes] : [];
                if (!likes.includes(me.username)) likes.push(me.username);
                await ref.set({ likes: likes, reaction: emoji }, { merge: true });
            } catch (e) {}
        },

        reply: function(msgId) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            const row = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            let txt = row ? (row.innerText || 'Message').replace(/\n+/g, ' ').substring(0, 40) : 'Message';
            let pName = document.getElementById('nx-dm-partner-name')?.innerText || 'Partner';
            if (window.NexusDM && NexusDM.startReply) NexusDM.startReply(pName, txt);
        },

        copy: function(msgId) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            const row = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            if (row) { try { navigator.clipboard.writeText((row.innerText || '').trim()); Nexus.toast("📋 Copied!"); } catch (e) {} }
        },

        deleteForMe: function(msgId) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            let me = Nexus.getCurrentUser();
            let u = me && me.username ? me.username.toLowerCase().trim() : 'guest';
            let key = 'nexus_dm_hidden_for_me_v1_' + encodeURIComponent(u);
            let set = getHiddenSet();
            set.add(String(msgId));
            try { localStorage.setItem(key, JSON.stringify(Array.from(set))); } catch (e) {}
            const row = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            if (row) row.innerHTML = `<div class="nx-dm-local-deleted">🧹 You deleted this message for yourself</div>`;
            Nexus.toast("🧹 Deleted for you!");
        },

        deleteForEveryone: async function(msgId) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            let me = Nexus.getCurrentUser();
            if (!me || !Nexus.db || !msgId) return;
            let lbl = `${me.name || me.username} (@${me.username})`;
            const row = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            if (row) {
                row.classList.add('nx-deleted-row-clean');
                row.innerHTML = `<div class="nx-single-deleted-pill">🚫 This message was deleted by <b>${lbl}</b></div>`;
            }
            Nexus.toast("🗑️ Deleted for everyone!");
            try {
                await Nexus.db.collection("nexus_private_dms").doc(msgId).set({
                    deleted: true, deletedAt: Date.now(), deletedBy: me.username, deletedByName: lbl,
                    text: '', imgUrl: '', imgUrls: [], sticker: null, replyTo: null
                }, { merge: true });
            } catch (e) {}
        }
    };

    if (!window.__nxDmToolsInterval) {
        window.__nxDmToolsInterval = setInterval(bindDmTools, 500);
    }
    bindDmTools();
})(); // === END OF DMTOOLS.JS ===
