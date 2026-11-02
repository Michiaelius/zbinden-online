// Starter-Kit: Menü, Scrollen ohne #hash, Nach-oben-Button, dezentes Erscheinen, Formular.
(function () {
  var UI = __UI__;
  var root = document.documentElement;
  var header = document.querySelector('.site-header');
  var menuBtn = document.querySelector('.menu-btn');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Menü (mobil)
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    if (menuBtn) {
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? UI.close : UI.menu);
    }
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  // Interne Links: sanft scrollen, ohne #hash in der Adresse (Neuladen springt sonst mitten in die Seite)
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var target = id ? document.getElementById(id) : null;
    if (!target && id !== 'top') return;
    e.preventDefault();
    setMenu(false);
    var y = target ? target.getBoundingClientRect().top + window.pageYOffset - (header ? header.offsetHeight : 0) + 1 : 0;
    window.scrollTo({ top: id === 'top' ? 0 : y, behavior: reduce ? 'auto' : 'smooth' });
    // Formular: erstes Feld fokussieren, sobald gescrollt ist
    if (id === 'kontakt') setTimeout(function () { var f = target.querySelector('input'); if (f) f.focus({ preventScroll: true }); }, reduce ? 0 : 700);
  });

  // Nach oben + Header-Zustand
  var topBtn = document.querySelector('.to-top');
  function onScroll() {
    var y = window.pageYOffset;
    if (topBtn) topBtn.classList.toggle('show', y > 600);
    if (header) header.classList.toggle('scrolled', y > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (topBtn) topBtn.addEventListener('click', function () {
    if (reduce) { window.scrollTo(0, 0); return; }
    // langsam und gleichmässig nach oben (0.7–1.6 s je nach Distanz)
    var start = window.pageYOffset, t0 = null, dur = Math.min(1600, Math.max(700, start / 3));
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      window.scrollTo(0, start * (1 - e));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });

  // Dezentes Erscheinen
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduce) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
    // Sicherheitsnetz: nach 2.5 s alles zeigen (z.B. für Screenshots oder sehr lange Seiten)
    setTimeout(function () { items.forEach(function (el) { el.classList.add('in'); }); }, 2500);
  }

  // Galerie: Bild im Vollbild (nur echte Fotos, keine Grafik-Platzhalter)
  document.querySelectorAll('.gallery').forEach(function (gal) {
    var imgs = Array.prototype.slice.call(gal.querySelectorAll('img.gallery-media'));
    if (!imgs.length) return;
    var box, pic, cap, idx = 0, lastFocus, x0 = null;
    function caption(img) {
      var fc = img.closest('figure').querySelector('figcaption');
      if (!fc) return '';
      return ['.work-title', '.work-info', '.work-price'].map(function (s) {
        var el = fc.querySelector(s); return el ? el.textContent.trim() : '';
      }).filter(Boolean).join(' · ');
    }
    function show(i) {
      idx = (i + imgs.length) % imgs.length;
      pic.src = imgs[idx].currentSrc || imgs[idx].src;
      pic.alt = imgs[idx].alt;
      cap.textContent = caption(imgs[idx]);
    }
    function build() {
      box = document.createElement('div');
      box.className = 'lightbox';
      box.setAttribute('role', 'dialog');
      box.setAttribute('aria-modal', 'true');
      box.innerHTML = '<button type="button" class="lb-close" aria-label="' + UI.close + '">&times;</button>' +
        (imgs.length > 1 ? '<button type="button" class="lb-nav lb-prev" aria-label="' + UI.prev + '">&#8249;</button><button type="button" class="lb-nav lb-next" aria-label="' + UI.next + '">&#8250;</button>' : '') +
        '<figure class="lb-fig"><img class="lb-img" alt=""><figcaption class="lb-cap"></figcaption></figure>';
      pic = box.querySelector('.lb-img');
      cap = box.querySelector('.lb-cap');
      box.addEventListener('click', function (e) {
        if (e.target.closest('.lb-prev')) show(idx - 1);
        else if (e.target.closest('.lb-next')) show(idx + 1);
        else if (e.target.closest('.lb-close') || !e.target.closest('.lb-img')) close();
      });
      box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      box.addEventListener('touchend', function (e) {
        if (x0 === null) return;
        var dx = e.changedTouches[0].clientX - x0; x0 = null;
        if (Math.abs(dx) > 50 && imgs.length > 1) show(dx < 0 ? idx + 1 : idx - 1);
      });
      document.body.appendChild(box);
    }
    function onKey(e) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') show(idx + 1);
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'Tab') { // Fokus im Dialog halten
        var f = box.querySelectorAll('button'), first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    function open(i) {
      if (!box) build();
      lastFocus = document.activeElement;
      show(i);
      root.classList.add('lb-open');
      box.classList.add('show');
      document.addEventListener('keydown', onKey);
      box.querySelector('.lb-close').focus();
    }
    function close() {
      box.classList.remove('show');
      root.classList.remove('lb-open');
      document.removeEventListener('keydown', onKey);
      if (lastFocus) lastFocus.focus();
    }
    imgs.forEach(function (img, i) {
      img.classList.add('zoomable');
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', UI.zoom + ': ' + (img.alt || ''));
      img.addEventListener('click', function () { open(i); });
      img.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(i); } });
    });
  });

  // Formular → /api/anfrage (PHP auf Infomaniak)
  document.querySelectorAll('.contact-form').forEach(function (form) {
    var status = form.querySelector('.form-status');
    var btn = form.querySelector('button[type=submit]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll('[required]').forEach(function (el) {
        var bad = el.type === 'checkbox' ? !el.checked : !el.value.trim() || (el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
        var wrap = el.closest('.field') || el.closest('.consent');
        if (wrap) wrap.classList.toggle('invalid', bad);
        if (bad && ok) { el.focus(); ok = false; }
      });
      if (!ok) { status.className = 'form-status err'; status.textContent = UI.required + ' *'; return; }

      var data = { typ: form.dataset.kind };
      new FormData(form).forEach(function (v, k) { data[k] = typeof v === 'string' ? v.trim() : v; });
      btn.disabled = true; btn.textContent = UI.sending;
      status.className = 'form-status'; status.textContent = '';
      fetch('api/anfrage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function () {
          form.reset();
          status.className = 'form-status ok'; status.textContent = UI.sent;
        })
        .catch(function () { status.className = 'form-status err'; status.textContent = UI.error; })
        .finally(function () { btn.disabled = false; btn.textContent = UI.send; });
    });
    form.addEventListener('input', function (e) {
      var wrap = e.target.closest('.field') || e.target.closest('.consent');
      if (wrap) wrap.classList.remove('invalid');
    });
  });
})();
