// ================= DMTOOLS.JS (v32.0 MASTER FIX): ❤️ INSTANT REACTIONS FIX (UPDATES BOTH 'reaction' & 'likes' ARRAY) + ➕ PLUS TRAY OVERLAP FIX + 🪔 INTERACTIVE DIWALI FIREWORKS, LIVE DIYA & WISH CARD =================

(function() {
    if (!document.getElementById('nx-dmtools-v32-style')) {
        const st = document.createElement('style');
        st.id = 'nx-dmtools-v32-style';
        st.innerHTML = `
            /* 1. Dark Action Sheet Styling (Fixes White Popup 1000073735.jpg) */
            #nx-msg-action-modal, #nx-cmsg-action-modal {
                position: fixed !important; inset: 0 !important;
                background: rgba(2, 6, 23, 0.85) !important;
                z-index: 200500 !important; display: none;
                align-items: center !important; justify-content: center !important; padding: 16px !important;
            }
            .nx-msg-action-sheet, .nx-cmsg-sheet {
                width: 100% !important; max-width: 340px !important;
                background: #111b21 !important; border: 1.5px solid #334155 !important;
                border-radius: 20px !important; padding: 14px !important;
                display: flex !important; flex-direction: column !important; gap: 8px !important;
                box-shadow: 0 20px 50px rgba(0,0,0,0.95) !important;
            }
            .nx-emoji-bar, .nx-cmsg-emoji-bar {
                display: flex !important; align-items: center !important; justify-content: space-between !important;
                background: #0b141a !important; padding: 8px 10px !important; border-radius: 16px !important;
                border: 1px solid #233138 !important; margin-bottom: 4px !important;
            }
            .nx-emoji-btn, .nx-cmsg-emoji-btn {
                background: transparent !important; border: none !important;
                font-size: 23px !important; cursor: pointer !important; padding: 2px 4px !important;
                transition: transform 0.12s ease !important;
            }
            .nx-emoji-btn:active, .nx-cmsg-emoji-btn:active { transform: scale(1.35) !important; }
            .nx-menu-opt-btn, .nx-cmsg-opt-btn {
                width: 100% !important; padding: 11px 13px !important; border-radius: 12px !important;
                background: #1f2c34 !important; border: 1px solid #2a3942 !important;
                color: #f8fafc !important; font-size: 13.5px !important; font-weight: 800 !important;
                display: flex !important; align-items: center !important; gap: 10px !important;
                text-align: left !important; cursor: pointer !important; margin-bottom: 2px !important;
            }

            /* 2. '+' Tray Clean Layout (Zero Overlap with Keyboard, Stickers or Messages) */
            #nx-dm-bottom-tray, #nx-grp-bottom-tray {
                position: relative !important;
                width: 100% !important;
                max-height: 225px !important;
                overflow-y: auto !important;
                background: #111b21 !important;
                border-top: 2px solid #10b981 !important;
                padding: 12px 10px !important;
                grid-template-columns: repeat(4, 1fr) !important;
                gap: 8px !important;
                z-index: 99999 !important;
                flex-shrink: 0 !important;
                box-shadow: 0 -10px 25px rgba(0,0,0,0.6) !important;
            }
            #nx-dm-bottom-tray button, #nx-grp-bottom-tray button {
                min-height: 58px !important;
                border-radius: 12px !important;
                font-size: 11px !important;
                font-weight: 800 !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 3px !important;
                margin: 0 !important;
            }

            /* 3. Diwali Interactive Festival Bar */
            #nx-diwali-special-hub {
                margin: 8px 12px 6px 12px;
                padding: 10px 12px;
                border-radius: 16px;
                background: linear-gradient(135deg, #451a03 0%, #7c2d12 50%, #b45309 100%);
                border: 1.5px solid #fbbf24;
                box-shadow: 0 4px 18px rgba(245, 158, 11, 0.35);
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .nx-diwali-btn {
                flex: 1;
                padding: 8px 6px;
                border-radius: 10px;
                border: 1px solid rgba(253, 224, 71, 0.5);
                background: rgba(15, 23, 42, 0.75);
                color: #fef08a;
                font-size: 11.5px;
                font-weight: 900;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                white-space: nowrap;
            }
            .nx-diwali-btn:active { transform: scale(0.95); background: #f59e0b; color: #020617; }
        `;
        document.head.appendChild(st);
    }

    function getMe() {
        try { if (window.Nexus && Nexus.getCurrentUser) { let u = Nexus.getCurrentUser(); if (u) return u; } } catch (e) {}
        try { let s = localStorage.getItem('nexus_current_user') || localStorage.getItem('nexus_user'); if (s) return JSON.parse(s); } catch (e) {}
        return { username: 'mohiy', name: 'Mohit_01' };
    }

    function extractBubbleText(msgId) {
        const row = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
        if (!row) return '';
        let clone = row.cloneNode(true);
        clone.querySelectorAll('button, audio, img').forEach(e => e.remove());
        return (clone.innerText || '').replace(/\d{1,2}:\d{2}.*$/s, '').replace(/\(edited\)/gi, '').trim();
    }

    // Instant DOM badge update so user sees reaction in 0.01s!
    function showInstantReactionOnDOM(msgId, emoji) {
        const row = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
        if (!row) return;
        let pill = row.querySelector('.nx-instant-react-badge');
        if (!pill) {
            pill = document.createElement('div');
            pill.className = 'nx-instant-react-badge';
            pill.style.cssText = 'background:#182229; border:1.5px solid #00a884; color:#fff; padding:2px 8px; border-radius:12px; font-size:11.5px; font-weight:800; margin-top:2px; display:inline-flex; align-items:center; gap:4px; z-index:4;';
            row.appendChild(pill);
        }
        pill.innerHTML = `${emoji} 1`;
    }

    // ================= 1. UNIFIED REACTION & MESSAGE MENU FIX =================
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
                        <button type="button" class="nx-emoji-btn" style="border:1.5px dashed #10b981 !important; color:#10b981 !important; font-size:14px !important; border-radius:8px; padding:3px 7px !important;" onclick="const b=document.getElementById('nx-kb-em-v32');if(b){b.style.display='flex';document.getElementById('nx-kb-in-v32').focus();}">➕</button>
                    </div>
                    <div id="nx-kb-em-v32" style="display:none; background:#090d16; border:1.5px solid #10b981; border-radius:10px; padding:6px 10px;">
                        <input type="text" id="nx-kb-in-v32" placeholder="Tap 😊 on keyboard to react..." oninput="if(this.value.trim()) NexusDmTools.react('${safeId}', this.value.trim())" style="width:100%; background:none; border:none; color:#fff; font-size:14px; outline:none;">
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

        // FIXED: Saves BOTH 'reaction' AND 'likes: [me.username]' so dm.js & chat.js render it 100% of the time!
        react: async function(msgId, emoji) {
            const m = document.getElementById('nx-msg-action-modal');
            if (m) m.style.display = 'none';
            if (!msgId || !emoji) return;

            showInstantReactionOnDOM(msgId, emoji);
            let me = getMe();
            if (window.Nexus && Nexus.toast) Nexus.toast(`${emoji} Reacted!`);

            if (window.Nexus && Nexus.db) {
                try {
                    const docRef = Nexus.db.collection("nexus_private_dms").doc(msgId);
                    const snap = await docRef.get();
                    let likes = [];
                    if (snap && snap.exists) {
                        const d = snap.data() || {};
                        likes = Array.isArray(d.likes) ? [...d.likes] : [];
                    }
                    if (!likes.includes(me.username)) likes.push(me.username);
                    await docRef.set({ reaction: emoji, likes: likes }, { merge: true });
                } catch (e) {}
            }
        },

        reply: function(msgId) {
            const m = document.getElementById('nx-msg-action-modal'); if (m) m.style.display = 'none';
            let txt = extractBubbleText(msgId).substring(0, 50) || 'Media';
            let pName = document.getElementById('nx-dm-partner-name')?.innerText || 'Friend';
            if (window.NexusDM && NexusDM.startReply) NexusDM.startReply(pName, txt);
        },

        copy: function(msgId) {
            const m = document.getElementById('nx-msg-action-modal'); if (m) m.style.display = 'none';
            let txt = extractBubbleText(msgId);
            if (txt) { try { navigator.clipboard.writeText(txt); if (window.Nexus) Nexus.toast("📋 Copied!"); } catch (e) {} }
        },

        editMessage: async function(msgId) {
            const m = document.getElementById('nx-msg-action-modal'); if (m) m.style.display = 'none';
            let oldTxt = extractBubbleText(msgId);
            if (window.NexusDM && NexusDM.startEdit) {
                return NexusDM.startEdit(msgId, oldTxt);
            }
            let newTxt = prompt("✏️ Edit your message:", oldTxt);
            if (newTxt !== null && newTxt.trim() && window.Nexus && Nexus.db) {
                await Nexus.db.collection("nexus_private_dms").doc(msgId).set({ text: newTxt.trim(), edited: true }, { merge: true }).catch(() => {});
            }
        },

        deleteForMe: function(msgId) {
            const m = document.getElementById('nx-msg-action-modal'); if (m) m.style.display = 'none';
            if (window.NexusDM && NexusDM.deleteDMForMe) return NexusDM.deleteDMForMe(msgId);
            const row = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            if (row) row.style.display = 'none';
        },

        deleteForEveryone: async function(msgId) {
            const m = document.getElementById('nx-msg-action-modal'); if (m) m.style.display = 'none';
            if (window.NexusDM && NexusDM.deleteDMForEveryone) return NexusDM.deleteDMForEveryone(msgId);
        }
    };

    // ================= 2. FIX '+' TRAY OVERLAPPING & DUPLICATE BUTTONS =================
    function sanitizePlusTraysAndHooks() {
        if (window.NexusDM) {
            NexusDM.openMsgActionMenu = (id) => NexusDmTools.openMenu(id);
            NexusDM.reactToDM = (id, em) => NexusDmTools.react(id, em);
        }

        // Remove duplicate '+' buttons if power.js injected more than one
        ['#nx-dm-composer', '#nx-chat-room'].forEach(sel => {
            const box = document.querySelector(sel);
            if (!box) return;
            const plusBtns = Array.from(box.querySelectorAll('button')).filter(b => (b.innerText || '').trim() === '+');
            if (plusBtns.length > 1) {
                plusBtns.slice(1).forEach(b => b.remove());
            }
            if (plusBtns[0] && !plusBtns[0].getAttribute('data-v32-clean')) {
                plusBtns[0].setAttribute('data-v32-clean', '1');
                plusBtns[0].addEventListener('click', () => {
                    // Close sticker drawers so they NEVER overlap with '+' tray!
                    ['nx-dm-sticker-drawer', 'nx-chat-sticker-drawer'].forEach(id => {
                        const dr = document.getElementById(id);
                        if (dr) dr.style.display = 'none';
                    });
                });
            }
        });

        // Auto-close '+' tray when any option inside it is clicked or when Sticker drawer is opened
        ['nx-dm-bottom-tray', 'nx-grp-bottom-tray'].forEach(tId => {
            const tray = document.getElementById(tId);
            if (tray && !tray.getAttribute('data-v32-autoclose')) {
                tray.setAttribute('data-v32-autoclose', '1');
                tray.addEventListener('click', (e) => {
                    if (e.target.closest('button')) {
                        setTimeout(() => { tray.style.display = 'none'; }, 120);
                    }
                });
            }
        });
    }

    // ================= 3. 🪔 DIWALI SPECIAL DHAMAKA (FIREWORKS + LIVE DIYA + WISH CARD) =================
    let diwaliCount = parseInt(localStorage.getItem('nx_diwali_diyas_v1') || '108', 10);

    function mountDiwaliFestivalHub() {
        const homeTab = document.getElementById('tab-home');
        if (homeTab && !document.getElementById('nx-diwali-special-hub')) {
            const hub = document.createElement('div');
            hub.id = 'nx-diwali-special-hub';
            hub.innerHTML = `
                <div style="display:flex; align-items:center; justify-content:space-between;">
                    <div style="display:flex; align-items:center; gap:7px;">
                        <span style="font-size:20px;">🪔</span>
                        <div>
                            <div style="font-size:13px; font-weight:900; color:#fef08a;">Happy Diwali Nexus Family! ✨</div>
                            <div style="font-size:10.5px; color:#fed7aa; font-weight:700;">Tap below to celebrate live with friends</div>
                        </div>
                    </div>
                    <span id="nx-diya-live-badge" style="background:#090d16; border:1px solid #fbbf24; color:#fde047; font-size:10.5px; font-weight:900; padding:3px 9px; border-radius:99px;">🪔 ${diwaliCount} Diyas</span>
                </div>
                <div style="display:flex; gap:6px;">
                    <button type="button" class="nx-diwali-btn" onclick="NexusDiwali.launchFireworks()">🎇 फटाके फोड़ें</button>
                    <button type="button" class="nx-diwali-btn" onclick="NexusDiwali.lightDiya()">🪔 दीया जलाएं</button>
                    <button type="button" class="nx-diwali-btn" onclick="NexusDiwali.sendWishCard()">🎁 Wish Card</button>
                </div>
            `;
            homeTab.insertBefore(hub, homeTab.firstChild);
        }
    }

    window.NexusDiwali = {
        launchFireworks: function() {
            if (window.Nexus && Nexus.toast) Nexus.toast("🎇 Happy Diwali! Enjoy the Fireworks! ✨");
            const cvs = document.createElement('canvas');
            cvs.style.cssText = 'position:fixed; inset:0; width:100vw; height:100vh; pointer-events:none; z-index:200900;';
            cvs.width = window.innerWidth;
            cvs.height = window.innerHeight;
            document.body.appendChild(cvs);
            const ctx = cvs.getContext('2d');
            const particles = [];
            const colors = ['#fde047', '#f97316', '#ef4444', '#10b981', '#38bdf8', '#e879f9', '#ffffff'];

            function createBurst(x, y) {
                for (let i = 0; i < 45; i++) {
                    const angle = (Math.PI * 2 * i) / 45;
                    const speed = 2 + Math.random() * 5.5;
                    particles.push({
                        x, y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        alpha: 1,
                        color: colors[Math.floor(Math.random() * colors.length)],
                        size: 2.5 + Math.random() * 2.5
                    });
                }
            }

            // Trigger 6 colorful sky bursts
            for (let b = 0; b < 6; b++) {
                setTimeout(() => {
                    createBurst(
                        cvs.width * (0.2 + Math.random() * 0.6),
                        cvs.height * (0.18 + Math.random() * 0.45)
                    );
                }, b * 420);
            }

            let frames = 0;
            function animate() {
                frames++;
                ctx.clearRect(0, 0, cvs.width, cvs.height);
                for (let i = particles.length - 1; i >= 0; i--) {
                    const p = particles[i];
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.08; // gravity
                    p.alpha -= 0.018;
                    if (p.alpha <= 0) { particles.splice(i, 1); continue; }
                    ctx.globalAlpha = Math.max(0, p.alpha);
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                }
                if (frames < 210) requestAnimationFrame(animate);
                else cvs.remove();
            }
            animate();
        },

        lightDiya: function() {
            diwaliCount++;
            try { localStorage.setItem('nx_diwali_diyas_v1', String(diwaliCount)); } catch (e) {}
            const badge = document.getElementById('nx-diya-live-badge');
            if (badge) badge.innerText = `🪔 ${diwaliCount} Diyas`;
            this.launchFireworks();
            if (window.Nexus && Nexus.toast) Nexus.toast(`🪔 You lit Diya #${diwaliCount}! Shubh Deepavali!`);
        },

        sendWishCard: async function() {
            let me = getMe();
            let customMsg = prompt("🎁 Enter your Diwali Wish for Nexus Friends:", "🪔 आप सभी को और आपके परिवार को दिवाली की हार्दिक शुभकामनाएं! इस दिवाली आपके सारे IIT-JEE / NEET के सपने पूरे हों! ✨🎇");
            if (!customMsg || !customMsg.trim()) return;
            let cardText = `🪔✨ 【 𝐇𝐀𝐏𝐏𝐘 𝐃𝐈𝐖𝐀𝐋𝐈 𝟐𝟎𝟐𝟔 】 ✨🪔\n━━━━━━━━━━━━━━━━━━\n${customMsg.trim()}\n━━━━━━━━━━━━━━━━━━\n🎁 From: ${me.name || me.username} (@${me.username})`;

            if (window.Nexus && Nexus.db) {
                await Nexus.db.collection("nexus_real_msgs").add({
                    roomId: 'casual_chat',
                    username: me.username,
                    sender: me.name || me.username,
                    role: '🪔 Diwali Celebrator',
                    text: cardText,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    createdAt: Date.now()
                }).catch(() => {});
            }
            this.launchFireworks();
            if (window.Nexus && Nexus.toast) Nexus.toast("🎁 Diwali Wish Card sent to Community Chat!");
        }
    };

    sanitizePlusTraysAndHooks();
    mountDiwaliFestivalHub();
    setInterval(() => {
        sanitizePlusTraysAndHooks();
        mountDiwaliFestivalHub();
    }, 450);
})();
// === END OF DMTOOLS.JS ===
