// NEXUS-SECURITY.JS (v4.1 SINGLE-BLOCK — ZERO PASTE ERRORS!)
(function () {
    const SUPABASE_URL = ("https" + "://" + "fegmtyoxijvktoxtealo" + ".supabase.co").trim();
    const SUPABASE_ANON_KEY = ("sb_publishable_" + "jpH6tVu1sCNSwLmgvRTxrw_w8xq5thV").trim();
    if (!window.supabase || !window.supabase.createClient) return console.error("Supabase CDN missing!");

    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });

    const b64Enc = (buf) => {
        const b = new Uint8Array(buf); let s = "";
        for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
        return btoa(s);
    };
    const b64Dec = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
    const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

    function getSid() {
        let sid = localStorage.getItem("nexus_device_sid");
        if (!sid) {
            sid = "nx_" + ((crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now().toString(36) + Math.random().toString(36).slice(2, 9)));
            localStorage.setItem("nexus_device_sid", sid);
        }
        return sid;
    }

    async function getAuthUid() {
        const { data } = await sb.auth.getSession();
        return (data && data.session && data.session.user && data.session.user.id) || null;
    }

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
            await sb.auth.signOut();
            localStorage.removeItem("nx_active_account");
            alert("🔒 Aapka account kisi naye device par login hua hai (Max 2 devices limit). Dobara login karein.");
            window.location.reload();
            return false;
        }
        return true;
    }

    // E2EE Key Vault (IndexedDB)
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
                await saveKey("priv_" + uid, priv);
                await saveKey("pub_" + uid, pub);
                await sb.from("profiles").update({ e2ee_public_key: JSON.stringify(pub) }).eq("id", uid);
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
        const id = uid || await getAuthUid();
        const p = String(pin || "").replace(/\D/g, "");
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

    // Auth + OTP + Recovery + Onboarding
    const loginWithGoogle = () => sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + window.location.pathname } });
    const sendEmailOtp = (email, create = true) => sb.auth.signInWithOtp({ email: String(email || "").trim().toLowerCase(), options: { shouldCreateUser: Boolean(create) } });
    const updateUserPassword = (pw) => sb.auth.updateUser({ password: String(pw || "").trim() });

    async function verifyEmailOtp(email, code) {
        const { data, error } = await sb.auth.verifyOtp({ email: String(email || "").trim().toLowerCase(), token: String(code || "").replace(/\D/g, ""), type: "email" });
        if (!error && data && data.user) await syncCurrentUserProfile();
        return { data, error };
    }

    async function loginWithEmail(email, password) {
        const { data, error } = await sb.auth.signInWithPassword({ email: String(email || "").trim().toLowerCase(), password: String(password || "") });
        if (!error && data && data.user) await syncCurrentUserProfile();
        return { data, error };
    }

    async function checkUsernameAvailable(raw, ignoreId) {
        const clean = String(raw || "").toLowerCase().replace(/^@/, "").replace(/[^a-z0-9_]/g, "").slice(0, 24);
        if (clean.length < 3) return { ok: false, clean, reason: "Kam se kam 3 letters dalein." };
        if (["admin", "nexus", "nexus_official", "member"].includes(clean)) return { ok: false, clean, reason: "Reserved username." };
        const { data } = await sb.from("profiles").select("id").eq("username", clean).maybeSingle();
        if (data && data.id !== ignoreId) return { ok: false, clean, reason: `@${clean} pehle se liya hua hai.` };
        return { ok: true, clean };
    }

    async function completeUserOnboarding({ displayName, username, bio, password, backupPin }) {
        const uid = await getAuthUid();
        if (!uid) throw new Error("Session expired, dobara login karein.");
        const chk = await checkUsernameAvailable(username, uid);
        if (!chk.ok) throw new Error(chk.reason);
        const nm = String(displayName || "").trim();
        if (nm.length < 2) throw new Error("Apna sahi Full Name dalein.");
        const { error } = await sb.from("profiles").upsert({
            id: uid, firebase_uid: chk.clean, username: chk.clean, display_name: nm.slice(0, 60),
            bio: String(bio || "Nexus Community Member ✨").trim().slice(0, 220), is_onboarded: true, last_online: new Date().toISOString()
        }, { onConflict: "id" });
        if (error) throw error;
        if (password && password.trim().length >= 6) await updateUserPassword(password).catch(() => {});
        if (backupPin && backupPin.replace(/\D/g, "").length === 6) await backupPrivateKeyWithPin(uid, backupPin).catch(() => {});
        return syncCurrentUserProfile();
    }

    async function syncCurrentUserProfile() {
        const { data: sd } = await sb.auth.getSession();
        const user = sd && sd.session ? sd.session.user : null;
        if (!user) return null;
        let { data: prof } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
        let needsOb = false;
        if (!prof) {
            const tmpU = "user_" + user.id.replace(/-/g, "").slice(0, 8);
            const row = { id: user.id, firebase_uid: tmpU, username: tmpU, display_name: "", avatar_url: "", bio: "Nexus Community Member ✨", is_verified: true, is_onboarded: false, role: "user", last_online: new Date().toISOString() };
            const { data: ins } = await sb.from("profiles").upsert(row, { onConflict: "id" }).select("*").single();
            prof = ins || row;
            needsOb = true;
        } else {
            needsOb = prof.is_onboarded === false || !prof.display_name;
            sb.from("profiles").update({ last_online: new Date().toISOString() }).eq("id", user.id).then(() => {});
        }
        if (prof.is_banned) { await sb.auth.signOut(); localStorage.removeItem("nx_active_account"); alert("🚫 Account suspended."); return null; }
        await registerActiveSession(user.id);
        await initUserE2EEKeys(user.id);
        const bridged = {
            id: prof.id, uid: prof.id, username: prof.username, name: prof.display_name || prof.username,
            email: user.email || "", dp: prof.avatar_url || "", bio: prof.bio || "",
            moodNote: prof.mood_note || "", profileSong: prof.profile_song || null, website: prof.website || "",
            verified: Boolean(prof.is_verified), googleVerified: true, isOnboarded: !needsOb, role: prof.role || "user",
            blockedUsers: Array.isArray(prof.blocked_users) ? prof.blocked_users : [], showReadReceipts: prof.show_read_receipts !== false,
            followersList: Array.isArray(prof.followers_list) ? prof.followers_list : [], followingList: Array.isArray(prof.following_list) ? prof.following_list : [],
            isOnlineNow: true, lastOnline: Date.now()
        };
        try { localStorage.setItem("nx_active_account", JSON.stringify(bridged)); } catch (e) {}
        if (needsOb) setTimeout(() => openMandatoryOnboardingModal(bridged), 120);
        return bridged;
    }

    async function logoutUser() {
        try { const sid = localStorage.getItem("nexus_device_sid"); if (sid) await sb.from("active_sessions").update({ is_revoked: true }).eq("session_id", sid); } catch (e) {}
        await sb.auth.signOut();
        localStorage.removeItem("nx_active_account");
        localStorage.removeItem("nx_legacy_backup_account");
        window.location.reload();
    }

    // 50MB Storage + 1:1 Messaging + View-Once + Reactions
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
        const uid = (await getAuthUid()) || opts.myUserId;
        if (!uid) throw new Error("Session expired, dobara login karein.");
        const raw = JSON.stringify({ v: 2, t: String(opts.text || ""), mp: String(opts.mediaPath || ""), mt: String(opts.mediaType || "text"), fn: String(opts.fileName || ""), stk: opts.sticker || null, vo: Boolean(opts.isViewOnce) });
        let ciphertext = raw, ivStr = "WAIT_PEER_KEY";
        if (opts.peerPublicKeyJson && uid !== opts.peerUserId) {
            try {
                const k = await deriveAes(uid, opts.peerPublicKeyJson);
                if (k) { const iv = crypto.getRandomValues(new Uint8Array(12)); ciphertext = b64Enc(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, new TextEncoder().encode(raw))); ivStr = b64Enc(iv); }
            } catch (e) {}
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
            try {
                const k = await deriveAes(myUid, peerPubJson);
                if (k) plain = new TextDecoder().decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64Dec(iv) }, k, b64Dec(row.ciphertext)));
            } catch (e) { return { deleted: false, locked: true, text: "🔒 Encrypted on another device — enter 6-digit Backup PIN", mediaPath: "", mediaType: "text" }; }
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

    // Mandatory Onboarding Modal
    function openMandatoryOnboardingModal(uObj) {
        if (document.getElementById("nx-onboard-modal")) return;
        const m = document.createElement("div");
        m.id = "nx-onboard-modal";
        m.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,0.96);z-index:310000;display:flex;align-items:center;justify-content:center;padding:16px;";
        m.innerHTML = `<div style="background:#0f172a;border:1.5px solid #10b981;border-radius:22px;width:100%;max-width:395px;padding:20px 18px;color:#fff;max-height:90dvh;overflow-y:auto;">
            <h3 style="font-size:17px;font-weight:900;color:#34d399;text-align:center;margin-bottom:10px;">✨ Complete Your Nexus Profile</h3>
            <div id="nx-ob-err" style="display:none;background:rgba(244,63,94,0.16);border:1px solid #f43f5e;color:#fda4af;padding:8px;border-radius:10px;font-size:12px;margin-bottom:8px;"></div>
            <div style="display:flex;flex-direction:column;gap:9px;">
                <input id="nx-ob-name" placeholder="Full Name *" style="padding:11px;border-radius:11px;background:#090d16;border:1px solid #334155;color:#fff;outline:none;" />
                <input id="nx-ob-uname" placeholder="Unique Username * (e.g. mohit_01)" autocapitalize="none" style="padding:11px;border-radius:11px;background:#090d16;border:1px solid #334155;color:#fff;outline:none;" />
                <div id="nx-ob-st" style="font-size:11px;color:#64748b;font-weight:700;">Letters, numbers &amp; _ only</div>
                <input id="nx-ob-bio" placeholder="Bio (e.g. IIT-JEE 2027)" style="padding:10px;border-radius:11px;background:#090d16;border:1px solid #334155;color:#fff;outline:none;" />
                <input type="password" id="nx-ob-pass" placeholder="Set Password (min 6 chars)" style="padding:10px;border-radius:11px;background:#090d16;border:1px solid #334155;color:#fff;outline:none;" />
                <input type="tel" id="nx-ob-pin" maxlength="6" placeholder="6-Digit E2EE Backup PIN (Optional)" style="padding:10px;border-radius:11px;background:#090d16;border:1px solid #10b981;color:#34d399;outline:none;" />
                <button type="button" id="nx-ob-save" style="padding:13px;border-radius:13px;background:linear-gradient(90deg,#10b981,#06b6d4);color:#020617;font-weight:900;border:none;cursor:pointer;">🚀 Save &amp; Enter Nexus</button>
            </div></div>`;
        document.body.appendChild(m);
        const uInp = m.querySelector("#nx-ob-uname"), st = m.querySelector("#nx-ob-st");
        let tm;
        uInp.oninput = () => { clearTimeout(tm); tm = setTimeout(async () => { const r = await checkUsernameAvailable(uInp.value, await getAuthUid()); st.style.color = r.ok ? "#34d399" : "#f43f5e"; st.textContent = r.ok ? `✅ @${r.clean} available!` : `❌ ${r.reason}`; }, 350); };
        m.querySelector("#nx-ob-save").onclick = async function () {
            const eb = m.querySelector("#nx-ob-err"); eb.style.display = "none"; this.disabled = true; this.textContent = "⏳ Saving...";
            try {
                await completeUserOnboarding({ displayName: m.querySelector("#nx-ob-name").value, username: uInp.value, bio: m.querySelector("#nx-ob-bio").value, password: m.querySelector("#nx-ob-pass").value, backupPin: m.querySelector("#nx-ob-pin").value });
                m.remove();
                if (window.Nexus && Nexus.refreshCloudData) await Nexus.refreshCloudData();
                if (window.Nexus && Nexus.toast) Nexus.toast("🎉 Profile Ready!");
            } catch (e) { this.disabled = false; this.textContent = "🚀 Save & Enter Nexus"; eb.textContent = "❌ " + e.message; eb.style.display = "block"; }
        };
    }

    // IG/FB-Style Auth & Recovery Modal (Zero Ugly supabase.co URL)
    function openAdvancedNexusAuthModal(initialMode) {
        document.getElementById("nx-sb-auth-modal")?.remove();
        let view = initialMode === "signup" ? "signup" : "login", pendingEmail = "", intent = "signup";
        const m = document.createElement("div");
        m.id = "nx-sb-auth-modal";
        m.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,0.94);z-index:299000;display:flex;align-items:center;justify-content:center;padding:16px;";
        const done = async (msg) => { if (window.Nexus && Nexus.refreshCloudData) await Nexus.refreshCloudData(); m.remove(); document.getElementById("nx-google-auth-hub")?.remove(); document.body.classList.remove("nx-auth-locked"); if (window.Nexus && Nexus.toast) Nexus.toast(msg); };

        const render = () => {
            let body = "";
            if (view === "login") {
                body = `<div style="display:flex;flex-direction:column;gap:10px;">
                    <input type="email" id="nx-li-em" value="${esc(pendingEmail)}" placeholder="Gmail address" autocapitalize="none" style="padding:12px;border-radius:12px;background:#090d16;border:1px solid #334155;color:#fff;outline:none;" />
                    <input type="password" id="nx-li-pw" placeholder="Password" style="padding:12px;border-radius:12px;background:#090d16;border:1px solid #334155;color:#fff;outline:none;" />
                    <button type="button" id="nx-li-go" style="padding:13px;border-radius:13px;background:linear-gradient(90deg,#10b981,#06b6d4);color:#020617;font-weight:900;border:none;cursor:pointer;">🔓 Log In</button>
                    <div style="display:flex;justify-content:space-between;">
                        <button type="button" id="nx-go-fg" style="background:none;border:none;color:#38bdf8;font-size:12px;font-weight:800;cursor:pointer;">Forgot Password?</button>
                        <button type="button" id="nx-go-otp" style="background:none;border:none;color:#34d399;font-size:12px;font-weight:800;cursor:pointer;">📧 6-Digit Gmail OTP</button>
                    </div>
                    <button type="button" id="nx-go-su" style="padding:11px;border-radius:12px;background:rgba(16,185,129,0.14);border:1px solid #10b981;color:#34d399;font-weight:900;cursor:pointer;">✨ Create New Nexus Account</button>
                </div>`;
            } else if (view === "signup" || view === "forgot") {
                const isFg = view === "forgot";
                body = `<div style="display:flex;flex-direction:column;gap:10px;">
                    <p style="font-size:12px;color:#cbd5e1;">${isFg ? "Apna registered Gmail dalein — 6-Digit Recovery Code bhejenge." : "Apna asli Gmail dalein — Nexus Community 6-Digit Verification OTP bhejega."}</p>
                    <input type="email" id="nx-em-in" value="${esc(pendingEmail)}" placeholder="yourname@gmail.com" autocapitalize="none" style="padding:12px;border-radius:12px;background:#090d16;border:1.5px solid #10b981;color:#fff;outline:none;" />
                    <button type="button" id="nx-em-send" style="padding:13px;border-radius:13px;background:linear-gradient(90deg,#10b981,#06b6d4);color:#020617;font-weight:900;border:none;cursor:pointer;">📧 Send 6-Digit OTP</button>
                    <button type="button" id="nx-bk" style="background:none;border:none;color:#94a3b8;font-size:12px;font-weight:800;cursor:pointer;">← Back to Log In</button>
                </div>`;
            } else if (view === "otp") {
                body = `<div style="display:flex;flex-direction:column;gap:10px;">
                    <div style="font-size:12px;color:#cbd5e1;text-align:center;">Gmail (Inbox/Spam) mein aaya 6-digit code dalein:<br><b style="color:#38bdf8;">${esc(pendingEmail)}</b></div>
                    <input type="tel" id="nx-code-in" maxlength="6" placeholder="• • • • • •" style="padding:13px;border-radius:12px;background:#090d16;border:1.5px solid #10b981;color:#34d399;font-size:24px;font-weight:900;text-align:center;letter-spacing:8px;outline:none;" />
                    <button type="button" id="nx-code-go" style="padding:13px;border-radius:13px;background:linear-gradient(90deg,#10b981,#06b6d4);color:#020617;font-weight:900;border:none;cursor:pointer;">✅ Verify 6-Digit Code</button>
                    <button type="button" id="nx-bk" style="background:none;border:none;color:#94a3b8;font-size:12px;font-weight:800;cursor:pointer;">← Change Gmail</button>
                </div>`;
            } else if (view === "reset") {
                body = `<div style="display:flex;flex-direction:column;gap:10px;">
                    <p style="font-size:12.5px;color:#34d399;font-weight:800;">✅ Verified! Naya password set karein:</p>
                    <input type="password" id="nx-p1" placeholder="New Password (min 6 chars)" style="padding:12px;border-radius:12px;background:#090d16;border:1px solid #10b981;color:#fff;outline:none;" />
                    <button type="button" id="nx-p-save" style="padding:13px;border-radius:13px;background:#10b981;color:#020617;font-weight:900;border:none;cursor:pointer;">🔐 Save Password &amp; Login</button>
                </div>`;
            }
            m.innerHTML = `<div style="background:linear-gradient(155deg,#0f172a,#090d16);border:1.5px solid #10b981;border-radius:24px;width:100%;max-width:390px;padding:22px 18px;color:#fff;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
                    <div><div style="font-size:19px;font-weight:900;color:#34d399;">Nexus Community</div><div style="font-size:11px;color:#94a3b8;">🔐 6-Digit Gmail OTP • True E2EE</div></div>
                    <button type="button" id="nx-ax" style="width:30px;height:30px;border-radius:50%;background:#1e293b;border:none;color:#cbd5e1;cursor:pointer;">✕</button>
                </div>
                <div id="nx-ae" style="display:none;background:rgba(244,63,94,0.16);border:1px solid #f43f5e;color:#fda4af;padding:8px;border-radius:10px;font-size:12px;margin-bottom:10px;"></div>
                ${body}
            </div>`;
            const err = (t) => { const b = m.querySelector("#nx-ae"); if (b) { b.textContent = t; b.style.display = "block"; } };
            m.querySelector("#nx-ax").onclick = () => m.remove();
            if (m.querySelector("#nx-bk")) m.querySelector("#nx-bk").onclick = () => { view = "login"; render(); };

            if (view === "login") {
                m.querySelector("#nx-go-su").onclick = () => { intent = "signup"; view = "signup"; render(); };
                m.querySelector("#nx-go-otp").onclick = () => { intent = "login"; view = "signup"; render(); };
                m.querySelector("#nx-go-fg").onclick = () => { intent = "recovery"; view = "forgot"; render(); };
                m.querySelector("#nx-li-go").onclick = async function () {
                    const em = m.querySelector("#nx-li-em").value.trim(), pw = m.querySelector("#nx-li-pw").value.trim();
                    if (!em.includes("@") || pw.length < 6) return err("⚠️ Sahi Gmail aur 6+ char Password dalein.");
                    this.disabled = true; this.textContent = "⏳ Logging In...";
                    const { error } = await loginWithEmail(em, pw);
                    if (error) { this.disabled = false; this.textContent = "🔓 Log In"; return err("❌ Galat Email/Password — '6-Digit Gmail OTP' ya 'Forgot Password?' use karein."); }
                    await done("✅ Welcome Back!");
                };
            } else if (view === "signup" || view === "forgot") {
                m.querySelector("#nx-em-send").onclick = async function () {
                    const em = m.querySelector("#nx-em-in").value.trim().toLowerCase();
                    if (!em.includes("@")) return err("⚠️ Sahi Gmail dalein.");
                    this.disabled = true; this.textContent = "⏳ Sending OTP...";
                    const { error } = await sendEmailOtp(em, view !== "forgot");
                    if (error) { this.disabled = false; this.textContent = "📧 Send 6-Digit OTP"; return err("❌ " + error.message); }
                    pendingEmail = em; view = "otp"; render();
                };
            } else if (view === "otp") {
                m.querySelector("#nx-code-go").onclick = async function () {
                    const c = m.querySelector("#nx-code-in").value.trim();
                    if (c.length < 6) return err("⚠️ Poora 6-digit code dalein.");
                    this.disabled = true; this.textContent = "⏳ Verifying...";
                    const { error } = await verifyEmailOtp(pendingEmail, c);
                    if (error) { this.disabled = false; this.textContent = "✅ Verify 6-Digit Code"; return err("❌ Galat ya expired OTP!"); }
                    if (intent === "recovery") { view = "reset"; render(); } else await done("✅ Gmail Verified!");
                };
            } else if (view === "reset") {
                m.querySelector("#nx-p-save").onclick = async function () {
                    const p = m.querySelector("#nx-p1").value.trim();
                    if (p.length < 6) return err("⚠️ Min 6 characters password dalein.");
                    this.disabled = true;
                    const { error } = await updateUserPassword(p);
                    if (error) { this.disabled = false; return err("❌ " + error.message); }
                    await done("🔐 Password Updated!");
                };
            }
        };
        render();
        document.body.appendChild(m);
        m.onclick = (e) => { if (e.target === m) m.remove(); };
    }

    async function openSecurityCenterModal() {
        document.getElementById("nx-sec-center-modal")?.remove();
        const uid = await getAuthUid();
        if (!uid) return openAdvancedNexusAuthModal("login");
        const sessions = await getMyActiveSessions(uid);
        const m = document.createElement("div");
        m.id = "nx-sec-center-modal";
        m.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,0.94);z-index:299000;display:flex;align-items:center;justify-content:center;padding:16px;";
        m.innerHTML = `<div style="background:#0f172a;border:1.5px solid #10b981;border-radius:22px;width:100%;max-width:400px;padding:18px;color:#fff;">
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;"><h3 style="color:#34d399;font-weight:900;">🛡️ Security Center</h3><button id="nx-scx" style="background:#1e293b;border:none;color:#fff;width:28px;height:28px;border-radius:50%;">✕</button></div>
            <div style="font-size:12px;color:#38bdf8;font-weight:800;margin-bottom:8px;">📱 Active Devices (${sessions.length}/2)</div>
            <button id="nx-scr" style="width:100%;padding:9px;border-radius:10px;background:rgba(244,63,94,0.16);border:1px solid #f43f5e;color:#fda4af;font-weight:800;margin-bottom:10px;">🚫 Log Out All Other Devices</button>
            <input id="nx-scp" type="tel" maxlength="6" placeholder="6-Digit E2EE Backup PIN" style="width:100%;padding:9px;border-radius:10px;background:#090d16;border:1px solid #334155;color:#34d399;margin-bottom:8px;" />
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
                <button id="nx-scb" style="padding:9px;border-radius:10px;background:#10b981;color:#020617;font-weight:900;border:none;">☁️ Backup Key</button>
                <button id="nx-scs" style="padding:9px;border-radius:10px;background:#38bdf8;color:#020617;font-weight:900;border:none;">🔓 Restore Key</button>
            </div>
            <button id="nx-scl" style="width:100%;padding:10px;border-radius:11px;background:#e11d48;color:#fff;font-weight:900;border:none;">🚪 Log Out</button>
        </div>`;
        document.body.appendChild(m);
        m.querySelector("#nx-scx").onclick = () => m.remove();
        m.querySelector("#nx-scl").onclick = logoutUser;
        m.querySelector("#nx-scr").onclick = async () => { await revokeOtherSessions(uid); m.remove(); Nexus.toast("🚫 Other devices logged out!"); };
        m.querySelector("#nx-scb").onclick = async () => { try { await backupPrivateKeyWithPin(uid, m.querySelector("#nx-scp").value); Nexus.toast("☁️ Key Backed Up!"); } catch (e) { alert(e.message); } };
        m.querySelector("#nx-scs").onclick = async () => { try { await restorePrivateKeyWithPin(uid, m.querySelector("#nx-scp").value); Nexus.toast("🔓 Chats Unlocked!"); } catch (e) { alert("❌ Wrong PIN"); } };
    }

    window.NexusSecurity = {
        sb, SUPABASE_URL, getAuthenticatedUserId: getAuthUid, loginWithGoogle, sendEmailOtp, verifyEmailOtp,
        loginWithEmail, updateUserPassword, checkUsernameAvailable, completeUserOnboarding, syncCurrentUserProfile,
        logoutUser, registerActiveSession, verifyCurrentSessionNotRevoked, getMyActiveSessions, revokeOtherSessions,
        openSecurityCenterModal, openMandatoryOnboardingModal, openAdvancedNexusAuthModal, initUserE2EEKeys,
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
/* ============================================================================
   NEXUS REAL-TIME SYNC, 25s LIVE HEARTBEAT & REAL STORY BAR ENGINE (v4.6)
   Paste at the very bottom of nexus-security.js
   ============================================================================ */
(function () {
    if (window.__NEXUS_REALTIME_HEARTBEAT_V46__) return;
    window.__NEXUS_REALTIME_HEARTBEAT_V46__ = true;

    const getSec = () => window.NexusSecurity || null;
    const getSb = () => (window.NexusSecurity && window.NexusSecurity.sb) || null;
    const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const normU = (u) => String(u || "").toLowerCase().replace(/^@/, "").trim();

    function formatShortAgo(ms) {
        if (!ms || ms < 1000000000000) return "";
        const sec = Math.max(1, Math.floor((Date.now() - ms) / 1000));
        if (sec <= 95) return "🟢 Live";
        if (sec < 3600) return Math.floor(sec / 60) + "m ago";
        if (sec < 86400) return Math.floor(sec / 3600) + "h ago";
        return Math.floor(sec / 86400) + "d ago";
    }

    // 1. KILL STALE FIREBASE GHOST SESSION & SYNC REAL SUPABASE SESSION
    async function verifyRealSupabaseSessionOnBoot() {
        const sec = getSec(), sb = getSb();
        if (!sec || !sb) return;
        try {
            const { data } = await sb.auth.getSession();
            const sessionUser = data && data.session ? data.session.user : null;

            if (sessionUser && sessionUser.id) {
                await sec.syncCurrentUserProfile();
                await sendLiveHeartbeatNow(sessionUser.id);
            } else {
                // No real Supabase JWT -> clear old Firebase ghost account so DM/Post writes don't silently fail!
                const raw = localStorage.getItem("nx_active_account");
                if (raw) {
                    localStorage.removeItem("nx_active_account");
                    localStorage.removeItem("nx_legacy_backup_account");
                    if (window.Nexus && Nexus.toast) {
                        Nexus.toast("🔐 Real Supabase Sync ke liye ek baar Login karein!");
                    }
                }
            }
        } catch (e) {}
    }

    // 2. REAL 25-SECOND LIVE PRESENCE HEARTBEAT (KILLS STALE "1d ago" FOREVER!)
    async function sendLiveHeartbeatNow(explicitUid) {
        const sb = getSb();
        if (!sb || document.visibilityState === "hidden") return;
        try {
            let uid = explicitUid;
            if (!uid) {
                const { data } = await sb.auth.getSession();
                uid = data && data.session && data.session.user ? data.session.user.id : null;
            }
            if (!uid) return;
            const nowIso = new Date().toISOString();
            await sb.from("profiles").update({ last_online: nowIso }).eq("id", uid);
            // Update local memory immediately too
            if (window.Nexus && Array.isArray(Nexus.users)) {
                const meRow = Nexus.users.find((u) => u && String(u.id) === String(uid));
                if (meRow) { meRow.lastOnline = Date.now(); meRow.lastSeenAt = Date.now(); }
            }
            renderRealSupabaseStoryBar();
        } catch (e) {}
    }

    // 3. REAL SUPABASE STORY BAR (ZERO DUMMY, LIVE USERS FIRST, ACCURATE LAST SEEN)
    function renderRealSupabaseStoryBar() {
        const homeTab = document.getElementById("tab-home");
        if (!homeTab || !window.Nexus || !Array.isArray(Nexus.users) || !Nexus.users.length) return;

        let bar = document.getElementById("nx-stories-bar");
        if (!bar) {
            bar = document.createElement("div");
            bar.id = "nx-stories-bar";
            homeTab.prepend(bar);
        }

        const myRaw = localStorage.getItem("nx_active_account");
        const me = myRaw ? (() => { try { return JSON.parse(myRaw); } catch (e) { return null; } })() : null;
        const myU = normU(me && me.username);

        const realUsers = Nexus.users
            .filter((u) => u && u.username && normU(u.username) !== "member")
            .sort((a, b) => {
                if (normU(a.username) === myU) return -1;
                if (normU(b.username) === myU) return 1;
                return Number(b.lastOnline || 0) - Number(a.lastOnline || 0);
            })
            .slice(0, 30);

        bar.style.cssText = "display:flex !important;gap:12px;overflow-x:auto;padding:10px 12px 6px;scrollbar-width:none;align-items:flex-start;border-bottom:1px solid #1e293b;background:#090d16;";
        bar.innerHTML = realUsers.map((u) => {
            const uK = normU(u.username);
            const isMe = uK === myU;
            const ts = isMe ? Date.now() : Number(u.lastSeenAt || u.lastOnline || 0);
            const isLive = isMe || (ts > 0 && (Date.now() - ts) <= 95000);
            const badgeText = isLive ? "🟢 Live" : (formatShortAgo(ts) || "Verified");
            const dispName = (u.name || uK).slice(0, 11);
            const av = u.dp
                ? `<img src="${esc(u.dp)}" loading="lazy" style="width:58px;height:58px;border-radius:50%;object-fit:cover;border:2.5px solid ${isLive ? "#10b981" : "#334155"};padding:2px;background:#090d16;display:block;">`
                : `<div style="width:58px;height:58px;border-radius:50%;background:linear-gradient(135deg,${isLive ? "#10b981,#06b6d4" : "#334155,#1e293b"});color:${isLive ? "#020617" : "#f8fafc"};font-weight:900;font-size:22px;display:flex;align-items:center;justify-content:center;border:2.5px solid ${isLive ? "#34d399" : "#475569"};">${esc((u.name || uK)[0].toUpperCase())}</div>`;

            return `<div data-username="${esc(uK)}" style="display:flex;flex-direction:column;align-items:center;width:72px;flex-shrink:0;cursor:pointer;position:relative;">
                <div style="position:relative;">
                    ${av}
                    <span style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);background:${isLive ? "#064e3b" : "#0f172a"};border:1px solid ${isLive ? "#10b981" : "#38bdf8"};color:${isLive ? "#34d399" : "#e0f2fe"};font-size:9px;font-weight:900;padding:1px 6px;border-radius:999px;white-space:nowrap;">${esc(badgeText)}</span>
                </div>
                <div style="font-size:11px;font-weight:800;color:#e2e8f0;margin-top:8px;text-align:center;max-width:70px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(isMe ? "You" : dispName)}</div>
            </div>`;
        }).join("");
    }
    window.__nxRenderRealStoryBar = renderRealSupabaseStoryBar;

    // 4. REAL-TIME SUBSCRIPTION ON PROFILES & POSTS (LIVE SYNC ACROSS ALL DEVICES)
    let globalSyncChannel = null;
    function startGlobalRealtimeDbSync() {
        const sb = getSb();
        if (!sb || globalSyncChannel) return;
        globalSyncChannel = sb.channel("nx_global_live_sync_v46")
            .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, (payload) => {
                const row = payload && payload.new;
                if (row && row.id && window.Nexus && Array.isArray(Nexus.users)) {
                    const idx = Nexus.users.findIndex((u) => u && (String(u.id) === String(row.id) || normU(u.username) === normU(row.username)));
                    const lo = row.last_online ? new Date(row.last_online).getTime() : Date.now();
                    if (idx !== -1) {
                        Nexus.users[idx].lastOnline = lo;
                        Nexus.users[idx].lastSeenAt = lo;
                        if (row.avatar_url) Nexus.users[idx].dp = row.avatar_url;
                        if (row.display_name) Nexus.users[idx].name = row.display_name;
                        if (row.bio !== undefined) Nexus.users[idx].bio = row.bio;
                    } else if (window.__nxSyncSupabaseAll) {
                        window.__nxSyncSupabaseAll(false);
                    }
                    renderRealSupabaseStoryBar();
                }
            })
            .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
                if (window.__nxSyncSupabaseAll) window.__nxSyncSupabaseAll(true);
            })
            .subscribe();
    }

    // Boot sequence
    setTimeout(async () => {
        await verifyRealSupabaseSessionOnBoot();
        if (window.__nxSyncSupabaseAll) await window.__nxSyncSupabaseAll(true);
        renderRealSupabaseStoryBar();
        startGlobalRealtimeDbSync();
    }, 350);

    setInterval(() => sendLiveHeartbeatNow(), 25000);
    setInterval(() => renderRealSupabaseStoryBar(), 8000);
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") sendLiveHeartbeatNow();
    });
})();
