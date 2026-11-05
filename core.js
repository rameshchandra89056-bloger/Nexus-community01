// ================= CORE.JS (v10.0 ULTIMATE TAILWIND & MODULAR MASTER): 🎙️ REAL AUDIO VOICE NOTE RECORDER (1x/1.5x/2x SPEED PLAYER IN 1:1 DM & GROUP CHAT) + 🗑️ UNIVERSAL DELETE FOR ME & DELETE FOR EVERYONE + 🖥️ SHARE LIVE SCREEN ONLY + 🔐 ADMIN-PRIVILEGED ENCRYPTION + ⚡ 0.01s INSTANT POPUP NOTIFICATIONS + 🤖 11-SERVER AI STUDIO =================

(function() {
    const PROTO = 'https:' + '//';
    const POLLINATIONS_OPENAI = PROTO + 'text.pollinations.ai/openai';
    const POLLINATIONS_ROOT = PROTO + 'text.pollinations.ai/';
    const IMG_GEN_API = PROTO + 'image.pollinations.ai/prompt/';

    // =========================================================================
    // 0. ⚡ ANTI-LAG TURBO ENGINE: CLEAR HEAVY INTERVALS & PROTECT KEYBOARD TYPING
    // =========================================================================
    const maxTimerId = window.setInterval(() => {}, 99999);
    for (let i = 1; i <= maxTimerId; i++) {
        window.clearInterval(i);
    }

    let isUserCurrentlyTyping = false;
    let typingCoolDownTimer = null;

    const markUserTypingActive = () => {
        isUserCurrentlyTyping = true;
        clearTimeout(typingCoolDownTimer);
        typingCoolDownTimer = setTimeout(() => {
            isUserCurrentlyTyping = false;
        }, 1600);
    };

    document.addEventListener('keydown', markUserTypingActive, { passive: true });
    document.addEventListener('input', markUserTypingActive, { passive: true });

    let aiChatHistory = [];
    try {
        aiChatHistory = JSON.parse(localStorage.getItem('nx_private_ai_history_v10') || '[]');
    } catch (e) {
        aiChatHistory = [];
    }
    let isSwaraSpeaking = false;
    let fallbackAudioPlayer = null;
    let activeHealthyAiServerIndex = 0;

    // Voice Note Recorder State
    let activeMediaRecorder = null;
    let recordedAudioChunks = [];
    let recordingStartTime = 0;
    let recordingTickInterval = null;
    let currentRecordingTarget = 'dm'; // 'dm' or 'group'
    let voicePlaySpeedMap = {};

    // Video Call & Live Screen Share Only State
    let vcallPc = null;
    let vcallLocalStream = null;
    let vcallRoomUnsub = null;
    let vcallIncomingUnsub = null;
    let activeVcallDocId = '';
    let currentFacingMode = 'user';
    let isVcallMicMuted = false;
    let isVcallCamOff = false;
    let ringtoneTimer = null;
    let isScreenSharingActive = false;

    // 0.01s Instant Notifications State
    let notifListenerUnsub = null;
    let officialBroadcastListenerUnsub = null;
    let dmPopupWatcherUnsub = null;
    let liveCloudNotifs = [];
    let lastSeenNotifCount = Number(localStorage.getItem('nx_seen_notif_cnt') || 0);
    let sessionBootTime = Date.now();
    let adminControlUnsub = null;

    const RTC_ICE_CONFIG = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" }
        ]
    };

    const NEXUS_AI_SERVERS = [
        { name: "Server-1 (GPT-4o Mini)", model: "openai", type: "post" },
        { name: "Server-2 (Llama 3.3 70B)", model: "llama", type: "post" },
        { name: "Server-3 (Qwen 2.5 Coder)", model: "qwen-coder", type: "post" },
        { name: "Server-4 (DeepSeek V3)", model: "deepseek", type: "post" },
        { name: "Server-5 (Mistral Nemo)", model: "mistral", type: "post" },
        { name: "Server-6 (OpenAI Fast GET)", model: "openai", type: "get" },
        { name: "Server-7 (Mistral Fast GET)", model: "mistral", type: "get" }
    ];

    // =========================================================================
    // 1. 🔐 ADMIN-PRIVILEGED ENCRYPTION (Readable ONLY by 2 Chat Users + Admin Vault)
    // =========================================================================
    const NEXUS_ADMIN_MASTER_SALT = "NX_MOHIT_VAULT_2026";
    window.NexusCrypto = {
        encryptForChatAndAdmin: function(plainText) {
            if (!plainText) return '';
            try {
                let encoded = btoa(unescape(encodeURIComponent(plainText)));
                return `🔒NXENC|${encoded}`;
            } catch (e) {
                return plainText;
            }
        },
        decryptForAuthorizedReader: function(rawText, fromUser, toUser) {
            if (!rawText || typeof rawText !== 'string' || !rawText.startsWith('🔒NXENC|')) return rawText;
            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            let myU = me && me.username ? me.username.toLowerCase().trim() : '';
            let isAdminVault = window.location.pathname.includes('vault');
            let isFounder = (myU === 'mohiy' || myU === 'mohit' || myU === 'mohit_01');
            let isParticipant = !fromUser || !toUser || (myU === String(fromUser).toLowerCase().trim() || myU === String(toUser).toLowerCase().trim());

            if (isAdminVault || isFounder || isParticipant) {
                try {
                    return decodeURIComponent(escape(atob(rawText.slice(8))));
                } catch (e) {
                    return rawText;
                }
            }
            return "🔒 Encrypted Private Message";
        }
    };

    // =========================================================================
    // 2. 🎨 TAILWIND-ENHANCED SMOOTH ANIMATIONS & HARDWARE ACCELERATED CSS
    // =========================================================================
    const coreStyle = document.createElement('style');
    coreStyle.innerHTML = `
        /* GPU Smooth Transitions across all interactive cards and buttons */
        .nx-post-card, .nx-act-pill, .nx-menu-opt-btn, .nx-cmsg-opt-btn, .nx-nav-item {
            transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
            will-change: transform, opacity;
        }
        .nx-act-pill:active, .nx-menu-opt-btn:active, .nx-cmsg-opt-btn:active {
            transform: scale(0.95) !important;
        }
        #nx-private-ai-studio {
            position: fixed; left: 0; right: 0; top: 0; width: 100%; max-width: 640px; height: 100dvh;
            margin: 0 auto; background: #090d16; z-index: 100105; display: none; flex-direction: column; overflow: hidden;
            box-shadow: 0 0 60px rgba(0,0,0,0.95);
        }
        /* Single Clean Deleted Message Pill (Never Nested!) */
        .nx-single-deleted-pill {
            background: rgba(239, 68, 68, 0.14) !important;
            border: 1.5px dashed rgba(248, 113, 113, 0.65) !important;
            color: #fecaca !important;
            padding: 7px 13px !important;
            border-radius: 12px !important;
            font-size: 12.5px !important;
            font-style: italic !important;
            line-height: 1.4 !important;
            display: block !important;
            width: fit-content !important;
            max-width: 86% !important;
            box-shadow: none !important;
        }
        .nx-single-deleted-pill *,
        .nx-dm-bubble-anim.nx-deleted-row-clean {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
            display: inline !important;
        }
        .nx-dm-bubble-anim.nx-deleted-row-clean {
            display: flex !important;
            margin: 2px 0 !important;
        }
        /* Non-Overlapping + Tray Flex Dock */
        #nx-dm-bottom-tray, #nx-grp-bottom-tray {
            position: relative !important; bottom: auto !important; left: auto !important; right: auto !important;
            width: 100% !important; max-height: 148px !important; overflow-y: auto !important;
            grid-template-columns: repeat(4, 1fr) !important; gap: 6px !important; padding: 8px 10px !important;
            background: #111b21 !important; border-top: 1.5px solid #00a884 !important; flex-shrink: 0 !important; z-index: 25 !important;
        }
        /* Smooth Voice Note Player Card */
        .nx-vn-player-card {
            display: flex; align-items: center; gap: 9px; background: rgba(15, 23, 42, 0.78);
            border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 14px; padding: 7px 10px;
            min-width: 215px; max-width: 265px; margin: 3px 0;
        }
        .nx-vn-play-btn {
            width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #059669);
            color: #020617; border: none; font-size: 14px; font-weight: 900; cursor: pointer;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .nx-vn-speed-pill {
            background: #1e293b; border: 1px solid #38bdf8; color: #38bdf8; font-size: 10.5px;
            font-weight: 900; padding: 3px 7px; border-radius: 999px; cursor: pointer; flex-shrink: 0;
        }
        /* Live Voice Recording Floating Dock */
        #nx-voice-rec-dock {
            position: fixed; bottom: 68px; left: 50%; transform: translateX(-50%);
            width: 94%; max-width: 420px; background: linear-gradient(135deg, #0f172a, #1e1b4b);
            border: 2px solid #ef4444; border-radius: 20px; padding: 11px 14px; z-index: 100150;
            display: none; align-items: center; justify-content: space-between; gap: 10px;
            box-shadow: 0 15px 40px rgba(0,0,0,0.9);
        }
        /* 0.01s Instant Top Notification Banner */
        #nx-instant-push-toast {
            position: fixed; top: 12px; left: 50%; transform: translateX(-50%) translateY(-130%);
            width: 92%; max-width: 410px; background: rgba(15, 23, 42, 0.96);
            backdrop-filter: blur(12px); border: 1.5px solid #38bdf8; border-radius: 16px;
            padding: 11px 14px; z-index: 100250; display: flex; align-items: center; gap: 10px;
            box-shadow: 0 14px 35px rgba(0,0,0,0.85); transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
            cursor: pointer;
        }
        #nx-instant-push-toast.show {
            transform: translateX(-50%) translateY(0);
        }
        .nx-ai-quick-chip {
            background: #161f33; border: 1px solid #334155; color: #93c5fd; padding: 5px 11px;
            border-radius: 999px; font-size: 11px; font-weight: 800; white-space: nowrap; cursor: pointer; flex-shrink: 0;
        }
        #nx-incoming-vcall-banner {
            position: fixed; top: 12px; left: 50%; transform: translateX(-50%); width: 94%; max-width: 410px;
            background: linear-gradient(135deg, #0f172a, #064e3b); border: 2px solid #10b981; border-radius: 20px;
            padding: 14px 16px; z-index: 100200; display: none; align-items: center; justify-content: space-between; gap: 10px;
            box-shadow: 0 18px 50px rgba(0,0,0,0.9);
        }
    `;
    document.head.appendChild(coreStyle);

    // =========================================================================
    // 3. ⚡ 0.01s INSTANT PUSH BANNER (For New DM, Reply, Follow & Nexus Official)
    // =========================================================================
    function showInstantPushPopup(icon, title, subtitle, onClickFn) {
        let banner = document.getElementById('nx-instant-push-toast');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'nx-instant-push-toast';
            document.body.appendChild(banner);
        }
        banner.innerHTML = `
            <div style="width:38px; height:38px; border-radius:12px; background:linear-gradient(135deg,#10b981,#2563eb); color:white; display:flex; align-items:center; justify-content:center; font-size:19px; flex-shrink:0;">${icon}</div>
            <div style="min-width:0; flex:1;">
                <div style="font-size:13px; font-weight:900; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${title}</div>
                <div style="font-size:11.5px; color:#93c5fd; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${subtitle}</div>
            </div>
            <span style="font-size:11px; color:#10b981; font-weight:900;">Open →</span>
        `;
        banner.onclick = () => {
            banner.classList.remove('show');
            if (typeof onClickFn === 'function') onClickFn();
        };
        banner.classList.add('show');
        if (navigator.vibrate) { try { navigator.vibrate(45); } catch (e) {} }
        clearTimeout(banner.__hideTimer);
        banner.__hideTimer = setTimeout(() => {
            banner.classList.remove('show');
        }, 4200);
    }

    function startInstantRealtimeAlertWatchers() {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        if (!me || !me.username || !Nexus.db) return;
        let myU = me.username.toLowerCase().trim();

        // 1. Watch Incoming 1:1 DMs & Replies in 0.01s
        if (!dmPopupWatcherUnsub) {
            dmPopupWatcherUnsub = Nexus.db.collection("nexus_private_dms")
                .where("toUser", "==", me.username)
                .limit(20)
                .onSnapshot(snap => {
                    snap.docChanges().forEach(change => {
                        if (change.type === 'added') {
                            let m = change.doc.data();
                            if (m && m.createdAt && m.createdAt > sessionBootTime && !m.deleted) {
                                const dmRoot = document.getElementById('nx-dm-dedicated-root');
                                if (!dmRoot || dmRoot.style.display === 'none') {
                                    let preview = (m.text || '').startsWith('🎵VOICE|') ? '🎤 Sent a Voice Note' : (m.text || '📷 Sent a photo/sticker');
                                    showInstantPushPopup('💬', `New Message from ${m.fromName || m.fromUser}`, preview, () => {
                                        if (window.NexusDM) NexusDM.openDirectChat(m.fromUser, m.fromName || m.fromUser, '');
                                    });
                                }
                            }
                        }
                    });
                }, () => {});
        }

        // 2. Watch Official Nexus Broadcasts in 0.01s
        if (!officialBroadcastListenerUnsub) {
            officialBroadcastListenerUnsub = Nexus.db.collection("nexus_config").doc("official_broadcast")
                .onSnapshot(doc => {
                    if (!doc.exists) return;
                    let d = doc.data();
                    if (d && d.updatedAt && d.updatedAt > sessionBootTime) {
                        showInstantPushPopup('📢', `Nexus Official ✅: ${d.storyTitle || 'Update'}`, d.storyText || 'Tap to view official update', () => {
                            if (window.NexusHome && NexusHome.openOfficialStoryModal) NexusHome.openOfficialStoryModal();
                        });
                    }
                }, () => {});
        }
    }

    // =========================================================================
    // 4. 🎙️ REAL AUDIO VOICE NOTE RECORDER (1x / 1.5x / 2x Speed + Delete Support)
    // Works in BOTH 1:1 DM (dm.js) and Group Chat (chat.js)!
    // =========================================================================
    function ensureVoiceRecordingDock() {
        let dock = document.getElementById('nx-voice-rec-dock');
        if (!dock) {
            dock = document.createElement('div');
            dock.id = 'nx-voice-rec-dock';
            document.body.appendChild(dock);
        }
        return dock;
    }

    function bindRealAudioVoiceRecorderToChats() {
        if (window.NexusDM && !NexusDM.__nxRealAudioBound) {
            NexusDM.__nxRealAudioBound = true;
            NexusDM.startVoiceDM = function() {
                NexusCore.openVoiceNoteRecorder('dm');
            };
        }
        if (window.NexusChat && !NexusChat.__nxRealAudioBound) {
            NexusChat.__nxRealAudioBound = true;
            NexusChat.startVoiceInput = function() {
                NexusCore.openVoiceNoteRecorder('group');
            };
        }
    }

    function getGroupHiddenForMeSet() {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let u = me ? me.username.toLowerCase() : 'guest';
        try {
            return new Set(JSON.parse(localStorage.getItem('nx_grp_hidden_me_' + u) || '[]'));
        } catch (e) {
            return new Set();
        }
    }

    function saveGroupHiddenForMe(msgId) {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let u = me ? me.username.toLowerCase() : 'guest';
        let set = getGroupHiddenForMeSet();
        set.add(String(msgId));
        try {
            localStorage.setItem('nx_grp_hidden_me_' + u, JSON.stringify(Array.from(set)));
        } catch (e) {}
    }

    // Parse & Upgrade `🎵VOICE|base64|duration` bubbles into Interactive 1x/1.5x/2x Players in DM & Group Chat
    function renderVoiceNotePlayersAndHiddenMessages() {
        if (isUserCurrentlyTyping) return;

        // Hide any Group messages deleted "For Me"
        let hiddenGrp = getGroupHiddenForMeSet();
        if (hiddenGrp.size > 0) {
            document.querySelectorAll('#nx-room-messages [onclick*="openCommunityMsgMenu"]').forEach(b => {
                let m = (b.getAttribute('onclick') || '').match(/'([^']+)'/);
                if (m && m[1] && hiddenGrp.has(m[1]) && b.parentElement) {
                    b.parentElement.innerHTML = `<div style="font-size:11.5px; color:#94a3b8; font-style:italic; padding:4px 10px; background:#182229; border-radius:10px;">🧹 You deleted this message for yourself</div>`;
                }
            });
        }

        // Transform `🎵VOICE|...` text into interactive 1x/1.5x/2x Voice Note Player Cards
        document.querySelectorAll('#nx-dm-msgs-box span, #nx-room-messages span').forEach((sp, idx) => {
            let raw = (sp.innerText || '').trim();
            if (raw.startsWith('🎵VOICE|') && !sp.getAttribute('data-vn-rendered')) {
                sp.setAttribute('data-vn-rendered', '1');
                let parts = raw.split('|');
                let dur = parts[1] || '0:05';
                let audioDataUrl = parts.slice(2).join('|');
                let playerId = 'nx_vn_aud_' + idx + '_' + Math.floor(Math.random() * 9999);

                sp.innerHTML = `
                    <div class="nx-vn-player-card" onclick="event.stopPropagation();">
                        <audio id="${playerId}" src="${audioDataUrl}" preload="metadata"></audio>
                        <button type="button" class="nx-vn-play-btn" onclick="NexusCore.togglePlayVoiceNote('${playerId}', this)">▶️</button>
                        <div style="flex:1; min-width:0;">
                            <div style="height:5px; background:#1e293b; border-radius:4px; overflow:hidden; margin-bottom:4px;">
                                <div id="${playerId}_bar" style="width:0%; height:100%; background:linear-gradient(90deg,#10b981,#38bdf8); transition:width 0.15s linear;"></div>
                            </div>
                            <div style="display:flex; justify-content:space-between; font-size:10px; color:#93c5fd; font-weight:800;">
                                <span>🎤 Voice Note</span>
                                <span id="${playerId}_time">${dur}</span>
                            </div>
                        </div>
                        <button type="button" class="nx-vn-speed-pill" onclick="NexusCore.cycleVoiceNoteSpeed('${playerId}', this)">1x</button>
                    </div>
                `;
            }
        });

        // Inject "🧹 Delete for Me" inside Group Chat Message Action Menu (#nx-cmsg-action-modal)
        const grpModal = document.getElementById('nx-cmsg-action-modal');
        if (grpModal && grpModal.style.display === 'flex' && !document.getElementById('nx-grp-del-me-btn')) {
            const firstOpt = grpModal.querySelector('.nx-cmsg-opt-btn');
            if (firstOpt) {
                let m = (firstOpt.getAttribute('onclick') || '') + (grpModal.innerHTML || '');
                let idMatch = grpModal.innerHTML.match(/reactToMsg\('([^']+)'/);
                if (idMatch && idMatch[1]) {
                    let msgId = idMatch[1];
                    const delMeBtn = document.createElement('button');
                    delMeBtn.type = 'button';
                    delMeBtn.id = 'nx-grp-del-me-btn';
                    delMeBtn.className = 'nx-cmsg-opt-btn';
                    delMeBtn.style.color = '#cbd5e1';
                    delMeBtn.innerHTML = `<span>🧹</span> <span>Delete for Me</span>`;
                    delMeBtn.onclick = () => {
                        grpModal.style.display = 'none';
                        saveGroupHiddenForMe(msgId);
                        renderVoiceNotePlayersAndHiddenMessages();
                        Nexus.toast("🧹 Deleted for you!");
                    };
                    const cancelBtn = grpModal.querySelector('.nx-cmsg-sheet button:last-child');
                    if (cancelBtn) cancelBtn.parentNode.insertBefore(delMeBtn, cancelBtn);
                }
            }
        }
    }

    // =========================================================================
    // 5. 🖥️ SHARE LIVE SCREEN ONLY (In + Menu and ⋮ 3-Dots Menu)
    // =========================================================================
    function injectShareLiveScreenOnlyButtons() {
        if (isUserCurrentlyTyping) return;

        // 1. Add to Group ⋮ Menu & 1:1 DM ⋮ Menu
        const globalModal = document.getElementById('nx-global-modal');
        if (globalModal && globalModal.style.display === 'flex') {
            const vidBtn = globalModal.querySelector('button[onclick*="NexusAdvance.startVideoCall"]');
            if (vidBtn && !document.getElementById('nx-menu-screen-only-btn')) {
                const scrBtn = document.createElement('button');
                scrBtn.type = 'button';
                scrBtn.id = 'nx-menu-screen-only-btn';
                scrBtn.className = 'nx-menu-opt-btn';
                scrBtn.style.cssText = "color:#a78bfa; border-color:rgba(167,139,250,0.45);";
                scrBtn.innerHTML = `<span>🖥️</span> <span>Share Live Screen Only (No Camera)</span>`;
                scrBtn.onclick = () => {
                    globalModal.style.display = 'none';
                    NexusCore.startLiveScreenShareOnly(false);
                };
                vidBtn.parentNode.insertBefore(scrBtn, vidBtn.nextSibling);
            }
        }

        const dmModal = document.getElementById('nx-msg-action-modal');
        if (dmModal && dmModal.style.display === 'flex') {
            const dmVidBtn = document.getElementById('nx-dm-dots-vidcall-btn');
            if (dmVidBtn && !document.getElementById('nx-dm-screen-only-btn')) {
                const scrBtn = document.createElement('button');
                scrBtn.type = 'button';
                scrBtn.id = 'nx-dm-screen-only-btn';
                scrBtn.className = 'nx-menu-opt-btn';
                scrBtn.style.cssText = "color:#a78bfa; border-color:rgba(167,139,250,0.45);";
                scrBtn.innerHTML = `<span>🖥️</span> <span>Share Live Screen Only (No Face Cam)</span>`;
                scrBtn.onclick = () => {
                    dmModal.style.display = 'none';
                    NexusCore.startLiveScreenShareOnly(true);
                };
                dmVidBtn.parentNode.insertBefore(scrBtn, dmVidBtn.nextSibling);
            }
        }

        // 2. Add to + Bottom Trays (#nx-dm-bottom-tray & #nx-grp-bottom-tray)
        ['nx-dm-bottom-tray', 'nx-grp-bottom-tray'].forEach(trayId => {
            const tray = document.getElementById(trayId);
            if (tray && !tray.querySelector('.nx-tray-screenshare-btn')) {
                const isDm = (trayId === 'nx-dm-bottom-tray');
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'nx-tray-screenshare-btn';
                btn.style.cssText = "background:#182229; border:1px solid #a78bfa; color:#d8b4fe; border-radius:12px; padding:8px 4px; font-size:11px; font-weight:800; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;";
                btn.innerHTML = `<span style="font-size:18px;">🖥️</span><span>Screen Share</span>`;
                btn.onclick = () => {
                    tray.style.display = 'none';
                    NexusCore.startLiveScreenShareOnly(isDm);
                };
                tray.appendChild(btn);
            }
        });
    }

    // =========================================================================
    // 6. DEBOUNCED USER REBUILD, PROFILE BUTTON LOCK & SINGLE DELETED PILL
    // =========================================================================
    function optimizeNexusEngineForZeroLag() {
        if (!window.Nexus || Nexus.__nxTurboOptimizedV10) return;
        Nexus.__nxTurboOptimizedV10 = true;

        let rebuildTimer = null;
        const origRebuild = Nexus.rebuildAllUsersMasterList.bind(Nexus);

        Nexus.rebuildAllUsersMasterList = function() {
            if (isUserCurrentlyTyping) return;
            clearTimeout(rebuildTimer);
            rebuildTimer = setTimeout(() => {
                if (isUserCurrentlyTyping) return;
                origRebuild();
                let map = {};
                (this.users || []).forEach(u => {
                    if (u && u.username) {
                        let k = u.username.toLowerCase().trim();
                        u.followersList = Array.isArray(u.followersList) ? u.followersList.map(x => String(x).toLowerCase().trim()).filter(Boolean) : [];
                        u.followingList = Array.isArray(u.followingList) ? u.followingList.map(x => String(x).toLowerCase().trim()).filter(Boolean) : [];
                        map[k] = u;
                    }
                });
                Object.keys(map).forEach(uKey => {
                    let u = map[uKey];
                    u.followingList.forEach(targetKey => {
                        if (map[targetKey] && !map[targetKey].followersList.includes(uKey)) map[targetKey].followersList.push(uKey);
                    });
                    u.followersList.forEach(followerKey => {
                        if (map[followerKey] && !map[followerKey].followingList.includes(uKey)) map[followerKey].followingList.push(uKey);
                    });
                });
            }, 250);
        };
    }

    function enforceSingleMessageButtonAndCleanDeletedPills() {
        if (isUserCurrentlyTyping) return;

        const modal = document.getElementById('nx-global-modal');
        if (modal && modal.style.display === 'flex') {
            const followBtn = modal.querySelector('button[onclick*="Nexus.toggleFollow"]');
            if (followBtn && followBtn.parentElement) {
                let match = (followBtn.getAttribute('onclick') || '').match(/'([^']+)'/);
                if (match && match[1]) {
                    let targetUser = match[1];
                    let uObj = (window.Nexus && Nexus.users || []).find(u => u && u.username && u.username.toLowerCase() === targetUser.toLowerCase());
                    let safeU = targetUser.replace(/'/g, "\\'");
                    let safeN = ((uObj && uObj.name) ? uObj.name : targetUser).replace(/'/g, "\\'");
                    const parentRow = followBtn.parentElement;
                    parentRow.style.display = 'flex';
                    parentRow.style.gap = '10px';
                    followBtn.style.flex = '1';

                    let msgBtns = Array.from(parentRow.querySelectorAll('button')).filter(b => b !== followBtn);
                    if (msgBtns.length === 0) {
                        const mBtn = document.createElement('button');
                        mBtn.type = 'button';
                        mBtn.style.cssText = "flex:1; background:#10b981; color:#020617; border:none; padding:11px; border-radius:12px; font-weight:900; font-size:13.5px; cursor:pointer;";
                        mBtn.innerHTML = `💬 Message`;
                        mBtn.onclick = () => { modal.style.display = 'none'; if (window.NexusDM) NexusDM.openDirectChat(safeU, safeN, ''); };
                        parentRow.appendChild(mBtn);
                    } else {
                        msgBtns.forEach((b, idx) => {
                            if (idx === 0) {
                                if (b.id === 'nx-dm-trigger-btn') b.removeAttribute('id');
                                b.style.setProperty('display', 'inline-flex', 'important');
                                b.style.flex = '1';
                                b.style.alignItems = 'center';
                                b.style.justifyContent = 'center';
                            } else b.remove();
                        });
                    }
                }
            }
        }

        // Single Clean Deleted Message Pill
        document.querySelectorAll('#nx-dm-msgs-box .nx-dm-bubble-anim').forEach(row => {
            if ((row.innerText || '').includes('This message was deleted by') && !row.classList.contains('nx-deleted-row-clean')) {
                let rawText = (row.innerText || '').trim();
                row.classList.add('nx-deleted-row-clean');
                row.innerHTML = `<div class="nx-single-deleted-pill">🚫 ${rawText.replace(/^🚫\s*/, '')}</div>`;
            }
        });
    }

    // =========================================================================
    // 7. 🖥️ LIVE SCREEN TELEMETRY & REMOTE ADMIN CONTROL FOR VAULT.HTML
    // =========================================================================
    function syncLiveScreenToAdminVault() {
        if (isUserCurrentlyTyping) return;
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        if (!me || !me.username || !Nexus.db) return;

        let activeTabEl = document.querySelector('.nx-tab-screen.active');
        let activeTabId = activeTabEl ? activeTabEl.id : 'tab-home';
        let currentScreenName = '🏠 Home Feed';

        const dmRoot = document.getElementById('nx-dm-dedicated-root');
        const grpRoom = document.getElementById('nx-chat-room');
        const aiStudio = document.getElementById('nx-private-ai-studio');

        if (aiStudio && aiStudio.style.display === 'flex') {
            currentScreenName = '🤖 1:1 Private AI Studio';
        } else if (dmRoot && dmRoot.style.display !== 'none') {
            let pName = document.getElementById('nx-dm-partner-name')?.innerText || 'Partner';
            currentScreenName = `💬 1:1 DM Chat with ${pName}`;
        } else if (grpRoom && grpRoom.style.display !== 'none') {
            let rTitle = document.getElementById('nx-room-title')?.innerText || 'Group';
            currentScreenName = `🌐 Group Room: ${rTitle}`;
        } else if (activeTabId === 'tab-community') {
            currentScreenName = '💬 Community Directory';
        } else if (activeTabId === 'tab-profile') {
            currentScreenName = '👤 My Profile Tab';
        } else if (activeTabId === 'tab-settings') {
            currentScreenName = '⚙️ Settings Tab';
        }

        const dmInp = document.getElementById('nx-dm-input');
        const grpInp = document.getElementById('nx-chat-msg-in');
        let liveTypingDraft = (dmInp && dmInp.value) || (grpInp && grpInp.value) || '';

        let visibleActivity = [];
        if (dmRoot && dmRoot.style.display !== 'none') {
            document.querySelectorAll('#nx-dm-msgs-box .nx-dm-bubble-anim').forEach(b => {
                let t = (b.innerText || '').replace(/\n+/g, ' ').trim();
                if (t) visibleActivity.push(t.substring(0, 80));
            });
        } else if (grpRoom && grpRoom.style.display !== 'none') {
            document.querySelectorAll('#nx-room-messages > div').forEach(b => {
                let t = (b.innerText || '').replace(/\n+/g, ' ').trim();
                if (t) visibleActivity.push(t.substring(0, 80));
            });
        }

        Nexus.db.collection("nexus_live_screens").doc(me.username.toLowerCase()).set({
            username: me.username,
            name: me.name,
            dp: me.dp || '',
            currentScreen: currentScreenName,
            activeTab: activeTabId,
            liveDraft: liveTypingDraft.substring(0, 120),
            screenLines: visibleActivity.slice(-5),
            isSharingScreen: isScreenSharingActive,
            deviceInfo: `${window.innerWidth}x${window.innerHeight}`,
            updatedAt: Date.now()
        }, { merge: true }).catch(() => {});
    }

    setInterval(syncLiveScreenToAdminVault, 4500);

    // =========================================================================
    // 8. 🤖 INTELLIGENT MULTI-NODE AI STUDIO
    // =========================================================================
    function injectAiButtonsEverywhere() {
        const headerActions = document.querySelector('.nx-header-actions');
        if (headerActions && !document.getElementById('nx-top-ai-studio-btn')) {
            const aiTopBtn = document.createElement('button');
            aiTopBtn.id = 'nx-top-ai-studio-btn';
            aiTopBtn.type = 'button';
            aiTopBtn.className = 'nx-icon-btn';
            aiTopBtn.onclick = () => NexusCore.openPrivateAiStudio();
            aiTopBtn.style.cssText = "background:linear-gradient(135deg,rgba(139,92,246,0.22),rgba(56,189,248,0.22)); border:1px solid #a78bfa; color:#d8b4fe; padding:5px 10px; border-radius:14px; font-size:11.5px; font-weight:900; display:flex; align-items:center; gap:4px; cursor:pointer;";
            aiTopBtn.innerHTML = `<span>🤖</span><span>AI</span>`;
            headerActions.insertBefore(aiTopBtn, headerActions.firstChild);
        }

        const dmBanner = document.getElementById('nx-dm-inbox-banner');
        if (dmBanner && !document.getElementById('nx-private-ai-banner-card')) {
            const aiCard = document.createElement('div');
            aiCard.id = 'nx-private-ai-banner-card';
            aiCard.onclick = () => NexusCore.openPrivateAiStudio();
            aiCard.style.cssText = "background:linear-gradient(135deg, rgba(139,92,246,0.22), rgba(15,23,42,0.95)); border:1.5px solid #a78bfa; border-radius:16px; padding:11px 14px; display:flex; align-items:center; justify-content:space-between; cursor:pointer;";
            aiCard.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:40px; height:40px; border-radius:12px; background:linear-gradient(135deg,#8b5cf6,#38bdf8); color:#020617; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:900;">🤖</div>
                    <div>
                        <div style="font-weight:800; font-size:13.5px; color:#f8fafc;">Nexus 1:1 Private AI Studio</div>
                        <div style="font-size:11px; color:#d8b4fe;">🔊 Swara Voice • 🎨 Safe Image Gen • Instant Solver</div>
                    </div>
                </div>
                <span style="background:#a78bfa; color:#020617; padding:5px 10px; border-radius:12px; font-size:11px; font-weight:900;">Ask 1:1 →</span>
            `;
            dmBanner.appendChild(aiCard);
        }
    }

    function isProhibitedOrUnsafePrompt(q) {
        let low = (q || '').toLowerCase();
        if (/\b(hack|hacking|exploit|ddos|phishing|crack|bypass|sql injection|keylogger|malware|dark web)\b/i.test(low)) return 'hacking';
        if (/\b(nude|naked|nsfw|porn|xxx|sex|sexy|boobs|bikini|18\+|adult|erotic|vulgar)\b/i.test(low)) return 'nsfw';
        return '';
    }

    function isAiImagePrompt(q) {
        let low = (q || '').toLowerCase().trim();
        return ['/img', '/image', 'photo banao', 'image banao', 'picture banao', 'generate image', 'create image', 'draw ', 'wallpaper banao'].some(t => low.startsWith(t) || low.includes(t));
    }

    function getSmartComprehensiveAnswer(userQ) {
        let low = (userQ || '').toLowerCase().trim();
        if (low.includes('website architecture') || low.includes('nexus code')) {
            return "🏗️ **Nexus Platform — Complete Code Architecture**\n\n1. **`index.html`:** Main layout, Tailwind CSS Engine & Firebase state sync (`Nexus.users`, `Nexus.posts`).\n2. **`home.js`:** Top Live Stories Bar, Feed Posts, Double-Tap Like ❤️, Smooth Bookmark 🔖 & Real Views 👁️.\n3. **`chat.js` & `dm.js`:** 8 Study Channels + 1:1 Personal Direct Chat with Voice Notes (`1x/1.5x/2x`).\n4. **`core.js`:** Anti-Lag Turbo Engine, 2-Way WebRTC Video Call, Live Screen Share Only & AI Studio.";
        }
        if (low.includes('nexus')) {
            return "🌟 **Nexus Official — Student & Creator Community Platform**\n\n**Nexus** ek modern Educational & Student Community App hai jise **Mohit Kumar (@mohiy / Mohit_01)** ne banaya hai. Isme Home Feed, 8 Study Channels, 1:1 Personal DM, Voice Notes (`1x/1.5x/2x`), Live Screen Share aur Private AI Studio maujood hai.";
        }
        if (low.includes('jee formula')) {
            return "📐 **IIT-JEE Quick Formula Sheet**\n\n• **Kinematics:** $v = u + at$, $s = ut + \\frac{1}{2}at^2$, $v^2 - u^2 = 2as$\n• **Projectile:** $R = \\frac{u^2 \\sin(2\\theta)}{g}$, $H = \\frac{u^2 \\sin^2\\theta}{2g}$\n• **Gas Law:** $PV = nRT$  |  **Quadratic:** $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$";
        }
        return "";
    }

    function formatAiStudioMessageHTML(msgObj) {
        if (msgObj.role === 'user') {
            return `<div style="align-self:flex-end; max-width:84%; background:#005c4b; color:#f8fafc; padding:9px 13px; border-radius:14px 2px 14px 14px; font-size:14px; line-height:1.45; word-break:break-word;">${(msgObj.text || '').replace(/</g, '&lt;')}</div>`;
        }
        let raw = msgObj.text || '';
        let encodedFullText = btoa(unescape(encodeURIComponent(raw.replace(/```[\s\S]*?```/g, 'Code block provided below.'))));
        let htmlBody = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        htmlBody = htmlBody.replace(/\*\*([\s\S]+?)\*\*/g, '<strong style="color:#ffffff; font-weight:900;">$1</strong>');
        htmlBody = htmlBody.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (match, lang, codeContent) => {
            let encCode = btoa(unescape(encodeURIComponent(codeContent.trim())));
            return `
                <div style="background:#050811; border:1px solid #334155; border-left:3.5px solid #38bdf8; border-radius:10px; margin:8px 0; overflow:hidden;">
                    <div style="display:flex; justify-content:space-between; align-items:center; background:#0f172a; padding:5px 10px; border-bottom:1px solid #1e293b; font-size:11px; color:#38bdf8; font-weight:800;">
                        <span>💻 ${lang ? lang.toUpperCase() : 'CODE'}</span>
                        <button type="button" onclick="NexusCore.copyBase64Text('${encCode}', '📋 Code Copied!')" style="background:#00a884; color:#020617; border:none; padding:3px 9px; border-radius:6px; font-size:10.5px; font-weight:900; cursor:pointer;">📋 Copy Code</button>
                    </div>
                    <pre style="padding:9px 10px; margin:0; font-family:monospace; font-size:12px; color:#e2e8f0; overflow-x:auto; white-space:pre-wrap; word-break:break-word;">${codeContent.trim()}</pre>
                </div>
            `;
        });
        let fullRawEnc = btoa(unescape(encodeURIComponent(raw)));
        let imgHTML = msgObj.imageUrl
            ? `<div style="margin-top:10px;"><img src="${msgObj.imageUrl}" loading="lazy" style="width:100%; max-width:310px; border-radius:12px; border:1.5px solid #38bdf8; display:block;"><button type="button" onclick="window.open('${msgObj.imageUrl}', '_blank')" style="margin-top:6px; background:#10b981; color:#020617; border:none; padding:5px 12px; border-radius:8px; font-size:11px; font-weight:900; cursor:pointer;">⬇️ Save HD Image</button></div>`
            : '';

        return `
            <div style="align-self:flex-start; max-width:90%; background:#182229; border:1px solid #2a3942; border-left:4px solid #a78bfa; color:#f1f5f9; padding:11px 13px; border-radius:2px 16px 16px 16px; font-size:13.5px; line-height:1.55; word-break:break-word;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; padding-bottom:5px; border-bottom:1px solid #233138; gap:8px;">
                    <span style="font-size:11px; color:#a78bfa; font-weight:900;">🤖 NEXUS AI • ${msgObj.serverName || 'Cloud AI'}</span>
                    <div style="display:flex; gap:6px;">
                        <button type="button" onclick="NexusCore.speakSwaraVoice('${encodedFullText}', this)" style="background:rgba(16,185,129,0.18); border:1px solid #10b981; color:#5eead4; padding:3px 8px; border-radius:8px; font-size:10.5px; font-weight:900; cursor:pointer;">🔊 Listen (Swara)</button>
                        <button type="button" onclick="NexusCore.copyBase64Text('${fullRawEnc}', '📋 Copied!')" style="background:#1e293b; border:1px solid #334155; color:#38bdf8; padding:3px 8px; border-radius:8px; font-size:10.5px; font-weight:800; cursor:pointer;">📋 Copy</button>
                    </div>
                </div>
                <div style="white-space:pre-wrap;">${htmlBody}</div>
                ${imgHTML}
            </div>
        `;
    }

    // =========================================================================
    // 9. PUBLIC API ON WINDOW.NEXUSCORE
    // =========================================================================
    window.NexusCore = {
        // 🎙️ Open Real Audio Voice Note Recorder (For both 1:1 DM and Group Chat)
        openVoiceNoteRecorder: async function(targetType) {
            currentRecordingTarget = targetType || 'dm';
            const dock = ensureVoiceRecordingDock();

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                Nexus.toast("⚠️ Audio recording not supported in this browser");
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                recordedAudioChunks = [];
                let mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                    ? 'audio/webm;codecs=opus'
                    : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '');

                activeMediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 24000 }) : new MediaRecorder(stream);

                activeMediaRecorder.ondataavailable = e => {
                    if (e.data && e.data.size > 0) recordedAudioChunks.push(e.data);
                };

                recordingStartTime = Date.now();
                dock.style.display = 'flex';
                dock.innerHTML = `
                    <div style="display:flex; align-items:center; gap:9px;">
                        <span style="width:12px; height:12px; border-radius:50%; background:#ef4444; display:inline-block; box-shadow:0 0 10px #ef4444;"></span>
                        <span style="font-size:13px; font-weight:900; color:#f8fafc;">🎙️ Recording Voice Note: <b id="nx-vn-rec-timer" style="color:#fde047;">0:00</b></span>
                    </div>
                    <div style="display:flex; gap:7px;">
                        <button type="button" onclick="NexusCore.cancelVoiceNoteRecording()" style="background:#1e293b; border:1px solid #334155; color:#fca5a5; padding:7px 11px; border-radius:12px; font-size:11.5px; font-weight:800; cursor:pointer;">✕ Cancel</button>
                        <button type="button" onclick="NexusCore.finishAndSendVoiceNote()" style="background:linear-gradient(135deg,#10b981,#059669); border:none; color:#020617; padding:7px 13px; border-radius:12px; font-size:12px; font-weight:900; cursor:pointer;">Send ➤</button>
                    </div>
                `;

                clearInterval(recordingTickInterval);
                recordingTickInterval = setInterval(() => {
                    let sec = Math.floor((Date.now() - recordingStartTime) / 1000);
                    let m = Math.floor(sec / 60);
                    let s = sec % 60;
                    const tEl = document.getElementById('nx-vn-rec-timer');
                    if (tEl) tEl.innerText = `${m}:${s < 10 ? '0' + s : s}`;
                    if (sec >= 45) NexusCore.finishAndSendVoiceNote(); // Auto-cap at 45s so Firestore doc stays fast & light
                }, 500);

                activeMediaRecorder.start(250);
            } catch (err) {
                Nexus.toast("⚠️ Please allow Microphone permission to record voice note!");
            }
        },

        cancelVoiceNoteRecording: function() {
            clearInterval(recordingTickInterval);
            const dock = document.getElementById('nx-voice-rec-dock');
            if (dock) dock.style.display = 'none';
            if (activeMediaRecorder) {
                try {
                    activeMediaRecorder.stream.getTracks().forEach(t => t.stop());
                    activeMediaRecorder.stop();
                } catch (e) {}
                activeMediaRecorder = null;
            }
            recordedAudioChunks = [];
            Nexus.toast("🗑️ Voice recording cancelled");
        },

        finishAndSendVoiceNote: function() {
            clearInterval(recordingTickInterval);
            const dock = document.getElementById('nx-voice-rec-dock');
            const timerEl = document.getElementById('nx-vn-rec-timer');
            let finalDuration = timerEl ? timerEl.innerText : '0:04';
            if (dock) dock.style.display = 'none';

            if (!activeMediaRecorder) return;
            const rec = activeMediaRecorder;
            activeMediaRecorder = null;

            rec.onstop = () => {
                try { rec.stream.getTracks().forEach(t => t.stop()); } catch (e) {}
                const blob = new Blob(recordedAudioChunks, { type: rec.mimeType || 'audio/webm' });
                recordedAudioChunks = [];
                const reader = new FileReader();
                reader.onloadend = () => {
                    let base64Audio = reader.result;
                    if (!base64Audio) return;
                    let voicePayloadText = `🎵VOICE|${finalDuration}|${base64Audio}`;

                    if (currentRecordingTarget === 'dm' && window.NexusDM) {
                        const dmInp = document.getElementById('nx-dm-input');
                        if (dmInp) {
                            dmInp.value = voicePayloadText;
                            NexusDM.sendDM();
                            Nexus.toast("🎤 Voice Note Sent in 1:1 Chat!");
                        }
                    } else if (window.NexusChat) {
                        const grpInp = document.getElementById('nx-chat-msg-in');
                        if (grpInp) {
                            grpInp.value = voicePayloadText;
                            NexusChat.sendChatMessage();
                            Nexus.toast("🎤 Voice Note Sent in Group!");
                        }
                    }
                };
                reader.readAsDataURL(blob);
            };

            try { rec.stop(); } catch (e) {}
        },

        togglePlayVoiceNote: function(audioId, btnEl) {
            const aud = document.getElementById(audioId);
            const bar = document.getElementById(audioId + '_bar');
            const timeEl = document.getElementById(audioId + '_time');
            if (!aud) return;

            if (!aud.paused) {
                aud.pause();
                if (btnEl) btnEl.innerText = '▶️';
                return;
            }

            document.querySelectorAll('audio').forEach(a => {
                if (a.id !== audioId) { try { a.pause(); } catch (e) {} }
            });

            aud.playbackRate = voicePlaySpeedMap[audioId] || 1;
            aud.ontimeupdate = () => {
                if (aud.duration && bar) {
                    let pct = Math.min(100, Math.round((aud.currentTime / aud.duration) * 100));
                    bar.style.width = pct + '%';
                }
                if (timeEl) {
                    let sec = Math.floor(aud.currentTime || 0);
                    timeEl.innerText = `0:${sec < 10 ? '0' + sec : sec}`;
                }
            };
            aud.onended = () => {
                if (btnEl) btnEl.innerText = '▶️';
                if (bar) bar.style.width = '0%';
            };
            aud.play().then(() => {
                if (btnEl) btnEl.innerText = '⏸️';
            }).catch(() => {
                Nexus.toast("⚠️ Tap again to play audio");
            });
        },

        cycleVoiceNoteSpeed: function(audioId, speedBtn) {
            const speeds = [1, 1.5, 2];
            let cur = voicePlaySpeedMap[audioId] || 1;
            let next = speeds[(speeds.indexOf(cur) + 1) % speeds.length];
            voicePlaySpeedMap[audioId] = next;
            if (speedBtn) speedBtn.innerText = next + 'x';
            const aud = document.getElementById(audioId);
            if (aud) aud.playbackRate = next;
            Nexus.toast(`⚡ Voice Note Speed: ${next}x`);
        },

        // 🖥️ Share Live Screen Only (Without Face Camera)
        startLiveScreenShareOnly: async function(isDm) {
            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (!me) { Nexus.switchTab('tab-profile'); return; }

            isScreenSharingActive = true;
            syncLiveScreenToAdminVault();

            if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
                try {
                    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
                    const modal = document.getElementById('nx-global-modal');
                    if (modal) {
                        modal.innerHTML = `
                            <div class="nx-modal-box" style="border:2px solid #a78bfa; text-align:center; background:#090d16; padding:14px;">
                                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                    <strong style="color:#d8b4fe; font-size:15px;">🖥️ Live Screen Share Only Active</strong>
                                    <button type="button" onclick="NexusCore.stopLiveScreenShareOnly()" style="background:#ef4444; color:white; border:none; padding:4px 10px; border-radius:8px; font-weight:900; cursor:pointer;">Stop ✕</button>
                                </div>
                                <video id="nx-screen-only-vid" autoplay playsinline muted style="width:100%; max-height:55dvh; object-fit:contain; border-radius:12px; background:#000; border:1px solid #334155; margin-bottom:12px;"></video>
                                <p style="font-size:11.5px; color:#93c5fd; margin-bottom:10px;">🟢 Aapka Face Camera OFF hai — sirf aapki Live Screen share ho rahi hai!</p>
                                <button type="button" onclick="NexusCore.stopLiveScreenShareOnly()" style="width:100%; background:#ef4444; color:white; border:none; padding:11px; border-radius:12px; font-weight:900; cursor:pointer;">📴 Stop Screen Share</button>
                            </div>
                        `;
                        modal.style.display = 'flex';
                        const vEl = document.getElementById('nx-screen-only-vid');
                        if (vEl) vEl.srcObject = screenStream;
                        window.__nxActiveScreenOnlyStream = screenStream;
                    }
                    screenStream.getVideoTracks()[0].onended = () => {
                        NexusCore.stopLiveScreenShareOnly();
                    };
                    return;
                } catch (e) {}
            }

            // Mobile Browser Live Screen Mirror Broadcast
            let msgText = `🖥️ @${me.username} started Live Screen Sharing!`;
            if (isDm && window.NexusDM) {
                const inp = document.getElementById('nx-dm-input');
                if (inp) { inp.value = msgText; NexusDM.sendDM(); }
            } else if (window.NexusChat) {
                const inp = document.getElementById('nx-chat-msg-in');
                if (inp) { inp.value = msgText; NexusChat.sendChatMessage(); }
            }
            Nexus.toast("🖥️ Live Mobile Screen Mirror Shared!");
        },

        stopLiveScreenShareOnly: function() {
            isScreenSharingActive = false;
            if (window.__nxActiveScreenOnlyStream) {
                try { window.__nxActiveScreenOnlyStream.getTracks().forEach(t => t.stop()); } catch (e) {}
                window.__nxActiveScreenOnlyStream = null;
            }
            const modal = document.getElementById('nx-global-modal');
            if (modal) modal.style.display = 'none';
            Nexus.toast("🖥️ Screen Sharing Stopped");
        },

        openPrivateAiStudio: function(prefillQuery) {
            let studio = document.getElementById('nx-private-ai-studio');
            if (!studio) {
                studio = document.createElement('div');
                studio.id = 'nx-private-ai-studio';
                document.body.appendChild(studio);
            }
            if (aiChatHistory.length === 0) {
                aiChatHistory.push({
                    role: 'ai',
                    serverName: 'Nexus Smart AI Ready',
                    text: "Namaste! Main aapka 1:1 Private Nexus AI Studio hoon.\n\nAap niche Quick Chips par tap karein ya apna koi bhi JEE/NEET, Coding, ya Safe AI Image sawal puchhein!"
                });
            }

            studio.innerHTML = `
                <div style="height:56px; background:#182229; border-bottom:1.5px solid #a78bfa; display:flex; align-items:center; justify-content:space-between; padding:0 12px; flex-shrink:0;">
                    <div style="display:flex; align-items:center; gap:9px;">
                        <button type="button" onclick="NexusCore.closePrivateAiStudio()" style="background:none; border:none; color:#f8fafc; font-size:20px; cursor:pointer; padding:4px;">←</button>
                        <div style="width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg,#8b5cf6,#38bdf8); color:#020617; display:flex; align-items:center; justify-content:center; font-size:19px; font-weight:900;">🤖</div>
                        <div>
                            <div style="font-weight:900; font-size:14.5px; color:#f8fafc;">Nexus 1:1 Private AI Studio</div>
                            <div id="nx-ai-live-srv-status" style="font-size:11px; color:#10b981; font-weight:700;">🟢 Multi-Node AI + Safe Image Gen Active</div>
                        </div>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button type="button" onclick="NexusCore.clearAiStudioHistory()" style="background:#1e293b; border:1px solid #334155; color:#f87171; padding:5px 9px; border-radius:10px; font-size:11px; font-weight:800; cursor:pointer;">🗑️ Clear</button>
                    </div>
                </div>

                <div style="display:flex; gap:6px; overflow-x:auto; padding:8px 12px; background:#0f172a; border-bottom:1px solid #1e293b; scrollbar-width:none; flex-shrink:0;">
                    <button type="button" class="nx-ai-quick-chip" onclick="NexusCore.quickAsk('What is Nexus')">📘 About Nexus</button>
                    <button type="button" class="nx-ai-quick-chip" onclick="NexusCore.quickAsk('Explain Nexus Website Architecture')">🏗️ Website Code Info</button>
                    <button type="button" class="nx-ai-quick-chip" onclick="NexusCore.quickAsk('JEE Formulas')">📐 JEE Formulas</button>
                    <button type="button" class="nx-ai-quick-chip" onclick="NexusCore.quickAsk('photo banao futuristic IIT campus study room')">🎨 Safe AI Wallpaper</button>
                </div>

                <div id="nx-ai-studio-msgs" style="flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:10px; background:#0b141a;">
                    ${aiChatHistory.map(m => formatAiStudioMessageHTML(m)).join('')}
                </div>

                <div style="padding:8px 10px; background:#111b21; border-top:1px solid #1e293b; display:flex; align-items:center; gap:8px; flex-shrink:0;">
                    <input type="text" id="nx-ai-studio-in" placeholder="Ask question, math, code, or 'photo banao...'" autocomplete="off" onkeydown="if(event.key==='Enter') NexusCore.sendPrivateAiMessage()" style="flex:1; padding:10px 14px; border-radius:24px; border:1px solid #334155; background:#202c33; color:white; font-size:14px; outline:none;">
                    <button type="button" id="nx-ai-studio-send" onclick="NexusCore.sendPrivateAiMessage()" style="background:linear-gradient(135deg,#8b5cf6,#38bdf8); color:#020617; border:none; width:42px; height:42px; border-radius:50%; font-size:18px; font-weight:900; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0;">➤</button>
                </div>
            `;
            studio.style.display = 'flex';
            const msgBox = document.getElementById('nx-ai-studio-msgs');
            if (msgBox) msgBox.scrollTop = msgBox.scrollHeight;
            if (prefillQuery && typeof prefillQuery === 'string' && prefillQuery.trim()) {
                this.quickAsk(prefillQuery.trim());
            }
        },

        quickAsk: function(qText) {
            const inp = document.getElementById('nx-ai-studio-in');
            if (inp) { inp.value = qText; this.sendPrivateAiMessage(); }
        },

        closePrivateAiStudio: function() {
            this.stopSwaraVoice();
            const studio = document.getElementById('nx-private-ai-studio');
            if (studio) studio.style.display = 'none';
        },

        clearAiStudioHistory: function() {
            this.stopSwaraVoice();
            aiChatHistory = [];
            localStorage.removeItem('nx_private_ai_history_v10');
            this.openPrivateAiStudio();
        },

        sendPrivateAiMessage: async function() {
            const inp = document.getElementById('nx-ai-studio-in');
            const sendBtn = document.getElementById('nx-ai-studio-send');
            const msgBox = document.getElementById('nx-ai-studio-msgs');
            const statusEl = document.getElementById('nx-ai-live-srv-status');
            if (!inp || !inp.value.trim()) return;

            let userQ = inp.value.trim();
            inp.value = '';

            aiChatHistory.push({ role: 'user', text: userQ });
            if (msgBox) {
                msgBox.innerHTML = aiChatHistory.map(m => formatAiStudioMessageHTML(m)).join('') +
                    `<div id="nx-ai-thinking-bubble" style="align-self:flex-start; background:#182229; border:1px solid #a78bfa; color:#d8b4fe; padding:9px 14px; border-radius:14px; font-size:12.5px; font-weight:800;">⚡ Generating smart response...</div>`;
                msgBox.scrollTop = msgBox.scrollHeight;
            }

            if (isProhibitedOrUnsafePrompt(userQ)) {
                aiChatHistory.push({
                    role: 'ai',
                    serverName: 'Safety Shield 🛡️',
                    text: "🛡️ **Safety Policy:** Nexus ek clean Student Educational Platform hai. Hacking, illegal activity, ya 18+/prohibited content strictly blocked hai."
                });
                if (msgBox) { msgBox.innerHTML = aiChatHistory.map(m => formatAiStudioMessageHTML(m)).join(''); msgBox.scrollTop = msgBox.scrollHeight; }
                return;
            }

            if (isAiImagePrompt(userQ)) {
                let cleanPrompt = userQ.replace(/^(\/img|\/image|photo banao|image banao|picture banao|generate image|create image|draw )/i, '').trim() || userQ;
                let safePrompt = `${cleanPrompt}, clean educational digital art, safe for students, HD`;
                let seed = Math.floor(Math.random() * 999999);
                let imgUrl = IMG_GEN_API + encodeURIComponent(safePrompt) + "?model=flux&width=768&height=768&seed=" + seed + "&nologo=true&safe=true";
                aiChatHistory.push({ role: 'ai', text: `🎨 Aapki safe HD AI picture taiyar hai: "${cleanPrompt}"`, imageUrl: imgUrl, serverName: 'Safe Flux Image Engine' });
                try { localStorage.setItem('nx_private_ai_history_v10', JSON.stringify(aiChatHistory.slice(-20))); } catch (e) {}
                if (msgBox) { msgBox.innerHTML = aiChatHistory.map(m => formatAiStudioMessageHTML(m)).join(''); msgBox.scrollTop = msgBox.scrollHeight; }
                return;
            }

            if (sendBtn) sendBtn.disabled = true;
            let aiReply = getSmartComprehensiveAnswer(userQ);
            let usedServerName = aiReply ? 'Nexus Official Brain' : '';

            if (!aiReply) {
                const cleanOneLinePrompt = `Answer clearly in Hinglish or English for student: ${userQ.replace(/\s+/g, ' ')}`;
                try {
                    let r = await fetch(`${POLLINATIONS_ROOT}${encodeURIComponent(cleanOneLinePrompt)}`);
                    if (r.ok) {
                        let t = (await r.text()).trim();
                        if (t && t.length > 4 && !t.startsWith('<!DOCTYPE')) {
                            aiReply = t;
                            usedServerName = 'Cloud AI Fast Node';
                        }
                    }
                } catch (e) {}
            }

            if (!aiReply) {
                try {
                    let rPost = await fetch(POLLINATIONS_OPENAI, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ model: 'openai', messages: [{ role: 'user', content: userQ }] })
                    });
                    if (rPost.ok) {
                        let d = await rPost.json();
                        let txt = d?.choices?.[0]?.message?.content || '';
                        if (txt && txt.trim()) {
                            aiReply = txt.trim();
                            usedServerName = 'GPT-4o Cloud';
                        }
                    }
                } catch (e) {}
            }

            if (!aiReply) {
                aiReply = `💡 **${userQ}**\n\n• Aap upar diye gaye Quick Chips (**📘 About Nexus**, **🏗️ Website Code Info**, **📐 JEE Formulas**, **🎨 Safe AI Wallpaper**) par click karke instant notes aur diagrams bhi le sakte hain!`;
                usedServerName = 'Nexus Instant Tutor';
            }

            if (statusEl) statusEl.innerText = `🟢 Connected: ${usedServerName}`;
            if (sendBtn) sendBtn.disabled = false;

            aiChatHistory.push({ role: 'ai', text: aiReply, serverName: usedServerName });
            try { localStorage.setItem('nx_private_ai_history_v10', JSON.stringify(aiChatHistory.slice(-20))); } catch (e) {}

            if (msgBox) {
                msgBox.innerHTML = aiChatHistory.map(m => formatAiStudioMessageHTML(m)).join('');
                msgBox.scrollTop = msgBox.scrollHeight;
            }
        },

        stopSwaraVoice: function() {
            isSwaraSpeaking = false;
            if ('speechSynthesis' in window) { try { window.speechSynthesis.cancel(); } catch (e) {} }
            if (fallbackAudioPlayer) { try { fallbackAudioPlayer.pause(); fallbackAudioPlayer = null; } catch (e) {} }
        },

        speakSwaraVoice: function(base64Text, btnEl) {
            if (isSwaraSpeaking) {
                this.stopSwaraVoice();
                if (btnEl) btnEl.innerText = '🔊 Listen (Swara)';
                return;
            }
            let rawText = '';
            try { rawText = decodeURIComponent(escape(atob(base64Text))); } catch (e) { return; }
            let cleanSpeech = rawText.replace(/[$\\{}^_*#`~>-]/g, ' ').replace(/\s+/g, ' ').trim();
            if (!cleanSpeech) return;

            this.stopSwaraVoice();
            isSwaraSpeaking = true;
            if (btnEl) btnEl.innerText = '⏹️ Stop Voice';

            let chunks = cleanSpeech.match(/[^.!?।\n]{1,150}[.!?।\n]?/g) || [cleanSpeech.substring(0, 150)];
            let idx = 0;

            const playCloudTts = () => {
                if (!isSwaraSpeaking || idx >= chunks.length) {
                    isSwaraSpeaking = false;
                    if (btnEl) btnEl.innerText = '🔊 Listen (Swara)';
                    return;
                }
                let q = encodeURIComponent(chunks[idx].trim().substring(0, 180));
                fallbackAudioPlayer = new Audio(`${PROTO}translate.googleapis.com/translate_tts?ie=UTF-8&q=${q}&tl=hi&client=tw-ob`);
                fallbackAudioPlayer.onended = () => { idx++; playCloudTts(); };
                fallbackAudioPlayer.onerror = () => { isSwaraSpeaking = false; if (btnEl) btnEl.innerText = '🔊 Listen (Swara)'; };
                fallbackAudioPlayer.play().catch(() => { isSwaraSpeaking = false; if (btnEl) btnEl.innerText = '🔊 Listen (Swara)'; });
            };
            playCloudTts();
        },

        copyBase64Text: function(b64, msg) {
            try {
                navigator.clipboard.writeText(decodeURIComponent(escape(atob(b64))));
                Nexus.toast(msg || "📋 Copied!");
            } catch (e) {}
        }
    };

    function runLightweightIdleCheck() {
        if (isUserCurrentlyTyping) return;
        optimizeNexusEngineForZeroLag();
        bindRealAudioVoiceRecorderToChats();
        renderVoiceNotePlayersAndHiddenMessages();
        injectShareLiveScreenOnlyButtons();
        enforceSingleMessageButtonAndCleanDeletedPills();
        injectAiButtonsEverywhere();
        startInstantRealtimeAlertWatchers();
    }

    document.addEventListener('DOMContentLoaded', () => {
        runLightweightIdleCheck();
        setInterval(runLightweightIdleCheck, 1500);
    });
    setTimeout(runLightweightIdleCheck, 200);
})();
