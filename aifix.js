/* ============================================================================
   NEXUS CLEAN & FAST ENGINE (NO LAG, FIXED HEADER, WORKING FOLLOW/DM & 20MB VIDEO)
   ============================================================================ */

(function() {
    // 1. NETLIFY REDIRECT (Only runs if opened on old netlify.app link)
    if (window.location.hostname.includes("netlify.app")) {
        window.location.replace("https://nexus-community01.vercel.app");
        return;
    }

    // Helper: Show fast toast using Nexus native toast
    function notify(msg) {
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

    // Helper: Get logged-in member profile
    function getMember() {
        const keys = ["nexus_user", "currentUser", "nx_user", "user"];
        for (const k of keys) {
            try {
                const u = JSON.parse(localStorage.getItem(k));
                if (u && (u.name || u.username || u.handle)) {
                    const h = (u.handle || u.username || u.name).replace(/^@/, "");
                    return {
                        uid: u.uid || h,
                        name: u.name || h,
                        handle: "@" + h,
                        stream: u.stream || u.bio || "IIT-JEE Aspirant",
                        avatar: u.avatar || u.photoURL || ""
                    };
                }
            } catch (e) {}
        }
        return { uid: "student", name: "Nexus Member", handle: "@member", stream: "IIT-JEE", avatar: "" };
    }

    // 2. FIX HEADER (Insert 🤖 AI cleanly BEFORE existing 📲 App button without breaking header)
    function fixHeaderCleanly() {
        // Remove any old broken group from previous code
        const brokenGroup = document.getElementById("nx-restored-ai-btn");
        if (brokenGroup) brokenGroup.remove();

        if (document.getElementById("nx-clean-ai-pill")) return;

        // Find the existing "App" pill button in the top header
        const allBtns = document.querySelectorAll("header button, header a, header div, .top-bar button, body > div button");
        for (const el of allBtns) {
            const txt = (el.innerText || "").trim();
            if ((txt === "App" || txt.includes("App")) && el.children.length <= 2 && el.offsetWidth < 120) {
                // Check if AI button already exists next to it
                const parentText = (el.parentElement ? el.parentElement.innerText : "");
                if (!parentText.includes("AI")) {
                    const aiPill = document.createElement("button");
                    aiPill.id = "nx-clean-ai-pill";
                    aiPill.type = "button";
                    aiPill.innerHTML = "🤖 AI";
                    aiPill.style.cssText = `
                        background: rgba(99, 102, 241, 0.16);
                        border: 1px solid rgba(99, 102, 241, 0.55);
                        color: #c7d2fe;
                        padding: 5px 11px;
                        border-radius: 999px;
                        font-size: 12px;
                        font-weight: 700;
                        margin-right: 6px;
                        cursor: pointer;
                        display: inline-flex;
                        align-items: center;
                        gap: 4px;
                        white-space: nowrap;
                    `;
                    aiPill.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.openNexusOfficialAI();
                    };
                    el.parentNode.insertBefore(aiPill, el);
                }
                break;
            }
        }
    }
    setTimeout(fixHeaderCleanly, 400);
    setTimeout(fixHeaderCleanly, 1500);

    // 3. SAFE ADD "💬 Message" BELOW "+ Follow" & ADD "🎥 Video (<20MB)" IN POST MODAL
    function enhanceModalsSafely() {
        // A. Add "💬 Message" button below "+ Follow" in Member Full Profile without touching parent flex
        document.querySelectorAll("button").forEach(btn => {
            const t = (btn.innerText || "").trim();
            if ((t === "+ Follow" || t === "Following" || t === "Follow") && !btn.dataset.nxMsgLinked) {
                const card = btn.closest("div");
                if (card && (card.innerText || "").includes("Followers")) {
                    btn.dataset.nxMsgLinked = "true";
                    const msgBtn = document.createElement("button");
                    msgBtn.type = "button";
                    msgBtn.innerHTML = "💬 Direct Message";
                    msgBtn.style.cssText = `
                        width: 100%;
                        margin-top: 8px;
                        background: linear-gradient(90deg, #059669, #10b981);
                        color: #fff;
                        border: none;
                        border-radius: 12px;
                        padding: 11px;
                        font-weight: 800;
                        font-size: 14px;
                        cursor: pointer;
                    `;
                    msgBtn.onclick = function() {
                        const handleMatch = (card.innerText || "").match(/@([a-zA-Z0-9_]+)/);
                        const targetUser = handleMatch ? handleMatch[1] : "Member";
                        // Close profile popup first
                        const closeBtns = card.parentElement ? card.parentElement.querySelectorAll("button") : [];
                        closeBtns.forEach(b => {
                            if (b.innerText.includes("✕") || b.innerText.includes("×") || b.innerText.includes("X")) b.click();
                        });
                        openDirect1on1ChatWith(targetUser);
                    };
                    btn.insertAdjacentElement("afterend", msgBtn);
                }
            }
        });

        // B. Upgrade any file input on the page to allow Videos & PDFs too
        document.querySelectorAll("input[type='file']").forEach(inp => {
            if (!inp.dataset.nxUpgraded) {
                inp.dataset.nxUpgraded = "true";
                inp.setAttribute("accept", "image/*,video/*,.pdf,.doc,.docx");
            }
        });
    }

    // Run lightweight check ONLY after a user click (Zero CPU lag!)
    document.addEventListener("click", () => {
        setTimeout(enhanceModalsSafely, 180);
    });

    // 4. DIRECT 1:1 CHAT OPENER FROM PROFILE
    function openDirect1on1ChatWith(targetHandle) {
        if (window.Nexus && typeof window.Nexus.openDM === "function") {
            window.Nexus.openDM(targetHandle);
            return;
        }
        // Switch to Chat/DM tab (2nd icon in bottom nav)
        const navItems = document.querySelectorAll(".nx-nav-item");
        if (navItems.length >= 2) {
            navItems[1].click();
        }
        setTimeout(() => {
            // Try clicking "Open" on Nexus Official 1:1 Personal DM card
            document.querySelectorAll("button, div").forEach(el => {
                if ((el.innerText || "").trim() === "Open" && el.children.length === 0) {
                    el.click();
                }
            });
            notify("💬 Chat Ready with @" + targetHandle);
        }, 250);
    }

    // 5. FIX CLOUD ACCOUNT CREATION (No Stuck Toast)
    document.addEventListener("click", function(e) {
        const btn = e.target.Element ? e.target.closest("button") : null;
        if (!btn) return;
        const txt = (btn.innerText || "").trim();

        if (txt === "Create Cloud Account" || txt === "Login Existing") {
            const box = btn.closest("div");
            if (!box) return;
            const inputs = box.querySelectorAll("input");
            if (inputs.length < 2) return;

            const vals = Array.from(inputs).map(i => i.value.trim());
            const name = vals[0];
            if (!name) return;

            const cleanId = (vals[1] || name).replace(/^@/, "").replace(/[.#$[\]\s]/g, "_");
            const stream = vals.length >= 4 ? (vals[2] || "IIT-JEE Aspirant") : "IIT-JEE Aspirant";
            const pass = (vals[vals.length - 1] || "1234") + "_nx26";

            const userObj = {
                uid: cleanId, id: cleanId, name: name, username: cleanId,
                handle: "@" + cleanId, stream: stream, bio: stream,
                password: pass, verified: true, online: true
            };

            localStorage.setItem("nexus_user", JSON.stringify(userObj));
            localStorage.setItem("currentUser", JSON.stringify(userObj));
            localStorage.setItem("nx_user", JSON.stringify(userObj));
            localStorage.setItem("nx_logged_in", "true");

            if (window.firebase && firebase.database) {
                try { firebase.database().ref("users/" + cleanId).update(userObj); } catch (err) {}
            }

            setTimeout(() => {
                notify("✅ Welcome " + name + "!");
                if (window.Nexus && typeof window.Nexus.init === "function") {
                    try { window.Nexus.init(); } catch (err) {}
                }
                const homeNav = document.querySelector(".nx-nav-item");
                if (homeNav) homeNav.click();
            }, 400);
        }
    });

    // 6. 20MB VIDEO, PHOTO & PDF SENDER ENGINE (FOR POSTS & 1:1 DM)
    async function readAndUploadMedia(file, onProg) {
        if (file.size > 20 * 1024 * 1024) {
            throw new Error("File 20MB se badi hai! Kripya 20MB se chota video/file chunein.");
        }

        // Fast Image Compression
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
                    r.onload = (ev) => { onProg(100); resolve({ type: "image", name: file.name, dataUrl: ev.target.result }); };
                    r.readAsDataURL(file);
                }
            });
        }

        // Video (<20MB) or PDF Chunked Upload
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onprogress = (ev) => {
                if (ev.lengthComputable) onProg(Math.round((ev.loaded / ev.total) * 50));
            };
            r.onload = async (ev) => {
                const base64 = ev.target.result;
                const type = file.type.startsWith("video/") ? "video" : "file";
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
                        resolve({ type: type, name: file.name, chunkedId: mediaId, dataUrl: total <= 5 ? base64 : null });
                        return;
                    } catch (e) {}
                }
                onProg(100);
                resolve({ type: type, name: file.name, dataUrl: base64 });
            };
            r.onerror = () => reject(new Error("File read nahi ho payi"));
            r.readAsDataURL(file);
        });
    }

    window.playNexusChunkedVideo = async function(mediaId, boxId) {
        const box = document.getElementById(boxId);
        if (!box || !window.firebase || !firebase.database) return;
        box.innerHTML = `<span style="color:#60a5fa;font-size:13px;">⏳ Video load ho raha hai...</span>`;
        try {
            const snap = await firebase.database().ref("nexus_media_chunks/" + mediaId).once("value");
            const val = snap.val();
            if (!val || !val.meta) return;
            let full = "";
            for (let i = 0; i < val.meta.totalChunks; i++) full += (val["c_" + i] || "");
            if ((val.meta.mime || "").startsWith("video/")) {
                box.innerHTML = `<video src="${full}" controls autoplay playsinline style="width:100%;max-height:320px;border-radius:12px;background:#000;"></video>`;
            } else {
                box.innerHTML = `<a href="${full}" download="${val.meta.name}" style="display:inline-block;background:#4f46e5;color:#fff;padding:8px 14px;border-radius:8px;text-decoration:none;font-weight:700;">📥 Download ${val.meta.name}</a>`;
            }
        } catch (e) {
            box.innerHTML = `<span style="color:#f87171;">⚠️ Error loading media</span>`;
        }
    };

    // Trigger Media Upload in 1:1 DM or Feed
    function pickAndSendMedia(mode) {
        const inp = document.createElement("input");
        inp.type = "file";
        inp.accept = (mode === "PDF/File") ? ".pdf,.doc,.docx,.txt,image/*,video/*" : "image/*,video/*";

        inp.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const me = getMember();
            notify(`⏳ Uploading ${file.name} (0%)...`);

            try {
                const uploaded = await readAndUploadMedia(file, (pct) => {
                    notify(`⏳ Uploading ${file.name} (${pct}%)...`);
                });

                const item = {
                    id: "m_" + Date.now(),
                    sender: me.name,
                    handle: me.handle,
                    stream: me.stream,
                    mode: mode,
                    mediaType: uploaded.type,
                    fileName: uploaded.name,
                    dataUrl: uploaded.dataUrl || null,
                    chunkedId: uploaded.chunkedId || null,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    timestamp: Date.now()
                };

                if (window.firebase && firebase.database) {
                    firebase.database().ref("nexus_live_media_stream").push(item);
                }
                renderLiveMediaItem(item);
                notify("✅ Media Sent Successfully!");
            } catch (err) {
                alert("⚠️ " + err.message);
            }
        };
        inp.click();
    }

    function renderLiveMediaItem(m) {
        if (document.getElementById("nx_media_" + m.id)) return;

        let mediaContent = "";
        if (m.mode === "View-Once") {
            mediaContent = `<button onclick="this.outerHTML='<img src=\\'${m.dataUrl}\\' style=\\'width:100%;border-radius:10px;\\'>'" style="background:#10b981;color:#000;border:none;padding:10px 14px;border-radius:10px;font-weight:800;cursor:pointer;">1️⃣ Tap to View Once (${m.fileName})</button>`;
        } else if (m.mediaType === "image" && m.dataUrl) {
            mediaContent = `<img src="${m.dataUrl}" style="width:100%;max-height:280px;border-radius:12px;object-fit:cover;">`;
        } else if (m.mediaType === "video") {
            if (m.dataUrl) {
                mediaContent = `<video src="${m.dataUrl}" controls playsinline style="width:100%;max-height:280px;border-radius:12px;background:#000;"></video>`;
            } else {
                const vbox = "vbox_" + m.id;
                mediaContent = `<div id="${vbox}"><button onclick="window.playNexusChunkedVideo('${m.chunkedId}','${vbox}')" style="background:#3b82f6;color:#fff;border:none;padding:10px 14px;border-radius:10px;font-weight:700;cursor:pointer;">▶️ Play Video (${m.fileName})</button></div>`;
            }
        } else {
            const fbox = "fbox_" + m.id;
            mediaContent = m.dataUrl
                ? `<a href="${m.dataUrl}" download="${m.fileName}" style="color:#fff;font-weight:700;text-decoration:underline;">📄 Download ${m.fileName}</a>`
                : `<div id="${fbox}"><button onclick="window.playNexusChunkedVideo('${m.chunkedId}','${fbox}')" style="background:#4f46e5;color:#fff;border:none;padding:8px 14px;border-radius:8px;font-weight:700;cursor:pointer;">📥 Open ${m.fileName}</button></div>`;
        }

        // If 1:1 DM input is open on screen, append bubble in chat
        const msgInput = document.querySelector("input[placeholder*='Message']");
        if (msgInput) {
            const chatWrap = msgInput.closest("div").parentElement;
            if (chatWrap) {
                const b = document.createElement("div");
                b.id = "nx_media_" + m.id;
                b.style.cssText = "background:#065f46;color:#fff;padding:12px;border-radius:14px;margin:8px 14px;max-width:78%;margin-left:auto;";
                b.innerHTML = `<div style="font-size:11px;color:#a7f3d0;margin-bottom:4px;font-weight:700;">${m.sender} (${m.handle})</div>${mediaContent}<div style="font-size:10px;text-align:right;margin-top:4px;opacity:0.8;">${m.time} ✓✓</div>`;
                chatWrap.insertBefore(b, msgInput.closest("div"));
                return;
            }
        }
    }

    if (window.firebase && firebase.database) {
        firebase.database().ref("nexus_live_media_stream").limitToLast(8).on("child_added", (s) => {
            const v = s.val();
            if (v && Date.now() - v.timestamp < 180000) renderLiveMediaItem(v);
        });
    }

    // 7. OFFICIAL NEXUS AI (OWNER MOHIT @mohit_01 & LIVE SERVER STATUS)
    window.openNexusOfficialAI = function() {
        const old = document.getElementById("nx-official-ai-popup");
        if (old) old.remove();

        const defStatus = "🟢 Sabhi Nexus Servers (1:1 DM, Watch Party, Video Upload & Study Feed) 100% Online hain!";
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
                    👑 <b>Owner & Founder:</b> Mohit (<code>@mohit_01</code>)<br>
                    📡 <b>Live Server Status:</b> ${localStorage.getItem("nexus_server_status") || defStatus}
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
                ans = "✅ <b>Server Status Updated:</b><br>" + ns;
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

    // 8. PRECISION CLICK HANDLER (ONLY MATCHES EXACT LEAF BUTTONS — NEVER BLOCKS DIVS/FOLLOW/TABS)
    document.addEventListener("click", function(e) {
        const btn = e.target.closest("button, a");
        if (!btn) return;
        // Never intercept large containers
        if (btn.children.length > 3) return;

        const txt = (btn.innerText || "").trim();

        if (txt === "🤖 AI" || txt === "AI" || txt === "Ask 1:1" || txt === "Ask AI") {
            e.preventDefault();
            window.openNexusOfficialAI();
        } else if (txt === "Photo" || txt.endsWith("Photo")) {
            e.preventDefault();
            pickAndSendMedia("Photo");
        } else if (txt === "View-Once" || txt.endsWith("View-Once")) {
            e.preventDefault();
            pickAndSendMedia("View-Once");
        } else if (txt === "PDF/File" || txt.endsWith("PDF/File")) {
            e.preventDefault();
            pickAndSendMedia("PDF/File");
        }
    });
})();
