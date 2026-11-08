// ================= SCREEN.JS (v40.0): REAL WEBRTC VIDEO CALL, VOICE CALL & SCREEN SHARE ENGINE =================

(function() {
    let localStream = null;
    let peerConn = null;
    let callUnsub = null;

    const rtcConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    function getMe() {
        try { if (window.Nexus && Nexus.getCurrentUser) return Nexus.getCurrentUser(); } catch (e) {}
        return { username: 'mohiy', name: 'Mohit_01' };
    }

    function getActiveCallRoom() {
        const me = getMe();
        const p = (window.NexusDM && NexusDM.activePartner) || document.getElementById('nx-dm-partner-name')?.innerText || 'room';
        return [String(me.username || '').toLowerCase().trim(), String(p).toLowerCase().trim()].sort().join('__');
    }

    function ensureCallModal() {
        let m = document.getElementById('nx-v40-rtc-modal');
        if (!m) {
            m = document.createElement('div');
            m.id = 'nx-v40-rtc-modal';
            m.style.cssText = 'position:fixed; inset:0; background:#020617; z-index:260000; display:none; flex-direction:column; align-items:center; justify-content:space-between; padding:16px;';
            document.body.appendChild(m);
        }
        return m;
    }

    window.NexusScreen = {
        startShare: async function(mode) {
            return this.startLiveCall('screen');
        },

        startVideoCall: async function() {
            return this.startLiveCall('video');
        },

        startLiveCall: async function(callType) {
            const modal = ensureCallModal();
            const roomKey = getActiveCallRoom();
            const me = getMe();

            modal.innerHTML = `
                <div style="width:100%; display:flex; align-items:center; justify-content:space-between; color:#fff;">
                    <div>
                        <div style="font-size:15px; font-weight:900; color:#10b981;">🟢 Live ${callType === 'screen' ? 'Screen Share' : 'Video Call'}</div>
                        <div id="nx-rtc-status" style="font-size:11.5px; color:#94a3b8;">Connecting real-time WebRTC stream...</div>
                    </div>
                    <button type="button" onclick="NexusScreen.endCall()" style="background:#ef4444; color:#fff; border:none; padding:8px 14px; border-radius:10px; font-weight:900; cursor:pointer;">End Call ✕</button>
                </div>

                <div style="position:relative; width:100%; max-width:600px; flex:1; margin:12px 0; background:#090d16; border:1.5px solid #1e293b; border-radius:18px; overflow:hidden; display:flex; align-items:center; justify-content:center;">
                    <video id="nx-rtc-remote-vid" autoplay playsinline style="width:100%; height:100%; object-fit:contain;"></video>
                    <video id="nx-rtc-local-vid" autoplay playsinline muted style="position:absolute; bottom:12px; right:12px; width:115px; height:155px; object-fit:cover; border-radius:12px; border:2px solid #10b981; background:#000;"></video>
                </div>

                <div style="display:flex; gap:12px;">
                    <button type="button" onclick="NexusScreen.toggleMic(this)" style="background:#1e293b; border:1px solid #334155; color:#fff; padding:11px 18px; border-radius:99px; font-weight:800; cursor:pointer;">🎙️ Mute/Unmute</button>
                    <button type="button" onclick="NexusScreen.switchCameraOrScreen()" style="background:#1e293b; border:1px solid #38bdf8; color:#38bdf8; padding:11px 18px; border-radius:99px; font-weight:800; cursor:pointer;">🔄 Switch Cam/Screen</button>
                    <button type="button" onclick="NexusScreen.endCall()" style="background:#ef4444; border:none; color:#fff; padding:11px 22px; border-radius:99px; font-weight:900; cursor:pointer;">📞 Hang Up</button>
                </div>
            `;
            modal.style.display = 'flex';

            try {
                if (callType === 'screen' && navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
                    try {
                        localStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                    } catch (err) {
                        // Mobile browsers fallback to back camera for notebook/screen sharing
                        localStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: true });
                    }
                } else {
                    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                }

                const localVid = document.getElementById('nx-rtc-local-vid');
                if (localVid) localVid.srcObject = localStream;

                peerConn = new RTCPeerConnection(rtcConfig);
                localStream.getTracks().forEach(track => peerConn.addTrack(track, localStream));

                peerConn.ontrack = event => {
                    const remoteVid = document.getElementById('nx-rtc-remote-vid');
                    if (remoteVid && event.streams && event.streams[0]) {
                        remoteVid.srcObject = event.streams[0];
                        const st = document.getElementById('nx-rtc-status');
                        if (st) st.innerText = '🟢 Connected Live!';
                    }
                };

                if (window.Nexus && Nexus.db) {
                    const callDoc = Nexus.db.collection("nexus_webrtc_calls").doc(roomKey);
                    const offerDesc = await peerConn.createOffer();
                    await peerConn.setLocalDescription(offerDesc);

                    await callDoc.set({
                        caller: me.username,
                        callType: callType,
                        offer: { type: offerDesc.type, sdp: offerDesc.sdp },
                        active: true,
                        updatedAt: Date.now()
                    });

                    callUnsub = callDoc.onSnapshot(async snap => {
                        const data = snap.data();
                        if (!data || !data.active) return;
                        if (data.answer && peerConn && !peerConn.currentRemoteDescription) {
                            await peerConn.setRemoteDescription(new RTCSessionDescription(data.answer));
                        }
                    });
                }
            } catch (e) {
                if (window.Nexus && Nexus.toast) Nexus.toast("⚠️ Please allow Camera & Microphone permissions!");
            }
        },

        toggleMic: function(btn) {
            if (!localStream) return;
            const audioTracks = localStream.getAudioTracks();
            if (!audioTracks.length) return;
            audioTracks[0].enabled = !audioTracks[0].enabled;
            if (btn) btn.innerText = audioTracks[0].enabled ? '🎙️ Mic On' : '🔇 Mic Muted';
        },

        switchCameraOrScreen: async function() {
            this.endCall();
            setTimeout(() => this.startLiveCall('video'), 250);
        },

        endCall: function() {
            if (callUnsub) { callUnsub(); callUnsub = null; }
            if (localStream) {
                localStream.getTracks().forEach(t => t.stop());
                localStream = null;
            }
            if (peerConn) {
                try { peerConn.close(); } catch (e) {}
                peerConn = null;
            }
            const modal = document.getElementById('nx-v40-rtc-modal');
            if (modal) modal.style.display = 'none';
        }
    };
})();
// === END OF SCREEN.JS ===
