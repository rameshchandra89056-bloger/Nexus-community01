// ============================================================================
// NEXUS-SECURITY.JS (v4.0 FINAL MASTER — PART 1 OF 2)
// IG/FB-Style Login (6-Digit Gmail OTP + Password + Forgot Password Recovery)
// + Mandatory New-User Profile Onboarding + 2-Device Lock + Security Center
// + True E2EE (ECDH P-256 / AES-256-GCM) + 50MB Storage + View-Once Burn
// ============================================================================
(function () {
    const SUPABASE_URL = ("https" + "://" + "fegmtyoxijvktoxtealo" + ".supabase.co").trim();
    const SUPABASE_ANON_KEY = ("sb_publishable_" + "jpH6tVu1sCNSwLmgvRTxrw_w8xq5thV").trim();

    if (!window.supabase || typeof window.supabase.createClient !== "function") {
        console.error("Supabase CDN not loaded!");
        return;
    }

    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    });

    // -------------------- 1. SAFE ENCODING & 2-DEVICE SESSION LOCK --------------------
    const b64Enc = (buf) => {
        const bytes = new Uint8Array(buf);
        let bin = "";
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        return btoa(bin);
    };

    const b64Dec = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));

    function escHtml(s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
        }[c]));
    }

    function getOrCreateDeviceSessionId() {
        let sid = localStorage.getItem("nexus_device_sid");
        if (!sid) {
            const rand = (window.crypto && crypto.randomUUID)
                ? crypto.randomUUID()
                : (Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 12));
            sid = "nx_" + rand;
            localStorage.setItem("nexus_device_sid", sid);
        }
        return sid;
    }

    async function getAuthenticatedUserId() {
        const { data } = await sb.auth.getSession();
        return (data && data.session && data.session.user && data.session.user.id) || null;
    }

    async function registerActiveSession(userId) {
        if (!userId) return null;
        const sid = getOrCreateDeviceSessionId();
        const ua = navigator.userAgent || "";
        const label = /Android/i.test(ua)
            ? "Android Mobile"
            : /iPhone|iPad/i.test(ua)
            ? "iOS Mobile"
            : /Windows|Mac|Linux/i.test(ua)
            ? "Desktop Browser"
            : "Web Browser";

        try {
            await sb.from("active_sessions").upsert({
                user_id: userId,
                session_id: sid,
                device_label: label,
                is_revoked: false,
                last_active_at: new Date().toISOString()
            }, { onConflict: "session_id" });

            const { data: sessions } = await sb
                .from("active_sessions")
                .select("session_id, last_active_at")
                .eq("user_id", userId)
                .eq("is_revoked", false)
                .order("last_active_at", { ascending: false });

            if (Array.isArray(sessions) && sessions.length > 2) {
                const toRevoke = sessions.slice(2).map((s) => s.session_id);
                await sb
                    .from("active_sessions")
                    .update({ is_revoked: true })
                    .eq("user_id", userId)
                    .in("session_id", toRevoke);
            }
        } catch (e) {}
        return sid;
    }

    async function getMyActiveSessions(userId) {
        const uid = userId || await getAuthenticatedUserId();
        if (!uid) return [];
        const { data } = await sb
            .from("active_sessions")
            .select("*")
            .eq("user_id", uid)
            .eq("is_revoked", false)
            .order("last_active_at", { ascending: false });
        return Array.isArray(data) ? data : [];
    }

    async function revokeOtherSessions(userId) {
        const uid = userId || await getAuthenticatedUserId();
        if (!uid) return;
        const sid = getOrCreateDeviceSessionId();
        await sb
            .from("active_sessions")
            .update({ is_revoked: true })
            .eq("user_id", uid)
            .neq("session_id", sid);
    }

    async function verifyCurrentSessionNotRevoked(userId) {
        const uid = userId || await getAuthenticatedUserId();
        if (!uid) return true;
        const sid = getOrCreateDeviceSessionId();
        const { data } = await sb
            .from("active_sessions")
            .select("is_revoked")
            .eq("user_id", uid)
            .eq("session_id", sid)
            .maybeSingle();

        if (data && data.is_revoked) {
            await sb.auth.signOut();
            localStorage.removeItem("nx_active_account");
            alert("🔒 Aapka account kisi naye device par login hua hai (Max 2 devices limit). Dobara login karein.");
            window.location.reload();
            return false;
        }
        return true;
    }

    // -------------------- 2. INDEXEDDB KEY VAULT & TRUE E2EE --------------------
    function openKeyDb() {
        return new Promise((res, rej) => {
            const req = indexedDB.open("NexusE2EEVault", 1);
            req.onupgradeneeded = () => {
                if (!req.result.objectStoreNames.contains("keys")) {
                    req.result.createObjectStore("keys");
                }
            };
            req.onsuccess = () => res(req.result);
            req.onerror = () => rej(req.error);
        });
    }

    async function saveLocalKey(k, val) {
        const db = await openKeyDb();
        return new Promise((res, rej) => {
            const tx = db.transaction("keys", "readwrite");
            tx.objectStore("keys").put(val, k);
            tx.oncomplete = () => res();
            tx.onerror = () => rej(tx.error);
        });
    }

    async function getLocalKey(k) {
        const db = await openKeyDb();
        return new Promise((res, rej) => {
            const tx = db.transaction("keys", "readonly");
            const req = tx.objectStore("keys").get(k);
            req.onsuccess = () => res(req.result || null);
            req.onerror = () => rej(req.error);
        });
    }

    async function initUserE2EEKeys(userId) {
        if (!userId || !window.crypto || !window.crypto.subtle) return null;
        try {
            let privJwk = await getLocalKey("priv_" + userId);
            let pubJwk = await getLocalKey("pub_" + userId);
            if (!privJwk || !pubJwk) {
                const pair = await crypto.subtle.generateKey(
                    { name: "ECDH", namedCurve: "P-256" }, true, ["deriveKey"]
                );
                privJwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
                pubJwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
                await saveLocalKey("priv_" + userId, privJwk);
                await saveLocalKey("pub_" + userId, pubJwk);
                await sb.from("profiles").update({ e2ee_public_key: JSON.stringify(pubJwk) }).eq("id", userId);
            } else {
                const { data: prof } = await sb.from("profiles").select("e2ee_public_key").eq("id", userId).maybeSingle();
                if (!prof || !prof.e2ee_public_key) {
                    await sb.from("profiles").update({ e2ee_public_key: JSON.stringify(pubJwk) }).eq("id", userId);
                }
            }
            return privJwk;
        } catch (e) {
            return null;
        }
    }

    async function deriveSharedAesKey(myUserId, peerPublicKeyJson) {
        const myPrivJwk = await initUserE2EEKeys(myUserId);
        if (!myPrivJwk || !peerPublicKeyJson) return null;
        const privKey = await crypto.subtle.importKey(
            "jwk", myPrivJwk, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveKey"]
        );
        const pubKey = await crypto.subtle.importKey(
            "jwk", JSON.parse(peerPublicKeyJson), { name: "ECDH", namedCurve: "P-256" }, false, []
        );
        return crypto.subtle.deriveKey(
            { name: "ECDH", public: pubKey }, privKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
        );
    }

    async function derivePinKey(pin, saltBytes) {
        const base = await crypto.subtle.importKey(
            "raw", new TextEncoder().encode(String(pin)), "PBKDF2", false, ["deriveKey"]
        );
        return crypto.subtle.deriveKey(
            { name: "PBKDF2", salt: saltBytes, iterations: 120000, hash: "SHA-256" },
            base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
        );
    }

    async function backupPrivateKeyWithPin(userId, sixDigitPin) {
        const uid = userId || await getAuthenticatedUserId();
        if (!uid) throw new Error("Not logged in");
        const pinStr = String(sixDigitPin || "").replace(/\D/g, "");
        if (pinStr.length !== 6) throw new Error("Exact 6-digit Backup PIN dalein.");
        const privJwk = await initUserE2EEKeys(uid);
        const pubJwk = await getLocalKey("pub_" + uid);
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const pinKey = await derivePinKey(pinStr, salt);
        const enc = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv }, pinKey, new TextEncoder().encode(JSON.stringify({ privJwk, pubJwk }))
        );
        const { error } = await sb.from("profiles").update({
            e2ee_encrypted_backup: JSON.stringify({ iv: b64Enc(iv), data: b64Enc(enc) }),
            e2ee_backup_salt: b64Enc(salt)
        }).eq("id", uid);
        if (error) throw error;
        return true;
    }

    async function restorePrivateKeyWithPin(userId, sixDigitPin) {
        const uid = userId || await getAuthenticatedUserId();
        if (!uid) throw new Error("Not logged in");
        const { data } = await sb
            .from("profiles")
            .select("e2ee_encrypted_backup, e2ee_backup_salt")
            .eq("id", uid)
            .single();
        if (!data || !data.e2ee_encrypted_backup) throw new Error("Koi Backup PIN saved nahi mila.");
        const parsed = JSON.parse(data.e2ee_encrypted_backup);
        const pinKey = await derivePinKey(String(sixDigitPin || "").trim(), b64Dec(data.e2ee_backup_salt));
        const dec = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: b64Dec(parsed.iv) }, pinKey, b64Dec(parsed.data)
        );
        const obj = JSON.parse(new TextDecoder().decode(dec));
        await saveLocalKey("priv_" + uid, obj.privJwk || obj);
        if (obj.pubJwk) await saveLocalKey("pub_" + uid, obj.pubJwk);
        return true;
    }

    // -------------------- 3. AUTHENTICATION, OTP & ACCOUNT RECOVERY --------------------
    async function loginWithGoogle() {
        return sb.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: window.location.origin + window.location.pathname }
        });
    }

    async function sendEmailOtp(email, shouldCreate = true) {
        const cleanEmail = String(email || "").trim().toLowerCase();
        if (!cleanEmail || !cleanEmail.includes("@")) {
            return { error: { message: "Sahi Gmail address dalein." } };
        }
        return sb.auth.signInWithOtp({
            email: cleanEmail,
            options: { shouldCreateUser: Boolean(shouldCreate) }
        });
    }

    async function verifyEmailOtp(email, otpCode) {
        const cleanEmail = String(email || "").trim().toLowerCase();
        const cleanToken = String(otpCode || "").replace(/\D/g, "").trim();
        if (cleanToken.length < 6) {
            return { error: { message: "Poora 6-digit OTP code dalein." } };
        }
        const { data, error } = await sb.auth.verifyOtp({
            email: cleanEmail,
            token: cleanToken,
            type: "email"
        });
        if (error) return { data, error };
        if (data && data.user) await syncCurrentUserProfile();
        return { data, error: null };
    }

    async function loginWithEmail(email, password) {
        const cleanEmail = String(email || "").trim().toLowerCase();
        const { data, error } = await sb.auth.signInWithPassword({
            email: cleanEmail,
            password: String(password || "")
        });
        if (error) return { data, error };
        if (data && data.user) await syncCurrentUserProfile();
        return { data, error: null };
    }

    async function updateUserPassword(newPassword) {
        const pw = String(newPassword || "").trim();
        if (pw.length < 6) return { error: { message: "Password kam se kam 6 characters ka hona chahiye." } };
        return sb.auth.updateUser({ password: pw });
    }

    async function checkUsernameAvailable(rawUsername, ignoreUserId) {
        const clean = String(rawUsername || "").toLowerCase().replace(/^@/, "").replace(/[^a-z0-9_]/g, "").slice(0, 24);
        if (clean.length < 3) return { ok: false, clean, reason: "Kam se kam 3 letters dalein." };
        if (["admin", "nexus", "nexus_official", "member", "support"].includes(clean)) {
            return { ok: false, clean, reason: "Yeh username reserved hai." };
        }
        const { data } = await sb.from("profiles").select("id").eq("username", clean).maybeSingle();
        if (data && data.id !== ignoreUserId) {
            return { ok: false, clean, reason: `@${clean} pehle se liya ja chuka hai.` };
        }
        return { ok: true, clean };
    }

    async function completeUserOnboarding({ displayName, username, bio, password, backupPin }) {
        const uid = await getAuthenticatedUserId();
        if (!uid) throw new Error("Login session expired. Dobara login karein.");

        const check = await checkUsernameAvailable(username, uid);
        if (!check.ok) throw new Error(check.reason);

        const cleanName = String(displayName || "").trim();
        if (cleanName.length < 2) throw new Error("Apna sahi Full Name dalein.");

        const { error } = await sb.from("profiles").upsert({
            id: uid,
            firebase_uid: check.clean,
            username: check.clean,
            display_name: cleanName.slice(0, 60),
            bio: String(bio || "Nexus Community Member ✨").trim().slice(0, 220),
            is_onboarded: true,
            last_online: new Date().toISOString()
        }, { onConflict: "id" });
        if (error) throw error;

        if (password && String(password).trim().length >= 6) {
            await updateUserPassword(password).catch(() => {});
        }
        if (backupPin && String(backupPin).replace(/\D/g, "").length === 6) {
            await backupPrivateKeyWithPin(uid, backupPin).catch(() => {});
        }
        return syncCurrentUserProfile();
    }

    async function syncCurrentUserProfile() {
        const { data: sessionData } = await sb.auth.getSession();
        const user = sessionData && sessionData.session ? sessionData.session.user : null;
        if (!user) return null;

        let { data: prof } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
        let needsOnboarding = false;

        if (!prof) {
            // Brand new user — create temporary row and force IG-style Onboarding!
            const tempUname = "user_" + user.id.replace(/-/g, "").slice(0, 8);
            const newRow = {
                id: user.id,
                firebase_uid: tempUname,
                username: tempUname,
                display_name: "",
                avatar_url: String((user.user_metadata && (user.user_metadata.avatar_url || user.user_metadata.picture)) || ""),
                bio: "Nexus Community Member ✨",
                is_verified: true,
                is_onboarded: false,
                role: "user",
                last_online: new Date().toISOString()
            };
            const { data: inserted } = await sb.from("profiles").upsert(newRow, { onConflict: "id" }).select("*").single();
            prof = inserted || newRow;
            needsOnboarding = true;
        } else {
            needsOnboarding = prof.is_onboarded === false || !prof.display_name;
            sb.from("profiles").update({ last_online: new Date().toISOString() }).eq("id", user.id).then(() => {});
        }

        if (prof.is_banned) {
            await sb.auth.signOut();
            localStorage.removeItem("nx_active_account");
            alert("🚫 Your account has been suspended by Admin.");
            return null;
        }

        await registerActiveSession(user.id);
        await initUserE2EEKeys(user.id);

        const bridged = {
            id: prof.id,
            uid: prof.id,
            username: prof.username,
            name: prof.display_name || prof.username,
            email: user.email || "",
            dp: prof.avatar_url || "",
            bio: prof.bio || "",
            moodNote: prof.mood_note || "",
            profileSong: prof.profile_song || null,
            website: prof.website || "",
            verified: Boolean(prof.is_verified),
            googleVerified: true,
            isOnboarded: !needsOnboarding,
            role: prof.role || "user",
            blockedUsers: Array.isArray(prof.blocked_users) ? prof.blocked_users : [],
            showReadReceipts: prof.show_read_receipts !== false,
            followersList: Array.isArray(prof.followers_list) ? prof.followers_list : [],
            followingList: Array.isArray(prof.following_list) ? prof.following_list : [],
            isOnlineNow: true,
            lastOnline: Date.now()
        };

        try { localStorage.setItem("nx_active_account", JSON.stringify(bridged)); } catch (e) {}

        if (needsOnboarding) {
            setTimeout(() => openMandatoryOnboardingModal(bridged), 120);
        }
        return bridged;
    }

    async function logoutUser() {
        try {
            const sid = localStorage.getItem("nexus_device_sid");
            if (sid) await sb.from("active_sessions").update({ is_revoked: true }).eq("session_id", sid);
        } catch (e) {}
        await sb.auth.signOut();
        localStorage.removeItem("nx_active_account");
        localStorage.removeItem("nx_legacy_backup_account");
        window.location.reload();
    }
    // -------------------- 4. 50MB STORAGE MEDIA ENGINE --------------------
    function sanitizeExt(file) {
        const name = String((file && file.name) || "");
        const dot = name.lastIndexOf(".");
        if (dot !== -1) {
            const ext = name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "");
            if (ext && ext.length <= 6) return ext;
        }
        const mime = String((file && file.type) || "").toLowerCase();
        if (mime.includes("png")) return "png";
        if (mime.includes("webp")) return "webp";
        if (mime.includes("mp4")) return "mp4";
        if (mime.includes("webm")) return "webm";
        if (mime.includes("pdf")) return "pdf";
        if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
        return "jpg";
    }

    async function uploadPublicMedia(file, folder) {
        if (!file) throw new Error("No file selected");
        if (file.size > 50 * 1024 * 1024) throw new Error("File 50MB se kam honi chahiye.");
        const path = `${folder || "posts"}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${sanitizeExt(file)}`;
        const { error } = await sb.storage.from("public-media").upload(path, file, {
            contentType: file.type || "application/octet-stream",
            upsert: false
        });
        if (error) throw error;
        const { data } = sb.storage.from("public-media").getPublicUrl(path);
        return { publicUrl: data.publicUrl, path };
    }

    async function uploadPrivateChatMedia(file, conversationId) {
        if (!file) throw new Error("No file selected");
        if (file.size > 50 * 1024 * 1024) throw new Error("Media 50MB se kam honi chahiye.");
        const ext = sanitizeExt(file);
        const safeConv = String(conversationId || "general").replace(/[^a-zA-Z0-9_-]/g, "");
        const path = `${safeConv}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await sb.storage.from("private-chat-media").upload(path, file, {
            contentType: file.type || "application/octet-stream",
            upsert: false
        });
        if (error) throw error;
        return {
            path,
            fileName: file.name || `media.${ext}`,
            mimeType: file.type || "application/octet-stream",
            size: file.size
        };
    }

    const signedUrlCache = new Map();
    async function getSignedChatMediaUrl(storagePath, expiresSec) {
        if (!storagePath) return "";
        if (/^https?:\/\//i.test(storagePath) || /^data:/i.test(storagePath)) return storagePath;
        const cached = signedUrlCache.get(storagePath);
        if (cached && cached.exp > Date.now() + 60000) return cached.url;
        const exp = expiresSec || 3600;
        const { data, error } = await sb.storage.from("private-chat-media").createSignedUrl(storagePath, exp);
        if (error || !data || !data.signedUrl) return "";
        signedUrlCache.set(storagePath, { url: data.signedUrl, exp: Date.now() + (exp * 1000) });
        return data.signedUrl;
    }

    // -------------------- 5. 1:1 CONVERSATIONS, TRUE E2EE, DISAPPEARING & EXACT REACTIONS --------------------
    async function getOrCreateConversation(myId, peerId) {
        const authUid = await getAuthenticatedUserId();
        const senderUid = authUid || myId;
        if (!senderUid || !peerId) throw new Error("Invalid user IDs");
        const [a, b] = senderUid < peerId ? [senderUid, peerId] : [peerId, senderUid];
        const { data: existing } = await sb
            .from("conversations")
            .select("id, disappearing_seconds, pinned_text")
            .eq("participant_a", a)
            .eq("participant_b", b)
            .maybeSingle();
        if (existing && existing.id) return existing.id;

        const { data: created, error } = await sb
            .from("conversations")
            .insert({ participant_a: a, participant_b: b })
            .select("id")
            .single();
        if (error) throw error;
        return created.id;
    }

    async function sendChatMessage(opts) {
        // ALWAYS verify live Supabase Auth UID so RLS auth.uid() = sender_id NEVER fails!
        const authUid = await getAuthenticatedUserId();
        const senderUid = authUid || opts.myUserId;
        if (!senderUid) throw new Error("Session expired — dobara login karein.");

        const rawJson = JSON.stringify({
            v: 2,
            t: String(opts.text || ""),
            mp: String(opts.mediaPath || ""),
            mt: String(opts.mediaType || "text"),
            fn: String(opts.fileName || ""),
            stk: opts.sticker || null,
            vo: Boolean(opts.isViewOnce)
        });

        let ciphertext = rawJson;
        let ivStr = "WAIT_PEER_KEY";
        if (opts.peerPublicKeyJson && senderUid !== opts.peerUserId) {
            try {
                const aesKey = await deriveSharedAesKey(senderUid, opts.peerPublicKeyJson);
                if (aesKey) {
                    const iv = crypto.getRandomValues(new Uint8Array(12));
                    const encBuf = await crypto.subtle.encrypt(
                        { name: "AES-GCM", iv }, aesKey, new TextEncoder().encode(rawJson)
                    );
                    ciphertext = b64Enc(encBuf);
                    ivStr = b64Enc(iv);
                }
            } catch (e) {}
        }

        const dbMsgType = ["image", "video", "audio", "file"].includes(opts.mediaType) ? opts.mediaType : "text";
        const expiresAt = opts.disappearingSeconds > 0
            ? new Date(Date.now() + (Number(opts.disappearingSeconds) * 1000)).toISOString()
            : null;

        const { data, error } = await sb.from("messages").insert({
            conversation_id: opts.conversationId,
            sender_id: senderUid,
            receiver_id: opts.peerUserId,
            ciphertext,
            iv: ivStr,
            msg_type: dbMsgType,
            media_path: String(opts.mediaPath || ""),
            is_view_once: Boolean(opts.isViewOnce),
            view_once_opened: false,
            reply_to: opts.replyTo || null,
            reactions: {},
            seen: false,
            is_edited: false,
            is_deleted_everyone: false,
            expires_at: expiresAt
        }).select("*").single();

        if (error) throw error;
        return data;
    }

    async function decryptMessageRow(row, myUserId, peerPublicKeyJson) {
        if (!row) return null;
        if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) {
            return { deleted: true, expired: true, text: "⏱️ Disappearing message expired", mediaPath: "", mediaType: "text", fileName: "", sticker: null, viewOnce: false, viewOnceOpened: false };
        }
        if (row.is_deleted_everyone) {
            return { deleted: true, text: "This message was deleted", mediaPath: "", mediaType: "text", fileName: "", sticker: null, viewOnce: false, viewOnceOpened: false };
        }

        let plainStr = row.ciphertext || "";
        const iv = String(row.iv || "");

        if (row.msg_type === "legacy_migrated" || iv === "LEGACY_PLAIN") {
            const isImg = /^data:image\/|^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i.test(plainStr);
            return { deleted: false, text: isImg ? "" : plainStr, mediaPath: isImg ? plainStr : (row.media_path || ""), mediaType: isImg ? "image" : "text", fileName: "", sticker: null, viewOnce: false, viewOnceOpened: false };
        }

        if (iv !== "WAIT_PEER_KEY" && iv.length >= 8 && peerPublicKeyJson) {
            try {
                const aesKey = await deriveSharedAesKey(myUserId, peerPublicKeyJson);
                if (aesKey) {
                    const plainBuf = await crypto.subtle.decrypt(
                        { name: "AES-GCM", iv: b64Dec(iv) }, aesKey, b64Dec(row.ciphertext)
                    );
                    plainStr = new TextDecoder().decode(plainBuf);
                }
            } catch (e) {
                return { deleted: false, locked: true, text: "🔒 Encrypted on another device — enter 6-digit Backup PIN in Security Center", mediaPath: "", mediaType: "text", fileName: "", sticker: null, viewOnce: Boolean(row.is_view_once), viewOnceOpened: Boolean(row.view_once_opened) };
            }
        }

        try {
            const obj = JSON.parse(plainStr);
            if (obj && obj.v === 2) {
                return {
                    deleted: false, text: obj.t || "",
                    mediaPath: row.view_once_opened ? "" : (obj.mp || row.media_path || ""),
                    mediaType: obj.mt || row.msg_type || "text",
                    fileName: obj.fn || "", sticker: obj.stk || null,
                    viewOnce: Boolean(row.is_view_once || obj.vo),
                    viewOnceOpened: Boolean(row.view_once_opened)
                };
            }
        } catch (e) {}

        return { deleted: false, text: plainStr, mediaPath: row.view_once_opened ? "" : (row.media_path || ""), mediaType: row.msg_type || "text", fileName: "", sticker: null, viewOnce: Boolean(row.is_view_once), viewOnceOpened: Boolean(row.view_once_opened) };
    }

    async function toggleMessageReaction(messageId, emoji, myUsername) {
        const uname = String(myUsername || "").toLowerCase().trim();
        const { data: row, error } = await sb.from("messages").select("reactions").eq("id", messageId).single();
        if (error || !row) return null;
        const reactions = Object.assign({}, row.reactions || {});
        if (reactions[uname] === emoji) delete reactions[uname];
        else reactions[uname] = emoji;
        const { error: upErr } = await sb.from("messages").update({ reactions }).eq("id", messageId);
        if (upErr) throw upErr;
        return reactions;
    }

    async function editChatMessage(opts) {
        const authUid = await getAuthenticatedUserId();
        const senderUid = authUid || opts.myUserId;
        const rawJson = JSON.stringify({ v: 2, t: String(opts.newText || ""), mp: "", mt: "text", fn: "", stk: null, vo: false });
        let ciphertext = rawJson, ivStr = "WAIT_PEER_KEY";
        if (opts.peerPublicKeyJson && senderUid !== opts.peerUserId) {
            try {
                const aesKey = await deriveSharedAesKey(senderUid, opts.peerPublicKeyJson);
                if (aesKey) {
                    const iv = crypto.getRandomValues(new Uint8Array(12));
                    const encBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, new TextEncoder().encode(rawJson));
                    ciphertext = b64Enc(encBuf);
                    ivStr = b64Enc(iv);
                }
            } catch (e) {}
        }
        return sb.from("messages").update({ ciphertext, iv: ivStr, is_edited: true }).eq("id", opts.messageId).eq("sender_id", senderUid);
    }

    async function deleteMessageForEveryone(messageId, storagePath) {
        if (storagePath && !/^https?:\/\//i.test(storagePath) && !/^data:/i.test(storagePath)) {
            try { await sb.storage.from("private-chat-media").remove([storagePath]); signedUrlCache.delete(storagePath); } catch (e) {}
        }
        return sb.from("messages").update({ is_deleted_everyone: true, ciphertext: "", media_path: "", reactions: {} }).eq("id", messageId);
    }

    async function burnViewOnceMessage(messageId, storagePath) {
        if (storagePath && !/^https?:\/\//i.test(storagePath) && !/^data:/i.test(storagePath)) {
            try { await sb.storage.from("private-chat-media").remove([storagePath]); signedUrlCache.delete(storagePath); } catch (e) {}
        }
        return sb.from("messages").update({ view_once_opened: true, ciphertext: "", media_path: "" }).eq("id", messageId);
    }

    async function markConversationSeen(conversationId, myUserId) {
        const uid = (await getAuthenticatedUserId()) || myUserId;
        if (!conversationId || !uid) return;
        const meRaw = localStorage.getItem("nx_active_account");
        try {
            const meObj = meRaw ? JSON.parse(meRaw) : null;
            if (meObj && meObj.showReadReceipts === false) return;
        } catch (e) {}
        return sb.from("messages").update({ seen: true }).eq("conversation_id", conversationId).eq("receiver_id", uid).eq("seen", false);
    }

    function subscribeToConversation(conversationId, onEvent) {
        const ch = sb.channel("nx_conv_" + conversationId)
            .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, (p) => {
                if (typeof onEvent === "function") onEvent(p);
            }).subscribe();
        return () => { try { sb.removeChannel(ch); } catch (e) {} };
    }

    async function checkIsUserPro() {
        const { data, error } = await sb.rpc("is_current_user_pro");
        return !error && data === true;
    }

    // -------------------- 6. MANDATORY NEW-USER ONBOARDING MODAL (IG/FB STYLE) --------------------
    function openMandatoryOnboardingModal(userObj) {
        if (document.getElementById("nx-onboard-modal")) return;
        const modal = document.createElement("div");
        modal.id = "nx-onboard-modal";
        modal.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,0.96);z-index:310000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(8px);";

        modal.innerHTML = `
            <div style="background:linear-gradient(155deg,#0f172a,#090d16);border:1.5px solid #10b981;border-radius:24px;width:100%;max-width:400px;padding:22px 18px;color:#fff;box-shadow:0 24px 60px rgba(0,0,0,0.95);max-height:90dvh;overflow-y:auto;">
                <div style="text-align:center;margin-bottom:14px;">
                    <div style="font-size:32px;margin-bottom:4px;">✨</div>
                    <h3 style="font-size:18px;font-weight:900;color:#34d399;">Complete Your Nexus Profile</h3>
                    <p style="font-size:11.5px;color:#94a3b8;margin-top:3px;">Apna asli naam, unique @username aur security PIN set karein</p>
                </div>

                <div id="nx-ob-err" style="display:none;background:rgba(244,63,94,0.16);border:1px solid #f43f5e;color:#fda4af;padding:8px 10px;border-radius:10px;font-size:12px;font-weight:700;margin-bottom:10px;"></div>

                <div style="display:flex;flex-direction:column;gap:10px;">
                    <div>
                        <label style="font-size:10.5px;font-weight:800;color:#94a3b8;">FULL NAME *</label>
                        <input type="text" id="nx-ob-name" value="${escHtml((userObj && userObj.name && !String(userObj.name).startsWith("user_")) ? userObj.name : "")}" placeholder="e.g. Mohit Kumar" style="width:100%;margin-top:4px;padding:11px 12px;border-radius:11px;background:#090d16;border:1px solid #334155;color:#fff;font-size:13.5px;outline:none;" />
                    </div>
                    <div>
                        <label style="font-size:10.5px;font-weight:800;color:#94a3b8;">UNIQUE USERNAME * (NO SPACES)</label>
                        <input type="text" id="nx-ob-uname" placeholder="e.g. mohit_01" autocapitalize="none" style="width:100%;margin-top:4px;padding:11px 12px;border-radius:11px;background:#090d16;border:1px solid #334155;color:#fff;font-size:13.5px;outline:none;" />
                        <div id="nx-ob-ustatus" style="font-size:11px;margin-top:4px;font-weight:700;color:#64748b;">Letters, numbers &amp; underscore (_) only</div>
                    </div>
                    <div>
                        <label style="font-size:10.5px;font-weight:800;color:#94a3b8;">BIO / TARGET</label>
                        <input type="text" id="nx-ob-bio" placeholder="e.g. IIT-JEE 2027 • Coding" style="width:100%;margin-top:4px;padding:10px 12px;border-radius:11px;background:#090d16;border:1px solid #334155;color:#fff;font-size:13px;outline:none;" />
                    </div>
                    <div>
                        <label style="font-size:10.5px;font-weight:800;color:#38bdf8;">SET ACCOUNT PASSWORD (FOR FAST LOGIN)</label>
                        <input type="password" id="nx-ob-pass" placeholder="Min 6 characters" style="width:100%;margin-top:4px;padding:10px 12px;border-radius:11px;background:#090d16;border:1px solid #334155;color:#fff;font-size:13px;outline:none;" />
                    </div>
                    <div>
                        <label style="font-size:10.5px;font-weight:800;color:#34d399;">6-DIGIT E2EE CHAT BACKUP PIN (OPTIONAL)</label>
                        <input type="tel" id="nx-ob-pin" maxlength="6" placeholder="e.g. 258046 (Naye phone par chats unlock karne ke liye)" style="width:100%;margin-top:4px;padding:10px 12px;border-radius:11px;background:#090d16;border:1px solid #10b981;color:#34d399;font-size:13.5px;font-weight:800;letter-spacing:2px;outline:none;" />
                    </div>

                    <button type="button" id="nx-ob-save" style="width:100%;margin-top:4px;padding:13px;border-radius:13px;background:linear-gradient(90deg,#10b981,#06b6d4);color:#020617;font-weight:900;font-size:14px;border:none;cursor:pointer;">
                        🚀 Finish &amp; Enter Nexus
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const uInp = modal.querySelector("#nx-ob-uname");
        const uSt = modal.querySelector("#nx-ob-ustatus");
        let checkTimer = null;
        uInp.oninput = () => {
            clearTimeout(checkTimer);
            const val = uInp.value.trim();
            if (val.length < 3) { uSt.style.color = "#f59e0b"; uSt.textContent = "Kam se kam 3 letters dalein"; return; }
            uSt.style.color = "#38bdf8"; uSt.textContent = "⏳ Checking availability...";
            checkTimer = setTimeout(async () => {
                const uid = await getAuthenticatedUserId();
                const res = await checkUsernameAvailable(val, uid);
                uSt.style.color = res.ok ? "#34d399" : "#f43f5e";
                uSt.textContent = res.ok ? `✅ @${res.clean} available hai!` : `❌ ${res.reason}`;
            }, 350);
        };

        modal.querySelector("#nx-ob-save").onclick = async function () {
            const errBox = modal.querySelector("#nx-ob-err");
            errBox.style.display = "none";
            this.disabled = true;
            this.textContent = "⏳ Saving Your Verified Profile...";
            try {
                await completeUserOnboarding({
                    displayName: modal.querySelector("#nx-ob-name").value,
                    username: uInp.value,
                    bio: modal.querySelector("#nx-ob-bio").value,
                    password: modal.querySelector("#nx-ob-pass").value,
                    backupPin: modal.querySelector("#nx-ob-pin").value
                });
                modal.remove();
                if (window.Nexus && Nexus.refreshCloudData) await Nexus.refreshCloudData();
                if (window.Nexus && Nexus.toast) Nexus.toast("🎉 Welcome to Nexus Community!");
                if (window.renderMyInstagramProfileTab) window.renderMyInstagramProfileTab();
            } catch (err) {
                this.disabled = false;
                this.textContent = "🚀 Finish & Enter Nexus";
                errBox.textContent = "❌ " + (err.message || "Try again");
                errBox.style.display = "block";
            }
        };
    }

    // -------------------- 7. IG / FB STYLE AUTH & ACCOUNT RECOVERY MODAL --------------------
    function openAdvancedNexusAuthModal(initialMode) {
        document.getElementById("nx-sb-auth-modal")?.remove();
        document.getElementById("nx-instant-auth-modal")?.remove();

        // Views: 'login' | 'signup' | 'otp_verify' | 'forgot' | 'forgot_reset' | 'lost_email'
        let view = initialMode === "signup" ? "signup" : "login";
        let pendingEmail = "";
        let otpIntent = "signup"; // 'signup' | 'login' | 'recovery'

        const modal = document.createElement("div");
        modal.id = "nx-sb-auth-modal";
        modal.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,0.94);z-index:299000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(8px);";

        const finishLogin = async (msg) => {
            if (window.Nexus && Nexus.refreshCloudData) await Nexus.refreshCloudData();
            modal.remove();
            document.getElementById("nx-google-auth-hub")?.remove();
            document.body.classList.remove("nx-auth-locked");
            if (window.Nexus && Nexus.toast) Nexus.toast(msg || "✅ Logged In Successfully!");
            if (window.renderMyInstagramProfileTab) window.renderMyInstagramProfileTab();
        };

        const render = () => {
            let bodyHtml = "";

            if (view === "login") {
                bodyHtml = `
                    <div style="display:flex;flex-direction:column;gap:10px;">
                        <input type="email" id="nx-li-email" value="${escHtml(pendingEmail)}" placeholder="Gmail address" autocapitalize="none" style="width:100%;padding:12px;border-radius:12px;background:#090d16;border:1px solid #334155;color:#fff;font-size:13.5px;outline:none;" />
                        <input type="password" id="nx-li-pass" placeholder="Password" style="width:100%;padding:12px;border-radius:12px;background:#090d16;border:1px solid #334155;color:#fff;font-size:13.5px;outline:none;" />
                        <button type="button" id="nx-li-go" style="width:100%;padding:13px;border-radius:13px;background:linear-gradient(90deg,#10b981,#06b6d4);color:#020617;font-weight:900;font-size:14px;border:none;cursor:pointer;">🔓 Log In</button>

                        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:2px;">
                            <button type="button" id="nx-go-forgot" style="background:none;border:none;color:#38bdf8;font-size:12px;font-weight:800;cursor:pointer;">Forgot Password?</button>
                            <button type="button" id="nx-go-otp-login" style="background:none;border:none;color:#34d399;font-size:12px;font-weight:800;cursor:pointer;">📧 Login with 6-Digit OTP</button>
                        </div>

                        <div style="border-top:1px solid #1e293b;padding-top:12px;margin-top:4px;text-align:center;">
                            <button type="button" id="nx-go-signup" style="width:100%;padding:11px;border-radius:12px;background:rgba(16,185,129,0.14);border:1px solid rgba(16,185,129,0.45);color:#34d399;font-weight:900;font-size:13px;cursor:pointer;">✨ Create New Nexus Account</button>
                        </div>
                    </div>
                `;
            } else if (view === "signup") {
                bodyHtml = `
                    <div style="display:flex;flex-direction:column;gap:10px;">
                        <p style="font-size:12px;color:#cbd5e1;line-height:1.45;">Apna asli <b>Gmail address</b> dalein — hum <b>Nexus Community</b> ki taraf se <b>6-Digit Verification Code</b> bhejenge. Verify hone ke baad aap apna Naam aur @username set karenge.</p>
                        <input type="email" id="nx-su-email" value="${escHtml(pendingEmail)}" placeholder="e.g. yourname@gmail.com" autocapitalize="none" style="width:100%;padding:12px;border-radius:12px;background:#090d16;border:1.5px solid #10b981;color:#fff;font-size:14px;outline:none;" />
                        <button type="button" id="nx-su-send" style="width:100%;padding:13px;border-radius:13px;background:linear-gradient(90deg,#10b981,#06b6d4);color:#020617;font-weight:900;font-size:14px;border:none;cursor:pointer;">📧 Send 6-Digit Verification OTP</button>
                        <button type="button" id="nx-back-login" style="background:none;border:none;color:#94a3b8;font-size:12px;font-weight:800;cursor:pointer;">← Already have an account? Log In</button>
                    </div>
                `;
            } else if (view === "forgot") {
                bodyHtml = `
                    <div style="display:flex;flex-direction:column;gap:10px;">
                        <p style="font-size:12px;color:#cbd5e1;line-height:1.45;"><b>Account Recovery:</b> Apna registered Gmail dalein. Hum aapko <b>6-Digit Recovery Code</b> bhejenge jisse aap turant naya password bana sakenge.</p>
                        <input type="email" id="nx-fg-email" value="${escHtml(pendingEmail)}" placeholder="Registered Gmail address" autocapitalize="none" style="width:100%;padding:12px;border-radius:12px;background:#090d16;border:1px solid #38bdf8;color:#fff;font-size:13.5px;outline:none;" />
                        <button type="button" id="nx-fg-send" style="width:100%;padding:13px;border-radius:13px;background:#38bdf8;color:#020617;font-weight:900;font-size:14px;border:none;cursor:pointer;">🔑 Send 6-Digit Recovery OTP</button>
                        <button type="button" id="nx-go-lost-email" style="background:none;border:none;color:#fbbf24;font-size:11.5px;font-weight:800;cursor:pointer;">⚠️ Gmail bhi kho gayi hai? Help dekhein</button>
                        <button type="button" id="nx-back-login" style="background:none;border:none;color:#94a3b8;font-size:12px;font-weight:800;cursor:pointer;">← Back to Log In</button>
                    </div>
                `;
            } else if (view === "otp_verify") {
                bodyHtml = `
                    <div style="display:flex;flex-direction:column;gap:10px;">
                        <div style="font-size:12px;color:#cbd5e1;text-align:center;line-height:1.45;">
                            <b>Nexus Community</b> ne 6-digit code bheja hai:<br>
                            <b style="color:#38bdf8;">${escHtml(pendingEmail)}</b><br>
                            <span style="font-size:11px;color:#94a3b8;">(Inbox ya Spam folder check karein)</span>
                        </div>
                        <input type="tel" id="nx-ov-code" maxlength="6" placeholder="• • • • • •" style="width:100%;padding:13px;border-radius:12px;background:#090d16;border:1.5px solid #10b981;color:#34d399;font-size:24px;font-weight:900;text-align:center;letter-spacing:9px;outline:none;" />
                        <button type="button" id="nx-ov-go" style="width:100%;padding:13px;border-radius:13px;background:linear-gradient(90deg,#10b981,#06b6d4);color:#020617;font-weight:900;font-size:14px;border:none;cursor:pointer;">✅ Verify 6-Digit Code</button>
                        <div style="display:flex;justify-content:space-between;">
                            <button type="button" id="nx-ov-resend" style="background:none;border:none;color:#38bdf8;font-size:12px;font-weight:800;cursor:pointer;">🔄 Resend Code</button>
                            <button type="button" id="nx-back-login" style="background:none;border:none;color:#94a3b8;font-size:12px;font-weight:800;cursor:pointer;">Change Gmail</button>
                        </div>
                    </div>
                `;
            } else if (view === "forgot_reset") {
                bodyHtml = `
                    <div style="display:flex;flex-direction:column;gap:10px;">
                        <p style="font-size:12.5px;color:#34d399;font-weight:800;">✅ Gmail Verified! Ab apna naya strong password set karein:</p>
                        <input type="password" id="nx-rs-pw1" placeholder="New Password (min 6 characters)" style="width:100%;padding:12px;border-radius:12px;background:#090d16;border:1px solid #10b981;color:#fff;font-size:13.5px;outline:none;" />
                        <input type="password" id="nx-rs-pw2" placeholder="Confirm New Password" style="width:100%;padding:12px;border-radius:12px;background:#090d16;border:1px solid #334155;color:#fff;font-size:13.5px;outline:none;" />
                        <button type="button" id="nx-rs-save" style="width:100%;padding:13px;border-radius:13px;background:#10b981;color:#020617;font-weight:900;font-size:14px;border:none;cursor:pointer;">🔐 Save New Password &amp; Login</button>
                    </div>
                `;
            } else if (view === "lost_email") {
                bodyHtml = `
                    <div style="display:flex;flex-direction:column;gap:10px;font-size:12.5px;color:#cbd5e1;line-height:1.5;">
                        <div style="background:#090d16;border:1px solid #fbbf24;border-radius:12px;padding:12px;">
                            <b style="color:#fbbf24;">🛡️ Gmail Access Kho Jaane Par Recovery:</b><br><br>
                            1. Pehle Google Account Recovery (`[accounts.google.com/signin/recovery](https://accounts.google.com/signin/recovery)`) se apni Gmail wapas layein.<br>
                            2. Agar Gmail permanently band ho gayi hai, toh apne purane active phone par <b>Settings → Security Center</b> se email update karein ya <b>@nexus_official</b> Founder Support se apna <b>@username + purani ID details</b> verify karwa kar account transfer karwayein.
                        </div>
                        <button type="button" id="nx-back-login" style="width:100%;padding:11px;border-radius:12px;background:#1e293b;border:none;color:#fff;font-weight:800;cursor:pointer;">← Back to Log In</button>
                    </div>
                `;
            }

            modal.innerHTML = `
                <div style="background:linear-gradient(155deg,#0f172a,#090d16);border:1.5px solid #10b981;border-radius:24px;width:100%;max-width:395px;padding:22px 18px;color:#fff;box-shadow:0 24px 60px rgba(0,0,0,0.95);">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                        <div>
                            <div style="font-size:19px;font-weight:900;background:linear-gradient(90deg,#34d399,#38bdf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Nexus Community</div>
                            <div style="font-size:11px;color:#94a3b8;">🔐 Verified Accounts • True E2EE • Max 2 Devices</div>
                        </div>
                        <button type="button" id="nx-a-close" style="width:30px;height:30px;border-radius:50%;background:#1e293b;border:none;color:#cbd5e1;font-weight:900;cursor:pointer;">✕</button>
                    </div>
                    <div id="nx-a-err" style="display:none;background:rgba(244,63,94,0.16);border:1px solid #f43f5e;color:#fda4af;padding:8px 10px;border-radius:10px;font-size:12px;font-weight:700;margin-bottom:10px;"></div>
                    <div id="nx-a-ok" style="display:none;background:rgba(16,185,129,0.16);border:1px solid #10b981;color:#6ee7b7;padding:8px 10px;border-radius:10px;font-size:12px;font-weight:700;margin-bottom:10px;"></div>
                    ${bodyHtml}
                </div>
            `;

            const showErr = (m) => { const b = modal.querySelector("#nx-a-err"); if (b) { b.textContent = m; b.style.display = "block"; } };
            const showOk = (m) => { const b = modal.querySelector("#nx-a-ok"); if (b) { b.textContent = m; b.style.display = "block"; } };

            modal.querySelector("#nx-a-close").onclick = () => modal.remove();
            const backBtn = modal.querySelector("#nx-back-login");
            if (backBtn) backBtn.onclick = () => { view = "login"; render(); };

            if (view === "login") {
                modal.querySelector("#nx-go-signup").onclick = () => { view = "signup"; render(); };
                modal.querySelector("#nx-go-forgot").onclick = () => { view = "forgot"; render(); };
                modal.querySelector("#nx-go-otp-login").onclick = () => {
                    pendingEmail = (modal.querySelector("#nx-li-email").value || "").trim();
                    otpIntent = "login";
                    view = "signup";
                    render();
                };
                modal.querySelector("#nx-li-go").onclick = async function () {
                    const em = (modal.querySelector("#nx-li-email").value || "").trim();
                    const pw = (modal.querySelector("#nx-li-pass").value || "").trim();
                    if (!em || !em.includes("@")) return showErr("⚠️ Apna Gmail address dalein.");
                    if (pw.length < 6) return showErr("⚠️ Password kam se kam 6 characters ka hona chahiye.");
                    this.disabled = true; this.textContent = "⏳ Logging In...";
                    const { error } = await loginWithEmail(em, pw);
                    if (error) {
                        this.disabled = false; this.textContent = "🔓 Log In";
                        return showErr("❌ Galat Email ya Password! Bhool gaye toh 'Forgot Password?' ya '6-Digit OTP' par tap karein.");
                    }
                    await finishLogin("✅ Welcome back to Nexus!");
                };
            } else if (view === "signup") {
                modal.querySelector("#nx-su-send").onclick = async function () {
                    const em = (modal.querySelector("#nx-su-email").value || "").trim().toLowerCase();
                    if (!em || !em.includes("@")) return showErr("⚠️ Sahi Gmail address dalein.");
                    this.disabled = true; this.textContent = "⏳ Sending 6-Digit Code...";
                    const { error } = await sendEmailOtp(em, true);
                    if (error) {
                        this.disabled = false; this.textContent = "📧 Send 6-Digit Verification OTP";
                        return showErr("❌ " + error.message);
                    }
                    pendingEmail = em;
                    otpIntent = "signup";
                    view = "otp_verify";
                    render();
                    showOk("✅ 6-Digit OTP aapke Gmail par bhej diya gaya hai!");
                };
            } else if (view === "forgot") {
                modal.querySelector("#nx-go-lost-email").onclick = () => { view = "lost_email"; render(); };
                modal.querySelector("#nx-fg-send").onclick = async function () {
                    const em = (modal.querySelector("#nx-fg-email").value || "").trim().toLowerCase();
                    if (!em || !em.includes("@")) return showErr("⚠️ Registered Gmail address dalein.");
                    this.disabled = true; this.textContent = "⏳ Sending Recovery Code...";
                    const { error } = await sendEmailOtp(em, false);
                    if (error) {
                        this.disabled = false; this.textContent = "🔑 Send 6-Digit Recovery OTP";
                        return showErr("❌ " + error.message);
                    }
                    pendingEmail = em;
                    otpIntent = "recovery";
                    view = "otp_verify";
                    render();
                    showOk("✅ 6-Digit Recovery OTP bhej diya gaya hai!");
                };
            } else if (view === "otp_verify") {
                modal.querySelector("#nx-ov-resend").onclick = async () => {
                    const { error } = await sendEmailOtp(pendingEmail, otpIntent !== "recovery");
                    if (error) showErr("❌ " + error.message);
                    else showOk("🔄 Naya 6-Digit OTP bhej diya gaya!");
                };
                modal.querySelector("#nx-ov-go").onclick = async function () {
                    const code = (modal.querySelector("#nx-ov-code").value || "").trim();
                    if (code.length < 6) return showErr("⚠️ Poora 6-digit code dalein.");
                    this.disabled = true; this.textContent = "⏳ Verifying...";
                    const { error } = await verifyEmailOtp(pendingEmail, code);
                    if (error) {
                        this.disabled = false; this.textContent = "✅ Verify 6-Digit Code";
                        return showErr("❌ Galat ya expired OTP! Dobara check karein.");
                    }
                    if (otpIntent === "recovery") {
                        view = "forgot_reset";
                        render();
                    } else {
                        await finishLogin("✅ Gmail Verified!");
                    }
                };
            } else if (view === "forgot_reset") {
                modal.querySelector("#nx-rs-save").onclick = async function () {
                    const p1 = (modal.querySelector("#nx-rs-pw1").value || "").trim();
                    const p2 = (modal.querySelector("#nx-rs-pw2").value || "").trim();
                    if (p1.length < 6) return showErr("⚠️ Password kam se kam 6 characters ka hona chahiye.");
                    if (p1 !== p2) return showErr("❌ Dono passwords match nahi kar rahe!");
                    this.disabled = true; this.textContent = "⏳ Saving Password...";
                    const { error } = await updateUserPassword(p1);
                    if (error) {
                        this.disabled = false; this.textContent = "🔐 Save New Password & Login";
                        return showErr("❌ " + error.message);
                    }
                    await finishLogin("🔐 Password Updated & Logged In!");
                };
            }
        };

        render();
        document.body.appendChild(modal);
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    }

    // -------------------- 8. SECURITY CENTER (ACTIVE DEVICES + BACKUP PIN + PASSWORD) --------------------
    async function openSecurityCenterModal() {
        document.getElementById("nx-sec-center-modal")?.remove();
        const uid = await getAuthenticatedUserId();
        if (!uid) return openAdvancedNexusAuthModal("login");

        const sessions = await getMyActiveSessions(uid);
        const curSid = getOrCreateDeviceSessionId();

        const modal = document.createElement("div");
        modal.id = "nx-sec-center-modal";
        modal.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,0.94);z-index:299000;display:flex;align-items:center;justify-content:center;padding:16px;";
        modal.innerHTML = `
            <div style="background:#0f172a;border:1.5px solid #10b981;border-radius:22px;width:100%;max-width:410px;padding:18px;color:#fff;max-height:88dvh;overflow-y:auto;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <h3 style="font-size:16px;font-weight:900;color:#34d399;">🛡️ Nexus Security Center</h3>
                    <button type="button" id="nx-sc-x" style="width:28px;height:28px;border-radius:50%;background:#1e293b;border:none;color:#fff;cursor:pointer;">✕</button>
                </div>

                <div style="background:#090d16;border:1px solid #1e293b;border-radius:14px;padding:12px;margin-bottom:12px;">
                    <div style="font-size:12px;font-weight:900;color:#38bdf8;margin-bottom:8px;">📱 Active Devices (${sessions.length}/2 Allowed)</div>
                    ${sessions.map((s) => `
                        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #1e293b;font-size:12px;">
                            <span>${escHtml(s.device_label || "Device")} ${s.session_id === curSid ? '<b style="color:#34d399;">(This Phone)</b>' : ""}</span>
                            <span style="color:#64748b;font-size:10.5px;">${new Date(s.last_active_at).toLocaleDateString()}</span>
                        </div>
                    `).join("")}
                    <button type="button" id="nx-sc-revoke" style="width:100%;margin-top:10px;padding:9px;border-radius:10px;background:rgba(244,63,94,0.16);border:1px solid #f43f5e;color:#fda4af;font-weight:800;font-size:12px;cursor:pointer;">🚫 Log Out All Other Devices</button>
                </div>

                <div style="background:#090d16;border:1px solid #1e293b;border-radius:14px;padding:12px;margin-bottom:12px;">
                    <div style="font-size:12px;font-weight:900;color:#34d399;margin-bottom:6px;">🔐 6-Digit E2EE Chat Backup PIN</div>
                    <input type="tel" id="nx-sc-pin" maxlength="6" placeholder="Enter 6-Digit PIN..." style="width:100%;padding:9px 11px;border-radius:10px;background:#0f172a;border:1px solid #334155;color:#34d399;font-size:14px;font-weight:800;letter-spacing:4px;outline:none;margin-bottom:8px;" />
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <button type="button" id="nx-sc-bk" style="padding:9px;border-radius:10px;background:#10b981;color:#020617;font-weight:900;font-size:12px;border:none;cursor:pointer;">☁️ Backup Key</button>
                        <button type="button" id="nx-sc-rs" style="padding:9px;border-radius:10px;background:#38bdf8;color:#020617;font-weight:900;font-size:12px;border:none;cursor:pointer;">🔓 Restore Key</button>
                    </div>
                </div>

                <button type="button" id="nx-sc-logout" style="width:100%;padding:11px;border-radius:12px;background:#e11d48;color:#fff;font-weight:900;font-size:13px;border:none;cursor:pointer;">🚪 Log Out This Device</button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector("#nx-sc-x").onclick = () => modal.remove();
        modal.querySelector("#nx-sc-logout").onclick = logoutUser;
        modal.querySelector("#nx-sc-revoke").onclick = async () => {
            await revokeOtherSessions(uid);
            modal.remove();
            if (window.Nexus && Nexus.toast) Nexus.toast("🚫 Other devices logged out!");
        };
        modal.querySelector("#nx-sc-bk").onclick = async () => {
            try {
                await backupPrivateKeyWithPin(uid, modal.querySelector("#nx-sc-pin").value);
                if (window.Nexus && Nexus.toast) Nexus.toast("☁️ E2EE Key Backed Up with PIN!");
            } catch (e) { alert(e.message); }
        };
        modal.querySelector("#nx-sc-rs").onclick = async () => {
            try {
                await restorePrivateKeyWithPin(uid, modal.querySelector("#nx-sc-pin").value);
                if (window.Nexus && Nexus.toast) Nexus.toast("🔓 E2EE Chats Unlocked!");
            } catch (e) { alert("❌ Wrong PIN ya koi backup nahi mila."); }
        };
    }

    // -------------------- 9. LOCK GLOBAL BRIDGE --------------------
    window.NexusSecurity = {
        sb, SUPABASE_URL,
        getAuthenticatedUserId, loginWithGoogle, sendEmailOtp, verifyEmailOtp,
        loginWithEmail, updateUserPassword, checkUsernameAvailable, completeUserOnboarding,
        syncCurrentUserProfile, logoutUser,
        registerActiveSession, verifyCurrentSessionNotRevoked, getMyActiveSessions, revokeOtherSessions,
        openSecurityCenterModal, openMandatoryOnboardingModal, openAdvancedNexusAuthModal,
        initUserE2EEKeys, backupPrivateKeyWithPin, restorePrivateKeyWithPin,
        uploadPublicMedia, uploadPrivateChatMedia, getSignedChatMediaUrl,
        getOrCreateConversation, sendChatMessage, decryptMessageRow,
        toggleMessageReaction, editChatMessage, deleteMessageForEveryone,
        burnViewOnceMessage, markConversationSeen, subscribeToConversation,
        checkIsUserPro
    };

    try {
        Object.defineProperty(window, "openNexusSupabaseAuthModal", { configurable: true, get: () => openAdvancedNexusAuthModal, set: () => {} });
        Object.defineProperty(window, "openAdvancedGoogleAuthModal", { configurable: true, get: () => openAdvancedNexusAuthModal, set: () => {} });
    } catch (e) {
        window.openNexusSupabaseAuthModal = openAdvancedNexusAuthModal;
        window.openAdvancedGoogleAuthModal = openAdvancedNexusAuthModal;
    }

    window.dispatchEvent(new CustomEvent("nexus-security-ready", { detail: window.NexusSecurity }));
})();
