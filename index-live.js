document.addEventListener("DOMContentLoaded", async () => {
  const listingGrid = document.getElementById("home-listing-grid");
  const resultsInfo = document.getElementById("home-results-info");
  const sortSelect = document.getElementById("home-sort-select");
  const searchInput = document.getElementById("home-search-input");
  const categorySelect = document.getElementById("home-category-select");
  const searchButton = document.getElementById("home-search-btn");
  const categoryLinks = document.getElementById("home-category-links");
  const sidebarCategoryList = document.getElementById("sidebar-category-list");

  const HOME_LISTING_LIMIT = 6;

  let listings = [];
  let categories = [];
  let batteryListings = [];

  // ── Werbeflächen-Pool (12 Slots, thematisch nach Motoren-Kategorien) ──────
  // WICHTIG: Keine erfundenen Hersteller-/Markennamen. Solange kein echter
  // Werbevertrag existiert, bleibt jeder Slot ein klar gekennzeichneter
  // Platzhalter, der zur Kontaktseite verlinkt ("Werbepartner werden").
  // Sobald ein echter Partner zusagt (wie bei Kress), ersetzt ein eigener
  // Eintrag hier die jeweilige Platzhalterkarte 1:1.
  const AD_POOL = [
    { icon: "🚗", category: "PKW-Motoren", cta: "Werbefläche frei", sub: "Ihre Anzeige für PKW-Motoren hier" },
    { icon: "🚛", category: "LKW-Motoren", cta: "Werbefläche frei", sub: "Erreichen Sie LKW-Käufer & Händler" },
    { icon: "🚜", category: "Landmaschinen", cta: "Werbefläche frei", sub: "Sichtbarkeit bei Landmaschinen-Käufern" },
    { icon: "🚧", category: "Baumaschinen", cta: "Werbefläche frei", sub: "Anzeige im Baumaschinen-Bereich" },
    { icon: "🚤", category: "Bootsmotoren", cta: "Werbefläche frei", sub: "Werbeplatz für Marine-Antriebe" },
    { icon: "✈️", category: "Flugzeugmotoren", cta: "Werbefläche frei", sub: "Anzeige im Luftfahrt-Segment" },
    { icon: "🏍️", category: "Motorradmotoren", cta: "Werbefläche frei", sub: "Sichtbar bei Motorrad-Interessenten" },
    { icon: "🏁", category: "Motorsport", cta: "Werbefläche frei", sub: "Werbeplatz im Motorsport-Bereich" },
    { icon: "⚙️", category: "Industriemotoren", cta: "Werbefläche frei", sub: "Anzeige für Industrie-Antriebstechnik" },
    { icon: "🔋", category: "Elektromotoren", cta: "Werbefläche frei", sub: "Werbeplatz im E-Antriebs-Segment" },
    { icon: "🏗️", category: "Gabelstapler & Krane", cta: "Werbefläche frei", sub: "Anzeige bei Flurförder-/Hebetechnik" },
    { icon: "🌱", category: "Garten- & Kleinmotoren", cta: "Werbefläche frei", sub: "Werbeplatz für Garten-/Kleinmotoren" }
  ];

  function renderAdCard(ad) {
    return `
      <a class="listing-card ad-card" href="kontakt.html?betreff=Werbepartner" rel="sponsored noopener nofollow">
        <div class="listing-image">
          <span class="badge ad-badge">Anzeige</span>
          <span>${ad.icon}</span>
        </div>
        <div class="listing-body">
          <div class="listing-title">${escapeHtml(ad.category)}</div>
          <div class="meta"><span>Werbepartnerschaft</span></div>
          <div class="ad-cta">${escapeHtml(ad.cta)}</div>
          <div class="shipping" style="color:var(--muted);">${escapeHtml(ad.sub)}</div>
          <div class="seller">
            <span>1amotor.de</span>
            <span class="rating">Jetzt Partner werden →</span>
          </div>
        </div>
      </a>
    `;
  }

  function renderAdCards() {
    return AD_POOL.map(renderAdCard);
  }
  window.renderAdCards = renderAdCards;

  if (listingGrid) {
    listingGrid.innerHTML = `
      <div class="empty-box">
        Angebote werden geladen...
      </div>
    `;
  }

  try {
    await loadCategories();
    await loadStats();
    await loadListings();
    renderListings("latest");
    bindSearch();
    loadCategoryCounts(); // Echte Zählungen aus DB — läuft im Hintergrund
    loadBatteryListings(); // Eigener Batterien-Bereich, läuft unabhängig im Hintergrund
  } catch (err) {
    console.error("INIT ERROR:", err);
    if (resultsInfo) resultsInfo.textContent = "Fehler beim Laden der Startseite.";
    if (listingGrid) {
      listingGrid.innerHTML = `
        <div class="empty-box">
          Die Startseite konnte nicht vollständig geladen werden.
        </div>
      `;
    }
  }

  sortSelect?.addEventListener("change", () => {
    renderListings(sortSelect.value);
  });

  async function loadCategories() {
    const { data, error } = await supabaseClient
      .from("categories")
      .select("id, name, slug")
      .order("name", { ascending: true });

    console.log("INDEX CATEGORIES:", data);
    console.log("INDEX CATEGORIES ERROR:", error);

    if (error) {
      console.error("Fehler beim Laden der Kategorien:", error);
      return;
    }

    categories = data || [];

    if (categorySelect) {
      categorySelect.innerHTML = `
        <option value="">Alle Kategorien</option>
        ${categories.map(cat => `
          <option value="${escapeHtml(cat.name)}">${escapeHtml(cat.name)}</option>
        `).join("")}
      `;
    }

    if (categoryLinks) {
      categoryLinks.innerHTML = `
        <a href="suche.html" class="active">Top-Angebote</a>
        ${categories.slice(0, 10).map(cat => `
          <a href="suche.html?category=${encodeURIComponent(cat.name)}">${escapeHtml(cat.name)}</a>
        `).join("")}
      `;
    }

    // Sidebar-HTML bleibt erhalten — Zählungen werden von loadCategoryCounts() gesetzt

    const statCategories = document.getElementById("stat-categories");
    if (statCategories) statCategories.textContent = categories.length;
  }

  async function loadStats() {
    const statListings = document.getElementById("stat-listings");
    const statDealers = document.getElementById("stat-dealers");

    const listingsCountResult = await supabaseClient
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("status", "Freigegeben");

    const dealerCountResult = await supabaseClient
      .from("seller_profiles")
      .select("id", { count: "exact", head: true });

    if (listingsCountResult.error) {
      console.error("STAT LISTINGS ERROR:", listingsCountResult.error);
    }

    if (dealerCountResult.error) {
      console.error("STAT DEALERS ERROR:", dealerCountResult.error);
    }

    if (statListings) {
      statListings.textContent = listingsCountResult.count ?? 0;
    }

    if (statDealers) {
      statDealers.textContent = dealerCountResult.count ?? 0;
    }
  }

  async function loadListings() {
    const { data, error } = await supabaseClient
      .from("listings")
      .select(`
        id,
        title,
        manufacturer,
        model,
        condition,
        price,
        location,
        created_at,
        image_urls,
        categories(name),
        seller_profiles(company_name)
      `)
      .eq("status", "Freigegeben")
      .order("created_at", { ascending: false });

    console.log("INDEX LISTINGS:", data);
    console.log("INDEX LISTINGS ERROR:", error);

    if (error) {
      if (resultsInfo) resultsInfo.textContent = "Fehler beim Laden.";
      if (listingGrid) {
        listingGrid.innerHTML = `
          <div class="empty-box">
            Die Angebote konnten nicht geladen werden.
          </div>
        `;
      }
      return;
    }

    listings = data || [];

    if (resultsInfo) {
      resultsInfo.textContent = `${listings.length} aktuelle Angebote aus Supabase`;
    }
  }

  function renderListings(sortMode = "latest") {
    if (!listingGrid) return;

    let items = [...listings];

    if (sortMode === "price_asc") {
      items.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortMode === "price_desc") {
      items.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else {
      // Standardansicht ("Neueste zuerst"): statt immer strikt nach Datum zu sortieren,
      // wird die Reihenfolge alle 20 Minuten neu gemischt (deterministisch pro Zeitfenster,
      // damit die Seite innerhalb der 20 Minuten für alle Besucher gleich aussieht, sich
      // danach aber automatisch neu anordnet — so wirkt die Startseite nicht immer identisch).
      items = seededShuffle(items, timeBucketSeed(20));
    }

    items = items.slice(0, HOME_LISTING_LIMIT);

    if (!items.length) {
      listingGrid.innerHTML = `
        <div class="empty-box">
          Noch keine freigegebenen Angebote vorhanden.
        </div>
      `;
      renderAdCards().forEach(html => { listingGrid.innerHTML += html; });
      return;
    }

    const listingCards = items.map((listing) => {
      const category = Array.isArray(listing.categories)
        ? listing.categories[0]?.name || "Unbekannt"
        : listing.categories?.name || "Unbekannt";

      const seller = Array.isArray(listing.seller_profiles)
        ? listing.seller_profiles[0]?.company_name || "Händler"
        : listing.seller_profiles?.company_name || "Händler";

      const price = Number(listing.price || 0).toLocaleString("de-DE", {
        style: "currency",
        currency: "EUR"
      });

      const firstImage = Array.isArray(listing.image_urls) && listing.image_urls.length
        ? listing.image_urls[0]
        : null;

      // Kategoriebild als Fallback wenn kein eigenes Bild vorhanden
      const fallbackImg = window.getCategoryImage ? window.getCategoryImage(category) : null;
      const displayImage = firstImage || fallbackImg;

      const imageStyle = displayImage
        ? `style="background-image:url('${displayImage}'); background-size:cover; background-position:center; background-repeat:no-repeat;"`
        : "";

      const imageContent = displayImage ? "" : getCategoryIcon(category);

      return `
        <a class="listing-card" href="listing-detail.html?id=${encodeURIComponent(listing.id)}">
          <div class="listing-image" ${imageStyle}>
            <span class="badge">${escapeHtml(category)}</span>
            <span class="fav">♡</span>
            ${imageContent}
          </div>
          <div class="listing-body">
            <div class="listing-title">${escapeHtml(listing.title || "Ohne Titel")}</div>
            <div class="meta">
              <span>${escapeHtml(listing.manufacturer || "-")}</span>
              <span>${escapeHtml(listing.model || "-")}</span>
              <span>${escapeHtml(listing.location || "-")}</span>
            </div>
            <div class="price">${price}</div>
            <div class="shipping">${escapeHtml(listing.condition || "Gebraucht")}</div>
            <div class="seller">
              <span>${escapeHtml(seller)}</span>
              <span class="rating">Live</span>
            </div>
          </div>
        </a>
      `;
    });

    // ── Werbeflächen einstreuen ─────────────────────────────────────────
    // 12 Werbeplätze sind angelegt, davon werden hier (rotierend, wie die
    // Angebote alle 20 Min. neu gemischt) 3 zwischen den echten Angeboten
    // gezeigt — so wirkt die Seite nicht ad-überladen. Jede Karte trägt ein
    // deutliches "Anzeige"-Label (§5a UWG / AdSense-Placement-Policy) und
    // ist noch NICHT an einen echten Werbekunden vergeben — Klick führt zur
    // Kontaktseite. Sobald ein echter Partner (wie Kress) zugesagt hat,
    // ersetzt ein eigener Eintrag im AD_POOL diese Platzhalterkarte 1:1.
    const rotatingAds = seededShuffle(AD_POOL, timeBucketSeed(20)).slice(0, 3);
    const adCards = rotatingAds.map(renderAdCard);

    const combined = [...listingCards];
    // nach jeder 2. Angebotskarte eine Werbekarte einstreuen
    let insertPos = 2;
    adCards.forEach((adHtml) => {
      const pos = Math.min(insertPos, combined.length);
      combined.splice(pos, 0, adHtml);
      insertPos += 3; // 2 Angebote, 1 Anzeige, wiederholen
    });

    listingGrid.innerHTML = combined.join("");
  }

  function bindSearch() {
    searchButton?.addEventListener("click", goToSearch);
    searchInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        goToSearch();
      }
    });
  }

  function goToSearch() {
    const q = (searchInput?.value || "").trim();
    const category = (categorySelect?.value || "").trim();

    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);

    const query = params.toString();
    window.location.href = query ? `suche.html?${query}` : "suche.html";
  }
});

// ── Echte Kategorie-Zählungen aus Supabase ────────────────────────────────────
async function loadCategoryCounts() {
  try {
    const { data, error } = await supabaseClient
      .from("listings")
      .select("categories(name)")
      .eq("status", "Freigegeben");

    if (error || !data) {
      console.warn("CATEGORY COUNTS ERROR:", error);
      return;
    }

    // Zählungen berechnen
    const counts = {};
    data.forEach(row => {
      const name = Array.isArray(row.categories)
        ? row.categories[0]?.name
        : row.categories?.name;
      if (name) counts[name] = (counts[name] || 0) + 1;
    });

    console.log("LIVE CATEGORY COUNTS:", counts);

    // ── Unterkategorien aktualisieren ──────────────────────────────────
    document.querySelectorAll("#sidebar-category-list .cat-sublist label").forEach(label => {
      const cb = label.querySelector("input[type='checkbox']");
      if (!cb) return;
      const span = label.querySelector(".cat-count");
      if (!span) return;
      const count = counts[cb.value] || 0;
      span.textContent = count.toLocaleString("de-DE");
      label.style.opacity = count === 0 ? "0.4" : "1";
    });

    // ── Gruppen-Summen aktualisieren ───────────────────────────────────
    document.querySelectorAll("#sidebar-category-list .cat-group-head").forEach(head => {
      const onclickAttr = head.getAttribute("onclick") || "";
      const grpMatch = onclickAttr.match(/['"]([^'"]+)['"]/);
      if (!grpMatch) return;
      const sublist = document.getElementById(grpMatch[1]);
      if (!sublist) return;

      let total = 0;
      sublist.querySelectorAll("input[type='checkbox']").forEach(cb => {
        total += counts[cb.value] || 0;
      });

      const span = head.querySelector(".cat-count");
      if (span) span.textContent = total.toLocaleString("de-DE");
    });

    // ── Gesamt-Stat-Zähler ─────────────────────────────────────────────
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const statEl = document.getElementById("stat-listings");
    if (statEl && total > 0) statEl.textContent = total.toLocaleString("de-DE");

  } catch (err) {
    console.warn("loadCategoryCounts error:", err);
  }
}

// ── Batterien-Bereich (eigenes Panel auf der Startseite) ─────────────────────
async function loadBatteryListings() {
  const grid = document.getElementById("battery-listing-grid");
  const info = document.getElementById("battery-results-info");
  if (!grid) return;

  try {
    // 1) IDs der Batterie-Kategorien ermitteln
    const { data: cats, error: catError } = await supabaseClient
      .from("categories")
      .select("id, name, slug")
      .in("slug", window.BATTERY_SLUGS || []);

    if (catError) {
      console.error("BATTERY CATEGORIES ERROR:", catError);
      renderBatteryEmptyState(grid, info);
      return;
    }

    const catIds = (cats || []).map(c => c.id);

    if (!catIds.length) {
      // Kategorien wurden in Supabase noch nicht angelegt
      renderBatteryEmptyState(grid, info);
      return;
    }

    // 2) Freigegebene Angebote in diesen Kategorien laden
    const { data, error } = await supabaseClient
      .from("listings")
      .select(`
        id, title, manufacturer, model, condition, price, location, created_at,
        image_urls, categories(name), seller_profiles(company_name)
      `)
      .in("category_id", catIds)
      .eq("status", "Freigegeben")
      .order("created_at", { ascending: false })
      .limit(BATTERY_LIMIT_FALLBACK);

    if (error) {
      console.error("BATTERY LISTINGS ERROR:", error);
      renderBatteryEmptyState(grid, info);
      return;
    }

    const items = data || [];

    if (info) {
      info.textContent = items.length
        ? `${items.length} Batterie-Angebote aus Supabase`
        : "Noch keine Batterie-Angebote — sei einer der Ersten";
    }

    if (!items.length) {
      renderBatteryEmptyState(grid, info);
      return;
    }

    grid.innerHTML = items.map(renderBatteryListingCard).join("");
  } catch (err) {
    console.error("loadBatteryListings error:", err);
    renderBatteryEmptyState(grid, info);
  }
}
const BATTERY_LIMIT_FALLBACK = 6;
window.BATTERY_SLUGS = [
  "e-auto-batterie",
  "starterbatterie",
  "solarbatterie",
  "industriebatterie",
  "gabelstapler-batterie",
  "e-bike-batterie"
];

function renderBatteryListingCard(listing) {
  const category = Array.isArray(listing.categories)
    ? listing.categories[0]?.name || "Batterie"
    : listing.categories?.name || "Batterie";

  const seller = Array.isArray(listing.seller_profiles)
    ? listing.seller_profiles[0]?.company_name || "Händler"
    : listing.seller_profiles?.company_name || "Händler";

  const price = Number(listing.price || 0).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR"
  });

  const firstImage = Array.isArray(listing.image_urls) && listing.image_urls.length
    ? listing.image_urls[0]
    : null;

  // Kein erzwungener Bild-Fallback (fallback=null) — sonst würde z. B. ein
  // Auto-Motorbild angezeigt, wenn für die Batterie-Kategorie noch kein
  // eigenes Foto in category-images.js hinterlegt ist. Ohne Bild greift
  // stattdessen der Icon-Fallback (getCategoryIcon) weiter unten.
  const fallbackImg = window.getCategoryImage ? window.getCategoryImage(category, null) : null;
  const displayImage = firstImage || fallbackImg;

  const imageStyle = displayImage
    ? `style="background-image:url('${displayImage}'); background-size:cover; background-position:center; background-repeat:no-repeat;"`
    : "";
  const imageContent = displayImage ? "" : getCategoryIcon(category);

  return `
    <a class="listing-card" href="listing-detail.html?id=${encodeURIComponent(listing.id)}">
      <div class="listing-image" ${imageStyle}>
        <span class="badge">${escapeHtml(category)}</span>
        <span class="fav">♡</span>
        ${imageContent}
      </div>
      <div class="listing-body">
        <div class="listing-title">${escapeHtml(listing.title || "Ohne Titel")}</div>
        <div class="meta">
          <span>${escapeHtml(listing.manufacturer || "-")}</span>
          <span>${escapeHtml(listing.model || "-")}</span>
          <span>${escapeHtml(listing.location || "-")}</span>
        </div>
        <div class="price">${price}</div>
        <div class="shipping">${escapeHtml(listing.condition || "Gebraucht")}</div>
        <div class="seller">
          <span>${escapeHtml(seller)}</span>
          <span class="rating">Live</span>
        </div>
      </div>
    </a>
  `;
}

function renderBatteryEmptyState(grid, info) {
  if (info) info.textContent = "Noch keine Batterie-Angebote — sei einer der Ersten";
  grid.innerHTML = `
    <div class="empty-box" style="grid-column:1/-1;">
      <p style="margin-bottom:12px;">Noch keine Batterie-Inserate vorhanden.</p>
      <a href="anzeige-erstellen.html" class="view-all-link">Jetzt erste Batterie-Anzeige erstellen →</a>
    </div>
  `;
}

// ── Zeitgesteuertes Mischen ("alle 20 Minuten verschieben") ──────────────────
// Deterministische Pseudozufallszahl aus einem Seed (mulberry32) — dieselbe Eingabe
// erzeugt immer dieselbe Reihenfolge, damit alle Besucher im selben 20-Minuten-Fenster
// dasselbe sehen, es sich aber automatisch mit jedem neuen Zeitfenster ändert.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function timeBucketSeed(minutes) {
  return Math.floor(Date.now() / (minutes * 60 * 1000));
}
function seededShuffle(arr, seed) {
  const rng = mulberry32(seed);
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getCategoryIcon(category) {
  const map = {
    "Automotor": "🚗",
    "Dieselmotor Auto": "🚗",
    "Benzinmotor Auto": "🚗",
    "Hybridmotor": "⚡",
    "Elektromotor Auto": "⚡",
    "Motorradmotor": "🏍️",
    "Roller Motor": "🛵",
    "LKW Motor": "🚛",
    "Busmotor": "🚌",
    "Traktormotor": "🚜",
    "Landmaschinenmotor": "🚜",
    "Baumaschinenmotor": "🚧",
    "Baggermotor": "🚧",
    "Radlader Motor": "🚧",
    "Gabelstapler Motor": "🏗️",
    "Bootsmotor": "🚤",
    "Außenbordmotor": "🚤",
    "Innenbordmotor": "🚤",
    "Schiffsdieselmotor": "🛳️",
    "Jetski Motor": "🌊",
    "Flugzeugmotor": "✈️",
    "Turbinenmotor": "✈️",
    "Jetmotor": "✈️",
    "Propellermotor Flugzeug": "🛩️",
    "Hubschraubermotor": "🚁",
    "Elektromotor Industrie": "⚙️",
    "Drehstrommotor": "⚙️",
    "Wechselstrommotor": "⚙️",
    "Gleichstrommotor": "⚙️",
    "Servomotor": "🤖",
    "Schrittmotor": "🤖",
    "Getriebemotor": "🔩",
    "Linearmotor": "⚙️",
    "Synchronmotor": "⚙️",
    "Asynchronmotor": "⚙️",
    "Hochspannungsmotor": "⚡",
    "Niederspannungsmotor": "⚡",
    "Großmotor Industrie": "🏭",
    "Spezialmotor Industrie": "🏭",
    "Generator Motor": "🔋",
    "Pumpenmotor": "💧",
    "Kompressormotor": "🌀",
    "Lüftermotor": "🌬️",
    "Ventilatormotor": "🌬️",
    "Förderbandmotor": "🏭",
    "Kranmotor": "🏗️",
    "Aufzugmotor": "🏢",
    "Rolltreppenmotor": "🏢",
    "Mischermotor": "⚙️",
    "Schneckenmotor": "⚙️",
    "Karussellmotor": "🎡",
    "Achterbahnmotor": "🎢",
    "Fahrgeschäft Motor": "🎠",
    "Schausteller Motor": "🎪",
    "Spielautomaten Motor": "🎰",
    "Arcade Motor": "🕹️",
    "Drohnenmotor": "🚁",
    "Modellbau Motor": "🧩",
    "RC Motor": "🏎️",
    "Kartmotor": "🏁",
    "Rasenmähermotor": "🌱",
    "Aufsitzmäher Motor": "🌱",
    "Kettensägenmotor": "🪚",
    "Heckenscherenmotor": "🌿",
    "Laubbläser Motor": "🍂",
    "Schneefräsenmotor": "❄️",
    "Generator Kleinmotor": "🔋",
    "Stromaggregat Motor": "🔋",
    "Wasserpumpenmotor": "💧",
    "Gartenmaschinenmotor": "🌳",
    "Hydraulikmotor": "🛠️",
    "Pneumatikmotor": "🛠️",
    "Vibrationsmotor": "⚙️",
    "Spindelmotor": "⚙️",
    "Hochleistungsmotor": "🔥",
    "Präzisionsmotor": "🎯",
    "CNC Motor": "🧰",
    "Robotermotor": "🤖",
    "Industrieroboter Motor": "🤖",
    "Werkzeugmaschinenmotor": "🧰",
    "E-Bike Motor": "🚲",
    "Elektro Roller Motor": "🛴",
    "Elektro Motorrad Motor": "🏍️",
    "Elektro Bootsmotor": "🚤",
    "Elektro Außenbordmotor": "🚤",
    "Elektro Flugmotor": "✈️",
    "Smart Motor": "📡",
    "IoT Motor": "📡",
    "Energiesparmotor": "🌱",
    "Permanentmagnet Motor": "🧲",
    "Gasturbinenmotor": "🔥",
    "Dampfturbinenmotor": "♨️",
    "Dieselaggregat Motor": "⛽",
    "Notstromaggregat Motor": "🔋",
    "Industrie Diesel Motor": "🏭",
    "Schiffsturbinenmotor": "🛳️",
    "Hochdrehzahlmotor": "⚡",
    "Schwerlastmotor": "🏋️",
    "Spezialanfertigung Motor": "🛠️",
    "Austauschmotor": "🔄",
    "Sonstiges": "📦",
    // ── Batterien ──
    "E-Auto-Batterie": "🔋",
    "Starterbatterie": "🔋",
    "Solar-/Speicherbatterie": "🔋",
    "Industriebatterie": "🔋",
    "Gabelstapler-Batterie": "🔋",
    "E-Bike-Batterie": "🔋"
  };
  return map[category] || "📦";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
