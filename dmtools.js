// ================= DMTOOLS.JS (v34.0 DIWALI ROYAL EDITION): 🪔 ON-SCREEN GLOWING DIYA WITH FLICKERING FLAME + 👑 NEXUS OFFICIAL DM & ALL-USER BROADCAST STUDIO + 🧧 SHAGUN LIFAFA WALLET + ❤️ INSTANT REACTIONS + ➕ TRAY OVERLAP FIX =================

(function() {
    if (!document.getElementById('nx-dmtools-v34-style')) {
        const st = document.createElement('style');
        st.id = 'nx-dmtools-v34-style';
        st.innerHTML = `
            /* 1. Dark Action Sheet Styling */
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
                border: 1px solid #233138 !important; margin-bottom: 4px !important;
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

            /* 2. '+' Tray Clean Layout (Zero Overlap) */
            #nx-dm-bottom-tray, #nx-grp-bottom-tray {
                position: relative !important; width: 100% !important; max-height: 225px !important;
                overflow-y: auto !important; background: #111b21 !important;
                border-top: 2px solid #10b981 !important; padding: 12px 10px !important;
                grid-template-columns: repeat(4, 1fr) !important; gap: 8px !important;
                z-index: 99999 !important; flex-shrink: 0 !important;
            }

            /* 3. Diwali Interactive Festival Hub */
            #nx-diwali-special-hub {
                margin: 8px 12px 6px 12px; padding: 11px 12px; border-radius: 18px;
                background: linear-gradient(135deg, #3b0764 0%, #7c2d12 52%, #b45309 100%);
                border: 1.5px solid #fbbf24;
                box-shadow: 0 6px 22px rgba(245, 158, 11, 0.35);
                display: flex; flex-direction: column; gap: 8px; position: relative; overflow: hidden;
            }
            .nx-diwali-grid {
                display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;
            }
            .nx-diwali-btn {
                padding: 8px 4px; border-radius: 11px;
                border: 1px solid rgba(253, 224, 71, 0.55);
                background: rgba(9, 13, 22, 0.82); color: #fef08a;
                font-size: 11px; font-weight: 900; cursor: pointer;
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                gap: 3px; text-align: center;
            }
            .nx-diwali-btn:active { transform: scale(0.94); background: #f59e0b; color: #020617; }

            /* 4. REAL ON-SCREEN FLICKERING DIYA ALTAR */
            @keyframes nxFlameFlicker {
                0%, 100% { transform: translateX(-50%) scale(1) rotate(-2deg); opacity: 0.95; filter: drop-shadow(0 0 8px #fbbf24) drop-shadow(0 0 16px #f97316); }
                50% { transform: translateX(-50%) scale(1.14, 1.22) rotate(2deg); opacity: 1; filter: drop-shadow(0 0 14px #fde047) drop-shadow(0 0 26px #ef4444); }
            }
            @keyframes nxDiyaFloatGlow {
                0%, 100% { box-shadow: 0 0 18px rgba(251,191,36,0.55), inset 0 0 10px rgba(245,158,11,0.35); }
                50% { box-shadow: 0 0 32px rgba(251,191,36,0.9), inset 0 0 16px rgba(251,191,36,0.55); }
            }
            #nx-onscreen-diya-altar {
                position: fixed; bottom: 74px; left: 50%; transform: translateX(-50%);
                background: linear-gradient(180deg, rgba(69,26,3,0.95), rgba(24,10,2,0.98));
                border: 2px solid #fbbf24; border-radius: 999px;
                padding: 8px 16px 6px 16px; z-index: 100040;
                display: none; align-items: center; gap: 12px;
                animation: nxDiyaFloatGlow 2.4s infinite ease-in-out;
                max-width: 94vw;
            }
            .nx-diya-unit {
                position: relative; width: 34px; height: 28px;
                display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
            }
            .nx-diya-flame {
                position: absolute; top: -10px; left: 50%;
                width: 11px; height: 17px;
                background: radial-gradient(ellipse at bottom, #ffffff 15%, #fde047 50%, #f97316 85%, transparent 100%);
                border-radius: 50% 50% 35% 35%;
                animation: nxFlameFlicker 0.65s infinite ease-in-out;
            }
            .nx-diya-bowl {
                width: 32px; height: 14px;
                background: linear-gradient(180deg, #d97706, #78350f);
                border: 1.5px solid #fcd34d;
                border-radius: 3px 3px 18px 18px;
                box-shadow: 0 3px 8px rgba(0,0,0,0.8);
            }
        `;
        document.head.appendChild(st);
    }

    function getMe() {
        try { if (window.Nexus && Nexus.getCurrentUser) { let u = Nexus.getCurrentUser(); if (u) return u; } } catch (e) {}
        try { let s = localStorage.getItem('nexus_current_user') || localStorage.getItem('nexus_user'); if (s) return JSON.parse(s); } catch (e) {}
        return { username: 'mohiy', name: 'Mohit_01' };
    }

    function getRoomKey(u1, u2) {
        return [String(u1 || '').toLowerCase().trim(), String(u2 || '').toLowerCase().trim()].sort().join('__');
    }

    function extractBubbleText(msgId) {
        const row = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
        if (!row) return '';
        let clone = row.cloneNode(true);
        clone.querySelectorAll('button, audio, img').forEach(e => e.remove());
        return (clone.innerText || '').replace(/\d{1,2}:\d{2}.*$/s, '').replace(/\(edited\)/gi, '').trim();
    }

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

    function ensureCustomDiwaliModal() {
        let m = document.getElementById('nx-diwali-custom-modal');
        if (!m) {
            m = document.createElement('div');
            m.id = 'nx-diwali-custom-modal';
            m.onclick = e => { if (e.target === m) m.style.display = 'none'; };
            document.body.appendChild(m);
        }
        return m;
    }

    // Ensure "Nexus Official ✅" exists in Nexus.users so users can see & open official DMs!
    function ensureNexusOfficialInUsersList() {
        if (!window.Nexus || !Array.isArray(Nexus.users)) return;
        const exists = Nexus.users.some(u => u && u.username && u.username.toLowerCase() === 'nexus_official');
        if (!exists) {
            Nexus.users.unshift({
                username: 'nexus_official',
                name: 'Nexus Official ✅',
                bio: 'Official Nexus Platform & Exam Updates',
                verified: true,
                isOnlineNow: true,
                lastOnline: Date.now()
            });
        }
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
                        <button type="button" class="nx-emoji-btn" style="border:1.5px dashed #10b981 !important; color:#10b981 !important; font-size:14px !important; border-radius:8px; padding:3px 7px !important;" onclick="const b=document.getElementById('nx-kb-em-v34');if(b){b.style.display='flex';document.getElementById('nx-kb-in-v34').focus();}">➕</button>
                    </div>
                    <div id="nx-kb-em-v34" style="display:none; background:#090d16; border:1.5px solid #10b981; border-radius:10px; padding:6px 10px;">
                        <input type="text" id="nx-kb-in-v34" placeholder="Tap 😊 on keyboard to react..." oninput="if(this.value.trim()) NexusDmTools.react('${safeId}', this.value.trim())" style="width:100%; background:none; border:none; color:#fff; font-size:14px; outline:none;">
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
            if (window.NexusDM && NexusDM.startEdit) return NexusDM.startEdit(msgId, oldTxt);
        },

        deleteForMe: function(msgId) {
            const m = document.getElementById('nx-msg-action-modal'); if (m) m.style.display = 'none';
            if (window.NexusDM && NexusDM.deleteDMForMe) return NexusDM.deleteDMForMe(msgId);
        },

        deleteForEveryone: async function(msgId) {
            const m = document.getElementById('nx-msg-action-modal'); if (m) m.style.display = 'none';
            if (window.NexusDM && NexusDM.deleteDMForEveryone) return NexusDM.deleteDMForEveryone(msgId);
        }
    };

    // ================= 2. FIX '+' TRAY OVERLAPPING =================
    function sanitizePlusTraysAndHooks() {
        ensureNexusOfficialInUsersList();
        if (window.NexusDM) {
            NexusDM.openMsgActionMenu = (id) => NexusDmTools.openMenu(id);
            NexusDM.reactToDM = (id, em) => NexusDmTools.react(id, em);
        }
        ['#nx-dm-composer', '#nx-chat-room'].forEach(sel => {
            const box = document.querySelector(sel);
            if (!box) return;
            const plusBtns = Array.from(box.querySelectorAll('button')).filter(b => (b.innerText || '').trim() === '+');
            if (plusBtns.length > 1) plusBtns.slice(1).forEach(b => b.remove());
            if (plusBtns[0] && !plusBtns[0].getAttribute('data-v34-clean')) {
                plusBtns[0].setAttribute('data-v34-clean', '1');
                plusBtns[0].addEventListener('click', () => {
                    ['nx-dm-sticker-drawer', 'nx-chat-sticker-drawer'].forEach(id => {
                        const dr = document.getElementById(id);
                        if (dr) dr.style.display = 'none';
                    });
                });
            }
        });
        ['nx-dm-bottom-tray', 'nx-grp-bottom-tray'].forEach(tId => {
            const tray = document.getElementById(tId);
            if (tray && !tray.getAttribute('data-v34-autoclose')) {
                tray.setAttribute('data-v34-autoclose', '1');
                tray.addEventListener('click', (e) => {
                    if (e.target.closest('button')) setTimeout(() => { tray.style.display = 'none'; }, 120);
                });
            }
        });
    }

    // ================= 3. 🪔 DIWALI SPECIAL HUB + ON-SCREEN GLOWING DIYA + SHAGUN WALLET + OFFICIAL DM STUDIO =================
    let diwaliCount = parseInt(localStorage.getItem('nx_diwali_diyas_v1') || '114', 10);
    let litScreenDiyas = parseInt(localStorage.getItem('nx_screen_lit_diyas_v1') || '0', 10);

    function renderOnScreenDiyaAltar() {
        let altar = document.getElementById('nx-onscreen-diya-altar');
        if (!altar) {
            altar = document.createElement('div');
            altar.id = 'nx-onscreen-diya-altar';
            document.body.appendChild(altar);
        }
        if (litScreenDiyas <= 0) {
            altar.style.display = 'none';
            return;
        }
        let visibleDiyas = Math.min(5, Math.max(1, litScreenDiyas));
        let diyasHTML = '';
        for (let i = 0; i < visibleDiyas; i++) {
            diyasHTML += `<div class="nx-diya-unit"><div class="nx-diya-flame"></div><div class="nx-diya-bowl"></div></div>`;
        }
        altar.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">${diyasHTML}</div>
            <div style="display:flex; flex-direction:column; align-items:flex-start; margin-left:4px;">
                <span style="font-size:10.5px; font-weight:900; color:#fde047;">🪔 शुभ दीपावली</span>
                <span style="font-size:9.5px; color:#fed7aa; font-weight:700;">${diwaliCount} Diyas Lit</span>
            </div>
            <button type="button" onclick="NexusDiwali.hideScreenDiya()" title="Hide Diya" style="background:rgba(0,0,0,0.5); border:1px solid #fbbf24; color:#fde047; width:22px; height:22px; border-radius:50%; font-size:11px; font-weight:900; cursor:pointer;">✕</button>
        `;
        altar.style.display = 'flex';
    }

    function mountDiwaliFestivalHub() {
        const homeTab = document.getElementById('tab-home');
        if (homeTab && !document.getElementById('nx-diwali-special-hub')) {
            const hub = document.createElement('div');
            hub.id = 'nx-diwali-special-hub';
            let shagunCoins = parseInt(localStorage.getItem('nx_shagun_wallet_v1') || '101', 10);
            hub.innerHTML = `
                <div style="display:flex; align-items:center; justify-content:space-between;">
                    <div style="display:flex; align-items:center; gap:7px;">
                        <span style="font-size:21px;">🪔</span>
                        <div>
                            <div style="font-size:13px; font-weight:900; color:#fef08a;">Happy Diwali Nexus Family! ✨</div>
                            <div style="font-size:10.5px; color:#fed7aa; font-weight:700;">💰 Shagun Wallet: <b id="nx-shagun-bal" style="color:#4ade80;">₹${shagunCoins}</b> • <b id="nx-diya-live-badge" style="color:#fde047;">🪔 ${diwaliCount} Diyas</b></div>
                        </div>
                    </div>
                    <button type="button" onclick="NexusDiwali.openOfficialDmStudio()" style="background:linear-gradient(135deg,#10b981,#059669); border:1px solid #a7f3d0; color:#020617; font-size:10.5px; font-weight:900; padding:5px 9px; border-radius:99px; cursor:pointer; box-shadow:0 2px 10px rgba(16,185,129,0.4);">👑 Official DM</button>
                </div>
                <div class="nx-diwali-grid">
                    <button type="button" class="nx-diwali-btn" onclick="NexusDiwali.lightDiya()"><span>🪔</span><span>दीया जलाएं</span></button>
                    <button type="button" class="nx-diwali-btn" onclick="NexusDiwali.launchFireworks()"><span>🎇</span><span>पटाखे फोड़ें</span></button>
                    <button type="button" class="nx-diwali-btn" onclick="NexusDiwali.openShagunModal()"><span>🧧</span><span>शगुन लिफाफा</span></button>
                    <button type="button" class="nx-diwali-btn" onclick="NexusDiwali.openWishCardModal()"><span>🎁</span><span>Wish Card</span></button>
                </div>
            `;
            homeTab.insertBefore(hub, homeTab.firstChild);
            if (litScreenDiyas > 0) renderOnScreenDiyaAltar();
        }
    }

    // Listen for live Official Broadcast Announcements so every online user sees a Royal Popup too!
    let officialBroadcastUnsub = null;
    let bootListenTime = Date.now();
    function listenForOfficialBroadcasts() {
        if (!window.Nexus || !Nexus.db || officialBroadcastUnsub) return;
        officialBroadcastUnsub = Nexus.db.collection("nexus_official_broadcasts")
            .orderBy("createdAt", "desc")
            .limit(1)
            .onSnapshot(snap => {
                snap.forEach(doc => {
                    const d = doc.data();
                    if (!d || !d.createdAt || d.createdAt < bootListenTime) return;
                    let me = getMe();
                    if (d.targetUser && d.targetUser !== 'ALL' && d.targetUser.toLowerCase() !== (me.username || '').toLowerCase()) return;
                    let seenKey = 'nx_seen_bcast_' + doc.id;
                    if (localStorage.getItem(seenKey)) return;
                    localStorage.setItem(seenKey, '1');

                    const modal = ensureCustomDiwaliModal();
                    let personalizedText = String(d.text || '').replace(/\{name\}/gi, me.name || me.username || 'Friend');
                    modal.innerHTML = `
                        <div style="width:100%; max-width:355px; background:linear-gradient(160deg,#0f172a,#1e1b4b); border:2px solid #fbbf24; border-radius:22px; padding:18px; color:#fff; box-shadow:0 20px 60px rgba(0,0,0,0.95); text-align:center;" onclick="event.stopPropagation();">
                            <div style="display:inline-flex; align-items:center; gap:6px; background:rgba(16,185,129,0.2); border:1px solid #10b981; color:#6ee7b7; padding:4px 12px; border-radius:99px; font-size:11px; font-weight:900; margin-bottom:10px;">
                                ✅ Official Message from Nexus Official
                            </div>
                            <h3 style="font-size:16px; font-weight:900; color:#fde047; margin:0 0 8px 0;">${(d.title || '🪔 Nexus Official Update').replace(/</g, '&lt;')}</h3>
                            <div style="background:rgba(9,13,22,0.85); border:1px solid #334155; border-radius:14px; padding:12px; font-size:13.5px; line-height:1.5; color:#f8fafc; text-align:left; white-space:pre-wrap; margin-bottom:14px;">${personalizedText.replace(/</g, '&lt;')}</div>
                            <div style="display:flex; gap:8px;">
                                <button type="button" onclick="document.getElementById('nx-diwali-custom-modal').style.display='none'; if(window.NexusDM) NexusDM.openDirectChat('nexus_official', 'Nexus Official ✅', '');" style="flex:1; background:#10b981; color:#020617; border:none; padding:10px; border-radius:12px; font-weight:900; cursor:pointer;">💬 Open in DM</button>
                                <button type="button" onclick="document.getElementById('nx-diwali-custom-modal').style.display='none'" style="padding:10px 14px; background:#1e293b; color:#cbd5e1; border:none; border-radius:12px; font-weight:800; cursor:pointer;">Close</button>
                            </div>
                        </div>
                    `;
                    modal.style.display = 'flex';
                    if (window.NexusDiwali) NexusDiwali.launchFireworks();
                });
            }, () => {});
    }

    window.NexusDiwali = {
        // 1. 🪔 Light Real Glowing & Flickering Diya Right on the Screen!
        lightDiya: function() {
            diwaliCount++;
            litScreenDiyas = Math.min(5, litScreenDiyas + 1);
            try {
                localStorage.setItem('nx_diwali_diyas_v1', String(diwaliCount));
                localStorage.setItem('nx_screen_lit_diyas_v1', String(litScreenDiyas));
            } catch (e) {}
            const badge = document.getElementById('nx-diya-live-badge');
            if (badge) badge.innerText = `🪔 ${diwaliCount} Diyas`;
            renderOnScreenDiyaAltar();
            this.launchFireworks();
            if (window.Nexus && Nexus.toast) Nexus.toast(`🪔 Diya #${diwaliCount} Lit on Your Screen! Shubh Deepavali!`);
        },

        hideScreenDiya: function() {
            litScreenDiyas = 0;
            try { localStorage.setItem('nx_screen_lit_diyas_v1', '0'); } catch (e) {}
            const altar = document.getElementById('nx-onscreen-diya-altar');
            if (altar) altar.style.display = 'none';
        },

        // 2. 🎇 Sky Fireworks
        launchFireworks: function() {
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

            for (let b = 0; b < 5; b++) {
                setTimeout(() => {
                    createBurst(cvs.width * (0.2 + Math.random() * 0.6), cvs.height * (0.18 + Math.random() * 0.45));
                }, b * 380);
            }

            let frames = 0;
            function animate() {
                frames++;
                ctx.clearRect(0, 0, cvs.width, cvs.height);
                for (let i = particles.length - 1; i >= 0; i--) {
                    const p = particles[i];
                    p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.alpha -= 0.019;
                    if (p.alpha <= 0) { particles.splice(i, 1); continue; }
                    ctx.globalAlpha = Math.max(0, p.alpha);
                    ctx.fillStyle = p.color;
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
                }
                if (frames < 195) requestAnimationFrame(animate);
                else cvs.remove();
            }
            animate();
        },

        // 3. 🧧 Diwali Shagun Lifafa & Wallet Modal for All Users
        openShagunModal: function() {
            let me = getMe();
            let rewards = [101, 251, 501, 1100];
            let won = rewards[Math.floor(Math.random() * rewards.length)];
            let curBal = parseInt(localStorage.getItem('nx_shagun_wallet_v1') || '101', 10) + won;
            try { localStorage.setItem('nx_shagun_wallet_v1', String(curBal)); } catch (e) {}
            const balEl = document.getElementById('nx-shagun-bal');
            if (balEl) balEl.innerText = `₹${curBal}`;

            const modal = ensureCustomDiwaliModal();
            modal.innerHTML = `
                <div style="width:100%; max-width:345px; background:linear-gradient(155deg,#451a03,#7c2d12,#0f172a); border:2px solid #fbbf24; border-radius:22px; padding:18px; text-align:center; color:#fff; box-shadow:0 20px 60px rgba(0,0,0,0.95);" onclick="event.stopPropagation();">
                    <div style="font-size:42px; margin-bottom:4px;">🧧✨</div>
                    <h3 style="font-size:17px; font-weight:900; color:#fde047; margin:0;">Nexus Diwali Shagun Lifafa!</h3>
                    <p style="font-size:12px; color:#fed7aa; margin:6px 0 12px 0;">Congratulations <b>${me.name || me.username}</b>! You unlocked:</p>
                    <div style="background:rgba(9,13,22,0.85); border:1.5px dashed #fbbf24; border-radius:16px; padding:14px; margin-bottom:14px;">
                        <div style="font-size:26px; font-weight:900; color:#4ade80;">+ ₹${won} Shagun Coins</div>
                        <div style="font-size:11.5px; color:#fde047; font-weight:800; margin-top:4px;">🏆 Total Diwali Wallet: ₹${curBal}</div>
                        <div style="font-size:11px; color:#cbd5e1; margin-top:6px;">"इस दिवाली आपकी मेहनत रंग लाए और आपका IIT-JEE / NEET में शानदार रैंक के साथ सिलेक्शन हो!"</div>
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button type="button" onclick="document.getElementById('nx-diwali-custom-modal').style.display='none'; NexusDiwali.shareShagunInChat(${won}, ${curBal});" style="flex:1; background:#fbbf24; color:#020617; border:none; padding:10px; border-radius:12px; font-weight:900; cursor:pointer;">📢 Share in Chat</button>
                        <button type="button" onclick="document.getElementById('nx-diwali-custom-modal').style.display='none'" style="padding:10px 14px; background:#1e293b; color:#cbd5e1; border:none; border-radius:12px; font-weight:800; cursor:pointer;">Close</button>
                    </div>
                </div>
            `;
            modal.style.display = 'flex';
            this.launchFireworks();
        },

        shareShagunInChat: async function(won, total) {
            let me = getMe();
            if (window.Nexus && Nexus.db) {
                await Nexus.db.collection("nexus_real_msgs").add({
                    roomId: 'casual_chat',
                    username: me.username,
                    sender: me.name || me.username,
                    text: `🧧✨ I just opened my Nexus Diwali Shagun Lifafa and won +₹${won} Shagun Coins (Total Wallet: ₹${total})! 🪔🎇 Happy Diwali Friends!`,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    createdAt: Date.now()
                }).catch(() => {});
                if (Nexus.toast) Nexus.toast("🧧 Shared in Casual Student Chat!");
            }
        },

        // 4. 🎁 Custom Royal Gold Wish Card Modal (Replaces White Browser Prompt in Screenshot 1000073891.jpg!)
        openWishCardModal: function() {
            const modal = ensureCustomDiwaliModal();
            const defaultWish = "🪔 आप सभी को और आपके परिवार को दिवाली की हार्दिक शुभकामनाएं! इस दिवाली आपके सारे IIT-JEE / NEET के सपने पूरे हों! ✨🎇";
            modal.innerHTML = `
                <div style="width:100%; max-width:355px; background:linear-gradient(160deg,#111827,#451a03); border:2px solid #fbbf24; border-radius:22px; padding:16px; color:#fff; box-shadow:0 20px 60px rgba(0,0,0,0.95);" onclick="event.stopPropagation();">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <strong style="font-size:15px; color:#fde047;">🎁 Send Royal Diwali Wish Card</strong>
                        <button type="button" onclick="document.getElementById('nx-diwali-custom-modal').style.display='none'" style="background:none; border:none; color:#cbd5e1; font-size:18px; cursor:pointer;">✕</button>
                    </div>
                    <div style="display:flex; gap:6px; overflow-x:auto; margin-bottom:8px; padding-bottom:4px;">
                        <button type="button" onclick="document.getElementById('nx-wish-custom-txt').value='🪔 दीपों का यह पावन त्योहार आपके जीवन में खुशियां, सफलता और IIT/NEET में टॉप रैंक लेकर आए! शुभ दीपावली! ✨'" style="background:#1e293b; border:1px solid #fbbf24; color:#fef08a; padding:5px 9px; border-radius:99px; font-size:10.5px; font-weight:800; white-space:nowrap; cursor:pointer;">✨ Topper Wish</button>
                        <button type="button" onclick="document.getElementById('nx-wish-custom-txt').value='🎇 दीयों की रोशनी से झिलमिलाता आंगन हो, पटाखों की गूंज से रोशन हर मन हो! Happy Diwali Mitra! 🪔'" style="background:#1e293b; border:1px solid #fbbf24; color:#fef08a; padding:5px 9px; border-radius:99px; font-size:10.5px; font-weight:800; white-space:nowrap; cursor:pointer;">🎇 Shayari Wish</button>
                    </div>
                    <textarea id="nx-wish-custom-txt" rows="4" style="width:100%; background:#090d16; border:1.5px solid #fbbf24; border-radius:12px; padding:10px; color:#fef08a; font-size:13px; line-height:1.45; outline:none; resize:none; margin-bottom:12px;">${defaultWish}</textarea>
                    <div style="display:flex; gap:8px;">
                        <button type="button" onclick="NexusDiwali.submitCustomWishCard()" style="flex:1; background:linear-gradient(135deg,#f59e0b,#eab308); color:#020617; border:none; padding:11px; border-radius:12px; font-weight:900; font-size:13px; cursor:pointer;">🚀 Send to Community Chat</button>
                    </div>
                </div>
            `;
            modal.style.display = 'flex';
        },

        submitCustomWishCard: async function() {
            const inp = document.getElementById('nx-wish-custom-txt');
            let customMsg = inp ? inp.value.trim() : '';
            if (!customMsg) return;
            document.getElementById('nx-diwali-custom-modal').style.display = 'none';
            let me = getMe();
            let cardText = `🪔✨ 【 𝐇𝐀𝐏𝐏𝐘 𝐃𝐈𝐖𝐀𝐋𝐈 𝟐𝟎𝟐𝟔 】 ✨🪔\n━━━━━━━━━━━━━━━━━━\n${customMsg}\n━━━━━━━━━━━━━━━━━━\n🎁 From: ${me.name || me.username} (@${me.username})`;
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
            if (window.Nexus && Nexus.toast) Nexus.toast("🎁 Royal Diwali Wish Card sent to Community Chat!");
        },

        // 5. 👑 NEXUS OFFICIAL DM & ALL-USERS BROADCAST STUDIO (FOR MOHIT / ADMIN & TESTING)
        openOfficialDmStudio: function() {
            ensureNexusOfficialInUsersList();
            const modal = ensureCustomDiwaliModal();
            let allUsers = (window.Nexus && Array.isArray(Nexus.users) ? Nexus.users : []).filter(u => u && u.username && u.username !== 'nexus_official');

            let userOptions = allUsers.map(u => `<option value="${u.username}">${u.name || u.username} (@${u.username})</option>`).join('');

            modal.innerHTML = `
                <div style="width:100%; max-width:370px; background:linear-gradient(165deg,#090d16,#111827,#064e3b); border:2px solid #10b981; border-radius:22px; padding:16px; color:#fff; box-shadow:0 20px 60px rgba(0,0,0,0.95);" onclick="event.stopPropagation();">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <div style="display:flex; align-items:center; gap:7px;">
                            <span style="background:#10b981; color:#020617; font-weight:900; padding:3px 8px; border-radius:8px; font-size:12px;">N ✓</span>
                            <div>
                                <div style="font-size:14px; font-weight:900; color:#f8fafc;">Nexus Official DM Studio</div>
                                <div style="font-size:10px; color:#6ee7b7;">Send Official 1:1 DM to 1 User or All Users</div>
                            </div>
                        </div>
                        <button type="button" onclick="document.getElementById('nx-diwali-custom-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>

                    <label style="font-size:11px; font-weight:800; color:#93c5fd; display:block; margin-bottom:4px;">👤 Choose Target User (or All Users):</label>
                    <select id="nx-off-target" style="width:100%; padding:9px 11px; border-radius:10px; border:1px solid #334155; background:#0f172a; color:#fff; font-size:12.5px; font-weight:800; outline:none; margin-bottom:10px;">
                        <option value="ALL">🌐 ALL USERS (${allUsers.length} Members — Personalized Broadcast)</option>
                        ${userOptions}
                    </select>

                    <label style="font-size:11px; font-weight:800; color:#fde047; display:block; margin-bottom:4px;">⚡ Quick Presets (Tap to Fill):</label>
                    <div style="display:flex; gap:6px; overflow-x:auto; margin-bottom:8px; padding-bottom:4px;">
                        <button type="button" onclick="document.getElementById('nx-off-msg').value='🪔 नमस्ते {name}! Nexus Official परिवार की तरफ से आपको और आपके परिवार को शुभ दीपावली! 🎇 खूब मन लगाकर पढ़ाई करें!'" style="background:#1e293b; border:1px solid #fbbf24; color:#fef08a; padding:5px 8px; border-radius:8px; font-size:10.5px; font-weight:800; white-space:nowrap; cursor:pointer;">🪔 Diwali Official DM</button>
                        <button type="button" onclick="document.getElementById('nx-off-msg').value='📝 Hello {name}! Nexus Live Test Series और Mock Arena अपडेट हो चुका है। आज ही अपना टेस्ट अटेम्प्ट करें और रैंक चेक करें! 🚀'" style="background:#1e293b; border:1px solid #38bdf8; color:#7dd3fc; padding:5px 8px; border-radius:8px; font-size:10.5px; font-weight:800; white-space:nowrap; cursor:pointer;">📝 Exam / Test Update</button>
                        <button type="button" onclick="document.getElementById('nx-off-msg').value='👋 Hi {name}! आपको Nexus वेबसाइट के नए फीचर्स कैसे लगे? कोई भी सुझाव हो तो हमें जरूर बताएं! 💚'" style="background:#1e293b; border:1px solid #10b981; color:#6ee7b7; padding:5px 8px; border-radius:8px; font-size:10.5px; font-weight:800; white-space:nowrap; cursor:pointer;">💬 Feedback DM</button>
                    </div>

                    <label style="font-size:10.5px; color:#cbd5e1; display:block; margin-bottom:4px;">✉️ Official Message (Tip: Use <b>{name}</b> for user's name):</label>
                    <textarea id="nx-off-msg" rows="4" placeholder="Type official message here..." style="width:100%; background:#090d16; border:1.5px solid #10b981; border-radius:12px; padding:10px; color:#fff; font-size:13px; line-height:1.45; outline:none; resize:none; margin-bottom:12px;">🪔 नमस्ते {name}! Nexus Official परिवार की तरफ से आपको और आपके परिवार को शुभ दीपावली! 🎇</textarea>

                    <button type="button" id="nx-off-send-btn" onclick="NexusDiwali.sendOfficialDmNow()" style="width:100%; background:linear-gradient(135deg,#10b981,#059669); color:#020617; border:none; padding:11px; border-radius:12px; font-weight:900; font-size:13.5px; cursor:pointer;">✅ Send from Nexus Official</button>
                </div>
            `;
            modal.style.display = 'flex';
        },

        sendOfficialDmNow: async function() {
            const targetSel = document.getElementById('nx-off-target');
            const msgIn = document.getElementById('nx-off-msg');
            const btn = document.getElementById('nx-off-send-btn');
            if (!targetSel || !msgIn || !window.Nexus || !Nexus.db) return;

            let targetVal = targetSel.value;
            let rawText = msgIn.value.trim();
            if (!rawText) return;

            if (btn) { btn.disabled = true; btn.innerText = '⏳ Sending Official DM...'; }

            let allUsers = (Nexus.users || []).filter(u => u && u.username && u.username !== 'nexus_official');
            let recipients = targetVal === 'ALL'
                ? allUsers
                : allUsers.filter(u => u.username.toLowerCase() === targetVal.toLowerCase());

            if (recipients.length === 0 && targetVal !== 'ALL') {
                recipients = [{ username: targetVal, name: targetVal }];
            }

            let nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            let sentCount = 0;

            for (const u of recipients) {
                let personalized = rawText.replace(/\{name\}/gi, u.name || u.username);
                let officialText = `✅ 【 𝐍𝐄𝐗𝐔𝐒 𝐎𝐅𝐅𝐈𝐂𝐈𝐀𝐋 】\n${personalized}`;
                let rk = getRoomKey('nexus_official', u.username);

                try {
                    // 1. Deliver into 1:1 DM collection under Nexus Official
                    await Nexus.db.collection("nexus_private_dms").add({
                        roomKey: rk,
                        participants: ['nexus_official', u.username.toLowerCase()],
                        fromUser: 'nexus_official',
                        fromName: 'Nexus Official ✅',
                        toUser: u.username,
                        text: officialText,
                        imgUrl: '',
                        imgUrls: [],
                        sticker: null,
                        replyTo: null,
                        likes: [],
                        seen: false,
                        edited: false,
                        time: nowTime,
                        createdAt: Date.now()
                    });

                    // 2. Also trigger notification bell alert for recipient
                    await Nexus.db.collection("nexus_notifications").add({
                        toUser: u.username,
                        fromUser: 'nexus_official',
                        fromName: 'Nexus Official ✅',
                        type: 'dm',
                        text: `sent an official message: "${personalized.substring(0, 42)}..."`,
                        createdAt: Date.now()
                    });
                    sentCount++;
                } catch (e) {}
            }

            // 3. Trigger live broadcast popup card for online recipients
            await Nexus.db.collection("nexus_official_broadcasts").add({
                title: '✅ Nexus Official Message',
                text: rawText,
                targetUser: targetVal,
                createdAt: Date.now()
            }).catch(() => {});

            document.getElementById('nx-diwali-custom-modal').style.display = 'none';
            this.launchFireworks();
            if (window.Nexus && Nexus.toast) {
                Nexus.toast(`✅ Official DM sent to ${sentCount} user(s)!`);
            }
        }
    };

    sanitizePlusTraysAndHooks();
    mountDiwaliFestivalHub();
    setTimeout(listenForOfficialBroadcasts, 1200);
    setInterval(() => {
        sanitizePlusTraysAndHooks();
        mountDiwaliFestivalHub();
    }, 450);
})();
// === END OF DMTOOLS.JS ===
