/* dashboard-live.js – Stand 21.10.2026
   Änderung: Kein "Kein Händlerprofil gefunden" mehr. Fehlt das Profil,
   wird es automatisch angelegt – privat und gewerblich gleich behandelt. */

// ── Anbieterprofil sicherstellen ─────────────────────────────────────────────
// Jeder eingeloggte Nutzer darf inserieren – privat oder gewerblich.
// Fehlt das Profil, wird es hier still angelegt (kein Händlerkonto nötig).
// Gewerblich = company_type gesetzt (wie in suche.html), sonst Privatanbieter.
window.ensureSellerProfile = window.ensureSellerProfile || async function (user) {
  if (!user || !user.id) return { data: null, error: new Error("Nicht eingeloggt") };

  const COLS = "id, company_name, company_type";
  const load = () => supabaseClient
    .from("seller_profiles").select(COLS).eq("user_id", user.id).maybeSingle();

  let res = await load();
  // Falls es die Spalte company_type nicht gibt: ohne sie erneut laden
  if (res.error && /company_type/.test(res.error.message || "")) {
    res = await supabaseClient.from("seller_profiles")
      .select("id, company_name").eq("user_id", user.id).maybeSingle();
  }
  if (res.error) return { data: null, error: res.error };
  if (res.data) return res;

  const meta  = user.user_metadata || {};
  const email = user.email || "";
  const name  = (meta.company && String(meta.company).trim())
             || (meta.full_name && String(meta.full_name).trim())
             || [meta.first_name, meta.last_name].filter(Boolean).join(" ").trim()
             || email.split("@")[0]
             || "Privatanbieter";

  const ins = await supabaseClient
    .from("seller_profiles")
    .insert([{ user_id: user.id, email: email, company_name: name, city: "", country: "DE" }])
    .select("id, company_name")
    .single();

  // Doppelt angelegt (z. B. zwei Tabs gleichzeitig)? Dann einfach das vorhandene nehmen.
  if (ins.error && (ins.error.code === "23505" || /duplicate/i.test(ins.error.message || ""))) {
    return await load();
  }
  return ins;
};

document.addEventListener("DOMContentLoaded", async () => {

  // ── DOM Referenzen ────────────────────────────────────────────────────────
  const tableBody       = document.getElementById("dashboard-listings-body");
  const recentInquiries = document.getElementById("recent-inquiries");
  const sidebarAvatar   = document.getElementById("sidebar-avatar");
  const sidebarName     = document.querySelector(".user-box-name");
  const sidebarEmail    = document.querySelector(".user-box-email");
  const logoutBtn       = document.getElementById("sidebar-logout");

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const user = sessionData?.session?.user;

  if (!user) {
    setTableMessage("Du bist nicht eingeloggt. Bitte zuerst anmelden.");
    setActivityMessage("Nicht eingeloggt.");
    return;
  }

  // Logout (auch ohne Profil verfügbar)
  logoutBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    await supabaseClient.auth.signOut();
    window.location.href = "index.html";
  });

  // ── Anbieterprofil (wird bei Bedarf automatisch angelegt) ─────────────────
  const { data: seller, error: sellerError } = await window.ensureSellerProfile(user);

  const displayName = (seller && seller.company_name) || user.email || "Mein Konto";
  const initials = displayName.split(" ").filter(Boolean)
    .slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";

  if (sidebarAvatar) sidebarAvatar.textContent = initials;
  if (sidebarName)   sidebarName.textContent   = displayName;
  if (sidebarEmail)  sidebarEmail.textContent  = user.email || "";
  document.querySelectorAll(".user-role").forEach(el => {
    el.textContent = seller && seller.company_type && String(seller.company_type).trim()
      ? "Gewerblicher Anbieter" : "Privatanbieter";
  });

  if (sellerError || !seller) {
    console.error("PROFILE ERROR:", sellerError);
    setStatCard("stat-active",    0, "0 Anzeigen gesamt");
    setStatCard("stat-inquiries", 0, "0 neue seit heute");
    setStatCard("stat-value",     "0 €", "über 0 Inserate");
    setStatCard("stat-drafts",    0, "0 unveröffentlicht");
    setTableMessage("Noch keine Anzeigen vorhanden. Erstelle dein erstes Inserat – kostenlos, privat oder gewerblich!");
    setActivityMessage("Noch keine Anfragen.");
    return;
  }

  // ── Listings laden ────────────────────────────────────────────────────────
  const { data: listings, error: listingsError } = await supabaseClient
    .from("listings")
    .select(`id, title, manufacturer, price, status, created_at, categories(name)`)
    .eq("seller_id", seller.id)
    .order("created_at", { ascending: false });

  if (listingsError) {
    setTableMessage("Fehler beim Laden der Anzeigen.");
    return;
  }

  const listingIds = (listings || []).map(l => l.id);

  // ── Anfragen laden ────────────────────────────────────────────────────────
  let inquiries = [];
  if (listingIds.length) {
    const { data: inqData } = await supabaseClient
      .from("inquiries")
      .select("id, listing_id, name, status, created_at, listings(title)")
      .in("listing_id", listingIds)
      .order("created_at", { ascending: false });
    inquiries = inqData || [];
  }

  // ── Stats berechnen ───────────────────────────────────────────────────────
  const active       = (listings || []).filter(l => l.status === "Freigegeben").length;
  const drafts       = (listings || []).filter(l => l.status === "Entwurf").length;
  const total        = (listings || []).length;
  const totalValue   = (listings || []).reduce((s, l) => s + Number(l.price || 0), 0);
  const openInq      = inquiries.filter(i => i.status === "Neu" || i.status === "Gelesen").length;
  const newInq       = inquiries.filter(i => i.status === "Neu").length;

  setStatCard("stat-active",    active,     `${total} Anzeigen gesamt`);
  setStatCard("stat-inquiries", openInq,    `${newInq} neue seit heute`);
  setStatCard("stat-value",     totalValue.toLocaleString("de-DE", { style:"currency", currency:"EUR", maximumFractionDigits:0 }), `über ${total} Inserate`);
  setStatCard("stat-drafts",    drafts,     drafts === 1 ? "1 unveröffentlicht" : `${drafts} unveröffentlicht`);

  // ── Tabelle rendern ───────────────────────────────────────────────────────
  if (!listings || listings.length === 0) {
    setTableMessage("Noch keine Anzeigen vorhanden. Erstelle dein erstes Inserat!");
    setActivityMessage("Noch keine Anfragen.");
    return;
  }

  const inquiryCountMap = {};
  inquiries.forEach(inq => {
    inquiryCountMap[inq.listing_id] = (inquiryCountMap[inq.listing_id] || 0) + 1;
  });

  tableBody.innerHTML = listings.map(listing => {
    const category     = listing.categories?.name || "–";
    const price        = Number(listing.price || 0).toLocaleString("de-DE", { style:"currency", currency:"EUR" });
    const date         = new Date(listing.created_at).toLocaleDateString("de-DE");
    const badgeClass   = getBadgeClass(listing.status);
    const inquiryCount = inquiryCountMap[listing.id] || 0;

    return `
      <tr>
        <td style="max-width:220px;">
          <div style="font-weight:700;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${escapeHtml(listing.title || "Ohne Titel")}
          </div>
          <div style="font-size:12px;color:#6b7280;margin-top:2px;">${escapeHtml(listing.manufacturer || "–")}</div>
        </td>
        <td style="font-size:13px;">${escapeHtml(category)}</td>
        <td style="font-weight:700;color:#1a3a52;">${price}</td>
        <td><span class="badge ${badgeClass}">${escapeHtml(listing.status || "–")}</span></td>
        <td>
          <span style="font-weight:700;color:${inquiryCount > 0 ? '#059669' : '#6b7280'};">
            ${inquiryCount}
          </span>
        </td>
        <td style="font-size:13px;color:#6b7280;">${date}</td>
        <td>
          <div class="action-links">
            <a href="anzeige-erstellen.html?edit=${listing.id}">Bearbeiten</a>
            <a href="listing-detail.html?id=${listing.id}">Ansehen</a>
            <a href="#" class="delete-dashboard-btn" data-id="${listing.id}">Löschen</a>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  // ── Letzte Anfragen rendern ───────────────────────────────────────────────
  if (!inquiries.length) {
    if (recentInquiries) {
      recentInquiries.innerHTML = `
        <div class="activity-item">
          <div class="activity-dot"></div>
          <div class="activity-text">
            <strong>Noch keine Anfragen</strong>
            <span>Sobald Käufer dir schreiben, erscheinen sie hier.</span>
          </div>
        </div>
      `;
    }
  } else {
    const recent = inquiries.slice(0, 6);
    if (recentInquiries) {
      recentInquiries.innerHTML = recent.map(inq => {
        const listingTitle = Array.isArray(inq.listings)
          ? inq.listings[0]?.title || "Anzeige"
          : inq.listings?.title || "Anzeige";
        const date = formatRelativeDate(inq.created_at);
        const dotClass = inq.status === "Neu" ? "new" : inq.status === "Erledigt" ? "" : "warn";

        return `
          <div class="activity-item">
            <div class="activity-dot ${dotClass}"></div>
            <div class="activity-text">
              <strong>${escapeHtml(inq.name || "Unbekannt")} · ${escapeHtml(inq.status || "Neu")}</strong>
              <span>Anfrage zu „${escapeHtml(listingTitle)}" · ${date}</span>
            </div>
          </div>
        `;
      }).join("");
    }
  }

  // ── Löschen ───────────────────────────────────────────────────────────────
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".delete-dashboard-btn");
    if (!btn) return;
    e.preventDefault();

    const listingId = btn.getAttribute("data-id");
    if (!listingId) return;

    if (!confirm("Anzeige wirklich löschen? Alle Anfragen dazu werden ebenfalls gelöscht.")) return;

    btn.textContent = "...";

    const { error: delInqErr } = await supabaseClient
      .from("inquiries").delete().eq("listing_id", listingId);

    if (delInqErr) { alert("Anfragen konnten nicht gelöscht werden."); btn.textContent = "Löschen"; return; }

    const { error: delErr } = await supabaseClient
      .from("listings").delete().eq("id", listingId).eq("seller_id", seller.id);

    if (delErr) { alert("Anzeige konnte nicht gelöscht werden."); btn.textContent = "Löschen"; return; }

    window.location.reload();
  });
});

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────

function setStatCard(id, value, note) {
  const valEl  = document.getElementById(id);
  const noteEl = document.getElementById(id + "-note");
  if (valEl)  valEl.textContent  = value;
  if (noteEl) noteEl.textContent = note;
}

function setTableMessage(msg) {
  const tableBody = document.getElementById("dashboard-listings-body");
  if (tableBody) {
    tableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="7">
          <span class="empty-icon">📋</span>
          ${escapeHtml(msg)}
        </td>
      </tr>
    `;
  }
}

function setActivityMessage(msg) {
  const el = document.getElementById("recent-inquiries");
  if (el) el.innerHTML = `<div class="activity-item"><div class="activity-dot"></div><div class="activity-text"><strong>${escapeHtml(msg)}</strong></div></div>`;
}

function getBadgeClass(status) {
  if (status === "Freigegeben") return "approved";
  if (status === "Entwurf")     return "draft";
  return "pending";
}

function formatRelativeDate(dateStr) {
  if (!dateStr) return "–";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)   return "gerade eben";
  if (mins < 60)  return `vor ${mins} Min.`;
  if (hours < 24) return `vor ${hours} Std.`;
  if (days === 1) return "gestern";
  if (days < 7)   return `vor ${days} Tagen`;
  return new Date(dateStr).toLocaleDateString("de-DE");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
