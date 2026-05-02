/**
 * 1A Motor — mobile.js
 * Läuft auf allen Seiten. Kümmert sich um:
 * 1. Bottom Navigation Bar injizieren
 * 2. Hamburger-Menü (Close-Button + Overlay)
 * 3. Filter-Drawer (Suche)
 * 4. Sidebar-Overlay (index.html)
 * 5. Scroll-to-top bei Navigation
 */

(function () {
  'use strict';

  /* ─── Helfer ─────────────────────────────────────────────── */
  function isMobile() { return window.innerWidth <= 768; }
  function currentPage() {
    return (window.location.pathname.split('/').pop() || 'index.html').replace(/\?.*$/, '');
  }
  function isPage(...names) { return names.includes(currentPage()); }

  /* ─── 1. BOTTOM NAVIGATION BAR ──────────────────────────── */
  function injectBottomNav() {
    if (!isMobile()) return;
    if (document.getElementById('1am-bottom-nav')) return;

    const page = currentPage();

    // Welches Icon ist aktiv?
    const isHome    = isPage('index.html', '');
    const isSearch  = isPage('suche.html');
    const isSell    = isPage('anzeige-erstellen.html');
    const isInbox   = isPage('anfragen.html', 'meine-anfragen.html');
    const isAccount = isPage('dashboard.html', 'meine-anzeigen.html', 'profil.html');

    const nav = document.createElement('nav');
    nav.id = '1am-bottom-nav';
    nav.className = 'bottom-nav-bar';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Hauptnavigation');

    nav.innerHTML = `
      <a href="index.html" class="bnb-item ${isHome ? 'active' : ''}" aria-label="Startseite">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>Start</span>
      </a>
      <a href="suche.html" class="bnb-item ${isSearch ? 'active' : ''}" aria-label="Suche">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span>Suche</span>
      </a>
      <a href="anzeige-erstellen.html" class="bnb-item" aria-label="Inserieren">
        <div class="bnb-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
        <span style="margin-top:2px;">Inserieren</span>
      </a>
      <a href="meine-anfragen.html" class="bnb-item ${isInbox ? 'active' : ''}" aria-label="Nachrichten" id="bnb-inbox">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/>
        </svg>
        <span>Nachrichten</span>
      </a>
      <a href="dashboard.html" class="bnb-item ${isAccount ? 'active' : ''}" aria-label="Konto">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
        <span>Konto</span>
      </a>
    `;

    document.body.appendChild(nav);
  }

  /* ─── 2. HAMBURGER — Close-Button & Overlay ─────────────── */
  function setupHamburger() {
    const toggle = document.getElementById('mob-toggle');
    const nav    = document.getElementById('mob-nav') || document.getElementById('mobile-nav');
    if (!toggle || !nav) return;

    // Close-Button in Nav einfügen (falls noch nicht da)
    if (!nav.querySelector('.mob-nav-close')) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'mob-nav-close';
      closeBtn.innerHTML = '✕';
      closeBtn.setAttribute('aria-label', 'Menü schließen');
      closeBtn.addEventListener('click', closeNav);
      nav.insertBefore(closeBtn, nav.firstChild);
    }

    // Overlay erstellen
    let overlay = document.getElementById('mob-nav-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'mob-nav-overlay';
      overlay.className = 'mob-overlay';
      overlay.addEventListener('click', closeNav);
      document.body.appendChild(overlay);
    }

    // Hamburger → 3 Balken animated (X beim Öffnen)
    toggle.addEventListener('click', function () {
      const isOpen = nav.classList.toggle('open');
      overlay.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
      toggle.setAttribute('aria-expanded', isOpen);
      // Balken animieren
      const spans = toggle.querySelectorAll('span');
      if (spans.length === 3) {
        if (isOpen) {
          spans[0].style.transform = 'translateY(7px) rotate(45deg)';
          spans[1].style.opacity   = '0';
          spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
        } else {
          spans[0].style.transform = '';
          spans[1].style.opacity   = '';
          spans[2].style.transform = '';
        }
      }
    });

    function closeNav() {
      nav.classList.remove('open');
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      toggle.setAttribute('aria-expanded', 'false');
      const spans = toggle.querySelectorAll('span');
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }

    // ESC-Taste schließt Nav
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
  }

  /* ─── 3. FILTER-DRAWER (suche.html) ─────────────────────── */
  function setupFilterDrawer() {
    const filterBtn = document.getElementById('mob-filter-btn');
    const sidebar   = document.getElementById('sidebar') || document.querySelector('.filter-sidebar');
    if (!filterBtn || !sidebar) return;

    // Overlay
    let overlay = document.getElementById('sidebar-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'sidebar-overlay';
      overlay.className = 'sidebar-overlay';
      document.body.insertBefore(overlay, document.body.firstChild);
    }

    // Close-Button in Sidebar
    if (!sidebar.querySelector('.sidebar-close-btn')) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'sidebar-close-btn';
      closeBtn.innerHTML = '✕ Schließen';
      closeBtn.style.cssText = 'width:100%;padding:12px 18px;background:none;border:none;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:700;color:#64748b;cursor:pointer;text-align:left;display:flex;align-items:center;gap:8px;';
      closeBtn.addEventListener('click', closeFilter);
      sidebar.insertBefore(closeBtn, sidebar.firstChild);
    }

    filterBtn.addEventListener('click', function () {
      sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
      document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
    });

    overlay.addEventListener('click', closeFilter);

    function closeFilter() {
      sidebar.classList.remove('open');
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  /* ─── 4. MOBILE SEARCH BAR (suche.html) ─────────────────── */
  function setupMobileSearch() {
    const searchToggle = document.querySelector('.search-toggle-btn');
    const mobileSearch = document.getElementById('mobile-search');
    if (!mobileSearch) return;

    // Auf suche.html: Mobile-Suche direkt einblenden
    if (isPage('suche.html')) {
      mobileSearch.style.display = 'flex';
    }
  }

  /* ─── 5. TOUCH-SWIPE für Galerie (listing-detail) ────────── */
  function setupSwipeGallery() {
    const mainImg = document.getElementById('main-image');
    const thumbRow = document.getElementById('thumb-row');
    if (!mainImg || !thumbRow) return;

    let startX = 0;
    let isDragging = false;

    mainImg.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX;
      isDragging = true;
    }, { passive: true });

    mainImg.addEventListener('touchend', function (e) {
      if (!isDragging) return;
      isDragging = false;
      const endX = e.changedTouches[0].clientX;
      const diff = startX - endX;

      if (Math.abs(diff) < 40) return; // Zu kurz

      const thumbs = thumbRow.querySelectorAll('.thumb');
      const active = thumbRow.querySelector('.thumb.active');
      if (!thumbs.length || !active) return;

      const idx = Array.from(thumbs).indexOf(active);
      let next;
      if (diff > 0) {
        // Swipe left → next
        next = idx < thumbs.length - 1 ? thumbs[idx + 1] : null;
      } else {
        // Swipe right → prev
        next = idx > 0 ? thumbs[idx - 1] : null;
      }
      if (next) next.click();
    }, { passive: true });
  }

  /* ─── 6. STICKY HEADER SHRINK ────────────────────────────── */
  function setupStickyHeader() {
    const header = document.querySelector('.header');
    if (!header) return;
    let lastScroll = 0;

    window.addEventListener('scroll', function () {
      const current = window.scrollY;
      if (current > 60 && current > lastScroll) {
        // Scrolling down — Header kleiner
        header.style.transform = 'translateY(-100%)';
        header.style.transition = 'transform .25s ease';
      } else {
        // Scrolling up — Header wieder sichtbar
        header.style.transform = 'translateY(0)';
      }
      lastScroll = current;
    }, { passive: true });
  }

  /* ─── 7. SAFE AREA (iPhone Notch / Home Bar) ────────────── */
  function setupSafeArea() {
    // Fügt env() Variablen für iPhone-Kerben hinzu
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta && !meta.content.includes('viewport-fit')) {
      meta.content = meta.content + ', viewport-fit=cover';
    }

    // Bottom Nav safe area
    const style = document.createElement('style');
    style.textContent = `
      @supports (padding-bottom: env(safe-area-inset-bottom)) {
        .bottom-nav-bar {
          padding-bottom: env(safe-area-inset-bottom) !important;
          height: calc(62px + env(safe-area-inset-bottom)) !important;
        }
        body { padding-bottom: calc(70px + env(safe-area-inset-bottom)) !important; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ─── 8. PULL-TO-REFRESH VERHINDERN (verhindert Fehler) ─── */
  function preventPullToRefresh() {
    // Nur wenn Body am Anfang — verhindert accidentelle Refreshes
    document.body.style.overscrollBehaviorY = 'contain';
  }

  /* ─── INIT ───────────────────────────────────────────────── */
  function init() {
    if (!isMobile()) return; // Alles nur auf Mobile

    injectBottomNav();
    setupHamburger();
    setupFilterDrawer();
    setupMobileSearch();
    setupSwipeGallery();
    setupSafeArea();
    preventPullToRefresh();

    // Sticky Header nur auf Seiten wo viel gescrollt wird
    if (isPage('suche.html', 'index.html', 'listing-detail.html')) {
      setupStickyHeader();
    }
  }

  // Warten bis DOM fertig
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Resize: Bottom Nav neu rendern wenn Größe wechselt
  window.addEventListener('resize', function () {
    const existing = document.getElementById('1am-bottom-nav');
    if (isMobile() && !existing) {
      injectBottomNav();
      setupHamburger();
    } else if (!isMobile() && existing) {
      existing.remove();
      document.body.style.paddingBottom = '';
    }
  });

})();
