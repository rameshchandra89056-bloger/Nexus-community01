/* ============================================================================
   NEXUS OFFICIAL PROFILE.JS (V21 FINAL - INSTAGRAM UI + REAL SONG + REAL LAST SEEN)
   1. Fixes '1h ago' Story Bar Bug (1000076773.jpg vs 1000076774.jpg '23d ago'):
      - Removes dummy 'Date.now() - 3600000' fallback completely!
      - Uses 100% real Firestore timestamps (lastSeen, lastOnline, createdAt, DM dates)
   2. Instagram Profile Music / Song Feature (Real iTunes Song Search + Audio Player)
   3. Long-Press Avatar HD Zoom Preview + Full Public Profile Viewer for Any Member
   4. Systematic Instagram 3-Column Grid (Posts | Videos | Saved) + Post Edit/Delete
   5. Interactive Followers & Following Lists + Live Mood Note + Zero Dummy Clutter
   ============================================================================ */
(function () {
    if (window.__NEXUS_INSTAGRAM_PROFILE_V21__) return;
    window.__NEXUS_INSTAGRAM_PROFILE_V21__ = true;

    let currentProfileTabMode = "posts"; // 'posts' | 'videos' | 'saved'
    let activeSongAudio = null;
    let activeSongBtn = null;
    let longPressTimer = null;
    const realLastSeenCache = {};

    function cleanUniqueList(arr) {
        if (!Array.isArray(arr)) return [];
        const seen = new Set();
        const out = [];
        arr.forEach((item) => {
            const s = String(item || "").trim().toLowerCase();
            if (s && !seen.has(s)) {
                seen.add(s);
                out.push(s);
            }
        });
        return out;
    }

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

    // =========================================================================
    // 1. 100% REAL LAST-SEEN ENGINE (FIXES '1h ago' BUG IN 1000076773.jpg / 774.jpg!)
    // =========================================================================
    function extractTrueTimestamp(u) {
        if (!u) return 0;
        const now = Date.now();
        const candidates = [
            u.lastSeen,
            u.lastSeenAt,
            u.lastActive,
            u.updatedAt,
            u.createdAt,
            u.joinedAt,
            u.timestamp,
            u.verifiedAt
        ];

        // Check `u.lastOnline`, but IGNORE it if it was polluted by the old `Date.now() - 3600000` (1h ago) fallback!
        const lo = Number(u.lastOnline || 0);
        if (lo > 1000000) {
            const diffMin = Math.round((now - lo) / 60000);
            const looksLikeFakeOneHour = diffMin >= 54 && diffMin <= 65 && !u.isOnlineNow && !u.verifiedAt;
            if (!looksLikeFakeOneHour) {
                candidates.unshift(lo);
            }
        }

        for (let i = 0; i < candidates.length; i++) {
            const val = Number(candidates[i] || 0);
            if (val > 1000000000000 && val <= now + 60000) {
                return val;
            }
        }

        if (u.username && realLastSeenCache[u.username.toLowerCase()]) {
            return realLastSeenCache[u.username.toLowerCase()];
        }
        return 0;
    }

    window.formatRealNexusLastSeen = function (ts, isOnline) {
        if (isOnline) return "Live";
        const num = Number(ts || 0);
        if (!num || num < 1000000000000) return ""; // Never return fake "1h ago"!
        const diffSec = Math.max(1, Math.floor((Date.now() - num) / 1000));
        if (diffSec < 60) return "Just now";
        if (diffSec < 3600) return Math.floor(diffSec / 60) + "m ago";
        if (diffSec < 86400) return Math.floor(diffSec / 3600) + "h ago";
        return Math.floor(diffSec / 86400) + "d ago";
    };

    // Override `Nexus.rebuildAllUsersMasterList` so it NEVER injects `Date.now() - 3600000` (1h ago)!
    function installRealTimestampMasterListOverride() {
        if (!window.Nexus || Nexus.__v21RealTimePatched) return;
        Nexus.__v21RealTimePatched = true;

        Nexus.rebuildAllUsersMasterList = function () {
            const map = {};

            (this.users || []).forEach((u) => {
                if (u && u.username) {
                    const key = u.username.toLowerCase().trim();
                    const copy = Object.assign({}, u);
                    delete copy.pin;
                    copy.dp = copy.dp || "";
                    copy.lastOnline = extractTrueTimestamp(copy);
                    copy.lastSeenAt = copy.lastOnline;
                    copy.followersList = cleanUniqueList(copy.followersList);
                    copy.followingList = cleanUniqueList(copy.followingList);
                    map[key] = copy;
                }
            });

            const rawMe = localStorage.getItem("nx_active_account");
            let myActiveKey = "";
            let myLocalDp = "";
            if (rawMe) {
                try {
                    const me = JSON.parse(rawMe);
                    if (me && me.username) {
                        myActiveKey = me.username.toLowerCase().trim();
                        myLocalDp = me.dp || "";
                        map[myActiveKey] = Object.assign({}, map[myActiveKey] || {}, me, {
                            isOnlineNow: true,
                            lastOnline: Date.now(),
                            lastSeenAt: Date.now()
                        });
                    }
                } catch (e) {}
            }

            (this.cloudAccounts || []).forEach((u) => {
                if (u && u.username) {
                    const key = u.username.toLowerCase().trim();
                    const prevDp = map[key] && map[key].dp ? map[key].dp : "";
                    const copy = Object.assign({}, map[key] || {}, u);
                    delete copy.pin;
                    copy.dp = u.dp || prevDp || (key === myActiveKey ? myLocalDp : "");
                    const trueTs = extractTrueTimestamp(u) || extractTrueTimestamp(map[key]);
                    copy.lastOnline = trueTs;
                    copy.lastSeenAt = trueTs;
                    if (trueTs > 0) realLastSeenCache[key] = trueTs;
                    copy.followersList = cleanUniqueList(u.followersList);
                    copy.followingList = cleanUniqueList(u.followingList);
                    map[key] = copy;
                }
            });

            // Sync real post creation timestamps into author's last activity
            (this.posts || []).forEach((p) => {
                if (!p || p.username === "nexus_official" || (p.author || "").toLowerCase() === "nexus") return;
                const rawUname = (p.username || p.author || "").toLowerCase().replace(/[^a-z0-9_]/g, "");
                if (!rawUname) return;

                const postTime = Number(p.createdAt || p.timestamp || 0);
                const postDp = p.dp || p.authorDp || "";
                const authorDisplay = (p.author || p.name || p.username || "").toLowerCase().trim();

                let targetKey = rawUname;
                for (const k in map) {
                    const m = map[k];
                    if (k === rawUname || (m && (m.name || "").toLowerCase().trim() === authorDisplay)) {
                        targetKey = k;
                        break;
                    }
                }

                if (!map[targetKey]) {
                    map[targetKey] = {
                        username: p.username || rawUname,
                        name: p.author || p.name || p.username || "Member",
                        bio: p.bio || "Nexus Member",
                        dp: postDp,
                        isOnlineNow: false,
                        lastOnline: postTime,
                        lastSeenAt: postTime,
                        followersList: [],
                        followingList: []
                    };
                } else {
                    if (!map[targetKey].dp && postDp) map[targetKey].dp = postDp;
                    if (postTime > Number(map[targetKey].lastOnline || 0)) {
                        map[targetKey].lastOnline = postTime;
                        map[targetKey].lastSeenAt = postTime;
                    }
                }
                if (map[targetKey].lastOnline > 0) {
                    realLastSeenCache[targetKey] = map[targetKey].lastOnline;
                }
            });

            const byNameMap = {};
            const finalUsers = [];
            Object.values(map).forEach((u) => {
                if (!u || !u.username) return;
                const nameKey = (u.name || u.username).toLowerCase().trim();
                if (!byNameMap[nameKey]) {
                    byNameMap[nameKey] = u;
                    finalUsers.push(u);
                } else {
                    const existing = byNameMap[nameKey];
                    const existingScore = (existing.dp ? 10 : 0) + (existing.followersList || []).length * 2;
                    const currentScore = (u.dp ? 10 : 0) + (u.followersList || []).length * 2;
                    if (currentScore > existingScore) {
                        u.dp = u.dp || existing.dp || "";
                        u.lastOnline = Math.max(Number(u.lastOnline || 0), Number(existing.lastOnline || 0));
                        u.lastSeenAt = u.lastOnline;
                        const idx = finalUsers.indexOf(existing);
                        if (idx !== -1) finalUsers[idx] = u;
                        byNameMap[nameKey] = u;
                    } else {
                        existing.dp = existing.dp || u.dp || "";
                        existing.lastOnline = Math.max(Number(existing.lastOnline || 0), Number(u.lastOnline || 0));
                        existing.lastSeenAt = existing.lastOnline;
                    }
                }
            });

            // Sort by real activity timestamp (Users with real recent timestamps first, older/23d ago users after)
            finalUsers.sort((a, b) => {
                if (a.username === myActiveKey) return -1;
                if (b.username === myActiveKey) return 1;
                if (a.isOnlineNow && !b.isOnlineNow) return -1;
                if (!a.isOnlineNow && b.isOnlineNow) return 1;
                return Number(b.lastOnline || 0) - Number(a.lastOnline || 0);
            });

            this.users = finalUsers;
        };

        // Wipe polluted `nx_master_users_v1` cache once so fake `1h ago` is cleared immediately!
        if (!localStorage.getItem("nx_cleaned_fake_1h_v21")) {
            localStorage.removeItem("nx_master_users_v1");
            localStorage.setItem("nx_cleaned_fake_1h_v21", "1");
            Nexus.rebuildAllUsersMasterList();
            Nexus.notifyAll && Nexus.notifyAll();
        }
    }
    installRealTimestampMasterListOverride();
    setInterval(installRealTimestampMasterListOverride, 500);

    // Fix Story Bar badges in real time so any fake `1h ago` on old users is replaced with their true timestamp (`23d ago`, etc.)!
    function syncRealStoryBarBadges() {
        const storyBar = document.getElementById("nx-stories-bar") || document.querySelector("#tab-home > div:first-child");
        if (!storyBar || !window.Nexus || !Array.isArray(Nexus.users)) return;

        storyBar.querySelectorAll("div, button, a").forEach((card) => {
            if (card.children.length < 2 || card.clientWidth > 120) return;
            const lines = (card.innerText || "").split("\n").map((l) => l.trim()).filter(Boolean);
            if (!lines.length) return;
            const rawName = lines[lines.length - 1].toLowerCase().replace(/\.+$/, "").trim();
            if (!rawName || rawName.includes("nexus")) return;

            const matched = Nexus.users.find((u) => {
                if (!u) return false;
                const uN = (u.username || "").toLowerCase();
                const dN = (u.name || "").toLowerCase();
                return uN === rawName || dN === rawName || (rawName.length >= 4 && (dN.startsWith(rawName) || uN.startsWith(rawName)));
            });

            if (!matched) return;
            const trueTs = extractTrueTimestamp(matched);
            const realLabel = window.formatRealNexusLastSeen(trueTs, matched.isOnlineNow);

            // Find the time pill inside this story circle
            card.querySelectorAll("span, div, small").forEach((badge) => {
                if (badge.children.length > 0) return;
                const bt = (badge.innerText || "").trim();
                if (bt.endsWith("ago") || bt === "Live" || bt === "🟢 Live" || bt === "Offline") {
                    if (realLabel) {
                        badge.innerText = realLabel;
                    } else if (bt === "1h ago") {
                        // Hide fake 1h ago if user has no recent timestamp
                        badge.style.display = "none";
                    }
                }
            });
        });
    }
    setInterval(syncRealStoryBarBadges, 450);

    // =========================================================================
    // 2. 🎵 INSTAGRAM PROFILE SONG / MUSIC ANTHEM ENGINE (REAL ITUNES API)
    // =========================================================================
    window.togglePlayProfileSong = function (audioUrl, btnEl) {
        if (!audioUrl) return;

        if (activeSongAudio && activeSongAudio.src === audioUrl && !activeSongAudio.paused) {
            activeSongAudio.pause();
            if (btnEl) btnEl.innerHTML = "▶️ Play";
            return;
        }

        if (activeSongAudio) {
            activeSongAudio.pause();
            if (activeSongBtn) activeSongBtn.innerHTML = "▶️ Play";
        }

        activeSongAudio = new Audio(audioUrl);
        activeSongBtn = btnEl;
        if (btnEl) btnEl.innerHTML = "⏸️ Playing...";

        activeSongAudio.play().catch(() => {
            if (btnEl) btnEl.innerHTML = "▶️ Play";
        });

        activeSongAudio.onended = () => {
            if (btnEl) btnEl.innerHTML = "▶️ Play";
        };
    };

    window.openProfileSongPickerModal = function () {
        document.getElementById("nx-song-picker-modal")?.remove();
        const modal = document.createElement("div");
        modal.id = "nx-song-picker-modal";
        modal.style.cssText =
            "position:fixed; inset:0; background:rgba(2,6,23,0.92); z-index:200080; display:flex; align-items:flex-end; justify-content:center; backdrop-filter:blur(6px);";

        modal.innerHTML = `
            <div style="background:#0f172a; border-top:1.5px solid #10b981; border-radius:24px 24px 0 0; width:100%; max-width:600px; max-height:86dvh; display:flex; flex-direction:column; padding:18px 16px 26px; color:#fff; box-shadow:0 -14px 45px rgba(0,0,0,0.9);">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                    <div>
                        <h3 style="font-size:16.5px; font-weight:900; color:#f8fafc;">🎵 Add Music to Your Profile</h3>
                        <p style="font-size:11px; color:#94a3b8;">Search any Bollywood, Punjabi, Hindi or English song</p>
                    </div>
                    <button type="button" id="nx-close-song-modal" style="width:30px; height:30px; border-radius:50%; background:#1e293b; border:none; color:#cbd5e1; font-weight:900; cursor:pointer;">✕</button>
                </div>

                <div style="display:flex; gap:8px; margin-bottom:12px;">
                    <input type="text" id="nx-song-search-inp" placeholder="Search song or artist (e.g. Arijit Singh, Kesariya, Phonk)..." style="flex:1; padding:11px 14px; border-radius:12px; background:#090d16; border:1px solid #334155; color:#fff; font-size:13px; outline:none;" />
                    <button type="button" id="nx-song-search-btn" style="padding:11px 16px; border-radius:12px; background:#10b981; color:#020617; font-weight:900; font-size:12.5px; border:none; cursor:pointer;">Search 🔍</button>
                </div>

                <div id="nx-song-results-box" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:8px; min-height:220px; max-height:52dvh;">
                    <div style="text-align:center; padding:28px 12px; color:#64748b; font-size:12.5px;">
                        🎶 Type any song name above and tap Search to preview & add it to your Nexus Profile!
                    </div>
                </div>

                <button type="button" id="nx-remove-profile-song" style="margin-top:10px; padding:9px; border-radius:11px; background:rgba(244,63,94,0.12); border:1px solid rgba(244,63,94,0.35); color:#fb7185; font-size:12px; font-weight:800; cursor:pointer;">
                    🗑️ Remove Current Profile Song
                </button>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector("#nx-close-song-modal").onclick = () => {
            if (activeSongAudio) activeSongAudio.pause();
            modal.remove();
        };

        const searchInp = modal.querySelector("#nx-song-search-inp");
        const searchBtn = modal.querySelector("#nx-song-search-btn");
        const resBox = modal.querySelector("#nx-song-results-box");

        const executeSongSearch = async () => {
            const q = (searchInp.value || "").trim();
            if (!q) return;
            resBox.innerHTML = `<div style="text-align:center; padding:24px; color:#38bdf8; font-weight:800; font-size:13px;">⏳ Searching "${q}"...</div>`;

            try {
                const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=14`);
                const data = await res.json();
                const tracks = (data && data.results) || [];

                if (!tracks.length) {
                    resBox.innerHTML = `<div style="text-align:center; padding:24px; color:#f43f5e; font-size:12.5px;">No songs found for "${q}". Try another keyword!</div>`;
                    return;
                }

                resBox.innerHTML = tracks
                    .filter((t) => t && t.previewUrl)
                    .map(
                        (t, idx) => `
                        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:9px 11px; border-radius:14px; background:#090d16; border:1px solid #1e293b;">
                            <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
                                <img src="${t.artworkUrl100 || ""}" style="width:42px; height:42px; border-radius:10px; object-fit:cover; flex-shrink:0;" />
                                <div style="min-width:0; flex:1;">
                                    <div style="font-size:13px; font-weight:800; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.trackName || "Song"}</div>
                                    <div style="font-size:11px; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${t.artistName || "Artist"}</div>
                                </div>
                            </div>
                            <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                                <button type="button" data-prev-url="${t.previewUrl}" style="padding:6px 10px; border-radius:9px; background:#1e293b; border:1px solid #334155; color:#38bdf8; font-size:11px; font-weight:800; cursor:pointer;">▶️</button>
                                <button type="button" data-select-idx="${idx}" style="padding:6px 12px; border-radius:9px; background:#10b981; border:none; color:#020617; font-size:11.5px; font-weight:900; cursor:pointer;">Add ✓</button>
                            </div>
                        </div>
                    `
                    )
                    .join("");

                resBox.querySelectorAll("[data-prev-url]").forEach((b) => {
                    b.onclick = () => {
                        window.togglePlayProfileSong(b.getAttribute("data-prev-url"), b);
                    };
                });

                resBox.querySelectorAll("[data-select-idx]").forEach((b) => {
                    b.onclick = async () => {
                        const track = tracks[Number(b.getAttribute("data-select-idx"))];
                        if (!track) return;
                        const me = getActiveUser();
                        if (!me || !me.username) return;

                        const songObj = {
                            title: track.trackName || "Song",
                            artist: track.artistName || "Artist",
                            audioUrl: track.previewUrl,
                            coverUrl: track.artworkUrl100 || ""
                        };

                        me.profileSong = songObj;
                        localStorage.setItem("nx_active_account", JSON.stringify(me));
                        if (window.Nexus && Nexus.db) {
                            await Nexus.db.collection("nexus_accounts").doc(me.username.toLowerCase().trim()).set({ profileSong: songObj }, { merge: true }).catch(() => {});
                        }
                        if (activeSongAudio) activeSongAudio.pause();
                        modal.remove();
                        renderMyInstagramProfileTab();
                        if (window.Nexus && Nexus.toast) Nexus.toast("🎵 Added '" + songObj.title + "' to Profile!");
                    };
                });
            } catch (err) {
                resBox.innerHTML = `<div style="text-align:center; padding:24px; color:#f43f5e; font-size:12.5px;">Network slow, please tap Search again.</div>`;
            }
        };

        searchBtn.onclick = executeSongSearch;
        searchInp.onkeydown = (e) => {
            if (e.key === "Enter") executeSongSearch();
        };

        modal.querySelector("#nx-remove-profile-song").onclick = async () => {
            const me = getActiveUser();
            if (!me || !me.username) return;
            delete me.profileSong;
            localStorage.setItem("nx_active_account", JSON.stringify(me));
            if (window.Nexus && Nexus.db) {
                await Nexus.db.collection("nexus_accounts").doc(me.username.toLowerCase().trim()).set({ profileSong: null }, { merge: true }).catch(() => {});
            }
            modal.remove();
            renderMyInstagramProfileTab();
            if (window.Nexus && Nexus.toast) Nexus.toast("🗑️ Profile Song Removed");
        };
    };

    // =========================================================================
    // 3. 🔍 LONG-PRESS AVATAR HD ZOOM & FULL PUBLIC PROFILE VIEWER FOR ANY USER
    // =========================================================================
    function findUserObjectByAnyIdentifier(identifier) {
        if (!identifier || !window.Nexus || !Array.isArray(Nexus.users)) return null;
        const clean = String(identifier).toLowerCase().replace(/^@/, "").replace(/\.+$/, "").trim();
        if (!clean) return null;

        return (
            Nexus.users.find((u) => {
                if (!u) return false;
                const uN = (u.username || "").toLowerCase().trim();
                const dN = (u.name || "").toLowerCase().trim();
                return (
                    uN === clean ||
                    dN === clean ||
                    (clean.length >= 4 && (dN.startsWith(clean) || uN.startsWith(clean)))
                );
            }) || null
        );
    }

    // Opens Instagram-Style Long-Press Avatar Zoom Card
    window.openAvatarLongPressZoomModal = function (userObj) {
        if (!userObj || !userObj.username) return;
        document.getElementById("nx-avatar-zoom-overlay")?.remove();

        const trueTs = extractTrueTimestamp(userObj);
        const seenText = window.formatRealNexusLastSeen(trueTs, userObj.isOnlineNow) || "Member";
        const avatarHtml = userObj.dp
            ? `<img src="${userObj.dp}" style="width:220px; height:220px; border-radius:50%; object-fit:cover; border:4px solid #10b981; box-shadow:0 20px 60px rgba(0,0,0,0.95);" />`
            : `<div style="width:220px; height:220px; border-radius:50%; background:linear-gradient(135deg,#10b981,#0284c7); color:#020617; font-size:78px; font-weight:900; display:flex; align-items:center; justify-content:center; border:4px solid #fff; box-shadow:0 20px 60px rgba(0,0,0,0.95);">${(
                  userObj.name || userObj.username
              )[0].toUpperCase()}</div>`;

        const songHtml =
            userObj.profileSong && userObj.profileSong.title
                ? `<div style="margin-top:12px; display:inline-flex; align-items:center; gap:8px; padding:7px 14px; border-radius:999px; background:#0f172a; border:1px solid #10b981; color:#fff; font-size:12px; font-weight:800;">
                       <span>🎵 ${userObj.profileSong.title} • ${userObj.profileSong.artist || ""}</span>
                       <button type="button" id="nx-zoom-song-play" style="padding:3px 9px; border-radius:999px; background:#10b981; color:#020617; border:none; font-weight:900; font-size:11px; cursor:pointer;">▶️ Play</button>
                   </div>`
                : "";

        const overlay = document.createElement("div");
        overlay.id = "nx-avatar-zoom-overlay";
        overlay.style.cssText =
            "position:fixed; inset:0; background:rgba(2,6,23,0.9); z-index:200095; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(10px); animation:fadeIn 0.15s ease;";

        overlay.innerHTML = `
            ${
                userObj.moodNote
                    ? `<div style="background:#1e293b; border:1.5px solid #38bdf8; color:#f8fafc; padding:7px 16px; border-radius:18px; font-size:13px; font-weight:800; margin-bottom:-12px; z-index:5; box-shadow:0 8px 20px rgba(0,0,0,0.7);">💭 ${userObj.moodNote}</div>`
                    : ""
            }
            ${avatarHtml}
            <h3 style="font-size:20px; font-weight:900; color:#f8fafc; margin-top:14px;">
                ${userObj.name || userObj.username} ${userObj.verified || userObj.googleVerified ? "✅" : ""}
            </h3>
            <div style="font-size:13px; color:#34d399; font-weight:700; margin-top:2px;">
                @${userObj.username} • ${userObj.isOnlineNow ? "🟢 Online Now" : "Last seen " + seenText}
            </div>
            <p style="font-size:12.5px; color:#cbd5e1; max-width:300px; text-align:center; margin-top:6px;">
                ${userObj.bio || "Nexus Community Member ✨"}
            </p>
            ${songHtml}
            <div style="display:flex; gap:10px; margin-top:18px; width:100%; max-width:310px;">
                <button type="button" id="nx-zoom-open-profile" style="flex:1; padding:11px; border-radius:13px; background:#10b981; color:#020617; font-weight:900; font-size:13px; border:none; cursor:pointer;">
                    👤 View Full Profile
                </button>
                <button type="button" id="nx-zoom-close" style="padding:11px 16px; border-radius:13px; background:#1e293b; color:#cbd5e1; font-weight:800; font-size:13px; border:1px solid #334155; cursor:pointer;">
                    Close
                </button>
            </div>
        `;

        document.body.appendChild(overlay);
        try {
            if (navigator.vibrate) navigator.vibrate(25);
        } catch (e) {}

        const playBtn = overlay.querySelector("#nx-zoom-song-play");
        if (playBtn && userObj.profileSong) {
            playBtn.onclick = (e) => {
                e.stopPropagation();
                window.togglePlayProfileSong(userObj.profileSong.audioUrl, playBtn);
            };
        }

        overlay.querySelector("#nx-zoom-open-profile").onclick = (e) => {
            e.stopPropagation();
            overlay.remove();
            window.openPublicUserProfileModal(userObj.username);
        };

        overlay.querySelector("#nx-zoom-close").onclick = () => {
            if (activeSongAudio) activeSongAudio.pause();
            overlay.remove();
        };
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                if (activeSongAudio) activeSongAudio.pause();
                overlay.remove();
            }
        };
    };

    // Opens Complete Instagram Public Profile Modal for ANY User
    window.openPublicUserProfileModal = function (targetUsername) {
        const userObj =
            typeof targetUsername === "object"
                ? targetUsername
                : findUserObjectByAnyIdentifier(targetUsername);
        if (!userObj || !userObj.username) return;

        document.getElementById("nx-public-profile-modal")?.remove();

        const me = getActiveUser();
        const myUname = me && me.username ? me.username.toLowerCase().trim() : "";
        const targetKey = userObj.username.toLowerCase().trim();
        const isFollowing = (userObj.followersList || []).map((x) => String(x).toLowerCase()).includes(myUname);

        const userPosts = ((window.Nexus && Nexus.posts) || []).filter((p) => {
            if (!p) return false;
            const pU = (p.username || "").toLowerCase().trim();
            const pA = (p.author || "").toLowerCase().trim();
            return pU === targetKey || pA === (userObj.name || "").toLowerCase().trim();
        });

        const trueTs = extractTrueTimestamp(userObj);
        const seenText = window.formatRealNexusLastSeen(trueTs, userObj.isOnlineNow);

        const dpHtml = userObj.dp
            ? `<img src="${userObj.dp}" id="nx-pub-dp-img" style="width:82px; height:82px; border-radius:50%; object-fit:cover; border:3px solid #10b981; cursor:pointer;" />`
            : `<div id="nx-pub-dp-img" style="width:82px; height:82px; border-radius:50%; background:linear-gradient(135deg,#10b981,#0284c7); color:#020617; font-size:32px; font-weight:900; display:flex; align-items:center; justify-content:center; border:3px solid #34d399; cursor:pointer;">${(
                  userObj.name || userObj.username
              )[0].toUpperCase()}</div>`;

        const songBannerHtml =
            userObj.profileSong && userObj.profileSong.title
                ? `<div style="margin-top:10px; padding:8px 12px; border-radius:12px; background:#090d16; border:1px solid rgba(16,185,129,0.4); display:flex; align-items:center; justify-content:space-between; gap:8px;">
                       <div style="display:flex; align-items:center; gap:8px; min-width:0;">
                           <span>🎵</span>
                           <div style="min-width:0;">
                               <div style="font-size:12px; font-weight:800; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${userObj.profileSong.title}</div>
                               <div style="font-size:10.5px; color:#34d399;">${userObj.profileSong.artist || "Profile Song"}</div>
                           </div>
                       </div>
                       <button type="button" id="nx-pub-play-song" style="padding:5px 11px; border-radius:999px; background:#10b981; color:#020617; font-weight:900; font-size:11px; border:none; cursor:pointer; flex-shrink:0;">▶️ Play</button>
                   </div>`
                : "";

        const gridHtml = userPosts.length
            ? `<div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:3px; margin-top:12px;">
                   ${userPosts
                       .map((p) => {
                           const img = p.image || p.videoUrl || "";
                           if (img && !img.startsWith("NX_VIDEO_STREAM:")) {
                               return `<div style="aspect-ratio:1/1; background:#090d16; overflow:hidden; position:relative; cursor:pointer;" onclick="window.open('${img}')">
                                           <img src="${img}" style="width:100%; height:100%; object-fit:cover; display:block;" />
                                       </div>`;
                           }
                           return `<div style="aspect-ratio:1/1; background:#0f172a; border:1px solid #1e293b; padding:8px; display:flex; align-items:center; justify-content:center; text-align:center; font-size:10.5px; color:#cbd5e1; overflow:hidden;">
                                       ${(p.content || p.text || "Post").slice(0, 55)}
                                   </div>`;
                       })
                       .join("")}
               </div>`
            : `<div style="text-align:center; padding:32px 12px; color:#64748b; font-size:12.5px;">📷 No posts shared yet.</div>`;

        const modal = document.createElement("div");
        modal.id = "nx-public-profile-modal";
        modal.style.cssText =
            "position:fixed; inset:0; background:#090d16; z-index:200075; overflow-y:auto; color:#fff; max-width:600px; margin:0 auto; box-shadow:0 0 50px rgba(0,0,0,0.95);";

        modal.innerHTML = `
            <!-- Top Instagram Profile Bar -->
            <div style="position:sticky; top:0; background:rgba(11,17,32,0.96); border-bottom:1px solid #1e293b; padding:12px 16px; display:flex; align-items:center; justify-content:space-between; z-index:10;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <button type="button" id="nx-close-pub-profile" style="background:none; border:none; color:#f8fafc; font-size:20px; font-weight:900; cursor:pointer;">←</button>
                    <div>
                        <div style="font-size:16px; font-weight:900; color:#f8fafc;">
                            @${userObj.username} ${userObj.verified || userObj.googleVerified ? "✅" : ""}
                        </div>
                        <div style="font-size:10.5px; color:#34d399; font-weight:700;">
                            ${userObj.isOnlineNow ? "🟢 Online Now" : seenText ? "Last seen " + seenText : "Nexus Member"}
                        </div>
                    </div>
                </div>
                <button type="button" id="nx-pub-zoom-btn" style="padding:6px 11px; border-radius:10px; background:#1e293b; border:1px solid #334155; color:#38bdf8; font-size:11.5px; font-weight:800; cursor:pointer;">
                    🔍 Zoom DP
                </button>
            </div>

            <div style="padding:16px;">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:14px;">
                    ${dpHtml}
                    <div style="flex:1; display:grid; grid-template-columns:repeat(3, 1fr); text-align:center;">
                        <div>
                            <div style="font-size:17px; font-weight:900; color:#f8fafc;">${userPosts.length}</div>
                            <div style="font-size:11.5px; color:#94a3b8;">posts</div>
                        </div>
                        <div id="nx-pub-followers-btn" style="cursor:pointer;">
                            <div id="nx-pub-followers-cnt" style="font-size:17px; font-weight:900; color:#f8fafc;">${(userObj.followersList || []).length}</div>
                            <div style="font-size:11.5px; color:#94a3b8;">followers</div>
                        </div>
                        <div id="nx-pub-following-btn" style="cursor:pointer;">
                            <div style="font-size:17px; font-weight:900; color:#f8fafc;">${(userObj.followingList || []).length}</div>
                            <div style="font-size:11.5px; color:#94a3b8;">following</div>
                        </div>
                    </div>
                </div>

                <div style="margin-top:12px;">
                    <div style="font-size:14.5px; font-weight:900; color:#f8fafc;">${userObj.name || userObj.username}</div>
                    <div style="font-size:12.5px; color:#cbd5e1; margin-top:3px; line-height:1.4;">${userObj.bio || "Nexus Community Member ✨"}</div>
                    ${songBannerHtml}
                </div>

                <!-- Follow & Message Buttons -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:14px;">
                    <button type="button" id="nx-pub-follow-toggle" style="padding:10px; border-radius:11px; background:${
                        isFollowing ? "#1e293b" : "#10b981"
                    }; color:${isFollowing ? "#f8fafc" : "#020617"}; border:${
            isFollowing ? "1px solid #334155" : "none"
        }; font-weight:900; font-size:13px; cursor:pointer;">
                        ${isFollowing ? "Following ✓" : "Follow"}
                    </button>
                    <button type="button" id="nx-pub-msg-btn" style="padding:10px; border-radius:11px; background:#1e293b; color:#f8fafc; border:1px solid #334155; font-weight:800; font-size:13px; cursor:pointer;">
                        Message 💬
                    </button>
                </div>

                <div style="border-top:1px solid #1e293b; margin-top:16px; padding-top:10px; text-align:center; font-size:12px; font-weight:800; color:#38bdf8;">
                    ⊞ POSTS (${userPosts.length})
                </div>
                ${gridHtml}
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector("#nx-close-pub-profile").onclick = () => {
            if (activeSongAudio) activeSongAudio.pause();
            modal.remove();
        };
        modal.querySelector("#nx-pub-zoom-btn").onclick = () => window.openAvatarLongPressZoomModal(userObj);
        modal.querySelector("#nx-pub-dp-img").onclick = () => window.openAvatarLongPressZoomModal(userObj);

        const songBtn = modal.querySelector("#nx-pub-play-song");
        if (songBtn && userObj.profileSong) {
            songBtn.onclick = () => window.togglePlayProfileSong(userObj.profileSong.audioUrl, songBtn);
        }

        modal.querySelector("#nx-pub-followers-btn").onclick = () => {
            openFollowersFollowingModal("Followers", userObj.followersList || []);
        };
        modal.querySelector("#nx-pub-following-btn").onclick = () => {
            openFollowersFollowingModal("Following", userObj.followingList || []);
        };

        modal.querySelector("#nx-pub-follow-toggle").onclick = async function () {
            if (!isUserVerified()) {
                modal.remove();
                if (window.Nexus) Nexus.switchTab("tab-profile");
                return;
            }
            const curMe = getActiveUser();
            if (!curMe || !curMe.username) return;
            const myKey = curMe.username.toLowerCase().trim();

            userObj.followersList = cleanUniqueList(userObj.followersList || []);
            curMe.followingList = cleanUniqueList(curMe.followingList || []);

            if (userObj.followersList.includes(myKey)) {
                userObj.followersList = userObj.followersList.filter((x) => x !== myKey);
                curMe.followingList = curMe.followingList.filter((x) => x !== targetKey);
                this.innerText = "Follow";
                this.style.background = "#10b981";
                this.style.color = "#020617";
            } else {
                userObj.followersList.push(myKey);
                curMe.followingList.push(targetKey);
                this.innerText = "Following ✓";
                this.style.background = "#1e293b";
                this.style.color = "#f8fafc";
            }

            const cntEl = modal.querySelector("#nx-pub-followers-cnt");
            if (cntEl) cntEl.textContent = String(userObj.followersList.length);
            localStorage.setItem("nx_active_account", JSON.stringify(curMe));

            if (window.Nexus && Nexus.db) {
                await Promise.allSettled([
                    Nexus.db.collection("nexus_accounts").doc(targetKey).set({ followersList: userObj.followersList }, { merge: true }),
                    Nexus.db.collection("nexus_accounts").doc(myKey).set({ followingList: curMe.followingList }, { merge: true })
                ]);
            }
        };

        modal.querySelector("#nx-pub-msg-btn").onclick = () => {
            if (!isUserVerified()) {
                modal.remove();
                if (window.Nexus) Nexus.switchTab("tab-profile");
                return;
            }
            modal.remove();
            window.currentChatUser = userObj.username;
            if (window.Nexus && typeof Nexus.openDM === "function") {
                Nexus.openDM(userObj.username);
            } else if (window.openDirectMessage) {
                window.openDirectMessage(userObj.username);
            } else if (window.Nexus) {
                Nexus.switchTab("tab-community");
            }
        };
    };

    // Global Long-Press Listener on ANY User Avatar / Story Circle / Post Author DP!
    function bindGlobalAvatarLongPress() {
        const startHold = (e) => {
            const target = e.target.closest("img, div, span");
            if (!target) return;
            const rect = target.getBoundingClientRect();
            if (rect.width < 26 || rect.width > 120) return;

            // Find closest story card, post header, or chat header
            const container = target.closest("[data-username], article, .nx-story-item, div");
            if (!container) return;

            const lines = (container.innerText || "").split("\n").map((l) => l.trim()).filter(Boolean);
            let candidateName = container.getAttribute("data-username") || "";
            if (!candidateName && lines.length > 0) {
                candidateName = lines.find((l) => !l.endsWith("ago") && l !== "Live" && l !== "🟢 Live" && !l.includes("DM Open")) || lines[0];
            }
            const matchedUser = findUserObjectByAnyIdentifier(candidateName);
            if (!matchedUser) return;

            clearTimeout(longPressTimer);
            longPressTimer = setTimeout(() => {
                window.openAvatarLongPressZoomModal(matchedUser);
            }, 480);
        };

        const cancelHold = () => clearTimeout(longPressTimer);

        document.addEventListener("touchstart", startHold, { passive: true });
        document.addEventListener("touchend", cancelHold, { passive: true });
        document.addEventListener("touchmove", cancelHold, { passive: true });
    }
    bindGlobalAvatarLongPress();

    // =========================================================================
    // 4. INTERACTIVE FOLLOWERS / FOLLOWING MODAL & POST VIEWER / EDITOR
    // =========================================================================
    function openFollowersFollowingModal(title, usernameList) {
        document.getElementById("nx-follow-list-modal")?.remove();
        const cleanList = cleanUniqueList(usernameList);

        const rowsHtml = cleanList.length
            ? cleanList
                  .map((uname) => {
                      const uObj = findUserObjectByAnyIdentifier(uname) || { username: uname, name: uname };
                      const av = uObj.dp
                          ? `<img src="${uObj.dp}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;" />`
                          : `<div style="width:40px; height:40px; border-radius:50%; background:#10b981; color:#020617; font-weight:900; display:flex; align-items:center; justify-content:center;">${(
                                uObj.name || uname
                            )[0].toUpperCase()}</div>`;
                      return `
                          <div data-open-u="${uObj.username}" style="display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-radius:12px; background:#090d16; border:1px solid #1e293b; margin-bottom:7px; cursor:pointer;">
                              <div style="display:flex; align-items:center; gap:10px;">
                                  ${av}
                                  <div>
                                      <div style="font-size:13px; font-weight:800; color:#f8fafc;">${uObj.name || uObj.username}</div>
                                      <div style="font-size:11px; color:#34d399;">@${uObj.username}</div>
                                  </div>
                              </div>
                              <span style="padding:6px 11px; border-radius:9px; background:#1e293b; color:#38bdf8; font-size:11.5px; font-weight:800;">View Profile</span>
                          </div>
                      `;
                  })
                  .join("")
            : `<div style="text-align:center; padding:24px; color:#64748b; font-size:13px;">No users in ${title} list yet.</div>`;

        const modal = document.createElement("div");
        modal.id = "nx-follow-list-modal";
        modal.style.cssText =
            "position:fixed; inset:0; background:rgba(2,6,23,0.9); z-index:200085; display:flex; align-items:flex-end; justify-content:center;";

        modal.innerHTML = `
            <div style="background:#0f172a; border-top:1.5px solid #334155; border-radius:24px 24px 0 0; width:100%; max-width:600px; max-height:80dvh; overflow-y:auto; padding:18px 16px 26px; color:#fff;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid #1e293b;">
                    <h3 style="font-size:16px; font-weight:900; color:#f8fafc;">${title} (${cleanList.length})</h3>
                    <button type="button" id="nx-close-fl-modal" style="width:30px; height:30px; border-radius:50%; background:#1e293b; border:none; color:#fff; font-weight:900; cursor:pointer;">✕</button>
                </div>
                ${rowsHtml}
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector("#nx-close-fl-modal").onclick = () => modal.remove();
        modal.querySelectorAll("[data-open-u]").forEach((r) => {
            r.onclick = () => {
                const u = r.getAttribute("data-open-u");
                modal.remove();
                window.openPublicUserProfileModal(u);
            };
        });
    }

    function openOwnPostDetailAndEditModal(postObj) {
        if (!postObj) return;
        document.getElementById("nx-own-post-modal")?.remove();

        const modal = document.createElement("div");
        modal.id = "nx-own-post-modal";
        modal.style.cssText =
            "position:fixed; inset:0; background:rgba(2,6,23,0.92); z-index:200085; display:flex; align-items:center; justify-content:center; padding:16px;";

        const mediaHtml = postObj.image
            ? postObj.mediaType === "video" || String(postObj.image).startsWith("data:video/")
                ? `<video src="${postObj.image}" controls playsinline style="width:100%; max-height:280px; border-radius:12px; background:#000; margin-bottom:10px;"></video>`
                : `<img src="${postObj.image}" style="width:100%; max-height:280px; object-fit:cover; border-radius:12px; margin-bottom:10px;" />`
            : "";

        modal.innerHTML = `
            <div style="background:#0f172a; border:1.5px solid #334155; border-radius:22px; width:100%; max-width:410px; padding:18px; color:#fff; box-shadow:0 20px 50px rgba(0,0,0,0.95);">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
                    <span style="font-size:14px; font-weight:900; color:#34d399;">✏️ Manage Your Post</span>
                    <button type="button" id="nx-close-p-edit" style="width:28px; height:28px; border-radius:50%; background:#1e293b; border:none; color:#fff; font-weight:900; cursor:pointer;">✕</button>
                </div>
                ${mediaHtml}
                <textarea id="nx-edit-post-txt" rows="3" style="width:100%; padding:10px 12px; border-radius:12px; background:#090d16; border:1px solid #334155; color:#fff; font-size:13px; outline:none; resize:none;">${
                    postObj.content || postObj.text || ""
                }</textarea>
                <div style="display:flex; gap:8px; margin-top:12px;">
                    <button type="button" id="nx-save-post-edit" style="flex:1; padding:11px; border-radius:12px; background:#10b981; color:#020617; font-weight:900; font-size:12.5px; border:none; cursor:pointer;">
                        💾 Save Changes
                    </button>
                    <button type="button" id="nx-delete-post-btn" style="padding:11px 14px; border-radius:12px; background:#e11d48; color:#fff; font-weight:900; font-size:12.5px; border:none; cursor:pointer;">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector("#nx-close-p-edit").onclick = () => modal.remove();

        modal.querySelector("#nx-save-post-edit").onclick = async () => {
            const newTxt = (modal.querySelector("#nx-edit-post-txt").value || "").trim();
            postObj.content = newTxt;
            postObj.text = newTxt;
            if (window.Nexus && Nexus.db && postObj.id) {
                await Nexus.db.collection("nexus_real_posts").doc(postObj.id).set({ content: newTxt, text: newTxt }, { merge: true }).catch(() => {});
            }
            modal.remove();
            renderMyInstagramProfileTab();
            if (window.Nexus && Nexus.toast) Nexus.toast("✅ Post Updated!");
        };

        modal.querySelector("#nx-delete-post-btn").onclick = async () => {
            if (!confirm("🗑️ Delete this post permanently?")) return;
            if (window.Nexus && Nexus.db && postObj.id) {
                await Nexus.db.collection("nexus_real_posts").doc(postObj.id).delete().catch(() => {});
            }
            if (window.Nexus && Array.isArray(Nexus.posts)) {
                Nexus.posts = Nexus.posts.filter((p) => p.id !== postObj.id);
            }
            modal.remove();
            renderMyInstagramProfileTab();
            if (window.Nexus && Nexus.toast) Nexus.toast("🗑️ Post Deleted!");
        };
    }

    // =========================================================================
    // 5. EDIT PROFILE MODAL (NAME, BIO, CATEGORY, WEBSITE LINK, MOOD NOTE, DP)
    // =========================================================================
    function openEditInstagramProfileModal() {
        const me = getActiveUser();
        if (!me) return;
        document.getElementById("nx-edit-ig-profile-modal")?.remove();

        const modal = document.createElement("div");
        modal.id = "nx-edit-ig-profile-modal";
        modal.style.cssText =
            "position:fixed; inset:0; background:rgba(2,6,23,0.92); z-index:200085; display:flex; align-items:flex-end; justify-content:center;";

        modal.innerHTML = `
            <div style="background:#0f172a; border-top:1.5px solid #10b981; border-radius:24px 24px 0 0; width:100%; max-width:600px; max-height:88dvh; overflow-y:auto; padding:18px 16px 28px; color:#fff;">
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid #1e293b;">
                    <h3 style="font-size:16.5px; font-weight:900; color:#f8fafc;">Edit Official Profile</h3>
                    <button type="button" id="nx-close-edit-prof" style="width:30px; height:30px; border-radius:50%; background:#1e293b; border:none; color:#fff; font-weight:900; cursor:pointer;">✕</button>
                </div>

                <div style="display:flex; flex-direction:column; gap:10px;">
                    <div>
                        <label style="font-size:10.5px; font-weight:800; color:#94a3b8; display:block; margin-bottom:3px;">DISPLAY NAME</label>
                        <input type="text" id="nx-ep-name" value="${me.name || ""}" style="width:100%; padding:10px 12px; border-radius:11px; background:#090d16; border:1px solid #334155; color:#fff; font-size:13px; outline:none;" />
                    </div>
                    <div>
                        <label style="font-size:10.5px; font-weight:800; color:#94a3b8; display:block; margin-bottom:3px;">BIO / ABOUT YOU</label>
                        <textarea id="nx-ep-bio" rows="2" style="width:100%; padding:10px 12px; border-radius:11px; background:#090d16; border:1px solid #334155; color:#fff; font-size:13px; outline:none; resize:none;">${
                            me.bio || ""
                        }</textarea>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                        <div>
                            <label style="font-size:10.5px; font-weight:800; color:#94a3b8; display:block; margin-bottom:3px;">MOOD NOTE (ABOVE DP)</label>
                            <input type="text" id="nx-ep-mood" value="${
                                me.moodNote || ""
                            }" placeholder="e.g. Coding Mode ⚡" style="width:100%; padding:10px 12px; border-radius:11px; background:#090d16; border:1px solid #334155; color:#fff; font-size:12.5px; outline:none;" />
                        </div>
                        <div>
                            <label style="font-size:10.5px; font-weight:800; color:#94a3b8; display:block; margin-bottom:3px;">WEBSITE / LINK</label>
                            <input type="text" id="nx-ep-link" value="${
                                me.website || ""
                            }" placeholder="https://..." style="width:100%; padding:10px 12px; border-radius:11px; background:#090d16; border:1px solid #334155; color:#fff; font-size:12.5px; outline:none;" />
                        </div>
                    </div>
                    <button type="button" id="nx-save-ep-btn" style="width:100%; padding:13px; border-radius:13px; background:linear-gradient(90deg,#10b981,#06b6d4); color:#020617; font-weight:900; font-size:13.5px; border:none; cursor:pointer; margin-top:6px;">
                        ✅ Save Profile Changes
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector("#nx-close-edit-prof").onclick = () => modal.remove();

        modal.querySelector("#nx-save-ep-btn").onclick = async () => {
            me.name = (modal.querySelector("#nx-ep-name").value || me.username).trim();
            me.bio = (modal.querySelector("#nx-ep-bio").value || "").trim();
            me.moodNote = (modal.querySelector("#nx-ep-mood").value || "").trim();
            me.website = (modal.querySelector("#nx-ep-link").value || "").trim();

            localStorage.setItem("nx_active_account", JSON.stringify(me));
            if (window.Nexus && Nexus.db) {
                await Nexus.db
                    .collection("nexus_accounts")
                    .doc(me.username.toLowerCase().trim())
                    .set(
                        {
                            name: me.name,
                            bio: me.bio,
                            moodNote: me.moodNote,
                            website: me.website,
                            lastOnline: Date.now()
                        },
                        { merge: true }
                    )
                    .catch(() => {});
            }
            if (window.Nexus) {
                Nexus.rebuildAllUsersMasterList && Nexus.rebuildAllUsersMasterList();
                Nexus.notifyAll && Nexus.notifyAll();
                Nexus.toast && Nexus.toast("✅ Profile Updated!");
            }
            modal.remove();
            renderMyInstagramProfileTab();
        };
    }

    // =========================================================================
    // 6. MAIN INSTAGRAM-STYLE PROFILE TAB RENDERER (#tab-profile)
    // =========================================================================
    function renderMyInstagramProfileTab() {
        const container = document.getElementById("tab-profile");
        if (!container) return;

        // If user is not verified/logged in, let the Auth Verification Hub render cleanly
        if (!isUserVerified()) return;

        const me = (window.Nexus && Nexus.getCurrentUser && Nexus.getCurrentUser()) || getActiveUser();
        if (!me || !me.username) return;

        const myKey = me.username.toLowerCase().trim();
        const allMyPosts = ((window.Nexus && Nexus.posts) || []).filter((p) => {
            if (!p) return false;
            const pU = (p.username || "").toLowerCase().trim();
            const pA = (p.author || "").toLowerCase().trim();
            return pU === myKey || pA === (me.name || "").toLowerCase().trim();
        });

        const myVideoPosts = allMyPosts.filter(
            (p) =>
                p.mediaType === "video" ||
                String(p.image || "").startsWith("data:video/") ||
                String(p.image || "").startsWith("NX_VIDEO_STREAM:") ||
                String(p.image || "").match(/\.(mp4|webm|mov)(\?|$)/i)
        );

        let savedPosts = [];
        try {
            savedPosts = JSON.parse(localStorage.getItem("nx_saved_posts") || "[]");
        } catch (e) {}

        const activeList =
            currentProfileTabMode === "videos"
                ? myVideoPosts
                : currentProfileTabMode === "saved"
                ? savedPosts
                : allMyPosts;

        const dpHtml = me.dp
            ? `<img src="${me.dp}" id="nx-my-dp-img" style="width:86px; height:86px; border-radius:50%; object-fit:cover; border:3px solid #10b981; padding:2px; background:#090d16; cursor:pointer;" />`
            : `<div id="nx-my-dp-img" style="width:86px; height:86px; border-radius:50%; background:linear-gradient(135deg,#10b981,#0284c7); color:#020617; font-size:34px; font-weight:900; display:flex; align-items:center; justify-content:center; border:3px solid #34d399; cursor:pointer;">${(
                  me.name || me.username
              )[0].toUpperCase()}</div>`;

        const songPlayerHtml =
            me.profileSong && me.profileSong.title
                ? `<div style="margin-top:10px; padding:8px 12px; border-radius:13px; background:linear-gradient(90deg,#090d16,#0f172a); border:1px solid rgba(16,185,129,0.45); display:flex; align-items:center; justify-content:space-between; gap:10px;">
                       <div style="display:flex; align-items:center; gap:9px; min-width:0;">
                           ${
                               me.profileSong.coverUrl
                                   ? `<img src="${me.profileSong.coverUrl}" style="width:32px; height:32px; border-radius:8px; object-fit:cover; flex-shrink:0;" />`
                                   : `<span style="font-size:16px;">🎵</span>`
                           }
                           <div style="min-width:0;">
                               <div style="font-size:12px; font-weight:800; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${me.profileSong.title}</div>
                               <div style="font-size:10.5px; color:#34d399; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${me.profileSong.artist || "Profile Song"}</div>
                           </div>
                       </div>
                       <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                           <button type="button" id="nx-my-song-play" style="padding:5px 11px; border-radius:999px; background:#10b981; color:#020617; font-weight:900; font-size:11px; border:none; cursor:pointer;">▶️ Play</button>
                           <button type="button" id="nx-my-song-change" style="padding:5px 8px; border-radius:999px; background:#1e293b; color:#38bdf8; font-weight:800; font-size:11px; border:1px solid #334155; cursor:pointer;">🎵</button>
                       </div>
                   </div>`
                : `<button type="button" id="nx-add-song-empty-btn" style="margin-top:8px; display:inline-flex; align-items:center; gap:6px; padding:5px 11px; border-radius:999px; background:rgba(56,189,248,0.12); border:1px dashed rgba(56,189,248,0.45); color:#38bdf8; font-size:11.5px; font-weight:800; cursor:pointer;">
                       🎵 + Add Music to Your Profile
                   </button>`;

        const gridHtml = activeList.length
            ? `<div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:3px; margin-top:2px;">
                   ${activeList
                       .map((p, idx) => {
                           const img = p.image || p.videoUrl || "";
                           const isVid =
                               p.mediaType === "video" ||
                               String(img).startsWith("data:video/") ||
                               String(img).startsWith("NX_VIDEO_STREAM:");

                           if (img && !String(img).startsWith("NX_VIDEO_STREAM:")) {
                               return `<div class="nx-my-grid-item" data-post-idx="${idx}" style="aspect-ratio:1/1; background:#090d16; overflow:hidden; position:relative; cursor:pointer;">
                                           ${
                                               isVid
                                                   ? `<video src="${img}" muted playsinline style="width:100%; height:100%; object-fit:cover; display:block;"></video><span style="position:absolute; top:6px; right:6px; font-size:12px;">🎬</span>`
                                                   : `<img src="${img}" style="width:100%; height:100%; object-fit:cover; display:block;" />`
                                           }
                                       </div>`;
                           }
                           return `<div class="nx-my-grid-item" data-post-idx="${idx}" style="aspect-ratio:1/1; background:linear-gradient(145deg,#0f172a,#1e293b); border:1px solid #1e293b; padding:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; font-size:11px; color:#e2e8f0; cursor:pointer; overflow:hidden;">
                                       ${isVid ? `<div style="font-size:20px; margin-bottom:4px;">🎬</div>` : ""}
                                       <div>${(p.content || p.text || "Post").slice(0, 50)}</div>
                                   </div>`;
                       })
                       .join("")}
               </div>`
            : `<div style="text-align:center; padding:40px 16px; color:#64748b;">
                   <div style="font-size:28px; margin-bottom:6px;">${
                       currentProfileTabMode === "videos" ? "🎬" : currentProfileTabMode === "saved" ? "🔖" : "📷"
                   }</div>
                   <div style="font-size:13.5px; font-weight:800; color:#cbd5e1;">No ${currentProfileTabMode} yet</div>
               </div>`;

        container.innerHTML = `
            <div id="nx-ig-profile-root" style="padding-bottom:36px; background:#090d16; min-height:calc(100dvh - 120px);">
                <!-- 1. Top Instagram Username & Account Switcher Bar -->
                <div style="padding:12px 16px; border-bottom:1px solid #1e293b; display:flex; align-items:center; justify-content:space-between; background:#090d16;">
                    <div id="nx-prof-switch-trigger" style="display:flex; align-items:center; gap:6px; cursor:pointer;">
                        <span style="font-size:18px; font-weight:900; color:#f8fafc;">@${me.username}</span>
                        <span style="background:#10b981; color:#020617; font-size:10px; font-weight:900; padding:1px 6px; border-radius:999px;">✓</span>
                        <span style="color:#94a3b8; font-size:13px;">▾</span>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <button type="button" id="nx-prof-new-post" title="Create Post" style="padding:6px 11px; border-radius:10px; background:#1e293b; border:1px solid #334155; color:#f8fafc; font-size:12px; font-weight:800; cursor:pointer;">＋ Post</button>
                        <button type="button" id="nx-prof-open-settings" title="Settings" style="padding:6px 11px; border-radius:10px; background:#1e293b; border:1px solid #334155; color:#38bdf8; font-size:13px; font-weight:900; cursor:pointer;">☰</button>
                    </div>
                </div>

                <!-- 2. Avatar + Real Stats Row -->
                <div style="padding:16px 16px 10px;">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:14px;">
                        <div style="position:relative; flex-shrink:0;">
                            <div id="nx-my-mood-pill" style="position:absolute; top:-12px; left:50%; transform:translateX(-50%); background:#1e293b; border:1px solid #38bdf8; color:#f8fafc; font-size:10px; font-weight:800; padding:2px 8px; border-radius:12px; white-space:nowrap; z-index:5; cursor:pointer; box-shadow:0 4px 10px rgba(0,0,0,0.6);">
                                ${me.moodNote ? "💭 " + me.moodNote : "💭 Note..."}
                            </div>
                            ${dpHtml}
                            <label for="nx-upload-new-dp" style="position:absolute; bottom:0; right:0; width:26px; height:26px; border-radius:50%; background:#38bdf8; color:#020617; font-weight:900; font-size:16px; display:flex; align-items:center; justify-content:center; border:2px solid #090d16; cursor:pointer;">+</label>
                            <input type="file" id="nx-upload-new-dp" accept="image/*" style="display:none;" />
                        </div>

                        <div style="flex:1; display:grid; grid-template-columns:repeat(3, 1fr); text-align:center;">
                            <div>
                                <div style="font-size:18px; font-weight:900; color:#f8fafc;">${allMyPosts.length}</div>
                                <div style="font-size:11.5px; color:#94a3b8;">posts</div>
                            </div>
                            <div id="nx-my-followers-trigger" style="cursor:pointer;">
                                <div style="font-size:18px; font-weight:900; color:#f8fafc;">${(me.followersList || []).length}</div>
                                <div style="font-size:11.5px; color:#94a3b8;">followers</div>
                            </div>
                            <div id="nx-my-following-trigger" style="cursor:pointer;">
                                <div style="font-size:18px; font-weight:900; color:#f8fafc;">${(me.followingList || []).length}</div>
                                <div style="font-size:11.5px; color:#94a3b8;">following</div>
                            </div>
                        </div>
                    </div>

                    <!-- 3. Name, Bio, Website Link & Profile Song -->
                    <div style="margin-top:12px;">
                        <div style="font-size:15px; font-weight:900; color:#f8fafc;">${me.name || me.username}</div>
                        <div style="font-size:12.5px; color:#cbd5e1; margin-top:3px; line-height:1.45; white-space:pre-line;">${
                            me.bio || "Official Nexus Community Member ✨"
                        }</div>
                        ${
                            me.website
                                ? `<a href="${me.website}" target="_blank" style="display:inline-block; font-size:12px; color:#38bdf8; font-weight:700; margin-top:4px; text-decoration:none;">🔗 ${me.website}</a>`
                                : ""
                        }
                        <div>${songPlayerHtml}</div>
                    </div>

                    <!-- 4. Instagram Action Buttons -->
                    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:7px; margin-top:14px;">
                        <button type="button" id="nx-btn-edit-profile" style="padding:9px; border-radius:10px; background:#1e293b; border:1px solid #334155; color:#f8fafc; font-weight:800; font-size:12px; cursor:pointer;">
                            Edit profile
                        </button>
                        <button type="button" id="nx-btn-profile-song" style="padding:9px; border-radius:10px; background:#1e293b; border:1px solid #334155; color:#34d399; font-weight:800; font-size:12px; cursor:pointer;">
                            🎵 Profile Song
                        </button>
                        <button type="button" id="nx-btn-share-profile" style="padding:9px; border-radius:10px; background:#1e293b; border:1px solid #334155; color:#38bdf8; font-weight:800; font-size:12px; cursor:pointer;">
                            Share profile
                        </button>
                    </div>
                </div>

                <!-- 5. 3-Tab Instagram Grid Selector (Posts | Videos | Saved) -->
                <div style="display:grid; grid-template-columns:repeat(3, 1fr); border-top:1px solid #1e293b; border-bottom:1px solid #1e293b; margin-top:8px;">
                    <button type="button" data-ptab="posts" style="padding:11px; background:none; border:none; border-bottom:2.5px solid ${
                        currentProfileTabMode === "posts" ? "#f8fafc" : "transparent"
                    }; color:${currentProfileTabMode === "posts" ? "#f8fafc" : "#64748b"}; font-weight:900; font-size:12.5px; cursor:pointer;">
                        ⊞ Posts
                    </button>
                    <button type="button" data-ptab="videos" style="padding:11px; background:none; border:none; border-bottom:2.5px solid ${
                        currentProfileTabMode === "videos" ? "#f8fafc" : "transparent"
                    }; color:${currentProfileTabMode === "videos" ? "#f8fafc" : "#64748b"}; font-weight:900; font-size:12.5px; cursor:pointer;">
                        🎬 Videos
                    </button>
                    <button type="button" data-ptab="saved" style="padding:11px; background:none; border:none; border-bottom:2.5px solid ${
                        currentProfileTabMode === "saved" ? "#f8fafc" : "transparent"
                    }; color:${currentProfileTabMode === "saved" ? "#f8fafc" : "#64748b"}; font-weight:900; font-size:12.5px; cursor:pointer;">
                        🔖 Saved
                    </button>
                </div>

                <!-- 6. 3-Column Content Grid -->
                ${gridHtml}
            </div>
        `;

        // Bind Top & Action Controls
        container.querySelector("#nx-prof-switch-trigger").onclick = () => {
            if (window.openAdvancedGoogleAuthModal) window.openAdvancedGoogleAuthModal("signin");
        };
        container.querySelector("#nx-prof-new-post").onclick = () => {
            if (window.Nexus && Nexus.openPostModal) Nexus.openPostModal();
        };
        container.querySelector("#nx-prof-open-settings").onclick = () => {
            if (window.Nexus && Nexus.switchTab) Nexus.switchTab("tab-settings");
        };

        container.querySelector("#nx-my-dp-img").onclick = () => window.openAvatarLongPressZoomModal(me);
        container.querySelector("#nx-my-mood-pill").onclick = openEditInstagramProfileModal;
        container.querySelector("#nx-btn-edit-profile").onclick = openEditInstagramProfileModal;
        container.querySelector("#nx-btn-profile-song").onclick = window.openProfileSongPickerModal;

        const emptySongBtn = container.querySelector("#nx-add-song-empty-btn");
        if (emptySongBtn) emptySongBtn.onclick = window.openProfileSongPickerModal;

        const playMySongBtn = container.querySelector("#nx-my-song-play");
        if (playMySongBtn && me.profileSong) {
            playMySongBtn.onclick = () => window.togglePlayProfileSong(me.profileSong.audioUrl, playMySongBtn);
        }
        const changeMySongBtn = container.querySelector("#nx-my-song-change");
        if (changeMySongBtn) changeMySongBtn.onclick = window.openProfileSongPickerModal;

        // Upload new DP handler
        const dpInp = container.querySelector("#nx-upload-new-dp");
        if (dpInp) {
            dpInp.onchange = (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file || !window.Nexus || !Nexus.compressImage) return;
                Nexus.compressImage(file, 420, 0.72, async (b64) => {
                    me.dp = b64;
                    localStorage.setItem("nx_active_account", JSON.stringify(me));
                    if (Nexus.db) {
                        await Nexus.db.collection("nexus_accounts").doc(myKey).set({ dp: b64 }, { merge: true }).catch(() => {});
                    }
                    Nexus.rebuildAllUsersMasterList && Nexus.rebuildAllUsersMasterList();
                    renderMyInstagramProfileTab();
                    Nexus.toast && Nexus.toast("📸 Profile Picture Updated!");
                });
            };
        }

        container.querySelector("#nx-my-followers-trigger").onclick = () => {
            openFollowersFollowingModal("Followers", me.followersList || []);
        };
        container.querySelector("#nx-my-following-trigger").onclick = () => {
            openFollowersFollowingModal("Following", me.followingList || []);
        };

        container.querySelector("#nx-btn-share-profile").onclick = () => {
            const url = `https://nexus-community01.vercel.app/?user=${encodeURIComponent(me.username)}`;
            const shareData = {
                title: `@${me.username} on Nexus`,
                text: `🔥 Check out @${me.username}'s profile on Nexus Community: `,
                url: url
            };
            if (navigator.share) {
                navigator.share(shareData).catch(() => {});
            } else {
                navigator.clipboard?.writeText(shareData.text + url);
                if (window.Nexus && Nexus.toast) Nexus.toast("✅ Profile Link Copied!");
            }
        };

        container.querySelectorAll("[data-ptab]").forEach((btn) => {
            btn.onclick = () => {
                currentProfileTabMode = btn.getAttribute("data-ptab");
                renderMyInstagramProfileTab();
            };
        });

        container.querySelectorAll(".nx-my-grid-item").forEach((cell) => {
            cell.onclick = () => {
                const p = activeList[Number(cell.getAttribute("data-post-idx"))];
                if (p) openOwnPostDetailAndEditModal(p);
            };
        });
    }

    // Hook into Nexus Profile Tab & User Listeners
    if (window.Nexus && Nexus.listeners) {
        Nexus.listeners.onUsers.push(() => {
            const pTab = document.getElementById("tab-profile");
            if (pTab && pTab.classList.contains("active") && isUserVerified()) {
                renderMyInstagramProfileTab();
            }
        });
        Nexus.listeners.onPosts.push(() => {
            const pTab = document.getElementById("tab-profile");
            if (pTab && pTab.classList.contains("active") && isUserVerified()) {
                renderMyInstagramProfileTab();
            }
        });
    }

    // Expose `Nexus.openUserProfile` so clicking any user in Home Feed or Search opens their Public Profile!
    if (window.Nexus) {
        Nexus.openUserProfile = window.openPublicUserProfileModal;
    }

    setInterval(() => {
        if (window.Nexus && Nexus.openUserProfile !== window.openPublicUserProfileModal) {
            Nexus.openUserProfile = window.openPublicUserProfileModal;
        }
        const pTab = document.getElementById("tab-profile");
        if (pTab && pTab.classList.contains("active") && isUserVerified() && !pTab.querySelector("#nx-ig-profile-root")) {
            renderMyInstagramProfileTab();
        }
    }, 350);
})();
