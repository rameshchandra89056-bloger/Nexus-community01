// ============================================================================
// NEXUS-SECURITY.JS (FINAL MASTER v2.0)
// Supabase Auth (Google + Email) + 2-Device Session Lock + True E2EE (ECDH/AES-GCM)
// + 50MB Private/Public Storage Media + Real View-Once Burn + Exact Reactions
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

// -------------------- 1. SAFE ENCODING & DEVICE SESSION ID --------------------
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

        // Keep max 2 active devices (revoke oldest if > 2)
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
        req.onerror = () => rej(tx.error);
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
        await sb
            .from("profiles")
            .update({ e2ee_public_key: JSON.stringify(pubJwk) })
            .eq("id", userId);
    } else {
        // Ensure public key is published in profiles
        const { data: prof } = await sb
            .from("profiles")
            .select("e2ee_public_key")
            .eq("id", userId)
            .maybeSingle();
        if (!prof || !prof.e2ee_public_key) {
            await sb
                .from("profiles")
                .update({ e2ee_public_key: JSON.stringify(pubJwk) })
                .eq("id", userId);
        }
    }
    return privJwk;
}

async function deriveSharedAesKey(myUserId, peerPublicKeyJson) {
    const myPrivJwk = await initUserE2EEKeys(myUserId);
    if (!myPrivJwk || !peerPublicKeyJson) return null;
    const privKey = await crypto.subtle.importKey(
        "jwk",
        myPrivJwk,
        { name: "ECDH", namedCurve: "P-256" },
        false,
        ["deriveKey"]
    );
    const pubKey = await crypto.subtle.importKey(
        "jwk",
        JSON.parse(peerPublicKeyJson),
        { name: "ECDH", namedCurve: "P-256" },
        false,
        []
    );
    return crypto.subtle.deriveKey(
        { name: "ECDH", public: pubKey },
        privKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

// 6-Digit PIN Cloud Key Backup & Restore
async function derivePinKey(pin, saltBytes) {
    const base = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(String(pin)),
        "PBKDF2",
        false,
        ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: saltBytes, iterations: 120000, hash: "SHA-256" },
        base,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

export async function backupPrivateKeyWithPin(userId, sixDigitPin) {
    const privJwk = await initUserE2EEKeys(userId);
    const pubJwk = await getLocalKey("pub_" + userId);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const pinKey = await derivePinKey(sixDigitPin, salt);
    const enc = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        pinKey,
        new TextEncoder().encode(JSON.stringify({ privJwk, pubJwk }))
    );
    const payload = JSON.stringify({ iv: b64Enc(iv), data: b64Enc(enc) });
    return sb
        .from("profiles")
        .update({
            e2ee_encrypted_backup: payload,
            e2ee_backup_salt: b64Enc(salt)
        })
        .eq("id", userId);
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
        { name: "AES-GCM", iv: b64Dec(parsed.iv) },
        pinKey,
        b64Dec(parsed.data)
    );
    const obj = JSON.parse(new TextDecoder().decode(dec));
    const privJwk = obj.privJwk || obj;
    await saveLocalKey("priv_" + userId, privJwk);
    if (obj.pubJwk) await saveLocalKey("pub_" + userId, obj.pubJwk);
    return true;
}

// -------------------- 4. AUTHENTICATION (GOOGLE + EMAIL + AUTO PROFILE) --------------------
export async function loginWithGoogle() {
    return sb.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: window.location.origin + window.location.pathname
        }
    });
}

export async function signUpWithEmail(email, password, displayName, rawUsername, bio = "") {
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanUname = String(rawUsername || "")
        .toLowerCase()
        .replace(/^@/, "")
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 24);

    if (cleanUname.length < 3) {
        return { error: { message: "Username kam se kam 3 letters ka hona chahiye." } };
    }

    const { data: existingU } = await sb
        .from("profiles")
        .select("id")
        .eq("username", cleanUname)
        .maybeSingle();
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

    let { data: prof } = await sb
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (!prof) {
        const meta = user.user_metadata || {};
        const emailPrefix = (user.email || "user").split("@")[0];
        let baseU = String(meta.preferred_username || emailPrefix)
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, "")
            .slice(0, 18);
        if (baseU.length < 3) baseU = "nx_" + user.id.slice(0, 6);

        const { data: taken } = await sb
            .from("profiles")
            .select("id")
            .eq("username", baseU)
            .maybeSingle();
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

        const { data: inserted } = await sb
            .from("profiles")
            .upsert(newRow, { onConflict: "id" })
            .select("*")
            .single();
        prof = inserted || newRow;
    } else {
        sb.from("profiles")
            .update({ last_online: new Date().toISOString() })
            .eq("id", user.id)
            .then(() => {});
    }

    if (prof.is_banned) {
        await sb.auth.signOut();
        localStorage.removeItem("nx_active_account");
        alert("🚫 Your account has been suspended by Admin.");
        return null;
    }

    await registerActiveSession(user.id);
    await initUserE2EEKeys(user.id);

    // Bridge object compatible with all Nexus UI tabs
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

    try {
        localStorage.setItem("nx_active_account", JSON.stringify(bridged));
    } catch (e) {}

    return bridged;
}

export async function logoutUser() {
    try {
        const sid = localStorage.getItem("nexus_device_sid");
        if (sid) {
            await sb.from("active_sessions").update({ is_revoked: true }).eq("session_id", sid);
        }
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

    const { error } = await sb.storage
        .from("public-media")
        .upload(path, file, {
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

    const { error } = await sb.storage
        .from("private-chat-media")
        .upload(path, file, {
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

export async function getSignedChatMediaUrl(storagePath, expiresSec = 3600) {
    if (!storagePath) return "";
    if (/^https?:\/\//i.test(storagePath) || /^data:/i.test(storagePath)) return storagePath;

    const cached = signedUrlCache.get(storagePath);
    if (cached && cached.exp > Date.now() + 60000) return cached.url;

    const { data, error } = await sb.storage
        .from("private-chat-media")
        .createSignedUrl(storagePath, expiresSec);
    if (error || !data || !data.signedUrl) return "";

    signedUrlCache.set(storagePath, {
        url: data.signedUrl,
        exp: Date.now() + (expiresSec * 1000)
    });
    return data.signedUrl;
}

// -------------------- 6. 1:1 CONVERSATIONS, TRUE E2EE SEND/DECRYPT, VIEW-ONCE & REACTIONS --------------------
export async function getOrCreateConversation(myId, peerId) {
    if (!myId || !peerId) throw new Error("Invalid user IDs");
    const [a, b] = myId < peerId ? [myId, peerId] : [peerId, myId];

    const { data: existing } = await sb
        .from("conversations")
        .select("id")
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

export async function sendChatMessage({
    conversationId,
    myUserId,
    peerUserId,
    peerPublicKeyJson = null,
    text = "",
    mediaPath = "",
    mediaType = "text",
    fileName = "",
    sticker = null,
    isViewOnce = false,
    replyTo = null
}) {
    const payloadObj = {
        v: 2,
        t: String(text || ""),
        mp: String(mediaPath || ""),
        mt: String(mediaType || "text"),
        fn: String(fileName || ""),
        stk: sticker || null,
        vo: Boolean(isViewOnce)
    };
    const rawJson = JSON.stringify(payloadObj);

    let ciphertext = rawJson;
    let ivStr = "WAIT_PEER_KEY";

    // True AES-256-GCM Encryption whenever peer's ECDH public key is present
    if (peerPublicKeyJson && myUserId !== peerUserId) {
        try {
            const aesKey = await deriveSharedAesKey(myUserId, peerPublicKeyJson);
            if (aesKey) {
                const iv = crypto.getRandomValues(new Uint8Array(12));
                const encBuf = await crypto.subtle.encrypt(
                    { name: "AES-GCM", iv },
                    aesKey,
                    new TextEncoder().encode(rawJson)
                );
                ciphertext = b64Enc(encBuf);
                ivStr = b64Enc(iv);
            }
        } catch (e) {
            console.warn("E2EE encrypt fallback:", e);
        }
    }

    const dbMsgType = ["image", "video", "audio", "file"].includes(mediaType) ? mediaType : "text";

    const row = {
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
    };

    const { data, error } = await sb
        .from("messages")
        .insert(row)
        .select("*")
        .single();
    if (error) throw error;
    return data;
}

export async function decryptMessageRow(row, myUserId, peerPublicKeyJson) {
    if (!row) return null;
    if (row.is_deleted_everyone) {
        return {
            deleted: true,
            text: "This message was deleted",
            mediaPath: "",
            mediaType: "text",
            fileName: "",
            sticker: null,
            viewOnce: false,
            viewOnceOpened: false
        };
    }

    let plainStr = row.ciphertext || "";
    const iv = String(row.iv || "");

    if (row.msg_type === "legacy_migrated" || iv === "LEGACY_PLAIN") {
        const isImg = /^data:image\/|^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i.test(plainStr);
        return {
            deleted: false,
            text: isImg ? "" : plainStr,
            mediaPath: isImg ? plainStr : (row.media_path || ""),
            mediaType: isImg ? "image" : "text",
            fileName: "",
            sticker: null,
            viewOnce: false,
            viewOnceOpened: false
        };
    }

    if (iv !== "WAIT_PEER_KEY" && iv.length >= 8 && peerPublicKeyJson) {
        try {
            const aesKey = await deriveSharedAesKey(myUserId, peerPublicKeyJson);
            if (aesKey) {
                const plainBuf = await crypto.subtle.decrypt(
                    { name: "AES-GCM", iv: b64Dec(iv) },
                    aesKey,
                    b64Dec(row.ciphertext)
                );
                plainStr = new TextDecoder().decode(plainBuf);
            }
        } catch (e) {
            return {
                deleted: false,
                locked: true,
                text: "🔒 Encrypted on another device — enter 6-digit Backup PIN in Settings to unlock",
                mediaPath: "",
                mediaType: "text",
                fileName: "",
                sticker: null,
                viewOnce: Boolean(row.is_view_once),
                viewOnceOpened: Boolean(row.view_once_opened)
            };
        }
    }

    // Parse v2 JSON payload or fallback to plain text
    try {
        const obj = JSON.parse(plainStr);
        if (obj && obj.v === 2) {
            return {
                deleted: false,
                text: obj.t || "",
                mediaPath: row.view_once_opened ? "" : (obj.mp || row.media_path || ""),
                mediaType: obj.mt || row.msg_type || "text",
                fileName: obj.fn || "",
                sticker: obj.stk || null,
                viewOnce: Boolean(row.is_view_once || obj.vo),
                viewOnceOpened: Boolean(row.view_once_opened)
            };
        }
    } catch (e) {}

    return {
        deleted: false,
        text: plainStr,
        mediaPath: row.view_once_opened ? "" : (row.media_path || ""),
        mediaType: row.msg_type || "text",
        fileName: "",
        sticker: null,
        viewOnce: Boolean(row.is_view_once),
        viewOnceOpened: Boolean(row.view_once_opened)
    };
}

// EXACT MESSAGE REACTION (Always targets exact UUID messageId!)
export async function toggleMessageReaction(messageId, emoji, myUsername) {
    if (!messageId || !emoji || !myUsername) return null;
    const uname = String(myUsername).toLowerCase().trim();

    const { data: row, error } = await sb
        .from("messages")
        .select("reactions")
        .eq("id", messageId)
        .single();
    if (error || !row) return null;

    const reactions = Object.assign({}, row.reactions || {});
    if (reactions[uname] === emoji) {
        delete reactions[uname];
    } else {
        reactions[uname] = emoji;
    }

    const { error: upErr } = await sb
        .from("messages")
        .update({ reactions })
        .eq("id", messageId);
    if (upErr) throw upErr;
    return reactions;
}

// EXACT MESSAGE EDIT
export async function editChatMessage({ messageId, myUserId, peerUserId, peerPublicKeyJson, newText }) {
    const payloadObj = { v: 2, t: String(newText || ""), mp: "", mt: "text", fn: "", stk: null, vo: false };
    const rawJson = JSON.stringify(payloadObj);

    let ciphertext = rawJson;
    let ivStr = "WAIT_PEER_KEY";
    if (peerPublicKeyJson && myUserId !== peerUserId) {
        try {
            const aesKey = await deriveSharedAesKey(myUserId, peerPublicKeyJson);
            if (aesKey) {
                const iv = crypto.getRandomValues(new Uint8Array(12));
                const encBuf = await crypto.subtle.encrypt(
                    { name: "AES-GCM", iv },
                    aesKey,
                    new TextEncoder().encode(rawJson)
                );
                ciphertext = b64Enc(encBuf);
                ivStr = b64Enc(iv);
            }
        } catch (e) {}
    }

    return sb
        .from("messages")
        .update({ ciphertext, iv: ivStr, is_edited: true })
        .eq("id", messageId)
        .eq("sender_id", myUserId);
}

// EXACT DELETE FOR EVERYONE (Works for Text, Photo, Video, Voice & View-Once!)
export async function deleteMessageForEveryone(messageId, storagePath = "") {
    if (!messageId) return;
    if (storagePath && !/^https?:\/\//i.test(storagePath) && !/^data:/i.test(storagePath)) {
        try {
            await sb.storage.from("private-chat-media").remove([storagePath]);
            signedUrlCache.delete(storagePath);
        } catch (e) {}
    }
    return sb
        .from("messages")
        .update({
            is_deleted_everyone: true,
            ciphertext: "",
            media_path: "",
            reactions: {}
        })
        .eq("id", messageId);
}

// TRUE VIEW-ONCE BURN (Marks opened in DB + deletes file from Storage forever!)
export async function burnViewOnceMessage(messageId, storagePath = "") {
    if (!messageId) return;
    if (storagePath && !/^https?:\/\//i.test(storagePath) && !/^data:/i.test(storagePath)) {
        try {
            await sb.storage.from("private-chat-media").remove([storagePath]);
            signedUrlCache.delete(storagePath);
        } catch (e) {}
    }
    return sb
        .from("messages")
        .update({
            view_once_opened: true,
            ciphertext: "",
            media_path: ""
        })
        .eq("id", messageId);
}

export async function markConversationSeen(conversationId, myUserId) {
    if (!conversationId || !myUserId) return;
    return sb
        .from("messages")
        .update({ seen: true })
        .eq("conversation_id", conversationId)
        .eq("receiver_id", myUserId)
        .eq("seen", false);
}

export function subscribeToConversation(conversationId, onEvent) {
    const channel = sb
        .channel("nx_conv_" + conversationId)
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "messages",
                filter: `conversation_id=eq.${conversationId}`
            },
            (payload) => {
                if (typeof onEvent === "function") onEvent(payload);
            }
        )
        .subscribe();

    return () => {
        try { sb.removeChannel(channel); } catch (e) {}
    };
}

// -------------------- 7. SERVER-VERIFIED PRO SUBSCRIPTION CHECK --------------------
export async function checkIsUserPro() {
    const { data, error } = await sb.rpc("is_current_user_pro");
    return !error && data === true;
}

// -------------------- 8. GLOBAL BRIDGE FOR CLASSIC NEXUS SCRIPTS --------------------
window.NexusSecurity = {
    sb,
    SUPABASE_URL,
    loginWithGoogle,
    signUpWithEmail,
    loginWithEmail,
    syncCurrentUserProfile,
    logoutUser,
    registerActiveSession,
    verifyCurrentSessionNotRevoked,
    initUserE2EEKeys,
    backupPrivateKeyWithPin,
    restorePrivateKeyWithPin,
    uploadPublicMedia,
    uploadPrivateChatMedia,
    getSignedChatMediaUrl,
    getOrCreateConversation,
    sendChatMessage,
    decryptMessageRow,
    toggleMessageReaction,
    editChatMessage,
    deleteMessageForEveryone,
    burnViewOnceMessage,
    markConversationSeen,
    subscribeToConversation,
    checkIsUserPro
};

window.dispatchEvent(new CustomEvent("nexus-security-ready", { detail: window.NexusSecurity }));
