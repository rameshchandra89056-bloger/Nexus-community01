/* ============================================================================
   NEXUS OFFICIAL PROFILE.JS (V41 FINAL UNCUT MASTER — PART 1 OF 2)
   100% Supabase Native + All Legacy V34-V38 Features Preserved + New Core Suite
   ============================================================================ */
(function () {
    if (window.__NEXUS_PROFILE_V41_PART1__) return;
    window.__NEXUS_PROFILE_V41_PART1__ = true;

    const normU = (u) => String(u || "").toLowerCase().replace(/^@/, "").trim();
    const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const getSec = () => window.NexusSecurity || null;
    const getSb = () => (window.NexusSecurity && window.NexusSecurity.sb) || null;

    const THEME_ACCENTS = {
        emerald: { name: "Emerald", primary: "#10b981", glow: "#34d399", grad: "linear-gradient(135deg,#10b981,#06b6d4)", bg: "linear-gradient(135deg,#064e3b,#0f172a)" },
        cyber:   { name: "Cyber Blue", primary: "#38bdf8", glow: "#7dd3fc", grad: "linear-gradient(135deg,#0284c7,#6366f1)", bg: "linear-gradient(135deg,#0c4a6e,#0f172a)" },
        royal:   { name: "Royal Purple", primary: "#a855f7", glow: "#d8b4fe", grad: "linear-gradient(135deg,#9333ea,#ec4899)", bg: "linear-gradient(135deg,#3b0764,#0f172a)" },
        gold:    { name: "Sunset Gold", primary: "#f59e0b", glow: "#fcd34d", grad: "linear-gradient(135deg,#f59e0b,#ef4444)", bg: "linear-gradient(135deg,#78350f,#0f172a)" },
        crimson: { name: "Crimson", primary: "#f43f5e", glow: "#fda4af", grad: "linear-gradient(135deg,#e11d48,#f97316)", bg: "linear-gradient(135deg,#881337,#0f172a)" }
    };

    function getThemeAccent(key) { return THEME_ACCENTS[key] || THEME_ACCENTS.emerald; }

    function getExtraProfileMeta(uname) {
        try { return JSON.parse(localStorage.getItem("nx_prof_extra_" + normU(uname || "guest")) || "{}"); }
        catch (e) { return {}; }
    }

    function saveExtraProfileMeta(uname, patch) {
        const k = "nx_prof_extra_" + normU(uname || "guest");
        const cur = getExtraProfileMeta(uname);
        const merged = Object.assign({}, cur, patch);
        try { localStorage.setItem(k, JSON.stringify(merged)); } catch (e) {}
        return merged;
    }

    const realLastSeenCache = {};
    const backStackLayers = [];
    let lastRenderedHomeHash = "";

    // Clean legacy rogue shells
    ["nx-all-groups-hub", "nx-group-chat-fullscreen", "nx-missing-posts-restorer-box", "nx-guaranteed-dm-screen", "nx-official-session-bar"].forEach((id) => {
        document.getElementById(id)?.remove();
    });

    // STRICT ANTI-OVERLAP CSS SHIELD + PROFILE TAB UNLOCKER + STRAY MIC KILLER + Z-INDEX SHIELD
    if (!document.getElementById("nx-profile-v41-style")) {
        const st = document.createElement("style");
        st.id = "nx-profile-v41-style";
        st.textContent = `
            #nx-all-groups-hub,#nx-group-chat-fullscreen,#nx-missing-posts-restorer-box,
            .nx-auto-seen-pill,.nx-dm-open-pill-hidden,.nx-refresh-spam-hidden,
            body > .nx-voice-note-card,body > audio:not(#nx-call-remote-audio),
            #tab-home > audio,#tab-settings > audio,#tab-profile > audio,
            #nx-floating-voice-btn,.nx-floating-mic-widget { display:none !important; }
            #tab-profile.active { display:block !important; opacity:1 !important; visibility:visible !important; }
            #tab-profile.active > #nx-ig-profile-root,#tab-profile.active > #nx-google-auth-hub { display:block !important; }
            #tab-home > *:not(#nx-stories-bar):not(#nx-clean-home-feed-v31) { display:none !important; }
            #nx-clean-home-feed-v31 { display:flex !important; flex-direction:column !important; gap:16px !important; padding:8px 12px 92px !important; width:100% !important; box-sizing:border-box !important; }
            .nx-v31-post-card { position:relative !important; display:flex !important; flex-direction:column !important; width:100% !important; background:#0f172a !important; border:1px solid #1e293b !important; border-radius:20px !important; overflow:hidden !important; box-shadow:0 10px 28px rgba(0,0,0,.5) !important; margin:0 !important; }
            #nx-global-modal { z-index:250000 !important; }
            #nx-public-profile-modal { z-index:255000 !important; }
            #nx-sys-post-3dot-sheet,#nx-home-post-admin-sheet { z-index:260000 !important; }
            @keyframes nxEqBounce { 0%,100%{height:4px} 50%{height:14px} }
            .nx-eq-bar { width:3px; height:6px; background:#10b981; border-radius:99px; display:inline-block; animation:nxEqBounce .6s infinite ease-in-out; }
            .nx-eq-bar:nth-child(2){ animation-delay:.15s; background:#38bdf8; }
            .nx-eq-bar:nth-child(3){ animation-delay:.3s; }
            @keyframes nxHeartPop { 0%{transform:translate(-50%,-50%) scale(0);opacity:0} 40%{transform:translate(-50%,-50%) scale(1.35);opacity:1} 80%{transform:translate(-50%,-50%) scale(1);opacity:1} 100%{transform:translate(-50%,-50%) scale(1.2);opacity:0} }
        `;
        document.head.appendChild(st);
    }

    // 1. ROGUE VOICE BAR & LEGACY "MEMBER FULL PROFILE" POPUP PURGER (PRESERVED!)
    function purgeRogueVoiceAndLegacyPopups() {
        document.querySelectorAll("body > .nx-voice-note-card, body > audio:not(#nx-call-remote-audio), #nx-floating-voice-btn, .nx-floating-mic-widget").forEach((el) => el.remove());
        document.querySelectorAll("div, section").forEach((el) => {
            if (el.id !== "nx-public-profile-modal" && el.textContent && el.textContent.includes("Member Full Profile") && el.offsetHeight > 80 && el.offsetWidth < window.innerWidth) {
                const m = (el.innerText || "").match(/@([a-zA-Z0-9_.\-]+)/);
                const uname = m ? m[1] : null;
                (el.closest(".nx-modal-overlay, [style*='fixed']") || el).remove();
                if (uname && typeof window.openPublicUserProfileModal === "function") window.openPublicUserProfileModal(uname);
            }
        });
    }
    setInterval(purgeRogueVoiceAndLegacyPopups, 600);

    // 2. SINGLE-STEP HARDWARE BACK BUTTON ROUTER (PRESERVED!)
    window.__nxPushBackLayer = function (id, closeFn) {
        const idx = backStackLayers.findIndex((x) => x.id === id);
        if (idx !== -1) backStackLayers.splice(idx, 1);
        backStackLayers.push({ id, closeFn });
        try { window.history.pushState({ nxLayer: id }, ""); } catch (e) {}
    };

    window.addEventListener("popstate", () => {
        while (backStackLayers.length > 0) {
            const top = backStackLayers.pop();
            const el = document.getElementById(top.id);
            if (el && el.style.display !== "none") {
                try { top.closeFn(); } catch (err) { el.remove(); }
                return;
            }
        }
        const openModals = [
            "nx-hd-media-lightbox", "nx-post-comments-drawer", "nx-follow-list-modal",
            "nx-qr-share-modal", "nx-sys-post-3dot-sheet", "nx-cap-edit-modal",
            "nx-profile-analytics-modal", "nx-scrollable-profile-feed-modal",
            "nx-public-profile-modal", "nx-avatar-zoom-overlay", "nx-song-picker-modal",
            "nx-edit-ig-profile-modal", "nx-real-notif-drawer", "nx-real-search-drawer",
            "nx-official-creator-studio", "nx-global-modal"
        ];
        for (const mid of openModals) {
            const m = document.getElementById(mid);
            if (m && m.style.display !== "none") { m.remove(); return; }
        }
        const homeTab = document.getElementById("tab-home");
        if (homeTab && !homeTab.classList.contains("active") && window.Nexus && Nexus.switchTab) {
            Nexus.switchTab("tab-home");
            try { window.history.pushState({ nxGuard: "home" }, ""); } catch (err) {}
        }
    });

    // 3. USER, POST & SONG NORMALIZERS (SUPABASE + LEGACY SAFE)
    function cleanUniqueList(arr) {
        if (!Array.isArray(arr)) return [];
        const seen = new Set(), out = [];
        arr.forEach((item) => {
            const s = normU(item);
            if (s && s !== "member" && !seen.has(s)) { seen.add(s); out.push(s); }
        });
        return out;
    }

    function getActiveUser() {
        try {
            if (window.Nexus && typeof Nexus.getCurrentUser === "function") {
                const u = Nexus.getCurrentUser();
                if (u && u.username) return u;
            }
            const raw = localStorage.getItem("nx_active_account");
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return (parsed && parsed.username) ? parsed : null;
        } catch (e) { return null; }
    }

    function getMyUsername() {
        const me = getActiveUser();
        return me && me.username ? normU(me.username) : "";
    }

    function isUserVerified() {
        const me = getActiveUser();
        return Boolean(me && me.username && me.id);
    }
    window.__nxIsUserVerified = isUserVerified;

    function openLoginIfNeeded(mode) {
        if (window.openNexusSupabaseAuthModal) window.openNexusSupabaseAuthModal(mode || "login");
        else if (window.NexusSecurity && NexusSecurity.openAdvancedNexusAuthModal) NexusSecurity.openAdvancedNexusAuthModal(mode || "login");
        else if (window.Nexus && Nexus.switchTab) Nexus.switchTab("tab-profile");
    }

    function isStrictOwnerOfPost(postObj) {
        const me = getActiveUser();
        if (!postObj || !me) return false;
        if (me.role === "admin") return true;
        const myK = normU(me.username);
        const pU = normU(postObj.username || postObj.author_username);
        if (pU === "nexus_official" || pU === "nexus") return me.role === "admin";
        if (pU && pU === myK) return true;
        if (me.id && postObj.author_id && String(me.id) === String(postObj.author_id)) return true;
        return false;
    }

    function getNormalizedProfileSong(userObj) {
        if (!userObj) return null;
        let s = userObj.profileSong || userObj.profile_song || null;
        if (typeof s === "string" && s.startsWith("{")) {
            try { s = JSON.parse(s); } catch (e) { s = null; }
        }
        if (!s && typeof userObj.profileSongJson === "string" && userObj.profileSongJson.startsWith("{")) {
            try { s = JSON.parse(userObj.profileSongJson); } catch (e) { s = null; }
        }
        if (s && s.title && (s.audioUrl || s.previewUrl)) {
            return {
                title: s.title,
                artist: s.artist || "Official Profile Anthem",
                audioUrl: s.audioUrl || s.previewUrl,
                coverUrl: s.coverUrl || s.artwork || ""
            };
        }
        return null;
    }

    function normalizeSupabaseUser(raw) {
        if (!raw || typeof raw !== "object") return null;
        const uname = normU(raw.username || raw.firebase_uid);
        if (!uname || uname === "member") return null;
        const lo = raw.last_online ? new Date(raw.last_online).getTime() : Number(raw.lastOnline || 0);
        const extra = getExtraProfileMeta(uname);
        return {
            id: raw.id || "",
            uid: raw.id || "",
            username: uname,
            name: raw.display_name || raw.name || uname,
            dp: raw.avatar_url || raw.dp || "",
            coverUrl: raw.cover_url || raw.coverUrl || extra.coverUrl || "",
            themeColor: raw.theme_color || raw.themeColor || extra.themeColor || "emerald",
            skillTags: Array.isArray(raw.skill_tags) && raw.skill_tags.length ? raw.skill_tags : (Array.isArray(extra.skillTags) ? extra.skillTags : []),
            bio: raw.bio || "",
            moodNote: raw.mood_note || raw.moodNote || "",
            website: raw.website || "",
            profileSong: getNormalizedProfileSong(raw),
            verified: raw.is_verified !== false,
            role: raw.role || "user",
            e2ee_public_key: raw.e2ee_public_key || null,
            followersList: cleanUniqueList(raw.followers_list || raw.followersList || []),
            followingList: cleanUniqueList(raw.following_list || raw.followingList || []),
            lastOnline: isNaN(lo) ? 0 : lo,
            lastSeenAt: isNaN(lo) ? 0 : lo
        };
    }

    function normalizeSupabasePost(raw) {
        if (!raw || typeof raw !== "object") return null;
        const uname = normU(raw.author_username || raw.username || raw.author || "member");
        const contentRaw = String(raw.content !== undefined ? raw.content : (raw.caption || raw.text || "")).trim();
        const content = contentRaw === "Nexus Post" ? "" : contentRaw;
        const img = String(raw.image_url || raw.media_url || raw.image || raw.videoUrl || "").trim();
        const likedBy = cleanUniqueList(raw.likes_list || raw.likedBy || []);
        const viewedBy = cleanUniqueList(raw.viewedBy || []);
        const comments = Array.isArray(raw.comments_list) ? raw.comments_list : (Array.isArray(raw.comments) ? raw.comments : []);
        const createdAt = raw.created_at ? new Date(raw.created_at).getTime() : Number(raw.createdAt || Date.now());
        return {
            id: String(raw.id || ""),
            author_id: raw.author_id || "",
            username: uname,
            author: raw.author_name || raw.author || uname,
            dp: raw.author_dp || raw.dp || "",
            bio: raw.bio || "",
            content,
            text: content,
            image: img,
            videoUrl: raw.videoUrl || (raw.media_type === "video" ? img : ""),
            mediaType: raw.media_type || raw.mediaType || (/\.(mp4|webm|mov)(\?|$)/i.test(img) ? "video" : "image"),
            likedBy,
            likes: Math.max(likedBy.length, Number(raw.likes_count || raw.likes || 0)),
            viewedBy,
            views: Math.max(viewedBy.length, Number(raw.views_count || raw.views || 1), likedBy.length),
            comments,
            pinned: Boolean(raw.is_pinned || raw.pinned),
            cardGradient: raw.card_gradient || raw.cardGradient || "",
            songTitle: raw.song_title || raw.songTitle || "",
            songUrl: raw.song_url || raw.songUrl || "",
            createdAt: isNaN(createdAt) ? Date.now() : createdAt
        };
    }

    function isRealValidPost(p) {
        if (!p || typeof p !== "object") return false;
        const u = normU(p.username || p.author);
        if (!u || u === "member") return false;
        const txt = String(p.content || p.text || "").trim();
        const img = String(p.image || p.videoUrl || "").trim();
        if (img.startsWith("NX_VIDEO_STREAM:") && !txt) return false;
        if (!img && (!txt || txt === "." || txt === ".." || txt === "Nexus Post")) return false;
        if (window.__nxIsRefreshSpamPost && window.__nxIsRefreshSpamPost(p)) return false;
        return true;
    }

    // 4. SUPABASE LIVE CLOUD SYNC (REPLACES DEAD FIREBASE REST PATCH)
    async function syncSupabaseUsersAndPosts(forceRender) {
        const sb = getSb();
        if (!sb || !window.Nexus) return;
        try {
            const [uRes, pRes] = await Promise.all([
                sb.from("profiles").select("*").order("last_online", { ascending: false }).limit(160),
                sb.from("posts").select("*").order("created_at", { ascending: false }).limit(100)
            ]);
            if (Array.isArray(uRes.data) && uRes.data.length) {
                const users = uRes.data.map(normalizeSupabaseUser).filter(Boolean);
                Nexus.users = users;
                Nexus.cloudAccounts = users;
                const me = getActiveUser();
                if (me && me.id) {
                    const freshMe = users.find((x) => x.id === me.id);
                    if (freshMe) {
                        const mergedMe = Object.assign({}, me, freshMe);
                        try { localStorage.setItem("nx_active_account", JSON.stringify(mergedMe)); } catch (e) {}
                    }
                }
            }
            if (Array.isArray(pRes.data)) {
                const posts = pRes.data.map(normalizeSupabasePost).filter(isRealValidPost);
                Nexus.posts = posts;
                window.__NX_INSTANT_POSTS__ = posts;
            }
            crossSyncAllFollowersAndSongs();
            if (forceRender) {
                renderCleanZeroOverlapHomeFeed(true);
                const pTab = document.getElementById("tab-profile");
                if (pTab && pTab.classList.contains("active") && window.renderMyInstagramProfileTab) {
                    window.renderMyInstagramProfileTab();
                }
            }
        } catch (e) {}
    }

    // 5. FOLLOWERS / FOLLOWING CROSS-SYNC & PERSISTENCE
    function crossSyncAllFollowersAndSongs() {
        if (!window.Nexus || !Array.isArray(Nexus.users)) return;
        const map = {};
        Nexus.users = Nexus.users.filter((u) => u && u.username && normU(u.username) !== "member");
        Nexus.users.forEach((u) => {
            const k = normU(u.username);
            u.followersList = cleanUniqueList(u.followersList);
            u.followingList = cleanUniqueList(u.followingList);
            const song = getNormalizedProfileSong(u);
            if (song) u.profileSong = song; else delete u.profileSong;
            map[k] = u;
        });
        Object.values(map).forEach((uA) => {
            const kA = normU(uA.username);
            uA.followingList.forEach((t) => { if (map[t] && !map[t].followersList.includes(kA)) map[t].followersList.push(kA); });
            uA.followersList.forEach((f) => { if (map[f] && !map[f].followingList.includes(kA)) map[f].followingList.push(kA); });
        });
    }

    async function persistPostUpdate(postObj, patchObj) {
        const sb = getSb();
        if (!sb || !postObj || !postObj.id) return;
        await sb.from("posts").update(patchObj).eq("id", postObj.id).catch(() => {});
    }

    async function persistFollowToggle(targetUserObj) {
        const me = getActiveUser(), sb = getSb();
        if (!me || !me.id || !sb || !targetUserObj) return false;
        const myK = normU(me.username), targetK = normU(targetUserObj.username);
        me.followingList = cleanUniqueList(me.followingList || []);
        targetUserObj.followersList = cleanUniqueList(targetUserObj.followersList || []);

        const adding = !me.followingList.includes(targetK);
        if (adding) {
            me.followingList.push(targetK);
            if (!targetUserObj.followersList.includes(myK)) targetUserObj.followersList.push(myK);
        } else {
            me.followingList = me.followingList.filter((x) => x !== targetK);
            targetUserObj.followersList = targetUserObj.followersList.filter((x) => x !== myK);
        }
        try { localStorage.setItem("nx_active_account", JSON.stringify(me)); } catch (e) {}
        crossSyncAllFollowersAndSongs();
        await sb.from("profiles").update({ following_list: me.followingList }).eq("id", me.id).catch(() => {});
        if (targetUserObj.id) {
            await sb.from("profiles").update({ followers_list: targetUserObj.followersList }).eq("id", targetUserObj.id).catch(() => {});
        }
        return adding;
    }

    // 6. STRICT TIMESTAMP, ONLINE PRESENCE & EXACT USER RESOLVER
    function extractTrueTimestamp(u) {
        if (!u) return 0;
        const now = Date.now();
        const cands = [u.lastSeen, u.lastSeenAt, u.lastActive, u.updatedAt, u.lastOnline, u.createdAt];
        for (const v of cands) {
            const n = Number(v || 0);
            if (n > 1000000000000 && n <= now + 60000) return n;
        }
        return (u.username && realLastSeenCache[normU(u.username)]) || 0;
    }

    function isUserTrulyOnlineRightNow(u) {
        if (!u) return false;
        if (getMyUsername() && normU(u.username) === getMyUsername()) return true;
        const ts = extractTrueTimestamp(u);
        return Boolean(ts && (Date.now() - ts) >= 0 && (Date.now() - ts) <= 120000);
    }

    window.formatRealNexusLastSeen = function (ts, isOnline) {
        if (isOnline) return "🟢 Live";
        const num = Number(ts || 0);
        if (!num || num < 1000000000000) return "";
        const s = Math.max(1, Math.floor((Date.now() - num) / 1000));
        return s < 60 ? "Just now" : s < 3600 ? Math.floor(s / 60) + "m ago" : s < 86400 ? Math.floor(s / 3600) + "h ago" : Math.floor(s / 86400) + "d ago";
    };

    function findUserObjectByAnyIdentifier(identifier, cardImgSrc) {
        if (identifier && typeof identifier === "object" && identifier.username) return identifier;
        const pools = [...((window.Nexus && Nexus.users) || []), ...((window.Nexus && Nexus.cloudAccounts) || [])];
        const raw = String(identifier || "").trim();
        const clean = raw.toLowerCase().replace(/^@/, "").replace(/\.+$/, "").trim();
        const alpha = clean.replace(/[^a-z0-9]/g, "");

        if (clean && clean !== "member") {
            const exact = pools.find((u) => u && u.username && (normU(u.username) === clean || normU(u.name) === clean));
            if (exact) return exact;
            const partial = pools.find((u) => {
                if (!u || !u.username) return false;
                const uN = normU(u.username), dN = normU(u.name);
                return (clean.length >= 2 && (uN.startsWith(clean) || dN.startsWith(clean))) ||
                    (alpha.length >= 3 && (uN.replace(/[^a-z0-9]/g, "").startsWith(alpha) || dN.replace(/[^a-z0-9]/g, "").startsWith(alpha)));
            });
            if (partial) return partial;
        }
        if (cardImgSrc && cardImgSrc.length > 35) {
            const dpHit = pools.find((u) => u && u.dp && u.dp.slice(0, 120) === cardImgSrc.slice(0, 120));
            if (dpHit) return dpHit;
        }
        if (clean && clean !== "member") {
            const posts = (window.Nexus && Array.isArray(Nexus.posts)) ? Nexus.posts : [];
            const pHit = posts.find((p) => p && (normU(p.username) === clean || normU(p.author) === clean));
            if (pHit) return { username: normU(pHit.username || clean), name: pHit.author || pHit.username || raw, bio: pHit.bio || "", dp: pHit.dp || "", followersList: [], followingList: [] };
        }
        return null;
    }

    // 7. UNIFIED STORY BAR PRESENCE SYNC & SINGLE-CARD CLICK HANDLER (PRESERVED!)
    function syncUnifiedStoryBarPresence() {
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
            if (card.children.length < 2 || card.clientWidth > 135 || card.clientHeight < 65) return;
            const lines = (card.innerText || "").split("\n").map((l) => l.trim()).filter(Boolean);
            if (!lines.length) return;
            const rawName = lines[lines.length - 1].toLowerCase().replace(/\.+$/, "").trim();
            if (rawName === "member") { card.style.display = "none"; return; }
            if (!rawName || rawName.includes("nexus")) return;
            const matched = findUserObjectByAnyIdentifier(rawName);
            if (!matched) return;

            const isLive = isUserTrulyOnlineRightNow(matched);
            const realLabel = isLive ? "🟢 Live" : window.formatRealNexusLastSeen(extractTrueTimestamp(matched), false);
            let badgeFound = false;
            card.querySelectorAll("span, div, small").forEach((badge) => {
                if (badge.children.length > 0 || badge.classList.contains("nx-dm-open-pill-hidden")) return;
                const bt = (badge.innerText || "").trim();
                if (bt.endsWith("ago") || bt === "Live" || bt === "🟢 Live" || bt === "Offline" || bt === "Active") {
                    if (badgeFound) { badge.style.display = "none"; return; }
                    badgeFound = true;
                    if (isLive) {
                        badge.innerText = "🟢 Live";
                        badge.style.cssText = "background:#064e3b;border:1.5px solid #10b981;color:#34d399;border-radius:999px;padding:1px 7px;font-weight:900;display:inline-block;";
                    } else if (realLabel) {
                        badge.innerText = realLabel;
                        badge.style.cssText = "background:#0f172a;border:1px solid #38bdf8;color:#e0f2fe;border-radius:999px;padding:1px 7px;display:inline-block;";
                    }
                }
            });
        });
    }
    setInterval(syncUnifiedStoryBarPresence, 600);

    document.addEventListener("click", (e) => {
        const storyBar = document.getElementById("nx-stories-bar");
        if (!storyBar || !storyBar.contains(e.target)) return;
        let el = e.target, singleCard = null;
        while (el && el !== storyBar) {
            const r = el.getBoundingClientRect();
            const imgs = el.querySelectorAll("img").length;
            if (r.width >= 44 && r.width <= 135 && r.height >= 50 && r.height <= 165 && imgs <= 1) singleCard = el;
            else if (r.width > 150) break;
            el = el.parentElement;
        }
        if (!singleCard) return;
        const fullTxt = (singleCard.innerText || "").toLowerCase();
        if (fullTxt.includes("nexus") && fullTxt.includes("official")) return;
        let handle = singleCard.getAttribute("data-username") || "";
        const imgEl = singleCard.querySelector("img");
        const imgSrc = imgEl ? (imgEl.getAttribute("src") || "") : "";
        if (!handle) {
            const lines = (singleCard.innerText || "").split("\n").map((l) => l.trim()).filter((l) => l && !l.endsWith("ago") && l !== "Live" && l !== "🟢 Live" && l !== "Official" && !l.includes("DM Open"));
            handle = lines[lines.length - 1] || "";
        }
        if (handle || imgSrc) {
            e.preventDefault(); e.stopPropagation();
            if (typeof window.openPublicUserProfileModal === "function") window.openPublicUserProfileModal(handle, imgSrc);
        }
    }, true);

    // 8. DIRECT 1:1 DM LAUNCHER & GROUP/DM ⋮ 3-DOT CAPTURE ROUTER (NO DOUBLE MENU!)
    window.openDirect1to1ChatWithUser = function (targetIdentifier) {
        if (!isUserVerified()) return openLoginIfNeeded("login");
        const uObj = findUserObjectByAnyIdentifier(targetIdentifier) || { username: normU(targetIdentifier), name: String(targetIdentifier || "") };
        if (!uObj || !uObj.username) return;
        const tU = normU(uObj.username);
        ["nx-public-profile-modal", "nx-follow-list-modal", "nx-avatar-zoom-overlay"].forEach((id) => document.getElementById(id)?.remove());
        window.CURRENT_NXS_PARTNER = tU;
        if (window.NexusDM && typeof NexusDM.openDirectChat === "function") {
            NexusDM.openDirectChat(tU, uObj.name || tU, uObj.dp || "");
        }
    };

    document.addEventListener("click", function (e) {
        const btn = e.target.closest("button");
        if (!btn) return;
        const txt = (btn.innerText || "").trim();
        if (txt !== "⋮" && txt !== "•••") return;
        if (btn.classList.contains("nx-dm-message-menu-btn") || btn.closest(".nx-dm-bubble-anim")) return;

        const dmRoot = document.getElementById("nx-dm-dedicated-root");
        const grpRoom = document.getElementById("nx-chat-room");
        if (dmRoot && dmRoot.contains(btn)) {
            e.preventDefault(); e.stopPropagation();
            if (window.NexusDM && typeof NexusDM.openHeaderSuperMenu === "function") NexusDM.openHeaderSuperMenu();
            return;
        }
        if (grpRoom && grpRoom.contains(btn)) {
            e.preventDefault(); e.stopPropagation();
            if (window.NexusDotsMenu && typeof NexusDotsMenu.openGroupMenu === "function") NexusDotsMenu.openGroupMenu();
            const gModal = document.getElementById("nx-global-modal");
            if (gModal) { gModal.style.zIndex = "250000"; gModal.style.display = "flex"; }
        }
    }, true);

    // 9. CUSTOM OFFICIAL VIDEO PLAYER + VIEWPORT AUTO-PAUSE + CLEAN HOME FEED
    async function recordRealPostView(postObj) {
        const myKey = getMyUsername();
        if (!postObj || !postObj.id || !myKey) return;
        const arr = cleanUniqueList(postObj.viewedBy || []);
        if (!arr.includes(myKey)) {
            arr.push(myKey);
            postObj.viewedBy = arr;
            postObj.views = Math.max(Number(postObj.views || 0) + 1, arr.length);
            persistPostUpdate(postObj, { views_count: postObj.views });
        }
    }

    const feedVideoViewportObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const v = entry.target;
            if (!entry.isIntersecting && !v.paused) v.pause();
        });
    }, { threshold: 0.35 });

    function bindNexusOfficialVideoControls(containerEl) {
        if (!containerEl) return;
        containerEl.querySelectorAll(".nx-official-video-player").forEach((player) => {
            if (player.dataset.nxVideoControlsBound === "1") return;
            player.dataset.nxVideoControlsBound = "1";
            const video = player.querySelector("video.nx-official-video");
            const playButtons = player.querySelectorAll("[data-nx-video-play], [data-nx-video-center-play]");
            const centerButton = player.querySelector("[data-nx-video-center-play]");
            const seek = player.querySelector("[data-nx-video-seek]");
            const timeLabel = player.querySelector("[data-nx-video-time]");
            const muteButton = player.querySelector("[data-nx-video-mute]");
            const fullscreenButton = player.querySelector("[data-nx-video-fullscreen]");
            if (!video) return;

            feedVideoViewportObserver.observe(video);
            const fmtT = (val) => {
                if (!Number.isFinite(val)) return "0:00";
                const s = Math.max(0, Math.floor(val));
                return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
            };
            const update = () => {
                const dur = Number.isFinite(video.duration) ? video.duration : 0;
                if (seek && dur > 0) seek.value = String(Math.round((video.currentTime / dur) * 1000));
                if (timeLabel) timeLabel.textContent = fmtT(video.currentTime) + " / " + fmtT(dur);
                player.querySelectorAll("[data-nx-video-play]").forEach((b) => { b.textContent = video.paused ? "▶" : "Ⅱ"; });
                if (centerButton) centerButton.style.display = video.paused ? "flex" : "none";
                if (muteButton) muteButton.textContent = video.muted ? "🔇" : "🔊";
            };
            const togglePlay = async (ev) => {
                if (ev) { ev.preventDefault(); ev.stopPropagation(); }
                if (video.paused) {
                    document.querySelectorAll("video.nx-official-video").forEach((other) => { if (other !== video) other.pause(); });
                    try { await video.play(); } catch (e) {}
                } else video.pause();
                update();
            };
            playButtons.forEach((b) => b.addEventListener("click", togglePlay));
            video.addEventListener("click", togglePlay);
            ["play", "pause", "timeupdate", "loadedmetadata", "durationchange", "ended", "volumechange"].forEach((evt) => video.addEventListener(evt, update));
            if (seek) {
                seek.addEventListener("input", (ev) => {
                    ev.stopPropagation();
                    if (Number.isFinite(video.duration) && video.duration > 0) video.currentTime = (Number(seek.value) / 1000) * video.duration;
                    update();
                });
                seek.addEventListener("click", (ev) => ev.stopPropagation());
            }
            if (muteButton) muteButton.addEventListener("click", (ev) => { ev.preventDefault(); ev.stopPropagation(); video.muted = !video.muted; update(); });
            if (fullscreenButton) fullscreenButton.addEventListener("click", async (ev) => {
                ev.preventDefault(); ev.stopPropagation();
                try { if (document.fullscreenElement) await document.exitFullscreen(); else if (player.requestFullscreen) await player.requestFullscreen(); } catch (e) {}
            });
            update();
        });
    }

    function buildScrollablePostCardsHtml(postsArray, ownerUserObj) {
        const myKey = getMyUsername();
        return postsArray.map((p, idx) => {
            recordRealPostView(p);
            const pOwnerName = p.author || (ownerUserObj && (ownerUserObj.name || ownerUserObj.username)) || "Member";
            const pOwnerUname = normU(p.username || (ownerUserObj && ownerUserObj.username) || "member");
            const uMatch = findUserObjectByAnyIdentifier(pOwnerUname);
            const dpUrl = (ownerUserObj && ownerUserObj.dp) || (uMatch && uMatch.dp) || p.dp || "";
            const authorBio = (uMatch && uMatch.bio) || p.bio || "";
            const img = p.image || p.videoUrl || "";
            const isVid = p.mediaType === "video" || /^data:video\/|^blob:/i.test(img) || /\.(mp4|webm|mov)(\?|$)/i.test(img);

            const av = dpUrl
                ? `<img src="${esc(dpUrl)}" loading="lazy" decoding="async" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:1.5px solid #10b981;flex-shrink:0;">`
                : `<div style="width:40px;height:40px;border-radius:50%;background:#10b981;color:#020617;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${esc(pOwnerName[0].toUpperCase())}</div>`;

            let mediaHtml = "";
            if (img && !String(img).startsWith("NX_VIDEO_STREAM:")) {
                if (isVid) {
                    mediaHtml = `<div class="nx-official-video-player" style="position:relative;width:100%;background:#000;border-top:1px solid #1e293b;border-bottom:1px solid #1e293b;overflow:hidden;">
                        <video class="nx-official-video" src="${esc(img)}" playsinline webkit-playsinline muted preload="metadata" disablepictureinpicture controlslist="nodownload noplaybackrate" style="width:100%;max-height:460px;min-height:220px;display:block;object-fit:contain;background:#000;"></video>
                        <button type="button" data-nx-video-center-play style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:62px;height:62px;border:1px solid rgba(255,255,255,.35);border-radius:50%;background:rgba(15,23,42,.84);color:#fff;font-size:25px;font-weight:900;display:flex;align-items:center;justify-content:center;z-index:3;cursor:pointer;">▶</button>
                        <div style="position:absolute;left:0;right:0;bottom:0;padding:34px 12px 10px;background:linear-gradient(transparent,rgba(0,0,0,.9));display:flex;align-items:center;gap:8px;z-index:4;">
                            <button type="button" data-nx-video-play style="border:0;background:transparent;color:#fff;font-size:18px;font-weight:900;padding:5px;cursor:pointer;">▶</button>
                            <span data-nx-video-time style="color:#fff;font-size:11px;font-weight:700;min-width:68px;">0:00 / 0:00</span>
                            <input data-nx-video-seek type="range" min="0" max="1000" value="0" style="flex:1;min-width:24px;accent-color:#10b981;height:4px;">
                            <button type="button" data-nx-video-mute style="border:0;background:transparent;color:#fff;font-size:17px;padding:5px;cursor:pointer;">🔇</button>
                            <button type="button" data-nx-video-fullscreen style="border:0;background:transparent;color:#fff;font-size:19px;padding:5px;cursor:pointer;">⛶</button>
                        </div>
                    </div>`;
                } else {
                    mediaHtml = `<div class="nx-feed-photo-open" data-fidx="${idx}" style="position:relative;width:100%;background:#090d16;border-top:1px solid #1e293b;border-bottom:1px solid #1e293b;cursor:pointer;">
                        <img src="${esc(img)}" loading="lazy" decoding="async" style="width:100%;max-height:520px;object-fit:cover;display:block;">
                        <span style="position:absolute;top:12px;right:12px;background:rgba(9,13,22,.85);border:1px solid #38bdf8;color:#e0f2fe;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:800;">🔍 Full View</span>
                    </div>`;
                }
            }

            const postSongHtml = (p.songUrl && p.songTitle)
                ? `<div class="nx-real-post-song-bar" data-song-url="${esc(p.songUrl)}" style="margin:6px 14px;padding:7px 12px;border-radius:12px;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.35);display:flex;align-items:center;justify-content:space-between;cursor:pointer;">
                       <span style="font-size:12px;font-weight:800;color:#34d399;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">🎵 ${esc(p.songTitle)}</span>
                       <span class="nx-ps-state" style="background:#10b981;color:#020617;padding:2px 9px;border-radius:99px;font-size:11px;font-weight:900;">▶ Play</span>
                   </div>` : "";

            const likedByArr = cleanUniqueList(p.likedBy || []);
            const isLikedByMe = Boolean(myKey && likedByArr.includes(myKey));
            const realLikesCount = Math.max(likedByArr.length, Number(p.likes || 0));
            const realViewsCount = Math.max(cleanUniqueList(p.viewedBy || []).length, Number(p.views || 1), realLikesCount);
            const commentsArr = Array.isArray(p.comments) ? p.comments : [];
            const timeLabel = window.formatRealNexusLastSeen(p.createdAt, false) || "Recent";
            const likedBanner = realLikesCount > 0
                ? `<div class="nx-real-likers-bar" data-fidx="${idx}" style="margin:10px 14px 2px;padding:8px 12px;border-radius:12px;background:rgba(244,63,94,.12);border:1px solid rgba(244,63,94,.3);display:flex;align-items:center;justify-content:space-between;cursor:pointer;">
                       <span style="font-size:12px;font-weight:800;color:#fda4af;">❤️ Liked by <strong>@${esc(likedByArr[0] || pOwnerUname)}</strong>${realLikesCount > 1 ? ` + ${realLikesCount - 1} others` : ""}</span>
                       <span style="font-size:11.5px;font-weight:900;color:#38bdf8;">View All →</span>
                   </div>` : "";

            const bp = "padding:7px 12px;border-radius:999px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;font-size:12px;font-weight:800;display:inline-flex;align-items:center;gap:5px;cursor:pointer;";
            return `<article id="nx-feed-post-card-${idx}" class="nx-v31-post-card">
                <div style="padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
                    <div data-card-author="${esc(pOwnerUname)}" style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;cursor:pointer;">
                        ${av}
                        <div style="min-width:0;flex:1;">
                            <div style="font-size:14px;font-weight:900;color:#f8fafc;display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
                                <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(pOwnerName)}</span>
                                <span style="background:#10b981;color:#020617;font-size:9.5px;font-weight:900;padding:1px 5px;border-radius:99px;">✓</span>
                                ${p.pinned ? `<span style="background:rgba(245,158,11,.18);border:1px solid #fbbf24;color:#fbbf24;font-size:9.5px;padding:1px 6px;border-radius:99px;">📌 PINNED</span>` : ""}
                            </div>
                            <div style="font-size:11px;color:#38bdf8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${authorBio ? esc(authorBio) + " • " : "@" + esc(pOwnerUname) + " • "}${esc(timeLabel)}</div>
                        </div>
                    </div>
                    <button type="button" class="nx-feed-card-3dot" data-fidx="${idx}" style="width:34px;height:34px;border-radius:50%;background:#1e293b;border:1px solid #334155;color:#f8fafc;font-size:17px;font-weight:900;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;">⋮</button>
                </div>
                ${postSongHtml}
                ${p.content ? `<div style="padding:${p.cardGradient ? "28px 18px" : "2px 15px 12px"};background:${p.cardGradient || "transparent"};text-align:${p.cardGradient ? "center" : "left"};font-size:${p.cardGradient ? "17px" : "13.5px"};font-weight:${p.cardGradient ? "900" : "500"};color:#f1f5f9;line-height:1.5;white-space:pre-line;word-break:break-word;">${esc(p.content)}</div>` : ""}
                ${mediaHtml}
                ${likedBanner}
                <div style="padding:10px 12px 12px;display:flex;align-items:center;justify-content:space-between;gap:6px;flex-wrap:wrap;">
                    <button type="button" class="nx-feed-like-btn" data-fidx="${idx}" style="${bp}${isLikedByMe ? "background:rgba(244,63,94,.18);border-color:#f43f5e;color:#f43f5e;" : ""}"><span>${isLikedByMe ? "❤️" : "🤍"}</span><span>${realLikesCount}</span></button>
                    <button type="button" class="nx-feed-comment-btn" data-fidx="${idx}" style="${bp}"><span>💬</span><span>${commentsArr.length}</span></button>
                    <button type="button" class="nx-feed-views-btn" data-fidx="${idx}" style="${bp}"><span>👁️</span><span>${realViewsCount}</span></button>
                    <button type="button" class="nx-feed-save-btn" data-fidx="${idx}" style="${bp}" title="Save to Vault"><span>⚡</span></button>
                    <button type="button" class="nx-feed-share-btn" data-fidx="${idx}" style="${bp}color:#38bdf8;"><span>Share</span></button>
                </div>
            </article>`;
        }).join("");
    }

    function bindRealPostCardEvents(containerEl, postsArray, refreshFn) {
        if (!containerEl) return;
        bindNexusOfficialVideoControls(containerEl);

        containerEl.querySelectorAll(".nx-real-post-song-bar").forEach((bar) => {
            bar.onclick = (e) => {
                e.stopPropagation();
                if (window.togglePlayProfileSong) window.togglePlayProfileSong(bar.getAttribute("data-song-url"), bar.querySelector(".nx-ps-state"));
            };
        });
        containerEl.querySelectorAll("[data-card-author]").forEach((el) => {
            el.onclick = (e) => { e.stopPropagation(); if (window.openPublicUserProfileModal) window.openPublicUserProfileModal(el.getAttribute("data-card-author")); };
        });
        containerEl.querySelectorAll(".nx-feed-photo-open").forEach((wrap) => {
            wrap.onclick = (e) => {
                e.stopPropagation();
                const p = postsArray[Number(wrap.getAttribute("data-fidx"))];
                if (p && p.image && window.openNexusHdMediaLightbox) window.openNexusHdMediaLightbox(p.image, p);
            };
        });
        containerEl.querySelectorAll(".nx-feed-card-3dot").forEach((btn) => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const p = postsArray[Number(btn.getAttribute("data-fidx"))];
                if (p && window.openSystematicPostThreeDotSheet) window.openSystematicPostThreeDotSheet(p, refreshFn);
            };
        });
        containerEl.querySelectorAll(".nx-feed-like-btn").forEach((btn) => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                if (!isUserVerified()) return openLoginIfNeeded("login");
                const p = postsArray[Number(btn.getAttribute("data-fidx"))], myKey = getMyUsername();
                if (!p || !myKey) return;
                let arr = cleanUniqueList(p.likedBy || []);
                if (arr.includes(myKey)) arr = arr.filter((u) => u !== myKey); else arr.push(myKey);
                p.likedBy = arr; p.likes = arr.length;
                if (refreshFn) refreshFn();
                await persistPostUpdate(p, { likes_list: arr });
            };
        });
        containerEl.querySelectorAll(".nx-real-likers-bar").forEach((bar) => {
            bar.onclick = (e) => { e.stopPropagation(); const p = postsArray[Number(bar.getAttribute("data-fidx"))]; if (p && window.openPostLikersModal) window.openPostLikersModal(p); };
        });
        containerEl.querySelectorAll(".nx-feed-comment-btn").forEach((btn) => {
            btn.onclick = (e) => { e.stopPropagation(); const p = postsArray[Number(btn.getAttribute("data-fidx"))]; if (p && window.openRealPostCommentsDrawer) window.openRealPostCommentsDrawer(p, refreshFn); };
        });
        containerEl.querySelectorAll(".nx-feed-views-btn").forEach((btn) => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const p = postsArray[Number(btn.getAttribute("data-fidx"))];
                if (p && window.openFollowersFollowingModal) window.openFollowersFollowingModal("👁️ Post Viewed By", cleanUniqueList([...(p.viewedBy || []), ...(p.likedBy || []), p.username]));
            };
        });
        containerEl.querySelectorAll(".nx-feed-save-btn").forEach((btn) => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const p = postsArray[Number(btn.getAttribute("data-fidx"))]; if (!p) return;
                let sv = []; try { sv = JSON.parse(localStorage.getItem("nx_saved_posts") || "[]"); } catch (err) {}
                if (!sv.some((x) => x && x.id === p.id)) { sv.unshift(p); localStorage.setItem("nx_saved_posts", JSON.stringify(sv.slice(0, 50))); }
                if (window.Nexus && Nexus.toast) Nexus.toast("⚡ Saved to Nexus Vault!");
            };
        });
        containerEl.querySelectorAll(".nx-feed-share-btn").forEach((btn) => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const p = postsArray[Number(btn.getAttribute("data-fidx"))];
                const url = `${location.origin}${location.pathname}?post=${encodeURIComponent((p && p.id) || "")}`;
                if (navigator.share) navigator.share({ title: `Post by @${(p && p.username) || "nexus"}`, text: (p && p.content) || "Nexus Community Post", url }).catch(() => {});
                else { navigator.clipboard?.writeText(url); if (window.Nexus && Nexus.toast) Nexus.toast("🔗 Post Link Copied!"); }
            };
        });
    }

    function renderCleanZeroOverlapHomeFeed(forceRebuild) {
        const homeTab = document.getElementById("tab-home");
        if (!homeTab || !window.Nexus || !Array.isArray(Nexus.posts)) return;
        const firstChild = homeTab.firstElementChild;
        if (firstChild && firstChild.id !== "nx-clean-home-feed-v31" && !document.getElementById("nx-stories-bar")) firstChild.id = "nx-stories-bar";

        const seen = new Set();
        const validPosts = Nexus.posts
            .map((p) => (p && p.author_username && !p.username ? normalizeSupabasePost(p) : p))
            .filter((p) => {
                if (!isRealValidPost(p)) return false;
                const sig = `${p.id || p.username}::${(p.content || "").slice(0, 40)}::${(p.image || "").slice(0, 80)}`;
                if (seen.has(sig)) return false;
                seen.add(sig); return true;
            })
            .sort((a, b) => ((b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)) || (Number(b.createdAt || 0) - Number(a.createdAt || 0)));

        const hash = validPosts.map((p) => `${p.id}:${p.likes}:${(p.likedBy || []).length}:${(p.comments || []).length}:${p.pinned ? 1 : 0}:${(p.content || "").slice(0, 15)}`).join("|");
        let feedBox = document.getElementById("nx-clean-home-feed-v31");
        if (!feedBox) { feedBox = document.createElement("div"); feedBox.id = "nx-clean-home-feed-v31"; homeTab.appendChild(feedBox); forceRebuild = true; }
        if (!forceRebuild && hash === lastRenderedHomeHash && feedBox.children.length > 0) return;
        lastRenderedHomeHash = hash;

        if (!validPosts.length) {
            feedBox.innerHTML = `<div style="text-align:center;padding:36px 16px;color:#94a3b8;font-size:13px;">⏳ Loading real community posts...</div>`;
            return;
        }
        feedBox.innerHTML = buildScrollablePostCardsHtml(validPosts, null);
        bindRealPostCardEvents(feedBox, validPosts, () => renderCleanZeroOverlapHomeFeed(true));
    }

    window.renderHomeFeedTab = () => renderCleanZeroOverlapHomeFeed(true);
    setInterval(() => renderCleanZeroOverlapHomeFeed(false), 550);
    setTimeout(() => syncSupabaseUsersAndPosts(true), 450);
    setInterval(() => syncSupabaseUsersAndPosts(false), 20000);

    // Export shared core for Part 2 cleanly
    window.__NX_PROF_CORE__ = {
        normU, esc, getSec, getSb, THEME_ACCENTS, getThemeAccent, getExtraProfileMeta, saveExtraProfileMeta,
        cleanUniqueList, getActiveUser, getMyUsername, isUserVerified, openLoginIfNeeded, isStrictOwnerOfPost,
        getNormalizedProfileSong, normalizeSupabaseUser, normalizeSupabasePost, isRealValidPost,
        syncSupabaseUsersAndPosts, crossSyncAllFollowersAndSongs, persistPostUpdate, persistFollowToggle,
        extractTrueTimestamp, isUserTrulyOnlineRightNow, findUserObjectByAnyIdentifier,
        recordRealPostView, buildScrollablePostCardsHtml, bindRealPostCardEvents, renderCleanZeroOverlapHomeFeed
    };
})();
/* ============================================================================
   NEXUS OFFICIAL PROFILE.JS (V41 FINAL UNCUT MASTER — PART 2 OF 2)
   HD Lightbox + Connections + Comments + QR & Canvas PNG Card + Full Song Picker
   + Inline Caption Editor + Long-Press Zoom + Public Profile (Mutuals + Calls)
   + Analytics Studio + Cover Banner + 5 Accent Themes + Main Profile Tab
   ============================================================================ */
(function () {
    if (window.__NEXUS_PROFILE_V41_PART2__) return;
    window.__NEXUS_PROFILE_V41_PART2__ = true;

    const C = window.__NX_PROF_CORE__;
    if (!C) return console.error("profile.js Part 1 missing!");

    let currentProfileTabMode = "posts"; // 'posts' | 'videos' | 'vault'
    let currentPublicTabMode = "grid";   // 'grid' | 'feed' | 'videos'
    let activeSongAudio = null;
    let activeSongBtn = null;
    let longPressTimer = null;

    // 1. HD MEDIA LIGHTBOX VIEWER (ZOOM 1x/2x/3x + DOUBLE-TAP HEART + SAVE + VAULT + SHARE)
    window.openNexusHdMediaLightbox = function (imgSrc, postObj) {
        if (!imgSrc || String(imgSrc).startsWith("NX_VIDEO_STREAM:")) return;
        document.getElementById("nx-hd-media-lightbox")?.remove();
        window.__nxPushBackLayer("nx-hd-media-lightbox", () => document.getElementById("nx-hd-media-lightbox")?.remove());

        const p = postObj || { author: "Nexus", username: "nexus_official", content: "", likes: 0, likedBy: [], viewedBy: [], comments: [], views: 1 };
        C.recordRealPostView(p);
        let zoomLevel = 1, lastTapTime = 0;

        const overlay = document.createElement("div");
        overlay.id = "nx-hd-media-lightbox";
        overlay.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,.97);z-index:268000;display:flex;flex-direction:column;justify-content:space-between;color:#fff;user-select:none;backdrop-filter:blur(12px);";

        const renderLb = () => {
            const myK = C.getMyUsername();
            const likedArr = C.cleanUniqueList(p.likedBy || []);
            const isLiked = Boolean(myK && likedArr.includes(myK));
            const likesCnt = Math.max(likedArr.length, Number(p.likes || 0));
            const commCnt = Array.isArray(p.comments) ? p.comments.length : 0;
            const viewCnt = Math.max(C.cleanUniqueList(p.viewedBy || []).length, Number(p.views || 1), likesCnt);

            overlay.innerHTML = `
                <div style="padding:12px 16px;background:rgba(9,13,22,.92);border-bottom:1px solid #1e293b;display:flex;align-items:center;justify-content:space-between;">
                    <div style="display:flex;align-items:center;gap:10px;cursor:pointer;" id="nx-lb-auth">
                        <button type="button" id="nx-lb-close" style="background:#1e293b;border:none;color:#f8fafc;width:32px;height:32px;border-radius:50%;font-size:16px;font-weight:900;cursor:pointer;">←</button>
                        <div><div style="font-size:14px;font-weight:900;">${C.esc(p.author || p.username)} ✅</div><div style="font-size:11px;color:#34d399;">@${C.esc(p.username)} • Double-Tap Photo to ❤️</div></div>
                    </div>
                    <div style="display:flex;align-items:center;gap:7px;">
                        <button type="button" id="nx-lb-zoom" style="padding:6px 11px;border-radius:10px;background:#1e293b;border:1px solid #334155;color:#38bdf8;font-size:11.5px;font-weight:900;cursor:pointer;">🔍 ${zoomLevel}x</button>
                        <a href="${C.esc(imgSrc)}" download="nexus_hd_post.jpg" target="_blank" style="padding:6px 11px;border-radius:10px;background:#1e293b;border:1px solid #334155;color:#34d399;font-size:12px;font-weight:900;text-decoration:none;">⬇️ Save</a>
                    </div>
                </div>
                <div id="nx-lb-stage" style="flex:1;position:relative;display:flex;align-items:center;justify-content:center;overflow:auto;padding:10px;">
                    <img id="nx-lb-img" src="${C.esc(imgSrc)}" style="max-width:100%;max-height:74dvh;border-radius:14px;object-fit:contain;transition:transform .2s;transform:scale(${zoomLevel});box-shadow:0 16px 50px rgba(0,0,0,.85);">
                    <div id="nx-lb-heart" style="display:none;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:86px;pointer-events:none;z-index:20;">❤️</div>
                </div>
                <div style="padding:12px 16px 20px;background:rgba(9,13,22,.95);border-top:1px solid #1e293b;">
                    ${p.content ? `<div style="font-size:13px;color:#e2e8f0;margin-bottom:10px;max-height:60px;overflow-y:auto;">${C.esc(p.content)}</div>` : ""}
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:7px;flex-wrap:wrap;">
                        <button type="button" id="nx-lb-like" style="padding:8px 14px;border-radius:999px;background:${isLiked ? "rgba(244,63,94,.2)" : "#1e293b"};border:1px solid ${isLiked ? "#f43f5e" : "#334155"};color:${isLiked ? "#f43f5e" : "#fff"};font-size:13px;font-weight:900;cursor:pointer;">${isLiked ? "❤️" : "🤍"} ${likesCnt}</button>
                        <button type="button" id="nx-lb-comm" style="padding:8px 14px;border-radius:999px;background:#1e293b;border:1px solid #334155;color:#fff;font-size:13px;font-weight:800;cursor:pointer;">💬 ${commCnt}</button>
                        <button type="button" id="nx-lb-views" style="padding:8px 13px;border-radius:999px;background:#1e293b;border:1px solid #334155;color:#94a3b8;font-size:12.5px;font-weight:800;cursor:pointer;">👁️ ${viewCnt}</button>
                        <button type="button" id="nx-lb-vault" style="padding:8px 13px;border-radius:999px;background:#1e293b;border:1px solid #334155;color:#fbbf24;font-size:12.5px;font-weight:900;cursor:pointer;">⚡ Vault</button>
                        <button type="button" id="nx-lb-share" style="padding:8px 14px;border-radius:999px;background:#10b981;border:none;color:#020617;font-size:12.5px;font-weight:900;cursor:pointer;">Share 🔗</button>
                    </div>
                </div>`;

            overlay.querySelector("#nx-lb-close").onclick = (e) => { e.stopPropagation(); overlay.remove(); };
            overlay.querySelector("#nx-lb-auth").onclick = (e) => { if (e.target.id === "nx-lb-close") return; overlay.remove(); if (p.username) window.openPublicUserProfileModal(p.username); };
            overlay.querySelector("#nx-lb-zoom").onclick = () => {
                zoomLevel = zoomLevel === 1 ? 2 : zoomLevel === 2 ? 3 : 1;
                overlay.querySelector("#nx-lb-img").style.transform = `scale(${zoomLevel})`;
                overlay.querySelector("#nx-lb-zoom").innerText = `🔍 ${zoomLevel}x`;
            };
            const toggleLike = async (forceLike) => {
                if (!C.isUserVerified()) return C.openLoginIfNeeded("login");
                const mk = C.getMyUsername(); let arr = C.cleanUniqueList(p.likedBy || []);
                if (arr.includes(mk)) { if (forceLike) return; arr = arr.filter((x) => x !== mk); } else arr.push(mk);
                p.likedBy = arr; p.likes = arr.length;
                renderLb(); C.renderCleanZeroOverlapHomeFeed(true);
                await C.persistPostUpdate(p, { likes_list: arr });
            };
            overlay.querySelector("#nx-lb-stage").onclick = () => {
                const now = Date.now();
                if (now - lastTapTime < 320) {
                    const h = overlay.querySelector("#nx-lb-heart");
                    if (h) { h.style.display = "block"; h.style.animation = "nxHeartPop .75s ease forwards"; }
                    try { if (navigator.vibrate) navigator.vibrate(25); } catch (e) {}
                    setTimeout(() => toggleLike(true), 220);
                }
                lastTapTime = now;
            };
            overlay.querySelector("#nx-lb-like").onclick = () => toggleLike(false);
            overlay.querySelector("#nx-lb-comm").onclick = () => window.openRealPostCommentsDrawer(p, () => { renderLb(); C.renderCleanZeroOverlapHomeFeed(true); });
            overlay.querySelector("#nx-lb-views").onclick = () => window.openFollowersFollowingModal("👁️ Post Viewed By", C.cleanUniqueList([...(p.viewedBy || []), ...(p.likedBy || []), p.username]));
            overlay.querySelector("#nx-lb-vault").onclick = () => {
                let sv = JSON.parse(localStorage.getItem("nx_saved_posts") || "[]");
                if (!sv.some((x) => x && x.id === p.id)) { sv.unshift(p); localStorage.setItem("nx_saved_posts", JSON.stringify(sv.slice(0, 50))); }
                if (window.Nexus && Nexus.toast) Nexus.toast("⚡ Saved to Nexus Vault!");
            };
            overlay.querySelector("#nx-lb-share").onclick = () => {
                const url = `${location.origin}${location.pathname}?post=${encodeURIComponent(p.id || "")}`;
                if (navigator.share) navigator.share({ title: "Nexus Post", url }).catch(() => {});
                else { navigator.clipboard?.writeText(url); if (window.Nexus && Nexus.toast) Nexus.toast("🔗 Post Link Copied!"); }
            };
        };
        renderLb(); document.body.appendChild(overlay);
    };

    // 2. FULL-SCREEN CONNECTIONS MODAL (FOLLOWERS / FOLLOWING / SEARCH / SUGGESTED)
    window.openFullScreenConnectionsModal = function (targetUserObj, initialTab) {
        C.crossSyncAllFollowersAndSongs();
        const userObj = targetUserObj || C.getActiveUser() || { username: "nexus", name: "Nexus" };
        let activeTab = initialTab || "followers";
        document.getElementById("nx-follow-list-modal")?.remove();
        window.__nxPushBackLayer("nx-follow-list-modal", () => document.getElementById("nx-follow-list-modal")?.remove());

        const modal = document.createElement("div");
        modal.id = "nx-follow-list-modal";
        modal.style.cssText = "position:fixed;inset:0;background:#090d16;z-index:264000;display:flex;flex-direction:column;color:#fff;max-width:600px;margin:0 auto;box-shadow:0 0 60px rgba(0,0,0,.95);";

        const renderUI = (searchQuery = "") => {
            const me = C.getActiveUser(), myK = C.getMyUsername(), myFol = C.cleanUniqueList((me && me.followingList) || []);
            const f1 = C.cleanUniqueList(userObj.followersList || []), f2 = C.cleanUniqueList(userObj.followingList || []), fc = C.cleanUniqueList(userObj.customList || []);
            const raw = activeTab === "custom" ? fc : activeTab === "following" ? f2 : f1;
            const q = searchQuery.toLowerCase().trim();
            const list = raw.filter((u) => !q || u.includes(q));
            const suggested = ((window.Nexus && Nexus.users) || []).filter((u) => u && u.username && !raw.includes(C.normU(u.username)) && C.normU(u.username) !== myK).slice(0, 12);

            const buildRow = (uname) => {
                const uObj = C.findUserObjectByAnyIdentifier(uname) || { username: uname, name: uname };
                const uK = C.normU(uObj.username || uname), iF = myFol.includes(uK), live = C.isUserTrulyOnlineRightNow(uObj);
                const song = C.getNormalizedProfileSong(uObj);
                const av = uObj.dp
                    ? `<img src="${C.esc(uObj.dp)}" loading="lazy" style="width:46px;height:46px;border-radius:50%;object-fit:cover;border:2px solid ${live ? "#10b981" : "#334155"};flex-shrink:0;">`
                    : `<div style="width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,#10b981,#0284c7);color:#020617;font-weight:900;font-size:17px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${C.esc((uObj.name || uK)[0].toUpperCase())}</div>`;
                return `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 14px;border-radius:16px;background:#0f172a;border:1px solid #1e293b;margin-bottom:8px;">
                    <div data-vu="${C.esc(uK)}" style="display:flex;align-items:center;gap:11px;min-width:0;flex:1;cursor:pointer;">
                        ${av}
                        <div style="min-width:0;flex:1;">
                            <div style="display:flex;align-items:center;gap:5px;"><span style="font-size:14px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${C.esc(uObj.name || uK)}</span><span style="background:#10b981;color:#020617;font-size:9px;font-weight:900;padding:1px 5px;border-radius:99px;">✓</span>${live ? '<span style="width:7px;height:7px;border-radius:50%;background:#10b981;"></span>' : ""}</div>
                            <div style="font-size:11.5px;color:#38bdf8;font-weight:700;">@${C.esc(uK)}</div>
                            <div style="font-size:11px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${song ? "🎵 " + C.esc(song.title) : C.esc(uObj.bio || "")}</div>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                        ${uK !== myK ? `<button type="button" data-ft="${C.esc(uK)}" style="padding:7px 13px;border-radius:10px;background:${iF ? "#1e293b" : "#10b981"};color:${iF ? "#f8fafc" : "#020617"};border:${iF ? "1px solid #334155" : "none"};font-size:12px;font-weight:900;cursor:pointer;">${iF ? "Following ✓" : "Follow"}</button><button type="button" data-dm="${C.esc(uK)}" style="padding:7px 10px;border-radius:10px;background:#1e293b;border:1px solid #334155;color:#38bdf8;font-size:12px;cursor:pointer;">💬</button>` : `<span style="font-size:11px;font-weight:800;color:#34d399;padding:6px 10px;">You</span>`}
                    </div>
                </div>`;
            };

            modal.innerHTML = `
                <div style="padding:13px 16px;background:#0b1120;border-bottom:1px solid #1e293b;display:flex;align-items:center;gap:12px;">
                    <button type="button" id="nx-fl-close" style="background:none;border:none;color:#f8fafc;font-size:21px;font-weight:900;cursor:pointer;">←</button>
                    <div><div style="font-size:16px;font-weight:900;">@${C.esc(userObj.username)}</div><div style="font-size:11px;color:#34d399;font-weight:700;">Official Nexus Connections</div></div>
                </div>
                ${activeTab !== "custom" ? `<div style="display:grid;grid-template-columns:1fr 1fr;background:#0b1120;border-bottom:1px solid #1e293b;">
                    <button type="button" data-ct="followers" style="padding:12px;background:none;border:none;border-bottom:2.5px solid ${activeTab === "followers" ? "#10b981" : "transparent"};color:${activeTab === "followers" ? "#f8fafc" : "#64748b"};font-weight:900;font-size:13px;cursor:pointer;">👥 ${f1.length} Followers</button>
                    <button type="button" data-ct="following" style="padding:12px;background:none;border:none;border-bottom:2.5px solid ${activeTab === "following" ? "#10b981" : "transparent"};color:${activeTab === "following" ? "#f8fafc" : "#64748b"};font-weight:900;font-size:13px;cursor:pointer;">✨ ${f2.length} Following</button>
                </div>` : `<div style="padding:10px 16px;background:#0b1120;border-bottom:1px solid #1e293b;font-size:13.5px;font-weight:900;color:#38bdf8;">${C.esc(userObj.customTitle || "Members")} (${fc.length})</div>`}
                <div style="padding:10px 14px;"><input id="nx-cs-inp" value="${C.esc(searchQuery)}" placeholder="🔍 Search @username or name..." style="width:100%;padding:10px 14px;border-radius:12px;background:#0f172a;border:1px solid #1e293b;color:#fff;font-size:13px;outline:none;"></div>
                <div style="flex:1;overflow-y:auto;padding:6px 14px 40px;">
                    ${list.length ? list.map(buildRow).join("") : `<div style="text-align:center;padding:22px 12px;background:#0f172a;border:1px dashed #334155;border-radius:16px;margin-bottom:16px;"><div style="font-size:24px;">👥</div><div style="font-size:13.5px;font-weight:800;">No ${activeTab} yet</div></div>`}
                    ${suggested.length ? `<div style="font-size:11.5px;font-weight:900;color:#38bdf8;text-transform:uppercase;margin:16px 4px 10px;">🌟 Suggested Active Members</div>${suggested.map((u) => buildRow(u.username)).join("")}` : ""}
                </div>`;

            modal.querySelector("#nx-fl-close").onclick = () => modal.remove();
            modal.querySelectorAll("[data-ct]").forEach((b) => { b.onclick = () => { activeTab = b.getAttribute("data-ct"); renderUI(""); }; });
            const sInp = modal.querySelector("#nx-cs-inp"); if (sInp) sInp.oninput = () => renderUI(sInp.value);
            modal.querySelectorAll("[data-vu]").forEach((r) => { r.onclick = () => { modal.remove(); window.openPublicUserProfileModal(r.getAttribute("data-vu")); }; });
            modal.querySelectorAll("[data-dm]").forEach((b) => { b.onclick = (e) => { e.stopPropagation(); window.openDirect1to1ChatWithUser(b.getAttribute("data-dm")); }; });
            modal.querySelectorAll("[data-ft]").forEach((b) => {
                b.onclick = async (e) => {
                    e.stopPropagation();
                    if (!C.isUserVerified()) return C.openLoginIfNeeded("login");
                    const tObj = C.findUserObjectByAnyIdentifier(b.getAttribute("data-ft"));
                    if (tObj) { await C.persistFollowToggle(tObj); renderUI(sInp ? sInp.value : ""); }
                };
            });
        };
        renderUI(""); document.body.appendChild(modal);
    };

    window.openFollowersFollowingModal = (title, usernameList) => window.openFullScreenConnectionsModal({ username: "nexus", customTitle: title, customList: usernameList }, "custom");
    window.openPostLikersModal = (postObj) => postObj && window.openFollowersFollowingModal("❤️ Liked by", C.cleanUniqueList(postObj.likedBy || []));

    // 3. REAL COMMENTS DRAWER (WITH AVATARS, TIMESTAMPS & SUPABASE SYNC)
    window.openRealPostCommentsDrawer = function (postObj, onCommentChange) {
        if (!postObj) return;
        document.getElementById("nx-post-comments-drawer")?.remove();
        window.__nxPushBackLayer("nx-post-comments-drawer", () => document.getElementById("nx-post-comments-drawer")?.remove());

        const modal = document.createElement("div");
        modal.id = "nx-post-comments-drawer";
        modal.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,.9);z-index:269000;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(6px);";

        const renderC = () => {
            const comments = Array.isArray(postObj.comments) ? postObj.comments : [];
            const myK = C.getMyUsername(), isOwner = C.isStrictOwnerOfPost(postObj);
            const listHtml = comments.length ? comments.map((c, idx) => {
                const cU = C.normU(c.username || c.author || "user");
                const canDel = isOwner || (myK && cU === myK);
                const uM = C.findUserObjectByAnyIdentifier(cU);
                const dp = (uM && uM.dp) || c.dp || "";
                const av = dp ? `<img src="${C.esc(dp)}" loading="lazy" style="width:34px;height:34px;border-radius:50%;object-fit:cover;flex-shrink:0;">` : `<div style="width:34px;height:34px;border-radius:50%;background:#10b981;color:#020617;font-weight:900;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${C.esc((c.author || cU)[0].toUpperCase())}</div>`;
                return `<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:14px;background:#090d16;border:1px solid #1e293b;margin-bottom:8px;">
                    <div style="display:flex;align-items:flex-start;gap:10px;min-width:0;flex:1;">${av}<div style="min-width:0;flex:1;"><div style="display:flex;align-items:center;gap:6px;"><span data-cu="${C.esc(cU)}" style="font-size:12.5px;font-weight:900;color:#34d399;cursor:pointer;">@${C.esc(cU)}</span><span style="font-size:10px;color:#64748b;">• ${window.formatRealNexusLastSeen(c.createdAt || c.at || c.time, false) || "Just now"}</span></div><div style="font-size:13px;color:#f1f5f9;margin-top:3px;line-height:1.4;word-break:break-word;">${C.esc(c.text || c.content || "")}</div></div></div>
                    ${canDel ? `<button type="button" data-dc="${idx}" style="background:none;border:none;color:#f43f5e;font-size:12px;cursor:pointer;padding:4px;">🗑️</button>` : ""}
                </div>`;
            }).join("") : `<div style="text-align:center;padding:32px 12px;color:#64748b;font-size:13px;">💬 No comments yet. Be the first to comment!</div>`;

            modal.innerHTML = `<div style="background:#0f172a;border-top:1.5px solid #10b981;border-radius:24px 24px 0 0;width:100%;max-width:600px;max-height:84dvh;display:flex;flex-direction:column;padding:16px 16px 22px;color:#fff;">
                <div style="width:42px;height:4px;background:#334155;border-radius:999px;margin:0 auto 12px;"></div>
                <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:10px;border-bottom:1px solid #1e293b;margin-bottom:10px;"><h3 style="font-size:15.5px;font-weight:900;">💬 Comments (${comments.length})</h3><button type="button" id="nx-cm-x" style="width:30px;height:30px;border-radius:50%;background:#1e293b;border:none;color:#cbd5e1;font-weight:900;cursor:pointer;">✕</button></div>
                <div style="flex:1;overflow-y:auto;max-height:52dvh;">${listHtml}</div>
                <div style="display:flex;gap:8px;margin-top:12px;padding-top:10px;border-top:1px solid #1e293b;">
                    <input id="nx-cm-inp" placeholder="Add a real comment..." style="flex:1;padding:11px 14px;border-radius:999px;background:#090d16;border:1px solid #334155;color:#fff;font-size:13px;outline:none;">
                    <button type="button" id="nx-cm-go" style="padding:11px 18px;border-radius:999px;background:#10b981;color:#020617;font-weight:900;font-size:12.5px;border:none;cursor:pointer;">Post</button>
                </div>
            </div>`;
            modal.querySelector("#nx-cm-x").onclick = () => modal.remove();
            modal.querySelectorAll("[data-cu]").forEach((el) => { el.onclick = () => { modal.remove(); window.openPublicUserProfileModal(el.getAttribute("data-cu")); }; });
            modal.querySelectorAll("[data-dc]").forEach((b) => {
                b.onclick = async () => {
                    postObj.comments.splice(Number(b.getAttribute("data-dc")), 1);
                    await C.persistPostUpdate(postObj, { comments_list: postObj.comments });
                    renderC(); if (onCommentChange) onCommentChange();
                };
            });
            const inp = modal.querySelector("#nx-cm-inp");
            const submit = async () => {
                if (!C.isUserVerified()) { modal.remove(); return C.openLoginIfNeeded("login"); }
                const txt = inp.value.trim(); if (!txt) return;
                const me = C.getActiveUser();
                if (!Array.isArray(postObj.comments)) postObj.comments = [];
                postObj.comments.push({ username: me.username, author: me.name || me.username, dp: me.dp || "", text: txt, createdAt: Date.now() });
                inp.value = "";
                await C.persistPostUpdate(postObj, { comments_list: postObj.comments });
                renderC(); if (onCommentChange) onCommentChange();
            };
            modal.querySelector("#nx-cm-go").onclick = submit;
            inp.onkeydown = (e) => { if (e.key === "Enter") submit(); };
        };
        renderC(); document.body.appendChild(modal);
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    };

    // 4. QR DIGITAL ID MODAL + NEW: CANVAS HD DIGITAL ID CARD PNG GENERATOR!
    function downloadDigitalIdCardPng(userObj) {
        const c = document.createElement("canvas");
        c.width = 720; c.height = 420;
        const ctx = c.getContext("2d");
        const theme = C.getThemeAccent(userObj.themeColor);
        const grd = ctx.createLinearGradient(0, 0, 720, 420);
        grd.addColorStop(0, "#020617"); grd.addColorStop(1, "#0f172a");
        ctx.fillStyle = grd; ctx.fillRect(0, 0, 720, 420);
        ctx.strokeStyle = theme.primary; ctx.lineWidth = 8; ctx.strokeRect(14, 14, 692, 392);

        ctx.fillStyle = theme.glow; ctx.font = "bold 20px system-ui";
        ctx.fillText("⚡ NEXUS COMMUNITY • OFFICIAL VERIFIED MEMBER", 42, 66);
        ctx.fillStyle = "#ffffff"; ctx.font = "bold 46px system-ui";
        ctx.fillText((userObj.name || userObj.username).slice(0, 22), 42, 148);
        ctx.fillStyle = "#38bdf8"; ctx.font = "bold 28px system-ui";
        ctx.fillText("@" + userObj.username, 42, 192);
        ctx.fillStyle = "#cbd5e1"; ctx.font = "22px system-ui";
        ctx.fillText((userObj.bio || "Nexus Community Member ✨").slice(0, 52), 42, 246);
        ctx.fillStyle = "#94a3b8"; ctx.font = "bold 20px system-ui";
        ctx.fillText(`👥 ${(userObj.followersList || []).length} Followers   •   ✨ ${(userObj.followingList || []).length} Following`, 42, 315);
        ctx.fillStyle = theme.primary; ctx.font = "bold 18px system-ui";
        ctx.fillText("nexus-community01.vercel.app • 256-Bit E2EE Verified ✓", 42, 372);

        const a = document.createElement("a");
        a.href = c.toDataURL("image/png");
        a.download = `Nexus_ID_${userObj.username}.png`;
        a.click();
        if (window.Nexus && Nexus.toast) Nexus.toast("🪪 HD Nexus ID Card Downloaded!");
    }

    window.openProfileQrShareModal = function (userObj) {
        if (!userObj || !userObj.username) return;
        document.getElementById("nx-qr-share-modal")?.remove();
        window.__nxPushBackLayer("nx-qr-share-modal", () => document.getElementById("nx-qr-share-modal")?.remove());
        const profileUrl = `${location.origin}${location.pathname}?user=${encodeURIComponent(userObj.username)}`;
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&bgcolor=090d16&color=10b981&data=${encodeURIComponent(profileUrl)}`;

        const modal = document.createElement("div");
        modal.id = "nx-qr-share-modal";
        modal.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,.92);z-index:265000;display:flex;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(8px);";
        modal.innerHTML = `<div style="background:linear-gradient(155deg,#0f172a,#090d16);border:2px solid #10b981;border-radius:26px;width:100%;max-width:355px;padding:22px 18px;text-align:center;color:#fff;box-shadow:0 24px 60px rgba(0,0,0,.95);">
            <div style="font-size:11px;font-weight:900;color:#34d399;letter-spacing:1px;">⚡ NEXUS OFFICIAL DIGITAL ID</div>
            <h3 style="font-size:19px;font-weight:900;margin-top:4px;">${C.esc(userObj.name || userObj.username)} ✅</h3>
            <div style="font-size:12.5px;color:#38bdf8;font-weight:700;margin-bottom:14px;">@${C.esc(userObj.username)}</div>
            <div style="background:#090d16;border:1.5px solid #1e293b;border-radius:20px;padding:14px;display:inline-block;margin-bottom:14px;"><img src="${qrApiUrl}" alt="QR" style="width:180px;height:180px;display:block;border-radius:10px;"></div>
            <button type="button" id="nx-qr-card-png" style="width:100%;padding:10px;border-radius:12px;background:rgba(56,189,248,.16);border:1px solid #38bdf8;color:#7dd3fc;font-weight:900;font-size:12.5px;cursor:pointer;margin-bottom:8px;">🪪 Download HD Digital ID Card (.png)</button>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                <button type="button" id="nx-qr-copy" style="padding:11px;border-radius:12px;background:#10b981;color:#020617;font-weight:900;font-size:12.5px;border:none;cursor:pointer;">🔗 Share / Copy</button>
                <button type="button" id="nx-qr-close" style="padding:11px;border-radius:12px;background:#1e293b;color:#cbd5e1;font-weight:800;font-size:12.5px;border:1px solid #334155;cursor:pointer;">Close</button>
            </div>
        </div>`;
        document.body.appendChild(modal);
        modal.querySelector("#nx-qr-close").onclick = () => modal.remove();
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
        modal.querySelector("#nx-qr-card-png").onclick = () => downloadDigitalIdCardPng(userObj);
        modal.querySelector("#nx-qr-copy").onclick = () => {
            if (navigator.share) navigator.share({ title: `@${userObj.username} on Nexus`, url: profileUrl }).catch(() => {});
            else { navigator.clipboard?.writeText(profileUrl); if (window.Nexus && Nexus.toast) Nexus.toast("✅ Profile Link Copied!"); }
        };
    };

    // 5. FULL-LENGTH PROFILE SONG PICKER (JIOSAAVN FULL MP3 + ITUNES BACKUP)
    window.togglePlayProfileSong = function (audioUrl, btnEl) {
        if (!audioUrl) return;
        if (activeSongAudio && activeSongAudio.src === audioUrl && !activeSongAudio.paused) {
            activeSongAudio.pause(); if (btnEl) btnEl.innerHTML = "▶️ Play"; return;
        }
        if (activeSongAudio) { activeSongAudio.pause(); if (activeSongBtn) activeSongBtn.innerHTML = "▶️ Play"; }
        activeSongAudio = new Audio(audioUrl); activeSongBtn = btnEl;
        if (btnEl) btnEl.innerHTML = "⏸️ Playing";
        activeSongAudio.play().catch(() => { if (btnEl) btnEl.innerHTML = "▶️ Play"; });
        activeSongAudio.onended = () => { if (btnEl) btnEl.innerHTML = "▶️ Play"; };
    };

    function buildProfileSongPlayerCardHtml(songObj, playBtnId, changeBtnId) {
        if (!songObj || !songObj.title || !songObj.audioUrl) return "";
        return `<div style="margin-top:10px;padding:9px 12px;border-radius:14px;background:linear-gradient(90deg,#090d16,#0f172a);border:1.5px solid rgba(16,185,129,.5);display:flex;align-items:center;justify-content:space-between;gap:10px;">
            <div style="display:flex;align-items:center;gap:10px;min-width:0;">
                ${songObj.coverUrl ? `<img src="${C.esc(songObj.coverUrl)}" loading="lazy" style="width:36px;height:36px;border-radius:9px;object-fit:cover;border:1px solid #10b981;flex-shrink:0;">` : `<span style="font-size:18px;">🎵</span>`}
                <div style="min-width:0;"><div style="display:flex;align-items:center;gap:6px;"><span style="display:inline-flex;align-items:flex-end;gap:2px;height:14px;"><i class="nx-eq-bar"></i><i class="nx-eq-bar"></i><i class="nx-eq-bar"></i></span><span style="font-size:12.5px;font-weight:900;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${C.esc(songObj.title)}</span></div><div style="font-size:10.5px;color:#34d399;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${C.esc(songObj.artist || "Official Profile Anthem")}</div></div>
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-shrink:0;">
                <button type="button" id="${playBtnId}" style="padding:6px 12px;border-radius:999px;background:#10b981;color:#020617;font-weight:900;font-size:11.5px;border:none;cursor:pointer;">▶️ Play</button>
                ${changeBtnId ? `<button type="button" id="${changeBtnId}" style="padding:6px 9px;border-radius:999px;background:#1e293b;color:#38bdf8;font-weight:800;font-size:11px;border:1px solid #334155;cursor:pointer;">🎵</button>` : ""}
            </div>
        </div>`;
    }

    window.openProfileSongPickerModal = function () {
        document.getElementById("nx-song-picker-modal")?.remove();
        window.__nxPushBackLayer("nx-song-picker-modal", () => { if (activeSongAudio) activeSongAudio.pause(); document.getElementById("nx-song-picker-modal")?.remove(); });
        const modal = document.createElement("div"); modal.id = "nx-song-picker-modal";
        modal.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,.92);z-index:266000;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(6px);";
        modal.innerHTML = `<div style="background:#0f172a;border-top:1.5px solid #10b981;border-radius:24px 24px 0 0;width:100%;max-width:600px;max-height:86dvh;display:flex;flex-direction:column;padding:18px 16px 26px;color:#fff;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><div><h3 style="font-size:16.5px;font-weight:900;">🎵 Add Full Music to Your Profile</h3><p style="font-size:11px;color:#94a3b8;">Full MP3 Support • Visible to Every Visitor</p></div><button id="nx-sg-x" style="width:30px;height:30px;border-radius:50%;background:#1e293b;border:none;color:#cbd5e1;cursor:pointer;">✕</button></div>
            <div style="display:flex;gap:8px;margin-bottom:12px;"><input id="nx-sg-in" placeholder="Search song or artist (e.g. Arijit Singh)..." style="flex:1;padding:11px 14px;border-radius:12px;background:#090d16;border:1px solid #334155;color:#fff;font-size:13px;outline:none;"><button id="nx-sg-go" style="padding:11px 16px;border-radius:12px;background:#10b981;color:#020617;font-weight:900;border:none;cursor:pointer;">Search 🔍</button></div>
            <div id="nx-sg-box" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:8px;min-height:220px;max-height:52dvh;"><div style="text-align:center;padding:28px;color:#64748b;font-size:12.5px;">🎶 Type any song name above &amp; tap Search!</div></div>
            <button id="nx-sg-rm" style="margin-top:10px;padding:9px;border-radius:11px;background:rgba(244,63,94,.12);border:1px solid rgba(244,63,94,.35);color:#fb7185;font-size:12px;font-weight:800;cursor:pointer;">🗑️ Remove Current Profile Song</button>
        </div>`;
        document.body.appendChild(modal);
        modal.querySelector("#nx-sg-x").onclick = () => { if (activeSongAudio) activeSongAudio.pause(); modal.remove(); };
        const inp = modal.querySelector("#nx-sg-in"), box = modal.querySelector("#nx-sg-box");

        const runSearch = async () => {
            const q = inp.value.trim(); if (!q) return;
            box.innerHTML = `<div style="text-align:center;padding:24px;color:#38bdf8;font-weight:800;">⏳ Searching "${C.esc(q)}"...</div>`;
            let tracks = [];
            try {
                const r = await fetch(`https://saavn.dev/api/search/songs?query=${encodeURIComponent(q)}&limit=12`);
                const j = await r.json();
                tracks = ((j && j.data && j.data.results) || []).map((t) => {
                    const dl = Array.isArray(t.downloadUrl) ? t.downloadUrl[t.downloadUrl.length - 1] : null;
                    const im = Array.isArray(t.image) ? t.image[t.image.length - 1] : null;
                    return dl && dl.url ? { title: t.name, artist: (t.artists && t.artists.primary && t.artists.primary[0] && t.artists.primary[0].name) || "Full MP3", audioUrl: dl.url, coverUrl: (im && im.url) || "", full: true } : null;
                }).filter(Boolean);
            } catch (e) {}
            if (!tracks.length) {
                try {
                    const r2 = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=12`);
                    const j2 = await r2.json();
                    tracks = ((j2 && j2.results) || []).filter((t) => t && t.previewUrl).map((t) => ({ title: t.trackName, artist: t.artistName, audioUrl: t.previewUrl, coverUrl: t.artworkUrl100 || "", full: false }));
                } catch (e) {}
            }
            if (!tracks.length) { box.innerHTML = `<div style="text-align:center;padding:24px;color:#f43f5e;">No songs found.</div>`; return; }

            box.innerHTML = tracks.map((t, i) => `<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 11px;border-radius:14px;background:#090d16;border:1px solid #1e293b;">
                <div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1;"><img src="${C.esc(t.coverUrl)}" loading="lazy" style="width:42px;height:42px;border-radius:10px;object-fit:cover;flex-shrink:0;"><div style="min-width:0;flex:1;"><div style="font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${C.esc(t.title)} ${t.full ? "🔥" : ""}</div><div style="font-size:11px;color:#94a3b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${C.esc(t.artist)}</div></div></div>
                <div style="display:flex;gap:6px;flex-shrink:0;"><button data-pu="${C.esc(t.audioUrl)}" style="padding:6px 10px;border-radius:9px;background:#1e293b;border:1px solid #334155;color:#38bdf8;cursor:pointer;">▶️</button><button data-si="${i}" style="padding:6px 12px;border-radius:9px;background:#10b981;border:none;color:#020617;font-weight:900;cursor:pointer;">Add ✓</button></div>
            </div>`).join("");
            box.querySelectorAll("[data-pu]").forEach((b) => { b.onclick = () => window.togglePlayProfileSong(b.getAttribute("data-pu"), b); });
            box.querySelectorAll("[data-si]").forEach((b) => {
                b.onclick = async () => {
                    const tr = tracks[Number(b.getAttribute("data-si"))], me = C.getActiveUser(), sb = C.getSb();
                    if (!tr || !me || !sb) return;
                    me.profileSong = tr;
                    localStorage.setItem("nx_active_account", JSON.stringify(me));
                    await sb.from("profiles").update({ profile_song: tr }).eq("id", me.id).catch(() => {});
                    if (activeSongAudio) activeSongAudio.pause();
                    modal.remove(); C.syncSupabaseUsersAndPosts(true);
                    if (window.Nexus && Nexus.toast) Nexus.toast("🎵 Song Added & Synced!");
                };
            });
        };
        modal.querySelector("#nx-sg-go").onclick = runSearch;
        inp.onkeydown = (e) => { if (e.key === "Enter") runSearch(); };
        modal.querySelector("#nx-sg-rm").onclick = async () => {
            const me = C.getActiveUser(), sb = C.getSb(); if (!me || !sb) return;
            delete me.profileSong; localStorage.setItem("nx_active_account", JSON.stringify(me));
            await sb.from("profiles").update({ profile_song: null }).eq("id", me.id).catch(() => {});
            modal.remove(); C.syncSupabaseUsersAndPosts(true);
            if (window.Nexus && Nexus.toast) Nexus.toast("🗑️ Profile Song Removed");
        };
    };

    // 6. INLINE DARK CAPTION EDITOR MODAL (PRESERVED!) + SYSTEMATIC POST 3-DOT SHEET (50MB SUPABASE)
    function openInlineCaptionEditorModal(postObj, onUpdateCallback) {
        if (!C.isStrictOwnerOfPost(postObj)) return;
        document.getElementById("nx-cap-edit-modal")?.remove();
        window.__nxPushBackLayer("nx-cap-edit-modal", () => document.getElementById("nx-cap-edit-modal")?.remove());
        const modal = document.createElement("div"); modal.id = "nx-cap-edit-modal";
        modal.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,.92);z-index:267000;display:flex;align-items:center;justify-content:center;padding:16px;";
        modal.innerHTML = `<div style="background:#0f172a;border:1.5px solid #10b981;border-radius:22px;width:100%;max-width:410px;padding:18px;color:#fff;">
            <h3 style="font-size:15px;font-weight:900;color:#34d399;margin-bottom:10px;">✏️ Edit Your Post Caption</h3>
            <textarea id="nx-new-cap-txt" rows="4" style="width:100%;padding:11px 13px;border-radius:12px;background:#090d16;border:1px solid #334155;color:#fff;font-size:13.5px;outline:none;resize:none;">${C.esc(postObj.content || postObj.text || "")}</textarea>
            <div style="display:flex;gap:8px;margin-top:12px;">
                <button type="button" id="nx-save-cap-btn" style="flex:1;padding:11px;border-radius:12px;background:#10b981;color:#020617;font-weight:900;font-size:13px;border:none;cursor:pointer;">💾 Save Caption</button>
                <button type="button" id="nx-cancel-cap-btn" style="padding:11px 16px;border-radius:12px;background:#1e293b;color:#cbd5e1;font-weight:800;font-size:13px;border:none;cursor:pointer;">Cancel</button>
            </div>
        </div>`;
        document.body.appendChild(modal);
        modal.querySelector("#nx-cancel-cap-btn").onclick = () => modal.remove();
        modal.querySelector("#nx-save-cap-btn").onclick = async () => {
            const newTxt = (modal.querySelector("#nx-new-cap-txt").value || "").trim();
            postObj.content = newTxt; postObj.text = newTxt;
            await C.persistPostUpdate(postObj, { content: newTxt });
            modal.remove(); C.renderCleanZeroOverlapHomeFeed(true);
            if (onUpdateCallback) onUpdateCallback();
            window.renderMyInstagramProfileTab();
            if (window.Nexus && Nexus.toast) Nexus.toast("✅ Caption Updated!");
        };
    }

    window.openSystematicPostThreeDotSheet = function (postObj, onUpdateCallback) {
        document.getElementById("nx-sys-post-3dot-sheet")?.remove();
        window.__nxPushBackLayer("nx-sys-post-3dot-sheet", () => document.getElementById("nx-sys-post-3dot-sheet")?.remove());
        const isMyOwnPost = C.isStrictOwnerOfPost(postObj);
        const sheet = document.createElement("div"); sheet.id = "nx-sys-post-3dot-sheet";
        sheet.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,.88);z-index:265000;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(5px);";
        const bs = "width:100%;text-align:left;padding:13px 16px;background:#090d16;border:1px solid #1e293b;border-radius:13px;color:#f8fafc;font-size:13.5px;font-weight:800;display:flex;align-items:center;gap:11px;cursor:pointer;margin-bottom:7px;";

        sheet.innerHTML = `<div style="background:#0f172a;border-top:1.5px solid #334155;border-radius:24px 24px 0 0;width:100%;max-width:600px;padding:18px 16px 26px;color:#fff;">
            <div style="width:42px;height:4px;background:#334155;border-radius:999px;margin:0 auto 14px;"></div>
            <div style="font-size:12px;font-weight:900;color:#38bdf8;text-transform:uppercase;margin-bottom:10px;">⚡ Nexus Official Post Options</div>
            <button type="button" id="nx-3d-vault" style="${bs}"><span>⚡</span><span>Save to Nexus Vault (Cloud Bookmark)</span></button>
            <button type="button" id="nx-3d-share" style="${bs}"><span>🔗</span><span>Share Direct Post Link</span></button>
            ${isMyOwnPost ? `
                <button type="button" id="nx-3d-pin" style="${bs}color:#fbbf24;border-color:rgba(251,191,36,.35);"><span>📌</span><span>${postObj.pinned ? "Unpin from Your Profile" : "Pin to Top of Your Profile"}</span></button>
                <button type="button" id="nx-3d-edit" style="${bs}color:#34d399;border-color:rgba(16,185,129,.35);"><span>✏️</span><span>Edit Your Post Caption</span></button>
                <label for="nx-inp-3d-rep" style="${bs}color:#38bdf8;border-color:rgba(56,189,248,.35);"><span>🖼️</span><span>Replace Photo or Video (Up to 50MB)</span></label>
                <input type="file" id="nx-inp-3d-rep" accept="image/*,video/*" style="display:none;">
                <button type="button" id="nx-3d-del" style="${bs}color:#f43f5e;border-color:rgba(244,63,94,.4);background:rgba(244,63,94,.1);"><span>🗑️</span><span>Delete Your Post Permanently</span></button>
            ` : ""}
            <button type="button" id="nx-3d-cancel" style="width:100%;padding:12px;border-radius:13px;background:#1e293b;border:none;color:#94a3b8;font-weight:900;cursor:pointer;margin-top:4px;">Cancel</button>
        </div>`;

        document.body.appendChild(sheet);
        sheet.querySelector("#nx-3d-cancel").onclick = () => sheet.remove();
        sheet.onclick = (e) => { if (e.target === sheet) sheet.remove(); };
        sheet.querySelector("#nx-3d-vault").onclick = () => {
            let sv = JSON.parse(localStorage.getItem("nx_saved_posts") || "[]");
            if (!sv.some((x) => x && x.id === postObj.id)) { sv.unshift(postObj); localStorage.setItem("nx_saved_posts", JSON.stringify(sv.slice(0, 50))); }
            sheet.remove(); if (window.Nexus && Nexus.toast) Nexus.toast("⚡ Saved to Nexus Vault!");
        };
        sheet.querySelector("#nx-3d-share").onclick = () => {
            const u = `${location.origin}${location.pathname}?post=${encodeURIComponent(postObj.id || "")}`;
            if (navigator.share) navigator.share({ title: "Nexus Post", url: u }).catch(() => {});
            else { navigator.clipboard?.writeText(u); if (window.Nexus && Nexus.toast) Nexus.toast("🔗 Post Link Copied!"); }
            sheet.remove();
        };

        if (isMyOwnPost) {
            sheet.querySelector("#nx-3d-pin").onclick = async () => {
                postObj.pinned = !postObj.pinned;
                await C.persistPostUpdate(postObj, { is_pinned: postObj.pinned });
                sheet.remove(); C.renderCleanZeroOverlapHomeFeed(true);
                if (onUpdateCallback) onUpdateCallback();
                if (window.Nexus && Nexus.toast) Nexus.toast(postObj.pinned ? "📌 Pinned to Profile!" : "Unpinned Post");
            };
            sheet.querySelector("#nx-3d-edit").onclick = () => { sheet.remove(); openInlineCaptionEditorModal(postObj, onUpdateCallback); };
            sheet.querySelector("#nx-inp-3d-rep").onchange = async (e) => {
                const file = e.target.files && e.target.files[0], sec = C.getSec(); if (!file || !sec) return;
                sheet.remove(); if (window.Nexus && Nexus.toast) Nexus.toast("⏳ Uploading HD Media (50MB Engine)...");
                try {
                    const up = await sec.uploadPublicMedia(file, "posts");
                    const mt = file.type.startsWith("video/") ? "video" : "image";
                    postObj.image = up.publicUrl; postObj.videoUrl = mt === "video" ? up.publicUrl : ""; postObj.mediaType = mt;
                    await C.persistPostUpdate(postObj, { image_url: up.publicUrl, media_type: mt });
                    C.renderCleanZeroOverlapHomeFeed(true); if (onUpdateCallback) onUpdateCallback();
                    if (window.Nexus && Nexus.toast) Nexus.toast("✅ Post Media Updated!");
                } catch (err) { if (window.Nexus && Nexus.toast) Nexus.toast("❌ Upload failed: " + err.message); }
            };
            sheet.querySelector("#nx-3d-del").onclick = async () => {
                if (!confirm("🗑️ Delete your post permanently?")) return;
                const sb = C.getSb(); if (sb && postObj.id) await sb.from("posts").delete().eq("id", postObj.id).catch(() => {});
                if (window.Nexus && Array.isArray(Nexus.posts)) Nexus.posts = Nexus.posts.filter((x) => x.id !== postObj.id);
                sheet.remove(); document.getElementById("nx-scrollable-profile-feed-modal")?.remove();
                C.renderCleanZeroOverlapHomeFeed(true); window.renderMyInstagramProfileTab();
                if (window.Nexus && Nexus.toast) Nexus.toast("🗑️ Post Deleted!");
            };
        }
    };

    // 7. SCROLLABLE PROFILE POSTS FEED
    window.openScrollableProfilePostsFeed = function (postsArray, startIdx, ownerUserObj) {
        if (!Array.isArray(postsArray) || !postsArray.length) return;
        document.getElementById("nx-scrollable-profile-feed-modal")?.remove();
        window.__nxPushBackLayer("nx-scrollable-profile-feed-modal", () => document.getElementById("nx-scrollable-profile-feed-modal")?.remove());
        const modal = document.createElement("div"); modal.id = "nx-scrollable-profile-feed-modal";
        modal.style.cssText = "position:fixed;inset:0;background:#090d16;z-index:261000;overflow-y:auto;color:#fff;max-width:600px;margin:0 auto;scroll-behavior:smooth;";
        const renderFeed = () => {
            const curScroll = modal.scrollTop;
            modal.innerHTML = `<div style="position:sticky;top:0;z-index:20;background:rgba(11,17,32,.96);border-bottom:1px solid #1e293b;padding:12px 16px;display:flex;align-items:center;gap:12px;backdrop-filter:blur(8px);"><button id="nx-sf-x" style="background:none;border:none;color:#f8fafc;font-size:21px;font-weight:900;cursor:pointer;">←</button><div><div style="font-size:15.5px;font-weight:900;">Posts (${postsArray.length})</div><div style="font-size:11px;color:#34d399;font-weight:700;">@${C.esc((ownerUserObj && ownerUserObj.username) || "nexus")} • 100% Real Live Feed</div></div></div><div style="display:flex;flex-direction:column;gap:16px;padding:12px 12px 60px;">${C.buildScrollablePostCardsHtml(postsArray, ownerUserObj)}</div>`;
            modal.querySelector("#nx-sf-x").onclick = () => modal.remove();
            C.bindRealPostCardEvents(modal, postsArray, renderFeed);
            if (curScroll > 0) modal.scrollTop = curScroll;
        };
        renderFeed(); document.body.appendChild(modal);
        setTimeout(() => { document.getElementById(`nx-feed-post-card-${startIdx}`)?.scrollIntoView({ behavior: "instant", block: "start" }); }, 40);
    };

    // 8. AVATAR LONG-PRESS ZOOM MODAL + GLOBAL LONG-PRESS LISTENER (PRESERVED!)
    window.openAvatarLongPressZoomModal = function (userObj) {
        if (!userObj || !userObj.username) return;
        document.getElementById("nx-avatar-zoom-overlay")?.remove();
        window.__nxPushBackLayer("nx-avatar-zoom-overlay", () => { if (activeSongAudio) activeSongAudio.pause(); document.getElementById("nx-avatar-zoom-overlay")?.remove(); });
        const isLive = C.isUserTrulyOnlineRightNow(userObj);
        const seenText = window.formatRealNexusLastSeen(C.extractTrueTimestamp(userObj), isLive) || "Verified";
        const song = C.getNormalizedProfileSong(userObj);
        const avHtml = userObj.dp
            ? `<img src="${C.esc(userObj.dp)}" style="width:220px;height:220px;border-radius:50%;object-fit:cover;border:4px solid #10b981;box-shadow:0 20px 60px rgba(0,0,0,.95);">`
            : `<div style="width:220px;height:220px;border-radius:50%;background:linear-gradient(135deg,#10b981,#0284c7);color:#020617;font-size:78px;font-weight:900;display:flex;align-items:center;justify-content:center;border:4px solid #fff;">${C.esc((userObj.name || userObj.username)[0].toUpperCase())}</div>`;

        const overlay = document.createElement("div"); overlay.id = "nx-avatar-zoom-overlay";
        overlay.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,.92);z-index:263000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(10px);";
        overlay.innerHTML = `${userObj.moodNote ? `<div style="background:#1e293b;border:1.5px solid #38bdf8;color:#f8fafc;padding:7px 16px;border-radius:18px;font-size:13px;font-weight:800;margin-bottom:-12px;z-index:5;">💭 ${C.esc(userObj.moodNote)}</div>` : ""}${avHtml}<h3 style="font-size:20px;font-weight:900;color:#f8fafc;margin-top:14px;">${C.esc(userObj.name || userObj.username)} ✅</h3><div style="font-size:13px;color:#34d399;font-weight:700;margin-top:2px;">@${C.esc(userObj.username)} • ${isLive ? "🟢 Online Now" : C.esc(seenText)}</div>${userObj.bio ? `<p style="font-size:12.5px;color:#cbd5e1;max-width:300px;text-align:center;margin-top:6px;">${C.esc(userObj.bio)}</p>` : ""}${song ? `<div style="margin-top:10px;max-width:310px;width:100%;">${buildProfileSongPlayerCardHtml(song, "nx-zsp", "")}</div>` : ""}<div style="display:flex;gap:10px;margin-top:18px;width:100%;max-width:310px;"><button id="nx-z-open" style="flex:1;padding:11px;border-radius:13px;background:#10b981;color:#020617;font-weight:900;border:none;cursor:pointer;">👤 View Full Profile</button><button id="nx-z-close" style="padding:11px 16px;border-radius:13px;background:#1e293b;color:#cbd5e1;border:1px solid #334155;cursor:pointer;">Close</button></div>`;
        document.body.appendChild(overlay);
        if (song && overlay.querySelector("#nx-zsp")) overlay.querySelector("#nx-zsp").onclick = (e) => { e.stopPropagation(); window.togglePlayProfileSong(song.audioUrl, e.currentTarget); };
        overlay.querySelector("#nx-z-open").onclick = () => { if (activeSongAudio) activeSongAudio.pause(); overlay.remove(); window.openPublicUserProfileModal(userObj); };
        overlay.querySelector("#nx-z-close").onclick = () => { if (activeSongAudio) activeSongAudio.pause(); overlay.remove(); };
        overlay.onclick = (e) => { if (e.target === overlay) { if (activeSongAudio) activeSongAudio.pause(); overlay.remove(); } };
    };

    (function bindGlobalAvatarLongPress() {
        const startHold = (e) => {
            const target = e.target.closest("img, div, span"); if (!target) return;
            const r = target.getBoundingClientRect(); if (r.width < 26 || r.width > 120) return;
            const box = target.closest("[data-username], article, .nx-story-item, div"); if (!box) return;
            const lines = (box.innerText || "").split("\n").map((l) => l.trim()).filter(Boolean);
            const cand = box.getAttribute("data-username") || lines.find((l) => !l.endsWith("ago") && l !== "Live" && l !== "🟢 Live" && !l.includes("DM Open")) || lines[0];
            const matched = C.findUserObjectByAnyIdentifier(cand); if (!matched) return;
            clearTimeout(longPressTimer);
            longPressTimer = setTimeout(() => window.openAvatarLongPressZoomModal(matched), 480);
        };
        const cancelHold = () => clearTimeout(longPressTimer);
        document.addEventListener("touchstart", startHold, { passive: true });
        document.addEventListener("touchend", cancelHold, { passive: true });
        document.addEventListener("touchmove", cancelHold, { passive: true });
    })();

    // 9. COMPLETE PUBLIC PROFILE (MUTUAL FOLLOWERS + COVER + SKILL TAGS + SEPARATE CALLS!)
    window.openPublicUserProfileModal = function (targetIdentifier, cardImgSrc) {
        C.crossSyncAllFollowersAndSongs();
        const userObj = C.findUserObjectByAnyIdentifier(targetIdentifier, cardImgSrc);
        if (!userObj || !userObj.username || C.normU(userObj.username) === "member") return;
        document.getElementById("nx-public-profile-modal")?.remove();
        currentPublicTabMode = "grid";
        window.__nxPushBackLayer("nx-public-profile-modal", () => { if (activeSongAudio) activeSongAudio.pause(); document.getElementById("nx-public-profile-modal")?.remove(); });

        const targetK = C.normU(userObj.username);
        const modal = document.createElement("div"); modal.id = "nx-public-profile-modal";
        modal.style.cssText = "position:fixed;inset:0;background:#090d16;z-index:255000;overflow-y:auto;color:#fff;max-width:600px;margin:0 auto;box-shadow:0 0 60px rgba(0,0,0,.95);";

        const renderPub = () => {
            const me = C.getActiveUser(), myK = C.getMyUsername();
            const theme = C.getThemeAccent(userObj.themeColor);
            const isFollowing = C.cleanUniqueList(userObj.followersList).includes(myK);
            const myFollowing = C.cleanUniqueList((me && me.followingList) || []);
            const mutuals = C.cleanUniqueList(userObj.followersList).filter((u) => myFollowing.includes(u) && u !== myK);

            const userPosts = ((window.Nexus && Nexus.posts) || []).filter((p) => C.isRealValidPost(p) && C.normU(p.username) === targetK);
            const userVideos = userPosts.filter((p) => p.mediaType === "video");
            const isLive = C.isUserTrulyOnlineRightNow(userObj);
            const seenText = window.formatRealNexusLastSeen(C.extractTrueTimestamp(userObj), false);
            const partnerSong = C.getNormalizedProfileSong(userObj);

            const dpHtml = userObj.dp
                ? `<img src="${C.esc(userObj.dp)}" id="nx-pub-dp" style="width:86px;height:86px;border-radius:50%;object-fit:cover;border:3px solid ${isLive ? theme.primary : "#38bdf8"};padding:2px;background:#090d16;cursor:pointer;">`
                : `<div id="nx-pub-dp" style="width:86px;height:86px;border-radius:50%;background:${theme.grad};color:#020617;font-size:34px;font-weight:900;display:flex;align-items:center;justify-content:center;border:3px solid ${theme.glow};cursor:pointer;">${C.esc((userObj.name || targetK)[0].toUpperCase())}</div>`;

            const mutualHtml = mutuals.length
                ? `<div style="font-size:11px;color:#94a3b8;margin-top:6px;">👥 Followed by <strong style="color:#f8fafc;">@${C.esc(mutuals[0])}</strong>${mutuals.length > 1 ? ` and ${mutuals.length - 1} others you follow` : ""}</div>` : "";
            const tagsHtml = Array.isArray(userObj.skillTags) && userObj.skillTags.length
                ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">${userObj.skillTags.map((t) => `<span style="font-size:10.5px;font-weight:800;padding:3px 9px;border-radius:999px;background:rgba(56,189,248,.14);border:1px solid ${theme.primary};color:${theme.glow};">#${C.esc(t)}</span>`).join("")}</div>` : "";

            let tabBody = "";
            if (currentPublicTabMode === "feed") {
                tabBody = userPosts.length ? `<div style="display:flex;flex-direction:column;gap:16px;padding:12px;">${C.buildScrollablePostCardsHtml(userPosts, userObj)}</div>` : `<div style="text-align:center;padding:36px;color:#64748b;">📷 No posts shared yet.</div>`;
            } else {
                const list = currentPublicTabMode === "videos" ? userVideos : userPosts;
                tabBody = list.length ? `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px;margin-top:2px;">${list.map((p, idx) => {
                    const img = p.image || p.videoUrl || "";
                    const isVid = p.mediaType === "video";
                    if (img && !img.startsWith("NX_VIDEO_STREAM:")) {
                        return `<div class="nx-pub-grid-item" data-pidx="${idx}" style="aspect-ratio:1/1;background:#090d16;overflow:hidden;position:relative;cursor:pointer;">${isVid ? `<video src="${C.esc(img)}" muted playsinline preload="metadata" style="width:100%;height:100%;object-fit:cover;"></video><span style="position:absolute;bottom:5px;right:5px;">🎬</span>` : `<img src="${C.esc(img)}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">`}</div>`;
                    }
                    return `<div class="nx-pub-grid-item" data-pidx="${idx}" style="aspect-ratio:1/1;background:${p.cardGradient || "#0f172a"};border:1px solid #1e293b;padding:8px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:10.5px;cursor:pointer;">${C.esc((p.content || "Post").slice(0, 55))}</div>`;
                }).join("")}</div>` : `<div style="text-align:center;padding:36px;color:#64748b;">📷 No posts shared yet.</div>`;
            }

            modal.innerHTML = `
                <div style="position:sticky;top:0;background:rgba(11,17,32,.96);border-bottom:1px solid #1e293b;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;z-index:20;backdrop-filter:blur(8px);">
                    <div style="display:flex;align-items:center;gap:12px;"><button id="nx-close-pub" style="background:none;border:none;color:#f8fafc;font-size:21px;font-weight:900;cursor:pointer;">←</button><div><div style="font-size:16px;font-weight:900;">@${C.esc(userObj.username)} ✅</div><div style="font-size:11px;color:${isLive ? "#34d399" : "#94a3b8"};font-weight:700;">${isLive ? "🟢 Online Now" : seenText ? "Last seen " + C.esc(seenText) : "Verified Member"}</div></div></div>
                    <div style="display:flex;gap:7px;">
                        <button id="nx-pub-acall" title="Audio Call" style="padding:7px 10px;border-radius:10px;background:#1e293b;border:1px solid #10b981;color:#34d399;cursor:pointer;">📞</button>
                        <button id="nx-pub-vcall" title="Video Call" style="padding:7px 10px;border-radius:10px;background:#1e293b;border:1px solid #38bdf8;color:#38bdf8;cursor:pointer;">📹</button>
                        <button id="nx-pub-qr" title="QR" style="padding:7px 10px;border-radius:10px;background:#1e293b;border:1px solid #334155;color:#fff;font-size:11.5px;font-weight:800;cursor:pointer;">📱 QR</button>
                    </div>
                </div>
                <div style="height:86px;width:100%;background:${userObj.coverUrl ? `url('${C.esc(userObj.coverUrl)}') center/cover` : theme.bg};border-bottom:1px solid #1e293b;"></div>
                <div style="padding:0 16px 10px;margin-top:-36px;">
                    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:14px;">
                        <div style="display:flex;flex-direction:column;align-items:center;width:92px;flex-shrink:0;">${dpHtml}<div style="font-size:13.5px;font-weight:900;margin-top:6px;text-align:center;">${C.esc(userObj.name || targetK)}</div></div>
                        <div style="flex:1;display:grid;grid-template-columns:repeat(3,1fr);text-align:center;background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:8px 4px;margin-bottom:14px;">
                            <div id="nx-pub-ps" style="cursor:pointer;"><div style="font-size:17px;font-weight:900;">${userPosts.length}</div><div style="font-size:11px;color:#94a3b8;">posts</div></div>
                            <div id="nx-pub-f1" style="cursor:pointer;"><div style="font-size:17px;font-weight:900;">${(userObj.followersList || []).length}</div><div style="font-size:11px;color:#38bdf8;font-weight:700;">followers</div></div>
                            <div id="nx-pub-f2" style="cursor:pointer;"><div style="font-size:17px;font-weight:900;">${(userObj.followingList || []).length}</div><div style="font-size:11px;color:#38bdf8;font-weight:700;">following</div></div>
                        </div>
                    </div>
                    <div style="background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:10px 12px;margin-top:8px;">
                        <div style="font-size:12px;color:#e2e8f0;line-height:1.45;white-space:pre-line;">${C.esc(userObj.bio || "Nexus Community Member ✨")}</div>
                        ${userObj.website ? `<a href="${C.esc(userObj.website)}" target="_blank" style="display:inline-block;margin-top:4px;font-size:11.5px;color:#38bdf8;text-decoration:none;">🔗 ${C.esc(userObj.website)}</a>` : ""}
                        ${tagsHtml}
                    </div>
                    ${mutualHtml}
                    ${buildProfileSongPlayerCardHtml(partnerSong, "nx-pub-song", "")}
                    <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:8px;margin-top:12px;">
                        <button id="nx-pub-fol" style="padding:10px;border-radius:11px;background:${isFollowing ? "#1e293b" : theme.primary};color:${isFollowing ? "#fff" : "#020617"};border:${isFollowing ? "1px solid #334155" : "none"};font-weight:900;cursor:pointer;">${isFollowing ? "Following ✓" : "Follow"}</button>
                        <button id="nx-pub-dm" style="padding:10px;border-radius:11px;background:#1e293b;color:#fff;border:1px solid #334155;font-weight:800;cursor:pointer;">Message 💬</button>
                        <button id="nx-pub-sh" style="padding:10px 13px;border-radius:11px;background:#1e293b;color:#38bdf8;border:1px solid #334155;font-weight:800;cursor:pointer;">Share 🔗</button>
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #1e293b;border-bottom:1px solid #1e293b;margin-top:6px;">
                    <button data-pubtab="grid" style="padding:11px 4px;background:none;border:none;border-bottom:2.5px solid ${currentPublicTabMode === "grid" ? theme.primary : "transparent"};color:${currentPublicTabMode === "grid" ? "#fff" : "#64748b"};font-weight:900;font-size:12px;">⊞ Grid (${userPosts.length})</button>
                    <button data-pubtab="feed" style="padding:11px 4px;background:none;border:none;border-bottom:2.5px solid ${currentPublicTabMode === "feed" ? theme.primary : "transparent"};color:${currentPublicTabMode === "feed" ? theme.glow : "#64748b"};font-weight:900;font-size:12px;">📱 Scroll (${userPosts.length})</button>
                    <button data-pubtab="videos" style="padding:11px 4px;background:none;border:none;border-bottom:2.5px solid ${currentPublicTabMode === "videos" ? theme.primary : "transparent"};color:${currentPublicTabMode === "videos" ? "#fff" : "#64748b"};font-weight:900;font-size:12px;">🎬 Videos (${userVideos.length})</button>
                </div>
                <div style="padding-bottom:60px;">${tabBody}</div>`;

            modal.querySelector("#nx-close-pub").onclick = () => { if (activeSongAudio) activeSongAudio.pause(); modal.remove(); };
            modal.querySelector("#nx-pub-qr").onclick = () => window.openProfileQrShareModal(userObj);
            modal.querySelector("#nx-pub-sh").onclick = () => window.openProfileQrShareModal(userObj);
            modal.querySelector("#nx-pub-dp").onclick = () => window.openAvatarLongPressZoomModal(userObj);
            modal.querySelector("#nx-pub-acall").onclick = () => window.startNexusRealCall && window.startNexusRealCall("audio", targetK);
            modal.querySelector("#nx-pub-vcall").onclick = () => window.startNexusRealCall && window.startNexusRealCall("video", targetK);
            modal.querySelector("#nx-pub-dm").onclick = () => window.openDirect1to1ChatWithUser(userObj);
            modal.querySelector("#nx-pub-ps").onclick = () => { currentPublicTabMode = "feed"; renderPub(); };
            modal.querySelector("#nx-pub-f1").onclick = () => window.openFullScreenConnectionsModal(userObj, "followers");
            modal.querySelector("#nx-pub-f2").onclick = () => window.openFullScreenConnectionsModal(userObj, "following");
            if (partnerSong && modal.querySelector("#nx-pub-song")) modal.querySelector("#nx-pub-song").onclick = (e) => window.togglePlayProfileSong(partnerSong.audioUrl, e.currentTarget);
            modal.querySelectorAll("[data-pubtab]").forEach((b) => { b.onclick = () => { currentPublicTabMode = b.getAttribute("data-pubtab"); renderPub(); }; });
            modal.querySelectorAll(".nx-pub-grid-item").forEach((c) => { c.onclick = () => window.openScrollableProfilePostsFeed(userPosts, Number(c.getAttribute("data-pidx")), userObj); });
            if (currentPublicTabMode === "feed") C.bindRealPostCardEvents(modal, userPosts, renderPub);
            modal.querySelector("#nx-pub-fol").onclick = async () => { if (!C.isUserVerified()) return C.openLoginIfNeeded("login"); await C.persistFollowToggle(userObj); renderPub(); };
        };

        renderPub(); document.body.appendChild(modal);
        // Live fresh fetch from Supabase
        const sb = C.getSb();
        if (sb) {
            sb.from("profiles").select("*").ilike("username", targetK).maybeSingle().then(({ data }) => {
                if (!data || !document.getElementById("nx-public-profile-modal")) return;
                Object.assign(userObj, C.normalizeSupabaseUser(data));
                renderPub();
            });
        }
    };

    // 10. NEW: REAL PROFILE ANALYTICS & ENGAGEMENT STUDIO MODAL
    window.openProfileAnalyticsModal = function () {
        const me = C.getActiveUser(); if (!me) return;
        document.getElementById("nx-profile-analytics-modal")?.remove();
        window.__nxPushBackLayer("nx-profile-analytics-modal", () => document.getElementById("nx-profile-analytics-modal")?.remove());

        const myK = C.normU(me.username);
        const myPosts = ((window.Nexus && Nexus.posts) || []).filter((p) => C.isRealValidPost(p) && C.normU(p.username) === myK);
        const totalLikes = myPosts.reduce((s, p) => s + Math.max((p.likedBy || []).length, Number(p.likes || 0)), 0);
        const totalComments = myPosts.reduce((s, p) => s + (Array.isArray(p.comments) ? p.comments.length : 0), 0);
        const totalViews = myPosts.reduce((s, p) => s + Math.max(Number(p.views || 1), (p.likedBy || []).length), 0);
        const engRate = totalViews > 0 ? (((totalLikes + totalComments) / totalViews) * 100).toFixed(1) : "0.0";
        const topPost = [...myPosts].sort((a, b) => (b.likes + b.views) - (a.likes + a.views))[0];

        const m = document.createElement("div"); m.id = "nx-profile-analytics-modal";
        m.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,.92);z-index:266000;display:flex;align-items:flex-end;justify-content:center;backdrop-filter:blur(6px);";
        m.innerHTML = `<div style="background:#0f172a;border-top:2px solid #38bdf8;border-radius:24px 24px 0 0;width:100%;max-width:580px;padding:18px 16px 26px;color:#fff;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                <div><h3 style="font-size:16.5px;font-weight:900;color:#38bdf8;">📊 Creator Insights &amp; Analytics</h3><div style="font-size:11px;color:#94a3b8;">100% Live Metrics for @${C.esc(me.username)}</div></div>
                <button id="nx-an-x" style="width:30px;height:30px;border-radius:50%;background:#1e293b;border:none;color:#fff;cursor:pointer;">✕</button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px;">
                <div style="background:#090d16;border:1px solid #1e293b;border-radius:14px;padding:12px;"><div style="font-size:11px;color:#94a3b8;">👁️ Total Reach / Views</div><div style="font-size:22px;font-weight:900;color:#38bdf8;">${totalViews}</div></div>
                <div style="background:#090d16;border:1px solid #1e293b;border-radius:14px;padding:12px;"><div style="font-size:11px;color:#94a3b8;">❤️ Total Likes</div><div style="font-size:22px;font-weight:900;color:#fb7185;">${totalLikes}</div></div>
                <div style="background:#090d16;border:1px solid #1e293b;border-radius:14px;padding:12px;"><div style="font-size:11px;color:#94a3b8;">💬 Total Comments</div><div style="font-size:22px;font-weight:900;color:#34d399;">${totalComments}</div></div>
                <div style="background:#090d16;border:1px solid #1e293b;border-radius:14px;padding:12px;"><div style="font-size:11px;color:#94a3b8;">⚡ Engagement Rate</div><div style="font-size:22px;font-weight:900;color:#fbbf24;">${engRate}%</div></div>
            </div>
            ${topPost ? `<div style="background:#090d16;border:1px solid #10b981;border-radius:14px;padding:12px;"><div style="font-size:11px;font-weight:900;color:#34d399;margin-bottom:4px;">🏆 TOP PERFORMING POST</div><div style="font-size:13px;color:#e2e8f0;">${C.esc((topPost.content || "📷 Media Post").slice(0, 90))}</div><div style="font-size:11px;color:#94a3b8;margin-top:4px;">❤️ ${topPost.likes} Likes • 💬 ${(topPost.comments || []).length} Comments • 👁️ ${topPost.views} Views</div></div>` : ""}
        </div>`;
        document.body.appendChild(m);
        m.querySelector("#nx-an-x").onclick = () => m.remove();
        m.onclick = (e) => { if (e.target === m) m.remove(); };
    };

    // 11. EDIT PROFILE MODAL (BIO + MOOD + WEBSITE + SKILL TAGS + 5 ACCENT THEMES)
    function openEditInstagramProfileModal() {
        const me = C.getActiveUser(), sb = C.getSb(); if (!me || !sb) return;
        document.getElementById("nx-edit-ig-profile-modal")?.remove();
        window.__nxPushBackLayer("nx-edit-ig-profile-modal", () => document.getElementById("nx-edit-ig-profile-modal")?.remove());

        const extra = C.getExtraProfileMeta(me.username);
        let pickedTheme = me.themeColor || extra.themeColor || "emerald";
        const curTags = Array.isArray(me.skillTags) && me.skillTags.length ? me.skillTags : (extra.skillTags || []);

        const modal = document.createElement("div"); modal.id = "nx-edit-ig-profile-modal";
        modal.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,.92);z-index:266000;display:flex;align-items:flex-end;justify-content:center;";
        modal.innerHTML = `<div style="background:#0f172a;border-top:1.5px solid #10b981;border-radius:24px 24px 0 0;width:100%;max-width:600px;max-height:90dvh;overflow-y:auto;padding:18px 16px 28px;color:#fff;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #1e293b;"><h3 style="font-size:16.5px;font-weight:900;">✏️ Edit Profile, Bio &amp; Theme</h3><button id="nx-ep-x" style="width:30px;height:30px;border-radius:50%;background:#1e293b;border:none;color:#fff;cursor:pointer;">✕</button></div>
            <div style="display:flex;flex-direction:column;gap:10px;">
                <div><label style="font-size:10.5px;font-weight:800;color:#94a3b8;">DISPLAY NAME</label><input id="nx-ep-name" value="${C.esc(me.name || "")}" style="width:100%;margin-top:3px;padding:10px 12px;border-radius:11px;background:#090d16;border:1px solid #334155;color:#fff;"></div>
                <div><label style="font-size:10.5px;font-weight:800;color:#34d399;">CUSTOM BIO</label><textarea id="nx-ep-bio" rows="3" style="width:100%;margin-top:3px;padding:10px 12px;border-radius:11px;background:#090d16;border:1px solid #10b981;color:#fff;resize:none;">${C.esc(me.bio || "")}</textarea></div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                    <div><label style="font-size:10.5px;font-weight:800;color:#94a3b8;">MOOD NOTE</label><input id="nx-ep-mood" value="${C.esc(me.moodNote || "")}" placeholder="e.g. Studying ⚡" style="width:100%;margin-top:3px;padding:10px;border-radius:11px;background:#090d16;border:1px solid #334155;color:#fff;"></div>
                    <div><label style="font-size:10.5px;font-weight:800;color:#94a3b8;">WEBSITE / LINK</label><input id="nx-ep-web" value="${C.esc(me.website || "")}" placeholder="https://..." style="width:100%;margin-top:3px;padding:10px;border-radius:11px;background:#090d16;border:1px solid #334155;color:#fff;"></div>
                </div>
                <div><label style="font-size:10.5px;font-weight:800;color:#38bdf8;">VERIFIED SKILL / TARGET TAGS (COMMA SEPARATED)</label><input id="nx-ep-tags" value="${C.esc(curTags.join(", "))}" placeholder="e.g. JEE 2027, Coding, Creator" style="width:100%;margin-top:3px;padding:10px;border-radius:11px;background:#090d16;border:1px solid #334155;color:#fff;"></div>
                <div>
                    <label style="font-size:10.5px;font-weight:800;color:#fbbf24;display:block;margin-bottom:6px;">PROFILE ACCENT THEME</label>
                    <div id="nx-ep-themes" style="display:flex;gap:8px;flex-wrap:wrap;">
                        ${Object.entries(C.THEME_ACCENTS).map(([k, t]) => `<button type="button" data-th="${k}" style="padding:7px 12px;border-radius:999px;background:${k === pickedTheme ? t.primary : "#090d16"};color:${k === pickedTheme ? "#020617" : "#fff"};border:1.5px solid ${t.primary};font-size:11.5px;font-weight:900;cursor:pointer;">${t.name}</button>`).join("")}
                    </div>
                </div>
                <button type="button" id="nx-ep-save" style="width:100%;padding:13px;border-radius:13px;background:linear-gradient(90deg,#10b981,#06b6d4);color:#020617;font-weight:900;font-size:13.5px;border:none;cursor:pointer;margin-top:6px;">✅ Save All Profile Changes</button>
            </div>
        </div>`;

        document.body.appendChild(modal);
        modal.querySelector("#nx-ep-x").onclick = () => modal.remove();
        modal.querySelectorAll("[data-th]").forEach((b) => {
            b.onclick = () => {
                pickedTheme = b.getAttribute("data-th");
                modal.querySelectorAll("[data-th]").forEach((x) => {
                    const tk = x.getAttribute("data-th"), t = C.THEME_ACCENTS[tk];
                    x.style.background = tk === pickedTheme ? t.primary : "#090d16";
                    x.style.color = tk === pickedTheme ? "#020617" : "#fff";
                });
            };
        });

        modal.querySelector("#nx-ep-save").onclick = async function () {
            this.disabled = true; this.textContent = "⏳ Saving Everywhere...";
            const name = (modal.querySelector("#nx-ep-name").value || me.username).trim().slice(0, 60);
            const bio = (modal.querySelector("#nx-ep-bio").value || "").trim().slice(0, 220);
            const mood = (modal.querySelector("#nx-ep-mood").value || "").trim().slice(0, 80);
            const web = (modal.querySelector("#nx-ep-web").value || "").trim().slice(0, 120);
            const tags = (modal.querySelector("#nx-ep-tags").value || "").split(",").map((s) => s.trim().replace(/^#/, "")).filter(Boolean).slice(0, 5);

            Object.assign(me, { name, bio, moodNote: mood, website: web, themeColor: pickedTheme, skillTags: tags });
            localStorage.setItem("nx_active_account", JSON.stringify(me));
            C.saveExtraProfileMeta(me.username, { themeColor: pickedTheme, skillTags: tags });

            // Core Supabase profile update (guaranteed columns)
            await sb.from("profiles").update({ display_name: name, bio, mood_note: mood, website: web, last_online: new Date().toISOString() }).eq("id", me.id).catch(() => {});
            // Optional extended columns update (never blocks core save if SQL wasn't run yet)
            await sb.from("profiles").update({ theme_color: pickedTheme, skill_tags: tags }).eq("id", me.id).catch(() => {});

            modal.remove();
            await C.syncSupabaseUsersAndPosts(true);
            if (window.Nexus && Nexus.toast) Nexus.toast("✅ Profile & Theme Updated!");
        };
    }

    // 12. MAIN MY INSTAGRAM PROFILE TAB (ALL OLD FEATURES + COVER BANNER + ANALYTICS + CALL LOGS)
    window.renderMyInstagramProfileTab = function () {
        const container = document.getElementById("tab-profile");
        if (!container) return;
        C.crossSyncAllFollowersAndSongs();
        const me = C.getActiveUser();

        if (!me || !me.username) {
            document.body.classList.remove("nx-auth-locked");
            container.innerHTML = `<div id="nx-ig-profile-root" style="padding:24px 16px;text-align:center;color:#fff;"><div style="background:linear-gradient(145deg,#0f172a,#090d16);border:1.5px solid #10b981;border-radius:24px;padding:26px 18px;max-width:380px;margin:16px auto;box-shadow:0 18px 45px rgba(0,0,0,.85);"><div style="font-size:38px;margin-bottom:8px;">🛡️</div><h2 style="font-size:19px;font-weight:900;">Sign In to Your Profile</h2><p style="font-size:12px;color:#94a3b8;margin:6px 0 18px;line-height:1.5;">6-Digit Gmail OTP ya Password se login karke apni Profile, Posts, Calls aur E2EE Chats unlock karein.</p><button type="button" id="nx-fallback-signin-btn" style="width:100%;padding:13px;border-radius:14px;background:linear-gradient(90deg,#10b981,#06b6d4);color:#020617;font-weight:900;font-size:13.5px;border:none;cursor:pointer;">🔓 Log In / 6-Digit OTP</button></div></div>`;
            container.querySelector("#nx-fallback-signin-btn").onclick = () => C.openLoginIfNeeded("login");
            return;
        }

        document.body.classList.remove("nx-auth-locked");
        const myK = C.normU(me.username);
        const extra = C.getExtraProfileMeta(me.username);
        const theme = C.getThemeAccent(me.themeColor || extra.themeColor);
        const coverUrl = me.coverUrl || extra.coverUrl || "";
        const skillTags = (Array.isArray(me.skillTags) && me.skillTags.length) ? me.skillTags : (extra.skillTags || []);
        const isFounder = ["mohiy", "mohit_01", "mohit"].includes(myK) || me.role === "admin";

        const allMyPosts = ((window.Nexus && Nexus.posts) || [])
            .filter((p) => C.isRealValidPost(p) && C.normU(p.username) === myK)
            .sort((a, b) => ((b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)) || (Number(b.createdAt || 0) - Number(a.createdAt || 0)));

        const myVideoPosts = allMyPosts.filter((p) => p.mediaType === "video");

        // Vault Tab: Merge Pinned Own Posts + Saved Posts (PRESERVED!)
        let vaultPosts = [];
        try {
            const saved = JSON.parse(localStorage.getItem("nx_saved_posts") || "[]").filter(C.isRealValidPost);
            const map = new Map();
            [...allMyPosts.filter((p) => p.pinned), ...saved].forEach((p) => { if (p && (p.id || p.createdAt)) map.set(p.id || p.createdAt, p); });
            vaultPosts = Array.from(map.values());
        } catch (e) {}

        const activeList = currentProfileTabMode === "videos" ? myVideoPosts : currentProfileTabMode === "vault" ? vaultPosts : allMyPosts;
        const mySong = C.getNormalizedProfileSong(me);
        const exactBio = (me.bio || "").trim() || "Tap 'Edit profile' below to write your custom bio ✨";

        const dpHtml = me.dp
            ? `<img src="${C.esc(me.dp)}" id="nx-my-dp-img" style="width:88px;height:88px;border-radius:50%;object-fit:cover;border:3px solid ${theme.primary};padding:2px;background:#090d16;cursor:pointer;">`
            : `<div id="nx-my-dp-img" style="width:88px;height:88px;border-radius:50%;background:${theme.grad};color:#020617;font-size:34px;font-weight:900;display:flex;align-items:center;justify-content:center;border:3px solid ${theme.glow};cursor:pointer;">${C.esc((me.name || myK)[0].toUpperCase())}</div>`;

        const songPlayerHtml = mySong
            ? buildProfileSongPlayerCardHtml(mySong, "nx-my-song-play", "nx-my-song-change")
            : `<button type="button" id="nx-add-song-empty-btn" style="margin-top:8px;display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:999px;background:rgba(56,189,248,.12);border:1px dashed rgba(56,189,248,.45);color:#38bdf8;font-size:11.5px;font-weight:800;cursor:pointer;">🎵 + Add Music to Your Profile</button>`;

        // 3-Column Grid with 📌 Pin Badge + ⋮ Quick Menu + <video> Preview (PRESERVED!)
        const gridHtml = activeList.length ? `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:3px;margin-top:2px;">${activeList.map((p, idx) => {
            const img = p.image || p.videoUrl || "", isVid = p.mediaType === "video";
            const pinBadge = p.pinned ? `<span style="position:absolute;top:5px;left:5px;background:rgba(2,6,23,.82);color:#fbbf24;font-size:10px;padding:2px 5px;border-radius:6px;z-index:3;">📌</span>` : "";
            const dotsBadge = `<button type="button" class="nx-grid-cell-3dot" data-gidx="${idx}" style="position:absolute;top:4px;right:4px;width:24px;height:24px;border-radius:50%;background:rgba(2,6,23,.78);border:1px solid rgba(255,255,255,.2);color:#fff;font-size:13px;font-weight:900;display:flex;align-items:center;justify-content:center;z-index:4;cursor:pointer;">⋮</button>`;
            if (img && !img.startsWith("NX_VIDEO_STREAM:")) {
                return `<div class="nx-my-grid-item" data-post-idx="${idx}" style="aspect-ratio:1/1;background:#090d16;overflow:hidden;position:relative;cursor:pointer;">${pinBadge}${dotsBadge}${isVid ? `<video src="${C.esc(img)}" muted playsinline preload="metadata" style="width:100%;height:100%;object-fit:cover;display:block;"></video><span style="position:absolute;bottom:5px;right:5px;font-size:12px;">🎬</span>` : `<img src="${C.esc(img)}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;display:block;">`}</div>`;
            }
            return `<div class="nx-my-grid-item" data-post-idx="${idx}" style="aspect-ratio:1/1;background:${p.cardGradient || "linear-gradient(145deg,#0f172a,#1e293b)"};border:1px solid #1e293b;padding:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-size:11px;font-weight:800;color:#e2e8f0;cursor:pointer;overflow:hidden;position:relative;">${pinBadge}${dotsBadge}${isVid ? `<div style="font-size:20px;margin-bottom:4px;">🎬</div>` : ""}<div>${C.esc((p.content || "Post").slice(0, 50))}</div></div>`;
        }).join("")}</div>` : `<div style="text-align:center;padding:40px 16px;color:#64748b;"><div style="font-size:28px;margin-bottom:6px;">${currentProfileTabMode === "videos" ? "🎬" : currentProfileTabMode === "vault" ? "⚡" : "📷"}</div><div style="font-size:13.5px;font-weight:800;color:#cbd5e1;">No ${currentProfileTabMode} posts yet</div></div>`;

        container.innerHTML = `<div id="nx-ig-profile-root" style="padding-bottom:84px;background:#090d16;min-height:calc(100dvh - 110px);color:#fff;">
            <div style="padding:11px 14px;border-bottom:1px solid #1e293b;display:flex;align-items:center;justify-content:space-between;background:#090d16;">
                <div id="nx-prof-switch-trigger" style="display:flex;align-items:center;gap:5px;cursor:pointer;">
                    <span style="font-size:17px;font-weight:900;">@${C.esc(me.username)}</span>
                    <span style="background:${theme.primary};color:#020617;font-size:10px;font-weight:900;padding:1px 6px;border-radius:999px;">✓</span>
                    <span style="color:#94a3b8;font-size:13px;">▾</span>
                </div>
                <div style="display:flex;align-items:center;gap:6px;">
                    <button type="button" id="nx-prof-new-post" style="padding:6px 10px;border-radius:10px;background:#1e293b;border:1px solid #334155;color:#fff;font-size:11.5px;font-weight:800;cursor:pointer;">＋ Post</button>
                    <button type="button" id="nx-prof-call-logs" title="Call History" style="padding:6px 9px;border-radius:10px;background:#1e293b;border:1px solid #10b981;color:#34d399;font-size:12px;cursor:pointer;">📞</button>
                    <button type="button" id="nx-prof-sec-btn" title="Security Center" style="padding:6px 9px;border-radius:10px;background:#1e293b;border:1px solid #38bdf8;color:#38bdf8;font-size:12px;cursor:pointer;">🛡️</button>
                    <button type="button" id="nx-prof-open-settings" title="Settings" style="padding:6px 10px;border-radius:10px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;font-weight:900;cursor:pointer;">☰</button>
                </div>
            </div>

            <div style="position:relative;height:92px;width:100%;background:${coverUrl ? `url('${C.esc(coverUrl)}') center/cover` : theme.bg};border-bottom:1px solid #1e293b;">
                <label for="nx-inp-upload-cover" style="position:absolute;top:8px;right:10px;background:rgba(2,6,23,.76);border:1px solid ${theme.primary};color:${theme.glow};padding:4px 10px;border-radius:999px;font-size:10.5px;font-weight:800;cursor:pointer;">🖼️ Cover</label>
                <input type="file" id="nx-inp-upload-cover" accept="image/*" style="display:none;">
            </div>

            <div style="padding:0 16px 10px;margin-top:-38px;">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px;">
                    <div style="display:flex;flex-direction:column;align-items:center;width:96px;flex-shrink:0;">
                        <div style="position:relative;">
                            <div id="nx-my-mood-pill" style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#1e293b;border:1px solid #38bdf8;color:#f8fafc;font-size:9.5px;font-weight:800;padding:2px 8px;border-radius:12px;white-space:nowrap;z-index:5;cursor:pointer;">${me.moodNote ? "💭 " + C.esc(me.moodNote) : "💭 Note..."}</div>
                            ${dpHtml}
                            <label for="nx-inp-upload-dp" style="position:absolute;bottom:2px;right:2px;width:26px;height:26px;border-radius:50%;background:#38bdf8;color:#020617;font-weight:900;font-size:16px;display:flex;align-items:center;justify-content:center;border:2px solid #090d16;cursor:pointer;">+</label>
                            <input type="file" id="nx-inp-upload-dp" accept="image/*" style="display:none;">
                        </div>
                        <div style="font-size:14px;font-weight:900;margin-top:7px;text-align:center;">${C.esc(me.name || myK)}</div>
                        <span style="font-size:10px;font-weight:800;color:#34d399;margin-top:2px;">🟢 Online Now</span>
                    </div>

                    <div style="flex:1;display:flex;flex-direction:column;gap:8px;min-width:0;margin-top:42px;">
                        <div style="display:grid;grid-template-columns:repeat(3,1fr);text-align:center;background:#0f172a;border:1px solid #1e293b;border-radius:14px;padding:8px 4px;">
                            <div id="nx-my-posts-scroll-trigger" style="cursor:pointer;"><div style="font-size:17px;font-weight:900;">${allMyPosts.length}</div><div style="font-size:11px;color:#94a3b8;">posts</div></div>
                            <div id="nx-my-followers-trigger" style="cursor:pointer;"><div style="font-size:17px;font-weight:900;">${(me.followersList || []).length}</div><div style="font-size:11px;color:#38bdf8;font-weight:700;">followers</div></div>
                            <div id="nx-my-following-trigger" style="cursor:pointer;"><div style="font-size:17px;font-weight:900;">${(me.followingList || []).length}</div><div style="font-size:11px;color:#38bdf8;font-weight:700;">following</div></div>
                        </div>
                    </div>
                </div>

                <div id="nx-my-bio-card-trigger" style="margin-top:10px;background:linear-gradient(145deg,#0f172a,#090d16);border:1px solid ${theme.primary};border-radius:14px;padding:10px 12px;cursor:pointer;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-size:10px;font-weight:900;color:#020617;background:${theme.grad};padding:2px 8px;border-radius:6px;">${isFounder ? "👑 Founder &amp; Developer" : "🛡️ Nexus Verified"}</span>
                        <span style="font-size:10px;font-weight:800;color:#38bdf8;">✏️ Edit Bio &amp; Theme</span>
                    </div>
                    <div style="font-size:12px;color:#e2e8f0;line-height:1.4;white-space:pre-line;">${C.esc(exactBio)}</div>
                    ${me.website ? `<a href="${C.esc(me.website)}" target="_blank" style="display:inline-block;font-size:11px;color:#38bdf8;font-weight:700;margin-top:4px;text-decoration:none;">🔗 ${C.esc(me.website)}</a>` : ""}
                    ${skillTags.length ? `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:7px;">${skillTags.map((t) => `<span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:999px;background:rgba(16,185,129,.14);border:1px solid ${theme.primary};color:${theme.glow};">#${C.esc(t)}</span>`).join("")}</div>` : ""}
                </div>

                <div>${songPlayerHtml}</div>

                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:12px;">
                    <button type="button" id="nx-btn-edit-profile" style="padding:9px 4px;border-radius:11px;background:#1e293b;border:1px solid #334155;color:#f8fafc;font-weight:800;font-size:11.5px;cursor:pointer;">✏️ Edit</button>
                    <button type="button" id="nx-btn-insights" style="padding:9px 4px;border-radius:11px;background:#1e293b;border:1px solid #38bdf8;color:#38bdf8;font-weight:800;font-size:11.5px;cursor:pointer;">📊 Stats</button>
                    <button type="button" id="nx-btn-profile-song" style="padding:9px 4px;border-radius:11px;background:#1e293b;border:1px solid #334155;color:#34d399;font-weight:800;font-size:11.5px;cursor:pointer;">🎵 Song</button>
                    <button type="button" id="nx-btn-share-profile" style="padding:9px 4px;border-radius:11px;background:#1e293b;border:1px solid #334155;color:#fbbf24;font-weight:800;font-size:11.5px;cursor:pointer;">📱 QR/ID</button>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #1e293b;border-bottom:1px solid #1e293b;margin-top:6px;">
                <button type="button" data-ptab="posts" style="padding:11px 4px;background:none;border:none;border-bottom:2.5px solid ${currentProfileTabMode === "posts" ? theme.primary : "transparent"};color:${currentProfileTabMode === "posts" ? "#fff" : "#64748b"};font-weight:900;font-size:12px;cursor:pointer;">⊞ Posts (${allMyPosts.length})</button>
                <button type="button" data-ptab="videos" style="padding:11px 4px;background:none;border:none;border-bottom:2.5px solid ${currentProfileTabMode === "videos" ? theme.primary : "transparent"};color:${currentProfileTabMode === "videos" ? "#fff" : "#64748b"};font-weight:900;font-size:12px;cursor:pointer;">🎬 Reels (${myVideoPosts.length})</button>
                <button type="button" data-ptab="vault" style="padding:11px 4px;background:none;border:none;border-bottom:2.5px solid ${currentProfileTabMode === "vault" ? "#38bdf8" : "transparent"};color:${currentProfileTabMode === "vault" ? "#38bdf8" : "#64748b"};font-weight:900;font-size:12px;cursor:pointer;">⚡ Vault (${vaultPosts.length})</button>
            </div>
            ${gridHtml}
        </div>`;

        container.querySelector("#nx-prof-switch-trigger").onclick = () => window.NexusSecurity && NexusSecurity.openSecurityCenterModal();
        container.querySelector("#nx-prof-sec-btn").onclick = () => window.NexusSecurity && NexusSecurity.openSecurityCenterModal();
        container.querySelector("#nx-prof-call-logs").onclick = () => window.NexusCalls ? NexusCalls.openCallHistory() : Nexus.toast("📞 Call history ready!");
        container.querySelector("#nx-prof-new-post").onclick = () => { if (window.openOfficialNexusCreatorStudio) window.openOfficialNexusCreatorStudio(); else if (window.Nexus && Nexus.switchTab) Nexus.switchTab("tab-post"); };
        container.querySelector("#nx-prof-open-settings").onclick = () => window.Nexus && Nexus.switchTab("tab-settings");
        container.querySelector("#nx-my-dp-img").onclick = () => window.openAvatarLongPressZoomModal(me);
        container.querySelector("#nx-my-mood-pill").onclick = openEditInstagramProfileModal;
        container.querySelector("#nx-my-bio-card-trigger").onclick = openEditInstagramProfileModal;
        container.querySelector("#nx-btn-edit-profile").onclick = openEditInstagramProfileModal;
        container.querySelector("#nx-btn-insights").onclick = window.openProfileAnalyticsModal;
        container.querySelector("#nx-btn-profile-song").onclick = window.openProfileSongPickerModal;
        container.querySelector("#nx-btn-share-profile").onclick = () => window.openProfileQrShareModal(me);
        if (container.querySelector("#nx-add-song-empty-btn")) container.querySelector("#nx-add-song-empty-btn").onclick = window.openProfileSongPickerModal;
        if (mySong && container.querySelector("#nx-my-song-play")) container.querySelector("#nx-my-song-play").onclick = (e) => window.togglePlayProfileSong(mySong.audioUrl, e.currentTarget);
        if (container.querySelector("#nx-my-song-change")) container.querySelector("#nx-my-song-change").onclick = window.openProfileSongPickerModal;
        container.querySelector("#nx-my-posts-scroll-trigger").onclick = () => allMyPosts.length && window.openScrollableProfilePostsFeed(allMyPosts, 0, me);
        container.querySelector("#nx-my-followers-trigger").onclick = () => window.openFullScreenConnectionsModal(me, "followers");
        container.querySelector("#nx-my-following-trigger").onclick = () => window.openFullScreenConnectionsModal(me, "following");
        container.querySelectorAll("[data-ptab]").forEach((b) => { b.onclick = () => { currentProfileTabMode = b.getAttribute("data-ptab"); window.renderMyInstagramProfileTab(); }; });
        container.querySelectorAll(".nx-grid-cell-3dot").forEach((b) => { b.onclick = (e) => { e.stopPropagation(); const p = activeList[Number(b.getAttribute("data-gidx"))]; if (p) window.openSystematicPostThreeDotSheet(p, window.renderMyInstagramProfileTab); }; });
        container.querySelectorAll(".nx-my-grid-item").forEach((c) => { c.onclick = () => window.openScrollableProfilePostsFeed(activeList, Number(c.getAttribute("data-post-idx")), me); });

        // 50MB SUPABASE DP UPLOAD
        container.querySelector("#nx-inp-upload-dp").onchange = async (ev) => {
            const f = ev.target.files && ev.target.files[0], sec = C.getSec(), sb = C.getSb(); if (!f || !sec || !sb) return;
            if (window.Nexus && Nexus.toast) Nexus.toast("⏳ Uploading HD DP...");
            try {
                const up = await sec.uploadPublicMedia(f, "avatars");
                me.dp = up.publicUrl; localStorage.setItem("nx_active_account", JSON.stringify(me));
                await sb.from("profiles").update({ avatar_url: up.publicUrl }).eq("id", me.id);
                await C.syncSupabaseUsersAndPosts(true);
                if (window.Nexus && Nexus.toast) Nexus.toast("📸 Profile Photo Updated!");
            } catch (err) { if (window.Nexus && Nexus.toast) Nexus.toast("❌ DP failed: " + err.message); }
        };

        // NEW: 50MB SUPABASE COVER BANNER UPLOAD
        container.querySelector("#nx-inp-upload-cover").onchange = async (ev) => {
            const f = ev.target.files && ev.target.files[0], sec = C.getSec(), sb = C.getSb(); if (!f || !sec || !sb) return;
            if (window.Nexus && Nexus.toast) Nexus.toast("⏳ Uploading HD Cover Banner...");
            try {
                const up = await sec.uploadPublicMedia(f, "covers");
                me.coverUrl = up.publicUrl; localStorage.setItem("nx_active_account", JSON.stringify(me));
                C.saveExtraProfileMeta(me.username, { coverUrl: up.publicUrl });
                await sb.from("profiles").update({ cover_url: up.publicUrl }).eq("id", me.id).catch(() => {});
                window.renderMyInstagramProfileTab();
                if (window.Nexus && Nexus.toast) Nexus.toast("🖼️ Cover Banner Updated!");
            } catch (err) { if (window.Nexus && Nexus.toast) Nexus.toast("❌ Cover failed: " + err.message); }
        };
    };

    // 13. INSTANT NAV HOOKS (NEVER OVERWRITES SUPABASE AUTH!)
    document.addEventListener("click", (e) => {
        if (e.target.closest('.nx-nav-item[data-tab="tab-profile"]')) setTimeout(() => window.renderMyInstagramProfileTab(), 12);
    }, true);

    setInterval(() => {
        if (window.Nexus) {
            Nexus.openUserProfile = window.openPublicUserProfileModal;
            Nexus.openPublicProfile = window.openPublicUserProfileModal;
        }
        const pTab = document.getElementById("tab-profile");
        if (pTab && pTab.classList.contains("active") && !pTab.querySelector("#nx-ig-profile-root")) {
            window.renderMyInstagramProfileTab();
        }
    }, 450);
})();
