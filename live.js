// ================= LIVE.JS (v35.0 FINAL MASTER): ▶️ OFFICIAL YOUTUBE DATA API v3 + FULL HINDI MP3 SONG DJ + 🎉 LIVE WATCH-PARTY FLOATING EMOJIS + 📹 2-WAY WEBRTC VIDEO CALL + 📞 DEDICATED VOICE CALL + 🖥️ LIVE SCREEN SHARE + 🔔 PARTNER PHONE RINGING + 🎙️ INSTANT CHROME MIC RELEASE =================

(function() {
    const PROTO = 'https:' + '//';
    const RTC_ICE = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" }
        ]
    };

    let activeWpRoom = '', wpUnsub = null, currentMediaKey = '', currentMode = 'yt';
    let isMainHidden = false, isRelHidden = false;
    let searchResultsCache = [];
    let lastEmojiId = '';

    // Call & WebRTC state
    let localCallStream = null, callPc = null, callDocUnsub = null, callIceUnsub = null;
    let callTimerInt = null, ringtoneInt = null, currentFacing = 'user';

    // =========================================================================
    // 1. GLOBAL HARDWARE MIC & CAMERA TRACKER (RELEASES CHROME MIC ON CALL END!)
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
            background: #0f172a; border-bottom: 2px solid #10b981; width: 100%;
            flex-shrink: 0; z-index: 35; display: none; flex-direction: column; position: relative;
        }
        @keyframes nxSpinDisc { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .nx-disc-spin {
            width: 46px; height: 46px; border-radius: 50%; object-fit: cover;
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
            padding: 4px 8px; border-radius: 8px; font-size: 10.5px; font-weight: 800; cursor: pointer;
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

    function getChatCtx(isDmExplicit) {
        let me = getMeUser();
        let myU = normalizeUser(me.username || 'guest');
        const dmRoot = document.getElementById('nx-dm-dedicated-root');
        const isDm = isDmExplicit === true || (dmRoot && dmRoot.style.display !== 'none');

        if (isDm) {
            let pU = '';
            const nameEl = document.getElementById('nx-dm-partner-name');
            if (nameEl && nameEl.getAttribute('data-partner-username')) {
                pU = normalizeUser(nameEl.getAttribute('data-partner-username'));
            } else if (window.NexusDM && NexusDM.activePartner) {
                pU = normalizeUser(NexusDM.activePartner);
            } else if (window.currentChatUser) {
                pU = normalizeUser(window.currentChatUser);
            } else {
                let pName = (nameEl?.innerText || '').trim();
                let uObj = ((window.Nexus && Nexus.users) || []).find(u =>
                    u && ((u.name && u.name.toLowerCase() === pName.toLowerCase()) || (u.username && u.username.toLowerCase() === pName.toLowerCase()))
                );
                pU = uObj ? normalizeUser(uObj.username) : normalizeUser(pName);
            }
            if (!pU) pU = myU;
            let pDisplay = (nameEl?.innerText || pU).trim();
            return {
                isDm: true,
                myU: myU,
                targetUser: pU,
                partnerDisplay: pDisplay,
                roomId: 'dm_' + [myU, pU].sort().join('__')
            };
        }

        let rTitle = document.getElementById('nx-room-title')?.innerText || 'Study Room';
        return {
            isDm: false,
            myU: myU,
            targetUser: '',
            partnerDisplay: rTitle,
            roomId: 'grp_' + rTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')
        };
    }

    // =========================================================================
    // 2. GUARANTEED YOUTUBE DATA API v3 + FULL HINDI MP3 SONG SEARCH ENGINE
    // =========================================================================
    async function searchAllEnginesGuaranteed(rawQuery, mode) {
        const normalizedMode = (mode === 'song' || mode === 'mp3') ? 'mp3' : 'yt';
        let q = (rawQuery || (normalizedMode === 'mp3' ? 'Arijit Singh Hindi Songs' : 'Hindi Hit Songs')).trim();
        let cleanQ = q.replace(/\b(song|songs|mp3|full|audio|video)\b/gi, '').replace(/\s+/g, ' ').trim() || q;
        let mp3List = [], ytList = [], seen = new Set();

        const addMp3 = (it) => { if (it && it.url && !seen.has(it.url)) { seen.add(it.url); mp3List.push(it); } };
        const addYt = (it) => { if (it && it.videoId && !seen.has(it.videoId)) { seen.add(it.videoId); ytList.push(it); } };

        // 1. Direct YouTube Link Check
        let directId = (q.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/) || [])[1];
        if (directId) {
            addYt({
                id: 'yt_' + directId,
                videoId: directId,
                title: "YouTube Direct Video",
                channel: "▶️ YouTube Live Sync",
                thumb: `https://i.ytimg.com/vi/${directId}/mqdefault.jpg`,
                url: `https://www.youtube.com/embed/${directId}?autoplay=1&playsinline=1&rel=0`,
                type: 'yt'
            });
            return ytList;
        }

        // 2. Official Google Cloud YouTube Data API v3 (Enabled by User!)
        const apiKey = (window.Nexus && Nexus.config && Nexus.config.apiKey) || "";
        const fetchOfficialYouTubeApi = async () => {
            if (!apiKey) return;
            try {
                const ytApiUrl = `${PROTO}www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=12&q=${encodeURIComponent(q)}&key=${apiKey}`;
                const r = await fetchFast(ytApiUrl, 4500);
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
                            url: `https://www.youtube.com/embed/${vid}?autoplay=1&playsinline=1&rel=0`,
                            type: 'yt'
                        });
                    }
                });
            } catch (e) {}
        };

        // 3. JioSaavn Full-Length MP3 Parser + iTunes MP3 Fallback
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

        const fetchItunesMp3 = async () => {
            try {
                const r = await fetchFast(`${PROTO}itunes.apple.com/search?term=${encodeURIComponent(cleanQ)}&country=IN&media=music&limit=10`, 4500);
                if (!r.ok) return;
                const d = await r.json();
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
            } catch (e) {}
        };

        // 4. Direct YouTube HTML Scraper Backup (Works even without API key!)
        const parseYtHtml = (html) => {
            if (!html || typeof html !== 'string') return;
            let parts = html.split('"videoRenderer":{"videoId":"');
            for (let i = 1; i < parts.length && ytList.length < 12; i++) {
                let chunk = parts[i].substring(0, 1200);
                let vid = chunk.substring(0, 11);
                if (/^[a-zA-Z0-9_-]{11}$/.test(vid)) {
                    let tm = chunk.match(/"title":\{"runs":\[\{"text":"([^"]+)"/) || chunk.match(/"title":\{"simpleText":"([^"]+)"/);
                    let title = tm ? tm[1].replace(/\\u0026/g, '&').replace(/\\"/g, '"') : 'YouTube Video';
                    addYt({
                        id: 'yt_' + vid,
                        videoId: vid,
                        title: title,
                        channel: '▶️ YouTube Video',
                        thumb: `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`,
                        url: `https://www.youtube.com/embed/${vid}?autoplay=1&playsinline=1&rel=0`,
                        type: 'yt'
                    });
                }
            }
        };

        const saavnOfficial = `${PROTO}www.jiosaavn.com/api.php?p=1&q=${encodeURIComponent(cleanQ)}&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=12&__call=search.getResults`;
        const ytPage = `${PROTO}www.youtube.com/results?search_query=${encodeURIComponent(q)}&hl=en`;

        await Promise.allSettled([
            fetchOfficialYouTubeApi(),
            fetchFast(`${PROTO}api.allorigins.win/raw?url=${encodeURIComponent(ytPage)}`, 5000).then(r => r.text()).then(parseYtHtml),
            fetchFast(`${PROTO}api.codetabs.com/v1/proxy?quest=${encodeURIComponent(ytPage)}`, 5000).then(r => r.text()).then(parseYtHtml),
            fetchFast(`${PROTO}api.allorigins.win/raw?url=${encodeURIComponent(saavnOfficial)}`, 5000).then(r => r.json()).then(parseSaavn),
            fetchFast(`${PROTO}saavn.dev/api/search/songs?query=${encodeURIComponent(cleanQ)}&limit=10`, 4500).then(r => r.json()).then(parseSaavn),
            fetchItunesMp3()
        ]);

        return normalizedMode === 'mp3' ? [...mp3List, ...ytList] : [...ytList, ...mp3List];
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

    function renderDock(docData, isDm) {
        let dock = document.getElementById('nx-wp-dock');
        if (!dock) { dock = document.createElement('div'); dock.id = 'nx-wp-dock'; }
        const target = isDm ? document.getElementById('nx-dm-msgs-box') : document.getElementById('nx-room-messages');
        if (target && target.parentNode && dock.nextSibling !== target) {
            target.parentNode.insertBefore(dock, target);
        }

        if (!docData || !docData.active || !docData.url) {
            dock.style.display = 'none'; dock.innerHTML = ''; currentMediaKey = ''; return;
        }

        // Check if partner sent a live floating reaction emoji
        if (docData.lastEmoji && docData.lastEmoji.id && docData.lastEmoji.id !== lastEmojiId) {
            lastEmojiId = docData.lastEmoji.id;
            spawnFloatingWatchPartyEmoji(docData.lastEmoji.char);
        }

        dock.style.display = 'flex';
        let mKey = (docData.url || '') + '_' + (docData.startOffset || 0);
        let relList = Array.isArray(docData.related) && docData.related.length ? docData.related : searchResultsCache;
        let isMp3 = docData.mediaType === 'mp3';

        if (mKey !== currentMediaKey) {
            currentMediaKey = mKey;
            let startSec = Math.max(0, Math.round(docData.currentTime || 0));

            let stageHTML = isMp3 ? `
                <div style="display:flex; align-items:center; gap:12px; padding:10px 14px; background:#090d16;">
                    <img src="${docData.thumb || 'https://placehold.co/100x100/10b981/020617?text=MP3'}" class="nx-disc-spin">
                    <div style="flex:1; min-width:0;">
                        <div style="font-size:12.5px; font-weight:900; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">🎵 ${(docData.title || 'Full MP3 Song').replace(/</g, '&lt;')}</div>
                        <div style="font-size:10.5px; color:#10b981; font-weight:800; margin-bottom:4px;">🟢 Synced Audio DJ • @${docData.startedBy || 'member'}</div>
                        <audio id="nx-wp-audio-el" src="${docData.url}" controls autoplay style="width:100%; height:34px;"></audio>
                    </div>
                </div>
            ` : `
                <div style="position:relative; width:100%; height:195px; background:#000;">
                    <iframe src="${docData.videoId ? `https://www.youtube.com/embed/${docData.videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1&start=${startSec}` : docData.url}" style="width:100%; height:195px; border:none; background:#000;" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
                </div>
                <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 10px; background:#0f172a; border-top:1px solid #1e293b; gap:5px; flex-wrap:wrap;">
                    <span style="font-size:10.5px; color:#10b981; font-weight:800; flex:1;">🟢 Sync • @${docData.startedBy || 'member'}</span>
                    <div style="display:flex; gap:4px;">
                        ${['🔥','❤️','😂','👏'].map(em => `<button type="button" class="nx-tw-pill" onclick="NexusWatchParty.sendLiveEmoji('${em}')">${em}</button>`).join('')}
                    </div>
                    <button type="button" class="nx-tw-pill" onclick="NexusWatchParty.seekYtVideo(-15)">⏪ -15s</button>
                    <button type="button" class="nx-tw-pill" onclick="NexusWatchParty.seekYtVideo(15)">⏩ +15s</button>
                    <button type="button" class="nx-tw-pill" style="background:#10b981; color:#020617; border:none;" onclick="NexusWatchParty.restartYtTogether()">🔄 Sync</button>
                </div>
            `;

            dock.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 10px; background:#182229; border-bottom:1px solid #2a3942; gap:5px;">
                    <span style="font-size:11.5px; font-weight:900; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;">${isMp3 ? '🎵' : '▶️'} ${(docData.title || 'Live Media').replace(/</g, '&lt;')}</span>
                    <button type="button" class="nx-tw-pill" style="border-color:#38bdf8; color:#38bdf8;" onclick="NexusWatchParty.openModal(${isDm}, '${isMp3 ? 'mp3' : 'yt'}')">🔍 Search</button>
                    <button type="button" id="nx-btn-toggle-main" class="nx-tw-pill" onclick="NexusWatchParty.toggleMainPlayer()">${isMainHidden ? '🔼 Show' : '🔽 Hide'}</button>
                    <button type="button" id="nx-btn-toggle-rel" class="nx-tw-pill" style="border-color:#a78bfa; color:#d8b4fe;" onclick="NexusWatchParty.toggleRelatedStrip()">${isRelHidden ? '🔥 Next' : '🔥 Hide Next'}</button>
                    <button type="button" class="nx-tw-pill" style="background:#ef4444; border:none; color:white;" onclick="NexusWatchParty.stop()">✕</button>
                </div>
                <div id="nx-wp-main-stage" style="display:${isMainHidden ? 'none' : 'flex'}; flex-direction:column;">${stageHTML}</div>
                <div id="nx-wp-related-stage" style="display:${isRelHidden ? 'none' : 'flex'}; flex-direction:column;">
                    <div style="padding:4px 10px 2px; background:#050811; font-size:10px; font-weight:900; color:#93c5fd;">🔥 UP NEXT / RELATED (TAP TO PLAY 👉):</div>
                    <div class="nx-horiz-strip">
                        ${relList.map((r, i) => `
                            <div onclick="NexusWatchParty.playRelatedItem(${i}, ${isDm})" style="min-width:165px; max-width:165px; background:#111827; border:1px solid #26334d; border-radius:12px; padding:6px; display:flex; align-items:center; gap:8px; cursor:pointer; flex-shrink:0;">
                                <img src="${r.thumb}" style="width:40px; height:40px; border-radius:8px; object-fit:cover; flex-shrink:0;">
                                <div style="min-width:0; flex:1;">
                                    <div style="font-size:11px; font-weight:800; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${(r.title || '').replace(/</g, '&lt;')}</div>
                                    <div style="font-size:9.5px; color:#10b981; font-weight:800;">Play Now ▶</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    function subscribeActiveRoom() {
        if (!window.Nexus || !Nexus.db) return;
        const dmRoot = document.getElementById('nx-dm-dedicated-root');
        const grpRoom = document.getElementById('nx-chat-room');
        let isDm = dmRoot && dmRoot.style.display !== 'none';
        let isGrp = grpRoom && grpRoom.style.display !== 'none';
        if (!isDm && !isGrp) return;

        let ctx = getChatCtx(isDm);
        if (ctx.roomId === activeWpRoom && wpUnsub) return;
        activeWpRoom = ctx.roomId;

        if (wpUnsub) wpUnsub();
        wpUnsub = Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).onSnapshot(doc => {
            renderDock(doc.exists ? doc.data() : null, isDm);
        }, () => {});
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
                        <button type="button" onclick="NexusWatchParty.openModal(${Boolean(isDm)}, 'yt')" style="flex:1; padding:8px; border-radius:10px; border:none; background:${currentMode === 'yt' ? '#ef4444' : '#1e293b'}; color:white; font-weight:900; font-size:12px; cursor:pointer;">▶️ YouTube TV</button>
                        <button type="button" onclick="NexusWatchParty.openModal(${Boolean(isDm)}, 'mp3')" style="flex:1; padding:8px; border-radius:10px; border:none; background:${currentMode === 'mp3' ? '#10b981' : '#1e293b'}; color:${currentMode === 'mp3' ? '#020617' : 'white'}; font-weight:900; font-size:12px; cursor:pointer;">🎵 Full MP3 Songs</button>
                    </div>
                    <div style="display:flex; gap:6px; margin-bottom:10px;">
                        <input type="text" id="nx-wp-in" placeholder="Search any Song, Movie, PW Lecture or paste link..." onkeydown="if(event.key==='Enter') NexusWatchParty.search(${Boolean(isDm)})" style="flex:1; padding:9px 12px; border-radius:10px; border:1px solid #334155; background:#111827; color:white; font-size:12.5px; outline:none;">
                        <button type="button" onclick="NexusWatchParty.search(${Boolean(isDm)})" style="background:${currentMode === 'mp3' ? '#10b981' : '#ef4444'}; color:${currentMode === 'mp3' ? '#020617' : 'white'}; border:none; padding:0 14px; border-radius:10px; font-weight:900; font-size:12px; cursor:pointer;">Search</button>
                    </div>
                    <div id="nx-wp-results" style="display:flex; flex-direction:column; gap:7px; max-height:52vh; overflow-y:auto;"></div>
                </div>
            `;
            modal.style.display = 'flex';
            const inp = document.getElementById('nx-wp-in');
            if (inp) inp.focus();
            this.search(Boolean(isDm), currentMode === 'mp3' ? 'Arijit Singh Hindi Songs' : 'Bollywood Hit Songs');
        },

        search: async function(isDm, fallbackQ) {
            const inp = document.getElementById('nx-wp-in');
            const box = document.getElementById('nx-wp-results');
            if (!box) return;
            let q = (inp && inp.value.trim()) ? inp.value.trim() : (fallbackQ || 'Hindi Hit Songs');
            box.innerHTML = `<div style="text-align:center; padding:16px; color:#38bdf8; font-size:12.5px; font-weight:800;">⚡ Searching "${q}"...</div>`;

            let list = await searchAllEnginesGuaranteed(q, currentMode);
            searchResultsCache = list.slice(0, 14);

            if (!list.length) {
                box.innerHTML = `<div style="text-align:center; padding:14px; color:#94a3b8; font-size:12px;">No results found. Try another keyword or paste a YouTube link!</div>`;
                return;
            }

            box.innerHTML = searchResultsCache.map((v, idx) => `
                <div onclick="NexusWatchParty.playByIndex(${idx}, ${Boolean(isDm)})" style="display:flex; align-items:center; gap:10px; padding:8px; background:#161f33; border:1px solid #26334d; border-radius:12px; cursor:pointer;">
                    <img src="${v.thumb}" style="width:58px; height:44px; border-radius:8px; object-fit:cover; flex-shrink:0; background:#000;">
                    <div style="min-width:0; flex:1;">
                        <div style="font-weight:800; font-size:12px; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${(v.title || '').replace(/</g, '&lt;')}</div>
                        <div style="font-size:10.5px; color:#10b981; font-weight:700;">${(v.channel || '').replace(/</g, '&lt;')}</div>
                    </div>
                    <span style="background:${v.type === 'mp3' ? '#10b981' : '#ef4444'}; color:${v.type === 'mp3' ? '#020617' : 'white'}; padding:5px 10px; border-radius:8px; font-size:10.5px; font-weight:900; flex-shrink:0;">Play ▶</span>
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
            isRelHidden = false;
            currentMediaKey = '';

            let payload = {
                active: true,
                title: item.title || 'Live Media',
                url: item.url,
                videoId: item.videoId || '',
                thumb: item.thumb || '',
                mediaType: item.type || 'yt',
                playState: 'PLAYING',
                currentTime: 0,
                startOffset: Date.now() % 1000,
                related: searchResultsCache.filter((_, i) => i !== idx).slice(0, 8),
                startedBy: me ? me.username : 'member',
                updatedAt: Date.now()
            };

            renderDock(payload, ctx.isDm);
            subscribeActiveRoom();

            if (window.Nexus && Nexus.db) {
                await Nexus.db.collection("nexus_watch_party").doc(ctx.roomId).set(payload).catch(() => {});
            }
            if (window.Nexus && Nexus.toast) Nexus.toast(`🎵 Playing "${item.title}" in Sync!`);
        },

        playRelatedItem: async function(relIdx, isDm) {
            if (!activeWpRoom || !window.Nexus || !Nexus.db) return;
            const doc = await Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).get();
            const rels = (doc.exists && Array.isArray(doc.data().related)) ? doc.data().related : searchResultsCache;
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
            if (btn) btn.innerText = isRelHidden ? '🔥 Next' : '🔥 Hide Next';
        },

        seekYtVideo: async function(deltaSec) {
            if (!activeWpRoom || !Nexus.db) return;
            const doc = await Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).get();
            if (!doc.exists) return;
            let d = doc.data();
            let nextSec = Math.max(0, Math.round((d.currentTime || 0) + deltaSec));
            await Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).set({
                currentTime: nextSec, startOffset: nextSec, updatedAt: Date.now()
            }, { merge: true });
        },

        restartYtTogether: async function() {
            if (!activeWpRoom || !Nexus.db) return;
            await Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).set({
                currentTime: 0, startOffset: Date.now() % 1000, updatedAt: Date.now()
            }, { merge: true });
        },

        stop: function() {
            if (window.Nexus && Nexus.db && activeWpRoom) {
                Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).set({ active: false }, { merge: true }).catch(() => {});
            }
            const dock = document.getElementById('nx-wp-dock');
            if (dock) { dock.style.display = 'none'; dock.innerHTML = ''; }
            currentMediaKey = '';
        }
    };

    // =========================================================================
    // 3. 2-WAY WEBRTC VIDEO CALL, VOICE CALL & SCREEN SHARE + PARTNER RINGING
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

        // Instantly stop all hardware mic/camera tracks so Chrome top mic indicator disappears!
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
            // DEDICATED WHATSAPP VOICE CALL SCREEN (MIC ONLY)
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
            // DEDICATED FULL-SCREEN HD VIDEO CALL / SCREEN SHARE UI
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

    // Incoming Call Listener for Receiver's Phone
    function attachIncomingCallWatcher() {
        if (!window.Nexus || !Nexus.db) return;
        const myU = normalizeUser(getMeUser().username);
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

    // Expose all global objects expected by dotsmenu.js, advance.js, power.js & screen.js
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
