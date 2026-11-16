/* Verinoda Labs v3 — contact form (contact pages only; classic, deferred, no library).
   Empty or invalid: the error texts (written by the page in its own language) show, aria-invalid is set and focus goes to the
   first invalid field. Valid: the mail app opens with a composed mailto:. Without this script the form posts as text/plain to
   the same mailto: address. */
(function () {
  var f = document.getElementById('ct-form');
  if (!f) return;
  f.noValidate = true;
  var to = f.getAttribute('data-to'), pre = f.getAttribute('data-prefix') || '';

  function check(el, ok) {
    var er = document.getElementById(el.id + '-err');
    el.setAttribute('aria-invalid', ok ? 'false' : 'true');
    if (er) er.hidden = ok;
    return ok;
  }

  f.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var n = f.elements.name, m = f.elements.email, t = f.elements.topic, b = f.elements.message;
    var a = check(n, n.value.trim() !== '');
    var c = check(m, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.value.trim()));
    var d = check(b, b.value.trim() !== '');
    if (!(a && c && d)) { (!a ? n : !c ? m : b).focus(); return; }
    var subject = pre + (t && t.value ? ' - ' + t.value : '');
    var body = b.value.trim() + '\n\n' + n.value.trim() + ' <' + m.value.trim() + '>';
    location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });
})();
