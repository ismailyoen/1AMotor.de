document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("my-inquiries");
  if (!container) return;

  container.innerHTML = `
    <div style="background:white;border:1px solid #dbe3ea;border-radius:16px;padding:20px;">
      Anfragen werden geladen...
    </div>
  `;

  try {
    const sessionResult = await supabaseClient.auth.getSession();
    const user = sessionResult?.data?.session?.user;

    if (!user) {
      container.innerHTML = `
        <div style="background:white;border:1px solid #dbe3ea;border-radius:16px;padding:20px;">
          <h3 style="margin-bottom:10px;color:#123a63;">Nicht eingeloggt</h3>
          <p style="color:#6b7280;">Bitte logge dich ein, um deine Anfragen zu sehen.</p>
        </div>
      `;
      return;
    }

    console.log("BUYER USER:", user);

    const { data: inquiries, error } = await supabaseClient
      .from("inquiries")
      .select(`
        id,
        listing_id,
        buyer_user_id,
        name,
        email,
        message,
        status,
        created_at,
        listings (
          id,
          title
        )
      `)
      .eq("buyer_user_id", user.id)
      .order("created_at", { ascending: false });

    console.log("MY INQUIRIES:", inquiries);
    console.log("MY INQUIRIES ERROR:", error);

    if (error) {
      container.innerHTML = `
        <div style="background:white;border:1px solid #dbe3ea;border-radius:16px;padding:20px;">
          <h3 style="margin-bottom:10px;color:#123a63;">Fehler beim Laden</h3>
          <p style="color:#6b7280;">Die Anfragen konnten nicht geladen werden.</p>
        </div>
      `;
      return;
    }

    if (!inquiries || !inquiries.length) {
      container.innerHTML = `
        <div style="background:white;border:1px solid #dbe3ea;border-radius:16px;padding:20px;">
          <h3 style="margin-bottom:10px;color:#123a63;">Noch keine Anfragen vorhanden</h3>
          <p style="color:#6b7280;">Sobald du eine Anfrage sendest, erscheint sie hier.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = inquiries.map((inquiry) => {
      const listingRelation = Array.isArray(inquiry.listings)
        ? inquiry.listings[0]
        : inquiry.listings;

      const listingTitle = listingRelation?.title || "Anzeige";
      const formattedDate = new Date(inquiry.created_at).toLocaleString("de-DE");

      return `
        <article style="background:white;border:1px solid #dbe3ea;border-radius:16px;padding:20px;margin-bottom:18px;box-shadow:0 10px 30px rgba(18,58,99,0.08);">
          <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:12px;">
            <div>
              <h3 style="font-size:20px;color:#123a63;margin-bottom:6px;">Anfrage zu: ${escapeHtml(listingTitle)}</h3>
              <div style="display:flex;flex-wrap:wrap;gap:14px;color:#475569;font-size:14px;">
                <span><strong>Datum:</strong> ${formattedDate}</span>
                <span><strong>Status:</strong> ${escapeHtml(inquiry.status || "Neu")}</span>
              </div>
            </div>
          </div>

          <div style="background:#f4f7fb;border:1px solid #dbe3ea;border-radius:14px;padding:12px 14px;margin-bottom:14px;">
            <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">Deine ursprüngliche Nachricht</div>
            <div style="white-space:pre-wrap;color:#1f2937;font-size:14px;">${escapeHtml(inquiry.message || "")}</div>
          </div>

          <div id="buyer-chat-${inquiry.id}" style="display:flex;flex-direction:column;gap:10px;max-height:400px;overflow-y:auto;margin-bottom:12px;">
            <div style="font-size:12px;color:#6b7280;">Antworten werden geladen...</div>
          </div>

          <div style="border-top:1px solid #dbe3ea;padding-top:14px;margin-top:4px;">
            <textarea
              placeholder="Nachricht schreiben..."
              class="buyer-reply-input"
              data-id="${inquiry.id}"
              style="width:100%;min-height:80px;padding:12px;border-radius:10px;border:1px solid #dbe3ea;outline:none;font-size:14px;resize:vertical;box-sizing:border-box;"
            ></textarea>
            <button
              class="buyer-reply-btn"
              data-id="${inquiry.id}"
              style="margin-top:10px;padding:10px 16px;background:#123a63;color:white;border:none;border-radius:999px;font-weight:700;cursor:pointer;font-size:14px;"
            >
              Nachricht senden
            </button>
          </div>
        </article>
      `;
    }).join("");

    // Initial messages laden
    for (const inquiry of inquiries) {
      const messages = await loadMessages(inquiry.id);
      const chatBox = document.getElementById(`buyer-chat-${inquiry.id}`);
      renderMessages(chatBox, messages);
    }

    // ── Supabase Realtime: Live-Chat ──────────────────────────────────
    const inquiryIds = inquiries.map((i) => i.id);

    supabaseClient
      .channel("buyer-chat-live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "inquiry_messages",
        },
        async (payload) => {
          const newMsg = payload.new;

          // Nur für eigene Anfragen
          if (!inquiryIds.includes(newMsg.inquiry_id)) return;

          // Eigene Nachrichten nicht nochmal einblenden
          if (newMsg.sender_user_id === user.id) return;

          const chatBox = document.getElementById(`buyer-chat-${newMsg.inquiry_id}`);
          if (!chatBox) return;

          const messages = await loadMessages(newMsg.inquiry_id);
          renderMessages(chatBox, messages);
        }
      )
      .subscribe();
    // ─────────────────────────────────────────────────────────────────

    // Käufer-Antwort senden
    container.addEventListener("click", async (e) => {
      const replyBtn = e.target.closest(".buyer-reply-btn");
      if (!replyBtn) return;

      const inquiryId = replyBtn.dataset.id;
      const textarea = document.querySelector(`.buyer-reply-input[data-id="${inquiryId}"]`);
      const message = textarea?.value?.trim() || "";

      if (!message) {
        alert("Bitte zuerst eine Nachricht eingeben.");
        return;
      }

      replyBtn.disabled = true;
      replyBtn.textContent = "Wird gesendet...";

      const { error: sendError } = await supabaseClient
        .from("inquiry_messages")
        .insert([
          {
            inquiry_id: inquiryId,
            sender_type: "buyer",
            sender_user_id: user.id,
            message
          }
        ]);

      if (sendError) {
        console.error("BUYER REPLY ERROR:", sendError);
        alert("Nachricht konnte nicht gespeichert werden.");
        replyBtn.disabled = false;
        replyBtn.textContent = "Nachricht senden";
        return;
      }

      textarea.value = "";

      // Optimistisch aktualisieren
      const messages = await loadMessages(inquiryId);
      const chatBox = document.getElementById(`buyer-chat-${inquiryId}`);
      renderMessages(chatBox, messages);

      replyBtn.disabled = false;
      replyBtn.textContent = "Nachricht senden";
    });

  } catch (err) {
    console.error("MY INQUIRIES INIT ERROR:", err);

    container.innerHTML = `
      <div style="background:white;border:1px solid #dbe3ea;border-radius:16px;padding:20px;">
        <h3 style="margin-bottom:10px;color:#123a63;">Unerwarteter Fehler</h3>
        <p style="color:#6b7280;">Die Seite konnte nicht geladen werden.</p>
      </div>
    `;
  }
});

async function loadMessages(inquiryId) {
  const { data, error } = await supabaseClient
    .from("inquiry_messages")
    .select("*")
    .eq("inquiry_id", inquiryId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("LOAD BUYER MESSAGES ERROR:", error);
    return [];
  }

  return data || [];
}

function renderMessages(container, messages) {
  if (!container) return;

  if (!messages.length) {
    container.innerHTML = `
      <div style="font-size:13px;color:#6b7280;">Noch keine Antwort vom Händler.</div>
    `;
    return;
  }

  container.innerHTML = messages.map((msg) => `
    <div style="
      align-self:${msg.sender_type === "seller" ? "flex-start" : "flex-end"};
      max-width:80%;
      background:${msg.sender_type === "seller" ? "#123a63" : "#f4f7fb"};
      color:${msg.sender_type === "seller" ? "#fff" : "#1f2937"};
      border:1px solid ${msg.sender_type === "seller" ? "#123a63" : "#dbe3ea"};
      border-radius:14px;
      padding:10px 12px;
    ">
      <div style="font-size:12px;opacity:0.8;margin-bottom:4px;">
        ${msg.sender_type === "seller" ? "Händler" : "Du"} · ${formatDate(msg.created_at)}
      </div>
      <div style="white-space:pre-wrap;font-size:14px;">${escapeHtml(msg.message || "")}</div>
    </div>
  `).join("");

  // Scroll ans Ende
  container.scrollTop = container.scrollHeight;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString("de-DE");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
