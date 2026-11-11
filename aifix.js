/* ============================================================================
   NEXUS FINAL REAL-TIME ENGINE (ZERO-REFRESH LIVE SYNC)
   - Restores Member Profile "💬 Message" Button & Top Header "🤖 AI" / "📲 App"
   - Instant Cloud Account Creation (Fixes #nx-toast "Connecting to cloud...")
   - Real-Time Instagram-Style Posts & 1:1 DM (Photo, 20MB Video, View-Once, PDF)
   - Dual-Mobile Live YouTube Watch Party Sync & 100% Search
   - Official Nexus-Only AI (Owner: Mohit @mohit_01 & Live Server Status)
   ============================================================================ */

(function() {
    const VERCEL_URL = "https://nexus-community01.vercel.app";

    // --- 0. BACKGROUND CACHE & SERVICE WORKER AUTO-UPDATER (NO MANUAL REFRESH NEEDED) ---
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
            regs.forEach(r => r.update());
        });
    }

    // --- 1. NETLIFY OLD DOMAIN SIMPLE REDIRECT SCREEN ---
    if (window.location.hostname.includes("netlify.app")) {
        const renderNetlifyRedirect = () => {
            document.body.innerHTML = `
                <div style="min-height:100vh;background:#090d16;color:#fff;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,sans-serif;text-align:center;">
                    <div style="background:#111827;border:2px solid #6366f1;border-radius:22px;padding:32px 24px;max-width:380px;width:100%;box-shadow:0 15px 40px rgba(0,0,0,0.7);">
                        <div style="font-size:48px;margin-bottom:10px;">🚀</div>
                        <h2 style="margin:0 0 10px;font-size:22px;color:#60a5fa;">Nexus Naye Server Par Shift Ho Gaya Hai!</h2>
                        <p style="color:#cbd5e1;font-size:14px;line-height:1.6;margin-bottom:22px;">
                            Purana link ab band ho chuka hai. Live 1:1 DM, Watch Party aur Study Channels ke liye niche button dabayein:
                        </p>
                        <a href="${VERCEL_URL}" style="display:block;background:linear-gradient(90deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;padding:14px;border-radius:12px;font-weight:800;font-size:16px;">
                            ⚡ Open New Nexus Website
                        </a>
                    </div>
                </div>
            `;
        };
        if (document.body) renderNetlifyRedirect();
        else window.addEventListener("DOMContentLoaded", renderNetlifyRedirect);
        return;
    }

    // --- HELPER: GET REAL MEMBER PROFILE & SHOW TOAST ---
    function showNexusToast(msg) {
        if (window.Nexus && typeof window.Nexus.toast === "function") {
            window.Nexus.toast(msg);
        } else {
            const t = document.getElementById("nx-toast");
            if (t) {
                t.innerText = msg;
                t.style.display = "block";
                setTimeout(() => { t.style.display = "none"; }, 2400);
            }
        }
    }

    function getRealUser() {
        const keys = ["nexus_user", "currentUser", "nx_user", "user"];
        for (const k of keys) {
            try {
                const raw = localStorage.getItem(k);
                if (raw) {
                    const u = JSON.parse(raw);
                    if (u && (u.name || u.username || u.handle)) {
                        const clean = (u.handle || u.username || u.name).replace(/^@/, "");
                        return {
                            uid: u.uid || clean,
                            name: u.name || clean,
                            username: clean,
                            handle: "@" + clean,
                            stream: u.stream || u.bio || "IIT-JEE Aspirant",
                            avatar: u.avatar || u.photoURL || "",
                            verified: true
                        };
                    }
                }
            } catch (e) {}
        }
        return null;
    }

    // --- 2. RESTORE TOP HEADER "🤖 AI", "📲 App" & MEMBER PROFILE "💬 Message" BUTTON ---
    function ensureUIButtonsRestored() {
        // A. Ensure Top Header has 🤖 AI and 📲 App buttons
        const header = document.querySelector("header, .nx-header, .top-bar, .navbar") || document.body.firstElementChild;
        if (header && (header.innerText || "").includes("Nexus")) {
            if (!document.getElementById("nx-restored-ai-btn") && !(header.innerText || "").includes("AI")) {
                const btnGroup = document.createElement("div");
                btnGroup.id = "nx-restored-ai-btn";
                btnGroup.style.cssText = "display:inline-flex;gap:8px;align-items:center;margin-left:auto;margin-right:10px;";
                btnGroup.innerHTML = `
                    <button onclick="window.openNexusOfficialAI()" style="background:rgba(99,102,241,0.18);border:1px solid #6366f1;color:#e0e7ff;padding:5px 12px;border-radius:18px;font-size:12px;font-weight:700;cursor:pointer;">🤖 AI</button>
                    <button onclick="window.installNexusPWA()" style="background:rgba(16,185,129,0.18);border:1px solid #10b981;color:#6ee7b7;padding:5px 12px;border-radius:18px;font-size:12px;font-weight:700;cursor:pointer;">📲 App</button>
                `;
                header.appendChild(btnGroup);
            }
        }

        // B. Restore "💬 Message" Button inside "Member Full Profile" popup next to "+ Follow"
        document.querySelectorAll("button").forEach(btn => {
            const txt = (btn.innerText || "").trim();
            if ((txt === "+ Follow" || txt === "Following" || txt === "Follow") && !btn.dataset.msgAdded) {
                const modalCard = btn.closest("div");
                if (modalCard && (document.body.innerText || "").includes("Member Full Profile")) {
                    btn.dataset.msgAdded = "true";
                    const parentRow = btn.parentElement;
                    if (parentRow) {
                        parentRow.style.display = "flex";
                        parentRow.style.gap = "10px";
                        btn.style.flex = "1";

                        const msgBtn = document.createElement("button");
                        msgBtn.id = "nx-profile-msg-btn";
                        msgBtn.innerHTML = "💬 Message";
                        msgBtn.style.cssText = `
                            flex: 1; background: linear-gradient(90deg, #10b981, #059669);
                            color: #ffffff; border: none; border-radius: 12px; padding: 12px;
                            font-weight: 800; font-size: 14px; cursor: pointer;
                            box-shadow: 0 4px 15px rgba(16,185,129,0.35);
                        `;
                        msgBtn.onclick = function(ev) {
                            ev.preventDefault();
                            ev.stopPropagation();
                            // Find member name & handle from the profile card
                            const fullBox = btn.closest(".modal, [style*='fixed'], div") || document.body;
                            const handleMatch = (fullBox.innerText || "").match(/@([a-zA-Z0-9_]+)/);
                            const targetHandle = handleMatch ? handleMatch[1] : "member";
                            // Close profile modal if close button exists
                            const closeX = fullBox.querySelector("button");
                            if (closeX && (closeX.innerText.includes("✕") || closeX.innerText.includes("X") || closeX.innerText.includes("×"))) {
                                closeX.click();
                            }
                            // Open 1:1 DM or switch to DM tab immediately without refresh
                            if (window.Nexus && typeof window.Nexus.openDM === "function") {
                                window.Nexus.openDM(targetHandle);
                            } else {
                                const dmNav = document.querySelectorAll(".nx-nav-item, nav button, footer button")[1];
                                if (dmNav) dmNav.click();
                                showNexusToast("💬 Opening 1:1 Chat with @" + targetHandle);
                            }
                        };
                        parentRow.appendChild(msgBtn);
                    }
                }
            }
        });
    }

    // Run UI observer so buttons appear instantly without refreshing whenever any popup opens
    const uiObserver = new MutationObserver(() => ensureUIButtonsRestored());
    if (document.body) {
        uiObserver.observe(document.body, { childList: true, subtree: true });
        ensureUIButtonsRestored();
    } else {
        window.addEventListener("DOMContentLoaded", () => {
            uiObserver.observe(document.body, { childList: true, subtree: true });
            ensureUIButtonsRestored();
        });
    }

    // --- 3. ZERO-REFRESH CLOUD ACCOUNT CREATE & LOGIN (FIXES STUCK #nx-toast) ---
    document.addEventListener("click", async function(e) {
        const btn = e.target.closest("button");
        if (!btn) return;
        const txt = (btn.innerText || "").trim();

        if (txt === "Create Cloud Account" || txt === "Login Existing") {
            const formBox = btn.closest("div");
            if (!formBox) return;
            const inputs = formBox.querySelectorAll("input");
            if (inputs.length < 2) return;

            const vals = Array.from(inputs).map(i => i.value.trim());
            const uName = vals[0];
            const rawId = vals[1] || uName;
            const uStream = vals.length >= 4 ? (vals[2] || "IIT-JEE Aspirant") : "IIT-JEE Aspirant";
            const rawPass = vals[vals.length - 1] || "1234";

            if (!uName) {
                showNexusToast("⚠️ Kripya apna Naam aur ID dalein!");
                return;
            }

            const cleanId = rawId.replace(/^@/, "").replace(/[.#$[\]\s]/g, "_");
            const safePass = rawPass.length < 6 ? (rawPass + "_nx26") : rawPass;

            const userObj = {
                uid: cleanId,
                id: cleanId,
                name: uName,
                username: cleanId,
                handle: "@" + cleanId,
                stream: uStream,
                bio: uStream,
                password: safePass,
                verified: true,
                online: true,
                joinedAt: Date.now()
            };

            // Save in all storage keys immediately
            localStorage.setItem("nexus_user", JSON.stringify(userObj));
            localStorage.setItem("currentUser", JSON.stringify(userObj));
            localStorage.setItem("nx_user", JSON.stringify(userObj));
            localStorage.setItem("nx_logged_in", "true");

            // Push to Firebase Realtime DB in background
            try {
                if (window.firebase && firebase.database) {
                    firebase.database().ref("users/" + cleanId).update(userObj);
                }
            } catch (err) {}

            // Immediately update UI WITHOUT page reload!
            setTimeout(() => {
                showNexusToast("✅ Welcome " + uName + "! Account Active.");
                if (window.Nexus && typeof window.Nexus.init === "function") {
                    try { window.Nexus.init(); } catch (e) {}
                }
                const firstTabBtn = document.querySelector(".nx-nav-item");
                if (window.Nexus && typeof window.Nexus.switchTab === "function" && firstTabBtn) {
                    const tabId = firstTabBtn.getAttribute("data-tab");
                    if (tabId) window.Nexus.switchTab(tabId, firstTabBtn);
                } else if (firstTabBtn) {
                    firstTabBtn.click();
                }
            }, 350);
        }
    }, true);

    // --- 4. 20MB VIDEO, PHOTO & PDF CHUNKED LIVE UPLOAD ENGINE ---
    async function uploadMediaLive(file, onProgress) {
        if (file.size > 20 * 1024 * 1024) {
            throw new Error("File 20MB se badi hai! Kripya 20MB se kam ki file chunein.");
        }

        // Fast Image Compression using Nexus.compressImage or Canvas
        if (file.type.startsWith("image/")) {
            onProgress(40);
            return new Promise((resolve) => {
                if (window.Nexus && typeof window.Nexus.compressImage === "function") {
                    window.Nexus.compressImage(file, 900, 0.75, (dataUrl) => {
                        onProgress(100);
                        resolve({ type: "image", name: file.name, size: file.size, dataUrl: dataUrl });
                    });
                } else {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        onProgress(100);
                        resolve({ type: "image", name: file.name, size: file.size, dataUrl: ev.target.result });
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Video (<20MB) or PDF/File Chunked Upload to Firebase
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onprogress = (ev) => {
                if (ev.lengthComputable) onProgress(Math.round((ev.loaded / ev.total) * 50));
            };
            reader.onload = async (ev) => {
                const base64 = ev.target.result;
                const mType = file.type.startsWith("video/") ? "video" : "file";
                const mediaId = "nxm_" + Date.now() + "_" + Math.floor(Math.random() * 999);

                if (window.firebase && firebase.database) {
                    try {
                        const chunkSize = 240 * 1024;
                        const total = Math.ceil(base64.length / chunkSize);
                        const ref = firebase.database().ref("nexus_media_chunks/" + mediaId);
                        for (let i = 0; i < total; i++) {
                            await ref.child("c_" + i).set(base64.slice(i * chunkSize, (i + 1) * chunkSize));
                            onProgress(50 + Math.round(((i + 1) / total) * 50));
                        }
                        await ref.child("meta").set({ totalChunks: total, mime: file.type, name: file.name, size: file.size });
                        resolve({ type: mType, name: file.name, size: file.size, chunkedId: mediaId, dataUrl: total <= 5 ? base64 : null });
                        return;
                    } catch (e) {}
                }
                onProgress(100);
                resolve({ type: mType, name: file.name, size: file.size, dataUrl: base64 });
            };
            reader.onerror = () => reject(new Error("File read error"));
            reader.readAsDataURL(file);
        });
    }

    window.playChunkedNexusMedia = async function(mediaId, containerId) {
        const box = document.getElementById(containerId);
        if (!box || !window.firebase || !firebase.database) return;
        box.innerHTML = `<div style="padding:12px;color:#60a5fa;font-size:13px;">⏳ Loading 20MB Cloud Media...</div>`;
        try {
            const snap = await firebase.database().ref("nexus_media_chunks/" + mediaId).once("value");
            const data = snap.val();
            if (!data || !data.meta) return;
            let full = "";
            for (let i = 0; i < data.meta.totalChunks; i++) full += (data["c_" + i] || "");
            if ((data.meta.mime || "").startsWith("video/")) {
                box.innerHTML = `<video src="${full}" controls autoplay playsinline style="width:100%;max-height:360px;border-radius:12px;background:#000;"></video>`;
            } else {
                box.innerHTML = `<a href="${full}" download="${data.meta.name}" style="display:inline-block;background:#4f46e5;color:#fff;padding:10px 16px;border-radius:10px;text-decoration:none;font-weight:700;">📥 Download ${data.meta.name}</a>`;
            }
        } catch (e) {
            box.innerHTML = `<div style="color:#f87171;">⚠️ Media load error.</div>`;
        }
    };

    // --- 5. REAL-TIME 1:1 DM MEDIA SENDER & LIVE RECEIVER (NO REFRESH NEEDED) ---
    function sendLiveDMMedia(mode) {
        const picker = document.createElement("input");
        picker.type = "file";
        picker.accept = (mode === "Photo" || mode === "View-Once") ? "image/*,video/*" : ".pdf,.doc,.docx,.txt,image/*,video/*";

        picker.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const me = getRealUser() || { name: "Student", handle: "@student" };
            showNexusToast(`⏳ Uploading ${file.name}...`);

            try {
                const media = await uploadMediaLive(file, (pct) => {
                    showNexusToast(`⏳ Uploading ${file.name} (${pct}%)...`);
                });

                const msgPayload = {
                    id: "dm_" + Date.now(),
                    sender: me.name,
                    handle: me.handle,
                    mode: mode,
                    mediaType: media.type,
                    fileName: media.name,
                    dataUrl: media.dataUrl || null,
                    chunkedId: media.chunkedId || null,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    timestamp: Date.now()
                };

                // Broadcast to Firebase so BOTH users see it live without refreshing!
                if (window.firebase && firebase.database) {
                    firebase.database().ref("nexus_live_dm_media").push(msgPayload);
                } else {
                    appendDMMediaBubble(msgPayload);
                }
                showNexusToast("✅ Sent Successfully!");
            } catch (err) {
                alert("⚠️ " + err.message);
            }
        };
        picker.click();
    }

    function appendDMMediaBubble(m) {
        if (document.getElementById("bubble_" + m.id)) return;
        const msgInput = document.querySelector("input[placeholder*='Message']");
        if (!msgInput) return;
        const chatContainer = msgInput.closest("div").parentElement;
        if (!chatContainer) return;

        const bubble = document.createElement("div");
        bubble.id = "bubble_" + m.id;
        bubble.style.cssText = "background:#065f46;color:#fff;padding:12px;border-radius:14px;margin:8px 14px;max-width:78%;margin-left:auto;box-shadow:0 4px 12px rgba(0,0,0,0.3);";

        let inner = "";
        if (m.mode === "View-Once") {
            inner = `<button onclick="this.outerHTML='<img src=\\'${m.dataUrl}\\' style=\\'width:100%;border-radius:10px;\\'>'" style="background:#10b981;color:#000;border:none;padding:10px 14px;border-radius:10px;font-weight:800;cursor:pointer;">1️⃣ Tap to View Once (${m.fileName})</button>`;
        } else if (m.mediaType === "image" && m.dataUrl) {
            inner = `<img src="${m.dataUrl}" style="width:100%;max-height:260px;border-radius:10px;object-fit:cover;">`;
        } else if (m.mediaType === "video") {
            if (m.dataUrl) {
                inner = `<video src="${m.dataUrl}" controls playsinline style="width:100%;max-height:260px;border-radius:10px;background:#000;"></video>`;
            } else {
                const vidId = "dmv_" + m.id;
                inner = `<div id="${vidId}"><button onclick="window.playChunkedNexusMedia('${m.chunkedId}','${vidId}')" style="background:#3b82f6;color:#fff;border:none;padding:10px 14px;border-radius:10px;font-weight:700;">▶️ Play 20MB Video (${m.fileName})</button></div>`;
            }
        } else {
            const dlId = "dmf_" + m.id;
            inner = m.dataUrl
                ? `<a href="${m.dataUrl}" download="${m.fileName}" style="color:#fff;font-weight:700;text-decoration:underline;">📄 Download ${m.fileName}</a>`
                : `<div id="${dlId}"><button onclick="window.playChunkedNexusMedia('${m.chunkedId}','${dlId}')" style="background:#4f46e5;color:#fff;border:none;padding:8px 12px;border-radius:8px;font-weight:700;">📥 Open ${m.fileName}</button></div>`;
        }

        bubble.innerHTML = `<div style="font-size:11px;color:#a7f3d0;margin-bottom:4px;font-weight:700;">${m.sender} (${m.handle})</div>${inner}<div style="font-size:10px;text-align:right;margin-top:4px;opacity:0.8;">${m.time} ✓✓</div>`;
        chatContainer.insertBefore(bubble, msgInput.closest("div"));
    }

    // Listen for live DM media in real-time without refresh
    if (window.firebase && firebase.database) {
        firebase.database().ref("nexus_live_dm_media").limitToLast(10).on("child_added", (snap) => {
            const val = snap.val();
            if (val && Date.now() - val.timestamp < 300000) appendDMMediaBubble(val);
        });
    }

    // --- 6. YOUTUBE WATCH PARTY (100% SEARCH + 2-MOBILE ZERO-REFRESH SYNC) ---
    window.openNexusWatchParty = function(customRoom) {
        const old = document.getElementById("nx-wp-modal");
        if (old) old.remove();

        const me = getRealUser() || { name: "Member" };
        const room = customRoom || localStorage.getItem("nx_wp_room") || "NEXUS_PARTY_1";
        localStorage.setItem("nx_wp_room", room);

        const modal = document.createElement("div");
        modal.id = "nx-wp-modal";
        modal.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:#090d16;color:#fff;display:flex;flex-direction:column;font-family:system-ui,sans-serif;";
        modal.innerHTML = `
            <div style="background:#111827;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #1f2937;">
                <div>
                    <div style="font-weight:800;font-size:16px;color:#f43f5e;">▶️ Live YouTube Watch Party & Song Sync</div>
                    <div style="font-size:11px;color:#34d399;">Room: <b>${room}</b> • Real-Time Sync Active</div>
                </div>
                <div style="display:flex;gap:8px;">
                    <button id="nx-wp-room-btn" style="background:#1e293b;color:#60a5fa;border:1px solid #3b82f6;border-radius:8px;padding:5px 10px;font-size:12px;font-weight:700;">Room ID</button>
                    <button id="nx-wp-close" style="background:#ef4444;color:#fff;border:none;border-radius:8px;padding:5px 12px;font-weight:800;">✕</button>
                </div>
            </div>
            <div style="padding:10px 14px;background:#0f172a;display:flex;gap:8px;border-bottom:1px solid #1e293b;">
                <input id="nx-wp-q" type="text" placeholder="Search any Song, Video or paste YouTube Link..." style="flex:1;background:#1e293b;border:1px solid #334155;color:#fff;padding:10px 12px;border-radius:10px;font-size:13px;outline:none;">
                <button id="nx-wp-search-btn" style="background:#e11d48;color:#fff;border:none;padding:0 16px;border-radius:10px;font-weight:700;">🔍 Search</button>
            </div>
            <div id="nx-wp-results" style="display:none;max-height:190px;overflow-y:auto;background:#111827;padding:8px 14px;border-bottom:2px solid #e11d48;"></div>
            <div style="background:#000;width:100%;height:230px;">
                <iframe id="nx-wp-iframe" width="100%" height="100%" src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&playsinline=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
            </div>
            <div id="nx-wp-status" style="background:#111827;padding:8px 14px;font-size:12px;color:#38bdf8;border-bottom:1px solid #1f2937;">
                ⚡ Connected: Jo video aap play karenge, wahi dost ke phone mein bina refresh kiye chalega!
            </div>
            <div id="nx-wp-chat" style="flex:1;padding:12px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;"></div>
            <div style="padding:10px 14px;background:#111827;display:flex;gap:8px;border-top:1px solid #1f2937;">
                <input id="nx-wp-msg" type="text" placeholder="Live Watch Party Chat..." style="flex:1;background:#1f2937;border:1px solid #374151;color:#fff;padding:10px 12px;border-radius:10px;font-size:13px;outline:none;">
                <button id="nx-wp-send" style="background:#4f46e5;color:#fff;border:none;padding:0 16px;border-radius:10px;font-weight:700;">Send</button>
            </div>
        `;
        document.body.appendChild(modal);

        let activeVid = "jfKfPfyJRdk";
        const iframe = document.getElementById("nx-wp-iframe");
        const resBox = document.getElementById("nx-wp-results");
        const chatBox = document.getElementById("nx-wp-chat");

        function playAndSync(vid, title) {
            activeVid = vid;
            iframe.src = `https://www.youtube.com/embed/${vid}?autoplay=1&playsinline=1`;
            resBox.style.display = "none";
            if (window.firebase && firebase.database) {
                firebase.database().ref("watchparty_rooms/" + room + "/state").set({
                    videoId: vid, title: title || "Video", by: me.name, time: Date.now()
                });
            }
        }

        if (window.firebase && firebase.database) {
            const rRef = firebase.database().ref("watchparty_rooms/" + room);
            rRef.child("state").on("value", (s) => {
                const d = s.val();
                if (d && d.videoId && d.videoId !== activeVid) {
                    activeVid = d.videoId;
                    iframe.src = `https://www.youtube.com/embed/${d.videoId}?autoplay=1&playsinline=1`;
                    document.getElementById("nx-wp-status").innerText = `🎵 ${d.by} played: ${d.title}`;
                }
            });
            rRef.child("messages").limitToLast(25).on("child_added", (s) => {
                const m = s.val();
                if (!m) return;
                chatBox.innerHTML += `<div style="background:#1e293b;padding:8px 12px;border-radius:10px;font-size:13px;"><b style="color:#60a5fa;">${m.sender}:</b> ${m.text}</div>`;
                chatBox.scrollTop = chatBox.scrollHeight;
            });
        }

        async function doSearch(q) {
            if (!q.trim()) return;
            const match = q.match(/(?:v=|youtu\.be\/|embed\/)([^"&?\/\s]{11})/);
            if (match && match[1]) return playAndSync(match[1], "YouTube Link");

            resBox.style.display = "block";
            resBox.innerHTML = `<div style="color:#60a5fa;padding:8px;font-size:13px;">🔍 Searching "${q}"...</div>`;

            const apis = [
                `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(q)}&filter=videos`,
                `https://inv.tux.pizza/api/v1/search?q=${encodeURIComponent(q)}&type=video`
            ];
            for (const url of apis) {
                try {
                    const r = await fetch(url);
                    if (!r.ok) continue;
                    const data = await r.json();
                    const list = data.items || data;
                    if (Array.isArray(list) && list.length > 0) {
                        resBox.innerHTML = list.slice(0, 7).map(it => {
                            const vId = it.videoId || (it.url ? it.url.split("v=")[1] : "");
                            const t = (it.title || "Video").replace(/"/g, "");
                            if (!vId) return "";
                            return `<div class="wp-item" data-v="${vId}" data-t="${t}" style="display:flex;align-items:center;gap:10px;padding:8px;border-bottom:1px solid #1e293b;cursor:pointer;">
                                <img src="https://i.ytimg.com/vi/${vId}/mqdefault.jpg" style="width:60px;height:40px;border-radius:6px;object-fit:cover;">
                                <div style="flex:1;font-size:13px;font-weight:600;">${t}</div>
                                <span style="background:#e11d48;padding:4px 8px;border-radius:6px;font-size:11px;font-weight:700;">Play</span>
                            </div>`;
                        }).join("");
                        resBox.querySelectorAll(".wp-item").forEach(el => {
                            el.onclick = () => playAndSync(el.dataset.v, el.dataset.t);
                        });
                        return;
                    }
                } catch (e) {}
            }
        }

        document.getElementById("nx-wp-search-btn").onclick = () => doSearch(document.getElementById("nx-wp-q").value);
        document.getElementById("nx-wp-q").onkeydown = (e) => { if (e.key === "Enter") doSearch(e.target.value); };
        document.getElementById("nx-wp-close").onclick = () => modal.remove();
        document.getElementById("nx-wp-room-btn").onclick = () => {
            const nr = prompt("Enter Shared Room ID:", room);
            if (nr && nr.trim()) window.openNexusWatchParty(nr.trim().toUpperCase());
        };
        document.getElementById("nx-wp-send").onclick = () => {
            const inp = document.getElementById("nx-wp-msg");
            if (!inp.value.trim()) return;
            if (window.firebase && firebase.database) {
                firebase.database().ref("watchparty_rooms/" + room + "/messages").push({ sender: me.name, text: inp.value.trim() });
            }
            inp.value = "";
        };
    };

    // --- 7. OFFICIAL NEXUS AI (STRICTLY NEXUS INFO, OWNER MOHIT & LIVE SERVER STATUS) ---
    window.openNexusOfficialAI = function() {
        const old = document.getElementById("nx-official-ai-modal");
        if (old) old.remove();

        const defaultStat = "🟢 Sabhi Nexus Servers (1:1 DM, Watch Party, Study Vault & Feed) 100% Online hain! Agar koi feature update ho raha ho toh kripya thoda patience rakhein.";
        const modal = document.createElement("div");
        modal.id = "nx-official-ai-modal";
        modal.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:#090d16;color:#fff;display:flex;flex-direction:column;font-family:system-ui,sans-serif;";
        modal.innerHTML = `
            <div style="background:#111827;padding:15px 18px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #1f2937;">
                <div>
                    <div style="font-weight:800;font-size:17px;color:#60a5fa;">🤖 Nexus Official AI</div>
                    <div style="font-size:11px;color:#34d399;">● Strictly Nexus Platform & Live Server Assistant</div>
                </div>
                <button id="nx-ai-close-btn" style="background:#ef4444;color:#fff;border:none;padding:6px 12px;border-radius:8px;font-weight:800;">✕</button>
            </div>
            <div id="nx-ai-body" style="flex:1;padding:16px;overflow-y:auto;display:flex;flex-direction:column;gap:12px;">
                <div style="background:#1e293b;border-left:4px solid #6366f1;padding:14px;border-radius:12px;font-size:14px;line-height:1.6;">
                    👋 <b>Namaste! Main Nexus Official AI hoon.</b><br>
                    Main sirf <b>Nexus Website</b> ke features, Server Status aur Owner ki jankari deta hoon.<br><br>
                    👑 <b>Founder & Owner:</b> Mohit (<code>@mohit_01</code>)<br>
                    📡 <b>Live Server Status:</b> <span id="nx-live-ai-stat">${localStorage.getItem("nexus_server_status") || defaultStat}</span>
                </div>
            </div>
            <div style="padding:12px 14px;background:#111827;display:flex;gap:8px;border-top:1px solid #1f2937;">
                <input id="nx-ai-in" type="text" placeholder="Nexus Owner, Server Status ya Features puchein..." style="flex:1;background:#1f2937;border:1px solid #374151;color:#fff;padding:12px;border-radius:10px;outline:none;">
                <button id="nx-ai-ask" style="background:#4f46e5;color:#fff;border:none;padding:0 18px;border-radius:10px;font-weight:800;">Ask</button>
            </div>
        `;
        document.body.appendChild(modal);

        // Live sync server status from Firebase without refresh
        if (window.firebase && firebase.database) {
            firebase.database().ref("nexus_system/server_status").on("value", (s) => {
                if (s.val()) {
                    localStorage.setItem("nexus_server_status", s.val());
                    const el = document.getElementById("nx-live-ai-stat");
                    if (el) el.innerText = s.val();
                }
            });
        }

        const body = document.getElementById("nx-ai-body");
        const inp = document.getElementById("nx-ai-in");
        document.getElementById("nx-ai-close-btn").onclick = () => modal.remove();

        const sendQ = () => {
            const val = inp.value.trim();
            if (!val) return;
            body.innerHTML += `<div style="align-self:flex-end;background:#4f46e5;padding:10px 14px;border-radius:12px;font-size:14px;">${val}</div>`;
            inp.value = "";
            const q = val.toLowerCase();
            let reply = "ℹ️ Main <b>Nexus Official AI</b> hoon aur sirf <b>Nexus Website</b> ki jankari deta hoon.<br>👑 <b>Owner:</b> Mohit (<code>@mohit_01</code>)<br>📡 <b>Status:</b> " + (localStorage.getItem("nexus_server_status") || defaultStat);

            if (q.startsWith("status:")) {
                const newSt = val.substring(7).trim();
                localStorage.setItem("nexus_server_status", newSt);
                if (window.firebase && firebase.database) firebase.database().ref("nexus_system/server_status").set(newSt);
                reply = "✅ <b>Live Status Updated!</b> Bina refresh kiye sabhi users ko ab yeh dikhega:<br>" + newSt;
            } else if (q.includes("owner") || q.includes("founder") || q.includes("mohit") || q.includes("kisne")) {
                reply = "👑 <b>Nexus Official Owner:</b> Nexus Platform ke Founder aur Developer <b>Mohit</b> (<code>@mohit_01</code>) hain.";
            } else if (q.includes("down") || q.includes("server") || q.includes("status") || q.includes("problem")) {
                reply = "📡 <b>Live Server Report:</b> " + (localStorage.getItem("nexus_server_status") || defaultStat) + "<br><br>🙏 Kripya patience rakhein, Nexus team har update real-time mein karti hai!";
            }
            setTimeout(() => {
                body.innerHTML += `<div style="align-self:flex-start;background:#1e293b;border-left:4px solid #38bdf8;padding:12px 14px;border-radius:12px;font-size:14px;line-height:1.5;">${reply}</div>`;
                body.scrollTop = body.scrollHeight;
            }, 150);
        };
        document.getElementById("nx-ai-ask").onclick = sendQ;
        inp.onkeydown = (e) => { if (e.key === "Enter") sendQ(); };
    };

    // --- 8. PWA APP INSTALLER ---
    let deferredPrompt = null;
    window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredPrompt = e; });
    window.installNexusPWA = async function() {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            deferredPrompt = null;
        } else {
            alert("📲 App Install karne ke liye Browser ke 3-dots (⋮) par tap karein aur 'Add to Home screen' ya 'Install app' chunein!");
        }
    };

    // --- 9. MASTER CLICK INTERCEPTOR ---
    document.addEventListener("click", function(e) {
        const el = e.target.closest("button, a, div, span");
        if (!el) return;
        const txt = (el.innerText || "").trim();

        if (txt === "AI" || txt.includes("🤖 AI") || txt === "Ask 1:1" || txt === "Ask AI") {
            e.preventDefault(); e.stopPropagation();
            window.openNexusOfficialAI();
        } else if (txt === "App" || txt.includes("📲 App")) {
            e.preventDefault(); e.stopPropagation();
            window.installNexusPWA();
        } else if (txt === "Watch TV" || txt === "Full Song" || txt.includes("Watch TV") || txt.includes("Full Song")) {
            e.preventDefault(); e.stopPropagation();
            window.openNexusWatchParty();
        } else if (txt === "Photo" || txt.includes("📷\nPhoto")) {
            e.preventDefault(); e.stopPropagation();
            sendLiveDMMedia("Photo");
        } else if (txt === "View-Once" || txt.includes("View-Once")) {
            e.preventDefault(); e.stopPropagation();
            sendLiveDMMedia("View-Once");
        } else if (txt === "PDF/File" || txt.includes("PDF/File")) {
            e.preventDefault(); e.stopPropagation();
            sendLiveDMMedia("PDF/File");
        }
    }, true);
})();
