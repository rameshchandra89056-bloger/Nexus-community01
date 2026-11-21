/* ============================================================================
   NEXUS OFFICIAL NOTIFY.JS (v4.0 FINAL MASTER — 100% SUPABASE REALTIME)
   1. Real-Time Notifications: 1:1 DMs, Likes, Comments, @Mentions, Follows & Missed Calls
   2. Live Instagram-Style Slide-Down Top Banner + WebAudio Chime + OS Push Alerts
   3. Category Filters, DND Mode, Mark All Read, Red Badge (#nx-notif-dot) & Tab Title Counter
   4. Full Global Search: Online Now Filter, Members (DP + Bio + 1-Tap DM/Call),
      Matching Posts (with Thumbnails), Live #Tags & Recent Search History
   ============================================================================ */
(function () {
    if (window.__NEXUS_NOTIFY_SEARCH_V4__) return;
    window.__NEXUS_NOTIFY_SEARCH_V4__ = true;

    const normU = (u) => String(u || "").toLowerCase().replace(/^@/, "").trim();
    const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const getSb = () => (window.NexusSecurity && window.NexusSecurity.sb) || null;
    const BASE_TITLE = document.title || "Nexus Community";

    let unreadDmRows = [];
    let realtimeSub = null;
    let subscribedUserId = null;
    let bannerTimer = null;
    let chimeCtx = null;
    let knownFollowerSet = null;
    const seenToastEventIds = new Set();

    function getActiveMe() {
        try {
            if (window.Nexus && typeof Nexus.getCurrentUser === "function") {
                const u = Nexus.getCurrentUser();
                if (u && u.username) return u;
            }
            const raw = localStorage.getItem("nx_active_account");
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    }

    function isDndEnabled() {
        return localStorage.getItem("nx_notif_dnd_v4") === "1";
    }

    function toggleDndMode() {
        const next = !isDndEnabled();
        localStorage.setItem("nx_notif_dnd_v4", next ? "1" : "0");
        if (window.Nexus && Nexus.toast) Nexus.toast(next ? "🔕 DND On — Notification sounds muted" : "🔔 DND Off — Live alerts active");
        return next;
    }

    function formatAgo(ts) {
        const num = Number(ts || 0);
        if (!num || num < 1000000000000) return "Recent";
        const sec = Math.max(1, Math.floor((Date.now() - num) / 1000));
        if (sec < 60) return "Just now";
        if (sec < 3600) return Math.floor(sec / 60) + "m ago";
        if (sec < 86400) return Math.floor(sec / 3600) + "h ago";
        return Math.floor(sec / 86400) + "d ago";
    }

    function isUserOnlineNow(u) {
        if (!u) return false;
        const me = getActiveMe();
        if (me && normU(me.username) === normU(u.username)) return true;
        const ts = Number(u.lastSeenAt || u.lastOnline || 0);
        return Boolean(ts && (Date.now() - ts) < 120000);
    }

    function findUserByIdOrUname(id, uname) {
        const pool = [...((window.Nexus && Nexus.users) || []), ...((window.Nexus && Nexus.cloudAccounts) || [])];
        if (id) {
            const byId = pool.find((u) => u && String(u.id) === String(id));
            if (byId) return byId;
        }
        if (uname) {
            const clean = normU(uname);
            const byU = pool.find((u) => u && normU(u.username) === clean);
            if (byU) return byU;
        }
        return null;
    }

    // -------------------- STYLES --------------------
    if (!document.getElementById("nx-notify-v4-css")) {
        const st = document.createElement("style");
        st.id = "nx-notify-v4-css";
        st.textContent = `
            #nx-live-alert-banner{position:fixed;top:10px;left:50%;transform:translate(-50%,-130%);width:calc(100% - 22px);max-width:440px;background:linear-gradient(135deg,#0f172a,#064e3b);border:1.5px solid #10b981;border-radius:18px;padding:11px 13px;color:#fff;z-index:322000;display:flex;align-items:center;gap:11px;box-shadow:0 16px 40px rgba(0,0,0,.85);transition:transform .28s cubic-bezier(.22,1,.36,1);cursor:pointer;backdrop-filter:blur(8px)}
            #nx-live-alert-banner.show{transform:translate(-50%,0)}
            .nx-nf-chip{padding:6px 12px;border-radius:999px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;font-size:11.5px;font-weight:800;white-space:nowrap;cursor:pointer;flex-shrink:0}
            .nx-nf-chip.active{background:#10b981;color:#020617;border-color:#34d399}
            .nx-unread-dot-row{width:8px;height:8px;border-radius:50%;background:#10b981;flex-shrink:0;box-shadow:0 0 8px #10b981}
        `;
        document.head.appendChild(st);
    }

    // -------------------- SOUND, OS PUSH & TOP SLIDE BANNER --------------------
    function playNotifSound() {
        if (isDndEnabled()) return;
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            if (!chimeCtx) chimeCtx = new Ctx();
            if (chimeCtx.state === "suspended") chimeCtx.resume().catch(() => {});
            const o = chimeCtx.createOscillator(), g = chimeCtx.createGain();
            o.type = "sine";
            o.frequency.setValueAtTime(784, chimeCtx.currentTime);
            o.frequency.exponentialRampToValueAtTime(1175, chimeCtx.currentTime + 0.14);
            g.gain.setValueAtTime(0.11, chimeCtx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, chimeCtx.currentTime + 0.22);
            o.connect(g); g.connect(chimeCtx.destination);
            o.start(); o.stop(chimeCtx.currentTime + 0.23);
        } catch (e) {}
    }

    async function requestOsPushPermission() {
        if (!("Notification" in window)) {
            if (window.Nexus && Nexus.toast) Nexus.toast("⚠️ Is browser mein OS push notifications supported nahi hain.");
            return false;
        }
        if (Notification.permission === "granted") {
            if (window.Nexus && Nexus.toast) Nexus.toast("✅ OS Push Alerts pehle se ON hain!");
            return true;
        }
        const res = await Notification.requestPermission().catch(() => "denied");
        if (res === "granted") {
            if (window.Nexus && Nexus.toast) Nexus.toast("🔔 OS Push Alerts Enabled!");
            return true;
        }
        if (window.Nexus && Nexus.toast) Nexus.toast("❌ Browser notification permission denied.");
        return false;
    }

    function sendOsNotification(title, body, onClickFn) {
        if (isDndEnabled() || !("Notification" in window) || Notification.permission !== "granted") return;
        if (document.visibilityState === "visible") return;
        try {
            const n = new Notification(title, { body, tag: "nexus_live_alert" });
            n.onclick = () => { window.focus(); if (typeof onClickFn === "function") onClickFn(); n.close(); };
        } catch (e) {}
    }

    function showLiveTopBanner({ title, body, avatarUrl, initial, badge, onClick }) {
        if (isDndEnabled()) return;
        playNotifSound();
        let el = document.getElementById("nx-live-alert-banner");
        if (!el) {
            el = document.createElement("div");
            el.id = "nx-live-alert-banner";
            document.body.appendChild(el);
        }
        const av = avatarUrl
            ? `<img src="${esc(avatarUrl)}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid #34d399;flex-shrink:0;">`
            : `<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#10b981,#38bdf8);color:#020617;font-weight:900;font-size:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${esc((initial || "N")[0].toUpperCase())}</div>`;

        el.innerHTML = `${av}<div style="flex:1;min-width:0;"><div style="display:flex;align-items:center;gap:6px;"><span style="font-size:13px;font-weight:900;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(title)}</span>${badge ? `<span style="background:#10b981;color:#020617;font-size:9.5px;font-weight:900;padding:1px 6px;border-radius:99px;">${esc(badge)}</span>` : ""}</div><div style="font-size:12px;color:#d1fae5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;">${esc(body)}</div></div><span style="color:#5eead4;font-size:11px;font-weight:900;flex-shrink:0;">Open →</span>`;
        el.onclick = () => {
            el.classList.remove("show");
            if (typeof onClick === "function") onClick();
        };
        requestAnimationFrame(() => el.classList.add("show"));
        clearTimeout(bannerTimer);
        bannerTimer = setTimeout(() => { el.classList.remove("show"); }, 4600);
    }

    // -------------------- REAL NOTIFICATION AGGREGATOR (100% SUPABASE + CALL LOGS) --------------------
    function getDismissedSet(myU) {
        try { return new Set(JSON.parse(localStorage.getItem("nx_notif_dismissed_" + myU) || "[]")); }
        catch (e) { return new Set(); }
    }

    function dismissNotifId(myU, id) {
        const set = getDismissedSet(myU);
        set.add(String(id));
        try { localStorage.setItem("nx_notif_dismissed_" + myU, JSON.stringify(Array.from(set).slice(-300))); } catch (e) {}
    }

    function gatherAllRealNotifications() {
        const me = getActiveMe();
        if (!me || !me.username) return { items: [], unreadCount: 0 };
        const myU = normU(me.username);
        const myName = normU(me.name || myU);
        const lastSeenAt = Number(localStorage.getItem("nx_notif_seen_v4_" + myU) || 0);
        const dismissed = getDismissedSet(myU);
        const items = [];

        // 1. Live Unread 1:1 Encrypted DMs from Supabase
        unreadDmRows.forEach((m) => {
            if (!m || m.is_deleted_everyone || m.seen) return;
            const id = "dm_" + m.id;
            if (dismissed.has(id)) return;
            const sender = findUserByIdOrUname(m.sender_id, null);
            const sU = (sender && sender.username) || "friend";
            const sName = (sender && sender.name) || ("@" + sU);
            const preview = m.is_view_once
                ? "1️⃣ Sent a View-Once Media"
                : m.msg_type === "video"
                ? "🎬 Sent you a Video"
                : m.msg_type === "image"
                ? "📸 Sent you a Photo"
                : m.msg_type === "audio"
                ? "🎤 Sent you a Voice Note"
                : m.msg_type === "file"
                ? "📄 Sent you a File / PDF"
                : "🔐 Sent you an Encrypted Message";

            items.push({
                id,
                category: "dm",
                type: "dm",
                actorUname: sU,
                actorName: sName,
                actorDp: (sender && sender.dp) || "",
                text: preview,
                ts: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
                isUnread: true
            });
        });

        // 2. Real Missed / Declined Calls from call.js Call History
        try {
            const callLogs = JSON.parse(localStorage.getItem("nx_call_history_v1_" + myU) || "[]");
            callLogs.forEach((c, idx) => {
                if (!c || (c.status !== "missed" && c.status !== "no_answer" && c.status !== "declined")) return;
                const id = `call_${c.at || idx}`;
                if (dismissed.has(id)) return;
                const ts = Number(c.at || Date.now());
                const peerObj = findUserByIdOrUname(null, c.peerUname);
                items.push({
                    id,
                    category: "call",
                    type: "call",
                    callMode: c.mode || "audio",
                    actorUname: normU(c.peerUname),
                    actorName: c.peerName || (peerObj && peerObj.name) || ("@" + c.peerUname),
                    actorDp: c.peerDp || (peerObj && peerObj.dp) || "",
                    text: `${c.mode === "video" ? "📹 Missed Video Call" : "📞 Missed Voice Call"} (${c.status})`,
                    ts,
                    isUnread: ts > lastSeenAt && c.direction === "incoming"
                });
            });
        } catch (e) {}

        // 3. Real Likes, Comments & @Mentions from Supabase Posts
        const allPosts = (window.Nexus && Array.isArray(Nexus.posts)) ? Nexus.posts : [];
        allPosts.forEach((p) => {
            if (!p) return;
            const pOwner = normU(p.username || p.author_username || p.author);
            const isMyPost = (pOwner === myU || pOwner === myName || (me.id && p.author_id && String(p.author_id) === String(me.id)));
            const snip = String(p.content || p.text || "media post").slice(0, 38);

            // Check if someone @mentioned me in any post caption
            if (!isMyPost && String(p.content || "").toLowerCase().includes("@" + myU)) {
                const id = `ment_post_${p.id}`;
                if (!dismissed.has(id)) {
                    const uObj = findUserByIdOrUname(p.author_id, pOwner);
                    const ts = Number(p.createdAt || (p.created_at ? new Date(p.created_at).getTime() : Date.now()));
                    items.push({
                        id, category: "activity", type: "mention", postObj: p,
                        actorUname: pOwner, actorName: (uObj && uObj.name) || p.author || ("@" + pOwner),
                        actorDp: (uObj && uObj.dp) || p.dp || "",
                        text: `🏷️ Mentioned you in a post: "${snip}"`,
                        ts, isUnread: ts > lastSeenAt
                    });
                }
            }

            if (isMyPost) {
                // Likes on my post
                const likes = Array.isArray(p.likedBy) ? p.likedBy : (Array.isArray(p.likes_list) ? p.likes_list : []);
                likes.forEach((lRaw) => {
                    const liker = normU(lRaw);
                    if (!liker || liker === myU) return;
                    const id = `lk_${p.id}_${liker}`;
                    if (dismissed.has(id)) return;
                    const uObj = findUserByIdOrUname(null, liker);
                    const ts = Number(p.createdAt || (p.created_at ? new Date(p.created_at).getTime() : Date.now()));
                    items.push({
                        id, category: "activity", type: "like", postObj: p,
                        actorUname: liker, actorName: (uObj && uObj.name) || ("@" + liker),
                        actorDp: (uObj && uObj.dp) || "",
                        text: `❤️ Liked your post: "${snip}"`,
                        ts, isUnread: ts > lastSeenAt
                    });
                });
            }

            // Comments on my post OR comments mentioning @me
            const comms = Array.isArray(p.comments) ? p.comments : (Array.isArray(p.comments_list) ? p.comments_list : []);
            comms.forEach((c, idx) => {
                if (!c) return;
                const cU = normU(c.username || c.author);
                if (!cU || cU === myU) return;
                const cText = String(c.text || c.content || "");
                const mentionedMe = cText.toLowerCase().includes("@" + myU);
                if (!isMyPost && !mentionedMe) return;

                const id = `cm_${p.id}_${idx}_${cU}`;
                if (dismissed.has(id)) return;
                const uObj = findUserByIdOrUname(null, cU);
                const cTs = Number(c.createdAt || c.at || p.createdAt || Date.now());
                items.push({
                    id, category: "activity", type: mentionedMe && !isMyPost ? "mention" : "comment", postObj: p,
                    actorUname: cU, actorName: c.author || (uObj && uObj.name) || ("@" + cU),
                    actorDp: c.dp || (uObj && uObj.dp) || "",
                    text: mentionedMe && !isMyPost ? `🏷️ Mentioned you: "${cText.slice(0, 52)}"` : `💬 Commented: "${cText.slice(0, 52)}"`,
                    ts: cTs, isUnread: cTs > lastSeenAt
                });
            });
        });

        // 4. Real Followers
        const myEntry = findUserByIdOrUname(me.id, myU) || me;
        const followers = Array.isArray(myEntry.followersList) ? myEntry.followersList : [];
        followers.forEach((fRaw) => {
            const fU = normU(fRaw);
            if (!fU || fU === myU) return;
            const id = "fol_" + fU;
            if (dismissed.has(id)) return;
            const fObj = findUserByIdOrUname(null, fU);
            const fTs = Number((fObj && (fObj.lastOnline || fObj.createdAt)) || (Date.now() - 3600000));
            items.push({
                id, category: "follow", type: "follow",
                actorUname: fU, actorName: (fObj && fObj.name) || ("@" + fU),
                actorDp: (fObj && fObj.dp) || "",
                text: "👥 Started following you on Nexus",
                ts: fTs, isUnread: fTs > lastSeenAt
            });
        });

        items.sort((a, b) => b.ts - a.ts);
        return { items, unreadCount: items.filter((x) => x.isUnread).length };
    }

    function updateHeaderNotifBadge() {
        const { unreadCount } = gatherAllRealNotifications();
        const dot = document.getElementById("nx-notif-dot");
        if (dot) {
            if (unreadCount > 0) {
                dot.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
                dot.style.display = "inline-block";
            } else {
                dot.style.display = "none";
            }
        }
        document.title = unreadCount > 0 ? `(${unreadCount}) ${BASE_TITLE}` : BASE_TITLE;
    }

    // -------------------- SUPABASE REALTIME WATCHER --------------------
    async function refreshUnreadDmsFromSupabase() {
        const me = getActiveMe(), sb = getSb();
        if (!me || !me.id || !sb) return;
        try {
            const { data } = await sb
                .from("messages")
                .select("id,sender_id,msg_type,is_view_once,created_at,seen,is_deleted_everyone")
                .eq("receiver_id", me.id)
                .eq("seen", false)
                .eq("is_deleted_everyone", false)
                .order("created_at", { ascending: false })
                .limit(50);
            if (Array.isArray(data)) {
                unreadDmRows = data;
                updateHeaderNotifBadge();
            }
        } catch (e) {}
    }

    function isChatCurrentlyOpenWith(peerUname) {
        const root = document.getElementById("nx-dm-dedicated-root");
        if (!root || root.style.display === "none") return false;
        const activeP = normU((window.NexusDM && NexusDM.activePartner) || window.activeDMUser || "");
        return Boolean(activeP && activeP === normU(peerUname));
    }

    function ensureSupabaseNotifSubscription() {
        const me = getActiveMe(), sb = getSb();
        if (!me || !me.id || !sb) return;
        if (realtimeSub && subscribedUserId === me.id) return;

        if (realtimeSub) {
            try { sb.removeChannel(realtimeSub); } catch (e) {}
            realtimeSub = null;
        }
        subscribedUserId = me.id;
        knownFollowerSet = new Set((me.followersList || []).map(normU));
        refreshUnreadDmsFromSupabase();

        realtimeSub = sb.channel("nx_notify_v4_" + me.id)
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${me.id}` }, async (payload) => {
                const row = payload && payload.new;
                if (!row || !row.id || seenToastEventIds.has("dm_" + row.id)) return;
                seenToastEventIds.add("dm_" + row.id);
                await refreshUnreadDmsFromSupabase();

                let sender = findUserByIdOrUname(row.sender_id, null);
                if (!sender) {
                    const { data } = await sb.from("profiles").select("id,username,display_name,avatar_url").eq("id", row.sender_id).maybeSingle();
                    if (data) sender = { id: data.id, username: data.username, name: data.display_name || data.username, dp: data.avatar_url || "" };
                }
                const sU = (sender && sender.username) || "friend";
                const sName = (sender && sender.name) || ("@" + sU);
                if (isChatCurrentlyOpenWith(sU)) return;

                const preview = row.is_view_once ? "1️⃣ Sent a View-Once Media" : row.msg_type === "video" ? "🎬 Sent a Video" : row.msg_type === "image" ? "📸 Sent a Photo" : row.msg_type === "audio" ? "🎤 Sent a Voice Note" : "🔐 New Encrypted Message";
                const openChat = () => {
                    if (window.NexusDM && NexusDM.openDirectChat) NexusDM.openDirectChat(sU, sName, (sender && sender.dp) || "");
                    else if (window.openDirect1to1ChatWithUser) window.openDirect1to1ChatWithUser(sU);
                };
                showLiveTopBanner({ title: sName, body: preview, avatarUrl: sender && sender.dp, initial: sName, badge: "DM", onClick: openChat });
                sendOsNotification(`💬 ${sName}`, preview, openChat);
            })
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `receiver_id=eq.${me.id}` }, () => {
                refreshUnreadDmsFromSupabase();
            })
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "posts" }, (payload) => {
                const p = payload && payload.new;
                if (!p) return;
                if (window.__nxSyncSupabaseAll) window.__nxSyncSupabaseAll(false);
                setTimeout(updateHeaderNotifBadge, 400);
                if (normU(p.author_username) === normU(me.username) || String(p.author_id) === String(me.id)) {
                    const evKey = `post_up_${p.id}_${(p.likes_list || []).length}_${(p.comments_list || []).length}`;
                    if (!seenToastEventIds.has(evKey)) {
                        seenToastEventIds.add(evKey);
                        const likes = Array.isArray(p.likes_list) ? p.likes_list : [];
                        const comms = Array.isArray(p.comments_list) ? p.comments_list : [];
                        const lastC = comms[comms.length - 1];
                        if (lastC && normU(lastC.username) !== normU(me.username) && Date.now() - Number(lastC.createdAt || lastC.at || 0) < 12000) {
                            showLiveTopBanner({ title: "@" + lastC.username, body: `💬 Commented: "${String(lastC.text || "").slice(0, 48)}"`, initial: lastC.username, badge: "Comment", onClick: () => window.openNexusRealNotificationsModal() });
                        } else if (likes.length && normU(likes[likes.length - 1]) !== normU(me.username)) {
                            const lastL = likes[likes.length - 1];
                            showLiveTopBanner({ title: "@" + lastL, body: "❤️ Liked your post on Nexus", initial: lastL, badge: "Like", onClick: () => window.openNexusRealNotificationsModal() });
                        }
                    }
                }
            })
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${me.id}` }, (payload) => {
                const row = payload && payload.new;
                if (!row || !Array.isArray(row.followers_list)) return;
                row.followers_list.map(normU).forEach((fU) => {
                    if (fU && knownFollowerSet && !knownFollowerSet.has(fU)) {
                        knownFollowerSet.add(fU);
                        const fObj = findUserByIdOrUname(null, fU);
                        showLiveTopBanner({
                            title: (fObj && fObj.name) || ("@" + fU),
                            body: "👥 Started following you on Nexus!",
                            avatarUrl: fObj && fObj.dp,
                            initial: fU,
                            badge: "Follow",
                            onClick: () => window.openPublicUserProfileModal && window.openPublicUserProfileModal(fU)
                        });
                    }
                });
                updateHeaderNotifBadge();
            })
            .subscribe();
    }

    // -------------------- 1. FULL REAL NOTIFICATION CENTER MODAL --------------------
    window.openNexusRealNotificationsModal = function () {
        document.getElementById("nx-real-notif-drawer")?.remove();
        if (window.__nxPushBackLayer) {
            window.__nxPushBackLayer("nx-real-notif-drawer", () => document.getElementById("nx-real-notif-drawer")?.remove());
        }

        const me = getActiveMe();
        const myU = me && me.username ? normU(me.username) : "";
        let activeFilter = "all"; // all | dm | activity | follow | call

        const modal = document.createElement("div");
        modal.id = "nx-real-notif-drawer";
        modal.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,.92);z-index:266000;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(6px);";

        const renderDrawer = () => {
            const { items } = gatherAllRealNotifications();
            const filtered = activeFilter === "all" ? items : items.filter((x) => x.category === activeFilter);
            const dnd = isDndEnabled();
            const pushOn = ("Notification" in window) && Notification.permission === "granted";

            const rowsHtml = filtered.length ? filtered.map((it, idx) => {
                const av = it.actorDp
                    ? `<img src="${esc(it.actorDp)}" loading="lazy" style="width:42px;height:42px;border-radius:50%;object-fit:cover;border:1.5px solid ${it.type === "dm" ? "#10b981" : it.type === "call" ? "#f43f5e" : "#38bdf8"};flex-shrink:0;">`
                    : `<div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,${it.type === "call" ? "#e11d48,#f97316" : "#10b981,#2563eb"});color:#020617;font-weight:900;font-size:15px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${esc((it.actorName || "U").replace(/^@/, "")[0].toUpperCase())}</div>`;

                const actionBtn = it.type === "dm"
                    ? `<span style="background:#10b981;color:#020617;padding:5px 10px;border-radius:9px;font-size:11px;font-weight:900;flex-shrink:0;">Reply 💬</span>`
                    : it.type === "call"
                    ? `<span style="background:#e11d48;color:#fff;padding:5px 10px;border-radius:9px;font-size:11px;font-weight:900;flex-shrink:0;">Call 📞</span>`
                    : `<span style="background:#1e293b;color:#38bdf8;border:1px solid #334155;padding:5px 9px;border-radius:9px;font-size:10.5px;font-weight:800;flex-shrink:0;">View →</span>`;

                return `<div data-nidx="${idx}" style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 12px;border-radius:15px;background:${it.isUnread ? "rgba(16,185,129,.12)" : "#090d16"};border:1px solid ${it.isUnread ? "#10b981" : "#1e293b"};margin-bottom:8px;cursor:pointer;">
                    <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;">
                        ${av}
                        <div style="min-width:0;flex:1;">
                            <div style="display:flex;align-items:center;gap:6px;">
                                ${it.isUnread ? '<span class="nx-unread-dot-row"></span>' : ""}
                                <span style="font-size:13px;font-weight:900;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(it.actorName)}</span>
                                <span style="font-size:10px;color:#64748b;flex-shrink:0;">• ${esc(formatAgo(it.ts))}</span>
                            </div>
                            <div style="font-size:12px;color:#cbd5e1;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(it.text)}</div>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                        ${actionBtn}
                        <button type="button" data-ndis="${esc(it.id)}" title="Dismiss" style="background:none;border:none;color:#64748b;font-size:13px;cursor:pointer;padding:2px 4px;">✕</button>
                    </div>
                </div>`;
            }).join("") : `<div style="text-align:center;padding:38px 16px;color:#64748b;"><div style="font-size:34px;margin-bottom:8px;">🔔</div><div style="font-size:14px;font-weight:800;color:#cbd5e1;">No notifications here</div><div style="font-size:11.5px;margin-top:4px;">Live DMs, Likes, Comments, Follows aur Missed Calls yahan turant dikhenge!</div></div>`;

            modal.innerHTML = `<div style="background:#0f172a;border-top:2px solid #10b981;border-radius:24px 24px 0 0;width:100%;max-width:600px;max-height:88dvh;display:flex;flex-direction:column;padding:16px 14px 24px;color:#fff;box-shadow:0 -18px 50px rgba(0,0,0,.95);">
                <div style="width:42px;height:4px;background:#334155;border-radius:99px;margin:0 auto 10px;"></div>
                <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:10px;border-bottom:1px solid #1e293b;margin-bottom:10px;">
                    <div>
                        <h3 style="font-size:16px;font-weight:900;">🔔 Activity &amp; Alerts (${items.length})</h3>
                        <div style="font-size:11px;color:#34d399;font-weight:700;">100% Live Supabase Feed</div>
                    </div>
                    <div style="display:flex;gap:6px;align-items:center;">
                        <button type="button" id="nx-nf-dnd" style="padding:6px 9px;border-radius:10px;background:${dnd ? "rgba(244,63,94,.2)" : "#1e293b"};border:1px solid ${dnd ? "#f43f5e" : "#334155"};color:${dnd ? "#fda4af" : "#cbd5e1"};font-size:11px;font-weight:800;cursor:pointer;">${dnd ? "🔕 DND" : "🔊 Sound"}</button>
                        <button type="button" id="nx-nf-push" style="padding:6px 9px;border-radius:10px;background:${pushOn ? "rgba(16,185,129,.2)" : "#1e293b"};border:1px solid ${pushOn ? "#10b981" : "#334155"};color:${pushOn ? "#34d399" : "#38bdf8"};font-size:11px;font-weight:800;cursor:pointer;">${pushOn ? "📲 Push ON" : "📲 Push"}</button>
                        <button type="button" id="nx-nf-readall" title="Mark All Read" style="padding:6px 9px;border-radius:10px;background:#1e293b;border:1px solid #334155;color:#34d399;font-size:11px;font-weight:900;cursor:pointer;">✓✓</button>
                        <button type="button" id="nx-nf-close" style="width:30px;height:30px;border-radius:50%;background:#1e293b;border:none;color:#fff;font-weight:900;cursor:pointer;">✕</button>
                    </div>
                </div>
                <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:10px;">
                    ${[["all", "All"], ["dm", "💬 DMs"], ["activity", "❤️ Likes/Comms"], ["follow", "👥 Follows"], ["call", "📞 Calls"]].map(([k, l]) => `<button type="button" data-nfil="${k}" class="nx-nf-chip ${activeFilter === k ? "active" : ""}">${l}</button>`).join("")}
                </div>
                <div style="flex:1;overflow-y:auto;max-height:62dvh;padding-right:2px;">${rowsHtml}</div>
            </div>`;

            modal.querySelector("#nx-nf-close").onclick = () => modal.remove();
            modal.querySelector("#nx-nf-dnd").onclick = () => { toggleDndMode(); renderDrawer(); };
            modal.querySelector("#nx-nf-push").onclick = async () => { await requestOsPushPermission(); renderDrawer(); };
            modal.querySelector("#nx-nf-readall").onclick = () => {
                if (myU) localStorage.setItem("nx_notif_seen_v4_" + myU, String(Date.now()));
                updateHeaderNotifBadge();
                if (window.Nexus && Nexus.toast) Nexus.toast("✓✓ All notifications marked as read");
                renderDrawer();
            };
            modal.querySelectorAll("[data-nfil]").forEach((b) => {
                b.onclick = () => { activeFilter = b.getAttribute("data-nfil"); renderDrawer(); };
            });
            modal.querySelectorAll("[data-ndis]").forEach((b) => {
                b.onclick = (e) => {
                    e.stopPropagation();
                    if (myU) dismissNotifId(myU, b.getAttribute("data-ndis"));
                    updateHeaderNotifBadge();
                    renderDrawer();
                };
            });
            modal.querySelectorAll("[data-nidx]").forEach((row) => {
                row.onclick = () => {
                    const it = filtered[Number(row.getAttribute("data-nidx"))];
                    if (!it) return;
                    modal.remove();
                    if (it.type === "dm") {
                        if (window.NexusDM && NexusDM.openDirectChat) NexusDM.openDirectChat(it.actorUname, it.actorName, it.actorDp);
                        else if (window.openDirect1to1ChatWithUser) window.openDirect1to1ChatWithUser(it.actorUname);
                    } else if (it.type === "call") {
                        if (window.startNexusRealCall) window.startNexusRealCall(it.callMode || "audio", it.actorUname);
                        else if (window.NexusCalls) NexusCalls.openCallHistory();
                    } else if (it.postObj && window.openScrollableProfilePostsFeed) {
                        window.openScrollableProfilePostsFeed([it.postObj], 0, { username: it.postObj.username });
                    } else if (window.openPublicUserProfileModal) {
                        window.openPublicUserProfileModal(it.actorUname);
                    }
                };
            });
        };

        if (myU) {
            localStorage.setItem("nx_notif_seen_v4_" + myU, String(Date.now()));
            updateHeaderNotifBadge();
        }
        renderDrawer();
        document.body.appendChild(modal);
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    };

    // -------------------- 2. FULL GLOBAL SEARCH ENGINE (MEMBERS + POSTS + #TAGS + RECENT) --------------------
    const RECENT_KEY = "nx_recent_searches_v4";
    function getRecentSearches() { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch (e) { return []; } }
    function saveRecentSearch(term) {
        const clean = String(term || "").trim();
        if (clean.length < 2) return;
        const arr = [clean, ...getRecentSearches().filter((x) => x.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
        try { localStorage.setItem(RECENT_KEY, JSON.stringify(arr)); } catch (e) {}
    }

    window.openNexusRealSearchModal = function () {
        document.getElementById("nx-real-search-drawer")?.remove();
        if (window.__nxPushBackLayer) {
            window.__nxPushBackLayer("nx-real-search-drawer", () => document.getElementById("nx-real-search-drawer")?.remove());
        }

        let scope = "all"; // all | online | members | posts | tags
        const modal = document.createElement("div");
        modal.id = "nx-real-search-drawer";
        modal.style.cssText = "position:fixed;inset:0;background:#090d16;z-index:266000;display:flex;flex-direction:column;color:#fff;max-width:600px;margin:0 auto;box-shadow:0 0 60px rgba(0,0,0,.95);";

        modal.innerHTML = `
            <div style="padding:12px 14px;background:#0b1120;border-bottom:1px solid #1e293b;display:flex;align-items:center;gap:9px;">
                <button type="button" id="nx-sr-back" style="background:none;border:none;color:#f8fafc;font-size:21px;font-weight:900;cursor:pointer;padding:4px;">←</button>
                <div style="flex:1;position:relative;display:flex;align-items:center;">
                    <input type="text" id="nx-sr-inp" placeholder="🔍 Search @username, name, posts or #tags..." autocomplete="off" style="width:100%;padding:10px 34px 10px 14px;border-radius:14px;background:#111827;border:1.5px solid #10b981;color:#fff;font-size:13.5px;outline:none;">
                    <button type="button" id="nx-sr-clr" style="display:none;position:absolute;right:8px;background:none;border:none;color:#94a3b8;font-weight:900;cursor:pointer;">✕</button>
                </div>
            </div>
            <div id="nx-sr-scopes" style="display:flex;gap:6px;overflow-x:auto;padding:9px 14px;background:#0b1120;border-bottom:1px solid #1e293b;">
                ${[["all", "All"], ["online", "🟢 Online Now"], ["members", "👥 Members"], ["posts", "📝 Posts"], ["tags", "# Tags"]].map(([k, l]) => `<button type="button" data-sc="${k}" class="nx-nf-chip ${k === "all" ? "active" : ""}">${l}</button>`).join("")}
            </div>
            <div id="nx-sr-results" style="flex:1;overflow-y:auto;padding:12px 14px 44px;"></div>
        `;

        document.body.appendChild(modal);
        const inp = modal.querySelector("#nx-sr-inp");
        const clrBtn = modal.querySelector("#nx-sr-clr");
        const resBox = modal.querySelector("#nx-sr-results");
        modal.querySelector("#nx-sr-back").onclick = () => modal.remove();

        // Fallback fetch if Nexus.users wasn't populated yet
        if ((!window.Nexus || !Array.isArray(Nexus.users) || !Nexus.users.length) && window.__nxSyncSupabaseAll) {
            window.__nxSyncSupabaseAll(false).then(() => renderResults(inp.value));
        }

        const renderResults = (rawQ) => {
            const raw = String(rawQ || "").trim();
            const q = raw.toLowerCase().replace(/^[@#]/, "").trim();
            clrBtn.style.display = raw ? "block" : "none";

            const allUsers = ((window.Nexus && Nexus.users) || []).filter((u) => u && u.username && normU(u.username) !== "member");
            const allPosts = ((window.Nexus && Nexus.posts) || []).filter((p) => p && (p.content || p.text || p.image));

            // Collect real #tags from user skillTags & post captions
            const tagCount = {};
            allUsers.forEach((u) => (u.skillTags || []).forEach((t) => { const k = String(t).toLowerCase().trim(); if (k) tagCount[k] = (tagCount[k] || 0) + 1; }));
            allPosts.forEach((p) => { (String(p.content || "").match(/#([a-zA-Z0-9_]+)/g) || []).forEach((m) => { const k = m.slice(1).toLowerCase(); tagCount[k] = (tagCount[k] || 0) + 1; }); });
            const matchedTags = Object.entries(tagCount).filter(([t]) => !q || t.includes(q)).sort((a, b) => b[1] - a[1]).slice(0, 14);

            const matchedUsers = allUsers.filter((u) => {
                if (scope === "online" && !isUserOnlineNow(u)) return false;
                if (!q) return true;
                const tagsStr = (u.skillTags || []).join(" ").toLowerCase();
                return normU(u.username).includes(q) || normU(u.name).includes(q) || String(u.bio || "").toLowerCase().includes(q) || tagsStr.includes(q);
            }).sort((a, b) => (isUserOnlineNow(b) ? 1 : 0) - (isUserOnlineNow(a) ? 1 : 0)).slice(0, 25);

            const matchedPosts = (q || scope === "posts") ? allPosts.filter((p) => {
                if (!q) return true;
                return String(p.content || p.text || "").toLowerCase().includes(q) || normU(p.username).includes(q) || normU(p.author).includes(q);
            }).slice(0, 15) : [];

            const recent = !raw ? getRecentSearches() : [];
            const recentHtml = recent.length ? `<div style="margin-bottom:14px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;"><span style="font-size:11px;font-weight:900;color:#94a3b8;text-transform:uppercase;">🕘 Recent Searches</span><button type="button" id="nx-sr-clrec" style="background:none;border:none;color:#fb7185;font-size:11px;font-weight:800;cursor:pointer;">Clear</button></div><div style="display:flex;gap:6px;flex-wrap:wrap;">${recent.map((r) => `<button type="button" data-rec="${esc(r)}" style="padding:5px 11px;border-radius:999px;background:#0f172a;border:1px solid #334155;color:#e2e8f0;font-size:11.5px;font-weight:700;cursor:pointer;">${esc(r)}</button>`).join("")}</div></div>` : "";

            const tagsHtml = (scope === "all" || scope === "tags") && matchedTags.length
                ? `<div style="margin-bottom:14px;"><div style="font-size:11px;font-weight:900;color:#fbbf24;text-transform:uppercase;margin-bottom:7px;"># Trending Tags &amp; Skills</div><div style="display:flex;gap:6px;flex-wrap:wrap;">${matchedTags.map(([t, c]) => `<button type="button" data-tagq="${esc(t)}" style="padding:5px 11px;border-radius:999px;background:rgba(56,189,248,.12);border:1px solid #38bdf8;color:#7dd3fc;font-size:11.5px;font-weight:800;cursor:pointer;">#${esc(t)} <span style="opacity:.7;">(${c})</span></button>`).join("")}</div></div>` : "";

            const usersSection = (scope === "all" || scope === "members" || scope === "online") ? (
                `<div style="font-size:11.5px;font-weight:900;color:#34d399;text-transform:uppercase;margin:2px 4px 10px;">👥 ${scope === "online" ? `Online Right Now (${matchedUsers.length})` : q ? `Matching Members (${matchedUsers.length})` : `Active Community Members (${matchedUsers.length})`}</div>` +
                (matchedUsers.length ? matchedUsers.map((u) => {
                    const uK = normU(u.username), live = isUserOnlineNow(u);
                    const av = u.dp
                        ? `<img src="${esc(u.dp)}" loading="lazy" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid ${live ? "#10b981" : "#334155"};flex-shrink:0;">`
                        : `<div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#10b981,#2563eb);color:#020617;font-weight:900;font-size:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${esc((u.name || uK)[0].toUpperCase())}</div>`;
                    return `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-radius:15px;background:#0f172a;border:1px solid #1e293b;margin-bottom:8px;">
                        <div data-sp="${esc(uK)}" style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;cursor:pointer;">
                            ${av}
                            <div style="min-width:0;flex:1;">
                                <div style="display:flex;align-items:center;gap:5px;"><span style="font-size:13.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(u.name || uK)}</span><span style="background:#10b981;color:#020617;font-size:9px;font-weight:900;padding:1px 5px;border-radius:99px;">✓</span>${live ? `<span style="font-size:10px;color:#34d399;font-weight:800;">● Live</span>` : ""}</div>
                                <div style="font-size:11.5px;color:#38bdf8;font-weight:700;">@${esc(uK)}</div>
                                ${u.bio ? `<div style="font-size:11px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(u.bio)}</div>` : ""}
                            </div>
                        </div>
                        <div style="display:flex;gap:5px;flex-shrink:0;">
                            <button type="button" data-scall="${esc(uK)}" title="Voice Call" style="padding:7px 9px;border-radius:10px;background:#1e293b;border:1px solid #10b981;color:#34d399;font-size:12px;cursor:pointer;">📞</button>
                            <button type="button" data-schat="${esc(uK)}" data-sname="${esc(u.name || uK)}" data-sdp="${esc(u.dp || "")}" style="padding:7px 11px;border-radius:10px;background:#10b981;color:#020617;border:none;font-size:12px;font-weight:900;cursor:pointer;">💬</button>
                        </div>
                    </div>`;
                }).join("") : `<div style="padding:18px;text-align:center;color:#64748b;font-size:12.5px;">No members found${raw ? ` for "${esc(raw)}"` : ""}</div>`)
            ) : "";

            const postsSection = (scope === "all" || scope === "posts") && matchedPosts.length ? (
                `<div style="font-size:11.5px;font-weight:900;color:#38bdf8;text-transform:uppercase;margin:16px 4px 8px;">📝 Matching Community Posts (${matchedPosts.length})</div>` +
                matchedPosts.map((p, idx) => {
                    const thumb = p.image && !String(p.image).startsWith("NX_VIDEO_STREAM:") && p.mediaType !== "video"
                        ? `<img src="${esc(p.image)}" loading="lazy" style="width:46px;height:46px;border-radius:10px;object-fit:cover;flex-shrink:0;">` : "";
                    return `<div data-spost="${idx}" style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:14px;background:#0f172a;border:1px solid #1e293b;margin-bottom:8px;cursor:pointer;">
                        <div style="min-width:0;flex:1;">
                            <div style="font-size:12px;font-weight:900;color:#34d399;">@${esc(p.username || p.author)} • <span style="color:#94a3b8;font-weight:700;">❤️ ${p.likes || 0} • 💬 ${(p.comments || []).length}</span></div>
                            <div style="font-size:12.5px;color:#e2e8f0;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc((p.content || p.text || "📷 Media Post").slice(0, 110))}</div>
                        </div>
                        ${thumb}
                    </div>`;
                }).join("")
            ) : "";

            resBox.innerHTML = recentHtml + tagsHtml + usersSection + postsSection;

            const clRec = resBox.querySelector("#nx-sr-clrec");
            if (clRec) clRec.onclick = () => { localStorage.removeItem(RECENT_KEY); renderResults(inp.value); };
            resBox.querySelectorAll("[data-rec]").forEach((b) => { b.onclick = () => { inp.value = b.getAttribute("data-rec"); renderResults(inp.value); }; });
            resBox.querySelectorAll("[data-tagq]").forEach((b) => { b.onclick = () => { inp.value = "#" + b.getAttribute("data-tagq"); scope = "all"; renderResults(inp.value); }; });
            resBox.querySelectorAll("[data-sp]").forEach((el) => {
                el.onclick = () => {
                    const uK = el.getAttribute("data-sp");
                    saveRecentSearch(inp.value || ("@" + uK));
                    modal.remove();
                    if (window.openPublicUserProfileModal) window.openPublicUserProfileModal(uK);
                };
            });
            resBox.querySelectorAll("[data-schat]").forEach((b) => {
                b.onclick = (e) => {
                    e.stopPropagation();
                    const uK = b.getAttribute("data-schat");
                    saveRecentSearch(inp.value || ("@" + uK));
                    modal.remove();
                    if (window.NexusDM && NexusDM.openDirectChat) NexusDM.openDirectChat(uK, b.getAttribute("data-sname"), b.getAttribute("data-sdp"));
                    else if (window.openDirect1to1ChatWithUser) window.openDirect1to1ChatWithUser(uK);
                };
            });
            resBox.querySelectorAll("[data-scall]").forEach((b) => {
                b.onclick = (e) => {
                    e.stopPropagation();
                    const uK = b.getAttribute("data-scall");
                    modal.remove();
                    if (window.startNexusRealCall) window.startNexusRealCall("audio", uK);
                };
            });
            resBox.querySelectorAll("[data-spost]").forEach((r) => {
                r.onclick = () => {
                    const p = matchedPosts[Number(r.getAttribute("data-spost"))];
                    saveRecentSearch(inp.value);
                    modal.remove();
                    if (p && window.openScrollableProfilePostsFeed) window.openScrollableProfilePostsFeed([p], 0, { username: p.username });
                };
            });
        };

        modal.querySelectorAll("[data-sc]").forEach((b) => {
            b.onclick = () => {
                scope = b.getAttribute("data-sc");
                modal.querySelectorAll("[data-sc]").forEach((x) => x.classList.toggle("active", x === b));
                renderResults(inp.value);
            };
        });
        clrBtn.onclick = () => { inp.value = ""; renderResults(""); inp.focus(); };
        inp.oninput = () => renderResults(inp.value);
        renderResults("");
        setTimeout(() => inp.focus(), 60);
    };

    // -------------------- 3. BIND HEADER BUTTONS & START WATCHER --------------------
    function bindHeaderAndWatchers() {
        ensureSupabaseNotifSubscription();
        updateHeaderNotifBadge();
        if (window.Nexus) {
            Nexus.openNotifications = window.openNexusRealNotificationsModal;
            Nexus.openSearch = window.openNexusRealSearchModal;
        }
        document.querySelectorAll(".nx-header-actions button").forEach((btn) => {
            const oc = btn.getAttribute("onclick") || "";
            if (oc.includes("openNotifications") && !btn.dataset.nxNotifV4Bound) {
                btn.dataset.nxNotifV4Bound = "1";
                btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); window.openNexusRealNotificationsModal(); };
            } else if (oc.includes("openSearch") && !btn.dataset.nxSearchV4Bound) {
                btn.dataset.nxSearchV4Bound = "1";
                btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); window.openNexusRealSearchModal(); };
            }
        });
    }

    setInterval(bindHeaderAndWatchers, 900);
    setTimeout(bindHeaderAndWatchers, 150);
    window.NexusNotify = {
        openNotifications: window.openNexusRealNotificationsModal,
        openSearch: window.openNexusRealSearchModal,
        toggleDnd: toggleDndMode,
        enablePush: requestOsPushPermission,
        refresh: refreshUnreadDmsFromSupabase
    };
})();
