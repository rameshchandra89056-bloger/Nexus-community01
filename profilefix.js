/* ============================================================================
   profilefix.js — GUARANTEED 50%-50% [+ Follow] & [💬 Message] BUTTONS
   - Never disappears (Creates 💬 Message if missing)
   - Never shows 3 buttons (Removes extra duplicate if 3rd appears)
   - Zero CPU Lag (No full-page innerText scanning during chat)
   ============================================================================ */

(function() {
    function openNativeChatForUser(handle, name) {
        const cleanH = (handle || "member").replace(/^@/, "").trim();

        // 1. Close Member Full Profile modal
        document.querySelectorAll("div").forEach(el => {
            if (el.children.length <= 6 && (el.innerText || "").includes("Member Full Profile")) {
                const closeBtn = el.parentElement ? el.parentElement.querySelector("button") : null;
                if (closeBtn) closeBtn.click();
            }
        });

        // 2. Call native DM opener from dm.js / dminbox.js / index.html
        const fnNames = ["openDMChat", "openDirectChat", "startDM", "openChatWith", "openDM", "openUserDM"];
        for (const fn of fnNames) {
            if (typeof window[fn] === "function") {
                try { window[fn](cleanH, name || cleanH); return; } catch (e) {}
            }
            if (window.Nexus && typeof window.Nexus[fn] === "function") {
                try { window.Nexus[fn](cleanH, name || cleanH); return; } catch (e) {}
            }
            if (window.NexusDM && typeof window.NexusDM.openChatBox === "function") {
                try { window.NexusDM.openChatBox(cleanH, name || cleanH); return; } catch (e) {}
            }
        }

        // 3. Fallback: trigger click on user's row in DM list
        const navs = document.querySelectorAll(".nx-nav-item, nav button, footer button");
        if (navs.length >= 2) navs[1].click();
        setTimeout(() => {
            document.querySelectorAll("button, div").forEach(b => {
                const t = (b.innerText || "").trim();
                if (t === "Open →" || t === "Open" || t.includes("Official DM")) b.click();
            });
            setTimeout(() => {
                document.querySelectorAll("div, button").forEach(row => {
                    const rt = (row.innerText || "").toLowerCase();
                    if (rt.includes("@" + cleanH.toLowerCase()) && rt.includes("chat")) {
                        row.click();
                    }
                });
            }, 180);
        }, 120);
    }

    function ensureTwoProfileButtons() {
        // Fast check: only run if a profile modal is actually visible on screen
        const allButtons = document.querySelectorAll("button");
        let followBtn = null;

        for (let i = 0; i < allButtons.length; i++) {
            const b = allButtons[i];
            const txt = (b.textContent || "").trim();
            if (txt === "+ Follow" || txt === "Following" || txt === "✓ Following") {
                followBtn = b;
                break;
            }
        }

        if (!followBtn) return;

        // Walk up to find the Member Full Profile container
        let modalCard = followBtn.parentElement;
        let isProfile = false;
        for (let d = 0; d < 6 && modalCard; d++) {
            const tc = modalCard.textContent || "";
            if (tc.includes("Member Full Profile") || tc.includes("SHARED POSTS")) {
                isProfile = true;
                break;
            }
            modalCard = modalCard.parentElement;
        }
        if (!isProfile || !modalCard) return;

        // Extract @handle and Name of the member
        const cardText = modalCard.textContent || "";
        const handleMatch = cardText.match(/@([a-zA-Z0-9_]+)/);
        const targetHandle = handleMatch ? handleMatch[1] : "member";

        // Find all Message buttons currently inside this profile card
        const msgButtons = Array.from(modalCard.querySelectorAll("button")).filter(b => {
            return b !== followBtn && (b.textContent || "").includes("Message");
        });

        let msgBtn = msgButtons[0] || null;

        // If 3rd/extra duplicate Message buttons exist, remove extras so ONLY 1 Message button remains
        if (msgButtons.length > 1) {
            for (let k = 1; k < msgButtons.length; k++) {
                msgButtons[k].remove();
            }
        }

        // If NO Message button exists (like in Screenshot 48), CREATE IT immediately!
        if (!msgBtn) {
            msgBtn = document.createElement("button");
            msgBtn.type = "button";
            msgBtn.className = "nx-guaranteed-msg-btn";
            msgBtn.innerHTML = "💬 Message";
            msgBtn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                openNativeChatForUser(targetHandle, targetHandle);
            };
        } else {
            msgBtn.innerHTML = "💬 Message";
        }

        // Put both [+ Follow] and [💬 Message] inside a strict 50% - 50% side-by-side row
        let row = modalCard.querySelector(".nx-strict-5050-row");
        if (!row) {
            row = document.createElement("div");
            row.className = "nx-strict-5050-row";
            row.style.cssText = `
                display: grid !important;
                grid-template-columns: 1fr 1fr !important;
                gap: 10px !important;
                width: 100% !important;
                margin: 12px 0 6px 0 !important;
                align-items: center !important;
                box-sizing: border-box !important;
            `;
            followBtn.parentNode.insertBefore(row, followBtn);
        }

        if (followBtn.parentElement !== row) row.appendChild(followBtn);
        if (msgBtn.parentElement !== row) row.appendChild(msgBtn);

        // Style Left 50%: + Follow / Following
        followBtn.style.cssText = `
            width: 100% !important;
            height: 42px !important;
            margin: 0 !important;
            padding: 0 10px !important;
            background: ${(followBtn.textContent || "").includes("Following") ? "#1e293b" : "#2563eb"} !important;
            color: #ffffff !important;
            border: ${(followBtn.textContent || "").includes("Following") ? "1px solid #3b82f6" : "none"} !important;
            border-radius: 12px !important;
            font-size: 14px !important;
            font-weight: 700 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            white-space: nowrap !important;
            cursor: pointer !important;
            box-sizing: border-box !important;
        `;

        // Style Right 50%: 💬 Message
        msgBtn.style.cssText = `
            width: 100% !important;
            height: 42px !important;
            margin: 0 !important;
            padding: 0 10px !important;
            background: #1e293b !important;
            color: #f8fafc !important;
            border: 1px solid rgba(99, 102, 241, 0.55) !important;
            border-radius: 12px !important;
            font-size: 14px !important;
            font-weight: 700 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            white-space: nowrap !important;
            cursor: pointer !important;
            box-sizing: border-box !important;
        `;
    }

    // Trigger ONLY on clicks (Zero background CPU lag while chatting!)
    document.addEventListener("click", () => {
        setTimeout(ensureTwoProfileButtons, 20);
        setTimeout(ensureTwoProfileButtons, 150);
        setTimeout(ensureTwoProfileButtons, 400);
    });
})();
