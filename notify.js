/* ============================================================================
   notify.js — COMPLETE CODE (BELL ICON MENU + REAL LIKE/FOLLOW/DM ALERTS)
   ============================================================================ */

(function() {
    function getMyUser() {
        try {
            const u = JSON.parse(localStorage.getItem("nexus_user") || localStorage.getItem("currentUser") || "{}");
            const h = (u.handle || u.username || u.name || "member").replace(/^@/, "");
            return { name: u.name || h, username: h.toLowerCase(), handle: "@" + h };
        } catch (e) {
            return { name: "Member", username: "member", handle: "@member" };
        }
    }

    function playRingSound() {
        if (localStorage.getItem("nexus_mute_notifications") === "true") return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioCtx();
            const now = ctx.currentTime;
            [587.33, 880].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, now + i * 0.11);
                gain.gain.setValueAtTime(0.18, now + i * 0.11);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.11 + 0.28);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.11);
                osc.stop(now + i * 0.11 + 0.3);
            });
        } catch (e) {}
    }

    function triggerPopupAndSave(notif) {
        const list = JSON.parse(localStorage.getItem("nexus_notifications_list") || "[]");
        if (list.some(item => item.id === notif.id)) return;
        list.unshift(notif);
        localStorage.setItem("nexus_notifications_list", JSON.stringify(list.slice(0, 50)));

        playRingSound();

        const dot = document.getElementById("nx-bell-dot");
        if (dot) dot.style.display = "block";

        const pop = document.createElement("div");
        pop.style.cssText = `
            position: fixed; top: 14px; left: 50%; transform: translateX(-50%);
            z-index: 2147483647; width: calc(100% - 28px); max-width: 380px;
            background: rgba(15, 23, 42, 0.96); border: 1px solid #6366f1;
            border-left: 4px solid #10b981; border-radius: 16px; padding: 12px 15px;
            color: #fff; display: flex; align-items: center; gap: 12px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.65); cursor: pointer;
            font-family: system-ui, sans-serif;
        `;
        const icon = notif.type === "like" ? "❤️" : (notif.type === "follow" ? "👤" : "💬");
        pop.innerHTML = `
            <div style="font-size:22px;">${icon}</div>
            <div style="flex:1;overflow:hidden;">
                <div style="font-weight:800;font-size:13px;color:#6ee7b7;">${notif.title || "New Notification"}</div>
                <div style="font-size:12px;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${notif.body || ""}</div>
            </div>
            <span style="font-size:10px;color:#94a3b8;">Now</span>
        `;
        pop.onclick = () => {
            pop.remove();
            window.openNotificationDrawer();
        };
        document.body.appendChild(pop);
        setTimeout(() => { if (pop.parentNode) pop.remove(); }, 3800);
    }

    window.openNotificationDrawer = function() {
        const dot = document.getElementById("nx-bell-dot");
        if (dot) dot.style.display = "none";

        const old = document.getElementById("nx-notif-drawer-modal");
        if (old) { old.remove(); return; }

        const list = JSON.parse(localStorage.getItem("nexus_notifications_list") || "[]");

        const modal = document.createElement("div");
        modal.id = "nx-notif-drawer-modal";
        modal.style.cssText = `
            position: fixed; inset: 0; z-index: 2147483646;
            background: rgba(9, 13, 22, 0.85); backdrop-filter: blur(8px);
            display: flex; align-items: flex-start; justify-content: center;
            padding: 58px 14px 20px; font-family: system-ui, sans-serif;
        `;

        modal.innerHTML = `
            <div style="background:#111827;color:#fff;border:1px solid rgba(99,102,241,0.45);border-radius:20px;width:100%;max-width:400px;max-height:78vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.65);">
                <div style="padding:14px 16px;border-bottom:1px solid #1e293b;display:flex;justify-content:space-between;align-items:center;">
                    <div style="font-weight:800;font-size:16px;">🔔 Notifications (${list.length})</div>
                    <div style="display:flex;gap:8px;">
                        <button id="nx-notif-clear" style="background:#1e293b;color:#94a3b8;border:none;padding:5px 10px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;">Clear</button>
                        <button id="nx-notif-close" style="background:#ef4444;color:#fff;border:none;padding:5px 11px;border-radius:8px;font-weight:800;cursor:pointer;">✕</button>
                    </div>
                </div>
                <div style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;">
                    ${list.length === 0
                        ? `<div style="text-align:center;padding:32px 16px;color:#64748b;font-size:13px;">Abhi koi naya Like, Follow ya Message notification nahi hai.</div>`
                        : list.map(n => `
                            <div style="background:#1e293b;border-left:3px solid ${n.type === 'like' ? '#f43f5e' : (n.type === 'follow' ? '#3b82f6' : '#10b981')};padding:10px 12px;border-radius:12px;">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <span style="font-weight:700;font-size:13px;color:#93c5fd;">${n.title}</span>
                                    <span style="font-size:10px;color:#64748b;">${n.timeStr || "Recent"}</span>
                                </div>
                                <div style="font-size:12px;color:#e2e8f0;margin-top:3px;">${n.body}</div>
                            </div>
                        `).join("")}
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById("nx-notif-close").onclick = () => modal.remove();
        document.getElementById("nx-notif-clear").onclick = () => {
            localStorage.setItem("nexus_notifications_list", "[]");
            modal.remove();
            window.openNotificationDrawer();
        };
    };

    // Bind Top Header Bell Icon (🔔)
    function bindHeaderBell() {
        const header = document.querySelector("header, .nx-header, .top-bar") || document.body.firstElementChild;
        if (!header) return;
        header.querySelectorAll("button, a, div, span, svg").forEach(el => {
            const html = (el.outerHTML || "").toLowerCase();
            if ((html.includes("m18 8a6") || html.includes("bell") || html.includes("notif") || (el.innerText || "").trim() === "🔔") && !el.dataset.nxBellBound) {
                const target = el.closest("button, a, div") || el;
                target.dataset.nxBellBound = "true";
                target.style.position = "relative";
                target.style.cursor = "pointer";

                if (!document.getElementById("nx-bell-dot")) {
                    const dot = document.createElement("span");
                    dot.id = "nx-bell-dot";
                    dot.style.cssText = "position:absolute;top:2px;right:2px;width:8px;height:8px;background:#ef4444;border-radius:50%;display:none;";
                    target.appendChild(dot);
                }

                target.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.openNotificationDrawer();
                }, true);
            }
        });
    }
    setInterval(bindHeaderBell, 500);

    // Detect Real Likes (❤️ / ♡) & Messages to trigger notifications automatically
    document.addEventListener("click", (e) => {
        const btn = e.target.closest("button, div, span");
        if (!btn) return;
        const txt = (btn.innerText || "").trim();
        const me = getMyUser();

        if ((txt.startsWith("♡") || txt.startsWith("❤️")) && btn.offsetWidth < 100) {
            const card = btn.closest("div[style*='border'], article, .post-card");
            const handleMatch = card ? (card.innerText || "").match(/@([a-zA-Z0-9_]+)/) : null;
            const postAuthor = handleMatch ? handleMatch[1] : "";
            window.NexusNotify.push({
                type: "like",
                title: "❤️ New Post Like!",
                body: `${me.name} (${me.handle}) liked ${postAuthor ? "@" + postAuthor + "'s" : "your"} post`,
                toUser: postAuthor,
                fromUser: me.username
            });
        }
    });

    window.NexusNotify = {
        push: function(obj) {
            const payload = Object.assign({
                id: "ntf_" + Date.now() + "_" + Math.floor(Math.random() * 999),
                timeStr: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                timestamp: Date.now()
            }, obj);

            triggerPopupAndSave(payload);

            if (window.firebase && firebase.database) {
                firebase.database().ref("live_notifications").push(payload);
            }
        },
        playRing: playRingSound
    };

    if (window.firebase && firebase.database) {
        const startAt = Date.now();
        firebase.database().ref("live_notifications").limitToLast(5).on("child_added", (snap) => {
            const v = snap.val();
            if (v && v.timestamp >= startAt) {
                triggerPopupAndSave(v);
            }
        });
    }
})();
