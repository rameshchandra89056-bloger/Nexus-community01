/* ============================================================================
   NEXUS-SUPABASE-BRIDGE.JS (v6.1 ANTI-TIMEOUT MASTER — ZERO UI OVERWRITE)
   Fixes:
   - Fixes Android Chrome Multi-Tab navigator.locks Deadlock in Supabase v2
   - Increases SMTP OTP Timeout (12s -> 35s) & Auth Timeout (25s)
   - Preserves 100% of v6.0: 0.01s Instant Cache, Dual-Sync Merge,
     50MB Permanent Storage, Silent Write Mirror & 25s Live Heartbeat
   ============================================================================ */
(function () {
    if (window.__NEXUS_SUPABASE_BRIDGE_V61__) return;
    window.__NEXUS_SUPABASE_BRIDGE_V61__ = true;

    const SUPABASE_URL = ("https" + "://" + "fegmtyoxijvktoxtealo" + ".supabase.co").trim();
    const SUPABASE_ANON_KEY = ("sb_publishable_" + "jpH6tVu1sCNSwLmgvRTxrw_w8xq5thV").trim();

    if (!window.supabase || !window.supabase.createClient) {
        console.error("[NexusBridge] Supabase CDN missing in index.html <head>!");
        return;
    }

    // FIXED: Bypass Android Chrome multi-tab navigator.locks deadlock!
    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            lock: async (_name, _acquireTimeout, fn) => await fn()
        }
    });

    const CACHE_USERS_KEY = "nx_v6_sb_users";
    const CACHE_POSTS_KEY = "nx_v6_sb_posts";

    const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
    const normU = (u) => String(u || "").toLowerCase().replace(/^@/, "").trim();
    const withTimeout = (p, ms = 25000) => Promise.race([
        p,
        new Promise((_, rej) => setTimeout(() => rej(new Error("Server response slow hai. Ek baar Gmail check karein (OTP aa chuka ho sakta hai) ya dobara tap karein.")), ms))
    ]);

    function getSid() {
        let sid = localStorage.getItem("nexus_device_sid");
        if (!sid) {
            sid = "nx_" + ((crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2, 9)));
            localStorage.setItem("nexus_device_sid", sid);
        }
        return sid;
    }

    async function getAuthUid() {
        try {
            const { data } = await sb.auth.getSession();
            return (data && data.session && data.session.user && data.session.user.id) || null;
        } catch (e) { return null; }
    }

    // -------------------- 1. CLEAN PRO MODAL CSS --------------------
    if (!document.getElementById("nx-bridge-v60-css")) {
        const st = document.createElement("style");
        st.id = "nx-bridge-v60-css";
        st.textContent = `
            .nx-b-iw{position:relative;display:flex;align-items:center}
            .nx-b-in{width:100%;padding:11.5px 13px;border-radius:12px;background:#090d16;border:1.5px solid #1e293b;color:#f8fafc;font-size:13.5px;outline:none;box-sizing:border-box}
            .nx-b-in:focus{border-color:#10b981}
            .nx-b-eye{position:absolute;right:9px;background:none;border:none;color:#94a3b8;font-size:15px;cursor:pointer;padding:4px}
            .nx-b-btn{width:100%;padding:12.5px;border-radius:13px;background:linear-gradient(90deg,#10b981,#06b6d4);color:#020617;font-weight:900;font-size:14px;border:none;cursor:pointer}
            .nx-b-btn:disabled{opacity:.65;cursor:not-allowed}
        `;
        document.head.appendChild(st);
    }

    // -------------------- 2. 0.01s INSTANT SUPABASE <-> MAIN BRANCH MERGE ENGINE --------------------
    function mapSbProfileToLegacy(row) {
        if (!row) return null;
        const uname = normU(row.username || row.firebase_uid);
        if (!uname || uname === "member") return null;
        const lo = row.last_online ? new Date(row.last_online).getTime() : 0;
        const ts = isNaN(lo) ? 0 : lo;
        return {
            id: row.id || "",
            uid: row.id || "",
            username: uname,
            name: row.display_name || uname,
            dp: row.avatar_url || "",
            bio: row.bio || "",
            moodNote: row.mood_note || "",
            website: row.website || "",
            verified: row.is_verified !== false,
            googleVerified: true,
            role: row.role || "user",
            e2ee_public_key: row.e2ee_public_key || null,
            followersList: Array.isArray(row.followers_list) ? row.followers_list : [],
            followingList: Array.isArray(row.following_list) ? row.following_list : [],
            lastOnline: ts,
            lastSeenAt: ts,
            isOnlineNow: ts > 0 && (Date.now() - ts) <= 95000,
            _fromSupabase: true
        };
    }

    function mapSbPostToLegacy(row) {
        if (!row) return null;
        const uname = normU(row.author_username || "member");
        if (!uname || uname === "member") return null;
        const cap = String(row.content || "").trim();
        const img = String(row.image_url || row.media_url || "").trim();
        if (!cap && !img) return null;
        const likes = Array.isArray(row.likes_list) ? row.likes_list : [];
        const comms = Array.isArray(row.comments_list) ? row.comments_list : [];
        const createdAt = row.created_at ? new Date(row.created_at).getTime() : Date.now();
        return {
            id: "sb_" + String(row.id || ""),
            sbId: row.id,
            author_id: row.author_id || "",
            username: uname,
            author: row.author_name || uname,
            dp: row.author_dp || "",
            bio: row.bio || "",
            content: cap,
            text: cap,
            image: img,
            videoUrl: row.media_type === "video" ? img : "",
            mediaType: row.media_type || (/\.(mp4|webm|mov)(\?|$)/i.test(img) ? "video" : "image"),
            likedBy: likes,
            likes: likes.length,
            viewedBy: [],
            views: Math.max(Number(row.views_count || 1), likes.length),
            comments: comms,
            pinned: Boolean(row.is_pinned),
            createdAt: isNaN(createdAt) ? Date.now() : createdAt,
            _fromSupabase: true
        };
    }

    let sbUsersCache = [];
    let sbPostsCache = [];
    try { sbUsersCache = JSON.parse(localStorage.getItem(CACHE_USERS_KEY) || "[]"); } catch (e) {}
    try { sbPostsCache = JSON.parse(localStorage.getItem(CACHE_POSTS_KEY) || "[]"); } catch (e) {}

    let lastNotifyAt = 0;
    function mergeSupabaseIntoNexus(triggerUi) {
        if (!window.Nexus) return;

        if (sbUsersCache.length) {
            const byU = new Map();
            (Nexus.cloudAccounts || []).forEach((u) => {
                if (u && u.username && normU(u.username) !== "member") byU.set(normU(u.username), u);
            });
            sbUsersCache.forEach((su) => {
                const k = normU(su.username);
                const old = byU.get(k);
                if (old) {
                    byU.set(k, Object.assign({}, old, su, {
                        dp: su.dp || old.dp || "",
                        bio: su.bio || old.bio || "",
                        followersList: Array.from(new Set([...(old.followersList || []), ...(su.followersList || [])])),
                        followingList: Array.from(new Set([...(old.followingList || []), ...(su.followingList || [])])),
                        lastOnline: Math.max(Number(old.lastOnline || 0), Number(su.lastOnline || 0)),
                        lastSeenAt: Math.max(Number(old.lastSeenAt || 0), Number(su.lastOnline || 0))
                    }));
                } else {
                    byU.set(k, su);
                }
            });
            Nexus.cloudAccounts = Array.from(byU.values());
        }

        if (sbPostsCache.length) {
            const bySig = new Map();
            const addP = (p) => {
                if (!p || normU(p.username) === "member") return;
                const sig = `${normU(p.username)}::${String(p.content || p.text || "").trim().slice(0, 40)}::${String(p.image || "").slice(0, 80)}`;
                if (!bySig.has(sig)) bySig.set(sig, p);
            };
            sbPostsCache.forEach(addP);
            (Nexus.posts || []).forEach(addP);
            const mergedPosts = Array.from(bySig.values()).sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
            Nexus.posts = mergedPosts;
            window.__NX_INSTANT_POSTS__ = mergedPosts;
        }

        if (triggerUi && Date.now() - lastNotifyAt > 400) {
            lastNotifyAt = Date.now();
            if (typeof Nexus.notifyAll === "function") Nexus.notifyAll();
        }
    }

    mergeSupabaseIntoNexus(true);

    async function fetchLiveSupabaseData(triggerUi) {
        try {
            const [uRes, pRes] = await Promise.all([
                sb.from("profiles").select("*").order("last_online", { ascending: false }).limit(160),
                sb.from("posts").select("*").order("created_at", { ascending: false }).limit(90)
            ]);
            if (Array.isArray(uRes.data) && uRes.data.length) {
                sbUsersCache = uRes.data.map(mapSbProfileToLegacy).filter(Boolean);
                try { localStorage.setItem(CACHE_USERS_KEY, JSON.stringify(sbUsersCache.slice(0, 70))); } catch (e) {}
            }
            if (Array.isArray(pRes.data)) {
                sbPostsCache = pRes.data.map(mapSbPostToLegacy).filter(Boolean);
                try { localStorage.setItem(CACHE_POSTS_KEY, JSON.stringify(sbPostsCache.slice(0, 35))); } catch (e) {}
            }
            mergeSupabaseIntoNexus(triggerUi);
        } catch (e) {}
    }
    window.__nxSyncSupabaseAll = fetchLiveSupabaseData;

    function hookNexusNotifyAll() {
        if (!window.Nexus || Nexus.__nxBridgeNotifyHooked) return;
        Nexus.__nxBridgeNotifyHooked = true;
        const origNotify = Nexus.notifyAll.bind(Nexus);
        Nexus.notifyAll = function () {
            mergeSupabaseIntoNexus(false);
            return origNotify();
        };
    }
    hookNexusNotifyAll();

    // -------------------- 3. 50MB SUPABASE STORAGE UPGRADE --------------------
    const getExt = (f) => {
        const n = String((f && f.name) || ""), d = n.lastIndexOf(".");
        return (d !== -1 ? n.slice(d + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "") || "bin";
    };

    async function uploadPublicMedia(file, folder) {
        if (!file || file.size > 50 * 1024 * 1024) throw new Error("Max 50MB allowed");
        const path = `${folder || "posts"}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${getExt(file)}`;
        const { error } = await sb.storage.from("public-media").upload(path, file, { contentType: file.type || "application/octet-stream" });
        if (error) throw error;
        return { publicUrl: sb.storage.from("public-media").getPublicUrl(path).data.publicUrl, path };
    }

    async function uploadPrivateChatMedia(file, convId) {
        if (!file || file.size > 50 * 1024 * 1024) throw new Error("Max 50MB allowed");
        const path = `${String(convId || "gen").replace(/[^a-zA-Z0-9_-]/g, "")}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${getExt(file)}`;
        const { error } = await sb.storage.from("private-chat-media").upload(path, file, { contentType: file.type || "application/octet-stream" });
        if (error) throw error;
        return { path, fileName: file.name || "file", mimeType: file.type || "application/octet-stream", size: file.size };
    }

    function hookMediaStorageToSupabase() {
        if (!window.Nexus || Nexus.__nxBridgeMediaHooked) return;
        Nexus.__nxBridgeMediaHooked = true;

        const origCompress = Nexus.compressImage ? Nexus.compressImage.bind(Nexus) : null;
        Nexus.compressImage = async function (file, maxW, quality, callback) {
            if (!file) return;
            const uid = await getAuthUid();
            if (uid && file.size <= 50 * 1024 * 1024) {
                try {
                    const folder = (file.type && file.type.startsWith("video/")) ? "videos" : "uploads";
                    const up = await uploadPublicMedia(file, folder);
                    if (up && up.publicUrl) {
                        callback(up.publicUrl);
                        return;
                    }
                } catch (e) {}
            }
            if (origCompress) origCompress(file, maxW, quality, callback);
        };

        window.__nxUploadVideoForPost = async function (file, callback) {
            const uid = await getAuthUid();
            if (uid && file && file.size <= 50 * 1024 * 1024) {
                try {
                    if (Nexus.toast) Nexus.toast("⏳ Uploading HD Video to Supabase...");
                    const up = await uploadPublicMedia(file, "videos");
                    if (up && up.publicUrl) {
                        if (Nexus.toast) Nexus.toast("✅ HD Video Ready!");
                        callback(up.publicUrl);
                        return;
                    }
                } catch (e) {}
            }
            if (Nexus.toast) Nexus.toast("⚠️ Video upload ke liye Supabase Login karein!");
        };
    }
    hookMediaStorageToSupabase();

    // -------------------- 4. SILENT WRITE-MIRROR TO SUPABASE --------------------
    function hookFirestoreWritesToSupabase() {
        if (!window.Nexus || !Nexus.db || Nexus.db.__nxSupabaseMirrorHooked) return;
        Nexus.db.__nxSupabaseMirrorHooked = true;

        const origCollection = Nexus.db.collection.bind(Nexus.db);
        Nexus.db.collection = function (colName) {
            const colRef = origCollection(colName);
            if (!colRef || (colName !== "nexus_real_posts" && colName !== "nexus_accounts")) return colRef;

            const mirrorPost = async (data) => {
                try {
                    const uid = await getAuthUid();
                    if (!uid || !data) return;
                    const cap = String(data.content || data.text || "").trim();
                    const img = String(data.image || data.videoUrl || "").trim();
                    if (!cap && !img) return;
                    await sb.from("posts").insert({
                        author_id: uid,
                        author_username: normU(data.username || data.author),
                        author_name: String(data.author || data.username || "Member"),
                        author_dp: String(data.dp || ""),
                        bio: String(data.bio || ""),
                        content: cap,
                        image_url: img,
                        media_type: data.mediaType || (/\.(mp4|webm|mov)(\?|$)/i.test(img) ? "video" : "image"),
                        likes_list: Array.isArray(data.likedBy) ? data.likedBy : [],
                        comments_list: Array.isArray(data.comments) ? data.comments : [],
                        views_count: Number(data.views || 1),
                        is_pinned: Boolean(data.pinned)
                    });
                } catch (e) {}
            };

            const mirrorProfile = async (data) => {
                try {
                    const uid = await getAuthUid();
                    if (!uid || !data) return;
                    const patch = { last_online: new Date().toISOString() };
                    if (data.name) patch.display_name = String(data.name).slice(0, 60);
                    if (data.bio !== undefined) patch.bio = String(data.bio).slice(0, 220);
                    if (data.dp && /^https?:\/\//i.test(data.dp)) patch.avatar_url = data.dp;
                    if (data.moodNote !== undefined) patch.mood_note = String(data.moodNote).slice(0, 120);
                    if (Array.isArray(data.followersList)) patch.followers_list = data.followersList;
                    if (Array.isArray(data.followingList)) patch.following_list = data.followingList;
                    await sb.from("profiles").update(patch).eq("id", uid);
                } catch (e) {}
            };

            const origAdd = colRef.add ? colRef.add.bind(colRef) : null;
            if (origAdd) {
                colRef.add = function (data) {
                    if (colName === "nexus_real_posts") mirrorPost(data);
                    return origAdd(data);
                };
            }

            const origDoc = colRef.doc ? colRef.doc.bind(colRef) : null;
            if (origDoc) {
                colRef.doc = function (docId) {
                    const dRef = origDoc(docId);
                    if (!dRef) return dRef;
                    const origSet = dRef.set.bind(dRef);
                    dRef.set = function (data, opts) {
                        if (colName === "nexus_real_posts" && !opts) mirrorPost(data);
                        if (colName === "nexus_accounts") mirrorProfile(data);
                        return origSet(data, opts);
                    };
                    const origUpdate = dRef.update.bind(dRef);
                    dRef.update = function (data) {
                        if (colName === "nexus_accounts") mirrorProfile(data);
                        return origUpdate(data);
                    };
                    return dRef;
                };
            }
            return colRef;
        };
    }

    // -------------------- 5. 2-DEVICE SESSION LOCK --------------------
    async function registerActiveSession(uid) {
        if (!uid) return null;
        const sid = getSid();
        const ua = navigator.userAgent || "";
        const label = /Android/i.test(ua) ? "Android Mobile" : /iPhone|iPad/i.test(ua) ? "iOS Mobile" : "Web Browser";
        try {
            await sb.from("active_sessions").upsert({
                user_id: uid, session_id: sid, device_label: label, is_revoked: false, last_active_at: new Date().toISOString()
            }, { onConflict: "session_id" });
            const { data } = await sb.from("active_sessions").select("session_id").eq("user_id", uid).eq("is_revoked", false).order("last_active_at", { ascending: false });
            if (Array.isArray(data) && data.length > 2) {
                await sb.from("active_sessions").update({ is_revoked: true }).eq("user_id", uid).in("session_id", data.slice(2).map((x) => x.session_id));
            }
        } catch (e) {}
        return sid;
    }

    async function getMyActiveSessions(uid) {
        const id = uid || await getAuthUid();
        if (!id) return [];
        const { data } = await sb.from("active_sessions").select("*").eq("user_id", id).eq("is_revoked", false).order("last_active_at", { ascending: false });
        return Array.isArray(data) ? data : [];
    }

    async function revokeOtherSessions(uid) {
        const id = uid || await getAuthUid();
        if (id) await sb.from("active_sessions").update({ is_revoked: true }).eq("user_id", id).neq("session_id", getSid());
    }

    // -------------------- 6. PRO AUTH ENGINE (35s SMTP TIMEOUT + ZERO LOCK DEADLOCK) --------------------
    const loginWithGoogle = () => sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + window.location.pathname } });
    const sendEmailOtp = (email, create = true) => withTimeout(sb.auth.signInWithOtp({ email: String(email || "").trim().toLowerCase(), options: { shouldCreateUser: Boolean(create) } }), 35000);
    const updateUserPassword = (pw) => withTimeout(sb.auth.updateUser({ password: String(pw || "").trim() }), 25000);

    async function checkUsernameAvailable(raw, ignoreId) {
        const clean = String(raw || "").toLowerCase().replace(/^@/, "").replace(/[^a-z0-9_]/g, "").slice(0, 24);
        if (clean.length < 3) return { ok: false, clean, reason: "Kam se kam 3 letters dalein." };
        if (["admin", "nexus", "nexus_official", "member"].includes(clean)) return { ok: false, clean, reason: "Reserved username." };
        const { data } = await sb.from("profiles").select("id").eq("username", clean).maybeSingle();
        if (data && data.id !== ignoreId) return { ok: false, clean, reason: `@${clean} pehle se liya hua hai.` };
        return { ok: true, clean };
    }

    async function syncCurrentUserProfile(directUser) {
        let user = directUser || null;
        if (!user) {
            const { data: sd } = await withTimeout(sb.auth.getSession(), 12000);
            user = sd && sd.session ? sd.session.user : null;
        }
        if (!user) return null;

        const meta = user.user_metadata || {};
        const metaU = normU(meta.preferred_username || "");
        const fallbackBase = (metaU || (user.email || "user").split("@")[0]).replace(/[^a-z0-9_]/g, "").slice(0, 14) || "user";
        const fallbackU = metaU.length >= 3 ? metaU : (fallbackBase + "_" + user.id.replace(/-/g, "").slice(0, 4));
        const legacyMatch = ((window.Nexus && Nexus.users) || []).find((u) => u && normU(u.username) === fallbackU);

        let prof = null;
        try {
            const { data: found } = await withTimeout(sb.from("profiles").select("*").eq("id", user.id).maybeSingle(), 12000);
            if (found) {
                prof = found;
                sb.from("profiles").update({ last_online: new Date().toISOString() }).eq("id", user.id).then(() => {});
            } else {
                const row = {
                    id: user.id,
                    firebase_uid: fallbackU,
                    username: fallbackU,
                    display_name: String(meta.full_name || meta.name || (legacyMatch && legacyMatch.name) || fallbackBase).trim(),
                    avatar_url: String(meta.avatar_url || meta.picture || (legacyMatch && /^https?:\/\//i.test(legacyMatch.dp || "") ? legacyMatch.dp : "") || ""),
                    bio: String(meta.bio || (legacyMatch && legacyMatch.bio) || "Nexus Community Member ✨"),
                    followers_list: Array.isArray(legacyMatch && legacyMatch.followersList) ? legacyMatch.followersList : [],
                    following_list: Array.isArray(legacyMatch && legacyMatch.followingList) ? legacyMatch.followingList : [],
                    is_verified: true,
                    is_onboarded: true,
                    role: "user",
                    last_online: new Date().toISOString()
                };
                const { data: ins } = await withTimeout(sb.from("profiles").upsert(row, { onConflict: "id" }).select("*").single(), 12000);
                prof = ins || row;
            }
        } catch (e) {
            prof = { id: user.id, username: fallbackU, display_name: String(meta.full_name || fallbackBase), bio: "Nexus Community Member ✨", is_verified: true, role: "user" };
        }

        if (prof.is_banned) {
            await sb.auth.signOut();
            localStorage.removeItem("nx_active_account");
            alert("🚫 Account suspended.");
            return null;
        }

        registerActiveSession(user.id).catch(() => {});

        const bridged = {
            id: prof.id,
            uid: prof.id,
            username: prof.username || fallbackU,
            name: prof.display_name || prof.username || fallbackBase,
            email: user.email || "",
            dp: prof.avatar_url || (legacyMatch && legacyMatch.dp) || "",
            bio: prof.bio || "",
            moodNote: prof.mood_note || "",
            website: prof.website || "",
            verified: true,
            googleVerified: true,
            isOnboarded: true,
            role: prof.role || "user",
            followersList: Array.isArray(prof.followers_list) ? prof.followers_list : [],
            followingList: Array.isArray(prof.following_list) ? prof.following_list : [],
            isOnlineNow: true,
            lastOnline: Date.now(),
            lastSeenAt: Date.now()
        };

        try {
            localStorage.setItem("nx_active_account", JSON.stringify(bridged));
            localStorage.setItem("nx_legacy_backup_account", JSON.stringify(bridged));
        } catch (e) {}

        document.getElementById("nx-google-auth-hub")?.remove();
        document.body.classList.remove("nx-auth-locked");
        return bridged;
    }

    async function signUpWithEmail(email, password, displayName, rawUsername, bio) {
        const cleanEmail = String(email || "").trim().toLowerCase(), pw = String(password || "").trim();
        if (!cleanEmail.includes("@")) return { error: { message: "Sahi Gmail address dalein." } };
        if (pw.length < 6) return { error: { message: "Password kam se kam 6 characters ka hona chahiye." } };
        const chk = await checkUsernameAvailable(rawUsername, null);
        if (!chk.ok) return { error: { message: chk.reason } };

        const nm = String(displayName || chk.clean).trim().slice(0, 60);
        const cleanBio = String(bio || "Nexus Community Member ✨").trim().slice(0, 220);
        const { data, error } = await withTimeout(sb.auth.signUp({
            email: cleanEmail, password: pw,
            options: { data: { full_name: nm, preferred_username: chk.clean, bio: cleanBio } }
        }), 35000);
        if (error) return { data, error };

        if (data && data.user && data.session) {
            await syncCurrentUserProfile(data.user);
            return { data, error: null, needsOtp: false };
        }
        return { data, error: null, needsOtp: true };
    }

    async function loginWithEmail(email, password) {
        const { data, error } = await withTimeout(sb.auth.signInWithPassword({
            email: String(email || "").trim().toLowerCase(),
            password: String(password || "")
        }), 25000);
        if (!error && data && data.user) await syncCurrentUserProfile(data.user);
        return { data, error };
    }

    async function verifyEmailOtp(email, code) {
        const cleanEmail = String(email || "").trim().toLowerCase();
        const cleanToken = String(code || "").replace(/\D/g, "").trim();
        if (cleanToken.length < 6 || cleanToken.length > 8) return { error: { message: "Poora 6-digit OTP code dalein." } };

        let res = await withTimeout(sb.auth.verifyOtp({ email: cleanEmail, token: cleanToken, type: "email" }), 25000);
        if (res.error) {
            const res2 = await withTimeout(sb.auth.verifyOtp({ email: cleanEmail, token: cleanToken, type: "signup" }), 20000).catch(() => null);
            if (res2 && !res2.error) res = res2;
        }
        if (!res.error && res.data && res.data.user) await syncCurrentUserProfile(res.data.user);
        return res;
    }

    async function logoutUser() {
        try { const sid = localStorage.getItem("nexus_device_sid"); if (sid) await sb.from("active_sessions").update({ is_revoked: true }).eq("session_id", sid); } catch (e) {}
        await sb.auth.signOut().catch(() => {});
        localStorage.removeItem("nx_active_account");
        localStorage.removeItem("nx_legacy_backup_account");
        window.location.reload();
    }

    // -------------------- 7. PROFESSIONAL AUTH MODAL --------------------
    const LOGO = `<div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#10b981,#06b6d4);color:#020617;font-size:24px;font-weight:900;display:flex;align-items:center;justify-content:center;margin:0 auto 8px;box-shadow:0 6px 20px rgba(16,185,129,.4);">N</div>`;

    function openProNexusAuthModal(initialMode) {
        document.getElementById("nx-sb-auth-modal")?.remove();
        let view = (initialMode === "signup") ? "signup" : "login";
        let pendingEmail = "", intent = "login";

        const m = document.createElement("div");
        m.id = "nx-sb-auth-modal";
        m.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,.94);z-index:299000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(8px);";

        const finishInstant = (msg) => {
            m.remove();
            document.getElementById("nx-google-auth-hub")?.remove();
            document.body.classList.remove("nx-auth-locked");
            if (window.Nexus && Nexus.notifyAll) Nexus.notifyAll();
            if (window.__nxForceRenderProfileTab) window.__nxForceRenderProfileTab();
            if (window.Nexus && Nexus.toast) Nexus.toast(msg);
            fetchLiveSupabaseData(true);
        };

        const bindEye = (inpId, btnId) => {
            const i = m.querySelector(inpId), b = m.querySelector(btnId);
            if (i && b) b.onclick = () => { i.type = i.type === "password" ? "text" : "password"; b.textContent = i.type === "password" ? "👁️" : "🙈"; };
        };

        const render = () => {
            const isTab = view === "login" || view === "signup";
            const tabs = isTab ? `<div style="display:grid;grid-template-columns:1fr 1fr;background:#050811;padding:4px;border-radius:12px;margin-bottom:12px;border:1px solid #1e293b;">
                <button type="button" id="nx-t-li" style="padding:8px;border-radius:9px;border:none;background:${view === "login" ? "#10b981" : "transparent"};color:${view === "login" ? "#020617" : "#94a3b8"};font-weight:900;font-size:13px;cursor:pointer;">Log In</button>
                <button type="button" id="nx-t-su" style="padding:8px;border-radius:9px;border:none;background:${view === "signup" ? "#10b981" : "transparent"};color:${view === "signup" ? "#020617" : "#94a3b8"};font-weight:900;font-size:13px;cursor:pointer;">Create Account</button>
            </div>` : "";
            const googleBtn = isTab ? `<button type="button" id="nx-g-oauth" style="width:100%;padding:11px;border-radius:12px;background:#fff;color:#0f172a;font-weight:900;font-size:13px;border:none;cursor:pointer;margin-bottom:10px;">G Continue with Google (1-Click)</button><div style="text-align:center;font-size:10.5px;color:#64748b;margin-bottom:10px;">— OR EMAIL &amp; PASSWORD —</div>` : "";

            let body = "";
            if (view === "login") {
                body = `<div style="display:flex;flex-direction:column;gap:9px;">
                    <input type="email" id="nx-li-em" class="nx-b-in" value="${esc(pendingEmail)}" placeholder="Gmail address" autocapitalize="none">
                    <div class="nx-b-iw"><input type="password" id="nx-li-pw" class="nx-b-in" placeholder="Password" style="padding-right:38px;"><button type="button" id="nx-li-eye" class="nx-b-eye">👁️</button></div>
                    <div style="display:flex;justify-content:space-between;">
                        <button type="button" id="nx-go-fg" style="background:none;border:none;color:#38bdf8;font-size:12px;font-weight:800;cursor:pointer;">Forgot Password?</button>
                        <button type="button" id="nx-go-otp" style="background:none;border:none;color:#34d399;font-size:12px;font-weight:800;cursor:pointer;">📧 Login with 6-Digit OTP</button>
                    </div>
                    <button type="button" id="nx-li-go" class="nx-b-btn">🔓 Log In to Nexus</button>
                </div>`;
            } else if (view === "signup") {
                body = `<div style="display:flex;flex-direction:column;gap:8px;">
                    <input id="nx-su-nm" class="nx-b-in" placeholder="Full Name *">
                    <input id="nx-su-un" class="nx-b-in" placeholder="Unique @username *" autocapitalize="none">
                    <div id="nx-su-ust" style="font-size:11px;color:#64748b;font-weight:700;margin-top:-3px;">Letters, numbers &amp; _ only</div>
                    <input type="email" id="nx-su-em" class="nx-b-in" value="${esc(pendingEmail)}" placeholder="Gmail address *" autocapitalize="none">
                    <div class="nx-b-iw"><input type="password" id="nx-su-pw" class="nx-b-in" placeholder="Create Password (6+ chars) *" style="padding-right:38px;"><button type="button" id="nx-su-eye" class="nx-b-eye">👁️</button></div>
                    <button type="button" id="nx-su-go" class="nx-b-btn" style="margin-top:2px;">✨ Create Verified Account</button>
                </div>`;
            } else if (view === "forgot") {
                body = `<div style="display:flex;flex-direction:column;gap:10px;">
                    <p style="font-size:12px;color:#cbd5e1;">Apni Gmail dalein — <b>Nexus Community</b> se <b>6-Digit OTP</b> aayega (10–20 sec wait karein):</p>
                    <input type="email" id="nx-fg-em" class="nx-b-in" value="${esc(pendingEmail)}" placeholder="yourname@gmail.com" autocapitalize="none">
                    <button type="button" id="nx-fg-go" class="nx-b-btn">📧 Send 6-Digit OTP</button>
                    <button type="button" id="nx-fg-have" style="background:none;border:none;color:#34d399;font-size:12px;font-weight:800;cursor:pointer;">🔑 Already have OTP code?</button>
                    <button type="button" id="nx-bk" style="background:none;border:none;color:#94a3b8;font-size:12px;font-weight:800;cursor:pointer;">← Back to Log In</button>
                </div>`;
            } else if (view === "otp_verify") {
                body = `<div style="display:flex;flex-direction:column;gap:10px;">
                    <p style="font-size:12px;color:#cbd5e1;text-align:center;">Gmail (Inbox/Spam) par aaya <b>6-Digit OTP</b> code dalein:</p>
                    <input type="email" id="nx-ov-em" class="nx-b-in" value="${esc(pendingEmail)}" placeholder="Gmail address" autocapitalize="none" style="color:#38bdf8;">
                    <input type="tel" id="nx-code-in" class="nx-b-in" maxlength="8" placeholder="• • • • • •" style="text-align:center;font-size:22px;font-weight:900;letter-spacing:6px;color:#34d399;border-color:#10b981;">
                    <button type="button" id="nx-code-go" class="nx-b-btn">✅ Verify OTP &amp; Continue</button>
                    <button type="button" id="nx-bk" style="background:none;border:none;color:#94a3b8;font-size:12px;font-weight:800;cursor:pointer;">← Back to Log In</button>
                </div>`;
            } else if (view === "reset") {
                body = `<div style="display:flex;flex-direction:column;gap:10px;">
                    <p style="font-size:12.5px;color:#34d399;font-weight:800;">✅ Gmail Verified! Ab apna naya password set karein:</p>
                    <div class="nx-b-iw"><input type="password" id="nx-rs-pw" class="nx-b-in" placeholder="New Password (6+ chars)" style="padding-right:38px;"><button type="button" id="nx-rs-eye" class="nx-b-eye">👁️</button></div>
                    <button type="button" id="nx-rs-go" class="nx-b-btn">🔐 Save Password &amp; Enter</button>
                </div>`;
            }

            m.innerHTML = `<div style="background:linear-gradient(155deg,#0f172a,#090d16);border:1.5px solid #10b981;border-radius:24px;width:100%;max-width:390px;padding:20px 18px;color:#fff;position:relative;box-shadow:0 24px 60px rgba(0,0,0,.95);">
                <button type="button" id="nx-ax" style="position:absolute;top:14px;right:14px;width:30px;height:30px;border-radius:50%;background:#1e293b;border:none;color:#cbd5e1;cursor:pointer;">✕</button>
                <div style="text-align:center;margin-bottom:12px;">${LOGO}<div style="font-size:18px;font-weight:900;">Nexus Community</div><div style="font-size:11px;color:#34d399;font-weight:700;">🔐 Verified Account • Instant Live Sync</div></div>
                ${tabs}${googleBtn}
                <div id="nx-ae" style="display:none;background:rgba(244,63,94,.16);border:1px solid #f43f5e;color:#fda4af;padding:8px 10px;border-radius:10px;font-size:12px;margin-bottom:10px;line-height:1.4;"></div>
                ${body}
            </div>`;

            const err = (t) => { const b = m.querySelector("#nx-ae"); if (b) { b.textContent = t; b.style.display = "block"; } };
            m.querySelector("#nx-ax").onclick = () => m.remove();
            if (m.querySelector("#nx-t-li")) m.querySelector("#nx-t-li").onclick = () => { view = "login"; render(); };
            if (m.querySelector("#nx-t-su")) m.querySelector("#nx-t-su").onclick = () => { view = "signup"; render(); };
            if (m.querySelector("#nx-bk")) m.querySelector("#nx-bk").onclick = () => { view = "login"; render(); };
            if (m.querySelector("#nx-g-oauth")) m.querySelector("#nx-g-oauth").onclick = () => loginWithGoogle();

            if (view === "login") {
                bindEye("#nx-li-pw", "#nx-li-eye");
                m.querySelector("#nx-go-fg").onclick = () => { pendingEmail = m.querySelector("#nx-li-em").value.trim(); intent = "recovery"; view = "forgot"; render(); };
                m.querySelector("#nx-go-otp").onclick = () => { pendingEmail = m.querySelector("#nx-li-em").value.trim(); intent = "otp_login"; view = "forgot"; render(); };
                m.querySelector("#nx-li-go").onclick = async function () {
                    const em = m.querySelector("#nx-li-em").value.trim(), pw = m.querySelector("#nx-li-pw").value.trim();
                    if (!em.includes("@") || pw.length < 6) return err("⚠️ Sahi Gmail aur 6+ char Password dalein.");
                    this.disabled = true; this.textContent = "⏳ Logging In...";
                    try {
                        const { error } = await loginWithEmail(em, pw);
                        if (error) { this.disabled = false; this.textContent = "🔓 Log In to Nexus"; return err("❌ " + (error.message || "Email ya Password galat hai!")); }
                        finishInstant("✅ Welcome Back to Nexus!");
                    } catch (e) { this.disabled = false; this.textContent = "🔓 Log In to Nexus"; err("❌ " + (e.message || "Retry")); }
                };
            } else if (view === "signup") {
                bindEye("#nx-su-pw", "#nx-su-eye");
                const unIn = m.querySelector("#nx-su-un"), ust = m.querySelector("#nx-su-ust");
                let tm;
                unIn.oninput = () => { clearTimeout(tm); tm = setTimeout(async () => { const r = await checkUsernameAvailable(unIn.value, null); ust.style.color = r.ok ? "#34d399" : "#f43f5e"; ust.textContent = r.ok ? `✅ @${r.clean} available!` : `❌ ${r.reason}`; }, 300); };
                m.querySelector("#nx-su-go").onclick = async function () {
                    this.disabled = true; this.textContent = "⏳ Creating Account...";
                    try {
                        const res = await signUpWithEmail(m.querySelector("#nx-su-em").value, m.querySelector("#nx-su-pw").value, m.querySelector("#nx-su-nm").value, unIn.value, "");
                        if (res.error) { this.disabled = false; this.textContent = "✨ Create Verified Account"; return err("❌ " + res.error.message); }
                        if (res.needsOtp) { pendingEmail = m.querySelector("#nx-su-em").value.trim().toLowerCase(); intent = "signup"; view = "otp_verify"; render(); }
                        else finishInstant("🎉 Account Created!");
                    } catch (e) { this.disabled = false; this.textContent = "✨ Create Verified Account"; err("❌ " + (e.message || "Retry")); }
                };
            } else if (view === "forgot") {
                m.querySelector("#nx-fg-have").onclick = () => { pendingEmail = m.querySelector("#nx-fg-em").value.trim(); view = "otp_verify"; render(); };
                m.querySelector("#nx-fg-go").onclick = async function () {
                    const em = m.querySelector("#nx-fg-em").value.trim().toLowerCase();
                    if (!em.includes("@")) return err("⚠️ Sahi Gmail dalein.");
                    this.disabled = true; this.textContent = "⏳ Sending OTP (Wait 5–15s)...";
                    try {
                        const { error } = await sendEmailOtp(em, intent !== "recovery");
                        if (error) { this.disabled = false; this.textContent = "📧 Send 6-Digit OTP"; return err("❌ " + error.message); }
                        pendingEmail = em; view = "otp_verify"; render();
                    } catch (e) { this.disabled = false; this.textContent = "📧 Send 6-Digit OTP"; err("❌ " + (e.message || "Retry")); }
                };
            } else if (view === "otp_verify") {
                m.querySelector("#nx-code-go").onclick = async function () {
                    const em = m.querySelector("#nx-ov-em").value.trim().toLowerCase(), code = m.querySelector("#nx-code-in").value.trim();
                    if (!em.includes("@") || code.length < 6) return err("⚠️ Gmail aur poora 6-digit OTP dalein.");
                    this.disabled = true; this.textContent = "⏳ Verifying...";
                    try {
                        const { error } = await verifyEmailOtp(em, code);
                        if (error) { this.disabled = false; this.textContent = "✅ Verify OTP & Continue"; return err("❌ " + (error.message || "Galat ya expired OTP!")); }
                        if (intent === "recovery") { view = "reset"; render(); } else finishInstant("✅ Gmail Verified!");
                    } catch (e) { this.disabled = false; this.textContent = "✅ Verify OTP & Continue"; err("❌ " + (e.message || "Retry")); }
                };
            } else if (view === "reset") {
                bindEye("#nx-rs-pw", "#nx-rs-eye");
                m.querySelector("#nx-rs-go").onclick = async function () {
                    const p = m.querySelector("#nx-rs-pw").value.trim();
                    if (p.length < 6) return err("⚠️ Min 6 characters password dalein.");
                    this.disabled = true; this.textContent = "⏳ Saving...";
                    try {
                        const { error } = await updateUserPassword(p);
                        if (error) { this.disabled = false; this.textContent = "🔐 Save Password & Enter"; return err("❌ " + error.message); }
                        finishInstant("🔐 New Password Saved!");
                    } catch (e) { this.disabled = false; this.textContent = "🔐 Save Password & Enter"; err("❌ " + (e.message || "Retry")); }
                };
            }
        };
        render(); document.body.appendChild(m);
        m.onclick = (e) => { if (e.target === m) m.remove(); };
    }

    async function openSecurityCenterModal() {
        document.getElementById("nx-sec-center-modal")?.remove();
        const uid = await getAuthUid();
        if (!uid) return openProNexusAuthModal("login");
        const sessions = await getMyActiveSessions(uid);
        const m = document.createElement("div"); m.id = "nx-sec-center-modal";
        m.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,.94);z-index:299000;display:flex;align-items:center;justify-content:center;padding:16px;";
        m.innerHTML = `<div style="background:#0f172a;border:1.5px solid #10b981;border-radius:22px;width:100%;max-width:390px;padding:18px;color:#fff;">
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><h3 style="color:#34d399;font-weight:900;">🛡️ Security Center</h3><button id="nx-scx" style="background:#1e293b;border:none;color:#fff;width:28px;height:28px;border-radius:50%;">✕</button></div>
            <div style="font-size:12px;color:#38bdf8;font-weight:800;margin-bottom:10px;">📱 Active Devices (${sessions.length}/2)</div>
            <button id="nx-scr" style="width:100%;padding:10px;border-radius:10px;background:rgba(244,63,94,.16);border:1px solid #f43f5e;color:#fda4af;font-weight:800;margin-bottom:10px;cursor:pointer;">🚫 Log Out All Other Devices</button>
            <button id="nx-scl" style="width:100%;padding:11px;border-radius:11px;background:#e11d48;color:#fff;font-weight:900;border:none;cursor:pointer;">🚪 Log Out</button>
        </div>`;
        document.body.appendChild(m);
        m.querySelector("#nx-scx").onclick = () => m.remove();
        m.querySelector("#nx-scl").onclick = logoutUser;
        m.querySelector("#nx-scr").onclick = async () => { await revokeOtherSessions(uid); m.remove(); if (window.Nexus && Nexus.toast) Nexus.toast("🚫 Other devices logged out!"); };
    }

    // -------------------- 8. 0ms BOOT + 25s HEARTBEAT + LIVE SUPABASE REALTIME --------------------
    async function sendHeartbeat(uid) {
        if (document.visibilityState === "hidden") return;
        const id = uid || await getAuthUid();
        if (id) sb.from("profiles").update({ last_online: new Date().toISOString() }).eq("id", id).then(() => {});
    }

    async function bootBridge() {
        hookNexusNotifyAll();
        hookMediaStorageToSupabase();
        hookFirestoreWritesToSupabase();

        const [sessionRes] = await Promise.all([
            sb.auth.getSession().catch(() => null),
            fetchLiveSupabaseData(true)
        ]);
        const user = sessionRes && sessionRes.data && sessionRes.data.session ? sessionRes.data.session.user : null;
        if (user && user.id) {
            await syncCurrentUserProfile(user);
            sendHeartbeat(user.id);
        }

        sb.channel("nx_main_bridge_live_v61")
            .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchLiveSupabaseData(true))
            .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => fetchLiveSupabaseData(true))
            .subscribe();
    }

    setTimeout(bootBridge, 10);
    setTimeout(hookFirestoreWritesToSupabase, 800);
    setInterval(() => sendHeartbeat(), 25000);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") sendHeartbeat(); });

    // -------------------- 9. EXPORTS --------------------
    window.NexusSecurity = {
        sb, SUPABASE_URL, getAuthenticatedUserId: getAuthUid, loginWithGoogle, sendEmailOtp, verifyEmailOtp,
        signUpWithEmail, loginWithEmail, updateUserPassword, checkUsernameAvailable, syncCurrentUserProfile,
        logoutUser, registerActiveSession, getMyActiveSessions, revokeOtherSessions,
        openSecurityCenterModal, openAdvancedNexusAuthModal: openProNexusAuthModal,
        uploadPublicMedia, uploadPrivateChatMedia
    };

    try {
        Object.defineProperty(window, "openAdvancedGoogleAuthModal", { configurable: true, get: () => openProNexusAuthModal, set: () => {} });
        Object.defineProperty(window, "openNexusSupabaseAuthModal", { configurable: true, get: () => openProNexusAuthModal, set: () => {} });
    } catch (e) {
        window.openAdvancedGoogleAuthModal = window.openNexusSupabaseAuthModal = openProNexusAuthModal;
    }

    window.dispatchEvent(new CustomEvent("nexus-security-ready", { detail: window.NexusSecurity }));
})();
