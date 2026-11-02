/**
 * Construction de l'ébauche avec le Starter-Kit (api/_kit) et mise en ligne sur vorschau.zbinden.online.
 * Chaque ébauche a son dossier <slug>-<4 caractères au hasard>/ : plusieurs maquettes en même temps,
 * et un client ne peut pas deviner l'adresse de celle d'un autre. Toujours en mode vorschau (noindex,
 * le formulaire affiche un message au lieu d'envoyer).
 *
 * Variables d'environnement : VORSCHAU_FTP_HOST, VORSCHAU_FTP_USER, VORSCHAU_FTP_PASS
 * (optionnel : VORSCHAU_BASE, défaut https://vorschau.zbinden.online ; CHROME_PATH pour tester en local)
 */

import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { Client } from 'basic-ftp';
import puppeteer from 'puppeteer-core';
import { build } from '../_kit/build.mjs';

export function vorschauBase() {
  return (process.env.VORSCHAU_BASE || 'https://vorschau.zbinden.online').replace(/\/$/, '');
}

export function ftpConfigured() {
  return !!(process.env.VORSCHAU_FTP_HOST && process.env.VORSCHAU_FTP_USER && process.env.VORSCHAU_FTP_PASS);
}

export function folderName(slug) {
  // 4 caractères sans 0/o/1/l, faciles à lire au téléphone
  const abc = 'abcdefghijkmnpqrstuvwxyz23456789';
  const r = Array.from(randomBytes(4)).map(function (b) { return abc[b % abc.length]; }).join('');
  return `${slug}-${r}`;
}

async function launch() {
  if (process.env.CHROME_PATH) {
    return puppeteer.launch({ executablePath: process.env.CHROME_PATH, headless: true });
  }
  const chromium = (await import('@sparticuz/chromium')).default;
  return puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: true });
}

/** Construit le site dans un dossier temporaire. Renvoie { dir, siteDir, warnings, layoutId, palette }. */
export async function buildMockup(content, logo, folder) {
  const dir = await mkdtemp(join(tmpdir(), 'entwurf-'));
  const c = JSON.parse(JSON.stringify(content));
  c.domain = vorschauBase().replace(/^https?:\/\//, '') + '/' + folder;
  if (logo) {
    await writeFile(join(dir, `logo.${logo.ext}`), Buffer.from(logo.data, 'base64'));
    c.firma.logo = `logo.${logo.ext}`;
  }
  const contentPath = join(dir, 'content.json');
  await writeFile(contentPath, JSON.stringify(c, null, 2), 'utf8');

  let browser = null;
  // Un seul Chromium pour les 4 images (3 icônes + og:image)
  const shot = async function (html, outPng, w, h, scale) {
    if (!browser) browser = await launch();
    const tmp = join(dir, `shot-${Date.now()}.html`);
    await writeFile(tmp, html, 'utf8');
    const page = await browser.newPage();
    try {
      await page.setViewport({ width: w, height: h, deviceScaleFactor: scale || 1 });
      await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle0', timeout: 20000 });
      await page.evaluate(function () { return document.fonts.ready; });
      await page.screenshot({ path: outPng, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
    } finally {
      await page.close();
      await rm(tmp, { force: true });
    }
  };
  try {
    const r = await build({ content: contentPath, out: join(dir, 'site'), vorschau: true, png: true, shot: shot });
    return { dir: dir, siteDir: r.outDir, warnings: r.warnings, layoutId: r.layoutId, palette: r.palette, fontsId: r.fontsId, content: c };
  } finally {
    if (browser) await browser.close();
  }
}

/** Charge le site dans /<folder>/ sur le FTP vorschau. Renvoie l'adresse publique. */
export async function upload(siteDir, folder) {
  const client = new Client(30000);
  try {
    await client.access({
      host: process.env.VORSCHAU_FTP_HOST,
      user: process.env.VORSCHAU_FTP_USER,
      password: process.env.VORSCHAU_FTP_PASS,
      secure: true,
    });
    await client.ensureDir('/' + folder);
    await client.uploadFromDir(siteDir);
  } finally {
    client.close();
  }
  return `${vorschauBase()}/${folder}/`;
}
