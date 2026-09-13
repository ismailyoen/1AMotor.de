/**
 * haendler-live.js — Öffentliches Anbieter-/Händlerprofil für 1A Motor
 * Aufruf: haendler.html?id=<seller_profiles.id>
 *
 * Lädt: Profil (nur öffentliche Felder), alle freigegebenen Anzeigen des Anbieters,
 *       Bewertungen. E-Mail, Telefon, Anschrift, USt-ID und PayPal werden bewusst
 *       NICHT öffentlich ausgegeben — Kontakt läuft über das Anfrageformular der Anzeige.
 */
(function () {
  "use strict";

  var PUBLIC_COLS = "id, company_name, contact_name, city, country, website, description, specialization, response_time, languages, company_type";

  var state = {
    seller: null,
    listings: [],
    reviews: [],
    cat: "",
    sort: "new"
  };

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    var params = new URLSearchParams(window.location.search);
    var sellerId = params.get("id") || params.get("seller");

    if (!sellerId) {
      showError("Kein Anbieter ausgewählt.", "Öffne ein Profil über eine Anzeige oder die Suche.");
      return;
    }

    if (typeof supabaseClient === "undefined") {
      showError("Verbindung nicht möglich.", "Bitte die Seite neu laden.");
      return;
    }

    var seller = await loadSeller(sellerId);
    if (!seller) {
      showError("Anbieter nicht gefunden.", "Das Profil wurde entfernt oder die Adresse ist nicht korrekt.");
      return;
    }

    state.seller = seller;
    renderProfile(seller);

    var results = await Promise.all([loadListings(sellerId), loadReviews(sellerId)]);
    state.listings = results[0];
    state.reviews = results[1];

    buildCategoryFilter();
    renderListings();
    renderReviews();
    renderSeo();
    wireControls();
  }

  /* ── Daten laden ─────────────────────────────────────────── */
  async function loadSeller(id) {
    // created_at ist nicht in jedem Schema vorhanden → erst mit, dann ohne versuchen
    var res = await supabaseClient
      .from("seller_profiles")
      .select(PUBLIC_COLS + ", created_at")
      .eq("id", id)
      .maybeSingle();

    if (res.error) {
      res = await supabaseClient
        .from("seller_profiles")
        .select(PUBLIC_COLS)
        .eq("id", id)
        .maybeSingle();
    }

    if (res.error) {
      console.warn("SELLER LOAD ERROR:", res.error);
      return null;
    }
    return res.data || null;
  }

  async function loadListings(sellerId) {
    var res = await supabaseClient
      .from("listings")
      .select("id, title, price, condition, year, location, image_urls, created_at, manufacturer, model, categories(name)")
      .eq("seller_id", sellerId)
      .eq("status", "Freigegeben")
      .order("created_at", { ascending: false });

    if (res.error) {
      console.warn("LISTINGS LOAD ERROR:", res.error);
      return [];
    }
    return res.data || [];
  }

  async function loadReviews(sellerId) {
    var res = await supabaseClient
      .from("reviews")
      .select("reviewer_name, rating, comment, created_at")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (res.error) {
      console.warn("REVIEWS LOAD ERROR:", res.error);
      return [];
    }
    return res.data || [];
  }

  /* ── Profilkopf ──────────────────────────────────────────── */
  function renderProfile(s) {
    var name = s.company_name || s.contact_name || "Anbieter auf 1A Motor";
    var place = [s.city, s.country].filter(Boolean).join(", ");

    setText("hp-name", name);
    setText("crumb-name", name);
    setText("tb-name", name);
    setText("hp-avatar", initials(name));
    setText("hp-location", place ? "📍 " + place : "📍 Standort auf Anfrage");
    document.title = name + " – Anzeigen und Profil | 1A Motor";

    if (s.company_type) {
      var t = document.getElementById("hp-type");
      t.textContent = s.company_type;
      t.style.display = "";
    }
    var v = document.getElementById("hp-verified");
    if (v) v.style.display = "";

    if (s.created_at) {
      var m = document.getElementById("hp-member");
      m.textContent = "🗓 Mitglied seit " + new Date(s.created_at).toLocaleDateString("de-DE", { month: "long", year: "numeric" });
      m.style.display = "";
    }

    var about = document.getElementById("hp-about");
    if (about) {
      about.textContent = (s.description && s.description.trim())
        ? s.description.trim()
        : "Dieser Anbieter hat noch keine Beschreibung hinterlegt.";
    }

    var facts = [];
    if (s.specialization)  facts.push(["Schwerpunkt", esc(s.specialization)]);
    if (s.response_time)   facts.push(["Antwortzeit", esc(s.response_time)]);
    if (s.languages)       facts.push(["Sprachen", esc(s.languages)]);
    if (place)             facts.push(["Standort", esc(place)]);
    if (s.website)         facts.push(["Website", '<a href="' + esc(normalizeUrl(s.website)) + '" target="_blank" rel="noopener nofollow">' + esc(stripProtocol(s.website)) + "</a>"]);

    var dl = document.getElementById("hp-facts");
    if (dl) {
      dl.innerHTML = facts.map(function (f) {
        return '<div class="hp-fact"><dt>' + f[0] + "</dt><dd>" + f[1] + "</dd></div>";
      }).join("");
    }
  }

  /* ── Anzeigen ────────────────────────────────────────────── */
  function buildCategoryFilter() {
    var sel = document.getElementById("f-cat");
    if (!sel) return;

    var seen = {};
    state.listings.forEach(function (l) {
      var c = catName(l);
      if (c && !seen[c]) seen[c] = 0;
      if (c) seen[c]++;
    });

    Object.keys(seen).sort().forEach(function (c) {
      var o = document.createElement("option");
      o.value = c;
      o.textContent = c + " (" + seen[c] + ")";
      sel.appendChild(o);
    });
  }

  function visibleListings() {
    var out = state.listings.slice();
    if (state.cat) out = out.filter(function (l) { return catName(l) === state.cat; });

    out.sort(function (a, b) {
      if (state.sort === "pasc")  return num(a.price) - num(b.price);
      if (state.sort === "pdesc") return num(b.price) - num(a.price);
      var ta = new Date(a.created_at || 0).getTime();
      var tb = new Date(b.created_at || 0).getTime();
      return state.sort === "old" ? ta - tb : tb - ta;
    });
    return out;
  }

  function renderListings() {
    var grid = document.getElementById("hp-grid");
    if (!grid) return;

    var items = visibleListings();
    setText("tb-count", String(items.length));
    setText("hp-listings-count", "📋 " + state.listings.length + (state.listings.length === 1 ? " Anzeige" : " Anzeigen"));

    if (!items.length) {
      grid.innerHTML =
        '<div class="empty" style="grid-column:1/-1;">' +
          "<div>📭</div>" +
          "<h3>" + (state.cat ? "Keine Anzeigen in dieser Kategorie" : "Noch keine aktiven Anzeigen") + "</h3>" +
          "<p>" + (state.cat ? "Wähle eine andere Kategorie." : "Sobald dieser Anbieter etwas einstellt, erscheint es hier.") + "</p>" +
        "</div>";
      return;
    }

    var html = items.map(cardHtml);

    // Werbefläche im Raster: nach der 8. Anzeige, klar als Anzeige gekennzeichnet,
    // eigenes Kartenformat, kein Preis, keine Inserats-Optik.
    if (html.length > 8) html.splice(8, 0, adCardHtml());

    grid.innerHTML = html.join("");
  }

  function cardHtml(l) {
    var img = Array.isArray(l.image_urls) ? l.image_urls.filter(Boolean)[0] : null;
    var style = img ? ' style="background-image:url(\'' + esc(img) + '\');"' : "";
    var icon = img ? "" : categoryIcon(catName(l));
    var price = num(l.price)
      ? num(l.price).toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
      : "Preis auf Anfrage";
    var meta = [l.condition, l.year, l.location].filter(Boolean).join(" · ");

    return '' +
      '<a class="lc" href="listing-detail.html?id=' + esc(l.id) + '">' +
        '<div class="lc-img"' + style + ">" +
          (l.condition ? '<span class="lc-badge">' + esc(l.condition) + "</span>" : "") +
          icon +
        "</div>" +
        '<div class="lc-bd">' +
          '<div class="lc-title">' + esc(l.title || "Anzeige") + "</div>" +
          '<div class="lc-meta">' + esc(meta || catName(l)) + "</div>" +
          '<div class="lc-price">' + price + "</div>" +
        "</div>" +
      "</a>";
  }

  function adCardHtml() {
    return '' +
      '<div class="ad-slot">' +
        '<span class="ad-slot-tag">Anzeige</span>' +
        '<div class="ad-fallback">' +
          '<div style="font-size:26px;">📢</div>' +
          "<strong>Werbefläche im Anzeigenbereich</strong>" +
          "<span>Sichtbar für Käufer von Motoren und Antriebstechnik.</span>" +
          '<a href="kontakt.html">Jetzt hier werben</a>' +
        "</div>" +
      "</div>";
  }

  /* ── Bewertungen ─────────────────────────────────────────── */
  function renderReviews() {
    var list = state.reviews;
    var avgEl = document.getElementById("rv-avg");
    var starEl = document.getElementById("rv-stars");
    var cntEl = document.getElementById("rv-count");
    var listEl = document.getElementById("rv-list");

    if (!list.length) {
      if (avgEl) avgEl.textContent = "–";
      if (starEl) starEl.textContent = "☆☆☆☆☆";
      if (cntEl) cntEl.textContent = "Noch keine Bewertungen";
      if (listEl) listEl.innerHTML = "";
      return;
    }

    var sum = list.reduce(function (a, r) { return a + num(r.rating); }, 0);
    var avg = sum / list.length;

    if (avgEl) avgEl.textContent = avg.toFixed(1).replace(".", ",");
    if (starEl) starEl.textContent = stars(avg);
    if (cntEl) cntEl.textContent = list.length + (list.length === 1 ? " Bewertung" : " Bewertungen");
    setText("hp-rating", "⭐ " + avg.toFixed(1).replace(".", ",") + " von 5 (" + list.length + ")");

    if (listEl) {
      listEl.innerHTML = list.slice(0, 5).map(function (r) {
        var d = r.created_at ? new Date(r.created_at).toLocaleDateString("de-DE") : "";
        return '' +
          '<div class="rv-item">' +
            '<div class="rv-top">' +
              '<span class="rv-name">' + esc(r.reviewer_name || "Anonym") + "</span>" +
              '<span class="rv-date">' + esc(d) + "</span>" +
            "</div>" +
            '<div class="rv-stars" style="font-size:13px;">' + stars(num(r.rating)) + "</div>" +
            (r.comment ? '<div class="rv-text">' + esc(r.comment) + "</div>" : "") +
          "</div>";
      }).join("");
    }
  }

  /* ── SEO / strukturierte Daten ───────────────────────────── */
  function renderSeo() {
    var s = state.seller;
    var name = s.company_name || s.contact_name || "Anbieter";
    var url = "https://1amotor.de/haendler.html?id=" + s.id;
    var desc = name + " auf 1A Motor: " + state.listings.length +
      (state.listings.length === 1 ? " aktive Anzeige" : " aktive Anzeigen") +
      (s.city ? " aus " + s.city : "") + ". Motoren und Antriebstechnik direkt anfragen.";

    setAttr("#meta-desc", "content", desc);
    setAttr("#og-title", "content", name + " – 1A Motor");
    setAttr("#og-description", "content", desc);
    setAttr("#og-url", "content", url);
    setAttr("#canonical-link", "href", url);

    var schema = document.getElementById("schema-seller");
    if (schema) {
      schema.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": name,
        "url": url,
        "description": s.description || desc,
        "address": (s.city || s.country) ? {
          "@type": "PostalAddress",
          "addressLocality": s.city || undefined,
          "addressCountry": s.country || undefined
        } : undefined
      });
    }
  }

  /* ── Interaktion ─────────────────────────────────────────── */
  function wireControls() {
    var cat = document.getElementById("f-cat");
    var sort = document.getElementById("f-sort");
    if (cat) cat.addEventListener("change", function () { state.cat = cat.value; renderListings(); });
    if (sort) sort.addEventListener("change", function () { state.sort = sort.value; renderListings(); });

    var share = document.getElementById("hp-share-btn");
    if (share) share.addEventListener("click", async function () {
      var url = window.location.href;
      var title = document.getElementById("hp-name").textContent;
      if (navigator.share) {
        try { await navigator.share({ title: title, url: url }); return; } catch (e) { /* abgebrochen */ }
      }
      try {
        await navigator.clipboard.writeText(url);
        share.textContent = "Link kopiert";
        setTimeout(function () { share.textContent = "Profil teilen"; }, 2000);
      } catch (e) {
        window.prompt("Profil-Link kopieren:", url);
      }
    });
  }

  /* ── Fehlerzustand ───────────────────────────────────────── */
  function showError(title, hint) {
    var main = document.querySelector(".hp-body .container");
    if (!main) return;
    setText("hp-name", "Profil nicht verfügbar");
    setText("hp-location", "");
    setText("hp-listings-count", "");
    setText("hp-rating", "");
    main.innerHTML =
      '<div class="card" style="grid-column:1/-1;">' +
        '<div class="empty">' +
          "<div>🔍</div>" +
          "<h3>" + esc(title) + "</h3>" +
          "<p>" + esc(hint) + "</p>" +
          '<a class="btn btn-primary" style="display:inline-block;margin-top:16px;" href="suche.html">Zur Suche</a>' +
        "</div>" +
      "</div>";
  }

  /* ── Helfer ──────────────────────────────────────────────── */
  function setText(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }
  function setAttr(sel, attr, v) { var el = document.querySelector(sel); if (el) el.setAttribute(attr, v); }
  function num(v) { var n = Number(v); return isNaN(n) ? 0 : n; }
  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function initials(t) {
    return String(t).split(" ").filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase() || "1A";
  }
  function stars(v) {
    var full = Math.round(v);
    return "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
  }
  function catName(l) {
    if (!l) return "";
    if (Array.isArray(l.categories)) return (l.categories[0] && l.categories[0].name) || "";
    return (l.categories && l.categories.name) || "";
  }
  function normalizeUrl(u) {
    u = String(u).trim();
    return /^https?:\/\//i.test(u) ? u : "https://" + u;
  }
  function stripProtocol(u) {
    return String(u).replace(/^https?:\/\//i, "").replace(/\/$/, "");
  }
  function categoryIcon(category) {
    var map = {
      "Automotor": "🚗", "Dieselmotor Auto": "🚗", "Benzinmotor Auto": "🚗",
      "Hybridmotor": "⚡", "Elektromotor Auto": "⚡", "Motorradmotor": "🏍️",
      "Roller Motor": "🛵", "LKW Motor": "🚛", "Busmotor": "🚌",
      "Traktormotor": "🚜", "Landmaschinenmotor": "🚜", "Baumaschinenmotor": "🚧",
      "Baggermotor": "🚧", "Gabelstapler Motor": "🏗️", "Bootsmotor": "🚤",
      "Außenbordmotor": "🚤", "Innenbordmotor": "🚤", "Schiffsdieselmotor": "🛳️",
      "Jetski Motor": "🌊", "Flugzeugmotor": "✈️", "Turbinenmotor": "✈️",
      "Elektromotor Industrie": "⚙️", "Drehstrommotor": "⚙️", "Servomotor": "🤖",
      "Getriebemotor": "🔩", "Generator Motor": "🔋", "Pumpenmotor": "💧",
      "Kompressormotor": "🌀", "Lüftermotor": "🌬️", "Kranmotor": "🏗️",
      "Aufzugmotor": "🏢", "Achterbahnmotor": "🎢", "Arcade Motor": "🕹️",
      "Drohnenmotor": "🚁", "E-Bike Motor": "🚲", "Rasenmähermotor": "🌱",
      "Aufsitzmäher Motor": "🌱", "Hochleistungsmotor": "🔥", "CNC Motor": "🧰",
      "Robotermotor": "🤖", "Austauschmotor": "🔄", "Sonstiges": "📦"
    };
    return map[category] || "📦";
  }
})();
