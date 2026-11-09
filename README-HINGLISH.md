# Nexus V2 — Security Foundation (Stage 0)

Ye folder sirf Nexus V2 ke isolated development/testing foundation ke liye hai.
Isse old Nexus ke root files replace nahi hote aur old website ka `index.html`
change nahi hota.

## Is package mein kya hai?

- `firestore.rules`: temporary deny-all baseline.
- `firebase.json`: local Firestore Emulator ko isi Rules file se chalata hai.
- `tests/firestore.rules.test.cjs`: checks that anonymous aur signed-in browser
  clients dono read/write/update/delete nahi kar sakte.
- `package.json`: isolated rules test command aur development dependencies.

## Bahut zaroori deployment warning

`firestore.rules` jaan-boojhkar sab browser/client access deny karta hai.
Isko production par deploy karne se Nexus ke Firestore-dependent features
(feed, profiles, chat, DMs, notifications, etc.) kaam nahi karenge.

Isliye:
1. Is package ko pehle alag Git branch `nexus-v2-security-baseline` par commit karein.
2. `main` branch par existing files overwrite/delete na karein.
3. Is folder se `firebase deploy` ya `firebase deploy --only firestore:rules`
   abhi run na karein.
4. Production Firestore Rules ko Console mein agar already deny-all par lock kiya
   hai, us setting ko bina reviewed V2 rules ke wapas public na karein.
5. Google Auth aur current app modules abhi integrated nahi hain; ye package
   Google login ya old website ke features ko by itself enable nahi karta.

## Local test (developer computer / GitHub Actions environment)

Node.js 18+ aur Java 11+ chahiye.

```bash
npm install
npm run test:rules
```

Successful run mein dono tests pass hone chahiye. Ye local emulator test hai;
production Firebase par koi document create, update ya delete nahi hota.

## Current source audit notes

Uploaded source ZIP par static inspection mein:

- Current app modules mein Firebase Authentication sign-in flow nahi mila.
- `profile.js` old username/PIN flow se `nexus_accounts` read/write karta hai aur
  `localStorage` mein `nx_active_account` rakhta hai.
- `core.js` remote GitHub-hosted JavaScript modules fetch karke execute karta hai
  aur 6-second interval par module checks karta hai.
- `index.html` Firestore `nexus_config/live_version` se module names lekar
  hot-reload karta hai.
- `vault.html` client-side PIN gate ke baad account/private-DM collections read
  karta hai aur PIN values render karne ka code rakhta hai. Isko V2 mein same
  tarah copy nahi karna hai.
- `watchparty.js` Node syntax check pass nahi karta; jab tak repair/test na ho,
  usko load nahi karna hai.
- Archive mein Firestore Rules, Storage Rules, Realtime Database Rules aur
  `firebase.json` nahi mile.

Ye static source findings hain; live Firebase Console settings ka independent
verification nahi hain.

## Next gate before production

1. Existing data ka restorable backup verify.
2. Google Firebase Authentication integration.
3. UID-based account/profile mapping.
4. Actual collection/document schema freeze.
5. Per-collection Firestore Rules + positive/negative emulator tests.
6. Storage and Realtime Database Rules alag se test.
7. Har feature ko staging mein verify karke hi production migration.

Kisi secret, service-account JSON, private key, password, ya `.env` file ko
GitHub par commit na karein.
