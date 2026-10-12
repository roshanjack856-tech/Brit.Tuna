/* ==========================================================
   products.js — product catalogue + product page logic.

   Products are loaded from your Supabase table "products" when the
   keys in supabase-config.js are filled in. The list below is the
   built-in catalogue shown until then (and if Supabase is unreachable).
   Table columns: slug, name, category, short, description, image,
   discount, stock, featured, bestseller, wholesale, active,
   ingredients, allergens, storage, packs (jsonb: [{"label":"1 kg","price":170}]).

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
    { id: 'peanuts', name: 'Peanuts', icon: '🥜', color: '#f4e3c1', photo: 'https://images.unsplash.com/photo-1567892320421-1c657571ea4a?auto=format&fit=crop&w=700&q=70', blurb: 'Raw, premium, roasted, skinless and wholesale peanuts.' },
    { id: 'mango-pickles', name: 'Mango Pickles', icon: '🥭', color: '#fbe3a6', photo: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=70', blurb: 'Five mango pickle styles.' },
    { id: 'red-chilli', name: 'Red Chilli', icon: '🌶️', color: '#f6cbc4', photo: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=700&q=70', blurb: 'Whole, dried, powder, premium and wholesale chilli.' },
    { id: 'rice', name: 'Rice', icon: '🍚', color: '#edf0dc', photo: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=700&q=70', blurb: 'Ponni, idli, basmati, sona masoori, raw and parboiled rice.' }
  ];

  var STOCK_LABELS = {
    in_stock: 'In stock',
    low_stock: 'Low stock',
    out_of_stock: 'Out of stock'
  };

  var PRICE_RANGES = [
    { id: 'all', label: 'All prices', min: 0, max: Infinity },
    { id: 'u200', label: 'Under ₹200', min: 0, max: 200 },
    { id: '200-500', label: '₹200 – ₹500', min: 200, max: 500 },
    { id: '500-1000', label: '₹500 – ₹1,000', min: 500, max: 1000 },
    { id: 'o1000', label: 'Above ₹1,000', min: 1000, max: Infinity }
  ];

  /* Free stock photos (Unsplash). Replace with your own photo URLs any time. */
  function ph(id) { return 'https://images.unsplash.com/photo-' + id + '?auto=format&fit=crop&w=800&q=70'; }
  var CAT_IMG = {
    'peanuts': ['1567892320421-1c657571ea4a', '1626082927389-6cd097cdc6ec'],
    'mango-pickles': ['1553279768-865429fa0078', '1601050690597-df0568f70950'],
    'red-chilli': ['1588252303782-cb80119abd6d', '1583119022894-919a68a3d0e3'],
    'rice': ['1586201375761-83865001e31c', '1536304993881-ff6e9eefa2a6']
  };
  var CAT_INFO = {
    'peanuts': { extra: ' Packed fresh and sealed to keep the crunch. Available in retail and bulk sizes.', ingredients: 'Peanuts', allergens: 'Contains peanuts.', storage: 'Store in a cool, dry place in an airtight container.' },
    'mango-pickles': { extra: ' Made with raw mangoes and traditional spices. Enjoy with curd rice, rotis and parathas.', ingredients: '', allergens: '', storage: 'Keep in a cool, dry place. Use a dry spoon and keep the jar closed after use.' },
    'red-chilli': { extra: ' Adds colour and heat to curries, chutneys and masalas. Sealed packs for freshness.', ingredients: 'Red chilli', allergens: '', storage: 'Store in a cool, dry place in an airtight container away from moisture.' },
    'rice': { extra: ' Cleaned and packed for everyday kitchens, families, caterers and hotels.', ingredients: 'Rice', allergens: '', storage: 'Store in a cool, dry place in a sealed container.' }
  };
  var EXTRA_DISC = { 'Raw Peanuts': 5, 'Roasted Peanuts': 7, 'Traditional Mango Pickle': 5, 'Red Chilli Powder': 8, 'Ponni Rice': 5, 'Sona Masoori Rice': 6 };
  function catImage(cat, name) {
    var list = CAT_IMG[cat] || [];
    if (!list.length) return '';
    var h = 0; for (var i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % 97;
    return ph(list[h % list.length]);
  }

  function slugify(t) {
    return String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  /* Builds one product record. packs = [['label', priceInINR], ...]
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
      description: description + ((CAT_INFO[category] || {}).extra || ''),
      image: opts.image || catImage(category, name),
      discount: opts.discount || EXTRA_DISC[name] || 0,     // discount percent
      stock: opts.stock || 'in_stock',  // in_stock | low_stock | out_of_stock
      featured: !!opts.featured,
      bestseller: !!opts.bestseller,
      wholesale: !!opts.wholesale,
      active: true,
      ingredients: (CAT_INFO[category] || {}).ingredients || '',
      allergens: (CAT_INFO[category] || {}).allergens || '',
      storage: (CAT_INFO[category] || {}).storage || '',
      packs: packs.map(function (p) {
        return { id: id + '-' + slugify(p[0]), label: p[0], price: p[1] };
      })
    };
  }

  /* ---------- Built-in catalogue ---------- */
  var DEFAULT_PRODUCTS = [
    // Peanuts
    P('peanuts', 'Raw Peanuts', 'Raw peanut kernels for everyday cooking.',
      'Raw peanut kernels that can be used for cooking, chutneys or roasting at home.',
      [['500 g', 90], ['1 kg', 170], ['5 kg', 800]], { featured: true, bestseller: true }),
    P('peanuts', 'Premium Peanuts', 'Carefully selected larger peanuts.',
      'A premium grade of peanuts for snacking and gifting.',
      [['500 g', 120], ['1 kg', 230], ['5 kg', 1100]], { featured: true, discount: 10 }),
    P('peanuts', 'Roasted Peanuts', 'Ready-to-eat roasted peanuts.',
      'Roasted peanuts ready to eat as a snack.',
      [['250 g', 70], ['500 g', 130], ['1 kg', 250]], { bestseller: true }),
    P('peanuts', 'Skinless Peanuts', 'Peanut kernels without the red skin.',
      'Skinless peanut kernels for cooking and preparing sweets and sauces.',
      [['500 g', 110], ['1 kg', 210]], {}),
    P('peanuts', 'Wholesale Peanuts', 'Bulk peanuts for businesses.',
      'Bulk quantities of peanuts for shops, caterers and food businesses. Contact us for current wholesale rates.',
      [['25 kg', 3900], ['50 kg', 7600]], { wholesale: true }),

    // Mango pickles
    P('mango-pickles', 'Traditional Mango Pickle', 'Classic mango pickle in a traditional style.',
      'A traditional-style mango pickle for everyday meals.',
      [['250 g', 140], ['500 g', 260], ['1 kg', 480]], { featured: true, bestseller: true }),
    P('mango-pickles', 'Spicy Mango Pickle', 'Mango pickle with a stronger spice level.',
      'A spicier mango pickle for those who like extra heat.',
      [['250 g', 150], ['500 g', 280], ['1 kg', 520]], { featured: true }),
    P('mango-pickles', 'Garlic Mango Pickle', 'Mango pickle prepared with garlic.',
      'A mango pickle prepared with garlic.',
      [['250 g', 160], ['500 g', 300], ['1 kg', 560]], { discount: 5 }),
    P('mango-pickles', 'Sweet Mango Pickle', 'Mild and sweet mango pickle.',
      'A sweeter, milder mango pickle.',
      [['250 g', 140], ['500 g', 260], ['1 kg', 480]], { stock: 'low_stock' }),
    P('mango-pickles', 'Homemade-Style Mango Pickle', 'Mango pickle in a homemade style.',
      'A mango pickle made in a homemade style.',
      [['250 g', 170], ['500 g', 320], ['1 kg', 600]], { featured: true }),

    // Red chilli
    P('red-chilli', 'Whole Red Chilli', 'Whole red chillies for cooking.',
      'Whole red chillies for tempering and cooking.',
      [['100 g', 50], ['250 g', 120], ['500 g', 230], ['1 kg', 440]], {}),
    P('red-chilli', 'Dried Red Chilli', 'Sun-dried style red chillies.',
      'Dried red chillies for everyday cooking.',
      [['100 g', 55], ['250 g', 130], ['500 g', 250], ['1 kg', 480]], {}),
    P('red-chilli', 'Red Chilli Powder', 'Ground red chilli powder.',
      'Ground red chilli powder for curries and masalas.',
      [['100 g', 60], ['250 g', 140], ['500 g', 270], ['1 kg', 520]], { featured: true, bestseller: true }),
    P('red-chilli', 'Premium Red Chilli', 'Selected premium-grade red chillies.',
      'A premium selection of red chillies.',
      [['100 g', 80], ['250 g', 190], ['500 g', 360]], { discount: 10 }),
    P('red-chilli', 'Wholesale Red Chilli', 'Bulk red chilli for businesses.',
      'Bulk quantities of red chilli for shops, caterers and food businesses. Contact us for current wholesale rates.',
      [['10 kg', 1900], ['25 kg', 4600]], { wholesale: true, stock: 'out_of_stock' }),

    // Rice
    P('rice', 'Ponni Rice', 'Everyday Ponni rice.',
      'Ponni rice for everyday meals.',
      [['5 kg', 320], ['10 kg', 620], ['25 kg', 1500]], { featured: true, bestseller: true }),
    P('rice', 'Idli Rice', 'Rice suited for idli and dosa batter.',
      'Rice commonly used for idli and dosa batter.',
      [['5 kg', 300], ['10 kg', 580], ['25 kg', 1400]], {}),
    P('rice', 'Basmati Rice', 'Long-grain basmati rice.',
      'Long-grain basmati rice for biryani and pulao.',
      [['1 kg', 140], ['5 kg', 680], ['10 kg', 1320]], { featured: true, discount: 8 }),
    P('rice', 'Sona Masoori Rice', 'Light, everyday Sona Masoori rice.',
      'Sona Masoori rice for daily cooking.',
      [['5 kg', 360], ['10 kg', 700], ['25 kg', 1700]], { bestseller: true }),
    P('rice', 'Raw Rice', 'Raw (unparboiled) rice.',
      'Raw rice for everyday cooking.',
      [['5 kg', 280], ['10 kg', 540], ['25 kg', 1300]], {}),
    P('rice', 'Parboiled Rice', 'Parboiled rice for daily meals.',
      'Parboiled rice for daily meals.',
      [['5 kg', 290], ['10 kg', 560], ['25 kg', 1350]], {})
  ];

  /* ---------- Data access (Supabase REST, keys come from supabase-config.js) ---------- */
  var cache = DEFAULT_PRODUCTS.filter(function (p) { return p.active; });

  function fromRow(r) {
    var slug = r.slug || slugify(r.name);
    var id = r.id ? String(r.id) : 'p-' + slug;
    var packs = r.packs;
    if (typeof packs === 'string') { try { packs = JSON.parse(packs); } catch (e) { packs = []; } }
    packs = packs || [];
    return {
      id: id, slug: slug, name: r.name, category: r.category,
      short: r.short || '', description: r.description || '',
      image: r.image || catImage(r.category, r.name),
      discount: Number(r.discount) || 0, stock: r.stock || 'in_stock',
      featured: !!r.featured, bestseller: !!r.bestseller, wholesale: !!r.wholesale,
      active: r.active !== false,
      ingredients: r.ingredients || '', allergens: r.allergens || '', storage: r.storage || '',
      packs: packs.map(function (k) {
        return { id: id + '-' + slugify(k.label), label: k.label, price: Number(k.price) };
      })
    };
  }

  function load() {
    var sb = window.BT_SUPABASE || {};
    if (!sb.url || !sb.anonKey || /PASTE_/.test(sb.url + sb.anonKey)) return Promise.resolve(cache);
    return fetch(sb.url.replace(/\/$/, '') + '/rest/v1/products?select=*&active=eq.true', {
      headers: { apikey: sb.anonKey, Authorization: 'Bearer ' + sb.anonKey }
    }).then(function (res) {
      if (!res.ok) throw new Error('Supabase ' + res.status);
      return res.json();
    }).then(function (rows) {
      var list = (rows || []).map(fromRow).filter(function (x) { return x.active && x.packs.length; });
      if (list.length) cache = list;
      return cache;
    }).catch(function () { return cache; });
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
  function stockLabel(p) { return STOCK_LABELS[p.stock] || 'Stock unknown'; }

  /* ---------- Image (placeholder tile unless p.image is set) ---------- */
  function xmlEscape(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function imageFor(p) {
    if (p.image) return p.image;
    var cat = getCategory(p.category) || { icon: '🛒', color: '#f3ead4' };
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
      '<rect width="400" height="300" fill="' + cat.color + '"/>' +
      '<text x="200" y="165" font-size="110" text-anchor="middle">' + cat.icon + '</text>' +
      '<text x="200" y="262" font-size="22" text-anchor="middle" fill="#7a1f2b" font-family="sans-serif">' +
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
          '<img src="' + imageFor(p) + '" alt="' + U.escapeHtml(p.name) + '" loading="lazy" width="400" height="300" data-pid="' + p.id + '">' +
          (p.discount ? '<span class="pc-badge">' + p.discount + '% OFF</span>' : '') +
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

  function placeholderFor(id) {
    var q = getById(id);
    if (!q) return '';
    var c = getCategory(q.category);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="' + c.color + '"/><text x="200" y="165" font-size="110" text-anchor="middle">' + c.icon + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  document.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t.tagName === 'IMG' && t.getAttribute('data-pid') && !t.getAttribute('data-fb')) {
      t.setAttribute('data-fb', '1');
      t.src = placeholderFor(t.getAttribute('data-pid'));
    }
  }, true);

  function offersHTML() {
    return cache.filter(function (q) { return q.discount > 0; }).slice(0, 8).map(function (q) {
      return '<a class="offer-tile" href="' + productUrl(q) + '">' +
        '<img src="' + imageFor(q) + '" alt="" loading="lazy" data-pid="' + q.id + '">' +
        '<span class="offer-pct">' + q.discount + '% OFF</span>' +
        '<h3>' + U.escapeHtml(q.name) + '</h3>' +
        '<p>From ' + U.formatINR(fromPrice(q)) + ' <s>' + U.formatINR(fromMrp(q)) + '</s></p></a>';
    }).join('');
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
        return '<a class="cat-card has-photo" href="products.html?category=' + c.id + '" style="--cat-bg:' + c.color + ';--cat-photo:url(\'' + c.photo + '\')">' +
          '<h3>' + c.name + '</h3><p>' + U.escapeHtml(c.blurb) + '</p>' +
          '<span class="cat-count">' + n + ' products</span></a>';
      }).join('');
    }
    var og = document.getElementById('offers-grid');
    if (og) og.innerHTML = offersHTML();
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
        '<div class="pd-image"><img src="' + imageFor(p) + '" alt="' + U.escapeHtml(p.name) + '" width="400" height="300" data-pid="' + p.id + '">' +
          (p.discount ? '<span class="pc-badge">' + p.discount + '% OFF</span>' : '') + '</div>' +
        '<div class="pd-info">' +
          '<p class="pc-cat">' + U.escapeHtml(cat ? cat.name : '') + '</p>' +
          '<h1>' + U.escapeHtml(p.name) + '</h1>' +
          '<p class="pd-short">' + U.escapeHtml(p.short) + '</p>' +
          '<p class="pd-price"><span id="pd-price" class="price-now"></span> <span id="pd-mrp" class="price-old"></span></p>' +
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
