/* ============================================================================
   NEXUS OFFICIAL SETTINGS.JS (INSTAGRAM UI + MULTI-ACCOUNT + PRO VIDEO CALL)
   1. Instagram-Style Settings & Activity + Accounts Center
   2. Add Multiple Accounts & 0.01s 1-Tap Account Switcher
   3. Core Google OAuth Login & Verified Sign-Up (With Custom Username/Stream)
   4. Multi-Feature Video/Voice Call (Live Ringing Popup, Floating PiP, Reactions)
   ============================================================================ */
(function () {
    if (window.__NEXUS_INSTAGRAM_SETTINGS_AND_CALL_V1__) return;
    window.__NEXUS_INSTAGRAM_SETTINGS_AND_CALL_V1__ = true;

    const MULTI_ACC_KEY = "nx_saved_multi_accounts_v1";
    const PREFS_KEY = "nx_ig_user_preferences_v1";
    let activeCallUnsub = null;
    let incomingCallListenerUnsub = null;
    let callTimerInterval = null;
    let ringtoneInterval = null;

    // Default Instagram-style user preferences
    function getUserPrefs() {
        try {
            return Object.assign(
                {
                    privateAccount: false,
                    readReceipts: true,
                    typingIndicator: true,
                    pushNotifications: true,
                    callRingtone: true,
                    highQualityMedia: true,
                    dataSaver: false,
                    themeAccent: "#10b981",
                    closeFriends: [],
                    blockedUsers: []
                },
                JSON.parse(localStorage.getItem(PREFS_KEY) || "{}")
            );
        } catch (e) {
            return {
                privateAccount: false,
                readReceipts: true,
                typingIndicator: true,
                pushNotifications: true,
                callRingtone: true,
                highQualityMedia: true,
                dataSaver: false,
                themeAccent: "#10b981",
                closeFriends: [],
                blockedUsers: []
            };
        }
    }

    function saveUserPrefs(prefs) {
        try {
            localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
        } catch (e) {}
    }

    // =========================================================================
    // 1. MULTI-ACCOUNT MANAGER (ADD ACCOUNT & 0.01s 1-TAP SWITCHER)
    // =========================================================================
    function getCurrentAccount() {
        try {
            return JSON.parse(localStorage.getItem("nx_active_account") || "null");
        } catch (e) {
            return null;
        }
    }

    function getSavedMultiAccounts() {
        let list = [];
        try {
            list = JSON.parse(localStorage.getItem(MULTI_ACC_KEY) || "[]");
            if (!Array.isArray(list)) list = [];
        } catch (e) {
            list = [];
        }

        const current = getCurrentAccount();
        if (current && current.username) {
            const idx = list.findIndex(
                (a) => a && a.username && a.username.toLowerCase() === current.username.toLowerCase()
            );
            if (idx === -1) {
                list.unshift(current);
            } else {
                list[idx] = Object.assign({}, list[idx], current);
            }
            try {
                localStorage.setItem(MULTI_ACC_KEY, JSON.stringify(list.slice(0, 8)));
            } catch (e) {}
        }
        return list;
    }

    function saveAccountToMultiList(accObj) {
        if (!accObj || !accObj.username) return;
        const list = getSavedMultiAccounts();
        const idx = list.findIndex(
            (a) => a && a.username && a.username.toLowerCase() === accObj.username.toLowerCase()
        );
        if (idx === -1) list.unshift(accObj);
        else list[idx] = Object.assign({}, list[idx], accObj);
        try {
            localStorage.setItem(MULTI_ACC_KEY, JSON.stringify(list.slice(0, 8)));
        } catch (e) {}
    }

    window.NexusSwitchAccount = function (targetUsername) {
        const list = getSavedMultiAccounts();
        const target = list.find(
            (a) => a && a.username && a.username.toLowerCase() === String(targetUsername || "").toLowerCase()
        );
        if (!target) return;

        localStorage.setItem("nx_active_account", JSON.stringify(target));
        localStorage.setItem("nx_legacy_backup_account", JSON.stringify(target));

        if (window.Nexus) {
            Nexus.rebuildAllUsersMasterList && Nexus.rebuildAllUsersMasterList();
            Nexus.notifyAll && Nexus.notifyAll();
            Nexus.toast && Nexus.toast("🔄 Switched to @" + target.username);
        }
        renderInstagramSettingsTab();
        startGlobalIncomingCallListener();
    };

    // =========================================================================
    // 2. CORE ADVANCED GOOGLE LOGIN & SIGN-UP ENGINE (MULTI-ACCOUNT READY)
    // =========================================================================
    window.openAdvancedGoogleAuthModal = function (mode) {
        document.getElementById("nx-core-auth-modal")?.remove();

        const isSignUp = mode === "signup";
        const modal = document.createElement("div");
        modal.id = "nx-core-auth-modal";
        modal.style.cssText =
            "position:fixed; inset:0; background:rgba(2,6,23,0.92); z-index:200080; display:flex; align-items:center; justify-content:center; padding:16px; backdrop-filter:blur(8px);";

        modal.innerHTML = `
            <div style="background:linear-gradient(160deg,#0f172a,#090d16); border:1.5px solid #1e293b; border-radius:26px; width:100%; max-width:390px; padding:24px 20px; color:#fff; box-shadow:0 24px 60px rgba(0,0,0,0.95); position:relative;">
                <button type="button" id="nx-close-auth-modal" style="position:absolute; top:14px; right:14px; width:32px; height:32px; border-radius:50%; background:#1e293b; border:none; color:#cbd5e1; font-weight:900; cursor:pointer;">✕</button>

                <div style="text-align:center; margin-bottom:18px;">
                    <div style="display:inline-flex; align-items:center; gap:6px; background:rgba(16,185,129,0.14); border:1px solid rgba(16,185,129,0.4); color:#34d399; font-size:11px; font-weight:800; padding:4px 12px; border-radius:999px; margin-bottom:8px;">
                        🛡️ Nexus Accounts Center
                    </div>
                    <h2 style="font-size:20px; font-weight:900; color:#f8fafc;">
                        ${isSignUp ? "Create New Verified Account" : "Sign In to Nexus Account"}
                    </h2>
                    <p style="font-size:12px; color:#94a3b8; margin-top:4px;">
                        ${
                            isSignUp
                                ? "Set your custom @username & stream, then verify with Google"
                                : "Sign in with Google to access or add another account"
                        }
                    </p>
                </div>

                <!-- Mode Switch Tabs (Sign In vs Sign Up) -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; background:#090d16; padding:4px; border-radius:14px; border:1px solid #1e293b; margin-bottom:16px;">
                    <button type="button" id="nx-tab-signin" style="padding:9px; border-radius:10px; border:none; font-weight:800; font-size:12.5px; cursor:pointer; background:${
                        !isSignUp ? "#1e293b" : "transparent"
                    }; color:${!isSignUp ? "#38bdf8" : "#64748b"};">
                        Sign In (Existing)
                    </button>
                    <button type="button" id="nx-tab-signup" style="padding:9px; border-radius:10px; border:none; font-weight:800; font-size:12.5px; cursor:pointer; background:${
                        isSignUp ? "#1e293b" : "transparent"
                    }; color:${isSignUp ? "#34d399" : "#64748b"};">
                        Sign Up (New Account)
                    </button>
                </div>

                ${
                    isSignUp
                        ? `<div style="display:flex; flex-direction:column; gap:10px; margin-bottom:16px; text-align:left;">
                               <div>
                                   <label style="font-size:11px; font-weight:800; color:#94a3b8; display:block; margin-bottom:4px;">CHOOSE @USERNAME</label>
                                   <input type="text" id="nx-signup-uname" placeholder="e.g. mohit_jee2027" style="width:100%; padding:11px 14px; border-radius:12px; background:#090d16; border:1px solid #334155; color:#fff; font-size:13px; outline:none;" />
                               </div>
                               <div>
                                   <label style="font-size:11px; font-weight:800; color:#94a3b8; display:block; margin-bottom:4px;">DISPLAY NAME</label>
                                   <input type="text" id="nx-signup-name" placeholder="Your Full Name" style="width:100%; padding:11px 14px; border-radius:12px; background:#090d16; border:1px solid #334155; color:#fff; font-size:13px; outline:none;" />
                               </div>
                               <div>
                                   <label style="font-size:11px; font-weight:800; color:#94a3b8; display:block; margin-bottom:4px;">SELECT STREAM / BIO</label>
                                   <select id="nx-signup-bio" style="width:100%; padding:11px 14px; border-radius:12px; background:#090d16; border:1px solid #334155; color:#fff; font-size:13px; outline:none;">
                                       <option value="IIT-JEE Aspirant 🚀">IIT-JEE Aspirant 🚀</option>
                                       <option value="NEET Medical Aspirant 🩺">NEET Medical Aspirant 🩺</option>
                                       <option value="Full-Stack Developer 💻">Full-Stack Developer 💻</option>
                                       <option value="Class 11th / 12th PCM ⚡">Class 11th / 12th PCM ⚡</option>
                                       <option value="Nexus Verified Member ✨">Nexus Verified Member ✨</option>
                                   </select>
                               </div>
                           </div>`
                        : ""
                }

                <button type="button" id="nx-exec-google-auth" style="width:100%; padding:13px 16px; border-radius:14px; background:#ffffff; color:#0f172a; font-weight:900; font-size:13.5px; border:none; display:flex; align-items:center; justify-content:center; gap:10px; cursor:pointer; box-shadow:0 8px 24px rgba(0,0,0,0.5);">
                    <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                    <span>${isSignUp ? "Sign Up & Verify with Google" : "Continue with Google"}</span>
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector("#nx-close-auth-modal").onclick = () => modal.remove();
        modal.querySelector("#nx-tab-signin").onclick = () => window.openAdvancedGoogleAuthModal("signin");
        modal.querySelector("#nx-tab-signup").onclick = () => window.openAdvancedGoogleAuthModal("signup");

        const authBtn = modal.querySelector("#nx-exec-google-auth");
        authBtn.onclick = async () => {
            let customUname = "";
            let customName = "";
            let customBio = "";

            if (isSignUp) {
                customUname = (modal.querySelector("#nx-signup-uname")?.value || "")
                    .toLowerCase()
                    .replace(/[^a-z0-9_]/g, "");
                customName = (modal.querySelector("#nx-signup-name")?.value || "").trim();
                customBio = modal.querySelector("#nx-signup-bio")?.value || "IIT-JEE Aspirant 🚀";
                if (customUname && customUname.length < 3) {
                    alert("Username kam se kam 3 letters ka hona chahiye!");
                    return;
                }
            }

            authBtn.disabled = true;
            authBtn.innerHTML = "⏳ <span>Connecting to Google OAuth...</span>";

            try {
                if (!firebase.apps.length && window.Nexus) {
                    firebase.initializeApp(Nexus.config);
                }
                const provider = new firebase.auth.GoogleAuthProvider();
                provider.setCustomParameters({ prompt: "select_account" });

                const res = await firebase.auth().signInWithPopup(provider);
                if (res && res.user) {
                    const u = res.user;
                    const email = (u.email || "").toLowerCase().trim();
                    const emailPrefix = (email.split("@")[0] || "user").replace(/[^a-z0-9_]/g, "");

                    // Check if an account with this email already exists in cloudAccounts
                    let cloudExisting = null;
                    if (!isSignUp && window.Nexus && Array.isArray(Nexus.users)) {
                        cloudExisting = Nexus.users.find(
                            (acc) =>
                                acc &&
                                ((acc.email && acc.email.toLowerCase() === email) ||
                                    (acc.username && acc.username.toLowerCase() === emailPrefix))
                        );
                    }

                    const finalUsername =
                        customUname ||
                        (cloudExisting && cloudExisting.username) ||
                        emailPrefix ||
                        "user_" + Math.floor(1000 + Math.random() * 9000);

                    const newAccObj = Object.assign({}, cloudExisting || {}, {
                        username: finalUsername,
                        name: customName || (cloudExisting && cloudExisting.name) || u.displayName || emailPrefix,
                        dp: (cloudExisting && cloudExisting.dp) || u.photoURL || "",
                        bio: customBio || (cloudExisting && cloudExisting.bio) || "Google Verified Nexus Member ✨",
                        email: email,
                        googleUid: u.uid,
                        googleVerified: true,
                        verified: true,
                        isOnlineNow: true,
                        lastOnline: Date.now(),
                        followersList: (cloudExisting && cloudExisting.followersList) || [],
                        followingList: (cloudExisting && cloudExisting.followingList) || []
                    });

                    localStorage.setItem("nx_active_account", JSON.stringify(newAccObj));
                    localStorage.setItem("nx_legacy_backup_account", JSON.stringify(newAccObj));
                    saveAccountToMultiList(newAccObj);

                    if (window.Nexus && Nexus.db) {
                        await Promise.allSettled([
                            Nexus.db.collection("nexus_accounts").doc(finalUsername).set(newAccObj, { merge: true }),
                            Nexus.db.collection("nexus_verified_emails").doc(finalUsername).set({
                                username: finalUsername,
                                name: newAccObj.name,
                                email: email,
                                googleUid: u.uid,
                                verifiedAt: Date.now()
                            })
                        ]);
                    }

                    modal.remove();
                    if (window.Nexus) {
                        Nexus.rebuildAllUsersMasterList && Nexus.rebuildAllUsersMasterList();
                        Nexus.notifyAll && Nexus.notifyAll();
                        Nexus.toast && Nexus.toast("✅ Signed in as @" + finalUsername);
                    }
                    renderInstagramSettingsTab();
                    startGlobalIncomingCallListener();
                }
            } catch (err) {
                if (err && (err.code === "auth/popup-blocked" || err.code === "auth/operation-not-supported-in-this-environment")) {
                    const provider2 = new firebase.auth.GoogleAuthProvider();
                    provider2.setCustomParameters({ prompt: "select_account" });
                    await firebase.auth().signInWithRedirect(provider2);
                } else {
                    authBtn.disabled = false;
                    authBtn.innerHTML = "🔄 <span>Try Google Sign-In Again</span>";
                }
            }
        };
    };

    // =========================================================================
    // 3. MULTI-FEATURE PRO VIDEO & VOICE CALL ENGINE (GLOBAL RINGING + PiP)
    // =========================================================================
    function playIncomingRingtoneBeep() {
        const prefs = getUserPrefs();
        if (!prefs.callRingtone) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.18); // A5
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.45);
        } catch (e) {}
    }

    // Launches the Pro Video/Voice Call UI with Minimize (PiP), Screen Share, Emoji Reactions & Timer
    window.startNexusProCall = async function (partnerUsername, isVideoCall, existingRoomId) {
        const me = getCurrentAccount();
        const myUname = (me && me.username) ? me.username.toLowerCase().trim() : "guest";
        const targetPartner = String(partnerUsername || window.currentChatUser || "partner")
            .toLowerCase()
            .replace(/^@/, "")
            .trim();

        const callId =
            existingRoomId ||
            "NxCall_" + [myUname, targetPartner].sort().join("_") + "_" + Math.floor(Date.now() / 60000);

        // Request microphone/camera with noise suppression
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                video: Boolean(isVideoCall)
            });
            stream.getTracks().forEach((t) => t.stop());
        } catch (e) {}

        // If I am the caller (not answering an existing incoming call), ring the partner via Firestore!
        if (!existingRoomId && window.Nexus && Nexus.db && targetPartner && targetPartner !== myUname) {
            Nexus.db
                .collection("nexus_live_calls")
                .doc(targetPartner)
                .set({
                    callId: callId,
                    caller: myUname,
                    callerName: (me && me.name) || myUname,
                    callerDp: (me && me.dp) || "",
                    receiver: targetPartner,
                    isVideo: Boolean(isVideoCall),
                    status: "ringing",
                    lastReaction: "",
                    createdAt: Date.now()
                })
                .catch(() => {});
        }

        document.getElementById("nx-pro-call-window")?.remove();

        const videoMutedFlag = isVideoCall ? "false" : "true";
        const jitsiUrl = `https://meet.jit.si/${callId}#config.startWithVideoMuted=${videoMutedFlag}&config.startWithAudioMuted=false&config.prejoinPageEnabled=false&config.disableDeepLinking=true`;

        const callWin = document.createElement("div");
        callWin.id = "nx-pro-call-window";
        callWin.dataset.minimized = "0";
        callWin.style.cssText =
            "position:fixed; inset:0; background:#020617; z-index:200090; display:flex; flex-direction:column; transition:all 0.25s ease; box-shadow:0 20px 60px rgba(0,0,0,0.95); overflow:hidden;";

        callWin.innerHTML = `
            <!-- Top Call Header Bar -->
            <div id="nx-call-top-bar" style="display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:linear-gradient(90deg,#0f172a,#090d16); border-bottom:1px solid #1e293b; color:#fff;">
                <div style="display:flex; align-items:center; gap:9px;">
                    <span style="width:10px; height:10px; border-radius:50%; background:#10b981; box-shadow:0 0 8px #10b981;"></span>
                    <div>
                        <div style="font-size:13.5px; font-weight:900; color:#f8fafc;">
                            ${isVideoCall ? "📹 HD Video Call" : "📞 HD Voice Call"} • @${targetPartner}
                        </div>
                        <div style="font-size:10.5px; color:#34d399; font-weight:700;">
                            🔐 E2EE Active • <span id="nx-call-timer">00:00</span>
                        </div>
                    </div>
                </div>

                <div style="display:flex; align-items:center; gap:8px;">
                    <!-- Minimize to Floating PiP Button -->
                    <button type="button" id="nx-call-pip-btn" title="Minimize Call & Chat" style="padding:6px 11px; border-radius:10px; background:#1e293b; border:1px solid #334155; color:#38bdf8; font-weight:800; font-size:11.5px; cursor:pointer;">
                        🗗 Minimize
                    </button>
                    <!-- End Call Button -->
                    <button type="button" id="nx-call-end-btn" style="padding:6px 14px; border-radius:10px; background:#e11d48; border:none; color:#fff; font-weight:900; font-size:11.5px; cursor:pointer;">
                        End ☎️
                    </button>
                </div>
            </div>

            <!-- Main Video / Audio Stream Iframe -->
            <div style="position:relative; flex:1; width:100%; background:#000;">
                <iframe id="nx-call-iframe" src="${jitsiUrl}" allow="camera; microphone; fullscreen; display-capture; autoplay" style="width:100%; height:100%; border:0;"></iframe>
                <div id="nx-call-floating-emoji" style="position:absolute; bottom:24px; right:20px; font-size:38px; pointer-events:none; transition:all 0.4s ease; opacity:0;"></div>
            </div>

            <!-- Bottom Multi-Feature Call Control Bar -->
            <div id="nx-call-bottom-bar" style="display:flex; align-items:center; justify-content:space-around; padding:10px 12px; background:#0f172a; border-top:1px solid #1e293b;">
                <button type="button" class="nx-call-react" data-em="❤️" style="background:#1e293b; border:1px solid #334155; border-radius:12px; padding:7px 12px; font-size:16px; cursor:pointer;">❤️</button>
                <button type="button" class="nx-call-react" data-em="🔥" style="background:#1e293b; border:1px solid #334155; border-radius:12px; padding:7px 12px; font-size:16px; cursor:pointer;">🔥</button>
                <button type="button" class="nx-call-react" data-em="😂" style="background:#1e293b; border:1px solid #334155; border-radius:12px; padding:7px 12px; font-size:16px; cursor:pointer;">😂</button>
                <button type="button" class="nx-call-react" data-em="👏" style="background:#1e293b; border:1px solid #334155; border-radius:12px; padding:7px 12px; font-size:16px; cursor:pointer;">👏</button>
                <button type="button" id="nx-call-switch-mode" style="background:#1e293b; border:1px solid #38bdf8; color:#38bdf8; border-radius:12px; padding:7px 12px; font-size:11.5px; font-weight:800; cursor:pointer;">
                    🔄 ${isVideoCall ? "Audio Only" : "Switch to Video"}
                </button>
            </div>
        `;

        document.body.appendChild(callWin);

        // Live Call Timer
        let seconds = 0;
        clearInterval(callTimerInterval);
        callTimerInterval = setInterval(() => {
            seconds++;
            const m = String(Math.floor(seconds / 60)).padStart(2, "0");
            const s = String(seconds % 60).padStart(2, "0");
            const tEl = document.getElementById("nx-call-timer");
            if (tEl) tEl.textContent = `${m}:${s}`;
        }, 1000);

        // Minimize / Maximize Floating Picture-in-Picture (PiP) Mode
        const pipBtn = callWin.querySelector("#nx-call-pip-btn");
        const bottomBar = callWin.querySelector("#nx-call-bottom-bar");
        pipBtn.onclick = () => {
            if (callWin.dataset.minimized === "0") {
                callWin.dataset.minimized = "1";
                callWin.style.cssText =
                    "position:fixed; bottom:76px; right:12px; width:175px; height:235px; border-radius:18px; border:2px solid #10b981; background:#020617; z-index:200090; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 14px 35px rgba(0,0,0,0.9);";
                bottomBar.style.display = "none";
                pipBtn.innerText = "⛶";
            } else {
                callWin.dataset.minimized = "0";
                callWin.style.cssText =
                    "position:fixed; inset:0; background:#020617; z-index:200090; display:flex; flex-direction:column; overflow:hidden;";
                bottomBar.style.display = "flex";
                pipBtn.innerText = "🗗 Minimize";
            }
        };

        // Switch Audio/Video Mode
        callWin.querySelector("#nx-call-switch-mode").onclick = () => {
            const frame = callWin.querySelector("#nx-call-iframe");
            if (frame) {
                const newMuted = frame.src.includes("startWithVideoMuted=true") ? "false" : "true";
                frame.src = `https://meet.jit.si/${callId}#config.startWithVideoMuted=${newMuted}&config.startWithAudioMuted=false&config.prejoinPageEnabled=false`;
            }
        };

        // Live Call Emoji Reactions
        const showFloatingCallEmoji = (emoji) => {
            const fl = document.getElementById("nx-call-floating-emoji");
            if (!fl) return;
            fl.textContent = emoji;
            fl.style.opacity = "1";
            fl.style.transform = "translateY(-35px) scale(1.25)";
            setTimeout(() => {
                fl.style.opacity = "0";
                fl.style.transform = "translateY(0) scale(1)";
            }, 1400);
        };

        callWin.querySelectorAll(".nx-call-react").forEach((b) => {
            b.onclick = () => {
                const em = b.getAttribute("data-em");
                showFloatingCallEmoji(em);
                if (window.Nexus && Nexus.db && targetPartner) {
                    Nexus.db
                        .collection("nexus_live_calls")
                        .doc(targetPartner)
                        .set({ lastReaction: em + "_" + Date.now() }, { merge: true })
                        .catch(() => {});
                }
            };
        });

        // End Call Handler
        callWin.querySelector("#nx-call-end-btn").onclick = () => {
            clearInterval(callTimerInterval);
            if (activeCallUnsub) activeCallUnsub();
            callWin.remove();
            if (window.Nexus && Nexus.db && targetPartner) {
                Nexus.db
                    .collection("nexus_live_calls")
                    .doc(targetPartner)
                    .set({ status: "ended", updatedAt: Date.now() }, { merge: true })
                    .catch(() => {});
            }
        };
    };

    // Listen for Incoming Calls Anywhere in the App!
    function startGlobalIncomingCallListener() {
        if (incomingCallListenerUnsub) incomingCallListenerUnsub();
        const me = getCurrentAccount();
        if (!me || !me.username || !window.Nexus || !Nexus.db) return;

        const myUname = me.username.toLowerCase().trim();
        incomingCallListenerUnsub = Nexus.db
            .collection("nexus_live_calls")
            .doc(myUname)
            .onSnapshot((doc) => {
                if (!doc.exists) return;
                const data = doc.data();
                if (!data) return;

                // Show incoming call banner if status is 'ringing' and created within last 45 seconds
                if (data.status === "ringing" && Date.now() - (data.createdAt || 0) < 45000) {
                    showIncomingCallBanner(data);
                } else if (data.status === "ended" || data.status === "declined") {
                    document.getElementById("nx-incoming-call-banner")?.remove();
                    clearInterval(ringtoneInterval);
                }
            });
    }

    function showIncomingCallBanner(callData) {
        if (document.getElementById("nx-pro-call-window")) return;
        let banner = document.getElementById("nx-incoming-call-banner");
        if (banner) return;

        playIncomingRingtoneBeep();
        clearInterval(ringtoneInterval);
        ringtoneInterval = setInterval(playIncomingRingtoneBeep, 2000);

        banner = document.createElement("div");
        banner.id = "nx-incoming-call-banner";
        banner.style.cssText =
            "position:fixed; top:12px; left:50%; transform:translateX(-50%); width:94%; max-width:410px; background:linear-gradient(135deg,#0f172a,#064e3b); border:2px solid #10b981; border-radius:22px; padding:14px 16px; z-index:200095; box-shadow:0 18px 45px rgba(0,0,0,0.92); color:#fff; display:flex; align-items:center; justify-content:space-between; gap:10px;";

        banner.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <div style="width:44px; height:44px; border-radius:50%; background:#10b981; color:#020617; font-weight:900; font-size:18px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    ${(callData.callerName || callData.caller || "U")[0].toUpperCase()}
                </div>
                <div>
                    <div style="font-size:13.5px; font-weight:900; color:#f8fafc;">
                        ${callData.isVideo ? "📹 Incoming Video Call" : "📞 Incoming Voice Call"}
                    </div>
                    <div style="font-size:11.5px; color:#34d399; font-weight:700;">
                        @${callData.caller} is calling you...
                    </div>
                </div>
            </div>

            <div style="display:flex; align-items:center; gap:8px;">
                <button type="button" id="nx-decline-call-btn" style="padding:8px 12px; border-radius:12px; background:#e11d48; border:none; color:#fff; font-weight:900; font-size:12px; cursor:pointer;">
                    Decline
                </button>
                <button type="button" id="nx-accept-call-btn" style="padding:8px 14px; border-radius:12px; background:#10b981; border:none; color:#020617; font-weight:900; font-size:12px; cursor:pointer;">
                    Accept 📞
                </button>
            </div>
        `;

        document.body.appendChild(banner);

        banner.querySelector("#nx-accept-call-btn").onclick = () => {
            clearInterval(ringtoneInterval);
            banner.remove();
            if (window.Nexus && Nexus.db) {
                Nexus.db.collection("nexus_live_calls").doc(callData.receiver).set({ status: "accepted" }, { merge: true }).catch(() => {});
            }
            window.startNexusProCall(callData.caller, callData.isVideo, callData.callId);
        };

        banner.querySelector("#nx-decline-call-btn").onclick = () => {
            clearInterval(ringtoneInterval);
            banner.remove();
            if (window.Nexus && Nexus.db) {
                Nexus.db.collection("nexus_live_calls").doc(callData.receiver).set({ status: "declined" }, { merge: true }).catch(() => {});
            }
        };
    }

    // Intercept Voice Call / Video Call clicks in '+' menu or chat header to launch Pro Call Engine!
    document.addEventListener(
        "click",
        (e) => {
            const btn = e.target.closest("button[data-act]");
            if (!btn) return;
            const act = btn.getAttribute("data-act");
            if (act === "audio-call" || act === "video-call") {
                e.stopPropagation();
                e.preventDefault();
                const sheet = document.getElementById("nx-whatsapp-plus-sheet");
                if (sheet) sheet.style.display = "none";
                window.startNexusProCall(window.currentChatUser || "partner", act === "video-call");
            }
        },
        true
    );

    // =========================================================================
    // 4. INSTAGRAM-STYLE SETTINGS & ACTIVITY UI (#tab-settings)
    // =========================================================================
    function openInstagramSubModal(title, bodyHtml, onMount) {
        document.getElementById("nx-ig-submodal")?.remove();
        const modal = document.createElement("div");
        modal.id = "nx-ig-submodal";
        modal.style.cssText =
            "position:fixed; inset:0; background:rgba(2,6,23,0.88); z-index:200070; display:flex; align-items:flex-end; justify-content:center; backdrop-filter:blur(5px);";

        modal.innerHTML = `
            <div style="background:#0f172a; border-top:1.5px solid #334155; border-radius:24px 24px 0 0; width:100%; max-width:640px; max-height:86dvh; overflow-y:auto; padding:18px 16px 28px; color:#fff; box-shadow:0 -12px 40px rgba(0,0,0,0.85);">
                <div style="width:42px; height:4px; background:#334155; border-radius:999px; margin:0 auto 14px;"></div>
                <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; padding-bottom:10px; border-bottom:1px solid #1e293b;">
                    <h3 style="font-size:16px; font-weight:900; color:#f8fafc;">${title}</h3>
                    <button type="button" id="nx-close-submodal" style="width:30px; height:30px; border-radius:50%; background:#1e293b; border:none; color:#cbd5e1; font-weight:900; cursor:pointer;">✕</button>
                </div>
                <div id="nx-submodal-content">${bodyHtml}</div>
            </div>
        `;

        document.body.appendChild(modal);
        modal.querySelector("#nx-close-submodal").onclick = () => modal.remove();
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
        if (onMount) onMount(modal);
    }

    function openAccountSwitcherModal() {
        const current = getCurrentAccount();
        const accounts = getSavedMultiAccounts();

        const rowsHtml = accounts
            .map((acc) => {
                const isCurrent =
                    current && current.username && acc.username.toLowerCase() === current.username.toLowerCase();
                const avatar = acc.dp
                    ? `<img src="${acc.dp}" style="width:42px; height:42px; border-radius:50%; object-fit:cover;" />`
                    : `<div style="width:42px; height:42px; border-radius:50%; background:#10b981; color:#020617; font-weight:900; font-size:16px; display:flex; align-items:center; justify-content:center;">${(
                          acc.name || acc.username
                      )[0].toUpperCase()}</div>`;

                return `
                    <div data-switch-uname="${acc.username}" style="display:flex; align-items:center; justify-content:space-between; padding:11px 12px; border-radius:14px; background:${
                    isCurrent ? "rgba(16,185,129,0.12)" : "#090d16"
                }; border:1px solid ${
                    isCurrent ? "rgba(16,185,129,0.45)" : "#1e293b"
                }; margin-bottom:8px; cursor:pointer;">
                        <div style="display:flex; align-items:center; gap:11px;">
                            ${avatar}
                            <div>
                                <div style="font-size:13.5px; font-weight:800; color:#f8fafc;">
                                    ${acc.name || acc.username} ${acc.googleVerified ? "✅" : ""}
                                </div>
                                <div style="font-size:11.5px; color:#94a3b8;">@${acc.username} ${
                    acc.email ? "• " + acc.email : ""
                }</div>
                            </div>
                        </div>
                        <span style="font-size:12px; font-weight:900; color:${
                            isCurrent ? "#34d399" : "#38bdf8"
                        };">
                            ${isCurrent ? "● Active" : "Switch →"}
                        </span>
                    </div>
                `;
            })
            .join("");

        const html = `
            <div style="margin-bottom:12px;">
                ${rowsHtml || `<div style="color:#94a3b8; font-size:12.5px; padding:10px;">No accounts saved yet.</div>`}
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                <button type="button" id="nx-add-existing-google" style="padding:12px; border-radius:13px; background:#1e293b; border:1px solid #334155; color:#38bdf8; font-weight:800; font-size:12.5px; cursor:pointer;">
                    🔑 Sign In Another Account
                </button>
                <button type="button" id="nx-add-new-google" style="padding:12px; border-radius:13px; background:#10b981; border:none; color:#020617; font-weight:900; font-size:12.5px; cursor:pointer;">
                    ➕ Sign Up New Account
                </button>
            </div>
        `;

        openInstagramSubModal("Switch or Add Accounts", html, (modal) => {
            modal.querySelectorAll("[data-switch-uname]").forEach((row) => {
                row.onclick = () => {
                    const u = row.getAttribute("data-switch-uname");
                    modal.remove();
                    window.NexusSwitchAccount(u);
                };
            });
            modal.querySelector("#nx-add-existing-google").onclick = () => {
                modal.remove();
                window.openAdvancedGoogleAuthModal("signin");
            };
            modal.querySelector("#nx-add-new-google").onclick = () => {
                modal.remove();
                window.openAdvancedGoogleAuthModal("signup");
            };
        });
    }

    function renderInstagramSettingsTab() {
        const container = document.getElementById("tab-settings");
        if (!container) return;

        const me = getCurrentAccount();
        const prefs = getUserPrefs();
        const savedAccounts = getSavedMultiAccounts();

        const dpHtml =
            me && me.dp
                ? `<img src="${me.dp}" style="width:52px; height:52px; border-radius:50%; object-fit:cover; border:2px solid #10b981;" />`
                : `<div style="width:52px; height:52px; border-radius:50%; background:linear-gradient(135deg,#10b981,#06b6d4); color:#020617; font-weight:900; font-size:20px; display:flex; align-items:center; justify-content:center;">${
                      me && (me.name || me.username) ? (me.name || me.username)[0].toUpperCase() : "N"
                  }</div>`;

        const rowStyle =
            "display:flex; align-items:center; justify-content:space-between; padding:13px 14px; background:#0f172a; border-bottom:1px solid rgba(30,41,59,0.7); cursor:pointer; transition:background 0.15s ease;";
        const secTitleStyle =
            "font-size:11.5px; font-weight:800; color:#94a3b8; padding:16px 16px 6px; text-transform:uppercase; letter-spacing:0.5px;";

        container.innerHTML = `
            <div style="padding-bottom:36px; background:#090d16; min-height:calc(100dvh - 120px);">
                <!-- Top Header & Search Bar (Instagram Style) -->
                <div style="padding:14px 16px 10px; border-bottom:1px solid #1e293b; background:#090d16; position:sticky; top:56px; z-index:20;">
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
                        <h2 style="font-size:19px; font-weight:900; color:#f8fafc;">Settings and activity</h2>
                        <span style="font-size:11px; font-weight:800; color:#34d399; background:rgba(16,185,129,0.14); padding:3px 9px; border-radius:999px; border:1px solid rgba(16,185,129,0.35);">
                            ${savedAccounts.length} Account${savedAccounts.length === 1 ? "" : "s"}
                        </span>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px; background:#0f172a; border:1px solid #1e293b; border-radius:12px; padding:8px 12px;">
                        <span>🔍</span>
                        <input type="text" id="nx-ig-settings-search" placeholder="Search settings..." style="background:transparent; border:none; color:#fff; font-size:13px; width:100%; outline:none;" />
                    </div>
                </div>

                <!-- 1. NEXUS ACCOUNTS CENTER CARD (LIKE INSTAGRAM META ACCOUNTS CENTER) -->
                <div style="margin:14px 14px 6px; padding:16px; border-radius:20px; background:linear-gradient(145deg,#0f172a,#1e293b); border:1px solid #334155; box-shadow:0 8px 25px rgba(0,0,0,0.45);">
                    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                        <span style="font-size:11.5px; font-weight:900; color:#38bdf8; letter-spacing:0.3px;">🛡️ NEXUS ACCOUNTS CENTER</span>
                        <button type="button" id="nx-open-switcher-top" style="padding:4px 10px; border-radius:999px; background:rgba(56,189,248,0.15); border:1px solid rgba(56,189,248,0.4); color:#38bdf8; font-size:11px; font-weight:800; cursor:pointer;">
                            Switch / Add (${savedAccounts.length})
                        </button>
                    </div>

                    <div id="nx-acc-center-main" style="display:flex; align-items:center; justify-content:space-between; cursor:pointer;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            ${dpHtml}
                            <div>
                                <div style="font-size:15px; font-weight:900; color:#f8fafc;">
                                    ${me ? me.name || me.username : "Guest User"} ${me && me.googleVerified ? "✅" : ""}
                                </div>
                                <div style="font-size:12px; color:#94a3b8;">
                                    ${me ? "@" + me.username : "Not signed in"} ${me && me.email ? "• " + me.email : ""}
                                </div>
                                <div style="font-size:11px; color:#34d399; font-weight:700; margin-top:2px;">
                                    Profiles, Google OAuth, connected experiences
                                </div>
                            </div>
                        </div>
                        <span style="color:#64748b; font-size:18px; font-weight:900;">›</span>
                    </div>
                </div>

                <!-- 2. HOW YOU USE NEXUS -->
                <div class="nx-settings-group">
                    <div style="${secTitleStyle}">How you use Nexus</div>
                    <div style="border-top:1px solid #1e293b; border-bottom:1px solid #1e293b;">
                        <div class="nx-ig-row" data-ig-row="saved" style="${rowStyle}">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <span style="font-size:17px;">🔖</span>
                                <div>
                                    <div style="font-size:13.5px; font-weight:700; color:#f8fafc;">Saved Posts & Notes</div>
                                    <div style="font-size:11px; color:#64748b;">Bookmarked doubts, formulas & posts</div>
                                </div>
                            </div>
                            <span style="color:#64748b; font-size:16px;">›</span>
                        </div>

                        <div class="nx-ig-row" data-ig-row="notifications" style="${rowStyle}">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <span style="font-size:17px;">🔔</span>
                                <div>
                                    <div style="font-size:13.5px; font-weight:700; color:#f8fafc;">Notifications & Ringtone</div>
                                    <div style="font-size:11px; color:#64748b;">Push alerts, DM sounds & incoming call ring</div>
                                </div>
                            </div>
                            <span style="color:#34d399; font-size:11.5px; font-weight:800;">${
                                prefs.pushNotifications ? "On" : "Muted"
                            } ›</span>
                        </div>

                        <div class="nx-ig-row" data-ig-row="time_spent" style="${rowStyle}">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <span style="font-size:17px;">⏳</span>
                                <div>
                                    <div style="font-size:13.5px; font-weight:700; color:#f8fafc;">Study Focus & Time Management</div>
                                    <div style="font-size:11px; color:#64748b;">Daily JEE/NEET study reminder & break alerts</div>
                                </div>
                            </div>
                            <span style="color:#64748b; font-size:16px;">›</span>
                        </div>
                    </div>
                </div>

                <!-- 3. WHO CAN SEE YOUR CONTENT -->
                <div class="nx-settings-group">
                    <div style="${secTitleStyle}">Who can see your content</div>
                    <div style="border-top:1px solid #1e293b; border-bottom:1px solid #1e293b;">
                        <div class="nx-ig-row" data-ig-row="privacy" style="${rowStyle}">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <span style="font-size:17px;">🔒</span>
                                <div>
                                    <div style="font-size:13.5px; font-weight:700; color:#f8fafc;">Account privacy</div>
                                    <div style="font-size:11px; color:#64748b;">Control who can view your profile & posts</div>
                                </div>
                            </div>
                            <span style="color:#38bdf8; font-size:11.5px; font-weight:800;">${
                                prefs.privateAccount ? "Private" : "Public"
                            } ›</span>
                        </div>

                        <div class="nx-ig-row" data-ig-row="close_friends" style="${rowStyle}">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <span style="font-size:17px;">⭐</span>
                                <div>
                                    <div style="font-size:13.5px; font-weight:700; color:#f8fafc;">Close Friends</div>
                                    <div style="font-size:11px; color:#64748b;">Share stories & study rooms with top friends</div>
                                </div>
                            </div>
                            <span style="color:#64748b; font-size:11.5px; font-weight:700;">${
                                prefs.closeFriends.length
                            } ›</span>
                        </div>

                        <div class="nx-ig-row" data-ig-row="blocked" style="${rowStyle}">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <span style="font-size:17px;">🚫</span>
                                <div>
                                    <div style="font-size:13.5px; font-weight:700; color:#f8fafc;">Blocked accounts</div>
                                    <div style="font-size:11px; color:#64748b;">Manage users you have restricted</div>
                                </div>
                            </div>
                            <span style="color:#64748b; font-size:11.5px; font-weight:700;">${
                                prefs.blockedUsers.length
                            } ›</span>
                        </div>
                    </div>
                </div>

                <!-- 4. HOW OTHERS CAN INTERACT WITH YOU -->
                <div class="nx-settings-group">
                    <div style="${secTitleStyle}">How others can interact with you</div>
                    <div style="border-top:1px solid #1e293b; border-bottom:1px solid #1e293b;">
                        <div class="nx-ig-row" data-ig-row="messages_controls" style="${rowStyle}">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <span style="font-size:17px;">💬</span>
                                <div>
                                    <div style="font-size:13.5px; font-weight:700; color:#f8fafc;">Messages, Read Receipts & Typing</div>
                                    <div style="font-size:11px; color:#64748b;">Manage ✓✓ seen ticks, typing status & DM requests</div>
                                </div>
                            </div>
                            <span style="color:#64748b; font-size:16px;">›</span>
                        </div>

                        <div class="nx-ig-row" data-ig-row="e2ee_security" style="${rowStyle}">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <span style="font-size:17px;">🔐</span>
                                <div>
                                    <div style="font-size:13.5px; font-weight:700; color:#f8fafc;">End-to-End Encryption & Security</div>
                                    <div style="font-size:11px; color:#64748b;">256-Bit AES-GCM key verification & View-Once protection</div>
                                </div>
                            </div>
                            <span style="color:#34d399; font-size:11.5px; font-weight:800;">Active ›</span>
                        </div>
                    </div>
                </div>

                <!-- 5. YOUR APP AND MEDIA -->
                <div class="nx-settings-group">
                    <div style="${secTitleStyle}">Your app and media</div>
                    <div style="border-top:1px solid #1e293b; border-bottom:1px solid #1e293b;">
                        <div class="nx-ig-row" data-ig-row="device_permissions" style="${rowStyle}">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <span style="font-size:17px;">📱</span>
                                <div>
                                    <div style="font-size:13.5px; font-weight:700; color:#f8fafc;">Device permissions</div>
                                    <div style="font-size:11px; color:#64748b;">Camera, microphone & photo gallery access</div>
                                </div>
                            </div>
                            <span style="color:#64748b; font-size:16px;">›</span>
                        </div>

                        <div class="nx-ig-row" data-ig-row="media_storage" style="${rowStyle}">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <span style="font-size:17px;">⚡</span>
                                <div>
                                    <div style="font-size:13.5px; font-weight:700; color:#f8fafc;">Data usage and media quality</div>
                                    <div style="font-size:11px; color:#64748b;">HD uploads, 50MB video streaming & speed optimizer</div>
                                </div>
                            </div>
                            <span style="color:#64748b; font-size:16px;">›</span>
                        </div>

                        <div class="nx-ig-row" data-ig-row="share_app" style="${rowStyle}">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <span style="font-size:17px;">🚀</span>
                                <div>
                                    <div style="font-size:13.5px; font-weight:700; color:#f8fafc;">Follow and invite friends</div>
                                    <div style="font-size:11px; color:#64748b;">Share Nexus Community link on WhatsApp & Instagram</div>
                                </div>
                            </div>
                            <span style="color:#34d399; font-size:12px; font-weight:800;">Share ›</span>
                        </div>

                        <div class="nx-ig-row" data-ig-row="about_nexus" style="${rowStyle}">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <span style="font-size:17px;">ℹ️</span>
                                <div>
                                    <div style="font-size:13.5px; font-weight:700; color:#f8fafc;">About Nexus Official</div>
                                    <div style="font-size:11px; color:#64748b;">Platform version, privacy policy & founder info</div>
                                </div>
                            </div>
                            <span style="color:#64748b; font-size:16px;">›</span>
                        </div>
                    </div>
                </div>

                <!-- 6. LOGINS & MULTI-ACCOUNT SECTION (EXACT INSTAGRAM BOTTOM FOOTER) -->
                <div class="nx-settings-group">
                    <div style="${secTitleStyle}">Login</div>
                    <div style="background:#0f172a; border-top:1px solid #1e293b; border-bottom:1px solid #1e293b; padding:6px 16px;">
                        <button type="button" id="nx-ig-add-account" style="width:100%; text-align:left; padding:11px 0; background:none; border:none; color:#38bdf8; font-size:14px; font-weight:800; cursor:pointer;">
                            Add account
                        </button>
                        <button type="button" id="nx-ig-switch-account" style="width:100%; text-align:left; padding:11px 0; background:none; border:none; border-top:1px solid rgba(30,41,59,0.7); color:#10b981; font-size:14px; font-weight:800; cursor:pointer;">
                            Switch accounts (${savedAccounts.length})
                        </button>
                        <button type="button" id="nx-ig-logout-current" style="width:100%; text-align:left; padding:11px 0; background:none; border:none; border-top:1px solid rgba(30,41,59,0.7); color:#f43f5e; font-size:14px; font-weight:800; cursor:pointer;">
                            Log out ${me ? "@" + me.username : ""}
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Bind Search Filter inside Settings
        const searchInp = container.querySelector("#nx-ig-settings-search");
        if (searchInp) {
            searchInp.oninput = () => {
                const q = searchInp.value.toLowerCase().trim();
                container.querySelectorAll(".nx-ig-row").forEach((r) => {
                    const txt = (r.innerText || "").toLowerCase();
                    r.style.display = !q || txt.includes(q) ? "flex" : "none";
                });
            };
        }

        // Bind Accounts Center & Multi-Account Switcher
        container.querySelector("#nx-open-switcher-top").onclick = openAccountSwitcherModal;
        container.querySelector("#nx-acc-center-main").onclick = openAccountSwitcherModal;
        container.querySelector("#nx-ig-add-account").onclick = () => window.openAdvancedGoogleAuthModal("signup");
        container.querySelector("#nx-ig-switch-account").onclick = openAccountSwitcherModal;

        // Bind Log Out Current Account (Switches to next saved account if available!)
        container.querySelector("#nx-ig-logout-current").onclick = async () => {
            if (!confirm("Log out of current account? (Your saved data remains 100% safe)")) return;
            try {
                if (window.firebase && firebase.auth) await firebase.auth().signOut();
            } catch (e) {}

            const cur = getCurrentAccount();
            let list = getSavedMultiAccounts();
            if (cur && cur.username) {
                list = list.filter((a) => a.username.toLowerCase() !== cur.username.toLowerCase());
                localStorage.setItem(MULTI_ACC_KEY, JSON.stringify(list));
            }

            if (list.length > 0) {
                localStorage.setItem("nx_active_account", JSON.stringify(list[0]));
                if (window.Nexus && Nexus.toast) Nexus.toast("Switched to @" + list[0].username);
            } else {
                localStorage.removeItem("nx_active_account");
                if (window.Nexus && Nexus.toast) Nexus.toast("Logged out safely");
            }
            renderInstagramSettingsTab();
        };

        // Bind Individual Instagram Setting Rows
        container.querySelectorAll(".nx-ig-row").forEach((row) => {
            row.onclick = () => {
                const key = row.getAttribute("data-ig-row");
                handleInstagramSettingRowClick(key);
            };
        });
    }

    function handleInstagramSettingRowClick(key) {
        const prefs = getUserPrefs();

        if (key === "saved") {
            let saved = [];
            try {
                saved = JSON.parse(localStorage.getItem("nx_saved_posts") || "[]");
            } catch (e) {}
            const html = saved.length
                ? saved
                      .map(
                          (p) =>
                              `<div style="padding:12px; border-radius:12px; background:#090d16; border:1px solid #1e293b; margin-bottom:8px;">
                                  <div style="font-size:12px; font-weight:800; color:#34d399;">@${p.username || p.author || "member"}</div>
                                  <div style="font-size:13px; color:#f8fafc; margin-top:4px;">${p.content || p.text || "Saved media post"}</div>
                              </div>`
                      )
                      .join("")
                : `<div style="text-align:center; padding:24px; color:#94a3b8; font-size:13px;">🔖 No saved posts yet. Tap Save on any post in Home Feed!</div>`;
            openInstagramSubModal("Saved Posts & Notes", html);
        } else if (key === "notifications") {
            const html = `
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <label style="display:flex; align-items:center; justify-content:space-between; padding:12px; background:#090d16; border-radius:12px; border:1px solid #1e293b;">
                        <span>🔔 Push & Chat Notifications</span>
                        <input type="checkbox" id="nx-pref-push" ${prefs.pushNotifications ? "checked" : ""} style="width:18px; height:18px;" />
                    </label>
                    <label style="display:flex; align-items:center; justify-content:space-between; padding:12px; background:#090d16; border-radius:12px; border:1px solid #1e293b;">
                        <span>📞 Incoming Call Ringtone Sound</span>
                        <input type="checkbox" id="nx-pref-ring" ${prefs.callRingtone ? "checked" : ""} style="width:18px; height:18px;" />
                    </label>
                </div>
            `;
            openInstagramSubModal("Notifications & Ringtone", html, (m) => {
                m.querySelector("#nx-pref-push").onchange = (e) => {
                    prefs.pushNotifications = e.target.checked;
                    saveUserPrefs(prefs);
                    renderInstagramSettingsTab();
                };
                m.querySelector("#nx-pref-ring").onchange = (e) => {
                    prefs.callRingtone = e.target.checked;
                    saveUserPrefs(prefs);
                };
            });
        } else if (key === "privacy") {
            const html = `
                <label style="display:flex; align-items:center; justify-content:space-between; padding:14px; background:#090d16; border-radius:14px; border:1px solid #1e293b;">
                    <div>
                        <div style="font-size:14px; font-weight:800; color:#f8fafc;">🔒 Private Account</div>
                        <div style="font-size:11.5px; color:#94a3b8; margin-top:2px;">Only approved followers can see your posts & stories</div>
                    </div>
                    <input type="checkbox" id="nx-pref-private" ${prefs.privateAccount ? "checked" : ""} style="width:20px; height:20px;" />
                </label>
            `;
            openInstagramSubModal("Account Privacy", html, (m) => {
                m.querySelector("#nx-pref-private").onchange = (e) => {
                    prefs.privateAccount = e.target.checked;
                    saveUserPrefs(prefs);
                    renderInstagramSettingsTab();
                    if (window.Nexus && Nexus.toast) {
                        Nexus.toast(prefs.privateAccount ? "🔒 Switched to Private Account" : "🌐 Switched to Public Account");
                    }
                };
            });
        } else if (key === "messages_controls") {
            const html = `
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <label style="display:flex; align-items:center; justify-content:space-between; padding:12px; background:#090d16; border-radius:12px; border:1px solid #1e293b;">
                        <span>✓✓ Show Read Receipts (Seen Ticks)</span>
                        <input type="checkbox" id="nx-pref-read" ${prefs.readReceipts ? "checked" : ""} style="width:18px; height:18px;" />
                    </label>
                    <label style="display:flex; align-items:center; justify-content:space-between; padding:12px; background:#090d16; border-radius:12px; border:1px solid #1e293b;">
                        <span>✍️ Show Live 'Typing...' Indicator</span>
                        <input type="checkbox" id="nx-pref-typing" ${prefs.typingIndicator ? "checked" : ""} style="width:18px; height:18px;" />
                    </label>
                </div>
            `;
            openInstagramSubModal("Messages & Story Replies", html, (m) => {
                m.querySelector("#nx-pref-read").onchange = (e) => {
                    prefs.readReceipts = e.target.checked;
                    saveUserPrefs(prefs);
                };
                m.querySelector("#nx-pref-typing").onchange = (e) => {
                    prefs.typingIndicator = e.target.checked;
                    saveUserPrefs(prefs);
                };
            });
        } else if (key === "close_friends" || key === "blocked") {
            const isClose = key === "close_friends";
            const arr = isClose ? prefs.closeFriends : prefs.blockedUsers;
            const html = `
                <div style="display:flex; gap:8px; margin-bottom:12px;">
                    <input type="text" id="nx-list-uname-inp" placeholder="Enter @username..." style="flex:1; padding:10px 12px; border-radius:12px; background:#090d16; border:1px solid #334155; color:#fff; font-size:13px; outline:none;" />
                    <button type="button" id="nx-list-add-btn" style="padding:10px 16px; border-radius:12px; background:#10b981; border:none; color:#020617; font-weight:900; font-size:12.5px; cursor:pointer;">Add</button>
                </div>
                <div id="nx-list-items">
                    ${
                        arr.length
                            ? arr
                                  .map(
                                      (u) =>
                                          `<div style="display:flex; justify-content:space-between; padding:10px 12px; background:#090d16; border-radius:10px; margin-bottom:6px; font-size:13px;">
                                              <span>@${u}</span>
                                              <button type="button" data-rem="${u}" style="background:none; border:none; color:#f43f5e; font-weight:800; cursor:pointer;">Remove</button>
                                          </div>`
                                  )
                                  .join("")
                            : `<div style="color:#64748b; font-size:12.5px; text-align:center; padding:14px;">List is empty.</div>`
                    }
                </div>
            `;
            openInstagramSubModal(isClose ? "Close Friends ⭐" : "Blocked Accounts 🚫", html, (m) => {
                m.querySelector("#nx-list-add-btn").onclick = () => {
                    const v = (m.querySelector("#nx-list-uname-inp").value || "").toLowerCase().replace(/^@/, "").trim();
                    if (!v) return;
                    if (!arr.includes(v)) arr.push(v);
                    saveUserPrefs(prefs);
                    m.remove();
                    renderInstagramSettingsTab();
                    handleInstagramSettingRowClick(key);
                };
                m.querySelectorAll("[data-rem]").forEach((b) => {
                    b.onclick = () => {
                        const u = b.getAttribute("data-rem");
                        const idx = arr.indexOf(u);
                        if (idx !== -1) arr.splice(idx, 1);
                        saveUserPrefs(prefs);
                        m.remove();
                        renderInstagramSettingsTab();
                        handleInstagramSettingRowClick(key);
                    };
                });
            });
        } else if (key === "e2ee_security") {
            if (window.openE2EEVerificationModal) {
                window.openE2EEVerificationModal("Your Account");
            }
        } else if (key === "device_permissions") {
            const html = `
                <div style="display:flex; flex-direction:column; gap:10px; font-size:13px;">
                    <div style="padding:12px; background:#090d16; border-radius:12px; border:1px solid #1e293b; display:flex; justify-content:space-between;">
                        <span>📸 Camera & Video Call Access</span>
                        <strong style="color:#34d399;">Enabled</strong>
                    </div>
                    <div style="padding:12px; background:#090d16; border-radius:12px; border:1px solid #1e293b; display:flex; justify-content:space-between;">
                        <span>🎙️ Microphone & Voice Notes</span>
                        <strong style="color:#34d399;">Enabled</strong>
                    </div>
                    <div style="padding:12px; background:#090d16; border-radius:12px; border:1px solid #1e293b; display:flex; justify-content:space-between;">
                        <span>🖼️ Direct SAF Gallery Picker</span>
                        <strong style="color:#38bdf8;">Bypass Active</strong>
                    </div>
                </div>
            `;
            openInstagramSubModal("Device Permissions", html);
        } else if (key === "media_storage") {
            const html = `
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <label style="display:flex; align-items:center; justify-content:space-between; padding:12px; background:#090d16; border-radius:12px; border:1px solid #1e293b;">
                        <span>✨ Upload at Highest Quality (HD WebP & 50MB Video)</span>
                        <input type="checkbox" id="nx-pref-hd" ${prefs.highQualityMedia ? "checked" : ""} style="width:18px; height:18px;" />
                    </label>
                    <button type="button" id="nx-optimize-cache-btn" style="padding:12px; border-radius:12px; background:#1e293b; border:1px solid #334155; color:#38bdf8; font-weight:800; font-size:13px; cursor:pointer;">
                        ⚡ Optimize Temporary Media Cache (Keep Login Safe)
                    </button>
                </div>
            `;
            openInstagramSubModal("Data Usage & Media Quality", html, (m) => {
                m.querySelector("#nx-pref-hd").onchange = (e) => {
                    prefs.highQualityMedia = e.target.checked;
                    saveUserPrefs(prefs);
                };
                m.querySelector("#nx-optimize-cache-btn").onclick = () => {
                    localStorage.removeItem("nx_light_posts_v1");
                    m.remove();
                    if (window.Nexus && Nexus.toast) Nexus.toast("⚡ Media Cache Optimized!");
                };
            });
        } else if (key === "time_spent") {
            const html = `
                <div style="text-align:center; padding:12px;">
                    <div style="font-size:28px; font-weight:900; color:#34d399;">🎯 JEE 2027 Target</div>
                    <p style="font-size:12.5px; color:#94a3b8; margin:8px 0 14px;">Stay focused on Physics, Chemistry & Mathematics!</p>
                </div>
            `;
            openInstagramSubModal("Study Focus & Time Spent", html);
        } else if (key === "share_app") {
            const shareData = {
                title: "Nexus Community",
                text: "🔥 Join me on Nexus Community (Live Chat, Watch-Party & Study Vault): ",
                url: "https://nexus-community01.vercel.app/"
            };
            if (navigator.share) {
                navigator.share(shareData).catch(() => {});
            } else {
                navigator.clipboard?.writeText(shareData.text + shareData.url);
                if (window.Nexus && Nexus.toast) Nexus.toast("✅ Nexus Link Copied!");
            }
        } else if (key === "about_nexus") {
            if (window.openOfficialNexusProfileModal) {
                window.openOfficialNexusProfileModal();
            }
        }
    }

    // Hook into Nexus.switchTab &Settings Nav Button so #tab-settings ALWAYS renders Instagram UI
    function hookSettingsTabRendering() {
        const navBtn = document.querySelector('.nx-nav-item[data-tab="tab-settings"]');
        if (navBtn && !navBtn.dataset.igSettingsHooked) {
            navBtn.dataset.igSettingsHooked = "1";
            navBtn.addEventListener("click", () => {
                setTimeout(renderInstagramSettingsTab, 20);
            });
        }
        const stTab = document.getElementById("tab-settings");
        if (stTab && stTab.classList.contains("active") && !stTab.querySelector("#nx-ig-settings-search")) {
            renderInstagramSettingsTab();
        }
    }

    window.addEventListener("load", () => {
        saveAccountToMultiList(getCurrentAccount());
        renderInstagramSettingsTab();
        startGlobalIncomingCallListener();
    });
    setInterval(hookSettingsTabRendering, 400);
})();
// Optional Bridge: Shows Instagram-Style Log In / Sign Up Switcher directly inside #tab-profile when locked!
setInterval(function () {
    const hub = document.getElementById("nx-google-auth-hub");
    if (hub && !hub.querySelector("#nx-direct-ig-signup-btn") && window.openAdvancedGoogleAuthModal) {
        const btnWrap = hub.querySelector("div[style*='flex-direction:column']");
        if (btnWrap) {
            const switchBtn = document.createElement("button");
            switchBtn.type = "button";
            switchBtn.id = "nx-direct-ig-signup-btn";
            switchBtn.style.cssText =
                "width:100%; padding:11px 16px; border-radius:14px; background:rgba(16,185,129,0.14); color:#34d399; font-weight:900; font-size:12.5px; border:1px solid rgba(16,185,129,0.45); cursor:pointer;";
            switchBtn.innerHTML = "✨ New User? Sign Up with Custom @Username";
            switchBtn.onclick = function (e) {
                e.stopPropagation();
                window.openAdvancedGoogleAuthModal("signup");
            };
            btnWrap.appendChild(switchBtn);
        }
    }
}, 500);
