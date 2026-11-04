// ================= HOME.JS (FINAL COMPLETE MASTER): DOUBLE-TAP LIKE ❤️ + SMOOTH COLOR-FILL SAVE 🔖 + 100% REAL VIEWS TRACKER 👁️ + COMMENT REPLY ↩️ & EDIT ✏️ + SINGLE MESSAGE BUTTON PROFILE + FULL VIEW BUTTON ONLY =================

(function() {
    const homeTab = document.getElementById('tab-home');
    if (!homeTab) return;

    let officialBroadcastData = {
        storyActive: true,
        storyTitle: "Official Nexus Update 🚀",
        storyText: "All members ek bar website ko refresh kar lain",
        storyMediaUrl: "",
        storyMediaType: "image",
        storyLink: ""
    };

    const CARD_THEME_STYLES = {
        default: { bg: '#101726', border: '#1e293b' },
        royal: { bg: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', border: '#38bdf8' },
        emerald: { bg: 'linear-gradient(135deg, #064e3b 0%, #090d16 100%)', border: '#10b981' },
        gold: { bg: 'linear-gradient(135deg, #422006 0%, #090d16 100%)', border: '#f59e0b' },
        neon: { bg: 'linear-gradient(135deg, #3b0764 0%, #090d16 100%)', border: '#a855f7' }
    };

    let activeSearchQuery = '';
    let openDropdownPostId = null;
    let lastPostTapTimeMap = {};
    let activeCommentReply = null;
    let activeCommentEditIdx = null;
    let sessionRecordedViews = new Set();

    const homeStyle = document.createElement('style');
    homeStyle.innerHTML = `
        #nx-stories-bar {
            display: flex !important;
            gap: 12px !important;
            overflow-x: auto !important;
            padding: 18px 14px 12px 14px !important;
            border-bottom: 1px solid #1e293b !important;
            background: #090d16 !important;
            scrollbar-width: none !important;
            align-items: flex-start !important;
        }
        #nx-stories-bar::-webkit-scrollbar {
            display: none !important;
        }
        .nx-story-card-item {
            width: 74px !important;
            min-width: 74px !important;
            max-width: 74px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: flex-start !important;
            position: relative !important;
            cursor: pointer !important;
            user-select: none !important;
            padding-top: 14px !important;
            flex-shrink: 0 !important;
        }
        .nx-story-ring-wrap {
            width: 60px !important;
            height: 60px !important;
            border-radius: 50% !important;
            padding: 2.5px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            position: relative !important;
            flex-shrink: 0 !important;
        }
        .nx-story-card-item .nx-story-time-pill {
            position: relative !important;
            bottom: auto !important;
            left: auto !important;
            transform: none !important;
            margin-top: -10px !important;
            z-index: 22 !important;
            background: #0f172a !important;
            border: 1px solid #38bdf8 !important;
            color: #e2e8f0 !important;
            font-size: 9.5px !important;
            font-weight: 800 !important;
            padding: 1.5px 7px !important;
            border-radius: 999px !important;
            white-space: nowrap !important;
            box-shadow: 0 2px 6px rgba(0,0,0,0.65) !important;
        }
        .nx-story-card-item .nx-story-time-pill.live {
            background: #064e3b !important;
            border-color: #10b981 !important;
            color: #6ee7b7 !important;
        }
        .nx-story-username-lbl {
            width: 72px !important;
            max-width: 72px !important;
            margin-top: 5px !important;
            font-size: 11px !important;
            font-weight: 700 !important;
            color: #e2e8f0 !important;
            text-align: center !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            display: block !important;
            line-height: 1.25 !important;
        }
        .nx-feed-wrap {
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 14px;
            padding-bottom: 36px;
        }
        .nx-post-card {
            background: #101726;
            border: 1px solid #1e293b;
            border-radius: 18px;
            padding: 14px;
            position: relative;
            user-select: none;
        }
        .nx-post-card.nx-pinned-card {
            border: 1.5px solid #10b981;
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.08);
        }
        .nx-post-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 10px;
        }
        .nx-post-author-row {
            display: flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            min-width: 0;
            flex: 1;
        }
        .nx-verified-tick {
            width: 15px;
            height: 15px;
            border-radius: 50%;
            background: #10b981;
            color: #022c22;
            font-size: 10px;
            font-weight: 900;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .nx-pinned-badge {
            background: rgba(16, 185, 129, 0.14);
            border: 1px solid rgba(16, 185, 129, 0.5);
            color: #34d399;
            font-size: 10px;
            font-weight: 800;
            padding: 3px 9px;
            border-radius: 999px;
            white-space: nowrap;
        }
        .nx-post-dots-btn {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #1e293b;
            border: 1px solid #334155;
            color: #cbd5e1;
            font-size: 16px;
            font-weight: 900;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .nx-post-dropdown-menu {
            position: absolute;
            top: 52px;
            right: 14px;
            background: #0f172a;
            border: 1px solid #38bdf8;
            border-radius: 14px;
            box-shadow: 0 12px 32px rgba(0,0,0,0.9);
            z-index: 95;
            min-width: 215px;
            overflow: hidden;
            display: none;
        }
        .nx-post-dropdown-menu.open {
            display: block;
        }
        .nx-post-dropdown-menu button {
            width: 100%;
            text-align: left;
            padding: 11px 14px;
            background: none;
            border: none;
            border-bottom: 1px solid #1e293b;
            color: #f1f5f9;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 9px;
        }
        .nx-post-dropdown-menu button:last-child {
            border-bottom: none;
        }
        .nx-liked-by-strip {
            background: rgba(244, 63, 94, 0.1);
            border: 1px solid rgba(244, 63, 94, 0.24);
            border-radius: 10px;
            padding: 7px 11px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 12px;
            margin-bottom: 11px;
            cursor: pointer;
        }
        .nx-act-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
        }
        .nx-act-pill {
            background: #161f33;
            border: 1px solid #26334d;
            color: #cbd5e1;
            padding: 6px 12px;
            border-radius: 999px;
            font-size: 12.5px;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            user-select: none;
            transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .nx-act-pill svg {
            width: 15px;
            height: 15px;
            stroke: currentColor;
            stroke-width: 2;
            fill: none;
            transition: all 0.28s ease;
        }
        /* Smooth Filled Like Button */
        .nx-act-pill.liked {
            color: #ffffff;
            border-color: #f43f5e;
            background: linear-gradient(135deg, #e11d48, #f43f5e);
            box-shadow: 0 3px 12px rgba(244, 63, 94, 0.38);
            transform: scale(1.04);
        }
        .nx-act-pill.liked svg {
            fill: #ffffff;
            stroke: #ffffff;
        }
        /* Smooth Full Color-Fill Save / Bookmark Button */
        .nx-act-pill.saved {
            color: #020617 !important;
            border-color: #38bdf8 !important;
            background: linear-gradient(135deg, #38bdf8, #00a884) !important;
            box-shadow: 0 4px 14px rgba(56, 189, 248, 0.45) !important;
            transform: scale(1.05);
        }
        .nx-act-pill.saved svg {
            fill: #020617 !important;
            stroke: #020617 !important;
        }
        @keyframes nxHeartBurst {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
            35% { opacity: 1; transform: translate(-50%, -50%) scale(1.35); }
            70% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
        }
        .nx-dbltap-heart {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 64px;
            pointer-events: none;
            z-index: 80;
            filter: drop-shadow(0 6px 18px rgba(244,63,94,0.75));
            animation: nxHeartBurst 0.75s ease-out forwards;
        }
        .nx-poll-opt-btn {
            width: 100%;
            background: #090d16;
            border: 1px solid #26334d;
            border-radius: 10px;
            padding: 9px 12px;
            color: #f8fafc;
            font-size: 13px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 7px;
            cursor: pointer;
        }
        .nx-poll-opt-btn.voted {
            border-color: #10b981;
            background: rgba(16, 185, 129, 0.14);
        }
    `;
    document.head.appendChild(homeStyle);

    homeTab.innerHTML = `
        <div id="nx-stories-bar"></div>
        <div id="nx-search-banner" style="display:none; margin:10px 12px 0 12px; padding:8px 12px; background:#161f33; border:1px solid #38bdf8; border-radius:12px; align-items:center; justify-content:space-between; font-size:12.5px; color:#f8fafc;">
            <span id="nx-search-banner-txt">🔍 Filtering posts...</span>
            <button type="button" onclick="NexusHome.clearSearchFilter()" style="background:#ef4444; color:white; border:none; padding:3px 9px; border-radius:8px; font-size:11px; font-weight:800; cursor:pointer;">Clear ✕</button>
        </div>
        <div id="nx-home-feed-box" class="nx-feed-wrap"></div>
    `;

    // Prevent dm.js global img listener from opening photo lightbox on single-tap inside Home Feed!
    // Only the "🔍 Full View" button will open the full-screen photo!
    document.addEventListener('click', e => {
        if (openDropdownPostId && !e.target.closest('.nx-post-dots-btn')) {
            const el = document.getElementById('nx-pdrop-' + openDropdownPostId);
            if (el) el.classList.remove('open');
            openDropdownPostId = null;
        }
        const feedImg = e.target.closest('#nx-home-feed-box img.nx-feed-post-img');
        if (feedImg) {
            e.stopPropagation();
        }
    }, true);

    function formatRelativePostTime(ts) {
        if (!ts) return '';
        let diff = Math.max(1, Math.floor((Date.now() - Number(ts)) / 1000));
        if (diff < 60) return 'Just now';
        let mins = Math.floor(diff / 60);
        if (mins < 60) return `${mins}m ago`;
        let hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    }

    function getSavedPostsSet() {
        let a = [], b = [];
        try { a = JSON.parse(localStorage.getItem('nx_saved_posts') || '[]'); } catch (e) {}
        try { b = JSON.parse(localStorage.getItem('nx_saved') || '[]'); } catch (e) {}
        return new Set([...a, ...b]);
    }

    function isStrictlyPostOwner(post, me) {
        if (!post || !me || post.username === 'nexus_official') return false;
        let myU = (me.username || '').toLowerCase().trim();
        let myN = (me.name || '').toLowerCase().trim();
        let postU = (post.username || '').toLowerCase().trim();
        let postA = (post.author || '').toLowerCase().trim();

        if (postU && myU && (postU === myU || postU === myN)) return true;
        if (postA && myN && (postA === myN || postA === myU)) return true;
        return false;
    }

    function resolveUserRealDP(username, authorName, fallbackDp) {
        let me = Nexus.getCurrentUser();
        let uKey = (username || '').toLowerCase().trim();
        let aKey = (authorName || '').toLowerCase().trim();

        if (me) {
            let myU = (me.username || '').toLowerCase().trim();
            let myN = (me.name || '').toLowerCase().trim();
            if ((uKey && (uKey === myU || uKey === myN)) || (aKey && (aKey === myN || aKey === myU))) {
                let mySavedDp = me.dp || localStorage.getItem('nx_backup_my_dp_' + myU) || '';
                if (mySavedDp && (mySavedDp.startsWith('data:image') || mySavedDp.startsWith('http'))) {
                    return mySavedDp;
                }
            }
        }

        let cloudMatch = (Nexus.cloudAccounts || []).find(u =>
            u && ((uKey && u.username && u.username.toLowerCase().trim() === uKey) || (aKey && u.name && u.name.toLowerCase().trim() === aKey))
        );
        if (cloudMatch && cloudMatch.dp && (cloudMatch.dp.startsWith('data:image') || cloudMatch.dp.startsWith('http'))) {
            return cloudMatch.dp;
        }

        let userMatch = (Nexus.users || []).find(u =>
            u && ((uKey && u.username && u.username.toLowerCase().trim() === uKey) || (aKey && u.name && u.name.toLowerCase().trim() === aKey))
        );
        if (userMatch && userMatch.dp && (userMatch.dp.startsWith('data:image') || userMatch.dp.startsWith('http'))) {
            return userMatch.dp;
        }

        if (fallbackDp && (fallbackDp.startsWith('data:image') || fallbackDp.startsWith('http'))) {
            return fallbackDp;
        }
        return '';
    }

    function formatPostBodyHTML(rawText) {
        if (!rawText) return '';
        if (window.NexusPost && typeof NexusPost.formatRichPostText === 'function') {
            return NexusPost.formatRichPostText(rawText);
        }
        let safe = String(rawText).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        safe = safe.replace(/\*\*([\s\S]+?)\*\*/g, '<strong style="font-weight:900; color:#ffffff;">$1</strong>');
        safe = safe.replace(/\*([^\*\n]+?)\*/g, '<em style="font-style:italic;">$1</em>');
        safe = safe.replace(/__([\s\S]+?)__/g, '<u style="text-decoration:underline;">$1</u>');
        safe = safe.replace(/==([\s\S]+?)==/g, '<mark style="background:rgba(250,204,21,0.25); color:#fde047; padding:1px 5px; border-radius:5px; font-weight:800;">$1</mark>');
        safe = safe.replace(/\[c:(#[a-fA-F0-9]{3,6})\]([\s\S]+?)\[\/c\]/g, '<span style="color:$1; font-weight:700;">$2</span>');
        return safe;
    }

    // Automatically record real unique post views for logged-in user
    function recordRealUserViewOnPost(p, me) {
        if (!p || !me || !me.username || !p.id) return;
        let myU = me.username.toLowerCase().trim();
        let viewers = Array.isArray(p.viewedBy) ? [...p.viewedBy] : [];
        if (p.author && p.username && p.username !== 'nexus_official' && !viewers.some(x => String(x).toLowerCase() === p.username.toLowerCase())) {
            viewers.push(p.username);
        }
        if (!viewers.some(u => String(u).toLowerCase().trim() === myU)) {
            viewers.push(me.username);
            p.viewedBy = viewers;
            if (Nexus.db && !String(p.id).startsWith('temp_') && !String(p.id).startsWith('official_') && !sessionRecordedViews.has(p.id)) {
                sessionRecordedViews.add(p.id);
                Nexus.db.collection("nexus_real_posts").doc(p.id).set({ viewedBy: viewers }, { merge: true }).catch(() => {});
            }
        } else {
            p.viewedBy = viewers;
        }
    }

    function renderTopStoriesBar() {
        const sBar = document.getElementById('nx-stories-bar');
        if (!sBar) return;

        let me = Nexus.getCurrentUser();
        let myKey = me && me.username ? me.username.toLowerCase().trim() : '';
        let myNameKey = me && me.name ? me.name.toLowerCase().trim() : '';

        let uniqueUsers = [];
        let seenNames = new Set();
        let seenUsernames = new Set();

        let rawList = Array.isArray(Nexus.users) ? [...Nexus.users] : [];
        if (me && me.username) {
            me.isOnlineNow = true;
            me.lastOnline = Date.now();
            let existingMe = rawList.find(u => u && u.username && (u.username.toLowerCase().trim() === myKey || (u.name && u.name.toLowerCase().trim() === myNameKey)));
            if (existingMe) {
                existingMe.isOnlineNow = true;
                existingMe.lastOnline = Date.now();
                if (me.dp) existingMe.dp = me.dp;
            } else {
                rawList.unshift(me);
            }
        }

        rawList.sort((a, b) => {
            let kA = (a && a.username ? a.username : '').toLowerCase().trim();
            let kB = (b && b.username ? b.username : '').toLowerCase().trim();
            let nA = (a && a.name ? a.name : '').toLowerCase().trim();
            let nB = (b && b.name ? b.name : '').toLowerCase().trim();

            if (kA === myKey || (myNameKey && nA === myNameKey)) return -1;
            if (kB === myKey || (myNameKey && nB === myNameKey)) return 1;

            let tsA = (a && (a.lastOnline || a.lastSeenAt)) || 0;
            let tsB = (b && (b.lastOnline || b.lastSeenAt)) || 0;
            let liveA = (a && a.isOnlineNow !== false && (Date.now() - tsA < 120000)) ? 1 : 0;
            let liveB = (b && b.isOnlineNow !== false && (Date.now() - tsB < 120000)) ? 1 : 0;
            if (liveA !== liveB) return liveB - liveA;
            return tsB - tsA;
        });

        rawList.forEach(u => {
            if (!u || !u.username || u.username === 'nexus_official') return;
            let uKey = u.username.toLowerCase().trim();
            let dispKey = (u.name || u.username).toLowerCase().trim();
            if (seenUsernames.has(uKey) || seenNames.has(dispKey)) return;
            seenUsernames.add(uKey);
            seenNames.add(dispKey);
            uniqueUsers.push(u);
        });

        let officialHTML = `
            <div class="nx-story-card-item" id="nx-official-story-node" onclick="NexusHome.openOfficialStoryModal()">
                <div class="nx-story-ring-wrap" style="background:linear-gradient(135deg, #10b981, #38bdf8); box-shadow:0 0 12px rgba(16,185,129,0.35);">
                    <div style="width:100%; height:100%; border-radius:50%; background:#090d16; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:21px; color:#38bdf8;">N</div>
                    <span style="position:absolute; bottom:0; right:0; width:16px; height:16px; border-radius:50%; background:#10b981; color:#022c22; font-size:10px; font-weight:900; display:flex; align-items:center; justify-content:center; border:2px solid #090d16;">✓</span>
                </div>
                <span class="nx-story-time-pill live">Official</span>
                <div class="nx-story-username-lbl" style="color:#10b981;">Nexus ✅</div>
            </div>
        `;

        let usersHTML = uniqueUsers.map(u => {
            let uKey = u.username.toLowerCase().trim();
            let nKey = (u.name || '').toLowerCase().trim();
            let isMe = (myKey && uKey === myKey) || (myNameKey && nKey === myNameKey);
            let ts = u.lastOnline || u.lastSeenAt || 0;
            let isLive = isMe || (u.isOnlineNow !== false && ts > 0 && (Date.now() - ts < 120000));

            let dpUrl = resolveUserRealDP(u.username, u.name, u.dp);
            let firstChar = (u.name || u.username || 'U').replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase() || 'U';
            let safeU = u.username.replace(/'/g, "\\'");

            let avatarInner = dpUrl
                ? `<img src="${dpUrl}" alt="${u.name}" style="width:100%; height:100%; border-radius:50%; object-fit:cover; display:block;" onerror="this.outerHTML='<div style=\\'width:100%;height:100%;border-radius:50%;background:#161f33;color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;\\'>${firstChar}</div>'">`
                : `<div style="width:100%; height:100%; border-radius:50%; background:#161f33; color:white; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:20px;">${firstChar}</div>`;

            let ringGrad = isLive
                ? 'linear-gradient(135deg, #10b981, #00a884)'
                : 'linear-gradient(135deg, #2563eb, #38bdf8)';

            let timeText = isLive ? '🟢 Live' : (ts > 0 ? formatRelativePostTime(ts) : 'Offline');

            return `
                <div class="nx-story-card-item" onclick="Nexus.openPublicProfile('${safeU}')">
                    <div class="nx-story-ring-wrap" style="background:${ringGrad};">
                        ${avatarInner}
                    </div>
                    <span class="nx-story-time-pill ${isLive ? 'live' : ''}">${timeText}</span>
                    <div class="nx-story-username-lbl" style="color:${isLive ? '#10b981' : '#e2e8f0'};">${u.name || u.username}</div>
                </div>
            `;
        }).join('');

        sBar.innerHTML = officialHTML + usersHTML;
    }

    setInterval(() => {
        const sBar = document.getElementById('nx-stories-bar');
        const offNode = document.getElementById('nx-official-story-node');
        if (sBar && offNode && sBar.firstElementChild !== offNode) {
            sBar.insertBefore(offNode, sBar.firstElementChild);
        }
    }, 450);

    function renderHomeFeed() {
        const feedBox = document.getElementById('nx-home-feed-box');
        if (!feedBox) return;

        let me = Nexus.getCurrentUser();
        let myU = me && me.username ? me.username.toLowerCase().trim() : '';
        let savedSet = getSavedPostsSet();

        let rawPosts = Array.isArray(Nexus.posts) ? [...Nexus.posts] : [];

        let hasOfficialPin = rawPosts.some(p => p && (p.isOfficialPinned || p.username === 'nexus_official'));
        if (!hasOfficialPin && officialBroadcastData.storyText) {
            rawPosts.unshift({
                id: 'official_pinned_default',
                username: 'nexus_official',
                author: 'Nexus',
                bio: 'Official Platform Announcement',
                isOfficialPinned: true,
                verified: true,
                text: officialBroadcastData.storyText || 'All members ek bar website ko refresh kar lain',
                likedBy: ['Atharv'],
                viewedBy: ['Atharv', 'Mohit_01'],
                comments: [],
                createdAt: Date.now()
            });
        }

        rawPosts.sort((a, b) => {
            let pinA = a && (a.isOfficialPinned || a.username === 'nexus_official') ? 1 : 0;
            let pinB = b && (b.isOfficialPinned || b.username === 'nexus_official') ? 1 : 0;
            if (pinA !== pinB) return pinB - pinA;
            return (b.createdAt || 0) - (a.createdAt || 0);
        });

        if (activeSearchQuery) {
            let q = activeSearchQuery.toLowerCase();
            rawPosts = rawPosts.filter(p =>
                p && ((p.text && p.text.toLowerCase().includes(q)) ||
                      (p.author && p.author.toLowerCase().includes(q)) ||
                      (p.username && p.username.toLowerCase().includes(q)))
            );
        }

        if (rawPosts.length === 0) {
            feedBox.innerHTML = `<div style="text-align:center; padding:32px 16px; color:#64748b; background:#101726; border:1px dashed #1e293b; border-radius:18px; font-size:13.5px;">No posts found. Tap the <b>+</b> button below to share the first post!</div>`;
            return;
        }

        feedBox.innerHTML = rawPosts.map(p => {
            if (!p || !p.id) return '';
            recordRealUserViewOnPost(p, me);

            let isOfficial = p.isOfficialPinned || p.username === 'nexus_official';
            let isStrictlyMine = isStrictlyPostOwner(p, me);

            let authorDisplay = isOfficial ? 'Nexus' : (p.author || p.username || 'Member');
            let authorUser = isOfficial ? 'nexus_official' : (p.username || p.author || 'member');
            let safeUser = authorUser.replace(/'/g, "\\'");

            let ownerAcc = (Nexus.users || []).find(u => u && u.username && u.username.toLowerCase().trim() === authorUser.toLowerCase().trim());
            let isVerified = isOfficial || (ownerAcc && ownerAcc.verified) || p.verified;
            let bioSub = isOfficial
                ? 'Official Platform Annou...'
                : `${(ownerAcc && ownerAcc.bio) || p.bio || 'JEE Aspirant'} • ${formatRelativePostTime(p.createdAt)}`;

            let dpUrl = isOfficial ? '' : resolveUserRealDP(p.username, p.author, p.dp);
            let firstChar = (authorDisplay || 'U').charAt(0).toUpperCase();

            let avatarHTML = isOfficial
                ? `<div style="width:42px; height:42px; border-radius:50%; background:#00a884; color:#022c22; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:18px; flex-shrink:0;">N</div>`
                : (dpUrl
                    ? `<img src="${dpUrl}" style="width:42px; height:42px; border-radius:50%; object-fit:cover; border:1.5px solid #38bdf8; flex-shrink:0;" onerror="this.outerHTML='<div style=\\'width:42px;height:42px;border-radius:50%;background:#2563eb;color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:16px;flex-shrink:0;\\'>${firstChar}</div>'">`
                    : `<div style="width:42px; height:42px; border-radius:50%; background:#2563eb; color:white; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:16px; flex-shrink:0;">${firstChar}</div>`);

            let likesArr = Array.isArray(p.likedBy) ? p.likedBy : [];
            let cmtsArr = Array.isArray(p.comments) ? p.comments : [];
            let realViewersSet = new Set([
                ...(Array.isArray(p.viewedBy) ? p.viewedBy : []),
                ...likesArr,
                ...cmtsArr.map(c => c && c.username).filter(Boolean)
            ]);
            let realViewsList = Array.from(realViewersSet);
            p.viewedBy = realViewsList;

            let isLiked = myU && likesArr.some(u => String(u).toLowerCase().trim() === myU);
            let isSaved = savedSet.has(p.id);

            let likedByBanner = '';
            if (likesArr.length > 0) {
                let firstLiker = likesArr[likesArr.length - 1];
                let moreTxt = likesArr.length > 1 ? ` + ${likesArr.length - 1} others` : '';
                likedByBanner = `
                    <div class="nx-liked-by-strip" onclick="Nexus.openPostLikesModal('${p.id}')">
                        <span style="color:#fda4af; font-weight:700;">❤️ Liked by ${firstLiker}${moreTxt}</span>
                        <span style="color:#60a5fa; font-weight:800;">View All →</span>
                    </div>
                `;
            }

            let pollHTML = '';
            if (p.poll && p.poll.opt1 && p.poll.opt2) {
                let v1 = Array.isArray(p.poll.voters1) ? p.poll.voters1 : [];
                let v2 = Array.isArray(p.poll.voters2) ? p.poll.voters2 : [];
                let v3 = Array.isArray(p.poll.voters3) ? p.poll.voters3 : [];
                let v4 = Array.isArray(p.poll.voters4) ? p.poll.voters4 : [];
                let totalVotes = v1.length + v2.length + v3.length + v4.length;

                const renderOpt = (idx, label, voters) => {
                    if (!label) return '';
                    let pct = totalVotes > 0 ? Math.round((voters.length / totalVotes) * 100) : 0;
                    let votedMe = myU && voters.map(x => String(x).toLowerCase()).includes(myU);
                    return `
                        <button type="button" class="nx-poll-opt-btn ${votedMe ? 'voted' : ''}" onclick="NexusHome.voteOnPostPoll('${p.id}', ${idx})">
                            <span>${label.replace(/</g, '&lt;')} ${votedMe ? '✓' : ''}</span>
                            <span style="color:#38bdf8; font-size:11.5px;">${pct}% (${voters.length})</span>
                        </button>
                    `;
                };

                pollHTML = `
                    <div style="background:#0b101d; border:1px solid #1e293b; border-radius:14px; padding:11px; margin-bottom:11px;">
                        <div style="font-size:11px; color:#10b981; font-weight:800; margin-bottom:8px;">📊 LIVE COMMUNITY POLL • ${totalVotes} Votes</div>
                        ${renderOpt(1, p.poll.opt1, v1)}
                        ${renderOpt(2, p.poll.opt2, v2)}
                        ${renderOpt(3, p.poll.opt3, v3)}
                        ${renderOpt(4, p.poll.opt4, v4)}
                    </div>
                `;
            }

            // Photo: Double-tap likes the post! Only clicking "🔍 Full View" opens the full-screen photo!
            let mediaHTML = '';
            if (p.image) {
                let safeImg = p.image.replace(/'/g, "\\'");
                mediaHTML = `
                    <div style="position:relative; border-radius:14px; overflow:hidden; margin-bottom:11px; border:1px solid #1e293b; background:#050811;" onclick="NexusHome.handlePostTapToLike('${p.id}', event)">
                        <img class="nx-feed-post-img" src="${p.image}" loading="lazy" style="width:100%; max-height:380px; object-fit:cover; display:block; cursor:pointer;">
                        <button type="button" onclick="event.stopPropagation(); NexusHome.openFullPhotoView('${safeImg}');" style="position:absolute; top:10px; right:10px; background:rgba(15,23,42,0.88); border:1px solid #38bdf8; color:#f8fafc; font-size:11px; font-weight:800; padding:5px 11px; border-radius:999px; cursor:pointer; z-index:10; box-shadow:0 4px 12px rgba(0,0,0,0.6);">🔍 Full View</button>
                    </div>
                `;
            }

            let formattedTextHTML = formatPostBodyHTML(p.text || '');
            let themeObj = (!isOfficial && p.cardTheme && CARD_THEME_STYLES[p.cardTheme]) ? CARD_THEME_STYLES[p.cardTheme] : null;
            let customCardStyle = themeObj && p.cardTheme !== 'default'
                ? `background:${themeObj.bg}; border-color:${themeObj.border};`
                : '';

            return `
                <article class="nx-post-card ${isOfficial ? 'nx-pinned-card' : ''}" id="nx-post-${p.id}" style="${customCardStyle}" ondblclick="NexusHome.triggerDoubleTapLike('${p.id}')">
                    <div class="nx-post-top">
                        <div class="nx-post-author-row" onclick="${isOfficial ? 'NexusHome.openOfficialStoryModal()' : `Nexus.openPublicProfile('${safeUser}')`}">
                            ${avatarHTML}
                            <div style="min-width:0; flex:1;">
                                <div style="font-size:14.5px; font-weight:800; color:#f8fafc; display:flex; align-items:center; gap:5px;">
                                    <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${authorDisplay}</span>
                                    ${isVerified ? `<span class="nx-verified-tick">✓</span>` : ''}
                                </div>
                                <div style="font-size:11.5px; color:${isOfficial ? '#10b981' : '#38bdf8'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${bioSub}</div>
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                            ${isOfficial ? `<span class="nx-pinned-badge">📌 PINNED</span>` : ''}
                            <button type="button" class="nx-post-dots-btn" onclick="NexusHome.togglePostMenu('${p.id}', event)">⋮</button>
                        </div>
                    </div>

                    <div class="nx-post-dropdown-menu" id="nx-pdrop-${p.id}">
                        <button type="button" onclick="NexusHome.askAiAboutPost('${p.id}', event)"><span>🤖</span> <span>Ask Nexus AI to Explain</span></button>
                        <button type="button" onclick="NexusHome.toggleBookmark('${p.id}', event)"><span>🔖</span> <span>${isSaved ? 'Remove from Saved Notes' : 'Save to Notes'}</span></button>
                        <button type="button" onclick="NexusHome.sharePost('${p.id}', event)"><span>🔗</span> <span>Share Post</span></button>
                        ${isStrictlyMine ? `
                            <button type="button" style="color:#38bdf8;" onclick="Nexus.editPost('${p.id}')"><span>✏️</span> <span>Edit My Post</span></button>
                            <button type="button" style="color:#f87171;" onclick="Nexus.deletePost('${p.id}')"><span>🗑️</span> <span>Delete My Post</span></button>
                        ` : ''}
                    </div>

                    ${formattedTextHTML ? `<div onclick="NexusHome.handlePostTapToLike('${p.id}', event)" style="font-size:14.5px; line-height:1.48; color:#f1f5f9; margin-bottom:11px; white-space:pre-wrap; word-break:break-word; cursor:pointer;">${formattedTextHTML}</div>` : ''}
                    ${mediaHTML}
                    ${pollHTML}
                    ${likedByBanner}

                    <div class="nx-act-bar">
                        <button type="button" class="nx-act-pill ${isLiked ? 'liked' : ''}" onclick="NexusHome.toggleLike('${p.id}')">
                            <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                            <span>${likesArr.length}</span>
                        </button>
                        <button type="button" class="nx-act-pill" onclick="NexusHome.openCommentsModal('${p.id}')">
                            <svg viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                            <span>${cmtsArr.length}</span>
                        </button>
                        <button type="button" class="nx-act-pill" onclick="NexusHome.openPostViewsModal('${p.id}')" title="See who viewed this post">
                            <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            <span>${realViewsList.length}</span>
                        </button>
                        <button type="button" class="nx-act-pill ${isSaved ? 'saved' : ''}" onclick="NexusHome.toggleBookmark('${p.id}', event)" title="Save to Notes">
                            <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                        </button>
                        <button type="button" class="nx-act-pill" onclick="NexusHome.sharePost('${p.id}', event)">
                            <span>Share</span>
                        </button>
                    </div>
                </article>
            `;
        }).join('');
    }

    // FULL-STRUCTURE PUBLIC PROFILE MODAL (With id="nx-dm-trigger-btn" so dm.js NEVER adds a duplicate 2nd Message button!)
    Nexus.openPublicProfile = function(targetUsernameOrName) {
        if (!targetUsernameOrName) return;
        let cleanTarget = String(targetUsernameOrName).toLowerCase().trim();
        if (cleanTarget === 'nexus_official' || cleanTarget === 'nexus') {
            NexusHome.openOfficialStoryModal();
            return;
        }

        let me = Nexus.getCurrentUser();
        let myU = me && me.username ? me.username.toLowerCase().trim() : '';

        let uObj = (Nexus.users || []).find(u =>
            u && ((u.username && u.username.toLowerCase().trim() === cleanTarget) ||
                  (u.name && u.name.toLowerCase().trim() === cleanTarget))
        ) || {
            username: cleanTarget.replace(/[^a-z0-9_]/g, ''),
            name: targetUsernameOrName,
            bio: 'JEE Aspirant',
            dp: '',
            followersList: [],
            followingList: []
        };

        let uKey = (uObj.username || cleanTarget).toLowerCase().trim();
        let nKey = (uObj.name || targetUsernameOrName).toLowerCase().trim();
        let isMe = myU && (uKey === myU);
        if (isMe) {
            Nexus.switchTab('tab-profile');
            return;
        }

        let userPosts = (Nexus.posts || []).filter(p => {
            if (!p || p.isOfficialPinned || p.username === 'nexus_official') return false;
            let pU = (p.username || '').toLowerCase().trim();
            let pA = (p.author || '').toLowerCase().trim();
            return (pU && (pU === uKey || pU === nKey)) || (pA && (pA === nKey || pA === uKey));
        });

        let followers = Array.isArray(uObj.followersList) ? uObj.followersList : [];
        let following = Array.isArray(uObj.followingList) ? uObj.followingList : [];
        let amIFollowing = myU && followers.map(x => String(x).toLowerCase().trim()).includes(myU);

        let dpUrl = resolveUserRealDP(uObj.username, uObj.name, uObj.dp);
        let firstChar = (uObj.name || uObj.username || 'U').charAt(0).toUpperCase();
        let dpHTML = dpUrl
            ? `<img src="${dpUrl}" style="width:72px; height:72px; border-radius:50%; object-fit:cover; border:2.5px solid #10b981;">`
            : `<div style="width:72px; height:72px; border-radius:50%; background:linear-gradient(135deg,#2563eb,#7c3aed); color:white; display:flex; align-items:center; justify-content:center; font-size:28px; font-weight:800; border:2.5px solid #38bdf8;">${firstChar}</div>`;

        let safeU = uObj.username.replace(/'/g, "\\'");
        let safeN = (uObj.name || uObj.username).replace(/'/g, "\\'");

        const modal = document.getElementById('nx-global-modal');
        modal.style.alignItems = 'center';
        modal.style.paddingTop = '16px';
        modal.innerHTML = `
            <div class="nx-modal-box" style="max-width:430px; width:100%; max-height:90dvh; overflow-y:auto; padding:16px; border:1.5px solid #38bdf8; border-radius:22px; background:#090d16;">
                <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:10px; border-bottom:1px solid #1e293b; margin-bottom:12px;">
                    <span style="font-size:13px; font-weight:800; color:#38bdf8;">👤 Member Full Profile</span>
                    <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="width:32px; height:32px; border-radius:50%; background:#1e293b; border:none; color:#cbd5e1; font-size:16px; cursor:pointer;">✕</button>
                </div>

                <div style="background:#0f172a; border:1px solid #1e293b; border-radius:18px; padding:15px; margin-bottom:12px;">
                    <div style="display:flex; align-items:center; gap:13px; margin-bottom:14px;">
                        ${dpHTML}
                        <div style="flex:1; min-width:0;">
                            <div style="font-size:18px; font-weight:800; color:#f8fafc; display:flex; align-items:center; gap:6px;">
                                <span>${uObj.name || uObj.username}</span>
                                ${uObj.verified ? `<span class="nx-verified-tick">✓</span>` : ''}
                            </div>
                            <div style="font-size:12px; color:#10b981; font-weight:700; margin-top:2px;">@${uObj.username} ${uObj.moodNote ? `• 💭 ${uObj.moodNote}` : '• 💬 DM Open'}</div>
                            <div style="font-size:12.5px; color:#38bdf8; margin-top:3px;">${uObj.bio || 'JEE Aspirant'}</div>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; background:#090d16; border:1px solid #1e293b; border-radius:12px; padding:9px 6px; text-align:center; margin-bottom:12px;">
                        <div>
                            <div style="font-size:16px; font-weight:800; color:white;">${userPosts.length}</div>
                            <div style="font-size:10.5px; color:#94a3b8;">Posts</div>
                        </div>
                        <div onclick="Nexus.openProfileFollowers('${safeU}')" style="border-left:1px solid #1e293b; border-right:1px solid #1e293b; cursor:pointer;">
                            <div style="font-size:16px; font-weight:800; color:#38bdf8;">${followers.length}</div>
                            <div style="font-size:10.5px; color:#93c5fd; font-weight:700;">Followers ↗</div>
                        </div>
                        <div onclick="Nexus.openProfileFollowing('${safeU}')" style="cursor:pointer;">
                            <div style="font-size:16px; font-weight:800; color:#38bdf8;">${following.length}</div>
                            <div style="font-size:10.5px; color:#93c5fd; font-weight:700;">Following ↗</div>
                        </div>
                    </div>

                    <div style="display:flex; gap:10px;">
                        <button type="button" onclick="Nexus.toggleFollow('${safeU}')" style="flex:1; background:${amIFollowing ? '#1e293b' : '#2563eb'}; border:${amIFollowing ? '1px solid #38bdf8' : 'none'}; color:white; padding:11px; border-radius:12px; font-weight:800; font-size:13.5px; cursor:pointer;">${amIFollowing ? '✓ Following' : '+ Follow'}</button>
                        <button type="button" id="nx-dm-trigger-btn" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusDM) NexusDM.openDirectChat('${safeU}', '${safeN}', '');" style="flex:1; background:#10b981; color:#020617; border:none; padding:11px; border-radius:12px; font-weight:900; font-size:13.5px; cursor:pointer;">💬 Message</button>
                    </div>
                </div>

                <div style="font-size:12px; font-weight:800; color:#94a3b8; margin-bottom:8px; padding-left:4px;">⊞ SHARED POSTS (${userPosts.length})</div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    ${userPosts.length === 0
                        ? `<div style="grid-column:1/-1; text-align:center; padding:22px; color:#64748b; background:#0f172a; border:1px dashed #1e293b; border-radius:14px; font-size:12.5px;">No shared posts yet.</div>`
                        : userPosts.map(p => `
                            <div onclick="Nexus.openSinglePostModal('${p.id}')" style="background:#0f172a; border:1px solid #1e293b; border-radius:14px; padding:8px; min-height:150px; display:flex; flex-direction:column; justify-content:space-between; cursor:pointer;">
                                <div style="flex:1; display:flex; align-items:center; justify-content:center; overflow:hidden; background:#090d16; border-radius:9px;">
                                    ${p.image
                                        ? `<img src="${p.image}" style="width:100%; height:110px; object-fit:cover; border-radius:8px;">`
                                        : `<div style="font-size:12px; color:#e2e8f0; padding:8px; line-height:1.4; max-height:110px; overflow:hidden;">${formatPostBodyHTML(p.text || 'Post')}</div>`
                                    }
                                </div>
                                <div style="display:flex; justify-content:space-between; font-size:11px; color:#94a3b8; padding-top:6px; margin-top:6px; border-top:1px solid #1e293b;">
                                    <span>❤️ ${(p.likedBy || []).length} • 💬 ${(p.comments || []).length}</span>
                                    <span style="color:#38bdf8; font-weight:700;">Open ↗</span>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    };

    Nexus.deletePost = function(postId) {
        let me = Nexus.getCurrentUser();
        let postObj = (Nexus.posts || []).find(p => p && p.id === postId);
        if (!postObj || !isStrictlyPostOwner(postObj, me)) {
            Nexus.toast("🔒 Sirf post upload karne wala hi apni post delete kar sakta hai!");
            return;
        }
        Nexus.posts = (Nexus.posts || []).filter(p => p && p.id !== postId);
        renderHomeFeed();
        if (Nexus.db) {
            Nexus.db.collection("nexus_real_posts").doc(postId).delete().then(() => Nexus.toast("🗑️ Post deleted!"));
        }
    };

    Nexus.editPost = function(postId) {
        let me = Nexus.getCurrentUser();
        let postObj = (Nexus.posts || []).find(p => p && p.id === postId);
        if (!postObj || !isStrictlyPostOwner(postObj, me)) {
            Nexus.toast("🔒 Sirf post upload karne wala hi apni post edit kar sakta hai!");
            return;
        }
        let updated = prompt("✏️ Edit your post text:", postObj.text || "");
        if (updated === null) return;
        postObj.text = updated.trim();
        renderHomeFeed();
        if (Nexus.db) {
            Nexus.db.collection("nexus_real_posts").doc(postId).set({ text: updated.trim(), edited: true }, { merge: true }).then(() => Nexus.toast("✅ Post updated!"));
        }
    };

    Nexus.openSinglePostModal = function(postId) {
        let p = (Nexus.posts || []).find(x => x && x.id === postId);
        if (!p) return;
        let me = Nexus.getCurrentUser();
        let isMine = isStrictlyPostOwner(p, me);
        let safeImg = (p.image || '').replace(/'/g, "\\'");
        const modal = document.getElementById('nx-global-modal');
        modal.innerHTML = `
            <div class="nx-modal-box" style="max-width:410px; border:1.5px solid #38bdf8;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <strong style="color:#f8fafc; font-size:15px;">📸 Post by ${p.author || p.username}</strong>
                    <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                </div>
                ${p.text ? `<div style="font-size:14px; color:#f1f5f9; line-height:1.5; margin-bottom:10px; white-space:pre-wrap;">${formatPostBodyHTML(p.text)}</div>` : ''}
                ${p.image ? `
                    <div style="position:relative; margin-bottom:10px;">
                        <img class="nx-feed-post-img" src="${p.image}" style="width:100%; max-height:320px; object-fit:contain; border-radius:12px; background:#050811;">
                        <button type="button" onclick="NexusHome.openFullPhotoView('${safeImg}')" style="position:absolute; top:8px; right:8px; background:rgba(15,23,42,0.88); border:1px solid #38bdf8; color:#fff; font-size:11px; font-weight:800; padding:4px 10px; border-radius:999px; cursor:pointer;">🔍 Full View</button>
                    </div>
                ` : ''}
                ${isMine ? `
                    <div style="display:flex; gap:8px;">
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'; Nexus.editPost('${p.id}');" style="flex:1; background:#2563eb; color:white; border:none; padding:10px; border-radius:10px; font-weight:800; cursor:pointer;">✏️ Edit My Post</button>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'; Nexus.deletePost('${p.id}');" style="flex:1; background:#ef4444; color:white; border:none; padding:10px; border-radius:10px; font-weight:800; cursor:pointer;">🗑️ Delete My Post</button>
                    </div>
                ` : ''}
            </div>
        `;
        modal.style.display = 'flex';
    };

    Nexus.openUserListModal = function(title, usernamesArray) {
        const modal = document.getElementById('nx-global-modal');
        let list = Array.isArray(usernamesArray) ? usernamesArray : [];
        let rows = list.map(uRaw => {
            let k = String(uRaw || '').toLowerCase().trim();
            let uObj = (Nexus.users || []).find(u => u && u.username && u.username.toLowerCase().trim() === k) || { username: k, name: uRaw };
            let dp = resolveUserRealDP(uObj.username, uObj.name, uObj.dp);
            let ch = (uObj.name || uObj.username || 'U').charAt(0).toUpperCase();
            let safeU = (uObj.username || k).replace(/'/g, "\\'");
            return `
                <div onclick="Nexus.openPublicProfile('${safeU}')" style="display:flex; align-items:center; justify-content:space-between; padding:9px 11px; background:#161f33; border:1px solid #1e293b; border-radius:12px; cursor:pointer;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        ${dp ? `<img src="${dp}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">` : `<div style="width:36px; height:36px; border-radius:50%; background:#2563eb; color:white; display:flex; align-items:center; justify-content:center; font-weight:800;">${ch}</div>`}
                        <div>
                            <div style="font-size:13.5px; font-weight:800; color:#f8fafc;">${uObj.name || uObj.username}</div>
                            <div style="font-size:11px; color:#38bdf8;">@${uObj.username}</div>
                        </div>
                    </div>
                    <span style="color:#10b981; font-size:11.5px; font-weight:800;">View →</span>
                </div>
            `;
        }).join('');

        modal.innerHTML = `
            <div class="nx-modal-box" style="max-width:380px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <h3 style="font-size:15.5px; color:#f8fafc;">${title} (${list.length})</h3>
                    <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px; max-height:55vh; overflow-y:auto;">
                    ${rows || `<div style="text-align:center; padding:18px; color:#64748b; font-size:12.5px;">List is empty.</div>`}
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    };

    Nexus.openPostLikesModal = function(postId) {
        let p = (Nexus.posts || []).find(x => x && x.id === postId);
        if (p) Nexus.openUserListModal('❤️ Liked By', p.likedBy || []);
    };
    Nexus.openProfileFollowers = function(username) {
        let k = String(username || '').toLowerCase().trim();
        let u = (Nexus.users || []).find(x => x && x.username && x.username.toLowerCase().trim() === k);
        Nexus.openUserListModal(`👥 Followers of @${username}`, u ? (u.followersList || []) : []);
    };
    Nexus.openProfileFollowing = function(username) {
        let k = String(username || '').toLowerCase().trim();
        let u = (Nexus.users || []).find(x => x && x.username && x.username.toLowerCase().trim() === k);
        Nexus.openUserListModal(`↗️ @${username} Following`, u ? (u.followingList || []) : []);
    };

    Nexus.openNotifications = function() {
        let me = Nexus.getCurrentUser();
        if (!me) { Nexus.switchTab('tab-profile'); return; }
        const modal = document.getElementById('nx-global-modal');
        let myPosts = (Nexus.posts || []).filter(p => isStrictlyPostOwner(p, me));
        let recentEvents = [];
        myPosts.forEach(p => {
            (p.likedBy || []).forEach(liker => {
                if (String(liker).toLowerCase() !== me.username.toLowerCase()) recentEvents.push(`❤️ <b>@${liker}</b> liked your post: "${(p.text || 'Photo').substring(0, 30)}"`);
            });
            (p.comments || []).forEach(c => {
                if (c && c.username && c.username.toLowerCase() !== me.username.toLowerCase()) recentEvents.push(`💬 <b>@${c.username}</b> commented: "${(c.text || '').substring(0, 32)}"`);
            });
        });

        modal.innerHTML = `
            <div class="nx-modal-box" style="border:1.5px solid #38bdf8;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <h3 style="font-size:16px; color:#f8fafc;">🔔 Activity &amp; Notifications</h3>
                    <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                </div>
                <div style="display:flex; flex-direction:column; gap:8px; max-height:55vh; overflow-y:auto;">
                    ${recentEvents.length === 0 ? `<div style="text-align:center; padding:18px; color:#64748b; font-size:13px;">All caught up!</div>` : recentEvents.slice(0, 25).map(ev => `<div style="padding:10px 12px; background:#161f33; border:1px solid #1e293b; border-radius:12px; font-size:12.5px; color:#e2e8f0;">${ev}</div>`).join('')}
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    };

    Nexus.openSearch = function() {
        const modal = document.getElementById('nx-global-modal');
        modal.style.alignItems = 'flex-start';
        modal.style.paddingTop = '22px';

        modal.innerHTML = `
            <div class="nx-modal-box" style="border:1.5px solid #38bdf8; max-width:420px; width:100%; max-height:74dvh; display:flex; flex-direction:column;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <h3 style="font-size:16px; color:#f8fafc;">🔍 Search Nexus Posts &amp; Members</h3>
                    <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                </div>
                <input type="text" id="nx-global-search-in" oninput="NexusHome.liveSearchInstant(this.value)" placeholder="Type member name, @username, or JEE topic..." style="width:100%; padding:11px 13px; border-radius:12px; border:1px solid #38bdf8; background:#090d16; color:white; font-size:14px; outline:none; margin-bottom:10px;">
                <div id="nx-live-search-results" style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:7px; margin-bottom:10px; max-height:38dvh;"></div>
                <button type="button" onclick="NexusHome.applySearchQuery()" style="width:100%; background:#38bdf8; color:#020617; border:none; padding:11px; border-radius:12px; font-weight:900; font-size:14px; cursor:pointer;">Search Feed Posts →</button>
            </div>
        `;
        modal.style.display = 'flex';
        const inp = document.getElementById('nx-global-search-in');
        if (inp) {
            inp.focus();
            inp.addEventListener('keydown', e => { if (e.key === 'Enter') NexusHome.applySearchQuery(); });
        }
        NexusHome.liveSearchInstant('');
    };

    window.NexusHome = {
        // Double-Tap Detection on Mobile Touch & Desktop Click to Like Post!
        handlePostTapToLike: function(postId, e) {
            let now = Date.now();
            let lastTap = lastPostTapTimeMap[postId] || 0;
            if (now - lastTap < 310) {
                lastPostTapTimeMap[postId] = 0;
                if (e) e.stopPropagation();
                this.triggerDoubleTapLike(postId);
            } else {
                lastPostTapTimeMap[postId] = now;
            }
        },

        triggerDoubleTapLike: function(postId) {
            let me = Nexus.getCurrentUser();
            if (!me) { Nexus.switchTab('tab-profile'); return; }
            let card = document.getElementById('nx-post-' + postId);
            if (card) {
                const heart = document.createElement('div');
                heart.className = 'nx-dbltap-heart';
                heart.innerText = '❤️';
                card.appendChild(heart);
                setTimeout(() => heart.remove(), 760);
            }
            let p = (Nexus.posts || []).find(x => x && x.id === postId);
            if (!p) return;
            let likes = Array.isArray(p.likedBy) ? [...p.likedBy] : [];
            let myU = me.username;
            if (!likes.some(u => String(u).toLowerCase() === myU.toLowerCase())) {
                likes.push(myU);
                p.likedBy = likes;
                renderHomeFeed();
                if (Nexus.db && !String(postId).startsWith('temp_') && !String(postId).startsWith('official_')) {
                    Nexus.db.collection("nexus_real_posts").doc(postId).set({ likedBy: likes }, { merge: true });
                }
            }
            Nexus.toast("❤️ Liked Post!");
        },

        openFullPhotoView: function(imgUrl) {
            if (!imgUrl) return;
            if (window.NexusPower && typeof NexusPower.openImageLightbox === 'function') {
                NexusPower.openImageLightbox(imgUrl);
            } else if (window.NexusDM && typeof NexusDM.openPhotoPreview === 'function') {
                NexusDM.openPhotoPreview(imgUrl);
            } else {
                window.open(imgUrl, '_blank');
            }
        },

        openPostViewsModal: function(postId) {
            let p = (Nexus.posts || []).find(x => x && x.id === postId);
            if (!p) return;
            let viewers = Array.isArray(p.viewedBy) ? p.viewedBy : [];
            Nexus.openUserListModal('👁️ Post Viewed By', viewers);
        },

        liveSearchInstant: function(rawQuery) {
            const resBox = document.getElementById('nx-live-search-results');
            if (!resBox) return;
            let q = (rawQuery || '').toLowerCase().trim();

            let matchedUsers = (Nexus.users || []).filter(u =>
                u && u.username && u.username !== 'nexus_official' && (
                    !q || u.username.toLowerCase().includes(q) || (u.name && u.name.toLowerCase().includes(q))
                )
            ).slice(0, 6);

            let usersHTML = matchedUsers.map(u => {
                let safeU = u.username.replace(/'/g, "\\'");
                let ch = (u.name || u.username || 'U').charAt(0).toUpperCase();
                let dp = resolveUserRealDP(u.username, u.name, u.dp);
                return `
                    <div onclick="document.getElementById('nx-global-modal').style.display='none'; Nexus.openPublicProfile('${safeU}');" style="display:flex; align-items:center; justify-content:space-between; padding:8px 10px; background:#161f33; border:1px solid #1e293b; border-radius:11px; cursor:pointer;">
                        <div style="display:flex; align-items:center; gap:9px;">
                            ${dp ? `<img src="${dp}" style="width:32px; height:32px; border-radius:50%; object-fit:cover;">` : `<div style="width:32px; height:32px; border-radius:50%; background:#2563eb; color:white; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13px;">${ch}</div>`}
                            <div>
                                <div style="font-size:13px; font-weight:800; color:#f8fafc;">${u.name || u.username}</div>
                                <div style="font-size:11px; color:#38bdf8;">@${u.username} • ${u.bio || 'Member'}</div>
                            </div>
                        </div>
                        <span style="color:#10b981; font-size:11px; font-weight:800;">Profile →</span>
                    </div>
                `;
            }).join('');

            resBox.innerHTML = usersHTML || `<div style="text-align:center; padding:12px; color:#64748b; font-size:12.5px;">Tap "Search Feed Posts →" below to filter posts for "${rawQuery}"</div>`;
        },

        togglePostMenu: function(postId, e) {
            if (e) e.stopPropagation();
            document.querySelectorAll('.nx-post-dropdown-menu').forEach(m => {
                if (m.id !== 'nx-pdrop-' + postId) m.classList.remove('open');
            });
            const menu = document.getElementById('nx-pdrop-' + postId);
            if (menu) {
                menu.classList.toggle('open');
                openDropdownPostId = menu.classList.contains('open') ? postId : null;
            }
        },

        toggleLike: function(postId) {
            let me = Nexus.getCurrentUser();
            if (!me) { Nexus.switchTab('tab-profile'); return; }
            let p = (Nexus.posts || []).find(x => x && x.id === postId);
            if (!p) return;
            let likes = Array.isArray(p.likedBy) ? [...p.likedBy] : [];
            let myU = me.username;
            let idx = likes.findIndex(u => String(u).toLowerCase() === myU.toLowerCase());
            if (idx !== -1) likes.splice(idx, 1);
            else likes.push(myU);
            p.likedBy = likes;
            renderHomeFeed();
            if (Nexus.db && !String(postId).startsWith('temp_') && !String(postId).startsWith('official_')) {
                Nexus.db.collection("nexus_real_posts").doc(postId).set({ likedBy: likes }, { merge: true });
            }
        },

        voteOnPostPoll: function(postId, optionIndex) {
            let me = Nexus.getCurrentUser();
            if (!me) { Nexus.switchTab('tab-profile'); return; }
            let p = (Nexus.posts || []).find(x => x && x.id === postId);
            if (!p || !p.poll) return;
            let myU = me.username;
            ['voters1', 'voters2', 'voters3', 'voters4'].forEach((k, idx) => {
                let arr = Array.isArray(p.poll[k]) ? p.poll[k] : [];
                arr = arr.filter(u => String(u).toLowerCase() !== myU.toLowerCase());
                if (idx + 1 === optionIndex) arr.push(myU);
                p.poll[k] = arr;
            });
            renderHomeFeed();
            if (Nexus.db && !String(postId).startsWith('temp_')) {
                Nexus.db.collection("nexus_real_posts").doc(postId).set({ poll: p.poll }, { merge: true });
            }
        },

        // COMMENTS MODAL WITH REPLY (↩️), EDIT (✏️) & DELETE (🗑️)
        openCommentsModal: function(postId) {
            let p = (Nexus.posts || []).find(x => x && x.id === postId);
            if (!p) return;
            let me = Nexus.getCurrentUser();
            let myU = me && me.username ? me.username.toLowerCase().trim() : '';
            let cmts = Array.isArray(p.comments) ? p.comments : [];
            activeCommentReply = null;
            activeCommentEditIdx = null;

            const modal = document.getElementById('nx-global-modal');
            modal.innerHTML = `
                <div class="nx-modal-box" style="max-width:420px; width:100%; border:1.5px solid #38bdf8; display:flex; flex-direction:column; max-height:84dvh;">
                    <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:10px; border-bottom:1px solid #1e293b; margin-bottom:10px;">
                        <strong style="font-size:15px; color:#f8fafc;">💬 Comments (${cmts.length})</strong>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>
                    <div style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:8px; margin-bottom:10px;">
                        ${cmts.length === 0 ? `<div style="text-align:center; padding:20px; color:#64748b; font-size:12.5px;">No comments yet. Start the discussion!</div>` : cmts.map((c, cIdx) => {
                            let isMyComment = myU && c.username && c.username.toLowerCase().trim() === myU;
                            let safeAuthor = (c.author || c.username || 'Member').replace(/'/g, "\\'");
                            let safeTxt = (c.text || '').replace(/'/g, "\\'").replace(/\n/g, " ");
                            let replyQuote = c.replyTo
                                ? `<div style="background:rgba(0,0,0,0.3); border-left:2.5px solid #10b981; padding:3px 7px; border-radius:5px; font-size:11px; color:#cbd5e1; margin-bottom:4px;">↩️ <b>@${(c.replyTo.author || '').replace(/</g, '&lt;')}:</b> ${(c.replyTo.text || '').replace(/</g, '&lt;')}</div>`
                                : '';
                            return `
                                <div style="background:#161f33; border:1px solid #1e293b; border-radius:12px; padding:9px 11px;">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
                                        <span onclick="Nexus.openPublicProfile('${(c.username || '').replace(/'/g, "\\'")}')" style="font-weight:800; font-size:12px; color:#38bdf8; cursor:pointer;">${c.author || c.username} <small style="color:#64748b; font-weight:500;">${c.time || ''} ${c.edited ? '(edited)' : ''}</small></span>
                                    </div>
                                    ${replyQuote}
                                    <div style="font-size:13.5px; color:#f1f5f9; line-height:1.42; word-break:break-word;">${(c.text || '').replace(/</g, '&lt;')}</div>
                                    <div style="display:flex; gap:12px; margin-top:6px; font-size:11px; font-weight:700;">
                                        <span onclick="NexusHome.startReplyComment('${safeAuthor}', '${safeTxt}')" style="color:#10b981; cursor:pointer;">↩️ Reply</span>
                                        ${isMyComment ? `<span onclick="NexusHome.startEditComment('${p.id}', ${cIdx})" style="color:#38bdf8; cursor:pointer;">✏️ Edit</span>` : ''}
                                        ${isMyComment ? `<span onclick="NexusHome.deleteMyComment('${p.id}', ${cIdx})" style="color:#f87171; cursor:pointer;">🗑️ Delete</span>` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <div id="nx-cmt-context-bar" style="display:none; background:#182229; border-left:3px solid #10b981; padding:6px 10px; border-radius:8px; margin-bottom:8px; align-items:center; justify-content:space-between; font-size:11.5px; color:#cbd5e1;">
                        <span id="nx-cmt-context-txt" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;"></span>
                        <button type="button" onclick="NexusHome.cancelCommentContext()" style="background:none; border:none; color:#ef4444; font-weight:bold; cursor:pointer; margin-left:8px;">✕</button>
                    </div>

                    <div style="display:flex; gap:8px;">
                        <input type="text" id="nx-cmt-input" placeholder="Write a comment or reply..." onkeydown="if(event.key==='Enter') NexusHome.submitComment('${p.id}')" style="flex:1; padding:10px 12px; border-radius:12px; border:1px solid #334155; background:#090d16; color:white; font-size:13.5px; outline:none;">
                        <button type="button" onclick="NexusHome.submitComment('${p.id}')" style="background:#00a884; color:#020617; border:none; padding:0 16px; border-radius:12px; font-weight:900; font-size:13px; cursor:pointer;">Send</button>
                    </div>
                </div>
            `;
            modal.style.display = 'flex';
        },

        startReplyComment: function(authorName, textSnippet) {
            activeCommentEditIdx = null;
            activeCommentReply = { author: authorName, text: textSnippet.substring(0, 70) };
            const bar = document.getElementById('nx-cmt-context-bar');
            const txt = document.getElementById('nx-cmt-context-txt');
            const inp = document.getElementById('nx-cmt-input');
            if (bar && txt && inp) {
                bar.style.display = 'flex';
                txt.innerText = `↩️ Replying to ${authorName}: "${activeCommentReply.text}"`;
                inp.focus();
            }
        },

        startEditComment: function(postId, cIdx) {
            let p = (Nexus.posts || []).find(x => x && x.id === postId);
            if (!p || !Array.isArray(p.comments) || !p.comments[cIdx]) return;
            activeCommentReply = null;
            activeCommentEditIdx = cIdx;
            const bar = document.getElementById('nx-cmt-context-bar');
            const txt = document.getElementById('nx-cmt-context-txt');
            const inp = document.getElementById('nx-cmt-input');
            if (bar && txt && inp) {
                bar.style.display = 'flex';
                txt.innerText = `✏️ Editing your comment...`;
                inp.value = p.comments[cIdx].text || '';
                inp.focus();
            }
        },

        cancelCommentContext: function() {
            activeCommentReply = null;
            activeCommentEditIdx = null;
            const bar = document.getElementById('nx-cmt-context-bar');
            if (bar) bar.style.display = 'none';
        },

        submitComment: function(postId) {
            let me = Nexus.getCurrentUser();
            if (!me) { Nexus.switchTab('tab-profile'); return; }
            const inp = document.getElementById('nx-cmt-input');
            if (!inp || !inp.value.trim()) return;
            let p = (Nexus.posts || []).find(x => x && x.id === postId);
            if (!p) return;
            let cmts = Array.isArray(p.comments) ? [...p.comments] : [];

            if (activeCommentEditIdx !== null && cmts[activeCommentEditIdx]) {
                let target = cmts[activeCommentEditIdx];
                if (target.username && target.username.toLowerCase() === me.username.toLowerCase()) {
                    target.text = inp.value.trim();
                    target.edited = true;
                }
            } else {
                cmts.push({
                    username: me.username,
                    author: me.name,
                    text: inp.value.trim(),
                    replyTo: activeCommentReply || null,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    createdAt: Date.now()
                });
            }

            p.comments = cmts;
            activeCommentReply = null;
            activeCommentEditIdx = null;
            renderHomeFeed();
            this.openCommentsModal(postId);
            if (Nexus.db && !String(postId).startsWith('temp_') && !String(postId).startsWith('official_')) {
                Nexus.db.collection("nexus_real_posts").doc(postId).set({ comments: cmts }, { merge: true });
            }
        },

        deleteMyComment: function(postId, commentIdx) {
            let me = Nexus.getCurrentUser();
            let p = (Nexus.posts || []).find(x => x && x.id === postId);
            if (!p || !me || !Array.isArray(p.comments)) return;
            let c = p.comments[commentIdx];
            if (!c || (c.username || '').toLowerCase() !== me.username.toLowerCase()) {
                Nexus.toast("🔒 Aap sirf apna comment delete kar sakte hain!");
                return;
            }
            p.comments.splice(commentIdx, 1);
            renderHomeFeed();
            this.openCommentsModal(postId);
            if (Nexus.db && !String(postId).startsWith('official_')) {
                Nexus.db.collection("nexus_real_posts").doc(postId).set({ comments: p.comments }, { merge: true });
            }
        },

        toggleBookmark: function(postId, e) {
            if (e) e.stopPropagation();
            const menu = document.getElementById('nx-pdrop-' + postId);
            if (menu) menu.classList.remove('open');
            openDropdownPostId = null;

            let saved = [];
            try { saved = JSON.parse(localStorage.getItem('nx_saved_posts') || '[]'); } catch (err) {}
            if (saved.includes(postId)) {
                saved = saved.filter(id => id !== postId);
                Nexus.toast("Removed from Saved Notes");
            } else {
                saved.push(postId);
                Nexus.toast("🔖 Saved to Profile Notes!");
            }
            localStorage.setItem('nx_saved_posts', JSON.stringify(saved));
            localStorage.setItem('nx_saved', JSON.stringify(saved));
            renderHomeFeed();
            Nexus.notifyAll();
        },

        askAiAboutPost: function(postId, e) {
            if (e) e.stopPropagation();
            const menu = document.getElementById('nx-pdrop-' + postId);
            if (menu) menu.classList.remove('open');
            openDropdownPostId = null;

            let p = (Nexus.posts || []).find(x => x && x.id === postId);
            if (!p) return;
            let promptStr = `Please explain/solve this post by @${p.username || p.author}: "${p.text || 'Post'}"`;
            if (window.NexusCore && NexusCore.openPrivateAiStudio) {
                NexusCore.openPrivateAiStudio(promptStr);
            }
        },

        sharePost: function(postId, e) {
            if (e) e.stopPropagation();
            const menu = document.getElementById('nx-pdrop-' + postId);
            if (menu) menu.classList.remove('open');
            openDropdownPostId = null;

            let shareUrl = window.location.origin + window.location.pathname;
            if (navigator.share) {
                navigator.share({ title: "Nexus Student Community", url: shareUrl }).catch(() => {});
            } else {
                navigator.clipboard.writeText(shareUrl);
                Nexus.toast("🔗 Post Link Copied!");
            }
        },

        openOfficialStoryModal: function() {
            const modal = document.getElementById('nx-global-modal');
            let d = officialBroadcastData;
            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid #10b981; text-align:center;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <span style="font-size:11px; color:#10b981; font-weight:900;">📢 OFFICIAL NEXUS BROADCAST ✅</span>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>
                    <h3 style="font-size:17px; color:#f8fafc; margin-bottom:8px;">${(d.storyTitle || 'Nexus Official Update').replace(/</g, '&lt;')}</h3>
                    ${d.storyMediaUrl ? `<img src="${d.storyMediaUrl}" style="width:100%; max-height:260px; object-fit:cover; border-radius:12px; margin-bottom:10px;">` : ''}
                    <p style="font-size:13.5px; color:#e2e8f0; line-height:1.5; margin-bottom:14px; white-space:pre-wrap;">${(d.storyText || '').replace(/</g, '&lt;')}</p>
                    <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="width:100%; background:#1e293b; color:white; border:none; padding:10px; border-radius:10px; font-weight:800; cursor:pointer;">Close</button>
                </div>
            `;
            modal.style.display = 'flex';
        },

        applySearchQuery: function() {
            const inp = document.getElementById('nx-global-search-in');
            let q = inp ? inp.value.trim() : '';
            document.getElementById('nx-global-modal').style.display = 'none';
            activeSearchQuery = q;
            const banner = document.getElementById('nx-search-banner');
            const bannerTxt = document.getElementById('nx-search-banner-txt');
            if (banner && bannerTxt) {
                banner.style.display = q ? 'flex' : 'none';
                bannerTxt.innerText = `🔍 Showing results for "${q}"`;
            }
            Nexus.switchTab('tab-home');
            renderHomeFeed();
        },

        clearSearchFilter: function() {
            activeSearchQuery = '';
            const banner = document.getElementById('nx-search-banner');
            if (banner) banner.style.display = 'none';
            renderHomeFeed();
        }
    };

    function connectOfficialStoryBroadcast() {
        if (!Nexus.db) { setTimeout(connectOfficialStoryBroadcast, 400); return; }
        Nexus.db.collection("nexus_config").doc("official_broadcast").onSnapshot(doc => {
            if (doc.exists) {
                officialBroadcastData = Object.assign({}, officialBroadcastData, doc.data());
                renderHomeFeed();
            }
        });
    }

    Nexus.listeners.onUsers.push(renderTopStoriesBar);
    Nexus.listeners.onPosts.push(() => {
        renderTopStoriesBar();
        renderHomeFeed();
    });

    renderTopStoriesBar();
    renderHomeFeed();
    connectOfficialStoryBroadcast();
})();
