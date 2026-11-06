// ================= LIVE.JS (v4.0 TAILWIND SMOOTH & ZERO-30s MASTER): 🚫 100% REMOVED 30-SEC ITUNES PREVIEW FOREVER + 🔒 SANDBOX LOCK (BLOCKS EXTERNAL YOUTUBE APP REDIRECT) + ▶️ PLAYS ANY MOVIE, MOTU PATLU, DRAMA EPISODE OR SONG + 🎵 SEPARATE FULL 4-5 MIN MP3 SONG DJ + ⏳ 2-WAY BUFFER/SEEK SYNC + 🔥 IN-APP RELATED SONGS STRIP + 🔽 SHOW/HIDE TOGGLE =================

(function() {
    const PROTO = 'https:' + '//';

    let localStream = null, camFacing = 'user', micMuted = false, camOff = false;
    let activeWpRoom = '', wpUnsub = null;
    let currentMediaId = '', currentMode = 'yt';
    let isDockMinimized = false;
    let isRemoteSyncing = false;
    let cachedRelatedItems = [];
    let audioSpeed = 1;

    // Tailwind-powered Smooth Animations & Custom Player Styles
    const st = document.createElement('style');
    st.innerHTML = `
        /* Kill all old broken Watch-Party boxes */
        #nx-grp-wp-box, #nx-dm-wp-box, #nx-watch-party-box { display: none !important; }

        @keyframes nxSlideDownSmooth {
            0% { opacity: 0; transform: translateY(-10px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes nxSpinDisc {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        #nx-wp-dock {
            background: linear-gradient(180deg, #0f172a 0%, #090d16 100%);
            border-bottom: 2px solid #10b981; width: 100%; flex-shrink: 0;
            z-index: 32; display: none; flex-direction: column;
            animation: nxSlideDownSmooth 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow: 0 10px 30px rgba(0,0,0,0.75);
        }
        .nx-tw-btn {
            background: #1e293b; border: 1px solid #334155; color: #f8fafc;
            padding: 5px 10px; border-radius: 10px; font-size: 11px; font-weight: 800;
            cursor: pointer; transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
            display: inline-flex; align-items: center; justify-content: center; gap: 4px;
        }
        .nx-tw-btn:active { transform: scale(0.93); }
        .nx-rel-carousel {
            display: flex; gap: 8px; overflow-x: auto; padding: 8px 10px;
            background: #050811; border-top: 1px solid #1e293b; scrollbar-width: none;
        }
        .nx-rel-item {
            min-width: 165px; max-width: 165px; background: #111827;
            border: 1px solid #26334d; border-radius: 12px; padding: 6px;
            cursor: pointer; flex-shrink: 0; display: flex; align-items: center; gap: 8px;
            transition: all 0.2s ease;
        }
        .nx-rel-item:active { transform: scale(0.95); border-color: #10b981; background: #1e293b; }
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

    function fetchFast(url, timeoutMs) {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), timeoutMs || 4500);
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
    // 1. 🎵 FULL-LENGTH 4-5+ MIN MP3 SONG ENGINE (ZERO 30s ITUNES PREVIEWS!)
    // =========================================================================
    async function searchFullLengthMp3Songs(rawQuery) {
        let q = (rawQuery || 'Hindi Hit Songs').trim();
        // Clean trailing words like "song", "mp3" so JioSaavn finds exact matches like "Sun Soniye Sun Dildar"
        let cleanQ = q.replace(/\b(song|songs|mp3|full|audio|video)\b/gi, '').replace(/\s+/g, ' ').trim() || q;
        let results = [];
        let seenUrls = new Set();

        const addSong = (item) => {
            if (!item || !item.url || seenUrls.has(item.url)) return;
            seenUrls.add(item.url);
            results.push(item);
        };

        const queriesToTry = cleanQ.toLowerCase() !== q.toLowerCase() ? [cleanQ, q] : [q];

        for (let searchQ of queriesToTry) {
            const saavnEndpoints = [
                `${PROTO}saavn.dev/api/search/songs?query=${encodeURIComponent(searchQ)}&limit=12`,
                `${PROTO}jiosaavn-api-privatecvc2.vercel.app/search/songs?query=${encodeURIComponent(searchQ)}&limit=12`,
                `${PROTO}saavn-api-psi.vercel.app/api/search/songs?query=${encodeURIComponent(searchQ)}&limit=12`,
                `${PROTO}api.allorigins.win/raw?url=${encodeURIComponent(`${PROTO}saavn.dev/api/search/songs?query=${encodeURIComponent(searchQ)}&limit=12`)}`
            ];

            for (let ep of saavnEndpoints) {
                try {
                    let r = await fetchFast(ep, 4200);
                    if (r.ok) {
                        let d = await r.json();
                        let arr = (d && d.data && Array.isArray(d.data.results)) ? d.data.results : (d && Array.isArray(d.results) ? d.results : []);
                        arr.forEach(s => {
                            let dl = s.downloadUrl || [];
                            let best = dl.length ? (dl[dl.length - 1].url || dl[dl.length - 1].link) : '';
                            let im = s.image || [];
                            let th = im.length ? (im[im.length - 1].url || im[im.length - 1].link) : '';
                            let durSec = Number(s.duration || 240);
                            // Strictly reject any clip shorter than 60 seconds!
                            if (best && durSec >= 60) {
                                let mins = Math.floor(durSec / 60);
                                let secs = durSec % 60;
                                let durLabel = `${mins}:${secs < 10 ? '0' + secs : secs}`;
                                addSong({
                                    id: 'mp3_' + (s.id || Math.random()),
                                    title: (s.name || s.title || 'Song').replace(/&quot;/g, '"').replace(/&#039;/g, "'"),
                                    channel: `${s.primaryArtists || s.artists?.primary?.[0]?.name || 'Bollywood'} • 🎵 Full MP3 (${durLabel})`,
                                    thumb: th || 'https://placehold.co/100x100/10b981/020617?text=MP3',
                                    url: best,
                                    type: 'mp3'
                                });
                            }
                        });
                        if (results.length >= 6) break;
                    }
                } catch (e) {}
            }
            if (results.length >= 6) break;
        }

        // If a rare song isn't on JioSaavn, fetch its Full-Length YouTube Track & play in Audio Deck!
        if (results.length < 4) {
            let ytItems = await searchAnyYouTubeVideo(q + ' full audio song');
            ytItems.forEach(y => {
                addSong({
                    id: y.id,
                    videoId: y.videoId,
                    title: y.title,
                    channel: `${y.channel.replace('▶️', '🎵')} • Full Song Track`,
                    thumb: y.thumb,
                    url: y.url,
                    type: 'yt_audio'
                });
            });
        }

        return results;
    }

    // =========================================================================
    // 2. ▶️ UNIVERSAL YOUTUBE VIDEO SEARCH (MOVIES, MOTU PATLU, NATAK, EPISODES, SONGS)
    // Uses zero-backtrack .split('"videoRenderer"') parser across 4 global proxies!
    // =========================================================================
    function parseYouTubeHtmlFast(htmlText) {
        let items = [];
        if (!htmlText || typeof htmlText !== 'string') return items;
        let parts = htmlText.split('"videoRenderer":{"videoId":"');
        let seen = new Set();

        for (let i = 1; i < parts.length && items.length < 14; i++) {
            let chunk = parts[i].substring(0, 1600);
            let vid = chunk.substring(0, 11);
            if (/^[a-zA-Z0-9_-]{11}$/.test(vid) && !seen.has(vid)) {
                seen.add(vid);
                let tMatch = chunk.match(/"title":\{"runs":\[\{"text":"([^"]+)"/) || chunk.match(/"title":\{"simpleText":"([^"]+)"/);
                let lMatch = chunk.match(/"lengthText":\{"simpleText":"([^"]+)"/);
                let cMatch = chunk.match(/"ownerText":\{"runs":\[\{"text":"([^"]+)"/);

                let title = tMatch ? tMatch[1].replace(/\\u0026/g, '&').replace(/\\"/g, '"') : 'YouTube Video';
                let dur = lMatch ? lMatch[1] : 'Full Video';
                let author = cMatch ? cMatch[1] : 'YouTube';

                items.push({
                    id: 'yt_' + vid,
                    videoId: vid,
                    title: title,
                    channel: `▶️ ${author} • (${dur})`,
                    thumb: `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`,
                    url: `https://www.youtube.com/embed/${vid}?autoplay=1&playsinline=1&rel=0&modestbranding=1`,
                    type: 'yt'
                });
            }
        }
        return items;
    }

    async function searchAnyYouTubeVideo(rawQuery) {
        let q = (rawQuery || 'Hindi Movie & Songs').trim();
        let list = [];
        let seen = new Set();

        const pushVid = (v) => {
            if (!v || !v.videoId || seen.has(v.videoId)) return;
            seen.add(v.videoId);
            list.push(v);
        };

        // Direct YouTube URL support
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

        const ytUrl = `${PROTO}www.youtube.com/results?search_query=${encodeURIComponent(q)}&hl=en`;

        // Method A: AllOrigins JSON wrapper (100% CORS-free on all mobile browsers)
        try {
            let r1 = await fetchFast(`${PROTO}api.allorigins.win/get?url=${encodeURIComponent(ytUrl)}`, 4500);
            if (r1.ok) {
                let d1 = await r1.json();
                parseYouTubeHtmlFast(d1 && d1.contents ? d1.contents : '').forEach(pushVid);
            }
        } catch (e) {}

        // Method B: CodeTabs & CorsProxy Raw HTML
        if (list.length < 4) {
            const rawProxies = [
                `${PROTO}api.codetabs.com/v1/proxy?quest=${encodeURIComponent(ytUrl)}`,
                `${PROTO}corsproxy.io/?url=${encodeURIComponent(ytUrl)}`
            ];
            for (let pUrl of rawProxies) {
                try {
                    let r2 = await fetchFast(pUrl, 4200);
                    if (r2.ok) {
                        let html = await r2.text();
                        parseYouTubeHtmlFast(html).forEach(pushVid);
                        if (list.length >= 6) break;
                    }
                } catch (e) {}
            }
        }

        // Method C: Piped & Invidious Video Search APIs
        if (list.length < 4) {
            const apis = [
                { u: `${PROTO}pipedapi.kavin.rocks/search?q=${encodeURIComponent(q)}&filter=videos`, t: 'piped' },
                { u: `${PROTO}inv.nadeko.net/api/v1/search?q=${encodeURIComponent(q)}&type=video`, t: 'inv' },
                { u: `${PROTO}invidious.nerdvpn.de/api/v1/search?q=${encodeURIComponent(q)}&type=video`, t: 'inv' }
            ];
            for (let a of apis) {
                try {
                    let r3 = await fetchFast(a.u, 3800);
                    if (r3.ok) {
                        let d3 = await r3.json();
                        let arr = a.t === 'inv' ? (Array.isArray(d3) ? d3 : []) : (d3 && Array.isArray(d3.items) ? d3.items : []);
                        arr.slice(0, 10).forEach(v => {
                            let vid = a.t === 'inv' ? v.videoId : ((v.url || '').match(/v=([a-zA-Z0-9_-]{11})/) || [])[1];
                            if (vid) {
                                pushVid({
                                    id: 'yt_' + vid,
                                    videoId: vid,
                                    title: v.title || 'YouTube Video',
                                    channel: `▶️ ${v.author || v.uploaderName || 'YouTube'}`,
                                    thumb: `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`,
                                    url: `https://www.youtube.com/embed/${vid}?autoplay=1&playsinline=1&rel=0&modestbranding=1`,
                                    type: 'yt'
                                });
                            }
                        });
                        if (list.length >= 6) break;
                    }
                } catch (e) {}
            }
        }

        return list;
    }

    // =========================================================================
    // 3. 🔄 TWO-WAY EXACT SEEK, PAUSE & SLOW-INTERNET BUFFER SYNC ENGINE
    // =========================================================================
    function broadcastSyncState(stateName, customTimeSec) {
        if (isRemoteSyncing || !activeWpRoom || !Nexus.db) return;
        let me = Nexus.getCurrentUser();
        const aud = document.getElementById('nx-wp-audio-el');
        let sec = typeof customTimeSec === 'number' ? customTimeSec : (aud ? aud.currentTime : 0);

        Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).set({
            playState: stateName, // 'PLAYING' | 'PAUSED' | 'BUFFERING'
            currentTime: Math.max(0, Math.round(sec)),
            updatedBy: me ? me.username : 'partner',
            updatedAt: Date.now()
        }, { merge: true }).catch(() => {});
    }

    function renderSyncedDock(docData, isDm) {
        // Remove any old broken 404 boxes
        document.querySelectorAll('#nx-chat-room div, #nx-dm-dedicated-root div').forEach(el => {
            let txt = (el.innerText || '').trim();
            if ((txt.startsWith('🎬 Group Watch-Party') || txt.startsWith('🎬 Live Watch-Party')) && el.children.length <= 3) {
                el.style.display = 'none';
            }
        });

        let dock = document.getElementById('nx-wp-dock');
        if (!dock) {
            dock = document.createElement('div');
            dock.id = 'nx-wp-dock';
        }
        const target = isDm ? document.getElementById('nx-dm-msgs-box') : document.getElementById('nx-room-messages');
        if (target && target.parentNode && dock.nextSibling !== target) {
            target.parentNode.insertBefore(dock, target);
        }

        if (!docData || !docData.active || !docData.url) {
            dock.style.display = 'none';
            dock.innerHTML = '';
            currentMediaId = '';
            return;
        }

        dock.style.display = 'flex';
        let mediaKey = (docData.url || '') + '_' + (docData.startOffset || 0);
        let relItems = Array.isArray(docData.related) && docData.related.length ? docData.related : cachedRelatedItems;
        let isMp3Mode = docData.mediaType === 'mp3';

        if (mediaKey !== currentMediaId) {
            currentMediaId = mediaKey;
            let startSec = Math.max(0, Math.round(docData.currentTime || 0));

            let playerStageHTML = '';
            if (isMp3Mode) {
                playerStageHTML = `
                    <div style="display:flex; align-items:center; gap:12px; padding:10px 14px; background:#090d16;">
                        <img src="${docData.thumb || 'https://placehold.co/100x100/10b981/020617?text=MP3'}" class="nx-disc-spin">
                        <div style="flex:1; min-width:0;">
                            <div style="font-size:12.5px; font-weight:900; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">🎵 ${(docData.title || 'Full MP3 Song').replace(/</g, '&lt;')}</div>
                            <div id="nx-wp-live-status" style="font-size:10.5px; color:#10b981; font-weight:800; margin-bottom:4px;">🟢 Full Length MP3 Synced • @${docData.startedBy || 'member'}</div>
                            <audio id="nx-wp-audio-el" src="${docData.url}" controls autoplay style="width:100%; height:34px;"></audio>
                        </div>
                        <button type="button" class="nx-tw-btn" style="border-color:#38bdf8; color:#38bdf8;" onclick="NexusWatchParty.cycleAudioSpeed(this)">1x</button>
                    </div>
                `;
            } else {
                // SANDBOX LOCK prevents clicking inside YouTube iframe from EVER opening external YouTube app!
                let ytSrc = docData.videoId
                    ? `https://www.youtube.com/embed/${docData.videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1&start=${startSec}`
                    : docData.url;
                playerStageHTML = `
                    <div style="position:relative; width:100%; height:195px; background:#000;">
                        <iframe id="nx-wp-yt-iframe" src="${ytSrc}" sandbox="allow-scripts allow-same-origin allow-presentation" style="width:100%; height:195px; border:none; background:#000;" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
                    </div>
                    <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 10px; background:#0f172a; border-top:1px solid #1e293b; gap:6px;">
                        <span id="nx-wp-live-status" style="font-size:10.5px; color:#10b981; font-weight:800; flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">🟢 Synced Live • @${docData.updatedBy || docData.startedBy || 'member'}</span>
                        <button type="button" class="nx-tw-btn" onclick="NexusWatchParty.seekYtVideo(-15)">⏪ -15s</button>
                        <button type="button" class="nx-tw-btn" onclick="NexusWatchParty.seekYtVideo(15)">⏩ +15s</button>
                        <button type="button" class="nx-tw-btn" style="background:#10b981; color:#020617; border:none;" onclick="NexusWatchParty.restartYtTogether()">🔄 Sync Both</button>
                    </div>
                `;
            }

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
                    ${playerStageHTML}

                    ${relItems.length > 0 ? `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:5px 10px 2px; background:#050811;">
                            <span style="font-size:10px; font-weight:900; color:#93c5fd;">🔥 RELATED ${isMp3Mode ? 'FULL MP3 SONGS' : 'VIDEOS & SONGS'} (1-TAP IN-APP PLAY):</span>
                            <span style="font-size:9.5px; color:#10b981; font-weight:800;">No YouTube Redirect 🔒</span>
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

            // Bind 2-Way Audio Sync events for MP3 Mode (Play, Pause, Seek, Slow-Internet Buffer Wait!)
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
            // Apply live remote Play / Pause / Seek / Buffer Wait updates
            const statusEl = document.getElementById('nx-wp-live-status');
            const aud = document.getElementById('nx-wp-audio-el');
            let elapsed = Math.max(0, (Date.now() - (docData.updatedAt || Date.now())) / 1000);
            let targetSec = (docData.currentTime || 0) + (docData.playState === 'PLAYING' ? elapsed : 0);

            if (statusEl) {
                if (docData.playState === 'BUFFERING') {
                    statusEl.innerText = `⏳ Waiting: @${docData.updatedBy || 'partner'} internet buffering at ${Math.floor(docData.currentTime || 0)}s...`;
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

    // =========================================================================
    // 4. PUBLIC API: NEXUSWATCHPARTY & NEXUSLIVE
    // =========================================================================
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
                        <input type="text" id="nx-wp-in" placeholder="${currentMode === 'mp3' ? 'Search any Hindi MP3 song (e.g. Sun Soniye)...' : 'Search any Movie, Motu Patlu, Natak or Song...'}" onkeydown="if(event.key==='Enter') NexusWatchParty.search(${Boolean(isDm)})" style="flex:1; padding:9px 12px; border-radius:10px; border:1px solid #334155; background:#111827; color:white; font-size:12.5px; outline:none;">
                        <button type="button" onclick="NexusWatchParty.search(${Boolean(isDm)})" style="background:${currentMode === 'mp3' ? '#10b981' : '#ef4444'}; color:${currentMode === 'mp3' ? '#020617' : 'white'}; border:none; padding:0 14px; border-radius:10px; font-weight:900; font-size:12px; cursor:pointer;">Search</button>
                    </div>

                    <div id="nx-wp-results" style="display:flex; flex-direction:column; gap:7px; max-height:52vh; overflow-y:auto;"></div>
                </div>
            `;
            modal.style.display = 'flex';
            const inp = document.getElementById('nx-wp-in');
            if (inp) inp.focus();
            this.search(Boolean(isDm), currentMode === 'mp3' ? 'Sun Soniye' : 'Bollywood Hit Songs');
        },

        search: async function(isDm, fallbackQuery) {
            const inp = document.getElementById('nx-wp-in');
            const box = document.getElementById('nx-wp-results');
            if (!box) return;
            let q = (inp && inp.value.trim()) ? inp.value.trim() : (fallbackQuery || 'Hindi Hit Songs');

            box.innerHTML = `<div style="text-align:center; padding:16px; color:#38bdf8; font-size:12.5px; font-weight:800;">⚡ Searching ${currentMode === 'mp3' ? 'Full-Length MP3 Songs' : 'YouTube Videos & Movies'} for "${q}"...</div>`;

            let list = currentMode === 'mp3'
                ? await searchFullLengthMp3Songs(q)
                : await searchAnyYouTubeVideo(q);

            cachedRelatedItems = list.slice(0, 10);

            if (!list.length) {
                box.innerHTML = `<div style="text-align:center; padding:14px; color:#94a3b8; font-size:12px;">Could not reach server. Please tap Search once more!</div>`;
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
                currentTime: nextSec,
                startOffset: nextSec,
                playState: 'PLAYING',
                updatedBy: me ? me.username : 'member',
                updatedAt: Date.now()
            }, { merge: true });
            Nexus.toast(`⏩ Both screens synced to ${nextSec}s!`);
        },

        restartYtTogether: async function() {
            if (!activeWpRoom || !Nexus.db) return;
            let me = Nexus.getCurrentUser();
            await Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).set({
                currentTime: 0,
                startOffset: Date.now() % 1000,
                playState: 'PLAYING',
                updatedBy: me ? me.username : 'member',
                updatedAt: Date.now()
            }, { merge: true });
            Nexus.toast("🔄 Both screens restarted in exact sync!");
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
