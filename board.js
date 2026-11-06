// ================= BOARD.JS (DEDICATED REAL-TIME 2-WAY SHARED STUDY WHITEBOARD MODULE): 🎨 LIVE MULTI-USER CANVAS SYNC VIA FIRESTORE + 🖍️ NEON PEN COLORS & ERASER + 📤 1-TAP SEND DRAWING TO CHAT AS HD IMAGE =================

(function() {
    let isDrawing = false;
    let currentColor = '#10b981';
    let currentSize = 3.5;
    let activeBoardRoom = '';
    let boardUnsub = null;
    let currentStrokePoints = [];
    let renderedStrokeCount = 0;

    const boardStyle = document.createElement('style');
    boardStyle.innerHTML = `
        #nx-live-whiteboard-modal {
            position: fixed; inset: 0; width: 100%; max-width: 640px; height: 100dvh;
            margin: 0 auto; background: #050811; z-index: 100320;
            display: none; flex-direction: column; overflow: hidden;
        }
        .nx-wb-color-dot {
            width: 28px; height: 28px; border-radius: 50%; border: 2px solid #1e293b;
            cursor: pointer; transition: transform 0.15s ease; flex-shrink: 0;
        }
        .nx-wb-color-dot.active {
            transform: scale(1.22); border-color: #ffffff; box-shadow: 0 0 10px rgba(255,255,255,0.6);
        }
        .nx-wb-tool-btn {
            background: #1e293b; border: 1px solid #334155; color: #f8fafc;
            padding: 7px 11px; border-radius: 10px; font-size: 11.5px; font-weight: 800;
            cursor: pointer; display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;
        }
        .nx-wb-tool-btn:active { transform: scale(0.94); }
    `;
    document.head.appendChild(boardStyle);

    function getBoardRoomContext(isDmExplicit) {
        let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
        let myU = me && me.username ? me.username.toLowerCase().trim() : 'guest';
        const dmRoot = document.getElementById('nx-dm-dedicated-root');
        const isDm = isDmExplicit === true || (dmRoot && dmRoot.style.display !== 'none');

        if (isDm) {
            let pName = document.getElementById('nx-dm-partner-name')?.innerText || '';
            let uObj = (Nexus.users || []).find(u => u && ((u.name && u.name.toLowerCase() === pName.trim().toLowerCase()) || (u.username && u.username.toLowerCase() === pName.trim().toLowerCase())));
            let pU = uObj ? uObj.username.toLowerCase().trim() : (pName.toLowerCase().replace(/[^a-z0-9_]/g, '') || myU);
            return { isDm: true, roomId: 'wb_dm_' + [myU, pU].sort().join('__'), title: `Live Board • ${pName || '@' + pU}` };
        }
        let rTitle = document.getElementById('nx-room-title')?.innerText || 'Study Room';
        return { isDm: false, roomId: 'wb_grp_' + rTitle.toLowerCase().replace(/[^a-z0-9]/g, '_'), title: `${rTitle} • Shared Board` };
    }

    function drawStrokeOnCanvas(ctx, stroke, canvasW, canvasH) {
        if (!ctx || !stroke || !Array.isArray(stroke.pts) || stroke.pts.length < 2) return;
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = stroke.color || '#10b981';
        ctx.lineWidth = stroke.size || 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 0; i < stroke.pts.length; i++) {
            let x = (stroke.pts[i][0] / 1000) * canvasW;
            let y = (stroke.pts[i][1] / 1000) * canvasH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
    }

    function injectWhiteboardButtons() {
        ['nx-dm-bottom-tray', 'nx-grp-bottom-tray'].forEach(trayId => {
            const tray = document.getElementById(trayId);
            if (tray && !tray.querySelector('.nx-wb-open-btn')) {
                const isDm = (trayId === 'nx-dm-bottom-tray');
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'nx-wb-open-btn';
                btn.style.cssText = "background:#182229; border:1.5px solid #10b981; color:#6ee7b7; border-radius:12px; padding:8px 4px; font-size:11px; font-weight:800; display:flex; flex-direction:column; align-items:center; gap:3px; cursor:pointer;";
                btn.innerHTML = `<span style="font-size:18px;">🎨</span><span>Study Board</span>`;
                btn.onclick = () => {
                    tray.style.display = 'none';
                    NexusBoard.openWhiteboard(isDm);
                };
                tray.appendChild(btn);
            }
        });
    }

    window.NexusBoard = {
        openWhiteboard: function(isDmExplicit) {
            let me = window.Nexus && Nexus.getCurrentUser ? Nexus.getCurrentUser() : null;
            if (!me) { Nexus.switchTab('tab-profile'); return; }

            let ctxInfo = getBoardRoomContext(isDmExplicit);
            activeBoardRoom = ctxInfo.roomId;
            renderedStrokeCount = 0;

            let modal = document.getElementById('nx-live-whiteboard-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'nx-live-whiteboard-modal';
                document.body.appendChild(modal);
            }

            const colors = [
                { hex: '#10b981', name: 'Green' },
                { hex: '#38bdf8', name: 'Blue' },
                { hex: '#fde047', name: 'Yellow' },
                { hex: '#f43f5e', name: 'Red' },
                { hex: '#a78bfa', name: 'Purple' },
                { hex: '#ffffff', name: 'White' }
            ];

            modal.innerHTML = `
                <div style="height:54px; background:#0f172a; border-bottom:1.5px solid #10b981; display:flex; align-items:center; justify-content:space-between; padding:0 12px; flex-shrink:0;">
                    <div>
                        <div style="font-size:14px; font-weight:900; color:#f8fafc;">🎨 ${ctxInfo.title}</div>
                        <div id="nx-wb-sync-status" style="font-size:10.5px; color:#10b981; font-weight:800;">🟢 2-Way Live Drawing Sync Active</div>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button type="button" class="nx-wb-tool-btn" style="background:#10b981; color:#020617; border:none;" onclick="NexusBoard.sendBoardToChat(${ctxInfo.isDm})">📤 Send to Chat</button>
                        <button type="button" class="nx-wb-tool-btn" style="background:#ef4444; color:white; border:none;" onclick="NexusBoard.closeWhiteboard()">✕</button>
                    </div>
                </div>

                <!-- Color & Eraser Toolbar -->
                <div style="padding:8px 12px; background:#111827; border-bottom:1px solid #1e293b; display:flex; align-items:center; justify-content:space-between; gap:8px; overflow-x:auto; flex-shrink:0;">
                    <div style="display:flex; align-items:center; gap:7px;">
                        ${colors.map(c => `
                            <div class="nx-wb-color-dot ${c.hex === currentColor ? 'active' : ''}" style="background:${c.hex};" onclick="NexusBoard.selectColor('${c.hex}', 3.5, this)"></div>
                        `).join('')}
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button type="button" class="nx-wb-tool-btn" onclick="NexusBoard.selectColor('#090d16', 22, this)">🧽 Eraser</button>
                        <button type="button" class="nx-wb-tool-btn" style="color:#fca5a5; border-color:#ef4444;" onclick="NexusBoard.clearBoardBoth()">🗑️ Clear All</button>
                    </div>
                </div>

                <!-- Interactive Drawing Canvas -->
                <div style="flex:1; position:relative; background:#090d16; margin:8px; border-radius:16px; border:1.5px solid #1e293b; overflow:hidden; touch-action:none;">
                    <canvas id="nx-wb-canvas" style="width:100%; height:100%; display:block; touch-action:none; cursor:crosshair;"></canvas>
                </div>
            `;
            modal.style.display = 'flex';

            const canvas = document.getElementById('nx-wb-canvas');
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = Math.max(320, Math.floor(rect.width));
            canvas.height = Math.max(360, Math.floor(rect.height));
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#090d16';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const getNormCoords = (ev) => {
                const r = canvas.getBoundingClientRect();
                const clientX = ev.touches && ev.touches[0] ? ev.touches[0].clientX : ev.clientX;
                const clientY = ev.touches && ev.touches[0] ? ev.touches[0].clientY : ev.clientY;
                let nx = Math.round(((clientX - r.left) / r.width) * 1000);
                let ny = Math.round(((clientY - r.top) / r.height) * 1000);
                return [Math.max(0, Math.min(1000, nx)), Math.max(0, Math.min(1000, ny))];
            };

            const startDraw = (ev) => {
                ev.preventDefault();
                isDrawing = true;
                currentStrokePoints = [getNormCoords(ev)];
            };

            const moveDraw = (ev) => {
                if (!isDrawing) return;
                ev.preventDefault();
                let pt = getNormCoords(ev);
                let prev = currentStrokePoints[currentStrokePoints.length - 1];
                currentStrokePoints.push(pt);
                drawStrokeOnCanvas(ctx, { color: currentColor, size: currentSize, pts: [prev, pt] }, canvas.width, canvas.height);
            };

            const endDraw = async () => {
                if (!isDrawing) return;
                isDrawing = false;
                if (currentStrokePoints.length < 2 || !Nexus.db || !activeBoardRoom) return;

                let strokeObj = {
                    color: currentColor,
                    size: currentSize,
                    pts: currentStrokePoints.slice(0, 120),
                    by: me.username,
                    t: Date.now()
                };
                currentStrokePoints = [];

                try {
                    const ref = Nexus.db.collection("nexus_whiteboards").doc(activeBoardRoom);
                    const snap = await ref.get();
                    let strokes = (snap.exists && Array.isArray(snap.data().strokes)) ? snap.data().strokes : [];
                    strokes.push(strokeObj);
                    renderedStrokeCount = strokes.length;
                    await ref.set({
                        strokes: strokes.slice(-80),
                        updatedBy: me.username,
                        updatedAt: Date.now()
                    }, { merge: true });
                } catch (e) {}
            };

            canvas.addEventListener('mousedown', startDraw);
            canvas.addEventListener('mousemove', moveDraw);
            window.addEventListener('mouseup', endDraw);
            canvas.addEventListener('touchstart', startDraw, { passive: false });
            canvas.addEventListener('touchmove', moveDraw, { passive: false });
            canvas.addEventListener('touchend', endDraw);

            if (boardUnsub) boardUnsub();
            if (Nexus.db) {
                boardUnsub = Nexus.db.collection("nexus_whiteboards").doc(activeBoardRoom).onSnapshot(doc => {
                    if (!doc.exists) return;
                    let d = doc.data();
                    let list = Array.isArray(d.strokes) ? d.strokes : [];
                    const statusEl = document.getElementById('nx-wb-sync-status');
                    if (statusEl && d.updatedBy) {
                        statusEl.innerText = `🟢 Live: @${d.updatedBy} drawing • ${list.length} strokes`;
                    }
                    if (list.length === 0) {
                        ctx.fillStyle = '#090d16';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        renderedStrokeCount = 0;
                        return;
                    }
                    if (list.length !== renderedStrokeCount) {
                        ctx.fillStyle = '#090d16';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        list.forEach(stObj => drawStrokeOnCanvas(ctx, stObj, canvas.width, canvas.height));
                        renderedStrokeCount = list.length;
                    }
                }, () => {});
            }
        },

        selectColor: function(hex, size, el) {
            currentColor = hex;
            currentSize = size || 3.5;
            document.querySelectorAll('.nx-wb-color-dot').forEach(d => d.classList.remove('active'));
            if (el && el.classList.contains('nx-wb-color-dot')) el.classList.add('active');
        },

        clearBoardBoth: async function() {
            const canvas = document.getElementById('nx-wb-canvas');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#090d16';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            renderedStrokeCount = 0;
            if (Nexus.db && activeBoardRoom) {
                let me = Nexus.getCurrentUser();
                await Nexus.db.collection("nexus_whiteboards").doc(activeBoardRoom).set({
                    strokes: [],
                    updatedBy: me ? me.username : 'member',
                    updatedAt: Date.now()
                });
            }
            Nexus.toast("🧹 Whiteboard cleared for everyone!");
        },

        sendBoardToChat: async function(isDm) {
            const canvas = document.getElementById('nx-wb-canvas');
            if (!canvas) return;
            let dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            this.closeWhiteboard();

            let me = Nexus.getCurrentUser();
            if (!me || !Nexus.db) return;

            if (isDm && window.NexusDM && NexusDM.activePartner) {
                let myU = me.username.toLowerCase().trim();
                let pU = NexusDM.activePartner.toLowerCase().trim();
                await Nexus.db.collection("nexus_private_dms").add({
                    roomKey: [myU, pU].sort().join('__'),
                    fromUser: me.username,
                    fromName: me.name || me.username,
                    toUser: NexusDM.activePartner,
                    text: '🎨 Shared Study Whiteboard Diagram',
                    imgUrl: dataUrl,
                    imgUrls: [dataUrl],
                    createdAt: Date.now(),
                    seen: false
                });
                Nexus.toast("📤 Whiteboard Diagram sent to 1:1 Chat!");
            } else if (!isDm && window.NexusChat && NexusChat.activeRoom) {
                await Nexus.db.collection("nexus_real_msgs").add({
                    roomId: NexusChat.activeRoom,
                    sender: me.name || me.username,
                    username: me.username,
                    text: '🎨 Shared Study Whiteboard Diagram',
                    imgUrl: dataUrl,
                    imgUrls: [dataUrl],
                    createdAt: Date.now()
                });
                Nexus.toast("📤 Whiteboard Diagram sent to Group!");
            }
        },

        closeWhiteboard: function() {
            if (boardUnsub) { boardUnsub(); boardUnsub = null; }
            const modal = document.getElementById('nx-live-whiteboard-modal');
            if (modal) modal.style.display = 'none';
        }
    };

    setInterval(injectWhiteboardButtons, 1000);
    setTimeout(injectWhiteboardButtons, 200);
})(); // === END OF BOARD.JS ===
