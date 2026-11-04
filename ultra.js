// ================= ULTRA.JS: 👥 REAL MULTI-ID FOLLOW SYNC + 🟢 RECENTLY OFFLINE STORIES SORT & TIME BADGE + ↩️ CLICK-REPLY TO SCROLL & HIGHLIGHT + 🛡️ ANTI-MISCLICK SWIPE + 📝 STUDY VIBE -> CHALLENGERS LIVE + ➕ ALL 12 TRAY FEATURES =================

(function() {
    const COLLAB_SITE_URL = 'https://challengers-live.netlify.app';

    const ultraStyle = document.createElement('style');
    ultraStyle.innerHTML = `
        /* Highlight animation when jumping to a replied original message */
        @keyframes nxJumpHighlight {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.9); background-color: rgba(16, 185, 129, 0.38) !important; transform: scale(1.03); }
            50% { box-shadow: 0 0 22px 6px rgba(56, 189, 248, 0.75); background-color: rgba(56, 189, 248, 0.32) !important; transform: scale(1.02); }
            100% { box-shadow: none; transform: scale(1); }
        }
        .nx-msg-jump-flash {
            animation: nxJumpHighlight 1.8s ease-out !important;
            border: 1.5px solid #10b981 !important;
        }
        /* Story Circle Last-Seen Time Pill */
        .nx-story-time-pill {
            position: absolute;
            bottom: 18px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(9, 13, 22, 0.92);
            border: 1px solid #334155;
            color: #94a3b8;
            font-size: 8.5px;
            font-weight: 800;
            padding: 1px 5px;
            border-radius: 8px;
            white-space: nowrap;
            z-index: 20;
            pointer-events: none;
        }
        .nx-story-time-pill.live {
            background: #064e3b;
            border-color: #10b981;
            color: #5eead4;
        }
        /* Compact 4-Column + Tray for all 12 Features */
        #nx-dm-bottom-tray, #nx-grp-bottom-tray {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 7px !important;
            padding: 10px !important;
            max-height: 220px !important;
            overflow-y: auto !important;
            background: #111b21 !important;
            border-top: 1.5px solid #00a884 !important;
        }
        #nx-dm-bottom-tray button, #nx-grp-bottom-tray button {
            padding: 7px 4px !important;
            border-radius: 11px !important;
        }
        #nx-dm-bottom-tray button span:first-child, #nx-grp-bottom-tray button span:first-child {
            font-size: 18px !important;
        }
        #nx-dm-bottom-tray button span:last-child, #nx-grp-bottom-tray button span:last-child {
            font-size: 10px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-width: 100% !important;
        }
    `;
    document.head.appendChild(ultraStyle);

    function cleanListUnique(arr) {
        if (!Array.isArray(arr)) return [];
        let seen = new Set();
        let res = [];
        arr.forEach(x => {
            let s = String(x || '').trim().toLowerCase();
            if (s && !seen.has(s)) {
                seen.add(s);
                res.push(s);
            }
        });
        return res;
    }

    function formatShortLastSeenBadge(u) {
        if (!u) return '';
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        if (me && u.username && u.username.toLowerCase() === me.username.toLowerCase()) {
            return { text: '🟢 Live', isLive: true };
        }
        let ts = u.lastOnline || u.lastSeenAt || 0;
        let diffMs = Date.now() - ts;
        if (u.isOnlineNow !== false && ts > 0 && diffMs < 120000) {
            return { text: '🟢 Live', isLive: true };
        }
        if (!ts) return { text: 'Offline', isLive: false };
        let sec = Math.max(1, Math.floor(diffMs / 1000));
        if (sec < 60) return { text: 'Just now', isLive: false };
        let min = Math.floor(sec / 60);
        if (min < 60) return { text: `${min}m ago`, isLive: false };
        let hr = Math.floor(min / 60);
        if (hr < 24) return { text: `${hr}h ago`, isLive: false };
        return { text: `${Math.floor(hr / 24)}d ago`, isLive: false };
    }

    // =========================================================================
    // 1. 👥 100% REAL CLOUD FOLLOW / UNFOLLOW SYNC (Works Across 2-3 IDs on Same Device!)
    // =========================================================================
    function installRealCloudFollowEngine() {
        if (!window.Nexus || Nexus.__nxRealCloudFollowInstalled) return;
        Nexus.__nxRealCloudFollowInstalled = true;

        Nexus.toggleFollow = async function(targetUsername) {
            let me = Nexus.getCurrentUser();
            if (!me) {
                const gm = document.getElementById('nx-global-modal');
                if (gm) gm.style.display = 'none';
                Nexus.switchTab('tab-profile');
                return;
            }
            if (!Nexus.db || !targetUsername) return;

            let myKey = me.username.toLowerCase().trim();
            let targetKey = targetUsername.toLowerCase().trim();
            if (myKey === targetKey) {
                Nexus.toast("⚠️ Aap khud ki ID ko follow nahi kar sakte!");
                return;
            }

            try {
                // Fetch BOTH accounts fresh from Firestore so multi-ID switching never uses stale cache!
                const [myDoc, targetDoc] = await Promise.all([
                    Nexus.db.collection("nexus_accounts").doc(myKey).get(),
                    Nexus.db.collection("nexus_accounts").doc(targetKey).get()
                ]);

                let myData = myDoc.exists ? myDoc.data() : Object.assign({}, me);
                let targetData = targetDoc.exists ? targetDoc.data() : ((Nexus.users || []).find(u => u.username && u.username.toLowerCase() === targetKey) || { username: targetKey, name: targetUsername });

                let myFollowing = cleanListUnique(myData.followingList);
                let targetFollowers = cleanListUnique(targetData.followersList);

                let isCurrentlyFollowing = targetFollowers.includes(myKey) || myFollowing.includes(targetKey);

                if (isCurrentlyFollowing) {
                    targetFollowers = targetFollowers.filter(u => u !== myKey);
                    myFollowing = myFollowing.filter(u => u !== targetKey);
                    Nexus.toast(`Unfollowed @${targetKey}`);
                } else {
                    if (!targetFollowers.includes(myKey)) targetFollowers.push(myKey);
                    if (!myFollowing.includes(targetKey)) myFollowing.push(targetKey);
                    Nexus.toast(`✅ Following @${targetKey}!`);
                    if (Nexus.pushRealNotification) {
                        Nexus.pushRealNotification(targetKey, 'follow', 'started following you 👋', '');
                    }
                }

                // Update Firestore immediately for both accounts
                await Promise.all([
                    Nexus.db.collection("nexus_accounts").doc(targetKey).set({
                        username: targetData.username || targetKey,
                        name: targetData.name || targetUsername,
                        followersList: targetFollowers
                    }, { merge: true }),
                    Nexus.db.collection("nexus_accounts").doc(myKey).set({
                        username: me.username,
                        name: me.name,
                        followingList: myFollowing,
                        lastOnline: Date.now()
                    }, { merge: true })
                ]);

                // Sync local memory + cloudAccounts + multi-account vault
                me.followingList = myFollowing;
                localStorage.setItem('nx_active_account', JSON.stringify(me));

                (Nexus.cloudAccounts || []).forEach(acc => {
                    if (!acc || !acc.username) return;
                    let k = acc.username.toLowerCase().trim();
                    if (k === myKey) acc.followingList = myFollowing;
                    if (k === targetKey) acc.followersList = targetFollowers;
                });

                (Nexus.users || []).forEach(acc => {
                    if (!acc || !acc.username) return;
                    let k = acc.username.toLowerCase().trim();
                    if (k === myKey) acc.followingList = myFollowing;
                    if (k === targetKey) acc.followersList = targetFollowers;
                });

                if (Nexus.rebuildAllUsersMasterList) Nexus.rebuildAllUsersMasterList();
                if (Nexus.notifyAll) Nexus.notifyAll();
                Nexus.openPublicProfile(targetKey);
            } catch (err) {
                console.error(err);
                Nexus.toast("⚠️ Network slow, retrying follow sync...");
            }
        };
    }

    // =========================================================================
    // 2. 🟢 STORIES BAR: KEEP RECENTLY OFFLINE USERS AT FRONT + SHOW TIME BADGE!
    // =========================================================================
    function upgradeStoriesOrderAndLastSeenBadges() {
        const sBar = document.getElementById('nx-stories-bar');
        if (!sBar) return;

        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let myKey = me && me.username ? me.username.toLowerCase().trim() : '';

        let userMap = {};
        (Nexus.users || []).forEach(u => {
            if (u && u.username) userMap[u.username.toLowerCase().trim()] = u;
        });

        let cards = Array.from(sBar.querySelectorAll('div[onclick*="Nexus.openPublicProfile"]'));
        if (cards.length === 0) return;

        // Sort user story circles by: 1. Me -> 2. Currently Live -> 3. Most Recently Offline (lastOnline timestamp)!
        cards.sort((cardA, cardB) => {
            let mA = (cardA.getAttribute('onclick') || '').match(/'([^']+)'/);
            let mB = (cardB.getAttribute('onclick') || '').match(/'([^']+)'/);
            let kA = mA && mA[1] ? mA[1].toLowerCase().trim() : '';
            let kB = mB && mB[1] ? mB[1].toLowerCase().trim() : '';

            if (kA === myKey) return -1;
            if (kB === myKey) return 1;

            let uA = userMap[kA] || {};
            let uB = userMap[kB] || {};
            let tsA = uA.lastOnline || uA.lastSeenAt || 0;
            let tsB = uB.lastOnline || uB.lastSeenAt || 0;

            let liveA = (uA.isOnlineNow !== false && (Date.now() - tsA < 120000)) ? 1 : 0;
            let liveB = (uB.isOnlineNow !== false && (Date.now() - tsB < 120000)) ? 1 : 0;
            if (liveA !== liveB) return liveB - liveA;

            // Recently offline user stays at the front!
            if (tsB !== tsA) return tsB - tsA;
            return kA.localeCompare(kB);
        });

        cards.forEach(card => {
            sBar.appendChild(card);
            let m = (card.getAttribute('onclick') || '').match(/'([^']+)'/);
            let k = m && m[1] ? m[1].toLowerCase().trim() : '';
            let uObj = userMap[k];
            if (!uObj) return;

            let badgeInfo = formatShortLastSeenBadge(uObj);
            let pill = card.querySelector('.nx-story-time-pill');
            if (!pill) {
                pill = document.createElement('span');
                pill.className = 'nx-story-time-pill';
                card.appendChild(pill);
            }
            pill.className = 'nx-story-time-pill' + (badgeInfo.isLive ? ' live' : '');
            pill.innerText = badgeInfo.text;
        });

        // Also show exact offline time inside Public Profile Modal if open!
        const gModal = document.getElementById('nx-global-modal');
        if (gModal && gModal.style.display === 'flex') {
            gModal.querySelectorAll('div').forEach(d => {
                if (d.children.length === 0 && d.innerText && d.innerText.includes('• Offline')) {
                    let unameMatch = d.innerText.match(/@([a-zA-Z0-9_]+)/);
                    if (unameMatch && unameMatch[1]) {
                        let u = userMap[unameMatch[1].toLowerCase()];
                        if (u) {
                            let b = formatShortLastSeenBadge(u);
                            d.innerText = `@${u.username} • ${b.isLive ? '🟢 Live Now' : '⏱️ Active ' + b.text}`;
                        }
                    }
                }
            });
        }
    }

    // =========================================================================
    // 3. 💬 CLICK ON REPLIED MESSAGE QUOTE BOX -> SCROLL TO & HIGHLIGHT ORIGINAL MESSAGE!
    // =========================================================================
    function makeRepliedQuotesClickableToScroll() {
        ['nx-room-messages', 'nx-dm-msgs-box'].forEach(boxId => {
            const box = document.getElementById(boxId);
            if (!box) return;

            box.querySelectorAll('div[style*="border-left:3px solid #00a884"], div[style*="border-left: 3px solid rgb(0, 168, 132)"]').forEach(quoteEl => {
                if (quoteEl.getAttribute('data-jump-bound')) return;
                quoteEl.setAttribute('data-jump-bound', '1');
                quoteEl.style.cursor = 'pointer';
                quoteEl.title = 'Tap to jump to original message';

                quoteEl.onclick = (e) => {
                    e.stopPropagation();
                    e.preventDefault();

                    let rawQuote = (quoteEl.innerText || '').trim();
                    let colonIdx = rawQuote.indexOf(':');
                    let snippet = colonIdx !== -1 ? rawQuote.substring(colonIdx + 1).trim() : rawQuote;
                    let cleanSearch = snippet.substring(0, 22).toLowerCase().trim();
                    if (!cleanSearch) return;

                    let allBubbles = Array.from(box.querySelectorAll('div[onclick*="openCommunityMsgMenu"], div[onclick*="openMsgActionMenu"]'));
                    let currentBubble = quoteEl.closest('div[onclick*="openCommunityMsgMenu"], div[onclick*="openMsgActionMenu"]');

                    let foundBubble = allBubbles.find(b => {
                        if (b === currentBubble) return false;
                        // Check message body excluding its own reply quote
                        let clone = b.cloneNode(true);
                        let innerQuote = clone.querySelector('div[data-jump-bound]');
                        if (innerQuote) innerQuote.remove();
                        return (clone.innerText || '').toLowerCase().includes(cleanSearch);
                    });

                    if (foundBubble) {
                        // Make sure row is visible if hidden by windowed loader
                        if (foundBubble.parentElement && foundBubble.parentElement.style.display === 'none') {
                            foundBubble.parentElement.style.display = 'flex';
                        }
                        foundBubble.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        foundBubble.classList.remove('nx-msg-jump-flash');
                        void foundBubble.offsetWidth;
                        foundBubble.classList.add('nx-msg-jump-flash');
                        Nexus.toast("⬆️ Jumped to original message!");
                    } else {
                        Nexus.toast("ℹ️ Original message is older or deleted");
                    }
                };
            });
        });
    }

    // =========================================================================
    // 4. 🛡️ STOP ACCIDENTAL REPLY ON SLIGHT TAP / SCROLL!
    // =========================================================================
    function fixHairTriggerReplyBug() {
        let lastIntentionalSwipeTime = 0;

        ['nx-dm-msgs-box', 'nx-room-messages'].forEach(boxId => {
            const box = document.getElementById(boxId);
            if (!box || box.__nxUltraSwipeGuard) return;
            box.__nxUltraSwipeGuard = true;

            let sx = 0, sy = 0, dx = 0, isIntentionalHorizontal = false;
            let activeEl = null;
            const isGroup = (boxId === 'nx-room-messages');

            box.addEventListener('touchstart', e => {
                if (!e.touches || e.touches.length !== 1) return;
                sx = e.touches[0].clientX;
                sy = e.touches[0].clientY;
                dx = 0;
                isIntentionalHorizontal = false;
                activeEl = e.target.closest('[onclick*="openMsgActionMenu"], [onclick*="openCommunityMsgMenu"]');
                // Stop power.js's 420ms holdTimer from auto-clicking or triggering reply!
                e.stopImmediatePropagation();
            }, { capture: true, passive: true });

            box.addEventListener('touchmove', e => {
                e.stopImmediatePropagation();
                if (!activeEl || !e.touches || e.touches.length !== 1) return;
                let curX = e.touches[0].clientX - sx;
                let curY = Math.abs(e.touches[0].clientY - sy);

                if (curY > 12 && !isIntentionalHorizontal) {
                    activeEl.style.transform = '';
                    activeEl = null;
                    return;
                }

                // Require at least 38px purely horizontal drag before moving bubble
                if (Math.abs(curX) > 38 && Math.abs(curX) > curY * 3) {
                    isIntentionalHorizontal = true;
                    dx = Math.max(-75, Math.min(75, curX));
                    activeEl.style.transition = 'none';
                    activeEl.style.transform = `translateX(${dx}px)`;
                }
            }, { capture: true, passive: true });

            const endTouch = (e) => {
                e.stopImmediatePropagation();
                const ind1 = document.getElementById('nx-swipe-indicator');
                const ind2 = document.getElementById('nx-grp-swipe-badge');
                if (ind1) ind1.style.display = 'none';
                if (ind2) ind2.style.display = 'none';

                if (!activeEl) return;
                const b = activeEl;
                activeEl = null;
                b.style.transition = 'transform 0.2s ease';
                b.style.transform = '';

                // Only trigger reply if dragged a full 72px+ horizontally!
                if (isIntentionalHorizontal && Math.abs(dx) >= 72) {
                    lastIntentionalSwipeTime = Date.now();
                    if (navigator.vibrate) { try { navigator.vibrate(18); } catch (err) {} }
                    let rawOnclick = b.getAttribute('onclick') || '';
                    let match = rawOnclick.match(/'([^']+)'/);
                    if (match && match[1]) {
                        if (isGroup && window.NexusChat) {
                            const sSpan = b.querySelector('span[onclick*="openPublicProfile"]');
                            let sName = sSpan ? sSpan.innerText.trim() : 'Member';
                            let clone = b.cloneNode(true);
                            if (clone.querySelector('div')) clone.querySelector('div').remove();
                            NexusChat.startReply(sName, (clone.innerText || 'Message').replace(/\n/g, ' ').trim().substring(0, 40));
                            Nexus.toast("↩️ Replying to " + sName);
                        } else if (!isGroup && window.NexusPower) {
                            NexusPower.execDmAction('reply', match[1]);
                            Nexus.toast("↩️ Replying to message");
                        }
                    }
                }
                dx = 0;
                isIntentionalHorizontal = false;
            };

            box.addEventListener('touchend', endTouch, { capture: true, passive: true });
            box.addEventListener('touchcancel', endTouch, { capture: true, passive: true });
        });
    }

    // =========================================================================
    // 5. 📝 REPLACE "🌧️ STUDY VIBE (3 MODES)" WITH CHALLENGERS LIVE COLLABORATION!
    // Fixes 1000070872.jpg & makes https://challengers-live.netlify.app 100% scrollable!
    // =========================================================================
    function replaceStudyVibeWithChallengersCollab() {
        const musicBtn = document.getElementById('nx-music-btn');
        if (musicBtn) {
            musicBtn.style.background = 'linear-gradient(135deg, #0f172a, #1e1b4b)';
            musicBtn.style.border = '1.5px solid #38bdf8';
            musicBtn.style.color = '#38bdf8';
            musicBtn.innerHTML = `<span>📝</span> <span id="nx-music-label" style="font-weight:900;">Live Test Series</span>`;
            musicBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                NexusUltra.openSmoothCollabBrowser();
            };
        }

        // Remove any duplicate 3rd Test Series button if pro.js added one
        const dirGrid = musicBtn ? musicBtn.parentNode : null;
        if (dirGrid && dirGrid.children.length > 2) {
            dirGrid.style.gridTemplateColumns = '1fr 1fr';
            Array.from(dirGrid.children).slice(2).forEach(el => el.remove());
        }
    }

    // =========================================================================
    // 6. ➕ FORCE ALL 12 FEATURES INTO 1:1 DM & GROUP CHAT (+) TRAYS!
    // Fixes 1000070856.jpg & 1000070849.jpg so NO feature is ever left behind!
    // =========================================================================
    function enforceAllTwelveFeaturesInTrays() {
        const dmTray = document.getElementById('nx-dm-bottom-tray');
        if (dmTray && dmTray.children.length !== 12) {
            dmTray.innerHTML = `
                <button type="button" onclick="NexusPower.toggleBottomTray(false); document.getElementById('nx-dm-file-in').click();" style="background:#202c33; border:1px solid #2a3942; color:#f8fafc; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>📷</span><span style="font-weight:800;">Photo</span></button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); NexusPower.toggleViewOnceMode();" style="background:#202c33; border:1px dashed #00a884; color:#5eead4; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>①</span><span style="font-weight:800;">View-Once</span></button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); document.getElementById('nx-dm-doc-file-in').click();" style="background:#202c33; border:1px solid #2a3942; color:#38bdf8; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>📂</span><span style="font-weight:800;">PDF/File</span></button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); NexusPower.openSongSearchModal();" style="background:#202c33; border:1px solid #2a3942; color:#f472b6; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>🎵</span><span style="font-weight:800;">Full Song</span></button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); NexusAdvance.openInAppYouTubeTV(true);" style="background:#202c33; border:1px solid #ef4444; color:#ef4444; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>▶️</span><span style="font-weight:800;">Watch TV</span></button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); NexusAdvance.openLiveGameModal(true, 1);" style="background:#202c33; border:1px solid #38bdf8; color:#38bdf8; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>🎮</span><span style="font-weight:800;">2P Game</span></button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); NexusPro.openAiSolverModal(true);" style="background:#202c33; border:1px solid #a78bfa; color:#a78bfa; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>🤖</span><span style="font-weight:800;">Ask AI</span></button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); NexusPro.openQuizBattleModal(true);" style="background:#202c33; border:1px solid #fbbf24; color:#fbbf24; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>⚡</span><span style="font-weight:800;">30s Quiz</span></button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); NexusSuperChat.openLiveSketchpadModal(true);" style="background:#202c33; border:1px solid #34d399; color:#34d399; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>🎨</span><span style="font-weight:800;">Sketch</span></button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); NexusAdvance.sendPasswordLockedPrompt(true);" style="background:#202c33; border:1px solid #fde047; color:#fde047; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>🔑</span><span style="font-weight:800;">Pass-Lock</span></button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); NexusPro.openStatusCardMakerModal();" style="background:#202c33; border:1px solid #f472b6; color:#f472b6; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>📸</span><span style="font-weight:800;">Status Card</span></button>
                <button type="button" onclick="NexusPower.toggleBottomTray(false); NexusPro.openDmCodeModal();" style="background:#202c33; border:1px solid #5eead4; color:#5eead4; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>💻</span><span style="font-weight:800;">Send Code</span></button>
            `;
        }

        const grpTray = document.getElementById('nx-grp-bottom-tray');
        if (grpTray && grpTray.children.length !== 12) {
            grpTray.innerHTML = `
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); document.getElementById('nx-chat-photo-in').click();" style="background:#202c33; border:1px solid #2a3942; color:#f8fafc; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>📷</span><span style="font-weight:800;">Photo</span></button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); document.getElementById('nx-grp-doc-file-in').click();" style="background:#202c33; border:1px solid #2a3942; color:#38bdf8; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>📂</span><span style="font-weight:800;">PDF/File</span></button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); NexusSuperChat.openGroupSongModal();" style="background:#202c33; border:1px solid #2a3942; color:#f472b6; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>🎵</span><span style="font-weight:800;">Group DJ</span></button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); NexusAdvance.openInAppYouTubeTV(false);" style="background:#202c33; border:1px solid #ef4444; color:#ef4444; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>▶️</span><span style="font-weight:800;">Watch TV</span></button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); NexusAdvance.openLiveGameModal(false, 1);" style="background:#202c33; border:1px solid #38bdf8; color:#38bdf8; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>🎮</span><span style="font-weight:800;">2P Game</span></button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); NexusPro.openAiSolverModal(false);" style="background:#202c33; border:1px solid #a78bfa; color:#a78bfa; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>🤖</span><span style="font-weight:800;">Ask AI</span></button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); NexusPro.openQuizBattleModal(false);" style="background:#202c33; border:1px solid #fbbf24; color:#fbbf24; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>⚡</span><span style="font-weight:800;">30s Quiz</span></button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); NexusSuperChat.openGroupPollModal();" style="background:#202c33; border:1px solid #34d399; color:#34d399; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>📊</span><span style="font-weight:800;">Live Poll</span></button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); NexusSuperChat.openLiveSketchpadModal(false);" style="background:#202c33; border:1px solid #34d399; color:#34d399; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>🎨</span><span style="font-weight:800;">Sketch</span></button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); NexusSuperChat.openWhisperComposerModal();" style="background:#202c33; border:1px dashed #10b981; color:#5eead4; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>🔐</span><span style="font-weight:800;">Whisper</span></button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); NexusPro.openStatusCardMakerModal();" style="background:#202c33; border:1px solid #f472b6; color:#f472b6; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>📸</span><span style="font-weight:800;">Status Card</span></button>
                <button type="button" onclick="NexusSuperChat.toggleGroupTray(false); NexusSuperChat.openCodeSnippetModal();" style="background:#202c33; border:1px solid #5eead4; color:#5eead4; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;"><span>💻</span><span style="font-weight:800;">Send Code</span></button>
            `;
        }
    }

    // =========================================================================
    // 7. PUBLIC API FOR ULTRA.JS (Smooth Scrollable Collaboration Browser)
    // =========================================================================
    let collabZoomScale = 1;

    window.NexusUltra = {
        openSmoothCollabBrowser: function() {
            let targetUrl = localStorage.getItem('nx_partner_test_url') || COLLAB_SITE_URL;
            let portal = document.getElementById('nx-ultra-collab-modal');
            if (!portal) {
                portal = document.createElement('div');
                portal.id = 'nx-ultra-collab-modal';
                portal.style.cssText = "position:fixed; inset:0; width:100vw; height:100dvh; background:#090d16; z-index:100099; display:flex; flex-direction:column; overflow:hidden;";
                document.body.appendChild(portal);
            }

            collabZoomScale = 1;

            portal.innerHTML = `
                <div style="height:52px; background:#0f172a; border-bottom:1.5px solid #38bdf8; display:flex; align-items:center; justify-content:space-between; padding:0 10px; flex-shrink:0; gap:6px; z-index:5;">
                    <button type="button" onclick="document.getElementById('nx-ultra-collab-modal').style.display='none'" style="background:#1e293b; border:1px solid #334155; color:#f8fafc; padding:6px 12px; border-radius:10px; font-size:12px; font-weight:900; cursor:pointer;">← Back to Nexus</button>
                    <span style="font-size:12.5px; font-weight:900; color:#38bdf8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">📝 Challengers Live Test Series</span>
                    <div style="display:flex; align-items:center; gap:5px;">
                        <button type="button" onclick="NexusUltra.scrollCollabPage(-260)" style="background:#1e293b; border:1px solid #334155; color:#5eead4; padding:5px 8px; border-radius:8px; font-size:11px; font-weight:900; cursor:pointer;">⬆️</button>
                        <button type="button" onclick="NexusUltra.scrollCollabPage(260)" style="background:#1e293b; border:1px solid #334155; color:#5eead4; padding:5px 8px; border-radius:8px; font-size:11px; font-weight:900; cursor:pointer;">⬇️</button>
                        <button type="button" onclick="NexusUltra.toggleCollabFit()" style="background:#1e293b; border:1px solid #38bdf8; color:#38bdf8; padding:5px 8px; border-radius:8px; font-size:10.5px; font-weight:800; cursor:pointer;">📱/💻</button>
                    </div>
                </div>
                <div id="nx-ultra-collab-scroller" style="flex:1; width:100%; height:calc(100dvh - 52px); overflow-y:scroll; overflow-x:auto; -webkit-overflow-scrolling:touch; position:relative; background:#090d16;">
                    <iframe id="nx-ultra-collab-frame" src="${targetUrl}" scrolling="yes" style="width:100%; height:1450px; border:none; display:block; background:#090d16; transform-origin:top left;" allow="fullscreen; clipboard-write; microphone; camera"></iframe>
                </div>
            `;
            portal.style.display = 'flex';
        },

        scrollCollabPage: function(deltaY) {
            const scroller = document.getElementById('nx-ultra-collab-scroller');
            if (scroller) {
                scroller.scrollBy({ top: deltaY, behavior: 'smooth' });
            }
        },

        toggleCollabFit: function() {
            const frame = document.getElementById('nx-ultra-collab-frame');
            if (!frame) return;
            if (collabZoomScale === 1) {
                collabZoomScale = 0.82;
                frame.style.width = '122%';
                frame.style.height = '1800px';
                frame.style.transform = 'scale(0.82)';
                Nexus.toast("🔍 Compact Full-Page Fit Enabled!");
            } else {
                collabZoomScale = 1;
                frame.style.width = '100%';
                frame.style.height = '1450px';
                frame.style.transform = 'scale(1)';
                Nexus.toast("📱 Standard 100% View Enabled!");
            }
        }
    };

    if (window.NexusAdvance) {
        NexusAdvance.openPartnerTestPortal = function() {
            NexusUltra.openSmoothCollabBrowser();
        };
    }

    function runUltraMasterLoop() {
        installRealCloudFollowEngine();
        upgradeStoriesOrderAndLastSeenBadges();
        makeRepliedQuotesClickableToScroll();
        fixHairTriggerReplyBug();
        replaceStudyVibeWithChallengersCollab();
        enforceAllTwelveFeaturesInTrays();
        if (window.NexusAdvance) {
            NexusAdvance.openPartnerTestPortal = NexusUltra.openSmoothCollabBrowser;
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        runUltraMasterLoop();
        setInterval(runUltraMasterLoop, 500);
    });
    setTimeout(runUltraMasterLoop, 150);
})();
