// Schriftpaare: display = Titel, body = Fliesstext. Neue Paare hier ergänzen und
// danach `node tools/fetch-fonts.mjs <id>` ausführen.

export const FONT_PAIRS = {
  'barlow': {
    label: 'Barlow Condensed + Barlow',
    display: "'Barlow Condensed', 'Arial Narrow', Arial, sans-serif",
    body: "'Barlow', 'Helvetica Neue', Arial, sans-serif",
    displayWeight: 600,
    google: 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600&family=Barlow:wght@400;500;600&display=swap',
  },
  'fraunces-source': {
    label: 'Fraunces + Source Sans 3',
    display: "'Fraunces', Georgia, serif",
    body: "'Source Sans 3', 'Helvetica Neue', Arial, sans-serif",
    displayWeight: 600,
    google: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Source+Sans+3:wght@400;600&display=swap',
  },
  'cormorant-source': {
    label: 'Cormorant Garamond + Source Sans 3',
    display: "'Cormorant Garamond', Garamond, Georgia, serif",
    body: "'Source Sans 3', 'Helvetica Neue', Arial, sans-serif",
    displayWeight: 500,
    google: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500&family=Source+Sans+3:wght@300;400;600&display=swap',
  },
  'dmserif-dmsans': {
    label: 'DM Serif Display + DM Sans',
    display: "'DM Serif Display', Georgia, serif",
    body: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
    displayWeight: 400,
    google: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap',
  },
  // Fraunces mit weichen, «wackligen» Formen (SOFT/WONK) – verspielt, für Kunst und Kreative
  'fraunces-wonk': {
    label: 'Fraunces Soft/Wonk + DM Sans',
    display: "'Fraunces', Georgia, serif",
    body: "'DM Sans', 'Helvetica Neue', Arial, sans-serif",
    displayWeight: 600,
    google: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,600,100,1;1,9..144,500,100,1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap',
  },
  // Instrument Serif + Instrument Sans – zurückhaltend, «Designer», für Galerien und Studios
  'instrument': {
    label: 'Instrument Serif + Instrument Sans',
    display: "'Instrument Serif', Georgia, serif",
    body: "'Instrument Sans', 'Helvetica Neue', Arial, sans-serif",
    displayWeight: 400,
    google: 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@400;500;600&display=swap',
  },
  // Anton + Archivo – plakativ, schmal und laut wie Schablonenschrift an der Wand (Street Art)
  'anton': {
    label: 'Anton + Archivo',
    display: "'Anton', Impact, 'Arial Narrow', sans-serif",
    body: "'Archivo', 'Helvetica Neue', Arial, sans-serif",
    displayWeight: 400,
    google: 'https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;500;700&display=swap',
  },
  'manrope': {
    label: 'Manrope',
    display: "'Manrope', 'Helvetica Neue', Arial, sans-serif",
    body: "'Manrope', 'Helvetica Neue', Arial, sans-serif",
    displayWeight: 800,
    google: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&display=swap',
  },
  'nunito': {
    label: 'Nunito',
    display: "'Nunito', 'Trebuchet MS', Arial, sans-serif",
    body: "'Nunito', 'Trebuchet MS', Arial, sans-serif",
    displayWeight: 800,
    google: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;800&display=swap',
  },
};
