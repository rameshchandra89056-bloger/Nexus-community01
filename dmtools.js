// ================= DMTOOLS.JS (v3.0 EDIT MESSAGE + NATIVE KEYBOARD EMOJI ON ➕ + CLEAN DELETE FOR ME/EVERYONE — FIXES SCREENSHOT 1000073606.jpg) =================

(function() {
    if (!document.getElementById('nx-dmtools-style-v3')) {
        const st = document.createElement('style');
        st.id = 'nx-dmtools-style-v3';
        st.innerHTML = `
            .nx-single-deleted-pill {
                background: rgba(239,68,68,0.14) !important;
                border: 1.5px dashed rgba(248,113,113,0.65) !important;
                color: #fecaca !important; padding: 7px 13px !important;
                border-radius: 12px !important; font-size: 12.5px !important;
                font-style: italic !important; display: block !important;
                width: fit-content !important; margin: 3px 0 !important;
            }
        `;
        document.head.appendChild(st);
    }

    function getHiddenSet() {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let u = me && me.username ? me.username.toLowerCase().trim() : 'guest';
        try { return new Set(JSON.parse(localStorage.getItem('nexus_dm_hidden_for_me_v1_' + encodeURIComponent(u)) || '[]')); } catch (e) { return new Set(); }
    }

    function extractCleanBubbleText(msgId) {
        const row = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
        if (!row) return '';
        let clone = row.cloneNode(true);
        clone.querySelectorAll('button, .nx-dm-message-menu-btn, .nx-dm-live-react-pill, audio, img').forEach(el => el.remove());
        return (clone.innerText || '').replace(/\d{1,2}:\d{2}\s*(AM|PM|am|pm)?.*$/s, '').replace(/\(edited\)/gi, '').trim();
    }

    function bindDmToolsV3() {
        if (!window.NexusDM) return;
        let hidden = getHiddenSet();

        document.querySelectorAll('#nx-dm-msgs-box .nx-dm-bubble-anim, #nx-dm-msgs-box > div').forEach(row => {
            let id = row.getAttribute('data-message-id') || '';
            if (id && hidden.has(id) && !row.getAttribute('data-hid')) {
                row.setAttribute('data-hid', '1');
                row.innerHTML = `<div class="nx-dm-local-deleted">🧹 You deleted this message for yourself</div>`;
                return;
            }
            let raw = (row.innerText || '').trim();
            if (raw.includes('This message was deleted by') && !row.querySelector('.nx-single-deleted-pill')) {
                row.innerHTML = `<div class="nx-single-deleted-pill">🚫 ${raw.replace(/^🚫\s*/, '')}</div>`;
            }
        });

        NexusDM.openMsgActionMenu = function(msgId) {
            if (!msgId) return;
            let modal = document.getElementById('nx-msg-action-modal');
            if (!modal) return;
            let safeId = String(msgId).replace(/'/g, "\\'");
            const mainEmojis = ['❤️', '😂', '🔥', '👍', '🙏', '💯'];

            modal.innerHTML = `
                <div class="nx-msg-action-sheet">
                    <!-- Quick Emoji Bar + ➕ Button that opens Phone's Native Keyboard Emoji Input! -->
                    <div class="nx-emoji-bar" style="display:flex; align-items:center; justify-content:space-between; gap:4px;">
                        ${mainEmojis.map(em => `<button type="button" class="nx-emoji-btn" onclick="NexusDmTools.react('${safeId}', '${em}')">${em}</button>`).join('')}
                        <button type="button" class="nx-emoji-btn" style="border:1.5px dashed #10b981; color:#10b981; font-size:16px; font-weight:900;" onclick="NexusDmTools.openKeyboardEmojiBox('${safeId}')">➕</button>
                    </div>

                    <!-- Native Mobile Keyboard Emoji Input Box (Opens Keyboard Immediately When ➕ is Tapped!) -->
                    <div id="nx-kb-emoji-box" style="display:none; align-items:center; gap:8px; margin-bottom:10px; background:#090d16; border:1.5px solid #10b981; border-radius:12px; padding:6px 10px;">
                        <input type="text" id="nx-kb-emoji-input" placeholder="Tap 😊 on your keyboard to pick any emoji..." oninput="if(this.value.trim()) NexusDmTools.react('${safeId}', this.value.trim())" style="flex:1; background:transparent; border:none; color:#fff; font-size:15px; outline:none;">
                    </div>

                    <button type="button" class="nx-menu-opt-btn" onclick="NexusDmTools.reply('${safeId}')"><span>↩️</span> <span>Reply to Message</span></button>
                    <button type="button" class="nx-menu-opt-btn" onclick="NexusDmTools.copy('${safeId}')"><span>📋</span> <span>Copy Message Text</span></button>
                    <button type="button" class="nx-menu-opt-btn" style="color:#38bdf8; border-color:rgba(56,189,248,0.35);" onclick="NexusDmTools.editMessage('${safeId}')"><span>✏️</span> <span>Edit Message</span></button>
                    <button type="button" class="nx-menu-opt-btn" style="color:#cbd5e1;" onclick="NexusDmTools.deleteForMe('${safeId}')"><span>🧹</span> <span>Delete for Me</span></button>
                    <button type="button" class="nx-menu-opt-btn" style="color:#f87171; border-color:rgba(239,68,68,0.4);" onclick="NexusDmTools.deleteForEveryone('${safeId}')"><span>🗑️</span> <span>Delete for Everyone</span></button>
                    <button type="button" class="nx-menu-opt-btn" style="justify-content:center; background:transparent; border:none; color:#8696a0;" onclick="document.getElementById('nx-msg-action-modal').style.display='none'">Cancel</button>
                </div>
            `;
            modal.style.display = 'flex';
        };
    }

    window.NexusDmTools = {
        openKeyboardEmojiBox: function(msgId) {
            const box = document.getElementById('nx-kb-emoji-box');
            const inp = document.getElementById('nx-kb-emoji-input');
            if (box && inp) {
                box.style.display = 'flex';
                inp.value = '';
                inp.focus();
                inp.click();
            }
        },

        react: async function(msgId, emoji) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            let me = Nexus.getCurrentUser();
            if (!me || !Nexus.db || !msgId || !emoji) return;
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
            let txt = extractCleanBubbleText(msgId).substring(0, 45) || 'Message';
            let pName = document.getElementById('nx-dm-partner-name')?.innerText || 'Partner';
            if (window.NexusDM && NexusDM.startReply) NexusDM.startReply(pName, txt);
        },

        copy: function(msgId) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            let txt = extractCleanBubbleText(msgId);
            if (txt) { try { navigator.clipboard.writeText(txt); Nexus.toast("📋 Copied!"); } catch (e) {} }
        },

        // ✏️ 100% Working Edit Message Modal for 1:1 Chat!
        editMessage: function(msgId) {
            const actionModal = document.getElementById('nx-msg-action-modal');
            if (actionModal) actionModal.style.display = 'none';
            let oldTxt = extractCleanBubbleText(msgId);

            const gm = document.getElementById('nx-global-modal');
            if (!gm) return;
            let safeId = String(msgId).replace(/'/g, "\\'");

            gm.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid #38bdf8; background:#090d16; padding:16px; max-width:385px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <strong style="color:#38bdf8; font-size:15px;">✏️ Edit Your Message</strong>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>
                    <textarea id="nx-edit-dm-textarea" rows="3" style="width:100%; padding:11px; border-radius:12px; border:1.5px solid #38bdf8; background:#111827; color:#fff; font-size:14px; outline:none; margin-bottom:12px;">${oldTxt.replace(/</g, '&lt;')}</textarea>
                    <div style="display:flex; gap:8px;">
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="flex:1; background:#1e293b; color:#cbd5e1; border:none; padding:11px; border-radius:12px; font-weight:800; cursor:pointer;">Cancel</button>
                        <button type="button" onclick="NexusDmTools.saveEditedMessage('${safeId}')" style="flex:1; background:#10b981; color:#020617; border:none; padding:11px; border-radius:12px; font-weight:900; cursor:pointer;">Save Changes ✓</button>
                    </div>
                </div>
            `;
            gm.style.display = 'flex';
            const ta = document.getElementById('nx-edit-dm-textarea');
            if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
        },

        saveEditedMessage: async function(msgId) {
            const ta = document.getElementById('nx-edit-dm-textarea');
            const gm = document.getElementById('nx-global-modal');
            if (!ta || !ta.value.trim()) return;
            let newText = ta.value.trim();
            if (gm) gm.style.display = 'none';

            if (Nexus.db && msgId) {
                try {
                    await Nexus.db.collection("nexus_private_dms").doc(msgId).set({
                        text: newText,
                        edited: true,
                        editedAt: Date.now()
                    }, { merge: true });
                    Nexus.toast("✏️ Message Edited!");
                } catch (e) {}
            }
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
                row.innerHTML = `<div class="nx-single-deleted-pill">🚫 This message was deleted by <b>${lbl}</b></div>`;
            }
            Nexus.toast("🗑️ Deleted for everyone!");
            try {
                await Nexus.db.collection("nexus_private_dms").doc(msgId).set({
                    deleted: true, deletedAt: Date.now(), deletedBy: me.username, deletedByName: lbl,
                    text: '', imgUrl: '', img: '', image: '', imgUrls: [], audioData: '', sticker: null, replyTo: null
                }, { merge: true });
            } catch (e) {}
        }
    };

    if (!window.__nxDmToolsV3Timer) {
        window.__nxDmToolsV3Timer = setInterval(bindDmToolsV3, 450);
    }
    bindDmToolsV3();
})(); // === END OF DMTOOLS.JS ===
                                    
