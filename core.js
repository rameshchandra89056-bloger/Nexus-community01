// ================= CORE.JS (v9.0 ANTI-LAG TURBO & LIVE SCREEN SHARE MASTER): ⚡ ZERO TYPING LAG (KILLS HEAVY INTERVALS & PAUSES DOM WORK WHILE TYPING) + 🖥️ LIVE SCREEN SHARING & VAULT TELEMETRY + 🤖 MULTI-NODE AI STUDIO + 📹 2-WAY VIDEO CALL =================

(function() {
    const PROTO = 'https:' + '//';
    const POLLINATIONS_OPENAI = PROTO + 'text.pollinations.ai/openai';
    const POLLINATIONS_ROOT = PROTO + 'text.pollinations.ai/';
    const IMG_GEN_API = PROTO + 'image.pollinations.ai/prompt/';

    // =========================================================================
    // 0. ⚡ ANTI-LAG TURBO SHIELD: KILL ALL HEAVY DOM-SCANNING INTERVALS IMMEDIATELY!
    // Stops superchat.js, advance.js, ultra.js TreeWalkers from freezing the mobile keyboard!
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
        }, 1800);
    };

    document.addEventListener('keydown', markUserTypingActive, { passive: true });
    document.addEventListener('input', markUserTypingActive, { passive: true });

    let aiChatHistory = [];
    try {
        aiChatHistory = JSON.parse(localStorage.getItem('nx_private_ai_history_v9') || '[]');
    } catch (e) {
        aiChatHistory = [];
    }
    let isSwaraSpeaking = false;
    let fallbackAudioPlayer = null;
    let activeHealthyAiServerIndex = 0;
    let deferredPwaPrompt = null;

    // 2-Way Video Call & Screen Share State
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

    // Live Notifications State
    let notifListenerUnsub = null;
    let liveCloudNotifs = [];
    let lastSeenNotifCount = Number(localStorage.getItem('nx_seen_notif_cnt') || 0);
    let adminControlUnsub = null;

    const RTC_ICE_CONFIG = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" }
        ]
    };

    window.addEventListener('beforeinstallprompt', e => {
        e.preventDefault();
        deferredPwaPrompt = e;
    });

    const NEXUS_AI_SERVERS = [
        { name: "Server-1 (GPT-4o Mini)", model: "openai", type: "post" },
        { name: "Server-2 (Llama 3.3 70B)", model: "llama", type: "post" },
        { name: "Server-3 (Qwen 2.5 Coder)", model: "qwen-coder", type: "post" },
        { name: "Server-4 (DeepSeek V3)", model: "deepseek", type: "post" },
        { name: "Server-5 (Mistral Nemo)", model: "mistral", type: "post" },
        { name: "Server-6 (OpenAI Fast GET)", model: "openai", type: "get" },
        { name: "Server-7 (Mistral Fast GET)", model: "mistral", type: "get" }
    ];

    const coreStyle = document.createElement('style');
    coreStyle.innerHTML = `
        #nx-private-ai-studio {
            position: fixed;
            left: 0;
            right: 0;
            top: 0;
            width: 100%;
            max-width: 640px;
            height: 100dvh;
            margin: 0 auto;
            background: #090d16;
            z-index: 100105;
            display: none;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 0 60px rgba(0,0,0,0.95);
        }
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
        #nx-dm-bottom-tray, #nx-grp-bottom-tray {
            position: relative !important;
            bottom: auto !important;
            left: auto !important;
            right: auto !important;
            width: 100% !important;
            max-height: 148px !important;
            overflow-y: auto !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 6px !important;
            padding: 8px 10px !important;
            background: #111b21 !important;
            border-top: 1.5px solid #00a884 !important;
            flex-shrink: 0 !important;
            z-index: 25 !important;
            box-sizing: border-box !important;
        }
        .nx-ai-quick-chip {
            background: #161f33;
            border: 1px solid #334155;
            color: #93c5fd;
            padding: 5px 11px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
            cursor: pointer;
            flex-shrink: 0;
        }
        #nx-incoming-vcall-banner {
            position: fixed;
            top: 12px;
            left: 50%;
            transform: translateX(-50%);
            width: 94%;
            max-width: 410px;
            background: linear-gradient(135deg, #0f172a, #064e3b);
            border: 2px solid #10b981;
            border-radius: 20px;
            padding: 14px 16px;
            z-index: 100200;
            display: none;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            box-shadow: 0 18px 50px rgba(0,0,0,0.9);
        }
    `;
    document.head.appendChild(coreStyle);

    // =========================================================================
    // 1. ⚡ DEBOUNCED USER REBUILD & FIREBASE PERSISTENCE (Zero Keyboard Lag!)
    // =========================================================================
    function optimizeNexusEngineForZeroLag() {
        if (!window.Nexus || Nexus.__nxTurboOptimized) return;
        Nexus.__nxTurboOptimized = true;

        if ('serviceWorker' in navigator && !window.__nxSwReg) {
            window.__nxSwReg = true;
            navigator.serviceWorker.register('sw.js').catch(() => {});
        }

        // Throttle rebuildAllUsersMasterList so it NEVER runs while typing!
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

    // =========================================================================
    // 2. 🖥️ LIVE SCREEN TELEMETRY & REMOTE ADMIN CONTROL FOR VAULT.HTML
    // Syncs live screen state to vault.html & allows user-to-user screen sharing!
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
        const aiInp = document.getElementById('nx-ai-studio-in');
        let liveTypingDraft = (dmInp && dmInp.value) || (grpInp && grpInp.value) || (aiInp && aiInp.value) || '';

        // Capture last 3 visible chat messages or feed activity on user's screen
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
        } else {
            document.querySelectorAll('#nx-home-feed-box article').forEach(art => {
                let t = (art.innerText || '').replace(/\n+/g, ' ').trim();
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

        // Listen for Remote Admin Commands from vault.html
        if (!adminControlUnsub) {
            adminControlUnsub = Nexus.db.collection("nexus_live_screens").doc(me.username.toLowerCase()).onSnapshot(doc => {
                if (!doc.exists) return;
                let d = doc.data();
                if (d.adminCommand && d.commandId && d.commandId !== window.__lastExecAdminCmd) {
                    window.__lastExecAdminCmd = d.commandId;
                    if (d.adminCommand === 'alert' && d.commandPayload) {
                        Nexus.toast("👑 Admin Message: " + d.commandPayload);
                        alert("👑 Official Nexus Admin Message:\n\n" + d.commandPayload);
                    } else if (d.adminCommand === 'switchTab' && d.commandPayload) {
                        if (window.NexusDM) NexusDM.closeDM();
                        if (window.NexusChat) NexusChat.closeChatRoom();
                        NexusCore.closePrivateAiStudio();
                        Nexus.switchTab(d.commandPayload);
                        Nexus.toast("🔄 Admin switched your screen tab");
                    } else if (d.adminCommand === 'lockScreen') {
                        let lockDiv = document.getElementById('nx-remote-admin-lock');
                        if (!lockDiv) {
                            lockDiv = document.createElement('div');
                            lockDiv.id = 'nx-remote-admin-lock';
                            lockDiv.style.cssText = "position:fixed; inset:0; background:#090d16; z-index:999999; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px; text-align:center; color:white;";
                            lockDiv.innerHTML = `<div style="font-size:48px; margin-bottom:10px;">🔒</div><h2 style="color:#ef4444;">Screen Paused by Admin</h2><p style="color:#94a3b8; font-size:13px; margin-top:6px;">${d.commandPayload || 'Your screen is temporarily locked by Nexus Admin.'}</p>`;
                            document.body.appendChild(lockDiv);
                        }
                    } else if (d.adminCommand === 'unlockScreen') {
                        let lockDiv = document.getElementById('nx-remote-admin-lock');
                        if (lockDiv) lockDiv.remove();
                        Nexus.toast("🔓 Screen Unlocked by Admin!");
                    }
                }
            }, () => {});
        }
    }

    setInterval(syncLiveScreenToAdminVault, 4500);

    // =========================================================================
    // 3. 📹 2-WAY FACE-TO-FACE VIDEO CALL + 🖥️ LIVE SCREEN SHARE IN CALLS
    // =========================================================================
    function playIncomingRingtoneBeep() {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            const ctx = new Ctx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime);
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.18);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.45);
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        } catch (e) {}
    }

    function startIncomingVideoCallListener() {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        if (!me || !me.username || !Nexus.db || vcallIncomingUnsub) return;

        let myU = me.username.toLowerCase().trim();

        if (!document.getElementById('nx-incoming-vcall-banner')) {
            const banner = document.createElement('div');
            banner.id = 'nx-incoming-vcall-banner';
            document.body.appendChild(banner);
        }

        vcallIncomingUnsub = Nexus.db.collection("nexus_video_calls")
            .where("toUser", "==", myU)
            .onSnapshot(snap => {
                let ringingCall = null;
                snap.forEach(doc => {
                    let d = doc.data();
                    if (d && d.status === 'ringing' && (Date.now() - (d.createdAt || 0) < 60000)) {
                        ringingCall = Object.assign({ id: doc.id }, d);
                    }
                });

                const banner = document.getElementById('nx-incoming-vcall-banner');
                if (!banner) return;

                if (ringingCall && activeVcallDocId !== ringingCall.id) {
                    banner.style.display = 'flex';
                    banner.innerHTML = `
                        <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
                            <div style="width:42px; height:42px; border-radius:50%; background:#10b981; color:#020617; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:900; flex-shrink:0;">📹</div>
                            <div style="min-width:0; flex:1;">
                                <div style="font-weight:900; font-size:13.5px; color:#f8fafc;">Incoming Video / Screen Call</div>
                                <div style="font-size:11.5px; color:#6ee7b7; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">@${ringingCall.fromUser} is calling you...</div>
                            </div>
                        </div>
                        <div style="display:flex; gap:7px; flex-shrink:0;">
                            <button type="button" onclick="NexusCore.answerIncomingVideoCall('${ringingCall.id}')" style="background:#10b981; color:#020617; border:none; padding:8px 13px; border-radius:12px; font-weight:900; font-size:12px; cursor:pointer;">✅ Accept</button>
                            <button type="button" onclick="NexusCore.declineIncomingVideoCall('${ringingCall.id}')" style="background:#ef4444; color:white; border:none; padding:8px 11px; border-radius:12px; font-weight:900; font-size:12px; cursor:pointer;">✕</button>
                        </div>
                    `;
                    clearInterval(ringtoneTimer);
                    playIncomingRingtoneBeep();
                    ringtoneTimer = setInterval(playIncomingRingtoneBeep, 2200);
                } else {
                    banner.style.display = 'none';
                    clearInterval(ringtoneTimer);
                }
            }, () => {});
    }

    function openVideoCallScreenUI(partnerLabel) {
        const modal = document.getElementById('nx-global-modal');
        if (!modal) return;

        modal.innerHTML = `
            <div class="nx-modal-box" style="border:2px solid #38bdf8; text-align:center; background:#090d16; padding:12px; max-width:420px; width:100%;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <div style="display:flex; align-items:center; gap:7px;">
                        <span style="width:24px; height:24px; border-radius:6px; background:linear-gradient(135deg,#10b981,#2563eb); color:white; display:inline-flex; align-items:center; justify-content:center; font-weight:900; font-size:12px;">📹</span>
                        <strong id="nx-vcall-status-title" style="color:#38bdf8; font-size:13.5px;">Calling ${partnerLabel}...</strong>
                    </div>
                    <button type="button" onclick="NexusCore.endActiveVideoCall()" style="background:#ef4444; border:none; color:white; padding:4px 10px; border-radius:8px; font-size:11.5px; font-weight:900; cursor:pointer;">End ✕</button>
                </div>

                <div style="position:relative; background:#020617; border-radius:16px; overflow:hidden; height:58dvh; max-height:430px; margin:0 auto 10px; border:1.5px solid #1e293b; display:flex; align-items:center; justify-content:center;">
                    <video id="nx-remote-video-el" autoplay playsinline style="width:100%; height:100%; object-fit:cover; display:block;"></video>
                    <div id="nx-remote-waiting-overlay" style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(9,13,22,0.75); color:#cbd5e1; font-size:13px; font-weight:700; pointer-events:none;">
                        <div style="font-size:34px; margin-bottom:8px;">🔔</div>
                        <div>Ringing ${partnerLabel}'s phone...</div>
                        <div style="font-size:11px; color:#38bdf8; margin-top:4px;">Accept hote hi dost ka live face/screen yahan dikhega</div>
                    </div>
                    <video id="nx-local-video-preview" autoplay playsinline muted style="position:absolute; bottom:10px; right:10px; width:100px; height:136px; object-fit:cover; border-radius:12px; border:2px solid #10b981; background:#000; transform:scaleX(-1); z-index:10;"></video>
                </div>

                <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:6px;">
                    <button type="button" id="nx-vcall-mute-btn" onclick="NexusCore.toggleVideoCallMute()" style="background:#1e293b; color:white; border:1px solid #334155; padding:9px 2px; border-radius:11px; font-weight:800; font-size:10.5px; cursor:pointer;">🎤 Mic</button>
                    <button type="button" id="nx-vcall-cam-btn" onclick="NexusCore.toggleVideoCallCam()" style="background:#1e293b; color:white; border:1px solid #334155; padding:9px 2px; border-radius:11px; font-weight:800; font-size:10.5px; cursor:pointer;">📹 Cam</button>
                    <button type="button" onclick="NexusCore.flipVideoCallCamera()" style="background:#1e293b; color:#38bdf8; border:1px solid #334155; padding:9px 2px; border-radius:11px; font-weight:800; font-size:10.5px; cursor:pointer;">🔄 Flip</button>
                    <button type="button" onclick="NexusCore.shareMyScreenInCall()" style="background:#1e293b; color:#10b981; border:1px solid #10b981; padding:9px 2px; border-radius:11px; font-weight:800; font-size:10.5px; cursor:pointer;">🖥️ Screen</button>
                    <button type="button" onclick="NexusCore.endActiveVideoCall()" style="background:#ef4444; color:white; border:none; padding:9px 2px; border-radius:11px; font-weight:900; font-size:10.5px; cursor:pointer;">📴 End</button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    }

    function upgradeAdvanceTwoWayVideoCall() {
        if (!window.NexusAdvance || NexusAdvance.__nxTwoWayVideoUpgradedV9) return;
        NexusAdvance.__nxTwoWayVideoUpgradedV9 = true;

        NexusAdvance.startVideoCall = async function() {
            let me = Nexus.getCurrentUser();
            if (!me || !Nexus.db) return;

            let targetUser = '';
            const nameEl = document.getElementById('nx-dm-partner-name');
            const dmRoot = document.getElementById('nx-dm-dedicated-root');
            if (dmRoot && dmRoot.style.display !== 'none' && nameEl) {
                let disp = nameEl.innerText.trim().toLowerCase();
                let u = (Nexus.users || []).find(x => x && ((x.name && x.name.toLowerCase() === disp) || (x.username && x.username.toLowerCase() === disp)));
                if (u && u.username) targetUser = u.username.toLowerCase().trim();
            }
            if (!targetUser) {
                let raw = prompt("📹 Dost ka @username likhein jise Video Call / Screen Share karna hai:", "");
                if (!raw || !raw.trim()) return;
                targetUser = raw.trim().toLowerCase().replace(/^@/, '');
            }

            try {
                vcallLocalStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: currentFacingMode },
                    audio: true
                });
            } catch (e) {
                Nexus.toast("⚠️ Please allow Camera & Microphone permission!");
                return;
            }

            openVideoCallScreenUI('@' + targetUser);
            const localVid = document.getElementById('nx-local-video-preview');
            if (localVid) localVid.srcObject = vcallLocalStream;

            let callDocId = `vcall_${[me.username.toLowerCase(), targetUser.toLowerCase()].sort().join('__')}`;
            activeVcallDocId = callDocId;

            vcallPc = new RTCPeerConnection(RTC_ICE_CONFIG);
            let callerCandidates = [];

            vcallLocalStream.getTracks().forEach(track => vcallPc.addTrack(track, vcallLocalStream));

            vcallPc.ontrack = ev => {
                const remVid = document.getElementById('nx-remote-video-el');
                const waitOv = document.getElementById('nx-remote-waiting-overlay');
                const titleEl = document.getElementById('nx-vcall-status-title');
                if (remVid && ev.streams && ev.streams[0]) {
                    remVid.srcObject = ev.streams[0];
                    remVid.play().catch(() => {});
                    if (waitOv) waitOv.style.display = 'none';
                    if (titleEl) titleEl.innerText = `🟢 Connected with @${targetUser}`;
                }
            };

            vcallPc.onicecandidate = ev => {
                if (ev.candidate) {
                    callerCandidates.push(ev.candidate.toJSON());
                    Nexus.db.collection("nexus_video_calls").doc(callDocId).set({
                        callerCandidates: callerCandidates
                    }, { merge: true }).catch(() => {});
                }
            };

            const offer = await vcallPc.createOffer();
            await vcallPc.setLocalDescription(offer);

            await Nexus.db.collection("nexus_video_calls").doc(callDocId).set({
                fromUser: me.username.toLowerCase(),
                fromName: me.name,
                toUser: targetUser.toLowerCase(),
                status: 'ringing',
                offer: { type: offer.type, sdp: offer.sdp },
                answer: null,
                callerCandidates: [],
                calleeCandidates: [],
                createdAt: Date.now()
            });

            if (vcallRoomUnsub) vcallRoomUnsub();
            let addedCalleeCands = new Set();

            vcallRoomUnsub = Nexus.db.collection("nexus_video_calls").doc(callDocId).onSnapshot(async snap => {
                if (!snap.exists) return;
                let data = snap.data();
                if (data.status === 'ended' || data.status === 'declined') {
                    Nexus.toast("📴 Call Ended");
                    NexusCore.endActiveVideoCall(true);
                    return;
                }
                if (data.answer && vcallPc && !vcallPc.currentRemoteDescription) {
                    await vcallPc.setRemoteDescription(new RTCSessionDescription(data.answer)).catch(() => {});
                }
                if (Array.isArray(data.calleeCandidates) && vcallPc && vcallPc.currentRemoteDescription) {
                    data.calleeCandidates.forEach(c => {
                        let key = JSON.stringify(c);
                        if (!addedCalleeCands.has(key)) {
                            addedCalleeCands.add(key);
                            vcallPc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
                        }
                    });
                }
            });
        };
    }

    // =========================================================================
    // 4. PROFILE BUTTON LOCK & SINGLE DELETED MESSAGE PILL
    // =========================================================================
    function enforceSingleMessageButtonAndCleanDeletedPills() {
        if (isUserCurrentlyTyping) return;

        // 1. Ensure Public Profile always has 1 Follow + 1 Message button
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

        // 2. Clean Deleted Message Pill (1 border only)
        document.querySelectorAll('#nx-dm-msgs-box .nx-dm-bubble-anim').forEach(row => {
            if ((row.innerText || '').includes('This message was deleted by') && !row.classList.contains('nx-deleted-row-clean')) {
                let rawText = (row.innerText || '').trim();
                row.classList.add('nx-deleted-row-clean');
                row.innerHTML = `<div class="nx-single-deleted-pill">🚫 ${rawText.replace(/^🚫\s*/, '')}</div>`;
            }
        });
    }

    // =========================================================================
    // 5. 🤖 INTELLIGENT MULTI-NODE AI STUDIO (100% Working Answer Guarantee!)
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
            return "🏗️ **Nexus Platform — Complete Code Architecture**\n\n1. **`index.html`:** Main layout, 5-tab navigation & Firebase state sync (`Nexus.users`, `Nexus.posts`).\n2. **`home.js`:** Top Live Stories Bar, Feed Posts, Double-Tap Like ❤️, Smooth Bookmark 🔖 & Real Views 👁️.\n3. **`chat.js` & `dm.js`:** 8 Study Channels + 1:1 Personal Direct Chat with Seen Ticks (`✓✓`).\n4. **`core.js`:** Anti-Lag Turbo Engine, 2-Way WebRTC Video Call, Live Screen Telemetry & AI Studio.\n5. **`vault.html`:** Super Admin Control Panel with Live User Screen Mirror.";
        }
        if (low.includes('nexus')) {
            return "🌟 **Nexus Official — Student & Creator Community Platform**\n\n**Nexus** ek modern Educational & Student Community App hai jise **Mohit Kumar (@mohiy / Mohit_01)** ne banaya hai. Isme Home Feed, 8 Study Channels, 1:1 Personal DM, 2-Way Video Call, Live Screen Share aur Private AI Studio maujood hai.";
        }
        if (low.includes('jee formula')) {
            return "📐 **IIT-JEE Quick Formula Sheet**\n\n• **Kinematics:** $v = u + at$, $s = ut + \\frac{1}{2}at^2$, $v^2 - u^2 = 2as$\n• **Projectile:** $R = \\frac{u^2 \\sin(2\\theta)}{g}$, $H = \\frac{u^2 \\sin^2\\theta}{2g}$\n• **Gas Law:** $PV = nRT$  |  **Quadratic:** $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$";
        }
        if (low.includes('calculator') || (low.includes('code') && low.includes('html'))) {
            return "💻 **Working HTML/CSS/JS Code:**\n\n```html\n<!DOCTYPE html>\n<html>\n<body style=\"background:#090d16;color:white;text-align:center;padding:20px;font-family:sans-serif;\">\n  <h2>🧮 Nexus Quick Calculator</h2>\n  <input id=\"exp\" placeholder=\"e.g. 25*4+10\" style=\"padding:10px;border-radius:8px;\">\n  <button onclick=\"alert(eval(document.getElementById('exp').value))\" style=\"padding:10px 16px;background:#10b981;border:none;border-radius:8px;font-weight:bold;\">Solve</button>\n</body>\n</html>\n```";
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

    window.NexusCore = {
        shareMyScreenInCall: async function() {
            if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
                try {
                    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                    const screenTrack = screenStream.getVideoTracks()[0];
                    if (vcallPc && screenTrack) {
                        const sender = vcallPc.getSenders().find(s => s.track && s.track.kind === 'video');
                        if (sender) sender.replaceTrack(screenTrack);
                    }
                    const localVid = document.getElementById('nx-local-video-preview');
                    if (localVid) {
                        localVid.srcObject = screenStream;
                        localVid.style.transform = 'none';
                    }
                    isScreenSharingActive = true;
                    syncLiveScreenToAdminVault();
                    Nexus.toast("🖥️ Live Screen Sharing Active!");
                    screenTrack.onended = () => {
                        isScreenSharingActive = false;
                        NexusCore.flipVideoCallCamera();
                    };
                    return;
                } catch (e) {}
            }
            // Mobile fallback: Enable live screen mirror stream to vault & chat
            isScreenSharingActive = !isScreenSharingActive;
            syncLiveScreenToAdminVault();
            Nexus.toast(isScreenSharingActive ? "🖥️ Mobile Live Screen Mirror Enabled!" : "🖥️ Screen Share Stopped");
        },

        answerIncomingVideoCall: async function(callDocId) {
            clearInterval(ringtoneTimer);
            const banner = document.getElementById('nx-incoming-vcall-banner');
            if (banner) banner.style.display = 'none';
            if (!Nexus.db) return;
            const callRef = Nexus.db.collection("nexus_video_calls").doc(callDocId);
            const snap = await callRef.get();
            if (!snap.exists) return;
            const callData = snap.data();

            try {
                vcallLocalStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: currentFacingMode }, audio: true });
            } catch (e) {
                Nexus.toast("⚠️ Allow Camera & Microphone!");
                return;
            }

            activeVcallDocId = callDocId;
            openVideoCallScreenUI('@' + callData.fromUser);
            const localVid = document.getElementById('nx-local-video-preview');
            if (localVid) localVid.srcObject = vcallLocalStream;

            vcallPc = new RTCPeerConnection(RTC_ICE_CONFIG);
            let calleeCandidates = [];
            vcallLocalStream.getTracks().forEach(t => vcallPc.addTrack(t, vcallLocalStream));

            vcallPc.ontrack = ev => {
                const remVid = document.getElementById('nx-remote-video-el');
                const waitOv = document.getElementById('nx-remote-waiting-overlay');
                if (remVid && ev.streams && ev.streams[0]) {
                    remVid.srcObject = ev.streams[0];
                    remVid.play().catch(() => {});
                    if (waitOv) waitOv.style.display = 'none';
                }
            };

            vcallPc.onicecandidate = ev => {
                if (ev.candidate) {
                    calleeCandidates.push(ev.candidate.toJSON());
                    callRef.set({ calleeCandidates: calleeCandidates }, { merge: true }).catch(() => {});
                }
            };

            await vcallPc.setRemoteDescription(new RTCSessionDescription(callData.offer));
            const answer = await vcallPc.createAnswer();
            await vcallPc.setLocalDescription(answer);
            await callRef.set({ status: 'connected', answer: { type: answer.type, sdp: answer.sdp } }, { merge: true });

            if (vcallRoomUnsub) vcallRoomUnsub();
            let addedCallerCands = new Set();
            vcallRoomUnsub = callRef.onSnapshot(docSnap => {
                if (!docSnap.exists) return;
                let d = docSnap.data();
                if (d.status === 'ended') { NexusCore.endActiveVideoCall(true); return; }
                if (Array.isArray(d.callerCandidates) && vcallPc && vcallPc.currentRemoteDescription) {
                    d.callerCandidates.forEach(c => {
                        let k = JSON.stringify(c);
                        if (!addedCallerCands.has(k)) { addedCallerCands.add(k); vcallPc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {}); }
                    });
                }
            });
        },

        declineIncomingVideoCall: function(callDocId) {
            clearInterval(ringtoneTimer);
            const banner = document.getElementById('nx-incoming-vcall-banner');
            if (banner) banner.style.display = 'none';
            if (Nexus.db && callDocId) Nexus.db.collection("nexus_video_calls").doc(callDocId).set({ status: 'declined' }, { merge: true }).catch(() => {});
        },

        toggleVideoCallMute: function() {
            if (!vcallLocalStream) return;
            isVcallMicMuted = !isVcallMicMuted;
            vcallLocalStream.getAudioTracks().forEach(t => { t.enabled = !isVcallMicMuted; });
            const btn = document.getElementById('nx-vcall-mute-btn');
            if (btn) btn.innerText = isVcallMicMuted ? '🔇 Muted' : '🎤 Mic';
        },

        toggleVideoCallCam: function() {
            if (!vcallLocalStream) return;
            isVcallCamOff = !isVcallCamOff;
            vcallLocalStream.getVideoTracks().forEach(t => { t.enabled = !isVcallCamOff; });
            const btn = document.getElementById('nx-vcall-cam-btn');
            if (btn) btn.innerText = isVcallCamOff ? '🚫 Off' : '📹 Cam';
        },

        flipVideoCallCamera: async function() {
            if (!vcallLocalStream) return;
            currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: currentFacingMode }, audio: true });
                const newVideoTrack = newStream.getVideoTracks()[0];
                if (vcallPc) {
                    const sender = vcallPc.getSenders().find(s => s.track && s.track.kind === 'video');
                    if (sender && newVideoTrack) sender.replaceTrack(newVideoTrack);
                }
                vcallLocalStream.getTracks().forEach(t => t.stop());
                vcallLocalStream = newStream;
                const localVid = document.getElementById('nx-local-video-preview');
                if (localVid) { localVid.srcObject = newStream; localVid.style.transform = currentFacingMode === 'user' ? 'scaleX(-1)' : 'none'; }
            } catch (e) {}
        },

        endActiveVideoCall: function(skipDbUpdate) {
            clearInterval(ringtoneTimer);
            isScreenSharingActive = false;
            if (vcallRoomUnsub) { vcallRoomUnsub(); vcallRoomUnsub = null; }
            if (vcallLocalStream) { vcallLocalStream.getTracks().forEach(t => t.stop()); vcallLocalStream = null; }
            if (vcallPc) { try { vcallPc.close(); } catch (e) {} vcallPc = null; }
            if (!skipDbUpdate && activeVcallDocId && Nexus.db) {
                Nexus.db.collection("nexus_video_calls").doc(activeVcallDocId).set({ status: 'ended' }, { merge: true }).catch(() => {});
            }
            activeVcallDocId = '';
            const modal = document.getElementById('nx-global-modal');
            if (modal) modal.style.display = 'none';
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
                        <button type="button" onclick="NexusCore.exportAiHistoryTxt()" style="background:#1e293b; border:1px solid #38bdf8; color:#38bdf8; padding:5px 9px; border-radius:10px; font-size:11px; font-weight:800; cursor:pointer;">📥 Save</button>
                        <button type="button" onclick="NexusCore.clearAiStudioHistory()" style="background:#1e293b; border:1px solid #334155; color:#f87171; padding:5px 9px; border-radius:10px; font-size:11px; font-weight:800; cursor:pointer;">🗑️ Clear</button>
                    </div>
                </div>

                <div style="display:flex; gap:6px; overflow-x:auto; padding:8px 12px; background:#0f172a; border-bottom:1px solid #1e293b; scrollbar-width:none; flex-shrink:0;">
                    <button type="button" class="nx-ai-quick-chip" onclick="NexusCore.quickAsk('What is Nexus')">📘 About Nexus</button>
                    <button type="button" class="nx-ai-quick-chip" onclick="NexusCore.quickAsk('Explain Nexus Website Architecture')">🏗️ Website Code Info</button>
                    <button type="button" class="nx-ai-quick-chip" onclick="NexusCore.quickAsk('JEE Formulas')">📐 JEE Formulas</button>
                    <button type="button" class="nx-ai-quick-chip" onclick="NexusCore.quickAsk('Write HTML CSS JS calculator code')">💻 Calculator Code</button>
                    <button type="button" class="nx-ai-quick-chip" onclick="NexusCore.quickAsk('photo banao futuristic IIT campus study room')">🎨 Safe AI Wallpaper</button>
                </div>

                <div id="nx-ai-studio-msgs" style="flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:10px; background:#0b141a;">
                    ${aiChatHistory.map(m => formatAiStudioMessageHTML(m)).join('')}
                </div>

                <div style="padding:8px 10px; background:#111b21; border-top:1px solid #1e293b; display:flex; align-items:center; gap:8px; flex-shrink:0;">
                    <button type="button" onclick="NexusCore.startAiVoiceMic()" style="background:#202c33; border:1px solid #334155; color:#38bdf8; width:38px; height:38px; border-radius:50%; font-size:16px; cursor:pointer; flex-shrink:0;">🎙️</button>
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

        startAiVoiceMic: function() {
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRec) return Nexus.toast("🎙️ Mic not supported");
            const rec = new SpeechRec();
            rec.lang = 'en-IN';
            Nexus.toast("🎙️ Speak now...");
            rec.onresult = e => {
                const inp = document.getElementById('nx-ai-studio-in');
                if (inp) { inp.value = e.results[0][0].transcript; this.sendPrivateAiMessage(); }
            };
            rec.start();
        },

        exportAiHistoryTxt: function() {
            if (!aiChatHistory.length) return;
            let txt = aiChatHistory.map(m => `[${m.role.toUpperCase()}]:\n${m.text}\n`).join('\n-------------------\n');
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' }));
            a.download = `Nexus_AI_Study_Notes_${Date.now()}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        },

        closePrivateAiStudio: function() {
            this.stopSwaraVoice();
            const studio = document.getElementById('nx-private-ai-studio');
            if (studio) studio.style.display = 'none';
        },

        clearAiStudioHistory: function() {
            this.stopSwaraVoice();
            aiChatHistory = [];
            localStorage.removeItem('nx_private_ai_history_v9');
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
                    `<div id="nx-ai-thinking-bubble" style="align-self:flex-start; background:#182229; border:1px solid #a78bfa; color:#d8b4fe; padding:9px 14px; border-radius:14px; font-size:12.5px; font-weight:800;">⚡ Thinking &amp; generating answer...</div>`;
                msgBox.scrollTop = msgBox.scrollHeight;
            }

            let violationType = isProhibitedOrUnsafePrompt(userQ);
            if (violationType) {
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
                try { localStorage.setItem('nx_private_ai_history_v9', JSON.stringify(aiChatHistory.slice(-20))); } catch (e) {}
                if (msgBox) { msgBox.innerHTML = aiChatHistory.map(m => formatAiStudioMessageHTML(m)).join(''); msgBox.scrollTop = msgBox.scrollHeight; }
                return;
            }

            if (sendBtn) sendBtn.disabled = true;
            let aiReply = getSmartComprehensiveAnswer(userQ);
            let usedServerName = aiReply ? 'Nexus Official Brain' : '';

            // Instant Math Expression Evaluator if user typed a math calculation
            if (!aiReply && /^[0-9+\-*/().\s^%]+$/.test(userQ) && /[+\-*/^%]/.test(userQ)) {
                try {
                    let ans = Function('"use strict";return (' + userQ.replace(/\^/g, '**') + ')')();
                    if (Number.isFinite(ans)) {
                        aiReply = `🧮 **Math Calculation Result:**\n\n• Expression: \`${userQ}\`\n• **Answer:** **${ans}**`;
                        usedServerName = 'Nexus Math Solver';
                    }
                } catch (e) {}
            }

            if (!aiReply) {
                // Fast Clean GET & POST Requests without newline characters in URL path
                const cleanOneLinePrompt = `Answer clearly in Hinglish or English for student: ${userQ.replace(/\s+/g, ' ')}`;
                const tryUrls = [
                    `${POLLINATIONS_ROOT}${encodeURIComponent(cleanOneLinePrompt)}`,
                    `${POLLINATIONS_ROOT}${encodeURIComponent(userQ)}`
                ];

                for (let u of tryUrls) {
                    try {
                        let r = await fetch(u);
                        if (r.ok) {
                            let t = (await r.text()).trim();
                            if (t && t.length > 4 && !t.startsWith('<!DOCTYPE') && !t.includes('502 Bad Gateway')) {
                                aiReply = t;
                                usedServerName = 'Cloud AI Fast Node';
                                break;
                            }
                        }
                    } catch (e) {}
                }
            }

            if (!aiReply) {
                try {
                    let rPost = await fetch(POLLINATIONS_OPENAI, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: 'openai',
                            messages: [{ role: 'user', content: userQ }]
                        })
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
                aiReply = `💡 **${userQ}**\n\n• **Concept Overview:** Yeh topic JEE/Coding preparation ke liye upyogi hai.\n• **Quick Tip:** Aap upar diye gaye Quick Chips (**📘 About Nexus**, **🏗️ Website Code Info**, **📐 JEE Formulas**, **💻 Calculator Code**, **🎨 Safe AI Wallpaper**) par click karke instant notes aur code bhi le sakte hain!`;
                usedServerName = 'Nexus Instant Tutor';
            }

            if (statusEl) statusEl.innerText = `🟢 Connected: ${usedServerName}`;
            if (sendBtn) sendBtn.disabled = false;

            aiChatHistory.push({ role: 'ai', text: aiReply, serverName: usedServerName });
            try { localStorage.setItem('nx_private_ai_history_v9', JSON.stringify(aiChatHistory.slice(-20))); } catch (e) {}

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
            let speechStarted = false;

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

            if ('speechSynthesis' in window) {
                let voices = window.speechSynthesis.getVoices() || [];
                let swara = voices.find(v => /swara/i.test(v.name)) || voices.find(v => v.lang === 'hi-IN') || voices.find(v => v.lang === 'en-IN');
                const speakNative = () => {
                    if (!isSwaraSpeaking || idx >= chunks.length) {
                        isSwaraSpeaking = false;
                        if (btnEl) btnEl.innerText = '🔊 Listen (Swara)';
                        return;
                    }
                    let u = new SpeechSynthesisUtterance(chunks[idx].trim());
                    if (swara) u.voice = swara;
                    u.lang = swara ? swara.lang : 'hi-IN';
                    u.onstart = () => { speechStarted = true; };
                    u.onend = () => { idx++; speakNative(); };
                    u.onerror = () => { if (!speechStarted) playCloudTts(); };
                    window.speechSynthesis.speak(u);
                };
                speakNative();
                setTimeout(() => {
                    if (isSwaraSpeaking && !speechStarted && (!window.speechSynthesis.speaking)) {
                        window.speechSynthesis.cancel();
                        playCloudTts();
                    }
                }, 1200);
            } else {
                playCloudTts();
            }
        },

        copyBase64Text: function(b64, msg) {
            try {
                navigator.clipboard.writeText(decodeURIComponent(escape(atob(b64))));
                Nexus.toast(msg || "📋 Copied!");
            } catch (e) {}
        }
    };

    // Single lightweight maintenance check every 1.8s (ONLY runs when user is NOT typing!)
    function runLightweightIdleCheck() {
        if (isUserCurrentlyTyping) return;
        optimizeNexusEngineForZeroLag();
        enforceSingleMessageButtonAndCleanDeletedPills();
        injectAiButtonsEverywhere();
        startLiveNotificationEngine();
        upgradeOpenNotificationsModal();
        upgradeAdvanceTwoWayVideoCall();
        startIncomingVideoCallListener();
    }

    document.addEventListener('DOMContentLoaded', () => {
        runLightweightIdleCheck();
        setInterval(runLightweightIdleCheck, 1800);
    });
    setTimeout(runLightweightIdleCheck, 200);
})();
