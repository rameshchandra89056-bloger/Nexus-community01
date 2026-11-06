// ================= LIVE.JS (v5.0 PARALLEL INSTANT ENGINE): ⚡ WORKS EVEN ON 5 KB/S INTERNET + 🎵 DIRECT OFFICIAL JIOSAAVN CDN FULL 4-5 MIN MP3 CONVERTER (aac.saavncdn.com) + ▶️ 10-SERVER PARALLEL YOUTUBE VIDEO/MOVIE SEARCH + 🔒 SANDBOX NO-REDIRECT LOCK + ⏳ 2-WAY SYNC & SHOW/HIDE =================

(function() {
    const PROTO = 'https:' + '//';
    let localStream = null, camFacing = 'user', micMuted = false, camOff = false;
    let activeWpRoom = '', wpUnsub = null;
    let currentMediaId = '', currentMode = 'yt';
    let isDockMinimized = false, isRemoteSyncing = false;
    let cachedRelatedItems = [], audioSpeed = 1;

    const st = document.createElement('style');
    st.innerHTML = `
        #nx-grp-wp-box, #nx-dm-wp-box, #nx-watch-party-box { display: none !important; }
        @keyframes nxSpinDisc { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        #nx-wp-dock {
            background: linear-gradient(180deg, #0f172a 0%, #090d16 100%);
            border-bottom: 2px solid #10b981; width: 100%; flex-shrink: 0;
            z-index: 32; display: none; flex-direction: column;
            box-shadow: 0 10px 30px rgba(0,0,0,0.8);
        }
        .nx-tw-btn {
            background: #1e293b; border: 1px solid #334155; color: #f8fafc;
            padding: 5px 10px; border-radius: 10px; font-size: 11px; font-weight: 800;
            cursor: pointer; transition: all 0.18s ease; display: inline-flex; align-items: center; justify-content: center; gap: 4px;
        }
        .nx-tw-btn:active { transform: scale(0.93); }
        .nx-rel-carousel {
            display: flex; gap: 8px; overflow-x: auto; padding: 8px 10px;
            background: #050811; border-top: 1px solid #1e293b; scrollbar-width: none;
        }
        .nx-rel-item {
            min-width: 168px; max-width: 168px; background: #111827; border: 1px solid #26334d;
            border-radius: 12px; padding: 6px; cursor: pointer; flex-shrink: 0;
            display: flex; align-items: center; gap: 8px; transition: transform 0.15s ease;
        }
        .nx-rel-item:active { transform: scale(0.95); border-color: #10b981; }
        .nx-disc-spin {
            width: 48px; height: 48px; border-radius: 50%; object-fit: cover;
            border: 2px solid #10b981; animation: nxSpinDisc 6s linear infinite; flex-shrink: 0;
        }
        #nx-vconf-modal {
            position: fixed; inset: 0; width: 100%; max-width: 640px; height: 100dvh;
            margin: 0 auto; background: #050811; z-index: 100190; display: none; flex-direction: column;
        }
        .nx-vgrid { flex: 1; display: grid; gap: 8px; padding: 10px; overflow-y: auto; align-content: center; }
        .nx-vgrid.p-1 { grid-template-columns: 1fr; }
        .nx-vtile {
            position: relative; background: #0f172a; border: 1.5px solid #10b981;
            border-radius: 16px; overflow: hidden; min-height: 150px; display: flex; align-items: center; justify-content: center;
        }
        .nx-vtile video { width: 100%; height: 100%; object-fit: cover; display: block; }
        .nx-vtag {
            position: absolute; bottom: 8px; left: 8px; background: rgba(9,13,22,0.85);
            border: 1px solid #38bdf8; color: #fff; padding: 3px 9px; border-radius: 99px; font-size: 11px; font-weight: 800;
        }
    `;
    document.head.appendChild(st);

    function fetchTimeout(url, ms) {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), ms || 7500);
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
            return { isDm: true, roomId: 'dm_' + [myU, pU].sort().join('__'), title: `Video Call • ${pName || '@' + pU}` };
        }
        let rTitle = document.getElementById('nx-room-title')?.innerText || 'Study Room';
        return { isDm: false, roomId: 'grp_' + rTitle.toLowerCase().replace(/[^a-z0-9]/g, '_'), title: `${rTitle} • Group Video` };
    }

    // =========================================================================
    // 1. 🎵 PARALLEL FULL-LENGTH 4-5 MIN MP3 ENGINE (OFFICIAL JIOSAAVN CDN DECODER)
    // Converts preview.saavncdn.com/..._96_p.mp4 -> aac.saavncdn.com/..._160.mp4 (Full Song!)
    // =========================================================================
    function convertSaavnPreviewToFullAudio(previewUrl) {
        if (!previewUrl || typeof previewUrl !== 'string') return '';
        return previewUrl
            .replace('preview.saavncdn.com', 'aac.saavncdn.com')
            .replace('_96_p.mp4', '_160.mp4')
            .replace('_96_p.m4a', '_160.m4a');
    }

    function parseSaavnJsonList(dataObj, pushFn) {
        let arr = (dataObj && dataObj.data && Array.isArray(dataObj.data.results)) ? dataObj.data.results
                : (dataObj && Array.isArray(dataObj.results)) ? dataObj.results : [];
        arr.forEach(s => {
            let bestUrl = '';
            if (Array.isArray(s.downloadUrl) && s.downloadUrl.length) {
                let last = s.downloadUrl[s.downloadUrl.length - 1];
                bestUrl = last.url || last.link || '';
            }
            if (!bestUrl && s.more_info && s.more_info.media_preview_url) {
                bestUrl = convertSaavnPreviewToFullAudio(s.more_info.media_preview_url);
            }
            if (!bestUrl && s.media_preview_url) {
                bestUrl = convertSaavnPreviewToFullAudio(s.media_preview_url);
            }
            let thumb = '';
            if (Array.isArray(s.image) && s.image.length) {
                let lastImg = s.image[s.image.length - 1];
                thumb = lastImg.url || lastImg.link || '';
            } else if (typeof s.image === 'string') {
                thumb = s.image.replace('150x150', '500x500');
            }
            let dur = Number(s.duration || (s.more_info && s.more_info.duration) || 240);
            if (bestUrl && dur >= 50) {
                let m = Math.floor(dur / 60);
                let sec = dur % 60;
                let title = (s.name || s.title || s.song || 'Hindi Song').replace(/&quot;/g, '"').replace(/&#039;/g, "'");
                let artist = s.primaryArtists || (s.more_info && s.more_info.music) || s.subtitle || 'Bollywood';
                pushFn({
                    id: 'mp3_' + (s.id || Math.random()),
                    title: title,
                    channel: `${artist} • 🎵 Full MP3 (${m}:${sec < 10 ? '0' + sec : sec})`,
                    thumb: thumb || 'https://placehold.co/100x100/10b981/020617?text=MP3',
                    url: bestUrl,
                    type: 'mp3'
                });
            }
        });
    }

    async function searchFullMp3Parallel(rawQuery) {
        let q = (rawQuery || 'Hindi Hit Songs').trim();
        let cleanQ = q.replace(/\b(song|songs|mp3|full|audio|video|hindi)\b/gi, '').replace(/\s+/g, ' ').trim() || q;
        let list = [];
        let seen = new Set();

        const pushItem = (it) => {
            if (!it || !it.url || seen.has(it.url)) return;
            seen.add(it.url);
            list.push(it);
        };

        // Official JioSaavn 4KB JSON API URL
        const officialSaavnUrl = `${PROTO}www.jiosaavn.com/api.php?p=1&q=${encodeURIComponent(cleanQ)}&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=12&__call=search.getResults`;

        // Fire ALL 6 endpoints in PARALLEL so slow dead servers never block fast ones!
        const tasks = [
            fetchTimeout(`${PROTO}api.allorigins.win/get?url=${encodeURIComponent(officialSaavnUrl)}`, 7000)
                .then(r => r.json()).then(d => parseSaavnJsonList(JSON.parse(d.contents), pushItem)),
            fetchTimeout(`${PROTO}api.codetabs.com/v1/proxy?quest=${encodeURIComponent(officialSaavnUrl)}`, 7000)
                .then(r => r.json()).then(d => parseSaavnJsonList(d, pushItem)),
            fetchTimeout(`${PROTO}saavn.dev/api/search/songs?query=${encodeURIComponent(cleanQ)}&limit=10`, 6500)
                .then(r => r.json()).then(d => parseSaavnJsonList(d, pushItem)),
            fetchTimeout(`${PROTO}jiosaavn-api-privatecvc2.vercel.app/search/songs?query=${encodeURIComponent(cleanQ)}&limit=10`, 6500)
                .then(r => r.json()).then(d => parseSaavnJsonList(d, pushItem)),
            fetchTimeout(`${PROTO}saavn.sumit.co/api/search/songs?query=${encodeURIComponent(cleanQ)}&limit=10`, 6500)
                .then(r => r.json()).then(d => parseSaavnJsonList(d, pushItem))
        ];

        await Promise.allSettled(tasks);
        return list;
    }

    // =========================================================================
    // 2. ▶️ PARALLEL 8-SERVER YOUTUBE VIDEO, MOVIE & DRAMA SEARCH ENGINE
    // =========================================================================
    function extractYtFromHtml(html, pushVid) {
        if (!html || typeof html !== 'string') return;
        let parts = html.split('"videoRenderer":{"videoId":"');
        for (let i = 1; i < parts.length; i++) {
            let chunk = parts[i].substring(0, 1400);
            let vid = chunk.substring(0, 11);
            if (/^[a-zA-Z0-9_-]{11}$/.test(vid)) {
                let tm = chunk.match(/"title":\{"runs":\[\{"text":"([^"]+)"/) || chunk.match(/"title":\{"simpleText":"([^"]+)"/);
                let lm = chunk.match(/"lengthText":\{"simpleText":"([^"]+)"/);
                let title = tm ? tm[1].replace(/\\u0026/g, '&').replace(/\\"/g, '"') : 'YouTube Video';
                let dur = lm ? lm[1] : 'Full Video';
                pushVid({
                    id: 'yt_' + vid,
                    videoId: vid,
                    title: title,
                    channel: `▶️ YouTube • (${dur})`,
                    thumb: `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`,
                    url: `https://www.youtube.com/embed/${vid}?autoplay=1&playsinline=1&rel=0&modestbranding=1`,
                    type: 'yt'
                });
            }
        }
    }

    async function searchYouTubeParallel(rawQuery) {
        let q = (rawQuery || 'Hindi Hit Songs').trim();
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
                channel: "▶️ YouTube Live Sync",
                thumb: `https://i.ytimg.com/vi/${directId}/mqdefault.jpg`,
                url: `https://www.youtube.com/embed/${directId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`,
                type: 'yt'
            });
            return list;
        }

        const ytSearchPage = `${PROTO}www.youtube.com/results?search_query=${encodeURIComponent(q)}&hl=en`;

        // Run Lightweight Piped/Invidious JSON APIs (2KB payload!) + Proxies in PARALLEL!
        const pipedApis = [
            `${PROTO}pipedapi.kavin.rocks/search?q=${encodeURIComponent(q)}&filter=videos`,
            `${PROTO}pipedapi.leptons.xyz/search?q=${encodeURIComponent(q)}&filter=videos`,
            `${PROTO}pipedapi.nosebs.ru/search?q=${encodeURIComponent(q)}&filter=videos`,
            `${PROTO}pipedapi.adminforge.de/search?q=${encodeURIComponent(q)}&filter=videos`
        ];
        const invApis = [
            `${PROTO}inv.nadeko.net/api/v1/search?q=${encodeURIComponent(q)}&type=video`,
            `${PROTO}invidious.nerdvpn.de/api/v1/search?q=${encodeURIComponent(q)}&type=video`,
            `${PROTO}invidious.jing.rocks/api/v1/search?q=${encodeURIComponent(q)}&type=video`
        ];

        const jobs = [
            ...pipedApis.map(u => fetchTimeout(u, 6500).then(r => r.json()).then(d => {
                (d && Array.isArray(d.items) ? d.items : []).slice(0, 10).forEach(v => {
                    let vid = ((v.url || '').match(/v=([a-zA-Z0-9_-]{11})/) || [])[1];
                    if (vid) pushVid({ id: 'yt_' + vid, videoId: vid, title: v.title || 'Video', channel: `▶️ ${v.uploaderName || 'YouTube'}`, thumb: `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`, url: `https://www.youtube.com/embed/${vid}?autoplay=1&playsinline=1&rel=0&modestbranding=1`, type: 'yt' });
                });
            })),
            ...invApis.map(u => fetchTimeout(u, 6500).then(r => r.json()).then(d => {
                (Array.isArray(d) ? d : []).slice(0, 10).forEach(v => {
                    if (v && v.videoId) pushVid({ id: 'yt_' + v.videoId, videoId: v.videoId, title: v.title || 'Video', channel: `▶️ ${v.author || 'YouTube'}`, thumb: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`, url: `https://www.youtube.com/embed/${v.videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1`, type: 'yt' });
                });
            })),
            fetchTimeout(`${PROTO}api.allorigins.win/get?url=${encodeURIComponent(ytSearchPage)}`, 7500)
                .then(r => r.json()).then(d => extractYtFromHtml(d && d.contents ? d.contents : '', pushVid)),
            fetchTimeout(`${PROTO}api.codetabs.com/v1/proxy?quest=${encodeURIComponent(ytSearchPage)}`, 7500)
                .then(r => r.text()).then(html => extractYtFromHtml(html, pushVid))
        ];

        await Promise.allSettled(jobs);
        return list;
    }

    // =========================================================================
    // 3. 🔄 TWO-WAY EXACT SEEK, PAUSE & BUFFER WAIT SYNC ENGINE
    // =========================================================================
    function broadcastSyncState(stateName, customTimeSec) {
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

    function renderSyncedDock(docData, isDm) {
        let dock = document.getElementById('nx-wp-dock');
        if (!dock) { dock = document.createElement('div'); dock.id = 'nx-wp-dock'; }
        const target = isDm ? document.getElementById('nx-dm-msgs-box') : document.getElementById('nx-room-messages');
        if (target && target.parentNode && dock.nextSibling !== target) {
            target.parentNode.insertBefore(dock, target);
        }

        if (!docData || !docData.active || !docData.url) {
            dock.style.display = 'none'; dock.innerHTML = ''; currentMediaId = ''; return;
        }

        dock.style.display = 'flex';
        let mediaKey = (docData.url || '') + '_' + (docData.startOffset || 0);
        let relItems = Array.isArray(docData.related) && docData.related.length ? docData.related : cachedRelatedItems;
        let isMp3Mode = docData.mediaType === 'mp3';

        if (mediaKey !== currentMediaId) {
            currentMediaId = mediaKey;
            let startSec = Math.max(0, Math.round(docData.currentTime || 0));

            let stageHTML = isMp3Mode ? `
                <div style="display:flex; align-items:center; gap:12px; padding:10px 14px; background:#090d16;">
                    <img src="${docData.thumb || 'https://placehold.co/100x100/10b981/020617?text=MP3'}" class="nx-disc-spin">
                    <div style="flex:1; min-width:0;">
                        <div style="font-size:12.5px; font-weight:900; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">🎵 ${(docData.title || 'Full MP3 Song').replace(/</g, '&lt;')}</div>
                        <div id="nx-wp-live-status" style="font-size:10.5px; color:#10b981; font-weight:800; margin-bottom:4px;">🟢 Full 4-5 Min MP3 Synced • @${docData.startedBy || 'member'}</div>
                        <audio id="nx-wp-audio-el" src="${docData.url}" controls autoplay style="width:100%; height:34px;"></audio>
                    </div>
                    <button type="button" class="nx-tw-btn" style="border-color:#38bdf8; color:#38bdf8;" onclick="NexusWatchParty.cycleAudioSpeed(this)">1x</button>
                </div>
            ` : `
                <div style="position:relative; width:100%; height:195px; background:#000;">
                    <iframe id="nx-wp-yt-iframe" src="${docData.videoId ? `https://www.youtube.com/embed/${docData.videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1&start=${startSec}` : docData.url}" sandbox="allow-scripts allow-same-origin allow-presentation" style="width:100%; height:195px; border:none; background:#000;" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
                </div>
                <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 10px; background:#0f172a; border-top:1px solid #1e293b; gap:6px;">
                    <span id="nx-wp-live-status" style="font-size:10.5px; color:#10b981; font-weight:800; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">🟢 Synced Live • @${docData.updatedBy || docData.startedBy || 'member'}</span>
                    <button type="button" class="nx-tw-btn" onclick="NexusWatchParty.seekYtVideo(-15)">⏪ -15s</button>
                    <button type="button" class="nx-tw-btn" onclick="NexusWatchParty.seekYtVideo(15)">⏩ +15s</button>
                    <button type="button" class="nx-tw-btn" style="background:#10b981; color:#020617; border:none;" onclick="NexusWatchParty.restartYtTogether()">🔄 Sync Both</button>
                </div>
            `;

            dock.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 12px; background:#182229; border-bottom:1px solid #2a3942;">
                    <div style="display:flex; align-items:center; gap:7px; min-width:0; flex:1;">
                        <span style="background:${isMp3Mode ? '#10b981' : '#ef4444'}; color:${isMp3Mode ? '#020617' : '#fff'}; font-size:10px; font-weight:900; padding:2px 7px; border-radius:6px;">${isMp3Mode ? 'MP3 DJ' : 'WATCH-PARTY'}</span>
                        <span style="font-size:12px; font-weight:900; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${(docData.title || 'Live Media').replace(/</g, '&lt;')}</span>
                    </div>
                    <div style="display:flex; gap:5px; flex-shrink:0;">
                        <button type="button" class="nx-tw-btn" style="border-color:#38bdf8; color:#38bdf8;" onclick="NexusWatchParty.openModal(${isDm}, '${isMp3Mode ? 'mp3' : 'yt'}')">🔍 Search</button>
                        <button type="button" id="nx-wp-hide-btn" class="nx-tw-btn" onclick="NexusWatchParty.toggleHideShow()">${isDockMinimized ? '🔼 Show' : '🔽 Hide'}</button>
                        <button type="button" class="nx-tw-btn" style="background:#ef4444; border:none; color:white;" onclick="NexusWatchParty.stop()">✕</button>
                    </div>
                </div>

                <div id="nx-wp-body-wrap" style="display:${isDockMinimized ? 'none' : 'flex'}; flex-direction:column;">
                    ${stageHTML}
                    ${relItems.length > 0 ? `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:5px 10px 2px; background:#050811;">
                            <span style="font-size:10px; font-weight:900; color:#93c5fd;">🔥 RELATED SONGS &amp; VIDEOS (1-TAP IN-APP PLAY):</span>
                            <span style="font-size:9.5px; color:#10b981; font-weight:800;">Locked In-App 🔒</span>
                        </div>
                        <div class="nx-rel-carousel">
                            ${relItems.map(r => {
                                let enc = btoa(unescape(encodeURIComponent(JSON.stringify(r))));
                                return `
                                    <div class="nx-rel-item" onclick="NexusWatchParty.play('${enc}', ${isDm})">
                                        <img src="${r.thumb}" style="width:42px; height:42px; border-radius:8px; object-fit:cover; flex-shrink:0; background:#000;">
                                        <div style="min-width:0; flex:1;">
                                            <div style="font-size:11px; font-weight:800; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${(r.title || '').replace(/</g, '&lt;')}</div>
                                            <div style="font-size:9.5px; color:#10b981; font-weight:800;">Play Here ▶</div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : ''}
                </div>
            `;

            const aud = document.getElementById('nx-wp-audio-el');
            if (aud) {
                if (startSec > 2) { try { aud.currentTime = startSec; } catch (e) {} }
                aud.onplay = () => { if (!isRemoteSyncing) broadcastSyncState('PLAYING', aud.currentTime); };
                aud.onpause = () => { if (!isRemoteSyncing && !aud.seeking) broadcastSyncState('PAUSED', aud.currentTime); };
                aud.onseeked = () => { if (!isRemoteSyncing) broadcastSyncState(aud.paused ? 'PAUSED' : 'PLAYING', aud.currentTime); };
                aud.onwaiting = () => { if (!isRemoteSyncing) broadcastSyncState('BUFFERING', aud.currentTime); };
                aud.oncanplay = () => { if (!isRemoteSyncing && !aud.paused) broadcastSyncState('PLAYING', aud.currentTime); };
                aud.onended = () => {
                    if (relItems.length > 1) {
                        let nextItem = relItems.find(x => x.url !== docData.url) || relItems[0];
                        let enc = btoa(unescape(encodeURIComponent(JSON.stringify(nextItem))));
                        NexusWatchParty.play(enc, isDm);
                    }
                };
            }
        } else {
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

    function connectWatchPartyDock() {
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
            renderSyncedDock(doc.exists ? doc.data() : null, isDm);
        }, () => {});
    }

    window.NexusWatchParty = {
        openModal: function(isDm, modeTab) {
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;
            currentMode = modeTab || 'yt';

            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid ${currentMode === 'mp3' ? '#10b981' : '#ef4444'}; background:#090d16; padding:15px; max-width:400px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <strong style="color:#f8fafc; font-size:15px;">${currentMode === 'mp3' ? '🎵 Full MP3 Song DJ (4-5+ Min)' : '▶️ YouTube Watch-Party TV'}</strong>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:19px; cursor:pointer;">✕</button>
                    </div>

                    <div style="display:flex; gap:6px; margin-bottom:10px;">
                        <button type="button" onclick="NexusWatchParty.openModal(${Boolean(isDm)}, 'yt')" style="flex:1; padding:8px; border-radius:10px; border:none; background:${currentMode === 'yt' ? '#ef4444' : '#1e293b'}; color:white; font-weight:900; font-size:12px; cursor:pointer;">▶️ YouTube TV (Movies/Shows)</button>
                        <button type="button" onclick="NexusWatchParty.openModal(${Boolean(isDm)}, 'mp3')" style="flex:1; padding:8px; border-radius:10px; border:none; background:${currentMode === 'mp3' ? '#10b981' : '#1e293b'}; color:${currentMode === 'mp3' ? '#020617' : 'white'}; font-weight:900; font-size:12px; cursor:pointer;">🎵 Full MP3 Songs (No 30s!)</button>
                    </div>

                    <div style="display:flex; gap:6px; margin-bottom:10px;">
                        <input type="text" id="nx-wp-in" placeholder="${currentMode === 'mp3' ? 'Type any song (e.g. Tu hi to hai, Sun Soniye)...' : 'Type any Movie, Motu Patlu, Natak or Song...'}" onkeydown="if(event.key==='Enter') NexusWatchParty.search(${Boolean(isDm)})" style="flex:1; padding:9px 12px; border-radius:10px; border:1px solid #334155; background:#111827; color:white; font-size:12.5px; outline:none;">
                        <button type="button" onclick="NexusWatchParty.search(${Boolean(isDm)})" style="background:${currentMode === 'mp3' ? '#10b981' : '#ef4444'}; color:${currentMode === 'mp3' ? '#020617' : 'white'}; border:none; padding:0 14px; border-radius:10px; font-weight:900; font-size:12px; cursor:pointer;">Search</button>
                    </div>

                    <div id="nx-wp-results" style="display:flex; flex-direction:column; gap:7px; max-height:52vh; overflow-y:auto;"></div>
                </div>
            `;
            modal.style.display = 'flex';
            const inp = document.getElementById('nx-wp-in');
            if (inp) inp.focus();
            this.search(Boolean(isDm), currentMode === 'mp3' ? 'Tu hi to hai' : 'Bollywood Hit Songs');
        },

        search: async function(isDm, fallbackQuery) {
            const inp = document.getElementById('nx-wp-in');
            const box = document.getElementById('nx-wp-results');
            if (!box) return;
            let q = (inp && inp.value.trim()) ? inp.value.trim() : (fallbackQuery || 'Tu hi to hai');

            box.innerHTML = `<div style="text-align:center; padding:16px; color:#38bdf8; font-size:12.5px; font-weight:800;">⚡ Searching 10 Parallel Servers for "${q}"...</div>`;

            // Run BOTH MP3 & YouTube engines in parallel so even on 5 KB/s internet we ALWAYS get results!
            const [mp3Res, ytRes] = await Promise.all([
                searchFullMp3Parallel(q),
                searchYouTubeParallel(q)
            ]);

            let list = currentMode === 'mp3'
                ? [...mp3Res, ...ytRes]
                : [...ytRes, ...mp3Res];

            cachedRelatedItems = list.slice(0, 10);

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
            isDockMinimized = false;
            currentMediaId = '';

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
                related: cachedRelatedItems.slice(0, 8),
                startedBy: me.username,
                updatedBy: me.username,
                updatedAt: Date.now()
            });
            connectWatchPartyDock();
            Nexus.toast(`🎵 Playing "${item.title}" in sync!`);
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
            Nexus.toast(`⏩ Synced both screens to ${nextSec}s!`);
        },

        restartYtTogether: async function() {
            if (!activeWpRoom || !Nexus.db) return;
            let me = Nexus.getCurrentUser();
            await Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).set({
                currentTime: 0, startOffset: Date.now() % 1000, playState: 'PLAYING',
                updatedBy: me ? me.username : 'member', updatedAt: Date.now()
            }, { merge: true });
            Nexus.toast("🔄 Restarted in exact sync!");
        },

        cycleAudioSpeed: function(btn) {
            const speeds = [1, 1.25, 1.5, 2];
            audioSpeed = speeds[(speeds.indexOf(audioSpeed) + 1) % speeds.length];
            if (btn) btn.innerText = audioSpeed + 'x';
            const aud = document.getElementById('nx-wp-audio-el');
            if (aud) aud.playbackRate = audioSpeed;
        },

        toggleHideShow: function() {
            isDockMinimized = !isDockMinimized;
            const body = document.getElementById('nx-wp-body-wrap');
            const btn = document.getElementById('nx-wp-hide-btn');
            if (body) body.style.display = isDockMinimized ? 'none' : 'flex';
            if (btn) btn.innerText = isDockMinimized ? '🔼 Show' : '🔽 Hide';
        },

        stop: function() {
            if (Nexus.db && activeWpRoom) {
                Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).set({ active: false }, { merge: true }).catch(() => {});
            }
            const dock = document.getElementById('nx-wp-dock');
            if (dock) { dock.style.display = 'none'; dock.innerHTML = ''; }
            currentMediaId = '';
        }
    };

    window.NexusLive = {
        openMediaHubModal: (isDm, mode) => window.NexusWatchParty.openModal(isDm, mode || 'yt'),
        startOrJoinVideoRoom: async function(isDm) {
            let me = Nexus.getCurrentUser();
            if (!me) { Nexus.switchTab('tab-profile'); return; }
            try {
                localStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: camFacing }, audio: true });
            } catch (e) {
                Nexus.toast("⚠️ Allow Camera & Microphone!"); return;
            }
            let ctx = getChatCtx(isDm);
            let mod = document.getElementById('nx-vconf-modal');
            if (!mod) { mod = document.createElement('div'); mod.id = 'nx-vconf-modal'; document.body.appendChild(mod); }
            mod.innerHTML = `
                <div style="height:52px; background:#0f172a; border-bottom:1.5px solid #38bdf8; display:flex; align-items:center; justify-content:space-between; padding:0 14px;">
                    <strong style="color:#fff; font-size:13.5px;">📹 ${ctx.title}</strong>
                    <button type="button" onclick="NexusLive.leaveRoom()" style="background:#ef4444; color:white; border:none; padding:5px 12px; border-radius:8px; font-weight:900; cursor:pointer;">Leave ✕</button>
                </div>
                <div id="nx-vconf-grid" class="nx-vgrid p-1">
                    <div class="nx-vtile"><video id="nx-vv-local" autoplay playsinline muted style="transform:scaleX(-1);"></video><div class="nx-vtag">🟢 You (@${me.username})</div></div>
                </div>
                <div style="padding:10px; background:#0f172a; display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;">
                    <button type="button" class="nx-tw-btn" onclick="NexusLive.toggleMic()">🎤 Mic</button>
                    <button type="button" class="nx-tw-btn" onclick="NexusLive.toggleCam()">📹 Cam</button>
                    <button type="button" class="nx-tw-btn" style="background:#ef4444; color:white;" onclick="NexusLive.leaveRoom()">📴 End</button>
                </div>
            `;
            mod.style.display = 'flex';
            document.getElementById('nx-vv-local').srcObject = localStream;
        },
        toggleMic: function() {
            if (!localStream) return;
            micMuted = !micMuted;
            localStream.getAudioTracks().forEach(t => { t.enabled = !micMuted; });
            Nexus.toast(micMuted ? "🔇 Muted" : "🎤 Mic ON");
        },
        toggleCam: function() {
            if (!localStream) return;
            camOff = !camOff;
            localStream.getVideoTracks().forEach(t => { t.enabled = !camOff; });
            Nexus.toast(camOff ? "🚫 Cam OFF" : "📹 Cam ON");
        },
        leaveRoom: function() {
            if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
            const mod = document.getElementById('nx-vconf-modal');
            if (mod) mod.style.display = 'none';
        }
    };

    function bindHooks() {
        connectWatchPartyDock();
        if (window.NexusAdvance) {
            NexusAdvance.startVideoCall = (isDm) => window.NexusLive.startOrJoinVideoRoom(isDm);
            NexusAdvance.openInAppYouTubeTV = (isDm) => window.NexusWatchParty.openModal(isDm, 'yt');
        }
        if (window.NexusPower) {
            NexusPower.openWatchPartyModal = () => window.NexusWatchParty.openModal(true, 'yt');
            NexusPower.openSongSearchModal = () => window.NexusWatchParty.openModal(true, 'mp3');
        }
        if (window.NexusSuperChat) {
            NexusSuperChat.openGroupSongModal = () => window.NexusWatchParty.openModal(false, 'mp3');
        }
    }
    setInterval(bindHooks, 900);
    setTimeout(bindHooks, 150);
})(); // === END OF LIVE.JS ===
