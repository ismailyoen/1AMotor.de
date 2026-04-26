/**
 * category-images.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Fallback-Bilder nach Kategorie für 1A Motor.
 * Wenn ein Inserat kein eigenes Bild hat, wird automatisch das passende
 * Kategoriebild angezeigt.
 *
 * Einbindung in index.html und suche.html:
 *   <script src="category-images.js"></script>
 * (VOR index-live.js bzw. suche-live.js einbinden!)
 * ─────────────────────────────────────────────────────────────────────────────
 */

window.CATEGORY_IMAGES = {
  // ── Automotoren ───────────────────────────────────────────────────────────
  'Automotor':          'automotor.PNG',
  'Austauschmotor':     'automotor.PNG',
  'Benzinmotor':        'automotor.PNG',
  'Dieselmotor':        'automotor.PNG',
  'Benzin':             'automotor.PNG',
  'Diesel':             'automotor.PNG',

  // ── LKW Motoren ───────────────────────────────────────────────────────────
  'LKW Motor':          'lkwmotor.PNG',
  'LKW':                'lkwmotor.PNG',
  'Nutzfahrzeugmotor':  'lkwmotor.PNG',
  'Transporter':        'lkwmotor.PNG',

  // ── Busmotoren ────────────────────────────────────────────────────────────
  'Busmotor':           'busmotor.PNG',
  'Bus':                'busmotor.PNG',
  'Reisebusmotor':      'busmotor.PNG',
  'Stadtbusmotor':      'busmotor.PNG',

  // ── Bootsmotoren ──────────────────────────────────────────────────────────
  'Bootsmotor':         'bootsmotor.PNG',
  'Boot':               'bootsmotor.PNG',
  'Schiffsmotor':       'bootsmotor.PNG',
  'Außenbordmotor':     'bootsmotor.PNG',
  'Innenbordmotor':     'bootsmotor.PNG',
  'Marinemotor':        'bootsmotor.PNG',

  // ── Motorradmotoren ───────────────────────────────────────────────────────
  'Motorradmotor':      'motorradmotor.PNG',
  'Motorrad':           'motorradmotor.PNG',
  'Zweiradmotor':       'motorradmotor.PNG',
  'Rollermotor':        'motorradmotor.PNG',
};

/**
 * Gibt das passende Fallback-Bild für eine Kategorie zurück.
 * Sucht zuerst nach exaktem Treffer, dann nach partiellem Treffer.
 *
 * @param {string} category  - Der Kategoriestring des Inserats
 * @param {string} [fallback='automotor.PNG'] - Ultimativer Fallback
 * @returns {string} Bildpfad
 */
window.getCategoryImage = function(category, fallback) {
  fallback = fallback || 'automotor.PNG';
  if (!category) return fallback;

  // 1. Exakter Treffer (case-insensitive)
  const key = Object.keys(window.CATEGORY_IMAGES).find(
    k => k.toLowerCase() === category.toLowerCase()
  );
  if (key) return window.CATEGORY_IMAGES[key];

  // 2. Partieller Treffer: Kategorie enthält einen bekannten Schlüssel
  const partial = Object.keys(window.CATEGORY_IMAGES).find(
    k => category.toLowerCase().includes(k.toLowerCase())
  );
  if (partial) return window.CATEGORY_IMAGES[partial];

  // 3. Partieller Treffer umgekehrt: bekannter Schlüssel enthält die Kategorie
  const reverse = Object.keys(window.CATEGORY_IMAGES).find(
    k => k.toLowerCase().includes(category.toLowerCase())
  );
  if (reverse) return window.CATEGORY_IMAGES[reverse];

  return fallback;
};

/**
 * Gibt die korrekte Bild-URL für ein Inserat zurück.
 * Prüft images[], image_url und image – greift dann auf Kategoriebild zurück.
 *
 * @param {Object} listing - Das Inserat-Objekt aus Supabase
 * @returns {string} Bild-URL
 */
window.getListingImage = function(listing) {
  // Supabase speichert Bilder oft als JSON-Array im images-Feld
  if (listing.images) {
    if (Array.isArray(listing.images) && listing.images.length > 0) {
      return listing.images[0];
    }
    if (typeof listing.images === 'string' && listing.images.startsWith('http')) {
      return listing.images;
    }
    // Manchmal als JSON-String gespeichert
    try {
      const parsed = JSON.parse(listing.images);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    } catch(e) {}
  }

  // Einzelne Bild-URL Felder
  if (listing.image_url && listing.image_url.startsWith('http')) {
    return listing.image_url;
  }
  if (listing.image && listing.image.startsWith('http')) {
    return listing.image;
  }
  if (listing.foto && listing.foto.startsWith('http')) {
    return listing.foto;
  }

  // Kein Bild vorhanden → Kategoriebild
  return window.getCategoryImage(listing.category || listing.kategorie || listing.typ || '');
};
