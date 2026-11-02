// Seitengerüst (index, datenschutz) und alle Begleitdateien (robots, sitemap, llms.txt,
// manifest, .htaccess, JSON-LD, Icon-SVG, og:image-Vorlage).

import { esc, telHref, initials } from './util.mjs';
import { icon } from './icons.mjs';
import { rundgangHtml, vorschauFormHtml, variantenHtml } from './rundgang.mjs';

const AI_BOTS = ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot', 'PerplexityBot', 'Perplexity-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai', 'Google-Extended', 'Applebot-Extended', 'CCBot'];

export function siteUrl(c) {
  return c.domain ? `https://${c.domain.replace(/^https?:\/\//, '').replace(/\/$/, '')}` : '';
}

function addressLines(f) {
  const a = f.adresse || {};
  return [a.strasse, [a.plz, a.ort].filter(Boolean).join(' ')].filter(Boolean);
}

// ---------- JSON-LD ----------
export function jsonLd(c) {
  const f = c.firma;
  const url = siteUrl(c);
  const a = f.adresse || {};
  const biz = {
    '@context': 'https://schema.org',
    '@type': f.schemaTyp || 'LocalBusiness',
    name: f.name,
    description: c.seo?.description || f.beschreibung,
    ...(url && { url, '@id': url + '/#business', image: url + '/og-image.png', logo: url + '/icon-512.png' }),
    ...(f.telefon && { telephone: telHref(f.telefon) }),
    ...(f.email && { email: f.email }),
    ...(a.strasse && {
      address: { '@type': 'PostalAddress', streetAddress: a.strasse, postalCode: a.plz, addressLocality: a.ort, addressCountry: a.land || 'CH' },
    }),
    ...((f.berufe || []).length && { jobTitle: f.berufe }),
    ...((f.region || []).length && { areaServed: f.region.map((r) => ({ '@type': 'Place', name: r })) }),
    ...((f.sameAs || []).length && { sameAs: f.sameAs }),
    ...(f.inhaber && { founder: { '@type': 'Person', name: f.inhaber } }),
    ...(f.preisniveau && { priceRange: f.preisniveau }),
    ...(f.kueche && { servesCuisine: f.kueche }),
  };
  const services = (c.sektionen || []).filter((s) => s.typ === 'leistungen').flatMap((s) => s.items || []);
  if (services.length) {
    biz.hasOfferCatalog = {
      '@type': 'OfferCatalog', name: 'Leistungen',
      itemListElement: services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.titel, description: s.text } })),
    };
  }
  const out = [biz];
  const faq = (c.sektionen || []).filter((s) => s.typ === 'faq').flatMap((s) => s.items || []);
  if (faq.length) {
    out.push({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: faq.map((q) => ({ '@type': 'Question', name: q.frage, acceptedAnswer: { '@type': 'Answer', text: q.antwort } })),
    });
  }
  // </script> in Texten unschädlich machen
  return out.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n');
}

// ---------- <head> ----------
function headTags(c, { title, description, canonicalPath, vorschau, palette, extraHead = '' }) {
  const url = siteUrl(c);
  const T = c.__t;
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${vorschau ? '<meta name="robots" content="noindex, nofollow">' : ''}
${url ? `<link rel="canonical" href="${url}${canonicalPath}">` : ''}
<meta property="og:type" content="website">
<meta property="og:locale" content="${T.ogLocale}">
<meta property="og:site_name" content="${esc(c.firma.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${url ? `<meta property="og:url" content="${url}${canonicalPath}">
<meta property="og:image" content="${url}/og-image.png">` : '<meta property="og:image" content="og-image.png">'}
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="${palette.mode === 'dark' ? palette.bg : palette.dark}">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="manifest" href="manifest.webmanifest">
<link rel="preload" href="assets/fonts/fonts.css" as="style">
<link rel="stylesheet" href="assets/fonts/fonts.css">
<link rel="stylesheet" href="assets/site.css">
<script>document.documentElement.classList.add('js')</script>
${extraHead}`;
}

function siteHeader(c, ctx, nav) {
  const f = c.firma;
  const T = c.__t;
  const cta = c.headerCta || { label: T.request, ziel: '#kontakt' };
  return `<a class="skip" href="#main">${T.skip}</a>
<header class="site-header header-${ctx.L.header}">
  <div class="wrap header-row">
    <a class="brand" href="#top" aria-label="${esc(f.name)}">
      ${c.__logo ? `<img src="${esc(c.__logo)}" alt="" class="brand-logo">` : `<span class="brand-mark" aria-hidden="true">${esc(initials(f.kurzname || f.name))}</span>`}
      <span class="brand-name">${esc(f.kurzname || f.name)}</span>
    </a>
    <nav class="nav" id="nav" aria-label="Hauptnavigation">
      <ul>${nav.map((n) => n.seite
        ? `<li><a href="${esc(n.seite)}" data-seite="${esc(n.seite)}">${esc(n.label)}</a></li>`
        : `<li><a href="#${esc(n.id)}">${esc(n.label)}</a></li>`).join('')}</ul>
      <a class="btn btn-primary nav-cta" href="${esc(cta.ziel)}">${esc(cta.label)}</a>
    </nav>
    <button class="menu-btn" type="button" aria-controls="nav" aria-expanded="false" aria-label="${T.menu}">
      <span class="i-open">${icon('menu', 22)}</span><span class="i-close">${icon('close', 22)}</span>
    </button>
  </div>
</header>`;
}

function siteFooter(c) {
  const f = c.firma;
  const T = c.__t;
  const lines = addressLines(f);
  return `<footer class="site-footer tone-dark">
  <div class="wrap footer-grid">
    <div>
      <p class="footer-name">${esc(f.name)}</p>
      ${f.slogan ? `<p class="footer-claim">${esc(f.slogan)}</p>` : ''}
    </div>
    <div class="footer-imprint" id="impressum">
      <p class="footer-label">${T.imprint}</p>
      <p>${[f.inhaber ? esc(f.inhaber) : '', ...lines.map(esc)].filter(Boolean).join('<br>')}</p>
      <p>${[f.telefon ? `<a href="tel:${telHref(f.telefon)}">${esc(f.telefon)}</a>` : '', f.email ? `<a href="mailto:${esc(f.email)}">${esc(f.email)}</a>` : ''].filter(Boolean).join('<br>')}</p>
      ${f.uid ? `<p>UID ${esc(f.uid)}</p>` : ''}
    </div>
    <div class="footer-links">
      <a href="datenschutz.html">${T.privacy}</a>
      <span>© ${new Date().getFullYear()} ${esc(f.name)}</span>
      <span class="credit">${T.madeBy} <a href="https://zbinden.online" rel="noopener">Zbinden Software</a></span>
    </div>
  </div>
</footer>`;
}

function mobileBar(c) {
  const f = c.firma;
  const T = c.__t;
  const items = [];
  if (f.telefon) items.push(`<a href="tel:${telHref(f.telefon)}">${icon('phone', 20)}<span>${T.call}</span></a>`);
  if (f.whatsapp) items.push(`<a href="https://wa.me/${telHref(f.whatsapp === true ? f.telefon : f.whatsapp).replace('+', '')}" target="_blank" rel="noopener">${icon('whatsapp', 20)}<span>${T.whatsapp}</span></a>`);
  const hasForm = (c.sektionen || []).some((s) => s.typ === 'kontakt' && s.formular !== 'keins');
  const reservation = (c.sektionen || []).some((s) => s.typ === 'kontakt' && s.formular === 'reservation');
  if (hasForm) items.push(`<a href="#kontakt" class="primary">${icon(reservation ? 'calendar' : 'chat', 20)}<span>${reservation ? T.reserve : T.request}</span></a>`);
  else if (f.email) items.push(`<a href="mailto:${esc(f.email)}" class="primary">${icon('mail', 20)}<span>${T.write}</span></a>`);
  return items.length ? `<nav class="mobile-bar" aria-label="${T.request}">${items.join('')}</nav>` : '';
}

export function indexPage(c, ctx, body, nav, vorschau) {
  const T = c.__t;
  return `<!doctype html>
<html lang="${T.htmlLang}" class="layout-${ctx.layoutId}">
<head>
${headTags(c, { title: c.seo?.title || c.firma.name, description: c.seo?.description || c.firma.beschreibung || '', canonicalPath: '/', vorschau, palette: ctx.palette, extraHead: jsonLd(c) })}
</head>
<body>
${siteHeader(c, ctx, nav)}
<main id="main">
${body}
${vorschau ? variantenHtml(c) : ''}
</main>
${siteFooter(c)}
${mobileBar(c)}
<button class="to-top" type="button" aria-label="${T.top}">${icon('up', 20)}</button>
<script src="assets/site.js" defer></script>
<script src="assets/pull-refresh.js" defer></script>
${ctx.layoutJs ? '<script src="assets/layout.js" defer></script>\n' : ''}${vorschau ? vorschauFormHtml(c.lang) + rundgangHtml(c) : ''}
</body>
</html>
`;
}

// ---------- Datenschutz (DE; FR/EN folgen bei Bedarf) ----------
export function privacyPage(c, ctx, vorschau) {
  const f = c.firma;
  const T = c.__t;
  const lines = addressLines(f);
  const hasForm = (c.sektionen || []).some((s) => s.typ === 'kontakt' && s.formular !== 'keins');
  const stand = new Date().toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });
  const body = `
<h1>Datenschutzerklärung</h1>
<p>Diese Erklärung informiert Sie darüber, welche Personendaten beim Besuch dieser Website bearbeitet werden. Sie richtet sich nach dem Schweizer Datenschutzgesetz (DSG).</p>

<h2>Verantwortlich</h2>
<p>${[esc(f.name), f.inhaber ? esc(f.inhaber) : '', ...lines.map(esc), f.email ? `<a href="mailto:${esc(f.email)}">${esc(f.email)}</a>` : ''].filter(Boolean).join('<br>')}</p>

<h2>Hosting und Server-Logdaten</h2>
<p>Diese Website wird bei der Infomaniak Network SA in Genf (Schweiz) gehostet. Beim Aufruf der Seiten speichert der Server automatisch technische Angaben wie IP-Adresse, Datum und Uhrzeit, aufgerufene Seite und Browsertyp. Diese Daten dienen ausschliesslich dem sicheren Betrieb und werden nach kurzer Zeit gelöscht.</p>
${hasForm ? `
<h2>Kontaktformular</h2>
<p>Wenn Sie uns über das Formular schreiben, werden Ihre Angaben (Name, Kontaktdaten, Nachricht${(c.sektionen || []).some((s) => s.formular === 'reservation') ? ', gewünschtes Datum und Anzahl Personen' : ''}) per E-Mail an uns übermittelt, um Ihre Anfrage zu beantworten. Für den Versand nutzen wir den E-Mail-Dienst Resend (Resend, Inc., USA). Die Daten werden auf dieser Website nicht gespeichert. Die E-Mail bewahren wir auf, solange es für die Bearbeitung Ihrer Anfrage nötig ist.</p>` : ''}

<h2>Keine Cookies, kein Tracking</h2>
<p>Diese Website setzt keine Cookies und verwendet keine Analyse- oder Werbedienste. Schriften und alle übrigen Dateien werden direkt von unserem Server geladen, es werden keine Daten an Google oder andere Drittanbieter übertragen.</p>

<h2>Externe Links</h2>
<p>Links zu WhatsApp, Google Maps oder anderen Diensten öffnen deren Angebote. Für die dortige Datenbearbeitung gelten die Bestimmungen der jeweiligen Anbieter.</p>

<h2>Ihre Rechte</h2>
<p>Sie können jederzeit Auskunft über Ihre bei uns gespeicherten Daten verlangen sowie deren Berichtigung oder Löschung beantragen. Schreiben Sie uns dazu an die oben genannte Adresse.</p>

<p class="note">Stand: ${stand}</p>`;
  return `<!doctype html>
<html lang="${T.htmlLang}" class="layout-${ctx.layoutId}">
<head>
${headTags(c, { title: `${T.privacy} – ${f.name}`, description: `${T.privacy} von ${f.name}`, canonicalPath: '/datenschutz', vorschau, palette: ctx.palette })}
</head>
<body class="page-legal">
<header class="site-header header-${ctx.L.header === 'overlay' ? 'dark' : ctx.L.header}">
  <div class="wrap header-row">
    <a class="brand" href="./">${c.__logo ? `<img src="${esc(c.__logo)}" alt="" class="brand-logo">` : `<span class="brand-mark" aria-hidden="true">${esc(initials(f.kurzname || f.name))}</span>`}<span class="brand-name">${esc(f.kurzname || f.name)}</span></a>
  </div>
</header>
<main id="main" class="wrap narrow legal">${body}
<p><a class="btn btn-ghost" href="./">← ${esc(f.kurzname || f.name)}</a></p>
</main>
${siteFooter(c)}
<script src="assets/site.js" defer></script>
</body>
</html>
`;
}

// ---------- Begleitdateien ----------
export function robotsTxt(c, vorschau) {
  if (vorschau) return 'User-agent: *\nDisallow: /\n';
  const url = siteUrl(c);
  return `# KI-Assistenten und Suchmaschinen sind ausdrücklich willkommen
${AI_BOTS.map((b) => `User-agent: ${b}\nAllow: /\n`).join('\n')}
User-agent: *
Allow: /
${url ? `\nSitemap: ${url}/sitemap.xml\n` : ''}`;
}

export function sitemapXml(c) {
  const url = siteUrl(c) || 'https://example.ch';
  const d = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${url}/</loc><lastmod>${d}</lastmod></url>
  <url><loc>${url}/datenschutz</loc><lastmod>${d}</lastmod></url>
</urlset>
`;
}

export function llmsTxt(c) {
  const f = c.firma;
  const url = siteUrl(c);
  const S = c.sektionen || [];
  const services = S.filter((s) => s.typ === 'leistungen').flatMap((s) => s.items || []);
  const faq = S.filter((s) => s.typ === 'faq').flatMap((s) => s.items || []);
  const lines = addressLines(f);
  let out = `# ${f.name}\n\n> ${c.seo?.description || f.beschreibung || f.slogan || ''}\n\n`;
  out += `## Kontakt\n\n`;
  if (lines.length) out += `- Adresse: ${lines.join(', ')}\n`;
  if (f.telefon) out += `- Telefon: ${f.telefon}\n`;
  if (f.email) out += `- E-Mail: ${f.email}\n`;
  if (url) out += `- Website: ${url}\n`;
  if ((f.region || []).length) out += `- Einzugsgebiet: ${f.region.join(', ')}\n`;
  if ((f.oeffnungszeiten || []).length) out += `- Öffnungszeiten: ${f.oeffnungszeiten.map((o) => `${o.tage} ${o.zeit}`).join('; ')}\n`;
  if (services.length) out += `\n## Leistungen\n\n${services.map((s) => `- **${s.titel}**: ${String(s.text || '').replace(/\s+/g, ' ')}`).join('\n')}\n`;
  if (faq.length) out += `\n## Häufige Fragen\n\n${faq.map((q) => `### ${q.frage}\n\n${q.antwort}\n`).join('\n')}`;
  if (url) out += `\n## Seiten\n\n- [Startseite](${url}/)\n- [Datenschutz](${url}/datenschutz)\n`;
  return out;
}

export function manifest(c, palette) {
  const f = c.firma;
  return JSON.stringify({
    name: f.name,
    short_name: (f.kurzname || f.name).slice(0, 12),
    start_url: './',
    scope: './',
    display: 'standalone',
    background_color: palette.bg,
    theme_color: palette.mode === 'dark' ? palette.bg : palette.dark,
    icons: [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  }, null, 2);
}

export function htaccess(vorschau) {
  return `# Infomaniak (Apache) – generiert vom Starter-Kit
RewriteEngine On

# Immer HTTPS, ohne www
RewriteCond %{HTTPS} off [OR]
RewriteCond %{HTTP_HOST} ^www\\. [NC]
RewriteCond %{HTTP_HOST} ^(?:www\\.)?(.+)$ [NC]
RewriteRule ^ https://%1%{REQUEST_URI} [R=301,L]

# Formular: /api/anfrage → PHP
RewriteRule ^api/anfrage$ api/anfrage.php [L]

# Saubere Adressen: /datenschutz.html → /datenschutz
RewriteCond %{THE_REQUEST} \\s/+(.+?)\\.html[\\s?] [NC]
RewriteRule ^ /%1 [R=301,L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME}.html -f
RewriteRule ^(.+?)/?$ $1.html [L]
${vorschau ? `
# VORSCHAU: nicht indexieren – vor der Liveschaltung neu bauen ohne --vorschau
Header set X-Robots-Tag "noindex, nofollow"
` : ''}
# Interne Dateien nie ausliefern
<FilesMatch "^(anfrage-config.*\\.php|content\\.json|.*\\.mjs)$">
  Require all denied
</FilesMatch>
`;
}

// App-Icon: Initialen (oder Logo) auf Akzent/Dunkel
export function iconSvg(c, palette) {
  const txt = esc(initials(c.firma.kurzname || c.firma.name));
  const bg = palette.mode === 'dark' ? palette.surface : palette.dark;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" rx="112" fill="${bg}"/>
<rect x="72" y="388" width="368" height="14" rx="7" fill="${palette.accent}"/>
<text x="256" y="318" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="${txt.length > 1 ? 210 : 260}" font-weight="700" fill="${palette.darkInk}">${txt}</text>
</svg>
`;
}

// og:image als HTML (wird von raster.mjs in 1200×630 PNG umgewandelt)
export function ogHtml(c, palette, fontsCss, displayFont, bodyFont) {
  const f = c.firma;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontsCss}
html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{background:${palette.dark};color:${palette.darkInk};font-family:${bodyFont};display:flex;flex-direction:column;justify-content:space-between;padding:84px 96px;box-sizing:border-box}
.k{font-size:26px;letter-spacing:.18em;text-transform:uppercase;color:${palette.accent}}
h1{font-family:${displayFont};font-size:${f.name.length > 28 ? 68 : 84}px;line-height:1.05;margin:18px 0 0;max-width:980px}
p{font-size:34px;line-height:1.35;margin:0;max-width:900px;opacity:.88}
.bar{height:10px;width:180px;background:${palette.accent};border-radius:5px}
</style></head><body>
<div><div class="k">${esc(f.branche || '')}${f.adresse?.ort ? ' · ' + esc(f.adresse.ort) : ''}</div><h1>${esc(f.name)}</h1></div>
<p>${esc(f.slogan || c.hero?.titel || '')}</p>
<div class="bar"></div>
</body></html>`;
}

export function iconHtml(svg) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:512px;height:512px;overflow:hidden;background:transparent}svg{display:block;width:512px;height:512px}</style></head><body>${svg}</body></html>`;
}
