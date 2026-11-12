/* ============================================================================
   NEXUS V8 FINAL FIX (BASED ON REPO ZIP STRUCTURE)
   1. Zero-Overlap Follow & Sleek Dark Glass Message Button in Member Profile
   2. Complete 2-Step 1:1 DM Auto-Opener (Clicks "Open →" then clicks "@user Chat →")
   3. Permanent Top Header "🤖 AI" Button Restore (Next to "📲 App")
   4. 20MB Video Upload in Post (+) & 1:1 DM Chat + Official Nexus AI
   ============================================================================ */

(function() {
    if (window.__NEXUS_V8_ACTIVE__) return;
    window.__NEXUS_V8_ACTIVE__ = true;

    // 1. OLD NETLIFY REDIRECT
    if (window.location.hostname.includes("netlify.app")) {
        window.location.replace("https://nexus-community01.vercel.app");
        return;
    }

    // Clear sticky Service Worker caches so updates apply live
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
    // 2. RESTORE TOP HEADER "🤖 AI" BUTTON NEXT TO "📲 App"
    // =========================================================================
    function restoreHeaderAIButton() {
        if (document.getElementById("nx-clean-ai-pill")) return;

        const allBtns = document.querySelectorAll("header button, header a, header div, .top-bar button, body > div button");
        for (const el of allBtns) {
            const txt = (el.innerText || "").trim();
            if ((txt === "App" || txt.includes("App")) && el.children.length <= 2 && el.offsetWidth < 130) {
                const parentText = el.parentElement ? el.parentElement.innerText : "";
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

    // =========================================================================
    // 3. ZERO-OVERLAP MEMBER PROFILE BUTTONS (+ Follow & 💬 Message)
    // =========================================================================
    function syncProfileAndPostUI() {
        restoreHeaderAIButton();

        // Clean up any old broken grid wrapper from V7 that caused overlapping
        document.querySelectorAll(".nx-insta-action-row").forEach(row => {
            const parent = row.parentNode;
            if (parent) {
                const fBtn = row.querySelector("button");
                if (fBtn) {
                    fBtn.style.width = "100%";
                    parent.insertBefore(fBtn, row);
                }
                row.remove();
            }
        });

        // Find "+ Follow" / "Following" button inside Member Full Profile
        document.querySelectorAll("button").forEach(followBtn => {
            if (followBtn.classList.contains("nx-clean-dm-btn")) return;
            const txt = (followBtn.innerText || "").trim();

            if (txt === "+ Follow" || txt === "Following" || txt === "✓ Following" || txt === "Follow") {
                // Find the Member Full Profile card container
                let profileBox = followBtn.parentElement;
                let isProfileModal = false;
                for (let i = 0; i < 6 && profileBox; i++) {
                    const boxText = profileBox.innerText || "";
                    if (boxText.includes("Member Full Profile") || boxText.includes("SHARED POSTS")) {
                        isProfileModal = true;
                        break;
                    }
                    profileBox = profileBox.parentElement;
                }

                if (!isProfileModal || !profileBox) return;

                // Ensure "+ Follow" stays full-width block in its original position (NO OVERLAP)
                followBtn.style.display = "block";
                followBtn.style.width = "100%";
                followBtn.style.position = "relative";
                followBtn.style.clear = "both";

                // Attach a safe fallback follow toggle ONLY once, running 200ms after click if native code didn't update it
                if (!followBtn.dataset.nxSafeFollowBound) {
                    followBtn.dataset.nxSafeFollowBound = "true";
                    followBtn.addEventListener("click", function() {
                        const beforeText = (followBtn.innerText || "").trim();
                        setTimeout(() => {
                            const afterText = (followBtn.innerText || "").trim();
                            // Only run fallback if native profilefix.js didn't change the button text
                            if (beforeText === afterText) {
                                const isNowFollowing = beforeText.includes("Following");
                                followBtn.innerText = isNowFollowing ? "+ Follow" : "✓ Following";
                                followBtn.style.background = isNowFollowing ? "#2563eb" : "#1e293b";
                            }
                        }, 200);
                    });
                }

                // Extract @handle and Name from the profile modal
                const fullText = profileBox.innerText || "";
                const handleMatch = fullText.match(/@([a-zA-Z0-9_]+)/);
                const targetHandle = handleMatch ? handleMatch[1] : "member";

                // Check if our clean Message button already exists inside this profile modal
                let existingMsgBtn = profileBox.querySelector(".nx-clean-dm-btn");
                if (!existingMsgBtn) {
                    const msgBtn = document.createElement("button");
                    msgBtn.type = "button";
                    msgBtn.className = "nx-clean-dm-btn";
                    msgBtn.innerHTML = `💬 Message @${targetHandle}`;
                    msgBtn.style.cssText = `
                        display: block !important;
                        width: 100% !important;
                        height: 42px !important;
                        margin-top: 10px !important;
                        margin-bottom: 4px !important;
                        position: relative !important;
                        clear: both !important;
                        background: #1e293b !important;
                        color: #f8fafc !important;
                        border: 1px solid rgba(99, 102, 241, 0.5) !important;
                        border-radius: 12px !important;
                        font-weight: 700 !important;
                        font-size: 14px !important;
                        cursor: pointer !important;
                        text-align: center !important;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25) !important;
                    `;

                    msgBtn.onclick = function(ev) {
                        ev.preventDefault();
                        ev.stopPropagation();

                        // 1. Close the Member Full Profile modal first
                        profileBox.querySelectorAll("button, div, span").forEach(b => {
                            const bt = (b.innerText || "").trim();
                            if (bt === "✕" || bt === "×" || bt === "X") b.click();
                        });

                        // 2. Open the actual 1:1 DM Chat window with this user
                        openReal1on1ChatWindow(targetHandle);
                    };

                    followBtn.insertAdjacentElement("afterend", msgBtn);
                } else {
                    // Update handle text if user opened a different profile
                    existingMsgBtn.innerHTML = `💬 Message @${targetHandle}`;
                }
            }
        });

        // Upgrade "Instant Cloud Post" modal with sleek 20MB Video Upload Box
        document.querySelectorAll("div, label").forEach(box => {
            const bText = (box.innerText || "").trim();
            if (bText.includes("Tap to Upload Photo / Doubt Image") && !box.dataset.nxVidAdded && box.children.length <= 4) {
                box.dataset.nxVidAdded = "true";
                const vidBtn = document.createElement("div");
                vidBtn.style.cssText = `
                    margin-top: 10px;
                    background: rgba(30, 41, 59, 0.75);
                    border: 1px dashed rgba(99, 102, 241, 0.55);
                    border-radius: 12px;
                    padding: 12px;
                    text-align: center;
                    color: #93c5fd;
                    font-weight: 700;
                    font-size: 13px;
                    cursor: pointer;
                `;
                vidBtn.innerHTML = `🎬 Tap to Upload Video (Up to 20MB) <span id="nx-vid-stat" style="display:block;font-size:11px;color:#64748b;font-weight:500;margin-top:2px;">Direct Live Feed Video Player</span>`;
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
                            st.innerHTML = `<span style="color:#34d399;">✅ Video Uploaded! Sharing now...</span>`;
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

    setInterval(syncProfileAndPostUI, 400);

    // =========================================================================
    // 4. COMPLETE 2-STEP 1:1 DM OPENER (FIXES SCREENSHOT 33 BUG)
    // =========================================================================
    function openReal1on1ChatWindow(targetHandle) {
        const cleanHandle = targetHandle.replace(/^@/, "").toLowerCase();

        // Step A: Try calling native DM functions directly if exposed by dm.js / dminbox.js
        const nativeFns = ["openDMChat", "openDirectChat", "startDM", "openChatWith", "startPersonalDM", "openUserDM"];
        for (const fnName of nativeFns) {
            if (typeof window[fnName] === "function") {
                try { window[fnName](cleanHandle); return; } catch (e) {}
            }
            if (window.Nexus && typeof window.Nexus[fnName] === "function") {
                try { window.Nexus[fnName](cleanHandle); return; } catch (e) {}
            }
        }
        if (window.Nexus && typeof window.Nexus.openDM === "function") {
            try { window.Nexus.openDM(cleanHandle); return; } catch (e) {}
        }

        // Step B: Switch to Chat Tab (2nd icon in bottom navigation)
        const navs = document.querySelectorAll(".nx-nav-item, nav button, footer button");
        if (navs.length >= 2) navs[1].click();

        // Step C: Click the "Open →" button on "Nexus Official 1:1 Personal DM" card
        setTimeout(() => {
            let openClicked = false;
            document.querySelectorAll("button, a, div").forEach(el => {
                if (openClicked) return;
                const t = (el.innerText || "").trim();
                // Match "Open →" button or the "Nexus Official 1:1 Personal DM" card
                if ((t.startsWith("Open") && t.length <= 10 && el.children.length <= 2) ||
                    (t.includes("Nexus Official 1:1 Personal DM") && el.getAttribute("onclick"))) {
                    el.click();
                    openClicked = true;
                }
            });

            if (!openClicked) {
                // Fallback: find the green card containing "Nexus Official 1:1 Personal DM" and click its button
                document.querySelectorAll("div").forEach(card => {
                    if (!openClicked && (card.innerText || "").includes("Nexus Official 1:1 Personal DM")) {
                        const btn = card.querySelector("button, [onclick]");
                        if (btn) { btn.click(); openClicked = true; }
                        else { card.click(); openClicked = true; }
                    }
                });
            }

            // Step D: Poll for the "Nexus 1:1 Personal DM" member list modal and click "Chat →" for @targetHandle
            let attempts = 0;
            const findAndClickUserTimer = setInterval(() => {
                attempts++;
                let userChatOpened = false;

                // Search all member rows inside the opened 1:1 Personal DM modal
                document.querySelectorAll("div, button, li").forEach(row => {
                    if (userChatOpened) return;
                    const rowText = (row.innerText || "").toLowerCase();

                    if ((rowText.includes("@" + cleanHandle) || rowText.includes(cleanHandle)) &&
                        rowText.includes("chat") && row.offsetHeight > 30 && row.offsetHeight < 130) {

                        // Find the "Chat →" button inside this user's row or click the row itself
                        let clickedInner = false;
                        row.querySelectorAll("button, span, div, a").forEach(child => {
                            const ct = (child.innerText || "").trim();
                            if (!clickedInner && ct.startsWith("Chat") && ct.length <= 10) {
                                child.click();
                                clickedInner = true;
                                userChatOpened = true;
                            }
                        });
                        if (!clickedInner) {
                            row.click();
                            userChatOpened = true;
                        }
                    }
                });

                // If user row isn't loaded yet, check if any other "Chat →" row has an onclick attribute we can call directly
                if (!userChatOpened && attempts >= 4) {
                    const anyChatRow = Array.from(document.querySelectorAll("[onclick]")).find(el =>
                        (el.innerText || "").includes("Chat →") || (el.innerText || "").includes("@")
                    );
                    if (anyChatRow) {
                        const rawOnClick = anyChatRow.getAttribute("onclick") || "";
                        // Extract function name like "openChat('aarushi_01', ...)"
                        const fnMatch = rawOnClick.match(/^([a-zA-Z0-9_.]+)\s*\(/);
                        if (fnMatch && fnMatch[1]) {
                            try {
                                const fnParts = fnMatch[1].split(".");
                                const fnObj = fnParts.length === 2 ? window[fnParts[0]][fnParts[1]] : window[fnParts[0]];
                                if (typeof fnObj === "function") {
                                    fnObj(cleanHandle, targetHandle);
                                    userChatOpened = true;
                                }
                            } catch (e) {}
                        }
                    }
                }

                if (userChatOpened || attempts >= 18) {
                    clearInterval(findAndClickUserTimer);
                }
            }, 90);
        }, 120);
    }

    // =========================================================================
    // 5. 20MB VIDEO & MEDIA UPLOAD ENGINE
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
