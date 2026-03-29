// ── 1A Motor – Mehrsprachigkeit DE/EN ────────────────────────────────────────
const translations = {
  de: {
    // Navigation
    "nav.search":       "Motor suchen",
    "nav.sell":         "Anzeige erstellen",
    "nav.login":        "Einloggen",
    "nav.register":     "Registrieren",
    "nav.account":      "Mein Konto",
    "nav.inquiries":    "Nachrichten",
    "nav.listings":     "Meine Anzeigen",
    "nav.logout":       "Abmelden",
    "nav.contact":      "Hilfe & Kontakt",
    "nav.dealer":       "Händlerbereich",

    // Hero
    "hero.title":       "Motoren kaufen & verkaufen.",
    "hero.subtitle":    "Fahrzeugmotoren, Industrieantriebe, Bootsmotoren und Spezialmotoren. Geprüfte Händler, direkte Anfragen, keine Provision.",
    "hero.cta.search":  "🔍 Jetzt suchen",
    "hero.cta.dealer":  "Als Händler starten",

    // Suche
    "search.placeholder": "Motor, Hersteller, Modell oder Teilenummer suchen…",
    "search.btn":          "Suchen",
    "search.allcats":      "Alle Kategorien",

    // Listings
    "listings.title":   "Aktuelle Angebote",
    "listings.all":     "Alle ansehen →",
    "listings.newest":  "Neueste zuerst",
    "listings.cheapest":"Preis ↑",
    "listings.dearest": "Preis ↓",
    "listings.empty":   "Noch keine Angebote vorhanden.",

    // Detail
    "detail.contact":   "Verkäufer kontaktieren",
    "detail.send":      "📨 Nachricht senden",
    "detail.name":      "Ihr Name",
    "detail.email":     "Ihre E-Mail",
    "detail.message":   "Ihre Nachricht…",
    "detail.success":   "✅ Anfrage gesendet! Der Händler meldet sich bald.",
    "detail.similar":   "🔍 Ähnliche Anzeigen",
    "detail.workshops": "🔧 Werkstätten in der Nähe",

    // Footer
    "footer.buy":       "Kaufen",
    "footer.sell":      "Verkaufen",
    "footer.company":   "Unternehmen",
    "footer.legal":     "Rechtliches",
    "footer.rights":    "Alle Rechte vorbehalten",

    // Allgemein
    "condition.new":    "Neu",
    "condition.used":   "Gebraucht",
    "condition.rebuilt":"Generalüberholt",
    "status.live":      "Live",
    "status.draft":     "Entwurf",
  },
  en: {
    // Navigation
    "nav.search":       "Search Motors",
    "nav.sell":         "Create Listing",
    "nav.login":        "Login",
    "nav.register":     "Register",
    "nav.account":      "My Account",
    "nav.inquiries":    "Messages",
    "nav.listings":     "My Listings",
    "nav.logout":       "Logout",
    "nav.contact":      "Help & Contact",
    "nav.dealer":       "Dealer Area",

    // Hero
    "hero.title":       "Buy & sell motors.",
    "hero.subtitle":    "Vehicle engines, industrial drives, boat motors and special engines. Verified dealers, direct inquiries, no commission.",
    "hero.cta.search":  "🔍 Search now",
    "hero.cta.dealer":  "Start as dealer",

    // Suche
    "search.placeholder": "Search motor, manufacturer, model or part number…",
    "search.btn":          "Search",
    "search.allcats":      "All Categories",

    // Listings
    "listings.title":   "Latest Listings",
    "listings.all":     "View all →",
    "listings.newest":  "Newest first",
    "listings.cheapest":"Price ↑",
    "listings.dearest": "Price ↓",
    "listings.empty":   "No listings available yet.",

    // Detail
    "detail.contact":   "Contact seller",
    "detail.send":      "📨 Send message",
    "detail.name":      "Your name",
    "detail.email":     "Your email",
    "detail.message":   "Your message…",
    "detail.success":   "✅ Inquiry sent! The dealer will get back to you soon.",
    "detail.similar":   "🔍 Similar listings",
    "detail.workshops": "🔧 Workshops nearby",

    // Footer
    "footer.buy":       "Buy",
    "footer.sell":      "Sell",
    "footer.company":   "Company",
    "footer.legal":     "Legal",
    "footer.rights":    "All rights reserved",

    // Allgemein
    "condition.new":    "New",
    "condition.used":   "Used",
    "condition.rebuilt":"Refurbished",
    "status.live":      "Live",
    "status.draft":     "Draft",
  }
};

// ── Sprach-Engine ─────────────────────────────────────────────────────────────
const I18n = {
  lang: localStorage.getItem("1amotor_lang") || "de",

  t(key) {
    return translations[this.lang]?.[key] || translations["de"]?.[key] || key;
  },

  setLang(lang) {
    this.lang = lang;
    localStorage.setItem("1amotor_lang", lang);
    this.apply();
    this.updateToggle();
  },

  // Alle data-i18n Elemente übersetzen
  apply() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const attr = el.getAttribute("data-i18n-attr");
      if (attr) {
        el.setAttribute(attr, this.t(key));
      } else {
        el.textContent = this.t(key);
      }
    });

    // Placeholder
    document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
      el.placeholder = this.t(el.getAttribute("data-i18n-placeholder"));
    });

    // HTML lang Attribut
    document.documentElement.lang = this.lang;
  },

  // Toggle Button aktualisieren
  updateToggle() {
    const btn = document.getElementById("lang-toggle");
    if (btn) btn.textContent = this.lang === "de" ? "🇬🇧 EN" : "🇩🇪 DE";
  },

  // Toggle Button erstellen und in Header einfügen
  injectToggle() {
    // Nicht doppelt einfügen
    if (document.getElementById("lang-toggle")) return;

    const btn = document.createElement("button");
    btn.id = "lang-toggle";
    btn.textContent = this.lang === "de" ? "🇬🇧 EN" : "🇩🇪 DE";
    btn.title = "Sprache wechseln / Switch language";
    btn.style.cssText = `
      background: none; border: 1.5px solid #dbe3ea; border-radius: 8px;
      padding: 7px 12px; font-size: 13px; font-weight: 700; cursor: pointer;
      color: #334155; transition: background .15s, border-color .15s;
      font-family: inherit; white-space: nowrap;
    `;
    btn.addEventListener("mouseenter", () => {
      btn.style.background = "#f1f5f9";
      btn.style.borderColor = "#1a3a52";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.background = "none";
      btn.style.borderColor = "#dbe3ea";
    });
    btn.addEventListener("click", () => {
      this.setLang(this.lang === "de" ? "en" : "de");
    });

    // In Header-Actions einfügen
    const targets = [
      document.querySelector(".header-right"),
      document.querySelector(".header-actions"),
      document.querySelector(".hdr-right"),
    ];
    const target = targets.find(t => t !== null);
    if (target) {
      target.insertBefore(btn, target.firstChild);
    }
  },

  init() {
    document.addEventListener("DOMContentLoaded", () => {
      this.injectToggle();
      this.apply();
    });
  }
};

// Automatisch starten
I18n.init();

// Global verfügbar machen
window.I18n = I18n;
