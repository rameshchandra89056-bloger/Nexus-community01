# Is repair package mein actual changes

1. Original 39-file Nexus source ko base banaya; existing active UI/feature modules ko preserve kiya.
2. Original `index.html` mein Cloudflare host par Netlify-only 72px nav gap zero hota hai. Original Netlify host par 72px gap unchanged.
3. Mobile modal safe-area and scroll behavior improve kiya; theme/layout design ko redesign nahi kiya.
4. `core.js` local same-origin modules ordered load karta hai; repeated GitHub fetch/execute polling removed.
5. Duplicate Watch Party global collision fix: `live.js` active engine; `ytparty.js` auto-load list se removed because both overwrite `window.NexusWatchParty`.
6. Corrupt/unused `watchparty.js` ko harmless legacy stub banaya; active Watch Party `live.js` mein rahta hai.
7. Firestore account/post listeners mein error logging add ki, taaki `permission-denied` blank feed ke peeche chhupe nahi.
8. Old admin Vault ko temporary maintenance page banaya. Original unsafe vault source ZIP root par `VAULT-LEGACY-BACKUP.html` mein backup hai; is backup ko deploy folder mein upload na karein.
9. Cloudflare `_headers` file add ki.

Not done / requires owner-side work:
- Google Auth UID-based login and old account claiming.
- Secure Firestore rules for old collections.
- Old data export/import into new Firebase project.
- Real live test for Firestore, Storage, DM, group chat, Watch Party, mic/camera.

Legacy old posts are in old Firebase project `nexus-community-bf99c`. They won't display while its active Rules deny all reads. The ZIP cannot bypass Firebase Rules. Do not restore public write access.
