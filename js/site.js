/* Verinoda Labs v3 — shared page script (every page; classic, deferred, no library).
   Phone menu, motion (reveal on scroll, counting numbers, header, cover parallax fallback), copy buttons, tabs, before/after
   comparison. Everything works without it. */
(function () {
  var html = document.documentElement;

  // ---- phone menu: Escape closes and returns focus, a link tap closes
  var btn = document.querySelector('.nav__toggle'), list = document.getElementById('navlist');
  if (btn && list) {
    var nav = btn.closest('nav'), top = nav && nav.parentNode;
    // everything outside the menu (page content, skip link, brand, footer) is inert while the menu is open
    var behind = function () {
      var out = [];
      Array.prototype.forEach.call(document.body.children, function (c) { if (c !== top && c.tagName !== 'SCRIPT') out.push(c); });
      if (top) Array.prototype.forEach.call(top.children, function (c) { if (c !== nav) out.push(c); });
      return out;
    };
    var hide = function (el, on) {
      if ('inert' in el) { el.inert = on; return; }
      if (on) { el.setAttribute('aria-hidden', 'true'); el.querySelectorAll('a,button,input,select,textarea,[tabindex]').forEach(function (f) { f.setAttribute('data-ti', f.getAttribute('tabindex') || ''); f.setAttribute('tabindex', '-1'); }); }
      else { el.removeAttribute('aria-hidden'); el.querySelectorAll('[data-ti]').forEach(function (f) { var t = f.getAttribute('data-ti'); if (t) f.setAttribute('tabindex', t); else f.removeAttribute('tabindex'); f.removeAttribute('data-ti'); }); }
    };
    var set = function (open) {
      btn.setAttribute('aria-expanded', String(open)); html.classList.toggle('menu-open', open);
      behind().forEach(function (el) { hide(el, open); });
    };
    btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (!html.classList.contains('menu-open')) return;
      if (e.key === 'Escape') { set(false); btn.focus(); return; }
      if (e.key !== 'Tab') return;
      // focus cycles through the toggle and the menu links only
      var ring = [btn].concat([].slice.call(list.querySelectorAll('a[href]'))), at = ring.indexOf(document.activeElement);
      if (e.shiftKey) { if (at <= 0) { e.preventDefault(); ring[ring.length - 1].focus(); } }
      else if (at === -1 || at === ring.length - 1) { e.preventDefault(); ring[0].focus(); }
    });
    list.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    var mq = matchMedia('(max-width: 960px)');
    if (mq.addEventListener) mq.addEventListener('change', function (m) { if (!m.matches && html.classList.contains('menu-open')) set(false); });
  }

  // ---- motion: reveal once and never replay; content is visible without this script and under reduced motion
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var els = [].slice.call(document.querySelectorAll('[data-reveal]')), lines = [].slice.call(document.querySelectorAll('.sec--beam'));
  var showAll = function () { els.forEach(function (el) { el.classList.add('is-in'); }); lines.forEach(function (el) { el.classList.add('is-drawn'); }); };
  try {
    if (performance.now() > 1900) { document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('is-now'); }); showAll(); }   // late script: the CSS net has already shown everything, do not blink it back
    else if ('IntersectionObserver' in window && !reduce) {
      var sep = (html.lang || '').slice(0, 2) === 'tr' ? ',' : '.', plain = new RegExp('^\\d+(\\' + sep + '\\d+)?$');
      // headings and big numbers rise out of a mask; plain counts and decimals also count up (final text = the text in the page, character for character)
      document.querySelectorAll('.sec__head .t-h2, .cta__h, h2[data-reveal], .stat__n, .msr__n').forEach(function (h) {
        if (!h.closest('[data-reveal]') || (h.firstElementChild && h.firstElementChild.className === 'mk')) return;
        var mk = document.createElement('span'), inner = document.createElement('span'), txt = h.textContent.trim();
        mk.className = 'mk'; inner.className = 'mk__i';
        while (h.firstChild) inner.appendChild(h.firstChild);
        mk.appendChild(inner); h.appendChild(mk);
        if (/stat__n|msr__n/.test(h.className) && plain.test(txt)) inner._c = { txt: txt, to: parseFloat(txt.replace(',', '.')), dp: (txt.split(sep)[1] || '').length };
      });
      var count = function (n, delay) {
        var c = n._c, mk = n.parentNode, t0 = 0;
        mk.style.minWidth = mk.offsetWidth + 'px';   // the final width is reserved: counting never moves the layout
        var fmt = function (v) { var t = v.toFixed(c.dp); return sep === ',' ? t.replace('.', ',') : t; };
        n.textContent = fmt(0);
        var step = function (t) {
          t0 = t0 || t; var k = Math.min(1, (t - t0) / 1100);
          n.textContent = k < 1 ? fmt(c.to * (1 - Math.pow(1 - k, 3))) : c.txt;
          if (k < 1) requestAnimationFrame(step);
        };
        setTimeout(function () { requestAnimationFrame(step); }, delay);
      };
      var jump = 0, deep = scrollY > 60 || !!location.hash;   // opened mid-page / on an anchor / after a big jump: what is in view shows at once
      var done = function (el, now, k) {
        var drawn = el.classList.contains('sec--beam');
        if (now) el.classList.add('is-now');
        el.classList.add(drawn ? 'is-drawn' : 'is-in'); io.unobserve(el);
        if (!now && !drawn) el.querySelectorAll('.mk__i').forEach(function (n) { if (n._c) count(n, 160 + Math.min(k, 9) * 60); });
      };
      var io = new IntersectionObserver(function (es) {
        var vis = [], now = deep || performance.now() < jump;
        es.forEach(function (e) {
          if (e.isIntersecting) vis.push(e.target);
          else if (e.boundingClientRect.top < 0) done(e.target, true, 0);   // already behind us: never left empty
        });
        vis.sort(function (a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; });
        vis.forEach(function (el, k) { el.style.setProperty('--si', Math.min(k, 9)); done(el, now, k); });
        deep = false;
      }, { rootMargin: '0px 0px 6% 0px' });
      els.concat(lines).forEach(function (el) { io.observe(el); });
      var y0 = scrollY;
      addEventListener('scroll', function () { var y = scrollY; if (Math.abs(y - y0) > innerHeight * .8) jump = performance.now() + 300; y0 = y; }, { passive: true });
    } else showAll();
  } catch (err) { showAll(); }
  html.classList.add('motion-ready');

  // ---- header: transparent over the opening, takes its floor when the page scrolls, leaves on the way down and returns on the way up
  var bar = document.querySelector('.top');
  if (bar) {
    var by = scrollY, solid = false, gone = false, queued = false, ride = document.querySelector('.prism');
    var bset = function () {
      queued = false;
      var y = scrollY, dy = y - by, hide = gone;
      if (y > 12 !== solid) { solid = !solid; bar.classList.toggle('is-solid', solid); }
      var rr = ride && ride.getBoundingClientRect();   // the home page's pinned ride keeps the nav on screen
      if (y < bar.offsetHeight || html.classList.contains('menu-open') || (rr && rr.bottom > 0 && rr.top < innerHeight)) hide = false;
      else if (dy > 6) hide = !bar.querySelector(':focus-visible');
      else if (dy < -6) hide = false;
      if (Math.abs(dy) > 6) by = y;
      if (hide !== gone && !reduce) { gone = hide; bar.classList.toggle('is-hid', gone); }
    };
    addEventListener('scroll', function () { if (!queued) { queued = true; requestAnimationFrame(bset); } }, { passive: true });
    bar.addEventListener('focusin', function () { if (gone) { gone = false; bar.classList.remove('is-hid'); } });
    bset();
  }

  // ---- cover parallax where CSS scroll timelines are missing (laptop, fine pointer): <= 40 px, only while the cover is on screen
  var cov = document.querySelector('.ph--cover .ph__img');
  if (cov && !reduce && matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)').matches && !(window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()'))) {
    var hero = cov.closest('.ph'), seen = true, wait = false;
    html.classList.add('par-js');
    var par = function () { wait = false; cov.style.translate = '0 ' + Math.min(40, 40 * scrollY / (hero.offsetHeight * .9)).toFixed(1) + 'px'; };
    new IntersectionObserver(function (es) { seen = es[0].isIntersecting; if (seen) par(); }).observe(hero);
    addEventListener('scroll', function () { if (seen && !wait) { wait = true; requestAnimationFrame(par); } }, { passive: true });
  }

  // ---- copy buttons (hidden until the clipboard is available)
  document.querySelectorAll('.cmd__copy').forEach(function (b) {
    if (!navigator.clipboard) return;
    b.hidden = false;
    var label = b.textContent;
    b.addEventListener('click', function () {
      var code = b.closest('.cmd').querySelector('code').textContent;
      navigator.clipboard.writeText(code).then(function () {
        b.textContent = b.dataset.copied || label; b.classList.add('is-done');
        setTimeout(function () { b.textContent = label; b.classList.remove('is-done'); }, 1600);
      });
    });
  });

  // ---- tabs (ARIA pattern: arrows, Home, End); without this script every panel is visible
  document.querySelectorAll('[data-tabs]').forEach(function (box) {
    var tabs = [].slice.call(box.querySelectorAll('[role="tab"]'));
    var strip = box.querySelector('[role="tablist"]'), ind = null, cur = 0;
    // one indicator slides between the tabs (transform only); the first placement does not animate
    var place = function () {
      var t = tabs[cur]; if (!ind || !t || !t.offsetWidth) return;
      var pad = parseFloat(getComputedStyle(t).paddingLeft) || 16;
      ind.style.transform = 'translateX(' + (t.offsetLeft + pad) + 'px) scaleX(' + ((t.offsetWidth - 2 * pad) / 100) + ')';
    };
    if (strip) { ind = document.createElement('span'); ind.className = 'tabs__ind'; ind.setAttribute('aria-hidden', 'true'); strip.appendChild(ind); strip.classList.add('has-ind'); }
    var show = function (i, focus) {
      cur = i;
      tabs.forEach(function (t, k) {
        var on = k === i, p = document.getElementById(t.getAttribute('aria-controls'));
        t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (p) p.hidden = !on;
      });
      place();
      if (focus) tabs[i].focus();
    };
    // the tab strip scrolls sideways when it overflows: fade the edge that has more behind it
    var edges = function () {
      if (!strip) return;
      strip.classList.toggle('can-start', strip.scrollLeft > 2);
      strip.classList.toggle('can-end', strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 2);
    };
    if (strip) { strip.addEventListener('scroll', edges, { passive: true }); addEventListener('resize', edges); addEventListener('load', edges); edges(); }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(i); if (strip && strip.scrollWidth > strip.clientWidth) t.scrollIntoView({ block: 'nearest', inline: 'nearest' }); });
      t.addEventListener('keydown', function (e) {
        var k = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (k === undefined) return; e.preventDefault(); show((k + tabs.length) % tabs.length, true);
      });
    });
    show(0);
    if (ind) {
      if ('ResizeObserver' in window) new ResizeObserver(place).observe(strip); else addEventListener('resize', place);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
      requestAnimationFrame(function () { requestAnimationFrame(function () { ind.classList.add('is-live'); }); });
    }
  });

  // ---- before/after: the range input carries keyboard and assistive tech; a pointer drag anywhere on the frame moves it too
  document.querySelectorAll('.cmp').forEach(function (fig) {
    var frame = fig.querySelector('.cmp__frame'), range = fig.querySelector('.cmp__range');
    if (!frame || !range) return;
    var raf = 0, want = 50;
    var paint = function () { raf = 0; fig.style.setProperty('--pos', want); };
    var setPos = function (v) { want = Math.max(0, Math.min(100, v)); range.value = String(Math.round(want)); if (!raf) raf = requestAnimationFrame(paint); };
    range.addEventListener('input', function () { setPos(+range.value); });
    // mouse: press and drag anywhere. touch: only a horizontal drag moves the divider; a vertical swipe scrolls the page
    var drag = false, pending = null;
    var at = function (e) { var r = frame.getBoundingClientRect(); return (e.clientX - r.left) / r.width * 100; };
    frame.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') {
        if (e.button !== 0) return;
        drag = true; frame.setPointerCapture(e.pointerId); setPos(at(e)); e.preventDefault(); range.focus({ preventScroll: true });
      } else { pending = { x: e.clientX, y: e.clientY, id: e.pointerId }; }
    });
    frame.addEventListener('pointermove', function (e) {
      if (pending && e.pointerId === pending.id) {
        var dx = Math.abs(e.clientX - pending.x), dy = Math.abs(e.clientY - pending.y);
        if (dx > 6 && dx > dy) { drag = true; frame.setPointerCapture(e.pointerId); pending = null; }
        else if (dy > 6) { pending = null; }
      }
      if (drag) setPos(at(e));
    });
    var end = function () { drag = false; pending = null; };
    frame.addEventListener('pointerup', end); frame.addEventListener('pointercancel', end);
  });
})();
