document.addEventListener("DOMContentLoaded", async () => {
  console.log("listing-detail-live.js geladen");

  const params = new URLSearchParams(window.location.search);
  const listingId = params.get("id") || localStorage.getItem("current_listing_id");

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

  if (error || !listing) {
    showNotFound("Anzeige wurde nicht gefunden.");
    return;
  }

  fillListingData(listing);
  setupGallery(listing);
  setupContactForm(listing);
});

/* ─────────────────────────────────────────────────────────
   LISTING DATA FÜLLEN
───────────────────────────────────────────────────────── */
function fillListingData(listing) {
  const categoryName = Array.isArray(listing.categories)
    ? listing.categories[0]?.name || "Sonstige"
    : listing.categories?.name || "Sonstige";

  const seller = Array.isArray(listing.seller_profiles)
    ? listing.seller_profiles[0] || {}
    : listing.seller_profiles || {};

  const priceFormatted = Number(listing.price || 0).toLocaleString("de-DE", {
    style: "currency", currency: "EUR"
  });

  const dateFormatted = new Date(listing.created_at).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric"
  });

  /* ── SEO ── */
  const seoTitle = `${listing.title || "Anzeige"} – 1A Motor`;
  const seoDesc  = `${listing.title || "Motor"} kaufen bei ${seller.company_name || "geprüftem Händler"} auf 1A Motor. ${listing.condition || "Gebraucht"}, Standort: ${listing.location || "Deutschland"}. Jetzt direkt anfragen.`;
  const seoUrl   = `https://1amotor.de/listing-detail.html?id=${listing.id}`;
  const seoImg   = (Array.isArray(listing.image_urls) && listing.image_urls[0]) ? listing.image_urls[0] : "https://1amotor.de/hero-bg.png";

  document.title = seoTitle;
  setMeta("meta[name='description']", "content", seoDesc);
  setOrCreateLink("canonical", seoUrl);
  setMeta("#og-title",       "content", seoTitle);
  setMeta("#og-description", "content", seoDesc);
  setMeta("#og-url",         "content", seoUrl);
  setMeta("meta[property='og:image']", "content", seoImg);
  const twTitle = document.getElementById("tw-title");
  const twDesc  = document.getElementById("tw-description");
  if (twTitle) twTitle.content = seoTitle;
  if (twDesc)  twDesc.content  = seoDesc;

  const schemaEl = document.getElementById("schema-product");
  if (schemaEl) {
    schemaEl.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      "name": listing.title || "Motor",
      "description": seoDesc,
      "image": seoImg,
      "brand": { "@type": "Brand", "name": listing.manufacturer || "Unbekannt" },
      "offers": {
        "@type": "Offer",
        "priceCurrency": "EUR",
        "price": Number(listing.price || 0),
        "availability": "https://schema.org/InStock",
        "url": seoUrl,
        "seller": { "@type": "Organization", "name": seller.company_name || "Händler auf 1A Motor" }
      }
    });
  }

  /* ── Breadcrumbs ── */
  set("breadcrumb-category", categoryName);
  set("breadcrumb-brand",    listing.manufacturer || "Hersteller");
  set("breadcrumb-model",    listing.model || listing.title || "Anzeige");

  /* ── Kategorie ── */
  const icon = getCategoryIcon(categoryName);
  set("category-tag",  icon + " " + categoryName);
  set("cat-badge",     categoryName);

  /* ── Titel / Status / Datum ── */
  set("listing-title",  listing.title || "Ohne Titel");
  set("title-overlay",  listing.title || "Ohne Titel");
  set("meta-status",    listing.status || "–");
  set("meta-date",      "📅 " + dateFormatted);
  set("meta-date2",     dateFormatted);
  set("meta-id",        (listing.id || "").slice(0, 8) + "…");

  /* ── Preis ── */
  set("listing-price",   priceFormatted);
  set("price-overlay",   priceFormatted);
  set("listing-location","📍 " + (listing.location || "–"));

  /* ── Quick Specs ── */
  const qs = document.getElementById("quick-specs");
  if (qs) {
    qs.innerHTML = `
      <div class="q-item"><div class="q-label">Baujahr</div><div class="q-val">${esc(listing.year || "–")}</div></div>
      <div class="q-item"><div class="q-label">Zustand</div><div class="q-val">${esc(listing.condition || "–")}</div></div>
      <div class="q-item"><div class="q-label">Hersteller</div><div class="q-val">${esc(listing.manufacturer || "–")}</div></div>
      <div class="q-item"><div class="q-label">Standort</div><div class="q-val">${esc(listing.location || "–")}</div></div>
    `;
  }

  /* ── Status Badge Farbe ── */
  const statusBadge = document.getElementById("status-badge");
  if (statusBadge) {
    statusBadge.textContent = listing.status || "Live";
    if (listing.status === "Freigegeben") statusBadge.classList.add("g-badge-ok");
  }

  /* ── Beschreibung ── */
  const descBox = document.getElementById("description-box");
  if (descBox) {
    const txt = listing.description?.trim()
      ? esc(listing.description).replace(/\n/g, "<br>")
      : "<span style='color:#94a3b8;'>Keine Beschreibung vorhanden.</span>";
    descBox.innerHTML = `<p>${txt}</p>`;
  }

  /* ── Technische Daten ── */
  const specsGrid = document.getElementById("specs-grid");
  if (specsGrid) {
    specsGrid.innerHTML = [
      ["Hersteller",  listing.manufacturer],
      ["Modell",      listing.model],
      ["Kategorie",   categoryName],
      ["Zustand",     listing.condition],
      ["Baujahr",     listing.year],
      ["Standort",    listing.location],
      ["Preis",       priceFormatted],
      ["Status",      listing.status],
    ].map(([k, v]) => `
      <div class="spec-item">
        <span class="spec-key">${esc(k)}</span>
        <strong class="spec-val">${esc(String(v || "–"))}</strong>
      </div>
    `).join("");
  }

  /* ── Händler / Kontaktkarte ── */
  const logoEl = document.getElementById("seller-logo");
  const nameEl = document.getElementById("seller-name");
  const locEl  = document.getElementById("seller-location");
  const statEl = document.getElementById("seller-status");
  const dateEl = document.getElementById("seller-date");

  if (logoEl) logoEl.textContent = initials(seller.company_name || "HP");
  if (nameEl) nameEl.textContent = seller.company_name || "Händler auf 1A Motor";
  if (locEl)  locEl.textContent  = [seller.city, seller.country].filter(Boolean).join(", ") || "–";
  if (statEl) statEl.textContent = listing.status || "Live";
  if (dateEl) dateEl.textContent = dateFormatted;

  /* ── Ähnliche laden ── */
  loadSimilar(listing, categoryName);
  renderShipping(listing);
  window._setSellerIdFromListing(listing);
}

/* ─────────────────────────────────────────────────────────
   GALERIE
───────────────────────────────────────────────────────── */
// Seller ID für reviews.js (wird von fillListingData gesetzt)
// Fallback: direkt aus listing extrahieren
window._setSellerIdFromListing = function(listing) {
  const sp = Array.isArray(listing.seller_profiles) ? listing.seller_profiles[0] : listing.seller_profiles;
  if (sp?.id) window._currentSellerId = sp.id;
};

function setupGallery(listing) {
  const mainImg = document.getElementById("main-image");
  const thumbRow = document.getElementById("thumb-row");
  const counter = document.getElementById("img-counter");

  const categoryName = Array.isArray(listing.categories)
    ? listing.categories[0]?.name || "Sonstige"
    : listing.categories?.name || "Sonstige";

  const images = Array.isArray(listing.image_urls)
    ? listing.image_urls.filter(Boolean)
    : [];

  const iconEl = document.getElementById("main-icon");

  if (!images.length) {
    if (iconEl) { iconEl.textContent = getCategoryIcon(categoryName); iconEl.style.display = "block"; }
    if (thumbRow) thumbRow.innerHTML = `<div class="thumb active" style="font-size:20px;">${getCategoryIcon(categoryName)}</div>`;
    return;
  }

  // Bild laden
  function setImg(url) {
    if (!mainImg) return;
    mainImg.style.backgroundImage = `url('${url}')`;
    mainImg.style.backgroundSize = "cover";
    mainImg.style.backgroundPosition = "center";
    if (iconEl) iconEl.style.display = "none";
  }

  setImg(images[0]);
  if (counter && images.length > 1) {
    counter.style.display = "block";
    counter.textContent = `1 / ${images.length}`;
  }

  // Thumbs
  if (thumbRow) {
    thumbRow.innerHTML = images.map((url, i) => `
      <div class="thumb ${i === 0 ? "active" : ""}"
        data-url="${url}" data-idx="${i}"
        style="background-image:url('${url}');background-size:cover;background-position:center;"
        title="Bild ${i + 1}">
      </div>
    `).join("");

    thumbRow.querySelectorAll(".thumb").forEach(t => {
      t.addEventListener("click", () => {
        const url = t.getAttribute("data-url");
        const idx = parseInt(t.getAttribute("data-idx")) + 1;
        setImg(url);
        thumbRow.querySelectorAll(".thumb").forEach(x => x.classList.remove("active"));
        t.classList.add("active");
        if (counter) counter.textContent = `${idx} / ${images.length}`;
      });
    });
  }
}

/* ─────────────────────────────────────────────────────────
   ÄHNLICHE ANZEIGEN
───────────────────────────────────────────────────────── */
async function loadSimilar(listing, categoryName) {
  const categoryId = Array.isArray(listing.categories)
    ? listing.categories[0]?.id
    : listing.categories?.id;

  if (!categoryId) return;

  const { data: similar } = await supabaseClient
    .from("listings")
    .select("id, title, price, condition, year, image_urls, categories(name)")
    .eq("status", "Freigegeben")
    .eq("category_id", categoryId)
    .neq("id", listing.id)
    .limit(3);

  if (!similar || !similar.length) return;

  const panel = document.getElementById("similar-panel");
  const grid  = document.getElementById("similar-grid");
  if (!panel || !grid) return;

  grid.innerHTML = similar.map(s => {
    const img   = Array.isArray(s.image_urls) && s.image_urls[0];
    const price = Number(s.price || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
    const icon  = getCategoryIcon(s.categories?.name || "Sonstige");
    const imgStyle = img ? `background-image:url('${img}');background-size:cover;background-position:center;` : "";
    return `
      <a class="sim-card" href="listing-detail.html?id=${s.id}">
        <div class="sim-img" style="${imgStyle}">${img ? "" : icon}</div>
        <div class="sim-bd">
          <div class="sim-title">${esc(s.title || "Motor")}</div>
          <div class="sim-price">${price}</div>
          <div class="sim-meta">${esc(s.condition || "")} ${s.year ? "· " + s.year : ""}</div>
        </div>
      </a>
    `;
  }).join("");

  panel.style.display = "block";
}

/* ─────────────────────────────────────────────────────────
   KONTAKTFORMULAR
───────────────────────────────────────────────────────── */
function setupContactForm(listing) {
  const form = document.getElementById("contact-form");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();

    const btn     = document.getElementById("cf-submit");
    const name    = document.getElementById("cf-name")?.value?.trim() || "";
    const email   = document.getElementById("cf-email")?.value?.trim() || "";
    const message = document.getElementById("cf-message")?.value?.trim() || "";

    if (!name || !email || !message) {
      showFormError("Bitte Name, E-Mail und Nachricht ausfüllen.");
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = "Wird gesendet…"; }

    // Adresse einlesen wenn Versand gewünscht
    const wantsShipping = document.getElementById('cf-needs-shipping')?.checked;
    let addressBlock = '';
    if (wantsShipping) {
      const fn  = document.getElementById('addr-firstname')?.value.trim() || '';
      const ln  = document.getElementById('addr-lastname')?.value.trim()  || '';
      const str = document.getElementById('addr-street')?.value.trim()   || '';
      const zip = document.getElementById('addr-zip')?.value.trim()      || '';
      const cty = document.getElementById('addr-city')?.value.trim()     || '';
      if (str && zip && cty) {
        addressBlock = `\n\n📦 LIEFERADRESSE:\n${fn} ${ln}\n${str}\n${zip} ${cty}\nDeutschland`;
      }
    }
    const finalMessage = message + addressBlock;

    const { data: sessionData } = await supabaseClient.auth.getSession();
    const buyerUserId = sessionData?.session?.user?.id || null;

    const { error } = await supabaseClient.from("inquiries").insert([{
      listing_id: listing.id,
      name, email, message,
      status: "Neu",
      buyer_user_id: buyerUserId
    }]);

    if (btn) { btn.disabled = false; btn.textContent = "Nachricht senden"; }

    if (error) {
      showFormError("Fehler beim Senden – bitte erneut versuchen.");
      return;
    }

    const successEl = document.getElementById("send-success");
    if (successEl) successEl.style.display = "block";
    form.reset();
    if (btn) {
      btn.textContent = "✓ Gesendet";
      btn.style.background = "linear-gradient(135deg,#059669,#0ea371)";
    }
  });
}

function showFormError(msg) {
  const existing = document.getElementById("cf-error-msg");
  if (existing) existing.remove();
  const el = document.createElement("div");
  el.id = "cf-error-msg";
  el.style.cssText = "background:#fff5f5;border:1px solid #fca5a5;color:#b91c1c;padding:10px 14px;border-radius:10px;font-size:13px;";
  el.textContent = msg;
  const form = document.getElementById("contact-form");
  form?.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

/* ─────────────────────────────────────────────────────────
   NOT FOUND
───────────────────────────────────────────────────────── */
function showNotFound(message) {
  const main = document.querySelector("main");
  if (!main) return;
  main.innerHTML = `
    <div class="container" style="padding:60px 20px;">
      <div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e4edf7;border-radius:16px;padding:40px;text-align:center;">
        <div style="font-size:48px;margin-bottom:16px;">🔍</div>
        <h1 style="font-size:22px;font-weight:800;color:#071524;margin-bottom:10px;">Anzeige nicht verfügbar</h1>
        <p style="color:#64788e;margin-bottom:24px;">${esc(message)}</p>
        <a href="suche.html" style="display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#1252a3,#1868c0);color:#fff;padding:12px 22px;border-radius:10px;font-weight:700;font-size:14px;box-shadow:0 4px 14px rgba(18,82,163,.3);">
          ← Zurück zur Suche
        </a>
      </div>
    </div>
  `;
}

/* ─────────────────────────────────────────────────────────
   HILFSFUNKTIONEN
───────────────────────────────────────────────────────── */
function set(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function esc(value) {
  return String(value)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

function initials(text) {
  return String(text).split(" ").filter(Boolean).slice(0,2)
    .map(w => w[0]).join("").toUpperCase();
}

function setMeta(sel, attr, val) {
  let el = document.querySelector(sel);
  if (!el) { el = document.createElement("meta"); document.head.appendChild(el); }
  el.setAttribute(attr, val);
}

function setOrCreateLink(rel, href) {
  let el = document.querySelector(`link[rel='${rel}']`);
  if (!el) { el = document.createElement("link"); el.rel = rel; document.head.appendChild(el); }
  el.href = href;
}

// ── Versandoptionen anzeigen ──────────────────────────────────────────────────
function renderShipping(listing) {
  const panel   = document.getElementById('shipping-panel');
  const optList = document.getElementById('shipping-options-list');
  const wantShip = document.getElementById('cf-want-shipping');

  const options = listing.shipping_options;
  if (!panel || !optList) return;
  if (!Array.isArray(options) || !options.length) return;

  panel.style.display = 'block';

  const carrierInfo = {
    'DHL':       { emoji: '🟡', note: 'Paket · 1–2 Werktage',  link: 'https://www.dhl.de/de/privatkunden/pakete-versenden/paket-national.html' },
    'DPD':       { emoji: '🔴', note: 'Paket · 1–2 Werktage',  link: 'https://www.dpd.com/de/de/versenden/privatkunden/' },
    'Hermes':    { emoji: '🟢', note: 'Paket · 2–4 Werktage',  link: 'https://www.myhermes.de/versenden.html' },
    'UPS':       { emoji: '🟤', note: 'Paket · 1–3 Werktage',  link: 'https://www.ups.com/de/de/shipping/create.page' },
    'Spedition': { emoji: '🚛', note: 'Spedition · auf Anfrage', link: null },
    'Abholung':  { emoji: '🏠', note: 'Selbst abholen',         link: null },
  };

  optList.innerHTML = options.map(opt => {
    const info    = carrierInfo[opt.carrier] || { emoji: '📦', note: 'Versand', link: null };
    const isFree  = opt.price === 0;
    const price   = opt.price == null
      ? '<span class="ship-price">auf Anfrage</span>'
      : isFree
        ? '<span class="ship-price free">Kostenlos</span>'
        : `<span class="ship-price">+ ${Number(opt.price).toFixed(2).replace('.', ',')} €</span>`;
    const linkHtml = info.link
      ? `<a href="${info.link}" target="_blank" rel="noopener"
           style="font-size:11px;color:var(--blue2);font-weight:600;">Label →</a>`
      : '';

    return `
      <div class="ship-opt">
        <div class="ship-opt-left">
          <div class="ship-logo">${info.emoji}</div>
          <div>
            <div class="ship-name">${escapeHtml(opt.carrier)}</div>
            <div class="ship-note">${info.note}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          ${price}
          ${linkHtml}
        </div>
      </div>`;
  }).join('');

  // Zeige Versand-Checkbox im Kontaktformular wenn Versand möglich
  const hasShipping = options.some(o => o.carrier !== 'Abholung');
  if (wantShip && hasShipping) wantShip.style.display = 'block';
}

// ── Adressformular togglen ────────────────────────────────────────────────────
window.toggleAddressForm = function(show) {
  const wrap = document.getElementById('cf-address-wrap');
  if (wrap) wrap.classList.toggle('show', show);
};


function getCategoryIcon(category) {
  const map = {
    "Automotor":"🚗","Dieselmotor Auto":"🚗","Benzinmotor Auto":"🚗",
    "Hybridmotor":"⚡","Elektromotor Auto":"⚡","Motorradmotor":"🏍️",
    "Roller Motor":"🛵","LKW Motor":"🚛","Busmotor":"🚌",
    "Traktormotor":"🚜","Landmaschinenmotor":"🚜","Baumaschinenmotor":"🚧",
    "Baggermotor":"🚧","Gabelstapler Motor":"🏗️","Bootsmotor":"🚤",
    "Außenbordmotor":"🚤","Innenbordmotor":"🚤","Schiffsdieselmotor":"🛳️",
    "Jetski Motor":"🌊","Flugzeugmotor":"✈️","Turbinenmotor":"✈️",
    "Elektromotor Industrie":"⚙️","Drehstrommotor":"⚙️","Servomotor":"🤖",
    "Getriebemotor":"🔩","Generator Motor":"🔋","Pumpenmotor":"💧",
    "Kompressormotor":"🌀","Lüftermotor":"🌬️","Kranmotor":"🏗️",
    "Aufzugmotor":"🏢","Achterbahnmotor":"🎢","Arcade Motor":"🕹️",
    "Drohnenmotor":"🚁","E-Bike Motor":"🚲","Rasenmähermotor":"🌱",
    "Aufsitzmäher Motor":"🌱","Hochleistungsmotor":"🔥","CNC Motor":"🧰",
    "Robotermotor":"🤖","Austauschmotor":"🔄","Sonstiges":"📦"
  };
  return map[category] || "📦";
}
