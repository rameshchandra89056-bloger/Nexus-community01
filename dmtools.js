// === DMTOOLS.JS (v27.0 DARK ACTION SHEET FOR ORIGINAL DM.JS — FIXES WHITE POPUP 1000073735.jpg) ===
(function() {
    if (!document.getElementById('nx-dmtools-v27-css')) {
        const st = document.createElement('style');
        st.id = 'nx-dmtools-v27-css';
        st.innerHTML = `
            #nx-msg-action-modal {
                position: fixed !important; inset: 0 !important;
                background: rgba(2, 6, 23, 0.85) !important;
                z-index: 200500 !important; display: none;
                align-items: center !important; justify-content: center !important; padding: 16px !important;
            }
            .nx-msg-action-sheet {
                width: 100% !important; max-width: 345px !important;
                background: #111b21 !important; border: 1.5px solid #334155 !important;
                border-radius: 20px !important; padding: 14px !important;
                display: flex !important; flex-direction: column !important; gap: 8px !important;
                box-shadow: 0 20px 50px rgba(0,0,0,0.95) !important;
            }
            .nx-emoji-bar {
                display: flex !important; align-items: center !important; justify-content: space-between !important;
                background: #0b141a !important; padding: 8px 10px !important; border-radius: 14px !important;
            }
            .nx-emoji-btn { background: transparent !important; border: none !important; font-size: 22px !important; cursor: pointer !important; }
            .nx-menu-opt-btn {
                width: 100% !important; padding: 11px 13px !important; border-radius: 12px !important;
                background: #1f2c34 !important; border: 1px solid #2a3942 !important;
                color: #f8fafc !important; font-size: 13.5px !important; font-weight: 800 !important;
                display: flex !important; align-items: center !important; gap: 10px !important;
                text-align: left !important; cursor: pointer !important;
            }
        `;
        document.head.appendChild(st);
    }

    function extractText(msgId) {
        const row = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
        if (!row) return '';
        let clone = row.cloneNode(true);
        clone.querySelectorAll('button, audio, img').forEach(e => e.remove());
        return (clone.innerText || '').replace(/\d{1,2}:\d{2}.*$/s, '').replace(/\(edited\)/gi, '').trim();
    }

    function hookActionMenu() {
        if (!window.NexusDM) return;
        NexusDM.openMsgActionMenu = function(msgId) {
            if (!msgId) return;
            let modal = document.getElementById('nx-msg-action-modal');
            if (!modal) {
                modal = document.createElement('div'); modal.id = 'nx-msg-action-modal';
                modal.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };
                document.body.appendChild(modal);
            }
            let safeId = String(msgId).replace(/'/g, "\\'");
            const emojis = ['❤️', '😂', '🔥', '👍', '🙏', '💯'];
            modal.innerHTML = `
                <div class="nx-msg-action-sheet" onclick="event.stopPropagation();">
                    <div class="nx-emoji-bar">
                        ${emojis.map(em => `<button type="button" class="nx-emoji-btn" onclick="NexusDmTools.react('${safeId}','${em}')">${em}</button>`).join('')}
                        <button type="button" class="nx-emoji-btn" style="border:1.5px dashed #10b981 !important; color:#10b981 !important; font-size:15px !important; border-radius:8px; padding:3px 7px !important;" onclick="const b=document.getElementById('nx-kb-em-v27');if(b){b.style.display='flex';document.getElementById('nx-kb-in-v27').focus();}">➕</button>
                    </div>
                    <div id="nx-kb-em-v27" style="display:none; background:#090d16; border:1.5px solid #10b981; border-radius:10px; padding:6px 10px;">
                        <input type="text" id="nx-kb-in-v27" placeholder="Tap 😊 on keyboard to react..." oninput="if(this.value.trim()) NexusDmTools.react('${safeId}', this.value.trim())" style="width:100%; background:none; border:none; color:#fff; font-size:14px; outline:none;">
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
        };
    }

    window.NexusDmTools = {
        openMenu: function(id) { if (window.NexusDM && NexusDM.openMsgActionMenu) NexusDM.openMsgActionMenu(id); },
        react: async function(msgId, emoji) {
            const m = document.getElementById('nx-msg-action-modal'); if (m) m.style.display = 'none';
            if (window.Nexus && Nexus.db && msgId) {
                await Nexus.db.collection("nexus_private_dms").doc(msgId).set({ reaction: emoji }, { merge: true }).catch(() => {});
                if (Nexus.toast) Nexus.toast(`${emoji} Reacted!`);
            }
        },
        reply: function(msgId) {
            const m = document.getElementById('nx-msg-action-modal'); if (m) m.style.display = 'none';
            let txt = extractText(msgId).substring(0, 45) || 'Message';
            let pName = document.getElementById('nx-dm-partner-name')?.innerText || 'Friend';
            if (window.NexusDM && NexusDM.startReply) NexusDM.startReply(pName, txt);
        },
        copy: function(msgId) {
            const m = document.getElementById('nx-msg-action-modal'); if (m) m.style.display = 'none';
            let txt = extractText(msgId);
            if (txt) { try { navigator.clipboard.writeText(txt); if (window.Nexus) Nexus.toast("📋 Copied!"); } catch (e) {} }
        },
        editMessage: async function(msgId) {
            const m = document.getElementById('nx-msg-action-modal'); if (m) m.style.display = 'none';
            let oldTxt = extractText(msgId);
            let newTxt = prompt("✏️ Edit your message:", oldTxt);
            if (newTxt !== null && newTxt.trim() && window.Nexus && Nexus.db) {
                await Nexus.db.collection("nexus_private_dms").doc(msgId).set({ text: newTxt.trim(), edited: true }, { merge: true }).catch(() => {});
                if (Nexus.toast) Nexus.toast("✏️ Message Updated!");
            }
        },
        deleteForMe: function(msgId) {
            const m = document.getElementById('nx-msg-action-modal'); if (m) m.style.display = 'none';
            const row = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            if (row) row.style.display = 'none';
            if (window.Nexus && Nexus.toast) Nexus.toast("🧹 Deleted for you!");
        },
        deleteForEveryone: async function(msgId) {
            const m = document.getElementById('nx-msg-action-modal'); if (m) m.style.display = 'none';
            let me = (window.Nexus && Nexus.getCurrentUser && Nexus.getCurrentUser()) || { username: 'member', name: 'Member' };
            if (window.Nexus && Nexus.db && msgId) {
                await Nexus.db.collection("nexus_private_dms").doc(msgId).set({
                    deleted: true, deletedBy: me.username, deletedByName: `${me.name || me.username} (@${me.username})`,
                    text: '', imgUrl: '', imgUrls: [], audioData: ''
                }, { merge: true }).catch(() => {});
                if (Nexus.toast) Nexus.toast("🗑️ Deleted for everyone!");
            }
        }
    };

    hookActionMenu();
    setInterval(hookActionMenu, 450);
})();
// === END DMTOOLS.JS ===
            
