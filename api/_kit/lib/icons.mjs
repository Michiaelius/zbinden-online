// Schlichte Linien-Icons (24er-Raster, stroke = currentColor). In content.json per Name wählen.
// Neue Icons: Pfade im selben Stil ergänzen.

const P = {
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  phone: '<path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 7l8.5 6.5L20.5 7"/>',
  whatsapp: '<path d="M4 20l1.3-4.2A8.5 8.5 0 1 1 8.4 18.9z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 .9a5 5 0 0 1-2.8-2.8l.9-1-1-2z"/>',
  pin: '<path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
  home: '<path d="M4 11l8-6.5 8 6.5"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
  tool: '<path d="M14.5 6.5a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3z"/><path d="M14.5 6.5l3-3 3 3-3 3"/>',
  leaf: '<path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z"/><path d="M5 19l8-8"/>',
  heart: '<path d="M12 19.5s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10z"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',
  chat: '<path d="M4 5.5h16v10H9l-5 4z"/>',
  people: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9.5" r="2.4"/><path d="M15.5 14.2A4.5 4.5 0 0 1 21 19"/>',
  child: '<circle cx="12" cy="6" r="2.5"/><path d="M8 11l4-1.5 4 1.5M12 9.5V15M9 21l3-6 3 6"/>',
  plan: '<rect x="3.5" y="3.5" width="17" height="17" rx="1.5"/><path d="M3.5 12h8V3.5M11.5 12v8.5M15 12h5.5"/>',
  euro: '<path d="M17 6.5A6.5 6.5 0 1 0 17 17.5"/><path d="M4.5 10.5h9M4.5 13.5h9"/>',
  shield: '<path d="M12 3.5l7 3v5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9v-5z"/><path d="M8.8 12l2.2 2.2 4.2-4.4"/>',
  spark: '<path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3"/>',
  cup: '<path d="M5 8h12v5a6 6 0 0 1-12 0z"/><path d="M17 9.5h1.5a2.5 2.5 0 0 1 0 5H16.5M8 3.5v2M11 3.5v2M14 3.5v2"/>',
  fork: '<path d="M7 3v7a2 2 0 0 0 4 0V3M9 12v9M16.5 3c-1.7 1.5-2.5 4-2.5 7h3V21"/>',
  wine: '<path d="M8 3h8l-.5 5a3.5 3.5 0 0 1-7 0zM12 11.5V20M8.5 20.5h7"/>',
  brush: '<path d="M19.5 4.5l-8 8"/><path d="M11.5 12.5c-2.5-1-5 .5-5 3 0 1.5-1 2.5-2.5 3 3 1.5 7.5 1 8.5-2.5.5-1.5 0-2.8-1-3.5z"/>',
  camera: '<rect x="3.5" y="7" width="17" height="12" rx="2"/><path d="M8.5 7l1.5-2.5h4L15.5 7"/><circle cx="12" cy="13" r="3.3"/>',
  car: '<path d="M5 16.5V12l2-5h10l2 5v4.5"/><path d="M3.5 16.5h17M5 12h14"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
};

export const ICON_NAMES = Object.keys(P);

export function icon(name, size = 24, cls = 'ic') {
  const body = P[name] || P.check;
  return `<svg class="${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
