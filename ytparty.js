/* ============================================================================
   ytparty.js — INSTANT SONG SEARCH, SMALL SYNC BUTTON & RELATED SONGS
   ============================================================================ */

(function() {
    const RELATED_SONGS = [
        { id: "jfKfPfyJRdk", title: "Lofi Hip Hop Radio - Study & Chill Beats" },
        { id: "5qap5aO4i9A", title: "Late Night Coding & JEE Study Lofi Mix" },
        { id: "DWcJFNfaw9c", title: "Ambient Space Music - Deep Focus" },
        { id: "4xDzrJKXOOY", title: "Synthwave Radio - High Energy Beats" }
    ];

    window.openNexusWatchParty = function(roomCodeInput) {
        const room = roomCodeInput || localStorage.getItem("nx_wp_room") || "NEXUS_ROOM_1";
        localStorage.setItem("nx_wp_room", room);

        const old = document.getElementById("nx-ytparty-win");
        if (old) old.remove();

        const win = document.createElement("div");
        win.id = "nx-ytparty-win";
        win.style.cssText = "position:fixed;inset:0;z-index:2147483646;background:var(--nx-bg, #090d16);color:var(--nx-text, #fff);display:flex;flex-direction:column;font-family:system-ui,sans-serif;";

        win.innerHTML = `
            <div style="background:var(--nx-card, #111827);padding:10px 14px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(148,163,184,0.15);">
                <div style="font-weight:800;font-size:15px;color:#f43f5e;">▶️ YouTube Watch Party (${room})</div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <button id="yt-small-sync-btn" style="background:#10b981;color:#000;border:none;padding:4px 10px;border-radius:8px;font-size:11px;font-weight:800;cursor:pointer;">🔄 Sync</button>
                    <button id="yt-room-btn" style="background:#1e293b;color:#93c5fd;border:1px solid #3b82f6;padding:4px 8px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;">Room</button>
                    <button id="yt-close-btn" style="background:#ef4444;color:#fff;border:none;padding:4px 10px;border-radius:8px;font-weight:800;cursor:pointer;">✕</button>
                </div>
            </div>

            <!-- Instant Search Bar -->
            <div style="padding:8px 12px;display:flex;gap:6px;background:var(--nx-card, #111827);">
                <input id="yt-search-in" type="text" placeholder="Search any song, lecture or paste YouTube link..." style="flex:1;padding:9px 12px;border-radius:9px;font-size:13px;outline:none;">
                <button id="yt-search-go" style="background:#e11d48;color:#fff;border:none;padding:0 14px;border-radius:9px;font-weight:700;font-size:13px;cursor:pointer;">Search</button>
            </div>

            <div id="yt-search-dropdown" style="display:none;max-height:170px;overflow-y:auto;background:#111827;padding:6px 12px;border-bottom:2px solid #e11d48;"></div>

            <!-- Video Player -->
            <div style="width:100%;height:215px;background:#000;">
                <iframe id="yt-party-iframe" width="100%" height="100%" src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&playsinline=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
            </div>

            <!-- Related Songs Horizontal Strip -->
            <div style="padding:8px 12px;background:var(--nx-card, #111827);border-bottom:1px solid rgba(148,163,184,0.12);">
                <div style="font-size:11px;font-weight:700;color:#94a3b8;margin-bottom:6px;">🎵 Related & Instant Sync Songs:</div>
                <div id="yt-related-row" style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;">
                    ${RELATED_SONGS.map(s => `
                        <button class="yt-rel-chip" data-vid="${s.id}" data-title="${s.title}" style="background:#1e293b;color:#f8fafc;border:1px solid #334155;padding:6px 10px;border-radius:10px;font-size:11px;font-weight:600;white-space:nowrap;cursor:pointer;">
                            ▶️ ${s.title}
                        </button>
                    `).join("")}
                </div>
            </div>

            <!-- Live Party Chat -->
            <div id="yt-party-chat" style="flex:1;padding:10px 12px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;"></div>
            <div style="padding:8px 12px;background:var(--nx-card, #111827);display:flex;gap:6px;">
                <input id="yt-chat-in" type="text" placeholder="Chat while watching..." style="flex:1;padding:9px 12px;border-radius:9px;font-size:13px;outline:none;">
                <button id="yt-chat-send" style="background:#4f46e5;color:#fff;border:none;padding:0 14px;border-radius:9px;font-weight:700;cursor:pointer;">Send</button>
            </div>
        `;
        document.body.appendChild(win);

        let currentVid = "jfKfPfyJRdk";
        const iframe = document.getElementById("yt-party-iframe");
        const drop = document.getElementById("yt-search-dropdown");

        function syncPlay(videoId, title) {
            currentVid = videoId;
            iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1`;
            drop.style.display = "none";
            if (window.firebase && firebase.database) {
                firebase.database().ref("watchparty_rooms/" + room + "/state").set({
                    videoId: videoId,
                    title: title || "Synced Song",
                    ts: Date.now()
                });
            }
        }

        if (window.firebase && firebase.database) {
            firebase.database().ref("watchparty_rooms/" + room + "/state").on("value", (s) => {
                const v = s.val();
                if (v && v.videoId && v.videoId !== currentVid) {
                    currentVid = v.videoId;
                    iframe.src = `https://www.youtube.com/embed/${v.videoId}?autoplay=1&playsinline=1`;
                }
            });
        }

        async function searchSong(q) {
            if (!q.trim()) return;
            const match = q.match(/(?:v=|youtu\.be\/|embed\/)([^"&?\/\s]{11})/);
            if (match && match[1]) return syncPlay(match[1], "Direct Link");

            drop.style.display = "block";
            drop.innerHTML = `<div style="color:#60a5fa;font-size:12px;padding:6px;">🔍 Searching "${q}"...</div>`;

            const apis = [
                `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(q)}&filter=videos`,
                `https://inv.tux.pizza/api/v1/search?q=${encodeURIComponent(q)}&type=video`
            ];
            for (const url of apis) {
                try {
                    const r = await fetch(url);
                    if (!r.ok) continue;
                    const d = await r.json();
                    const items = d.items || d;
                    if (Array.isArray(items) && items.length > 0) {
                        drop.innerHTML = items.slice(0, 6).map(it => {
                            const id = it.videoId || (it.url ? it.url.split("v=")[1] : "");
                            const t = (it.title || "Song").replace(/"/g, "");
                            if (!id) return "";
                            return `<div class="yt-res-row" data-id="${id}" data-t="${t}" style="display:flex;align-items:center;gap:8px;padding:6px;border-bottom:1px solid #1e293b;cursor:pointer;">
                                <img src="https://i.ytimg.com/vi/${id}/mqdefault.jpg" style="width:52px;height:36px;border-radius:6px;object-fit:cover;">
                                <div style="flex:1;font-size:12px;color:#fff;font-weight:600;">${t}</div>
                                <span style="background:#10b981;color:#000;padding:3px 7px;border-radius:6px;font-size:10px;font-weight:800;">Sync Play</span>
                            </div>`;
                        }).join("");
                        drop.querySelectorAll(".yt-res-row").forEach(row => {
                            row.onclick = () => syncPlay(row.dataset.id, row.dataset.t);
                        });
                        return;
                    }
                } catch (e) {}
            }
        }

        document.getElementById("yt-search-go").onclick = () => searchSong(document.getElementById("yt-search-in").value);
        document.getElementById("yt-search-in").onkeydown = (e) => { if (e.key === "Enter") searchSong(e.target.value); };
        document.getElementById("yt-small-sync-btn").onclick = () => syncPlay(currentVid, "Re-Sync");
        document.getElementById("yt-close-btn").onclick = () => win.remove();
        document.getElementById("yt-room-btn").onclick = () => {
            const nr = prompt("Enter Watch Party Room ID:", room);
            if (nr && nr.trim()) window.openNexusWatchParty(nr.trim().toUpperCase());
        };
        win.querySelectorAll(".yt-rel-chip").forEach(c => {
            c.onclick = () => syncPlay(c.dataset.vid, c.dataset.title);
        });
    };
})();
