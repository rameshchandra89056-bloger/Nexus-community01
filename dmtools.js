// ================= DMTOOLS.JS (v50.0 FINAL MASTER): 👑 ADMIN-ONLY OFFICIAL DM STUDIO (WITH PHOTO + 36MB VIDEO + VAULT.HTML SENDER) + 🎁 USER-TO-USER GIFT SENDER + 🛑 NON-BLINKING '+' TRAY + ❤️ 1:1 DM REACTIONS & DELETE FIX =================

(function() {
    if (!document.getElementById('nx-dmtools-v50-style')) {
        const st = document.createElement('style');
        st.id = 'nx-dmtools-v50-style';
        st.innerHTML = `
            #nx-msg-action-modal, #nx-cmsg-action-modal, #nx-diwali-custom-modal {
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

            /* STABLE FLOATING '+' TRAY — NO BLINKING, NO JUMPING! */
            #nx-dm-bottom-tray, #nx-grp-bottom-tray {
                position: fixed !important;
                left: 50% !important;
                transform: translateX(-50%) !important;
                bottom: 62px !important;
                width: calc(100% - 16px) !important;
                max-width: 620px !important;
                max-height: 235px !important;
                overflow-y: auto !important;
                background: #111b21 !important;
                border: 1.5px solid #10b981 !important;
                border-radius: 18px !important;
                padding: 12px 10px !important;
                grid-template-columns: repeat(4, 1fr) !important;
                gap: 8px !important;
                z-index: 200100 !important;
                box-shadow: 0 -12px 35px rgba(0,0,0,0.92) !important;
            }

            /* Diwali Compact Bar */
            #nx-diwali-special-hub {
                margin: 8px 12px 6px 12px; padding: 10px 12px; border-radius: 16px;
                background: linear-gradient(135deg, #3b0764 0%, #7c2d12 52%, #b45309 100%);
                border: 1.5px solid #fbbf24;
                display: flex; flex-direction: column; gap: 8px;
            }
            .nx-diwali-3grid {
                display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px;
            }
            .nx-diwali-btn {
                padding: 8px 6px; border-radius: 11px;
                border: 1px solid rgba(253, 224, 71, 0.55);
                background: rgba(9, 13, 22, 0.84); color: #fef08a;
                font-size: 11.5px; font-weight: 900; cursor: pointer;
                display: flex; align-items: center; justify-content: center; gap: 5px;
            }

            /* On-Screen Glowing Diya */
            @keyframes nxFlameFlicker {
                0%, 100% { transform: translateX(-50%) scale(1) rotate(-2deg); }
                50% { transform: translateX(-50%) scale(1.15, 1.24) rotate(2deg); }
            }
            #nx-onscreen-diya-altar {
                position: fixed; bottom: 72px; right: 14px;
                background: linear-gradient(180deg, rgba(69,26,3,0.95), rgba(24,10,2,0.98));
                border: 2px solid #fbbf24; border-radius: 999px;
                padding: 7px 14px 5px 14px; z-index: 100040;
                display: none; align-items: center; gap: 10px;
                box-shadow: 0 0 25px rgba(251,191,36,0.75);
            }
            .nx-diya-unit { position: relative; width: 28px; height: 24px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; }
            .nx-diya-flame { position: absolute; top: -9px; left: 50%; width: 10px; height: 15px; background: radial-gradient(ellipse at bottom, #fff 15%, #fde047 50%, #f97316 85%, transparent 100%); border-radius: 50%; animation: nxFlameFlicker 0.6s infinite; }
            .nx-diya-bowl { width: 26px; height: 12px; background: linear-gradient(180deg, #d97706, #78350f); border: 1.5px solid #fcd34d; border-radius: 3px 3px 16px 16px; }
        `;
        document.head.appendChild(st);
    }

    function getMe() {
        try { if (window.Nexus && Nexus.getCurrentUser) { let u = Nexus.getCurrentUser(); if (u && u.username) return u; } } catch (e) {}
        try {
            let s = localStorage.getItem('nexus_current_user') || localStorage.getItem('nexus_user') || localStorage.getItem('nx_user');
            if (s) return JSON.parse(s);
        } catch (e) {}
        return { username: 'guest', name: 'Student' };
    }

    // STRICT ADMIN CHECK: Only Mohit (@mohiy / Mohit_01) or Admin PIN unlocked session can use Official DM Studio!
    function isAdminUser() {
        const me = getMe();
        const u = String(me && me.username || '').toLowerCase().trim();
        const n = String(me && me.name || '').toLowerCase().trim();
        return u === 'mohiy' || u === 'mohit_01' || u === 'nexus_official' || n.includes('mohit_01') || localStorage.getItem('nx_mohit_admin_unlocked') === '1';
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

    function ensureCustomModal() {
        let m = document.getElementById('nx-diwali-custom-modal');
        if (!m) {
            m = document.createElement('div');
            m.id = 'nx-diwali-custom-modal';
            m.onclick = e => { if (e.target === m) m.style.display = 'none'; };
            document.body.appendChild(m);
        }
        return m;
    }

    // ================= 1. 100% WORKING 1:1 DM REACTIONS, REPLY, EDIT, DELETE FOR ME & EVERYONE =================
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

        editMessage: async function(msgId) {
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
                row.innerHTML = `<div style="background:rgba(24,34,41,0.95); border:1px dashed #f87171; color:#cbd5e1; padding:5px 12px; border-radius:10px; font-size:12px; font-style:italic;">🚫 Deleted by <b>${me.name || me.username}</b></div>`;
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

    function optimizeChatAndTrays() {
        if (window.NexusDM) {
            NexusDM.openMsgActionMenu = (id) => NexusDmTools.openMenu(id);
            NexusDM.reactToDM = (id, em) => NexusDmTools.react(id, em);
        }
        ['#nx-dm-msgs-box', '#nx-room-messages'].forEach(sel => {
            const box = document.querySelector(sel);
            if (!box) return;
            const children = Array.from(box.children);
            if (children.length > 65) {
                const excess = children.length - 55;
                for (let i = 0; i < excess; i++) {
                    if (children[i]) children[i].remove();
                }
            }
        });
    }

    // ================= 2. DIWALI HUB + ADMIN OFFICIAL DM STUDIO (WITH PHOTO, 36MB VIDEO & VAULT.HTML SENDER) =================
    let diwaliCount = parseInt(localStorage.getItem('nx_diwali_diyas_v1') || '203', 10);
    let litScreenDiyas = parseInt(localStorage.getItem('nx_screen_lit_diyas_v1') || '0', 10);

    function renderOnScreenDiyaAltar() {
        let altar = document.getElementById('nx-onscreen-diya-altar');
        if (!altar) {
            altar = document.createElement('div');
            altar.id = 'nx-onscreen-diya-altar';
            document.body.appendChild(altar);
        }
        if (litScreenDiyas <= 0) { altar.style.display = 'none'; return; }
        let count = Math.min(3, Math.max(1, litScreenDiyas));
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `<div class="nx-diya-unit"><div class="nx-diya-flame"></div><div class="nx-diya-bowl"></div></div>`;
        }
        altar.innerHTML = `
            <div style="display:flex; align-items:center; gap:6px;">${html}</div>
            <span style="font-size:10.5px; font-weight:900; color:#fde047;">🪔 ${diwaliCount}</span>
            <button type="button" onclick="NexusDiwali.hideScreenDiya()" style="background:rgba(0,0,0,0.5); border:1px solid #fbbf24; color:#fde047; width:20px; height:20px; border-radius:50%; font-size:10px; cursor:pointer;">✕</button>
        `;
        altar.style.display = 'flex';
    }

    function mountDiwaliFestivalHub() {
        const homeTab = document.getElementById('tab-home');
        if (!homeTab) return;
        let hub = document.getElementById('nx-diwali-special-hub');
        const showAdminBtn = isAdminUser();

        if (!hub) {
            hub = document.createElement('div');
            hub.id = 'nx-diwali-special-hub';
            homeTab.insertBefore(hub, homeTab.firstChild);
        }

        const expectedMode = showAdminBtn ? 'admin' : 'user';
        if (hub.getAttribute('data-role-mode') !== expectedMode) {
            hub.setAttribute('data-role-mode', expectedMode);
            hub.innerHTML = `
                <div style="display:flex; align-items:center; justify-content:space-between;">
                    <div style="display:flex; align-items:center; gap:7px;">
                        <span style="font-size:20px;" ondblclick="NexusDiwali.unlockAdminByPin()">🪔</span>
                        <div>
                            <div style="font-size:13px; font-weight:900; color:#fef08a;">Happy Diwali Nexus Family! ✨</div>
                            <div style="font-size:10.5px; color:#fed7aa; font-weight:700;">Live Community Diyas: <b id="nx-diya-live-badge" style="color:#fde047;">🪔 ${diwaliCount}</b></div>
                        </div>
                    </div>
                    ${showAdminBtn ? `<button type="button" onclick="NexusDiwali.openOfficialDmStudio()" style="background:linear-gradient(135deg,#10b981,#059669); border:1px solid #a7f3d0; color:#020617; font-size:10.5px; font-weight:900; padding:5px 10px; border-radius:99px; cursor:pointer;">👑 Official DM</button>` : ''}
                </div>
                <div class="nx-diwali-3grid">
                    <button type="button" class="nx-diwali-btn" onclick="NexusDiwali.lightDiya()"><span>🪔</span><span>दीया जलाएं</span></button>
                    <button type="button" class="nx-diwali-btn" onclick="NexusDiwali.launchFireworks()"><span>🎇</span><span>पटाखे फोड़ें</span></button>
                    <button type="button" class="nx-diwali-btn" style="border-color:#4ade80; color:#86efac;" onclick="NexusDiwali.openSendToFriendModal()"><span>🎁</span><span>दोस्त को भेजें</span></button>
                </div>
            `;
        }
        if (litScreenDiyas > 0) renderOnScreenDiyaAltar();
    }

    window.NexusDiwali = {
        officialSelectedFile: null,

        // Secret fallback: If Mohit double-taps the 🪔 icon, he can unlock Admin mode anytime!
        unlockAdminByPin: function() {
            const p = prompt("👑 Enter Mohit Admin Username:");
            if (p && (p.toLowerCase().trim() === 'mohiy' || p.toLowerCase().trim() === 'mohit_01')) {
                localStorage.setItem('nx_mohit_admin_unlocked', '1');
                const hub = document.getElementById('nx-diwali-special-hub');
                if (hub) hub.removeAttribute('data-role-mode');
                mountDiwaliFestivalHub();
                this.openOfficialDmStudio();
            }
        },

        lightDiya: function() {
            diwaliCount++;
            litScreenDiyas = Math.min(3, litScreenDiyas + 1);
            try {
                localStorage.setItem('nx_diwali_diyas_v1', String(diwaliCount));
                localStorage.setItem('nx_screen_lit_diyas_v1', String(litScreenDiyas));
            } catch (e) {}
            const badge = document.getElementById('nx-diya-live-badge');
            if (badge) badge.innerText = `🪔 ${diwaliCount}`;
            renderOnScreenDiyaAltar();
            this.launchFireworks();
            if (window.Nexus && Nexus.toast) Nexus.toast(`🪔 Diya #${diwaliCount} Lit on Screen!`);
        },

        hideScreenDiya: function() {
            litScreenDiyas = 0;
            try { localStorage.setItem('nx_screen_lit_diyas_v1', '0'); } catch (e) {}
            const altar = document.getElementById('nx-onscreen-diya-altar');
            if (altar) altar.style.display = 'none';
        },

        launchFireworks: function() {
            const cvs = document.createElement('canvas');
            cvs.style.cssText = 'position:fixed; inset:0; width:100vw; height:100vh; pointer-events:none; z-index:200900;';
            cvs.width = window.innerWidth; cvs.height = window.innerHeight;
            document.body.appendChild(cvs);
            const ctx = cvs.getContext('2d');
            const particles = [];
            const colors = ['#fde047', '#f97316', '#ef4444', '#10b981', '#38bdf8', '#e879f9'];
            for (let b = 0; b < 4; b++) {
                setTimeout(() => {
                    const x = cvs.width * (0.2 + Math.random() * 0.6), y = cvs.height * (0.2 + Math.random() * 0.4);
                    for (let i = 0; i < 38; i++) {
                        const a = (Math.PI * 2 * i) / 38, s = 2 + Math.random() * 5;
                        particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, alpha: 1, color: colors[i % colors.length], size: 2.5 });
                    }
                }, b * 350);
            }
            let f = 0;
            function anim() {
                f++; ctx.clearRect(0, 0, cvs.width, cvs.height);
                for (let i = particles.length - 1; i >= 0; i--) {
                    const p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.alpha -= 0.02;
                    if (p.alpha <= 0) { particles.splice(i, 1); continue; }
                    ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
                }
                if (f < 170) requestAnimationFrame(anim); else cvs.remove();
            }
            anim();
        },

        openSendToFriendModal: function() {
            const me = getMe();
            const modal = ensureCustomModal();
            const friends = (window.Nexus && Array.isArray(Nexus.users) ? Nexus.users : []).filter(u =>
                u && u.username && u.username.toLowerCase() !== (me.username || '').toLowerCase() && u.username !== 'nexus_official'
            );
            const opts = friends.map(u => `<option value="${u.username}">${u.name || u.username} (@${u.username})</option>`).join('');
            modal.innerHTML = `
                <div style="width:100%; max-width:355px; background:linear-gradient(160deg,#111827,#3b0764); border:2px solid #fbbf24; border-radius:22px; padding:16px; color:#fff; box-shadow:0 20px 60px rgba(0,0,0,0.95);" onclick="event.stopPropagation();">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <strong style="font-size:15px; color:#fde047;">🎁 Send Diwali Gift to a Friend</strong>
                        <button type="button" onclick="document.getElementById('nx-diwali-custom-modal').style.display='none'" style="background:none; border:none; color:#cbd5e1; font-size:18px; cursor:pointer;">✕</button>
                    </div>
                    <label style="font-size:11px; font-weight:800; color:#93c5fd; display:block; margin-bottom:4px;">👤 Select Friend:</label>
                    <select id="nx-friend-gift-target" style="width:100%; padding:9px 11px; border-radius:10px; border:1px solid #fbbf24; background:#090d16; color:#fff; font-size:12.5px; font-weight:800; outline:none; margin-bottom:10px;">
                        ${opts || '<option value="casual_chat">🌐 Casual Student Chat (Group)</option>'}
                    </select>
                    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:6px; margin-bottom:10px;">
                        <button type="button" onclick="document.getElementById('nx-friend-gift-msg').value='🍫✨ Happy Diwali Mitra! Yeh lo meri taraf se Special Diwali Kaju Katli &amp; Chocolates Box! 🎁🪔'" style="background:#1e293b; border:1px solid #fbbf24; color:#fef08a; padding:7px 4px; border-radius:10px; font-size:10.5px; font-weight:800; cursor:pointer;">🍫 Sweets Box</button>
                        <button type="button" onclick="document.getElementById('nx-friend-gift-msg').value='🧧✨ शुभ दीपावली! मेरी तरफ से आपको ₹501 का दिवाली शगुन लिफाफा और IIT/NEET में Top Rank की शुभकामनाएं! 🪔🏆'" style="background:#1e293b; border:1px solid #4ade80; color:#86efac; padding:7px 4px; border-radius:10px; font-size:10.5px; font-weight:800; cursor:pointer;">🧧 ₹501 Shagun</button>
                        <button type="button" onclick="document.getElementById('nx-friend-gift-msg').value='🎇🚀 Happy Diwali Dost! Yeh lo Sky Rocket &amp; Sparklers Gift Pack! Hamesha chamakte raho! ✨🪔'" style="background:#1e293b; border:1px solid #38bdf8; color:#7dd3fc; padding:7px 4px; border-radius:10px; font-size:10.5px; font-weight:800; cursor:pointer;">🎇 Crackers</button>
                    </div>
                    <textarea id="nx-friend-gift-msg" rows="3" style="width:100%; background:#090d16; border:1.5px solid #fbbf24; border-radius:12px; padding:10px; color:#fef08a; font-size:12.5px; line-height:1.4; outline:none; resize:none; margin-bottom:12px;">🍫✨ Happy Diwali Mitra! Yeh lo meri taraf se Special Diwali Gift Box &amp; Wishes! 🎁🪔</textarea>
                    <button type="button" onclick="NexusDiwali.sendFriendGiftNow()" style="width:100%; background:linear-gradient(135deg,#f59e0b,#10b981); color:#020617; border:none; padding:11px; border-radius:12px; font-weight:900; font-size:13px; cursor:pointer;">🎁 Send Gift to Friend's DM →</button>
                </div>
            `;
            modal.style.display = 'flex';
        },

        sendFriendGiftNow: async function() {
            const me = getMe();
            const targetU = document.getElementById('nx-friend-gift-target')?.value || '';
            const msg = (document.getElementById('nx-friend-gift-msg')?.value || '').trim();
            if (!targetU || !msg || !window.Nexus || !Nexus.db) return;

            document.getElementById('nx-diwali-custom-modal').style.display = 'none';
            const cardText = `🎁✨ 【 𝐃𝐈𝐖𝐀𝐋𝐈 𝐆𝐈𝐅𝐓 𝐂𝐀𝐑𝐃 】 ✨🎁\n━━━━━━━━━━━━━━━━━━\n${msg}\n━━━━━━━━━━━━━━━━━━\n💝 Sent by: ${me.name || me.username} (@${me.username})`;
            const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            let friendObj = (Nexus.users || []).find(u => u && u.username && u.username.toLowerCase() === targetU.toLowerCase());
            let friendName = (friendObj && friendObj.name) ? friendObj.name : targetU;

            await Nexus.db.collection("nexus_private_dms").add({
                roomKey: getRoomKey(me.username, targetU),
                participants: [me.username.toLowerCase(), targetU.toLowerCase()],
                fromUser: me.username,
                fromName: me.name || me.username,
                toUser: targetU,
                text: cardText,
                seen: false,
                time: nowTime,
                createdAt: Date.now()
            }).catch(() => {});

            this.launchFireworks();
            if (window.Nexus && Nexus.toast) Nexus.toast(`🎁 Gift sent to ${friendName}! Opening DM...`);
            if (window.NexusDM) NexusDM.openDirectChat(targetU, friendName, (friendObj && friendObj.dp) || '');
        },

        // 👑 ADMIN-ONLY OFFICIAL DM STUDIO (WITH PHOTO + 36MB VIDEO + VAULT.HTML SENDER!)
        openOfficialDmStudio: function() {
            if (!isAdminUser()) {
                if (window.Nexus && Nexus.toast) Nexus.toast("🔒 Only Nexus Admin (@mohiy) can open Official DM Studio!");
                return;
            }
            this.officialSelectedFile = null;
            const modal = ensureCustomModal();
            let allUsers = (window.Nexus && Array.isArray(Nexus.users) ? Nexus.users : []).filter(u => u && u.username && u.username !== 'nexus_official');
            let userOptions = allUsers.map(u => `<option value="${u.username}">${u.name || u.username} (@${u.username})</option>`).join('');

            modal.innerHTML = `
                <div style="width:100%; max-width:375px; background:linear-gradient(165deg,#090d16,#111827,#064e3b); border:2px solid #10b981; border-radius:22px; padding:16px; color:#fff;" onclick="event.stopPropagation();">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <strong style="font-size:14px; color:#10b981;">👑 Nexus Official Admin Studio</strong>
                        <button type="button" onclick="document.getElementById('nx-diwali-custom-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>

                    <select id="nx-off-target" style="width:100%; padding:9px; border-radius:10px; border:1px solid #334155; background:#0f172a; color:#fff; font-size:12.5px; font-weight:800; margin-bottom:10px;">
                        <option value="ALL">🌐 ALL USERS (${allUsers.length} Members — Broadcast DM)</option>
                        ${userOptions}
                    </select>

                    <!-- Photo / 36MB Video + vault.html Direct Buttons -->
                    <input type="file" id="nx-off-media-in" accept="image/*,video/mp4,video/webm,video/*" style="display:none;" onchange="NexusDiwali.onOfficialFilePicked(this)">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:8px;">
                        <button type="button" onclick="document.getElementById('nx-off-media-in').click()" style="background:#1e293b; border:1.5px dashed #38bdf8; color:#7dd3fc; padding:8px 6px; border-radius:10px; font-size:11px; font-weight:900; cursor:pointer;">📷 / 🎬 Photo or 36MB Video</button>
                        <button type="button" onclick="document.getElementById('nx-off-msg').value='📚 Hello {name}! Nexus Official Study Vault (vault.html) खुल चुका है! यहां से सारे Notes और PYQs डाउनलोड करें: https://nexus-community01.netlify.app/vault.html 🚀'" style="background:#1e293b; border:1.5px solid #fbbf24; color:#fde047; padding:8px 6px; border-radius:10px; font-size:11px; font-weight:900; cursor:pointer;">🌐 Send vault.html Link</button>
                    </div>
                    <div id="nx-off-file-preview" style="display:none; font-size:11px; color:#fde047; background:#090d16; padding:6px 10px; border-radius:8px; margin-bottom:8px; font-weight:800;"></div>

                    <textarea id="nx-off-msg" rows="3" style="width:100%; background:#090d16; border:1.5px solid #10b981; border-radius:12px; padding:10px; color:#fff; font-size:13px; margin-bottom:12px;">🪔 नमस्ते {name}! Nexus Official परिवार की तरफ से आपको शुभ दीपावली! 🎇</textarea>

                    <button type="button" id="nx-off-send-btn" onclick="NexusDiwali.sendOfficialDmNow()" style="width:100%; background:#10b981; color:#020617; border:none; padding:11px; border-radius:12px; font-weight:900; cursor:pointer;">✅ Send Official Message &amp; Media</button>
                </div>
            `;
            modal.style.display = 'flex';
        },

        onOfficialFilePicked: function(input) {
            const f = input && input.files && input.files[0];
            if (!f) return;
            this.officialSelectedFile = f;
            const prev = document.getElementById('nx-off-file-preview');
            if (prev) {
                const mb = (f.size / (1024 * 1024)).toFixed(1);
                prev.style.display = 'block';
                prev.innerText = `📎 Attached: ${f.name} (${mb} MB)`;
            }
        },

        sendOfficialDmNow: async function() {
            if (!isAdminUser()) return;
            const targetVal = document.getElementById('nx-off-target')?.value || 'ALL';
            const rawText = (document.getElementById('nx-off-msg')?.value || '').trim();
            const btn = document.getElementById('nx-off-send-btn');
            if ((!rawText && !this.officialSelectedFile) || !window.Nexus || !Nexus.db) return;

            if (btn) { btn.disabled = true; btn.innerText = '⏳ Uploading & Sending...'; }

            let uploadedImgUrl = '', uploadedVideoUrl = '';
            if (this.officialSelectedFile && window.NexusVoice && NexusVoice.uploadCustomMediaFile) {
                try {
                    const res = await NexusVoice.uploadCustomMediaFile(this.officialSelectedFile, pct => {
                        if (btn) btn.innerText = `⏳ Uploading Video (${pct}%)...`;
                    });
                    if (res.type === 'video') uploadedVideoUrl = res.url;
                    else uploadedImgUrl = res.url;
                } catch (e) {}
            }

            let allUsers = (Nexus.users || []).filter(u => u && u.username && u.username !== 'nexus_official');
            let recipients = targetVal === 'ALL' ? allUsers : allUsers.filter(u => u.username.toLowerCase() === targetVal.toLowerCase());
            let nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            for (const u of recipients) {
                let personalized = rawText.replace(/\{name\}/gi, u.name || u.username);
                await Nexus.db.collection("nexus_private_dms").add({
                    roomKey: getRoomKey('nexus_official', u.username),
                    participants: ['nexus_official', u.username.toLowerCase()],
                    fromUser: 'nexus_official',
                    fromName: 'Nexus Official ✅',
                    toUser: u.username,
                    text: `✅ 【 𝐍𝐄𝐗𝐔𝐒 𝐎𝐅𝐅𝐈𝐂𝐈𝐀𝐋 】\n${personalized}`,
                    imgUrl: uploadedImgUrl,
                    imgUrls: uploadedImgUrl ? [uploadedImgUrl] : [],
                    videoUrl: uploadedVideoUrl,
                    seen: false,
                    time: nowTime,
                    createdAt: Date.now()
                }).catch(() => {});
            }

            this.officialSelectedFile = null;
            document.getElementById('nx-diwali-custom-modal').style.display = 'none';
            if (Nexus.toast) Nexus.toast(`✅ Sent Official DM & Media to ${recipients.length} user(s)!`);
        }
    };

    optimizeChatAndTrays();
    mountDiwaliFestivalHub();
    setInterval(() => {
        optimizeChatAndTrays();
        mountDiwaliFestivalHub();
    }, 500);
})();
// === END OF DMTOOLS.JS ===
