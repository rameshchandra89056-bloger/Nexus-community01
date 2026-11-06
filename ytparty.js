// ================= YTPARTY.JS (v3.0 ZERO-DUMMY & DUAL SHOW/HIDE MASTER): 🚫 ZERO DUMMY SONGS FOREVER + ▶️ REAL YOUTUBE & FULL 4-5 MIN MP3 PARALLEL SEARCH + 🔥 DYNAMIC RELATED SONGS FOR CURRENT TRACK + 🔽 SEPARATE SHOW/HIDE BUTTONS FOR MAIN PLAYER & RELATED STRIP + 📹 INSTANT VIDEO CALL MEETING RING & CAMERA HARDWARE AUTO-STOP =================

(function() {
    const PROTO = 'https:' + '//';
    let activeWpRoom = '', wpUnsub = null;
    let currentMediaKey = '', currentMode = 'yt';
    let isMainPlayerHidden = false;
    let isRelatedStripHidden = false;
    let isRemoteSyncing = false;
    let currentRelatedList = [];
    let audioSpeed = 1;

    // Video Call Meeting State & Camera Hardware Cleaner
    let activeLocalStreams = [];
    let activeCallRoomId = '';
    let incomingMeetingUnsub = null;
    let meetingRingInterval = null;

    const st = document.createElement('style');
    st.innerHTML = `
        #nx-grp-wp-box, #nx-dm-wp-box, #nx-watch-party-box { display: none !important; }
        @keyframes nxSmoothSlide {
            0% { opacity: 0; transform: translateY(-8px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes nxSpinVinyl {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        #nx-ytparty-dock, #nx-wp-dock {
            background: linear-gradient(180deg, #0f172a 0%, #090d16 100%);
            border-bottom: 2px solid #10b981; width: 100%; flex-shrink: 0;
            z-index: 35; display: none; flex-direction: column;
            animation: nxSmoothSlide 0.22s ease-out;
            box-shadow: 0 10px 28px rgba(0,0,0,0.8);
        }
        .nx-tw-pill {
            background: #1e293b; border: 1px solid #334155; color: #f8fafc;
            padding: 5px 9px; border-radius: 9px; font-size: 10.5px; font-weight: 800;
            cursor: pointer; transition: all 0.16s ease; display: inline-flex; align-items: center; gap: 4px;
            white-space: nowrap;
        }
        .nx-tw-pill:active { transform: scale(0.93); }
        .nx-rel-scroll-row {
            display: flex; gap: 8px; overflow-x: auto; padding: 8px 10px;
            background: #050811; border-top: 1px solid #1e293b;
            -webkit-overflow-scrolling: touch; touch-action: pan-x; scrollbar-width: none;
        }
        .nx-rel-scroll-row::-webkit-scrollbar { display: none; }
        .nx-rel-card-item {
            min-width: 170px; max-width: 170px; background: #111827;
            border: 1px solid #26334d; border-radius: 12px; padding: 6px;
            cursor: pointer; flex-shrink: 0; display: flex; align-items: center; gap: 8px;
            transition: transform 0.15s ease, border-color 0.2s ease;
        }
        .nx-rel-card-item:active { transform: scale(0.95); border-color: #10b981; }
        .nx-vinyl-spin {
            width: 46px; height: 46px; border-radius: 50%; object-fit: cover;
            border: 2px solid #10b981; animation: nxSpinVinyl 6s linear infinite; flex-shrink: 0;
        }
        /* Incoming Video Call Meeting Banner */
        #nx-incoming-meeting-modal {
            position: fixed; top: 12px; left: 50%; transform: translateX(-50%);
            width: 94%; max-width: 415px; background: linear-gradient(135deg, #0f172a, #064e3b);
            border: 2px solid #10b981; border-radius: 20px; padding: 14px 16px;
            z-index: 100350; display: none; align-items: center; justify-content: space-between;
            gap: 10px; box-shadow: 0 20px 50px rgba(0,0,0,0.95);
        }
    `;
    document.head.appendChild(st);

    // =========================================================================
    // 0. 📹 CAMERA HARDWARE AUTO-STOPPER (Fixes Screenshot 1000073333.jpg!)
    // Ensures Android "A site is using your camera" notification disappears immediately when call closes!
    // =========================================================================
    function stopAllCameraAndMicHardware() {
        activeLocalStreams.forEach(s => {
            if (s && typeof s.getTracks === 'function') {
                s.getTracks().forEach(t => { try { t.stop(); } catch (e) {} });
            }
        });
        activeLocalStreams = [];
        if (window.__nxVStream && typeof window.__nxVStream.getTracks === 'function') {
            window.__nxVStream.getTracks().forEach(t => { try { t.stop(); } catch (e) {} });
            window.__nxVStream = null;
        }
        document.querySelectorAll('video').forEach(v => {
            if (v.srcObject && !v.closest('#nx-vconf-modal')) {
                try {
                    v.srcObject.getTracks().forEach(t => t.stop());
                    v.srcObject = null;
                } catch (e) {}
            }
        });
    }

    function fetchFastTimeout(url, ms) {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), ms || 6500);
        return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(t));
    }

    function getChatCtx(isDmExplicit) {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let myU = me && me.username ? me.username.toLowerCase().trim() : 'guest';
        const dmRoot = document.getElementById('nx-dm-dedicated-root');
        const isDm = isDmExplicit === true || (dmRoot && dmRoot.style.display !== 'none');
        if (isDm) {
            let pName = document.getElementById('nx-dm-partner-name')?.innerText || '';
            let uObj = (Nexus.users || []).find(u => u && ((u.name && u.name.toLowerCase() === pName.trim().toLowerCase()) || (u.username && u.username.toLowerCase() === pName.trim().toLowerCase())));
            let pU = uObj ? uObj.username.toLowerCase().trim() : pName.toLowerCase().replace(/[^a-z0-9_]/g, '');
            return { isDm: true, roomId: 'dm_' + [myU, pU].sort().join('__'), title: `Video Meeting • ${pName || '@' + pU}`, targetUser: pU };
        }
        let rTitle = document.getElementById('nx-room-title')?.innerText || 'Study Room';
        return { isDm: false, roomId: 'grp_' + rTitle.toLowerCase().replace(/[^a-z0-9]/g, '_'), title: `${rTitle} • Group Video Meeting`, targetUser: '' };
    }

    // =========================================================================
    // 1. 🎵 REAL FULL-LENGTH 4-5 MIN MP3 ENGINE (Official JioSaavn CDN aac.saavncdn.com)
    // =========================================================================
    function upgradeSaavnPreviewToFullMp4(url) {
        if (!url || typeof url !== 'string') return '';
        return url.replace('preview.saavncdn.com', 'aac.saavncdn.com')
                  .replace('_96_p.mp4', '_160.mp4')
                  .replace('_96_p.m4a', '_160.m4a');
    }

    function extractSaavnTracks(dataObj, pushFn) {
        let arr = (dataObj && dataObj.data && Array.isArray(dataObj.data.results)) ? dataObj.data.results
                : (dataObj && Array.isArray(dataObj.results)) ? dataObj.results : [];
        arr.forEach(s => {
            let bestUrl = '';
            if (Array.isArray(s.downloadUrl) && s.downloadUrl.length) {
                let last = s.downloadUrl[s.downloadUrl.length - 1];
                bestUrl = last.url || last.link || '';
            }
            if (!bestUrl && s.more_info && s.more_info.media_preview_url) {
                bestUrl = upgradeSaavnPreviewToFullMp4(s.more_info.media_preview_url);
            }
            if (!bestUrl && s.media_preview_url) {
                bestUrl = upgradeSaavnPreviewToFullMp4(s.media_preview_url);
            }
            let thumb = '';
            if (Array.isArray(s.image) && s.image.length) {
                let lastImg = s.image[s.image.length - 1];
                thumb = lastImg.url || lastImg.link || '';
            } else if (typeof s.image === 'string') {
                thumb = s.image.replace('150x150', '500x500');
            }
            let dur = Number(s.duration || (s.more_info && s.more_info.duration) || 240);
            if (bestUrl && dur >= 55) {
                let m = Math.floor(dur / 60);
                let sec = dur % 60;
                let title = (s.name || s.title || s.song || 'Song').replace(/&quot;/g, '"').replace(/&#039;/g, "'");
                let artist = s.primaryArtists || (s.more_info && s.more_info.music) || s.subtitle || 'Artist';
                pushFn({
                    id: 'mp3_' + (s.id || Math.random()),
                    title: title,
                    artistName: artist,
                    channel: `${artist} • 🎵 Full MP3 (${m}:${sec < 10 ? '0' + sec : sec})`,
                    thumb: thumb || 'https://placehold.co/100x100/10b981/020617?text=MP3',
                    url: bestUrl,
                    type: 'mp3'
                });
            }
        });
    }

    async function searchRealMp3Songs(rawQuery) {
        let q = (rawQuery || 'Hindi Hit Songs').trim();
        let cleanQ = q.replace(/\b(song|songs|mp3|full|audio|video)\b/gi, '').replace(/\s+/g, ' ').trim() || q;
        let list = [];
        let seen = new Set();

        const pushItem = (it) => {
            if (!it || !it.url || seen.has(it.url)) return;
            seen.add(it.url);
            list.push(it);
        };

        const officialSaavn = `${PROTO}www.jiosaavn.com/api.php?p=1&q=${encodeURIComponent(cleanQ)}&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=14&__call=search.getResults`;

        await Promise.allSettled([
            fetchFastTimeout(`${PROTO}api.allorigins.win/get?url=${encodeURIComponent(officialSaavn)}`, 6500)
                .then(r => r.json()).then(d => extractSaavnTracks(JSON.parse(d.contents), pushItem)),
            fetchFastTimeout(`${PROTO}api.codetabs.com/v1/proxy?quest=${encodeURIComponent(officialSaavn)}`, 6500)
                .then(r => r.json()).then(d => extractSaavnTracks(d, pushItem)),
            fetchFastTimeout(`${PROTO}saavn.dev/api/search/songs?query=${encodeURIComponent(cleanQ)}&limit=12`, 6000)
                .then(r => r.json()).then(d => extractSaavnTracks(d, pushItem)),
            fetchFastTimeout(`${PROTO}jiosaavn-api-privatecvc2.vercel.app/search/songs?query=${encodeURIComponent(cleanQ)}&limit=12`, 6000)
                .then(r => r.json()).then(d => extractSaavnTracks(d, pushItem))
        ]);

        return list;
    }

    // =========================================================================
    // 2. ▶️ REAL YOUTUBE VIDEO / CARTOON / MOVIE / SONG SEARCH (ZERO DUMMY!)
    // =========================================================================
    function extractYtVideosFromHtml(html, pushVid) {
        if (!html || typeof html !== 'string') return;
        let parts = html.split('"videoRenderer":{"videoId":"');
        for (let i = 1; i < parts.length; i++) {
            let chunk = parts[i].substring(0, 1400);
            let vid = chunk.substring(0, 11);
            if (/^[a-zA-Z0-9_-]{11}$/.test(vid)) {
                let tm = chunk.match(/"title":\{"runs":\[\{"text":"([^"]+)"/) || chunk.match(/"title":\{"simpleText":"([^"]+)"/);
                let lm = chunk.match(/"lengthText":\{"simpleText":"([^"]+)"/);
                let cm = chunk.match(/"ownerText":\{"runs":\[\{"text":"([^"]+)"/);
                let title = tm ? tm[1].replace(/\\u0026/g, '&').replace(/\\"/g, '"') : 'YouTube Video';
                let dur = lm ? lm[1] : 'Full Video';
                let ch = cm ? cm[1] : 'YouTube';
                pushVid({
                    id: 'yt_' + vid,
                    videoId: vid,
                    title: title,
                    artistName: ch,
                    channel: `▶️ ${ch} • (${dur})`,
                    thumb: `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`,
                    url: `https://www.youtube.com/embed/${vid}?autoplay=1&playsinline=1&rel=0&modestbranding=1`,
                    type: 'yt'
                });
            }
        }
    }

    async function searchRealYouTubeVideos(rawQuery) {
        let q = (rawQuery || 'Motu Patlu').trim();
        let list = [];
        let seen = new Set();

        const pushVid = (v) => {
            if (!v || !v.videoId || seen.has(v.videoId)) return;
            seen.add(v.videoId);
            list.push(v);
        };

        let directId = (q.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/) || [])[1];
        if (directId) {
            pushVid({
                id: 'yt_' + directId,
                videoId: directId,
                title: "Direct YouTube Video",
                artistName: "YouTube",
                channel: "▶️ YouTube Live Sync",
                thumb: `https://i.ytimg.com/vi/${directId}/mqdefault.jpg`,
                url: `https://www.youtube.com/embed/${directId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`,
                type: 'yt'
            });
            return list;
        }

        const ytSearchUrl = `${PROTO}www.youtube.com/results?search_query=${encodeURIComponent(q)}&hl=en`;
        const pipedList = [
            `${PROTO}pipedapi.kavin.rocks/search?q=${encodeURIComponent(q)}&filter=videos`,
            `${PROTO}pipedapi.leptons.xyz/search?q=${encodeURIComponent(q)}&filter=videos`,
            `${PROTO}pipedapi.nosebs.ru/search?q=${encodeURIComponent(q)}&filter=videos`,
            `${PROTO}pipedapi.adminforge.de/search?q=${encodeURIComponent(q)}&filter=videos`
        ];
        const invList = [
            `${PROTO}inv.nadeko.net/api/v1/search?q=${encodeURIComponent(q)}&type=video`,
            `${PROTO}invidious.nerdvpn.de/api/v1/search?q=${encodeURIComponent(q)}&type=video`,
            `${PROTO}invidious.jing.rocks/api/v1/search?q=${encodeURIComponent(q)}&type=video`
        ];

        await Promise.allSettled([
            ...pipedList.map(u => fetchFastTimeout(u, 6000).then(r => r.json()).then(d => {
                (d && Array.isArray(d.items) ? d.items : []).slice(0, 12).forEach(v => {
                    let vid = ((v.url || '').match(/v=([a-zA-Z0-9_-]{11})/) || [])[1];
                    if (vid) pushVid({ id: 'yt_' + vid, videoId: vid, title: v.title || 'Video', artistName: v.uploaderName || 'YouTube', channel: `▶️ ${v.uploaderName || 'YouTube'}`, thumb: `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`, url: `https://www.youtube.com/embed/${vid}?autoplay=1&playsinline=1&rel=0&modestbranding=1`, type: 'yt' });
                });
            })),
            ...invList.map(u => fetchFastTimeout(u, 6000).then(r => r.json()).then(d => {
                (Array.isArray(d) ? d : []).slice(0, 12).forEach(v => {
                    if (v && v.videoId) pushVid({ id: 'yt_' + v.videoId, videoId: v.videoId, title: v.title || 'Video', artistName: v.author || 'YouTube', channel: `▶️ ${v.author || 'YouTube'}`, thumb: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`, url: `https://www.youtube.com/embed/${v.videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`, type: 'yt' });
                });
            })),
            fetchFastTimeout(`${PROTO}api.allorigins.win/get?url=${encodeURIComponent(ytSearchUrl)}`, 7000)
                .then(r => r.json()).then(d => extractYtVideosFromHtml(d && d.contents ? d.contents : '', pushVid)),
            fetchFastTimeout(`${PROTO}api.codetabs.com/v1/proxy?quest=${encodeURIComponent(ytSearchUrl)}`, 7000)
                .then(r => r.text()).then(html => extractYtVideosFromHtml(html, pushVid))
        ]);

        return list;
    }

    // Fetch Dynamic Related Songs/Videos specifically matching the currently playing song/video!
    async function fetchTrueRelatedForTrack(item) {
        if (!item) return [];
        let baseQuery = (item.title || '').replace(/\([^)]*\)|\[[^\]]*\]/g, '').trim().split(/\s+/).slice(0, 4).join(' ');
        if (item.artistName && !baseQuery.toLowerCase().includes(item.artistName.toLowerCase())) {
            baseQuery = `${baseQuery} ${item.artistName}`;
        }
        let list = item.type === 'mp3'
            ? await searchRealMp3Songs(baseQuery)
            : await searchRealYouTubeVideos(baseQuery);
        return list.filter(x => x.url !== item.url && x.videoId !== item.videoId).slice(0, 10);
    }

    // =========================================================================
    // 3. 🔄 RENDER PLAYER DOCK WITH 2 SEPARATE SHOW/HIDE BUTTONS (PLAYER & RELATED)
    // =========================================================================
    function broadcastState(stateName, customTimeSec) {
        if (isRemoteSyncing || !activeWpRoom || !Nexus.db) return;
        let me = Nexus.getCurrentUser();
        const aud = document.getElementById('nx-wp-audio-el');
        let sec = typeof customTimeSec === 'number' ? customTimeSec : (aud ? aud.currentTime : 0);

        Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).set({
            playState: stateName,
            currentTime: Math.max(0, Math.round(sec)),
            updatedBy: me ? me.username : 'partner',
            updatedAt: Date.now()
        }, { merge: true }).catch(() => {});
    }

    function renderDockUI(docData, isDm) {
        // Hide any old duplicate docks
        const oldYtDock = document.getElementById('nx-ytparty-dock');
        if (oldYtDock) oldYtDock.style.display = 'none';

        let dock = document.getElementById('nx-wp-dock');
        if (!dock) { dock = document.createElement('div'); dock.id = 'nx-wp-dock'; }
        const target = isDm ? document.getElementById('nx-dm-msgs-box') : document.getElementById('nx-room-messages');
        if (target && target.parentNode && dock.nextSibling !== target) {
            target.parentNode.insertBefore(dock, target);
        }

        if (!docData || !docData.active || !docData.url) {
            dock.style.display = 'none'; dock.innerHTML = ''; currentMediaKey = ''; return;
        }

        dock.style.display = 'flex';
        let mediaKey = (docData.url || '') + '_' + (docData.startOffset || 0);
        let relList = Array.isArray(docData.related) ? docData.related : currentRelatedList;
        let isMp3 = docData.mediaType === 'mp3';

        if (mediaKey !== currentMediaKey) {
            currentMediaKey = mediaKey;
            let startSec = Math.max(0, Math.round(docData.currentTime || 0));

            let mainStageHTML = isMp3 ? `
                <div style="display:flex; align-items:center; gap:12px; padding:10px 14px; background:#090d16;">
                    <img src="${docData.thumb || 'https://placehold.co/100x100/10b981/020617?text=MP3'}" class="nx-vinyl-spin">
                    <div style="flex:1; min-width:0;">
                        <div style="font-size:12.5px; font-weight:900; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">🎵 ${(docData.title || 'Full MP3 Song').replace(/</g, '&lt;')}</div>
                        <div id="nx-wp-live-status" style="font-size:10.5px; color:#10b981; font-weight:800; margin-bottom:4px;">🟢 Synced Full MP3 • @${docData.startedBy || 'member'}</div>
                        <audio id="nx-wp-audio-el" src="${docData.url}" controls autoplay style="width:100%; height:34px;"></audio>
                    </div>
                    <button type="button" class="nx-tw-pill" style="border-color:#38bdf8; color:#38bdf8;" onclick="NexusWatchParty.cycleSpeed(this)">1x</button>
                </div>
            ` : `
                <div style="position:relative; width:100%; height:195px; background:#000;">
                    <iframe id="nx-wp-yt-iframe" src="${docData.videoId ? `https://www.youtube.com/embed/${docData.videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1&start=${startSec}` : docData.url}" sandbox="allow-scripts allow-same-origin allow-presentation" style="width:100%; height:195px; border:none; background:#000;" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
                </div>
                <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 10px; background:#0f172a; border-top:1px solid #1e293b; gap:6px;">
                    <span id="nx-wp-live-status" style="font-size:10.5px; color:#10b981; font-weight:800; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">🟢 Synced Live • @${docData.updatedBy || docData.startedBy || 'member'}</span>
                    <button type="button" class="nx-tw-pill" onclick="NexusWatchParty.seekYtVideo(-15)">⏪ -15s</button>
                    <button type="button" class="nx-tw-pill" onclick="NexusWatchParty.seekYtVideo(15)">⏩ +15s</button>
                    <button type="button" class="nx-tw-pill" style="background:#10b981; color:#020617; border:none;" onclick="NexusWatchParty.restartYtTogether()">🔄 Sync Both</button>
                </div>
            `;

            dock.innerHTML = `
                <!-- Top Control Header with Separate Show/Hide for Main Player AND Related Songs -->
                <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 10px; background:#182229; border-bottom:1px solid #2a3942; gap:6px;">
                    <div style="display:flex; align-items:center; gap:6px; min-width:0; flex:1;">
                        <span style="background:${isMp3 ? '#10b981' : '#ef4444'}; color:${isMp3 ? '#020617' : '#fff'}; font-size:9.5px; font-weight:900; padding:2px 6px; border-radius:6px; flex-shrink:0;">${isMp3 ? 'MP3 DJ' : 'LIVE TV'}</span>
                        <span style="font-size:11.5px; font-weight:900; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${(docData.title || 'Live Media').replace(/</g, '&lt;')}</span>
                    </div>
                    <div style="display:flex; gap:4px; flex-shrink:0;">
                        <button type="button" class="nx-tw-pill" style="border-color:#38bdf8; color:#38bdf8;" onclick="NexusWatchParty.openModal(${isDm}, '${isMp3 ? 'mp3' : 'yt'}')">🔍 Search</button>
                        <button type="button" id="nx-btn-toggle-main" class="nx-tw-pill" onclick="NexusWatchParty.toggleMainPlayer()">${isMainPlayerHidden ? '🔼 Show Song' : '🔽 Hide Song'}</button>
                        <button type="button" id="nx-btn-toggle-rel" class="nx-tw-pill" style="border-color:#a78bfa; color:#d8b4fe;" onclick="NexusWatchParty.toggleRelatedStrip()">${isRelatedStripHidden ? '🔥 Show Related' : '🔥 Hide Related'}</button>
                        <button type="button" class="nx-tw-pill" style="background:#ef4444; border:none; color:white;" onclick="NexusWatchParty.stop()">✕</button>
                    </div>
                </div>

                <!-- Main Song / Video Stage (Independently Show/Hideable) -->
                <div id="nx-wp-main-stage" style="display:${isMainPlayerHidden ? 'none' : 'flex'}; flex-direction:column;">
                    ${mainStageHTML}
                </div>

                <!-- Dynamic Related Songs / Videos Strip (Independently Show/Hideable) -->
                <div id="nx-wp-related-stage" style="display:${isRelatedStripHidden ? 'none' : 'flex'}; flex-direction:column;">
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 10px 2px; background:#050811;">
                        <span style="font-size:10px; font-weight:900; color:#93c5fd;">🔥 RELATED TO "${(docData.title || 'THIS TRACK').substring(0, 22).toUpperCase().replace(/</g, '&lt;')}" (SWIPE 👉):</span>
                        <span style="font-size:9.5px; color:#10b981; font-weight:800;">In-App Play 🔒</span>
                    </div>
                    <div id="nx-wp-rel-carousel-box" class="nx-rel-scroll-row">
                        ${relList.length > 0 ? relList.map(r => {
                            let enc = btoa(unescape(encodeURIComponent(JSON.stringify(r))));
                            return `
                                <div class="nx-rel-card-item" onclick="NexusWatchParty.play('${enc}', ${isDm})">
                                    <img src="${r.thumb}" style="width:42px; height:42px; border-radius:8px; object-fit:cover; flex-shrink:0; background:#000;">
                                    <div style="min-width:0; flex:1;">
                                        <div style="font-size:11px; font-weight:800; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${(r.title || '').replace(/</g, '&lt;')}</div>
                                        <div style="font-size:9.5px; color:#10b981; font-weight:800;">Play Next ▶</div>
                                    </div>
                                </div>
                            `;
                        }).join('') : `<div style="padding:6px 10px; font-size:11px; color:#64748b;">Loading related tracks...</div>`}
                    </div>
                </div>
            `;

            const aud = document.getElementById('nx-wp-audio-el');
            if (aud) {
                if (startSec > 2) { try { aud.currentTime = startSec; } catch (e) {} }
                aud.onplay = () => { if (!isRemoteSyncing) broadcastState('PLAYING', aud.currentTime); };
                aud.onpause = () => { if (!isRemoteSyncing && !aud.seeking) broadcastState('PAUSED', aud.currentTime); };
                aud.onseeked = () => { if (!isRemoteSyncing) broadcastState(aud.paused ? 'PAUSED' : 'PLAYING', aud.currentTime); };
                aud.onwaiting = () => { if (!isRemoteSyncing) broadcastState('BUFFERING', aud.currentTime); };
                aud.oncanplay = () => { if (!isRemoteSyncing && !aud.paused) broadcastState('PLAYING', aud.currentTime); };
                aud.onended = () => {
                    if (relList.length > 0) {
                        let nextTrack = relList[0];
                        let enc = btoa(unescape(encodeURIComponent(JSON.stringify(nextTrack))));
                        NexusWatchParty.play(enc, isDm);
                    }
                };
            }
        } else {
            // Update Related Carousel if new related songs arrived
            const relBox = document.getElementById('nx-wp-rel-carousel-box');
            if (relBox && relList.length > 0 && relBox.innerText.includes('Loading related')) {
                relBox.innerHTML = relList.map(r => {
                    let enc = btoa(unescape(encodeURIComponent(JSON.stringify(r))));
                    return `
                        <div class="nx-rel-card-item" onclick="NexusWatchParty.play('${enc}', ${isDm})">
                            <img src="${r.thumb}" style="width:42px; height:42px; border-radius:8px; object-fit:cover; flex-shrink:0; background:#000;">
                            <div style="min-width:0; flex:1;">
                                <div style="font-size:11px; font-weight:800; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${(r.title || '').replace(/</g, '&lt;')}</div>
                                <div style="font-size:9.5px; color:#10b981; font-weight:800;">Play Next ▶</div>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            const statusEl = document.getElementById('nx-wp-live-status');
            const aud = document.getElementById('nx-wp-audio-el');
            let elapsed = Math.max(0, (Date.now() - (docData.updatedAt || Date.now())) / 1000);
            let targetSec = (docData.currentTime || 0) + (docData.playState === 'PLAYING' ? elapsed : 0);

            if (statusEl) {
                if (docData.playState === 'BUFFERING') {
                    statusEl.innerText = `⏳ Waiting: @${docData.updatedBy || 'partner'} buffering at ${Math.floor(docData.currentTime || 0)}s...`;
                    statusEl.style.color = '#fbbf24';
                } else if (docData.playState === 'PAUSED') {
                    statusEl.innerText = `⏸️ Paused by @${docData.updatedBy || 'partner'} at ${Math.floor(docData.currentTime || 0)}s`;
                    statusEl.style.color = '#f87171';
                } else {
                    statusEl.innerText = `🟢 Playing Together in Sync • @${docData.updatedBy || 'partner'}`;
                    statusEl.style.color = '#10b981';
                }
            }

            if (aud) {
                isRemoteSyncing = true;
                if (Math.abs((aud.currentTime || 0) - targetSec) > 2.5) {
                    try { aud.currentTime = targetSec; } catch (e) {}
                }
                if (docData.playState === 'PAUSED' || docData.playState === 'BUFFERING') {
                    if (!aud.paused) aud.pause();
                } else if (docData.playState === 'PLAYING') {
                    if (aud.paused) aud.play().catch(() => {});
                }
                setTimeout(() => { isRemoteSyncing = false; }, 450);
            }
        }
    }

    function watchActiveChatRoom() {
        if (!window.Nexus || !Nexus.db) return;
        const dmRoot = document.getElementById('nx-dm-dedicated-root');
        const grpRoom = document.getElementById('nx-chat-room');
        let isDm = dmRoot && dmRoot.style.display !== 'none';
        let isGrp = grpRoom && grpRoom.style.display !== 'none';
        if (!isDm && !isGrp) return;

        let ctx = getChatCtx(isDm);
        if (ctx.roomId === activeWpRoom) return;
        activeWpRoom = ctx.roomId;

        if (wpUnsub) wpUnsub();
        wpUnsub = Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).onSnapshot(doc => {
            renderDockUI(doc.exists ? doc.data() : null, isDm);
        }, () => {});
    }

    // =========================================================================
    // 4. 📹 INSTANT INCOMING VIDEO CALL MEETING LISTENER (With Ringtone & Auto Camera Cleanup)
    // =========================================================================
    function playMeetingRingtone() {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            const ctx = new Ctx();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.frequency.setValueAtTime(587.33, ctx.currentTime);
            o.frequency.setValueAtTime(880, ctx.currentTime + 0.16);
            g.gain.setValueAtTime(0.14, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42);
            o.connect(g); g.connect(ctx.destination);
            o.start(); o.stop(ctx.currentTime + 0.42);
            if (navigator.vibrate) navigator.vibrate([180, 90, 180]);
        } catch (e) {}
    }

    function startInstantVideoMeetingWatcher() {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        if (!me || !me.username || !Nexus.db || incomingMeetingUnsub) return;
        let myU = me.username.toLowerCase().trim();

        if (!document.getElementById('nx-incoming-meeting-modal')) {
            const b = document.createElement('div');
            b.id = 'nx-incoming-meeting-modal';
            document.body.appendChild(b);
        }

        incomingMeetingUnsub = Nexus.db.collection("nexus_group_video_rooms").onSnapshot(snap => {
            let incoming = null;
            snap.forEach(doc => {
                let d = doc.data();
                if (!d || !d.active || (Date.now() - (d.updatedAt || 0) > 60000)) return;
                if (activeCallRoomId === doc.id) return;
                if (String(d.targetUser || '').toLowerCase().trim() === myU && String(d.hostUser || '').toLowerCase().trim() !== myU) {
                    incoming = Object.assign({ id: doc.id }, d);
                }
            });

            const banner = document.getElementById('nx-incoming-meeting-modal');
            if (!banner) return;

            if (incoming) {
                banner.style.display = 'flex';
                banner.innerHTML = `
                    <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
                        <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg,#10b981,#2563eb); color:#fff; display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0;">📹</div>
                        <div style="min-width:0; flex:1;">
                            <div style="font-size:13.5px; font-weight:900; color:#f8fafc;">Incoming Live Video Meeting</div>
                            <div style="font-size:11.5px; color:#6ee7b7; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">@${incoming.hostUser} invited you to join video call!</div>
                        </div>
                    </div>
                    <div style="display:flex; gap:7px; flex-shrink:0;">
                        <button type="button" onclick="NexusWatchParty.acceptVideoMeeting('${incoming.id}', '${(incoming.title || 'Video Meeting').replace(/'/g, "\\'")}')" style="background:#10b981; color:#020617; border:none; padding:8px 13px; border-radius:12px; font-weight:900; font-size:12px; cursor:pointer;">✅ Join</button>
                        <button type="button" onclick="NexusWatchParty.declineVideoMeeting('${incoming.id}')" style="background:#ef4444; color:white; border:none; padding:8px 11px; border-radius:12px; font-weight:900; font-size:12px; cursor:pointer;">📴</button>
                    </div>
                `;
                clearInterval(meetingRingInterval);
                playMeetingRingtone();
                meetingRingInterval = setInterval(playMeetingRingtone, 2200);
            } else {
                banner.style.display = 'none';
                clearInterval(meetingRingInterval);
            }
        }, () => {});
    }

    // =========================================================================
    // 5. PUBLIC API: NEXUSWATCHPARTY & NEXUSYTPARTY
    // =========================================================================
    window.NexusWatchParty = {
        openModal: function(isDm, modeTab) {
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;
            currentMode = modeTab || 'yt';

            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid ${currentMode === 'mp3' ? '#10b981' : '#ef4444'}; background:#090d16; padding:15px; max-width:400px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <strong style="color:#f8fafc; font-size:15px;">${currentMode === 'mp3' ? '🎵 Full MP3 Song DJ (4-5+ Min)' : '▶️ YouTube Watch-Party TV (Sync)'}</strong>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:19px; cursor:pointer;">✕</button>
                    </div>

                    <div style="display:flex; gap:6px; margin-bottom:10px;">
                        <button type="button" onclick="NexusWatchParty.openModal(${Boolean(isDm)}, 'yt')" style="flex:1; padding:8px; border-radius:10px; border:none; background:${currentMode === 'yt' ? '#ef4444' : '#1e293b'}; color:white; font-weight:900; font-size:12px; cursor:pointer;">▶️ YouTube TV (Movies/Shows)</button>
                        <button type="button" onclick="NexusWatchParty.openModal(${Boolean(isDm)}, 'mp3')" style="flex:1; padding:8px; border-radius:10px; border:none; background:${currentMode === 'mp3' ? '#10b981' : '#1e293b'}; color:${currentMode === 'mp3' ? '#020617' : 'white'}; font-weight:900; font-size:12px; cursor:pointer;">🎵 Full MP3 Songs (No 30s!)</button>
                    </div>

                    <div style="display:flex; gap:6px; margin-bottom:10px;">
                        <input type="text" id="nx-wp-in" placeholder="${currentMode === 'mp3' ? 'Search any Hindi MP3 song (e.g. Tu hi to hai)...' : 'Search Motu Patlu, Movie, Natak or Song...'}" onkeydown="if(event.key==='Enter') NexusWatchParty.search(${Boolean(isDm)})" style="flex:1; padding:9px 12px; border-radius:10px; border:1px solid #334155; background:#111827; color:white; font-size:12.5px; outline:none;">
                        <button type="button" onclick="NexusWatchParty.search(${Boolean(isDm)})" style="background:${currentMode === 'mp3' ? '#10b981' : '#ef4444'}; color:${currentMode === 'mp3' ? '#020617' : 'white'}; border:none; padding:0 14px; border-radius:10px; font-weight:900; font-size:12px; cursor:pointer;">Search</button>
                    </div>

                    <div id="nx-wp-results" style="display:flex; flex-direction:column; gap:7px; max-height:52vh; overflow-y:auto;"></div>
                </div>
            `;
            modal.style.display = 'flex';
            const inp = document.getElementById('nx-wp-in');
            if (inp) inp.focus();
            this.search(Boolean(isDm), currentMode === 'mp3' ? 'Tu hi to hai' : 'Motu Patlu');
        },

        search: async function(isDm, fallbackQuery) {
            const inp = document.getElementById('nx-wp-in');
            const box = document.getElementById('nx-wp-results');
            if (!box) return;
            let q = (inp && inp.value.trim()) ? inp.value.trim() : (fallbackQuery || 'Hindi Hit Songs');

            box.innerHTML = `<div style="text-align:center; padding:16px; color:#38bdf8; font-size:12.5px; font-weight:800;">⚡ Searching Real Results for "${q}"...</div>`;

            const [mp3Res, ytRes] = await Promise.all([
                searchRealMp3Songs(q),
                searchRealYouTubeVideos(q)
            ]);

            let list = currentMode === 'mp3' ? [...mp3Res, ...ytRes] : [...ytRes, ...mp3Res];
            currentRelatedList = list.slice(0, 10);

            if (!list.length) {
                box.innerHTML = `<div style="text-align:center; padding:14px; color:#94a3b8; font-size:12px;">Internet slow — tap Search once more to load "${q}"!</div>`;
                return;
            }

            box.innerHTML = list.map(v => {
                let enc = btoa(unescape(encodeURIComponent(JSON.stringify(v))));
                return `
                    <div onclick="NexusWatchParty.play('${enc}', ${Boolean(isDm)})" style="display:flex; align-items:center; gap:10px; padding:8px; background:#161f33; border:1px solid #26334d; border-radius:12px; cursor:pointer;">
                        <img src="${v.thumb}" style="width:60px; height:44px; border-radius:8px; object-fit:cover; flex-shrink:0; background:#000;">
                        <div style="min-width:0; flex:1;">
                            <div style="font-weight:800; font-size:12px; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${v.title}</div>
                            <div style="font-size:10.5px; color:#10b981; font-weight:700;">${v.channel}</div>
                        </div>
                        <span style="background:${v.type === 'mp3' ? '#10b981' : '#ef4444'}; color:${v.type === 'mp3' ? '#020617' : 'white'}; padding:5px 10px; border-radius:8px; font-size:10.5px; font-weight:900; flex-shrink:0;">Play ▶</span>
                    </div>
                `;
            }).join('');
        },

        play: async function(encItem, isDm) {
            const modal = document.getElementById('nx-global-modal');
            if (modal) modal.style.display = 'none';
            let item = null;
            try { item = JSON.parse(decodeURIComponent(escape(atob(encItem)))); } catch (e) { return; }
            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (!me || !Nexus.db || !item) return;

            let ctx = getChatCtx(isDm);
            activeWpRoom = ctx.roomId;
            isMainPlayerHidden = false;
            isRelatedStripHidden = false;
            currentMediaKey = '';

            // 1. Start playing immediately with initial related tracks
            let initialRel = currentRelatedList.filter(x => x.url !== item.url && x.videoId !== item.videoId).slice(0, 8);
            await Nexus.db.collection("nexus_watch_party").doc(ctx.roomId).set({
                active: true,
                title: item.title || 'Live Media',
                url: item.url,
                videoId: item.videoId || '',
                thumb: item.thumb || '',
                mediaType: item.type || 'yt',
                playState: 'PLAYING',
                currentTime: 0,
                startOffset: 0,
                related: initialRel,
                startedBy: me.username,
                updatedBy: me.username,
                updatedAt: Date.now()
            });
            watchActiveChatRoom();
            Nexus.toast(`🎵 Playing "${item.title}" in sync!`);

            // 2. Fetch TRUE related songs/videos specifically matching this song/video in background!
            let trueRel = await fetchTrueRelatedForTrack(item);
            if (trueRel.length > 0) {
                currentRelatedList = trueRel;
                await Nexus.db.collection("nexus_watch_party").doc(ctx.roomId).set({
                    related: trueRel.slice(0, 8)
                }, { merge: true }).catch(() => {});
            }
        },

        toggleMainPlayer: function() {
            isMainPlayerHidden = !isMainPlayerHidden;
            const el = document.getElementById('nx-wp-main-stage');
            const btn = document.getElementById('nx-btn-toggle-main');
            if (el) el.style.display = isMainPlayerHidden ? 'none' : 'flex';
            if (btn) btn.innerText = isMainPlayerHidden ? '🔼 Show Song' : '🔽 Hide Song';
        },

        toggleRelatedStrip: function() {
            isRelatedStripHidden = !isRelatedStripHidden;
            const el = document.getElementById('nx-wp-related-stage');
            const btn = document.getElementById('nx-btn-toggle-rel');
            if (el) el.style.display = isRelatedStripHidden ? 'none' : 'flex';
            if (btn) btn.innerText = isRelatedStripHidden ? '🔥 Show Related' : '🔥 Hide Related';
        },

        seekYtVideo: async function(deltaSec) {
            if (!activeWpRoom || !Nexus.db) return;
            const doc = await Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).get();
            if (!doc.exists) return;
            let d = doc.data();
            let elapsed = Math.max(0, (Date.now() - (d.updatedAt || Date.now())) / 1000);
            let nextSec = Math.max(0, Math.round((d.currentTime || 0) + elapsed + deltaSec));
            let me = Nexus.getCurrentUser();
            await Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).set({
                currentTime: nextSec, startOffset: nextSec, playState: 'PLAYING',
                updatedBy: me ? me.username : 'member', updatedAt: Date.now()
            }, { merge: true });
            Nexus.toast(`⏩ Both screens synced to ${nextSec}s!`);
        },

        restartYtTogether: async function() {
            if (!activeWpRoom || !Nexus.db) return;
            let me = Nexus.getCurrentUser();
            await Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).set({
                currentTime: 0, startOffset: Date.now() % 1000, playState: 'PLAYING',
                updatedBy: me ? me.username : 'member', updatedAt: Date.now()
            }, { merge: true });
            Nexus.toast("🔄 Both screens synced to 0:00!");
        },

        cycleSpeed: function(btn) {
            const speeds = [1, 1.25, 1.5, 2];
            audioSpeed = speeds[(speeds.indexOf(audioSpeed) + 1) % speeds.length];
            if (btn) btn.innerText = audioSpeed + 'x';
            const aud = document.getElementById('nx-wp-audio-el');
            if (aud) aud.playbackRate = audioSpeed;
        },

        stop: function() {
            if (Nexus.db && activeWpRoom) {
                Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).set({ active: false }, { merge: true }).catch(() => {});
            }
            const dock = document.getElementById('nx-wp-dock');
            if (dock) { dock.style.display = 'none'; dock.innerHTML = ''; }
            currentMediaKey = '';
        },

        startVideoMeeting: async function(isDm) {
            stopAllCameraAndMicHardware();
            let me = Nexus.getCurrentUser();
            if (!me || !Nexus.db) { Nexus.switchTab('tab-profile'); return; }
            let ctx = getChatCtx(isDm);
            activeCallRoomId = ctx.roomId;

            // Immediately ring partner's phone via Firestore!
            await Nexus.db.collection("nexus_group_video_rooms").doc(ctx.roomId).set({
                active: true,
                title: ctx.title,
                hostUser: me.username,
                hostName: me.name || me.username,
                targetUser: ctx.targetUser || '',
                members: [{ username: me.username.toLowerCase(), name: me.name, joinedAt: Date.now() }],
                updatedAt: Date.now()
            }, { merge: true });

            if (ctx.targetUser && Nexus.pushRealNotification) {
                Nexus.pushRealNotification(ctx.targetUser, 'call', `📹 Calling you for a Live Video Meeting!`);
            }
            await this.acceptVideoMeeting(ctx.roomId, ctx.title);
        },

        acceptVideoMeeting: async function(roomId, title) {
            clearInterval(meetingRingInterval);
            const banner = document.getElementById('nx-incoming-meeting-modal');
            if (banner) banner.style.display = 'none';
            stopAllCameraAndMicHardware();

            let stream = null;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
                activeLocalStreams.push(stream);
            } catch (e) {
                Nexus.toast("⚠️ Please allow Camera & Microphone permission!");
                return;
            }

            activeCallRoomId = roomId;
            let me = Nexus.getCurrentUser();
            let mod = document.getElementById('nx-vconf-modal');
            if (!mod) { mod = document.createElement('div'); mod.id = 'nx-vconf-modal'; document.body.appendChild(mod); }

            mod.innerHTML = `
                <div style="height:54px; background:#0f172a; border-bottom:1.5px solid #10b981; display:flex; align-items:center; justify-content:space-between; padding:0 14px;">
                    <div>
                        <strong style="color:#f8fafc; font-size:14px;">📹 ${title || 'Live Video Meeting'}</strong>
                        <div style="font-size:10.5px; color:#10b981; font-weight:800;">🟢 Camera &amp; Mic Active • Partner Notified</div>
                    </div>
                    <button type="button" onclick="NexusWatchParty.endVideoMeeting()" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:10px; font-weight:900; font-size:11.5px; cursor:pointer;">End Call ✕</button>
                </div>
                <div style="flex:1; padding:12px; display:flex; flex-direction:column; gap:10px; background:#050811; justify-content:center;">
                    <div style="position:relative; flex:1; background:#0f172a; border:2px solid #10b981; border-radius:18px; overflow:hidden; display:flex; align-items:center; justify-content:center;">
                        <video id="nx-meeting-local-vid" autoplay playsinline muted style="width:100%; height:100%; object-fit:cover; transform:scaleX(-1);"></video>
                        <div style="position:absolute; bottom:10px; left:10px; background:rgba(9,13,22,0.85); border:1px solid #38bdf8; color:#fff; padding:4px 10px; border-radius:99px; font-size:11.5px; font-weight:800;">🟢 You (@${me ? me.username : 'me'})</div>
                    </div>
                </div>
                <div style="padding:12px; background:#0f172a; border-top:1px solid #1e293b; display:grid; grid-template-columns:repeat(3, 1fr); gap:10px;">
                    <button type="button" class="nx-tw-pill" style="justify-content:center; padding:10px;" onclick="NexusWatchParty.toggleMeetingMic(this)">🎤 Mute/Unmute</button>
                    <button type="button" class="nx-tw-pill" style="justify-content:center; padding:10px;" onclick="NexusWatchParty.toggleMeetingCam(this)">📹 Cam On/Off</button>
                    <button type="button" class="nx-tw-pill" style="justify-content:center; padding:10px; background:#ef4444; border:none; color:white;" onclick="NexusWatchParty.endVideoMeeting()">📴 End Meeting</button>
                </div>
            `;
            mod.style.display = 'flex';
            const vid = document.getElementById('nx-meeting-local-vid');
            if (vid) vid.srcObject = stream;
        },

        toggleMeetingMic: function(btn) {
            activeLocalStreams.forEach(s => s.getAudioTracks().forEach(t => { t.enabled = !t.enabled; if (btn) btn.innerText = t.enabled ? '🎤 Mic ON' : '🔇 Mic Muted'; }));
        },

        toggleMeetingCam: function(btn) {
            activeLocalStreams.forEach(s => s.getVideoTracks().forEach(t => { t.enabled = !t.enabled; if (btn) btn.innerText = t.enabled ? '📹 Cam ON' : '🚫 Cam OFF'; }));
        },

        declineVideoMeeting: function(roomId) {
            clearInterval(meetingRingInterval);
            const banner = document.getElementById('nx-incoming-meeting-modal');
            if (banner) banner.style.display = 'none';
            stopAllCameraAndMicHardware();
            if (Nexus.db && roomId) {
                Nexus.db.collection("nexus_group_video_rooms").doc(roomId).set({ active: false, targetUser: '' }, { merge: true }).catch(() => {});
            }
        },

        endVideoMeeting: function() {
            clearInterval(meetingRingInterval);
            stopAllCameraAndMicHardware();
            const mod = document.getElementById('nx-vconf-modal');
            if (mod) { mod.style.display = 'none'; mod.innerHTML = ''; }
            if (Nexus.db && activeCallRoomId) {
                Nexus.db.collection("nexus_group_video_rooms").doc(activeCallRoomId).set({ active: false, targetUser: '' }, { merge: true }).catch(() => {});
            }
            activeCallRoomId = '';
            Nexus.toast("📴 Video Call Ended & Camera Turned Off");
        }
    };

    window.NexusYTParty = window.NexusWatchParty;
    window.NexusLive = Object.assign(window.NexusLive || {}, {
        openMediaHubModal: (isDm, mode) => window.NexusWatchParty.openModal(isDm, mode || 'yt'),
        startOrJoinVideoRoom: (isDm) => window.NexusWatchParty.startVideoMeeting(isDm),
        leaveRoom: () => window.NexusWatchParty.endVideoMeeting()
    });

    function syncAllHooks() {
        watchActiveChatRoom();
        startInstantVideoMeetingWatcher();
        if (window.NexusAdvance) {
            NexusAdvance.openInAppYouTubeTV = (isDm) => window.NexusWatchParty.openModal(isDm, 'yt');
            NexusAdvance.startVideoCall = (isDm) => window.NexusWatchParty.startVideoMeeting(isDm);
        }
        if (window.NexusPower) {
            NexusPower.openWatchPartyModal = () => window.NexusWatchParty.openModal(true, 'yt');
            NexusPower.openSongSearchModal = () => window.NexusWatchParty.openModal(true, 'mp3');
        }
        if (window.NexusSuperChat) {
            NexusSuperChat.openGroupSongModal = () => window.NexusWatchParty.openModal(false, 'mp3');
        }
    }

    // Also stop camera hardware if user closes global modal or hides tab
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && !activeCallRoomId) stopAllCameraAndMicHardware();
    });

    setInterval(syncAllHooks, 900);
    setTimeout(syncAllHooks, 120);
})(); // === END OF YTPARTY.JS ===
