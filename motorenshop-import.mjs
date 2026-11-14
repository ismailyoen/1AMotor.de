#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════
   1A Motor – Partner-Import motorenshop.eu  (motorenshop-import.mjs)
   v1 · 14.11.2026
   ------------------------------------------------------------------
   Liest ALLE Motoren von motorenshop.eu (Motoren → jede Marke → jedes
   Produkt) und legt sie als Inserate im Verkäuferkonto des Partners an.
   Preise, Titel und Beschreibung werden 1:1 übernommen – nichts wird
   umgerechnet oder umformuliert. Nur Produkte MIT Bild werden angelegt.

   Aufruf (im Terminal, in diesem Ordner):
     node motorenshop-import.mjs            → Probelauf, schreibt nur
                                              vorschau.json + vorschau.csv
     node motorenshop-import.mjs --live     → legt die Inserate wirklich an
     node motorenshop-import.mjs --marke mazda   → nur eine Marke (Test)

   Für --live muss der Supabase-Secret-Key in der Umgebung stehen:
     export SUPABASE_SERVICE_KEY="…"   (nie in eine Datei, nie in einen Chat)

   WICHTIG: Diese Datei gehört NICHT ins öffentliche Repo.
   Braucht Node 18 oder neuer, keine Zusatzpakete.
   ══════════════════════════════════════════════════════════════════ */

import { writeFile } from "node:fs/promises";

/* ── Einstellungen ───────────────────────────────────────────────── */
const SHOP          = "https://motorenshop.eu";
const SUPABASE_URL  = "https://xaqfptumjkmulobdbfid.supabase.co";
const BUCKET        = "listing-images";
const SOURCE        = "motorenshop.eu";
// Die beiden IDs des Partnerkontos (Auth-User-ID und/oder Profil-ID) –
// das Skript findet selbst heraus, welche welche ist.
const ACCOUNT_IDS   = ["a5c6ff33-940d-4f2c-99fd-960d15d57565", "eb4134f9-8d49-4eb3-87cd-106b849797bc"];
const KATEGORIE     = process.env.KATEGORIE || "";   // optional: Kategorie-Slug erzwingen
const MAX_BILDER    = 8;
const BILD_BREITE   = 1200;
const PAUSE_MS      = 400;                            // höflich bleiben: Pause zwischen Abrufen
const UA            = "1amotor.de Partner-Import (kontakt@1amotor.de)";

// Marken aus dem Menü „Motoren“ – nur Reserve, falls die Markenlinks
// nicht automatisch gefunden werden. Unbekannte Seiten werden übersprungen.
const MARKEN_RESERVE = ["alfa-romeo","audi","bmw","chevrolet","chrysler","citroen","dacia","daihatsu",
  "fiat","ford","honda","hyundai","jaguar","jeep","kia","lamborghini","lancia","land-rover","maserati",
  "mazda","mercedes-benz","mini","mitsubishi","nissan","opel","peugeot","porsche","renault","rolls-royce",
  "rover","seat","skoda","subaru","suzuki","toyota","volvo","vw","volkswagen","smart","saab","iveco"];

const ARGS  = process.argv.slice(2);
const LIVE  = ARGS.includes("--live");
const NUR   = ARGS.includes("--marke") ? String(ARGS[ARGS.indexOf("--marke") + 1] || "").toLowerCase() : "";
const KEY   = process.env.SUPABASE_SERVICE_KEY || "";

/* ── Kleine Helfer ───────────────────────────────────────────────── */
const sleep = ms => new Promise(r => setTimeout(r, ms));
const log   = (...a) => console.log(...a);

async function holeText(url) {
  await sleep(PAUSE_MS);
  for (let versuch = 1; versuch <= 3; versuch++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "de-DE,de" }, redirect: "follow" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.text();
    } catch (e) {
      if (versuch === 3) { log("   ! nicht abrufbar:", url, "–", e.message); return null; }
      await sleep(1500 * versuch);
    }
  }
}

export function entitaeten(s) {
  return String(s)
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0*39;|&apos;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&euro;/g, "€")
    .replace(/&auml;/g, "ä").replace(/&ouml;/g, "ö").replace(/&uuml;/g, "ü")
    .replace(/&Auml;/g, "Ä").replace(/&Ouml;/g, "Ö").replace(/&Uuml;/g, "Ü").replace(/&szlig;/g, "ß")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

export function htmlZuText(html) {
  return entitaeten(String(html)
    .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|section|ul|ol|table)>/gi, "\n")
    .replace(/<[^>]+>/g, ""))
    .replace(/[ \t ]+/g, " ")
    .split("\n").map(z => z.trim()).join("\n")
    .replace(/\n{3,}/g, "\n\n").trim();
}

function meta(html, name) {
  const re1 = new RegExp('<meta[^>]+(?:property|name|itemprop)=["\']' + name + '["\'][^>]*content=["\']([^"\']*)["\']', "i");
  const re2 = new RegExp('<meta[^>]+content=["\']([^"\']*)["\'][^>]*(?:property|name|itemprop)=["\']' + name + '["\']', "i");
  const m = html.match(re1) || html.match(re2);
  return m ? entitaeten(m[1]).trim() : "";
}

/* „1.779,00“ → 1779 */
export function preisZahl(s) {
  const n = Number(String(s).replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/* Alle Produktbilder einer Seite (Shop-Bildserver), ohne Größenangabe, ohne Doppelte */
export function bilder(html) {
  const roh = entitaeten(html).replace(/\\u0026/g, "&").replace(/\\\//g, "/");
  const re = /(?:https?:\/\/(?:www\.)?motorenshop\.eu)?\/storage\/images\/image\?remote=([^"'\s<>&\\]+)/g;
  const gefunden = new Map();
  let m;
  while ((m = re.exec(roh))) {
    let remote; try { remote = decodeURIComponent(m[1]); } catch { remote = m[1]; }
    if (!/\.(jpe?g|png|webp)(\?|$)/i.test(remote)) continue;
    if (!gefunden.has(remote)) gefunden.set(remote, remote);
  }
  return [...gefunden.keys()];
}
const bildUrl = (remote, shopId) =>
  SHOP + "/storage/images/image?remote=" + encodeURIComponent(remote) + (shopId ? "&shop=" + shopId : "") +
  "&width=" + BILD_BREITE + "&height=" + BILD_BREITE;

/* ── Produktseite auslesen ───────────────────────────────────────── */
export function leseProdukt(html, url, marke, globaleBilder = new Set()) {
  const text   = htmlZuText(html);
  const zeilen = text.split("\n");

  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  let titel = meta(html, "og:title") || (h1 ? htmlZuText(h1[1]) : "");
  titel = titel.replace(/\s+[-–|]\s+MOTORENSHOP\.EU\s*$/i, "").trim();

  // Preis: zuerst die maschinenlesbare Angabe, sonst die Preise im Text
  let preis = null, alterPreis = null, preisQuelle = "";
  const mp = meta(html, "product:price:amount") || meta(html, "og:price:amount") || meta(html, "price");
  if (mp && preisZahl(mp.includes(",") ? mp : mp.replace(/\./g, ",")) !== null) {
    preis = Number(mp.replace(",", ".")); preisQuelle = "meta";
  }
  const iTitel = Math.max(0, zeilen.findIndex(z => z === titel));
  const iBesch = zeilen.findIndex((z, i) => i > iTitel && /^Beschreibung$/i.test(z));
  const kopf   = zeilen.slice(iTitel, iBesch > 0 ? iBesch : iTitel + 40).join("\n");
  const imText = [...kopf.matchAll(/(\d{1,3}(?:\.\d{3})*,\d{2})\s*€/g)].map(x => preisZahl(x[1])).filter(x => x !== null);
  if (imText.length) {
    const min = Math.min(...imText), max = Math.max(...imText);
    if (preis === null) { preis = min; preisQuelle = "text"; }
    if (max > preis) alterPreis = max;
  }

  // Beschreibung: alles zwischen „Beschreibung“ und „Zusätzliche Produktinformationen“
  let beschreibung = "";
  if (iBesch > 0) {
    let ende = zeilen.findIndex((z, i) => i > iBesch && /^(Zusätzliche Produktinformationen|Weitere Produktinformationen|Herstellerinformationen|Zubehör|Bewertungen)/i.test(z));
    if (ende < 0) ende = zeilen.length;
    beschreibung = zeilen.slice(iBesch + 1, ende).join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }
  if (!beschreibung) beschreibung = meta(html, "og:description") || meta(html, "description");

  const lieferzeit = (text.match(/Lieferzeit:\s*([^\n]{1,40}?)(?:Menge|\n|$)/i) || [])[1]?.trim() || "";
  const aufLager   = /Auf Lager/i.test(kopf);
  const shopId     = (html.match(/shop=(\d+)/) || html.match(/Shops(?:\/|%2F)(\d+)/i) || [])[1] || "";
  const bildListe  = bilder(html).filter(b => !globaleBilder.has(b)).slice(0, MAX_BILDER).map(b => bildUrl(b, shopId));

  const motorcode  = (titel.match(/^([A-Z0-9][A-Z0-9-]{1,11})\s/) || [])[1] || "";
  const zustand    = /überholt|instandgesetzt|generalüberholt/i.test(titel) ? "Generalüberholt" : "Gebraucht";

  return { url, marke, titel, preis, alterPreis, preisQuelle, beschreibung, lieferzeit, aufLager,
           motorcode, zustand, bilder: bildListe };
}

/* ── Shop durchgehen ─────────────────────────────────────────────── */
function markenName(slug) {
  const sonder = { "bmw": "BMW", "vw": "VW", "mercedes-benz": "Mercedes-Benz", "rolls-royce": "Rolls Royce", "alfa-romeo": "Alfa Romeo", "land-rover": "Land Rover" };
  return sonder[slug] || slug.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

async function sammle() {
  log("1/3  Marken suchen …");
  const start = await holeText(SHOP + "/c/motoren") || "";
  const globaleBilder = new Set(bilder(start));
  let marken = [...new Set([...start.matchAll(/\/c\/motoren\/([a-z0-9-]+)/g)].map(m => m[1]))];
  if (marken.length < 5) { log("     Markenlinks nicht gefunden – nehme die Reserve-Liste."); marken = MARKEN_RESERVE; }
  if (NUR) marken = marken.filter(m => m === NUR).length ? [NUR] : [NUR];

  log("2/3  Produkte je Marke sammeln …");
  const links = new Map();   // Produkt-URL → Marke
  for (const slug of marken) {
    let neuGesamt = 0;
    for (let seite = 1; seite <= 40; seite++) {
      const html = await holeText(SHOP + "/c/motoren/" + slug + (seite > 1 ? "?page=" + seite : ""));
      if (!html) break;
      let neu = 0;
      for (const m of html.matchAll(/\/p\/([a-z0-9][a-z0-9-]*)/g)) {
        const u = SHOP + "/p/" + m[1];
        if (!links.has(u)) { links.set(u, markenName(slug)); neu++; }
      }
      neuGesamt += neu;
      if (neu === 0) break;                 // keine weitere Seite
    }
    if (neuGesamt) log("     " + markenName(slug).padEnd(16) + neuGesamt);
  }

  log("3/3  " + links.size + " Produktseiten lesen …");
  const produkte = [];
  let n = 0;
  for (const [url, marke] of links) {
    n++;
    const html = await holeText(url);
    if (!html) continue;
    const p = leseProdukt(html, url, marke, globaleBilder);
    produkte.push(p);
    if (n % 25 === 0) log("     " + n + " / " + links.size);
  }
  return produkte;
}

/* ── Supabase ────────────────────────────────────────────────────── */
const sbKopf = extra => ({ apikey: KEY, Authorization: "Bearer " + KEY, ...extra });
async function sb(pfad, opt = {}) {
  const res = await fetch(SUPABASE_URL + pfad, { ...opt, headers: sbKopf({ "Content-Type": "application/json", ...(opt.headers || {}) }) });
  const txt = await res.text();
  let daten = null; try { daten = txt ? JSON.parse(txt) : null; } catch { daten = txt; }
  if (!res.ok) { const e = new Error("Supabase " + res.status + ": " + txt.slice(0, 300)); e.status = res.status; throw e; }
  return daten;
}

async function ladeBildHoch(quelle, userId, index) {
  const res = await fetch(quelle, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error("Bild HTTP " + res.status);
  const typ = (res.headers.get("content-type") || "image/jpeg").split(";")[0];
  if (!/^image\//.test(typ)) throw new Error("kein Bild (" + typ + ")");
  const daten = Buffer.from(await res.arrayBuffer());
  const endung = typ.includes("png") ? "png" : typ.includes("webp") ? "webp" : "jpg";
  const pfad = userId + "/" + Date.now() + "-" + index + "-" + Math.random().toString(36).slice(2, 8) + "." + endung;
  const up = await fetch(SUPABASE_URL + "/storage/v1/object/" + BUCKET + "/" + pfad, {
    method: "POST", headers: sbKopf({ "Content-Type": typ, "x-upsert": "true" }), body: daten });
  if (!up.ok) throw new Error("Upload " + up.status + ": " + (await up.text()).slice(0, 200));
  return SUPABASE_URL + "/storage/v1/object/public/" + BUCKET + "/" + pfad;
}

async function importiere(produkte) {
  const ids = ACCOUNT_IDS.join(",");
  const profile = await sb("/rest/v1/seller_profiles?or=(id.in.(" + ids + "),user_id.in.(" + ids + "))&select=id,user_id,company_name");
  if (!profile || profile.length !== 1) {
    throw new Error("Verkäuferprofil nicht eindeutig gefunden (" + (profile ? profile.length : 0) + " Treffer). " +
      "Bitte einmal mit dem neuen Konto einloggen, damit das Profil angelegt ist.");
  }
  const verkaeufer = profile[0];
  log("Konto: " + (verkaeufer.company_name || "(ohne Namen)") + "  · Profil " + verkaeufer.id);

  const kats = await sb("/rest/v1/categories?select=id,name,slug");
  const kat = KATEGORIE ? kats.find(k => k.slug === KATEGORIE)
    : kats.find(k => /(^|[^a-z])(pkw|kfz)([^a-z]|$)/i.test(k.slug + " " + k.name)) || kats.find(k => /auto/i.test(k.slug));
  if (!kat) throw new Error("Kategorie nicht gefunden. Vorhanden: " + kats.map(k => k.slug).join(", ") +
    "\nBitte so starten:  KATEGORIE=<slug> node motorenshop-import.mjs --live");
  log("Kategorie: " + kat.name + " (" + kat.slug + ")");

  try { await sb("/rest/v1/listings?select=external_url&limit=1"); }
  catch { throw new Error("Spalte external_url fehlt. Bitte zuerst motorenshop.sql im Supabase-SQL-Editor ausführen."); }

  const vorhanden = await sb("/rest/v1/listings?seller_id=eq." + verkaeufer.id + "&select=id,external_url&limit=5000");
  const schonDa = new Map(vorhanden.filter(v => v.external_url).map(v => [v.external_url, v.id]));

  const bericht = { neu: 0, aktualisiert: 0, fehler: [] };
  let n = 0;
  for (const p of produkte) {
    n++;
    try {
      const basis = {
        title: p.titel, manufacturer: p.marke, model: p.motorcode || null, condition: p.zustand,
        price: p.preis, description: p.beschreibung, status: "Freigegeben",
        listing_type: "Verkauf", price_type: "Festpreis",
        external_url: p.url, external_source: SOURCE
      };
      if (schonDa.has(p.url)) {
        // Schon importiert → nur Preis/Text auffrischen, Bilder bleiben
        await sb("/rest/v1/listings?id=eq." + schonDa.get(p.url), { method: "PATCH", body: JSON.stringify(basis) });
        bericht.aktualisiert++;
      } else {
        const urls = [];
        for (let i = 0; i < p.bilder.length; i++) {
          try { urls.push(await ladeBildHoch(p.bilder[i], verkaeufer.user_id, i)); }
          catch (e) { log("   ! Bild übersprungen (" + p.titel + "): " + e.message); }
          await sleep(150);
        }
        if (!urls.length) throw new Error("kein Bild hochgeladen");
        await sb("/rest/v1/listings", { method: "POST", headers: { Prefer: "return=minimal" },
          body: JSON.stringify([{ ...basis, seller_id: verkaeufer.id, category_id: kat.id, image_urls: urls }]) });
        bericht.neu++;
      }
    } catch (e) {
      bericht.fehler.push({ titel: p.titel, url: p.url, fehler: e.message });
      log("   ! " + p.titel + " – " + e.message);
    }
    if (n % 10 === 0) log("     " + n + " / " + produkte.length);
  }
  return bericht;
}

/* ── Ablauf ──────────────────────────────────────────────────────── */
async function main() {
  if (LIVE && !KEY) { console.error('Für --live fehlt der Schlüssel:  export SUPABASE_SERVICE_KEY="…"'); process.exit(1); }
  log(LIVE ? "LIVE-LAUF – Inserate werden angelegt.\n" : "PROBELAUF – es wird nichts hochgeladen.\n");

  const alle = await sammle();
  const ok   = alle.filter(p => p.titel && p.preis && p.bilder.length);
  const raus = alle.filter(p => !(p.titel && p.preis && p.bilder.length))
                   .map(p => ({ titel: p.titel, url: p.url, grund: !p.bilder.length ? "kein Bild" : !p.preis ? "kein Preis" : "kein Titel" }));

  const paket = { stand: new Date().toISOString(), inserate: ok, uebersprungen: raus };
  await writeFile("vorschau.json", JSON.stringify(paket, null, 2));
  // Für motorenshop-admin.html (liegt im selben Ordner)
  await writeFile("daten.js", "window.MOTORENSHOP_DATEN = " + JSON.stringify(paket).replace(/</g, "\\u003c") + ";\n");
  const csv = ["Marke;Titel;Preis;Alter Preis;Preis-Quelle;Bilder;Zustand;Motorcode;URL",
    ...ok.map(p => [p.marke, p.titel, p.preis, p.alterPreis ?? "", p.preisQuelle, p.bilder.length, p.zustand, p.motorcode, p.url]
      .map(v => '"' + String(v).replace(/"/g, '""') + '"').join(";"))].join("\n");
  await writeFile("vorschau.csv", "﻿" + csv);

  log("\nGefunden: " + alle.length + "  ·  importierbar (mit Bild + Preis): " + ok.length + "  ·  übersprungen: " + raus.length);
  log("Gespeichert: daten.js (für motorenshop-admin.html), vorschau.csv, vorschau.json");

  if (!LIVE) { log("\nJetzt motorenshop-admin.html per Doppelklick öffnen, anmelden und auf „Hochladen“ drücken."); return; }

  const bericht = await importiere(ok);
  await writeFile("import-bericht.json", JSON.stringify(bericht, null, 2));
  log("\nFertig. Neu: " + bericht.neu + "  ·  aktualisiert: " + bericht.aktualisiert + "  ·  Fehler: " + bericht.fehler.length);
}

if (process.argv[1]?.endsWith("motorenshop-import.mjs")) {
  main().catch(e => { console.error("\nABBRUCH: " + e.message); process.exit(1); });
}
