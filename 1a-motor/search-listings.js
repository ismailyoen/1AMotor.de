document.addEventListener("DOMContentLoaded", () => {
  loadSearchListings();
});

async function loadSearchListings() {
  const grid = document.querySelector(".listing-grid");
  const resultsText = document.querySelector(".results-head p");

  if (!grid) return;

  grid.innerHTML = `
    <div style="grid-column:1/-1;background:white;border:1px solid #dbe3ea;border-radius:16px;padding:24px;">
      Lade Anzeigen aus Supabase ...
    </div>
  `;

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
      categories(name)
    `)
    .eq("status", "Freigegeben")
    .order("created_at", { ascending: false });

  console.log("SUPABASE LISTINGS:", data);
  console.log("SUPABASE LISTINGS ERROR:", error);

  if (error) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;background:white;border:1px solid #dbe3ea;border-radius:16px;padding:24px;">
        <h3 style="margin-bottom:10px;color:#123a63;">Fehler beim Laden der Anzeigen</h3>
        <p style="color:#6b7280;">Schau in die Browser-Konsole, um den genauen Fehler zu sehen.</p>
      </div>
    `;
    return;
  }

  if (resultsText) {
    resultsText.textContent = `${data.length} Ergebnisse aus deiner Supabase-Datenbank`;
  }

  if (!data.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;background:white;border:1px solid #dbe3ea;border-radius:16px;padding:24px;">
        <h3 style="margin-bottom:10px;color:#123a63;">Noch keine veröffentlichten Anzeigen vorhanden</h3>
        <p style="margin-bottom:16px;color:#6b7280;">Erstelle zuerst eine Anzeige und speichere sie als Freigegeben.</p>
        <a href="anzeige-erstellen.html" style="display:inline-block;background:#123a63;color:white;padding:12px 18px;border-radius:999px;text-decoration:none;font-weight:700;">Jetzt Anzeige erstellen</a>
      </div>
    `;
    return;
  }

  grid.innerHTML = data.map((listing) => {
    const category = Array.isArray(listing.categories)
      ? listing.categories[0]?.name || "Unbekannt"
      : listing.categories?.name || "Unbekannt";

    const icon = getCategoryIcon(category);
    const createdAt = new Date(listing.created_at).toLocaleDateString("de-DE");

    return `
      <a class="listing-card" href="listing-detail.html?id=${encodeURIComponent(listing.id)}">
        <div class="listing-image">
          <span class="badge">Live</span>
          <span class="fav">♡</span>
          ${icon}
        </div>
        <div class="listing-body">
          <div class="listing-title">${escapeHtml(listing.title || "Ohne Titel")}</div>
          <div class="meta">
            <span>Kategorie: ${escapeHtml(category)}</span>
            <span>Zustand: ${escapeHtml(listing.condition || "-")}</span>
          </div>
          <div class="price">${formatPrice(listing.price)}</div>
          <div class="shipping">Standort: ${escapeHtml(listing.location || "-")}</div>
          <div class="seller">
            <span>${escapeHtml((listing.manufacturer || "") + " " + (listing.model || ""))}</span>
            <span class="rating">${createdAt}</span>
          </div>
        </div>
      </a>
    `;
  }).join("");
}

function formatPrice(price) {
  const value = Number(price || 0);
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR"
  });
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
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}