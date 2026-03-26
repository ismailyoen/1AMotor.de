document.addEventListener("DOMContentLoaded", () => {
  setupListingForm();
  renderMyListings();
  renderDashboardStats();
});

function getListings() {
  const raw = localStorage.getItem("1a_motor_listings");
  return raw ? JSON.parse(raw) : [];
}

function saveListings(listings) {
  localStorage.setItem("1a_motor_listings", JSON.stringify(listings));
}

function createId() {
  return "listing_" + Date.now();
}

function setupListingForm() {
  const form = document.querySelector("form");
  const pageTitle = document.title.toLowerCase();

  if (!form || !pageTitle.includes("anzeige erstellen")) return;

  const draftButton = document.querySelector(".btn-secondary");
  const publishButton = document.querySelector(".btn-primary");

  if (draftButton) {
    draftButton.addEventListener("click", () => handleSaveListing("Entwurf"));
  }

  if (publishButton) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      handleSaveListing("Freigegeben");
    });
  }
}

function handleSaveListing(status) {
  const title = document.getElementById("titel")?.value || "Ohne Titel";
  const category = document.getElementById("kategorie")?.value || "Unbekannt";
  const manufacturer = document.getElementById("hersteller")?.value || "-";
  const model = document.getElementById("modell")?.value || "-";
  const condition = document.getElementById("zustand")?.value || "Gebraucht";
  const price = document.getElementById("preis")?.value || "0";
  const year = document.getElementById("baujahr")?.value || "-";
  const location = document.getElementById("standort")?.value || "-";
  const description = document.getElementById("beschreibung")?.value || "";

  const listing = {
    id: createId(),
    title,
    category,
    manufacturer,
    model,
    condition,
    price,
    year,
    location,
    description,
    status,
    views: 0,
    inquiries: 0,
    watchlist: 0,
    createdAt: new Date().toLocaleDateString("de-DE")
  };

  const listings = getListings();
  listings.unshift(listing);
  saveListings(listings);

  alert(`Anzeige wurde als ${status} gespeichert.`);

  window.location.href = "meine-anzeigen.html";
}

function renderMyListings() {
  const pageTitle = document.title.toLowerCase();
  if (!pageTitle.includes("meine anzeigen")) return;

  const container = document.querySelector(".listing-grid");
  if (!container) return;

  const listings = getListings();

  if (listings.length === 0) {
    container.innerHTML = `
      <div style="background:white;border:1px solid #dbe3ea;border-radius:16px;padding:30px;grid-column:1/-1;">
        <h3 style="margin-bottom:10px;color:#123a63;">Noch keine Anzeigen vorhanden</h3>
        <p style="margin-bottom:16px;color:#6b7280;">Erstelle deine erste Anzeige, damit sie hier erscheint.</p>
        <a href="anzeige-erstellen.html" style="display:inline-block;background:#123a63;color:white;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:bold;">Jetzt Anzeige erstellen</a>
      </div>
    `;
    return;
  }

  container.innerHTML = listings.map((listing) => {
    const badgeClass = getBadgeClass(listing.status);
    const icon = getCategoryIcon(listing.category);

    return `
      <article class="listing-card">
        <div class="card-image">
          <span class="badge ${badgeClass}">${listing.status}</span>
          ${icon}
        </div>
        <div class="card-body">
          <div class="card-title">${escapeHtml(listing.title)}</div>
          <div class="card-meta">
            <span>${escapeHtml(listing.category)}</span>
            <span>${escapeHtml(listing.manufacturer)}</span>
            <span>${escapeHtml(listing.createdAt)}</span>
          </div>
          <div class="price">${escapeHtml(listing.price)},00 €</div>
          <div class="metrics">
            <div class="metric"><strong>${listing.views}</strong><span>Aufrufe</span></div>
            <div class="metric"><strong>${listing.inquiries}</strong><span>Anfragen</span></div>
            <div class="metric"><strong>${listing.watchlist}</strong><span>Merkliste</span></div>
          </div>
          <div class="card-actions">
            <a href="listing-detail.html" class="action-btn primary">Ansehen</a>
            <a href="anzeige-erstellen.html" class="action-btn">Bearbeiten</a>
            <button class="action-btn" onclick="deleteListing('${listing.id}')">Löschen</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderDashboardStats() {
  const pageTitle = document.title.toLowerCase();
  if (!pageTitle.includes("dashboard")) return;

  const listings = getListings();
  const active = listings.filter(l => l.status === "Freigegeben").length;
  const drafts = listings.filter(l => l.status === "Entwurf").length;
  const inquiries = listings.reduce((sum, item) => sum + Number(item.inquiries || 0), 0);
  const views = listings.reduce((sum, item) => sum + Number(item.views || 0), 0);

  const values = document.querySelectorAll(".stat-value");
  const notes = document.querySelectorAll(".stat-note");

  if (values.length >= 4) {
    values[0].textContent = active;
    values[1].textContent = inquiries;
    values[2].textContent = views;
    values[3].textContent = drafts;
  }

  if (notes.length >= 4) {
    notes[0].textContent = `${active} aktive Anzeigen gespeichert`;
    notes[1].textContent = `Anfragen aktuell lokal verwaltet`;
    notes[2].textContent = `Gesamtaufrufe deiner lokalen Demo-Daten`;
    notes[3].textContent = `${drafts} Entwürfe vorhanden`;
  }
}

function deleteListing(id) {
  const listings = getListings().filter((item) => item.id !== id);
  saveListings(listings);
  location.reload();
}

function getBadgeClass(status) {
  if (status === "Freigegeben") return "approved";
  if (status === "Entwurf") return "draft";
  return "pending";
}

function getCategoryIcon(category) {
  const map = {
    "PKW / VAuto": "🚗",
    "Transporter": "🚚",
    "LKW & Bus / Nutzfahrzeuge": "🚛",
    "Traktor / Landwirtschaft": "🚜",
    "Kran / Hebetechnik": "🏗️",
    "Baustelle / Bagger / Radlader": "🚧",
    "Karussell / Freizeit / Anlagen": "🎡",
    "Motoren": "⚙️",
    "Getriebe": "🔩",
    "Ersatzteile": "🛠️"
  };

  return map[category] || "📦";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

window.deleteListing = deleteListing;
