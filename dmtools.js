/* ============================================================================
   NEXUS DMTOOLS.JS (v52.0 ZERO-OVERLOAD CLEAN COMPATIBILITY SHIM)
   - Removes obsolete legacy RTDB listeners & dead click handlers that caused lag
   - Cleanly bridges any legacy NexusJoinCall / attachNexusRealtimeListener calls
   ============================================================================ */
(function () {
    if (window.__NEXUS_DMTOOLS_V52_CLEAN__) return;
    window.__NEXUS_DMTOOLS_V52_CLEAN__ = true;
    window.NEXUS_ENGINE_INITIALIZED = true;

    window.NexusJoinCall = function (_room, withVideo) {
        if (window.NexusLive) {
            if (withVideo) window.NexusLive.startOrJoinVideoRoom(true);
            else window.NexusLive.startVoiceCall(true);
        }
    };
    window.attachNexusRealtimeListener = function () {};
})();
