/* ============================================================================
   ai.js — ALL-ROUNDER AI (ANSWERS ALL JEE/CODING/GENERAL QUESTIONS + NEXUS INFO)
   ============================================================================ */

(function() {
    async function fetchUniversalAIReply(userPrompt) {
        const q = userPrompt.toLowerCase();

        // 1. Admin live status setter
        if (q.startsWith("status:")) {
            const newSt = userPrompt.substring(7).trim();
            localStorage.setItem("nexus_server_status", newSt);
            if (window.firebase && firebase.database) {
                firebase.database().ref("nexus_system/server_status").set(newSt);
            }
            return "✅ **Server Status Updated!** Ab sabhi members ko yeh live update dikhega:\n" + newSt;
        }

        // 2. Official Nexus & Owner Questions
        if (q.includes("nexus owner") || q.includes("kisne banaya") || (q.includes("owner") && q.includes("nexus"))) {
            return "👑 **Nexus Official Info:** Nexus Platform ke Founder, Owner aur Lead Developer **Mohit** (`@mohit_01`) hain.";
        }
        if (q.includes("server down") || q.includes("server status")) {
            return "📡 **Nexus Live Server Status:** " + (localStorage.getItem("nexus_server_status") || "🟢 Sabhi Nexus Servers (1:1 DM, Watch Party, Study Vault & Feed) 100% Online aur superfast chal rahe hain!");
        }

        // 3. Universal AI Engine (Answers ALL Physics, Chemistry, Maths, Coding & General Questions)
        try {
            const sysPrompt = "You are Nexus AI (created by Mohit @mohit_01 for Nexus Student Community). Answer every question (IIT-JEE Physics, Chemistry, Maths, Coding, General Knowledge, or Nexus Platform help) clearly, accurately, and in friendly Hinglish/English.";
            const url = `https://text.pollinations.ai/${encodeURIComponent(sysPrompt + "\n\nUser Question: " + userPrompt)}`;
            const res = await fetch(url);
            if (res.ok) {
                const text = await res.text();
                if (text && text.trim()) return text.trim();
            }
        } catch (e) {}

        return "⚡ Main Nexus AI hoon! Aap mujhse IIT-JEE (Physics, Chemistry, Maths), Coding, ya Nexus Platform ke bare mein kuch bhi pooch sakte hain.";
    }

    window.openNexusOfficialAI = function() {
        const old = document.getElementById("nx-universal-ai-modal");
        if (old) { old.remove(); return; }

        const modal = document.createElement("div");
        modal.id = "nx-universal-ai-modal";
        modal.style.cssText = "position:fixed;inset:0;z-index:2147483646;background:var(--nx-bg, #090d16);color:var(--nx-text, #fff);display:flex;flex-direction:column;font-family:system-ui,sans-serif;";

        modal.innerHTML = `
            <div style="background:var(--nx-card, #111827);padding:14px 18px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(148,163,184,0.15);">
                <div>
                    <div style="font-weight:800;font-size:17px;color:#60a5fa;">🤖 Nexus Super AI Studio</div>
                    <div style="font-size:11px;color:#10b981;">● Answers All JEE Doubts, Coding, GK & Official Nexus Info</div>
                </div>
                <button id="nx-ai-close" style="background:#ef4444;color:#fff;border:none;padding:6px 12px;border-radius:8px;font-weight:800;cursor:pointer;">✕</button>
            </div>
            <div id="nx-ai-chat-body" style="flex:1;padding:16px;overflow-y:auto;display:flex;flex-direction:column;gap:12px;">
                <div style="background:rgba(30,41,59,0.85);color:#f8fafc;border-left:4px solid #6366f1;padding:14px;border-radius:12px;font-size:14px;line-height:1.55;">
                    👋 <b>Namaste! Main Nexus AI hoon.</b><br>
                    Aap mujhse <b>IIT-JEE / NEET ke Doubts, Formulas, Coding, General Questions</b> ya <b>Nexus Website</b> ke bare mein kuch bhi pooch sakte hain!
                </div>
            </div>
            <div style="padding:12px 14px;background:var(--nx-card, #111827);display:flex;gap:8px;border-top:1px solid rgba(148,163,184,0.15);">
                <input id="nx-ai-prompt" type="text" placeholder="Ask any JEE doubt, coding question, or Nexus info..." style="flex:1;padding:12px;border-radius:10px;outline:none;font-size:14px;">
                <button id="nx-ai-send" style="background:#4f46e5;color:#fff;border:none;padding:0 18px;border-radius:10px;font-weight:800;cursor:pointer;">Ask</button>
            </div>
        `;
        document.body.appendChild(modal);

        const body = document.getElementById("nx-ai-chat-body");
        const inp = document.getElementById("nx-ai-prompt");
        document.getElementById("nx-ai-close").onclick = () => modal.remove();

        const send = async () => {
            const val = inp.value.trim();
            if (!val) return;
            inp.value = "";
            body.innerHTML += `<div style="align-self:flex-end;background:#4f46e5;color:#fff;padding:10px 14px;border-radius:12px;font-size:14px;max-width:82%;">${val}</div>`;
            const loadId = "ai_load_" + Date.now();
            body.innerHTML += `<div id="${loadId}" style="align-self:flex-start;background:rgba(30,41,59,0.85);color:#93c5fd;padding:10px 14px;border-radius:12px;font-size:13px;">⚡ Thinking...</div>`;
            body.scrollTop = body.scrollHeight;

            const reply = await fetchUniversalAIReply(val);
            const loader = document.getElementById(loadId);
            if (loader) {
                loader.style.color = "#f8fafc";
                loader.innerHTML = reply.replace(/\n/g, "<br>");
            }
            body.scrollTop = body.scrollHeight;
        };

        document.getElementById("nx-ai-send").onclick = send;
        inp.onkeydown = (e) => { if (e.key === "Enter") send(); };
    };

    document.addEventListener("click", (e) => {
        const btn = e.target.closest("button, a");
        if (!btn) return;
        const t = (btn.innerText || "").trim();
        if (t === "AI" || t.includes("🤖 AI") || t === "Ask 1:1" || t === "Ask AI") {
            e.preventDefault();
            window.openNexusOfficialAI();
        }
    });
})();
