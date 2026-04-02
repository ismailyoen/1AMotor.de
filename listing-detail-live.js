document.addEventListener("DOMContentLoaded", async () => {
  console.log("listing-detail-live.js geladen");

  const params = new URLSearchParams(window.location.search);
  const listingId = params.get("id") || localStorage.getItem("current_listing_id");

  console.log("CURRENT LISTING ID:", listingId);

  if (!listingId) {
    showNotFound("Keine Anzeige ausgewählt.");
    return;
  }

  const { data: listing, error } = await supabaseClient
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
      categories(name),
      seller_profiles(
        id,
        company_name,
        city,
        country,
        description
      )
    `)
    .eq("id", listingId)
    .eq("status", "Freigegeben")
    .single();

  console.log("LISTING RESULT:", listing);
  console.log("LISTING ERROR:", error);

  if (error || !listing) {
    showNotFound("Anzeige wurde nicht gefunden.");
    return;
  }

  fillListingData(listing);
  setupGallery(listing);
  setupInquiryForm(listing);
});

function fillListingData(listing) {
  const categoryName = Array.isArray(listing.categories)
    ? listing.categories[0]?.name || "Unbekannt"
    : listing.categories?.name || "Unbekannt";

  const sellerProfile = Array.isArray(listing.seller_profiles)
    ? listing.seller_profiles[0] || {}
    : listing.seller_profiles || {};

  const formattedPrice = Number(listing.price || 0).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR"
  });

  const formattedDate = new Date(listing.created_at).toLocaleDateString("de-DE");

  document.title = `${listing.title || "Anzeige"} – 1A Motor`;

  const categoryTag = document.querySelector(".category-tag");
  const listingTitle = document.querySelector(".listing-title");
  const listingSub = document.querySelector(".listing-sub");
  const price = document.querySelector(".price");
  const priceNote = document.querySelector(".price-note");
  const descriptionBox = document.querySelector(".description");
  const specsGrid = document.querySelector(".specs-grid");

  if (categoryTag) categoryTag.textContent = categoryName;
  if (listingTitle) listingTitle.textContent = listing.title || "Ohne Titel";
  if (listingSub) listingSub.textContent = `Inserat-Nr. ${listing.id} · Veröffentlicht am ${formattedDate}`;
  if (price) price.textContent = formattedPrice;
  if (priceNote) priceNote.textContent = `Standort: ${listing.location || "-"}`;

  const breadcrumbCategory = document.getElementById("breadcrumb-category");
  const breadcrumbBrand = document.getElementById("breadcrumb-brand");
  const breadcrumbModel = document.getElementById("breadcrumb-model");

  if (breadcrumbCategory) breadcrumbCategory.textContent = categoryName;
  if (breadcrumbBrand) breadcrumbBrand.textContent = listing.manufacturer || "Hersteller";
  if (breadcrumbModel) breadcrumbModel.textContent = listing.model || listing.title || "Anzeige";

  const metaLocation = document.getElementById("meta-location");
  const metaStatus = document.getElementById("meta-status");

  if (metaLocation) metaLocation.textContent = `Standort: ${listing.location || "-"}`;
  if (metaStatus) metaStatus.textContent = `Status: ${listing.status || "-"}`;

  const quickSpecs = document.querySelector(".quick-specs");
  if (quickSpecs) {
    quickSpecs.innerHTML = `
      <div class="quick-item">
        <strong>Baujahr</strong>
        <span>${escapeHtml(listing.year || "-")}</span>
      </div>
      <div class="quick-item">
        <strong>Standort</strong>
        <span>${escapeHtml(listing.location || "-")}</span>
      </div>
      <div class="quick-item">
        <strong>Zustand</strong>
        <span>${escapeHtml(listing.condition || "-")}</span>
      </div>
      <div class="quick-item">
        <strong>Hersteller</strong>
        <span>${escapeHtml(listing.manufacturer || "-")}</span>
      </div>
    `;
  }

  if (descriptionBox) {
    const description = listing.description?.trim()
      ? escapeHtml(listing.description).replace(/\n/g, "<br>")
      : "Für diese Anzeige wurde noch keine Beschreibung hinterlegt.";

    descriptionBox.innerHTML = `
      <h2>Beschreibung</h2>
      <p>${description}</p>
    `;
  }

  if (specsGrid) {
    specsGrid.innerHTML = `
      <div class="spec-row"><span>Hersteller</span><strong>${escapeHtml(listing.manufacturer || "-")}</strong></div>
      <div class="spec-row"><span>Modell</span><strong>${escapeHtml(listing.model || "-")}</strong></div>
      <div class="spec-row"><span>Kategorie</span><strong>${escapeHtml(categoryName)}</strong></div>
      <div class="spec-row"><span>Zustand</span><strong>${escapeHtml(listing.condition || "-")}</strong></div>
      <div class="spec-row"><span>Baujahr</span><strong>${escapeHtml(listing.year || "-")}</strong></div>
      <div class="spec-row"><span>Standort</span><strong>${escapeHtml(listing.location || "-")}</strong></div>
      <div class="spec-row"><span>Preis</span><strong>${formattedPrice}</strong></div>
      <div class="spec-row"><span>Status</span><strong>${escapeHtml(listing.status || "-")}</strong></div>
    `;
  }

  const sellerLogo = document.querySelector(".seller-logo");
  const sellerName = document.querySelector(".seller-head h3");
  const sellerSub = document.querySelector(".seller-head p");
  const sellerStats = document.querySelector(".seller-stats");

  if (sellerLogo) sellerLogo.textContent = getInitials(sellerProfile.company_name || "HP");
  if (sellerName) sellerName.textContent = sellerProfile.company_name || "Händler";
  if (sellerSub) sellerSub.textContent = `${sellerProfile.city || "-"}, ${sellerProfile.country || "-"}`;

  if (sellerStats) {
    sellerStats.innerHTML = `
      <div class="seller-stat">
        <strong>${escapeHtml(listing.status || "Live")}</strong>
        <span>Status</span>
      </div>
      <div class="seller-stat">
        <strong>${formattedDate}</strong>
        <span>Veröffentlicht</span>
      </div>
    `;
  }
}

function setupGallery(listing) {
  const mainImage = document.querySelector(".main-image");
  const thumbRow = document.querySelector(".thumb-row");

  const categoryName = Array.isArray(listing.categories)
    ? listing.categories[0]?.name || "Unbekannt"
    : listing.categories?.name || "Unbekannt";

  const images = Array.isArray(listing.image_urls) ? listing.image_urls : [];

  if (!mainImage || !thumbRow) return;

  if (!images.length) {
    mainImage.innerHTML = `
      <span class="top-badge">${escapeHtml(listing.status || "Live")}</span>
      <span class="favorite-btn">♡</span>
      ${getCategoryIcon(categoryName)}
    `;
    thumbRow.innerHTML = `
      <div class="thumb active">${getCategoryIcon(categoryName)}</div>
    `;
    return;
  }

  setMainImage(mainImage, images[0], listing.status);

  thumbRow.innerHTML = images.map((imageUrl, index) => {
    return `
      <div
        class="thumb ${index === 0 ? "active" : ""}"
        data-image="${imageUrl}"
        style="background-image:url('${imageUrl}');background-size:cover;background-position:center;"
        title="Bild ${index + 1}">
      </div>
    `;
  }).join("");

  const thumbs = thumbRow.querySelectorAll(".thumb");
  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      const imageUrl = thumb.getAttribute("data-image");
      setMainImage(mainImage, imageUrl, listing.status);

      thumbs.forEach(t => t.classList.remove("active"));
      thumb.classList.add("active");
    });
  });
}

function setMainImage(mainImage, imageUrl, status) {
  const safeImage = imageUrl || "";

  mainImage.innerHTML = `
    <span class="top-badge">${escapeHtml(status || "Live")}</span>
    <span class="favorite-btn">♡</span>
  `;
  mainImage.style.backgroundImage = safeImage ? `url('${safeImage}')` : "";
  mainImage.style.backgroundSize = "cover";
  mainImage.style.backgroundPosition = "center";
  mainImage.style.backgroundRepeat = "no-repeat";
}

function setupInquiryForm(listing) {
  const form = document.querySelector(".contact-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const name = form.querySelector('input[type="text"]')?.value?.trim() || "";
    const email = form.querySelector('input[type="email"]')?.value?.trim() || "";
    const message = form.querySelector("textarea")?.value?.trim() || "";

    if (!name || !email || !message) {
      alert("Bitte Name, E-Mail und Nachricht ausfüllen.");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Wird gesendet...";
    }

    const { data: sessionData } = await supabaseClient.auth.getSession();
    const buyerUserId = sessionData?.session?.user?.id || null;

    console.log("BUYER USER ID:", buyerUserId);

    const { error } = await supabaseClient
      .from("inquiries")
      .insert([
        {
          listing_id: listing.id,
          name,
          email,
          message,
          status: "Neu",
          buyer_user_id: buyerUserId
        }
      ]);

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Nachricht senden";
    }

    if (error) {
      console.error("INQUIRY INSERT ERROR:", error);
      alert("Fehler beim Senden der Anfrage.");
      return;
    }

    alert("Anfrage wurde erfolgreich gesendet.");
    form.reset();
  });
}

function showNotFound(message) {
  const main = document.querySelector("main");
  if (!main) return;

  main.innerHTML = `
    <div class="container" style="padding:40px 20px;">
      <div style="background:white;border:1px solid #dbe3ea;border-radius:16px;padding:30px;">
        <h1 style="margin-bottom:10px;color:#123a63;">Anzeige nicht verfügbar</h1>
        <p style="color:#6b7280;margin-bottom:16px;">${escapeHtml(message)}</p>
        <a href="suche.html" style="display:inline-block;background:#123a63;color:white;padding:12px 18px;border-radius:999px;font-weight:700;">Zurück zur Suche</a>
      </div>
    </div>
  `;
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

function getInitials(text) {
  return String(text)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0])
    .join("")
    .toUpperCase();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}