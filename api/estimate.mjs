/**
 * POST /api/estimate
 * Reçoit une estimation depuis le calculateur (pages ki-agenten-automatisierung)
 * et envoie au visiteur un e-mail « de la part de Zbinden Software » avec le PDF
 * en pièce jointe + un lien Calendly. Une copie discrète part vers info@zbinden.online.
 *
 * Aucune dépendance : appel direct de l'API REST de Resend via fetch (Node 18+).
 * Variable d'environnement requise dans Vercel : RESEND_API_KEY
 * (optionnel : ESTIMATE_BCC pour changer l'adresse de copie interne)
 */

const CALENDLY = 'https://calendly.com/zbinden-austausch';
const FROM = 'Zbinden Software <info@zbinden.online>';

const COPY = {
  fr: {
    subject: 'Votre estimation d’économies — Zbinden Software',
    filename: 'Estimation-automatisation-Zbinden.pdf',
    hi: 'Bonjour,',
    intro:
      'Merci d’avoir utilisé notre estimateur d’économies. Vous trouverez votre estimation ' +
      'récapitulée en pièce jointe (PDF), à partager en interne si besoin.',
    kSector: 'Secteur',
    kTask: 'Processus',
    kWeek: 'Temps gagné / semaine',
    kMonth: 'Économie estimée / mois',
    kYear: 'Économie estimée / an',
    disclaimer:
      'Ce sont des ordres de grandeur indicatifs, sans garantie. Le premier entretien ' +
      '(gratuit) sert justement à cadrer le processus qui vaut vraiment la peine chez vous.',
    cta: 'Réserver un appel — 30 min, sans engagement',
    outro: 'À bientôt,',
    sign: 'Pauline Zbinden · Zbinden Software',
    foot: 'info@zbinden.online · +41 79 193 68 02 · www.zbinden.online',
  },
  de: {
    subject: 'Ihre Einsparungs-Schätzung — Zbinden Software',
    filename: 'Einsparungs-Schaetzung-Zbinden.pdf',
    hi: 'Guten Tag,',
    intro:
      'Danke, dass Sie unseren Einsparungsrechner genutzt haben. Ihre Schätzung finden Sie ' +
      'als PDF im Anhang — zum internen Teilen, falls nützlich.',
    kSector: 'Branche',
    kTask: 'Prozess',
    kWeek: 'Gewonnene Zeit / Woche',
    kMonth: 'Geschätzte Einsparung / Monat',
    kYear: 'Geschätzte Einsparung / Jahr',
    disclaimer:
      'Es handelt sich um Richtwerte ohne Gewähr. Das kostenlose Erstgespräch dient dazu, ' +
      'den Prozess zu finden, der sich bei Ihnen wirklich lohnt.',
    cta: 'Gespräch buchen — 30 Min., unverbindlich',
    outro: 'Bis bald,',
    sign: 'Pauline Zbinden · Zbinden Software',
    foot: 'info@zbinden.online · +41 79 193 68 02 · www.zbinden.online',
  },
  en: {
    subject: 'Your savings estimate — Zbinden Software',
    filename: 'Savings-estimate-Zbinden.pdf',
    hi: 'Hello,',
    intro:
      'Thanks for using our savings estimator. Your estimate is summarised in the attached ' +
      'PDF — feel free to share it internally.',
    kSector: 'Industry',
    kTask: 'Process',
    kWeek: 'Time saved / week',
    kMonth: 'Estimated saving / month',
    kYear: 'Estimated saving / year',
    disclaimer:
      'These are indicative ballpark figures, not a guarantee. The free intro call is there ' +
      'to pin down the process that is genuinely worth it in your case.',
    cta: 'Book a call — 30 min, no commitment',
    outro: 'Speak soon,',
    sign: 'Pauline Zbinden · Zbinden Software',
    foot: 'info@zbinden.online · +41 79 193 68 02 · www.zbinden.online',
  },
};

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}

function renderHtml(t, d) {
  const rowsTop =
    `<tr><td style="padding:7px 0;color:#726a5c;">${esc(t.kSector)}</td>` +
    `<td style="padding:7px 0;text-align:right;font-weight:600;">${esc(d.sector)}</td></tr>` +
    `<tr><td style="padding:7px 0;color:#726a5c;">${esc(t.kTask)}</td>` +
    `<td style="padding:7px 0;text-align:right;">${esc(d.task)}</td></tr>`;
  const rowsNum =
    `<tr><td style="padding:7px 0;color:#726a5c;border-top:1px solid #ece7dd;">${esc(t.kWeek)}</td>` +
    `<td style="padding:7px 0;text-align:right;font-weight:700;border-top:1px solid #ece7dd;">${esc(d.outHours)}</td></tr>` +
    `<tr><td style="padding:7px 0;color:#726a5c;">${esc(t.kMonth)}</td>` +
    `<td style="padding:7px 0;text-align:right;font-weight:700;">${esc(d.outMonth)}</td></tr>` +
    `<tr><td style="padding:7px 0;color:#726a5c;">${esc(t.kYear)}</td>` +
    `<td style="padding:7px 0;text-align:right;font-weight:700;color:#a6790f;">${esc(d.outYear)}</td></tr>`;

  return (
    `<!doctype html><html><body style="margin:0;background:#faf8f4;">` +
    `<div style="max-width:540px;margin:0 auto;padding:32px 26px;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:#18150f;">` +
    `<div style="font:700 15px Georgia,'Times New Roman',serif;color:#a6790f;letter-spacing:.03em;">ZBINDEN &middot; SOFTWARE</div>` +
    `<p style="margin:26px 0 8px;">${esc(t.hi)}</p>` +
    `<p style="margin:0 0 22px;line-height:1.65;">${esc(t.intro)}</p>` +
    `<table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 18px;">${rowsTop}${rowsNum}</table>` +
    (d.perHead ? `<p style="margin:0 0 18px;font-size:13px;color:#18150f;">${esc(d.perHead)}</p>` : '') +
    `<p style="margin:0 0 26px;font-size:12px;color:#726a5c;line-height:1.6;">${esc(t.disclaimer)}</p>` +
    `<a href="${CALENDLY}" style="display:inline-block;background:#c9a227;color:#1a1300;text-decoration:none;` +
    `font-weight:600;font-size:13px;padding:13px 24px;border-radius:999px;">${esc(t.cta)}</a>` +
    `<p style="margin:30px 0 0;font-size:13px;line-height:1.6;">${esc(t.outro)}<br>${esc(t.sign)}<br>` +
    `<span style="color:#726a5c;">${esc(t.foot)}</span></p>` +
    `</div></body></html>`
  );
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

  const email = String(b.email || '').trim();
  const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) && email.length <= 200;
  const pdf = typeof b.pdfBase64 === 'string' ? b.pdfBase64 : '';
  if (!validEmail || !pdf || pdf.length > 8_000_000) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  const lang = b.lang === 'de' || b.lang === 'en' ? b.lang : 'fr';
  const t = COPY[lang];
  const data = {
    sector: String(b.sector || '').slice(0, 200),
    task: String(b.task || '').slice(0, 400),
    assumptions: String(b.assumptions || '').slice(0, 400),
    outHours: String(b.outHours || '').slice(0, 40),
    outMonth: String(b.outMonth || '').slice(0, 40),
    outYear: String(b.outYear || '').slice(0, 40),
    perHead: String(b.perHead || '').slice(0, 400),
  };

  const bcc = process.env.ESTIMATE_BCC || 'info@zbinden.online';

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        bcc: [bcc],
        reply_to: 'info@zbinden.online',
        subject: t.subject,
        html: renderHtml(t, data),
        headers: { 'X-Entity-Ref-ID': `estimate-${Date.now()}` },
        attachments: [{ filename: t.filename, content: pdf }],
      }),
    });

    if (!r.ok) {
      const detail = (await r.text()).slice(0, 400);
      res.status(502).json({ error: 'send failed', detail });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(502).json({ error: 'send error' });
  }
}
