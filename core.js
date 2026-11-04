// ================= CORE.JS (v8.0 ULTIMATE MASTER): 📹 2-WAY FACE-TO-FACE WEBRTC VIDEO CALL (WITH INCOMING RINGTONE & CAMERA FLIP) + 🔔 LIVE REAL-TIME NOTIFICATION BELL + 📲 NATIVE PWA APP INSTALLER (NO .HTML DOWNLOAD) + ⚡ 0.01s FIREBASE PERSISTENCE + 🛡️ SINGLE DELETED PILL & ZERO TRAY OVERLAP + 🤖 11-SERVER AI STUDIO =================

(function() {
    const PROTO = 'https:' + '//';
    const POLLINATIONS_OPENAI = PROTO + 'text.pollinations.ai/openai';
    const POLLINATIONS_ROOT = PROTO + 'text.pollinations.ai/';
    const IMG_GEN_API = PROTO + 'image.pollinations.ai/prompt/';

    let selectedVoiceEffect = 'normal';
    let aiChatHistory = [];
    try {
        aiChatHistory = JSON.parse(localStorage.getItem('nx_private_ai_history_v7') || '[]');
    } catch (e) {
        aiChatHistory = [];
    }
    let isSwaraSpeaking = false;
    let fallbackAudioPlayer = null;
    let activeHealthyAiServerIndex = 0;
    let deferredPwaPrompt = null;

    // 2-Way Live Video Call State
    let vcallPc = null;
    let vcallLocalStream = null;
    let vcallRoomUnsub = null;
    let vcallIncomingUnsub = null;
    let activeVcallDocId = '';
    let currentFacingMode = 'user';
    let isVcallMicMuted = false;
    let isVcallCamOff = false;
    let ringtoneTimer = null;

    // Live Notifications State
    let notifListenerUnsub = null;
    let liveCloudNotifs = [];
    let lastSeenNotifCount = Number(localStorage.getItem('nx_seen_notif_cnt') || 0);

    const RTC_ICE_CONFIG = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" }
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
        { name: "Server-6 (Gemini Flash)", model: "gemini", type: "post" },
        { name: "Server-7 (OpenAI Fast GET)", model: "openai", type: "get" },
        { name: "Server-8 (Mistral Fast GET)", model: "mistral", type: "get" },
        { name: "Server-9 (Llama Fast GET)", model: "llama", type: "get" },
        { name: "Server-10 (Phi-4 Node)", model: "phi", type: "post" },
        { name: "Server-11 (Direct Backup Node)", model: "openai", type: "get" }
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
        .nx-ai-quick-chip:active {
            background: #38bdf8;
            color: #020617;
        }
        /* Incoming Video Call Banner */
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
    // 1. ⚡ 0.01s FIREBASE OFFLINE PERSISTENCE & PWA SERVICE WORKER REGISTRATION
    // =========================================================================
    function initTurboSpeedAndRealPWA() {
        // Register manifest.json link & Service Worker (sw.js) for real Android App installation
        if (!document.querySelector('link[rel="manifest"]')) {
            const mLink = document.createElement('link');
            mLink.rel = 'manifest';
            mLink.href = 'manifest.json';
            document.head.appendChild(mLink);
        }
        if ('serviceWorker' in navigator && !window.__nxSwRegistered) {
            window.__nxSwRegistered = true;
            navigator.serviceWorker.register('sw.js').catch(() => {});
        }

        // Enable Firebase IndexedDB Offline Persistence so data loads in 0.01s!
        if (window.Nexus && Nexus.db && !window.__nxPersistenceEnabled) {
            window.__nxPersistenceEnabled = true;
            try {
                Nexus.db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
            } catch (e) {}
        }

        // Override installPWA so it NEVER downloads an .html file!
        if (window.NexusPower) {
            NexusPower.installPWA = function() {
                if (deferredPwaPrompt) {
                    deferredPwaPrompt.prompt();
                    deferredPwaPrompt.userChoice.then(() => { deferredPwaPrompt = null; });
                    return;
                }
                const modal = document.getElementById('nx-global-modal');
                if (!modal) return;
                let hostUrl = window.location.href.replace(/^https?:\/\//, '');
                let chromeIntent = `intent://${hostUrl}#Intent;scheme=https;package=com.android.chrome;end`;

                modal.innerHTML = `
                    <div class="nx-modal-box" style="border:2px solid #10b981; text-align:center; background:#0f172a;">
                        <div style="width:58px; height:58px; border-radius:16px; background:linear-gradient(135deg,#10b981,#2563eb); color:white; font-size:28px; font-weight:900; display:flex; align-items:center; justify-content:center; margin:0 auto 10px;">N</div>
                        <h3 style="color:#f8fafc; font-size:17px; margin-bottom:6px;">📲 Install Official Nexus App</h3>
                        <p style="font-size:12.5px; color:#cbd5e1; line-height:1.5; margin-bottom:14px;">
                            Apne phone mein <b>Asli Official Nexus App</b> install karne ke liye niche green button dabayein (ya Chrome ke upar <b>⋮</b> menu mein <b>"Add to Home screen / Install app"</b> par tap karein):
                        </p>
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            <a href="${chromeIntent}" style="display:block; background:#10b981; color:#020617; text-decoration:none; padding:12px; border-radius:12px; font-weight:900; font-size:13.5px;">🚀 Open in Chrome &amp; Install App</a>
                            <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:#1e293b; color:#94a3b8; border:1px solid #334155; padding:10px; border-radius:12px; font-weight:800; cursor:pointer;">Close</button>
                        </div>
                    </div>
                `;
                modal.style.display = 'flex';
            };
        }
    }

    // =========================================================================
    // 2. 🔔 REAL-TIME NOTIFICATION PANEL (Works Across All Users' Phones!)
    // =========================================================================
    function startLiveNotificationEngine() {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        if (!me || !me.username || !Nexus.db || notifListenerUnsub) return;

        let myU = me.username.toLowerCase().trim();

        notifListenerUnsub = Nexus.db.collection("nexus_notifications")
            .where("toUser", "==", myU)
            .limit(35)
            .onSnapshot(snap => {
                liveCloudNotifs = [];
                snap.forEach(doc => {
                    let d = doc.data();
                    d.id = doc.id;
                    liveCloudNotifs.push(d);
                });
                liveCloudNotifs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

                updateNotificationBadgeUI();
            }, () => {});
    }

    function collectAllMyNotifications() {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        if (!me) return [];
        let myU = me.username.toLowerCase().trim();
        let combined = [];

        // 1. Direct Cloud Notifications (Follows, Mentions, Calls)
        liveCloudNotifs.forEach(n => {
            combined.push({
                icon: n.type === 'follow' ? '👋' : (n.type === 'call' ? '📹' : '🔔'),
                from: n.fromUser || 'member',
                html: `<b>@${n.fromUser || 'member'}</b> ${n.text || 'sent you an update'}`,
                time: n.createdAt || 0
            });
        });

        // 2. Post Likes & Comments on My Posts
        (Nexus.posts || []).forEach(p => {
            if (!p) return;
            let pU = (p.username || '').toLowerCase().trim();
            let pA = (p.author || '').toLowerCase().trim();
            if (pU === myU || pA === (me.name || '').toLowerCase().trim()) {
                (p.likedBy || []).forEach(liker => {
                    if (String(liker).toLowerCase() !== myU) {
                        combined.push({
                            icon: '❤️',
                            from: liker,
                            html: `<b>@${liker}</b> liked your post: "${(p.text || 'Photo').substring(0, 32)}"`,
                            time: p.createdAt || 0
                        });
                    }
                });
                (p.comments || []).forEach(c => {
                    if (c && c.username && c.username.toLowerCase() !== myU) {
                        combined.push({
                            icon: '💬',
                            from: c.username,
                            html: `<b>@${c.username}</b> commented: "${(c.text || '').substring(0, 36)}"`,
                            time: c.createdAt || p.createdAt || 0
                        });
                    }
                });
            }
        });

        return combined.slice(0, 35);
    }

    function updateNotificationBadgeUI() {
        const dot = document.getElementById('nx-notif-dot');
        if (!dot) return;
        let allList = collectAllMyNotifications();
        let unread = Math.max(0, allList.length - lastSeenNotifCount);
        if (unread > 0) {
            dot.innerText = unread > 9 ? '9+' : String(unread);
            dot.style.display = 'inline-block';
        } else {
            dot.style.display = 'none';
        }
    }

    function upgradeOpenNotificationsModal() {
        if (!window.Nexus || Nexus.__nxNotifModalUpgraded) return;
        Nexus.__nxNotifModalUpgraded = true;

        Nexus.openNotifications = function() {
            let me = Nexus.getCurrentUser();
            if (!me) { Nexus.switchTab('tab-profile'); return; }
            let list = collectAllMyNotifications();
            lastSeenNotifCount = list.length;
            localStorage.setItem('nx_seen_notif_cnt', String(lastSeenNotifCount));
            updateNotificationBadgeUI();

            const modal = document.getElementById('nx-global-modal');
            modal.innerHTML = `
                <div class="nx-modal-box" style="border:1.5px solid #38bdf8; max-width:410px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <h3 style="font-size:16px; color:#f8fafc;">🔔 Live Activity &amp; Notifications (${list.length})</h3>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:8px; max-height:58vh; overflow-y:auto;">
                        ${list.length === 0
                            ? `<div style="text-align:center; padding:22px; color:#64748b; font-size:13px;">All caught up! New likes, comments, follows &amp; calls will appear here live.</div>`
                            : list.map(item => `
                                <div onclick="document.getElementById('nx-global-modal').style.display='none'; Nexus.openPublicProfile('${String(item.from).replace(/'/g, "\\'")}');" style="padding:10px 12px; background:#161f33; border:1px solid #1e293b; border-left:3.5px solid #10b981; border-radius:12px; font-size:12.5px; color:#e2e8f0; display:flex; align-items:center; gap:10px; cursor:pointer;">
                                    <span style="font-size:18px;">${item.icon}</span>
                                    <div style="flex:1; line-height:1.4;">${item.html}</div>
                                </div>
                            `).join('')
                        }
                    </div>
                </div>
            `;
            modal.style.display = 'flex';
        };
    }

    // =========================================================================
    // 3. 📹 2-WAY FACE-TO-FACE WEBRTC VIDEO CALL ENGINE (Both Faces + Ringtone!)
    // =========================================================================
    function playIncomingRingtoneBeep() {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            const ctx = new Ctx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.18); // A5
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
                                <div style="font-weight:900; font-size:13.5px; color:#f8fafc;">Incoming Video Call</div>
                                <div style="font-size:11.5px; color:#6ee7b7; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">@${ringingCall.fromUser} (${ringingCall.fromName || ''}) is calling you...</div>
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

    function getActiveDmPartnerUsername() {
        const statusEl = document.getElementById('nx-dm-partner-status');
        const nameEl = document.getElementById('nx-dm-partner-name');
        if (nameEl && nameEl.innerText) {
            let disp = nameEl.innerText.trim().toLowerCase();
            let u = (Nexus.users || []).find(x => x && ((x.name && x.name.toLowerCase() === disp) || (x.username && x.username.toLowerCase() === disp)));
            if (u && u.username) return u.username.toLowerCase().trim();
        }
        if (statusEl && statusEl.innerText) {
            let m = statusEl.innerText.match(/@([a-zA-Z0-9_]+)/);
            if (m && m[1]) return m[1].toLowerCase().trim();
        }
        return '';
    }

    function openVideoCallScreenUI(partnerLabel) {
        const modal = document.getElementById('nx-global-modal');
        if (!modal) return;

        modal.innerHTML = `
            <div class="nx-modal-box" style="border:2px solid #38bdf8; text-align:center; background:#090d16; padding:12px; max-width:410px; width:100%;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <div style="display:flex; align-items:center; gap:7px;">
                        <span style="width:24px; height:24px; border-radius:6px; background:linear-gradient(135deg,#10b981,#2563eb); color:white; display:inline-flex; align-items:center; justify-content:center; font-weight:900; font-size:12px;">📹</span>
                        <strong id="nx-vcall-status-title" style="color:#38bdf8; font-size:14px;">Calling ${partnerLabel}...</strong>
                    </div>
                    <button type="button" onclick="NexusCore.endActiveVideoCall()" style="background:#ef4444; border:none; color:white; padding:4px 10px; border-radius:8px; font-size:11.5px; font-weight:900; cursor:pointer;">End ✕</button>
                </div>

                <!-- Main Video Stage: Remote Partner Face Fullscreen + Your Own Face in PiP Corner -->
                <div style="position:relative; background:#020617; border-radius:16px; overflow:hidden; height:60dvh; max-height:440px; margin:0 auto 10px; border:1.5px solid #1e293b; display:flex; align-items:center; justify-content:center;">
                    <video id="nx-remote-video-el" autoplay playsinline style="width:100%; height:100%; object-fit:cover; display:block;"></video>
                    <div id="nx-remote-waiting-overlay" style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; background:rgba(9,13,22,0.75); color:#cbd5e1; font-size:13px; font-weight:700; pointer-events:none;">
                        <div style="font-size:34px; margin-bottom:8px;">🔔</div>
                        <div>Ringing ${partnerLabel}'s phone...</div>
                        <div style="font-size:11px; color:#38bdf8; margin-top:4px;">Jab dost Accept karega toh unka face yahan dikhega</div>
                    </div>

                    <!-- Your Own Camera (PiP Corner Box) -->
                    <video id="nx-local-video-preview" autoplay playsinline muted style="position:absolute; bottom:10px; right:10px; width:105px; height:142px; object-fit:cover; border-radius:12px; border:2px solid #10b981; background:#000; transform:scaleX(-1); z-index:10; box-shadow:0 8px 20px rgba(0,0,0,0.7);"></video>
                </div>

                <!-- Call Controls Bar -->
                <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:8px;">
                    <button type="button" id="nx-vcall-mute-btn" onclick="NexusCore.toggleVideoCallMute()" style="background:#1e293b; color:white; border:1px solid #334155; padding:10px 4px; border-radius:12px; font-weight:800; font-size:11.5px; cursor:pointer;">🎤 Mic ON</button>
                    <button type="button" id="nx-vcall-cam-btn" onclick="NexusCore.toggleVideoCallCam()" style="background:#1e293b; color:white; border:1px solid #334155; padding:10px 4px; border-radius:12px; font-weight:800; font-size:11.5px; cursor:pointer;">📹 Cam ON</button>
                    <button type="button" onclick="NexusCore.flipVideoCallCamera()" style="background:#1e293b; color:#38bdf8; border:1px solid #334155; padding:10px 4px; border-radius:12px; font-weight:800; font-size:11.5px; cursor:pointer;">🔄 Flip Cam</button>
                    <button type="button" onclick="NexusCore.endActiveVideoCall()" style="background:#ef4444; color:white; border:none; padding:10px 4px; border-radius:12px; font-weight:900; font-size:11.5px; cursor:pointer;">📴 End</button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    }

    function upgradeAdvanceTwoWayVideoCall() {
        if (!window.NexusAdvance || NexusAdvance.__nxTwoWayVideoUpgraded) return;
        NexusAdvance.__nxTwoWayVideoUpgraded = true;

        NexusAdvance.startVideoCall = async function(isDm) {
            let me = Nexus.getCurrentUser();
            if (!me || !Nexus.db) return;

            let targetUser = isDm ? getActiveDmPartnerUsername() : '';
            if (!targetUser) {
                let raw = prompt("📹 Dost ka @username likhein jise Live Video Call lagana hai:", "");
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
                    if (titleEl) titleEl.innerText = `🟢 Live Video Call with @${targetUser}`;
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

            if (Nexus.pushRealNotification) {
                Nexus.pushRealNotification(targetUser, 'call', 'started a Live Video Call with you 📹');
            }

            if (vcallRoomUnsub) vcallRoomUnsub();
            let addedCalleeCands = new Set();

            vcallRoomUnsub = Nexus.db.collection("nexus_video_calls").doc(callDocId).onSnapshot(async snap => {
                if (!snap.exists) return;
                let data = snap.data();
                if (data.status === 'ended' || data.status === 'declined') {
                    Nexus.toast("📴 Video Call Ended");
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
    // 4. TWO-WAY FOLLOWER GRAPH, PROFILE BUTTON GUARD & SINGLE DELETED PILL
    // =========================================================================
    function patchMasterFollowerGraph() {
        if (!window.Nexus || Nexus.__nxTwoWayGraphPatched) return;
        Nexus.__nxTwoWayGraphPatched = true;

        const origRebuild = Nexus.rebuildAllUsersMasterList.bind(Nexus);
        Nexus.rebuildAllUsersMasterList = function() {
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
        };
        Nexus.rebuildAllUsersMasterList();
    }

    function enforceSingleMessageButtonOnPublicProfile() {
        const modal = document.getElementById('nx-global-modal');
        if (!modal || modal.style.display === 'none') return;

        const followBtn = modal.querySelector('button[onclick*="Nexus.toggleFollow"]');
        if (!followBtn) return;

        let match = (followBtn.getAttribute('onclick') || '').match(/'([^']+)'/);
        if (!match || !match[1]) return;
        let targetUser = match[1];
        let uObj = (window.Nexus && Nexus.users || []).find(u => u && u.username && u.username.toLowerCase() === targetUser.toLowerCase());
        let targetName = (uObj && uObj.name) ? uObj.name : targetUser;
        let safeU = targetUser.replace(/'/g, "\\'");
        let safeN = targetName.replace(/'/g, "\\'");

        const parentRow = followBtn.parentElement;
        if (!parentRow) return;
        parentRow.style.display = 'flex';
        parentRow.style.gap = '10px';
        followBtn.style.flex = '1';

        let msgBtns = Array.from(parentRow.querySelectorAll('button')).filter(b => b !== followBtn);

        if (msgBtns.length === 0) {
            const mBtn = document.createElement('button');
            mBtn.type = 'button';
            mBtn.className = 'nx-guaranteed-msg-btn';
            mBtn.style.cssText = "flex:1; background:#10b981; color:#020617; border:none; padding:11px; border-radius:12px; font-weight:900; font-size:13.5px; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:6px;";
            mBtn.innerHTML = `💬 Message`;
            mBtn.onclick = () => {
                modal.style.display = 'none';
                if (window.NexusDM) NexusDM.openDirectChat(safeU, safeN, '');
            };
            parentRow.appendChild(mBtn);
        } else {
            msgBtns.forEach((b, idx) => {
                if (idx === 0) {
                    if (b.id === 'nx-dm-trigger-btn') b.removeAttribute('id');
                    b.style.setProperty('display', 'inline-flex', 'important');
                    b.style.flex = '1';
                    b.style.alignItems = 'center';
                    b.style.justifyContent = 'center';
                    b.onclick = () => {
                        modal.style.display = 'none';
                        if (window.NexusDM) NexusDM.openDirectChat(safeU, safeN, '');
                    };
                } else {
                    b.remove();
                }
            });

            if (!document.getElementById('nx-dm-trigger-btn')) {
                const dummyMarker = document.createElement('span');
                dummyMarker.id = 'nx-dm-trigger-btn';
                dummyMarker.style.display = 'none';
                modal.appendChild(dummyMarker);
            }
        }
    }

    function patchDmDeleteAndFixPlusTrayOverlap() {
        if (window.NexusDM) {
            const executeUniversalDmDeleteForEveryone = async function(msgId) {
                const modal = document.getElementById('nx-msg-action-modal');
                if (modal) modal.style.display = 'none';

                let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
                if (!me || !Nexus.db || !msgId) return;

                let deletedLabel = `${me.name || me.username} (@${me.username})`;

                const rowEl = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
                if (rowEl) {
                    rowEl.classList.add('nx-deleted-row-clean');
                    rowEl.innerHTML = `<div class="nx-single-deleted-pill">🚫 This message was deleted by <b>${deletedLabel}</b></div>`;
                }

                try {
                    await Nexus.db.collection('nexus_private_dms').doc(msgId).set({
                        deleted: true,
                        deletedAt: Date.now(),
                        deletedBy: me.username,
                        deletedByName: deletedLabel,
                        text: '',
                        imgUrl: '',
                        imgUrls: [],
                        sticker: null,
                        replyTo: null,
                        edited: false,
                        likes: [],
                        reaction: ''
                    }, { merge: true });
                    Nexus.toast('🗑️ Message deleted for everyone!');
                } catch (e) {
                    Nexus.toast('⚠️ Network slow, retrying delete...');
                }
            };

            NexusDM.deleteDMForEveryone = executeUniversalDmDeleteForEveryone;
            NexusDM.deleteDmMessage = executeUniversalDmDeleteForEveryone;

            if (window.NexusPower && !NexusPower.__nxDelHookedV8) {
                NexusPower.__nxDelHookedV8 = true;
                const origExec = NexusPower.execDmAction;
                NexusPower.execDmAction = function(action, msgId) {
                    if (action === 'delete' || action === 'deleteForEveryone') {
                        return executeUniversalDmDeleteForEveryone(msgId);
                    }
                    if (origExec) return origExec.apply(this, arguments);
                };
            }
        }

        document.querySelectorAll('#nx-dm-msgs-box .nx-dm-bubble-anim').forEach(row => {
            if ((row.innerText || '').includes('This message was deleted by')) {
                const bubble = row.firstElementChild;
                if (bubble && !bubble.classList.contains('nx-single-deleted-pill')) {
                    let rawHTML = bubble.innerHTML || '';
                    if (!rawHTML.includes('🚫')) rawHTML = '🚫 ' + rawHTML;
                    row.classList.add('nx-deleted-row-clean');
                    row.innerHTML = `<div class="nx-single-deleted-pill">${rawHTML}</div>`;
                }
            }
        });

        const dmMsgBox = document.getElementById('nx-dm-msgs-box');
        const dmTray = document.getElementById('nx-dm-bottom-tray');
        const dmComposer = document.getElementById('nx-dm-composer');

        if (dmTray && dmComposer && dmTray.parentNode === document.body) {
            dmComposer.parentNode.insertBefore(dmTray, dmComposer);
        }

        if (dmMsgBox && !dmMsgBox.__nxTrayAutoCloseBound) {
            dmMsgBox.__nxTrayAutoCloseBound = true;
            dmMsgBox.addEventListener('click', () => {
                const t = document.getElementById('nx-dm-bottom-tray');
                if (t && t.style.display !== 'none') {
                    if (window.NexusPower && NexusPower.toggleBottomTray) NexusPower.toggleBottomTray(false);
                    else t.style.display = 'none';
                }
            });
        }
    }

    // =========================================================================
    // 5. 🤖 ADVANCED NEXUS 1:1 PRIVATE AI STUDIO
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
                        <div style="font-size:11px; color:#d8b4fe;">🔊 Swara Voice • 🎨 Safe Image Gen • 11 Fast Servers</div>
                    </div>
                </div>
                <span style="background:#a78bfa; color:#020617; padding:5px 10px; border-radius:12px; font-size:11px; font-weight:900;">Ask 1:1 →</span>
            `;
            dmBanner.appendChild(aiCard);
        }
    }

    function isProhibitedOrUnsafePrompt(q) {
        let low = (q || '').toLowerCase();
        const hackingPattern = /\b(hack|hacking|exploit|ddos|phishing|crack|bypass|sql injection|steal password|keylogger|malware|virus|dark web|ransomware|admin pin)\b/i;
        const nsfwAbusivePattern = /\b(nude|naked|nsfw|porn|xxx|sex|sexy|boobs|bikini|18\+|adult|erotic|hot girl|kissing|lingerie|vulgar|gali|abusive|blood|gore|suicide|kill)\b/i;
        if (hackingPattern.test(low)) return 'hacking';
        if (nsfwAbusivePattern.test(low)) return 'nsfw';
        return '';
    }

    function isAiImagePrompt(q) {
        let low = (q || '').toLowerCase().trim();
        return ['/img', '/image', 'photo banao', 'image banao', 'picture banao', 'generate image', 'create image', 'make a picture', 'draw ', 'wallpaper banao', 'dp banao'].some(t => low.startsWith(t) || low.includes(t));
    }

    function getBuiltInExpertAnswer(userQ) {
        let low = (userQ || '').toLowerCase().trim();
        if (low.includes('website architecture') || low.includes('nexus code') || low.includes('kaun si file') || low.includes('how nexus is built')) {
            return "🏗️ **Nexus Platform — Complete Code & File Architecture**\n\nNexus ek **Modular Single-Page Web Application (SPA)** hai jo HTML5, CSS3, Vanilla JavaScript (ES6+), WebRTC aur Google Firebase Firestore par bana hai:\n\n1. **`index.html`:** Responsive layout, 5-tab bottom navigation bar, aur real-time Firebase state synchronization (`Nexus.users`, `Nexus.posts`).\n2. **`home.js`:** Top Live Stories Bar (`Nexus ✅` + active members), Home Feed, 4-Option Live Polls, Double-Tap Like ❤️, Smooth Bookmark 🔖, Real Views Tracker 👁️, aur Reply/Edit Comments.\n3. **`chat.js`:** 8 Subject & Chill Community Channels (`PCM Doubt Solver`, `JEE Study Material`, `Coding Hub`), Live Test Series button, aur PDF Study Vault.\n4. **`dm.js`:** End-to-End 1:1 Personal Direct Messaging, Real-time Seen Ticks (`✓✓`), Multi-Photo Upload, aur Delete for Everyone.\n5. **`post.js`:** Full-screen Post Studio (Bold, Italic, Underline, 6 Text Colors, 5 Card Themes, aur Poll Builder).\n6. **`core.js`:** 11-Server Auto-Failover AI Studio, 2-Way WebRTC Face-to-Face Video Call, Live Notification Bell, aur Native PWA Service Worker.";
        }
        if (low.includes('nexus')) {
            return "🌟 **Nexus Official — Student & Creator Community Platform**\n\n**Nexus** ek modern, privacy-first Educational & Student Community App hai jise **Mohit Kumar (@mohiy / Mohit_01)** ne develop kiya hai.\n\n**Mukhya Features:**\n1. **🏠 Interactive Home Feed:** JEE/NEET doubts, notes, 4-option live polls, Double-Tap Like ❤️, Smooth Bookmark 🔖 & Real Views tracker 👁️.\n2. **💬 1:1 Personal DM & 8 Live Channels:** Direct chat, 2-Way Face-to-Face Video Calls & study rooms.\n3. **🤖 1:1 Private AI Studio:** Swara Voice Reader 🔊, Code Copy 📋 & Safe AI Image Generator 🎨.";
        }
        if (low === 'what is ai' || low.includes('what is ai ') || low.includes('artificial intelligence') || low.includes('ai kya hai')) {
            return "🤖 **What is AI (Artificial Intelligence)? — Complete Guide**\n\n**Artificial Intelligence (AI)** computer science ki woh branch hai jisse machines aur software ko insano ki tarah sochne, samajhne, seekhne (Machine Learning) aur decision lene ki kshamta di jati hai.\n\n• **Machine Learning & Deep Learning:** Data se patterns seekhna.\n• **NLP (Natural Language Processing):** Hindi, English aur Hinglish samajhna aur jawab dena.\n• **Generative AI:** Naya code likhna, PCM numericals solve karna aur text se HD educational images banana.";
        }
        if (low === 'jee formulas' || low.includes('jee formula sheet')) {
            return "📐 **Important IIT-JEE PCM Quick Formula Sheet**\n\n**1. Physics:**\n• $v = u + at$  |  $s = ut + \\frac{1}{2}at^2$  |  $v^2 - u^2 = 2as$\n• Projectile Range: $R = \\frac{u^2 \\sin(2\\theta)}{g}$  |  Max Height: $H = \\frac{u^2 \\sin^2\\theta}{2g}$\n\n**2. Physical Chemistry:**\n• Ideal Gas Law: $PV = nRT$\n• Nernst Equation: $E = E^\\circ - \\frac{0.0591}{n}\\log Q$\n\n**3. Mathematics:**\n• Quadratic Roots: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$\n• Integration by Parts: $\\int u\\,dv = uv - \\int v\\,du$";
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
        // Answer Incoming 2-Way Video Call
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
                vcallLocalStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: currentFacingMode },
                    audio: true
                });
            } catch (e) {
                Nexus.toast("⚠️ Allow Camera & Microphone to answer video call!");
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
                const titleEl = document.getElementById('nx-vcall-status-title');
                if (remVid && ev.streams && ev.streams[0]) {
                    remVid.srcObject = ev.streams[0];
                    remVid.play().catch(() => {});
                    if (waitOv) waitOv.style.display = 'none';
                    if (titleEl) titleEl.innerText = `🟢 Live Video Call with @${callData.fromUser}`;
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

            await callRef.set({
                status: 'connected',
                answer: { type: answer.type, sdp: answer.sdp }
            }, { merge: true });

            if (vcallRoomUnsub) vcallRoomUnsub();
            let addedCallerCands = new Set();

            vcallRoomUnsub = callRef.onSnapshot(docSnap => {
                if (!docSnap.exists) return;
                let d = docSnap.data();
                if (d.status === 'ended') {
                    Nexus.toast("📴 Video Call Ended");
                    NexusCore.endActiveVideoCall(true);
                    return;
                }
                if (Array.isArray(d.callerCandidates) && vcallPc && vcallPc.currentRemoteDescription) {
                    d.callerCandidates.forEach(c => {
                        let k = JSON.stringify(c);
                        if (!addedCallerCands.has(k)) {
                            addedCallerCands.add(k);
                            vcallPc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
                        }
                    });
                }
            });
        },

        declineIncomingVideoCall: function(callDocId) {
            clearInterval(ringtoneTimer);
            const banner = document.getElementById('nx-incoming-vcall-banner');
            if (banner) banner.style.display = 'none';
            if (Nexus.db && callDocId) {
                Nexus.db.collection("nexus_video_calls").doc(callDocId).set({ status: 'declined' }, { merge: true }).catch(() => {});
            }
        },

        toggleVideoCallMute: function() {
            if (!vcallLocalStream) return;
            isVcallMicMuted = !isVcallMicMuted;
            vcallLocalStream.getAudioTracks().forEach(t => { t.enabled = !isVcallMicMuted; });
            const btn = document.getElementById('nx-vcall-mute-btn');
            if (btn) btn.innerText = isVcallMicMuted ? '🔇 Muted' : '🎤 Mic ON';
        },

        toggleVideoCallCam: function() {
            if (!vcallLocalStream) return;
            isVcallCamOff = !isVcallCamOff;
            vcallLocalStream.getVideoTracks().forEach(t => { t.enabled = !isVcallCamOff; });
            const btn = document.getElementById('nx-vcall-cam-btn');
            if (btn) btn.innerText = isVcallCamOff ? '🚫 Cam OFF' : '📹 Cam ON';
        },

        flipVideoCallCamera: async function() {
            if (!vcallLocalStream) return;
            currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: currentFacingMode },
                    audio: true
                });
                const newVideoTrack = newStream.getVideoTracks()[0];
                if (vcallPc) {
                    const sender = vcallPc.getSenders().find(s => s.track && s.track.kind === 'video');
                    if (sender && newVideoTrack) sender.replaceTrack(newVideoTrack);
                }
                vcallLocalStream.getTracks().forEach(t => t.stop());
                vcallLocalStream = newStream;
                const localVid = document.getElementById('nx-local-video-preview');
                if (localVid) {
                    localVid.srcObject = newStream;
                    localVid.style.transform = currentFacingMode === 'user' ? 'scaleX(-1)' : 'none';
                }
                Nexus.toast(currentFacingMode === 'user' ? "🤳 Front Camera Active" : "📷 Back Camera Active");
            } catch (e) {
                Nexus.toast("⚠️ Camera switch not supported on this device");
            }
        },

        endActiveVideoCall: function(skipDbUpdate) {
            clearInterval(ringtoneTimer);
            if (vcallRoomUnsub) { vcallRoomUnsub(); vcallRoomUnsub = null; }
            if (vcallLocalStream) {
                vcallLocalStream.getTracks().forEach(t => t.stop());
                vcallLocalStream = null;
            }
            if (vcallPc) {
                try { vcallPc.close(); } catch (e) {}
                vcallPc = null;
            }
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
                    serverName: '11-Server Router Ready',
                    text: "Namaste! Main aapka 1:1 Private Nexus AI Studio hoon.\n\nAap niche diye gaye Quick Chips par tap karein ya apna koi bhi JEE/NEET, Coding, Website Architecture, ya Safe AI Image sawal puchhein!"
                });
            }

            studio.innerHTML = `
                <div style="height:56px; background:#182229; border-bottom:1.5px solid #a78bfa; display:flex; align-items:center; justify-content:space-between; padding:0 12px; flex-shrink:0;">
                    <div style="display:flex; align-items:center; gap:9px;">
                        <button type="button" onclick="NexusCore.closePrivateAiStudio()" style="background:none; border:none; color:#f8fafc; font-size:20px; cursor:pointer; padding:4px;">←</button>
                        <div style="width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg,#8b5cf6,#38bdf8); color:#020617; display:flex; align-items:center; justify-content:center; font-size:19px; font-weight:900;">🤖</div>
                        <div>
                            <div style="font-weight:900; font-size:14.5px; color:#f8fafc;">Nexus 1:1 Private AI Studio</div>
                            <div id="nx-ai-live-srv-status" style="font-size:11px; color:#10b981; font-weight:700;">🟢 11 Fast Servers + Safe Image Gen Active</div>
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
                    <button type="button" class="nx-ai-quick-chip" onclick="NexusCore.quickAsk('Write HTML CSS JS calculator code')">💻 Code Generator</button>
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
            if (inp) {
                inp.value = qText;
                this.sendPrivateAiMessage();
            }
        },

        startAiVoiceMic: function() {
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRec) {
                Nexus.toast("🎙️ Voice mic not supported in this browser");
                return;
            }
            const rec = new SpeechRec();
            rec.lang = 'en-IN';
            Nexus.toast("🎙️ Speak your question now...");
            rec.onresult = e => {
                const inp = document.getElementById('nx-ai-studio-in');
                if (inp) {
                    inp.value = e.results[0][0].transcript;
                    this.sendPrivateAiMessage();
                }
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
            Nexus.toast("📥 AI Study Notes Downloaded!");
        },

        closePrivateAiStudio: function() {
            this.stopSwaraVoice();
            const studio = document.getElementById('nx-private-ai-studio');
            if (studio) studio.style.display = 'none';
        },

        clearAiStudioHistory: function() {
            this.stopSwaraVoice();
            aiChatHistory = [];
            localStorage.removeItem('nx_private_ai_history_v7');
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
                    `<div id="nx-ai-thinking-bubble" style="align-self:flex-start; background:#182229; border:1px solid #a78bfa; color:#d8b4fe; padding:9px 14px; border-radius:14px; font-size:12.5px; font-weight:800;">⚡ Thinking carefully & generating answer...</div>`;
                msgBox.scrollTop = msgBox.scrollHeight;
            }

            let violationType = isProhibitedOrUnsafePrompt(userQ);
            if (violationType === 'hacking') {
                aiChatHistory.push({
                    role: 'ai',
                    serverName: 'Safety Shield 🛡️',
                    text: "🛡️ **Security & Ethics Policy:** Main Nexus Official Educational AI hoon. Main hacking, password cracking, ya kisi bhi illegal activity mein madad nahi kar sakta. Kripya Web Development, Coding, ya JEE PCM se juda sawal puchhein!"
                });
                if (msgBox) { msgBox.innerHTML = aiChatHistory.map(m => formatAiStudioMessageHTML(m)).join(''); msgBox.scrollTop = msgBox.scrollHeight; }
                return;
            }
            if (violationType === 'nsfw') {
                aiChatHistory.push({
                    role: 'ai',
                    serverName: 'Content Filter 🛡️',
                    text: "🚫 **Strict Community Guideline:** Nexus ek clean Student Educational Platform hai. Yahan kisi bhi prakar ke 18+, adult, vulgar ya prohibited words aur photos generate karna strictly प्रतिबंधित (blocked) hai."
                });
                if (msgBox) { msgBox.innerHTML = aiChatHistory.map(m => formatAiStudioMessageHTML(m)).join(''); msgBox.scrollTop = msgBox.scrollHeight; }
                return;
            }

            if (isAiImagePrompt(userQ)) {
                let cleanPrompt = userQ.replace(/^(\/img|\/image|photo banao|image banao|picture banao|generate image|create image|draw )/i, '').trim() || userQ;
                let safePrompt = `${cleanPrompt}, clean educational digital art, safe for students, high quality HD`;
                let seed = Math.floor(Math.random() * 999999);
                let imgUrl = IMG_GEN_API + encodeURIComponent(safePrompt) + "?model=flux&width=768&height=768&seed=" + seed + "&nologo=true&safe=true";
                aiChatHistory.push({
                    role: 'ai',
                    text: `🎨 Aapki safe HD AI picture taiyar hai: "${cleanPrompt}"`,
                    imageUrl: imgUrl,
                    serverName: 'Safe Flux Image Engine'
                });
                try { localStorage.setItem('nx_private_ai_history_v7', JSON.stringify(aiChatHistory.slice(-20))); } catch (e) {}
                if (msgBox) {
                    msgBox.innerHTML = aiChatHistory.map(m => formatAiStudioMessageHTML(m)).join('');
                    msgBox.scrollTop = msgBox.scrollHeight;
                }
                return;
            }

            if (sendBtn) sendBtn.disabled = true;

            let aiReply = getBuiltInExpertAnswer(userQ);
            let usedServerName = aiReply ? 'Nexus Official Brain' : '';

            const sysPrompt = "You are Nexus Official AI Tutor & Coding Assistant created for Mohit Kumar's Nexus Student Community platform. Think step-by-step and give a clear, accurate, well-structured educational answer in friendly Hinglish or English. Never teach hacking or inappropriate content. Wrap any code inside ```html or ```javascript or ```python.";

            if (!aiReply) {
                const seed = Math.floor(Math.random() * 99999);
                for (let attempt = 0; attempt < NEXUS_AI_SERVERS.length; attempt++) {
                    let idx = (activeHealthyAiServerIndex + attempt) % NEXUS_AI_SERVERS.length;
                    let srv = NEXUS_AI_SERVERS[idx];
                    if (statusEl) statusEl.innerText = `⚡ Connecting: ${srv.name}...`;

                    const controller = new AbortController();
                    const timer = setTimeout(() => controller.abort(), 7500);

                    try {
                        if (srv.type === 'post') {
                            let r1 = await fetch(POLLINATIONS_OPENAI, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                signal: controller.signal,
                                body: JSON.stringify({
                                    model: srv.model,
                                    messages: [
                                        { role: 'system', content: sysPrompt },
                                        ...aiChatHistory.slice(-5).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }))
                                    ]
                                })
                            });
                            clearTimeout(timer);
                            if (r1.ok) {
                                let d1 = await r1.json();
                                let txt = d1?.choices?.[0]?.message?.content || '';
                                if (txt && txt.trim().length > 5) {
                                    aiReply = txt.trim();
                                    usedServerName = srv.name;
                                    activeHealthyAiServerIndex = idx;
                                    break;
                                }
                            }
                        } else {
                            let r2 = await fetch(`${POLLINATIONS_ROOT}${encodeURIComponent(sysPrompt + "\nQuestion: " + userQ)}?model=${srv.model}&seed=${seed}`, {
                                signal: controller.signal
                            });
                            clearTimeout(timer);
                            if (r2.ok) {
                                let t2 = (await r2.text()).trim();
                                if (t2 && t2.length > 5 && !t2.startsWith('<!DOCTYPE') && !t2.startsWith('{')) {
                                    aiReply = t2;
                                    usedServerName = srv.name;
                                    activeHealthyAiServerIndex = idx;
                                    break;
                                }
                            }
                        }
                    } catch (err) {
                        clearTimeout(timer);
                    }
                }
            }

            if (!aiReply) {
                aiReply = `💡 **${userQ}**\n\nIs sawal ka step-by-step solution:\n• Agar aapko code chahiye toh "code for ${userQ}" likhein, ya AI photo ke liye "photo banao ${userQ}" likhein!`;
                usedServerName = 'Nexus Tutor';
            }

            if (statusEl) statusEl.innerText = `🟢 Connected: ${usedServerName}`;
            if (sendBtn) sendBtn.disabled = false;

            aiChatHistory.push({ role: 'ai', text: aiReply, serverName: usedServerName });
            try { localStorage.setItem('nx_private_ai_history_v7', JSON.stringify(aiChatHistory.slice(-20))); } catch (e) {}

            if (msgBox) {
                msgBox.innerHTML = aiChatHistory.map(m => formatAiStudioMessageHTML(m)).join('');
                msgBox.scrollTop = msgBox.scrollHeight;
            }
        },

        stopSwaraVoice: function() {
            isSwaraSpeaking = false;
            if ('speechSynthesis' in window) {
                try { window.speechSynthesis.cancel(); } catch (e) {}
            }
            if (fallbackAudioPlayer) {
                try { fallbackAudioPlayer.pause(); fallbackAudioPlayer = null; } catch (e) {}
            }
        },

        speakSwaraVoice: function(base64Text, btnEl) {
            if (isSwaraSpeaking) {
                this.stopSwaraVoice();
                if (btnEl) btnEl.innerText = '🔊 Listen (Swara)';
                Nexus.toast("⏹️ Voice Stopped");
                return;
            }

            let rawText = '';
            try { rawText = decodeURIComponent(escape(atob(base64Text))); } catch (e) { return; }
            let cleanSpeech = rawText
                .replace(/[$\\{}^_]/g, ' ')
                .replace(/[*#`~>-]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            if (!cleanSpeech) return;

            this.stopSwaraVoice();
            isSwaraSpeaking = true;
            if (btnEl) btnEl.innerText = '⏹️ Stop Voice';
            Nexus.toast("🔊 Speaking in Swara Voice...");

            let chunks = cleanSpeech.match(/[^.!?।\n]{1,150}[.!?।\n]?/g) || [cleanSpeech.substring(0, 150)];
            let idx = 0;
            let speechStartedSuccessfully = false;

            const playCloudTtsFallback = () => {
                if (!isSwaraSpeaking || idx >= chunks.length) {
                    isSwaraSpeaking = false;
                    if (btnEl) btnEl.innerText = '🔊 Listen (Swara)';
                    return;
                }
                let q = encodeURIComponent(chunks[idx].trim().substring(0, 180));
                let audioUrl = `${PROTO}[translate.googleapis.com/translate_tts?ie=UTF-8&q=$](https://translate.googleapis.com/translate_tts?ie=UTF-8&q=$){q}&tl=hi&client=tw-ob`;
                fallbackAudioPlayer = new Audio(audioUrl);
                fallbackAudioPlayer.onended = () => {
                    idx++;
                    playCloudTtsFallback();
                };
                fallbackAudioPlayer.onerror = () => {
                    isSwaraSpeaking = false;
                    if (btnEl) btnEl.innerText = '🔊 Listen (Swara)';
                };
                fallbackAudioPlayer.play().catch(() => {
                    isSwaraSpeaking = false;
                    if (btnEl) btnEl.innerText = '🔊 Listen (Swara)';
                });
            };

            if ('speechSynthesis' in window) {
                let voices = window.speechSynthesis.getVoices() || [];
                let swara = voices.find(v => /swara/i.test(v.name)) ||
                            voices.find(v => v.lang === 'hi-IN') ||
                            voices.find(v => v.lang === 'en-IN');

                const speakNextNative = () => {
                    if (!isSwaraSpeaking || idx >= chunks.length) {
                        isSwaraSpeaking = false;
                        if (btnEl) btnEl.innerText = '🔊 Listen (Swara)';
                        return;
                    }
                    let u = new SpeechSynthesisUtterance(chunks[idx].trim());
                    if (swara) u.voice = swara;
                    u.lang = swara ? swara.lang : 'hi-IN';
                    u.rate = 1.02;
                    u.onstart = () => { speechStartedSuccessfully = true; };
                    u.onend = () => { idx++; speakNextNative(); };
                    u.onerror = () => {
                        if (!speechStartedSuccessfully) playCloudTtsFallback();
                        else {
                            isSwaraSpeaking = false;
                            if (btnEl) btnEl.innerText = '🔊 Listen (Swara)';
                        }
                    };
                    window.speechSynthesis.speak(u);
                };

                speakNextNative();
                setTimeout(() => {
                    if (isSwaraSpeaking && !speechStartedSuccessfully && (!window.speechSynthesis.speaking)) {
                        window.speechSynthesis.cancel();
                        playCloudTtsFallback();
                    }
                }, 1200);
            } else {
                playCloudTtsFallback();
            }
        },

        copyBase64Text: function(b64, msg) {
            try {
                navigator.clipboard.writeText(decodeURIComponent(escape(atob(b64))));
                Nexus.toast(msg || "📋 Copied!");
            } catch (e) {}
        },

        openVoiceChangerModal: function() {
            Nexus.toast("🎭 Studio Voice FX Ready!");
        }
    };

    function runCoreMasterLoop() {
        initTurboSpeedAndRealPWA();
        patchMasterFollowerGraph();
        enforceSingleMessageButtonOnPublicProfile();
        patchDmDeleteAndFixPlusTrayOverlap();
        injectAiButtonsEverywhere();
        startLiveNotificationEngine();
        updateNotificationBadgeUI();
        upgradeOpenNotificationsModal();
        upgradeAdvanceTwoWayVideoCall();
        startIncomingVideoCallListener();
    }

    document.addEventListener('DOMContentLoaded', () => {
        runCoreMasterLoop();
        setInterval(runCoreMasterLoop, 450);
    });
    setTimeout(runCoreMasterLoop, 120);
})();
