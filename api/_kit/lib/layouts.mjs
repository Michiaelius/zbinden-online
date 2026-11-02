// Layouts = Gestaltungsrichtung. Das Markup der Sektionen ist für alle gleich;
// das Layout bestimmt Hero-Variante, Header, Standard-Palette/-Schrift und die CSS-Datei
// assets/layouts/<id>.css. Neues Layout: Eintrag hier + CSS-Datei anlegen.

export const LAYOUTS = {
  klar: {
    label: 'Klar – hell und aufgeräumt',
    hero: 'split',            // Text links, Bild/Grafik rechts
    header: 'light',
    palette: 'ozean',
    fonts: 'manrope',
    passtZu: 'Dienstleister, Handwerk, Beratung, Praxen',
  },
  warm: {
    label: 'Warm – Farbblöcke, rund, freundlich',
    hero: 'center',
    header: 'light',
    palette: 'terracotta',
    fonts: 'fraunces-source',
    passtZu: 'Spielgruppen, Therapie, Coaching, Vereine, Läden',
  },
  kontrast: {
    label: 'Kontrast – dunkler Kopf, kräftige Schrift',
    hero: 'split',
    header: 'dark',
    palette: 'graphit',
    fonts: 'barlow',
    passtZu: 'Bau, Technik, Garagen, Industrie, Sicherheit',
  },
  editorial: {
    label: 'Editorial – grosse Serifenschrift, viel Weissraum',
    hero: 'editorial',
    header: 'light',
    palette: 'beere',
    fonts: 'dmserif-dmsans',
    passtZu: 'Kunst, Design, Fotografie, Architektur, Mode',
  },
  galerie: {
    label: 'Galerie – Werke an einer echten Wand, von oben beleuchtet',
    hero: 'editorial',
    header: 'light',
    palette: 'galerie',
    fonts: 'instrument',
    passtZu: 'Malerei, Fotografie, Design, Kunsthandwerk, Galerien',
  },
  atelier: {
    label: 'Atelier – farbig, verspielt, Bilder wie an die Wand gepinnt',
    hero: 'editorial',
    header: 'light',
    palette: 'kolibri',
    fonts: 'fraunces-wonk',
    passtZu: 'Malerei, Illustration, Kunsthandwerk, Kinderangebote, Kreative',
  },
  fresque: {
    label: 'Fresque – Nachtbeton, Sprühfarbe, grosse Wandbilder',
    hero: 'editorial',
    header: 'dark',
    palette: 'beton',
    fonts: 'anton',
    passtZu: 'Street Art, Wandmalerei, Graffiti, Tattoo, Urban Culture',
  },
  immo: {
    label: 'Immo – ruhig, hochwertig, Objekte im Mittelpunkt',
    hero: 'split',
    header: 'light',
    palette: 'graphit',
    fonts: 'cormorant-source',
    passtZu: 'Immobilienmakler, Verwaltungen, Architekten, Treuhand',
  },
  stube: {
    label: 'Stube – dunkel, bildstark, Gastronomie',
    hero: 'photo',            // Vollbild-Foto mit Text unten
    header: 'overlay',
    palette: 'stube',
    fonts: 'cormorant-source',
    passtZu: 'Restaurants, Bars, Hotels, Weingüter, Catering',
  },
};
