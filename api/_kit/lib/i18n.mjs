// Feste Oberflächentexte der Kundensites (DE/FR/EN). Inhalte kommen aus content.json.

export const T = {
  de: {
    htmlLang: 'de-CH', ogLocale: 'de_CH',
    menu: 'Menü', close: 'Schliessen', top: 'Nach oben', skip: 'Zum Inhalt springen',
    call: 'Anrufen', whatsapp: 'WhatsApp', write: 'Schreiben', request: 'Anfrage', reserve: 'Reservieren',
    name: 'Name', email: 'E-Mail', phone: 'Telefon', message: 'Ihre Nachricht',
    date: 'Datum', time: 'Uhrzeit', persons: 'Anzahl Personen', remarks: 'Bemerkungen (Anlass, Allergien …)',
    consent: 'Ich habe die <a href="datenschutz.html">Datenschutzerklärung</a> gelesen und bin einverstanden.',
    send: 'Absenden', sending: 'Wird gesendet …',
    sent: 'Vielen Dank! Ihre Nachricht ist angekommen. Wir melden uns so bald wie möglich.',
    error: 'Das hat leider nicht geklappt. Bitte versuchen Sie es nochmals oder melden Sie sich direkt per Telefon oder E-Mail.',
    required: 'Pflichtfeld', contactDirect: 'Lieber direkt?', hours: 'Öffnungszeiten', address: 'Adresse',
    route: 'Route planen', privacy: 'Datenschutz', imprint: 'Impressum', madeBy: 'Website von',
    faq: 'Häufige Fragen', reviewsNote: '',
    zoom: 'Bild vergrössern', prev: 'Vorheriges Bild', next: 'Nächstes Bild',
  },
  fr: {
    htmlLang: 'fr-CH', ogLocale: 'fr_CH',
    menu: 'Menu', close: 'Fermer', top: 'Haut de page', skip: 'Aller au contenu',
    call: 'Appeler', whatsapp: 'WhatsApp', write: 'Écrire', request: 'Demande', reserve: 'Réserver',
    name: 'Nom', email: 'E-mail', phone: 'Téléphone', message: 'Votre message',
    date: 'Date', time: 'Heure', persons: 'Nombre de personnes', remarks: 'Remarques (occasion, allergies …)',
    consent: 'J’ai lu la <a href="datenschutz.html">déclaration de protection des données</a> et je l’accepte.',
    send: 'Envoyer', sending: 'Envoi en cours …',
    sent: 'Merci ! Votre message est bien arrivé. Nous vous répondons dès que possible.',
    error: 'L’envoi n’a pas fonctionné. Merci de réessayer ou de nous contacter directement par téléphone ou e-mail.',
    required: 'Champ obligatoire', contactDirect: 'Plutôt en direct ?', hours: 'Horaires', address: 'Adresse',
    route: 'Itinéraire', privacy: 'Protection des données', imprint: 'Mentions légales', madeBy: 'Site web par',
    faq: 'Questions fréquentes', reviewsNote: '',
    zoom: 'Agrandir l’image', prev: 'Image précédente', next: 'Image suivante',
  },
  en: {
    htmlLang: 'en', ogLocale: 'en_GB',
    menu: 'Menu', close: 'Close', top: 'Back to top', skip: 'Skip to content',
    call: 'Call', whatsapp: 'WhatsApp', write: 'Write', request: 'Enquiry', reserve: 'Book a table',
    name: 'Name', email: 'Email', phone: 'Phone', message: 'Your message',
    date: 'Date', time: 'Time', persons: 'Number of guests', remarks: 'Notes (occasion, allergies …)',
    consent: 'I have read the <a href="datenschutz.html">privacy policy</a> and agree.',
    send: 'Send', sending: 'Sending …',
    sent: 'Thank you! Your message has arrived. We will get back to you as soon as possible.',
    error: 'Sending failed. Please try again or contact us directly by phone or email.',
    required: 'Required', contactDirect: 'Prefer to talk directly?', hours: 'Opening hours', address: 'Address',
    route: 'Get directions', privacy: 'Privacy', imprint: 'Legal notice', madeBy: 'Website by',
    faq: 'Frequently asked questions', reviewsNote: '',
    zoom: 'Enlarge image', prev: 'Previous image', next: 'Next image',
  },
};

export function t(lang) {
  return T[(lang || 'de').slice(0, 2)] || T.de;
}
