// ================= FINAL SUPERCHAT.JS: AUTO UTF-8 EMOJI REPAIR ENGINE + OFFICIAL PWA APP INSTALLER (NO .HTML FILE) + CLEAN GROUP & DM HUB =================

(function() {
    let groupWatchPartyUnsub = null;
    let groupMusicSyncUnsub = null;
    let lastObservedGroupRoom = '';
    let grpMediaRecorder = null;
    let grpAudioChunks = [];
    let isGrpRecording = false;
    let grpRecStart = 0;
    let grpRecTimer = null;
    let currentGrpSongUrl = '';
    let sketchColor = '#10b981';
    let currentGroupRoomId = 'casual_chat';
    let globalDeferredPrompt = null;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        globalDeferredPrompt = e;
    });

    // 1. AUTOMATIC UTF-8 MOJIBAKE REPAIR ENGINE (Fixes all "ðŸ...", "â...", "ï¼‹" symbols across the entire app!)
    const WIN1252_MAP = {
        0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85, 0x2020: 0x86,
        0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A, 0x2039: 0x8B, 0x0152: 0x8C,
        0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92, 0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95,
        0x2013: 0x96, 0x2014: 0x97, 0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B,
        0x0153: 0x9C, 0x017E: 0x9E, 0x0178: 0x9F
    };

    function decodeMojibakeString(str) {
        if (!str || !/(?:ðŸ|â[†‹œž•⏳]|ï¼|Ã)/.test(str)) return str;
        try {
            let bytes = [];
            for (let i = 0; i < str.length; i++) {
                let code = str.charCodeAt(i);
                if (code <= 0xFF) {
                    bytes.push(code);
                } else if (WIN1252_MAP[code] !== undefined) {
                    bytes.push(WIN1252_MAP[code]);
                } else {
                    return str;
                }
            }
            return new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));
        } catch (e) {
            return str;
        }
    }

    function repairBrokenEmojisInDOM(rootNode) {
        const target = rootNode || document.body;
        if (!target) return;

        const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, null, false);
        let node;
        while ((node = walker.nextNode())) {
            let val = node.nodeValue;
            if (val && /(?:ðŸ|â|ï¼)/.test(val)) {
                let fixed = decodeMojibakeString(val);
                if (fixed !== val) node.nodeValue = fixed;
            }
        }

        target.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
            let ph = el.getAttribute('placeholder');
            if (ph && /(?:ðŸ|â|ï¼)/.test(ph)) {
                el.setAttribute('placeholder', decodeMojibakeString(ph));
            }
        });
    }

    // 2. INJECT REAL PWA MANIFEST SO CHROME/ANDROID INSTALLS REAL OFFICIAL NEXUS APP (NOT app.html!)
    function setupRealOfficialPwaManifest() {
        if (document.getElementById('nx-real-pwa-manifest')) return;
        const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="115" fill="#090d16"/><circle cx="256" cy="256" r="200" fill="none" stroke="#10b981" stroke-width="24"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#38bdf8" font-family="sans-serif" font-weight="900" font-size="250">N</text></svg>`;
        const iconUrl = 'data:image/svg+xml;base64,' + btoa(iconSvg);

        const manifestObj = {
            name: "Nexus Official App",
            short_name: "Nexus",
            description: "Nexus Official Student & Creator Community App",
            start_url: window.location.origin + window.location.pathname,
            display: "standalone",
            background_color: "#090d16",
            theme_color: "#0f172a",
            orientation: "portrait",
            icons: [
                { src: iconUrl, sizes: "192x192", type: "image/svg+xml", purpose: "any maskable" },
                { src: iconUrl, sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" }
            ]
        };

        const link = document.createElement('link');
        link.id = 'nx-real-pwa-manifest';
        link.rel = 'manifest';
        link.href = 'data:application/manifest+json;charset=utf-8,' + encodeURIComponent(JSON.stringify(manifestObj));
        document.head.appendChild(link);
    }

    const superStyle = document.createElement('style');
    superStyle.innerHTML = `
        #nx-global-modal {
            z-index: 100085 !important;
        }
        #nx-cmsg-action-modal, #nx-msg-action-modal {
            z-index: 100080 !important;
        }
        #nx-img-lightbox {
            display: none !important;
        }
        .nx-jumbo-emoji-text {
            font-size: 38px !important;
            line-height: 1.15 !important;
            display: inline-block;
            padding: 4px 2px;
        }
        .nx-floating-react-pill, .nx-floating-react-pill span,
        .nx-group-react-pill, .nx-group-react-pill span {
            font-size: 11.5px !important;
            line-height: 1.2 !important;
            padding: 0 !important;
        }
        .nx-floating-react-pill {
            padding: 2.5px 8px !important;
        }
        #nx-dm-msgs-box span[onclick*="Reacted by:"] {
            display: none !important;
        }
        .nx-mood-note-bubble {
            position: absolute;
            top: 2px;
            left: 50%;
            transform: translateX(-50%);
            background: #1e293b;
            border: 1px solid #38bdf8;
            color: #f8fafc;
            font-size: 9.5px;
            font-weight: 800;
            padding: 2px 7px;
            border-radius: 10px;
            white-space: nowrap;
            max-width: 74px;
            overflow: hidden;
            text-overflow: ellipsis;
            z-index: 25;
            box-shadow: 0 3px 8px rgba(0,0,0,0.65);
        }
        .nx-plus-emoji-btn {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: #202c33;
            border: 1px dashed #00a884;
            color: #00a884;
            font-size: 16px;
            font-weight: 900;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .nx-voice-speed-chip {
            background: #00a884;
            color: #020617;
            border: none;
            padding: 3px 7px;
            border-radius: 8px;
            font-size: 10.5px;
            font-weight: 900;
            cursor: pointer;
            flex-shrink: 0;
        }
        .nx-whisper-card {
            display: flex;
            align-items: center;
            gap: 8px;
            background: linear-gradient(135deg, rgba(16,185,129,0.16), rgba(37,99,235,0.16));
            border: 1px dashed #10b981;
            padding: 8px 12px;
            border-radius: 12px;
            color: #5eead4;
            font-weight: 800;
            font-size: 12.5px;
            margin: 3px 0;
            cursor: pointer;
        }
        .nx-code-block-card {
            background: #050811;
            border: 1px solid #334155;
            border-left: 3.5px solid #38bdf8;
            border-radius: 10px;
            padding: 8px 10px;
            margin: 4px 0;
            font-family: monospace;
            font-size: 12px;
            color: #e2e8f0;
            overflow-x: auto;
            white-space: pre-wrap;
            word-break: break-word;
        }
        .nx-grp-poll-card {
            background: #0f172a;
            border: 1px solid #38bdf8;
            border-radius: 12px;
            padding: 10px 12px;
            margin: 4px 0;
            min-width: 215px;
        }
    `;
    document.head.appendChild(superStyle);

    function extractYtEmbed(rawUrl) {
        if (!rawUrl) return '';
        let s = rawUrl.trim();
        let m = s.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        if (m && m[1]) return `https://www.youtube.com/embed/${m[1]}?autoplay=1&playsinline=1`;
        return s;
    }

    function getActiveGroupSlug() {
        const t = document.getElementById('nx-room-title');
        return (t ? t.innerText : 'group').toLowerCase().replace(/[^a-z0-9]/g, '_');
    }

    // 3. FIX 1:1 DM BOTTOM ＋ BUTTON & REPLACE installPWA SO IT NEVER DOWNLOADS app.html!
    function repairDmBottomPlusAndOfficialApp() {
        // Override installPWA so it installs the Real Official App instead of downloading app.html
        if (window.NexusPower) {
            NexusPower.installPWA = function() {
                if (globalDeferredPrompt) {
                    globalDeferredPrompt.prompt();
                    globalDeferredPrompt.userChoice.then(() => { globalDeferredPrompt = null; });
                    return;
                }
                const modal = document.getElementById('nx-global-modal');
                if (!modal) return;
                let hostUrl = window.location.href.replace(/^https?:\/\//, '');
                let chromeIntent = `intent://${hostUrl}#Intent;scheme=https;package=com.android.chrome;end`;

                modal.innerHTML = `
                    <div class="nx-modal-box" style="border:2px solid #10b981; text-align:center; background:#0f172a;">
                        <div style="width:58px; height:58px; border-radius:16px; background:linear-gradient(135deg,#10b981,#2563eb); color:white; font-size:28px; font-weight:900; display:flex; align-items:center; justify-content:center; margin:0 auto 10px;">N</div>
                        <h3 style="color:#f8fafc; font-size:17px; margin-bottom:6px;">Install Official Nexus App</h3>
                        <p style="font-size:12.5px; color:#cbd5e1; line-height:1.5; margin-bottom:14px;">
                            Apne phone ki Home Screen par <b>Official Nexus App</b> install karne ke liye niche button dabayein (ya Chrome ke <b>&#8942;</b> menu mein <b>"Install App / Add to Home Screen"</b> chunein):
                        </p>
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            <a href="${chromeIntent}" style="display:block; background:#10b981; color:#020617; text-decoration:none; padding:12px; border-radius:12px; font-weight:900; font-size:13.5px;">&#128242; Open in Chrome &amp; Install Official App</a>
                            <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:#1e293b; color:#94a3b8; border:1px solid #334155; padding:10px; border-radius:12px; font-weight:800; cursor:pointer;">Close</button>
                        </div>
                    </div>
                `;
                modal.style.display = 'flex';
            };
        }

        const root = document.getElementById('nx-dm-dedicated-root');
        if (!root || root.style.display === 'none') return;

        const dmTray = document.getElementById('nx-dm-bottom-tray');
        if (dmTray) {
            dmTray.querySelectorAll('button').forEach(b => {
                if (b.id !== 'nx-dm-plus-hub-btn') b.style.display = 'flex';
            });

            if (!document.getElementById('nx-dm-sketch-btn')) {
                const skBtn = document.createElement('button');
                skBtn.type = 'button';
                skBtn.id = 'nx-dm-sketch-btn';
                skBtn.onclick = () => {
                    if (window.NexusPower) NexusPower.toggleBottomTray(false);
                    NexusSuperChat.openLiveSketchpadModal(true);
                };
                skBtn.style.cssText = "background:#202c33; border:1px solid #2a3942; border-radius:14px; padding:10px 6px; color:#34d399; display:flex; flex-direction:column; align-items:center; gap:5px; cursor:pointer; grid-column:1/-1;";
                skBtn.innerHTML = `<span style="font-size:14px; font-weight:800;">\u{1F3A8} Live Formula &amp; Sketch Whiteboard</span>`;
                dmTray.appendChild(skBtn);
            }
        }

        const fileIn = document.getElementById('nx-dm-file-in');
        if (!fileIn || !fileIn.parentNode) return;

        const realCamBtn = fileIn.nextElementSibling;
        if (realCamBtn && realCamBtn.tagName === 'BUTTON' && realCamBtn.id !== 'nx-dm-plus-hub-btn') {
            realCamBtn.style.display = 'none';
        }

        let plusBtn = document.getElementById('nx-dm-plus-hub-btn');
        if (!plusBtn) {
            plusBtn = document.createElement('button');
            plusBtn.type = 'button';
            plusBtn.id = 'nx-dm-plus-hub-btn';
            plusBtn.innerText = '+';
            plusBtn.onclick = (e) => {
                e.stopPropagation();
                if (window.NexusPower) NexusPower.toggleBottomTray();
            };
        }
        plusBtn.style.cssText = "width:30px; height:30px; border-radius:50%; background:rgba(0,168,132,0.18); border:1.5px solid #00a884; color:#00a884; font-size:20px; font-weight:900; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; transition:transform 0.2s ease;";

        if (plusBtn.parentNode !== fileIn.parentNode) {
            fileIn.parentNode.insertBefore(plusBtn, fileIn);
        }
    }

    // 4. 4G/LOW-NETWORK TURBO SONG STREAM ENGINE
    function fetchLowDataFastSongs(query, callback) {
        const pickFastStreamUrl = (dlArr) => {
            if (!Array.isArray(dlArr) || dlArr.length === 0) return '';
            let mid = dlArr[2] || dlArr[1] || dlArr[0] || dlArr[dlArr.length - 1];
            return mid.url || mid.link || '';
        };

        fetch(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}&limit=10`)
            .then(r => r.json())
            .then(res => {
                let results = (res && res.data && Array.isArray(res.data.results)) ? res.data.results : [];
                if (!results.length) throw new Error("Fallback1");
                let parsed = results.map(s => {
                    let bestAudio = pickFastStreamUrl(s.downloadUrl);
                    let imgArr = Array.isArray(s.image) ? s.image : [];
                    let cover = imgArr.length > 0 ? (imgArr[1] ? imgArr[1].url : imgArr[0].url) : '';
                    let rawTitle = (s.name || 'Song').replace(/&quot;/g, '"');
                    let rawArtist = (s.artists && s.artists.primary && s.artists.primary[0]) ? s.artists.primary[0].name : 'Artist';
                    return {
                        rawTitle: rawTitle,
                        rawArtist: rawArtist,
                        safeTitle: rawTitle.replace(/'/g, "\\'").replace(/"/g, "&quot;"),
                        safeArtist: rawArtist.replace(/'/g, "\\'").replace(/"/g, "&quot;"),
                        audioUrl: bestAudio,
                        cover: cover
                    };
                }).filter(x => x.audioUrl);
                callback(parsed);
            })
            .catch(() => {
                fetch(`https://jiosaavn-api-privatecvc2.vercel.app/search/songs?query=${encodeURIComponent(query)}&limit=10`)
                    .then(r => r.json())
                    .then(res => {
                        let list = (res && res.data && res.data.results) ? res.data.results : [];
                        if (!list.length) throw new Error("Fallback2");
                        let parsed = list.map(s => {
                            let audioUrl = pickFastStreamUrl(s.downloadUrl);
                            let cover = (s.image && s.image.length) ? s.image[s.image.length - 1].link : '';
                            let rawTitle = (s.name || 'Song').replace(/&quot;/g, '"');
                            let rawArtist = s.primaryArtists || 'Artist';
                            return {
                                rawTitle: rawTitle,
                                rawArtist: rawArtist,
                                safeTitle: rawTitle.replace(/'/g, "\\'").replace(/"/g, "&quot;"),
                                safeArtist: rawArtist.replace(/'/g, "\\'").replace(/"/g, "&quot;"),
                                audioUrl: audioUrl,
                                cover: cover
                            };
                        }).filter(x => x.audioUrl);
                        callback(parsed);
                    })
                    .catch(() => {
                        fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=10`)
                            .then(r => r.json())
                            .then(data => {
                                let list = (data && data.results) ? data.results.filter(x => x.previewUrl) : [];
                                let parsed = list.map(s => ({
                                    rawTitle: s.trackName || 'Song',
                                    rawArtist: s.artistName || 'Artist',
                                    safeTitle: (s.trackName || 'Song').replace(/'/g, "\\'").replace(/"/g, "&quot;"),
                                    safeArtist: (s.artistName || 'Artist').replace(/'/g, "\\'").replace(/"/g, "&quot;"),
                                    audioUrl: s.previewUrl,
                                    cover: s.artworkUrl100 || ''
                                }));
                                callback(parsed);
                            })
                            .catch(() => callback([]));
                    });
            });
    }

    function patchPowerSongEngine() {
        if (window.NexusPower && !NexusPower.__nxTurboSongPatched) {
            NexusPower.__nxTurboSongPatched = true;
            NexusPower.searchSongsNow = function(defaultQuery) {
                const inp = document.getElementById('nx-live-song-q');
                const box = document.getElementById('nx-song-results-list');
                if (!box) return;
                let q = (inp && inp.value.trim()) ? inp.value.trim() : (defaultQuery || 'Arijit Singh');
                box.innerHTML = `<div style="text-align:center; padding:16px; color:#38bdf8; font-size:12.5px;">Searching Fast-Stream Songs for "${q}"...</div>`;
                fetchLowDataFastSongs(q, list => {
                    if (!list.length) {
                        box.innerHTML = `<div style="text-align:center; padding:16px; color:#64748b; font-size:12px;">No songs found. Try another name!</div>`;
                        return;
                    }
                    box.innerHTML = list.map(s => `
                        <div onclick="NexusPower.playSongInRoom('${s.safeTitle}', '${s.safeArtist}', '${s.audioUrl}', '${s.cover}')" style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:8px 10px; background:#202c33; border:1px solid #2a3942; border-radius:12px; cursor:pointer;">
                            <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
                                <img src="${s.cover}" style="width:38px; height:38px; border-radius:8px; object-fit:cover; flex-shrink:0;">
                                <div style="min-width:0; flex:1;">
                                    <div style="font-weight:800; font-size:12.5px; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.rawTitle}</div>
                                    <div style="font-size:11px; color:#10b981; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\u26A1 Fast 4G Stream \u2022 ${s.rawArtist}</div>
                                </div>
                            </div>
                            <span style="background:#00a884; color:#020617; padding:5px 10px; border-radius:10px; font-size:11px; font-weight:900; flex-shrink:0;">\u25B6 Play</span>
                        </div>
                    `).join('');
                });
            };
        }
    }

    // 5. PERSONAL CLOUD VAULT IN DM INBOX + VIP QR ID CARD IN PROFILE
    function upgradeDmInboxAndProfileQR() {
        if (window.NexusDM && !NexusDM.__nxVaultPatched) {
            NexusDM.__nxVaultPatched = true;
            const origInbox = NexusDM.openInboxModal.bind(NexusDM);
            NexusDM.openInboxModal = function() {
                origInbox();
                let me = Nexus.getCurrentUser();
                const modal = document.getElementById('nx-global-modal');
                if (!me || !modal || document.getElementById('nx-personal-vault-row')) return;
                const listContainer = modal.querySelector('.nx-modal-box > div:last-child');
                if (!listContainer) return;

                const vaultRow = document.createElement('div');
                vaultRow.id = 'nx-personal-vault-row';
                vaultRow.onclick = () => NexusDM.openDirectChat(me.username, 'Saved Messages (Personal Vault)', me.dp || '');
                vaultRow.style.cssText = "display:flex; align-items:center; justify-content:space-between; padding:11px 12px; background:linear-gradient(135deg, rgba(16,185,129,0.22), rgba(15,23,42,0.95)); border:1.5px solid #10b981; border-radius:14px; cursor:pointer; margin-bottom:4px;";
                vaultRow.innerHTML = `
                    <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
                        <div style="width:44px; height:44px; border-radius:50%; background:#10b981; color:#020617; display:flex; align-items:center; justify-content:center; font-size:20px; font-weight:900; flex-shrink:0;">\u{1F516}</div>
                        <div style="min-width:0; flex:1;">
                            <div style="font-weight:800; font-size:14px; color:#5eead4;">Saved Messages (My Cloud)</div>
                            <div style="font-size:11.5px; color:#cbd5e1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Save private notes, formulas, PDFs &amp; photos here</div>
                        </div>
                    </div>
                    <span style="background:#10b981; color:#020617; padding:4px 9px; border-radius:10px; font-size:11px; font-weight:900;">Vault \u2192</span>
                `;
                listContainer.insertBefore(vaultRow, listContainer.firstChild);
            };
        }

        const whoBtn = document.getElementById('nx-who-viewed-btn');
        if (whoBtn && whoBtn.parentNode && !document.getElementById('nx-vip-qr-btn')) {
            const qrBtn = document.createElement('button');
            qrBtn.type = 'button';
            qrBtn.id = 'nx-vip-qr-btn';
            qrBtn.onclick = () => NexusSuperChat.openMyVipQrCard();
            qrBtn.style.cssText = "grid-column:1/-1; background:linear-gradient(135deg,#1e293b,#0f172a); border:1px solid #38bdf8; border-radius:11px; padding:8px 12px; color:#38bdf8; font-weight:800; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:space-between; margin-top:2px;";
            qrBtn.innerHTML = `<span>\u{1FAAA} My VIP QR ID Card &amp; Direct Chat Link</span><span>Share \u2197</span>`;
            whoBtn.parentNode.appendChild(qrBtn);
        }
    }

    function checkDirectDmUrlLink() {
        let params = new URLSearchParams(window.location.search);
        let dmTarget = params.get('dm');
        if (dmTarget && window.NexusDM && Nexus.getCurrentUser()) {
            window.history.replaceState({}, document.title, window.location.pathname);
            setTimeout(() => {
                NexusDM.openDirectChat(dmTarget.trim().toLowerCase(), dmTarget.trim(), '');
            }, 650);
        }
    }

    function ensureTopHeaderAppButton() {
        const headerActions = document.querySelector('.nx-header-actions');
        if (headerActions && !document.getElementById('nx-header-pwa-btn')) {
            const hBtn = document.createElement('button');
            hBtn.id = 'nx-header-pwa-btn';
            hBtn.type = 'button';
            hBtn.className = 'nx-icon-btn';
            hBtn.onclick = () => {
                if (window.NexusPower && NexusPower.installPWA) NexusPower.installPWA();
            };
            hBtn.style.cssText = "background:rgba(16,185,129,0.16); border:1px solid #10b981; color:#10b981; padding:5px 10px; border-radius:14px; font-size:11.5px; font-weight:900; display:flex; align-items:center; gap:4px; cursor:pointer;";
            hBtn.innerHTML = `<span>\u{1F4F2}</span><span>App</span>`;
            headerActions.insertBefore(hBtn, headerActions.firstChild);
        }
    }

    function appendPlusEmojiPicker(barEl, msgId, isDm) {
        if (!barEl || barEl.querySelector('.nx-plus-emoji-btn')) return;
        const plusBtn = document.createElement('button');
        plusBtn.type = 'button';
        plusBtn.className = 'nx-plus-emoji-btn';
        plusBtn.title = 'React with any emoji from keyboard';
        plusBtn.innerText = '+';
        plusBtn.onclick = (e) => {
            e.stopPropagation();
            let box = document.getElementById('nx-any-emoji-box');
            if (box) {
                box.style.display = box.style.display === 'none' ? 'flex' : 'none';
                const inp = document.getElementById('nx-any-emoji-in');
                if (inp) inp.focus();
                return;
            }
            box = document.createElement('div');
            box.id = 'nx-any-emoji-box';
            box.style.cssText = "display:flex; align-items:center; gap:6px; margin-bottom:10px; background:#111b21; padding:6px 10px; border-radius:16px; border:1px solid #00a884;";
            box.innerHTML = `
                <input type="text" id="nx-any-emoji-in" placeholder="\u{1F60A} Keyboard se koi bhi emoji dalein..." style="flex:1; background:transparent; border:none; color:white; font-size:15px; outline:none;">
                <button type="button" id="nx-any-emoji-send" style="background:#00a884; color:#020617; border:none; padding:5px 12px; border-radius:12px; font-weight:900; font-size:12px; cursor:pointer;">React \u2713</button>
            `;
            barEl.parentNode.insertBefore(box, barEl.nextSibling);

            const inp = document.getElementById('nx-any-emoji-in');
            const sendBtn = document.getElementById('nx-any-emoji-send');
            const submitCustomEmoji = () => {
                let val = (inp.value || '').trim();
                if (!val) return;
                let cleanEmoji = Array.from(val).slice(0, 2).join('');
                if (isDm && window.NexusPower) {
                    NexusPower.reactDmMsg(msgId, cleanEmoji);
                } else if (!isDm && window.NexusChat) {
                    NexusChat.reactToMsg(msgId, cleanEmoji);
                }
            };
            sendBtn.onclick = submitCustomEmoji;
            inp.addEventListener('keydown', ev => {
                if (ev.key === 'Enter') {
                    ev.preventDefault();
                    submitCustomEmoji();
                }
            });
            inp.focus();
        };
        barEl.appendChild(plusBtn);
    }

    // 6. UPGRADE COMMUNITY GROUP ROOM
    function upgradeCommunityGroupRoom() {
        const roomEl = document.getElementById('nx-chat-room');
        if (!roomEl) return;

        if (!document.getElementById('nx-grp-doc-file-in')) {
            const fIn = document.createElement('input');
            fIn.type = 'file';
            fIn.id = 'nx-grp-doc-file-in';
            fIn.accept = '.pdf,.txt,.html,.css,.js,.py,.json,.zip,image/*';
            fIn.style.display = 'none';
            fIn.onchange = e => {
                if (e.target.files && e.target.files[0]) {
                    sendGroupDocumentFile(e.target.files[0]);
                    e.target.value = '';
                }
            };
            document.body.appendChild(fIn);
        }

        const musicBtn = document.getElementById('nx-room-music-btn');
        if (musicBtn && !document.getElementById('nx-grp-dots-btn')) {
            musicBtn.style.display = 'none';
            const dotsBtn = document.createElement('button');
            dotsBtn.type = 'button';
            dotsBtn.id = 'nx-grp-dots-btn';
            dotsBtn.onclick = (e) => {
                e.stopPropagation();
                NexusSuperChat.openGroupDotsMenu();
            };
            dotsBtn.style.cssText = "background:#2a3942; border:none; color:#e9edef; width:36px; height:36px; border-radius:50%; cursor:pointer; font-size:19px; font-weight:900; display:flex; align-items:center; justify-content:center; flex-shrink:0;";
            dotsBtn.innerHTML = '&#8942;';
            musicBtn.parentNode.insertBefore(dotsBtn, musicBtn);
        }

        const msgBox = document.getElementById('nx-room-messages');
        if (msgBox && !document.getElementById('nx-grp-pinned-bar')) {
            const pBar = document.createElement('div');
            pBar.id = 'nx-grp-pinned-bar';
            pBar.className = 'nx-dm-pinned-bar';
            msgBox.parentNode.insertBefore(pBar, msgBox);
        }

        if (msgBox && !document.getElementById('nx-grp-mini-song-bar')) {
            const sBar = document.createElement('div');
            sBar.id = 'nx-grp-mini-song-bar';
            sBar.className = 'nx-mini-song-bar';
            msgBox.parentNode.insertBefore(sBar, msgBox);
        }

        if (msgBox && !document.getElementById('nx-group-watchparty-box')) {
            const gWpBox = document.createElement('div');
            gWpBox.id = 'nx-group-watchparty-box';
            gWpBox.style.cssText = "display:none; background:#000; border-bottom:1px solid #2a3942; flex-shrink:0;";
            msgBox.parentNode.insertBefore(gWpBox, msgBox);
        }

        if (msgBox && !document.getElementById('nx-grp-search-bar')) {
            const srch = document.createElement('div');
            srch.id = 'nx-grp-search-bar';
            srch.style.cssText = "display:none; padding:8px 12px; background:#182229; border-bottom:1px solid #2a3942; align-items:center; gap:8px; flex-shrink:0;";
            srch.innerHTML = `
                <input type="text" id="nx-grp-search-in" placeholder="\u{1F50D} Search in group chat..." oninput="NexusSuperChat.filterGroupMessages(this.value)" style="flex:1; padding:7px 12px; border-radius:16px; border:1px solid #334155; background:#0b141a; color:white; font-size:12.5px; outline:none;">
                <button type="button" onclick="document.getElementById('nx-grp-search-bar').style.display='none'; NexusSuperChat.filterGroupMessages('');" style="background:none; border:none; color:#ef4444; font-weight:bold; cursor:pointer;">\u2715</button>
            `;
            msgBox.parentNode.insertBefore(srch, msgBox);
        }

        if (!document.getElementById('nx-grp-bottom-tray')) {
            const tray = document.createElement('div');
            tray.id = 'nx-grp-bottom-tray';
            tray.style.cssText = "display:none; grid-template-columns:repeat(3, 1fr); gap:10px; padding:14px; background:#182229; border-top:1.5px solid #00a884; box-shadow:0 -10px 25px rgba(0,0,0,0.6); z-index:20; flex-shrink:0;";
            tray.innerHTML = `
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); document.getElementById('nx-chat-photo-in').click();" style="background:#202c33; border:1px solid #2a3942; border-radius:14px; padding:10px 6px; color:#f8fafc; display:flex; flex-direction:column; align-items:center; gap:5px; cursor:pointer;">
                    <span style="font-size:22px;">\u{1F4F7}</span><span style="font-size:11px; font-weight:800;">Photo</span>
                </button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); document.getElementById('nx-grp-doc-file-in').click();" style="background:#202c33; border:1px solid #2a3942; border-radius:14px; padding:10px 6px; color:#38bdf8; display:flex; flex-direction:column; align-items:center; gap:5px; cursor:pointer;">
                    <span style="font-size:22px;">\u{1F4C2}</span><span style="font-size:11px; font-weight:800;">PDF / File</span>
                </button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); NexusSuperChat.openWhisperComposerModal();" style="background:#202c33; border:1px dashed #10b981; border-radius:14px; padding:10px 6px; color:#5eead4; display:flex; flex-direction:column; align-items:center; gap:5px; cursor:pointer;">
                    <span style="font-size:22px;">\u{1F510}</span><span style="font-size:11px; font-weight:800;">Whisper Lock</span>
                </button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); NexusSuperChat.openGroupPollModal();" style="background:#202c33; border:1px solid #2a3942; border-radius:14px; padding:10px 6px; color:#fbbf24; display:flex; flex-direction:column; align-items:center; gap:5px; cursor:pointer;">
                    <span style="font-size:22px;">\u{1F4CA}</span><span style="font-size:11px; font-weight:800;">Live Poll</span>
                </button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); NexusSuperChat.openCodeSnippetModal();" style="background:#202c33; border:1px solid #2a3942; border-radius:14px; padding:10px 6px; color:#a78bfa; display:flex; flex-direction:column; align-items:center; gap:5px; cursor:pointer;">
                    <span style="font-size:22px;">\u{1F4BB}</span><span style="font-size:11px; font-weight:800;">Send Code</span>
                </button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); NexusSuperChat.openGroupSongModal();" style="background:#202c33; border:1px solid #2a3942; border-radius:14px; padding:10px 6px; color:#f472b6; display:flex; flex-direction:column; align-items:center; gap:5px; cursor:pointer;">
                    <span style="font-size:22px;">\u{1F3B5}</span><span style="font-size:11px; font-weight:800;">Group DJ</span>
                </button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); NexusSuperChat.openLiveSketchpadModal(false);" style="background:#202c33; border:1px solid #2a3942; border-radius:14px; padding:10px 6px; color:#34d399; display:flex; flex-direction:column; align-items:center; gap:5px; cursor:pointer; grid-column:1/-1;">
                    <span style="font-size:14px; font-weight:800;">\u{1F3A8} Live Formula &amp; Sketch Whiteboard</span>
                </button>
            `;
            const ctxBar = document.getElementById('nx-chat-context-bar');
            if (ctxBar && ctxBar.parentNode) ctxBar.parentNode.insertBefore(tray, ctxBar);
            else roomEl.appendChild(tray);
        }

        const grpPhotoIn = document.getElementById('nx-chat-photo-in');
        if (grpPhotoIn && grpPhotoIn.parentNode) {
            const realGrpCamBtn = grpPhotoIn.nextElementSibling;
            if (realGrpCamBtn && realGrpCamBtn.tagName === 'BUTTON' && realGrpCamBtn.id !== 'nx-grp-plus-hub-btn') {
                realGrpCamBtn.style.display = 'none';
            }

            if (!document.getElementById('nx-grp-plus-hub-btn')) {
                const plusBtn = document.createElement('button');
                plusBtn.type = 'button';
                plusBtn.id = 'nx-grp-plus-hub-btn';
                plusBtn.title = 'Open Group Features Hub';
                plusBtn.style.cssText = "width:30px; height:30px; border-radius:50%; background:rgba(0,168,132,0.18); border:1.5px solid #00a884; color:#00a884; font-size:20px; font-weight:900; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; transition:transform 0.2s ease;";
                plusBtn.innerText = '+';
                plusBtn.onclick = (e) => {
                    e.stopPropagation();
                    NexusSuperChat.toggleGroupTray();
                };
                grpPhotoIn.parentNode.insertBefore(plusBtn, grpPhotoIn);
            }

            const origVoiceBtn = roomEl.querySelector('button[onclick*="NexusChat.startVoiceInput"]');
            if (origVoiceBtn && !origVoiceBtn.getAttribute('data-grp-voice-bound')) {
                origVoiceBtn.setAttribute('data-grp-voice-bound', '1');
                origVoiceBtn.id = 'nx-grp-voice-btn';
                origVoiceBtn.title = 'Tap to Record Real Group Voice Note';
                origVoiceBtn.onclick = (e) => {
                    e.preventDefault();
                    NexusSuperChat.toggleGroupVoiceRecording();
                };
            }
        }

        if (roomEl.style.display !== 'none' && Nexus.db) {
            let roomSlug = getActiveGroupSlug();
            if (roomSlug && roomSlug !== lastObservedGroupRoom) {
                lastObservedGroupRoom = roomSlug;
                bindGroupLiveListeners(roomSlug);
            }
        }
    }

    function bindGroupLiveListeners(roomSlug) {
        if (groupWatchPartyUnsub) groupWatchPartyUnsub();
        if (groupMusicSyncUnsub) groupMusicSyncUnsub();

        groupWatchPartyUnsub = Nexus.db.collection("nexus_watch_party").doc("grp_" + roomSlug).onSnapshot(doc => {
            const gWpBox = document.getElementById('nx-group-watchparty-box');
            const pBar = document.getElementById('nx-grp-pinned-bar');

            if (doc.exists && doc.data().pinnedText && pBar) {
                pBar.style.display = 'flex';
                pBar.innerHTML = `
                    <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;">\u{1F4CC} <b>Group Pin:</b> ${doc.data().pinnedText.replace(/</g, '&lt;')}</span>
                    <button type="button" onclick="NexusSuperChat.unpinGroupNotice()" style="background:none; border:none; color:#94a3b8; font-size:12px; cursor:pointer; margin-left:8px;">\u2715</button>
                `;
            } else if (pBar) {
                pBar.style.display = 'none';
            }

            if (!gWpBox) return;
            if (!doc.exists || !doc.data().active) {
                gWpBox.style.display = 'none';
                gWpBox.innerHTML = '';
                gWpBox.removeAttribute('data-url');
                return;
            }
            let d = doc.data();
            if (gWpBox.getAttribute('data-url') === d.embedUrl && gWpBox.style.display === 'block') return;
            gWpBox.setAttribute('data-url', d.embedUrl);
            gWpBox.style.display = 'block';
            gWpBox.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:5px 12px; background:#182229; border-bottom:1px solid #2a3942; font-size:11.5px;">
                    <span style="color:#10b981; font-weight:800;">\u{1F3AC} Group Watch-Party \u2022 @${d.startedBy}</span>
                    <button type="button" onclick="NexusSuperChat.stopGroupWatchParty()" style="background:#ef4444; color:white; border:none; padding:2px 8px; border-radius:6px; font-size:10.5px; font-weight:800; cursor:pointer;">\u2715 Stop</button>
                </div>
                <iframe src="${d.embedUrl}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen style="width:100%; height:170px; border:none; background:#000; display:block;"></iframe>
            `;
        });

        groupMusicSyncUnsub = Nexus.db.collection("nexus_music_sync").doc("grp_" + roomSlug).onSnapshot(doc => {
            const bar = document.getElementById('nx-grp-mini-song-bar');
            if (!bar) return;
            if (!window.__nxMasterSyncAudio) {
                window.__nxMasterSyncAudio = new Audio();
                window.__nxMasterSyncAudio.loop = true;
            }
            let masterAudio = window.__nxMasterSyncAudio;

            if (!doc.exists || !doc.data().playing || !doc.data().audioUrl) {
                bar.style.display = 'none';
                masterAudio.pause();
                currentGrpSongUrl = '';
                return;
            }
            let d = doc.data();
            bar.style.display = 'flex';
            bar.innerHTML = `
                <div style="display:flex; align-items:center; gap:9px; min-width:0; flex:1;">
                    <img src="${d.cover || 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f3b5/512.webp'}" class="nx-song-disk">
                    <div style="min-width:0; flex:1;">
                        <div style="font-weight:800; color:#5eead4; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\u{1F3B5} ${d.title}</div>
                        <div style="font-size:10.5px; color:#94a3b8;">${d.artist || 'Group DJ'} \u2022 @${d.by}</div>
                    </div>
                </div>
                <button type="button" onclick="NexusSuperChat.stopGroupSong()" style="background:#ef4444; color:white; border:none; padding:4px 9px; border-radius:8px; font-size:11px; font-weight:800; cursor:pointer;">\u2715</button>
            `;
            if (currentGrpSongUrl !== d.audioUrl || masterAudio.paused) {
                currentGrpSongUrl = d.audioUrl;
                masterAudio.pause();
                masterAudio.src = d.audioUrl;
                masterAudio.play().catch(() => {});
            }
        });
    }

    // 7. GROUP VOICE NOTE RECORDER & FILE SENDER
    function startGroupVoiceRecording() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            Nexus.toast("Microphone not supported!");
            return;
        }
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            grpAudioChunks = [];
            let options = { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 24000 };
            if (!MediaRecorder.isTypeSupported(options.mimeType)) options = {};

            grpMediaRecorder = new MediaRecorder(stream, options);
            isGrpRecording = true;
            grpRecStart = Date.now();

            const btn = document.getElementById('nx-grp-voice-btn');
            if (btn) {
                btn.classList.add('nx-voice-rec-active');
                btn.innerText = '\u23F9';
            }
            const inp = document.getElementById('nx-chat-msg-in');
            if (inp) inp.placeholder = "Recording Group Voice (0s)... Tap Stop";

            grpRecTimer = setInterval(() => {
                let sec = Math.floor((Date.now() - grpRecStart) / 1000);
                if (inp) inp.placeholder = `Recording Group Voice (${sec}s)... Tap Stop`;
                if (sec >= 25) stopGroupVoiceRecording(false);
            }, 500);

            grpMediaRecorder.ondataavailable = e => {
                if (e.data && e.data.size > 0) grpAudioChunks.push(e.data);
            };

            grpMediaRecorder.onstop = () => {
                stream.getTracks().forEach(t => t.stop());
                clearInterval(grpRecTimer);
                const btnEl = document.getElementById('nx-grp-voice-btn');
                if (btnEl) {
                    btnEl.classList.remove('nx-voice-rec-active');
                    btnEl.innerText = '\u{1F399}\uFE0F';
                }
                const inpEl = document.getElementById('nx-chat-msg-in');
                if (inpEl) inpEl.placeholder = "Message...";

                if (grpAudioChunks.length === 0) return;
                const blob = new Blob(grpAudioChunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onloadend = () => {
                    let me = Nexus.getCurrentUser();
                    if (!me || !Nexus.db) return;
                    Nexus.db.collection("nexus_real_msgs").add({
                        roomId: currentGroupRoomId || 'casual_chat',
                        sender: me.name,
                        username: me.username,
                        role: me.bio || 'JEE Aspirant',
                        text: `🎤VOICE|${reader.result}`,
                        imgUrl: "",
                        replyTo: null,
                        likes: [],
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        createdAt: Date.now()
                    }).then(() => Nexus.toast("\u{1F3A4} Group Voice Note Sent!"));
                };
                reader.readAsDataURL(blob);
            };

            grpMediaRecorder.start();
            Nexus.toast("\u{1F3A4} Recording Group Voice... Tap Stop to Send!");
        }).catch(() => Nexus.toast("Allow Microphone Permission!"));
    }

    function stopGroupVoiceRecording(cancel) {
        isGrpRecording = false;
        if (cancel) grpAudioChunks = [];
        if (grpMediaRecorder && grpMediaRecorder.state !== 'inactive') grpMediaRecorder.stop();
    }

    function sendGroupDocumentFile(file) {
        if (!file) return;
        if (file.size > 750 * 1024) {
            Nexus.toast("File must be under 750 KB!");
            return;
        }
        let me = Nexus.getCurrentUser();
        if (!me || !Nexus.db) return;

        Nexus.toast(`Uploading "${file.name}" to Group...`);
        const reader = new FileReader();
        reader.onload = ev => {
            let sizeKb = Math.max(1, Math.round(file.size / 1024)) + ' KB';
            Nexus.db.collection("nexus_real_msgs").add({
                roomId: currentGroupRoomId || 'casual_chat',
                sender: me.name,
                username: me.username,
                role: me.bio || 'JEE Aspirant',
                text: `📂FILE|${file.name}|${sizeKb}|${ev.target.result}`,
                imgUrl: "",
                replyTo: null,
                likes: [],
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                createdAt: Date.now()
            }).then(() => Nexus.toast("\u{1F4C2} File Shared in Group!"));
        };
        reader.readAsDataURL(file);
    }

    function decorateGroupMessagesRichMedia() {
        const msgBox = document.getElementById('nx-room-messages');
        if (!msgBox) return;

        msgBox.querySelectorAll('div[onclick*="openCommunityMsgMenu"]').forEach(bubble => {
            let rawOnclick = bubble.getAttribute('onclick') || '';
            let mIdMatch = rawOnclick.match(/'([^']+)'/);
            let msgId = mIdMatch ? mIdMatch[1] : '';

            bubble.querySelectorAll('span').forEach(sp => {
                let txt = decodeMojibakeString(sp.innerText || '');
                if (txt.startsWith('🎤VOICE|') && !sp.getAttribute('data-parsed')) {
                    sp.setAttribute('data-parsed', '1');
                    let audioSrc = txt.substring(txt.indexOf('|') + 1).trim();
                    const audioWrap = document.createElement('div');
                    audioWrap.className = 'nx-audio-player-pill';
                    audioWrap.onclick = e => e.stopPropagation();
                    audioWrap.innerHTML = `<span style="font-size:18px;">\u{1F3A4}</span><audio controls preload="metadata" src="${audioSrc}"></audio>`;
                    sp.innerHTML = '';
                    sp.appendChild(audioWrap);
                } else if (txt.startsWith('📂FILE|') && !sp.getAttribute('data-parsed')) {
                    sp.setAttribute('data-parsed', '1');
                    let parts = txt.split('|');
                    let fName = parts[1] || 'Document';
                    let fSize = parts[2] || 'File';
                    let fData = parts.slice(3).join('|');

                    const fCard = document.createElement('div');
                    fCard.className = 'nx-file-share-card';
                    fCard.onclick = e => {
                        e.stopPropagation();
                        const a = document.createElement('a');
                        a.href = fData;
                        a.download = fName;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        Nexus.toast(`Downloading "${fName}"`);
                    };
                    fCard.innerHTML = `
                        <div style="display:flex; align-items:center; gap:8px; min-width:0; flex:1;">
                            <span style="font-size:22px;">\u{1F4C2}</span>
                            <div style="min-width:0; flex:1;">
                                <div style="font-weight:800; font-size:12px; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${fName.replace(/</g, '&lt;')}</div>
                                <div style="font-size:10px; color:#38bdf8;">${fSize} \u2022 Tap to Download</div>
                            </div>
                        </div>
                        <span style="background:#38bdf8; color:#020617; padding:4px 8px; border-radius:8px; font-size:10.5px; font-weight:900;">Save</span>
                    `;
                    sp.innerHTML = '';
                    sp.appendChild(fCard);
                } else if (txt.startsWith('🔒WHISPER|') && !sp.getAttribute('data-parsed')) {
                    sp.setAttribute('data-parsed', '1');
                    let parts = txt.split('|');
                    let targetU = (parts[1] || '').trim();
                    let senderU = (parts[2] || '').trim();
                    let encodedMsg = parts.slice(3).join('|');

                    const card = document.createElement('div');
                    card.className = 'nx-whisper-card';
                    card.onclick = (e) => {
                        e.stopPropagation();
                        NexusSuperChat.tryUnlockWhisper(targetU, senderU, encodedMsg);
                    };
                    card.innerHTML = `<span>\u{1F510}</span><span>Secret Whisper for <b>@${targetU}</b> (Tap to Unlock)</span>`;
                    sp.innerHTML = '';
                    sp.appendChild(card);
                } else if (txt.startsWith('💻CODE|') && !sp.getAttribute('data-parsed')) {
                    sp.setAttribute('data-parsed', '1');
                    let encodedCode = txt.substring(txt.indexOf('|') + 1);
                    let decoded = '';
                    try { decoded = decodeURIComponent(escape(atob(encodedCode))); } catch (e) { decoded = encodedCode; }

                    const codeWrap = document.createElement('div');
                    codeWrap.onclick = e => e.stopPropagation();
                    codeWrap.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center; background:#1e293b; padding:4px 10px; border-radius:8px 8px 0 0; font-size:10.5px; color:#38bdf8; font-weight:800; margin-top:4px;">
                            <span>\u{1F4BB} Code Snippet</span>
                            <button type="button" onclick="navigator.clipboard.writeText(decodeURIComponent(escape(atob('${encodedCode}')))); Nexus.toast('Code Copied!');" style="background:#00a884; color:#020617; border:none; padding:2px 8px; border-radius:6px; font-weight:900; font-size:10px; cursor:pointer;">Copy</button>
                        </div>
                        <pre class="nx-code-block-card" style="margin-top:0; border-radius:0 0 10px 10px;">${decoded.replace(/</g, '&lt;')}</pre>
                    `;
                    sp.innerHTML = '';
                    sp.appendChild(codeWrap);
                } else if (txt.startsWith('📊POLL|') && !sp.getAttribute('data-parsed')) {
                    sp.setAttribute('data-parsed', '1');
                    let parts = txt.split('|');
                    let q = parts[1] || 'Poll';
                    let optA = parts[2] || 'Yes';
                    let optB = parts[3] || 'No';

                    const pCard = document.createElement('div');
                    pCard.className = 'nx-grp-poll-card';
                    pCard.onclick = e => e.stopPropagation();
                    pCard.innerHTML = `
                        <div style="font-weight:800; font-size:13px; color:#38bdf8; margin-bottom:8px;">\u{1F4CA} ${q.replace(/</g, '&lt;')}</div>
                        <button type="button" onclick="NexusChat.reactToMsg('${msgId}', '\u{1F170}\uFE0F')" style="width:100%; background:#1e293b; border:1px solid #334155; color:white; padding:7px 10px; border-radius:8px; text-align:left; font-size:12px; font-weight:700; margin-bottom:6px; cursor:pointer; display:flex; justify-content:space-between;">
                            <span>(A) ${optA.replace(/</g, '&lt;')}</span><span style="color:#10b981;">Vote A</span>
                        </button>
                        <button type="button" onclick="NexusChat.reactToMsg('${msgId}', '\u{1F171}\uFE0F')" style="width:100%; background:#1e293b; border:1px solid #334155; color:white; padding:7px 10px; border-radius:8px; text-align:left; font-size:12px; font-weight:700; cursor:pointer; display:flex; justify-content:space-between;">
                            <span>(B) ${optB.replace(/</g, '&lt;')}</span><span style="color:#38bdf8;">Vote B</span>
                        </button>
                    `;
                    sp.innerHTML = '';
                    sp.appendChild(pCard);
                }
            });
        });
    }

    function isOnlyEmojis(str) {
        if (!str) return false;
        let clean = str.trim();
        if (!clean || clean.length > 14 || /[a-zA-Z0-9]/.test(clean)) return false;
        try {
            return /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\uFE0F|\u200D|\s)+$/u.test(clean);
        } catch (e) { return false; }
    }

    function decorateStoriesWithMoodNotes(forceUpdate) {
        const sBar = document.getElementById('nx-stories-bar');
        if (!sBar) return;

        let me = Nexus.getCurrentUser();
        let myUname = me ? me.username.toLowerCase() : '';
        let userMap = {};
        (Nexus.users || []).forEach(u => {
            if (u && u.username) userMap[u.username.toLowerCase()] = u;
        });

        sBar.querySelectorAll('div[onclick*="Nexus.openPublicProfile"]').forEach(card => {
            let onclickAttr = card.getAttribute('onclick') || '';
            let m = onclickAttr.match(/'([^']+)'/);
            if (!m || !m[1]) return;
            let uKey = m[1].toLowerCase();
            let uObj = userMap[uKey];

            let moodText = (uObj && uObj.moodNote) ? decodeMojibakeString(uObj.moodNote) : (uKey === myUname ? '\u{1F4AD} + Note' : '');
            let existingBubble = card.querySelector('.nx-mood-note-bubble');

            if (!forceUpdate && existingBubble && existingBubble.innerText === moodText) return;
            if (existingBubble) existingBubble.remove();

            if (moodText) {
                const bubble = document.createElement('div');
                bubble.className = 'nx-mood-note-bubble';
                bubble.innerText = moodText;
                if (uKey === myUname) {
                    bubble.style.background = '#10b981';
                    bubble.style.color = '#020617';
                    bubble.style.borderColor = '#10b981';
                    bubble.onclick = (e) => {
                        e.stopPropagation();
                        NexusSuperChat.openMoodNoteModal();
                    };
                }
                card.style.position = 'relative';
                card.style.paddingTop = '12px';
                card.appendChild(bubble);
            }
        });
    }

    function setupProfileViewsTracker() {
        const origOpenProfile = Nexus.openPublicProfile;
        if (!origOpenProfile || origOpenProfile.__nxViewsWrapped) return;

        const wrappedFn = function(targetKey) {
            origOpenProfile(targetKey);
            repairBrokenEmojisInDOM(document.getElementById('nx-global-modal'));
            let me = Nexus.getCurrentUser();
            if (!me || !Nexus.db || !targetKey) return;
            let cleanTarget = targetKey.toLowerCase().trim();
            if (cleanTarget === 'nexus_official' || cleanTarget === me.username.toLowerCase()) return;

            let targetAcc = (Nexus.users || []).find(u =>
                (u.username && u.username.toLowerCase() === cleanTarget) ||
                (u.name && u.name.toLowerCase().trim() === cleanTarget)
            );
            if (!targetAcc || !targetAcc.username) return;

            let visitors = Array.isArray(targetAcc.recentVisitors) ? [...targetAcc.recentVisitors] : [];
            visitors = visitors.filter(v => v.username && v.username.toLowerCase() !== me.username.toLowerCase());
            visitors.unshift({ username: me.username, name: me.name, time: Date.now() });
            visitors = visitors.slice(0, 25);

            Nexus.db.collection("nexus_accounts").doc(targetAcc.username).set({
                recentVisitors: visitors
            }, { merge: true }).catch(() => {});
        };
        wrappedFn.__nxViewsWrapped = true;
        Nexus.openPublicProfile = wrappedFn;
    }

    // 8. PUBLIC API
    window.NexusSuperChat = {
        toggleGroupTray: function(forceState) {
            const tray = document.getElementById('nx-grp-bottom-tray');
            const pBtn = document.getElementById('nx-grp-plus-hub-btn');
            if (!tray) return;
            let show = typeof forceState === 'boolean' ? forceState : (tray.style.display === 'none');
            tray.style.display = show ? 'grid' : 'none';
            if (pBtn) pBtn.style.transform = show ? 'rotate(45deg)' : 'rotate(0deg)';
        },

        toggleGroupVoiceRecording: function() {
            if (isGrpRecording) stopGroupVoiceRecording(false);
            else startGroupVoiceRecording();
        },

        openLiveSketchpadModal: function(isDmChat) {
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;
            sketchColor = '#10b981';

            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid #10b981; padding:14px; text-align:center;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <strong style="color:#10b981; font-size:15px;">\u{1F3A8} Live Formula &amp; Sketch Whiteboard</strong>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">\u2715</button>
                    </div>
                    <canvas id="nx-sketch-canvas" width="320" height="260" style="background:#050811; border:1.5px solid #334155; border-radius:14px; touch-action:none; width:100%; max-width:320px; cursor:crosshair;"></canvas>
                    <div style="display:flex; justify-content:center; gap:10px; margin:10px 0;">
                        <button type="button" onclick="NexusSuperChat.setSketchPen('#10b981')" style="width:26px; height:26px; border-radius:50%; background:#10b981; border:2px solid white; cursor:pointer;"></button>
                        <button type="button" onclick="NexusSuperChat.setSketchPen('#38bdf8')" style="width:26px; height:26px; border-radius:50%; background:#38bdf8; border:2px solid white; cursor:pointer;"></button>
                        <button type="button" onclick="NexusSuperChat.setSketchPen('#f43f5e')" style="width:26px; height:26px; border-radius:50%; background:#f43f5e; border:2px solid white; cursor:pointer;"></button>
                        <button type="button" onclick="NexusSuperChat.setSketchPen('#fde047')" style="width:26px; height:26px; border-radius:50%; background:#fde047; border:2px solid white; cursor:pointer;"></button>
                        <button type="button" onclick="NexusSuperChat.setSketchPen('#ffffff')" style="width:26px; height:26px; border-radius:50%; background:#ffffff; border:2px solid #334155; cursor:pointer;"></button>
                        <button type="button" onclick="NexusSuperChat.clearSketchCanvas()" style="background:#1e293b; color:#f87171; border:1px solid #334155; padding:3px 10px; border-radius:8px; font-size:11.5px; font-weight:800; cursor:pointer;">Clear</button>
                    </div>
                    <button type="button" onclick="NexusSuperChat.sendSketchToChat(${isDmChat ? 'true' : 'false'})" style="width:100%; background:#10b981; color:#020617; border:none; padding:11px; border-radius:12px; font-weight:900; font-size:14px; cursor:pointer;">\u{1F680} Send Sketch to Chat</button>
                </div>
            `;
            modal.style.display = 'flex';

            const cvs = document.getElementById('nx-sketch-canvas');
            const ctx = cvs.getContext('2d');
            ctx.fillStyle = '#050811';
            ctx.fillRect(0, 0, cvs.width, cvs.height);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 3.2;

            let drawing = false;
            const getPos = (e) => {
                const rect = cvs.getBoundingClientRect();
                const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
                const clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
                return {
                    x: (clientX - rect.left) * (cvs.width / rect.width),
                    y: (clientY - rect.top) * (cvs.height / rect.height)
                };
            };

            const startDraw = (e) => {
                e.preventDefault();
                drawing = true;
                const p = getPos(e);
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
            };
            const moveDraw = (e) => {
                if (!drawing) return;
                e.preventDefault();
                const p = getPos(e);
                ctx.strokeStyle = sketchColor;
                ctx.lineTo(p.x, p.y);
                ctx.stroke();
            };
            const endDraw = () => { drawing = false; };

            cvs.addEventListener('mousedown', startDraw);
            cvs.addEventListener('mousemove', moveDraw);
            window.addEventListener('mouseup', endDraw, { once: true });
            cvs.addEventListener('touchstart', startDraw, { passive: false });
            cvs.addEventListener('touchmove', moveDraw, { passive: false });
            cvs.addEventListener('touchend', endDraw);
        },

        setSketchPen: function(col) { sketchColor = col; },

        clearSketchCanvas: function() {
            const cvs = document.getElementById('nx-sketch-canvas');
            if (!cvs) return;
            const ctx = cvs.getContext('2d');
            ctx.fillStyle = '#050811';
            ctx.fillRect(0, 0, cvs.width, cvs.height);
        },

        sendSketchToChat: function(isDmChat) {
            const cvs = document.getElementById('nx-sketch-canvas');
            if (!cvs) return;
            let dataUrl = cvs.toDataURL('image/jpeg', 0.85);
            document.getElementById('nx-global-modal').style.display = 'none';

            if (isDmChat && window.NexusDM) {
                NexusDM.sendDM(dataUrl);
                Nexus.toast("\u{1F3A8} Sketch Sent!");
            } else if (!isDmChat && window.NexusChat) {
                NexusChat.sendChatMessage(dataUrl);
                Nexus.toast("\u{1F3A8} Sketch Sent to Group!");
            }
        },

        openMyVipQrCard: function() {
            let me = Nexus.getCurrentUser();
            if (!me) return;
            const modal = document.getElementById('nx-global-modal');
            let directDmUrl = `${window.location.origin}${window.location.pathname}?dm=${encodeURIComponent(me.username)}`;
            let qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&bgcolor=0f172a&color=38bdf8&data=${encodeURIComponent(directDmUrl)}`;

            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid #38bdf8; text-align:center; background:linear-gradient(180deg,#0f172a,#090d16);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span style="font-size:11px; color:#10b981; font-weight:900; text-transform:uppercase;">\u{1FAAA} Official Nexus VIP Pass</span>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">\u2715</button>
                    </div>
                    <h3 style="font-size:18px; color:#f8fafc; margin-bottom:2px;">${me.name}</h3>
                    <div style="font-size:12px; color:#38bdf8; font-weight:800; margin-bottom:12px;">@${me.username} \u2022 ${me.bio || 'JEE Aspirant'}</div>
                    <div style="background:#0f172a; border:2px dashed #38bdf8; padding:12px; border-radius:16px; display:inline-block; margin-bottom:12px;">
                        <img src="${qrImgUrl}" style="width:170px; height:170px; border-radius:10px; display:block;">
                    </div>
                    <p style="font-size:11.5px; color:#94a3b8; margin-bottom:12px;">Koi bhi dost is QR ko scan karke ya niche wala link khol kar seedha aapki 1:1 Personal Chat mein aa sakta hai!</p>
                    <div style="display:flex; gap:8px;">
                        <button type="button" onclick="navigator.clipboard.writeText('${directDmUrl}'); Nexus.toast('Direct Chat Link Copied!');" style="flex:1; background:#2563eb; color:white; border:none; padding:11px; border-radius:12px; font-weight:800; font-size:12.5px; cursor:pointer;">\u{1F517} Copy My Link</button>
                        <button type="button" onclick="window.open('https://wa.me/?text=' + encodeURIComponent('Chat with me live on Nexus: ${directDmUrl}'), '_blank')" style="flex:1; background:#10b981; color:#020617; border:none; padding:11px; border-radius:12px; font-weight:900; font-size:12.5px; cursor:pointer;">\u{1F4F2} WhatsApp</button>
                    </div>
                </div>
            `;
            modal.style.display = 'flex';
        },

        openGroupDotsMenu: function() {
            const modal = document.getElementById('nx-global-modal');
            let rTitle = document.getElementById('nx-room-title') ? document.getElementById('nx-room-title').innerText : 'Group';

            modal.innerHTML = `
                <div class="nx-modal-box" style="border:1.5px solid #00a884;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <strong style="color:#f8fafc; font-size:15px;">\u2699\uFE0F ${rTitle} Menu</strong>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:16px; cursor:pointer;">\u2715</button>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <button type="button" class="nx-menu-opt-btn" style="color:#38bdf8;" onclick="document.getElementById('nx-global-modal').style.display='none'; NexusSuperChat.openGroupSongModal();">
                            <span>\u{1F3B5}</span> <span>Group DJ (Listen Song Together)</span>
                        </button>
                        <button type="button" class="nx-menu-opt-btn" style="color:#10b981;" onclick="document.getElementById('nx-global-modal').style.display='none'; NexusSuperChat.openGroupWatchPartyModal();">
                            <span>\u{1F3AC}</span> <span>Group YouTube Watch-Party</span>
                        </button>
                        <button type="button" class="nx-menu-opt-btn" style="color:#a78bfa;" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusChat) NexusChat.toggleStudyMusic();">
                            <span>\u{1F327}\uFE0F</span> <span>Switch Study Vibe (Rain / Lofi / Focus)</span>
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
                    </div>
                </div>
            `;
            modal.style.display = 'flex';
        },

        filterGroupMessages: function(q) {
            const box = document.getElementById('nx-room-messages');
            if (!box) return;
            let clean = (q || '').toLowerCase().trim();
            Array.from(box.children).forEach(el => {
                if (!clean) el.style.display = '';
                else el.style.display = (el.innerText || '').toLowerCase().includes(clean) ? '' : 'none';
            });
        },

        pinGroupAnnouncementPrompt: function() {
            let txt = prompt("Enter announcement or message to Pin at top of this Group:");
            if (!txt || !txt.trim() || !Nexus.db) return;
            Nexus.db.collection("nexus_watch_party").doc("grp_" + getActiveGroupSlug()).set({
                pinnedText: txt.trim().substring(0, 95)
            }, { merge: true }).then(() => Nexus.toast("Pinned to Group Top!"));
        },

        unpinGroupNotice: function() {
            if (!Nexus.db) return;
            Nexus.db.collection("nexus_watch_party").doc("grp_" + getActiveGroupSlug()).set({ pinnedText: "" }, { merge: true });
        },

        openGroupSongModal: function() {
            const modal = document.getElementById('nx-global-modal');
            modal.innerHTML = `
                <div class="nx-modal-box" style="border:1.5px solid #38bdf8;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <strong style="font-size:15px; color:#38bdf8;">\u{1F3B5} Group DJ Fast-Stream Search</strong>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:16px; cursor:pointer;">\u2715</button>
                    </div>
                    <div style="display:flex; gap:6px; margin-bottom:12px;">
                        <input type="text" id="nx-grp-song-q" placeholder="Search song for group..." style="flex:1; padding:9px 12px; border-radius:12px; border:1px solid #334155; background:#090d16; color:white; font-size:13px; outline:none;">
                        <button type="button" onclick="NexusSuperChat.searchGroupSongs()" style="background:#38bdf8; color:#020617; border:none; padding:0 14px; border-radius:12px; font-weight:900; font-size:12.5px; cursor:pointer;">Search</button>
                    </div>
                    <div id="nx-grp-song-list" style="display:flex; flex-direction:column; gap:7px; max-height:48vh; overflow-y:auto;"></div>
                </div>
            `;
            modal.style.display = 'flex';
            this.searchGroupSongs('Hindi Lofi');
        },

        searchGroupSongs: function(defQ) {
            const inp = document.getElementById('nx-grp-song-q');
            const box = document.getElementById('nx-grp-song-list');
            if (!box) return;
            let q = (inp && inp.value.trim()) ? inp.value.trim() : (defQ || 'Arijit Singh');
            box.innerHTML = `<div style="text-align:center; padding:14px; color:#38bdf8; font-size:12px;">Searching Fast-Stream Songs for "${q}"...</div>`;

            fetchLowDataFastSongs(q, list => {
                if (!list.length) {
                    box.innerHTML = `<div style="text-align:center; padding:14px; color:#64748b; font-size:12px;">No songs found. Try another keyword!</div>`;
                    return;
                }
                box.innerHTML = list.map(s => `
                    <div onclick="NexusSuperChat.playGroupSong('${s.safeTitle}', '${s.safeArtist}', '${s.audioUrl}', '${s.cover}')" style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:8px; background:#1e293b; border-radius:10px; cursor:pointer;">
                        <div style="display:flex; align-items:center; gap:8px; min-width:0; flex:1;">
                            <img src="${s.cover}" style="width:36px; height:36px; border-radius:8px; object-fit:cover;">
                            <div style="min-width:0; flex:1;">
                                <div style="font-weight:800; font-size:12.5px; color:white; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.rawTitle}</div>
                                <div style="font-size:10.5px; color:#10b981;">\u26A1 Fast 4G Stream \u2022 ${s.rawArtist}</div>
                            </div>
                        </div>
                        <span style="background:#00a884; color:#020617; padding:4px 9px; border-radius:8px; font-size:11px; font-weight:900;">\u25B6 Play</span>
                    </div>
                `).join('');
            });
        },

        playGroupSong: function(title, artist, audioUrl, cover) {
            let me = Nexus.getCurrentUser();
            if (!me || !Nexus.db) return;
            document.getElementById('nx-global-modal').style.display = 'none';
            Nexus.db.collection("nexus_music_sync").doc("grp_" + getActiveGroupSlug()).set({
                playing: true,
                title: title,
                artist: artist,
                audioUrl: audioUrl,
                cover: cover,
                by: me.username,
                updatedAt: Date.now()
            }).then(() => Nexus.toast(`Playing "${title}" in Group!`));
        },

        stopGroupSong: function() {
            if (!Nexus.db) return;
            Nexus.db.collection("nexus_music_sync").doc("grp_" + getActiveGroupSlug()).set({ playing: false, audioUrl: "" });
        },

        openGroupWatchPartyModal: function() {
            const modal = document.getElementById('nx-global-modal');
            const presets = [
                { title: "Hindi Lofi / Rain Night Vibe", url: "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&playsinline=1" },
                { title: "Study Focus Beats Live", url: "https://www.youtube.com/embed/DWcJFNfaw9c?autoplay=1&playsinline=1" }
            ];
            modal.innerHTML = `
                <div class="nx-modal-box" style="border:1.5px solid #10b981;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h3 style="font-size:15.5px; color:#10b981;">\u{1F3AC} Group Room Watch-Party</h3>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">\u2715</button>
                    </div>
                    <input type="url" id="nx-grp-wp-in" placeholder="Paste YouTube link here..." style="width:100%; padding:10px 12px; border-radius:10px; border:1px solid #334155; background:#090d16; color:white; font-size:13px; outline:none; margin-bottom:10px;">
                    <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:12px;">
                        ${presets.map(p => `<button type="button" onclick="NexusSuperChat.startGroupWatchParty('${p.url}')" style="background:#1e293b; border:1px solid #334155; color:#38bdf8; padding:8px 10px; border-radius:10px; font-size:12px; font-weight:700; text-align:left; cursor:pointer;">\u25B6 ${p.title}</button>`).join('')}
                    </div>
                    <button type="button" onclick="NexusSuperChat.startGroupWatchParty(document.getElementById('nx-grp-wp-in').value)" style="width:100%; background:#10b981; color:#020617; border:none; padding:11px; border-radius:10px; font-weight:900; cursor:pointer;">\u{1F680} Start Watch-Party</button>
                </div>
            `;
            modal.style.display = 'flex';
        },

        startGroupWatchParty: function(rawUrl) {
            let embed = extractYtEmbed(rawUrl);
            if (!embed || !Nexus.db) { Nexus.toast("Paste a valid YouTube link!"); return; }
            document.getElementById('nx-global-modal').style.display = 'none';
            let me = Nexus.getCurrentUser();
            Nexus.db.collection("nexus_watch_party").doc("grp_" + getActiveGroupSlug()).set({
                active: true,
                embedUrl: embed,
                startedBy: me ? me.username : 'Member',
                updatedAt: Date.now()
            }, { merge: true }).then(() => Nexus.toast("Group Watch-Party Live!"));
        },

        stopGroupWatchParty: function() {
            if (!Nexus.db) return;
            Nexus.db.collection("nexus_watch_party").doc("grp_" + getActiveGroupSlug()).set({ active: false, embedUrl: "" }, { merge: true });
        },

        openGroupPollModal: function() {
            const modal = document.getElementById('nx-global-modal');
            modal.innerHTML = `
                <div class="nx-modal-box" style="border:1.5px solid #fbbf24;">
                    <h3 style="font-size:15.5px; color:#fbbf24; margin-bottom:10px;">\u{1F4CA} Create Live Group Poll</h3>
                    <input type="text" id="nx-gpoll-q" placeholder="Ask a question..." style="width:100%; padding:10px; border-radius:10px; border:1px solid #334155; background:#090d16; color:white; font-size:13.5px; margin-bottom:8px; outline:none;">
                    <input type="text" id="nx-gpoll-a" placeholder="Option A" style="width:100%; padding:9px; border-radius:10px; border:1px solid #334155; background:#090d16; color:white; font-size:13px; margin-bottom:8px; outline:none;">
                    <input type="text" id="nx-gpoll-b" placeholder="Option B" style="width:100%; padding:9px; border-radius:10px; border:1px solid #334155; background:#090d16; color:white; font-size:13px; margin-bottom:12px; outline:none;">
                    <button type="button" onclick="NexusSuperChat.sendGroupPollNow()" style="width:100%; background:#fbbf24; color:#020617; border:none; padding:11px; border-radius:10px; font-weight:900; cursor:pointer;">\u{1F4CA} Launch Poll in Group</button>
                </div>
            `;
            modal.style.display = 'flex';
        },

        sendGroupPollNow: function() {
            let q = (document.getElementById('nx-gpoll-q') ? document.getElementById('nx-gpoll-q').value : '').trim().replace(/\|/g, ' ');
            let a = (document.getElementById('nx-gpoll-a') ? document.getElementById('nx-gpoll-a').value : '').trim().replace(/\|/g, ' ');
            let b = (document.getElementById('nx-gpoll-b') ? document.getElementById('nx-gpoll-b').value : '').trim().replace(/\|/g, ' ');
            if (!q || !a || !b) { Nexus.toast("Fill question & both options!"); return; }
            document.getElementById('nx-global-modal').style.display = 'none';
            const inp = document.getElementById('nx-chat-msg-in');
            if (inp && window.NexusChat) {
                inp.value = `📊POLL|${q}|${a}|${b}`;
                NexusChat.sendChatMessage();
            }
        },

        openCodeSnippetModal: function() {
            const modal = document.getElementById('nx-global-modal');
            modal.innerHTML = `
                <div class="nx-modal-box" style="border:1.5px solid #a78bfa;">
                    <h3 style="font-size:15.5px; color:#a78bfa; margin-bottom:10px;">\u{1F4BB} Send Formatted Code Block</h3>
                    <textarea id="nx-grp-code-in" rows="5" placeholder="Paste HTML, CSS, JS, or Python code here..." style="width:100%; padding:10px; border-radius:10px; border:1px solid #334155; background:#050811; color:#38bdf8; font-family:monospace; font-size:12.5px; margin-bottom:12px; outline:none;"></textarea>
                    <button type="button" onclick="NexusSuperChat.sendCodeToGroup()" style="width:100%; background:#a78bfa; color:#020617; border:none; padding:11px; border-radius:10px; font-weight:900; cursor:pointer;">\u{1F4BB} Send Code Box</button>
                </div>
            `;
            modal.style.display = 'flex';
        },

        sendCodeToGroup: function() {
            let raw = (document.getElementById('nx-grp-code-in') ? document.getElementById('nx-grp-code-in').value : '').trim();
            if (!raw) return;
            document.getElementById('nx-global-modal').style.display = 'none';
            const inp = document.getElementById('nx-chat-msg-in');
            if (inp && window.NexusChat) {
                let encoded = btoa(unescape(encodeURIComponent(raw)));
                inp.value = `💻CODE|${encoded}`;
                NexusChat.sendChatMessage();
            }
        },

        openWhisperComposerModal: function() {
            let me = Nexus.getCurrentUser();
            if (!me) return;
            const modal = document.getElementById('nx-global-modal');
            let others = (Nexus.users || []).filter(u => u && u.username && u.username.toLowerCase() !== me.username.toLowerCase() && u.username !== 'nexus_official');

            modal.innerHTML = `
                <div class="nx-modal-box" style="border:1.5px solid #10b981;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h3 style="font-size:15.5px; color:#10b981;">\u{1F510} Send Locked Group Whisper</h3>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">\u2715</button>
                    </div>
                    <select id="nx-whisper-target" style="width:100%; padding:10px; border-radius:10px; border:1px solid #334155; background:#090d16; color:white; font-size:13.5px; margin-bottom:10px; outline:none;">
                        ${others.map(u => `<option value="${u.username}">@${u.username} (${u.name})</option>`).join('')}
                    </select>
                    <textarea id="nx-whisper-text" rows="3" placeholder="Type secret message..." style="width:100%; padding:10px; border-radius:10px; border:1px solid #334155; background:#090d16; color:white; font-size:13.5px; margin-bottom:12px; outline:none;"></textarea>
                    <button type="button" onclick="NexusSuperChat.sendWhisperToGroup()" style="width:100%; background:#10b981; color:#020617; border:none; padding:11px; border-radius:10px; font-weight:900; cursor:pointer;">\u{1F510} Send Locked Whisper</button>
                </div>
            `;
            modal.style.display = 'flex';
        },

        sendWhisperToGroup: function() {
            let me = Nexus.getCurrentUser();
            let target = document.getElementById('nx-whisper-target') ? document.getElementById('nx-whisper-target').value.trim() : '';
            let secret = document.getElementById('nx-whisper-text') ? document.getElementById('nx-whisper-text').value.trim() : '';
            if (!me || !target || !secret) { Nexus.toast("Select user & write secret!"); return; }

            document.getElementById('nx-global-modal').style.display = 'none';
            const inp = document.getElementById('nx-chat-msg-in');
            if (inp && window.NexusChat) {
                let safeEncoded = btoa(unescape(encodeURIComponent(secret)));
                inp.value = `🔒WHISPER|${target.toLowerCase()}|${me.username.toLowerCase()}|${safeEncoded}`;
                NexusChat.sendChatMessage();
                Nexus.toast(`Whisper locked for @${target}!`);
            }
        },

        tryUnlockWhisper: function(targetU, senderU, encodedMsg) {
            let me = Nexus.getCurrentUser();
            if (!me) return;
            let myU = me.username.toLowerCase();
            let isAllowed = (myU === targetU.toLowerCase()) || (myU === senderU.toLowerCase()) || myU === 'mohit' || myU === 'kumar' || myU === 'mohit_01';

            if (!isAllowed) {
                Nexus.toast(`Locked! Sirf @${targetU} yeh secret khol sakta hai.`);
                return;
            }
            let decoded = '';
            try { decoded = decodeURIComponent(escape(atob(encodedMsg))); } catch (e) { decoded = encodedMsg; }
            const modal = document.getElementById('nx-global-modal');
            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid #10b981; text-align:center;">
                    <div style="font-size:28px; margin-bottom:6px;">\u{1F513}</div>
                    <h3 style="font-size:15px; color:#10b981; margin-bottom:8px;">Secret Whisper (@${senderU} \u2192 @${targetU})</h3>
                    <div style="background:#090d16; border:1px solid #334155; padding:14px; border-radius:12px; color:#f8fafc; font-size:15px; margin-bottom:14px; word-break:break-word;">${decoded.replace(/</g, '&lt;')}</div>
                    <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="width:100%; background:#10b981; color:#020617; border:none; padding:10px; border-radius:10px; font-weight:900; cursor:pointer;">Close</button>
                </div>
            `;
            modal.style.display = 'flex';
        },

        upgradeEmojiReactionModals: function() {
            const dmModal = document.getElementById('nx-msg-action-modal');
            if (dmModal && dmModal.style.display === 'flex') {
                repairBrokenEmojisInDOM(dmModal);
                const bar = dmModal.querySelector('.nx-emoji-bar');
                if (bar) {
                    const firstBtn = bar.querySelector('button[onclick]');
                    let m = firstBtn ? (firstBtn.getAttribute('onclick') || '').match(/'([^']+)'/) : null;
                    if (m && m[1]) appendPlusEmojiPicker(bar, m[1], true);
                }
            }
            const grpModal = document.getElementById('nx-cmsg-action-modal');
            if (grpModal && grpModal.style.display === 'flex') {
                repairBrokenEmojisInDOM(grpModal);
                const bar = grpModal.querySelector('.nx-cmsg-emoji-bar');
                if (bar) {
                    const firstBtn = bar.querySelector('button[onclick]');
                    let m = firstBtn ? (firstBtn.getAttribute('onclick') || '').match(/'([^']+)'/) : null;
                    if (m && m[1]) appendPlusEmojiPicker(bar, m[1], false);
                }
            }
        },

        postRenderChatEnhancements: function() {
            repairDmBottomPlusAndOfficialApp();
            repairBrokenEmojisInDOM(document.body);
            document.querySelectorAll('#nx-dm-msgs-box span, #nx-room-messages span').forEach(el => {
                if (el.closest('.nx-floating-react-pill') || el.closest('.nx-group-react-pill') || el.getAttribute('onclick')) return;
                if (el.children.length === 0 && !el.classList.contains('nx-jumbo-checked')) {
                    el.classList.add('nx-jumbo-checked');
                    if (isOnlyEmojis(el.innerText)) el.classList.add('nx-jumbo-emoji-text');
                }
            });
            document.querySelectorAll('.nx-audio-player-pill').forEach(pill => {
                if (pill.querySelector('.nx-voice-speed-chip')) return;
                const audio = pill.querySelector('audio');
                if (!audio) return;
                const speedBtn = document.createElement('button');
                speedBtn.type = 'button';
                speedBtn.className = 'nx-voice-speed-chip';
                speedBtn.innerText = '1x';
                speedBtn.onclick = (e) => {
                    e.stopPropagation();
                    let nextRate = audio.playbackRate === 1 ? 1.5 : (audio.playbackRate === 1.5 ? 2 : 1);
                    audio.playbackRate = nextRate;
                    speedBtn.innerText = nextRate + 'x';
                };
                pill.appendChild(speedBtn);
            });
            decorateGroupMessagesRichMedia();
            patchPowerSongEngine();
            upgradeDmInboxAndProfileQR();
        },

        openMoodNoteModal: function() {
            let me = Nexus.getCurrentUser();
            if (!me) return;
            const modal = document.getElementById('nx-global-modal');
            let presets = ["\u{1F525} Hustling", "\u{1F3A7} Night Vibe", "\u{1F4BB} Coding", "\u{1F634} Sleeping", "\u{1F4DA} Studying", "\u{1F4AC} DM Open"];

            modal.innerHTML = `
                <div class="nx-modal-box">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h3 style="font-size:16px; color:#10b981;">\u{1F4AD} Set Your Live Mood Note</h3>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">\u2715</button>
                    </div>
                    <input type="text" id="nx-mood-in" maxlength="18" value="${me.moodNote || ''}" placeholder="Type short mood (max 18 chars)..." style="width:100%; padding:10px 12px; border-radius:10px; border:1px solid #334155; background:#090d16; color:white; font-size:14px; outline:none; margin-bottom:10px;">
                    <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:14px;">
                        ${presets.map(p => `<span onclick="document.getElementById('nx-mood-in').value='${p}'" style="background:#1e293b; border:1px solid #334155; color:#38bdf8; padding:5px 10px; border-radius:14px; font-size:11.5px; font-weight:700; cursor:pointer;">${p}</span>`).join('')}
                    </div>
                    <div style="display:flex; gap:8px;">
                        <button type="button" onclick="NexusSuperChat.saveMoodNote('')" style="flex:1; background:#1e293b; color:#f87171; border:1px solid #334155; padding:10px; border-radius:10px; font-weight:700; cursor:pointer;">Clear</button>
                        <button type="button" onclick="NexusSuperChat.saveMoodNote(document.getElementById('nx-mood-in').value)" style="flex:2; background:#10b981; color:#020617; border:none; padding:10px; border-radius:10px; font-weight:900; cursor:pointer;">Save Note \u2713</button>
                    </div>
                </div>
            `;
            modal.style.display = 'flex';
        },

        saveMoodNote: function(val) {
            let me = Nexus.getCurrentUser();
            if (!me || !Nexus.db) return;
            let clean = (val || '').trim().substring(0, 18);
            me.moodNote = clean;
            localStorage.setItem('nx_active_account', JSON.stringify(me));
            document.getElementById('nx-global-modal').style.display = 'none';

            Nexus.db.collection("nexus_accounts").doc(me.username).set({
                moodNote: clean
            }, { merge: true }).then(() => {
                decorateStoriesWithMoodNotes(true);
                Nexus.toast(clean ? `Mood set to "${clean}"!` : "Mood Note Cleared");
            });
        },

        openProfileVisitorsModal: function() {
            let me = Nexus.getCurrentUser();
            if (!me) return;
            let visitors = Array.isArray(me.recentVisitors) ? me.recentVisitors : [];
            let uList = visitors.map(v => v.username);
            if (Nexus.openUserListModal) {
                Nexus.openUserListModal('Recent Profile Visitors', uList, '');
            }
        }
    };

    // 9. HOOK INTO CHAT.JS & DM.JS
    function hookChatAndDmEvents() {
        if (window.NexusChat && !NexusChat.__nxPowerGroupHooked) {
            NexusChat.__nxPowerGroupHooked = true;

            const origMenu = NexusChat.openCommunityMsgMenu.bind(NexusChat);
            NexusChat.openCommunityMsgMenu = function(msgId) {
                origMenu(msgId);
                NexusSuperChat.upgradeEmojiReactionModals();
            };

            const origOpenChatRoom = NexusChat.openChatRoom.bind(NexusChat);
            NexusChat.openChatRoom = function(roomId) {
                currentGroupRoomId = roomId || 'casual_chat';
                origOpenChatRoom(roomId);
                setTimeout(() => {
                    upgradeCommunityGroupRoom();
                    NexusSuperChat.postRenderChatEnhancements();
                }, 40);
            };

            const origRenderMsgs = NexusChat.renderActiveRoomMessages.bind(NexusChat);
            NexusChat.renderActiveRoomMessages = function() {
                origRenderMsgs();
                setTimeout(() => {
                    NexusSuperChat.postRenderChatEnhancements();
                }, 20);
            };
        }

        if (window.NexusDM && !NexusDM.__nxSuperRepairHooked) {
            NexusDM.__nxSuperRepairHooked = true;
            const origListen = NexusDM.listenToRoom.bind(NexusDM);
            NexusDM.listenToRoom = function(myU, partU) {
                origListen(myU, partU);
                setTimeout(repairDmBottomPlusAndOfficialApp, 30);
                setTimeout(() => repairBrokenEmojisInDOM(document.body), 80);
            };
        }

        if (window.NexusPower && !NexusPower.__nxMenuRepairHooked) {
            NexusPower.__nxMenuRepairHooked = true;
            const origCleanMenu = NexusPower.openCleanHeaderMenu.bind(NexusPower);
            NexusPower.openCleanHeaderMenu = function() {
                origCleanMenu();
                setTimeout(() => repairBrokenEmojisInDOM(document.getElementById('nx-msg-action-modal')), 20);
            };
        }
    }

    if (Nexus.listeners) {
        Nexus.listeners.onUsers.push(() => {
            ensureTopHeaderAppButton();
            decorateStoriesWithMoodNotes(false);
            upgradeDmInboxAndProfileQR();
            repairBrokenEmojisInDOM(document.body);
        });
        Nexus.listeners.onPosts.push(() => {
            decorateStoriesWithMoodNotes(false);
            upgradeDmInboxAndProfileQR();
            repairBrokenEmojisInDOM(document.body);
        });
    }

    function bootEverythingClean() {
        setupRealOfficialPwaManifest();
        ensureTopHeaderAppButton();
        decorateStoriesWithMoodNotes(false);
        setupProfileViewsTracker();
        hookChatAndDmEvents();
        upgradeCommunityGroupRoom();
        repairDmBottomPlusAndOfficialApp();
        patchPowerSongEngine();
        upgradeDmInboxAndProfileQR();
        checkDirectDmUrlLink();
        repairBrokenEmojisInDOM(document.body);
    }

    document.addEventListener('DOMContentLoaded', () => {
        bootEverythingClean();
        setInterval(() => {
            repairDmBottomPlusAndOfficialApp();
            upgradeCommunityGroupRoom();
            upgradeDmInboxAndProfileQR();
            repairBrokenEmojisInDOM(document.body);
        }, 700);
    });

    setTimeout(bootEverythingClean, 200);
})();
