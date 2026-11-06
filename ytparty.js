// ================= YTPARTY.JS (DEDICATED YOUTUBE WATCH-PARTY TV MODULE): ▶️ OFFICIAL YOUTUBE IFRAME API EXACT TIME/SEEK/PAUSE SYNC + ⏳ BUFFER WAIT + 🔥 RELATED VIDEOS STRIP BELOW PLAYER + 🔽 SHOW/HIDE TOGGLE + 🧹 KILLS OLD 404 WATCH-PARTY BOX =================

(function() {
    const PROTO = 'https:' + '//';
    let ytApiReady = false;
    let ytPlayerInstance = null;
    let activeYtRoomKey = '';
    let ytSyncUnsub = null;
    let currentVideoId = '';
    let isYtMinimized = false;
    let isApplyingRemoteState = false;
    let relatedVideosCache = [];

    // Load Official YouTube IFrame API for exact play/pause/seek control
    if (!window.YT && !document.getElementById('nx-yt-iframe-api')) {
        const tag = document.createElement('script');
        tag.id = 'nx-yt-iframe-api';
        tag.src = PROTO + 'www.youtube.com/iframe_api';
        document.head.appendChild(tag);
    }
    window.onYouTubeIframeAPIReady = function() { ytApiReady = true; };

    const ytStyle = document.createElement('style');
    ytStyle.innerHTML = `
        /* Hide old broken 404 Watch-Party boxes from superchat.js and power.js */
        #nx-grp-wp-box, #nx-dm-wp-box, #nx-watch-party-box { display: none !important; }
        #nx-ytparty-dock {
            background: #090d16; border-bottom: 2px solid #ef4444; width: 100%;
            flex-shrink: 0; z-index: 32; display: none; flex-direction: column;
        }
        .nx-yt-ctrl-pill {
            background: #1e293b; border: 1px solid #334155; color: #f8fafc;
            padding: 4px 8px; border-radius: 8px; font-size: 10.5px; font-weight: 800; cursor: pointer;
        }
        .nx-yt-ctrl-pill:active { transform: scale(0.94); }
        .nx-yt-rel-strip {
            display: flex; gap: 8px; overflow-x: auto; padding: 7px 10px;
            background: #050811; border-top: 1px solid #1e293b; scrollbar-width: none;
        }
        .nx-yt-rel-card {
            min-width: 150px; max-width: 150px; background: #111827; border: 1px solid #26334d;
            border-radius: 10px; padding: 5px; cursor: pointer; flex-shrink: 0; display: flex; flex-direction: column; gap: 4px;
        }
    `;
    document.head.appendChild(ytStyle);

    // Automatically remove the broken white 404 box shown in Screenshot 1000073320.jpg!
    function removeBroken404WatchPartyBoxes() {
        document.querySelectorAll('#nx-chat-room div, #nx-dm-dedicated-root div').forEach(el => {
            let txt = (el.innerText || '').trim();
            if ((txt.startsWith('🎬 Group Watch-Party') || txt.startsWith('🎬 Live Watch-Party')) && el.children.length <= 3) {
                if (el.parentElement && el.parentElement.querySelector('iframe')) {
                    el.parentElement.style.display = 'none';
                    el.parentElement.innerHTML = '';
                } else {
                    el.style.display = 'none';
                }
            }
        });
    }

    function getActiveRoomKey(isDmExplicit) {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let myU = me && me.username ? me.username.toLowerCase().trim() : 'guest';
        const dmRoot = document.getElementById('nx-dm-dedicated-root');
        const isDm = isDmExplicit === true || (dmRoot && dmRoot.style.display !== 'none');
        if (isDm) {
            let pName = document.getElementById('nx-dm-partner-name')?.innerText || '';
            let uObj = (Nexus.users || []).find(u => u && ((u.name && u.name.toLowerCase() === pName.trim().toLowerCase()) || (u.username && u.username.toLowerCase() === pName.trim().toLowerCase())));
            let pU = uObj ? uObj.username.toLowerCase().trim() : pName.toLowerCase().replace(/[^a-z0-9_]/g, '');
            return { isDm: true, roomKey: 'yt_dm_' + [myU, pU].sort().join('__') };
        }
        let rTitle = document.getElementById('nx-room-title')?.innerText || 'Study Room';
        return { isDm: false, roomKey: 'yt_grp_' + rTitle.toLowerCase().replace(/[^a-z0-9]/g, '_') };
    }

    async function searchYouTubeVideos(query) {
        let q = (query || 'Hindi Hit Songs Video').trim();
        let list = [];
        let seen = new Set();

        let directId = (q.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/) || [])[1];
        if (directId) {
            list.push({ videoId: directId, title: "YouTube Direct Video", author: "YouTube Sync", thumb: `https://i.ytimg.com/vi/${directId}/mqdefault.jpg` });
        }

        const ytPage = `${PROTO}www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
        const proxies = [
            `${PROTO}api.codetabs.com/v1/proxy?quest=${encodeURIComponent(ytPage)}`,
            `${PROTO}api.allorigins.win/raw?url=${encodeURIComponent(ytPage)}`
        ];

        for (let pUrl of proxies) {
            try {
                let r = await fetch(pUrl);
                if (r.ok) {
                    let html = await r.text();
                    let rgx = /"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})"[\s\S]*?"title":\{"runs":\[\{"text":"([^"]+)"/g;
                    let m;
                    while ((m = rgx.exec(html)) !== null && list.length < 10) {
                        if (!seen.has(m[1])) {
                            seen.add(m[1]);
                            list.push({
                                videoId: m[1],
                                title: m[2].replace(/\\u0026/g, '&').replace(/\\"/g, '"'),
                                author: "▶️ YouTube Video",
                                thumb: `https://i.ytimg.com/vi/${m[1]}/mqdefault.jpg`
                            });
                        }
                    }
                    if (list.length >= 5) break;
                }
            } catch (e) {}
        }

        if (list.length === 0) {
            [
                { videoId: "NNqLB7znMLU", title: "Hanji Bilkul Pyar Karenge - Official Video", author: "▶️ YouTube Hit" },
                { videoId: "SlPhMPnQ58k", title: "Arijit Singh Best Hindi Hit Songs Jukebox", author: "▶️ Bollywood Hits" },
                { videoId: "RLzC55ai0eo", title: "Heeriye - Jasleen Royal ft Arijit Singh", author: "▶️ Official Video" },
                { videoId: "gvyUuxdRdR4", title: "Raataan Lambiyan - Shershaah", author: "▶️ Romantic Hit" },
                { videoId: "jfKfPfyJRdk", title: "Lofi Hip Hop Radio - Study & Relax Beats", author: "▶️ Live Stream" }
            ].forEach(b => list.push({ videoId: b.videoId, title: b.title, author: b.author, thumb: `https://i.ytimg.com/vi/${b.videoId}/mqdefault.jpg` }));
        }
        return list;
    }

    function pushYtStateToCloud(stateName, customTime) {
        if (isApplyingRemoteState || !activeYtRoomKey || !Nexus.db) return;
        let me = Nexus.getCurrentUser();
        let curSec = typeof customTime === 'number'
            ? customTime
            : (ytPlayerInstance && typeof ytPlayerInstance.getCurrentTime === 'function' ? ytPlayerInstance.getCurrentTime() : 0);

        Nexus.db.collection("nexus_yt_watchparty").doc(activeYtRoomKey).set({
            playState: stateName, // 'PLAYING' | 'PAUSED' | 'BUFFERING'
            currentTime: Math.max(0, Math.round(curSec)),
            updatedBy: me ? me.username : 'member',
            updatedAt: Date.now()
        }, { merge: true }).catch(() => {});
    }

    function mountYtPlayerAndSync(docData, isDm) {
        let dock = document.getElementById('nx-ytparty-dock');
        if (!dock) {
            dock = document.createElement('div');
            dock.id = 'nx-ytparty-dock';
        }
        const msgBox = isDm ? document.getElementById('nx-dm-msgs-box') : document.getElementById('nx-room-messages');
        if (msgBox && msgBox.parentNode && dock.nextSibling !== msgBox) {
            msgBox.parentNode.insertBefore(dock, msgBox);
        }

        if (!docData || !docData.active || !docData.videoId) {
            dock.style.display = 'none';
            dock.innerHTML = '';
            currentVideoId = '';
            ytPlayerInstance = null;
            return;
        }

        dock.style.display = 'flex';
        let relList = Array.isArray(docData.related) && docData.related.length ? docData.related : relatedVideosCache;

        if (docData.videoId !== currentVideoId) {
            currentVideoId = docData.videoId;
            dock.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:#182229; border-bottom:1px solid #2a3942;">
                    <div style="min-width:0; flex:1;">
                        <div style="font-size:11.5px; font-weight:900; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">▶️ ${(docData.title || 'YouTube Watch-Party').replace(/</g, '&lt;')}</div>
                        <div id="nx-yt-sync-status" style="font-size:10px; color:#10b981; font-weight:800;">🟢 Synced with partner • @${docData.startedBy || 'member'}</div>
                    </div>
                    <div style="display:flex; gap:5px; flex-shrink:0;">
                        <button type="button" class="nx-yt-ctrl-pill" style="border-color:#38bdf8; color:#38bdf8;" onclick="NexusYTParty.openModal(${isDm})">🔍 Search</button>
                        <button type="button" id="nx-yt-hide-btn" class="nx-yt-ctrl-pill" onclick="NexusYTParty.toggleMinimize()">🔽 Hide</button>
                        <button type="button" class="nx-yt-ctrl-pill" style="background:#ef4444; border:none; color:white;" onclick="NexusYTParty.stopParty()">✕</button>
                    </div>
                </div>

                <div id="nx-yt-collapsible-body" style="display:${isYtMinimized ? 'none' : 'flex'}; flex-direction:column;">
                    <div style="position:relative; width:100%; height:190px; background:#000;">
                        <div id="nx-yt-api-target" style="width:100%; height:190px;"></div>
                    </div>

                    <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 10px; background:#0f172a; border-top:1px solid #1e293b; gap:6px;">
                        <button type="button" class="nx-yt-ctrl-pill" onclick="NexusYTParty.seekRelative(-10)">⏪ -10s</button>
                        <button type="button" class="nx-yt-ctrl-pill" style="background:#10b981; color:#020617; border:none; flex:1;" onclick="NexusYTParty.togglePlayPauseBoth()">⏯️ Play / Pause Both</button>
                        <button type="button" class="nx-yt-ctrl-pill" onclick="NexusYTParty.seekRelative(10)">⏩ +10s</button>
                        <button type="button" class="nx-yt-ctrl-pill" style="border-color:#a78bfa; color:#d8b4fe;" onclick="NexusYTParty.forceSyncPartner()">🔄 Sync Time</button>
                    </div>

                    <div style="padding:4px 10px 2px; background:#050811; font-size:10px; font-weight:900; color:#93c5fd;">🔥 RELATED VIDEOS (TAP TO PLAY WITHOUT YOUTUBE):</div>
                    <div id="nx-yt-related-row" class="nx-yt-rel-strip">
                        ${relList.map(r => {
                            let enc = btoa(unescape(encodeURIComponent(JSON.stringify(r))));
                            return `
                                <div class="nx-yt-rel-card" onclick="NexusYTParty.playVideo('${enc}', ${isDm})">
                                    <img src="${r.thumb}" style="width:100%; height:64px; border-radius:7px; object-fit:cover; background:#000;">
                                    <div style="font-size:10.5px; font-weight:800; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${(r.title || '').replace(/</g, '&lt;')}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;

            if (window.YT && window.YT.Player) {
                ytPlayerInstance = new YT.Player('nx-yt-api-target', {
                    height: '190',
                    width: '100%',
                    videoId: docData.videoId,
                    playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1 },
                    events: {
                        onReady: (ev) => {
                            if (docData.currentTime > 2) ev.target.seekTo(docData.currentTime, true);
                            ev.target.playVideo();
                        },
                        onStateChange: (ev) => {
                            if (isApplyingRemoteState) return;
                            if (ev.data === YT.PlayerState.PLAYING) pushYtStateToCloud('PLAYING');
                            else if (ev.data === YT.PlayerState.PAUSED) pushYtStateToCloud('PAUSED');
                            else if (ev.data === YT.PlayerState.BUFFERING) pushYtStateToCloud('BUFFERING');
                        }
                    }
                });
            } else {
                const target = document.getElementById('nx-yt-api-target');
                if (target) {
                    target.innerHTML = `<iframe id="nx-yt-raw-iframe" src="https://www.youtube.com/embed/${docData.videoId}?autoplay=1&playsinline=1&start=${docData.currentTime || 0}" style="width:100%; height:190px; border:none;" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>`;
                }
            }
        } else {
            // Sync Play / Pause / Buffering & Exact Timestamp across both phones!
            const statusEl = document.getElementById('nx-yt-sync-status');
            let elapsed = Math.max(0, (Date.now() - (docData.updatedAt || Date.now())) / 1000);
            let expectedTime = (docData.currentTime || 0) + (docData.playState === 'PLAYING' ? elapsed : 0);

            if (statusEl) {
                if (docData.playState === 'BUFFERING') {
                    statusEl.innerText = `⏳ Waiting: @${docData.updatedBy || 'partner'} is buffering at ${Math.floor(docData.currentTime || 0)}s...`;
                    statusEl.style.color = '#fbbf24';
                } else if (docData.playState === 'PAUSED') {
                    statusEl.innerText = `⏸️ Paused by @${docData.updatedBy || 'partner'} at ${Math.floor(docData.currentTime || 0)}s`;
                    statusEl.style.color = '#f87171';
                } else {
                    statusEl.innerText = `🟢 Playing in Sync • @${docData.updatedBy || 'partner'}`;
                    statusEl.style.color = '#10b981';
                }
            }

            if (ytPlayerInstance && typeof ytPlayerInstance.getCurrentTime === 'function') {
                isApplyingRemoteState = true;
                let myTime = ytPlayerInstance.getCurrentTime() || 0;
                if (Math.abs(myTime - expectedTime) > 3) {
                    ytPlayerInstance.seekTo(expectedTime, true);
                }
                if (docData.playState === 'PAUSED' || docData.playState === 'BUFFERING') {
                    ytPlayerInstance.pauseVideo();
                } else if (docData.playState === 'PLAYING') {
                    ytPlayerInstance.playVideo();
                }
                setTimeout(() => { isApplyingRemoteState = false; }, 600);
            }
        }
    }

    function connectYtPartyWatcher() {
        removeBroken404WatchPartyBoxes();
        if (!window.Nexus || !Nexus.db) return;
        const dmRoot = document.getElementById('nx-dm-dedicated-root');
        const grpRoom = document.getElementById('nx-chat-room');
        let isDm = dmRoot && dmRoot.style.display !== 'none';
        let isGrp = grpRoom && grpRoom.style.display !== 'none';
        if (!isDm && !isGrp) return;

        let ctx = getActiveRoomKey(isDm);
        if (ctx.roomKey === activeYtRoomKey) return;
        activeYtRoomKey = ctx.roomKey;

        if (ytSyncUnsub) ytSyncUnsub();
        ytSyncUnsub = Nexus.db.collection("nexus_yt_watchparty").doc(activeYtRoomKey).onSnapshot(doc => {
            mountYtPlayerAndSync(doc.exists ? doc.data() : null, isDm);
        }, () => {});
    }

    window.NexusYTParty = {
        openModal: function(isDm) {
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;
            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid #ef4444; background:#090d16; padding:14px; max-width:395px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <strong style="color:#f8fafc; font-size:15px;">▶️ YouTube Watch-Party TV (Sync)</strong>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>
                    <p style="font-size:11px; color:#93c5fd; margin-bottom:8px;">Video dono ke phone mein ek sath chalega — aage badhane ya pause karne par samne wale ka bhi sync hoga!</p>
                    <div style="display:flex; gap:6px; margin-bottom:10px;">
                        <input type="text" id="nx-ytp-in" placeholder="Search YouTube video, movie or paste link..." onkeydown="if(event.key==='Enter') NexusYTParty.search(${Boolean(isDm)})" style="flex:1; padding:9px 12px; border-radius:10px; border:1px solid #334155; background:#111827; color:white; font-size:12.5px; outline:none;">
                        <button type="button" onclick="NexusYTParty.search(${Boolean(isDm)})" style="background:#ef4444; color:white; border:none; padding:0 14px; border-radius:10px; font-weight:900; font-size:12px; cursor:pointer;">Search</button>
                    </div>
                    <div id="nx-ytp-results" style="display:flex; flex-direction:column; gap:7px; max-height:52vh; overflow-y:auto;"></div>
                </div>
            `;
            modal.style.display = 'flex';
            const inp = document.getElementById('nx-ytp-in');
            if (inp) inp.focus();
            this.search(Boolean(isDm), 'Khasa Aala Chahar');
        },

        search: async function(isDm, fallbackQ) {
            const inp = document.getElementById('nx-ytp-in');
            const box = document.getElementById('nx-ytp-results');
            if (!box) return;
            let q = (inp && inp.value.trim()) ? inp.value.trim() : (fallbackQ || 'Hindi Hit Video Songs');
            box.innerHTML = `<div style="text-align:center; padding:16px; color:#38bdf8; font-size:12.5px; font-weight:800;">⚡ Searching YouTube Videos for "${q}"...</div>`;

            let list = await searchYouTubeVideos(q);
            relatedVideosCache = list.slice(0, 8);

            box.innerHTML = list.map(v => {
                let enc = btoa(unescape(encodeURIComponent(JSON.stringify(v))));
                return `
                    <div onclick="NexusYTParty.playVideo('${enc}', ${Boolean(isDm)})" style="display:flex; align-items:center; gap:10px; padding:8px; background:#161f33; border:1px solid #26334d; border-radius:12px; cursor:pointer;">
                        <img src="${v.thumb}" style="width:62px; height:44px; border-radius:8px; object-fit:cover; flex-shrink:0; background:#000;">
                        <div style="min-width:0; flex:1;">
                            <div style="font-weight:800; font-size:12px; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${v.title}</div>
                            <div style="font-size:10.5px; color:#fda4af; font-weight:700;">${v.author}</div>
                        </div>
                        <span style="background:#ef4444; color:white; padding:5px 10px; border-radius:8px; font-size:10.5px; font-weight:900; flex-shrink:0;">Watch ▶</span>
                    </div>
                `;
            }).join('');
        },

        playVideo: async function(encItem, isDm) {
            const modal = document.getElementById('nx-global-modal');
            if (modal) modal.style.display = 'none';
            let item = null;
            try { item = JSON.parse(decodeURIComponent(escape(atob(encItem)))); } catch (e) { return; }
            let me = Nexus.getCurrentUser();
            if (!me || !Nexus.db || !item) return;

            let ctx = getActiveRoomKey(isDm);
            activeYtRoomKey = ctx.roomKey;
            isYtMinimized = false;

            // Also clear any old broken watchPartyUrl in nexus_group_rooms so the 404 box never appears
            if (!ctx.isDm && window.NexusChat && NexusChat.activeRoom) {
                Nexus.db.collection("nexus_group_rooms").doc(NexusChat.activeRoom).set({ watchPartyUrl: '' }, { merge: true }).catch(() => {});
            }

            await Nexus.db.collection("nexus_yt_watchparty").doc(ctx.roomKey).set({
                active: true,
                videoId: item.videoId,
                title: item.title || 'YouTube Video',
                thumb: item.thumb || '',
                playState: 'PLAYING',
                currentTime: 0,
                related: relatedVideosCache.slice(0, 8),
                startedBy: me.username,
                updatedBy: me.username,
                updatedAt: Date.now()
            });
            Nexus.toast(`▶️ Watch-Party Started: "${item.title}"`);
        },

        seekRelative: function(deltaSec) {
            if (!ytPlayerInstance || typeof ytPlayerInstance.getCurrentTime !== 'function') return;
            let nextSec = Math.max(0, (ytPlayerInstance.getCurrentTime() || 0) + deltaSec);
            ytPlayerInstance.seekTo(nextSec, true);
            pushYtStateToCloud('PLAYING', nextSec);
            Nexus.toast(`⏩ Both screens synced to ${Math.floor(nextSec)}s`);
        },

        togglePlayPauseBoth: function() {
            if (!ytPlayerInstance || typeof ytPlayerInstance.getPlayerState !== 'function') return;
            let st = ytPlayerInstance.getPlayerState();
            if (st === 1) {
                ytPlayerInstance.pauseVideo();
                pushYtStateToCloud('PAUSED');
            } else {
                ytPlayerInstance.playVideo();
                pushYtStateToCloud('PLAYING');
            }
        },

        forceSyncPartner: function() {
            if (!ytPlayerInstance || typeof ytPlayerInstance.getCurrentTime !== 'function') return;
            let cur = ytPlayerInstance.getCurrentTime() || 0;
            pushYtStateToCloud('PLAYING', cur);
            Nexus.toast("🔄 Partner video synced to your exact timestamp!");
        },

        toggleMinimize: function() {
            isYtMinimized = !isYtMinimized;
            const body = document.getElementById('nx-yt-collapsible-body');
            const btn = document.getElementById('nx-yt-hide-btn');
            if (body) body.style.display = isYtMinimized ? 'none' : 'flex';
            if (btn) btn.innerText = isYtMinimized ? '🔼 Show' : '🔽 Hide';
        },

        stopParty: function() {
            if (Nexus.db && activeYtRoomKey) {
                Nexus.db.collection("nexus_yt_watchparty").doc(activeYtRoomKey).set({ active: false }, { merge: true }).catch(() => {});
            }
            const dock = document.getElementById('nx-ytparty-dock');
            if (dock) { dock.style.display = 'none'; dock.innerHTML = ''; }
            currentVideoId = '';
            ytPlayerInstance = null;
        }
    };

    // Hook Watch-Party triggers exclusively to NexusYTParty
    function bindYtPartyHooks() {
        connectYtPartyWatcher();
        if (window.NexusAdvance) NexusAdvance.openInAppYouTubeTV = (isDm) => window.NexusYTParty.openModal(isDm);
        if (window.NexusPower) NexusPower.openWatchPartyModal = () => window.NexusYTParty.openModal(true);
        if (window.NexusWatchParty) NexusWatchParty.openModal = (isDm) => window.NexusYTParty.openModal(isDm);
    }

    setInterval(bindYtPartyHooks, 900);
    setTimeout(bindYtPartyHooks, 120);
})(); // === END OF YTPARTY.JS ===
