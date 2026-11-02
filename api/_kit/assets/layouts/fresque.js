// Fresque – Signatur-Effekte: gesprühtes «?» mit Tropfen neben dem Hero-Titel,
// Sprühstrich mit Tropfen unter jedem Sektionstitel, sobald er ins Bild kommt.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var uid = 0;

  // Raue Kanten wie aus der Dose: Rauschen verschiebt die Kontur leicht
  function sprayFilter(id, scale) {
    return '<defs><filter id="' + id + '" x="-20%" y="-20%" width="140%" height="140%">' +
      '<feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="' + (uid + 3) + '"/>' +
      '<feDisplacementMap in="SourceGraphic" scale="' + scale + '"/></filter>' +
      '<filter id="' + id + 'b" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3.5"/></filter></defs>';
  }

  function make(tag, cls, svg) {
    var el = document.createElement(tag);
    el.className = cls;
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = svg;
    return el;
  }

  // 1) Hero: «?» neben QMRK
  var h1 = document.querySelector('.hero h1');
  if (h1) {
    var id = 'qs' + (uid++);
    var q = 'M18 46 C16 22 34 8 52 8 C72 8 86 22 86 40 C86 58 70 64 60 72 C53 78 50 86 50 100';
    var q1 = make('span', 'q-spray', '<svg viewBox="0 0 100 170">' + sprayFilter(id, 6) +
      '<g class="q-haze" filter="url(#' + id + 'b)"><path class="q-line" pathLength="1" d="' + q + '"/></g>' +
      '<g filter="url(#' + id + ')"><path class="q-line" pathLength="1" d="' + q + '"/>' +
      '<rect class="q-drip" x="72.5" y="56" width="5" height="62" rx="2.5"/><circle class="q-drip" cx="75" cy="118" r="4.6"/>' +
      '<circle class="q-dot" cx="50" cy="136" r="11"/></g></svg>');
    h1.appendChild(q1);
    var go = function () { requestAnimationFrame(function () { q1.classList.add('go'); }); };
    if (reduce) q1.classList.add('go');
    else if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(go, 250); });
    else setTimeout(go, 400);
  }

  // 2) Sektionstitel: kurzer Sprühstrich, zwei Tropfen laufen herunter
  var heads = document.querySelectorAll('main section:not(.hero) h2');
  var tags = [];
  heads.forEach(function (h, i) {
    var id = 'ts' + (uid++);
    var w = 'M4 ' + (12 + (i % 3)) + ' C40 6 78 16 112 9 S140 10 146 12';
    var x1 = 34 + (i * 23) % 40, x2 = 96 + (i * 17) % 34;
    var tag = make('span', 'spray-tag', '<svg viewBox="0 0 150 46" width="150" height="46">' + sprayFilter(id, 3) +
      '<path class="t-line t-haze" pathLength="1" filter="url(#' + id + 'b)" d="' + w + '"/>' +
      '<g filter="url(#' + id + ')"><path class="t-line" pathLength="1" d="' + w + '"/>' +
      '<rect class="t-drip" x="' + (x1 - 1.6) + '" y="10" width="3.2" height="22" rx="1.6"/>' +
      '<rect class="t-drip d2" x="' + (x2 - 1.4) + '" y="11" width="2.8" height="30" rx="1.4"/></g></svg>');
    h.insertAdjacentElement('afterend', tag);
    tags.push(tag);
  });
  if (reduce || !('IntersectionObserver' in window)) {
    tags.forEach(function (t) { t.classList.add('go'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('go'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    tags.forEach(function (t) { io.observe(t); });
  }
})();
