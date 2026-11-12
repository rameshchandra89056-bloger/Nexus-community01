/* ============================================================================
   profilefix.js — COMPLETE CODE (STRICT 50%-50% 2-BUTTON LAYOUT & 0.01s DM)
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

    function fixProfileButtons5050() {
        // Find the Member Full Profile modal on screen
        document.querySelectorAll("div").forEach(modal => {
            const text = modal.innerText || "";
            if (!text.includes("Member Full Profile") || !text.includes("Followers")) return;

            // 1. Remove any artificial duplicate message buttons injected by older scripts
            modal.querySelectorAll(".nx-msg-50, .nx-clean-dm-btn, .nx-injected-dm-btn").forEach(dup => dup.remove());

            // 2. Find all actual Follow and Message buttons inside this profile card
            const allBtns = Array.from(modal.querySelectorAll("button, a")).filter(b => {
                const t = (b.innerText || "").trim();
                return t.includes("Follow") || t.includes("Message");
            });

            if (allBtns.length === 0) return;

            const followBtn = allBtns.find(b => (b.innerText || "").includes("Follow"));
            const msgBtns = allBtns.filter(b => (b.innerText || "").includes("Message"));

            if (!followBtn) return;

            // Keep only ONE native Message button (delete any 3rd duplicate button)
            let nativeMsgBtn = msgBtns[msgBtns.length - 1] || null;
            if (msgBtns.length > 1) {
                for (let i = 0; i < msgBtns.length - 1; i++) {
                    msgBtns[i].remove();
                }
            }

            const rowContainer = followBtn.parentElement;
            if (!rowContainer) return;

            // Extract @handle from profile modal
            const handleMatch = text.match(/@([a-zA-Z0-9_]+)/);
            const targetHandle = handleMatch ? handleMatch[1] : "member";

            // If no native Message button exists at all, create one that triggers native DM
            if (!nativeMsgBtn) {
                nativeMsgBtn = document.createElement("button");
                nativeMsgBtn.type = "button";
                nativeMsgBtn.innerHTML = "💬 Message";
                nativeMsgBtn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    // Close profile modal
                    modal.querySelectorAll("button").forEach(b => {
                        const bt = (b.innerText || "").trim();
                        if (bt === "✕" || bt === "×" || bt === "X") b.click();
                    });
                    if (window.Nexus && typeof window.Nexus.openDM === "function") {
                        window.Nexus.openDM(targetHandle);
                    } else if (typeof window.openDMChat === "function") {
                        window.openDMChat(targetHandle);
                    }
                };
                rowContainer.appendChild(nativeMsgBtn);
            } else if (nativeMsgBtn.parentElement !== rowContainer) {
                rowContainer.appendChild(nativeMsgBtn);
            }

            // 3. Force the parent container into a strict 50% - 50% 2-Column Grid (Zero Overlap)
            rowContainer.style.cssText = `
                display: grid !important;
                grid-template-columns: 1fr 1fr !important;
                gap: 10px !important;
                width: 100% !important;
                margin: 12px 0 6px 0 !important;
                padding: 0 !important;
                align-items: center !important;
                box-sizing: border-box !important;
            `;

            // 4. Style Left 50% Button: + Follow / ✓ Following
            const isFollowing = (followBtn.innerText || "").includes("Following");
            followBtn.style.cssText = `
                width: 100% !important;
                min-width: 0 !important;
                height: 44px !important;
                margin: 0 !important;
                padding: 0 10px !important;
                background: ${isFollowing ? "#1e293b" : "#2563eb"} !important;
                color: #ffffff !important;
                border: ${isFollowing ? "1px solid #3b82f6" : "none"} !important;
                border-radius: 12px !important;
                font-size: 14px !important;
                font-weight: 700 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                white-space: nowrap !important;
                box-sizing: border-box !important;
                cursor: pointer !important;
                position: static !important;
            `;

            // 5. Style Right 50% Button: 💬 Message
            nativeMsgBtn.innerHTML = "💬 Message";
            nativeMsgBtn.style.cssText = `
                width: 100% !important;
                min-width: 0 !important;
                height: 44px !important;
                margin: 0 !important;
                padding: 0 10px !important;
                background: linear-gradient(135deg, #10b981, #059669) !important;
                color: #052e16 !important;
                border: none !important;
                border-radius: 12px !important;
                font-size: 14px !important;
                font-weight: 800 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                white-space: nowrap !important;
                box-sizing: border-box !important;
                cursor: pointer !important;
                position: static !important;
            `;

            // Bind instant Follow Notification once
            if (!followBtn.dataset.nxNotifBound) {
                followBtn.dataset.nxNotifBound = "true";
                followBtn.addEventListener("click", function() {
                    const me = getMyUser();
                    if (window.NexusNotify && typeof window.NexusNotify.push === "function") {
                        window.NexusNotify.push({
                            type: "follow",
                            title: "👤 New Follower!",
                            body: `${me.name} (${me.handle}) followed @${targetHandle}`,
                            toUser: targetHandle,
                            fromUser: me.username
                        });
                    }
                });
            }
        });
    }

    document.addEventListener("click", () => setTimeout(fixProfileButtons5050, 15));
    setInterval(fixProfileButtons5050, 250);
})();
