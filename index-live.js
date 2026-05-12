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
      items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    items = items.slice(0, HOME_LISTING_LIMIT);

    if (!items.length) {
      listingGrid.innerHTML = `
        <div class="empty-box">
          Noch keine freigegebenen Angebote vorhanden.
        </div>
      `;
      return;
    }

    listingGrid.innerHTML = items.map((listing) => {
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
    }).join("");
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
    "Sonstiges": "📦"
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