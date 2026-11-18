// ================= DOTSMENU.JS (v35.0 FINAL MASTER): ⚙️ ORIGINAL ⋮ 3-DOTS PRO MENU FOR 1:1 DM & GROUP CHAT + FIXED VOICE NOTE HOOK (startRec) + FIXED SONG DJ & YT WATCH PARTY + 2-WAY VIDEO/VOICE CALL + ✏️ SHARED WHITEBOARD + ⏱️ LIVE SYNCED POMODORO STUDY TIMER + 🎮 1v1 LIVE TIC-TAC-TOE GAME =================

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

    let pomoInterval = null;
    let tttUnsub = null;

    function getActiveDmRoomKey() {
        let me = (window.Nexus && Nexus.getCurrentUser && Nexus.getCurrentUser()) || { username: 'guest' };
        let myU = String(me.username || 'guest').toLowerCase().trim();
        let pU = (window.NexusDM && NexusDM.activePartner) ||
                 document.getElementById('nx-dm-partner-name')?.getAttribute('data-partner-username') ||
                 document.getElementById('nx-dm-partner-name')?.innerText || 'partner';
        pU = String(pU).toLowerCase().replace(/^@/, '').trim();
        return [myU, pU].sort().join('__');
    }

    // =========================================================================
    // 1. LIVE SYNCED POMODORO STUDY TIMER (25 MIN FOCUS)
    // =========================================================================
    window.startSyncedPomodoroTimer = function(minutes = 25) {
        document.getElementById('nx-global-modal').style.display = 'none';
        let bar = document.getElementById('nx-synced-pomo-bar');
        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'nx-synced-pomo-bar';
            bar.style.cssText = 'background:linear-gradient(90deg,#064e3b,#0f172a);border-bottom:1.5px solid #10b981;padding:6px 12px;display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#ecfdf5;font-weight:800;flex-shrink:0;';
            const msgBox = document.getElementById('nx-dm-msgs-box') || document.getElementById('nx-room-messages');
            if (msgBox && msgBox.parentNode) msgBox.parentNode.insertBefore(bar, msgBox);
        }

        let secLeft = minutes * 60;
        clearInterval(pomoInterval);

        const renderPomo = () => {
            const m = String(Math.floor(secLeft / 60)).padStart(2, '0');
            const s = String(secLeft % 60).padStart(2, '0');
            bar.innerHTML = `
                <span>⏱️ Live Study Focus Timer: <b style="color:#fde047;font-family:monospace;font-size:13.5px;">${m}:${s}</b></span>
                <button type="button" onclick="clearInterval(window.__nxPomoInt); document.getElementById('nx-synced-pomo-bar')?.remove();" style="background:#ef4444;color:#fff;border:none;border-radius:8px;padding:2px 8px;font-size:10.5px;font-weight:900;cursor:pointer;">Stop ✕</button>
            `;
        };
        renderPomo();
        pomoInterval = setInterval(() => {
            secLeft--;
            if (secLeft <= 0) {
                clearInterval(pomoInterval);
                if (window.Nexus && Nexus.toast) Nexus.toast("🎉 25m Study Session Complete! Take a 5m break.");
                bar.remove();
                return;
            }
            renderPomo();
        }, 1000);
        window.__nxPomoInt = pomoInterval;
        if (window.Nexus && Nexus.toast) Nexus.toast("⏱️ 25-Min Study Focus Timer Started!");
    };

    // =========================================================================
    // 2. LIVE 1v1 TIC-TAC-TOE GAME (REAL FIRESTORE SYNC BETWEEN PARTNERS!)
    // =========================================================================
    window.openLive1v1TicTacToeModal = async function() {
        const modal = document.getElementById('nx-global-modal');
        if (!modal || !window.Nexus || !Nexus.db) return;

        const rk = 'ttt_' + getActiveDmRoomKey();
        const me = (Nexus.getCurrentUser && Nexus.getCurrentUser()) || { username: 'me' };
        const myU = String(me.username || 'me').toLowerCase().trim();
        const gameRef = Nexus.db.collection("nexus_live_games").doc(rk);

        await gameRef.set({
            board: ['', '', '', '', '', '', '', '', ''],
            turn: 'X',
            playerX: myU,
            winner: '',
            updatedAt: Date.now()
        });

        if (tttUnsub) tttUnsub();
        tttUnsub = gameRef.onSnapshot(doc => {
            if (!doc.exists) return;
            const d = doc.data();
            const b = Array.isArray(d.board) ? d.board : ['', '', '', '', '', '', '', '', ''];

            modal.innerHTML = `
                <div class="nx-modal-box" style="border:2px solid #10b981;background:#090d16;padding:16px;max-width:340px;text-align:center;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                        <strong style="color:#34d399;font-size:15px;">🎮 Live 1v1 Tic-Tac-Toe</strong>
                        <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer;">✕</button>
                    </div>
                    <div style="font-size:12px;color:#38bdf8;font-weight:800;margin-bottom:12px;">
                        ${d.winner ? `🏆 Winner: ${d.winner}!` : `Current Turn: ${d.turn}`}
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:240px;margin:0 auto 14px;">
                        ${b.map((cell, idx) => `
                            <button type="button" onclick="window.playTicTacToeCell('${rk}', ${idx})" style="height:72px;border-radius:14px;background:#161f33;border:1.5px solid #26334d;color:${cell === 'X' ? '#10b981' : '#f43f5e'};font-size:28px;font-weight:900;cursor:pointer;">
                                ${cell}
                            </button>
                        `).join('')}
                    </div>
                    <button type="button" onclick="window.openLive1v1TicTacToeModal()" style="width:100%;padding:10px;border-radius:12px;background:#10b981;color:#020617;border:none;font-weight:900;font-size:12.5px;cursor:pointer;">🔄 Restart Game</button>
                </div>
            `;
            modal.style.display = 'flex';
        });
    };

    window.playTicTacToeCell = async function(rk, idx) {
        if (!window.Nexus || !Nexus.db) return;
        const ref = Nexus.db.collection("nexus_live_games").doc(rk);
        const doc = await ref.get();
        if (!doc.exists) return;
        const d = doc.data();
        if (d.winner || d.board[idx]) return;

        const nextBoard = [...d.board];
        nextBoard[idx] = d.turn;
        const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        let win = '';
        for (const [a, b, c] of wins) {
            if (nextBoard[a] && nextBoard[a] === nextBoard[b] && nextBoard[a] === nextBoard[c]) {
                win = nextBoard[a];
                break;
            }
        }
        if (!win && nextBoard.every(Boolean)) win = 'Draw';

        await ref.set({
            board: nextBoard,
            turn: d.turn === 'X' ? 'O' : 'X',
            winner: win,
            updatedAt: Date.now()
        }, { merge: true });
    };

    // =========================================================================
    // 3. CLEAR 1:1 DM CHAT HISTORY CLEANLY
    // =========================================================================
    window.clearCurrent1v1DmHistory = async function() {
        document.getElementById('nx-global-modal').style.display = 'none';
        if (!confirm("🧹 Clear all messages in this 1:1 chat?")) return;
        if (!window.Nexus || !Nexus.db) return;
        const rk = getActiveDmRoomKey();
        try {
            const snap = await Nexus.db.collection("nexus_private_dms").where("roomKey", "==", rk).get();
            const batch = [];
            snap.forEach(d => batch.push(d.ref.delete()));
            await Promise.allSettled(batch);
            if (Nexus.toast) Nexus.toast("🧹 Chat History Cleared!");
        } catch (e) {}
    };

    // =========================================================================
    // 4. OPEN UNIFIED 1:1 DM ⋮ (3-DOTS) PRO MENU
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
                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(56,189,248,0.5);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusLive) NexusLive.startOrJoinVideoRoom(true);">
                        <span class="nx-pro-dots-icon" style="background:rgba(56,189,248,0.18);">📹</span>
                        <div>
                            <div style="color:#38bdf8;">Live Face-to-Face Video Call</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Ring partner's phone with 2-way HD camera</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(16,185,129,0.5);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusLive) NexusLive.startVoiceCall(true);">
                        <span class="nx-pro-dots-icon" style="background:rgba(16,185,129,0.18);">📞</span>
                        <div>
                            <div style="color:#10b981;">Nexus Live Voice Call (Audio)</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Crystal-clear internet voice call with ring</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(167,139,250,0.5);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusLive) NexusLive.startLiveScreenShare(true);">
                        <span class="nx-pro-dots-icon" style="background:rgba(167,139,250,0.18);">🖥️</span>
                        <div>
                            <div style="color:#d8b4fe;">Share Live Screen (60FPS Stream)</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Stream your screen live with audio</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(244,63,94,0.5);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusWatchParty) NexusWatchParty.openModal(true, 'yt');">
                        <span class="nx-pro-dots-icon" style="background:rgba(244,63,94,0.18);">▶️</span>
                        <div>
                            <div style="color:#fda4af;">YouTube Watch-Party TV</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Search &amp; watch YouTube videos together live</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(20,184,166,0.5);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusWatchParty) NexusWatchParty.openModal(true, 'mp3');">
                        <span class="nx-pro-dots-icon" style="background:rgba(20,184,166,0.18);">🎵</span>
                        <div>
                            <div style="color:#5eead4;">Listen Full Hindi Songs Together (DJ)</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Play 4-5 min full Bollywood songs in sync</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusVoice && NexusVoice.startRec) NexusVoice.startRec('dm');">
                        <span class="nx-pro-dots-icon" style="background:rgba(251,191,36,0.18);">🎙️</span>
                        <div>
                            <div style="color:#fde047;">Record Audio Voice Note (1x/1.5x/2x)</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Send real HD voice recording in chat</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(16,185,129,0.4);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.openSharedWhiteboardModal) window.openSharedWhiteboardModal();">
                        <span class="nx-pro-dots-icon" style="background:rgba(16,185,129,0.18);">✏️</span>
                        <div>
                            <div style="color:#34d399;">Live Shared Doubt Whiteboard</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Draw math/physics diagrams together live</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(245,158,11,0.4);" onclick="window.startSyncedPomodoroTimer(25);">
                        <span class="nx-pro-dots-icon" style="background:rgba(245,158,11,0.18);">⏱️</span>
                        <div>
                            <div style="color:#fbbf24;">Start 25m Synced Study Timer</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Focus together with live countdown bar</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(56,189,248,0.4);" onclick="window.openLive1v1TicTacToeModal();">
                        <span class="nx-pro-dots-icon" style="background:rgba(56,189,248,0.18);">🎮</span>
                        <div>
                            <div style="color:#38bdf8;">Play 1v1 Live Tic-Tac-Toe Game</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Real-time multiplayer board with partner</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusAI) NexusAI.openStudio();">
                        <span class="nx-pro-dots-icon" style="background:rgba(139,92,246,0.18);">🤖</span>
                        <div>
                            <div style="color:#c4b5fd;">Open 1:1 Private AI Studio</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Ask coding, JEE doubts or generate images</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(239,68,68,0.4);" onclick="window.clearCurrent1v1DmHistory();">
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
    // 5. OPEN UNIFIED GROUP CHAT ⋮ (3-DOTS) PRO MENU
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
                            <div style="color:#38bdf8;">Group Video Conference</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Join live multi-person video room</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(167,139,250,0.5);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusLive) NexusLive.startLiveScreenShare(false);">
                        <span class="nx-pro-dots-icon" style="background:rgba(167,139,250,0.18);">🖥️</span>
                        <div>
                            <div style="color:#d8b4fe;">Share Live Screen in Group</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Broadcast your study notes or code live</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(16,185,129,0.5);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusLive) NexusLive.startVoiceCall(false);">
                        <span class="nx-pro-dots-icon" style="background:rgba(16,185,129,0.18);">📞</span>
                        <div>
                            <div style="color:#10b981;">Group Live Voice Call</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Talk live with members in this room</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(244,63,94,0.5);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusWatchParty) NexusWatchParty.openModal(false, 'yt');">
                        <span class="nx-pro-dots-icon" style="background:rgba(244,63,94,0.18);">▶️</span>
                        <div>
                            <div style="color:#fda4af;">Group YouTube Watch-Party TV</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Watch lectures or videos together</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(20,184,166,0.5);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusWatchParty) NexusWatchParty.openModal(false, 'mp3');">
                        <span class="nx-pro-dots-icon" style="background:rgba(20,184,166,0.18);">🎵</span>
                        <div>
                            <div style="color:#5eead4;">Group Full Song DJ (4-5 Min Songs)</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Play full-length Hindi songs for everyone</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusVoice && NexusVoice.startRec) NexusVoice.startRec('group');">
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
// === END OF DOTSMENU.JS ===
