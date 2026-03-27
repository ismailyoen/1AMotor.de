document.addEventListener("DOMContentLoaded", async () => {

  // ── DOM ───────────────────────────────────────────────────────────────────
  const searchInput    = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");
  const searchButton   = document.getElementById("search-button");
  const sortSelect     = document.getElementById("sort-select");
  const resultsInfo    = document.getElementById("results-info");
  const resultsGrid    = document.getElementById("search-results");
  const applyPrice     = document.getElementById("apply-price");
  const activeFiltersEl= document.getElementById("active-filters");
  const categoryHero   = document.getElementById("category-hero");
  const heroTitle      = document.getElementById("category-hero-title");
  const heroKicker     = document.getElementById("category-hero-kicker");

  // ── URL Parameter ─────────────────────────────────────────────────────────
  const params      = new URLSearchParams(window.location.search);
  const urlQuery    = (params.get("q") || "").trim();
  const urlCategory = (params.get("category") || "").trim();

  if (searchInput) searchInput.value = urlQuery;

  // ── Loading State ─────────────────────────────────────────────────────────
  showLoading();

  // ── Kategorien laden ──────────────────────────────────────────────────────
  const { data: categories } = await supabaseClient
    .from("categories").select("id, name").order("name", { ascending: true });

  // Header-Kategorie-Select befüllen
  if (categoryFilter) {
    categoryFilter.innerHTML = `<option value="">Alle Kategorien</option>` +
      (categories || []).map(cat => `<option value="${escapeHtml(cat.name)}"${urlCategory === cat.name ? " selected" : ""}>${escapeHtml(cat.name)}</option>`).join("");
  }

  // Sidebar-Kategorie-Checkboxes
  const sidebarCats = document.getElementById("sidebar-category-list");
  if (sidebarCats && categories?.length) {
    sidebarCats.innerHTML = categories.slice(0, 20).map(cat => `
      <label class="filter-option">
        <input type="checkbox" name="sidebar-cat" value="${escapeHtml(cat.name)}"
          ${urlCategory === cat.name ? "checked" : ""} />
        ${escapeHtml(cat.name)}
      </label>`).join("");
    // Kategorie-Checkbox → sofort filtern
    sidebarCats.addEventListener("change", applyFilters);
  }

  // Zustand-Checkboxes → sofort filtern
  document.querySelectorAll("input[name='zustand']").forEach(cb => {
    cb.addEventListener("change", applyFilters);
  });


  // ── Category Hero mit Bild ────────────────────────────────────────────────
  const heroConfig = [
    { match:["automotor","benzinmotor","dieselmotor auto","hybridmotor","elektromotor auto"], title:"Automotoren", image:"images/automotor-header.png" },
    { match:["aufzug"], title:"Aufzugsmotoren", image:"images/aufzugsmotor-header.png" },
    { match:["boot","außenbord","innenbord","schiffsdiesel"], title:"Bootsmotoren", image:"images/bootsmotor-header.png" },
    { match:["achterbahn"], title:"Achterbahnmotoren", image:"images/achterbahnmotor-header.png" },
    { match:["arcade"], title:"Arcade Motor", image:"images/arcade-motor-header.png" },
    { match:["asynchron"], title:"Asynchronmotor", image:"images/asynchronmotor-header.png" },
    { match:["karussell"], title:"Karussellmotor", image:"images/karussellmotor-header.png" },
    { match:["fahrgeschäft","fahrgeschaeft"], title:"Fahrgeschäft Motor", image:"images/fahrgeschaeft-motor-header.png" },
    { match:["schausteller"], title:"Schausteller Motor", image:"images/schausteller-motor-header.png" },
    { match:["spielautomat"], title:"Spielautomaten Motor", image:"images/spielautomaten-motor-header.png" },
    { match:["drohne"], title:"Drohnenmotor", image:"images/drohnenmotor-header.png" },
    { match:["modellbau"], title:"Modellbau Motor", image:"images/modellbau-motor-header.png" },
    { match:["rc motor","rc-motor"], title:"RC Motor", image:"images/rc-motor-header.png" },
    { match:["kartmotor","kart"], title:"Kartmotor", image:"images/kartmotor-header.png" },
    { match:["rasenmäher","rasenmaeher"], title:"Rasenmähermotor", image:"images/rasenmaehermotor-header.png" },
    { match:["kettensäge","kettensaege"], title:"Kettensägenmotor", image:"images/kettensaegenmotor-header.png" },
    { match:["heckenschere"], title:"Heckenscherenmotor", image:"images/heckenscherenmotor-header.png" },
    { match:["laubbläser","laubblaeser"], title:"Laubbläser Motor", image:"images/laubblaeser-motor-header.png" },
    { match:["schneefräse","schneefraese"], title:"Schneefräsenmotor", image:"images/schneefraesenmotor-header.png" },
    { match:["wasserpumpe"], title:"Wasserpumpenmotor", image:"images/wasserpumpenmotor-header.png" },
    { match:["hydraulik"], title:"Hydraulikmotor", image:"images/hydraulikmotor-header.png" },
    { match:["pneumatik"], title:"Pneumatikmotor", image:"images/pneumatikmotor-header.png" },
    { match:["cnc"], title:"CNC Motor", image:"images/cnc-motor-header.png" },
    { match:["roboter"], title:"Robotermotor", image:"images/robotermotor-header.png" },
    { match:["e-bike","ebike"], title:"E-Bike Motor", image:"images/e-bike-motor-header.png" },
    { match:["lkw","busmotor"], title:"LKW Motor", image:"images/lkw-motor-header.png" },
    { match:["traktor","landmaschine"], title:"Traktormotor", image:"images/traktormotor-header.png" },
    { match:["bagger","baumaschine","radlader"], title:"Baumaschinenmotor", image:"images/baumaschinenmotor-header.png" },
    { match:["flugzeug","turbinenmotor","jetmotor"], title:"Flugzeugmotor", image:"images/flugzeugmotor-header.png" },
    { match:["hubschrauber"], title:"Hubschraubermotor", image:"images/hubschraubermotor-header.png" },
    { match:["elektromotor industrie","drehstrom","servomotor","schrittmotor","getriebemotor"], title:"Industriemotor", image:"images/elektromotor-industrie-header.png" },
    { match:["austausch"], title:"Austauschmotor", image:"images/austauschmotor-header.png" },
    { match:["motorrad"], title:"Motorradmotor", image:"images/motorradmotor-header.png" },
    { match:["jetski"], title:"Jetski Motor", image:"images/jetski-motor-header.png" },
  ];

  function applyCategoryHero(cat) {
    if (!cat || !categoryHero) return;
    const normalized = cat.toLowerCase();
    const hero = heroConfig.find(h => h.match.some(k => normalized.includes(k)));
    if (!hero) {
      // Kein spezifisches Bild — trotzdem Titel anzeigen
      if (categoryHero) categoryHero.style.display = "block";
      if (heroTitle)    heroTitle.textContent  = cat;
      if (heroKicker)   heroKicker.textContent = "Kategorie";
      return;
    }
    if (categoryHero) {
      categoryHero.style.display = "block";
      categoryHero.style.backgroundImage = `url('${hero.image}')`;
    }
    if (heroTitle)  heroTitle.textContent  = hero.title;
    if (heroKicker) heroKicker.textContent = "Kategorie";
  }

  applyCategoryHero(urlCategory);



  // ── Alle Listings laden ───────────────────────────────────────────────────
  const { data: allListings, error } = await supabaseClient
    .from("listings")
    .select(`id, title, manufacturer, model, condition, price, year, location, created_at, image_urls, categories(name), seller_profiles(company_name)`)
    .eq("status", "Freigegeben")
    .order("created_at", { ascending: false });

  if (error) {
    showError();
    return;
  }

  let listings = allListings || [];

  // ── Initiale Filter anwenden ──────────────────────────────────────────────
  applyFilters();

  // ── Events ───────────────────────────────────────────────────────────────
  searchButton?.addEventListener("click", goToSearch);
  searchInput?.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); goToSearch(); } });
  categoryFilter?.addEventListener("change", goToSearch);
  sortSelect?.addEventListener("change", applyFilters);
  applyPrice?.addEventListener("click", applyFilters);

  // ── Filter anwenden ───────────────────────────────────────────────────────
  function applyFilters() {
    const q         = (searchInput?.value || urlQuery || "").toLowerCase().trim();
    const sortMode  = sortSelect?.value || "latest";
    const priceMin  = Number(document.getElementById("price-min")?.value || 0);
    const priceMax  = Number(document.getElementById("price-max")?.value || 0);

    // Gewählte Zustände
    const zustandChecked = Array.from(document.querySelectorAll("input[name='zustand']:checked")).map(cb => cb.value);

    // Gewählte Sidebar-Kategorien
    const catChecked = Array.from(document.querySelectorAll("input[name='sidebar-cat']:checked")).map(cb => cb.value);

    // Kategorie aus URL (wenn keine Sidebar-Auswahl)
    const activeCat = catChecked.length ? catChecked : (urlCategory ? [urlCategory] : []);

    let filtered = [...listings];

    // Textsuche
    if (q) {
      filtered = filtered.filter(l => {
        const catName = getCatName(l);
        return (l.title||"").toLowerCase().includes(q) ||
               (l.manufacturer||"").toLowerCase().includes(q) ||
               (l.model||"").toLowerCase().includes(q) ||
               (l.description||"").toLowerCase().includes(q) ||
               catName.toLowerCase().includes(q);
      });
    }

    // Kategorie-Filter
    if (activeCat.length) {
      const normalize = s => s.toLowerCase().replace(/-/g, " ").trim();
      filtered = filtered.filter(l => {
        const cn = normalize(getCatName(l));
        return activeCat.some(ac => cn === normalize(ac) || cn.includes(normalize(ac)));
      });
    }

    // Zustand-Filter
    if (zustandChecked.length) {
      filtered = filtered.filter(l => zustandChecked.includes(l.condition));
    }

    // Preis-Filter
    if (priceMin > 0) filtered = filtered.filter(l => Number(l.price||0) >= priceMin);
    if (priceMax > 0) filtered = filtered.filter(l => Number(l.price||0) <= priceMax);

    // Sortierung
    if (sortMode === "price_asc")  filtered.sort((a,b) => Number(a.price||0) - Number(b.price||0));
    if (sortMode === "price_desc") filtered.sort((a,b) => Number(b.price||0) - Number(a.price||0));

    // Ergebnis-Info
    if (resultsInfo) {
      resultsInfo.innerHTML = `<strong>${filtered.length}</strong> Ergebnis${filtered.length !== 1 ? "se" : ""} gefunden${q ? ` für „${escapeHtml(q)}"` : ""}`;
    }

    // Aktive Filter Tags
    renderFilterTags(q, activeCat, zustandChecked, priceMin, priceMax);

    // Grid rendern
    renderGrid(filtered);
  }

  // ── Grid rendern ──────────────────────────────────────────────────────────
  function renderGrid(items) {
    if (!resultsGrid) return;

    if (!items.length) {
      resultsGrid.innerHTML = `
        <div class="empty-box" style="grid-column:1/-1;">
          <div class="empty-icon">🔍</div>
          <h3>Keine Anzeigen gefunden</h3>
          <p>Ändere deinen Suchbegriff oder passe die Filter an.</p>
        </div>`;
      return;
    }

    resultsGrid.innerHTML = items.map(listing => {
      const category  = getCatName(listing);
      const seller    = Array.isArray(listing.seller_profiles) ? listing.seller_profiles[0]?.company_name || "Händler" : listing.seller_profiles?.company_name || "Händler";
      const price     = Number(listing.price||0).toLocaleString("de-DE", { style:"currency", currency:"EUR" });
      const date      = new Date(listing.created_at).toLocaleDateString("de-DE");
      const firstImg  = Array.isArray(listing.image_urls) && listing.image_urls.length ? listing.image_urls[0] : null;
      const imgStyle  = firstImg ? `background-image:url('${encodeURI(firstImg)}');background-size:cover;background-position:center;` : "";
      const icon      = firstImg ? "" : `<span style="font-size:48px;">${getCategoryIcon(category)}</span>`;

      return `
        <a class="listing-card" href="listing-detail.html?id=${encodeURIComponent(listing.id)}">
          <div class="card-image" style="${imgStyle}">
            <span class="img-badge">${escapeHtml(category)}</span>
            <span class="img-fav">♡</span>
            ${icon}
          </div>
          <div class="card-body">
            <div class="card-title">${escapeHtml(listing.title || "Ohne Titel")}</div>
            <div class="card-meta">
              <span>🏭 ${escapeHtml(listing.manufacturer || "–")}</span>
              <span>📍 ${escapeHtml(listing.location || "–")}</span>
              ${listing.year ? `<span>📅 ${listing.year}</span>` : ""}
            </div>
            <div class="card-price">${price}</div>
            <div class="card-condition">✓ ${escapeHtml(listing.condition || "Gebraucht")}</div>
            <div class="card-footer">
              <div class="card-seller">
                <div class="seller-dot"></div>
                ${escapeHtml(seller)}
              </div>
              <span>${date}</span>
            </div>
          </div>
        </a>`;
    }).join("");
  }

  // ── Aktive Filter Tags ────────────────────────────────────────────────────
  function renderFilterTags(q, cats, zustand, priceMin, priceMax) {
    if (!activeFiltersEl) return;
    const tags = [];
    if (q) tags.push({ label: `🔍 "${q}"`, clear: () => { searchInput.value = ""; applyFilters(); } });
    cats.forEach(c => tags.push({ label: `📂 ${c}`, clear: () => { document.querySelectorAll(`input[name='sidebar-cat'][value='${c}']`).forEach(cb => cb.checked = false); applyFilters(); } }));
    zustand.forEach(z => tags.push({ label: `🔧 ${z}`, clear: () => { document.querySelectorAll(`input[name='zustand'][value='${z}']`).forEach(cb => cb.checked = false); applyFilters(); } }));
    if (priceMin > 0) tags.push({ label: `💶 Min: ${priceMin.toLocaleString("de-DE")} €`, clear: () => { document.getElementById("price-min").value=""; applyFilters(); } });
    if (priceMax > 0) tags.push({ label: `💶 Max: ${priceMax.toLocaleString("de-DE")} €`, clear: () => { document.getElementById("price-max").value=""; applyFilters(); } });

    if (!tags.length) {
      activeFiltersEl.style.display = "none";
      activeFiltersEl.innerHTML = "";
      return;
    }

    activeFiltersEl.style.display = "flex";
    activeFiltersEl.innerHTML = tags.map((tag, i) =>
      `<span class="filter-tag">${escapeHtml(tag.label)}<button data-idx="${i}" title="Entfernen">✕</button></span>`
    ).join("");

    activeFiltersEl.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        tags[parseInt(btn.getAttribute("data-idx"))].clear();
      });
    });
  }

  // ── Suche ausführen (Seitenwechsel) ──────────────────────────────────────
  function goToSearch() {
    const q   = (searchInput?.value || "").trim();
    const cat = (categoryFilter?.value || "").trim();
    const p   = new URLSearchParams();
    if (q)   p.set("q", q);
    if (cat) p.set("category", cat);
    window.location.href = p.toString() ? `suche.html?${p}` : "suche.html";
  }

  // ── Hilfsfunktionen ───────────────────────────────────────────────────────
  function getCatName(listing) {
    return Array.isArray(listing.categories) ? listing.categories[0]?.name || "Unbekannt" : listing.categories?.name || "Unbekannt";
  }

  function showLoading() {
    if (resultsGrid) resultsGrid.innerHTML = `<div class="empty-box" style="grid-column:1/-1;"><div class="empty-icon">⏳</div><h3>Anzeigen werden geladen...</h3></div>`;
  }

  function showError() {
    if (resultsGrid) resultsGrid.innerHTML = `<div class="empty-box" style="grid-column:1/-1;"><div class="empty-icon">❌</div><h3>Fehler beim Laden</h3><p>Bitte Seite neu laden.</p></div>`;
  }
});

// ── Kategorie Icons ───────────────────────────────────────────────────────────
function getCategoryIcon(cat) {
  const m = {
    "Automotor":"🚗","Dieselmotor Auto":"🚗","Benzinmotor Auto":"🚗","Hybridmotor":"⚡","Elektromotor Auto":"⚡",
    "Motorradmotor":"🏍️","Roller Motor":"🛵","LKW Motor":"🚛","Busmotor":"🚌","Traktormotor":"🚜",
    "Landmaschinenmotor":"🚜","Baumaschinenmotor":"🚧","Baggermotor":"🚧","Gabelstapler Motor":"🏗️",
    "Bootsmotor":"🚤","Außenbordmotor":"🚤","Innenbordmotor":"🚤","Schiffsdieselmotor":"🛳️","Jetski Motor":"🌊",
    "Flugzeugmotor":"✈️","Turbinenmotor":"✈️","Hubschraubermotor":"🚁",
    "Elektromotor Industrie":"⚙️","Drehstrommotor":"⚙️","Servomotor":"🤖","Getriebemotor":"🔩",
    "Generator Motor":"🔋","Pumpenmotor":"💧","Kompressormotor":"🌀","Kranmotor":"🏗️","Aufzugmotor":"🏢",
    "Karussellmotor":"🎡","Achterbahnmotor":"🎢","Drohnenmotor":"🚁","RC Motor":"🏎️","Kartmotor":"🏁",
    "Rasenmähermotor":"🌱","Kettensägenmotor":"🪚","Wasserpumpenmotor":"💧","Hydraulikmotor":"🛠️",
    "CNC Motor":"🧰","Robotermotor":"🤖","Hochleistungsmotor":"🔥","E-Bike Motor":"🚲","Austauschmotor":"🔄",
    "Sonstiges":"📦"
  };
  return m[cat] || "📦";
}

function escapeHtml(v) {
  return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}
