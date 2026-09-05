/* ══════════════════════════════════════════════════════════════
   1A Motor — Batterien-Marktplatz
   Lädt Inserate aus Supabase (Tabelle: battery_listings).
   Ist keine Verbindung vorhanden, werden Beispiel-Inserate gezeigt.
   ══════════════════════════════════════════════════════════════ */

var BAT_TABLE = 'battery_listings';

/* ── Beispieldaten (Fallback) ────────────────────────────────── */
var BAT_DEMO = [
  { id: 'b-1041', title: 'Varta Silver Dynamic AGM 95Ah 850A — Start-Stop',
    category: 'Starterbatterien (Auto/LKW)', condition: 'Neu', chemistry: 'AGM',
    voltage: 12, capacity_ah: 95, cca: 850, soh: 100, brand: 'Varta',
    price: 189, city: 'Gärtringen', zip: '71116', seller: 'AkkuTechnik Süd GmbH',
    seller_type: 'Händler', rating: 4.9, shipping: 'Versand 6,90 € · Abholung möglich',
    icon: '🔋', created_at: '2026-09-02' },

  { id: 'b-1038', title: 'BMW i3 Hochvoltmodul 60Ah — 8 Module verfügbar',
    category: 'EV-Traktionsbatterien & Module', condition: 'Gebraucht', chemistry: 'NMC',
    voltage: 44.4, capacity_kwh: 2.6, soh: 88, brand: 'Samsung SDI',
    price: 640, city: 'Leipzig', zip: '04103', seller: 'E-Mobility Parts Leipzig',
    seller_type: 'Händler', rating: 4.7, shipping: 'Gefahrgut-Spedition UN3480',
    icon: '⚡', created_at: '2026-09-01' },

  { id: 'b-1036', title: 'Pylontech US3000C 3,5 kWh Hausspeicher-Modul',
    category: 'Hausspeicher / Solarspeicher', condition: 'Neu', chemistry: 'LiFePO4',
    voltage: 48, capacity_kwh: 3.55, soh: 100, brand: 'Pylontech',
    price: 1090, city: 'Hamburg', zip: '20095', seller: 'Solarspeicher Nord',
    seller_type: 'Händler', rating: 4.8, shipping: 'Spedition frei Haus',
    icon: '🔋', created_at: '2026-09-01' },

  { id: 'b-1033', title: 'Hoppecke Traktionsbatterie 48V 625Ah — Linde H25',
    category: 'Gabelstapler & Flurförderzeuge', condition: 'Generalüberholt', chemistry: 'Blei-Säure',
    voltage: 48, capacity_ah: 625, soh: 91, brand: 'Hoppecke',
    price: 3450, city: 'Duisburg', zip: '47051', seller: 'Staplerservice Rhein-Ruhr',
    seller_type: 'Händler', rating: 4.6, shipping: 'Abholung / Spedition auf Anfrage',
    icon: '🔧', created_at: '2026-08-31' },

  { id: 'b-1031', title: 'Exide Endurance USV-Batteriesatz 12V 100Ah (4 Stk.)',
    category: 'Industrie- & USV-Batterien', condition: 'Neu', chemistry: 'AGM',
    voltage: 12, capacity_ah: 100, soh: 100, brand: 'Exide',
    price: 720, city: 'Nürnberg', zip: '90402', seller: 'Industrie-Energie Franken',
    seller_type: 'Händler', rating: 4.9, shipping: 'Palettenversand 49 €',
    icon: '🏭', created_at: '2026-08-30' },

  { id: 'b-1029', title: 'Victron LiFePO4 12,8V 200Ah Smart — Bordbatterie',
    category: 'Marine / Bootsbatterien', condition: 'Neu', chemistry: 'LiFePO4',
    voltage: 12.8, capacity_ah: 200, soh: 100, brand: 'Victron',
    price: 1749, city: 'Kiel', zip: '24103', seller: 'Marine Power Kiel',
    seller_type: 'Händler', rating: 5.0, shipping: 'Versand 14,90 €',
    icon: '⛵', created_at: '2026-08-30' },

  { id: 'b-1027', title: 'Bosch S4 60Ah 540A — 14 Monate gelaufen, geprüft',
    category: 'Starterbatterien (Auto/LKW)', condition: 'Gebraucht', chemistry: 'EFB / Gel',
    voltage: 12, capacity_ah: 60, cca: 540, soh: 84, brand: 'Bosch',
    price: 45, city: 'Dortmund', zip: '44135', seller: 'M. Kaufmann',
    seller_type: 'Privat', rating: 4.4, shipping: 'Nur Abholung',
    icon: '🔋', created_at: '2026-08-29' },

  { id: 'b-1025', title: 'Banner Buffalo Bull 225Ah 1150A — LKW Starterbatterie',
    category: 'Starterbatterien (Auto/LKW)', condition: 'Neu', chemistry: 'Blei-Säure',
    voltage: 12, capacity_ah: 225, cca: 1150, soh: 100, brand: 'Banner',
    price: 329, city: 'Ulm', zip: '89073', seller: 'Nutzfahrzeug-Technik Ulm',
    seller_type: 'Händler', rating: 4.7, shipping: 'Versand 19,90 € · Abholung möglich',
    icon: '🚚', created_at: '2026-08-28' },

  { id: 'b-1022', title: 'CATL LFP Zellen 3,2V 302Ah — Grade A, 16 Stück',
    category: 'Batteriezellen (Lithium)', condition: 'Neu', chemistry: 'LiFePO4',
    voltage: 3.2, capacity_ah: 302, soh: 100, brand: 'CATL',
    price: 1520, city: 'Bremen', zip: '28195', seller: 'Cell Supply Bremen',
    seller_type: 'Händler', rating: 4.5, shipping: 'Gefahrgut UN3480 · 39 €',
    icon: '🧪', created_at: '2026-08-28' },

  { id: 'b-1020', title: 'BYD Battery-Box Premium HVS 7,7 kWh — Vorführgerät',
    category: 'Hausspeicher / Solarspeicher', condition: 'Generalüberholt', chemistry: 'LiFePO4',
    voltage: 204, capacity_kwh: 7.68, soh: 96, brand: 'BYD',
    price: 2890, city: 'Stuttgart', zip: '70173', seller: 'PV Speicher Zentrum',
    seller_type: 'Händler', rating: 4.8, shipping: 'Spedition 89 € · Montage möglich',
    icon: '🏠', created_at: '2026-08-27' },

  { id: 'b-1017', title: 'Tesla Model S Modul 5,3 kWh 22,8V — Bastlerpreis',
    category: 'Defekte Akkus / Recycling', condition: 'Defekt / Recycling', chemistry: 'NMC',
    voltage: 22.8, capacity_kwh: 5.3, soh: 61, brand: 'Samsung SDI',
    price: 380, city: 'Kassel', zip: '34117', seller: 'Akku Recycling Mitte',
    seller_type: 'Händler', rating: 4.2, shipping: 'Nur Abholung · beschädigt',
    icon: '♻️', created_at: '2026-08-26' },

  { id: 'b-1015', title: 'Victron IP22 Ladegerät 12V 30A + BMS 4S 200A',
    category: 'Ladegeräte & BMS', condition: 'Neu', chemistry: 'LiFePO4',
    voltage: 12, capacity_ah: 0, soh: 100, brand: 'Victron',
    price: 268, city: 'Münster', zip: '48143', seller: 'Energiesysteme Westfalen',
    seller_type: 'Händler', rating: 4.9, shipping: 'Versand 5,90 €',
    icon: '🔌', created_at: '2026-08-25' }
];

/* ── State ───────────────────────────────────────────────────── */
var batAll = [];
var batSort = 'latest';
var batQuickChip = '';
var batSearch = '';

/* ── Helfer ──────────────────────────────────────────────────── */
function batPrice(n) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}
function batEsc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function batCondClass(c) {
  if (c === 'Neu') return 'cond-neu';
  if (c === 'Generalüberholt') return 'cond-reman';
  if (c === 'Defekt / Recycling') return 'cond-defekt';
  return '';
}
function batCapText(l) {
  if (l.capacity_kwh) return String(l.capacity_kwh).replace('.', ',') + ' kWh';
  if (l.capacity_ah) return l.capacity_ah + ' Ah';
  return '—';
}
function batVoltText(l) {
  return String(l.voltage).replace('.', ',') + ' V';
}
function batSohClass(v) {
  if (v >= 90) return '';
  if (v >= 75) return 'mid';
  return 'low';
}

/* ── Karte rendern ───────────────────────────────────────────── */
function batCard(l) {
  var h = '';
  h += '<a class="listing-card" href="anzeige.html?id=' + batEsc(l.id) + '">';
  h += '<div class="listing-image">';
  h += '<span class="badge ' + batCondClass(l.condition) + '">' + batEsc(l.condition) + '</span>';
  h += '<div class="fav">♡</div>';
  h += '<span class="chem-tag">' + batEsc(l.chemistry) + '</span>';
  h += batEsc(l.icon || '🔋');
  h += '</div>';
  h += '<div class="listing-body">';
  h += '<div class="listing-title">' + batEsc(l.title) + '</div>';
  h += '<div class="bat-specs">';
  h += '<div class="bat-spec"><span>Spannung</span><span>' + batVoltText(l) + '</span></div>';
  h += '<div class="bat-spec"><span>Kapazität</span><span>' + batCapText(l) + '</span></div>';
  h += '<div class="bat-spec"><span>' + (l.cca ? 'Kaltstart' : 'Marke') + '</span><span>' + (l.cca ? l.cca + ' A' : batEsc(l.brand)) + '</span></div>';
  h += '<div class="bat-spec"><span>Standort</span><span>' + batEsc(l.zip ? l.zip.slice(0, 2) + 'xxx ' + l.city : l.city) + '</span></div>';
  h += '</div>';
  if (typeof l.soh === 'number' && l.condition !== 'Neu') {
    h += '<div class="soh-wrap">';
    h += '<div class="soh-head"><span>Restkapazität (SOH)</span><b>' + l.soh + ' %</b></div>';
    h += '<div class="soh-bar"><div class="soh-fill ' + batSohClass(l.soh) + '" style="width:' + l.soh + '%"></div></div>';
    h += '</div>';
  }
  h += '<div class="price">' + batPrice(l.price) + '</div>';
  h += '<div class="shipping">' + batEsc(l.shipping) + '</div>';
  h += '<div class="seller"><span>' + batEsc(l.seller) + '</span><span class="rating">★ ' + String(l.rating).replace('.', ',') + '</span></div>';
  h += '</div></a>';
  return h;
}

/* ── Filter lesen & anwenden ─────────────────────────────────── */
function batChecked(cls) {
  var out = [];
  document.querySelectorAll('.' + cls + ':checked').forEach(function (el) { out.push(el.value); });
  return out;
}
function batNum(id) {
  var el = document.getElementById(id);
  if (!el || el.value === '') return null;
  var v = parseFloat(String(el.value).replace(',', '.'));
  return isNaN(v) ? null : v;
}

function batFilter(list) {
  var cats = batChecked('f-cat');
  var chems = batChecked('f-chem');
  var conds = batChecked('f-cond');
  var voltsSel = batChecked('f-volt');
  var brandsSel = batChecked('f-brand');
  var sellerEl = document.querySelector('.f-seller:checked');
  var seller = sellerEl ? sellerEl.value : '';
  var sohMin = batNum('f-soh') || 0;
  var pMin = batNum('f-price-min'), pMax = batNum('f-price-max');
  var capMin = batNum('f-cap-min'), capMax = batNum('f-cap-max');
  var kwhMin = batNum('f-kwh-min'), kwhMax = batNum('f-kwh-max');
  var ccaMin = batNum('f-cca-min'), ccaMax = batNum('f-cca-max');
  var zipEl = document.getElementById('f-zip');
  var zip = zipEl ? zipEl.value.trim().toLowerCase() : '';

  return list.filter(function (l) {
    if (cats.length && cats.indexOf(l.category) === -1) return false;
    if (chems.length && chems.indexOf(l.chemistry) === -1) return false;
    if (conds.length && conds.indexOf(l.condition) === -1) return false;
    if (brandsSel.length && brandsSel.indexOf(l.brand) === -1) return false;
    if (seller && l.seller_type !== seller) return false;
    if (voltsSel.length) {
      var band = l.voltage >= 300 ? '400 V+' : (l.voltage >= 40 ? '48 V' : (l.voltage >= 20 ? '24 V' : (l.voltage >= 10 ? '12 V' : '6 V')));
      if (voltsSel.indexOf(band) === -1) return false;
    }
    if (typeof l.soh === 'number' && l.soh < sohMin) return false;
    if (pMin !== null && l.price < pMin) return false;
    if (pMax !== null && l.price > pMax) return false;
    if (capMin !== null && !(l.capacity_ah >= capMin)) return false;
    if (capMax !== null && !(l.capacity_ah <= capMax && l.capacity_ah)) return false;
    if (kwhMin !== null && !(l.capacity_kwh >= kwhMin)) return false;
    if (kwhMax !== null && !(l.capacity_kwh <= kwhMax && l.capacity_kwh)) return false;
    if (ccaMin !== null && !(l.cca >= ccaMin)) return false;
    if (ccaMax !== null && !(l.cca <= ccaMax && l.cca)) return false;
    if (zip && String(l.zip || '').indexOf(zip) !== 0 && String(l.city || '').toLowerCase().indexOf(zip) === -1) return false;

    if (batQuickChip) {
      var q = batQuickChip;
      var hit = (l.condition === q) || (l.chemistry === q) || (l.category === q) ||
                (q === '12 V' && l.voltage >= 10 && l.voltage < 20);
      if (!hit) return false;
    }
    if (batSearch) {
      var hay = (l.title + ' ' + l.brand + ' ' + l.category + ' ' + l.chemistry + ' ' + l.seller).toLowerCase();
      if (hay.indexOf(batSearch) === -1) return false;
    }
    return true;
  });
}

function batSorted(list) {
  var out = list.slice();
  if (batSort === 'price_asc') out.sort(function (a, b) { return a.price - b.price; });
  else if (batSort === 'price_desc') out.sort(function (a, b) { return b.price - a.price; });
  else if (batSort === 'soh_desc') out.sort(function (a, b) { return (b.soh || 0) - (a.soh || 0); });
  else out.sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); });
  return out;
}

function batRender() {
  var grid = document.getElementById('bat-listing-grid');
  var info = document.getElementById('bat-results-info');
  if (!grid) return;
  var list = batSorted(batFilter(batAll));
  if (!list.length) {
    grid.innerHTML = '<div class="empty-box">Keine Batterie-Angebote für diese Filter. Filter zurücksetzen oder Suchbegriff ändern.</div>';
  } else {
    grid.innerHTML = list.map(batCard).join('');
  }
  if (info) {
    info.textContent = list.length + ' von ' + batAll.length + ' Angeboten · Preise inkl. MwSt., zzgl. Versand';
  }
}

function applyFilters() {
  batRender();
  if (window.innerWidth <= 1100) closeSidebar();
  var target = document.getElementById('angebote');
  if (target) window.scrollTo({ top: target.offsetTop - 90, behavior: 'smooth' });
}

/* ── Sidebar / UI ────────────────────────────────────────────── */
function sidebarToggle(el) {
  el.classList.toggle('collapsed');
  var body = el.nextElementSibling;
  if (body) body.classList.toggle('hidden');
}
function sidebarReset() {
  document.querySelectorAll('.sidebar input[type="checkbox"]').forEach(function (c) { c.checked = false; });
  var all = document.querySelector('.f-seller[value=""]');
  if (all) all.checked = true;
  document.querySelectorAll('.sidebar input[type="number"], .sidebar input[type="text"]').forEach(function (i) { i.value = ''; });
  var soh = document.getElementById('f-soh');
  if (soh) { soh.value = 0; document.getElementById('f-soh-val').textContent = '0 %'; }
  var rad = document.getElementById('f-radius');
  if (rad) rad.value = '0';
  batQuickChip = '';
  batSearch = '';
  var si = document.getElementById('bat-search-input');
  if (si) si.value = '';
  document.querySelectorAll('#quick-chips .chip').forEach(function (c) { c.classList.toggle('active', c.dataset.chip === ''); });
  document.querySelectorAll('#bat-category-links a').forEach(function (a) { a.classList.toggle('active', a.dataset.catlink === ''); });
  batRender();
}
function sidebarSearchCat(q) {
  q = (q || '').toLowerCase();
  document.querySelectorAll('#sidebar-category-list label').forEach(function (l) {
    l.style.display = l.textContent.toLowerCase().indexOf(q) === -1 ? 'none' : '';
  });
}
function sidebarSearchBrand(q) {
  q = (q || '').toLowerCase();
  document.querySelectorAll('#sidebar-brand-list label').forEach(function (l) {
    l.style.display = l.textContent.toLowerCase().indexOf(q) === -1 ? 'none' : '';
  });
}
function toggleSidebar() {
  var sb = document.getElementById('sidebar');
  var ov = document.getElementById('sidebar-overlay');
  var btn = document.getElementById('mob-filter-btn');
  if (!sb) return;
  var open = sb.classList.toggle('open');
  if (ov) ov.classList.toggle('open', open);
  if (btn) btn.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
}
function closeSidebar() {
  var sb = document.getElementById('sidebar');
  var ov = document.getElementById('sidebar-overlay');
  var btn = document.getElementById('mob-filter-btn');
  if (sb) sb.classList.remove('open');
  if (ov) ov.classList.remove('open');
  if (btn) btn.classList.remove('open');
  document.body.style.overflow = '';
}

/* ── Supabase-Anbindung ──────────────────────────────────────── */
async function batLoad() {
  batAll = BAT_DEMO.slice();
  batRender();
  if (typeof supabaseClient === 'undefined' || !supabaseClient) return;
  try {
    var res = await supabaseClient
      .from(BAT_TABLE)
      .select('id,title,category,condition,chemistry,voltage,capacity_ah,capacity_kwh,cca,soh,brand,price,city,zip,seller,seller_type,rating,shipping,icon,created_at,status')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(60);
    if (res.error) throw res.error;
    if (res.data && res.data.length) {
      batAll = res.data;
      var sl = document.getElementById('stat-listings');
      if (sl) sl.textContent = new Intl.NumberFormat('de-DE').format(res.data.length);
      batRender();
    }
  } catch (err) {
    console.info('[batterien] Supabase nicht verfügbar – Beispieldaten aktiv.', err && err.message);
  }
}

/* ── Init ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {

  // Kategorien in die Kopf-Suche spiegeln
  var sel = document.getElementById('bat-category-select');
  if (sel) {
    document.querySelectorAll('.f-cat').forEach(function (c) {
      var o = document.createElement('option');
      o.value = c.value; o.textContent = c.value;
      sel.appendChild(o);
    });
    sel.addEventListener('change', function () {
      document.querySelectorAll('.f-cat').forEach(function (c) { c.checked = (c.value === sel.value); });
      batRender();
    });
  }

  // Filter live
  document.querySelectorAll('.sidebar input[type="checkbox"], .f-seller').forEach(function (c) {
    c.addEventListener('change', batRender);
  });
  document.querySelectorAll('.sidebar input[type="number"]').forEach(function (i) {
    i.addEventListener('input', batRender);
  });
  var soh = document.getElementById('f-soh');
  if (soh) soh.addEventListener('input', function () {
    document.getElementById('f-soh-val').textContent = soh.value + ' %';
    batRender();
  });
  var zip = document.getElementById('f-zip');
  if (zip) zip.addEventListener('input', batRender);

  // Sortierung
  var sort = document.getElementById('bat-sort-select');
  if (sort) sort.addEventListener('change', function () { batSort = sort.value; batRender(); });

  // Schnellfilter-Chips
  document.querySelectorAll('#quick-chips .chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      batQuickChip = chip.dataset.chip === batQuickChip ? '' : chip.dataset.chip;
      document.querySelectorAll('#quick-chips .chip').forEach(function (c) {
        c.classList.toggle('active', c.dataset.chip === batQuickChip);
      });
      batRender();
    });
  });

  // Kategorie-Leiste
  document.querySelectorAll('#bat-category-links a').forEach(function (a) {
    a.addEventListener('click', function () {
      document.querySelectorAll('#bat-category-links a').forEach(function (x) { x.classList.remove('active'); });
      a.classList.add('active');
      var v = a.dataset.catlink || '';
      document.querySelectorAll('.f-cat').forEach(function (c) { c.checked = (v !== '' && c.value === v); });
      batRender();
    });
  });

  // Suche
  var si = document.getElementById('bat-search-input');
  var sb = document.getElementById('bat-search-btn');
  function runSearch() { batSearch = (si ? si.value : '').trim().toLowerCase(); batRender(); }
  if (sb) sb.addEventListener('click', runSearch);
  if (si) si.addEventListener('keydown', function (e) { if (e.key === 'Enter') runSearch(); });
  if (si) si.addEventListener('input', function () { if (si.value === '') { batSearch = ''; batRender(); } });

  // FAQ-Akkordeon
  document.querySelectorAll('.faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.faq-item');
      var open = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(function (i) {
        i.classList.remove('open');
        var b = i.querySelector('.faq-q');
        if (b) b.setAttribute('aria-expanded', 'false');
      });
      if (!open) { item.classList.add('open'); q.setAttribute('aria-expanded', 'true'); }
    });
  });

  // Mobile Nav
  var mt = document.getElementById('mob-toggle');
  if (mt) mt.addEventListener('click', function () {
    var n = document.getElementById('mob-nav');
    if (n) n.classList.toggle('open');
  });

  // Favoriten-Herz
  document.addEventListener('click', function (e) {
    var f = e.target.closest ? e.target.closest('.fav') : null;
    if (!f) return;
    e.preventDefault();
    var on = f.textContent.trim() === '♥';
    f.textContent = on ? '♡' : '♥';
    f.style.color = on ? '' : '#ef4444';
  });

  // URL-Kategorie (?category=…)
  var param = new URLSearchParams(location.search).get('category');
  if (param) {
    document.querySelectorAll('.f-cat').forEach(function (c) {
      if (c.value.toLowerCase().indexOf(param.toLowerCase()) !== -1) c.checked = true;
    });
  }

  batLoad();
});
