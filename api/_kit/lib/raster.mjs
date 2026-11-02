// PNG aus HTML: headless Chrome (oder Edge) macht den Screenshot, PowerShell verkleinert.
// Chrome schneidet Fenster unter ~500px ab → immer gross rendern und danach verkleinern.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { existsSync } from 'node:fs';
import { writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const run = promisify(execFile);

const CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

export function findBrowser() {
  return process.env.CHROME_PATH || CANDIDATES.find((p) => p && existsSync(p)) || null;
}

export async function screenshot(html, outPng, width, height) {
  const browser = findBrowser();
  if (!browser) throw new Error('Kein Chrome/Edge gefunden (CHROME_PATH setzen)');
  const tmp = join(tmpdir(), `kit-${process.pid}-${Date.now()}.html`);
  await writeFile(tmp, html, 'utf8');
  try {
    await run(browser, [
      '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
      '--default-background-color=00000000', '--virtual-time-budget=2000',
      `--window-size=${width},${height}`, `--screenshot=${outPng}`, pathToFileURL(tmp).href,
    ], { timeout: 60000 });
  } finally {
    await rm(tmp, { force: true });
  }
}

export async function resizePng(src, dest, size) {
  const ps = `Add-Type -AssemblyName System.Drawing;
$i=[System.Drawing.Image]::FromFile('${src.replace(/'/g, "''")}');
$b=New-Object System.Drawing.Bitmap ${size},${size};
$g=[System.Drawing.Graphics]::FromImage($b);
$g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic;
$g.SmoothingMode=[System.Drawing.Drawing2D.SmoothingMode]::HighQuality;
$g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality;
$g.DrawImage($i,0,0,${size},${size});
$b.Save('${dest.replace(/'/g, "''")}',[System.Drawing.Imaging.ImageFormat]::Png);
$g.Dispose();$b.Dispose();$i.Dispose()`;
  await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', ps], { timeout: 60000 });
}
