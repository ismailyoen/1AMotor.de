/**
 * 1amotor.de – SEO-/Indexierungs-Middleware für Cloudflare Pages
 * ================================================================
 * Läuft auf Cloudflare vor jeder HTML-Seite und behebt, was die Google
 * Search Console unter „Nicht indexiert“ meldet:
 *
 *  1. Canonicals, og:url, JSON-LD und Links zeigen auf URLs OHNE ".html"
 *     (Cloudflare leitet /seite.html per 308 auf /seite um – ein Canonical
 *     auf eine Weiterleitung ignoriert Google).
 *  2. Anzeigen (/listing-detail?id=…) und Lexikon (/motor-info?m=…) bekommen
 *     Titel, Description, Canonical und H1 schon im HTML – nicht erst per JS.
 *  3. Gelöschte/abgelaufene Anzeigen und Lexikon-Einträge liefern echten
 *     Status 410 (Gone) statt 200 + „nicht gefunden“ (= Soft 404).
 *  4. Suchseiten mit Freitext/mehreren Filtern → noindex, follow.
 *     Reine Kategorie-/Zustandsseiten behalten einen sauberen Canonical.
 *  5. Private Seiten (Login, Dashboard, Admin …) → X-Robots-Tag: noindex.
 *  6. /sitemap.xml wird live aus Supabase gebaut (alle Anzeigen, Lexikon,
 *     Kategorien mit Anzeigen) und 1 Stunde gecacht.
 *
 * Sicherheitsnetz: Ist Supabase nicht erreichbar oder passiert ein Fehler,
 * wird die Seite unverändert ausgeliefert. Die Website kann dadurch nicht
 * kaputtgehen.
 *
 * Optional im Cloudflare-Dashboard (Pages → Settings → Variables):
 *   SUPABASE_URL, SUPABASE_ANON_KEY – sonst gelten die Werte unten.
 */

const SITE = "https://1amotor.de";
const DEFAULT_SB_URL = "https://xaqfptumjkmulobdbfid.supabase.co";
// Öffentlicher Publishable Key – steht ohnehin im Frontend (supabase.js).
const DEFAULT_SB_KEY = "sb_publishable_FK-FiDrd5gjFEj7LxVPZIg_5WXkNvgG";

// Seiten, die nie in Google sollen
const PRIVATE = new Set([
  "/dashboard", "/profil", "/anfragen", "/meine-anzeigen", "/meine-anfragen",
  "/anzeige-erstellen", "/admin", "/admin-import", "/lexikon-admin", "/login",
]);

// Öffentliche Standardseiten für die Sitemap
const SITEMAP_PAGES = [
  "/", "/suche", "/motoren-lexikon", "/ratgeber", "/motorsport-news",
  "/tofas-motor", "/ueber-uns", "/kontakt", "/karriere", "/1AAdvent",
  "/impressum", "/datenschutz", "/agb",
];
const SITEMAP_CONDITIONS = ["Neu", "Gebraucht", "Generalueberholt"];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATIC_EXT = /\.(?:js|mjs|css|png|jpe?g|webp|avif|gif|svg|ico|woff2?|ttf|otf|json|txt|webmanifest|map|mp4|webm|mp3|pdf|zip)$/i;
const TRACKING = /^(?:utm_\w+|fbclid|gclid|gbraid|wbraid|msclkid|mc_\w+|ref|_ga)$/i;

/* ───────────────────────── Einstieg ───────────────────────── */

export async function onRequest(ctx) {
  const { request, next } = ctx;
  const url = new URL(request.url);
  const path = url.pathname;

  if ((request.method !== "GET" && request.method !== "HEAD") ||
      STATIC_EXT.test(path) || path.startsWith("/cdn-cgi/")) {
    return next();
  }

  if (path === "/sitemap.xml") {
    try { return await sitemap(ctx); } catch (e) { return next(); }
  }

  const res = await next();
  const type = res.headers.get("content-type") || "";
  if (res.status !== 200 || !type.includes("text/html")) return res;

  try {
    return await rewritePage(ctx, url, res);
  } catch (e) {
    return res; // Fehler → Seite unverändert ausliefern
  }
}

/* ───────────────────────── Seiten umschreiben ───────────────────────── */

function cleanPath(p) {
  let c = p.replace(/\.html$/i, "").replace(/\/+$/, "");
  if (c === "" || c === "/index") c = "/";
  return c;
}

function realParams(sp) {
  return [...new Set([...sp.keys()])].filter((k) => !TRACKING.test(k));
}

async function rewritePage(ctx, url, res) {
  const clean = cleanPath(url.pathname);
  const sp = url.searchParams;

  if (PRIVATE.has(clean)) {
    const out = new Response(res.body, res);
    out.headers.set("X-Robots-Tag", "noindex, nofollow");
    return out;
  }

  // plan = was auf dieser Seite gesetzt wird
  const plan = {
    status: 200,
    canonical: SITE + clean,
    robots: null,
    title: null,
    desc: null,
    image: null,
    fill: {},              // id → { text } oder { html }
    fixMotorCanonical: false,
  };

  if (clean === "/listing-detail") {
    await planListing(ctx, sp, plan);
  } else if (clean === "/motor-info") {
    await planMotor(ctx, sp, plan);
  } else if (clean === "/suche") {
    planSearch(sp, plan);
  } else if (clean === "/haendler") {
    const id = (sp.get("id") || sp.get("seller") || "").trim();
    if (id) plan.canonical = `${SITE}/haendler?id=${encodeURIComponent(id)}`;
    else { plan.canonical = null; plan.robots = "noindex, follow"; }
  }

  const rw = buildRewriter(plan);
  const transformed = rw.transform(res);
  const headers = new Headers(transformed.headers);
  if (plan.status !== 200) headers.set("X-Robots-Tag", "noindex");
  return new Response(transformed.body, { status: plan.status, headers });
}

/* Anzeige: /listing-detail?id=<uuid> */
async function planListing(ctx, sp, plan) {
  const id = (sp.get("id") || "").trim();
  if (!UUID.test(id)) {
    plan.status = 404; plan.robots = "noindex"; plan.canonical = null;
    return;
  }
  plan.canonical = `${SITE}/listing-detail?id=${id}`;

  let rows;
  try {
    rows = await sb(ctx, `listings?id=eq.${id}&status=eq.Freigegeben` +
      `&select=id,title,manufacturer,model,condition,price,year,location,description,image_urls,categories(name)&limit=1`);
  } catch (e) {
    return; // Supabase nicht erreichbar → nur Canonical setzen
  }
  const l = rows && rows[0];
  if (!l) {
    plan.status = 410; plan.robots = "noindex"; plan.canonical = null;
    return;
  }

  const cat = (Array.isArray(l.categories) ? l.categories[0]?.name : l.categories?.name) || "Sonstige";
  const name = l.title || [l.manufacturer, l.model].filter(Boolean).join(" ") || "Motor";
  const price = Number(l.price || 0);
  const priceShort = price > 0 ? `${zahl(price)} €` : "Preis auf Anfrage";
  const priceLong = price > 0 ? `${zahl(price, 2, true)} €` : "Preis auf Anfrage";
  const bits = [l.condition, l.year ? "Bj. " + l.year : "", l.location, priceShort].filter(Boolean).join(" · ");

  plan.title = `${name}${cat !== "Sonstige" ? " – " + cat : ""} | 1A Motor`;
  plan.desc = `${name}: ${bits}. ${l.description || "Jetzt direkt beim Anbieter auf 1A Motor anfragen."}`
    .replace(/\s+/g, " ").slice(0, 155);
  const imgs = Array.isArray(l.image_urls) ? l.image_urls.filter(Boolean) : [];
  if (imgs[0]) plan.image = imgs[0];

  plan.fill["listing-title"] = { text: l.title || "Ohne Titel" };
  plan.fill["listing-sub"] = { text: [cat !== "Sonstige" ? cat : "", l.manufacturer, l.model].filter(Boolean).join(" · ") };
  plan.fill["listing-price"] = { text: priceLong };
  plan.fill["listing-location"] = { text: "📍 " + (l.location || "–") };
  if (l.description) {
    plan.fill["description-box"] = { html: `<p>${esc(l.description).replace(/\r?\n/g, "<br>")}</p>` };
  }
}

/* Lexikon: /motor-info?m=<slug> */
async function planMotor(ctx, sp, plan) {
  plan.fixMotorCanonical = true;
  const slug = (sp.get("m") || "").trim();
  if (!slug) {
    plan.status = 404; plan.robots = "noindex"; plan.canonical = null;
    return;
  }
  plan.canonical = `${SITE}/motor-info?m=${encodeURIComponent(slug)}`;

  let rows;
  try {
    rows = await sb(ctx, `motor_lexikon?slug=eq.${encodeURIComponent(slug)}&status=eq.veroeffentlicht` +
      `&select=slug,hersteller,modell,motorcode,leistung_kw,hubraum_ccm,kraftstoff,einsatz,bild_url&limit=1`);
  } catch (e) {
    return;
  }
  const e = rows && rows[0];
  if (!e) {
    plan.status = 410; plan.robots = "noindex"; plan.canonical = null;
    return;
  }

  // gleiche Logik wie motor-info.html / lexikon-card.js
  const titel = [e.hersteller, e.modell].filter(Boolean).join(" ") || "Motor";
  const name = titel + (e.motorcode && e.motorcode !== e.modell ? ` (${e.motorcode})` : "");
  const psWert = e.leistung_kw ? Math.round(Number(e.leistung_kw) * 1.35962) : null;
  const teile = [
    e.leistung_kw ? `${zahl(e.leistung_kw, 1)} kW / ${psWert} PS` : "",
    e.hubraum_ccm ? `${zahl(e.hubraum_ccm)} cm³` : "",
    e.kraftstoff || "",
  ].filter(Boolean).join(", ");

  plan.title = `${name}${teile ? " – " + teile : ""} | 1A Motor`;
  plan.desc = `${name}: technische Daten${teile ? " (" + teile + ")" : ""}${e.einsatz ? ", verbaut in " + e.einsatz : ""}. Im Motorenlexikon von 1A Motor.`.slice(0, 158);
  if (e.bild_url) plan.image = e.bild_url;
  plan.fill["h1"] = { text: (e.modell || titel) + (e.motorcode && e.motorcode !== e.modell ? " · " + e.motorcode : "") };
}

/* Suche: nur reine Kategorie-/Zustandsseiten indexieren */
function planSearch(sp, plan) {
  const keys = realParams(sp);
  if (keys.length === 0) { plan.canonical = SITE + "/suche"; return; }
  if (keys.length === 1 && (keys[0] === "category" || keys[0] === "condition")) {
    const vals = sp.getAll(keys[0]).map((v) => v.trim()).filter(Boolean);
    if (vals.length === 1) {
      plan.canonical = SITE + "/suche?" + new URLSearchParams({ [keys[0]]: vals[0] }).toString();
      return;
    }
  }
  plan.canonical = null;
  plan.robots = "noindex, follow";
}

/* ───────────────────────── HTMLRewriter ───────────────────────── */

// "seite.html?x" → "seite?x", "/index.html" → "/", absolute 1amotor.de-URLs ebenso
function cleanHref(h) {
  if (!h) return null;
  const m = h.match(/^((?:https?:\/\/(?:www\.)?1amotor\.de)?\/?)([A-Za-z0-9_-]+)\.html((?:[?#].*)?)$/);
  if (!m) return null;
  const prefix = m[1], page = m[2], rest = m[3];
  if (page === "index") return (prefix === "" ? "./" : prefix.endsWith("/") ? prefix : prefix + "/") + rest;
  return prefix + page + rest;
}

function cleanScript(src, fixMotorCanonical) {
  let s = src.replace(/(https:\/\/(?:www\.)?1amotor\.de\/)([A-Za-z0-9_-]+)\.html/g,
    (all, base, page) => (page === "index" ? base : base + page));
  if (fixMotorCanonical) {
    // vorhandenes <link rel="canonical"> wiederverwenden statt ein zweites anzuhängen
    s = s.replace(
      /const can = document\.createElement\("link"\);/,
      `const can = document.querySelector('link[rel="canonical"]') || document.createElement("link");`);
  }
  return s;
}

function buildRewriter(plan) {
  const state = { canonical: false, robots: false, desc: false };
  const rw = new HTMLRewriter();

  if (plan.title) {
    rw.on("title", { element(el) { el.setInnerContent(plan.title); } });
    rw.on('meta[property="og:title"], meta[name="twitter:title"]', {
      element(el) { el.setAttribute("content", plan.title); },
    });
  }
  if (plan.desc) {
    rw.on('meta[name="description"]', {
      element(el) { state.desc = true; el.setAttribute("content", plan.desc); },
    });
    rw.on('meta[property="og:description"], meta[name="twitter:description"]', {
      element(el) { el.setAttribute("content", plan.desc); },
    });
  }
  if (plan.image) {
    rw.on('meta[property="og:image"], meta[name="twitter:image"]', {
      element(el) { el.setAttribute("content", plan.image); },
    });
  }

  // Canonical: ersetzen, Duplikate entfernen, bei Bedarf ganz entfernen
  rw.on('link[rel="canonical"]', {
    element(el) {
      if (!plan.canonical || state.canonical) { el.remove(); return; }
      state.canonical = true;
      el.setAttribute("href", plan.canonical);
    },
  });
  rw.on('meta[property="og:url"]', {
    element(el) { if (plan.canonical) el.setAttribute("content", plan.canonical); },
  });

  // Robots-Meta
  rw.on('meta[name="robots"], meta[name="googlebot"]', {
    element(el) {
      if (!plan.robots) return;
      if (state.robots) { el.remove(); return; }
      state.robots = true;
      el.setAttribute("name", "robots");
      el.setAttribute("content", plan.robots);
    },
  });

  // Fehlende Tags am Ende von <head> ergänzen
  rw.on("head", {
    element(el) {
      el.onEndTag((end) => {
        let add = "";
        if (plan.canonical && !state.canonical) add += `<link rel="canonical" href="${esc(plan.canonical)}" />\n`;
        if (plan.robots && !state.robots) add += `<meta name="robots" content="${esc(plan.robots)}" />\n`;
        if (plan.desc && !state.desc) add += `<meta name="description" content="${esc(plan.desc)}" />\n`;
        if (add) end.before(add, { html: true });
      });
    },
  });

  // Inhalte vorbefüllen (H1, Preis, Beschreibung …) – JS überschreibt sie später gleich
  for (const [id, val] of Object.entries(plan.fill)) {
    rw.on(`#${id}`, {
      element(el) {
        if (val.html != null) el.setInnerContent(val.html, { html: true });
        else el.setInnerContent(val.text);
      },
    });
  }

  // Interne Links ohne .html
  rw.on("a[href]", {
    element(el) {
      const c = cleanHref(el.getAttribute("href"));
      if (c != null) el.setAttribute("href", c);
    },
  });

  // Inline-Skripte & JSON-LD: absolute 1amotor.de/…html-URLs bereinigen
  let buf = "";
  let skip = false;
  rw.on("script", {
    element(el) { skip = el.hasAttribute("src"); buf = ""; },
    text(chunk) {
      if (skip) return;
      buf += chunk.text;
      if (chunk.lastInTextNode) {
        chunk.replace(cleanScript(buf, plan.fixMotorCanonical), { html: true });
        buf = "";
      } else {
        chunk.remove();
      }
    },
  });

  return rw;
}

/* ───────────────────────── Sitemap ───────────────────────── */

async function sitemap(ctx) {
  const cache = caches.default;
  const key = new Request(SITE + "/sitemap.xml?__gen=1");
  const hit = await cache.match(key);
  if (hit) return hit;

  const [listings, lexikon, cats] = await Promise.all([
    sbAll(ctx, "listings?select=id,created_at,category_id&status=eq.Freigegeben&order=created_at.desc"),
    sbAll(ctx, "motor_lexikon?select=slug,created_at,updated_at&status=eq.veroeffentlicht&order=slug.asc"),
    sbAll(ctx, "categories?select=id,name&order=name.asc"),
  ]);

  const used = new Set(listings.map((l) => l.category_id).filter(Boolean));
  const day = (d) => (d ? String(d).slice(0, 10) : null);
  const urls = [];
  const add = (loc, lastmod) => urls.push({ loc, lastmod });

  for (const p of SITEMAP_PAGES) add(SITE + p);
  for (const c of cats) if (used.has(c.id) && c.name) add(SITE + "/suche?" + new URLSearchParams({ category: c.name }));
  for (const c of SITEMAP_CONDITIONS) add(SITE + "/suche?" + new URLSearchParams({ condition: c }));
  for (const e of lexikon) if (e.slug) add(`${SITE}/motor-info?m=${encodeURIComponent(e.slug)}`, day(e.updated_at || e.created_at));
  for (const l of listings.slice(0, 45000)) add(`${SITE}/listing-detail?id=${l.id}`, day(l.created_at));

  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`).join("\n") +
    "\n</urlset>\n";

  const resp = new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
  ctx.waitUntil(cache.put(key, resp.clone()));
  return resp;
}

/* ───────────────────────── Supabase ───────────────────────── */

async function sb(ctx, query) {
  const base = (ctx.env && ctx.env.SUPABASE_URL) || DEFAULT_SB_URL;
  const key = (ctx.env && ctx.env.SUPABASE_ANON_KEY) || DEFAULT_SB_KEY;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const r = await fetch(`${base}/rest/v1/${query}`, {
      headers: { apikey: key, Accept: "application/json" },
      signal: ctrl.signal,
      cf: { cacheTtl: 300, cacheEverything: true }, // 5 Min. Edge-Cache
    });
    if (!r.ok) throw new Error("Supabase " + r.status);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

async function sbAll(ctx, query) {
  const size = 1000;
  const all = [];
  for (let page = 0; page < 45; page++) {
    const rows = await sb(ctx, `${query}&limit=${size}&offset=${page * size}`);
    all.push(...rows);
    if (rows.length < size) break;
  }
  return all;
}

/* ───────────────────────── Helfer ───────────────────────── */

function esc(v) {
  return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// deutsche Zahl: 5000 → "5.000", 176.5 → "176,5"; fixed=true → immer n Nachkommastellen
function zahl(n, stellen = 0, fixed = false) {
  if (n == null || n === "") return null;
  const x = Number(n);
  let [i, d = ""] = Math.abs(x).toFixed(stellen).split(".");
  if (!fixed) d = d.replace(/0+$/, "");
  i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return (x < 0 ? "-" : "") + i + (d ? "," + d : "");
}
