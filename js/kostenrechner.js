/**
 * Kostenrechner (pages webdesign DE/FR/EN, section #kostenrechner).
 * Le visiteur choisit site web, paiement (Kauf/Abo, synchronisé avec les autres
 * .pay-switch de la page via html[data-pay]), maintenance et visibilité IA (sans nouveau
 * site : GEO-Optimierung ab CHF 900). Le résultat sépare « einmalig » et « pro Monat »
 * et donne un total sur 24 mois. Les prix ci-dessous doivent suivre ceux de la page
 * webdesign (et llms.txt). Ateliers IA et automatisation : page /ki-workshops, pas ici.
 */
(function () {
  var box = document.getElementById('calc');
  if (!box) return;
  var LANG = (document.documentElement.lang || 'de').slice(0, 2);
  if (['de', 'fr', 'en'].indexOf(LANG) < 0) LANG = 'de';
  var root = document.documentElement;

  // ---------- Prix (CHF). [min, max] = fourchette ; from: true = « ab » ----------
  var P = {
    site: {
      onepager: { kauf: [1790, 1790], abo: 139, start: [490, 119], wart: [39, 59, 99] },
      website: { kauf: [3900, 3900], abo: 239, start: [990, 199], wart: [69, 89, 129] },
      relaunch: { kauf: [2490, 2490], from: true, abo: 189, start: null, wart: [69, 89, 129] }
    },
    addon: { monitoring: 49, aktiv: 129 },
    geo: { once: [900, 900], month: 0, from: true }
  };

  var T = {
    de: {
      site: 'Website', siteOpts: { none: 'Keine neue Website', onepager: 'Onepager', website: 'Website (mehrere Seiten)', relaunch: 'Relaunch' },
      siteHint: { none: 'Ich habe schon eine Website', onepager: '1 Seite', website: 'ca. 6 Seiten', relaunch: 'bestehende Website neu gestaltet, bis 6 Seiten' },
      wart: 'Wartung', wartOpts: ['Keine Wartung', 'Basis · 15 Min. / Monat', 'S · 30 Min. / Monat', 'M · 1 Std. / Monat'],
      wartNone: 'eigenes Hosting, ohne Überwachung',
      start: 'Startbeitrag', startOpts: ['Ohne Startbeitrag', 'Mit Startbeitrag'],
      kiVis: 'KI-Sichtbarkeit', kiNone: 'Keine', addonOpts: { monitoring: 'GEO-Monitoring', aktiv: 'GEO Aktiv' },
      geoOpt: 'GEO-Optimierung',
      perMonth: '/ Monat', once: 'einmalig', monthly: 'pro Monat', from: 'ab', setup: 'Setup', incl: 'inklusive',
      result: 'Ihre Schätzung', item: 'Posten', empty: 'Wählen Sie oben, was Sie brauchen.',
      total: 'Total', total24: 'Total über 24 Monate', compareAbo: 'Im Abo wären es über 24 Monate', compareKauf: 'Beim Kauf wären es über 24 Monate',
      lines: { site: 'Website', wart: 'Wartung', start: 'Startbeitrag', addon: 'KI-Sichtbarkeit', geo: 'KI-Sichtbarkeit' },
      aboWart: 'Wartung und Änderungen im Abo inklusive',
      yearly: function (a, b) { return 'Tipp: Wartung jährlich bezahlt kostet CHF ' + a + ' statt ' + b + ' pro Jahr (2 Monate geschenkt).'; },
      min: { site: 'Website-Abo: Mindestdauer 24 Monate', geo: 'KI-Sichtbarkeit (Monitoring/Aktiv): Mindestdauer 6 Monate', wart: 'Wartung S und M: Mindestdauer 6 Monate' },
      note: 'Richtwerte. Verbindlich ist die Offerte nach dem kostenlosen Erstgespräch. Alle Preise in CHF, nicht MWST-pflichtig, Domain nicht inbegriffen.',
      ask: 'Offerte für diese Auswahl anfragen', call: 'Gespräch vereinbaren',
      msg: 'Meine Auswahl im Kostenrechner:', see: 'Details ↓', msgTotal: 'Geschätzt:'
    },
    fr: {
      site: 'Site web', siteOpts: { none: 'Pas de nouveau site', onepager: 'Onepager', website: 'Site web (plusieurs pages)', relaunch: 'Refonte' },
      siteHint: { none: 'J’ai déjà un site', onepager: '1 page', website: 'env. 6 pages', relaunch: 'site existant redessiné, jusqu’à 6 pages' },
      wart: 'Maintenance', wartOpts: ['Sans maintenance', 'Base · 15 min / mois', 'S · 30 min / mois', 'M · 1 h / mois'],
      wartNone: 'votre propre hébergement, sans surveillance',
      start: 'Contribution de départ', startOpts: ['Sans contribution de départ', 'Avec contribution de départ'],
      kiVis: 'Visibilité IA', kiNone: 'Aucune', addonOpts: { monitoring: 'Suivi GEO', aktiv: 'GEO Actif' },
      geoOpt: 'Optimisation GEO',
      perMonth: '/ mois', once: 'unique', monthly: 'par mois', from: 'dès', setup: 'mise en place', incl: 'inclus',
      result: 'Votre estimation', item: 'Poste', empty: 'Choisissez ci-dessus ce dont vous avez besoin.',
      total: 'Total', total24: 'Total sur 24 mois', compareAbo: 'En abonnement, cela ferait sur 24 mois', compareKauf: 'À l’achat, cela ferait sur 24 mois',
      lines: { site: 'Site web', wart: 'Maintenance', start: 'Contribution de départ', addon: 'Visibilité IA', geo: 'Visibilité IA' },
      aboWart: 'Maintenance et modifications incluses dans l’abonnement',
      yearly: function (a, b) { return 'Astuce : payée à l’année, la maintenance coûte CHF ' + a + ' au lieu de ' + b + ' par an (2 mois offerts).'; },
      min: { site: 'Abonnement site : durée minimale 24 mois', geo: 'Visibilité IA (suivi/actif) : durée minimale 6 mois', wart: 'Maintenance S et M : durée minimale 6 mois' },
      note: 'Valeurs indicatives. Seule l’offre après le premier entretien gratuit fait foi. Tous les prix en CHF, non soumis à la TVA, nom de domaine non compris.',
      ask: 'Demander une offre pour ce choix', call: 'Prendre rendez-vous',
      msg: 'Mon choix dans le calculateur de coûts :', see: 'Détails ↓', msgTotal: 'Estimation :'
    },
    en: {
      site: 'Website', siteOpts: { none: 'No new website', onepager: 'One-pager', website: 'Website (several pages)', relaunch: 'Relaunch' },
      siteHint: { none: 'I already have a website', onepager: '1 page', website: 'about 6 pages', relaunch: 'existing website redesigned, up to 6 pages' },
      wart: 'Maintenance', wartOpts: ['No maintenance', 'Basic · 15 min / month', 'S · 30 min / month', 'M · 1 hour / month'],
      wartNone: 'your own hosting, no monitoring',
      start: 'Start-up fee', startOpts: ['No start-up fee', 'With start-up fee'],
      kiVis: 'AI visibility', kiNone: 'None', addonOpts: { monitoring: 'GEO monitoring', aktiv: 'GEO Active' },
      geoOpt: 'GEO optimisation',
      perMonth: '/ month', once: 'one-off', monthly: 'per month', from: 'from', setup: 'setup', incl: 'included',
      result: 'Your estimate', item: 'Item', empty: 'Choose what you need above.',
      total: 'Total', total24: 'Total over 24 months', compareAbo: 'By subscription it would be, over 24 months,', compareKauf: 'Buying, it would be, over 24 months,',
      lines: { site: 'Website', wart: 'Maintenance', start: 'Start-up fee', addon: 'AI visibility', geo: 'AI visibility' },
      aboWart: 'Maintenance and changes included in the subscription',
      yearly: function (a, b) { return 'Tip: paid yearly, maintenance costs CHF ' + a + ' instead of ' + b + ' per year (2 months free).'; },
      min: { site: 'Website subscription: minimum term 24 months', geo: 'AI visibility (monitoring/active): minimum term 6 months', wart: 'Maintenance S and M: minimum term 6 months' },
      note: 'Estimates only. The quote after the free intro call is binding. All prices in CHF, not subject to VAT, domain not included.',
      ask: 'Request a quote for this selection', call: 'Schedule a call',
      msg: 'My selection in the cost calculator:', see: 'Details ↓', msgTotal: 'Estimated:'
    }
  }[LANG];

  var state = { site: 'onepager', wart: 1, start: 0, addon: 'none', geo: 'none' };

  function pay() { return root.getAttribute('data-pay') === 'abo' ? 'abo' : 'kauf'; }
  function n(x) { return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, "'"); }
  function money(r, from) {
    if (r[0] === r[1]) return (from ? T.from + ' ' : '') + 'CHF ' + n(r[0]);
    return 'CHF ' + n(r[0]) + '–' + n(r[1]);
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---------- Lignes de coût pour un mode de paiement ----------
  function lines(mode) {
    var L = [], s = state, site = P.site[s.site];
    if (site) {
      if (mode === 'kauf') {
        L.push({ k: 'site', label: T.siteOpts[s.site], once: site.kauf, month: 0, from: site.from });
        if (s.wart > 0) L.push({ k: 'wart', label: T.lines.wart + ' ' + T.wartOpts[s.wart].split(' ·')[0], once: [0, 0], month: site.wart[s.wart - 1] });
      } else if (site.start && s.start) {
        L.push({ k: 'start', label: T.lines.start, once: [site.start[0], site.start[0]], month: 0 });
        L.push({ k: 'site', label: T.siteOpts[s.site] + ' (Abo)', once: [0, 0], month: site.start[1], note: T.aboWart });
      } else {
        L.push({ k: 'site', label: T.siteOpts[s.site] + ' (Abo)', once: [0, 0], month: site.abo, note: T.aboWart });
      }
      if (s.addon !== 'none') L.push({ k: 'addon', label: T.addonOpts[s.addon], once: [0, 0], month: P.addon[s.addon] });
    } else if (s.geo !== 'none') {
      L.push({ k: 'geo', label: T.geoOpt, once: P.geo.once, month: 0, from: P.geo.from });
    }
    return L;
  }
  function sum(L) {
    var o = [0, 0], m = 0, from = false;
    L.forEach(function (l) { o[0] += l.once[0]; o[1] += l.once[1]; m += l.month; if (l.from) from = true; });
    return { once: o, month: m, from: from, t24: [o[0] + 24 * m, o[1] + 24 * m] };
  }

  // ---------- Interface ----------
  function radio(group, value, label, hint, price) {
    var id = 'kr-' + group + '-' + value;
    var on = String(state[group]) === String(value);
    return '<label class="kr-opt' + (on ? ' on' : '') + '" for="' + id + '"><input type="radio" name="kr-' + group + '" id="' + id + '" value="' + value + '"' + (on ? ' checked' : '') + '>'
      + '<span class="kr-l">' + esc(label) + (hint ? '<small>' + esc(hint) + '</small>' : '') + '</span>'
      + (price ? '<span class="kr-p">' + esc(price) + '</span>' : '') + '</label>';
  }
  function group(title, inner) { return '<fieldset class="kr-group"><legend>' + esc(title) + '</legend><div class="kr-opts">' + inner + '</div></fieldset>'; }

  function render() {
    var mode = pay(), s = state, site = P.site[s.site], h = '';
    // valeurs incompatibles
    if (!site) { s.addon = 'none'; } else { s.geo = 'none'; }
    if (site && !site.start) s.start = 0;
    var siteOpts = ['onepager', 'website', 'relaunch', 'none'].map(function (k) {
      var x = P.site[k], price = '';
      if (x) price = mode === 'kauf' ? money(x.kauf, x.from) : 'CHF ' + n(x.abo) + ' ' + T.perMonth;
      return radio('site', k, T.siteOpts[k], T.siteHint[k], price);
    }).join('');
    h += group(T.site, siteOpts);
    if (site && mode === 'kauf') {
      h += group(T.wart, T.wartOpts.map(function (lab, i) {
        return radio('wart', i, lab, i ? '' : T.wartNone, i ? 'CHF ' + site.wart[i - 1] + ' ' + T.perMonth : '');
      }).join(''));
    }
    if (site && mode === 'abo' && site.start) {
      h += group(T.start, radio('start', 0, T.startOpts[0], '', 'CHF ' + site.abo + ' ' + T.perMonth)
        + radio('start', 1, T.startOpts[1] + ' CHF ' + n(site.start[0]), '', 'CHF ' + site.start[1] + ' ' + T.perMonth));
    }
    if (site) {
      h += group(T.kiVis, radio('addon', 'none', T.kiNone, '', '') + ['monitoring', 'aktiv'].map(function (k) {
        return radio('addon', k, T.addonOpts[k], '', 'CHF ' + P.addon[k] + ' ' + T.perMonth);
      }).join(''));
    } else {
      h += group(T.kiVis, radio('geo', 'none', T.kiNone, '', '') + radio('geo', 'opt', T.geoOpt, '', money(P.geo.once, P.geo.from)));
    }

    var L = lines(mode), S = sum(L);
    var r = '<div class="kr-result" aria-live="polite"><p class="kr-rh">' + esc(T.result) + '</p>';
    if (!L.length) r += '<p class="kr-empty">' + esc(T.empty) + '</p>';
    else {
      r += '<table class="kr-table"><thead><tr><th scope="col">' + esc(T.item) + '</th><th scope="col">' + esc(T.once) + '</th><th scope="col">' + esc(T.monthly) + '</th></tr></thead><tbody>';
      L.forEach(function (l) {
        var o = l.once[1] ? money(l.once, l.from) : '–';
        var m = l.month ? 'CHF ' + n(l.month) : '–';
        r += '<tr><th scope="row">' + esc(l.label) + (l.note ? '<small>' + esc(l.note) + '</small>' : '') + '</th><td>' + esc(o) + '</td><td>' + esc(m) + '</td></tr>';
      });
      r += '</tbody><tfoot><tr><th scope="row">' + esc(T.total) + '</th><td>' + esc(S.once[1] ? money(S.once, S.from) : '–') + '</td><td>' + esc(S.month ? 'CHF ' + n(S.month) : '–') + '</td></tr></tfoot></table>';
      r += '<div class="kr-big"><span>' + esc(T.total24) + '</span><strong>' + esc(money(S.t24, S.from)) + '</strong></div>';
      if (site) {
        var other = mode === 'kauf' ? 'abo' : 'kauf', O = sum(lines(other));
        r += '<p class="kr-compare">' + esc(mode === 'kauf' ? T.compareAbo : T.compareKauf) + ' <strong>' + esc(money(O.t24, O.from)) + '</strong>. <button type="button" class="kr-switch" data-to="' + other + '">' + esc(other === 'abo' ? 'Abo' : (LANG === 'fr' ? 'Achat' : LANG === 'en' ? 'Buy' : 'Kauf')) + ' →</button></p>';
      }
      var notes = [];
      if (site && mode === 'kauf' && s.wart > 0) notes.push(T.yearly(n(site.wart[s.wart - 1] * 10), n(site.wart[s.wart - 1] * 12)));
      if (site && mode === 'abo') notes.push(T.min.site);
      if (site && s.addon !== 'none') notes.push(T.min.geo);
      if (site && mode === 'kauf' && s.wart > 1) notes.push(T.min.wart);
      notes.push(T.note);
      r += '<ul class="kr-notes">' + notes.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
      r += '<div class="kr-cta"><a class="btn-primary" href="#kontakt" data-kr-ask>' + esc(T.ask) + '</a><a class="btn-secondary" href="https://calendly.com/zbinden-austausch/30min" target="_blank" rel="noopener">' + esc(T.call) + '</a></div>';
    }
    r += '</div>';
    // Mobile : petit total qui suit le défilement pendant les choix.
    var mini = L.length ? '<div class="kr-mini" aria-hidden="true"><span>' + esc(T.total) + '</span><strong>' + esc((S.once[1] ? money(S.once, S.from) : '') + (S.once[1] && S.month ? ' + ' : '') + (S.month ? 'CHF ' + n(S.month) + ' ' + T.perMonth : '')) + '</strong><a href="#kr-result" tabindex="-1">' + esc(T.see) + '</a></div>' : '';
    box.innerHTML = '<div class="kr-grid"><div class="kr-form">' + h + mini + '</div>' + r.replace('<div class="kr-result"', '<div class="kr-result" id="kr-result"') + '</div>';

    box.querySelectorAll('input[type="radio"]').forEach(function (inp) {
      inp.addEventListener('change', function () {
        var g = inp.name.slice(3);
        state[g] = /^\d+$/.test(inp.value) ? +inp.value : inp.value;
        var y = window.scrollY; render(); window.scrollTo(0, y);
        var again = document.getElementById(inp.id); if (again) again.focus({ preventScroll: true });
      });
    });
    var sw = box.querySelector('.kr-switch');
    if (sw) sw.addEventListener('click', function () {
      var b = document.querySelector('#kostenrechner .pay-switch button[data-pay="' + sw.getAttribute('data-to') + '"]');
      if (b) b.click();
    });
    var ask = box.querySelector('[data-kr-ask]');
    if (ask) ask.addEventListener('click', function () {
      var msg = document.getElementById('f-message'), Lx = lines(pay()), Sx = sum(Lx);
      if (msg) {
        msg.value = T.msg + '\n' + Lx.map(function (l) { return '- ' + l.label; }).join('\n')
          + '\n' + T.msgTotal + ' ' + (Sx.once[1] ? money(Sx.once, Sx.from) + ' ' + T.once : '') + (Sx.once[1] && Sx.month ? ' + ' : '') + (Sx.month ? 'CHF ' + n(Sx.month) + ' ' + T.monthly : '');
      }
      setTimeout(function () { var f = document.getElementById('f-name'); if (f) f.focus({ preventScroll: true }); }, 500);
    });
  }

  // Le switch Kauf/Abo est partagé avec le reste de la page.
  new MutationObserver(function () { var y = window.scrollY; render(); window.scrollTo(0, y); }).observe(root, { attributes: true, attributeFilter: ['data-pay'] });

  var css = document.createElement('style');
  css.textContent =
    '.kr-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);gap:clamp(24px,4vw,44px);align-items:start;}' +
    '@media (max-width:900px){.kr-grid{grid-template-columns:1fr;}}' +
    '.kr-group{border:0;margin:0 0 22px;padding:0;min-width:0;}' +
    '.kr-group legend{font-family:var(--font-ui);font-weight:600;font-size:.8rem;letter-spacing:.12em;text-transform:uppercase;color:var(--sec-muted);margin-bottom:10px;padding:0;}' +
    '.kr-opts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}' +
    '@media (max-width:560px){.kr-opts{grid-template-columns:1fr;}}' +
    '.kr-opt{position:relative;display:flex;flex-direction:column;gap:4px;padding:12px 14px;border:1px solid var(--sec-line-strong);border-radius:var(--r-sm);background:var(--sec-bg);cursor:pointer;transition:border-color .15s ease,background .15s ease;}' +
    '.kr-opt:hover{border-color:var(--sec-gold);}' +
    '.kr-opt.on{border-color:var(--sec-gold-deep);background:var(--sec-gold-soft);box-shadow:inset 0 0 0 1px var(--sec-gold-deep);}' +
    '.kr-opt input{position:absolute;opacity:0;pointer-events:none;}' +
    '.kr-opt:focus-within{outline:2px solid var(--sec-gold);outline-offset:2px;}' +
    '.kr-l{font-weight:500;font-size:.95rem;color:var(--sec-ink);line-height:1.35;}' +
    '.kr-l small{display:block;font-weight:300;font-size:.82rem;color:var(--sec-muted);margin-top:2px;}' +
    '.kr-p{font-family:var(--font-display);font-weight:700;font-size:.95rem;color:var(--sec-gold-deep);}' +
    '.kr-sub{margin:30px 0 14px;font-family:var(--font-display);font-weight:700;font-size:1.15rem;color:var(--sec-ink);}' +
    '.kr-result{position:sticky;top:120px;background:#121212;color:#f6f3ec;border:2px solid #c9a227;border-radius:var(--r-lg);padding:clamp(20px,3vw,30px);box-shadow:0 30px 70px -30px rgba(0,0,0,.5);}' +
    '@media (max-width:900px){.kr-result{position:static;}}' +
    '.kr-rh{margin:0 0 14px;font-family:var(--font-ui);font-weight:600;font-size:.8rem;letter-spacing:.14em;text-transform:uppercase;color:#e8d38a;}' +
    '.kr-empty{margin:0;color:#a9a297;font-weight:300;}' +
    '.kr-table{width:100%;border-collapse:collapse;font-size:.9rem;}' +
    '.kr-table th,.kr-table td{text-align:left;padding:9px 6px 9px 0;border-bottom:1px solid rgba(255,255,255,.10);vertical-align:top;font-weight:300;}' +
    '.kr-table td{text-align:right;white-space:nowrap;padding-right:0;padding-left:8px;}' +
    '.kr-table thead th{font-family:var(--font-ui);font-weight:600;font-size:.74rem;letter-spacing:.1em;text-transform:uppercase;color:#a9a297;}' +
    '.kr-table thead th:not(:first-child){text-align:right;}' +
    '.kr-table tbody th{color:#f6f3ec;font-weight:400;}' +
    '.kr-table th small{display:block;color:#a9a297;font-size:.78rem;font-weight:300;margin-top:2px;}' +
    '.kr-table tfoot th,.kr-table tfoot td{font-weight:600;color:#f6f3ec;border-bottom:0;padding-top:12px;}' +
    '.kr-big{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:6px 14px;margin:14px 0 0;padding:14px 0 0;border-top:1px solid rgba(201,162,39,.38);}' +
    '.kr-big span{font-family:var(--font-ui);font-weight:600;font-size:.8rem;letter-spacing:.1em;text-transform:uppercase;color:#a9a297;}' +
    '.kr-big strong{font-family:var(--font-display);font-size:clamp(1.5rem,2.6vw,1.9rem);background:linear-gradient(100deg,#c9a227 0%,#e8d38a 55%,#f2e6bd 100%);-webkit-background-clip:text;background-clip:text;color:transparent;}' +
    '.kr-compare{margin:10px 0 0;font-size:.88rem;color:#a9a297;font-weight:300;line-height:1.5;}' +
    '.kr-compare strong{color:#f6f3ec;font-weight:500;}' +
    '.kr-switch{border:0;background:none;color:#e8d38a;font:inherit;font-weight:600;cursor:pointer;padding:0;text-decoration:underline;text-underline-offset:3px;}' +
    '.kr-notes{list-style:none;margin:16px 0 0;padding:0;display:grid;gap:6px;}' +
    '.kr-notes li{font-size:.82rem;color:#a9a297;font-weight:300;line-height:1.5;padding-left:16px;position:relative;}' +
    '.kr-notes li::before{content:"–";position:absolute;left:0;color:#c9a227;}' +
    '.kr-cta{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px;}' +
    '.kr-result .btn-secondary{color:#f6f3ec;border-color:rgba(255,255,255,.25);}' +
    '.kr-mini{display:none;}' +
    '@media (max-width:900px){.kr-mini{position:sticky;bottom:10px;z-index:5;display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;margin-top:8px;padding:12px 16px;border-radius:var(--r-md);background:#121212;color:#f6f3ec;border:1px solid #c9a227;box-shadow:0 14px 34px -12px rgba(0,0,0,.5);}' +
    '.kr-mini span{font-family:var(--font-ui);font-weight:600;font-size:.74rem;letter-spacing:.12em;text-transform:uppercase;color:#a9a297;}' +
    '.kr-mini strong{font-family:var(--font-display);font-size:1.02rem;color:#e8d38a;flex:1;}' +
    '.kr-mini a{font-family:var(--font-ui);font-weight:600;font-size:.86rem;color:#e8d38a;text-decoration:none;}}' +
    '#kr-result{scroll-margin-top:140px;}';
  document.head.appendChild(css);
  render();
})();
