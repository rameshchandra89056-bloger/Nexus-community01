/* ============================================================================
   profilefix.js — STRICT 2-BUTTON (50% - 50%) PROFILE LAYOUT (NO 3RD BUTTON!)
   ============================================================================ */

(function() {
    function fixMemberProfileModal() {
        // Find Member Full Profile modal
        document.querySelectorAll("div").forEach(modal => {
            const mText = modal.innerText || "";
            if (!mText.includes("Member Full Profile") || !mText.includes("Followers")) return;

            // Remove any extra duplicate message buttons created earlier
            modal.querySelectorAll(".nx-msg-50, .nx-clean-dm-btn, .nx-injected-dm-btn").forEach(dup => dup.remove());

            // Find all buttons inside the profile card (excluding the top 'X' close button)
            const cardButtons = Array.from(modal.querySelectorAll("button")).filter(b => {
                const t = (b.innerText || "").trim();
                return t.includes("Follow") || t.includes("Message");
            });

            if (cardButtons.length === 0) return;

            const followBtn = cardButtons.find(b => (b.innerText || "").includes("Follow"));
            let msgBtn = cardButtons.find(b => (b.innerText || "").includes("Message"));

            if (!followBtn) return;

            // Remove any 3rd duplicate Message button if more than 1 exists
            cardButtons.forEach(b => {
                if (b !== followBtn && b !== msgBtn) b.remove();
            });

            const parentRow = followBtn.parentElement;
            if (!parentRow) return;

            // Style parent container as a strict 2-column 50% - 50% grid
            parentRow.style.cssText = `
                display: grid !important;
                grid-template-columns: 1fr 1fr !important;
                gap: 10px !important;
                width: 100% !important;
                margin: 12px 0 6px 0 !important;
                align-items: center !important;
                box-sizing: border-box !important;
            `;

            // Style Button 1: Follow / Following (Left 50%)
            followBtn.style.cssText = `
                width: 100% !important;
                height: 42px !important;
                margin: 0 !important;
                padding: 0 10px !important;
                border-radius: 12px !important;
                font-size: 14px !important;
                font-weight: 700 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                white-space: nowrap !important;
                box-sizing: border-box !important;
                cursor: pointer !important;
            `;

            // Style Button 2: Native Message Button (Right 50%)
            if (msgBtn) {
                if (msgBtn.parentElement !== parentRow) {
                    parentRow.appendChild(msgBtn);
                }
                msgBtn.innerHTML = "💬 Message";
                msgBtn.style.cssText = `
                    width: 100% !important;
                    height: 42px !important;
                    margin: 0 !important;
                    padding: 0 10px !important;
                    background: linear-gradient(135deg, #10b981, #059669) !important;
                    color: #000000 !important;
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
                `;
            }
        });
    }

    document.addEventListener("click", () => setTimeout(fixMemberProfileModal, 20));
    setInterval(fixMemberProfileModal, 300);
})();
