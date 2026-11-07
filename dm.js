// ================= DM.JS (100% FINAL MASTER): ZERO DUPLICATE PROFILE MESSAGE BUTTON + INSTANT DELETE FOR EVERYONE + HOME FEED DOUBLE-TAP SAFE + KEYBOARD LOCK + 105+ STICKERS =================

(function() {
    let activeDmPartner = null;
    let dmUnsubscribe = null;
    let dmPartnerUnsub = null;
    let dmInboxUnsub = null;
    let dmDbRetryTimer = null;
    let dmReplyingTo = null;
    let dmEditingId = null;
    let dmMessagesCache = [];
    let unreadCountsByUser = {};
    let lastMsgByUser = {};
    let lastDmTypingPing = 0;
    let currentProfileViewTab = 'my';
    let currentStickerCat = 'trending';
    let savedScrollY = 0;

    function patchLiveMessageDOM(container, html) {
        if (!container) return;
        const oldTop = container.scrollTop;
        const wasNearBottom = (container.scrollHeight - container.scrollTop - container.clientHeight) < 96;
        const temp = document.createElement('div');
        temp.innerHTML = html;
        const incoming = Array.from(temp.children);
        const existingByKey = new Map();

        Array.from(container.children).forEach(node => {
            const key = node.getAttribute('data-render-key') ||
                (node.getAttribute('data-message-id') ? `message:${node.getAttribute('data-message-id')}` : '');
            if (key) existingByKey.set(key, node);
        });

        const finalNodes = [];
        incoming.forEach(nextNode => {
            const key = nextNode.getAttribute('data-render-key') ||
                (nextNode.getAttribute('data-message-id') ? `message:${nextNode.getAttribute('data-message-id')}` : '');
            const oldNode = key ? existingByKey.get(key) : null;
            let useNode = nextNode;

            if (oldNode && oldNode.outerHTML === nextNode.outerHTML) {
                useNode = oldNode;
            } else if (!oldNode && key && key.startsWith('message:')) {
                useNode.classList.add('nx-live-message-enter');
                useNode.addEventListener('animationend', () => {
                    useNode.classList.remove('nx-live-message-enter');
                }, { once: true });
            }
            finalNodes.push(useNode);
        });

        finalNodes.forEach((node, index) => {
            const current = container.children[index];
            if (current !== node) container.insertBefore(node, current || null);
        });
        const keep = new Set(finalNodes);
        Array.from(container.children).forEach(node => {
            if (!keep.has(node)) node.remove();
        });

        if (wasNearBottom) container.scrollTop = container.scrollHeight;
        else container.scrollTop = oldTop;
    }

    const dmStyle = document.createElement('style');
    dmStyle.innerHTML = `
        * { -webkit-tap-highlight-color: transparent; }
        /* Hide any legacy duplicate Message button on Public Profile */
        #nx-dm-trigger-btn { display: none !important; }
        @keyframes nxMsgSlideIn {
            0% { opacity: 0; transform: translateY(4px); }
            100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes nxSheetUp {
            0% { opacity: 0; transform: translateY(16px) scale(0.96); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes nxTypingPulse {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
            40% { transform: scale(1.18); opacity: 1; }
        }
        .nx-dm-bubble-anim {
            animation: nxMsgSlideIn 0.1s ease-out forwards;
        }
        .nx-live-message-enter { animation: nxMsgSlideIn 0.12s ease-out both; }
        .nx-dm-date-divider {
            align-self: center;
            margin: 7px auto 5px;
            padding: 5px 11px;
            border: 1px solid rgba(134,150,160,0.18);
            border-radius: 12px;
            background: #182229;
            color: #93c5fd;
            font-size: 10.5px;
            font-weight: 800;
            letter-spacing: .2px;
            text-align: center;
        }
        .nx-dm-local-deleted {
            align-self: center;
            max-width: 86%;
            margin: 2px auto;
            padding: 7px 12px;
            border-radius: 12px;
            background: rgba(24,34,41,.78);
            color: #9aa8b1;
            font-size: 12px;
            font-style: italic;
            text-align: center;
        }
        .nx-dm-message-menu-btn {
            position: absolute;
            bottom: 4px;
            width: 25px;
            height: 23px;
            padding: 0;
            border: 1px solid rgba(233,237,239,0.18);
            border-radius: 9px;
            background: rgba(17,27,33,0.92);
            color: #d7e0e5;
            font-size: 17px;
            line-height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
            cursor: pointer;
            touch-action: manipulation;
        }
        .nx-dm-message-menu-btn:active { transform: scale(0.94); background: #2a3942; }
        [data-nx-dm-gallery="1"] { touch-action: pan-x pan-y; overscroll-behavior-x: contain; }
        .nx-dm-dot {
            display: inline-block;
            width: 5px;
            height: 5px;
            background: #00a884;
            border-radius: 50%;
            margin: 0 1.5px;
            animation: nxTypingPulse 1.2s infinite ease-in-out both;
        }
        .nx-dm-dot:nth-child(1) { animation-delay: -0.32s; }
        .nx-dm-dot:nth-child(2) { animation-delay: -0.16s; }

        #nx-dm-dedicated-root {
            position: fixed;
            left: 0;
            right: 0;
            top: 0;
            width: 100%;
            max-width: 640px;
            height: 100dvh;
            margin: 0 auto;
            background: #0b141a;
            display: none;
            flex-direction: column;
            z-index: 99992;
            overflow: hidden;
            box-shadow: 0 0 50px rgba(0,0,0,0.9);
        }

        .nx-msg-action-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(2, 6, 23, 0.78);
            z-index: 100005;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 18px;
        }
        .nx-msg-action-sheet {
            width: 100%;
            max-width: 325px;
            background: #182229;
            border: 1px solid #2a3942;
            border-radius: 20px;
            padding: 15px;
            box-shadow: 0 18px 45px rgba(0,0,0,0.85);
            animation: nxSheetUp 0.12s ease-out forwards;
        }
        .nx-emoji-bar {
            display: flex;
            justify-content: space-between;
            background: #111b21;
            padding: 8px 12px;
            border-radius: 30px;
            margin-bottom: 12px;
            border: 1px solid #233138;
        }
        .nx-emoji-btn {
            font-size: 23px;
            background: none;
            border: none;
            cursor: pointer;
            padding: 2px;
            transition: transform 0.1s ease;
        }
        .nx-emoji-btn:active {
            transform: scale(1.35);
        }
        .nx-menu-opt-btn {
            width: 100%;
            background: #202c33;
            border: 1px solid #2a3942;
            color: #e9edef;
            padding: 12px 14px;
            border-radius: 12px;
            font-size: 13.5px;
            font-weight: 700;
            text-align: left;
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
            cursor: pointer;
        }
        .nx-menu-opt-btn:active {
            background: #2a3942;
            transform: scale(0.98);
        }

        .nx-cloud-stk-card {
            background: #182229;
            border: 1px solid #233138;
            border-radius: 12px;
            padding: 5px;
            height: 72px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        }
        .nx-cloud-stk-card:active {
            transform: scale(0.88);
            border-color: #00a884;
        }
        .nx-stk-chip {
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
        .nx-stk-chip.active {
            background: #00a884;
            color: #020617;
            border-color: #00a884;
        }
        .nx-unread-pill {
            background: #00a884;
            color: #020617;
            font-size: 10.5px;
            font-weight: 800;
            padding: 2px 8px;
            border-radius: 12px;
        }
        .nx-prof-tab-bar {
            display: flex;
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 14px;
            padding: 4px;
            margin: 10px 0 14px 0;
            gap: 6px;
        }
        .nx-prof-tab-btn {
            flex: 1;
            padding: 9px 10px;
            border-radius: 10px;
            border: none;
            background: transparent;
            color: #94a3b8;
            font-size: 12.5px;
            font-weight: 800;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }
        .nx-prof-tab-btn.active {
            background: linear-gradient(135deg, #2563eb, #4f46e5);
            color: white;
        }
    `;
    document.head.appendChild(dmStyle);

    function ensureDmRootContainer() {
        let root = document.getElementById('nx-dm-dedicated-root');
        if (!root) {
            root = document.createElement('div');
            root.id = 'nx-dm-dedicated-root';
            document.body.appendChild(root);
        }
        return root;
    }

    function syncWhatsAppViewport() {
        const root = document.getElementById('nx-dm-dedicated-root');
        if (!root || root.style.display === 'none') return;

        const vv = window.visualViewport;
        const visibleHeight = Math.max(1, Math.round(vv ? vv.height : window.innerHeight));
        const visibleTop = Math.max(0, Math.round(vv ? vv.offsetTop : 0));

        root.style.setProperty('position', 'fixed', 'important');
        root.style.setProperty('height', visibleHeight + 'px', 'important');
        root.style.setProperty('max-height', visibleHeight + 'px', 'important');
        root.style.setProperty('top', visibleTop + 'px', 'important');
        root.style.setProperty('bottom', 'auto', 'important');
        root.style.setProperty('display', 'flex', 'important');
        root.style.setProperty('overflow', 'hidden', 'important');

        const msgBox = root.querySelector('#nx-dm-msgs-box');
        if (msgBox) {
            msgBox.style.minHeight = '0';
            msgBox.style.flex = '1 1 0%';
            msgBox.style.overflowY = 'auto';
            msgBox.scrollTop = msgBox.scrollHeight;
        }

        const composer = root.querySelector('#nx-dm-composer');
        if (composer) composer.style.flexShrink = '0';
    }

    function resizeDmComposer() {
        const inp = document.getElementById('nx-dm-input');
        if (!inp) return;
        inp.style.height = '36px';
        const maxHeight = 105;
        const nextHeight = Math.min(inp.scrollHeight, maxHeight);
        inp.style.height = nextHeight + 'px';
        inp.style.overflowY = inp.scrollHeight > maxHeight ? 'auto' : 'hidden';
    }

    function compressOneDmPhoto(file, maxWidth, quality) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type || !file.type.startsWith('image/')) {
                reject(new Error('Unsupported image file.'));
                return;
            }
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('Could not read selected photo.'));
            reader.onload = () => {
                const image = new Image();
                image.onerror = () => reject(new Error('This photo format cannot be opened by the browser.'));
                image.onload = () => {
                    try {
                        const originalWidth = image.naturalWidth || image.width;
                        const originalHeight = image.naturalHeight || image.height;
                        if (!originalWidth || !originalHeight) throw new Error('Invalid photo dimensions.');
                        const scale = Math.min(1, maxWidth / Math.max(originalWidth, originalHeight));
                        const canvas = document.createElement('canvas');
                        canvas.width = Math.max(1, Math.round(originalWidth * scale));
                        canvas.height = Math.max(1, Math.round(originalHeight * scale));
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                        const dataUrl = canvas.toDataURL('image/jpeg', quality);
                        resolve(dataUrl);
                    } catch (err) { reject(err); }
                };
                image.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
    }

    async function compressSelectedDmPhotos(files) {
        const selected = Array.from(files || []).slice(0, 5);
        if (!selected.length) return [];
        let result = [];
        for (const file of selected) result.push(await compressOneDmPhoto(file, 520, 0.52));
        let totalLength = result.reduce((sum, url) => sum + url.length, 0);
        if (totalLength > 680000) {
            result = [];
            for (const file of selected) result.push(await compressOneDmPhoto(file, 400, 0.40));
        }
        return result;
    }

    function dmEscapeHTML(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[ch]));
    }

    function dmDeletedInfo(message) {
        const deletedName = message.deletedByName || message.deletedBy || message.fromName || message.fromUser || 'sender';
        return `<div style="font-size:12.5px;color:#cbd5e1;font-style:italic;padding:3px 0;">🚫 This message was deleted by <b>${dmEscapeHTML(deletedName)}</b></div>`;
    }

    function dmHiddenForMeKey(username) {
        const safeUser = String(username || 'guest').trim().toLowerCase();
        return 'nexus_dm_hidden_for_me_v1_' + encodeURIComponent(safeUser);
    }

    function dmGetHiddenForMe(username) {
        try {
            const raw = localStorage.getItem(dmHiddenForMeKey(username));
            const parsed = raw ? JSON.parse(raw) : [];
            return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
        } catch (error) {
            return new Set();
        }
    }

    function dmSaveHiddenForMe(username, messageId) {
        try {
            const hidden = dmGetHiddenForMe(username);
            hidden.add(String(messageId));
            const ids = Array.from(hidden).slice(-1500);
            localStorage.setItem(dmHiddenForMeKey(username), JSON.stringify(ids));
            return true;
        } catch (error) {
            return false;
        }
    }

    function dmMessageTimestamp(message) {
        if (!message) return 0;
        const candidates = [message.createdAt, message.timestamp, message.sentAt];
        for (let value of candidates) {
            if (value == null || value === '') continue;
            try {
                if (typeof value.toMillis === 'function') return value.toMillis();
                if (typeof value.toDate === 'function') value = value.toDate();
                else if (typeof value === 'object' && typeof value.seconds === 'number') value = value.seconds * 1000;
                if (value instanceof Date) return value.getTime();
                if (typeof value === 'string') {
                    const trimmed = value.trim();
                    if (/^\d+(?:\.\d+)?$/.test(trimmed)) value = Number(trimmed);
                    else value = Date.parse(trimmed);
                }
                if (typeof value === 'number' && Number.isFinite(value)) {
                    return Math.abs(value) > 0 && Math.abs(value) < 100000000000 ? value * 1000 : value;
                }
            } catch (error) {}
        }
        return 0;
    }

    function dmMessageDate(message) {
        const ms = dmMessageTimestamp(message);
        return ms ? new Date(ms) : null;
    }

    function dmDateGroupInfo(date) {
        if (!date || Number.isNaN(date.getTime())) return { key: '', label: '' };
        const y = date.getFullYear();
        const m = date.getMonth();
        const d = date.getDate();
        const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const now = new Date();
        const todayOrdinal = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
        const messageOrdinal = Date.UTC(y, m, d);
        const dayDiff = Math.round((todayOrdinal - messageOrdinal) / 86400000);

        let label;
        if (dayDiff === 0) label = 'Today';
        else if (dayDiff === 1) label = 'Yesterday';
        else if (dayDiff >= 2 && dayDiff <= 6) label = date.toLocaleDateString('en-US', { weekday: 'long' });
        else label = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

        return { key, label };
    }

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', syncWhatsAppViewport);
        window.visualViewport.addEventListener('scroll', syncWhatsAppViewport);
    }
    window.addEventListener('resize', syncWhatsAppViewport);

    window.addEventListener('popstate', () => {
        if (activeDmPartner) {
            NexusDM.closeDM(true);
            return;
        }
        const gModal = document.getElementById('nx-global-modal');
        if (gModal && gModal.style.display === 'flex') {
            gModal.style.display = 'none';
        }
    });

    const STICKER_BANK = [
        { c: "1f525", l: "Fire", g: "trending" }, { c: "1f680", l: "Rocket", g: "trending" },
        { c: "1f4af", l: "100%", g: "trending" }, { c: "26a1", l: "Bolt", g: "trending" },
        { c: "1f451", l: "King", g: "trending" }, { c: "1f3c6", l: "Trophy", g: "trending" },
        { c: "1f3af", l: "Target", g: "trending" }, { c: "1f48e", l: "Gem", g: "trending" },
        { c: "1f31f", l: "Star", g: "trending" }, { c: "1f4a5", l: "Boom", g: "trending" },
        { c: "1f4b8", l: "Money", g: "trending" }, { c: "1f514", l: "Bell", g: "trending" },
        { c: "2728", l: "Sparkle", g: "trending" }, { c: "1f308", l: "Rainbow", g: "trending" },
        { c: "1f602", l: "Joy", g: "funny" }, { c: "1f923", l: "ROFL", g: "funny" },
        { c: "1f62d", l: "Crying", g: "funny" }, { c: "1f921", l: "Clown", g: "funny" },
        { c: "1f480", l: "Skull", g: "funny" }, { c: "1f47b", l: "Ghost", g: "funny" },
        { c: "1f928", l: "Sus", g: "funny" }, { c: "1f644", l: "EyeRoll", g: "funny" },
        { c: "1f92a", l: "Crazy", g: "funny" }, { c: "1f61c", l: "Wink", g: "funny" },
        { c: "1f9e0", l: "Brain", g: "study" }, { c: "1f914", l: "Think", g: "study" },
        { c: "1f92f", l: "MindBlown", g: "study" }, { c: "1f913", l: "Topper", g: "study" },
        { c: "1f4a1", l: "Idea", g: "study" }, { c: "23f0", l: "Alarm", g: "study" },
        { c: "2764_fe0f", l: "Heart", g: "love" }, { c: "1f60d", l: "HeartEye", g: "love" },
        { c: "1f970", l: "InLove", g: "love" }, { c: "1f618", l: "Kiss", g: "love" },
        { c: "1f44d", l: "ThumbsUp", g: "hands" }, { c: "1f64f", l: "Namaste", g: "hands" },
        { c: "1f91d", l: "Deal", g: "hands" }, { c: "1f44f", l: "Clap", g: "hands" }
    ];

    function formatDmTextLinks(str) {
        let safe = String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return safe.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" onclick="event.stopPropagation();" style="color:#53bdeb; text-decoration:underline; font-weight:700;">$1</a>');
    }

    function copyTextSafe(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => Nexus.toast("📋 Message Copied!"));
        }
    }

    function getSavedPostIdsUnified() {
        let a = [], b = [];
        try { a = JSON.parse(localStorage.getItem('nx_saved_posts') || '[]'); } catch (e) {}
        try { b = JSON.parse(localStorage.getItem('nx_saved') || '[]'); } catch (e) {}
        return Array.from(new Set([...a, ...b]));
    }

    function isUserTrulyOnline(u) {
        if (!u) return false;
        let me = Nexus.getCurrentUser();
        if (me && u.username && u.username.toLowerCase() === me.username.toLowerCase()) return true;
        if (u.isOnlineNow === false) return false;
        return (Date.now() - (u.lastOnline || 0)) < 120000;
    }

    function formatLastSeen(u) {
        if (!u) return '🔒 Private Chat';
        if (isUserTrulyOnline(u)) return '🟢 Online Now';
        let ts = u.lastSeenAt || u.lastOnline || 0;
        if (!ts) return '🔒 Private';
        let diffSec = Math.max(1, Math.floor((Date.now() - ts) / 1000));
        if (diffSec < 60) return 'Last seen just now';
        let diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `Last seen ${diffMin}m ago`;
        let diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `Last seen ${diffHr}h ago`;
        return `Last seen ${Math.floor(diffHr / 24)}d ago`;
    }

    // Lightbox ONLY for DM photos (Does NOT hijack Home Feed double-tap to like!)
    function initImageZoomLightbox() {
        if (document.getElementById('nx-img-lightbox')) return;
        const lb = document.createElement('div');
        lb.id = 'nx-img-lightbox';
        lb.style.cssText = "display:none; position:fixed; inset:0; background:rgba(5,8,15,0.96); z-index:100010; flex-direction:column; align-items:center; justify-content:center; padding:16px;";
        lb.innerHTML = `
            <div style="position:absolute; top:16px; right:16px; display:flex; gap:10px; z-index:2;">
                <a id="nx-lightbox-dl" href="" download="Nexus_Study_Note.jpg" style="background:#00a884; color:#020617; text-decoration:none; padding:8px 14px; border-radius:20px; font-size:12px; font-weight:900; display:flex; align-items:center; gap:5px;">⬇️ Save Image</a>
                <button onclick="document.getElementById('nx-img-lightbox').style.display='none'" style="background:#1e293b; border:1px solid #334155; color:white; width:36px; height:36px; border-radius:50%; font-size:17px; cursor:pointer;">✕</button>
            </div>
            <img id="nx-lightbox-img" src="" style="max-width:96vw; max-height:82vh; object-fit:contain; border-radius:12px;">
        `;
        lb.addEventListener('click', e => {
            if (e.target === lb) lb.style.display = 'none';
        });
        document.body.appendChild(lb);
    }
    setTimeout(initImageZoomLightbox, 300);

    function ensureMessageActionSheet() {
        if (document.getElementById('nx-msg-action-modal')) return;
        const backdrop = document.createElement('div');
        backdrop.id = 'nx-msg-action-modal';
        backdrop.className = 'nx-msg-action-backdrop';
        backdrop.addEventListener('click', e => {
            if (e.target === backdrop) backdrop.style.display = 'none';
        });
        document.body.appendChild(backdrop);
    }
    ensureMessageActionSheet();

    function startGlobalDmInboxWatcher() {
        let me = Nexus.getCurrentUser();
        if (!me || !Nexus.db) {
            setTimeout(startGlobalDmInboxWatcher, 900);
            return;
        }
        if (dmInboxUnsub) dmInboxUnsub();

        dmInboxUnsub = Nexus.db.collection("nexus_private_dms")
            .where("toUser", "==", me.username)
            .limit(60)
            .onSnapshot(snap => {
                unreadCountsByUser = {};
                let totalUnread = 0;

                snap.forEach(doc => {
                    let m = doc.data();
                    if (!m || !m.fromUser) return;
                    let fromKey = m.fromUser.toLowerCase();
                    if (!lastMsgByUser[fromKey] || dmMessageTimestamp(m) > dmMessageTimestamp(lastMsgByUser[fromKey])) {
                        lastMsgByUser[fromKey] = m;
                    }
                    if (!m.seen && !m.deleted) {
                        unreadCountsByUser[fromKey] = (unreadCountsByUser[fromKey] || 0) + 1;
                        totalUnread++;
                    }
                });

                const bannerBadge = document.getElementById('nx-dm-banner-badge');
                if (bannerBadge) {
                    bannerBadge.innerText = totalUnread > 0 ? `🔴 ${totalUnread} New` : `Open →`;
                    bannerBadge.style.background = totalUnread > 0 ? '#ef4444' : '#00a884';
                    bannerBadge.style.color = totalUnread > 0 ? 'white' : '#020617';
                }
            });
    }
    setTimeout(startGlobalDmInboxWatcher, 600);

    function injectDmAndTestBanners() {
        const dir = document.getElementById('nx-chat-directory');
        if (!dir || document.getElementById('nx-dm-inbox-banner')) return;

        const wrap = document.createElement('div');
        wrap.id = 'nx-dm-inbox-banner';
        wrap.style.cssText = "display:flex; flex-direction:column; gap:10px; margin-bottom:12px;";
        wrap.innerHTML = `
            <div onclick="NexusDM.openInboxModal()" style="background:linear-gradient(135deg, rgba(0,168,132,0.2), rgba(37,99,235,0.2)); border:1.5px solid #00a884; border-radius:16px; padding:12px 14px; display:flex; align-items:center; justify-content:space-between; cursor:pointer;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="width:40px; height:40px; border-radius:12px; background:#00a884; color:#020617; display:flex; align-items:center; justify-content:center; font-size:19px; font-weight:900;">💬</div>
                    <div>
                        <div style="font-weight:800; font-size:14px; color:#f8fafc;">Nexus Official 1:1 Personal DM</div>
                        <div style="font-size:11.5px; color:#5eead4;">Private Calls 📞, Song Sync 🎵 &amp; Direct Chat</div>
                    </div>
                </div>
                <span id="nx-dm-banner-badge" style="background:#00a884; color:#020617; padding:5px 11px; border-radius:12px; font-size:11.5px; font-weight:800;">Open →</span>
            </div>
        `;
        dir.insertBefore(wrap, dir.firstChild);
    }
    setTimeout(injectDmAndTestBanners, 200);

    function getRoomKey(u1, u2) {
        return [u1.toLowerCase().trim(), u2.toLowerCase().trim()].sort().join('__');
    }

    function pingDmTyping(roomKey) {
        let me = Nexus.getCurrentUser();
        if (!me || !Nexus.db) return;
        Nexus.db.collection("nexus_accounts").doc(me.username).set({
            isOnlineNow: true,
            lastOnline: Date.now(),
            dmTypingRoom: roomKey || '',
            dmTypingAt: Date.now()
        }, { merge: true });
    }

    window.NexusDM = {
        openInboxModal: function() {
            this.closeDM(true);
            if (Nexus.rebuildAllUsersMasterList) Nexus.rebuildAllUsersMasterList();

            let me = Nexus.getCurrentUser();
            if (!me) {
                Nexus.toast("Please Login first!");
                Nexus.switchTab('tab-profile');
                return;
            }

            const modal = document.getElementById('nx-global-modal');
            let others = (Nexus.users || []).filter(u =>
                u && u.username &&
                u.username.toLowerCase() !== me.username.toLowerCase() &&
                u.username !== 'nexus_official'
            );

            others.sort((a, b) => {
                let ua = unreadCountsByUser[a.username.toLowerCase()] || 0;
                let ub = unreadCountsByUser[b.username.toLowerCase()] || 0;
                if (ua !== ub) return ub - ua;
                return (isUserTrulyOnline(b) ? 1 : 0) - (isUserTrulyOnline(a) ? 1 : 0);
            });

            let listHTML = others.length === 0
                ? `<div style="text-align:center; padding:24px; color:#64748b; font-size:13px;">No other members yet.</div>`
                : others.map(u => {
                    let uKey = u.username.toLowerCase();
                    let safeUname = u.username.replace(/'/g, "\\'");
                    let safeName = (u.name || u.username).replace(/'/g, "\\'");
                    let safeDp = (u.dp || '').replace(/'/g, "\\'");
                    let isOnline = isUserTrulyOnline(u);
                    let unread = unreadCountsByUser[uKey] || 0;
                    let lastM = lastMsgByUser[uKey];

                    let subText = lastM
                        ? (lastM.deleted ? '🚫 Message deleted' : (lastM.sticker ? '✨ Sticker' : (((lastM.imgUrls && lastM.imgUrls.length) || lastM.imgUrl) ? '📷 Photo' : lastM.text)))
                        : `@${u.username} • ${u.bio || 'JEE Aspirant'}`;

                    let av = (u.dp && u.dp.startsWith('data:image'))
                        ? `<img src="${u.dp}" style="width:44px; height:44px; border-radius:50%; object-fit:cover;">`
                        : `<div style="width:44px; height:44px; border-radius:50%; background:#00a884; color:#020617; display:flex; align-items:center; justify-content:center; font-weight:800;">${(u.name || 'U').charAt(0).toUpperCase()}</div>`;

                    return `
                        <div onclick="NexusDM.openDirectChat('${safeUname}', '${safeName}', '${safeDp}')" style="display:flex; align-items:center; justify-content:space-between; padding:10px 12px; background:#182229; border:1px solid #233138; border-radius:14px; cursor:pointer;">
                            <div style="display:flex; align-items:center; gap:10px; min-width:0; flex:1;">
                                ${av}
                                <div style="min-width:0; flex:1;">
                                    <div style="font-weight:700; font-size:14px; color:white;">${u.name} ${isOnline ? '🟢' : ''}</div>
                                    <div style="font-size:11.5px; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${subText}</div>
                                </div>
                            </div>
                            ${unread > 0 ? `<span class="nx-unread-pill">${unread}</span>` : `<span style="color:#00a884; font-size:12px; font-weight:800;">Chat →</span>`}
                        </div>
                    `;
                }).join('');

            modal.innerHTML = `
                <div class="nx-modal-box">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                        <h3 style="font-size:16px; color:#f8fafc;">💬 Nexus 1:1 Personal DM</h3>
                        <button onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:18px; cursor:pointer;">✕</button>
                    </div>
                    <div style="display:flex; flex-direction:column; gap:8px; max-height:68vh; overflow-y:auto;">${listHTML}</div>
                </div>
            `;
            modal.style.display = 'flex';
        },

        openDirectChat: function(partnerUsername, partnerName, partnerDp) {
            let me = Nexus.getCurrentUser();
            if (!me) {
                Nexus.switchTab('tab-profile');
                return;
            }

            const gModal = document.getElementById('nx-global-modal');
            if (gModal) gModal.style.display = 'none';

            savedScrollY = window.scrollY || 0;
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';

            try { history.pushState({ nxDmOpen: true }, ""); } catch (e) {}

            dmReplyingTo = null;
            dmEditingId = null;

            activeDmPartner = {
                username: partnerUsername,
                name: partnerName || partnerUsername
            };

            const root = ensureDmRootContainer();
            let partnerObj = (Nexus.users || []).find(u =>
                u && u.username && u.username.toLowerCase() === partnerUsername.toLowerCase()
            );

            let finalDp = partnerDp || (partnerObj && partnerObj.dp) || '';
            let isOnline = isUserTrulyOnline(partnerObj);
            let safePartnerUname = partnerUsername.replace(/'/g, "\\'");

            let avHTML = (finalDp && finalDp.startsWith('data:image'))
                ? `<img src="${finalDp}" style="width:38px; height:38px; border-radius:50%; object-fit:cover; flex-shrink:0;">`
                : `<div style="width:38px; height:38px; border-radius:50%; background:#00a884; color:#020617; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:15px; flex-shrink:0;">${(partnerName || 'U').charAt(0).toUpperCase()}</div>`;

            root.innerHTML = `
                <div style="height:56px; display:flex; align-items:center; justify-content:space-between; padding:0 12px; background:#202c33; border-bottom:1px solid #2a3942; flex-shrink:0; z-index:10;">
                    <div style="display:flex; align-items:center; gap:9px; min-width:0; flex:1;">
                        <button onclick="NexusDM.openInboxModal()" style="background:none; border:none; color:#e9edef; font-size:20px; cursor:pointer; padding:4px 6px; flex-shrink:0;">←</button>
                        <div onclick="NexusDM.closeDM(); Nexus.openPublicProfile('${safePartnerUname}')" style="display:flex; align-items:center; gap:9px; min-width:0; cursor:pointer; flex:1;">
                            ${avHTML}
                            <div style="min-width:0; flex:1;">
                                <div style="font-weight:700; font-size:15px; color:#e9edef; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${partnerName}</div>
                                <div id="nx-dm-partner-status" style="font-size:11.5px; color:${isOnline ? '#00a884' : '#8696a0'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                    ${formatLastSeen(partnerObj)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onclick="NexusDM.closeDM()" style="background:#2a3942; border:none; color:#e9edef; width:34px; height:34px; border-radius:50%; cursor:pointer; font-size:14px; flex-shrink:0;">✕</button>
                </div>

                <div id="nx-dm-msgs-box" style="flex:1 1 0%; min-height:0; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:8px; background:#0b141a; position:relative;"></div>

                <div id="nx-dm-typing-bar" style="display:none; padding:5px 14px; background:#111b21; font-size:11.5px; color:#00a884; font-weight:700; align-items:center; gap:6px; flex-shrink:0;">
                    <span>${partnerName} is typing</span>
                    <span><i class="nx-dm-dot"></i><i class="nx-dm-dot"></i><i class="nx-dm-dot"></i></span>
                </div>

                <div id="nx-dm-sticker-drawer" style="display:none; background:#111b21; border-top:1px solid #2a3942; padding:8px 10px; flex-shrink:0;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:7px;">
                        <input type="text" id="nx-stk-search-in" placeholder="🔍 Search Stickers..." autocomplete="off" style="flex:1; min-width:0; padding:7px 12px; border-radius:16px; border:1px solid #2a3942; background:#202c33; color:white; font-size:12px; outline:none;">
                        <button onclick="document.getElementById('nx-dm-sticker-drawer').style.display='none'" style="background:#202c33; border:none; color:#cbd5e1; width:28px; height:28px; border-radius:50%; cursor:pointer; flex-shrink:0;">✕</button>
                    </div>
                    <div style="display:flex; gap:6px; overflow-x:auto; scrollbar-width:none; margin-bottom:7px;">
                        <span class="nx-stk-chip active" onclick="NexusDM.filterStickersByCat('trending', this)">🔥 Trending</span>
                        <span class="nx-stk-chip" onclick="NexusDM.filterStickersByCat('funny', this)">😂 Funny</span>
                        <span class="nx-stk-chip" onclick="NexusDM.filterStickersByCat('love', this)">❤️ Love</span>
                        <span class="nx-stk-chip" onclick="NexusDM.filterStickersByCat('study', this)">📚 JEE/Study</span>
                        <span class="nx-stk-chip" onclick="NexusDM.filterStickersByCat('all', this)">🌟 All</span>
                    </div>
                    <div id="nx-cloud-stk-grid" style="display:grid; grid-template-columns:repeat(4, 1fr); gap:7px; height:175px; overflow-y:auto; padding:2px;"></div>
                </div>

                <div id="nx-dm-reply-bar" style="display:none; padding:7px 14px; background:#182229; border-left:4px solid #00a884; align-items:center; justify-content:space-between; font-size:12px; color:#e9edef; flex-shrink:0;">
                    <span id="nx-dm-reply-txt" style="white-space:pre-wrap; overflow:hidden; text-overflow:ellipsis; flex:1;">Replying...</span>
                    <button onclick="NexusDM.cancelReply()" style="background:none; border:none; color:#ef4444; font-weight:bold; cursor:pointer; margin-left:10px;">✕</button>
                </div>

                <div id="nx-dm-composer" style="width:100%; display:flex; align-items:center; gap:8px; padding:8px 10px; background:#111b21; border-top:1px solid #1e293b; flex:0 0 auto;">
                    <div style="flex:1; min-width:0; display:flex; align-items:center; background:#202c33; border-radius:24px; padding:3px 10px; gap:6px; overflow:hidden;">
                        <button type="button" onclick="NexusDM.toggleStickerDrawer()" style="background:none; border:none; font-size:20px; cursor:pointer; padding:2px; flex-shrink:0;">😊</button>
                        <textarea id="nx-dm-input" rows="1" placeholder="Message..." autocomplete="off" style="flex:1; width:100%; min-width:0; height:36px; min-height:36px; max-height:105px; box-sizing:border-box; padding:8px 2px; border:none; background:transparent; color:#e9edef; font-size:14.5px; line-height:20px; font-family:inherit; resize:none; overflow-y:hidden; outline:none;"></textarea>
                        <input type="file" id="nx-dm-file-in" accept="image/*" multiple style="display:none;">
                        <button type="button" onclick="document.getElementById('nx-dm-file-in').click()" style="background:none; border:none; font-size:18px; cursor:pointer; padding:2px; flex-shrink:0;">📷</button>
                        <button type="button" onclick="NexusDM.startVoiceDM()" style="background:none; border:none; font-size:17px; cursor:pointer; padding:2px; flex-shrink:0;">🎙️</button>
                    </div>
                    <button type="button" onclick="NexusDM.sendDM()" style="background:#00a884; color:#020617; border:none; width:42px; height:42px; border-radius:50%; font-size:18px; font-weight:900; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 2px 8px rgba(0,168,132,0.4);">➤</button>
                </div>
            `;

            root.style.display = 'flex';
            resizeDmComposer();
            syncWhatsAppViewport();

            const dmMessageBox = document.getElementById('nx-dm-msgs-box');
            if (dmMessageBox && !dmMessageBox.__nxDmMenuDelegationBound) {
                dmMessageBox.__nxDmMenuDelegationBound = true;
                dmMessageBox.addEventListener('click', event => {
                    const menuButton = event.target.closest('[data-nx-dm-menu]');
                    if (!menuButton || !dmMessageBox.contains(menuButton)) return;
                    event.preventDefault();
                    event.stopPropagation();
                    NexusDM.openMsgActionMenu(menuButton.getAttribute('data-nx-dm-menu'));
                });
            }

            const inp = document.getElementById('nx-dm-input');
            if (inp) {
                inp.addEventListener('focus', () => {
                    const dr = document.getElementById('nx-dm-sticker-drawer');
                    if (dr) dr.style.display = 'none';
                    [80, 180, 350, 600].forEach(delay => setTimeout(syncWhatsAppViewport, delay));
                });
                inp.addEventListener('keydown', e => {
                    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
                        e.preventDefault();
                        NexusDM.sendDM();
                    }
                });
                inp.addEventListener('input', () => {
                    resizeDmComposer();
                    let now = Date.now();
                    if (now - lastDmTypingPing > 2000) {
                        lastDmTypingPing = now;
                        pingDmTyping(getRoomKey(me.username, partnerUsername));
                    }
                });
            }

            const fileIn = document.getElementById('nx-dm-file-in');
            if (fileIn) {
                fileIn.addEventListener('change', async e => {
                    const selectedFiles = Array.from(e.target.files || []);
                    if (!selectedFiles.length) return;
                    try {
                        const imageUrls = await compressSelectedDmPhotos(selectedFiles.slice(0, 5));
                        await NexusDM.sendDM(imageUrls);
                    } catch (error) {
                        Nexus.toast('❌ Photos could not be prepared.');
                    } finally {
                        fileIn.value = '';
                    }
                });
            }

            this.listenToRoom(me.username, partnerUsername);
        },

        renderMessagesList: function(list, myUname) {
            const box = document.getElementById('nx-dm-msgs-box');
            if (!box) return;

            if (!Array.isArray(list) || list.length === 0) {
                const partnerName = activeDmPartner ? activeDmPartner.name : 'this member';
                patchLiveMessageDOM(box, `
                    <div data-render-key="empty-state" style="text-align:center; color:#8696a0; font-size:12px; margin:auto; padding:16px; background:#182229; border-radius:14px;">
                        🔒 Private 1-on-1 Chat with <b>${dmEscapeHTML(partnerName)}</b>.<br>
                        <button onclick="NexusDM.sendAnimatedSticker('https://fonts.gstatic.com/s/e/notoemoji/latest/1f44b/512.webp', 'Wave')" style="margin-top:10px; background:#00a884; color:#020617; border:none; padding:7px 14px; border-radius:16px; font-weight:800; font-size:12px; cursor:pointer;">👋 Tap to Wave Hi!</button>
                    </div>
                `);
                return;
            }

            const hiddenForMe = dmGetHiddenForMe(myUname);
            let previousDateKey = '';

            const renderedHTML = list.map(m => {
                const msgId = String(m.id || '');
                const dateInfo = dmDateGroupInfo(dmMessageDate(m));
                const dateDivider = dateInfo.label && dateInfo.key !== previousDateKey
                    ? `<div class="nx-dm-date-divider" data-render-key="date:${dateInfo.key}" data-date-key="${dateInfo.key}">${dateInfo.label}</div>`
                    : '';
                if (dateInfo.key) previousDateKey = dateInfo.key;

                const isMine = String(m.fromUser || '').toLowerCase() === String(myUname || '').toLowerCase();
                const isDeleted = !!m.deleted;
                const isHiddenForMe = !isDeleted && hiddenForMe.has(msgId);

                if (isHiddenForMe) {
                    return `${dateDivider}<div class="nx-dm-local-deleted" data-message-id="${dmEscapeHTML(msgId)}" data-render-key="message:${dmEscapeHTML(msgId)}">You deleted this message</div>`;
                }

                const formattedTxt = isDeleted ? '' : formatDmTextLinks(m.text || '');
                const likes = Array.isArray(m.likes) ? m.likes : [];
                const reactionEmoji = m.reaction || '❤️';
                const replyHTML = (!isDeleted && m.replyTo)
                    ? `<div style="background:rgba(0,0,0,0.28); border-left:3px solid #00a884; padding:4px 8px; border-radius:6px; font-size:11.5px; color:#cbd5e1; margin-bottom:4px;"><b>${dmEscapeHTML(m.replyTo.sender || '')}:</b> ${dmEscapeHTML(m.replyTo.text || '')}</div>`
                    : '';
                const tickHTML = isMine
                    ? `<span style="color:${m.seen ? '#53bdeb' : '#8696a0'}; font-weight:900; margin-left:3px; font-size:11px;">${m.seen ? '✓✓' : '✓'}</span>`
                    : '';
                const safeId = dmEscapeHTML(msgId);
                const reactionPeople = likes.map(name => '@' + String(name)).join(', ');
                const reactionBadge = likes.length > 0
                    ? `<span onclick="event.stopPropagation(); Nexus.toast('${dmEscapeHTML(reactionEmoji)} Reacted by: ${dmEscapeHTML(reactionPeople)}')" style="background:#182229; border:1px solid #2a3942; padding:1px 6px; border-radius:10px; font-size:11px; margin-right:5px; cursor:pointer;">${dmEscapeHTML(reactionEmoji)} ${likes.length}</span>`
                    : '';

                const menuButton = !isDeleted
                    ? `<button type="button" class="nx-dm-message-menu-btn" data-nx-dm-menu="${safeId}" aria-label="Message options" title="Message options" style="${isMine ? 'right:6px;' : 'left:6px;'}">⋯</button>`
                    : '';

                if (!isDeleted && m.sticker && m.sticker.url && !formattedTxt) {
                    return `${dateDivider}
                        <div class="nx-dm-bubble-anim" data-message-id="${safeId}" data-render-key="message:${safeId}" style="position:relative; width:100%; display:flex; flex-direction:column; align-items:${isMine ? 'flex-end' : 'flex-start'};">
                            <div onclick="NexusDM.openMsgActionMenu('${safeId}')" style="cursor:pointer; user-select:none; display:inline-flex; flex-direction:column; align-items:${isMine ? 'flex-end' : 'flex-start'}; padding-bottom:23px;">
                                ${replyHTML}
                                <img src="${dmEscapeHTML(m.sticker.url)}" loading="lazy" decoding="async" style="width:112px; height:112px; object-fit:contain; display:block;">
                                <div style="background:#182229; border:1px solid #233138; padding:2px 8px; border-radius:10px; font-size:10px; color:#cbd5e1; margin-top:2px; display:inline-flex; align-items:center; gap:3px;">
                                    ${reactionBadge}
                                    <span>${dmEscapeHTML(m.time || '')}</span>
                                    ${tickHTML}
                                </div>
                            </div>
                            ${menuButton}
                        </div>
                    `;
                }

                const messageImages = Array.isArray(m.imgUrls) && m.imgUrls.length
                    ? m.imgUrls.filter(url => typeof url === 'string' && (/^data:image\//i.test(url) || /^https?:\/\//i.test(url)))
                    : (typeof m.imgUrl === 'string' && m.imgUrl ? [m.imgUrl] : []);
                const imgHTML = (!isDeleted && messageImages.length)
                    ? `<div data-nx-dm-gallery="1" style="display:grid; grid-auto-flow:column; grid-auto-columns:180px; grid-template-rows:180px; gap:7px; width:min(100%, 260px); max-width:100%; overflow-x:auto; overflow-y:hidden; padding:4px 1px 8px; margin-bottom:4px;">${messageImages.map(url => `<img src="${url}" onclick="event.stopPropagation(); NexusDM.openPhotoPreview(this.src)" loading="lazy" style="display:block; width:180px; height:180px; object-fit:contain; border-radius:9px; background:#111b21; cursor:zoom-in;">`).join('')}</div>`
                    : '';

                const messageBodyHTML = isDeleted
                    ? dmDeletedInfo(m)
                    : `${replyHTML}
                        <div style="display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:8px; padding-right:25px;">
                            ${formattedTxt ? `<span style="padding-right:4px;">${formattedTxt}</span>` : '<span></span>'}
                            <span style="font-size:10.5px; color:rgba(233,237,239,0.72); white-space:nowrap; margin-left:auto; display:inline-flex; align-items:center;">
                                ${reactionBadge}
                                <span>${dmEscapeHTML(m.time || '')} ${m.edited ? '(edited)' : ''}</span>
                                ${tickHTML}
                            </span>
                        </div>`;

                return `${dateDivider}
                    <div class="nx-dm-bubble-anim" data-message-id="${safeId}" data-render-key="message:${safeId}" style="position:relative; width:100%; display:flex; flex-direction:column; align-items:${isMine ? 'flex-end' : 'flex-start'};">
                        ${imgHTML}
                        <div ${isDeleted ? '' : `onclick="NexusDM.openMsgActionMenu('${safeId}')"`} style="max-width:82%; min-width:95px; background:${isMine ? '#005c4b' : '#202c33'}; color:#e9edef; padding:7px 11px; padding-bottom:${isDeleted ? '7px' : '25px'}; border-radius:12px; border-${isMine ? 'top-right' : 'top-left'}-radius:2px; font-size:14.5px; line-height:1.38; word-break:break-word; cursor:${isDeleted ? 'default' : 'pointer'}; user-select:none; position:relative;">
                            ${messageBodyHTML}
                        </div>
                        ${menuButton}
                    </div>
                `;
            }).join('');

            patchLiveMessageDOM(box, renderedHTML);
        },

        openMsgActionMenu: function(msgId) {
            ensureMessageActionSheet();
            let me = Nexus.getCurrentUser();
            let m = dmMessagesCache.find(x => x.id === msgId);
            if (!m || !me || m.deleted) return;

            let isMine = String(m.fromUser || '').toLowerCase().trim() === String(me.username || '').toLowerCase().trim();
            const modal = document.getElementById('nx-msg-action-modal');
            const emojis = ['❤️', '😂', '🔥', '👍', '🙏', '💯'];

            modal.innerHTML = `
                <div class="nx-msg-action-sheet">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="font-size:11.5px; color:#8696a0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:240px;">
                            "${dmEscapeHTML(m.text || (m.sticker ? '✨ Sticker' : '📷 Photo'))}"
                        </span>
                        <button onclick="document.getElementById('nx-msg-action-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:16px; cursor:pointer;">✕</button>
                    </div>

                    <div class="nx-emoji-bar">
                        ${emojis.map(em => `<button type="button" class="nx-emoji-btn" onclick="NexusDM.reactToDM('${m.id}', '${em}')">${em}</button>`).join('')}
                    </div>

                    <button type="button" class="nx-menu-opt-btn" onclick="NexusDM.triggerMenuAction('reply', '${m.id}')">
                        <span>↩️</span> <span>Reply to Message</span>
                    </button>

                    ${m.text ? `
                        <button type="button" class="nx-menu-opt-btn" onclick="NexusDM.triggerMenuAction('copy', '${m.id}')">
                            <span>📋</span> <span>Copy Message Text</span>
                        </button>
                    ` : ''}

                    ${isMine && m.text ? `
                        <button type="button" class="nx-menu-opt-btn" style="color:#38bdf8;" onclick="NexusDM.triggerMenuAction('edit', '${m.id}')">
                            <span>✏️</span> <span>Edit Message</span>
                        </button>
                    ` : ''}

                    <button type="button" class="nx-menu-opt-btn" style="color:#cbd5e1;" onclick="NexusDM.triggerMenuAction('deleteForMe', '${m.id}')">
                        <span>🧹</span> <span>Delete for Me</span>
                    </button>

                    ${isMine ? `
                        <button type="button" class="nx-menu-opt-btn" style="color:#f87171; border-color:rgba(239,68,68,0.35);" onclick="NexusDM.triggerMenuAction('deleteForEveryone', '${m.id}')">
                            <span>🗑️</span> <span>Delete for Everyone</span>
                        </button>
                    ` : ''}

                    <button type="button" class="nx-menu-opt-btn" style="justify-content:center; background:transparent; border:none; color:#8696a0; margin-bottom:0;" onclick="document.getElementById('nx-msg-action-modal').style.display='none'">
                        Cancel
                    </button>
                </div>
            `;
            modal.style.display = 'flex';
        },

        triggerMenuAction: function(action, msgId) {
            document.getElementById('nx-msg-action-modal').style.display = 'none';
            let m = dmMessagesCache.find(x => x.id === msgId);
            if (!m) return;

            let sender = m.fromName || m.fromUser || 'User';
            let snippet = m.text || (m.sticker ? '✨ Sticker' : '📷 Photo');

            if (action === 'reply') this.startReply(sender, snippet);
            else if (action === 'copy') copyTextSafe(m.text || '');
            else if (action === 'edit') this.startEdit(m.id, m.text || '');
            else if (action === 'deleteForMe') this.deleteDMForMe(m.id);
            else if (action === 'deleteForEveryone') this.deleteDMForEveryone(m.id);
        },

        reactToDM: function(msgId, emoji) {
            document.getElementById('nx-msg-action-modal').style.display = 'none';
            let me = Nexus.getCurrentUser();
            if (!me || !Nexus.db) return;
            let m = dmMessagesCache.find(x => x.id === msgId);
            if (!m) return;

            let likes = Array.isArray(m.likes) ? [...m.likes] : [];
            if (likes.includes(me.username) && m.reaction === emoji) {
                likes = likes.filter(u => u !== me.username);
            } else if (!likes.includes(me.username)) {
                likes.push(me.username);
            }
            Nexus.db.collection("nexus_private_dms").doc(msgId).update({ likes: likes, reaction: emoji });
        },

        toggleStickerDrawer: function() {
            const d = document.getElementById('nx-dm-sticker-drawer');
            if (!d) return;
            if (d.style.display === 'none') {
                d.style.display = 'block';
                this.renderStickerGrid(currentStickerCat, '');
            } else {
                d.style.display = 'none';
            }
            setTimeout(syncWhatsAppViewport, 50);
        },

        filterStickersByCat: function(cat, chipEl) {
            currentStickerCat = cat;
            if (chipEl) {
                document.querySelectorAll('.nx-stk-chip').forEach(c => c.classList.remove('active'));
                chipEl.classList.add('active');
            }
            this.renderStickerGrid(cat, '');
        },

        renderStickerGrid: function(cat, query) {
            const grid = document.getElementById('nx-cloud-stk-grid');
            if (!grid) return;
            let q = (query || '').toLowerCase();
            let filtered = STICKER_BANK.filter(s => {
                if (q) return s.l.toLowerCase().includes(q) || s.g.toLowerCase().includes(q);
                return cat === 'all' || s.g === cat;
            });
            grid.innerHTML = filtered.map(s => {
                let webpUrl = `https://fonts.gstatic.com/s/e/notoemoji/latest/${s.c}/512.webp`;
                return `
                    <div class="nx-cloud-stk-card" onclick="NexusDM.sendAnimatedSticker('${webpUrl}', '${s.l}')">
                        <img src="${webpUrl}" loading="lazy" style="width:46px; height:46px; object-fit:contain;">
                        <span style="font-size:9px; color:#8696a0; margin-top:2px;">${s.l}</span>
                    </div>
                `;
            }).join('');
        },

        sendAnimatedSticker: function(stickerUrl, label) {
            const drawer = document.getElementById('nx-dm-sticker-drawer');
            if (drawer) drawer.style.display = 'none';
            this.sendDM('', { url: stickerUrl, label: label || 'Sticker' });
        },

        openPhotoPreview: function(src) {
            initImageZoomLightbox();
            const lb = document.getElementById('nx-img-lightbox');
            const img = document.getElementById('nx-lightbox-img');
            const dl = document.getElementById('nx-lightbox-dl');
            if (!lb || !img || !src) return;
            img.src = src;
            if (dl) dl.href = src;
            lb.style.display = 'flex';
        },

        startVoiceDM: function() {
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRec) return Nexus.toast("Voice mic not supported");
            const rec = new SpeechRec();
            rec.lang = 'en-IN';
            Nexus.toast("🎙️ Speak now...");
            rec.onresult = e => {
                const inp = document.getElementById('nx-dm-input');
                if (inp) {
                    inp.value = (inp.value + ' ' + e.results[0][0].transcript).trim();
                    resizeDmComposer();
                    inp.focus();
                }
            };
            rec.start();
        },

        startReply: function(senderName, snippet) {
            dmEditingId = null;
            dmReplyingTo = { sender: senderName, text: snippet.substring(0, 120) };
            const bar = document.getElementById('nx-dm-reply-bar');
            const txt = document.getElementById('nx-dm-reply-txt');
            if (bar && txt) {
                bar.style.display = 'flex';
                txt.innerText = `↩️ Replying to ${senderName}: "${dmReplyingTo.text}"`;
            }
            const inp = document.getElementById('nx-dm-input');
            if (inp) inp.focus();
        },

        startEdit: function(msgId, oldText) {
            dmReplyingTo = null;
            dmEditingId = msgId;
            const bar = document.getElementById('nx-dm-reply-bar');
            const txt = document.getElementById('nx-dm-reply-txt');
            const inp = document.getElementById('nx-dm-input');
            if (bar && txt && inp) {
                bar.style.display = 'flex';
                txt.innerText = `✏️ Editing message...`;
                inp.value = oldText;
                resizeDmComposer();
                inp.focus();
            }
        },

        cancelReply: function() {
            dmReplyingTo = null;
            dmEditingId = null;
            const bar = document.getElementById('nx-dm-reply-bar');
            if (bar) bar.style.display = 'none';
        },

        deleteDMForMe: function(msgId) {
            const me = Nexus.getCurrentUser();
            if (!me || !msgId) return;
            dmSaveHiddenForMe(me.username, msgId);
            this.renderMessagesList(dmMessagesCache, me.username);
            Nexus.toast('🧹 Deleted for you.');
        },

        // INSTANT DELETE FOR EVERYONE (No blocking window.confirm!)
        deleteDMForEveryone: async function(msgId) {
            const me = Nexus.getCurrentUser();
            if (!Nexus.db || !me || !msgId) return;

            const message = dmMessagesCache.find(item => item.id === msgId);
            if (!message || message.deleted) return;

            const isOriginalSender = String(message.fromUser || '').toLowerCase().trim() === String(me.username || '').toLowerCase().trim();
            if (!isOriginalSender) {
                Nexus.toast('🚫 You can delete only your own message for everyone.');
                return;
            }

            // Instant UI update
            message.deleted = true;
            message.deletedByName = me.name || me.username || 'sender';
            message.text = '';
            message.imgUrl = '';
            message.imgUrls = [];
            message.sticker = null;
            this.renderMessagesList(dmMessagesCache, me.username);
            Nexus.toast('🗑️ Message deleted for everyone!');

            try {
                await Nexus.db.collection('nexus_private_dms').doc(msgId).set({
                    deleted: true,
                    deletedAt: Date.now(),
                    deletedBy: me.username || '',
                    deletedByName: me.name || me.username || 'sender',
                    text: '',
                    imgUrl: '',
                    imgUrls: [],
                    sticker: null,
                    replyTo: null,
                    edited: false,
                    likes: [],
                    reaction: ''
                }, { merge: true });
            } catch (error) {
                console.error('NEXUS DM DELETE ERROR:', error);
            }
        },

        listenToRoom: function(myUname, partnerUname) {
            if (dmUnsubscribe) dmUnsubscribe();
            if (dmPartnerUnsub) dmPartnerUnsub();
            if (!Nexus.db) return;

            let roomKey = getRoomKey(myUname, partnerUname);

            dmPartnerUnsub = Nexus.db.collection("nexus_accounts").doc(partnerUname).onSnapshot(doc => {
                if (!doc.exists) return;
                let p = doc.data();
                let isTyping = p.dmTypingRoom === roomKey && p.dmTypingAt && (Date.now() - p.dmTypingAt < 4000);
                const tBar = document.getElementById('nx-dm-typing-bar');
                if (tBar) tBar.style.display = isTyping ? 'flex' : 'none';
                const statusEl = document.getElementById('nx-dm-partner-status');
                if (statusEl) {
                    let online = isUserTrulyOnline(p);
                    statusEl.style.color = online ? '#00a884' : '#8696a0';
                    statusEl.innerText = formatLastSeen(p);
                }
            });

            dmUnsubscribe = Nexus.db.collection("nexus_private_dms")
                .where("roomKey", "==", roomKey)
                .onSnapshot(snap => {
                    let list = [];
                    snap.forEach(d => {
                        let m = d.data() || {};
                        m.id = d.id;
                        list.push(m);
                        if (String(m.toUser || '').toLowerCase() === String(myUname || '').toLowerCase() && !m.seen && !m.deleted) {
                            Nexus.db.collection("nexus_private_dms").doc(m.id).update({ seen: true }).catch(() => {});
                        }
                    });

                    list.sort((a, b) => dmMessageTimestamp(a) - dmMessageTimestamp(b));
                    dmMessagesCache = list;
                    this.renderMessagesList(list, myUname);
                });
        },

        sendDM: async function(customImgData, customStickerObj) {
            let me = Nexus.getCurrentUser();
            const inp = document.getElementById('nx-dm-input');
            if (!me || !activeDmPartner || !Nexus.db) return;

            let text = inp ? inp.value.trim() : '';
            const imageUrls = Array.isArray(customImgData)
                ? customImgData.filter(url => typeof url === 'string' && url.startsWith('data:image/'))
                : (typeof customImgData === 'string' && customImgData.startsWith('data:image/') ? [customImgData] : []);
            if (!text && imageUrls.length === 0 && !customStickerObj) return;

            let roomKey = getRoomKey(me.username, activeDmPartner.username);
            const editingIdAtSend = dmEditingId;
            const replyAtSend = dmReplyingTo ? { ...dmReplyingTo } : null;

            try {
                pingDmTyping('');
                if (editingIdAtSend && text && imageUrls.length === 0 && !customStickerObj) {
                    await Nexus.db.collection('nexus_private_dms').doc(editingIdAtSend).update({
                        text: text,
                        edited: true
                    });
                    if (inp) { inp.value = ''; resizeDmComposer(); }
                    this.cancelReply();
                    return;
                }

                await Nexus.db.collection('nexus_private_dms').add({
                    roomKey: roomKey,
                    participants: [me.username.toLowerCase(), activeDmPartner.username.toLowerCase()],
                    fromUser: me.username,
                    fromName: me.name,
                    toUser: activeDmPartner.username,
                    text: customStickerObj ? '' : text,
                    imgUrl: imageUrls.length === 1 ? imageUrls[0] : '',
                    imgUrls: imageUrls.length > 1 ? imageUrls : [],
                    sticker: customStickerObj || null,
                    replyTo: replyAtSend,
                    likes: [],
                    seen: false,
                    edited: false,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    createdAt: Date.now()
                });

                if (inp && !customStickerObj) {
                    inp.value = '';
                    resizeDmComposer();
                }
                this.cancelReply();
            } catch (error) {
                Nexus.toast('❌ Message failed. Please retry.');
            }
        },

        closeDM: function() {
            if (dmDbRetryTimer) {
                clearTimeout(dmDbRetryTimer);
                dmDbRetryTimer = null;
            }
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            activeDmPartner = null;
            pingDmTyping('');
            if (dmUnsubscribe) { dmUnsubscribe(); dmUnsubscribe = null; }
            if (dmPartnerUnsub) { dmPartnerUnsub(); dmPartnerUnsub = null; }
            const root = document.getElementById('nx-dm-dedicated-root');
            if (root) root.style.display = 'none';
            window.scrollTo(0, savedScrollY);
        },

        closeDirectChat: function() {
            this.closeDM();
        }
    };
})();
