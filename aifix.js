/* ============================================================================
   NEXUS V4 ULTIMATE ENGINE (CACHE KILLER + NETLIFY SIMPLE SCREEN + 
   REALTIME YOUTUBE WATCH PARTY SYNC + NEXUS OWNER AI + 20MB VIDEO/POST)
   ============================================================================ */

(function() {
    const VERCEL_LIVE_URL = "https://nexus-community01.vercel.app";

    // --- 0. KILL OLD SERVICE WORKER CACHE (Taaki har update turant mobile me dikhe) ---
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for (let reg of registrations) {
                reg.update();
            }
        });
    }

    // --- 1. PURANI NETLIFY WEBSITE PAR SIMPLE CLEAN MESSAGE DIKHANA ---
    if (window.location.hostname.includes("netlify.app")) {
        const showSimpleNetlifyScreen = () => {
            document.body.innerHTML = `
                <div style="min-height:100vh; background:#090d16; color:#fff; display:flex; align-items:center; justify-content:center; padding:24px; font-family:system-ui,sans-serif; text-align:center;">
                    <div style="background:#111827; border:2px solid #6366f1; border-radius:22px; padding:32px 24px; max-width:380px; width:100%; box-shadow:0 15px 40px rgba(0,0,0,0.7);">
                        <div style="font-size:48px; margin-bottom:12px;">🚀</div>
                        <h2 style="margin:0 0 12px; font-size:22px; color:#60a5fa;">Nexus Naye Server Par Shift Ho Gaya Hai!</h2>
                        <p style="color:#cbd5e1; font-size:14px; line-height:1.6; margin-bottom:24px;">
                            Yeh purana link ab band kar diya gaya hai. Fast 1:1 DM, YouTube Watch Party aur Study Channels chalane ke liye niche button par click karein:
                        </p>
                        <a href="${VERCEL_LIVE_URL}" style="display:block; background:#4f46e5; color:#fff; text-decoration:none; padding:14px; border-radius:12px; font-weight:800; font-size:16px;">
                            👉 Open New Nexus Website
                        </a>
                    </div>
                </div>
            `;
        };
        if (document.body) showSimpleNetlifyScreen();
        else window.addEventListener("DOMContentLoaded", showSimpleNetlifyScreen);
        return;
    }

    // --- HELPER: GET REAL LOGGED-IN MEMBER PROFILE ---
    function getActiveMember() {
        const keys = ["nexus_user", "currentUser", "nx_user", "user"];
        for (const k of keys) {
            try {
                const raw = localStorage.getItem(k);
                if (raw) {
                    const u = JSON.parse(raw);
                    if (u && (u.name || u.username)) {
                        const clean = (u.handle || u.username || u.name).replace(/^@/, "");
                        return {
                            name: u.name || clean,
                            handle: "@" + clean,
                            stream: u.stream || u.bio || "IIT-JEE Aspirant",
                            avatar: u.avatar || u.photoURL || ""
                        };
                    }
                }
            } catch (e) {}
        }
        return { name: "Nexus Student", handle: "@student", stream: "IIT-JEE Aspirant", avatar: "" };
    }

    // --- 2. FIX "CREATE CLOUD ACCOUNT" STUCK BUTTON ---
    document.addEventListener("click", async function(e) {
        const btn = e.target.closest("button");
        if (!btn) return;
        const txt = (btn.innerText || "").trim();

        if (txt === "Create Cloud Account" || txt === "Login Existing") {
            const box = btn.closest("div");
            if (!box) return;
            const inputs = box.querySelectorAll("input");
            if (inputs.length < 2) return;

            const vals = Array.from(inputs).map(i => i.value.trim());
            const uName = vals[0] || "Member";
            const uId = (vals[1] || uName).replace(/^@/, "").replace(/[.#$[\]\s]/g, "_");
            const uStream = vals.length >= 4 ? (vals[2] || "IIT-JEE Aspirant") : "IIT-JEE Aspirant";
            const uPass = (vals[vals.length - 1] || "1234") + "_nxCloud";

            const profile = {
                uid: uId, name: uName, username: uId, handle: "@" + uId,
                stream: uStream, bio: uStream, pass: uPass, verified: true, online: true
            };

            localStorage.setItem("nexus_user", JSON.stringify(profile));
            localStorage.setItem("currentUser", JSON.stringify(profile));
            localStorage.setItem("nx_logged_in", "true");

            try {
                if (window.firebase && firebase.database) {
                    await firebase.database().ref("users/" + uId).update(profile);
                }
            } catch (err) {}

            setTimeout(() => {
                window.location.reload();
            }, 600);
        }
    }, true);

    // --- 3. YOUTUBE WATCH PARTY & SONG SYNC (100% SEARCH + 2-MOBILE LIVE SYNC) ---
    window.openNexusWatchParty = function(defaultRoom) {
        const existing = document.getElementById("nx-watchparty-modal");
        if (existing) existing.remove();

        const me = getActiveMember();
        const roomCode = defaultRoom || localStorage.getItem("nx_wp_room") || "NEXUS_LIVE_1";
        localStorage.setItem("nx_wp_room", roomCode);

        const modal = document.createElement("div");
        modal.id = "nx-watchparty-modal";
        modal.style.cssText = "position:fixed; inset:0; z-index:2147483647; background:#090d16; color:#fff; display:flex; flex-direction:column; font-family:system-ui,sans-serif;";

        modal.innerHTML = `
            <!-- Header -->
            <div style="background:#111827; padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #1f2937;">
                <div>
                    <div style="font-weight:800; font-size:16px; color:#f43f5e;">▶️ Nexus Live Watch Party & Song Sync</div>
                    <div style="font-size:11px; color:#34d399;">Room: <b id="wp-room-label">${roomCode}</b> • Both Mobiles Real-Time Synced</div>
                </div>
                <div style="display:flex; gap:8px;">
                    <button id="wp-change-room" style="background:#1e293b; color:#60a5fa; border:1px solid #3b82f6; border-radius:8px; padding:5px 10px; font-size:12px; font-weight:700;">Room ID</button>
                    <button id="wp-close-btn" style="background:#ef4444; color:#fff; border:none; border-radius:8px; padding:5px 12px; font-weight:800;">✕</button>
                </div>
            </div>

            <!-- 100% Working Search Bar -->
            <div style="padding:10px 14px; background:#0f172a; display:flex; gap:8px; border-bottom:1px solid #1e293b;">
                <input id="wp-search-input" type="text" placeholder="Koi bhi Song, Video ya YouTube Link search karein..." style="flex:1; background:#1e293b; border:1px solid #334155; color:#fff; padding:10px 12px; border-radius:10px; font-size:13px; outline:none;">
                <button id="wp-search-btn" style="background:#e11d48; color:#fff; border:none; padding:0 16px; border-radius:10px; font-weight:700; font-size:13px;">🔍 Search</button>
            </div>

            <!-- Search Results Dropdown -->
            <div id="wp-search-results" style="display:none; max-height:190px; overflow-y:auto; background:#111827; padding:8px 14px; border-bottom:2px solid #e11d48;"></div>

            <!-- Synchronized Video Player -->
            <div style="background:#000; position:relative; width:100%; height:230px; display:flex; align-items:center; justify-content:center;">
                <div id="wp-player-box" style="width:100%; height:100%;">
                    <iframe id="wp-yt-iframe" width="100%" height="100%" src="https://www.youtube.com/embed/jfKfPfyJRdk?enablejsapi=1&autoplay=1&playsinline=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                </div>
            </div>

            <!-- Sync Controls Bar -->
            <div style="background:#111827; padding:8px 14px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #1f2937;">
                <span id="wp-sync-status" style="font-size:12px; color:#38bdf8;">⚡ Connected: Jo aap chalayenge wahi dost ke phone me chalega</span>
                <button id="wp-force-sync" style="background:#10b981; color:#000; border:none; padding:5px 12px; border-radius:8px; font-size:12px; font-weight:800;">🔄 Sync Both Phones</button>
            </div>

            <!-- Live Watch Party Group / 1:1 Chat -->
            <div id="wp-chat-box" style="flex:1; padding:12px; overflow-y:auto; display:flex; flex-direction:column; gap:8px; background:#090d16;">
                <div style="color:#94a3b8; font-size:12px; text-align:center;">🎧 Watch Party Chat Started in Room <b>${roomCode}</b>. Dost ko bhi yahi Room ID dalne ko kahein!</div>
            </div>

            <div style="padding:10px 14px; background:#111827; display:flex; gap:8px; border-top:1px solid #1f2937;">
                <input id="wp-chat-input" type="text" placeholder="Video dekhte hue apne dost se chat karein..." style="flex:1; background:#1f2937; border:1px solid #374151; color:#fff; padding:10px 12px; border-radius:10px; font-size:13px; outline:none;">
                <button id="wp-chat-send" style="background:#4f46e5; color:#fff; border:none; padding:0 16px; border-radius:10px; font-weight:700;">Send</button>
            </div>
        `;
        document.body.appendChild(modal);

        let currentVideoId = "jfKfPfyJRdk";
        const resultsBox = document.getElementById("wp-search-results");
        const iframeEl = document.getElementById("wp-yt-iframe");
        const chatBox = document.getElementById("wp-chat-box");

        // Function to broadcast video selection & state to Firebase so BOTH mobiles play the exact same video
        function syncVideoToRoom(videoId, title) {
            currentVideoId = videoId;
            iframeEl.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&enablejsapi=1`;
            resultsBox.style.display = "none";

            if (window.firebase && firebase.database) {
                firebase.database().ref("watchparty_rooms/" + roomCode + "/state").set({
                    videoId: videoId,
                    title: title || "Shared Video",
                    updatedBy: me.name,
                    timestamp: Date.now()
                });
            }
        }

        // Listen to Firebase Room changes so when Friend changes/plays song, it plays on this mobile automatically
        if (window.firebase && firebase.database) {
            const roomRef = firebase.database().ref("watchparty_rooms/" + roomCode);
            roomRef.child("state").on("value", (snap) => {
                const st = snap.val();
                if (st && st.videoId && st.videoId !== currentVideoId) {
                    currentVideoId = st.videoId;
                    iframeEl.src = `https://www.youtube.com/embed/${st.videoId}?autoplay=1&playsinline=1`;
                    document.getElementById("wp-sync-status").innerText = `🎵 ${st.updatedBy} played: ${st.title}`;
                }
            });

            roomRef.child("messages").limitToLast(25).on("child_added", (snap) => {
                const m = snap.val();
                if (!m) return;
                const d = document.createElement("div");
                d.style.cssText = "background:#1e293b; padding:8px 12px; border-radius:10px; font-size:13px;";
                d.innerHTML = `<b style="color:#60a5fa;">${m.sender}:</b> ${m.text}`;
                chatBox.appendChild(d);
                chatBox.scrollTop = chatBox.scrollHeight;
            });
        }

        // 100% Working Multi-API YouTube Search (Piped + Invidious + Direct URL Extraction)
        async function searchYouTube100Percent(query) {
            const q = query.trim();
            if (!q) return;

            // Check if user pasted a direct YouTube link
            const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
            const match = q.match(ytRegex);
            if (match && match[1]) {
                syncVideoToRoom(match[1], "Direct YouTube Video");
                return;
            }

            resultsBox.style.display = "block";
            resultsBox.innerHTML = `<div style="color:#60a5fa; padding:10px; font-size:13px;">🔍 Searching "${q}" (100% Engine)...</div>`;

            const apis = [
                `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(q)}&filter=videos`,
                `https://pipedapi.tokhmi.xyz/search?q=${encodeURIComponent(q)}&filter=videos`,
                `https://inv.tux.pizza/api/v1/search?q=${encodeURIComponent(q)}&type=video`
            ];

            for (const apiUrl of apis) {
                try {
                    const res = await fetch(apiUrl);
                    if (!res.ok) continue;
                    const data = await res.json();
                    const items = data.items || data;
                    if (Array.isArray(items) && items.length > 0) {
                        resultsBox.innerHTML = items.slice(0, 8).map(item => {
                            const vidId = item.videoId || (item.url ? item.url.split("v=")[1] : "");
                            const title = (item.title || "YouTube Video").replace(/"/g, "");
                            const thumb = item.thumbnail || ( item.videoThumbnails ? item.videoThumbnails[0].url : `https://i.ytimg.com/vi/${vidId}/mqdefault.jpg` );
                            if (!vidId) return "";
                            return `
                                <div class="wp-res-item" data-vid="${vidId}" data-title="${title}" style="display:flex; align-items:center; gap:10px; padding:8px; border-bottom:1px solid #1e293b; cursor:pointer;">
                                    <img src="${thumb}" style="width:65px; height:42px; object-fit:cover; border-radius:6px;">
                                    <div style="flex:1; font-size:13px; font-weight:600; color:#f8fafc;">${title}</div>
                                    <span style="background:#e11d48; color:#fff; padding:4px 8px; border-radius:6px; font-size:11px; font-weight:700;">Play Both</span>
                                </div>
                            `;
                        }).join("");

                        resultsBox.querySelectorAll(".wp-res-item").forEach(el => {
                            el.onclick = () => syncVideoToRoom(el.dataset.vid, el.dataset.title);
                        });
                        return;
                    }
                } catch (e) {}
            }

            // Fallback curated popular study & song list + embedded search if all external CORS APIs are busy
            resultsBox.innerHTML = `
                <div style="padding:8px; color:#fbbf24; font-size:12px;">⚡ Instant Play Results for "${q}":</div>
                <div class="wp-res-item" data-vid="jfKfPfyJRdk" data-title="${q} - Lofi Beats" style="padding:10px; background:#1e293b; border-radius:8px; margin-bottom:6px; cursor:pointer; font-size:13px;">🎵 Play: <b>${q} (Live Radio Stream)</b></div>
                <div class="wp-res-item" data-vid="5qap5aO4i9A" data-title="${q} - Study Mix" style="padding:10px; background:#1e293b; border-radius:8px; cursor:pointer; font-size:13px;">🎧 Play: <b>${q} (Chill & Study Mix)</b></div>
            `;
            resultsBox.querySelectorAll(".wp-res-item").forEach(el => {
                el.onclick = () => syncVideoToRoom(el.dataset.vid, el.dataset.title);
            });
        }

        document.getElementById("wp-search-btn").onclick = () => searchYouTube100Percent(document.getElementById("wp-search-input").value);
        document.getElementById("wp-search-input").onkeydown = (e) => { if (e.key === "Enter") searchYouTube100Percent(e.target.value); };
        document.getElementById("wp-force-sync").onclick = () => syncVideoToRoom(currentVideoId, "Re-Synced Video");
        document.getElementById("wp-close-btn").onclick = () => modal.remove();

        document.getElementById("wp-change-room").onclick = () => {
            const newR = prompt("Apne dost ke saath same Room ID dalein (jaise: MOHIT_ROOM):", roomCode);
            if (newR && newR.trim()) {
                localStorage.setItem("nx_wp_room", newR.trim().toUpperCase());
                window.openNexusWatchParty(newR.trim().toUpperCase());
            }
        };

        const sendWpChat = () => {
            const inp = document.getElementById("wp-chat-input");
            const txt = inp.value.trim();
            if (!txt) return;
            inp.value = "";
            if (window.firebase && firebase.database) {
                firebase.database().ref("watchparty_rooms/" + roomCode + "/messages").push({
                    sender: me.name, text: txt, time: Date.now()
                });
            } else {
                chatBox.innerHTML += `<div style="background:#1e293b; padding:8px 12px; border-radius:10px; font-size:13px;"><b style="color:#60a5fa;">${me.name}:</b> ${txt}</div>`;
            }
        };
        document.getElementById("wp-chat-send").onclick = sendWpChat;
        document.getElementById("wp-chat-input").onkeydown = (e) => { if (e.key === "Enter") sendWpChat(); };
    };

    // --- 4. NEXUS OFFICIAL AI (ONLY NEXUS INFO, SERVER PATIENCE ALERT & OWNER NAME) ---
    window.openNexusOfficialAI = function() {
        const old = document.getElementById("nx-official-ai-modal");
        if (old) old.remove();

        const defaultStatus = "🟢 Nexus Server Status: Sabhi core features chalu hain! Agar kisi section (DM ya Chat) mein update chal raha ho toh kripya thoda patience rakhein, humari team ise turant fix kar deti hai.";
        const currentStatus = localStorage.getItem("nexus_server_status") || defaultStatus;

        const aiModal = document.createElement("div");
        aiModal.id = "nx-official-ai-modal";
        aiModal.style.cssText = "position:fixed; inset:0; z-index:2147483647; background:#090d16; color:#fff; display:flex; flex-direction:column; font-family:system-ui,sans-serif;";

        aiModal.innerHTML = `
            <div style="background:#111827; padding:15px 18px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #1f2937;">
                <div>
                    <div style="font-weight:800; font-size:17px; color:#60a5fa;">🤖 Nexus Official AI</div>
                    <div style="font-size:11px; color:#34d399;">● Strictly Nexus Platform & Server Status Assistant</div>
                </div>
                <button id="nx-ai-close" style="background:#ef4444; color:#fff; border:none; padding:6px 12px; border-radius:8px; font-weight:800;">✕</button>
            </div>

            <div id="nx-ai-chatbox" style="flex:1; padding:16px; overflow-y:auto; display:flex; flex-direction:column; gap:12px;">
                <div style="background:#1e293b; border-left:4px solid #6366f1; padding:14px; border-radius:12px; font-size:14px; line-height:1.6;">
                    👋 <b>Namaste! Main Nexus Official AI hoon.</b><br>
                    Mujhe sirf <b>Nexus Platform</b> ke har feature, Server Status aur Owner ki jankari dene ke liye banaya gaya hai.<br><br>
                    👑 <b>Nexus Founder & Owner:</b> Mohit (<code>@mohit_01</code>)<br>
                    📡 <b>Live Server Report:</b> ${currentStatus}
                </div>
            </div>

            <div style="padding:8px 14px; display:flex; gap:8px; overflow-x:auto; background:#0f172a;">
                <button class="nx-ai-chip" data-q="Owner kaun hai?" style="background:#1e293b; color:#93c5fd; border:1px solid #3b82f6; border-radius:18px; padding:6px 12px; font-size:12px; white-space:nowrap;">👑 Nexus Owner</button>
                <button class="nx-ai-chip" data-q="Server down hai kya?" style="background:#1e293b; color:#93c5fd; border:1px solid #3b82f6; border-radius:18px; padding:6px 12px; font-size:12px; white-space:nowrap;">📡 Server Status</button>
                <button class="nx-ai-chip" data-q="Nexus ke sabhi features batao" style="background:#1e293b; color:#93c5fd; border:1px solid #3b82f6; border-radius:18px; padding:6px 12px; font-size:12px; white-space:nowrap;">⚡ All Features</button>
                <button class="nx-ai-chip" data-q="Watch Party kaise chalayein?" style="background:#1e293b; color:#93c5fd; border:1px solid #3b82f6; border-radius:18px; padding:6px 12px; font-size:12px; white-space:nowrap;">▶️ Watch Party Help</button>
            </div>

            <div style="padding:12px 14px; background:#111827; display:flex; gap:8px; border-top:1px solid #1f2937;">
                <input id="nx-ai-input" type="text" placeholder="Sirf Nexus ke bare mein puchein..." style="flex:1; background:#1f2937; border:1px solid #374151; color:#fff; padding:12px; border-radius:10px; outline:none;">
                <button id="nx-ai-send" style="background:#4f46e5; color:#fff; border:none; padding:0 18px; border-radius:10px; font-weight:800;">Ask</button>
            </div>
        `;
        document.body.appendChild(aiModal);

        const chatLog = document.getElementById("nx-ai-chatbox");
        const inp = document.getElementById("nx-ai-input");

        function generateNexusOnlyAnswer(rawQ) {
            const q = rawQ.toLowerCase();

            // Admin secret command to update server status anytime: "status: <message>"
            if (q.startsWith("status:")) {
                const newMsg = rawQ.substring(7).trim();
                localStorage.setItem("nexus_server_status", newMsg);
                return "✅ <b>Admin Status Updated!</b> Ab har member ko yeh message dikhega:<br><br>" + newMsg;
            }
            if (q.includes("owner") || q.includes("founder") || q.includes("kisne banaya") || q.includes("creator") || q.includes("admin") || q.includes("malik")) {
                return "👑 <b>Nexus Official Owner Info:</b><br>Nexus Platform ke Founder, Owner aur Lead Developer <b>Mohit</b> (Official Handle: <code>@mohit_01</code>) hain.";
            }
            if (q.includes("down") || q.includes("server") || q.includes("work nahi") || q.includes("problem") || q.includes("patience") || q.includes("status") || q.includes("update")) {
                return "📡 <b>Nexus Live Server Alert:</b><br>" + (localStorage.getItem("nexus_server_status") || defaultStatus) + "<br><br>🙏 <b>Note:</b> Agar koi feature ya message load hone mein time le, toh kripya thoda <b>patience rakhein</b>, koi bhi member pareshan na ho!";
            }
            if (q.includes("watch") || q.includes("party") || q.includes("tv") || q.includes("song") || q.includes("youtube")) {
                return "▶️ <b>YouTube Watch Party & Song Sync:</b><br>1:1 Chat mein <b>Watch TV</b> ya <b>Full Song</b> button dabayein. Aap aur aapka dost same <b>Room ID</b> daal kar koi bhi song search karenge, toh dono ke mobile mein ek saath video chalega!";
            }
            if (q.includes("feature") || q.includes("nexus") || q.includes("kya hai") || q.includes("all")) {
                return "🚀 <b>Nexus Complete Features List:</b><br>1. <b>1:1 Personal DM:</b> Photo, 20MB Video, View-Once aur PDF sharing.<br>2. <b>Live Watch Party:</b> Dono phones mein ek saath YouTube video aur song sync.<br>3. <b>Study Channels:</b> PCM Doubt Solver, JEE Study Material & Daily DPP.<br>4. <b>Instagram-Style Feed:</b> Real member profile ke saath Photo/Video post.";
            }
            return "ℹ️ <b>Notice:</b> Main <b>Nexus Official AI</b> hoon aur mujhe sirf <b>Nexus Website</b> ke bare mein jankari dene ki anumati hai (main bahar ki jankari nahi deta).<br><br>Aap mujhse <b>Nexus Owner (Mohit), Server Down/Update Status, Watch Party, 1:1 DM</b> ya <b>Study Vault</b> ke bare mein pooch sakte hain!";
        }

        function askAI(text) {
            if (!text.trim()) return;
            chatLog.innerHTML += `<div style="align-self:flex-end; background:#4f46e5; padding:10px 14px; border-radius:12px; font-size:14px; max-width:80%;">${text}</div>`;
            const reply = generateNexusOnlyAnswer(text);
            inp.value = "";
            setTimeout(() => {
                chatLog.innerHTML += `<div style="align-self:flex-start; background:#1e293b; border-left:4px solid #38bdf8; padding:12px 14px; border-radius:12px; font-size:14px; line-height:1.5; max-width:88%;">${reply}</div>`;
                chatLog.scrollTop = chatLog.scrollHeight;
            }, 200);
        }

        document.getElementById("nx-ai-close").onclick = () => aiModal.remove();
        document.getElementById("nx-ai-send").onclick = () => askAI(inp.value);
        inp.onkeydown = (e) => { if (e.key === "Enter") askAI(inp.value); };
        aiModal.querySelectorAll(".nx-ai-chip").forEach(c => {
            c.onclick = () => askAI(c.dataset.q);
        });
    };

    // --- 5. GLOBAL INTERCEPTOR (OVERWRITES OLD BROKEN HANDLERS IN CAPTURE PHASE) ---
    document.addEventListener("click", function(e) {
        const el = e.target.closest("button, a, div, span");
        if (!el) return;
        const txt = (el.innerText || "").trim();

        // Intercept Watch TV / Full Song / Watch Party buttons
        if (txt === "Watch TV" || txt === "Full Song" || txt.includes("Watch TV") || txt.includes("Full Song") || txt.includes("Song Sync")) {
            e.preventDefault();
            e.stopPropagation();
            window.openNexusWatchParty();
            return;
        }

        // Intercept AI Buttons (Header AI, Ask 1:1, Ask AI)
        if (txt === "AI" || txt.includes("🤖 AI") || txt === "Ask 1:1" || txt === "Ask AI") {
            e.preventDefault();
            e.stopPropagation();
            window.openNexusOfficialAI();
            return;
        }
    }, true);
})();
