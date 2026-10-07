/* Verinoda Labs site: hash-routed pages rendered from data.js. No dependencies. */
'use strict';
(function () {
  var CONTACT_EMAIL = ''; // set to an address to send the form by mail; empty opens a pre-filled GitHub issue
  var ISSUE_URL = 'https://github.com/Verinoda-Labs/verinoda/issues/new';
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var st = { lang: 'en', page: 'home', set: 0, inst: 0, topic: 0, copied: false, sent: false, err: '',
    form: { name: '', company: '', email: '', message: '' } };
  var app = document.getElementById('app');
  var termTimer = null, copyTimer = null, io = null;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  }
  function T() { return I18N[st.lang] || I18N.en; }
  function pageFromHash() {
    var h = location.hash.replace(/^#\/?/, '');
    return PAGES.indexOf(h) >= 0 ? h : 'home';
  }

  /* ---------- fragments ---------- */
  function each(list, fn) { return list.map(fn).join(''); }
  function bar(label, value, total, ours, t, showTotal, display) {
    var lbl = label === 'raw' ? t.bench.raw : label;
    var shown = display || (showTotal ? value + ' / ' + total : value);
    var pct = total ? (value / total * 100).toFixed(1) : 0;
    return '<div><div class="bar-head"><span style="font-weight:' + (ours ? 800 : 400) + '">' + esc(lbl) + '</span>' +
      '<span class="bar-val">' + esc(shown) + '</span></div>' +
      '<div class="bar-track"><div class="bar-fill ' + (ours ? 'ours' : '') + '" data-w="' + pct + '%"></div></div></div>';
  }
  function btnLink(cls, href, label, arrow, ext) {
    return '<a class="btn ' + cls + ' btn-lg" href="' + esc(href) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' +
      esc(label) + ' <span aria-hidden="true">' + arrow + '</span></a>';
  }

  function nav(t) {
    var items = [['verinoda', t.nav.verinoda], ['symbiosis', t.nav.symbiosis], ['benchmarks', t.nav.bench], ['install', t.nav.install]];
    return '<nav class="top"><div class="wrap nav-in">' +
      '<a href="#/" class="brand"><span class="sq"></span><span>Verinoda Labs</span></a>' +
      '<div class="nav-right"><div class="nav-links">' +
      each(items, function (i) { return '<a href="#/' + i[0] + '"' + (st.page === i[0] ? ' aria-current="page"' : '') + '>' + esc(i[1]) + '</a>'; }) +
      '</div><div class="nav-actions"><a class="btn btn-primary" href="#/contact" style="white-space:nowrap;padding:9px 14px">' + esc(t.nav.contact) + '</a>' +
      '<div class="lang" role="group" aria-label="Language">' +
      ['en', 'tr'].map(function (l) { return '<button type="button" data-lang="' + l + '" aria-pressed="' + (st.lang === l) + '">' + l.toUpperCase() + '</button>'; }).join('') +
      '</div></div></div></div></nav>';
  }

  function home(t) {
    var p = t.products;
    return '<section class="wrap hero" aria-label="Hero"><div data-reveal="1">' +
      '<div class="tags"><span class="tag tag-accent">' + esc(t.home.badge) + '</span><span class="tag tag-outline">Open source</span></div>' +
      '<h1 class="h-hero">' + esc(t.home.title) + '</h1><p class="lead-xl">' + esc(t.home.lead) + '</p>' +
      '<div class="btn-row">' + btnLink('btn-primary', '#/contact', t.home.cta1, '→') + btnLink('btn-secondary', '#/benchmarks', t.home.cta2, '→') + '</div></div>' +
      '<div data-reveal="2" class="term" aria-hidden="true"><div class="term-bar"><span>' + esc(t.home.termLabel) + '</span>' +
      '<span class="dots"><i></i><i></i></span></div><div class="term-body">' +
      TERM.map(function (l) { return '<div class="tl k-' + l[1] + '">' + (esc(l[0]) || '&nbsp;') + '</div>'; }).join('') + '</div></div></section>' +

      '<section class="stats"><div class="wrap stats-in">' +
      each(t.stats, function (s) { return '<div data-reveal="1" class="stat"><div class="stat-v">' + esc(s.value) + '</div><div class="stat-l">' + esc(s.label) + '</div></div>'; }) +
      '</div></section>' +

      '<section class="wrap sec"><div data-reveal="1" class="sec-head"><h6 class="kick">' + esc(t.home.prodKicker) + '</h6><h2 class="h-sec">' + esc(t.home.prodTitle) + '</h2></div>' +
      '<div class="cards">' + each(['verinoda', 'symbiosis'], function (id) {
        var c = p[id];
        return '<a data-reveal="1" href="#/' + id + '" class="pcard"><span class="tag tag-neutral">' + esc(c.tag) + '</span><h3>' + esc(c.headline) + '</h3><p>' + esc(c.card) +
          '</p><span class="pcard-cta">' + esc(c.cta) + ' <span class="acc" aria-hidden="true">→</span></span></a>';
      }) + '</div></section>' +

      '<section class="band"><div class="wrap sec"><div data-reveal="1" class="sec-head"><h6 class="kick">' + esc(t.how.kicker) + '</h6><h2 class="h-sec">' + esc(t.how.title) + '</h2></div>' +
      '<div class="steps">' + each(t.how.steps, function (s) {
        return '<div data-reveal="1" class="step"><div class="step-n">' + esc(s.n) + '</div><h4>' + esc(s.title) + '</h4><p>' + esc(s.body) + '</p><code>' + esc(s.cmd) + '</code></div>';
      }) + '</div></div></section>' +

      '<section class="wrap sec teaser"><div data-reveal="1"><h6 class="kick">' + esc(t.bench.kicker) + '</h6><h2 class="h-sec" style="margin-bottom:20px">' + esc(t.bench.title) + '</h2>' +
      '<p class="body-l">' + esc(t.bench.lead) + '</p>' + btnLink('btn-secondary', '#/benchmarks', t.home.cta2, '→') + '</div>' +
      '<div data-reveal="2" class="bars"><div class="muted-s">graphify_core · 37 ' + esc(t.bench.factsWord) + '</div>' +
      each(SETS[0].rows, function (r) { return bar(r[0], r[1], 37, r[2], t, true); }) + '</div></section>';
  }

  function product(t) {
    var pr = t.products[st.page];
    return '<section class="wrap phero"><div data-reveal="1" class="crumb"><a href="#/">Verinoda Labs</a><span>/</span><b>' + esc(pr.headline) + '</b></div>' +
      '<h1 data-reveal="1" class="h-prod">' + esc(pr.headline) + '</h1>' +
      '<div class="two ruled"><div data-reveal="2"><p class="lead-m">' + esc(pr.lead) + '</p><p class="body-l" style="margin-bottom:32px">' + esc(pr.body) + '</p>' +
      '<div class="btn-row">' + btnLink('btn-primary', pr.url, 'GitHub', '↗', true) + btnLink('btn-secondary', '#/install', t.nav.install, '→') + '</div></div>' +
      '<div data-reveal="3" class="notes"><h6>' + esc(pr.noteTitle) + '</h6>' +
      each(pr.notes, function (n) { return '<div class="kv"><span class="k">' + esc(n.k) + '</span><span class="v">' + esc(n.v) + '</span></div>'; }) + '</div></div></section>' +

      '<section class="topline"><div class="wrap sec" style="padding-top:96px;padding-bottom:96px"><h2 data-reveal="1" class="h-sec2">' + esc(pr.featTitle) + '</h2>' +
      '<div class="feats">' + each(pr.features, function (f) {
        return '<div data-reveal="1" class="feat"><div class="feat-n">' + esc(f.n) + '</div><h4>' + esc(f.title) + '</h4><p>' + esc(f.body) + '</p></div>';
      }) + '</div></div></section>' +

      '<section class="dark"><div class="wrap two top" style="padding-top:96px;padding-bottom:96px"><div data-reveal="1">' +
      '<h6 style="color:var(--color-accent-400);margin-bottom:16px">' + esc(pr.codeKicker) + '</h6>' +
      '<h2 class="h-sec2" style="color:var(--color-neutral-100)">' + esc(pr.codeTitle) + '</h2><p class="dark-p">' + esc(pr.codeBody) + '</p></div>' +
      '<div data-reveal="2" class="codelist">' + each(pr.code, function (c) {
        return '<div class="crow"><span class="ccmd"><span class="prompt">$ </span>' + esc(c.cmd) + '</span><span class="cnote">' + esc(c.note) + '</span></div>';
      }) + '</div></div></section>';
  }

  function bench(t) {
    var set = SETS[st.set];
    var loc = st.lang === 'tr' ? 'tr-TR' : 'en-US';
    return '<section class="wrap sec" style="padding-top:88px"><div data-reveal="1" class="two end" style="margin-bottom:48px;gap:32px"><div>' +
      '<h6 class="kick">' + esc(t.bench.kicker) + '</h6><h1 class="h-page">' + esc(t.bench.title) + '</h1></div>' +
      '<p class="body-m">' + esc(t.bench.lead) + '</p></div>' +
      '<div class="tabs" role="group" aria-label="' + esc(t.bench.factsTitle) + '">' + each(SETS, function (s, i) {
        return '<button type="button" class="tab" data-set="' + i + '" aria-pressed="' + (i === st.set) + '"><div class="tab-n">' + esc(s.id) + '</div><div class="tab-m">' +
          s.total + ' ' + esc(t.bench.factsWord) + ' · ' + esc(t.bench.notes[s.id]) + '</div></button>';
      }) + '</div>' +
      '<div class="two bench-cols"><div><div class="col-head"><h4>' + esc(t.bench.factsTitle) + '</h4><span class="muted-s">' + esc(t.bench.notes[set.id]) + '</span></div>' +
      '<div class="bars">' + each(set.rows, function (r) { return bar(r[0], r[1], set.total, r[2], t, true); }) + '</div></div>' +
      '<div><div class="col-head"><h4>' + esc(t.bench.tokTitle) + '</h4><span class="muted-s">' + esc(t.bench.tokNote) + '</span></div>' +
      '<div class="bars">' + each(t.bench.tok, function (r) {
        return bar(r[0], r[1], 20500, r[2], t, false, (r[2] ? '' : '~') + r[1].toLocaleString(loc));
      }) + '</div>' +
      '<div class="big"><span class="big-v">−52%</span><span class="big-t">' + esc(t.bench.tokAnalyze) + '</span></div></div></div>' +
      '<div style="padding-top:48px"><h4 data-reveal="1" style="margin:0 0 20px">' + esc(t.bench.moreTitle) + '</h4><div style="overflow-x:auto">' +
      '<table class="table" style="min-width:640px"><thead><tr><th>' + esc(t.bench.colArea) + '</th><th>' + esc(t.bench.colSet) + '</th><th>' + esc(t.bench.colResult) + '</th></tr></thead><tbody>' +
      each(t.bench.rows, function (r) { return '<tr><td style="font-weight:800">' + esc(r.a) + '</td><td class="mid">' + esc(r.s) + '</td><td>' + esc(r.r) + '</td></tr>'; }) +
      '</tbody></table></div><p class="method">' + esc(t.bench.method) + ' <a href="https://github.com/Verinoda-Labs/verinoda/blob/main/docs/BENCHMARKS.md" target="_blank" rel="noopener">docs/BENCHMARKS.md</a></p></div></section>';
  }

  function install(t) {
    var i = t.install;
    return '<section class="wrap sec" style="padding-top:88px"><div data-reveal="1" style="max-width:820px;margin-bottom:56px"><h6 class="kick">' + esc(i.kicker) + '</h6>' +
      '<h1 class="h-page" style="margin-bottom:24px">' + esc(i.title) + '</h1><p class="body-l" style="font-size:17px">' + esc(i.lead) + '</p></div>' +
      '<div data-reveal="2" class="inst"><div class="inst-tabs" role="group" aria-label="Installer">' + each(INSTALL, function (x, n) {
        return '<button type="button" data-inst="' + n + '" aria-pressed="' + (n === st.inst) + '">' + esc(x[0]) + '</button>';
      }) + '</div><div class="inst-cmd"><code>' + esc(INSTALL[st.inst][1]) + '</code>' +
      '<button type="button" id="copy" aria-live="polite">' + esc(st.copied ? i.copied : i.copy) + '</button></div></div>' +
      '<div class="two" style="gap:48px;margin-top:72px"><div data-reveal="1"><h4 class="ruled-h">' + esc(i.quickTitle) + '</h4>' +
      each(i.quick, function (q) { return '<div class="qrow"><code>' + esc(q.cmd) + '</code><div>' + esc(q.note) + '</div></div>'; }) + '</div>' +
      '<div data-reveal="2"><h4 class="ruled-h">' + esc(i.reqTitle) + '</h4>' +
      each(i.reqs, function (r) { return '<div class="kv thin"><span class="k">' + esc(r.k) + '</span><span class="v">' + esc(r.v) + '</span></div>'; }) + '</div></div></section>';
  }

  function contact(t) {
    var c = t.contact, f = st.form;
    var form = st.sent
      ? '<div style="padding:24px 0"><div class="sq big-sq"></div><h3 style="font-size:28px;margin:0 0 12px">' + esc(c.thanksTitle) + '</h3>' +
        '<p class="body-m" style="margin-bottom:28px">' + esc(c.thanksBody) + '</p><button type="button" class="btn btn-secondary" id="again" style="padding:12px 18px">' + esc(c.again) + '</button></div>'
      : '<form id="cform" novalidate style="display:flex;flex-direction:column;gap:20px"><div class="field"><label id="tl">' + esc(c.topic) + '</label>' +
        '<div class="topics" role="group" aria-labelledby="tl">' + each(c.topics, function (x, i) {
          return '<button type="button" data-topic="' + i + '" aria-pressed="' + (i === st.topic) + '">' + esc(x) + '</button>';
        }) + '</div></div>' +
        '<div class="two2"><div class="field"><label for="f-name">' + esc(c.name) + '</label><input id="f-name" class="input" name="name" autocomplete="name" value="' + esc(f.name) + '"></div>' +
        '<div class="field"><label for="f-company">' + esc(c.company) + '</label><input id="f-company" class="input" name="company" autocomplete="organization" value="' + esc(f.company) + '"></div></div>' +
        '<div class="field"><label for="f-email">' + esc(c.email) + '</label><input id="f-email" class="input" name="email" type="email" autocomplete="email" value="' + esc(f.email) + '"></div>' +
        '<div class="field"><label for="f-message">' + esc(c.message) + '</label><textarea id="f-message" class="input" name="message" style="min-height:140px">' + esc(f.message) + '</textarea></div>' +
        '<div class="err" id="err" role="alert">' + esc(st.err ? c[st.err] : '') + '</div>' +
        '<button type="submit" class="btn btn-primary btn-block" style="padding:14px 18px;font-size:15px;justify-content:space-between;margin-top:0">' + esc(c.send) + ' <span aria-hidden="true">→</span></button></form>';
    return '<section class="wrap two top" style="padding:88px 32px 112px;gap:72px"><div data-reveal="1"><h6 class="kick">' + esc(c.kicker) + '</h6>' +
      '<h1 class="h-page" style="margin-bottom:24px">' + esc(c.title) + '</h1><p class="body-l" style="font-size:17px;margin-bottom:40px;max-width:480px">' + esc(c.lead) + '</p>' +
      '<div class="ruled-top">' + each(c.reasons, function (r) { return '<div class="reason"><div class="rk">' + esc(r.k) + '</div><div>' + esc(r.v) + '</div></div>'; }) + '</div></div>' +
      '<div data-reveal="2" class="formbox">' + form + '</div></section>';
  }

  function cta(t) {
    return '<section class="cta"><div class="wrap" style="padding-top:104px;padding-bottom:88px"><h2 data-reveal="1" class="h-cta">' + esc(t.cta.title) + '</h2>' +
      '<div class="cta-row"><p>' + esc(t.cta.body) + '</p><div class="btn-row"><a class="cta-a" href="#/contact">' + esc(t.nav.contact) + ' <span aria-hidden="true">→</span></a>' +
      '<a class="cta-b" href="https://github.com/Verinoda-Labs/verinoda" target="_blank" rel="noopener">GitHub <span aria-hidden="true">↗</span></a></div></div></div></section>';
  }

  function footer(t) {
    return '<footer><div class="wrap foot"><div class="foot-brand"><span class="sq sm"></span><b>Verinoda Labs</b><span>© 2026</span></div>' +
      '<div class="foot-links"><a href="https://github.com/Verinoda-Labs" target="_blank" rel="noopener">GitHub</a><a href="https://pypi.org/project/verinoda/" target="_blank" rel="noopener">PyPI</a>' +
      '<a href="https://www.npmjs.com/package/verinoda" target="_blank" rel="noopener">npm</a></div><div style="max-width:520px">' + esc(t.footer) + '</div></div></footer>';
  }

  /* ---------- render ---------- */
  function render() {
    var t = T(), body;
    if (st.page === 'home') body = home(t);
    else if (st.page === 'verinoda' || st.page === 'symbiosis') body = product(t);
    else if (st.page === 'benchmarks') body = bench(t);
    else if (st.page === 'install') body = install(t);
    else body = contact(t);
    app.innerHTML = nav(t) + '<main id="main">' + body + (st.page === 'contact' ? '' : cta(t)) + '</main>' + footer(t);
    document.documentElement.lang = st.lang;
    var names = { home: '', verinoda: 'Verinoda', symbiosis: 'Verinoda Symbiosis', benchmarks: t.nav.bench, install: t.nav.install, contact: t.nav.contact };
    document.title = (names[st.page] ? names[st.page] + ' · ' : '') + 'Verinoda Labs';
    afterRender();
  }

  function afterRender() {
    startTerm();
    void app.offsetHeight; // commit width:0 so the fill animates
    [].forEach.call(app.querySelectorAll('.bar-fill'), function (el) { el.style.width = el.getAttribute('data-w'); });
    reveal();
  }

  function reveal() {
    if (io) io.disconnect();
    var els = [].slice.call(app.querySelectorAll('[data-reveal]'));
    if (REDUCED || !('IntersectionObserver' in window)) return;
    var vh = window.innerHeight || 800;
    io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    els.forEach(function (el) {
      var d = (parseInt(el.getAttribute('data-reveal'), 10) - 1) * 0.12;
      el.style.transitionDelay = d + 's';
      if (el.getBoundingClientRect().top < vh * 0.92) return;
      el.classList.add('pre');
      io.observe(el);
    });
  }

  function startTerm() {
    clearInterval(termTimer);
    var lines = [].slice.call(app.querySelectorAll('.tl'));
    if (!lines.length) return;
    var n = REDUCED ? lines.length : 0;
    function paint() { lines.forEach(function (el, i) { el.classList.toggle('on', i < n); }); }
    paint();
    if (REDUCED) return;
    termTimer = setInterval(function () { n = n >= lines.length + 6 ? 0 : n + 1; paint(); }, 520);
  }

  function swap(fn) {
    var main = document.getElementById('main');
    if (REDUCED || !main) { fn(); return; }
    main.classList.add('fading');
    setTimeout(function () { fn(); }, 220);
  }

  function go(p, keepScroll) {
    if (p === st.page) return;
    swap(function () {
      st.page = p; st.sent = false; st.err = '';
      if (!keepScroll) window.scrollTo(0, 0);
      render();
    });
  }

  /* ---------- events ---------- */
  app.addEventListener('click', function (e) {
    var el = e.target.closest('[data-lang],[data-set],[data-inst],[data-topic],#copy,#again');
    if (!el) return;
    if (el.dataset.lang) {
      if (el.dataset.lang === st.lang) return;
      st.lang = el.dataset.lang;
      try { localStorage.setItem('vl-lang', st.lang); } catch (x) {}
      swap(render);
    } else if (el.dataset.set !== undefined) { st.set = +el.dataset.set; render(); }
    else if (el.dataset.inst !== undefined) { st.inst = +el.dataset.inst; st.copied = false; render(); }
    else if (el.dataset.topic !== undefined) { st.topic = +el.dataset.topic; render(); }
    else if (el.id === 'again') { st.sent = false; st.form = { name: '', company: '', email: '', message: '' }; render(); }
    else if (el.id === 'copy') {
      var done = function () {
        st.copied = true; el.textContent = T().install.copied;
        clearTimeout(copyTimer);
        copyTimer = setTimeout(function () { st.copied = false; var b = document.getElementById('copy'); if (b) b.textContent = T().install.copy; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(INSTALL[st.inst][1]).then(done, function () {});
    }
  });

  app.addEventListener('input', function (e) {
    var n = e.target && e.target.name;
    if (n && n in st.form) st.form[n] = e.target.value;
  });

  app.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = st.form, c = T().contact;
    var err = null;
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

  window.addEventListener('hashchange', function () { go(pageFromHash()); });

  /* ---------- boot ---------- */
  try { var saved = localStorage.getItem('vl-lang'); if (saved && I18N[saved]) st.lang = saved; else if ((navigator.language || '').toLowerCase().indexOf('tr') === 0) st.lang = 'tr'; } catch (x) {}
  st.page = pageFromHash();
  render();
})();
