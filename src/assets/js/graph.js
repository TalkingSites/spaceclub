/* Post graph. Nodes are posts, edges are [[wiki links]]. A link to something
   not written yet becomes a hollow node, so the graph shows where the site is
   going as well as where it has been. Force simulation, canvas, no libraries. */
(function () {
  var wrap = document.getElementById('post-graph');
  var tag = document.getElementById('graph-data');
  if (!wrap || !tag) return;

  var data;
  try { data = JSON.parse(tag.textContent); } catch (e) { return; }
  if (!data.nodes || !data.nodes.length) { wrap.style.display = 'none'; return; }

  var canvas = wrap.querySelector('canvas');
  var ctx = canvas.getContext('2d');
  var HUES = ['#3BC7F6', '#A855F7', '#CC4D9E', '#EF4444'];
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var nodes = data.nodes.map(function (n, i) {
    return {
      id: n.id, title: n.title, url: n.url, resolved: n.resolved,
      colour: n.resolved ? HUES[i % HUES.length] : 'rgba(168,85,247,.55)',
      r: n.resolved ? 9 : 6,
      x: 0, y: 0, vx: 0, vy: 0
    };
  });
  var index = {};
  nodes.forEach(function (n, i) { index[n.id] = i; });
  var edges = data.edges
    .filter(function (e) { return index[e.source] !== undefined && index[e.target] !== undefined; })
    .map(function (e) { return { a: index[e.source], b: index[e.target] }; });

  function resize() {
    var rect = wrap.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seed() {
    var R = Math.min(W, H) * 0.28;
    nodes.forEach(function (n, i) {
      var a = (i / nodes.length) * Math.PI * 2;
      n.x = W / 2 + Math.cos(a) * R * (0.6 + (i % 3) * 0.2);
      n.y = H / 2 + Math.sin(a) * R * (0.6 + (i % 3) * 0.2);
    });
  }

  var hovered = null, dragging = null, alpha = 1;

  function step() {
    // repulsion
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var a = nodes[i], b = nodes[j];
        var dx = b.x - a.x, dy = b.y - a.y;
        var d2 = dx * dx + dy * dy || 0.01;
        var d = Math.sqrt(d2);
        var f = 3400 / d2;
        var ux = dx / d, uy = dy / d;
        a.vx -= ux * f; a.vy -= uy * f;
        b.vx += ux * f; b.vy += uy * f;
      }
    }
    // springs
    var REST = Math.min(W, H) * 0.34;
    edges.forEach(function (e) {
      var a = nodes[e.a], b = nodes[e.b];
      var dx = b.x - a.x, dy = b.y - a.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      var f = (d - REST) * 0.012;
      var ux = dx / d, uy = dy / d;
      a.vx += ux * f; a.vy += uy * f;
      b.vx -= ux * f; b.vy -= uy * f;
    });
    // drift home, damp, integrate
    nodes.forEach(function (n) {
      n.vx += (W / 2 - n.x) * 0.0016;
      n.vy += (H / 2 - n.y) * 0.0016;
      if (n === dragging) { n.vx = n.vy = 0; return; }
      n.vx *= 0.86; n.vy *= 0.86;
      n.x += n.vx * alpha; n.y += n.vy * alpha;
      var pad = 46;
      n.x = Math.max(pad, Math.min(W - pad, n.x));
      n.y = Math.max(24, Math.min(H - 26, n.y));
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    edges.forEach(function (e) {
      var a = nodes[e.a], b = nodes[e.b];
      var lit = hovered && (hovered === a || hovered === b);
      var grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      grad.addColorStop(0, a.colour); grad.addColorStop(1, b.colour);
      ctx.strokeStyle = grad;
      ctx.globalAlpha = lit ? 0.85 : 0.28;
      ctx.lineWidth = lit ? 1.8 : 1;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    });
    ctx.globalAlpha = 1;

    nodes.forEach(function (n) {
      var lit = hovered === n;
      var r = n.r * (lit ? 1.35 : 1);
      if (n.resolved) {
        ctx.shadowColor = n.colour;
        ctx.shadowBlur = lit ? 22 : 12;
        ctx.fillStyle = n.colour;
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = n.colour;
        ctx.lineWidth = 1.6;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.font = (lit ? '600 ' : '') + '11px "Space Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = n.resolved
        ? (lit ? '#ffffff' : 'rgba(226,205,255,.82)')
        : (lit ? 'rgba(226,205,255,.9)' : 'rgba(178,150,230,.45)');
      ctx.fillText(n.title, n.x, n.y + r + 15);
    });
  }

  function frame() {
    step(); draw();
    if (reduced) return;
    requestAnimationFrame(frame);
  }

  function at(ev) {
    var rect = canvas.getBoundingClientRect();
    var t = ev.touches ? ev.touches[0] : ev;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  }
  function pick(p) {
    for (var i = nodes.length - 1; i >= 0; i--) {
      var n = nodes[i], dx = p.x - n.x, dy = p.y - n.y;
      if (dx * dx + dy * dy < (n.r + 11) * (n.r + 11)) return n;
    }
    return null;
  }

  canvas.addEventListener('mousemove', function (ev) {
    var p = at(ev);
    if (dragging) { dragging.x = p.x; dragging.y = p.y; if (reduced) { step(); draw(); } return; }
    hovered = pick(p);
    canvas.style.cursor = hovered ? (hovered.url ? 'pointer' : 'grab') : 'default';
    if (reduced) draw();
  });
  canvas.addEventListener('mousedown', function (ev) { dragging = pick(at(ev)); });
  window.addEventListener('mouseup', function () { dragging = null; });
  canvas.addEventListener('mouseleave', function () { hovered = null; dragging = null; if (reduced) draw(); });
  canvas.addEventListener('click', function (ev) {
    var n = pick(at(ev));
    if (n && n.url) window.location.href = n.url;
  });

  window.addEventListener('resize', function () { resize(); seed(); if (reduced) { for (var i = 0; i < 260; i++) step(); draw(); } });

  resize(); seed();
  if (reduced) { for (var i = 0; i < 260; i++) step(); draw(); }
  else frame();
})();
