document.addEventListener("DOMContentLoaded", async () => {
  console.log("ANFRAGEN LIVE JS GELADEN");

  const inquiryList = document.getElementById("inquiry-list");
  const userBoxHeading = document.querySelector(".user-box h2");
  const userBoxText = document.querySelector(".user-box p");

  if (!inquiryList) return;

  inquiryList.innerHTML = `
    <div class="empty-box">
      <h3>Anfragen werden geladen</h3>
      <p>Bitte kurz warten...</p>
    </div>
  `;

  try {
    const sessionResult = await supabaseClient.auth.getSession();
    const user = sessionResult?.data?.session?.user;

    if (!user) {
      inquiryList.innerHTML = `
        <div class="empty-box">
          <h3>Nicht eingeloggt</h3>
          <p>Bitte logge dich ein, um deine Anfragen zu sehen.</p>
        </div>
      `;
      return;
    }

    const sellerResult = await supabaseClient
      .from("seller_profiles")
      .select("id, company_name")
      .eq("user_id", user.id)
      .single();

    if (sellerResult.error || !sellerResult.data) {
      console.error("SELLER PROFILE ERROR:", sellerResult.error);

      if (userBoxHeading) userBoxHeading.textContent = "Kein Händlerprofil";
      if (userBoxText) userBoxText.textContent = user.email || "";

      inquiryList.innerHTML = `
        <div class="empty-box">
          <h3>Kein Händlerprofil gefunden</h3>
          <p>Für diesen Benutzer existiert noch kein Eintrag in seller_profiles.</p>
        </div>
      `;
      return;
    }

    const seller = sellerResult.data;

    if (userBoxHeading) userBoxHeading.textContent = seller.company_name || "Hallo Händler";
    if (userBoxText) userBoxText.textContent = user.email || "";

    const { data: inquiries, error: inquiriesError } = await supabaseClient
      .from("inquiries")
      .select(`
        id,
        listing_id,
        name,
        email,
        message,
        status,
        created_at,
        listings (
          id,
          title,
          seller_id
        )
      `)
      .order("created_at", { ascending: false });

    console.log("INQUIRIES RESULT:", inquiries);
    console.log("INQUIRIES ERROR:", inquiriesError);

    if (inquiriesError) {
      inquiryList.innerHTML = `
        <div class="empty-box">
          <h3>Fehler beim Laden</h3>
          <p>Die Anfragen konnten nicht geladen werden.</p>
        </div>
      `;
      return;
    }

    const sellerInquiries = (inquiries || []).filter((inquiry) => {
      const listingRelation = Array.isArray(inquiry.listings)
        ? inquiry.listings[0]
        : inquiry.listings;

      return listingRelation?.seller_id === seller.id;
    });

    if (!sellerInquiries.length) {
      inquiryList.innerHTML = `
        <div class="empty-box">
          <h3>Noch keine Anfragen vorhanden</h3>
          <p>Sobald Käufer dir schreiben, erscheinen die Anfragen hier.</p>
        </div>
      `;
      return;
    }

    inquiryList.innerHTML = sellerInquiries.map((inquiry) => {
      const listingRelation = Array.isArray(inquiry.listings)
        ? inquiry.listings[0]
        : inquiry.listings;

      const listingTitle = listingRelation?.title || "Anzeige";
      const statusClass = getStatusClass(inquiry.status);
      const formattedDate = new Date(inquiry.created_at).toLocaleString("de-DE");

      return `
        <article class="inquiry-card" style="background:#fff;border:1px solid #dbe3ea;border-radius:16px;padding:20px;margin-bottom:18px;box-shadow:0 10px 30px rgba(18,58,99,0.08);">
          <div style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:12px;">
            <div>
              <h3 style="font-size:20px;color:#123a63;margin-bottom:6px;">Anfrage zu: ${escapeHtml(listingTitle)}</h3>
              <div style="display:flex;flex-wrap:wrap;gap:14px;color:#475569;font-size:14px;">
                <span><strong>Name:</strong> ${escapeHtml(inquiry.name || "-")}</span>
                <span><strong>E-Mail:</strong> ${escapeHtml(inquiry.email || "-")}</span>
                <span><strong>Datum:</strong> ${formattedDate}</span>
              </div>
            </div>

            <div>
              <span class="badge ${statusClass}" style="display:inline-flex;align-items:center;padding:8px 12px;border-radius:999px;font-size:12px;font-weight:700;background:#fff;border:1px solid #dbe3ea;">
                ${escapeHtml(inquiry.status || "Neu")}
              </span>
            </div>
          </div>

          <div class="message-box" style="background:#fbfdff;border:1px solid #dbe3ea;border-radius:14px;padding:14px;color:#334155;font-size:14px;white-space:pre-wrap;margin-bottom:14px;">
            ${escapeHtml(inquiry.message || "")}
          </div>

          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;">
            <button class="status-btn" data-id="${inquiry.id}" data-status="Neu" style="padding:10px 14px;border-radius:999px;border:1px solid #dbe3ea;background:#fff;color:#123a63;font-weight:700;font-size:13px;cursor:pointer;">
              Neu
            </button>
            <button class="status-btn" data-id="${inquiry.id}" data-status="Gelesen" style="padding:10px 14px;border-radius:999px;border:1px solid #dbe3ea;background:#fff;color:#123a63;font-weight:700;font-size:13px;cursor:pointer;">
              Gelesen
            </button>
            <button class="status-btn" data-id="${inquiry.id}" data-status="Erledigt" style="padding:10px 14px;border-radius:999px;border:1px solid #dbe3ea;background:#fff;color:#123a63;font-weight:700;font-size:13px;cursor:pointer;">
              Erledigt
            </button>
          </div>

          <div class="chat-box" style="margin-top:14px;padding-top:14px;border-top:1px solid #dbe3ea;">
            <div class="chat-messages" id="chat-${inquiry.id}" style="display:flex;flex-direction:column;gap:10px;margin-bottom:12px;max-height:400px;overflow-y:auto;">
              <div style="font-size:12px;color:#6b7280;">Nachrichten werden geladen...</div>
            </div>

            <textarea
              placeholder="Antwort schreiben..."
              class="reply-input"
              data-id="${inquiry.id}"
              style="width:100%;min-height:90px;padding:12px;border-radius:10px;border:1px solid #dbe3ea;outline:none;font-size:14px;resize:vertical;box-sizing:border-box;"
            ></textarea>

            <button
              class="reply-btn"
              data-id="${inquiry.id}"
              style="margin-top:10px;padding:10px 16px;background:#123a63;color:white;border:none;border-radius:999px;font-weight:700;cursor:pointer;"
            >
              Antwort senden
            </button>
          </div>
        </article>
      `;
    }).join("");

    // Initial messages laden
    for (const inquiry of sellerInquiries) {
      const messages = await loadMessages(inquiry.id);
      const chatBox = document.getElementById(`chat-${inquiry.id}`);
      renderMessages(chatBox, inquiry, messages);
    }

    // ── Supabase Realtime: Live-Chat ──────────────────────────────────
    const inquiryIds = sellerInquiries.map((i) => i.id);

    supabaseClient
      .channel("seller-chat-live")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "inquiry_messages",
        },
        async (payload) => {
          const newMsg = payload.new;

          // Nur für Anfragen dieses Händlers
          if (!inquiryIds.includes(newMsg.inquiry_id)) return;

          // Eigene Nachrichten nicht nochmal einblenden (bereits optimistisch gerendert)
          if (newMsg.sender_user_id === user.id) return;

          const chatBox = document.getElementById(`chat-${newMsg.inquiry_id}`);
          if (!chatBox) return;

          const inquiry = sellerInquiries.find((i) => i.id === newMsg.inquiry_id);
          const messages = await loadMessages(newMsg.inquiry_id);
          renderMessages(chatBox, inquiry, messages);
        }
      )
      .subscribe();
    // ─────────────────────────────────────────────────────────────────

    inquiryList.addEventListener("click", async (e) => {
      const statusBtn = e.target.closest(".status-btn");
      if (statusBtn) {
        const inquiryId = statusBtn.dataset.id;
        const nextStatus = statusBtn.dataset.status;

        const { error } = await supabaseClient
          .from("inquiries")
          .update({ status: nextStatus })
          .eq("id", inquiryId);

        if (error) {
          console.error("STATUS UPDATE ERROR:", error);
          alert("Status konnte nicht geändert werden.");
          return;
        }

        window.location.reload();
        return;
      }

      const replyBtn = e.target.closest(".reply-btn");
      if (!replyBtn) return;

      const inquiryId = replyBtn.dataset.id;
      const textarea = document.querySelector(`.reply-input[data-id="${inquiryId}"]`);
      const message = textarea?.value?.trim() || "";

      if (!message) {
        alert("Bitte zuerst eine Antwort eingeben.");
        return;
      }

      replyBtn.disabled = true;
      replyBtn.textContent = "Wird gesendet...";

      const { error } = await supabaseClient
        .from("inquiry_messages")
        .insert([
          {
            inquiry_id: inquiryId,
            sender_type: "seller",
            sender_user_id: user.id,
            message
          }
        ]);

      if (error) {
        console.error("REPLY ERROR:", error);
        alert("Antwort konnte nicht gespeichert werden.");
        replyBtn.disabled = false;
        replyBtn.textContent = "Antwort senden";
        return;
      }

      textarea.value = "";

      // Optimistisch aktualisieren (ohne auf Realtime zu warten)
      const inquiry = sellerInquiries.find((item) => item.id === inquiryId);
      const messages = await loadMessages(inquiryId);
      const chatBox = document.getElementById(`chat-${inquiryId}`);
      renderMessages(chatBox, inquiry, messages);

      replyBtn.disabled = false;
      replyBtn.textContent = "Antwort senden";
    });
  } catch (err) {
    console.error("ANFRAGEN INIT ERROR:", err);

    inquiryList.innerHTML = `
      <div class="empty-box">
        <h3>Unerwarteter Fehler</h3>
        <p>Die Anfragen konnten nicht geladen werden.</p>
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
    console.error("LOAD MESSAGES ERROR:", error);
    return [];
  }

  return data || [];
}

function renderMessages(container, inquiry, messages) {
  if (!container) return;

  const baseMessage = `
    <div style="align-self:flex-start;max-width:80%;background:#f4f7fb;border:1px solid #dbe3ea;border-radius:14px;padding:10px 12px;">
      <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">Käufer · ${formatDate(inquiry.created_at)}</div>
      <div style="white-space:pre-wrap;color:#1f2937;font-size:14px;">${escapeHtml(inquiry.message || "")}</div>
    </div>
  `;

  if (!messages.length) {
    container.innerHTML = `
      ${baseMessage}
      <div style="font-size:12px;color:#6b7280;">Noch keine Antworten.</div>
    `;
    return;
  }

  container.innerHTML = `
    ${baseMessage}
    ${messages.map((msg) => `
      <div style="
        align-self:${msg.sender_type === "seller" ? "flex-end" : "flex-start"};
        max-width:80%;
        background:${msg.sender_type === "seller" ? "#123a63" : "#f4f7fb"};
        color:${msg.sender_type === "seller" ? "#fff" : "#1f2937"};
        border:1px solid ${msg.sender_type === "seller" ? "#123a63" : "#dbe3ea"};
        border-radius:14px;
        padding:10px 12px;
      ">
        <div style="font-size:12px;opacity:0.8;margin-bottom:4px;">
          ${msg.sender_type === "seller" ? "Händler" : "Käufer"} · ${formatDate(msg.created_at)}
        </div>
        <div style="white-space:pre-wrap;font-size:14px;">${escapeHtml(msg.message || "")}</div>
      </div>
    `).join("")}
  `;

  // Scroll ans Ende
  container.scrollTop = container.scrollHeight;
}

function getStatusClass(status) {
  if (status === "Neu") return "new";
  if (status === "Gelesen") return "read";
  return "done";
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
