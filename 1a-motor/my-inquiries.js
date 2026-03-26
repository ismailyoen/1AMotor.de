// ── 1A Motor – Käufer Anfragen mit Echtzeit-Chat ─────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("my-inquiries");
  if (!container) return;

  container.innerHTML = `<div style="padding:32px;text-align:center;color:#6b7280;">Anfragen werden geladen…</div>`;

  // Auth
  let user = null;
  try {
    const { data } = await supabaseClient.auth.getSession();
    user = data?.session?.user;
    if (!user) {
      const { data: u } = await supabaseClient.auth.getUser();
      user = u?.user || null;
    }
  } catch(e) {}

  if (!user) {
    container.innerHTML = emptyBox("Nicht eingeloggt", "Bitte logge dich ein um deine Anfragen zu sehen.");
    return;
  }

  // Anfragen laden
  const { data: inquiries, error } = await supabaseClient
    .from("inquiries")
    .select(`id, listing_id, name, email, message, status, created_at, listings(id, title)`)
    .eq("buyer_user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    container.innerHTML = emptyBox("Fehler beim Laden", error.message);
    return;
  }

  if (!inquiries?.length) {
    container.innerHTML = emptyBox("Noch keine Anfragen", "Du hast noch keine Anfragen gestellt. Schau dir Anzeigen an und kontaktiere Händler.");
    return;
  }

  container.innerHTML = inquiries.map(inq => renderBuyerCard(inq)).join("");

  // Nachrichten + Realtime
  for (const inq of inquiries) {
    const msgs = await loadMessages(inq.id);
    renderMessages(inq.id, inq, msgs);
    subscribeToMessages(inq.id, inq, user);
  }

  // Events
  container.addEventListener("click", async (e) => {
    const sendBtn = e.target.closest(".send-btn");
    if (sendBtn) await sendMessage(sendBtn.dataset.id, user);
  });

  container.addEventListener("keydown", async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      const ta = e.target.closest(".reply-input");
      if (ta) { e.preventDefault(); await sendMessage(ta.dataset.id, user); }
    }
  });
});

function renderBuyerCard(inq) {
  const listing = Array.isArray(inq.listings) ? inq.listings[0] : inq.listings;
  const title   = listing?.title || "Anzeige";
  const statusColor = inq.status === "Erledigt" ? "#059669" : inq.status === "Gelesen" ? "#6b7280" : "#2563eb";

  return `
  <article style="background:#fff;border:1px solid #dbe3ea;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(18,58,99,0.08);margin-bottom:20px;">
    <div style="padding:14px 18px;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
      <div>
        <div style="font-size:11px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px;">Deine Anfrage zu</div>
        <div style="font-size:15px;font-weight:700;color:#1a3a52;">${esc(title)}</div>
        <div style="font-size:12px;color:#94a3b8;margin-top:2px;">${fmt(inq.created_at)}</div>
      </div>
      <span style="background:${statusColor}18;color:${statusColor};border:1px solid ${statusColor}40;font-size:11px;font-weight:700;padding:4px 12px;border-radius:999px;">${esc(inq.status || "Neu")}</span>
    </div>

    <div style="padding:14px 18px;">
      <div id="chat-${inq.id}" style="display:flex;flex-direction:column;gap:8px;min-height:80px;max-height:320px;overflow-y:auto;scroll-behavior:smooth;padding-bottom:6px;">
        <div style="font-size:13px;color:#94a3b8;text-align:center;">Nachrichten werden geladen…</div>
      </div>

      <div style="display:flex;align-items:center;gap:6px;margin:8px 0;">
        <div id="rt-dot-${inq.id}" style="width:7px;height:7px;border-radius:50%;background:#94a3b8;"></div>
        <span id="rt-label-${inq.id}" style="font-size:11px;color:#94a3b8;">Verbinde…</span>
      </div>

      <div style="display:flex;gap:8px;align-items:flex-end;">
        <textarea class="reply-input" data-id="${inq.id}"
          placeholder="Antworten… (Enter = senden)"
          rows="1"
          style="flex:1;min-height:44px;max-height:100px;padding:10px 13px;border-radius:10px;border:1.5px solid #dbe3ea;outline:none;font-size:13px;resize:none;font-family:inherit;"></textarea>
        <button class="send-btn" data-id="${inq.id}"
          style="background:#1a3a52;color:#fff;border:none;border-radius:10px;padding:10px 16px;font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;flex-shrink:0;">
          Senden ➤
        </button>
      </div>
    </div>
  </article>`;
}

function renderMessages(inquiryId, inq, messages) {
  const box = document.getElementById(`chat-${inquiryId}`);
  if (!box) return;

  const first = `
    <div style="align-self:flex-end;max-width:78%;">
      <div style="font-size:11px;color:#94a3b8;margin-bottom:3px;text-align:right;padding-right:4px;">
        👤 Du · ${fmt(inq.created_at)}
      </div>
      <div style="background:#1a3a52;color:#fff;border-radius:14px 14px 4px 14px;padding:10px 14px;font-size:14px;white-space:pre-wrap;">${esc(inq.message || "")}</div>
    </div>`;

  if (!messages.length) {
    box.innerHTML = first + `<div style="font-size:12px;color:#94a3b8;text-align:center;margin-top:6px;">Noch keine Antwort vom Händler.</div>`;
    return;
  }

  box.innerHTML = first + messages.map(msg => {
    const isBuyer = msg.sender_type === "buyer";
    return `
      <div style="align-self:${isBuyer ? "flex-end" : "flex-start"};max-width:78%;">
        <div style="font-size:11px;color:#94a3b8;margin-bottom:3px;text-align:${isBuyer ? "right" : "left"};padding-${isBuyer ? "right" : "left"}:4px;">
          ${isBuyer ? "👤 Du" : "🏪 Händler"} · ${fmt(msg.created_at)}
        </div>
        <div style="
          background:${isBuyer ? "#1a3a52" : "#f4f7fb"};
          color:${isBuyer ? "#fff" : "#1f2937"};
          border-radius:${isBuyer ? "14px 14px 4px 14px" : "14px 14px 14px 4px"};
          padding:10px 14px;font-size:14px;white-space:pre-wrap;">
          ${esc(msg.message || "")}
        </div>
      </div>`;
  }).join("");

  box.scrollTop = box.scrollHeight;
}

const activeChannels = {};

function subscribeToMessages(inquiryId, inq, user) {
  if (activeChannels[inquiryId]) supabaseClient.removeChannel(activeChannels[inquiryId]);

  const channel = supabaseClient
    .channel(`buyer-chat-${inquiryId}`)
    .on("postgres_changes", {
      event: "INSERT", schema: "public",
      table: "inquiry_messages",
      filter: `inquiry_id=eq.${inquiryId}`
    }, async () => {
      const msgs = await loadMessages(inquiryId);
      renderMessages(inquiryId, inq, msgs);
    })
    .subscribe((status) => {
      const dot   = document.getElementById(`rt-dot-${inquiryId}`);
      const label = document.getElementById(`rt-label-${inquiryId}`);
      if (status === "SUBSCRIBED") {
        if (dot)   dot.style.background = "#10b981";
        if (label) { label.textContent = "Echtzeit aktiv"; label.style.color = "#10b981"; }
      } else if (status === "CHANNEL_ERROR") {
        if (dot)   dot.style.background = "#ef4444";
        if (label) { label.textContent = "Verbindungsfehler"; label.style.color = "#ef4444"; }
      }
    });

  activeChannels[inquiryId] = channel;
}

async function loadMessages(inquiryId) {
  const { data, error } = await supabaseClient
    .from("inquiry_messages").select("*")
    .eq("inquiry_id", inquiryId)
    .order("created_at", { ascending: true });
  if (error) return [];
  return data || [];
}

async function sendMessage(inquiryId, user) {
  const ta  = document.querySelector(`.reply-input[data-id="${inquiryId}"]`);
  const btn = document.querySelector(`.send-btn[data-id="${inquiryId}"]`);
  const msg = ta?.value?.trim() || "";
  if (!msg) return;

  btn.disabled = true; btn.textContent = "…";

  const { error } = await supabaseClient.from("inquiry_messages").insert([{
    inquiry_id: inquiryId, sender_type: "buyer",
    sender_user_id: user.id, message: msg
  }]);

  btn.disabled = false; btn.textContent = "Senden ➤";

  if (error) { alert("Fehler: " + error.message); return; }
  if (ta) ta.value = "";
}

function emptyBox(title, text) {
  return `<div style="background:#fff;border:1px solid #dbe3ea;border-radius:16px;padding:32px;text-align:center;">
    <div style="font-size:36px;margin-bottom:12px;">📭</div>
    <h3 style="color:#1a3a52;margin-bottom:6px;">${title}</h3>
    <p style="color:#6b7280;">${text}</p>
  </div>`;
}

function fmt(v) {
  if (!v) return "–";
  return new Date(v).toLocaleString("de-DE", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" });
}

function esc(v) {
  return String(v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}
