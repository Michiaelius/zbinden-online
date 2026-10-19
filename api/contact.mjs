/**
 * POST /api/contact
 * Reçoit les formulaires « GEO-Light » et « Anfrage / Demande » des pages
 * geo-audit, webdesign et ki-agenten-automatisierung (DE/FR/EN) et envoie :
 *  1. la demande à info@zbinden.online (« Répondre » écrit au visiteur) ;
 *  2. un e-mail de confirmation au visiteur, dans la langue de la page.
 * La confirmation est un texte fixe : rien de ce que le visiteur a saisi n'y est repris.
 * Formulaire GEO-Light : le champ « profile » (JSON de js/geo-light.js) contient le profil
 * confirmé par le visiteur ; il est ajouté à la notification avec un kandidat.json prêt à l'emploi.
 *
 * Aucune dépendance : appel direct de l'API REST de Resend via fetch (Node 18+).
 * Variable d'environnement requise dans Vercel : RESEND_API_KEY
 * (optionnel : CONTACT_TO pour changer l'adresse de réception)
 */

const CALENDLY = 'https://calendly.com/zbinden-austausch/30min';
const FROM = 'Zbinden Software <info@zbinden.online>';
const PHONE = '+41 79 193 68 02';

const LABELS = {
  package: 'Intérêt',
  website: 'Site web',
  name: 'Nom',
  email: 'E-mail',
  company: 'Entreprise',
  message: 'Message',
  page: 'Page',
};

/* Textes de la confirmation envoyée au visiteur.
   geoLight = formulaire du test gratuit, request = formulaire de contact. */
const COPY = {
  de: {
    hi: 'Guten Tag,',
    geoLight: {
      subject: 'Ihr GEO-Light-Test ist angefragt — Zbinden Software',
      body: [
        'vielen Dank für Ihre Anfrage. Ich habe sie erhalten und führe den GEO-Light-Test für Ihre Website durch.',
        'Dafür stelle ich acht gezielte Fragen live an ChatGPT und Perplexity und prüfe, ob Ihr Unternehmen genannt wird. Das Ergebnis mit einer ehrlichen Einschätzung erhalten Sie innerhalb von 48 Stunden per E-Mail.',
        'Der Test ist kostenlos und unverbindlich. Bei Fragen antworten Sie einfach auf diese E-Mail.',
      ],
    },
    request: {
      subject: 'Ihre Anfrage ist angekommen — Zbinden Software',
      body: [
        'vielen Dank für Ihre Anfrage. Ich habe sie erhalten und melde mich innerhalb von 1–2 Werktagen persönlich bei Ihnen.',
        'Wenn Sie lieber gleich einen Termin festlegen möchten, können Sie direkt ein Gespräch buchen.',
      ],
      cta: 'Gespräch buchen — 30 Min., unverbindlich',
    },
    regards: 'Freundliche Grüsse,',
    geo: { label: 'Zbinden Software — GEO-Audit: Ist Ihr Unternehmen für KI sichtbar?', url: 'https://www.zbinden.online/geo-audit' },
    ki: { label: 'Zbinden Software — KI-Agenten & Prozessautomatisierung', url: 'https://www.zbinden.online/ki-agenten-automatisierung' },
    web: { label: 'Zbinden Software — Webdesign für Schweizer KMU', url: 'https://www.zbinden.online/webdesign' },
    why: 'Sie erhalten diese E-Mail, weil auf zbinden.online eine Anfrage mit dieser Adresse gestellt wurde.',
  },
  fr: {
    hi: 'Bonjour,',
    geoLight: {
      subject: 'Votre test GEO-Light est demandé — Zbinden Software',
      body: [
        'merci pour votre demande. Je l’ai bien reçue et je réalise le test GEO-Light pour votre site.',
        'Je pose huit questions ciblées en direct à ChatGPT et à Perplexity et je vérifie si votre entreprise est citée. Vous recevrez le résultat, avec une évaluation honnête, par e-mail dans les 48 heures.',
        'Le test est gratuit et sans engagement. Pour toute question, répondez simplement à cet e-mail.',
      ],
    },
    request: {
      subject: 'Votre demande est bien arrivée — Zbinden Software',
      body: [
        'merci pour votre demande. Je l’ai bien reçue et je vous réponds personnellement sous 1 à 2 jours ouvrables.',
        'Si vous préférez fixer un rendez-vous tout de suite, vous pouvez réserver directement un appel.',
      ],
      cta: 'Réserver un appel — 30 min, sans engagement',
    },
    regards: 'Meilleures salutations,',
    geo: { label: 'Zbinden Software — Audit GEO : votre entreprise est-elle visible pour l’IA ?', url: 'https://www.zbinden.online/fr/geo-audit' },
    ki: { label: 'Zbinden Software — Agents IA & automatisation des processus', url: 'https://www.zbinden.online/fr/ki-agenten-automatisierung' },
    web: { label: 'Zbinden Software — Création de sites web pour PME suisses', url: 'https://www.zbinden.online/fr/webdesign' },
    why: 'Vous recevez cet e-mail parce qu’une demande a été envoyée avec cette adresse sur zbinden.online.',
  },
  en: {
    hi: 'Hello,',
    geoLight: {
      subject: 'Your GEO-Light test is requested — Zbinden Software',
      body: [
        'Thank you for your request. I have received it and will run the GEO-Light test for your website.',
        'I ask eight targeted questions live to ChatGPT and Perplexity and check whether your business is mentioned. You will receive the result, with an honest assessment, by email within 48 hours.',
        'The test is free and without obligation. If you have any questions, simply reply to this email.',
      ],
    },
    request: {
      subject: 'Your request has arrived — Zbinden Software',
      body: [
        'Thank you for your request. I have received it and will get back to you personally within 1–2 working days.',
        'If you would rather fix a time straight away, you can book a call directly.',
      ],
      cta: 'Book a call — 30 min, no commitment',
    },
    regards: 'Kind regards,',
    geo: { label: 'Zbinden Software — GEO Audit: Is your business visible to AI?', url: 'https://www.zbinden.online/en/geo-audit' },
    ki: { label: 'Zbinden Software — AI Agents & Process Automation', url: 'https://www.zbinden.online/en/ki-agenten-automatisierung' },
    web: { label: 'Zbinden Software — Web design for Swiss SMEs', url: 'https://www.zbinden.online/en/webdesign' },
    why: 'You are receiving this email because a request was sent with this address on zbinden.online.',
  },
};

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

/* Profil GEO-Light confirmé dans le formulaire (champ « profile », JSON produit par js/geo-light.js).
   Renvoie { kandidat, edited, analysis, questions } ou null. Seuls les champs connus sont gardés. */
const PROFILE_KEYS = ['lang', 'company', 'city', 'city_in', 'domain', 'person', 'person_role', 'branche',
  'welche_akk', 'welche_nom', 'quel', 'which'];

function parseProfile(raw) {
  if (!raw || typeof raw !== 'string' || raw.length > 6000) return null;
  let p;
  try { p = JSON.parse(raw); } catch (e) { return null; }
  if (!p || typeof p !== 'object') return null;
  const k = {};
  PROFILE_KEYS.forEach(function (key) {
    const v = String(p[key] == null ? '' : p[key]).trim().slice(0, 120);
    if (v || ['company', 'city', 'domain', 'person', 'branche'].includes(key)) k[key] = v;
  });
  if (!['de', 'fr', 'en'].includes(k.lang)) k.lang = 'de';
  k.offers = (Array.isArray(p.offers) ? p.offers : []).slice(0, 3).map(function (o) { return String(o || '').trim().slice(0, 120); });
  const list = function (a, n) { return (Array.isArray(a) ? a : []).slice(0, n).map(function (x) { return String(x).slice(0, 300); }); };
  return {
    kandidat: k,
    activities: list(p.activities, 4),
    chosen: String(p.chosen || '').slice(0, 60),
    chosenBy: p.chosen_by === 'visitor' ? 'visitor' : 'default',
    edited: list(p.edited, 10),
    analysis: p.analysis === 'ok' ? 'ok' : 'failed',
    questions: list(p.questions, 8),
  };
}

function profileStatus(pr) {
  if (pr.analysis !== 'ok') return 'Analyse automatique impossible — champs saisis par le visiteur (à vérifier)';
  const base = pr.edited.length ? 'Proposé par l’analyse, corrigé par le visiteur : ' + pr.edited.join(', ') : 'Proposé par l’analyse, confirmé sans modification';
  if (pr.activities.length < 2) return base;
  const pick = !pr.chosen ? 'aucun domaine choisi, secteur saisi à la main'
    : pr.chosenBy === 'visitor' ? 'domaine choisi par le visiteur : ' + pr.chosen
    : 'premier domaine gardé par le visiteur : ' + pr.chosen;
  return `${base} — plusieurs domaines (${pr.activities.join(', ')}), ${pick}`;
}

function renderProfileHtml(pr) {
  const k = pr.kandidat;
  const rows = [
    ['Statut', profileStatus(pr)],
    ['Langue des questions', k.lang],
    ['Entreprise', k.company],
    ['Lieu', k.city],
    ['Branche', k.branche],
    ['Offres', k.offers.filter(Boolean).join(' · ')],
    ['Personne', [k.person, k.person_role].filter(Boolean).join(', ')],
  ].filter(function (r) { return r[1]; })
    .map(function (r) {
      return `<tr><td style="padding:5px 14px 5px 0;color:#726a5c;vertical-align:top;white-space:nowrap;">${esc(r[0])}</td>` +
        `<td style="padding:5px 0;">${esc(r[1])}</td></tr>`;
    }).join('');
  const qs = pr.questions.map(function (q) { return `<li style="margin:0 0 4px;">${esc(q)}</li>`; }).join('');
  return (
    `<p style="margin:28px 0 10px;font-weight:600;">Profil GEO-Light</p>` +
    `<table style="border-collapse:collapse;font-size:14px;">${rows}</table>` +
    (qs ? `<p style="margin:18px 0 6px;color:#726a5c;font-size:13px;">Questions affichées au visiteur</p><ol style="margin:0;padding-left:20px;font-size:14px;">${qs}</ol>` : '') +
    `<p style="margin:18px 0 6px;color:#726a5c;font-size:13px;">kandidat.json</p>` +
    `<pre style="margin:0;padding:12px;background:#f2efe7;border-radius:8px;font-size:12px;white-space:pre-wrap;">${esc(JSON.stringify(k, null, 2))}</pre>`
  );
}

function renderProfileText(pr) {
  return [
    '', '--- Profil GEO-Light ---', profileStatus(pr), '',
    'Questions affichées au visiteur :',
  ].concat(pr.questions.map(function (q, i) { return `${i + 1}. ${q}`; }))
    .concat(['', 'kandidat.json :', JSON.stringify(pr.kandidat, null, 2)])
    .join('\n');
}

function renderHtml(d) {
  const rows = Object.keys(LABELS)
    .filter(function (k) { return d[k]; })
    .map(function (k) {
      return (
        `<tr><td style="padding:7px 14px 7px 0;color:#726a5c;vertical-align:top;white-space:nowrap;">${esc(LABELS[k])}</td>` +
        `<td style="padding:7px 0;white-space:pre-wrap;">${esc(d[k])}</td></tr>`
      );
    })
    .join('');

  return (
    `<!doctype html><html><body style="margin:0;background:#faf8f4;">` +
    `<div style="max-width:540px;margin:0 auto;padding:32px 26px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#18150f;">` +
    `<div style="font:700 15px Georgia,'Times New Roman',serif;color:#a6790f;letter-spacing:.03em;">ZBINDEN &middot; SOFTWARE</div>` +
    `<p style="margin:26px 0 18px;">Nouvelle demande depuis le site.</p>` +
    `<table style="border-collapse:collapse;font-size:14px;">${rows}</table>` +
    (d.profile ? renderProfileHtml(d.profile) : '') +
    `</div></body></html>`
  );
}

function renderText(d) {
  return Object.keys(LABELS)
    .filter(function (k) { return d[k]; })
    .map(function (k) { return `${LABELS[k]}: ${d[k]}`; })
    .join('\n') + (d.profile ? '\n' + renderProfileText(d.profile) : '');
}

function renderConfirmHtml(t, c, link) {
  const paras = c.body
    .map(function (p) { return `<p style="margin:0 0 16px;line-height:1.65;">${esc(p)}</p>`; })
    .join('');
  const cta = c.cta
    ? `<p style="margin:8px 0 0;"><a href="${CALENDLY}" style="display:inline-block;background:#c9a227;color:#1a1300;text-decoration:none;` +
      `font-weight:600;font-size:13px;padding:13px 24px;border-radius:999px;">${esc(c.cta)}</a></p>`
    : '';

  return (
    `<!doctype html><html><body style="margin:0;background:#faf8f4;">` +
    `<div style="max-width:540px;margin:0 auto;padding:32px 16px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#18150f;font-size:15px;">` +
    `<div style="background:#ffffff;border:1px solid #ece7dd;border-radius:14px;padding:34px 30px 30px;">` +
    `<div style="font:700 15px Georgia,'Times New Roman',serif;color:#a6790f;letter-spacing:.03em;">ZBINDEN &middot; SOFTWARE</div>` +
    `<p style="margin:28px 0 8px;line-height:1.65;">${esc(t.hi)}</p>` +
    paras +
    cta +
    `<div style="margin:30px 0 0;padding:22px 0 0;border-top:1px solid #ece7dd;font-size:14px;line-height:1.6;">` +
    `<p style="margin:0 0 14px;">${esc(t.regards)}</p>` +
    `<p style="margin:0;font:700 17px Georgia,'Times New Roman',serif;">Pauline Zbinden</p>` +
    `<p style="margin:2px 0 0;color:#726a5c;">Zbinden Software</p>` +
    `<p style="margin:10px 0 0;"><a href="tel:${PHONE.replace(/\s/g, '')}" style="color:#18150f;text-decoration:none;">${PHONE}</a></p>` +
    `<p style="margin:2px 0 0;"><a href="${link.url}" style="color:#a6790f;text-decoration:none;">${esc(link.label)}</a></p>` +
    `</div>` +
    `</div>` +
    `<p style="margin:16px 8px 0;font-size:11px;line-height:1.5;color:#9a9182;text-align:center;">${esc(t.why)}</p>` +
    `</div></body></html>`
  );
}

function renderConfirmText(t, c, link) {
  return [t.hi, '']
    .concat(c.body.map(function (p) { return p + '\n'; }))
    .concat(c.cta ? [`${c.cta}: ${CALENDLY}`, ''] : [])
    .concat([t.regards, '', 'Pauline Zbinden', 'Zbinden Software', PHONE, `${link.label}: ${link.url}`, '', t.why])
    .join('\n');
}

function sendMail(key, mail) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mail),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    res.status(500).json({ error: 'Mail service not configured' });
    return;
  }

  let b = req.body;
  if (typeof b === 'string') {
    try { b = JSON.parse(b); } catch (e) { b = null; }
  }
  if (!b || typeof b !== 'object') {
    res.status(400).json({ error: 'Invalid body' });
    return;
  }

  // Champ piège invisible : seuls les robots le remplissent.
  if (b._gotcha) {
    res.status(200).json({ ok: true });
    return;
  }

  const email = String(b.email || '').trim();
  const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && email.length <= 200;
  if (!validEmail) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  const data = {
    package: String(b.package || '').trim().slice(0, 100),
    website: String(b.website || '').trim().slice(0, 400),
    name: String(b.name || '').trim().slice(0, 200),
    email: email,
    company: String(b.company || '').trim().slice(0, 200),
    message: String(b.message || '').trim().slice(0, 5000),
    page: String(req.headers.referer || '').slice(0, 300),
    profile: parseProfile(b.profile),
  };

  const who = (data.website || data.name || email).replace(/[\r\n]+/g, ' ').slice(0, 120);
  const subject = `Nouvelle demande${data.package ? ' ' + data.package : ''} — ${who}`;
  const to = process.env.CONTACT_TO || 'info@zbinden.online';

  // Langue de la page d'origine (/fr/…, /en/…, sinon allemand).
  const m = /^https?:\/\/[^/]+\/(fr|en)(\/|$)/.exec(data.page);
  const t = COPY[m ? m[1] : 'de'];
  // Le formulaire GEO-Light est le seul à envoyer le champ « website ».
  const c = data.website ? t.geoLight : t.request;
  // Lien de la signature : selon l'intérêt choisi dans le formulaire, sinon selon la page d'origine.
  const topic = data.website ? 'geo' : data.package || data.page;
  const link = /geo/i.test(topic) ? t.geo : /web/i.test(topic) ? t.web : /ki-agenten/i.test(data.page) ? t.ki : t.geo;
  const stamp = Date.now();

  try {
    const r = await sendMail(key, {
      from: FROM,
      to: [to],
      reply_to: email,
      subject: subject,
      html: renderHtml(data),
      text: renderText(data),
      headers: { 'X-Entity-Ref-ID': `contact-${stamp}` },
    });

    if (!r.ok) {
      const detail = (await r.text()).slice(0, 400);
      res.status(502).json({ error: 'send failed', detail });
      return;
    }
  } catch (e) {
    res.status(502).json({ error: 'send error' });
    return;
  }

  // La demande est arrivée : un échec de la confirmation ne doit pas faire échouer le formulaire.
  try {
    await sendMail(key, {
      from: FROM,
      to: [email],
      reply_to: 'info@zbinden.online',
      subject: c.subject,
      html: renderConfirmHtml(t, c, link),
      text: renderConfirmText(t, c, link),
      headers: { 'X-Entity-Ref-ID': `contact-confirm-${stamp}` },
    });
  } catch (e) {}

  res.status(200).json({ ok: true });
}
