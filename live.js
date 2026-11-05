// ================= LIVE.JS (DEDICATED MODULAR ENGINE): 👥 4-5 FRIENDS GROUP VIDEO CONFERENCE ROOM + 📹 1:1 FACE-TO-FACE VIDEO CALL + 🎵 FULL-LENGTH HINDI SONG DJ SYNC + ▶️ YOUTUBE WATCH-PARTY TV + 🔔 REAL-TIME NOTIFICATION SYSTEM =================

(function() {
    const PROTO = 'https:' + '//';

    const RTC_ICE = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" }
        ]
    };

    // Group Video Conference (4-5 Friends Mesh) & 1:1 Call State
    let localMediaStream = null;
    let currentCamFacing = 'user';
    let isMicMuted = false;
    let isCamOff = false;
    let isScreenSharing = false;
    let activeVideoRoomId = '';
    let activeRoomUnsub = null;
    let meshPeerConnections = {}; // peerUsername -> RTCPeerConnection
    let meshSigUnsubs = {};       // peerUsername -> Firestore unsub
    let incomingCallUnsub = null;
    let ringBeepInterval = null;

    // Watch-Party & Full Song DJ State
    let wpUnsub = null;
    let activeWpRoomKey = '';
    let lastSyncedMediaUrl = '';
    let isWpMinimized = false;

    // Notification System State
    let notifUnsub = null;
    let dmAlertUnsub = null;
    let postAlertUnsub = null;
    let bootTimestamp = Date.now();
    let seenNotifHash = localStorage.getItem('nx_seen_notif_hash_v1') || '';

    const liveStyle = document.createElement('style');
    liveStyle.innerHTML = `
        @keyframes nxSmoothPop {
            0% { opacity: 0; transform: scale(0.92) translateY(12px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes nxPulseRing {
            0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            50% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
        }
        #nx-video-conf-overlay {
            position: fixed; inset: 0; width: 100%; max-width: 640px; height: 100dvh;
            margin: 0 auto; background: #050811; z-index: 100180; display: none;
            flex-direction: column; overflow: hidden; animation: nxSmoothPop 0.22s ease-out;
        }
        .nx-vconf-grid {
            flex: 1; display: grid; gap: 8px; padding: 10px; overflow-y: auto;
            align-content: center; background: radial-gradient(circle at center, #0f172a 0%, #050811 100%);
        }
        .nx-vconf-grid.peers-1 { grid-template-columns: 1fr; }
        .nx-vconf-grid.peers-2 { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; }
        .nx-vconf-grid.peers-3, .nx-vconf-grid.peers-4 { grid-template-columns: 1fr 1fr; grid-auto-rows: 1fr; }
        .nx-vconf-grid.peers-5, .nx-vconf-grid.peers-6 { grid-template-columns: 1fr 1fr; grid-auto-rows: minmax(140px, 1fr); }

        .nx-vconf-tile {
            position: relative; background: #0f172a; border: 1.5px solid #1e293b;
            border-radius: 16px; overflow: hidden; display: flex; align-items: center;
            justify-content: center; min-height: 145px; box-shadow: 0 8px 25px rgba(0,0,0,0.6);
            transition: all 0.25s ease;
        }
        .nx-vconf-tile.speaking { border-color: #10b981; }
        .nx-vconf-tile video {
            width: 100%; height: 100%; object-fit: cover; display: block;
        }
        .nx-vconf-name-tag {
            position: absolute; bottom: 8px; left: 8px; background: rgba(9, 13, 22, 0.82);
            backdrop-filter: blur(6px); border: 1px solid rgba(56, 189, 248, 0.4);
            color: #f8fafc; padding: 3px 9px; border-radius: 999px; font-size: 11px;
            font-weight: 800; display: flex; align-items: center; gap: 5px; z-index: 5;
        }
        .nx-vconf-ctrl-btn {
            background: #1e293b; border: 1px solid #334155; color: #f8fafc;
            padding: 10px 6px; border-radius: 14px; font-size: 11.5px; font-weight: 800;
            display: flex; flex-direction: column; align-items: center; gap: 3px;
            cursor: pointer; transition: transform 0.15s ease, background 0.2s ease;
        }
        .nx-vconf-ctrl-btn:active { transform: scale(0.92); }
        .nx-vconf-ctrl-btn.active-danger { background: rgba(239, 68, 68, 0.22); border-color: #ef4444; color: #fca5a5; }

        /* Smooth Floating Watch-Party & DJ Dock */
        #nx-live-media-dock {
            background: linear-gradient(180deg, #0f172a 0%, #090d16 100%);
            border-bottom: 1.5px solid #38bdf8; width: 100%; flex-shrink: 0;
            z-index: 30; display: none; flex-direction: column; transition: all 0.25s ease;
        }
        /* Incoming Call Ringing Card */
        #nx-live-incoming-call-card {
            position: fixed; top: 12px; left: 50%; transform: translateX(-50%);
            width: 94%; max-width: 415px; background: linear-gradient(135deg, #0f172a, #064e3b);
            border: 2px solid #10b981; border-radius: 20px; padding: 13px 15px;
            z-index: 100250; display: none; align-items: center; justify-content: space-between;
            gap: 10px; box-shadow: 0 20px 50px rgba(0,0,0,0.92); animation: nxPulseRing 1.6s infinite;
        }
    `;
    document.head.appendChild(liveStyle);

    // =========================================================================
    // 1. 👥 4-5 FRIENDS GROUP VIDEO CONFERENCE & 1:1 VIDEO CALL ENGINE
    // =========================================================================
    function playCallRingtone() {
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            const ctx = new Ctx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime);
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.18);
            gain.gain.setValueAtTime(0.14, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.42);
            if (navigator.vibrate) navigator.vibrate([180, 90, 180]);
        } catch (e) {}
    }

    function ensureVideoConfOverlay() {
        let ov = document.getElementById('nx-video-conf-overlay');
        if (!ov) {
            ov = document.createElement('div');
            ov.id = 'nx-video-conf-overlay';
            document.body.appendChild(ov);
        }
        return ov;
    }

    function getActiveChatContext(isDmExplicit) {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let myU = me && me.username ? me.username.toLowerCase().trim() : '';
        const dmRoot = document.getElementById('nx-dm-dedicated-root');
        const isDmOpen = isDmExplicit === true || (dmRoot && dmRoot.style.display !== 'none');

        if (isDmOpen) {
            let pName = document.getElementById('nx-dm-partner-name')?.innerText || '';
            let uObj = (Nexus.users || []).find(u => u && ((u.name && u.name.toLowerCase() === pName.trim().toLowerCase()) || (u.username && u.username.toLowerCase() === pName.trim().toLowerCase())));
            let partnerU = uObj ? uObj.username.toLowerCase().trim() : pName.toLowerCase().replace(/[^a-z0-9_]/g, '');
            let roomKey = [myU, partnerU].sort().join('__');
            return { isDm: true, roomId: 'dm_' + roomKey, title: `1:1 Video Call with ${pName || '@' + partnerU}`, targetUser: partnerU };
        } else {
            let rTitle = document.getElementById('nx-room-title')?.innerText || 'Study Room';
            let slug = rTitle.toLowerCase().replace(/[^a-z0-9]/g, '_');
            return { isDm: false, roomId: 'grp_' + slug, title: `${rTitle} • Video Room (Up to 5 Friends)`, targetUser: '' };
        }
    }

    function updateVideoGridLayoutCount() {
        const grid = document.getElementById('nx-vconf-tiles-grid');
        if (!grid) return;
        let count = grid.children.length;
        grid.className = 'nx-vconf-grid peers-' + Math.min(6, Math.max(1, count));
        const badge = document.getElementById('nx-vconf-live-count');
        if (badge) badge.innerText = `${count} Live`;
    }

    function mountOrUpdatePeerVideoTile(peerUsername, peerName, streamObj, isLocal) {
        const grid = document.getElementById('nx-vconf-tiles-grid');
        if (!grid) return;
        let cleanU = String(peerUsername || 'user').toLowerCase().trim();
        let tile = document.getElementById('nx-vtile-' + cleanU);

        if (!tile) {
            tile = document.createElement('div');
            tile.id = 'nx-vtile-' + cleanU;
            tile.className = 'nx-vconf-tile speaking';
            tile.innerHTML = `
                <video id="nx-vvid-${cleanU}" autoplay playsinline ${isLocal ? 'muted' : ''} style="${isLocal && currentCamFacing === 'user' && !isScreenSharing ? 'transform:scaleX(-1);' : ''}"></video>
                <div class="nx-vconf-name-tag">
                    <span>🟢</span>
                    <span>${isLocal ? 'You (@' + cleanU + ')' : (peerName || '@' + cleanU)}</span>
                </div>
            `;
            grid.appendChild(tile);
            updateVideoGridLayoutCount();
        }

        const vid = document.getElementById('nx-vvid-' + cleanU);
        if (vid && streamObj && vid.srcObject !== streamObj) {
            vid.srcObject = streamObj;
            vid.play().catch(() => {});
        }
    }

    function removePeerVideoTile(peerUsername) {
        let cleanU = String(peerUsername || '').toLowerCase().trim();
        const tile = document.getElementById('nx-vtile-' + cleanU);
        if (tile) tile.remove();
        if (meshPeerConnections[cleanU]) {
            try { meshPeerConnections[cleanU].close(); } catch (e) {}
            delete meshPeerConnections[cleanU];
        }
        if (meshSigUnsubs[cleanU]) {
            try { meshSigUnsubs[cleanU](); } catch (e) {}
            delete meshSigUnsubs[cleanU];
        }
        updateVideoGridLayoutCount();
    }

    function connectWebRtcMeshPeer(roomId, myU, peerU, peerName) {
        if (peerU === myU || meshPeerConnections[peerU] || !localMediaStream || !Nexus.db) return;

        const pc = new RTCPeerConnection(RTC_ICE);
        meshPeerConnections[peerU] = pc;

        localMediaStream.getTracks().forEach(track => pc.addTrack(track, localMediaStream));

        pc.ontrack = ev => {
            if (ev.streams && ev.streams[0]) {
                mountOrUpdatePeerVideoTile(peerU, peerName, ev.streams[0], false);
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                removePeerVideoTile(peerU);
            }
        };

        let pairKey = [myU, peerU].sort().join('__');
        let sigDocId = `vmesh_${roomId}_${pairKey}`;
        let isInitiator = myU < peerU;
        let myCandField = isInitiator ? 'callerCandidates' : 'calleeCandidates';
        let remoteCandField = isInitiator ? 'calleeCandidates' : 'callerCandidates';
        let myCandidates = [];
        let addedRemoteCands = new Set();

        const sigRef = Nexus.db.collection("nexus_video_calls").doc(sigDocId);

        pc.onicecandidate = ev => {
            if (ev.candidate) {
                myCandidates.push(ev.candidate.toJSON());
                sigRef.set({ [myCandField]: myCandidates, updatedAt: Date.now() }, { merge: true }).catch(() => {});
            }
        };

        if (isInitiator) {
            sigRef.set({ offer: null, answer: null, callerCandidates: [], calleeCandidates: [], updatedAt: Date.now() })
                .then(() => pc.createOffer())
                .then(offer => pc.setLocalDescription(offer).then(() => offer))
                .then(offer => {
                    sigRef.set({
                        offer: { type: offer.type, sdp: offer.sdp },
                        fromUser: myU,
                        toUser: peerU,
                        updatedAt: Date.now()
                    }, { merge: true });
                }).catch(() => {});
        }

        meshSigUnsubs[peerU] = sigRef.onSnapshot(async snap => {
            if (!snap.exists) return;
            let data = snap.data();

            if (!isInitiator && data.offer && !pc.currentRemoteDescription) {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                    const ans = await pc.createAnswer();
                    await pc.setLocalDescription(ans);
                    await sigRef.set({ answer: { type: ans.type, sdp: ans.sdp }, updatedAt: Date.now() }, { merge: true });
                } catch (e) {}
            } else if (isInitiator && data.answer && !pc.currentRemoteDescription) {
                try {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                } catch (e) {}
            }

            let remCands = data[remoteCandField];
            if (Array.isArray(remCands) && pc.currentRemoteDescription) {
                remCands.forEach(c => {
                    let k = JSON.stringify(c);
                    if (!addedRemoteCands.has(k)) {
                        addedRemoteCands.add(k);
                        pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
                    }
                });
            }
        });
    }

    // Listen for Incoming 1:1 or Group Video Calls Across the Entire App
    function startGlobalIncomingVideoCallListener() {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        if (!me || !me.username || !Nexus.db || incomingCallUnsub) return;
        let myU = me.username.toLowerCase().trim();

        if (!document.getElementById('nx-live-incoming-call-card')) {
            const card = document.createElement('div');
            card.id = 'nx-live-incoming-call-card';
            document.body.appendChild(card);
        }

        incomingCallUnsub = Nexus.db.collection("nexus_group_video_rooms")
            .onSnapshot(snap => {
                let incomingRoom = null;
                snap.forEach(doc => {
                    let d = doc.data();
                    if (!d || !d.active || (Date.now() - (d.updatedAt || 0) > 65000)) return;
                    if (activeVideoRoomId === doc.id) return;
                    if (d.targetUser && d.targetUser.toLowerCase() === myU && d.hostUser !== myU) {
                        incomingRoom = Object.assign({ id: doc.id }, d);
                    }
                });

                const card = document.getElementById('nx-live-incoming-call-card');
                if (!card) return;

                if (incomingRoom) {
                    card.style.display = 'flex';
                    card.innerHTML = `
                        <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
                            <div style="width:42px; height:42px; border-radius:50%; background:#10b981; color:#020617; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:900; flex-shrink:0;">📹</div>
                            <div style="min-width:0; flex:1;">
                                <div style="font-weight:900; font-size:13.5px; color:#f8fafc;">Incoming Live Video Call</div>
                                <div style="font-size:11.5px; color:#6ee7b7; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">@${incomingRoom.hostUser} (${incomingRoom.hostName || ''}) is calling you...</div>
                            </div>
                        </div>
                        <div style="display:flex; gap:7px; flex-shrink:0;">
                            <button type="button" onclick="NexusLive.joinVideoConferenceRoom('${incomingRoom.id}', '${(incomingRoom.title || 'Live Video Room').replace(/'/g, "\\'")}')" style="background:#10b981; color:#020617; border:none; padding:8px 13px; border-radius:12px; font-weight:900; font-size:12px; cursor:pointer;">✅ Join</button>
                            <button type="button" onclick="NexusLive.dismissIncomingCall('${incomingRoom.id}')" style="background:#ef4444; color:white; border:none; padding:8px 11px; border-radius:12px; font-weight:900; font-size:12px; cursor:pointer;">✕</button>
                        </div>
                    `;
                    clearInterval(ringBeepInterval);
                    playCallRingtone();
                    ringBeepInterval = setInterval(playCallRingtone, 2200);
                } else {
                    card.style.display = 'none';
                    clearInterval(ringBeepInterval);
                }
            }, () => {});
    }

    // =========================================================================
    // 2. 🎵 FULL-LENGTH HINDI SONG DJ & ▶️ YOUTUBE WATCH-PARTY TV ENGINE
    // =========================================================================
    const CURATED_YOUTUBE_VIDEOS = [
        { title: "Arijit Singh Best Hindi Hit Songs Jukebox", channel: "Bollywood Music", thumb: "https://i.ytimg.com/vi/SlPhMPnQ58k/mqdefault.jpg", url: "https://www.youtube.com/embed/SlPhMPnQ58k?autoplay=1&playsinline=1", type: "yt" },
        { title: "Lofi Hip Hop Radio - Beats to Study/Relax", channel: "Lofi Girl Live", thumb: "https://i.ytimg.com/vi/jfKfPfyJRdk/mqdefault.jpg", url: "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&playsinline=1", type: "yt" },
        { title: "Bollywood Late Night Chill Study Mashup", channel: "Indie India", thumb: "https://i.ytimg.com/vi/5qap5aO4i9A/mqdefault.jpg", url: "https://www.youtube.com/embed/5qap5aO4i9A?autoplay=1&playsinline=1", type: "yt" },
        { title: "Coding & JEE Focus Synthwave Radio", channel: "Synth Study", thumb: "https://i.ytimg.com/vi/4xDzrJKXOOY/mqdefault.jpg", url: "https://www.youtube.com/embed/4xDzrJKXOOY?autoplay=1&playsinline=1", type: "yt" }
    ];

    // Searches Full-Length 320kbps Songs from JioSaavn API + iTunes Music Videos + YouTube IDs
    async function searchSongsAndYouTubeMultiEngine(query, mode) {
        let q = (query || 'Arijit Singh Hindi Songs').trim();
        let results = [];

        // If user pasted a direct YouTube link, extract Video ID immediately!
        let ytMatch = q.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
        if (ytMatch && ytMatch[1]) {
            let vid = ytMatch[1];
            return [{
                title: "YouTube Direct Video",
                channel: "YouTube Live Sync",
                thumb: `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`,
                url: `https://www.youtube.com/embed/${vid}?autoplay=1&playsinline=1`,
                type: "yt"
            }];
        }

        // 1. Try JioSaavn Public API for FULL-LENGTH Hindi/Bollywood Songs (4-5 min full audio!)
        try {
            let rSaavn = await fetch(`${PROTO}saavn.dev/api/search/songs?query=${encodeURIComponent(q)}&limit=8`);
            if (rSaavn.ok) {
                let dSaavn = await rSaavn.json();
                let list = dSaavn?.data?.results || [];
                list.forEach(item => {
                    let dlArr = item.downloadUrl || [];
                    let bestAudio = dlArr.length ? (dlArr[dlArr.length - 1].url || dlArr[dlArr.length - 1].link) : '';
                    let imgArr = item.image || [];
                    let thumb = imgArr.length ? (imgArr[imgArr.length - 1].url || imgArr[imgArr.length - 1].link) : '';
                    if (bestAudio) {
                        results.push({
                            title: (item.name || 'Song').replace(/&quot;/g, '"'),
                            channel: `${item.artists?.primary?.[0]?.name || 'Artist'} • Full Song 🎵`,
                            thumb: thumb,
                            url: bestAudio,
                            type: "audio"
                        });
                    }
                });
            }
        } catch (e) {}

        // 2. Try Piped / Invidious Mirrors for Real YouTube Video Embeds
        if (mode === 'yt' || results.length < 3) {
            const ytMirrors = [
                `${PROTO}pipedapi.tokhmi.xyz/search?q=${encodeURIComponent(q)}&filter=videos`,
                `${PROTO}pipedapi.moomoo.me/search?q=${encodeURIComponent(q)}&filter=videos`
            ];
            for (let mUrl of ytMirrors) {
                try {
                    let rYt = await fetch(mUrl);
                    if (rYt.ok) {
                        let dYt = await rYt.json();
                        let items = Array.isArray(dYt.items) ? dYt.items : [];
                        items.slice(0, 8).forEach(v => {
                            let m = (v.url || '').match(/v=([a-zA-Z0-9_-]{11})/);
                            if (m && m[1]) {
                                results.push({
                                    title: v.title || 'YouTube Video',
                                    channel: `${v.uploaderName || 'YouTube'} • ▶️ Video`,
                                    thumb: v.thumbnail || `https://i.ytimg.com/vi/${m[1]}/mqdefault.jpg`,
                                    url: `https://www.youtube.com/embed/${m[1]}?autoplay=1&playsinline=1`,
                                    type: "yt"
                                });
                            }
                        });
                        if (results.length >= 4) break;
                    }
                } catch (e) {}
            }
        }

        // 3. iTunes Music Video & Track Search (100% Uptime Apple CDN)
        if (results.length < 4) {
            try {
                let mediaType = mode === 'yt' ? 'musicVideo' : 'music';
                let rIt = await fetch(`${PROTO}itunes.apple.com/search?term=${encodeURIComponent(q)}&country=IN&media=${mediaType}&limit=8`);
                if (rIt.ok) {
                    let dIt = await rIt.json();
                    (dIt.results || []).forEach(v => {
                        if (v.previewUrl) {
                            results.push({
                                title: v.trackName || 'Track',
                                channel: `${v.artistName || 'Artist'} • ${v.kind === 'music-video' ? '▶️ HD Video' : '🎵 Audio'}`,
                                thumb: (v.artworkUrl100 || '').replace('100x100', '300x300'),
                                url: v.previewUrl,
                                type: v.kind === 'music-video' ? 'mp4' : 'audio'
                            });
                        }
                    });
                }
            } catch (e) {}
        }

        if (results.length === 0) return CURATED_YOUTUBE_VIDEOS;
        return results;
    }

    function ensureLiveMediaDockMounted(isDm) {
        let dock = document.getElementById('nx-live-media-dock');
        if (!dock) {
            dock = document.createElement('div');
            dock.id = 'nx-live-media-dock';
        }
        const targetContainer = isDm
            ? document.getElementById('nx-dm-msgs-box')
            : document.getElementById('nx-room-messages');

        if (targetContainer && targetContainer.parentNode && dock.nextSibling !== targetContainer) {
            targetContainer.parentNode.insertBefore(dock, targetContainer);
        }
        return dock;
    }

    function connectWatchPartySyncForActiveChat() {
        if (!window.Nexus || !Nexus.db) return;
        const dmRoot = document.getElementById('nx-dm-dedicated-root');
        const grpRoom = document.getElementById('nx-chat-room');
        let isDm = dmRoot && dmRoot.style.display !== 'none';
        let isGrp = grpRoom && grpRoom.style.display !== 'none';
        if (!isDm && !isGrp) return;

        let ctx = getActiveChatContext(isDm);
        if (ctx.roomId === activeWpRoomKey) return;
        activeWpRoomKey = ctx.roomId;

        if (wpUnsub) wpUnsub();
        wpUnsub = Nexus.db.collection("nexus_watch_party").doc(activeWpRoomKey).onSnapshot(doc => {
            const dock = ensureLiveMediaDockMounted(isDm);
            if (!dock) return;

            if (!doc.exists || !doc.data().active) {
                dock.style.display = 'none';
                dock.innerHTML = '';
                lastSyncedMediaUrl = '';
                return;
            }

            let d = doc.data();
            dock.style.display = 'flex';

            if (d.url !== lastSyncedMediaUrl) {
                lastSyncedMediaUrl = d.url;
                let playerHTML = '';
                if (d.mediaType === 'yt' || (d.url && d.url.includes('youtube.com/embed'))) {
                    playerHTML = `<iframe src="${d.url}" style="width:100%; height:195px; border:none; background:#000;" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
                } else if (d.mediaType === 'mp4' || (d.url && d.url.endsWith('.m4v'))) {
                    playerHTML = `<video src="${d.url}" controls autoplay playsinline style="width:100%; max-height:195px; background:#000;"></video>`;
                } else {
                    playerHTML = `
                        <div style="display:flex; align-items:center; gap:12px; padding:10px 14px; background:#090d16;">
                            ${d.thumb ? `<img src="${d.thumb}" style="width:48px; height:48px; border-radius:10px; object-fit:cover;">` : `<div style="width:48px; height:48px; border-radius:10px; background:#10b981; display:flex; align-items:center; justify-content:center; font-size:22px;">🎵</div>`}
                            <div style="flex:1; min-width:0;">
                                <div style="font-size:13px; font-weight:900; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${(d.title || 'Live Song').replace(/</g, '&lt;')}</div>
                                <audio src="${d.url}" controls autoplay style="width:100%; height:32px; margin-top:4px;"></audio>
                            </div>
                        </div>
                    `;
                }

                dock.innerHTML = `
                    <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 12px; background:#182229; border-bottom:1px solid #2a3942;">
                        <div style="display:flex; align-items:center; gap:7px; min-width:0; flex:1;">
                            <span style="background:#ef4444; color:white; font-size:10px; font-weight:900; padding:2px 7px; border-radius:6px;">LIVE SYNC</span>
                            <span style="font-size:12px; font-weight:800; color:#e2e8f0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${(d.title || 'Watch Party').replace(/</g, '&lt;')} • @${d.startedBy || 'member'}</span>
                        </div>
                        <div style="display:flex; gap:6px; flex-shrink:0;">
                            <button type="button" onclick="NexusLive.openMediaHubModal(${isDm}, 'yt')" style="background:#1e293b; border:1px solid #38bdf8; color:#38bdf8; padding:3px 8px; border-radius:8px; font-size:10.5px; font-weight:800; cursor:pointer;">🔍 Change</button>
                            <button type="button" onclick="NexusLive.toggleMinimizeWatchParty()" style="background:#1e293b; border:1px solid #334155; color:#cbd5e1; padding:3px 8px; border-radius:8px; font-size:10.5px; font-weight:800; cursor:pointer;">🔽 Hide/Show</button>
                            <button type="button" onclick="NexusLive.stopWatchPartySync()" style="background:#ef4444; border:none; color:white; padding:3px 8px; border-radius:8px; font-size:10.5px; font-weight:900; cursor:pointer;">✕</button>
                        </div>
                    </div>
                    <div id="nx-wp-player-stage">${playerHTML}</div>
                `;
            }
        }, () => {});
    }

    // =========================================================================
    // 3. PUBLIC API: WINDOW.NEXUSLIVE
    // =========================================================================
    window.NexusLive = {
        // Start or Join 1:1 or 4-5 Friends Group Video Conference Room
        startOrJoinVideoRoom: async function(isDmExplicit) {
            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (!me) { Nexus.switchTab('tab-profile'); return; }
            let ctx = getActiveChatContext(isDmExplicit);
            await this.joinVideoConferenceRoom(ctx.roomId, ctx.title, ctx.targetUser, ctx.isDm);
        },

        joinVideoConferenceRoom: async function(roomId, roomTitle, targetUser, isDm) {
            clearInterval(ringBeepInterval);
            const incCard = document.getElementById('nx-live-incoming-call-card');
            if (incCard) incCard.style.display = 'none';

            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (!me || !Nexus.db) return;

            try {
                localMediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: currentCamFacing },
                    audio: true
                });
            } catch (e) {
                Nexus.toast("⚠️ Please allow Camera & Microphone permission!");
                return;
            }

            activeVideoRoomId = roomId;
            isMicMuted = false;
            isCamOff = false;
            isScreenSharing = false;

            const ov = ensureVideoConfOverlay();
            ov.innerHTML = `
                <div style="height:54px; background:#0f172a; border-bottom:1.5px solid #38bdf8; display:flex; align-items:center; justify-content:space-between; padding:0 14px; flex-shrink:0;">
                    <div style="display:flex; align-items:center; gap:8px; min-width:0; flex:1;">
                        <span style="font-size:18px;">📹</span>
                        <div style="min-width:0; flex:1;">
                            <div style="font-weight:900; font-size:13.5px; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${roomTitle || 'Nexus Live Video Room'}</div>
                            <div style="font-size:10.5px; color:#10b981; font-weight:800;"><span id="nx-vconf-live-count">1 Live</span> • Up to 5 Friends Mesh HD</div>
                        </div>
                    </div>
                    <button type="button" onclick="NexusLive.leaveVideoConferenceRoom()" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:10px; font-size:11.5px; font-weight:900; cursor:pointer;">Leave ✕</button>
                </div>

                <div id="nx-vconf-tiles-grid" class="nx-vconf-grid peers-1"></div>

                <div style="padding:10px 12px; background:#0f172a; border-top:1px solid #1e293b; display:grid; grid-template-columns:repeat(5, 1fr); gap:8px; flex-shrink:0;">
                    <button type="button" id="nx-vc-mic-btn" class="nx-vconf-ctrl-btn" onclick="NexusLive.toggleMic()">
                        <span style="font-size:17px;">🎤</span><span>Mic ON</span>
                    </button>
                    <button type="button" id="nx-vc-cam-btn" class="nx-vconf-ctrl-btn" onclick="NexusLive.toggleCam()">
                        <span style="font-size:17px;">📹</span><span>Cam ON</span>
                    </button>
                    <button type="button" class="nx-vconf-ctrl-btn" onclick="NexusLive.flipCamera()">
                        <span style="font-size:17px;">🔄</span><span>Flip Cam</span>
                    </button>
                    <button type="button" id="nx-vc-scr-btn" class="nx-vconf-ctrl-btn" onclick="NexusLive.toggleScreenShareInRoom()">
                        <span style="font-size:17px;">🖥️</span><span>Screen</span>
                    </button>
                    <button type="button" class="nx-vconf-ctrl-btn" style="background:#ef4444; border-color:#ef4444; color:white;" onclick="NexusLive.leaveVideoConferenceRoom()">
                        <span style="font-size:17px;">📴</span><span>End Call</span>
                    </button>
                </div>
            `;
            ov.style.display = 'flex';

            let myU = me.username.toLowerCase().trim();
            mountOrUpdatePeerVideoTile(myU, me.name, localMediaStream, true);

            const roomRef = Nexus.db.collection("nexus_group_video_rooms").doc(roomId);
            const snap = await roomRef.get();
            let members = (snap.exists && Array.isArray(snap.data().members))
                ? snap.data().members.filter(m => m && (Date.now() - (m.joinedAt || 0) < 3600000) && m.username.toLowerCase() !== myU)
                : [];

            if (members.length >= 5) {
                Nexus.toast("⚠️ Room already has 5 active members!");
            }

            members.push({ username: myU, name: me.name, joinedAt: Date.now() });

            await roomRef.set({
                active: true,
                title: roomTitle || 'Live Video Room',
                hostUser: members[0].username,
                hostName: members[0].name,
                targetUser: targetUser || '',
                members: members.slice(-5),
                updatedAt: Date.now()
            }, { merge: true });

            // Send clickable Join Video Room invite card in chat if I am the first person starting it
            if (members.length === 1) {
                let inviteMsg = `📹VROOM|${roomId}|${me.username}|${roomTitle || 'Group Video Room'}`;
                if (isDm && window.NexusDM) {
                    const inp = document.getElementById('nx-dm-input');
                    if (inp) { inp.value = inviteMsg; NexusDM.sendDM(); }
                } else if (!isDm && window.NexusChat) {
                    const inp = document.getElementById('nx-chat-msg-in');
                    if (inp) { inp.value = inviteMsg; NexusChat.sendChatMessage(); }
                }
            }

            if (activeRoomUnsub) activeRoomUnsub();
            activeRoomUnsub = roomRef.onSnapshot(docSnap => {
                if (!docSnap.exists || !docSnap.data().active) {
                    NexusLive.leaveVideoConferenceRoom(true);
                    return;
                }
                let d = docSnap.data();
                let currentMembers = Array.isArray(d.members) ? d.members : [];
                let activeUsernames = new Set(currentMembers.map(m => m.username.toLowerCase()));

                // Remove tiles of members who left
                Object.keys(meshPeerConnections).forEach(pU => {
                    if (!activeUsernames.has(pU)) removePeerVideoTile(pU);
                });

                // Connect to all other members in the room (Up to 5 Friends Mesh!)
                currentMembers.forEach(m => {
                    let pU = m.username.toLowerCase();
                    if (pU !== myU) {
                        connectWebRtcMeshPeer(roomId, myU, pU, m.name);
                    }
                });
            });
        },

        dismissIncomingCall: function(roomId) {
            clearInterval(ringBeepInterval);
            const card = document.getElementById('nx-live-incoming-call-card');
            if (card) card.style.display = 'none';
            if (Nexus.db && roomId) {
                Nexus.db.collection("nexus_group_video_rooms").doc(roomId).set({ targetUser: '' }, { merge: true }).catch(() => {});
            }
        },

        toggleMic: function() {
            if (!localMediaStream) return;
            isMicMuted = !isMicMuted;
            localMediaStream.getAudioTracks().forEach(t => { t.enabled = !isMicMuted; });
            const btn = document.getElementById('nx-vc-mic-btn');
            if (btn) {
                btn.className = 'nx-vconf-ctrl-btn' + (isMicMuted ? ' active-danger' : '');
                btn.innerHTML = `<span style="font-size:17px;">${isMicMuted ? '🔇' : '🎤'}</span><span>${isMicMuted ? 'Muted' : 'Mic ON'}</span>`;
            }
        },

        toggleCam: function() {
            if (!localMediaStream) return;
            isCamOff = !isCamOff;
            localMediaStream.getVideoTracks().forEach(t => { t.enabled = !isCamOff; });
            const btn = document.getElementById('nx-vc-cam-btn');
            if (btn) {
                btn.className = 'nx-vconf-ctrl-btn' + (isCamOff ? ' active-danger' : '');
                btn.innerHTML = `<span style="font-size:17px;">${isCamOff ? '🚫' : '📹'}</span><span>${isCamOff ? 'Cam OFF' : 'Cam ON'}</span>`;
            }
        },

        flipCamera: async function() {
            if (!localMediaStream) return;
            currentCamFacing = currentCamFacing === 'user' ? 'environment' : 'user';
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: currentCamFacing },
                    audio: true
                });
                const newVidTrack = newStream.getVideoTracks()[0];
                Object.values(meshPeerConnections).forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                    if (sender && newVidTrack) sender.replaceTrack(newVidTrack);
                });
                localMediaStream.getTracks().forEach(t => t.stop());
                localMediaStream = newStream;
                let me = Nexus.getCurrentUser();
                if (me) {
                    let myVid = document.getElementById('nx-vvid-' + me.username.toLowerCase());
                    if (myVid) {
                        myVid.srcObject = newStream;
                        myVid.style.transform = currentCamFacing === 'user' ? 'scaleX(-1)' : 'none';
                    }
                }
                Nexus.toast(currentCamFacing === 'user' ? "🤳 Front Camera" : "📷 Back Camera");
            } catch (e) {
                Nexus.toast("⚠️ Could not switch camera");
            }
        },

        toggleScreenShareInRoom: async function() {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
                Nexus.toast("⚠️ Browser screen share not supported on this device");
                return;
            }
            try {
                const scrStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const scrTrack = scrStream.getVideoTracks()[0];
                isScreenSharing = true;
                Object.values(meshPeerConnections).forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
                    if (sender && scrTrack) sender.replaceTrack(scrTrack);
                });
                let me = Nexus.getCurrentUser();
                if (me) {
                    let myVid = document.getElementById('nx-vvid-' + me.username.toLowerCase());
                    if (myVid) { myVid.srcObject = scrStream; myVid.style.transform = 'none'; }
                }
                scrTrack.onended = () => {
                    isScreenSharing = false;
                    NexusLive.flipCamera();
                };
            } catch (e) {}
        },

        leaveVideoConferenceRoom: async function(skipFirestore) {
            clearInterval(ringBeepInterval);
            if (activeRoomUnsub) { activeRoomUnsub(); activeRoomUnsub = null; }
            Object.keys(meshPeerConnections).forEach(pU => removePeerVideoTile(pU));
            if (localMediaStream) {
                localMediaStream.getTracks().forEach(t => t.stop());
                localMediaStream = null;
            }
            const ov = document.getElementById('nx-video-conf-overlay');
            if (ov) ov.style.display = 'none';

            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            let rId = activeVideoRoomId;
            activeVideoRoomId = '';

            if (!skipFirestore && rId && me && Nexus.db) {
                const ref = Nexus.db.collection("nexus_group_video_rooms").doc(rId);
                const snap = await ref.get().catch(() => null);
                if (snap && snap.exists) {
                    let list = Array.isArray(snap.data().members) ? snap.data().members : [];
                    list = list.filter(m => m.username.toLowerCase() !== me.username.toLowerCase());
                    await ref.set({
                        active: list.length > 0,
                        members: list,
                        targetUser: list.length > 0 ? snap.data().targetUser : '',
                        updatedAt: Date.now()
                    }, { merge: true }).catch(() => {});
                }
            }
        },

        // 🎵 Open Unified Song DJ & YouTube Watch-Party Modal
        openMediaHubModal: function(isDm, defaultTab) {
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;
            let mode = defaultTab || 'yt';

            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid #38bdf8; background:#090d16; padding:15px; max-width:395px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <strong style="color:#f8fafc; font-size:15.5px;">🎵 Nexus DJ &amp; ▶️ YouTube Watch-Party</strong>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>

                    <div style="display:flex; gap:6px; margin-bottom:10px;">
                        <button type="button" id="nx-mhub-tab-yt" onclick="NexusLive.switchMediaHubTab(${Boolean(isDm)}, 'yt')" style="flex:1; padding:8px; border-radius:10px; border:none; background:${mode === 'yt' ? '#ef4444' : '#1e293b'}; color:white; font-weight:900; font-size:12px; cursor:pointer;">▶️ YouTube TV</button>
                        <button type="button" id="nx-mhub-tab-song" onclick="NexusLive.switchMediaHubTab(${Boolean(isDm)}, 'song')" style="flex:1; padding:8px; border-radius:10px; border:none; background:${mode === 'song' ? '#10b981' : '#1e293b'}; color:${mode === 'song' ? '#020617' : 'white'}; font-weight:900; font-size:12px; cursor:pointer;">🎵 Full Hindi Songs</button>
                    </div>

                    <div style="display:flex; gap:6px; margin-bottom:10px;">
                        <input type="text" id="nx-mhub-search-in" placeholder="Search any Hindi song, YouTube video or paste link..." onkeydown="if(event.key==='Enter') NexusLive.runMediaHubSearch(${Boolean(isDm)}, '${mode}')" style="flex:1; padding:9px 12px; border-radius:10px; border:1px solid #334155; background:#111827; color:white; font-size:12.5px; outline:none;">
                        <button type="button" onclick="NexusLive.runMediaHubSearch(${Boolean(isDm)}, '${mode}')" style="background:#38bdf8; color:#020617; border:none; padding:0 14px; border-radius:10px; font-weight:900; font-size:12px; cursor:pointer;">Search</button>
                    </div>

                    <div id="nx-mhub-results" style="display:flex; flex-direction:column; gap:7px; max-height:50vh; overflow-y:auto;"></div>
                </div>
            `;
            modal.style.display = 'flex';
            this.runMediaHubSearch(Boolean(isDm), mode, mode === 'song' ? 'Arijit Singh Hits' : 'Bollywood Hit Songs');
        },

        switchMediaHubTab: function(isDm, mode) {
            this.openMediaHubModal(isDm, mode);
        },

        runMediaHubSearch: async function(isDm, mode, fallbackQuery) {
            const inp = document.getElementById('nx-mhub-search-in');
            const box = document.getElementById('nx-mhub-results');
            if (!box) return;
            let q = (inp && inp.value.trim()) ? inp.value.trim() : (fallbackQuery || 'Arijit Singh');

            box.innerHTML = `<div style="text-align:center; padding:16px; color:#38bdf8; font-size:12.5px; font-weight:700;">⚡ Searching "${q}"...</div>`;
            let list = await searchSongsAndYouTubeMultiEngine(q, mode);

            box.innerHTML = list.map((item, idx) => {
                let encItem = btoa(unescape(encodeURIComponent(JSON.stringify(item))));
                return `
                    <div onclick="NexusLive.launchSyncedMedia('${encItem}', ${Boolean(isDm)})" style="display:flex; align-items:center; gap:10px; padding:8px; background:#161f33; border:1px solid #26334d; border-radius:12px; cursor:pointer;">
                        ${item.thumb ? `<img src="${item.thumb}" style="width:58px; height:44px; border-radius:8px; object-fit:cover; flex-shrink:0; background:#000;">` : `<div style="width:58px; height:44px; border-radius:8px; background:#10b981; display:flex; align-items:center; justify-content:center; font-size:20px;">🎵</div>`}
                        <div style="min-width:0; flex:1;">
                            <div style="font-weight:800; font-size:12px; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.title}</div>
                            <div style="font-size:10.5px; color:#93c5fd;">${item.channel}</div>
                        </div>
                        <span style="background:#10b981; color:#020617; padding:5px 10px; border-radius:8px; font-size:10.5px; font-weight:900; flex-shrink:0;">Play Sync ▶</span>
                    </div>
                `;
            }).join('');
        },

        launchSyncedMedia: async function(base64Item, isDm) {
            const modal = document.getElementById('nx-global-modal');
            if (modal) modal.style.display = 'none';

            let item = null;
            try { item = JSON.parse(decodeURIComponent(escape(atob(base64Item)))); } catch (e) { return; }
            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (!me || !Nexus.db || !item) return;

            let ctx = getActiveChatContext(isDm);
            activeWpRoomKey = '';
            await Nexus.db.collection("nexus_watch_party").doc(ctx.roomId).set({
                active: true,
                title: item.title || 'Live Media',
                url: item.url,
                thumb: item.thumb || '',
                mediaType: item.type || 'yt',
                startedBy: me.username,
                updatedAt: Date.now()
            });
            connectWatchPartySyncForActiveChat();
            Nexus.toast(`🎵 Playing "${item.title}" for everyone in chat!`);
        },

        toggleMinimizeWatchParty: function() {
            const stage = document.getElementById('nx-wp-player-stage');
            if (!stage) return;
            isWpMinimized = !isWpMinimized;
            stage.style.display = isWpMinimized ? 'none' : 'block';
        },

        stopWatchPartySync: function() {
            if (Nexus.db && activeWpRoomKey) {
                Nexus.db.collection("nexus_watch_party").doc(activeWpRoomKey).set({ active: false }, { merge: true }).catch(() => {});
            }
            const dock = document.getElementById('nx-live-media-dock');
            if (dock) { dock.style.display = 'none'; dock.innerHTML = ''; }
            lastSyncedMediaUrl = '';
        }
    };

    // =========================================================================
    // 4. HOOK EXISTING BUTTONS IN ADVANCE.JS, POWER.JS & SUPERCHAT.JS TO NEXUSLIVE
    // =========================================================================
    function bindLiveModuleHooks() {
        startGlobalIncomingVideoCallListener();
        connectWatchPartySyncForActiveChat();

        // Hook Video Call & Watch Party functions across advance.js, power.js, superchat.js
        if (window.NexusAdvance) {
            NexusAdvance.startVideoCall = function(isDm) {
                NexusLive.startOrJoinVideoRoom(isDm);
            };
            NexusAdvance.openInAppYouTubeTV = function(isDm) {
                NexusLive.openMediaHubModal(isDm, 'yt');
            };
        }
        if (window.NexusSuperChat) {
            NexusSuperChat.openGroupSongModal = function() {
                NexusLive.openMediaHubModal(false, 'song');
            };
        }
        if (window.NexusPower) {
            NexusPower.openSongSearchModal = function() {
                NexusLive.openMediaHubModal(true, 'song');
            };
            NexusPower.openWatchPartyModal = function() {
                NexusLive.openMediaHubModal(true, 'yt');
            };
        }

        // Transform `📹VROOM|roomId|hostUser|title` messages into clickable Join Group Video Room cards
        document.querySelectorAll('#nx-dm-msgs-box span, #nx-room-messages span').forEach(sp => {
            let txt = (sp.innerText || '').trim();
            if (txt.startsWith('📹VROOM|') && !sp.getAttribute('data-vroom-parsed')) {
                sp.setAttribute('data-vroom-parsed', '1');
                let parts = txt.split('|');
                let rId = parts[1] || '';
                let hostU = parts[2] || 'Member';
                let rTitle = parts[3] || 'Group Video Room';

                sp.innerHTML = `
                    <div onclick="event.stopPropagation(); NexusLive.joinVideoConferenceRoom('${rId}', '${rTitle.replace(/'/g, "\\'")}')" style="background:linear-gradient(135deg,#0f172a,#1e1b4b); border:1.5px solid #38bdf8; border-radius:14px; padding:11px 13px; margin:4px 0; min-width:220px; cursor:pointer; box-shadow:0 6px 18px rgba(56,189,248,0.22);">
                        <div style="display:flex; align-items:center; gap:9px; margin-bottom:8px;">
                            <span style="width:34px; height:34px; border-radius:50%; background:linear-gradient(135deg,#10b981,#2563eb); color:white; display:inline-flex; align-items:center; justify-content:center; font-size:17px;">📹</span>
                            <div>
                                <div style="font-size:12.5px; color:#38bdf8; font-weight:900;">Group Video Room (4-5 Friends)</div>
                                <div style="font-size:11px; color:#cbd5e1;">@${hostU.replace(/</g, '&lt;')} started live video chat</div>
                            </div>
                        </div>
                        <button type="button" style="width:100%; background:linear-gradient(135deg,#10b981,#059669); color:#020617; border:none; padding:8px 10px; border-radius:10px; font-weight:900; font-size:12px; cursor:pointer;">📹 Tap to Join Video Grid →</button>
                    </div>
                `;
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        bindLiveModuleHooks();
        setInterval(bindLiveModuleHooks, 1200);
    });
    setTimeout(bindLiveModuleHooks, 250);
})();
