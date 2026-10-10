/* Mixpanel for the Verinoda Labs site. Anonymous only: no accounts, so no identify/reset.
   Honors Do Not Track and Global Privacy Control. Never sends form contents. */
'use strict';
(function () {
  var TOKEN = '4890841dee1d81851378ca960a1db0be';
  var optedOut = navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl === true;
  var queue = [], ready = false, failed = false;

  window.vlTrack = function (name, props) {
    if (optedOut || failed) return;
    if (ready) window.mixpanel.track(name, props || {});
    else queue.push([name, props || {}]);
  };
  if (optedOut) return;

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js';
  s.onload = function () {
    try {
      window.mixpanel.init(TOKEN, { persistence: 'localStorage', ip: false, ignore_dnt: false, track_pageview: false });
      ready = true;
      queue.splice(0).forEach(function (q) { window.mixpanel.track(q[0], q[1]); });
    } catch (e) { failed = true; queue = []; }
  };
  s.onerror = function () { failed = true; queue = []; };
  document.head.appendChild(s);
})();
