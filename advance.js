// ================= ADVANCE.JS: ⋮ MENU VOICE & VIDEO CALL + 🔍 1-FINGER DRAG/PAN PHOTO ZOOM + ▶️ IN-APP YOUTUBE TV WITH UP-NEXT FEED + ⚡ GROUP FAST LOAD + 🛡️ ANTI-MISCLICK SWIPE + 🤝 PARTNER TEST SERIES PORTAL + 👑 100% NEXUS BRANDING =================

(function() {
    let activeGameUnsub = null;
    let currentSelectedTable = 1;
    let currentGameIsDm = false;
    let currentBaseGameId = 'game_group_lobby';

    // Nexus Official Voice & Video Call State
    let grpVoiceUnsub = null;
    let grpLocalStream = null;
    let grpPeerConnections = {};
    let isInGroupVoiceChat = false;
    let isGroupMicMuted = false;
    let activeVoiceRoomSlug = '';

    // Group Fast Windowed Messages Limit
    let groupVisibleLimit = 25;

    // Partner Collaboration URL
    let partnerTestSeriesUrl = localStorage.getItem('nx_partner_test_url') || '';

    const RTC_SERVERS = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" }
        ]
    };

    const advStyle = document.createElement('style');
    advStyle.innerHTML = `
        /* 1. Hide cluttered buttons from Group Header so everything stays cleanly inside ⋮ 3-Dots Menu */
        #nx-room-music-btn, #nx-grp-top-vcall-btn {
            display: none !important;
        }
        /* 2. Remove awkward bottom space in Group & DM chat boxes */
        #nx-room-messages, #nx-dm-msgs-box {
            padding-top: 8px !important;
            padding-bottom: 6px !important;
            justify-content: flex-start !important;
        }
        #nx-chat-room, #nx-dm-dedicated-root {
            height: 100dvh !important;
            max-height: 100dvh !important;
        }
        @keyframes nxShineGlow {
            0% { background-position: 0% 50%; box-shadow: 0 0 15px rgba(250, 204, 21, 0.45); }
            50% { background-position: 100% 50%; box-shadow: 0 0 28px rgba(16, 185, 129, 0.85); }
            100% { background-position: 0% 50%; box-shadow: 0 0 15px rgba(250, 204, 21, 0.45); }
        }
        @keyframes nxWinBoxPulse {
            0%, 100% { transform: scale(1); border-color: #fde047; background: rgba(250, 204, 21, 0.22); }
            50% { transform: scale(1.06); border-color: #10b981; background: rgba(16, 185, 129, 0.32); }
        }
        @keyframes nxDrawLaser {
            from { stroke-dashoffset: 400; }
            to { stroke-dashoffset: 0; }
        }
        @keyframes nxVoiceWave {
            0%, 100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7); }
            50% { box-shadow: 0 0 0 7px rgba(16, 185, 129, 0.18); }
        }
        .nx-shining-winner-board {
            background: linear-gradient(270deg, #064e3b, #1e1b4b, #713f12, #064e3b);
            background-size: 300% 300%;
            animation: nxShineGlow 2.4s infinite ease-in-out;
            border: 2px solid #fde047;
            border-radius: 16px;
            padding: 12px;
            margin-bottom: 10px;
            color: #fef08a;
            text-align: center;
        }
        .nx-turn-pill-my {
            background: rgba(16, 185, 129, 0.2);
            border: 1.5px solid #10b981;
            color: #5eead4;
            padding: 8px 10px;
            border-radius: 12px;
            font-size: 12.5px;
            font-weight: 900;
            margin-bottom: 10px;
        }
        .nx-turn-pill-wait {
            background: rgba(245, 158, 11, 0.16);
            border: 1.5px dashed #fbbf24;
            color: #fde68a;
            padding: 8px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 800;
            margin-bottom: 10px;
        }
        .nx-table-chip {
            flex: 1;
            padding: 6px 4px;
            border-radius: 9px;
            border: 1px solid #334155;
            background: #090d16;
            color: #94a3b8;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
        }
        .nx-table-chip.active {
            background: #38bdf8;
            color: #020617;
            border-color: #38bdf8;
        }
        .nx-game-invite-card {
            background: linear-gradient(135deg, #0f172a, #064e3b);
            border: 1.5px solid #10b981;
            border-radius: 14px;
            padding: 10px 12px;
            margin: 4px 0;
            min-width: 215px;
            text-align: left;
        }
        /* Nexus Official Premium Voice & Video Call Bar */
        .nx-official-voice-bar {
            display: none;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            padding: 8px 12px;
            background: linear-gradient(90deg, #0f172a, #1e1b4b, #064e3b);
            border-bottom: 1.5px solid #38bdf8;
            color: #f8fafc;
            font-size: 12px;
            flex-shrink: 0;
            z-index: 12;
        }
        .nx-official-call-card {
            background: linear-gradient(135deg, #0f172a, #1e1b4b);
            border: 1.5px solid #38bdf8;
            border-radius: 14px;
            padding: 10px 12px;
            margin: 4px 0;
            min-width: 215px;
            text-align: left;
            cursor: pointer;
            box-shadow: 0 4px 14px rgba(56, 189, 248, 0.2);
        }
        .nx-ttt-cell {
            aspect-ratio: 1/1;
            background: #1e293b;
            border: 1.5px solid #334155;
            border-radius: 12px;
            font-size: 28px;
            font-weight: 900;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            user-select: none;
            transition: all 0.15s ease;
        }
        .nx-ttt-cell.win-cell {
            animation: nxWinBoxPulse 1s infinite ease-in-out;
        }
        .nx-passlock-card {
            display: flex;
            align-items: center;
            gap: 8px;
            background: linear-gradient(135deg, rgba(245,158,11,0.18), rgba(15,23,42,0.9));
            border: 1.5px dashed #fbbf24;
            padding: 8px 12px;
            border-radius: 12px;
            color: #fde68a;
            font-weight: 800;
            font-size: 12.5px;
            cursor: pointer;
            margin: 3px 0;
        }
        /* In-App YouTube Watch-Party TV Feed Styles */
        .nx-yt-upnext-strip {
            display: flex;
            gap: 8px;
            overflow-x: auto;
            padding: 7px 10px;
            background: #090d16;
            border-top: 1px solid #1e293b;
            scrollbar-width: none;
        }
        .nx-yt-upnext-card {
            min-width: 145px;
            max-width: 145px;
            background: #111b21;
            border: 1px solid #2a3942;
            border-radius: 10px;
            padding: 5px;
            cursor: pointer;
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }
        .nx-yt-upnext-card:active {
            border-color: #ef4444;
            transform: scale(0.96);
        }
    `;
    document.head.appendChild(advStyle);

    // 1. SCRUB ANY "WHATSAPP" TEXT & REPLACE WITH "NEXUS OFFICIAL" ACROSS ENTIRE APP
    function enforceNexusOfficialBranding() {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while ((node = walker.nextNode())) {
            let v = node.nodeValue;
            if (v && /WhatsApp/i.test(v)) {
                // Keep "Share on WhatsApp" button label if it's an external share button, otherwise rebrand to Nexus!
                let parentEl = node.parentElement;
                let onclickAttr = parentEl ? (parentEl.getAttribute('onclick') || '') : '';
                if (!onclickAttr.includes('wa.me')) {
                    node.nodeValue = v.replace(/WhatsApp/gi, 'Nexus Official');
                }
            }
        }
    }

    // 2. UPGRADED PHOTO VIEWER WITH 1-FINGER DRAG/PAN (IDHAR-UDHAR SCROLL) + 2-FINGER PINCH ZOOM!
    function installDraggablePanZoomPhotoViewer() {
        if (!window.NexusPower || NexusPower.__nxPanZoomInstalled) return;
        NexusPower.__nxPanZoomInstalled = true;

        let scale = 1, panX = 0, panY = 0;
        let isDragging = false, startX = 0, startY = 0;
        let initialPinchDist = 0, initialPinchScale = 1;

        function updateImgTransform() {
            const imgEl = document.getElementById('nx-lightbox-img-el');
            if (!imgEl) return;
            if (scale <= 1) { panX = 0; panY = 0; }
            imgEl.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${scale})`;
        }

        NexusPower.openImageLightbox = function(imgSrc) {
            if (!imgSrc) return;
            let lb = document.getElementById('nx-pro-lightbox');
            if (!lb) {
                lb = document.createElement('div');
                lb.id = 'nx-pro-lightbox';
                lb.style.cssText = "position:fixed; inset:0; background:rgba(2,6,23,0.97); z-index:100095; display:none; flex-direction:column; justify-content:space-between; padding:14px; user-select:none; touch-action:none; overflow:hidden;";
                document.body.appendChild(lb);
            }

            scale = 1; panX = 0; panY = 0;

            lb.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; z-index:10; background:rgba(15,23,42,0.85); padding:8px 12px; border-radius:14px; border:1px solid #334155;">
                    <span style="color:#38bdf8; font-weight:900; font-size:13px;">\u{1F5BC}\uFE0F Nexus HD Photo Viewer</span>
                    <div style="display:flex; gap:7px;">
                        <button type="button" onclick="NexusPower.zoomLightbox(-0.5)" style="background:#1e293b; color:white; border:1px solid #334155; width:34px; height:34px; border-radius:50%; font-size:15px; font-weight:900; cursor:pointer;">\u2796</button>
                        <button type="button" onclick="NexusPower.zoomLightbox(0.5)" style="background:#1e293b; color:white; border:1px solid #334155; width:34px; height:34px; border-radius:50%; font-size:15px; font-weight:900; cursor:pointer;">\u2795</button>
                        <button type="button" onclick="NexusPower.zoomLightbox(-99)" style="background:#1e293b; color:#38bdf8; border:1px solid #334155; padding:0 9px; height:34px; border-radius:14px; font-size:11px; font-weight:800; cursor:pointer;">1x</button>
                        <button type="button" onclick="NexusPower.downloadImageDirectly('${imgSrc.replace(/'/g, "\\'")}')" style="background:#10b981; color:#020617; border:none; padding:0 12px; height:34px; border-radius:16px; font-size:12px; font-weight:900; cursor:pointer;">\u2B07\uFE0F Save</button>
                        <button type="button" onclick="document.getElementById('nx-pro-lightbox').style.display='none'" style="background:#ef4444; color:white; border:none; width:34px; height:34px; border-radius:50%; font-size:15px; font-weight:900; cursor:pointer;">\u2715</button>
                    </div>
                </div>
                <div id="nx-pan-stage" style="flex:1; display:flex; align-items:center; justify-content:center; overflow:hidden; position:relative; touch-action:none; cursor:grab;">
                    <img id="nx-lightbox-img-el" src="${imgSrc}" draggable="false" style="max-width:94vw; max-height:78dvh; object-fit:contain; border-radius:10px; transition:transform 0.05s linear; transform:translate3d(0px,0px,0) scale(1); transform-origin:center center;">
                </div>
                <div style="text-align:center; font-size:11px; color:#94a3b8; z-index:10;">\u{1F446} Zoom karke 1 ungli se photo ko charo taraf khiskayein (Drag/Pan) \u2022 2 ungli se Pinch-Zoom karein</div>
            `;
            lb.style.display = 'flex';

            const stage = document.getElementById('nx-pan-stage');
            if (!stage) return;

            stage.addEventListener('touchstart', e => {
                if (e.touches.length === 2) {
                    isDragging = false;
                    initialPinchDist = Math.hypot(
                        e.touches[0].clientX - e.touches[1].clientX,
                        e.touches[0].clientY - e.touches[1].clientY
                    );
                    initialPinchScale = scale;
                } else if (e.touches.length === 1) {
                    isDragging = true;
                    startX = e.touches[0].clientX - panX;
                    startY = e.touches[0].clientY - panY;
                }
            }, { passive: false });

            stage.addEventListener('touchmove', e => {
                e.preventDefault();
                if (e.touches.length === 2 && initialPinchDist > 0) {
                    let dist = Math.hypot(
                        e.touches[0].clientX - e.touches[1].clientX,
                        e.touches[0].clientY - e.touches[1].clientY
                    );
                    scale = Math.max(1, Math.min(5, initialPinchScale * (dist / initialPinchDist)));
                    updateImgTransform();
                } else if (e.touches.length === 1 && isDragging && scale > 1) {
                    panX = e.touches[0].clientX - startX;
                    panY = e.touches[0].clientY - startY;
                    updateImgTransform();
                }
            }, { passive: false });

            stage.addEventListener('touchend', () => { isDragging = false; });

            // Mouse drag support for PC/Keyboard
            stage.addEventListener('mousedown', e => {
                if (scale <= 1) return;
                isDragging = true;
                startX = e.clientX - panX;
                startY = e.clientY - panY;
            });
            window.addEventListener('mousemove', e => {
                if (!isDragging || scale <= 1) return;
                panX = e.clientX - startX;
                panY = e.clientY - startY;
                updateImgTransform();
            });
            window.addEventListener('mouseup', () => { isDragging = false; });

            let lastTap = 0;
            stage.addEventListener('click', e => {
                let now = Date.now();
                if (now - lastTap < 300) {
                    scale = scale > 1 ? 1 : 2.4;
                    panX = 0; panY = 0;
                    updateImgTransform();
                }
                lastTap = now;
            });
        };

        NexusPower.zoomLightbox = function(delta) {
            if (delta === -99) {
                scale = 1; panX = 0; panY = 0;
            } else {
                scale = Math.max(1, Math.min(5, scale + delta));
                if (scale === 1) { panX = 0; panY = 0; }
            }
            updateImgTransform();
        };
    }

    // 3. STRICT HORIZONTAL SWIPE-TO-REPLY GUARD (Fixes accidental reply when scrolling up/down!)
    function installStrictAntiMisclickSwipe() {
        ['nx-dm-msgs-box', 'nx-room-messages'].forEach(boxId => {
            const box = document.getElementById(boxId);
            if (!box || box.__nxStrictGuardInstalled) return;
            box.__nxStrictGuardInstalled = true;

            let startX = 0, startY = 0, currentDx = 0;
            let lockedDirection = null; // 'vertical' or 'horizontal'
            let targetBubble = null;
            const isGroup = (boxId === 'nx-room-messages');

            // Capture phase listener blocks accidental horizontal movement when user is scrolling vertically!
            box.addEventListener('touchstart', e => {
                if (!e.touches || e.touches.length !== 1) return;
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                currentDx = 0;
                lockedDirection = null;
                targetBubble = e.target.closest('[onclick*="openMsgActionMenu"], [onclick*="openCommunityMsgMenu"]');
            }, { capture: true, passive: true });

            box.addEventListener('touchmove', e => {
                if (!targetBubble || !e.touches || e.touches.length !== 1) return;
                let dx = e.touches[0].clientX - startX;
                let dy = Math.abs(e.touches[0].clientY - startY);

                if (!lockedDirection) {
                    if (dy > 10) {
                        lockedDirection = 'vertical';
                    } else if (Math.abs(dx) > 26 && Math.abs(dx) > dy * 2.6) {
                        lockedDirection = 'horizontal';
                    }
                }

                if (lockedDirection !== 'horizontal') {
                    // Stop power.js or old swipe listeners from moving the bubble during vertical scroll!
                    e.stopImmediatePropagation();
                    targetBubble.style.transform = '';
                    const ind1 = document.getElementById('nx-swipe-indicator');
                    const ind2 = document.getElementById('nx-grp-swipe-badge');
                    if (ind1) ind1.style.display = 'none';
                    if (ind2) ind2.style.display = 'none';
                    return;
                }

                e.stopImmediatePropagation();
                currentDx = Math.max(-68, Math.min(68, dx));
                targetBubble.style.transition = 'none';
                targetBubble.style.transform = `translateX(${currentDx}px)`;
            }, { capture: true, passive: true });

            const finishStrictSwipe = (e) => {
                if (!targetBubble) return;
                const b = targetBubble;
                targetBubble = null;
                b.style.transition = 'transform 0.2s ease';
                b.style.transform = '';
                const ind1 = document.getElementById('nx-swipe-indicator');
                const ind2 = document.getElementById('nx-grp-swipe-badge');
                if (ind1) ind1.style.display = 'none';
                if (ind2) ind2.style.display = 'none';

                if (lockedDirection === 'horizontal' && Math.abs(currentDx) >= 56) {
                    e.stopImmediatePropagation();
                    if (navigator.vibrate) { try { navigator.vibrate(18); } catch (err) {} }
                    let rawOnclick = b.getAttribute('onclick') || '';
                    let match = rawOnclick.match(/'([^']+)'/);
                    if (match && match[1]) {
                        if (isGroup && window.NexusChat) {
                            const sSpan = b.querySelector('span[onclick*="openPublicProfile"]');
                            let sName = sSpan ? sSpan.innerText.trim() : 'Member';
                            let clone = b.cloneNode(true);
                            if (clone.querySelector('div')) clone.querySelector('div').remove();
                            NexusChat.startReply(sName, (clone.innerText || 'Message').replace(/\n/g, ' ').trim().substring(0, 40));
                            Nexus.toast("↩️ Replying to " + sName);
                        } else if (!isGroup && window.NexusPower) {
                            NexusPower.execDmAction('reply', match[1]);
                            Nexus.toast("↩️ Replying to message");
                        }
                    }
                } else {
                    e.stopImmediatePropagation();
                }
                currentDx = 0;
                lockedDirection = null;
            };

            box.addEventListener('touchend', finishStrictSwipe, { capture: true, passive: true });
            box.addEventListener('touchcancel', finishStrictSwipe, { capture: true, passive: true });
        });
    }

    // 4. GROUP CHAT FAST WINDOWED RENDERING (Latest 25 Msgs + "⬆️ Load Older Messages" Button at Top!)
    function enforceFastWindowedGroupChat() {
        const msgBox = document.getElementById('nx-room-messages');
        if (!msgBox) return;
        let allRows = Array.from(msgBox.children).filter(el => el.id !== 'nx-load-older-grp-btn');
        if (allRows.length > groupVisibleLimit) {
            let hideCount = allRows.length - groupVisibleLimit;
            allRows.forEach((row, idx) => {
                row.style.display = idx < hideCount ? 'none' : 'flex';
            });

            let btn = document.getElementById('nx-load-older-grp-btn');
            if (!btn) {
                btn = document.createElement('button');
                btn.id = 'nx-load-older-grp-btn';
                btn.type = 'button';
                btn.style.cssText = "margin:2px auto 8px auto; background:#182229; border:1px solid #38bdf8; color:#38bdf8; padding:6px 14px; border-radius:16px; font-size:11.5px; font-weight:800; cursor:pointer; display:block;";
                btn.onclick = () => {
                    groupVisibleLimit += 30;
                    enforceFastWindowedGroupChat();
                };
                msgBox.insertBefore(btn, msgBox.firstChild);
            }
            btn.innerText = `⬆️ Load Older Messages (${hideCount} more)`;
        } else {
            let btn = document.getElementById('nx-load-older-grp-btn');
            if (btn) btn.remove();
            allRows.forEach(row => { row.style.display = 'flex'; });
        }
    }

    // 5. IN-APP YOUTUBE WATCH-PARTY TV (Search Right Inside Watch-Party + Continuous Up-Next Video Feed Below Player!)
    const YOUTUBE_CURATED_FEED = [
        { id: "jfKfPfyJRdk", title: "Lofi Hip Hop Radio - Beats to Relax/Study", channel: "Lofi Girl Live" },
        { id: "DWcJFNfaw9c", title: "Late Night Rain & Chill Study Lofi Mix", channel: "Chillhop Music" },
        { id: "5qap5aO4i9A", title: "Bollywood Hindi Sad Lofi Mashup 2026", channel: "Indie India Vibes" },
        { id: "4xDzrJKXOOY", title: "Synthwave Coding & Gaming Radio", channel: "Lofi Girl Synth" }
    ];

    function searchRealYouTubeVideos(query, cb) {
        let q = (query || 'Hindi Hit Songs').trim();
        // Try Piped YouTube API mirrors first for real YouTube Video IDs
        fetch(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(q)}&filter=videos`)
            .then(r => r.json())
            .then(data => {
                let items = (data && Array.isArray(data.items)) ? data.items : [];
                let vids = items.map(v => {
                    let m = (v.url || '').match(/v=([a-zA-Z0-9_-]{11})/);
                    return m ? {
                        id: m[1],
                        title: v.title || 'YouTube Video',
                        channel: v.uploaderName || 'YouTube',
                        thumb: v.thumbnail || `https://i.ytimg.com/vi/${m[1]}/mqdefault.jpg`,
                        embedUrl: `https://www.youtube.com/embed/${m[1]}?autoplay=1&playsinline=1`
                    } : null;
                }).filter(Boolean).slice(0, 10);
                if (!vids.length) throw new Error("Fallback");
                cb(vids);
            })
            .catch(() => {
                // Fallback: Apple Music/Video + Direct YouTube Embed Search
                fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&country=IN&media=musicVideo&limit=10`)
                    .then(r => r.json())
                    .then(data => {
                        let res = (data && data.results) ? data.results.filter(x => x.previewUrl) : [];
                        if (res.length > 0) {
                            cb(res.map(v => ({
                                id: String(v.trackId),
                                title: v.trackName || 'Music Video',
                                channel: v.artistName || 'Artist',
                                thumb: v.artworkUrl100 || '',
                                embedUrl: v.previewUrl,
                                isMp4: true
                            })));
                        } else {
                            cb(YOUTUBE_CURATED_FEED.map(v => ({
                                id: v.id,
                                title: v.title,
                                channel: v.channel,
                                thumb: `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`,
                                embedUrl: `https://www.youtube.com/embed/${v.id}?autoplay=1&playsinline=1`
                            })));
                        }
                    })
                    .catch(() => cb([]));
            });
    }

    // Upgrade the Live Watch-Party Bar (#nx-dm-watchparty-box & #nx-group-watchparty-box) so it has an In-Player Search Bar & Continuous Up-Next Feed right underneath!
    function upgradeWatchPartyBoxesWithLiveFeed() {
        ['nx-dm-watchparty-box', 'nx-group-watchparty-box'].forEach(boxId => {
            const wpBox = document.getElementById(boxId);
            if (!wpBox || wpBox.style.display === 'none') return;
            if (wpBox.querySelector('.nx-yt-inplayer-controls')) return;

            const isDm = (boxId === 'nx-dm-watchparty-box');
            const controls = document.createElement('div');
            controls.className = 'nx-yt-inplayer-controls';
            controls.innerHTML = `
                <div style="display:flex; align-items:center; gap:6px; padding:6px 10px; background:#0f172a; border-top:1px solid #1e293b;">
                    <span style="background:#ef4444; color:white; font-weight:900; font-size:10px; padding:3px 7px; border-radius:6px; display:inline-flex; align-items:center; gap:3px;">\u25B6 YouTube</span>
                    <input type="text" id="nx-yt-inline-q-${isDm ? 'dm' : 'grp'}" placeholder="Search next song/movie right here..." style="flex:1; background:#090d16; border:1px solid #334155; color:white; padding:5px 10px; border-radius:14px; font-size:11.5px; outline:none;">
                    <button type="button" onclick="NexusAdvance.searchInlineWatchParty(${isDm})" style="background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:12px; font-size:11px; font-weight:900; cursor:pointer;">Search</button>
                </div>
                <div class="nx-yt-upnext-strip" id="nx-yt-strip-${isDm ? 'dm' : 'grp'}"></div>
            `;
            wpBox.appendChild(controls);

            const inp = document.getElementById(`nx-yt-inline-q-${isDm ? 'dm' : 'grp'}`);
            if (inp) {
                inp.addEventListener('keydown', e => {
                    if (e.key === 'Enter') NexusAdvance.searchInlineWatchParty(isDm);
                });
            }
            NexusAdvance.renderInlineUpNextFeed(isDm, YOUTUBE_CURATED_FEED.map(v => ({
                title: v.title,
                channel: v.channel,
                thumb: `https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`,
                embedUrl: `https://www.youtube.com/embed/${v.id}?autoplay=1&playsinline=1`
            })));
        });
    }

    // 6. INJECT VOICE CALL, VIDEO CALL, YOUTUBE TV & FAST CHAT BOOST INSIDE BOTH ⋮ 3-DOTS MENUS!
    function upgradeBothThreeDotsMenus() {
        // A. Upgrade Group ⋮ Menu (NexusSuperChat.openGroupDotsMenu)
        if (window.NexusSuperChat && !NexusSuperChat.__nxDotsUpgradedV8) {
            NexusSuperChat.__nxDotsUpgradedV8 = true;
            NexusSuperChat.openGroupDotsMenu = function() {
                const modal = document.getElementById('nx-global-modal');
                let rTitle = document.getElementById('nx-room-title') ? document.getElementById('nx-room-title').innerText : 'Group';

                modal.innerHTML = `
                    <div class="nx-modal-box" style="border:1.5px solid #00a884; max-height:86dvh; overflow-y:auto;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                            <strong style="color:#f8fafc; font-size:15px;">\u2699\uFE0F ${rTitle} Pro Menu</strong>
                            <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:16px; cursor:pointer;">\u2715</button>
                        </div>
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            <button type="button" class="nx-menu-opt-btn" style="color:#10b981; border-color:rgba(16,185,129,0.45);" onclick="document.getElementById('nx-global-modal').style.display='none'; NexusAdvance.joinOrStartGroupVoiceChat();">
                                <span>\u{1F4DE}</span> <span>Nexus Group Voice Call (Live Audio)</span>
                            </button>
                            <button type="button" class="nx-menu-opt-btn" style="color:#38bdf8; border-color:rgba(56,189,248,0.45);" onclick="document.getElementById('nx-global-modal').style.display='none'; NexusAdvance.startVideoCall(false);">
                                <span>\u{1F4F9}</span> <span>Nexus Live Video Call (Camera)</span>
                            </button>
                            <button type="button" class="nx-menu-opt-btn" style="color:#f43f5e; border-color:rgba(244,63,94,0.45);" onclick="document.getElementById('nx-global-modal').style.display='none'; NexusAdvance.openInAppYouTubeTV(false);">
                                <span>\u25B6\uFE0F</span> <span>In-App YouTube Watch-Party TV</span>
                            </button>
                            <button type="button" class="nx-menu-opt-btn" style="color:#5eead4;" onclick="document.getElementById('nx-global-modal').style.display='none'; NexusSuperChat.openGroupSongModal();">
                                <span>\u{1F3B5}</span> <span>Group DJ (Listen Full Song Together)</span>
                            </button>
                            <button type="button" class="nx-menu-opt-btn" style="color:#fbbf24;" onclick="document.getElementById('nx-global-modal').style.display='none'; NexusSuperChat.openGroupPollModal();">
                                <span>\u{1F4CA}</span> <span>Create Live Group Poll</span>
                            </button>
                            <button type="button" class="nx-menu-opt-btn" style="color:#34d399;" onclick="document.getElementById('nx-global-modal').style.display='none'; NexusSuperChat.openLiveSketchpadModal(false);">
                                <span>\u{1F3A8}</span> <span>Open Formula Whiteboard / Sketch</span>
                            </button>
                            <button type="button" class="nx-menu-opt-btn" onclick="document.getElementById('nx-global-modal').style.display='none'; NexusSuperChat.pinGroupAnnouncementPrompt();">
                                <span>\u{1F4CC}</span> <span>Pin Notice to Group Top</span>
                            </button>
                            <button type="button" class="nx-menu-opt-btn" onclick="document.getElementById('nx-global-modal').style.display='none'; document.getElementById('nx-grp-search-bar').style.display='flex';">
                                <span>\u{1F50D}</span> <span>Search in Group Messages</span>
                            </button>
                            <button type="button" class="nx-menu-opt-btn" style="color:#fde047; border-color:rgba(253,224,71,0.35);" onclick="document.getElementById('nx-global-modal').style.display='none'; NexusAdvance.boostGroupChatSpeed();">
                                <span>\u26A1</span> <span>Fast Chat Mode (Load Latest 20 Only)</span>
                            </button>
                        </div>
                    </div>
                `;
                modal.style.display = 'flex';
            };
        }

        // B. Inject Video Call & In-App YouTube TV inside 1:1 DM ⋮ Menu (#nx-msg-action-modal)
        const dmModal = document.getElementById('nx-msg-action-modal');
        if (dmModal && dmModal.style.display === 'flex') {
            const callBtn = dmModal.querySelector('button[onclick*="NexusPower.startInternetCall"]');
            if (callBtn && !document.getElementById('nx-dm-dots-vidcall-btn')) {
                callBtn.innerHTML = `<span>\u{1F4DE}</span> <span>Nexus Official Voice Call (Ring \u{1F514})</span>`;
                const vidBtn = document.createElement('button');
                vidBtn.type = 'button';
                vidBtn.id = 'nx-dm-dots-vidcall-btn';
                vidBtn.className = 'nx-menu-opt-btn';
                vidBtn.style.cssText = "color:#38bdf8; border-color:rgba(56,189,248,0.45);";
                vidBtn.onclick = () => {
                    dmModal.style.display = 'none';
                    NexusAdvance.startVideoCall(true);
                };
                vidBtn.innerHTML = `<span>\u{1F4F9}</span> <span>Nexus Live Video Call (Face-to-Face)</span>`;
                callBtn.parentNode.insertBefore(vidBtn, callBtn.nextSibling);
            }

            const wpBtn = dmModal.querySelector('button[onclick*="NexusPower.openWatchPartyModal"]');
            if (wpBtn && !wpBtn.getAttribute('data-yt-tv-upgraded')) {
                wpBtn.setAttribute('data-yt-tv-upgraded', '1');
                wpBtn.style.color = '#f43f5e';
                wpBtn.innerHTML = `<span>\u25B6\uFE0F</span> <span>In-App YouTube Watch-Party TV</span>`;
                wpBtn.onclick = () => {
                    dmModal.style.display = 'none';
                    NexusAdvance.openInAppYouTubeTV(true);
                };
            }
        }
    }

    // 7. PARTNER TEST SERIES COLLABORATION PORTAL (In Community Directory & Full-Screen In-App Modal!)
    function injectPartnerTestSeriesCollabBanner() {
        if (window.Nexus && Nexus.db && !window.__nxPartnerConfigLoaded) {
            window.__nxPartnerConfigLoaded = true;
            Nexus.db.collection("nexus_config").doc("partner_collab").onSnapshot(doc => {
                if (doc.exists && doc.data().url) {
                    partnerTestSeriesUrl = doc.data().url;
                    localStorage.setItem('nx_partner_test_url', partnerTestSeriesUrl);
                }
            });
        }

        const dir = document.getElementById('nx-chat-directory');
        if (dir && !document.getElementById('nx-partner-test-banner')) {
            const banner = document.createElement('div');
            banner.id = 'nx-partner-test-banner';
            banner.style.cssText = "margin-bottom:12px;";
            banner.innerHTML = `
                <div onclick="NexusAdvance.openPartnerTestPortal()" style="background:linear-gradient(135deg, rgba(56,189,248,0.18), rgba(16,185,129,0.18)); border:1.5px solid #38bdf8; border-radius:16px; padding:11px 14px; display:flex; align-items:center; justify-content:space-between; cursor:pointer;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width:40px; height:40px; border-radius:12px; background:#38bdf8; color:#020617; display:flex; align-items:center; justify-content:center; font-size:19px; font-weight:900;">\u{1F4DD}</div>
                        <div>
                            <div style="font-weight:800; font-size:13.5px; color:#f8fafc;">Live JEE &amp; Student Test Series</div>
                            <div style="font-size:11px; color:#93c5fd;">Daily Live Mock Tests \u2022 Partner Collaboration Hub</div>
                        </div>
                    </div>
                    <span style="background:#38bdf8; color:#020617; padding:5px 10px; border-radius:12px; font-size:11px; font-weight:900;">Start Test \u2192</span>
                </div>
            `;
            dir.insertBefore(banner, dir.firstChild);
        }
    }

    // 8. NEXUS OFFICIAL GROUP VOICE CALL BAR
    function getGroupSlug() {
        const t = document.getElementById('nx-room-title');
        return (t ? t.innerText : 'casual_chat').toLowerCase().replace(/[^a-z0-9]/g, '_');
    }

    function ensureGroupVoiceChatBar() {
        const roomEl = document.getElementById('nx-chat-room');
        const msgBox = document.getElementById('nx-room-messages');
        if (!roomEl || !msgBox) return;

        if (!document.getElementById('nx-grp-wa-voice-bar')) {
            const vBar = document.createElement('div');
            vBar.id = 'nx-grp-wa-voice-bar';
            vBar.className = 'nx-official-voice-bar';
            msgBox.parentNode.insertBefore(vBar, msgBox);
        }

        if (!document.getElementById('nx-grp-remote-audios')) {
            const audBox = document.createElement('div');
            audBox.id = 'nx-grp-remote-audios';
            audBox.style.display = 'none';
            document.body.appendChild(audBox);
        }

        if (roomEl.style.display !== 'none' && Nexus.db) {
            let slug = getGroupSlug();
            if (slug !== activeVoiceRoomSlug) {
                activeVoiceRoomSlug = slug;
                listenToGroupVoiceChatRoom(slug);
            }
        }
    }

    function listenToGroupVoiceChatRoom(slug) {
        if (grpVoiceUnsub) grpVoiceUnsub();
        if (!Nexus.db) return;

        grpVoiceUnsub = Nexus.db.collection("nexus_group_voice").doc("vc_" + slug).onSnapshot(doc => {
            const vBar = document.getElementById('nx-grp-wa-voice-bar');
            if (!vBar) return;

            let d = doc.exists ? doc.data() : {};
            let members = Array.isArray(d.members) ? d.members.filter(m => m && (Date.now() - (m.joinedAt || 0) < 3600000)) : [];

            if (!d.active || members.length === 0) {
                vBar.style.display = 'none';
                if (isInGroupVoiceChat) leaveGroupVoiceInternal(false);
                return;
            }

            let me = Nexus.getCurrentUser();
            let myU = me ? me.username.toLowerCase() : '';
            let amIJoined = members.some(m => m.username.toLowerCase() === myU);

            vBar.style.display = 'flex';
            let namesList = members.map(m => '@' + m.username).join(', ');

            vBar.innerHTML = `
                <div style="display:flex; align-items:center; gap:9px; min-width:0; flex:1;">
                    <div style="width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg,#10b981,#2563eb); color:white; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:900; animation:nxVoiceWave 1.4s infinite; flex-shrink:0;">N</div>
                    <div style="min-width:0; flex:1;">
                        <div style="font-weight:900; font-size:12.5px; color:#38bdf8;">Nexus Official Voice Call (${members.length} Live)</div>
                        <div style="font-size:10.5px; color:#cbd5e1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Connected: ${namesList}</div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                    ${amIJoined ? `
                        <button type="button" onclick="NexusAdvance.toggleGroupVoiceMute()" style="background:#1e293b; color:white; border:1px solid #334155; padding:5px 9px; border-radius:10px; font-size:11px; font-weight:800; cursor:pointer;">${isGroupMicMuted ? '\u{1F507} Muted' : '\u{1F3A4} Mic ON'}</button>
                        <button type="button" onclick="NexusAdvance.leaveGroupVoiceChat()" style="background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:10px; font-size:11px; font-weight:900; cursor:pointer;">\u{1F4F4} Leave</button>
                    ` : `
                        <button type="button" onclick="NexusAdvance.joinOrStartGroupVoiceChat()" style="background:#10b981; color:#020617; border:none; padding:6px 12px; border-radius:10px; font-size:11.5px; font-weight:900; cursor:pointer;">\u{1F4DE} Join Nexus Call</button>
                    `}
                </div>
            `;

            if (isInGroupVoiceChat && grpLocalStream && me) {
                syncGroupWebRtcPeers(slug, members, myU);
            }
        });
    }

    function syncGroupWebRtcPeers(slug, members, myU) {
        members.forEach(m => {
            let peerU = m.username.toLowerCase();
            if (peerU === myU) return;
            let pairKey = [myU, peerU].sort().join('__');
            let sigDocId = `grp_rtc_${slug}_${pairKey}`;

            if (!grpPeerConnections[peerU]) {
                const pc = new RTCPeerConnection(RTC_SERVERS);
                grpPeerConnections[peerU] = pc;
                grpLocalStream.getTracks().forEach(t => pc.addTrack(t, grpLocalStream));

                pc.ontrack = ev => {
                    let audBox = document.getElementById('nx-grp-remote-audios');
                    if (!audBox) return;
                    let audEl = document.getElementById('nx-grp-aud-' + peerU);
                    if (!audEl) {
                        audEl = document.createElement('audio');
                        audEl.id = 'nx-grp-aud-' + peerU;
                        audEl.autoplay = true;
                        audEl.playsInline = true;
                        audBox.appendChild(audEl);
                    }
                    if (ev.streams && ev.streams[0]) {
                        audEl.srcObject = ev.streams[0];
                        audEl.play().catch(() => {});
                    }
                };

                let isInitiator = myU < peerU;
                if (isInitiator) {
                    pc.createOffer().then(offer => {
                        pc.setLocalDescription(offer);
                        Nexus.db.collection("nexus_voice_calls").doc(sigDocId).set({
                            offer: { type: offer.type, sdp: offer.sdp },
                            from: myU,
                            updatedAt: Date.now()
                        }, { merge: true });
                    });
                }

                Nexus.db.collection("nexus_voice_calls").doc(sigDocId).onSnapshot(async snap => {
                    if (!snap.exists) return;
                    let data = snap.data();
                    if (!isInitiator && data.offer && !pc.currentRemoteDescription) {
                        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                        const ans = await pc.createAnswer();
                        await pc.setLocalDescription(ans);
                        Nexus.db.collection("nexus_voice_calls").doc(sigDocId).set({
                            answer: { type: ans.type, sdp: ans.sdp }
                        }, { merge: true });
                    } else if (isInitiator && data.answer && !pc.currentRemoteDescription) {
                        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                    }
                });
            }
        });
    }

    function leaveGroupVoiceInternal(updateFirestore) {
        isInGroupVoiceChat = false;
        isGroupMicMuted = false;
        if (grpLocalStream) {
            grpLocalStream.getTracks().forEach(t => t.stop());
            grpLocalStream = null;
        }
        Object.values(grpPeerConnections).forEach(pc => {
            try { pc.close(); } catch (e) {}
        });
        grpPeerConnections = {};
        const audBox = document.getElementById('nx-grp-remote-audios');
        if (audBox) audBox.innerHTML = '';

        let me = Nexus.getCurrentUser();
        let slug = getGroupSlug();
        if (updateFirestore && me && Nexus.db) {
            const docRef = Nexus.db.collection("nexus_group_voice").doc("vc_" + slug);
            docRef.get().then(doc => {
                if (!doc.exists) return;
                let list = Array.isArray(doc.data().members) ? doc.data().members : [];
                list = list.filter(x => x.username.toLowerCase() !== me.username.toLowerCase());
                docRef.set({
                    active: list.length > 0,
                    members: list,
                    updatedAt: Date.now()
                }, { merge: true });
            });
        }
    }

    function parseSpecialAdvanceMessages() {
        document.querySelectorAll('#nx-dm-msgs-box span, #nx-room-messages span').forEach(sp => {
            let txt = sp.innerText || '';
            if (txt.startsWith('📞VCALL|') && !sp.getAttribute('data-vc-parsed')) {
                sp.setAttribute('data-vc-parsed', '1');
                let hostUser = txt.split('|')[1] || 'Member';

                const vcCard = document.createElement('div');
                vcCard.className = 'nx-official-call-card';
                vcCard.onclick = (e) => {
                    e.stopPropagation();
                    NexusAdvance.joinOrStartGroupVoiceChat();
                };
                vcCard.innerHTML = `
                    <div style="display:flex; align-items:center; gap:9px; margin-bottom:7px;">
                        <span style="width:30px; height:30px; border-radius:50%; background:linear-gradient(135deg,#10b981,#2563eb); color:white; display:inline-flex; align-items:center; justify-content:center; font-weight:900;">N</span>
                        <div>
                            <div style="font-size:12.5px; color:#38bdf8; font-weight:900;">Nexus Official Voice Call</div>
                            <div style="font-size:11px; color:#cbd5e1;">@${hostUser.replace(/</g, '&lt;')} started a live Nexus voice room</div>
                        </div>
                    </div>
                    <button type="button" style="width:100%; background:linear-gradient(135deg,#10b981,#059669); color:#020617; border:none; padding:8px 10px; border-radius:9px; font-weight:900; font-size:12px; cursor:pointer;">\u{1F4DE} Tap to Join Nexus Call \u2192</button>
                `;
                sp.innerHTML = '';
                sp.appendChild(vcCard);
            } else if (txt.startsWith('🔑PASSLOCK|') && !sp.getAttribute('data-lock-parsed')) {
                sp.setAttribute('data-lock-parsed', '1');
                let parts = txt.split('|');
                let passHint = parts[1] || 'Secret';
                let encPass = parts[2] || '';
                let encMsg = parts.slice(3).join('|');

                const card = document.createElement('div');
                card.className = 'nx-passlock-card';
                card.onclick = (e) => {
                    e.stopPropagation();
                    NexusAdvance.unlockPasswordMessage(encPass, encMsg);
                };
                card.innerHTML = `<span>\u{1F511}</span><span><b>Password-Locked Secret</b> (Hint: ${passHint.replace(/</g, '&lt;')}) \u2022 Tap to Unlock</span>`;
                sp.innerHTML = '';
                sp.appendChild(card);
            } else if (txt.startsWith('🎮GAME|') && !sp.getAttribute('data-game-parsed')) {
                sp.setAttribute('data-game-parsed', '1');
                let parts = txt.split('|');
                let tableNum = Number(parts[1]) || 1;
                let hostUser = parts[2] || 'Player';
                let isDmFlag = parts[3] === '1';

                const gCard = document.createElement('div');
                gCard.className = 'nx-game-invite-card';
                gCard.onclick = (e) => {
                    e.stopPropagation();
                    NexusAdvance.openLiveGameModal(isDmFlag, tableNum);
                };
                gCard.innerHTML = `
                    <div style="font-size:11px; color:#fde047; font-weight:900; text-transform:uppercase; margin-bottom:3px;">\u2694\uFE0F Nexus 2-Player Game Challenge</div>
                    <div style="font-size:13.5px; color:#f8fafc; font-weight:800; margin-bottom:8px;">@${hostUser.replace(/</g, '&lt;')} is waiting on <b>Table #${tableNum}</b>!</div>
                    <button type="button" style="width:100%; background:#10b981; color:#020617; border:none; padding:8px 12px; border-radius:10px; font-weight:900; font-size:12.5px; cursor:pointer;">\u{1F3AE} Accept &amp; Join Table #${tableNum} \u2192</button>
                `;
                sp.innerHTML = '';
                sp.appendChild(gCard);
            }
        });
    }

    // 9. PUBLIC API FOR ALL ADVANCE FEATURES
    window.NexusAdvance = {
        boostGroupChatSpeed: function() {
            groupVisibleLimit = 20;
            enforceFastWindowedGroupChat();
            Nexus.toast("\u26A1 Fast Chat Mode Active! Showing latest 20 messages.");
        },

        // 🤝 PARTNER TEST SERIES COLLABORATION PORTAL
        openPartnerTestPortal: function() {
            let me = Nexus.getCurrentUser();
            let myU = me ? me.username.toLowerCase() : '';
            let isAdmin = (myU === 'mohit' || myU === 'kumar' || myU === 'mohit_01');

            if (!partnerTestSeriesUrl) {
                if (isAdmin) {
                    let enteredUrl = prompt("👑 Founder Admin: Apne dost ki Test Series website ka pura link (https://...) dalein:");
                    if (enteredUrl && enteredUrl.trim().startsWith('http')) {
                        partnerTestSeriesUrl = enteredUrl.trim();
                        localStorage.setItem('nx_partner_test_url', partnerTestSeriesUrl);
                        if (Nexus.db) {
                            Nexus.db.collection("nexus_config").doc("partner_collab").set({ url: partnerTestSeriesUrl }, { merge: true });
                        }
                    } else return;
                } else {
                    Nexus.toast("📝 Partner Test Series link is being updated by Admin!");
                    return;
                }
            }

            let portal = document.getElementById('nx-partner-collab-portal');
            if (!portal) {
                portal = document.createElement('div');
                portal.id = 'nx-partner-collab-portal';
                portal.style.cssText = "position:fixed; inset:0; background:#090d16; z-index:100098; display:flex; flex-direction:column;";
                document.body.appendChild(portal);
            }

            portal.innerHTML = `
                <div style="height:50px; background:#0f172a; border-bottom:1.5px solid #38bdf8; display:flex; align-items:center; justify-content:space-between; padding:0 12px; flex-shrink:0;">
                    <button type="button" onclick="document.getElementById('nx-partner-collab-portal').style.display='none'" style="background:#1e293b; border:1px solid #334155; color:#f8fafc; padding:6px 12px; border-radius:10px; font-size:12px; font-weight:900; cursor:pointer;">\u2190 Back to Nexus Chat</button>
                    <span style="font-size:12.5px; font-weight:900; color:#38bdf8;">\u{1F4DD} Nexus \u00D7 Partner Test Series</span>
                    ${isAdmin ? `<button type="button" onclick="NexusAdvance.changePartnerUrl()" style="background:none; border:none; color:#fbbf24; font-size:11px; font-weight:800; cursor:pointer;">Edit Link \u270F\uFE0F</button>` : `<span></span>`}
                </div>
                <iframe src="${partnerTestSeriesUrl}" style="flex:1; width:100%; border:none; background:#090d16;" allow="fullscreen; clipboard-write"></iframe>
            `;
            portal.style.display = 'flex';
        },

        changePartnerUrl: function() {
            let u = prompt("Enter Partner Test Series Website URL (https://...):", partnerTestSeriesUrl);
            if (u && u.trim().startsWith('http')) {
                partnerTestSeriesUrl = u.trim();
                localStorage.setItem('nx_partner_test_url', partnerTestSeriesUrl);
                if (Nexus.db) {
                    Nexus.db.collection("nexus_config").doc("partner_collab").set({ url: partnerTestSeriesUrl }, { merge: true });
                }
                this.openPartnerTestPortal();
            }
        },

        // ▶️ IN-APP YOUTUBE WATCH-PARTY TV MODAL (With YouTube Logo, Live Search & Instant Sync!)
        openInAppYouTubeTV: function(isDm) {
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;

            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid #ef4444; background:#0b141a; padding:14px; max-width:380px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <div style="display:flex; align-items:center; gap:7px;">
                            <span style="background:#ef4444; color:white; padding:4px 9px; border-radius:8px; font-weight:900; font-size:12px;">\u25B6 YouTube</span>
                            <strong style="color:#f8fafc; font-size:15px;">Nexus Watch-Party TV</strong>
                        </div>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">\u2715</button>
                    </div>
                    <p style="font-size:11px; color:#cbd5e1; margin-bottom:8px;">Bina YouTube app mein gaye yahin se koi bhi Song, Movie ya Video search karein—dono ke phone mein ek sath chalega!</p>
                    <div style="display:flex; gap:6px; margin-bottom:10px;">
                        <input type="text" id="nx-yt-tv-search-in" placeholder="Search YouTube song, movie, lecture or paste link..." style="flex:1; padding:9px 12px; border-radius:10px; border:1px solid #334155; background:#090d16; color:white; font-size:12.5px; outline:none;">
                        <button type="button" onclick="NexusAdvance.execYouTubeTvSearch(${Boolean(isDm)})" style="background:#ef4444; color:white; border:none; padding:0 14px; border-radius:10px; font-weight:900; font-size:12px; cursor:pointer;">Search</button>
                    </div>
                    <div id="nx-yt-tv-results" style="display:flex; flex-direction:column; gap:7px; max-height:52vh; overflow-y:auto;"></div>
                </div>
            `;
            modal.style.display = 'flex';

            const inp = document.getElementById('nx-yt-tv-search-in');
            if (inp) {
                inp.focus();
                inp.addEventListener('keydown', e => {
                    if (e.key === 'Enter') NexusAdvance.execYouTubeTvSearch(Boolean(isDm));
                });
            }
            this.execYouTubeTvSearch(Boolean(isDm), 'Hindi Hit Songs');
        },

        execYouTubeTvSearch: function(isDm, defQuery) {
            const inp = document.getElementById('nx-yt-tv-search-in');
            const box = document.getElementById('nx-yt-tv-results');
            if (!box) return;
            let rawVal = (inp && inp.value.trim()) ? inp.value.trim() : (defQuery || 'Hindi Hit Songs');

            // If user pasted a direct YouTube link, play immediately!
            if (rawVal.includes('youtube.com/') || rawVal.includes('youtu.be/')) {
                this.launchSyncedYouTubeVideo(isDm, rawVal);
                return;
            }

            box.innerHTML = `<div style="text-align:center; padding:16px; color:#f87171; font-size:12px;">\u25B6 Searching YouTube for "${rawVal}"...</div>`;
            searchRealYouTubeVideos(rawVal, list => {
                if (!list.length) {
                    box.innerHTML = `<div style="text-align:center; padding:14px; color:#64748b; font-size:12px;">No videos found. Try another keyword!</div>`;
                    return;
                }
                box.innerHTML = list.map(v => `
                    <div onclick="NexusAdvance.launchSyncedYouTubeVideo(${Boolean(isDm)}, '${v.embedUrl}')" style="display:flex; align-items:center; gap:10px; padding:7px; background:#182229; border:1px solid #2a3942; border-radius:12px; cursor:pointer;">
                        <img src="${v.thumb}" style="width:68px; height:44px; border-radius:7px; object-fit:cover; flex-shrink:0; background:#000;">
                        <div style="min-width:0; flex:1;">
                            <div style="font-weight:800; font-size:12px; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${v.title}</div>
                            <div style="font-size:10.5px; color:#94a3b8;">\u25B6 ${v.channel}</div>
                        </div>
                        <span style="background:#ef4444; color:white; padding:5px 9px; border-radius:8px; font-size:10.5px; font-weight:900; flex-shrink:0;">Play</span>
                    </div>
                `).join('');
            });
        },

        launchSyncedYouTubeVideo: function(isDm, embedOrRawUrl) {
            const modal = document.getElementById('nx-global-modal');
            if (modal) modal.style.display = 'none';
            if (isDm && window.NexusPower) {
                NexusPower.launchWatchParty(embedOrRawUrl);
            } else if (!isDm && window.NexusSuperChat) {
                NexusSuperChat.startGroupWatchParty(embedOrRawUrl);
            }
            setTimeout(upgradeWatchPartyBoxesWithLiveFeed, 350);
        },

        searchInlineWatchParty: function(isDm) {
            const inp = document.getElementById(`nx-yt-inline-q-${isDm ? 'dm' : 'grp'}`);
            if (!inp || !inp.value.trim()) return;
            let q = inp.value.trim();
            const strip = document.getElementById(`nx-yt-strip-${isDm ? 'dm' : 'grp'}`);
            if (strip) strip.innerHTML = `<div style="color:#f87171; font-size:11px; padding:6px;">\u25B6 Loading "${q}" videos...</div>`;
            searchRealYouTubeVideos(q, list => {
                this.renderInlineUpNextFeed(isDm, list);
            });
        },

        renderInlineUpNextFeed: function(isDm, list) {
            const strip = document.getElementById(`nx-yt-strip-${isDm ? 'dm' : 'grp'}`);
            if (!strip || !Array.isArray(list)) return;
            strip.innerHTML = list.map(v => `
                <div class="nx-yt-upnext-card" onclick="NexusAdvance.launchSyncedYouTubeVideo(${Boolean(isDm)}, '${v.embedUrl}')">
                    <img src="${v.thumb}" style="width:100%; height:56px; object-fit:cover; border-radius:6px; background:#000;">
                    <div style="font-size:10.5px; font-weight:800; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${v.title}</div>
                    <div style="font-size:9.5px; color:#10b981; font-weight:700;">\u25B6 Tap to Switch Now</div>
                </div>
            `).join('');
        },

        // 📹 NEXUS OFFICIAL LIVE VIDEO CALL (Camera Switch + Mic Toggle)
        startVideoCall: async function() {
            let me = Nexus.getCurrentUser();
            if (!me) return;
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;

            let localVidStream = null;
            try {
                localVidStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            } catch (e) {
                Nexus.toast("Please allow Camera & Microphone permission for Nexus Video Call!");
                return;
            }

            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid #38bdf8; text-align:center; background:#090d16; padding:14px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <div style="display:flex; align-items:center; gap:7px;">
                            <span style="width:24px; height:24px; border-radius:6px; background:linear-gradient(135deg,#10b981,#2563eb); color:white; display:inline-flex; align-items:center; justify-content:center; font-weight:900; font-size:12px;">N</span>
                            <strong style="color:#38bdf8; font-size:15.5px;">Nexus Official Video Call</strong>
                        </div>
                        <button type="button" onclick="if(window.__nxLocalVidStream){window.__nxLocalVidStream.getTracks().forEach(t=>t.stop());}document.getElementById('nx-global-modal').style.display='none';" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">\u2715</button>
                    </div>
                    <div style="position:relative; background:#000; border-radius:16px; overflow:hidden; aspect-ratio:3/4; max-height:58dvh; margin:0 auto 12px; border:1.5px solid #1e293b;">
                        <video id="nx-local-video-preview" autoplay playsinline muted style="width:100%; height:100%; object-fit:cover; transform:scaleX(-1);"></video>
                        <div style="position:absolute; bottom:10px; left:10px; background:rgba(15,23,42,0.8); border:1px solid #38bdf8; color:white; padding:4px 10px; border-radius:10px; font-size:11px; font-weight:800;">\u{1F7E2} ${me.name} (@${me.username})</div>
                    </div>
                    <button type="button" onclick="if(window.__nxLocalVidStream){window.__nxLocalVidStream.getTracks().forEach(t=>t.stop());}document.getElementById('nx-global-modal').style.display='none';" style="width:100%; background:#ef4444; color:white; border:none; padding:12px; border-radius:12px; font-weight:900; font-size:14px; cursor:pointer;">\u{1F4F4} End Nexus Video Call</button>
                </div>
            `;
            modal.style.display = 'flex';
            window.__nxLocalVidStream = localVidStream;
            const vidEl = document.getElementById('nx-local-video-preview');
            if (vidEl) vidEl.srcObject = localVidStream;
        },

        joinOrStartGroupVoiceChat: async function() {
            let me = Nexus.getCurrentUser();
            if (!me || !Nexus.db) return;

            try {
                grpLocalStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (e) {
                Nexus.toast("Please allow Microphone permission for Nexus Voice Call!");
                return;
            }

            isInGroupVoiceChat = true;
            isGroupMicMuted = false;
            let slug = getGroupSlug();
            const docRef = Nexus.db.collection("nexus_group_voice").doc("vc_" + slug);

            const snap = await docRef.get();
            let existing = (snap.exists && Array.isArray(snap.data().members)) ? snap.data().members : [];
            let wasEmpty = existing.length === 0;

            existing = existing.filter(x => x.username.toLowerCase() !== me.username.toLowerCase());
            existing.push({ username: me.username, name: me.name, joinedAt: Date.now() });

            await docRef.set({
                active: true,
                members: existing,
                updatedAt: Date.now()
            }, { merge: true });

            if (wasEmpty && window.NexusChat) {
                const inp = document.getElementById('nx-chat-msg-in');
                if (inp) {
                    inp.value = `📞VCALL|${me.username}`;
                    NexusChat.sendChatMessage();
                }
            }
            Nexus.toast("\u{1F4DE} Connected to Nexus Official Voice Call!");
        },

        toggleGroupVoiceMute: function() {
            if (!grpLocalStream) return;
            isGroupMicMuted = !isGroupMicMuted;
            grpLocalStream.getAudioTracks().forEach(t => { t.enabled = !isGroupMicMuted; });
            listenToGroupVoiceChatRoom(getGroupSlug());
            Nexus.toast(isGroupMicMuted ? "Microphone Muted" : "Microphone Unmuted");
        },

        leaveGroupVoiceChat: function() {
            leaveGroupVoiceInternal(true);
            Nexus.toast("\u{1F4F4} Left Nexus Voice Call");
        }
    };

    function runAdvanceLoop() {
        enforceNexusOfficialBranding();
        installDraggablePanZoomPhotoViewer();
        installStrictAntiMisclickSwipe();
        enforceFastWindowedGroupChat();
        upgradeWatchPartyBoxesWithLiveFeed();
        upgradeBothThreeDotsMenus();
        injectPartnerTestSeriesCollabBanner();
        ensureGroupVoiceChatBar();
        parseSpecialAdvanceMessages();
    }

    document.addEventListener('DOMContentLoaded', () => {
        runAdvanceLoop();
        setInterval(runAdvanceLoop, 700);
    });
    setTimeout(runAdvanceLoop, 250);
})();
