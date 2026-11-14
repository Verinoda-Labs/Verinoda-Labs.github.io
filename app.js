/* Verinoda Labs site: hash router, EN/TR, reveals, contact form. No dependencies. */
(function () {
  'use strict';
  var CONTACT_EMAIL = ''; // set to an address to send the form by mail; empty opens a pre-filled GitHub issue
  var ISSUE_URL = 'https://github.com/Verinoda-Labs/verinoda/issues/new';
  var app = document.getElementById('app');
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var st = { lang: 'en', page: 'home', target: null, topic: 0, sent: false, err: '', form: { name: '', company: '', email: '', message: '' } };
  var io = null, termTimer = null;

  function T() { return I18N[st.lang]; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function each(a, f) { return a.map(f).join(''); }
  function ext(u) { return /^https?:/.test(u); }
  function A(cls, href, label, arrow) {
    var x = ext(href);
    return '<a class="btn ' + cls + '" href="' + esc(href) + '"' + (x ? ' target="_blank" rel="noopener"' : '') + '><span>' + esc(label) + '</span><span class="ar" aria-hidden="true">' + (arrow || (x ? '↗' : '→')) + '</span></a>';
  }
  function stTag(w, t) {
    var cls = (w.status === 'live' || w.status === 'released') ? 'live' : (w.status === 'beta' || w.status === 'early') ? 'acc' : '';
    var label = t.status[w.status];
    if (w.ver && w.ver !== 'beta') label = w.status === 'beta' ? w.ver + ' · ' + label : label + ' · ' + w.ver;
    return '<span class="st ' + cls + '">' + esc(label) + '</span>';
  }
  function nm(w) { return (st.lang === 'tr' && w.nameTr) || w.name; }
  function kindLabel(w, t) { return w.kind === 'app' ? t.cats[w.cat] : t.kinds[w.kind]; }
  function workHref(w) { return w.kind === 'tool' ? w.url : '#/work/' + w.id; }
  function lines(s) { return s.split(/(?<=\.)\s+/).map(function (l, i) { return '<span class="ln"><span style="--d:' + (i * 120) + 'ms">' + esc(l) + '</span></span>'; }).join(''); }

  /* ---------- shared chrome ---------- */
  function nav(t) {
    var n = t.nav;
    var items = [['#/', n.works, 'home', WORKS.length], ['#/verinoda', n.verinoda, 'verinoda'], ['#/skills', n.skills, 'skills', 3], ['#/apps', n.apps, 'apps', 8], ['#/install', n.install, 'install']];
    return '<nav class="top" aria-label="Main"><div class="wrap nav-in">' +
      '<a href="#/" class="brand" aria-label="Verinoda Labs"><span class="sq"></span><span>Verinoda Labs</span></a>' +
      '<div class="nav-right"><div class="nav-links" id="nav-links">' +
      each(items, function (i) {
        var cur = st.page === i[2] && !(i[2] === 'home' && st.target);
        return '<a href="' + i[0] + '"' + (cur ? ' aria-current="page"' : '') + '>' + esc(i[1]) + (i[3] ? '<sup>' + i[3] + '</sup>' : '') + '</a>';
      }) +
      '<a class="alt-l" href="alt/">' + esc(n.alt) + ' <span aria-hidden="true">↗</span></a><a class="m-only" href="#/contact">' + esc(n.contact) + '</a></div><a class="nav-cta" href="#/contact">' + esc(n.contact) + '</a>' +
      '<div class="lang" role="group" aria-label="Language">' +
      ['en', 'tr'].map(function (l) { return '<button type="button" data-lang="' + l + '" aria-pressed="' + (st.lang === l) + '">' + l.toUpperCase() + '</button>'; }).join('') +
      '</div><button type="button" class="menu-btn" id="menu" aria-expanded="false" aria-controls="nav-links">' + (st.lang === 'tr' ? 'Menü' : 'Menu') + '</button></div></div></nav>';
  }

  function cta(t) {
    return '<section class="cta"><div class="wrap"><h2 data-r>' + esc(t.cta.title) + '</h2>' +
      '<div class="cta-row" data-r><p>' + esc(t.cta.body) + '</p><div class="btns">' +
      A('p', '#/contact', t.nav.contact) + A('', URL_ORG, t.cta.gh) + '</div></div></div></section>';
  }

  function footer(t) {
    return '<footer><div class="wrap foot"><div><a href="#/" class="brand"><span class="sq"></span><span>Verinoda Labs</span></a>' +
      '<p class="copy">© 2026 Verinoda Labs</p></div>' +
      '<div class="foot-links"><a href="#/verinoda">Verinoda</a><a href="#/symbiosis">Symbiosis</a><a href="#/skills">' + esc(t.nav.skills) + '</a><a href="#/apps">' + esc(t.nav.apps) + '</a>' +
      '<a href="#/install">' + esc(t.nav.install) + '</a><a href="#/contact">' + esc(t.nav.contact) + '</a>' +
      '<a href="alt/">' + esc(t.nav.alt) + '</a><a href="' + URL_ORG + '" target="_blank" rel="noopener">GitHub ↗</a><a href="https://pypi.org/project/verinoda/" target="_blank" rel="noopener">PyPI ↗</a></div>' +
      '<p class="note">' + esc(t.footer.note) + '</p></div></footer>';
  }

  /* ---------- home ---------- */
  function wall(t) {
    var cells = each(WORKS, function (w, i) {
      var d = 'style="--d:' + (300 + i * 45) + 'ms"';
      if (w.id === 'verinoda') {
        return '<a class="cell hi" href="' + workHref(w) + '" ' + d + '><div class="cell-h"><span class="st k">' + esc(t.kinds.tool) + '</span>' + stTag(w, t) + '</div>' +
          '<div><strong>Verinoda</strong><p>' + esc(t.home.verinodaCell) + '</p></div><span class="go" aria-hidden="true">→</span></a>';
      }
      return '<a class="cell" href="' + workHref(w) + '" ' + d + '><div class="cell-h"><span class="st k">' + esc(kindLabel(w, t)) + '</span>' + stTag(w, t) + '</div>' +
        '<strong>' + esc(w.short || nm(w)) + '</strong><span class="go" aria-hidden="true">→</span></a>';
    });
    cells += '<a class="cell next" href="#/contact" style="--d:' + (300 + WORKS.length * 45) + 'ms"><div class="cell-h"><span class="st k">' + esc(t.home.nextKind) + '</span><span class="st acc">?</span></div>' +
      '<strong>' + esc(t.home.nextName) + '</strong><span class="go" aria-hidden="true">→</span></a>';
    return '<div class="wall" id="wall">' + cells + '</div>';
  }

  function home(t) {
    var f = t.flag, max = 319;
    var skills = WORKS.filter(function (w) { return w.kind === 'skill'; });
    var apps = WORKS.filter(function (w) { return w.kind === 'app'; });
    return '<section class="hero" aria-label="Verinoda Labs"><div class="hero-l"><div><p class="meta kick">' + esc(t.home.kicker) + '</p>' +
      '<h1>' + lines(t.home.title) + '</h1><p class="lead">' + esc(t.home.lead) + '</p></div>' +
      '<div class="btns">' + A('p', '#/skills', t.home.cta1, '↓') + A('', '#/contact', t.home.cta2) + '</div></div>' + wall(t) + '</section>' +

      '<section class="stats" aria-label="Facts">' + each(t.stats, function (s, i) { return '<div class="stat" data-r style="--d:' + i * 80 + 'ms"><b>' + esc(s.v) + '</b><span>' + esc(s.l) + '</span></div>'; }) + '</section>' +

      '<section class="wrap sec" id="flag"><div class="flag"><div data-r><p class="meta kick">' + esc(f.kicker) + '</p><h2>' + esc(f.title) + '</h2>' +
      '<p class="body">' + esc(f.body) + '</p><p class="big-claim">' + esc(f.big) + '</p>' +
      '<div class="btns">' + A('p', '#/verinoda', f.cta1) + A('', '#/install', f.cta2) + '</div></div>' +
      '<div class="term-wrap" data-r style="--d:120ms"><div class="term" aria-hidden="true"><div class="term-bar"><span class="meta">verinoda 0.5.0</span><span><i></i><i></i></span></div>' +
      '<div class="term-body" id="term">' + each(TERM, function (l) { return '<div class="tl k-' + l[1] + '">' + (esc(l[0]) || '&nbsp;') + '</div>'; }) + '</div></div></div></div>' +
      '<div class="bench" data-r><div><h3>' + esc(f.benchTitle) + '</h3><p class="note">' + esc(f.benchNote) + '</p></div><div class="bars" id="bars">' +
      each(BENCH, function (b) {
        var label = b.k === 's' ? f.plain : b.label;
        return '<div><div class="bar-top"><b>' + b.facts + '<small>/ ' + max + '</small></b><span>' + esc(label) + ' · ' + esc(b.tok) + ' ' + esc(f.perQ) + '</span></div>' +
          '<div class="bar-track"><div class="bar-fill ' + b.k + '" data-w="' + (b.facts / max * 100).toFixed(1) + '"></div></div></div>';
      }) + '</div></div>' +
      '<div class="sym" data-r><div><h3>' + esc(f.symTitle) + '</h3><p>' + esc(f.symBody) + '</p></div>' + A('', '#/symbiosis', f.symCta) + '</div></section>' +

      '<section class="wrap sec rule target" id="skills"><div class="sec-head" data-r><div><p class="meta kick">' + esc(t.skills.kicker) + '</p><h2>' + esc(t.skills.title) + '</h2></div><p class="lead">' + esc(t.skills.lead) + '</p></div>' +
      '<div class="rows">' + each(skills, function (w, i) {
        return '<article class="row target" id="w-' + w.id + '" data-r><span class="meta n">0' + (i + 1) + '</span><h3>' + esc(w.name) + '</h3><p>' + esc(t.skills.items[w.id]) + '</p>' +
          '<div class="side"><span class="st">' + esc(w.ver) + '</span><span class="st dim">' + esc(t.status.private) + '</span></div></article>';
      }) + '</div><div class="row-foot" data-r><span class="muted">' + esc(t.privateNote) + ' · ' + esc(t.kinds.skill) + '</span>' + A('', '#/contact', t.skills.access) + '</div></section>' +

      '<section class="band target" id="apps"><div class="wrap sec"><div class="sec-head" data-r><div><p class="meta kick">' + esc(t.apps.kicker) + '</p><h2>' + esc(t.apps.title) + '</h2></div><p class="lead">' + esc(t.apps.lead) + '</p></div>' +
      '<div class="cards">' + each(apps, function (w, i) {
        var link = w.url ? '<span class="lnk">' + esc(w.urlKey === 'map' ? t.openMap : w.urlKey === 'download' ? t.openDl : t.open) + ' ↗</span>' : '<span class="lock">' + esc(t.privateNote) + '</span>';
        var inner = '<div class="cell-h"><span class="st k">' + esc(t.cats[w.cat]) + '</span>' + stTag(w, t) + '</div><h3>' + esc(nm(w)) + '</h3><p>' + esc(t.apps.items[w.id]) + '</p>' +
          '<div class="card-f"><span class="tech">' + esc(w.tech) + '</span>' + link + '</div>';
        var attrs = ' class="card target" id="w-' + w.id + '" data-r style="--d:' + (i % 4) * 70 + 'ms"';
        return w.url ? '<a' + attrs + ' href="' + esc(w.url) + '" target="_blank" rel="noopener">' + inner + '</a>' : '<article' + attrs + '>' + inner + '</article>';
      }) + '</div></div></section>' +

      '<section class="wrap sec"><div class="sec-head" data-r><div><p class="meta kick">' + esc(t.way.kicker) + '</p><h2>' + esc(t.way.title) + '</h2></div></div>' +
      '<div class="way">' + each(t.way.items, function (w, i) { return '<div class="way-i" data-r style="--d:' + i * 90 + 'ms"><h3>' + esc(w.t) + '</h3><p>' + esc(w.b) + '</p></div>'; }) + '</div></section>';
  }

  /* ---------- product pages ---------- */
  function product(t, id) {
    var p = t.product[id], w = WORKS.filter(function (x) { return x.id === id; })[0];
    var out = '<section class="wrap p-hero"><div data-r><a class="back meta" href="#/"><span aria-hidden="true">←</span>' + esc(t.back) + '</a>' +
      '<h1>' + esc(p.headline) + '</h1><p class="lead">' + esc(p.lead) + '</p><p class="body">' + esc(p.body) + '</p>' +
      (p.big ? '<p class="big-claim">' + esc(p.big) + '</p>' : '') +
      '<div class="btns">' + A('p', p.url, 'GitHub') + A('', '#/install', t.nav.install) + '</div></div>' +
      '<div class="notes" data-r style="--d:120ms"><h4 class="meta">' + esc(p.noteTitle) + ' · ' + esc(p.tag) + '</h4>' +
      each(p.notes, function (n) { return '<div class="note-r"><span>' + esc(n.k) + '</span><span>' + esc(n.v) + '</span></div>'; }) + '</div></section>' +

      '<section class="wrap sec"><div class="sec-head" data-r><div><p class="meta kick">' + esc(w.tech) + '</p><h2>' + esc(p.featTitle) + '</h2></div></div>' +
      '<div class="feats">' + each(p.features, function (f, i) { return '<div class="feat" data-r style="--d:' + (i % 3) * 70 + 'ms"><span class="meta n">0' + (i + 1) + '</span><h3>' + esc(f.t) + '</h3><p>' + esc(f.b) + '</p></div>'; }) + '</div></section>' +

      '<section class="band"><div class="wrap sec split"><div data-r><p class="meta kick">' + esc(t.install.quickTitle) + '</p><h2>' + esc(p.codeTitle) + '</h2><p class="muted">' + esc(p.codeBody) + '</p></div>' +
      '<div class="code" data-r style="--d:120ms">' + each(p.code, function (c) { return '<div class="code-r"><code>' + esc(c.cmd) + '</code><span class="c-note">' + esc(c.note) + '</span></div>'; }) + '</div></div></section>';

    if (id === 'verinoda') {
      var m = t.meas;
      out += '<section class="wrap sec target" id="olcum"><div class="sec-head" data-r><div><p class="meta kick">' + esc(m.kicker) + '</p><h2>' + esc(m.title) + '</h2></div></div>' +
        '<div class="meas"><div class="meas-i ok" data-r><h3>' + esc(m.noModel) + '</h3><p>' + esc(m.noModelBody) + '</p></div>' +
        '<div class="meas-i warn" data-r style="--d:90ms"><h3>' + esc(m.withModel) + '</h3><p>' + esc(m.withModelBody) + '</p></div></div>' +
        '<div class="row-foot" data-r>' + A('', URL_README_RESULTS, m.link) + '</div></section>';
    }
    return out;
  }

  function install(t) {
    var c = t.install;
    return '<section class="wrap p-hero"><div data-r><p class="meta kick">' + esc(c.kicker) + '</p><h1>' + esc(c.title) + '</h1><p class="body">' + esc(c.lead) + '</p></div>' +
      '<div data-r style="--d:120ms"><div class="code">' + each(INSTALL, function (r, i) {
        return '<div class="code-r"><div><span class="tag-l">' + esc(r[0]) + '</span><code>' + esc(r[1]) + '</code></div><button type="button" class="copy-btn" data-copy="' + i + '">' + esc(c.copy) + '</button></div>';
      }) + '</div><p class="callout">' + esc(c.npm) + '</p></div></section>' +
      '<section class="wrap sec split"><div data-r><h2>' + esc(c.quickTitle) + '</h2></div><div class="code" data-r>' +
      each(c.quick, function (q) { return '<div class="code-r"><code>' + esc(q.cmd) + '</code><span class="c-note">' + esc(q.note) + '</span></div>'; }) + '</div></section>' +
      '<section class="band"><div class="wrap sec split"><div data-r><h2>' + esc(c.reqTitle) + '</h2></div><div class="notes" data-r>' +
      each(c.reqs, function (r) { return '<div class="note-r"><span>' + esc(r.k) + '</span><span>' + esc(r.v) + '</span></div>'; }) + '</div></div></section>';
  }

  function contact(t) {
    var c = t.contact, f = st.form;
    var right = st.sent
      ? '<div class="thanks" data-r><h3>' + esc(c.thanksTitle) + '</h3><p>' + esc(c.thanksBody) + '</p><button type="button" class="btn" id="again"><span>' + esc(c.again) + '</span><span class="ar" aria-hidden="true">→</span></button></div>'
      : '<form class="form" novalidate data-r style="--d:120ms"><div class="field"><span class="meta muted">' + esc(c.topic) + '</span><div class="topics" role="group" aria-label="' + esc(c.topic) + '">' +
        each(c.topics, function (x, i) { return '<button type="button" data-topic="' + i + '" aria-pressed="' + (st.topic === i) + '">' + esc(x) + '</button>'; }) + '</div></div>' +
        '<div class="two"><div class="field"><label for="f-name" class="meta">' + esc(c.name) + '</label><input id="f-name" name="name" autocomplete="name" value="' + esc(f.name) + '"></div>' +
        '<div class="field"><label for="f-company" class="meta">' + esc(c.company) + '</label><input id="f-company" name="company" autocomplete="organization" value="' + esc(f.company) + '"></div></div>' +
        '<div class="field"><label for="f-email" class="meta">' + esc(c.email) + '</label><input id="f-email" name="email" type="email" autocomplete="email" required value="' + esc(f.email) + '"></div>' +
        '<div class="field"><label for="f-message" class="meta">' + esc(c.message) + '</label><textarea id="f-message" name="message" required>' + esc(f.message) + '</textarea></div>' +
        '<p class="err" id="err" role="alert">' + esc(st.err ? c[st.err] : '') + '</p>' +
        '<div class="btns"><button type="submit" class="btn p"><span>' + esc(c.send) + '</span><span class="ar" aria-hidden="true">→</span></button></div></form>';
    return '<section class="wrap p-hero" style="align-items:start"><div data-r><p class="meta kick">' + esc(c.kicker) + '</p><h1>' + esc(c.title) + '</h1><p class="body">' + esc(c.lead) + '</p>' +
      '<div class="reasons">' + each(c.reasons, function (r) { return '<div class="reason"><b>' + esc(r.k) + '</b><span>' + esc(r.v) + '</span></div>'; }) + '</div></div>' + right + '</section>';
  }

  /* ---------- render + router ---------- */
  function render() {
    var t = T(), body;
    document.documentElement.lang = st.lang;
    if (st.page === 'verinoda' || st.page === 'symbiosis') body = product(t, st.page);
    else if (st.page === 'install') body = install(t);
    else if (st.page === 'contact') body = contact(t);
    else body = home(t);
    app.innerHTML = nav(t) + '<main id="main" tabindex="-1">' + body + (st.page === 'contact' ? '' : cta(t)) + '</main>' + footer(t);
    var names = { home: '', verinoda: 'Verinoda', symbiosis: 'Verinoda Symbiosis', install: t.nav.install, contact: t.nav.contact };
    document.title = names[st.page] ? names[st.page] + ' — Verinoda Labs' : (st.lang === 'tr' ? 'Verinoda Labs — çalışan araçlar, skiller ve oyunlar' : 'Verinoda Labs — tools, skills and games that work');
    afterRender();
  }

  function afterRender() {
    if (io) io.disconnect();
    var els = app.querySelectorAll('[data-r]');
    var hero = app.querySelector('.hero');
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach(function (e) { e.classList.add('in'); });
      if (hero) hero.classList.add('in');
      runTerm(true); fillBars();
    } else {
      io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add('in'); io.unobserve(en.target);
          if (en.target.querySelector('#term')) runTerm(false);
          if (en.target.querySelector('#bars')) fillBars();
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      els.forEach(function (e) { io.observe(e); });
      if (hero) requestAnimationFrame(function () { requestAnimationFrame(function () { hero.classList.add('in'); }); });
    }
    var w = document.getElementById('wall');
    if (w && window.matchMedia('(pointer:fine)').matches) {
      w.addEventListener('pointermove', function (e) { var r = w.getBoundingClientRect(); w.style.setProperty('--x', (e.clientX - r.left) + 'px'); w.style.setProperty('--y', (e.clientY - r.top) + 'px'); w.classList.add('lit'); });
      w.addEventListener('pointerleave', function () { w.classList.remove('lit'); });
    }
  }

  function runTerm(all) {
    var ls = app.querySelectorAll('#term .tl');
    if (!ls.length) return;
    clearTimeout(termTimer);
    if (all) { ls.forEach(function (l) { l.classList.add('on'); }); return; }
    var i = 0;
    (function step() { if (i >= ls.length) return; ls[i].classList.add('on'); i++; termTimer = setTimeout(step, i === 1 ? 500 : 220); })();
  }
  function fillBars() { app.querySelectorAll('.bar-fill').forEach(function (b) { b.style.width = b.getAttribute('data-w') + '%'; }); }

  function parse() {
    var h = (location.hash || '').replace(/^#\/?/, '');
    var parts = h.split('/');
    var p = parts[0] || 'home';
    if (p === 'benchmarks') return { page: 'verinoda', target: 'olcum' };
    if (p === 'work' && parts[1]) return { page: 'home', target: 'w-' + parts[1] };
    if (p === 'skills' || p === 'apps') return { page: 'home', target: p };
    if (PAGES.indexOf(p) < 0) return { page: 'home', target: null };
    return { page: p, target: null };
  }

  function scrollToTarget() {
    if (!st.target) { window.scrollTo(0, 0); return; }
    var el = document.getElementById(st.target);
    if (!el) { window.scrollTo(0, 0); return; }
    el.classList.add('in');
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: st.target.indexOf('w-') === 0 ? 'center' : 'start' });
    if (st.target.indexOf('w-') === 0) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
  }

  function go(r) {
    var samePage = r.page === st.page && app.innerHTML;
    st.target = r.target;
    if (samePage) { scrollToTarget(); return; }
    var main = document.getElementById('main');
    var swap = function () { st.page = r.page; st.sent = false; st.err = ''; render(); scrollToTarget(); };
    if (main && !reduce) { main.classList.add('fading'); setTimeout(swap, 260); } else swap();
  }

  /* ---------- events ---------- */
  app.addEventListener('click', function (e) {
    var b = e.target.closest('[data-lang]');
    if (b) { st.lang = b.getAttribute('data-lang'); try { localStorage.setItem('vl-lang', st.lang); } catch (x) {} var y = window.scrollY; render(); window.scrollTo(0, y); return; }
    var tp = e.target.closest('[data-topic]');
    if (tp) { st.topic = +tp.getAttribute('data-topic'); app.querySelectorAll('[data-topic]').forEach(function (x) { x.setAttribute('aria-pressed', x === tp); }); return; }
    var cp = e.target.closest('[data-copy]');
    if (cp) {
      var txt = INSTALL[+cp.getAttribute('data-copy')][1], c = T().install;
      var done = function () { cp.textContent = c.copied; setTimeout(function () { cp.textContent = c.copy; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, function () {}); return;
    }
    var mb = e.target.closest('#menu');
    if (mb) { var nv = mb.closest('nav'), open = !nv.classList.contains('open'); nv.classList.toggle('open', open); mb.setAttribute('aria-expanded', open); return; }
    if (e.target.closest('#again')) { st.sent = false; st.form.message = ''; render(); return; }
    var a = e.target.closest('a[href^="#/"]');
    if (a && a.getAttribute('href') === location.hash) { e.preventDefault(); go(parse()); }
  });

  app.addEventListener('input', function (e) { var n = e.target.name; if (n && n in st.form) st.form[n] = e.target.value; });

  app.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = st.form, c = T().contact, err = null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) err = 'errEmail';
    else if (f.message.trim().length < 4) err = 'errMsg';
    if (err) { st.err = err; document.getElementById('err').textContent = c[err]; return; }
    var topic = c.topics[st.topic];
    var subject = '[' + topic + '] ' + (f.company || f.name || 'Verinoda Labs');
    var text = 'Name: ' + f.name + '\nCompany: ' + f.company + '\nEmail: ' + f.email + '\nTopic: ' + topic + '\n\n' + f.message;
    var url = CONTACT_EMAIL
      ? 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text)
      : ISSUE_URL + '?title=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text);
    window.open(url, CONTACT_EMAIL ? '_self' : '_blank', 'noopener');
    st.sent = true; st.err = '';
    render();
  });

  window.addEventListener('hashchange', function () { go(parse()); });

  /* ---------- boot ---------- */
  try { var saved = localStorage.getItem('vl-lang'); if (saved && I18N[saved]) st.lang = saved; else if ((navigator.language || '').toLowerCase().indexOf('tr') === 0) st.lang = 'tr'; } catch (x) {}
  var r0 = parse(); st.page = r0.page; st.target = r0.target;
  render();
  if (st.target) setTimeout(scrollToTarget, 60);
})();
