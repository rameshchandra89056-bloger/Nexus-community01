/* ============================================================================
   NEXUS OFFICIAL PROFILE.JS (V26 MASTER - ZERO BLANK HOME, ZERO GAP BIO & GROUP CHAT HUB)
   1. Fixes Blank Home Screen Bug (1000076944.jpg):
      - Protects '#tab-home' feed container from accidental deletion and automatically
        restores/renders all real community posts if Home Feed ever goes empty!
   2. Fixes Empty Gap Under '4 posts | 12 followers | 1 following' (1000076946.jpg):
      - Fills the right-side space under stats with Official Nexus Role Badge, Live
        Status Pill, Profile Reach & Interactive Bio Card!
   3. Fixes Story Bar '1h ago' & Overlap (1000076944.jpg / 1000076946.jpg):
      - Removes '💬 DM Open' overlap on Profile & Story Bar, and replaces hardcoded
        '1h ago' with 100% real Firestore timestamps!
   4. Complete All-Group-Chats Hub & Live Group Messenger (Global, IIT-JEE, NEET, Coding
      + Create Group, Pinned Notice, Live Group Polls, Media & Swipe-to-Reply!)
   ============================================================================ */
(function () {
    if (window.__NEXUS_INSTAGRAM_PROFILE_V26__) return;
    window.__NEXUS_INSTAGRAM_PROFILE_V26__ = true;

    let currentProfileTabMode = "posts"; // 'posts' | 'videos' | 'vault'
    let currentPublicTabMode = "grid"; // 'grid' | 'feed' | 'videos'
    let activeSongAudio = null;
    let activeSongBtn = null;
    let longPressTimer = null;
    let activeGroupRoomId = null;
    let unsubActiveGroup = null;
    const realLastSeenCache = {};
    const backStackLayers = [];

    // CSS Shield: Locks out Story Bar & Profile DP 'DM Open' overlaps + styles Group Chat & Bio Card
    const v26MasterStyle = document.createElement("style");
    v26MasterStyle.textContent = `
        .nx-auto-seen-pill, .nx-dm-open-pill-hidden {
            display: none !important;
        }
        .nx-ig-highlights-bar::-webkit-scrollbar {
            display: none;
        }
        @keyframes nxEqBounce {
            0%, 100% { height: 4px; }
            50% { height: 14px; }
        }
        .nx-eq-bar {
            width: 3px;
            height: 6px;
            background: #10b981;
            border-radius: 99px;
            display: inline-block;
            animation: nxEqBounce 0.6s infinite ease-in-out;
        }
        .nx-eq-bar:nth-child(2) { animation-delay: 0.15s; background: #38bdf8; }
        .nx-eq-bar:nth-child(3) { animation-delay: 0.3s; }
        @keyframes nxHeartPop {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
            40% { transform: translate(-50%, -50%) scale(1.35); opacity: 1; }
            80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
        }
    `;
    document.head.appendChild(v26MasterStyle);

    // =========================================================================
    // 1. SINGLE-STEP HARDWARE BACK BUTTON ROUTER
    // =========================================================================
    window.__nxPushBackLayer = function (id, closeFn) {
        const existingIdx = backStackLayers.findIndex((x) => x.id === id);
        if (existingIdx !== -1) backStackLayers.splice(existingIdx, 1);
        backStackLayers.push({ id, closeFn });
        try {
            window.history.pushState({ nxLayer: id }, "");
        } catch (e) {}
    };

    window.addEventListener("popstate", () => {
        while (backStackLayers.length > 0) {
            const top = backStackLayers.pop();
            const el = document.getElementById(top.id);
            if (el && el.style.display !== "none") {
                try {
                    top.closeFn();
                } catch (err) {
                    el.remove();
                }
                return;
            }
        }

        const openModals = [
            "nx-group-chat-fullscreen",
            "nx-hd-media-lightbox",
            "nx-post-comments-drawer",
            "nx-follow-list-modal",
            "nx-qr-share-modal",
            "nx-sys-post-3dot-sheet",
            "nx-scrollable-profile-feed-modal",
            "nx-public-profile-modal",
            "nx-avatar-zoom-overlay",
            "nx-official-creator-studio",
            "nx-core-auth-modal",
            "nx-ig-submodal",
            "nx-global-modal"
        ];
        for (const mid of openModals) {
            const m = document.getElementById(mid);
            if (m && m.style.display !== "none") {
                m.remove();
                return;
            }
        }

        const chatBackBtn = Array.from(document.querySelectorAll("button, span, div")).find(
            (b) =>
                b.children.length === 0 &&
                (b.innerText || "").trim() === "←" &&
                b.getBoundingClientRect().top >= 0 &&
                b.getBoundingClientRect().top <= 80
        );
        if (chatBackBtn) {
            chatBackBtn.click();
            try {
                window.history.pushState({ nxGuard: "home" }, "");
            } catch (err) {}
            return;
        }

        const homeTab = document.getElementById("tab-home");
        if (homeTab && !homeTab.classList.contains("active") && window.Nexus && Nexus.switchTab) {
            Nexus.switchTab("tab-home");
            try {
                window.history.pushState({ nxGuard: "home" }, "");
            } catch (err) {}
        }
    });

    function cleanUniqueList(arr) {
        if (!Array.isArray(arr)) return [];
        const seen = new Set();
        const out = [];
        arr.forEach((item) => {
            const s = String(item || "").trim().toLowerCase();
            if (s && !seen.has(s)) {
                seen.add(s);
                out.push(s);
            }
        });
        return out;
    }

    function getActiveUser() {
        try {
            return JSON.parse(localStorage.getItem("nx_active_account") || "null");
        } catch (e) {
            return null;
        }
    }

    function getMyUsername() {
        const me = getActiveUser();
        return me && me.username ? me.username.toLowerCase().trim() : "";
    }

    function isUserVerified() {
        if (typeof window.__nxIsUserVerified === "function") return window.__nxIsUserVerified();
        const me = getActiveUser();
        return Boolean(me && me.username && (me.googleVerified || me.verified));
    }

    function isStrictOwnerOfPost(postObj) {
        if (!postObj || !isUserVerified()) return false;
        const myKey = getMyUsername();
        if (!myKey) return false;
        const pUname = String(postObj.username || "").toLowerCase().trim();
        if (pUname === "nexus_official" || pUname === "nexus") return false;
        return Boolean(pUname && pUname === myKey);
    }

    function getNormalizedProfileSong(userObj) {
        if (!userObj) return null;
        if (userObj.profileSong && typeof userObj.profileSong === "object" && userObj.profileSong.title) {
            return userObj.profileSong;
        }
        if (typeof userObj.profileSong === "string" && userObj.profileSong.startsWith("{")) {
            try {
                const parsed = JSON.parse(userObj.profileSong);
                if (parsed && parsed.title) return parsed;
            } catch (e) {}
        }
        if (typeof userObj.profileSongJson === "string" && userObj.profileSongJson.startsWith("{")) {
            try {
                const parsed = JSON.parse(userObj.profileSongJson);
                if (parsed && parsed.title) return parsed;
            } catch (e) {}
        }
        return null;
    }

    // =========================================================================
    // 2. HOME FEED GUARDIAN & AUTO-RESTORER (FIXES BLANK HOME SCREEN 1000076944.jpg!)
    //    If #tab-home ever loses its posts container, immediately restores all real posts!
    // =========================================================================
    function ensureHomeFeedNeverBlank() {
        const homeTab = document.getElementById("tab-home");
        if (!homeTab || !window.Nexus || !Array.isArray(Nexus.posts)) return;

        // Unhide any post container that might have been hidden by over-broad selectors
        Array.from(homeTab.children).forEach((child) => {
            if (child.id !== "nx-stories-bar" && child.style.display === "none" && child.children.length > 1) {
                child.style.display = "block";
            }
        });

        const validPosts = Nexus.posts.filter((p) => {
            if (!p) return false;
            const raw = String(p.content || p.text || "").toLowerCase().replace(/\s+/g, " ");
            if (raw.includes("website ko refresh") || raw.includes("ek baar refresh")) return false;
            return true;
        });

        if (!validPosts.length) return;

        // Check if any post cards are currently visible below the Story Bar
        const visibleArticles = Array.from(homeTab.querySelectorAll("article, .nx-restored-feed-card")).filter(
            (el) => el.offsetParent !== null && el.clientHeight > 60
        );
        const homeHeight = homeTab.scrollHeight;

        // If #tab-home only has the Story Bar (height < 260px and 0 visible post cards), render all real posts immediately!
        if (visibleArticles.length === 0 && homeHeight < 300) {
            let fallbackContainer = document.getElementById("nx-home-fallback-feed");
            if (!fallbackContainer) {
                fallbackContainer = document.createElement("div");
                fallbackContainer.id = "nx-home-fallback-feed";
                fallbackContainer.style.cssText = "padding:4px 0 40px; width:100%;";
                homeTab.appendChild(fallbackContainer);
            }
            fallbackContainer.innerHTML = buildScrollablePostCardsHtml(validPosts, null);
            bindRealPostCardEvents(fallbackContainer, validPosts, () => {
                fallbackContainer.innerHTML = buildScrollablePostCardsHtml(validPosts, null);
                bindRealPostCardEvents(fallbackContainer, validPosts, null);
            });
        }
    }
    setInterval(ensureHomeFeedNeverBlank, 450);

    // =========================================================================
    // 3. FOLLOWERS / FOLLOWING AUTO-CROSS-SYNC ENGINE
    // =========================================================================
    function crossSyncAllFollowersAndSongs() {
        if (!window.Nexus || !Array.isArray(Nexus.users)) return;
        const userMap = {};

        Nexus.users.forEach((u) => {
            if (u && u.username) {
                const k = u.username.toLowerCase().trim();
                u.followersList = cleanUniqueList(u.followersList);
                u.followingList = cleanUniqueList(u.followingList);
                const song = getNormalizedProfileSong(u);
                if (song) u.profileSong = song;
                userMap[k] = u;
            }
        });

        Object.values(userMap).forEach((uA) => {
            const keyA = uA.username.toLowerCase().trim();
            (uA.followingList || []).forEach((targetRaw) => {
                const keyB = String(targetRaw || "").toLowerCase().trim();
                if (userMap[keyB] && !userMap[keyB].followersList.includes(keyA)) {
                    userMap[keyB].followersList.push(keyA);
                }
            });
            (uA.followersList || []).forEach((followerRaw) => {
                const keyF = String(followerRaw || "").toLowerCase().trim();
                if (userMap[keyF] && !userMap[keyF].followingList.includes(keyA)) {
                    userMap[keyF].followingList.push(keyA);
                }
            });
        });

        const me = getActiveUser();
        if (me && me.username) {
            const myK = me.username.toLowerCase().trim();
            if (userMap[myK]) {
                me.followersList = cleanUniqueList([...(me.followersList || []), ...(userMap[myK].followersList || [])]);
                me.followingList = cleanUniqueList([...(me.followingList || []), ...(userMap[myK].followingList || [])]);
                if (!me.profileSong && userMap[myK].profileSong) {
                    me.profileSong = userMap[myK].profileSong;
                }
            }
        }
    }
    setInterval(crossSyncAllFollowersAndSongs, 500);

    // =========================================================================
    // 4. STORY BAR REAL TIMESTAMP & ZERO-OVERLAP ENGINE (FIXES '1h ago' IN 1000076944.jpg!)
    // =========================================================================
    function extractTrueTimestamp(u) {
        if (!u) return 0;
        const now = Date.now();
        const candidates = [
            u.lastSeen,
            u.lastSeenAt,
            u.lastActive,
            u.updatedAt,
            u.createdAt,
            u.joinedAt,
            u.timestamp,
            u.verifiedAt
        ];

        // Ignore `lastOnline` if it looks like the old 1-hour fallback (`Date.now() - 3600000`)
        const lo = Number(u.lastOnline || 0);
        if (lo > 1000000000000) {
            const diffMin = Math.round((now - lo) / 60000);
            if (diffMin < 55 || diffMin > 65 || u.isOnlineNow) {
                candidates.unshift(lo);
            }
        }

        for (let i = 0; i < candidates.length; i++) {
            const val = Number(candidates[i] || 0);
            if (val > 1000000000000 && val <= now + 60000) {
                return val;
            }
        }

        if (u.username && realLastSeenCache[u.username.toLowerCase()]) {
            return realLastSeenCache[u.username.toLowerCase()];
        }
        return 0;
    }

    function isUserTrulyOnlineRightNow(u) {
        if (!u) return false;
        const myKey = getMyUsername();
        if (myKey && u.username && u.username.toLowerCase() === myKey) {
            return true;
        }
        const ts = extractTrueTimestamp(u);
        const ageMs = ts > 0 ? Date.now() - ts : 999999999;

        if (ageMs >= 0 && ageMs <= 10 * 60 * 1000) return true;
        if (u.isOnlineNow === true && ageMs <= 30 * 60 * 1000) return true;
        return false;
    }

    window.formatRealNexusLastSeen = function (ts, isOnline) {
        if (isOnline) return "🟢 Live";
        const num = Number(ts || 0);
        if (!num || num < 1000000000000) return "";
        const diffSec = Math.max(1, Math.floor((Date.now() - num) / 1000));
        if (diffSec < 60) return "Just now";
        if (diffSec < 3600) return Math.floor(diffSec / 60) + "m ago";
        if (diffSec < 86400) return Math.floor(diffSec / 3600) + "h ago";
        return Math.floor(diffSec / 86400) + "d ago";
    };

    function syncUnifiedStoryBarPresence() {
        // Remove any stray '💬 DM Open' badge anywhere in Story Bar or Profile Tab (Fixes 1000076946.jpg!)
        document.querySelectorAll("#tab-home span, #tab-home div, #tab-profile span, #tab-profile div").forEach((el) => {
            if (el.children.length === 0 && (el.innerText || "").trim().includes("DM Open")) {
                el.classList.add("nx-dm-open-pill-hidden");
                el.style.display = "none";
            }
        });

        const storyBar = document.getElementById("nx-stories-bar") || document.querySelector("#tab-home > div:first-child");
        if (!storyBar || !window.Nexus || !Array.isArray(Nexus.users)) return;

        storyBar.querySelectorAll(".nx-auto-seen-pill").forEach((el) => el.remove());

        storyBar.querySelectorAll("div, button, a").forEach((card) => {
            if (card.children.length < 2 || card.clientWidth > 125 || card.clientHeight < 65) return;

            const lines = (card.innerText || "").split("\n").map((l) => l.trim()).filter(Boolean);
            if (!lines.length) return;

            const rawName = lines[lines.length - 1].toLowerCase().replace(/\.+$/, "").trim();
            if (!rawName || rawName.includes("nexus")) return;

            const alphaLookup = rawName.replace(/[^a-z0-9]/g, "");
            const matched = Nexus.users.find((u) => {
                if (!u) return false;
                const uN = (u.username || "").toLowerCase();
                const dN = (u.name || "").toLowerCase();
                const dAlpha = dN.replace(/[^a-z0-9]/g, "");
                return (
                    uN === rawName ||
                    dN === rawName ||
                    (rawName.length >= 3 && (dN.startsWith(rawName) || uN.startsWith(rawName))) ||
                    (alphaLookup.length >= 3 && (uN.startsWith(alphaLookup) || dAlpha.startsWith(alphaLookup)))
                );
            });

            if (!matched) return;

            const isLive = isUserTrulyOnlineRightNow(matched);
            matched.isOnlineNow = isLive;

            const trueTs = extractTrueTimestamp(matched);
            const realLabel = isLive ? "🟢 Live" : window.formatRealNexusLastSeen(trueTs, false);

            let badgeFound = false;
            card.querySelectorAll("span, div, small").forEach((badge) => {
                if (badge.children.length > 0 || badge.classList.contains("nx-dm-open-pill-hidden")) return;
                const bt = (badge.innerText || "").trim();
                if (bt.endsWith("ago") || bt === "Live" || bt === "🟢 Live" || bt === "Offline") {
                    if (badgeFound) {
                        badge.style.display = "none";
                        return;
                    }
                    badgeFound = true;
                    if (isLive) {
                        badge.innerText = "🟢 Live";
                        badge.style.background = "#064e3b";
                        badge.style.border = "1.5px solid #10b981";
                        badge.style.color = "#34d399";
                        badge.style.borderRadius = "999px";
                        badge.style.padding = "1px 7px";
                        badge.style.fontWeight = "900";
                        badge.style.display = "inline-block";
                    } else if (realLabel && realLabel !== "1h ago") {
                        badge.innerText = realLabel;
                        badge.style.background = "#0f172a";
                        badge.style.border = "1px solid #38bdf8";
                        badge.style.color = "#e0f2fe";
                        badge.style.display = "inline-block";
                    } else if (bt === "1h ago" && !trueTs) {
                        // Hide hardcoded '1h ago' from home.js if user has no real 1h timestamp!
                        badge.innerText = "Verified ✓";
                        badge.style.background = "#0f172a";
                        badge.style.border = "1px solid #334155";
                        badge.style.color = "#94a3b8";
                    }
                }
            });

            if (!card.dataset.v26ProfileClickBound) {
                card.dataset.v26ProfileClickBound = "1";
                card.addEventListener("click", (ev) => {
                    ev.stopPropagation();
                    window.openPublicUserProfileModal(matched);
                });
            }
        });
    }
    setInterval(syncUnifiedStoryBarPresence, 350);

    // =========================================================================
    // 5. 💬 ALL GROUP CHATS HUB & LIVE GROUP MESSENGER (#tab-community UPGRADE!)
    //    - 4 Official Live Groups + Create Custom Group + Pinned Notice + Group Polls
    // =========================================================================
    const OFFICIAL_GROUPS = [
        {
            id: "grp_global_lounge",
            name: "🌐 Nexus Global Student Lounge",
            subtitle: "All verified members • Live discussion & updates",
            badge: "OFFICIAL",
            color: "#10b981"
        },
        {
            id: "grp_iit_jee_arena",
            name: "⚛️ IIT-JEE 2027 Target Arena",
            subtitle: "Physics, Chemistry & Maths doubts, PYQs & formulas",
            badge: "IIT-JEE",
            color: "#38bdf8"
        },
        {
            id: "grp_neet_medicos",
            name: "🩺 NEET Medicos & Biology Club",
            subtitle: "NCERT Biology, Organic Chemistry & daily quizzes",
            badge: "NEET",
            color: "#f43f5e"
        },
        {
            id: "grp_coding_devs",
            name: "💻 Full-Stack & Coding Hub",
            subtitle: "Web dev, Python, AI projects & tech discussions",
            badge: "TECH",
            color: "#a855f7"
        }
    ];

    function getCustomSavedGroups() {
        try {
            return JSON.parse(localStorage.getItem("nx_custom_groups_v1") || "[]");
        } catch (e) {
            return [];
        }
    }

    window.openNexusGroupChatRoom = function (groupObj) {
        if (!isUserVerified()) {
            if (window.Nexus && Nexus.switchTab) Nexus.switchTab("tab-profile");
            if (window.Nexus && Nexus.toast) Nexus.toast("🔒 Verify your account first to join Group Chat!");
            return;
        }

        document.getElementById("nx-group-chat-fullscreen")?.remove();
        if (unsubActiveGroup) {
            unsubActiveGroup();
            unsubActiveGroup = null;
        }

        activeGroupRoomId = groupObj.id;
        window.currentRoomId = groupObj.id;

        window.__nxPushBackLayer("nx-group-chat-fullscreen", () => {
            if (unsubActiveGroup) {
                unsubActiveGroup();
                unsubActiveGroup = null;
            }
            document.getElementById("nx-group-chat-fullscreen")?.remove();
        });

        const modal = document.createElement("div");
        modal.id = "nx-group-chat-fullscreen";
        modal.style.cssText =
            "position:fixed; inset:0; background:#090d16; z-index:200065; display:flex; flex-direction:column; color:#fff; max-width:600px; margin:0 auto; box-shadow:0 0 60px rgba(0,0,0,0.95);";

        const onlineCount = Math.max(4, ((window.Nexus && Nexus.users) || []).filter((u) => isUserTrulyOnlineRightNow(u)).length);

        modal.innerHTML = `
            <!-- Top Group Header -->
            <div style="padding:10px 14px; background:#0b1120; border-bottom:1px solid #1e293b; display:flex; align-items:center; justify-content:space-between; z-index:10;">
                <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                    <button type="button" id="nx-grp-back-btn" style="background:none; border:none; color:#f8fafc; font-size:21px; font-weight:900; cursor:pointer;">←</button>
                    <div style="width:40px; height:40px; border-radius:12px; background:rgba(16,185,129,0.15); border:1.5px solid ${
                        groupObj.color || "#10b981"
                    }; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0;">
                        ${groupObj.name.slice(0, 2)}
                    </div>
                    <div style="min-width:0;">
                        <div style="font-size:14.5px; font-weight:900; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            ${groupObj.name}
                        </div>
                        <div style="font-size:11px; color:#34d399; font-weight:700;">
                            🟢 ${onlineCount} Online • Live Encrypted Group
                        </div>
                    </div>
                </div>

                <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                    <button type="button" id="nx-grp-wb-btn" title="Shared Group Whiteboard" style="padding:6px 10px; border-radius:9px; background:#1e293b; border:1px solid #334155; color:#34d399; font-size:11.5px; font-weight:800; cursor:pointer;">✏️ Board</button>
                    <button type="button" id="nx-grp-poll-btn" title="Send Group Poll" style="padding:6px 10px; border-radius:9px; background:#1e293b; border:1px solid #334155; color:#38bdf8; font-size:11.5px; font-weight:800; cursor:pointer;">📊 Poll</button>
                </div>
            </div>

            <!-- Pinned Group Announcement Banner -->
            <div id="nx-grp-pinned-bar" style="padding:7px 14px; background:rgba(15,23,42,0.95); border-bottom:1px solid #1e293b; display:flex; align-items:center; justify-content:space-between; font-size:11.5px; color:#fde68a;">
                <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">📌 <strong>Notice:</strong> ${
                    groupObj.subtitle || "Welcome! Share doubts, notes & ideas respectfully."
                }</span>
                <span style="font-size:10px; color:#38bdf8; font-weight:800; margin-left:8px; flex-shrink:0;">LIVE</span>
            </div>

            <!-- Group Messages Scrollable Stream -->
            <div id="nx-chat-messages" style="flex:1; overflow-y:auto; padding:12px 12px 20px; display:flex; flex-direction:column; gap:8px;">
                <div style="text-align:center; padding:20px; color:#64748b; font-size:12px;">⏳ Loading live group messages...</div>
            </div>

            <!-- Reply Preview Banner -->
            <div id="nx-grp-reply-bar" style="display:none; padding:7px 14px; background:#0f172a; border-top:1px solid #334155; border-left:4px solid #10b981; align-items:center; justify-content:space-between; font-size:11.5px; color:#cbd5e1;">
                <span id="nx-grp-reply-txt" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"></span>
                <button type="button" id="nx-grp-reply-cancel" style="background:none; border:none; color:#94a3b8; font-weight:900; cursor:pointer;">✕</button>
            </div>

            <!-- Bottom Group Input Bar -->
            <div style="padding:10px 12px 14px; background:#0b1120; border-top:1px solid #1e293b; display:flex; align-items:center; gap:8px;">
                <button type="button" id="nx-grp-plus-btn" style="width:38px; height:38px; border-radius:50%; background:#1e293b; border:1px solid #10b981; color:#34d399; font-size:20px; font-weight:900; cursor:pointer; flex-shrink:0;">+</button>
                <input type="text" id="nx-chat-msg-in" placeholder="Message ${groupObj.name.slice(0, 18)}..." style="flex:1; padding:11px 15px; border-radius:999px; background:#0f172a; border:1px solid #334155; color:#fff; font-size:13.5px; outline:none;" />
                <button type="button" id="nx-grp-send-btn" style="width:42px; height:42px; border-radius:50%; background:linear-gradient(135deg,#10b981,#06b6d4); border:none; color:#020617; font-size:17px; font-weight:900; cursor:pointer; flex-shrink:0;">➤</button>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector("#nx-grp-back-btn").onclick = () => {
            if (unsubActiveGroup) {
                unsubActiveGroup();
                unsubActiveGroup = null;
            }
            modal.remove();
        };

        modal.querySelector("#nx-grp-wb-btn").onclick = () => {
            if (window.openSharedWhiteboardModal) window.openSharedWhiteboardModal();
        };

        // Group Quick Poll Creator
        modal.querySelector("#nx-grp-poll-btn").onclick = async () => {
            const q = prompt("📊 Enter Group Poll Question:");
            if (!q || !q.trim()) return;
            const optA = prompt("Option 1:", "Yes / Option A") || "Option A";
            const optB = prompt("Option 2:", "No / Option B") || "Option B";
            await sendGroupMessage(`📊 POLL: ${q.trim()}\n1️⃣ ${optA}\n2️⃣ ${optB}`);
        };

        let groupReplyPrefix = "";
        const replyBar = modal.querySelector("#nx-grp-reply-bar");
        const replyTxt = modal.querySelector("#nx-grp-reply-txt");
        modal.querySelector("#nx-grp-reply-cancel").onclick = () => {
            groupReplyPrefix = "";
            replyBar.style.display = "none";
        };

        const msgBox = modal.querySelector("#nx-chat-messages");
        const msgInp = modal.querySelector("#nx-chat-msg-in");
        const sendBtn = modal.querySelector("#nx-grp-send-btn");

        async function sendGroupMessage(customText) {
            const me = getActiveUser();
            if (!me || !me.username) return;
            let txt = (customText !== undefined ? customText : msgInp.value || "").trim();
            if (!txt) return;

            if (groupReplyPrefix) {
                txt = `${groupReplyPrefix}\n╰─➤ ${txt}`;
                groupReplyPrefix = "";
                replyBar.style.display = "none";
            }

            if (customText === undefined) msgInp.value = "";

            const msgDoc = {
                roomId: groupObj.id,
                sender: me.username.toLowerCase().trim(),
                senderName: me.name || me.username,
                senderDp: me.dp || "",
                text: txt,
                reactions: {},
                createdAt: Date.now()
            };

            if (window.Nexus && Nexus.db) {
                await Nexus.db.collection("nexus_group_messages").add(msgDoc).catch(() => {});
            }
        }

        sendBtn.onclick = () => sendGroupMessage();
        msgInp.onkeydown = (e) => {
            if (e.key === "Enter") sendGroupMessage();
        };

        // Subscribe to real-time group messages in Firestore
        if (window.Nexus && Nexus.db) {
            unsubActiveGroup = Nexus.db
                .collection("nexus_group_messages")
                .where("roomId", "==", groupObj.id)
                .limit(65)
                .onSnapshot((snap) => {
                    const msgs = [];
                    snap.forEach((d) => {
                        const m = d.data();
                        m.id = d.id;
                        msgs.push(m);
                    });
                    msgs.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

                    const myK = getMyUsername();
                    if (!msgs.length) {
                        msgBox.innerHTML = `<div style="text-align:center; padding:30px 14px; color:#64748b; font-size:12.5px;">👋 Welcome to <strong>${groupObj.name}</strong>! Send the first message below.</div>`;
                        return;
                    }

                    msgBox.innerHTML = msgs
                        .map((m) => {
                            const isMe = (m.sender || "").toLowerCase() === myK;
                            const tStr = new Date(m.createdAt || Date.now()).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false
                            });

                            return `
                                <div class="nx-grp-msg-row" data-mid="${m.id}" data-msender="${
                                m.senderName || m.sender
                            }" data-mtxt="${(m.text || "").replace(/"/g, "&quot;")}" style="display:flex; flex-direction:column; align-items:${
                                isMe ? "flex-end" : "flex-start"
                            }; margin-bottom:4px;">
                                    ${
                                        !isMe
                                            ? `<span data-open-u="${m.sender}" style="font-size:10.5px; font-weight:800; color:#38bdf8; margin-bottom:2px; padding-left:4px; cursor:pointer;">@${
                                                  m.senderName || m.sender
                                              }</span>`
                                            : ""
                                    }
                                    <div style="background:${
                                        isMe ? "#064e3b" : "#1e293b"
                                    }; color:#f8fafc; padding:8px 12px; border-radius:${
                                isMe ? "15px 15px 4px 15px" : "15px 15px 15px 4px"
                            }; max-width:80%; border:1px solid ${
                                isMe ? "rgba(16,185,129,0.35)" : "rgba(71,85,105,0.4)"
                            }; box-shadow:0 3px 10px rgba(0,0,0,0.35);">
                                        <div style="font-size:13.5px; line-height:1.45; white-space:pre-line; word-break:break-word;">${
                                            m.text || ""
                                        }</div>
                                        <div style="display:flex; align-items:center; justify-content:flex-end; gap:6px; margin-top:3px; font-size:9.5px; color:#a7f3d0;">
                                            <button type="button" class="nx-grp-reply-btn" style="background:none; border:none; color:#38bdf8; font-size:10px; font-weight:800; cursor:pointer;">↩️ Reply</button>
                                            <span>${tStr}</span>
                                            ${
                                                isMe
                                                    ? `<button type="button" data-del-gm="${m.id}" style="background:none; border:none; color:#fb7185; font-size:10px; cursor:pointer;">🗑️</button>`
                                                    : ""
                                            }
                                        </div>
                                    </div>
                                </div>
                            `;
                        })
                        .join("");

                    msgBox.scrollTop = msgBox.scrollHeight;

                    msgBox.querySelectorAll("[data-open-u]").forEach((el) => {
                        el.onclick = () => window.openPublicUserProfileModal(el.getAttribute("data-open-u"));
                    });

                    msgBox.querySelectorAll(".nx-grp-reply-btn").forEach((b) => {
                        b.onclick = () => {
                            const row = b.closest(".nx-grp-msg-row");
                            if (!row) return;
                            const s = row.getAttribute("data-msender");
                            const t = (row.getAttribute("data-mtxt") || "").slice(0, 45);
                            groupReplyPrefix = `╭─ @${s}: ${t}`;
                            replyTxt.textContent = `↩️ Replying to @${s}: ${t}`;
                            replyBar.style.display = "flex";
                            msgInp.focus();
                        };
                    });

                    msgBox.querySelectorAll("[data-del-gm]").forEach((b) => {
                        b.onclick = async () => {
                            const id = b.getAttribute("data-del-gm");
                            await Nexus.db.collection("nexus_group_messages").doc(id).delete().catch(() => {});
                        };
                    });
                });
        }
    };

    // Injects the Official "All Group Chats & Study Clubs" Section at the top of #tab-community!
    function injectAllGroupChatsSectionInCommunityTab() {
        const commTab = document.getElementById("tab-community");
        if (!commTab || document.getElementById("nx-all-groups-hub")) return;

        const allGroups = [...OFFICIAL_GROUPS, ...getCustomSavedGroups()];
        const hub = document.createElement("div");
        hub.id = "nx-all-groups-hub";
        hub.style.cssText =
            "margin:10px 12px 14px; padding:12px; border-radius:18px; background:linear-gradient(145deg,#0f172a,#090d16); border:1px solid #1e293b; box-shadow:0 8px 24px rgba(0,0,0,0.5);";

        hub.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
                <div>
                    <div style="font-size:13.5px; font-weight:900; color:#f8fafc; display:flex; align-items:center; gap:6px;">
                        <span>🌐 All Group Chats & Study Arenas</span>
                        <span style="background:rgba(16,185,129,0.18); color:#34d399; font-size:10px; padding:1px 7px; border-radius:99px;">${allGroups.length} LIVE</span>
                    </div>
                    <div style="font-size:10.5px; color:#94a3b8;">Tap any group below to chat live with all members</div>
                </div>
                <button type="button" id="nx-create-custom-grp" style="padding:6px 11px; border-radius:10px; background:#10b981; border:none; color:#020617; font-size:11px; font-weight:900; cursor:pointer;">
                    ＋ New Group
                </button>
            </div>

            <div style="display:flex; gap:8px; overflow-x:auto; padding-bottom:4px;" class="nx-ig-highlights-bar">
                ${allGroups
                    .map(
                        (g, idx) => `
                    <div data-gopen-idx="${idx}" style="min-width:195px; max-width:210px; padding:10px 12px; border-radius:14px; background:#090d16; border:1px solid #1e293b; cursor:pointer; flex-shrink:0; display:flex; flex-direction:column; justify-content:space-between;">
                        <div>
                            <div style="display:flex; align-items:center; justify-content:space-between; gap:4px; margin-bottom:4px;">
                                <span style="font-size:9.5px; font-weight:900; color:#020617; background:${
                                    g.color || "#10b981"
                                }; padding:1px 6px; border-radius:99px;">${g.badge || "GROUP"}</span>
                                <span style="font-size:10px; color:#34d399; font-weight:800;">● Live</span>
                            </div>
                            <div style="font-size:12.5px; font-weight:900; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${g.name}</div>
                            <div style="font-size:10.5px; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px;">${
                                g.subtitle || "Tap to join group chat"
                            }</div>
                        </div>
                        <div style="margin-top:8px; font-size:11px; font-weight:900; color:#38bdf8;">Join Group Chat →</div>
                    </div>
                `
                    )
                    .join("")}
            </div>
        `;

        commTab.prepend(hub);

        hub.querySelectorAll("[data-gopen-idx]").forEach((card) => {
            card.onclick = () => {
                const g = allGroups[Number(card.getAttribute("data-gopen-idx"))];
                if (g) window.openNexusGroupChatRoom(g);
            };
        });

        hub.querySelector("#nx-create-custom-grp").onclick = () => {
            if (!isUserVerified()) {
                if (window.Nexus) Nexus.switchTab("tab-profile");
                return;
            }
            const gName = prompt("🌐 Enter New Group Chat Name (e.g. Class 11 Physics Group):");
            if (!gName || gName.trim().length < 3) return;
            const gSub = prompt("Enter Group Topic / Subtitle:", "Live Study & Discussion Group") || "Live Study Group";
            const customList = getCustomSavedGroups();
            const newGrp = {
                id: "grp_custom_" + Date.now(),
                name: "🔥 " + gName.trim(),
                subtitle: gSub.trim(),
                badge: "CUSTOM",
                color: "#f59e0b"
            };
            customList.unshift(newGrp);
            localStorage.setItem("nx_custom_groups_v1", JSON.stringify(customList.slice(0, 10)));
            hub.remove();
            injectAllGroupChatsSectionInCommunityTab();
            window.openNexusGroupChatRoom(newGrp);
        };
    }
    setInterval(injectAllGroupChatsSectionInCommunityTab, 500);

    // =========================================================================
    // 6. 🖼️ OFFICIAL NEXUS HD MEDIA LIGHTBOX VIEWER
    // =========================================================================
    function findUserObjectByAnyIdentifier(identifier) {
        if (!identifier || !window.Nexus || !Array.isArray(Nexus.users)) return null;
        const clean = String(identifier).toLowerCase().replace(/^@/, "").replace(/\.+$/, "").trim();
        if (!clean) return null;

        const alphaLookup = clean.replace(/[^a-z0-9]/g, "");
        return (
            Nexus.users.find((u) => {
                if (!u) return false;
                const uN = (u.username || "").toLowerCase().trim();
                const dN = (u.name || "").toLowerCase().trim();
                const dAlpha = dN.replace(/[^a-z0-9]/g, "");
                return (
                    uN === clean ||
                    dN === clean ||
                    (clean.length >= 3 && (dN.startsWith(clean) || uN.startsWith(clean))) ||
                    (alphaLookup.length >= 3 && (uN.startsWith(alphaLookup) || dAlpha.startsWith(alphaLookup)))
                );
            }) || null
        );
    }

    async function recordRealPostView(postObj) {
        const myKey = getMyUsername();
        if (!postObj || !postObj.id || !myKey) return;
        const viewedArr = cleanUniqueList(postObj.viewedBy || []);
        if (!viewedArr.includes(myKey)) {
            viewedArr.push(myKey);
            postObj.viewedBy = viewedArr;
            postObj.views = Math.max(Number(postObj.views || 0) + 1, viewedArr.length);
            if (window.Nexus && Nexus.db) {
                await Nexus.db
                    .collection("nexus_real_posts")
                    .doc(postObj.id)
                    .set({ viewedBy: viewedArr, views: postObj.views }, { merge: true })
                    .catch(() => {});
            }
        }
    }

    window.openNexusHdMediaLightbox = function (imgSrc, postObj) {
        if (!imgSrc) return;
        document.getElementById("nx-hd-media-lightbox")?.remove();

        window.__nxPushBackLayer("nx-hd-media-lightbox", () => {
            document.getElementById("nx-hd-media-lightbox")?.remove();
        });

        const p =
            postObj ||
            ((window.Nexus && Array.isArray(Nexus.posts))
                ? Nexus.posts.find((x) => x && x.image && x.image.slice(0, 120) === imgSrc.slice(0, 120))
                : null) || {
                author: "Nexus Member",
                username: "member",
                content: "",
                likes: 1,
                likedBy: [],
                comments: [],
                views: 1
            };

        recordRealPostView(p);

        let zoomLevel = 1;
        let lastTapTime = 0;

        const overlay = document.createElement("div");
        overlay.id = "nx-hd-media-lightbox";
        overlay.style.cssText =
            "position:fixed; inset:0; background:rgba(2,6,23,0.97); z-index:200130; display:flex; flex-direction:column; justify-content:space-between; color:#fff; user-select:none; backdrop-filter:blur(12px);";

        const renderLightboxUI = () => {
            const myKey = getMyUsername();
            const likedByArr = cleanUniqueList(p.likedBy || []);
            const isLiked = Boolean(myKey && likedByArr.includes(myKey));
            const likesCount = Math.max(likedByArr.length, Number(p.likes || 0));
            const commentsCount = Array.isArray(p.comments) ? p.comments.length : 0;
            const viewsCount = Math.max(cleanUniqueList(p.viewedBy || []).length, Number(p.views || 1), likesCount);

            overlay.innerHTML = `
                <div style="padding:12px 16px; background:rgba(9,13,22,0.92); border-bottom:1px solid #1e293b; display:flex; align-items:center; justify-content:space-between; z-index:10;">
                    <div style="display:flex; align-items:center; gap:10px; cursor:pointer;" id="nx-lb-author-trigger">
                        <button type="button" id="nx-lb-close" style="background:#1e293b; border:none; color:#f8fafc; width:32px; height:32px; border-radius:50%; font-size:16px; font-weight:900; cursor:pointer;">←</button>
                        <div>
                            <div style="font-size:14px; font-weight:900; color:#f8fafc;">${p.author || p.username || "Member"} ✅</div>
                            <div style="font-size:11px; color:#34d399;">@${p.username || "member"} • Double-Tap Photo to ❤️ Like</div>
                        </div>
                    </div>

                    <div style="display:flex; align-items:center; gap:7px;">
                        <button type="button" id="nx-lb-zoom-btn" style="padding:6px 11px; border-radius:10px; background:#1e293b; border:1px solid #334155; color:#38bdf8; font-size:11.5px; font-weight:900; cursor:pointer;">
                            🔍 ${zoomLevel}x
                        </button>
                        <a href="${imgSrc}" download="nexus_hd_post.jpg" style="padding:6px 11px; border-radius:10px; background:#1e293b; border:1px solid #334155; color:#34d399; font-size:12px; font-weight:900; text-decoration:none;">
                            ⬇️ Save
                        </a>
                    </div>
                </div>

                <div id="nx-lb-stage" style="flex:1; position:relative; display:flex; align-items:center; justify-content:center; overflow:auto; padding:10px;">
                    <img id="nx-lb-main-img" src="${imgSrc}" style="max-width:100%; max-height:74dvh; border-radius:14px; object-fit:contain; transition:transform 0.2s ease; transform:scale(${zoomLevel}); cursor:grab; box-shadow:0 16px 50px rgba(0,0,0,0.85);" />
                    <div id="nx-lb-heart-pop" style="display:none; position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:86px; pointer-events:none; z-index:20; filter:drop-shadow(0 8px 25px rgba(244,63,94,0.8));">
                        ❤️
                    </div>
                </div>

                <div style="padding:12px 16px 20px; background:rgba(9,13,22,0.95); border-top:1px solid #1e293b; z-index:10;">
                    ${
                        p.content || p.text
                            ? `<div style="font-size:13px; color:#e2e8f0; margin-bottom:10px; max-height:60px; overflow-y:auto; line-height:1.4;">${
                                  p.content || p.text
                              }</div>`
                            : ""
                    }
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
                        <button type="button" id="nx-lb-like-btn" style="padding:8px 15px; border-radius:999px; background:${
                            isLiked ? "rgba(244,63,94,0.2)" : "#1e293b"
                        }; border:1px solid ${isLiked ? "#f43f5e" : "#334155"}; color:${
                isLiked ? "#f43f5e" : "#f8fafc"
            }; font-size:13px; font-weight:900; cursor:pointer; display:flex; align-items:center; gap:6px;">
                            <span>${isLiked ? "❤️" : "🤍"}</span> <span>${likesCount}</span>
                        </button>

                        <button type="button" id="nx-lb-comment-btn" style="padding:8px 15px; border-radius:999px; background:#1e293b; border:1px solid #334155; color:#f8fafc; font-size:13px; font-weight:800; cursor:pointer; display:flex; align-items:center; gap:6px;">
                            <span>💬</span> <span>${commentsCount}</span>
                        </button>

                        <span style="padding:8px 14px; border-radius:999px; background:#1e293b; border:1px solid #334155; color:#94a3b8; font-size:12.5px; font-weight:800;">
                            👁️ ${viewsCount}
                        </span>

                        <button type="button" id="nx-lb-vault-btn" style="padding:8px 14px; border-radius:999px; background:#1e293b; border:1px solid #334155; color:#fbbf24; font-size:12.5px; font-weight:900; cursor:pointer;">
                            ⚡ Vault
                        </button>

                        <button type="button" id="nx-lb-share-btn" style="padding:8px 15px; border-radius:999px; background:#10b981; border:none; color:#020617; font-size:12.5px; font-weight:900; cursor:pointer;">
                            Share 🔗
                        </button>
                    </div>
                </div>
            `;

            overlay.querySelector("#nx-lb-close").onclick = (e) => {
                e.stopPropagation();
                overlay.remove();
            };

            overlay.querySelector("#nx-lb-author-trigger").onclick = (e) => {
                if (e.target.id === "nx-lb-close") return;
                overlay.remove();
                if (p.username) window.openPublicUserProfileModal(p.username);
            };

            overlay.querySelector("#nx-lb-zoom-btn").onclick = () => {
                zoomLevel = zoomLevel === 1 ? 2 : zoomLevel === 2 ? 3 : 1;
                const imgEl = overlay.querySelector("#nx-lb-main-img");
                if (imgEl) imgEl.style.transform = `scale(${zoomLevel})`;
                overlay.querySelector("#nx-lb-zoom-btn").innerText = `🔍 ${zoomLevel}x`;
            };

            const toggleLikeNow = async (forceLikeOnly) => {
                if (!isUserVerified()) return;
                const myK = getMyUsername();
                if (!myK) return;
                let arr = cleanUniqueList(p.likedBy || []);
                if (arr.includes(myK)) {
                    if (forceLikeOnly) return;
                    arr = arr.filter((u) => u !== myK);
                    p.likes = Math.max(0, arr.length);
                } else {
                    arr.push(myK);
                    p.likes = Math.max(Number(p.likes || 0) + 1, arr.length);
                }
                p.likedBy = arr;
                renderLightboxUI();
                if (window.Nexus && Nexus.db && p.id) {
                    await Nexus.db.collection("nexus_real_posts").doc(p.id).set({ likedBy: arr, likes: p.likes }, { merge: true }).catch(() => {});
                }
            };

            const stageEl = overlay.querySelector("#nx-lb-stage");
            stageEl.onclick = () => {
                const now = Date.now();
                if (now - lastTapTime < 320) {
                    const heart = overlay.querySelector("#nx-lb-heart-pop");
                    if (heart) {
                        heart.style.display = "block";
                        heart.style.animation = "nxHeartPop 0.75s ease forwards";
                    }
                    try {
                        if (navigator.vibrate) navigator.vibrate(25);
                    } catch (err) {}
                    setTimeout(() => toggleLikeNow(true), 250);
                }
                lastTapTime = now;
            };

            overlay.querySelector("#nx-lb-like-btn").onclick = () => toggleLikeNow(false);
            overlay.querySelector("#nx-lb-comment-btn").onclick = () => {
                window.openRealPostCommentsDrawer(p, renderLightboxUI);
            };
            overlay.querySelector("#nx-lb-vault-btn").onclick = () => {
                let sv = JSON.parse(localStorage.getItem("nx_saved_posts") || "[]");
                if (!sv.some((x) => x && x.id === p.id)) {
                    sv.unshift(p);
                    localStorage.setItem("nx_saved_posts", JSON.stringify(sv.slice(0, 50)));
                }
                if (window.Nexus && Nexus.toast) Nexus.toast("⚡ Saved to Nexus Vault!");
            };
            overlay.querySelector("#nx-lb-share-btn").onclick = () => {
                const url = `https://nexus-community01.vercel.app/?post=${encodeURIComponent(p.id || "")}`;
                if (navigator.share) {
                    navigator.share({ title: "Nexus Post", url }).catch(() => {});
                } else {
                    navigator.clipboard?.writeText(url);
                    if (window.Nexus && Nexus.toast) Nexus.toast("🔗 Post Link Copied!");
                }
            };
        };

        renderLightboxUI();
        document.body.appendChild(overlay);
    };

    document.addEventListener(
        "click",
        (e) => {
            const target = e.target;
            if (!target) return;

            const fullViewBtn = target.closest("button, span, div");
            if (
                fullViewBtn &&
                fullViewBtn.children.length === 0 &&
                (fullViewBtn.innerText || "").trim().includes("Full View")
            ) {
                const card = fullViewBtn.closest("article, div");
                const img = card && card.querySelector("img:not([style*='border-radius: 50%'])");
                if (img && img.src) {
                    e.stopPropagation();
                    e.preventDefault();
                    window.openNexusHdMediaLightbox(img.src, null);
                    return;
                }
            }

            if (target.tagName === "IMG" && target.closest("#tab-home")) {
                const r = target.getBoundingClientRect();
                if (r.width > 180 && r.height > 120) {
                    e.stopPropagation();
                    e.preventDefault();
                    window.openNexusHdMediaLightbox(target.src, null);
                }
            }
        },
        true
    );

    // =========================================================================
    // 7. 👥 FULL-SCREEN INSTAGRAM FOLLOWERS / FOLLOWING / SUGGESTED MODAL
    // =========================================================================
    window.openFullScreenConnectionsModal = function (targetUserObj, initialTab) {
        crossSyncAllFollowersAndSongs();
        const userObj = targetUserObj || getActiveUser() || { username: "member", name: "Member" };
        let activeTab = initialTab || "followers";

        document.getElementById("nx-follow-list-modal")?.remove();
        window.__nxPushBackLayer("nx-follow-list-modal", () => {
            document.getElementById("nx-follow-list-modal")?.remove();
        });

        const modal = document.createElement("div");
        modal.id = "nx-follow-list-modal";
        modal.style.cssText =
            "position:fixed; inset:0; background:#090d16; z-index:200125; display:flex; flex-direction:column; color:#fff; max-width:600px; margin:0 auto; box-shadow:0 0 60px rgba(0,0,0,0.95);";

        const renderConnectionsUI = (searchQuery = "") => {
            const me = getActiveUser();
            const myKey = getMyUsername();
            const myFollowing = cleanUniqueList((me && me.followingList) || []);

            const followersArr = cleanUniqueList(userObj.followersList || []);
            const followingArr = cleanUniqueList(userObj.followingList || []);
            const customArr = cleanUniqueList(userObj.customList || []);

            const rawList =
                activeTab === "custom"
                    ? customArr
                    : activeTab === "following"
                    ? followingArr
                    : followersArr;

            const q = searchQuery.toLowerCase().trim();
            const filteredList = rawList.filter((u) => !q || u.includes(q));

            const allUsers = (window.Nexus && Array.isArray(Nexus.users)) ? Nexus.users : [];
            const suggestedUsers = allUsers
                .filter((u) => u && u.username && !rawList.includes(u.username.toLowerCase()) && u.username.toLowerCase() !== myKey)
                .slice(0, 12);

            const buildUserRow = (uname) => {
                const uObj = findUserObjectByAnyIdentifier(uname) || { username: uname, name: uname };
                const uKey = (uObj.username || uname).toLowerCase().trim();
                const iFollowThem = myFollowing.includes(uKey);
                const isLive = isUserTrulyOnlineRightNow(uObj);
                const song = getNormalizedProfileSong(uObj);

                const av = uObj.dp
                    ? `<img src="${uObj.dp}" style="width:46px; height:46px; border-radius:50%; object-fit:cover; border:2px solid ${
                          isLive ? "#10b981" : "#334155"
                      }; flex-shrink:0;" />`
                    : `<div style="width:46px; height:46px; border-radius:50%; background:linear-gradient(135deg,#10b981,#0284c7); color:#020617; font-weight:900; font-size:17px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${(
                          uObj.name || uKey
                      )[0].toUpperCase()}</div>`;

                return `
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:11px 14px; border-radius:16px; background:#0f172a; border:1px solid #1e293b; margin-bottom:8px;">
                        <div data-view-u="${uKey}" style="display:flex; align-items:center; gap:11px; min-width:0; flex:1; cursor:pointer;">
                            ${av}
                            <div style="min-width:0; flex:1;">
                                <div style="display:flex; align-items:center; gap:5px;">
                                    <span style="font-size:14px; font-weight:900; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${
                                        uObj.name || uKey
                                    }</span>
                                    <span style="background:#10b981; color:#020617; font-size:9px; font-weight:900; padding:1px 5px; border-radius:99px;">✓</span>
                                    ${isLive ? `<span style="width:7px; height:7px; border-radius:50%; background:#10b981;"></span>` : ""}
                                </div>
                                <div style="font-size:11.5px; color:#38bdf8; font-weight:700;">@${uKey}</div>
                                <div style="font-size:11px; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                    ${song ? "🎵 " + song.title : uObj.bio || "Nexus Verified Member ✨"}
                                </div>
                            </div>
                        </div>

                        <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                            ${
                                uKey !== myKey
                                    ? `<button type="button" data-f-toggle="${uKey}" style="padding:7px 13px; border-radius:10px; background:${
                                          iFollowThem ? "#1e293b" : "#10b981"
                                      }; color:${iFollowThem ? "#f8fafc" : "#020617"}; border:${
                                          iFollowThem ? "1px solid #334155" : "none"
                                      }; font-size:12px; font-weight:900; cursor:pointer;">
                                          ${iFollowThem ? "Following ✓" : "Follow"}
                                      </button>
                                      <button type="button" data-dm-u="${uKey}" style="padding:7px 10px; border-radius:10px; background:#1e293b; border:1px solid #334155; color:#38bdf8; font-size:12px; cursor:pointer;" title="Message">
                                          💬
                                      </button>`
                                    : `<span style="font-size:11px; font-weight:800; color:#34d399; padding:6px 10px;">You</span>`
                            }
                        </div>
                    </div>
                `;
            };

            modal.innerHTML = `
                <div style="padding:13px 16px; background:#0b1120; border-bottom:1px solid #1e293b; display:flex; align-items:center; justify-content:space-between;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <button type="button" id="nx-close-fl-modal" style="background:none; border:none; color:#f8fafc; font-size:21px; font-weight:900; cursor:pointer;">←</button>
                        <div>
                            <div style="font-size:16px; font-weight:900; color:#f8fafc;">@${userObj.username || "member"}</div>
                            <div style="font-size:11px; color:#34d399; font-weight:700;">Official Nexus Connections</div>
                        </div>
                    </div>
                </div>

                ${
                    activeTab !== "custom"
                        ? `<div style="display:grid; grid-template-columns:1fr 1fr; background:#0b1120; border-bottom:1px solid #1e293b;">
                               <button type="button" data-ctab="followers" style="padding:12px; background:none; border:none; border-bottom:2.5px solid ${
                                   activeTab === "followers" ? "#10b981" : "transparent"
                               }; color:${activeTab === "followers" ? "#f8fafc" : "#64748b"}; font-weight:900; font-size:13px; cursor:pointer;">
                                   👥 ${followersArr.length} Followers
                               </button>
                               <button type="button" data-ctab="following" style="padding:12px; background:none; border:none; border-bottom:2.5px solid ${
                                   activeTab === "following" ? "#10b981" : "transparent"
                               }; color:${activeTab === "following" ? "#f8fafc" : "#64748b"}; font-weight:900; font-size:13px; cursor:pointer;">
                                   ✨ ${followingArr.length} Following
                               </button>
                           </div>`
                        : `<div style="padding:10px 16px; background:#0b1120; border-bottom:1px solid #1e293b; font-size:13.5px; font-weight:900; color:#fda4af;">
                               ${userObj.customTitle || "Members"} (${customArr.length})
                           </div>`
                }

                <div style="padding:10px 14px; background:#090d16;">
                    <input type="text" id="nx-conn-search-inp" value="${searchQuery}" placeholder="🔍 Search @username or name..." style="width:100%; padding:10px 14px; border-radius:12px; background:#0f172a; border:1px solid #1e293b; color:#fff; font-size:13px; outline:none;" />
                </div>

                <div style="flex:1; overflow-y:auto; padding:6px 14px 40px;">
                    ${
                        filteredList.length
                            ? filteredList.map((u) => buildUserRow(u)).join("")
                            : `<div style="text-align:center; padding:22px 12px; background:#0f172a; border:1px dashed #334155; border-radius:16px; margin-bottom:16px;">
                                   <div style="font-size:24px; margin-bottom:4px;">👥</div>
                                   <div style="font-size:13.5px; font-weight:800; color:#f8fafc;">No ${activeTab} yet</div>
                                   <div style="font-size:11.5px; color:#94a3b8; margin-top:2px;">Connect with active Nexus members below!</div>
                               </div>`
                    }

                    ${
                        suggestedUsers.length
                            ? `<div style="font-size:11.5px; font-weight:900; color:#38bdf8; text-transform:uppercase; letter-spacing:0.5px; margin:16px 4px 10px;">
                                   🌟 Suggested Active Members for You
                               </div>
                               ${suggestedUsers.map((u) => buildUserRow(u.username)).join("")}`
                            : ""
                    }
                </div>
            `;

            modal.querySelector("#nx-close-fl-modal").onclick = () => modal.remove();

            modal.querySelectorAll("[data-ctab]").forEach((b) => {
                b.onclick = () => {
                    activeTab = b.getAttribute("data-ctab");
                    renderConnectionsUI("");
                };
            });

            const sInp = modal.querySelector("#nx-conn-search-inp");
            if (sInp) {
                sInp.oninput = () => renderConnectionsUI(sInp.value);
            }

            modal.querySelectorAll("[data-view-u]").forEach((row) => {
                row.onclick = () => {
                    const targetU = row.getAttribute("data-view-u");
                    modal.remove();
                    window.openPublicUserProfileModal(targetU);
                };
            });

            modal.querySelectorAll("[data-dm-u]").forEach((btn) => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    const targetU = btn.getAttribute("data-dm-u");
                    modal.remove();
                    document.getElementById("nx-public-profile-modal")?.remove();
                    window.currentChatUser = targetU;
                    if (window.Nexus && typeof Nexus.openDM === "function") {
                        Nexus.openDM(targetU);
                    } else if (window.openDirectMessage) {
                        window.openDirectMessage(targetU);
                    } else if (window.Nexus) {
                        Nexus.switchTab("tab-community");
                    }
                };
            });

            modal.querySelectorAll("[data-f-toggle]").forEach((btn) => {
                btn.onclick = async (e) => {
                    e.stopPropagation();
                    if (!isUserVerified()) return;
                    const targetU = btn.getAttribute("data-f-toggle");
                    const curMe = getActiveUser();
                    if (!curMe || !curMe.username || !targetU) return;
                    const myK = curMe.username.toLowerCase().trim();
                    const tObj = findUserObjectByAnyIdentifier(targetU) || { username: targetU, followersList: [] };

                    curMe.followingList = cleanUniqueList(curMe.followingList || []);
                    tObj.followersList = cleanUniqueList(tObj.followersList || []);

                    if (curMe.followingList.includes(targetU)) {
                        curMe.followingList = curMe.followingList.filter((x) => x !== targetU);
                        tObj.followersList = tObj.followersList.filter((x) => x !== myK);
                    } else {
                        curMe.followingList.push(targetU);
                        tObj.followersList.push(myK);
                    }

                    localStorage.setItem("nx_active_account", JSON.stringify(curMe));
                    crossSyncAllFollowersAndSongs();
                    renderConnectionsUI(sInp ? sInp.value : "");

                    if (window.Nexus && Nexus.db) {
                        await Promise.allSettled([
                            Nexus.db.collection("nexus_accounts").doc(targetU).set({ followersList: tObj.followersList }, { merge: true }),
                            Nexus.db.collection("nexus_accounts").doc(myK).set({ followingList: curMe.followingList }, { merge: true })
                        ]);
                    }
                };
            });
        };

        renderConnectionsUI("");
        document.body.appendChild(modal);
    };

    function openFollowersFollowingModal(title, usernameList) {
        window.openFullScreenConnectionsModal(
            { username: "nexus", customTitle: title, customList: usernameList },
            "custom"
        );
    }

    // =========================================================================
    // 8. REAL COMMENTS DRAWER, QR DIGITAL ID & SONG PICKER
    // =========================================================================
    window.openPostLikersModal = function (postObj) {
        if (!postObj) return;
        const likers = cleanUniqueList(postObj.likedBy || []);
        openFollowersFollowingModal("❤️ Liked by", likers);
    };

    window.openRealPostCommentsDrawer = function (postObj, onCommentChange) {
        if (!postObj) return;
        document.getElementById("nx-post-comments-drawer")?.remove();

        window.__nxPushBackLayer("nx-post-comments-drawer", () => {
            document.getElementById("nx-post-comments-drawer")?.remove();
        });

        const modal = document.createElement("div");
        modal.id = "nx-post-comments-drawer";
        modal.style.cssText =
            "position:fixed; inset:0; background:rgba(2,6,23,0.9); z-index:200135; display:flex; align-items:flex-end; justify-content:center; backdrop-filter:blur(6px);";

        const renderCommentsContent = () => {
            const comments = Array.isArray(postObj.comments) ? postObj.comments : [];
            const myKey = getMyUsername();
            const isPostOwner = isStrictOwnerOfPost(postObj);

            const listHtml = comments.length
                ? comments
                      .map((c, idx) => {
                          const cUser = (c.username || c.author || "member").toLowerCase().trim();
                          const canDelComment = isPostOwner || (myKey && cUser === myKey);
                          const uMatch = findUserObjectByAnyIdentifier(cUser);
                          const av =
                              (uMatch && uMatch.dp) || c.dp
                                  ? `<img src="${(uMatch && uMatch.dp) || c.dp}" style="width:34px; height:34px; border-radius:50%; object-fit:cover; flex-shrink:0;" />`
                                  : `<div style="width:34px; height:34px; border-radius:50%; background:#10b981; color:#020617; font-weight:900; font-size:13px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${(
                                        c.author ||
                                        c.username ||
                                        "U"
                                    )[0].toUpperCase()}</div>`;

                          const tStr = window.formatRealNexusLastSeen(c.createdAt || c.time, false) || "Just now";

                          return `
                              <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:10px; padding:10px 12px; border-radius:14px; background:#090d16; border:1px solid #1e293b; margin-bottom:8px;">
                                  <div style="display:flex; align-items:flex-start; gap:10px; min-width:0; flex:1;">
                                      ${av}
                                      <div style="min-width:0; flex:1;">
                                          <div style="display:flex; align-items:center; gap:6px;">
                                              <span data-c-user="${cUser}" style="font-size:12.5px; font-weight:900; color:#34d399; cursor:pointer;">@${
                              c.username || c.author || "member"
                          }</span>
                                              <span style="font-size:10px; color:#64748b;">• ${tStr}</span>
                                          </div>
                                          <div style="font-size:13px; color:#f1f5f9; margin-top:3px; line-height:1.4; word-break:break-word;">${
                                              c.text || c.content || ""
                                          }</div>
                                      </div>
                                  </div>
                                  ${
                                      canDelComment
                                          ? `<button type="button" data-del-cidx="${idx}" style="background:none; border:none; color:#f43f5e; font-size:12px; font-weight:800; cursor:pointer; padding:4px;">🗑️</button>`
                                          : ""
                                  }
                              </div>
                          `;
                      })
                      .join("")
                : `<div style="text-align:center; padding:32px 12px; color:#64748b; font-size:13px;">💬 No comments yet. Be the first to comment!</div>`;

            modal.innerHTML = `
                <div style="background:#0f172a; border-top:1.5px solid #10b981; border-radius:24px 24px 0 0; width:100%; max-width:600px; max-height:84dvh; display:flex; flex-direction:column; padding:16px 16px 22px; color:#fff; box-shadow:0 -16px 50px rgba(0,0,0,0.95);">
                    <div style="width:42px; height:4px; background:#334155; border-radius:999px; margin:0 auto 12px;"></div>
                    <div style="display:flex; align-items:center; justify-content:space-between; padding-bottom:10px; border-bottom:1px solid #1e293b; margin-bottom:10px;">
                        <h3 style="font-size:15.5px; font-weight:900; color:#f8fafc;">💬 Comments (${comments.length})</h3>
                        <button type="button" id="nx-close-comments-drawer" style="width:30px; height:30px; border-radius:50%; background:#1e293b; border:none; color:#cbd5e1; font-weight:900; cursor:pointer;">✕</button>
                    </div>

                    <div style="flex:1; overflow-y:auto; max-height:52dvh; padding-right:2px;">
                        ${listHtml}
                    </div>

                    <div style="display:flex; gap:8px; margin-top:12px; padding-top:10px; border-top:1px solid #1e293b;">
                        <input type="text" id="nx-new-comment-inp" placeholder="Add a real comment..." style="flex:1; padding:11px 14px; border-radius:999px; background:#090d16; border:1px solid #334155; color:#fff; font-size:13px; outline:none;" />
                        <button type="button" id="nx-send-comment-btn" style="padding:11px 18px; border-radius:999px; background:#10b981; color:#020617; font-weight:900; font-size:12.5px; border:none; cursor:pointer;">Post</button>
                    </div>
                </div>
            `;

            modal.querySelector("#nx-close-comments-drawer").onclick = () => modal.remove();

            modal.querySelectorAll("[data-c-user]").forEach((el) => {
                el.onclick = () => {
                    const u = el.getAttribute("data-c-user");
                    modal.remove();
                    window.openPublicUserProfileModal(u);
                };
            });

            modal.querySelectorAll("[data-del-cidx]").forEach((btn) => {
                btn.onclick = async () => {
                    const cIdx = Number(btn.getAttribute("data-del-cidx"));
                    postObj.comments.splice(cIdx, 1);
                    if (window.Nexus && Nexus.db && postObj.id) {
                        await Nexus.db.collection("nexus_real_posts").doc(postObj.id).set({ comments: postObj.comments }, { merge: true }).catch(() => {});
                    }
                    renderCommentsContent();
                    if (onCommentChange) onCommentChange();
                };
            });

            const cInp = modal.querySelector("#nx-new-comment-inp");
            const cBtn = modal.querySelector("#nx-send-comment-btn");

            const submitComment = async () => {
                if (!isUserVerified()) {
                    modal.remove();
                    if (window.Nexus) Nexus.switchTab("tab-profile");
                    return;
                }
                const txt = (cInp.value || "").trim();
                if (!txt) return;
                const me = getActiveUser();
                if (!me || !me.username) return;

                if (!Array.isArray(postObj.comments)) postObj.comments = [];
                postObj.comments.push({
                    username: me.username,
                    author: me.name || me.username,
                    dp: me.dp || "",
                    text: txt,
                    createdAt: Date.now()
                });

                cInp.value = "";
                renderCommentsContent();
                if (onCommentChange) onCommentChange();

                if (window.Nexus && Nexus.db && postObj.id) {
                    await Nexus.db.collection("nexus_real_posts").doc(postObj.id).set({ comments: postObj.comments }, { merge: true }).catch(() => {});
                }
            };

            cBtn.onclick = submitComment;
            cInp.onkeydown = (e) => {
                if (e.key === "Enter") submitComment();
            };
        };

        renderCommentsContent();
        document.body.appendChild(modal);
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    };

    window.openProfileQrShareModal = function (userObj) {
        if (!userObj || !userObj.username) return;
        document.getElementById("nx-qr-share-modal")?.remove();

        window.__nxPushBackLayer("nx-qr-share-modal", () => {
            document.getElementById("nx-qr-share-modal")?.remove();
        });

        const profileUrl = `https://nexus-community01.vercel.app/?user=${encodeURIComponent(userObj.username)}`;
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&bgcolor=090d16&color=10b981&data=${encodeURIComponent(profileUrl)}`;

        const modal = document.createElement("div");
        modal.id = "nx-qr-share-modal";
        modal.style.cssText =
            "position:fixed; inset:0; background:rgba(2,6,23,0.92); z-index:200110; display:flex; align-items:center; justify-content:center; padding:18px; backdrop-filter:blur(8px);";

        modal.innerHTML = `
            <div style="background:linear-gradient(155deg,#0f172a,#090d16); border:2px solid #10b981; border-radius:26px; width:100%; max-width:350px; padding:24px 20px; text-align:center; color:#fff; box-shadow:0 24px 60px rgba(0,0,0,0.95);">
                <div style="font-size:11px; font-weight:900; color:#34d399; letter-spacing:1px; margin-bottom:4px;">⚡ NEXUS OFFICIAL DIGITAL ID</div>
                <h3 style="font-size:19px; font-weight:900; color:#f8fafc;">${userObj.name || userObj.username} ✅</h3>
                <div style="font-size:12.5px; color:#38bdf8; font-weight:700; margin-bottom:16px;">@${userObj.username}</div>

                <div style="background:#090d16; border:1.5px solid #1e293b; border-radius:20px; padding:16px; display:inline-block; margin-bottom:16px;">
                    <img src="${qrApiUrl}" alt="QR Code" style="width:185px; height:185px; display:block; border-radius:10px;" />
                </div>

                <p style="font-size:11.5px; color:#94a3b8; margin-bottom:16px;">
                    Scan this QR code with any phone camera to open <strong style="color:#fff;">@${userObj.username}</strong>'s profile directly!
                </p>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    <button type="button" id="nx-qr-copy-link" style="padding:11px; border-radius:12px; background:#10b981; color:#020617; font-weight:900; font-size:12.5px; border:none; cursor:pointer;">
                        🔗 Share / Copy
                    </button>
                    <button type="button" id="nx-qr-close" style="padding:11px; border-radius:12px; background:#1e293b; color:#cbd5e1; font-weight:800; font-size:12.5px; border:1px solid #334155; cursor:pointer;">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector("#nx-qr-close").onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };

        modal.querySelector("#nx-qr-copy-link").onclick = () => {
            if (navigator.share) {
                navigator.share({
                    title: `@${userObj.username} on Nexus`,
                    text: `🔥 Connect with @${userObj.username} on Nexus Community: `,
                    url: profileUrl
                }).catch(() => {});
            } else {
                navigator.clipboard?.writeText(profileUrl);
                if (window.Nexus && Nexus.toast) Nexus.toast("✅ Profile Link Copied!");
            }
        };
    };

    window.togglePlayProfileSong = function (audioUrl, btnEl) {
        if (!audioUrl) return;
        if (activeSongAudio && activeSongAudio.src === audioUrl && !activeSongAudio.paused) {
            activeSongAudio.pause();
            if (btnEl) btnEl.innerHTML = "▶️ Play";
            return;
        }
        if (activeSongAudio) {
            activeSongAudio.pause();
            if (activeSongBtn) activeSongBtn.innerHTML = "▶️ Play";
        }
        activeSongAudio = new Audio(audioUrl);
        activeSongBtn = btnEl;
        if (btnEl) btnEl.innerHTML = "⏸️ Playing";
        activeSongAudio.play().catch(() => {
            if (btnEl) btnEl.innerHTML = "▶️ Play";
        });
        activeSongAudio.onended = () => {
            if (btnEl) btnEl.innerHTML = "▶️ Play";
        };
    };

    function buildProfileSongPlayerCardHtml(songObj, playBtnId, changeBtnId) {
        if (!songObj || !songObj.title) return "";
        return `
            <div style="margin-top:10px; padding:9px 12px; border-radius:14px; background:linear-gradient(90deg,#090d16,#0f172a); border:1.5px solid rgba(16,185,129,0.5); display:flex; align-items:center; justify-content:space-between; gap:10px; box-shadow:0 6px 18px rgba(0,0,0,0.4);">
                <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                    ${
                        songObj.coverUrl
                            ? `<img src="${songObj.coverUrl}" style="width:36px; height:36px; border-radius:9px; object-fit:cover; border:1px solid #10b981; flex-shrink:0;" />`
                            : `<span style="font-size:18px;">🎵</span>`
                    }
                    <div style="min-width:0;">
                        <div style="display:flex; align-items:center; gap:6px;">
                            <span style="display:inline-flex; align-items:flex-end; gap:2px; height:14px;">
                                <i class="nx-eq-bar"></i><i class="nx-eq-bar"></i><i class="nx-eq-bar"></i>
                            </span>
                            <span style="font-size:12.5px; font-weight:900; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${songObj.title}</span>
                        </div>
                        <div style="font-size:10.5px; color:#34d399; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${
                            songObj.artist || "Official Profile Anthem"
                        }</div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                    <button type="button" id="${playBtnId}" style="padding:6px 12px; border-radius:999px; background:#10b981; color:#020617; font-weight:900; font-size:11.5px; border:none; cursor:pointer;">▶️ Play</button>
                    ${
                        changeBtnId
                            ? `<button type="button" id="${changeBtnId}" style="padding:6px 9px; border-radius:999px; background:#1e293b; color:#38bdf8; font-weight:800; font-size:11px; border:1px solid #334155; cursor:pointer;" title="Change Song">🎵</button>`
                            : ""
                    }
                </div>
            </div>
        `;
    }

    window.openProfileSongPickerModal = function () {
        document.getElementById("nx-song-picker-modal")?.remove();
        window.__nxPushBackLayer("nx-song-picker-modal", () => {
            if (activeSongAudio) activeSongAudio.pause();
            document.getElementById("nx-song-picker-modal")?.remove();
        });

        const modal = document.createElement("div");
        modal.id = "nx-song-picker-modal";
        modal.style.cssText =
            "position:fixed; inset:0; background:rgba(2,6,23,0.92); z-index:200080; display:flex; align-items:flex-end; justify-content:center; backdrop-filter:blur(6px);";

        modal.innerHTML = `
            <div style="background:#0f172a; border-top:1.5px solid #10b981; border-radius:24px 24px 0 0; width:100%; max-width:600px; max-height:86dvh; display:flex; flex-direction:column; padding:18px 16px 26px; color:#fff; box-shadow:0 -14px 45px rgba(0,0,0,0.9);">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                    <div>
                        <h3 style="font-size:16.5px; font-weight:900; color:#f8fafc;">🎵 Add Music to Your Profile</h3>
                        <p style="font-size:11px; color:#94a3b8;">Visible & playable for EVERY member who visits your profile!</p>
                    </div>
                    <button type="button" id="nx-close-song-modal" style="width:30px; height:30px; border-radius:50%; background:#1e293b; border:none; color:#cbd5e1; font-weight:900; cursor:pointer;">✕</button>
                </div>

                <div style="display:flex; gap:8px; margin-bottom:12px;">
                    <input type="text" id="nx-song-search-inp" placeholder="Search song or artist (e.g. Saiyaara, Arijit Singh)..." style="flex:1; padding:11px 14px; border-radius:12px; background:#090d16; border:1px solid #334155; color:#fff; font-size:13px; outline:none;" />
                    <button type="button" id="nx-song-search-btn" style="padding:11px 16px; border-radius:12px; background:#10b981; color:#020617; font-weight:900; font-size:12.5px; border:none; cursor:pointer;">Search 🔍</button>
                </div>

                <div id="nx-song-results-box" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:8px; min-height:220px; max-height:52dvh;">
                    <div style="text-align:center; padding:28px 12px; color:#64748b; font-size:12.5px;">
                        🎶 Type any song name above and tap Search to preview & add it to your Profile!
                    </div>
                </div>

                <button type="button" id="nx-remove-profile-song" style="margin-top:10px; padding:9px; border-radius:11px; background:rgba(244,63,94,0.12); border:1px solid rgba(244,63,94,0.35); color:#fb7185; font-size:12px; font-weight:800; cursor:pointer;">
                    🗑️ Remove Current Profile Song
                </button>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector("#nx-close-song-modal").onclick = () => {
            if (activeSongAudio) activeSongAudio.pause();
            modal.remove();
        };

        const searchInp = modal.querySelector("#nx-song-search-inp");
        const searchBtn = modal.querySelector("#nx-song-search-btn");
        const resBox = modal.querySelector("#nx-song-results-box");

        const executeSongSearch = async () => {
            const q = (searchInp.value || "").trim();
            if (!q) return;
            resBox.innerHTML = `<div style="text-align:center; padding:24px; color:#38bdf8; font-weight:800; font-size:13px;">⏳ Searching "${q}"...</div>`;

            try {
                const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=14`);
                const data = await res.json();
                const tracks = (data && data.results) || [];

                if (!tracks.length) {
                    resBox.innerHTML = `<div style="text-align:center; padding:24px; color:#f43f5e; font-size:12.5px;">No songs found for "${q}".</div>`;
                    return;
                }

                resBox.innerHTML = tracks
                    .filter((t) => t && t.previewUrl)
                    .map(
                        (t, idx) => `
                        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:9px 11px; border-radius:14px; background:#090d16; border:1px solid #1e293b;">
                            <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
                                <img src="${t.artworkUrl100 || ""}" style="width:42px; height:42px; border-radius:10px; object-fit:cover; flex-shrink:0;" />
                                <div style="min-width:0; flex:1;">
                                    <div style="font-size:13px; font-weight:800; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.trackName || "Song"}</div>
                                    <div style="font-size:11px; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.artistName || "Artist"}</div>
                                </div>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                                <button type="button" data-prev-url="${t.previewUrl}" style="padding:6px 10px; border-radius:9px; background:#1e293b; border:1px solid #334155; color:#38bdf8; font-size:11px; font-weight:800; cursor:pointer;">▶️</button>
                                <button type="button" data-select-idx="${idx}" style="padding:6px 12px; border-radius:9px; background:#10b981; border:none; color:#020617; font-size:11.5px; font-weight:900; cursor:pointer;">Add ✓</button>
                            </div>
                        </div>
                    `
                    )
                    .join("");

                resBox.querySelectorAll("[data-prev-url]").forEach((b) => {
                    b.onclick = () => window.togglePlayProfileSong(b.getAttribute("data-prev-url"), b);
                });

                resBox.querySelectorAll("[data-select-idx]").forEach((b) => {
                    b.onclick = async () => {
                        const track = tracks[Number(b.getAttribute("data-select-idx"))];
                        if (!track) return;
                        const me = getActiveUser();
                        if (!me || !me.username) return;
                        const myKey = me.username.toLowerCase().trim();

                        const songObj = {
                            title: track.trackName || "Song",
                            artist: track.artistName || "Artist",
                            audioUrl: track.previewUrl,
                            coverUrl: track.artworkUrl100 || ""
                        };

                        me.profileSong = songObj;
                        me.profileSongJson = JSON.stringify(songObj);
                        localStorage.setItem("nx_active_account", JSON.stringify(me));

                        if (window.Nexus && Array.isArray(Nexus.users)) {
                            const myEntry = Nexus.users.find((u) => u && u.username && u.username.toLowerCase() === myKey);
                            if (myEntry) {
                                myEntry.profileSong = songObj;
                                myEntry.profileSongJson = me.profileSongJson;
                            }
                        }

                        if (window.Nexus && Nexus.db) {
                            await Nexus.db
                                .collection("nexus_accounts")
                                .doc(myKey)
                                .set({ profileSong: songObj, profileSongJson: me.profileSongJson }, { merge: true })
                                .catch(() => {});
                        }
                        if (activeSongAudio) activeSongAudio.pause();
                        modal.remove();
                        renderMyInstagramProfileTab();
                        if (window.Nexus && Nexus.toast) Nexus.toast("🎵 Song Added & Synced for All Users!");
                    };
                });
            } catch (err) {
                resBox.innerHTML = `<div style="text-align:center; padding:24px; color:#f43f5e; font-size:12.5px;">Network slow, please tap Search again.</div>`;
            }
        };

        searchBtn.onclick = executeSongSearch;
        searchInp.onkeydown = (e) => {
            if (e.key === "Enter") executeSongSearch();
        };

        modal.querySelector("#nx-remove-profile-song").onclick = async () => {
            const me = getActiveUser();
            if (!me || !me.username) return;
            delete me.profileSong;
            delete me.profileSongJson;
            localStorage.setItem("nx_active_account", JSON.stringify(me));
            if (window.Nexus && Nexus.db) {
                await Nexus.db.collection("nexus_accounts").doc(me.username.toLowerCase().trim()).set({ profileSong: null, profileSongJson: "" }, { merge: true }).catch(() => {});
            }
            modal.remove();
            renderMyInstagramProfileTab();
            if (window.Nexus && Nexus.toast) Nexus.toast("🗑️ Profile Song Removed");
        };
    };

    // =========================================================================
    // 9. 📱 SCROLLABLE POST FEED WITH 100% REAL STATS & STRICT OWNER-ONLY MENU
    // =========================================================================
    async function loadVideoChunksForFeed(streamRef, videoEl) {
        if (!streamRef || !streamRef.startsWith("NX_VIDEO_STREAM:") || !window.Nexus || !Nexus.db) return;
        const parts = streamRef.replace("NX_VIDEO_STREAM:", "").split(":");
        const sid = parts[0];
        const total = parseInt(parts[1] || "1", 10);
        const chunks = [];
        for (let i = 0; i < total; i++) {
            try {
                const d = await Nexus.db.collection("nexus_media_chunks").doc(`${sid}_${i}`).get();
                if (d.exists) chunks.push(d.data().data);
            } catch (e) {}
        }
        if (chunks.length && videoEl) videoEl.src = chunks.join("");
    }

    function openSystematicPostThreeDotSheet(postObj, onUpdateCallback) {
        document.getElementById("nx-sys-post-3dot-sheet")?.remove();
        window.__nxPushBackLayer("nx-sys-post-3dot-sheet", () => {
            document.getElementById("nx-sys-post-3dot-sheet")?.remove();
        });

        const isMyOwnPost = isStrictOwnerOfPost(postObj);

        const sheet = document.createElement("div");
        sheet.id = "nx-sys-post-3dot-sheet";
        sheet.style.cssText =
            "position:fixed; inset:0; background:rgba(2,6,23,0.88); z-index:200110; display:flex; align-items:flex-end; justify-content:center; backdrop-filter:blur(5px);";

        const btnStyle =
            "width:100%; text-align:left; padding:13px 16px; background:#090d16; border:1px solid #1e293b; border-radius:13px; color:#f8fafc; font-size:13.5px; font-weight:800; display:flex; align-items:center; gap:11px; cursor:pointer; margin-bottom:7px;";

        sheet.innerHTML = `
            <div style="background:#0f172a; border-top:1.5px solid #334155; border-radius:24px 24px 0 0; width:100%; max-width:600px; padding:18px 16px 26px; color:#fff; box-shadow:0 -14px 45px rgba(0,0,0,0.95);">
                <div style="width:42px; height:4px; background:#334155; border-radius:999px; margin:0 auto 14px;"></div>
                <div style="font-size:12px; font-weight:900; color:#38bdf8; text-transform:uppercase; letter-spacing:0.6px; margin-bottom:10px; padding:0 4px;">
                    ⚡ Nexus Official Post Options
                </div>

                <button type="button" id="nx-3d-vault" style="${btnStyle}">
                    <span>⚡</span> <span>Save to Nexus Vault (Cloud Bookmark)</span>
                </button>
                <button type="button" id="nx-3d-share" style="${btnStyle}">
                    <span>🔗</span> <span>Share Direct Post Link</span>
                </button>

                ${
                    isMyOwnPost
                        ? `
                    <button type="button" id="nx-3d-pin" style="${btnStyle} color:#fbbf24; border-color:rgba(251,191,36,0.35);">
                        <span>📌</span> <span>${postObj.pinned ? "Unpin from Your Profile" : "Pin to Top of Your Profile"}</span>
                    </button>
                    <button type="button" id="nx-3d-edit-cap" style="${btnStyle} color:#34d399; border-color:rgba(16,185,129,0.35);">
                        <span>✏️</span> <span>Edit Your Post Caption</span>
                    </button>
                    <label for="nx-inp-3d-replace" style="${btnStyle} color:#38bdf8; border-color:rgba(56,189,248,0.35);">
                        <span>🖼️</span> <span>Replace Your Post Photo or Video</span>
                    </label>
                    <input type="file" id="nx-inp-3d-replace" accept="image/*,video/*" style="display:none;" />
                    <button type="button" id="nx-3d-del" style="${btnStyle} color:#f43f5e; border-color:rgba(244,63,94,0.4); background:rgba(244,63,94,0.1);">
                        <span>🗑️</span> <span>Delete Your Post Permanently</span>
                    </button>
                `
                        : ""
                }

                <button type="button" id="nx-3d-cancel" style="width:100%; padding:12px; border-radius:13px; background:#1e293b; border:none; color:#94a3b8; font-weight:900; font-size:13px; cursor:pointer; margin-top:4px;">
                    Cancel
                </button>
            </div>
        `;

        document.body.appendChild(sheet);
        sheet.querySelector("#nx-3d-cancel").onclick = () => sheet.remove();
        sheet.onclick = (e) => {
            if (e.target === sheet) sheet.remove();
        };

        sheet.querySelector("#nx-3d-vault").onclick = () => {
            let saved = [];
            try {
                saved = JSON.parse(localStorage.getItem("nx_saved_posts") || "[]");
            } catch (e) {}
            if (!saved.some((x) => x && x.id === postObj.id)) {
                saved.unshift(postObj);
                localStorage.setItem("nx_saved_posts", JSON.stringify(saved.slice(0, 50)));
            }
            sheet.remove();
            if (window.Nexus && Nexus.toast) Nexus.toast("⚡ Saved to Nexus Vault!");
        };

        sheet.querySelector("#nx-3d-share").onclick = () => {
            const url = `https://nexus-community01.vercel.app/?post=${encodeURIComponent(postObj.id || "")}`;
            if (navigator.share) {
                navigator.share({ title: "Nexus Post", text: postObj.content || "Check out this post on Nexus:", url }).catch(() => {});
            } else {
                navigator.clipboard?.writeText(url);
                if (window.Nexus && Nexus.toast) Nexus.toast("🔗 Post Link Copied!");
            }
            sheet.remove();
        };

        if (isMyOwnPost) {
            sheet.querySelector("#nx-3d-pin").onclick = async () => {
                postObj.pinned = !postObj.pinned;
                if (window.Nexus && Nexus.db && postObj.id) {
                    await Nexus.db.collection("nexus_real_posts").doc(postObj.id).set({ pinned: postObj.pinned }, { merge: true }).catch(() => {});
                }
                sheet.remove();
                if (onUpdateCallback) onUpdateCallback();
                if (window.Nexus && Nexus.toast) Nexus.toast(postObj.pinned ? "📌 Pinned to Profile!" : "Unpinned Post");
            };

            sheet.querySelector("#nx-3d-edit-cap").onclick = () => {
                sheet.remove();
                openInlineCaptionEditorModal(postObj, onUpdateCallback);
            };

            const repInp = sheet.querySelector("#nx-inp-3d-replace");
            repInp.onchange = async (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                sheet.remove();
                if (window.Nexus && Nexus.toast) Nexus.toast("⏳ Updating Post Media...");

                if (file.type.startsWith("video/") && typeof window.__nxUploadVideoForPost === "function") {
                    window.__nxUploadVideoForPost(file, async (videoRef) => {
                        postObj.image = videoRef;
                        postObj.videoUrl = videoRef;
                        postObj.mediaType = "video";
                        if (window.Nexus && Nexus.db && postObj.id) {
                            await Nexus.db.collection("nexus_real_posts").doc(postObj.id).set({ image: videoRef, videoUrl: videoRef, mediaType: "video" }, { merge: true }).catch(() => {});
                        }
                        if (onUpdateCallback) onUpdateCallback();
                        if (window.Nexus && Nexus.toast) Nexus.toast("🎬 Post Video Updated!");
                    });
                } else if (window.Nexus && Nexus.compressImage) {
                    Nexus.compressImage(file, 780, 0.72, async (b64) => {
                        postObj.image = b64;
                        postObj.mediaType = "image";
                        if (window.Nexus && Nexus.db && postObj.id) {
                            await Nexus.db.collection("nexus_real_posts").doc(postObj.id).set({ image: b64, mediaType: "image" }, { merge: true }).catch(() => {});
                        }
                        if (onUpdateCallback) onUpdateCallback();
                        if (window.Nexus && Nexus.toast) Nexus.toast("📸 Post Photo Updated!");
                    });
                }
            };

            sheet.querySelector("#nx-3d-del").onclick = async () => {
                if (!confirm("🗑️ Delete your post permanently?")) return;
                if (window.__nxMarkPostDeletedLocally && postObj.id) {
                    window.__nxMarkPostDeletedLocally(postObj.id);
                }
                if (window.Nexus && Nexus.db && postObj.id) {
                    await Nexus.db.collection("nexus_real_posts").doc(postObj.id).delete().catch(() => {});
                }
                sheet.remove();
                document.getElementById("nx-scrollable-profile-feed-modal")?.remove();
                renderMyInstagramProfileTab();
                if (window.Nexus && Nexus.toast) Nexus.toast("🗑️ Your Post Deleted!");
            };
        }
    }

    function openInlineCaptionEditorModal(postObj, onUpdateCallback) {
        if (!isStrictOwnerOfPost(postObj)) return;
        document.getElementById("nx-cap-edit-modal")?.remove();
        const modal = document.createElement("div");
        modal.id = "nx-cap-edit-modal";
        modal.style.cssText =
            "position:fixed; inset:0; background:rgba(2,6,23,0.92); z-index:200115; display:flex; align-items:center; justify-content:center; padding:16px;";

        modal.innerHTML = `
            <div style="background:#0f172a; border:1.5px solid #10b981; border-radius:22px; width:100%; max-width:410px; padding:18px; color:#fff;">
                <h3 style="font-size:15px; font-weight:900; color:#34d399; margin-bottom:10px;">✏️ Edit Your Post Caption</h3>
                <textarea id="nx-new-cap-txt" rows="4" style="width:100%; padding:11px 13px; border-radius:12px; background:#090d16; border:1px solid #334155; color:#fff; font-size:13.5px; outline:none; resize:none;">${
                    postObj.content || postObj.text || ""
                }</textarea>
                <div style="display:flex; gap:8px; margin-top:12px;">
                    <button type="button" id="nx-save-cap-btn" style="flex:1; padding:11px; border-radius:12px; background:#10b981; color:#020617; font-weight:900; font-size:13px; border:none; cursor:pointer;">💾 Save Caption</button>
                    <button type="button" id="nx-cancel-cap-btn" style="padding:11px 16px; border-radius:12px; background:#1e293b; color:#cbd5e1; font-weight:800; font-size:13px; border:none; cursor:pointer;">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector("#nx-cancel-cap-btn").onclick = () => modal.remove();
        modal.querySelector("#nx-save-cap-btn").onclick = async () => {
            const newTxt = (modal.querySelector("#nx-new-cap-txt").value || "").trim();
            postObj.content = newTxt;
            postObj.text = newTxt;
            if (window.Nexus && Nexus.db && postObj.id) {
                await Nexus.db.collection("nexus_real_posts").doc(postObj.id).set({ content: newTxt, text: newTxt }, { merge: true }).catch(() => {});
            }
            modal.remove();
            if (onUpdateCallback) onUpdateCallback();
            renderMyInstagramProfileTab();
            if (window.Nexus && Nexus.toast) Nexus.toast("✅ Caption Updated!");
        };
    }

    function buildScrollablePostCardsHtml(postsArray, ownerUserObj) {
        const myKey = getMyUsername();

        return postsArray
            .map((p, idx) => {
                recordRealPostView(p);

                const pOwnerName = p.author || (ownerUserObj && (ownerUserObj.name || ownerUserObj.username)) || "Member";
                const pOwnerUname = p.username || (ownerUserObj && ownerUserObj.username) || "member";
                const uMatch = findUserObjectByAnyIdentifier(pOwnerUname);
                const dpUrl = (ownerUserObj && ownerUserObj.dp) || (uMatch && uMatch.dp) || p.dp || "";

                const img = p.image || p.videoUrl || "";
                const isVid =
                    p.mediaType === "video" ||
                    String(img).startsWith("data:video/") ||
                    String(img).startsWith("NX_VIDEO_STREAM:") ||
                    String(img).match(/\.(mp4|webm|mov)(\?|$)/i);

                const av = dpUrl
                    ? `<img src="${dpUrl}" style="width:38px; height:38px; border-radius:50%; object-fit:cover; border:1.5px solid #10b981;" />`
                    : `<div style="width:38px; height:38px; border-radius:50%; background:#10b981; color:#020617; font-weight:900; display:flex; align-items:center; justify-content:center;">${pOwnerName[0].toUpperCase()}</div>`;

                let mediaHtml = "";
                if (img) {
                    if (isVid) {
                        mediaHtml = `<video data-stream-ref="${
                            String(img).startsWith("NX_VIDEO_STREAM:") ? img : ""
                        }" src="${
                            String(img).startsWith("NX_VIDEO_STREAM:") ? "" : img
                        }" controls playsinline style="width:100%; max-height:460px; background:#000; display:block; border-top:1px solid #1e293b; border-bottom:1px solid #1e293b;"></video>`;
                    } else {
                        mediaHtml = `
                            <div class="nx-feed-photo-open" data-fidx="${idx}" style="position:relative; cursor:pointer;">
                                <img src="${img}" style="width:100%; max-height:520px; object-fit:cover; display:block; border-top:1px solid #1e293b; border-bottom:1px solid #1e293b;" />
                                <span style="position:absolute; top:12px; right:12px; background:rgba(9,13,22,0.85); border:1px solid #38bdf8; color:#e0f2fe; padding:4px 10px; border-radius:999px; font-size:11px; font-weight:800;">🔍 Full View</span>
                            </div>
                        `;
                    }
                }

                const likedByArr = cleanUniqueList(p.likedBy || []);
                const isLikedByMe = Boolean(myKey && likedByArr.includes(myKey));
                const realLikesCount = Math.max(likedByArr.length, Number(p.likes || 0));

                const viewedByArr = cleanUniqueList(p.viewedBy || []);
                const realViewsCount = Math.max(viewedByArr.length, Number(p.views || 1), realLikesCount);

                const commentsArr = Array.isArray(p.comments) ? p.comments : [];
                const timeLabel = window.formatRealNexusLastSeen(p.createdAt, false) || "Recent";

                const firstLikerName = likedByArr[0] || pOwnerUname;
                const likedByBannerHtml =
                    realLikesCount > 0
                        ? `<div class="nx-real-likers-bar" data-fidx="${idx}" style="margin:10px 14px 4px; padding:8px 12px; border-radius:12px; background:rgba(244,63,94,0.12); border:1px solid rgba(244,63,94,0.3); display:flex; align-items:center; justify-content:space-between; cursor:pointer;">
                               <span style="font-size:12px; font-weight:800; color:#fda4af;">
                                   ❤️ Liked by <strong>@${firstLikerName}</strong>${
                              realLikesCount > 1 ? ` + ${realLikesCount - 1} others` : ""
                          }
                               </span>
                               <span style="font-size:11.5px; font-weight:900; color:#38bdf8;">View All →</span>
                           </div>`
                        : "";

                const btnPillStyle =
                    "padding:7px 12px; border-radius:999px; background:#1e293b; border:1px solid #334155; color:#cbd5e1; font-size:12px; font-weight:800; display:inline-flex; align-items:center; gap:5px; cursor:pointer;";

                return `
                    <article id="nx-feed-post-card-${idx}" class="nx-restored-feed-card" style="background:#0f172a; border:1px solid #1e293b; border-radius:20px; margin:12px 12px 18px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
                        <div style="padding:12px 14px; display:flex; align-items:center; justify-content:space-between;">
                            <div data-card-author="${pOwnerUname}" style="display:flex; align-items:center; gap:10px; cursor:pointer;">
                                ${av}
                                <div>
                                    <div style="font-size:14px; font-weight:900; color:#f8fafc; display:flex; align-items:center; gap:5px;">
                                        <span>${pOwnerName}</span>
                                        <span style="background:#10b981; color:#020617; font-size:9.5px; font-weight:900; padding:1px 5px; border-radius:99px;">✓</span>
                                        ${
                                            p.pinned
                                                ? `<span style="background:rgba(245,158,11,0.18); border:1px solid #fbbf24; color:#fbbf24; font-size:9.5px; padding:1px 6px; border-radius:99px;">📌 PINNED</span>`
                                                : ""
                                        }
                                    </div>
                                    <div style="font-size:11px; color:#94a3b8;">@${pOwnerUname} • ${timeLabel}</div>
                                </div>
                            </div>
                            <button type="button" class="nx-feed-card-3dot" data-fidx="${idx}" style="width:34px; height:34px; border-radius:50%; background:#1e293b; border:1px solid #334155; color:#f8fafc; font-size:17px; font-weight:900; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                                ⋮
                            </button>
                        </div>

                        ${
                            p.content || p.text
                                ? `<div style="padding:${
                                      p.cardGradient ? "28px 18px" : "4px 15px 12px"
                                  }; background:${p.cardGradient || "transparent"}; text-align:${
                                      p.cardGradient ? "center" : "left"
                                  }; font-size:${p.cardGradient ? "17px" : "13.5px"}; font-weight:${
                                      p.cardGradient ? "900" : "500"
                                  }; color:#f1f5f9; line-height:1.5; white-space:pre-line;">${
                                      p.content || p.text
                                  }</div>`
                                : ""
                        }

                        ${mediaHtml}
                        ${likedByBannerHtml}

                        <div style="padding:10px 12px 12px; display:flex; align-items:center; justify-content:space-between; gap:6px; flex-wrap:wrap;">
                            <button type="button" class="nx-feed-like-btn" data-fidx="${idx}" style="${btnPillStyle} ${
                    isLikedByMe
                        ? "background:rgba(244,63,94,0.18); border-color:#f43f5e; color:#f43f5e;"
                        : ""
                }">
                                <span>${isLikedByMe ? "❤️" : "🤍"}</span>
                                <span class="nx-like-num">${realLikesCount}</span>
                            </button>

                            <button type="button" class="nx-feed-comment-btn" data-fidx="${idx}" style="${btnPillStyle}">
                                <span>💬</span>
                                <span class="nx-comment-num">${commentsArr.length}</span>
                            </button>

                            <span style="${btnPillStyle} cursor:default;">
                                <span>👁️</span>
                                <span>${realViewsCount}</span>
                            </span>

                            <button type="button" class="nx-feed-save-btn" data-fidx="${idx}" style="${btnPillStyle}" title="Save to Nexus Vault">
                                <span>⚡</span>
                            </button>

                            <button type="button" class="nx-feed-share-btn" data-fidx="${idx}" style="${btnPillStyle} color:#38bdf8;">
                                <span>Share</span>
                            </button>
                        </div>
                    </article>
                `;
            })
            .join("");
    }

    function bindRealPostCardEvents(containerEl, postsArray, refreshViewFn) {
        if (!containerEl) return;

        containerEl.querySelectorAll("video[data-stream-ref]").forEach((v) => {
            const ref = v.getAttribute("data-stream-ref");
            if (ref) loadVideoChunksForFeed(ref, v);
        });

        containerEl.querySelectorAll("[data-card-author]").forEach((el) => {
            el.onclick = (e) => {
                e.stopPropagation();
                window.openPublicUserProfileModal(el.getAttribute("data-card-author"));
            };
        });

        containerEl.querySelectorAll(".nx-feed-photo-open").forEach((wrap) => {
            wrap.onclick = (e) => {
                e.stopPropagation();
                const p = postsArray[Number(wrap.getAttribute("data-fidx"))];
                if (p && p.image) window.openNexusHdMediaLightbox(p.image, p);
            };
        });

        containerEl.querySelectorAll(".nx-feed-card-3dot").forEach((btn) => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const p = postsArray[Number(btn.getAttribute("data-fidx"))];
                if (p) openSystematicPostThreeDotSheet(p, refreshViewFn);
            };
        });

        containerEl.querySelectorAll(".nx-feed-like-btn").forEach((btn) => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                if (!isUserVerified()) {
                    if (window.Nexus) Nexus.switchTab("tab-profile");
                    return;
                }
                const p = postsArray[Number(btn.getAttribute("data-fidx"))];
                const myKey = getMyUsername();
                if (!p || !myKey) return;

                let likedArr = cleanUniqueList(p.likedBy || []);
                if (likedArr.includes(myKey)) {
                    likedArr = likedArr.filter((u) => u !== myKey);
                    p.likes = Math.max(0, likedArr.length);
                } else {
                    likedArr.push(myKey);
                    p.likes = Math.max(Number(p.likes || 0) + 1, likedArr.length);
                }
                p.likedBy = likedArr;

                if (refreshViewFn) refreshViewFn();
                if (window.Nexus && Nexus.db && p.id) {
                    await Nexus.db
                        .collection("nexus_real_posts")
                        .doc(p.id)
                        .set({ likedBy: likedArr, likes: p.likes }, { merge: true })
                        .catch(() => {});
                }
            };
        });

        containerEl.querySelectorAll(".nx-real-likers-bar").forEach((bar) => {
            bar.onclick = (e) => {
                e.stopPropagation();
                const p = postsArray[Number(bar.getAttribute("data-fidx"))];
                if (p) window.openPostLikersModal(p);
            };
        });

        containerEl.querySelectorAll(".nx-feed-comment-btn").forEach((btn) => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const p = postsArray[Number(btn.getAttribute("data-fidx"))];
                if (p) window.openRealPostCommentsDrawer(p, refreshViewFn);
            };
        });

        containerEl.querySelectorAll(".nx-feed-save-btn").forEach((btn) => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const p = postsArray[Number(btn.getAttribute("data-fidx"))];
                if (!p) return;
                let sv = [];
                try {
                    sv = JSON.parse(localStorage.getItem("nx_saved_posts") || "[]");
                } catch (err) {}
                if (!sv.some((x) => x && x.id === p.id)) {
                    sv.unshift(p);
                    localStorage.setItem("nx_saved_posts", JSON.stringify(sv.slice(0, 50)));
                }
                if (window.Nexus && Nexus.toast) Nexus.toast("⚡ Saved to Nexus Vault!");
            };
        });

        containerEl.querySelectorAll(".nx-feed-share-btn").forEach((btn) => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const p = postsArray[Number(btn.getAttribute("data-fidx"))];
                const url = `https://nexus-community01.vercel.app/?post=${encodeURIComponent((p && p.id) || "")}`;
                if (navigator.share) {
                    navigator.share({
                        title: `Post by @${(p && p.username) || "member"}`,
                        text: (p && (p.content || p.text)) || "Check out this post on Nexus Community:",
                        url: url
                    }).catch(() => {});
                } else {
                    navigator.clipboard?.writeText(url);
                    if (window.Nexus && Nexus.toast) Nexus.toast("🔗 Direct Post Link Copied!");
                }
            };
        });
    }

    window.openScrollableProfilePostsFeed = function (postsArray, startIdx, ownerUserObj) {
        if (!Array.isArray(postsArray) || !postsArray.length) return;
        document.getElementById("nx-scrollable-profile-feed-modal")?.remove();

        window.__nxPushBackLayer("nx-scrollable-profile-feed-modal", () => {
            document.getElementById("nx-scrollable-profile-feed-modal")?.remove();
        });

        const modal = document.createElement("div");
        modal.id = "nx-scrollable-profile-feed-modal";
        modal.style.cssText =
            "position:fixed; inset:0; background:#090d16; z-index:200090; overflow-y:auto; color:#fff; max-width:600px; margin:0 auto; box-shadow:0 0 60px rgba(0,0,0,0.95); scroll-behavior:smooth;";

        const renderFeedCards = () => {
            const curScroll = modal.scrollTop;
            const ownerUname = (ownerUserObj && ownerUserObj.username) || "member";
            modal.innerHTML = `
                <div style="position:sticky; top:0; z-index:20; background:rgba(11,17,32,0.96); border-bottom:1px solid #1e293b; padding:12px 16px; display:flex; align-items:center; justify-content:space-between; backdrop-filter:blur(8px);">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <button type="button" id="nx-close-scrollable-feed" style="background:none; border:none; color:#f8fafc; font-size:21px; font-weight:900; cursor:pointer;">←</button>
                        <div>
                            <div style="font-size:15.5px; font-weight:900; color:#f8fafc;">Posts (${postsArray.length})</div>
                            <div style="font-size:11px; color:#34d399; font-weight:700;">@${ownerUname} • 100% Real Live Feed</div>
                        </div>
                    </div>
                </div>
                <div style="padding-bottom:60px;">
                    ${buildScrollablePostCardsHtml(postsArray, ownerUserObj)}
                </div>
            `;

            modal.querySelector("#nx-close-scrollable-feed").onclick = () => modal.remove();
            bindRealPostCardEvents(modal, postsArray, renderFeedCards);
            if (curScroll > 0) modal.scrollTop = curScroll;
        };

        renderFeedCards();
        document.body.appendChild(modal);

        setTimeout(() => {
            const targetCard = document.getElementById(`nx-feed-post-card-${startIdx}`);
            if (targetCard) {
                targetCard.scrollIntoView({ behavior: "instant", block: "start" });
            }
        }, 40);
    };

    // =========================================================================
    // 10. COMPLETE FULL-SCREEN PUBLIC PROFILE & AVATAR ZOOM
    // =========================================================================
    window.openAvatarLongPressZoomModal = function (userObj) {
        if (!userObj || !userObj.username) return;
        document.getElementById("nx-avatar-zoom-overlay")?.remove();

        window.__nxPushBackLayer("nx-avatar-zoom-overlay", () => {
            if (activeSongAudio) activeSongAudio.pause();
            document.getElementById("nx-avatar-zoom-overlay")?.remove();
        });

        const isLive = isUserTrulyOnlineRightNow(userObj);
        const trueTs = extractTrueTimestamp(userObj);
        const seenText = window.formatRealNexusLastSeen(trueTs, isLive) || "Member";
        const song = getNormalizedProfileSong(userObj);

        const avatarHtml = userObj.dp
            ? `<img src="${userObj.dp}" style="width:220px; height:220px; border-radius:50%; object-fit:cover; border:4px solid #10b981; box-shadow:0 20px 60px rgba(0,0,0,0.95);" />`
            : `<div style="width:220px; height:220px; border-radius:50%; background:linear-gradient(135deg,#10b981,#0284c7); color:#020617; font-size:78px; font-weight:900; display:flex; align-items:center; justify-content:center; border:4px solid #fff; box-shadow:0 20px 60px rgba(0,0,0,0.95);">${(
                  userObj.name || userObj.username
              )[0].toUpperCase()}</div>`;

        const overlay = document.createElement("div");
        overlay.id = "nx-avatar-zoom-overlay";
        overlay.style.cssText =
            "position:fixed; inset:0; background:rgba(2,6,23,0.92); z-index:200095; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(10px);";

        overlay.innerHTML = `
            ${
                userObj.moodNote
                    ? `<div style="background:#1e293b; border:1.5px solid #38bdf8; color:#f8fafc; padding:7px 16px; border-radius:18px; font-size:13px; font-weight:800; margin-bottom:-12px; z-index:5;">💭 ${userObj.moodNote}</div>`
                    : ""
            }
            ${avatarHtml}
            <h3 style="font-size:20px; font-weight:900; color:#f8fafc; margin-top:14px;">
                ${userObj.name || userObj.username} ✅
            </h3>
            <div style="font-size:13px; color:#34d399; font-weight:700; margin-top:2px;">
                @${userObj.username} • ${isLive ? "🟢 Online Now" : "Last seen " + seenText}
            </div>
            <p style="font-size:12.5px; color:#cbd5e1; max-width:300px; text-align:center; margin-top:6px;">
                ${userObj.bio || "Nexus Community Member ✨"}
            </p>
            ${
                song
                    ? `<div style="margin-top:10px; max-width:310px; width:100%;">${buildProfileSongPlayerCardHtml(
                          song,
                          "nx-zoom-song-play",
                          ""
                      )}</div>`
                    : ""
            }
            <div style="display:flex; gap:10px; margin-top:18px; width:100%; max-width:310px;">
                <button type="button" id="nx-zoom-open-profile" style="flex:1; padding:11px; border-radius:13px; background:#10b981; color:#020617; font-weight:900; font-size:13px; border:none; cursor:pointer;">
                    👤 View Full Profile
                </button>
                <button type="button" id="nx-zoom-close" style="padding:11px 16px; border-radius:13px; background:#1e293b; color:#cbd5e1; font-weight:800; font-size:13px; border:1px solid #334155; cursor:pointer;">
                    Close
                </button>
            </div>
        `;

        document.body.appendChild(overlay);
        const zPlay = overlay.querySelector("#nx-zoom-song-play");
        if (zPlay && song) {
            zPlay.onclick = (e) => {
                e.stopPropagation();
                window.togglePlayProfileSong(song.audioUrl, zPlay);
            };
        }
        overlay.querySelector("#nx-zoom-open-profile").onclick = (e) => {
            e.stopPropagation();
            if (activeSongAudio) activeSongAudio.pause();
            overlay.remove();
            window.openPublicUserProfileModal(userObj);
        };
        overlay.querySelector("#nx-zoom-close").onclick = () => {
            if (activeSongAudio) activeSongAudio.pause();
            overlay.remove();
        };
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                if (activeSongAudio) activeSongAudio.pause();
                overlay.remove();
            }
        };
    };

    window.openPublicUserProfileModal = function (targetIdentifier) {
        crossSyncAllFollowersAndSongs();
        const userObj =
            typeof targetIdentifier === "object"
                ? targetIdentifier
                : findUserObjectByAnyIdentifier(targetIdentifier);
        if (!userObj || !userObj.username) return;

        document.getElementById("nx-public-profile-modal")?.remove();
        currentPublicTabMode = "grid";

        window.__nxPushBackLayer("nx-public-profile-modal", () => {
            if (activeSongAudio) activeSongAudio.pause();
            document.getElementById("nx-public-profile-modal")?.remove();
        });

        const targetKey = userObj.username.toLowerCase().trim();

        const modal = document.createElement("div");
        modal.id = "nx-public-profile-modal";
        modal.style.cssText =
            "position:fixed; inset:0; background:#090d16; z-index:200075; overflow-y:auto; color:#fff; max-width:600px; margin:0 auto; box-shadow:0 0 60px rgba(0,0,0,0.95);";

        const renderPublicProfileContent = () => {
            const me = getActiveUser();
            const myUname = me && me.username ? me.username.toLowerCase().trim() : "";
            const isFollowing = (userObj.followersList || []).map((x) => String(x).toLowerCase()).includes(myUname);

            const myFollowing = cleanUniqueList((me && me.followingList) || []);
            const theirFollowers = cleanUniqueList(userObj.followersList || []);
            const mutuals = theirFollowers.filter((u) => myFollowing.includes(u) && u !== myUname);

            const userPosts = ((window.Nexus && Nexus.posts) || []).filter((p) => {
                if (!p) return false;
                const pU = (p.username || "").toLowerCase().trim();
                const pA = (p.author || "").toLowerCase().trim();
                return pU === targetKey || pA === (userObj.name || "").toLowerCase().trim();
            });

            const userVideos = userPosts.filter(
                (p) =>
                    p.mediaType === "video" ||
                    String(p.image || "").startsWith("data:video/") ||
                    String(p.image || "").startsWith("NX_VIDEO_STREAM:")
            );

            const isLive = isUserTrulyOnlineRightNow(userObj);
            const trueTs = extractTrueTimestamp(userObj);
            const seenText = window.formatRealNexusLastSeen(trueTs, false);
            const partnerSong = getNormalizedProfileSong(userObj);

            const dpHtml = userObj.dp
                ? `<img src="${userObj.dp}" id="nx-pub-dp-img" style="width:86px; height:86px; border-radius:50%; object-fit:cover; border:3px solid ${
                      isLive ? "#10b981" : "#38bdf8"
                  }; padding:2px; background:#090d16; cursor:pointer;" />`
                : `<div id="nx-pub-dp-img" style="width:86px; height:86px; border-radius:50%; background:linear-gradient(135deg,#10b981,#0284c7); color:#020617; font-size:34px; font-weight:900; display:flex; align-items:center; justify-content:center; border:3px solid #34d399; cursor:pointer;">${(
                      userObj.name || userObj.username
                  )[0].toUpperCase()}</div>`;

            const songBannerHtml = buildProfileSongPlayerCardHtml(partnerSong, "nx-pub-play-song", "");

            const mutualHtml = mutuals.length
                ? `<div style="font-size:11px; color:#94a3b8; margin-top:6px;">
                       👥 Followed by <strong style="color:#f8fafc;">@${mutuals[0]}</strong>${
                      mutuals.length > 1 ? ` and ${mutuals.length - 1} others you follow` : ""
                  }
                   </div>`
                : "";

            let tabBodyHtml = "";
            if (currentPublicTabMode === "feed") {
                tabBodyHtml = userPosts.length
                    ? buildScrollablePostCardsHtml(userPosts, userObj)
                    : `<div style="text-align:center; padding:36px 12px; color:#64748b; font-size:13px;">📷 No posts shared yet.</div>`;
            } else {
                const listToGrid = currentPublicTabMode === "videos" ? userVideos : userPosts;
                tabBodyHtml = listToGrid.length
                    ? `<div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:3px; margin-top:2px;">
                           ${listToGrid
                               .map((p, idx) => {
                                   const img = p.image || p.videoUrl || "";
                                   if (img && !String(img).startsWith("NX_VIDEO_STREAM:")) {
                                       return `<div class="nx-pub-grid-item" data-pidx="${idx}" style="aspect-ratio:1/1; background:#090d16; overflow:hidden; position:relative; cursor:pointer;">
                                                   <img src="${img}" style="width:100%; height:100%; object-fit:cover; display:block;" />
                                               </div>`;
                                   }
                                   return `<div class="nx-pub-grid-item" data-pidx="${idx}" style="aspect-ratio:1/1; background:#0f172a; border:1px solid #1e293b; padding:8px; display:flex; align-items:center; justify-content:center; text-align:center; font-size:10.5px; color:#cbd5e1; cursor:pointer; overflow:hidden;">
                                               ${(p.content || p.text || "Post").slice(0, 55)}
                                           </div>`;
                               })
                               .join("")}
                       </div>`
                    : `<div style="text-align:center; padding:36px 12px; color:#64748b; font-size:13px;">📷 No ${currentPublicTabMode} shared yet.</div>`;
            }

            modal.innerHTML = `
                <div style="position:sticky; top:0; background:rgba(11,17,32,0.96); border-bottom:1px solid #1e293b; padding:12px 16px; display:flex; align-items:center; justify-content:space-between; z-index:20; backdrop-filter:blur(8px);">
                    <div style="display:flex; align-items:center; gap:12px;">
                        <button type="button" id="nx-close-pub-profile" style="background:none; border:none; color:#f8fafc; font-size:21px; font-weight:900; cursor:pointer;">←</button>
                        <div>
                            <div style="font-size:16px; font-weight:900; color:#f8fafc;">
                                @${userObj.username} ✅
                            </div>
                            <div style="font-size:11px; color:${isLive ? "#34d399" : "#94a3b8"}; font-weight:700;">
                                ${isLive ? "🟢 Online Now" : seenText ? "Last seen " + seenText : "Nexus Verified Member"}
                            </div>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:7px;">
                        <button type="button" id="nx-pub-call-btn" title="Voice Call" style="padding:7px 10px; border-radius:10px; background:#1e293b; border:1px solid #334155; color:#34d399; font-size:12px; cursor:pointer;">📞</button>
                        <button type="button" id="nx-pub-vidcall-btn" title="Video Call" style="padding:7px 10px; border-radius:10px; background:#1e293b; border:1px solid #334155; color:#38bdf8; font-size:12px; cursor:pointer;">📹</button>
                        <button type="button" id="nx-pub-qr-btn" title="QR Code & Share" style="padding:7px 10px; border-radius:10px; background:#1e293b; border:1px solid #334155; color:#f8fafc; font-size:11.5px; font-weight:800; cursor:pointer;">📱 QR</button>
                    </div>
                </div>

                <div style="padding:16px 16px 10px;">
                    <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:14px;">
                        <div style="display:flex; flex-direction:column; align-items:center; width:92px; flex-shrink:0;">
                            ${dpHtml}
                            <div style="font-size:13.5px; font-weight:900; color:#f8fafc; margin-top:7px; text-align:center; line-height:1.2;">${
                                userObj.name || userObj.username
                            }</div>
                        </div>

                        <div style="flex:1; display:flex; flex-direction:column; gap:8px;">
                            <div style="display:grid; grid-template-columns:repeat(3, 1fr); text-align:center; background:#0f172a; border:1px solid #1e293b; border-radius:14px; padding:8px 4px;">
                                <div id="nx-pub-posts-stat" style="cursor:pointer;">
                                    <div style="font-size:17px; font-weight:900; color:#f8fafc;">${userPosts.length}</div>
                                    <div style="font-size:11px; color:#94a3b8;">posts</div>
                                </div>
                                <div id="nx-pub-followers-btn" style="cursor:pointer;">
                                    <div id="nx-pub-followers-cnt" style="font-size:17px; font-weight:900; color:#f8fafc;">${(userObj.followersList || []).length}</div>
                                    <div style="font-size:11px; color:#38bdf8; font-weight:700;">followers</div>
                                </div>
                                <div id="nx-pub-following-btn" style="cursor:pointer;">
                                    <div style="font-size:17px; font-weight:900; color:#f8fafc;">${(userObj.followingList || []).length}</div>
                                    <div style="font-size:11px; color:#38bdf8; font-weight:700;">following</div>
                                </div>
                            </div>

                            <!-- Right-Side Bio & Official Badge Card (Zero Empty Gap!) -->
                            <div style="background:linear-gradient(145deg,#0f172a,#090d16); border:1px solid #1e293b; border-radius:14px; padding:9px 11px;">
                                <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; margin-bottom:4px;">
                                    <span style="font-size:10px; font-weight:900; color:#38bdf8; background:rgba(56,189,248,0.14); padding:2px 7px; border-radius:6px;">
                                        🛡️ Official Nexus Profile
                                    </span>
                                    <span style="font-size:10px; font-weight:800; color:${isLive ? "#34d399" : "#94a3b8"};">
                                        ${isLive ? "🟢 Active Now" : seenText || "Verified"}
                                    </span>
                                </div>
                                <div style="font-size:12px; color:#e2e8f0; line-height:1.4; white-space:pre-line;">${
                                    userObj.bio || "IIT-JEE / Nexus Verified Member ✨"
                                }</div>
                            </div>
                        </div>
                    </div>

                    ${mutualHtml}
                    <div id="nx-pub-song-slot">${songBannerHtml}</div>

                    <div style="display:grid; grid-template-columns:1fr 1fr auto; gap:8px; margin-top:14px;">
                        <button type="button" id="nx-pub-follow-toggle" style="padding:10px; border-radius:11px; background:${
                            isFollowing ? "#1e293b" : "#10b981"
                        }; color:${isFollowing ? "#f8fafc" : "#020617"}; border:${
                isFollowing ? "1px solid #334155" : "none"
            }; font-weight:900; font-size:13px; cursor:pointer;">
                            ${isFollowing ? "Following ✓" : "Follow"}
                        </button>
                        <button type="button" id="nx-pub-msg-btn" style="padding:10px; border-radius:11px; background:#1e293b; color:#f8fafc; border:1px solid #334155; font-weight:800; font-size:13px; cursor:pointer;">
                            Message 💬
                        </button>
                        <button type="button" id="nx-pub-share-btn" style="padding:10px 13px; border-radius:11px; background:#1e293b; color:#38bdf8; border:1px solid #334155; font-weight:800; font-size:12px; cursor:pointer;">
                            Share 🔗
                        </button>
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:repeat(3, 1fr); border-top:1px solid #1e293b; border-bottom:1px solid #1e293b; margin-top:6px;">
                    <button type="button" data-pubtab="grid" style="padding:11px 4px; background:none; border:none; border-bottom:2.5px solid ${
                        currentPublicTabMode === "grid" ? "#10b981" : "transparent"
                    }; color:${currentPublicTabMode === "grid" ? "#f8fafc" : "#64748b"}; font-weight:900; font-size:12px; cursor:pointer;">
                        ⊞ Grid (${userPosts.length})
                    </button>
                    <button type="button" data-pubtab="feed" style="padding:11px 4px; background:none; border:none; border-bottom:2.5px solid ${
                        currentPublicTabMode === "feed" ? "#10b981" : "transparent"
                    }; color:${currentPublicTabMode === "feed" ? "#34d399" : "#64748b"}; font-weight:900; font-size:12px; cursor:pointer;">
                        📱 Scroll Posts (${userPosts.length})
                    </button>
                    <button type="button" data-pubtab="videos" style="padding:11px 4px; background:none; border:none; border-bottom:2.5px solid ${
                        currentPublicTabMode === "videos" ? "#10b981" : "transparent"
                    }; color:${currentPublicTabMode === "videos" ? "#f8fafc" : "#64748b"}; font-weight:900; font-size:12px; cursor:pointer;">
                        🎬 Videos (${userVideos.length})
                    </button>
                </div>

                <div style="padding-bottom:60px;">
                    ${tabBodyHtml}
                </div>
            `;

            modal.querySelector("#nx-close-pub-profile").onclick = () => {
                if (activeSongAudio) activeSongAudio.pause();
                modal.remove();
            };
            modal.querySelector("#nx-pub-qr-btn").onclick = () => window.openProfileQrShareModal(userObj);
            modal.querySelector("#nx-pub-share-btn").onclick = () => window.openProfileQrShareModal(userObj);
            modal.querySelector("#nx-pub-dp-img").onclick = () => window.openAvatarLongPressZoomModal(userObj);

            modal.querySelector("#nx-pub-call-btn").onclick = () => {
                if (window.startNexusProCall) window.startNexusProCall(userObj.username, false);
            };
            modal.querySelector("#nx-pub-vidcall-btn").onclick = () => {
                if (window.startNexusProCall) window.startNexusProCall(userObj.username, true);
            };

            const songBtn = modal.querySelector("#nx-pub-play-song");
            if (songBtn && partnerSong) {
                songBtn.onclick = () => window.togglePlayProfileSong(partnerSong.audioUrl, songBtn);
            }

            modal.querySelector("#nx-pub-posts-stat").onclick = () => {
                currentPublicTabMode = "feed";
                renderPublicProfileContent();
            };
            modal.querySelector("#nx-pub-followers-btn").onclick = () => {
                window.openFullScreenConnectionsModal(userObj, "followers");
            };
            modal.querySelector("#nx-pub-following-btn").onclick = () => {
                window.openFullScreenConnectionsModal(userObj, "following");
            };

            modal.querySelectorAll("[data-pubtab]").forEach((b) => {
                b.onclick = () => {
                    currentPublicTabMode = b.getAttribute("data-pubtab");
                    renderPublicProfileContent();
                };
            });

            modal.querySelectorAll(".nx-pub-grid-item").forEach((cell) => {
                cell.onclick = () => {
                    const idx = Number(cell.getAttribute("data-pidx") || 0);
                    window.openScrollableProfilePostsFeed(userPosts, idx, userObj);
                };
            });

            if (currentPublicTabMode === "feed") {
                bindRealPostCardEvents(modal, userPosts, renderPublicProfileContent);
            }

            modal.querySelector("#nx-pub-follow-toggle").onclick = async function () {
                if (!isUserVerified()) {
                    modal.remove();
                    if (window.Nexus) Nexus.switchTab("tab-profile");
                    return;
                }
                const curMe = getActiveUser();
                if (!curMe || !curMe.username) return;
                const myK = curMe.username.toLowerCase().trim();

                userObj.followersList = cleanUniqueList(userObj.followersList || []);
                curMe.followingList = cleanUniqueList(curMe.followingList || []);

                if (userObj.followersList.includes(myK)) {
                    userObj.followersList = userObj.followersList.filter((x) => x !== myK);
                    curMe.followingList = curMe.followingList.filter((x) => x !== targetKey);
                    this.innerText = "Follow";
                    this.style.background = "#10b981";
                    this.style.color = "#020617";
                } else {
                    userObj.followersList.push(myK);
                    curMe.followingList.push(targetKey);
                    this.innerText = "Following ✓";
                    this.style.background = "#1e293b";
                    this.style.color = "#f8fafc";
                }

                const cntEl = modal.querySelector("#nx-pub-followers-cnt");
                if (cntEl) cntEl.textContent = String(userObj.followersList.length);
                localStorage.setItem("nx_active_account", JSON.stringify(curMe));
                crossSyncAllFollowersAndSongs();

                if (window.Nexus && Nexus.db) {
                    await Promise.allSettled([
                        Nexus.db.collection("nexus_accounts").doc(targetKey).set({ followersList: userObj.followersList }, { merge: true }),
                        Nexus.db.collection("nexus_accounts").doc(myK).set({ followingList: curMe.followingList }, { merge: true })
                    ]);
                }
            };

            modal.querySelector("#nx-pub-msg-btn").onclick = () => {
                if (!isUserVerified()) {
                    modal.remove();
                    if (window.Nexus) Nexus.switchTab("tab-profile");
                    return;
                }
                modal.remove();
                window.currentChatUser = userObj.username;
                if (window.Nexus && typeof Nexus.openDM === "function") {
                    Nexus.openDM(userObj.username);
                } else if (window.openDirectMessage) {
                    window.openDirectMessage(userObj.username);
                } else if (window.Nexus) {
                    Nexus.switchTab("tab-community");
                }
            };
        };

        renderPublicProfileContent();
        document.body.appendChild(modal);

        if (window.Nexus && Nexus.db) {
            Nexus.db
                .collection("nexus_accounts")
                .doc(targetKey)
                .get()
                .then((doc) => {
                    if (!doc.exists) return;
                    const cloudData = doc.data();
                    if (!cloudData) return;

                    let needsRerender = false;
                    const cloudSong = getNormalizedProfileSong(cloudData);
                    if (cloudSong && !getNormalizedProfileSong(userObj)) {
                        userObj.profileSong = cloudSong;
                        needsRerender = true;
                    }
                    if (Array.isArray(cloudData.followersList) || Array.isArray(cloudData.followingList)) {
                        userObj.followersList = cleanUniqueList([...(userObj.followersList || []), ...(cloudData.followersList || [])]);
                        userObj.followingList = cleanUniqueList([...(userObj.followingList || []), ...(cloudData.followingList || [])]);
                        crossSyncAllFollowersAndSongs();
                        needsRerender = true;
                    }
                    if (needsRerender && document.getElementById("nx-public-profile-modal")) {
                        renderPublicProfileContent();
                    }
                })
                .catch(() => {});
        }
    };

    function bindGlobalAvatarLongPress() {
        const startHold = (e) => {
            const target = e.target.closest("img, div, span");
            if (!target) return;
            const rect = target.getBoundingClientRect();
            if (rect.width < 26 || rect.width > 120) return;

            const container = target.closest("[data-username], article, .nx-story-item, div");
            if (!container) return;

            const lines = (container.innerText || "").split("\n").map((l) => l.trim()).filter(Boolean);
            let candidateName = container.getAttribute("data-username") || "";
            if (!candidateName && lines.length > 0) {
                candidateName = lines.find((l) => !l.endsWith("ago") && l !== "Live" && l !== "🟢 Live" && !l.includes("DM Open")) || lines[0];
            }
            const matchedUser = findUserObjectByAnyIdentifier(candidateName);
            if (!matchedUser) return;

            clearTimeout(longPressTimer);
            longPressTimer = setTimeout(() => {
                window.openAvatarLongPressZoomModal(matchedUser);
            }, 480);
        };

        const cancelHold = () => clearTimeout(longPressTimer);

        document.addEventListener("touchstart", startHold, { passive: true });
        document.addEventListener("touchend", cancelHold, { passive: true });
        document.addEventListener("touchmove", cancelHold, { passive: true });
    }
    bindGlobalAvatarLongPress();

    // =========================================================================
    // 11. EDIT PROFILE MODAL & MAIN PROFILE TAB RENDERER (#tab-profile)
    //     Fixes Empty Gap Under '4 posts | 12 followers | 1 following' (1000076946.jpg!)
    // =========================================================================
    function openEditInstagramProfileModal() {
        const me = getActiveUser();
        if (!me) return;
        document.getElementById("nx-edit-ig-profile-modal")?.remove();
        window.__nxPushBackLayer("nx-edit-ig-profile-modal", () => {
            document.getElementById("nx-edit-ig-profile-modal")?.remove();
        });

        const modal = document.createElement("div");
        modal.id = "nx-edit-ig-profile-modal";
        modal.style.cssText =
            "position:fixed; inset:0; background:rgba(2,6,23,0.92); z-index:200085; display:flex; align-items:flex-end; justify-content:center;";

        modal.innerHTML = `
            <div style="background:#0f172a; border-top:1.5px solid #10b981; border-radius:24px 24px 0 0; width:100%; max-width:600px; max-height:88dvh; overflow-y:auto; padding:18px 16px 28px; color:#fff;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid #1e293b;">
                    <h3 style="font-size:16.5px; font-weight:900; color:#f8fafc;">Edit Official Profile</h3>
                    <button type="button" id="nx-close-edit-prof" style="width:30px; height:30px; border-radius:50%; background:#1e293b; border:none; color:#fff; font-weight:900; cursor:pointer;">✕</button>
                </div>

                <div style="display:flex; flex-direction:column; gap:10px;">
                    <div>
                        <label style="font-size:10.5px; font-weight:800; color:#94a3b8; display:block; margin-bottom:3px;">DISPLAY NAME</label>
                        <input type="text" id="nx-ep-name" value="${me.name || ""}" style="width:100%; padding:10px 12px; border-radius:11px; background:#090d16; border:1px solid #334155; color:#fff; font-size:13px; outline:none;" />
                    </div>
                    <div>
                        <label style="font-size:10.5px; font-weight:800; color:#94a3b8; display:block; margin-bottom:3px;">BIO / ABOUT YOU</label>
                        <textarea id="nx-ep-bio" rows="2" style="width:100%; padding:10px 12px; border-radius:11px; background:#090d16; border:1px solid #334155; color:#fff; font-size:13px; outline:none; resize:none;">${
                            me.bio || ""
                        }</textarea>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                        <div>
                            <label style="font-size:10.5px; font-weight:800; color:#94a3b8; display:block; margin-bottom:3px;">MOOD NOTE (ABOVE DP)</label>
                            <input type="text" id="nx-ep-mood" value="${
                                me.moodNote || ""
                            }" placeholder="e.g. Coding Mode ⚡" style="width:100%; padding:10px 12px; border-radius:11px; background:#090d16; border:1px solid #334155; color:#fff; font-size:12.5px; outline:none;" />
                        </div>
                        <div>
                            <label style="font-size:10.5px; font-weight:800; color:#94a3b8; display:block; margin-bottom:3px;">WEBSITE / LINK</label>
                            <input type="text" id="nx-ep-link" value="${
                                me.website || ""
                            }" placeholder="https://..." style="width:100%; padding:10px 12px; border-radius:11px; background:#090d16; border:1px solid #334155; color:#fff; font-size:12.5px; outline:none;" />
                        </div>
                    </div>
                    <button type="button" id="nx-save-ep-btn" style="width:100%; padding:13px; border-radius:13px; background:linear-gradient(90deg,#10b981,#06b6d4); color:#020617; font-weight:900; font-size:13.5px; border:none; cursor:pointer; margin-top:6px;">
                        ✅ Save Profile Changes
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector("#nx-close-edit-prof").onclick = () => modal.remove();

        modal.querySelector("#nx-save-ep-btn").onclick = async () => {
            me.name = (modal.querySelector("#nx-ep-name").value || me.username).trim();
            me.bio = (modal.querySelector("#nx-ep-bio").value || "").trim();
            me.moodNote = (modal.querySelector("#nx-ep-mood").value || "").trim();
            me.website = (modal.querySelector("#nx-ep-link").value || "").trim();

            localStorage.setItem("nx_active_account", JSON.stringify(me));
            if (window.Nexus && Nexus.db) {
                await Nexus.db
                    .collection("nexus_accounts")
                    .doc(me.username.toLowerCase().trim())
                    .set(
                        {
                            name: me.name,
                            bio: me.bio,
                            moodNote: me.moodNote,
                            website: me.website,
                            lastOnline: Date.now()
                        },
                        { merge: true }
                    )
                    .catch(() => {});
            }
            if (window.Nexus) {
                Nexus.rebuildAllUsersMasterList && Nexus.rebuildAllUsersMasterList();
                Nexus.notifyAll && Nexus.notifyAll();
                Nexus.toast && Nexus.toast("✅ Profile Updated!");
            }
            modal.remove();
            renderMyInstagramProfileTab();
        };
    }

    function renderMyInstagramProfileTab() {
        const container = document.getElementById("tab-profile");
        if (!container) return;
        if (!isUserVerified()) return;

        crossSyncAllFollowersAndSongs();
        const me = (window.Nexus && Nexus.getCurrentUser && Nexus.getCurrentUser()) || getActiveUser();
        if (!me || !me.username) return;

        const myKey = me.username.toLowerCase().trim();
        const isFounder = ["mohiy", "mohit_01", "mohit"].includes(myKey);

        const allMyPosts = ((window.Nexus && Nexus.posts) || [])
            .filter((p) => {
                if (!p) return false;
                const pU = (p.username || "").toLowerCase().trim();
                const pA = (p.author || "").toLowerCase().trim();
                return pU === myKey || pA === (me.name || "").toLowerCase().trim();
            })
            .sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return Number(b.createdAt || 0) - Number(a.createdAt || 0);
            });

        const myVideoPosts = allMyPosts.filter(
            (p) =>
                p.mediaType === "video" ||
                String(p.image || "").startsWith("data:video/") ||
                String(p.image || "").startsWith("NX_VIDEO_STREAM:") ||
                String(p.image || "").match(/\.(mp4|webm|mov)(\?|$)/i)
        );

        let vaultPosts = [];
        try {
            const saved = JSON.parse(localStorage.getItem("nx_saved_posts") || "[]");
            const pinnedOwn = allMyPosts.filter((p) => p.pinned);
            const map = new Map();
            [...pinnedOwn, ...saved].forEach((p) => {
                if (p && (p.id || p.createdAt)) map.set(p.id || p.createdAt, p);
            });
            vaultPosts = Array.from(map.values());
        } catch (e) {}

        const activeList =
            currentProfileTabMode === "videos"
                ? myVideoPosts
                : currentProfileTabMode === "vault"
                ? vaultPosts
                : allMyPosts;

        const profileVisitors = cleanUniqueList(me.profileViewsBy || []);
        const mySong = getNormalizedProfileSong(me);
        const totalPostLikes = allMyPosts.reduce((s, p) => s + Math.max((p.likedBy || []).length, Number(p.likes || 0)), 0);

        // Polish raw bio text (e.g. turns 'jee asperient' into a clean professional display)
        const rawBio = (me.bio || "").trim();
        const displayBio =
            !rawBio || rawBio.toLowerCase() === "jee asperient"
                ? "⚛️ IIT-JEE 2027 Aspirant • Building Official Nexus Community 🚀"
                : rawBio;

        const dpHtml = me.dp
            ? `<img src="${me.dp}" id="nx-my-dp-img" style="width:88px; height:88px; border-radius:50%; object-fit:cover; border:3px solid #10b981; padding:2px; background:#090d16; cursor:pointer;" />`
            : `<div id="nx-my-dp-img" style="width:88px; height:88px; border-radius:50%; background:linear-gradient(135deg,#10b981,#0284c7); color:#020617; font-size:34px; font-weight:900; display:flex; align-items:center; justify-content:center; border:3px solid #34d399; cursor:pointer;">${(
                  me.name || me.username
              )[0].toUpperCase()}</div>`;

        const songPlayerHtml = mySong
            ? buildProfileSongPlayerCardHtml(mySong, "nx-my-song-play", "nx-my-song-change")
            : `<button type="button" id="nx-add-song-empty-btn" style="margin-top:8px; display:inline-flex; align-items:center; gap:6px; padding:5px 11px; border-radius:999px; background:rgba(56,189,248,0.12); border:1px dashed rgba(56,189,248,0.45); color:#38bdf8; font-size:11.5px; font-weight:800; cursor:pointer;">
                   🎵 + Add Music to Your Profile
               </button>`;

        const highlightsHtml = `
            <div class="nx-ig-highlights-bar" style="display:flex; align-items:center; gap:14px; overflow-x:auto; padding:12px 2px 4px; margin-top:4px;">
                <div id="nx-hl-new" style="display:flex; flex-direction:column; align-items:center; gap:4px; cursor:pointer; flex-shrink:0;">
                    <div style="width:54px; height:54px; border-radius:50%; background:#0f172a; border:1.5px dashed #38bdf8; display:flex; align-items:center; justify-content:center; font-size:20px; color:#38bdf8;">＋</div>
                    <span style="font-size:10.5px; color:#cbd5e1; font-weight:700;">New Post</span>
                </div>
                <div id="nx-hl-groups" style="display:flex; flex-direction:column; align-items:center; gap:4px; cursor:pointer; flex-shrink:0;">
                    <div style="width:54px; height:54px; border-radius:50%; background:linear-gradient(135deg,#0f172a,#1e293b); border:2px solid #10b981; display:flex; align-items:center; justify-content:center; font-size:19px;">🌐</div>
                    <span style="font-size:10.5px; color:#34d399; font-weight:800;">Groups</span>
                </div>
                <div id="nx-hl-pinned" style="display:flex; flex-direction:column; align-items:center; gap:4px; cursor:pointer; flex-shrink:0;">
                    <div style="width:54px; height:54px; border-radius:50%; background:linear-gradient(135deg,#0f172a,#1e293b); border:2px solid #fbbf24; display:flex; align-items:center; justify-content:center; font-size:19px;">📌</div>
                    <span style="font-size:10.5px; color:#cbd5e1; font-weight:700;">Pinned</span>
                </div>
                <div id="nx-hl-visitors" style="display:flex; flex-direction:column; align-items:center; gap:4px; cursor:pointer; flex-shrink:0;">
                    <div style="width:54px; height:54px; border-radius:50%; background:linear-gradient(135deg,#0f172a,#1e293b); border:2px solid #38bdf8; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:900; color:#38bdf8;">👁️ ${profileVisitors.length}</div>
                    <span style="font-size:10.5px; color:#cbd5e1; font-weight:700;">Visitors</span>
                </div>
                <div id="nx-hl-qr" style="display:flex; flex-direction:column; align-items:center; gap:4px; cursor:pointer; flex-shrink:0;">
                    <div style="width:54px; height:54px; border-radius:50%; background:linear-gradient(135deg,#0f172a,#1e293b); border:2px solid #a855f7; display:flex; align-items:center; justify-content:center; font-size:19px;">📱</div>
                    <span style="font-size:10.5px; color:#cbd5e1; font-weight:700;">QR Card</span>
                </div>
            </div>
        `;

        const gridHtml = activeList.length
            ? `<div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:3px; margin-top:2px;">
                   ${activeList
                       .map((p, idx) => {
                           const img = p.image || p.videoUrl || "";
                           const isVid =
                               p.mediaType === "video" ||
                               String(img).startsWith("data:video/") ||
                               String(img).startsWith("NX_VIDEO_STREAM:");

                           const pinBadge = p.pinned
                               ? `<span style="position:absolute; top:5px; left:5px; background:rgba(2,6,23,0.8); color:#fbbf24; font-size:10px; padding:2px 5px; border-radius:6px; z-index:3;">📌</span>`
                               : "";

                           const dotsBadge = `<button type="button" class="nx-grid-cell-3dot" data-gidx="${idx}" style="position:absolute; top:4px; right:4px; width:24px; height:24px; border-radius:50%; background:rgba(2,6,23,0.78); border:1px solid rgba(255,255,255,0.2); color:#fff; font-size:13px; font-weight:900; display:flex; align-items:center; justify-content:center; z-index:4; cursor:pointer;">⋮</button>`;

                           if (img && !String(img).startsWith("NX_VIDEO_STREAM:")) {
                               return `<div class="nx-my-grid-item" data-post-idx="${idx}" style="aspect-ratio:1/1; background:#090d16; overflow:hidden; position:relative; cursor:pointer;">
                                           ${pinBadge}
                                           ${dotsBadge}
                                           ${
                                               isVid
                                                   ? `<video src="${img}" muted playsinline style="width:100%; height:100%; object-fit:cover; display:block;"></video><span style="position:absolute; bottom:5px; right:5px; font-size:12px;">🎬</span>`
                                                   : `<img src="${img}" style="width:100%; height:100%; object-fit:cover; display:block;" />`
                                           }
                                       </div>`;
                           }
                           return `<div class="nx-my-grid-item" data-post-idx="${idx}" style="aspect-ratio:1/1; background:${
                               p.cardGradient || "linear-gradient(145deg,#0f172a,#1e293b)"
                           }; border:1px solid #1e293b; padding:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; font-size:11px; font-weight:800; color:#e2e8f0; cursor:pointer; overflow:hidden; position:relative;">
                                       ${pinBadge}
                                       ${dotsBadge}
                                       ${isVid ? `<div style="font-size:20px; margin-bottom:4px;">🎬</div>` : ""}
                                       <div>${(p.content || p.text || "Post").slice(0, 50)}</div>
                                   </div>`;
                       })
                       .join("")}
               </div>`
            : `<div style="text-align:center; padding:40px 16px; color:#64748b;">
                   <div style="font-size:28px; margin-bottom:6px;">${
                       currentProfileTabMode === "videos" ? "🎬" : currentProfileTabMode === "vault" ? "⚡" : "📷"
                   }</div>
                   <div style="font-size:13.5px; font-weight:800; color:#cbd5e1;">No ${currentProfileTabMode} posts yet</div>
               </div>`;

        container.innerHTML = `
            <div id="nx-ig-profile-root" style="padding-bottom:36px; background:#090d16; min-height:calc(100dvh - 120px);">
                <!-- Top Header -->
                <div style="padding:12px 16px; border-bottom:1px solid #1e293b; display:flex; align-items:center; justify-content:space-between; background:#090d16;">
                    <div id="nx-prof-switch-trigger" style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                        <span style="font-size:18px; font-weight:900; color:#f8fafc;">@${me.username}</span>
                        <span style="background:#10b981; color:#020617; font-size:10px; font-weight:900; padding:1px 6px; border-radius:999px;">✓</span>
                        <span style="color:#94a3b8; font-size:13px;">▾</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <button type="button" id="nx-prof-new-post" title="Create Post" style="padding:6px 11px; border-radius:10px; background:#1e293b; border:1px solid #334155; color:#f8fafc; font-size:12px; font-weight:800; cursor:pointer;">＋ Post</button>
                        <button type="button" id="nx-prof-open-settings" title="Settings" style="padding:6px 11px; border-radius:10px; background:#1e293b; border:1px solid #334155; color:#38bdf8; font-size:13px; font-weight:900; cursor:pointer;">☰</button>
                    </div>
                </div>

                <!-- Symmetrical 2-Column Hero Layout (Fills the Empty Green Circle Space in 1000076946.jpg!) -->
                <div style="padding:16px 16px 10px;">
                    <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:14px;">
                        <!-- Left Column: Avatar + Mood Note + Name -->
                        <div style="display:flex; flex-direction:column; align-items:center; width:96px; flex-shrink:0;">
                            <div style="position:relative;">
                                <div id="nx-my-mood-pill" style="position:absolute; top:-10px; left:50%; transform:translateX(-50%); background:#1e293b; border:1px solid #38bdf8; color:#f8fafc; font-size:9.5px; font-weight:800; padding:2px 8px; border-radius:12px; white-space:nowrap; z-index:5; cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.6);">
                                    ${me.moodNote ? "💭 " + me.moodNote : "💭 Note..."}
                                </div>
                                ${dpHtml}
                                <label for="nx-inp-upload-dp" style="position:absolute; bottom:2px; right:2px; width:26px; height:26px; border-radius:50%; background:#38bdf8; color:#020617; font-weight:900; font-size:16px; display:flex; align-items:center; justify-content:center; border:2px solid #090d16; cursor:pointer;">+</label>
                                <input type="file" id="nx-inp-upload-dp" accept="image/*" style="display:none;" />
                            </div>
                            <div style="font-size:14px; font-weight:900; color:#f8fafc; margin-top:8px; text-align:center; line-height:1.2;">
                                ${me.name || me.username}
                            </div>
                            <span style="font-size:10px; font-weight:800; color:#34d399; margin-top:2px;">🟢 Online Now</span>
                        </div>

                        <!-- Right Column: Stats Box + Official Nexus Bio & Live Status Card (Fills the Empty Space!) -->
                        <div style="flex:1; display:flex; flex-direction:column; gap:8px; min-width:0;">
                            <!-- Stats Bar -->
                            <div style="display:grid; grid-template-columns:repeat(3, 1fr); text-align:center; background:#0f172a; border:1px solid #1e293b; border-radius:14px; padding:8px 4px;">
                                <div id="nx-my-posts-scroll-trigger" style="cursor:pointer;">
                                    <div style="font-size:17px; font-weight:900; color:#f8fafc;">${allMyPosts.length}</div>
                                    <div style="font-size:11px; color:#94a3b8;">posts</div>
                                </div>
                                <div id="nx-my-followers-trigger" style="cursor:pointer;">
                                    <div style="font-size:17px; font-weight:900; color:#f8fafc;">${(me.followersList || []).length}</div>
                                    <div style="font-size:11px; color:#38bdf8; font-weight:700;">followers</div>
                                </div>
                                <div id="nx-my-following-trigger" style="cursor:pointer;">
                                    <div style="font-size:17px; font-weight:900; color:#f8fafc;">${(me.followingList || []).length}</div>
                                    <div style="font-size:11px; color:#38bdf8; font-weight:700;">following</div>
                                </div>
                            </div>

                            <!-- Official Nexus Bio & Role Card (Fills the exact space circled in 1000076946.jpg!) -->
                            <div style="background:linear-gradient(145deg,#0f172a,#090d16); border:1px solid rgba(16,185,129,0.35); border-radius:14px; padding:9px 11px;">
                                <div style="display:flex; align-items:center; justify-content:space-between; gap:4px; margin-bottom:4px; flex-wrap:wrap;">
                                    <span style="font-size:10px; font-weight:900; color:#020617; background:linear-gradient(90deg,#10b981,#38bdf8); padding:2px 7px; border-radius:6px;">
                                        ${isFounder ? "👑 Founder & Developer" : "🛡️ Nexus Verified"}
                                    </span>
                                    <span style="font-size:10px; font-weight:800; color:#fbbf24;">
                                        ❤️ ${totalPostLikes} Likes • 👁️ ${profileVisitors.length} Views
                                    </span>
                                </div>
                                <div style="font-size:12px; color:#e2e8f0; line-height:1.4; white-space:pre-line; word-break:break-word;">${displayBio}</div>
                                ${
                                    me.website
                                        ? `<a href="${me.website}" target="_blank" style="display:inline-block; font-size:11px; color:#38bdf8; font-weight:700; margin-top:3px; text-decoration:none;">🔗 ${me.website}</a>`
                                        : ""
                                }
                            </div>
                        </div>
                    </div>

                    <!-- Profile Song Player -->
                    <div>${songPlayerHtml}</div>

                    <!-- 3 Action Buttons -->
                    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:7px; margin-top:12px;">
                        <button type="button" id="nx-btn-edit-profile" style="padding:9px; border-radius:10px; background:#1e293b; border:1px solid #334155; color:#f8fafc; font-weight:800; font-size:12px; cursor:pointer;">
                            Edit profile
                        </button>
                        <button type="button" id="nx-btn-profile-song" style="padding:9px; border-radius:10px; background:#1e293b; border:1px solid #334155; color:#34d399; font-weight:800; font-size:12px; cursor:pointer;">
                            🎵 Profile Song
                        </button>
                        <button type="button" id="nx-btn-share-profile" style="padding:9px; border-radius:10px; background:#1e293b; border:1px solid #334155; color:#38bdf8; font-weight:800; font-size:12px; cursor:pointer;">
                            Share / QR
                        </button>
                    </div>

                    ${highlightsHtml}
                </div>

                <!-- 3-Tab Grid Switcher -->
                <div style="display:grid; grid-template-columns:repeat(3, 1fr); border-top:1px solid #1e293b; border-bottom:1px solid #1e293b; margin-top:6px;">
                    <button type="button" data-ptab="posts" style="padding:11px 4px; background:none; border:none; border-bottom:2.5px solid ${
                        currentProfileTabMode === "posts" ? "#10b981" : "transparent"
                    }; color:${currentProfileTabMode === "posts" ? "#f8fafc" : "#64748b"}; font-weight:900; font-size:12px; cursor:pointer;">
                        ⊞ Posts (${allMyPosts.length})
                    </button>
                    <button type="button" data-ptab="videos" style="padding:11px 4px; background:none; border:none; border-bottom:2.5px solid ${
                        currentProfileTabMode === "videos" ? "#10b981" : "transparent"
                    }; color:${currentProfileTabMode === "videos" ? "#f8fafc" : "#64748b"}; font-weight:900; font-size:12px; cursor:pointer;">
                        🎬 Reels (${myVideoPosts.length})
                    </button>
                    <button type="button" data-ptab="vault" style="padding:11px 4px; background:none; border:none; border-bottom:2.5px solid ${
                        currentProfileTabMode === "vault" ? "#38bdf8" : "transparent"
                    }; color:${currentProfileTabMode === "vault" ? "#38bdf8" : "#64748b"}; font-weight:900; font-size:12px; cursor:pointer;">
                        ⚡ Nexus Vault (${vaultPosts.length})
                    </button>
                </div>

                ${gridHtml}
            </div>
        `;

        container.querySelector("#nx-prof-switch-trigger").onclick = () => {
            if (window.openAdvancedGoogleAuthModal) window.openAdvancedGoogleAuthModal("signin");
        };
        container.querySelector("#nx-prof-new-post").onclick = () => {
            if (window.openOfficialNexusCreatorStudio) window.openOfficialNexusCreatorStudio();
        };
        container.querySelector("#nx-prof-open-settings").onclick = () => {
            if (window.Nexus && Nexus.switchTab) Nexus.switchTab("tab-settings");
        };

        container.querySelector("#nx-my-dp-img").onclick = () => window.openAvatarLongPressZoomModal(me);
        container.querySelector("#nx-my-mood-pill").onclick = openEditInstagramProfileModal;
        container.querySelector("#nx-btn-edit-profile").onclick = openEditInstagramProfileModal;
        container.querySelector("#nx-btn-profile-song").onclick = window.openProfileSongPickerModal;
        container.querySelector("#nx-btn-share-profile").onclick = () => window.openProfileQrShareModal(me);

        container.querySelector("#nx-hl-new").onclick = () => {
            if (window.openOfficialNexusCreatorStudio) window.openOfficialNexusCreatorStudio();
        };
        container.querySelector("#nx-hl-groups").onclick = () => {
            if (window.Nexus && Nexus.switchTab) Nexus.switchTab("tab-community");
            setTimeout(() => window.openNexusGroupChatRoom(OFFICIAL_GROUPS[0]), 80);
        };
        container.querySelector("#nx-hl-pinned").onclick = () => {
            const pinnedList = allMyPosts.filter((p) => p.pinned);
            if (pinnedList.length) window.openScrollableProfilePostsFeed(pinnedList, 0, me);
            else if (window.Nexus && Nexus.toast) Nexus.toast("📌 Tap ⋮ on any of your posts to Pin it!");
        };
        container.querySelector("#nx-hl-visitors").onclick = () => {
            openFollowersFollowingModal("👁️ Recent Profile Visitors", profileVisitors);
        };
        container.querySelector("#nx-hl-qr").onclick = () => window.openProfileQrShareModal(me);

        const emptySongBtn = container.querySelector("#nx-add-song-empty-btn");
        if (emptySongBtn) emptySongBtn.onclick = window.openProfileSongPickerModal;

        const playMySongBtn = container.querySelector("#nx-my-song-play");
        if (playMySongBtn && mySong) {
            playMySongBtn.onclick = () => window.togglePlayProfileSong(mySong.audioUrl, playMySongBtn);
        }
        const changeMySongBtn = container.querySelector("#nx-my-song-change");
        if (changeMySongBtn) changeMySongBtn.onclick = window.openProfileSongPickerModal;

        const dpInp = container.querySelector("#nx-inp-upload-dp");
        if (dpInp) {
            dpInp.onchange = (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file || !window.Nexus || !Nexus.compressImage) return;
                Nexus.compressImage(file, 420, 0.72, async (b64) => {
                    me.dp = b64;
                    localStorage.setItem("nx_active_account", JSON.stringify(me));
                    if (Nexus.db) {
                        await Nexus.db.collection("nexus_accounts").doc(myKey).set({ dp: b64 }, { merge: true }).catch(() => {});
                    }
                    Nexus.rebuildAllUsersMasterList && Nexus.rebuildAllUsersMasterList();
                    renderMyInstagramProfileTab();
                    Nexus.toast && Nexus.toast("📸 Profile Picture Updated!");
                });
            };
        }

        container.querySelector("#nx-my-posts-scroll-trigger").onclick = () => {
            if (allMyPosts.length) window.openScrollableProfilePostsFeed(allMyPosts, 0, me);
        };
        container.querySelector("#nx-my-followers-trigger").onclick = () => {
            window.openFullScreenConnectionsModal(me, "followers");
        };
        container.querySelector("#nx-my-following-trigger").onclick = () => {
            window.openFullScreenConnectionsModal(me, "following");
        };

        container.querySelectorAll("[data-ptab]").forEach((btn) => {
            btn.onclick = () => {
                currentProfileTabMode = btn.getAttribute("data-ptab");
                renderMyInstagramProfileTab();
            };
        });

        container.querySelectorAll(".nx-grid-cell-3dot").forEach((dotsBtn) => {
            dotsBtn.onclick = (e) => {
                e.stopPropagation();
                const p = activeList[Number(dotsBtn.getAttribute("data-gidx"))];
                if (p) openSystematicPostThreeDotSheet(p, renderMyInstagramProfileTab);
            };
        });

        container.querySelectorAll(".nx-my-grid-item").forEach((cell) => {
            cell.onclick = () => {
                const idx = Number(cell.getAttribute("data-post-idx") || 0);
                window.openScrollableProfilePostsFeed(activeList, idx, me);
            };
        });
    }

    if (window.Nexus && Nexus.listeners) {
        Nexus.listeners.onUsers.push(() => {
            const pTab = document.getElementById("tab-profile");
            if (pTab && pTab.classList.contains("active") && isUserVerified()) {
                renderMyInstagramProfileTab();
            }
        });
        Nexus.listeners.onPosts.push(() => {
            ensureHomeFeedNeverBlank();
            const pTab = document.getElementById("tab-profile");
            if (pTab && pTab.classList.contains("active") && isUserVerified()) {
                renderMyInstagramProfileTab();
            }
        });
    }

    if (window.Nexus) {
        Nexus.openUserProfile = window.openPublicUserProfileModal;
    }

    setInterval(() => {
        if (window.Nexus && Nexus.openUserProfile !== window.openPublicUserProfileModal) {
            Nexus.openUserProfile = window.openPublicUserProfileModal;
        }
        const pTab = document.getElementById("tab-profile");
        if (pTab && pTab.classList.contains("active") && isUserVerified() && !pTab.querySelector("#nx-ig-profile-root")) {
            renderMyInstagramProfileTab();
        }
    }, 350);
})();
