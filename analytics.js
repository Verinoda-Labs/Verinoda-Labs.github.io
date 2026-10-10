/* Mixpanel for the Verinoda Labs site. Anonymous only: no accounts, so no identify/reset.
   Honors Do Not Track and Global Privacy Control. Never sends form contents. */
'use strict';
(function () {
  var TOKEN = '4890841dee1d81851378ca960a1db0be';
  var optedOut = navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true;

  window.vlTrack = function (name, props) {
    if (optedOut || !window.mixpanel) return;
    try { window.mixpanel.track(name, props || {}); } catch (e) {}
  };
  if (optedOut) return;

  /* Minimal stub of the official Mixpanel snippet: queues calls until the library loads and replays them. */
  var mp = window.mixpanel = window.mixpanel || [];
  mp._i = [];
  mp.init = function (token, config, name) { mp._i.push([token, config, name || 'mixpanel']); };
  mp.track = function () { mp.push(['track'].concat([].slice.call(arguments))); };
  mp.__SV = 1.2;

  mp.init(TOKEN, { persistence: 'localStorage', ip: false, ignore_dnt: false, track_pageview: false });

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js';
  s.onerror = function () { window.mixpanel = null; };
  document.head.appendChild(s);
})();
