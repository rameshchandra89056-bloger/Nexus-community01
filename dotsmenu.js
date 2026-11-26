// ================= DOTSMENU.JS (v36.0 MULTIPLAYER GAME ARCADE + EXACT REPLY JUMP & REACTION FIX): ⚙️ ⋮ 3-DOTS PRO MENU + 🎮 LIVE 1v1 GAME HUB (AUTO-INVITE BANNER ON PARTNER PHONE, STRICT TURN LOCK, WINNER TROPHY, SCOREBOARD, TIC-TAC-TOE + STONE-PAPER-SCISSORS + MATH DUEL) + ↩️ EXACT REPLY TARGET SCROLL FIX =================

(function() {
    if (window.__NEXUS_DOTSMENU_FIXED_V2__) return;
    window.__NEXUS_DOTSMENU_FIXED_V2__ = true;
    const escHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const isTypingOrHidden = () => {
        if (document.visibilityState === 'hidden') return true;
        const ae = document.activeElement;
        if (!ae) return false;
        const t = (ae.tagName || '').toUpperCase();
        return t === 'INPUT' || t === 'TEXTAREA' || ae.isContentEditable === true;
    };
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
    let gameClockInterval = null;
    let lastCelebratedRoundKey = '';
    const liveGamesMemoryCache = {};
    const usedMathQuestions = new Set();
    const usedQuizIndices = new Set();

    // Confetti & Victory Popup Styles
    const victoryStyle = document.createElement('style');
    victoryStyle.textContent = `
        @keyframes nxWinPop { 0%{transform:scale(0.6);opacity:0} 70%{transform:scale(1.06);opacity:1} 100%{transform:scale(1);opacity:1} }
        @keyframes nxConfettiFall { 0%{transform:translateY(-20px) rotate(0deg);opacity:1} 100%{transform:translateY(260px) rotate(540deg);opacity:0} }
        .nx-win-pop-card { animation: nxWinPop 0.35s cubic-bezier(.22,1,.36,1) both; }
        .nx-confetti-bit { position:absolute; top:0; width:8px; height:8px; border-radius:2px; animation: nxConfettiFall 1.6s ease-out forwards; pointer-events:none; }
    `;
    document.head.appendChild(victoryStyle);

    function getMyGameXp() {
        try { return JSON.parse(localStorage.getItem('nx_game_rewards_v1') || '{"xp":0,"wins":0,"streak":0}'); }
        catch (e) { return { xp: 0, wins: 0, streak: 0 }; }
    }
    function awardGameReward(didIWin) {
        const stats = getMyGameXp();
        if (didIWin) {
            stats.xp = (Number(stats.xp) || 0) + 50;
            stats.wins = (Number(stats.wins) || 0) + 1;
            stats.streak = (Number(stats.streak) || 0) + 1;
        } else {
            stats.xp = (Number(stats.xp) || 0) + 10; // Participation XP
            stats.streak = 0;
        }
        try { localStorage.setItem('nx_game_rewards_v1', JSON.stringify(stats)); } catch (e) {}
        return stats;
    }

    function showWinnerCelebrationPopup(g, ctx) {
        if (!g || !g.winner) return;
        const roundSig = `${g.docId}|${g.roundId || g.updatedAt}|${g.winner}`;
        if (lastCelebratedRoundKey === roundSig) return;
        lastCelebratedRoundKey = roundSig;

        document.getElementById('nx-game-victory-overlay')?.remove();
        const wLower = String(g.winner || '').toLowerCase();
        const isDraw = wLower.includes('draw');
        const didIWin = !isDraw && (wLower.includes(ctx.myU) || (ctx.myName && wLower.includes(ctx.myName)));
        const stats = awardGameReward(didIWin);

        const colors = ['#10b981', '#38bdf8', '#fbbf24', '#f43f5e', '#a78bfa', '#34d399'];
        const confettiHtml = Array.from({ length: 24 }, (_, i) => {
            const left = Math.floor((i / 24) * 96) + 2;
            const delay = (Math.random() * 0.45).toFixed(2);
            const col = colors[i % colors.length];
            return `<span class="nx-confetti-bit" style="left:${left}%;background:${col};animation-delay:${delay}s;"></span>`;
        }).join('');

        const ov = document.createElement('div');
        ov.id = 'nx-game-victory-overlay';
        ov.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,0.86);z-index:285000;display:flex;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(6px);';
        ov.innerHTML = `
            <div class="nx-win-pop-card" style="position:relative;overflow:hidden;width:100%;max-width:330px;background:linear-gradient(155deg,#0f172a,#064e3b);border:2px solid ${isDraw ? '#38bdf8' : (didIWin ? '#fbbf24' : '#f43f5e')};border-radius:24px;padding:22px 18px;text-align:center;color:#fff;box-shadow:0 22px 55px rgba(0,0,0,0.92);">
                ${didIWin ? confettiHtml : ''}
                <div style="font-size:46px;margin-bottom:6px;">${isDraw ? '🤝' : (didIWin ? '🏆' : '🎯')}</div>
                <div style="font-size:11px;font-weight:900;letter-spacing:1px;color:${didIWin ? '#fbbf24' : '#38bdf8'};text-transform:uppercase;">
                    ${isDraw ? 'CLOSE MATCH!' : (didIWin ? 'VICTORY REWARD UNLOCKED!' : 'ROUND COMPLETE')}
                </div>
                <h3 style="font-size:20px;font-weight:900;color:#f8fafc;margin:4px 0 8px;">${escHtml(g.winner)}</h3>
                <div style="display:flex;justify-content:center;gap:8px;margin-bottom:14px;flex-wrap:wrap;">
                    <span style="background:rgba(251,191,36,0.18);border:1px solid #fbbf24;color:#fde047;padding:4px 10px;border-radius:99px;font-size:11.5px;font-weight:900;">⚡ +${didIWin ? 50 : 10} XP</span>
                    <span style="background:rgba(16,185,129,0.2);border:1px solid #10b981;color:#34d399;padding:4px 10px;border-radius:99px;font-size:11.5px;font-weight:900;">🔥 Streak: ${stats.streak}</span>
                    <span style="background:rgba(56,189,248,0.18);border:1px solid #38bdf8;color:#7dd3fc;padding:4px 10px;border-radius:99px;font-size:11.5px;font-weight:900;">🏅 Total XP: ${stats.xp}</span>
                </div>
                <div style="font-size:12px;color:#cbd5e1;margin-bottom:14px;">
                    Scoreboard: <b style="color:#34d399;">@${escHtml(g.playerX)} (${g.scoreX || 0})</b> — <b style="color:#fb7185;">@${escHtml(g.playerO)} (${g.scoreO || 0})</b>
                </div>
                <div style="display:flex;gap:8px;">
                    <button type="button" id="nx-win-next-btn" style="flex:1;padding:11px;border-radius:12px;background:linear-gradient(90deg,#10b981,#06b6d4);color:#020617;border:none;font-weight:900;font-size:13px;cursor:pointer;">🔄 Next Round</button>
                    <button type="button" id="nx-win-close-btn" style="padding:11px 14px;border-radius:12px;background:#1e293b;color:#cbd5e1;border:1px solid #334155;font-weight:800;font-size:12.5px;cursor:pointer;">Close</button>
                </div>
            </div>
        `;
        document.body.appendChild(ov);
        ov.onclick = (ev) => { if (ev.target === ov) ov.remove(); };
        ov.querySelector('#nx-win-close-btn').onclick = () => ov.remove();
        ov.querySelector('#nx-win-next-btn').onclick = () => {
            ov.remove();
            window.startNew1v1LiveGame(g.gameType || 'ttt', g.timerSec || 30);
        };
    }

    function normU(u) {
        return String(u || '').toLowerCase().replace(/^@/, '').trim();
    }

    function getMeObj() {
        try {
            if (window.Nexus && Nexus.getCurrentUser) {
                let u = Nexus.getCurrentUser();
                if (u && u.username) return u;
            }
            let raw = localStorage.getItem('nx_active_account');
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
        const dmBox = document.getElementById('nx-dm-msgs-box') || document.getElementById('nx-dm-messages');
        const grpBox = document.getElementById('nx-room-messages');
        const msgBox = (dmBox && dmBox.contains(e.target)) ? dmBox : ((grpBox && grpBox.contains(e.target)) ? grpBox : null);
        if (!msgBox) return;

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

        const allRows = Array.from(msgBox.querySelectorAll('[data-message-id], .nx-dm-bubble-anim'));
        const currentIdx = allRows.indexOf(parentBubbleRow);
        const searchStart = currentIdx > 0 ? currentIdx - 1 : allRows.length - 1;

        let targetRow = null;
        for (let i = searchStart; i >= 0; i--) {
            const candidate = allRows[i];
            if (candidate === parentBubbleRow) continue;
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
    // 2. LIVE MULTIPLAYER 1v1 GAME ARCADE v54 (5 GAMES + SYNCED TIMER + REWARDS)
    //    1. ❌⭕ Tic-Tac-Toe | 2. 🪨📄✂️ Stone-Paper-Scissors | 3. ⚡ Math Duel (12 Types)
    //    4. 🧠 GK/Science Quiz (25+ Qs) | 5. 🎯 Rapid Reflex Tap Battle
    // =========================================================================
    const GK_QUIZ_BANK = [
        { q: "SI unit of Electric Charge is?", opts: ["Volt", "Coulomb", "Ampere", "Ohm"], ans: 1 },
        { q: "Speed of light in vacuum (approx)?", opts: ["3×10⁶ m/s", "3×10⁸ m/s", "3×10⁵ m/s", "1.5×10⁸ m/s"], ans: 1 },
        { q: "Which gas is known as Laughing Gas?", opts: ["NO₂", "N₂O", "CO₂", "CH₄"], ans: 1 },
        { q: "Value of sin(30°) + cos(60°) = ?", opts: ["0.5", "1", "√3/2", "2"], ans: 1 },
        { q: "Chemical formula of Heavy Water?", opts: ["H₂O₂", "D₂O", "T₂O", "H₃O"], ans: 1 },
        { q: "Powerhouse of the Cell is?", opts: ["Nucleus", "Ribosome", "Mitochondria", "Golgi Body"], ans: 2 },
        { q: "Atomic number of Carbon is?", opts: ["4", "6", "8", "12"], ans: 1 },
        { q: "In JavaScript, typeof null returns?", opts: ["null", "undefined", "object", "boolean"], ans: 2 },
        { q: "Newton's 2nd Law formula?", opts: ["F = mv", "F = ma", "F = m/a", "F = mv²"], ans: 1 },
        { q: "log₁₀(10000) = ?", opts: ["2", "3", "4", "5"], ans: 2 },
        { q: "Hardest natural substance on Earth?", opts: ["Iron", "Quartz", "Diamond", "Titanium"], ans: 2 },
        { q: "HTTP status code for 'Not Found'?", opts: ["200", "301", "403", "404"], ans: 3 },
        { q: "pH value of pure neutral water at 25°C?", opts: ["5", "6", "7", "8"], ans: 2 },
        { q: "Planet known as the Red Planet?", opts: ["Venus", "Mars", "Jupiter", "Saturn"], ans: 1 },
        { q: "Derivative of sin(x) with respect to x?", opts: ["-cos(x)", "cos(x)", "tan(x)", "-sin(x)"], ans: 1 },
        { q: "Most abundant gas in Earth's atmosphere?", opts: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Argon"], ans: 2 },
        { q: "HTML stands for HyperText ___ Language?", opts: ["Machine", "Markup", "Modern", "Module"], ans: 1 },
        { q: "Avogadro's number is approx 6.022 × ?", opts: ["10²¹", "10²²", "10²³", "10²⁴"], ans: 2 },
        { q: "SI unit of Force is?", opts: ["Joule", "Watt", "Pascal", "Newton"], ans: 3 },
        { q: "Binary representation of decimal 10?", opts: ["1001", "1010", "1100", "1011"], ans: 1 },
        { q: "Value of tan(45°) × sec(0°) = ?", opts: ["0", "1", "√2", "2"], ans: 1 },
        { q: "Which vitamin is produced by sunlight?", opts: ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin K"], ans: 2 },
        { q: "Capital city of Japan?", opts: ["Kyoto", "Osaka", "Tokyo", "Seoul"], ans: 2 },
        { q: "Escape velocity on Earth (approx)?", opts: ["7.9 km/s", "9.8 km/s", "11.2 km/s", "15.0 km/s"], ans: 2 },
        { q: "Smallest prime number is?", opts: ["0", "1", "2", "3"], ans: 2 }
    ];

    function generateNonRepeatingQuiz() {
        if (usedQuizIndices.size >= GK_QUIZ_BANK.length) usedQuizIndices.clear();
        const avail = [];
        for (let i = 0; i < GK_QUIZ_BANK.length; i++) {
            if (!usedQuizIndices.has(i)) avail.push(i);
        }
        const pick = avail[Math.floor(Math.random() * avail.length)];
        usedQuizIndices.add(pick);
        return Object.assign({ idx: pick }, GK_QUIZ_BANK[pick]);
    }

    function generateFastMathDuelProblem() {
        if (usedMathQuestions.size > 40) usedMathQuestions.clear();
        let q = '', ans = 0;
        for (let attempt = 0; attempt < 12; attempt++) {
            const kind = Math.floor(Math.random() * 12);
            if (kind === 0) {
                const a = 18 + Math.floor(Math.random() * 75), b = 15 + Math.floor(Math.random() * 75);
                q = `${a} + ${b} = ?`; ans = a + b;
            } else if (kind === 1) {
                const a = 55 + Math.floor(Math.random() * 90), b = 14 + Math.floor(Math.random() * 40);
                q = `${a} − ${b} = ?`; ans = a - b;
            } else if (kind === 2) {
                const a = 7 + Math.floor(Math.random() * 18), b = 5 + Math.floor(Math.random() * 14);
                q = `${a} × ${b} = ?`; ans = a * b;
            } else if (kind === 3) {
                const b = 3 + Math.floor(Math.random() * 11), ansTmp = 6 + Math.floor(Math.random() * 18);
                q = `${b * ansTmp} ÷ ${b} = ?`; ans = ansTmp;
            } else if (kind === 4) {
                const n = 9 + Math.floor(Math.random() * 17);
                q = `${n}² − ${n} = ?`; ans = n * n - n;
            } else if (kind === 5) {
                const n = 3 + Math.floor(Math.random() * 7), b = 5 + Math.floor(Math.random() * 25);
                q = `${n}³ + ${b} = ?`; ans = n * n * n + b;
            } else if (kind === 6) {
                const r = 6 + Math.floor(Math.random() * 19), b = 4 + Math.floor(Math.random() * 20);
                q = `√${r * r} + ${b} = ?`; ans = r + b;
            } else if (kind === 7) {
                const pct = [10, 15, 20, 25, 30, 40, 50][Math.floor(Math.random() * 7)];
                const base = (2 + Math.floor(Math.random() * 14)) * 20;
                q = `${pct}% of ${base} = ?`; ans = Math.round((pct * base) / 100);
            } else if (kind === 8) {
                const a = 2 + Math.floor(Math.random() * 6), x = 3 + Math.floor(Math.random() * 11), b = 4 + Math.floor(Math.random() * 18);
                q = `If ${a}x + ${b} = ${a * x + b}, find x`; ans = x;
            } else if (kind === 9) {
                const a = 2 + Math.floor(Math.random() * 8), b = 3 + Math.floor(Math.random() * 16), xv = 1 + Math.floor(Math.random() * 4);
                q = `d/dx (${a}x² + ${b}x) at x=${xv}`; ans = 2 * a * xv + b;
            } else if (kind === 10) {
                const a = 4 + Math.floor(Math.random() * 15), b = 2 + Math.floor(Math.random() * 9), c = 3 + Math.floor(Math.random() * 12);
                q = `(${a} + ${b}) × ${c} = ?`; ans = (a + b) * c;
            } else {
                const p = 2 + Math.floor(Math.random() * 5), a = 3 + Math.floor(Math.random() * 20);
                q = `2^${p} + ${a} = ?`; ans = Math.pow(2, p) + a;
            }
            if (!usedMathQuestions.has(q)) { usedMathQuestions.add(q); break; }
        }
        const opts = new Set([ans]);
        let guard = 0;
        while (opts.size < 4 && guard < 30) {
            guard++;
            const delta = (Math.floor(Math.random() * 11) + 1) * (Math.random() > 0.5 ? 1 : -1);
            if (ans + delta >= 0) opts.add(ans + delta);
        }
        return { q, ans, options: Array.from(opts).sort(() => Math.random() - 0.5) };
    }

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
                if (activeGame) liveGamesMemoryCache[activeGame.docId] = activeGame;
                renderInChatLiveGameBanner(activeGame, ctx);
                if (activeGame && document.getElementById('nx-live-game-modal-stage')) {
                    renderActiveGameModalContent(activeGame, ctx);
                    if (activeGame.winner) showWinnerCelebrationPopup(activeGame, ctx);
                }
            }, () => {});
    }

    function getGameLabel(t) {
        return ({ ttt: 'Tic-Tac-Toe', rps: 'Stone-Paper-Scissors', math: '⚡ Math Duel', quiz: '🧠 GK/JEE Quiz', tap: '🎯 Reflex Tap' }[t] || 'Tic-Tac-Toe');
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
            ? `🏆 ${gameData.winner}`
            : (gameData.gameType === 'ttt'
                ? (isMyTurn ? `🟢 YOUR TURN! Tap Play` : `⏳ Waiting for @${gameData.currentTurnUser}...`)
                : `⏱️ Live Round (${gameData.timerSec || 30}s) — Tap Play!`);

        banner.innerHTML = `
            <div style="min-width:0;flex:1;">
                <div style="font-weight:900;color:#34d399;">🎮 Live 1v1: ${getGameLabel(gameData.gameType)}</div>
                <div style="font-size:11px;color:#fde047;font-weight:800;">${escHtml(statusText)} • Score: ${gameData.scoreX || 0} - ${gameData.scoreO || 0}</div>
            </div>
            <div style="display:flex;gap:5px;flex-shrink:0;">
                <button type="button" onclick="window.openLive1v1GameModal()" style="background:#10b981;color:#020617;border:none;border-radius:8px;padding:5px 10px;font-size:11px;font-weight:900;cursor:pointer;">Play 🎮</button>
                <button type="button" onclick="window.endLive1v1Game('${gameData.docId}')" style="background:#ef4444;color:#fff;border:none;border-radius:8px;padding:5px 8px;font-size:11px;font-weight:900;cursor:pointer;">✕</button>
            </div>
        `;
    }

    function startSyncedGameCountdownLoop(docId, ctx) {
        clearInterval(gameClockInterval);
        gameClockInterval = setInterval(() => {
            const stage = document.getElementById('nx-live-game-modal-stage');
            const g = liveGamesMemoryCache[docId];
            if (!stage || !g || !g.active || g.winner) {
                clearInterval(gameClockInterval);
                return;
            }
            const limitSec = Number(g.timerSec || 30);
            const started = Number(g.roundStartedAt || g.updatedAt || Date.now());
            const left = Math.max(0, Math.ceil(limitSec - (Date.now() - started) / 1000));
            const clockEl = document.getElementById('nx-game-sync-clock');
            if (clockEl) {
                clockEl.textContent = `⏱️ ${String(left).padStart(2, '0')}s`;
                clockEl.style.color = left <= 7 ? '#fb7185' : '#fde047';
            }
            if (left <= 0 && !g.winner) {
                clearInterval(gameClockInterval);
                handleSyncedRoundTimeout(g, ctx);
            }
        }, 250);
    }

    function handleSyncedRoundTimeout(g, ctx) {
        if (!g || g.winner) return;
        let winnerTxt = 'Time Up! Draw';
        let sX = Number(g.scoreX || 0), sO = Number(g.scoreO || 0);

        if (g.gameType === 'ttt') {
            const loserIsX = normU(g.currentTurnUser) === normU(g.playerX);
            winnerTxt = loserIsX ? `@${g.playerO} Wins (Timeout)` : `@${g.playerX} Wins (Timeout)`;
            if (loserIsX) sO++; else sX++;
        } else if (g.gameType === 'tap') {
            const tX = Number((g.tapCounts && g.tapCounts[normU(g.playerX)]) || 0);
            const tO = Number((g.tapCounts && g.tapCounts[normU(g.playerO)]) || 0);
            if (tX > tO) { winnerTxt = `@${g.playerX} Wins (${tX} vs ${tO} taps)!`; sX++; }
            else if (tO > tX) { winnerTxt = `@${g.playerO} Wins (${tO} vs ${tX} taps)!`; sO++; }
            else winnerTxt = `Draw (${tX} - ${tO} taps)!`;
        } else {
            winnerTxt = '⏱️ Time Up — Draw!';
        }

        const patch = { winner: winnerTxt, scoreX: sX, scoreO: sO, updatedAt: Date.now() };
        liveGamesMemoryCache[g.docId] = Object.assign({}, g, patch);
        renderActiveGameModalContent(liveGamesMemoryCache[g.docId], ctx);
        showWinnerCelebrationPopup(liveGamesMemoryCache[g.docId], ctx);
        if (window.Nexus && Nexus.db) {
            Nexus.db.collection("nexus_live_games").doc(g.docId).set(patch, { merge: true }).catch(() => {});
        }
    }

    // 0.01s INSTANT GAME LAUNCH (ZERO Firestore blocking wait — opens immediately on tap!)
    window.startNew1v1LiveGame = function(gameType = 'ttt', timerSecOpt) {
        document.getElementById('nx-game-victory-overlay')?.remove();
        const modal = document.getElementById('nx-global-modal');
        const ctx = getPartnerContext();
        const prev = liveGamesMemoryCache[ctx.roomKey] || {};
        const timerSec = Number(timerSecOpt || prev.timerSec || (gameType === 'tap' ? 15 : 30));
        const now = Date.now();

        const payload = {
            docId: ctx.roomKey,
            roundId: 'r_' + now + '_' + Math.random().toString(36).slice(2, 5),
            active: true,
            gameType: gameType,
            timerSec: timerSec,
            roundStartedAt: now,
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
            mathQuestion: gameType === 'math' ? generateFastMathDuelProblem() : null,
            quizQuestion: gameType === 'quiz' ? generateNonRepeatingQuiz() : null,
            tapCounts: { [ctx.myU]: 0, [ctx.pU]: 0 },
            winner: '',
            winningLine: [],
            scoreX: Number(prev.scoreX || 0),
            scoreO: Number(prev.scoreO || 0),
            updatedAt: now
        };

        // 1. Render in 0.001s immediately!
        liveGamesMemoryCache[ctx.roomKey] = payload;
        if (modal) {
            modal.innerHTML = `<div id="nx-live-game-modal-stage" class="nx-modal-box" style="border:2px solid #10b981;background:#090d16;padding:14px;max-width:380px;text-align:center;"></div>`;
            modal.style.zIndex = '272000';
            modal.style.display = 'flex';
            renderActiveGameModalContent(payload, ctx);
        }
        renderInChatLiveGameBanner(payload, ctx);

        // 2. Sync to Firestore in background without freezing UI!
        if (window.Nexus && Nexus.db) {
            const dbPayload = Object.assign({}, payload);
            delete dbPayload.docId;
            Nexus.db.collection("nexus_live_games").doc(ctx.roomKey).set(dbPayload).catch(() => {});
        }
    };

    window.openLive1v1GameModal = function() {
        const modal = document.getElementById('nx-global-modal');
        if (!modal) return;
        const ctx = getPartnerContext();
        const cached = liveGamesMemoryCache[ctx.roomKey];

        if (cached && cached.active) {
            modal.innerHTML = `<div id="nx-live-game-modal-stage" class="nx-modal-box" style="border:2px solid #10b981;background:#090d16;padding:14px;max-width:380px;text-align:center;"></div>`;
            modal.style.zIndex = '272000';
            modal.style.display = 'flex';
            renderActiveGameModalContent(cached, ctx);
            return;
        }
        window.startNew1v1LiveGame('ttt', 30);
    };

    function renderActiveGameModalContent(g, ctx) {
        const stage = document.getElementById('nx-live-game-modal-stage');
        if (!stage) return;

        const isPlayerX = ctx.myU === normU(g.playerX) || ctx.myName === normU(g.playerX);
        const mySymbol = isPlayerX ? 'X' : 'O';
        const isMyTurn = normU(g.currentTurnUser) === ctx.myU || normU(g.currentTurnUser) === ctx.myName;
        const tLimit = Number(g.timerSec || 30);
        const leftNow = g.winner ? 0 : Math.max(0, Math.ceil(tLimit - (Date.now() - Number(g.roundStartedAt || g.updatedAt || Date.now())) / 1000));
        const myStats = getMyGameXp();

        let bodyHTML = '';
        if (g.gameType === 'math') {
            const mq = g.mathQuestion || generateFastMathDuelProblem();
            bodyHTML = `
                <div style="margin:8px 0 11px;padding:13px;border-radius:14px;background:#111827;border:1.5px solid #fbbf24;">
                    <div style="font-size:10.5px;font-weight:900;color:#fbbf24;margin-bottom:5px;">⚡ FASTEST CORRECT ANSWER WINS +50 XP!</div>
                    <div style="font-size:21px;font-weight:900;color:#fff;margin-bottom:12px;">${escHtml(mq.q)}</div>
                    ${g.winner
                        ? `<div style="padding:10px;border-radius:11px;background:rgba(16,185,129,0.2);border:1px solid #10b981;color:#34d399;font-weight:900;font-size:13px;">🏆 ${escHtml(g.winner)} (Ans: ${mq.ans})</div>`
                        : `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                            ${(mq.options || []).map(opt => `<button type="button" onclick="window.answerMathDuel('${g.docId}', ${Number(opt)})" style="padding:12px;border-radius:11px;background:#1e293b;border:1.5px solid #38bdf8;color:#fff;font-size:16px;font-weight:900;cursor:pointer;">${opt}</button>`).join('')}
                           </div>`}
                </div>
            `;
        } else if (g.gameType === 'quiz') {
            const qz = g.quizQuestion || GK_QUIZ_BANK[0];
            bodyHTML = `
                <div style="margin:8px 0 11px;padding:13px;border-radius:14px;background:#111827;border:1.5px solid #a78bfa;">
                    <div style="font-size:10.5px;font-weight:900;color:#d8b4fe;margin-bottom:5px;">🧠 SCIENCE / JEE / GK SPEED BATTLE (+50 XP)</div>
                    <div style="font-size:15px;font-weight:900;color:#fff;margin-bottom:11px;line-height:1.35;">${escHtml(qz.q)}</div>
                    ${g.winner
                        ? `<div style="padding:10px;border-radius:11px;background:rgba(16,185,129,0.2);border:1px solid #10b981;color:#34d399;font-weight:900;font-size:12.5px;">🏆 ${escHtml(g.winner)}<br><span style="color:#fde047;">Correct: ${escHtml(qz.opts[qz.ans])}</span></div>`
                        : `<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;">
                            ${(qz.opts || []).map((opt, idx) => `<button type="button" onclick="window.answerQuizDuel('${g.docId}', ${idx})" style="padding:10px 8px;border-radius:11px;background:#1e293b;border:1.5px solid #a78bfa;color:#fff;font-size:12.5px;font-weight:800;cursor:pointer;">${escHtml(opt)}</button>`).join('')}
                           </div>`}
                </div>
            `;
        } else if (g.gameType === 'tap') {
            const tc = g.tapCounts || {};
            const cX = Number(tc[normU(g.playerX)] || 0);
            const cO = Number(tc[normU(g.playerO)] || 0);
            const maxT = Math.max(15, cX, cO);
            bodyHTML = `
                <div style="margin:8px 0 11px;padding:13px;border-radius:14px;background:#111827;border:1.5px solid #38bdf8;">
                    <div style="font-size:11px;font-weight:900;color:#38bdf8;margin-bottom:8px;">🎯 TAP FAST BEFORE TIMER HITS 0s!</div>
                    <div style="text-align:left;font-size:11.5px;margin-bottom:6px;">
                        <div style="display:flex;justify-content:space-between;color:#34d399;font-weight:800;"><span>@${escHtml(g.playerX)}</span><span>${cX} taps</span></div>
                        <div style="height:8px;background:#1e293b;border-radius:99px;overflow:hidden;margin:3px 0 7px;"><div style="height:100%;width:${Math.min(100, (cX/maxT)*100)}%;background:#10b981;transition:width 0.1s;"></div></div>
                        <div style="display:flex;justify-content:space-between;color:#fb7185;font-weight:800;"><span>@${escHtml(g.playerO)}</span><span>${cO} taps</span></div>
                        <div style="height:8px;background:#1e293b;border-radius:99px;overflow:hidden;margin-top:3px;"><div style="height:100%;width:${Math.min(100, (cO/maxT)*100)}%;background:#f43f5e;transition:width 0.1s;"></div></div>
                    </div>
                    ${g.winner
                        ? `<div style="padding:10px;border-radius:11px;background:rgba(16,185,129,0.2);border:1px solid #10b981;color:#34d399;font-weight:900;font-size:13px;">🏆 ${escHtml(g.winner)}</div>`
                        : `<button type="button" onclick="window.registerReflexTap('${g.docId}')" style="width:100%;padding:16px;border-radius:16px;background:linear-gradient(135deg,#10b981,#06b6d4);color:#020617;border:none;font-size:18px;font-weight:900;cursor:pointer;margin-top:6px;box-shadow:0 6px 20px rgba(16,185,129,0.4);">⚡ TAP FAST! (+1)</button>`}
                </div>
            `;
        } else if (g.gameType === 'rps') {
            const moves = g.rpsMoves || {};
            const myMove = moves[ctx.myU] || '';
            const partnerMove = moves[ctx.pU] || moves[ctx.pDisplayLower] || '';
            const bothMoved = Boolean(myMove && partnerMove);

            bodyHTML = `
                <div style="margin:8px 0 11px;padding:12px;border-radius:14px;background:#111827;border:1px solid #1e293b;">
                    <div style="font-size:12px;font-weight:800;color:#fde047;margin-bottom:8px;">
                        ${bothMoved ? `🏆 ${escHtml(g.winner || 'Round Complete!')}` : (myMove ? `⏳ Locked! Waiting for ${escHtml(ctx.pDisplay)}...` : `👉 Tap Stone, Paper or Scissor!`)}
                    </div>
                    <div style="display:flex;justify-content:space-around;font-size:34px;margin:8px 0;">
                        <div>
                            <div>${bothMoved ? (myMove === 'R' ? '🪨' : myMove === 'P' ? '📄' : '✂️') : (myMove ? '✅' : '❓')}</div>
                            <div style="font-size:11px;color:#34d399;font-weight:800;margin-top:3px;">You</div>
                        </div>
                        <div style="font-size:17px;align-self:center;color:#94a3b8;font-weight:900;">VS</div>
                        <div>
                            <div>${bothMoved ? (partnerMove === 'R' ? '🪨' : partnerMove === 'P' ? '📄' : '✂️') : (partnerMove ? '✅' : '❓')}</div>
                            <div style="font-size:11px;color:#38bdf8;font-weight:800;margin-top:3px;">${escHtml(ctx.pDisplay)}</div>
                        </div>
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px;">
                        <button type="button" onclick="window.makeRpsMove('${g.docId}','R')" style="padding:10px;border-radius:12px;background:${myMove==='R'?'#064e3b':'#1e293b'};border:1.5px solid #38bdf8;color:#fff;font-size:12.5px;font-weight:900;cursor:pointer;">🪨 Stone</button>
                        <button type="button" onclick="window.makeRpsMove('${g.docId}','P')" style="padding:10px;border-radius:12px;background:${myMove==='P'?'#064e3b':'#1e293b'};border:1.5px solid #10b981;color:#fff;font-size:12.5px;font-weight:900;cursor:pointer;">📄 Paper</button>
                        <button type="button" onclick="window.makeRpsMove('${g.docId}','S')" style="padding:10px;border-radius:12px;background:${myMove==='S'?'#064e3b':'#1e293b'};border:1.5px solid #f43f5e;color:#fff;font-size:12.5px;font-weight:900;cursor:pointer;">✂️ Scissor</button>
                    </div>
                </div>
            `;
        } else {
            const b = Array.isArray(g.board) ? g.board : ['', '', '', '', '', '', '', '', ''];
            const winLine = Array.isArray(g.winningLine) ? g.winningLine : [];
            bodyHTML = `
                <div style="padding:7px 10px;border-radius:11px;background:${g.winner ? 'rgba(16,185,129,0.2)' : (isMyTurn ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)')};border:1px solid ${g.winner ? '#10b981' : (isMyTurn ? '#10b981' : '#f59e0b')};margin-bottom:10px;font-size:12px;font-weight:900;color:${g.winner ? '#34d399' : (isMyTurn ? '#34d399' : '#fde047')};">
                    ${g.winner
                        ? (String(g.winner).includes('Draw') ? '🤝 Match Draw! Tap Next Round' : `🏆 ${escHtml(g.winner)} 🎉`)
                        : (isMyTurn ? `🟢 YOUR TURN (Place ${mySymbol})` : `⏳ Waiting for @${escHtml(g.currentTurnUser)} (${g.currentTurnSymbol})...`)}
                </div>

                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;max-width:236px;margin:0 auto 12px;">
                    ${b.map((cell, idx) => {
                        const isWinCell = winLine.includes(idx);
                        return `
                            <button type="button" onclick="window.playStrictTicTacToeMove('${g.docId}', ${idx})" style="height:70px;border-radius:13px;background:${isWinCell ? '#064e3b' : '#161f33'};border:2px solid ${isWinCell ? '#10b981' : '#26334d'};color:${cell === 'X' ? '#10b981' : '#f43f5e'};font-size:29px;font-weight:900;cursor:${(!g.winner && isMyTurn && !cell) ? 'pointer' : 'not-allowed'};">
                                ${cell}
                            </button>
                        `;
                    }).join('')}
                </div>
            `;
        }

        stage.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div style="text-align:left;">
                    <strong style="color:#34d399;font-size:14.5px;">🎮 1v1 Live Arcade</strong>
                    <div style="font-size:10px;color:#fbbf24;font-weight:800;">🏅 Your XP: ${myStats.xp} • 🔥 Streak: ${myStats.streak}</div>
                </div>
                <div style="display:flex;align-items:center;gap:6px;">
                    <span id="nx-game-sync-clock" style="background:#111827;border:1px solid #334155;padding:4px 9px;border-radius:99px;font-family:monospace;font-size:12px;font-weight:900;color:${leftNow<=7?'#fb7185':'#fde047'};">⏱️ ${String(leftNow).padStart(2,'0')}s</span>
                    <button type="button" onclick="clearInterval(window.__nxGameClk); document.getElementById('nx-global-modal').style.display='none'" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer;">✕</button>
                </div>
            </div>

            <!-- 5 Live Multiplayer Games Selector -->
            <div style="display:flex;gap:5px;overflow-x:auto;scrollbar-width:none;margin-bottom:7px;padding-bottom:2px;">
                ${[
                    ['ttt', '❌⭕ TTT'],
                    ['rps', '🪨📄 RPS'],
                    ['math', '⚡ Math'],
                    ['quiz', '🧠 Quiz'],
                    ['tap', '🎯 Tap Race']
                ].map(([k, lbl]) => `<button type="button" onclick="window.startNew1v1LiveGame('${k}', ${tLimit})" style="padding:6px 10px;border-radius:9px;border:none;white-space:nowrap;flex-shrink:0;background:${(g.gameType||'ttt')===k ? '#10b981' : '#1e293b'};color:${(g.gameType||'ttt')===k ? '#020617' : '#fff'};font-weight:900;font-size:11px;cursor:pointer;">${lbl}</button>`).join('')}
            </div>

            <!-- Selectable Synced Timer Bar (15s / 30s / 45s / 60s) -->
            <div style="display:flex;align-items:center;justify-content:space-between;gap:5px;background:#111827;border:1px solid #1e293b;border-radius:10px;padding:5px 8px;margin-bottom:8px;font-size:10.5px;">
                <span style="color:#94a3b8;font-weight:800;">⏱️ Timer:</span>
                <div style="display:flex;gap:4px;">
                    ${[15, 30, 45, 60].map(sec => `<button type="button" onclick="window.startNew1v1LiveGame('${g.gameType||'ttt'}', ${sec})" style="padding:3px 7px;border-radius:7px;border:none;background:${tLimit===sec?'#38bdf8':'#1e293b'};color:${tLimit===sec?'#020617':'#cbd5e1'};font-weight:900;font-size:10px;cursor:pointer;">${sec}s</button>`).join('')}
                </div>
            </div>

            <!-- Live Player vs Player Scoreboard -->
            <div style="display:flex;justify-content:space-between;align-items:center;background:#111827;border:1px solid #1e293b;border-radius:11px;padding:7px 12px;margin-bottom:9px;font-size:11.5px;">
                <div style="text-align:left;">
                    <div style="color:#10b981;font-weight:900;">❌ @${escHtml(g.playerX)}</div>
                    <div style="font-size:10.5px;color:#94a3b8;">Wins: <b style="color:#fff;">${g.scoreX || 0}</b></div>
                </div>
                <div style="font-weight:900;color:#38bdf8;font-size:12.5px;">VS</div>
                <div style="text-align:right;">
                    <div style="color:#f43f5e;font-weight:900;">⭕ @${escHtml(g.playerO)}</div>
                    <div style="font-size:10.5px;color:#94a3b8;">Wins: <b style="color:#fff;">${g.scoreO || 0}</b></div>
                </div>
            </div>

            ${bodyHTML}

            <div style="display:flex;gap:8px;">
                <button type="button" onclick="window.startNew1v1LiveGame('${g.gameType || 'ttt'}', ${tLimit})" style="flex:1;padding:10px;border-radius:11px;background:#10b981;color:#020617;border:none;font-weight:900;font-size:12px;cursor:pointer;">🔄 Next Round</button>
                <button type="button" onclick="window.endLive1v1Game('${g.docId}')" style="padding:10px 14px;border-radius:11px;background:#ef4444;color:#fff;border:none;font-weight:900;font-size:12px;cursor:pointer;">End Game</button>
            </div>
        `;

        if (!g.winner) {
            startSyncedGameCountdownLoop(g.docId, ctx);
            window.__nxGameClk = gameClockInterval;
        }
    }

    window.playStrictTicTacToeMove = function(docId, idx) {
        const ctx = getPartnerContext();
        const g = liveGamesMemoryCache[docId];
        if (!g || g.winner || g.board[idx]) return;

        const isMyTurn = normU(g.currentTurnUser) === ctx.myU || normU(g.currentTurnUser) === ctx.myName;
        if (!isMyTurn) {
            if (window.Nexus && Nexus.toast) Nexus.toast(`⏳ Wait! Abhi @${g.currentTurnUser} ki turn hai!`);
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
                winnerUser = `@${sym === 'X' ? g.playerX : g.playerO} Wins!`;
                winningLine = [a, b, c];
                break;
            }
        }
        if (!winnerUser && nextBoard.every(Boolean)) winnerUser = 'Match Draw!';

        const nextSymbol = sym === 'X' ? 'O' : 'X';
        const nextUser = nextSymbol === 'X' ? g.playerX : g.playerO;

        const updatePayload = {
            board: nextBoard,
            currentTurnSymbol: nextSymbol,
            currentTurnUser: nextUser,
            winner: winnerUser,
            winningLine: winningLine,
            roundStartedAt: Date.now(), // Reset synced turn timer cleanly on each move!
            updatedAt: Date.now()
        };

        if (winnerUser && !winnerUser.includes('Draw')) {
            if (sym === 'X') updatePayload.scoreX = Number(g.scoreX || 0) + 1;
            else updatePayload.scoreO = Number(g.scoreO || 0) + 1;
        }

        // 0.001s Instant Optimistic UI Update!
        liveGamesMemoryCache[docId] = Object.assign({}, g, updatePayload, { docId });
        renderActiveGameModalContent(liveGamesMemoryCache[docId], ctx);
        if (winnerUser) showWinnerCelebrationPopup(liveGamesMemoryCache[docId], ctx);
        if (window.Nexus && Nexus.db) {
            Nexus.db.collection("nexus_live_games").doc(docId).set(updatePayload, { merge: true }).catch(() => {});
        }
    };

    window.makeRpsMove = function(docId, moveChar) {
        const ctx = getPartnerContext();
        const g = liveGamesMemoryCache[docId];
        if (!g || g.winner) return;
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
                winner = `@${g.playerX} Wins!`; sX++;
            } else {
                winner = `@${g.playerO} Wins!`; sO++;
            }
        }

        const patch = { rpsMoves: moves, winner, scoreX: sX, scoreO: sO, updatedAt: Date.now() };
        liveGamesMemoryCache[docId] = Object.assign({}, g, patch, { docId });
        renderActiveGameModalContent(liveGamesMemoryCache[docId], ctx);
        if (winner) showWinnerCelebrationPopup(liveGamesMemoryCache[docId], ctx);
        if (window.Nexus && Nexus.db) {
            Nexus.db.collection("nexus_live_games").doc(docId).set(patch, { merge: true }).catch(() => {});
        }
    };

    window.answerMathDuel = function(docId, chosenVal) {
        const ctx = getPartnerContext();
        const g = liveGamesMemoryCache[docId];
        if (!g || g.winner || !g.mathQuestion) return;
        if (Number(chosenVal) !== Number(g.mathQuestion.ans)) {
            if (window.Nexus && Nexus.toast) Nexus.toast('❌ Galat jawab! Dusra try karo!');
            return;
        }
        const isX = ctx.myU === normU(g.playerX) || ctx.myName === normU(g.playerX);
        const patch = {
            winner: `@${ctx.myU} Solved First!`,
            scoreX: Number(g.scoreX || 0) + (isX ? 1 : 0),
            scoreO: Number(g.scoreO || 0) + (isX ? 0 : 1),
            updatedAt: Date.now()
        };
        liveGamesMemoryCache[docId] = Object.assign({}, g, patch, { docId });
        renderActiveGameModalContent(liveGamesMemoryCache[docId], ctx);
        showWinnerCelebrationPopup(liveGamesMemoryCache[docId], ctx);
        if (window.Nexus && Nexus.db) {
            Nexus.db.collection("nexus_live_games").doc(docId).set(patch, { merge: true }).catch(() => {});
        }
    };

    window.answerQuizDuel = function(docId, optIdx) {
        const ctx = getPartnerContext();
        const g = liveGamesMemoryCache[docId];
        if (!g || g.winner || !g.quizQuestion) return;
        if (Number(optIdx) !== Number(g.quizQuestion.ans)) {
            if (window.Nexus && Nexus.toast) Nexus.toast('❌ Wrong option! Try fast!');
            return;
        }
        const isX = ctx.myU === normU(g.playerX) || ctx.myName === normU(g.playerX);
        const patch = {
            winner: `@${ctx.myU} Answered First!`,
            scoreX: Number(g.scoreX || 0) + (isX ? 1 : 0),
            scoreO: Number(g.scoreO || 0) + (isX ? 0 : 1),
            updatedAt: Date.now()
        };
        liveGamesMemoryCache[docId] = Object.assign({}, g, patch, { docId });
        renderActiveGameModalContent(liveGamesMemoryCache[docId], ctx);
        showWinnerCelebrationPopup(liveGamesMemoryCache[docId], ctx);
        if (window.Nexus && Nexus.db) {
            Nexus.db.collection("nexus_live_games").doc(docId).set(patch, { merge: true }).catch(() => {});
        }
    };

    let tapSyncTimer = null;
    window.registerReflexTap = function(docId) {
        const ctx = getPartnerContext();
        const g = liveGamesMemoryCache[docId];
        if (!g || g.winner) return;
        const tc = Object.assign({}, g.tapCounts || {});
        tc[ctx.myU] = Number(tc[ctx.myU] || 0) + 1;
        g.tapCounts = tc;
        g.updatedAt = Date.now();
        renderActiveGameModalContent(g, ctx);
        // Batch Firestore write every 350ms so tapping 10x/sec NEVER floods network!
        clearTimeout(tapSyncTimer);
        tapSyncTimer = setTimeout(() => {
            if (window.Nexus && Nexus.db && liveGamesMemoryCache[docId]) {
                Nexus.db.collection("nexus_live_games").doc(docId).set({
                    [`tapCounts.${ctx.myU}`]: liveGamesMemoryCache[docId].tapCounts[ctx.myU],
                    updatedAt: Date.now()
                }, { merge: true }).catch(() => {});
            }
        }, 350);
    };

    window.endLive1v1Game = async function(docId) {
        clearInterval(gameClockInterval);
        document.getElementById('nx-game-victory-overlay')?.remove();
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
    // 3.5 CORE ADVANCED EXTERNAL PRO TOOLS (ZERO PAGE LOAD OVERHEAD!)
    //     1. 🌐 Instant Hindi <-> English Live Translator (MyMemory Free API)
    //     2. 📚 Wikipedia Concept & Study Explainer (Wikipedia REST API)
    //     3. 🧮 Scientific & JEE Formula Calculator (1-Tap Send to Chat)
    // =========================================================================
    function insertTextIntoActiveChat(textStr) {
        if (!textStr) return;
        const dmRoot = document.getElementById('nx-dm-dedicated-root');
        const isDmOpen = dmRoot && dmRoot.style.display !== 'none';
        if (isDmOpen) {
            const inp = document.getElementById('nx-dm-input');
            if (inp) {
                inp.value = textStr;
                if (window.NexusDM && typeof NexusDM.sendDM === 'function') {
                    NexusDM.sendDM();
                    return;
                }
            }
        } else {
            const gInp = document.getElementById('nx-chat-msg-in') || document.querySelector('#nx-chat-room input, #nx-chat-room textarea');
            if (gInp) {
                gInp.value = textStr;
                gInp.focus();
                if (window.Nexus && Nexus.toast) Nexus.toast('✅ Inserted into message box — Tap Send!');
                return;
            }
        }
        navigator.clipboard?.writeText(textStr);
        if (window.Nexus && Nexus.toast) Nexus.toast('📋 Copied to clipboard!');
    }

    // TOOL 1: 🌐 INSTANT LIVE TRANSLATOR (MyMemory External Free API — No API Key)
    window.openNexusTranslatorTool = function() {
        const modal = document.getElementById('nx-global-modal');
        if (!modal) return;
        modal.innerHTML = `
            <div class="nx-modal-box" style="border:2px solid #38bdf8;background:#090d16;padding:15px;max-width:390px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <strong style="color:#38bdf8;font-size:15px;">🌐 Live Translator (Hindi ↔ English)</strong>
                    <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none;border:none;color:#94a3b8;font-size:19px;cursor:pointer;">✕</button>
                </div>
                <select id="nx-tr-pair" style="width:100%;padding:8px 10px;border-radius:10px;background:#111827;border:1px solid #334155;color:#34d399;font-size:12px;font-weight:800;margin-bottom:8px;">
                    <option value="en|hi">English ➔ Hindi (हिंदी)</option>
                    <option value="hi|en">Hindi (हिंदी) ➔ English</option>
                    <option value="en|bn">English ➔ Bengali</option>
                    <option value="en|mr">English ➔ Marathi</option>
                </select>
                <textarea id="nx-tr-in" rows="3" placeholder="Type or paste any sentence or difficult word..." style="width:100%;padding:10px;border-radius:10px;background:#111827;border:1px solid #334155;color:#fff;font-size:13px;outline:none;resize:none;box-sizing:border-box;"></textarea>
                <button type="button" id="nx-tr-go" style="width:100%;margin-top:8px;padding:10px;border-radius:11px;background:linear-gradient(90deg,#10b981,#06b6d4);color:#020617;border:none;font-weight:900;font-size:13px;cursor:pointer;">⚡ Translate Now</button>
                <div id="nx-tr-out" style="display:none;margin-top:10px;padding:11px;border-radius:12px;background:#111827;border:1px solid #10b981;color:#f8fafc;font-size:13.5px;line-height:1.45;"></div>
                <button type="button" id="nx-tr-send" style="display:none;width:100%;margin-top:8px;padding:9px;border-radius:10px;background:#1e293b;border:1px solid #10b981;color:#34d399;font-weight:900;font-size:12px;cursor:pointer;">📤 Send Translation to Chat</button>
            </div>
        `;
        modal.style.zIndex = '272000';
        modal.style.display = 'flex';
        let lastTranslated = '';
        modal.querySelector('#nx-tr-go').onclick = async function() {
            const q = (modal.querySelector('#nx-tr-in').value || '').trim();
            const pair = modal.querySelector('#nx-tr-pair').value || 'en|hi';
            const out = modal.querySelector('#nx-tr-out');
            const sendBtn = modal.querySelector('#nx-tr-send');
            if (!q) return;
            this.disabled = true; this.textContent = '⏳ Translating...';
            try {
                const r = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${encodeURIComponent(pair)}`);
                const d = await r.json();
                lastTranslated = (d && d.responseData && d.responseData.translatedText) || 'Translation unavailable';
                out.textContent = lastTranslated;
                out.style.display = 'block';
                sendBtn.style.display = 'block';
            } catch (e) {
                out.textContent = '⚠️ Network slow, try again.';
                out.style.display = 'block';
            }
            this.disabled = false; this.textContent = '⚡ Translate Now';
        };
        modal.querySelector('#nx-tr-send').onclick = () => {
            if (!lastTranslated) return;
            modal.style.display = 'none';
            insertTextIntoActiveChat('🌐 ' + lastTranslated);
        };
    };

    // TOOL 2: 📚 WIKIPEDIA INSTANT CONCEPT EXPLAINER (Wikipedia REST External API)
    window.openNexusWikiLookupTool = function() {
        const modal = document.getElementById('nx-global-modal');
        if (!modal) return;
        modal.innerHTML = `
            <div class="nx-modal-box" style="border:2px solid #a78bfa;background:#090d16;padding:15px;max-width:395px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <strong style="color:#d8b4fe;font-size:15px;">📚 Instant Concept Lookup (Wikipedia)</strong>
                    <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none;border:none;color:#94a3b8;font-size:19px;cursor:pointer;">✕</button>
                </div>
                <div style="display:flex;gap:6px;margin-bottom:10px;">
                    <input type="text" id="nx-wk-in" placeholder="e.g. Newton's laws, Logarithm, Hybridization..." style="flex:1;padding:9px 11px;border-radius:10px;background:#111827;border:1px solid #334155;color:#fff;font-size:12.5px;outline:none;">
                    <button type="button" id="nx-wk-go" style="padding:9px 14px;border-radius:10px;background:#a78bfa;color:#020617;border:none;font-weight:900;font-size:12px;cursor:pointer;">Search</button>
                </div>
                <div id="nx-wk-res" style="max-height:50vh;overflow-y:auto;font-size:12.5px;color:#cbd5e1;line-height:1.5;">
                    <div style="text-align:center;color:#64748b;padding:18px 8px;">Search any JEE Physics, Chemistry, Math, or Coding topic to get an instant verified summary &amp; share in chat!</div>
                </div>
            </div>
        `;
        modal.style.zIndex = '272000';
        modal.style.display = 'flex';
        const runWiki = async () => {
            const q = (modal.querySelector('#nx-wk-in').value || '').trim();
            const resBox = modal.querySelector('#nx-wk-res');
            if (!q) return;
            resBox.innerHTML = `<div style="text-align:center;color:#38bdf8;padding:14px;">⏳ Fetching verified summary for "${escHtml(q)}"...</div>`;
            try {
                const sRes = await fetch(`https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=1&format=json&origin=*`);
                const sData = await sRes.json();
                const bestTitle = (sData && sData[1] && sData[1][0]) || q;
                const sumRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestTitle)}`);
                const sum = await sumRes.json();
                if (!sum || !sum.extract) {
                    resBox.innerHTML = `<div style="text-align:center;color:#fb7185;padding:14px;">Topic not found. Try a simpler spelling!</div>`;
                    return;
                }
                const thumb = sum.thumbnail && sum.thumbnail.source ? `<img src="${escHtml(sum.thumbnail.source)}" style="width:100%;max-height:150px;object-fit:contain;border-radius:10px;margin-bottom:8px;background:#050811;">` : '';
                resBox.innerHTML = `
                    <div style="background:#111827;border:1px solid #26334d;border-radius:13px;padding:11px;">
                        ${thumb}
                        <div style="font-size:14.5px;font-weight:900;color:#34d399;margin-bottom:4px;">${escHtml(sum.title)}</div>
                        <div style="font-size:12.5px;color:#e2e8f0;margin-bottom:10px;">${escHtml(sum.extract)}</div>
                        <button type="button" id="nx-wk-share" style="width:100%;padding:9px;border-radius:10px;background:#10b981;color:#020617;border:none;font-weight:900;font-size:12px;cursor:pointer;">📤 Share Summary in Chat</button>
                    </div>
                `;
                resBox.querySelector('#nx-wk-share').onclick = () => {
                    modal.style.display = 'none';
                    insertTextIntoActiveChat(`📚 *${sum.title}*\n${sum.extract.slice(0, 320)}...`);
                };
            } catch (e) {
                resBox.innerHTML = `<div style="text-align:center;color:#fb7185;padding:14px;">⚠️ Network slow, try again.</div>`;
            }
        };
        modal.querySelector('#nx-wk-go').onclick = runWiki;
        modal.querySelector('#nx-wk-in').onkeydown = (e) => { if (e.key === 'Enter') runWiki(); };
    };

    // TOOL 3: 🧮 SCIENTIFIC & JEE CONSTANTS CALCULATOR (0ms Instant + 1-Tap Send to Chat)
    window.openNexusSciCalcTool = function() {
        const modal = document.getElementById('nx-global-modal');
        if (!modal) return;
        modal.innerHTML = `
            <div class="nx-modal-box" style="border:2px solid #10b981;background:#090d16;padding:15px;max-width:375px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <strong style="color:#34d399;font-size:15px;">🧮 Scientific &amp; JEE Calculator</strong>
                    <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none;border:none;color:#94a3b8;font-size:19px;cursor:pointer;">✕</button>
                </div>
                <input type="text" id="nx-calc-in" placeholder="e.g. sqrt(144) + log10(1000) * sin(pi/2)" style="width:100%;padding:11px 12px;border-radius:11px;background:#111827;border:1.5px solid #334155;color:#fff;font-family:monospace;font-size:14px;outline:none;box-sizing:border-box;">
                <div id="nx-calc-ans" style="margin:8px 0 10px;padding:10px 12px;border-radius:11px;background:#050811;border:1px solid #1e293b;color:#34d399;font-family:monospace;font-size:17px;font-weight:900;text-align:right;">= 0</div>
                <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;">
                    ${[
                        ['sin(', 'sin'], ['cos(', 'cos'], ['tan(', 'tan'], ['sqrt(', '√'], ['log10(', 'log'], ['log(', 'ln'],
                        ['^', 'xʸ'], ['pi', 'π'], ['9.8', 'g=9.8'], ['3e8', 'c=3e8'], ['8.314', 'R=8.314'], ['6.022e23', 'Nₐ']
                    ].map(([ins, lbl]) => `<button type="button" data-cins="${ins}" style="padding:6px 9px;border-radius:8px;background:#1e293b;border:1px solid #334155;color:#38bdf8;font-size:11px;font-weight:800;cursor:pointer;">${lbl}</button>`).join('')}
                </div>
                <div style="display:flex;gap:8px;">
                    <button type="button" id="nx-calc-send" style="flex:1;padding:10px;border-radius:11px;background:linear-gradient(90deg,#10b981,#06b6d4);color:#020617;border:none;font-weight:900;font-size:12.5px;cursor:pointer;">📤 Send Result to Chat</button>
                    <button type="button" id="nx-calc-clr" style="padding:10px 14px;border-radius:11px;background:#1e293b;color:#fb7185;border:1px solid #334155;font-weight:800;font-size:12px;cursor:pointer;">Clear</button>
                </div>
            </div>
        `;
        modal.style.zIndex = '272000';
        modal.style.display = 'flex';
        const inp = modal.querySelector('#nx-calc-in');
        const ansEl = modal.querySelector('#nx-calc-ans');
        let lastEval = '';
        const evaluateSafe = () => {
            const raw = (inp.value || '').trim();
            if (!raw) { ansEl.textContent = '= 0'; lastEval = ''; return; }
            try {
                if (/[^0-9a-zA-Z+\-*/().,^\s]/.test(raw)) throw new Error('bad');
                const jsExpr = raw
                    .replace(/\^/g, '**')
                    .replace(/\bpi\b/gi, 'Math.PI')
                    .replace(/\b(sin|cos|tan|asin|acos|atan|sqrt|abs|log10|log|exp|pow|round|floor|ceil)\b/g, 'Math.$1');
                const val = Function('"use strict"; return (' + jsExpr + ');')();
                if (typeof val === 'number' && Number.isFinite(val)) {
                    lastEval = String(Number(val.toPrecision(10)));
                    ansEl.textContent = '= ' + lastEval;
                    ansEl.style.color = '#34d399';
                } else {
                    ansEl.textContent = '= ...'; lastEval = '';
                }
            } catch (e) {
                ansEl.textContent = '= ...'; lastEval = '';
            }
        };
        inp.oninput = evaluateSafe;
        modal.querySelectorAll('[data-cins]').forEach(b => {
            b.onclick = () => { inp.value += b.getAttribute('data-cins'); evaluateSafe(); inp.focus(); };
        });
        modal.querySelector('#nx-calc-clr').onclick = () => { inp.value = ''; evaluateSafe(); inp.focus(); };
        modal.querySelector('#nx-calc-send').onclick = () => {
            if (!lastEval) return;
            modal.style.display = 'none';
            insertTextIntoActiveChat(`🧮 ${inp.value.trim()} = ${lastEval}`);
        };
        setTimeout(() => inp.focus(), 60);
    };


    // TOOL 4: 📖 SMART ENGLISH DICTIONARY + PRONUNCIATION AUDIO (dictionaryapi.dev Free External API)
    window.openNexusDictionaryTool = function() {
        const modal = document.getElementById('nx-global-modal');
        if (!modal) return;
        modal.innerHTML = `
            <div class="nx-modal-box" style="border:2px solid #38bdf8;background:#090d16;padding:15px;max-width:390px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <strong style="color:#38bdf8;font-size:15px;">📖 Smart Dictionary &amp; Pronunciation</strong>
                    <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none;border:none;color:#94a3b8;font-size:19px;cursor:pointer;">✕</button>
                </div>
                <div style="display:flex;gap:6px;margin-bottom:10px;">
                    <input type="text" id="nx-dict-in" placeholder="Type any English word (e.g. Resilience)..." style="flex:1;padding:9px 11px;border-radius:10px;background:#111827;border:1px solid #334155;color:#fff;font-size:12.5px;outline:none;">
                    <button type="button" id="nx-dict-go" style="padding:9px 14px;border-radius:10px;background:#38bdf8;color:#020617;border:none;font-weight:900;font-size:12px;cursor:pointer;">Define</button>
                </div>
                <div id="nx-dict-out" style="max-height:48vh;overflow-y:auto;font-size:12.5px;color:#cbd5e1;line-height:1.45;">
                    <div style="text-align:center;color:#64748b;padding:18px 8px;">Get instant meaning, voice pronunciation, examples &amp; synonyms!</div>
                </div>
            </div>
        `;
        modal.style.zIndex = '272000';
        modal.style.display = 'flex';
        const runDict = async () => {
            const w = (modal.querySelector('#nx-dict-in').value || '').trim();
            const out = modal.querySelector('#nx-dict-out');
            if (!w) return;
            out.innerHTML = `<div style="text-align:center;color:#38bdf8;padding:14px;">⏳ Looking up "${escHtml(w)}"...</div>`;
            try {
                const r = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(w)}`);
                const d = await r.json();
                if (!Array.isArray(d) || !d[0]) {
                    out.innerHTML = `<div style="text-align:center;color:#fb7185;padding:14px;">Word not found. Check spelling!</div>`;
                    return;
                }
                const entry = d[0];
                const audioObj = (entry.phonetics || []).find(p => p && p.audio);
                const mean = (entry.meanings || [])[0] || {};
                const defObj = (mean.definitions || [])[0] || {};
                const syns = (mean.synonyms || []).slice(0, 5).join(', ');
                out.innerHTML = `
                    <div style="background:#111827;border:1px solid #26334d;border-radius:13px;padding:11px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
                            <div>
                                <span style="font-size:16px;font-weight:900;color:#34d399;">${escHtml(entry.word)}</span>
                                <span style="font-size:11px;color:#94a3b8;margin-left:6px;">${escHtml(entry.phonetic || '')} (${escHtml(mean.partOfSpeech || '')})</span>
                            </div>
                            ${audioObj ? `<button type="button" id="nx-dict-aud" style="background:#1e293b;border:1px solid #38bdf8;color:#38bdf8;border-radius:8px;padding:4px 9px;font-size:11px;font-weight:900;cursor:pointer;">🔊 Listen</button>` : ''}
                        </div>
                        <div style="color:#f8fafc;margin-bottom:6px;"><b>Meaning:</b> ${escHtml(defObj.definition || 'N/A')}</div>
                        ${defObj.example ? `<div style="color:#93c5fd;font-style:italic;font-size:12px;margin-bottom:6px;">"${escHtml(defObj.example)}"</div>` : ''}
                        ${syns ? `<div style="color:#fde047;font-size:11.5px;margin-bottom:9px;"><b>Synonyms:</b> ${escHtml(syns)}</div>` : ''}
                        <button type="button" id="nx-dict-send" style="width:100%;padding:9px;border-radius:10px;background:#10b981;color:#020617;border:none;font-weight:900;font-size:12px;cursor:pointer;">📤 Share Meaning in Chat</button>
                    </div>
                `;
                if (audioObj) {
                    out.querySelector('#nx-dict-aud').onclick = () => { new Audio(audioObj.audio).play().catch(() => {}); };
                }
                out.querySelector('#nx-dict-send').onclick = () => {
                    modal.style.display = 'none';
                    insertTextIntoActiveChat(`📖 *${entry.word}* (${mean.partOfSpeech || ''}): ${defObj.definition || ''}`);
                };
            } catch (e) {
                out.innerHTML = `<div style="text-align:center;color:#fb7185;padding:14px;">⚠️ Network slow, try again.</div>`;
            }
        };
        modal.querySelector('#nx-dict-go').onclick = runDict;
        modal.querySelector('#nx-dict-in').onkeydown = (e) => { if (e.key === 'Enter') runDict(); };
    };

    // TOOL 5: 🤖 INSTANT AI DOUBT SOLVER (External Free AI API)
    window.openNexusAiDoubtTool = function() {
        const modal = document.getElementById('nx-global-modal');
        if (!modal) return;
        modal.innerHTML = `
            <div class="nx-modal-box" style="border:2px solid #10b981;background:#090d16;padding:15px;max-width:395px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <strong style="color:#34d399;font-size:15px;">🤖 Nexus AI Instant Doubt Solver</strong>
                    <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none;border:none;color:#94a3b8;font-size:19px;cursor:pointer;">✕</button>
                </div>
                <textarea id="nx-ai-in" rows="3" placeholder="Ask any Physics, Chemistry, Math, Coding or general doubt..." style="width:100%;padding:10px;border-radius:10px;background:#111827;border:1px solid #334155;color:#fff;font-size:12.5px;outline:none;resize:none;box-sizing:border-box;"></textarea>
                <button type="button" id="nx-ai-go" style="width:100%;margin-top:8px;padding:10px;border-radius:11px;background:linear-gradient(90deg,#10b981,#06b6d4);color:#020617;border:none;font-weight:900;font-size:13px;cursor:pointer;">⚡ Solve Now</button>
                <div id="nx-ai-out" style="display:none;margin-top:10px;padding:11px;border-radius:12px;background:#111827;border:1px solid #10b981;color:#e2e8f0;font-size:12.5px;line-height:1.5;max-height:36vh;overflow-y:auto;white-space:pre-wrap;"></div>
                <button type="button" id="nx-ai-send" style="display:none;width:100%;margin-top:8px;padding:9px;border-radius:10px;background:#1e293b;border:1px solid #10b981;color:#34d399;font-weight:900;font-size:12px;cursor:pointer;">📤 Share Answer in Chat</button>
            </div>
        `;
        modal.style.zIndex = '272000';
        modal.style.display = 'flex';
        let lastAns = '';
        modal.querySelector('#nx-ai-go').onclick = async function() {
            const q = (modal.querySelector('#nx-ai-in').value || '').trim();
            const out = modal.querySelector('#nx-ai-out');
            const sBtn = modal.querySelector('#nx-ai-send');
            if (!q) return;
            this.disabled = true; this.textContent = '⏳ Thinking...';
            out.style.display = 'block'; out.textContent = '⚡ Connecting to AI...';
            try {
                const prompt = `Answer clearly and concisely in Hinglish (max 120 words): ${q}`;
                const r = await fetch(`https://text.pollinations.ai/${encodeURIComponent(prompt)}`);
                lastAns = (await r.text() || '').trim();
                out.textContent = lastAns || 'No response received.';
                sBtn.style.display = lastAns ? 'block' : 'none';
            } catch (e) {
                out.textContent = '⚠️ AI server busy or network slow. Please retry.';
            }
            this.disabled = false; this.textContent = '⚡ Solve Now';
        };
        modal.querySelector('#nx-ai-send').onclick = () => {
            if (!lastAns) return;
            modal.style.display = 'none';
            insertTextIntoActiveChat(`🤖 AI Answer:\n${lastAns.slice(0, 420)}`);
        };
    };

    // TOOL 6: 📱 INSTANT QR CODE GENERATOR (api.qrserver.com Free External API)
    window.openNexusQrMakerTool = function() {
        const modal = document.getElementById('nx-global-modal');
        if (!modal) return;
        modal.innerHTML = `
            <div class="nx-modal-box" style="border:2px solid #fbbf24;background:#090d16;padding:15px;max-width:365px;text-align:center;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <strong style="color:#fde047;font-size:15px;">📱 Instant QR Code Generator</strong>
                    <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none;border:none;color:#94a3b8;font-size:19px;cursor:pointer;">✕</button>
                </div>
                <input type="text" id="nx-qrm-in" placeholder="Paste any link, text, phone or UPI ID..." style="width:100%;padding:9px 11px;border-radius:10px;background:#111827;border:1px solid #334155;color:#fff;font-size:12.5px;outline:none;box-sizing:border-box;margin-bottom:8px;">
                <button type="button" id="nx-qrm-go" style="width:100%;padding:9px;border-radius:10px;background:#fbbf24;color:#020617;border:none;font-weight:900;font-size:12.5px;cursor:pointer;">⚡ Generate QR</button>
                <div id="nx-qrm-out" style="display:none;margin-top:12px;">
                    <img id="nx-qrm-img" src="" style="width:185px;height:185px;border-radius:14px;border:2px solid #fbbf24;background:#fff;padding:6px;">
                    <div style="display:flex;gap:8px;margin-top:10px;">
                        <a id="nx-qrm-dl" href="" download="Nexus_QR.png" target="_blank" style="flex:1;padding:9px;border-radius:10px;background:#10b981;color:#020617;font-weight:900;font-size:12px;text-decoration:none;">⬇️ Save QR</a>
                        <button type="button" id="nx-qrm-send" style="flex:1;padding:9px;border-radius:10px;background:#1e293b;border:1px solid #38bdf8;color:#38bdf8;font-weight:900;font-size:12px;cursor:pointer;">📤 Send Link</button>
                    </div>
                </div>
            </div>
        `;
        modal.style.zIndex = '272000';
        modal.style.display = 'flex';
        let curUrl = '';
        modal.querySelector('#nx-qrm-go').onclick = () => {
            const val = (modal.querySelector('#nx-qrm-in').value || '').trim();
            if (!val) return;
            curUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(val)}`;
            modal.querySelector('#nx-qrm-img').src = curUrl;
            modal.querySelector('#nx-qrm-dl').href = curUrl;
            modal.querySelector('#nx-qrm-out').style.display = 'block';
        };
        modal.querySelector('#nx-qrm-send').onclick = () => {
            if (!curUrl) return;
            modal.style.display = 'none';
            insertTextIntoActiveChat(`📱 QR Code: ${curUrl}`);
        };
    };

    // TOOL 7: 🎲 LIVE DICE ROLLER & COIN FLIP (Quick Decision Maker in Chat)
    window.openNexusLuckTool = function() {
        const modal = document.getElementById('nx-global-modal');
        if (!modal) return;
        modal.innerHTML = `
            <div class="nx-modal-box" style="border:2px solid #a78bfa;background:#090d16;padding:15px;max-width:345px;text-align:center;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                    <strong style="color:#d8b4fe;font-size:15px;">🎲 Coin Flip &amp; Dice Roller</strong>
                    <button type="button" onclick="document.getElementById('nx-global-modal').style.display='none'" style="background:none;border:none;color:#94a3b8;font-size:19px;cursor:pointer;">✕</button>
                </div>
                <div id="nx-luck-res" style="font-size:28px;font-weight:900;color:#fde047;background:#111827;border:1px solid #26334d;border-radius:16px;padding:18px 10px;margin-bottom:12px;">Tap Below!</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
                    <button type="button" id="nx-coin-btn" style="padding:11px;border-radius:11px;background:#1e293b;border:1.5px solid #fbbf24;color:#fde047;font-weight:900;font-size:13px;cursor:pointer;">🪙 Flip Coin</button>
                    <button type="button" id="nx-dice-btn" style="padding:11px;border-radius:11px;background:#1e293b;border:1.5px solid #38bdf8;color:#38bdf8;font-weight:900;font-size:13px;cursor:pointer;">🎲 Roll Dice</button>
                </div>
                <button type="button" id="nx-luck-send" style="display:none;width:100%;padding:10px;border-radius:11px;background:#10b981;color:#020617;border:none;font-weight:900;font-size:12.5px;cursor:pointer;">📤 Send Result to Chat</button>
            </div>
        `;
        modal.style.zIndex = '272000';
        modal.style.display = 'flex';
        let lastRes = '';
        const resEl = modal.querySelector('#nx-luck-res');
        const sendBtn = modal.querySelector('#nx-luck-send');
        modal.querySelector('#nx-coin-btn').onclick = () => {
            lastRes = Math.random() < 0.5 ? '🪙 Coin Toss: HEADS!' : '🪙 Coin Toss: TAILS!';
            resEl.textContent = lastRes;
            sendBtn.style.display = 'block';
        };
        modal.querySelector('#nx-dice-btn').onclick = () => {
            const n = 1 + Math.floor(Math.random() * 6);
            lastRes = `🎲 Dice Rolled: ${n}`;
            resEl.textContent = lastRes;
            sendBtn.style.display = 'block';
        };
        sendBtn.onclick = () => {
            if (!lastRes) return;
            modal.style.display = 'none';
            insertTextIntoActiveChat(lastRes);
        };
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
                            <div style="color:#38bdf8;">1v1 Live Game Arcade (5 Games + Timer &amp; XP)</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">TTT, RPS, Math Duel, GK Quiz, Tap Race + Trophy!</div>
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


                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(56,189,248,0.45);" onclick="window.openNexusTranslatorTool();">
                        <span class="nx-pro-dots-icon" style="background:rgba(56,189,248,0.18);">🌐</span>
                        <div>
                            <div style="color:#38bdf8;">Live Translator (Hindi ↔ English)</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Instant translate &amp; 1-tap send to chat</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(167,139,250,0.45);" onclick="window.openNexusWikiLookupTool();">
                        <span class="nx-pro-dots-icon" style="background:rgba(167,139,250,0.18);">📚</span>
                        <div>
                            <div style="color:#d8b4fe;">Instant Concept Lookup (Wikipedia)</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Search JEE/Coding topics &amp; share summary</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(16,185,129,0.45);" onclick="window.openNexusSciCalcTool();">
                        <span class="nx-pro-dots-icon" style="background:rgba(16,185,129,0.18);">🧮</span>
                        <div>
                            <div style="color:#34d399;">Scientific &amp; JEE Formula Calculator</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Trig, log, physics constants &amp; send result</div>
                        </div>
                    </button>
                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(56,189,248,0.45);" onclick="window.openNexusDictionaryTool();">
                        <span class="nx-pro-dots-icon" style="background:rgba(56,189,248,0.18);">📖</span>
                        <div>
                            <div style="color:#7dd3fc;">Smart Dictionary &amp; Audio</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Meaning, voice pronunciation &amp; synonyms</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(16,185,129,0.45);" onclick="window.openNexusAiDoubtTool();">
                        <span class="nx-pro-dots-icon" style="background:rgba(16,185,129,0.18);">🤖</span>
                        <div>
                            <div style="color:#34d399;">Nexus AI Doubt Solver</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Instant Hinglish study &amp; coding answers</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(251,191,36,0.45);" onclick="window.openNexusQrMakerTool();">
                        <span class="nx-pro-dots-icon" style="background:rgba(251,191,36,0.18);">📱</span>
                        <div>
                            <div style="color:#fde047;">Instant QR Code Generator</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Convert links, UPI or notes to QR image</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(167,139,250,0.45);" onclick="window.openNexusLuckTool();">
                        <span class="nx-pro-dots-icon" style="background:rgba(167,139,250,0.18);">🎲</span>
                        <div>
                            <div style="color:#d8b4fe;">Coin Flip &amp; Dice Roller</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Quick fun toss &amp; dice right inside chat</div>
                        </div>
                    </button>


                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(245,158,11,0.4);" onclick="window.startSyncedPomodoroTimer(25);">
                        <span class="nx-pro-dots-icon" style="background:rgba(245,158,11,0.18);">⏱️</span>
                        <div>
                            <div style="color:#fbbf24;">Start 25m Synced Study Timer</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Focus together with live countdown bar</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusPower) NexusPower.openAdvanceVanishModal();">
                        <span class="nx-pro-dots-icon" style="background:rgba(250,204,21,0.16);">⏳</span>
                        <div>
                            <div style="color:#fde047;">Auto-Vanish Disappearing Mode</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Self-destruct timer (1m / 5m / 1h / 24h)</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusPower) NexusPower.toggleChatPinLock();">
                        <span class="nx-pro-dots-icon" style="background:rgba(56,189,248,0.16);">🔒</span>
                        <div>
                            <div style="color:#93c5fd;">Secret Chat PIN Lock</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Protect this private chat with a PIN</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusPower) NexusPower.toggleChatSearch();">
                        <span class="nx-pro-dots-icon" style="background:rgba(56,189,248,0.16);">🔍</span>
                        <div>
                            <div style="color:#e2e8f0;">Search in Chat &amp; 🎨 Wallpaper</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Find old messages instantly</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusPower) NexusPower.openWallpaperPicker();">
                        <span class="nx-pro-dots-icon" style="background:rgba(168,85,247,0.18);">🎨</span>
                        <div>
                            <div style="color:#d8b4fe;">Change 1:1 Chat Wallpaper</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">AMOLED, Cyberpunk, Emerald &amp; Galaxy themes</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusDM && NexusDM.exportCurrentChatTxt) NexusDM.exportCurrentChatTxt();">
                        <span class="nx-pro-dots-icon" style="background:rgba(16,185,129,0.18);">📥</span>
                        <div>
                            <div style="color:#34d399;">Export Chat Backup (.txt)</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Download full conversation as a text file</div>
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
        modal.style.zIndex = '272000';
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

                    <button type="button" class="nx-pro-dots-btn" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusVoice && NexusVoice.startRec) NexusVoice.startRec('group'); else if(window.NexusSuperChat) NexusSuperChat.toggleGroupVoiceRecording();">
                        <span class="nx-pro-dots-icon" style="background:rgba(251,191,36,0.18);">🎙️</span>
                        <div>
                            <div style="color:#fde047;">Record Group Voice Note (1x/1.5x/2x)</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Send audio note to group</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(251,191,36,0.4);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusSuperChat) NexusSuperChat.openGroupPollModal();">
                        <span class="nx-pro-dots-icon" style="background:rgba(251,191,36,0.18);">📊</span>
                        <div>
                            <div style="color:#fde047;">Create Live Group Poll</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Vote live inside this channel</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(168,85,247,0.4);" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusAdvance && NexusAdvance.openLiveGameModal) NexusAdvance.openLiveGameModal(false, 1);">
                        <span class="nx-pro-dots-icon" style="background:rgba(168,85,247,0.18);">🎮</span>
                        <div>
                            <div style="color:#d8b4fe;">Group 2-Player Game Arena (3 Tables)</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Play Tic-Tac-Toe live with members</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusAdvance && NexusAdvance.openPasswordLockComposer) NexusAdvance.openPasswordLockComposer(false);">
                        <span class="nx-pro-dots-icon" style="background:rgba(250,204,21,0.16);">🔑</span>
                        <div>
                            <div style="color:#fde047;">Send Password-Locked Secret</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Only members with the password can unlock</div>
                        </div>
                    </button>


                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(56,189,248,0.45);" onclick="window.openNexusTranslatorTool();">
                        <span class="nx-pro-dots-icon" style="background:rgba(56,189,248,0.18);">🌐</span>
                        <div>
                            <div style="color:#38bdf8;">Live Translator (Hindi ↔ English)</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Instant translate &amp; 1-tap send to chat</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(167,139,250,0.45);" onclick="window.openNexusWikiLookupTool();">
                        <span class="nx-pro-dots-icon" style="background:rgba(167,139,250,0.18);">📚</span>
                        <div>
                            <div style="color:#d8b4fe;">Instant Concept Lookup (Wikipedia)</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Search JEE/Coding topics &amp; share summary</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(16,185,129,0.45);" onclick="window.openNexusSciCalcTool();">
                        <span class="nx-pro-dots-icon" style="background:rgba(16,185,129,0.18);">🧮</span>
                        <div>
                            <div style="color:#34d399;">Scientific &amp; JEE Formula Calculator</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Trig, log, physics constants &amp; send result</div>
                        </div>
                    </button>
                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(56,189,248,0.45);" onclick="window.openNexusDictionaryTool();">
                        <span class="nx-pro-dots-icon" style="background:rgba(56,189,248,0.18);">📖</span>
                        <div>
                            <div style="color:#7dd3fc;">Smart Dictionary &amp; Audio</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Meaning, voice pronunciation &amp; synonyms</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(16,185,129,0.45);" onclick="window.openNexusAiDoubtTool();">
                        <span class="nx-pro-dots-icon" style="background:rgba(16,185,129,0.18);">🤖</span>
                        <div>
                            <div style="color:#34d399;">Nexus AI Doubt Solver</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Instant Hinglish study &amp; coding answers</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(251,191,36,0.45);" onclick="window.openNexusQrMakerTool();">
                        <span class="nx-pro-dots-icon" style="background:rgba(251,191,36,0.18);">📱</span>
                        <div>
                            <div style="color:#fde047;">Instant QR Code Generator</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Convert links, UPI or notes to QR image</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" style="border-color:rgba(167,139,250,0.45);" onclick="window.openNexusLuckTool();">
                        <span class="nx-pro-dots-icon" style="background:rgba(167,139,250,0.18);">🎲</span>
                        <div>
                            <div style="color:#d8b4fe;">Coin Flip &amp; Dice Roller</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Quick fun toss &amp; dice right inside chat</div>
                        </div>
                    </button>


                    <button type="button" class="nx-pro-dots-btn" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusSuperChat) NexusSuperChat.openLiveSketchpadModal(false);">
                        <span class="nx-pro-dots-icon" style="background:rgba(16,185,129,0.18);">🎨</span>
                        <div>
                            <div style="color:#34d399;">Formula Whiteboard &amp; Sketchpad</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Draw math/physics diagrams with Eraser &amp; Undo</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusChat && NexusChat.toggleGroupSearch) NexusChat.toggleGroupSearch(true);">
                        <span class="nx-pro-dots-icon" style="background:rgba(56,189,248,0.16);">🔍</span>
                        <div>
                            <div style="color:#93c5fd;">Search Group Messages</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Filter room messages instantly</div>
                        </div>
                    </button>

                    <button type="button" class="nx-pro-dots-btn" onclick="document.getElementById('nx-global-modal').style.display='none'; if(window.NexusSuperChat) NexusSuperChat.pinGroupAnnouncementPrompt();">
                        <span class="nx-pro-dots-icon" style="background:rgba(16,185,129,0.16);">📌</span>
                        <div>
                            <div style="color:#5eead4;">Pin Announcement to Group Top</div>
                            <div style="font-size:10.5px; color:#94a3b8; font-weight:600;">Highlight an important study notice</div>
                        </div>
                    </button>
                </div>
            </div>
        `;
        modal.style.zIndex = '272000';
        modal.style.display = 'flex';
    }

    function bindThreeDotsButtonsEverywhere(forceRun) {
        if (!forceRun && isTypingOrHidden()) return;
        watchIncomingGameBannerInChat();
        if (window.NexusSuperChat) NexusSuperChat.openGroupDotsMenu = openUnifiedGroupThreeDotsMenu;
        if (window.NexusPower) {
            NexusPower.openCleanHeaderMenu = openUnifiedDmThreeDotsMenu;
            NexusPower.openDmHeaderMenu = openUnifiedDmThreeDotsMenu;
            NexusPower.openDmDotsMenu = openUnifiedDmThreeDotsMenu;
        }
        if (window.NexusDM) NexusDM.openChatMenu = openUnifiedDmThreeDotsMenu;
    }

    window.NexusDotsMenu = {
        openDmMenu: openUnifiedDmThreeDotsMenu,
        openGroupMenu: openUnifiedGroupThreeDotsMenu
    };

    window.__nxAttachLiveGameWatcher = () => watchIncomingGameBannerInChat();
    setInterval(() => bindThreeDotsButtonsEverywhere(false), 5000);
    setTimeout(() => bindThreeDotsButtonsEverywhere(true), 250);
})();
// === END OF DOTSMENU.JS ===
