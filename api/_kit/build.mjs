// Starter-Kit: baut aus einer content.json eine komplette One-Page-Website.
//
//   node build.mjs <pfad/zu/content.json> [--out <ordner>] [--vorschau] [--ohne-png]
//
//   --vorschau  noindex (Meta, Header, robots.txt) – für Maquettes und Vorschauen
//   --ohne-png  keine PNGs (App-Icons, og:image) erzeugen, z.B. ohne Chrome
//   --layout / --palette / --fonts  Variante bauen, ohne content.json zu ändern
//   Standard-Ausgabe: <ordner der content.json>/site

import { readFile, writeFile, mkdir, copyFile, cp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, basename, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

import { LAYOUTS } from './lib/layouts.mjs';
import { PALETTES, customPalette, paletteCss, checkPalette } from './lib/palettes.mjs';
import { FONT_PAIRS } from './lib/fonts.mjs';
import { ART_BY_LAYOUT } from './lib/art.mjs';
import { t as uiTexts } from './lib/i18n.mjs';
import { hero, section } from './lib/sections.mjs';
import { validate } from './lib/validate.mjs';
import { slug } from './lib/util.mjs';
import * as pages from './lib/pages.mjs';
import { screenshot, resizePng, findBrowser } from './lib/raster.mjs';

const KIT = dirname(fileURLToPath(import.meta.url));

// Standard-Hintergrund je Sektionstyp (in content.json mit "ton" überschreibbar)
const DEFAULT_TONE = {
  zitat: 'hell', leistungen: 'hell', split: 'hell', band: 'dunkel', ablauf: 'flaeche', ueber: 'hell',
  galerie: 'hell', stimmen: 'flaeche', region: 'flaeche', faq: 'hell', kontakt: 'flaeche',
};

function parseArgs(argv) {
  const o = { content: null, out: null, vorschau: false, png: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') o.out = argv[++i];
    else if (a === '--vorschau') o.vorschau = true;
    else if (a === '--ohne-png') o.png = false;
    else if (a === '--layout') o.layout = argv[++i];
    else if (a === '--palette') o.palette = argv[++i];
    else if (a === '--fonts') o.fonts = argv[++i];
    else if (!o.content) o.content = a;
  }
  return o;
}

// shot(html, outPng, breite, höhe, skalierung): eigener Screenshot (z.B. Puppeteer auf dem Server) statt Chrome-CLI + PowerShell
export async function build({ content: contentPath, out, vorschau = false, png = true, layout, palette: paletteId, fonts: fontsOverride, shot }) {
  const contentFile = resolve(contentPath);
  const srcDir = dirname(contentFile);
  const c = JSON.parse(await readFile(contentFile, 'utf8'));
  // Varianten ohne content.json anzufassen: --layout / --palette / --fonts
  // (beim Layoutwechsel gelten dessen Standard-Palette und -Schrift, sofern nicht angegeben)
  if (layout) { c.layout = layout; if (!paletteId) delete c.palette; if (!fontsOverride) delete c.fonts; }
  if (paletteId) c.palette = paletteId;
  if (fontsOverride) c.fonts = fontsOverride;

  const { errors, hints } = validate(c);
  if (errors.length) {
    const e = new Error('content.json ist nicht gültig:\n- ' + errors.join('\n- '));
    e.errors = errors;
    throw e;
  }

  const layoutId = c.layout;
  const L = LAYOUTS[layoutId];
  const palette = c.farben ? customPalette(c.farben.haupt, c.farben.akzent) : PALETTES[c.palette || L.palette];
  const fontsId = c.fonts || L.fonts;
  const fonts = FONT_PAIRS[fontsId];
  const outDir = resolve(out || join(srcDir, 'site'));
  const warnings = [...hints, ...checkPalette(palette).map((w) => `Kontrast: ${w}`)];

  // Ausgabe frisch anlegen (nur den eigenen Build-Ordner leeren)
  if (existsSync(outDir)) {
    if (!existsSync(join(outDir, 'index.html')) && !existsSync(join(outDir, '.kit'))) {
      throw new Error(`Ausgabeordner ${outDir} existiert und stammt nicht vom Starter-Kit – bitte anderen --out wählen`);
    }
    await rm(outDir, { recursive: true, force: true });
  }
  await mkdir(join(outDir, 'assets', 'fonts'), { recursive: true });
  await mkdir(join(outDir, 'images'), { recursive: true });
  await mkdir(join(outDir, 'api'), { recursive: true });
  await writeFile(join(outDir, '.kit'), `Gebaut mit dem Starter-Kit am ${new Date().toISOString()}\n`);

  // Bilder: lokale Pfade relativ zur content.json, werden nach images/ kopiert
  const copied = new Map();
  const img = (src) => {
    if (/^https?:/i.test(src)) throw new Error(`Bild "${src}" ist eine Web-Adresse – bitte zuerst herunterladen und lokal referenzieren`);
    if (copied.has(src)) return copied.get(src);
    const abs = resolve(srcDir, src);
    if (!existsSync(abs)) { warnings.push(`Bild fehlt: ${src} (Grafik wird gezeigt)`); return null; }
    let name = slug(basename(src, extname(src))) + extname(src).toLowerCase();
    while ([...copied.values()].includes(`images/${name}`)) name = '_' + name;
    copied.set(src, `images/${name}`);
    return `images/${name}`;
  };
  // fehlende Bilder → Grafik statt kaputtem <img>
  const fixImages = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const v of Object.values(obj)) {
      if (v && typeof v === 'object') {
        if (typeof v.src === 'string' && !/^https?:/i.test(v.src) && !existsSync(resolve(srcDir, v.src))) {
          warnings.push(`Bild fehlt: ${v.src} (Grafik wird gezeigt)`);
          delete v.src;
        }
        fixImages(v);
      }
    }
  };
  fixImages(c);

  c.lang = c.lang || 'de';
  c.__t = uiTexts(c.lang);
  if (c.firma.logo) {
    const l = img(c.firma.logo);
    if (l) c.__logo = l;
  }

  const ctx = {
    c, L, layoutId, palette, t: c.__t, img: (s) => img(s) || '',
    artKind: c.grafik || ART_BY_LAYOUT[layoutId] || 'arches',
    defaultTone: { ...DEFAULT_TONE, ...(L.tones || {}) },
  };

  const body = [hero(c.hero, ctx), ...c.sektionen.map((s) => section(s, ctx))].join('\n\n');
  // Unterseiten (mehrseitige Website) zuerst, dann die Sektionen der Startseite
  const nav = (c.seiten || []).map((p) => ({ seite: p.slug, label: p.label }))
    .concat(c.sektionen.filter((s) => s.nav && s.id).map((s) => ({ id: s.id, label: s.nav })));

  await writeFile(join(outDir, 'index.html'), pages.indexPage(c, ctx, body, nav, vorschau), 'utf8');
  await writeFile(join(outDir, 'datenschutz.html'), pages.privacyPage(c, ctx, vorschau), 'utf8');
  await writeFile(join(outDir, 'robots.txt'), pages.robotsTxt(c, vorschau), 'utf8');
  await writeFile(join(outDir, 'sitemap.xml'), pages.sitemapXml(c), 'utf8');
  await writeFile(join(outDir, 'llms.txt'), pages.llmsTxt(c), 'utf8');
  await writeFile(join(outDir, 'manifest.webmanifest'), pages.manifest(c, palette), 'utf8');
  await writeFile(join(outDir, '.htaccess'), pages.htaccess(vorschau), 'utf8');
  const iconSvg = pages.iconSvg(c, palette);
  await writeFile(join(outDir, 'icon.svg'), iconSvg, 'utf8');

  // CSS: Tokens + Basis + Layout
  const rootCss = `:root{${paletteCss(palette)};--font-display:${fonts.display};--font-body:${fonts.body};--display-weight:${fonts.displayWeight};color-scheme:${palette.mode}}\n`;
  const baseCss = await readFile(join(KIT, 'assets', 'base.css'), 'utf8');
  const layoutCssPath = join(KIT, 'assets', 'layouts', `${layoutId}.css`);
  const layoutCss = existsSync(layoutCssPath) ? await readFile(layoutCssPath, 'utf8') : '';
  await writeFile(join(outDir, 'assets', 'site.css'), `/* Generiert vom Starter-Kit – Layout ${layoutId}, Palette ${c.farben ? `eigen ${c.farben.haupt}/${c.farben.akzent}` : c.palette || L.palette}, Schrift ${fontsId} */\n${rootCss}${baseCss}\n/* ---- Layout: ${layoutId} ---- */\n${layoutCss}`, 'utf8');
  const ui = c.__t;
  const siteJs = (await readFile(join(KIT, 'assets', 'site.js'), 'utf8'))
    .replace('__UI__', JSON.stringify({ sending: ui.sending, sent: ui.sent, error: ui.error, send: ui.send, required: ui.required, menu: ui.menu, close: ui.close, zoom: ui.zoom, prev: ui.prev, next: ui.next }));
  await writeFile(join(outDir, 'assets', 'site.js'), siteJs, 'utf8');
  await copyFile(join(KIT, 'assets', 'pull-refresh.js'), join(outDir, 'assets', 'pull-refresh.js'));
  await cp(join(KIT, 'assets', 'fonts', fontsId), join(outDir, 'assets', 'fonts'), { recursive: true });

  // Bilder kopieren
  for (const [src, dest] of copied) await copyFile(resolve(srcDir, src), join(outDir, dest));

  // Formular (PHP für Infomaniak)
  const hasForm = c.sektionen.some((s) => s.typ === 'kontakt' && s.formular !== 'keins');
  if (hasForm) {
    const php = (await readFile(join(KIT, 'php', 'anfrage.php'), 'utf8'))
      .replaceAll('__SITE_NAME__', c.firma.name.replace(/'/g, "\\'"))
      .replaceAll('__SITE_DOMAIN__', (c.domain || '').replace(/'/g, ''))
      .replaceAll('__TO_DEFAULT__', (c.firma.email || '').replace(/'/g, ''))
      .replaceAll('__ACCENT__', palette.mode === 'dark' ? palette.accent : palette.accent)
      .replaceAll('__DARK__', palette.dark)
      .replaceAll('__SURFACE__', palette.mode === 'dark' ? '#f4efe6' : palette.surface);
    await writeFile(join(outDir, 'api', 'anfrage.php'), php, 'utf8');
    await copyFile(join(KIT, 'php', 'anfrage-config.example.php'), join(outDir, 'api', 'anfrage-config.example.php'));
  }

  // PNGs: App-Icons + og:image
  if (png) {
    if (!shot && !findBrowser()) {
      warnings.push('Kein Chrome/Edge gefunden – PNG-Icons und og:image fehlen');
    } else {
      if (shot) {
        // Puppeteer kann direkt klein rendern, ohne Verkleinern
        for (const [name, size] of [['icon-512.png', 512], ['icon-192.png', 192], ['apple-touch-icon.png', 180]]) {
          await shot(pages.iconHtml(iconSvg), join(outDir, name), 512, 512, size / 512);
        }
      } else {
        const tmp = join(tmpdir(), `kit-icon-${process.pid}.png`);
        await screenshot(pages.iconHtml(iconSvg), tmp, 512, 512);
        await copyFile(tmp, join(outDir, 'icon-512.png'));
        await resizePng(tmp, join(outDir, 'icon-192.png'), 192);
        await resizePng(tmp, join(outDir, 'apple-touch-icon.png'), 180);
        await rm(tmp, { force: true });
      }
      const fontsCss = (await readFile(join(KIT, 'assets', 'fonts', fontsId, 'fonts.css'), 'utf8'))
        .replace(/url\(([^)]+)\)/g, (_, f) => `url(${new URL(f, 'file:///' + join(KIT, 'assets', 'fonts', fontsId).replace(/\\/g, '/') + '/').href})`);
      await (shot || screenshot)(pages.ogHtml(c, palette, fontsCss, fonts.display, fonts.body), join(outDir, 'og-image.png'), 1200, 630);
    }
  }

  return { outDir, warnings, layoutId, palette: c.farben ? `eigen ${c.farben.haupt}/${c.farben.akzent}` : c.palette || L.palette, fontsId };
}

// CLI
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.content) {
    console.error('Aufruf: node build.mjs <content.json> [--out ordner] [--vorschau] [--ohne-png] [--layout id] [--palette id] [--fonts id]');
    process.exit(1);
  }
  build(args).then((r) => {
    console.log(`Gebaut: ${r.outDir}  (Layout ${r.layoutId}, Palette ${r.palette}, Schrift ${r.fontsId})`);
    for (const w of r.warnings) console.log(`  Hinweis: ${w}`);
  }).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
