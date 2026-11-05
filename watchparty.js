// ================= WATCHPARTY.JS (DEDICATED YOUTUBE WATCH-PARTY MODULE): ▶️ REAL YOUTUBE VIDEO SEARCH + DIRECT LINK PLAY + REAL-TIME FIRESTORE SYNC FOR 1:1 DM & GROUP CHAT =================

(function() {
    const PROTO = 'https:' + '//';
    let wpUnsub = null;
    let activeWpRoom = '';
    let currentPlayingUrl = '';
    let isWpMinimized = false;

    function getActiveChatRoomKey(isDmExplicit) {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let myU = me && me.username ? me.username.toLowerCase().trim() : 'guest';
        const dmRoot = document.getElementById('nx-dm-dedicated-root');
        let isDm = isDmExplicit === true || (dmRoot && dmRoot.style.display !== 'none');

        if (isDm) {
            let pName = document.getElementById('nx-dm-partner-name')?.innerText || 'partner';
            let uObj = (window.Nexus && Nexus.users || []).find(u => u && ((u.name && u.name.toLowerCase() === pName.trim().toLowerCase()) || (u.username && u.username.toLowerCase() === pName.trim().toLowerCase())));
            let partnerU = uObj ? uObj.username.toLowerCase().trim() : pName.toLowerCase().replace(/[^a-z0-9_]/g, '');
            return { isDm: true, roomId: 'wp_dm_' + [myU, partnerU].sort().join('__') };
        } else {
            let rTitle = document.getElementById('nx-room-title')?.innerText || 'group';
            return { isDm: false, roomId: 'wp_grp_' + rTitle.toLowerCase().replace(/[^a-z0-9]/g, '_') };
        }
    }

    // Multi-Mirror Real YouTube Video Search (Never falls back to static Lofi list unless offline!)
    async function searchYouTubeVideosReal(query) {
        let q = (query || 'Hindi Hit Songs Video').trim();
        let results = [];

        // 1. Direct YouTube URL / Shorts / youtu.be parser
        let ytMatch = q.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
        if (ytMatch && ytMatch[1]) {
            let vid = ytMatch[1];
            return [{
                videoId: vid,
                title: "YouTube Direct Video",
                channel: "Direct Link Sync ▶️",
                thumb: `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`,
                embedUrl: `https://www.youtube.com/embed/${vid}?autoplay=1&playsinline=1` }]; }  // 2. Query Invidious & Piped CORS-enabled YouTube APIs const mirrors = [ { url: `${PROTO}inv.nadeko.net/api/v1/search?q=${encodeURIComponent(q)}&type=video`, type: 'inv' }, { url: `${PROTO}invidious.nerdvpn.de/api/v1/search?q=${encodeURIComponent(q)}&type=video`, type: 'inv' }, { url: `${PROTO}pipedapi.nosebs.ru/search?q=${encodeURIComponent(q)}&filter=videos`, type: 'piped' }, { url: `${PROTO}pipedapi.tokhmi.xyz/search?q=${encodeURIComponent(q)}&filter=videos`, type: 'piped' } ];  for (let m of mirrors) { try { let r = await fetch(m.url); if (r.ok) { let data = await r.json(); let items = m.type === 'inv' ? (Array.isArray(data) ? data : []) : (data && Array.isArray(data.items) ? data.items : []); items.slice(0, 10).forEach(v => { let vid = m.type === 'inv' ? v.videoId : ((v.url \vert{}\vert{} '').match(/v=([a-zA-Z0-9_-]{11})/) \vert{}\vert{} [])[1]; if (vid) { results.push({ videoId: vid, title: v.title \vert{}\vert{} 'YouTube Video', channel: `${v.author || v.uploaderName || 'YouTube'} • ▶️ Full Video`,
                                thumb: `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`,
                                embedUrl: `https://www.youtube.com/embed/${vid}?autoplay=1&playsinline=1` }); } }); if (results.length >= 4) break; } } catch (e) {} }  // 3. Backup HD Music Video Search via iTunes India MusicVideo API (100\% Uptime) if (results.length === 0) { try { let rIt = await fetch(`${PROTO}itunes.apple.com/search?term=${encodeURIComponent(q)}&country=IN&entity=musicVideo&limit=8`); if (rIt.ok) { let dIt = await rIt.json(); (dIt.results \vert{}\vert{} []).forEach(v => { if (v.previewUrl) { results.push({ videoId: String(v.trackId \vert{}\vert{} Math.random()), title: v.trackName \vert{}\vert{} 'Music Video', channel: `${v.artistName || 'Artist'} • 🎬 HD Music Video`,
                                thumb: (v.artworkUrl100 || '').replace('100x100', '320x180'),
                                embedUrl: v.previewUrl,
                                isMp4: true
                            });
                        }
                    });
                }
            } catch (e) {}
        }

        return results;
    }

    function ensureWatchPartyStage(isDm) {
        let stage = document.getElementById('nx-dedicated-wp-stage');
        if (!stage) {
            stage = document.createElement('div');
            stage.id = 'nx-dedicated-wp-stage';
            stage.style.cssText = "width:100%; background:#090d16; border-bottom:2px solid #ef4444; display:none; flex-direction:column; flex-shrink:0; z-index:28;";
        }
        const msgBox = isDm ? document.getElementById('nx-dm-msgs-box') : document.getElementById('nx-room-messages');
        if (msgBox && msgBox.parentNode && stage.nextSibling !== msgBox) {
            msgBox.parentNode.insertBefore(stage, msgBox);
        }
        return stage;
    }

    function syncWatchPartyStream() {
        if (!window.Nexus || !Nexus.db) return;
        const dmRoot = document.getElementById('nx-dm-dedicated-root');
        const grpRoom = document.getElementById('nx-chat-room');
        let isDm = dmRoot && dmRoot.style.display !== 'none';
        let isGrp = grpRoom && grpRoom.style.display !== 'none';
        if (!isDm && !isGrp) return;

        let ctx = getActiveChatRoomKey(isDm);
        if (ctx.roomId === activeWpRoom) return;
        activeWpRoom = ctx.roomId;

        if (wpUnsub) wpUnsub();
        wpUnsub = Nexus.db.collection("nexus_watch_party").doc(activeWpRoom).onSnapshot(doc => {
            const stage = ensureWatchPartyStage(isDm);
            if (!stage) return;
            if (!doc.exists || !doc.data().active) {
                stage.style.display = 'none';
                stage.innerHTML = '';
                currentPlayingUrl = '';
                return;
            }
            let d = doc.data();
            stage.style.display = 'flex';
            if (d.url !== currentPlayingUrl) {
                currentPlayingUrl = d.url;
                let mediaEl = d.isMp4
                    ? `<video src="${d.url}" controls autoplay playsinline style="width:100%; height:195px; background:#000;"></video>`
                    : `<iframe src="${d.url}" style="width:100%; height:195px; border:none; background:#000;" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>`;

                stage.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 12px; background:#182229; border-bottom:1px solid #2a3942;">
                        <div style="display:flex; align-items:center; gap:7px; min-width:0; flex:1;">
                            <span style="background:#ef4444; color:white; font-size:10px; font-weight:900; padding:2px 6px; border-radius:5px;">▶ LIVE TV</span>
                            <span style="font-size:12px; font-weight:800; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${(d.title \vert{}\vert{} 'Watch Party').replace(/</g, '&lt;')} • @${d.startedBy || 'member'}</span>
                        </div>
                        <div style="display:flex; gap:6px;">
                            <button type="button" onclick="NexusWatchParty.openModal(${isDm})" style="background:#1e293b; border:1px solid #38bdf8; color:#38bdf8; padding:3px 8px; border-radius:7px; font-size:10.5px; font-weight:800; cursor:pointer;">🔍 Change</button>
                            <button type="button" onclick="NexusWatchParty.toggleHide()" style="background:#1e293b; border:1px solid #334155; color:#cbd5e1; padding:3px 8px; border-radius:7px; font-size:10.5px; font-weight:800; cursor:pointer;">🔽</button>
                            <button type="button" onclick="NexusWatchParty.stop()" style="background:#ef4444; border:none; color:white; padding:3px 8px; border-radius:7px; font-size:10.5px; font-weight:900; cursor:pointer;">✕</button>
                        </div>
                    </div>
                    <div id="nx-wp-video-body">${mediaEl}</div>
                `;
            }
        }, () => {});
    }

    window.NexusWatchParty = {
        openModal: function(isDm) {
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;
            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid #ef4444; background:#090d16; padding:15px; max-width:395px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <div style="display:flex; align-items:center; gap:7px;">
                            <span style="background:#ef4444; color:white; padding:4px 9px; border-radius:8px; font-weight:900; font-size:12px;">▶ YouTube</span>
                            <strong style="color:#f8fafc; font-size:15px;">Nexus Watch-Party TV</strong>
                        </div>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>
                    <div style="display:flex; gap:6px; margin-bottom:10px;">
                        <input type="text" id="nx-wp-dedicated-in" placeholder="Search any YouTube video, song or paste link..." onkeydown="if(event.key==='Enter') NexusWatchParty.search(${Boolean(isDm)})" style="flex:1; padding:9px 12px; border-radius:10px; border:1px solid #334155; background:#111827; color:white; font-size:12.5px; outline:none;">
                        <button type="button" onclick="NexusWatchParty.search(${Boolean(isDm)})" style="background:#ef4444; color:white; border:none; padding:0 14px; border-radius:10px; font-weight:900; font-size:12px; cursor:pointer;">Search</button>
                    </div>
                    <div id="nx-wp-dedicated-results" style="display:flex; flex-direction:column; gap:7px; max-height:52vh; overflow-y:auto;"></div>
                </div>
            `;
            modal.style.display = 'flex';
            const inp = document.getElementById('nx-wp-dedicated-in');
            if (inp) inp.focus();
            this.search(Boolean(isDm), 'Arijit Singh Video Songs');
        },

        search: async function(isDm, fallbackQ) {
            const inp = document.getElementById('nx-wp-dedicated-in');
            const box = document.getElementById('nx-wp-dedicated-results');
            if (!box) return;
            let q = (inp && inp.value.trim()) ? inp.value.trim() : (fallbackQ || 'Bollywood Video Songs');
            box.innerHTML = `<div style="text-align:center; padding:16px; color:#38bdf8; font-size:12.5px; font-weight:800;">⚡ Searching YouTube Videos for "${q}"...</div>`;

            let list = await searchYouTubeVideosReal(q);
            if (!list.length) {
                box.innerHTML = `<div style="text-align:center; padding:14px; color:#94a3b8; font-size:12px;">No video found. Try another keyword or paste a YouTube link!</div>`;
                return;
            }

            box.innerHTML = list.map(v => {
                let enc = btoa(unescape(encodeURIComponent(JSON.stringify(v))));
                return `
                    <div onclick="NexusWatchParty.play('${enc}',${Boolean(isDm)})" style="display:flex; align-items:center; gap:10px; padding:8px; background:#161f33; border:1px solid #26334d; border-radius:12px; cursor:pointer;">
                        <img src="${v.thumb}" style="width:64px; height:44px; border-radius:8px; object-fit:cover; flex-shrink:0; background:#000;">
                        <div style="min-width:0; flex:1;">
                            <div style="font-weight:800; font-size:12px; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${v.title}</div>
                            <div style="font-size:10.5px; color:#fda4af;">${v.channel}</div>
                        </div>
                        <span
