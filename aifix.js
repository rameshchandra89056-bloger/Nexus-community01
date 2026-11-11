/* ============================================================================
   NEXUS V7 AESTHETIC & LIVE ENGINE
   - Instagram-Style Side-by-Side [+ Follow] & [💬 Message] Glass Buttons
   - Auto Cache Cleaner & Zero-Refresh Live Firebase Sync for Online Members
   - Clean 20MB Video Uploader (Post & 1:1 DM), Watch Party & Official AI
   ============================================================================ */

(function() {
    if (window.__NEXUS_V7_LOADED__) return;
    window.__NEXUS_V7_LOADED__ = true;

    // 1. OLD NETLIFY REDIRECT
    if (window.location.hostname.includes("netlify.app")) {
        window.location.replace("https://nexus-community01.vercel.app");
        return;
    }

    // 2. UNREGISTER STICKY SERVICE WORKERS SO UPDATES SHOW INSTANTLY
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
            regs.forEach(r => r.unregister());
        });
    }

    function showToast(msg) {
        if (window.Nexus && typeof window.Nexus.toast === "function") {
            window.Nexus.toast(msg);
        } else {
            const t = document.getElementById("nx-toast");
            if (t) {
                t.innerText = msg;
                t.style.display = "block";
                setTimeout(() => { t.style.display = "none"; }, 2200);
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
    // 3. AESTHETIC INSTAGRAM-STYLE PROFILE BUTTONS: [ + Follow ]  [ 💬 Message ]
    // =========================================================================
    function upgradeProfileAndPostModals() {
        // Remove any old ugly green message button if present
        document.querySelectorAll(".nx-injected-dm-btn, #nx-profile-msg-btn").forEach(el => el.remove());

        // Find "+ Follow" button inside Member Full Profile
        document.querySelectorAll("button").forEach(followBtn => {
            const txt = (followBtn.innerText || "").trim();
            if ((txt === "+ Follow" || txt === "Following" || txt === "✓ Following") && !followBtn.dataset.nxAestheticDone) {
                let modalCard = followBtn.parentElement;
                for (let i = 0; i < 5 && modalCard; i++) {
                    const cText = modalCard.innerText || "";
                    if (cText.includes("Member Full Profile") || cText.includes("SHARED POSTS")) {
                        followBtn.dataset.nxAestheticDone = "true";

                        const handleMatch = cText.match(/@([a-zA-Z0-9_]+)/);
                        const targetHandle = handleMatch ? handleMatch[1] : "member";

                        // Create sleek side-by-side row wrapper (Instagram Dark UI style)
                        const actionRow = document.createElement("div");
                        actionRow.className = "nx-insta-action-row";
                        actionRow.style.cssText = `
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 10px;
                            width: 100%;
                            margin-top: 10px;
                            margin-bottom: 6px;
                        `;

                        // Style the existing Follow button cleanly to fit left column
                        followBtn.parentNode.insertBefore(actionRow, followBtn);
                        actionRow.appendChild(followBtn);
                        followBtn.style.cssText = `
                            width: 100%;
                            height: 42px;
                            margin: 0;
                            background: linear-gradient(135deg, #2563eb, #4f46e5);
                            color: #ffffff;
                            border: none;
                            border-radius: 11px;
                            font-weight: 700;
                            font-size: 14px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
                            transition: all 0.2s ease;
                        `;

                        // Create sleek Dark Glass "Message" button for right column
                        const msgBtn = document.createElement("button");
                        msgBtn.type = "button";
                        msgBtn.innerHTML = `<span style="font-size:15px;margin-right:6px;">💬</span> Message`;
                        msgBtn.style.cssText = `
                            width: 100%;
                            height: 42px;
                            margin: 0;
                            background: rgba(30, 41, 59, 0.9);
                            color: #f8fafc;
                            border: 1px solid rgba(99, 102, 241, 0.45);
                            border-radius: 11px;
                            font-weight: 700;
                            font-size: 14px;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
                            transition: all 0.2s ease;
                        `;

                        // Fast Follow Toggle
                        followBtn.addEventListener("click", function() {
                            const me = getCurrentMember();
                            const fKey = "nx_flw_" + me.username + "_" + targetHandle;
                            const isFlw = localStorage.getItem(fKey) === "true" || followBtn.innerText.includes("Following");
                            if (!isFlw) {
                                localStorage.setItem(fKey, "true");
                                followBtn.innerText = "✓ Following";
                                followBtn.style.background = "#1e293b";
                                followBtn.style.border = "1px solid #334155";
                                showToast("✅ Following @" + targetHandle);
                            } else {
                                localStorage.setItem(fKey, "false");
                                followBtn.innerText = "+ Follow";
                                followBtn.style.background = "linear-gradient(135deg, #2563eb, #4f46e5)";
                                followBtn.style.border = "none";
                            }
                        });

                        // Direct Message Click Action
                        msgBtn.onclick = function(ev) {
                            ev.preventDefault();
                            ev.stopPropagation();
                            // Close profile modal cleanly
                            modalCard.querySelectorAll("button, div, span").forEach(b => {
                                const bt = (b.innerText || "").trim();
                                if (bt === "✕" || bt === "×" || bt === "X") b.click();
                            });
                            openDirectChatWith(targetHandle);
                        };

                        actionRow.appendChild(msgBtn);
                        break;
                    }
                    modalCard = modalCard.parentElement;
                }
            }
        });

        // Upgrade "Instant Cloud Post" modal to support both Photo & 20MB Video cleanly
        document.querySelectorAll("div, label").forEach(box => {
            const bText = (box.innerText || "").trim();
            if (bText.includes("Tap to Upload Photo / Doubt Image") && !box.dataset.nxMediaUpgraded && box.children.length <= 4) {
                box.dataset.nxMediaUpgraded = "true";

                // Make the upload card sleek and allow both Photo + 20MB Video
                const vidBtn = document.createElement("div");
                vidBtn.style.cssText = `
                    margin-top: 10px;
                    background: rgba(30, 41, 59, 0.75);
                    border: 1px dashed rgba(99, 102, 241, 0.5);
                    border-radius: 12px;
                    padding: 11px;
                    text-align: center;
                    color: #93c5fd;
                    font-weight: 700;
                    font-size: 13px;
                    cursor: pointer;
                `;
                vidBtn.innerHTML = `🎬 Upload Video (Up to 20MB) <span id="nx-vid-stat" style="display:block;font-size:11px;color:#64748b;font-weight:500;margin-top:2px;">Instant Feed Video Player</span>`;

                vidBtn.onclick = function() {
                    const inp = document.createElement("input");
                    inp.type = "file";
                    inp.accept = "video/*";
                    inp.onchange = async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        if (file.size > 20 * 1024 * 1024) {
                            alert("⚠️ Kripya 20MB se chota video select karein!");
                            return;
                        }
                        const st = document.getElementById("nx-vid-stat");
                        st.innerText = `⏳ Uploading ${file.name} (0%)...`;
                        try {
                            const media = await uploadMedia20MB(file, (pct) => {
                                st.innerText = `⏳ Uploading ${file.name} (${pct}%)...`;
                            });
                            st.innerHTML = `<span style="color:#34d399;">✅ Ready! Publishing Video Post...</span>`;
                            publishVideoToLiveFeed(media, box.closest("div[style*='fixed'], .modal, div"));
                        } catch (err) {
                            st.innerText = "⚠️ " + err.message;
                        }
                    };
                    inp.click();
                };
                box.insertAdjacentElement("afterend", vidBtn);
            }
        });
    }

    setInterval(upgradeProfileAndPostModals, 400);

    // =========================================================================
    // 4. OPEN 1:1 CHAT DIRECTLY FROM PROFILE MESSAGE BUTTON
    // =========================================================================
    function openDirectChatWith(handle) {
        if (window.Nexus && typeof window.Nexus.openDM === "function") {
            window.Nexus.openDM(handle);
            return;
        }
        const navs = document.querySelectorAll(".nx-nav-item, nav button, footer button");
        if (navs.length >= 2) navs[1].click();
        setTimeout(() => {
            document.querySelectorAll("button, div").forEach(el => {
                if ((el.innerText || "").trim() === "Open" && el.children.length === 0) el.click();
            });
            showToast("💬 Opening 1:1 Chat with @" + handle);
        }, 250);
    }

    // =========================================================================
    // 5. 20MB VIDEO & MEDIA UPLOAD ENGINE (LIVE FEED & 1:1 DM)
    // =========================================================================
    async function uploadMedia20MB(file, onProg) {
        if (file.size > 20 * 1024 * 1024) throw new Error("Max 20MB allowed");

        if (file.type.startsWith("image/")) {
            onProg(60);
            return new Promise((res) => {
                if (window.Nexus && typeof window.Nexus.compressImage === "function") {
                    window.Nexus.compressImage(file, 900, 0.75, (url) => {
                        onProg(100);
                        res({ type: "image", name: file.name, dataUrl: url });
                    });
                } else {
                    const r = new FileReader();
                    r.onload = (e) => { onProg(100); res({ type: "image", name: file.name, dataUrl: e.target.result }); };
                    r.readAsDataURL(file);
                }
            });
        }

        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onprogress = (e) => { if (e.lengthComputable) onProg(Math.round((e.loaded / e.total) * 50)); };
            r.onload = async (e) => {
                const b64 = e.target.result;
                const mType = file.type.startsWith("video/") ? "video" : "file";
                const mId = "nxm_" + Date.now();
                if (window.firebase && firebase.database) {
                    try {
                        const cSize = 240 * 1024;
                        const total = Math.ceil(b64.length / cSize);
                        const ref = firebase.database().ref("nexus_media_chunks/" + mId);
                        for (let i = 0; i < total; i++) {
                            await ref.child("c_" + i).set(b64.slice(i * cSize, (i + 1) * cSize));
                            onProg(50 + Math.round(((i + 1) / total) * 50));
                        }
                        await ref.child("meta").set({ totalChunks: total, mime: file.type, name: file.name });
                        resolve({ type: mType, name: file.name, chunkedId: mId, dataUrl: total <= 5 ? b64 : null });
                        return;
                    } catch (err) {}
                }
                onProg(100);
                resolve({ type: mType, name: file.name, dataUrl: b64 });
            };
            r.onerror = () => reject(new Error("Upload error"));
            r.readAsDataURL(file);
        });
    }

    async function publishVideoToLiveFeed(media, modalRoot) {
        const me = getCurrentMember();
        const txtArea = document.querySelector("textarea[placeholder*='Write your question'], textarea");
        const caption = txtArea && txtArea.value.trim() ? txtArea.value.trim() : "🎬 Shared a video";

        const post = {
            id: "vpost_" + Date.now(),
            authorName: me.name,
            authorHandle: me.handle,
            authorStream: me.stream,
            authorAvatar: me.avatar,
            text: caption,
            videoDataUrl: media.dataUrl || null,
            chunkedId: media.chunkedId || null,
            fileName: media.name,
            timestamp: Date.now()
        };

        if (window.firebase && firebase.database) {
            try { await firebase.database().ref("nexus_live_video_posts").push(post); } catch (e) {}
        }
        renderVideoPostCard(post);
        showToast("🚀 Video Posted Live!");

        if (modalRoot) {
            modalRoot.querySelectorAll("button, div, span").forEach(b => {
                const t = (b.innerText || "").trim();
                if (t === "✕" || t === "×" || t === "X") b.click();
            });
        }
    }

    function renderVideoPostCard(p) {
        if (document.getElementById("vp_" + p.id)) return;
        let feed = null;
        document.querySelectorAll("div").forEach(d => {
            if (!feed && (d.innerText || "").includes("PINNED") && d.offsetWidth > 250 && d.offsetHeight < 500) {
                feed = d.parentElement;
            }
        });
        if (!feed) return;

        const card = document.createElement("div");
        card.id = "vp_" + p.id;
        card.style.cssText = "background:#0f172a;border:1px solid #1e293b;border-radius:18px;padding:16px;margin:12px 14px;color:#fff;font-family:system-ui,sans-serif;";
        const vBox = "vplay_" + p.id;
        const vidHtml = p.videoDataUrl
            ? `<video src="${p.videoDataUrl}" controls playsinline style="width:100%;max-height:340px;border-radius:12px;margin-top:10px;background:#000;"></video>`
            : `<div id="${vBox}" style="margin-top:10px;"><button onclick="window.playChunkedMedia('${p.chunkedId}','${vBox}')" style="width:100%;background:#1e293b;border:1px solid #3b82f6;color:#60a5fa;padding:12px;border-radius:10px;font-weight:700;cursor:pointer;">▶️ Play Video (${p.fileName})</button></div>`;

        card.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;border-radius:50%;background:#059669;display:flex;align-items:center;justify-content:center;font-weight:800;">${(p.authorName||"M").charAt(0)}</div>
                <div>
                    <div style="font-weight:700;font-size:15px;">${p.authorName} <span style="color:#10b981;">✔</span></div>
                    <div style="font-size:12px;color:#64748b;">${p.authorHandle} • ${p.authorStream}</div>
                </div>
            </div>
            <div style="margin-top:10px;font-size:14px;color:#e2e8f0;">${p.text}</div>
            ${vidHtml}
        `;
        feed.prepend(card);
    }

    window.playChunkedMedia = async function(mId, boxId) {
        const box = document.getElementById(boxId);
        if (!box || !window.firebase || !firebase.database) return;
        box.innerHTML = `<span style="color:#60a5fa;font-size:13px;">⏳ Loading Video...</span>`;
        const snap = await firebase.database().ref("nexus_media_chunks/" + mId).once("value");
        const val = snap.val();
        if (!val || !val.meta) return;
        let full = "";
        for (let i = 0; i < val.meta.totalChunks; i++) full += (val["c_" + i] || "");
        box.innerHTML = `<video src="${full}" controls autoplay playsinline style="width:100%;max-height:340px;border-radius:12px;background:#000;"></video>`;
    };

    if (window.firebase && firebase.database) {
        firebase.database().ref("nexus_live_video_posts").limitToLast(8).on("child_added", (s) => {
            if (s.val()) setTimeout(() => renderVideoPostCard(s.val()), 400);
        });
    }

    // =========================================================================
    // 6. OFFICIAL NEXUS AI (OWNER MOHIT @mohit_01 & LIVE SERVER STATUS)
    // =========================================================================
    window.openNexusOfficialAI = function() {
        const old = document.getElementById("nx-official-ai-popup");
        if (old) old.remove();
        const defSt = "🟢 Sabhi Nexus Servers (1:1 DM, Watch Party, Video Post & Study Channels) 100% Online hain!";
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
                    📡 <b>Live Server Status:</b> ${localStorage.getItem("nexus_server_status") || defSt}
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
            let ans = "ℹ️ Main <b>Nexus Official AI</b> hoon.<br>👑 <b>Owner:</b> Mohit (<code>@mohit_01</code>)<br>📡 <b>Status:</b> " + (localStorage.getItem("nexus_server_status") || defSt);
            if (q.startsWith("status:")) {
                const ns = v.substring(7).trim();
                localStorage.setItem("nexus_server_status", ns);
                ans = "✅ <b>Live Status Updated:</b><br>" + ns;
            }
            setTimeout(() => {
                box.innerHTML += `<div style="align-self:flex-start;background:#1e293b;border-left:4px solid #38bdf8;padding:12px 14px;border-radius:12px;font-size:14px;">${ans}</div>`;
                box.scrollTop = box.scrollHeight;
            }, 150);
        };
        document.getElementById("nx-ai-go").onclick = ask;
        inp.onkeydown = (e) => { if (e.key === "Enter") ask(); };
    };

    document.addEventListener("click", function(e) {
        if (!e.target || typeof e.target.closest !== "function") return;
        const btn = e.target.closest("button, a");
        if (!btn || btn.children.length > 3) return;
        const txt = (btn.innerText || "").trim();
        if (txt === "AI" || txt.includes("🤖 AI") || txt === "Ask 1:1" || txt === "Ask AI") {
            e.preventDefault();
            window.openNexusOfficialAI();
        }
    });
})();
