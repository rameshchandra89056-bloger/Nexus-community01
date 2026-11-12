/* ============================================================================
   profilefix.js — OFFICIAL MEMBER PROFILE (50-50 BUTTONS, 0.01s DM & FOLLOW)
   ============================================================================ */

(function() {
    function getMyUser() {
        try {
            return JSON.parse(localStorage.getItem("nexus_user") || localStorage.getItem("currentUser") || "{}") || { name: "Member", handle: "@member" };
        } catch (e) {
            return { name: "Member", handle: "@member" };
        }
    }

    // Direct 0.01s 1:1 Chat Box Opener (No intermediate screens)
    window.openDirectUserDM = function(targetHandle, targetName) {
        const cleanHandle = (targetHandle || "member").replace(/^@/, "");
        const displayName = targetName || cleanHandle;

        // Close Member Full Profile modal immediately
        document.querySelectorAll("div, section").forEach(modal => {
            if ((modal.innerText || "").includes("Member Full Profile")) {
                const closeBtn = modal.querySelector("button");
                if (closeBtn) closeBtn.click();
                else modal.style.display = "none";
            }
        });

        // 1. If native dm.js function exists, open chat box directly in 0.01s
        if (window.NexusDM && typeof window.NexusDM.openChatBox === "function") {
            window.NexusDM.openChatBox(cleanHandle, displayName);
            return;
        }
        if (typeof window.openOneToOneChat === "function") {
            window.openOneToOneChat(cleanHandle, displayName);
            return;
        }
    };

    // Format Profile Modal Buttons to exact 50% - 50% Equal Width
    function formatProfileButtons() {
        document.querySelectorAll("button").forEach(btn => {
            if (btn.dataset.nx5050Done) return;
            const text = (btn.innerText || "").trim().replace(/\s+/g, " ");

            if (text === "+ Follow" || text === "Following" || text === "✓ Following") {
                let profileModal = btn.parentElement;
                for (let i = 0; i < 6 && profileModal; i++) {
                    if ((profileModal.innerText || "").includes("Member Full Profile")) break;
                    profileModal = profileModal.parentElement;
                }
                if (!profileModal || !(profileModal.innerText || "").includes("Member Full Profile")) return;

                btn.dataset.nx5050Done = "true";

                // Remove any old duplicate message buttons inside this modal
                profileModal.querySelectorAll(".nx-clean-dm-btn, .nx-msg-50").forEach(old => old.remove());

                // Extract target user's @handle and Name
                const modalText = profileModal.innerText || "";
                const handleMatch = modalText.match(/@([a-zA-Z0-9_]+)/);
                const targetHandle = handleMatch ? handleMatch[1] : "member";
                const lines = modalText.split("\n").map(l => l.trim()).filter(Boolean);
                const handleIdx = lines.findIndex(l => l.includes("@" + targetHandle));
                const targetName = handleIdx > 0 ? lines[handleIdx - 1] : targetHandle;

                // Create a strict 50% - 50% 2-Column Container
                const row5050 = document.createElement("div");
                row5050.className = "nx-profile-5050-row";
                row5050.style.cssText = `
                    display: grid !important;
                    grid-template-columns: 1fr 1fr !important;
                    gap: 10px !important;
                    width: 100% !important;
                    margin: 12px 0 6px 0 !important;
                    align-items: center !important;
                `;

                btn.parentNode.insertBefore(row5050, btn);
                row5050.appendChild(btn);

                // Left 50% Button: + Follow
                const myUser = getMyUser();
                const followKey = "nx_flw_" + (myUser.username || "me") + "_" + targetHandle;
                const isFollowing = localStorage.getItem(followKey) === "true";

                btn.innerHTML = isFollowing ? "✓ Following" : "+ Follow";
                btn.style.cssText = `
                    width: 100% !important;
                    height: 42px !important;
                    margin: 0 !important;
                    padding: 0 12px !important;
                    background: ${isFollowing ? "#1e293b" : "#2563eb"} !important;
                    color: #ffffff !important;
                    border: ${isFollowing ? "1px solid #3b82f6" : "none"} !important;
                    border-radius: 11px !important;
                    font-size: 14px !important;
                    font-weight: 700 !important;
                    white-space: nowrap !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    cursor: pointer !important;
                `;

                btn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const nowFollowing = localStorage.getItem(followKey) !== "true";
                    localStorage.setItem(followKey, nowFollowing ? "true" : "false");

                    btn.innerHTML = nowFollowing ? "✓ Following" : "+ Follow";
                    btn.style.background = nowFollowing ? "#1e293b" : "#2563eb";
                    btn.style.border = nowFollowing ? "1px solid #3b82f6" : "none";

                    // Update Follower count in 0.01s
                    profileModal.querySelectorAll("div, span, b").forEach(el => {
                        if (el.children.length === 0 && (el.parentElement.innerText || "").includes("Followers")) {
                            const n = parseInt(el.innerText, 10);
                            if (!isNaN(n)) el.innerText = nowFollowing ? (n + 1) : Math.max(0, n - 1);
                        }
                    });

                    // Send real-time Follow Notification with sound
                    if (nowFollowing && window.NexusNotify) {
                        window.NexusNotify.push({
                            title: "New Follower! 🎉",
                            body: `${myUser.name || "A member"} (${myUser.handle || "@member"}) started following @${targetHandle}`,
                            toUser: targetHandle,
                            type: "follow"
                        });
                    }
                };

                // Right 50% Button: 💬 Message
                const msgBtn = document.createElement("button");
                msgBtn.type = "button";
                msgBtn.className = "nx-msg-50";
                msgBtn.innerHTML = "💬 Message";
                msgBtn.style.cssText = `
                    width: 100% !important;
                    height: 42px !important;
                    margin: 0 !important;
                    padding: 0 12px !important;
                    background: #1e293b !important;
                    color: #f8fafc !important;
                    border: 1px solid rgba(99, 102, 241, 0.45) !important;
                    border-radius: 11px !important;
                    font-size: 14px !important;
                    font-weight: 700 !important;
                    white-space: nowrap !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    cursor: pointer !important;
                `;

                msgBtn.onclick = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.openDirectUserDM(targetHandle, targetName);
                };

                row5050.appendChild(msgBtn);
            }
        });
    }

    document.addEventListener("click", () => setTimeout(formatProfileButtons, 30));
    setInterval(formatProfileButtons, 350);
})();
