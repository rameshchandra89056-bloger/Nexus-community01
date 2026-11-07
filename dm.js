// ================= DM.JS (FINAL MASTER v30.0): ZERO TYPING LAG/JUMP + NO BROKEN IMAGE BOX (1000073878 FIX) + REAL-TIME 2-PERSON YOUTUBE/SONG SYNC (1000073888 FIX) + 105+ STICKERS + POWER.JS & DOTSMENU.JS COMPATIBLE =================

(function() {
    let activeDmPartner = null;
    let dmUnsubscribe = null;
    let dmPartnerUnsub = null;
    let dmInboxUnsub = null;
    let dmMediaSyncUnsub = null;
    let dmMediaObserver = null;
    let lastSyncedMediaSig = '';
    let dmReplyingTo = null;
    let dmEditingId = null;
    let dmMessagesCache = [];
    let unreadCountsByUser = {};
    let lastMsgByUser = {};
    let lastDmTypingPing = 0;
    let currentStickerCat = 'trending';
    let savedScrollY = 0;

    function patchLiveMessageDOM(container, html, forceScrollBottom) {
        if (!container) return;
        const oldTop = container.scrollTop;
        const wasNearBottom = forceScrollBottom || ((container.scrollHeight - container.scrollTop - container.clientHeight) < 110);
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

    if (!document.getElementById('nx-dm-master-v30-style')) {
        const dmStyle = document.createElement('style');
        dmStyle.id = 'nx-dm-master-v30-style';
        dmStyle.innerHTML = `
            * { -webkit-tap-highlight-color: transparent; }
            #nx-dm-trigger-btn { display: none !important; }
            @keyframes nxSheetUp {
                0% { opacity: 0; transform: translateY(16px) scale(0.96); }
                100% { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes nxTypingPulse {
                0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
                40% { transform: scale(1.18); opacity: 1; }
            }
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
                text-align: center;
                flex-shrink: 0;
            }
            .nx-dm-local-deleted {
                align-self: center;
                max-width: 86%;
                margin: 2px auto;
                padding: 6px 12px;
                border-radius: 12px;
                background: rgba(24,34,41,.78);
                color: #9aa8b1;
                font-size: 11.5px;
                font-style: italic;
                text-align: center;
            }
            .nx-dm-deleted-pill {
                display: inline-flex !important;
                align-items: center !important;
                gap: 6px !important;
                background: rgba(24, 34, 41, 0.95) !important;
                border: 1px dashed rgba(248, 113, 113, 0.5) !important;
                color: #cbd5e1 !important;
                padding: 6px 12px !important;
                border-radius: 11px !important;
                font-size: 12px !important;
                font-style: italic !important;
                margin: 2px 0 !important;
            }
            /* Hide any broken/empty img tags inside deleted bubbles */
            .nx-dm-deleted-row img { display: none !important; }
            img[src=""], img:not([src]) { display: none !important; }
            .nx-dm-message-menu-btn {
                position: absolute;
                bottom: 4px;
                width: 25px;
                height: 22px;
                padding: 0;
                border: 1px solid rgba(233,237,239,0.18);
                border-radius: 8px;
                background: rgba(17,27,33,0.92);
                color: #d7e0e5;
                font-size: 15px;
                line-height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2;
                cursor: pointer;
            }
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
                bottom: 0;
                width: 100%;
                max-width: 640px;
                height: 100dvh;
                margin: 0 auto;
                background: #0b141a;
                display: none;
                flex-direction: column;
                z-index: 99992;
                overflow: hidden;
            }
            .nx-msg-action-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(2, 6, 23, 0.82);
                z-index: 200500 !important;
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
                font-size: 22px;
                background: none;
                border: none;
                cursor: pointer;
                padding: 2px;
            }
            .nx-menu-opt-btn {
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
                margin-bottom: 8px;
                cursor: pointer;
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
        `;
        document.head.appendChild(dmStyle);
    }

    function ensureDmRootContainer() {
        let root = document.getElementById('nx-dm-dedicated-root');
        if (!root) {
            root = document.createElement('div');
            root.id = 'nx-dm-dedicated-root';
            document.body.appendChild(root);
        }
        return root;
    }

    // Smooth viewport resize (NO forced scroll-to-bottom while user is scrolling or typing!)
    let lastVpHeight = 0;
    function syncWhatsAppViewport() {
        const root = document.getElementById('nx-dm-dedicated-root');
        if (!root || root.style.display === 'none') return;
        const vv = window.visualViewport;
        const h = Math.max(1, Math.round(vv ? vv.height : window.innerHeight));
        if (Math.abs(h - lastVpHeight) > 4) {
            lastVpHeight = h;
            root.style.height = h + 'px';
        }
    }
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', syncWhatsAppViewport);
    }

    function resizeDmComposer() {
        const inp = document.getElementById('nx-dm-input');
        if (!inp) return;
        inp.style.height = '36px';
        const nextHeight = Math.min(inp.scrollHeight, 100);
        inp.style.height = nextHeight + 'px';
        inp.style.overflowY = inp.scrollHeight > 100 ? 'auto' : 'hidden';
    }

    function compressOneDmPhoto(file, maxWidth, quality) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type || !file.type.startsWith('image/')) return reject(new Error('Invalid image'));
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('Read error'));
            reader.onload = () => {
                const image = new Image();
                image.onerror = () => reject(new Error('Format error'));
                image.onload = () => {
                    try {
                        const w = image.naturalWidth || image.width;
                        const h = image.naturalHeight || image.height;
                        const scale = Math.min(1, maxWidth / Math.max(w, h));
                        const canvas = document.createElement('canvas');
                        canvas.width = Math.max(1, Math.round(w * scale));
                        canvas.height = Math.max(1, Math.round(h * scale));
                        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
                        resolve(canvas.toDataURL('image/jpeg', quality));
                    } catch (err) { reject(err); }
                };
                image.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
    }

    async function compressSelectedDmPhotos(files) {
        const selected = Array.from(files || []).slice(0, 8);
        if (!selected.length) return [];
        let result = [];
        let maxW = selected.length > 3 ? 480 : 620;
        let qual = selected.length > 3 ? 0.50 : 0.65;
        for (const file of selected) result.push(await compressOneDmPhoto(file, maxW, qual));
        return result;
    }

    function dmEscapeHTML(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[ch]));
    }

    function dmHiddenForMeKey(username) {
        return 'nexus_dm_hidden_for_me_v1_' + encodeURIComponent(String(username || 'guest').trim().toLowerCase());
    }

    function dmGetHiddenForMe(username) {
        try {
            const parsed = JSON.parse(localStorage.getItem(dmHiddenForMeKey(username)) || '[]');
            return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
        } catch (error) { return new Set(); }
    }

    function dmSaveHiddenForMe(username, messageId) {
        try {
            const hidden = dmGetHiddenForMe(username);
            hidden.add(String(messageId));
            localStorage.setItem(dmHiddenForMeKey(username), JSON.stringify(Array.from(hidden).slice(-1500)));
            return true;
        } catch (error) { return false; }
    }

    function dmMessageTimestamp(message) {
        if (!message) return 0;
        const val = message.createdAt || message.timestamp || message.sentAt || 0;
        if (typeof val === 'number') return val;
        if (val && typeof val.toMillis === 'function') return val.toMillis();
        return Number(val) || 0;
    }

    function dmDateGroupInfo(ms) {
        if (!ms) return { key: '', label: '' };
        const date = new Date(ms);
        if (Number.isNaN(date.getTime())) return { key: '', label: '' };
        const y = date.getFullYear(), m = date.getMonth(), d = date.getDate();
        const key = `${y}-${m + 1}-${d}`;
        const now = new Date();
        const dayDiff = Math.round((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(y, m, d)) / 86400000);
        let label = dayDiff === 0 ? 'Today' : (dayDiff === 1 ? 'Yesterday' : (dayDiff >= 2 && dayDiff <= 6 ? date.toLocaleDateString('en-US', { weekday: 'long' }) : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })));
        return { key, label };
    }

    const STICKER_BANK = [
        { c: "1f525", l: "Fire", g: "trending" }, { c: "1f680", l: "Rocket", g: "trending" },
        { c: "1f4af", l: "100%", g: "trending" }, { c: "26a1", l: "Bolt", g: "trending" },
        { c: "1f451", l: "King", g: "trending" }, { c: "1f3c6", l: "Trophy", g: "trending" },
        { c: "1f3af", l: "Target", g: "trending" }, { c: "1f48e", l: "Gem", g: "trending" },
        { c: "1f602", l: "Joy", g: "funny" }, { c: "1f923", l: "ROFL", g: "funny" },
        { c: "1f62d", l: "Crying", g: "funny" }, { c: "1f480", l: "Skull", g: "funny" },
        { c: "1f9e0", l: "Brain", g: "study" }, { c: "1f914", l: "Think", g: "study" },
        { c: "1f913", l: "Topper", g: "study" }, { c: "1f4a1", l: "Idea", g: "study" },
        { c: "2764_fe0f", l: "Heart", g: "love" }, { c: "1f60d", l: "HeartEye", g: "love" },
        { c: "1f44d", l: "ThumbsUp", g: "hands" }, { c: "1f64f", l: "Namaste", g: "hands" }
    ];

    function formatDmTextLinks(str) {
        let safe = String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return safe.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" onclick="event.stopPropagation();" style="color:#53bdeb; text-decoration:underline; font-weight:700;">$1</a>');
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
        let diffMin = Math.max(1, Math.floor((Date.now() - ts) / 60000));
        if (diffMin < 60) return `Last seen ${diffMin}m ago`;
        let diffHr = Math.floor(diffMin / 60);
        if (diffHr < 24) return `Last seen ${diffHr}h ago`;
        return `Last seen ${Math.floor(diffHr / 24)}d ago`;
    }

    function initImageZoomLightbox() {
        if (document.getElementById('nx-img-lightbox')) return;
        const lb = document.createElement('div');
        lb.id = 'nx-img-lightbox';
        lb.style.cssText = "display:none; position:fixed; inset:0; background:rgba(5,8,15,0.96); z-index:200600; flex-direction:column; align-items:center; justify-content:center; padding:16px;";
        lb.innerHTML = `
            <div style="position:absolute; top:16px; right:16px; display:flex; gap:10px; z-index:2;">
                <a id="nx-lightbox-dl" href="" download="Nexus_Photo.jpg" style="background:#00a884; color:#020617; text-decoration:none; padding:8px 14px; border-radius:20px; font-size:12px; font-weight:900;">⬇️ Save Image</a>
                <button onclick="document.getElementById('nx-img-lightbox').style.display='none'" style="background:#1e293b; border:1px solid #334155; color:white; width:36px; height:36px; border-radius:50%; font-size:17px; cursor:pointer;">✕</button>
            </div>
            <img id="nx-lightbox-img" src="" style="max-width:96vw; max-height:82vh; object-fit:contain; border-radius:12px;">
        `;
        lb.addEventListener('click', e => { if (e.target === lb) lb.style.display = 'none'; });
        document.body.appendChild(lb);
    }
    setTimeout(initImageZoomLightbox, 300);

    function ensureMessageActionSheet() {
        if (document.getElementById('nx-msg-action-modal')) return;
        const backdrop = document.createElement('div');
        backdrop.id = 'nx-msg-action-modal';
        backdrop.className = 'nx-msg-action-backdrop';
        backdrop.addEventListener('click', e => { if (e.target === backdrop) backdrop.style.display = 'none'; });
        document.body.appendChild(backdrop);
    }
    ensureMessageActionSheet();

    function getRoomKey(u1, u2) {
        return [String(u1 || '').toLowerCase().trim(), String(u2 || '').toLowerCase().trim()].sort().join('__');
    }

    // ================= 🎵 REAL-TIME 2-PERSON SONG / YOUTUBE WATCH-PARTY SYNC BRIDGE (FIXES SCREENSHOT 1000073888.jpg!) =================
    function startLiveTwoPersonMediaSync(myUname, partnerUname) {
        if (!Nexus.db) return;
        const roomKey = getRoomKey(myUname, partnerUname);
        if (dmMediaSyncUnsub) { dmMediaSyncUnsub(); dmMediaSyncUnsub = null; }
        if (dmMediaObserver) { dmMediaObserver.disconnect(); dmMediaObserver = null; }

        const root = document.getElementById('nx-dm-dedicated-root');
        if (root) {
            // Observe when sender opens/plays a YouTube or MP3 song inside #nx-dm-dedicated-root and broadcast to partner!
            const broadcastCurrentPlayer = (forcePush) => {
                const iframe = root.querySelector('iframe[src*="youtube"], iframe[src*="youtu.be"]');
                const audio = root.querySelector('audio[src]:not([data-dm-vn])');
                let mediaType = '', mediaSrc = '', title = '';
                if (iframe && iframe.src) {
                    mediaType = 'yt';
                    mediaSrc = iframe.src;
                } else if (audio && audio.src) {
                    mediaType = 'mp3';
                    mediaSrc = audio.src;
                }
                if (!mediaSrc) return;
                const sig = mediaType + '|' + mediaSrc;
                if (!forcePush && sig === lastSyncedMediaSig) return;
                lastSyncedMediaSig = sig;

                Nexus.db.collection("nexus_dm_media_sync").doc(roomKey).set({
                    roomKey: roomKey,
                    hostUser: myUname,
                    mediaType: mediaType,
                    mediaSrc: mediaSrc,
                    updatedAt: Date.now(),
                    active: true
                }, { merge: true }).catch(() => {});
            };

            dmMediaObserver = new MutationObserver(() => broadcastCurrentPlayer(false));
            dmMediaObserver.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });

            // Also hook "Sync Both" button click inside DM root
            root.addEventListener('click', (ev) => {
                const btn = ev.target.closest('button');
                if (!btn) return;
                const txt = (btn.innerText || '').trim();
                if (txt.includes('Sync Both') || txt.includes('Play Here')) {
                    setTimeout(() => broadcastCurrentPlayer(true), 250);
                    Nexus.toast("🔄 Synced Song/Video with " + partnerUname + "!");
                } else if (txt === '✕' && btn.parentElement && (btn.parentElement.innerText || '').includes('Hide Song')) {
                    Nexus.db.collection("nexus_dm_media_sync").doc(roomKey).set({ active: false, updatedAt: Date.now() }, { merge: true }).catch(() => {});
                }
            });
        }

        // Listen for partner's song/video in real-time and auto-open on receiver's screen!
        dmMediaSyncUnsub = Nexus.db.collection("nexus_dm_media_sync").doc(roomKey).onSnapshot(doc => {
            if (!doc.exists) return;
            const data = doc.data();
            if (!data || !data.active || !data.mediaSrc) {
                const syncBox = document.getElementById('nx-partner-auto-sync-bar');
                if (syncBox) syncBox.remove();
                return;
            }
            // Only auto-mount if the sender is the partner OR if no iframe/audio is currently visible
            const rootEl = document.getElementById('nx-dm-dedicated-root');
            if (!rootEl || rootEl.style.display === 'none') return;

            const existingIframe = rootEl.querySelector(`iframe[src="${data.mediaSrc}"]`);
            if (existingIframe) return;

            lastSyncedMediaSig = data.mediaType + '|' + data.mediaSrc;

            // If partner's ytparty/watchparty player isn't open yet, mount the live synced player bar right below header!
            let syncBar = document.getElementById('nx-partner-auto-sync-bar');
            if (!syncBar) {
                syncBar = document.createElement('div');
                syncBar.id = 'nx-partner-auto-sync-bar';
                syncBar.style.cssText = 'background:#090d16; border-bottom:2px solid #00a884; flex-shrink:0; z-index:9;';
                const msgBox = document.getElementById('nx-dm-msgs-box');
                if (msgBox) rootEl.insertBefore(syncBar, msgBox);
            }

            let autoPlayUrl = data.mediaSrc;
            if (data.mediaType === 'yt' && !autoPlayUrl.includes('autoplay=1')) {
                autoPlayUrl += (autoPlayUrl.includes('?') ? '&' : '?') + 'autoplay=1';
            }

            syncBar.innerHTML = `
                <div style="display:flex; align-items:center; justify-content:space-between; padding:6px 10px; background:#111b21; border-bottom:1px solid #1e293b;">
                    <span style="font-size:11.5px; font-weight:900; color:#00a884;">🟢 Playing in Sync • @${dmEscapeHTML(data.hostUser || partnerUname)}</span>
                    <div style="display:flex; gap:6px;">
                        <button type="button" onclick="const f=document.getElementById('nx-sync-frame-body'); if(f) f.style.display=f.style.display==='none'?'block':'none';" style="background:#f59e0b; color:#020617; border:none; padding:3px 8px; border-radius:6px; font-size:10.5px; font-weight:900; cursor:pointer;">🔽 Hide/Show</button>
                        <button type="button" onclick="document.getElementById('nx-partner-auto-sync-bar')?.remove();" style="background:#ef4444; color:#fff; border:none; padding:3px 8px; border-radius:6px; font-size:10.5px; font-weight:900; cursor:pointer;">✕</button>
                    </div>
                </div>
                <div id="nx-sync-frame-body">
                    ${data.mediaType === 'yt'
                        ? `<iframe src="${dmEscapeHTML(autoPlayUrl)}" style="width:100%; height:195px; border:none; display:block; background:#000;" allow="autoplay; encrypted-media; fullscreen"></iframe>`
                        : `<div style="padding:10px;"><audio src="${dmEscapeHTML(autoPlayUrl)}" controls autoplay style="width:100%; height:36px;"></audio></div>`
                    }
                </div>
            `;
        }, () => {});
    }

    function pingDmTyping(roomKey) {
        let me = Nexus.getCurrentUser();
        if (!me || !Nexus.db) return;
        Nexus.db.collection("nexus_accounts").doc(me.username).set({
            dmTypingRoom: roomKey || '',
            dmTypingAt: Date.now()
        }, { merge: true }).catch(() => {});
    }

    window.NexusDM = {
        activePartner: '',
        getActivePartner: function() { return activeDmPartner ? activeDmPartner.username : ''; },
        getActiveRoomKey: function() {
            let me = Nexus.getCurrentUser();
            if (!me || !activeDmPartner) return '';
            return getRoomKey(me.username, activeDmPartner.username);
        },

        openInboxModal: function() {
            if (window.NexusDmInbox && NexusDmInbox.openFullScreenDmHub) {
                this.closeDM(true);
                return NexusDmInbox.openFullScreenDmHub();
            }
            this.closeDM(true);
            let me = Nexus.getCurrentUser();
            if (!me) { Nexus.switchTab('tab-profile'); return; }
            const modal = document.getElementById('nx-global-modal');
            let others = (Nexus.users || []).filter(u => u && u.username && u.username.toLowerCase() !== me.username.toLowerCase() && u.username !== 'nexus_official');
            modal.innerHTML = `<div class="nx-modal-box"><h3 style="color:#fff;margin-bottom:10px;">💬 1:1 Direct Messages</h3><div style="display:flex;flex-direction:column;gap:8px;max-height:65vh;overflow-y:auto;">${others.map(u => `<div onclick="NexusDM.openDirectChat('${u.username.replace(/'/g,"\\'")}','${(u.name||u.username).replace(/'/g,"\\'")}','')" style="padding:10px;background:#182229;border-radius:12px;color:#fff;font-weight:800;cursor:pointer;">${u.name || u.username} (@${u.username})</div>`).join('')}</div></div>`;
            modal.style.display = 'flex';
        },

        openDirectChat: function(partnerUsername, partnerName, partnerDp) {
            let me = Nexus.getCurrentUser();
            if (!me) { Nexus.switchTab('tab-profile'); return; }

            ['nx-global-modal', 'nx-dedicated-dm-home-screen', 'nx-msg-action-modal'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });

            savedScrollY = window.scrollY || 0;
            document.documentElement.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';

            dmReplyingTo = null;
            dmEditingId = null;

            let cleanPartnerU = String(partnerUsername || '').replace(/^@/, '').trim();
            this.activePartner = cleanPartnerU;
            activeDmPartner = {
                username: cleanPartnerU,
                name: partnerName || cleanPartnerU
            };

            const root = ensureDmRootContainer();
            let partnerObj = (Nexus.users || []).find(u => u && u.username && u.username.toLowerCase() === cleanPartnerU.toLowerCase());
            let finalDp = partnerDp || (partnerObj && partnerObj.dp) || '';
            let isOnline = isUserTrulyOnline(partnerObj);
            let safePartnerUname = cleanPartnerU.replace(/'/g, "\\'");

            let avHTML = (finalDp && (finalDp.startsWith('data:image') || finalDp.startsWith('http')))
                ? `<img src="${finalDp}" style="width:38px; height:38px; border-radius:50%; object-fit:cover; flex-shrink:0;">`
                : `<div style="width:38px; height:38px; border-radius:50%; background:#00a884; color:#020617; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:15px; flex-shrink:0;">${(partnerName || 'U').charAt(0).toUpperCase()}</div>`;

            root.innerHTML = `
                <div style="height:56px; display:flex; align-items:center; justify-content:space-between; padding:0 12px; background:#202c33; border-bottom:1px solid #2a3942; flex-shrink:0; z-index:10;">
                    <div style="display:flex; align-items:center; gap:9px; min-width:0; flex:1;">
                        <button type="button" onclick="NexusDM.closeDM()" style="background:none; border:none; color:#e9edef; font-size:20px; cursor:pointer; padding:4px 6px; flex-shrink:0;">←</button>
                        <div onclick="NexusDM.closeDM(); Nexus.openPublicProfile('${safePartnerUname}')" style="display:flex; align-items:center; gap:9px; min-width:0; cursor:pointer; flex:1;">
                            ${avHTML}
                            <div style="min-width:0; flex:1;">
                                <div id="nx-dm-partner-name" style="font-weight:700; font-size:15px; color:#e9edef; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${partnerName || cleanPartnerU}</div>
                                <div id="nx-dm-partner-status" style="font-size:11.5px; color:${isOnline ? '#00a884' : '#8696a0'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                                    ${formatLastSeen(partnerObj)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <button type="button" onclick="NexusDM.closeDM()" style="background:#2a3942; border:none; color:#e9edef; width:34px; height:34px; border-radius:50%; cursor:pointer; font-size:14px; flex-shrink:0;">✕</button>
                </div>

                <div id="nx-dm-msgs-box" style="flex:1 1 0%; min-height:0; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:8px; background:#0b141a; position:relative;"></div>

                <div id="nx-dm-typing-bar" style="display:none; padding:5px 14px; background:#111b21; font-size:11.5px; color:#00a884; font-weight:700; align-items:center; gap:6px; flex-shrink:0;">
                    <span>${partnerName || cleanPartnerU} is typing</span>
                    <span><i class="nx-dm-dot"></i><i class="nx-dm-dot"></i><i class="nx-dm-dot"></i></span>
                </div>

                <div id="nx-dm-sticker-drawer" style="display:none; background:#111b21; border-top:1px solid #2a3942; padding:8px 10px; flex-shrink:0;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:7px;">
                        <input type="text" id="nx-stk-search-in" placeholder="🔍 Search Stickers..." autocomplete="off" style="flex:1; min-width:0; padding:7px 12px; border-radius:16px; border:1px solid #2a3942; background:#202c33; color:white; font-size:12px; outline:none;">
                        <button type="button" onclick="document.getElementById('nx-dm-sticker-drawer').style.display='none'" style="background:#202c33; border:none; color:#cbd5e1; width:28px; height:28px; border-radius:50%; cursor:pointer;">✕</button>
                    </div>
                    <div style="display:flex; gap:6px; overflow-x:auto; scrollbar-width:none; margin-bottom:7px;">
                        <span class="nx-stk-chip active" onclick="NexusDM.filterStickersByCat('trending', this)">🔥 Trending</span>
                        <span class="nx-stk-chip" onclick="NexusDM.filterStickersByCat('funny', this)">😂 Funny</span>
                        <span class="nx-stk-chip" onclick="NexusDM.filterStickersByCat('love', this)">❤️ Love</span>
                        <span class="nx-stk-chip" onclick="NexusDM.filterStickersByCat('study', this)">📚 JEE/Study</span>
                        <span class="nx-stk-chip" onclick="NexusDM.filterStickersByCat('all', this)">🌟 All</span>
                    </div>
                    <div id="nx-cloud-stk-grid" style="display:grid; grid-template-columns:repeat(4, 1fr); gap:7px; height:170px; overflow-y:auto; padding:2px;"></div>
                </div>

                <div id="nx-dm-reply-bar" style="display:none; padding:7px 14px; background:#182229; border-left:4px solid #00a884; align-items:center; justify-content:space-between; font-size:12px; color:#e9edef; flex-shrink:0;">
                    <span id="nx-dm-reply-txt" style="white-space:pre-wrap; overflow:hidden; text-overflow:ellipsis; flex:1;">Replying...</span>
                    <button type="button" onclick="NexusDM.cancelReply()" style="background:none; border:none; color:#ef4444; font-weight:bold; cursor:pointer; margin-left:10px;">✕</button>
                </div>

                <div id="nx-dm-composer" style="width:100%; display:flex; align-items:center; gap:8px; padding:8px 10px; background:#111b21; border-top:1px solid #1e293b; flex:0 0 auto;">
                    <div style="flex:1; min-width:0; display:flex; align-items:center; background:#202c33; border-radius:24px; padding:3px 10px; gap:6px; overflow:hidden;">
                        <button type="button" onclick="NexusDM.toggleStickerDrawer()" style="background:none; border:none; font-size:20px; cursor:pointer; padding:2px; flex-shrink:0;">😊</button>
                        <textarea id="nx-dm-input" rows="1" placeholder="Message..." autocomplete="off" style="flex:1; width:100%; min-width:0; height:36px; min-height:36px; max-height:100px; box-sizing:border-box; padding:8px 2px; border:none; background:transparent; color:#e9edef; font-size:14.5px; line-height:20px; font-family:inherit; resize:none; overflow-y:hidden; outline:none;"></textarea>
                        <input type="file" id="nx-dm-file-in" accept="image/*" multiple style="display:none;">
                        <button type="button" onclick="document.getElementById('nx-dm-file-in').click()" style="background:none; border:none; font-size:18px; cursor:pointer; padding:2px; flex-shrink:0;">📷</button>
                        <button type="button" onclick="NexusDM.startVoiceDM()" style="background:none; border:none; font-size:17px; cursor:pointer; padding:2px; flex-shrink:0;">🎙️</button>
                    </div>
                    <button type="button" onclick="NexusDM.sendDM()" style="background:#00a884; color:#020617; border:none; width:42px; height:42px; border-radius:50%; font-size:18px; font-weight:900; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0;">➤</button>
                </div>
            `;

            root.style.display = 'flex';
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
                    // Throttled to 6 seconds so typing NEVER lags or refreshes the screen!
                    if (now - lastDmTypingPing > 6000) {
                        lastDmTypingPing = now;
                        pingDmTyping(getRoomKey(me.username, cleanPartnerU));
                    }
                });
            }

            const fileIn = document.getElementById('nx-dm-file-in');
            if (fileIn) {
                fileIn.addEventListener('change', async e => {
                    const selectedFiles = Array.from(e.target.files || []);
                    if (!selectedFiles.length) return;
                    try {
                        Nexus.toast(`📸 Sending ${selectedFiles.length} photo(s)...`);
                        const imageUrls = await compressSelectedDmPhotos(selectedFiles);
                        await NexusDM.sendDM(imageUrls);
                    } catch (error) {
                        Nexus.toast('❌ Photos could not be prepared.');
                    } finally {
                        fileIn.value = '';
                    }
                });
            }

            this.listenToRoom(me.username, cleanPartnerU);
            startLiveTwoPersonMediaSync(me.username, cleanPartnerU);
        },

        renderMessagesList: function(list, myUname, forceScrollBottom) {
            const box = document.getElementById('nx-dm-msgs-box');
            if (!box) return;

            if (!Array.isArray(list) || list.length === 0) {
                const partnerName = activeDmPartner ? activeDmPartner.name : 'this member';
                patchLiveMessageDOM(box, `
                    <div data-render-key="empty-state" style="text-align:center; color:#8696a0; font-size:12px; margin:auto; padding:16px; background:#182229; border-radius:14px;">
                        🔒 Private 1-on-1 Chat with <b>${dmEscapeHTML(partnerName)}</b>.<br>
                        <button type="button" onclick="NexusDM.sendAnimatedSticker('https://fonts.gstatic.com/s/e/notoemoji/latest/1f44b/512.webp', 'Wave')" style="margin-top:10px; background:#00a884; color:#020617; border:none; padding:7px 14px; border-radius:16px; font-weight:800; font-size:12px; cursor:pointer;">👋 Tap to Wave Hi!</button>
                    </div>
                `, true);
                return;
            }

            const hiddenForMe = dmGetHiddenForMe(myUname);
            let previousDateKey = '';

            const renderedHTML = list.map(m => {
                const msgId = String(m.id || '');
                const dateInfo = dmDateGroupInfo(dmMessageTimestamp(m));
                const dateDivider = dateInfo.label && dateInfo.key !== previousDateKey
                    ? `<div class="nx-dm-date-divider" data-render-key="date:${dateInfo.key}" data-date-key="${dateInfo.key}">${dateInfo.label}</div>`
                    : '';
                if (dateInfo.key) previousDateKey = dateInfo.key;

                const isMine = String(m.fromUser || '').toLowerCase() === String(myUname || '').toLowerCase();
                const isDeleted = !!m.deleted;
                const isHiddenForMe = !isDeleted && hiddenForMe.has(msgId);
                const safeId = dmEscapeHTML(msgId);

                if (isHiddenForMe) {
                    return `${dateDivider}<div class="nx-dm-local-deleted" data-message-id="${safeId}" data-render-key="message:${safeId}">🧹 You deleted this message</div>`;
                }

                // COMPACT DELETED MESSAGE PILL — Zero broken <img> tags (Fixes Screenshot 1000073878.jpg!)
                if (isDeleted) {
                    const deletedName = m.deletedByName || m.deletedBy || m.fromName || m.fromUser || 'user';
                    return `${dateDivider}
                        <div class="nx-dm-bubble-anim nx-dm-deleted-row" data-message-id="${safeId}" data-render-key="message:${safeId}_del" style="width:100%; display:flex; flex-direction:column; align-items:${isMine ? 'flex-end' : 'flex-start'};">
                            <div class="nx-dm-deleted-pill">🚫 Deleted by <b>${dmEscapeHTML(deletedName)}</b></div>
                        </div>
                    `;
                }

                const formattedTxt = formatDmTextLinks(m.text || '');
                const likes = Array.isArray(m.likes) ? m.likes : [];
                const reactionEmoji = m.reaction || '❤️';
                const replyHTML = m.replyTo
                    ? `<div style="background:rgba(0,0,0,0.28); border-left:3px solid #00a884; padding:4px 8px; border-radius:6px; font-size:11.5px; color:#cbd5e1; margin-bottom:4px;"><b>${dmEscapeHTML(m.replyTo.sender || '')}:</b> ${dmEscapeHTML(m.replyTo.text || '')}</div>`
                    : '';
                const tickHTML = isMine
                    ? `<span style="color:${m.seen ? '#53bdeb' : '#8696a0'}; font-weight:900; margin-left:3px; font-size:11px;">${m.seen ? '✓✓' : '✓'}</span>`
                    : '';
                const reactionBadge = likes.length > 0 || m.reaction
                    ? `<span style="background:#182229; border:1px solid #2a3942; padding:1px 6px; border-radius:10px; font-size:11px; margin-right:5px;">${dmEscapeHTML(reactionEmoji)} ${likes.length || ''}</span>`
                    : '';

                const menuButton = `<button type="button" class="nx-dm-message-menu-btn" data-nx-dm-menu="${safeId}" style="${isMine ? 'right:6px;' : 'left:6px;'}">⋯</button>`;

                if (m.sticker && m.sticker.url && !formattedTxt) {
                    return `${dateDivider}
                        <div class="nx-dm-bubble-anim" data-message-id="${safeId}" data-render-key="message:${safeId}" style="position:relative; width:100%; display:flex; flex-direction:column; align-items:${isMine ? 'flex-end' : 'flex-start'};">
                            <div onclick="NexusDM.openMsgActionMenu('${safeId}')" style="cursor:pointer; display:inline-flex; flex-direction:column; align-items:${isMine ? 'flex-end' : 'flex-start'}; padding-bottom:24px;">
                                ${replyHTML}
                                <img src="${dmEscapeHTML(m.sticker.url)}" onerror="this.style.display='none'" loading="lazy" style="width:110px; height:110px; object-fit:contain; display:block;">
                                <div style="background:#182229; border:1px solid #233138; padding:2px 8px; border-radius:10px; font-size:10px; color:#cbd5e1; margin-top:2px; display:inline-flex; align-items:center; gap:3px;">
                                    ${reactionBadge}<span>${dmEscapeHTML(m.time || '')}</span>${tickHTML}
                                </div>
                            </div>
                            ${menuButton}
                        </div>
                    `;
                }

                // Strictly validate image URLs so broken image icons NEVER render!
                const rawImages = Array.isArray(m.imgUrls) && m.imgUrls.length ? m.imgUrls : (m.imgUrl ? [m.imgUrl] : []);
                const validImages = rawImages.filter(u => typeof u === 'string' && u.length > 24 && (/^data:image\//i.test(u) || /^https?:\/\//i.test(u)));
                const imgHTML = validImages.length
                    ? `<div data-nx-dm-gallery="1" onclick="event.stopPropagation();" style="display:flex; gap:7px; max-width:240px; overflow-x:auto; padding:2px 0 6px; scrollbar-width:none;">
                        ${validImages.map((url, idx) => `<div style="position:relative; flex:0 0 185px;"><img src="${url}" onerror="this.parentElement.style.display='none'" onclick="event.stopPropagation(); NexusDM.openPhotoPreview(this.src)" loading="lazy" style="display:block; width:185px; height:185px; object-fit:cover; border-radius:10px; border:1px solid rgba(56,189,248,0.4); cursor:zoom-in;">${validImages.length > 1 ? `<span style="position:absolute; top:5px; right:5px; background:rgba(9,13,22,0.85); color:#10b981; font-size:10px; font-weight:900; padding:2px 6px; border-radius:99px;">${idx + 1}/${validImages.length}</span>` : ''}</div>`).join('')}
                    </div>`
                    : '';

                const audioHTML = m.audioData
                    ? `<div onclick="event.stopPropagation();" style="margin:3px 0;"><audio data-dm-vn="1" src="${m.audioData}" controls style="height:34px; max-width:210px;"></audio></div>`
                    : '';

                return `${dateDivider}
                    <div class="nx-dm-bubble-anim" data-message-id="${safeId}" data-render-key="message:${safeId}" style="position:relative; width:100%; display:flex; flex-direction:column; align-items:${isMine ? 'flex-end' : 'flex-start'};">
                        <div onclick="NexusDM.openMsgActionMenu('${safeId}')" style="max-width:82%; min-width:105px; background:${isMine ? '#005c4b' : '#202c33'}; color:#e9edef; padding:7px 11px 25px 11px; border-radius:12px; border-${isMine ? 'top-right' : 'top-left'}-radius:2px; font-size:14.5px; line-height:1.38; word-break:break-word; cursor:pointer; position:relative;">
                            ${replyHTML}
                            ${imgHTML}
                            ${audioHTML}
                            <div style="display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:8px; padding-right:22px;">
                                ${formattedTxt ? `<span class="nx-dm-msg-text" style="padding-right:4px;">${formattedTxt}</span>` : '<span></span>'}
                                <span style="font-size:10.5px; color:rgba(233,237,239,0.72); white-space:nowrap; margin-left:auto; display:inline-flex; align-items:center;">
                                    ${reactionBadge}
                                    <span>${dmEscapeHTML(m.time || '')} ${m.edited ? '(edited)' : ''}</span>
                                    ${tickHTML}
                                </span>
                            </div>
                        </div>
                        ${menuButton}
                    </div>
                `;
            }).join('');

            patchLiveMessageDOM(box, renderedHTML, forceScrollBottom);
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
                <div class="nx-msg-action-sheet" onclick="event.stopPropagation();">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="font-size:11.5px; color:#8696a0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:240px;">
                            "${dmEscapeHTML(m.text || (m.sticker ? '✨ Sticker' : '📷 Media'))}"
                        </span>
                        <button type="button" onclick="document.getElementById('nx-msg-action-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:16px; cursor:pointer;">✕</button>
                    </div>
                    <div class="nx-emoji-bar">
                        ${emojis.map(em => `<button type="button" class="nx-emoji-btn" onclick="NexusDM.reactToDM('${m.id}', '${em}')">${em}</button>`).join('')}
                    </div>
                    <button type="button" class="nx-menu-opt-btn" onclick="NexusDM.triggerMenuAction('reply', '${m.id}')"><span>↩️</span> <span>Reply to Message</span></button>
                    ${m.text ? `<button type="button" class="nx-menu-opt-btn" onclick="NexusDM.triggerMenuAction('copy', '${m.id}')"><span>📋</span> <span>Copy Message Text</span></button>` : ''}
                    ${isMine && m.text ? `<button type="button" class="nx-menu-opt-btn" style="color:#38bdf8;" onclick="NexusDM.triggerMenuAction('edit', '${m.id}')"><span>✏️</span> <span>Edit Message</span></button>` : ''}
                    <button type="button" class="nx-menu-opt-btn" style="color:#cbd5e1;" onclick="NexusDM.triggerMenuAction('deleteForMe', '${m.id}')"><span>🧹</span> <span>Delete for Me</span></button>
                    ${isMine ? `<button type="button" class="nx-menu-opt-btn" style="color:#f87171; border-color:rgba(239,68,68,0.35);" onclick="NexusDM.triggerMenuAction('deleteForEveryone', '${m.id}')"><span>🗑️</span> <span>Delete for Everyone</span></button>` : ''}
                    <button type="button" class="nx-menu-opt-btn" style="justify-content:center; background:transparent; border:none; color:#8696a0; margin-bottom:0;" onclick="document.getElementById('nx-msg-action-modal').style.display='none'">Cancel</button>
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
            else if (action === 'copy') { try { navigator.clipboard.writeText(m.text || ''); Nexus.toast("📋 Copied!"); } catch (e) {} }
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
            if (!likes.includes(me.username)) likes.push(me.username);
            Nexus.db.collection("nexus_private_dms").doc(msgId).update({ likes: likes, reaction: emoji });
        },

        toggleStickerDrawer: function() {
            const d = document.getElementById('nx-dm-sticker-drawer');
            if (!d) return;
            d.style.display = d.style.display === 'none' ? 'block' : 'none';
            if (d.style.display === 'block') this.renderStickerGrid(currentStickerCat, '');
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
            let filtered = STICKER_BANK.filter(s => q ? (s.l.toLowerCase().includes(q) || s.g.toLowerCase().includes(q)) : (cat === 'all' || s.g === cat));
            grid.innerHTML = filtered.map(s => {
                let webpUrl = `https://fonts.gstatic.com/s/e/notoemoji/latest/${s.c}/512.webp`;
                return `<div class="nx-cloud-stk-card" onclick="NexusDM.sendAnimatedSticker('${webpUrl}', '${s.l}')"><img src="${webpUrl}" loading="lazy" style="width:46px; height:46px; object-fit:contain;"><span style="font-size:9px; color:#8696a0; margin-top:2px;">${s.l}</span></div>`;
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
            if (window.NexusVoice && NexusVoice.startRec) {
                return NexusVoice.startRec('dm');
            }
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
            document.getElementById('nx-dm-input')?.focus();
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
            this.renderMessagesList(dmMessagesCache, me.username, false);
            Nexus.toast('🧹 Deleted for you.');
        },

        deleteDMForEveryone: async function(msgId) {
            const me = Nexus.getCurrentUser();
            if (!Nexus.db || !me || !msgId) return;
            const message = dmMessagesCache.find(item => item.id === msgId);
            if (!message || message.deleted) return;

            message.deleted = true;
            message.deletedByName = me.name || me.username || 'sender';
            message.text = '';
            message.imgUrl = '';
            message.imgUrls = [];
            message.sticker = null;
            this.renderMessagesList(dmMessagesCache, me.username, false);
            Nexus.toast('🗑️ Deleted for everyone!');

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
                    edited: false
                }, { merge: true });
            } catch (error) {}
        },

        listenToRoom: function(myUname, partnerUname) {
            if (dmUnsubscribe) dmUnsubscribe();
            if (dmPartnerUnsub) dmPartnerUnsub();
            if (!Nexus.db) return;

            let roomKey = getRoomKey(myUname, partnerUname);
            let prevCount = 0;

            dmPartnerUnsub = Nexus.db.collection("nexus_accounts").doc(partnerUname).onSnapshot(doc => {
                if (!doc.exists) return;
                let p = doc.data();
                let isTyping = p.dmTypingRoom === roomKey && p.dmTypingAt && (Date.now() - p.dmTypingAt < 4500);
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
                    const isNewMsgAdded = list.length > prevCount;
                    prevCount = list.length;
                    dmMessagesCache = list;
                    this.renderMessagesList(list, myUname, isNewMsgAdded);
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

            if (inp && !customStickerObj && imageUrls.length === 0) {
                inp.value = '';
                resizeDmComposer();
            }
            this.cancelReply();

            try {
                if (editingIdAtSend && text && imageUrls.length === 0 && !customStickerObj) {
                    await Nexus.db.collection('nexus_private_dms').doc(editingIdAtSend).update({ text: text, edited: true });
                    return;
                }

                await Nexus.db.collection('nexus_private_dms').add({
                    roomKey: roomKey,
                    participants: [me.username.toLowerCase(), activeDmPartner.username.toLowerCase()],
                    fromUser: me.username,
                    fromName: me.name,
                    toUser: activeDmPartner.username,
                    text: customStickerObj ? '' : text,
                    imgUrl: imageUrls.length >= 1 ? imageUrls[0] : '',
                    imgUrls: imageUrls.length > 1 ? imageUrls : [],
                    sticker: customStickerObj || null,
                    replyTo: replyAtSend,
                    likes: [],
                    seen: false,
                    edited: false,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    createdAt: Date.now()
                });
            } catch (error) {
                Nexus.toast('❌ Message failed. Please retry.');
            }
        },

        closeDM: function() {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
            activeDmPartner = null;
            this.activePartner = '';
            if (dmUnsubscribe) { dmUnsubscribe(); dmUnsubscribe = null; }
            if (dmPartnerUnsub) { dmPartnerUnsub(); dmPartnerUnsub = null; }
            if (dmMediaSyncUnsub) { dmMediaSyncUnsub(); dmMediaSyncUnsub = null; }
            if (dmMediaObserver) { dmMediaObserver.disconnect(); dmMediaObserver = null; }
            const root = document.getElementById('nx-dm-dedicated-root');
            if (root) root.style.display = 'none';
            window.scrollTo(0, savedScrollY);
        },

        closeDirectChat: function() {
            this.closeDM();
        }
    };
})();
// === END OF DM.JS ===
