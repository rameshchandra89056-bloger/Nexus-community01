// ================= EMOJIS.JS: 😊 300+ LAG-FREE GBOARD EMOJI & STICKER KEYBOARD FOR GROUP CHAT & 1:1 DM =================

(function() {
    const GBOARD_CATEGORIES = {
        faces: [
            "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩",
            "😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🫢","🫣","🤫",
            "🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😏","😒","🙄","😬","😮‍💨","🤥","😌","😔",
            "😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","😵‍💫","🤯","🤠",
            "🥳","🥸","😎","🤓","🧐","😕","🫤","😟","🙁","☹️","😮","😯","😲","😳","🥺","🥹",
            "😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤",
            "😡","😠","🤬","😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖","😺"
        ],
        love: [
            "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹","❣️","💕","💞","💓",
            "💗","💖","💘","💝","💟","💌","💋","💯","💢","💥","💫","💦","💨","🕳️","💤","👋",
            "🤚","🖐️","✋","🖖","🫱","🫲","🫳","🫴","👌","🤌","🤏","✌️","🤞","🫰","🤟","🤘",
            "🤙","👈","👉","👆","🖕","👇","☝️","🫵","👍","👎","✊","👊","🤛","🤜","👏","🙌",
            "🫶","👐","🤲","🤝","🙏","✍️","💅","🤳","💪","🦾","🧠","🫀","👀","👁️","🫦","🌹"
        ],
        study: [
            "🔥","🚀","⚡","👑","🏆","🎯","💎","🌟","✨","🎉","🎊","🎈","🥇","🥈","🥉","🏅",
            "📚","📖","📝","✏️","✒️","🖊️","🖋️","📐","📏","🧮","🔬","🔭","🧪","🧫","🧬","💻",
            "🖥️","⌨️","🖱️","📱","🔋","💡","🔦","🕯️","⏰","⏱️","⏲️","⏳","⌛","📅","📆","📌",
            "📍","📎","🖇️","📏","✂️","🗂️","📁","📂","📰","📊","📈","📉","🎓","🎒","☕","🍵"
        ],
        fun: [
            "⚽","🏀","🏈","⚾","🎾","🏐","🏉","🎱","🏓","🏸","🥅","🏒","🏏","🥊","🥋","🎮",
            "🕹️","🎲","♟️","🎭","🎨","🎬","🎤","🎧","🎼","🎹","🥁","🎷","🎺","🎸","🎻","🍕",
            "🍔","🍟","🌭","🍿","🧂","🥓","🥚","🍳","🧇","🥞","🧈","🍞","🥐","🥨","🥯","🥖",
            "🧀","🥗","🥙","🥪","🌮","🌯","🫔","🥫","🍖","🍗","🥩","🍠","🥟","🥠","🥡","🍱",
            "🍘","🍙","🍚","🍛","🍜","🦪","🍣","🍤","🍥","🥮","🍢","🧆","🍧","🍨","🍦","🍰",
            "🎂","🧁","🥧","🍮","🍭","🍬","🍫","🍩","🍪","🌰","🥜","🍯","🥛","🍼","🫖","🥤"
        ]
    };

    let activeGroupEmojiTab = 'faces';
    let activeDmEmojiTab = 'faces';

    const emStyle = document.createElement('style');
    emStyle.innerHTML = `
        #nx-clean-emoji-strip {
            display: none !important;
        }
        .nx-gboard-mode-bar {
            display: flex;
            gap: 6px;
            margin-bottom: 7px;
            overflow-x: auto;
            scrollbar-width: none;
        }
        .nx-gboard-mode-btn {
            background: #182229;
            color: #cbd5e1;
            border: 1px solid #2a3942;
            padding: 5px 10px;
            border-radius: 14px;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
            cursor: pointer;
        }
        .nx-gboard-mode-btn.active {
            background: #00a884;
            color: #020617;
            border-color: #00a884;
        }
        .nx-gboard-emoji-cell {
            background: #182229;
            border: 1px solid #233138;
            border-radius: 10px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 23px;
            cursor: pointer;
            user-select: none;
        }
        .nx-gboard-emoji-cell:active {
            transform: scale(1.25);
            background: #00a884;
        }
    `;
    document.head.appendChild(emStyle);

    function upgradeGroupAndDmGboardKeyboards() {
        // 1. Upgrade Group Chat Sticker/Emoji Drawer (#nx-chat-sticker-drawer)
        const grpDrawer = document.getElementById('nx-chat-sticker-drawer');
        if (grpDrawer && !grpDrawer.getAttribute('data-gboard-v2')) {
            grpDrawer.setAttribute('data-gboard-v2', '1');
            const chipRow = grpDrawer.querySelector('div:nth-child(2)');
            if (chipRow) {
                chipRow.className = 'nx-gboard-mode-bar';
                chipRow.innerHTML = `
                    <button type="button" class="nx-gboard-mode-btn active" onclick="NexusEmojis.switchGroupTab('faces', this)">😀 Faces (110+)</button>
                    <button type="button" class="nx-gboard-mode-btn" onclick="NexusEmojis.switchGroupTab('love', this)">❤️ Love &amp; Hands</button>
                    <button type="button" class="nx-gboard-mode-btn" onclick="NexusEmojis.switchGroupTab('study', this)">🔥 Hype &amp; Study</button>
                    <button type="button" class="nx-gboard-mode-btn" onclick="NexusEmojis.switchGroupTab('fun', this)">🍕 Fun &amp; Sports</button>
                    <button type="button" class="nx-gboard-mode-btn" onclick="NexusEmojis.switchGroupTab('stickers', this)">✨ 3D Stickers</button>
                `;
                setTimeout(() => NexusEmojis.renderGroupPad('faces'), 40);
            }
        }

        // 2. Upgrade 1:1 DM Sticker/Emoji Drawer (#nx-dm-sticker-drawer)
        const dmDrawer = document.getElementById('nx-dm-sticker-drawer');
        if (dmDrawer && !dmDrawer.getAttribute('data-gboard-v2')) {
            dmDrawer.setAttribute('data-gboard-v2', '1');
            const dmChipRow = dmDrawer.querySelector('div:nth-child(2)');
            if (dmChipRow) {
                dmChipRow.className = 'nx-gboard-mode-bar';
                dmChipRow.innerHTML = `
                    <button type="button" class="nx-gboard-mode-btn active" onclick="NexusEmojis.switchDmTab('faces', this)">😀 Faces (110+)</button>
                    <button type="button" class="nx-gboard-mode-btn" onclick="NexusEmojis.switchDmTab('love', this)">❤️ Love &amp; Hands</button>
                    <button type="button" class="nx-gboard-mode-btn" onclick="NexusEmojis.switchDmTab('study', this)">🔥 Hype &amp; Study</button>
                    <button type="button" class="nx-gboard-mode-btn" onclick="NexusEmojis.switchDmTab('fun', this)">🍕 Fun &amp; Sports</button>
                    <button type="button" class="nx-gboard-mode-btn" onclick="NexusEmojis.switchDmTab('stickers', this)">✨ 3D Stickers</button>
                `;
                setTimeout(() => NexusEmojis.renderDmPad('faces'), 40);
            }
        }
    }

    window.NexusEmojis = {
        switchGroupTab: function(tab, btnEl) {
            activeGroupEmojiTab = tab;
            const bar = btnEl ? btnEl.parentNode : null;
            if (bar) bar.querySelectorAll('.nx-gboard-mode-btn').forEach(b => b.classList.remove('active'));
            if (btnEl) btnEl.classList.add('active');
            this.renderGroupPad(tab);
        },

        renderGroupPad: function(tab) {
            const grid = document.getElementById('nx-chat-stk-grid');
            if (!grid) return;

            if (tab === 'stickers') {
                grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
                if (window.NexusChat && NexusChat.renderRoomStickers) {
                    NexusChat.renderRoomStickers('all', '');
                }
                return;
            }

            let list = GBOARD_CATEGORIES[tab] || GBOARD_CATEGORIES.faces;
            grid.style.gridTemplateColumns = 'repeat(7, 1fr)';
            grid.innerHTML = list.map(em => `
                <div class="nx-gboard-emoji-cell" onclick="NexusEmojis.typeEmoji('nx-chat-msg-in', '${em}')">${em}</div>
            `).join('');
        },

        switchDmTab: function(tab, btnEl) {
            activeDmEmojiTab = tab;
            const bar = btnEl ? btnEl.parentNode : null;
            if (bar) bar.querySelectorAll('.nx-gboard-mode-btn').forEach(b => b.classList.remove('active'));
            if (btnEl) btnEl.classList.add('active');
            this.renderDmPad(tab);
        },

        renderDmPad: function(tab) {
            const grid = document.getElementById('nx-cloud-stk-grid');
            if (!grid) return;

            if (tab === 'stickers') {
                grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
                if (window.NexusDM && NexusDM.renderStickerGrid) {
                    NexusDM.renderStickerGrid('all', '');
                }
                return;
            }

            let list = GBOARD_CATEGORIES[tab] || GBOARD_CATEGORIES.faces;
            grid.style.gridTemplateColumns = 'repeat(7, 1fr)';
            grid.innerHTML = list.map(em => `
                <div class="nx-gboard-emoji-cell" onclick="NexusEmojis.typeEmoji('nx-dm-input', '${em}')">${em}</div>
            `).join('');
        },

        typeEmoji: function(inputId, emojiChar) {
            const inp = document.getElementById(inputId);
            if (!inp) return;
            inp.value = (inp.value || '') + emojiChar;
        }
    };

    if (window.NexusChat) {
        const origToggleGrp = NexusChat.toggleStickerDrawer.bind(NexusChat);
        NexusChat.toggleStickerDrawer = function() {
            origToggleGrp();
            setTimeout(() => {
                upgradeGroupAndDmGboardKeyboards();
                NexusEmojis.renderGroupPad(activeGroupEmojiTab);
            }, 30);
        };
    }

    document.addEventListener('DOMContentLoaded', () => {
        setInterval(upgradeGroupAndDmGboardKeyboards, 600);
    });
    setTimeout(upgradeGroupAndDmGboardKeyboards, 200);
})();
