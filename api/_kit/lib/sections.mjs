// Sektionen der One-Page. Jede Funktion erhält (s, ctx) und gibt HTML zurück.
//   s   = Eintrag aus content.sektionen (bzw. content.hero)
//   ctx = { c: ganzer Inhalt, L: Layout, t: UI-Texte, img(src) → Pfad, artKind }
// Alle Texte werden escaped; Absätze mit Leerzeile trennen.

import { esc, paras, telHref } from './util.mjs';
import { icon } from './icons.mjs';
import { art } from './art.mjs';

// Ton der Sektion: hell (bg), flaeche (surface), dunkel (dark), akzent (accent)
const TONE = { hell: 'tone-bg', flaeche: 'tone-surface', dunkel: 'tone-dark', akzent: 'tone-accent' };

// Werkkatalog ohne Fotos: wechselnde Grafiken, damit die Platzhalter nicht alle gleich aussehen
const WORK_ART = ['circles', 'arches', 'lines', 'blocks'];

function open(s, typ, ctx, extra = '') {
  const id = s.id ? ` id="${esc(s.id)}"` : '';
  const tone = TONE[s.ton] || TONE[ctx.defaultTone[typ]] || 'tone-bg';
  return `<section${id} class="sec sec-${typ} ${tone}${extra ? ' ' + extra : ''}">`;
}

function head(s, center = false) {
  if (!s.kicker && !s.titel && !s.intro) return '';
  return `<header class="sec-head${center ? ' center' : ''} reveal">
  ${s.kicker ? `<span class="kicker">${esc(s.kicker)}</span>` : ''}
  ${s.titel ? `<h2>${esc(s.titel)}</h2>` : ''}
  ${s.intro ? paras(s.intro, 'lead') : ''}
</header>`;
}

function btn(b, cls = 'btn') {
  if (!b || !b.label) return '';
  return `<a class="${cls}" href="${esc(b.ziel || '#kontakt')}">${esc(b.label)}</a>`;
}

function picture(bild, ctx, cls, artSeed) {
  if (bild && bild.src) {
    return `<img class="${cls}" src="${esc(ctx.img(bild.src))}" alt="${esc(bild.alt || '')}" loading="lazy" decoding="async">`;
  }
  return `<div class="${cls} art-wrap">${art(ctx.artKind, artSeed, bild?.alt || '')}</div>`;
}

// ---------------- Hero ----------------
export function hero(h, ctx) {
  const { L, c } = ctx;
  const points = (h.punkte || []).length
    ? `<ul class="hero-points">${h.punkte.map((p) => `<li>${icon('check', 18)}<span>${esc(p)}</span></li>`).join('')}</ul>` : '';
  const actions = `<div class="hero-actions">${btn(h.cta, 'btn btn-primary')}${btn(h.cta2, 'btn btn-ghost')}</div>`;
  const text = `
    ${h.kicker ? `<span class="kicker">${esc(h.kicker)}</span>` : ''}
    <h1>${esc(h.titel)}</h1>
    ${h.text ? paras(h.text, 'lead') : ''}
    ${actions}
    ${points}`;

  if (L.hero === 'photo') {
    return `<section class="hero hero-photo" id="top">
  ${picture(h.bild, ctx, 'hero-media', c.firma.name + 'hero')}
  <div class="hero-shade"></div>
  <div class="hero-text wrap">${text}</div>
</section>`;
  }
  if (L.hero === 'center') {
    return `<section class="hero hero-center" id="top">
  <div class="wrap hero-inner reveal">${text}</div>
  ${h.bild?.src ? `<div class="wrap hero-band">${picture(h.bild, ctx, 'hero-media', c.firma.name)}</div>` : ''}
</section>`;
  }
  if (L.hero === 'editorial') {
    return `<section class="hero hero-editorial" id="top">
  <div class="wrap hero-grid">
    <div class="hero-text reveal">${text}</div>
    ${picture(h.bild, ctx, 'hero-media', c.firma.name + 'hero')}
  </div>
</section>`;
  }
  // split
  return `<section class="hero hero-split" id="top">
  <div class="wrap hero-grid">
    <div class="hero-text reveal">${text}</div>
    ${picture(h.bild, ctx, 'hero-media', c.firma.name + 'hero')}
  </div>
</section>`;
}

// ---------------- Inhaltssektionen ----------------
const R = {
  zitat(s, ctx) {
    return `${open(s, 'zitat', ctx)}
  <div class="wrap narrow center reveal">
    <span class="rule" aria-hidden="true"></span>
    <blockquote class="quote">${esc(s.text)}</blockquote>
    ${s.autor ? `<p class="quote-by">${esc(s.autor)}</p>` : ''}
    <span class="rule" aria-hidden="true"></span>
  </div>
</section>`;
  },

  leistungen(s, ctx) {
    const items = s.items || [];
    return `${open(s, 'leistungen', ctx)}
  <div class="wrap">
    ${head(s)}
    <ul class="cards cards-${items.length >= 4 && items.length % 3 !== 0 ? 2 : 3}">
      ${items.map((it) => `<li class="card reveal">
        ${it.icon ? `<span class="card-icon">${icon(it.icon, 28)}</span>` : ''}
        <h3>${esc(it.titel)}</h3>
        ${paras(it.text)}
        ${it.preis ? `<p class="price">${esc(it.preis)}</p>` : ''}
      </li>`).join('\n')}
    </ul>
    ${btn(s.cta, 'btn btn-primary sec-cta')}
  </div>
</section>`;
  },

  split(s, ctx) {
    return `${open(s, 'split', ctx, s.umgekehrt ? 'reverse' : '')}
  <div class="split-grid">
    ${picture(s.bild, ctx, 'split-media', (s.titel || '') + 'split')}
    <div class="split-text reveal">
      ${s.kicker ? `<span class="kicker">${esc(s.kicker)}</span>` : ''}
      ${s.titel ? `<h2>${esc(s.titel)}</h2>` : ''}
      ${paras(s.text)}
      ${(s.punkte || []).length ? `<ul class="checks">${s.punkte.map((p) => `<li>${icon('check', 18)}<span>${esc(p)}</span></li>`).join('')}</ul>` : ''}
      ${btn(s.cta, 'btn btn-link')}
    </div>
  </div>
</section>`;
  },

  band(s, ctx) {
    return `${open(s, 'band', ctx, 'tone-dark')}
  ${picture(s.bild, ctx, 'band-media', (s.titel || '') + 'band')}
  <div class="band-shade"></div>
  <div class="wrap band-text reveal">
    ${s.kicker ? `<span class="kicker">${esc(s.kicker)}</span>` : ''}
    <h2>${esc(s.titel)}</h2>
    ${paras(s.text)}
    ${btn(s.cta, 'btn btn-primary')}
  </div>
</section>`;
  },

  ablauf(s, ctx) {
    const steps = s.schritte || [];
    return `${open(s, 'ablauf', ctx)}
  <div class="wrap">
    ${head(s)}
    <ol class="steps steps-${Math.min(steps.length, 4)}">
      ${steps.map((st, i) => `<li class="step reveal">
        <span class="step-no" aria-hidden="true">${i + 1}</span>
        <h3>${esc(st.titel)}</h3>
        ${paras(st.text)}
      </li>`).join('\n')}
    </ol>
  </div>
</section>`;
  },

  ueber(s, ctx) {
    return `${open(s, 'ueber', ctx)}
  <div class="wrap about-grid">
    ${picture(s.bild, ctx, 'about-media', (s.titel || '') + 'about')}
    <div class="about-text reveal">
      ${s.kicker ? `<span class="kicker">${esc(s.kicker)}</span>` : ''}
      <h2>${esc(s.titel)}</h2>
      ${paras(s.text)}
      ${(s.punkte || []).length ? `<ul class="checks">${s.punkte.map((p) => `<li>${icon('check', 18)}<span>${esc(p)}</span></li>`).join('')}</ul>` : ''}
      ${s.signatur ? `<p class="signature">${esc(s.signatur)}</p>` : ''}
    </div>
  </div>
</section>`;
  },

  // Mit titel/preis pro Bild wird daraus ein Werkkatalog (Kunst, Produkte):
  // gleichmässiges Raster, Legende darunter, Link «Anfragen» zum Kontakt.
  galerie(s, ctx) {
    const pics = s.bilder || [];
    const werke = pics.some((b) => b.titel);
    // Umbruch nur zwischen den «·»-Teilen, nie in «60 × 80 cm» oder «650 €»
    const info = (t) => String(t).split(/\s+·\s+/).map((p) => `<span class="nw">${esc(p)}</span>`).join(' · ');
    const caption = (b) => `<figcaption>
        <span class="work-title">${esc(b.titel)}</span>
        ${b.info ? `<span class="work-info">${info(b.info)}</span>` : ''}
        <span class="work-meta">${b.preis || b.verkauft ? `<span class="work-price${b.verkauft ? ' sold' : ''}">${esc(b.verkauft ? (b.verkauft === true ? s.verkauftLabel || 'Verkauft' : b.verkauft) : b.preis)}</span>` : ''}${b.verkauft ? '' : btn({ label: s.anfrageLabel || 'Anfragen', ziel: '#kontakt' }, 'work-ask')}</span>
      </figcaption>`;
    return `${open(s, 'galerie', ctx)}
  <div class="wrap">
    ${head(s, true)}
    <div class="gallery${werke ? ' works' : ''}">
      ${pics.map((b, i) => `<figure class="reveal${!werke && i % 5 === 0 ? ' tall' : ''}">${picture(b, werke ? { ...ctx, artKind: WORK_ART[i % WORK_ART.length] } : ctx, 'gallery-media', (s.id || '') + 'g' + i)}${werke && b.titel ? caption(b) : ''}</figure>`).join('\n')}
    </div>
    ${btn(s.cta, 'btn btn-ghost sec-cta gallery-cta')}
    ${s.hinweis ? `<p class="note center">${esc(s.hinweis)}</p>` : ''}
  </div>
</section>`;
  },

  // Produkt-Vorschau: ein Motiv auf Kunstdruck, T-Shirt, Tasse, Tasche (SVG-Mockups, keine Fotos nötig)
  produkte(s, ctx) {
    const items = s.items || [];
    return `${open(s, 'produkte', ctx)}
  <div class="wrap">
    ${head(s, true)}
    <ul class="products">
      ${items.map((it, i) => `<li class="product reveal">
        ${productSvg(it.produkt, ctx.img(it.bild?.src || ''), `p${i}`, `${it.titel || ''}${it.motiv ? ' mit Motiv ' + it.motiv : ''}`)}
        <h3>${esc(it.titel || '')}</h3>
        ${it.motiv ? `<p class="product-motif">${esc(s.motivLabel || 'Motiv')}: ${esc(it.motiv)}</p>` : ''}
      </li>`).join('\n')}
    </ul>
    ${s.text ? `<div class="products-text center">${paras(s.text)}</div>` : ''}
    ${btn(s.cta, 'btn btn-primary sec-cta products-cta')}
    ${s.hinweis ? `<p class="note center">${esc(s.hinweis)}</p>` : ''}
  </div>
</section>`;
  },

  stimmen(s, ctx) {
    const items = s.items || [];
    return `${open(s, 'stimmen', ctx)}
  <div class="wrap">
    ${head(s, true)}
    <ul class="reviews">
      ${items.map((r) => `<li class="review reveal">
        ${r.sterne ? `<span class="stars" aria-label="${r.sterne} von 5">${icon('star', 16).repeat(Math.min(5, r.sterne))}</span>` : ''}
        <blockquote>${esc(r.text)}</blockquote>
        <span class="review-by">${esc(r.name)}</span>
      </li>`).join('\n')}
    </ul>
    ${s.hinweis ? `<p class="note center">${esc(s.hinweis)}</p>` : ''}
  </div>
</section>`;
  },

  region(s, ctx) {
    const places = s.orte || [];
    return `${open(s, 'region', ctx)}
  <div class="wrap region-grid">
    <div class="reveal">
      ${s.kicker ? `<span class="kicker">${esc(s.kicker)}</span>` : ''}
      <h2>${esc(s.titel)}</h2>
      ${paras(s.text)}
    </div>
    <ul class="places reveal">${places.map((o) => `<li>${icon('pin', 18)}<span>${esc(o)}</span></li>`).join('')}</ul>
  </div>
</section>`;
  },

  faq(s, ctx) {
    const items = s.items || [];
    return `${open(s, 'faq', ctx)}
  <div class="wrap narrow">
    ${head(s, true)}
    <div class="faq-list">
      ${items.map((q) => `<details class="faq-item reveal">
        <summary><span>${esc(q.frage)}</span><span class="faq-plus" aria-hidden="true"></span></summary>
        <div class="faq-a">${paras(q.antwort)}</div>
      </details>`).join('\n')}
    </div>
  </div>
</section>`;
  },

  kontakt(s, ctx) {
    const { c, t } = ctx;
    const f = c.firma;
    const tel = f.telefon ? telHref(f.telefon) : '';
    const wa = f.whatsapp ? `https://wa.me/${telHref(f.whatsapp === true ? f.telefon : f.whatsapp).replace('+', '')}` : '';
    const adr = f.adresse ? [f.adresse.strasse, [f.adresse.plz, f.adresse.ort].filter(Boolean).join(' ')].filter(Boolean) : [];
    const mapQ = adr.length ? `https://maps.google.com/?q=${encodeURIComponent(f.name + ', ' + adr.join(', '))}` : '';

    const direct = `<div class="direct reveal">
      <h3>${esc(s.direktTitel || t.contactDirect)}</h3>
      <ul class="direct-list">
        ${tel ? `<li><a href="tel:${tel}">${icon('phone', 20)}<span>${esc(f.telefon)}</span></a></li>` : ''}
        ${wa ? `<li><a href="${wa}" target="_blank" rel="noopener">${icon('whatsapp', 20)}<span>${t.whatsapp}</span></a></li>` : ''}
        ${f.email ? `<li><a href="mailto:${esc(f.email)}">${icon('mail', 20)}<span>${esc(f.email)}</span></a></li>` : ''}
        ${adr.length ? `<li><a href="${mapQ}" target="_blank" rel="noopener">${icon('pin', 20)}<span>${adr.map(esc).join('<br>')}</span></a></li>` : ''}
      </ul>
      ${(f.oeffnungszeiten || []).length ? `<div class="hours"><h4>${icon('clock', 18)} ${t.hours}</h4><dl>${f.oeffnungszeiten.map((o) => `<dt>${esc(o.tage)}</dt><dd>${esc(o.zeit)}</dd>`).join('')}</dl></div>` : ''}
    </div>`;

    const form = s.formular === 'keins' ? '' : contactForm(s.formular === 'reservation' ? 'reservation' : 'kontakt', ctx);
    return `${open(s, 'kontakt', ctx)}
  <div class="wrap">
    ${head(s)}
    <div class="contact-grid${form ? '' : ' single'}">
      ${form}
      ${direct}
    </div>
  </div>
</section>`;
  },
};

// Einfache Produkt-Silhouetten (viewBox 400×400). Das Motiv wird in die Druckfläche geschnitten,
// darüber liegt eine Schattierung, damit es wie gedruckt wirkt.
function productSvg(kind, src, id, label) {
  const pic = (x, y, w, h, extra = '') => src
    ? `<image href="${esc(src)}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id}c)"${extra}/>`
    : '';
  const P = {
    druck: `<rect x="92" y="34" width="216" height="310" fill="#1d1b19"/>
      <rect x="102" y="44" width="196" height="290" fill="#fbfaf7"/>
      <clipPath id="${id}c"><rect x="128" y="74" width="144" height="210"/></clipPath>${pic(128, 74, 144, 210)}
      <rect x="102" y="44" width="196" height="290" fill="url(#${id}g)"/>`,
    tshirt: `<path d="M120 62 160 46q40 32 80 0l40 16 72 52-32 50-32-22v222H112V142l-32 22-32-50z" fill="#f6f3ee" stroke="#d8d1c6" stroke-width="2"/>
      <path d="M160 46q40 32 80 0" fill="none" stroke="#d8d1c6" stroke-width="5"/>
      <clipPath id="${id}c"><rect x="146" y="118" width="108" height="132" rx="2"/></clipPath>${pic(146, 118, 108, 132, ' style="mix-blend-mode:multiply"')}
      <path d="M112 142v222h176V142" fill="url(#${id}g)"/>`,
    tasse: `<path d="M272 160c66 0 66 112 0 112" fill="none" stroke="#d6cfc4" stroke-width="26"/>
      <path d="M272 160c66 0 66 112 0 112" fill="none" stroke="#f1ede6" stroke-width="16"/>
      <rect x="104" y="110" width="172" height="214" rx="16" fill="#f4f1ec"/>
      <clipPath id="${id}c"><rect x="122" y="138" width="136" height="160"/></clipPath>${pic(122, 138, 136, 160)}
      <rect x="104" y="110" width="172" height="214" rx="16" fill="url(#${id}h)"/>
      <ellipse cx="190" cy="112" rx="86" ry="11" fill="#ddd6cb"/>`,
    tasche: `<path d="M150 158c0-92 100-92 100 0" fill="none" stroke="#cfc2a8" stroke-width="11"/>
      <rect x="94" y="150" width="212" height="232" fill="#ece3d2"/>
      <clipPath id="${id}c"><rect x="128" y="196" width="144" height="150"/></clipPath>${pic(128, 196, 144, 150, ' style="mix-blend-mode:multiply"')}
      <rect x="94" y="150" width="212" height="232" fill="url(#${id}g)"/>`,
  };
  return `<svg class="product-art" viewBox="0 0 400 400" role="img" aria-label="${esc(label)}">
    <defs>
      <linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".14"/></linearGradient>
      <linearGradient id="${id}h" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset=".25" stop-color="#fff" stop-opacity=".22"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>
    </defs>
    ${P[kind] || P.druck}
  </svg>`;
}

function contactForm(kind, ctx) {
  const { t } = ctx;
  const req = `<span class="req" aria-hidden="true">*</span>`;
  const field = (id, label, type = 'text', opts = '') => `<div class="field">
        <label for="f-${id}">${label}${/required/.test(opts) ? ' ' + req : ''}</label>
        <input id="f-${id}" name="${id}" type="${type}" ${opts}>
      </div>`;
  const reservation = kind === 'reservation' ? `
      <div class="row">
        ${field('datum', t.date, 'date', 'required')}
        ${field('zeit', t.time, 'time', 'required')}
      </div>
      ${field('personen', t.persons, 'number', 'min="1" max="200" inputmode="numeric" required')}` : '';
  return `<form class="contact-form reveal" data-kind="${kind}" novalidate>
      <div class="row">
        ${field('name', t.name, 'text', 'autocomplete="name" required')}
        ${field('telefon', t.phone, 'tel', 'autocomplete="tel"')}
      </div>
      ${field('email', t.email, 'email', 'autocomplete="email" required')}
      ${reservation}
      <div class="field">
        <label for="f-nachricht">${kind === 'reservation' ? t.remarks : t.message}${kind === 'kontakt' ? ' ' + req : ''}</label>
        <textarea id="f-nachricht" name="nachricht" rows="5"${kind === 'kontakt' ? ' required' : ''}></textarea>
      </div>
      <div class="hp" aria-hidden="true"><label for="f-website">Website</label><input id="f-website" name="website" tabindex="-1" autocomplete="off"></div>
      <label class="consent"><input type="checkbox" name="consent" required> <span>${t.consent}</span></label>
      <button class="btn btn-primary" type="submit">${t.send}</button>
      <p class="form-status" role="status" aria-live="polite"></p>
    </form>`;
}

export function section(s, ctx) {
  const fn = R[s.typ];
  if (!fn) throw new Error(`Unbekannter Sektionstyp: ${s.typ}`);
  return fn(s, ctx);
}

export const SECTION_TYPES = Object.keys(R);
