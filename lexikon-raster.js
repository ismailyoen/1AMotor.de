// ══════════════════════════════════════════════════════════════════════════════
//  lexikon-raster.js  v2  —  1A Motor
//  Mischt die ORIGINALEN Motorenlexikon-Karten (LexikonCard, wie auf
//  motoren-lexikon.html) zwischen die Inserate:
//    • Startseite  (#home-listing-grid)
//    • Suche       (#se-grid)
//  Jede DRITTE Karte ist ein Lexikon-Beitrag: Inserat, Inserat, Lexikon …
//
//  • Nur veröffentlichte Lexikon-Einträge (status = veroeffentlicht).
//  • In der Suche passen die Lexikon-Karten zum Suchbegriff / zur Kategorie,
//    wenn es passende Einträge gibt – sonst gemischt. Jede Seite der
//    Pagination zeigt andere Einträge.
//  • Foto-Nachweis (Urheber, Lizenz, Commons) steht unter jeder Karte.
//  • Läuft unabhängig: ein MutationObserver setzt die Karten nach jedem
//    Neuaufbau des Rasters (Filter, Sortierung, Sprache, Partner) neu.
//
//  Einbinden – jeweils GANZ UNTEN vor </body>:
//    <script src="lexikon-raster.js?v=2" defer></script>
//  (lexikon-card.js wird automatisch nachgeladen, falls es fehlt.)
// ══════════════════════════════════════════════════════════════════════════════
(function () {
  "use strict";

  const RASTER = [
    { id: "home-listing-grid", leer: [".empty-box"] },
    { id: "se-grid", leer: [".se-empty", ".se-loading"], suche: true, proSeite: 24 },
  ];
  const JEDE_N_TE = 3;                       // jede 3. Karte = Lexikon
  const DETAIL = "motor-info.html?m=";
  const FELDER = "slug,hersteller,modell,motorcode,kategorie,kraftstoff,bauart,zylinder,hubraum_ccm," +
    "leistung_kw,drehmoment_nm,spannung_v,drehzahl,baujahre,bild_url,bild_urheber,bild_lizenz,bild_lizenz_url,bild_seite";

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

  // ── lexikon-card.js sicherstellen ──────────────────────────────────────────
  function ladeKarte() {
    if (window.LexikonCard) return Promise.resolve(true);
    return new Promise((ok) => {
      const s = document.createElement("script");
      s.src = "lexikon-card.js?v=" + Math.floor(Date.now() / 864e5); // täglich frisch
      s.onload = () => ok(!!window.LexikonCard);
      s.onerror = () => ok(false);
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

  // In der Suche: passende Einträge nach vorn
  function reihenfolge(r) {
    if (!r.suche) return { liste: alle, start: 0 };
    const p = new URLSearchParams(location.search);
    const kats = (p.get("category") || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const woerter = (p.get("q") || "").toLowerCase().split(/\s+/).filter((w) => w.length > 1);
    const hersteller = (p.get("hersteller") || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const seite = Math.max(1, parseInt(p.get("page"), 10) || 1);
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
    const slots = Math.floor((r.proSeite || 24) / (JEDE_N_TE - 1));
    return { liste, start: liste.length ? ((seite - 1) * slots) % liste.length : 0 };
  }

  // ── Karte bauen (Original-Lexikonkarte) ────────────────────────────────────
  const cache = new Map();   // slug -> DOM-Knoten (wiederverwendet, kein Flackern)
  function karte(e) {
    if (cache.has(e.slug)) return cache.get(e.slug);
    const L = window.LexikonCard;
    const n = document.createElement("div");
    n.className = "lxr-cell";
    n.setAttribute("data-lexikon", e.slug);
    n.innerHTML =
      `<a class="lxr-tile" href="${DETAIL}${encodeURIComponent(e.slug)}">${L.render(e, "klein")}</a>` +
      (e.bild_url && L.bildnachweis ? `<p class="lxr-credit">${L.bildnachweis(e)}</p>` : "");
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
    const soll = [];
    let k = 0;
    echte.forEach((c, i) => {
      soll.push(c);
      if ((i + 1) % (JEDE_N_TE - 1) === 0 && k < liste.length) {
        soll.push(karte(liste[(start + k) % liste.length]));
        k++;
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
      .lxr-tile{display:block;flex:1;border-radius:14px;transition:transform .2s,box-shadow .2s;text-decoration:none}
      .lxr-tile:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(13,27,42,.18)}
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
