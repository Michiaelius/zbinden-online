// Immo – Signatur: das Dach aus dem Logo zeichnet sich über dem Hero-Foto (beim Laden)
// und als kleines Dach über jedem Sektionstitel, sobald er ins Bild kommt.
(function () {
  function roof(cls, viewBox, d) {
    var el = document.createElement('span');
    el.className = cls;
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<svg viewBox="' + viewBox + '"><path pathLength="1" d="' + d + '"/></svg>';
    return el;
  }

  // 1) Hero: Foto in einen Rahmen setzen, Dach darüber (Giebel mit Traufe wie im Logo)
  var img = document.querySelector('.hero-split .hero-media');
  if (img) {
    var wrap = document.createElement('div');
    wrap.className = 'hero-roofed';
    img.parentNode.insertBefore(wrap, img);
    wrap.appendChild(img);
    var big = roof('roof', '0 0 100 16', 'M.5 15.5 L7 11 L50 .8 L93 11 L99.5 15.5');
    wrap.insertBefore(big, img);
    requestAnimationFrame(function () { setTimeout(function () { big.classList.add('on'); }, 250); });
  }

  // 2) Kleines Dach über jedem h2 (Sektionstitel)
  var minis = [];
  document.querySelectorAll('main h2').forEach(function (h) {
    var m = roof('roof-mini', '0 0 58 16', 'M1 15 L29 2 L57 15');
    h.parentNode.insertBefore(m, h);
    minis.push(m);
  });
  if (!('IntersectionObserver' in window)) { minis.forEach(function (m) { m.classList.add('on'); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px' });
  minis.forEach(function (m) { io.observe(m); });
})();
