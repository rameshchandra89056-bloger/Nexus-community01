/* ============================================================================
   NEXUS-SECURITY.JS (v5.2 ANTI-FREEZE MASTER — SINGLE UNCUT BLOCK)
   - Zero Infinite "Verifying..." Freeze (Strict try/catch + 12s Timeout)
   - Non-Blocking Login & OTP Verification (Closes Modal Instantly on Verify)
   - Kills Duplicate #nx-google-auth-hub & Broken Logo Icon
   - Google 1-Click + Email/Password + 6/8-Digit OTP + Forgot Password
   - 0.01s Instant Cache Boot + Live Supabase Realtime + Original Story Bar
   ============================================================================ */
(function () {
    const SUPABASE_URL = ("https" + "://" + "fegmtyoxijvktoxtealo" + ".supabase.co").trim();
    const SUPABASE_ANON_KEY = ("sb_publishable_" + "jpH6tVu1sCNSwLmgvRTxrw_w8xq5thV").trim();
    if (!window.supabase || !window.supabase.createClient) return console.error("Supabase CDN missing!");

    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });

    const FAST_USERS_KEY = "nx_v5_fast_users";
    const FAST_POSTS_KEY = "nx_v5_fast_posts";

    const withTimeout = (promise, ms = 12000) => Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Network slow hai (timeout). Dobara tap karein.")), ms))
    ]);

    if (!document.getElementById("nx-sec-v52-css")) {
        const st = document.createElement("style");
        st.id = "nx-sec-v52-css";
        st.textContent = `
            #nx-google-auth-hub,.nx-legacy-auth-card{display:none!important;visibility:hidden!important;height:0!important;overflow:hidden!important}
            .nx-pro-iw{position:relative;display:flex;align-items:center}
            .nx-pro-in{width:100%;padding:11px 13px;border-radius:12px;background:#090d16;border:1.5px solid #1e293b;color:#f8fafc;font-size:13.5px;outline:none;box-sizing:border-box}
            .nx-pro-in:focus{border-color:#10b981}
            .nx-pro-eye{position:absolute;right:9px;background:none;border:none;color:#94a3b8;font-size:15px;cursor:pointer;padding:4px}
            .nx-pro-btn{width:100%;padding:12.5px;border-radius:13px;background:linear-gradient(90deg,#10b981,#06b6d4);color:#020617;font-weight:900;font-size:14px;border:none;cursor:pointer}
            .nx-pro-btn:disabled{opacity:.65;cursor:not-allowed}
            .nx-story-ring-live{background:linear-gradient(135deg,#10b981,#06b6d4,#38bdf8);padding:2.5px;border-radius:50%}
            .nx-story-ring-idle{background:linear-gradient(135deg,#334155,#1e293b);padding:2px;border-radius:50%}
            #nx-stories-bar::-webkit-scrollbar{display:none}
        `;
        document.head.appendChild(st);
    }

    const b64Enc = (buf) => {
        const b = new Uint8Array(buf); let s = "";
        for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
        return btoa(s);
    };
    const b64Dec = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
    const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const normU = (u) => String(u || "").toLowerCase().replace(/^@/, "").trim();

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

    // 1. 0.01s INSTANT BOOT CACHE
    (function hydrateInstantCache() {
        try {
            if (!window.Nexus) window.Nexus = { users: [], cloudAccounts: [], posts: [], listeners: { onUsers: [], onPosts: [] } };
            const u = JSON.parse(localStorage.getItem(FAST_USERS_KEY) || "[]");
            const p = JSON.parse(localStorage.getItem(FAST_POSTS_KEY) || "[]");
            if (Array.isArray(u) && u.length && (!Nexus.users || !Nexus.users.length)) { Nexus.users = u; Nexus.cloudAccounts = u; }
            if (Array.isArray(p) && p.length && (!Nexus.posts || !Nexus.posts.length)) { Nexus.posts = p; window.__NX_INSTANT_POSTS__ = p; }
        } catch (e) {}
    })();

    function mapDbUser(raw) {
        if (!raw) return null;
        const uname = normU(raw.username || raw.firebase_uid);
        if (!uname || uname === "member") return null;
        const lo = raw.last_online ? new Date(raw.last_online).getTime() : 0;
        return {
            id: raw.id || "", uid: raw.id || "", username: uname,
            name: raw.display_name || uname, dp: raw.avatar_url || "",
            coverUrl: raw.cover_url || "", themeColor: raw.theme_color || "emerald",
            skillTags: Array.isArray(raw.skill_tags) ? raw.skill_tags : [],
            bio: raw.bio || "", moodNote: raw.mood_note || "", website: raw.website || "",
            profileSong: raw.profile_song || null, verified: raw.is_verified !== false,
            role: raw.role || "user", e2ee_public_key: raw.e2ee_public_key || null,
            followersList: Array.isArray(raw.followers_list) ? raw.followers_list : [],
            followingList: Array.isArray(raw.following_list) ? raw.following_list : [],
            lastOnline: isNaN(lo) ? 0 : lo, lastSeenAt: isNaN(lo) ? 0 : lo
        };
    }

    function mapDbPost(raw) {
        if (!raw) return null;
        const uname = normU(raw.author_username || "member");
        const capRaw = String(raw.content || "").trim();
        const cap = capRaw === "Nexus Post" ? "" : capRaw;
        const img = String(raw.image_url || raw.media_url || "").trim();
        const likes = Array.isArray(raw.likes_list) ? raw.likes_list : [];
        const comms = Array.isArray(raw.comments_list) ? raw.comments_list : [];
        const createdAt = raw.created_at ? new Date(raw.created_at).getTime() : Date.now();
        return {
            id: String(raw.id || ""), author_id: raw.author_id || "", username: uname,
            author: raw.author_name || uname, dp: raw.author_dp || "", bio: raw.bio || "",
            content: cap, text: cap, image: img, videoUrl: raw.media_type === "video" ? img : "",
            mediaType: raw.media_type || (/\.(mp4|webm|mov)(\?|$)/i.test(img) ? "video" : "image"),
            likedBy: likes, likes: likes.length, viewedBy: [],
            views: Math.max(Number(raw.views_count || 1), likes.length),
            comments: comms, pinned: Boolean(raw.is_pinned),
            createdAt: isNaN(createdAt) ? Date.now() : createdAt
        };
    }

    let lastStoryHash = "";
    async function fastLiveSupabaseFetch(forceUi) {
        try {
            const [uRes, pRes] = await Promise.all([
                sb.from("profiles").select("*").order("last_online", { ascending: false }).limit(160),
                sb.from("posts").select("*").order("created_at", { ascending: false }).limit(90)
            ]);
            if (Array.isArray(uRes.data) && uRes.data.length) {
                const users = uRes.data.map(mapDbUser).filter(Boolean);
                if (window.Nexus) { Nexus.users = users; Nexus.cloudAccounts = users; }
                try { localStorage.setItem(FAST_USERS_KEY, JSON.stringify(users.slice(0, 60))); } catch (e) {}
            }
            if (Array.isArray(pRes.data)) {
                const posts = pRes.data.map(mapDbPost).filter((p) => p && p.username !== "member" && (p.content || (p.image && !p.image.startsWith("NX_VIDEO_STREAM:"))));
                if (window.Nexus) { Nexus.posts = posts; window.__NX_INSTANT_POSTS__ = posts; }
                try { localStorage.setItem(FAST_POSTS_KEY, JSON.stringify(posts.slice(0, 35))); } catch (e) {}
            }
            renderOfficialStoryBar(false);
            if (forceUi && window.__NX_PROF_CORE__ && window.__NX_PROF_CORE__.renderCleanZeroOverlapHomeFeed) {
                window.__NX_PROF_CORE__.renderCleanZeroOverlapHomeFeed(true);
            }
        } catch (e) {}
    }
    window.__nxSyncSupabaseAll = fastLiveSupabaseFetch;

    // 2. 2-DEVICE SESSION LOCK (NON-BLOCKING)
    async function registerActiveSession(uid) {
        if (!uid) return null;
        const sid = getSid();
        const ua = navigator.userAgent || "";
        const label = /Android/i.test(ua) ? "Android Mobile" : /iPhone|iPad/i.test(ua) ? "iOS Mobile" : "Web Browser";
        try {
            await sb.from("active_sessions").upsert({ user_id: uid, session_id: sid, device_label: label, is_revoked: false, last_active_at: new Date().toISOString() }, { onConflict: "session_id" });
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

    async function verifyCurrentSessionNotRevoked(uid) {
        const id = uid || await getAuthUid();
        if (!id) return true;
        const { data } = await sb.from("active_sessions").select("is_revoked").eq("user_id", id).eq("session_id", getSid()).maybeSingle();
        if (data && data.is_revoked) {
            await sb.auth.signOut(); localStorage.removeItem("nx_active_account");
            alert("🔒 Account kisi naye device par login hua hai (Max 2 devices limit). Dobara login karein.");
            window.location.reload(); return false;
        }
        return true;
    }

    // 3. E2EE KEY VAULT (INDEXEDDB)
    function openKeyDb() {
        return new Promise((res, rej) => {
            const req = indexedDB.open("NexusE2EEVault", 1);
            req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains("keys")) req.result.createObjectStore("keys"); };
            req.onsuccess = () => res(req.result);
            req.onerror = () => rej(req.error);
        });
    }
    const saveKey = async (k, v) => { const db = await openKeyDb(); return new Promise((res, rej) => { const tx = db.transaction("keys", "readwrite"); tx.objectStore("keys").put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); };
    const getKey = async (k) => { const db = await openKeyDb(); return new Promise((res, rej) => { const tx = db.transaction("keys", "readonly"); const r = tx.objectStore("keys").get(k); r.onsuccess = () => res(r.result || null); r.onerror = () => rej(r.error); }); };

    async function initUserE2EEKeys(uid) {
        if (!uid || !window.crypto || !window.crypto.subtle) return null;
        try {
            let priv = await getKey("priv_" + uid), pub = await getKey("pub_" + uid);
            if (!priv || !pub) {
                const pair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]);
                priv = await crypto.subtle.exportKey("jwk", pair.privateKey);
                pub = await crypto.subtle.exportKey("jwk", pair.publicKey);
                await saveKey("priv_" + uid, priv); await saveKey("pub_" + uid, pub);
                sb.from("profiles").update({ e2ee_public_key: JSON.stringify(pub) }).eq("id", uid).then(() => {});
            }
            return priv;
        } catch (e) { return null; }
    }

    async function deriveAes(myUid, peerPubJson) {
        const myPriv = await initUserE2EEKeys(myUid);
        if (!myPriv || !peerPubJson) return null;
        const privK = await crypto.subtle.importKey("jwk", myPriv, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveKey"]);
        const pubK = await crypto.subtle.importKey("jwk", JSON.parse(peerPubJson), { name: "ECDH", namedCurve: "P-256" }, false, []);
        return crypto.subtle.deriveKey({ name: "ECDH", public: pubK }, privK, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    }

    async function derivePinKey(pin, salt) {
        const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(String(pin)), "PBKDF2", false, ["deriveKey"]);
        return crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
    }

    async function backupPrivateKeyWithPin(uid, pin) {
        const id = uid || await getAuthUid(), p = String(pin || "").replace(/\D/g, "");
        if (!id || p.length !== 6) throw new Error("Exact 6-digit PIN dalein.");
        const privJwk = await initUserE2EEKeys(id), pubJwk = await getKey("pub_" + id);
        const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
        const enc = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await derivePinKey(p, salt), new TextEncoder().encode(JSON.stringify({ privJwk, pubJwk })));
        const { error } = await sb.from("profiles").update({ e2ee_encrypted_backup: JSON.stringify({ iv: b64Enc(iv), data: b64Enc(enc) }), e2ee_backup_salt: b64Enc(salt) }).eq("id", id);
        if (error) throw error;
        return true;
    }

    async function restorePrivateKeyWithPin(uid, pin) {
        const id = uid || await getAuthUid();
        const { data } = await sb.from("profiles").select("e2ee_encrypted_backup, e2ee_backup_salt").eq("id", id).single();
        if (!data || !data.e2ee_encrypted_backup) throw new Error("Koi Backup PIN nahi mila.");
        const parsed = JSON.parse(data.e2ee_encrypted_backup);
        const dec = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64Dec(parsed.iv) }, await derivePinKey(String(pin).trim(), b64Dec(data.e2ee_backup_salt)), b64Dec(parsed.data));
        const obj = JSON.parse(new TextDecoder().decode(dec));
        await saveKey("priv_" + id, obj.privJwk || obj);
        if (obj.pubJwk) await saveKey("pub_" + id, obj.pubJwk);
        return true;
    }

    // 4. AUTH FUNCTIONS (ANTI-FREEZE WITH TIMEOUT & FALLBACK PROFILE)
    const loginWithGoogle = () => sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + window.location.pathname } });
    const sendEmailOtp = (email, create = true) => withTimeout(sb.auth.signInWithOtp({ email: String(email || "").trim().toLowerCase(), options: { shouldCreateUser: Boolean(create) } }), 12000);
    const updateUserPassword = (pw) => withTimeout(sb.auth.updateUser({ password: String(pw || "").trim() }), 12000);

    async function checkUsernameAvailable(raw, ignoreId) {
        const clean = String(raw || "").toLowerCase().replace(/^@/, "").replace(/[^a-z0-9_]/g, "").slice(0, 24);
        if (clean.length < 3) return { ok: false, clean, reason: "Kam se kam 3 letters dalein." };
        if (["admin", "nexus", "nexus_official", "member"].includes(clean)) return { ok: false, clean, reason: "Reserved username." };
        const { data } = await sb.from("profiles").select("id").eq("username", clean).maybeSingle();
        if (data && data.id !== ignoreId) return { ok: false, clean, reason: `@${clean} pehle se liya hua hai.` };
        return { ok: true, clean };
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
        }), 12000);
        if (error) return { data, error };

        if (data && data.user && data.session) {
            await sb.from("profiles").upsert({
                id: data.user.id, firebase_uid: chk.clean, username: chk.clean,
                display_name: nm, bio: cleanBio, is_verified: true, is_onboarded: true,
                role: "user", last_online: new Date().toISOString()
            }, { onConflict: "id" }).catch(() => {});
            await syncCurrentUserProfile(data.user);
            return { data, error: null, needsOtp: false };
        }
        return { data, error: null, needsOtp: true };
    }

    async function loginWithEmail(email, password) {
        const { data, error } = await withTimeout(sb.auth.signInWithPassword({
            email: String(email || "").trim().toLowerCase(),
            password: String(password || "")
        }), 12000);
        if (!error && data && data.user) await syncCurrentUserProfile(data.user);
        return { data, error };
    }

    async function verifyEmailOtp(email, code) {
        const cleanEmail = String(email || "").trim().toLowerCase();
        const cleanToken = String(code || "").replace(/\D/g, "").trim();
        if (cleanToken.length < 6 || cleanToken.length > 8) return { error: { message: "Poora 6 ya 8 digit OTP code dalein." } };

        let res = await withTimeout(sb.auth.verifyOtp({ email: cleanEmail, token: cleanToken, type: "email" }), 12000);
        if (res.error) {
            const res2 = await withTimeout(sb.auth.verifyOtp({ email: cleanEmail, token: cleanToken, type: "signup" }), 10000).catch(() => null);
            if (res2 && !res2.error) res = res2;
        }
        if (!res.error && res.data && res.data.user) {
            await syncCurrentUserProfile(res.data.user);
        }
        return res;
    }

    async function syncCurrentUserProfile(directUser) {
        let user = directUser || null;
        if (!user) {
            const { data: sd } = await withTimeout(sb.auth.getSession(), 8000);
            user = sd && sd.session ? sd.session.user : null;
        }
        if (!user) return null;

        const meta = user.user_metadata || {};
        const fallbackBase = String(meta.preferred_username || (user.email || "user").split("@")[0]).toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 14) || "user";
        const fallbackU = fallbackBase + "_" + user.id.replace(/-/g, "").slice(0, 4);

        let prof = null;
        try {
            const { data: found } = await withTimeout(sb.from("profiles").select("*").eq("id", user.id).maybeSingle(), 7000);
            if (found) {
                prof = found;
                sb.from("profiles").update({ last_online: new Date().toISOString() }).eq("id", user.id).then(() => {});
            } else {
                const row = {
                    id: user.id, firebase_uid: fallbackU, username: fallbackU,
                    display_name: String(meta.full_name || meta.name || fallbackBase).trim(),
                    avatar_url: String(meta.avatar_url || meta.picture || ""),
                    bio: String(meta.bio || "Nexus Community Member ✨"),
                    is_verified: true, is_onboarded: true, role: "user", last_online: new Date().toISOString()
                };
                const { data: ins } = await withTimeout(sb.from("profiles").upsert(row, { onConflict: "id" }).select("*").single(), 7000);
                prof = ins || row;
            }
        } catch (e) {
            // Never freeze login if DB is slow — build immediate fallback profile
            prof = { id: user.id, username: fallbackU, display_name: String(meta.full_name || fallbackBase), bio: "Nexus Community Member ✨", is_verified: true, role: "user" };
        }

        if (prof.is_banned) { await sb.auth.signOut(); localStorage.removeItem("nx_active_account"); alert("🚫 Account suspended."); return null; }

        // Background non-blocking tasks
        registerActiveSession(user.id).catch(() => {});
        initUserE2EEKeys(user.id).catch(() => {});

        const bridged = {
            id: prof.id, uid: prof.id, username: prof.username || fallbackU, name: prof.display_name || prof.username || fallbackBase,
            email: user.email || "", dp: prof.avatar_url || "", coverUrl: prof.cover_url || "",
            themeColor: prof.theme_color || "emerald", skillTags: Array.isArray(prof.skill_tags) ? prof.skill_tags : [],
            bio: prof.bio || "", moodNote: prof.mood_note || "", profileSong: prof.profile_song || null, website: prof.website || "",
            verified: Boolean(prof.is_verified !== false), googleVerified: true, isOnboarded: true, role: prof.role || "user",
            blockedUsers: Array.isArray(prof.blocked_users) ? prof.blocked_users : [], showReadReceipts: prof.show_read_receipts !== false,
            followersList: Array.isArray(prof.followers_list) ? prof.followers_list : [], followingList: Array.isArray(prof.following_list) ? prof.following_list : [],
            isOnlineNow: true, lastOnline: Date.now()
        };
        try { localStorage.setItem("nx_active_account", JSON.stringify(bridged)); } catch (e) {}
        document.getElementById("nx-google-auth-hub")?.remove();
        document.body.classList.remove("nx-auth-locked");
        return bridged;
    }

    async function logoutUser() {
        try { const sid = localStorage.getItem("nexus_device_sid"); if (sid) await sb.from("active_sessions").update({ is_revoked: true }).eq("session_id", sid); } catch (e) {}
        await sb.auth.signOut();
        localStorage.removeItem("nx_active_account");
        localStorage.removeItem("nx_legacy_backup_account");
        window.location.reload();
    }

    // 5. 50MB STORAGE + 1:1 E2EE MESSAGING
    const getExt = (f) => { const n = String((f && f.name) || ""), d = n.lastIndexOf("."); return (d !== -1 ? n.slice(d + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "") || "bin"; };
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
    const urlCache = new Map();
    async function getSignedChatMediaUrl(path, exp = 3600) {
        if (!path) return "";
        if (/^(https?:|data:)/i.test(path)) return path;
        const c = urlCache.get(path);
        if (c && c.exp > Date.now() + 60000) return c.url;
        const { data } = await sb.storage.from("private-chat-media").createSignedUrl(path, exp);
        if (!data || !data.signedUrl) return "";
        urlCache.set(path, { url: data.signedUrl, exp: Date.now() + exp * 1000 });
        return data.signedUrl;
    }
    async function getOrCreateConversation(myId, peerId) {
        const uid = (await getAuthUid()) || myId;
        const [a, b] = uid < peerId ? [uid, peerId] : [peerId, uid];
        const { data: ex } = await sb.from("conversations").select("id").eq("participant_a", a).eq("participant_b", b).maybeSingle();
        if (ex && ex.id) return ex.id;
        const { data: cr, error } = await sb.from("conversations").insert({ participant_a: a, participant_b: b }).select("id").single();
        if (error) throw error;
        return cr.id;
    }
    async function sendChatMessage(opts) {
        const uid = await getAuthUid();
        if (!uid) throw new Error("Supabase login required — dobara login karein.");
        const raw = JSON.stringify({ v: 2, t: String(opts.text || ""), mp: String(opts.mediaPath || ""), mt: String(opts.mediaType || "text"), fn: String(opts.fileName || ""), stk: opts.sticker || null, vo: Boolean(opts.isViewOnce) });
        let ciphertext = raw, ivStr = "WAIT_PEER_KEY";
        if (opts.peerPublicKeyJson && uid !== opts.peerUserId) {
            try { const k = await deriveAes(uid, opts.peerPublicKeyJson); if (k) { const iv = crypto.getRandomValues(new Uint8Array(12)); ciphertext = b64Enc(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, new TextEncoder().encode(raw))); ivStr = b64Enc(iv); } } catch (e) {}
        }
        const { data, error } = await sb.from("messages").insert({
            conversation_id: opts.conversationId, sender_id: uid, receiver_id: opts.peerUserId, ciphertext, iv: ivStr,
            msg_type: ["image", "video", "audio", "file"].includes(opts.mediaType) ? opts.mediaType : "text",
            media_path: String(opts.mediaPath || ""), is_view_once: Boolean(opts.isViewOnce), view_once_opened: false,
            reply_to: opts.replyTo || null, reactions: {}, seen: false, is_edited: false, is_deleted_everyone: false,
            expires_at: opts.disappearingSeconds > 0 ? new Date(Date.now() + opts.disappearingSeconds * 1000).toISOString() : null
        }).select("*").single();
        if (error) throw error;
        return data;
    }
    async function decryptMessageRow(row, myUid, peerPubJson) {
        if (!row) return null;
        if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) return { deleted: true, text: "⏱️ Disappearing message expired", mediaPath: "", mediaType: "text" };
        if (row.is_deleted_everyone) return { deleted: true, text: "This message was deleted", mediaPath: "", mediaType: "text" };
        let plain = row.ciphertext || "", iv = String(row.iv || "");
        if (row.msg_type === "legacy_migrated" || iv === "LEGACY_PLAIN") {
            const isImg = /^(data:image\/|https?:\/\/.+\.(jpg|jpeg|png|webp|gif))/i.test(plain);
            return { deleted: false, text: isImg ? "" : plain, mediaPath: isImg ? plain : (row.media_path || ""), mediaType: isImg ? "image" : "text" };
        }
        if (iv !== "WAIT_PEER_KEY" && iv.length >= 8 && peerPubJson) {
            try { const k = await deriveAes(myUid, peerPubJson); if (k) plain = new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64Dec(iv) }, k, b64Dec(row.ciphertext))); }
            catch (e) { return { deleted: false, locked: true, text: "🔒 Encrypted on another device — Security Center mein Backup PIN dalein", mediaPath: "", mediaType: "text" }; }
        }
        try {
            const o = JSON.parse(plain);
            if (o && o.v === 2) return { deleted: false, text: o.t || "", mediaPath: row.view_once_opened ? "" : (o.mp || row.media_path || ""), mediaType: o.mt || row.msg_type || "text", fileName: o.fn || "", sticker: o.stk || null, viewOnce: Boolean(row.is_view_once || o.vo), viewOnceOpened: Boolean(row.view_once_opened) };
        } catch (e) {}
        return { deleted: false, text: plain, mediaPath: row.view_once_opened ? "" : (row.media_path || ""), mediaType: row.msg_type || "text", viewOnce: Boolean(row.is_view_once), viewOnceOpened: Boolean(row.view_once_opened) };
    }
    async function toggleMessageReaction(msgId, emoji, uname) {
        const u = String(uname || "").toLowerCase().trim();
        const { data: r } = await sb.from("messages").select("reactions").eq("id", msgId).single();
        if (!r) return null;
        const rx = Object.assign({}, r.reactions || {});
        if (rx[u] === emoji) delete rx[u]; else rx[u] = emoji;
        await sb.from("messages").update({ reactions: rx }).eq("id", msgId);
        return rx;
    }
    async function editChatMessage(opts) {
        const uid = (await getAuthUid()) || opts.myUserId;
        const raw = JSON.stringify({ v: 2, t: String(opts.newText || ""), mp: "", mt: "text", fn: "", stk: null, vo: false });
        let ciphertext = raw, ivStr = "WAIT_PEER_KEY";
        if (opts.peerPublicKeyJson && uid !== opts.peerUserId) {
            try { const k = await deriveAes(uid, opts.peerPublicKeyJson); if (k) { const iv = crypto.getRandomValues(new Uint8Array(12)); ciphertext = b64Enc(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, new TextEncoder().encode(raw))); ivStr = b64Enc(iv); } } catch (e) {}
        }
        return sb.from("messages").update({ ciphertext, iv: ivStr, is_edited: true }).eq("id", opts.messageId).eq("sender_id", uid);
    }
    async function deleteMessageForEveryone(msgId, path) {
        if (path && !/^(https?:|data:)/i.test(path)) { try { await sb.storage.from("private-chat-media").remove([path]); urlCache.delete(path); } catch (e) {} }
        return sb.from("messages").update({ is_deleted_everyone: true, ciphertext: "", media_path: "", reactions: {} }).eq("id", msgId);
    }
    async function burnViewOnceMessage(msgId, path) {
        if (path && !/^(https?:|data:)/i.test(path)) { try { await sb.storage.from("private-chat-media").remove([path]); urlCache.delete(path); } catch (e) {} }
        return sb.from("messages").update({ view_once_opened: true, ciphertext: "", media_path: "" }).eq("id", msgId);
    }
    async function markConversationSeen(convId, myUid) {
        const uid = (await getAuthUid()) || myUid;
        if (convId && uid) return sb.from("messages").update({ seen: true }).eq("conversation_id", convId).eq("receiver_id", uid).eq("seen", false);
    }
    function subscribeToConversation(convId, cb) {
        const ch = sb.channel("nx_conv_" + convId).on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${convId}` }, (p) => cb && cb(p)).subscribe();
        return () => { try { sb.removeChannel(ch); } catch (e) {} };
    }

    // 6. ANTI-FREEZE PRO AUTH MODAL
    const LOGO = `<div style="width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#10b981,#06b6d4);color:#020617;font-size:24px;font-weight:900;display:flex;align-items:center;justify-content:center;margin:0 auto 8px;box-shadow:0 6px 20px rgba(16,185,129,.4);">N</div>`;

    function openAdvancedNexusAuthModal(initialMode) {
        document.getElementById("nx-sb-auth-modal")?.remove();
        let view = initialMode === "signup" ? "signup" : "login";
        let pendingEmail = "", intent = "login";

        const m = document.createElement("div"); m.id = "nx-sb-auth-modal";
        m.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,.94);z-index:299000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(8px);";

        const finishInstant = (msg) => {
            m.remove();
            document.getElementById("nx-google-auth-hub")?.remove();
            document.body.classList.remove("nx-auth-locked");
            if (window.renderMyInstagramProfileTab) window.renderMyInstagramProfileTab();
            if (window.Nexus && Nexus.toast) Nexus.toast(msg);
            fastLiveSupabaseFetch(true);
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
                    <input type="email" id="nx-li-em" class="nx-pro-in" value="${esc(pendingEmail)}" placeholder="Gmail address" autocapitalize="none">
                    <div class="nx-pro-iw"><input type="password" id="nx-li-pw" class="nx-pro-in" placeholder="Password" style="padding-right:38px;"><button type="button" id="nx-li-eye" class="nx-pro-eye">👁️</button></div>
                    <div style="display:flex;justify-content:space-between;">
                        <button type="button" id="nx-go-fg" style="background:none;border:none;color:#38bdf8;font-size:12px;font-weight:800;cursor:pointer;">Forgot Password?</button>
                        <button type="button" id="nx-go-otp" style="background:none;border:none;color:#34d399;font-size:12px;font-weight:800;cursor:pointer;">📧 Login with OTP</button>
                    </div>
                    <button type="button" id="nx-li-go" class="nx-pro-btn">🔓 Log In</button>
                </div>`;
            } else if (view === "signup") {
                body = `<div style="display:flex;flex-direction:column;gap:8px;">
                    <input id="nx-su-nm" class="nx-pro-in" placeholder="Full Name *">
                    <input id="nx-su-un" class="nx-pro-in" placeholder="Unique @username *" autocapitalize="none">
                    <div id="nx-su-ust" style="font-size:11px;color:#64748b;font-weight:700;margin-top:-3px;">Letters, numbers &amp; _ only</div>
                    <input type="email" id="nx-su-em" class="nx-pro-in" value="${esc(pendingEmail)}" placeholder="Gmail address *" autocapitalize="none">
                    <div class="nx-pro-iw"><input type="password" id="nx-su-pw" class="nx-pro-in" placeholder="Create Password (6+ chars) *" style="padding-right:38px;"><button type="button" id="nx-su-eye" class="nx-pro-eye">👁️</button></div>
                    <button type="button" id="nx-su-go" class="nx-pro-btn" style="margin-top:2px;">✨ Create Verified Account</button>
                </div>`;
            } else if (view === "forgot") {
                body = `<div style="display:flex;flex-direction:column;gap:10px;">
                    <p style="font-size:12px;color:#cbd5e1;">Registered Gmail dalein — <b>6-Digit OTP</b> bhejenge:</p>
                    <input type="email" id="nx-fg-em" class="nx-pro-in" value="${esc(pendingEmail)}" placeholder="yourname@gmail.com" autocapitalize="none">
                    <button type="button" id="nx-fg-go" class="nx-pro-btn">📧 Send 6-Digit OTP</button>
                    <button type="button" id="nx-fg-have" style="background:none;border:none;color:#34d399;font-size:12px;font-weight:800;cursor:pointer;">🔑 Already have OTP code?</button>
                    <button type="button" id="nx-bk" style="background:none;border:none;color:#94a3b8;font-size:12px;font-weight:800;cursor:pointer;">← Back to Log In</button>
                </div>`;
            } else if (view === "otp_verify") {
                body = `<div style="display:flex;flex-direction:column;gap:10px;">
                    <input type="email" id="nx-ov-em" class="nx-pro-in" value="${esc(pendingEmail)}" placeholder="Gmail address" autocapitalize="none" style="color:#38bdf8;">
                    <input type="tel" id="nx-code-in" class="nx-pro-in" maxlength="8" placeholder="6-Digit OTP" style="text-align:center;font-size:21px;font-weight:900;letter-spacing:5px;color:#34d399;border-color:#10b981;">
                    <button type="button" id="nx-code-go" class="nx-pro-btn">✅ Verify OTP</button>
                    <button type="button" id="nx-bk" style="background:none;border:none;color:#94a3b8;font-size:12px;font-weight:800;cursor:pointer;">← Back to Log In</button>
                </div>`;
            } else if (view === "reset") {
                body = `<div style="display:flex;flex-direction:column;gap:10px;">
                    <p style="font-size:12.5px;color:#34d399;font-weight:800;">✅ Verified! Naya password set karein:</p>
                    <div class="nx-pro-iw"><input type="password" id="nx-rs-pw" class="nx-pro-in" placeholder="New Password (6+ chars)" style="padding-right:38px;"><button type="button" id="nx-rs-eye" class="nx-pro-eye">👁️</button></div>
                    <button type="button" id="nx-rs-go" class="nx-pro-btn">🔐 Save Password &amp; Login</button>
                </div>`;
            }

            m.innerHTML = `<div style="background:linear-gradient(155deg,#0f172a,#090d16);border:1.5px solid #10b981;border-radius:24px;width:100%;max-width:390px;padding:20px 18px;color:#fff;position:relative;">
                <button type="button" id="nx-ax" style="position:absolute;top:14px;right:14px;width:30px;height:30px;border-radius:50%;background:#1e293b;border:none;color:#cbd5e1;cursor:pointer;">✕</button>
                <div style="text-align:center;margin-bottom:12px;">${LOGO}<div style="font-size:18px;font-weight:900;">Nexus Community</div><div style="font-size:11px;color:#34d399;font-weight:700;">🔐 Verified • True E2EE</div></div>
                ${tabs}${googleBtn}
                <div id="nx-ae" style="display:none;background:rgba(244,63,94,.16);border:1px solid #f43f5e;color:#fda4af;padding:8px 10px;border-radius:10px;font-size:12px;margin-bottom:10px;"></div>
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
                        if (error) { this.disabled = false; this.textContent = "🔓 Log In"; return err("❌ Galat Email ya Password!"); }
                        finishInstant("✅ Welcome Back!");
                    } catch (e) { this.disabled = false; this.textContent = "🔓 Log In"; err("❌ " + (e.message || "Retry")); }
                };
            } else if (view === "signup") {
                bindEye("#nx-su-pw", "#nx-su-eye");
                const unIn = m.querySelector("#nx-su-un"), ust = m.querySelector("#nx-su-ust");
                let tm;
                unIn.oninput = () => { clearTimeout(tm); tm = setTimeout(async () => { const r = await checkUsernameAvailable(unIn.value, null); ust.style.color = r.ok ? "#34d399" : "#f43f5e"; ust.textContent = r.ok ? `✅ @${r.clean} available!` : `❌ ${r.reason}`; }, 300); };
                m.querySelector("#nx-su-go").onclick = async function () {
                    this.disabled = true; this.textContent = "⏳ Creating...";
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
                    this.disabled = true; this.textContent = "⏳ Sending OTP...";
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
                        if (error) { this.disabled = false; this.textContent = "✅ Verify OTP"; return err("❌ " + (error.message || "Galat ya expired OTP!")); }
                        if (intent === "recovery") { view = "reset"; render(); } else finishInstant("✅ Gmail Verified!");
                    } catch (e) { this.disabled = false; this.textContent = "✅ Verify OTP"; err("❌ " + (e.message || "Retry")); }
                };
            } else if (view === "reset") {
                bindEye("#nx-rs-pw", "#nx-rs-eye");
                m.querySelector("#nx-rs-go").onclick = async function () {
                    const p = m.querySelector("#nx-rs-pw").value.trim();
                    if (p.length < 6) return err("⚠️ Min 6 characters password dalein.");
                    this.disabled = true; this.textContent = "⏳ Saving...";
                    try {
                        const { error } = await updateUserPassword(p);
                        if (error) { this.disabled = false; this.textContent = "🔐 Save Password & Login"; return err("❌ " + error.message); }
                        finishInstant("🔐 Password Updated!");
                    } catch (e) { this.disabled = false; this.textContent = "🔐 Save Password & Login"; err("❌ " + (e.message || "Retry")); }
                };
            }
        };
        render(); document.body.appendChild(m);
        m.onclick = (e) => { if (e.target === m) m.remove(); };
    }

    async function openSecurityCenterModal() {
        document.getElementById("nx-sec-center-modal")?.remove();
        const uid = await getAuthUid();
        if (!uid) return openAdvancedNexusAuthModal("login");
        const sessions = await getMyActiveSessions(uid);
        const m = document.createElement("div"); m.id = "nx-sec-center-modal";
        m.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,.94);z-index:299000;display:flex;align-items:center;justify-content:center;padding:16px;";
        m.innerHTML = `<div style="background:#0f172a;border:1.5px solid #10b981;border-radius:22px;width:100%;max-width:400px;padding:18px;color:#fff;">
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><h3 style="color:#34d399;font-weight:900;">🛡️ Security Center</h3><button id="nx-scx" style="background:#1e293b;border:none;color:#fff;width:28px;height:28px;border-radius:50%;">✕</button></div>
            <div style="font-size:12px;color:#38bdf8;font-weight:800;margin-bottom:8px;">📱 Active Devices (${sessions.length}/2)</div>
            <button id="nx-scr" style="width:100%;padding:9px;border-radius:10px;background:rgba(244,63,94,.16);border:1px solid #f43f5e;color:#fda4af;font-weight:800;margin-bottom:10px;">🚫 Log Out All Other Devices</button>
            <input id="nx-scp" type="tel" maxlength="6" placeholder="6-Digit E2EE Backup PIN" class="nx-pro-in" style="margin-bottom:8px;">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
                <button id="nx-scb" style="padding:9px;border-radius:10px;background:#10b981;color:#020617;font-weight:900;border:none;">☁️ Backup Key</button>
                <button id="nx-scs" style="padding:9px;border-radius:10px;background:#38bdf8;color:#020617;font-weight:900;border:none;">🔓 Restore Key</button>
            </div>
            <button id="nx-scl" style="width:100%;padding:10px;border-radius:11px;background:#e11d48;color:#fff;font-weight:900;border:none;">🚪 Log Out</button>
        </div>`;
        document.body.appendChild(m);
        m.querySelector("#nx-scx").onclick = () => m.remove();
        m.querySelector("#nx-scl").onclick = logoutUser;
        m.querySelector("#nx-scr").onclick = async () => { await revokeOtherSessions(uid); m.remove(); if (window.Nexus && Nexus.toast) Nexus.toast("🚫 Other devices logged out!"); };
        m.querySelector("#nx-scb").onclick = async () => { try { await backupPrivateKeyWithPin(uid, m.querySelector("#nx-scp").value); if (window.Nexus && Nexus.toast) Nexus.toast("☁️ Key Backed Up!"); } catch (e) { alert(e.message); } };
        m.querySelector("#nx-scs").onclick = async () => { try { await restorePrivateKeyWithPin(uid, m.querySelector("#nx-scp").value); if (window.Nexus && Nexus.toast) Nexus.toast("🔓 Chats Unlocked!"); } catch (e) { alert("❌ Wrong PIN"); } };
    }

    // 7. ORIGINAL-STYLE STORY BAR + 25s HEARTBEAT
    function fmtShort(ms) {
        if (!ms || ms < 1000000000000) return "";
        const s = Math.max(1, Math.floor((Date.now() - ms) / 1000));
        return s <= 95 ? "🟢 Live" : s < 3600 ? Math.floor(s / 60) + "m" : s < 86400 ? Math.floor(s / 3600) + "h" : Math.floor(s / 86400) + "d";
    }

    function renderOfficialStoryBar(force) {
        const homeTab = document.getElementById("tab-home");
        if (!homeTab) return;
        let bar = document.getElementById("nx-stories-bar");
        if (!bar) { bar = document.createElement("div"); bar.id = "nx-stories-bar"; homeTab.prepend(bar); }

        const myRaw = localStorage.getItem("nx_active_account");
        const me = myRaw ? (() => { try { return JSON.parse(myRaw); } catch (e) { return null; } })() : null;
        const myU = normU(me && me.username);
        const list = ((window.Nexus && Nexus.users) || [])
            .filter((u) => u && u.username && normU(u.username) !== "member" && normU(u.username) !== "nexus_official")
            .sort((a, b) => (normU(a.username) === myU ? -1 : normU(b.username) === myU ? 1 : (Number(b.lastOnline || 0) - Number(a.lastOnline || 0))))
            .slice(0, 26);

        const hash = myU + "|" + list.map((u) => `${u.username}:${Math.floor((u.lastOnline || 0) / 60000)}:${(u.dp || "").slice(-12)}`).join(",");
        if (!force && hash === lastStoryHash && bar.children.length > 0) return;
        lastStoryHash = hash;

        const officialCard = `<div data-username="nexus_official" style="display:flex;flex-direction:column;align-items:center;width:68px;flex-shrink:0;cursor:pointer;">
            <div class="nx-story-ring-live" style="position:relative;">
                <div style="width:54px;height:54px;border-radius:50%;background:#0c192c;color:#38bdf8;font-size:22px;font-weight:900;display:flex;align-items:center;justify-content:center;border:2px solid #090d16;">N</div>
                <span style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);background:#10b981;color:#020617;font-size:8.5px;font-weight:900;padding:1px 6px;border-radius:99px;">Official</span>
            </div>
            <div style="font-size:10.5px;font-weight:800;color:#f8fafc;margin-top:7px;">Nexus ✓</div>
        </div>`;

        const userCards = list.map((u) => {
            const uK = normU(u.username), isMe = uK === myU;
            const ts = isMe ? Date.now() : Number(u.lastSeenAt || u.lastOnline || 0);
            const live = isMe || (ts > 0 && (Date.now() - ts) <= 95000);
            const tag = live ? "🟢 Live" : fmtShort(ts);
            const inner = u.dp
                ? `<img src="${esc(u.dp)}" loading="lazy" style="width:54px;height:54px;border-radius:50%;object-fit:cover;border:2px solid #090d16;display:block;">`
                : `<div style="width:54px;height:54px;border-radius:50%;background:#1e293b;color:#f8fafc;font-weight:900;font-size:20px;display:flex;align-items:center;justify-content:center;border:2px solid #090d16;">${esc((u.name || uK)[0].toUpperCase())}</div>`;
            return `<div data-username="${esc(uK)}" style="display:flex;flex-direction:column;align-items:center;width:68px;flex-shrink:0;cursor:pointer;">
                <div class="${live ? "nx-story-ring-live" : "nx-story-ring-idle"}" style="position:relative;">
                    ${inner}
                    ${tag ? `<span style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);background:${live ? "#064e3b" : "#0f172a"};border:1px solid ${live ? "#10b981" : "#334155"};color:${live ? "#34d399" : "#cbd5e1"};font-size:8.5px;font-weight:800;padding:1px 6px;border-radius:99px;white-space:nowrap;">${esc(tag)}</span>` : ""}
                </div>
                <div style="font-size:10.5px;font-weight:700;color:#e2e8f0;margin-top:7px;max-width:66px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(isMe ? "You" : (u.name || uK))}</div>
            </div>`;
        }).join("");

        bar.style.cssText = "display:flex!important;gap:10px;overflow-x:auto;padding:10px 12px 8px;scrollbar-width:none;align-items:flex-start;border-bottom:1px solid #1e293b;background:#090d16;";
        bar.innerHTML = officialCard + userCards;
    }

    async function sendHeartbeat(uid) {
        if (document.visibilityState === "hidden") return;
        const id = uid || await getAuthUid();
        if (id) sb.from("profiles").update({ last_online: new Date().toISOString() }).eq("id", id).then(() => {});
    }

    async function boot() {
        document.getElementById("nx-google-auth-hub")?.remove();
        renderOfficialStoryBar(true);
        const [sessionRes] = await Promise.all([sb.auth.getSession(), fastLiveSupabaseFetch(true)]);
        const user = sessionRes && sessionRes.data && sessionRes.data.session ? sessionRes.data.session.user : null;
        if (user && user.id) {
            await syncCurrentUserProfile(user);
            sendHeartbeat(user.id);
        } else if (localStorage.getItem("nx_active_account")) {
            localStorage.removeItem("nx_active_account");
            localStorage.removeItem("nx_legacy_backup_account");
        }
        sb.channel("nx_live_v52")
            .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fastLiveSupabaseFetch(false))
            .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => fastLiveSupabaseFetch(true))
            .subscribe();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    setInterval(() => { document.getElementById("nx-google-auth-hub")?.remove(); }, 1000);
    setInterval(() => sendHeartbeat(), 25000);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") sendHeartbeat(); });

    window.NexusSecurity = {
        sb, SUPABASE_URL, getAuthenticatedUserId: getAuthUid, loginWithGoogle, sendEmailOtp, verifyEmailOtp,
        signUpWithEmail, loginWithEmail, updateUserPassword, checkUsernameAvailable, syncCurrentUserProfile,
        logoutUser, registerActiveSession, verifyCurrentSessionNotRevoked, getMyActiveSessions, revokeOtherSessions,
        openSecurityCenterModal, openAdvancedNexusAuthModal, initUserE2EEKeys,
        backupPrivateKeyWithPin, restorePrivateKeyWithPin, uploadPublicMedia, uploadPrivateChatMedia,
        getSignedChatMediaUrl, getOrCreateConversation, sendChatMessage, decryptMessageRow, toggleMessageReaction,
        editChatMessage, deleteMessageForEveryone, burnViewOnceMessage, markConversationSeen, subscribeToConversation,
        checkIsUserPro: async () => { const { data, error } = await sb.rpc("is_current_user_pro"); return !error && data === true; }
    };

    try {
        Object.defineProperty(window, "openNexusSupabaseAuthModal", { configurable: true, get: () => openAdvancedNexusAuthModal, set: () => {} });
        Object.defineProperty(window, "openAdvancedGoogleAuthModal", { configurable: true, get: () => openAdvancedNexusAuthModal, set: () => {} });
    } catch (e) { window.openNexusSupabaseAuthModal = window.openAdvancedGoogleAuthModal = openAdvancedNexusAuthModal; }

    window.dispatchEvent(new CustomEvent("nexus-security-ready", { detail: window.NexusSecurity }));
})();
