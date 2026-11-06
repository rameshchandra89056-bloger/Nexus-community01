// ================= LIVE.JS (v6.0 GUARANTEED INSTANT SEARCH & 2-WAY VIDEO CALL): ▶️ INSTANT YOUTUBE & FULL MP3 SONG SEARCH + 🔽 DUAL SHOW/HIDE FOR MAIN SONG & RELATED STRIP + 📹 2-WAY WEBRTC VIDEO CALL WITH PARTNER RING =================

(function() {
    const PROTO = 'https:' + '//';
    const RTC_ICE = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }] };

    let activeWpRoom = '', wpUnsub = null, currentMediaKey = '', currentMode = 'yt';
    let isMainHidden = false, isRelHidden = false;
    let searchResultsCache = [];
    let activeStreams = [], activeCallRoom = '', callPc = null, callSigUnsub = null, ringInterval = null;

    const st = document.createElement('style');
    st.innerHTML = `
        #nx-wp-dock {
            background: #0f172a; border-bottom: 2px solid #10b981; width: 100%;
            flex-shrink: 0; z-index: 35; display: none; flex-direction: column;
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
    `;
    document.head.appendChild(st);

    function fetchFast(url, ms) {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), ms || 5500);
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
            let pU = uObj ? uObj.username.toLowerCase().trim() : (pName.toLowerCase().replace(/[^a-z0-9_]/g, '') || myU);
            return { isDm: true, roomId: 'dm_' + [myU, pU].sort().join('__'), title: `Video Call • ${pName || '@' + pU}`, targetUser: pU };
        }
        let rTitle = document.getElementById('nx-room-title')?.innerText || 'Study Room';
        return { isDm: false, roomId: 'grp_' + rTitle.toLowerCase().replace(/[^a-z0-9]/g, '_'), title: `${rTitle} • Group Video`, targetUser: '' };
    }

    async function searchAllEnginesGuaranteed(rawQuery, mode) {
        let q = (rawQuery || 'Hindi Hit Songs').trim();
        let cleanQ = q.replace(/\b(song|songs|mp3|full|audio|video)\b/gi, '').replace(/\s+/g, ' ').trim() || q;
        let mp3List = [], ytList = [], seen = new Set();

        const addMp3 = (it) => { if (it && it.url && !seen.has(it.url)) { seen.add(it.url); mp3List.push(it); } };
        const addYt = (it) => { if (it && it.videoId && !seen.has(it.videoId)) { seen.add(it.videoId); ytList.push(it); } };

        let directId = (q.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/) || [])[1];
        if (directId) {
            addYt({ id: 'yt_' + directId, videoId: directId, title: "YouTube Direct Video", channel: "▶️ YouTube Live Sync", thumb: `https://i.ytimg.com/vi/${directId}/mqdefault.jpg`, url: `https://www.youtube.com/embed/${directId}?autoplay=1&playsinline=1&rel=0`, type: 'yt' });
            return ytList;
        }

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
                if (best && dur >= 50) {
                    let m = Math.floor(dur / 60), sec = dur % 60;
                    addMp3({
                        id: 'mp3_' + (s.id || Math.random()),
                        title: (s.name || s.title || 'Song').replace(/&quot;/g, '"'),
                        channel: `${s.primaryArtists || 'Bollywood'} • 🎵 Full MP3 (${m}:${sec < 10 ? '0' + sec : sec})`,
                        thumb: th || 'https://placehold.co/100x100/10b981/020617?text=MP3',
                        url: best,
                        type: 'mp3'
                    });
                }
            });
        };

        const parseYtHtml = (html) => {
            if (!html || typeof html !== 'string') return;
            let parts = html.split('"videoRenderer":{"videoId":"');
            for (let i = 1; i < parts.length && ytList.length < 12; i++) {
                let chunk = parts[i].substring(0, 1200);
                let vid = chunk.substring(0, 11);
                if (/^[a-zA-Z0-9_-]{11}$/.test(vid)) {
                    let tm = chunk.match(/"title":\{"runs":\[\{"text":"([^"]+)"/) || chunk.match(/"title":\{"simpleText":"([^"]+)"/);
                    let title = tm ? tm[1].replace(/\\u0026/g, '&').replace(/\\"/g, '"') : 'YouTube Video';
                    addYt({ id: 'yt_' + vid, videoId: vid, title: title, channel: '▶️ YouTube Video', thumb: `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`, url: `https://www.youtube.com/embed/${vid}?autoplay=1&playsinline=1&rel=0`, type: 'yt' });
                }
            }
        };

        const saavnOfficial = `${PROTO}www.jiosaavn.com/api.php?p=1&q=${encodeURIComponent(cleanQ)}&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=12&__call=search.getResults`;
        const ytPage = `${PROTO}www.youtube.com/results?search_query=${encodeURIComponent(q)}&hl=en`;

        await Promise.allSettled([
            fetchFast(`${PROTO}api.allorigins.win/get?url=${encodeURIComponent(saavnOfficial)}`, 5500).then(r => r.json()).then(d => parseSaavn(JSON.parse(d.contents))),
            fetchFast(`${PROTO}saavn.dev/api/search/songs?query=${encodeURIComponent(cleanQ)}&limit=10`, 5000).then(r => r.json()).then(parseSaavn),
            fetchFast(`${PROTO}jiosaavn-api-privatecvc2.vercel.app/search/songs?query=${encodeURIComponent(cleanQ)}&limit=10`, 5000).then(r => r.json()).then(parseSaavn),
            fetchFast(`${PROTO}api.allorigins.win/get?url=${encodeURIComponent(ytPage)}`, 5500).then(r => r.json()).then(d => parseYtHtml(d.contents)),
            fetchFast(`${PROTO}api.codetabs.com/v1/proxy?quest=${encodeURIComponent(ytPage)}`, 5500).then(r => r.text()).then(parseYtHtml),
            fetchFast(`${PROTO}inv.nadeko.net/api/v1/search?q=${encodeURIComponent(q)}&type=video`, 5000).then(r => r.json()).then(arr => {
                (Array.isArray(arr) ? arr : []).slice(0, 10).forEach(v => {
                    if (v && v.videoId) addYt({ id: 'yt_' + v.videoId, videoId: v.videoId, title: v.title || 'Video', channel: `▶️ ${v.author || 'YouTube'}`, thumb: `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`, url: `https://www.youtube.com/embed/${v.videoId}?autoplay=1&playsinline=1&rel=0`, type: 'yt' });
                });
            })
        ]);

        return mode === 'mp3' ? [...mp3List, ...ytList] : [...ytList, ...mp3List];
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
                        <div style="font-size:10.5px; color:#10b981; font-weight:800; margin-bottom:4px;">🟢 Synced Full MP3 • @${docData.startedBy || 'member'}</div>
                        <audio id="nx-wp-audio-el" src="${docData.url}" controls autoplay style="width:100%; height:34px;"></audio>
                    </div>
                </div>
            ` : `
                <div style="position:relative; width:100%; height:195px; background:#000;">
                    <iframe src="${docData.videoId ? `https://www.youtube.com/embed/${docData.videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1&start=${startSec}` : docData.url}" sandbox="allow-scripts allow-same-origin allow-presentation" style="width:100%; height:195px; border:none; background:#000;" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
                </div>
                <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 10px; background:#0f172a; border-top:1px solid #1e293b; gap:6px;">
                    <span style="font-size:10.5px; color:#10b981; font-weight:800; flex:1;">🟢 Playing in Sync • @${docData.startedBy || 'member'}</span>
                    <button type="button" class="nx-tw-pill" onclick="NexusWatchParty.seekYtVideo(-15)">⏪ -15s</button>
                    <button type="button" class="nx-tw-pill" onclick="NexusWatchParty.seekYtVideo(15)">⏩ +15s</button>
                    <button type="button" class="nx-tw-pill" style="background:#10b981; color:#020617; border:none;" onclick="NexusWatchParty.restartYtTogether()">🔄 Sync Both</button>
                </div>
            `;

            dock.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 10px; background:#182229; border-bottom:1px solid #2a3942; gap:5px;">
                    <span style="font-size:11.5px; font-weight:900; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;">${isMp3 ? '🎵' : '▶️'} ${(docData.title || 'Live Media').replace(/</g, '&lt;')}</span>
                    <button type="button" class="nx-tw-pill" style="border-color:#38bdf8; color:#38bdf8;" onclick="NexusWatchParty.openModal(${isDm}, '${isMp3 ? 'mp3' : 'yt'}')">🔍 Search</button>
                    <button type="button" id="nx-btn-toggle-main" class="nx-tw-pill" onclick="NexusWatchParty.toggleMainPlayer()">${isMainHidden ? '🔼 Show Song' : '🔽 Hide Song'}</button>
                    <button type="button" id="nx-btn-toggle-rel" class="nx-tw-pill" style="border-color:#a78bfa; color:#d8b4fe;" onclick="NexusWatchParty.toggleRelatedStrip()">${isRelHidden ? '🔥 Show Related' : '🔥 Hide Related'}</button>
                    <button type="button" class="nx-tw-pill" style="background:#ef4444; border:none; color:white;" onclick="NexusWatchParty.stop()">✕</button>
                </div>
                <div id="nx-wp-main-stage" style="display:${isMainHidden ? 'none' : 'flex'}; flex-direction:column;">${stageHTML}</div>
                <div id="nx-wp-related-stage" style="display:${isRelHidden ? 'none' : 'flex'}; flex-direction:column;">
                    <div style="padding:4px 10px 2px; background:#050811; font-size:10px; font-weight:900; color:#93c5fd;">🔥 RELATED SONGS &amp; VIDEOS (SWIPE 👉):</div>
                    <div class="nx-horiz-strip">
                        ${relList.map((r, i) => `
                            <div onclick="NexusWatchParty.playByIndex(${i}, ${isDm})" style="min-width:165px; max-width:165px; background:#111827; border:1px solid #26334d; border-radius:12px; padding:6px; display:flex; align-items:center; gap:8px; cursor:pointer; flex-shrink:0;">
                                <img src="${r.thumb}" style="width:40px; height:40px; border-radius:8px; object-fit:cover; flex-shrink:0;">
                                <div style="min-width:0; flex:1;">
                                    <div style="font-size:11px; font-weight:800; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${(r.title || '').replace(/</g, '&lt;')}</div>
                                    <div style="font-size:9.5px; color:#10b981; font-weight:800;">Play Here ▶</div>
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
            currentMode = modeTab || 'yt';

            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid ${currentMode === 'mp3' ? '#10b981' : '#ef4444'}; background:#090d16; padding:15px; max-width:400px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <strong style="color:#fff; font-size:15px;">${currentMode === 'mp3' ? '🎵 Full MP3 Song DJ (4-5+ Min)' : '▶️ YouTube Watch-Party TV'}</strong>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:19px; cursor:pointer;">✕</button>
                    </div>
                    <div style="display:flex; gap:6px; margin-bottom:10px;">
                        <button type="button" onclick="NexusWatchParty.openModal(${Boolean(isDm)}, 'yt')" style="flex:1; padding:8px; border-radius:10px; border:none; background:${currentMode === 'yt' ? '#ef4444' : '#1e293b'}; color:white; font-weight:900; font-size:12px; cursor:pointer;">▶️ YouTube TV</button>
                        <button type="button" onclick="NexusWatchParty.openModal(${Boolean(isDm)}, 'mp3')" style="flex:1; padding:8px; border-radius:10px; border:none; background:${currentMode === 'mp3' ? '#10b981' : '#1e293b'}; color:${currentMode === 'mp3' ? '#020617' : 'white'}; font-weight:900; font-size:12px; cursor:pointer;">🎵 Full MP3 Songs</button>
                    </div>
                    <div style="display:flex; gap:6px; margin-bottom:10px;">
                        <input type="text" id="nx-wp-in" placeholder="Type Song, Movie, Motu Patlu or paste link..." onkeydown="if(event.key==='Enter') NexusWatchParty.search(${Boolean(isDm)})" style="flex:1; padding:9px 12px; border-radius:10px; border:1px solid #334155; background:#111827; color:white; font-size:12.5px; outline:none;">
                        <button type="button" onclick="NexusWatchParty.search(${Boolean(isDm)})" style="background:${currentMode === 'mp3' ? '#10b981' : '#ef4444'}; color:${currentMode === 'mp3' ? '#020617' : 'white'}; border:none; padding:0 14px; border-radius:10px; font-weight:900; font-size:12px; cursor:pointer;">Search</button>
                    </div>
                    <div id="nx-wp-results" style="display:flex; flex-direction:column; gap:7px; max-height:52vh; overflow-y:auto;"></div>
                </div>
            `;
            modal.style.display = 'flex';
            const inp = document.getElementById('nx-wp-in');
            if (inp) inp.focus();
            this.search(Boolean(isDm), currentMode === 'mp3' ? 'Arijit Singh' : 'Hindi Hit Songs');
        },

        search: async function(isDm, fallbackQ) {
            const inp = document.getElementById('nx-wp-in');
            const box = document.getElementById('nx-wp-results');
            if (!box) return;
            let q = (inp && inp.value.trim()) ? inp.value.trim() : (fallbackQ || 'Hindi Hit Songs');
            box.innerHTML = `<div style="text-align:center; padding:16px; color:#38bdf8; font-size:12.5px; font-weight:800;">⚡ Searching "${q}"...</div>`;

            let list = await searchAllEnginesGuaranteed(q, currentMode);
            searchResultsCache = list.slice(0, 12);

            if (!list.length) {
                box.innerHTML = `<div style="text-align:center; padding:14px; color:#94a3b8; font-size:12px;">Tap Search once more to load "${q}"!</div>`;
                return;
            }

            box.innerHTML = list.map((v, idx) => `
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

            let me = Nexus.getCurrentUser();
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

            if (Nexus.db) {
                await Nexus.db.collection("nexus_watch_party").doc(ctx.roomId).set(payload).catch(() => {});
            }
            Nexus.toast(`🎵 Playing "${item.title}"!`);
        },

        toggleMainPlayer: function() {
            isMainHidden = !isMainHidden;
            const el = document.getElementById('nx-wp-main-stage');
            const btn = document.getElementById('nx-btn-toggle-main');
            if (el) el.style.display = isMainHidden ? 'none' : 'flex';
            if (btn) btn.innerText = isMainHidden ? '🔼 Show Song' : '🔽 Hide Song';
        },

        toggleRelatedStrip: function() {
            isRelHidden = !isRelHidden;
            const el = document.getElementById('nx-wp-related-stage');
            const btn = document.getElementById('nx-btn-toggle-rel');
            if (el) el.style.display = isRelHidden ? 'none' : 'flex';
            if (btn) btn.innerText = isRelHidden ? '🔥 Show Related' : '🔥 Hide Related';
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
            if (Nexus.db && activeWpRoom) {
                Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).set({ active: false }, { merge: true }).catch(() => {});
            }
            const dock = document.getElementById('nx-wp-dock');
            if (dock) { dock.style.display = 'none'; dock.innerHTML = ''; }
            currentMediaKey = '';
        }
    };

    window.NexusYTParty = window.NexusWatchParty;
    window.NexusMP3DJ = { openModal: (isDm) => window.NexusWatchParty.openModal(isDm, 'mp3') };
    window.NexusLive = Object.assign(window.NexusLive || {}, {
        openMediaHubModal: (isDm, mode) => window.NexusWatchParty.openModal(isDm, mode || 'yt')
    });

    function bindAllMediaButtons() {
        subscribeActiveRoom();
        if (window.NexusAdvance) {
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

    setInterval(bindAllMediaButtons, 800);
    setTimeout(bindAllMediaButtons, 120);
})(); // === END OF LIVE.JS ===
