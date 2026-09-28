/* The hero name arrives the way the landing page does, through noise.
   Random characters, then Σοφία, then Sophie, then Allen joins it. */
(function () {
  var el = document.getElementById('hero-name-text');
  if (!el) return;

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = 'Sophie Allen';
    return;
  }

  var LATIN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var GREEK = 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρστυφχψω0123456789';

  var queue = [], frame = 0, raf = null, charset = LATIN, current = '', finish = null;

  function tick() {
    var out = '', settled = 0;
    for (var i = 0; i < queue.length; i++) {
      var q = queue[i];
      if (frame >= q.end) { settled++; out += q.to; }
      else if (frame >= q.start) {
        if (!q.ch || Math.random() < 0.32) q.ch = charset.charAt(Math.floor(Math.random() * charset.length));
        out += '<i>' + q.ch + '</i>';
      } else out += q.from;
    }
    el.innerHTML = out;
    if (settled === queue.length) { if (finish) finish(); return; }
    frame++;
    raf = requestAnimationFrame(tick);
  }

  function scrambleTo(text, cs, speed) {
    return new Promise(function (resolve) {
      charset = cs;
      var old = current, len = Math.max(old.length, text.length);
      queue = [];
      for (var i = 0; i < len; i++) {
        var start = Math.floor(Math.random() * speed * 0.7);
        queue.push({
          from: old.charAt(i) || '',
          to: text.charAt(i) || '',
          start: start,
          end: start + Math.floor(Math.random() * speed) + Math.round(speed * 0.5),
          ch: ''
        });
      }
      current = text;
      if (raf) cancelAnimationFrame(raf);
      frame = 0;
      finish = resolve;
      tick();
    });
  }

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  el.textContent = '';
  wait(350)
    .then(function () { return scrambleTo('Σοφία', GREEK, 30); })      // noise, then the Greek
    .then(function () { return wait(1250); })                          // let it be read
    .then(function () { return scrambleTo('Sophie', LATIN, 24); })     // Sophia becomes Sophie
    .then(function () { return wait(420); })
    .then(function () { return scrambleTo('Sophie Allen', LATIN, 26); });
})();
