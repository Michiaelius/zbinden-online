/**
 * Impression HTML → PDF avec Chromium sans interface (@sparticuz/chromium + puppeteer-core),
 * la seule partie du test GEO-Light qui a besoin de dépendances npm.
 */

import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export async function htmlToPdf(html) {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 20000 });
    await page.evaluate(function () { return document.fonts.ready; });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
