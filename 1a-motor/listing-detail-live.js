document.addEventListener("DOMContentLoaded", async () => {

  const params    = new URLSearchParams(window.location.search);
  const listingId = params.get("id");

  if (!listingId) { showNotFound("Keine Anzeige ausgewählt."); return; }

  // ── Listing laden ─────────────────────────────────────────────────────────
  const { data: listing, error } = await supabaseClient
    .from("listings")
    .select(`
      id, title, manufacturer, model, condition, price, year,
      location, description, status, created_at, image_urls,
      categories(name),
      seller_profiles(id, company_name, city, country, description, logo_url, phone, email)
    `)
    .eq("id", listingId)
    .eq("status", "Freigegeben")
    .single();

  if (error || !listing) { showNotFound("Anzeige wurde nicht gefunden."); return; }


  // SEO: Dynamische Meta Tags
  const ogTitle = document.getElementById("og-title");
  const ogDesc  = document.getElementById("og-description");
  const ogUrl   = document.getElementById("og-url");
  const metaDesc = document.querySelector('meta[name="description"]');

  const seoTitle = `${listing.title} – ${listing.manufacturer || ""} ${listing.model || ""} | 1A Motor`;
  const seoDesc  = `${listing.title} kaufen. ${listing.condition || "Gebraucht"}, ${listing.location || "Deutschland"}. Preis: ${formatPrice(listing.price)}. Direkt beim Händler anfragen.`;

  document.title = seoTitle;
  if (ogTitle)  ogTitle.setAttribute("content", seoTitle);
  if (ogDesc)   ogDesc.setAttribute("content", seoDesc);
  if (ogUrl)    ogUrl.setAttribute("content", `https://1amotor.de/listing-detail.html?id=${listing.id}`);
  if (metaDesc) metaDesc.setAttribute("content", seoDesc);

  // Canonical Tag setzen
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
  canonical.href = `https://1amotor.de/listing-detail.html?id=${listing.id}`;

  fillData(listing);
  setupGallery(listing);
  setupContactForm(listing);
  loadSimilar(listing);
  loadWorkshops(listing);
});

// ── Daten befüllen ────────────────────────────────────────────────────────────
function fillData(listing) {
  const cat    = getCatName(listing);
  const seller = getSellerProfile(listing);
  const price  = formatPrice(listing.price);
  const date   = new Date(listing.created_at).toLocaleDateString("de-DE");

  document.title = `${listing.title || "Anzeige"} – 1A Motor`;

  // Breadcrumb
  setText("breadcrumb-category", cat);
  setText("breadcrumb-brand",    listing.manufacturer || "Hersteller");
  setText("breadcrumb-model",    listing.model || listing.title || "Anzeige");

  // Hero
  setText("category-tag",    cat);
  setText("listing-title",   listing.title || "Ohne Titel");
  setText("listing-sub",     `Inserat-Nr. ${listing.id.slice(0,8)} · Veröffentlicht am ${date}`);
  setText("listing-price",   price);
  setText("listing-location",`📍 ${listing.location || "Standort nicht angegeben"}`);
  setText("status-badge",    listing.status || "Live");
  setText("meta-status",     `Status: ${listing.status || "–"}`);
  setText("meta-date",       `Veröffentlicht: ${date}`);

  // Quick Specs
  const qs = document.getElementById("quick-specs");
  if (qs) {
    qs.innerHTML = `
      <div class="quick-item"><strong>Baujahr</strong><span>${escapeHtml(listing.year || "–")}</span></div>
      <div class="quick-item"><strong>Zustand</strong><span>${escapeHtml(listing.condition || "–")}</span></div>
      <div class="quick-item"><strong>Hersteller</strong><span>${escapeHtml(listing.manufacturer || "–")}</span></div>
      <div class="quick-item"><strong>Standort</strong><span>${escapeHtml(listing.location || "–")}</span></div>`;
  }

  // Beschreibung
  const descBox = document.getElementById("description-box");
  if (descBox) {
    const desc = listing.description?.trim()
      ? escapeHtml(listing.description).replace(/\n/g, "<br>")
      : "Für diese Anzeige wurde noch keine Beschreibung hinterlegt.";
    descBox.innerHTML = `<p>${desc}</p>`;
  }

  // Specs Grid
  const specsGrid = document.getElementById("specs-grid");
  if (specsGrid) {
    specsGrid.innerHTML = [
      ["Hersteller",  listing.manufacturer],
      ["Modell",      listing.model],
      ["Kategorie",   cat],
      ["Zustand",     listing.condition],
      ["Baujahr",     listing.year],
      ["Standort",    listing.location],
      ["Preis",       price],
      ["Status",      listing.status],
    ].map(([label, val]) => `
      <div class="spec-row">
        <span>${label}</span>
        <strong>${escapeHtml(String(val || "–"))}</strong>
      </div>`).join("");
  }

  // Seller
  const initials = getInitials(seller.company_name || "HP");
  const logoEl   = document.getElementById("seller-logo");
  if (logoEl) {
    if (seller.logo_url) {
      logoEl.innerHTML = `<img src="${escapeHtml(seller.logo_url)}" alt="Logo">`;
    } else {
      logoEl.textContent = initials;
    }
  }
  setText("seller-name",     seller.company_name || "Händler");
  setText("seller-location", `${seller.city || "–"}, ${seller.country || "DE"}`);
  setText("seller-status",   listing.status || "Live");
  setText("seller-date",     date);
}

// ── Galerie ───────────────────────────────────────────────────────────────────
function setupGallery(listing) {
  const mainImg  = document.getElementById("main-image");
  const thumbRow = document.getElementById("thumb-row");
  const mainIcon = document.getElementById("main-icon");
  const cat      = getCatName(listing);
  const images   = Array.isArray(listing.image_urls) ? listing.image_urls : [];

  if (!mainImg || !thumbRow) return;

  if (!images.length) {
    if (mainIcon) mainIcon.textContent = getCategoryIcon(cat);
    thumbRow.innerHTML = `<div class="thumb active">${getCategoryIcon(cat)}</div>`;
    return;
  }

  // Erstes Bild setzen
  setMainImage(mainImg, images[0]);
  if (mainIcon) mainIcon.style.display = "none";

  // Bildanzahl Badge
  const countBadge = document.createElement("span");
  countBadge.className = "img-count";
  countBadge.textContent = `1 / ${images.length}`;
  mainImg.appendChild(countBadge);

  // Thumbnails
  thumbRow.innerHTML = images.slice(0, 5).map((url, i) => `
    <div class="thumb ${i === 0 ? "active" : ""}" data-img="${encodeURI(url)}" data-idx="${i}"
      style="background-image:url('${encodeURI(url)}');background-size:cover;background-position:center;">
    </div>`).join("");

  thumbRow.querySelectorAll(".thumb").forEach(thumb => {
    thumb.addEventListener("click", () => {
      const url = thumb.getAttribute("data-img");
      const idx = parseInt(thumb.getAttribute("data-idx")) + 1;
      setMainImage(mainImg, url);
      countBadge.textContent = `${idx} / ${images.length}`;
      thumbRow.querySelectorAll(".thumb").forEach(t => t.classList.remove("active"));
      thumb.classList.add("active");
    });
  });
}

function setMainImage(mainImg, url) {
  mainImg.style.backgroundImage = `url('${encodeURI(url)}')`;
  mainImg.style.backgroundSize  = "cover";
  mainImg.style.backgroundPosition = "center";
  const icon = mainImg.querySelector("#main-icon");
  if (icon) icon.style.display = "none";
}

// ── Kontaktformular ───────────────────────────────────────────────────────────
function setupContactForm(listing) {
  const form    = document.getElementById("contact-form");
  const success = document.getElementById("send-success");
  const submit  = document.getElementById("cf-submit");
  if (!form) return;

  // Eingeloggte Käufer: Felder vorausfüllen
  supabaseClient.auth.getSession().then(({ data }) => {
    const user = data?.session?.user;
    if (user) {
      const nameEl = document.getElementById("cf-name");
      const mailEl = document.getElementById("cf-email");
      if (nameEl && !nameEl.value) nameEl.value = user.user_metadata?.full_name || "";
      if (mailEl && !mailEl.value) mailEl.value = user.email || "";
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name    = document.getElementById("cf-name")?.value?.trim() || "";
    const email   = document.getElementById("cf-email")?.value?.trim() || "";
    const message = document.getElementById("cf-message")?.value?.trim() || "";

    if (!name || !email || !message) return;

    submit.disabled    = true;
    submit.textContent = "Wird gesendet...";

    const { data: sessionData } = await supabaseClient.auth.getSession();
    const buyerUserId = sessionData?.session?.user?.id || null;

    const { error } = await supabaseClient.from("inquiries").insert([{
      listing_id: listing.id, name, email, message,
      status: "Neu", buyer_user_id: buyerUserId
    }]);

    submit.disabled    = false;
    submit.textContent = "📨 Nachricht senden";

    if (error) { alert("Fehler beim Senden. Bitte erneut versuchen."); return; }

    // E-Mail-Benachrichtigung senden
    try {
      const seller = getSellerProfile(listing);
      if (seller.email) {
        await supabaseClient.functions.invoke("send-inquiry-email", {
          body: {
            listing_title: listing.title || "Motor",
            buyer_name:    name,
            buyer_email:   email,
            message:       message,
            seller_email:  seller.email,
            seller_name:   seller.company_name || "Händler"
          }
        });
        console.log("E-Mail-Benachrichtigung gesendet");
      }
    } catch(emailErr) {
      console.warn("E-Mail konnte nicht gesendet werden:", emailErr);
      // Kein alert — Anfrage wurde trotzdem gespeichert
    }

    form.reset();
    if (success) success.style.display = "block";
    setTimeout(() => { if (success) success.style.display = "none"; }, 5000);
  });
}

// ── Ähnliche Anzeigen ─────────────────────────────────────────────────────────
async function loadSimilar(listing) {
  const cat = getCatName(listing);
  const panel = document.getElementById("similar-panel");
  const grid  = document.getElementById("similar-grid");
  if (!panel || !grid) return;

  const { data: similar } = await supabaseClient
    .from("listings")
    .select("id, title, price, image_urls, categories(name)")
    .eq("status", "Freigegeben")
    .neq("id", listing.id)
    .limit(20);

  if (!similar?.length) return;

  // Gleiche Kategorie bevorzugen
  const filtered = [
    ...similar.filter(l => getCatName(l) === cat),
    ...similar.filter(l => getCatName(l) !== cat),
  ].slice(0, 3);

  if (!filtered.length) return;

  panel.style.display = "block";
  grid.innerHTML = filtered.map(l => {
    const img = Array.isArray(l.image_urls) && l.image_urls.length ? l.image_urls[0] : null;
    const imgStyle = img ? `background-image:url('${encodeURI(img)}');background-size:cover;background-position:center;` : "";
    const icon = img ? "" : getCategoryIcon(getCatName(l));
    return `
      <a class="sim-card" href="listing-detail.html?id=${l.id}">
        <div class="sim-img" style="${imgStyle}">${icon}</div>
        <div class="sim-body">
          <div class="sim-title">${escapeHtml(l.title || "Ohne Titel")}</div>
          <div class="sim-price">${formatPrice(l.price)}</div>
        </div>
      </a>`;
  }).join("");
}


// ── Werkstätten in der Nähe ───────────────────────────────────────────────────
function loadWorkshops(listing) {
  const panel    = document.getElementById("workshop-panel");
  const list     = document.getElementById("workshop-list");
  const subtitle = document.getElementById("workshop-subtitle");
  const mapsLink = document.getElementById("workshop-maps-link");
  if (!panel || !list) return;

  const cat      = getCatName(listing);
  const location = listing.location || "Deutschland";
  const config   = getWorkshopConfig(cat);
  if (!config) return; // Keine Werkstätten für diese Kategorie

  if (subtitle) subtitle.textContent = `${config.label} in der Nähe von ${location}`;
  if (mapsLink) mapsLink.href = `https://www.google.com/maps/search/${encodeURIComponent(config.search + " " + location)}`;

  panel.style.display = "block";

  // Demo-Daten (später durch Google Places API ersetzen)
  const demoWorkshops = getDemoWorkshops(config, location);

  list.innerHTML = demoWorkshops.map(ws => `
    <div class="workshop-item" onclick="window.open('https://www.google.com/maps/search/${encodeURIComponent(ws.name + " " + location)}','_blank')">
      <div class="workshop-icon">${config.icon}</div>
      <div class="workshop-info">
        <div class="workshop-name">${escapeHtml(ws.name)}</div>
        <div class="workshop-meta">
          <span class="workshop-badge">
            <span class="stars">${"★".repeat(Math.floor(ws.rating))}${"☆".repeat(5-Math.floor(ws.rating))}</span>
            ${ws.rating} (${ws.reviews} Bewertungen)
          </span>
          <span class="workshop-badge">📍 ${escapeHtml(ws.address)}</span>
          <span class="${ws.open ? 'open-badge' : 'closed-badge'}">${ws.open ? "● Geöffnet" : "● Geschlossen"}</span>
        </div>
      </div>
      <div class="workshop-dist">${ws.distance}</div>
    </div>`).join("");

  // Demo-Hinweis
  list.innerHTML += `
    <div style="padding:10px 14px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;font-size:12px;color:#92400e;display:flex;align-items:center;gap:8px;">
      ⚠️ <span><strong>Demo-Ansicht</strong> — Mit echtem Google Places API Key werden echte Werkstätten in der Nähe von <strong>${escapeHtml(location)}</strong> angezeigt.</span>
    </div>`;
}

function getWorkshopConfig(category) {
  const configs = {
    // Fahrzeugmotoren
    "Automotor":         { icon:"🚗", label:"KFZ-Werkstätten",         search:"KFZ Werkstatt Motorinstandsetzung" },
    "Dieselmotor Auto":  { icon:"🚗", label:"Diesel-Werkstätten",       search:"Diesel Motorwerkstatt" },
    "Benzinmotor Auto":  { icon:"🚗", label:"KFZ-Werkstätten",         search:"KFZ Werkstatt Motor" },
    "LKW Motor":         { icon:"🚛", label:"LKW-Werkstätten",          search:"LKW Nutzfahrzeug Werkstatt" },
    "Busmotor":          { icon:"🚌", label:"Bus-Werkstätten",          search:"Bus Nutzfahrzeug Werkstatt" },
    "Traktormotor":      { icon:"🚜", label:"Landmaschinenwerkstätten", search:"Landmaschinen Traktor Werkstatt" },
    "Landmaschinenmotor":{ icon:"🚜", label:"Landmaschinenwerkstätten", search:"Landmaschinen Werkstatt" },
    "Baumaschinenmotor": { icon:"🚧", label:"Baumaschinenwerkstätten",  search:"Baumaschinen Werkstatt" },
    "Baggermotor":       { icon:"🚧", label:"Baumaschinenwerkstätten",  search:"Bagger Baumaschinen Werkstatt" },
    "Motorradmotor":     { icon:"🏍️", label:"Motorrad-Werkstätten",     search:"Motorrad Werkstatt" },
    // Boot & Flug
    "Bootsmotor":        { icon:"🚤", label:"Boots-Werkstätten",        search:"Bootswerkstatt Bootsmotor" },
    "Außenbordmotor":    { icon:"🚤", label:"Boots-Werkstätten",        search:"Außenbordmotor Werkstatt" },
    "Flugzeugmotor":     { icon:"✈️", label:"Luftfahrzeugwartung",      search:"Luftfahrzeug Wartung MRO Werkstatt" },
    "Hubschraubermotor": { icon:"🚁", label:"Luftfahrzeugwartung",      search:"Hubschrauber Luftfahrzeug Werkstatt" },
    // Industrie
    "Elektromotor Industrie": { icon:"⚙️", label:"Elektromotoren-Instandsetzung", search:"Elektromotor Instandsetzung Reparatur" },
    "Hydraulikmotor":    { icon:"🛠️", label:"Hydraulik-Fachbetriebe",   search:"Hydraulik Werkstatt Service" },
    "CNC Motor":         { icon:"🧰", label:"CNC-Fachbetriebe",         search:"CNC Maschinenwerkstatt" },
    "Robotermotor":      { icon:"🤖", label:"Automatisierungstechnik",  search:"Automatisierung Roboter Werkstatt" },
    "Austauschmotor":    { icon:"🔄", label:"Motorinstandsetzung",      search:"Motorinstandsetzung Austauschmotoren" },
  };

  // Kategorie direkt oder als Teilstring finden
  if (configs[category]) return configs[category];
  for (const [key, val] of Object.entries(configs)) {
    if (category.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(category.toLowerCase())) {
      return val;
    }
  }
  // Fallback für alle anderen
  return { icon:"🔧", label:"Motorenwerkstätten", search:"Motorenwerkstatt Instandsetzung" };
}

function getDemoWorkshops(config, location) {
  // Realistische Demo-Daten passend zur Region
  return [
    {
      name: `Motor-Technik ${location} GmbH`,
      address: `Industriestraße 14, ${location}`,
      rating: 4.7, reviews: 128,
      open: true, distance: "1,2 km"
    },
    {
      name: `${config.icon.includes("✈") ? "Luftfahrt" : config.icon.includes("🚤") ? "Marine" : "Fahrzeug"}-Service Müller`,
      address: `Werkstattring 3, ${location}`,
      rating: 4.4, reviews: 67,
      open: true, distance: "2,8 km"
    },
    {
      name: `Technik-Center ${location}`,
      address: `Gewerbepark 21, ${location}`,
      rating: 4.2, reviews: 43,
      open: false, distance: "4,1 km"
    },
  ];
}

// ── Not Found ─────────────────────────────────────────────────────────────────
function showNotFound(msg) {
  const main = document.querySelector("main");
  if (!main) return;
  main.innerHTML = `
    <div class="container" style="padding:48px 20px;">
      <div style="background:#fff;border:1px solid #dbe3ea;border-radius:14px;padding:36px;text-align:center;max-width:560px;margin:0 auto;">
        <div style="font-size:48px;margin-bottom:12px;">🔍</div>
        <h1 style="font-size:22px;color:#1a3a52;margin-bottom:10px;">Anzeige nicht gefunden</h1>
        <p style="color:#6b7280;margin-bottom:20px;">${escapeHtml(msg)}</p>
        <a href="suche.html" style="display:inline-block;background:#1a3a52;color:#fff;padding:12px 22px;border-radius:999px;font-weight:700;">Zurück zur Suche</a>
      </div>
    </div>`;
}

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────
function getCatName(listing) {
  return Array.isArray(listing.categories) ? listing.categories[0]?.name || "Unbekannt" : listing.categories?.name || "Unbekannt";
}
function getSellerProfile(listing) {
  return Array.isArray(listing.seller_profiles) ? listing.seller_profiles[0] || {} : listing.seller_profiles || {};
}
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function formatPrice(price) {
  return Number(price || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}
function getInitials(text) {
  return String(text).split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase() || "?";
}
function getCategoryIcon(cat) {
  const m = {"Automotor":"🚗","LKW Motor":"🚛","Elektromotor Industrie":"⚙️","Bootsmotor":"🚤","Traktormotor":"🚜","Hydraulikmotor":"🛠️","E-Bike Motor":"🚲","Robotermotor":"🤖","Austauschmotor":"🔄","Flugzeugmotor":"✈️","Karussellmotor":"🎡","Drohnenmotor":"🚁"};
  return m[cat] || "📦";
}
function escapeHtml(v) {
  return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}
