// ================= DM.JS (v10.0 FINAL CLEAN CORE 1:1 CHAT ENGINE — ZERO OVERLAP): 💬 PURE 1:1 DIRECT MESSAGING + 📸 NATIVE 1-10 PHOTOS VIP RIGHT-SCROLL CAROUSEL + 🎙️ NATIVE VOICE NOTE PLAYER + ✏️ EDIT/DELETE/REACTION INTEGRATION + 🔔 INSTANT NOTIFICATION TRIGGER =================

(function() {
    let dmUnsub = null;
    let activePartnerU = '';
    let activePartnerN = '';
    let currentReplyObj = null;

    if (!document.getElementById('nx-clean-dm-css-v10')) {
        const st = document.createElement('style');
        st.id = 'nx-clean-dm-css-v10';
        st.innerHTML = `
            .nx-single-deleted-pill {
                background: rgba(239,68,68,0.14) !important; border: 1.5px dashed rgba(248,113,113,0.65) !important;
                color: #fecaca !important; padding: 7px 13px !important; border-radius: 12px !important;
                font-size: 12.5px !important; font-style: italic !important; display: inline-block !important;
            }
            .nx-vip-dm-carousel {
                display: flex !important; flex-wrap: nowrap !important; gap: 8px;
                overflow-x: auto !important; -webkit-overflow-scrolling: touch !important;
                touch-action: pan-x !important; scroll-snap-type: x mandatory;
                scrollbar-width: none; max-width: 255px; padding: 4px 2px; margin-bottom: 4px;
            }
            .nx-vip-dm-carousel::-webkit-scrollbar { display: none; }
            .nx-vip-dm-slide {
                position: relative; flex: 0 0 205px; width: 205px; height: 215px;
                border-radius: 12px; overflow: hidden; border: 1.5px solid #38bdf8;
                scroll-snap-align: start; background: #090d16; cursor: pointer;
            }
            .nx-vip-dm-slide img { width: 100%; height: 100%; object-fit: cover; display: block; }
            .nx-dm-live-react-pill {
                display: inline-flex; align-items: center; gap: 4px; background: #182229;
                border: 1.5px solid #10b981; color: #fff; padding: 2px 8px; border-radius: 12px;
                font-size: 11px; font-weight: 800; margin-top: 3px;
            }
        `;
        document.head.appendChild(st);
    }

    function getRoomKey(u1, u2) {
        return [String(u1 || '').toLowerCase().trim(), String(u2 || '').toLowerCase().trim()].sort().join('__');
    }

    function getHiddenForMeSet() {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let u = me && me.username ? me.username.toLowerCase().trim() : 'guest';
        try { return new Set(JSON.parse(localStorage.getItem('nexus_dm_hidden_for_me_v1_' + encodeURIComponent(u)) || '[]')); } catch (e) { return new Set(); }
    }

    function formatTime(ts) {
        if (!ts) return '';
        try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }); } catch (e) { return ''; }
    }

    function buildBubbleMediaHTML(m) {
        let html = '';
        // 1. Render 1 to 10 Photos VIP Right-Scroll Carousel natively!
        let pics = (Array.isArray(m.imgUrls) && m.imgUrls.length) ? m.imgUrls : ((m.imgUrl || m.img || m.image) ? [m.imgUrl || m.img || m.image] : []);
        if (pics.length === 1) {
            html += `<div style="margin-bottom:5px;" onclick="event.stopPropagation(); window.open('${pics[0]}', '_blank')">
                <img src="${pics[0]}" style="max-width:225px; width:100%; max-height:250px; object-fit:cover; border-radius:12px; border:1.5px solid #38bdf8; display:block; cursor:pointer;">
            </div>`;
        } else if (pics.length > 1) {
            html += `<div onclick="event.stopPropagation();">
                <div style="font-size:10px; font-weight:900; color:#38bdf8; margin-bottom:2px;">📸 ${pics.length} Photos • Swipe Right 👉</div>
                <div class="nx-vip-dm-carousel">
                    ${pics.map((u, idx) => `<div class="nx-vip-dm-slide" onclick="window.open('${u}', '_blank')">
                        <img src="${u}" loading="lazy">
                        <span style="position:absolute; top:6px; right:6px; background:rgba(9,13,22,0.88); border:1px solid #10b981; color:#10b981; font-size:10px; font-weight:900; padding:2px 7px; border-radius:99px;">${idx + 1}/${pics.length} 👉</span>
                    </div>`).join('')}
                </div>
            </div>`;
        }

        // 2. Render Real Audio Voice Note Player natively!
        let aud = m.audioData || m.audioUrl || '';
        if (aud) {
            html += `<div style="margin:4px 0;" onclick="event.stopPropagation();">
                <audio src="${aud}" controls style="height:34px; max-width:220px; border-radius:10px;"></audio>
            </div>`;
        }
        return html;
    }

    function renderDmMessages(docsList) {
        const box = document.getElementById('nx-dm-msgs-box');
        if (!box) return;
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let myU = me && me.username ? me.username.toLowerCase().trim() : '';
        let hiddenSet = getHiddenForMeSet();

        if (!docsList.length) {
            box.innerHTML = `<div style="text-align:center; padding:30px 15px; color:#64748b; font-size:12.5px;">👋 Say Hello to start your 1:1 private chat!</div>`;
            return;
        }

        box.innerHTML = docsList.map(m => {
            let isMine = String(m.fromUser || '').toLowerCase().trim() === myU;
            let safeId = String(m.id || '').replace(/'/g, "\\'");

            if (hiddenSet.has(m.id)) {
                return `<div class="nx-dm-bubble-anim" data-message-id="${m.id}" style="display:flex; flex-direction:column; align-items:${isMine ? 'flex-end' : 'flex-start'}; margin:4px 0;">
                    <div class="nx-dm-local-deleted" style="font-size:11.5px; color:#64748b; font-style:italic; padding:5px 10px; background:#111827; border-radius:10px;">🧹 You deleted this message for yourself</div>
                </div>`;
            }

            if (m.deleted) {
                let delBy = m.deletedByName || `@${m.deletedBy || 'member'}`;
                return `<div class="nx-dm-bubble-anim nx-deleted-row-clean" data-message-id="${m.id}" style="display:flex; flex-direction:column; align-items:${isMine ? 'flex-end' : 'flex-start'}; margin:4px 0;">
                    <div class="nx-single-deleted-pill">🚫 This message was deleted by <b>${delBy.replace(/</g, '&lt;')}</b></div>
                </div>`;
            }

            let replyHTML = m.replyTo ? `<div style="background:rgba(0,0,0,0.28); border-left:3px solid #38bdf8; padding:4px 8px; border-radius:6px; font-size:11px; color:#cbd5e1; margin-bottom:5px;"><b>${(m.replyTo.sender || '').replace(/</g, '&lt;')}:</b> ${(m.replyTo.text || '').replace(/</g, '&lt;')}</div>` : '';
            let mediaHTML = buildBubbleMediaHTML(m);
            let cleanText = (m.text || '').replace(/</g, '&lt;');
            // Hide placeholder caption if media is already rendered above
            if ((m.imgUrl || (m.imgUrls && m.imgUrls.length)) && (cleanText === '📷 Photo' || cleanText.startsWith('📸'))) cleanText = '';

            return `<div class="nx-dm-bubble-anim" data-message-id="${m.id}" onclick="NexusDM.openMsgActionMenu('${safeId}')" style="display:flex; flex-direction:column; align-items:${isMine ? 'flex-end' : 'flex-start'}; margin:5px 0; cursor:pointer;">
                <div style="max-width:78%; background:${isMine ? '#005c4b' : '#1f2c34'}; color:#f8fafc; padding:8px 11px; border-radius:${isMine ? '14px 4px 14px 14px' : '4px 14px 14px 14px'}; position:relative; box-shadow:0 2px 8px rgba(0,0,0,0.35);">
                    ${replyHTML}
                    ${mediaHTML}
                    ${cleanText ? `<span style="font-size:13.5px; line-height:1.45; word-break:break-word;">${cleanText}</span>` : ''}
                    <div style="display:flex; align-items:center; justify-content:flex-end; gap:5px; margin-top:3px; font-size:10px; color:rgba(255,255,255,0.65);">
                        ${m.edited ? `<span>(edited)</span>` : ''}
                        <span>${formatTime(m.createdAt)}</span>
                        ${isMine ? `<span style="color:${m.seen ? '#38bdf8' : '#94a3b8'}; font-weight:900;">${m.seen ? '✓✓' : '✓'}</span>` : ''}
                    </div>
                </div>
                ${m.reaction ? `<div class="nx-dm-live-react-pill"><span>${m.reaction}</span></div>` : ''}
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
            activePartnerU = targetU;
            activePartnerN = name || targetU;

            const gm = document.getElementById('nx-global-modal');
            if (gm) gm.style.display = 'none';

            const root = document.getElementById('nx-dm-dedicated-root');
            if (!root) return;
            root.style.display = 'flex';

            const nameEl = document.getElementById('nx-dm-partner-name');
            if (nameEl) nameEl.innerText = activePartnerN;

            const rk = getRoomKey(me.username, targetU);
            if (dmUnsub) dmUnsub();

            if (Nexus.db) {
                dmUnsub = Nexus.db.collection("nexus_private_dms")
                    .where("roomKey", "==", rk)
                    .onSnapshot(snap => {
                        let arr = [];
                        snap.forEach(doc => {
                            let d = doc.data();
                            arr.push(Object.assign({ id: doc.id }, d));
                            if (String(d.toUser || '').toLowerCase() === me.username.toLowerCase() && !d.seen) {
                                doc.ref.set({ seen: true }, { merge: true }).catch(() => {});
                            }
                        });
                        arr.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                        renderDmMessages(arr);
                    }, () => {});
            }
        },

        closeDirectChat: function() {
            if (dmUnsub) { dmUnsub(); dmUnsub = null; }
            const root = document.getElementById('nx-dm-dedicated-root');
            if (root) root.style.display = 'none';
        },

        sendDM: async function() {
            const inp = document.getElementById('nx-dm-input');
            if (!inp || !inp.value.trim()) return;
            let text = inp.value.trim();
            inp.value = '';

            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (!me || !Nexus.db || !activePartnerU) return;

            let payload = {
                roomKey: getRoomKey(me.username, activePartnerU),
                fromUser: me.username,
                fromName: me.name || me.username,
                toUser: activePartnerU,
                text: text,
                replyTo: currentReplyObj || null,
                createdAt: Date.now(),
                seen: false
            };
            currentReplyObj = null;
            const repBar = document.getElementById('nx-dm-reply-preview');
            if (repBar) repBar.style.display = 'none';

            await Nexus.db.collection("nexus_private_dms").add(payload).catch(() => {});

            // Trigger instant cloud notification for receiver
            if (activePartnerU.toLowerCase() !== me.username.toLowerCase()) {
                Nexus.db.collection("nexus_notifications").add({
                    toUser: activePartnerU,
                    fromUser: me.username,
                    fromName: me.name || me.username,
                    type: 'dm',
                    text: `messaged you: "${text.substring(0, 35)}"`,
                    createdAt: Date.now()
                }).catch(() => {});
            }
        },

        startReply: function(senderName, textSnippet) {
            currentReplyObj = { sender: senderName, text: textSnippet };
            const repBar = document.getElementById('nx-dm-reply-preview');
            if (repBar) {
                repBar.style.display = 'flex';
                repBar.innerHTML = `<div style="flex:1; font-size:11.5px; color:#38bdf8;">↩️ Replying to <b>${senderName}</b>: "${textSnippet}"</div>
                    <button type="button" onclick="NexusDM.cancelReply()" style="background:none; border:none; color:#f87171; font-weight:900;">✕</button>`;
            }
            const inp = document.getElementById('nx-dm-input');
            if (inp) inp.focus();
        },

        cancelReply: function() {
            currentReplyObj = null;
            const repBar = document.getElementById('nx-dm-reply-preview');
            if (repBar) repBar.style.display = 'none';
        },

        // Delegates directly to NexusVoice (No fake "🎤 Voice Note" text!)
        startVoiceDM: function() {
            if (window.NexusVoice && NexusVoice.startRec) {
                NexusVoice.startRec('dm');
            }
        },

        openMsgActionMenu: function(msgId) {
            if (window.NexusDmTools && NexusDmTools.openMenu) {
                return NexusDmTools.openMenu(msgId);
            }
        }
    };
})(); // === END OF DM.JS ===
