/* ============================================================================
   NEXUS OFFICIAL POST.JS (V23 - INSTAGRAM/FACEBOOK CREATOR STUDIO)
   1. Permanently Replaces Broken/Overlapping '#tab-post-modal' (Fixes 1000076778.jpg!)
   2. 4 Official Post Modes:
      - 📸🎬 Photo / 50MB HD Video Post (Clean Inside-Card Preview & Fast Upload)
      - 🎨 Stylish Gradient Text Card (6 Instagram/Facebook Poster Backgrounds)
      - 📊 Live Interactive Poll (2 to 4 Options with Real-Time Firestore Voting!)
      - 🎵 Attach Real Music / Song (iTunes API) to Any Post
   3. Topic Tags (IIT-JEE, NEET, Coding, Doubt), Pin Toggle & Comments Toggle
   ============================================================================ */
(function () {
    if (window.__NEXUS_CREATOR_STUDIO_V23__) return;
    window.__NEXUS_CREATOR_STUDIO_V23__ = true;

    const CHUNK_CHAR_SIZE = 600000;
    const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
    const DRAFT_KEY = 'nx_post_studio_draft_v24';
    const escHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    let studioMode = "media"; // 'media' | 'card' | 'poll'
    let selectedCardGradient = "";
    let attachedMedia = { ref: "", mType: "", localUrl: "" };
    let attachedSong = null;
    let selectedTag = "🚀 General";
    let isUploadingMedia = false;
    let previewAudio = null;

    const CARD_GRADIENTS = [
        { id: "none", name: "Standard", css: "" },
        { id: "emerald", name: "Nexus Emerald", css: "linear-gradient(135deg, #064e3b 0%, #0f766e 50%, #0284c7 100%)" },
        { id: "cyber", name: "Cyber Neon", css: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #06b6d4 100%)" },
        { id: "sunset", name: "Sunset Fire", css: "linear-gradient(135deg, #7f1d1d 0%, #c2410c 50%, #f59e0b 100%)" },
        { id: "royal", name: "Royal Purple", css: "linear-gradient(135deg, #3b0764 0%, #7e22ce 50%, #ec4899 100%)" },
        { id: "gold", name: "Midnight Gold", css: "linear-gradient(135deg, #090d16 0%, #1e293b 50%, #ca8a04 100%)" }
    ];

    // Hide old broken #tab-post-modal and any stray video preview boxes (Fixes 1000076778.jpg!)
    const studioStyle = document.createElement("style");
    studioStyle.textContent = `
        #tab-post-modal, #nx-post-video-preview-box {
            display: none !important;
        }
    `;
    document.head.appendChild(studioStyle);

    function getActiveUser() {
        try {
            return JSON.parse(localStorage.getItem("nx_active_account") || "null");
        } catch (e) {
            return null;
        }
    }

    function isUserVerified() {
        if (typeof window.__nxIsUserVerified === "function") return window.__nxIsUserVerified();
        const me = getActiveUser();
        return Boolean(me && me.username && (me.googleVerified || me.verified));
    }

    async function trySupabaseStorageUpload(file, folder) {
        if (!window.NexusSecurity || typeof window.NexusSecurity.uploadPublicMedia !== "function") return "";
        try {
            const uid = await window.NexusSecurity.getAuthenticatedUserId();
            if (!uid) return "";
            const up = await window.NexusSecurity.uploadPublicMedia(file, folder);
            return (up && up.publicUrl) ? up.publicUrl : "";
        } catch (e) { return ""; }
    }

    function compressPhotoForPost(file) {
        return new Promise(async (resolve, reject) => {
            const sbUrl = await trySupabaseStorageUpload(file, "posts");
            if (sbUrl) { resolve(sbUrl); return; }
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const MAX = 840;
                    let w = img.width;
                    let h = img.height;
                    if (w > h && w > MAX) {
                        h = Math.round((h * MAX) / w);
                        w = MAX;
                    } else if (h > MAX) {
                        w = Math.round((w * MAX) / h);
                        h = MAX;
                    }
                    canvas.width = w;
                    canvas.height = h;
                    canvas.getContext("2d").drawImage(img, 0, 0, w, h);
                    let out = canvas.toDataURL("image/webp", 0.74);
                    if (!out || out.length < 50 || out.length > 145000) {
                        out = canvas.toDataURL("image/jpeg", 0.66);
                    }
                    resolve(out);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function uploadVideoInChunks(file, onProgress) {
        return new Promise(async (resolve, reject) => {
            onProgress && onProgress(25);
            const sbUrl = await trySupabaseStorageUpload(file, "videos");
            if (sbUrl) {
                onProgress && onProgress(100);
                resolve(sbUrl);
                return;
            }
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const b64 = e.target.result;
                    const total = Math.ceil(b64.length / CHUNK_CHAR_SIZE);
                    const sid = "postvid_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);

                    if (total === 1 && b64.length < 750000) {
                        onProgress && onProgress(100);
                        resolve(b64);
                        return;
                    }

                    for (let i = 0; i < total; i++) {
                        await Nexus.db
                            .collection("nexus_media_chunks")
                            .doc(`${sid}_${i}`)
                            .set({
                                streamId: sid,
                                index: i,
                                data: b64.slice(i * CHUNK_CHAR_SIZE, (i + 1) * CHUNK_CHAR_SIZE),
                                createdAt: Date.now()
                            });
                        onProgress && onProgress(Math.round(((i + 1) / total) * 100));
                    }
                    resolve(`NX_VIDEO_STREAM:${sid}:${total}`);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // =========================================================================
    // 1. OPEN OFFICIAL NEXUS CREATOR STUDIO MODAL (ZERO OVERLAP!)
    // =========================================================================
    window.openOfficialNexusCreatorStudio = function () {
        if (!isUserVerified()) {
            if (window.Nexus && Nexus.switchTab) Nexus.switchTab("tab-profile");
            if (window.Nexus && Nexus.toast) Nexus.toast("🔒 Pehle Account Verify karein!");
            return;
        }

        document.getElementById("nx-official-creator-studio")?.remove();
        const oldModal = document.getElementById("tab-post-modal");
        if (oldModal) oldModal.style.display = "none";

        const me = getActiveUser() || { username: "member", name: "Member", dp: "" };
        studioMode = "media";
        selectedCardGradient = "";
        attachedMedia = { ref: "", mType: "", localUrl: "" };
        attachedSong = null;
        isUploadingMedia = false;

        // Push state so hardware back button closes studio instead of exiting website!
        if (window.__nxPushBackLayer) {
            window.__nxPushBackLayer("nx-official-creator-studio", () => {
                if (previewAudio) previewAudio.pause();
                document.getElementById("nx-official-creator-studio")?.remove();
            });
        }

        const modal = document.createElement("div");
        modal.id = "nx-official-creator-studio";
        modal.style.cssText =
            "position:fixed; left:0; right:0; top:0; height:100dvh; background:rgba(2,6,23,0.94); z-index:272000; display:flex; align-items:flex-end; justify-content:center; backdrop-filter:blur(8px); box-sizing:border-box;";

        const dpHtml = me.dp
            ? `<img src="${me.dp}" style="width:42px; height:42px; border-radius:50%; object-fit:cover; border:2px solid #10b981;" />`
            : `<div style="width:42px; height:42px; border-radius:50%; background:linear-gradient(135deg,#10b981,#0284c7); color:#020617; font-weight:900; font-size:17px; display:flex; align-items:center; justify-content:center;">${(
                  me.name || me.username
              )[0].toUpperCase()}</div>`;

        modal.innerHTML = `
            <div style="background:#0f172a; border-top:1.5px solid #10b981; border-radius:24px 24px 0 0; width:100%; max-width:600px; max-height:92dvh; display:flex; flex-direction:column; color:#fff; box-shadow:0 -18px 50px rgba(0,0,0,0.95); overflow:hidden;">
                <!-- Studio Top Header -->
                <div style="padding:14px 16px; border-bottom:1px solid #1e293b; display:flex; align-items:center; justify-content:space-between; background:#090d16;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <button type="button" id="nx-studio-close" style="width:32px; height:32px; border-radius:50%; background:#1e293b; border:none; color:#f8fafc; font-weight:900; font-size:15px; cursor:pointer;">✕</button>
                        <div>
                            <div style="font-size:16px; font-weight:900; color:#f8fafc;">Create Official Post</div>
                            <div style="font-size:10.5px; color:#34d399; font-weight:700;">⚡ Nexus Creator Studio • Instant Cloud Sync</div>
                        </div>
                    </div>
                    <button type="button" id="nx-studio-publish-top" style="padding:8px 16px; border-radius:999px; background:linear-gradient(90deg,#10b981,#06b6d4); color:#020617; font-weight:900; font-size:12.5px; border:none; cursor:pointer;">
                        Publish 🚀
                    </button>
                </div>

                <!-- Scrollable Studio Body -->
                <div style="flex:1; overflow-y:auto; padding:14px 16px 24px; display:flex; flex-direction:column; gap:12px;">
                    <!-- Author Info & Stream Tag Selector -->
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            ${dpHtml}
                            <div>
                                <div style="font-size:14px; font-weight:900; color:#f8fafc;">${me.name || me.username} ✅</div>
                                <div style="font-size:11px; color:#94a3b8;">@${me.username} • Public Feed</div>
                            </div>
                        </div>

                        <select id="nx-studio-tag" style="padding:7px 10px; border-radius:10px; background:#090d16; border:1px solid #334155; color:#38bdf8; font-size:11.5px; font-weight:800; outline:none;">
                            <option value="🚀 General">🚀 General</option>
                            <option value="⚛️ IIT-JEE">⚛️ IIT-JEE</option>
                            <option value="🩺 NEET">🩺 NEET</option>
                            <option value="💻 Coding & Tech">💻 Coding & Tech</option>
                            <option value="❓ Doubt Solver">❓ Doubt Solver</option>
                        </select>
                    </div>

                    <!-- 3 Post Format Tabs (Photo/Video | Gradient Card | Live Poll) -->
                    <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px; background:#090d16; padding:4px; border-radius:13px; border:1px solid #1e293b;">
                        <button type="button" class="nx-st-mode-btn" data-smode="media" style="padding:8px 4px; border-radius:9px; border:none; background:#1e293b; color:#34d399; font-size:11.5px; font-weight:900; cursor:pointer;">
                            📸🎬 Photo / Video
                        </button>
                        <button type="button" class="nx-st-mode-btn" data-smode="card" style="padding:8px 4px; border-radius:9px; border:none; background:transparent; color:#94a3b8; font-size:11.5px; font-weight:800; cursor:pointer;">
                            🎨 Text Card
                        </button>
                        <button type="button" class="nx-st-mode-btn" data-smode="poll" style="padding:8px 4px; border-radius:9px; border:none; background:transparent; color:#94a3b8; font-size:11.5px; font-weight:800; cursor:pointer;">
                            📊 Live Poll
                        </button>
                    </div>

                    <!-- Main Caption / Question Textarea + Live Counter + Quick Hashtag & JEE Formula Chips -->
                    <div id="nx-studio-text-wrap" style="border-radius:16px; border:1px solid #334155; background:#090d16; padding:12px; transition:all 0.2s ease;">
                        <textarea id="nx-studio-caption" rows="4" maxlength="2000" placeholder="What's on your mind? Share a photo, video, JEE/NEET formula, doubt or update..." style="width:100%; background:transparent; border:none; color:#f8fafc; font-size:14px; line-height:1.5; outline:none; resize:none;"></textarea>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; padding-top:6px; border-top:1px solid rgba(51,65,85,0.45); font-size:10.5px; color:#94a3b8;">
                            <span id="nx-studio-draft-badge" style="color:#34d399; font-weight:700;">💾 Auto-draft active</span>
                            <span id="nx-studio-char-cnt">0 / 2000</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:6px; overflow-x:auto; scrollbar-width:none; padding-bottom:2px;">
                        ${["#IITJEE", "#NEET", "#Coding", "#Doubt", "∫", "∑", "√", "π", "Δ", "θ", "→"].map(tok =>
                            `<button type="button" class="nx-st-quick-tok" data-tok="${tok}" style="padding:4px 10px; border-radius:99px; background:#090d16; border:1px solid #334155; color:#38bdf8; font-size:11px; font-weight:800; white-space:nowrap; cursor:pointer; flex-shrink:0;">${tok}</button>`
                        ).join("")}
                    </div>

                    <!-- MODE 1: PHOTO / 50MB VIDEO UPLOAD & CLEAN INSIDE-CARD PREVIEW -->
                    <div id="nx-studio-media-panel">
                        <label for="nx-inp-studio-media" style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:18px 14px; border-radius:16px; border:1.5px dashed #10b981; background:rgba(16,185,129,0.06); cursor:pointer; text-align:center;">
                            <div style="font-size:26px; margin-bottom:4px;">📸 🎬</div>
                            <div style="font-size:13.5px; font-weight:900; color:#34d399;">Tap to Select HD Photo or Video (Up to 50MB)</div>
                            <div id="nx-studio-upload-lbl" style="font-size:11px; color:#94a3b8; margin-top:3px;">Instant inside-card preview • Zero overlap</div>
                        </label>
                        <!-- ID starts with 'nx-inp-' so old scripts never inject duplicate side boxes! -->
                        <input type="file" id="nx-inp-studio-media" accept="image/*,video/mp4,video/webm,video/*" style="display:none;" />

                        <!-- Clean Full-Width Media Preview Container -->
                        <div id="nx-studio-preview-stage" style="display:none; margin-top:10px; position:relative; border-radius:16px; overflow:hidden; border:1.5px solid #334155; background:#000;"></div>
                    </div>

                    <!-- MODE 2: STYLISH GRADIENT CARD PICKER (LIKE INSTAGRAM/FACEBOOK) -->
                    <div id="nx-studio-card-panel" style="display:none;">
                        <div style="font-size:11px; font-weight:800; color:#94a3b8; margin-bottom:6px;">CHOOSE POSTER CARD BACKGROUND</div>
                        <div style="display:flex; gap:8px; overflow-x:auto; padding-bottom:4px;">
                            ${CARD_GRADIENTS.map(
                                (g) => `
                                <button type="button" data-grad="${g.css}" style="padding:8px 12px; border-radius:10px; border:1.5px solid #334155; background:${
                                    g.css || "#090d16"
                                }; color:#fff; font-size:11px; font-weight:800; white-space:nowrap; cursor:pointer; flex-shrink:0;">
                                    ${g.name}
                                </button>
                            `
                            ).join("")}
                        </div>
                    </div>

                    <!-- MODE 3: LIVE INTERACTIVE POLL BUILDER -->
                    <div id="nx-studio-poll-panel" style="display:none; background:#090d16; border:1px solid #1e293b; border-radius:16px; padding:12px;">
                        <div style="font-size:11px; font-weight:900; color:#38bdf8; margin-bottom:8px;">📊 POLL OPTIONS (MEMBERS VOTE LIVE ON FEED)</div>
                        <div style="display:flex; flex-direction:column; gap:8px;">
                            <input type="text" class="nx-poll-opt-inp" placeholder="Option 1 (e.g. Option A / Yes)" style="width:100%; padding:10px 12px; border-radius:10px; background:#0f172a; border:1px solid #334155; color:#fff; font-size:12.5px; outline:none;" />
                            <input type="text" class="nx-poll-opt-inp" placeholder="Option 2 (e.g. Option B / No)" style="width:100%; padding:10px 12px; border-radius:10px; background:#0f172a; border:1px solid #334155; color:#fff; font-size:12.5px; outline:none;" />
                            <input type="text" class="nx-poll-opt-inp" placeholder="Option 3 (Optional)" style="width:100%; padding:10px 12px; border-radius:10px; background:#0f172a; border:1px solid #334155; color:#fff; font-size:12.5px; outline:none;" />
                            <input type="text" class="nx-poll-opt-inp" placeholder="Option 4 (Optional)" style="width:100%; padding:10px 12px; border-radius:10px; background:#0f172a; border:1px solid #334155; color:#fff; font-size:12.5px; outline:none;" />
                        </div>
                    </div>

                    <!-- 🎵 ATTACH SONG / MUSIC TO POST -->
                    <div style="background:#090d16; border:1px solid #1e293b; border-radius:14px; padding:10px 12px;">
                        <div style="display:flex; align-items:center; justify-content:space-between;">
                            <div style="display:flex; align-items:center; gap:8px; min-width:0;">
                                <span>🎵</span>
                                <span id="nx-studio-song-lbl" style="font-size:12px; font-weight:800; color:#cbd5e1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Add Background Song to Post (Optional)</span>
                            </div>
                            <button type="button" id="nx-studio-song-toggle" style="padding:5px 11px; border-radius:999px; background:#1e293b; border:1px solid #334155; color:#38bdf8; font-size:11px; font-weight:800; cursor:pointer; flex-shrink:0;">
                                + Search Song
                            </button>
                        </div>
                        <div id="nx-studio-song-box" style="display:none; margin-top:10px; padding-top:10px; border-top:1px solid #1e293b;">
                            <div style="display:flex; gap:6px; margin-bottom:8px;">
                                <input type="text" id="nx-st-song-q" placeholder="Type song or artist..." style="flex:1; padding:8px 11px; border-radius:9px; background:#0f172a; border:1px solid #334155; color:#fff; font-size:12px; outline:none;" />
                                <button type="button" id="nx-st-song-btn" style="padding:8px 12px; border-radius:9px; background:#10b981; color:#020617; font-weight:900; font-size:11.5px; border:none; cursor:pointer;">Find</button>
                            </div>
                            <div id="nx-st-song-res" style="max-height:130px; overflow-y:auto; display:flex; flex-direction:column; gap:6px;"></div>
                        </div>
                    </div>

                    <!-- Advanced Post Settings Row (Pin to Top & Comments) -->
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                        <label style="display:flex; align-items:center; gap:8px; padding:10px 12px; border-radius:12px; background:#090d16; border:1px solid #1e293b; font-size:12px; font-weight:800; color:#fbbf24; cursor:pointer;">
                            <input type="checkbox" id="nx-studio-pin" style="width:16px; height:16px;" />
                            <span>📌 Pin to Profile</span>
                        </label>
                        <label style="display:flex; align-items:center; gap:8px; padding:10px 12px; border-radius:12px; background:#090d16; border:1px solid #1e293b; font-size:12px; font-weight:800; color:#34d399; cursor:pointer;">
                            <input type="checkbox" id="nx-studio-comments" checked style="width:16px; height:16px;" />
                            <span>💬 Allow Comments</span>
                        </label>
                    </div>

                    <!-- Main Bottom Publish Button -->
                    <button type="button" id="nx-studio-publish-main" style="width:100%; padding:14px; border-radius:15px; background:linear-gradient(90deg,#10b981,#06b6d4); color:#020617; font-weight:900; font-size:14px; border:none; cursor:pointer; box-shadow:0 8px 25px rgba(16,185,129,0.35);">
                        🚀 Publish Official Post Now
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const syncStudioVp = () => {
            if (!modal.isConnected || !window.visualViewport) return;
            modal.style.height = Math.max(240, Math.round(window.visualViewport.height)) + "px";
            modal.style.top = Math.max(0, Math.round(window.visualViewport.offsetTop)) + "px";
        };
        const closeStudio = () => {
            if (previewAudio) previewAudio.pause();
            if (window.visualViewport) {
                window.visualViewport.removeEventListener("resize", syncStudioVp);
                window.visualViewport.removeEventListener("scroll", syncStudioVp);
            }
            modal.remove();
        };
        if (window.visualViewport) {
            window.visualViewport.addEventListener("resize", syncStudioVp);
            window.visualViewport.addEventListener("scroll", syncStudioVp);
            syncStudioVp();
        }
        modal.querySelector("#nx-studio-close").onclick = closeStudio;

        // Mode Switching (Photo/Video vs Gradient Card vs Poll)
        const textWrap = modal.querySelector("#nx-studio-text-wrap");
        const txtArea = modal.querySelector("#nx-studio-caption");
        const charCnt = modal.querySelector("#nx-studio-char-cnt");
        const draftBadge = modal.querySelector("#nx-studio-draft-badge");

        // Restore saved draft if present
        try {
            const savedDraft = localStorage.getItem(DRAFT_KEY) || "";
            if (savedDraft) {
                txtArea.value = savedDraft;
                if (charCnt) charCnt.textContent = `${savedDraft.length} / 2000`;
                if (draftBadge) draftBadge.textContent = "📝 Draft restored!";
            }
        } catch (e) {}

        txtArea.addEventListener("input", () => {
            const v = txtArea.value || "";
            if (charCnt) charCnt.textContent = `${v.length} / 2000`;
            try {
                if (v.trim()) localStorage.setItem(DRAFT_KEY, v);
                else localStorage.removeItem(DRAFT_KEY);
            } catch (e) {}
        });

        modal.querySelectorAll(".nx-st-quick-tok").forEach((b) => {
            b.onclick = () => {
                const tok = b.getAttribute("data-tok") || "";
                const spacer = txtArea.value && !txtArea.value.endsWith(" ") ? " " : "";
                txtArea.value = (txtArea.value + spacer + tok + " ").slice(0, 2000);
                txtArea.dispatchEvent(new Event("input"));
                txtArea.focus();
            };
        });
        const mediaPanel = modal.querySelector("#nx-studio-media-panel");
        const cardPanel = modal.querySelector("#nx-studio-card-panel");
        const pollPanel = modal.querySelector("#nx-studio-poll-panel");

        modal.querySelectorAll(".nx-st-mode-btn").forEach((btn) => {
            btn.onclick = () => {
                studioMode = btn.getAttribute("data-smode");
                modal.querySelectorAll(".nx-st-mode-btn").forEach((b) => {
                    const active = b.getAttribute("data-smode") === studioMode;
                    b.style.background = active ? "#1e293b" : "transparent";
                    b.style.color = active ? "#34d399" : "#94a3b8";
                });
                mediaPanel.style.display = studioMode === "media" ? "block" : "none";
                cardPanel.style.display = studioMode === "card" ? "block" : "none";
                pollPanel.style.display = studioMode === "poll" ? "block" : "none";

                if (studioMode !== "card") {
                    textWrap.style.background = "#090d16";
                    txtArea.style.textAlign = "left";
                    txtArea.style.fontWeight = "500";
                    txtArea.style.fontSize = "14px";
                }
            };
        });

        // Gradient Card Background Picker
        modal.querySelectorAll("[data-grad]").forEach((gBtn) => {
            gBtn.onclick = () => {
                selectedCardGradient = gBtn.getAttribute("data-grad") || "";
                if (selectedCardGradient) {
                    textWrap.style.background = selectedCardGradient;
                    textWrap.style.padding = "26px 18px";
                    txtArea.style.textAlign = "center";
                    txtArea.style.fontWeight = "900";
                    txtArea.style.fontSize = "18px";
                } else {
                    textWrap.style.background = "#090d16";
                    textWrap.style.padding = "12px";
                    txtArea.style.textAlign = "left";
                    txtArea.style.fontWeight = "500";
                    txtArea.style.fontSize = "14px";
                }
            };
        });

        // Photo & 50MB Video Upload with Clean Inside-Card Preview
        const fileInp = modal.querySelector("#nx-inp-studio-media");
        const prevStage = modal.querySelector("#nx-studio-preview-stage");
        const upLbl = modal.querySelector("#nx-studio-upload-lbl");

        fileInp.onchange = async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            if (file.size > MAX_VIDEO_BYTES) {
                alert("⚠️ File 50MB se chhoti honi chahiye!");
                return;
            }

            const localUrl = URL.createObjectURL(file);
            prevStage.style.display = "block";
            isUploadingMedia = true;

            if (file.type.startsWith("video/")) {
                prevStage.innerHTML = `
                    <video src="${localUrl}" controls playsinline style="width:100%; max-height:260px; display:block; background:#000;"></video>
                    <div style="padding:8px 12px; background:#090d16; display:flex; align-items:center; justify-content:space-between;">
                        <span id="nx-st-prog-txt" style="font-size:12px; font-weight:800; color:#38bdf8;">📤 Uploading Video 1%...</span>
                        <button type="button" id="nx-st-remove-media" style="background:#e11d48; border:none; color:#fff; padding:4px 10px; border-radius:8px; font-size:11px; font-weight:800; cursor:pointer;">Remove ✕</button>
                    </div>
                `;
                prevStage.querySelector("#nx-st-remove-media").onclick = () => {
                    attachedMedia = { ref: "", mType: "", localUrl: "" };
                    isUploadingMedia = false;
                    prevStage.style.display = "none";
                    fileInp.value = "";
                };

                try {
                    const encodedRef = await uploadVideoInChunks(file, (pct) => {
                        const pEl = document.getElementById("nx-st-prog-txt");
                        if (pEl) pEl.textContent = `📤 Uploading HD Video ${pct}%...`;
                        upLbl.textContent = `Uploading Video ${pct}%...`;
                    });
                    attachedMedia = { ref: encodedRef, mType: "video", localUrl: localUrl };
                    isUploadingMedia = false;
                    const pEl = document.getElementById("nx-st-prog-txt");
                    if (pEl) {
                        pEl.textContent = "✅ HD Video Ready to Publish!";
                        pEl.style.color = "#34d399";
                    }
                    upLbl.textContent = "✅ Video Ready!";
                } catch (err) {
                    isUploadingMedia = false;
                    alert("⚠️ Network slow, try smaller video.");
                }
            } else {
                prevStage.innerHTML = `
                    <img src="${localUrl}" style="width:100%; max-height:280px; object-fit:cover; display:block;" />
                    <div style="padding:8px 12px; background:#090d16; display:flex; align-items:center; justify-content:space-between;">
                        <span id="nx-st-prog-txt" style="font-size:12px; font-weight:800; color:#34d399;">⏳ Optimizing HD Photo...</span>
                        <button type="button" id="nx-st-remove-media" style="background:#e11d48; border:none; color:#fff; padding:4px 10px; border-radius:8px; font-size:11px; font-weight:800; cursor:pointer;">Remove ✕</button>
                    </div>
                `;
                prevStage.querySelector("#nx-st-remove-media").onclick = () => {
                    attachedMedia = { ref: "", mType: "", localUrl: "" };
                    isUploadingMedia = false;
                    prevStage.style.display = "none";
                    fileInp.value = "";
                };

                const b64 = await compressPhotoForPost(file);
                attachedMedia = { ref: b64, mType: "image", localUrl: localUrl };
                isUploadingMedia = false;
                const pEl = document.getElementById("nx-st-prog-txt");
                if (pEl) pEl.textContent = "✅ HD Photo Ready to Publish!";
                upLbl.textContent = "✅ Photo Ready!";
            }
        };

        // Song Search & Attachment
        const songBox = modal.querySelector("#nx-studio-song-box");
        modal.querySelector("#nx-studio-song-toggle").onclick = () => {
            songBox.style.display = songBox.style.display === "none" ? "block" : "none";
        };

        modal.querySelector("#nx-st-song-btn").onclick = async () => {
            const q = (modal.querySelector("#nx-st-song-q").value || "").trim();
            const resDiv = modal.querySelector("#nx-st-song-res");
            if (!q) return;
            resDiv.innerHTML = `<div style="font-size:11.5px; color:#38bdf8; padding:6px;">⏳ Searching "${q}"...</div>`;
            try {
                const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=6`);
                const d = await r.json();
                const list = (d && d.results) || [];
                resDiv.innerHTML = list
                    .filter((t) => t.previewUrl)
                    .map(
                        (t, idx) => `
                        <div style="display:flex; align-items:center; justify-content:space-between; gap:6px; padding:6px 8px; background:#0f172a; border-radius:8px; border:1px solid #1e293b;">
                            <div style="font-size:11.5px; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; min-width:0;">
                                🎵 ${escHtml(t.trackName)} - ${escHtml(t.artistName)}
                            </div>
                            <div style="display:flex; gap:5px; flex-shrink:0;">
                                <button type="button" data-sprev="${escHtml(t.previewUrl)}" style="padding:4px 8px; border-radius:6px; background:#1e293b; color:#38bdf8; border:1px solid #334155; font-size:11px; font-weight:800; cursor:pointer;">▶️</button>
                                <button type="button" data-sidx="${idx}" style="padding:4px 9px; border-radius:6px; background:#10b981; color:#020617; border:none; font-size:11px; font-weight:900; cursor:pointer;">Select ✓</button>
                            </div>
                        </div>
                    `
                    )
                    .join("");

                resDiv.querySelectorAll("[data-sprev]").forEach((pb) => {
                    pb.onclick = () => {
                        const u = pb.getAttribute("data-sprev");
                        if (previewAudio && previewAudio.src === u && !previewAudio.paused) {
                            previewAudio.pause(); pb.textContent = "▶️"; return;
                        }
                        if (previewAudio) previewAudio.pause();
                        previewAudio = new Audio(u);
                        previewAudio.play().catch(() => {});
                        pb.textContent = "⏸️";
                        previewAudio.onended = () => { pb.textContent = "▶️"; };
                    };
                });

                resDiv.querySelectorAll("[data-sidx]").forEach((b) => {
                    b.onclick = () => {
                        const tr = list[Number(b.getAttribute("data-sidx"))];
                        attachedSong = {
                            title: tr.trackName,
                            artist: tr.artistName,
                            audioUrl: tr.previewUrl
                        };
                        modal.querySelector("#nx-studio-song-lbl").innerHTML = `<strong style="color:#34d399;">🎵 ${tr.trackName} (${tr.artistName})</strong>`;
                        songBox.style.display = "none";
                    };
                });
            } catch (e) {}
        };

        // Publish Execution
        const executePublish = async (btnEl) => {
            if (isUploadingMedia) {
                alert("⏳ Video abhi upload ho rahi hai, 100% hone ka wait karein!");
                return;
            }

            const rawText = (txtArea.value || "").trim();
            const tag = modal.querySelector("#nx-studio-tag").value || "🚀 General";
            const isPinned = modal.querySelector("#nx-studio-pin").checked;
            const allowComments = modal.querySelector("#nx-studio-comments").checked;

            let pollOptions = [];
            if (studioMode === "poll") {
                modal.querySelectorAll(".nx-poll-opt-inp").forEach((inp) => {
                    const v = (inp.value || "").trim();
                    if (v) pollOptions.push({ text: v, votes: 0 });
                });
                if (pollOptions.length < 2) {
                    alert("⚠️ Poll ke liye kam se kam 2 options likhein!");
                    return;
                }
            }

            if (!rawText && !attachedMedia.ref && !pollOptions.length) {
                alert("⚠️ Kuch likhein ya Photo/Video select karein!");
                return;
            }

            btnEl.disabled = true;
            btnEl.innerText = "⏳ Publishing...";

            let finalContent = rawText;
            if (tag && tag !== "🚀 General" && !finalContent.includes(tag)) {
                finalContent = `[${tag}] ${finalContent}`;
            }

            const postDoc = {
                username: me.username,
                author: me.name || me.username,
                bio: me.bio || "IIT-JEE Aspirant",
                dp: me.dp || "",
                verified: true,
                pinned: Boolean(isPinned),
                allowComments: Boolean(allowComments),
                topicTag: tag,
                content: finalContent,
                text: finalContent,
                image: attachedMedia.ref || "",
                videoUrl: attachedMedia.mType === "video" ? attachedMedia.ref : "",
                mediaType: attachedMedia.mType || (studioMode === "poll" ? "poll" : studioMode === "card" ? "card" : "text"),
                cardGradient: studioMode === "card" ? selectedCardGradient : "",
                pollOptions: pollOptions.length ? JSON.stringify(pollOptions) : "",
                poll: pollOptions.length ? { options: pollOptions, voters: {} } : null,
                postSong: attachedSong ? JSON.stringify(attachedSong) : "",
                songUrl: attachedSong ? attachedSong.audioUrl : "",
                songTitle: attachedSong ? `${attachedSong.title} • ${attachedSong.artist}` : "",
                songArtist: attachedSong ? attachedSong.artist : "",
                likes: 1,
                likedBy: [me.username],
                views: 1,
                comments: [],
                createdAt: Date.now()
            };

            try {
                let savedToSupabase = false;
                const sbClient = (window.NexusSecurity && window.NexusSecurity.sb) || (window.Nexus && Nexus.getSbClient && Nexus.getSbClient());

                // 1. SUPABASE FIRST: All new posts go into Supabase `posts` table!
                if (sbClient) {
                    try {
                        let uid = null;
                        if (window.NexusSecurity && typeof window.NexusSecurity.getAuthenticatedUserId === "function") {
                            uid = await window.NexusSecurity.getAuthenticatedUserId();
                        } else {
                            const { data: { session } } = await sbClient.auth.getSession();
                            uid = session && session.user ? session.user.id : null;
                        }
                        if (uid) {
                            const { data, error } = await sbClient.from("posts").insert({
                                author_id: uid,
                                author_username: me.username.toLowerCase().trim(),
                                author_name: me.name || me.username,
                                author_dp: me.dp || "",
                                bio: me.bio || "",
                                content: finalContent,
                                image_url: attachedMedia.ref || "",
                                media_type: postDoc.mediaType,
                                likes_list: [me.username.toLowerCase().trim()],
                                comments_list: [],
                                views_count: 1,
                                is_pinned: Boolean(isPinned)
                            }).select("id").single();
                            if (!error && data && data.id) {
                                postDoc.id = "sb_" + data.id;
                                postDoc.sbRawId = data.id;
                                savedToSupabase = true;
                            }
                        }
                    } catch (sbErr) {}
                }

                // 2. Fallback to Firebase ONLY if user is on a legacy Firebase-only login without Supabase session
                if (!savedToSupabase && window.Nexus && Nexus.db) {
                    const docRef = await Nexus.db.collection("nexus_real_posts").add(postDoc);
                    postDoc.id = docRef.id;
                }

                try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
                if (window.Nexus) {
                    if (savedToSupabase && Array.isArray(Nexus._sbPosts)) Nexus._sbPosts.unshift(postDoc);
                    else if (Array.isArray(Nexus._fbPosts)) Nexus._fbPosts.unshift(postDoc);
                    if (Nexus.syncDualCloudMerge) Nexus.syncDualCloudMerge();
                    else if (Array.isArray(Nexus.posts)) {
                        Nexus.posts.unshift(postDoc);
                        Nexus.notifyAll && Nexus.notifyAll();
                    }
                }
                closeStudio();
                if (window.Nexus && Nexus.switchTab) Nexus.switchTab("tab-home");
                if (window.Nexus && Nexus.toast) Nexus.toast("🚀 Official Post Published Live!");
            } catch (err) {
                btnEl.disabled = false;
                btnEl.innerText = "🚀 Publish Official Post Now";
                alert("⚠️ Network slow, please tap Publish again.");
            }
        };

        modal.querySelector("#nx-studio-publish-main").onclick = function () {
            executePublish(this);
        };
        modal.querySelector("#nx-studio-publish-top").onclick = function () {
            executePublish(this);
        };
    };

    // Override `Nexus.openPostModal` & intercept `+` FAB button so old broken modal NEVER opens!
    if (window.Nexus) {
        Nexus.openPostModal = window.openOfficialNexusCreatorStudio;
    }

    document.addEventListener(
        "click",
        (e) => {
            const fab = e.target.closest(".nx-fab-post");
            if (fab) {
                e.stopPropagation();
                e.preventDefault();
                window.openOfficialNexusCreatorStudio();
            }
        },
        true
    );

    setTimeout(() => {
        if (window.Nexus) Nexus.openPostModal = window.openOfficialNexusCreatorStudio;
    }, 500);
    window.addEventListener("load", () => {
        if (window.Nexus) Nexus.openPostModal = window.openOfficialNexusCreatorStudio;
    });
})();
