/* ==========================================================
   BRIT.TUNA  FEATURES  (batch 1)
   - Search suggestions
   - Recently viewed
   - Quick view popup
   - Sticky Add to Cart bar (product page, phones)
   - Share product
   - Back to top
   This file only ADDS things. It does not change your existing
   code. It uses BTProducts, BTCart and BTUtil when they exist.
========================================================== */
(function () {
  'use strict';

  var P = window.BTProducts;
  var U = window.BTUtil || {
    escapeHtml: function (s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    },
    formatINR: function (n) { return '₹' + Number(n || 0); }
  };
  var esc = U.escapeHtml;
  var RECENT_KEY = 'bt_recent_v1';

  /* ---------- tiny helpers ---------- */

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function store(get, key, value) {
    try {
      if (get) return JSON.parse(localStorage.getItem(key) || 'null');
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { /* storage blocked: ignore */ }
    return null;
  }

  var toastTimer = null;
  function toast(message) {
    var t = $('#ft-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'ft-toast';
      t.setAttribute('role', 'status');
      t.setAttribute('aria-live', 'polite');
      document.body.appendChild(t);
    }
    t.textContent = message;
    t.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-show'); }, 2400);
  }

  function priceOf(p, pack) {
    var base = pack ? Number(pack.price) : P.fromPrice(p);
    return P.salePrice ? P.salePrice(base, p.discount) : base;
  }

  function fromPriceOf(p) {
    var packs = (P.availablePacks ? P.availablePacks(p) : p.packs) || [];
    if (!packs.length) packs = p.packs || [];
    var best = null;
    packs.forEach(function (k) {
      var v = priceOf(p, k);
      if (best === null || v < best) best = v;
    });
    return best === null ? 0 : best;
  }

  function loadProducts() {
    if (!P || !P.load) return Promise.resolve([]);
    return Promise.resolve(P.load()).then(function () { return P.getAll(); }, function () { return P.getAll ? P.getAll() : []; });
  }

  /* ==========================================================
     1. SEARCH SUGGESTIONS
  ========================================================== */

  var SEARCH_SEL = '#header-search, #drawer-search-input, .search-pill input[type="search"]';
  var box = null, boxInput = null, boxItems = [], boxIndex = -1;

  function closeBox() {
    if (box) { box.hidden = true; box.innerHTML = ''; }
    boxItems = []; boxIndex = -1; boxInput = null;
  }

  function placeBox(input) {
    var r = input.getBoundingClientRect();
    var width = Math.max(r.width, 300);
    var left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
    box.style.left = left + 'px';
    box.style.top = (r.bottom + 6) + 'px';
    box.style.width = width + 'px';
  }

  function renderBox(input, query) {
    var q = query.trim().toLowerCase();
    if (q.length < 2) { closeBox(); return; }

    loadProducts().then(function (all) {
      if (input.value.trim().toLowerCase() !== q) return;

      var hits = all.filter(function (p) {
        var hay = (p.name + ' ' + (p.category || '') + ' ' + (p.description || '')).toLowerCase();
        return hay.indexOf(q) !== -1;
      }).sort(function (a, b) {
        var an = a.name.toLowerCase().indexOf(q) === 0 ? 0 : 1;
        var bn = b.name.toLowerCase().indexOf(q) === 0 ? 0 : 1;
        return an - bn;
      }).slice(0, 6);

      if (!box) {
        box = document.createElement('div');
        box.id = 'ft-suggest';
        box.setAttribute('role', 'listbox');
        box.addEventListener('mousedown', function (e) { e.preventDefault(); });
        document.body.appendChild(box);
      }

      var html = '';
      hits.forEach(function (p, i) {
        html += '<a class="ft-sg-item" role="option" id="ft-sg-' + i + '" href="' + P.productUrl(p) + '">' +
          '<img src="' + esc(P.imageFor(p)) + '" data-pid="' + esc(p.id) + '" alt="" width="44" height="44" loading="lazy">' +
          '<span class="ft-sg-text"><strong>' + esc(p.name) + '</strong>' +
          '<small>' + esc((P.getCategory && P.getCategory(p.category) && P.getCategory(p.category).label) || p.category || '') + '</small></span>' +
          '<span class="ft-sg-price">' + esc(U.formatINR(fromPriceOf(p))) + '</span></a>';
      });
      if (!hits.length) html += '<div class="ft-sg-empty">No product found for “' + esc(query.trim()) + '”</div>';
      html += '<a class="ft-sg-all" role="option" href="shop.html?q=' + encodeURIComponent(query.trim()) + '">See all results for “' + esc(query.trim()) + '”</a>';

      box.innerHTML = html;
      boxItems = $$('.ft-sg-item, .ft-sg-all', box);
      boxIndex = -1;
      boxInput = input;
      placeBox(input);
      box.hidden = false;
    });
  }

  var searchTimer = null;
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (!t.matches || !t.matches(SEARCH_SEL)) return;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () { renderBox(t, t.value); }, 150);
  });

  document.addEventListener('keydown', function (e) {
    if (!box || box.hidden || e.target !== boxInput) return;
    if (e.key === 'Escape') { closeBox(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      boxIndex += e.key === 'ArrowDown' ? 1 : -1;
      if (boxIndex < 0) boxIndex = boxItems.length - 1;
      if (boxIndex >= boxItems.length) boxIndex = 0;
      boxItems.forEach(function (el, i) { el.classList.toggle('is-on', i === boxIndex); });
    } else if (e.key === 'Enter' && boxIndex >= 0) {
      e.preventDefault();
      window.location.href = boxItems[boxIndex].getAttribute('href');
    }
  });

  document.addEventListener('click', function (e) {
    if (box && !box.hidden && !(e.target.closest && (e.target.closest('#ft-suggest') || e.target.matches(SEARCH_SEL)))) closeBox();
  });
  window.addEventListener('resize', function () { if (box && !box.hidden && boxInput) placeBox(boxInput); });
  window.addEventListener('scroll', function () { if (box && !box.hidden) closeBox(); }, { passive: true });

  /* ==========================================================
     2. RECENTLY VIEWED
  ========================================================== */

  function recentIds() {
    var v = store(true, RECENT_KEY);
    return Array.isArray(v) ? v : [];
  }

  function currentDetailsProduct(all) {
    if (!/product-details/.test(location.pathname)) return null;
    var params = new URLSearchParams(location.search);
    var id = params.get('id');
    var slug = params.get('slug');
    var found = null;
    all.forEach(function (p) {
      if (id && String(p.id) === String(id)) found = p;
      else if (!id && slug && p.slug === slug) found = p;
    });
    return found;
  }

  function mountRecent(all) {
    var current = currentDetailsProduct(all);

    if (current) {
      var ids = recentIds().filter(function (x) { return String(x) !== String(current.id); });
      ids.unshift(String(current.id));
      store(false, RECENT_KEY, ids.slice(0, 12));
    }

    var show = recentIds().filter(function (id) { return !current || String(id) !== String(current.id); });
    var items = show.map(function (id) {
      return all.filter(function (p) { return String(p.id) === String(id); })[0];
    }).filter(Boolean).slice(0, 10);

    var old = $('#ft-recent');
    if (old) old.remove();
    if (!items.length) return;
    var onHome = /(^|\/)(index\.html)?$/.test(location.pathname);
    if (!onHome && !/product-details/.test(location.pathname)) return;

    var anchor = $('#site-footer');
    if (!anchor) return;

    var sec = document.createElement('section');
    sec.id = 'ft-recent';
    sec.className = 'ft-recent';
    sec.innerHTML = '<div class="container"><h2 class="ft-recent-title">Recently viewed</h2><div class="ft-recent-row">' +
      items.map(function (p) {
        return '<a class="ft-rv-card" href="' + P.productUrl(p) + '">' +
          '<img src="' + esc(P.imageFor(p)) + '" data-pid="' + esc(p.id) + '" alt="' + esc(p.name) + '" width="160" height="120" loading="lazy">' +
          '<span class="ft-rv-name">' + esc(p.name) + '</span>' +
          '<span class="ft-rv-price">From ' + esc(U.formatINR(fromPriceOf(p))) + '</span></a>';
      }).join('') + '</div></div>';
    anchor.parentNode.insertBefore(sec, anchor);
  }

  /* ==========================================================
     3. QUICK VIEW POPUP
  ========================================================== */

  var qv = null, qvState = null, lastFocus = null;

  function qvClose() {
    if (!qv) return;
    qv.hidden = true;
    document.documentElement.classList.remove('ft-lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function qvRender() {
    var s = qvState, p = s.product;
    var packs = p.packs || [];
    var pack = packs.filter(function (k) { return String(k.id) === String(s.packId); })[0];
    var inStock = pack && P.packHasStock(pack);
    var price = priceOf(p, pack);

    qv.querySelector('.ft-qv-body').innerHTML =
      '<div class="ft-qv-img"><img src="' + esc(P.imageFor(p)) + '" data-pid="' + esc(p.id) + '" alt="' + esc(p.name) + '"></div>' +
      '<div class="ft-qv-info">' +
        '<h3 id="ft-qv-title">' + esc(p.name) + '</h3>' +
        '<p class="ft-qv-price">' + esc(U.formatINR(price)) + '</p>' +
        '<div class="ft-qv-label">Pack size</div>' +
        '<div class="ft-qv-packs">' + packs.map(function (k) {
          var ok = P.packHasStock(k);
          return '<button type="button" class="ft-pack' + (String(k.id) === String(s.packId) ? ' is-on' : '') + '"' +
            (ok ? '' : ' disabled') + ' data-pack="' + esc(k.id) + '">' + esc(k.label) + (ok ? '' : ' · Out') + '</button>';
        }).join('') + '</div>' +
        '<div class="ft-qv-label">Quantity</div>' +
        '<div class="ft-qty"><button type="button" data-q="-1" aria-label="Less">−</button><span>' + s.qty +
        '</span><button type="button" data-q="1" aria-label="More">+</button></div>' +
        '<div class="ft-qv-actions">' +
          '<button type="button" class="btn btn-primary ft-qv-add"' + (inStock ? '' : ' disabled') + '>' + (inStock ? 'Add to Cart' : 'Out of stock') + '</button>' +
          '<a class="btn btn-outline" href="' + P.productUrl(p) + '">View full details</a>' +
        '</div>' +
      '</div>';
  }

  function qvOpen(product, trigger) {
    if (!qv) {
      qv = document.createElement('div');
      qv.id = 'ft-qv';
      qv.hidden = true;
      qv.innerHTML = '<div class="ft-qv-backdrop"></div>' +
        '<div class="ft-qv-dialog" role="dialog" aria-modal="true" aria-labelledby="ft-qv-title">' +
        '<button type="button" class="ft-qv-close" aria-label="Close">×</button><div class="ft-qv-body"></div></div>';
      document.body.appendChild(qv);

      qv.addEventListener('click', function (e) {
        var t = e.target;
        if (t.classList.contains('ft-qv-backdrop') || t.classList.contains('ft-qv-close')) { qvClose(); return; }
        var pk = t.closest('.ft-pack');
        if (pk && !pk.disabled) { qvState.packId = pk.getAttribute('data-pack'); qvRender(); return; }
        var q = t.closest('[data-q]');
        if (q) {
          qvState.qty = Math.min(20, Math.max(1, qvState.qty + Number(q.getAttribute('data-q'))));
          qvRender(); return;
        }
        if (t.closest('.ft-qv-add')) {
          if (!window.BTCart || !window.BTCart.add) { toast('Cart is not ready yet'); return; }
          Promise.resolve(window.BTCart.add(qvState.product.id, qvState.packId, qvState.qty)).then(function (ok) {
            if (ok !== false) { toast('Added to cart'); qvClose(); }
          });
        }
      });
      document.addEventListener('keydown', function (e) {
        if (qv && !qv.hidden && e.key === 'Escape') qvClose();
      });
    }

    var first = P.firstAvailablePack ? P.firstAvailablePack(product) : (product.packs || [])[0];
    qvState = { product: product, packId: first ? first.id : (product.packs[0] && product.packs[0].id), qty: 1 };
    lastFocus = trigger || null;
    qvRender();
    qv.hidden = false;
    document.documentElement.classList.add('ft-lock');
    var c = qv.querySelector('.ft-qv-close'); if (c) c.focus();
  }

  function decorateCards() {
    if (!P || !P.getById) return;
    $$('.product-card:not(.ft-qv-ready)').forEach(function (card) {
      card.classList.add('ft-qv-ready');
      var img = $('img[data-pid]', card);
      var wrap = $('.pc-image-wrap', card);
      if (!img || !wrap) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ft-quick';
      b.setAttribute('data-pid', img.getAttribute('data-pid'));
      b.setAttribute('aria-label', 'Quick view');
      b.innerHTML = '<span aria-hidden="true">👁</span> Quick view';
      wrap.appendChild(b);
    });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.ft-quick');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    var p = P.getById(b.getAttribute('data-pid'));
    if (p) qvOpen(p, b);
  });

  /* ==========================================================
     4. STICKY ADD TO CART BAR  +  5. SHARE  (product page)
  ========================================================== */

  var stickyBuilt = false;

  function setupDetails() {
    var add = $('#pd-add');
    if (!add) return;

    if (!$('#ft-share')) {
      var anchor = $('#pd-wishlist') || add;
      var s = document.createElement('button');
      s.type = 'button';
      s.id = 'ft-share';
      s.className = 'btn btn-outline ft-share';
      s.textContent = 'Share';
      anchor.parentNode.insertBefore(s, anchor.nextSibling);
      s.addEventListener('click', function () {
        var title = (document.title || 'Brit.Tuna').replace(/\s*\|.*$/, '');
        var url = location.href;
        if (navigator.share) {
          navigator.share({ title: title, text: title + ' – Brit.Tuna', url: url }).catch(function () {});
        } else if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(function () { toast('Link copied'); }, function () { toast('Copy the link from the address bar'); });
        } else {
          toast('Copy the link from the address bar');
        }
      });
    }

    if (stickyBuilt) return;
    stickyBuilt = true;

    var bar = document.createElement('div');
    bar.id = 'ft-sticky';
    bar.hidden = true;
    bar.innerHTML = '<div class="ft-st-price"><small>Total</small><strong id="ft-st-total"></strong></div>' +
      '<button type="button" class="btn btn-primary" id="ft-st-add"></button>' +
      '<button type="button" class="btn btn-buy-now" id="ft-st-buy"></button>';
    document.body.appendChild(bar);

    function sync() {
      var a = $('#pd-add'), b = $('#pd-buy-now'), t = $('#pd-total') || $('#pd-price');
      if (!a) return;
      $('#ft-st-total').textContent = t ? t.textContent : '';
      var sa = $('#ft-st-add'), sb = $('#ft-st-buy');
      sa.textContent = a.textContent; sa.disabled = a.disabled;
      if (b) { sb.hidden = false; sb.textContent = b.textContent; sb.disabled = b.disabled; } else { sb.hidden = true; }
    }

    $('#ft-st-add').addEventListener('click', function () { var a = $('#pd-add'); if (a && !a.disabled) a.click(); });
    $('#ft-st-buy').addEventListener('click', function () { var b = $('#pd-buy-now'); if (b && !b.disabled) b.click(); });

    var visible = true;
    function place() {
      var show = !visible && window.innerWidth <= 860;
      bar.hidden = !show;
      document.documentElement.classList.toggle('ft-has-sticky', show);
    }

    function watch() {
      var a = $('#pd-add');
      if (!a) return;
      sync();
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) {
          visible = en[0].isIntersecting;
          place();
        }).observe(a);
      }
    }
    watch();

    var holder = $('#product-detail');
    if (holder && 'MutationObserver' in window) {
      new MutationObserver(function () { sync(); }).observe(holder, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['disabled'] });
    }
    window.addEventListener('resize', place);
  }

  /* ==========================================================
     6. BACK TO TOP
  ========================================================== */

  function setupTop() {
    var b = document.createElement('button');
    b.type = 'button';
    b.id = 'ft-top';
    b.setAttribute('aria-label', 'Back to top');
    b.innerHTML = '↑';
    b.hidden = true;
    document.body.appendChild(b);
    var shown = false, ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var s = window.pageYOffset > 700;
        if (s !== shown) { shown = s; b.hidden = !s; }
        ticking = false;
      });
    }, { passive: true });
    b.addEventListener('click', function () {
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  /* ==========================================================
     START
  ========================================================== */

  function start() {
    setupTop();
    if (!P) return;

    loadProducts().then(function (all) {
      mountRecent(all);
      decorateCards();
      setupDetails();
    });

    if ('MutationObserver' in window) {
      var pending = false;
      new MutationObserver(function () {
        if (pending) return;
        pending = true;
        requestAnimationFrame(function () {
          pending = false;
          decorateCards();
          setupDetails();
        });
      }).observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
