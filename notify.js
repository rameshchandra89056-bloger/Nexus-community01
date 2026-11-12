/* ============================================================================
   notify.js — REAL-TIME NOTIFICATION POPUP, BELL ICON DRAWER & RING SOUND
   ============================================================================ */

(function() {
    // Web Audio API crystal-clear notification chime (No external MP3 needed, works in 0.01s)
    function playNotificationRing() {
        if (localStorage.getItem("nexus_mute_notifications") === "true") return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioCtx();
            const now = ctx.currentTime;

            // Dual-tone pleasant chime (587Hz D5 -> 880Hz A5)
            [587.33, 880].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, now + idx * 0.11);
                gain.gain.setValueAtTime(0.18, now + idx * 0.11);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.28);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + idx * 0.11);
                osc.stop(now + idx * 0.11 + 0.3);
            });
        } catch (e) {}
    }

    function showTailwindPopup(notif) {
        playNotificationRing();

        // Save to local notification history for Bell Icon drawer
        const list = JSON.parse(localStorage.getItem("nexus_notifications_list") || "[]");
        list.unshift(notif);
        localStorage.setItem("nexus_notifications_list", JSON.stringify(list.slice(0, 40)));

        // Update red badge dot on Bell Icon
        const badge = document.getElementById("nx-bell-badge");
        if (badge) badge.style.display = "block";

        // Create sleek Tailwind-styled floating banner
        const banner = document.createElement("div");
        banner.style.cssText = `
            position: fixed; top: 14px; left: 50%; transform: translateX(-50%);
            z-index: 2147483647; width: calc(100% - 28px); max-width: 390px;
            background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(12px);
            border: 1px solid rgba(99, 102, 241, 0.55); border-left: 4px solid #6366f1;
            border-radius: 16px; padding: 12px 16px; color: #f8fafc;
            display: flex; align-items: center; gap: 12px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.55); cursor: pointer;
            animation: nxSlideDown 0.25s ease-out; font-family: system-ui, sans-serif;
        `;
        banner.innerHTML = `
            <div style="width:38px;height:38px;border-radius:12px;background:rgba(99,102,241,0.2);display:flex;align-items:center;justify-content:center;font-size:18px;">
                ${notif.type === "follow" ? "👤" : "💬"}
            </div>
            <div style="flex:1;overflow:hidden;">
                <div style="font-weight:800;font-size:13px;color:#93c5fd;">${notif.title || "Nexus Notification"}</div>
                <div style="font-size:12px;color:#cbd5e1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${notif.body || ""}</div>
            </div>
            <span style="font-size:11px;color:#64748b;">Now</span>
            <style>@keyframes nxSlideDown { from { opacity:0; transform:translate(-50%, -20px); } to { opacity:1; transform:translate(-50%, 0); } }</style>
        `;

        banner.onclick = () => {
            banner.remove();
            if (notif.fromHandle && window.NexusDM) {
                window.NexusDM.openChatBox(notif.fromHandle, notif.fromHandle);
            }
        };

        document.body.appendChild(banner);
        setTimeout(() => { if (banner.parentNode) banner.remove(); }, 4000);
    }

    // Open Notification Drawer when Header Bell Icon (🔔) is clicked
    window.openNotificationDrawer = function() {
        const badge = document.getElementById("nx-bell-badge");
        if (badge) badge.style.display = "none";

        const old = document.getElementById("nx-notif-drawer");
        if (old) { old.remove(); return; }

        const list = JSON.parse(localStorage.getItem("nexus_notifications_list") || "[]");
        const isMuted = localStorage.getItem("nexus_mute_notifications") === "true";

        const drawer = document.createElement("div");
        drawer.id = "nx-notif-drawer";
        drawer.style.cssText = `
            position: fixed; inset: 0; z-index: 2147483645;
            background: rgba(9, 13, 22, 0.85); backdrop-filter: blur(8px);
            display: flex; align-items: flex-start; justify-content: center;
            padding: 60px 16px 20px; font-family: system-ui, sans-serif;
        `;

        drawer.innerHTML = `
            <div style="background:var(--nx-card, #111827);color:var(--nx-text, #fff);border:1px solid rgba(99,102,241,0.4);border-radius:20px;width:100%;max-width:400px;max-height:78vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.6);">
                <div style="padding:14px 16px;border-bottom:1px solid rgba(148,163,184,0.15);display:flex;justify-content:space-between;align-items:center;">
                    <div style="font-weight:800;font-size:16px;">🔔 Official Notifications</div>
                    <div style="display:flex;gap:8px;align-items:center;">
                        <button id="nx-mute-toggle" style="background:rgba(99,102,241,0.15);border:1px solid #6366f1;color:#93c5fd;padding:4px 10px;border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;">
                            ${isMuted ? "🔇 Muted" : "🔊 Sound On"}
                        </button>
                        <button id="nx-notif-close" style="background:#ef4444;color:#fff;border:none;padding:4px 10px;border-radius:8px;font-weight:800;cursor:pointer;">✕</button>
                    </div>
                </div>
                <div style="flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;">
                    ${list.length === 0
                        ? `<div style="text-align:center;padding:30px;color:#64748b;font-size:13px;">Abhi koi naya notification nahi hai.</div>`
                        : list.map(n => `
                            <div style="background:rgba(30,41,59,0.65);border:1px solid rgba(148,163,184,0.12);padding:10px 12px;border-radius:12px;">
                                <div style="font-weight:700;font-size:13px;color:#60a5fa;">${n.title}</div>
                                <div style="font-size:12px;color:#cbd5e1;margin-top:2px;">${n.body}</div>
                            </div>
                        `).join("")}
                </div>
            </div>
        `;
        document.body.appendChild(drawer);

        document.getElementById("nx-notif-close").onclick = () => drawer.remove();
        document.getElementById("nx-mute-toggle").onclick = function() {
            const nowMuted = localStorage.getItem("nexus_mute_notifications") !== "true";
            localStorage.setItem("nexus_mute_notifications", nowMuted ? "true" : "false");
            this.innerText = nowMuted ? "🔇 Muted" : "🔊 Sound On";
            if (!nowMuted) playNotificationRing();
        };
    };

    // Bind Header Bell Icon (🔔 / SVG Bell) in 0.01s
    function bindHeaderBellIcon() {
        const header = document.querySelector("header, .nx-header, .top-bar") || document.body.firstElementChild;
        if (!header) return;
        header.querySelectorAll("button, svg, i, span, div").forEach(el => {
            const html = (el.outerHTML || "").toLowerCase();
            if ((html.includes("bell") || html.includes("notif") || (el.innerText || "").trim() === "🔔") && !el.dataset.nxBellBound) {
                const target = el.closest("button, div, a") || el;
                target.dataset.nxBellBound = "true";
                target.style.position = "relative";
                target.style.cursor = "pointer";
                if (!document.getElementById("nx-bell-badge")) {
                    const dot = document.createElement("span");
                    dot.id = "nx-bell-badge";
                    dot.style.cssText = "position:absolute;top:2px;right:2px;width:8px;height:8px;background:#ef4444;border-radius:50%;display:none;";
                    target.appendChild(dot);
                }
                target.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.openNotificationDrawer();
                });
            }
        });
    }
    setInterval(bindHeaderBellIcon, 600);

    // Expose Global Notification API & Firebase Listener
    window.NexusNotify = {
        push: function(notifObj) {
            const payload = Object.assign({ id: "ntf_" + Date.now(), time: Date.now() }, notifObj);
            if (window.firebase && firebase.database) {
                firebase.database().ref("live_notifications").push(payload);
            } else {
                showTailwindPopup(payload);
            }
        },
        playRing: playNotificationRing
    };

    if (window.firebase && firebase.database) {
        const startAt = Date.now();
        firebase.database().ref("live_notifications").limitToLast(5).on("child_added", (snap) => {
            const v = snap.val();
            if (v && v.time >= startAt) {
                showTailwindPopup(v);
            }
        });
    }
})();
