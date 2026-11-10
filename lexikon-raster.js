// ══════════════════════════════════════════════════════════════════════════════
//  lexikon-raster.js  v4  —  1A Motor
//  Mischt die Motorenlexikon-Karten (weißer Inserat-Look aus lexikon-card.js)
//  zwischen die Inserate:
//    • Startseite  (#home-listing-grid)
//    • Suche       (#se-grid)
//
//  v3:
//  • GEMISCHTE Positionen: Lexikon-Karten stehen nicht mehr immer in derselben
//    Spalte. Zwischen zwei Lexikon-Karten liegen zufällig 1–3 Inserate
//    (im Schnitt jede 3. Karte). Die Verteilung wechselt alle 20 Minuten und
//    pro Seite der Suche, bleibt aber beim Filtern/Neuaufbau stabil (kein Springen).
//  • lädt lexikon-card.js mit eigenem Versionsschlüssel nach, damit alte,
//    zwischengespeicherte (blaue) Karten im Browser nicht mehr auftauchen.
//
//  v4:
//  • zeigt das bearbeitete Foto (bild_frei_url), sobald es übernommen wurde.
//  • Bildnachweis nicht mehr unter der Karte, sondern hinter dem ⓘ im Foto
//    (kommt aus lexikon-card.js v4).
//
//  Einbinden – jeweils GANZ UNTEN vor </body>:
//    <script src="lexikon-raster.js?v=2" defer></script>   (bleibt so)
// ══════════════════════════════════════════════════════════════════════════════
(function () {
  "use strict";

  const RASTER = [
    { id: "home-listing-grid", leer: [".empty-box"] },
    { id: "se-grid", leer: [".se-empty", ".se-loading"], suche: true, proSeite: 24 },
  ];
  const ABSTAND_MIN = 1;                     // mind. 1 Inserat zwischen Lexikon-Karten
  const ABSTAND_MAX = 3;                     // höchstens 3 → im Schnitt jede 3. Karte
  const KARTEN_VERSION = "4";                // bei Änderungen an lexikon-card.js hochzählen
  const DETAIL = "motor-info.html?m=";
  const FELDER = "slug,hersteller,modell,motorcode,kategorie,kraftstoff,bauart,zylinder,hubraum_ccm," +
    "leistung_kw,drehmoment_nm,spannung_v,drehzahl,baujahre,bild_url,bild_frei_url,bild_urheber,bild_lizenz,bild_lizenz_url,bild_seite";

  // ── Gleiches Misch-Prinzip wie index-live.js / suche.html (alle 20 Min neu) ──
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  function mischen(arr, seed) {
    const r = rng(seed), a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  const SEED = Math.floor(Date.now() / (20 * 60 * 1000)) + 7;

  // Feste, aber gemischte Abstände: z. B. 2,1,3,2,1,3 … (stabil für Seed + Seite)
  function abstaende(seed, anzahl) {
    const r = rng(seed), out = [];
    let letzter = 0;
    for (let i = 0; i < anzahl; i++) {
      let a = ABSTAND_MIN + Math.floor(r() * (ABSTAND_MAX - ABSTAND_MIN + 1));
      if (a === letzter && r() < 0.6) a = a === ABSTAND_MAX ? ABSTAND_MIN : a + 1; // seltener gleiche Abstände hintereinander
      out.push(a); letzter = a;
    }
    return out;
  }

  // ── lexikon-card.js in der aktuellen Version sicherstellen ──────────────────
  function ladeKarte() {
    if (window.LexikonCard && window.LexikonCard.quelle) return Promise.resolve(true); // v4 schon da
    return new Promise((ok) => {
      const s = document.createElement("script");
      s.src = "lexikon-card.js?v=" + KARTEN_VERSION + "-" + Math.floor(Date.now() / 864e5);
      s.onload = () => ok(!!window.LexikonCard);
      s.onerror = () => ok(!!window.LexikonCard);
      document.head.appendChild(s);
    });
  }

  // ── Einträge laden ─────────────────────────────────────────────────────────
  let alle = [];
  async function laden() {
    if (typeof supabaseClient === "undefined") return [];
    const { data, error } = await supabaseClient
      .from("motor_lexikon").select(FELDER)
      .eq("status", "veroeffentlicht")
      .order("updated_at", { ascending: false })
      .limit(400);
    if (error || !data) { console.warn("LEXIKON-RASTER:", error); return []; }
    // Mit Foto zuerst – die wirken zwischen Inseraten am besten
    return mischen(data.filter((e) => e.bild_url), SEED).concat(mischen(data.filter((e) => !e.bild_url), SEED));
  }

  function seite() {
    return Math.max(1, parseInt(new URLSearchParams(location.search).get("page"), 10) || 1);
  }

  // In der Suche: passende Einträge nach vorn
  function reihenfolge(r) {
    if (!r.suche) return { liste: alle, start: 0 };
    const p = new URLSearchParams(location.search);
    const kats = (p.get("category") || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const woerter = (p.get("q") || "").toLowerCase().split(/\s+/).filter((w) => w.length > 1);
    const hersteller = (p.get("hersteller") || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    let liste = alle;
    if (kats.length || woerter.length || hersteller.length) {
      const punkte = (e) => {
        const text = [e.hersteller, e.modell, e.motorcode, e.kategorie].filter(Boolean).join(" ").toLowerCase();
        let n = 0;
        if (kats.includes(String(e.kategorie || "").toLowerCase())) n += 4;
        if (hersteller.includes(String(e.hersteller || "").toLowerCase())) n += 3;
        woerter.forEach((w) => { if (text.includes(w)) n += 2; });
        return n;
      };
      liste = alle.map((e, i) => ({ e, i, n: punkte(e) }))
        .sort((a, b) => b.n - a.n || a.i - b.i).map((x) => x.e);
    }
    // pro Seite andere Lexikon-Einträge
    const slots = Math.ceil((r.proSeite || 24) / 2);
    return { liste, start: liste.length ? ((seite() - 1) * slots) % liste.length : 0 };
  }

  // ── Karte bauen ────────────────────────────────────────────────────────────
  const cache = new Map();   // slug -> DOM-Knoten (wiederverwendet, kein Flackern)
  function karte(e) {
    if (cache.has(e.slug)) return cache.get(e.slug);
    const L = window.LexikonCard;
    const n = document.createElement("div");
    n.className = "lxr-cell";
    n.setAttribute("data-lexikon", e.slug);
    n.innerHTML =
      `<a class="lxr-tile" href="${DETAIL}${encodeURIComponent(e.slug)}">${L.render(e, "klein")}</a>`;
    cache.set(e.slug, n);
    return n;
  }

  // ── Ins Raster mischen ─────────────────────────────────────────────────────
  function anwenden(r) {
    const grid = document.getElementById(r.id);
    if (!grid) return;
    const kinder = Array.from(grid.children);
    const istLeer = kinder.some((c) => r.leer.some((sel) => c.matches(sel)));
    const echte = kinder.filter((c) => !c.hasAttribute("data-lexikon") && !r.leer.some((sel) => c.matches(sel)));
    if (!alle.length || istLeer || !echte.length) {
      kinder.filter((c) => c.hasAttribute("data-lexikon")).forEach((c) => c.remove());
      return;
    }
    const { liste, start } = reihenfolge(r);
    const gaps = abstaende(SEED * 31 + seite() * 7 + (r.suche ? 3 : 0), echte.length + 1);
    const soll = [];
    // Spaltenzahl des Rasters (Desktop 3, Handy 1–2) – nie zweimal dieselbe Spalte hintereinander
    const spalten = Math.max(1, (getComputedStyle(grid).gridTemplateColumns || "").split(" ").filter(Boolean).length);
    let k = 0, bisNaechste = gaps[0], letzteSpalte = -1;
    echte.forEach((c) => {
      soll.push(c);
      bisNaechste--;
      if (bisNaechste === 0 && spalten > 2 && soll.length % spalten === letzteSpalte) { bisNaechste = 1; return; }
      if (bisNaechste === 0 && k < liste.length) {
        letzteSpalte = soll.length % spalten;
        soll.push(karte(liste[(start + k) % liste.length]));
        k++;
        bisNaechste = gaps[k] || 2;
      }
    });
    const ist = kinder.filter((c) => soll.includes(c) || c.hasAttribute("data-lexikon"));
    if (ist.length === soll.length && ist.every((c, i) => c === soll[i])) return; // passt schon

    kinder.filter((c) => c.hasAttribute("data-lexikon") && !soll.includes(c)).forEach((c) => c.remove());
    soll.forEach((c, i) => {
      if (c.hasAttribute("data-lexikon") && soll[i - 1].nextElementSibling !== c) soll[i - 1].after(c);
    });
  }

  function stil() {
    if (document.getElementById("lxr-style")) return;
    const s = document.createElement("style");
    s.id = "lxr-style";
    s.textContent = `
      .lxr-cell{display:flex;flex-direction:column;min-width:0}
      .lxr-tile{display:block;flex:1;border-radius:12px;text-decoration:none;color:inherit}
      .lxr-tile>.lxc{height:100%}
      .lxr-credit{margin:7px 2px 0;font-size:11px;line-height:1.4;color:#7a93ae}
      .lxr-credit a{color:inherit;text-decoration:underline}
      .se-grid.list .lxr-cell{max-width:420px}
    `;
    document.head.appendChild(s);
  }

  async function start() {
    const aktiv = RASTER.filter((r) => document.getElementById(r.id));
    if (!aktiv.length) return;
    const [ok, daten] = await Promise.all([ladeKarte(), laden().catch(() => [])]);
    if (!ok) { console.warn("LEXIKON-RASTER: lexikon-card.js nicht gefunden"); return; }
    alle = daten;
    if (!alle.length) return;
    stil();
    aktiv.forEach((r) => {
      let t = null;
      const plan = () => { clearTimeout(t); t = setTimeout(() => anwenden(r), 40); };
      new MutationObserver(plan).observe(document.getElementById(r.id), { childList: true });
      anwenden(r);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
