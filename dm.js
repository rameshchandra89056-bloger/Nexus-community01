// ============================================================================
// DM.JS (NEXUS v2.0 MASTER — 100% SUPABASE REALTIME + TRUE E2EE + 50MB MEDIA)
// Exact UUID Reactions + Photo/Video 3-Dot Menu + Real View-Once Burn
// + Offline Instant Cache + Pagination (Zero Chat Limit!)
// ============================================================================
(function () {
    let activeDmPartner = null;
    let activeConvId = null;
    let activePeerProfile = null;
    let unsubMessages = null;
    let unsubInbox = null;
    let typingChannel = null;
    let dmMessagesCache = [];
    let decryptedCache = new Map();
    let signedUrlCache = new Map();
    let dmReplyingTo = null;
    let dmEditingId = null;
    let unreadCountsByUser = {};
    let lastMsgByUser = {};
    let lastTypingPingAt = 0;
    let typingHideTimer = null;
    let currentStickerCat = "trending";
    let savedScrollY = 0;
    let loadedLimit = 50;
    let isRecordingVoice = false;
    let voiceRecorder = null;
    let voiceChunks = [];
    let voiceRecTimer = null;
    let voiceRecStart = 0;

    function normU(u) {
        return String(u || "").toLowerCase().replace(/^@/, "").trim();
    }

    function esc(v) {
        return String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[c]));
    }

    function getMe() {
        return window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
    }

    function getSec() {
        return window.NexusSecurity || null;
    }

    // -------------------- 1. CSS STYLES (CLEAN NON-OVERLAPPING LAYOUT) --------------------
    if (!document.getElementById("nx-dm-v2-style")) {
        const st = document.createElement("style");
        st.id = "nx-dm-v2-style";
        st.textContent = `
            #nx-dm-dedicated-root {
                position: fixed !important;
                left: 0; right: 0; top: 0;
                width: 100%; max-width: 640px;
                height: 100dvh; margin: 0 auto;
                background: #0b141a;
                display: none; flex-direction: column;
                z-index: 99992; overflow: hidden;
                box-shadow: 0 0 50px rgba(0,0,0,0.92);
            }
            #nx-dm-v2-msgs-box {
                flex: 1 1 0%; min-height: 0;
                overflow-y: auto; padding: 12px 10px 18px;
                display: flex; flex-direction: column; gap: 9px;
                background: #0b141a; position: relative;
            }
            .nx-dm-date-pill {
                align-self: center; margin: 6px auto 4px;
                padding: 4px 12px; border-radius: 999px;
                background: #182229; border: 1px solid #2a3942;
                color: #93c5fd; font-size: 10.5px; font-weight: 800;
                flex-shrink: 0;
            }
            .nx-dm-load-older-btn {
                align-self: center; margin: 2px auto 8px;
                padding: 6px 14px; border-radius: 999px;
                background: #1e293b; border: 1px solid #38bdf8;
                color: #38bdf8; font-size: 11.5px; font-weight: 800;
                cursor: pointer; flex-shrink: 0;
            }
            .nx-dm-offline-strip {
                display: none; padding: 5px 12px;
                background: #7c2d12; color: #fed7aa;
                font-size: 11.5px; font-weight: 800; text-align: center;
                flex-shrink: 0;
            }
            .nx-dm-row {
                width: 100%; display: flex; flex-direction: column;
                position: relative; flex-shrink: 0;
                transition: transform 0.16s ease-out;
            }
            .nx-dm-card {
                max-width: 82%; min-width: 98px;
                padding: 7px 10px 12px 10px;
                border-radius: 14px; color: #e9edef;
                font-size: 14.5px; line-height: 1.4;
                word-break: break-word; position: relative;
                box-shadow: 0 3px 10px rgba(0,0,0,0.35);
            }
            .nx-dm-card.mine {
                background: #005c4b;
                border-top-right-radius: 3px;
                border: 1px solid rgba(16,185,129,0.28);
            }
            .nx-dm-card.theirs {
                background: #202c33;
                border-top-left-radius: 3px;
                border: 1px solid rgba(71,85,105,0.35);
            }
            .nx-dm-dots-trigger {
                position: absolute; bottom: -10px; right: 7px;
                width: 28px; height: 22px; border-radius: 11px;
                background: #090d16; border: 1px solid #334155;
                color: #cbd5e1; font-size: 14px; font-weight: 900;
                display: inline-flex; align-items: center; justify-content: center;
                cursor: pointer; z-index: 6; line-height: 1;
            }
            .nx-dm-react-pill {
                display: inline-flex; align-items: center; gap: 4px;
                background: #111b21; border: 1px solid #2a3942;
                padding: 2px 8px; border-radius: 999px;
                font-size: 11.5px; color: #f8fafc; margin-top: 4px;
                cursor: pointer;
            }
            .nx-dm-deleted-pill {
                background: rgba(24,34,41,0.92);
                border: 1px dashed rgba(248,113,113,0.5);
                color: #cbd5e1; padding: 6px 12px; border-radius: 10px;
                font-size: 12px; font-style: italic;
            }
            .nx-dm-sheet-bg {
                position: fixed; inset: 0; background: rgba(2,6,23,0.82);
                z-index: 285000; display: none;
                align-items: center; justify-content: center; padding: 16px;
            }
            .nx-dm-sheet-box {
                width: 100%; max-width: 330px; background: #182229;
                border: 1.5px solid #10b981; border-radius: 20px; padding: 14px;
                box-shadow: 0 20px 50px rgba(0,0,0,0.92); color: #fff;
            }
            .nx-dm-emoji-row {
                display: flex; justify-content: space-between; align-items: center;
                background: #111b21; padding: 7px 10px; border-radius: 999px;
                margin-bottom: 10px; border: 1px solid #233138;
            }
            .nx-dm-emoji-row button {
                font-size: 22px; background: none; border: none; cursor: pointer; padding: 2px;
            }
            .nx-dm-opt {
                width: 100%; background: #202c33; border: 1px solid #2a3942;
                color: #e9edef; padding: 11px 13px; border-radius: 12px;
                font-size: 13.5px; font-weight: 700; text-align: left;
                display: flex; align-items: center; gap: 10px;
                margin-bottom: 7px; cursor: pointer;
            }
            .nx-dm-tools-dock {
                display: none; grid-template-columns: repeat(4, 1fr);
                gap: 7px; padding: 10px; background: #111b21;
                border-top: 1.5px solid #00a884; flex-shrink: 0;
            }
            .nx-dm-tool-tile {
                background: #182229; border: 1px solid #2a3942;
                border-radius: 12px; padding: 9px 4px; color: #f8fafc;
                display: flex; flex-direction: column; align-items: center;
                gap: 4px; font-size: 10.5px; font-weight: 800; cursor: pointer;
            }
            .nx-unread-pill {
                background: #00a884; color: #020617;
                font-size: 10.5px; font-weight: 900; padding: 2px 8px; border-radius: 12px;
            }
            .nx-stk-chip {
                background: #182229; color: #cbd5e1; border: 1px solid #2a3942;
                padding: 5px 11px; border-radius: 16px; font-size: 11.5px;
                font-weight: 700; white-space: nowrap; cursor: pointer;
            }
            .nx-stk-chip.active { background: #00a884; color: #020617; border-color: #00a884; }
        `;
        document.head.appendChild(st);
    }

    // -------------------- 2. LOCAL OFFLINE CACHE & HIDDEN-FOR-ME HELPERS --------------------
    function hiddenKey(u) {
        return "nx_dm_v2_hidden_" + normU(u || "guest");
    }

    function getHiddenSet(u) {
        try { return new Set(JSON.parse(localStorage.getItem(hiddenKey(u)) || "[]")); }
        catch (e) { return new Set(); }
    }

    function saveHiddenId(u, msgId) {
        const s = getHiddenSet(u);
        s.add(String(msgId));
        try { localStorage.setItem(hiddenKey(u), JSON.stringify(Array.from(s).slice(-1500))); } catch (e) {}
    }

    function saveConvLocalCache(convId, rows) {
        if (!convId || !Array.isArray(rows)) return;
        try {
            const slim = rows.slice(-45).map((r) => ({
                id: r.id,
                sender_id: r.sender_id,
                receiver_id: r.receiver_id,
                created_at: r.created_at,
                seen: r.seen,
                is_edited: r.is_edited,
                is_deleted_everyone: r.is_deleted_everyone,
                is_view_once: r.is_view_once,
                view_once_opened: r.view_once_opened,
                reactions: r.reactions || {},
                reply_to: r.reply_to || null,
                _dec: decryptedCache.get(r.id) || null
            }));
            localStorage.setItem("nx_dm_cache_" + convId, JSON.stringify(slim));
        } catch (e) {}
    }

    function loadConvLocalCache(convId) {
        try {
            const arr = JSON.parse(localStorage.getItem("nx_dm_cache_" + convId) || "[]");
            if (!Array.isArray(arr)) return [];
            arr.forEach((r) => { if (r && r.id && r._dec) decryptedCache.set(r.id, r._dec); });
            return arr;
        } catch (e) { return []; }
    }

    function formatLinks(str) {
        return esc(str || "").replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" onclick="event.stopPropagation();" style="color:#53bdeb;text-decoration:underline;font-weight:700;">$1</a>'
        );
    }

    function formatDateLabel(iso) {
        const d = new Date(iso || Date.now());
        if (isNaN(d.getTime())) return "Today";
        const now = new Date();
        const t0 = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
        const m0 = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
        const diff = Math.round((t0 - m0) / 86400000);
        if (diff <= 0) return "Today";
        if (diff === 1) return "Yesterday";
        if (diff < 7) return d.toLocaleDateString("en-US", { weekday: "long" });
        return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    }

    function formatTimeLabel(iso) {
        const d = new Date(iso || Date.now());
        return isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    function formatReactionsHtml(reactionsObj) {
        if (!reactionsObj || typeof reactionsObj !== "object") return "";
        const vals = Object.values(reactionsObj).filter(Boolean);
        if (!vals.length) return "";
        const counts = {};
        vals.forEach((em) => { counts[em] = (counts[em] || 0) + 1; });
        return Object.entries(counts)
            .map(([em, c]) => (c > 1 ? `${esc(em)} ${c}` : esc(em)))
            .join(" ");
    }

    function isUserOnline(u) {
        if (!u) return false;
        const me = getMe();
        if (me && normU(u.username) === normU(me.username)) return true;
        return u.lastOnline > 0 && (Date.now() - Number(u.lastOnline)) < 120000;
    }

    function formatLastSeen(u) {
        if (!u) return "🔐 True E2EE";
        if (isUserOnline(u)) return "🟢 Online • 🔐 E2EE";
        const ts = Number(u.lastSeenAt || u.lastOnline || 0);
        if (!ts) return "🔐 End-to-End Encrypted";
        const sec = Math.max(1, Math.floor((Date.now() - ts) / 1000));
        if (sec < 60) return "Last seen just now";
        const min = Math.floor(sec / 60);
        if (min < 60) return `Last seen ${min}m ago`;
        const hr = Math.floor(min / 60);
        if (hr < 24) return `Last seen ${hr}h ago`;
        return `Last seen ${Math.floor(hr / 24)}d ago`;
    }

    const STICKER_BANK = [
        { c: "1f525", l: "Fire", g: "trending" }, { c: "1f680", l: "Rocket", g: "trending" },
        { c: "1f4af", l: "100%", g: "trending" }, { c: "26a1", l: "Bolt", g: "trending" },
        { c: "1f451", l: "King", g: "trending" }, { c: "1f3c6", l: "Trophy", g: "trending" },
        { c: "1f602", l: "Joy", g: "funny" }, { c: "1f923", l: "ROFL", g: "funny" },
        { c: "1f62d", l: "Crying", g: "funny" }, { c: "1f480", l: "Skull", g: "funny" },
        { c: "1f9e0", l: "Brain", g: "study" }, { c: "1f913", l: "Topper", g: "study" },
        { c: "1f4a1", l: "Idea", g: "study" }, { c: "2764_fe0f", l: "Heart", g: "love" },
        { c: "1f60d", l: "HeartEye", g: "love" }, { c: "1f44d", l: "ThumbsUp", g: "love" },
        { c: "1f64f", l: "Namaste", g: "love" }
    ];

    function syncViewport() {
        const root = document.getElementById("nx-dm-dedicated-root");
        if (!root || root.style.display === "none") return;
        const vv = window.visualViewport;
        const h = Math.max(200, Math.round(vv ? vv.height : window.innerHeight));
        const top = Math.max(0, Math.round(vv ? vv.offsetTop : 0));
        root.style.height = h + "px";
        root.style.top = top + "px";
        const box = document.getElementById("nx-dm-v2-msgs-box");
        if (box) box.scrollTop = box.scrollHeight;
    }

    function updateOfflineBanner() {
        const el = document.getElementById("nx-dm-offline-strip");
        if (el) el.style.display = navigator.onLine ? "none" : "block";
    }

    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", syncViewport);
        window.visualViewport.addEventListener("scroll", syncViewport);
    }
    window.addEventListener("resize", syncViewport);
    window.addEventListener("online", updateOfflineBanner);
    window.addEventListener("offline", updateOfflineBanner);

    function resizeInput() {
        const inp = document.getElementById("nx-dm-input");
        if (!inp) return;
        inp.style.height = "36px";
        inp.style.height = Math.min(inp.scrollHeight, 105) + "px";
    }

    function ensureDmRoot() {
        let root = document.getElementById("nx-dm-dedicated-root");
        if (!root) {
            root = document.createElement("div");
            root.id = "nx-dm-dedicated-root";
            document.body.appendChild(root);
        }
        return root;
    }

    function ensureActionSheet() {
        let el = document.getElementById("nx-dm-v2-action-sheet");
        if (!el) {
            el = document.createElement("div");
            el.id = "nx-dm-v2-action-sheet";
            el.className = "nx-dm-sheet-bg";
            el.onclick = (e) => { if (e.target === el) el.style.display = "none"; };
            document.body.appendChild(el);
        }
        return el;
    }

    function openImageLightbox(url) {
        if (!url) return;
        document.getElementById("nx-dm-v2-lightbox")?.remove();
        const lb = document.createElement("div");
        lb.id = "nx-dm-v2-lightbox";
        lb.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,0.96);z-index:295000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;";
        lb.innerHTML = `
            <div style="position:absolute;top:16px;right:16px;display:flex;gap:10px;">
                <a href="${esc(url)}" download="Nexus_Media.jpg" target="_blank" style="background:#00a884;color:#020617;text-decoration:none;padding:8px 14px;border-radius:20px;font-size:12px;font-weight:900;">⬇️ Save</a>
                <button type="button" id="nx-lb-x" style="background:#1e293b;border:1px solid #334155;color:#fff;width:36px;height:36px;border-radius:50%;font-size:16px;cursor:pointer;">✕</button>
            </div>
            <img src="${esc(url)}" style="max-width:96vw;max-height:82vh;object-fit:contain;border-radius:12px;">
        `;
        lb.querySelector("#nx-lb-x").onclick = () => lb.remove();
        lb.onclick = (e) => { if (e.target === lb) lb.remove(); };
        document.body.appendChild(lb);
    }

    // -------------------- 3. DECRYPT & RESOLVE SIGNED MEDIA URLs --------------------
    async function hydrateRow(row, meId, peerPubKey) {
        const sec = getSec();
        if (!sec || !row) return null;

        let dec = decryptedCache.get(row.id);
        if (!dec || row.is_deleted_everyone || row.view_once_opened || row.is_edited) {
            dec = await sec.decryptMessageRow(row, meId, peerPubKey);
            decryptedCache.set(row.id, dec);
        }

        if (dec && !dec.deleted && dec.mediaPath && !(dec.viewOnce && dec.viewOnceOpened)) {
            if (!signedUrlCache.has(dec.mediaPath)) {
                const url = await sec.getSignedChatMediaUrl(dec.mediaPath, 3600);
                if (url) signedUrlCache.set(dec.mediaPath, url);
            }
        }
        return dec;
    }

    // -------------------- 4. RENDER UNIFIED MESSAGES (TEXT + PHOTO + VIDEO + VOICE + VIEW-ONCE) --------------------
    async function renderMessages() {
        const box = document.getElementById("nx-dm-v2-msgs-box");
        const me = getMe();
        if (!box || !me) return;

        const wasNearBottom = (box.scrollHeight - box.scrollTop - box.clientHeight) < 130;
        const hidden = getHiddenSet(me.username);

        if (!dmMessagesCache.length) {
            const pName = (activeDmPartner && activeDmPartner.name) || "Member";
            box.innerHTML = `
                <div style="margin:auto;text-align:center;color:#8696a0;font-size:12.5px;background:#182229;border:1px solid #2a3942;padding:16px;border-radius:16px;max-width:290px;">
                    🔐 <b>End-to-End Encrypted Chat</b> with <b>${esc(pName)}</b>.<br>
                    <span style="font-size:11px;color:#34d399;">Photos, 50MB Videos, Voice Notes &amp; View-Once ready!</span><br>
                    <button type="button" onclick="NexusDM.sendAnimatedSticker('[https://fonts.gstatic.com/s/e/notoemoji/latest/1f44b/512.webp','Wave](https://fonts.gstatic.com/s/e/notoemoji/latest/1f44b/512.webp','Wave)')" style="margin-top:10px;background:#00a884;color:#020617;border:none;padding:7px 14px;border-radius:16px;font-weight:900;font-size:12px;cursor:pointer;">👋 Tap to Say Hi!</button>
                </div>
            `;
            return;
        }

        const parts = [];
        if (dmMessagesCache.length >= loadedLimit) {
            parts.push(`<button type="button" class="nx-dm-load-older-btn" onclick="NexusDM.loadOlderMessages()">⬆️ Load Older Messages</button>`);
        }

        let lastDate = "";

        for (const row of dmMessagesCache) {
            const msgId = String(row.id);
            const dLbl = formatDateLabel(row.created_at);
            if (dLbl !== lastDate) {
                lastDate = dLbl;
                parts.push(`<div class="nx-dm-date-pill">${esc(dLbl)}</div>`);
            }

            const isMine = row.sender_id === me.id;
            if (!row.is_deleted_everyone && hidden.has(msgId)) {
                parts.push(`<div style="align-self:center;font-size:11.5px;color:#8696a0;font-style:italic;padding:4px 10px;">🧹 You deleted this message</div>`);
                continue;
            }

            const dec = decryptedCache.get(msgId) || { deleted: row.is_deleted_everyone, text: "" };
            const align = isMine ? "flex-end" : "flex-start";

            if (row.is_deleted_everyone || dec.deleted) {
                parts.push(`
                    <div class="nx-dm-row nx-dm-bubble-anim" data-msg-id="${esc(msgId)}" style="align-items:${align};">
                        <div class="nx-dm-deleted-pill">🚫 This message was deleted for everyone</div>
                    </div>
                `);
                continue;
            }

            const timeStr = formatTimeLabel(row.created_at);
            const tickHtml = isMine
                ? `<span style="color:${row.seen ? "#53bdeb" : "#94a3b8"};font-weight:900;margin-left:3px;">${row._sending ? "⏳" : (row.seen ? "✓✓" : "✓")}</span>`
                : "";
            const reactStr = formatReactionsHtml(row.reactions);
            const reactPill = reactStr
                ? `<div class="nx-dm-react-pill" onclick="event.stopPropagation(); NexusDM.showReactionDetails('${esc(msgId)}')">${reactStr}</div>`
                : "";

            const replyHtml = row.reply_to
                ? `<div style="background:rgba(0,0,0,0.28);border-left:3px solid #10b981;padding:4px 8px;border-radius:6px;font-size:11.5px;color:#cbd5e1;margin-bottom:5px;"><b>@${esc(row.reply_to.sender || "")}:</b> ${esc(row.reply_to.text || row.reply_to.label || "")}</div>`
                : "";

            let mediaHtml = "";
            const mUrl = row._localUrl || (dec.mediaPath ? signedUrlCache.get(dec.mediaPath) || "" : "");

            if (dec.viewOnce || row.is_view_once) {
                if (dec.viewOnceOpened || row.view_once_opened) {
                    mediaHtml = `<div style="padding:9px 12px;border-radius:11px;background:#0f172a;border:1px solid #334155;color:#94a3b8;font-size:12px;font-weight:700;">1️⃣ Opened &amp; Burned 🔥</div>`;
                } else {
                    mediaHtml = `
                        <button type="button" onclick="event.stopPropagation(); NexusDM.openViewOnce('${esc(msgId)}')" style="width:100%;padding:10px 14px;border-radius:12px;background:linear-gradient(135deg,#0c4a6e,#1e3a8a);border:1.5px solid #38bdf8;color:#e0f2fe;font-weight:800;font-size:12.5px;display:flex;align-items:center;gap:10px;cursor:pointer;text-align:left;">
                            <span style="width:24px;height:24px;border-radius:50%;background:#38bdf8;color:#020617;display:inline-flex;align-items:center;justify-content:center;font-weight:900;flex-shrink:0;">1</span>
                            <div>
                                <div>${dec.mediaType === "video" ? "View Once Video" : "View Once Photo"}</div>
                                <div style="font-size:10px;color:#7dd3fc;font-weight:600;">🔒 Tap to View • Auto-Burns Forever</div>
                            </div>
                        </button>`;
                }
            } else if (dec.sticker && dec.sticker.url) {
                mediaHtml = `<img src="${esc(dec.sticker.url)}" loading="lazy" style="width:112px;height:112px;object-fit:contain;display:block;">`;
            } else if (dec.mediaType === "video" && mUrl) {
                mediaHtml = `<video src="${esc(mUrl)}" controls playsinline preload="metadata" style="width:230px;max-width:100%;max-height:240px;border-radius:10px;background:#000;display:block;"></video>`;
            } else if (dec.mediaType === "audio" && mUrl) {
                mediaHtml = `
                    <div style="display:flex;align-items:center;gap:6px;" onclick="event.stopPropagation()">
                        <audio src="${esc(mUrl)}" controls preload="metadata" style="width:185px;height:36px;"></audio>
                        <button type="button" onclick="NexusDM.cycleAudioSpeed(this)" style="background:#090d16;color:#34d399;border:1px solid #10b981;border-radius:8px;padding:4px 7px;font-size:11px;font-weight:900;cursor:pointer;">1x</button>
                    </div>`;
            } else if (dec.mediaType === "file" && mUrl) {
                mediaHtml = `<a href="${esc(mUrl)}" target="_blank" download="${esc(dec.fileName || "document.pdf")}" onclick="event.stopPropagation()" style="display:flex;align-items:center;gap:8px;padding:9px 12px;border-radius:10px;background:#0f172a;border:1px solid #38bdf8;color:#38bdf8;font-size:12px;font-weight:800;text-decoration:none;">📄 <span>${esc(dec.fileName || "Open File")}</span></a>`;
            } else if (dec.mediaType === "image" && mUrl) {
                mediaHtml = `<img src="${esc(mUrl)}" loading="lazy" onclick="event.stopPropagation(); NexusDM.openPhotoPreview('${esc(mUrl)}')" style="width:225px;max-width:100%;max-height:260px;object-fit:cover;border-radius:10px;display:block;cursor:zoom-in;margin-bottom:4px;">`;
            }

            const textHtml = dec.text
                ? `<div style="white-space:pre-wrap;${mediaHtml ? "margin-top:4px;" : ""}">${formatLinks(dec.text)}</div>`
                : "";

            parts.push(`
                <div class="nx-dm-row nx-dm-bubble-anim" data-msg-id="${esc(msgId)}" style="align-items:${align};">
                    <div class="nx-dm-card ${isMine ? "mine" : "theirs"}" onclick="NexusDM.openMsgActionMenu('${esc(msgId)}')">
                        ${replyHtml}
                        ${mediaHtml}
                        ${textHtml}
                        <div style="display:flex;align-items:center;justify-content:flex-end;gap:5px;margin-top:4px;padding-right:30px;font-size:10px;color:rgba(233,237,239,0.72);">
                            <span>${esc(timeStr)} ${row.is_edited ? "(edited)" : ""}</span>
                            ${tickHtml}
                        </div>
                        <button type="button" class="nx-dm-dots-trigger nx-dm-message-menu-btn" onclick="event.stopPropagation(); NexusDM.openMsgActionMenu('${esc(msgId)}')" aria-label="Message menu">⋯</button>
                    </div>
                    ${reactPill}
                </div>
            `);
        }

        box.innerHTML = parts.join("");
        if (wasNearBottom) box.scrollTop = box.scrollHeight;
    }

    // -------------------- 5. INBOX REALTIME WATCHER & BANNER --------------------
    function injectDmBanner() {
        const dir = document.getElementById("nx-chat-directory");
        if (!dir || document.getElementById("nx-dm-inbox-banner")) return;
        const wrap = document.createElement("div");
        wrap.id = "nx-dm-inbox-banner";
        wrap.style.cssText = "display:flex;flex-direction:column;gap:10px;margin-bottom:12px;";
        wrap.innerHTML = `
            <div onclick="NexusDM.openInboxModal()" style="background:linear-gradient(135deg,rgba(0,168,132,0.22),rgba(37,99,235,0.22));border:1.5px solid #00a884;border-radius:16px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:40px;height:40px;border-radius:12px;background:#00a884;color:#020617;display:flex;align-items:center;justify-content:center;font-size:19px;font-weight:900;">🔐</div>
                    <div>
                        <div style="font-weight:800;font-size:14px;color:#f8fafc;">Nexus 1:1 Encrypted DM (v2)</div>
                        <div style="font-size:11.5px;color:#5eead4;">True E2EE • 50MB Video • View-Once 1️⃣ • Unlimited</div>
                    </div>
                </div>
                <span id="nx-dm-banner-badge" style="background:#00a884;color:#020617;padding:5px 11px;border-radius:12px;font-size:11.5px;font-weight:800;">Open →</span>
            </div>
        `;
        dir.insertBefore(wrap, dir.firstChild);
    }
    setInterval(injectDmBanner, 800);

    async function refreshInboxCounts() {
        const me = getMe();
        const sec = getSec();
        if (!me || !me.id || !sec || !sec.sb) return;

        const { data } = await sec.sb
            .from("messages")
            .select("id, sender_id, receiver_id, seen, is_deleted_everyone, msg_type, is_view_once, created_at")
            .eq("receiver_id", me.id)
            .order("created_at", { ascending: false })
            .limit(80);

        unreadCountsByUser = {};
        lastMsgByUser = {};
        let total = 0;

        (data || []).forEach((m) => {
            const sId = m.sender_id;
            if (!lastMsgByUser[sId]) lastMsgByUser[sId] = m;
            if (!m.seen && !m.is_deleted_everyone) {
                unreadCountsByUser[sId] = (unreadCountsByUser[sId] || 0) + 1;
                total++;
            }
        });

        const badge = document.getElementById("nx-dm-banner-badge");
        if (badge) {
            badge.textContent = total > 0 ? `🔴 ${total} New` : "Open →";
            badge.style.background = total > 0 ? "#ef4444" : "#00a884";
            badge.style.color = total > 0 ? "#fff" : "#020617";
        }
    }

    function startInboxRealtime() {
        const me = getMe();
        const sec = getSec();
        if (!me || !me.id || !sec || !sec.sb || unsubInbox) return;

        refreshInboxCounts();
        const ch = sec.sb
            .channel("nx_inbox_" + me.id)
            .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `receiver_id=eq.${me.id}` }, () => {
                refreshInboxCounts();
            })
            .subscribe();
        unsubInbox = () => { try { sec.sb.removeChannel(ch); } catch (e) {} };
    }
    setInterval(startInboxRealtime, 1500);
    // -------------------- 6. IMAGE COMPRESSION & 50MB SUPABASE UPLOAD --------------------
    function compressImageToFile(file) {
        return new Promise((resolve) => {
            if (!file.type || !file.type.startsWith("image/") || file.size < 180000) return resolve(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const c = document.createElement("canvas");
                    const MAX = 1080;
                    let w = img.width, h = img.height;
                    if (w > h && w > MAX) { h = Math.round((h * MAX) / w); w = MAX; }
                    else if (h > MAX) { w = Math.round((w * MAX) / h); h = MAX; }
                    c.width = w; c.height = h;
                    c.getContext("2d").drawImage(img, 0, 0, w, h);
                    c.toBlob(
                        (b) => resolve(b ? new File([b], "photo.webp", { type: "image/webp" }) : file),
                        "image/webp",
                        0.78
                    );
                };
                img.onerror = () => resolve(file);
                img.src = e.target.result;
            };
            reader.onerror = () => resolve(file);
            reader.readAsDataURL(file);
        });
    }

    async function sendMediaFiles(fileList, forcedType, isViewOnce) {
        const files = Array.from(fileList || []);
        if (!files.length) return;
        const me = getMe();
        const sec = getSec();
        if (!me || !activeConvId || !activePeerProfile || !sec) {
            return Nexus.toast("⚠️ Pehle Login karke chat kholein!");
        }
        if (!navigator.onLine) return Nexus.toast("⚠️ Offline! Internet aane par bhejein.");

        const dock = document.getElementById("nx-dm-v2-tools-dock");
        if (dock) dock.style.display = "none";

        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            if (file.size > 50 * 1024 * 1024) {
                Nexus.toast(`⚠️ ${file.name} 50MB se badi hai!`);
                continue;
            }

            const mime = (file.type || "").toLowerCase();
            const mediaType = forcedType || (
                mime.startsWith("video") ? "video" :
                mime.startsWith("audio") ? "audio" :
                mime.includes("pdf") ? "file" : "image"
            );

            const tempId = "tmp_" + Date.now() + "_" + i;
            const localUrl = URL.createObjectURL(file);
            const tempRow = {
                id: tempId,
                sender_id: me.id,
                receiver_id: activePeerProfile.id,
                created_at: new Date().toISOString(),
                is_view_once: Boolean(isViewOnce),
                view_once_opened: false,
                reactions: {},
                reply_to: dmReplyingTo ? Object.assign({}, dmReplyingTo) : null,
                _sending: true,
                _localUrl: localUrl
            };
            decryptedCache.set(tempId, {
                deleted: false, text: "", mediaPath: "", mediaType,
                fileName: file.name || "file", sticker: null,
                viewOnce: Boolean(isViewOnce), viewOnceOpened: false
            });
            dmMessagesCache.push(tempRow);
            await renderMessages();

            try {
                if (mediaType === "image") file = await compressImageToFile(file);
                const uploaded = await sec.uploadPrivateChatMedia(file, activeConvId);
                const saved = await sec.sendChatMessage({
                    conversationId: activeConvId,
                    myUserId: me.id,
                    peerUserId: activePeerProfile.id,
                    peerPublicKeyJson: activePeerProfile.e2ee_public_key || null,
                    mediaPath: uploaded.path,
                    mediaType,
                    fileName: uploaded.fileName,
                    isViewOnce: Boolean(isViewOnce),
                    replyTo: dmReplyingTo ? Object.assign({}, dmReplyingTo) : null
                });

                dmMessagesCache = dmMessagesCache.filter((x) => x.id !== tempId);
                if (!dmMessagesCache.some((x) => x.id === saved.id)) {
                    saved._localUrl = localUrl;
                    await hydrateRow(saved, me.id, activePeerProfile.e2ee_public_key);
                    dmMessagesCache.push(saved);
                }
                NexusDM.cancelReply();
                saveConvLocalCache(activeConvId, dmMessagesCache);
                await renderMessages();
            } catch (err) {
                dmMessagesCache = dmMessagesCache.filter((x) => x.id !== tempId);
                await renderMessages();
                Nexus.toast("❌ Upload failed: " + (err.message || "Storage policy check karein"));
            }
        }
        Nexus.toast(isViewOnce ? "1️⃣ Protected View-Once Sent!" : "✅ Sent & Synced!");
    }

    // -------------------- 7. CONVERSATION LOADER & REALTIME SUBSCRIBER --------------------
    async function loadConversationMessages(keepExistingLimit) {
        const me = getMe();
        const sec = getSec();
        if (!me || !activeConvId || !activePeerProfile || !sec) return;

        // Instant Offline-Safe Cache Render First (0.01s, zero flicker!)
        if (!keepExistingLimit) {
            const cached = loadConvLocalCache(activeConvId);
            if (cached.length) {
                dmMessagesCache = cached;
                await renderMessages();
            }
        }

        if (!navigator.onLine) return;

        const { data, error } = await sec.sb
            .from("messages")
            .select("*")
            .eq("conversation_id", activeConvId)
            .order("created_at", { ascending: false })
            .limit(loadedLimit);

        if (error || !Array.isArray(data)) return;

        const ordered = data.reverse();
        for (const r of ordered) {
            await hydrateRow(r, me.id, activePeerProfile.e2ee_public_key);
        }
        dmMessagesCache = ordered;
        saveConvLocalCache(activeConvId, dmMessagesCache);
        await renderMessages();

        // Mark incoming messages seen
        sec.markConversationSeen(activeConvId, me.id).catch(() => {});
    }

    function subscribeActiveConversation() {
        const me = getMe();
        const sec = getSec();
        if (!me || !activeConvId || !activePeerProfile || !sec) return;

        if (unsubMessages) { unsubMessages(); unsubMessages = null; }
        if (typingChannel) { try { sec.sb.removeChannel(typingChannel); } catch (e) {} typingChannel = null; }

        unsubMessages = sec.subscribeToConversation(activeConvId, async (payload) => {
            const row = payload && payload.new;
            if (!row || !row.id) return;

            await hydrateRow(row, me.id, activePeerProfile.e2ee_public_key);
            const idx = dmMessagesCache.findIndex((x) => x.id === row.id);
            if (idx === -1) dmMessagesCache.push(row);
            else dmMessagesCache[idx] = Object.assign({}, dmMessagesCache[idx], row);

            dmMessagesCache.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            saveConvLocalCache(activeConvId, dmMessagesCache);
            await renderMessages();

            if (row.receiver_id === me.id && !row.seen && !row.is_deleted_everyone) {
                sec.markConversationSeen(activeConvId, me.id).catch(() => {});
            }
        });

        // Zero-Quota Realtime Typing Broadcast
        typingChannel = sec.sb.channel("nx_type_" + activeConvId);
        typingChannel
            .on("broadcast", { event: "typing" }, ({ payload }) => {
                if (!payload || payload.by === me.id) return;
                const bar = document.getElementById("nx-dm-typing-bar");
                if (bar) {
                    bar.style.display = "flex";
                    clearTimeout(typingHideTimer);
                    typingHideTimer = setTimeout(() => { bar.style.display = "none"; }, 3200);
                }
            })
            .subscribe();
    }

    // -------------------- 8. PUBLIC window.NexusDM API --------------------
    window.NexusDM = {
        activePartner: null,

        openInboxModal: function () {
            this.closeDM(true);
            const me = getMe();
            if (!me) {
                Nexus.toast("🔒 Pehle Login karein!");
                if (window.openNexusSupabaseAuthModal) window.openNexusSupabaseAuthModal("signin");
                return;
            }
            refreshInboxCounts();

            const modal = document.getElementById("nx-global-modal");
            const others = (Nexus.users || []).filter((u) => u && u.id && u.id !== me.id && normU(u.username) !== "nexus_official");

            others.sort((a, b) => {
                const ua = unreadCountsByUser[a.id] || 0;
                const ub = unreadCountsByUser[b.id] || 0;
                if (ua !== ub) return ub - ua;
                return (isUserOnline(b) ? 1 : 0) - (isUserOnline(a) ? 1 : 0);
            });

            const vaultRow = `
                <div onclick="NexusDM.openDirectChat('${esc(me.username)}','Saved Messages (My Cloud)','')" style="display:flex;align-items:center;justify-content:space-between;padding:11px 12px;background:linear-gradient(135deg,rgba(16,185,129,0.2),rgba(15,23,42,0.95));border:1.5px solid #10b981;border-radius:14px;cursor:pointer;">
                    <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
                        <div style="width:42px;height:42px;border-radius:50%;background:#10b981;color:#020617;display:flex;align-items:center;justify-content:center;font-size:19px;font-weight:900;">🔖</div>
                        <div style="min-width:0;">
                            <div style="font-weight:800;font-size:14px;color:#5eead4;">Saved Messages (Personal Cloud)</div>
                            <div style="font-size:11px;color:#cbd5e1;">Save private notes, photos, videos &amp; PDFs</div>
                        </div>
                    </div>
                    <span style="background:#10b981;color:#020617;padding:4px 9px;border-radius:10px;font-size:11px;font-weight:900;">Vault →</span>
                </div>
            `;

            const listHtml = others.map((u) => {
                const unread = unreadCountsByUser[u.id] || 0;
                const online = isUserOnline(u);
                const lm = lastMsgByUser[u.id];
                const sub = lm
                    ? (lm.is_deleted_everyone ? "🚫 Deleted" : lm.is_view_once ? "1️⃣ View Once" : lm.msg_type === "image" ? "📸 Photo" : lm.msg_type === "video" ? "🎬 Video" : "🔐 Encrypted message")
                    : `@${u.username} • ${u.bio || "Nexus Member"}`;
                const av = u.dp
                    ? `<img src="${esc(u.dp)}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;">`
                    : `<div style="width:42px;height:42px;border-radius:50%;background:#00a884;color:#020617;display:flex;align-items:center;justify-content:center;font-weight:900;">${esc((u.name || u.username)[0].toUpperCase())}</div>`;

                return `
                    <div onclick="NexusDM.openDirectChat('${esc(u.username)}','${esc(u.name || u.username)}','${esc(u.dp || "")}')" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:#182229;border:1px solid #233138;border-radius:14px;cursor:pointer;">
                        <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
                            ${av}
                            <div style="min-width:0;flex:1;">
                                <div style="font-weight:700;font-size:14px;color:#fff;">${esc(u.name || u.username)} ${online ? "🟢" : ""}</div>
                                <div style="font-size:11.5px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(sub)}</div>
                            </div>
                        </div>
                        ${unread > 0 ? `<span class="nx-unread-pill">${unread}</span>` : `<span style="color:#00a884;font-size:12px;font-weight:800;">Chat →</span>`}
                    </div>
                `;
            }).join("");

            modal.innerHTML = `
                <div class="nx-modal-box" style="border:1.5px solid #10b981;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                        <h3 style="font-size:16px;color:#f8fafc;">🔐 Nexus 1:1 Encrypted DM</h3>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer;">✕</button>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:8px;max-height:68vh;overflow-y:auto;">${vaultRow}${listHtml}</div>
                </div>
            `;
            modal.style.display = "flex";
        },

        openDirectChat: async function (partnerUsername, partnerName, partnerDp) {
            const me = getMe();
            const sec = getSec();
            if (!me || !me.id || !sec) {
                Nexus.toast("🔒 Pehle Login karein!");
                if (window.openNexusSupabaseAuthModal) window.openNexusSupabaseAuthModal("signin");
                return;
            }

            const cleanPartner = normU(partnerUsername);
            if (!cleanPartner) return;

            document.getElementById("nx-global-modal").style.display = "none";
            document.getElementById("nx-public-profile-modal")?.remove();

            let peer = (cleanPartner === normU(me.username))
                ? me
                : (Nexus.users || []).find((u) => u && normU(u.username) === cleanPartner);

            if (!peer && navigator.onLine) {
                const { data } = await sec.sb.from("profiles").select("*").ilike("username", cleanPartner).maybeSingle();
                if (data) {
                    peer = {
                        id: data.id, username: data.username, name: data.display_name || data.username,
                        dp: data.avatar_url || "", e2ee_public_key: data.e2ee_public_key || null,
                        lastOnline: data.last_online ? new Date(data.last_online).getTime() : 0
                    };
                }
            }
            if (!peer || !peer.id) return Nexus.toast("❌ User profile nahi mila!");

            savedScrollY = window.scrollY || 0;
            document.documentElement.style.overflow = "hidden";
            document.body.style.overflow = "hidden";

            dmReplyingTo = null;
            dmEditingId = null;
            loadedLimit = 50;
            dmMessagesCache = [];
            decryptedCache.clear();

            activePeerProfile = peer;
            activeDmPartner = { username: peer.username, name: partnerName || peer.name || peer.username };
            this.activePartner = peer.username;
            window.activeDMUser = peer.username;
            window.currentChatUser = peer.username;

            const dispName = activeDmPartner.name;
            const finalDp = partnerDp || peer.dp || "";
            const avHtml = finalDp
                ? `<img src="${esc(finalDp)}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;flex-shrink:0;">`
                : `<div style="width:38px;height:38px;border-radius:50%;background:#00a884;color:#020617;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:15px;flex-shrink:0;">${esc(dispName[0].toUpperCase())}</div>`;

            const root = ensureDmRoot();
            root.innerHTML = `
                <div style="height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 12px;background:#202c33;border-bottom:1px solid #2a3942;flex-shrink:0;">
                    <div style="display:flex;align-items:center;gap:9px;min-width:0;flex:1;">
                        <button type="button" onclick="NexusDM.openInboxModal()" style="background:none;border:none;color:#e9edef;font-size:20px;cursor:pointer;padding:4px 6px;">←</button>
                        <div onclick="NexusDM.closeDM(); if(window.openPublicUserProfileModal) openPublicUserProfileModal('${esc(peer.username)}');" style="display:flex;align-items:center;gap:9px;min-width:0;cursor:pointer;flex:1;">
                            ${avHtml}
                            <div style="min-width:0;flex:1;">
                                <div id="nx-dm-partner-name" data-partner-username="${esc(peer.username)}" style="font-weight:800;font-size:15px;color:#e9edef;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(dispName)}</div>
                                <div id="nx-dm-partner-status" style="font-size:11px;color:${isUserOnline(peer) ? "#00a884" : "#8696a0"};">${esc(formatLastSeen(peer))}</div>
                            </div>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <button type="button" onclick="if(window.openE2EEVerificationModal) openE2EEVerificationModal('${esc(peer.username)}')" style="background:#182229;border:1px solid #10b981;color:#34d399;padding:5px 8px;border-radius:10px;font-size:11px;font-weight:900;cursor:pointer;" title="Verify E2EE">🔐</button>
                        <button type="button" onclick="NexusDM.closeDM()" style="background:#2a3942;border:none;color:#e9edef;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:14px;">✕</button>
                    </div>
                </div>

                <div id="nx-dm-offline-strip" class="nx-dm-offline-strip">⚠️ Offline Mode — Showing cached chats</div>
                <div id="nx-dm-v2-msgs-box"></div>

                <div id="nx-dm-typing-bar" style="display:none;padding:5px 14px;background:#111b21;font-size:11.5px;color:#00a884;font-weight:800;flex-shrink:0;">
                    ✍️ ${esc(dispName)} is typing...
                </div>

                <div id="nx-dm-sticker-drawer" style="display:none;background:#111b21;border-top:1px solid #2a3942;padding:8px 10px;flex-shrink:0;">
                    <div style="display:flex;gap:6px;overflow-x:auto;margin-bottom:7px;">
                        <span class="nx-stk-chip active" onclick="NexusDM.filterStickersByCat('trending', this)">🔥 Trending</span>
                        <span class="nx-stk-chip" onclick="NexusDM.filterStickersByCat('funny', this)">😂 Funny</span>
                        <span class="nx-stk-chip" onclick="NexusDM.filterStickersByCat('study', this)">📚 Study</span>
                        <span class="nx-stk-chip" onclick="NexusDM.filterStickersByCat('love', this)">❤️ Love</span>
                        <button type="button" onclick="document.getElementById('nx-dm-sticker-drawer').style.display='none'" style="margin-left:auto;background:#202c33;border:none;color:#cbd5e1;width:26px;height:26px;border-radius:50%;cursor:pointer;">✕</button>
                    </div>
                    <div id="nx-cloud-stk-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;height:165px;overflow-y:auto;"></div>
                </div>

                <div id="nx-dm-v2-tools-dock" class="nx-dm-tools-dock">
                    <label for="nx-v2-pick-photo" class="nx-dm-tool-tile" style="margin:0;"><span style="font-size:20px;">🖼️</span><span>Photos</span></label>
                    <label for="nx-v2-pick-vo" class="nx-dm-tool-tile" style="margin:0;border-color:#38bdf8;color:#7dd3fc;"><span style="font-size:20px;">1️⃣</span><span>View Once</span></label>
                    <label for="nx-v2-pick-video" class="nx-dm-tool-tile" style="margin:0;color:#38bdf8;"><span style="font-size:20px;">🎬</span><span>Video 50M</span></label>
                    <label for="nx-v2-pick-pdf" class="nx-dm-tool-tile" style="margin:0;color:#fbbf24;"><span style="font-size:20px;">📄</span><span>PDF / File</span></label>
                    <button type="button" class="nx-dm-tool-tile" onclick="NexusDM.toggleVoiceRecording()"><span style="font-size:20px;">🎤</span><span>Voice Note</span></button>
                    <button type="button" class="nx-dm-tool-tile" onclick="document.getElementById('nx-dm-v2-tools-dock').style.display='none'; if(window.openSharedWhiteboardModal) openSharedWhiteboardModal();"><span style="font-size:20px;">✏️</span><span>Board</span></button>
                    <button type="button" class="nx-dm-tool-tile" onclick="document.getElementById('nx-dm-v2-tools-dock').style.display='none'; if(window.openE2EEVerificationModal) openE2EEVerificationModal('${esc(peer.username)}');"><span style="font-size:20px;">🔐</span><span>Verify Key</span></button>
                    <button type="button" class="nx-dm-tool-tile" onclick="document.getElementById('nx-dm-v2-tools-dock').style.display='none';"><span style="font-size:20px;">✕</span><span>Close</span></button>
                </div>

                <input type="file" id="nx-v2-pick-photo" accept="image/*" multiple style="display:none;">
                <input type="file" id="nx-v2-pick-vo" accept="image/*,video/*" style="display:none;">
                <input type="file" id="nx-v2-pick-video" accept="video/mp4,video/webm,video/*" style="display:none;">
                <input type="file" id="nx-v2-pick-pdf" accept="application/pdf,*/*" style="display:none;">

                <div id="nx-dm-reply-bar" style="display:none;padding:7px 14px;background:#182229;border-left:4px solid #00a884;align-items:center;justify-content:space-between;font-size:12px;color:#e9edef;flex-shrink:0;">
                    <span id="nx-dm-reply-txt" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;"></span>
                    <button type="button" onclick="NexusDM.cancelReply()" style="background:none;border:none;color:#ef4444;font-weight:900;cursor:pointer;margin-left:10px;">✕</button>
                </div>

                <div id="nx-dm-composer" style="width:100%;display:flex;align-items:center;gap:7px;padding:8px 10px;background:#111b21;border-top:1px solid #1e293b;flex-shrink:0;">
                    <div style="flex:1;min-width:0;display:flex;align-items:center;background:#202c33;border-radius:24px;padding:3px 9px;gap:6px;">
                        <button type="button" onclick="NexusDM.toggleStickerDrawer()" style="background:none;border:none;font-size:20px;cursor:pointer;padding:2px;">😊</button>
                        <textarea id="nx-dm-input" rows="1" placeholder="Message..." autocomplete="off" style="flex:1;width:100%;min-width:0;height:36px;max-height:105px;padding:8px 2px;border:none;background:transparent;color:#e9edef;font-size:14.5px;line-height:20px;resize:none;outline:none;"></textarea>
                        <button type="button" id="nx-dm-v2-plus-btn" onclick="NexusDM.toggleToolsDock()" style="width:29px;height:29px;border-radius:50%;background:rgba(0,168,132,0.18);border:1.5px solid #00a884;color:#00a884;font-size:19px;font-weight:900;cursor:pointer;flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;">+</button>
                        <button type="button" id="nx-dm-v2-mic-btn" onclick="NexusDM.toggleVoiceRecording()" style="background:none;border:none;font-size:18px;cursor:pointer;padding:2px;">🎙️</button>
                    </div>
                    <button type="button" onclick="NexusDM.sendDM()" style="background:#00a884;color:#020617;border:none;width:42px;height:42px;border-radius:50%;font-size:18px;font-weight:900;cursor:pointer;flex-shrink:0;">➤</button>
                </div>
            `;

            root.style.display = "flex";
            updateOfflineBanner();
            syncViewport();

            // Bind File Inputs
            const bindFile = (id, forced, vo) => {
                const el = document.getElementById(id);
                if (el) el.onchange = (e) => {
                    if (e.target.files && e.target.files.length) sendMediaFiles(e.target.files, forced, vo);
                    e.target.value = "";
                };
            };
            bindFile("nx-v2-pick-photo", "image", false);
            bindFile("nx-v2-pick-vo", null, true);
            bindFile("nx-v2-pick-video", "video", false);
            bindFile("nx-v2-pick-pdf", "file", false);

            const inp = document.getElementById("nx-dm-input");
            if (inp) {
                inp.addEventListener("input", () => {
                    resizeInput();
                    const now = Date.now();
                    if (typingChannel && now - lastTypingPingAt > 1800) {
                        lastTypingPingAt = now;
                        typingChannel.send({ type: "broadcast", event: "typing", payload: { by: me.id } });
                    }
                });
                inp.addEventListener("keydown", (e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); NexusDM.sendDM(); }
                });
            }

            try {
                activeConvId = await sec.getOrCreateConversation(me.id, peer.id);
                window.__nxActiveConversationId = activeConvId;
                await loadConversationMessages(false);
                subscribeActiveConversation();
            } catch (err) {
                Nexus.toast("⚠️ Chat connect error: " + (err.message || "Retry"));
            }
        },

        loadOlderMessages: async function () {
            loadedLimit += 50;
            await loadConversationMessages(true);
        },

        sendDM: async function (ignoredImg, customSticker) {
            const me = getMe();
            const sec = getSec();
            const inp = document.getElementById("nx-dm-input");
            if (!me || !activeConvId || !activePeerProfile || !sec) return;
            if (!navigator.onLine) return Nexus.toast("⚠️ You are offline!");

            const txt = inp ? inp.value.trim() : "";
            if (!txt && !customSticker) return;

            if (dmEditingId && txt && !customSticker) {
                const editId = dmEditingId;
                this.cancelReply();
                if (inp) { inp.value = ""; resizeInput(); }
                try {
                    await sec.editChatMessage({
                        messageId: editId,
                        myUserId: me.id,
                        peerUserId: activePeerProfile.id,
                        peerPublicKeyJson: activePeerProfile.e2ee_public_key || null,
                        newText: txt
                    });
                    Nexus.toast("✏️ Message updated!");
                } catch (err) { Nexus.toast("❌ Edit failed"); }
                return;
            }

            const replyPayload = dmReplyingTo ? Object.assign({}, dmReplyingTo) : null;
            this.cancelReply();
            if (inp && !customSticker) { inp.value = ""; resizeInput(); }

            const tempId = "tmp_" + Date.now();
            const tempRow = {
                id: tempId, sender_id: me.id, receiver_id: activePeerProfile.id,
                created_at: new Date().toISOString(), reactions: {},
                reply_to: replyPayload, _sending: true
            };
            decryptedCache.set(tempId, {
                deleted: false, text: customSticker ? "" : txt, mediaPath: "",
                mediaType: "text", fileName: "", sticker: customSticker || null,
                viewOnce: false, viewOnceOpened: false
            });
            dmMessagesCache.push(tempRow);
            await renderMessages();

            try {
                const saved = await sec.sendChatMessage({
                    conversationId: activeConvId,
                    myUserId: me.id,
                    peerUserId: activePeerProfile.id,
                    peerPublicKeyJson: activePeerProfile.e2ee_public_key || null,
                    text: customSticker ? "" : txt,
                    sticker: customSticker || null,
                    replyTo: replyPayload
                });
                dmMessagesCache = dmMessagesCache.filter((x) => x.id !== tempId);
                if (!dmMessagesCache.some((x) => x.id === saved.id)) {
                    await hydrateRow(saved, me.id, activePeerProfile.e2ee_public_key);
                    dmMessagesCache.push(saved);
                }
                saveConvLocalCache(activeConvId, dmMessagesCache);
                await renderMessages();
            } catch (err) {
                dmMessagesCache = dmMessagesCache.filter((x) => x.id !== tempId);
                await renderMessages();
                Nexus.toast("❌ Send failed: " + (err.message || "Retry"));
            }
        },

        // EXACT MESSAGE 3-DOT ACTION MENU (Works identically for Text, Photo, Video, Voice, File & View-Once!)
        openMsgActionMenu: function (msgId) {
            const me = getMe();
            const row = dmMessagesCache.find((x) => String(x.id) === String(msgId));
            if (!me || !row || row.is_deleted_everyone) return;

            const dec = decryptedCache.get(String(msgId)) || {};
            const isMine = row.sender_id === me.id;
            const isViewOnce = Boolean(row.is_view_once || dec.viewOnce);
            const signedUrl = (!isViewOnce && dec.mediaPath) ? (signedUrlCache.get(dec.mediaPath) || "") : "";
            const senderLbl = isMine ? me.username : ((activePeerProfile && activePeerProfile.username) || "Partner");
            const snippet = dec.text || (isViewOnce ? "1️⃣ View Once" : dec.mediaType === "video" ? "🎬 Video" : dec.mediaType === "audio" ? "🎤 Voice" : dec.mediaType === "image" ? "📸 Photo" : "✨ Media");

            const emojis = ["❤️", "😂", "🔥", "👍", "🙏", "💯"];
            const sheet = ensureActionSheet();

            sheet.innerHTML = `
                <div class="nx-dm-sheet-box">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                        <span style="font-size:11.5px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:250px;">"${esc(snippet.slice(0, 60))}"</span>
                        <button type="button" onclick="document.getElementById('nx-dm-v2-action-sheet').style.display='none'" style="background:none;border:none;color:#94a3b8;font-size:16px;cursor:pointer;">✕</button>
                    </div>
                    <div class="nx-dm-emoji-row">
                        ${emojis.map((em) => `<button type="button" onclick="NexusDM.reactToDM('${esc(msgId)}','${em}')">${em}</button>`).join("")}
                    </div>
                    <button type="button" class="nx-dm-opt" onclick="NexusDM.startReply('${esc(senderLbl)}','${esc(snippet.slice(0, 100))}')"><span>↩️</span><span>Reply</span></button>
                    ${dec.text ? `<button type="button" class="nx-dm-opt" onclick="NexusDM.copyMsgText('${esc(msgId)}')"><span>📋</span><span>Copy Text</span></button>` : ""}
                    ${signedUrl ? `<a href="${esc(signedUrl)}" download="Nexus_Media" target="_blank" onclick="document.getElementById('nx-dm-v2-action-sheet').style.display='none'" class="nx-dm-opt" style="text-decoration:none;color:#38bdf8;"><span>⬇️</span><span>Save / Download Media</span></a>` : ""}
                    ${isMine && dec.text ? `<button type="button" class="nx-dm-opt" style="color:#38bdf8;" onclick="NexusDM.startEdit('${esc(msgId)}')"><span>✏️</span><span>Edit Message</span></button>` : ""}
                    <button type="button" class="nx-dm-opt" onclick="NexusDM.deleteDMForMe('${esc(msgId)}')"><span>🧹</span><span>Delete for Me</span></button>
                    ${isMine ? `<button type="button" class="nx-dm-opt" style="color:#f87171;border-color:rgba(248,113,113,0.4);" onclick="NexusDM.deleteDMForEveryone('${esc(msgId)}')"><span>🗑️</span><span>Delete for Everyone</span></button>` : ""}
                </div>
            `;
            sheet.style.display = "flex";
        },

        reactToDM: async function (msgId, emoji) {
            document.getElementById("nx-dm-v2-action-sheet").style.display = "none";
            const me = getMe();
            const sec = getSec();
            if (!me || !sec) return;
            try {
                const updated = await sec.toggleMessageReaction(msgId, emoji, me.username);
                const row = dmMessagesCache.find((x) => String(x.id) === String(msgId));
                if (row && updated) {
                    row.reactions = updated;
                    await renderMessages();
                }
            } catch (err) { Nexus.toast("⚠️ Reaction failed"); }
        },

        showReactionDetails: function (msgId) {
            const row = dmMessagesCache.find((x) => String(x.id) === String(msgId));
            if (!row || !row.reactions) return;
            const list = Object.entries(row.reactions).map(([u, em]) => `${em} @${u}`).join("  •  ");
            if (list) Nexus.toast(list);
        },

        copyMsgText: function (msgId) {
            document.getElementById("nx-dm-v2-action-sheet").style.display = "none";
            const dec = decryptedCache.get(String(msgId));
            if (dec && dec.text && navigator.clipboard) {
                navigator.clipboard.writeText(dec.text).then(() => Nexus.toast("📋 Copied!"));
            }
        },

        startReply: function (sender, snippet) {
            document.getElementById("nx-dm-v2-action-sheet").style.display = "none";
            dmEditingId = null;
            dmReplyingTo = { sender, text: snippet };
            const bar = document.getElementById("nx-dm-reply-bar");
            const txt = document.getElementById("nx-dm-reply-txt");
            if (bar && txt) { bar.style.display = "flex"; txt.textContent = `↩️ @${sender}: ${snippet}`; }
            document.getElementById("nx-dm-input")?.focus();
        },

        startEdit: function (msgId) {
            document.getElementById("nx-dm-v2-action-sheet").style.display = "none";
            const dec = decryptedCache.get(String(msgId));
            if (!dec || !dec.text) return;
            dmReplyingTo = null;
            dmEditingId = msgId;
            const bar = document.getElementById("nx-dm-reply-bar");
            const txt = document.getElementById("nx-dm-reply-txt");
            const inp = document.getElementById("nx-dm-input");
            if (bar && txt && inp) {
                bar.style.display = "flex";
                txt.textContent = "✏️ Editing message...";
                inp.value = dec.text;
                resizeInput();
                inp.focus();
            }
        },

        cancelReply: function () {
            dmReplyingTo = null;
            dmEditingId = null;
            const bar = document.getElementById("nx-dm-reply-bar");
            if (bar) bar.style.display = "none";
        },

        deleteDMForMe: function (msgId) {
            document.getElementById("nx-dm-v2-action-sheet").style.display = "none";
            const me = getMe();
            if (!me) return;
            saveHiddenId(me.username, msgId);
            renderMessages();
            Nexus.toast("🧹 Deleted for you");
        },

        deleteDMForEveryone: async function (msgId) {
            document.getElementById("nx-dm-v2-action-sheet").style.display = "none";
            const sec = getSec();
            const row = dmMessagesCache.find((x) => String(x.id) === String(msgId));
            if (!sec || !row) return;
            const dec = decryptedCache.get(String(msgId)) || {};

            row.is_deleted_everyone = true;
            decryptedCache.set(String(msgId), { deleted: true, text: "" });
            await renderMessages();

            try {
                await sec.deleteMessageForEveryone(msgId, dec.mediaPath || row.media_path || "");
                Nexus.toast("🗑️ Deleted for Everyone!");
            } catch (err) { Nexus.toast("⚠️ Delete failed"); }
        },

        // TRUE VIEW-ONCE VIEWER + PERMANENT BURN (PHOTO <canvas> + VIDEO)
        openViewOnce: async function (msgId) {
            const sec = getSec();
            const me = getMe();
            const row = dmMessagesCache.find((x) => String(x.id) === String(msgId));
            if (!sec || !me || !row) return;
            const dec = decryptedCache.get(String(msgId)) || {};
            if (row.view_once_opened || dec.viewOnceOpened) {
                return Nexus.toast("1️⃣ View-Once media pehle hi burn ho chuki hai!");
            }
            const path = dec.mediaPath || row.media_path || "";
            if (!path) return Nexus.toast("⚠️ File already burned!");

            Nexus.toast("🔓 Opening Protected View-Once...");
            const url = await sec.getSignedChatMediaUrl(path, 120);
            if (!url) return Nexus.toast("❌ Expired or already burned!");

            const overlay = document.createElement("div");
            overlay.style.cssText = "position:fixed;inset:0;background:#020617;z-index:295000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:18px;user-select:none;";
            const isVid = dec.mediaType === "video";
            overlay.innerHTML = `
                <div style="background:rgba(14,165,233,0.16);border:1px solid #38bdf8;color:#38bdf8;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:800;margin-bottom:12px;">
                    <span id="nx-dm-vo-timer">1️⃣ Protected View Once • Auto-Burns in ${isVid ? 25 : 10}s</span>
                </div>
                <div style="position:relative;max-width:100%;max-height:72dvh;border-radius:16px;overflow:hidden;border:1.5px solid #38bdf8;">
                    ${isVid
                        ? `<video src="${esc(url)}" autoplay playsinline controls controlsList="nodownload noplaybackrate" style="max-width:100%;max-height:70dvh;display:block;background:#000;"></video>`
                        : `<canvas id="nx-dm-vo-cvs" style="max-width:100%;max-height:70dvh;display:block;pointer-events:none;"></canvas>`}
                </div>
                <button type="button" id="nx-dm-vo-burn" style="margin-top:16px;padding:11px 26px;border-radius:999px;background:#e11d48;color:#fff;font-weight:900;font-size:13px;border:none;cursor:pointer;">Close &amp; Burn Forever 🔥</button>
            `;
            document.body.appendChild(overlay);

            if (!isVid) {
                const cvs = overlay.querySelector("#nx-dm-vo-cvs");
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => { cvs.width = img.width; cvs.height = img.height; cvs.getContext("2d").drawImage(img, 0, 0); };
                img.src = url;
            }

            let burned = false;
            let secs = isVid ? 25 : 10;
            const burnNow = async (msg) => {
                if (burned) return;
                burned = true;
                clearInterval(tm);
                document.removeEventListener("visibilitychange", onHide);
                overlay.remove();
                row.view_once_opened = true;
                dec.viewOnceOpened = true;
                dec.mediaPath = "";
                await renderMessages();
                await sec.burnViewOnceMessage(msgId, path).catch(() => {});
                if (msg) Nexus.toast(msg);
            };
            const onHide = () => { if (document.hidden) burnNow("🔒 View-Once Burned!"); };
            document.addEventListener("visibilitychange", onHide);
            const lbl = overlay.querySelector("#nx-dm-vo-timer");
            const tm = setInterval(() => {
                secs--;
                if (lbl) lbl.textContent = `1️⃣ Protected View Once • Auto-Burns in ${secs}s`;
                if (secs <= 0) burnNow("🔥 View-Once Auto-Burned!");
            }, 1000);
            overlay.querySelector("#nx-dm-vo-burn").onclick = () => burnNow("🔥 View-Once Burned Forever!");
        },

        toggleToolsDock: function () {
            const dock = document.getElementById("nx-dm-v2-tools-dock");
            const stk = document.getElementById("nx-dm-sticker-drawer");
            if (stk) stk.style.display = "none";
            if (!dock) return;
            dock.style.display = dock.style.display === "grid" ? "none" : "grid";
            setTimeout(syncViewport, 40);
        },

        toggleStickerDrawer: function () {
            const d = document.getElementById("nx-dm-sticker-drawer");
            const dock = document.getElementById("nx-dm-v2-tools-dock");
            if (dock) dock.style.display = "none";
            if (!d) return;
            d.style.display = d.style.display === "none" ? "block" : "none";
            if (d.style.display === "block") this.renderStickerGrid(currentStickerCat);
            setTimeout(syncViewport, 40);
        },

        filterStickersByCat: function (cat, el) {
            currentStickerCat = cat;
            document.querySelectorAll(".nx-stk-chip").forEach((c) => c.classList.remove("active"));
            if (el) el.classList.add("active");
            this.renderStickerGrid(cat);
        },

        renderStickerGrid: function (cat) {
            const grid = document.getElementById("nx-cloud-stk-grid");
            if (!grid) return;
            const list = STICKER_BANK.filter((s) => cat === "all" || s.g === cat);
            grid.innerHTML = list.map((s) => {
                const u = `[https://fonts.gstatic.com/s/e/notoemoji/latest/$](https://fonts.gstatic.com/s/e/notoemoji/latest/$){s.c}/512.webp`;
                return `<div onclick="NexusDM.sendAnimatedSticker('${u}','${s.l}')" style="background:#182229;border:1px solid #233138;border-radius:10px;padding:6px;display:flex;flex-direction:column;align-items:center;cursor:pointer;"><img src="${u}" loading="lazy" style="width:44px;height:44px;"><span style="font-size:9px;color:#8696a0;">${s.l}</span></div>`;
            }).join("");
        },

        sendAnimatedSticker: function (url, label) {
            const d = document.getElementById("nx-dm-sticker-drawer");
            if (d) d.style.display = "none";
            this.sendDM("", { url, label: label || "Sticker" });
        },

        toggleVoiceRecording: async function () {
            const btn = document.getElementById("nx-dm-v2-mic-btn");
            const inp = document.getElementById("nx-dm-input");
            if (!isRecordingVoice) {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    voiceRecorder = new MediaRecorder(stream);
                    voiceChunks = [];
                    voiceRecStart = Date.now();
                    voiceRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) voiceChunks.push(e.data); };
                    voiceRecorder.onstop = () => {
                        stream.getTracks().forEach((t) => t.stop());
                        clearInterval(voiceRecTimer);
                        if (btn) btn.textContent = "🎙️";
                        if (inp) inp.placeholder = "Message...";
                        if (voiceChunks.length) {
                            const blob = new Blob(voiceChunks, { type: "audio/webm" });
                            sendMediaFiles([new File([blob], "voicenote.webm", { type: "audio/webm" })], "audio", false);
                        }
                    };
                    voiceRecorder.start();
                    isRecordingVoice = true;
                    if (btn) btn.textContent = "⏹️";
                    voiceRecTimer = setInterval(() => {
                        const s = Math.floor((Date.now() - voiceRecStart) / 1000);
                        if (inp) inp.placeholder = `🔴 Recording (${s}s)... Tap ⏹️ to Send`;
                        if (s >= 60) NexusDM.toggleVoiceRecording();
                    }, 500);
                    Nexus.toast("🎤 Recording HD Voice... Tap ⏹️ to Send");
                } catch (e) { alert("Microphone permission Allow karein!"); }
            } else {
                isRecordingVoice = false;
                if (voiceRecorder && voiceRecorder.state !== "inactive") voiceRecorder.stop();
            }
        },

        cycleAudioSpeed: function (btn) {
            const aud = btn && btn.parentElement && btn.parentElement.querySelector("audio");
            if (!aud) return;
            const rates = [1, 1.5, 2];
            const next = rates[(rates.indexOf(aud.playbackRate) + 1) % rates.length];
            aud.playbackRate = next;
            btn.textContent = next + "x";
        },

        openPhotoPreview: openImageLightbox,

        closeDM: function () {
            document.documentElement.style.overflow = "";
            document.body.style.overflow = "";
            activeDmPartner = null;
            activeConvId = null;
            activePeerProfile = null;
            this.activePartner = null;
            if (unsubMessages) { unsubMessages(); unsubMessages = null; }
            const sec = getSec();
            if (typingChannel && sec) { try { sec.sb.removeChannel(typingChannel); } catch (e) {} typingChannel = null; }
            const root = document.getElementById("nx-dm-dedicated-root");
            if (root) root.style.display = "none";
            window.scrollTo(0, savedScrollY);
        },

        closeDirectChat: function () { this.closeDM(); }
    };
})();
