// ================= CHAT.JS (FINAL MASTER): COMPACT DELETED MESSAGE PILL + 🧹 DELETE FOR ME & 🗑️ DELETE FOR EVERYONE IN GROUP CHAT + 0.01s INSTANT SEND + 📝 LIVE TEST SERIES =================

(function() {
    if (window.__NEXUS_CHAT_FIXED_V2__) return;
    window.__NEXUS_CHAT_FIXED_V2__ = true;
    const chatTab = document.getElementById('tab-community');
    if (!chatTab) return;

    const GRP_CACHE_KEY = 'nx_grp_msgs_cache_v2';
    const escHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    const chatStyle = document.createElement('style');
    chatStyle.innerHTML = `
        @keyframes nxDotBounce {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes nxChatSheetUp {
            0% { opacity: 0; transform: translateY(24px) scale(0.96); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .nx-typing-dot {
            display: inline-block;
            width: 6px;
            height: 6px;
            background-color: #00a884;
            border-radius: 50%;
            margin: 0 2px;
            animation: nxDotBounce 1.2s infinite ease-in-out both;
        }
        .nx-typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .nx-typing-dot:nth-child(2) { animation-delay: -0.16s; }

        .nx-fullscreen-chat-room {
            position: fixed !important;
            left: 0 !important;
            right: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 640px !important;
            height: 100dvh;
            margin: 0 auto !important;
            background: #0b141a !important;
            box-shadow: 0 0 0 100vmax #0b141a !important;
            z-index: 99998 !important;
            display: none;
            flex-direction: column;
            overflow: hidden !important;
            padding: 0 !important;
        }
        .nx-day-header-pill {
            align-self: center;
            background: #182229;
            border: 1px solid #2a3942;
            color: #93c5fd;
            font-size: 11px;
            font-weight: 800;
            padding: 4px 14px;
            border-radius: 999px;
            margin: 8px auto 4px auto;
            box-shadow: 0 2px 8px rgba(0,0,0,0.4);
            user-select: none;
            flex-shrink: 0;
        }
        .nx-cmsg-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(2, 6, 23, 0.82);
            z-index: 276000;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 18px;
        }
        .nx-cmsg-sheet {
            width: 100%;
            max-width: 325px;
            background: #182229;
            border: 1px solid #2a3942;
            border-radius: 20px;
            padding: 14px;
            box-shadow: 0 18px 45px rgba(0,0,0,0.85);
            animation: nxChatSheetUp 0.14s ease-out forwards;
        }
        .nx-cmsg-emoji-bar {
            display: flex;
            justify-content: space-between;
            background: #111b21;
            padding: 8px 12px;
            border-radius: 30px;
            margin-bottom: 12px;
            border: 1px solid #233138;
        }
        .nx-cmsg-emoji-btn {
            font-size: 22px;
            background: none;
            border: none;
            cursor: pointer;
        }
        .nx-cmsg-opt-btn {
            width: 100%;
            background: #202c33;
            border: 1px solid #2a3942;
            color: #e9edef;
            padding: 11px 14px;
            border-radius: 12px;
            font-size: 13.5px;
            font-weight: 700;
            text-align: left;
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 7px;
            cursor: pointer;
        }
        .nx-room-stk-chip {
            background: #182229;
            color: #cbd5e1;
            border: 1px solid #2a3942;
            padding: 5px 11px;
            border-radius: 16px;
            font-size: 11.5px;
            font-weight: 700;
            white-space: nowrap;
            cursor: pointer;
        }
        .nx-room-stk-chip.active {
            background: #00a884;
            color: #020617;
            border-color: #00a884;
        }
        .nx-group-react-pill {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: #182229;
            border: 1.5px solid #00a884;
            color: #f8fafc;
            padding: 2px 8px;
            border-radius: 14px;
            font-size: 11px;
            font-weight: 800;
            margin-top: -4px;
            margin-bottom: 3px;
            z-index: 5;
            cursor: pointer;
        }
        /* COMPACT & CLEAN DELETED MESSAGE PILL (Fits text neatly, never oversized!) */
        .nx-deleted-msg-box {
            display: inline-flex !important;
            align-items: center !important;
            gap: 6px !important;
            width: auto !important;
            max-width: 78% !important;
            background: rgba(24, 34, 41, 0.92) !important;
            border: 1px dashed rgba(248, 113, 113, 0.45) !important;
            color: #cbd5e1 !important;
            padding: 5px 11px !important;
            border-radius: 10px !important;
            font-size: 12px !important;
            line-height: 1.35 !important;
            font-style: italic !important;
            margin: 1px 0 !important;
        }
        .nx-deleted-msg-box svg {
            width: 13px !important;
            height: 13px !important;
            stroke: #f87171 !important;
            stroke-width: 2.2 !important;
            fill: none !important;
            flex-shrink: 0 !important;
        }
        #nx-chat-context-bar {
            max-height: 115px;
            overflow-y: auto;
            padding: 8px 14px;
            background: #182229;
            border-left: 4px solid #00a884;
            border-top: 1px solid #233138;
            align-items: flex-start;
            justify-content: space-between;
            font-size: 12.5px;
            color: #e9edef;
            flex-shrink: 0;
        }
        #nx-chat-context-text {
            white-space: pre-wrap;
            word-break: break-word;
            line-height: 1.42;
            flex: 1;
        }
        #nx-chat-msg-in {
            flex: 1;
            width: 100%;
            min-width: 0;
            min-height: 36px;
            max-height: 115px;
            padding: 8px 4px;
            border: none;
            background: transparent;
            color: #e9edef;
            font-size: 14.5px;
            line-height: 1.4;
            outline: none;
            resize: none;
            overflow-y: auto;
        }
        #nx-partner-test-banner {
            display: none !important;
        }
    `;
    document.head.appendChild(chatStyle);

    function getGroupHiddenForMeSet(username) {
        let key = 'nx_grp_hidden_v1_' + String(username || 'guest').toLowerCase().trim();
        try {
            return new Set(JSON.parse(localStorage.getItem(key) || '[]'));
        } catch (e) {
            return new Set();
        }
    }

    function saveGroupHiddenForMe(username, msgId) {
        let key = 'nx_grp_hidden_v1_' + String(username || 'guest').toLowerCase().trim();
        let set = getGroupHiddenForMeSet(username);
        set.add(String(msgId));
        try {
            localStorage.setItem(key, JSON.stringify(Array.from(set).slice(-1000)));
        } catch (e) {}
    }

    function syncCommunityViewport() {
        const vv = window.visualViewport;
        const roomEl = document.getElementById('nx-chat-room');
        const msgBox = document.getElementById('nx-room-messages');
        if (!roomEl || roomEl.style.display === 'none') return;
        if (vv) {
            roomEl.style.height = Math.round(vv.height) + 'px';
            roomEl.style.top = Math.round(vv.offsetTop) + 'px';
        } else {
            roomEl.style.height = window.innerHeight + 'px';
            roomEl.style.top = '0px';
        }
        if (msgBox) msgBox.scrollTop = msgBox.scrollHeight;
    }

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', syncCommunityViewport);
        window.visualViewport.addEventListener('scroll', syncCommunityViewport);
    }

    const CHANNELS_META = [
        { id: "casual_chat", title: "Casual Student Chat", desc: "Interact with verified students & peers", cat: "chill", color: "#00a884", icon: "💬", pin: "Swipe Left/Right to Reply ↩️, or Tap any message to React ❤️!" },
        { id: "doubt_solver", title: "PCM Doubt Solver", desc: "Post question photos & solve JEE doubts live", cat: "study", color: "#ef4444", icon: "❓", pin: "Tap [+] below to upload Physics, Chemistry or Maths doubt photos!" },
        { id: "study_material", title: "JEE Study Material", desc: "Share Physics, Chemistry & Maths notes", cat: "study", color: "#0ea5e9", icon: "📚", pin: "Official JEE Notes & Formula Sheets — Tap [📄 PDF] above to open the PDF Vault!" },
        { id: "daily_practice", title: "Daily DPP & Practice", desc: "Mock test analysis & daily question solving", cat: "study", color: "#f59e0b", icon: "📝", pin: "Daily DPP & Problem Solving Discussions" },
        { id: "jee_motivation", title: "IIT-JEE Motivation", desc: "Study targets, discipline & focus discussions", cat: "study", color: "#10b981", icon: "🔥", pin: "Stay focused on your IIT-JEE target!" },
        { id: "coding_hub", title: "Coding & Tech Hub", desc: "Web development, AI & programming help", cat: "chill", color: "#8b5cf6", icon: "💻", pin: "General Tech, HTML/JS, Python & AI Projects Discussion" },
        { id: "music_vibes", title: "Music & Break Zone", desc: "Relax & share favorite study playlists", cat: "chill", color: "#ec4899", icon: "🎵", pin: "Use Group DJ in + menu to listen to full songs together!" },
        { id: "shayari_literature", title: "Shayari & Literature", desc: "Original poetry, quotes & creative writing", cat: "chill", color: "#eab308", icon: "✨", pin: "Share inspiring quotes and original lines" }
    ];

    const COMMUNITY_STICKER_BANK = [
        { c: "1f525", l: "Fire", g: "trending" }, { c: "1f680", l: "Rocket", g: "trending" },
        { c: "1f4af", l: "100%", g: "trending" }, { c: "26a1", l: "Bolt", g: "trending" },
        { c: "1f451", l: "King", g: "trending" }, { c: "1f3c6", l: "Trophy", g: "trending" },
        { c: "1f3af", l: "Target", g: "trending" }, { c: "1f48e", l: "Gem", g: "trending" },
        { c: "1f602", l: "Joy", g: "funny" }, { c: "1f923", l: "ROFL", g: "funny" },
        { c: "1f62d", l: "Crying", g: "funny" }, { c: "1f480", l: "Skull", g: "funny" },
        { c: "1f9e0", l: "Brain", g: "study" }, { c: "1f914", l: "Think", g: "study" },
        { c: "1f913", l: "Topper", g: "study" }, { c: "1f4a1", l: "Idea", g: "study" },
        { c: "2764_fe0f", l: "Heart", g: "love" }, { c: "1f60d", l: "HeartEye", g: "love" },
        { c: "1f44d", l: "ThumbsUp", g: "love" }, { c: "1f64f", l: "Namaste", g: "love" }
    ];

    let currentFilter = 'all';
    let activeRoomId = null;
    let replyingToMsg = null;
    let editingMsgId = null;
    let liveMessagesByRoom = {};
    try {
        const cached = JSON.parse(localStorage.getItem(GRP_CACHE_KEY) || '{}');
        if (cached && typeof cached === 'object') liveMessagesByRoom = cached;
    } catch (e) {}
    let livePdfsList = [];
    let activeGroupSearchQuery = '';
    let lastGroupTypingPing = 0;
    let currentRoomStkCat = 'trending';
    let lastGroupTapMap = {};

    function formatChatDayHeader(createdAtMs) {
        if (!createdAtMs || isNaN(Number(createdAtMs))) return 'Today';
        const msgDate = new Date(Number(createdAtMs));
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const msgDayStart = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());
        const diffDays = Math.round((todayStart - msgDayStart) / 86400000);

        if (diffDays <= 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays > 1 && diffDays < 7) {
            return msgDate.toLocaleDateString('en-US', { weekday: 'long' });
        }
        return msgDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function resizeChatInputBox() {
        const inp = document.getElementById('nx-chat-msg-in');
        if (!inp) return;
        inp.style.height = 'auto';
        inp.style.height = Math.min(Math.max(inp.scrollHeight, 36), 115) + 'px';
    }

    chatTab.innerHTML = `
        <div id="nx-chat-directory" style="padding:12px 14px 30px 14px;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">
                <button type="button" onclick="NexusChat.openLiveTestSeries()" id="nx-music-btn" style="background:linear-gradient(135deg,#0f172a,#1e1b4b); border:1.5px solid #38bdf8; border-radius:14px; padding:12px; color:#f8fafc; display:flex; align-items:center; gap:9px; cursor:pointer; text-align:left;">
                    <span style="font-size:21px;">📝</span>
                    <div>
                        <div style="font-weight:800; font-size:13px; color:#f8fafc;">Live Test Series</div>
                        <div style="font-size:10.5px; color:#38bdf8; font-weight:700;">Daily Mock Tests →</div>
                    </div>
                </button>
                <button type="button" onclick="NexusChat.openPdfVaultModal()" style="background:#0f172a; border:1px solid #1e293b; border-radius:14px; padding:12px; color:#f8fafc; display:flex; align-items:center; gap:9px; cursor:pointer; text-align:left;">
                    <span style="font-size:21px;">📄</span>
                    <div>
                        <div style="font-weight:800; font-size:13px; color:#f8fafc;">PDF Study Vault</div>
                        <div style="font-size:10.5px; color:#10b981; font-weight:700;">Notes &amp; Books →</div>
                    </div>
                </button>
            </div>

            <div style="display:flex; gap:8px; margin-bottom:14px; overflow-x:auto; scrollbar-width:none;">
                <button type="button" onclick="NexusChat.filterChannels('all', this)" class="nx-cat-btn" style="background:#00a884; color:#020617; border:none; padding:7px 15px; border-radius:20px; font-size:12.5px; font-weight:800; cursor:pointer; white-space:nowrap;">All Channels</button>
                <button type="button" onclick="NexusChat.filterChannels('study', this)" class="nx-cat-btn" style="background:#0f172a; color:#94a3b8; border:1px solid #1e293b; padding:7px 15px; border-radius:20px; font-size:12.5px; font-weight:700; cursor:pointer; white-space:nowrap;">Study &amp; JEE</button>
                <button type="button" onclick="NexusChat.filterChannels('chill', this)" class="nx-cat-btn" style="background:#0f172a; color:#94a3b8; border:1px solid #1e293b; padding:7px 15px; border-radius:20px; font-size:12.5px; font-weight:700; cursor:pointer; white-space:nowrap;">Chill &amp; Tech</button>
            </div>

            <div id="nx-channels-list" style="display:flex; flex-direction:column; gap:10px;"></div>
        </div>

        <div id="nx-chat-room" class="nx-fullscreen-chat-room">
            <div style="height:56px; display:flex; align-items:center; justify-content:space-between; padding:0 12px; background:#202c33; border-bottom:1px solid #2a3942; flex-shrink:0; z-index:10;">
                <div style="display:flex; align-items:center; gap:9px; min-width:0; flex:1;">
                    <button type="button" onclick="NexusChat.closeChatRoom()" style="background:none; border:none; color:#e9edef; font-size:20px; cursor:pointer; padding:4px 6px; flex-shrink:0;">←</button>
                    <div id="nx-room-badge" style="width:38px; height:38px; border-radius:50%; background:#00a884; color:#020617; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:16px; flex-shrink:0;">C</div>
                    <div style="min-width:0; flex:1;">
                        <div id="nx-room-title" style="font-weight:700; font-size:15px; color:#e9edef; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Channel</div>
                        <div id="nx-online-count-txt" style="font-size:11px; color:#00a884; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Live Room • Swipe or Tap msg</div>
                    </div>
                </div>
                <div style="display:flex; gap:5px; flex-shrink:0;">
                    <button type="button" id="nx-room-music-btn" style="display:none;"></button>
                    <button type="button" onclick="NexusChat.toggleGroupSearch()" title="Search Messages" style="background:#2a3942; border:none; color:#38bdf8; width:32px; height:32px; border-radius:10px; font-size:14px; cursor:pointer;">🔍</button>
                    <button type="button" onclick="NexusChat.openCodeSnippetModal()" title="Share Code Box" style="background:#2a3942; border:none; color:#34d399; width:32px; height:32px; border-radius:10px; font-size:14px; cursor:pointer;">💻</button>
                    <button type="button" onclick="NexusChat.openPdfVaultModal()" style="background:#2a3942; border:none; color:white; padding:6px 9px; border-radius:10px; font-size:11.5px; font-weight:700; cursor:pointer;">📄 PDF</button>
                </div>
            </div>

            <div id="nx-grp-search-bar" style="display:none; padding:7px 12px; background:#111b21; border-bottom:1px solid #2a3942; align-items:center; gap:8px; flex-shrink:0;">
                <input type="text" id="nx-grp-search-in" placeholder="🔍 Search messages in this room..." autocomplete="off" style="flex:1; padding:7px 12px; border-radius:14px; border:1px solid #334155; background:#202c33; color:#fff; font-size:12.5px; outline:none;">
                <button type="button" onclick="NexusChat.toggleGroupSearch(false)" style="background:none; border:none; color:#ef4444; font-weight:900; cursor:pointer;">✕</button>
            </div>

            <div style="background:#182229; border-bottom:1px solid #233138; border-left:4px solid #00a884; padding:6px 12px; font-size:11.5px; color:#cbd5e1; flex-shrink:0;">
                <span id="nx-room-pin-text">Swipe Left/Right to Reply ↩️, Double-Tap for ❤️, or Tap for Menu!</span>
            </div>

            <div id="nx-room-messages" style="flex:1; overflow-y:auto; padding:10px 12px; display:flex; flex-direction:column; gap:8px; background:#0b141a;"></div>

            <div id="nx-typing-bar" style="display:none; padding:4px 14px; background:#111b21; font-size:11.5px; color:#00a884; font-weight:700; align-items:center; gap:6px; flex-shrink:0;">
                <span id="nx-typing-names">Someone is typing</span>
                <span><i class="nx-typing-dot"></i><i class="nx-typing-dot"></i><i class="nx-typing-dot"></i></span>
            </div>

            <div id="nx-chat-sticker-drawer" style="display:none; background:#111b21; border-top:1px solid #2a3942; padding:8px 10px; flex-shrink:0;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:7px;">
                    <input type="text" id="nx-room-stk-search" placeholder="🔍 Search Stickers..." autocomplete="off" style="flex:1; min-width:0; padding:7px 12px; border-radius:16px; border:1px solid #2a3942; background:#202c33; color:white; font-size:12px; outline:none;">
                    <button type="button" onclick="document.getElementById('nx-chat-sticker-drawer').style.display='none'" style="background:#202c33; border:none; color:#cbd5e1; width:28px; height:28px; border-radius:50%; cursor:pointer; flex-shrink:0;">✕</button>
                </div>
                <div style="display:flex; gap:6px; overflow-x:auto; scrollbar-width:none; margin-bottom:7px;">
                    <span class="nx-room-stk-chip active" onclick="NexusChat.filterRoomStickers('trending', this)">🔥 Trending</span>
                    <span class="nx-room-stk-chip" onclick="NexusChat.filterRoomStickers('funny', this)">😂 Funny</span>
                    <span class="nx-room-stk-chip" onclick="NexusChat.filterRoomStickers('study', this)">📚 Study</span>
                    <span class="nx-room-stk-chip" onclick="NexusChat.filterRoomStickers('love', this)">❤️ Love</span>
                </div>
                <div id="nx-chat-stk-grid" style="display:grid; grid-template-columns:repeat(4, 1fr); gap:7px; height:165px; overflow-y:auto; padding:2px;"></div>
            </div>

            <div id="nx-chat-context-bar" style="display:none;">
                <span id="nx-chat-context-text">Replying...</span>
                <button type="button" onclick="NexusChat.cancelContextMode()" style="background:none; border:none; color:#ef4444; font-weight:bold; cursor:pointer; margin-left:10px; font-size:15px;">✕</button>
            </div>

            <div style="width:100%; padding:8px 10px; background:#111b21; border-top:1px solid #1e293b; display:flex; align-items:flex-end; gap:8px; flex-shrink:0;">
                <div style="flex:1; min-width:0; display:flex; align-items:flex-end; background:#202c33; border-radius:22px; padding:4px 10px; gap:6px; overflow:hidden;">
                    <button type="button" onclick="NexusChat.toggleStickerDrawer()" style="background:none; border:none; font-size:20px; cursor:pointer; padding:4px 2px; flex-shrink:0;">😊</button>
                    <textarea id="nx-chat-msg-in" rows="1" placeholder="Message..."></textarea>
                    <input type="file" id="nx-chat-photo-in" accept="image/*" style="display:none;">
                    <button type="button" onclick="document.getElementById('nx-chat-photo-in').click()" style="background:none; border:none; font-size:18px; cursor:pointer; padding:4px 2px; flex-shrink:0;">📷</button>
                    <button type="button" onclick="NexusChat.startVoiceInput()" style="background:none; border:none; font-size:17px; cursor:pointer; padding:4px 2px; flex-shrink:0;">🎙️</button>
                </div>
                <button type="button" id="nx-grp-send-btn" onclick="NexusChat.sendChatMessage()" style="background:#00a884; border:none; color:#020617; width:42px; height:42px; border-radius:50%; font-size:18px; font-weight:900; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0;">➤</button>
            </div>
        </div>
    `;

    function ensureCommunityActionModal() {
        if (document.getElementById('nx-cmsg-action-modal')) return;
        const modal = document.createElement('div');
        modal.id = 'nx-cmsg-action-modal';
        modal.className = 'nx-cmsg-backdrop';
        modal.addEventListener('click', e => {
            if (e.target === modal) modal.style.display = 'none';
        });
        document.body.appendChild(modal);
    }
    ensureCommunityActionModal();

    function pingOnlinePresence(isTypingRoom) {
        if (document.visibilityState === 'hidden' && isTypingRoom === undefined) return;
        let me = Nexus.getCurrentUser();
        if (!me || !Nexus.db) return;
        let payload = { isOnlineNow: true, lastOnline: Date.now(), lastSeenAt: Date.now() };
        if (isTypingRoom !== undefined) {
            payload.typingRoom = isTypingRoom;
            payload.typingAt = Date.now();
        }
        Nexus.db.collection("nexus_accounts").doc(String(me.username).toLowerCase().trim()).set(payload, { merge: true }).catch(() => {});
    }
    setInterval(() => {
        if (document.visibilityState !== 'hidden') pingOnlinePresence();
    }, 45000);

    function persistLightGroupCache() {
        try {
            const slim = {};
            Object.keys(liveMessagesByRoom).forEach(rk => {
                slim[rk] = (liveMessagesByRoom[rk] || []).slice(-18).map(m => Object.assign({}, m, {
                    imgUrl: (m.imgUrl && m.imgUrl.length > 50000) ? '' : (m.imgUrl || '')
                }));
            });
            localStorage.setItem(GRP_CACHE_KEY, JSON.stringify(slim));
        } catch (e) {}
    }

    // Fast Firestore REST Fallback so Group Channel counts NEVER stay at 0 even if Firestore WebSocket is slow!
    async function fastRestPrefetchGroupMessages() {
        try {
            const url = 'https://firestore.googleapis.com/v1/projects/nexus-community-bf99c/databases/(default)/documents/nexus_real_msgs?pageSize=120';
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) return;
            const json = await res.json();
            if (!json || !Array.isArray(json.documents) || !json.documents.length) return;
            const parseV = (v) => {
                if (!v || typeof v !== 'object') return '';
                if ('stringValue' in v) return v.stringValue;
                if ('integerValue' in v) return Number(v.integerValue);
                if ('doubleValue' in v) return Number(v.doubleValue);
                if ('booleanValue' in v) return Boolean(v.booleanValue);
                if ('arrayValue' in v) return (v.arrayValue.values || []).map(parseV);
                if ('mapValue' in v) { const o = {}; const f = v.mapValue.fields || {}; for (const k in f) o[k] = parseV(f[k]); return o; }
                return '';
            };
            const map = {};
            json.documents.forEach(d => {
                const m = {};
                const f = d.fields || {};
                for (const k in f) m[k] = parseV(f[k]);
                m.id = d.name.split('/').pop();
                const rId = m.roomId || 'casual_chat';
                if (!map[rId]) map[rId] = [];
                map[rId].push(m);
            });
            Object.keys(map).forEach(rk => map[rk].sort((a, b) => Number(a.createdAt || 0) - Number(b.createdAt || 0)));
            if (Object.keys(liveMessagesByRoom).length === 0) {
                liveMessagesByRoom = map;
                persistLightGroupCache();
                if (activeRoomId) NexusChat.renderActiveRoomMessages();
                else NexusChat.renderChannelCards();
            }
        } catch (e) {}
    }
    fastRestPrefetchGroupMessages();

    function connectRealMessages() {
        if (!Nexus.db) { setTimeout(connectRealMessages, 350); return; }
        Nexus.db.collection("nexus_real_msgs").orderBy("createdAt", "desc").limit(160).onSnapshot(snap => {
            liveMessagesByRoom = {};
            snap.forEach(doc => {
                let m = doc.data();
                m.id = doc.id;
                let rId = m.roomId || 'casual_chat';
                if (!liveMessagesByRoom[rId]) liveMessagesByRoom[rId] = [];
                liveMessagesByRoom[rId].push(m);
            });
            Object.keys(liveMessagesByRoom).forEach(rKey => {
                liveMessagesByRoom[rKey].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
            });
            persistLightGroupCache();
            if (activeRoomId) NexusChat.renderActiveRoomMessages();
            else NexusChat.renderChannelCards();
        });

        Nexus.db.collection("nexus_real_pdfs").orderBy("createdAt", "desc").limit(50).onSnapshot(snap => {
            livePdfsList = [];
            snap.forEach(doc => { let d = doc.data(); d.id = doc.id; livePdfsList.push(d); });
        });
    }
    connectRealMessages();

    // Wire Live Group Typing Indicator (#nx-typing-bar) via Nexus.listeners.onUsers!
    function updateGroupTypingBanner() {
        if (!activeRoomId) return;
        const bar = document.getElementById('nx-typing-bar');
        const namesEl = document.getElementById('nx-typing-names');
        if (!bar || !namesEl) return;
        const me = Nexus.getCurrentUser();
        const myU = me ? String(me.username || '').toLowerCase() : '';
        const now = Date.now();
        const typers = ((window.Nexus && Nexus.users) || []).filter(u =>
            u && u.username && u.username.toLowerCase() !== myU &&
            u.typingRoom === activeRoomId && u.typingAt && (now - Number(u.typingAt) < 4500)
        ).map(u => u.name || u.username);
        if (typers.length > 0) {
            namesEl.textContent = typers.slice(0, 2).join(', ') + (typers.length > 1 ? ' are typing' : ' is typing');
            bar.style.display = 'flex';
        } else {
            bar.style.display = 'none';
        }
    }
    if (window.Nexus && Nexus.listeners && Nexus.listeners.onUsers) {
        Nexus.listeners.onUsers.push(updateGroupTypingBanner);
    }

    window.NexusChat = {
        getActiveRoomId: function() { return activeRoomId; },

        openLiveTestSeries: function() {
            if (window.NexusUltra && NexusUltra.openSmoothCollabBrowser) {
                NexusUltra.openSmoothCollabBrowser();
            } else if (window.NexusAdvance && NexusAdvance.openPartnerTestPortal) {
                NexusAdvance.openPartnerTestPortal();
            } else {
                window.open('https://challengers-live.netlify.app', '_blank');
            }
        },

        toggleStudyMusic: function() {
            this.openLiveTestSeries();
        },

        filterChannels: function(cat, btnEl) {
            currentFilter = cat;
            document.querySelectorAll('.nx-cat-btn').forEach(b => {
                b.style.background = '#0f172a'; b.style.color = '#94a3b8'; b.style.border = '1px solid #1e293b';
            });
            if (btnEl) { btnEl.style.background = '#00a884'; btnEl.style.color = '#020617'; btnEl.style.border = 'none'; }
            this.renderChannelCards();
        },

        renderChannelCards: function() {
            const listEl = document.getElementById('nx-channels-list');
            if (!listEl) return;
            let filtered = CHANNELS_META.filter(c => currentFilter === 'all' || c.cat === currentFilter);

            listEl.innerHTML = filtered.map(c => {
                let msgs = liveMessagesByRoom[c.id] || [];
                let lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
                let previewText = c.desc;
                if (lastMsg) {
                    let txt = lastMsg.deleted ? '🚫 Message deleted' : (lastMsg.sticker ? '✨ Sticker' : (lastMsg.imgUrl ? '📷 Photo' : (lastMsg.text || '')));
                    previewText = `<span style="color:#00a884; font-weight:600;">${lastMsg.sender}:</span> ${txt}`;
                }
                return `
                    <div onclick="NexusChat.openChatRoom('${c.id}')" style="background:#0f172a; border:1px solid #1e293b; border-radius:16px; padding:14px; display:flex; align-items:center; justify-content:space-between; gap:12px; cursor:pointer;">
                        <div style="display:flex; align-items:center; gap:12px; min-width:0; flex:1;">
                            <div style="width:46px; height:46px; border-radius:14px; background:${c.color}18; border:1px solid ${c.color}55; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0;">${c.icon}</div>
                            <div style="min-width:0; flex:1;">
                                <div style="font-weight:700; font-size:14.5px; color:#f8fafc; margin-bottom:3px;">${c.title}</div>
                                <div style="font-size:12px; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${previewText}</div>
                            </div>
                        </div>
                        <span style="background:#00a884; color:#020617; padding:4px 10px; border-radius:12px; font-size:11px; font-weight:800;">${msgs.length}</span>
                    </div>
                `;
            }).join('');
        },

        toggleGroupSearch: function(forceState) {
            const bar = document.getElementById('nx-grp-search-bar');
            const inp = document.getElementById('nx-grp-search-in');
            if (!bar) return;
            const show = typeof forceState === 'boolean' ? forceState : (bar.style.display === 'none');
            bar.style.display = show ? 'flex' : 'none';
            if (show && inp) { inp.focus(); }
            else { activeGroupSearchQuery = ''; if (inp) inp.value = ''; this.renderActiveRoomMessages(); }
        },

        openCodeSnippetModal: function() {
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;
            modal.style.zIndex = '272000';
            modal.innerHTML = `
                <div class="nx-modal-box" style="border:1.5px solid #38bdf8;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h3 style="font-size:15.5px; color:#38bdf8;">💻 Share Formatted Code Snippet</h3>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:17px; cursor:pointer;">✕</button>
                    </div>
                    <select id="nx-code-lang" style="width:100%; padding:8px 10px; border-radius:9px; background:#090d16; border:1px solid #334155; color:#34d399; font-size:12.5px; font-weight:800; margin-bottom:8px; outline:none;">
                        <option value="JS">JavaScript</option>
                        <option value="HTML">HTML / CSS</option>
                        <option value="PY">Python</option>
                        <option value="CPP">C++ / DSA</option>
                        <option value="MATH">JEE Formula / Steps</option>
                    </select>
                    <textarea id="nx-code-body" rows="6" placeholder="Paste code or formula steps here..." style="width:100%; padding:10px; border-radius:10px; background:#050811; border:1px solid #334155; color:#e2e8f0; font-family:monospace; font-size:12.5px; outline:none; resize:vertical;"></textarea>
                    <button type="button" id="nx-send-code-btn" style="width:100%; margin-top:10px; padding:11px; border-radius:11px; background:#10b981; color:#020617; font-weight:900; font-size:13px; border:none; cursor:pointer;">🚀 Send Code to Room</button>
                </div>
            `;
            modal.style.display = 'flex';
            modal.querySelector('#nx-send-code-btn').onclick = () => {
                const lang = modal.querySelector('#nx-code-lang').value || 'CODE';
                const body = (modal.querySelector('#nx-code-body').value || '').trim();
                if (!body) return Nexus.toast('⚠️ Code box khali hai!');
                modal.style.display = 'none';
                const inp = document.getElementById('nx-chat-msg-in');
                if (inp) inp.value = `[${lang}]
\`\`\`
${body}
\`\`\``;
                NexusChat.sendChatMessage();
            };
        },

        openChatRoom: function(roomId) {
            activeRoomId = roomId;
            activeGroupSearchQuery = '';
            const sBar = document.getElementById('nx-grp-search-bar');
            if (sBar) sBar.style.display = 'none';
            if (window.__nxPushBackLayer) {
                window.__nxPushBackLayer('nx-chat-room', () => NexusChat.closeChatRoom());
            }
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
            let meta = CHANNELS_META.find(c => c.id === roomId) || { title: roomId, color: "#00a884", pin: "Swipe Left/Right to Reply!" };
            document.getElementById('nx-chat-directory').style.display = 'none';
            document.getElementById('nx-chat-room').style.display = 'flex';
            document.getElementById('nx-room-title').innerText = meta.title;
            const pinEl = document.getElementById('nx-room-pin-text');
            if (pinEl) pinEl.innerText = `📌 ${meta.pin}`;
            const badge = document.getElementById('nx-room-badge');
            if (badge) { badge.style.background = meta.color; badge.innerText = meta.title.charAt(0).toUpperCase(); }
            this.cancelContextMode();
            this.renderActiveRoomMessages();
            syncCommunityViewport();
        },

        closeChatRoom: function() {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            pingOnlinePresence('');
            activeRoomId = null;
            this.cancelContextMode();
            const grpTray = document.getElementById('nx-grp-bottom-tray');
            if (grpTray) grpTray.style.display = 'none';
            document.getElementById('nx-chat-room').style.display = 'none';
            document.getElementById('nx-chat-directory').style.display = 'block';
            this.renderChannelCards();
        },

        renderActiveRoomMessages: function() {
            if (!activeRoomId) return;
            const msgBox = document.getElementById('nx-room-messages');
            if (!msgBox) return;

            let q = String(activeGroupSearchQuery || '').toLowerCase().trim();
            let msgs = (liveMessagesByRoom[activeRoomId] || []).slice()
                .filter(m => !q || String(m.text || '').toLowerCase().includes(q) || String(m.sender || '').toLowerCase().includes(q))
                .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
            let me = Nexus.getCurrentUser();
            let myUsername = me ? me.username.toLowerCase() : '';
            let myName = me ? me.name.toLowerCase() : '';
            let hiddenForMe = getGroupHiddenForMeSet(myUsername);

            if (msgs.length === 0) {
                msgBox.innerHTML = `<div style="margin:auto; text-align:center; color:#8696a0; font-size:12px; background:#182229; padding:12px 16px; border-radius:14px;">👋 Start the discussion! Type a message below.</div>`;
                return;
            }

            let lastDayLabel = '';
            let htmlParts = [];

            msgs.forEach(m => {
                // If user clicked "Delete for Me", skip rendering this message on their phone
                if (hiddenForMe.has(String(m.id))) return;

                let dayLabel = formatChatDayHeader(m.createdAt);
                if (dayLabel !== lastDayLabel) {
                    htmlParts.push(`<div class="nx-day-header-pill">${dayLabel}</div>`);
                    lastDayLabel = dayLabel;
                }

                let sender = (m.sender || 'Member').trim();
                let targetUser = m.username || sender;
                let safeTarget = targetUser.replace(/'/g, "\\'");
                let isMe = me && ((m.username && m.username.toLowerCase() === myUsername) || sender.toLowerCase() === myName);

                // COMPACT DELETED MESSAGE PILL (Small SVG icon + neat inline pill)
                if (m.deleted) {
                    let delBy = m.deletedByName || m.sender || m.username || 'Author';
                    htmlParts.push(`
                        <div style="display:flex; flex-direction:column; align-items:${isMe ? 'flex-end' : 'flex-start'};">
                            <div class="nx-deleted-msg-box">
                                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                                <span>Deleted by <b>${delBy.replace(/</g, '&lt;')}</b></span>
                                <span style="font-size:9.5px; color:#64748b; font-style:normal; margin-left:3px;">${m.time || ''}</span>
                            </div>
                        </div>
                    `);
                    return;
                }

                let cleanText = escHtml(m.text || '').replace(/```([\s\S]*?)```/g, '<pre style="background:#050811;border:1px solid #334155;border-left:3px solid #38bdf8;border-radius:8px;padding:7px 9px;margin:5px 0;font-family:monospace;font-size:12px;color:#e2e8f0;overflow-x:auto;white-space:pre-wrap;">$1</pre>');
                let likesArr = Array.isArray(m.likes) ? m.likes : [];
                let reactionEmoji = m.reaction || '❤️';

                let replyHTML = m.replyTo
                    ? `<div style="background:rgba(0,0,0,0.28); border-left:3px solid #00a884; padding:5px 8px; border-radius:6px; font-size:11.5px; color:#cbd5e1; margin-bottom:5px; max-height:70px; overflow-y:auto;"><b style="color:#00a884;">@${m.replyTo.sender}:</b> ${m.replyTo.text}</div>`
                    : '';

                let stickerHTML = (m.sticker && m.sticker.url)
                    ? `<img src="${m.sticker.url}" loading="lazy" style="width:112px; height:112px; object-fit:contain; display:block;">`
                    : '';

                let imgHTML = m.imgUrl
                    ? `<img src="${m.imgUrl}" loading="lazy" style="max-width:215px; max-height:245px; border-radius:8px; margin-top:4px; display:block;">`
                    : '';

                let floatingPillHTML = likesArr.length > 0
                    ? `<div class="nx-group-react-pill" onclick="event.stopPropagation(); NexusChat.viewMsgLikes('${m.id}')"><span>${reactionEmoji}</span><span>${likesArr.length}</span></div>`
                    : '';

                htmlParts.push(`
                    <div style="display:flex; flex-direction:column; align-items:${isMe ? 'flex-end' : 'flex-start'};">
                        <div onclick="NexusChat.openCommunityMsgMenu('${m.id}')" oncontextmenu="event.preventDefault(); NexusChat.openCommunityMsgMenu('${m.id}')" style="max-width:82%; min-width:95px; background:${m.sticker && !cleanText ? 'transparent' : (isMe ? '#005c4b' : '#202c33')}; color:#e9edef; padding:${m.sticker && !cleanText ? '2px' : '7px 11px'}; border-radius:12px; border-${isMe ? 'top-right' : 'top-left'}-radius:2px; user-select:none; cursor:pointer; position:relative;">
                            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:2px;">
                                <span onclick="event.stopPropagation(); NexusChat.closeChatRoom(); Nexus.openPublicProfile('${safeTarget}')" style="font-weight:700; font-size:12px; color:${isMe ? '#fde047' : '#53bdeb'}; cursor:pointer;">${sender}</span>
                                <span style="font-size:11px; color:rgba(233,237,239,0.6); font-weight:800;">⌄</span>
                            </div>
                            ${replyHTML}
                            ${stickerHTML}
                            ${imgHTML}
                            <div style="display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:8px;">
                                ${cleanText ? `<span style="font-size:14.5px; line-height:1.38; word-break:break-word; white-space:pre-wrap;">${cleanText}</span>` : '<span></span>'}
                                <span style="font-size:10px; color:rgba(233,237,239,0.65); white-space:nowrap; margin-left:auto;">
                                    ${m.time || ''} ${m.edited ? '(edited)' : ''}
                                </span>
                            </div>
                        </div>
                        ${floatingPillHTML}
                    </div>
                `);
            });

            msgBox.innerHTML = htmlParts.join('');
            msgBox.scrollTop = msgBox.scrollHeight;
        },

        // GROUP MESSAGE MENU WITH BOTH "🧹 DELETE FOR ME" AND "🗑️ DELETE FOR EVERYONE"
        openCommunityMsgMenu: function(msgId) {
            let now = Date.now();
            let lastTap = lastGroupTapMap[msgId] || 0;
            if (now - lastTap < 280) {
                lastGroupTapMap[msgId] = 0;
                this.reactToMsg(msgId, '❤️');
                Nexus.toast("❤️ Liked Message!");
                return;
            }
            lastGroupTapMap[msgId] = now;

            ensureCommunityActionModal();
            let me = Nexus.getCurrentUser();
            if (!me || !activeRoomId) return;
            let list = liveMessagesByRoom[activeRoomId] || [];
            let m = list.find(x => x.id === msgId);
            if (!m || m.deleted) return;

            let myUname = me.username.toLowerCase().trim();
            let myName = me.name.toLowerCase().trim();
            let isStrictlyOwner = (m.username && m.username.toLowerCase().trim() === myUname) ||
                                  (m.sender && m.sender.toLowerCase().trim() === myName);

            let safeSender = (m.sender || m.username || 'Member').replace(/'/g, "\\'");
            let safeTarget = (m.username || m.sender || 'Member').replace(/'/g, "\\'");
            let safeSnippet = (m.text || (m.sticker ? '✨ Sticker' : '📷 Photo')).replace(/'/g, "\\'").replace(/\n/g, " ");
            const emojis = ['❤️', '😂', '🔥', '👍', '🙏', '💯'];

            const modal = document.getElementById('nx-cmsg-action-modal');
            modal.innerHTML = `
                <div class="nx-cmsg-sheet">
                    <div style="font-size:11.5px; color:#8696a0; margin-bottom:8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                        <b>${m.sender}:</b> "${m.text || 'Media'}"
                    </div>
                    <div class="nx-cmsg-emoji-bar">
                        ${emojis.map(em => `<button type="button" class="nx-cmsg-emoji-btn" onclick="NexusChat.reactToMsg('${m.id}', '${em}')">${em}</button>`).join('')}
                    </div>
                    <button type="button" class="nx-cmsg-opt-btn" onclick="document.getElementById('nx-cmsg-action-modal').style.display='none'; NexusChat.startReply('${safeSender}', '${safeSnippet}')">
                        <span>↩️</span> <span>Reply to ${m.sender}</span>
                    </button>
                    <button type="button" class="nx-cmsg-opt-btn" onclick="document.getElementById('nx-cmsg-action-modal').style.display='none'; NexusChat.closeChatRoom(); Nexus.openPublicProfile('${safeTarget}')">
                        <span>👤</span> <span>View ${m.sender}'s Profile</span>
                    </button>
                    ${m.text ? `
                        <button type="button" class="nx-cmsg-opt-btn" onclick="NexusChat.copyGroupMsg('${m.id}')">
                            <span>📋</span> <span>Copy Message Text</span>
                        </button>
                    ` : ''}
                    ${isStrictlyOwner && m.text ? `
                        <button type="button" class="nx-cmsg-opt-btn" style="color:#38bdf8;" onclick="document.getElementById('nx-cmsg-action-modal').style.display='none'; NexusChat.startEditMsg('${m.id}')">
                            <span>✏️</span> <span>Edit My Message</span>
                        </button>
                    ` : ''}
                    <button type="button" class="nx-cmsg-opt-btn" style="color:#cbd5e1;" onclick="document.getElementById('nx-cmsg-action-modal').style.display='none'; NexusChat.deleteMsgForMe('${m.id}')">
                        <span>🧹</span> <span>Delete for Me</span>
                    </button>
                    ${isStrictlyOwner ? `
                        <button type="button" class="nx-cmsg-opt-btn" style="color:#f87171; border-color:rgba(248,113,113,0.35);" onclick="document.getElementById('nx-cmsg-action-modal').style.display='none'; NexusChat.deleteMsg('${m.id}')">
                            <span>🗑️</span> <span>Delete for Everyone</span>
                        </button>
                    ` : ''}
                    <button type="button" class="nx-cmsg-opt-btn" style="justify-content:center; background:transparent; border:none; color:#8696a0; margin-bottom:0;" onclick="document.getElementById('nx-cmsg-action-modal').style.display='none'">Cancel</button>
                </div>
            `;
            modal.style.display = 'flex';
        },

        copyGroupMsg: function(msgId) {
            const modal = document.getElementById('nx-cmsg-action-modal');
            if (modal) modal.style.display = 'none';
            const m = (liveMessagesByRoom[activeRoomId] || []).find(x => x.id === msgId);
            if (m && m.text) {
                navigator.clipboard?.writeText(m.text).then(() => Nexus.toast('📋 Copied!')).catch(() => {});
            }
        },

        deleteMsgForMe: function(msgId) {
            let me = Nexus.getCurrentUser();
            if (!me || !msgId) return;
            saveGroupHiddenForMe(me.username, msgId);
            this.renderActiveRoomMessages();
            Nexus.toast("🧹 Deleted for you");
        },

        reactToMsg: function(msgId, emoji) {
            document.getElementById('nx-cmsg-action-modal').style.display = 'none';
            let me = Nexus.getCurrentUser();
            if (!me || !Nexus.db || !activeRoomId) return;
            let list = liveMessagesByRoom[activeRoomId] || [];
            let m = list.find(x => x.id === msgId);
            if (!m) return;
            let likes = Array.isArray(m.likes) ? [...m.likes] : [];
            if (likes.includes(me.username) && m.reaction === emoji) likes = likes.filter(u => u !== me.username);
            else if (!likes.includes(me.username)) likes.push(me.username);
            m.likes = likes;
            m.reaction = emoji;
            this.renderActiveRoomMessages();
            Nexus.db.collection("nexus_real_msgs").doc(msgId).update({ likes: likes, reaction: emoji });
        },

        viewMsgLikes: function(msgId) {
            if (!activeRoomId) return;
            let list = liveMessagesByRoom[activeRoomId] || [];
            let m = list.find(x => x.id === msgId);
            if (!m) return;
            this.closeChatRoom();
            if (Nexus.openUserListModal) Nexus.openUserListModal('❤️ Reacted to Message', m.likes || [], '');
        },

        toggleStickerDrawer: function() {
            const drawer = document.getElementById('nx-chat-sticker-drawer');
            if (!drawer) return;
            drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
            if (drawer.style.display === 'block') this.renderRoomStickers(currentRoomStkCat, '');
            setTimeout(syncCommunityViewport, 50);
        },

        filterRoomStickers: function(cat, chipEl) {
            currentRoomStkCat = cat;
            if (chipEl) {
                document.querySelectorAll('.nx-room-stk-chip').forEach(c => c.classList.remove('active'));
                chipEl.classList.add('active');
            }
            this.renderRoomStickers(cat, '');
        },

        renderRoomStickers: function(cat, query) {
            const grid = document.getElementById('nx-chat-stk-grid');
            if (!grid) return;
            let q = (query || '').toLowerCase();
            let filtered = COMMUNITY_STICKER_BANK.filter(s => q ? s.l.toLowerCase().includes(q) : (cat === 'all' || s.g === cat));
            grid.innerHTML = filtered.map(s => {
                let url = `https://fonts.gstatic.com/s/e/notoemoji/latest/${s.c}/512.webp`;
                return `<div onclick="NexusChat.sendSticker('${url}', '${s.l}')" style="background:#182229; border:1px solid #233138; border-radius:10px; padding:5px; display:flex; flex-direction:column; align-items:center; cursor:pointer;"><img src="${url}" style="width:42px; height:42px;"><span style="font-size:9px; color:#8696a0;">${s.l}</span></div>`;
            }).join('');
        },

        sendSticker: function(url, label) {
            document.getElementById('nx-chat-sticker-drawer').style.display = 'none';
            let me = Nexus.getCurrentUser();
            if (!me || !activeRoomId || !Nexus.db) return;
            let payload = {
                roomId: activeRoomId, username: me.username, sender: me.name, role: me.bio || 'JEE Aspirant',
                text: '', sticker: { url: url, label: label }, imgUrl: '', replyTo: null, likes: [], edited: false,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), createdAt: Date.now()
            };
            if (!liveMessagesByRoom[activeRoomId]) liveMessagesByRoom[activeRoomId] = [];
            liveMessagesByRoom[activeRoomId].push(Object.assign({ id: 'temp_' + Date.now() }, payload));
            this.renderActiveRoomMessages();
            Nexus.db.collection("nexus_real_msgs").add(payload);
        },

        sendChatMessage: function(customImgUrl) {
            let me = Nexus.getCurrentUser();
            if (!me) {
                Nexus.toast("Please Login in Profile Tab first!");
                Nexus.switchTab('tab-profile');
                return;
            }
            if (!activeRoomId) activeRoomId = 'casual_chat';
            const inp = document.getElementById('nx-chat-msg-in');
            let txt = inp ? inp.value.trim() : '';
            if (!txt && !customImgUrl) return;

            if (editingMsgId && !customImgUrl) {
                let list = liveMessagesByRoom[activeRoomId] || [];
                let found = list.find(x => x.id === editingMsgId);
                if (found) { found.text = txt; found.edited = true; }
                this.renderActiveRoomMessages();
                if (Nexus.db) {
                    Nexus.db.collection("nexus_real_msgs").doc(editingMsgId).set({ text: txt, edited: true }, { merge: true });
                }
                if (inp) { inp.value = ''; inp.style.height = '36px'; }
                this.cancelContextMode();
                Nexus.toast("✏️ Message Updated!");
                return;
            }

            if (inp && !customImgUrl) {
                inp.value = '';
                inp.style.height = '36px';
            }

            let msgPayload = {
                roomId: activeRoomId,
                username: me.username,
                sender: me.name,
                role: me.bio || 'JEE Aspirant',
                text: txt,
                imgUrl: customImgUrl || '',
                sticker: null,
                replyTo: replyingToMsg ? Object.assign({}, replyingToMsg) : null,
                likes: [],
                edited: false,
                deleted: false,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                createdAt: Date.now()
            };

            this.cancelContextMode();

            if (!liveMessagesByRoom[activeRoomId]) liveMessagesByRoom[activeRoomId] = [];
            liveMessagesByRoom[activeRoomId].push(Object.assign({ id: 'temp_' + Date.now() }, msgPayload));
            this.renderActiveRoomMessages();

            if (Nexus.db) {
                Nexus.db.collection("nexus_real_msgs").add(msgPayload).catch(() => {
                    Nexus.toast("⚠️ Slow network, retrying...");
                });
            }
        },

        startEditMsg: function(msgId) {
            let list = liveMessagesByRoom[activeRoomId] || [];
            let m = list.find(x => x.id === msgId);
            if (!m) return;
            editingMsgId = msgId;
            replyingToMsg = null;
            const bar = document.getElementById('nx-chat-context-bar');
            const txt = document.getElementById('nx-chat-context-text');
            const inp = document.getElementById('nx-chat-msg-in');
            if (bar && txt && inp) {
                bar.style.display = 'flex';
                txt.innerText = `✏️ Editing Message:\n${m.text}`;
                inp.value = m.text;
                inp.focus();
                resizeChatInputBox();
            }
        },

        startReply: function(sender, snippet) {
            editingMsgId = null;
            replyingToMsg = { sender: sender, text: snippet.substring(0, 140) };
            const bar = document.getElementById('nx-chat-context-bar');
            const txt = document.getElementById('nx-chat-context-text');
            const inp = document.getElementById('nx-chat-msg-in');
            if (bar && txt && inp) {
                bar.style.display = 'flex';
                txt.innerText = `↩️ @${sender}: ${replyingToMsg.text}`;
                inp.focus();
                resizeChatInputBox();
            }
        },

        cancelContextMode: function() {
            editingMsgId = null;
            replyingToMsg = null;
            const bar = document.getElementById('nx-chat-context-bar');
            if (bar) bar.style.display = 'none';
        },

        deleteMsg: function(msgId) {
            let me = Nexus.getCurrentUser();
            if (!Nexus.db || !activeRoomId || !me) return;
            let list = liveMessagesByRoom[activeRoomId] || [];
            let m = list.find(x => x.id === msgId);
            if (m) {
                m.deleted = true;
                m.deletedByName = me.name || me.username;
                m.text = '';
                m.imgUrl = '';
                m.sticker = null;
            }
            this.renderActiveRoomMessages();
            Nexus.db.collection("nexus_real_msgs").doc(msgId).set({
                deleted: true,
                deletedByName: me.name || me.username,
                text: '',
                imgUrl: '',
                sticker: null
            }, { merge: true }).then(() => Nexus.toast("🗑️ Deleted for Everyone"));
        },

        startVoiceInput: function() {
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRec) return;
            const rec = new SpeechRec();
            rec.lang = 'en-IN';
            Nexus.toast("🎙️ Speak now...");
            rec.onresult = e => {
                const inp = document.getElementById('nx-chat-msg-in');
                if (inp) { inp.value = (inp.value + ' ' + e.results[0][0].transcript).trim(); resizeChatInputBox(); }
            };
            rec.start();
        },

        openPdfVaultModal: function(searchQ) {
            let me = Nexus.getCurrentUser();
            const modal = document.getElementById('nx-global-modal');
            if (!modal) return;
            modal.style.zIndex = '270000';
            const q = String(searchQ || '').toLowerCase().trim();
            const filtered = livePdfsList.filter(p => !q || String(p.title || '').toLowerCase().includes(q) || String(p.by || '').toLowerCase().includes(q));

            let listHTML = filtered.length === 0
                ? `<div style="text-align:center; padding:16px; color:#64748b; font-size:13px;">${q ? 'No matching PDFs found.' : 'No study PDFs uploaded yet.'}</div>`
                : filtered.map(p => {
                    let isMyPdf = me && ((p.username && p.username.toLowerCase() === me.username.toLowerCase()) || p.by === me.name);
                    return `<div style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding:10px 12px; background:#1e293b; border:1px solid #334155; border-radius:11px;"><a href="${escHtml(p.url)}" target="_blank" style="color:white; text-decoration:none; font-size:13px; flex:1; min-width:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">📄 <b>${escHtml(p.title)}</b> <small style="color:#94a3b8;">by ${escHtml(p.by)}</small></a>${isMyPdf ? `<button type="button" onclick="NexusChat.deletePdf('${escHtml(p.id)}')" style="background:none; border:none; color:#f87171; cursor:pointer;">🗑️</button>` : ''}</div>`;
                }).join('');

            modal.innerHTML = `
                <div class="nx-modal-box" style="border:1.5px solid #10b981;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h3 style="font-size:16px; color:#f8fafc;">📄 Study PDF Vault (${livePdfsList.length})</h3>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>
                    <input type="text" id="nx-pdf-search" value="${escHtml(searchQ || '')}" placeholder="🔍 Search chapter / notes..." oninput="NexusChat.openPdfVaultModal(this.value)" style="width:100%; padding:8px 12px; border-radius:10px; border:1px solid #334155; background:#090d16; color:#fff; font-size:12.5px; margin-bottom:10px; outline:none;">
                    <div style="display:flex; flex-direction:column; gap:8px; max-height:36vh; overflow-y:auto; margin-bottom:12px;">${listHTML}</div>
                    <div style="display:flex; flex-direction:column; gap:8px; padding-top:10px; border-top:1px solid #1e293b;">
                        <input type="text" id="nx-pdf-t" placeholder="Topic / Chapter Name (e.g. Electrostatics Formula Sheet)" style="padding:9px 12px; border-radius:9px; border:1px solid #334155; background:#090d16; color:white; font-size:13px; outline:none;">
                        <input type="url" id="nx-pdf-u" placeholder="Google Drive / PDF Link (OR upload PDF file below)" style="padding:9px 12px; border-radius:9px; border:1px solid #334155; background:#090d16; color:white; font-size:13px; outline:none;">
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                            <label for="nx-pdf-file-up" style="background:#1e293b; border:1px dashed #38bdf8; color:#38bdf8; padding:10px 8px; border-radius:9px; font-size:12px; font-weight:800; text-align:center; cursor:pointer; margin:0;">📤 Upload PDF (50MB)</label>
                            <button type="button" onclick="NexusChat.addPdf()" style="background:#00a884; color:#020617; border:none; padding:10px; border-radius:9px; font-weight:900; font-size:12.5px; cursor:pointer;">+ Share Link</button>
                        </div>
                        <input type="file" id="nx-pdf-file-up" accept="application/pdf" style="display:none;">
                    </div>
                </div>
            `;
            modal.style.display = 'flex';
            const fUp = modal.querySelector('#nx-pdf-file-up');
            if (fUp) {
                fUp.onchange = async (e) => {
                    const f = e.target.files && e.target.files[0];
                    if (!f || !me) return;
                    if (!window.NexusSecurity || typeof window.NexusSecurity.uploadPublicMedia !== 'function') {
                        return Nexus.toast('⚠️ Direct PDF upload ke liye Supabase Login karein!');
                    }
                    const uid = await window.NexusSecurity.getAuthenticatedUserId();
                    if (!uid) return Nexus.toast('⚠️ Direct PDF upload ke liye Supabase Login karein!');
                    try {
                        Nexus.toast(`⏳ Uploading "${f.name}" to Study Vault...`);
                        const up = await window.NexusSecurity.uploadPublicMedia(f, 'study-pdfs');
                        const title = (modal.querySelector('#nx-pdf-t').value || '').trim() || f.name.replace(/\.pdf$/i, '');
                        if (up && up.publicUrl && Nexus.db) {
                            await Nexus.db.collection("nexus_real_pdfs").add({ title, url: up.publicUrl, by: me.name || me.username, username: me.username, createdAt: Date.now() });
                            Nexus.toast('✅ Study PDF Uploaded to Vault!');
                            NexusChat.openPdfVaultModal('');
                        }
                    } catch (err) {
                        Nexus.toast('❌ Upload failed: ' + (err.message || 'Retry'));
                    }
                };
            }
        },

        addPdf: function() {
            let me = Nexus.getCurrentUser();
            if (!me) return;
            let t = document.getElementById('nx-pdf-t').value.trim();
            let u = document.getElementById('nx-pdf-u').value.trim();
            if (!t || !u || !Nexus.db) return;
            Nexus.db.collection("nexus_real_pdfs").add({ title: t, url: u, by: me.name, username: me.username, createdAt: Date.now() });
            this.openPdfVaultModal();
        },

        deletePdf: function(pdfId) {
            if (!Nexus.db) return;
            Nexus.db.collection("nexus_real_pdfs").doc(pdfId).delete().then(() => this.openPdfVaultModal());
        }
    };

    const grpSearchIn = document.getElementById('nx-grp-search-in');
    if (grpSearchIn) {
        grpSearchIn.addEventListener('input', () => {
            activeGroupSearchQuery = grpSearchIn.value;
            NexusChat.renderActiveRoomMessages();
        });
    }
    const roomStkSrch = document.getElementById('nx-room-stk-search');
    if (roomStkSrch) {
        roomStkSrch.addEventListener('input', () => {
            NexusChat.renderRoomStickers(currentRoomStkCat, roomStkSrch.value);
        });
    }
    const msgIn = document.getElementById('nx-chat-msg-in');
    if (msgIn) {
        msgIn.addEventListener('input', () => {
            resizeChatInputBox();
            if (activeRoomId && Date.now() - lastGroupTypingPing > 2200) {
                lastGroupTypingPing = Date.now();
                pingOnlinePresence(activeRoomId);
            }
        });
        msgIn.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); NexusChat.sendChatMessage(); }
        });
    }
    const photoIn = document.getElementById('nx-chat-photo-in');
    if (photoIn) {
        photoIn.addEventListener('change', async e => {
            const f = e.target.files && e.target.files[0];
            if (!f) return;
            if (window.NexusSecurity && typeof window.NexusSecurity.uploadPublicMedia === 'function') {
                try {
                    const uid = await window.NexusSecurity.getAuthenticatedUserId();
                    if (uid && f.size <= 50 * 1024 * 1024) {
                        Nexus.toast('⏳ Uploading HD Photo...');
                        const up = await window.NexusSecurity.uploadPublicMedia(f, 'group-photos');
                        if (up && up.publicUrl) {
                            NexusChat.sendChatMessage(up.publicUrl);
                            photoIn.value = '';
                            return;
                        }
                    }
                } catch (err) {}
            }
            Nexus.compressImage(f, 700, 0.72, url => { NexusChat.sendChatMessage(url); photoIn.value = ''; });
        });
    }

    NexusChat.renderChannelCards();
})();
