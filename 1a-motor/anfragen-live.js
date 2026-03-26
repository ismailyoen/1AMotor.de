// ── 1A Motor – Anfragen mit Echtzeit-Chat ────────────────────────────────────
// Supabase Realtime: Neue Nachrichten erscheinen sofort ohne Reload

document.addEventListener("DOMContentLoaded", async () => {
  console.log("anfragen-live.js geladen");

  const inquiryList = document.getElementById("inquiry-list");
  const userBoxHeading = document.querySelector(".user-box h2");
  const userBoxText    = document.querySelector(".user-box p");
  if (!inquiryList) return;

  showLoading(inquiryList);

  // ── Auth ──────────────────────────────────────────────────────────────────
  let user = null;
  try {
    const { data } = await supabaseClient.auth.getSession();
    user = data?.session?.user || null;
    if (!user) {
      const { data: u } = await supabaseClient.auth.getUser();
      user = u?.user || null;
    }
  } catch(e) { console.error(e); }

  if (!user) {
    inquiryList.innerHTML = emptyBox("Nicht eingeloggt", "Bitte logge dich ein um deine Anfragen zu sehen.");
    return;
  }

  // ── Seller Profil ─────────────────────────────────────────────────────────
  const { data: seller, error: sellerErr } = await supabaseClient
    .from("seller_profiles").select("id, company_name")
    .eq("user_id", user.id).maybeSingle();

  if (sellerErr || !seller) {
    inquiryList.innerHTML = emptyBox("Kein Händlerprofil", "Für diesen Account wurde kein Händlerprofil gefunden.");
    return;
  }

  if (userBoxHeading) userBoxHeading.textContent = seller.company_name || "Hallo";
  if (userBoxText)    userBoxText.textContent    = user.email || "";

  // ── Anfragen laden ────────────────────────────────────────────────────────
  await loadAndRender(seller, user, inquiryList);
});

// ── Laden & Rendern ───────────────────────────────────────────────────────────
async function loadAndRender(seller, user, container) {
  const { data: inquiries, error } = await supabaseClient
    .from("inquiries")
    .select(`id, listing_id, name, email, message, status, created_at,
             listings(id, title, seller_id)`)
    .order("created_at", { ascending: false });

  if (error) {
    container.innerHTML = emptyBox("Fehler beim Laden", error.message);
    return;
  }

  // Nur eigene Anfragen
  const mine = (inquiries || []).filter(inq => {
    const l = Array.isArray(inq.listings) ? inq.listings[0] : inq.listings;
    return l?.seller_id === seller.id;
  });

  if (!mine.length) {
    container.innerHTML = emptyBox("Noch keine Anfragen", "Sobald Käufer dir schreiben erscheinen die Anfragen hier.");
    return;
  }

  // HTML rendern
  container.innerHTML = mine.map(inq => renderInquiryCard(inq)).join("");

  // Nachrichten laden + Realtime starten
  for (const inq of mine) {
    const msgs = await loadMessages(inq.id);
    renderMessages(inq.id, inq, msgs);
    subscribeToMessages(inq.id, inq, user);
  }

  // Event Delegation für Buttons
  container.addEventListener("click", async (e) => {
    // Status Button
    const statusBtn = e.target.closest(".status-btn");
    if (statusBtn) {
      await updateStatus(statusBtn.dataset.id, statusBtn.dataset.status);
      return;
    }
    // Senden Button
    const sendBtn = e.target.closest(".send-btn");
    if (sendBtn) {
      await sendMessage(sendBtn.dataset.id, user);
    }
  });

  // Enter-Taste zum Senden (Shift+Enter = neue Zeile)
  container.addEventListener("keydown", async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      const ta = e.target.closest(".reply-input");
      if (ta) {
        e.preventDefault();
        await sendMessage(ta.dataset.id, user);
      }
    }
  });
}

// ── Inquiry Card HTML ─────────────────────────────────────────────────────────
function renderInquiryCard(inq) {
  const listing = Array.isArray(inq.listings) ? inq.listings[0] : inq.listings;
  const title   = listing?.title || "Anzeige";
  const date    = fmt(inq.created_at);
  const statusColor = inq.status === "Neu" ? "#2563eb" : inq.status === "Erledigt" ? "#059669" : "#6b7280";

  return `
  <article style="background:#fff;border:1px solid #dbe3ea;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(18,58,99,0.08);margin-bottom:20px;">

    <!-- Kopf -->
    <div style="padding:16px 20px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
      <div>
        <div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;">Anfrage zu</div>
        <div style="font-size:16px;font-weight:700;color:#1a3a52;">${esc(title)}</div>
        <div style="font-size:12px;color:#94a3b8;margin-top:3px;">${esc(inq.name || "–")} · ${esc(inq.email || "–")} · ${date}</div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="background:${statusColor}18;color:${statusColor};border:1px solid ${statusColor}40;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;">${esc(inq.status || "Neu")}</span>
        <div style="display:flex;gap:6px;">
          <button class="status-btn" data-id="${inq.id}" data-status="Neu"
            style="padding:6px 12px;border-radius:999px;border:1px solid #dbe3ea;background:#fff;color:#1a3a52;font-size:12px;font-weight:700;cursor:pointer;">Neu</button>
          <button class="status-btn" data-id="${inq.id}" data-status="Gelesen"
            style="padding:6px 12px;border-radius:999px;border:1px solid #dbe3ea;background:#fff;color:#1a3a52;font-size:12px;font-weight:700;cursor:pointer;">Gelesen</button>
          <button class="status-btn" data-id="${inq.id}" data-status="Erledigt"
            style="padding:6px 12px;border-radius:999px;border:1px solid #059669;background:#ecfdf5;color:#059669;font-size:12px;font-weight:700;cursor:pointer;">Erledigt</button>
        </div>
      </div>
    </div>

    <!-- Chat Bereich -->
    <div style="padding:16px 20px;">

      <!-- Nachrichten -->
      <div id="chat-${inq.id}"
        style="display:flex;flex-direction:column;gap:8px;min-height:80px;max-height:360px;overflow-y:auto;padding:4px 0 8px;scroll-behavior:smooth;">
        <div style="font-size:13px;color:#94a3b8;text-align:center;">Nachrichten werden geladen…</div>
      </div>

      <!-- Realtime Indikator -->
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;margin-top:4px;">
        <div id="rt-dot-${inq.id}" style="width:7px;height:7px;border-radius:50%;background:#94a3b8;"></div>
        <span id="rt-label-${inq.id}" style="font-size:11px;color:#94a3b8;">Verbinde…</span>
      </div>

      <!-- Eingabe -->
      <div style="display:flex;gap:8px;align-items:flex-end;">
        <textarea
          class="reply-input"
          data-id="${inq.id}"
          placeholder="Nachricht schreiben… (Enter = senden, Shift+Enter = neue Zeile)"
          style="flex:1;min-height:48px;max-height:120px;padding:11px 14px;border-radius:10px;border:1.5px solid #dbe3ea;outline:none;font-size:14px;resize:none;font-family:inherit;transition:border-color .2s;"
          rows="1"
        ></textarea>
        <button class="send-btn" data-id="${inq.id}"
          style="background:#1a3a52;color:#fff;border:none;border-radius:10px;padding:11px 18px;font-size:14px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:background .15s;">
          Senden ➤
        </button>
      </div>
    </div>

  </article>`;
}

// ── Nachrichten rendern ───────────────────────────────────────────────────────
function renderMessages(inquiryId, inq, messages) {
  const box = document.getElementById(`chat-${inquiryId}`);
  if (!box) return;

  // Erste Käufer-Nachricht (aus inquiry.message)
  const first = `
    <div style="align-self:flex-start;max-width:78%;">
      <div style="font-size:11px;color:#94a3b8;margin-bottom:3px;padding-left:4px;">
        👤 ${esc(inq.name || "Käufer")} · ${fmt(inq.created_at)}
      </div>
      <div style="background:#f4f7fb;border:1px solid #e2e8f0;border-radius:14px 14px 14px 4px;padding:10px 14px;font-size:14px;color:#1f2937;white-space:pre-wrap;">${esc(inq.message || "")}</div>
    </div>`;

  if (!messages.length) {
    box.innerHTML = first + `<div style="font-size:12px;color:#94a3b8;text-align:center;margin-top:6px;">Noch keine Antwort.</div>`;
    return;
  }

  box.innerHTML = first + messages.map(msg => {
    const isSeller = msg.sender_type === "seller";
    return `
      <div style="align-self:${isSeller ? "flex-end" : "flex-start"};max-width:78%;">
        <div style="font-size:11px;color:#94a3b8;margin-bottom:3px;padding-${isSeller ? "right" : "left"}:4px;text-align:${isSeller ? "right" : "left"};">
          ${isSeller ? "🏪 Du" : "👤 Käufer"} · ${fmt(msg.created_at)}
        </div>
        <div style="
          background:${isSeller ? "#1a3a52" : "#f4f7fb"};
          color:${isSeller ? "#fff" : "#1f2937"};
          border:1px solid ${isSeller ? "#1a3a52" : "#e2e8f0"};
          border-radius:${isSeller ? "14px 14px 4px 14px" : "14px 14px 14px 4px"};
          padding:10px 14px;font-size:14px;white-space:pre-wrap;">
          ${esc(msg.message || "")}
        </div>
      </div>`;
  }).join("");

  // Scroll nach unten
  box.scrollTop = box.scrollHeight;
}

// ── Supabase Realtime ─────────────────────────────────────────────────────────
const activeChannels = {};

function subscribeToMessages(inquiryId, inq, user) {
  // Alten Channel aufräumen
  if (activeChannels[inquiryId]) {
    supabaseClient.removeChannel(activeChannels[inquiryId]);
  }

  const channel = supabaseClient
    .channel(`chat-${inquiryId}`)
    .on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "inquiry_messages",
      filter: `inquiry_id=eq.${inquiryId}`
    }, async (payload) => {
      console.log("📨 Neue Nachricht empfangen:", payload.new);
      // Alle Nachrichten neu laden und rendern
      const msgs = await loadMessages(inquiryId);
      renderMessages(inquiryId, inq, msgs);
    })
    .subscribe((status) => {
      const dot   = document.getElementById(`rt-dot-${inquiryId}`);
      const label = document.getElementById(`rt-label-${inquiryId}`);
      if (status === "SUBSCRIBED") {
        if (dot)   { dot.style.background = "#10b981"; }
        if (label) { label.textContent = "Echtzeit aktiv"; label.style.color = "#10b981"; }
      } else if (status === "CHANNEL_ERROR") {
        if (dot)   { dot.style.background = "#ef4444"; }
        if (label) { label.textContent = "Verbindungsfehler"; label.style.color = "#ef4444"; }
      } else {
        if (dot)   { dot.style.background = "#f59e0b"; }
        if (label) { label.textContent = "Verbinde…"; label.style.color = "#f59e0b"; }
      }
    });

  activeChannels[inquiryId] = channel;
}

// ── Nachricht laden ───────────────────────────────────────────────────────────
async function loadMessages(inquiryId) {
  const { data, error } = await supabaseClient
    .from("inquiry_messages")
    .select("*")
    .eq("inquiry_id", inquiryId)
    .order("created_at", { ascending: true });

  if (error) { console.error("LOAD MSGS ERROR:", error); return []; }
  return data || [];
}

// ── Nachricht senden ──────────────────────────────────────────────────────────
async function sendMessage(inquiryId, user) {
  const ta  = document.querySelector(`.reply-input[data-id="${inquiryId}"]`);
  const btn = document.querySelector(`.send-btn[data-id="${inquiryId}"]`);
  const msg = ta?.value?.trim() || "";

  if (!msg) return;

  btn.disabled    = true;
  btn.textContent = "…";

  const { error } = await supabaseClient
    .from("inquiry_messages")
    .insert([{
      inquiry_id:     inquiryId,
      sender_type:    "seller",
      sender_user_id: user.id,
      message:        msg
    }]);

  btn.disabled    = false;
  btn.textContent = "Senden ➤";

  if (error) {
    console.error("SEND ERROR:", error);
    alert("Nachricht konnte nicht gesendet werden: " + error.message);
    return;
  }

  if (ta) ta.value = "";
  // Realtime übernimmt die Anzeige — kein manuelles Reload nötig
}

// ── Status updaten ────────────────────────────────────────────────────────────
async function updateStatus(inquiryId, status) {
  const { error } = await supabaseClient
    .from("inquiries").update({ status }).eq("id", inquiryId);

  if (error) { alert("Status konnte nicht geändert werden."); return; }

  // Nur den Badge updaten, kein full reload
  const cards = document.querySelectorAll(`[data-id="${inquiryId}"]`);
  cards.forEach(c => {
    const badge = c.closest("article")?.querySelector('[style*="border-radius:999px"]');
    if (badge) {
      const color = status === "Neu" ? "#2563eb" : status === "Erledigt" ? "#059669" : "#6b7280";
      badge.textContent = status;
      badge.style.background = color + "18";
      badge.style.color = color;
      badge.style.border = `1px solid ${color}40`;
    }
  });
}

// ── Hilfsfunktionen ───────────────────────────────────────────────────────────
function showLoading(el) {
  el.innerHTML = `<div style="padding:32px;text-align:center;color:#6b7280;">Anfragen werden geladen…</div>`;
}

function emptyBox(title, text) {
  return `<div style="background:#fff;border:1px solid #dbe3ea;border-radius:16px;padding:32px;text-align:center;">
    <div style="font-size:36px;margin-bottom:12px;">📭</div>
    <h3 style="color:#1a3a52;margin-bottom:6px;">${esc(title)}</h3>
    <p style="color:#6b7280;">${esc(text)}</p>
  </div>`;
}

function fmt(v) {
  if (!v) return "–";
  return new Date(v).toLocaleString("de-DE", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
}

function esc(v) {
  return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}
