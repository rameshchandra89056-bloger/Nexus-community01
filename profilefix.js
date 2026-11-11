// ================= PROFILEFIX.JS (v80.0 SAFE USER SYNC — NEVER OVERWRITES NEXUSDM OR NEXUSCHAT!) =================

(function() {
    // Automatically sync all accounts from Firestore into Nexus.users so all members & chats always show up!
    function syncAllUsersFromFirestore() {
        if (!window.Nexus || !Nexus.db || window.__nxUsersSyncedV80) return;
        window.__nxUsersSyncedV80 = true;

        Nexus.db.collection("nexus_accounts").limit(200).onSnapshot(snap => {
            if (!Array.isArray(Nexus.users)) Nexus.users = [];
            snap.forEach(doc => {
                const d = doc.data();
                if (!d) return;
                const uname = (d.username || doc.id || '').trim();
                if (!uname) return;
                d.username = uname;
                const idx = Nexus.users.findIndex(u => u && u.username && u.username.toLowerCase() === uname.toLowerCase());
                if (idx >= 0) {
                    Nexus.users[idx] = Object.assign({}, Nexus.users[idx], d);
                } else {
                    Nexus.users.push(d);
                }
            });
            try {
                localStorage.setItem('nexus_users_backup_v80', JSON.stringify(Nexus.users));
            } catch (e) {}
        }, () => {});
    }

    setInterval(syncAllUsersFromFirestore, 1000);
})();
// === END OF PROFILEFIX.JS ===
