// ============================================================================
// DM.JS (NEXUS v3.0 FINAL MASTER — SINGLE BLOCK, 100% SUPABASE REALTIME)
// True E2EE + 50MB Media + View-Once Burn + Exact Reactions + Full ⋮ Super Menu
// ============================================================================
(function () {
    let activeDmPartner = null, activeConvId = null, activePeerProfile = null;
    let unsubMessages = null, unsubInbox = null, roomChannel = null;
    let dmMessagesCache = [], decryptedCache = new Map(), signedUrlCache = new Map();
    let dmReplyingTo = null, dmEditingId = null, searchQuery = "";
    let unreadCountsByUser = {}, lastMsgByUser = {};
    let lastTypingPingAt = 0, typingHideTimer = null, savedScrollY = 0, loadedLimit = 50;
    let disappearingSeconds = 0, pinnedNotice = "", currentWallpaper = "default";
    let isRecordingVoice = false, voiceRecorder = null, voiceChunks = [], voiceRecTimer = null, voiceRecStart = 0;
    let pomoTimer = null, pomoRemaining = 0;
    let rtcPc = null, rtcLocalStream = null;
    let currentStickerCat = "trending";

    const normU = (u) => String(u || "").toLowerCase().replace(/^@/, "").trim();
    const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const getMe = () => (window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null);
    const getSec = () => window.NexusSecurity || null;

    if (!document.getElementById("nx-dm-v3-style")) {
        const st = document.createElement("style");
        st.id = "nx-dm-v3-style";
        st.textContent = `
            #nx-dm-dedicated-root{position:fixed!important;left:0;right:0;top:0;width:100%;max-width:640px;height:100dvh;margin:0 auto;background:#0b141a;display:none;flex-direction:column;z-index:99992;overflow:hidden;box-shadow:0 0 50px rgba(0,0,0,.92)}
            #nx-dm-v2-msgs-box{flex:1 1 0%;min-height:0;overflow-y:auto;padding:12px 10px 18px;display:flex;flex-direction:column;gap:9px;background:#0b141a;position:relative;transition:background .25s}
            .nx-dm-date-pill{align-self:center;margin:6px auto 4px;padding:4px 12px;border-radius:999px;background:#182229;border:1px solid #2a3942;color:#93c5fd;font-size:10.5px;font-weight:800;flex-shrink:0}
            .nx-dm-load-older-btn{align-self:center;margin:2px auto 8px;padding:6px 14px;border-radius:999px;background:#1e293b;border:1px solid #38bdf8;color:#38bdf8;font-size:11.5px;font-weight:800;cursor:pointer;flex-shrink:0}
            .nx-dm-offline-strip{display:none;padding:5px 12px;background:#7c2d12;color:#fed7aa;font-size:11.5px;font-weight:800;text-align:center;flex-shrink:0}
            .nx-dm-row{width:100%;display:flex;flex-direction:column;position:relative;flex-shrink:0}
            .nx-dm-card{max-width:82%;min-width:98px;padding:7px 10px 12px;border-radius:14px;color:#e9edef;font-size:14.5px;line-height:1.4;word-break:break-word;position:relative;box-shadow:0 3px 10px rgba(0,0,0,.35)}
            .nx-dm-card.mine{background:#005c4b;border-top-right-radius:3px;border:1px solid rgba(16,185,129,.28)}
            .nx-dm-card.theirs{background:#202c33;border-top-left-radius:3px;border:1px solid rgba(71,85,105,.35)}
            .nx-dm-dots-trigger{position:absolute;bottom:-10px;right:7px;width:28px;height:22px;border-radius:11px;background:#090d16;border:1px solid #334155;color:#cbd5e1;font-size:14px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;z-index:6;line-height:1}
            .nx-dm-react-pill{display:inline-flex;align-items:center;gap:4px;background:#111b21;border:1px solid #2a3942;padding:2px 8px;border-radius:999px;font-size:11.5px;color:#f8fafc;margin-top:4px;cursor:pointer}
            .nx-dm-deleted-pill{background:rgba(24,34,41,.92);border:1px dashed rgba(248,113,113,.5);color:#cbd5e1;padding:6px 12px;border-radius:10px;font-size:12px;font-style:italic}
            .nx-dm-sheet-bg{position:fixed;inset:0;background:rgba(2,6,23,.85);z-index:285000;display:none;align-items:center;justify-content:center;padding:16px}
            .nx-dm-sheet-box{width:100%;max-width:350px;background:#182229;border:1.5px solid #10b981;border-radius:20px;padding:14px;box-shadow:0 20px 50px rgba(0,0,0,.92);color:#fff;max-height:85dvh;overflow-y:auto}
            .nx-dm-emoji-row{display:flex;justify-content:space-between;align-items:center;background:#111b21;padding:7px 10px;border-radius:999px;margin-bottom:10px;border:1px solid #233138}
            .nx-dm-emoji-row button{font-size:22px;background:none;border:none;cursor:pointer;padding:2px}
            .nx-dm-opt{width:100%;background:#202c33;border:1px solid #2a3942;color:#e9edef;padding:10px 12px;border-radius:12px;font-size:13px;font-weight:700;text-align:left;display:flex;align-items:center;gap:10px;margin-bottom:7px;cursor:pointer}
            .nx-dm-tools-dock{display:none;grid-template-columns:repeat(4,1fr);gap:7px;padding:10px;background:#111b21;border-top:1.5px solid #00a884;flex-shrink:0}
            .nx-dm-tool-tile{background:#182229;border:1px solid #2a3942;border-radius:12px;padding:9px 4px;color:#f8fafc;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:10.5px;font-weight:800;cursor:pointer}
            .nx-unread-pill{background:#00a884;color:#020617;font-size:10.5px;font-weight:900;padding:2px 8px;border-radius:12px}
            .nx-stk-chip{background:#182229;color:#cbd5e1;border:1px solid #2a3942;padding:5px 11px;border-radius:16px;font-size:11.5px;font-weight:700;white-space:nowrap;cursor:pointer}
            .nx-stk-chip.active{background:#00a884;color:#020617;border-color:#00a884}
        `;
        document.head.appendChild(st);
    }

    const WALLPAPERS = {
        default: "#0b141a",
        midnight: "linear-gradient(180deg,#020617,#0f172a)",
        emerald: "linear-gradient(180deg,#022c22,#064e3b)",
        ocean: "linear-gradient(180deg,#0c4a6e,#0f172a)",
        royal: "linear-gradient(180deg,#1e1b4b,#090d16)"
    };

    const STICKERS = [
        { c: "1f525", l: "Fire", g: "trending" }, { c: "1f680", l: "Rocket", g: "trending" }, { c: "1f4af", l: "100%", g: "trending" }, { c: "1f451", l: "King", g: "trending" },
        { c: "1f602", l: "Joy", g: "funny" }, { c: "1f923", l: "ROFL", g: "funny" }, { c: "1f62d", l: "Cry", g: "funny" }, { c: "1f480", l: "Skull", g: "funny" },
        { c: "1f9e0", l: "Brain", g: "study" }, { c: "1f913", l: "Topper", g: "study" }, { c: "1f4a1", l: "Idea", g: "study" }, { c: "2764_fe0f", l: "Heart", g: "love" },
        { c: "1f60d", l: "Love", g: "love" }, { c: "1f44d", l: "Like", g: "love" }, { c: "1f64f", l: "Namaste", g: "love" }
    ];

    const hiddenKey = (u) => "nx_dm_v2_hidden_" + normU(u || "guest");
    const getHiddenSet = (u) => { try { return new Set(JSON.parse(localStorage.getItem(hiddenKey(u)) || "[]")); } catch (e) { return new Set(); } };
    const saveHiddenId = (u, id) => { const s = getHiddenSet(u); s.add(String(id)); try { localStorage.setItem(hiddenKey(u), JSON.stringify(Array.from(s).slice(-1500))); } catch (e) {} };

    function saveConvCache(cid, rows) {
        if (!cid || !Array.isArray(rows)) return;
        try {
            localStorage.setItem("nx_dm_cache_" + cid, JSON.stringify(rows.slice(-45).map((r) => ({
                id: r.id, sender_id: r.sender_id, receiver_id: r.receiver_id, created_at: r.created_at,
                seen: r.seen, is_edited: r.is_edited, is_deleted_everyone: r.is_deleted_everyone,
                is_view_once: r.is_view_once, view_once_opened: r.view_once_opened, reactions: r.reactions || {},
                reply_to: r.reply_to || null, expires_at: r.expires_at || null, _dec: decryptedCache.get(r.id) || null
            }))));
        } catch (e) {}
    }

    function loadConvCache(cid) {
        try {
            const arr = JSON.parse(localStorage.getItem("nx_dm_cache_" + cid) || "[]");
            if (!Array.isArray(arr)) return [];
            arr.forEach((r) => { if (r && r.id && r._dec) decryptedCache.set(r.id, r._dec); });
            return arr;
        } catch (e) { return []; }
    }

    const fmtLinks = (s) => esc(s || "").replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" onclick="event.stopPropagation()" style="color:#53bdeb;text-decoration:underline;font-weight:700;">$1</a>');
    const fmtDate = (iso) => {
        const d = new Date(iso || Date.now()); if (isNaN(d)) return "Today";
        const n = new Date(), diff = Math.round((Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) - Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
        return diff <= 0 ? "Today" : diff === 1 ? "Yesterday" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    };
    const fmtTime = (iso) => { const d = new Date(iso || Date.now()); return isNaN(d) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); };
    const fmtRx = (obj) => {
        if (!obj || typeof obj !== "object") return "";
        const c = {}; Object.values(obj).filter(Boolean).forEach((e) => { c[e] = (c[e] || 0) + 1; });
        return Object.entries(c).map(([e, n]) => (n > 1 ? `${esc(e)} ${n}` : esc(e))).join(" ");
    };
    const isOnline = (u) => { const me = getMe(); return u && ((me && normU(u.username) === normU(me.username)) || (u.lastOnline > 0 && Date.now() - Number(u.lastOnline) < 120000)); };
    const fmtSeen = (u) => {
        if (!u) return "🔐 True E2EE";
        if (isOnline(u)) return "🟢 Online • 🔐 E2EE";
        const ts = Number(u.lastSeenAt || u.lastOnline || 0);
        if (!ts) return "🔐 End-to-End Encrypted";
        const m = Math.max(1, Math.floor((Date.now() - ts) / 60000));
        return m < 60 ? `Last seen ${m}m ago` : m < 1440 ? `Last seen ${Math.floor(m / 60)}h ago` : `Last seen ${Math.floor(m / 1440)}d ago`;
    };

    function syncViewport() {
        const root = document.getElementById("nx-dm-dedicated-root");
        if (!root || root.style.display === "none") return;
        const vv = window.visualViewport;
        root.style.height = Math.max(200, Math.round(vv ? vv.height : window.innerHeight)) + "px";
        root.style.top = Math.max(0, Math.round(vv ? vv.offsetTop : 0)) + "px";
        const b = document.getElementById("nx-dm-v2-msgs-box");
        if (b) b.scrollTop = b.scrollHeight;
    }
    if (window.visualViewport) { window.visualViewport.addEventListener("resize", syncViewport); window.visualViewport.addEventListener("scroll", syncViewport); }
    window.addEventListener("resize", syncViewport);
    window.addEventListener("online", () => { const e = document.getElementById("nx-dm-offline-strip"); if (e) e.style.display = "none"; });
    window.addEventListener("offline", () => { const e = document.getElementById("nx-dm-offline-strip"); if (e) e.style.display = "block"; });

    const ensureRoot = () => { let r = document.getElementById("nx-dm-dedicated-root"); if (!r) { r = document.createElement("div"); r.id = "nx-dm-dedicated-root"; document.body.appendChild(r); } return r; };
    const ensureSheet = () => { let s = document.getElementById("nx-dm-v2-action-sheet"); if (!s) { s = document.createElement("div"); s.id = "nx-dm-v2-action-sheet"; s.className = "nx-dm-sheet-bg"; s.onclick = (e) => { if (e.target === s) s.style.display = "none"; }; document.body.appendChild(s); } return s; };

    function resizeInput() {
        const inp = document.getElementById("nx-dm-input");
        if (inp) { inp.style.height = "36px"; inp.style.height = Math.min(inp.scrollHeight, 105) + "px"; }
    }

    function applyWallpaper(key) {
        currentWallpaper = key || "default";
        if (activeConvId) localStorage.setItem("nx_wp_" + activeConvId, currentWallpaper);
        const box = document.getElementById("nx-dm-v2-msgs-box");
        if (box) box.style.background = WALLPAPERS[currentWallpaper] || WALLPAPERS.default;
    }

    function renderPinnedBar() {
        const bar = document.getElementById("nx-dm-pinned-bar");
        if (!bar) return;
        if (!pinnedNotice) { bar.style.display = "none"; return; }
        bar.style.display = "flex";
        bar.innerHTML = `<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;">📌 <b>Pinned:</b> ${esc(pinnedNotice)}</span><button type="button" onclick="NexusDM.setPinnedNotice('')" style="background:none;border:none;color:#94a3b8;cursor:pointer;margin-left:8px;">✕</button>`;
    }

    async function hydrateRow(row, meId, peerPub) {
        const sec = getSec(); if (!sec || !row) return null;
        let dec = decryptedCache.get(row.id);
        if (!dec || row.is_deleted_everyone || row.view_once_opened || row.is_edited) {
            dec = await sec.decryptMessageRow(row, meId, peerPub);
            decryptedCache.set(row.id, dec);
        }
        if (dec && !dec.deleted && dec.mediaPath && !(dec.viewOnce && dec.viewOnceOpened) && !signedUrlCache.has(dec.mediaPath)) {
            const url = await sec.getSignedChatMediaUrl(dec.mediaPath, 3600);
            if (url) signedUrlCache.set(dec.mediaPath, url);
        }
        return dec;
    }

    async function renderMessages() {
        const box = document.getElementById("nx-dm-v2-msgs-box");
        const me = getMe();
        if (!box || !me) return;
        const nearBottom = (box.scrollHeight - box.scrollTop - box.clientHeight) < 130;
        const hidden = getHiddenSet(me.username);
        const q = searchQuery.toLowerCase().trim();

        const list = dmMessagesCache.filter((r) => {
            if (!q) return true;
            const d = decryptedCache.get(r.id);
            return d && d.text && d.text.toLowerCase().includes(q);
        });

        if (!list.length) {
            box.innerHTML = `<div style="margin:auto;text-align:center;color:#8696a0;font-size:12.5px;background:#182229;border:1px solid #2a3942;padding:16px;border-radius:16px;max-width:290px;">${q ? `🔍 No messages matching "${esc(q)}"` : `🔐 <b>End-to-End Encrypted Chat</b><br><span style="font-size:11px;color:#34d399;">Photos, 50MB Videos, Calls, Watch Party &amp; View-Once ready!</span>`}</div>`;
            return;
        }

        const parts = [];
        if (!q && dmMessagesCache.length >= loadedLimit) parts.push(`<button type="button" class="nx-dm-load-older-btn" onclick="NexusDM.loadOlderMessages()">⬆️ Load Older Messages</button>`);
        let lastDate = "";

        for (const row of list) {
            const msgId = String(row.id);
            const dLbl = fmtDate(row.created_at);
            if (dLbl !== lastDate) { lastDate = dLbl; parts.push(`<div class="nx-dm-date-pill">${esc(dLbl)}</div>`); }
            const isMine = row.sender_id === me.id;
            if (!row.is_deleted_everyone && hidden.has(msgId)) continue;
            const dec = decryptedCache.get(msgId) || { deleted: row.is_deleted_everyone, text: "" };
            const align = isMine ? "flex-end" : "flex-start";

            if (row.is_deleted_everyone || dec.deleted) {
                parts.push(`<div class="nx-dm-row nx-dm-bubble-anim" style="align-items:${align};"><div class="nx-dm-deleted-pill">${dec.expired ? "⏱️ Disappearing message expired" : "🚫 This message was deleted"}</div></div>`);
                continue;
            }

            const tick = isMine ? `<span style="color:${row.seen ? "#53bdeb" : "#94a3b8"};font-weight:900;margin-left:3px;">${row._sending ? "⏳" : (row.seen ? "✓✓" : "✓")}</span>` : "";
            const rxStr = fmtRx(row.reactions);
            const rxPill = rxStr ? `<div class="nx-dm-react-pill" onclick="event.stopPropagation();NexusDM.showReactionDetails('${esc(msgId)}')">${rxStr}</div>` : "";
            const replyHtml = row.reply_to ? `<div style="background:rgba(0,0,0,.28);border-left:3px solid #10b981;padding:4px 8px;border-radius:6px;font-size:11.5px;color:#cbd5e1;margin-bottom:5px;"><b>@${esc(row.reply_to.sender || "")}:</b> ${esc(row.reply_to.text || "")}</div>` : "";

            let mediaHtml = "";
            const mUrl = row._localUrl || (dec.mediaPath ? signedUrlCache.get(dec.mediaPath) || "" : "");
            if (dec.viewOnce || row.is_view_once) {
                mediaHtml = (dec.viewOnceOpened || row.view_once_opened)
                    ? `<div style="padding:9px 12px;border-radius:11px;background:#0f172a;border:1px solid #334155;color:#94a3b8;font-size:12px;font-weight:700;">1️⃣ Opened &amp; Burned 🔥</div>`
                    : `<button type="button" onclick="event.stopPropagation();NexusDM.openViewOnce('${esc(msgId)}')" style="width:100%;padding:10px 14px;border-radius:12px;background:linear-gradient(135deg,#0c4a6e,#1e3a8a);border:1.5px solid #38bdf8;color:#e0f2fe;font-weight:800;font-size:12.5px;display:flex;align-items:center;gap:10px;cursor:pointer;text-align:left;"><span style="width:24px;height:24px;border-radius:50%;background:#38bdf8;color:#020617;display:inline-flex;align-items:center;justify-content:center;font-weight:900;">1</span><div><div>${dec.mediaType === "video" ? "View Once Video" : "View Once Photo"}</div><div style="font-size:10px;color:#7dd3fc;">🔒 Tap to View • Auto-Burns</div></div></button>`;
            } else if (dec.sticker && dec.sticker.url) {
                mediaHtml = `<img src="${esc(dec.sticker.url)}" loading="lazy" style="width:110px;height:110px;object-fit:contain;display:block;">`;
            } else if (dec.mediaType === "video" && mUrl) {
                mediaHtml = `<video src="${esc(mUrl)}" controls playsinline preload="metadata" style="width:230px;max-width:100%;max-height:240px;border-radius:10px;background:#000;display:block;"></video>`;
            } else if (dec.mediaType === "audio" && mUrl) {
                mediaHtml = `<div style="display:flex;align-items:center;gap:6px;" onclick="event.stopPropagation()"><audio src="${esc(mUrl)}" controls preload="metadata" style="width:180px;height:36px;"></audio><button type="button" onclick="NexusDM.cycleAudioSpeed(this)" style="background:#090d16;color:#34d399;border:1px solid #10b981;border-radius:8px;padding:4px 7px;font-size:11px;font-weight:900;cursor:pointer;">1x</button></div>`;
            } else if (dec.mediaType === "file" && mUrl) {
                mediaHtml = `<a href="${esc(mUrl)}" target="_blank" download="${esc(dec.fileName || "file.pdf")}" onclick="event.stopPropagation()" style="display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:10px;background:#0f172a;border:1px solid #38bdf8;color:#38bdf8;font-size:12px;font-weight:800;text-decoration:none;">📄 <span>${esc(dec.fileName || "Open File")}</span></a>`;
            } else if (dec.mediaType === "image" && mUrl) {
                mediaHtml = `<img src="${esc(mUrl)}" loading="lazy" onclick="event.stopPropagation();NexusDM.openPhotoPreview('${esc(mUrl)}')" style="width:225px;max-width:100%;max-height:260px;object-fit:cover;border-radius:10px;display:block;cursor:zoom-in;margin-bottom:4px;">`;
            }

            const txtHtml = dec.text ? `<div style="white-space:pre-wrap;${mediaHtml ? "margin-top:4px;" : ""}">${fmtLinks(dec.text)}</div>` : "";
            parts.push(`<div class="nx-dm-row nx-dm-bubble-anim" data-msg-id="${esc(msgId)}" style="align-items:${align};">
                <div class="nx-dm-card ${isMine ? "mine" : "theirs"}" onclick="NexusDM.openMsgActionMenu('${esc(msgId)}')">
                    ${replyHtml}${mediaHtml}${txtHtml}
                    <div style="display:flex;align-items:center;justify-content:flex-end;gap:5px;margin-top:4px;padding-right:30px;font-size:10px;color:rgba(233,237,239,.72);">
                        <span>${row.expires_at ? "⏱️ " : ""}${esc(fmtTime(row.created_at))} ${row.is_edited ? "(edited)" : ""}</span>${tick}
                    </div>
                    <button type="button" class="nx-dm-dots-trigger nx-dm-message-menu-btn" onclick="event.stopPropagation();NexusDM.openMsgActionMenu('${esc(msgId)}')">⋯</button>
                </div>${rxPill}
            </div>`);
        }

        box.innerHTML = parts.join("");
        if (nearBottom) box.scrollTop = box.scrollHeight;
    }

    // -------------------- SUPABASE WEBRTC CALLS, YT WATCH PARTY, DJ & POMODORO --------------------
    function endRtcCall(sendBye) {
        if (sendBye && roomChannel) roomChannel.send({ type: "broadcast", event: "rtc_bye", payload: { by: getMe()?.id } });
        if (rtcPc) { try { rtcPc.close(); } catch (e) {} rtcPc = null; }
        if (rtcLocalStream) { rtcLocalStream.getTracks().forEach((t) => { try { t.enabled = false; t.stop(); } catch (e) {} }); rtcLocalStream = null; }
        if (window.forceReleaseAllMicAndCamera) window.forceReleaseAllMicAndCamera();
        document.getElementById("nx-dm-rtc-stage")?.remove();
    }

    async function startRtcCall(mode) {
        const me = getMe(); if (!me || !roomChannel) return Nexus.toast("⚠️ Chat connect hone dein.");
        endRtcCall(false);
        try {
            rtcLocalStream = mode === "screen"
                ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                : await navigator.mediaDevices.getUserMedia({ audio: true, video: mode === "video" });
        } catch (e) { return Nexus.toast("❌ Mic/Camera/Screen permission denied!"); }

        showCallOverlay(mode, "Calling...");
        rtcPc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
        rtcLocalStream.getTracks().forEach((t) => rtcPc.addTrack(t, rtcLocalStream));
        const lv = document.getElementById("nx-rtc-local"); if (lv) lv.srcObject = rtcLocalStream;

        rtcPc.ontrack = (ev) => { const rv = document.getElementById("nx-rtc-remote"); if (rv && ev.streams[0]) rv.srcObject = ev.streams[0]; };
        rtcPc.onicecandidate = (ev) => { if (ev.candidate && roomChannel) roomChannel.send({ type: "broadcast", event: "rtc_ice", payload: { by: me.id, cand: ev.candidate } }); };

        const offer = await rtcPc.createOffer();
        await rtcPc.setLocalDescription(offer);
        roomChannel.send({ type: "broadcast", event: "rtc_offer", payload: { by: me.id, from: me.name || me.username, mode, offer } });
    }

    function showCallOverlay(mode, statusText) {
        document.getElementById("nx-dm-rtc-stage")?.remove();
        const d = document.createElement("div");
        d.id = "nx-dm-rtc-stage";
        d.style.cssText = "position:fixed;inset:0;background:#020617;z-index:296000;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:24px 16px;color:#fff;";
        d.innerHTML = `
            <div style="text-align:center;"><div style="font-size:18px;font-weight:900;color:#34d399;">${mode === "video" ? "📹 HD Video Call" : mode === "screen" ? "🖥️ Live Screen Share" : "📞 HD Voice Call"}</div><div id="nx-rtc-st" style="font-size:12.5px;color:#94a3b8;margin-top:4px;">${esc(statusText)}</div></div>
            <div style="position:relative;width:100%;max-width:460px;flex:1;display:flex;align-items:center;justify-content:center;margin:14px 0;">
                <video id="nx-rtc-remote" autoplay playsinline style="width:100%;max-height:68dvh;border-radius:18px;background:#0f172a;border:1px solid #334155;object-fit:contain;"></video>
                <video id="nx-rtc-local" autoplay playsinline muted style="position:absolute;bottom:12px;right:12px;width:96px;height:132px;border-radius:12px;background:#000;border:2px solid #10b981;object-fit:cover;"></video>
            </div>
            <button type="button" id="nx-rtc-cut" style="padding:13px 34px;border-radius:999px;background:#e11d48;color:#fff;font-weight:900;font-size:14px;border:none;cursor:pointer;">📵 End Call</button>
        `;
        document.body.appendChild(d);
        d.querySelector("#nx-rtc-cut").onclick = () => endRtcCall(true);
    }

    function launchYtWatchParty(vidId, broadcast) {
        const cleanId = String(vidId || "").match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{11})/)?.[1] || (String(vidId || "").length === 11 ? vidId : "");
        if (!cleanId) return Nexus.toast("⚠️ Valid YouTube link ya 11-char Video ID dalein!");
        if (broadcast && roomChannel) roomChannel.send({ type: "broadcast", event: "yt_sync", payload: { by: getMe()?.id, vidId: cleanId } });
        const host = document.getElementById("nx-dm-media-stage");
        if (!host) return;
        host.style.display = "block";
        host.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 10px;background:#111b21;font-size:11.5px;font-weight:800;color:#fb7185;"><span>📺 Live YT Watch Party (Synced)</span><button type="button" onclick="document.getElementById('nx-dm-media-stage').style.display='none';document.getElementById('nx-dm-media-stage').innerHTML='';" style="background:none;border:none;color:#fff;cursor:pointer;">✕</button></div><iframe src="https://www.youtube.com/embed/${esc(cleanId)}?autoplay=1&enablejsapi=1&playsinline=1" allow="autoplay;encrypted-media;fullscreen" style="width:100%;height:195px;border:none;display:block;"></iframe>`;
    }

    function startPomodoro(mins, broadcast) {
        clearInterval(pomoTimer);
        pomoRemaining = Number(mins || 25) * 60;
        if (broadcast && roomChannel) roomChannel.send({ type: "broadcast", event: "pomo_sync", payload: { by: getMe()?.id, mins } });
        const bar = document.getElementById("nx-dm-pomo-bar");
        if (!bar) return;
        bar.style.display = "flex";
        const tick = () => {
            const m = String(Math.floor(pomoRemaining / 60)).padStart(2, "0"), s = String(pomoRemaining % 60).padStart(2, "0");
            bar.innerHTML = `<span>🍅 <b>Study Focus Timer:</b> ${m}:${s}</span><button type="button" onclick="clearInterval(window.__nxPomo);document.getElementById('nx-dm-pomo-bar').style.display='none';" style="background:none;border:none;color:#fda4af;font-weight:900;cursor:pointer;">Stop ✕</button>`;
            if (pomoRemaining <= 0) { clearInterval(pomoTimer); Nexus.toast("🎉 Study Pomodoro Complete!"); bar.style.display = "none"; }
            pomoRemaining--;
        };
        tick();
        pomoTimer = setInterval(tick, 1000);
        window.__nxPomo = pomoTimer;
    }

    // -------------------- MEDIA UPLOAD & CONVERSATION SYNC --------------------
    function compressImg(file) {
        return new Promise((res) => {
            if (!file.type || !file.type.startsWith("image/") || file.size < 180000) return res(file);
            const r = new FileReader();
            r.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const c = document.createElement("canvas"); let w = img.width, h = img.height, M = 1080;
                    if (w > h && w > M) { h = Math.round(h * M / w); w = M; } else if (h > M) { w = Math.round(w * M / h); h = M; }
                    c.width = w; c.height = h; c.getContext("2d").drawImage(img, 0, 0, w, h);
                    c.toBlob((b) => res(b ? new File([b], "photo.webp", { type: "image/webp" }) : file), "image/webp", 0.78);
                };
                img.onerror = () => res(file); img.src = e.target.result;
            };
            r.onerror = () => res(file); r.readAsDataURL(file);
        });
    }

    async function sendMediaFiles(fileList, forcedType, isViewOnce) {
        const files = Array.from(fileList || []), me = getMe(), sec = getSec();
        if (!files.length || !me || !activeConvId || !activePeerProfile || !sec) return;
        if (!navigator.onLine) return Nexus.toast("⚠️ Offline!");
        const dock = document.getElementById("nx-dm-v2-tools-dock"); if (dock) dock.style.display = "none";

        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            if (file.size > 50 * 1024 * 1024) { Nexus.toast(`⚠️ ${file.name} > 50MB!`); continue; }
            const mime = (file.type || "").toLowerCase();
            const mType = forcedType || (mime.startsWith("video") ? "video" : mime.startsWith("audio") ? "audio" : mime.includes("pdf") ? "file" : "image");
            const tmpId = "tmp_" + Date.now() + "_" + i, locUrl = URL.createObjectURL(file);
            dmMessagesCache.push({ id: tmpId, sender_id: me.id, receiver_id: activePeerProfile.id, created_at: new Date().toISOString(), is_view_once: Boolean(isViewOnce), reactions: {}, reply_to: dmReplyingTo ? Object.assign({}, dmReplyingTo) : null, _sending: true, _localUrl: locUrl });
            decryptedCache.set(tmpId, { deleted: false, text: "", mediaPath: "", mediaType: mType, fileName: file.name, viewOnce: Boolean(isViewOnce), viewOnceOpened: false });
            await renderMessages();

            try {
                if (mType === "image") file = await compressImg(file);
                const up = await sec.uploadPrivateChatMedia(file, activeConvId);
                const saved = await sec.sendChatMessage({
                    conversationId: activeConvId, myUserId: me.id, peerUserId: activePeerProfile.id,
                    peerPublicKeyJson: activePeerProfile.e2ee_public_key || null,
                    mediaPath: up.path, mediaType: mType, fileName: up.fileName,
                    isViewOnce: Boolean(isViewOnce), disappearingSeconds,
                    replyTo: dmReplyingTo ? Object.assign({}, dmReplyingTo) : null
                });
                dmMessagesCache = dmMessagesCache.filter((x) => x.id !== tmpId);
                if (!dmMessagesCache.some((x) => x.id === saved.id)) { saved._localUrl = locUrl; await hydrateRow(saved, me.id, activePeerProfile.e2ee_public_key); dmMessagesCache.push(saved); }
                NexusDM.cancelReply(); saveConvCache(activeConvId, dmMessagesCache); await renderMessages();
            } catch (err) {
                dmMessagesCache = dmMessagesCache.filter((x) => x.id !== tmpId); await renderMessages();
                Nexus.toast("❌ Upload failed: " + (err.message || "Retry"));
            }
        }
    }

    async function loadMessages(keepLimit) {
        const me = getMe(), sec = getSec(); if (!me || !activeConvId || !activePeerProfile || !sec) return;
        if (!keepLimit) { const c = loadConvCache(activeConvId); if (c.length) { dmMessagesCache = c; await renderMessages(); } }
        if (!navigator.onLine) return;

        const { data: convMeta } = await sec.sb.from("conversations").select("disappearing_seconds, pinned_text").eq("id", activeConvId).maybeSingle();
        if (convMeta) { disappearingSeconds = Number(convMeta.disappearing_seconds || 0); pinnedNotice = convMeta.pinned_text || ""; renderPinnedBar(); }

        const { data } = await sec.sb.from("messages").select("*").eq("conversation_id", activeConvId).order("created_at", { ascending: false }).limit(loadedLimit);
        if (!Array.isArray(data)) return;
        const ordered = data.reverse();
        for (const r of ordered) await hydrateRow(r, me.id, activePeerProfile.e2ee_public_key);
        dmMessagesCache = ordered; saveConvCache(activeConvId, dmMessagesCache); await renderMessages();
        sec.markConversationSeen(activeConvId, me.id).catch(() => {});
    }

    function subscribeRoom() {
        const me = getMe(), sec = getSec(); if (!me || !activeConvId || !activePeerProfile || !sec) return;
        if (unsubMessages) { unsubMessages(); unsubMessages = null; }
        if (roomChannel) { try { sec.sb.removeChannel(roomChannel); } catch (e) {} roomChannel = null; }

        unsubMessages = sec.subscribeToConversation(activeConvId, async (p) => {
            const row = p && p.new; if (!row || !row.id) return;
            await hydrateRow(row, me.id, activePeerProfile.e2ee_public_key);
            const idx = dmMessagesCache.findIndex((x) => x.id === row.id);
            if (idx === -1) dmMessagesCache.push(row); else dmMessagesCache[idx] = Object.assign({}, dmMessagesCache[idx], row);
            dmMessagesCache.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            saveConvCache(activeConvId, dmMessagesCache); await renderMessages();
            if (row.receiver_id === me.id && !row.seen && !row.is_deleted_everyone) sec.markConversationSeen(activeConvId, me.id).catch(() => {});
        });

        roomChannel = sec.sb.channel("nx_room_" + activeConvId);
        roomChannel
            .on("broadcast", { event: "typing" }, ({ payload }) => {
                if (!payload || payload.by === me.id) return;
                const b = document.getElementById("nx-dm-typing-bar");
                if (b) { b.style.display = "flex"; clearTimeout(typingHideTimer); typingHideTimer = setTimeout(() => { b.style.display = "none"; }, 3000); }
            })
            .on("broadcast", { event: "yt_sync" }, ({ payload }) => { if (payload && payload.by !== me.id && payload.vidId) launchYtWatchParty(payload.vidId, false); })
            .on("broadcast", { event: "pomo_sync" }, ({ payload }) => { if (payload && payload.by !== me.id && payload.mins) startPomodoro(payload.mins, false); })
            .on("broadcast", { event: "rtc_bye" }, ({ payload }) => { if (payload && payload.by !== me.id) { endRtcCall(false); Nexus.toast("📵 Call ended"); } })
            .on("broadcast", { event: "rtc_ice" }, async ({ payload }) => { if (payload && payload.by !== me.id && rtcPc && payload.cand) { try { await rtcPc.addIceCandidate(payload.cand); } catch (e) {} } })
            .on("broadcast", { event: "rtc_answer" }, async ({ payload }) => { if (payload && payload.by !== me.id && rtcPc && payload.answer) { await rtcPc.setRemoteDescription(payload.answer); const s = document.getElementById("nx-rtc-st"); if (s) s.textContent = "🟢 Connected"; } })
            .on("broadcast", { event: "rtc_offer" }, async ({ payload }) => {
                if (!payload || payload.by === me.id) return;
                if (!confirm(`📞 Incoming ${payload.mode === "video" ? "Video" : payload.mode === "screen" ? "Screen Share" : "Voice"} Call from ${payload.from}. Accept?`)) return endRtcCall(true);
                try {
                    rtcLocalStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: payload.mode === "video" });
                    showCallOverlay(payload.mode, "🟢 Connected");
                    rtcPc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
                    rtcLocalStream.getTracks().forEach((t) => rtcPc.addTrack(t, rtcLocalStream));
                    const lv = document.getElementById("nx-rtc-local"); if (lv) lv.srcObject = rtcLocalStream;
                    rtcPc.ontrack = (ev) => { const rv = document.getElementById("nx-rtc-remote"); if (rv && ev.streams[0]) rv.srcObject = ev.streams[0]; };
                    rtcPc.onicecandidate = (ev) => { if (ev.candidate && roomChannel) roomChannel.send({ type: "broadcast", event: "rtc_ice", payload: { by: me.id, cand: ev.candidate } }); };
                    await rtcPc.setRemoteDescription(payload.offer);
                    const answer = await rtcPc.createAnswer();
                    await rtcPc.setLocalDescription(answer);
                    roomChannel.send({ type: "broadcast", event: "rtc_answer", payload: { by: me.id, answer } });
                } catch (e) { Nexus.toast("❌ Call connect failed"); endRtcCall(true); }
            })
            .subscribe();
    }

    // Inbox Banner & Unread Counter
    function injectDmBanner() {
        const dir = document.getElementById("nx-chat-directory");
        if (!dir || document.getElementById("nx-dm-inbox-banner")) return;
        const w = document.createElement("div"); w.id = "nx-dm-inbox-banner"; w.style.cssText = "margin-bottom:12px;";
        w.innerHTML = `<div onclick="NexusDM.openInboxModal()" style="background:linear-gradient(135deg,rgba(0,168,132,.22),rgba(37,99,235,.22));border:1.5px solid #00a884;border-radius:16px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;"><div style="display:flex;align-items:center;gap:10px;"><div style="width:40px;height:40px;border-radius:12px;background:#00a884;color:#020617;display:flex;align-items:center;justify-content:center;font-size:19px;font-weight:900;">🔐</div><div><div style="font-weight:800;font-size:14px;color:#f8fafc;">Nexus 1:1 Encrypted DM (v3)</div><div style="font-size:11.5px;color:#5eead4;">Calls • Watch Party • 50MB Video • View-Once 1️⃣</div></div></div><span id="nx-dm-banner-badge" style="background:#00a884;color:#020617;padding:5px 11px;border-radius:12px;font-size:11.5px;font-weight:800;">Open →</span></div>`;
        dir.insertBefore(w, dir.firstChild);
    }
    setInterval(injectDmBanner, 800);

    async function refreshInboxCounts() {
        const me = getMe(), sec = getSec(); if (!me || !me.id || !sec || !sec.sb) return;
        const { data } = await sec.sb.from("messages").select("id,sender_id,seen,is_deleted_everyone,msg_type,is_view_once").eq("receiver_id", me.id).order("created_at", { ascending: false }).limit(80);
        unreadCountsByUser = {}; lastMsgByUser = {}; let total = 0;
        (data || []).forEach((m) => { if (!lastMsgByUser[m.sender_id]) lastMsgByUser[m.sender_id] = m; if (!m.seen && !m.is_deleted_everyone) { unreadCountsByUser[m.sender_id] = (unreadCountsByUser[m.sender_id] || 0) + 1; total++; } });
        const b = document.getElementById("nx-dm-banner-badge");
        if (b) { b.textContent = total > 0 ? `🔴 ${total} New` : "Open →"; b.style.background = total > 0 ? "#ef4444" : "#00a884"; b.style.color = total > 0 ? "#fff" : "#020617"; }
    }
    setInterval(() => {
        const me = getMe(), sec = getSec(); if (!me || !me.id || !sec || !sec.sb || unsubInbox) return;
        refreshInboxCounts();
        const ch = sec.sb.channel("nx_inb_" + me.id).on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `receiver_id=eq.${me.id}` }, refreshInboxCounts).subscribe();
        unsubInbox = () => { try { sec.sb.removeChannel(ch); } catch (e) {} };
    }, 1500);

    // -------------------- PUBLIC window.NexusDM API --------------------
    window.NexusDM = {
        activePartner: null,

        openInboxModal: function () {
            this.closeDM();
            const me = getMe(); if (!me) { Nexus.toast("🔒 Pehle Login karein!"); if (window.openNexusSupabaseAuthModal) window.openNexusSupabaseAuthModal("login"); return; }
            refreshInboxCounts();
            const modal = document.getElementById("nx-global-modal");
            const others = (Nexus.users || []).filter((u) => u && u.id && u.id !== me.id && normU(u.username) !== "nexus_official")
                .sort((a, b) => ((unreadCountsByUser[b.id] || 0) - (unreadCountsByUser[a.id] || 0)) || ((isOnline(b) ? 1 : 0) - (isOnline(a) ? 1 : 0)));

            const vault = `<div onclick="NexusDM.openDirectChat('${esc(me.username)}','Saved Messages (Cloud)','')" style="display:flex;align-items:center;justify-content:space-between;padding:11px 12px;background:linear-gradient(135deg,rgba(16,185,129,.2),rgba(15,23,42,.95));border:1.5px solid #10b981;border-radius:14px;cursor:pointer;"><div style="display:flex;align-items:center;gap:10px;"><div style="width:42px;height:42px;border-radius:50%;background:#10b981;color:#020617;display:flex;align-items:center;justify-content:center;font-size:19px;">🔖</div><div><div style="font-weight:800;font-size:14px;color:#5eead4;">Saved Messages</div><div style="font-size:11px;color:#cbd5e1;">Personal Cloud Vault</div></div></div><span style="background:#10b981;color:#020617;padding:4px 9px;border-radius:10px;font-size:11px;font-weight:900;">Vault →</span></div>`;
            const rows = others.map((u) => {
                const un = unreadCountsByUser[u.id] || 0, lm = lastMsgByUser[u.id];
                const sub = lm ? (lm.is_view_once ? "1️⃣ View Once" : lm.msg_type === "image" ? "📸 Photo" : lm.msg_type === "video" ? "🎬 Video" : "🔐 Encrypted message") : `@${u.username} • ${u.bio || "Member"}`;
                const av = u.dp ? `<img src="${esc(u.dp)}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;">` : `<div style="width:42px;height:42px;border-radius:50%;background:#00a884;color:#020617;display:flex;align-items:center;justify-content:center;font-weight:900;">${esc((u.name || u.username)[0].toUpperCase())}</div>`;
                return `<div onclick="NexusDM.openDirectChat('${esc(u.username)}','${esc(u.name || u.username)}','${esc(u.dp || "")}')" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#182229;border:1px solid #233138;border-radius:14px;cursor:pointer;"><div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">${av}<div style="min-width:0;flex:1;"><div style="font-weight:700;font-size:14px;color:#fff;">${esc(u.name || u.username)} ${isOnline(u) ? "🟢" : ""}</div><div style="font-size:11.5px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(sub)}</div></div></div>${un > 0 ? `<span class="nx-unread-pill">${un}</span>` : `<span style="color:#00a884;font-size:12px;font-weight:800;">Chat →</span>`}</div>`;
            }).join("");

            modal.innerHTML = `<div class="nx-modal-box" style="border:1.5px solid #10b981;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><h3 style="font-size:16px;color:#f8fafc;">🔐 Nexus 1:1 Encrypted DM</h3><button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer;">✕</button></div><div style="display:flex;flex-direction:column;gap:8px;max-height:68vh;overflow-y:auto;">${vault}${rows}</div></div>`;
            modal.style.display = "flex";
        },

        openDirectChat: async function (partnerUsername, partnerName, partnerDp) {
            const me = getMe(), sec = getSec();
            if (!me || !me.id || !sec) { Nexus.toast("🔒 Pehle Login karein!"); if (window.openNexusSupabaseAuthModal) window.openNexusSupabaseAuthModal("login"); return; }
            const clean = normU(partnerUsername); if (!clean) return;
            document.getElementById("nx-global-modal").style.display = "none";
            document.getElementById("nx-public-profile-modal")?.remove();

            let peer = clean === normU(me.username) ? me : (Nexus.users || []).find((u) => u && normU(u.username) === clean);
            if (!peer && navigator.onLine) {
                const { data } = await sec.sb.from("profiles").select("*").ilike("username", clean).maybeSingle();
                if (data) peer = { id: data.id, username: data.username, name: data.display_name || data.username, dp: data.avatar_url || "", e2ee_public_key: data.e2ee_public_key || null, lastOnline: data.last_online ? new Date(data.last_online).getTime() : 0 };
            }
            if (!peer || !peer.id) return Nexus.toast("❌ User nahi mila!");

            savedScrollY = window.scrollY || 0;
            document.documentElement.style.overflow = "hidden"; document.body.style.overflow = "hidden";
            dmReplyingTo = null; dmEditingId = null; searchQuery = ""; loadedLimit = 50; dmMessagesCache = []; decryptedCache.clear();
            activePeerProfile = peer; activeDmPartner = { username: peer.username, name: partnerName || peer.name || peer.username };
            this.activePartner = peer.username; window.activeDMUser = peer.username; window.currentChatUser = peer.username;

            const dn = activeDmPartner.name, dp = partnerDp || peer.dp || "";
            const av = dp ? `<img src="${esc(dp)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;">` : `<div style="width:36px;height:36px;border-radius:50%;background:#00a884;color:#020617;display:flex;align-items:center;justify-content:center;font-weight:900;">${esc(dn[0].toUpperCase())}</div>`;

            const root = ensureRoot();
            root.innerHTML = `
                <div style="height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 10px;background:#202c33;border-bottom:1px solid #2a3942;flex-shrink:0;">
                    <div style="display:flex;align-items:center;gap:8px;min-width:0;flex:1;">
                        <button type="button" onclick="NexusDM.openInboxModal()" style="background:none;border:none;color:#e9edef;font-size:20px;cursor:pointer;padding:4px;">←</button>
                        <div onclick="NexusDM.closeDM();if(window.openPublicUserProfileModal)openPublicUserProfileModal('${esc(peer.username)}')" style="display:flex;align-items:center;gap:8px;min-width:0;cursor:pointer;flex:1;">
                            ${av}<div style="min-width:0;flex:1;"><div id="nx-dm-partner-name" data-partner-username="${esc(peer.username)}" style="font-weight:800;font-size:14.5px;color:#e9edef;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(dn)}</div><div style="font-size:11px;color:${isOnline(peer) ? "#00a884" : "#8696a0"};">${esc(fmtSeen(peer))}</div></div>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <button type="button" onclick="NexusDM.startCall('audio')" style="background:#182229;border:1px solid #2a3942;color:#34d399;width:32px;height:32px;border-radius:50%;cursor:pointer;" title="Voice Call">📞</button>
                        <button type="button" onclick="NexusDM.startCall('video')" style="background:#182229;border:1px solid #2a3942;color:#38bdf8;width:32px;height:32px;border-radius:50%;cursor:pointer;" title="Video Call">📹</button>
                        <button type="button" onclick="NexusDM.openHeaderSuperMenu()" style="background:#182229;border:1px solid #10b981;color:#fff;width:32px;height:32px;border-radius:50%;font-size:18px;font-weight:900;cursor:pointer;" title="All Chat Tools">⋮</button>
                        <button type="button" onclick="NexusDM.closeDM()" style="background:#2a3942;border:none;color:#e9edef;width:30px;height:30px;border-radius:50%;cursor:pointer;">✕</button>
                    </div>
                </div>
                <div id="nx-dm-offline-strip" class="nx-dm-offline-strip">⚠️ Offline Mode — Cached chats</div>
                <div id="nx-dm-search-bar" style="display:none;padding:6px 10px;background:#111b21;border-bottom:1px solid #2a3942;gap:6px;align-items:center;flex-shrink:0;">
                    <input id="nx-dm-search-in" placeholder="🔍 Search in this chat..." style="flex:1;padding:7px 10px;border-radius:10px;background:#202c33;border:1px solid #334155;color:#fff;font-size:12.5px;outline:none;">
                    <button type="button" onclick="NexusDM.toggleSearchBar(false)" style="background:none;border:none;color:#94a3b8;font-weight:900;cursor:pointer;">✕</button>
                </div>
                <div id="nx-dm-pinned-bar" style="display:none;padding:6px 12px;background:#182229;border-bottom:1px solid #10b981;font-size:11.5px;color:#5eead4;align-items:center;flex-shrink:0;"></div>
                <div id="nx-dm-pomo-bar" style="display:none;padding:6px 12px;background:#312e81;color:#e0e7ff;font-size:12px;justify-content:space-between;align-items:center;flex-shrink:0;"></div>
                <div id="nx-dm-media-stage" style="display:none;background:#000;border-bottom:1px solid #334155;flex-shrink:0;"></div>
                <div id="nx-dm-v2-msgs-box"></div>
                <div id="nx-dm-typing-bar" style="display:none;padding:5px 14px;background:#111b21;font-size:11.5px;color:#00a884;font-weight:800;flex-shrink:0;">✍️ ${esc(dn)} is typing...</div>
                <div id="nx-dm-sticker-drawer" style="display:none;background:#111b21;border-top:1px solid #2a3942;padding:8px 10px;flex-shrink:0;">
                    <div style="display:flex;gap:6px;overflow-x:auto;margin-bottom:7px;">
                        <span class="nx-stk-chip active" onclick="NexusDM.filterStickers('trending',this)">🔥 Hot</span>
                        <span class="nx-stk-chip" onclick="NexusDM.filterStickers('funny',this)">😂 Fun</span>
                        <span class="nx-stk-chip" onclick="NexusDM.filterStickers('study',this)">📚 Study</span>
                        <span class="nx-stk-chip" onclick="NexusDM.filterStickers('love',this)">❤️ Love</span>
                        <button type="button" onclick="document.getElementById('nx-dm-sticker-drawer').style.display='none'" style="margin-left:auto;background:#202c33;border:none;color:#cbd5e1;width:26px;height:26px;border-radius:50%;">✕</button>
                    </div>
                    <div id="nx-cloud-stk-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;height:155px;overflow-y:auto;"></div>
                </div>
                <div id="nx-dm-v2-tools-dock" class="nx-dm-tools-dock">
                    <label for="nx-v2-pick-photo" class="nx-dm-tool-tile" style="margin:0;"><span style="font-size:20px;">🖼️</span><span>Photos</span></label>
                    <label for="nx-v2-pick-vo" class="nx-dm-tool-tile" style="margin:0;border-color:#38bdf8;color:#7dd3fc;"><span style="font-size:20px;">1️⃣</span><span>View Once</span></label>
                    <label for="nx-v2-pick-video" class="nx-dm-tool-tile" style="margin:0;color:#38bdf8;"><span style="font-size:20px;">🎬</span><span>Video 50M</span></label>
                    <label for="nx-v2-pick-pdf" class="nx-dm-tool-tile" style="margin:0;color:#fbbf24;"><span style="font-size:20px;">📄</span><span>PDF / File</span></label>
                    <button type="button" class="nx-dm-tool-tile" onclick="NexusDM.toggleVoiceRecording()"><span style="font-size:20px;">🎤</span><span>Voice</span></button>
                    <button type="button" class="nx-dm-tool-tile" onclick="NexusDM.promptYtWatchParty()"><span style="font-size:20px;">📺</span><span>YT Party</span></button>
                    <button type="button" class="nx-dm-tool-tile" onclick="document.getElementById('nx-dm-v2-tools-dock').style.display='none';if(window.openSharedWhiteboardModal)openSharedWhiteboardModal();"><span style="font-size:20px;">✏️</span><span>Board</span></button>
                    <button type="button" class="nx-dm-tool-tile" onclick="NexusDM.startCall('screen')"><span style="font-size:20px;">🖥️</span><span>Screen</span></button>
                </div>
                <input type="file" id="nx-v2-pick-photo" accept="image/*" multiple style="display:none;">
                <input type="file" id="nx-v2-pick-vo" accept="image/*,video/*" style="display:none;">
                <input type="file" id="nx-v2-pick-video" accept="video/mp4,video/webm,video/*" style="display:none;">
                <input type="file" id="nx-v2-pick-pdf" accept="application/pdf,*/*" style="display:none;">
                <div id="nx-dm-reply-bar" style="display:none;padding:7px 14px;background:#182229;border-left:4px solid #00a884;align-items:center;justify-content:space-between;font-size:12px;color:#e9edef;flex-shrink:0;"><span id="nx-dm-reply-txt" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;"></span><button type="button" onclick="NexusDM.cancelReply()" style="background:none;border:none;color:#ef4444;font-weight:900;cursor:pointer;margin-left:10px;">✕</button></div>
                <div style="width:100%;display:flex;align-items:center;gap:7px;padding:8px 10px;background:#111b21;border-top:1px solid #1e293b;flex-shrink:0;">
                    <div style="flex:1;min-width:0;display:flex;align-items:center;background:#202c33;border-radius:24px;padding:3px 9px;gap:6px;">
                        <button type="button" onclick="NexusDM.toggleStickerDrawer()" style="background:none;border:none;font-size:20px;cursor:pointer;">😊</button>
                        <textarea id="nx-dm-input" rows="1" placeholder="Message..." autocomplete="off" style="flex:1;width:100%;min-width:0;height:36px;max-height:105px;padding:8px 2px;border:none;background:transparent;color:#e9edef;font-size:14.5px;line-height:20px;resize:none;outline:none;"></textarea>
                        <button type="button" onclick="NexusDM.toggleToolsDock()" style="width:29px;height:29px;border-radius:50%;background:rgba(0,168,132,.18);border:1.5px solid #00a884;color:#00a884;font-size:19px;font-weight:900;cursor:pointer;flex-shrink:0;">+</button>
                        <button type="button" id="nx-dm-v2-mic-btn" onclick="NexusDM.toggleVoiceRecording()" style="background:none;border:none;font-size:18px;cursor:pointer;">🎙️</button>
                    </div>
                    <button type="button" onclick="NexusDM.sendDM()" style="background:#00a884;color:#020617;border:none;width:42px;height:42px;border-radius:50%;font-size:18px;font-weight:900;cursor:pointer;flex-shrink:0;">➤</button>
                </div>
            `;

            root.style.display = "flex"; syncViewport();
            const bf = (id, t, vo) => { const e = document.getElementById(id); if (e) e.onchange = (ev) => { if (ev.target.files?.length) sendMediaFiles(ev.target.files, t, vo); ev.target.value = ""; }; };
            bf("nx-v2-pick-photo", "image", false); bf("nx-v2-pick-vo", null, true); bf("nx-v2-pick-video", "video", false); bf("nx-v2-pick-pdf", "file", false);

            const sIn = document.getElementById("nx-dm-search-in");
            if (sIn) sIn.oninput = () => { searchQuery = sIn.value; renderMessages(); };

            const inp = document.getElementById("nx-dm-input");
            if (inp) {
                inp.oninput = () => { resizeInput(); if (roomChannel && Date.now() - lastTypingPingAt > 1800) { lastTypingPingAt = Date.now(); roomChannel.send({ type: "broadcast", event: "typing", payload: { by: me.id } }); } };
                inp.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); NexusDM.sendDM(); } };
            }

            try {
                activeConvId = await sec.getOrCreateConversation(me.id, peer.id);
                window.__nxActiveConversationId = activeConvId;
                applyWallpaper(localStorage.getItem("nx_wp_" + activeConvId) || "default");
                await loadMessages(false);
                subscribeRoom();
            } catch (err) { Nexus.toast("⚠️ Chat connect error: " + (err.message || "Retry")); }
        },

        // TOP-RIGHT ⋮ SUPER MENU (ALL OLD + NEW CORE ADVANCED FEATURES)
        openHeaderSuperMenu: function () {
            const sheet = ensureSheet();
            const timerLbl = disappearingSeconds === 3600 ? "1 Hour" : disappearingSeconds === 86400 ? "24 Hours" : disappearingSeconds === 604800 ? "7 Days" : "Off";
            sheet.innerHTML = `<div class="nx-dm-sheet-box">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><b style="color:#34d399;font-size:15px;">⚡ Nexus Chat Super Menu</b><button type="button" onclick="document.getElementById('nx-dm-v2-action-sheet').style.display='none'" style="background:none;border:none;color:#94a3b8;font-size:17px;cursor:pointer;">✕</button></div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:8px;">
                    <button type="button" class="nx-dm-opt" style="margin:0;" onclick="NexusDM.closeSheet();NexusDM.startCall('audio')">📞 Voice Call</button>
                    <button type="button" class="nx-dm-opt" style="margin:0;" onclick="NexusDM.closeSheet();NexusDM.startCall('video')">📹 Video Call</button>
                    <button type="button" class="nx-dm-opt" style="margin:0;" onclick="NexusDM.closeSheet();NexusDM.startCall('screen')">🖥️ Screen Share</button>
                    <button type="button" class="nx-dm-opt" style="margin:0;" onclick="NexusDM.closeSheet();NexusDM.promptYtWatchParty()">📺 YT Party</button>
                    <button type="button" class="nx-dm-opt" style="margin:0;" onclick="NexusDM.closeSheet();if(window.openSharedWhiteboardModal)openSharedWhiteboardModal()">✏️ Whiteboard</button>
                    <button type="button" class="nx-dm-opt" style="margin:0;" onclick="NexusDM.closeSheet();NexusDM.startPomodoroPrompt()">🍅 Study Timer</button>
                </div>
                <button type="button" class="nx-dm-opt" onclick="NexusDM.closeSheet();NexusDM.toggleSearchBar(true)"><span>🔍</span><span>Search Messages in Chat</span></button>
                <button type="button" class="nx-dm-opt" onclick="NexusDM.cycleDisappearingTimer()"><span>⏱️</span><span>Disappearing Messages: <b style="color:#38bdf8;">${timerLbl}</b></span></button>
                <button type="button" class="nx-dm-opt" onclick="NexusDM.cycleWallpaper()"><span>🎨</span><span>Change Chat Wallpaper (${esc(currentWallpaper)})</span></button>
                <button type="button" class="nx-dm-opt" onclick="NexusDM.closeSheet();NexusDM.promptPinNotice()"><span>📌</span><span>Pin Important Notice</span></button>
                <button type="button" class="nx-dm-opt" onclick="NexusDM.closeSheet();if(window.openE2EEVerificationModal)openE2EEVerificationModal('${esc(activePeerProfile?.username || "")}')"><span>🔐</span><span>Verify 60-Digit E2EE Security Code</span></button>
                <button type="button" class="nx-dm-opt" onclick="NexusDM.closeSheet();if(window.NexusSecurity)NexusSecurity.openSecurityCenterModal()"><span>🛡️</span><span>Active Devices &amp; Backup PIN</span></button>
                <button type="button" class="nx-dm-opt" onclick="NexusDM.closeSheet();NexusDM.exportChatTxt()"><span>📥</span><span>Export Chat Notes (.txt)</span></button>
                <button type="button" class="nx-dm-opt" style="color:#f87171;border-color:rgba(248,113,113,.4);" onclick="NexusDM.closeSheet();NexusDM.toggleBlockPartner()"><span>🚫</span><span>Block / Unblock @${esc(activePeerProfile?.username || "User")}</span></button>
            </div>`;
            sheet.style.display = "flex";
        },

        closeSheet: () => { const s = document.getElementById("nx-dm-v2-action-sheet"); if (s) s.style.display = "none"; },
        startCall: (mode) => startRtcCall(mode),
        promptYtWatchParty: () => { const u = prompt("📺 YouTube Video Link ya Video ID paste karein (Dono phones par ek saath chalega):"); if (u) launchYtWatchParty(u.trim(), true); },
        startPomodoroPrompt: () => { const m = prompt("🍅 Kitne minute ka Synced Study Focus Timer lagana hai? (25 ya 50)", "25"); if (m && Number(m) > 0) startPomodoro(Number(m), true); },
        toggleSearchBar: (show) => { const b = document.getElementById("nx-dm-search-bar"); if (b) b.style.display = show ? "flex" : "none"; if (!show) { searchQuery = ""; renderMessages(); } else document.getElementById("nx-dm-search-in")?.focus(); },
        cycleWallpaper: () => { const keys = Object.keys(WALLPAPERS); applyWallpaper(keys[(keys.indexOf(currentWallpaper) + 1) % keys.length]); NexusDM.openHeaderSuperMenu(); },
        cycleDisappearingTimer: async function () {
            const opts = [0, 3600, 86400, 604800];
            disappearingSeconds = opts[(opts.indexOf(disappearingSeconds) + 1) % opts.length];
            const sec = getSec(); if (sec && activeConvId) await sec.sb.from("conversations").update({ disappearing_seconds: disappearingSeconds }).eq("id", activeConvId);
            this.openHeaderSuperMenu();
        },
        promptPinNotice: function () { const t = prompt("📌 Pin karne ke liye message/notice likhein:", pinnedNotice); if (t !== null) this.setPinnedNotice(t.trim()); },
        setPinnedNotice: async function (txt) {
            pinnedNotice = txt; renderPinnedBar();
            const sec = getSec(); if (sec && activeConvId) await sec.sb.from("conversations").update({ pinned_text: txt }).eq("id", activeConvId);
        },
        exportChatTxt: function () {
            const lines = dmMessagesCache.map((r) => { const d = decryptedCache.get(r.id); return `[${fmtTime(r.created_at)}] ${r.sender_id === getMe()?.id ? "Me" : activeDmPartner?.name}: ${d?.text || "[Media]"}`; });
            const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain" }));
            a.download = `Nexus_Chat_${activePeerProfile?.username || "notes"}.txt`; a.click();
            Nexus.toast("📥 Chat exported!");
        },
        toggleBlockPartner: async function () {
            const me = getMe(), sec = getSec(); if (!me || !sec || !activePeerProfile) return;
            const target = activePeerProfile.username;
            const list = Array.isArray(me.blockedUsers) ? [...me.blockedUsers] : [];
            const idx = list.indexOf(target);
            if (idx === -1) { list.push(target); Nexus.toast(`🚫 Blocked @${target}`); } else { list.splice(idx, 1); Nexus.toast(`✅ Unblocked @${target}`); }
            me.blockedUsers = list;
            await sec.sb.from("profiles").update({ blocked_users: list }).eq("id", me.id);
        },

        loadOlderMessages: async function () { loadedLimit += 50; await loadMessages(true); },

        sendDM: async function (ignored, customSticker) {
            const me = getMe(), sec = getSec(), inp = document.getElementById("nx-dm-input");
            if (!me || !activeConvId || !activePeerProfile || !sec) return Nexus.toast("⚠️ Chat ready nahi hai, retry karein.");
            if (!navigator.onLine) return Nexus.toast("⚠️ Offline!");
            const txt = inp ? inp.value.trim() : ""; if (!txt && !customSticker) return;

            if (dmEditingId && txt && !customSticker) {
                const eid = dmEditingId; this.cancelReply(); if (inp) { inp.value = ""; resizeInput(); }
                await sec.editChatMessage({ messageId: eid, myUserId: me.id, peerUserId: activePeerProfile.id, peerPublicKeyJson: activePeerProfile.e2ee_public_key, newText: txt });
                return Nexus.toast("✏️ Updated!");
            }

            const rep = dmReplyingTo ? Object.assign({}, dmReplyingTo) : null;
            this.cancelReply(); if (inp && !customSticker) { inp.value = ""; resizeInput(); }
            const tmpId = "tmp_" + Date.now();
            dmMessagesCache.push({ id: tmpId, sender_id: me.id, receiver_id: activePeerProfile.id, created_at: new Date().toISOString(), reactions: {}, reply_to: rep, _sending: true });
            decryptedCache.set(tmpId, { deleted: false, text: customSticker ? "" : txt, mediaPath: "", mediaType: "text", sticker: customSticker || null });
            await renderMessages();

            try {
                const saved = await sec.sendChatMessage({
                    conversationId: activeConvId, myUserId: me.id, peerUserId: activePeerProfile.id,
                    peerPublicKeyJson: activePeerProfile.e2ee_public_key || null,
                    text: customSticker ? "" : txt, sticker: customSticker || null,
                    disappearingSeconds, replyTo: rep
                });
                dmMessagesCache = dmMessagesCache.filter((x) => x.id !== tmpId);
                if (!dmMessagesCache.some((x) => x.id === saved.id)) { await hydrateRow(saved, me.id, activePeerProfile.e2ee_public_key); dmMessagesCache.push(saved); }
                saveConvCache(activeConvId, dmMessagesCache); await renderMessages();
            } catch (err) {
                dmMessagesCache = dmMessagesCache.filter((x) => x.id !== tmpId); await renderMessages();
                Nexus.toast("❌ Send failed: " + (err.message || "Dobara login karein"));
            }
        },

        openMsgActionMenu: function (msgId) {
            const me = getMe(), row = dmMessagesCache.find((x) => String(x.id) === String(msgId));
            if (!me || !row || row.is_deleted_everyone) return;
            const dec = decryptedCache.get(String(msgId)) || {}, isMine = row.sender_id === me.id, isVo = Boolean(row.is_view_once || dec.viewOnce);
            const url = (!isVo && dec.mediaPath) ? (signedUrlCache.get(dec.mediaPath) || "") : "";
            const sender = isMine ? me.username : (activePeerProfile?.username || "Partner");
            const snip = dec.text || (isVo ? "1️⃣ View Once" : dec.mediaType === "video" ? "🎬 Video" : dec.mediaType === "audio" ? "🎤 Voice" : "📸 Media");
            const sheet = ensureSheet();
            sheet.innerHTML = `<div class="nx-dm-sheet-box">
                <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="font-size:11.5px;color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:250px;">"${esc(snip.slice(0, 50))}"</span><button onclick="NexusDM.closeSheet()" style="background:none;border:none;color:#94a3b8;font-size:16px;">✕</button></div>
                <div class="nx-dm-emoji-row">${["❤️", "😂", "🔥", "👍", "🙏", "💯"].map((e) => `<button onclick="NexusDM.reactToDM('${esc(msgId)}','${e}')">${e}</button>`).join("")}</div>
                <button class="nx-dm-opt" onclick="NexusDM.startReply('${esc(sender)}','${esc(snip.slice(0, 90))}')">↩️ Reply</button>
                ${dec.text ? `<button class="nx-dm-opt" onclick="NexusDM.copyMsgText('${esc(msgId)}')">📋 Copy Text</button>` : ""}
                ${url ? `<a href="${esc(url)}" download="Nexus_Media" target="_blank" onclick="NexusDM.closeSheet()" class="nx-dm-opt" style="text-decoration:none;color:#38bdf8;">⬇️ Save Media</a>` : ""}
                ${isMine && dec.text ? `<button class="nx-dm-opt" style="color:#38bdf8;" onclick="NexusDM.startEdit('${esc(msgId)}')">✏️ Edit Message</button>` : ""}
                <button class="nx-dm-opt" onclick="NexusDM.deleteDMForMe('${esc(msgId)}')">🧹 Delete for Me</button>
                ${isMine ? `<button class="nx-dm-opt" style="color:#f87171;border-color:rgba(248,113,113,.4);" onclick="NexusDM.deleteDMForEveryone('${esc(msgId)}')">🗑️ Delete for Everyone</button>` : ""}
            </div>`;
            sheet.style.display = "flex";
        },

        reactToDM: async function (msgId, emoji) {
            this.closeSheet(); const me = getMe(), sec = getSec(); if (!me || !sec) return;
            const up = await sec.toggleMessageReaction(msgId, emoji, me.username);
            const r = dmMessagesCache.find((x) => String(x.id) === String(msgId));
            if (r && up) { r.reactions = up; await renderMessages(); }
        },
        showReactionDetails: (id) => { const r = dmMessagesCache.find((x) => String(x.id) === String(id)); if (r?.reactions) Nexus.toast(Object.entries(r.reactions).map(([u, e]) => `${e} @${u}`).join(" • ")); },
        copyMsgText: function (id) { this.closeSheet(); const d = decryptedCache.get(String(id)); if (d?.text) navigator.clipboard?.writeText(d.text).then(() => Nexus.toast("📋 Copied!")); },
        startReply: function (s, t) { this.closeSheet(); dmEditingId = null; dmReplyingTo = { sender: s, text: t }; const b = document.getElementById("nx-dm-reply-bar"), x = document.getElementById("nx-dm-reply-txt"); if (b && x) { b.style.display = "flex"; x.textContent = `↩️ @${s}: ${t}`; } document.getElementById("nx-dm-input")?.focus(); },
        startEdit: function (id) { this.closeSheet(); const d = decryptedCache.get(String(id)); if (!d?.text) return; dmReplyingTo = null; dmEditingId = id; const b = document.getElementById("nx-dm-reply-bar"), x = document.getElementById("nx-dm-reply-txt"), i = document.getElementById("nx-dm-input"); if (b && x && i) { b.style.display = "flex"; x.textContent = "✏️ Editing..."; i.value = d.text; resizeInput(); i.focus(); } },
        cancelReply: () => { dmReplyingTo = null; dmEditingId = null; const b = document.getElementById("nx-dm-reply-bar"); if (b) b.style.display = "none"; },
        deleteDMForMe: function (id) { this.closeSheet(); const me = getMe(); if (me) { saveHiddenId(me.username, id); renderMessages(); Nexus.toast("🧹 Deleted for you"); } },
        deleteDMForEveryone: async function (id) {
            this.closeSheet(); const sec = getSec(), r = dmMessagesCache.find((x) => String(x.id) === String(id)); if (!sec || !r) return;
            const d = decryptedCache.get(String(id)) || {}; r.is_deleted_everyone = true; decryptedCache.set(String(id), { deleted: true, text: "" }); await renderMessages();
            await sec.deleteMessageForEveryone(id, d.mediaPath || r.media_path || "").catch(() => {}); Nexus.toast("🗑️ Deleted for Everyone!");
        },

        openViewOnce: async function (msgId) {
            const sec = getSec(), row = dmMessagesCache.find((x) => String(x.id) === String(msgId)), dec = decryptedCache.get(String(msgId)) || {};
            if (!sec || !row || row.view_once_opened || dec.viewOnceOpened) return Nexus.toast("1️⃣ Already burned!");
            const path = dec.mediaPath || row.media_path || ""; if (!path) return Nexus.toast("⚠️ Already burned!");
            const url = await sec.getSignedChatMediaUrl(path, 120); if (!url) return Nexus.toast("❌ Expired!");
            const ov = document.createElement("div"); ov.style.cssText = "position:fixed;inset:0;background:#020617;z-index:296000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:18px;user-select:none;";
            const isVid = dec.mediaType === "video";
            ov.innerHTML = `<div id="nx-vo-t" style="background:rgba(14,165,233,.16);border:1px solid #38bdf8;color:#38bdf8;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:800;margin-bottom:12px;">1️⃣ View Once • Auto-Burns</div><div style="max-width:100%;max-height:70dvh;border-radius:16px;overflow:hidden;border:1.5px solid #38bdf8;">${isVid ? `<video src="${esc(url)}" autoplay playsinline controls controlsList="nodownload" style="max-width:100%;max-height:68dvh;background:#000;"></video>` : `<canvas id="nx-vo-c" style="max-width:100%;max-height:68dvh;display:block;pointer-events:none;"></canvas>`}</div><button id="nx-vo-b" style="margin-top:16px;padding:11px 26px;border-radius:999px;background:#e11d48;color:#fff;font-weight:900;border:none;cursor:pointer;">Close &amp; Burn 🔥</button>`;
            document.body.appendChild(ov);
            if (!isVid) { const c = ov.querySelector("#nx-vo-c"), i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => { c.width = i.width; c.height = i.height; c.getContext("2d").drawImage(i, 0, 0); }; i.src = url; }
            let burned = false, s = isVid ? 25 : 10;
            const burn = async () => { if (burned) return; burned = true; clearInterval(tm); ov.remove(); row.view_once_opened = true; dec.viewOnceOpened = true; dec.mediaPath = ""; await renderMessages(); await sec.burnViewOnceMessage(msgId, path).catch(() => {}); Nexus.toast("🔥 View-Once Burned!"); };
            const tm = setInterval(() => { s--; const l = ov.querySelector("#nx-vo-t"); if (l) l.textContent = `1️⃣ View Once • Auto-Burns in ${s}s`; if (s <= 0) burn(); }, 1000);
            ov.querySelector("#nx-vo-b").onclick = burn;
        },

        toggleToolsDock: () => { const d = document.getElementById("nx-dm-v2-tools-dock"), s = document.getElementById("nx-dm-sticker-drawer"); if (s) s.style.display = "none"; if (d) { d.style.display = d.style.display === "grid" ? "none" : "grid"; setTimeout(syncViewport, 40); } },
        toggleStickerDrawer: function () { const d = document.getElementById("nx-dm-sticker-drawer"), t = document.getElementById("nx-dm-v2-tools-dock"); if (t) t.style.display = "none"; if (d) { d.style.display = d.style.display === "none" ? "block" : "none"; if (d.style.display === "block") this.renderStickers(currentStickerCat); setTimeout(syncViewport, 40); } },
        filterStickers: function (c, el) { currentStickerCat = c; document.querySelectorAll(".nx-stk-chip").forEach((x) => x.classList.remove("active")); if (el) el.classList.add("active"); this.renderStickers(c); },
        renderStickers: (c) => { const g = document.getElementById("nx-cloud-stk-grid"); if (g) g.innerHTML = STICKERS.filter((s) => s.g === c).map((s) => { const u = `https://fonts.gstatic.com/s/e/notoemoji/latest/${s.c}/512.webp`; return `<div onclick="NexusDM.sendAnimatedSticker('${u}','${s.l}')" style="background:#182229;border:1px solid #233138;border-radius:10px;padding:6px;display:flex;flex-direction:column;align-items:center;cursor:pointer;"><img src="${u}" loading="lazy" style="width:44px;height:44px;"><span style="font-size:9px;color:#8696a0;">${s.l}</span></div>`; }).join(""); },
        sendAnimatedSticker: function (url, label) { const d = document.getElementById("nx-dm-sticker-drawer"); if (d) d.style.display = "none"; this.sendDM("", { url, label: label || "Sticker" }); },

        toggleVoiceRecording: async function () {
            const btn = document.getElementById("nx-dm-v2-mic-btn"), inp = document.getElementById("nx-dm-input");
            if (!isRecordingVoice) {
                try {
                    const st = await navigator.mediaDevices.getUserMedia({ audio: true });
                    voiceRecorder = new MediaRecorder(st); voiceChunks = []; voiceRecStart = Date.now();
                    voiceRecorder.ondataavailable = (e) => { if (e.data?.size > 0) voiceChunks.push(e.data); };
                    voiceRecorder.onstop = () => {
                        st.getTracks().forEach((t) => t.stop()); clearInterval(voiceRecTimer);
                        if (btn) btn.textContent = "🎙️"; if (inp) inp.placeholder = "Message...";
                        if (voiceChunks.length) sendMediaFiles([new File([new Blob(voiceChunks, { type: "audio/webm" })], "voice.webm", { type: "audio/webm" })], "audio", false);
                    };
                    voiceRecorder.start(); isRecordingVoice = true; if (btn) btn.textContent = "⏹️";
                    voiceRecTimer = setInterval(() => { const s = Math.floor((Date.now() - voiceRecStart) / 1000); if (inp) inp.placeholder = `🔴 Recording (${s}s)... Tap ⏹️`; if (s >= 60) NexusDM.toggleVoiceRecording(); }, 500);
                } catch (e) { Nexus.toast("❌ Mic permission denied!"); }
            } else { isRecordingVoice = false; if (voiceRecorder?.state !== "inactive") voiceRecorder.stop(); }
        },

        cycleAudioSpeed: (btn) => { const a = btn?.parentElement?.querySelector("audio"); if (!a) return; const r = [1, 1.5, 2], n = r[(r.indexOf(a.playbackRate) + 1) % r.length]; a.playbackRate = n; btn.textContent = n + "x"; },
        openPhotoPreview: (url) => {
            if (!url) return; document.getElementById("nx-dm-v2-lb")?.remove();
            const lb = document.createElement("div"); lb.id = "nx-dm-v2-lb"; lb.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,.96);z-index:296000;display:flex;align-items:center;justify-content:center;padding:16px;";
            lb.innerHTML = `<div style="position:absolute;top:16px;right:16px;display:flex;gap:10px;"><a href="${esc(url)}" download="Nexus.jpg" target="_blank" style="background:#00a884;color:#020617;text-decoration:none;padding:8px 14px;border-radius:20px;font-size:12px;font-weight:900;">⬇️ Save</a><button onclick="this.closest('#nx-dm-v2-lb').remove()" style="background:#1e293b;border:1px solid #334155;color:#fff;width:36px;height:36px;border-radius:50%;cursor:pointer;">✕</button></div><img src="${esc(url)}" style="max-width:96vw;max-height:82vh;object-fit:contain;border-radius:12px;">`;
            lb.onclick = (e) => { if (e.target === lb) lb.remove(); }; document.body.appendChild(lb);
        },

        closeDM: function () {
            endRtcCall(false); clearInterval(pomoTimer);
            document.documentElement.style.overflow = ""; document.body.style.overflow = "";
            activeDmPartner = null; activeConvId = null; activePeerProfile = null; this.activePartner = null;
            if (unsubMessages) { unsubMessages(); unsubMessages = null; }
            const sec = getSec(); if (roomChannel && sec) { try { sec.sb.removeChannel(roomChannel); } catch (e) {} roomChannel = null; }
            const r = document.getElementById("nx-dm-dedicated-root"); if (r) r.style.display = "none";
            window.scrollTo(0, savedScrollY);
        },
        closeDirectChat: function () { this.closeDM(); }
    };
})();
