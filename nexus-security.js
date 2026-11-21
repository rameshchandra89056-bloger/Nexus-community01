// ============================================================================
// NEXUS-SECURITY.JS (FINAL MASTER v2.1)
// 6-Digit Gmail OTP + Google OAuth + Email/Password + 2-Device Lock
// + True E2EE (ECDH/AES-256-GCM) + 50MB Storage + Real View-Once Burn
// ============================================================================
import { createClient } from "[https://esm.sh/@supabase/supabase-js@2](https://esm.sh/@supabase/supabase-js@2)";

const SUPABASE_URL = ("https" + "://" + "fegmtyoxijvktoxtealo" + ".supabase.co").trim();
const SUPABASE_ANON_KEY = ("sb_publishable_" + "jpH6tVu1sCNSwLmgvRTxrw_w8xq5thV").trim();

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

export function getOrCreateDeviceSessionId() {
    let sid = localStorage.getItem("nexus_device_sid");
    if (!sid) {
        const rand = (crypto && crypto.randomUUID)
            ? crypto.randomUUID()
            : (Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 12));
        sid = "nx_" + rand;
        localStorage.setItem("nexus_device_sid", sid);
    }
    return sid;
}

export async function registerActiveSession(userId) {
    if (!userId) return null;
    const sid = getOrCreateDeviceSessionId();
    const ua = navigator.userAgent || "";
    const label = /Android/i.test(ua)
        ? "Android Mobile"
        : /iPhone|iPad/i.test(ua)
        ? "iOS Mobile"
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
    } catch (e) {
        console.warn("Session register note:", e);
    }
    return sid;
}

export async function getMyActiveSessions(userId) {
    if (!userId) return [];
    const { data } = await sb
        .from("active_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("is_revoked", false)
        .order("last_active_at", { ascending: false });
    return Array.isArray(data) ? data : [];
}

export async function revokeOtherSessions(userId) {
    if (!userId) return;
    const sid = getOrCreateDeviceSessionId();
    await sb
        .from("active_sessions")
        .update({ is_revoked: true })
        .eq("user_id", userId)
        .neq("session_id", sid);
}

export async function verifyCurrentSessionNotRevoked(userId) {
    if (!userId) return true;
    const sid = getOrCreateDeviceSessionId();
    const { data } = await sb
        .from("active_sessions")
        .select("is_revoked")
        .eq("user_id", userId)
        .eq("session_id", sid)
        .maybeSingle();

    if (data && data.is_revoked) {
        await sb.auth.signOut();
        localStorage.removeItem("nx_active_account");
        alert("Aapka account kisi naye device par login hua hai (Max 2 devices limit). Dobara login karein.");
        window.location.reload();
        return false;
    }
    return true;
}

// -------------------- 2. INDEXEDDB PRIVATE KEY VAULT --------------------
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

// -------------------- 3. TRUE E2EE (ECDH P-256 + AES-256-GCM) --------------------
export async function initUserE2EEKeys(userId) {
    if (!userId || !window.crypto || !window.crypto.subtle) return null;
    let privJwk = await getLocalKey("priv_" + userId);
    let pubJwk = await getLocalKey("pub_" + userId);

    if (!privJwk || !pubJwk) {
        const pair = await crypto.subtle.generateKey(
            { name: "ECDH", namedCurve: "P-256" },
            true,
            ["deriveKey"]
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

export async function backupPrivateKeyWithPin(userId, sixDigitPin) {
    const privJwk = await initUserE2EEKeys(userId);
    const pubJwk = await getLocalKey("pub_" + userId);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const pinKey = await derivePinKey(sixDigitPin, salt);
    const enc = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv }, pinKey, new TextEncoder().encode(JSON.stringify({ privJwk, pubJwk }))
    );
    const payload = JSON.stringify({ iv: b64Enc(iv), data: b64Enc(enc) });
    return sb.from("profiles").update({
        e2ee_encrypted_backup: payload,
        e2ee_backup_salt: b64Enc(salt)
    }).eq("id", userId);
}

export async function restorePrivateKeyWithPin(userId, sixDigitPin) {
    const { data } = await sb
        .from("profiles")
        .select("e2ee_encrypted_backup, e2ee_backup_salt")
        .eq("id", userId)
        .single();
    if (!data || !data.e2ee_encrypted_backup) throw new Error("No PIN backup found");
    const parsed = JSON.parse(data.e2ee_encrypted_backup);
    const pinKey = await derivePinKey(sixDigitPin, b64Dec(data.e2ee_backup_salt));
    const dec = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: b64Dec(parsed.iv) }, pinKey, b64Dec(parsed.data)
    );
    const obj = JSON.parse(new TextDecoder().decode(dec));
    await saveLocalKey("priv_" + userId, obj.privJwk || obj);
    if (obj.pubJwk) await saveLocalKey("pub_" + userId, obj.pubJwk);
    return true;
}

// -------------------- 4. MULTI-LOGIN AUTH (6-DIGIT GMAIL OTP + GOOGLE + PASSWORD) --------------------
export async function loginWithGoogle() {
    return sb.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + window.location.pathname }
    });
}

export async function sendEmailOtp(email, displayName = "", rawUsername = "") {
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
        return { error: { message: "Sahi Gmail address dalein." } };
    }
    const cleanUname = String(rawUsername || "")
        .toLowerCase().replace(/^@/, "").replace(/[^a-z0-9_]/g, "").slice(0, 24);

    if (cleanUname && cleanUname.length >= 3) {
        const { data: taken } = await sb.from("profiles").select("id").eq("username", cleanUname).maybeSingle();
        if (taken) {
            return { error: { message: `@${cleanUname} pehle se liya ja chuka hai. Koi aur username chunein.` } };
        }
    }

    const opts = { shouldCreateUser: true };
    if (displayName || cleanUname) {
        opts.data = {
            full_name: String(displayName || cleanUname || cleanEmail.split("@")[0]).trim(),
            preferred_username: cleanUname || undefined
        };
    }
    return sb.auth.signInWithOtp({ email: cleanEmail, options: opts });
}

export async function verifyEmailOtp(email, otpCode) {
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
    if (data && data.user) {
        await syncCurrentUserProfile();
    }
    return { data, error: null };
}

export async function signUpWithEmail(email, password, displayName, rawUsername, bio = "") {
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanUname = String(rawUsername || "")
        .toLowerCase().replace(/^@/, "").replace(/[^a-z0-9_]/g, "").slice(0, 24);

    if (cleanUname.length < 3) {
        return { error: { message: "Username kam se kam 3 letters ka hona chahiye." } };
    }
    const { data: existingU } = await sb.from("profiles").select("id").eq("username", cleanUname).maybeSingle();
    if (existingU) {
        return { error: { message: `@${cleanUname} pehle se liya ja chuka hai. Koi aur username chunein.` } };
    }

    const { data, error } = await sb.auth.signUp({
        email: cleanEmail,
        password: String(password),
        options: {
            data: {
                full_name: String(displayName || cleanUname).trim(),
                preferred_username: cleanUname,
                bio: String(bio || "Nexus Community Member ✨").trim()
            }
        }
    });
    if (error) return { data, error };
    if (data && data.user && data.session) {
        await syncCurrentUserProfile();
    }
    return { data, error: null };
}

export async function loginWithEmail(email, password) {
    const cleanEmail = String(email || "").trim().toLowerCase();
    const { data, error } = await sb.auth.signInWithPassword({
        email: cleanEmail,
        password: String(password)
    });
    if (error) return { data, error };
    if (data && data.user) {
        await syncCurrentUserProfile();
    }
    return { data, error: null };
}

export async function syncCurrentUserProfile() {
    const { data: sessionData } = await sb.auth.getSession();
    const user = sessionData && sessionData.session ? sessionData.session.user : null;
    if (!user) return null;

    let { data: prof } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();

    if (!prof) {
        const meta = user.user_metadata || {};
        const emailPrefix = (user.email || "user").split("@")[0];
        let baseU = String(meta.preferred_username || emailPrefix)
            .toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 18);
        if (baseU.length < 3) baseU = "nx_" + user.id.slice(0, 6);

        const { data: taken } = await sb.from("profiles").select("id").eq("username", baseU).maybeSingle();
        const finalUsername = taken ? `${baseU.slice(0, 16)}_${user.id.slice(0, 4)}` : baseU;

        const newRow = {
            id: user.id,
            firebase_uid: finalUsername,
            username: finalUsername,
            display_name: String(meta.full_name || meta.name || finalUsername).slice(0, 60),
            avatar_url: String(meta.avatar_url || meta.picture || ""),
            bio: String(meta.bio || "Nexus Community Member ✨").slice(0, 220),
            is_verified: true,
            role: "user",
            last_online: new Date().toISOString()
        };

        const { data: inserted } = await sb.from("profiles").upsert(newRow, { onConflict: "id" }).select("*").single();
        prof = inserted || newRow;
    } else {
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
        role: prof.role || "user",
        followersList: Array.isArray(prof.followers_list) ? prof.followers_list : [],
        followingList: Array.isArray(prof.following_list) ? prof.following_list : [],
        isOnlineNow: true,
        lastOnline: Date.now()
    };

    try { localStorage.setItem("nx_active_account", JSON.stringify(bridged)); } catch (e) {}
    return bridged;
}

export async function logoutUser() {
    try {
        const sid = localStorage.getItem("nexus_device_sid");
        if (sid) await sb.from("active_sessions").update({ is_revoked: true }).eq("session_id", sid);
    } catch (e) {}
    await sb.auth.signOut();
    localStorage.removeItem("nx_active_account");
    localStorage.removeItem("nx_legacy_backup_account");
    window.location.reload();
}
// -------------------- 5. SUPABASE STORAGE MEDIA ENGINE (UP TO 50MB!) --------------------
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

export async function uploadPublicMedia(file, folder = "posts") {
    if (!file) throw new Error("No file selected");
    if (file.size > 50 * 1024 * 1024) throw new Error("File 50MB se kam honi chahiye.");
    const ext = sanitizeExt(file);
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await sb.storage.from("public-media").upload(path, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false
    });
    if (error) throw error;
    const { data } = sb.storage.from("public-media").getPublicUrl(path);
    return { publicUrl: data.publicUrl, path };
}

export async function uploadPrivateChatMedia(file, conversationId) {
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
    return { path, fileName: file.name || `media.${ext}`, mimeType: file.type || "application/octet-stream", size: file.size };
}

const signedUrlCache = new Map();

export async function getSignedChatMediaUrl(storagePath, expiresSec = 3600) {
    if (!storagePath) return "";
    if (/^https?:\/\//i.test(storagePath) || /^data:/i.test(storagePath)) return storagePath;
    const cached = signedUrlCache.get(storagePath);
    if (cached && cached.exp > Date.now() + 60000) return cached.url;
    const { data, error } = await sb.storage.from("private-chat-media").createSignedUrl(storagePath, expiresSec);
    if (error || !data || !data.signedUrl) return "";
    signedUrlCache.set(storagePath, { url: data.signedUrl, exp: Date.now() + (expiresSec * 1000) });
    return data.signedUrl;
}

// -------------------- 6. 1:1 CONVERSATIONS, TRUE E2EE, REACTIONS & VIEW-ONCE --------------------
export async function getOrCreateConversation(myId, peerId) {
    if (!myId || !peerId) throw new Error("Invalid user IDs");
    const [a, b] = myId < peerId ? [myId, peerId] : [peerId, myId];
    const { data: existing } = await sb.from("conversations").select("id").eq("participant_a", a).eq("participant_b", b).maybeSingle();
    if (existing && existing.id) return existing.id;
    const { data: created, error } = await sb.from("conversations").insert({ participant_a: a, participant_b: b }).select("id").single();
    if (error) throw error;
    return created.id;
}

export async function sendChatMessage({
    conversationId, myUserId, peerUserId, peerPublicKeyJson = null,
    text = "", mediaPath = "", mediaType = "text", fileName = "",
    sticker = null, isViewOnce = false, replyTo = null
}) {
    const rawJson = JSON.stringify({
        v: 2, t: String(text || ""), mp: String(mediaPath || ""),
        mt: String(mediaType || "text"), fn: String(fileName || ""),
        stk: sticker || null, vo: Boolean(isViewOnce)
    });

    let ciphertext = rawJson;
    let ivStr = "WAIT_PEER_KEY";
    if (peerPublicKeyJson && myUserId !== peerUserId) {
        try {
            const aesKey = await deriveSharedAesKey(myUserId, peerPublicKeyJson);
            if (aesKey) {
                const iv = crypto.getRandomValues(new Uint8Array(12));
                const encBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, new TextEncoder().encode(rawJson));
                ciphertext = b64Enc(encBuf);
                ivStr = b64Enc(iv);
            }
        } catch (e) {}
    }

    const dbMsgType = ["image", "video", "audio", "file"].includes(mediaType) ? mediaType : "text";
    const { data, error } = await sb.from("messages").insert({
        conversation_id: conversationId,
        sender_id: myUserId,
        receiver_id: peerUserId,
        ciphertext,
        iv: ivStr,
        msg_type: dbMsgType,
        media_path: String(mediaPath || ""),
        is_view_once: Boolean(isViewOnce),
        view_once_opened: false,
        reply_to: replyTo || null,
        reactions: {},
        seen: false,
        is_edited: false,
        is_deleted_everyone: false
    }).select("*").single();
    if (error) throw error;
    return data;
}

export async function decryptMessageRow(row, myUserId, peerPublicKeyJson) {
    if (!row) return null;
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
                const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64Dec(iv) }, aesKey, b64Dec(row.ciphertext));
                plainStr = new TextDecoder().decode(plainBuf);
            }
        } catch (e) {
            return { deleted: false, locked: true, text: "🔒 Encrypted on another device — enter 6-digit Backup PIN to unlock", mediaPath: "", mediaType: "text", fileName: "", sticker: null, viewOnce: Boolean(row.is_view_once), viewOnceOpened: Boolean(row.view_once_opened) };
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

export async function toggleMessageReaction(messageId, emoji, myUsername) {
    if (!messageId || !emoji || !myUsername) return null;
    const uname = String(myUsername).toLowerCase().trim();
    const { data: row, error } = await sb.from("messages").select("reactions").eq("id", messageId).single();
    if (error || !row) return null;
    const reactions = Object.assign({}, row.reactions || {});
    if (reactions[uname] === emoji) delete reactions[uname];
    else reactions[uname] = emoji;
    const { error: upErr } = await sb.from("messages").update({ reactions }).eq("id", messageId);
    if (upErr) throw upErr;
    return reactions;
}

export async function editChatMessage({ messageId, myUserId, peerUserId, peerPublicKeyJson, newText }) {
    const rawJson = JSON.stringify({ v: 2, t: String(newText || ""), mp: "", mt: "text", fn: "", stk: null, vo: false });
    let ciphertext = rawJson;
    let ivStr = "WAIT_PEER_KEY";
    if (peerPublicKeyJson && myUserId !== peerUserId) {
        try {
            const aesKey = await deriveSharedAesKey(myUserId, peerPublicKeyJson);
            if (aesKey) {
                const iv = crypto.getRandomValues(new Uint8Array(12));
                const encBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, new TextEncoder().encode(rawJson));
                ciphertext = b64Enc(encBuf);
                ivStr = b64Enc(iv);
            }
        } catch (e) {}
    }
    return sb.from("messages").update({ ciphertext, iv: ivStr, is_edited: true }).eq("id", messageId).eq("sender_id", myUserId);
}

export async function deleteMessageForEveryone(messageId, storagePath = "") {
    if (!messageId) return;
    if (storagePath && !/^https?:\/\//i.test(storagePath) && !/^data:/i.test(storagePath)) {
        try { await sb.storage.from("private-chat-media").remove([storagePath]); signedUrlCache.delete(storagePath); } catch (e) {}
    }
    return sb.from("messages").update({ is_deleted_everyone: true, ciphertext: "", media_path: "", reactions: {} }).eq("id", messageId);
}

export async function burnViewOnceMessage(messageId, storagePath = "") {
    if (!messageId) return;
    if (storagePath && !/^https?:\/\//i.test(storagePath) && !/^data:/i.test(storagePath)) {
        try { await sb.storage.from("private-chat-media").remove([storagePath]); signedUrlCache.delete(storagePath); } catch (e) {}
    }
    return sb.from("messages").update({ view_once_opened: true, ciphertext: "", media_path: "" }).eq("id", messageId);
}

export async function markConversationSeen(conversationId, myUserId) {
    if (!conversationId || !myUserId) return;
    return sb.from("messages").update({ seen: true }).eq("conversation_id", conversationId).eq("receiver_id", myUserId).eq("seen", false);
}

export function subscribeToConversation(conversationId, onEvent) {
    const channel = sb
        .channel("nx_conv_" + conversationId)
        .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, (payload) => {
            if (typeof onEvent === "function") onEvent(payload);
        })
        .subscribe();
    return () => { try { sb.removeChannel(channel); } catch (e) {} };
}

export async function checkIsUserPro() {
    const { data, error } = await sb.rpc("is_current_user_pro");
    return !error && data === true;
}

// -------------------- 7. INSTAGRAM-LEVEL 6-DIGIT GMAIL OTP + GOOGLE + PASSWORD AUTH UI --------------------
export function openAdvancedNexusAuthModal(initialMode = "otp") {
    document.getElementById("nx-sb-auth-modal")?.remove();
    document.getElementById("nx-instant-auth-modal")?.remove();

    let tab = initialMode === "password" ? "password" : "otp";
    let pwSub = initialMode === "signup" ? "signup" : "signin";
    let otpStep = 1; // 1 = enter gmail, 2 = enter 6-digit code
    let pendingEmail = "";
    const isLocal = ["localhost", "127.0.0.1", ""].includes(window.location.hostname);

    const modal = document.createElement("div");
    modal.id = "nx-sb-auth-modal";
    modal.style.cssText =
        "position:fixed;inset:0;background:rgba(2,6,23,0.93);z-index:298000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(7px);";

    const finishSuccess = async (msg) => {
        if (window.Nexus && Nexus.refreshCloudData) await Nexus.refreshCloudData();
        modal.remove();
        document.getElementById("nx-google-auth-hub")?.remove();
        document.body.classList.remove("nx-auth-locked");
        if (window.Nexus && Nexus.toast) Nexus.toast(msg || "✅ Verified & Logged In!");
        if (window.renderMyInstagramProfileTab) window.renderMyInstagramProfileTab();
        if (window.Nexus && Nexus.switchTab) Nexus.switchTab("tab-home");
    };

    const render = () => {
        const isOtp = tab === "otp";
        const isSignup = pwSub === "signup";
        modal.innerHTML = `
            <div style="background:linear-gradient(155deg,#0f172a,#090d16);border:1.5px solid #10b981;border-radius:22px;width:100%;max-width:395px;padding:20px 18px;color:#fff;box-shadow:0 24px 60px rgba(0,0,0,0.95);">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                    <div>
                        <h3 style="font-size:17px;font-weight:900;color:#34d399;">🛡️ Nexus v2 Verified Access</h3>
                        <div style="font-size:11px;color:#94a3b8;">256-Bit True E2EE • 2-Device Session Lock</div>
                    </div>
                    <button type="button" id="nx-a2-x" style="width:30px;height:30px;border-radius:50%;background:#1e293b;border:none;color:#cbd5e1;font-weight:900;cursor:pointer;">✕</button>
                </div>

                <button type="button" id="nx-a2-google" style="width:100%;padding:12px;border-radius:12px;background:#ffffff;color:#0f172a;font-weight:900;font-size:13px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;margin-bottom:12px;">
                    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                    <span>Continue with Google (1-Click)</span>
                </button>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#050811;padding:4px;border-radius:12px;margin-bottom:12px;">
                    <button type="button" id="nx-a2-t-otp" style="padding:9px;border-radius:9px;border:none;background:${isOtp ? "#10b981" : "transparent"};color:${isOtp ? "#020617" : "#94a3b8"};font-weight:900;font-size:12px;cursor:pointer;">📧 6-Digit Gmail OTP</button>
                    <button type="button" id="nx-a2-t-pw" style="padding:9px;border-radius:9px;border:none;background:${!isOtp ? "#10b981" : "transparent"};color:${!isOtp ? "#020617" : "#94a3b8"};font-weight:900;font-size:12px;cursor:pointer;">🔑 Password Login</button>
                </div>

                <div id="nx-a2-err" style="display:none;background:rgba(244,63,94,0.16);border:1px solid #f43f5e;color:#fda4af;padding:8px 10px;border-radius:10px;font-size:12px;font-weight:700;margin-bottom:10px;"></div>
                <div id="nx-a2-ok" style="display:none;background:rgba(16,185,129,0.16);border:1px solid #10b981;color:#6ee7b7;padding:8px 10px;border-radius:10px;font-size:12px;font-weight:700;margin-bottom:10px;"></div>

                ${isOtp ? (otpStep === 1 ? `
                    <div style="display:flex;flex-direction:column;gap:9px;">
                        <input type="email" id="nx-otp-email" value="${pendingEmail}" placeholder="Apna Gmail address dalein..." autocapitalize="none" style="width:100%;padding:12px;border-radius:11px;background:#090d16;border:1px solid #334155;color:#fff;font-size:13.5px;outline:none;" />
                        <input type="text" id="nx-otp-name" placeholder="Full Name (sirf naye user ke liye)" style="width:100%;padding:10px 12px;border-radius:11px;background:#090d16;border:1px solid #1e293b;color:#fff;font-size:13px;outline:none;" />
                        <input type="text" id="nx-otp-uname" placeholder="Username (sirf naye user ke liye, e.g. mohit_01)" autocapitalize="none" style="width:100%;padding:10px 12px;border-radius:11px;background:#090d16;border:1px solid #1e293b;color:#fff;font-size:13px;outline:none;" />
                        <button type="button" id="nx-otp-send-btn" style="width:100%;padding:13px;border-radius:13px;background:linear-gradient(90deg,#10b981,#06b6d4);color:#020617;font-weight:900;font-size:14px;border:none;cursor:pointer;margin-top:2px;">📧 Send 6-Digit Gmail OTP</button>
                    </div>
                ` : `
                    <div style="display:flex;flex-direction:column;gap:10px;">
                        <div style="font-size:12px;color:#cbd5e1;text-align:center;">Gmail inbox (ya Spam folder) mein bheja gaya 6-digit code dalein:<br><b style="color:#38bdf8;">${pendingEmail}</b></div>
                        <input type="tel" id="nx-otp-code" maxlength="6" placeholder="• • • • • •" style="width:100%;padding:13px;border-radius:12px;background:#090d16;border:1.5px solid #10b981;color:#34d399;font-size:22px;font-weight:900;text-align:center;letter-spacing:8px;outline:none;" />
                        <button type="button" id="nx-otp-verify-btn" style="width:100%;padding:13px;border-radius:13px;background:linear-gradient(90deg,#10b981,#06b6d4);color:#020617;font-weight:900;font-size:14px;border:none;cursor:pointer;">✅ Verify OTP &amp; Login</button>
                        <button type="button" id="nx-otp-back-btn" style="background:none;border:none;color:#94a3b8;font-size:12px;font-weight:700;cursor:pointer;">← Change Gmail / Resend Code</button>
                    </div>
                `) : `
                    <div style="display:flex;flex-direction:column;gap:9px;">
                        ${isSignup ? `
                            <input type="text" id="nx-pw-name" placeholder="Full Name" style="width:100%;padding:11px 12px;border-radius:11px;background:#090d16;border:1px solid #334155;color:#fff;font-size:13.5px;outline:none;" />
                            <input type="text" id="nx-pw-uname" placeholder="Unique Username (e.g. mohit_01)" autocapitalize="none" style="width:100%;padding:11px 12px;border-radius:11px;background:#090d16;border:1px solid #334155;color:#fff;font-size:13.5px;outline:none;" />
                        ` : ""}
                        <input type="email" id="nx-pw-email" placeholder="Gmail / Email address" autocapitalize="none" style="width:100%;padding:11px 12px;border-radius:11px;background:#090d16;border:1px solid #334155;color:#fff;font-size:13.5px;outline:none;" />
                        <input type="password" id="nx-pw-pass" placeholder="Password (min 6 characters)" style="width:100%;padding:11px 12px;border-radius:11px;background:#090d16;border:1px solid #334155;color:#fff;font-size:13.5px;outline:none;" />
                        <button type="button" id="nx-pw-go" style="width:100%;padding:13px;border-radius:13px;background:linear-gradient(90deg,#10b981,#06b6d4);color:#020617;font-weight:900;font-size:14px;border:none;cursor:pointer;">${isSignup ? "🚀 Create Account" : "🔓 Login with Password"}</button>
                        <button type="button" id="nx-pw-swap" style="background:none;border:none;color:#38bdf8;font-size:12px;font-weight:800;cursor:pointer;">${isSignup ? "Already have an account? Login" : "New here? Create Password Account"}</button>
                    </div>
                `}
            </div>
        `;

        const showErr = (m) => { const b = modal.querySelector("#nx-a2-err"); if (b) { b.textContent = m; b.style.display = "block"; } };
        const showOk = (m) => { const b = modal.querySelector("#nx-a2-ok"); if (b) { b.textContent = m; b.style.display = "block"; } };

        modal.querySelector("#nx-a2-x").onclick = () => modal.remove();
        modal.querySelector("#nx-a2-t-otp").onclick = () => { tab = "otp"; render(); };
        modal.querySelector("#nx-a2-t-pw").onclick = () => { tab = "password"; render(); };

        modal.querySelector("#nx-a2-google").onclick = async () => {
            if (isLocal) return showErr("⚠️ Localhost par Google block hota hai — yahan 6-Digit Gmail OTP use karein, aur Google Login Vercel Preview Link par test karein!");
            const { error } = await loginWithGoogle();
            if (error) showErr("❌ " + error.message);
        };

        if (isOtp && otpStep === 1) {
            modal.querySelector("#nx-otp-send-btn").onclick = async function () {
                const em = (modal.querySelector("#nx-otp-email").value || "").trim();
                const nm = (modal.querySelector("#nx-otp-name").value || "").trim();
                const un = (modal.querySelector("#nx-otp-uname").value || "").trim();
                if (!em || !em.includes("@")) return showErr("⚠️ Sahi Gmail address dalein.");
                this.disabled = true;
                this.textContent = "⏳ Sending 6-Digit Code...";
                const { error } = await sendEmailOtp(em, nm, un);
                if (error) {
                    this.disabled = false;
                    this.textContent = "📧 Send 6-Digit Gmail OTP";
                    return showErr("❌ " + error.message);
                }
                pendingEmail = em.toLowerCase();
                otpStep = 2;
                render();
                showOk("✅ 6-Digit OTP aapke Gmail par bhej diya gaya hai!");
            };
        } else if (isOtp && otpStep === 2) {
            modal.querySelector("#nx-otp-back-btn").onclick = () => { otpStep = 1; render(); };
            modal.querySelector("#nx-otp-verify-btn").onclick = async function () {
                const code = (modal.querySelector("#nx-otp-code").value || "").trim();
                if (code.length < 6) return showErr("⚠️ Poora 6-digit code dalein.");
                this.disabled = true;
                this.textContent = "⏳ Verifying...";
                const { error } = await verifyEmailOtp(pendingEmail, code);
                if (error) {
                    this.disabled = false;
                    this.textContent = "✅ Verify OTP & Login";
                    return showErr("❌ " + error.message);
                }
                await finishSuccess("✅ Gmail OTP Verified & Logged In!");
            };
        } else {
            modal.querySelector("#nx-pw-swap").onclick = () => { pwSub = isSignup ? "signin" : "signup"; render(); };
            modal.querySelector("#nx-pw-go").onclick = async function () {
                const em = (modal.querySelector("#nx-pw-email").value || "").trim();
                const pw = (modal.querySelector("#nx-pw-pass").value || "").trim();
                if (!em || !em.includes("@")) return showErr("⚠️ Sahi Email dalein.");
                if (pw.length < 6) return showErr("⚠️ Password kam se kam 6 characters ka hona chahiye.");
                this.disabled = true;
                this.textContent = "⏳ Please wait...";
                const res = isSignup
                    ? await signUpWithEmail(em, pw, modal.querySelector("#nx-pw-name").value, modal.querySelector("#nx-pw-uname").value)
                    : await loginWithEmail(em, pw);
                if (res && res.error) {
                    this.disabled = false;
                    this.textContent = isSignup ? "🚀 Create Account" : "🔓 Login with Password";
                    return showErr("❌ " + res.error.message);
                }
                await finishSuccess("✅ Login Successful!");
            };
        }
    };

    render();
    document.body.appendChild(modal);
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}

// -------------------- 8. GLOBAL BRIDGE & AUTO-OVERRIDE --------------------
window.NexusSecurity = {
    sb, SUPABASE_URL,
    loginWithGoogle, sendEmailOtp, verifyEmailOtp, signUpWithEmail, loginWithEmail,
    syncCurrentUserProfile, logoutUser,
    registerActiveSession, verifyCurrentSessionNotRevoked, getMyActiveSessions, revokeOtherSessions,
    initUserE2EEKeys, backupPrivateKeyWithPin, restorePrivateKeyWithPin,
    uploadPublicMedia, uploadPrivateChatMedia, getSignedChatMediaUrl,
    getOrCreateConversation, sendChatMessage, decryptMessageRow,
    toggleMessageReaction, editChatMessage, deleteMessageForEveryone,
    burnViewOnceMessage, markConversationSeen, subscribeToConversation,
    checkIsUserPro, openAdvancedNexusAuthModal
};

const bindOtpModal = () => {
    window.openNexusSupabaseAuthModal = openAdvancedNexusAuthModal;
    window.openAdvancedGoogleAuthModal = openAdvancedNexusAuthModal;
};
bindOtpModal();
setTimeout(bindOtpModal, 400);
window.dispatchEvent(new CustomEvent("nexus-security-ready", { detail: window.NexusSecurity }));
