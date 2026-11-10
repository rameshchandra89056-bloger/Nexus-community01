# Nexus Community — Original UI Repair for Cloudflare (Hindi)

## Is ZIP mein kya hai
- Original `index.html` aur original feature modules/asset files preserve kiye gaye hain.
- Cloudflare ke liye Netlify-only 72px bottom-navigation clearance automatically zero hoti hai; Netlify par purana clearance rahta hai.
- Modal overlays mein mobile safe-area padding aur internal scrolling improve ki gayi hai.
- `core.js` ab modules ko same-origin se sequential load karta hai; har 6 seconds external GitHub se JS fetch/execute nahi karta.
- `live.js` ko active YouTube/MP3 Watch Party engine rakha hai. `ytparty.js` ko auto-load nahi kiya kyunki dono `window.NexusWatchParty` ko overwrite karte hain; is conflict se buttons ka wrong engine call hona sambhav tha.
- Unused legacy `watchparty.js` ke malformed `||` tokens repair kiye, lekin duplicate engine ke roop mein auto-load nahi kiya.
- Firestore listener errors console mein clear code ke saath show hote hain, taaki permission-denied ko blank feed samajhkar guess na karna pade.
- Cloudflare `_headers` add kiya.
- Unsafe legacy `vault.html` ko temporary maintenance page se replace kiya. Original source copy `VAULT-LEGACY-BACKUP.html` project ZIP ke deploy root ke bahar rakhi hai.

## Cloudflare Pages deploy
- Framework preset: None
- Build command: `exit 0`
- Build output directory: `.`
- Root directory: `nexus-v2`
- Staging branch alag banayein; `main`/production ko abhi replace na karein.

## Purane posts kyun nahi dikh rahe?
Original entry page abhi bhi previous Firebase project `nexus-community-bf99c` ko target karti hai. Isse aapke old project ke collections hi read honge, blank `Nexus-community02` nahi.

Lekin agar old project's Firestore Rules mein temporary `allow read, write: if false` (deny-all) published hai, browser existing posts ko read nahi kar sakta. Posts database se delete nahi hue; access deny hai. Code alone is block ko bypass nahi kar sakta. Never restore `allow read, write: if true`.

Old posts ko safely restore karne ke liye existing collection schema ke hisaab se granular read rules aur Google UID/account migration karna hoga. `nexus_accounts` mein legacy `pin` field hai, isliye poori collection ko public-read karna unsafe hai. Private DM/group collections ko bhi public nahi karna.

## Important: this is a repaired original UI staging package, not the final secure production migration
- Legacy username/PIN and `localStorage` identity have NOT been converted to Firebase Google UID login here.
- Current production deny-all rules will block Firestore-dependent actions (feed, accounts, posts, DMs, groups, Watch Party sync, notifications).
- Stage 1 Google auth starter is not integrated into all existing legacy modules yet.
- Account migration for the 70 existing members, secure Storage/DM rules and live two-account tests remain required before final cutover.
- Admin Vault is temporarily disabled because its original client-side page displayed account PINs and private DMs. Do not restore it until server-authorized admin implementation exists.

## Upload
1. Extract ZIP.
2. Upload the CONTENTS of `nexus-v2/` into a folder named `nexus-v2/` in a separate GitHub staging branch.
3. Keep the project root file `README-START-HERE-HI.md` as documentation; `VAULT-LEGACY-BACKUP.html` is a backup only and MUST NOT be copied into deploy folder.
4. Commit to staging only; do not merge into `main` until tests and Firebase rules are complete.

## GitHub branch upload (fast)
1. Create/use branch `nexus-v2-cloudflare-preview` (or another branch beginning `nexus-v2-`).
2. Replace the complete contents of repository folder `nexus-v2/` with the ZIP's `nexus-v2/` contents.
3. Copy the ZIP's `.github/workflows/nexus-v2-ci.yml` into the same exact path in the repository, replacing the older Vite-based workflow if present.
4. Keep the original `main` branch untouched.
5. GitHub Actions will run syntax and required-file checks.

## Cloudflare Pages
Repository: your Nexus repository
Production branch for this staging Pages project: `nexus-v2-cloudflare-preview`
Root directory: `nexus-v2`
Framework preset: None
Build command: `exit 0`
Build output directory: `.`
No VITE_* variables are required by this original-source package; the original Firebase web config remains in `index.html`.
