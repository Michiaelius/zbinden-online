/**
 * Formulaire GEO-Light (pages geo-audit DE/FR/EN).
 * 1. Le visiteur saisit URL + e-mail → /api/geo-preview lit son site et propose le profil testé.
 * 2. Une fenêtre affiche ce profil (modifiable) et les 8 questions qui seront posées.
 * 3. À la confirmation, la demande part vers /api/contact avec le profil (champ « profile », JSON).
 * Sans JavaScript, le formulaire envoie simplement URL + e-mail comme avant.
 *
 * Les modèles de questions reprennent ceux de ai_visibility.py (skill geo-pipeline) :
 * toute modification là-bas doit être reportée dans buildQuestions().
 */
(function () {
  var form = document.getElementById('geoLightForm');
  if (!form || !window.fetch || typeof HTMLDialogElement !== 'function') return;

  var UI_LANG = (document.documentElement.lang || 'de').slice(0, 2);
  if (['de', 'fr', 'en'].indexOf(UI_LANG) < 0) UI_LANG = 'de';

  var T = {
    de: {
      analyze: 'Website analysieren', analyzing: 'Ich lese Ihre Website …',
      title: 'Das wird getestet',
      intro: 'Bitte prüfen Sie kurz, ob das stimmt, und korrigieren Sie, was nicht passt. Genau diese Angaben verwende ich für die Fragen an ChatGPT und Perplexity.',
      several: 'Ihre Website zeigt mehrere Tätigkeiten: {list}. Vorgeschlagen ist „{first}“. Soll eine andere getestet werden, passen Sie Branche und Leistungen einfach an.',
      failed: 'Ihre Website konnte ich nicht automatisch lesen. Ergänzen Sie die Angaben kurz – oder senden Sie die Anfrage einfach so ab, dann übernehme ich das.',
      company: 'Firmenname', city: 'Ort (so, wie Kunden suchen)', branche: 'Branche',
      offer1: 'Wichtigste Leistung', offer2: 'Zweite Leistung', offer3: 'Dritte Leistung',
      person: 'Inhaber/in (optional)', role: 'Funktion',
      lang: 'Sprache Ihrer Kundschaft', langs: { de: 'Deutsch', fr: 'Französisch', en: 'Englisch' },
      questions: 'Diese 8 Fragen stelle ich ChatGPT und Perplexity',
      submit: 'Stimmt so – Test anfordern', sending: 'Wird gesendet …', back: 'Zurück',
      error: 'Das hat leider nicht geklappt. Schreiben Sie mir direkt an info@zbinden.online.',
    },
    fr: {
      analyze: 'Analyser le site', analyzing: 'Je lis votre site …',
      title: 'Voici ce qui sera testé',
      intro: 'Vérifiez rapidement que c’est juste et corrigez ce qui ne convient pas. Ce sont exactement ces informations que j’utilise pour les questions posées à ChatGPT et Perplexity.',
      several: 'Votre site présente plusieurs activités : {list}. La proposition porte sur « {first} ». Si vous souhaitez en tester une autre, adaptez simplement le secteur et les prestations.',
      failed: 'Je n’ai pas pu lire votre site automatiquement. Complétez rapidement les informations – ou envoyez simplement la demande telle quelle, je m’en occupe.',
      company: 'Nom de l’entreprise', city: 'Lieu (tel que vos clients le cherchent)', branche: 'Secteur',
      offer1: 'Prestation principale', offer2: 'Deuxième prestation', offer3: 'Troisième prestation',
      person: 'Propriétaire ou direction (facultatif)', role: 'Fonction',
      lang: 'Langue de vos clients', langs: { de: 'Allemand', fr: 'Français', en: 'Anglais' },
      questions: 'Les 8 questions que je pose à ChatGPT et Perplexity',
      submit: 'C’est juste – demander le test', sending: 'Envoi en cours …', back: 'Retour',
      error: 'Un problème est survenu. Écrivez-moi directement à info@zbinden.online.',
    },
    en: {
      analyze: 'Analyse website', analyzing: 'Reading your website …',
      title: 'This is what will be tested',
      intro: 'Please check that this is right and correct anything that does not fit. These are exactly the details I use for the questions to ChatGPT and Perplexity.',
      several: 'Your website shows several activities: {list}. The proposal is based on “{first}”. If another one should be tested, simply adjust the industry and services.',
      failed: 'I could not read your website automatically. Please fill in the details briefly – or simply send the request as it is and I will take care of it.',
      company: 'Business name', city: 'Location (as customers search for it)', branche: 'Industry',
      offer1: 'Main service', offer2: 'Second service', offer3: 'Third service',
      person: 'Owner or management (optional)', role: 'Role',
      lang: 'Language of your customers', langs: { de: 'German', fr: 'French', en: 'English' },
      questions: 'The 8 questions I ask ChatGPT and Perplexity',
      submit: 'Looks right – request the test', sending: 'Sending …', back: 'Back',
      error: 'Something went wrong. Please email me directly at info@zbinden.online.',
    },
  }[UI_LANG];

  var NATIONWIDE = /^(schweiz|suisse|switzerland|svizzera)$/i;

  // ---------- Questions (miroir de ai_visibility.py) ----------
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function opt(v, d) { return (v || '').trim() || d; }

  function buildQuestions(p) {
    var company = p.company || '…', city = p.city || '…';
    var branche = p.branche || '…';
    var o = (p.offers || []).map(function (x) { return (x || '').trim(); });
    var o1 = o[0] || branche, o2 = o[1] || branche, o3 = o[2] || branche;
    var role = opt(p.person_role, branche);
    var q1, q2p, q2f, rest, ci;
    // fr/en : chaque offre ouvre sa question (« Gestion de patrimoine Genève … »).
    if (p.lang === 'fr' || p.lang === 'en') { o1 = cap(o1); o2 = cap(o2); o3 = cap(o3); }
    if (p.lang === 'fr') {
      ci = opt(p.city_in, 'à ' + city);
      var quel = opt(p.quel, 'quel ' + branche);
      q1 = 'Que fait ' + company + ' ' + ci + ' ?';
      q2p = 'Qui est ' + p.person + ', ' + role + ' ' + ci + ' ?';
      q2f = 'Que propose ' + company + ' ' + ci + ' ?';
      rest = [o1 + ' ' + city + ' — quel prestataire recommandes-tu ?', o2 + ' ' + city, o3 + ' ' + city,
        o1 + ' ' + ci + ' — ' + quel + ' recommandes-tu ?', cap(quel) + ' recommandes-tu ' + ci + ' ?',
        cap(o2) + ' ' + ci + " : à qui s'adresser ?"];
    } else if (p.lang === 'en') {
      ci = opt(p.city_in, city);
      var which = opt(p.which, 'which ' + branche);
      q1 = 'What is ' + company + ' in ' + ci + '?';
      q2p = 'Who is ' + p.person + ', ' + role + ' in ' + ci + '?';
      q2f = 'What does ' + company + ' offer in ' + ci + '?';
      rest = [o1 + ' ' + city + ' — which provider do you recommend?', o2 + ' ' + city, o3 + ' ' + city,
        o1 + ' in ' + ci + ' — ' + which + ' do you recommend?', cap(which) + ' do you recommend in ' + ci + '?',
        cap(o2) + ' in ' + ci + ': who should I contact?'];
    } else {
      ci = opt(p.city_in, city);
      var akk = opt(p.welche_akk, 'welche ' + branche), nom = opt(p.welche_nom, 'welche ' + branche);
      q1 = 'Was ist ' + company + ' in ' + ci + '?';
      q2p = 'Wer ist ' + p.person + ', ' + role + ' in ' + ci + '?';
      q2f = cap(nom) + ' ist ' + company + ' in ' + ci + '?';
      rest = [o1 + ' ' + city + ' — welchen Anbieter empfiehlst du?', o2 + ' ' + city, o3 + ' ' + city,
        o1 + ' in ' + ci + ' — ' + akk + ' empfiehlst du?', cap(akk) + ' empfiehlst du in ' + ci + '?',
        'Wo in ' + ci + ' macht man ' + o2 + '?'];
    }
    return [q1, (p.person || '').trim() ? q2p : q2f].concat(rest);
  }

  function defaultCityIn(lang, city) {
    if (NATIONWIDE.test(city)) return { de: 'der Schweiz', fr: 'en Suisse', en: 'Switzerland' }[lang];
    return lang === 'fr' ? 'à ' + city : city;
  }

  // ---------- Fenêtre de confirmation ----------
  var css = document.createElement('style');
  css.textContent =
    '.gl-dialog{width:min(640px,calc(100vw - 32px));max-height:calc(100vh - 32px);padding:0;border:1px solid var(--sec-line-gold);' +
    'border-radius:var(--r-lg);background:var(--sec-bg-2);color:var(--sec-ink);box-shadow:0 30px 80px -30px rgba(0,0,0,.5);}' +
    '.gl-dialog::backdrop{background:rgba(10,8,0,.55);}' +
    '.gl-inner{padding:28px 26px 24px;display:grid;gap:18px;}' +
    '.gl-inner h3{margin:0;font-family:var(--font-display);font-size:1.5rem;font-weight:400;}' +
    '.gl-inner p{margin:0;color:var(--sec-muted);font-size:.95rem;line-height:1.6;}' +
    '.gl-note{padding:12px 14px;border-radius:var(--r-sm);background:var(--sec-gold-soft);color:var(--sec-ink)!important;}' +
    '.gl-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}' +
    '.gl-grid .wide{grid-column:1/-1;}' +
    '@media (max-width:560px){.gl-grid{grid-template-columns:1fr;}.gl-inner{padding:22px 16px 18px;}}' +
    '.gl-q{margin:0;padding:14px 16px 14px 34px;border:1px solid var(--sec-line);border-radius:var(--r-md);background:var(--sec-bg);' +
    'font-size:.9rem;line-height:1.5;display:grid;gap:6px;}' +
    '.gl-qh{font-family:var(--font-ui);font-size:.68rem;letter-spacing:.1em;text-transform:uppercase;color:var(--sec-muted);font-weight:600;}' +
    '.gl-actions{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;}' +
    '.gl-back{background:none;border:none;color:var(--sec-muted);font:inherit;font-size:.9rem;cursor:pointer;text-decoration:underline;padding:6px 0;}' +
    '.gl-err{color:#b3261e!important;}';
  document.head.appendChild(css);

  var dlg = document.createElement('dialog');
  dlg.className = 'gl-dialog';
  dlg.setAttribute('aria-labelledby', 'gl-title');

  function field(id, label, wide) {
    return '<div class="field' + (wide ? ' wide' : '') + '"><label for="gl-' + id + '">' + label + '</label>' +
      '<input type="text" id="gl-' + id + '" data-k="' + id + '" maxlength="120" autocomplete="off"></div>';
  }
  dlg.innerHTML =
    '<div class="gl-inner">' +
    '<h3 id="gl-title">' + T.title + '</h3>' +
    '<p id="gl-intro"></p>' +
    '<p class="gl-note" id="gl-note" hidden></p>' +
    '<div class="gl-grid">' +
    field('company', T.company) + field('city', T.city) +
    field('branche', T.branche, true) +
    field('offer1', T.offer1, true) + field('offer2', T.offer2) + field('offer3', T.offer3) +
    field('person', T.person) + field('person_role', T.role) +
    '<div class="field wide"><label for="gl-lang">' + T.lang + '</label><select id="gl-lang" data-k="lang">' +
    ['de', 'fr', 'en'].map(function (l) { return '<option value="' + l + '">' + T.langs[l] + '</option>'; }).join('') +
    '</select></div>' +
    '</div>' +
    '<div><div class="gl-qh">' + T.questions + '</div><ol class="gl-q" id="gl-q"></ol></div>' +
    '<p class="gl-err" id="gl-err" hidden>' + T.error + '</p>' +
    '<div class="gl-actions"><button type="button" class="gl-back" id="gl-back">' + T.back + '</button>' +
    '<button type="submit" class="btn-primary" id="gl-send">' + T.submit + '</button></div>' +
    '</div>';
  form.appendChild(dlg);

  var hidden = document.createElement('input');
  hidden.type = 'hidden';
  hidden.name = 'profile';
  form.appendChild(hidden);

  var cardBtn = form.querySelector('button[type="submit"]:not(#gl-send)');
  var cardLabel = T.analyze;
  cardBtn.textContent = cardLabel;
  var okBox = document.getElementById('glOk');
  var errBox = document.getElementById('glErr');
  var urlInput = form.querySelector('input[name="website"]');

  var profile = null;      // profil courant (modifié par le visiteur)
  var proposed = null;     // profil proposé par l'analyse
  var analyzedUrl = '';

  function $(id) { return document.getElementById('gl-' + id); }

  function domainOf(u) {
    try { return new URL(/^https?:/i.test(u) ? u : 'https://' + u).hostname.replace(/^www\./, ''); }
    catch (e) { return ''; }
  }

  function render() {
    var list = buildQuestions(profile);
    var q = $('q');
    q.innerHTML = '';
    list.forEach(function (t) { var li = document.createElement('li'); li.textContent = t; q.appendChild(li); });
    var edited = [];
    if (proposed) {
      ['company', 'city', 'branche', 'person', 'person_role', 'lang'].forEach(function (k) {
        if ((profile[k] || '') !== (proposed[k] || '')) edited.push(k);
      });
      if (profile.offers.join('|') !== proposed.offers.join('|')) edited.push('offers');
    }
    var out = {};
    Object.keys(profile).forEach(function (k) { out[k] = profile[k]; });
    if (proposed && proposed.activities) out.activities = proposed.activities;
    out.domain = domainOf(urlInput.value);
    out.analysis = proposed ? 'ok' : 'failed';
    out.edited = edited;
    out.questions = list;
    hidden.value = JSON.stringify(out);
  }

  function fill(p) {
    profile = {
      lang: p.lang || UI_LANG, company: p.company || '', city: p.city || '', city_in: p.city_in || '',
      branche: p.branche || '', offers: [0, 1, 2].map(function (i) { return (p.offers || [])[i] || ''; }),
      person: p.person || '', person_role: p.person_role || '',
      welche_akk: p.welche_akk || '', welche_nom: p.welche_nom || '', quel: p.quel || '', which: p.which || '',
    };
    $('company').value = profile.company; $('city').value = profile.city; $('branche').value = profile.branche;
    $('offer1').value = profile.offers[0]; $('offer2').value = profile.offers[1]; $('offer3').value = profile.offers[2];
    $('person').value = profile.person; $('person_role').value = profile.person_role; $('lang').value = profile.lang;
    $('intro').textContent = proposed ? T.intro : T.failed;
    var acts = p.activities || [];
    $('note').textContent = acts.length > 1
      ? T.several.replace('{list}', acts.join(', ')).replace('{first}', acts[0])
      : '';
    $('note').hidden = acts.length < 2;
    $('err').hidden = true;
    render();
  }

  dlg.addEventListener('input', function (ev) {
    var k = ev.target.getAttribute('data-k');
    if (!k || !profile) return;
    var v = ev.target.value.trim();
    if (/^offer[123]$/.test(k)) profile.offers[+k.slice(5) - 1] = v;
    else profile[k] = v;
    // Les tournures grammaticales proposées ne valent que pour le terme et la langue d'origine.
    if (k === 'branche' || k === 'lang') { profile.welche_akk = profile.welche_nom = profile.quel = profile.which = ''; }
    if (k === 'city' || k === 'lang') profile.city_in = profile.city ? defaultCityIn(profile.lang, profile.city) : '';
    render();
  });
  $('back').addEventListener('click', function () { dlg.close(); });

  function analyze() {
    var url = urlInput.value.trim();
    if (url === analyzedUrl && profile) { dlg.showModal(); return; }
    cardBtn.disabled = true;
    cardBtn.textContent = T.analyzing;
    errBox.hidden = true;
    fetch('/api/geo-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ url: url, lang: UI_LANG }),
    }).then(function (r) { return r.json(); })
      .then(function (d) { return d && d.ok ? d.profile : null; }, function () { return null; })
      .then(function (p) {
        proposed = p ? JSON.parse(JSON.stringify(p)) : null;
        if (proposed) proposed.offers = [0, 1, 2].map(function (i) { return proposed.offers[i] || ''; });
        analyzedUrl = url;
        fill(p || {});
        cardBtn.disabled = false;
        cardBtn.textContent = cardLabel;
        dlg.showModal();
        $('company').focus();
      });
  }

  function send() {
    var btn = $('send');
    btn.disabled = true;
    btn.textContent = T.sending;
    $('err').hidden = true;
    render();
    fetch(form.action, {
      method: 'POST',
      body: new URLSearchParams(new FormData(form)),
      headers: { Accept: 'application/json' },
    }).then(function (res) {
      if (!res.ok) throw new Error('status ' + res.status);
      dlg.close();
      form.reset();
      form.hidden = true;
      okBox.hidden = false;
    }).catch(function () {
      $('err').hidden = false;
      btn.disabled = false;
      btn.textContent = T.submit;
    });
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    // Entrée dans un champ de la fenêtre = confirmation, comme le bouton.
    if (dlg.open) send();
    else analyze();
  });
})();
