// ================= MP3DJ.JS (DEDICATED MP3 FULL SONG DJ MODULE): 🎵 PURE 320KBPS MP3 AUDIO STREAMING (SEPARATE FROM YOUTUBE!) + ⏳ SLOW-INTERNET BUFFER WAIT & EXACT SEEK SYNC + ⚡ 1x/1.25x/1.5x SPEED + 🔥 RELATED MP3 SONGS STRIP + 🔽 SHOW/HIDE DECK =================

(function() {
    const PROTO = 'https:' + '//';
    let activeMp3RoomKey = '';
    let mp3SyncUnsub = null;
    let currentMp3Url = '';
    let isMp3Minimized = false;
    let isRemoteAudioUpdate = false;
    let relatedMp3List = [];
    let currentSpeed = 1;

    const mp3Style = document.createElement('style');
    mp3Style.innerHTML = `
        #nx-mp3dj-dock {
            background: linear-gradient(135deg, #090d16, #064e3b);
            border-bottom: 2px solid #10b981; width: 100%;
            flex-shrink: 0; z-index: 31; display: none; flex-direction: column;
        }
        @keyframes nxSpinVinyl {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .nx-vinyl-disc {
            width: 46px; height: 46px; border-radius: 50%; object-fit: cover;
            border: 2px solid #10b981; animation: nxSpinVinyl 6s linear infinite; flex-shrink: 0;
        }
        .nx-mp3-btn {
            background: #1e293b; border: 1px solid #334155; color: #f8fafc;
            padding: 4px 8px; border-radius: 8px; font-size: 10.5px; font-weight: 800; cursor: pointer;
        }
        .nx-mp3-rel-strip {
            display: flex; gap: 7px; overflow-x: auto; padding: 6px 10px;
            background: #050811; border-top: 1px solid #1e293b; scrollbar-width: none;
        }
        .nx-mp3-rel-chip {
            display: flex; align-items: center; gap: 7px; min-width: 175px; max-width: 175px;
            background: #111827; border: 1px solid #10b981; border-radius: 10px;
            padding: 5px 7px; cursor: pointer; flex-shrink: 0;
        }
    `;
    document.head.appendChild(mp3Style);

    function getMp3RoomKey(isDmExplicit) {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let myU = me && me.username ? me.username.toLowerCase().trim() : 'guest';
        const dmRoot = document.getElementById('nx-dm-dedicated-root');
        const isDm = isDmExplicit === true || (dmRoot && dmRoot.style.display !== 'none');
        if (isDm) {
            let pName = document.getElementById('nx-dm-partner-name')?.innerText || '';
            let uObj = (Nexus.users || []).find(u => u && ((u.name && u.name.toLowerCase() === pName.trim().toLowerCase()) || (u.username && u.username.toLowerCase() === pName.trim().toLowerCase())));
            let pU = uObj ? uObj.username.toLowerCase().trim() : pName.toLowerCase().replace(/[^a-z0-9_]/g, '');
            return { isDm: true, roomKey: 'mp3_dm_' + [myU, pU].sort().join('__') };
        }
        let rTitle = document.getElementById('nx-room-title')?.innerText || 'Study Room';
        return { isDm: false, roomKey: 'mp3_grp_' + rTitle.toLowerCase().replace(/[^a-z0-9]/g, '_') };
    }

    async function searchFullMp3Songs(query) {
        let q = (query || 'Arijit Singh Hindi Songs').trim();
        let list = [];
        let seen = new Set();

        const saavnRaw = `${PROTO}saavn.dev/api/search/songs?query=${encodeURIComponent(q)}&limit=12`;
        const endpoints = [
            saavnRaw,
            `${PROTO}jiosaavn-api-privatecvc2.vercel.app/search/songs?query=${encodeURIComponent(q)}&limit=12`,
            `${PROTO}api.codetabs.com/v1/proxy?quest=${encodeURIComponent(saavnRaw)}`
        ];

        for (let url of endpoints) {
            try {
                let r = await fetch(url);
                if (r.ok) {
                    let d = await r.json();
                    let arr = (d && d.data && Array.isArray(d.data.results)) ? d.data.results : (d && Array.isArray(d.results) ? d.results : []);
                    arr.forEach(s => {
                        let dl = s.downloadUrl || [];
                        let best = dl.length ? (dl[dl.length - 1].url || dl[dl.length - 1].link) : '';
                        let im = s.image || [];
                        let th = im.length ? (im[im.length - 1].url || im[im.length - 1].link) : '';
                        if (best && !seen.has(best)) {
                            seen.add(best);
                            list.push({
                                title: (s.name || s.title || 'MP3 Song').replace(/&quot;/g, '"'),
                                artist: `${s.primaryArtists || s.artists?.primary?.[0]?.name || 'Bollywood'} • 🎵 Full MP3`,
                                thumb: th,
                                audioUrl: best
                            });
                        }
                    });
                    if (list.length >= 6) break;
                }
            } catch (e) {}
        }

        if (list.length < 4) {
            try {
                let rIt = await fetch(`${PROTO}itunes.apple.com/search?term=${encodeURIComponent(q)}&country=IN&media=music&limit=10`);
                if (rIt.ok) {
                    let dIt = await rIt.json();
                    (dIt.results || []).forEach(v => {
                        if (v.previewUrl && !seen.has(v.previewUrl)) {
                            seen.add(v.previewUrl);
                            list.push({
                                title: v.trackName || 'MP3 Track',
                                artist: `${v.artistName || 'Artist'} • 🎵 MP3 Audio`,
                                thumb: (v.artworkUrl100 || '').replace('100x100', '300x300'),
                                audioUrl: v.previewUrl
                            });
                        }
                    });
                }
            } catch (e) {}
        }
        return list;
    }

    function broadcastMp3State(playState, curSec) {
        if (isRemoteAudioUpdate || !activeMp3RoomKey || !Nexus.db) return;
        let me = Nexus.getCurrentUser();
        const aud = document.getElementById('nx-mp3-master-audio');
        let sec = typeof curSec === 'number' ? curSec : (aud ? aud.currentTime : 0);

        Nexus.db.collection("nexus_mp3_dj").doc(activeMp3RoomKey).set({
            playState: playState, // 'PLAYING' | 'PAUSED' | 'BUFFERING'
            currentTime: Math.max(0, Math.round(sec)),
            updatedBy: me ? me.username : 'member',
            updatedAt: Date.now()
        }, { merge: true }).catch(() => {});
    }

    function renderMp3DjDock(docData, isDm) {
        let dock = document.getElementById('nx-mp3dj-dock');
        if (!dock) {
            dock = document.createElement('div');
            dock.id = 'nx-mp3dj-dock';
        }
        const msgBox = isDm ? document.getElementById('nx-dm-msgs-box') : document.getElementById('nx-room-messages');
        if (msgBox && msgBox.parentNode && dock.nextSibling !== msgBox) {
            msgBox.parentNode.insertBefore(dock, msgBox);
        }

        if (!docData || !docData.active || !docData.audioUrl) {
            dock.style.display = 'none';
            dock.innerHTML = '';
            currentMp3Url = '';
            return;
        }

        dock.style.display = 'flex';
        let relSongs = Array.isArray(docData.related) && docData.related.length ? docData.related : relatedMp3List;

        if (docData.audioUrl !== currentMp3Url) {
            currentMp3Url = docData.audioUrl;
            dock.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:#064e3b; border-bottom:1px solid #10b981;">
                    <div style="display:flex; align-items:center; gap:7px; min-width:0; flex:1;">
                        <span style="background:#10b981; color:#020617; font-size:10px; font-weight:900; padding:2px 6px; border-radius:6px;">MP3 DJ</span>
                        <span style="font-size:12px; font-weight:900; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">🎵 ${(docData.title || 'MP3 Song').replace(/</g, '&lt;')}</span>
                    </div>
                    <div style="display:flex; gap:5px; flex-shrink:0;">
                        <button type="button" class="nx-mp3-btn" style="border-color:#5eead4; color:#5eead4;" onclick="NexusMP3DJ.openModal(${isDm})">🔍 Songs</button>
                        <button type="button" id="nx-mp3-hide-btn" class="nx-mp3-btn" onclick="NexusMP3DJ.toggleMinimize()">🔽 Hide</button>
                        <button type="button" class="nx-mp3-btn" style="background:#ef4444; border:none; color:white;" onclick="NexusMP3DJ.stopDj()">✕</button>
                    </div>
                </div>

                <div id="nx-mp3-collapsible-body" style="display:${isMp3Minimized ? 'none' : 'flex'}; flex-direction:column;">
                    <div style="display:flex; align-items:center; gap:10px; padding:9px 12px; background:#090d16;">
                        <img src="${docData.thumb || 'https://placehold.co/80x80/10b981/020617?text=MP3'}" class="nx-vinyl-disc">
                        <div style="flex:1; min-width:0;">
                            <div id="nx-mp3-sync-status" style="font-size:10.5px; color:#10b981; font-weight:800; margin-bottom:3px;">🟢 Synced MP3 • @${docData.startedBy || 'member'}</div>
                            <audio id="nx-mp3-master-audio" src="${docData.audioUrl}" controls autoplay style="width:100%; height:32px;"></audio>
                        </div>
                        <button type="button" class="nx-mp3-btn" onclick="NexusMP3DJ.cycleSpeed(this)">1x</button>
                    </div>

                    <div style="padding:4px 10px 2px; background:#050811; font-size:10px; font-weight:900; color:#6ee7b7;">🎵 RELATED MP3 SONGS (1-TAP PLAY):</div>
                    <div class="nx-mp3-rel-strip">
                        ${relSongs.map(s => {
                            let enc = btoa(unescape(encodeURIComponent(JSON.stringify(s))));
                            return `
                                <div class="nx-mp3-rel-chip" onclick="NexusMP3DJ.playSong('${enc}', ${isDm})">
                                    <img src="${s.thumb}" style="width:32px; height:32px; border-radius:6px; object-fit:cover; flex-shrink:0;">
                                    <div style="min-width:0; flex:1;">
                                        <div style="font-size:10.5px; font-weight:800; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${(s.title || '').replace(/</g, '&lt;')}</div>
                                        <div style="font-size:9.5px; color:#10b981; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Play Next ▶</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;

            const aud = document.getElementById('nx-mp3-master-audio');
            if (aud) {
                aud.onplay = () => { if (!isRemoteAudioUpdate) broadcastMp3State('PLAYING', aud.currentTime); };
                aud.onpause = () => { if (!isRemoteAudioUpdate && !aud.seeking) broadcastMp3State('PAUSED', aud.currentTime); };
                aud.onseeked = () => { if (!isRemoteAudioUpdate) broadcastMp3State(aud.paused ? 'PAUSED' : 'PLAYING', aud.currentTime); };
                aud.onwaiting = () => { if (!isRemoteAudioUpdate) broadcastMp3State('BUFFERING', aud.currentTime); };
                aud.oncanplay = () => { if (!isRemoteAudioUpdate && !aud.paused) broadcastMp3State('PLAYING', aud.currentTime); };
                aud.onended = () => {
                    if (relSongs.length > 1) {
                        let nextSong = relSongs.find(x => x.audioUrl !== currentMp3Url) || relSongs[0];
                        let enc = btoa(unescape(encodeURIComponent(JSON.stringify(nextSong))));
                        NexusMP3DJ.playSong(enc, isDm);
                    }
                };
            }
        } else {
            // Two-Way Exact Timestamp, Seek, Pause & Buffer Wait Sync!
            const aud = document.getElementById('nx-mp3-master-audio');
            const statusEl = document.getElementById('nx-mp3-sync-status');
            if (!aud) return;

            let elapsed = Math.max(0, (Date.now() - (docData.updatedAt || Date.now())) / 1000);
            let targetTime = (docData.currentTime || 0) + (docData.playState === 'PLAYING' ? elapsed : 0);

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

            isRemoteAudioUpdate = true;
            if (Math.abs((aud.currentTime || 0) - targetTime) > 2.5) {
                try { aud.currentTime = targetTime; } catch (e) {}
            }
            if (docData.playState === 'PAUSED' || docData.playState === 'BUFFERING') {
                if (!aud.paused) aud.pause();
            } else if (docData.playState === 'PLAYING') {
                if (aud.paused) aud.play().catch(() => {});
            }
            setTimeout(() => { isRemoteAudioUpdate = false; }, 450);
        }
    }

    function connectMp3DjWatcher() {
        if (!window.Nexus || !Nexus.db) return;
        const dmRoot = document.getElementById('nx-dm-dedicated-root');
        const grpRoom = document.getElementById('nx-chat-room');
        let isDm = dmRoot && dmRoot.style.display !== 'none';
        let isGrp = grpRoom && grpRoom.style.display !== 'none';
        if (!isDm && !isGrp) return;

        let ctx = getMp3RoomKey(isDm);
        if (ctx.roomKey === activeMp3RoomKey) return;
        activeMp3RoomKey = ctx.roomKey;

        if (mp3SyncUnsub) mp3SyncUnsub();
        mp3SyncUnsub = Nexus.db.collection("nexus_mp3_dj").doc(activeMp3RoomKey).onSnapshot(doc => {
            renderMp3DjDock(doc.exists ? doc.data() : null, isDm);
        }, () => {});
    }

    window.NexusMP3DJ = {
        openModal: function(isDm) {
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;
            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid #10b981; background:#090d16; padding:14px; max-width:395px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <strong style="color:#10b981; font-size:15px;">🎵 Nexus MP3 Song DJ (Full Audio Sync)</strong>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>
                    <p style="font-size:11px; color:#6ee7b7; margin-bottom:8px;">Pure MP3 Audio — jitna aap gaana aage badhayenge, dost ke phone mein bhi utna hi aage badhega!</p>
                    <div style="display:flex; gap:6px; margin-bottom:10px;">
                        <input type="text" id="nx-mp3-in" placeholder="Search any Hindi MP3 song (e.g. Arijit Singh)..." onkeydown="if(event.key==='Enter') NexusMP3DJ.search(${Boolean(isDm)})" style="flex:1; padding:9px 12px; border-radius:10px; border:1px solid #334155; background:#111827; color:white; font-size:12.5px; outline:none;">
                        <button type="button" onclick="NexusMP3DJ.search(${Boolean(isDm)})" style="background:#10b981; color:#020617; border:none; padding:0 14px; border-radius:10px; font-weight:900; font-size:12px; cursor:pointer;">Search</button>
                    </div>
                    <div id="nx-mp3-results" style="display:flex; flex-direction:column; gap:7px; max-height:52vh; overflow-y:auto;"></div>
                </div>
            `;
            modal.style.display = 'flex';
            const inp = document.getElementById('nx-mp3-in');
            if (inp) inp.focus();
            this.search(Boolean(isDm), 'Arijit Singh Hits');
        },

        search: async function(isDm, fallbackQ) {
            const inp = document.getElementById('nx-mp3-in');
            const box = document.getElementById('nx-mp3-results');
            if (!box) return;
            let q = (inp && inp.value.trim()) ? inp.value.trim() : (fallbackQ || 'Bollywood Top Songs');
            box.innerHTML = `<div style="text-align:center; padding:16px; color:#10b981; font-size:12.5px; font-weight:800;">🎵 Searching MP3 Songs for "${q}"...</div>`;

            let list = await searchFullMp3Songs(q);
            relatedMp3List = list.slice(0, 8);

            box.innerHTML = list.map(s => {
                let enc = btoa(unescape(encodeURIComponent(JSON.stringify(s))));
                return `
                    <div onclick="NexusMP3DJ.playSong('${enc}', ${Boolean(isDm)})" style="display:flex; align-items:center; gap:10px; padding:8px; background:#161f33; border:1px solid #26334d; border-radius:12px; cursor:pointer;">
                        <img src="${s.thumb}" style="width:46px; height:46px; border-radius:10px; object-fit:cover; flex-shrink:0;">
                        <div style="min-width:0; flex:1;">
                            <div style="font-weight:800; font-size:12px; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${s.title}</div>
                            <div style="font-size:10.5px; color:#10b981; font-weight:700;">${s.artist}</div>
                        </div>
                        <span style="background:#10b981; color:#020617; padding:5px 10px; border-radius:8px; font-size:10.5px; font-weight:900; flex-shrink:0;">Play MP3 🎵</span>
                    </div>
                `;
            }).join('');
        },

        playSong: async function(encSong, isDm) {
            const modal = document.getElementById('nx-global-modal');
            if (modal) modal.style.display = 'none';
            let item = null;
            try { item = JSON.parse(decodeURIComponent(escape(atob(encSong)))); } catch (e) { return; }
            let me = Nexus.getCurrentUser();
            if (!me || !Nexus.db || !item) return;

            let ctx = getMp3RoomKey(isDm);
            activeMp3RoomKey = ctx.roomKey;
            isMp3Minimized = false;

            await Nexus.db.collection("nexus_mp3_dj").doc(ctx.roomKey).set({
                active: true,
                title: item.title || 'MP3 Song',
                artist: item.artist || '',
                thumb: item.thumb || '',
                audioUrl: item.audioUrl,
                playState: 'PLAYING',
                currentTime: 0,
                related: relatedMp3List.slice(0, 8),
                startedBy: me.username,
                updatedBy: me.username,
                updatedAt: Date.now()
            });
            Nexus.toast(`🎵 MP3 DJ Playing: "${item.title}"`);
        },

        cycleSpeed: function(btn) {
            const speeds = [1, 1.25, 1.5];
            currentSpeed = speeds[(speeds.indexOf(currentSpeed) + 1) % speeds.length];
            if (btn) btn.innerText = currentSpeed + 'x';
            const aud = document.getElementById('nx-mp3-master-audio');
            if (aud) aud.playbackRate = currentSpeed;
        },

        toggleMinimize: function() {
            isMp3Minimized = !isMp3Minimized;
            const body = document.getElementById('nx-mp3-collapsible-body');
            const btn = document.getElementById('nx-mp3-hide-btn');
            if (body) body.style.display = isMp3Minimized ? 'none' : 'flex';
            if (btn) btn.innerText = isMp3Minimized ? '🔼 Show' : '🔽 Hide';
        },

        stopDj: function() {
            if (Nexus.db && activeMp3RoomKey) {
                Nexus.db.collection("nexus_mp3_dj").doc(activeMp3RoomKey).set({ active: false }, { merge: true }).catch(() => {});
            }
            const dock = document.getElementById('nx-mp3dj-dock');
            if (dock) { dock.style.display = 'none'; dock.innerHTML = ''; }
            currentMp3Url = '';
        }
    };

    // Hook Song DJ buttons exclusively to NexusMP3DJ (Separate from YouTube Watch-Party!)
    function bindMp3DjHooks() {
        connectMp3DjWatcher();
        if (window.NexusPower) NexusPower.openSongSearchModal = () => window.NexusMP3DJ.openModal(true);
        if (window.NexusSuperChat) NexusSuperChat.openGroupSongModal = () => window.NexusMP3DJ.openModal(false);
    }

    setInterval(bindMp3DjHooks, 900);
    setTimeout(bindMp3DjHooks, 150);
})(); // === END OF MP3DJ.JS ===
