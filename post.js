/* ============================================================================
   NEXUS OFFICIAL POST.JS (V51 - FULL-SCREEN PRO CREATOR STUDIO + CLOUDINARY HLS)
   1. 100% Full-Screen App Page Layout (Zero Half-Modal, Zero Overlap, Keyboard-Safe)
   2. Cloudinary Free Direct Upload (Auto 2-Sec Instagram HLS + Auto HD Poster!)
      + Automatic Supabase 50MB Storage & Firebase Fallback
   3. Built-in Pro Photo Filters (Original, Vivid, Cinema, Soft Glow, B&W, Notes Scan)
   4. 4 Structured Modes: Photo/50MB Video | Gradient Card | Live Poll | Code/Formula
   5. Live Post Preview, Auto-Drafts, iTunes Music Picker, Quick JEE/Coding Chips
   ============================================================================ */
(function () {
    if (window.__NEXUS_CREATOR_STUDIO_V51__) return;
    window.__NEXUS_CREATOR_STUDIO_V51__ = true;
    window.__NEXUS_CREATOR_STUDIO_V23__ = true;

    // -------------------------------------------------------------------------
    // CLOUDINARY FREE 2-SECOND INSTAGRAM HLS CONFIG (25 GB FREE, NO CARD!)
    // Fill these 2 strings once (or set via ☁️ Cloudinary Setup button in Studio)
    // -------------------------------------------------------------------------
    const DEFAULT_CLOUDINARY_CLOUD = "";   // e.g. "dxyz12345"
    const DEFAULT_CLOUDINARY_PRESET = "";  // e.g. "nexus_unsigned"

    function getCloudinaryConfig() {
        return {
            cloud: (localStorage.getItem("nx_cld_cloud_name") || DEFAULT_CLOUDINARY_CLOUD || "").trim(),
            preset: (localStorage.getItem("nx_cld_upload_preset") || DEFAULT_CLOUDINARY_PRESET || "").trim()
        };
    }

    const CHUNK_CHAR_SIZE = 600000;
    const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
    const DRAFT_KEY = "nx_post_studio_draft_v51";
    const escHtml = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

    let studioMode = "media"; // 'media' | 'card' | 'poll' | 'code'
    let selectedCardGradient = "";
    let selectedPhotoFilter = "none";
    let attachedMedia = { ref: "", mType: "", localUrl: "", rawFile: null, posterUrl: "" };
    let attachedSong = null;
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

    const PHOTO_FILTERS = [
        { id: "none", name: "Original", css: "none" },
        { id: "vivid", name: "✨ Vivid", css: "contrast(1.12) saturate(1.26) brightness(1.03)" },
        { id: "cinema", name: "🎬 Cinema", css: "contrast(1.18) saturate(0.92) sepia(0.12)" },
        { id: "glow", name: "🌸 Soft Glow", css: "brightness(1.07) contrast(1.02) saturate(1.12)" },
        { id: "notes", name: "📄 Notes Scan", css: "contrast(1.38) brightness(1.08) saturate(0.35)" },
        { id: "bw", name: "🖤 B&W", css: "grayscale(1) contrast(1.2)" }
    ];

    // Full-Screen Studio CSS + Hide old broken #tab-post-modal
    if (!document.getElementById("nx-post-studio-v51-css")) {
        const studioStyle = document.createElement("style");
        studioStyle.id = "nx-post-studio-v51-css";
        studioStyle.textContent = `
            #tab-post-modal, #nx-post-video-preview-box { display: none !important; }
            #nx-official-creator-studio {
                position: fixed;
                inset: 0;
                width: 100%;
                height: 100dvh;
                z-index: 275000;
                background: #050811;
                display: flex;
                justify-content: center;
                box-sizing: border-box;
                overscroll-behavior: contain;
            }
            .nx-st-shell {
                width: 100%;
                max-width: 600px;
                height: 100%;
                background: #090d16;
                color: #f8fafc;
                display: flex;
                flex-direction: column;
                border-left: 1px solid #1e293b;
                border-right: 1px solid #1e293b;
                overflow: hidden;
            }
            .nx-st-scroll::-webkit-scrollbar { display: none; }
            .nx-st-chip-row {
                display: flex;
                gap: 6px;
                overflow-x: auto;
                scrollbar-width: none;
                padding-bottom: 2px;
            }
            .nx-st-chip-row::-webkit-scrollbar { display: none; }
            .nx-st-prog-track {
                width: 100%;
                height: 6px;
                background: #1e293b;
                border-radius: 99px;
                overflow: hidden;
                margin-top: 6px;
            }
            .nx-st-prog-bar {
                height: 100%;
                width: 0%;
                background: linear-gradient(90deg, #10b981, #38bdf8);
                transition: width 0.15s ease;
            }
        `;
        document.head.appendChild(studioStyle);
    }

    function getActiveUser() {
        try { return JSON.parse(localStorage.getItem("nx_active_account") || "null"); }
        catch (e) { return null; }
    }

    function isUserVerified() {
        if (typeof window.__nxIsUserVerified === "function") return window.__nxIsUserVerified();
        const me = getActiveUser();
        return Boolean(me && me.username && (me.googleVerified || me.verified));
    }

    function getFilterCss(fid) {
        const hit = PHOTO_FILTERS.find((x) => x.id === fid);
        return hit ? hit.css : "none";
    }

    // -------------------------------------------------------------------------
    // EXTERNAL ENGINE 1: CLOUDINARY FREE DIRECT UNSIGNED UPLOAD (25 GB FREE!)
    // Gives automatic 2-second HLS streaming (.m3u8) + automatic HD Poster (.jpg)
    // -------------------------------------------------------------------------
    function uploadToCloudinary(file, resourceType, onProgress) {
        return new Promise((resolve) => {
            const cfg = getCloudinaryConfig();
            if (!cfg.cloud || !cfg.preset) return resolve(null);

            const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(cfg.cloud)}/${resourceType}/upload`;
            const fd = new FormData();
            fd.append("file", file);
            fd.append("upload_preset", cfg.preset);
            fd.append("folder", resourceType === "video" ? "nexus_reels" : "nexus_posts");

            const xhr = new XMLHttpRequest();
            xhr.upload.onprogress = (ev) => {
                if (ev.lengthComputable && onProgress) {
                    onProgress(Math.min(96, Math.round((ev.loaded / ev.total) * 96)));
                }
            };
            xhr.onload = () => {
                try {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        const data = JSON.parse(xhr.responseText || "{}");
                        if (data && data.secure_url) {
                            onProgress && onProgress(100);
                            return resolve(data.secure_url);
                        }
                    }
                } catch (e) {}
                resolve(null);
            };
            xhr.onerror = () => resolve(null);
            xhr.open("POST", endpoint, true);
            xhr.send(fd);
        });
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

    // Bake selected Photo Filter onto canvas -> Crisp WebP Blob/DataURL
    function renderFilteredPhotoBlob(file, filterCss) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    const MAX = 1080;
                    let w = img.width, h = img.height;
                    if (w > h && w > MAX) { h = Math.round((h * MAX) / w); w = MAX; }
                    else if (h > MAX) { w = Math.round((w * MAX) / h); h = MAX; }
                    canvas.width = w; canvas.height = h;
                    const ctx = canvas.getContext("2d");
                    if (filterCss && filterCss !== "none") ctx.filter = filterCss;
                    ctx.drawImage(img, 0, 0, w, h);
                    canvas.toBlob((blob) => {
                        let dataUrl = canvas.toDataURL("image/webp", 0.78);
                        if (!dataUrl || dataUrl.length > 155000) dataUrl = canvas.toDataURL("image/jpeg", 0.68);
                        resolve({ blob, dataUrl });
                    }, "image/webp", 0.82);
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async function uploadPhotoSmart(file, filterCss, onProgress) {
        onProgress && onProgress(15);
        let fileToUpload = file;
        let fallbackDataUrl = "";
        try {
            const processed = await renderFilteredPhotoBlob(file, filterCss);
            if (processed && processed.blob) {
                fileToUpload = new File([processed.blob], "nexus_photo.webp", { type: "image/webp" });
            }
            fallbackDataUrl = (processed && processed.dataUrl) || "";
        } catch (e) {}

        // 1. Cloudinary Free CDN first (if configured) -> 0 KB Supabase Egress!
        const cldUrl = await uploadToCloudinary(fileToUpload, "image", onProgress);
        if (cldUrl) return cldUrl;

        // 2. Supabase Storage (1-year CDN cacheControl)
        onProgress && onProgress(55);
        const sbUrl = await trySupabaseStorageUpload(fileToUpload, "posts");
        if (sbUrl) { onProgress && onProgress(100); return sbUrl; }

        // 3. Inline WebP fallback
        onProgress && onProgress(100);
        return fallbackDataUrl;
    }

    function uploadVideoSmart(file, onProgress) {
        return new Promise(async (resolve, reject) => {
            // 1. Cloudinary Free HLS CDN first (Auto 2-second Instagram streaming + Auto HD Thumbnail!)
            const cldUrl = await uploadToCloudinary(file, "video", onProgress);
            if (cldUrl) { resolve(cldUrl); return; }

            // 2. Supabase 50MB Storage (with 1-year CDN cache)
            onProgress && onProgress(25);
            const sbUrl = await trySupabaseStorageUpload(file, "videos");
            if (sbUrl) { onProgress && onProgress(100); resolve(sbUrl); return; }

            // 3. Legacy Firebase Chunk Fallback
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
                        await Nexus.db.collection("nexus_media_chunks").doc(`${sid}_${i}`).set({
                            streamId: sid, index: i,
                            data: b64.slice(i * CHUNK_CHAR_SIZE, (i + 1) * CHUNK_CHAR_SIZE),
                            createdAt: Date.now()
                        });
                        onProgress && onProgress(Math.round(((i + 1) / total) * 100));
                    }
                    resolve(`NX_VIDEO_STREAM:${sid}:${total}`);
                } catch (err) { reject(err); }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Extract instant HD thumbnail frame from video locally for Studio preview
    function captureVideoPosterDataUrl(videoFile) {
        return new Promise((resolve) => {
            const url = URL.createObjectURL(videoFile);
            const v = document.createElement("video");
            v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = url;
            const done = (out) => { try { URL.revokeObjectURL(url); } catch (e) {} resolve(out || ""); };
            v.onloadeddata = () => {
                try { v.currentTime = Math.min(0.25, (v.duration || 1) * 0.1); } catch (e) { done(""); }
            };
            v.onseeked = () => {
                try {
                    const c = document.createElement("canvas");
                    const scale = Math.min(1, 640 / Math.max(v.videoWidth || 640, 1));
                    c.width = Math.round((v.videoWidth || 640) * scale);
                    c.height = Math.round((v.videoHeight || 360) * scale);
                    c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
                    done(c.toDataURL("image/webp", 0.72));
                } catch (e) { done(""); }
            };
            v.onerror = () => done("");
            setTimeout(() => done(""), 3500);
        });
    }

    // 1-Tap Cloudinary Setup Dialog (Lets Founder connect 25GB Free HLS right from phone!)
    function openCloudinarySetupDialog(onSaved) {
        document.getElementById("nx-cld-setup-modal")?.remove();
        const cfg = getCloudinaryConfig();
        const box = document.createElement("div");
        box.id = "nx-cld-setup-modal";
        box.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,.92);z-index:295000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(8px);";
        box.innerHTML = `
            <div style="background:#0f172a;border:1.5px solid #38bdf8;border-radius:20px;width:100%;max-width:400px;padding:18px;color:#fff;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <h3 style="font-size:15px;font-weight:900;color:#38bdf8;">☁️ Cloudinary Free HLS Setup</h3>
                    <button type="button" id="nx-cldx" style="width:28px;height:28px;border-radius:50%;background:#1e293b;border:none;color:#fff;cursor:pointer;">✕</button>
                </div>
                <p style="font-size:11.5px;color:#94a3b8;line-height:1.45;margin-bottom:10px;">
                    Cloudinary Free account (25 GB/mo, no card) connect karne par saare naye videos <b>2-second Instagram HLS chunks (.m3u8)</b> + <b>Auto HD Thumbnail</b> ke saath chalenge aur Supabase Egress <b>0 KB</b> kharch hoga!
                </p>
                <label style="font-size:10.5px;font-weight:800;color:#cbd5e1;">CLOUD NAME (Dashboard par dikhega)</label>
                <input id="nx-cld-name" value="${escHtml(cfg.cloud)}" placeholder="e.g. dxyz12345" style="width:100%;padding:10px 12px;border-radius:10px;background:#090d16;border:1px solid #334155;color:#fff;font-size:13px;margin:4px 0 10px;outline:none;">
                <label style="font-size:10.5px;font-weight:800;color:#cbd5e1;">UNSIGNED UPLOAD PRESET</label>
                <input id="nx-cld-preset" value="${escHtml(cfg.preset)}" placeholder="e.g. nexus_unsigned" style="width:100%;padding:10px 12px;border-radius:10px;background:#090d16;border:1px solid #334155;color:#fff;font-size:13px;margin:4px 0 12px;outline:none;">
                <div style="display:flex;gap:8px;">
                    <button type="button" id="nx-cld-save" style="flex:1;padding:11px;border-radius:11px;background:linear-gradient(90deg,#10b981,#06b6d4);color:#020617;font-weight:900;font-size:13px;border:none;cursor:pointer;">💾 Save &amp; Activate HLS</button>
                    <button type="button" id="nx-cld-clear" style="padding:11px 12px;border-radius:11px;background:#1e293b;color:#fb7185;border:1px solid #334155;font-weight:800;font-size:12px;cursor:pointer;">Reset</button>
                </div>
            </div>
        `;
        document.body.appendChild(box);
        box.querySelector("#nx-cldx").onclick = () => box.remove();
        box.onclick = (e) => { if (e.target === box) box.remove(); };
        box.querySelector("#nx-cld-save").onclick = () => {
            const c = box.querySelector("#nx-cld-name").value.trim();
            const p = box.querySelector("#nx-cld-preset").value.trim();
            localStorage.setItem("nx_cld_cloud_name", c);
            localStorage.setItem("nx_cld_upload_preset", p);
            box.remove();
            if (window.Nexus && Nexus.toast) Nexus.toast(c && p ? "☁️ Cloudinary 2s HLS Active!" : "☁️ Using Supabase Storage");
            if (onSaved) onSaved();
        };
        box.querySelector("#nx-cld-clear").onclick = () => {
            localStorage.removeItem("nx_cld_cloud_name");
            localStorage.removeItem("nx_cld_upload_preset");
            box.remove();
            if (onSaved) onSaved();
        };
    }

    // =========================================================================
    // 1. OPEN 100% FULL-SCREEN NEXUS CREATOR STUDIO PAGE
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
        selectedPhotoFilter = "none";
        attachedMedia = { ref: "", mType: "", localUrl: "", rawFile: null, posterUrl: "" };
        attachedSong = null;
        isUploadingMedia = false;

        if (window.__nxPushBackLayer) {
            window.__nxPushBackLayer("nx-official-creator-studio", () => {
                if (previewAudio) previewAudio.pause();
                document.getElementById("nx-official-creator-studio")?.remove();
            });
        }

        const cldCfg = getCloudinaryConfig();
        const cldActive = Boolean(cldCfg.cloud && cldCfg.preset);

        const modal = document.createElement("div");
        modal.id = "nx-official-creator-studio";

        const dpHtml = me.dp
            ? `<img src="${me.dp}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;border:2px solid #10b981;flex-shrink:0;" />`
            : `<div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#10b981,#0284c7);color:#020617;font-weight:900;font-size:17px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${(me.name || me.username)[0].toUpperCase()}</div>`;

        modal.innerHTML = `
            <div class="nx-st-shell">
                <!-- FULL-SCREEN STICKY APP HEADER -->
                <header style="padding:12px 14px;border-bottom:1px solid #1e293b;display:flex;align-items:center;justify-content:space-between;background:#0b1120;flex-shrink:0;">
                    <div style="display:flex;align-items:center;gap:10px;min-width:0;">
                        <button type="button" id="nx-studio-close" style="width:36px;height:36px;border-radius:12px;background:#1e293b;border:1px solid #334155;color:#f8fafc;font-weight:900;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;">←</button>
                        <div style="min-width:0;">
                            <div style="font-size:16px;font-weight:900;color:#f8fafc;letter-spacing:-0.2px;">Create Post</div>
                            <div id="nx-st-cdn-pill" style="font-size:10px;color:${cldActive ? "#34d399" : "#38bdf8"};font-weight:800;cursor:pointer;">
                                ${cldActive ? "☁️ Cloudinary 2s HLS Active • Tap to edit" : "⚡ Supabase CDN • Tap to connect Cloudinary HLS"}
                            </div>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <button type="button" id="nx-st-preview-btn" style="padding:8px 11px;border-radius:999px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;font-weight:800;font-size:11.5px;cursor:pointer;">👁️ Preview</button>
                        <button type="button" id="nx-studio-publish-top" style="padding:8px 16px;border-radius:999px;background:linear-gradient(90deg,#10b981,#06b6d4);color:#020617;font-weight:900;font-size:12.5px;border:none;cursor:pointer;box-shadow:0 4px 14px rgba(16,185,129,0.35);">Publish 🚀</button>
                    </div>
                </header>

                <!-- FULL-SCREEN STRUCTURED SCROLL BODY -->
                <div class="nx-st-scroll" style="flex:1;overflow-y:auto;padding:14px 14px 28px;display:flex;flex-direction:column;gap:13px;">
                    <!-- Row 1: Author Identity + Topic Category -->
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;background:#0f172a;padding:10px 12px;border-radius:16px;border:1px solid #1e293b;">
                        <div style="display:flex;align-items:center;gap:10px;min-width:0;">
                            ${dpHtml}
                            <div style="min-width:0;">
                                <div style="font-size:14px;font-weight:900;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(me.name || me.username)} ✅</div>
                                <div style="font-size:11px;color:#94a3b8;">@${escHtml(me.username)} • 🌐 Public Feed</div>
                            </div>
                        </div>
                        <select id="nx-studio-tag" style="padding:7px 10px;border-radius:10px;background:#090d16;border:1px solid #334155;color:#38bdf8;font-size:11.5px;font-weight:800;outline:none;">
                            <option value="🚀 General">🚀 General</option>
                            <option value="⚛️ IIT-JEE">⚛️ IIT-JEE</option>
                            <option value="🩺 NEET">🩺 NEET</option>
                            <option value="💻 Coding & Tech">💻 Coding &amp; Tech</option>
                            <option value="❓ Doubt Solver">❓ Doubt Solver</option>
                            <option value="🔥 Motivation">🔥 Motivation</option>
                        </select>
                    </div>

                    <!-- Row 2: 4 Clean Composer Modes -->
                    <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:5px;background:#0f172a;padding:4px;border-radius:14px;border:1px solid #1e293b;">
                        <button type="button" class="nx-st-mode-btn" data-smode="media" style="padding:9px 2px;border-radius:10px;border:none;background:#1e293b;color:#34d399;font-size:11px;font-weight:900;cursor:pointer;">📸 Media</button>
                        <button type="button" class="nx-st-mode-btn" data-smode="card" style="padding:9px 2px;border-radius:10px;border:none;background:transparent;color:#94a3b8;font-size:11px;font-weight:800;cursor:pointer;">🎨 Card</button>
                        <button type="button" class="nx-st-mode-btn" data-smode="poll" style="padding:9px 2px;border-radius:10px;border:none;background:transparent;color:#94a3b8;font-size:11px;font-weight:800;cursor:pointer;">📊 Poll</button>
                        <button type="button" class="nx-st-mode-btn" data-smode="code" style="padding:9px 2px;border-radius:10px;border:none;background:transparent;color:#94a3b8;font-size:11px;font-weight:800;cursor:pointer;">💻 Code</button>
                    </div>

                    <!-- Row 3: Caption / Editor Card -->
                    <div id="nx-studio-text-wrap" style="border-radius:18px;border:1.5px solid #1e293b;background:#0f172a;padding:13px;transition:all 0.2s ease;">
                        <textarea id="nx-studio-caption" rows="4" maxlength="2000" placeholder="Share a reel, photo, JEE/NEET formula, code snippet or update..." style="width:100%;background:transparent;border:none;color:#f8fafc;font-size:14.5px;line-height:1.55;outline:none;resize:none;font-family:inherit;"></textarea>
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding-top:8px;border-top:1px solid rgba(51,65,85,0.45);font-size:10.5px;color:#94a3b8;">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span id="nx-studio-draft-badge" style="color:#34d399;font-weight:700;">💾 Auto-draft on</span>
                                <button type="button" id="nx-st-clear-draft" style="background:none;border:none;color:#fb7185;font-size:10.5px;font-weight:800;cursor:pointer;display:none;">Clear</button>
                            </div>
                            <span id="nx-studio-char-cnt">0 / 2000</span>
                        </div>
                    </div>

                    <!-- Quick Hashtag & JEE/Math Symbol Bar -->
                    <div class="nx-st-chip-row">
                        ${["#IITJEE", "#NEET", "#Coding", "#Doubt", "#Nexus", "∫", "∑", "√", "π", "Δ", "θ", "∞", "→"].map((tok) =>
                            `<button type="button" class="nx-st-quick-tok" data-tok="${tok}" style="padding:5px 11px;border-radius:99px;background:#0f172a;border:1px solid #334155;color:#38bdf8;font-size:11px;font-weight:800;white-space:nowrap;cursor:pointer;flex-shrink:0;">${tok}</button>`
                        ).join("")}
                    </div>

                    <!-- MODE 1: MEDIA UPLOADER (GALLERY + CAMERA + PHOTO FILTERS + AUTO VIDEO POSTER) -->
                    <div id="nx-studio-media-panel">
                        <div style="display:grid;grid-template-columns:1fr auto;gap:8px;">
                            <label for="nx-inp-studio-media" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:18px 12px;border-radius:16px;border:1.5px dashed #10b981;background:rgba(16,185,129,0.06);cursor:pointer;text-align:center;">
                                <div style="font-size:24px;margin-bottom:3px;">📸 🎬</div>
                                <div style="font-size:13px;font-weight:900;color:#34d399;">Select HD Photo or Video (Up to 50MB)</div>
                                <div id="nx-studio-upload-lbl" style="font-size:10.5px;color:#94a3b8;margin-top:2px;">Auto HD Thumbnail + Pro Filters + Fast Stream</div>
                            </label>
                            <label for="nx-inp-studio-cam" style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px 16px;border-radius:16px;border:1px solid #334155;background:#0f172a;cursor:pointer;color:#38bdf8;font-weight:900;font-size:11.5px;gap:4px;">
                                <span style="font-size:22px;">📷</span>
                                <span>Camera</span>
                            </label>
                        </div>
                        <input type="file" id="nx-inp-studio-media" accept="image/*,video/mp4,video/webm,video/*" style="display:none;" />
                        <input type="file" id="nx-inp-studio-cam" accept="image/*" capture="environment" style="display:none;" />

                        <!-- Inside-Card Media Preview + Photo Filter Strip -->
                        <div id="nx-studio-preview-stage" style="display:none;margin-top:10px;border-radius:16px;overflow:hidden;border:1.5px solid #334155;background:#050811;"></div>
                        <div id="nx-st-photo-filters-wrap" style="display:none;margin-top:8px;">
                            <div style="font-size:10.5px;font-weight:800;color:#94a3b8;margin-bottom:5px;">🎨 1-TAP PRO PHOTO FILTERS (BAKED INTO UPLOAD)</div>
                            <div class="nx-st-chip-row" id="nx-st-filter-chips">
                                ${PHOTO_FILTERS.map((f) =>
                                    `<button type="button" class="nx-st-flt-btn" data-flt="${f.id}" style="padding:6px 12px;border-radius:99px;border:1px solid ${f.id === "none" ? "#10b981" : "#334155"};background:${f.id === "none" ? "rgba(16,185,129,0.2)" : "#0f172a"};color:${f.id === "none" ? "#34d399" : "#cbd5e1"};font-size:11px;font-weight:800;white-space:nowrap;cursor:pointer;flex-shrink:0;">${f.name}</button>`
                                ).join("")}
                            </div>
                        </div>
                    </div>

                    <!-- MODE 2: STYLISH GRADIENT TEXT CARD -->
                    <div id="nx-studio-card-panel" style="display:none;background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:12px;">
                        <div style="font-size:11px;font-weight:900;color:#38bdf8;margin-bottom:8px;">🎨 POSTER CARD BACKGROUND</div>
                        <div class="nx-st-chip-row">
                            ${CARD_GRADIENTS.map((g) =>
                                `<button type="button" data-grad="${g.css}" style="padding:9px 14px;border-radius:11px;border:1.5px solid #334155;background:${g.css || "#090d16"};color:#fff;font-size:11.5px;font-weight:800;white-space:nowrap;cursor:pointer;flex-shrink:0;">${g.name}</button>`
                            ).join("")}
                        </div>
                    </div>

                    <!-- MODE 3: LIVE INTERACTIVE POLL -->
                    <div id="nx-studio-poll-panel" style="display:none;background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:12px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <span style="font-size:11px;font-weight:900;color:#38bdf8;">📊 LIVE POLL OPTIONS</span>
                            <select id="nx-poll-dur" style="background:#090d16;border:1px solid #334155;color:#cbd5e1;border-radius:8px;padding:3px 7px;font-size:11px;font-weight:700;">
                                <option value="24h">⏱️ 24 Hours</option>
                                <option value="3d">⏱️ 3 Days</option>
                                <option value="7d">⏱️ 7 Days</option>
                            </select>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:8px;">
                            <input type="text" class="nx-poll-opt-inp" placeholder="Option 1 (Required)" style="width:100%;padding:10px 12px;border-radius:10px;background:#090d16;border:1px solid #334155;color:#fff;font-size:12.5px;outline:none;" />
                            <input type="text" class="nx-poll-opt-inp" placeholder="Option 2 (Required)" style="width:100%;padding:10px 12px;border-radius:10px;background:#090d16;border:1px solid #334155;color:#fff;font-size:12.5px;outline:none;" />
                            <input type="text" class="nx-poll-opt-inp" placeholder="Option 3 (Optional)" style="width:100%;padding:10px 12px;border-radius:10px;background:#090d16;border:1px solid #334155;color:#fff;font-size:12.5px;outline:none;" />
                            <input type="text" class="nx-poll-opt-inp" placeholder="Option 4 (Optional)" style="width:100%;padding:10px 12px;border-radius:10px;background:#090d16;border:1px solid #334155;color:#fff;font-size:12.5px;outline:none;" />
                        </div>
                    </div>

                    <!-- MODE 4: CODE / FORMULA SNIPPET HELPER -->
                    <div id="nx-studio-code-panel" style="display:none;background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:12px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <span style="font-size:11px;font-weight:900;color:#34d399;">💻 CODE / FORMULA SNIPPET BLOCK</span>
                            <select id="nx-code-lang" style="background:#090d16;border:1px solid #334155;color:#38bdf8;border-radius:8px;padding:3px 8px;font-size:11px;font-weight:800;">
                                <option value="Formula">📐 JEE / Physics / Math</option>
                                <option value="JavaScript">JS JavaScript</option>
                                <option value="Python">🐍 Python</option>
                                <option value="HTML/CSS">🌐 HTML / CSS</option>
                            </select>
                        </div>
                        <textarea id="nx-code-snippet-inp" rows="4" placeholder="Paste clean code or JEE derivation steps here..." style="width:100%;padding:10px 12px;border-radius:10px;background:#050811;border:1px solid #334155;color:#34d399;font-family:ui-monospace,monospace;font-size:12px;outline:none;resize:none;"></textarea>
                    </div>

                    <!-- ATTACH BACKGROUND MUSIC (iTunes External API) -->
                    <div style="background:#0f172a;border:1px solid #1e293b;border-radius:15px;padding:11px 13px;">
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                            <div style="display:flex;align-items:center;gap:8px;min-width:0;">
                                <span>🎵</span>
                                <span id="nx-studio-song-lbl" style="font-size:12px;font-weight:800;color:#cbd5e1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Add Background Song (iTunes Library)</span>
                            </div>
                            <div style="display:flex;gap:5px;flex-shrink:0;">
                                <button type="button" id="nx-studio-song-clear" style="display:none;padding:5px 9px;border-radius:999px;background:rgba(244,63,94,0.16);border:1px solid #f43f5e;color:#fda4af;font-size:11px;font-weight:800;cursor:pointer;">✕</button>
                                <button type="button" id="nx-studio-song-toggle" style="padding:5px 11px;border-radius:999px;background:#1e293b;border:1px solid #334155;color:#38bdf8;font-size:11px;font-weight:800;cursor:pointer;">+ Song</button>
                            </div>
                        </div>
                        <div id="nx-studio-song-box" style="display:none;margin-top:10px;padding-top:10px;border-top:1px solid #1e293b;">
                            <div style="display:flex;gap:6px;margin-bottom:8px;">
                                <input type="text" id="nx-st-song-q" placeholder="Search song or artist..." style="flex:1;padding:9px 11px;border-radius:10px;background:#090d16;border:1px solid #334155;color:#fff;font-size:12px;outline:none;" />
                                <button type="button" id="nx-st-song-btn" style="padding:9px 14px;border-radius:10px;background:#10b981;color:#020617;font-weight:900;font-size:12px;border:none;cursor:pointer;">Search</button>
                            </div>
                            <div id="nx-st-song-res" style="max-height:150px;overflow-y:auto;display:flex;flex-direction:column;gap:6px;"></div>
                        </div>
                    </div>

                    <!-- Post Options (Pin & Comments) -->
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <label style="display:flex;align-items:center;gap:8px;padding:11px 12px;border-radius:13px;background:#0f172a;border:1px solid #1e293b;font-size:12px;font-weight:800;color:#fbbf24;cursor:pointer;">
                            <input type="checkbox" id="nx-studio-pin" style="width:16px;height:16px;accent-color:#10b981;" />
                            <span>📌 Pin to Profile</span>
                        </label>
                        <label style="display:flex;align-items:center;gap:8px;padding:11px 12px;border-radius:13px;background:#0f172a;border:1px solid #1e293b;font-size:12px;font-weight:800;color:#34d399;cursor:pointer;">
                            <input type="checkbox" id="nx-studio-comments" checked style="width:16px;height:16px;accent-color:#10b981;" />
                            <span>💬 Allow Comments</span>
                        </label>
                    </div>
                </div>

                <!-- STICKY FULL-SCREEN BOTTOM ACTION BAR -->
                <footer style="padding:10px 14px 14px;border-top:1px solid #1e293b;background:#0b1120;flex-shrink:0;display:flex;align-items:center;gap:8px;">
                    <button type="button" id="nx-st-cld-btn" title="Connect Cloudinary Free 2s HLS" style="padding:12px 12px;border-radius:14px;background:#1e293b;border:1px solid #334155;color:#38bdf8;font-weight:900;font-size:12px;cursor:pointer;flex-shrink:0;">☁️ HLS</button>
                    <button type="button" id="nx-studio-publish-main" style="flex:1;padding:13px;border-radius:14px;background:linear-gradient(90deg,#10b981,#06b6d4);color:#020617;font-weight:900;font-size:14px;border:none;cursor:pointer;box-shadow:0 8px 24px rgba(16,185,129,0.35);">
                        🚀 Publish Official Post Now
                    </button>
                </footer>
            </div>
        `;

        document.body.appendChild(modal);

        // Keyboard-safe visualViewport sync (Full-Screen stays crisp even when Android keyboard opens!)
        const syncStudioVp = () => {
            if (!modal.isConnected || !window.visualViewport) return;
            modal.style.height = Math.max(260, Math.round(window.visualViewport.height)) + "px";
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

        // Cloudinary Setup Trigger
        const refreshCldPill = () => {
            const c = getCloudinaryConfig();
            const ok = Boolean(c.cloud && c.preset);
            const pill = modal.querySelector("#nx-st-cdn-pill");
            if (pill) {
                pill.textContent = ok ? "☁️ Cloudinary 2s HLS Active • Tap to edit" : "⚡ Supabase CDN • Tap to connect Cloudinary HLS";
                pill.style.color = ok ? "#34d399" : "#38bdf8";
            }
        };
        modal.querySelector("#nx-st-cdn-pill").onclick = () => openCloudinarySetupDialog(refreshCldPill);
        modal.querySelector("#nx-st-cld-btn").onclick = () => openCloudinarySetupDialog(refreshCldPill);

        // Textarea, Drafts & Quick Tokens
        const textWrap = modal.querySelector("#nx-studio-text-wrap");
        const txtArea = modal.querySelector("#nx-studio-caption");
        const charCnt = modal.querySelector("#nx-studio-char-cnt");
        const draftBadge = modal.querySelector("#nx-studio-draft-badge");
        const clearDraftBtn = modal.querySelector("#nx-st-clear-draft");

        try {
            const savedDraft = localStorage.getItem(DRAFT_KEY) || "";
            if (savedDraft) {
                txtArea.value = savedDraft;
                charCnt.textContent = `${savedDraft.length} / 2000`;
                draftBadge.textContent = "📝 Draft restored";
                clearDraftBtn.style.display = "inline";
            }
        } catch (e) {}

        txtArea.addEventListener("input", () => {
            const v = txtArea.value || "";
            charCnt.textContent = `${v.length} / 2000`;
            clearDraftBtn.style.display = v.trim() ? "inline" : "none";
            try {
                if (v.trim()) localStorage.setItem(DRAFT_KEY, v);
                else localStorage.removeItem(DRAFT_KEY);
            } catch (e) {}
        });
        clearDraftBtn.onclick = () => {
            txtArea.value = "";
            txtArea.dispatchEvent(new Event("input"));
        };

        modal.querySelectorAll(".nx-st-quick-tok").forEach((b) => {
            b.onclick = () => {
                const tok = b.getAttribute("data-tok") || "";
                const sp = txtArea.value && !txtArea.value.endsWith(" ") ? " " : "";
                txtArea.value = (txtArea.value + sp + tok + " ").slice(0, 2000);
                txtArea.dispatchEvent(new Event("input"));
                txtArea.focus();
            };
        });

        // Mode Switching
        const mediaPanel = modal.querySelector("#nx-studio-media-panel");
        const cardPanel = modal.querySelector("#nx-studio-card-panel");
        const pollPanel = modal.querySelector("#nx-studio-poll-panel");
        const codePanel = modal.querySelector("#nx-studio-code-panel");

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
                codePanel.style.display = studioMode === "code" ? "block" : "none";
                if (studioMode !== "card") {
                    textWrap.style.background = "#0f172a";
                    textWrap.style.padding = "13px";
                    txtArea.style.textAlign = "left";
                    txtArea.style.fontWeight = "500";
                    txtArea.style.fontSize = "14.5px";
                }
            };
        });

        modal.querySelectorAll("[data-grad]").forEach((gBtn) => {
            gBtn.onclick = () => {
                selectedCardGradient = gBtn.getAttribute("data-grad") || "";
                if (selectedCardGradient) {
                    textWrap.style.background = selectedCardGradient;
                    textWrap.style.padding = "28px 18px";
                    txtArea.style.textAlign = "center";
                    txtArea.style.fontWeight = "900";
                    txtArea.style.fontSize = "18px";
                } else {
                    textWrap.style.background = "#0f172a";
                    textWrap.style.padding = "13px";
                    txtArea.style.textAlign = "left";
                    txtArea.style.fontWeight = "500";
                    txtArea.style.fontSize = "14.5px";
                }
            };
        });

        // Media File Selection (Gallery & Camera) + Photo Filter Re-Bake + Auto Poster
        const fileInp = modal.querySelector("#nx-inp-studio-media");
        const camInp = modal.querySelector("#nx-inp-studio-cam");
        const prevStage = modal.querySelector("#nx-studio-preview-stage");
        const filtersWrap = modal.querySelector("#nx-st-photo-filters-wrap");
        const upLbl = modal.querySelector("#nx-studio-upload-lbl");

        async function handleSelectedMediaFile(file) {
            if (!file) return;
            if (file.size > MAX_VIDEO_BYTES) {
                alert("⚠️ File 50MB se chhoti honi chahiye!");
                return;
            }
            const localUrl = URL.createObjectURL(file);
            prevStage.style.display = "block";
            isUploadingMedia = true;
            selectedPhotoFilter = "none";
            attachedMedia = { ref: "", mType: file.type.startsWith("video/") ? "video" : "image", localUrl, rawFile: file, posterUrl: "" };

            if (file.type.startsWith("video/")) {
                filtersWrap.style.display = "none";
                const localPoster = await captureVideoPosterDataUrl(file);
                attachedMedia.posterUrl = localPoster;
                const mb = (file.size / (1024 * 1024)).toFixed(1);

                prevStage.innerHTML = `
                    <video src="${localUrl}" ${localPoster ? `poster="${localPoster}"` : ""} controls playsinline style="width:100%;max-height:280px;display:block;background:#000;"></video>
                    <div style="padding:9px 12px;background:#0f172a;">
                        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
                            <span id="nx-st-prog-txt" style="font-size:12px;font-weight:800;color:#38bdf8;">📤 Uploading Video (${mb} MB) 1%...</span>
                            <button type="button" id="nx-st-remove-media" style="background:#e11d48;border:none;color:#fff;padding:4px 10px;border-radius:8px;font-size:11px;font-weight:800;cursor:pointer;">Remove ✕</button>
                        </div>
                        <div class="nx-st-prog-track"><div id="nx-st-prog-bar" class="nx-st-prog-bar"></div></div>
                    </div>
                `;
                prevStage.querySelector("#nx-st-remove-media").onclick = () => {
                    attachedMedia = { ref: "", mType: "", localUrl: "", rawFile: null, posterUrl: "" };
                    isUploadingMedia = false; prevStage.style.display = "none"; fileInp.value = ""; camInp.value = "";
                };

                try {
                    const encodedRef = await uploadVideoSmart(file, (pct) => {
                        const pEl = document.getElementById("nx-st-prog-txt");
                        const bEl = document.getElementById("nx-st-prog-bar");
                        if (pEl) pEl.textContent = `📤 Uploading HD Video (${mb} MB) ${pct}%...`;
                        if (bEl) bEl.style.width = pct + "%";
                        upLbl.textContent = `Uploading Video ${pct}%...`;
                    });
                    attachedMedia.ref = encodedRef;
                    isUploadingMedia = false;
                    const isCld = String(encodedRef).includes("res.cloudinary.com");
                    const pEl = document.getElementById("nx-st-prog-txt");
                    if (pEl) {
                        pEl.textContent = isCld ? "✅ Ready on Cloudinary (2s HLS + Auto HD Poster)!" : "✅ HD Video Ready to Publish!";
                        pEl.style.color = "#34d399";
                    }
                    upLbl.textContent = isCld ? "☁️ Cloudinary HLS Ready!" : "✅ Video Ready!";
                } catch (err) {
                    isUploadingMedia = false;
                    alert("⚠️ Network slow, try smaller video.");
                }
            } else {
                filtersWrap.style.display = "block";
                prevStage.innerHTML = `
                    <img id="nx-st-prev-img" src="${localUrl}" style="width:100%;max-height:310px;object-fit:cover;display:block;transition:filter 0.15s ease;" />
                    <div style="padding:9px 12px;background:#0f172a;">
                        <div style="display:flex;align-items:center;justify-content:space-between;">
                            <span id="nx-st-prog-txt" style="font-size:12px;font-weight:800;color:#38bdf8;">⏳ Optimizing HD Photo...</span>
                            <button type="button" id="nx-st-remove-media" style="background:#e11d48;border:none;color:#fff;padding:4px 10px;border-radius:8px;font-size:11px;font-weight:800;cursor:pointer;">Remove ✕</button>
                        </div>
                        <div class="nx-st-prog-track"><div id="nx-st-prog-bar" class="nx-st-prog-bar"></div></div>
                    </div>
                `;
                prevStage.querySelector("#nx-st-remove-media").onclick = () => {
                    attachedMedia = { ref: "", mType: "", localUrl: "", rawFile: null, posterUrl: "" };
                    isUploadingMedia = false; prevStage.style.display = "none"; filtersWrap.style.display = "none"; fileInp.value = ""; camInp.value = "";
                };

                const url = await uploadPhotoSmart(file, "none", (pct) => {
                    const bEl = document.getElementById("nx-st-prog-bar");
                    if (bEl) bEl.style.width = pct + "%";
                });
                attachedMedia.ref = url;
                isUploadingMedia = false;
                const pEl = document.getElementById("nx-st-prog-txt");
                if (pEl) { pEl.textContent = "✅ HD Photo Ready!"; pEl.style.color = "#34d399"; }
                upLbl.textContent = "✅ Photo Ready!";
            }
        }

        fileInp.onchange = (e) => handleSelectedMediaFile(e.target.files && e.target.files[0]);
        camInp.onchange = (e) => handleSelectedMediaFile(e.target.files && e.target.files[0]);

        // Live Photo Filter Clicks (applies instant CSS preview; re-bakes on Publish if changed!)
        modal.querySelectorAll(".nx-st-flt-btn").forEach((fb) => {
            fb.onclick = () => {
                selectedPhotoFilter = fb.getAttribute("data-flt") || "none";
                modal.querySelectorAll(".nx-st-flt-btn").forEach((b) => {
                    const active = b.getAttribute("data-flt") === selectedPhotoFilter;
                    b.style.borderColor = active ? "#10b981" : "#334155";
                    b.style.background = active ? "rgba(16,185,129,0.2)" : "#0f172a";
                    b.style.color = active ? "#34d399" : "#cbd5e1";
                });
                const imgEl = modal.querySelector("#nx-st-prev-img");
                if (imgEl) imgEl.style.filter = getFilterCss(selectedPhotoFilter);
            };
        });

        // Live Feed Card Preview Modal
        modal.querySelector("#nx-st-preview-btn").onclick = () => {
            const cap = (txtArea.value || "").trim() || "(Your post caption will appear here)";
            const pv = document.createElement("div");
            pv.style.cssText = "position:fixed;inset:0;background:rgba(2,6,23,.94);z-index:295000;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(8px);";
            const mHtml = attachedMedia.localUrl
                ? (attachedMedia.mType === "video"
                    ? `<video src="${attachedMedia.localUrl}" ${attachedMedia.posterUrl ? `poster="${attachedMedia.posterUrl}"` : ""} controls playsinline style="width:100%;max-height:300px;background:#000;display:block;"></video>`
                    : `<img src="${attachedMedia.localUrl}" style="width:100%;max-height:300px;object-fit:cover;display:block;filter:${getFilterCss(selectedPhotoFilter)};">`)
                : "";
            pv.innerHTML = `
                <div style="width:100%;max-width:420px;background:#0f172a;border:1.5px solid #10b981;border-radius:20px;overflow:hidden;color:#fff;">
                    <div style="padding:11px 14px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #1e293b;">
                        <b style="color:#34d399;font-size:13px;">👁️ Live Feed Preview</b>
                        <button type="button" id="nx-pvx" style="background:#1e293b;border:none;color:#fff;width:28px;height:28px;border-radius:50%;cursor:pointer;">✕</button>
                    </div>
                    <div style="padding:12px 14px;display:flex;align-items:center;gap:10px;">
                        ${dpHtml}
                        <div><b style="font-size:13.5px;">${escHtml(me.name || me.username)} ✅</b><div style="font-size:11px;color:#38bdf8;">Just now</div></div>
                    </div>
                    <div style="padding:${studioMode === "card" && selectedCardGradient ? "24px 16px" : "2px 14px 12px"};background:${studioMode === "card" ? selectedCardGradient : "transparent"};text-align:${studioMode === "card" && selectedCardGradient ? "center" : "left"};font-size:13.5px;white-space:pre-line;">${escHtml(cap)}</div>
                    ${mHtml}
                    <div style="padding:10px 14px;display:flex;justify-content:space-between;color:#94a3b8;font-size:12px;border-top:1px solid #1e293b;">
                        <span>❤️ 1</span><span>💬 0</span><span>👁️ 1</span><span>Share</span>
                    </div>
                </div>
            `;
            document.body.appendChild(pv);
            pv.querySelector("#nx-pvx").onclick = () => pv.remove();
            pv.onclick = (e) => { if (e.target === pv) pv.remove(); };
        };

        // iTunes Song Picker
        const songBox = modal.querySelector("#nx-studio-song-box");
        const songClearBtn = modal.querySelector("#nx-studio-song-clear");
        modal.querySelector("#nx-studio-song-toggle").onclick = () => {
            songBox.style.display = songBox.style.display === "none" ? "block" : "none";
        };
        songClearBtn.onclick = () => {
            attachedSong = null;
            modal.querySelector("#nx-studio-song-lbl").textContent = "Add Background Song (iTunes Library)";
            songClearBtn.style.display = "none";
        };

        modal.querySelector("#nx-st-song-btn").onclick = async () => {
            const q = (modal.querySelector("#nx-st-song-q").value || "").trim();
            const resDiv = modal.querySelector("#nx-st-song-res");
            if (!q) return;
            resDiv.innerHTML = `<div style="font-size:11.5px;color:#38bdf8;padding:6px;">⏳ Searching "${escHtml(q)}"...</div>`;
            try {
                const r = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=7`);
                const d = await r.json();
                const list = (d && d.results) || [];
                resDiv.innerHTML = list.filter((t) => t.previewUrl).map((t, idx) => `
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;padding:7px 9px;background:#090d16;border-radius:9px;border:1px solid #1e293b;">
                        <div style="font-size:11.5px;color:#f8fafc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0;">🎵 ${escHtml(t.trackName)} - ${escHtml(t.artistName)}</div>
                        <div style="display:flex;gap:5px;flex-shrink:0;">
                            <button type="button" data-sprev="${escHtml(t.previewUrl)}" style="padding:4px 8px;border-radius:6px;background:#1e293b;color:#38bdf8;border:1px solid #334155;font-size:11px;cursor:pointer;">▶️</button>
                            <button type="button" data-sidx="${idx}" style="padding:4px 9px;border-radius:6px;background:#10b981;color:#020617;border:none;font-size:11px;font-weight:900;cursor:pointer;">Select ✓</button>
                        </div>
                    </div>`).join("");

                resDiv.querySelectorAll("[data-sprev]").forEach((pb) => {
                    pb.onclick = () => {
                        const u = pb.getAttribute("data-sprev");
                        if (previewAudio && previewAudio.src === u && !previewAudio.paused) { previewAudio.pause(); pb.textContent = "▶️"; return; }
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
                        attachedSong = { title: tr.trackName, artist: tr.artistName, audioUrl: tr.previewUrl };
                        modal.querySelector("#nx-studio-song-lbl").innerHTML = `<strong style="color:#34d399;">🎵 ${escHtml(tr.trackName)} (${escHtml(tr.artistName)})</strong>`;
                        songClearBtn.style.display = "inline-block";
                        songBox.style.display = "none";
                    };
                });
            } catch (e) {}
        };

        // Publish Execution (Dual-Cloud Safe: Uses exact Supabase schema + bakes Photo Filters!)
        const executePublish = async (btnEl) => {
            if (isUploadingMedia) {
                alert("⏳ Media abhi upload ho raha hai, 100% hone ka wait karein!");
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

            const codeBody = studioMode === "code" ? (modal.querySelector("#nx-code-snippet-inp").value || "").trim() : "";
            const codeLang = studioMode === "code" ? (modal.querySelector("#nx-code-lang").value || "Formula") : "";

            if (!rawText && !attachedMedia.ref && !pollOptions.length && !codeBody) {
                alert("⚠️ Kuch likhein ya Photo/Video select karein!");
                return;
            }

            btnEl.disabled = true;
            const topBtn = modal.querySelector("#nx-studio-publish-top");
            const mainBtn = modal.querySelector("#nx-studio-publish-main");
            if (topBtn) { topBtn.disabled = true; topBtn.textContent = "⏳..."; }
            if (mainBtn) { mainBtn.disabled = true; mainBtn.textContent = "⏳ Publishing Live..."; }

            // If user applied a photo filter after initial upload, bake & re-upload filtered photo now!
            if (attachedMedia.mType === "image" && attachedMedia.rawFile && selectedPhotoFilter !== "none") {
                try {
                    const filteredUrl = await uploadPhotoSmart(attachedMedia.rawFile, getFilterCss(selectedPhotoFilter));
                    if (filteredUrl) attachedMedia.ref = filteredUrl;
                } catch (e) {}
            }

            let finalContent = rawText;
            if (codeBody) {
                finalContent = (finalContent ? finalContent + "\n\n" : "") + `【${codeLang}】\n` + codeBody;
            }
            if (tag && tag !== "🚀 General" && !finalContent.includes(tag)) {
                finalContent = `[${tag}] ${finalContent}`;
            }

            const postDoc = {
                username: me.username,
                author: me.name || me.username,
                bio: me.bio || "Nexus Member",
                dp: me.dp || "",
                verified: true,
                pinned: Boolean(isPinned),
                allowComments: Boolean(allowComments),
                topicTag: tag,
                content: finalContent,
                text: finalContent,
                image: attachedMedia.ref || "",
                videoUrl: attachedMedia.mType === "video" ? attachedMedia.ref : "",
                posterUrl: attachedMedia.posterUrl || "",
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
                if (topBtn) { topBtn.disabled = false; topBtn.textContent = "Publish 🚀"; }
                if (mainBtn) { mainBtn.disabled = false; mainBtn.textContent = "🚀 Publish Official Post Now"; }
                alert("⚠️ Network slow, please tap Publish again.");
            }
        };

        modal.querySelector("#nx-studio-publish-main").onclick = function () { executePublish(this); };
        modal.querySelector("#nx-studio-publish-top").onclick = function () { executePublish(this); };
    };

    if (window.Nexus) Nexus.openPostModal = window.openOfficialNexusCreatorStudio;

    document.addEventListener("click", (e) => {
        const fab = e.target.closest(".nx-fab-post");
        if (fab) {
            e.stopPropagation();
            e.preventDefault();
            window.openOfficialNexusCreatorStudio();
        }
    }, true);

    setTimeout(() => { if (window.Nexus) Nexus.openPostModal = window.openOfficialNexusCreatorStudio; }, 500);
    window.addEventListener("load", () => { if (window.Nexus) Nexus.openPostModal = window.openOfficialNexusCreatorStudio; });
})();
