/* Nexus module loader — same-origin, one-time, ordered loading. */
(() => {
  'use strict';

  const MODULES = [
    'aifix.js', 'profilefix.js', 'cards.js', 'notify.js',
    'dmtools.js', 'live.js', 'dminbox.js', 'ai.js',
    'pwa.js', 'dotsmenu.js', 'screen.js', 'voice.js',
    'board.js'
  ];

  // live.js is the active Watch Party engine. ytparty.js also overwrites
  // window.NexusWatchParty and breaks the live.js buttons, so it is retained
  // in the project for reference but is intentionally not auto-loaded.
  const loaded = new Set();

  function loadScript(file) {
    if (loaded.has(file) || document.querySelector(`script[data-nx-module="${file}"]`)) {
      loaded.add(file);
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = new URL(file, document.baseURI).href;
      script.dataset.nxModule = file;
      script.async = false;
      script.charset = 'UTF-8';
      script.onload = () => {
        loaded.add(file);
        resolve();
      };
      script.onerror = () => {
        console.error(`[Nexus] Could not load local module: ${file}`);
        resolve(); // Continue loading other independent modules.
      };
      document.body.appendChild(script);
    });
  }

  async function start() {
    for (const file of MODULES) await loadScript(file);
    window.dispatchEvent(new CustomEvent('nexus:modules-ready', {
      detail: { loaded: [...loaded], expected: MODULES.length }
    }));
  }

  start().catch((error) => console.error('[Nexus] Module startup failed:', error));
})();
