// ================= FINAL POWER.JS: 📘 WELCOME GUIDE & ABOUT NEXUS + ➕ CLEAN BOTTOM TRAY + 🎵 FULL SONGS + 📞 CALL RINGTONE + 🛡️ ANTI-SCREENSHOT VIEW-ONCE + 🔍 PHOTO ZOOM + ⏳ VANISH MODE =================

(function() {
    let mediaRecorder = null;
    let audioChunks = [];
    let isRecordingVoice = false;
    let recordStartTime = 0;
    let recordTimerInt = null;
    let unlimitedDmUnsub = null;
    let partnerStatusUnsub = null;
    let watchPartyUnsub = null;
    let musicSyncUnsub = null;
    let currentChatPartnerUname = '';
    let currentActiveRoomKey = '';
    let allRoomMessagesFull = [];
    let visibleMessagesSlice = [];
    let currentRenderLimit = 35;
    let lastRenderedSignature = '';
    let deferredPwaPrompt = null;
    let lastBubbleTapMap = {};
    let viewOnceModeActive = false;
    let isWatchPartyMinimized = false;
    let activeRoomVanishMs = 0;
    let currentLightboxZoom = 1;
    let lastCheckedLoggedUser = '';

    // Single Global Audio Instance (Guarantees Zero Song Overlap)
    let currentPlayingUrl = '';
    function getSingleMasterAudio() {
        if (!window.__nxMasterSyncAudio) {
            window.__nxMasterSyncAudio = new Audio();
            window.__nxMasterSyncAudio.loop = true;
        }
        document.querySelectorAll('audio').forEach(a => {
            if (a !== window.__nxMasterSyncAudio && a.id !== 'nx-remote-call-audio' && !a.closest('.nx-audio-player-pill')) {
                try { a.pause(); } catch (e) {}
            }
        });
        return window.__nxMasterSyncAudio;
    }

    // Web Audio API Synthesizer for Loud Incoming Ringtone & Outgoing Dial Tone
    let ringtoneInterval = null;
    let ringAudioCtx = null;

    function startCallRingtone(isIncoming) {
        stopCallRingtone();
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!ringAudioCtx) ringAudioCtx = new AudioCtx();
            if (ringAudioCtx.state === 'suspended') ringAudioCtx.resume();

            const playBeepCycle = () => {
                if (!ringAudioCtx) return;
                try {
                    const osc = ringAudioCtx.createOscillator();
                    const gain = ringAudioCtx.createGain();
                    osc.type = isIncoming ? 'sine' : 'triangle';
                    osc.frequency.setValueAtTime(isIncoming ? 880 : 440, ringAudioCtx.currentTime);
                    if (isIncoming) {
                        osc.frequency.setValueAtTime(1100, ringAudioCtx.currentTime + 0.18);
                    }
                    gain.gain.setValueAtTime(0.25, ringAudioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, ringAudioCtx.currentTime + 0.45);
                    osc.connect(gain);
                    gain.connect(ringAudioCtx.destination);
                    osc.start();
                    osc.stop(ringAudioCtx.currentTime + 0.46);
                } catch (e) {}
                if (isIncoming && navigator.vibrate) {
                    try { navigator.vibrate([300, 150, 300]); } catch (e) {}
                }
            };

            playBeepCycle();
            ringtoneInterval = setInterval(playBeepCycle, isIncoming ? 1200 : 2000);
        } catch (e) {}
    }

    function stopCallRingtone() {
        if (ringtoneInterval) {
            clearInterval(ringtoneInterval);
            ringtoneInterval = null;
        }
        if (navigator.vibrate) {
            try { navigator.vibrate(0); } catch (e) {}
        }
    }

    // Live WebRTC Internet Audio Call State
    let peerConn = null;
    let localAudioStream = null;
    let incomingCallUnsub = null;
    let activeCallDocUnsub = null;
    let currentCallDocId = null;
    let isMicMuted = false;

    const RTC_CONFIG = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" }
        ]
    };

    const WALLPAPERS = [
        { id: "default", name: "🌑 WhatsApp Dark", css: "#0b141a" },
        { id: "amoled", name: "🖤 Pure AMOLED Black", css: "#000000" },
        { id: "cyber", name: "⚡ Neon Cyberpunk", css: "radial-gradient(circle at top right, #1e1b4b, #090d16 70%)" },
        { id: "emerald", name: "🌲 Emerald Night", css: "linear-gradient(180deg, #06281e 0%, #090d16 100%)" },
        { id: "royal", name: "👑 Royal Galaxy", css: "linear-gradient(135deg, #1e1b4b 0%, #0f172a 55%, #090d16 100%)" }
    ];

    const powerStyle = document.createElement('style');
    powerStyle.innerHTML = `
        #nx-dm-dedicated-root {
            background: #0b141a !important;
            box-shadow: 0 0 0 100vmax #0b141a !important;
        }
        #nx-adv-song-btn, #nx-adv-call-btn {
            display: none !important;
        }
        @keyframes nxPulseRec {
            0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            50% { transform: scale(1.08); box-shadow: 0 0 12px 4px rgba(239, 68, 68, 0.4); }
        }
        @keyframes nxCallPulse {
            0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            50% { transform: scale(1.06); box-shadow: 0 0 18px 6px rgba(16, 185, 129, 0.35); }
        }
        @keyframes nxSpinDisk {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .nx-voice-rec-active {
            background: #ef4444 !important;
            color: white !important;
            border-radius: 50% !important;
            animation: nxPulseRec 1s infinite !important;
        }
        .nx-audio-player-pill {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(0, 0, 0, 0.28);
            padding: 6px 10px;
            border-radius: 14px;
            margin: 4px 0;
            border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .nx-audio-player-pill audio {
            height: 32px;
            max-width: 185px;
        }
        .nx-floating-react-pill {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: #182229;
            border: 1.5px solid #00a884;
            color: #f8fafc;
            padding: 2px 8px;
            border-radius: 14px;
            font-size: 11.5px !important;
            font-weight: 800;
            margin-top: -5px;
            margin-bottom: 4px;
            z-index: 5;
            box-shadow: 0 3px 8px rgba(0,0,0,0.45);
            cursor: pointer;
        }
        .nx-swipe-reply-badge {
            position: fixed;
            z-index: 100001;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            background: #00a884;
            color: #020617;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            font-weight: 900;
            box-shadow: 0 4px 12px rgba(0, 168, 132, 0.5);
            pointer-events: none;
        }
        .nx-viewonce-pill {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(0, 168, 132, 0.14);
            border: 1px dashed #00a884;
            padding: 8px 12px;
            border-radius: 12px;
            color: #5eead4;
            font-weight: 800;
            font-size: 13px;
            margin: 3px 0;
            cursor: pointer;
        }
        .nx-viewonce-opened {
            display: flex;
            align-items: center;
            gap: 6px;
            color: #8696a0;
            font-style: italic;
            font-size: 13px;
            padding: 4px 2px;
        }
        .nx-file-share-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            background: rgba(15, 23, 42, 0.75);
            border: 1px solid #38bdf8;
            padding: 9px 12px;
            border-radius: 12px;
            margin: 4px 0;
            min-width: 210px;
        }
        .nx-mini-song-bar {
            display: none;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 7px 12px;
            background: linear-gradient(90deg, #0f172a, #182229);
            border-bottom: 1px solid #00a884;
            color: #f8fafc;
            font-size: 12px;
            flex-shrink: 0;
            z-index: 9;
        }
        .nx-song-disk {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            object-fit: cover;
            border: 1.5px solid #00a884;
            animation: nxSpinDisk 6s linear infinite;
            flex-shrink: 0;
        }
        .nx-call-floating-bar {
            position: fixed;
            top: 62px;
            left: 50%;
            transform: translateX(-50%);
            width: 92%;
            max-width: 400px;
            background: linear-gradient(135deg, #064e3b, #0f172a);
            border: 1.5px solid #10b981;
            border-radius: 18px;
            padding: 10px 14px;
            display: none;
            align-items: center;
            justify-content: space-between;
            z-index: 100050;
            box-shadow: 0 12px 30px rgba(0,0,0,0.85);
            color: white;
        }
        .nx-dm-pinned-bar {
            display: none;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 6px 12px;
            background: #182229;
            border-bottom: 1px solid #233138;
            border-left: 4px solid #38bdf8;
            color: #e2e8f0;
            font-size: 11.5px;
            flex-shrink: 0;
        }
        .nx-dm-vanish-banner {
            display: none;
            align-items: center;
            justify-content: space-between;
            padding: 4px 12px;
            background: rgba(245, 158, 11, 0.14);
            border-bottom: 1px dashed #fbbf24;
            color: #fde68a;
            font-size: 11px;
            font-weight: 800;
            flex-shrink: 0;
        }
        .nx-sec-shield-box {
            user-select: none !important;
            -webkit-user-select: none !important;
            -webkit-touch-callout: none !important;
            position: relative;
            overflow: hidden;
            border-radius: 14px;
            background: #020617;
            border: 1.5px solid #00a884;
            margin-bottom: 12px;
        }
        .nx-sec-blur-layer {
            filter: blur(26px) brightness(0.35);
            transition: filter 0.12s ease;
            pointer-events: none;
        }
        .nx-sec-blur-layer.peek-active {
            filter: blur(0px) brightness(1);
        }
        .nx-guide-card {
            background: #111b21;
            border: 1px solid #233138;
            border-left: 3.5px solid #10b981;
            border-radius: 12px;
            padding: 10px 12px;
            margin-bottom: 8px;
            text-align: left;
        }
        .nx-guide-card h4 {
            font-size: 13px;
            color: #5eead4;
            margin: 0 0 4px 0;
        }
        .nx-guide-card p {
            font-size: 11.5px;
            color: #cbd5e1;
            line-height: 1.45;
            margin: 0;
        }
    `;
    document.head.appendChild(powerStyle);

    // 1. PRO IMAGE LIGHTBOX (Click Any Photo in Chat to Open, Zoom In/Out & Download!)
    function ensureLightboxModal() {
        let lb = document.getElementById('nx-pro-lightbox');
        if (!lb) {
            lb = document.createElement('div');
            lb.id = 'nx-pro-lightbox';
            lb.style.cssText = "position:fixed; inset:0; background:rgba(2,6,23,0.96); z-index:100090; display:none; flex-direction:column; justify-content:space-between; padding:14px; user-select:none;";
            document.body.appendChild(lb);
        }
        return lb;
    }

    document.addEventListener('click', e => {
        const img = e.target.closest('#nx-dm-msgs-box img, #nx-room-messages img');
        if (!img) return;
        if (img.classList.contains('nx-song-disk') || img.width < 48) return;
        e.stopPropagation();
        e.preventDefault();
        if (window.NexusPower) NexusPower.openImageLightbox(img.src);
    }, true);

    function ensureCallOverlays() {
        if (!document.getElementById('nx-remote-call-audio')) {
            const aud = document.createElement('audio');
            aud.id = 'nx-remote-call-audio';
            aud.autoplay = true;
            aud.playsInline = true;
            document.body.appendChild(aud);
        }
        if (!document.getElementById('nx-active-call-bar')) {
            const bar = document.createElement('div');
            bar.id = 'nx-active-call-bar';
            bar.className = 'nx-call-floating-bar';
            document.body.appendChild(bar);
        }
        if (!document.getElementById('nx-incoming-call-modal')) {
            const inc = document.createElement('div');
            inc.id = 'nx-incoming-call-modal';
            inc.style.cssText = "position:fixed; inset:0; background:rgba(2,6,23,0.85); z-index:100060; display:none; align-items:center; justify-content:center; padding:18px;";
            document.body.appendChild(inc);
        }
        if (!document.getElementById('nx-dm-doc-file-in')) {
            const fIn = document.createElement('input');
            fIn.type = 'file';
            fIn.id = 'nx-dm-doc-file-in';
            fIn.accept = '.pdf,.txt,.html,.css,.js,.py,.json,.zip,.doc,.docx,image/*';
            fIn.style.display = 'none';
            fIn.onchange = e => {
                if (e.target.files && e.target.files[0]) {
                    handleDirectFileUpload(e.target.files[0]);
                    e.target.value = '';
                }
            };
            document.body.appendChild(fIn);
        }
    }

    function handleDirectFileUpload(file) {
        if (!file) return;
        if (file.size > 750 * 1024) {
            Nexus.toast("⚠️ File size must be under 750 KB for fast cloud sync!");
            return;
        }
        let me = Nexus.getCurrentUser();
        if (!me || !currentChatPartnerUname || !Nexus.db) return;

        Nexus.toast(`📂 Uploading "${file.name}"...`);
        const reader = new FileReader();
        reader.onload = ev => {
            let sizeKb = Math.max(1, Math.round(file.size / 1024)) + ' KB';
            Nexus.db.collection("nexus_private_dms").add({
                roomKey: currentActiveRoomKey,
                participants: [me.username.toLowerCase(), currentChatPartnerUname.toLowerCase()],
                fromUser: me.username,
                fromName: me.name,
                toUser: currentChatPartnerUname,
                text: `📄 ${file.name}`,
                fileData: ev.target.result,
                fileName: file.name,
                fileSize: sizeKb,
                imgUrl: "",
                sticker: null,
                replyTo: null,
                likes: [],
                seen: false,
                edited: false,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                createdAt: Date.now()
            }).then(() => Nexus.toast("📂 File Sent Successfully!"));
        };
        reader.readAsDataURL(file);
    }

    // 2. NEW USER LOGIN ONBOARDING GUIDE + SETTINGS "WHAT IS NEXUS" BUTTON INJECTOR
    function checkNewUserLoginGuideAndSettingsBtn() {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        if (me && me.username) {
            let uKey = me.username.toLowerCase();
            if (lastCheckedLoggedUser !== uKey) {
                lastCheckedLoggedUser = uKey;
                let seenKey = 'nx_welcome_guide_seen_' + uKey;
                if (!localStorage.getItem(seenKey)) {
                    setTimeout(() => {
                        if (window.NexusPower) NexusPower.openNexusGuideModal(true);
                    }, 600);
                }
            }
        }

        // Inject "📘 What is Nexus? & All Features Guide" Button inside Settings Tab automatically!
        const setTab = document.getElementById('tab-settings');
        if (setTab && !document.getElementById('nx-about-guide-btn-wrap')) {
            const firstCard = setTab.querySelector('div > div');
            if (firstCard && firstCard.parentNode) {
                const aboutWrap = document.createElement('div');
                aboutWrap.id = 'nx-about-guide-btn-wrap';
                aboutWrap.style.cssText = "background:linear-gradient(135deg,#0f172a,#1e1b4b); border:1.5px solid #38bdf8; border-radius:16px; padding:15px;";
                aboutWrap.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <div>
                            <h3 style="font-size:15.5px; color:#38bdf8; margin:0;">📘 What is Nexus? &amp; Features</h3>
                            <p style="font-size:11.5px; color:#cbd5e1; margin:2px 0 0 0;">Know where every feature is &amp; how Nexus works</p>
                        </div>
                        <span style="font-size:22px;">🚀</span>
                    </div>
                    <button type="button" onclick="NexusPower.openNexusGuideModal(false)" style="width:100%; background:#38bdf8; color:#020617; border:none; padding:11px 14px; border-radius:12px; font-size:13px; font-weight:900; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
                        <span>📖 Open Complete Nexus Guide &amp; About</span><span>→</span>
                    </button>
                `;
                firstCard.parentNode.insertBefore(aboutWrap, firstCard);
            }
        }

        // Upgrade Group DJ Song Search in superchat.js to use Full-Length JioSaavn Songs too!
        if (window.NexusSuperChat && !NexusSuperChat.__nxFullGroupSongPatched) {
            NexusSuperChat.__nxFullGroupSongPatched = true;
            NexusSuperChat.searchGroupSongs = function(defQ) {
                const inp = document.getElementById('nx-grp-song-q');
                const box = document.getElementById('nx-grp-song-list');
                if (!box) return;
                let q = (inp && inp.value.trim()) ? inp.value.trim() : (defQ || 'Arijit Singh');
                box.innerHTML = `<div style="text-align:center; padding:14px; color:#38bdf8; font-size:12px;">🔍 Searching Full Songs for "${q}"...</div>`;
                fetchFullSongsUniversal(q, list => {
                    if (!list.length) {
                        box.innerHTML = `<div style="text-align:center; padding:14px; color:#64748b; font-size:12px;">No songs found. Try another keyword!</div>`;
                        return;
                    }
                    box.innerHTML = list.map(s => `
                        <div onclick="NexusSuperChat.playGroupSong('${s.safeTitle}', '${s.safeArtist}', '${s.audioUrl}', '${s.cover}')" style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:8px; background:#1e293b; border-radius:10px; cursor:pointer;">
                            <div style="display:flex; align-items:center; gap:8px; min-width:0; flex:1;">
                                <img src="${s.cover}" style="width:36px; height:36px; border-radius:8px; object-fit:cover;">
                                <div style="min-width:0; flex:1;">
                                    <div style="font-weight:800; font-size:12.5px; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.rawTitle}</div>
                                    <div style="font-size:10.5px; color:#10b981;">🎵 Full Song • ${s.rawArtist}</div>
                                </div>
                            </div>
                            <span style="background:#00a884; color:#020617; padding:4px 9px; border-radius:8px; font-size:11px; font-weight:900;">▶ Full</span>
                        </div>
                    `).join('');
                });
            };
        }
    }

    function fetchFullSongsUniversal(query, callback) {
        fetch(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}&limit=10`)
            .then(r => r.json())
            .then(res => {
                let results = (res && res.data && Array.isArray(res.data.results)) ? res.data.results : [];
                if (!results.length) throw new Error("Fallback");
                let parsed = results.map(s => {
                    let dlArr = Array.isArray(s.downloadUrl) ? s.downloadUrl : [];
                    let bestAudio = dlArr.length > 0 ? (dlArr[dlArr.length - 1].url || dlArr[0].url) : '';
                    let imgArr = Array.isArray(s.image) ? s.image : [];
                    let cover = imgArr.length > 0 ? (imgArr[imgArr.length - 1].url || imgArr[0].url) : '';
                    let rawTitle = (s.name || 'Song').replace(/&quot;/g, '"');
                    let rawArtist = (s.artists && s.artists.primary && s.artists.primary[0]) ? s.artists.primary[0].name : 'Artist';
                    return {
                        rawTitle: rawTitle,
                        rawArtist: rawArtist,
                        safeTitle: rawTitle.replace(/'/g, "\\'").replace(/"/g, "&quot;"),
                        safeArtist: rawArtist.replace(/'/g, "\\'").replace(/"/g, "&quot;"),
                        audioUrl: bestAudio,
                        cover: cover
                    };
                }).filter(x => x.audioUrl);
                callback(parsed);
            })
            .catch(() => {
                fetch(`https://jiosaavn-api-privatecvc2.vercel.app/search/songs?query=${encodeURIComponent(query)}&limit=10`)
                    .then(r => r.json())
                    .then(res => {
                        let list = (res && res.data && res.data.results) ? res.data.results : [];
                        let parsed = list.map(s => {
                            let audioUrl = (s.downloadUrl && s.downloadUrl.length) ? s.downloadUrl[s.downloadUrl.length - 1].link : '';
                            let cover = (s.image && s.image.length) ? s.image[s.image.length - 1].link : '';
                            let rawTitle = (s.name || 'Song').replace(/&quot;/g, '"');
                            let rawArtist = s.primaryArtists || 'Artist';
                            return {
                                rawTitle: rawTitle,
                                rawArtist: rawArtist,
                                safeTitle: rawTitle.replace(/'/g, "\\'").replace(/"/g, "&quot;"),
                                safeArtist: rawArtist.replace(/'/g, "\\'").replace(/"/g, "&quot;"),
                                audioUrl: audioUrl,
                                cover: cover
                            };
                        }).filter(x => x.audioUrl);
                        callback(parsed);
                    })
                    .catch(() => callback([]));
            });
    }

    function syncHomeAndProfileFollowers() {
        const origFollow = Nexus.toggleFollow;
        if (!origFollow || origFollow.__nxSyncedFollow) return;
        const wrappedFollow = function(targetUsername) {
            origFollow(targetUsername);
            setTimeout(() => {
                if (Nexus.rebuildAllUsersMasterList) Nexus.rebuildAllUsersMasterList();
                if (Nexus.notifyAll) Nexus.notifyAll();
            }, 120);
        };
        wrappedFollow.__nxSyncedFollow = true;
        Nexus.toggleFollow = wrappedFollow;
    }

    function ensureSwipeIndicator() {
        let ind = document.getElementById('nx-swipe-indicator');
        if (!ind) {
            ind = document.createElement('div');
            ind.id = 'nx-swipe-indicator';
            ind.className = 'nx-swipe-reply-badge';
            ind.innerHTML = '↩️';
            document.body.appendChild(ind);
        }
        return ind;
    }

    function copyTextUniversal(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => Nexus.toast("📋 Message Copied!")).catch(() => fallbackCopyText(text));
        } else {
            fallbackCopyText(text);
        }
    }

    function fallbackCopyText(text) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = "position:fixed; top:-9999px; left:-9999px;";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try { document.execCommand('copy'); Nexus.toast("📋 Message Copied!"); } catch (e) {}
        document.body.removeChild(ta);
    }

    function ensureActionModalExists() {
        let modal = document.getElementById('nx-msg-action-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'nx-msg-action-modal';
            modal.className = 'nx-msg-action-backdrop';
            modal.style.cssText = "position:fixed; inset:0; background:rgba(2,6,23,0.82); z-index:100020; display:none; align-items:center; justify-content:center; padding:18px;";
            modal.addEventListener('click', e => {
                if (e.target === modal) modal.style.display = 'none';
            });
            document.body.appendChild(modal);
        }
        return modal;
    }

    function isPartnerOnlineNow(u) {
        if (!u) return false;
        if (u.isOnlineNow === false) return false;
        return (Date.now() - (u.lastOnline || 0)) < 120000;
    }

    function formatPartnerLastSeen(u) {
        if (!u) return '🔒 Private Chat';
        if (isPartnerOnlineNow(u)) return '🟢 Online Now';
        let ts = u.lastSeenAt || u.lastOnline || 0;
        if (!ts) return '🔒 Private';
        let diffSec = Math.max(1, Math.floor((Date.now() - ts) / 1000));
        if (diffSec < 60) return 'Last seen just now';
        let diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `Last seen ${diffMin}m ago`;
        let diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `Last seen ${diffHr}h ago`;
        return `Last seen ${Math.floor(diffHr / 24)}d ago`;
    }

    function extractYouTubeEmbedUrl(rawUrl) {
        if (!rawUrl) return '';
        let s = rawUrl.trim();
        let m = s.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (m && m[1]) {
            return `https://www.youtube.com/embed/${m[1]}?autoplay=1&playsinline=1`;
        }
        return s;
    }

    // 3. ZERO-LAG WINDOWED DM ENGINE + CHAT PIN LOCK + VANISH AUTO-CLEANER
    function upgradeDmExperience() {
        if (!window.NexusDM) {
            setTimeout(upgradeDmExperience, 200);
            return;
        }

        const origOpenDirectChat = NexusDM.openDirectChat.bind(NexusDM);
        NexusDM.openDirectChat = function(partnerUsername, partnerName, partnerDp) {
            let lockedMap = {};
            try { lockedMap = JSON.parse(localStorage.getItem('nx_locked_chats_v1') || '{}'); } catch (e) {}
            let uKey = (partnerUsername || '').toLowerCase().trim();
            if (lockedMap[uKey]) {
                let entered = prompt(`🔒 @${partnerUsername} ki chat PIN-Locked hai.\nUnlock karne ke liye apna PIN dalein:`);
                if (entered !== String(lockedMap[uKey])) {
                    Nexus.toast("❌ Wrong Chat Lock PIN!");
                    return;
                }
            }
            origOpenDirectChat(partnerUsername, partnerName, partnerDp);
        };

        NexusDM.sendDM = function(customImgData, customStickerObj) {
            let me = Nexus.getCurrentUser();
            const inp = document.getElementById('nx-dm-input');
            if (!me || !currentChatPartnerUname || !Nexus.db) return;
            if (me.isBanned) {
                Nexus.toast("🚫 Restricted from sending messages.");
                return;
            }

            let text = inp ? inp.value.trim() : '';
            if (!text && !customImgData && !customStickerObj) return;

            if (inp && !customImgData && !customStickerObj) inp.value = '';
            let roomKey = currentActiveRoomKey || [me.username.toLowerCase().trim(), currentChatPartnerUname.toLowerCase().trim()].sort().join('__');

            Nexus.db.collection("nexus_accounts").doc(me.username).set({
                dmTypingRoom: '',
                lastOnline: Date.now()
            }, { merge: true }).catch(() => {});

            if (viewOnceModeActive && !customStickerObj) {
                NexusPower.toggleViewOnceMode(false);
                Nexus.db.collection("nexus_private_dms").add({
                    roomKey: roomKey,
                    participants: [me.username.toLowerCase(), currentChatPartnerUname.toLowerCase()],
                    fromUser: me.username,
                    fromName: me.name,
                    toUser: currentChatPartnerUname,
                    text: "① Secret Message",
                    secretText: text,
                    secretImg: customImgData || "",
                    isViewOnce: true,
                    viewedOnce: false,
                    imgUrl: "",
                    sticker: null,
                    replyTo: null,
                    likes: [],
                    seen: false,
                    edited: false,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    createdAt: Date.now()
                }).then(() => Nexus.toast("① Anti-Screenshot View-Once Sent!"));
                return;
            }

            origSendFallback(me, roomKey, text, customImgData, customStickerObj);
        };

        function origSendFallback(me, roomKey, text, customImgData, customStickerObj) {
            const repBar = document.getElementById('nx-dm-reply-bar');
            const repTxtEl = document.getElementById('nx-dm-reply-txt');
            let replyObj = null;
            if (repBar && repBar.style.display !== 'none' && repTxtEl) {
                let rawBar = repTxtEl.innerText || '';
                if (rawBar.startsWith('✏️') && NexusDM.__activeEditId) {
                    let editId = NexusDM.__activeEditId;
                    NexusDM.__activeEditId = null;
                    NexusDM.cancelReply();
                    Nexus.db.collection("nexus_private_dms").doc(editId).update({ text: text, edited: true });
                    Nexus.toast("✏️ Message Updated!");
                    return;
                } else if (NexusDM.__activeReplyObj) {
                    replyObj = NexusDM.__activeReplyObj;
                }
            }
            NexusDM.__activeReplyObj = null;
            if (NexusDM.cancelReply) NexusDM.cancelReply();

            Nexus.db.collection("nexus_private_dms").add({
                roomKey: roomKey,
                participants: [me.username.toLowerCase(), currentChatPartnerUname.toLowerCase()],
                fromUser: me.username,
                fromName: me.name,
                toUser: currentChatPartnerUname,
                text: customStickerObj ? '' : text,
                imgUrl: customImgData || '',
                sticker: customStickerObj || null,
                replyTo: replyObj,
                likes: [],
                seen: false,
                edited: false,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                createdAt: Date.now()
            });
        }

        const origStartReply = NexusDM.startReply;
        NexusDM.startReply = function(senderName, snippet) {
            NexusDM.__activeEditId = null;
            NexusDM.__activeReplyObj = { sender: senderName, text: (snippet || '').substring(0, 40) };
            if (origStartReply) origStartReply(senderName, snippet);
        };

        const origStartEdit = NexusDM.startEdit;
        NexusDM.startEdit = function(msgId, oldText) {
            NexusDM.__activeReplyObj = null;
            NexusDM.__activeEditId = msgId;
            if (origStartEdit) origStartEdit(msgId, oldText);
        };

        NexusDM.listenToRoom = function(myUname, partnerUname) {
            if (unlimitedDmUnsub) unlimitedDmUnsub();
            if (partnerStatusUnsub) partnerStatusUnsub();
            if (watchPartyUnsub) watchPartyUnsub();
            if (musicSyncUnsub) musicSyncUnsub();
            if (!Nexus.db) return;

            currentChatPartnerUname = partnerUname;
            let roomKey = [myUname.toLowerCase().trim(), partnerUname.toLowerCase().trim()].sort().join('__');
            currentActiveRoomKey = roomKey;
            currentRenderLimit = 35;
            lastRenderedSignature = '';
            viewOnceModeActive = false;
            activeRoomVanishMs = 0;

            applySavedChatWallpaper();
            organizeCleanDmHeader(myUname, partnerUname, roomKey);
            listenToRoomMusicSync(roomKey);
            startGlobalIncomingCallListener();

            partnerStatusUnsub = Nexus.db.collection("nexus_accounts").doc(partnerUname).onSnapshot(doc => {
                if (!doc.exists) return;
                let p = doc.data();
                let isTyping = p.dmTypingRoom === roomKey && p.dmTypingAt && (Date.now() - p.dmTypingAt < 4200);

                const tBar = document.getElementById('nx-dm-typing-bar');
                if (tBar) tBar.style.display = isTyping ? 'flex' : 'none';

                const statusEl = document.getElementById('nx-dm-partner-status');
                if (statusEl) {
                    if (isTyping) {
                        statusEl.style.color = '#00a884';
                        statusEl.style.fontWeight = '800';
                        statusEl.innerText = '✍️ typing...';
                    } else {
                        let online = isPartnerOnlineNow(p);
                        statusEl.style.color = online ? '#00a884' : '#8696a0';
                        statusEl.style.fontWeight = online ? '700' : '400';
                        statusEl.innerText = formatPartnerLastSeen(p);
                    }
                }
            });

            watchPartyUnsub = Nexus.db.collection("nexus_watch_party").doc(roomKey).onSnapshot(doc => {
                const wpBar = document.getElementById('nx-dm-watchparty-box');
                const pinBar = document.getElementById('nx-dm-pinned-bar');
                const vanBar = document.getElementById('nx-dm-vanish-banner');

                if (doc.exists && doc.data().pinnedText && pinBar) {
                    pinBar.style.display = 'flex';
                    pinBar.innerHTML = `
                        <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;">📌 <b>Pinned:</b> ${doc.data().pinnedText.replace(/</g, '&lt;')}</span>
                        <button type="button" onclick="NexusPower.unpinRoomMessage()" style="background:none; border:none; color:#94a3b8; font-size:12px; cursor:pointer; margin-left:8px;">✕</button>
                    `;
                } else if (pinBar) {
                    pinBar.style.display = 'none';
                }

                if (doc.exists && doc.data().vanishMs && doc.data().vanishMs > 0) {
                    activeRoomVanishMs = Number(doc.data().vanishMs);
                    if (vanBar) {
                        vanBar.style.display = 'flex';
                        vanBar.innerHTML = `
                            <span>⏳ Auto-Vanish ON (${doc.data().vanishLabel || 'Active'}) • Old messages self-destruct</span>
                            <button type="button" onclick="NexusPower.setVanishTimer(0, 'OFF')" style="background:none; border:none; color:#f87171; font-weight:900; font-size:11px; cursor:pointer;">Turn OFF ✕</button>
                        `;
                    }
                } else {
                    activeRoomVanishMs = 0;
                    if (vanBar) vanBar.style.display = 'none';
                }

                if (!wpBar) return;
                if (!doc.exists || !doc.data().active) {
                    wpBar.style.display = 'none';
                    wpBar.innerHTML = '';
                    wpBar.removeAttribute('data-url');
                    return;
                }
                let d = doc.data();
                if (wpBar.getAttribute('data-url') === d.embedUrl && wpBar.style.display === 'block') return;
                wpBar.setAttribute('data-url', d.embedUrl);
                wpBar.style.display = 'block';
                isWatchPartyMinimized = false;

                let isDirectVideo = d.embedUrl.endsWith('.mp4') || d.embedUrl.endsWith('.webm');
                let playerHTML = isDirectVideo
                    ? `<video id="nx-wp-frame" src="${d.embedUrl}" controls autoplay playsinline style="width:100%; height:170px; background:#000; display:block;"></video>`
                    : `<iframe id="nx-wp-frame" src="${d.embedUrl}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="width:100%; height:170px; border:none; background:#000; display:block;"></iframe>`;

                wpBar.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 12px; background:#182229; border-bottom:1px solid #2a3942; font-size:11.5px;">
                        <span style="color:#10b981; font-weight:800;">🎬 Watch-Party • @${d.startedBy}</span>
                        <div style="display:flex; gap:6px;">
                            <button type="button" id="nx-wp-min-btn" onclick="NexusPower.toggleMinimizeWatchParty()" style="background:#2a3942; color:#e9edef; border:none; padding:2px 8px; border-radius:6px; font-size:10.5px; font-weight:800; cursor:pointer;">➖ Hide Video</button>
                            <button type="button" onclick="NexusPower.stopWatchParty()" style="background:#ef4444; color:white; border:none; padding:2px 8px; border-radius:6px; font-size:10.5px; font-weight:800; cursor:pointer;">✕ Stop</button>
                        </div>
                    </div>
                    ${playerHTML}
                `;
            });

            unlimitedDmUnsub = Nexus.db.collection("nexus_private_dms")
                .where("roomKey", "==", roomKey)
                .onSnapshot(snap => {
                    let list = [];
                    let unseenIds = [];
                    let expiredIds = [];
                    let now = Date.now();

                    snap.forEach(d => {
                        let m = d.data();
                        m.id = d.id;
                        if (activeRoomVanishMs > 0 && m.createdAt && (now - m.createdAt > activeRoomVanishMs)) {
                            expiredIds.push(m.id);
                            return;
                        }
                        list.push(m);
                        if (m.toUser && m.toUser.toLowerCase() === myUname.toLowerCase() && !m.seen) {
                            unseenIds.push(m.id);
                        }
                    });

                    if (expiredIds.length > 0) {
                        expiredIds.slice(0, 15).forEach(id => {
                            Nexus.db.collection("nexus_private_dms").doc(id).delete().catch(() => {});
                        });
                    }

                    if (unseenIds.length > 0) {
                        unseenIds.slice(-15).forEach(id => {
                            Nexus.db.collection("nexus_private_dms").doc(id).update({ seen: true }).catch(() => {});
                        });
                    }

                    list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
                    allRoomMessagesFull = list;
                    renderWindowedMessages(myUname, false);
                });
        };

        NexusDM.openMsgActionMenu = function(msgId) {
            let now = Date.now();
            let lastTap = lastBubbleTapMap[msgId] || 0;
            if (now - lastTap < 280) {
                lastBubbleTapMap[msgId] = 0;
                NexusPower.reactDmMsg(msgId, '❤️');
                Nexus.toast("❤️ Liked Message!");
                return;
            }
            lastBubbleTapMap[msgId] = now;

            let m = allRoomMessagesFull.find(x => x.id === msgId);
            if (!m) return;

            if (m.isViewOnce) {
                NexusPower.openViewOnceModal(m.id);
                return;
            }

            const modal = ensureActionModalExists();
            let me = Nexus.getCurrentUser();
            if (!me) return;

            let myUname = me.username.toLowerCase();
            let isMineOrAdmin = (m.fromUser && m.fromUser.toLowerCase() === myUname) || myUname === 'kumar' || myUname === 'mohit';
            let previewTxt = m.text || (m.audioData ? '🎤 Voice Note' : (m.sticker ? '✨ Animated Sticker' : '📷 Photo'));
            const emojis = ['❤️', '😂', '🔥', '👍', '🙏', '💯'];
            let likes = Array.isArray(m.likes) ? m.likes : [];
            let iReacted = likes.includes(me.username);

            modal.innerHTML = `
                <div class="nx-msg-action-sheet" style="width:100%; max-width:325px; background:#182229; border:1px solid #2a3942; border-radius:20px; padding:15px; box-shadow:0 18px 45px rgba(0,0,0,0.85);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span style="font-size:12px; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:240px;">
                            <b>${m.fromName || m.fromUser}:</b> "${previewTxt}"
                        </span>
                        <button type="button" onclick="document.getElementById('nx-msg-action-modal').style.display='none'" style="background:none; border:none; color:#cbd5e1; font-size:16px; cursor:pointer;">✕</button>
                    </div>

                    <div class="nx-emoji-bar">
                        ${emojis.map(em => {
                            let isSelected = iReacted && (m.reaction || '❤️') === em;
                            return `<button type="button" class="nx-emoji-btn" style="background:${isSelected ? 'rgba(0,168,132,0.28)' : 'none'}; border-radius:50%; padding:4px;" onclick="NexusPower.reactDmMsg('${m.id}', '${em}')">${em}</button>`;
                        }).join('')}
                    </div>

                    <button type="button" class="nx-menu-opt-btn" onclick="NexusPower.execDmAction('reply', '${m.id}')">
                        <span>↩️</span> <span>Reply to Message</span>
                    </button>

                    ${m.text ? `
                        <button type="button" class="nx-menu-opt-btn" onclick="NexusPower.pinRoomMessage('${m.id}')">
                            <span>📌</span> <span>Pin Message to Top</span>
                        </button>
                        <button type="button" class="nx-menu-opt-btn" onclick="NexusPower.execDmAction('copy', '${m.id}')">
                            <span>📋</span> <span>Copy Message Text</span>
                        </button>
                    ` : ''}

                    ${isMineOrAdmin && m.text && !m.audioData && !m.fileData ? `
                        <button type="button" class="nx-menu-opt-btn" style="color:#38bdf8;" onclick="NexusPower.execDmAction('edit', '${m.id}')">
                            <span>✏️</span> <span>Edit Message</span>
                        </button>
                    ` : ''}

                    ${isMineOrAdmin ? `
                        <button type="button" class="nx-menu-opt-btn" style="color:#f87171; border-color:rgba(239,68,68,0.35);" onclick="NexusPower.execDmAction('delete', '${m.id}')">
                            <span>🗑️</span> <span>Delete for Everyone</span>
                        </button>
                    ` : ''}

                    <button type="button" class="nx-menu-opt-btn" style="justify-content:center; background:transparent; border:none; color:#8696a0; margin-bottom:0;" onclick="document.getElementById('nx-msg-action-modal').style.display='none'">
                        Cancel
                    </button>
                </div>
            `;
            modal.style.display = 'flex';
            if (window.NexusSuperChat && NexusSuperChat.upgradeEmojiReactionModals) {
                NexusSuperChat.upgradeEmojiReactionModals();
            }
        };

        const origCloseDM = NexusDM.closeDM;
        NexusDM.closeDM = function(fromBack) {
            if (unlimitedDmUnsub) { unlimitedDmUnsub(); unlimitedDmUnsub = null; }
            if (partnerStatusUnsub) { partnerStatusUnsub(); partnerStatusUnsub = null; }
            if (watchPartyUnsub) { watchPartyUnsub(); watchPartyUnsub = null; }
            if (musicSyncUnsub) { musicSyncUnsub(); musicSyncUnsub = null; }
            if (window.__nxMasterSyncAudio) {
                window.__nxMasterSyncAudio.pause();
                currentPlayingUrl = '';
            }
            if (isRecordingVoice) stopVoiceNoteRecording(true);
            if (origCloseDM) origCloseDM(fromBack);
        };
    }

    // 4. SMART WINDOWED RENDERER
    function renderWindowedMessages(myUname, forceRedraw) {
        let totalCount = allRoomMessagesFull.length;
        visibleMessagesSlice = totalCount > currentRenderLimit
            ? allRoomMessagesFull.slice(totalCount - currentRenderLimit)
            : allRoomMessagesFull;

        let lastMsg = visibleMessagesSlice.length > 0 ? visibleMessagesSlice[visibleMessagesSlice.length - 1] : null;
        let sig = `${totalCount}_${visibleMessagesSlice.length}_${lastMsg ? lastMsg.id + '_' + (lastMsg.text || '') + '_' + (lastMsg.seen ? 1 : 0) : '0'}_${visibleMessagesSlice.map(x => (x.likes || []).length + (x.reaction || '') + (x.viewedOnce ? 1 : 0)).join(',')}`;

        if (!forceRedraw && sig === lastRenderedSignature) return;
        lastRenderedSignature = sig;

        NexusDM.renderMessagesList(visibleMessagesSlice, myUname);
        upgradeBubblesWithViewOnceReactionsAndAudio(myUname, totalCount > currentRenderLimit, totalCount - visibleMessagesSlice.length);
    }

    function upgradeBubblesWithViewOnceReactionsAndAudio(myUname, hasOlderMessages, olderCount) {
        const msgBox = document.getElementById('nx-dm-msgs-box');
        if (!msgBox) return;

        attachSmoothBidirectionalSwipe('nx-dm-msgs-box', false);

        visibleMessagesSlice.forEach((m, idx) => {
            const rowEl = msgBox.children[idx];
            if (!rowEl) return;
            const bubble = rowEl.querySelector('div');
            if (!bubble) return;

            if (m.isViewOnce && !bubble.getAttribute('data-vo-rendered')) {
                bubble.setAttribute('data-vo-rendered', '1');
                let isMine = m.fromUser && m.fromUser.toLowerCase() === myUname.toLowerCase();
                if (m.viewedOnce) {
                    bubble.innerHTML = `<div class="nx-viewonce-opened"><span>👁️</span><span>Opened &amp; Destroyed</span><small style="margin-left:8px; opacity:0.7;">${m.time || ''}</small></div>`;
                } else {
                    let label = isMine ? "① View-Once Protected Sent" : "① Tap & Hold to View Secret";
                    bubble.innerHTML = `
                        <div class="nx-viewonce-pill">
                            <span style="background:#00a884; color:#020617; width:22px; height:22px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-weight:900; font-size:12px;">1</span>
                            <span>${label}</span>
                        </div>
                    `;
                }
            }

            if (m.fileData && !bubble.querySelector('.nx-file-share-card')) {
                const fileCard = document.createElement('div');
                fileCard.className = 'nx-file-share-card';
                fileCard.onclick = e => {
                    e.stopPropagation();
                    NexusPower.downloadSharedFile(m.id);
                };
                fileCard.innerHTML = `
                    <div style="display:flex; align-items:center; gap:9px; min-width:0; flex:1;">
                        <span style="font-size:24px;">📂</span>
                        <div style="min-width:0; flex:1;">
                            <div style="font-weight:800; font-size:12.5px; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${(m.fileName || 'Document').replace(/</g, '&lt;')}</div>
                            <div style="font-size:10.5px; color:#38bdf8; font-weight:700;">${m.fileSize || 'File'} • Tap to Download</div>
                        </div>
                    </div>
                    <span style="background:#38bdf8; color:#020617; padding:5px 9px; border-radius:8px; font-size:11px; font-weight:900; flex-shrink:0;">⬇️ Save</span>
                `;
                bubble.insertBefore(fileCard, bubble.firstChild);
            }

            if (m.audioData && !bubble.querySelector('audio')) {
                const audioWrap = document.createElement('div');
                audioWrap.className = 'nx-audio-player-pill';
                audioWrap.onclick = e => e.stopPropagation();
                audioWrap.innerHTML = `
                    <span style="font-size:18px;">🎤</span>
                    <audio controls preload="metadata" src="${m.audioData}"></audio>
                `;
                bubble.insertBefore(audioWrap, bubble.firstChild);
            }

            let oldPill = rowEl.querySelector('.nx-floating-react-pill');
            if (oldPill) oldPill.remove();

            let likes = Array.isArray(m.likes) ? m.likes : [];
            if (likes.length > 0) {
                let emoji = m.reaction || '❤️';
                const pill = document.createElement('div');
                pill.className = 'nx-floating-react-pill';
                pill.onclick = (e) => {
                    e.stopPropagation();
                    Nexus.toast(`${emoji} Reacted by: @${likes.join(', @')}`);
                };
                pill.innerHTML = `<span>${emoji}</span><span>${likes.length}</span>`;
                rowEl.appendChild(pill);
            }
        });

        if (hasOlderMessages && !document.getElementById('nx-load-older-dm-btn')) {
            const loadBtn = document.createElement('button');
            loadBtn.id = 'nx-load-older-dm-btn';
            loadBtn.type = 'button';
            loadBtn.onclick = () => {
                currentRenderLimit += 40;
                renderWindowedMessages(myUname, true);
            };
            loadBtn.style.cssText = "margin:0 auto 8px auto; background:#182229; border:1px solid #2a3942; color:#38bdf8; padding:6px 14px; border-radius:16px; font-size:11.5px; font-weight:800; cursor:pointer; display:block;";
            loadBtn.innerText = `⬆️ Load Older Messages (${olderCount} more)`;
            msgBox.insertBefore(loadBtn, msgBox.firstChild);
        }

        if (window.NexusSuperChat && NexusSuperChat.postRenderChatEnhancements) {
            NexusSuperChat.postRenderChatEnhancements();
        }
    }

    // 5. CLEAN HEADER (⋮) + CLEAN 1-CLICK (＋) BOTTOM POPUP TRAY
    function organizeCleanDmHeader(myUname, partnerUname, roomKey) {
        ensureCallOverlays();
        const root = document.getElementById('nx-dm-dedicated-root');
        if (!root) return;

        const closeBtn = root.querySelector('button[onclick*="NexusDM.closeDM"]');
        if (closeBtn && !document.getElementById('nx-dm-power-tools')) {
            closeBtn.style.display = 'none';
            const toolsWrap = document.createElement('div');
            toolsWrap.id = 'nx-dm-power-tools';
            toolsWrap.style.cssText = "display:flex; align-items:center; gap:6px; flex-shrink:0;";
            toolsWrap.innerHTML = `
                <button type="button" onclick="NexusPower.openCleanHeaderMenu()" style="background:#2a3942; border:none; color:#e9edef; width:36px; height:36px; border-radius:50%; cursor:pointer; font-size:19px; font-weight:900; display:flex; align-items:center; justify-content:center;" title="All Chat Options">⋮</button>
            `;
            closeBtn.parentNode.insertBefore(toolsWrap, closeBtn);
        }

        const msgBox = document.getElementById('nx-dm-msgs-box');
        if (msgBox && !document.getElementById('nx-dm-vanish-banner')) {
            const vBan = document.createElement('div');
            vBan.id = 'nx-dm-vanish-banner';
            vBan.className = 'nx-dm-vanish-banner';
            msgBox.parentNode.insertBefore(vBan, msgBox);
        }

        if (msgBox && !document.getElementById('nx-dm-pinned-bar')) {
            const pinBar = document.createElement('div');
            pinBar.id = 'nx-dm-pinned-bar';
            pinBar.className = 'nx-dm-pinned-bar';
            msgBox.parentNode.insertBefore(pinBar, msgBox);
        }

        if (msgBox && !document.getElementById('nx-dm-mini-song-bar')) {
            const songBar = document.createElement('div');
            songBar.id = 'nx-dm-mini-song-bar';
            songBar.className = 'nx-mini-song-bar';
            msgBox.parentNode.insertBefore(songBar, msgBox);
        }

        if (msgBox && !document.getElementById('nx-dm-watchparty-box')) {
            const wpBox = document.createElement('div');
            wpBox.id = 'nx-dm-watchparty-box';
            wpBox.style.cssText = "display:none; background:#000; border-bottom:1px solid #2a3942; flex-shrink:0;";
            msgBox.parentNode.insertBefore(wpBox, msgBox);
        }

        if (msgBox && !document.getElementById('nx-dm-search-bar')) {
            const sBar = document.createElement('div');
            sBar.id = 'nx-dm-search-bar';
            sBar.style.cssText = "display:none; padding:8px 12px; background:#182229; border-bottom:1px solid #2a3942; align-items:center; gap:8px; flex-shrink:0;";
            sBar.innerHTML = `
                <input type="text" id="nx-dm-search-input" placeholder="🔍 Search in chat..." oninput="NexusPower.filterChatHistory(this.value)" style="flex:1; padding:7px 12px; border-radius:16px; border:1px solid #334155; background:#0b141a; color:white; font-size:12.5px; outline:none;">
                <span id="nx-dm-search-count" style="font-size:11px; color:#00a884; font-weight:800;"></span>
                <button type="button" onclick="NexusPower.toggleChatSearch()" style="background:none; border:none; color:#ef4444; font-weight:bold; cursor:pointer;">✕</button>
            `;
            msgBox.parentNode.insertBefore(sBar, msgBox);
        }

        // NEXUS 1-CLICK (＋) POPUP TRAY ABOVE INPUT BAR
        if (!document.getElementById('nx-dm-bottom-tray')) {
            const tray = document.createElement('div');
            tray.id = 'nx-dm-bottom-tray';
            tray.style.cssText = "display:none; grid-template-columns:repeat(3, 1fr); gap:10px; padding:14px; background:#182229; border-top:1.5px solid #00a884; box-shadow:0 -10px 25px rgba(0,0,0,0.65); z-index:25; flex-shrink:0;";
            tray.innerHTML = `
                <button type="button" onclick="NexusPower.toggleBottomTray(false); document.getElementById('nx-dm-file-in').click();" style="background:#202c33; border:1px solid #2a3942; border-radius:14px; padding:10px 6px; color:#f8fafc; display:flex; flex-direction:column; align-items:center; gap:5px; cursor:pointer;">
                    <span style="font-size:22px;">📷</span><span style="font-size:11px; font-weight:800;">Photo</span>
                </button>
                <button type="button" id="nx-view-once-toggle" onclick="NexusPower.toggleBottomTray(false); NexusPower.toggleViewOnceMode();" style="background:#202c33; border:1px dashed #00a884; border-radius:14px; padding:10px 6px; color:#5eead4; display:flex; flex-direction:column; align-items:center; gap:5px; cursor:pointer;">
                    <span style="font-size:20px; font-weight:900;">①</span><span style="font-size:11px; font-weight:800;">View-Once</span>
                </button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); document.getElementById('nx-dm-doc-file-in').click();" style="background:#202c33; border:1px solid #2a3942; border-radius:14px; padding:10px 6px; color:#38bdf8; display:flex; flex-direction:column; align-items:center; gap:5px; cursor:pointer;">
                    <span style="font-size:22px;">📂</span><span style="font-size:11px; font-weight:800;">PDF / File</span>
                </button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); NexusPower.openSongSearchModal();" style="background:#202c33; border:1px solid #2a3942; border-radius:14px; padding:10px 6px; color:#f472b6; display:flex; flex-direction:column; align-items:center; gap:5px; cursor:pointer;">
                    <span style="font-size:22px;">🎵</span><span style="font-size:11px; font-weight:800;">Full Song</span>
                </button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); NexusPower.openWatchPartyModal();" style="background:#202c33; border:1px solid #2a3942; border-radius:14px; padding:10px 6px; color:#a78bfa; display:flex; flex-direction:column; align-items:center; gap:5px; cursor:pointer;">
                    <span style="font-size:22px;">🎬</span><span style="font-size:11px; font-weight:800;">Watch-Party</span>
                </button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); NexusPower.openAdvanceVanishModal();" style="background:#202c33; border:1px solid #2a3942; border-radius:14px; padding:10px 6px; color:#fbbf24; display:flex; flex-direction:column; align-items:center; gap:5px; cursor:pointer;">
                    <span style="font-size:22px;">⏳</span><span style="font-size:11px; font-weight:800;">Vanish Mode</span>
                </button>
            `;
            const replyBar = document.getElementById('nx-dm-reply-bar');
            if (replyBar && replyBar.parentNode) replyBar.parentNode.insertBefore(tray, replyBar);
            else root.appendChild(tray);
        }

        const camBtn = root.querySelector('button[onclick*="nx-dm-file-in"]');
        if (camBtn && !document.getElementById('nx-dm-plus-hub-btn')) {
            camBtn.style.display = 'none';
            const plusBtn = document.createElement('button');
            plusBtn.type = 'button';
            plusBtn.id = 'nx-dm-plus-hub-btn';
            plusBtn.title = 'Open Nexus Action Hub';
            plusBtn.style.cssText = "width:30px; height:30px; border-radius:50%; background:rgba(0,168,132,0.18); border:1.5px solid #00a884; color:#00a884; font-size:18px; font-weight:900; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; transition:transform 0.2s ease;";
            plusBtn.innerText = '＋';
            plusBtn.onclick = (e) => {
                e.stopPropagation();
                NexusPower.toggleBottomTray();
            };
            camBtn.parentNode.insertBefore(plusBtn, camBtn);
        }

        const micBtn = root.querySelector('button[onclick*="NexusDM.startVoiceDM"]');
        if (micBtn && !micBtn.getAttribute('data-voice-upgraded')) {
            micBtn.setAttribute('data-voice-upgraded', '1');
            micBtn.id = 'nx-real-voice-btn';
            micBtn.title = 'Tap to Record Real Audio Voice Note';
            micBtn.onclick = (e) => {
                e.preventDefault();
                NexusPower.toggleVoiceNoteRecording();
            };
        }
    }

    // 6. SINGLE-INSTANCE SONG SYNC LISTENER
    function listenToRoomMusicSync(roomKey) {
        if (musicSyncUnsub) musicSyncUnsub();
        if (!Nexus.db) return;

        musicSyncUnsub = Nexus.db.collection("nexus_music_sync").doc(roomKey).onSnapshot(doc => {
            const bar = document.getElementById('nx-dm-mini-song-bar');
            if (!bar) return;

            let masterAudio = getSingleMasterAudio();

            if (!doc.exists || !doc.data().playing || !doc.data().audioUrl) {
                bar.style.display = 'none';
                masterAudio.pause();
                currentPlayingUrl = '';
                return;
            }

            let d = doc.data();
            bar.style.display = 'flex';
            bar.innerHTML = `
                <div style="display:flex; align-items:center; gap:9px; min-width:0; flex:1;">
                    <img src="${d.cover || 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3b5/512.webp'}" class="nx-song-disk">
                    <div style="min-width:0; flex:1;">
                        <div style="font-weight:800; color:#5eead4; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">🎵 ${d.title}</div>
                        <div style="font-size:10.5px; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${d.artist || 'Full Song'} • DJ @${d.by}</div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                    <button type="button" onclick="NexusPower.replaySyncedSong()" style="background:#202c33; color:#38bdf8; border:1px solid #334155; padding:4px 8px; border-radius:8px; font-size:11px; font-weight:800; cursor:pointer;">↺</button>
                    <button type="button" onclick="NexusPower.stopSyncedSong()" style="background:#ef4444; color:white; border:none; padding:4px 9px; border-radius:8px; font-size:11px; font-weight:800; cursor:pointer;">✕</button>
                </div>
            `;

            if (currentPlayingUrl !== d.audioUrl || masterAudio.paused) {
                currentPlayingUrl = d.audioUrl;
                masterAudio.pause();
                masterAudio.src = d.audioUrl;
                masterAudio.currentTime = 0;
                masterAudio.play().catch(() => {
                    Nexus.toast("🎵 Tap ↺ on song bar to hear audio!");
                });
            }
        });
    }

    // 7. LIVE WEBRTC INTERNET AUDIO CALL + REAL RINGTONE & VIBRATION
    function startGlobalIncomingCallListener() {
        ensureCallOverlays();
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        if (!me || !Nexus.db || incomingCallUnsub) return;

        incomingCallUnsub = Nexus.db.collection("nexus_voice_calls")
            .where("callee", "==", me.username.toLowerCase())
            .onSnapshot(snap => {
                snap.forEach(doc => {
                    let data = doc.data();
                    if (data.status === 'ringing' && (Date.now() - (data.createdAt || 0) < 45000)) {
                        showIncomingCallPopup(doc.id, data);
                    } else if (data.status === 'ended' || data.status === 'declined') {
                        if (currentCallDocId === doc.id) cleanupVoiceCall(false);
                    }
                });
            });
    }

    function showIncomingCallPopup(callId, data) {
        if (currentCallDocId && currentCallDocId !== callId) return;
        currentCallDocId = callId;
        const inc = document.getElementById('nx-incoming-call-modal');
        if (!inc) return;

        startCallRingtone(true);

        inc.innerHTML = `
            <div style="width:100%; max-width:330px; background:#0f172a; border:2px solid #10b981; border-radius:22px; padding:22px 18px; text-align:center; box-shadow:0 20px 50px rgba(0,0,0,0.9);">
                <div style="width:68px; height:68px; border-radius:50%; background:#10b981; color:#020617; font-size:28px; font-weight:900; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; animation:nxCallPulse 1.2s infinite;">📞</div>
                <div style="font-size:11.5px; color:#10b981; font-weight:900; text-transform:uppercase; margin-bottom:4px;">🔔 Incoming Nexus Audio Call</div>
                <h3 style="font-size:19px; color:#f8fafc; margin-bottom:4px;">${data.callerName || data.caller}</h3>
                <p style="font-size:12px; color:#94a3b8; margin-bottom:18px;">@${data.caller} is calling you live...</p>
                <div style="display:flex; gap:10px;">
                    <button type="button" onclick="NexusPower.declineIncomingCall('${callId}')" style="flex:1; background:#ef4444; color:white; border:none; padding:12px; border-radius:14px; font-weight:900; font-size:13.5px; cursor:pointer;">✕ Decline</button>
                    <button type="button" onclick="NexusPower.acceptIncomingCall('${callId}')" style="flex:1; background:#10b981; color:#020617; border:none; padding:12px; border-radius:14px; font-weight:900; font-size:13.5px; cursor:pointer;">📞 Accept</button>
                </div>
            </div>
        `;
        inc.style.display = 'flex';
    }

    function showActiveCallBar(partnerLabel, statusText) {
        const bar = document.getElementById('nx-active-call-bar');
        if (!bar) return;
        bar.style.display = 'flex';
        bar.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:18px;">🎙️</span>
                <div>
                    <div style="font-weight:800; font-size:13.5px; color:#f8fafc;">${partnerLabel}</div>
                    <div id="nx-call-live-status" style="font-size:11px; color:#5eead4; font-weight:700;">${statusText}</div>
                </div>
            </div>
            <div style="display:flex; gap:8px;">
                <button type="button" id="nx-call-mute-btn" onclick="NexusPower.toggleCallMute()" style="background:#1e293b; color:white; border:1px solid #334155; padding:7px 11px; border-radius:10px; font-size:12px; font-weight:800; cursor:pointer;">${isMicMuted ? '🔇 Muted' : '🎤 Mute'}</button>
                <button type="button" onclick="NexusPower.hangupCall()" style="background:#ef4444; color:white; border:none; padding:7px 12px; border-radius:10px; font-size:12px; font-weight:900; cursor:pointer;">📴 End</button>
            </div>
        `;
    }

    function cleanupVoiceCall(updateCloud) {
        stopCallRingtone();
        const inc = document.getElementById('nx-incoming-call-modal');
        if (inc) inc.style.display = 'none';
        const bar = document.getElementById('nx-active-call-bar');
        if (bar) bar.style.display = 'none';

        if (activeCallDocUnsub) { activeCallDocUnsub(); activeCallDocUnsub = null; }
        if (peerConn) {
            try { peerConn.close(); } catch (e) {}
            peerConn = null;
        }
        if (localAudioStream) {
            localAudioStream.getTracks().forEach(t => t.stop());
            localAudioStream = null;
        }
        if (updateCloud && currentCallDocId && Nexus.db) {
            Nexus.db.collection("nexus_voice_calls").doc(currentCallDocId).update({ status: 'ended' }).catch(() => {});
        }
        currentCallDocId = null;
        isMicMuted = false;
    }

    // 8. SMOOTH SWIPE TO REPLY
    function attachSmoothBidirectionalSwipe(containerId, isCommunityChat) {
        const box = document.getElementById(containerId);
        if (!box || box.__nxSmoothSwipeBound) return;
        box.__nxSmoothSwipeBound = true;

        let startX = 0, startY = 0, deltaX = 0;
        let activeBubble = null;
        let holdTimer = null;
        const indicator = ensureSwipeIndicator();

        box.addEventListener('touchstart', e => {
            const bubble = e.target.closest('[onclick*="openMsgActionMenu"], [onclick*="openCommunityMsgMenu"]');
            if (!bubble) return;
            activeBubble = bubble;
            activeBubble.style.transition = 'none';
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            deltaX = 0;

            clearTimeout(holdTimer);
            holdTimer = setTimeout(() => {
                if (Math.abs(deltaX) < 10 && activeBubble) {
                    if (navigator.vibrate) navigator.vibrate(25);
                    activeBubble.click();
                    activeBubble = null;
                }
            }, 420);
        }, { passive: true });

        box.addEventListener('touchmove', e => {
            if (!activeBubble) return;
            let dx = e.touches[0].clientX - startX;
            let dy = Math.abs(e.touches[0].clientY - startY);

            if (dy > 26 && Math.abs(dx) < 18) {
                clearTimeout(holdTimer);
                activeBubble.style.transition = 'transform 0.18s ease';
                activeBubble.style.transform = '';
                indicator.style.display = 'none';
                activeBubble = null;
                return;
            }

            if (Math.abs(dx) > 10) {
                clearTimeout(holdTimer);
                deltaX = Math.max(-65, Math.min(65, dx));
                activeBubble.style.transform = `translateX(${deltaX}px)`;

                const rect = activeBubble.getBoundingClientRect();
                indicator.style.display = 'flex';
                indicator.style.top = (rect.top + rect.height / 2 - 17) + 'px';
                if (deltaX > 0) {
                    indicator.style.left = Math.max(8, rect.left - 38) + 'px';
                } else {
                    indicator.style.left = Math.min(window.innerWidth - 42, rect.right + 6) + 'px';
                }
                indicator.style.transform = `scale(${Math.min(1.15, Math.abs(deltaX) / 36)})`;
            }
        }, { passive: true });

        const finishSwipe = () => {
            clearTimeout(holdTimer);
            indicator.style.display = 'none';
            if (!activeBubble) return;
            const targetBubble = activeBubble;
            targetBubble.style.transition = 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
            targetBubble.style.transform = '';
            activeBubble = null;

            if (Math.abs(deltaX) >= 36) {
                if (navigator.vibrate) navigator.vibrate(20);
                let rawOnclick = targetBubble.getAttribute('onclick') || '';
                let match = rawOnclick.match(/'([^']+)'/);
                if (match && match[1]) {
                    let msgId = match[1];
                    if (isCommunityChat) {
                        let senderEl = targetBubble.querySelector('span[onclick*="openPublicProfile"]');
                        let senderName = senderEl ? senderEl.innerText.trim() : 'Member';
                        let msgTxt = targetBubble.innerText.replace(/\n/g, ' ').substring(0, 40);
                        if (window.NexusChat) {
                            NexusChat.startReply(senderName, msgTxt);
                            Nexus.toast("↩️ Replying to " + senderName);
                        }
                    } else {
                        NexusPower.execDmAction('reply', msgId);
                        Nexus.toast("↩️ Replying to message");
                    }
                }
            }
            deltaX = 0;
        };

        box.addEventListener('touchend', finishSwipe, { passive: true });
        box.addEventListener('touchcancel', finishSwipe, { passive: true });
    }

    function applySavedChatWallpaper() {
        const msgBox = document.getElementById('nx-dm-msgs-box');
        if (!msgBox) return;
        let savedWpId = localStorage.getItem('nx_dm_wallpaper') || 'default';
        let wp = WALLPAPERS.find(w => w.id === savedWpId) || WALLPAPERS[0];
        msgBox.style.background = wp.css;
    }

    // 9. REAL VOICE NOTE RECORDER
    function startVoiceNoteRecording() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            if (window.NexusDM) NexusDM.startVoiceDM();
            return;
        }

        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            audioChunks = [];
            let options = { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 24000 };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) options = {};

            mediaRecorder = new MediaRecorder(stream, options);
            isRecordingVoice = true;
            recordStartTime = Date.now();

            const btn = document.getElementById('nx-real-voice-btn');
            if (btn) {
                btn.classList.add('nx-voice-rec-active');
                btn.innerText = '⏹️';
            }
            const inp = document.getElementById('nx-dm-input');
            if (inp) inp.placeholder = "🔴 Recording Voice (0s)... Tap ⏹️ to Send";

            recordTimerInt = setInterval(() => {
                let sec = Math.floor((Date.now() - recordStartTime) / 1000);
                if (inp) inp.placeholder = `🔴 Recording Voice (${sec}s)... Tap ⏹️ to Send`;
                if (sec >= 25) stopVoiceNoteRecording(false);
            }, 500);

            mediaRecorder.ondataavailable = e => {
                if (e.data && e.data.size > 0) audioChunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                stream.getTracks().forEach(t => t.stop());
                clearInterval(recordTimerInt);
                const btnEl = document.getElementById('nx-real-voice-btn');
                if (btnEl) {
                    btnEl.classList.remove('nx-voice-rec-active');
                    btnEl.innerText = '🎙️';
                }
                const inpEl = document.getElementById('nx-dm-input');
                if (inpEl) inpEl.placeholder = "Message...";

                if (audioChunks.length === 0) return;
                const blob = new Blob(audioChunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onloadend = () => sendRealVoiceNoteToCloud(reader.result);
                reader.readAsDataURL(blob);
            };

            mediaRecorder.start();
            Nexus.toast("🎤 Recording Voice... Tap ⏹️ to Send!");
        }).catch(() => {
            if (window.NexusDM) NexusDM.startVoiceDM();
        });
    }

    function stopVoiceNoteRecording(cancelOnly) {
        isRecordingVoice = false;
        if (cancelOnly) audioChunks = [];
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
    }

    function sendRealVoiceNoteToCloud(base64Audio) {
        let me = Nexus.getCurrentUser();
        if (!me || !currentChatPartnerUname || !Nexus.db) return;

        Nexus.db.collection("nexus_private_dms").add({
            roomKey: currentActiveRoomKey,
            participants: [me.username.toLowerCase(), currentChatPartnerUname.toLowerCase()],
            fromUser: me.username,
            fromName: me.name,
            toUser: currentChatPartnerUname,
            text: "🎤 Voice Note",
            audioData: base64Audio,
            imgUrl: "",
            sticker: null,
            replyTo: null,
            likes: [],
            seen: false,
            edited: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: Date.now()
        }).then(() => {
            Nexus.toast("🎤 Voice Note Sent!");
        });
    }

    // 10. PUBLIC API
    window.NexusPower = {
        toggleBottomTray: function(forceState) {
            const tray = document.getElementById('nx-dm-bottom-tray');
            const pBtn = document.getElementById('nx-dm-plus-hub-btn');
            if (!tray) return;
            let show = typeof forceState === 'boolean' ? forceState : (tray.style.display === 'none');
            tray.style.display = show ? 'grid' : 'none';
            if (pBtn) pBtn.style.transform = show ? 'rotate(45deg)' : 'rotate(0deg)';
        },

        // 📘 COMPLETE NEXUS FEATURE GUIDE & "WHAT IS NEXUS?" MODAL (Opens on New Login & from Settings!)
        openNexusGuideModal: function(isAutoLoginPopup) {
            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            const modal = ensureActionModalExists();

            modal.innerHTML = `
                <div class="nx-msg-action-sheet" style="width:100%; max-width:390px; background:#0b141a; border:2px solid #00a884; border-radius:22px; padding:16px; max-height:88dvh; display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(0,0,0,0.95);">
                    <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:10px; border-bottom:1px solid #233138; margin-bottom:10px;">
                        <div>
                            <span style="font-size:10.5px; color:#10b981; font-weight:900; text-transform:uppercase;">🚀 Official Platform Manual</span>
                            <h3 style="font-size:17px; color:#f8fafc; margin:2px 0 0 0;">What is Nexus &amp; How It Works</h3>
                        </div>
                        <button type="button" onclick="NexusPower.dismissNexusGuide()" style="background:#1e293b; border:1px solid #334155; color:#cbd5e1; padding:5px 10px; border-radius:10px; font-size:11.5px; font-weight:800; cursor:pointer;">Skip ✕</button>
                    </div>

                    <div style="overflow-y:auto; flex:1; padding-right:4px;">
                        <div class="nx-guide-card" style="border-left-color:#38bdf8; background:#0f172a;">
                            <h4>🌐 What is Nexus? (Nexus Kya Hai?)</h4>
                            <p><b>Nexus</b> ek next-generation Live Student &amp; Creator Community Platform hai. Yahan aap bina apna mobile number share kiye doston se 1:1 Personal Chat, Live Internet Voice Call, Full-Length Song Sync, YouTube Watch-Party, aur Group Study Rooms mein jud sakte hain.</p>
                        </div>

                        <div class="nx-guide-card">
                            <h4>➕ 1. Chat Bottom Plus (＋) Smart Tray (Kahan Hai: Message Box Ke Bagal Mein)</h4>
                            <p>1:1 Chat ya Group Chat mein niche <b>＋ button</b> dabane par 6 Pro tools khulte hain:<br>
                            • <b>📷 Photo:</b> HD photo bhejein (photo par click karke Zoom &amp; Download karein).<br>
                            • <b>① View-Once Secret:</b> Anti-Screenshot secret photo/text bhejein jo 1 ungli daba kar rakhne par hi dikhta hai aur dekhte hi destroy ho jata hai.<br>
                            • <b>📂 PDF / File:</b> Koi bhi PDF note, Code file (.html, .js, .py) ya ZIP seedha chat mein share karein.<br>
                            • <b>🎵 Full Song:</b> Bina link copy kiye gane ka naam search karein aur dono doston ke phone mein ek sath pura gana bajayein.<br>
                            • <b>🎬 Watch-Party:</b> Chat ke upar ek sath YouTube video dekhte huye baat karein.<br>
                            • <b>⏳ Vanish Mode:</b> 1 min, 5 min, 1 hr ya 24 hr baad messages apne-aap delete hone ka timer lagayein.</p>
                        </div>

                        <div class="nx-guide-card">
                            <h4>⋮ 2. Top 3-Dots (⋮) Chat Menu &amp; 📞 Live Audio Call (Kahan Hai: Chat Ke Upar Right Corner Mein)</h4>
                            <p>Chat ke upar <b>⋮ button</b> dabane par aapko milega:<br>
                            • <b>📞 Live Internet Audio Call:</b> Bina SIM number ke internet se live call lagayein (samne wale ke phone mein asli घंटी aur vibration hoga).<br>
                            • <b>🔒 Secret PIN Lock:</b> Apni kisi bhi personal chat par 4-digit PIN lock lagayein.<br>
                            • <b>🔍 Search &amp; 🧹 Speed Boost:</b> Purane messages search karein ya old chat clear karke speed badhayein.</p>
                        </div>

                        <div class="nx-guide-card">
                            <h4>🎤 3. Real Voice Notes &amp; Fast Speed (1x / 1.5x / 2x)</h4>
                            <p>Message bar mein <b>🎙️ Mic</b> daba kar apनी aawaz mein Voice Note bhejein aur <b>1x / 1.5x / 2x</b> button se fast sunein.</p>
                        </div>

                        <div class="nx-guide-card">
                            <h4>💬 4. Message Gestures (Swipe, Double-Tap &amp; ➕ Any Emoji)</h4>
                            <p>• Kisi bhi message ko <b>Left ya Right Swipe</b> karke turant Reply karein.<br>
                            • Message par tap karke <b>➕ button</b> se apne keyboard ki koi bhi emoji react karein ya <b>📌 Pin to Top</b> karein.</p>
                        </div>

                        <div class="nx-guide-card">
                            <h4>🏛️ 5. Community Group Rooms (Polls 📊, Code 💻 &amp; Whisper 🔐)</h4>
                            <p>Chat tab ke Group Rooms mein aap <b>📊 Live Voting Poll</b>, <b>💻 Copyable Code Box</b>, aur <b>🔐 Locked Whisper</b> (jo group mein sirf chune gaye @username ke liye khulega) bhej sakte hain.</p>
                        </div>

                        <div class="nx-guide-card">
                            <h4>🔄 6. Multi-Account Switcher &amp; 💭 Live Mood Notes</h4>
                            <p>• <b>Settings Tab:</b> Bina PIN dale 1-Tap mein apni 2-3 IDs switch karein.<br>
                            • <b>Home Stories Bar:</b> Apne naam ke upar <b>💭 + Note</b> daba kar apna live mood set karein.</p>
                        </div>
                    </div>

                    <div style="display:flex; gap:8px; padding-top:10px; border-top:1px solid #233138; margin-top:8px;">
                        <button type="button" onclick="NexusPower.dismissNexusGuide()" style="flex:1; background:#1e293b; color:#94a3b8; border:1px solid #334155; padding:11px; border-radius:12px; font-weight:800; font-size:13px; cursor:pointer;">Skip</button>
                        <button type="button" onclick="NexusPower.dismissNexusGuide()" style="flex:2; background:linear-gradient(135deg,#10b981,#059669); color:#020617; border:none; padding:11px; border-radius:12px; font-weight:900; font-size:13.5px; cursor:pointer;">Done / Got It ✓</button>
                    </div>
                </div>
            `;
            modal.style.display = 'flex';

            if (me && me.username) {
                localStorage.setItem('nx_welcome_guide_seen_' + me.username.toLowerCase(), 'true');
            }
        },

        dismissNexusGuide: function() {
            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (me && me.username) {
                localStorage.setItem('nx_welcome_guide_seen_' + me.username.toLowerCase(), 'true');
            }
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
        },

        openCleanHeaderMenu: function() {
            const modal = ensureActionModalExists();
            let totalMsgs = allRoomMessagesFull.length;
            let lockedMap = {};
            try { lockedMap = JSON.parse(localStorage.getItem('nx_locked_chats_v1') || '{}'); } catch (e) {}
            let isLocked = Boolean(lockedMap[(currentChatPartnerUname || '').toLowerCase()]);

            modal.innerHTML = `
                <div class="nx-msg-action-sheet" style="width:100%; max-width:340px; background:#182229; border:1px solid #2a3942; border-radius:20px; padding:15px; max-height:86dvh; overflow-y:auto;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <strong style="color:#f8fafc; font-size:15px;">⚙️ Pro Chat Menu (@${currentChatPartnerUname})</strong>
                        <button type="button" onclick="document.getElementById('nx-msg-action-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:16px; cursor:pointer;">✕</button>
                    </div>

                    <button type="button" class="nx-menu-opt-btn" style="color:#10b981; border-color:rgba(16,185,129,0.4);" onclick="document.getElementById('nx-msg-action-modal').style.display='none'; NexusPower.startInternetCall('${currentChatPartnerUname}');">
                        <span>📞</span> <span>Live Internet Audio Call (With Ring 🔔)</span>
                    </button>

                    <button type="button" class="nx-menu-opt-btn" style="color:#38bdf8; border-color:rgba(56,189,248,0.4);" onclick="document.getElementById('nx-msg-action-modal').style.display='none'; NexusPower.openSongSearchModal();">
                        <span>🎵</span> <span>Listen Full Song Together (Search)</span>
                    </button>

                    <button type="button" class="nx-menu-opt-btn" style="color:#a78bfa; border-color:rgba(167,139,250,0.4);" onclick="document.getElementById('nx-msg-action-modal').style.display='none'; NexusPower.openWatchPartyModal();">
                        <span>🎬</span> <span>YouTube Video Watch-Party</span>
                    </button>

                    <button type="button" class="nx-menu-opt-btn" style="color:#5eead4; border-color:rgba(94,234,212,0.35);" onclick="document.getElementById('nx-msg-action-modal').style.display='none'; document.getElementById('nx-dm-doc-file-in').click();">
                        <span>📂</span> <span>Send PDF, Code or Document File</span>
                    </button>

                    <button type="button" class="nx-menu-opt-btn" style="color:#fde047; border-color:rgba(253,224,71,0.35);" onclick="NexusPower.openAdvanceVanishModal()">
                        <span>⏳</span> <span>Auto-Vanish Mode (${activeRoomVanishMs > 0 ? 'ON 🔥' : 'OFF'})</span>
                    </button>

                    <button type="button" class="nx-menu-opt-btn" onclick="document.getElementById('nx-msg-action-modal').style.display='none'; NexusPower.toggleChatPinLock();">
                        <span>${isLocked ? '🔓' : '🔒'}</span> <span>${isLocked ? 'Remove PIN Lock from Chat' : 'Lock This Chat with Secret PIN'}</span>
                    </button>

                    <button type="button" class="nx-menu-opt-btn" onclick="document.getElementById('nx-msg-action-modal').style.display='none'; NexusPower.toggleChatSearch();">
                        <span>🔍</span> <span>Search in Chat (${totalMsgs} msgs)</span>
                    </button>

                    <button type="button" class="nx-menu-opt-btn" onclick="NexusPower.openWallpaperPicker()">
                        <span>🎨</span> <span>Change Chat Theme / Wallpaper</span>
                    </button>

                    <button type="button" class="nx-menu-opt-btn" style="color:#fbbf24; border-color:rgba(251,191,36,0.35);" onclick="NexusPower.clearOldChatMessages()">
                        <span>🧹</span> <span>Clear Old Chat (Boost Speed ⚡)</span>
                    </button>

                    <button type="button" class="nx-menu-opt-btn" style="color:#f87171; margin-bottom:0;" onclick="document.getElementById('nx-msg-action-modal').style.display='none'; NexusDM.closeDM();">
                        <span>✕</span> <span>Close Chat Window</span>
                    </button>
                </div>
            `;
            modal.style.display = 'flex';
        },

        // 🔍 PRO PHOTO LIGHTBOX WITH ZOOM IN/OUT & 1-TAP DOWNLOAD
        openImageLightbox: function(imgSrc) {
            if (!imgSrc) return;
            const lb = ensureLightboxModal();
            currentLightboxZoom = 1;

            lb.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; z-index:5;">
                    <span style="color:#38bdf8; font-weight:800; font-size:13px;">🖼️ HD Photo Viewer</span>
                    <div style="display:flex; gap:8px;">
                        <button type="button" onclick="NexusPower.zoomLightbox(-0.4)" style="background:#1e293b; color:white; border:1px solid #334155; width:36px; height:36px; border-radius:50%; font-size:16px; font-weight:900; cursor:pointer;">➖</button>
                        <button type="button" onclick="NexusPower.zoomLightbox(0.4)" style="background:#1e293b; color:white; border:1px solid #334155; width:36px; height:36px; border-radius:50%; font-size:16px; font-weight:900; cursor:pointer;">➕</button>
                        <button type="button" onclick="NexusPower.downloadImageDirectly('${imgSrc.replace(/'/g, "\\'")}')" style="background:#10b981; color:#020617; border:none; padding:0 12px; height:36px; border-radius:18px; font-size:12px; font-weight:900; cursor:pointer;">⬇️ Save</button>
                        <button type="button" onclick="document.getElementById('nx-pro-lightbox').style.display='none'" style="background:#ef4444; color:white; border:none; width:36px; height:36px; border-radius:50%; font-size:16px; font-weight:900; cursor:pointer;">✕</button>
                    </div>
                </div>
                <div style="flex:1; display:flex; align-items:center; justify-content:center; overflow:auto; margin:10px 0;" ondblclick="NexusPower.zoomLightbox(currentLightboxZoom === 1 ? 1.2 : -99)">
                    <img id="nx-lightbox-img-el" src="${imgSrc}" style="max-width:100%; max-height:80dvh; object-fit:contain; border-radius:12px; transition:transform 0.18s ease; transform:scale(1);">
                </div>
                <div style="text-align:center; font-size:11px; color:#94a3b8;">Double-tap photo or use ➕ / ➖ to Zoom • Tap ⬇️ Save to Download</div>
            `;
            lb.style.display = 'flex';
        },

        zoomLightbox: function(delta) {
            const imgEl = document.getElementById('nx-lightbox-img-el');
            if (!imgEl) return;
            if (delta === -99) currentLightboxZoom = 1;
            else currentLightboxZoom = Math.max(0.6, Math.min(4, currentLightboxZoom + delta));
            imgEl.style.transform = `scale(${currentLightboxZoom})`;
        },

        downloadImageDirectly: function(srcUrl) {
            const a = document.createElement('a');
            a.href = srcUrl;
            a.download = 'Nexus_Photo_' + Date.now() + '.jpg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            Nexus.toast("⬇️ Downloading Photo to Gallery...");
        },

        downloadSharedFile: function(msgId) {
            let m = allRoomMessagesFull.find(x => x.id === msgId);
            if (!m || !m.fileData) return;
            const a = document.createElement('a');
            a.href = m.fileData;
            a.download = m.fileName || ('Nexus_File_' + Date.now());
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            Nexus.toast(`⬇️ Downloading "${m.fileName}"!`);
        },

        openAdvanceVanishModal: function() {
            const modal = ensureActionModalExists();
            const modes = [
                { ms: 0, label: "OFF (Keep All Messages)" },
                { ms: 60 * 1000, label: "⚡ 1 Minute Burn (Ultra Spy Mode)" },
                { ms: 5 * 60 * 1000, label: "🔥 5 Minutes Auto-Vanish" },
                { ms: 60 * 60 * 1000, label: "⏳ 1 Hour Disappearing Mode" },
                { ms: 24 * 60 * 60 * 1000, label: "🌙 24 Hours Vanish Mode" }
            ];

            modal.innerHTML = `
                <div class="nx-msg-action-sheet" style="width:100%; max-width:335px; background:#182229; border:1.5px solid #fbbf24; border-radius:20px; padding:16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <strong style="color:#fbbf24; font-size:15px;">⏳ Advance Auto-Vanish Mode</strong>
                        <button type="button" onclick="document.getElementById('nx-msg-action-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:16px; cursor:pointer;">✕</button>
                    </div>
                    <p style="font-size:11.5px; color:#cbd5e1; margin-bottom:12px;">Chune gaye time ke baad is chat ke purane messages apne-aap cloud se delete hote rahenge:</p>
                    ${modes.map(m => `
                        <button type="button" class="nx-menu-opt-btn" style="border-color:${activeRoomVanishMs === m.ms ? '#fbbf24' : '#2a3942'};" onclick="NexusPower.setVanishTimer(${m.ms}, '${m.label}')">
                            <span>${m.label}</span>
                            ${activeRoomVanishMs === m.ms ? '<span style="margin-left:auto; color:#fbbf24;">✓</span>' : ''}
                        </button>
                    `).join('')}
                </div>
            `;
            modal.style.display = 'flex';
        },

        setVanishTimer: function(ms, label) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            if (!currentActiveRoomKey || !Nexus.db) return;

            Nexus.db.collection("nexus_watch_party").doc(currentActiveRoomKey).set({
                vanishMs: ms,
                vanishLabel: label
            }, { merge: true }).then(() => {
                Nexus.toast(ms > 0 ? `⏳ Vanish Mode Set: ${label}` : "⏳ Auto-Vanish Turned OFF");
            });
        },

        toggleChatPinLock: function() {
            let uKey = (currentChatPartnerUname || '').toLowerCase().trim();
            if (!uKey) return;
            let lockedMap = {};
            try { lockedMap = JSON.parse(localStorage.getItem('nx_locked_chats_v1') || '{}'); } catch (e) {}

            if (lockedMap[uKey]) {
                delete lockedMap[uKey];
                localStorage.setItem('nx_locked_chats_v1', JSON.stringify(lockedMap));
                Nexus.toast(`🔓 PIN Lock removed for @${currentChatPartnerUname}`);
            } else {
                let pin = prompt(`🔒 @${currentChatPartnerUname} ki chat lock karne ke liye 4-digit PIN set karein:`);
                if (pin && pin.trim().length >= 3) {
                    lockedMap[uKey] = pin.trim();
                    localStorage.setItem('nx_locked_chats_v1', JSON.stringify(lockedMap));
                    Nexus.toast(`🔒 Chat with @${currentChatPartnerUname} is now PIN-Locked!`);
                }
            }
        },

        pinRoomMessage: function(msgId) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            let m = allRoomMessagesFull.find(x => x.id === msgId);
            if (!m || !m.text || !currentActiveRoomKey || !Nexus.db) return;

            Nexus.db.collection("nexus_watch_party").doc(currentActiveRoomKey).set({
                pinnedText: m.text.substring(0, 90),
                pinnedBy: Nexus.getCurrentUser() ? Nexus.getCurrentUser().username : ''
            }, { merge: true }).then(() => Nexus.toast("📌 Message Pinned to Top!"));
        },

        unpinRoomMessage: function() {
            if (!currentActiveRoomKey || !Nexus.db) return;
            Nexus.db.collection("nexus_watch_party").doc(currentActiveRoomKey).set({
                pinnedText: ""
            }, { merge: true });
        },

        toggleViewOnceMode: function(forceState) {
            viewOnceModeActive = typeof forceState === 'boolean' ? forceState : !viewOnceModeActive;
            const inp = document.getElementById('nx-dm-input');
            if (inp) {
                inp.placeholder = viewOnceModeActive ? "① Type Anti-Screenshot Secret or Pick Photo..." : "Message...";
            }
            if (viewOnceModeActive) Nexus.toast("🛡️ Anti-Screenshot View-Once Mode ON!");
        },

        openViewOnceModal: function(msgId) {
            let me = Nexus.getCurrentUser();
            let m = allRoomMessagesFull.find(x => x.id === msgId);
            if (!m || !me) return;

            if (m.viewedOnce) {
                Nexus.toast("👁️ This secret was already opened & destroyed!");
                return;
            }

            let isReceiver = m.toUser && m.toUser.toLowerCase() === me.username.toLowerCase();
            if (!isReceiver) {
                Nexus.toast("🔒 Only @" + m.toUser + " can open this View-Once secret!");
                return;
            }

            const modal = ensureActionModalExists();
            let canvasHTML = m.secretImg
                ? `<canvas id="nx-vo-protected-canvas" style="width:100%; max-height:330px; display:block; margin:0 auto;"></canvas>`
                : '';
            let txtHTML = m.secretText
                ? `<div style="padding:18px 14px; color:#f8fafc; font-size:15.5px; font-weight:700; line-height:1.5; word-break:break-word;">${m.secretText.replace(/</g, '&lt;')}</div>`
                : '';

            modal.innerHTML = `
                <div class="nx-msg-action-sheet" style="width:100%; max-width:355px; background:#0f172a; border:2px solid #00a884; border-radius:20px; padding:16px; text-align:center; user-select:none; -webkit-user-select:none;" oncontextmenu="return false;">
                    <div style="font-size:11.5px; color:#10b981; font-weight:900; margin-bottom:8px; text-transform:uppercase;">🛡️ Anti-Screenshot Secret (@${m.fromUser})</div>

                    <div class="nx-sec-shield-box" id="nx-vo-shield-wrap">
                        <div id="nx-vo-blur-target" class="nx-sec-blur-layer">
                            ${canvasHTML}
                            ${txtHTML}
                        </div>
                        <div style="position:absolute; inset:0; pointer-events:none; display:flex; align-items:center; justify-content:center; opacity:0.22; font-size:13px; font-weight:900; color:#38bdf8; transform:rotate(-18deg);">
                            🔒 DO NOT SCREENSHOT • @${me.username}
                        </div>
                    </div>

                    <button type="button" id="nx-vo-hold-btn" style="width:100%; background:#1e293b; border:1.5px dashed #38bdf8; color:#38bdf8; padding:12px; border-radius:12px; font-weight:900; font-size:13px; cursor:pointer; margin-bottom:10px; user-select:none;">
                        👆 Hold 1 Finger Here to Unblur Secret
                    </button>

                    <p style="font-size:10.5px; color:#94a3b8; margin-bottom:10px;">⚠️ Screenshot/3-Finger gesture ya ungli hatate hi secret turant blur &amp; destroy ho jayega!</p>
                    <button type="button" onclick="NexusPower.destroyAndCloseViewOnce('${m.id}')" style="width:100%; background:#00a884; color:#020617; border:none; padding:11px; border-radius:12px; font-weight:900; cursor:pointer;">✓ Close &amp; Burn Forever</button>
                </div>
            `;
            modal.style.display = 'flex';

            if (m.secretImg) {
                const cvs = document.getElementById('nx-vo-protected-canvas');
                if (cvs) {
                    const img = new Image();
                    img.onload = () => {
                        cvs.width = img.width;
                        cvs.height = img.height;
                        const ctx = cvs.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                    };
                    img.src = m.secretImg;
                }
            }

            if (Nexus.db) {
                Nexus.db.collection("nexus_private_dms").doc(msgId).update({
                    viewedOnce: true,
                    secretText: "",
                    secretImg: "",
                    text: "👁️ Opened"
                });
            }

            const holdBtn = document.getElementById('nx-vo-hold-btn');
            const blurLayer = document.getElementById('nx-vo-blur-target');
            const lockImmediately = (reason) => {
                if (blurLayer) blurLayer.classList.remove('peek-active');
                if (reason) Nexus.toast(reason);
            };

            if (holdBtn && blurLayer) {
                holdBtn.addEventListener('touchstart', e => {
                    e.preventDefault();
                    if (e.touches.length > 1) {
                        lockImmediately("🚫 Multi-finger screenshot gesture blocked!");
                        return;
                    }
                    blurLayer.classList.add('peek-active');
                }, { passive: false });

                holdBtn.addEventListener('touchend', () => lockImmediately());
                holdBtn.addEventListener('touchcancel', () => lockImmediately());
                holdBtn.addEventListener('mousedown', () => blurLayer.classList.add('peek-active'));
                holdBtn.addEventListener('mouseup', () => lockImmediately());
                holdBtn.addEventListener('mouseleave', () => lockImmediately());
            }

            const trapTouch = e => {
                if (e.touches && e.touches.length > 1) lockImmediately("🚫 Screenshot Protection Triggered!");
            };
            const trapKey = e => {
                if (e.key === 'PrintScreen' || e.keyCode === 44) lockImmediately("🚫 Screenshot Blocked!");
            };
            const trapBlur = () => lockImmediately("🔒 Hidden for Privacy!");

            window.addEventListener('touchstart', trapTouch, { passive: true });
            window.addEventListener('keydown', trapKey);
            window.addEventListener('blur', trapBlur);
            document.addEventListener('visibilitychange', trapBlur);

            modal.__cleanupVoTrap = () => {
                window.removeEventListener('touchstart', trapTouch);
                window.removeEventListener('keydown', trapKey);
                window.removeEventListener('blur', trapBlur);
                document.removeEventListener('visibilitychange', trapBlur);
            };
        },

        destroyAndCloseViewOnce: function() {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) {
                if (modal.__cleanupVoTrap) modal.__cleanupVoTrap();
                modal.style.display = 'none';
                modal.innerHTML = '';
            }
            Nexus.toast("🔥 Secret Permanently Destroyed!");
        },

        // 🎵 FULL-LENGTH SONG SEARCH & SYNC ENGINE (4-5 Min Complete Songs!)
        openSongSearchModal: function() {
            const modal = ensureActionModalExists();
            modal.innerHTML = `
                <div class="nx-msg-action-sheet" style="width:100%; max-width:350px; background:#182229; border:1.5px solid #38bdf8; border-radius:20px; padding:16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <strong style="font-size:15px; color:#38bdf8;">🎵 Full-Length Song Search &amp; Sync</strong>
                        <button type="button" onclick="document.getElementById('nx-msg-action-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:16px; cursor:pointer;">✕</button>
                    </div>
                    <p style="font-size:11.5px; color:#94a3b8; margin-bottom:10px;">Koi bhi Hindi Song ya Singer search karein—dono ke phone mein pura gana ek sath bajega!</p>
                    <div style="display:flex; gap:6px; margin-bottom:12px;">
                        <input type="text" id="nx-live-song-q" placeholder="Search full song (Arijit Singh, Sad, Lofi)..." style="flex:1; padding:9px 12px; border-radius:12px; border:1px solid #334155; background:#0b141a; color:white; font-size:13px; outline:none;">
                        <button type="button" onclick="NexusPower.searchSongsNow()" style="background:#38bdf8; color:#020617; border:none; padding:0 14px; border-radius:12px; font-weight:900; font-size:12.5px; cursor:pointer;">Search</button>
                    </div>
                    <div id="nx-song-results-list" style="display:flex; flex-direction:column; gap:7px; max-height:48vh; overflow-y:auto;"></div>
                </div>
            `;
            modal.style.display = 'flex';

            const inp = document.getElementById('nx-live-song-q');
            if (inp) {
                inp.focus();
                inp.addEventListener('keydown', e => {
                    if (e.key === 'Enter') NexusPower.searchSongsNow();
                });
            }
            this.searchSongsNow('Hindi Sad Song');
        },

        searchSongsNow: function(defaultQuery) {
            const inp = document.getElementById('nx-live-song-q');
            const box = document.getElementById('nx-song-results-list');
            if (!box) return;

            let q = (inp && inp.value.trim()) ? inp.value.trim() : (defaultQuery || 'Arijit Singh');
            box.innerHTML = `<div style="text-align:center; padding:16px; color:#38bdf8; font-size:12.5px;">🔍 Searching Full HD Songs for "${q}"...</div>`;

            fetchFullSongsUniversal(q, list => {
                if (!list.length) {
                    box.innerHTML = `<div style="text-align:center; padding:16px; color:#64748b; font-size:12px;">No songs found. Try another keyword!</div>`;
                    return;
                }
                box.innerHTML = list.map(s => `
                    <div onclick="NexusPower.playSongInRoom('${s.safeTitle}', '${s.safeArtist}', '${s.audioUrl}', '${s.cover}')" style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:8px 10px; background:#202c33; border:1px solid #2a3942; border-radius:12px; cursor:pointer;">
                        <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
                            <img src="${s.cover}" style="width:38px; height:38px; border-radius:8px; object-fit:cover; flex-shrink:0;">
                            <div style="min-width:0; flex:1;">
                                <div style="font-weight:800; font-size:12.5px; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.rawTitle}</div>
                                <div style="font-size:11px; color:#10b981; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">🎵 Full Song • ${s.rawArtist}</div>
                            </div>
                        </div>
                        <span style="background:#00a884; color:#020617; padding:5px 10px; border-radius:10px; font-size:11px; font-weight:900; flex-shrink:0;">▶ Full</span>
                    </div>
                `).join('');
            });
        },

        playSongInRoom: function(title, artist, audioUrl, cover) {
            let me = Nexus.getCurrentUser();
            if (!me || !Nexus.db || !currentActiveRoomKey) return;
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';

            Nexus.db.collection("nexus_music_sync").doc(currentActiveRoomKey).set({
                playing: true,
                title: title,
                artist: artist,
                audioUrl: audioUrl,
                cover: cover,
                by: me.username,
                updatedAt: Date.now()
            }).then(() => {
                Nexus.toast(`🎵 Playing Full Song "${title}"!`);
            });
        },

        replaySyncedSong: function() {
            let masterAudio = getSingleMasterAudio();
            masterAudio.currentTime = 0;
            masterAudio.play().catch(() => {});
        },

        stopSyncedSong: function() {
            if (!Nexus.db || !currentActiveRoomKey) return;
            Nexus.db.collection("nexus_music_sync").doc(currentActiveRoomKey).set({
                playing: false,
                audioUrl: ""
            });
        },

        // 📞 WebRTC Internet Voice Call Methods
        startInternetCall: async function(partnerUsername) {
            ensureCallOverlays();
            let me = Nexus.getCurrentUser();
            let targetU = partnerUsername || currentChatPartnerUname;
            if (!me || !Nexus.db || !targetU) return;

            try {
                localAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (e) {
                Nexus.toast("⚠️ Please allow Microphone permission for Audio Call!");
                return;
            }

            showActiveCallBar(`@${targetU}`, '🔔 Ringing on friend\'s phone...');
            startCallRingtone(false);

            peerConn = new RTCPeerConnection(RTC_CONFIG);
            localAudioStream.getTracks().forEach(t => peerConn.addTrack(t, localAudioStream));

            peerConn.ontrack = ev => {
                const remAudio = document.getElementById('nx-remote-call-audio');
                if (remAudio && ev.streams && ev.streams[0]) {
                    remAudio.srcObject = ev.streams[0];
                    remAudio.play().catch(() => {});
                }
            };

            let callerCandidates = [];
            peerConn.onicecandidate = ev => {
                if (ev.candidate && currentCallDocId) {
                    callerCandidates.push(ev.candidate.toJSON());
                    Nexus.db.collection("nexus_voice_calls").doc(currentCallDocId).update({
                        callerCandidates: callerCandidates
                    }).catch(() => {});
                }
            };

            const offer = await peerConn.createOffer();
            await peerConn.setLocalDescription(offer);

            const docRef = await Nexus.db.collection("nexus_voice_calls").add({
                caller: me.username.toLowerCase(),
                callerName: me.name,
                callee: targetU.toLowerCase(),
                status: 'ringing',
                offer: { type: offer.type, sdp: offer.sdp },
                callerCandidates: [],
                calleeCandidates: [],
                createdAt: Date.now()
            });

            currentCallDocId = docRef.id;
            let addedCalleeIce = new Set();

            activeCallDocUnsub = Nexus.db.collection("nexus_voice_calls").doc(docRef.id).onSnapshot(async snap => {
                if (!snap.exists) return;
                let d = snap.data();
                if (d.status === 'declined' || d.status === 'ended') {
                    stopCallRingtone();
                    Nexus.toast("📴 Call Ended");
                    cleanupVoiceCall(false);
                    return;
                }
                if (d.answer && peerConn && !peerConn.currentRemoteDescription) {
                    stopCallRingtone();
                    await peerConn.setRemoteDescription(new RTCSessionDescription(d.answer));
                    const stEl = document.getElementById('nx-call-live-status');
                    if (stEl) stEl.innerText = '🟢 Connected • Live Audio';
                }
                if (Array.isArray(d.calleeCandidates) && peerConn && peerConn.currentRemoteDescription) {
                    d.calleeCandidates.forEach(c => {
                        let key = JSON.stringify(c);
                        if (!addedCalleeIce.has(key)) {
                            addedCalleeIce.add(key);
                            peerConn.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
                        }
                    });
                }
            });
        },

        acceptIncomingCall: async function(callId) {
            stopCallRingtone();
            const inc = document.getElementById('nx-incoming-call-modal');
            if (inc) inc.style.display = 'none';

            try {
                localAudioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (e) {
                Nexus.toast("⚠️ Microphone permission required to answer call!");
                this.declineIncomingCall(callId);
                return;
            }

            const docSnap = await Nexus.db.collection("nexus_voice_calls").doc(callId).get();
            if (!docSnap.exists) return;
            let d = docSnap.data();

            currentCallDocId = callId;
            showActiveCallBar(d.callerName || `@${d.caller}`, '🟢 Connected • Live Audio');

            peerConn = new RTCPeerConnection(RTC_CONFIG);
            localAudioStream.getTracks().forEach(t => peerConn.addTrack(t, localAudioStream));

            peerConn.ontrack = ev => {
                const remAudio = document.getElementById('nx-remote-call-audio');
                if (remAudio && ev.streams && ev.streams[0]) {
                    remAudio.srcObject = ev.streams[0];
                    remAudio.play().catch(() => {});
                }
            };

            let calleeCandidates = [];
            peerConn.onicecandidate = ev => {
                if (ev.candidate) {
                    calleeCandidates.push(ev.candidate.toJSON());
                    Nexus.db.collection("nexus_voice_calls").doc(callId).update({
                        calleeCandidates: calleeCandidates
                    }).catch(() => {});
                }
            };

            await peerConn.setRemoteDescription(new RTCSessionDescription(d.offer));
            const answer = await peerConn.createAnswer();
            await peerConn.setLocalDescription(answer);

            await Nexus.db.collection("nexus_voice_calls").doc(callId).update({
                status: 'connected',
                answer: { type: answer.type, sdp: answer.sdp }
            });

            let addedCallerIce = new Set();
            activeCallDocUnsub = Nexus.db.collection("nexus_voice_calls").doc(callId).onSnapshot(snap => {
                if (!snap.exists) return;
                let data = snap.data();
                if (data.status === 'ended') {
                    Nexus.toast("📴 Call Ended");
                    cleanupVoiceCall(false);
                    return;
                }
                if (Array.isArray(data.callerCandidates) && peerConn) {
                    data.callerCandidates.forEach(c => {
                        let key = JSON.stringify(c);
                        if (!addedCallerIce.has(key)) {
                            addedCallerIce.add(key);
                            peerConn.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
                        }
                    });
                }
            });
        },

        declineIncomingCall: function(callId) {
            stopCallRingtone();
            if (Nexus.db && callId) {
                Nexus.db.collection("nexus_voice_calls").doc(callId).update({ status: 'declined' }).catch(() => {});
            }
            cleanupVoiceCall(false);
        },

        toggleCallMute: function() {
            if (!localAudioStream) return;
            isMicMuted = !isMicMuted;
            localAudioStream.getAudioTracks().forEach(t => { t.enabled = !isMicMuted; });
            const btn = document.getElementById('nx-call-mute-btn');
            if (btn) btn.innerText = isMicMuted ? '🔇 Muted' : '🎤 Mute';
        },

        hangupCall: function() {
            cleanupVoiceCall(true);
            Nexus.toast("📴 Voice Call Ended");
        },

        clearOldChatMessages: function() {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            if (!Nexus.db || allRoomMessagesFull.length === 0) {
                Nexus.toast("Chat is already clean!");
                return;
            }
            if (!confirm(`Clear old messages in this chat to make it 10x faster? (Latest 10 messages will be kept safe)`)) return;

            let toDelete = allRoomMessagesFull.length > 10
                ? allRoomMessagesFull.slice(0, allRoomMessagesFull.length - 10)
                : allRoomMessagesFull;

            Nexus.toast(`🧹 Cleaning ${toDelete.length} old messages...`);
            toDelete.forEach(m => {
                Nexus.db.collection("nexus_private_dms").doc(m.id).delete().catch(() => {});
            });
            setTimeout(() => Nexus.toast("⚡ Chat Cleaned & Boosted!"), 800);
        },

        toggleMinimizeWatchParty: function() {
            const frame = document.getElementById('nx-wp-frame');
            const btn = document.getElementById('nx-wp-min-btn');
            if (!frame || !btn) return;
            isWatchPartyMinimized = !isWatchPartyMinimized;
            frame.style.height = isWatchPartyMinimized ? '0px' : '170px';
            btn.innerText = isWatchPartyMinimized ? '➕ Show Video' : '➖ Hide Video';
        },

        openWatchPartyModal: function() {
            const modal = ensureActionModalExists();
            const presets = [
                { title: "🌧️ Hindi Lofi / Rain Night Vibe", url: "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&playsinline=1" },
                { title: "🎧 Chill Late Night Study Beats", url: "https://www.youtube.com/embed/DWcJFNfaw9c?autoplay=1&playsinline=1" }
            ];

            modal.innerHTML = `
                <div class="nx-msg-action-sheet" style="width:100%; max-width:345px; background:#182229; border:1px solid #10b981; border-radius:20px; padding:16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <strong style="color:#10b981; font-size:15px;">🎬 Live YouTube Watch-Party</strong>
                        <button type="button" onclick="document.getElementById('nx-msg-action-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:16px; cursor:pointer;">✕</button>
                    </div>
                    <p style="font-size:11.5px; color:#cbd5e1; margin-bottom:10px;">Paste any YouTube video/song link below—dono doston ke chat ke upar ek sath video chalegi!</p>
                    <input type="url" id="nx-wp-url-in" placeholder="Paste YouTube or .mp4 link here..." style="width:100%; padding:10px 12px; border-radius:10px; border:1px solid #334155; background:#0b141a; color:white; font-size:13px; outline:none; margin-bottom:10px;">
                    <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:12px;">
                        ${presets.map(p => `<button type="button" onclick="NexusPower.launchWatchParty('${p.url}')" style="background:#202c33; border:1px solid #2a3942; color:#38bdf8; padding:8px 10px; border-radius:10px; font-size:12px; font-weight:700; text-align:left; cursor:pointer;">▶ ${p.title}</button>`).join('')}
                    </div>
                    <button type="button" onclick="NexusPower.launchWatchParty(document.getElementById('nx-wp-url-in').value)" style="width:100%; background:#10b981; color:#020617; border:none; padding:11px; border-radius:12px; font-weight:900; font-size:14px; cursor:pointer;">🚀 Play Together Now</button>
                </div>
            `;
            modal.style.display = 'flex';
        },

        launchWatchParty: function(rawUrl) {
            let embedUrl = extractYouTubeEmbedUrl(rawUrl);
            if (!embedUrl) {
                Nexus.toast("Please paste a valid YouTube link!");
                return;
            }
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';

            let me = Nexus.getCurrentUser();
            if (!me || !currentActiveRoomKey || !Nexus.db) return;

            Nexus.db.collection("nexus_watch_party").doc(currentActiveRoomKey).set({
                active: true,
                embedUrl: embedUrl,
                startedBy: me.username,
                updatedAt: Date.now()
            }, { merge: true }).then(() => {
                Nexus.toast("🎬 Watch-Party Live for Both Friends!");
            });
        },

        stopWatchParty: function() {
            if (!currentActiveRoomKey || !Nexus.db) return;
            Nexus.db.collection("nexus_watch_party").doc(currentActiveRoomKey).set({
                active: false,
                embedUrl: ""
            }, { merge: true });
        },

        execDmAction: function(action, msgId) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';

            let m = allRoomMessagesFull.find(x => x.id === msgId);
            if (!m || !window.NexusDM) return;

            let sender = m.fromName || m.fromUser || 'User';
            let snippet = m.text || (m.audioData ? '🎤 Voice Note' : (m.sticker ? '✨ Sticker' : '📷 Photo'));

            if (action === 'reply') {
                NexusDM.startReply(sender, snippet);
            } else if (action === 'copy') {
                copyTextUniversal(m.text || '');
            } else if (action === 'edit') {
                NexusDM.startEdit(m.id, m.text || '');
            } else if (action === 'delete') {
                NexusDM.deleteDM(m.id);
            }
        },

        reactDmMsg: function(msgId, emoji) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';

            let me = Nexus.getCurrentUser();
            if (!me || !Nexus.db) return;
            let m = allRoomMessagesFull.find(x => x.id === msgId);
            if (!m) return;

            let likes = Array.isArray(m.likes) ? [...m.likes] : [];
            if (likes.includes(me.username) && m.reaction === emoji) {
                likes = likes.filter(u => u !== me.username);
            } else if (!likes.includes(me.username)) {
                likes.push(me.username);
            }

            m.likes = likes;
            m.reaction = emoji;
            renderWindowedMessages(me.username, true);

            Nexus.db.collection("nexus_private_dms").doc(msgId).update({
                likes: likes,
                reaction: emoji
            });
        },

        toggleVoiceNoteRecording: function() {
            if (isRecordingVoice) stopVoiceNoteRecording(false);
            else startVoiceNoteRecording();
        },

        toggleChatSearch: function() {
            const bar = document.getElementById('nx-dm-search-bar');
            const inp = document.getElementById('nx-dm-search-input');
            if (!bar) return;
            if (bar.style.display === 'none') {
                bar.style.display = 'flex';
                if (inp) inp.focus();
            } else {
                bar.style.display = 'none';
                if (inp) inp.value = '';
                this.filterChatHistory('');
            }
        },

        filterChatHistory: function(query) {
            const msgBox = document.getElementById('nx-dm-msgs-box');
            const cnt = document.getElementById('nx-dm-search-count');
            if (!msgBox) return;
            let q = (query || '').toLowerCase().trim();
            let matchCount = 0;

            Array.from(msgBox.children).forEach(row => {
                if (row.id === 'nx-load-older-dm-btn') return;
                if (!q) {
                    row.style.display = 'flex';
                } else {
                    let match = (row.innerText || '').toLowerCase().includes(q);
                    row.style.display = match ? 'flex' : 'none';
                    if (match) matchCount++;
                }
            });
            if (cnt) cnt.innerText = q ? `${matchCount} found` : '';
        },

        openWallpaperPicker: function() {
            const modal = ensureActionModalExists();
            let currentId = localStorage.getItem('nx_dm_wallpaper') || 'default';

            modal.innerHTML = `
                <div class="nx-msg-action-sheet" style="width:100%; max-width:325px; background:#182229; border:1px solid #2a3942; border-radius:20px; padding:15px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <strong style="color:#f8fafc; font-size:15px;">🎨 Choose 1:1 Chat Theme</strong>
                        <button type="button" onclick="document.getElementById('nx-msg-action-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:16px; cursor:pointer;">✕</button>
                    </div>
                    ${WALLPAPERS.map(w => `
                        <button type="button" class="nx-menu-opt-btn" style="border-color:${currentId === w.id ? '#00a884' : '#2a3942'};" onclick="NexusPower.setWallpaper('${w.id}')">
                            <span>${w.name}</span>
                            ${currentId === w.id ? '<span style="margin-left:auto; color:#00a884;">✓</span>' : ''}
                        </button>
                    `).join('')}
                </div>
            `;
            modal.style.display = 'flex';
        },

        setWallpaper: function(wpId) {
            localStorage.setItem('nx_dm_wallpaper', wpId);
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            applySavedChatWallpaper();
            Nexus.toast("🎨 Chat Wallpaper Updated!");
        },

        // 📲 1-CLICK UNIVERSAL DIRECT APP DOWNLOADER
        installPWA: function() {
            if (deferredPwaPrompt) {
                deferredPwaPrompt.prompt();
                deferredPwaPrompt.userChoice.then(() => { deferredPwaPrompt = null; });
                return;
            }
            Nexus.toast("📲 Downloading Official Nexus App...");
            const appUrl = window.location.origin + window.location.pathname;
            const standaloneHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"><meta name="theme-color" content="#090d16"><meta name="mobile-web-app-capable" content="yes"><title>Nexus Official App</title><style>body,html{margin:0;padding:0;width:100%;height:100%;background:#090d16;overflow:hidden;}iframe{width:100%;height:100%;border:none;}</style></head><body><iframe src="${appUrl}" allow="microphone; camera; autoplay; clipboard-write; encrypted-media"></iframe></body></html>`;
            const blob = new Blob([standaloneHtml], { type: 'text/html' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'Nexus_Official_App.html';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => Nexus.toast("✅ Nexus App Downloaded!"), 900);
        }
    };

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPwaPrompt = e;
    });

    if (window.Nexus && Nexus.listeners && Nexus.listeners.onUsers) {
        Nexus.listeners.onUsers.push(() => setTimeout(checkNewUserLoginGuideAndSettingsBtn, 150));
    }

    document.addEventListener('DOMContentLoaded', () => {
        upgradeDmExperience();
        syncHomeAndProfileFollowers();
        setTimeout(startGlobalIncomingCallListener, 800);
        setInterval(checkNewUserLoginGuideAndSettingsBtn, 1200);
    });
    setTimeout(() => {
        upgradeDmExperience();
        syncHomeAndProfileFollowers();
        startGlobalIncomingCallListener();
        checkNewUserLoginGuideAndSettingsBtn();
    }, 200);
})();
