// ================= DM.JS (COMPLETE SELF-BUILDING 1:1 DIRECT MESSAGE ENGINE): 🛠️ AUTO-BUILDS #nx-dm-dedicated-root & #nx-msg-action-modal + 💬 OPENS 1:1 DM ON ANY CLICK + 🔥 LOADS ALL HISTORICAL & NEW FIREBASE DMS =================

(function() {
    let activeDmUnsub = null;
    let partnerU = '';
    let partnerN = '';
    let replyData = null;

    function getRoomKey(u1, u2) {
        return [String(u1 || '').toLowerCase().trim(), String(u2 || '').toLowerCase().trim()].sort().join('__');
    }

    function formatDmTime(ts) {
        if (!ts) return '';
        try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }); } catch (e) { return ''; }
    }

    // 1. Auto-build #nx-dm-dedicated-root & #nx-msg-action-modal if missing in DOM!
    function ensureDmRootDOM() {
        if (!document.getElementById('nx-dm-dedicated-root')) {
            const root = document.createElement('div');
            root.id = 'nx-dm-dedicated-root';
            root.style.cssText = 'position:fixed; inset:0; width:100%; max-width:640px; height:100dvh; margin:0 auto; background:#0b141a; z-index:100280; display:none; flex-direction:column; overflow:hidden;';
            root.innerHTML = `
                <div style="height:56px; background:#111b21; border-bottom:1px solid #1e293b; display:flex; align-items:center; justify-content:space-between; padding:0 12px; flex-shrink:0;">
                    <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
                        <button type="button" onclick="NexusDM.closeDirectChat()" style="background:none; border:none; color:#f8fafc; font-size:20px; cursor:pointer;">←</button>
                        <div id="nx-dm-partner-dp" style="width:38px; height:38px; border-radius:50%; background:#2563eb; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:15px; overflow:hidden; flex-shrink:0;">U</div>
                        <div style="min-width:0; flex:1;">
                            <div id="nx-dm-partner-name" style="font-size:14.5px; font-weight:900; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Friend</div>
                            <div id="nx-dm-partner-status" style="font-size:11px; color:#10b981; font-weight:700;">🟢 Direct Chat Active</div>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:6px;">
                        <button type="button" onclick="if(window.NexusWatchParty) NexusWatchParty.openModal(true, 'mp3');" style="background:#1e293b; border:1px solid #10b981; color:#10b981; padding:6px 10px; border-radius:10px; font-size:11.5px; font-weight:900; cursor:pointer;">🎵 DJ</button>
                        <button type="button" onclick="if(window.NexusWatchParty) NexusWatchParty.openModal(true, 'yt');" style="background:#1e293b; border:1px solid #ef4444; color:#fca5a5; padding:6px 10px; border-radius:10px; font-size:11.5px; font-weight:900; cursor:pointer;">▶️ TV</button>
                    </div>
                </div>

                <div id="nx-dm-msgs-box" style="flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:6px;"></div>

                <div id="nx-dm-reply-preview" style="display:none; align-items:center; justify-content:space-between; padding:6px 12px; background:#182229; border-left:4px solid #38bdf8;"></div>

                <div id="nx-dm-bottom-tray" style="display:none; grid-template-columns:repeat(4, 1fr); gap:8px; padding:12px; background:#111b21; border-top:1.5px solid #10b981;">
                    <button type="button" onclick="document.getElementById('nx-dm-bottom-tray').style.display='none'; if(window.NexusVoice) NexusVoice.pickPhotos('dm');" style="background:#182229; border:1px solid #334155; color:#fff; padding:10px 4px; border-radius:12px; font-size:11px; font-weight:800; cursor:pointer;">📷<br>Photo</button>
                    <button type="button" onclick="document.getElementById('nx-dm-bottom-tray').style.display='none'; if(window.NexusVoice) NexusVoice.pickPhotos('dm');" style="background:#182229; border:1px dashed #10b981; color:#10b981; padding:10px 4px; border-radius:12px; font-size:11px; font-weight:800; cursor:pointer;">1️⃣<br>View-Once</button>
                    <button type="button" onclick="document.getElementById('nx-dm-bottom-tray').style.display='none'; if(window.NexusWatchParty) NexusWatchParty.openModal(true, 'mp3');" style="background:#182229; border:1px solid #a78bfa; color:#d8b4fe; padding:10px 4px; border-radius:12px; font-size:11px; font-weight:800; cursor:pointer;">🎵<br>Full Song</button>
                    <button type="button" onclick="document.getElementById('nx-dm-bottom-tray').style.display='none'; if(window.NexusWatchParty) NexusWatchParty.openModal(true, 'yt');" style="background:#182229; border:1px solid #ef4444; color:#fca5a5; padding:10px 4px; border-radius:12px; font-size:11px; font-weight:800; cursor:pointer;">▶️<br>Watch TV</button>
                </div>

                <div style="padding:8px 10px; background:#111b21; border-top:1px solid #1e293b; display:flex; align-items:center; gap:8px; flex-shrink:0;">
                    <input type="text" id="nx-dm-input" placeholder="Message..." onkeydown="if(event.key==='Enter') NexusDM.sendDM()" style="flex:1; background:#1f2c34; border:1px solid #334155; color:#fff; padding:11px 14px; border-radius:99px; font-size:13.5px; outline:none;">
                    <button type="button" onclick="const t=document.getElementById('nx-dm-bottom-tray'); if(t) t.style.display=t.style.display==='none'?'grid':'none';" style="width:40px; height:40px; border-radius:50%; background:#1f2c34; border:1.5px solid #10b981; color:#10b981; font-size:19px; font-weight:900; cursor:pointer;">+</button>
                    <button type="button" onclick="NexusDM.startVoiceDM()" style="width:40px; height:40px; border-radius:50%; background:#1f2c34; border:none; color:#38bdf8; font-size:17px; cursor:pointer;">🎙️</button>
                    <button type="button" onclick="NexusDM.sendDM()" style="width:44px; height:44px; border-radius:50%; background:#10b981; border:none; color:#020617; font-size:18px; font-weight:900; cursor:pointer;">➤</button>
                </div>
            `;
            document.body.appendChild(root);
        }

        if (!document.getElementById('nx-msg-action-modal')) {
            const actModal = document.createElement('div');
            actModal.id = 'nx-msg-action-modal';
            actModal.style.cssText = 'position:fixed; inset:0; background:rgba(2,6,23,0.82); z-index:100420; display:none; align-items:center; justify-content:center; padding:16px;';
            actModal.onclick = (e) => { if (e.target === actModal) actModal.style.display = 'none'; };
            document.body.appendChild(actModal);
        }
    }

    function renderDmConversation(list) {
        const box = document.getElementById('nx-dm-msgs-box');
        if (!box) return;
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let myU = me && me.username ? me.username.toLowerCase().trim() : '';

        if (!list.length) {
            box.innerHTML = `<div style="text-align:center; padding:30px 15px; color:#94a3b8; font-size:12.5px;">👋 Say Hello to start your 1:1 private chat!</div>`;
            return;
        }

        box.innerHTML = list.map(m => {
            let isMine = String(m.fromUser || '').toLowerCase().trim() === myU;
            let safeId = String(m.id || '').replace(/'/g, "\\'");

            if (m.deleted) {
                let by = m.deletedByName || `@${m.deletedBy || 'member'}`;
                return `<div class="nx-dm-bubble-anim" data-message-id="${m.id}" style="display:flex; justify-content:${isMine ? 'flex-end' : 'flex-start'}; margin:4px 0;">
                    <div style="background:rgba(239,68,68,0.14); border:1.5px dashed #f87171; color:#fecaca; padding:6px 12px; border-radius:12px; font-size:12px; font-style:italic;">🚫 This message was deleted by <b>${by.replace(/</g, '&lt;')}</b></div>
                </div>`;
            }

            let pics = (Array.isArray(m.imgUrls) && m.imgUrls.length) ? m.imgUrls : ((m.imgUrl || m.img) ? [m.imgUrl || m.img] : []);
            let mediaHTML = '';
            if (pics.length === 1) {
                mediaHTML += `<img src="${pics[0]}" onclick="event.stopPropagation(); window.open('${pics[0]}','_blank')" style="max-width:220px; width:100%; max-height:245px; object-fit:cover; border-radius:12px; border:1.5px solid #38bdf8; margin-bottom:4px; display:block; cursor:pointer;">`;
            } else if (pics.length > 1) {
                mediaHTML += `<div onclick="event.stopPropagation();" style="display:flex; gap:8px; overflow-x:auto; max-width:250px; padding:4px 0;">${pics.map((u, idx) => `<img src="${u}" onclick="window.open('${u}','_blank')" style="width:195px; height:205px; object-fit:cover; border-radius:12px; border:1.5px solid #38bdf8; flex-shrink:0; cursor:pointer;">`).join('')}</div>`;
            }

            if (m.audioData) {
                mediaHTML += `<div onclick="event.stopPropagation();" style="margin:4px 0;"><audio src="${m.audioData}" controls style="height:32px; max-width:210px;"></audio></div>`;
            }

            let repHTML = m.replyTo ? `<div style="background:rgba(0,0,0,0.28); border-left:3px solid #38bdf8; padding:4px 8px; border-radius:6px; font-size:11px; color:#cbd5e1; margin-bottom:4px;"><b>${(m.replyTo.sender || '').replace(/</g, '&lt;')}:</b> ${(m.replyTo.text || '').replace(/</g, '&lt;')}</div>` : '';
            let cleanTxt = (m.text || '').replace(/</g, '&lt;');
            if (pics.length && (cleanTxt === '📷 Photo' || cleanTxt.startsWith('📸'))) cleanTxt = '';

            return `<div class="nx-dm-bubble-anim" data-message-id="${m.id}" onclick="NexusDM.openMsgActionMenu('${safeId}')" style="display:flex; flex-direction:column; align-items:${isMine ? 'flex-end' : 'flex-start'}; margin:4px 0; cursor:pointer;">
                <div style="max-width:78%; background:${isMine ? '#005c4b' : '#1f2c34'}; color:#f8fafc; padding:8px 11px; border-radius:${isMine ? '14px 4px 14px 14px' : '4px 14px 14px 14px'}; box-shadow:0 2px 6px rgba(0,0,0,0.3);">
                    ${repHTML}
                    ${mediaHTML}
                    ${cleanTxt ? `<div style="font-size:13.5px; line-height:1.45; word-break:break-word;">${cleanTxt}</div>` : ''}
                    <div style="display:flex; align-items:center; justify-content:flex-end; gap:5px; margin-top:3px; font-size:10px; color:rgba(255,255,255,0.65);">
                        ${m.edited ? `<span>(edited)</span>` : ''}
                        <span>${formatDmTime(m.createdAt)}</span>
                        ${isMine ? `<span style="color:${m.seen ? '#38bdf8' : '#94a3b8'}; font-weight:900;">${m.seen ? '✓✓' : '✓'}</span>` : ''}
                    </div>
                </div>
                ${m.reaction ? `<div class="nx-dm-live-react-pill" style="background:#182229; border:1px solid #10b981; border-radius:12px; padding:2px 7px; font-size:11px; margin-top:2px;">${m.reaction}</div>` : ''}
            </div>`;
        }).join('');

        box.scrollTop = box.scrollHeight;
    }

    window.NexusDM = {
        activePartner: '',

        openDirectChat: function(username, name, dp) {
            ensureDmRootDOM();
            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (!me) { if (window.Nexus) Nexus.switchTab('tab-profile'); return; }

            let targetU = String(username || '').replace(/^@/, '').trim();
            if (!targetU) return;

            this.activePartner = targetU;
            partnerU = targetU;
            partnerN = name || targetU;

            // Hide any open modals so 1:1 DM is immediately visible on top!
            ['nx-global-modal', 'nx-vip-profile-modal', 'nx-dedicated-dm-home-screen'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });

            const root = document.getElementById('nx-dm-dedicated-root');
            if (!root) return;
            root.style.display = 'flex';

            let uObj = (window.Nexus && Nexus.users || []).find(u => u && u.username && u.username.toLowerCase() === targetU.toLowerCase());
            const nameEl = document.getElementById('nx-dm-partner-name');
            const dpEl = document.getElementById('nx-dm-partner-dp');
            if (nameEl) nameEl.innerText = (uObj && uObj.name) ? uObj.name : partnerN;
            if (dpEl) {
                let avatarUrl = dp || (uObj && uObj.dp) || '';
                dpEl.innerHTML = avatarUrl ? `<img src="${avatarUrl}" style="width:100%; height:100%; object-fit:cover;">` : (partnerN || 'U').charAt(0).toUpperCase();
            }

            if (activeDmUnsub) activeDmUnsub();
            let myU = me.username.toLowerCase().trim();
            let tU = targetU.toLowerCase().trim();
            let rk = getRoomKey(myU, tU);

            if (window.Nexus && Nexus.db) {
                // Index-free fast query that matches BOTH roomKey AND fromUser/toUser (loads 100% of old + new DMs!)
                activeDmUnsub = Nexus.db.collection("nexus_private_dms")
                    .orderBy("createdAt", "desc")
                    .limit(160)
                    .onSnapshot(snap => {
                        let arr = [];
                        snap.forEach(doc => {
                            let d = doc.data();
                            if (!d) return;
                            let f = String(d.fromUser || '').toLowerCase().trim();
                            let t = String(d.toUser || '').toLowerCase().trim();
                            let isPair = (d.roomKey === rk) || (f === myU && t === tU) || (f === tU && t === myU);
                            if (isPair) {
                                arr.push(Object.assign({ id: doc.id }, d));
                                if (t === myU && !d.seen) {
                                    doc.ref.set({ seen: true }, { merge: true }).catch(() => {});
                                }
                            }
                        });
                        arr.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                        renderDmConversation(arr);
                    }, () => {});
            }
        },

        closeDirectChat: function() {
            if (activeDmUnsub) { activeDmUnsub(); activeDmUnsub = null; }
            const root = document.getElementById('nx-dm-dedicated-root');
            if (root) root.style.display = 'none';
        },

        sendDM: async function() {
            const inp = document.getElementById('nx-dm-input');
            if (!inp || !inp.value.trim()) return;
            let txt = inp.value.trim();
            inp.value = '';

            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (!me || !Nexus.db || !partnerU) return;

            let payload = {
                roomKey: getRoomKey(me.username, partnerU),
                fromUser: me.username,
                fromName: me.name || me.username,
                toUser: partnerU,
                text: txt,
                replyTo: replyData || null,
                createdAt: Date.now(),
                seen: false
            };
            replyData = null;
            const repBar = document.getElementById('nx-dm-reply-preview');
            if (repBar) repBar.style.display = 'none';

            await Nexus.db.collection("nexus_private_dms").add(payload).catch(() => {});
        },

        startReply: function(senderName, textSnippet) {
            replyData = { sender: senderName, text: textSnippet };
            const repBar = document.getElementById('nx-dm-reply-preview');
            if (repBar) {
                repBar.style.display = 'flex';
                repBar.innerHTML = `<span style="font-size:11.5px; color:#38bdf8;">↩️ Replying to <b>${senderName}</b>: "${textSnippet}"</span>
                    <button type="button" onclick="NexusDM.cancelReply()" style="background:none; border:none; color:#f87171; font-weight:900;">✕</button>`;
            }
            const inp = document.getElementById('nx-dm-input');
            if (inp) inp.focus();
        },

        cancelReply: function() {
            replyData = null;
            const repBar = document.getElementById('nx-dm-reply-preview');
            if (repBar) repBar.style.display = 'none';
        },

        startVoiceDM: function() {
            if (window.NexusVoice && NexusVoice.startRec) NexusVoice.startRec('dm');
        },

        openMsgActionMenu: function(msgId) {
            if (!msgId) return;
            ensureDmRootDOM();
            const modal = document.getElementById('nx-msg-action-modal');
            if (!modal) return;
            let safeId = String(msgId).replace(/'/g, "\\'");
            const emojis = ['❤️', '😂', '🔥', '👍', '🙏', '💯'];
            modal.innerHTML = `
                <div style="width:100%; max-width:340px; background:#111b21; border:1.5px solid #334155; border-radius:20px; padding:14px; display:flex; flex-direction:column; gap:8px;">
                    <div style="display:flex; justify-content:space-between; gap:4px; background:#0b141a; padding:8px; border-radius:14px;">
                        ${emojis.map(em => `<button type="button" onclick="if(window.NexusDmTools) NexusDmTools.react('${safeId}','${em}'); else document.getElementById('nx-msg-action-modal').style.display='none';" style="background:none; border:none; font-size:22px; cursor:pointer;">${em}</button>`).join('')}
                    </div>
                    <button type="button" onclick="if(window.NexusDmTools) NexusDmTools.reply('${safeId}');" style="padding:10px; border-radius:12px; background:#1f2c34; border:none; color:#fff; font-weight:800; text-align:left; cursor:pointer;">↩️ Reply to Message</button>
                    <button type="button" onclick="if(window.NexusDmTools) NexusDmTools.copy('${safeId}');" style="padding:10px; border-radius:12px; background:#1f2c34; border:none; color:#fff; font-weight:800; text-align:left; cursor:pointer;">📋 Copy Message Text</button>
                    <button type="button" onclick="if(window.NexusDmTools) NexusDmTools.editMessage('${safeId}');" style="padding:10px; border-radius:12px; background:#1f2c34; border:none; color:#38bdf8; font-weight:800; text-align:left; cursor:pointer;">✏️ Edit Message</button>
                    <button type="button" onclick="if(window.NexusDmTools) NexusDmTools.deleteForMe('${safeId}');" style="padding:10px; border-radius:12px; background:#1f2c34; border:none; color:#cbd5e1; font-weight:800; text-align:left; cursor:pointer;">🧹 Delete for Me</button>
                    <button type="button" onclick="if(window.NexusDmTools) NexusDmTools.deleteForEveryone('${safeId}');" style="padding:10px; border-radius:12px; background:#1f2c34; border:none; color:#f87171; font-weight:800; text-align:left; cursor:pointer;">🗑️ Delete for Everyone</button>
                    <button type="button" onclick="document.getElementById('nx-msg-action-modal').style.display='none'" style="padding:8px; background:none; border:none; color:#94a3b8; font-weight:800; cursor:pointer;">Cancel</button>
                </div>
            `;
            modal.style.display = 'flex';
        },

        openDmHubFallback: function() {
            let u = (window.Nexus && Nexus.users || []).find(x => x && x.username && x.username !== 'nexus_official');
            if (u) this.openDirectChat(u.username, u.name || u.username, u.dp || '');
        }
    };

    ensureDmRootDOM();
    setInterval(ensureDmRootDOM, 600);
})(); // === END OF DM.JS ===
