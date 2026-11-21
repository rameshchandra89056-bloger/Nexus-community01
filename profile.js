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
