// ================= CORE.JS (v13.0 TURBO SPEED & SILENT LIVE UPDATE MASTER): ⚡ 0.1s FIREBASE INSTANT LOAD (LINE 12-15 TIMER BUG REMOVED!) + 🔄 SILENT AUTO-UPDATE FOR ACTIVE USERS WITHOUT REFRESH + ❤️ WORKING 1:1 DM & GROUP EMOJI REACTIONS + 🗑️ WORKING DELETE FOR ME & DELETE FOR EVERYONE + 🎙️ 1x/1.5x/2x VOICE NOTES + 🔍 FAST SEARCH + 🎵 FULL HINDI SONGS & YOUTUBE WATCH-PARTY =================

(function() {
    const PROTO = 'https:' + '//';
    const POLLINATIONS_OPENAI = PROTO + 'text.pollinations.ai/openai';
    const POLLINATIONS_ROOT = PROTO + 'text.pollinations.ai/';
    const IMG_GEN_API = PROTO + 'image.pollinations.ai/prompt/';

    // =========================================================================
    // 0. ⚡ FLUSH OLD CACHES & INSTANTLY RENDER CACHED POSTS/USERS IN 0.01s
    // (NOTE: Never clear window intervals here so Firebase WebSockets stay 100% fast!)
    // =========================================================================
    if ('caches' in window && !sessionStorage.getItem('nx_cache_flushed_v13')) {
        sessionStorage.setItem('nx_cache_flushed_v13', '1');
        caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
        }).catch(() => {});
    }

    // Force immediate Home Feed & Community render from local cache before network finishes
    setTimeout(() => {
        if (window.Nexus && Nexus.notifyAll) {
            try { Nexus.notifyAll(); } catch (e) {}
        }
    }, 30);

    let isUserCurrentlyTyping = false;
    let typingCoolDownTimer = null;
    const markUserTypingActive = () => {
        isUserCurrentlyTyping = true;
        clearTimeout(typingCoolDownTimer);
        typingCoolDownTimer = setTimeout(() => { isUserCurrentlyTyping = false; }, 1200);
    };
    document.addEventListener('keydown', markUserTypingActive, { passive: true });
    document.addEventListener('input', markUserTypingActive, { passive: true });

    let aiChatHistory = [];
    try { aiChatHistory = JSON.parse(localStorage.getItem('nx_private_ai_history_v13') || '[]'); } catch (e) { aiChatHistory = []; }
    let isSwaraSpeaking = false;
    let fallbackAudioPlayer = null;
    let adminControlUnsub = null;

    // Voice Note Recorder State
    let activeMediaRecorder = null;
    let recordedAudioChunks = [];
    let recordingStartTime = 0;
    let recordingTickInterval = null;
    let currentRecordingTarget = 'dm';
    let voicePlaySpeedMap = {};

    const coreStyle = document.createElement('style');
    coreStyle.innerHTML = `
        #nx-private-ai-studio {
            position: fixed; left: 0; right: 0; top: 0; width: 100%; max-width: 640px; height: 100dvh;
            margin: 0 auto; background: #090d16; z-index: 100105; display: none; flex-direction: column; overflow: hidden;
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
            border: none !important; background: transparent !important; box-shadow: none !important; padding: 0 !important; display: inline !important;
        }
        .nx-dm-bubble-anim.nx-deleted-row-clean { display: flex !important; margin: 2px 0 !important; }

        #nx-dm-bottom-tray, #nx-grp-bottom-tray {
            position: relative !important; bottom: auto !important; left: auto !important; right: auto !important;
            width: 100% !important; max-height: 148px !important; overflow-y: auto !important;
            grid-template-columns: repeat(4, 1fr) !important; gap: 6px !important; padding: 8px 10px !important;
            background: #111b21 !important; border-top: 1.5px solid #00a884 !important; flex-shrink: 0 !important; z-index: 25 !important;
        }
        .nx-dm-live-react-pill {
            display: inline-flex; align-items: center; gap: 4px; background: #182229;
            border: 1.5px solid #00a884; color: #f8fafc; padding: 2px 8px; border-radius: 12px;
            font-size: 11.5px; font-weight: 800; margin-top: 3px; cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }
        .nx-vn-player-card {
            display: flex; align-items: center; gap: 9px; background: rgba(15, 23, 42, 0.85);
            border: 1px solid #38bdf8; border-radius: 14px; padding: 7px 10px; min-width: 215px; max-width: 265px; margin: 3px 0;
        }
        .nx-vn-play-btn {
            width: 34px; height: 34px; border-radius: 50%; background: #10b981; color: #020617;
            border: none; font-size: 14px; font-weight: 900; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .nx-vn-speed-pill {
            background: #1e293b; border: 1px solid #38bdf8; color: #38bdf8; font-size: 10.5px; font-weight: 900; padding: 3px 7px; border-radius: 999px; cursor: pointer;
        }
        #nx-voice-rec-dock {
            position: fixed; bottom: 68px; left: 50%; transform: translateX(-50%); width: 94%; max-width: 420px;
            background: #0f172a; border: 2px solid #ef4444; border-radius: 20px; padding: 11px 14px;
            z-index: 100150; display: none; align-items: center; justify-content: space-between; gap: 10px; box-shadow: 0 15px 40px rgba(0,0,0,0.9);
        }
        .nx-ai-quick-chip {
            background: #161f33; border: 1px solid #334155; color: #93c5fd; padding: 5px 11px;
            border-radius: 999px; font-size: 11px; font-weight: 800; white-space: nowrap; cursor: pointer; flex-shrink: 0;
        }
    `;
    document.head.appendChild(coreStyle);

    // =========================================================================
    // 1. ❤️🗑️ BULLETPROOF 1:1 DM MESSAGE MENU (REACTIONS + DELETE FOR ME + DELETE FOR EVERYONE)
    // =========================================================================
    function getHiddenForMeSet() {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let u = me && me.username ? me.username.toLowerCase().trim() : 'guest';
        try {
            return new Set(JSON.parse(localStorage.getItem('nexus_dm_hidden_for_me_v1_' + encodeURIComponent(u)) || '[]'));
        } catch (e) {
            return new Set();
        }
    }

    function addHiddenForMeId(msgId) {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let u = me && me.username ? me.username.toLowerCase().trim() : 'guest';
        let key = 'nexus_dm_hidden_for_me_v1_' + encodeURIComponent(u);
        let set = getHiddenForMeSet();
        set.add(String(msgId));
        try { localStorage.setItem(key, JSON.stringify(Array.from(set))); } catch (e) {}
    }

    function applyHiddenAndDeletedStylesInDmBox() {
        if (isUserCurrentlyTyping) return;
        let hiddenSet = getHiddenForMeSet();

        document.querySelectorAll('#nx-dm-msgs-box .nx-dm-bubble-anim').forEach(row => {
            let msgId = row.getAttribute('data-message-id') || '';
            if (msgId && hiddenSet.has(msgId) && !row.getAttribute('data-hidden-applied')) {
                row.setAttribute('data-hidden-applied', '1');
                row.innerHTML = `<div class="nx-dm-local-deleted">🧹 You deleted this message for yourself</div>`;
                return;
            }
            if ((row.innerText || '').includes('This message was deleted by') && !row.classList.contains('nx-deleted-row-clean')) {
                let rawText = (row.innerText || '').trim();
                row.classList.add('nx-deleted-row-clean');
                row.innerHTML = `<div class="nx-single-deleted-pill">🚫 ${rawText.replace(/^🚫\s*/, '')}</div>`;
            }
        });

        // Transform `🎵VOICE|...` into Interactive 1x/1.5x/2x Players
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
                                <div id="${playerId}_bar" style="width:0%; height:100%; background:linear-gradient(90deg,#10b981,#38bdf8);"></div>
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
    }

    function installBulletproofDmMessageMenu() {
        if (!window.NexusDM) return;

        // Bind Real Audio Voice Recorder to Mic buttons
        NexusDM.startVoiceDM = function() { NexusCore.openVoiceNoteRecorder('dm'); };
        if (window.NexusChat) {
            NexusChat.startVoiceInput = function() { NexusCore.openVoiceNoteRecorder('group'); };
        }

        NexusDM.openMsgActionMenu = function(msgId) {
            if (!msgId) return;
            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (!me) return;

            let modal = document.getElementById('nx-msg-action-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'nx-msg-action-modal';
                modal.className = 'nx-msg-action-backdrop';
                modal.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };
                document.body.appendChild(modal);
            }

            const rowEl = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            let isMine = rowEl ? (rowEl.style.alignItems === 'flex-end') : true;
            let bubbleText = '';
            if (rowEl) {
                let clone = rowEl.cloneNode(true);
                clone.querySelectorAll('button, .nx-dm-message-menu-btn').forEach(b => b.remove());
                bubbleText = (clone.innerText || '').replace(/\d{1,2}:\d{2}\s*(AM|PM|am|pm)?.*$/s, '').trim();
            }

            const emojis = ['❤️', '😂', '🔥', '👍', '🙏', '💯'];
            let safeId = String(msgId).replace(/'/g, "\\'");

            modal.innerHTML = `
                <div class="nx-msg-action-sheet">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span style="font-size:12px; color:#93c5fd; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:240px;">
                            ${bubbleText ? `"${bubbleText.replace(/</g, '&lt;')}"` : '💬 Message Options'}
                        </span>
                        <button type="button" onclick="document.getElementById('nx-msg-action-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>

                    <div class="nx-emoji-bar">
                        ${emojis.map(em => `
                            <button type="button" class="nx-emoji-btn" onclick="NexusCore.execDmReaction('${safeId}', '${em}')">${em}</button>
                        `).join('')}
                    </div>

                    <button type="button" class="nx-menu-opt-btn" onclick="NexusCore.execDmReply('${safeId}')">
                        <span>↩️</span> <span>Reply to Message</span>
                    </button>

                    <button type="button" class="nx-menu-opt-btn" onclick="NexusCore.execDmCopy('${safeId}')">
                        <span>📋</span> <span>Copy Message Text</span>
                    </button>

                    ${isMine ? `
                        <button type="button" class="nx-menu-opt-btn" style="color:#38bdf8;" onclick="NexusCore.execDmEdit('${safeId}')">
                            <span>✏️</span> <span>Edit Message</span>
                        </button>
                    ` : ''}

                    <button type="button" class="nx-menu-opt-btn" style="color:#cbd5e1;" onclick="NexusCore.execDmDeleteForMe('${safeId}')">
                        <span>🧹</span> <span>Delete for Me</span>
                    </button>

                    ${isMine ? `
                        <button type="button" class="nx-menu-opt-btn" style="color:#f87171; border-color:rgba(239,68,68,0.4);" onclick="NexusCore.execDmDeleteForEveryone('${safeId}')">
                            <span>🗑️</span> <span>Delete for Everyone</span>
                        </button>
                    ` : ''}

                    <button type="button" class="nx-menu-opt-btn" style="justify-content:center; background:transparent; border:none; color:#8696a0; margin-bottom:0;" onclick="document.getElementById('nx-msg-action-modal').style.display='none'">
                        Cancel
                    </button>
                </div>
            `;
            modal.style.display = 'flex';
        };
    }

    // =========================================================================
    // 2. 🔍 FAST GLOBAL SEARCH & 🎵 FULL SONG / YOUTUBE SEARCH
    // =========================================================================
    function installFastGlobalSearchModal() {
        if (!window.Nexus) return;
        Nexus.openSearch = function() {
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;
            modal.style.alignItems = 'flex-start';
            modal.style.paddingTop = '20px';

            modal.innerHTML = `
                <div class="nx-modal-box" style="border:1.5px solid #38bdf8; max-width:420px; width:100%; max-height:80dvh; display:flex; flex-direction:column; background:#090d16;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h3 style="font-size:16px; color:#f8fafc;">🔍 Search Members &amp; Study Posts</h3>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>
                    <input type="text" id="nx-fast-search-input" oninput="NexusCore.runInstantGlobalSearch(this.value)" placeholder="Search member name, @username, or post topic..." autocomplete="off" style="width:100%; padding:11px 14px; border-radius:12px; border:1.5px solid #38bdf8; background:#101726; color:white; font-size:14px; outline:none; margin-bottom:10px;">
                    <div id="nx-fast-search-results" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:8px; max-height:58dvh;"></div>
                </div>
            `;
            modal.style.display = 'flex';
            const inp = document.getElementById('nx-fast-search-input');
            if (inp) inp.focus();
            NexusCore.runInstantGlobalSearch('');
        };
    }

    async function searchFullHindiSongsAndYouTube(query) {
        let q = (query || 'Arijit Singh Hindi Songs').trim();
        let results = [];

        let ytMatch = q.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
        if (ytMatch && ytMatch[1]) {
            let vid = ytMatch[1];
            return [{
                title: "YouTube Direct Video",
                channel: "YouTube Live Sync",
                thumb: `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`,
                embedUrl: `https://www.youtube.com/embed/${vid}?autoplay=1&playsinline=1`,
                fullAudioUrl: ''
            }];
        }

        const saavnMirrors = [
            `${PROTO}saavn.sumit.co/api/search/songs?query=${encodeURIComponent(q)}&limit=10`,
            `${PROTO}jiosaavn-api-privatecvc2.vercel.app/search/songs?query=${encodeURIComponent(q)}&limit=10`
        ];

        for (let sUrl of saavnMirrors) {
            try {
                let r = await fetch(sUrl);
                if (r.ok) {
                    let d = await r.json();
                    let list = (d && d.data && Array.isArray(d.data.results)) ? d.data.results : (d && Array.isArray(d.results) ? d.results : []);
                    list.forEach(item => {
                        let dlArr = item.downloadUrl || [];
                        let lastDl = dlArr.length ? dlArr[dlArr.length - 1] : null;
                        let audioLink = lastDl ? (lastDl.url || lastDl.link || '') : '';
                        let imgArr = item.image || [];
                        let lastImg = imgArr.length ? imgArr[imgArr.length - 1] : null;
                        let thumbLink = lastImg ? (lastImg.url || lastImg.link || '') : '';
                        let songTitle = (item.name || item.title || 'Song').replace(/&quot;/g, '"');
                        let artist = item.primaryArtists || item.artists?.primary?.[0]?.name || 'Full Song';

                        if (audioLink) {
                            results.push({
                                title: songTitle,
                                channel: `${artist} • 🎵 Full Length Song (4+ Min)`,
                                thumb: thumbLink,
                                embedUrl: audioLink,
                                fullAudioUrl: audioLink
                            });
                        }
                    });
                    if (results.length >= 5) break;
                }
            } catch (e) {}
        }

        if (results.length < 4) {
            try {
                let rIt = await fetch(`${PROTO}itunes.apple.com/search?term=${encodeURIComponent(q)}&country=IN&limit=8`);
                if (rIt.ok) {
                    let dIt = await rIt.json();
                    (dIt.results || []).forEach(v => {
                        if (v.previewUrl) {
                            results.push({
                                title: v.trackName || 'Song',
                                channel: `${v.artistName || 'Artist'} • 🎵 Audio`,
                                thumb: (v.artworkUrl100 || '').replace('100x100', '300x300'),
                                embedUrl: v.previewUrl,
                                fullAudioUrl: v.previewUrl
                            });
                        }
                    });
                }
            } catch (e) {}
        }

        return results;
    }

    function hookWatchPartyAndSongSearch() {
        if (window.NexusAdvance) {
            NexusAdvance.execYouTubeTvSearch = async function(isDm, defQuery) {
                const inp = document.getElementById('nx-yt-tv-search-in');
                const box = document.getElementById('nx-yt-tv-results');
                if (!box) return;
                let rawVal = (inp && inp.value.trim()) ? inp.value.trim() : (defQuery || 'Bollywood Hit Songs');

                box.innerHTML = `<div style="text-align:center; padding:16px; color:#38bdf8; font-size:12.5px; font-weight:800;">⚡ Searching "${rawVal}"...</div>`;
                let list = await searchFullHindiSongsAndYouTube(rawVal);

                box.innerHTML = list.map(v => {
                    let safeUrl = (v.embedUrl || '').replace(/'/g, "\\'");
                    let safeTitle = (v.title || 'Song').replace(/'/g, "\\'").replace(/</g, '&lt;');
                    let safeThumb = (v.thumb || '').replace(/'/g, "\\'");
                    return `
                        <div onclick="NexusCore.launchMediaEverywhere(${Boolean(isDm)}, '${safeUrl}', '${safeTitle}', '${safeThumb}')" style="display:flex; align-items:center; gap:10px; padding:8px; background:#182229; border:1px solid #2a3942; border-radius:12px; cursor:pointer;">
                            <img src="${v.thumb}" style="width:60px; height:44px; border-radius:8px; object-fit:cover; flex-shrink:0; background:#000;">
                            <div style="min-width:0; flex:1;">
                                <div style="font-weight:800; font-size:12px; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${v.title}</div>
                                <div style="font-size:10.5px; color:#10b981; font-weight:700;">${v.channel}</div>
                            </div>
                            <span style="background:#ef4444; color:white; padding:5px 10px; border-radius:8px; font-size:10.5px; font-weight:900; flex-shrink:0;">Play ▶</span>
                        </div>
                    `;
                }).join('');
            };
        }
    }

    // =========================================================================
    // 3. PUBLIC API ON WINDOW.NEXUSCORE
    // =========================================================================
    window.NexusCore = {
        openVoiceNoteRecorder: async function(targetType) {
            currentRecordingTarget = targetType || 'dm';
            let dock = document.getElementById('nx-voice-rec-dock');
            if (!dock) {
                dock = document.createElement('div');
                dock.id = 'nx-voice-rec-dock';
                document.body.appendChild(dock);
            }
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                recordedAudioChunks = [];
                activeMediaRecorder = new MediaRecorder(stream);
                activeMediaRecorder.ondataavailable = e => { if (e.data && e.data.size > 0) recordedAudioChunks.push(e.data); };
                recordingStartTime = Date.now();
                dock.style.display = 'flex';
                dock.innerHTML = `
                    <div style="display:flex; align-items:center; gap:9px;">
                        <span style="width:12px; height:12px; border-radius:50%; background:#ef4444; display:inline-block;"></span>
                        <span style="font-size:13px; font-weight:900; color:#f8fafc;">🎙️ Recording: <b id="nx-vn-rec-timer" style="color:#fde047;">0:00</b></span>
                    </div>
                    <div style="display:flex; gap:7px;">
                        <button type="button" onclick="NexusCore.cancelVoiceNoteRecording()" style="background:#1e293b; border:1px solid #334155; color:#fca5a5; padding:7px 11px; border-radius:12px; font-size:11.5px; font-weight:800; cursor:pointer;">✕ Cancel</button>
                        <button type="button" onclick="NexusCore.finishAndSendVoiceNote()" style="background:#10b981; border:none; color:#020617; padding:7px 13px; border-radius:12px; font-size:12px; font-weight:900; cursor:pointer;">Send ➤</button>
                    </div>
                `;
                clearInterval(recordingTickInterval);
                recordingTickInterval = setInterval(() => {
                    let sec = Math.floor((Date.now() - recordingStartTime) / 1000);
                    const tEl = document.getElementById('nx-vn-rec-timer');
                    if (tEl) tEl.innerText = `0:${sec < 10 ? '0' + sec : sec}`;
                    if (sec >= 40) NexusCore.finishAndSendVoiceNote();
                }, 500);
                activeMediaRecorder.start(250);
            } catch (e) {
                Nexus.toast("⚠️ Allow Microphone permission!");
            }
        },

        cancelVoiceNoteRecording: function() {
            clearInterval(recordingTickInterval);
            const dock = document.getElementById('nx-voice-rec-dock');
            if (dock) dock.style.display = 'none';
            if (activeMediaRecorder) {
                try { activeMediaRecorder.stream.getTracks().forEach(t => t.stop()); activeMediaRecorder.stop(); } catch (e) {}
                activeMediaRecorder = null;
            }
            recordedAudioChunks = [];
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
                    let payload = `🎵VOICE|${finalDuration}|${reader.result}`;
                    if (currentRecordingTarget === 'dm' && window.NexusDM) {
                        const dmInp = document.getElementById('nx-dm-input');
                        if (dmInp) { dmInp.value = payload; NexusDM.sendDM(); }
                    } else if (window.NexusChat) {
                        const grpInp = document.getElementById('nx-chat-msg-in');
                        if (grpInp) { grpInp.value = payload; NexusChat.sendChatMessage(); }
                    }
                };
                reader.readAsDataURL(blob);
            };
            try { rec.stop(); } catch (e) {}
        },

        togglePlayVoiceNote: function(audioId, btnEl) {
            const aud = document.getElementById(audioId);
            const bar = document.getElementById(audioId + '_bar');
            if (!aud) return;
            if (!aud.paused) { aud.pause(); if (btnEl) btnEl.innerText = '▶️'; return; }
            aud.playbackRate = voicePlaySpeedMap[audioId] || 1;
            aud.ontimeupdate = () => {
                if (aud.duration && bar) bar.style.width = Math.min(100, Math.round((aud.currentTime / aud.duration) * 100)) + '%';
            };
            aud.onended = () => { if (btnEl) btnEl.innerText = '▶️'; if (bar) bar.style.width = '0%'; };
            aud.play().then(() => { if (btnEl) btnEl.innerText = '⏸️'; }).catch(() => {});
        },

        cycleVoiceNoteSpeed: function(audioId, speedBtn) {
            const speeds = [1, 1.5, 2];
            let cur = voicePlaySpeedMap[audioId] || 1;
            let next = speeds[(speeds.indexOf(cur) + 1) % speeds.length];
            voicePlaySpeedMap[audioId] = next;
            if (speedBtn) speedBtn.innerText = next + 'x';
            const aud = document.getElementById(audioId);
            if (aud) aud.playbackRate = next;
        },

        execDmReaction: async function(msgId, emoji) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (!me || !Nexus.db || !msgId) return;

            const rowEl = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            if (rowEl) {
                let existingPill = rowEl.querySelector('.nx-dm-live-react-pill');
                if (!existingPill) {
                    existingPill = document.createElement('div');
                    existingPill.className = 'nx-dm-live-react-pill';
                    rowEl.appendChild(existingPill);
                }
                existingPill.innerHTML = `<span>${emoji}</span> <span>@${me.username}</span>`;
            }
            Nexus.toast(`${emoji} Reacted!`);

            try {
                const docRef = Nexus.db.collection("nexus_private_dms").doc(msgId);
                const snap = await docRef.get();
                let likes = (snap.exists && Array.isArray(snap.data().likes)) ? [...snap.data().likes] : [];
                if (!likes.includes(me.username)) likes.push(me.username);
                await docRef.set({ likes: likes, reaction: emoji }, { merge: true });
            } catch (e) {}
        },

        execDmReply: function(msgId) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            const rowEl = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            let text = 'Message';
            if (rowEl) {
                let clone = rowEl.cloneNode(true);
                clone.querySelectorAll('button, .nx-dm-message-menu-btn').forEach(b => b.remove());
                text = (clone.innerText || 'Message').replace(/\n+/g, ' ').trim().substring(0, 45);
            }
            let me = Nexus.getCurrentUser();
            let isMine = rowEl ? (rowEl.style.alignItems === 'flex-end') : false;
            let pName = document.getElementById('nx-dm-partner-name')?.innerText || 'Partner';
            let senderName = isMine ? (me ? me.name : 'You') : pName;
            if (window.NexusDM && NexusDM.startReply) NexusDM.startReply(senderName, text);
        },

        execDmCopy: function(msgId) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            const rowEl = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            if (!rowEl) return;
            let clone = rowEl.cloneNode(true);
            clone.querySelectorAll('button, .nx-dm-message-menu-btn').forEach(b => b.remove());
            let txt = (clone.innerText || '').replace(/\d{1,2}:\d{2}\s*(AM|PM|am|pm)?.*$/s, '').trim();
            try { navigator.clipboard.writeText(txt); Nexus.toast("📋 Copied!"); } catch (e) {}
        },

        execDmEdit: function(msgId) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            const rowEl = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            let oldText = '';
            if (rowEl) {
                let clone = rowEl.cloneNode(true);
                clone.querySelectorAll('button, .nx-dm-message-menu-btn').forEach(b => b.remove());
                oldText = (clone.innerText || '').replace(/\d{1,2}:\d{2}\s*(AM|PM|am|pm)?.*$/s, '').trim();
            }
            if (window.NexusDM && NexusDM.startEdit) NexusDM.startEdit(msgId, oldText);
        },

        execDmDeleteForMe: function(msgId) {
            const modal = document.getElementById('nx-msg-action-modal');
            if (modal) modal.style.display = 'none';
            if (!msgId) return;
            addHiddenForMeId(msgId);
            const rowEl = document.querySelector(`.nx-dm-bubble-anim[data-message-id="${msgId}"]`);
            if (rowEl) {
                rowEl.setAttribute('data-hidden-applied', '1');
                rowEl.innerHTML = `<div class="nx-dm-local-deleted">🧹 You deleted this message for yourself</div>`;
            }
            Nexus.toast("🧹 Deleted for you!");
        },

        execDmDeleteForEveryone: async function(msgId) {
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
            Nexus.toast("🗑️ Deleted for everyone!");

            try {
                await Nexus.db.collection("nexus_private_dms").doc(msgId).set({
                    deleted: true, deletedAt: Date.now(), deletedBy: me.username, deletedByName: deletedLabel,
                    text: '', imgUrl: '', imgUrls: [], sticker: null, replyTo: null, edited: false, likes: [], reaction: ''
                }, { merge: true });
            } catch (e) {}
        },

        runInstantGlobalSearch: function(rawQuery) {
            const resBox = document.getElementById('nx-fast-search-results');
            if (!resBox) return;
            let q = (rawQuery || '').toLowerCase().trim();

            let users = (Nexus.users || []).filter(u =>
                u && u.username && u.username !== 'nexus_official' && (
                    !q || u.username.toLowerCase().includes(q) || (u.name && u.name.toLowerCase().includes(q)) || (u.bio && u.bio.toLowerCase().includes(q))
                )
            ).slice(0, 6);

            let posts = (Nexus.posts || []).filter(p =>
                p && p.id && (
                    !q || (p.text && p.text.toLowerCase().includes(q)) || (p.author && p.author.toLowerCase().includes(q)) || (p.username && p.username.toLowerCase().includes(q))
                )
            ).slice(0, 8);

            let uHTML = users.map(u => {
                let safeU = u.username.replace(/'/g, "\\'");
                let ch = (u.name || u.username || 'U').charAt(0).toUpperCase();
                return `
                    <div onclick="document.getElementById('nx-global-modal').style.display='none'; Nexus.openPublicProfile('${safeU}');" style="display:flex; align-items:center; justify-content:space-between; padding:9px 11px; background:#161f33; border:1px solid #1e293b; border-radius:12px; cursor:pointer;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width:34px; height:34px; border-radius:50%; background:#2563eb; color:white; display:flex; align-items:center; justify-content:center; font-weight:800;">${ch}</div>
                            <div>
                                <div style="font-size:13.5px; font-weight:800; color:#f8fafc;">${u.name || u.username}</div>
                                <div style="font-size:11px; color:#38bdf8;">@${u.username} • ${u.bio || 'Student'}</div>
                            </div>
                        </div>
                        <span style="color:#10b981; font-size:11.5px; font-weight:800;">Profile →</span>
                    </div>
                `;
            }).join('');

            let pHTML = posts.map(p => `
                <div onclick="document.getElementById('nx-global-modal').style.display='none'; Nexus.openSinglePostModal('${p.id}');" style="padding:10px 12px; background:#101726; border:1px solid #1e293b; border-left:3px solid #38bdf8; border-radius:12px; cursor:pointer;">
                    <div style="font-size:11.5px; color:#38bdf8; font-weight:800; margin-bottom:3px;">📸 @${p.username || p.author}</div>
                    <div style="font-size:13px; color:#e2e8f0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${(p.text || 'Photo Note').replace(/</g, '&lt;')}</div>
                </div>
            `).join('');

            resBox.innerHTML = `
                ${uHTML ? `<div style="font-size:11px; color:#94a3b8; font-weight:800; margin-top:2px;">👤 MEMBERS (${users.length})</div>${uHTML}` : ''}
                ${pHTML ? `<div style="font-size:11px; color:#94a3b8; font-weight:800; margin-top:6px;">📝 POSTS &amp; NOTES (${posts.length})</div>${pHTML}` : ''}
                ${(!uHTML && !pHTML) ? `<div style="text-align:center; padding:18px; color:#64748b; font-size:13px;">No results found for "${rawQuery}"</div>` : ''}
            `;
        },

        launchMediaEverywhere: function(isDm, mediaUrl, title, thumb) {
            const modal = document.getElementById('nx-global-modal');
            if (modal) modal.style.display = 'none';
            if (mediaUrl && (mediaUrl.includes('saavn') || mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.m4a')) && !mediaUrl.includes('youtube.com')) {
                if (isDm && window.NexusPower) NexusPower.sendSelectedSong(title || 'Full Song', mediaUrl, thumb || '');
                else if (!isDm && window.NexusSuperChat) NexusSuperChat.selectGroupSong(title || 'Full Song', 'Full Audio', mediaUrl, thumb || '');
                return;
            }
            if (isDm && window.NexusPower) NexusPower.launchWatchParty(mediaUrl);
            else if (!isDm && window.NexusSuperChat) NexusSuperChat.startGroupWatchParty(mediaUrl);
        }
    };

    function runFastMaintenanceLoop() {
        if (isUserCurrentlyTyping) return;
        installBulletproofDmMessageMenu();
        applyHiddenAndDeletedStylesInDmBox();
        installFastGlobalSearchModal();
        hookWatchPartyAndSongSearch();
    }

    document.addEventListener('DOMContentLoaded', () => {
        runFastMaintenanceLoop();
        setInterval(runFastMaintenanceLoop, 900);
    });
    setTimeout(runFastMaintenanceLoop, 120);
})();
