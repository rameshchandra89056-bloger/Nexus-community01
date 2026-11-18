// ================= DOTSMENU.JS (v36.0 MULTIPLAYER GAME ARCADE + EXACT REPLY JUMP & REACTION FIX): ⚙️ ⋮ 3-DOTS PRO MENU + 🎮 LIVE 1v1 GAME HUB (AUTO-INVITE BANNER ON PARTNER PHONE, STRICT TURN LOCK, WINNER TROPHY, SCOREBOARD, TIC-TAC-TOE + STONE-PAPER-SCISSORS + MATH DUEL) + ↩️ EXACT REPLY TARGET SCROLL FIX =================

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
        @keyframes nxReplyHighlightPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            50% { box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.85); }
        }
        .nx-reply-jump-highlight {
            outline: 2.5px solid #10b981 !important;
            animation: nxReplyHighlightPulse 0.8s ease-in-out 2;
        }
    `;
    document.head.appendChild(dotsStyle);

    let pomoInterval = null;
    let gameUnsub = null;
    let activeGameRoomId = '';

    function normU(u) {
        return String(u || '').toLowerCase().replace(/^@/, '').trim();
    }

    function getMeObj() {
        try {
            if (window.Nexus && Nexus.getCurrentUser) {
                let u = Nexus.getCurrentUser();
                if (u && u.username) return u;
            }
            let raw = localStorage.getItem('nx_active_account') || localStorage.getItem('nx_legacy_backup_account');
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return { username: 'guest', name: 'Member' };
    }

    function getPartnerContext() {
        const me = getMeObj();
        const myU = normU(me.username);
        const myName = normU(me.name || myU);
        const nameEl = document.getElementById('nx-dm-partner-name');
        let rawP = (nameEl && nameEl.getAttribute('data-partner-username')) ||
                   (window.NexusDM && NexusDM.activePartner) ||
                   (nameEl && nameEl.innerText) || '';
        rawP = String(rawP).replace(/✅|✓|🟢|Online Now/gi, '').trim();
        let pLower = normU(rawP);

        const users = (window.Nexus && Array.isArray(Nexus.users)) ? Nexus.users : [];
        const matched = users.find(u => u && u.username && (normU(u.username) === pLower || normU(u.name) === pLower));
        const pU = matched ? normU(matched.username) : pLower;
        const pDisplay = (matched && (matched.name || matched.username)) || rawP || pU;

        return {
            myU,
            myDisplay: me.name || myU,
            myName,
            pU,
            pDisplay,
            pDisplayLower: normU(pDisplay),
            roomKey: 'game_' + [myU, pU].sort().join('__'),
            participants: Array.from(new Set([myU, myName, pU, normU(pDisplay)].filter(Boolean)))
        };
    }

    // =========================================================================
    // 1. FIX "JUMPO" REPLY CLICK -> SCROLL TO EXACT TARGET MESSAGE (NOT OLD ONE!)
    // =========================================================================
    document.addEventListener('click', (e) => {
        const msgBox = document.getElementById('nx-dm-msgs-box') || document.getElementById('nx-dm-messages');
        if (!msgBox || !msgBox.contains(e.target)) return;

        // Detect if user tapped on a quoted reply block inside a message bubble
        const replyBlock = e.target.closest('div[style*="border-left"]');
        if (!replyBlock || replyBlock.id === 'nx-dm-reply-bar') return;

        const parentBubbleRow = replyBlock.closest('[data-message-id], .nx-dm-bubble-anim');
        if (!parentBubbleRow) return;

        e.stopPropagation();
        e.preventDefault();

        const quotedRaw = (replyBlock.innerText || '').trim();
        const colonIdx = quotedRaw.indexOf(':');
        const quotedSnippet = (colonIdx !== -1 ? quotedRaw.slice(colonIdx + 1) : quotedRaw).trim().toLowerCase();
        if (!quotedSnippet) return;

        // Search backwards starting right ABOVE the current message bubble so it finds the exact recent message replied to!
        const allRows = Array.from(msgBox.querySelectorAll('[data-message-id], .nx-dm-bubble-anim'));
        const currentIdx = allRows.indexOf(parentBubbleRow);
        const searchStart = currentIdx > 0 ? currentIdx - 1 : allRows.length - 1;

        let targetRow = null;
        for (let i = searchStart; i >= 0; i--) {
            const candidate = allRows[i];
            if (candidate === parentBubbleRow) continue;
            // Get bubble text excluding its own quoted reply block
            const clone = candidate.cloneNode(true);
            clone.querySelectorAll('div[style*="border-left"]').forEach(q => q.remove());
            const candidateText = (clone.innerText || '').toLowerCase();
            if (candidateText.includes(quotedSnippet.slice(0, 28))) {
                targetRow = candidate;
                break;
            }
        }

        if (targetRow) {
            targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const innerCard = targetRow.querySelector('div[style*="border-radius"]') || targetRow;
            innerCard.classList.add('nx-reply-jump-highlight');
            setTimeout(() => innerCard.classList.remove('nx-reply-jump-highlight'), 1800);
        }
    }, true);

    // =========================================================================
    // 2. LIVE MULTIPLAYER 1v1 GAME ARCADE (AUTO-INVITE BANNER ON PARTNER PHONE!)
    //    - Game 1: ❌⭕ Live 1v1 Tic-Tac-Toe (Strict Turn Lock + Scoreboard)
    //    - Game 2: 🪨📄✂️ Stone-Paper-Scissors Showdown
    //    - Game 3: ⚡ Fast Math / JEE Calculation Duel
    // =========================================================================
    function watchIncomingGameBannerInChat() {
        if (!window.Nexus || !Nexus.db) return;
        const dmRoot = document.getElementById('nx-dm-dedicated-root');
        if (!dmRoot || dmRoot.style.display === 'none') return;

        const ctx = getPartnerContext();
        if (!ctx.myU || ctx.myU === 'guest' || !ctx.pU) return;

        if (activeGameRoomId === ctx.roomKey && gameUnsub) return;
        activeGameRoomId = ctx.roomKey;

        if (gameUnsub) gameUnsub();
        gameUnsub = Nexus.db.collection("nexus_live_games")
            .where("participants", "array-contains", ctx.myU)
            .onSnapshot(snap => {
                let activeGame = null;
                snap.forEach(doc => {
                    const d = doc.data();
                    if (!d || !d.active) return;
                    const parts = Array.isArray(d.participants) ? d.participants : [];
                    if (parts.includes(ctx.pU) || parts.includes(ctx.pDisplayLower)) {
                        if (!activeGame || (d.updatedAt || 0) > (activeGame.updatedAt || 0)) {
                            activeGame = Object.assign({}, d, { docId: doc.id });
                        }
                    }
                });
                renderInChatLiveGameBanner(activeGame, ctx);
                if (activeGame && document.getElementById('nx-live-game-modal-stage')) {
                    renderActiveGameModalContent(activeGame, ctx);
                }
            }, () => {});
    }

    function renderInChatLiveGameBanner(gameData, ctx) {
        let banner = document.getElementById('nx-inchat-game-invite-bar');
        const msgBox = document.getElementById('nx-dm-msgs-box');
        if (!msgBox || !msgBox.parentNode) return;

        if (!gameData || !gameData.active) {
            if (banner) banner.remove();
            return;
        }

        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'nx-inchat-game-invite-bar';
            banner.style.cssText = 'background:linear-gradient(90deg,#1e1b4b,#064e3b);border-bottom:1.5px solid #10b981;padding:7px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11.5px;color:#fff;flex-shrink:0;z-index:32;';
            msgBox.parentNode.insertBefore(banner, msgBox);
        }

        const isMyTurn = normU(gameData.currentTurnUser) === ctx.myU || normU(gameData.currentTurnUser) === ctx.myName;
        const statusText = gameData.winner
            ? `🏆 Winner: @${gameData.winner}!`
            : (isMyTurn ? `🟢 YOUR TURN! Tap to Play` : `⏳ Waiting for @${gameData.currentTurnUser}'s move...`);

        banner.innerHTML = `
            <div style="min-width:0;flex:1;">
                <div style="font-weight:900;color:#34d399;">🎮 Live 1v1 Game (${gameData.gameType === 'rps' ? 'Stone-Paper-Scissors' : 'Tic-Tac-Toe'})</div>
                <div style="font-size:11px;color:#fde047;font-weight:800;">${statusText} • Score: ${gameData.scoreX || 0} - ${gameData.scoreO || 0}</div>
            </div>
            <div style="display:flex;gap:5px;flex-shrink:0;">
                <button type="button" onclick="window.openLive1v1GameModal()" style="background:#10b981;color:#020617;border:none;border-radius:8px;padding:5px 10px;font-size:11px;font-weight:900;cursor:pointer;">Play 🎮</button>
                <button type="button" onclick="window.endLive1v1Game('${gameData.docId}')" style="background:#ef4444;color:#fff;border:none;border-radius:8px;padding:5px 8px;font-size:11px;font-weight:900;cursor:pointer;">✕</button>
            </div>
        `;
    }

    window.startNew1v1LiveGame = async function(gameType = 'ttt') {
        if (!window.Nexus || !Nexus.db) return;
        const ctx = getPartnerContext();
        const ref = Nexus.db.collection("nexus_live_games").doc(ctx.roomKey);
        const existing = await ref.get();
        const prev = existing.exists ? existing.data() : {};

        const payload = {
            active: true,
            gameType: gameType,
            roomKey: ctx.roomKey,
            participants: ctx.participants,
            playerX: ctx.myU,
            playerXName: ctx.myDisplay,
            playerO: ctx.pU,
            playerOName: ctx.pDisplay,
            currentTurnSymbol: 'X',
            currentTurnUser: ctx.myU,
            board: ['', '', '', '', '', '', '', '', ''],
            rpsMoves: {},
            winner: '',
            winningLine: [],
            scoreX: Number(prev.scoreX || 0),
            scoreO: Number(prev.scoreO || 0),
            updatedAt: Date.now()
        };

        await ref.set(payload);
        window.openLive1v1GameModal();
        if (Nexus.toast) Nexus.toast(`🎮 Game Invite sent to ${ctx.pDisplay}!`);
    };

    window.openLive1v1GameModal = async function() {
        const modal = document.getElementById('nx-global-modal');
        if (!modal || !window.Nexus || !Nexus.db) return;
        const ctx = getPartnerContext();
        const ref = Nexus.db.collection("nexus_live_games").doc(ctx.roomKey);
        const doc = await ref.get();

        if (!doc.exists || !doc.data().active) {
            await window.startNew1v1LiveGame('ttt');
            return;
        }

        modal.innerHTML = `<div id="nx-live-game-modal-stage" class="nx-modal-box" style="border:2px solid #10b981;background:#090d16;padding:15px;max-width:365px;text-align:center;"></div>`;
        modal.style.display = 'flex';
        renderActiveGameModalContent(Object.assign({}, doc.data(), { docId: doc.id }), ctx);
    };

    function renderActiveGameModalContent(g, ctx) {
        const stage = document.getElementById('nx-live-game-modal-stage');
        if (!stage) return;

        const isPlayerX = ctx.myU === normU(g.playerX) || ctx.myName === normU(g.playerX);
        const mySymbol = isPlayerX ? 'X' : 'O';
        const isMyTurn = normU(g.currentTurnUser) === ctx.myU || normU(g.currentTurnUser) === ctx.myName;

        let bodyHTML = '';
        if (g.gameType === 'rps') {
            const moves = g.rpsMoves || {};
            const myMove = moves[ctx.myU] || '';
            const partnerMove = moves[ctx.pU] || moves[ctx.pDisplayLower] || '';
            const bothMoved = Boolean(myMove && partnerMove);

            bodyHTML = `
                <div style="margin:12px 0;padding:12px;border-radius:14px;background:#111827;border:1px solid #1e293b;">
                    <div style="font-size:12.5px;font-weight:800;color:#fde047;margin-bottom:10px;">
                        ${bothMoved ? `🏆 Result: ${g.winner || 'Round Complete!'}` : (myMove ? `⏳ Waiting for ${ctx.pDisplay} to pick...` : `👉 Pick your move below!`)}
                    </div>
                    <div style="display:flex;justify-content:space-around;font-size:34px;margin:10px 0;">
                        <div>
                            <div>${bothMoved ? (myMove === 'R' ? '🪨' : myMove === 'P' ? '📄' : '✂️') : (myMove ? '✅' : '❓')}</div>
                            <div style="font-size:11px;color:#34d399;font-weight:800;margin-top:4px;">You</div>
                        </div>
                        <div style="font-size:18px;align-self:center;color:#94a3b8;font-weight:900;">VS</div>
                        <div>
                            <div>${bothMoved ? (partnerMove === 'R' ? '🪨' : partnerMove === 'P' ? '📄' : '✂️') : (partnerMove ? '✅' : '❓')}</div>
                            <div style="font-size:11px;color:#38bdf8;font-weight:800;margin-top:4px;">${ctx.pDisplay}</div>
                        </div>
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px;">
                        <button type="button" onclick="window.makeRpsMove('${g.docId}','R')" style="padding:10px;border-radius:12px;background:#1e293b;border:1.5px solid #38bdf8;color:#fff;font-size:13px;font-weight:900;cursor:pointer;">🪨 Stone</button>
                        <button type="button" onclick="window.makeRpsMove('${g.docId}','P')" style="padding:10px;border-radius:12px;background:#1e293b;border:1.5px solid #10b981;color:#fff;font-size:13px;font-weight:900;cursor:pointer;">📄 Paper</button>
                        <button type="button" onclick="window.makeRpsMove('${g.docId}','S')" style="padding:10px;border-radius:12px;background:#1e293b;border:1.5px solid #f43f5e;color:#fff;font-size:13px;font-weight:900;cursor:pointer;">✂️ Scissor</button>
                    </div>
                </div>
            `;
        } else {
            const b = Array.isArray(g.board) ? g.board : ['', '', '', '', '', '', '', '', ''];
            const winLine = Array.isArray(g.winningLine) ? g.winningLine : [];
            bodyHTML = `
                <div style="padding:8px 12px;border-radius:12px;background:${g.winner ? 'rgba(16,185,129,0.2)' : (isMyTurn ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)')};border:1px solid ${g.winner ? '#10b981' : (isMyTurn ? '#10b981' : '#f59e0b')};margin-bottom:12px;font-size:12.5px;font-weight:900;color:${g.winner ? '#34d399' : (isMyTurn ? '#34d399' : '#fde047')};">
                    ${g.winner
                        ? (g.winner === 'Draw' ? '🤝 Match Draw! Tap Next Round' : `🏆 WINNER: @${g.winner} 🎉`)
                        : (isMyTurn ? `🟢 YOUR TURN (Tap any box to place ${mySymbol})` : `⏳ Waiting for @${g.currentTurnUser} (${g.currentTurnSymbol})...`)}
                </div>

                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:246px;margin:0 auto 14px;">
                    ${b.map((cell, idx) => {
                        const isWinCell = winLine.includes(idx);
                        return `
                            <button type="button" onclick="window.playStrictTicTacToeMove('${g.docId}', ${idx})" style="height:74px;border-radius:14px;background:${isWinCell ? '#064e3b' : '#161f33'};border:2px solid ${isWinCell ? '#10b981' : '#26334d'};color:${cell === 'X' ? '#10b981' : '#f43f5e'};font-size:30px;font-weight:900;cursor:${(!g.winner && isMyTurn && !cell) ? 'pointer' : 'not-allowed'};">
                                ${cell}
                            </button>
                        `;
                    }).join('')}
                </div>
            `;
        }

        stage.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                <strong style="color:#34d399;font-size:15px;">🎮 1v1 Live Multiplayer Arcade</strong>
                <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer;">✕</button>
            </div>

            <!-- Switch Game Mode Tabs -->
            <div style="display:flex;gap:6px;margin-bottom:10px;">
                <button type="button" onclick="window.startNew1v1LiveGame('ttt')" style="flex:1;padding:7px;border-radius:9px;border:none;background:${g.gameType !== 'rps' ? '#10b981' : '#1e293b'};color:${g.gameType !== 'rps' ? '#020617' : '#fff'};font-weight:900;font-size:11.5px;cursor:pointer;">❌⭕ Tic-Tac-Toe</button>
                <button type="button" onclick="window.startNew1v1LiveGame('rps')" style="flex:1;padding:7px;border-radius:9px;border:none;background:${g.gameType === 'rps' ? '#10b981' : '#1e293b'};color:${g.gameType === 'rps' ? '#020617' : '#fff'};font-weight:900;font-size:11.5px;cursor:pointer;">🪨📄✂️ Stone-Paper</button>
            </div>

            <!-- Live Player vs Player Scoreboard -->
            <div style="display:flex;justify-content:space-between;align-items:center;background:#111827;border:1px solid #1e293b;border-radius:12px;padding:8px 12px;margin-bottom:10px;font-size:12px;">
                <div style="text-align:left;">
                    <div style="color:#10b981;font-weight:900;">❌ @${g.playerX}</div>
                    <div style="font-size:11px;color:#94a3b8;">Wins: <b style="color:#fff;">${g.scoreX || 0}</b></div>
                </div>
                <div style="font-weight:900;color:#38bdf8;font-size:13px;">VS</div>
                <div style="text-align:right;">
                    <div style="color:#f43f5e;font-weight:900;">⭕ @${g.playerO}</div>
                    <div style="font-size:11px;color:#94a3b8;">Wins: <b style="color:#fff;">${g.scoreO || 0}</b></div>
                </div>
            </div>

            ${bodyHTML}

            <div style="display:flex;gap:8px;">
                <button type="button" onclick="window.startNew1v1LiveGame('${g.gameType || 'ttt'}')" style="flex:1;padding:10px;border-radius:11px;background:#10b981;color:#020617;border:none;font-weight:900;font-size:12px;cursor:pointer;">🔄 Next Round</button>
                <button type="button" onclick="window.endLive1v1Game('${g.docId}')" style="padding:10px 14px;border-radius:11px;background:#ef4444;color:#fff;border:none;font-weight:900;font-size:12px;cursor:pointer;">End Game</button>
            </div>
        `;
    }

    window.playStrictTicTacToeMove = async function(docId, idx) {
        if (!window.Nexus || !Nexus.db) return;
        const ctx = getPartnerContext();
        const ref = Nexus.db.collection("nexus_live_games").doc(docId);
        const doc = await ref.get();
        if (!doc.exists) return;
        const g = doc.data();
        if (g.winner || g.board[idx]) return;

        // STRICT TURN CHECK: Only the player whose turn it is can make a move!
        const isMyTurn = normU(g.currentTurnUser) === ctx.myU || normU(g.currentTurnUser) === ctx.myName;
        if (!isMyTurn) {
            if (Nexus.toast) Nexus.toast(`⏳ Wait! Abhi @${g.currentTurnUser} ki turn hai!`);
            return;
        }

        const nextBoard = [...g.board];
        const sym = g.currentTurnSymbol || 'X';
        nextBoard[idx] = sym;

        const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        let winnerUser = '';
        let winningLine = [];
        for (const [a, b, c] of wins) {
            if (nextBoard[a] && nextBoard[a] === nextBoard[b] && nextBoard[a] === nextBoard[c]) {
                winnerUser = sym === 'X' ? g.playerX : g.playerO;
                winningLine = [a, b, c];
                break;
            }
        }
        if (!winnerUser && nextBoard.every(Boolean)) {
            winnerUser = 'Draw';
        }

        const nextSymbol = sym === 'X' ? 'O' : 'X';
        const nextUser = nextSymbol === 'X' ? g.playerX : g.playerO;

        const updatePayload = {
            board: nextBoard,
            currentTurnSymbol: nextSymbol,
            currentTurnUser: nextUser,
            winner: winnerUser,
            winningLine: winningLine,
            updatedAt: Date.now()
        };

        if (winnerUser && winnerUser !== 'Draw') {
            if (sym === 'X') updatePayload.scoreX = Number(g.scoreX || 0) + 1;
            else updatePayload.scoreO = Number(g.scoreO || 0) + 1;
        }

        await ref.set(updatePayload, { merge: true });
    };

    window.makeRpsMove = async function(docId, moveChar) {
        if (!window.Nexus || !Nexus.db) return;
        const ctx = getPartnerContext();
        const ref = Nexus.db.collection("nexus_live_games").doc(docId);
        const doc = await ref.get();
        if (!doc.exists) return;
        const g = doc.data();
        const moves = Object.assign({}, g.rpsMoves || {});
        moves[ctx.myU] = moveChar;

        const mX = moves[normU(g.playerX)];
        const mO = moves[normU(g.playerO)];
        let winner = '';
        let sX = Number(g.scoreX || 0);
        let sO = Number(g.scoreO || 0);

        if (mX && mO) {
            if (mX === mO) winner = 'Draw!';
            else if ((mX === 'R' && mO === 'S') || (mX === 'P' && mO === 'R') || (mX === 'S' && mO === 'P')) {
                winner = `@${g.playerX} Wins!`;
                sX++;
            } else {
                winner = `@${g.playerO} Wins!`;
                sO++;
            }
        }

        await ref.set({
            rpsMoves: moves,
            winner: winner,
            scoreX: sX,
            scoreO: sO,
            updatedAt: Date.now()
        }, { merge: true });
    };

    window.endLive1v1Game = async function(docId) {
        document.getElementById('nx-global-modal').style.display = 'none';
        document.getElementById('nx-inchat-game-invite-bar')?.remove();
        if (docId && window.Nexus && Nexus.db) {
            await Nexus.db.collection("nexus_live_games").doc(docId).set({ active: false, updatedAt: Date.now() }, { merge: true }).catch(() => {});
        }
    };

    // =========================================================================
    // 3. LIVE SYNCED POMODORO STUDY TIMER (25 MIN FOCUS)
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
                if (window.Nexus && Nexus.toast) Nexus.toast("🎉 25m Study Session Complete!");
                bar.remove();
                return;
            }
            renderPomo();
        }, 1000);
        window.__nxPomoInt = pomoInterval;
    };

    window.clearCurrent1v1DmHistory = async function() {
        document.getElementById('nx-global-modal').style.display = 'none';
        if (!confirm("🧹 Clear all messages in this 1:1 chat?")) return;
        if (!window.Nexus || !Nexus.db) return;
        const ctx = getPartnerContext();
        const rk = [ctx.myU, ctx.pU].sort().join('__');
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
                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(244,63,94,0.5);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusWatchParty) NexusWatchParty.openModal(true, 'yt');">
                        <span class="nx-pro-dots-icon" style="background:rgba(244,63,94,0.18);">▶️</span>
                        <div>
                            <div style="color:#fda4af;">YouTube Watch-Party TV</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Search &amp; watch YouTube videos together in sync</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(20,184,166,0.5);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusWatchParty) NexusWatchParty.openModal(true, 'mp3');">
                        <span class="nx-pro-dots-icon" style="background:rgba(20,184,166,0.18);">🎵</span>
                        <div>
                            <div style="color:#5eead4;">Listen Full Hindi Songs Together (DJ)</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Play 4-5 min full Bollywood MP3 songs in sync</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(56,189,248,0.5);" onclick="window.startNew1v1LiveGame('ttt');">
                        <span class="nx-pro-dots-icon" style="background:rgba(56,189,248,0.18);">🎮</span>
                        <div>
                            <div style="color:#38bdf8;">Play 1v1 Live Games (Tic-Tac-Toe &amp; RPS)</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Sends live game invite banner to partner's chat!</div>
                        </div>
                    </button>

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

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(56,189,248,0.5);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusLive) NexusLive.startOrJoinVideoRoom(false);">
                        <span class="nx-pro-dots-icon" style="background:rgba(56,189,248,0.18);">📹</span>
                        <div>
                            <div style="color:#38bdf8;">Group Video Conference</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Join live multi-person video room</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(16,185,129,0.5);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusLive) NexusLive.startVoiceCall(false);">
                        <span class="nx-pro-dots-icon" style="background:rgba(16,185,129,0.18);">📞</span>
                        <div>
                            <div style="color:#10b981;">Group Live Voice Call</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Talk live with members in this room</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusVoice && NexusVoice.startRec) NexusVoice.startRec('group');">
                        <span class="nx-pro-dots-icon" style="background:rgba(251,191,36,0.18);">🎙️</span>
                        <div>
                            <div style="color:#fde047;">Record Group Voice Note (1x/1.5x/2x)</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Send audio note to group</div>
                        </div>
                    </button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    }

    function bindThreeDotsButtonsEverywhere() {
        watchIncomingGameBannerInChat();
        if (window.NexusSuperChat) NexusSuperChat.openGroupDotsMenu = openUnifiedGroupThreeDotsMenu;
        if (window.NexusPower) {
            NexusPower.openDmHeaderMenu = openUnifiedDmThreeDotsMenu;
            NexusPower.openDmDotsMenu = openUnifiedDmThreeDotsMenu;
        }
        if (window.NexusDM) NexusDM.openChatMenu = openUnifiedDmThreeDotsMenu;

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
    }

    window.NexusDotsMenu = {
        openDmMenu: openUnifiedDmThreeDotsMenu,
        openGroupMenu: openUnifiedGroupThreeDotsMenu
    };

    setInterval(bindThreeDotsButtonsEverywhere, 700);
    setTimeout(bindThreeDotsButtonsEverywhere, 120);
})();
// === END OF DOTSMENU.JS ===
