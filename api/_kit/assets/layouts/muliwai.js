// Muliwai – Signatur: Wellenbänder in Grün und Terracotta am Fuss des Hero,
// die gegeneinander ziehen und sich dort mischen, wo sie sich überlagern.
(function () {
  var hero = document.querySelector('.hero-center');
  if (!hero) return;
  var waves = document.createElement('div');
  waves.className = 'mw-waves';
  waves.setAttribute('aria-hidden', 'true');
  waves.innerHTML = '<span class="mw-wave w1"></span><span class="mw-wave w2"></span><span class="mw-wave w3"></span><span class="mw-wave w4"></span>';
  hero.appendChild(waves);
})();
