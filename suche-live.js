document.addEventListener("DOMContentLoaded", async () => {
  const categoryHero = document.getElementById("category-hero");
  const categoryHeroTitle = document.getElementById("category-hero-title");
  const pageHead = document.querySelector(".page-head");
  const grid = document.getElementById("search-results");
  const resultsInfo = document.getElementById("results-info");
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");
  const searchButton = document.getElementById("search-button");

  if (!grid) return;

  const params = new URLSearchParams(window.location.search);
  const urlQuery = (params.get("q") || "").trim();
  const urlCategory = (params.get("category") || "").trim();

  if (searchInput) searchInput.value = urlQuery;

  grid.innerHTML = `
    <div class="empty-box">
      <h3>Anzeigen werden geladen</h3>
      <p>Bitte kurz warten...</p>
    </div>
  `;

  const heroConfig = [
    {
      match: ["aufzug"],
      title: "Aufzugsmotoren",
      image: "images/aufzugsmotor-header.png"
    },
    {
      match: ["boot"],
      title: "Bootsmotoren",
      image: "images/bootsmotor-header.png"
    },
    {
      match: ["achterbahn"],
      title: "Achterbahnmotoren",
      image: "images/achterbahnmotor-header.png"
    },
    {
      match: ["arcade"],
      title: "Arcade Motor",
      image: "images/arcade-motor-header.png"
    },
    {
      match: ["asynchron"],
      title: "Asynchronmotor",
      image: "images/asynchronmotor-header.png"
    },

    {
      match: ["karussell"],
      title: "Karussellmotor",
      image: "images/karussellmotor-header.png"
    },
    {
      match: ["fahrgeschäft"],
      title: "Fahrgeschäft Motor",
      image: "images/fahrgeschaeft-motor-header.png"
    },
    {
      match: ["schausteller"],
      title: "Schausteller Motor",
      image: "images/schausteller-motor-header.png"
    },
    {
      match: ["spielautomat"],
      title: "Spielautomaten Motor",
      image: "images/spielautomaten-motor-header.png"
    },
    {
      match: ["drohne"],
      title: "Drohnenmotor",
      image: "images/drohnenmotor-header.png"
    },
    {
      match: ["modellbau"],
      title: "Modellbau Motor",
      image: "images/modellbau-motor-header.png"
    },
    {
      match: ["rc motor", "rc"],
      title: "RC Motor",
      image: "images/rc-motor-header.png"
    },
    {
      match: ["kartmotor", "kart"],
      title: "Kartmotor",
      image: "images/kartmotor-header.png"
    },
    {
      match: ["rasenmäher", "rasenmaeher"],
      title: "Rasenmähermotor",
      image: "images/rasenmaehermotor-header.png"
    },
    {
      match: ["aufsitzmäher", "aufsitzmaeher"],
      title: "Aufsitzmäher Motor",
      image: "images/aufsitzmaeher-motor-header.png"
    },
    {
      match: ["kettensäge", "kettensaege"],
      title: "Kettensägenmotor",
      image: "images/kettensaegenmotor-header.png"
    },
    {
      match: ["heckenschere"],
      title: "Heckenscherenmotor",
      image: "images/heckenscherenmotor-header.png"
    },
    {
      match: ["laubbläser", "laubblaeser"],
      title: "Laubbläser Motor",
      image: "images/laubblaeser-motor-header.png"
    },
    {
      match: ["schneefräse", "schneefraese"],
      title: "Schneefräsenmotor",
      image: "images/schneefraesenmotor-header.png"
    },
    {
      match: ["generator kleinmotor"],
      title: "Generator Kleinmotor",
      image: "images/generator-kleinmotor-header.png"
    },
    {
      match: ["stromaggregat"],
      title: "Stromaggregat Motor",
      image: "images/stromaggregat-motor-header.png"
    },
    {
      match: ["wasserpumpe"],
      title: "Wasserpumpenmotor",
      image: "images/wasserpumpenmotor-header.png"
    },
    {
      match: ["gartenmaschine"],
      title: "Gartenmaschinenmotor",
      image: "images/gartenmaschinenmotor-header.png"
    },
    {
      match: ["hydraulik"],
      title: "Hydraulikmotor",
      image: "images/hydraulikmotor-header.png"
    },
    {
      match: ["pneumatik"],
      title: "Pneumatikmotor",
      image: "images/pneumatikmotor-header.png"
    },
    {
      match: ["vibration"],
      title: "Vibrationsmotor",
      image: "images/vibrationsmotor-header.png"
    },
    {
      match: ["spindel"],
      title: "Spindelmotor",
      image: "images/spindelmotor-header.png"
    },
    {
      match: ["hochleistung"],
      title: "Hochleistungsmotor",
      image: "images/hochleistungsmotor-header.png"
    },
    {
      match: ["präzision", "praezision"],
      title: "Präzisionsmotor",
      image: "images/praezisionsmotor-header.png"
    },
    {
      match: ["cnc"],
      title: "CNC Motor",
      image: "images/cnc-motor-header.png"
    },
    {
      match: ["roboter"],
      title: "Robotermotor",
      image: "images/robotermotor-header.png"
    },
    {
      match: ["industrieroboter"],
      title: "Industrieroboter Motor",
      image: "images/industrieroboter-motor-header.png"
    },
    {
      match: ["werkzeugmaschine"],
      title: "Werkzeugmaschinenmotor",
      image: "images/werkzeugmaschinenmotor-header.png"
    },
    {
      match: ["e-bike", "ebike"],
      title: "E-Bike Motor",
      image: "images/e-bike-motor-header.png"
    },
    {
      match: ["elektro roller"],
      title: "Elektro Roller Motor",
      image: "images/elektro-roller-motor-header.png"
    },
    {
      match: ["elektro motorrad"],
      title: "Elektro Motorrad Motor",
      image: "images/elektro-motorrad-motor-header.png"
    },
    {
      match: ["elektro bootsmotor"],
      title: "Elektro Bootsmotor",
      image: "images/elektro-bootsmotor-header.png"
    },
    {
      match: ["elektro außenbord", "elektro aussenbord"],
      title: "Elektro Außenbordmotor",
      image: "images/elektro-aussenbordmotor-header.png"
    },
    {
      match: ["elektro flug"],
      title: "Elektro Flugmotor",
      image: "images/elektro-flugmotor-header.png"
    },
    {
      match: ["smart motor"],
      title: "Smart Motor",
      image: "images/smart-motor-header.png"
    },
    {
      match: ["iot"],
      title: "IoT Motor",
      image: "images/iot-motor-header.png"
    },
    {
      match: ["energiespar"],
      title: "Energiesparmotor",
      image: "images/energiesparmotor-header.png"
    },
    {
      match: ["permanentmagnet"],
      title: "Permanentmagnet Motor",
      image: "images/permanentmagnet-motor-header.png"
    },
    {
      match: ["gasturbine"],
      title: "Gasturbinenmotor",
      image: "images/gasturbinenmotor-header.png"
    },
    {
      match: ["dampfturbine"],
      title: "Dampfturbinenmotor",
      image: "images/dampfturbinenmotor-header.png"
    },
    {
      match: ["dieselaggregat"],
      title: "Dieselaggregat Motor",
      image: "images/dieselaggregat-motor-header.png"
    },
    {
      match: ["notstromaggregat"],
      title: "Notstromaggregat Motor",
      image: "images/notstromaggregat-motor-header.png"
    },
    {
      match: ["industrie diesel"],
      title: "Industrie Diesel Motor",
      image: "images/industrie-diesel-motor-header.png"
    },
    {
      match: ["schiffsturbine"],
      title: "Schiffsturbinenmotor",
      image: "images/schiffsturbinenmotor-header.png"
    },
    {
      match: ["hochdrehzahl"],
      title: "Hochdrehzahlmotor",
      image: "images/hochdrehzahlmotor-header.png"
    },
    {
      match: ["schwerlast"],
      title: "Schwerlastmotor",
      image: "images/schwerlastmotor-header.png"
    },
    {
      match: ["spezialanfertigung"],
      title: "Spezialanfertigung Motor",
      image: "images/spezialanfertigung-motor-header.png"
    },
    {
      match: ["austausch"],
      title: "Austauschmotor",
      image: "images/austauschmotor-header.png"
    },
    {
      match: ["sonstiges"],
      title: "Sonstiges",
      image: "images/sonstiges-header.png"
    }
  ];

  applyCategoryHero(urlCategory);

  const { data: categories, error: categoriesError } = await supabaseClient
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  if (!categoriesError && categoryFilter) {
    categoryFilter.innerHTML = `
      <option value="">Alle Kategorien</option>
      ${(categories || []).map(cat => `
        <option value="${escapeHtml(cat.name)}">${escapeHtml(cat.name)}</option>
      `).join("")}
    `;
    categoryFilter.value = urlCategory;
  }

  const { data, error } = await supabaseClient
    .from("listings")
    .select(`
      id,
      title,
      manufacturer,
      model,
      condition,
      price,
      year,
      location,
      description,
      status,
      created_at,
      image_urls,
      categories(name)
    `)
    .eq("status", "Freigegeben")
    .order("created_at", { ascending: false });

  console.log("SUPABASE LISTINGS:", data);
  console.log("SUPABASE LISTINGS ERROR:", error);

  if (error) {
    grid.innerHTML = `
      <div class="empty-box">
        <h3>Fehler beim Laden der Anzeigen</h3>
        <p>Schau in die Browser-Konsole, um den genauen Fehler zu sehen.</p>
      </div>
    `;
    return;
  }

  let listings = data || [];

  if (urlQuery) {
    const q = urlQuery.toLowerCase();
    listings = listings.filter((listing) => {
      const categoryName = Array.isArray(listing.categories)
        ? listing.categories[0]?.name || ""
        : listing.categories?.name || "";

      return (
        (listing.title || "").toLowerCase().includes(q) ||
        (listing.manufacturer || "").toLowerCase().includes(q) ||
        (listing.model || "").toLowerCase().includes(q) ||
        (listing.description || "").toLowerCase().includes(q) ||
        categoryName.toLowerCase().includes(q)
      );
    });
  }

  if (urlCategory) {
    listings = listings.filter((listing) => {
      const categoryName = Array.isArray(listing.categories)
        ? listing.categories[0]?.name || ""
        : listing.categories?.name || "";

      return categoryName === urlCategory;
    });
  }

  if (resultsInfo) {
    resultsInfo.textContent = `${listings.length} Ergebnis${listings.length === 1 ? "" : "se"} gefunden`;
  }

  if (!listings.length) {
    grid.innerHTML = `
      <div class="empty-box">
        <h3>Keine passenden Anzeigen gefunden</h3>
        <p>Ändere deinen Suchbegriff oder wähle eine andere Kategorie.</p>
      </div>
    `;
  } else {
    grid.innerHTML = listings.map((listing) => {
      const category = Array.isArray(listing.categories)
        ? listing.categories[0]?.name || "Unbekannt"
        : listing.categories?.name || "Unbekannt";

      const icon = getCategoryIcon(category);
      const createdAt = new Date(listing.created_at).toLocaleDateString("de-DE");

      const firstImage = Array.isArray(listing.image_urls) && listing.image_urls.length
        ? listing.image_urls[0]
        : null;

      const safeImage = firstImage || "";
      const imageStyle = safeImage
        ? `style="background-image:url('${safeImage}'); background-size:cover; background-position:center; background-repeat:no-repeat;"`
        : "";

      return `
        <a class="listing-card" href="listing-detail.html?id=${encodeURIComponent(listing.id)}">
          <div class="card-image" ${imageStyle}>
            <span class="badge">Live</span>
            ${firstImage ? "" : icon}
          </div>
          <div class="card-body">
            <div class="card-title">${escapeHtml(listing.title || "Ohne Titel")}</div>
            <div class="card-meta">
              <span>Kategorie: ${escapeHtml(category)}</span>
              <span>Zustand: ${escapeHtml(listing.condition || "-")}</span>
            </div>
            <div class="price">${formatPrice(listing.price)}</div>
            <div class="card-meta">
              <span>${escapeHtml(listing.manufacturer || "")}</span>
              <span>${escapeHtml(listing.model || "")}</span>
              <span>${escapeHtml(listing.location || "-")}</span>
            </div>
            <div class="card-actions">
              <span class="action-btn primary">Details ansehen</span>
              <span class="action-btn">${createdAt}</span>
            </div>
          </div>
        </a>
      `;
    }).join("");
  }

  searchButton?.addEventListener("click", goToSearch);
  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      goToSearch();
    }
  });
  categoryFilter?.addEventListener("change", goToSearch);

  function goToSearch() {
    const q = (searchInput?.value || "").trim();
    const category = (categoryFilter?.value || "").trim();

    const nextParams = new URLSearchParams();
    if (q) nextParams.set("q", q);
    if (category) nextParams.set("category", category);

    const queryString = nextParams.toString();
    window.location.href = queryString ? `suche.html?${queryString}` : "suche.html";
  }

  function applyCategoryHero(categoryValue) {
    if (!categoryHero || !categoryHeroTitle || !categoryValue) return;

    const normalizedCategory = categoryValue.toLowerCase();
    const hero = heroConfig.find(entry =>
      entry.match.some(keyword => normalizedCategory.includes(keyword))
    );

    if (!hero) return;

    categoryHero.style.display = "block";
    categoryHero.style.backgroundImage = `url('${hero.image}')`;
    categoryHeroTitle.textContent = hero.title;

    if (pageHead) {
      pageHead.style.display = "none";
    }
  }
});

function formatPrice(price) {
  const value = Number(price || 0);
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR"
  });
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