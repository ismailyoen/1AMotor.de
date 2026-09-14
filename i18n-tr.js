// ══════════════════════════════════════════════════════════════════
//  1A Motor – Türkisch-Layer (TR)
//  Additiv: NACH i18n.js einbinden.
//    <script src="i18n.js?v=7"></script>
//    <script src="i18n-tr.js?v=1"></script>
//  Verändert i18n.js nicht. Wenn i18n.js aktualisiert wird,
//  bleibt diese Datei unverändert lauffähig.
// ══════════════════════════════════════════════════════════════════

(function () {
  "use strict";

  // Auf false setzen, wenn Besucher NICHT automatisch auf TR
  // gestellt werden sollen (dann nur über den Sprachumschalter).
  const AUTO_DETECT = true;

  const TR = {
    // Navigation
    "nav.search":           "Motor ara",
    "nav.sell":             "İlan oluştur",
    "nav.login":            "Giriş yap",
    "nav.register":         "Kayıt ol",
    "nav.account":          "Hesabım",
    "nav.inquiries":        "Mesajlar",
    "nav.listings":         "İlanlarım",
    "nav.logout":           "Çıkış yap",
    "nav.contact":          "Yardım & İletişim",
    "nav.dealer":           "Satıcı alanı",
    "nav.dashboard":        "Kontrol paneli",
    "nav.back":             "← Ana sayfaya dön",

    // Hero
    "hero.title":           "Motor alın & satın.",
    "hero.subtitle":        "Araç motorları, endüstriyel tahrik sistemleri, tekne motorları ve özel motorlar. Doğrulanmış satıcılar, doğrudan talepler, komisyon yok.",
    "hero.cta.search":      "🔍 Hemen ara",
    "hero.cta.dealer":      "Satıcı olarak başla",
    "hero.pill":            "⚙️ Almanya'nın motor pazar yeri",

    // Suche / Search bar
    "search.placeholder":   "Motor, üretici, model veya parça numarası ara…",
    "search.btn":           "Ara",
    "search.allcats":       "Tüm kategoriler",

    // Listings
    "listings.title":       "Güncel ilanlar",
    "listings.all":         "Tümünü gör →",
    "listings.newest":      "Önce en yeni",
    "listings.cheapest":    "Fiyat ↑",
    "listings.dearest":     "Fiyat ↓",
    "listings.empty":       "Henüz ilan bulunmuyor.",
    "listings.loading":     "İlanlar yükleniyor…",
    "listings.count":       "güncel ilan",

    // Sidebar Filter
    "filter.categories":    "Kategoriler",
    "filter.condition":     "Durum",
    "filter.price":         "Fiyat",
    "filter.dealers":       "Satıcılar",
    "filter.all":           "Tümü",
    "filter.new":           "Sıfır",
    "filter.used":          "İkinci el",
    "filter.refurb":        "Yenilenmiş",
    "filter.verified":      "Doğrulanmış satıcılar",
    "filter.toprated":      "En yüksek puan",
    "filter.commercial":    "Kurumsal",
    "filter.tosearch":      "→ Aramaya git",
    "filter.show":          "☰ Filtreleri göster",

    // Features
    "feature.verified.title":   "Doğrulanmış satıcılar",
    "feature.verified.text":    "Daha fazla güven için doğrulanmış satıcı profilleri ve şeffaf değerlendirmeler.",
    "feature.cats.title":       "101+ kategori",
    "feature.cats.text":        "Araç, endüstriyel, tekne ve özel motorlar tek platformda.",
    "feature.shipping.title":   "Nakliye seçenekleri",
    "feature.shipping.text":    "Avrupa geneli. Ağır motorlar, makineler ve komple gruplar için ideal.",
    "feature.nofee.title":      "Komisyon yok",
    "feature.nofee.text":       "Alıcı ile satıcı arasında doğrudan iletişim. Gizli ücret yok.",

    // Newsletter
    "newsletter.title":     "Yeni ilanları doğrudan alın",
    "newsletter.subtitle":  "Fiyat güncellemelerine, yeni ilanlara ve özel kampanyalara abone olun.",
    "newsletter.placeholder":"E-posta adresiniz",
    "newsletter.btn":       "Abone ol",

    // Footer
    "footer.desc":          "Almanya ve Avrupa'da motorlar, tahrik sistemleri ve makine teknolojisi için uzmanlaşmış pazar yeri.",
    "footer.buy":           "Alış",
    "footer.sell":          "Satış",
    "footer.company":       "Şirket",
    "footer.legal":         "Yasal",
    "footer.rights":        "© 2026 1A Motor – Motor & Tahrik Teknolojisi Pazar Yeri",
    "footer.search":        "Motor ara",
    "footer.create":        "İlan oluştur",
    "footer.dealer":        "Satıcı hesabı",
    "footer.messages":      "Mesajlar",

    // Listing Detail
    "detail.contact":       "Satıcıyla iletişime geçin",
    "detail.send":          "📨 Mesaj gönder",
    "detail.name":          "Adınız",
    "detail.email":         "E-posta adresiniz",
    "detail.message":       "Mesajınız…",
    "detail.success":       "✅ Talebiniz gönderildi! Satıcı kısa süre içinde size dönecek.",
    "detail.similar":       "🔍 Benzer ilanlar",
    "detail.specs":         "Teknik özellikler",
    "detail.description":   "Açıklama",
    "detail.seller":        "Satıcı hakkında",
    "detail.location":      "Konum:",
    "detail.published":     "Yayınlandı",
    "detail.back":          "← Aramaya dön",

    // Suche Page
    "suche.title":          "Motor ara",
    "suche.results":        "Arama sonuçları",
    "suche.noresults":      "İlan bulunamadı.",
    "suche.loading":        "Aranıyor…",
    "suche.filter.title":   "Aramayı daralt",

    // Login / Register
    "login.title":          "Tekrar hoş geldiniz",
    "login.subtitle":       "1A Motor hesabınıza giriş yapın.",
    "login.email":          "E-posta adresi",
    "login.password":       "Şifre",
    "login.forgot":         "Şifrenizi mi unuttunuz?",
    "login.btn":            "Giriş yap",
    "login.noreg":          "Henüz hesabınız yok mu?",
    "login.register":       "Hemen kayıt olun",
    "register.title":       "Hesap oluştur",
    "register.subtitle":    "1A Motor'a ücretsiz kayıt olun.",
    "register.name":        "Ad ve soyad",
    "register.btn":         "Hemen kayıt ol",
    "register.hasaccount":  "Zaten hesabınız var mı?",
    "register.login":       "Giriş yap",
    "register.buyer":       "Alıcı",
    "register.seller":      "Satıcı",

    // Dashboard
    "dashboard.title":      "Kontrol paneli",
    "dashboard.welcome":    "Tekrar hoş geldiniz",
    "dashboard.listings":   "İlanlar",
    "dashboard.inquiries":  "Talepler",
    "dashboard.new":        "+ Yeni ilan",
    "dashboard.active":     "Aktif ilanlar",
    "dashboard.drafts":     "Taslaklar",
    "dashboard.value":      "Toplam değer",
    "dashboard.activity":   "Son hareketler",

    // Meine Anzeigen
    "mylistings.title":     "İlanlarım",
    "mylistings.subtitle":  "İlanlarınızı yönetin ve düzenleyin.",
    "mylistings.new":       "＋ Yeni ilan",
    "mylistings.search":    "🔍 Başlık veya üretici ara…",
    "mylistings.allstatus": "Tüm durumlar",
    "mylistings.approved":  "Yayında",
    "mylistings.draft":     "Taslak",
    "mylistings.view":      "Görüntüle",
    "mylistings.edit":      "Düzenle",
    "mylistings.delete":    "Sil",
    "mylistings.empty":     "İlan bulunamadı.",
    "mylistings.createfirst":"İlk ilanınızı oluşturun",

    // Anfragen / Messages
    "inquiries.title":      "Talepler",
    "inquiries.subtitle":   "İlanlarınıza gelen alıcı mesajları.",
    "inquiries.all":        "Tümü",
    "inquiries.new":        "Yeni",
    "inquiries.read":       "Okundu",
    "inquiries.done":       "Tamamlandı",
    "inquiries.reply":      "Yanıt gönder",
    "inquiries.placeholder":"Yanıt yazın…",
    "inquiries.empty":      "Henüz talep bulunmuyor.",
    "inquiries.re":         "İlgili ilan:",

    // Nachrichten (Käufer)
    "messages.title":       "Mesajlar",
    "messages.subtitle":    "Burada taleplerinizi ve satıcıların yanıtlarını görebilirsiniz.",
    "messages.empty":       "Henüz mesajınız yok.",
    "messages.send":        "Mesaj gönder",
    "messages.placeholder": "Mesaj yazın…",

    // Anzeige erstellen
    "create.title":         "İlan oluştur",
    "create.edit":          "İlanı düzenle",
    "create.step1":         "Temel bilgiler",
    "create.step2":         "Fiyat & Konum",
    "create.step3":         "Teknik",
    "create.step4":         "Açıklama",
    "create.step5":         "Fotoğraflar",
    "create.publish":       "İlanı yayınla",
    "create.draft":         "Taslak olarak kaydet",
    "create.type.sale":     "🏷️ Satılık",
    "create.type.wanted":   "🔍 Aranıyor",
    "create.type.sale.sub": "Bir motor satıyorum",
    "create.type.wanted.sub":"Bir motor arıyorum",

    // Profil
    "profil.title":         "Profil",
    "profil.save":          "Profili kaydet",
    "profil.delete":        "Hesabı sil",
    "profil.company":       "Firma adı",
    "profil.contact":       "Yetkili kişi",

    // Allgemein
    "condition.new":        "Sıfır",
    "condition.used":       "İkinci el",
    "condition.rebuilt":    "Yenilenmiş",
    "status.live":          "Yayında",
    "status.draft":         "Taslak",
    "btn.back":             "Geri",
    "btn.save":             "Kaydet",
    "btn.cancel":           "İptal",
    "btn.delete":           "Sil",
    "loading":              "Yükleniyor…",
    "error.notfound":       "İlan bulunamadı.",
    "topbar.contact":       "Yardım & İletişim",
    "topbar.dealer":        "Satıcı alanı",
    "topbar.imprint":       "Künye (Impressum)",
    "topbar.privacy":       "Gizlilik",
    "topbar.agb":           "Şartlar (AGB)",
  };

  if (typeof I18n === "undefined" || !I18n) {
    console.warn("[i18n-tr] i18n.js nicht gefunden – TR-Layer inaktiv.");
    return;
  }

  // ── 1. In das translations-Objekt eintragen (falls erreichbar) ──────
  try {
    if (typeof translations === "object" && translations) {
      translations.tr = TR;
    }
  } catch (e) { /* nicht erreichbar – Fallback unten greift */ }

  // ── 2. Harter Fallback: I18n.t umhüllen ─────────────────────────────
  const _t = I18n.t;
  I18n.t = function (key) {
    if (this.lang === "tr" && TR[key]) return TR[key];
    return _t.call(this, key);
  };

  // ── 3. Toggle-Button: 🇹🇷 TR anzeigen ────────────────────────────────
  const _updateToggle = I18n.updateToggle;
  I18n.updateToggle = function () {
    const btn = document.getElementById("lang-toggle");
    if (!btn) return;
    if (this.lang === "tr") {
      btn.innerHTML = '🇹🇷 TR <span style="font-size:9px;opacity:.7;">▾</span>';
      return;
    }
    _updateToggle.call(this);
  };

  // ── 4. TR ins Dropdown einhängen (idempotent) ───────────────────────
  function ensureTrOption() {
    const dropdown = document.getElementById("lang-dropdown");
    if (!dropdown) return false;
    if (dropdown.querySelector("[data-lang-tr]")) return true;

    const item = document.createElement("button");
    item.setAttribute("data-lang-tr", "1");
    item.type = "button";
    item.style.cssText =
      "display:flex;align-items:center;gap:9px;width:100%;" +
      "padding:11px 14px;border:none;background:none;" +
      "font-size:14px;font-weight:600;color:#334155;" +
      "cursor:pointer;text-align:left;font-family:inherit;" +
      "transition:background .12s;";
    item.innerHTML = "🇹🇷 Türkçe";
    item.addEventListener("mouseenter", () => { item.style.background = "#f0f4f8"; });
    item.addEventListener("mouseleave", () => { item.style.background = "none"; });
    item.addEventListener("click", (e) => {
      e.stopPropagation();
      I18n.setLang("tr");
      dropdown.style.display = "none";
    });
    dropdown.appendChild(item);
    return true;
  }

  // Mehrere Versuche – der Header wird teils von auth-header.js
  // nachträglich aufgebaut.
  [0, 150, 500, 1200, 2500].forEach(ms => setTimeout(ensureTrOption, ms));
  document.addEventListener("DOMContentLoaded", ensureTrOption);
  window.addEventListener("load", () => {
    ensureTrOption();
    I18n.updateToggle();
  });

  // ── 5. Auto-Erkennung für Besucher aus der Türkei ────────────────────
  // Greift nur beim ersten Besuch. Sobald der Nutzer selbst eine
  // Sprache wählt, gewinnt immer seine Wahl (localStorage).
  if (AUTO_DETECT && !localStorage.getItem("1amotor_lang")) {
    const langs = [navigator.language].concat(navigator.languages || []);
    const wantsTr = langs.some(l => (l || "").toLowerCase().indexOf("tr") === 0);
    if (wantsTr) {
      I18n.lang = "tr";
      if (document.readyState !== "loading") {
        I18n.apply();
        I18n.updateToggle();
      }
    }
  }

  window.I18N_TR = TR;
})();
