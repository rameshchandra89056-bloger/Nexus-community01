/* ============================================================================
   NEXUS OFFICIAL CALL.JS (v1.0 FINAL MASTER — 100% SUPABASE REALTIME + WEBRTC)
   - Separate HD Audio Call UI & HD Video Call UI + Live Screen Share
   - Global Incoming Call Ringing Screen (Polyphonic Ringtone + Vibration)
   - Voice-Not-Sending Fixed (ICE Queue + Dedicated <audio> + Noise Cancel + ICE Restart)
   - Advanced Features: Minimize Pill, Live Ping Meter, Voice Visualizer,
     2-Way Call Recorder, HD Snapshot, Hold/Resume, In-Call Reactions & Mini Chat,
     Quick Decline Message, Busy Detection & Full Call History Log
   ============================================================================ */
(function () {
    if (window.__NEXUS_CALL_ENGINE_V1__) return;
    window.__NEXUS_CALL_ENGINE_V1__ = true;

    const normU = (u) => String(u || "").toLowerCase().replace(/^@/, "").trim();
    const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const getSb = () => (window.NexusSecurity && window.NexusSecurity.sb) || null;

    function getMe() {
        try {
            if (window.Nexus && typeof Nexus.getCurrentUser === "function") {
                const u = Nexus.getCurrentUser();
                if (u && u.username) return u;
            }
            const raw = localStorage.getItem("nx_active_account");
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }

    function toast(msg) {
        if (window.Nexus && typeof Nexus.toast === "function") Nexus.toast(msg);
    }

    // -------------------- STYLES --------------------
    if (!document.getElementById("nx-call-engine-css")) {
        const st = document.createElement("style");
        st.id = "nx-call-engine-css";
        st.textContent = `
            #nx-call-global-overlay,#nx-incoming-call-screen{position:fixed!important;inset:0!important;z-index:325000!important;font-family:system-ui,-apple-system,sans-serif;user-select:none}
            #nx-call-mini-pill{position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:324000;background:linear-gradient(90deg,#065f46,#0f766e);border:1.5px solid #34d399;color:#fff;padding:8px 16px;border-radius:999px;display:flex;align-items:center;gap:10px;box-shadow:0 10px 30px rgba(0,0,0,.75);cursor:pointer;font-size:12.5px;font-weight:900}
            @keyframes nxPulseRing{0%{box-shadow:0 0 0 0 rgba(16,185,129,.7)}70%{box-shadow:0 0 0 32px rgba(16,185,129,0)}100%{box-shadow:0 0 0 0 rgba(16,185,129,0)}}
            .nx-call-pulse{animation:nxPulseRing 1.5s infinite}
            @keyframes nxFloatEmoji{0%{transform:translateY(0) scale(.7);opacity:1}100%{transform:translateY(-220px) scale(1.6);opacity:0}}
            .nx-call-fly-emoji{position:fixed;bottom:130px;font-size:38px;pointer-events:none;z-index:326000;animation:nxFloatEmoji 1.8s ease-out forwards}
            .nx-call-ctrl-btn{width:50px;height:50px;border-radius:50%;background:rgba(30,41,59,.88);border:1px solid #334155;color:#fff;font-size:19px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .12s,background .2s}
            .nx-call-ctrl-btn:active{transform:scale(.92)}
            .nx-call-ctrl-btn.active-on{background:#10b981;color:#020617;border-color:#34d399}
            .nx-call-ctrl-btn.danger-on{background:#e11d48;color:#fff;border-color:#fb7185}
            .nx-viz-bar{width:5px;border-radius:999px;background:linear-gradient(180deg,#38bdf8,#10b981);transition:height .08s ease;min-height:6px}
        `;
        document.head.appendChild(st);
    }

    // -------------------- STATE --------------------
    let inboxRingChannel = null;
    let activeRoomChannel = null;
    let pc = null;
    let localStream = null;
    let remoteStream = null;
    let pendingIce = [];
    let ringTimeout = null;
    let callTimerInt = null;
    let statsTimerInt = null;
    let ringtoneInt = null;
    let vizRaf = null;
    let audioCtx = null;
    let mediaRecorder = null;
    let recordedChunks = [];
    let mixCtx = null;
    let inCallMessages = [];

    const state = {
        active: false,
        minimized: false,
        direction: "outgoing", // outgoing | incoming
        mode: "audio",         // audio | video | screen
        peerId: "",
        peerName: "",
        peerUname: "",
        peerDp: "",
        muted: false,
        camOff: false,
        onHold: false,
        peerOnHold: false,
        speakerOn: true,
        facing: "user",
        blurBg: false,
        recording: false,
        connected: false,
        startedAt: 0,
        pingText: "🟢 HD"
    };

    // -------------------- CALL HISTORY STORAGE --------------------
    function getHistoryKey() {
        const me = getMe();
        return "nx_call_history_v1_" + normU((me && me.username) || "guest");
    }

    function saveCallLog(entry) {
        try {
            const arr = JSON.parse(localStorage.getItem(getHistoryKey()) || "[]");
            arr.unshift(Object.assign({ at: Date.now() }, entry));
            localStorage.setItem(getHistoryKey(), JSON.stringify(arr.slice(0, 60)));
        } catch (e) {}
    }

    // -------------------- AUDIO ENGINE (RINGTONE + DIAL TONE + BEEP) --------------------
    function getAudioCtx() {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        if (!audioCtx) audioCtx = new Ctx();
        if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
        return audioCtx;
    }

    function playTone(f1, f2, durMs, vol = 0.14) {
        try {
            const ctx = getAudioCtx();
            if (!ctx) return;
            const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g = ctx.createGain();
            o1.type = "sine"; o2.type = "triangle";
            o1.frequency.value = f1; o2.frequency.value = f2;
            g.gain.setValueAtTime(vol, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durMs / 1000);
            o1.connect(g); o2.connect(g); g.connect(ctx.destination);
            o1.start(); o2.start();
            o1.stop(ctx.currentTime + durMs / 1000);
            o2.stop(ctx.currentTime + durMs / 1000);
        } catch (e) {}
    }

    function startIncomingRingtone() {
        stopAllTones();
        const melody = () => {
            playTone(523.25, 659.25, 320, 0.18);
            setTimeout(() => playTone(659.25, 783.99, 320, 0.18), 360);
            setTimeout(() => playTone(783.99, 1046.5, 420, 0.16), 720);
            try { if (navigator.vibrate) navigator.vibrate([450, 220, 450]); } catch (e) {}
        };
        melody();
        ringtoneInt = setInterval(melody, 2400);
    }

    function startOutgoingRingback() {
        stopAllTones();
        const beep = () => playTone(440, 480, 650, 0.08);
        beep();
        ringtoneInt = setInterval(beep, 2800);
    }

    function stopAllTones() {
        if (ringtoneInt) { clearInterval(ringtoneInt); ringtoneInt = null; }
        try { if (navigator.vibrate) navigator.vibrate(0); } catch (e) {}
    }

    // -------------------- HARDWARE CLEANUP --------------------
    window.forceReleaseAllMicAndCamera = function () {
        if (localStream) {
            localStream.getTracks().forEach((t) => { try { t.enabled = false; t.stop(); } catch (e) {} });
            localStream = null;
        }
    };

    function stopCallRecording(downloadFile) {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.onstop = () => {
                if (downloadFile && recordedChunks.length) {
                    const blob = new Blob(recordedChunks, { type: "audio/webm" });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(blob);
                    a.download = `Nexus_Call_${state.peerUname || "rec"}_${Date.now()}.webm`;
                    a.click();
                    toast("💾 Call Recording Saved!");
                }
                recordedChunks = [];
            };
            try { mediaRecorder.stop(); } catch (e) {}
        }
        if (mixCtx) { try { mixCtx.close(); } catch (e) {} mixCtx = null; }
        mediaRecorder = null;
        state.recording = false;
    }

    function endCallCleanup(sendSignal, reasonLabel) {
        stopAllTones();
        clearTimeout(ringTimeout); ringTimeout = null;
        clearInterval(callTimerInt); callTimerInt = null;
        clearInterval(statsTimerInt); statsTimerInt = null;
        if (vizRaf) { cancelAnimationFrame(vizRaf); vizRaf = null; }
        if (state.recording) stopCallRecording(true);

        if (state.active) {
            const durSec = state.startedAt ? Math.max(1, Math.floor((Date.now() - state.startedAt) / 1000)) : 0;
            saveCallLog({
                peerUname: state.peerUname,
                peerName: state.peerName,
                peerDp: state.peerDp,
                mode: state.mode,
                direction: state.direction,
                status: state.connected ? "answered" : (reasonLabel || "missed"),
                durationSec: durSec
            });
        }

        const me = getMe();
        if (sendSignal && activeRoomChannel && me) {
            activeRoomChannel.send({ type: "broadcast", event: "call_end", payload: { by: me.id, reason: reasonLabel || "ended" } }).catch(() => {});
        }
        if (pc) { try { pc.close(); } catch (e) {} pc = null; }
        window.forceReleaseAllMicAndCamera();
        remoteStream = null;
        pendingIce = [];
        inCallMessages = [];
        if (activeRoomChannel && getSb()) {
            try { getSb().removeChannel(activeRoomChannel); } catch (e) {}
            activeRoomChannel = null;
        }

        state.active = false;
        state.minimized = false;
        state.connected = false;
        state.startedAt = 0;
        state.onHold = false;
        state.peerOnHold = false;

        document.getElementById("nx-call-global-overlay")?.remove();
        document.getElementById("nx-incoming-call-screen")?.remove();
        document.getElementById("nx-call-mini-pill")?.remove();
        document.getElementById("nx-call-remote-audio")?.remove();
        document.getElementById("nx-incall-chat-drawer")?.remove();
    }

    // -------------------- REMOTE AUDIO/VIDEO ATTACH + VISUALIZER --------------------
    function attachRemoteMedia(stream) {
        remoteStream = stream;
        let aud = document.getElementById("nx-call-remote-audio");
        if (!aud) {
            aud = document.createElement("audio");
            aud.id = "nx-call-remote-audio";
            aud.autoplay = true;
            aud.playsInline = true;
            document.body.appendChild(aud);
        }
        aud.volume = state.speakerOn ? 1.0 : 0.35;
        aud.srcObject = stream;
        aud.play().catch(() => {
            // Auto-retry playback on next user tap if browser blocked autoplay
            const unlock = () => { aud.play().catch(() => {}); document.removeEventListener("click", unlock); };
            document.addEventListener("click", unlock, { once: true });
        });

        const rv = document.getElementById("nx-call-remote-vid");
        if (rv) {
            rv.srcObject = stream;
            rv.play().catch(() => {});
        }
        startVoiceVisualizer();
    }

    function startVoiceVisualizer() {
        if (vizRaf) cancelAnimationFrame(vizRaf);
        const bars = document.querySelectorAll(".nx-viz-bar");
        if (!bars.length) return;
        const srcStream = (remoteStream && remoteStream.getAudioTracks().length) ? remoteStream : localStream;
        if (!srcStream) return;
        try {
            const ctx = getAudioCtx();
            if (!ctx) return;
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 32;
            const src = ctx.createMediaStreamSource(srcStream);
            src.connect(analyser);
            const data = new Uint8Array(analyser.frequencyBinCount);
            const loop = () => {
                if (!state.active || state.mode !== "audio") return;
                analyser.getByteFrequencyData(data);
                bars.forEach((b, i) => {
                    const val = data[i % data.length] || 10;
                    b.style.height = Math.max(6, Math.min(34, Math.round(val / 7))) + "px";
                });
                vizRaf = requestAnimationFrame(loop);
            };
            loop();
        } catch (e) {}
    }

    // -------------------- LIVE PING / NETWORK QUALITY METER --------------------
    function startStatsMonitor() {
        clearInterval(statsTimerInt);
        statsTimerInt = setInterval(async () => {
            if (!pc || pc.connectionState !== "connected") return;
            try {
                const stats = await pc.getStats();
                let rttMs = null;
                stats.forEach((rep) => {
                    if (rep.type === "candidate-pair" && rep.state === "succeeded" && rep.currentRoundTripTime != null) {
                        rttMs = Math.round(rep.currentRoundTripTime * 1000);
                    }
                });
                if (rttMs !== null) {
                    state.pingText = rttMs < 110 ? `🟢 HD ${rttMs}ms` : rttMs < 260 ? `🟡 ${rttMs}ms` : `🔴 Weak ${rttMs}ms`;
                    const el = document.getElementById("nx-call-ping-badge");
                    if (el) el.textContent = state.pingText;
                }
            } catch (e) {}
        }, 2500);
    }

    // -------------------- WEBRTC PEER CONNECTION (WITH ICE QUEUE + RESTART) --------------------
    function createPeerConnection(roomCh, myId) {
        const peerConn = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                { urls: "stun:stun2.l.google.com:19302" },
                { urls: "stun:stun3.l.google.com:19302" },
                { urls: "stun:stun.cloudflare.com:3478" }
            ],
            iceCandidatePoolSize: 8
        });

        peerConn.ontrack = (ev) => {
            if (ev.streams && ev.streams[0]) {
                attachRemoteMedia(ev.streams[0]);
            } else {
                if (!remoteStream) remoteStream = new MediaStream();
                remoteStream.addTrack(ev.track);
                attachRemoteMedia(remoteStream);
            }
        };

        peerConn.onicecandidate = (ev) => {
            if (ev.candidate && roomCh) {
                roomCh.send({ type: "broadcast", event: "call_ice", payload: { by: myId, cand: ev.candidate } });
            }
        };

        peerConn.oniceconnectionstatechange = async () => {
            if (peerConn.iceConnectionState === "failed" && state.direction === "outgoing" && roomCh) {
                try {
                    const offer = await peerConn.createOffer({ iceRestart: true });
                    await peerConn.setLocalDescription(offer);
                    roomCh.send({ type: "broadcast", event: "call_reoffer", payload: { by: myId, offer } });
                } catch (e) {}
            }
        };

        peerConn.onconnectionstatechange = () => {
            if (peerConn.connectionState === "connected") {
                stopAllTones();
                clearTimeout(ringTimeout);
                state.connected = true;
                if (!state.startedAt) {
                    state.startedAt = Date.now();
                    startStatsMonitor();
                    clearInterval(callTimerInt);
                    callTimerInt = setInterval(updateDurationLabels, 1000);
                }
                updateDurationLabels();
            } else if (peerConn.connectionState === "disconnected") {
                setCallStatus("🟡 Reconnecting...");
            }
        };

        return peerConn;
    }

    async function flushIceQueue() {
        if (!pc || !pc.remoteDescription) return;
        while (pendingIce.length > 0) {
            const cand = pendingIce.shift();
            try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (e) {}
        }
    }

    function fmtDuration(sec) {
        const m = String(Math.floor(sec / 60)).padStart(2, "0");
        const s = String(sec % 60).padStart(2, "0");
        return `${m}:${s}`;
    }

    function setCallStatus(text) {
        const el = document.getElementById("nx-call-status-lbl");
        if (el) el.textContent = text;
        const pill = document.getElementById("nx-call-pill-time");
        if (pill) pill.textContent = text;
    }

    function updateDurationLabels() {
        if (!state.startedAt) return;
        const sec = Math.floor((Date.now() - state.startedAt) / 1000);
        const prefix = state.onHold ? "⏸️ On Hold" : state.peerOnHold ? "⏸️ Partner on Hold" : "🟢 Connected";
        setCallStatus(`${prefix} • ${fmtDuration(sec)}`);
    }

    // -------------------- FLYING REACTIONS & IN-CALL MINI CHAT --------------------
    function spawnFlyingEmoji(emoji) {
        const el = document.createElement("div");
        el.className = "nx-call-fly-emoji";
        el.textContent = emoji;
        el.style.left = (20 + Math.random() * 60) + "%";
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1850);
    }

    function openInCallChatDrawer() {
        document.getElementById("nx-incall-chat-drawer")?.remove();
        const d = document.createElement("div");
        d.id = "nx-incall-chat-drawer";
        d.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,.78);z-index:326500;display:flex;align-items:flex-end;justify-content:center;";
        const renderChat = () => {
            d.innerHTML = `<div style="background:#0f172a;border-top:1.5px solid #10b981;border-radius:22px 22px 0 0;width:100%;max-width:520px;padding:14px;color:#fff;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <b style="color:#34d399;font-size:14px;">💬 In-Call Live Chat</b>
                    <button type="button" id="nx-ic-x" style="background:#1e293b;border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;">✕</button>
                </div>
                <div id="nx-ic-list" style="height:210px;overflow-y:auto;display:flex;flex-direction:column;gap:7px;margin-bottom:10px;padding-right:4px;">
                    ${inCallMessages.length ? inCallMessages.map((m) => `<div style="align-self:${m.mine ? "flex-end" : "flex-start"};background:${m.mine ? "#065f46" : "#1e293b"};padding:7px 11px;border-radius:12px;max-width:82%;font-size:12.5px;"><b style="font-size:10px;color:#5eead4;">${esc(m.sender)}</b><div>${esc(m.text)}</div></div>`).join("") : `<div style="text-align:center;color:#64748b;margin:auto;font-size:12px;">Send links, formulas ya quick notes during call!</div>`}
                </div>
                <div style="display:flex;gap:7px;">
                    <input id="nx-ic-in" placeholder="Type quick message..." style="flex:1;padding:10px 12px;border-radius:11px;background:#090d16;border:1px solid #334155;color:#fff;font-size:13px;outline:none;">
                    <button type="button" id="nx-ic-go" style="padding:10px 15px;border-radius:11px;background:#10b981;color:#020617;font-weight:900;border:none;cursor:pointer;">Send</button>
                </div>
            </div>`;
            d.querySelector("#nx-ic-x").onclick = () => d.remove();
            const sendFn = () => {
                const inp = d.querySelector("#nx-ic-in");
                const txt = (inp && inp.value || "").trim();
                if (!txt || !activeRoomChannel) return;
                const me = getMe();
                const entry = { sender: (me && me.name) || "Me", text: txt, mine: true };
                inCallMessages.push(entry);
                activeRoomChannel.send({ type: "broadcast", event: "call_chat", payload: { by: me && me.id, sender: entry.sender, text: txt } });
                renderChat();
            };
            d.querySelector("#nx-ic-go").onclick = sendFn;
            d.querySelector("#nx-ic-in").onkeydown = (e) => { if (e.key === "Enter") sendFn(); };
            const listEl = d.querySelector("#nx-ic-list");
            if (listEl) listEl.scrollTop = listEl.scrollHeight;
        };
        d.onclick = (e) => { if (e.target === d) d.remove(); };
        renderChat();
        document.body.appendChild(d);
    }

    // -------------------- 2-WAY CALL RECORDER & HD SNAPSHOT --------------------
    function toggleCallRecording() {
        if (state.recording) {
            stopCallRecording(true);
            renderActiveCallUI();
            return;
        }
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            mixCtx = new Ctx();
            const dest = mixCtx.createMediaStreamDestination();
            if (localStream && localStream.getAudioTracks().length) {
                mixCtx.createMediaStreamSource(localStream).connect(dest);
            }
            if (remoteStream && remoteStream.getAudioTracks().length) {
                mixCtx.createMediaStreamSource(remoteStream).connect(dest);
            }
            recordedChunks = [];
            mediaRecorder = new MediaRecorder(dest.stream);
            mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordedChunks.push(e.data); };
            mediaRecorder.start();
            state.recording = true;
            toast("🔴 2-Way Call Recording Started!");
            renderActiveCallUI();
        } catch (e) {
            toast("❌ Recording supported nahi hai is browser mein.");
        }
    }

    function takeVideoSnapshot() {
        const rv = document.getElementById("nx-call-remote-vid");
        if (!rv || !rv.videoWidth) return toast("⚠️ Remote video ready hone dein!");
        const c = document.createElement("canvas");
        c.width = rv.videoWidth; c.height = rv.videoHeight;
        c.getContext("2d").drawImage(rv, 0, 0);
        const a = document.createElement("a");
        a.href = c.toDataURL("image/png");
        a.download = `Nexus_Snap_${Date.now()}.png`;
        a.click();
        toast("📸 HD Snapshot Saved!");
    }

    // -------------------- MINIMIZE TO FLOATING PILL --------------------
    function setMinimized(min) {
        state.minimized = Boolean(min);
        const ov = document.getElementById("nx-call-global-overlay");
        document.getElementById("nx-call-mini-pill")?.remove();
        if (state.minimized) {
            if (ov) ov.style.display = "none";
            const pill = document.createElement("div");
            pill.id = "nx-call-mini-pill";
            pill.innerHTML = `<span>${state.mode === "audio" ? "📞" : "📹"} ${esc(state.peerName)}</span><span id="nx-call-pill-time" style="color:#a7f3d0;">${state.connected ? fmtDuration(Math.floor((Date.now() - state.startedAt) / 1000)) : "Active"}</span><span style="background:rgba(255,255,255,.18);padding:2px 8px;border-radius:99px;font-size:10.5px;">Open ↗</span>`;
            pill.onclick = () => setMinimized(false);
            document.body.appendChild(pill);
        } else {
            if (ov) ov.style.display = "flex";
        }
    }

    // -------------------- DISTINCT AUDIO & VIDEO ACTIVE CALL UI --------------------
    function renderActiveCallUI(initialStatus) {
        const prevStatus = document.getElementById("nx-call-status-lbl")?.textContent || initialStatus || (state.connected ? "🟢 Connected" : "🔔 Ringing...");
        document.getElementById("nx-call-global-overlay")?.remove();
        const isVideo = state.mode === "video" || state.mode === "screen";
        const av = state.peerDp
            ? `<img src="${esc(state.peerDp)}" class="nx-call-pulse" style="width:128px;height:128px;border-radius:50%;object-fit:cover;border:3px solid #10b981;">`
            : `<div class="nx-call-pulse" style="width:128px;height:128px;border-radius:50%;background:linear-gradient(135deg,#10b981,#0284c7);color:#020617;font-size:48px;font-weight:900;display:flex;align-items:center;justify-content:center;border:3px solid #34d399;">${esc((state.peerName || "U")[0].toUpperCase())}</div>`;

        const ov = document.createElement("div");
        ov.id = "nx-call-global-overlay";
        ov.style.cssText = isVideo
            ? "display:flex;flex-direction:column;justify-content:space-between;background:#020617;color:#fff;"
            : "display:flex;flex-direction:column;justify-content:space-between;align-items:center;padding:24px 16px 26px;background:radial-gradient(circle at top,#064e3b,#020617 72%);color:#fff;";

        const reactionStrip = `<div style="display:flex;justify-content:center;gap:12px;margin-bottom:10px;">${["❤️", "😂", "🔥", "👏", "👍"].map((em) => `<button type="button" data-creact="${em}" style="background:rgba(15,23,42,.75);border:1px solid #334155;border-radius:999px;padding:5px 10px;font-size:17px;cursor:pointer;">${em}</button>`).join("")}</div>`;

        if (isVideo) {
            ov.innerHTML = `
                <div style="position:relative;flex:1;width:100%;background:#000;overflow:hidden;">
                    <video id="nx-call-remote-vid" autoplay playsinline style="width:100%;height:100%;object-fit:cover;"></video>
                    <div style="position:absolute;top:14px;left:12px;right:12px;display:flex;justify-content:space-between;align-items:flex-start;z-index:6;">
                        <div style="background:rgba(2,6,23,.76);padding:7px 12px;border-radius:16px;border:1px solid rgba(56,189,248,.4);backdrop-filter:blur(6px);">
                            <div style="font-size:13.5px;font-weight:900;">📹 ${esc(state.peerName)} ${state.recording ? '<span style="color:#f43f5e;">● REC</span>' : ""}</div>
                            <div style="display:flex;align-items:center;gap:8px;margin-top:2px;">
                                <span id="nx-call-status-lbl" style="font-size:11px;color:#38bdf8;font-weight:800;">${esc(prevStatus)}</span>
                                <span id="nx-call-ping-badge" style="font-size:10px;background:#0f172a;padding:1px 6px;border-radius:99px;color:#34d399;">${esc(state.pingText)}</span>
                            </div>
                        </div>
                        <div style="display:flex;gap:7px;">
                            <button type="button" id="nx-c-min" class="nx-call-ctrl-btn" style="width:38px;height:38px;font-size:15px;" title="Minimize">↘</button>
                            <button type="button" id="nx-c-snap" class="nx-call-ctrl-btn" style="width:38px;height:38px;font-size:16px;" title="HD Snapshot">📸</button>
                            <button type="button" id="nx-c-flip" class="nx-call-ctrl-btn" style="width:38px;height:38px;font-size:16px;" title="Flip Camera">🔄</button>
                        </div>
                    </div>
                    <video id="nx-call-local-vid" autoplay playsinline muted style="position:absolute;bottom:14px;right:12px;width:102px;height:144px;border-radius:16px;background:#0f172a;border:2px solid #10b981;object-fit:cover;z-index:6;box-shadow:0 12px 30px rgba(0,0,0,.85);${state.blurBg ? "filter:contrast(1.1) saturate(1.2);" : ""}"></video>
                    <div style="position:absolute;bottom:14px;left:12px;z-index:6;">${reactionStrip}</div>
                </div>
                <div style="background:#0b1120;border-top:1px solid #1e293b;padding:14px 10px 22px;display:flex;justify-content:space-around;align-items:center;flex-wrap:wrap;gap:6px;">
                    <button type="button" id="nx-c-mute" class="nx-call-ctrl-btn ${state.muted ? "danger-on" : ""}" title="Mute">${state.muted ? "🔇" : "🎤"}</button>
                    <button type="button" id="nx-c-cam" class="nx-call-ctrl-btn ${state.camOff ? "danger-on" : ""}" title="Camera">${state.camOff ? "🚫" : "📷"}</button>
                    <button type="button" id="nx-c-scr" class="nx-call-ctrl-btn" title="Screen Share">🖥️</button>
                    <button type="button" id="nx-c-rec" class="nx-call-ctrl-btn ${state.recording ? "danger-on" : ""}" title="Record Call">⏺️</button>
                    <button type="button" id="nx-c-chat" class="nx-call-ctrl-btn" title="In-Call Chat">💬</button>
                    <button type="button" id="nx-c-end" class="nx-call-ctrl-btn danger-on" style="width:56px;height:56px;font-size:22px;" title="End Call">📵</button>
                </div>
            `;
        } else {
            ov.innerHTML = `
                <div style="width:100%;max-width:420px;display:flex;justify-content:space-between;align-items:center;">
                    <button type="button" id="nx-c-min" style="background:rgba(15,23,42,.8);border:1px solid #334155;color:#cbd5e1;padding:6px 12px;border-radius:999px;font-size:11.5px;font-weight:800;cursor:pointer;">↘ Minimize</button>
                    <span id="nx-call-ping-badge" style="font-size:11px;background:rgba(15,23,42,.85);border:1px solid #10b981;color:#34d399;padding:4px 10px;border-radius:999px;font-weight:800;">${esc(state.pingText)}</span>
                    <button type="button" id="nx-c-chat" style="background:rgba(15,23,42,.8);border:1px solid #334155;color:#38bdf8;padding:6px 12px;border-radius:999px;font-size:11.5px;font-weight:800;cursor:pointer;">💬 Chat</button>
                </div>

                <div style="text-align:center;margin-top:6px;">
                    <div style="display:inline-block;padding:4px 12px;border-radius:999px;background:rgba(16,185,129,.18);border:1px solid #10b981;color:#34d399;font-size:11px;font-weight:900;margin-bottom:8px;">🔐 NEXUS HD VOICE CALL ${state.recording ? "• 🔴 REC" : ""}</div>
                    <h2 style="font-size:24px;font-weight:900;">${esc(state.peerName)}</h2>
                    <div id="nx-call-status-lbl" style="font-size:13.5px;color:#34d399;font-weight:800;margin-top:4px;">${esc(prevStatus)}</div>
                </div>

                <div style="display:flex;flex-direction:column;align-items:center;gap:16px;">
                    ${av}
                    <div style="display:flex;align-items:center;justify-content:center;gap:5px;height:36px;">
                        <div class="nx-viz-bar"></div><div class="nx-viz-bar"></div><div class="nx-viz-bar"></div>
                        <div class="nx-viz-bar"></div><div class="nx-viz-bar"></div><div class="nx-viz-bar"></div><div class="nx-viz-bar"></div>
                    </div>
                    <div style="font-size:12px;color:#94a3b8;">@${esc(state.peerUname)} • Opus Clear Audio</div>
                </div>

                <div style="width:100%;max-width:360px;">
                    ${reactionStrip}
                    <div style="background:rgba(15,23,42,.92);border:1px solid #1e293b;border-radius:26px;padding:14px 10px;display:grid;grid-template-columns:repeat(3,1fr);gap:12px;justify-items:center;">
                        <button type="button" id="nx-c-mute" class="nx-call-ctrl-btn ${state.muted ? "danger-on" : ""}" title="Mute">${state.muted ? "🔇" : "🎤"}</button>
                        <button type="button" id="nx-c-spk" class="nx-call-ctrl-btn ${state.speakerOn ? "active-on" : ""}" title="Speaker">🔊</button>
                        <button type="button" id="nx-c-hold" class="nx-call-ctrl-btn ${state.onHold ? "active-on" : ""}" title="Hold Call">⏸️</button>
                        <button type="button" id="nx-c-rec" class="nx-call-ctrl-btn ${state.recording ? "danger-on" : ""}" title="Record Call">⏺️</button>
                        <button type="button" id="nx-c-tovid" class="nx-call-ctrl-btn" style="color:#38bdf8;" title="Switch to Video">📹</button>
                        <button type="button" id="nx-c-end" class="nx-call-ctrl-btn danger-on" title="End Call">📵</button>
                    </div>
                </div>
            `;
        }

        document.body.appendChild(ov);
        if (state.minimized) ov.style.display = "none";

        if (isVideo && localStream) { const lv = ov.querySelector("#nx-call-local-vid"); if (lv) lv.srcObject = localStream; }
        if (isVideo && remoteStream) { const rv = ov.querySelector("#nx-call-remote-vid"); if (rv) { rv.srcObject = remoteStream; rv.play().catch(() => {}); } }
        if (!isVideo) startVoiceVisualizer();

        ov.querySelector("#nx-c-end").onclick = () => endCallCleanup(true, "ended");
        ov.querySelector("#nx-c-min").onclick = () => setMinimized(true);
        ov.querySelector("#nx-c-chat").onclick = openInCallChatDrawer;
        ov.querySelector("#nx-c-rec").onclick = toggleCallRecording;

        ov.querySelectorAll("[data-creact]").forEach((b) => {
            b.onclick = () => {
                const em = b.getAttribute("data-creact");
                spawnFlyingEmoji(em);
                if (activeRoomChannel) activeRoomChannel.send({ type: "broadcast", event: "call_react", payload: { by: getMe()?.id, emoji: em } });
            };
        });

        ov.querySelector("#nx-c-mute").onclick = () => {
            state.muted = !state.muted;
            if (localStream) localStream.getAudioTracks().forEach((t) => { t.enabled = !state.muted && !state.onHold; });
            renderActiveCallUI();
        };

        const holdBtn = ov.querySelector("#nx-c-hold");
        if (holdBtn) {
            holdBtn.onclick = () => {
                state.onHold = !state.onHold;
                if (localStream) localStream.getAudioTracks().forEach((t) => { t.enabled = !state.onHold && !state.muted; });
                if (activeRoomChannel) activeRoomChannel.send({ type: "broadcast", event: "call_hold", payload: { by: getMe()?.id, hold: state.onHold } });
                updateDurationLabels();
                renderActiveCallUI();
            };
        }

        const spkBtn = ov.querySelector("#nx-c-spk");
        if (spkBtn) {
            spkBtn.onclick = () => {
                state.speakerOn = !state.speakerOn;
                const aud = document.getElementById("nx-call-remote-audio");
                if (aud) aud.volume = state.speakerOn ? 1.0 : 0.35;
                toast(state.speakerOn ? "🔊 Loud Speaker On" : "🔈 Soft Earpiece Mode");
                renderActiveCallUI();
            };
        }

        const toVid = ov.querySelector("#nx-c-tovid");
        if (toVid) {
            toVid.onclick = () => {
                const targetU = state.peerUname;
                endCallCleanup(true, "upgraded");
                setTimeout(() => window.startNexusRealCall("video", targetU), 350);
            };
        }

        const camBtn = ov.querySelector("#nx-c-cam");
        if (camBtn) {
            camBtn.onclick = () => {
                state.camOff = !state.camOff;
                if (localStream) localStream.getVideoTracks().forEach((t) => { t.enabled = !state.camOff; });
                renderActiveCallUI();
            };
        }

        const snapBtn = ov.querySelector("#nx-c-snap");
        if (snapBtn) snapBtn.onclick = takeVideoSnapshot;

        const flipBtn = ov.querySelector("#nx-c-flip");
        if (flipBtn) {
            flipBtn.onclick = async () => {
                state.facing = state.facing === "user" ? "environment" : "user";
                try {
                    const ns = await navigator.mediaDevices.getUserMedia({ video: { facingMode: state.facing } });
                    const track = ns.getVideoTracks()[0];
                    const sender = pc && pc.getSenders().find((s) => s.track && s.track.kind === "video");
                    if (sender && track) await sender.replaceTrack(track);
                    if (localStream) { localStream.getVideoTracks().forEach((t) => t.stop()); localStream.addTrack(track); }
                    const lv = document.getElementById("nx-call-local-vid"); if (lv) lv.srcObject = localStream;
                } catch (e) { toast("⚠️ Camera flip unsupported on this device"); }
            };
        }

        const scrBtn = ov.querySelector("#nx-c-scr");
        if (scrBtn) {
            scrBtn.onclick = async () => {
                try {
                    const ss = await navigator.mediaDevices.getDisplayMedia({ video: true });
                    const st = ss.getVideoTracks()[0];
                    const sender = pc && pc.getSenders().find((s) => s.track && s.track.kind === "video");
                    if (sender && st) await sender.replaceTrack(st);
                    toast("🖥️ Live Screen Sharing Active!");
                } catch (e) { toast("❌ Screen Share cancelled"); }
            };
        }
    }

    // -------------------- ROOM SIGNALING EVENTS --------------------
    function attachCommonRoomEvents(roomCh, myId) {
        roomCh
            .on("broadcast", { event: "call_ice" }, async ({ payload: p }) => {
                if (!p || p.by === myId || !p.cand) return;
                if (pc && pc.remoteDescription) { try { await pc.addIceCandidate(new RTCIceCandidate(p.cand)); } catch (e) {} }
                else pendingIce.push(p.cand);
            })
            .on("broadcast", { event: "call_reoffer" }, async ({ payload: p }) => {
                if (!p || p.by === myId || !p.offer || !pc) return;
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(p.offer));
                    const ans = await pc.createAnswer();
                    await pc.setLocalDescription(ans);
                    roomCh.send({ type: "broadcast", event: "call_answer", payload: { by: myId, answer: ans } });
                } catch (e) {}
            })
            .on("broadcast", { event: "call_react" }, ({ payload: p }) => { if (p && p.by !== myId && p.emoji) spawnFlyingEmoji(p.emoji); })
            .on("broadcast", { event: "call_hold" }, ({ payload: p }) => { if (p && p.by !== myId) { state.peerOnHold = Boolean(p.hold); updateDurationLabels(); } })
            .on("broadcast", { event: "call_chat" }, ({ payload: p }) => {
                if (!p || p.by === myId || !p.text) return;
                inCallMessages.push({ sender: p.sender || state.peerName, text: p.text, mine: false });
                toast(`💬 ${p.sender || state.peerName}: ${p.text.slice(0, 40)}`);
                if (document.getElementById("nx-incall-chat-drawer")) openInCallChatDrawer();
            })
            .on("broadcast", { event: "call_end" }, ({ payload: p }) => {
                if (p && p.by !== myId) {
                    toast("📵 Call Ended");
                    endCallCleanup(false, "ended");
                }
            });
    }

    // -------------------- GLOBAL INCOMING CALL SCREEN --------------------
    function showIncomingCallScreen(payload) {
        const me = getMe(), sb = getSb();
        if (!me || !sb) return;
        if (state.active || document.getElementById("nx-incoming-call-screen")) {
            // Send busy signal back to caller
            const bCh = sb.channel(payload.callRoom);
            bCh.subscribe((st) => {
                if (st === "SUBSCRIBED") {
                    bCh.send({ type: "broadcast", event: "call_busy", payload: { by: me.id } });
                    setTimeout(() => sb.removeChannel(bCh), 600);
                }
            });
            return;
        }

        startIncomingRingtone();
        const isVideo = payload.mode === "video" || payload.mode === "screen";
        const av = payload.fromDp
            ? `<img src="${esc(payload.fromDp)}" class="nx-call-pulse" style="width:124px;height:124px;border-radius:50%;object-fit:cover;border:3px solid ${isVideo ? "#38bdf8" : "#10b981"};">`
            : `<div class="nx-call-pulse" style="width:124px;height:124px;border-radius:50%;background:linear-gradient(135deg,${isVideo ? "#0284c7,#6366f1" : "#10b981,#06b6d4"});color:#020617;font-size:48px;font-weight:900;display:flex;align-items:center;justify-content:center;">${esc((payload.fromName || "U")[0].toUpperCase())}</div>`;

        const sc = document.createElement("div");
        sc.id = "nx-incoming-call-screen";
        sc.style.cssText = `background:radial-gradient(circle at top,${isVideo ? "#1e1b4b" : "#064e3b"},#020617 75%);display:flex;flex-direction:column;justify-content:space-between;align-items:center;padding:44px 20px 38px;color:#fff;`;
        sc.innerHTML = `
            <div style="text-align:center;">
                <div style="display:inline-block;padding:6px 16px;border-radius:999px;background:${isVideo ? "rgba(56,189,248,.2)" : "rgba(16,185,129,.2)"};border:1.5px solid ${isVideo ? "#38bdf8" : "#10b981"};color:${isVideo ? "#7dd3fc" : "#6ee7b7"};font-size:12.5px;font-weight:900;margin-bottom:14px;">
                    ${isVideo ? "📹 INCOMING HD VIDEO CALL" : "📞 INCOMING HD VOICE CALL"}
                </div>
                <h2 style="font-size:26px;font-weight:900;">${esc(payload.fromName || payload.fromUname)}</h2>
                <div style="font-size:13px;color:#94a3b8;margin-top:4px;">@${esc(payload.fromUname || "")} is calling you on Nexus...</div>
            </div>
            ${av}
            <div style="width:100%;max-width:330px;display:flex;flex-direction:column;gap:18px;align-items:center;">
                <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">
                    <button type="button" data-qmsg="Busy hoon, baad mein call karta hoon" style="padding:6px 12px;border-radius:999px;background:rgba(15,23,42,.85);border:1px solid #334155;color:#cbd5e1;font-size:11.5px;font-weight:700;cursor:pointer;">💬 Busy hoon, baad mein</button>
                    <button type="button" data-qmsg="Class mein hoon, message karo" style="padding:6px 12px;border-radius:999px;background:rgba(15,23,42,.85);border:1px solid #334155;color:#cbd5e1;font-size:11.5px;font-weight:700;cursor:pointer;">📚 Class mein hoon</button>
                </div>
                <div style="display:flex;justify-content:space-around;width:100%;">
                    <button type="button" id="nx-inc-dec" style="width:68px;height:68px;border-radius:50%;background:#e11d48;border:none;color:#fff;font-size:26px;cursor:pointer;box-shadow:0 10px 30px rgba(225,29,72,.55);">📵</button>
                    <button type="button" id="nx-inc-acc" style="width:68px;height:68px;border-radius:50%;background:#10b981;border:none;color:#020617;font-size:26px;font-weight:900;cursor:pointer;box-shadow:0 10px 30px rgba(16,185,129,.55);">${isVideo ? "📹" : "📞"}</button>
                </div>
            </div>
        `;
        document.body.appendChild(sc);

        const declineWithReason = (quickMsg) => {
            stopAllTones(); clearTimeout(ringTimeout); sc.remove();
            saveCallLog({ peerUname: payload.fromUname, peerName: payload.fromName, peerDp: payload.fromDp, mode: payload.mode, direction: "incoming", status: "declined", durationSec: 0 });
            const tmp = sb.channel(payload.callRoom);
            tmp.subscribe((st) => {
                if (st === "SUBSCRIBED") {
                    tmp.send({ type: "broadcast", event: "call_declined", payload: { by: me.id, quickMsg: quickMsg || "" } });
                    setTimeout(() => sb.removeChannel(tmp), 600);
                }
            });
        };

        ringTimeout = setTimeout(() => {
            if (document.getElementById("nx-incoming-call-screen")) {
                stopAllTones(); sc.remove();
                saveCallLog({ peerUname: payload.fromUname, peerName: payload.fromName, peerDp: payload.fromDp, mode: payload.mode, direction: "incoming", status: "missed", durationSec: 0 });
                toast(`📵 Missed ${isVideo ? "Video" : "Voice"} Call from ${payload.fromName}`);
            }
        }, 45000);

        sc.querySelector("#nx-inc-dec").onclick = () => declineWithReason("");
        sc.querySelectorAll("[data-qmsg]").forEach((b) => { b.onclick = () => declineWithReason(b.getAttribute("data-qmsg")); });

        sc.querySelector("#nx-inc-acc").onclick = async () => {
            stopAllTones(); clearTimeout(ringTimeout); sc.remove();
            getAudioCtx();
            try {
                localStream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                    video: isVideo ? { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } : false
                });
            } catch (e) {
                return toast("❌ Mic/Camera permission allow karein!");
            }

            Object.assign(state, {
                active: true, minimized: false, direction: "incoming", mode: isVideo ? "video" : "audio",
                peerId: payload.fromId, peerName: payload.fromName, peerUname: payload.fromUname, peerDp: payload.fromDp || "",
                muted: false, camOff: false, onHold: false, peerOnHold: false, connected: false, startedAt: 0
            });
            renderActiveCallUI("🔗 Connecting...");

            activeRoomChannel = sb.channel(payload.callRoom);
            pc = createPeerConnection(activeRoomChannel, me.id);
            localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
            attachCommonRoomEvents(activeRoomChannel, me.id);

            activeRoomChannel.subscribe(async (status) => {
                if (status !== "SUBSCRIBED") return;
                await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
                await flushIceQueue();
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                activeRoomChannel.send({ type: "broadcast", event: "call_answer", payload: { by: me.id, answer } });
            });
        };
    }

    // -------------------- OUTGOING CALL LAUNCHER --------------------
    window.startNexusRealCall = async function (mode, targetUsername) {
        const me = getMe(), sb = getSb();
        if (!me || !me.id || !sb) {
            toast("🔒 Call karne ke liye pehle Login karein!");
            if (window.openNexusSupabaseAuthModal) window.openNexusSupabaseAuthModal("login");
            return;
        }
        const peerKey = normU(targetUsername || window.CURRENT_NXS_PARTNER || (window.NexusDM && NexusDM.activePartner));
        if (!peerKey || peerKey === normU(me.username)) return toast("⚠️ Kisi friend ko select karein call karne ke liye!");

        let peer = ((window.Nexus && Nexus.users) || []).find((u) => u && normU(u.username) === peerKey);
        if (!peer || !peer.id) {
            const { data } = await sb.from("profiles").select("*").ilike("username", peerKey).maybeSingle();
            if (data) peer = { id: data.id, username: data.username, name: data.display_name || data.username, dp: data.avatar_url || "" };
        }
        if (!peer || !peer.id) return toast("❌ User online calling system mein nahi mila!");

        endCallCleanup(false);
        getAudioCtx();
        const isVideo = mode === "video" || mode === "screen";
        try {
            localStream = mode === "screen"
                ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                : await navigator.mediaDevices.getUserMedia({
                      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                      video: isVideo ? { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } : false
                  });
        } catch (e) {
            return toast("❌ Mic/Camera permission denied!");
        }

        const callRoom = "nx_call_" + [me.id, peer.id].sort().join("_") + "_" + Date.now().toString(36);
        Object.assign(state, {
            active: true, minimized: false, direction: "outgoing", mode: isVideo ? "video" : "audio",
            peerId: peer.id, peerName: peer.name || peer.username, peerUname: peer.username, peerDp: peer.dp || "",
            muted: false, camOff: false, onHold: false, peerOnHold: false, connected: false, startedAt: 0
        });
        renderActiveCallUI("🔔 Ringing...");
        startOutgoingRingback();

        ringTimeout = setTimeout(() => {
            if (state.active && !state.connected) {
                toast("📵 No Answer (45s)");
                endCallCleanup(true, "no_answer");
            }
        }, 45000);

        activeRoomChannel = sb.channel(callRoom);
        pc = createPeerConnection(activeRoomChannel, me.id);
        localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
        attachCommonRoomEvents(activeRoomChannel, me.id);

        activeRoomChannel
            .on("broadcast", { event: "call_answer" }, async ({ payload: p }) => {
                if (!p || p.by === me.id || !p.answer || !pc) return;
                stopAllTones(); clearTimeout(ringTimeout);
                await pc.setRemoteDescription(new RTCSessionDescription(p.answer));
                await flushIceQueue();
            })
            .on("broadcast", { event: "call_declined" }, ({ payload: p }) => {
                toast(p && p.quickMsg ? `💬 ${peer.name}: "${p.quickMsg}"` : "📵 Call Declined");
                endCallCleanup(false, "declined");
            })
            .on("broadcast", { event: "call_busy" }, () => {
                toast(`📵 ${peer.name} is busy on another call`);
                endCallCleanup(false, "busy");
            })
            .subscribe(async (status) => {
                if (status !== "SUBSCRIBED") return;
                const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: isVideo });
                await pc.setLocalDescription(offer);

                const ringCh = sb.channel("nx_ring_user_" + peer.id);
                ringCh.subscribe((st) => {
                    if (st === "SUBSCRIBED") {
                        ringCh.send({
                            type: "broadcast",
                            event: "incoming_call",
                            payload: {
                                callRoom,
                                mode: isVideo ? "video" : "audio",
                                fromId: me.id,
                                fromUname: me.username,
                                fromName: me.name || me.username,
                                fromDp: me.dp || "",
                                offer
                            }
                        });
                        setTimeout(() => sb.removeChannel(ringCh), 1500);
                    }
                });
            });
    };

    // -------------------- CALL HISTORY MODAL --------------------
    function openCallHistoryModal() {
        document.getElementById("nx-call-history-modal")?.remove();
        let logs = [];
        try { logs = JSON.parse(localStorage.getItem(getHistoryKey()) || "[]"); } catch (e) {}
        const m = document.createElement("div");
        m.id = "nx-call-history-modal";
        m.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,.92);z-index:298000;display:flex;align-items:flex-end;justify-content:center;";
        m.innerHTML = `<div style="background:#0f172a;border-top:2px solid #10b981;border-radius:24px 24px 0 0;width:100%;max-width:560px;max-height:82dvh;display:flex;flex-direction:column;padding:16px 16px 24px;color:#fff;">
            <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:1px solid #1e293b;margin-bottom:10px;">
                <h3 style="font-size:16px;font-weight:900;">📞 Recent Call Logs (${logs.length})</h3>
                <button id="nx-ch-x" style="width:30px;height:30px;border-radius:50%;background:#1e293b;border:none;color:#fff;cursor:pointer;">✕</button>
            </div>
            <div style="flex:1;overflow-y:auto;">
                ${logs.length ? logs.map((l) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:14px;background:#090d16;border:1px solid #1e293b;margin-bottom:8px;">
                    <div>
                        <div style="font-size:13.5px;font-weight:900;">${l.mode === "video" ? "📹" : "📞"} ${esc(l.peerName || l.peerUname)}</div>
                        <div style="font-size:11px;color:${l.status === "missed" || l.status === "declined" ? "#fb7185" : "#34d399"};">${l.direction === "incoming" ? "↙ Incoming" : "↗ Outgoing"} • ${esc(l.status)} ${l.durationSec > 0 ? "• " + fmtDuration(l.durationSec) : ""}</div>
                    </div>
                    <div style="display:flex;gap:6px;">
                        <button onclick="document.getElementById('nx-call-history-modal').remove();startNexusRealCall('audio','${esc(l.peerUname)}')" style="padding:7px 10px;border-radius:10px;background:#1e293b;border:1px solid #10b981;color:#34d399;cursor:pointer;">📞</button>
                        <button onclick="document.getElementById('nx-call-history-modal').remove();startNexusRealCall('video','${esc(l.peerUname)}')" style="padding:7px 10px;border-radius:10px;background:#1e293b;border:1px solid #38bdf8;color:#38bdf8;cursor:pointer;">📹</button>
                    </div>
                </div>`).join("") : `<div style="text-align:center;padding:34px;color:#64748b;">Abhi koi call history nahi hai.</div>`}
            </div>
        </div>`;
        document.body.appendChild(m);
        m.querySelector("#nx-ch-x").onclick = () => m.remove();
        m.onclick = (e) => { if (e.target === m) m.remove(); };
    }

    // -------------------- GLOBAL INCOMING CALL LISTENER & DM HOOK --------------------
    setInterval(() => {
        const me = getMe(), sb = getSb();
        if (me && me.id && sb && !inboxRingChannel) {
            inboxRingChannel = sb.channel("nx_ring_user_" + me.id)
                .on("broadcast", { event: "incoming_call" }, ({ payload }) => {
                    if (payload && payload.fromId && payload.fromId !== me.id) {
                        showIncomingCallScreen(payload);
                    }
                })
                .subscribe();
        }
        if (window.NexusDM && !window.NexusDM.__nxCallEngineLinked) {
            window.NexusDM.__nxCallEngineLinked = true;
            window.NexusDM.startCall = function (mode) {
                window.startNexusRealCall(mode, window.NexusDM.activePartner);
            };
        }
    }, 1200);

    window.NexusCalls = {
        startCall: window.startNexusRealCall,
        endCall: () => endCallCleanup(true, "ended"),
        openCallHistory: openCallHistoryModal,
        isActive: () => state.active
    };
})();
