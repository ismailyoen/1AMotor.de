/**
 * reviews.js — Bewertungssystem für 1A Motor
 * Lädt und speichert Händler-/Verkäuferbewertungen via Supabase
 *
 * Supabase Tabelle (einmalig im SQL Editor ausführen):
 * ─────────────────────────────────────────────────────
 * CREATE TABLE IF NOT EXISTS public.reviews (
 *   id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *   seller_id     UUID NOT NULL,
 *   listing_id    UUID,
 *   reviewer_name TEXT NOT NULL DEFAULT 'Anonym',
 *   rating        INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
 *   comment       TEXT,
 *   created_at    TIMESTAMPTZ DEFAULT now()
 * );
 * ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Anyone can read reviews"   ON public.reviews FOR SELECT USING (true);
 * CREATE POLICY "Anyone can insert reviews" ON public.reviews FOR INSERT WITH CHECK (true);
 * ─────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  // State
  let currentSellerId = null;
  let currentListingId = null;
  let selectedStars = 0;
  let allReviews = [];
  let visibleCount = 5;

  /* ── Init ─────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    // Listing ID aus URL
    const params = new URLSearchParams(window.location.search);
    currentListingId = params.get('id') || null;

    // Warten bis listing-detail-live.js den seller_id gesetzt hat
    waitForSellerId();
  });

  function waitForSellerId(attempts) {
    attempts = attempts || 0;
    if (attempts > 30) return; // nach 3 Sekunden aufgeben

    // seller_id wird von listing-detail-live.js in window gesetzt
    const sid = window._currentSellerId;
    if (sid) {
      currentSellerId = sid;
      loadReviews();
      return;
    }
    setTimeout(() => waitForSellerId(attempts + 1), 100);
  }

  /* ── Reviews laden ────────────────────────────────── */
  async function loadReviews() {
    if (!currentSellerId) return;

    try {
      const { data, error } = await supabaseClient
        .from('reviews')
        .select('*')
        .eq('seller_id', currentSellerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('REVIEWS LOAD ERROR:', error);
        return;
      }

      allReviews = data || [];
      renderSummary(allReviews);
      renderList(allReviews);
    } catch (err) {
      console.warn('Reviews error:', err);
    }
  }

  /* ── Summary (Durchschnitt + Balken) ─────────────── */
  function renderSummary(reviews) {
    const total = reviews.length;
    const avgEl   = document.getElementById('rv-avg');
    const starsEl = document.getElementById('rv-stars');
    const countEl = document.getElementById('rv-count');

    // Stat-Zelle in der Seller-Card aktualisieren
    const sellerStatRating = document.querySelector('.stat-val.rating-live');

    if (!total) {
      if (avgEl)   avgEl.textContent  = '–';
      if (starsEl) starsEl.textContent = '☆☆☆☆☆';
      if (countEl) countEl.textContent = 'Noch keine Bewertungen';
      return;
    }

    const sum = reviews.reduce((a, r) => a + r.rating, 0);
    const avg = (sum / total).toFixed(1);

    if (avgEl)   avgEl.textContent  = avg;
    if (starsEl) starsEl.textContent = starsToString(parseFloat(avg));
    if (countEl) countEl.textContent = `${total} Bewertung${total !== 1 ? 'en' : ''}`;

    // Seller-Card Stat aktualisieren
    if (sellerStatRating) {
      sellerStatRating.textContent = '⭐ ' + avg;
    }

    // Balken
    for (let s = 1; s <= 5; s++) {
      const count = reviews.filter(r => r.rating === s).length;
      const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
      const bar = document.getElementById('bar-' + s);
      const n   = document.getElementById('n-' + s);
      if (bar) bar.style.width = pct + '%';
      if (n)   n.textContent   = count;
    }
  }

  /* ── Liste rendern ────────────────────────────────── */
  function renderList(reviews) {
    const list = document.getElementById('reviews-list');
    const loadMoreBtn = document.getElementById('rv-load-more');
    if (!list) return;

    if (!reviews.length) {
      list.innerHTML = `
        <div class="review-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Noch keine Bewertungen — sei der Erste!
        </div>`;
      return;
    }

    const visible = reviews.slice(0, visibleCount);
    list.innerHTML = visible.map(r => reviewCard(r)).join('');

    // Load More Button
    let btn = document.getElementById('rv-load-more');
    if (reviews.length > visibleCount) {
      if (!btn) {
        btn = document.createElement('button');
        btn.id = 'rv-load-more';
        btn.className = 'reviews-load-more';
        btn.textContent = `Alle ${reviews.length} Bewertungen anzeigen`;
        btn.onclick = () => {
          visibleCount = reviews.length;
          renderList(allReviews);
        };
        list.parentElement.appendChild(btn);
      }
    } else if (btn) {
      btn.remove();
    }
  }

  function reviewCard(r) {
    const name     = escHtml(r.reviewer_name || 'Anonym');
    const initials = name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
    const stars    = starsToString(r.rating);
    const date     = new Date(r.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const comment  = r.comment ? `<div class="review-text">${escHtml(r.comment)}</div>` : '';

    return `
      <div class="review-item">
        <div class="review-top">
          <div class="review-author">
            <div class="review-av">${initials}</div>
            <div>
              <div class="review-name">${name}</div>
              <div class="review-date">${date}</div>
            </div>
          </div>
          <div class="review-stars">${stars}</div>
        </div>
        ${comment}
      </div>`;
  }

  /* ── Sterne-Picker ────────────────────────────────── */
  window.setStars = function (val) {
    selectedStars = val;
    document.querySelectorAll('#star-picker button').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.getAttribute('data-val')) <= val);
    });
    const err = document.getElementById('star-error');
    if (err) err.style.display = 'none';
  };

  /* ── Form togglen ─────────────────────────────────── */
  window.toggleReviewForm = function () {
    const wrap = document.getElementById('review-form-wrap');
    const btn  = document.getElementById('write-review-btn');
    if (!wrap) return;
    const isOpen = wrap.classList.toggle('open');
    if (btn) btn.style.display = isOpen ? 'none' : 'flex';
    if (isOpen) wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    // Reset
    selectedStars = 0;
    document.querySelectorAll('#star-picker button').forEach(b => b.classList.remove('active'));
    const success = document.getElementById('rf-success');
    if (success) success.style.display = 'none';
  };

  /* ── Bewertung absenden ───────────────────────────── */
  window.submitReview = async function () {
    // Validierung
    const starErr = document.getElementById('star-error');
    if (!selectedStars) {
      if (starErr) starErr.style.display = 'block';
      return;
    }

    const name    = (document.getElementById('rv-name')?.value || '').trim() || 'Anonym';
    const comment = (document.getElementById('rv-text')?.value || '').trim();
    const btn     = document.getElementById('rf-submit');
    const success = document.getElementById('rf-success');

    if (!currentSellerId) {
      alert('Verkäufer konnte nicht identifiziert werden.');
      return;
    }

    if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Wird gespeichert…'; }

    try {
      const { error } = await supabaseClient
        .from('reviews')
        .insert([{
          seller_id:     currentSellerId,
          listing_id:    currentListingId || null,
          reviewer_name: name,
          rating:        selectedStars,
          comment:       comment || null
        }]);

      if (error) {
        console.error('REVIEW INSERT ERROR:', error);
        alert('Fehler beim Speichern. Bitte erneut versuchen.');
        if (btn) { btn.disabled = false; btn.innerHTML = '✓ Bewertung absenden'; }
        return;
      }

      // Optimistisch hinzufügen
      allReviews.unshift({
        id:            'tmp-' + Date.now(),
        seller_id:     currentSellerId,
        listing_id:    currentListingId,
        reviewer_name: name,
        rating:        selectedStars,
        comment:       comment || null,
        created_at:    new Date().toISOString()
      });

      renderSummary(allReviews);
      renderList(allReviews);

      // Erfolg zeigen
      if (success) success.style.display = 'block';
      if (btn)     { btn.disabled = false; btn.innerHTML = '✓ Gespeichert'; btn.style.background = 'linear-gradient(135deg,#059669,#0ea371)'; }

      // Formular nach 2 Sek schließen
      setTimeout(() => {
        const wrap = document.getElementById('review-form-wrap');
        const writeBtn = document.getElementById('write-review-btn');
        if (wrap) wrap.classList.remove('open');
        if (writeBtn) writeBtn.style.display = 'flex';
        // Form zurücksetzen
        const nameEl = document.getElementById('rv-name');
        const textEl = document.getElementById('rv-text');
        if (nameEl) nameEl.value = '';
        if (textEl) textEl.value = '';
        selectedStars = 0;
        document.querySelectorAll('#star-picker button').forEach(b => b.classList.remove('active'));
        if (btn) { btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Bewertung absenden'; btn.style.background = ''; }
        if (success) success.style.display = 'none';
      }, 2000);

    } catch (err) {
      console.error('submitReview error:', err);
      if (btn) { btn.disabled = false; btn.innerHTML = 'Bewertung absenden'; }
    }
  };

  /* ── Hilfsfunktionen ──────────────────────────────── */
  function starsToString(avg) {
    const full  = Math.floor(avg);
    const half  = (avg - full) >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
  }

  function escHtml(val) {
    return String(val)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

})();
