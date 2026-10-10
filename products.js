/* ==========================================================
   products.js — DEMO product data + product page logic.

   !! ALL PRICES, STOCK AND DESCRIPTIONS BELOW ARE DEMO DATA !!
   Replace them with your real information (or load them from
   Supabase later by changing load()).

   Element IDs used by the pages (keep them in your HTML):
   - index.html ........ #category-grid, #bestsellers-grid
   - shop.html ......... #search-input, #category-filter, #price-filter,
                         #sort-select, #product-grid, #result-count,
                         #empty-state
   - products.html ..... #category-tabs, #sort-select, #product-grid,
                         #result-count, #products-heading, #empty-state
   - product-details ... #product-detail, #related-grid
   Set <body data-page="home|shop|products|product-details">.
   ========================================================== */
(function () {
  'use strict';
  var U = window.BTUtil;
  var CFG = window.BT_CONFIG;

  /* ---------- Categories ---------- */
  var CATEGORIES = [
    { id: 'peanuts', name: 'Peanuts', icon: '🥜', color: '#e9e0d4', blurb: 'Raw, premium, roasted, skinless and wholesale peanuts.' },
    { id: 'mango-pickles', name: 'Mango Pickles', icon: '🥭', color: '#d6cabb', blurb: 'Five mango pickle styles.' },
    { id: 'red-chilli', name: 'Red Chilli', icon: '🌶️', color: '#c9baa8', blurb: 'Whole, dried, powder, premium and wholesale chilli.' },
    { id: 'rice', name: 'Rice', icon: '🍚', color: '#f1ece4', blurb: 'Ponni, idli, basmati, sona masoori, raw and parboiled rice.' }
  ];

  var STOCK_LABELS = {
    in_stock: 'In stock (demo)',
    low_stock: 'Low stock (demo)',
    out_of_stock: 'Out of stock (demo)'
  };

  var PRICE_RANGES = [
    { id: 'all', label: 'All prices', min: 0, max: Infinity },
    { id: 'u200', label: 'Under ₹200', min: 0, max: 200 },
    { id: '200-500', label: '₹200 – ₹500', min: 200, max: 500 },
    { id: '500-1000', label: '₹500 – ₹1,000', min: 500, max: 1000 },
    { id: 'o1000', label: 'Above ₹1,000', min: 1000, max: Infinity }
  ];

  function slugify(t) {
    return String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  /* Builds one product record. packs = [['label', demoPriceInINR], ...]
     IDs are stable: product id "p-<slug>", variant id "<product id>-<pack slug>". */
  function P(category, name, short, description, packs, opts) {
    opts = opts || {};
    var id = 'p-' + slugify(name);
    return {
      id: id,
      slug: slugify(name),
      name: name,
      category: category,
      short: short,
      description: description,
      image: opts.image || '',          // paste an image URL here when you have one
      discount: opts.discount || 0,     // demo discount percent
      stock: opts.stock || 'in_stock',  // in_stock | low_stock | out_of_stock
      featured: !!opts.featured,
      bestseller: !!opts.bestseller,
      wholesale: !!opts.wholesale,
      active: true,
      ingredients: '',                  // fill only with verified information
      allergens: '',                    // fill only with verified information
      storage: '',                      // fill only with verified information
      isDemo: true,
      packs: packs.map(function (p) {
        return { id: id + '-' + slugify(p[0]), label: p[0], price: p[1] };
      })
    };
  }

  /* ---------- DEMO PRODUCTS ---------- */
  var DEMO_PRODUCTS = [
    // Peanuts
    P('peanuts', 'Raw Peanuts', 'Raw peanut kernels for everyday cooking.',
      'Raw peanut kernels that can be used for cooking, chutneys or roasting at home. Replace this demo description with your verified product details.',
      [['500 g', 90], ['1 kg', 170], ['5 kg', 800]], { featured: true, bestseller: true }),
    P('peanuts', 'Premium Peanuts', 'Carefully selected larger peanuts.',
      'A premium grade of peanuts for snacking and gifting. Replace this demo description with your verified product details.',
      [['500 g', 120], ['1 kg', 230], ['5 kg', 1100]], { featured: true, discount: 10 }),
    P('peanuts', 'Roasted Peanuts', 'Ready-to-eat roasted peanuts.',
      'Roasted peanuts ready to eat as a snack. Replace this demo description with your verified product details.',
      [['250 g', 70], ['500 g', 130], ['1 kg', 250]], { bestseller: true }),
    P('peanuts', 'Skinless Peanuts', 'Peanut kernels without the red skin.',
      'Skinless peanut kernels for cooking and preparing sweets and sauces. Replace this demo description with your verified product details.',
      [['500 g', 110], ['1 kg', 210]], {}),
    P('peanuts', 'Wholesale Peanuts', 'Bulk peanuts for businesses.',
      'Bulk quantities of peanuts for shops, caterers and food businesses. Contact us for current wholesale rates. Demo prices only.',
      [['25 kg', 3900], ['50 kg', 7600]], { wholesale: true }),

    // Mango pickles
    P('mango-pickles', 'Traditional Mango Pickle', 'Classic mango pickle in a traditional style.',
      'A traditional-style mango pickle for everyday meals. Replace this demo description and add verified ingredients.',
      [['250 g', 140], ['500 g', 260], ['1 kg', 480]], { featured: true, bestseller: true }),
    P('mango-pickles', 'Spicy Mango Pickle', 'Mango pickle with a stronger spice level.',
      'A spicier mango pickle for those who like extra heat. Replace this demo description and add verified ingredients.',
      [['250 g', 150], ['500 g', 280], ['1 kg', 520]], { featured: true }),
    P('mango-pickles', 'Garlic Mango Pickle', 'Mango pickle prepared with garlic.',
      'A mango pickle prepared with garlic. Replace this demo description and add verified ingredients.',
      [['250 g', 160], ['500 g', 300], ['1 kg', 560]], { discount: 5 }),
    P('mango-pickles', 'Sweet Mango Pickle', 'Mild and sweet mango pickle.',
      'A sweeter, milder mango pickle. Replace this demo description and add verified ingredients.',
      [['250 g', 140], ['500 g', 260], ['1 kg', 480]], { stock: 'low_stock' }),
    P('mango-pickles', 'Homemade-Style Mango Pickle', 'Mango pickle in a homemade style.',
      'A mango pickle made in a homemade style. Replace this demo description and add verified ingredients.',
      [['250 g', 170], ['500 g', 320], ['1 kg', 600]], { featured: true }),

    // Red chilli
    P('red-chilli', 'Whole Red Chilli', 'Whole red chillies for cooking.',
      'Whole red chillies for tempering and cooking. Replace this demo description with your verified product details.',
      [['100 g', 50], ['250 g', 120], ['500 g', 230], ['1 kg', 440]], {}),
    P('red-chilli', 'Dried Red Chilli', 'Sun-dried style red chillies.',
      'Dried red chillies for everyday cooking. Replace this demo description with your verified product details.',
      [['100 g', 55], ['250 g', 130], ['500 g', 250], ['1 kg', 480]], {}),
    P('red-chilli', 'Red Chilli Powder', 'Ground red chilli powder.',
      'Ground red chilli powder for curries and masalas. Replace this demo description with your verified product details.',
      [['100 g', 60], ['250 g', 140], ['500 g', 270], ['1 kg', 520]], { featured: true, bestseller: true }),
    P('red-chilli', 'Premium Red Chilli', 'Selected premium-grade red chillies.',
      'A premium selection of red chillies. Replace this demo description with your verified product details.',
      [['100 g', 80], ['250 g', 190], ['500 g', 360]], { discount: 10 }),
    P('red-chilli', 'Wholesale Red Chilli', 'Bulk red chilli for businesses.',
      'Bulk quantities of red chilli for shops, caterers and food businesses. Contact us for current wholesale rates. Demo prices only.',
      [['10 kg', 1900], ['25 kg', 4600]], { wholesale: true, stock: 'out_of_stock' }),

    // Rice
    P('rice', 'Ponni Rice', 'Everyday Ponni rice.',
      'Ponni rice for everyday meals. Replace this demo description with your verified product details.',
      [['5 kg', 320], ['10 kg', 620], ['25 kg', 1500]], { featured: true, bestseller: true }),
    P('rice', 'Idli Rice', 'Rice suited for idli and dosa batter.',
      'Rice commonly used for idli and dosa batter. Replace this demo description with your verified product details.',
      [['5 kg', 300], ['10 kg', 580], ['25 kg', 1400]], {}),
    P('rice', 'Basmati Rice', 'Long-grain basmati rice.',
      'Long-grain basmati rice for biryani and pulao. Replace this demo description with your verified product details.',
      [['1 kg', 140], ['5 kg', 680], ['10 kg', 1320]], { featured: true, discount: 8 }),
    P('rice', 'Sona Masoori Rice', 'Light, everyday Sona Masoori rice.',
      'Sona Masoori rice for daily cooking. Replace this demo description with your verified product details.',
      [['5 kg', 360], ['10 kg', 700], ['25 kg', 1700]], { bestseller: true }),
    P('rice', 'Raw Rice', 'Raw (unparboiled) rice.',
      'Raw rice for everyday cooking. Replace this demo description with your verified product details.',
      [['5 kg', 280], ['10 kg', 540], ['25 kg', 1300]], {}),
    P('rice', 'Parboiled Rice', 'Parboiled rice for daily meals.',
      'Parboiled rice for daily meals. Replace this demo description with your verified product details.',
      [['5 kg', 290], ['10 kg', 560], ['25 kg', 1350]], {})
  ];

  /* ---------- Data access (replace load() with Supabase later) ---------- */
  var cache = DEMO_PRODUCTS.filter(function (p) { return p.active; });

  function load() {
    return Promise.resolve(cache);
  }
  function getAll() { return cache.slice(); }
  function getById(id) {
    for (var i = 0; i < cache.length; i++) if (cache[i].id === id) return cache[i];
    return null;
  }
  function getBySlug(slug) {
    for (var i = 0; i < cache.length; i++) if (cache[i].slug === slug) return cache[i];
    return null;
  }
  function getCategory(id) {
    for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].id === id) return CATEGORIES[i];
    return null;
  }
  function getVariant(productId, packId) {
    var p = getById(productId);
    if (!p) return null;
    for (var i = 0; i < p.packs.length; i++) {
      if (p.packs[i].id === packId) return { product: p, pack: p.packs[i] };
    }
    return null;
  }

  /* ---------- Pricing helpers (single source of truth) ---------- */
  function salePrice(price, discount) {
    return Math.round(price * (100 - (discount || 0)) / 100);
  }
  function fromPrice(p) {
    var min = Infinity;
    p.packs.forEach(function (k) {
      var s = salePrice(k.price, p.discount);
      if (s < min) min = s;
    });
    return min;
  }
  function fromMrp(p) {
    var min = Infinity;
    p.packs.forEach(function (k) { if (k.price < min) min = k.price; });
    return min;
  }
  function stockLabel(p) { return STOCK_LABELS[p.stock] || 'Stock unknown (demo)'; }

  /* ---------- Image (placeholder tile unless p.image is set) ---------- */
  function xmlEscape(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function imageFor(p) {
    if (p.image) return p.image;
    var cat = getCategory(p.category) || { icon: '🛒', color: '#e4dacd' };
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
      '<rect width="400" height="300" fill="' + cat.color + '"/>' +
      '<text x="200" y="165" font-size="110" text-anchor="middle">' + cat.icon + '</text>' +
      '<text x="200" y="262" font-size="22" text-anchor="middle" fill="#2b2927" font-family="sans-serif">' +
      xmlEscape(p.name) + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /* ---------- Search / filter / sort ---------- */
  function filter(opts) {
    opts = opts || {};
    var q = String(opts.q || '').toLowerCase().trim();
    var range = null;
    PRICE_RANGES.forEach(function (r) { if (r.id === opts.price) range = r; });
    var list = cache.filter(function (p) {
      if (opts.category && opts.category !== 'all' && p.category !== opts.category) return false;
      if (q) {
        var cat = getCategory(p.category);
        var hay = (p.name + ' ' + p.short + ' ' + (cat ? cat.name : '')).toLowerCase();
        var ok = q.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
        if (!ok) return false;
      }
      if (range) {
        var price = fromPrice(p);
        if (price < range.min || price > range.max) return false;
      }
      return true;
    });
    switch (opts.sort) {
      case 'price-asc': list.sort(function (a, b) { return fromPrice(a) - fromPrice(b); }); break;
      case 'price-desc': list.sort(function (a, b) { return fromPrice(b) - fromPrice(a); }); break;
      case 'name-asc': list.sort(function (a, b) { return a.name.localeCompare(b.name); }); break;
      case 'name-desc': list.sort(function (a, b) { return b.name.localeCompare(a.name); }); break;
      default: break;
    }
    return list;
  }

  /* ---------- Rendering ---------- */
  function absoluteUrl(path) {
    try { return new URL(path, window.location.href).href; } catch (e) { return path; }
  }
  function productUrl(p) { return 'product-details.html?slug=' + encodeURIComponent(p.slug); }

  function cardHTML(p) {
    var cat = getCategory(p.category);
    var out = p.stock === 'out_of_stock';
    var first = p.packs[0];
    var msg = 'Hello Brit.Tuna, I would like to order:\nProduct: ' + p.name +
      '\nPack size: ' + first.label + '\nQuantity: 1\nLink: ' + absoluteUrl(productUrl(p));
    var mrp = fromMrp(p), now = fromPrice(p);
    return '' +
      '<article class="product-card">' +
        '<a class="pc-img" href="' + productUrl(p) + '">' +
          '<img src="' + imageFor(p) + '" alt="' + U.escapeHtml(p.name) + '" loading="lazy" width="400" height="300">' +
          (p.discount ? '<span class="pc-badge">' + p.discount + '% OFF</span>' : '') +
          '<span class="demo-tag">Demo</span>' +
        '</a>' +
        '<div class="pc-body">' +
          '<p class="pc-cat">' + U.escapeHtml(cat ? cat.name : '') + '</p>' +
          '<h3 class="pc-name"><a href="' + productUrl(p) + '">' + U.escapeHtml(p.name) + '</a></h3>' +
          '<p class="pc-short">' + U.escapeHtml(p.short) + '</p>' +
          '<p class="pc-packs">Packs: ' + p.packs.map(function (k) { return U.escapeHtml(k.label); }).join(' · ') + '</p>' +
          '<p class="pc-price"><span class="price-from">From</span> <span class="price-now">' + U.formatINR(now) + '</span>' +
            (p.discount ? ' <span class="price-old">' + U.formatINR(mrp) + '</span>' : '') + '</p>' +
          '<p class="stock stock-' + p.stock + '">' + stockLabel(p) + '</p>' +
          '<div class="pc-actions">' +
            '<button type="button" class="btn btn-primary btn-sm js-add-card" data-product-id="' + p.id + '"' + (out ? ' disabled' : '') + '>Add to Cart</button>' +
            '<a class="btn btn-whatsapp btn-sm" href="' + U.whatsappLink(msg) + '" target="_blank" rel="noopener">WhatsApp</a>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function renderGrid(el, list) {
    if (!el) return;
    el.innerHTML = list.map(cardHTML).join('');
  }

  function toast(msg) {
    if (window.BTUI && window.BTUI.toast) window.BTUI.toast(msg);
  }

  /* ---------- Page: Home ---------- */
  function initHome() {
    var cg = document.getElementById('category-grid');
    if (cg) {
      cg.innerHTML = CATEGORIES.map(function (c) {
        var n = cache.filter(function (p) { return p.category === c.id; }).length;
        return '<a class="cat-card" href="products.html?category=' + c.id + '" style="--cat-bg:' + c.color + '">' +
          '<span class="cat-icon" aria-hidden="true">' + c.icon + '</span>' +
          '<h3>' + c.name + '</h3><p>' + U.escapeHtml(c.blurb) + '</p>' +
          '<span class="cat-count">' + n + ' products</span></a>';
      }).join('');
    }
    var bg = document.getElementById('bestsellers-grid');
    if (bg) {
      var best = cache.filter(function (p) { return p.bestseller; }).slice(0, 4);
      renderGrid(bg, best);
    }
  }

  /* ---------- Page: Shop ---------- */
  function fillSelect(sel, items, valueKey, labelKey) {
    if (!sel || sel.options.length > 0) return;
    items.forEach(function (it) {
      var o = document.createElement('option');
      o.value = it[valueKey];
      o.textContent = it[labelKey];
      sel.appendChild(o);
    });
  }

  function initShop() {
    var grid = document.getElementById('product-grid');
    if (!grid) return;
    var qEl = document.getElementById('search-input');
    var catEl = document.getElementById('category-filter');
    var priceEl = document.getElementById('price-filter');
    var sortEl = document.getElementById('sort-select');
    var countEl = document.getElementById('result-count');
    var emptyEl = document.getElementById('empty-state');

    fillSelect(catEl, [{ id: 'all', name: 'All categories' }].concat(CATEGORIES), 'id', 'name');
    fillSelect(priceEl, PRICE_RANGES, 'id', 'label');
    fillSelect(sortEl, [
      { id: 'default', name: 'Sort: Featured' },
      { id: 'price-asc', name: 'Price: Low to High' },
      { id: 'price-desc', name: 'Price: High to Low' },
      { id: 'name-asc', name: 'Name: A to Z' },
      { id: 'name-desc', name: 'Name: Z to A' }
    ], 'id', 'name');

    // Start from URL (?q=...&category=...)
    if (qEl) qEl.value = U.getParam('q') || '';
    var urlCat = U.getParam('category');
    if (catEl && urlCat && getCategory(urlCat)) catEl.value = urlCat;

    function render() {
      try {
        var list = filter({
          q: qEl ? qEl.value : '',
          category: catEl ? catEl.value : 'all',
          price: priceEl ? priceEl.value : 'all',
          sort: sortEl ? sortEl.value : 'default'
        });
        renderGrid(grid, list);
        if (countEl) countEl.textContent = 'Showing ' + list.length + ' of ' + cache.length + ' products';
        if (emptyEl) emptyEl.hidden = list.length > 0;
      } catch (err) {
        grid.innerHTML = '<p class="state-error" role="alert">Sorry, products could not be loaded. Please refresh the page.</p>';
      }
    }
    [qEl, catEl, priceEl, sortEl].forEach(function (el) {
      if (!el) return;
      el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', render);
    });
    var resetBtn = document.getElementById('reset-filters');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      if (qEl) qEl.value = '';
      if (catEl) catEl.value = 'all';
      if (priceEl) priceEl.value = 'all';
      if (sortEl) sortEl.value = 'default';
      render();
    });
    render();
  }

  /* ---------- Page: Products (by category) ---------- */
  function initProducts() {
    var grid = document.getElementById('product-grid');
    if (!grid) return;
    var tabs = document.getElementById('category-tabs');
    var sortEl = document.getElementById('sort-select');
    var countEl = document.getElementById('result-count');
    var heading = document.getElementById('products-heading');
    var emptyEl = document.getElementById('empty-state');
    var current = U.getParam('category');
    if (!getCategory(current)) current = 'all';

    fillSelect(sortEl, [
      { id: 'default', name: 'Sort: Featured' },
      { id: 'price-asc', name: 'Price: Low to High' },
      { id: 'price-desc', name: 'Price: High to Low' },
      { id: 'name-asc', name: 'Name: A to Z' },
      { id: 'name-desc', name: 'Name: Z to A' }
    ], 'id', 'name');

    function drawTabs() {
      if (!tabs) return;
      var html = '<a class="chip' + (current === 'all' ? ' active' : '') + '" href="products.html" data-cat="all">All</a>';
      CATEGORIES.forEach(function (c) {
        html += '<a class="chip' + (current === c.id ? ' active' : '') + '" href="products.html?category=' + c.id + '" data-cat="' + c.id + '">' + c.icon + ' ' + c.name + '</a>';
      });
      tabs.innerHTML = html;
    }
    function render() {
      var list = filter({ category: current, sort: sortEl ? sortEl.value : 'default' });
      renderGrid(grid, list);
      var cat = getCategory(current);
      if (heading) heading.textContent = cat ? cat.name : 'All Products';
      if (countEl) countEl.textContent = list.length + ' products';
      if (emptyEl) emptyEl.hidden = list.length > 0;
      drawTabs();
    }
    if (tabs) {
      tabs.addEventListener('click', function (e) {
        var a = e.target.closest('a[data-cat]');
        if (!a) return;
        e.preventDefault();
        current = a.getAttribute('data-cat');
        history.replaceState(null, '', current === 'all' ? 'products.html' : 'products.html?category=' + current);
        render();
      });
    }
    if (sortEl) sortEl.addEventListener('change', render);
    render();
  }

  /* ---------- Page: Product details ---------- */
  function initDetails() {
    var box = document.getElementById('product-detail');
    if (!box) return;
    var slug = U.getParam('slug');
    var id = U.getParam('id');
    var p = slug ? getBySlug(slug) : (id ? getById(id) : null);

    if (!p) {
      box.innerHTML = '<div class="empty-state"><h2>Product not found</h2>' +
        '<p>We could not find that product. It may have been removed.</p>' +
        '<a class="btn btn-primary" href="shop.html">Browse all products</a></div>';
      return;
    }

    document.title = p.name + ' | ' + CFG.brandName;
    var cat = getCategory(p.category);
    var out = p.stock === 'out_of_stock';
    var state = { packId: p.packs[0].id, qty: 1 };
    var NA = '<em>Not provided yet. To be confirmed by the business owner.</em>';

    var packsHTML = p.packs.map(function (k, i) {
      return '<label class="pack-opt"><input type="radio" name="pack" value="' + k.id + '"' + (i === 0 ? ' checked' : '') + '>' +
        '<span>' + U.escapeHtml(k.label) + '</span><small>' + U.formatINR(salePrice(k.price, p.discount)) + '</small></label>';
    }).join('');

    box.innerHTML =
      '<nav class="breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a> / <a href="products.html?category=' + p.category + '">' +
        U.escapeHtml(cat ? cat.name : 'Products') + '</a> / <span>' + U.escapeHtml(p.name) + '</span></nav>' +
      '<div class="pd-grid">' +
        '<div class="pd-image"><img src="' + imageFor(p) + '" alt="' + U.escapeHtml(p.name) + '" width="400" height="300">' +
          (p.discount ? '<span class="pc-badge">' + p.discount + '% OFF</span>' : '') + '</div>' +
        '<div class="pd-info">' +
          '<p class="pc-cat">' + U.escapeHtml(cat ? cat.name : '') + '</p>' +
          '<h1>' + U.escapeHtml(p.name) + '</h1>' +
          '<p class="pd-short">' + U.escapeHtml(p.short) + '</p>' +
          '<p class="pd-price"><span id="pd-price" class="price-now"></span> <span id="pd-mrp" class="price-old"></span></p>' +
          '<p class="notice notice-small">Demo price and stock. Replace with real data before publishing.</p>' +
          '<p class="stock stock-' + p.stock + '">' + stockLabel(p) + '</p>' +
          '<fieldset class="pack-options"><legend>Select pack size</legend>' + packsHTML + '</fieldset>' +
          '<div class="pd-qty-row"><span class="label">Quantity</span>' +
            '<div class="qty"><button type="button" id="qty-dec" aria-label="Decrease quantity">−</button>' +
            '<input id="qty-input" type="number" min="1" max="99" value="1" aria-label="Quantity">' +
            '<button type="button" id="qty-inc" aria-label="Increase quantity">+</button></div>' +
            '<span class="pd-line-total">Total: <strong id="pd-total"></strong></span></div>' +
          '<div class="pd-actions">' +
            '<button type="button" id="pd-add" class="btn btn-primary"' + (out ? ' disabled' : '') + '>' + (out ? 'Out of stock' : 'Add to Cart') + '</button>' +
            '<a id="pd-whatsapp" class="btn btn-whatsapp" href="#" target="_blank" rel="noopener">Order on WhatsApp</a>' +
          '</div>' +
          '<p class="form-note">A WhatsApp message is an enquiry only. It is not a confirmed order or proof of payment.</p>' +
        '</div>' +
      '</div>' +
      '<section class="pd-tabs"><h2>Product description</h2><p>' + U.escapeHtml(p.description) + '</p>' +
        '<table class="spec-table"><tbody>' +
          '<tr><th>Product ID</th><td>' + U.escapeHtml(p.id) + '</td></tr>' +
          '<tr><th>Category</th><td>' + U.escapeHtml(cat ? cat.name : '') + '</td></tr>' +
          '<tr><th>Available packs</th><td>' + p.packs.map(function (k) { return U.escapeHtml(k.label); }).join(', ') + '</td></tr>' +
          '<tr><th>Ingredients</th><td>' + (p.ingredients ? U.escapeHtml(p.ingredients) : NA) + '</td></tr>' +
          '<tr><th>Allergen information</th><td>' + (p.allergens ? U.escapeHtml(p.allergens) : NA) + '</td></tr>' +
          '<tr><th>Storage</th><td>' + (p.storage ? U.escapeHtml(p.storage) : NA) + '</td></tr>' +
        '</tbody></table></section>';

    var priceEl = document.getElementById('pd-price');
    var mrpEl = document.getElementById('pd-mrp');
    var totalEl = document.getElementById('pd-total');
    var waEl = document.getElementById('pd-whatsapp');
    var qtyEl = document.getElementById('qty-input');

    function currentPack() {
      var v = getVariant(p.id, state.packId);
      return v ? v.pack : p.packs[0];
    }
    function update() {
      var pack = currentPack();
      var now = salePrice(pack.price, p.discount);
      priceEl.textContent = U.formatINR(now);
      mrpEl.textContent = p.discount ? U.formatINR(pack.price) : '';
      totalEl.textContent = U.formatINR(now * state.qty);
      var msg = 'Hello Brit.Tuna, I would like to order:\nProduct: ' + p.name +
        '\nPack size: ' + pack.label + '\nQuantity: ' + state.qty +
        '\nLink: ' + absoluteUrl(productUrl(p));
      waEl.href = U.whatsappLink(msg);
    }
    function setQty(n) {
      n = parseInt(n, 10);
      if (!n || n < 1) n = 1;
      if (n > 99) n = 99;
      state.qty = n;
      qtyEl.value = n;
      update();
    }

    box.addEventListener('change', function (e) {
      if (e.target.name === 'pack') { state.packId = e.target.value; update(); }
    });
    document.getElementById('qty-dec').addEventListener('click', function () { setQty(state.qty - 1); });
    document.getElementById('qty-inc').addEventListener('click', function () { setQty(state.qty + 1); });
    qtyEl.addEventListener('change', function () { setQty(qtyEl.value); });
    document.getElementById('pd-add').addEventListener('click', function () {
      if (!window.BTCart) return;
      var ok = window.BTCart.add(p.id, state.packId, state.qty);
      toast(ok ? p.name + ' (' + currentPack().label + ') × ' + state.qty + ' added to cart' : 'This item is out of stock');
    });
    update();

    // Related products
    var rel = document.getElementById('related-grid');
    if (rel) {
      var same = cache.filter(function (x) { return x.category === p.category && x.id !== p.id; });
      var others = cache.filter(function (x) { return x.category !== p.category; });
      renderGrid(rel, same.concat(others).slice(0, 4));
    }
  }

  /* ---------- Shared: add to cart from product cards ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.js-add-card');
    if (!btn) return;
    var p = getById(btn.getAttribute('data-product-id'));
    if (!p || !window.BTCart) return;
    var ok = window.BTCart.add(p.id, p.packs[0].id, 1);
    toast(ok ? p.name + ' (' + p.packs[0].label + ') added to cart' : 'This item is out of stock');
  });

  /* ---------- Boot ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var page = document.body.getAttribute('data-page');
    load().then(function () {
      if (page === 'home') initHome();
      else if (page === 'shop') initShop();
      else if (page === 'products') initProducts();
      else if (page === 'product-details') initDetails();
    });
  });

  window.BTProducts = {
    categories: CATEGORIES,
    priceRanges: PRICE_RANGES,
    load: load,
    getAll: getAll,
    getById: getById,
    getBySlug: getBySlug,
    getCategory: getCategory,
    getVariant: getVariant,
    salePrice: salePrice,
    fromPrice: fromPrice,
    imageFor: imageFor,
    stockLabel: stockLabel,
    filter: filter,
    cardHTML: cardHTML,
    productUrl: productUrl
  };
})();
