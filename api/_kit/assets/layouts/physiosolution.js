// PhysioSolution – Signatur: eine feine Champagnerlinie zeichnet sich wie eine Bewegung durch den Hero,
// das Portrait bekommt einen Goldbogen, unter jedem Sektionstitel öffnet sich ein Ornament (Linie – Raute – Linie).
(function () {
  var hero = document.querySelector('.hero-split');
  if (hero) {
    var media = hero.querySelector('.hero-media');
    var arch = null;
    if (media) {
      arch = document.createElement('div');
      arch.className = 'ps-arch';
      media.parentNode.insertBefore(arch, media);
      arch.appendChild(media);
    }
    var flow = document.createElement('div');
    flow.className = 'ps-flow';
    flow.setAttribute('aria-hidden', 'true');
    flow.innerHTML = '<svg viewBox="0 0 1200 300" preserveAspectRatio="none">' +
      '<path pathLength="1" d="M-20 250 C180 120 330 300 520 190 S820 40 980 150 S1160 210 1230 90"/>' +
      '<path class="p2" pathLength="1" d="M-20 275 C200 160 360 290 540 220 S840 80 1000 170 S1170 240 1230 130"/>' +
      '<circle cx="980" cy="150" r="3.5"/></svg>';
    hero.insertBefore(flow, hero.firstChild);
    requestAnimationFrame(function () {
      setTimeout(function () { flow.classList.add('on'); if (arch) arch.classList.add('on'); }, 200);
    });
  }

  var orns = [];
  document.querySelectorAll('main h2').forEach(function (h) {
    if (h.closest('.offer') || !h.closest('.sec-head')) return; // nicht in der Angebotstabelle, nur zentrierte Titel
    var o = document.createElement('span');
    o.className = 'ps-orn';
    o.setAttribute('aria-hidden', 'true');
    o.innerHTML = '<i></i><b></b><i></i>';
    h.parentNode.insertBefore(o, h.nextSibling);
    orns.push(o);
  });
  if (!('IntersectionObserver' in window)) { orns.forEach(function (o) { o.classList.add('on'); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px' });
  orns.forEach(function (o) { io.observe(o); });
})();
