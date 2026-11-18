// ================= LIVE.JS (v36.0 EXACT SYNC & CROSS-PHONE GUARANTEED): ▶️ 100% PURE YOUTUBE VIDEO SEARCH (NO AUDIO MIXUP) + 🎵 PURE MP3 DJ + 📱 CROSS-PHONE PARTICIPANT AUTO-SYNC (OPENS ON PARTNER PHONE 100%) + ⌨️ AUTO-COMPACT ON TYPING + ⏱️ SECOND-TO-SECOND LIVE CLOCK SYNC =================

(function() {
    const PROTO = 'https:' + '//';
    const RTC_ICE = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" }
        ]
    };

    let activeWpRoom = '', wpUnsub = null, wpParticipantUnsub = null;
    let currentMediaKey = '', currentMode = 'yt';
    let isMainHidden = false, isRelHidden = true; // Hidden by default so chat has maximum space!
    let searchResultsCache = [];
    let lastEmojiId = '';
    let activeDocData = null;

    // Call & WebRTC state
    let localCallStream = null, callPc = null, callDocUnsub = null, callIceUnsub = null;
    let callTimerInt = null, ringtoneInt = null, currentFacing = 'user';

    // =========================================================================
    // 1. GLOBAL HARDWARE MIC & CAMERA TRACKER
    // =========================================================================
    window.__NX_ACTIVE_MEDIA_STREAMS__ = window.__NX_ACTIVE_MEDIA_STREAMS__ || [];

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && !navigator.mediaDevices.__nxLiveHooked) {
        navigator.mediaDevices.__nxLiveHooked = true;
        const origGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
        navigator.mediaDevices.getUserMedia = async function(constraints) {
            const stream = await origGUM(constraints);
            window.__NX_ACTIVE_MEDIA_STREAMS__.push(stream);
            return stream;
        };
        if (navigator.mediaDevices.getDisplayMedia) {
            const origGDM = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
            navigator.mediaDevices.getDisplayMedia = async function(constraints) {
                const stream = await origGDM(constraints);
                window.__NX_ACTIVE_MEDIA_STREAMS__.push(stream);
                return stream;
            };
        }
    }

    window.killAllActiveHardwareStreams = function() {
        try {
            if (localCallStream && localCallStream.getTracks) {
                localCallStream.getTracks().forEach(t => { try { t.enabled = false; t.stop(); } catch (e) {} });
            }
            localCallStream = null;
            (window.__NX_ACTIVE_MEDIA_STREAMS__ || []).forEach(s => {
                if (s && typeof s.getTracks === 'function') {
                    s.getTracks().forEach(t => { try { t.enabled = false; t.stop(); } catch (e) {} });
                }
            });
            window.__NX_ACTIVE_MEDIA_STREAMS__ = [];
            if (typeof window.forceReleaseAllMicAndCamera === 'function') {
                window.forceReleaseAllMicAndCamera();
            }
        } catch (e) {}
    };

    const st = document.createElement('style');
    st.innerHTML = `
        #nx-wp-dock {
            background: #0f172a; border-bottom: 1.5px solid #10b981; width: 100%;
            flex-shrink: 0; z-index: 35; display: none; flex-direction: column; position: relative;
        }
        #nx-wp-dock.nx-typing-compact #nx-wp-video-frame-wrap {
            height: 92px !important;
        }
        #nx-wp-dock.nx-typing-compact #nx-wp-video-frame-wrap iframe {
            height: 92px !important;
        }
        #nx-wp-dock.nx-typing-compact #nx-wp-related-stage {
            display: none !important;
        }
        @keyframes nxSpinDisc { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .nx-disc-spin {
            width: 42px; height: 42px; border-radius: 50%; object-fit: cover;
            border: 2px solid #10b981; animation: nxSpinDisc 6s linear infinite; flex-shrink: 0;
        }
        .nx-horiz-strip {
            display: flex !important; flex-wrap: nowrap !important; gap: 8px;
            overflow-x: auto !important; -webkit-overflow-scrolling: touch !important;
            touch-action: pan-x !important; scrollbar-width: none; padding: 6px 10px; background: #050811;
        }
        .nx-horiz-strip::-webkit-scrollbar { display: none; }
        .nx-tw-pill {
            background: #1e293b; border: 1px solid #334155; color: #f8fafc;
            padding: 3px 7px; border-radius: 7px; font-size: 10px; font-weight: 800;
            cursor: pointer; white-space: nowrap; flex-shrink: 0;
        }
        @keyframes nxFloatUpEmoji {
            0% { transform: translateY(0) scale(0.8); opacity: 1; }
            100% { transform: translateY(-170px) scale(1.45); opacity: 0; }
        }
        .nx-floating-wp-emoji {
            position: fixed; bottom: 90px; right: 28px; font-size: 34px;
            pointer-events: none; z-index: 250000; animation: nxFloatUpEmoji 1.8s ease-out forwards;
        }
        @keyframes nxRingPulse {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.2); opacity: 0.2; }
        }
    `;
    document.head.appendChild(st);

    // Auto-compact Watch Party when user is typing in chat so chat messages are clearly visible!
    document.addEventListener('focusin', (e) => {
        if (e.target && (e.target.id === 'nx-dm-input' || e.target.id === 'nx-chat-msg-in' || (e.target.placeholder || '').includes('Message'))) {
            document.getElementById('nx-wp-dock')?.classList.add('nx-typing-compact');
        }
    });
    document.addEventListener('focusout', (e) => {
        if (e.target && (e.target.id === 'nx-dm-input' || e.target.id === 'nx-chat-msg-in' || (e.target.placeholder || '').includes('Message'))) {
            setTimeout(() => {
                document.getElementById('nx-wp-dock')?.classList.remove('nx-typing-compact');
            }, 250);
        }
    });

    function fetchFast(url, ms) {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), ms || 5500);
        return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t));
    }

    function normalizeUser(u) {
        return String(u || '').toLowerCase().replace(/^@/, '').trim();
    }

    function getMeUser() {
        try {
            if (window.Nexus && Nexus.getCurrentUser) {
                let u = Nexus.getCurrentUser();
                if (u && u.username) return u;
            }
            let raw = localStorage.getItem('nx_active_account') || localStorage.getItem('nx_legacy_backup_account');
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return { username: 'guest', name: 'Member' };
    }

    // =========================================================================
    // 2. BULLETPROOF PARTNER USERNAME RESOLVER (FIXES AARUSHI <-> MOHIT_01 MISMATCH!)
    // =========================================================================
    function resolvePartnerExactUsername(rawHeaderText) {
        const cleanRaw = String(rawHeaderText || '').replace(/✅|✓|🟢|Online Now|Last seen.*/gi, '').trim();
        const lowerRaw = normalizeUser(cleanRaw);
        if (!lowerRaw) return '';

        // 1. Check NexusDM.activePartner
        if (window.NexusDM && NexusDM.activePartner) {
            const act = normalizeUser(NexusDM.activePartner);
            if (act && act !== 'partner') {
                const matchAct = ((window.Nexus && Nexus.users) || []).find(u =>
                    u && (normalizeUser(u.username) === act || normalizeUser(u.name) === act)
                );
                if (matchAct && matchAct.username) return normalizeUser(matchAct.username);
                return act;
            }
        }

        // 2. Check data-partner-username attribute on #nx-dm-partner-name
        const nameEl = document.getElementById('nx-dm-partner-name');
        if (nameEl && nameEl.getAttribute('data-partner-username')) {
            return normalizeUser(nameEl.getAttribute('data-partner-username'));
        }

        // 3. Search Nexus.users by username OR display name (e.g. "Mohit_01" -> "mohiy", "Aarushi" -> "aarushi")
        const usersList = (window.Nexus && Array.isArray(Nexus.users)) ? Nexus.users : [];
        const matched = usersList.find(u => {
            if (!u || !u.username) return false;
            const uName = normalizeUser(u.username);
            const dName = normalizeUser(u.name);
            return uName === lowerRaw || dName === lowerRaw || (lowerRaw.length >= 3 && (dName.startsWith(lowerRaw) || uName.startsWith(lowerRaw)));
        });
        if (matched && matched.username) return normalizeUser(matched.username);

        return lowerRaw.replace(/[^a-z0-9_]/g, '');
    }

    function getChatCtx(isDmExplicit) {
        let me = getMeUser();
        let myU = normalizeUser(me.username || 'guest');
        let myNameLower = normalizeUser(me.name || myU);
        const dmRoot = document.getElementById('nx-dm-dedicated-root');
        const isDm = isDmExplicit === true || (dmRoot && dmRoot.style.display !== 'none');

        if (isDm) {
            let pRaw = document.getElementById('nx-dm-partner-name')?.innerText || window.currentChatUser || '';
            let pU = resolvePartnerExactUsername(pRaw) || myU;
            let pDisplay = (document.getElementById('nx-dm-partner-name')?.innerText || pU).trim();
            let pDisplayLower = normalizeUser(pDisplay);

            // Build all possible room keys and participant tokens so BOTH phones always match 100%!
            const primaryPair = [myU, pU].sort().join('__');
            const pairTokens = Array.from(new Set([
                `${myU}__${pU}`,
                `${pU}__${myU}`,
                `${myNameLower}__${pU}`,
                `${pU}__${myNameLower}`,
                `${myU}__${pDisplayLower}`,
                `${pDisplayLower}__${myU}`
            ]));

            return {
                isDm: true,
                myU: myU,
                myNameLower: myNameLower,
                targetUser: pU,
                partnerDisplay: pDisplay,
                partnerDisplayLower: pDisplayLower,
                roomId: 'dm_' + primaryPair,
                pairTokens: pairTokens
            };
        }

        let rTitle = document.getElementById('nx-room-title')?.innerText || 'Study Room';
        let grpId = 'grp_' + rTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
        return {
            isDm: false,
            myU: myU,
            myNameLower: myNameLower,
            targetUser: '',
            partnerDisplay: rTitle,
            partnerDisplayLower: '',
            roomId: grpId,
            pairTokens: [grpId]
        };
    }

    // =========================================================================
    // 3. 100% SEPARATED YOUTUBE VIDEO SEARCH vs MP3 SONG SEARCH
    //    (NEVER mixes MP3 audio into YouTube TV tab!)
    // =========================================================================
    async function searchYouTubeVideosOnly(rawQuery) {
        let q = (rawQuery || 'Hindi Hit Songs').trim();
        let ytList = [], seen = new Set();
        const addYt = (it) => {
            if (it && it.videoId && /^[a-zA-Z0-9_-]{11}$/.test(it.videoId) && !seen.has(it.videoId)) {
                seen.add(it.videoId);
                ytList.push(it);
            }
        };

        // 1. Direct YouTube Link Check
        let directId = (q.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/) || [])[1];
        if (directId) {
            addYt({
                id: 'yt_' + directId,
                videoId: directId,
                title: "YouTube Direct Video",
                channel: "▶️ YouTube Live Sync",
                thumb: `https://i.ytimg.com/vi/${directId}/mqdefault.jpg`,
                url: `https://www.youtube.com/embed/${directId}?autoplay=1&playsinline=1&enablejsapi=1&rel=0`,
                type: 'yt'
            });
            return ytList;
        }

        // 2. Official Google Cloud YouTube Data API v3
        const apiKey = (window.Nexus && Nexus.config && Nexus.config.apiKey) || "";
        const tryGoogleApi = async () => {
            if (!apiKey) return;
            try {
                const r = await fetchFast(`${PROTO}www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=12&q=${encodeURIComponent(q)}&key=${apiKey}`, 4500);
                if (!r.ok) return;
                const d = await r.json();
                (d.items || []).forEach(item => {
                    const vid = item.id && item.id.videoId;
                    if (vid) {
                        addYt({
                            id: 'yt_' + vid,
                            videoId: vid,
                            title: (item.snippet && item.snippet.title) || 'YouTube Video',
                            channel: `▶️ ${(item.snippet && item.snippet.channelTitle) || 'YouTube'}`,
                            thumb: `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`,
                            url: `https://www.youtube.com/embed/${vid}?autoplay=1&playsinline=1&enablejsapi=1&rel=0`,
                            type: 'yt'
                        });
                    }
                });
            } catch (e) {}
        };

        // 3. Direct YouTube Search HTML Parser via 3 Different Proxies (Finds all videoIds in page!)
        const parseYtHtml = (html) => {
            if (!html || typeof html !== 'string') return;
            // Match videoRenderer blocks with title
            const regex1 = /"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})".*?"title":\{"(?:runs":\[\{"text"|"simpleText"):"([^"]+)"/g;
            let m;
            while ((m = regex1.exec(html)) !== null && ytList.length < 14) {
                addYt({
                    id: 'yt_' + m[1],
                    videoId: m[1],
                    title: m[2].replace(/\\u0026/g, '&').replace(/\\"/g, '"'),
                    channel: '▶️ YouTube Video',
                    thumb: `https://i.ytimg.com/vi/${m[1]}/mqdefault.jpg`,
                    url: `https://www.youtube.com/embed/${m[1]}?autoplay=1&playsinline=1&enablejsapi=1&rel=0`,
                    type: 'yt'
                });
            }
            // Fallback loose videoId matcher if YouTube changed JSON layout
            if (ytList.length === 0) {
                const regex2 = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
                let m2;
                while ((m2 = regex2.exec(html)) !== null && ytList.length < 10) {
                    addYt({
                        id: 'yt_' + m2[1],
                        videoId: m2[1],
                        title: `${q} • Video #${ytList.length + 1}`,
                        channel: '▶️ YouTube Video',
                        thumb: `https://i.ytimg.com/vi/${m2[1]}/mqdefault.jpg`,
                        url: `https://www.youtube.com/embed/${m2[1]}?autoplay=1&playsinline=1&enablejsapi=1&rel=0`,
                        type: 'yt'
                    });
                }
            }
        };

        // 4. Piped & Invidious Public YouTube JSON APIs
        const tryJsonMirrors = async (apiUrl) => {
            try {
                const r = await fetchFast(apiUrl, 4800);
                if (!r.ok) return;
                const d = await r.json();
                const arr = Array.isArray(d.items) ? d.items : (Array.isArray(d) ? d : []);
                arr.slice(0, 12).forEach(v => {
                    const vid = v.videoId || (v.url && (v.url.match(/v=([a-zA-Z0-9_-]{11})/) || [])[1]);
                    if (vid) {
                        addYt({
                            id: 'yt_' + vid,
                            videoId: vid,
                            title: v.title || q,
                            channel: `▶️ ${v.uploaderName || v.author || 'YouTube'}`,
                            thumb: `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`,
                            url: `https://www.youtube.com/embed/${vid}?autoplay=1&playsinline=1&enablejsapi=1&rel=0`,
                            type: 'yt'
                        });
                    }
                });
            } catch (e) {}
        };

        const ytSearchPage = `${PROTO}www.youtube.com/results?search_query=${encodeURIComponent(q)}&hl=en`;

        await Promise.allSettled([
            tryGoogleApi(),
            fetchFast(`${PROTO}api.allorigins.win/get?url=${encodeURIComponent(ytSearchPage)}`, 5200).then(r => r.json()).then(d => parseYtHtml(d.contents)),
            fetchFast(`${PROTO}api.codetabs.com/v1/proxy?quest=${encodeURIComponent(ytSearchPage)}`, 5200).then(r => r.text()).then(parseYtHtml),
            fetchFast(`${PROTO}corsproxy.io/?${encodeURIComponent(ytSearchPage)}`, 5000).then(r => r.text()).then(parseYtHtml),
            tryJsonMirrors(`${PROTO}pipedapi.kavin.rocks/search?q=${encodeURIComponent(q)}&filter=videos`),
            tryJsonMirrors(`${PROTO}api.piped.private.coffee/search?q=${encodeURIComponent(q)}&filter=videos`),
            tryJsonMirrors(`${PROTO}inv.nadeko.net/api/v1/search?q=${encodeURIComponent(q)}&type=video`)
        ]);

        return ytList;
    }

    async function searchMp3SongsOnly(rawQuery) {
        let q = (rawQuery || 'Arijit Singh Hindi Songs').trim();
        let cleanQ = q.replace(/\b(song|songs|mp3|full|audio|video)\b/gi, '').replace(/\s+/g, ' ').trim() || q;
        let mp3List = [], seen = new Set();
        const addMp3 = (it) => { if (it && it.url && !seen.has(it.url)) { seen.add(it.url); mp3List.push(it); } };

        const parseSaavn = (d) => {
            let arr = (d && d.data && Array.isArray(d.data.results)) ? d.data.results : (d && Array.isArray(d.results) ? d.results : []);
            arr.forEach(s => {
                let dl = s.downloadUrl || [];
                let best = dl.length ? (dl[dl.length - 1].url || dl[dl.length - 1].link) : '';
                if (!best && s.more_info && s.more_info.media_preview_url) {
                    best = s.more_info.media_preview_url.replace('preview.saavncdn.com', 'aac.saavncdn.com').replace('_96_p.mp4', '_160.mp4');
                }
                let im = s.image || [];
                let th = Array.isArray(im) && im.length ? (im[im.length - 1].url || im[im.length - 1].link) : (typeof im === 'string' ? im : '');
                let dur = Number(s.duration || (s.more_info && s.more_info.duration) || 240);
                if (best) {
                    let m = Math.floor(dur / 60), sec = dur % 60;
                    addMp3({
                        id: 'mp3_' + (s.id || Math.random()),
                        title: (s.name || s.title || 'Song').replace(/&quot;/g, '"').replace(/&#039;/g, "'"),
                        channel: `${s.primaryArtists || s.artists?.primary?.[0]?.name || 'Bollywood'} • 🎵 Full MP3 (${m}:${sec < 10 ? '0' + sec : sec})`,
                        thumb: th || 'https://placehold.co/100x100/10b981/020617?text=MP3',
                        url: best,
                        type: 'mp3'
                    });
                }
            });
        };

        const saavnOfficial = `${PROTO}www.jiosaavn.com/api.php?p=1&q=${encodeURIComponent(cleanQ)}&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=12&__call=search.getResults`;

        await Promise.allSettled([
            fetchFast(`${PROTO}api.allorigins.win/get?url=${encodeURIComponent(saavnOfficial)}`, 5000).then(r => r.json()).then(d => parseSaavn(JSON.parse(d.contents))),
            fetchFast(`${PROTO}saavn.dev/api/search/songs?query=${encodeURIComponent(cleanQ)}&limit=12`, 4500).then(r => r.json()).then(parseSaavn),
            fetchFast(`${PROTO}itunes.apple.com/search?term=${encodeURIComponent(cleanQ)}&country=IN&media=music&limit=12`, 4500).then(r => r.json()).then(d => {
                (d.results || []).forEach(t => {
                    if (t && t.previewUrl) {
                        addMp3({
                            id: 'mp3_it_' + (t.trackId || Math.random()),
                            title: t.trackName || 'Hindi Song',
                            channel: `${t.artistName || 'Artist'} • 🎵 Instant Audio`,
                            thumb: (t.artworkUrl100 || '').replace('100x100', '300x300'),
                            url: t.previewUrl,
                            type: 'mp3'
                        });
                    }
                });
            })
        ]);

        return mp3List;
    }

    function spawnFloatingWatchPartyEmoji(emojiChar) {
        if (!emojiChar) return;
        const el = document.createElement('div');
        el.className = 'nx-floating-wp-emoji';
        el.style.right = (20 + Math.floor(Math.random() * 60)) + 'px';
        el.textContent = emojiChar;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1850);
    }

    // Send YouTube IFrame API Command without reloading iframe!
    function sendYouTubeCommand(func, args) {
        const frame = document.getElementById('nx-wp-yt-iframe');
        if (frame && frame.contentWindow) {
            try {
                frame.contentWindow.postMessage(JSON.stringify({
                    event: 'command',
                    func: func,
                    args: args || []
                }), '*');
            } catch (e) {}
        }
    }

    // Calculate live elapsed second from startedAtEpoch for exact second-to-second sync!
    function getLiveTargetSecond(docData) {
        if (!docData) return 0;
        const baseSec = Number(docData.currentTime || 0);
        if (docData.playState === 'PAUSED') return Math.max(0, Math.round(baseSec));
        const startedEpoch = Number(docData.startedAtEpoch || docData.updatedAt || Date.now());
        const elapsedSec = Math.max(0, (Date.now() - startedEpoch) / 1000);
        return Math.max(0, Math.round(baseSec + elapsedSec));
    }

    function renderDock(docData, isDm) {
        activeDocData = docData;
        let dock = document.getElementById('nx-wp-dock');
        if (!dock) { dock = document.createElement('div'); dock.id = 'nx-wp-dock'; }
        const target = isDm ? document.getElementById('nx-dm-msgs-box') : document.getElementById('nx-room-messages');
        if (target && target.parentNode && dock.nextSibling !== target) {
            target.parentNode.insertBefore(dock, target);
        }

        if (!docData || !docData.active || (!docData.url && !docData.videoId)) {
            dock.style.display = 'none'; dock.innerHTML = ''; currentMediaKey = ''; return;
        }

        if (docData.lastEmoji && docData.lastEmoji.id && docData.lastEmoji.id !== lastEmojiId) {
            lastEmojiId = docData.lastEmoji.id;
            spawnFloatingWatchPartyEmoji(docData.lastEmoji.char);
        }

        dock.style.display = 'flex';
        let mKey = (docData.videoId || docData.url || '');
        let relList = Array.isArray(docData.related) && docData.related.length ? docData.related : searchResultsCache;
        let isMp3 = docData.mediaType === 'mp3';
        let targetSec = getLiveTargetSecond(docData);

        if (mKey !== currentMediaKey) {
            currentMediaKey = mKey;

            let stageHTML = isMp3 ? `
                <div style="display:flex; align-items:center; gap:10px; padding:8px 12px; background:#090d16;">
                    <img src="${docData.thumb || 'https://placehold.co/100x100/10b981/020617?text=MP3'}" class="nx-disc-spin">
                    <div style="flex:1; min-width:0;">
                        <div style="font-size:12px; font-weight:900; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">🎵 ${(docData.title || 'Full MP3 Song').replace(/</g, '&lt;')}</div>
                        <div id="nx-wp-sync-lbl" style="font-size:10px; color:#10b981; font-weight:800; margin-bottom:3px;">🟢 Live Audio Sync • @${docData.startedBy || 'member'}</div>
                        <audio id="nx-wp-audio-el" src="${docData.url}" controls autoplay style="width:100%; height:30px;"></audio>
                    </div>
                </div>
            ` : `
                <div id="nx-wp-video-frame-wrap" style="position:relative; width:100%; height:175px; background:#000; transition:height 0.2s ease;">
                    <iframe id="nx-wp-yt-iframe" src="https://www.youtube.com/embed/${docData.videoId}?autoplay=1&playsinline=1&enablejsapi=1&rel=0&modestbranding=1&start=${targetSec}" style="width:100%; height:175px; border:none; background:#000; transition:height 0.2s ease;" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
                </div>
                <!-- SINGLE COMPACT STRUCTURED CONTROL BAR (No 2-line wrapping!) -->
                <div style="display:flex; align-items:center; justify-content:space-between; padding:5px 8px; background:#0f172a; border-top:1px solid #1e293b; gap:4px; overflow-x:auto; scrollbar-width:none;">
                    <span id="nx-wp-sync-lbl" style="font-size:10px; color:#10b981; font-weight:800; white-space:nowrap; margin-right:2px;">🟢 @${docData.startedBy || 'member'}</span>
                    <button type="button" class="nx-tw-pill" onclick="NexusWatchParty.seekYtVideo(-15)">⏪15s</button>
                    <button type="button" class="nx-tw-pill" onclick="NexusWatchParty.togglePlayPause()">⏯️</button>
                    <button type="button" class="nx-tw-pill" onclick="NexusWatchParty.seekYtVideo(15)">⏩15s</button>
                    <button type="button" class="nx-tw-pill" style="background:#10b981; color:#020617; border:none;" onclick="NexusWatchParty.syncExactSecondNow()">🔄 Sync</button>
                    ${['🔥','❤️','😂'].map(em => `<button type="button" class="nx-tw-pill" onclick="NexusWatchParty.sendLiveEmoji('${em}')">${em}</button>`).join('')}
                </div>
            `;

            dock.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 8px; background:#182229; border-bottom:1px solid #2a3942; gap:4px;">
                    <span style="font-size:11px; font-weight:900; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;">${isMp3 ? '🎵' : '▶️'} ${(docData.title || 'Live Media').replace(/</g, '&lt;')}</span>
                    <button type="button" class="nx-tw-pill" style="border-color:#38bdf8; color:#38bdf8;" onclick="NexusWatchParty.openModal(${isDm}, '${isMp3 ? 'mp3' : 'yt'}')">🔍 Search</button>
                    <button type="button" id="nx-btn-toggle-main" class="nx-tw-pill" onclick="NexusWatchParty.toggleMainPlayer()">${isMainHidden ? '🔼 Show' : '🔽 Hide'}</button>
                    <button type="button" id="nx-btn-toggle-rel" class="nx-tw-pill" style="border-color:#a78bfa; color:#d8b4fe;" onclick="NexusWatchParty.toggleRelatedStrip()">${isRelHidden ? '🔥 Next' : '🔥 Close'}</button>
                    <button type="button" class="nx-tw-pill" style="background:#ef4444; border:none; color:white;" onclick="NexusWatchParty.stop()">✕</button>
                </div>
                <div id="nx-wp-main-stage" style="display:${isMainHidden ? 'none' : 'flex'}; flex-direction:column;">${stageHTML}</div>
                <div id="nx-wp-related-stage" style="display:${isRelHidden ? 'none' : 'flex'}; flex-direction:column;">
                    <div class="nx-horiz-strip">
                        ${relList.map((r, i) => `
                            <div onclick="NexusWatchParty.playRelatedItem(${i}, ${isDm})" style="min-width:155px; max-width:155px; background:#111827; border:1px solid #26334d; border-radius:10px; padding:5px; display:flex; align-items:center; gap:7px; cursor:pointer; flex-shrink:0;">
                                <img src="${r.thumb}" style="width:36px; height:36px; border-radius:6px; object-fit:cover; flex-shrink:0;">
                                <div style="min-width:0; flex:1;">
                                    <div style="font-size:10.5px; font-weight:800; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${(r.title || '').replace(/</g, '&lt;')}</div>
                                    <div style="font-size:9px; color:#10b981; font-weight:800;">Play ▶</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            if (isMp3) {
                const aud = document.getElementById('nx-wp-audio-el');
                if (aud && targetSec > 2) {
                    aud.currentTime = targetSec;
                }
            }
        } else {
            // Same media is already loaded: Sync exact second & Play/Pause state WITHOUT reloading iframe!
            if (isMp3) {
                const aud = document.getElementById('nx-wp-audio-el');
                if (aud) {
                    if (Math.abs((aud.currentTime || 0) - targetSec) > 3) {
                        try { aud.currentTime = targetSec; } catch (e) {}
                    }
                    if (docData.playState === 'PAUSED' && !aud.paused) aud.pause();
                    else if (docData.playState === 'PLAYING' && aud.paused) aud.play().catch(() => {});
                }
            } else {
                sendYouTubeCommand('seekTo', [targetSec, true]);
                if (docData.playState === 'PAUSED') sendYouTubeCommand('pauseVideo', []);
                else sendYouTubeCommand('playVideo', []);
            }
            const lbl = document.getElementById('nx-wp-sync-lbl');
            if (lbl) {
                const mm = Math.floor(targetSec / 60), ss = String(targetSec % 60).padStart(2, '0');
                lbl.textContent = `${docData.playState === 'PAUSED' ? '⏸️' : '🟢'} ${mm}:${ss} • @${docData.updatedBy || docData.startedBy || 'sync'}`;
            }
        }
    }

    // =========================================================================
    // 4. DUAL-WATCHER FOR WATCH PARTY (100% GUARANTEED TO OPEN ON PARTNER'S PHONE!)
    // =========================================================================
    function subscribeActiveRoom() {
        if (!window.Nexus || !Nexus.db) return;
        const dmRoot = document.getElementById('nx-dm-dedicated-root');
        const grpRoom = document.getElementById('nx-chat-room');
        let isDm = dmRoot && dmRoot.style.display !== 'none';
        let isGrp = grpRoom && grpRoom.style.display !== 'none';
        if (!isDm && !isGrp) return;

        let ctx = getChatCtx(isDm);

        // 1. Direct Room ID Watcher
        if (ctx.roomId !== activeWpRoom) {
            activeWpRoom = ctx.roomId;
            if (wpUnsub) wpUnsub();
            wpUnsub = Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).onSnapshot(doc => {
                if (doc.exists && doc.data() && doc.data().active) {
                    renderDock(doc.data(), isDm);
                }
            }, () => {});

            // 2. Cross-Phone Fallback Watcher (Matches even if one phone uses Display Name "Mohit_01" and other uses "@mohiy"!)
            if (wpParticipantUnsub) wpParticipantUnsub();
            if (isDm && ctx.myU && ctx.myU !== 'guest') {
                wpParticipantUnsub = Nexus.db.collection("nexus_watch_party")
                    .where("participants", "array-contains", ctx.myU)
                    .onSnapshot(snap => {
                        let bestDoc = null;
                        snap.forEach(d => {
                            const data = d.data();
                            if (!data || !data.active) return;
                            const parts = Array.isArray(data.participants) ? data.participants : [];
                            if (parts.includes(ctx.targetUser) || parts.includes(ctx.partnerDisplayLower)) {
                                if (!bestDoc || (data.updatedAt || 0) > (bestDoc.updatedAt || 0)) {
                                    bestDoc = data;
                                    activeWpRoom = d.id;
                                }
                            }
                        });
                        if (bestDoc) renderDock(bestDoc, true);
                        else if (activeDocData && !bestDoc) renderDock(null, true);
                    }, () => {});
            }
        }
    }

    window.NexusWatchParty = {
        openModal: function(isDm, modeTab) {
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;
            currentMode = (modeTab === 'song' || modeTab === 'mp3') ? 'mp3' : 'yt';

            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid ${currentMode === 'mp3' ? '#10b981' : '#ef4444'}; background:#090d16; padding:15px; max-width:400px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <strong style="color:#fff; font-size:15px;">${currentMode === 'mp3' ? '🎵 Full Hindi Song DJ (Sync)' : '▶️ YouTube Watch-Party TV'}</strong>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:19px; cursor:pointer;">✕</button>
                    </div>
                    <div style="display:flex; gap:6px; margin-bottom:10px;">
                        <button type="button" onclick="NexusWatchParty.openModal(${Boolean(isDm)}, 'yt')" style="flex:1; padding:8px; border-radius:10px; border:none; background:${currentMode === 'yt' ? '#ef4444' : '#1e293b'}; color:white; font-weight:900; font-size:12px; cursor:pointer;">▶️ YouTube Videos</button>
                        <button type="button" onclick="NexusWatchParty.openModal(${Boolean(isDm)}, 'mp3')" style="flex:1; padding:8px; border-radius:10px; border:none; background:${currentMode === 'mp3' ? '#10b981' : '#1e293b'}; color:${currentMode === 'mp3' ? '#020617' : 'white'}; font-weight:900; font-size:12px; cursor:pointer;">🎵 Full MP3 Songs</button>
                    </div>
                    <div style="display:flex; gap:6px; margin-bottom:10px;">
                        <input type="text" id="nx-wp-in" placeholder="${currentMode === 'yt' ? 'Search any YouTube Video, Movie, Song or Link...' : 'Search any Hindi MP3 Song (e.g. Arijit Singh)...'}" onkeydown="if(event.key==='Enter') NexusWatchParty.search(${Boolean(isDm)})" style="flex:1; padding:9px 12px; border-radius:10px; border:1px solid #334155; background:#111827; color:white; font-size:12.5px; outline:none;">
                        <button type="button" onclick="NexusWatchParty.search(${Boolean(isDm)})" style="background:${currentMode === 'mp3' ? '#10b981' : '#ef4444'}; color:${currentMode === 'mp3' ? '#020617' : 'white'}; border:none; padding:0 14px; border-radius:10px; font-weight:900; font-size:12px; cursor:pointer;">Search</button>
                    </div>
                    <div id="nx-wp-results" style="display:flex; flex-direction:column; gap:7px; max-height:52vh; overflow-y:auto;"></div>
                </div>
            `;
            modal.style.display = 'flex';
            const inp = document.getElementById('nx-wp-in');
            if (inp) inp.focus();
            this.search(Boolean(isDm), currentMode === 'mp3' ? 'Arijit Singh Hindi Songs' : 'Arijit Singh Official Video Song');
        },

        search: async function(isDm, fallbackQ) {
            const inp = document.getElementById('nx-wp-in');
            const box = document.getElementById('nx-wp-results');
            if (!box) return;
            let q = (inp && inp.value.trim()) ? inp.value.trim() : (fallbackQ || 'Hindi Hit Songs');
            box.innerHTML = `<div style="text-align:center; padding:16px; color:#38bdf8; font-size:12.5px; font-weight:800;">⚡ Searching ${currentMode === 'yt' ? 'YouTube Videos' : 'Full MP3 Songs'} for "${q}"...</div>`;

            // STRICT SEPARATION: YouTube mode ONLY searches YouTube videos; MP3 mode ONLY searches MP3 audio!
            let list = currentMode === 'mp3'
                ? await searchMp3SongsOnly(q)
                : await searchYouTubeVideosOnly(q);

            searchResultsCache = list.slice(0, 14);

            if (!list.length) {
                box.innerHTML = `<div style="text-align:center; padding:14px; color:#94a3b8; font-size:12px;">No results found for "${q}". Try slightly different words or paste a direct YouTube link!</div>`;
                return;
            }

            box.innerHTML = searchResultsCache.map((v, idx) => `
                <div onclick="NexusWatchParty.playByIndex(${idx}, ${Boolean(isDm)})" style="display:flex; align-items:center; gap:10px; padding:8px; background:#161f33; border:1px solid #26334d; border-radius:12px; cursor:pointer;">
                    <img src="${v.thumb}" style="width:58px; height:44px; border-radius:8px; object-fit:cover; flex-shrink:0; background:#000;">
                    <div style="min-width:0; flex:1;">
                        <div style="font-weight:800; font-size:12px; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${(v.title || '').replace(/</g, '&lt;')}</div>
                        <div style="font-size:10.5px; color:${v.type === 'mp3' ? '#10b981' : '#f87171'}; font-weight:700;">${(v.channel || '').replace(/</g, '&lt;')}</div>
                    </div>
                    <span style="background:${v.type === 'mp3' ? '#10b981' : '#ef4444'}; color:${v.type === 'mp3' ? '#020617' : 'white'}; padding:5px 10px; border-radius:8px; font-size:10.5px; font-weight:900; flex-shrink:0;">${v.type === 'mp3' ? 'MP3 ▶' : 'Video ▶'}</span>
                </div>
            `).join('');
        },

        playByIndex: async function(idx, isDm) {
            const modal = document.getElementById('nx-global-modal');
            if (modal) modal.style.display = 'none';
            let item = searchResultsCache[idx];
            if (!item) return;

            let me = getMeUser();
            let ctx = getChatCtx(isDm);
            isMainHidden = false;
            isRelHidden = true; // Keep related closed initially so chat screen stays big!
            currentMediaKey = '';

            // Include all participant username/name tokens so partner's phone receives it 100%!
            const participantsList = Array.from(new Set([
                ctx.myU,
                ctx.myNameLower,
                ctx.targetUser,
                ctx.partnerDisplayLower
            ].filter(Boolean)));

            const now = Date.now();
            let payload = {
                active: true,
                roomId: ctx.roomId,
                participants: participantsList,
                title: item.title || 'Live Media',
                url: item.url,
                videoId: item.videoId || '',
                thumb: item.thumb || '',
                mediaType: item.type || 'yt',
                playState: 'PLAYING',
                currentTime: 0,
                startedAtEpoch: now,
                startOffset: now % 1000,
                related: searchResultsCache.filter((_, i) => i !== idx).slice(0, 8),
                startedBy: me ? me.username : 'member',
                updatedBy: me ? me.username : 'member',
                updatedAt: now
            };

            activeWpRoom = ctx.roomId;
            renderDock(payload, ctx.isDm);
            subscribeActiveRoom();

            if (window.Nexus && Nexus.db) {
                await Nexus.db.collection("nexus_watch_party").doc(ctx.roomId).set(payload).catch(() => {});
            }
            if (window.Nexus && Nexus.toast) Nexus.toast(`🎬 Playing "${item.title}" on both phones!`);
        },

        playRelatedItem: async function(relIdx, isDm) {
            const rels = (activeDocData && Array.isArray(activeDocData.related)) ? activeDocData.related : searchResultsCache;
            const item = rels[relIdx];
            if (!item) return;
            searchResultsCache = rels;
            this.playByIndex(relIdx, isDm);
        },

        sendLiveEmoji: async function(emojiChar) {
            spawnFloatingWatchPartyEmoji(emojiChar);
            if (!activeWpRoom || !window.Nexus || !Nexus.db) return;
            const eid = 'em_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5);
            lastEmojiId = eid;
            await Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).set({
                lastEmoji: { id: eid, char: emojiChar, ts: Date.now() }
            }, { merge: true }).catch(() => {});
        },

        togglePlayPause: async function() {
            if (!activeWpRoom || !activeDocData || !Nexus.db) return;
            const curSec = getLiveTargetSecond(activeDocData);
            const nextState = activeDocData.playState === 'PAUSED' ? 'PLAYING' : 'PAUSED';
            const me = getMeUser();
            await Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).set({
                playState: nextState,
                currentTime: curSec,
                startedAtEpoch: Date.now(),
                updatedBy: me.username || 'member',
                updatedAt: Date.now()
            }, { merge: true });
        },

        seekYtVideo: async function(deltaSec) {
            if (!activeWpRoom || !activeDocData || !Nexus.db) return;
            const curSec = getLiveTargetSecond(activeDocData);
            const nextSec = Math.max(0, curSec + deltaSec);
            const me = getMeUser();
            await Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).set({
                currentTime: nextSec,
                startedAtEpoch: Date.now(),
                playState: 'PLAYING',
                updatedBy: me.username || 'member',
                updatedAt: Date.now()
            }, { merge: true });
        },

        syncExactSecondNow: async function() {
            if (!activeWpRoom || !activeDocData || !Nexus.db) return;
            const curSec = getLiveTargetSecond(activeDocData);
            const me = getMeUser();
            await Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).set({
                currentTime: curSec,
                startedAtEpoch: Date.now(),
                playState: 'PLAYING',
                updatedBy: me.username || 'member',
                updatedAt: Date.now()
            }, { merge: true });
            if (window.Nexus && Nexus.toast) Nexus.toast(`🔄 Synced both phones to ${Math.floor(curSec / 60)}:${String(curSec % 60).padStart(2, '0')}!`);
        },

        toggleMainPlayer: function() {
            isMainHidden = !isMainHidden;
            const el = document.getElementById('nx-wp-main-stage');
            const btn = document.getElementById('nx-btn-toggle-main');
            if (el) el.style.display = isMainHidden ? 'none' : 'flex';
            if (btn) btn.innerText = isMainHidden ? '🔼 Show' : '🔽 Hide';
        },

        toggleRelatedStrip: function() {
            isRelHidden = !isRelHidden;
            const el = document.getElementById('nx-wp-related-stage');
            const btn = document.getElementById('nx-btn-toggle-rel');
            if (el) el.style.display = isRelHidden ? 'none' : 'flex';
            if (btn) btn.innerText = isRelHidden ? '🔥 Next' : '🔥 Close';
        },

        stop: function() {
            if (window.Nexus && Nexus.db && activeWpRoom) {
                Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).set({ active: false, updatedAt: Date.now() }, { merge: true }).catch(() => {});
            }
            const dock = document.getElementById('nx-wp-dock');
            if (dock) { dock.style.display = 'none'; dock.innerHTML = ''; }
            currentMediaKey = '';
            activeDocData = null;
        }
    };

    // =========================================================================
    // 5. 2-WAY WEBRTC VIDEO CALL, VOICE CALL & SCREEN SHARE + PARTNER RINGING
    // =========================================================================
    function playRingBeep() {
        stopRingBeep();
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            const actx = new Ctx();
            const pulse = () => {
                if (actx.state === 'closed') return;
                const osc = actx.createOscillator();
                const g = actx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(860, actx.currentTime);
                g.gain.setValueAtTime(0.14, actx.currentTime);
                osc.connect(g);
                g.connect(actx.destination);
                osc.start();
                osc.stop(actx.currentTime + 0.32);
                if (navigator.vibrate) navigator.vibrate([220, 120, 220]);
            };
            pulse();
            ringtoneInt = setInterval(pulse, 1400);
            window.__nxCallRingCtx = actx;
        } catch (e) {}
    }

    function stopRingBeep() {
        if (ringtoneInt) { clearInterval(ringtoneInt); ringtoneInt = null; }
        if (window.__nxCallRingCtx) {
            try { window.__nxCallRingCtx.close(); } catch (e) {}
            window.__nxCallRingCtx = null;
        }
    }

    window.endNexusLiveCallNow = async function(callDocId, notifyDb = true) {
        stopRingBeep();
        clearInterval(callTimerInt);
        if (callDocUnsub) { callDocUnsub(); callDocUnsub = null; }
        if (callIceUnsub) { callIceUnsub(); callIceUnsub = null; }

        if (callPc) {
            try { callPc.ontrack = null; callPc.onicecandidate = null; callPc.close(); } catch (e) {}
            callPc = null;
        }

        window.killAllActiveHardwareStreams();

        document.getElementById('nx-live-call-overlay')?.remove();
        document.getElementById('nx-incoming-ring-modal')?.remove();

        if (notifyDb && callDocId && window.Nexus && Nexus.db) {
            await Nexus.db.collection("nexus_calls").doc(callDocId).set({
                status: "ended",
                updatedAt: Date.now()
            }, { merge: true }).catch(() => {});
        }
    };

    async function launchUnifiedWebRTCCall(callMode, isDm, isAnswering, incomingData) {
        const ctx = getChatCtx(isDm);
        const myU = ctx.myU;
        const partnerU = isAnswering ? normalizeUser(incomingData.caller) : ctx.targetUser;
        const partnerDisplay = isAnswering ? (incomingData.callerName || partnerU) : ctx.partnerDisplay;

        if (!myU || myU === 'guest') {
            if (window.Nexus && Nexus.toast) Nexus.toast("⚠️ Please login first!");
            return;
        }
        if (isDm && (!partnerU || partnerU === myU)) {
            if (window.Nexus && Nexus.toast) Nexus.toast("⚠️ Open a friend's 1:1 chat first!");
            return;
        }

        const callDocId = isAnswering ? incomingData.callDocId : (isDm ? `call_${[myU, partnerU].sort().join('__')}` : `call_${ctx.roomId}`);

        await window.endNexusLiveCallNow(null, false);

        try {
            if (callMode === 'screen') {
                if (!navigator.mediaDevices.getDisplayMedia) {
                    alert("⚠️ Screen Share ke liye Chrome Desktop site ya supported browser use karein!");
                    return;
                }
                localCallStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                try {
                    const mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                    mic.getAudioTracks().forEach(t => localCallStream.addTrack(t));
                } catch (e) {}
            } else {
                localCallStream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                    video: callMode === 'video' ? { facingMode: currentFacing, width: { ideal: 1280 }, height: { ideal: 720 } } : false
                });
            }
        } catch (err) {
            window.killAllActiveHardwareStreams();
            alert(callMode === 'audio' ? "⚠️ Allow Microphone permission for Voice Call!" : "⚠️ Allow Camera & Microphone permission for Video Call!");
            return;
        }

        const isVideoUI = callMode === 'video' || callMode === 'screen';
        const overlay = document.createElement('div');
        overlay.id = 'nx-live-call-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:radial-gradient(circle at top,#0f172a,#050811);z-index:260000;display:flex;flex-direction:column;justify-content:space-between;align-items:center;padding:30px 18px;color:#fff;user-select:none;';

        if (!isVideoUI) {
            overlay.innerHTML = `
                <div style="background:rgba(16,185,129,0.15);border:1px solid #10b981;color:#34d399;padding:5px 14px;border-radius:99px;font-size:11.5px;font-weight:800;">
                    🔒 Nexus Encrypted 1:1 Voice Call
                </div>
                <div style="text-align:center;margin:auto 0;">
                    <div style="width:128px;height:128px;border-radius:50%;background:linear-gradient(135deg,#10b981,#2563eb);color:#020617;font-size:48px;font-weight:900;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;border:3px solid #fff;box-shadow:0 0 35px rgba(16,185,129,0.4);">
                        ${(partnerDisplay || 'U')[0].toUpperCase()}
                    </div>
                    <h2 style="font-size:23px;font-weight:900;color:#f8fafc;">${partnerDisplay}</h2>
                    <div id="nx-live-call-status" style="font-size:13.5px;color:#34d399;font-weight:800;margin-top:6px;">
                        ${isAnswering ? '🟢 Connecting Voice...' : '📞 Ringing on @' + partnerU + ' phone...'}
                    </div>
                    <audio id="nx-call-remote-aud" autoplay playsinline></audio>
                </div>
                <div style="display:flex;align-items:center;gap:18px;background:#0f172a;border:1px solid #1e293b;padding:14px 26px;border-radius:99px;box-shadow:0 14px 40px rgba(0,0,0,0.85);">
                    <button type="button" id="nx-c-spk" style="width:50px;height:50px;border-radius:50%;background:#10b981;border:none;color:#020617;font-size:20px;cursor:pointer;">🔊</button>
                    <button type="button" id="nx-c-mic" style="width:50px;height:50px;border-radius:50%;background:#1e293b;border:1px solid #334155;color:#fff;font-size:20px;cursor:pointer;">🎙️</button>
                    <button type="button" id="nx-c-cut" style="width:62px;height:62px;border-radius:50%;background:#e11d48;border:none;color:#fff;font-size:24px;cursor:pointer;box-shadow:0 6px 22px rgba(225,29,72,0.5);">☎️</button>
                </div>
            `;
        } else {
            overlay.innerHTML = `
                <video id="nx-call-remote-vid" autoplay playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000;z-index:1;"></video>
                <video id="nx-call-local-vid" autoplay muted playsinline style="position:absolute;top:74px;right:16px;width:110px;height:160px;object-fit:cover;border-radius:16px;border:2px solid #10b981;background:#111;z-index:10;box-shadow:0 10px 30px rgba(0,0,0,0.85);"></video>
                <div style="position:relative;z-index:10;text-align:center;background:rgba(9,13,22,0.8);border:1px solid rgba(255,255,255,0.18);padding:8px 18px;border-radius:99px;backdrop-filter:blur(8px);">
                    <div style="font-size:15px;font-weight:900;">${partnerDisplay} • <span style="color:#38bdf8;">${callMode === 'screen' ? 'Live Screen' : 'HD Video'}</span></div>
                    <div id="nx-live-call-status" style="font-size:11.5px;color:#34d399;font-weight:800;">
                        ${isAnswering ? '🟢 Connecting...' : '📹 Ringing @' + partnerU + '...'}
                    </div>
                </div>
                <div style="position:relative;z-index:10;display:flex;align-items:center;gap:12px;background:rgba(15,23,42,0.9);border:1px solid rgba(255,255,255,0.2);padding:12px 20px;border-radius:99px;backdrop-filter:blur(10px);">
                    <button type="button" id="nx-c-flip" style="width:46px;height:46px;border-radius:50%;background:#1e293b;border:1px solid #334155;color:#fff;font-size:17px;cursor:pointer;" title="Flip Camera">🔄</button>
                    <button type="button" id="nx-c-scr" style="width:46px;height:46px;border-radius:50%;background:#1e293b;border:1px solid #38bdf8;color:#38bdf8;font-size:17px;cursor:pointer;" title="Share Screen">🖥️</button>
                    <button type="button" id="nx-c-cam" style="width:46px;height:46px;border-radius:50%;background:#1e293b;border:1px solid #334155;color:#fff;font-size:17px;cursor:pointer;" title="Camera On/Off">📷</button>
                    <button type="button" id="nx-c-mic" style="width:46px;height:46px;border-radius:50%;background:#1e293b;border:1px solid #334155;color:#fff;font-size:17px;cursor:pointer;" title="Mute Mic">🎙️</button>
                    <button type="button" id="nx-c-cut" style="width:56px;height:56px;border-radius:50%;background:#e11d48;border:none;color:#fff;font-size:22px;cursor:pointer;" title="Cut Call">☎️</button>
                </div>
            `;
        }

        document.body.appendChild(overlay);

        if (isVideoUI) {
            const lv = document.getElementById('nx-call-local-vid');
            if (lv) lv.srcObject = localCallStream;
        }

        overlay.querySelector('#nx-c-cut').onclick = () => {
            window.endNexusLiveCallNow(callDocId, true);
            if (window.Nexus && Nexus.toast) Nexus.toast("☎️ Call Ended & Mic Released");
        };

        overlay.querySelector('#nx-c-mic').onclick = function() {
            const t = localCallStream && localCallStream.getAudioTracks()[0];
            if (t) {
                t.enabled = !t.enabled;
                this.style.background = t.enabled ? '#1e293b' : '#e11d48';
                this.textContent = t.enabled ? '🎙️' : '🔇';
            }
        };

        const spk = overlay.querySelector('#nx-c-spk');
        if (spk) {
            spk.onclick = function() {
                const a = document.getElementById('nx-call-remote-aud');
                if (a) {
                    a.muted = !a.muted;
                    this.style.background = a.muted ? '#1e293b' : '#10b981';
                    this.textContent = a.muted ? '🔈' : '🔊';
                }
            };
        }

        const cam = overlay.querySelector('#nx-c-cam');
        if (cam) {
            cam.onclick = function() {
                const t = localCallStream && localCallStream.getVideoTracks()[0];
                if (t) {
                    t.enabled = !t.enabled;
                    this.style.background = t.enabled ? '#1e293b' : '#e11d48';
                }
            };
        }

        const flip = overlay.querySelector('#nx-c-flip');
        if (flip) {
            flip.onclick = async function() {
                currentFacing = currentFacing === 'user' ? 'environment' : 'user';
                try {
                    const ns = await navigator.mediaDevices.getUserMedia({ video: { facingMode: currentFacing } });
                    const nvt = ns.getVideoTracks()[0];
                    if (localCallStream) {
                        localCallStream.getVideoTracks().forEach(t => { t.stop(); localCallStream.removeTrack(t); });
                        localCallStream.addTrack(nvt);
                    }
                    const lv = document.getElementById('nx-call-local-vid');
                    if (lv) lv.srcObject = localCallStream;
                    if (callPc) {
                        const sender = callPc.getSenders().find(s => s.track && s.track.kind === 'video');
                        if (sender) sender.replaceTrack(nvt);
                    }
                } catch (e) {}
            };
        }

        const scr = overlay.querySelector('#nx-c-scr');
        if (scr) {
            scr.onclick = async function() {
                if (!navigator.mediaDevices.getDisplayMedia) return alert("⚠️ Screen Share not supported on this browser!");
                try {
                    const ds = await navigator.mediaDevices.getDisplayMedia({ video: true });
                    const stTrack = ds.getVideoTracks()[0];
                    const lv = document.getElementById('nx-call-local-vid');
                    if (lv) lv.srcObject = ds;
                    if (callPc) {
                        const sender = callPc.getSenders().find(s => s.track && s.track.kind === 'video');
                        if (sender) sender.replaceTrack(stTrack);
                    }
                } catch (e) {}
            };
        }

        if (!window.Nexus || !Nexus.db) return;

        callPc = new RTCPeerConnection(RTC_ICE);
        localCallStream.getTracks().forEach(t => callPc.addTrack(t, localCallStream));

        callPc.ontrack = (ev) => {
            const rem = document.getElementById(isVideoUI ? 'nx-call-remote-vid' : 'nx-call-remote-aud');
            if (rem && ev.streams && ev.streams[0]) {
                rem.srcObject = ev.streams[0];
                rem.play().catch(() => {});
            }
        };

        const callRef = Nexus.db.collection("nexus_calls").doc(callDocId);
        const candCol = callRef.collection("candidates");

        callPc.onicecandidate = (ev) => {
            if (ev.candidate) {
                candCol.add({ sender: myU, candidate: ev.candidate.toJSON(), createdAt: Date.now() }).catch(() => {});
            }
        };

        const startCallClock = () => {
            let s = 0;
            clearInterval(callTimerInt);
            callTimerInt = setInterval(() => {
                s++;
                const mm = String(Math.floor(s / 60)).padStart(2, '0');
                const ss = String(s % 60).padStart(2, '0');
                const stEl = document.getElementById('nx-live-call-status');
                if (stEl) stEl.textContent = `🟢 Connected ${mm}:${ss}`;
            }, 1000);
        };

        if (!isAnswering) {
            const offer = await callPc.createOffer();
            await callPc.setLocalDescription(offer);
            await callRef.set({
                callDocId,
                caller: myU,
                callerName: getMeUser().name || myU,
                receiver: partnerU,
                receiverTargets: Array.from(new Set([partnerU, ctx.partnerDisplayLower].filter(Boolean))),
                mode: callMode,
                offer: { type: offer.type, sdp: offer.sdp },
                answer: null,
                status: 'ringing',
                createdAt: Date.now(),
                updatedAt: Date.now()
            });

            callDocUnsub = callRef.onSnapshot(async snap => {
                if (!snap.exists) return;
                const d = snap.data();
                if (!d) return;
                if (d.status === 'ended' || d.status === 'declined') {
                    await window.endNexusLiveCallNow(null, false);
                    if (Nexus.toast) Nexus.toast("☎️ Call Ended");
                    return;
                }
                if (d.answer && callPc && !callPc.currentRemoteDescription) {
                    await callPc.setRemoteDescription(new RTCSessionDescription(d.answer));
                    startCallClock();
                }
            });
        } else {
            await callPc.setRemoteDescription(new RTCSessionDescription(incomingData.offer));
            const ans = await callPc.createAnswer();
            await callPc.setLocalDescription(ans);
            await callRef.set({
                answer: { type: ans.type, sdp: ans.sdp },
                status: 'connected',
                updatedAt: Date.now()
            }, { merge: true });
            startCallClock();

            callDocUnsub = callRef.onSnapshot(async snap => {
                if (!snap.exists) return;
                const d = snap.data();
                if (d && (d.status === 'ended' || d.status === 'declined')) {
                    await window.endNexusLiveCallNow(null, false);
                    if (Nexus.toast) Nexus.toast("☎️ Call Ended");
                }
            });
        }

        callIceUnsub = candCol.onSnapshot(snap => {
            snap.docChanges().forEach(ch => {
                if (ch.type === 'added') {
                    const cd = ch.doc.data();
                    if (cd && cd.sender !== myU && cd.candidate && callPc) {
                        callPc.addIceCandidate(new RTCIceCandidate(cd.candidate)).catch(() => {});
                    }
                }
            });
        });
    }

    function attachIncomingCallWatcher() {
        if (!window.Nexus || !Nexus.db) return;
        const me = getMeUser();
        const myU = normalizeUser(me.username);
        if (!myU || myU === 'guest' || window.__nxLiveIncomingBound === myU) return;
        window.__nxLiveIncomingBound = myU;

        Nexus.db.collection("nexus_calls").where("receiver", "==", myU).onSnapshot(snap => {
            snap.docChanges().forEach(ch => {
                const d = ch.doc.data();
                if (!d) return;
                const age = Date.now() - Number(d.updatedAt || d.createdAt || 0);
                if (d.status === 'ringing' && age < 35000 && !document.getElementById('nx-live-call-overlay')) {
                    renderIncomingCallScreen(Object.assign({}, d, { callDocId: ch.doc.id }));
                } else if (d.status === 'ended' || d.status === 'declined') {
                    stopRingBeep();
                    document.getElementById('nx-incoming-ring-modal')?.remove();
                }
            });
        });
    }

    function renderIncomingCallScreen(callData) {
        document.getElementById('nx-incoming-ring-modal')?.remove();
        playRingBeep();
        const callerName = callData.callerName || callData.caller || 'Friend';
        const isVid = callData.mode === 'video' || callData.mode === 'screen';

        const m = document.createElement('div');
        m.id = 'nx-incoming-ring-modal';
        m.style.cssText = 'position:fixed;inset:0;background:rgba(5,8,17,0.96);z-index:265000;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:44px 24px;color:#fff;text-align:center;';
        m.innerHTML = `
            <div style="background:rgba(16,185,129,0.16);border:1px solid #10b981;color:#34d399;padding:6px 16px;border-radius:99px;font-size:12px;font-weight:900;">
                🔔 Incoming ${isVid ? 'HD Video' : 'Voice'} Call
            </div>
            <div>
                <div style="width:118px;height:118px;border-radius:50%;background:linear-gradient(135deg,#10b981,#2563eb);color:#020617;font-size:46px;font-weight:900;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;border:3px solid #fff;animation:nxRingPulse 1.3s infinite;">
                    ${callerName[0].toUpperCase()}
                </div>
                <h2 style="font-size:25px;font-weight:900;">${callerName}</h2>
                <p style="font-size:13.5px;color:#38bdf8;margin-top:6px;">@${callData.caller} is calling you...</p>
            </div>
            <div style="display:flex;gap:38px;align-items:center;margin-bottom:16px;">
                <button type="button" id="nx-ring-dec" style="width:66px;height:66px;border-radius:50%;background:#e11d48;border:none;color:#fff;font-size:26px;cursor:pointer;">☎️</button>
                <button type="button" id="nx-ring-acc" style="width:66px;height:66px;border-radius:50%;background:#10b981;border:none;color:#020617;font-size:26px;cursor:pointer;">📞</button>
            </div>
        `;
        document.body.appendChild(m);

        m.querySelector('#nx-ring-dec').onclick = async () => {
            stopRingBeep();
            m.remove();
            if (window.Nexus && Nexus.db) {
                await Nexus.db.collection("nexus_calls").doc(callData.callDocId).set({ status: 'declined', updatedAt: Date.now() }, { merge: true }).catch(() => {});
            }
        };
        m.querySelector('#nx-ring-acc').onclick = () => {
            stopRingBeep();
            m.remove();
            launchUnifiedWebRTCCall(callData.mode || 'audio', true, true, callData);
        };
    }

    window.NexusYTParty = window.NexusWatchParty;
    window.NexusMP3DJ = { openModal: (isDm) => window.NexusWatchParty.openModal(isDm, 'mp3') };

    window.NexusLive = {
        openMediaHubModal: (isDm, mode) => window.NexusWatchParty.openModal(isDm, (mode === 'song' || mode === 'mp3') ? 'mp3' : 'yt'),
        startOrJoinVideoRoom: (isDm) => launchUnifiedWebRTCCall('video', isDm !== false, false, null),
        startVoiceCall: (isDm) => launchUnifiedWebRTCCall('audio', isDm !== false, false, null),
        startLiveScreenShare: (isDm) => launchUnifiedWebRTCCall('screen', isDm !== false, false, null)
    };

    window.NexusScreen = Object.assign(window.NexusScreen || {}, {
        startLiveScreenBroadcast: (isDm) => launchUnifiedWebRTCCall('screen', isDm !== false, false, null)
    });

    function bindAllMediaAndCallHooks() {
        subscribeActiveRoom();
        attachIncomingCallWatcher();
        if (window.NexusAdvance) {
            NexusAdvance.openInAppYouTubeTV = (isDm) => window.NexusWatchParty.openModal(isDm, 'yt');
            NexusAdvance.startVideoCall = (isDm) => window.NexusLive.startOrJoinVideoRoom(isDm);
        }
        if (window.NexusPower) {
            NexusPower.openWatchPartyModal = () => window.NexusWatchParty.openModal(true, 'yt');
            NexusPower.openSongSearchModal = () => window.NexusWatchParty.openModal(true, 'mp3');
            NexusPower.startInternetCall = () => window.NexusLive.startVoiceCall(true);
        }
        if (window.NexusSuperChat) {
            NexusSuperChat.openGroupSongModal = () => window.NexusWatchParty.openModal(false, 'mp3');
        }
    }

    setInterval(bindAllMediaAndCallHooks, 800);
    setTimeout(bindAllMediaAndCallHooks, 150);
})(); // === END OF LIVE.JS ===
