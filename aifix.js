/* ============================================================================
   NEXUS MASTER LIVE ENGINE (ZERO-REFRESH AUTO-SYNC, PROFILE MESSAGE & FOLLOW FIX,
   INSTANT CLOUD POST 20MB VIDEO BOX, 1:1 DM MEDIA, WATCH PARTY & OFFICIAL AI)
   ============================================================================ */

(function() {
    if (window.__NEXUS_LIVE_ENGINE_V6__) return;
    window.__NEXUS_LIVE_ENGINE_V6__ = true;

    // 0. NETLIFY REDIRECT
    if (window.location.hostname.includes("netlify.app")) {
        window.location.replace("https://nexus-community01.vercel.app");
        return;
    }

    // 1. ZERO-REFRESH LIVE HOT-UPDATER (Live users get updates without refreshing)
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.update()));
    }

    function showToast(msg) {
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

    function getCurrentMember() {
        const keys = ["nexus_user", "currentUser", "nx_user", "user"];
        for (const k of keys) {
            try {
                const u = JSON.parse(localStorage.getItem(k));
                if (u && (u.name || u.username || u.handle)) {
                    const clean = (u.handle || u.username || u.name).replace(/^@/, "");
                    return {
                        uid: u.uid || clean,
                        name: u.name || clean,
                        username: clean,
                        handle: "@" + clean,
                        stream: u.stream || u.bio || "IIT-JEE Aspirant",
                        avatar: u.avatar || u.photoURL || ""
                    };
                }
            } catch (e) {}
        }
        return { uid: "mohiy", name: "Mohit_01", username: "mohiy", handle: "@mohiy", stream: "IIT-JEE Aspirant", avatar: "" };
    }

    // =========================================================================
    // 2. LIVE UI ENHANCER: MEMBER PROFILE ("💬 Message" + Fast Follow) &
    //    INSTANT CLOUD POST ("🎥 Upload Video <20MB") — Runs automatically!
    // =========================================================================
    function syncLiveModals() {
        // A. FIX "Member Full Profile" Modal (Add 💬 Message button & Instant Follow)
        document.querySelectorAll("button, div").forEach(el => {
            if (el.children.length > 1) return;
            const txt = (el.innerText || "").trim();

            if ((txt === "+ Follow" || txt === "Following" || txt === "✓ Following") && !el.dataset.nxProfileFixed) {
                // Walk up 4 levels to check if this button is inside Member Full Profile
                let container = el.parentElement;
                for (let i = 0; i < 5 && container; i++) {
                    const cText = container.innerText || "";
                    if (cText.includes("Member Full Profile") || cText.includes("Followers") || cText.includes("SHARED POSTS")) {
                        el.dataset.nxProfileFixed = "true";

                        // Extract @handle & Name from profile card
                        const handleMatch = cText.match(/@([a-zA-Z0-9_]+)/);
                        const targetHandle = handleMatch ? handleMatch[1] : "member";

                        // 1. Make "+ Follow" button work in 0.01s without lag
                        el.addEventListener("click", function(ev) {
                            const me = getCurrentMember();
                            const followKey = "nx_follow_" + me.username + "_" + targetHandle;
                            const isFollowing = localStorage.getItem(followKey) === "true" || el.innerText.includes("Following");

                            if (!isFollowing) {
                                localStorage.setItem(followKey, "true");
                                el.innerText = "✓ Following";
                                el.style.background = "#059669";
                                showToast("✅ You are now following @" + targetHandle);
                            } else {
                                localStorage.setItem(followKey, "false");
                                el.innerText = "+ Follow";
                                el.style.background = "#2563eb";
                                showToast("Unfollowed @" + targetHandle);
                            }

                            // Update Followers number on screen immediately without refresh
                            container.querySelectorAll("div, span, b, strong").forEach(node => {
                                if (node.children.length === 0 && (node.parentElement.innerText || "").includes("Followers")) {
                                    const num = parseInt(node.innerText, 10);
                                    if (!isNaN(num)) {
                                        node.innerText = !isFollowing ? (num + 1) : Math.max(0, num - 1);
                                    }
                                }
                            });
                        });

                        // 2. Inject "💬 Direct Message" button right below "+ Follow"
                        if (!container.querySelector(".nx-injected-dm-btn")) {
                            const dmBtn = document.createElement("button");
                            dmBtn.type = "button";
                            dmBtn.className = "nx-injected-dm-btn";
                            dmBtn.innerHTML = `💬 Direct Message (@${targetHandle})`;
                            dmBtn.style.cssText = `
                                width: 100%;
                                margin-top: 10px;
                                background: linear-gradient(90deg, #10b981, #059669);
                                color: #ffffff;
                                border: none;
                                border-radius: 12px;
                                padding: 12px;
                                font-weight: 800;
                                font-size: 14px;
                                cursor: pointer;
                                display: block;
                                text-align: center;
                                box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
                            `;
                            dmBtn.onclick = function(e) {
                                e.preventDefault();
                                e.stopPropagation();
                                // Close Member Full Profile modal
                                container.querySelectorAll("button, div, span").forEach(b => {
                                    const bt = (b.innerText || "").trim();
                                    if (bt === "✕" || bt === "×" || bt === "X") b.click();
                                });
                                open1on1DMWithUser(targetHandle);
                            };
                            el.insertAdjacentElement("afterend", dmBtn);
                        }
                        break;
                    }
                    container = container.parentElement;
                }
            }
        });

        // B. FIX "Instant Cloud Post" Modal (Add 🎥 20MB Video Upload Box & Live Post Handler)
        document.querySelectorAll("div, label").forEach(box => {
            const bText = (box.innerText || "").trim();
            if (bText.includes("Tap to Upload Photo / Doubt Image") && !box.dataset.nxVideoBoxAdded && box.children.length <= 4) {
                box.dataset.nxVideoBoxAdded = "true";

                // Create dedicated 20MB Video Upload Box right below the Photo box
                const videoBox = document.createElement("div");
                videoBox.id = "nx-post-video-box";
                videoBox.style.cssText = `
                    margin-top: 10px;
                    border: 1.5px dashed #ec4899;
                    background: rgba(236, 72, 153, 0.08);
                    border-radius: 14px;
                    padding: 14px;
                    text-align: center;
                    cursor: pointer;
                    color: #f472b6;
                    font-weight: 700;
                    font-size: 13px;
                `;
                videoBox.innerHTML = `
                    <div style="font-size:20px;margin-bottom:4px;">🎥</div>
                    <div>Tap to Upload Video (Up to 20MB)</div>
                    <div id="nx-video-post-status" style="font-size:11px;color:#94a3b8;margin-top:3px;">MP4 / WebM • Instant Live Feed Player</div>
                    <div id="nx-video-post-preview" style="margin-top:8px;"></div>
                `;

                videoBox.onclick = function() {
                    const vInput = document.createElement("input");
                    vInput.type = "file";
                    vInput.accept = "video/*";
                    vInput.onchange = async (ev) => {
                        const file = ev.target.files[0];
                        if (!file) return;
                        if (file.size > 20 * 1024 * 1024) {
                            alert("⚠️ Video 20MB se bada hai! Kripya 20MB se kam ka video select karein.");
                            return;
                        }
                        const statEl = document.getElementById("nx-video-post-status");
                        const prevEl = document.getElementById("nx-video-post-preview");
                        statEl.innerText = `⏳ Uploading ${file.name} (0%)...`;

                        try {
                            const media = await upload20MBMedia(file, (pct) => {
                                statEl.innerText = `⏳ Uploading ${file.name} (${pct}%)...`;
                            });
                            window.__NX_PENDING_POST_VIDEO__ = media;
                            statEl.innerHTML = `<span style="color:#34d399;">✅ Video Ready: ${file.name} (${(file.size/1024/1024).toFixed(1)} MB)</span>`;
                            const localBlobUrl = URL.createObjectURL(file);
                            prevEl.innerHTML = `<video src="${localBlobUrl}" controls playsinline style="width:100%;max-height:180px;border-radius:10px;background:#000;"></video>`;

                            // Publish video post button inside the box for 1-tap instant posting
                            const pubBtn = document.createElement("button");
                            pubBtn.type = "button";
                            pubBtn.innerHTML = "🚀 Publish Video Post Now";
                            pubBtn.style.cssText = "margin-top:10px;width:100%;background:linear-gradient(90deg,#ec4899,#6366f1);color:#fff;border:none;padding:11px;border-radius:10px;font-weight:800;font-size:14px;cursor:pointer;";
                            pubBtn.onclick = (e) => {
                                e.stopPropagation();
                                publishRealMemberVideoPost(box.closest("div[style*='fixed'], .modal, div"));
                            };
                            prevEl.appendChild(pubBtn);
                        } catch (err) {
                            statEl.innerText = "⚠️ " + err.message;
                        }
                    };
                    vInput.click();
                };

                box.insertAdjacentElement("afterend", videoBox);
            }
        });
    }

    // Run lightweight modal check every 450ms so any opened modal gets updated instantly without lag
    setInterval(syncLiveModals, 450);

    // =========================================================================
    // 3. PUBLISH INSTAGRAM-STYLE REAL MEMBER VIDEO/PHOTO POST (ZERO REFRESH)
    // =========================================================================
    async function publishRealMemberVideoPost(modalRoot) {
        const me = getCurrentMember();
        const media = window.__NX_PENDING_POST_VIDEO__;
        if (!media) return;

        let caption = "";
        const txtArea = document.querySelector("textarea[placeholder*='Write your question'], textarea");
        if (txtArea) caption = txtArea.value.trim();

        const postObj = {
            id: "nxpost_" + Date.now(),
            authorName: me.name,
            authorHandle: me.handle,
            authorStream: me.stream,
            authorAvatar: me.avatar,
            text: caption || "🎥 Shared a new video on Nexus",
            mediaType: media.type,
            videoDataUrl: media.dataUrl || null,
            chunkedId: media.chunkedId || null,
            fileName: media.name,
            likes: 1,
            timestamp: Date.now()
        };

        window.__NX_PENDING_POST_VIDEO__ = null;

        // Broadcast to Firebase so ALL online users see the post immediately without refreshing!
        if (window.firebase && firebase.database) {
            try {
                await firebase.database().ref("nexus_live_video_posts").push(postObj);
            } catch (e) {}
        }

        renderLiveVideoPostInFeed(postObj);
        showToast("🚀 Video Post Shared Live!");

        // Close the Instant Cloud Post modal
        if (modalRoot) {
            modalRoot.querySelectorAll("button, div, span").forEach(b => {
                const t = (b.innerText || "").trim();
                if (t === "✕" || t === "×" || t === "X") b.click();
            });
        }
    }

    function renderLiveVideoPostInFeed(p) {
        if (document.getElementById("feed_card_" + p.id)) return;

        // Find the first post card in the feed and insert right above it
        let targetFeed = null;
        document.querySelectorAll("div").forEach(d => {
            if (!targetFeed && (d.innerText || "").includes("PINNED") && d.offsetWidth > 250 && d.offsetHeight < 500) {
                targetFeed = d.parentElement;
            }
        });
        if (!targetFeed) targetFeed = document.querySelector("main") || document.body;

        const card = document.createElement("div");
        card.id = "feed_card_" + p.id;
        card.style.cssText = `
            background: #0f172a;
            border: 1.5px solid #10b981;
            border-radius: 20px;
            padding: 16px;
            margin: 12px 14px;
            color: #ffffff;
            font-family: system-ui, sans-serif;
            box-shadow: 0 8px 25px rgba(0,0,0,0.4);
        `;

        const initial = (p.authorName || "M").charAt(0).toUpperCase();
        const vidContainerId = "feed_vid_" + p.id;
        const mediaHtml = p.videoDataUrl
            ? `<video src="${p.videoDataUrl}" controls playsinline style="width:100%;max-height:360px;border-radius:14px;margin-top:12px;background:#000;"></video>`
            : `<div id="${vidContainerId}" style="margin-top:12px;">
                 <button onclick="window.playNexusChunkedMedia('${p.chunkedId}','${vidContainerId}')" style="width:100%;background:linear-gradient(90deg,#2563eb,#7c3aed);color:#fff;border:none;padding:14px;border-radius:12px;font-weight:800;font-size:14px;cursor:pointer;">
                    ▶️ Play Video (${p.fileName || 'Cloud Video'})
                 </button>
               </div>`;

        card.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:42px;height:42px;border-radius:50%;background:#059669;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:17px;">
                    ${p.authorAvatar ? `<img src="${p.authorAvatar}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : initial}
                </div>
                <div>
                    <div style="font-weight:800;font-size:15px;display:flex;align-items:center;gap:5px;">
                        ${p.authorName} <span style="background:#10b981;color:#000;font-size:10px;padding:1px 5px;border-radius:50%;">✔</span>
                    </div>
                    <div style="font-size:12px;color:#34d399;">${p.authorHandle} • ${p.authorStream} • Just now</div>
                </div>
            </div>
            <div style="margin-top:12px;font-size:15px;line-height:1.5;color:#f1f5f9;">${p.text}</div>
            ${mediaHtml}
        `;

        targetFeed.prepend(card);
    }

    // Real-time listener so all online users see new video posts without refreshing
    if (window.firebase && firebase.database) {
        firebase.database().ref("nexus_live_video_posts").limitToLast(10).on("child_added", (snap) => {
            const p = snap.val();
            if (p) setTimeout(() => renderLiveVideoPostInFeed(p), 500);
        });
    }

    // =========================================================================
    // 4. OPEN 1:1 DM WITH SPECIFIC USER FROM PROFILE
    // =========================================================================
    function open1on1DMWithUser(handle) {
        if (window.Nexus && typeof window.Nexus.openDM === "function") {
            window.Nexus.openDM(handle);
            return;
        }
        // Switch to 2nd bottom nav icon (Chat/DM section)
        const navBtns = document.querySelectorAll(".nx-nav-item, nav button, footer button");
        if (navBtns.length >= 2) navBtns[1].click();

        setTimeout(() => {
            // Open the 1:1 Personal DM modal
            document.querySelectorAll("button, div").forEach(el => {
                if ((el.innerText || "").trim() === "Open" && el.children.length === 0) el.click();
            });
            setTimeout(() => {
                // Click the matching user row inside 1:1 Personal DM list
                document.querySelectorAll("div, button").forEach(row => {
                    const rt = (row.innerText || "").toLowerCase();
                    if (rt.includes("@" + handle.toLowerCase()) && rt.includes("chat")) {
                        const chatBtn = row.querySelector("button") || row;
                        chatBtn.click();
                    }
                });
                showToast("💬 1:1 Chat Opened with @" + handle);
            }, 300);
        }, 250);
    }

    // =========================================================================
    // 5. 20MB VIDEO, PHOTO & PDF CHUNKED UPLOADER (FOR 1:1 DM & POSTS)
    // =========================================================================
    async function upload20MBMedia(file, onProg) {
        if (file.size > 20 * 1024 * 1024) {
            throw new Error("File 20MB se badi hai! Kripya 20MB se chota video ya file chunein.");
        }

        if (file.type.startsWith("image/")) {
            onProg(50);
            return new Promise((resolve) => {
                if (window.Nexus && typeof window.Nexus.compressImage === "function") {
                    window.Nexus.compressImage(file, 900, 0.75, (url) => {
                        onProg(100);
                        resolve({ type: "image", name: file.name, dataUrl: url });
                    });
                } else {
                    const r = new FileReader();
                    r.onload = (e) => { onProg(100); resolve({ type: "image", name: file.name, dataUrl: e.target.result }); };
                    r.readAsDataURL(file);
                }
            });
        }

        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onprogress = (e) => {
                if (e.lengthComputable) onProg(Math.round((e.loaded / e.total) * 50));
            };
            r.onload = async (e) => {
                const base64 = e.target.result;
                const mType = file.type.startsWith("video/") ? "video" : "file";
                const mediaId = "nxm_" + Date.now();

                if (window.firebase && firebase.database) {
                    try {
                        const chunkSize = 240 * 1024;
                        const total = Math.ceil(base64.length / chunkSize);
                        const ref = firebase.database().ref("nexus_media_chunks/" + mediaId);
                        for (let i = 0; i < total; i++) {
                            await ref.child("c_" + i).set(base64.slice(i * chunkSize, (i + 1) * chunkSize));
                            onProg(50 + Math.round(((i + 1) / total) * 50));
                        }
                        await ref.child("meta").set({ totalChunks: total, mime: file.type, name: file.name });
                        resolve({ type: mType, name: file.name, chunkedId: mediaId, dataUrl: total <= 5 ? base64 : null });
                        return;
                    } catch (err) {}
                }
                onProg(100);
                resolve({ type: mType, name: file.name, dataUrl: base64 });
            };
            r.onerror = () => reject(new Error("File read error"));
            r.readAsDataURL(file);
        });
    }

    window.playNexusChunkedMedia = async function(mediaId, boxId) {
        const box = document.getElementById(boxId);
        if (!box || !window.firebase || !firebase.database) return;
        box.innerHTML = `<div style="padding:10px;color:#60a5fa;font-size:13px;">⏳ Loading Cloud Video...</div>`;
        try {
            const snap = await firebase.database().ref("nexus_media_chunks/" + mediaId).once("value");
            const val = snap.val();
            if (!val || !val.meta) return;
            let full = "";
            for (let i = 0; i < val.meta.totalChunks; i++) full += (val["c_" + i] || "");
            if ((val.meta.mime || "").startsWith("video/")) {
                box.innerHTML = `<video src="${full}" controls autoplay playsinline style="width:100%;max-height:340px;border-radius:12px;background:#000;"></video>`;
            } else {
                box.innerHTML = `<a href="${full}" download="${val.meta.name}" style="display:inline-block;background:#4f46e5;color:#fff;padding:8px 14px;border-radius:8px;text-decoration:none;font-weight:700;">📥 Download ${val.meta.name}</a>`;
            }
        } catch (e) {
            box.innerHTML = `<div style="color:#f87171;">⚠️ Failed to load media.</div>`;
        }
    };

    function sendDMMediaItem(mode) {
        const inp = document.createElement("input");
        inp.type = "file";
        inp.accept = (mode === "PDF/File") ? ".pdf,.doc,.docx,.txt,image/*,video/*" : "image/*,video/*";
        inp.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const me = getCurrentMember();
            showToast(`⏳ Uploading ${file.name} (0%)...`);
            try {
                const uploaded = await upload20MBMedia(file, (pct) => showToast(`⏳ Uploading ${file.name} (${pct}%)...`));
                const msg = {
                    id: "dm_" + Date.now(),
                    sender: me.name,
                    handle: me.handle,
                    mode: mode,
                    mediaType: uploaded.type,
                    fileName: uploaded.name,
                    dataUrl: uploaded.dataUrl || null,
                    chunkedId: uploaded.chunkedId || null,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    timestamp: Date.now()
                };
                if (window.firebase && firebase.database) {
                    firebase.database().ref("nexus_live_dm_stream").push(msg);
                }
                appendDMBubbleLive(msg);
                showToast("✅ Sent in Chat!");
            } catch (err) {
                alert("⚠️ " + err.message);
            }
        };
        inp.click();
    }

    function appendDMBubbleLive(m) {
        if (document.getElementById("dmb_" + m.id)) return;
        const msgInput = document.querySelector("input[placeholder*='Message']");
        if (!msgInput) return;
        const wrap = msgInput.closest("div").parentElement;
        if (!wrap) return;

        const b = document.createElement("div");
        b.id = "dmb_" + m.id;
        b.style.cssText = "background:#065f46;color:#fff;padding:12px;border-radius:14px;margin:8px 14px;max-width:78%;margin-left:auto;";
        let body = "";
        if (m.mode === "View-Once") {
            body = `<button onclick="this.outerHTML='<img src=\\'${m.dataUrl}\\' style=\\'width:100%;border-radius:10px;\\'>'" style="background:#10b981;color:#000;border:none;padding:10px 14px;border-radius:10px;font-weight:800;cursor:pointer;">1️⃣ Tap to View Once (${m.fileName})</button>`;
        } else if (m.mediaType === "image" && m.dataUrl) {
            body = `<img src="${m.dataUrl}" style="width:100%;max-height:260px;border-radius:10px;object-fit:cover;">`;
        } else if (m.mediaType === "video") {
            const vidId = "dmvid_" + m.id;
            body = m.dataUrl
                ? `<video src="${m.dataUrl}" controls playsinline style="width:100%;max-height:260px;border-radius:10px;background:#000;"></video>`
                : `<div id="${vidId}"><button onclick="window.playNexusChunkedMedia('${m.chunkedId}','${vidId}')" style="background:#3b82f6;color:#fff;border:none;padding:10px 14px;border-radius:10px;font-weight:700;">▶️ Play Video (${m.fileName})</button></div>`;
        } else {
            const fId = "dmfile_" + m.id;
            body = m.dataUrl
                ? `<a href="${m.dataUrl}" download="${m.fileName}" style="color:#fff;font-weight:700;text-decoration:underline;">📄 Download ${m.fileName}</a>`
                : `<div id="${fId}"><button onclick="window.playNexusChunkedMedia('${m.chunkedId}','${fId}')" style="background:#4f46e5;color:#fff;border:none;padding:8px 14px;border-radius:8px;font-weight:700;">📥 Open ${m.fileName}</button></div>`;
        }
        b.innerHTML = `<div style="font-size:11px;color:#a7f3d0;margin-bottom:4px;font-weight:700;">${m.sender} (${m.handle})</div>${body}<div style="font-size:10px;text-align:right;margin-top:4px;opacity:0.8;">${m.time} ✓✓</div>`;
        wrap.insertBefore(b, msgInput.closest("div"));
    }

    if (window.firebase && firebase.database) {
        firebase.database().ref("nexus_live_dm_stream").limitToLast(8).on("child_added", (s) => {
            const v = s.val();
            if (v && Date.now() - v.timestamp < 180000) appendDMBubbleLive(v);
        });
    }

    // =========================================================================
    // 6. OFFICIAL NEXUS AI (OWNER MOHIT @mohit_01 & LIVE SERVER STATUS)
    // =========================================================================
    window.openNexusOfficialAI = function() {
        const old = document.getElementById("nx-official-ai-popup");
        if (old) old.remove();

        const defStatus = "🟢 Sabhi Nexus Servers (1:1 DM, Watch Party, 20MB Video Post & Study Channels) 100% Online hain!";
        const pop = document.createElement("div");
        pop.id = "nx-official-ai-popup";
        pop.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:#090d16;color:#fff;display:flex;flex-direction:column;font-family:system-ui,sans-serif;";
        pop.innerHTML = `
            <div style="background:#111827;padding:15px 18px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #1f2937;">
                <div>
                    <div style="font-weight:800;font-size:17px;color:#60a5fa;">🤖 Nexus Official AI</div>
                    <div style="font-size:11px;color:#34d399;">● Strictly Nexus Platform & Server Status Assistant</div>
                </div>
                <button id="nx-ai-x" style="background:#ef4444;color:#fff;border:none;padding:6px 12px;border-radius:8px;font-weight:800;">✕</button>
            </div>
            <div id="nx-ai-msgs" style="flex:1;padding:16px;overflow-y:auto;display:flex;flex-direction:column;gap:12px;">
                <div style="background:#1e293b;border-left:4px solid #6366f1;padding:14px;border-radius:12px;font-size:14px;line-height:1.6;">
                    👋 <b>Namaste! Main Nexus Official AI hoon.</b><br>
                    Main sirf <b>Nexus Website</b> ke features, Server Status aur Owner ki jankari deta hoon.<br><br>
                    👑 <b>Founder & Owner:</b> Mohit (<code>@mohit_01</code>)<br>
                    📡 <b>Live Server Status:</b> <span id="nx-ai-live-st">${localStorage.getItem("nexus_server_status") || defStatus}</span>
                </div>
            </div>
            <div style="padding:12px 14px;background:#111827;display:flex;gap:8px;border-top:1px solid #1f2937;">
                <input id="nx-ai-inp" type="text" placeholder="Nexus Owner, Server Status ya Features puchein..." style="flex:1;background:#1f2937;border:1px solid #374151;color:#fff;padding:12px;border-radius:10px;outline:none;">
                <button id="nx-ai-go" style="background:#4f46e5;color:#fff;border:none;padding:0 18px;border-radius:10px;font-weight:800;">Ask</button>
            </div>
        `;
        document.body.appendChild(pop);
        document.getElementById("nx-ai-x").onclick = () => pop.remove();

        const box = document.getElementById("nx-ai-msgs");
        const inp = document.getElementById("nx-ai-inp");
        const ask = () => {
            const v = inp.value.trim();
            if (!v) return;
            box.innerHTML += `<div style="align-self:flex-end;background:#4f46e5;padding:10px 14px;border-radius:12px;font-size:14px;">${v}</div>`;
            inp.value = "";
            const q = v.toLowerCase();
            let ans = "ℹ️ Main <b>Nexus Official AI</b> hoon aur sirf <b>Nexus Website</b> ki jankari deta hoon.<br>👑 <b>Owner:</b> Mohit (<code>@mohit_01</code>)<br>📡 <b>Status:</b> " + (localStorage.getItem("nexus_server_status") || defStatus);
            if (q.startsWith("status:")) {
                const ns = v.substring(7).trim();
                localStorage.setItem("nexus_server_status", ns);
                if (window.firebase && firebase.database) firebase.database().ref("nexus_system/server_status").set(ns);
                ans = "✅ <b>Live Status Updated for All Online Users:</b><br>" + ns;
            } else if (q.includes("owner") || q.includes("mohit") || q.includes("founder")) {
                ans = "👑 <b>Nexus Owner:</b> Nexus Platform ke Founder aur Developer <b>Mohit</b> (<code>@mohit_01</code>) hain.";
            }
            setTimeout(() => {
                box.innerHTML += `<div style="align-self:flex-start;background:#1e293b;border-left:4px solid #38bdf8;padding:12px 14px;border-radius:12px;font-size:14px;">${ans}</div>`;
                box.scrollTop = box.scrollHeight;
            }, 150);
        };
        document.getElementById("nx-ai-go").onclick = ask;
        inp.onkeydown = (e) => { if (e.key === "Enter") ask(); };
    };

    // =========================================================================
    // 7. CLEAN CLICK ROUTER (NO TYPO, NO BLOCKING)
    // =========================================================================
    document.addEventListener("click", function(e) {
        if (!e.target || typeof e.target.closest !== "function") return;
        const btn = e.target.closest("button, a, div");
        if (!btn || btn.children.length > 3) return;

        const txt = (btn.innerText || "").trim();

        // Cloud Account Creation Fix
        if (txt === "Create Cloud Account" || txt === "Login Existing") {
            const card = btn.closest("div");
            if (!card) return;
            const inputs = card.querySelectorAll("input");
            if (inputs.length >= 2) {
                const vals = Array.from(inputs).map(i => i.value.trim());
                const name = vals[0];
                if (!name) return;
                const cleanId = (vals[1] || name).replace(/^@/, "").replace(/[.#$[\]\s]/g, "_");
                const stream = vals.length >= 4 ? (vals[2] || "IIT-JEE Aspirant") : "IIT-JEE Aspirant";
                const pass = (vals[vals.length - 1] || "1234") + "_nx26";
                const userObj = { uid: cleanId, id: cleanId, name: name, username: cleanId, handle: "@" + cleanId, stream: stream, bio: stream, password: pass, verified: true, online: true };

                localStorage.setItem("nexus_user", JSON.stringify(userObj));
                localStorage.setItem("currentUser", JSON.stringify(userObj));
                localStorage.setItem("nx_user", JSON.stringify(userObj));
                localStorage.setItem("nx_logged_in", "true");
                if (window.firebase && firebase.database) {
                    try { firebase.database().ref("users/" + cleanId).update(userObj); } catch (err) {}
                }
                setTimeout(() => {
                    showToast("✅ Account Ready! Welcome " + name);
                    if (window.Nexus && typeof window.Nexus.init === "function") {
                        try { window.Nexus.init(); } catch (err) {}
                    }
                    const homeBtn = document.querySelector(".nx-nav-item");
                    if (homeBtn) homeBtn.click();
                }, 350);
            }
        }
        // AI & DM Media Drawer Buttons
        else if (txt === "AI" || txt.includes("🤖 AI") || txt === "Ask 1:1" || txt === "Ask AI") {
            e.preventDefault();
            window.openNexusOfficialAI();
        } else if (txt === "Photo" || txt.endsWith("\nPhoto")) {
            e.preventDefault();
            sendDMMediaItem("Photo");
        } else if (txt === "View-Once" || txt.endsWith("View-Once")) {
            e.preventDefault();
            sendDMMediaItem("View-Once");
        } else if (txt === "PDF/File" || txt.endsWith("PDF/File")) {
            e.preventDefault();
            sendDMMediaItem("PDF/File");
        }
    });
})();
