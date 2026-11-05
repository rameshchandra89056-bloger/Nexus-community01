// ================= DOTSMENU.JS (DEDICATED ⋮ 3-DOTS MENU MODULE FOR 1:1 DM & GROUP CHAT): ⚙️ PUTS ALL ADVANCED FEATURES (📹 VIDEO ROOM, 🖥️ LIVE SCREEN SHARE, 📞 VOICE CALL, 🎵 FULL HINDI SONG DJ, ▶️ YOUTUBE WATCH-PARTY, 🎙️ VOICE NOTE, 📊 POLL & 🧹 CLEAR CHAT) INSIDE BOTH ⋮ 3-DOTS MENUS! =================

(function() {
    const dotsStyle = document.createElement('style');
    dotsStyle.innerHTML = `
        .nx-pro-dots-btn {
            width: 100%; padding: 11px 13px; background: #161f33; border: 1px solid #26334d;
            border-radius: 13px; color: #f8fafc; font-size: 13px; font-weight: 800;
            display: flex; align-items: center; gap: 11px; cursor: pointer;
            transition: transform 0.15s ease, background 0.2s ease; text-align: left;
        }
        .nx-pro-dots-btn:active {
            transform: scale(0.96); background: #1e293b;
        }
        .nx-pro-dots-icon {
            width: 32px; height: 32px; border-radius: 9px; display: inline-flex;
            align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0;
        }
    `;
    document.head.appendChild(dotsStyle);

    // =========================================================================
    // 1. OPEN UNIFIED 1:1 DM ⋮ (3-DOTS) PRO MENU
    // =========================================================================
    function openUnifiedDmThreeDotsMenu() {
        const modal = document.getElementById('nx-global-modal');
        if (!modal) return;
        let partnerName = document.getElementById('nx-dm-partner-name')?.innerText || 'Partner';

        modal.innerHTML = `
            <div class="nx-modal-box" style="border:2px solid #10b981; background:#090d16; padding:15px; max-width:390px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <div>
                        <strong style="color:#f8fafc; font-size:15.5px;">⚙️ ${partnerName} • 1:1 Pro Menu</strong>
                        <div style="font-size:11px; color:#10b981; font-weight:700;">All Live Features &amp; Controls</div>
                    </div>
                    <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:19px; cursor:pointer;">✕</button>
                </div>

                <div style="display:flex; flex-direction:column; gap:8px; max-height:70dvh; overflow-y:auto;">
                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(56,189,248,0.5);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusLive) NexusLive.startOrJoinVideoRoom(true); else if(window.NexusAdvance) NexusAdvance.startVideoCall(true);">
                        <span class="nx-pro-dots-icon" style="background:rgba(56,189,248,0.18);">📹</span>
                        <div>
                            <div style="color:#38bdf8;">Live Face-to-Face Video Call</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Ring partner's phone with 2-way camera</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(167,139,250,0.5);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusScreen) NexusScreen.startLiveScreenBroadcast(true);">
                        <span class="nx-pro-dots-icon" style="background:rgba(167,139,250,0.18);">🖥️</span>
                        <div>
                            <div style="color:#d8b4fe;">Share Live Screen (With Laser 🔴)</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Stream your mobile screen &amp; co-control</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(16,185,129,0.5);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusPower) NexusPower.startInternetCall();">
                        <span class="nx-pro-dots-icon" style="background:rgba(16,185,129,0.18);">📞</span>
                        <div>
                            <div style="color:#10b981;">Nexus Live Voice Call (Audio)</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Crystal-clear internet voice call</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(244,63,94,0.5);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusLive) NexusLive.openMediaHubModal(true, 'yt'); else if(window.NexusAdvance) NexusAdvance.openInAppYouTubeTV(true);">
                        <span class="nx-pro-dots-icon" style="background:rgba(244,63,94,0.18);">▶️</span>
                        <div>
                            <div style="color:#fda4af;">YouTube Watch-Party TV</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Watch YouTube videos together live</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(20,184,166,0.5);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusLive) NexusLive.openMediaHubModal(true, 'song'); else if(window.NexusPower) NexusPower.openSongSearchModal();">
                        <span class="nx-pro-dots-icon" style="background:rgba(20,184,166,0.18);">🎵</span>
                        <div>
                            <div style="color:#5eead4;">Listen Full Hindi Songs Together (DJ)</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Play 4-5 min full Bollywood songs in sync</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusVoice) NexusVoice.startRecording('dm');">
                        <span class="nx-pro-dots-icon" style="background:rgba(251,191,36,0.18);">🎙️</span>
                        <div>
                            <div style="color:#fde047;">Record Audio Voice Note (1x/1.5x/2x)</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Send real voice recording in chat</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusAI) NexusAI.openStudio();">
                        <span class="nx-pro-dots-icon" style="background:rgba(139,92,246,0.18);">🤖</span>
                        <div>
                            <div style="color:#c4b5fd;">Open 1:1 Private AI Studio</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Ask coding, JEE doubts or generate images</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(239,68,68,0.4);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusPower && NexusPower.clearEntireDmHistory) NexusPower.clearEntireDmHistory();">
                        <span class="nx-pro-dots-icon" style="background:rgba(239,68,68,0.18);">🧹</span>
                        <div>
                            <div style="color:#fca5a5;">Clear Chat History</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Clean messages from this conversation</div>
                        </div>
                    </button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    }

    // =========================================================================
    // 2. OPEN UNIFIED GROUP CHAT ⋮ (3-DOTS) PRO MENU
    // =========================================================================
    function openUnifiedGroupThreeDotsMenu() {
        const modal = document.getElementById('nx-global-modal');
        if (!modal) return;
        let roomTitle = document.getElementById('nx-room-title')?.innerText || 'Community Group';

        modal.innerHTML = `
            <div class="nx-modal-box" style="border:2px solid #38bdf8; background:#090d16; padding:15px; max-width:390px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <div>
                        <strong style="color:#f8fafc; font-size:15.5px;">⚙️ ${roomTitle} • Group Menu</strong>
                        <div style="font-size:11px; color:#38bdf8; font-weight:700;">All Group Live Features &amp; Tools</div>
                    </div>
                    <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none; border:none; color:#94a3b8; font-size:19px; cursor:pointer;">✕</button>
                </div>

                <div style="display:flex; flex-direction:column; gap:8px; max-height:70dvh; overflow-y:auto;">
                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(56,189,248,0.5);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusLive) NexusLive.startOrJoinVideoRoom(false);">
                        <span class="nx-pro-dots-icon" style="background:rgba(56,189,248,0.18);">📹</span>
                        <div>
                            <div style="color:#38bdf8;">Group Video Conference (4-5 Friends)</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Join live multi-person video grid</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(167,139,250,0.5);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusScreen) NexusScreen.startLiveScreenBroadcast(false);">
                        <span class="nx-pro-dots-icon" style="background:rgba(167,139,250,0.18);">🖥️</span>
                        <div>
                            <div style="color:#d8b4fe;">Share Live Screen in Group (Laser 🔴)</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Broadcast your study notes or code live</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(16,185,129,0.5);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusAdvance) NexusAdvance.joinOrStartGroupVoiceChat();">
                        <span class="nx-pro-dots-icon" style="background:rgba(16,185,129,0.18);">📞</span>
                        <div>
                            <div style="color:#10b981;">Group Live Voice Chat (Multi-Member)</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Talk live with all members in this room</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(244,63,94,0.5);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusLive) NexusLive.openMediaHubModal(false, 'yt');">
                        <span class="nx-pro-dots-icon" style="background:rgba(244,63,94,0.18);">▶️</span>
                        <div>
                            <div style="color:#fda4af;">Group YouTube Watch-Party TV</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Watch lectures or videos together</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(20,184,166,0.5);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusLive) NexusLive.openMediaHubModal(false, 'song');">
                        <span class="nx-pro-dots-icon" style="background:rgba(20,184,166,0.18);">🎵</span>
                        <div>
                            <div style="color:#5eead4;">Group Full Song DJ (4-5 Min Songs)</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Play full-length Hindi songs for everyone</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusVoice) NexusVoice.startRecording('group');">
                        <span class="nx-pro-dots-icon" style="background:rgba(251,191,36,0.18);">🎙️</span>
                        <div>
                            <div style="color:#fde047;">Record Group Voice Note (1x/1.5x/2x)</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Send audio note to group</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusSuperChat && NexusSuperChat.openGroupPollModal) NexusSuperChat.openGroupPollModal();">
                        <span class="nx-pro-dots-icon" style="background:rgba(56,189,248,0.18);">📊</span>
                        <div>
                            <div style="color:#93c5fd;">Create Live Group Poll</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Ask MCQ doubt or vote in group</div>
                        </div>
                    </button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    }

    function bindThreeDotsButtonsEverywhere() {
        // Override SuperChat & Power 3-Dots functions
        if (window.NexusSuperChat) {
            NexusSuperChat.openGroupDotsMenu = openUnifiedGroupThreeDotsMenu;
        }
        if (window.NexusPower) {
            NexusPower.openDmHeaderMenu = openUnifiedDmThreeDotsMenu;
            NexusPower.openDmDotsMenu = openUnifiedDmThreeDotsMenu;
        }
        if (window.NexusDM) {
            NexusDM.openChatMenu = openUnifiedDmThreeDotsMenu;
        }

        // Directly bind the top-right ⋮ button inside 1:1 DM Header (#nx-dm-dedicated-root)
        const dmRoot = document.getElementById('nx-dm-dedicated-root');
        if (dmRoot) {
            dmRoot.querySelectorAll('button').forEach(btn => {
                let txt = (btn.innerText || '').trim();
                let oc = btn.getAttribute('onclick') || '';
                if (txt === '⋮' || txt === '•••' || oc.includes('openDmHeaderMenu') || oc.includes('openChatMenu') || oc.includes('openDmDotsMenu')) {
                    if (!btn.getAttribute('data-nx-dots-bound')) {
                        btn.setAttribute('data-nx-dots-bound', '1');
                        btn.removeAttribute('onclick');
                        btn.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openUnifiedDmThreeDotsMenu();
                        };
                    }
                }
            });
        }

        // Directly bind the top-right ⋮ button inside Group Chat Header (#nx-chat-room)
        const grpRoom = document.getElementById('nx-chat-room');
        if (grpRoom) {
            grpRoom.querySelectorAll('button').forEach(btn => {
                let txt = (btn.innerText || '').trim();
                let oc = btn.getAttribute('onclick') || '';
                if (txt === '⋮' || txt === '•••' || oc.includes('openGroupDotsMenu')) {
                    if (!btn.getAttribute('data-nx-grp-dots-bound')) {
                        btn.setAttribute('data-nx-grp-dots-bound', '1');
                        btn.removeAttribute('onclick');
                        btn.onclick = (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openUnifiedGroupThreeDotsMenu();
                        };
                    }
                }
            });
        }
    }

    window.NexusDotsMenu = {
        openDmMenu: openUnifiedDmThreeDotsMenu,
        openGroupMenu: openUnifiedGroupThreeDotsMenu
    };

    setInterval(bindThreeDotsButtonsEverywhere, 700);
    setTimeout(bindThreeDotsButtonsEverywhere, 120);
})();
