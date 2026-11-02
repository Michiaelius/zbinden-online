/**
 * POST /api/website-entwurf
 * Formulaire « Kostenloser Entwurf » de la page webdesign (DE/FR/EN) : le visiteur demande une première
 * ébauche gratuite de son site (achat ou abo), avec son logo et ses couleurs. Envoie :
 *  1. la demande à info@zbinden.online (« Répondre » écrit au visiteur), avec le logo en pièce jointe
 *     et entwurf.json = tout ce qu'il faut pour la maquette (Starter-Kit : palette ou farben + logo) ;
 *  2. un e-mail de confirmation au visiteur, dans la langue de la page (texte fixe).
 *  3. si GEO_RUN_SECRET existe : lance api/mockup-run.mjs (ébauche générée → vorschau.zbinden.online,
 *     brouillon Outlook, alerte « Ébauche prête »). La notification dit si le lancement a marché.
 *
 * Corps JSON : { company, website?, message?, umfang?, email, phone?, palette, farben?: { haupt, akzent },
 *                logo?: { name, type, data (base64) }, lang, _gotcha }
 * Variable d'environnement : RESEND_API_KEY (optionnel : CONTACT_TO)
 */

const FROM = 'Zbinden Software <info@zbinden.online>';
const PHONE = '+41 79 193 68 02';
const PALETTES = ['auto', 'eigen', 'pistazie', 'schiefer', 'flamingo', 'kiwi', 'kokos', 'feige', 'glut', 'muschel', 'ozean', 'salbei'];
const UMFANG = { onepager: 'Onepager', mehrseitig: 'Plusieurs pages', offen: 'Pas encore décidé' };
const LOGO_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/svg+xml': 'svg', 'image/webp': 'webp' };
const LOGO_MAX = 2 * 1024 * 1024;

const COPY = {
  de: {
    subject: 'Ihr Website-Entwurf ist angefragt — Zbinden Software',
    hi: 'Guten Tag,',
    body: [
      'vielen Dank für Ihre Anfrage. Ich erstelle jetzt einen ersten Entwurf Ihrer Website, mit Ihrem Logo und Ihren Farben.',
      'Den Link zum Entwurf erhalten Sie innerhalb von 2 Werktagen per E-Mail. Der Entwurf ist kostenlos und unverbindlich: Sie entscheiden danach in Ruhe, ob Sie die Website mieten oder kaufen möchten.',
      'Bei Fragen antworten Sie einfach auf diese E-Mail.',
    ],
    regards: 'Freundliche Grüsse,',
    link: { label: 'Zbinden Software — Webdesign für Schweizer KMU', url: 'https://www.zbinden.online/webdesign' },
    why: 'Sie erhalten diese E-Mail, weil auf zbinden.online eine Anfrage mit dieser Adresse gestellt wurde.',
  },
  fr: {
    subject: 'Votre ébauche de site est demandée — Zbinden Software',
    hi: 'Bonjour,',
    body: [
      'merci pour votre demande. Je prépare maintenant une première ébauche de votre site, avec votre logo et vos couleurs.',
      'Vous recevrez le lien par e-mail dans les 2 jours ouvrables. L’ébauche est gratuite et sans engagement : vous décidez ensuite tranquillement si vous souhaitez louer ou acheter le site.',
      'Pour toute question, répondez simplement à cet e-mail.',
    ],
    regards: 'Meilleures salutations,',
    link: { label: 'Zbinden Software — Sites web pour PME suisses', url: 'https://www.zbinden.online/fr/webdesign' },
    why: 'Vous recevez cet e-mail parce qu’une demande a été faite avec cette adresse sur zbinden.online.',
  },
  en: {
    subject: 'Your website draft is on its way — Zbinden Software',
    hi: 'Hello,',
    body: [
      'thank you for your request. I am now preparing a first draft of your website, with your logo and your colours.',
      'You will receive the link by e-mail within 2 working days. The draft is free and without obligation: afterwards you decide in your own time whether to rent or buy the website.',
      'If you have any questions, simply reply to this e-mail.',
    ],
    regards: 'Kind regards,',
    link: { label: 'Zbinden Software — Websites for Swiss SMEs', url: 'https://www.zbinden.online/en/webdesign' },
    why: 'You are receiving this e-mail because a request was made with this address on zbinden.online.',
  },
};

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function str(v, max) { return String(v == null ? '' : v).trim().slice(0, max); }
function isHex(v) { return /^#[0-9a-f]{6}$/i.test(String(v || '')); }
function slug(s) {
  return String(s).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'kunde';
}

function parseLogo(l) {
  if (!l || typeof l !== 'object') return null;
  const ext = LOGO_TYPES[l.type];
  const data = String(l.data || '').replace(/^data:[^,]*,/, '');
  if (!ext || !/^[A-Za-z0-9+/=]+$/.test(data)) return null;
  if (Math.floor(data.length * 3 / 4) > LOGO_MAX) return null;
  return { ext, type: l.type, data, name: str(l.name, 120) };
}

function sendMail(key, mail) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(mail),
  });
}

function rows(d) {
  return [
    ['Entreprise & lieu', d.company],
    ['Site actuel', d.website],
    ['Offre (texte du visiteur)', d.message],
    ['Ampleur', UMFANG[d.umfang] || ''],
    ['Couleurs', d.palette === 'eigen' ? `propres : ${d.farben.haupt} / ${d.farben.akzent}${d.farbenAusLogo ? ' (lues dans le logo)' : ''}` : d.palette === 'auto' ? 'au choix (selon la branche)' : `palette ${d.palette}`],
    ['Logo', d.logo ? `oui (${d.logo.name || 'logo.' + d.logo.ext}), en pièce jointe` : 'non'],
    ['E-mail', d.email],
    ['Téléphone', d.phone],
    ['Langue', d.lang],
  ].filter(function (r) { return r[1]; });
}

/* Ébauche automatique (api/mockup-run.mjs). Renvoie la ligne de statut affichée dans la notification. */
async function startMockupRun(req, brief, logo) {
  const secret = process.env.GEO_RUN_SECRET;
  if (!secret) return '';
  try {
    const r = await fetch(`https://${req.headers.host}/api/mockup-run`, {
      method: 'POST',
      signal: AbortSignal.timeout(8000),
      headers: { 'Content-Type': 'application/json', 'x-geo-secret': secret },
      body: JSON.stringify({ brief, logo: logo ? { ext: logo.ext, data: logo.data } : null, source: 'form' }),
    });
    if (r.status === 202) {
      const j = await r.json().catch(function () { return {}; });
      return `Ébauche automatique lancée : ${j.url || 'vorschau.zbinden.online'} et brouillon de réponse dans custom-software@ d’ici 2 à 4 minutes, avec une alerte ici.`;
    }
    return `Ébauche automatique non lancée (erreur ${r.status}) : à faire à la main avec entwurf.json.`;
  } catch (e) {
    return 'Ébauche automatique non lancée (pas de réponse) : à faire à la main avec entwurf.json.';
  }
}

function renderHtml(d, brief, status) {
  const swatch = d.palette === 'eigen'
    ? `<p style="margin:0 0 18px;"><span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:${d.farben.haupt};vertical-align:middle;"></span>` +
      `<span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:${d.farben.akzent};vertical-align:middle;margin-left:6px;"></span></p>`
    : '';
  return (
    `<!doctype html><html><body style="margin:0;background:#faf8f4;">` +
    `<div style="max-width:560px;margin:0 auto;padding:32px 26px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#18150f;">` +
    `<div style="font:700 15px Georgia,'Times New Roman',serif;color:#a6790f;letter-spacing:.03em;">ZBINDEN &middot; SOFTWARE</div>` +
    `<p style="margin:26px 0 18px;">Nouvelle demande <strong>Kostenloser Entwurf</strong> : ébauche gratuite à préparer (promis au visiteur : lien sous 2 jours ouvrables).</p>` +
    swatch +
    (status ? `<p style="margin:0 0 18px;padding:10px 12px;background:#eef3f5;border-radius:8px;">${esc(status)}</p>` : '') +
    `<table style="border-collapse:collapse;font-size:14px;">` +
    rows(d).map(function (r) {
      return `<tr><td style="padding:7px 14px 7px 0;color:#726a5c;vertical-align:top;white-space:nowrap;">${esc(r[0])}</td><td style="padding:7px 0;white-space:pre-wrap;">${esc(r[1])}</td></tr>`;
    }).join('') +
    `</table>` +
    `<p style="margin:24px 0 6px;font-size:13px;color:#726a5c;">entwurf.json (pour la maquette, en pièce jointe) :</p>` +
    `<pre style="margin:0;padding:12px;background:#f2efe7;border-radius:8px;font-size:12px;white-space:pre-wrap;">${esc(JSON.stringify(brief, null, 2))}</pre>` +
    `</div></body></html>`
  );
}

function renderConfirmHtml(t) {
  return (
    `<!doctype html><html><body style="margin:0;background:#faf8f4;">` +
    `<div style="max-width:540px;margin:0 auto;padding:32px 16px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#18150f;font-size:15px;">` +
    `<div style="background:#ffffff;border:1px solid #ece7dd;border-radius:14px;padding:34px 30px 30px;">` +
    `<div style="font:700 15px Georgia,'Times New Roman',serif;color:#a6790f;letter-spacing:.03em;">ZBINDEN &middot; SOFTWARE</div>` +
    `<p style="margin:28px 0 8px;line-height:1.65;">${esc(t.hi)}</p>` +
    t.body.map(function (p) { return `<p style="margin:0 0 16px;line-height:1.65;">${esc(p)}</p>`; }).join('') +
    `<div style="margin:30px 0 0;padding:22px 0 0;border-top:1px solid #ece7dd;font-size:14px;line-height:1.6;">` +
    `<p style="margin:0 0 14px;">${esc(t.regards)}</p>` +
    `<p style="margin:0;font:700 17px Georgia,'Times New Roman',serif;">Pauline Zbinden</p>` +
    `<p style="margin:2px 0 0;color:#726a5c;">Zbinden Software</p>` +
    `<p style="margin:10px 0 0;"><a href="tel:${PHONE.replace(/\s/g, '')}" style="color:#18150f;text-decoration:none;">${PHONE}</a></p>` +
    `<p style="margin:2px 0 0;"><a href="${t.link.url}" style="color:#a6790f;text-decoration:none;">${esc(t.link.label)}</a></p>` +
    `</div></div>` +
    `<p style="margin:16px 8px 0;font-size:11px;line-height:1.5;color:#9a9182;text-align:center;">${esc(t.why)}</p>` +
    `</div></body></html>`
  );
}

function renderConfirmText(t) {
  return [t.hi, ''].concat(t.body.map(function (p) { return p + '\n'; }))
    .concat([t.regards, '', 'Pauline Zbinden', 'Zbinden Software', PHONE, `${t.link.label}: ${t.link.url}`, '', t.why])
    .join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const key = process.env.RESEND_API_KEY;
  if (!key) { res.status(500).json({ error: 'Mail service not configured' }); return; }

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== 'object') { res.status(400).json({ error: 'Invalid body' }); return; }
  if (b._gotcha) { res.status(200).json({ ok: true }); return; }

  const email = str(b.email, 200);
  const company = str(b.company, 200);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !company) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  const d = {
    company,
    email,
    website: str(b.website, 400),
    message: str(b.message, 3000),
    phone: str(b.phone, 60),
    umfang: UMFANG[b.umfang] ? b.umfang : 'offen',
    palette: PALETTES.includes(b.palette) ? b.palette : 'auto',
    farben: null,
    farbenAusLogo: !!b.farbenAusLogo,
    logo: parseLogo(b.logo),
    lang: ['de', 'fr', 'en'].includes(b.lang) ? b.lang : 'de',
  };
  if (b.logo && !d.logo) { res.status(400).json({ error: 'Invalid logo' }); return; }
  if (d.palette === 'eigen') {
    if (b.farben && isHex(b.farben.haupt) && isHex(b.farben.akzent)) d.farben = { haupt: b.farben.haupt.toLowerCase(), akzent: b.farben.akzent.toLowerCase() };
    else d.palette = 'auto';
  }

  const stem = slug(company);
  // Brief pour le Starter-Kit / mockup-run : palette OU farben, logo à côté du content.json
  const brief = {
    firma: company,
    website: d.website || null,
    angebot: d.message || null,
    umfang: d.umfang,
    lang: d.lang,
    palette: d.palette === 'auto' || d.palette === 'eigen' ? null : d.palette,
    farben: d.farben,
    logo: d.logo ? `logo-${stem}.${d.logo.ext}` : null,
    kontakt: { email: d.email, telefon: d.phone || null },
    eingegangen: new Date().toISOString(),
  };

  const attachments = [{ filename: `entwurf-${stem}.json`, content: Buffer.from(JSON.stringify(brief, null, 2)).toString('base64') }];
  if (d.logo) attachments.push({ filename: brief.logo, content: d.logo.data });

  const status = await startMockupRun(req, brief, d.logo);
  const stamp = Date.now();
  try {
    const r = await sendMail(key, {
      from: FROM,
      to: [process.env.CONTACT_TO || 'info@zbinden.online'],
      reply_to: email,
      subject: `Nouvelle demande Entwurf — ${company.replace(/[\r\n]+/g, ' ').slice(0, 120)}`,
      html: renderHtml(d, brief, status),
      text: rows(d).map(function (r) { return `${r[0]}: ${r[1]}`; }).join('\n') + '\n\nentwurf.json :\n' + JSON.stringify(brief, null, 2),
      attachments,
      headers: { 'X-Entity-Ref-ID': `entwurf-${stamp}` },
    });
    if (!r.ok) {
      res.status(502).json({ error: 'send failed', detail: (await r.text()).slice(0, 400) });
      return;
    }
  } catch (e) {
    res.status(502).json({ error: 'send error' });
    return;
  }

  // La demande est arrivée : un échec de la confirmation ne fait pas échouer le formulaire.
  const t = COPY[d.lang];
  try {
    await sendMail(key, {
      from: FROM,
      to: [email],
      reply_to: 'info@zbinden.online',
      subject: t.subject,
      html: renderConfirmHtml(t),
      text: renderConfirmText(t),
      headers: { 'X-Entity-Ref-ID': `entwurf-confirm-${stamp}` },
    });
  } catch (e) {}

  res.status(200).json({ ok: true });
}
