/* Formulaire « Kostenloser Entwurf » (webdesign DE/FR/EN), pour l'achat comme pour l'abo.
   - Pastilles de couleurs : palettes du Starter-Kit, « Überraschen Sie mich » ou « Eigene Farben » (2 couleurs).
   - Logo : aperçu, puis ses deux couleurs dominantes deviennent les « Eigene Farben » proposées.
   - Mini-aperçu en direct (logo, nom, couleurs) pour l'effet « c'est déjà mon site ».
   - Envoi JSON vers /api/website-entwurf (logo en base64, max. 2 Mo). Textes : attributs data-* du formulaire. */
(function () {
  var form = document.getElementById('entwurfForm');
  if (!form || !window.fetch || !window.FileReader) return;

  // Mêmes valeurs que Starter-Kit/lib/palettes.mjs : [fond, surface, accent, sombre]
  var PALETTES = {
    pistazie: ['Pistazie', '#f6f5ec', '#e4e7c9', '#6e1f35', '#4a1727'],
    schiefer: ['Schiefer & Kupfer', '#f3f2ef', '#e2e0db', '#8b5733', '#2d3033'],
    flamingo: ['Flamingo', '#fbf7f4', '#f6e0da', '#233456', '#1d2a47'],
    kiwi: ['Kiwi', '#f8f6f0', '#e9eed0', '#56710f', '#38291c'],
    kokos: ['Kokos', '#f8f4ee', '#ece3d4', '#6b4a33', '#2f2119'],
    feige: ['Feige', '#faf5ef', '#f1e5da', '#9b1f3a', '#3e1a33'],
    glut: ['Glut', '#1a1412', '#251c18', '#e0893a', '#0f0b0a'],
    muschel: ['Muschel', '#fcf8f4', '#f6e5d8', '#e6ad8a', '#5a463c'],
    ozean: ['Ozean', '#f5f8fa', '#e5edf2', '#1d5a80', '#0f2a3a'],
    salbei: ['Salbei', '#f7f5ef', '#eceee3', '#5b6f4c', '#232c20'],
  };
  var D = form.dataset;
  var lang = D.lang || 'de';
  var grid = form.querySelector('.mp-swatches');
  var custom = form.querySelector('.mp-custom');
  var haupt = form.querySelector('[name="haupt"]');
  var akzent = form.querySelector('[name="akzent"]');
  var fileIn = form.querySelector('[name="logo"]');
  var drop = form.querySelector('.mp-drop');
  var dropText = drop.querySelector('.mp-drop-text');
  var logoNote = form.querySelector('.mp-logo-note');
  var preview = document.getElementById('entwurfPreview');
  var pvLogo = preview.querySelector('.pv-logo');
  var pvName = preview.querySelectorAll('.pv-name');
  var pvPal = preview.querySelector('.pv-pal');
  var company = form.querySelector('[name="company"]');
  var website = form.querySelector('[name="website"]');
  var message = form.querySelector('[name="message"]');
  var okBox = document.getElementById('entwurfOk');
  var errBox = document.getElementById('entwurfErr');
  var logo = null;
  var fromLogo = false;

  // --- couleurs ---
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function hex(c) { return '#' + c.map(function (v) { return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'); }).join(''); }
  function mix(a, b, t) { var x = rgb(a), y = rgb(b); return hex(x.map(function (v, i) { return v + (y[i] - v) * t; })); }
  function lum(h) {
    return rgb(h).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); })
      .reduce(function (s, v, i) { return s + v * [0.2126, 0.7152, 0.0722][i]; }, 0);
  }
  function contrast(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  // Version simplifiée de customPalette() du Starter-Kit, juste pour l'aperçu
  function derive(h, a) {
    var dark = h;
    while (contrast(dark, '#ffffff') < 7 && lum(dark) > 0.003) dark = mix(dark, '#000000', 0.08);
    return { bg: mix(h, '#ffffff', 0.96), surface: mix(h, '#ffffff', 0.88), accent: a, dark: dark };
  }
  function apply(p) {
    var s = preview.style;
    s.setProperty('--pv-bg', p.bg); s.setProperty('--pv-surface', p.surface);
    s.setProperty('--pv-accent', p.accent); s.setProperty('--pv-dark', p.dark);
    s.setProperty('--pv-ink', lum(p.bg) < 0.2 ? '#f5eadf' : mix(p.dark, '#000000', 0.4));
    s.setProperty('--pv-accent-ink', contrast(p.accent, '#ffffff') >= 3 ? '#ffffff' : '#1a1a1a');
  }

  // --- pastilles ---
  function swatch(id, label, colors) {
    var l = document.createElement('label');
    l.className = 'mp-sw';
    l.innerHTML = '<input type="radio" name="palette" value="' + id + '"><span class="mp-dot"></span><span class="mp-sw-name"></span>';
    l.querySelector('.mp-sw-name').textContent = label;
    var dot = l.querySelector('.mp-dot');
    if (colors) dot.style.background = 'conic-gradient(' + colors[0] + ' 0 50%, ' + colors[1] + ' 50% 100%)';
    else dot.classList.add(id === 'auto' ? 'is-auto' : 'is-custom');
    grid.appendChild(l);
    return l.querySelector('input');
  }
  swatch('auto', D.tAuto).checked = true;
  Object.keys(PALETTES).forEach(function (k) { swatch(k, PALETTES[k][0], [PALETTES[k][2], PALETTES[k][3]]); });
  var customRadio = swatch('eigen', D.tCustom);

  function current() { var r = form.querySelector('[name="palette"]:checked'); return r ? r.value : 'auto'; }
  function refresh() {
    var v = current();
    custom.hidden = v !== 'eigen';
    if (v === 'eigen') { apply(derive(haupt.value, akzent.value)); pvPal.textContent = D.tCustom; }
    else {
      var p = PALETTES[v === 'auto' ? 'schiefer' : v];
      apply({ bg: p[1], surface: p[2], accent: p[3], dark: p[4] });
      pvPal.textContent = v === 'auto' ? D.tAutoShort : p[0];
    }
  }
  grid.addEventListener('change', refresh);
  [haupt, akzent].forEach(function (i) { i.addEventListener('input', function () { fromLogo = false; refresh(); }); });

  // --- nom en direct ---
  function nameOnly() { return (company.value.split(',')[0] || '').trim(); }
  function initials(n) {
    var w = n.split(/\s+/).filter(function (x) { return x.length > 1; });
    return (w.length > 1 ? w[0][0] + w[1][0] : (w[0] || 'Ihr').slice(0, 2)).toUpperCase();
  }
  function refreshName() {
    var n = nameOnly() || D.tPlaceholder;
    pvName.forEach(function (el) { el.textContent = n; });
    if (!logo) pvLogo.textContent = initials(n);
  }
  company.addEventListener('input', refreshName);

  // --- logo ---
  function extract(img) {
    // deux couleurs dominantes, sans transparent, blanc ni gris très clair
    var c = document.createElement('canvas'), n = 64;
    c.width = c.height = n;
    var x = c.getContext('2d');
    x.drawImage(img, 0, 0, n, n);
    var px;
    try { px = x.getImageData(0, 0, n, n).data; } catch (e) { return null; }
    var buckets = {};
    for (var i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 200) continue;
      var r = px[i], g = px[i + 1], b = px[i + 2];
      if (r > 235 && g > 235 && b > 235) continue;
      var k = (r >> 4) + ',' + (g >> 4) + ',' + (b >> 4);
      var e = buckets[k] || (buckets[k] = { n: 0, r: 0, g: 0, b: 0 });
      e.n++; e.r += r; e.g += g; e.b += b;
    }
    var list = Object.keys(buckets).map(function (k) { var e = buckets[k]; return { n: e.n, c: [e.r / e.n, e.g / e.n, e.b / e.n] }; })
      .sort(function (p, q) { return q.n - p.n; });
    if (!list.length) return null;
    function sat(c) { var mx = Math.max.apply(0, c), mn = Math.min.apply(0, c); return mx ? (mx - mn) / mx : 0; }
    function dist(p, q) { return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); }
    var first = list[0].c;
    var second = null;
    for (var j = 1; j < list.length && !second; j++) if (list[j].n > 8 && dist(list[j].c, first) > 70) second = list[j].c;
    if (!second) return [hex(first), hex(first)];
    // la plus foncée devient la couleur principale, la plus vive l'accent
    var pair = lum(hex(first)) < lum(hex(second)) ? [first, second] : [second, first];
    if (sat(pair[0]) > sat(pair[1]) + 0.3) pair.reverse();
    return [hex(pair[0]), hex(pair[1])];
  }

  function showError(msg) { logoNote.textContent = msg; logoNote.classList.add('is-err'); logoNote.hidden = false; }
  function handleFile(f) {
    logoNote.classList.remove('is-err');
    if (!f) return;
    if (!/^image\/(png|jpeg|svg\+xml|webp)$/.test(f.type)) return showError(D.tLogoType);
    if (f.size > 2 * 1024 * 1024) return showError(D.tLogoSize);
    var rd = new FileReader();
    rd.onload = function () {
      var url = rd.result;
      logo = { name: f.name, type: f.type, data: String(url).split(',')[1] };
      pvLogo.textContent = '';
      pvLogo.innerHTML = '<img alt="">';
      pvLogo.querySelector('img').src = url;
      pvLogo.classList.add('has-img');
      dropText.textContent = f.name;
      drop.classList.add('has-file');
      var img = new Image();
      img.onload = function () {
        var cols = extract(img);
        if (!cols) { logoNote.hidden = true; return; }
        haupt.value = cols[0]; akzent.value = cols[1];
        customRadio.checked = true; fromLogo = true;
        refresh();
        logoNote.textContent = D.tLogoColors;
        logoNote.hidden = false;
      };
      img.src = url;
    };
    rd.readAsDataURL(f);
  }
  fileIn.addEventListener('change', function () { handleFile(fileIn.files[0]); });
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function () { drop.classList.remove('is-over'); }); });
  drop.addEventListener('drop', function (e) { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });

  // --- sans site : décrire l'offre ---
  function needMessage() { message.required = !website.value.trim(); }
  website.addEventListener('input', needMessage);
  needMessage();

  // --- envoi ---
  var btn = form.querySelector('button[type="submit"]');
  var label = btn.textContent;
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    okBox.hidden = true; errBox.hidden = true;
    btn.disabled = true; btn.textContent = D.tSending;
    var v = current();
    var get = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value : ''; };
    var url = website.value.trim();
    if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
    fetch('/api/website-entwurf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        _gotcha: get('_gotcha'), company: company.value, website: url, message: message.value,
        umfang: (form.querySelector('[name="umfang"]:checked') || {}).value, email: get('email'), phone: get('phone'),
        palette: v, farben: v === 'eigen' ? { haupt: haupt.value, akzent: akzent.value } : null,
        farbenAusLogo: v === 'eigen' && fromLogo, logo: logo, lang: lang,
      }),
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      form.hidden = true; okBox.hidden = false;
    }).catch(function () {
      errBox.hidden = false; btn.disabled = false; btn.textContent = label;
    });
  });

  refreshName();
  refresh();
})();
