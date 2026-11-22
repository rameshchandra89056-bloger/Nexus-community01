// ============================================================================
// NEXUS OFFICIAL NOTIFY.JS (v12.0 ULTRA PRO DUAL-CLOUD NOTIFICATION ENGINE)
// 1. ALL Real Notifications: 1:1 DMs, Official Announcements, Likes, Comments,
//    New Followers, Group @Mentions & Missed Voice/Video Calls (Firebase + Supabase)
// 2. Inline 1-Tap Quick-Reply for DM Alerts (Banner + Drawer)
// 3. Android PWA / OS Push Notifications (Service Worker showNotification + Fallback)
// 4. 4 Filter Tabs (All / DMs / Social / Official) + Live Search + Mark All Read
// 5. 3 Custom Web-Audio Chimes + Haptic Vibration + Quick DND + Auto Night Quiet Hours
// 6. Live Red Bell Badge (#nx-notif-dot) + Browser Tab Unread Title Counter
// ============================================================================

(function () {
    if (window.__NEXUS_NOTIFY_MASTER_V12__) return;
    window.__NEXUS_NOTIFY_MASTER_V12__ = true;
    window.__NEXUS_NOTIFY_MASTER_V11__ = true; // Prevent any older script conflicts

    const STORE_KEY = "nexus_notifications_v12";
    const PREF_KEY = "nexus_notify_prefs_v12";
    const BASE_TITLE = document.title || "Nexus Community";

    let dmNotifUnsub = null;
    let customNotifUnsub = null;
    let mentionNotifUnsub = null;
    let officialStoryUnsub = null;
    let sbRealtimeNotifChan = null;
    let bootTimestamp = Date.now();
    let alertedIds = new Set();
    let activeNotifFilter = "all"; // 'all' | 'dm' | 'social' | 'official'
    let notifSearchQ = "";
    let lastKnownFollowers = null;

    const escHtml = (s) =>
        String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        }[c]));
    const normU = (u) => String(u || "").toLowerCase().replace(/^@/, "").trim();

    function getMe() {
        try {
            if (window.Nexus && typeof Nexus.getCurrentUser === "function") {
                const u = Nexus.getCurrentUser();
                if (u && u.username) return u;
            }
            const raw = localStorage.getItem("nx_active_account");
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return null;
    }

    function getNotifyPrefs() {
        try {
            const p = JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
            return Object.assign(
                {
                    soundTone: "classic", // 'classic' | 'pop' | 'chime' | 'off'
                    vibrate: true,
                    quietHours: false, // 23:00 - 07:00 auto mute
                    muted: localStorage.getItem("nexus_mute_notifications") === "true"
                },
                p
            );
        } catch (e) {
            return { soundTone: "classic", vibrate: true, quietHours: false, muted: false };
        }
    }

    function saveNotifyPrefs(patch) {
        const next = Object.assign(getNotifyPrefs(), patch);
        try {
            localStorage.setItem(PREF_KEY, JSON.stringify(next));
            localStorage.setItem("nexus_mute_notifications", next.muted ? "true" : "false");
        } catch (e) {}
        return next;
    }

    function isMutedOrQuietNow() {
        const np = getNotifyPrefs();
        if (np.muted) return true;
        try {
            const sp = JSON.parse(localStorage.getItem("nx_ig_user_preferences_v1") || "{}");
            if (sp.dndMode === true || sp.pushNotifications === false) return true;
        } catch (e) {}
        if (np.quietHours) {
            const hr = new Date().getHours();
            if (hr >= 23 || hr < 7) return true;
        }
        return false;
    }

    function formatShortAgo(ts) {
        const num = Number(ts || 0);
        if (!num || num < 1000000000000) return "Now";
        const sec = Math.max(1, Math.floor((Date.now() - num) / 1000));
        if (sec < 60) return "Just now";
        if (sec < 3600) return Math.floor(sec / 60) + "m ago";
        if (sec < 86400) return Math.floor(sec / 3600) + "h ago";
        return Math.floor(sec / 86400) + "d ago";
    }

    function loadStoredList() {
        try {
            // Migrate any v10 items seamlessly on first run
            const v12 = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
            if (Array.isArray(v12)) return v12;
            const v10 = JSON.parse(localStorage.getItem("nexus_notifications_v10") || "[]");
            return Array.isArray(v10) ? v10 : [];
        } catch (e) {
            return [];
        }
    }

    function saveStoredList(arr) {
        try {
            localStorage.setItem(STORE_KEY, JSON.stringify((arr || []).slice(0, 80)));
        } catch (e) {}
    }

    // =========================================================================
    // 1. 3-TONE WEB AUDIO SYNTHESIZER + HAPTIC VIBRATION
    // =========================================================================
    function playNotificationTone(forceTone) {
        const np = getNotifyPrefs();
        if (!forceTone && isMutedOrQuietNow()) return;
        const tone = forceTone || np.soundTone || "classic";
        if (tone === "off") return;

        if (np.vibrate && navigator.vibrate) {
            try { navigator.vibrate([45, 30, 45]); } catch (e) {}
        }

        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const now = ctx.currentTime;

            const presets = {
                classic: [
                    { f: 587.33, t: 0, d: 0.22, type: "sine", v: 0.16 },
                    { f: 880.0, t: 0.11, d: 0.28, type: "sine", v: 0.18 }
                ],
                pop: [
                    { f: 420, t: 0, d: 0.08, type: "triangle", v: 0.2 },
                    { f: 760, t: 0.07, d: 0.14, type: "sine", v: 0.16 }
                ],
                chime: [
                    { f: 659.25, t: 0, d: 0.2, type: "sine", v: 0.14 },
                    { f: 783.99, t: 0.09, d: 0.22, type: "sine", v: 0.15 },
                    { f: 1046.5, t: 0.18, d: 0.32, type: "sine", v: 0.16 }
                ]
            };

            const notes = presets[tone] || presets.classic;
            notes.forEach((n) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = n.type;
                osc.frequency.setValueAtTime(n.f, now + n.t);
                gain.gain.setValueAtTime(n.v, now + n.t);
                gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + n.t);
                osc.stop(now + n.t + n.d + 0.02);
            });
        } catch (e) {}
    }

    // =========================================================================
    // 2. ANDROID PWA + DESKTOP OS PUSH NOTIFICATION DISPATCHER
    // =========================================================================
    async function dispatchOsPushNotification(notif) {
        if (isMutedOrQuietNow()) return;
        if (document.visibilityState === "visible") return;
        if (!("Notification" in window) || Notification.permission !== "granted") return;

        const title = notif.title || "Nexus Community";
        const options = {
            body: notif.body || "New activity on Nexus",
            tag: notif.id || "nx_notif",
            renotify: false,
            vibrate: [80, 40, 80]
        };

        try {
            if ("serviceWorker" in navigator) {
                const reg = await navigator.serviceWorker.ready;
                if (reg && typeof reg.showNotification === "function") {
                    await reg.showNotification(title, options);
                    return;
                }
            }
        } catch (e) {}

        try {
            const osN = new Notification(title, options);
            osN.onclick = () => {
                window.focus();
                osN.close();
                openNotifTarget(notif);
            };
        } catch (e) {}
    }

    function updateBellBadgeAndTabTitle() {
        const stored = loadStoredList();
        const unread = stored.filter((x) => x && !x.read).length;

        const dot = document.getElementById("nx-notif-dot");
        if (dot) {
            if (unread > 0) {
                dot.textContent = unread > 99 ? "99+" : String(unread);
                dot.style.display = "inline-block";
            } else {
                dot.style.display = "none";
            }
        }
        try {
            document.title = unread > 0 ? `(${unread}) ${BASE_TITLE}` : BASE_TITLE;
        } catch (e) {}
    }

    // Inline Quick-Reply Sender for 1:1 DM Notifications
    async function sendQuickDmReply(toUsername, replyText) {
        const me = getMe();
        const cleanText = String(replyText || "").trim();
        const targetU = normU(toUsername);
        if (!me || !me.username || !targetU || !cleanText || !window.Nexus || !Nexus.db) return false;

        const myU = normU(me.username);
        const roomKey = [myU, targetU].sort().join("__");
        try {
            await Nexus.db.collection("nexus_private_dms").add({
                roomKey: roomKey,
                fromUser: myU,
                fromName: me.name || me.username,
                toUser: targetU,
                text: cleanText,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                createdAt: Date.now(),
                seen: false
            });
            if (window.Nexus && Nexus.toast) Nexus.toast(`⚡ Reply sent to @${targetU}!`);
            return true;
        } catch (e) {
            return false;
        }
    }

    function openNotifTarget(notif) {
        if (!notif) return;
        const gModal = document.getElementById("nx-global-modal");
        if (gModal) gModal.style.display = "none";

        if (notif.type === "dm" && notif.fromUser && window.NexusDM && typeof NexusDM.openDirectChat === "function") {
            NexusDM.openDirectChat(notif.fromUser, notif.fromName || notif.fromUser, "");
        } else if (notif.type === "mention" && window.Nexus && Nexus.switchTab) {
            Nexus.switchTab("tab-community");
        } else if (notif.type === "official" && window.Nexus && Nexus.switchTab) {
            Nexus.switchTab("tab-home");
            window.scrollTo(0, 0);
        } else if (notif.fromUser && window.openPublicUserProfileModal) {
            window.openPublicUserProfileModal(notif.fromUser);
        } else if (notif.fromUser && window.Nexus && Nexus.openPublicProfile) {
            Nexus.openPublicProfile(notif.fromUser);
        } else {
            window.openNotificationDrawer();
        }
    }

    // =========================================================================
    // 3. SAVE + LIVE FLOATING BANNER WITH INLINE QUICK-REPLY
    // =========================================================================
    function saveAndPopupNotification(notif) {
        if (!notif || !notif.id || alertedIds.has(notif.id)) return;
        alertedIds.add(notif.id);

        // Suppress DM banner if already chatting directly with the exact same person
        const activePartner = normU((window.NexusDM && NexusDM.activePartner) || window.activeDMUser || "");
        const dmRoot = document.getElementById("nx-dm-dedicated-root");
        const inSameDm = Boolean(
            notif.type === "dm" &&
            dmRoot &&
            dmRoot.style.display !== "none" &&
            activePartner &&
            activePartner === normU(notif.fromUser)
        );
        if (inSameDm) return;

        const stored = loadStoredList();
        if (!stored.some((x) => x && x.id === notif.id)) {
            stored.unshift(Object.assign({ createdAt: Date.now(), read: false }, notif));
            saveStoredList(stored);
        }

        updateBellBadgeAndTabTitle();
        if (isMutedOrQuietNow()) return;

        playNotificationTone();
        dispatchOsPushNotification(notif);

        document.getElementById("nx-live-notif-banner")?.remove();

        const iconMap = {
            dm: "💬",
            like: "❤️",
            comment: "💭",
            follow: "👤",
            mention: "📢",
            official: "👑",
            call: "📞"
        };
        const icon = iconMap[notif.type] || "🔔";
        const accent = notif.type === "official" ? "#fbbf24" : notif.type === "like" ? "#f43f5e" : notif.type === "mention" ? "#a855f7" : "#10b981";

        const pop = document.createElement("div");
        pop.id = "nx-live-notif-banner";
        pop.style.cssText = `
            position: fixed; top: 12px; left: 50%; transform: translateX(-50%);
            z-index: 298500; width: calc(100% - 22px); max-width: 400px;
            background: rgba(15, 23, 42, 0.97); backdrop-filter: blur(12px);
            border: 1.5px solid #38bdf8; border-left: 4px solid ${accent};
            border-radius: 16px; padding: 11px 13px; color: #f8fafc;
            box-shadow: 0 18px 42px rgba(0,0,0,0.82);
            font-family: system-ui, sans-serif;
        `;

        pop.innerHTML = `
            <div id="nx-bnr-top" style="display:flex; align-items:center; gap:11px; cursor:pointer;">
                <div style="width:36px; height:36px; border-radius:11px; background:rgba(16,185,129,0.16); display:flex; align-items:center; justify-content:center; font-size:19px; flex-shrink:0;">${icon}</div>
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:900; font-size:12.5px; color:#5eead4; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escHtml(notif.title || "New Notification")}</div>
                    <div style="font-size:11.8px; color:#e2e8f0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escHtml(notif.body || "")}</div>
                </div>
                <button type="button" id="nx-bnr-close" style="background:#1e293b; border:none; color:#94a3b8; width:24px; height:24px; border-radius:50%; font-weight:900; cursor:pointer; flex-shrink:0;">✕</button>
            </div>
            ${
                notif.type === "dm" && notif.fromUser
                    ? `<div style="display:flex; gap:6px; margin-top:8px; padding-top:8px; border-top:1px solid #1e293b;">
                           <input type="text" id="nx-bnr-qreply" placeholder="Quick reply to @${escHtml(notif.fromUser)}..." style="flex:1; padding:6px 10px; border-radius:9px; background:#090d16; border:1px solid #334155; color:#fff; font-size:12px; outline:none;" />
                           <button type="button" id="nx-bnr-qsend" style="padding:6px 12px; border-radius:9px; background:#10b981; color:#020617; font-weight:900; font-size:11.5px; border:none; cursor:pointer;">Send ➤</button>
                       </div>`
                    : ""
            }
        `;

        document.body.appendChild(pop);

        let autoHideTimer = setTimeout(() => { if (pop.isConnected) pop.remove(); }, 5200);

        pop.querySelector("#nx-bnr-close").onclick = (e) => {
            e.stopPropagation();
            clearTimeout(autoHideTimer);
            pop.remove();
        };

        pop.querySelector("#nx-bnr-top").onclick = () => {
            clearTimeout(autoHideTimer);
            pop.remove();
            openNotifTarget(notif);
        };

        const qInp = pop.querySelector("#nx-bnr-qreply");
        const qBtn = pop.querySelector("#nx-bnr-qsend");
        if (qInp && qBtn) {
            qInp.addEventListener("focus", () => clearTimeout(autoHideTimer));
            const fireReply = async () => {
                const txt = (qInp.value || "").trim();
                if (!txt) return;
                qBtn.disabled = true;
                qBtn.textContent = "⏳";
                const ok = await sendQuickDmReply(notif.fromUser, txt);
                if (ok) pop.remove();
                else { qBtn.disabled = false; qBtn.textContent = "Send ➤"; }
            };
            qBtn.onclick = (e) => { e.stopPropagation(); fireReply(); };
            qInp.onkeydown = (e) => { if (e.key === "Enter") fireReply(); };
        }
    }

    // =========================================================================
    // 4. MERGE STORED + LIVE SOCIAL + OFFICIAL FEED HISTORY
    // =========================================================================
    function gatherAllCombinedNotifications() {
        const me = getMe();
        const stored = loadStoredList();
        const seenKeys = new Set(stored.map((x) => x && x.id));
        const extra = [];

        if (me && me.username) {
            const myU = normU(me.username);

            // A. Official Nexus Pinned Announcements
            if (Array.isArray(window.Nexus && Nexus.posts)) {
                Nexus.posts.forEach((p) => {
                    if (!p) return;
                    const pU = normU(p.username);
                    if (pU === "nexus_official" && p.pinned) {
                        const k = `off_${p.id}`;
                        if (!seenKeys.has(k)) {
                            seenKeys.add(k);
                            extra.push({
                                id: k,
                                type: "official",
                                fromUser: "nexus_official",
                                fromName: "Nexus Official",
                                title: "👑 Nexus Official Announcement",
                                body: String(p.content || p.text || "New Official Update").slice(0, 75),
                                timeStr: formatShortAgo(p.createdAt),
                                createdAt: Number(p.createdAt || 0),
                                read: true
                            });
                        }
                    }

                    // B. Likes & Comments on current user's posts
                    if (pU !== myU) return;
                    const snip = String(p.content || p.text || "Media Post").slice(0, 48);
                    (Array.isArray(p.likedBy) ? p.likedBy : []).forEach((liker) => {
                        const lk = normU(liker);
                        if (!lk || lk === myU) return;
                        const k = `like_${p.id}_${lk}`;
                        if (!seenKeys.has(k)) {
                            seenKeys.add(k);
                            extra.push({
                                id: k,
                                type: "like",
                                fromUser: lk,
                                fromName: "@" + lk,
                                title: `❤️ @${lk} liked your post`,
                                body: snip,
                                timeStr: formatShortAgo(p.createdAt),
                                createdAt: Number(p.createdAt || 0),
                                read: true
                            });
                        }
                    });
                    (Array.isArray(p.comments) ? p.comments : []).forEach((c, idx) => {
                        if (!c) return;
                        const cu = normU(c.username || c.author);
                        if (!cu || cu === myU) return;
                        const k = `comm_${p.id}_${idx}`;
                        if (!seenKeys.has(k)) {
                            seenKeys.add(k);
                            extra.push({
                                id: k,
                                type: "comment",
                                fromUser: cu,
                                fromName: c.author || "@" + cu,
                                title: `💬 ${c.author || "@" + cu} commented`,
                                body: String(c.text || c.content || "").slice(0, 65),
                                timeStr: c.time || formatShortAgo(c.createdAt || p.createdAt),
                                createdAt: Number(c.createdAt || p.createdAt || 0),
                                read: true
                            });
                        }
                    });
                });
            }

            // C. Followers
            const myEntry = ((window.Nexus && Nexus.users) || []).find((u) => u && normU(u.username) === myU) || me;
            (Array.isArray(myEntry.followersList) ? myEntry.followersList : []).forEach((f) => {
                const fu = normU(f);
                if (!fu || fu === myU) return;
                const k = `fol_${fu}`;
                if (!seenKeys.has(k)) {
                    seenKeys.add(k);
                    extra.push({
                        id: k,
                        type: "follow",
                        fromUser: fu,
                        fromName: "@" + fu,
                        title: `👤 @${fu} follows you`,
                        body: "Tap to view profile or start 1:1 chat",
                        timeStr: "Follower",
                        createdAt: Date.now() - 86400000,
                        read: true
                    });
                }
            });
        }

        return [...stored, ...extra]
            .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
            .slice(0, 80);
    }

    // =========================================================================
    // 5. PRO ACTIVITY CENTER DRAWER (4 TABS + SEARCH + PUSH + SOUND + DND)
    // =========================================================================
    window.openNotificationDrawer = function () {
        const modal = document.getElementById("nx-global-modal");
        if (!modal) return;

        // Mark all stored notifications read & clear red badge + tab title
        const stored = loadStoredList();
        stored.forEach((x) => { if (x) x.read = true; });
        saveStoredList(stored);
        updateBellBadgeAndTabTitle();

        if (window.__nxPushBackLayer) {
            window.__nxPushBackLayer("nx-global-modal", () => {
                modal.style.display = "none";
            });
        }

        const np = getNotifyPrefs();
        const combined = gatherAllCombinedNotifications();
        const q = notifSearchQ.toLowerCase().trim();

        const filtered = combined.filter((n) => {
            if (activeNotifFilter === "dm" && n.type !== "dm" && n.type !== "call") return false;
            if (activeNotifFilter === "social" && !["like", "comment", "follow", "mention"].includes(n.type)) return false;
            if (activeNotifFilter === "official" && n.type !== "official") return false;
            if (q && !`${n.title || ""} ${n.body || ""} ${n.fromUser || ""}`.toLowerCase().includes(q)) return false;
            return true;
        });

        const pushSupported = "Notification" in window;
        const pushPerm = pushSupported ? Notification.permission : "denied";

        const tabBtn = (id, label) =>
            `<button type="button" data-nflt="${id}" style="flex:1;padding:7px 2px;border-radius:9px;border:none;background:${
                activeNotifFilter === id ? "#10b981" : "#090d16"
            };color:${activeNotifFilter === id ? "#020617" : "#94a3b8"};font-size:10.5px;font-weight:900;cursor:pointer;white-space:nowrap;">${label}</button>`;

        const toneLabels = { classic: "🔔 Bell", pop: "💧 Pop", chime: "✨ Chime", off: "🔇 Silent" };

        modal.style.zIndex = "272000";
        modal.innerHTML = `
            <div class="nx-modal-box" style="border:1.5px solid #10b981; max-width:440px; width:100%; background:#0f172a; padding:15px; display:flex; flex-direction:column; max-height:88dvh;">
                <!-- Header -->
                <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:10px; border-bottom:1px solid #1e293b; margin-bottom:9px;">
                    <div>
                        <div style="font-weight:900; font-size:16px; color:#f8fafc;">🔔 Pro Activity Center (${filtered.length})</div>
                        <div style="font-size:10.5px; color:#34d399; font-weight:700;">DMs • Mentions • Official • Social (Dual-Cloud)</div>
                    </div>
                    <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:#ef4444; color:white; border:none; width:30px; height:30px; border-radius:50%; font-weight:900; cursor:pointer;">✕</button>
                </div>

                <!-- Control Bar: Sound Tone | DND | Quiet Hours | Clear -->
                <div style="display:flex; gap:5px; margin-bottom:9px; flex-wrap:wrap;">
                    <button type="button" id="nx-ntf-tone-btn" style="flex:1; background:#1e293b; color:#38bdf8; border:1px solid #334155; padding:5px 7px; border-radius:8px; font-size:10.5px; font-weight:800; cursor:pointer;">${toneLabels[np.soundTone] || "🔔 Bell"}</button>
                    <button type="button" id="nx-ntf-dnd-btn" style="flex:1; background:${np.muted ? "#f59e0b" : "#1e293b"}; color:${np.muted ? "#020617" : "#cbd5e1"}; border:1px solid #334155; padding:5px 7px; border-radius:8px; font-size:10.5px; font-weight:800; cursor:pointer;">${np.muted ? "🔕 Muted" : "🔊 Active"}</button>
                    <button type="button" id="nx-ntf-quiet-btn" style="flex:1; background:${np.quietHours ? "#6366f1" : "#1e293b"}; color:${np.quietHours ? "#fff" : "#94a3b8"}; border:1px solid #334155; padding:5px 7px; border-radius:8px; font-size:10.5px; font-weight:800; cursor:pointer;">🌙 Night</button>
                    <button type="button" id="nx-ntf-clear-btn" style="background:#1e293b; color:#fb7185; border:1px solid rgba(244,63,94,0.35); padding:5px 9px; border-radius:8px; font-size:10.5px; font-weight:800; cursor:pointer;">🧹 Clear</button>
                </div>

                ${
                    pushSupported && pushPerm === "default"
                        ? `<div style="background:rgba(56,189,248,0.12); border:1px solid #38bdf8; border-radius:11px; padding:8px 10px; margin-bottom:9px; display:flex; align-items:center; justify-content:space-between; gap:8px;">
                               <span style="font-size:11px; color:#e0f2fe; font-weight:700;">📲 Enable Chrome/Phone Push Alerts</span>
                               <button type="button" id="nx-ntf-enable-push" style="background:#38bdf8; color:#020617; border:none; border-radius:8px; padding:5px 10px; font-size:11px; font-weight:900; cursor:pointer; flex-shrink:0;">Enable ✓</button>
                           </div>`
                        : ""
                }

                <!-- Search Inside Notifications -->
                <input type="text" id="nx-ntf-search-inp" value="${escHtml(notifSearchQ)}" placeholder="🔍 Search notifications, @username..." style="width:100%; padding:8px 11px; border-radius:10px; background:#090d16; border:1px solid #334155; color:#fff; font-size:12px; outline:none; margin-bottom:8px;" />

                <!-- 4 Filter Tabs -->
                <div style="display:flex; gap:5px; margin-bottom:10px;">
                    ${tabBtn("all", `All (${combined.length})`)}
                    ${tabBtn("dm", `💬 DMs (${combined.filter((x) => x.type === "dm" || x.type === "call").length})`)}
                    ${tabBtn("social", `❤️ Social (${combined.filter((x) => ["like", "comment", "follow", "mention"].includes(x.type)).length})`)}
                    ${tabBtn("official", `👑 Official (${combined.filter((x) => x.type === "official").length})`)}
                </div>

                <!-- Scrollable Notification List -->
                <div style="display:flex; flex-direction:column; gap:8px; flex:1; overflow-y:auto; min-height:140px;">
                    ${
                        filtered.length === 0
                            ? `<div style="text-align:center; padding:32px 12px; color:#64748b; font-size:12.5px;">Is filter mein abhi koi notification nahi hai.</div>`
                            : filtered
                                  .map((n, idx) => {
                                      const borderCol =
                                          n.type === "official"
                                              ? "#fbbf24"
                                              : n.type === "like"
                                              ? "#f43f5e"
                                              : n.type === "follow"
                                              ? "#38bdf8"
                                              : n.type === "mention"
                                              ? "#a855f7"
                                              : n.type === "call"
                                              ? "#f59e0b"
                                              : "#10b981";
                                      return `
                                          <div style="background:#161f33; border:1px solid #1e293b; border-left:3.5px solid ${borderCol}; padding:10px 11px; border-radius:12px;">
                                              <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
                                                  <div data-nclick="${idx}" style="flex:1; min-width:0; cursor:pointer;">
                                                      <div style="display:flex; justify-content:space-between; align-items:center; gap:6px;">
                                                          <span style="font-weight:800; font-size:12.5px; color:#f8fafc;">${escHtml(n.title || "Activity")}</span>
                                                          <span style="font-size:10px; color:#38bdf8; font-weight:700; flex-shrink:0;">${escHtml(n.timeStr || formatShortAgo(n.createdAt))}</span>
                                                      </div>
                                                      <div style="font-size:11.8px; color:#cbd5e1; margin-top:3px; word-break:break-word;">${escHtml(n.body || "")}</div>
                                                  </div>
                                                  <button type="button" data-ndel="${escHtml(n.id)}" title="Dismiss" style="background:none; border:none; color:#64748b; font-size:13px; cursor:pointer; padding:2px 4px;">✕</button>
                                              </div>
                                              ${
                                                  n.type === "dm" && n.fromUser
                                                      ? `<div style="display:flex; gap:5px; margin-top:7px;">
                                                             <input type="text" data-qrinp="${idx}" placeholder="Quick reply..." style="flex:1; padding:5px 9px; border-radius:8px; background:#090d16; border:1px solid #334155; color:#fff; font-size:11.5px; outline:none;" />
                                                             <button type="button" data-qrsend="${idx}" style="padding:5px 10px; border-radius:8px; background:#10b981; color:#020617; font-weight:900; font-size:11px; border:none; cursor:pointer;">Reply</button>
                                                         </div>`
                                                      : ""
                                              }
                                          </div>
                                      `;
                                  })
                                  .join("")
                    }
                </div>
            </div>
        `;
        modal.style.display = "flex";

        // Filter Tabs
        modal.querySelectorAll("[data-nflt]").forEach((b) => {
            b.onclick = () => {
                activeNotifFilter = b.getAttribute("data-nflt");
                window.openNotificationDrawer();
            };
        });

        // Search input
        const sInp = modal.querySelector("#nx-ntf-search-inp");
        if (sInp) {
            sInp.oninput = (e) => {
                notifSearchQ = e.target.value || "";
                window.openNotificationDrawer();
                const refocused = document.getElementById("nx-ntf-search-inp");
                if (refocused) {
                    refocused.focus();
                    refocused.selectionStart = refocused.selectionEnd = refocused.value.length;
                }
            };
        }

        // Tone Cycle Button (with instant sound preview!)
        modal.querySelector("#nx-ntf-tone-btn").onclick = () => {
            const order = ["classic", "pop", "chime", "off"];
            const cur = getNotifyPrefs().soundTone || "classic";
            const nextTone = order[(order.indexOf(cur) + 1) % order.length];
            saveNotifyPrefs({ soundTone: nextTone, muted: nextTone === "off" ? true : false });
            if (nextTone !== "off") playNotificationTone(nextTone);
            window.openNotificationDrawer();
            if (window.Nexus && Nexus.toast) Nexus.toast(`🎵 Tone: ${toneLabels[nextTone]}`);
        };

        // Quick DND Toggle
        modal.querySelector("#nx-ntf-dnd-btn").onclick = () => {
            const nextMuted = !getNotifyPrefs().muted;
            saveNotifyPrefs({ muted: nextMuted });
            try {
                const sp = JSON.parse(localStorage.getItem("nx_ig_user_preferences_v1") || "{}");
                sp.pushNotifications = !nextMuted;
                localStorage.setItem("nx_ig_user_preferences_v1", JSON.stringify(sp));
            } catch (e) {}
            window.openNotificationDrawer();
            if (window.Nexus && Nexus.toast) Nexus.toast(nextMuted ? "🔕 Notifications Muted" : "🔊 Notifications Active");
        };

        // Night Quiet Hours Toggle (11 PM - 7 AM)
        modal.querySelector("#nx-ntf-quiet-btn").onclick = () => {
            const nextQ = !getNotifyPrefs().quietHours;
            saveNotifyPrefs({ quietHours: nextQ });
            window.openNotificationDrawer();
            if (window.Nexus && Nexus.toast) Nexus.toast(nextQ ? "🌙 Quiet Hours ON (11 PM - 7 AM)" : "🌙 Quiet Hours OFF");
        };

        // Clear All
        modal.querySelector("#nx-ntf-clear-btn").onclick = () => {
            saveStoredList([]);
            window.openNotificationDrawer();
            if (window.Nexus && Nexus.toast) Nexus.toast("🧹 Notification History Cleared!");
        };

        // 1-Tap OS Push Permission Request
        const enablePushBtn = modal.querySelector("#nx-ntf-enable-push");
        if (enablePushBtn) {
            enablePushBtn.onclick = async () => {
                try {
                    const perm = await Notification.requestPermission();
                    if (window.Nexus && Nexus.toast) {
                        Nexus.toast(perm === "granted" ? "✅ Device Push Alerts Enabled!" : "⚠️ Permission blocked in browser settings");
                    }
                    window.openNotificationDrawer();
                } catch (e) {}
            };
        }

        // Open Target on Row Click
        modal.querySelectorAll("[data-nclick]").forEach((row) => {
            row.onclick = () => openNotifTarget(filtered[Number(row.getAttribute("data-nclick"))]);
        });

        // Per-Item Dismiss
        modal.querySelectorAll("[data-ndel]").forEach((btn) => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = btn.getAttribute("data-ndel");
                const list = loadStoredList().filter((x) => x && x.id !== id);
                saveStoredList(list);
                window.openNotificationDrawer();
            };
        });

        // Inline Quick-Reply inside Drawer
        modal.querySelectorAll("[data-qrsend]").forEach((btn) => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                const idx = Number(btn.getAttribute("data-qrsend"));
                const item = filtered[idx];
                const inp = modal.querySelector(`[data-qrinp="${idx}"]`);
                if (!item || !inp || !inp.value.trim()) return;
                btn.disabled = true;
                btn.textContent = "⏳";
                const ok = await sendQuickDmReply(item.fromUser, inp.value.trim());
                btn.disabled = false;
                btn.textContent = ok ? "Sent ✓" : "Retry";
                if (ok) inp.value = "";
            };
        });
    };

    // Single Authoritative Binding (Stops duplicate drawers!)
    window.openNexusRealNotificationsModal = window.openNotificationDrawer;

    // =========================================================================
    // 6. ALL-SOURCE DUAL-CLOUD REAL-TIME STREAMS (FIREBASE + SUPABASE)
    // =========================================================================
    function connectAllNotificationStreams() {
        const me = getMe();
        if (!me || !me.username) return;
        const myU = normU(me.username);

        if (window.Nexus) {
            Nexus.openNotifications = window.openNotificationDrawer;
            Nexus.pushRealNotification = function (targetUsername, type, actionText, snippet) {
                if (!targetUsername || !Nexus.db) return;
                const cleanTarget = normU(targetUsername);
                if (!cleanTarget || cleanTarget === myU) return;
                const emoji =
                    type === "like"
                        ? "❤️"
                        : type === "follow"
                        ? "👤"
                        : type === "mention"
                        ? "📢"
                        : type === "call"
                        ? "📞"
                        : "💬";
                Nexus.db
                    .collection("nexus_notifications")
                    .add({
                        toUser: cleanTarget,
                        fromUser: myU,
                        fromName: me.name || me.username,
                        type: type || "activity",
                        title: `${emoji} ${me.name || "@" + myU}`,
                        body: `${actionText} ${snippet ? '"' + String(snippet).substring(0, 50) + '"' : ""}`.trim(),
                        timeStr: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                        createdAt: Date.now()
                    })
                    .catch(() => {});
            };
        }

        // 1. Firebase 1:1 Direct Messages
        if (window.Nexus && Nexus.db && !dmNotifUnsub) {
            dmNotifUnsub = Nexus.db
                .collection("nexus_private_dms")
                .where("toUser", "==", myU)
                .limit(25)
                .onSnapshot((snap) => {
                    snap.docChanges().forEach((change) => {
                        if (change.type === "added") {
                            const m = change.doc.data();
                            if (m && m.createdAt && m.createdAt >= bootTimestamp && !m.deleted && normU(m.fromUser) !== myU) {
                                saveAndPopupNotification({
                                    id: "dm_" + change.doc.id,
                                    type: "dm",
                                    fromUser: normU(m.fromUser),
                                    fromName: m.fromName || m.fromUser,
                                    title: `💬 Message from ${m.fromName || "@" + m.fromUser}`,
                                    body:
                                        m.text ||
                                        (m.imgUrl || (m.imgUrls && m.imgUrls.length)
                                            ? "📷 Sent a Photo"
                                            : m.videoUrl
                                            ? "🎬 Sent a Video"
                                            : "🎤 Sent a Voice Note"),
                                    timeStr: m.time || "Just now",
                                    createdAt: m.createdAt
                                });
                            }
                        }
                    });
                }, () => {});
        }

        // 2. Firebase Likes / Comments / Follows / Calls
        if (window.Nexus && Nexus.db && !customNotifUnsub) {
            customNotifUnsub = Nexus.db
                .collection("nexus_notifications")
                .where("toUser", "==", myU)
                .limit(25)
                .onSnapshot((snap) => {
                    snap.docChanges().forEach((change) => {
                        if (change.type === "added") {
                            const n = change.doc.data();
                            if (n && n.createdAt && n.createdAt >= bootTimestamp) {
                                saveAndPopupNotification(Object.assign({ id: "ntf_" + change.doc.id }, n));
                            }
                        }
                    });
                }, () => {});
        }

        // 3. Firebase Group Chat @username Mention Detector!
        if (window.Nexus && Nexus.db && !mentionNotifUnsub) {
            mentionNotifUnsub = Nexus.db
                .collection("nexus_real_msgs")
                .orderBy("createdAt", "desc")
                .limit(15)
                .onSnapshot((snap) => {
                    snap.docChanges().forEach((change) => {
                        if (change.type === "added") {
                            const m = change.doc.data();
                            if (!m || !m.createdAt || m.createdAt < bootTimestamp) return;
                            const sender = normU(m.username || m.fromUser);
                            if (!sender || sender === myU) return;
                            const txt = String(m.text || "");
                            if (txt.toLowerCase().includes("@" + myU)) {
                                saveAndPopupNotification({
                                    id: "mnt_" + change.doc.id,
                                    type: "mention",
                                    fromUser: sender,
                                    fromName: m.author || "@" + sender,
                                    title: `📢 @${sender} mentioned you in Group`,
                                    body: txt.slice(0, 80),
                                    timeStr: "Just now",
                                    createdAt: m.createdAt
                                });
                            }
                        }
                    });
                }, () => {});
        }

        // 4. Official Nexus Stories Alert
        if (window.Nexus && Nexus.db && !officialStoryUnsub) {
            officialStoryUnsub = Nexus.db
                .collection("official_stories")
                .orderBy("timestamp", "desc")
                .limit(5)
                .onSnapshot((snap) => {
                    snap.docChanges().forEach((change) => {
                        if (change.type === "added") {
                            const s = change.doc.data();
                            if (s && s.isOfficial && Number(s.timestamp || 0) >= bootTimestamp) {
                                saveAndPopupNotification({
                                    id: "ost_" + change.doc.id,
                                    type: "official",
                                    fromUser: "nexus_official",
                                    fromName: "Nexus Official",
                                    title: `👑 ${s.title || "New Nexus Official Story"}`,
                                    body: String(s.caption || "Tap to watch official update!").slice(0, 80),
                                    timeStr: "Just now",
                                    createdAt: Number(s.timestamp || Date.now())
                                });
                            }
                        }
                    });
                }, () => {});
        }

        // 5. Supabase Real-Time Alerts (Official Posts, Likes/Comments on YOUR SB Posts, New Followers!)
        const sbC = (window.NexusSecurity && window.NexusSecurity.sb) || (window.Nexus && Nexus.getSbClient && Nexus.getSbClient());
        if (sbC && !sbRealtimeNotifChan) {
            try {
                sbRealtimeNotifChan = sbC
                    .channel("nx_notify_sb_pro_v12_" + myU)
                    .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, (payload) => {
                        const p = payload && payload.new;
                        if (!p) return;
                        const aU = normU(p.author_username);
                        if (aU === "nexus_official" || p.is_pinned) {
                            saveAndPopupNotification({
                                id: "sb_off_" + p.id,
                                type: "official",
                                fromUser: aU || "nexus_official",
                                fromName: p.author_name || "Nexus Official",
                                title: "👑 Nexus Official Announcement",
                                body: String(p.content || "New official post published!").slice(0, 85),
                                timeStr: "Just now",
                                createdAt: Date.now()
                            });
                        }
                    })
                    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "posts" }, (payload) => {
                        const nw = payload && payload.new;
                        const od = payload && payload.old;
                        if (!nw || normU(nw.author_username) !== myU) return;
                        const newLikes = Array.isArray(nw.likes_list) ? nw.likes_list : [];
                        const oldLikes = Array.isArray(od && od.likes_list) ? od.likes_list : [];
                        if (newLikes.length > oldLikes.length) {
                            const lastLiker = normU(newLikes[newLikes.length - 1]);
                            if (lastLiker && lastLiker !== myU) {
                                saveAndPopupNotification({
                                    id: `sblike_${nw.id}_${lastLiker}_${newLikes.length}`,
                                    type: "like",
                                    fromUser: lastLiker,
                                    fromName: "@" + lastLiker,
                                    title: `❤️ @${lastLiker} liked your post`,
                                    body: String(nw.content || "Your post").slice(0, 60),
                                    timeStr: "Just now",
                                    createdAt: Date.now()
                                });
                            }
                        }
                        const newComms = Array.isArray(nw.comments_list) ? nw.comments_list : [];
                        const oldComms = Array.isArray(od && od.comments_list) ? od.comments_list : [];
                        if (newComms.length > oldComms.length) {
                            const lastC = newComms[newComms.length - 1];
                            const cU = normU(lastC && (lastC.username || lastC.author));
                            if (cU && cU !== myU) {
                                saveAndPopupNotification({
                                    id: `sbcomm_${nw.id}_${newComms.length}`,
                                    type: "comment",
                                    fromUser: cU,
                                    fromName: (lastC && lastC.author) || "@" + cU,
                                    title: `💬 @${cU} commented on your post`,
                                    body: String((lastC && (lastC.text || lastC.content)) || "").slice(0, 70),
                                    timeStr: "Just now",
                                    createdAt: Date.now()
                                });
                            }
                        }
                    })
                    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles" }, (payload) => {
                        const nw = payload && payload.new;
                        if (!nw || normU(nw.username) !== myU) return;
                        const fols = Array.isArray(nw.followers_list) ? nw.followers_list.map(normU) : [];
                        if (lastKnownFollowers === null) {
                            lastKnownFollowers = new Set(fols);
                            return;
                        }
                        fols.forEach((f) => {
                            if (f && f !== myU && !lastKnownFollowers.has(f)) {
                                lastKnownFollowers.add(f);
                                saveAndPopupNotification({
                                    id: `sbfol_${f}_${Date.now()}`,
                                    type: "follow",
                                    fromUser: f,
                                    fromName: "@" + f,
                                    title: `👤 @${f} started following you`,
                                    body: "Tap to view their profile or say hi!",
                                    timeStr: "Just now",
                                    createdAt: Date.now()
                                });
                            }
                        });
                    })
                    .subscribe();
            } catch (e) {}
        }
    }

    function hookHomeLikeNotification() {
        if (window.NexusHome && NexusHome.toggleLike && !NexusHome.__nxLikeNotifHooked) {
            NexusHome.__nxLikeNotifHooked = true;
            const origLike = NexusHome.toggleLike.bind(NexusHome);
            NexusHome.toggleLike = function (postId) {
                origLike(postId);
                const me = getMe();
                const p = ((window.Nexus && Nexus.posts) || []).find((x) => x && x.id === postId);
                if (me && p && p.username && Array.isArray(p.likedBy) && p.likedBy.some((u) => normU(u) === normU(me.username))) {
                    if (Nexus.pushRealNotification) {
                        Nexus.pushRealNotification(p.username, "like", "liked your post ❤️:", p.content || p.text || "Photo");
                    }
                }
            };
        }
    }

    window.NexusNotify = {
        push: function (obj) {
            if (window.Nexus && Nexus.pushRealNotification && obj && obj.toUser) {
                Nexus.pushRealNotification(obj.toUser, obj.type || "activity", obj.title || "", obj.body || "");
            } else if (obj) {
                saveAndPopupNotification(Object.assign({ id: "local_" + Date.now() }, obj));
            }
        },
        openDrawer: window.openNotificationDrawer,
        playRing: playNotificationTone,
        updateBadge: updateBellBadgeAndTabTitle
    };

    // Single lightweight boot (Zero CPU spam!)
    setTimeout(() => {
        connectAllNotificationStreams();
        hookHomeLikeNotification();
        updateBellBadgeAndTabTitle();
    }, 350);

    setInterval(() => {
        if (document.visibilityState === "hidden") return;
        connectAllNotificationStreams();
        hookHomeLikeNotification();
        if (window.Nexus && Nexus.openNotifications !== window.openNotificationDrawer) {
            Nexus.openNotifications = window.openNotificationDrawer;
        }
        window.openNexusRealNotificationsModal = window.openNotificationDrawer;
    }, 4500);
})();
// === END OF NOTIFY.JS (v12.0 ULTRA PRO MASTER) ===
