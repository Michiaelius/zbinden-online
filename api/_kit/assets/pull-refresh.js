// Zum Aktualisieren nach unten ziehen – nur in der App vom Startbildschirm: dort fehlt der Neu-laden-Knopf,
// im Browser (Safari, Chrome) gibt es die Geste schon. Farben über --ptr-bg / --ptr-fg / --ptr-accent anpassbar.
(function(){
  var app = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  if (!app || !('ontouchstart' in window)) return;

  var TRIGGER = 64; // so weit ziehen (px), dann wird beim Loslassen neu geladen
  var css = document.createElement('style');
  css.textContent =
    '.ptr{position:fixed;left:50%;top:calc(env(safe-area-inset-top) - 44px);z-index:1000;width:38px;height:38px;border-radius:50%;' +
    'display:grid;place-items:center;background:var(--ptr-bg,#fff);color:var(--ptr-fg,#6b6f5c);box-shadow:0 2px 10px rgba(35,38,28,.2);' +
    'transform:translate(-50%,0);opacity:0;pointer-events:none;transition:transform .2s,opacity .2s}' +
    '.ptr svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}' +
    '.ptr.dragging{transition:none}.ptr.ready,.ptr.spin{color:var(--ptr-accent,#555555)}' +
    '.ptr.spin{opacity:1;animation:ptr-spin .7s linear infinite}' +
    '@keyframes ptr-spin{from{transform:translate(-50%,' + TRIGGER + 'px) rotate(0)}to{transform:translate(-50%,' + TRIGGER + 'px) rotate(360deg)}}';
  document.head.appendChild(css);
  var ptr = document.createElement('div');
  ptr.className = 'ptr'; ptr.setAttribute('aria-hidden', 'true');
  ptr.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v5h-5"/></svg>';
  document.body.appendChild(ptr);

  var pull = null, busy = false;
  function set(dist){
    ptr.style.transform = 'translate(-50%,' + dist + 'px) rotate(' + dist * 4 + 'deg)';
    ptr.style.opacity = Math.min(1, dist / TRIGGER);
    ptr.classList.toggle('ready', dist >= TRIGGER);
  }
  function reset(){
    ptr.classList.remove('dragging', 'ready', 'spin');
    ptr.style.transform = ''; ptr.style.opacity = '';
  }
  document.addEventListener('touchstart', function(e){
    pull = null;
    if (busy || e.touches.length !== 1 || window.scrollY > 0) return;
    pull = { x: e.touches[0].clientX, y: e.touches[0].clientY, dist: 0, active: false };
  }, { passive: true });
  document.addEventListener('touchmove', function(e){
    if (!pull) return;
    var dx = e.touches[0].clientX - pull.x, dy = e.touches[0].clientY - pull.y;
    if (!pull.active) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      // nach oben oder seitwärts: normales Scrollen
      if (dy <= Math.abs(dx) || window.scrollY > 0) { pull = null; return; }
      pull.active = true; ptr.classList.add('dragging');
    }
    if (e.cancelable) e.preventDefault(); // die Seite selbst soll nicht mitfedern
    pull.dist = Math.min(96, Math.max(0, dy) * 0.5);
    set(pull.dist);
  }, { passive: false });
  document.addEventListener('touchend', function(){
    var p = pull; pull = null;
    if (!p || !p.active) return;
    ptr.classList.remove('dragging');
    if (p.dist < TRIGGER) { reset(); return; }
    busy = true;
    ptr.style.transform = ''; ptr.style.opacity = '';
    ptr.classList.remove('ready'); ptr.classList.add('spin');
    // kurz drehen lassen, damit man sieht, dass neu geladen wird
    setTimeout(function(){ location.reload(); }, 450);
  });
  document.addEventListener('touchcancel', function(){ pull = null; if (!busy) reset(); });
})();
