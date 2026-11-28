/* ==========================================================
   BRIT.TUNA  MARKET UI  (adds the category strip, ribbon,
   quick filters + sort row and discount badges).
   Nothing here changes your data or your existing code.
========================================================== */
(function () {
  'use strict';

  var P = window.BTProducts;
  var path = location.pathname;
  var page = (path.split('/').pop() || 'index.html').toLowerCase();
  var SHOW_STRIP = [];

  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- category strip (home, details, wishlist) ---------- */

  var LIST_PAGES = ['shop.html', 'products.html'];
  var isList = LIST_PAGES.indexOf(page) !== -1;

  function curCat() {
    try { return new URLSearchParams(location.search).get('category') || ''; } catch (e) { return ''; }
  }

  function catList() { return (P && P.categories) ? P.categories : []; }

  function buildStrip() {
    if ($('#mk-cats') || isList || SHOW_STRIP.indexOf(page) === -1) return;
    var header = $('#site-header');
    if (!header || !header.firstChild) return;
    var cats = catList();
    if (!cats.length) return;

    var U = 'https://images.unsplash.com/photo-';
    var PH = {
      'all': U + '1542838132-92c53300491e',
      'peanuts': U + '1567892320421-1c657571ea4a',
      'mango-pickles': U + '1601050690597-df0568f70950',
      'red-chilli': U + '1588252303782-cb80119abd6d',
      'rice': U + '1586201375761-83865001e31c'
    };
    function ph(id) { return PH[id] ? PH[id] + '?auto=format&fit=crop&w=240&q=70' : ''; }
    var items = cats.map(function (c) {
      var img = ph(c.id);
      return '<a class="mk-cat" href="shop.html?category=' + encodeURIComponent(c.id) + '">' +
        '<span class="mk-cat-ico' + (img ? ' has-img' : '') + '" style="background-color:' + esc(c.color) +
        (img ? ';--img:url(\'' + img + '\')' : '') + '" aria-hidden="true">' + esc(c.icon) + '</span>' +
        '<span>' + esc(c.name) + '</span></a>';
    }).join('');
    var all = '<a class="mk-cat" href="shop.html"><span class="mk-cat-ico has-img" style="--img:url(\'' + ph('all') + '\')" aria-hidden="true">🛍️</span><span>All</span></a>';

    var wrap = document.createElement('div');
    wrap.id = 'mk-cats';
    wrap.className = 'mk-cats';
    wrap.innerHTML = '<nav class="container mk-cats-inner" aria-label="Shop by category">' +
      '<div class="mk-cats-track">' + all + items + '</div></nav>';
    header.parentNode.insertBefore(wrap, header.nextSibling);
  }

  /* ---------- moving message bar (home page) ---------- */
  function buildMarquee() {
    if ($('#mk-marquee')) return;
    var header = $('#site-header');
    if (!header || !header.firstChild) return;
    var msgs = ['Cash on Delivery available', 'Fresh peanuts, mango pickles, red chilli &amp; rice', 'Direct from sellers \u2022 Quality checked', 'Order on WhatsApp for any help'];
    var one = msgs.map(function (m) { return '<span>' + m + '</span>'; }).join('');
    var bar = document.createElement('div');
    bar.id = 'mk-marquee';
    bar.className = 'mk-marquee';
    bar.setAttribute('aria-label', 'Store announcements');
    bar.innerHTML = '<div class="mk-marquee-track"><div class="mk-marquee-set">' + one +
      '</div><div class="mk-marquee-set" aria-hidden="true">' + one + '</div></div>';
    header.parentNode.insertBefore(bar, header);
  }

  /* ---------- Blinkit-style list: category rail + compact grid ---------- */

  function headerHeight() {
    var h = $('#site-header');
    var v = h ? Math.round(h.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty('--hdr', v + 'px');
  }

  function buildList() {
    if (!isList || $('#bk-rail')) return;
    var body = $('.page-body');
    var cats = catList();
    if (!body || !cats.length) return;

    document.body.classList.add('bk-on');

    var rail = document.createElement('aside');
    rail.id = 'bk-rail';
    rail.className = 'bk-rail';
    rail.setAttribute('aria-label', 'Categories');

    var shop = page === 'shop.html';
    function item(id, name, icon, color) {
      var href = id ? (shop ? 'shop.html?category=' + encodeURIComponent(id) : 'products.html?category=' + encodeURIComponent(id)) : 'shop.html';
      return '<a class="bk-cat" data-cat="' + esc(id) + '" href="' + href + '">' +
        '<span class="bk-ico" style="background:' + esc(color) + '" aria-hidden="true">' + esc(icon) + '</span>' +
        '<span class="bk-name">' + esc(name) + '</span></a>';
    }
    rail.innerHTML = item('', 'All', '🛍️', '#fff3c4') + cats.map(function (c) { return item(c.id, c.name, c.icon, c.color); }).join('');

    var main = document.createElement('div');
    main.className = 'bk-main';
    while (body.firstChild) main.appendChild(body.firstChild);
    body.classList.add('bk-wrap');
    body.appendChild(rail);
    body.appendChild(main);

    var title = document.createElement('h2');
    title.id = 'bk-title';
    title.className = 'bk-title';
    main.insertBefore(title, main.firstChild);

    rail.addEventListener('click', function (e) {
      var a = e.target.closest('.bk-cat');
      if (!a || !shop) return;
      var sel = $('#category-filter');
      if (!sel) return;
      e.preventDefault();
      var id = a.getAttribute('data-cat') || 'all';
      var has = Array.prototype.some.call(sel.options, function (o) { return o.value === id; });
      sel.value = has ? id : (sel.options[0] ? sel.options[0].value : '');
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      try { history.replaceState(null, '', id === 'all' ? 'shop.html' : 'shop.html?category=' + encodeURIComponent(id)); } catch (x) {}
      paintRail();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    headerHeight();
    paintRail();
  }

  function paintRail() {
    var rail = $('#bk-rail');
    if (!rail) return;
    var id = curCat();
    var sel = $('#category-filter');
    if (page === 'shop.html' && sel && sel.value && sel.value !== 'all') id = sel.value;
    if (page === 'shop.html' && sel && sel.value === 'all') id = '';
    var name = 'All products';
    Array.prototype.forEach.call(rail.querySelectorAll('.bk-cat'), function (a) {
      var on = (a.getAttribute('data-cat') || '') === id;
      a.classList.toggle('is-on', on);
      if (on && id) name = (a.querySelector('.bk-name') || {}).textContent || name;
    });
    var t = $('#bk-title');
    if (t && t.textContent !== name) t.textContent = name;
    var on = $('.bk-cat.is-on', rail);
    if (on && !rail._seen) { rail._seen = 1; on.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  }

  /* ---------- quick filters + sort (shop page) ---------- */

  function buildQuickFilters() {
    if (page !== 'shop.html' || $('#mk-qf')) return;
    var toolbar = $('.shop-toolbar');
    var price = $('#price-filter'), sort = $('#sort-select'), reset = $('#reset-filters');
    if (!toolbar || !price || !sort || price.options.length < 2 || sort.options.length < 2) return;

    var bar = document.createElement('div');
    bar.id = 'mk-qf';
    bar.className = 'mk-qf';

    var chips = Array.prototype.map.call(price.options, function (o) {
      return '<button type="button" class="mk-chip" data-v="' + esc(o.value) + '">' + esc(o.value === 'all' ? 'All prices' : o.textContent) + '</button>';
    }).join('');

    bar.innerHTML = '<div class="mk-qf-left"><span class="mk-qf-title">Quick filters :</span>' + chips +
      '<button type="button" class="mk-chip" data-reset="1">Clear</button></div>' +
      '<label class="mk-sort">Sort By : <select aria-label="Sort products"></select></label>';

    toolbar.parentNode.insertBefore(bar, toolbar);
    toolbar.classList.add('mk-hidden');

    var mySort = $('select', bar);
    mySort.innerHTML = sort.innerHTML;
    mySort.value = sort.value;

    function paint() {
      Array.prototype.forEach.call(bar.querySelectorAll('.mk-chip[data-v]'), function (b) {
        b.classList.toggle('is-on', b.getAttribute('data-v') === price.value);
      });
      mySort.value = sort.value;
    }

    bar.addEventListener('click', function (e) {
      var b = e.target.closest('.mk-chip');
      if (!b) return;
      if (b.getAttribute('data-reset')) {
        if (reset) reset.click();
      } else {
        price.value = b.getAttribute('data-v');
        price.dispatchEvent(new Event('change', { bubbles: true }));
      }
      setTimeout(paint, 30);
    });

    mySort.addEventListener('change', function () {
      sort.value = mySort.value;
      sort.dispatchEvent(new Event('change', { bubbles: true }));
    });

    paint();
  }

  /* ---------- card extras: pack size + "N options" ---------- */

  function decorate() {
    if (!P || !P.getById) return;
    Array.prototype.forEach.call(document.querySelectorAll('.product-card:not(.bk-done)'), function (card) {
      var img = card.querySelector('img[data-pid]');
      if (!img) return;
      var p = P.getById(img.getAttribute('data-pid'));
      if (!p) return;
      card.classList.add('bk-done');
      var packs = P.availablePacks ? P.availablePacks(p) : (p.packs || []);
      var first = (P.firstAvailablePack && P.firstAvailablePack(p)) || (p.packs && p.packs[0]);
      var name = card.querySelector('.pc-name');
      if (name && first && first.label && !card.querySelector('.bk-size')) {
        var s = document.createElement('p');
        s.className = 'bk-size';
        s.textContent = first.label;
        name.insertAdjacentElement('afterend', s);
      }
      if (packs.length > 1) {
        card.classList.add('bk-multi');
        var act = card.querySelector('.pc-actions');
        if (act && !card.querySelector('.bk-opt')) {
          var o = document.createElement('p');
          o.className = 'bk-opt';
          o.textContent = packs.length + ' options';
          act.insertAdjacentElement('afterend', o);
        }
      }
    });
  }

  /* multi-pack products: ADD opens the pack chooser (quick view) */
  document.addEventListener('click', function (e) {
    var add = e.target.closest && e.target.closest('.product-card.bk-multi .js-add-card');
    if (!add) return;
    var q = add.closest('.product-card').querySelector('.ft-quick');
    if (!q) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    q.click();
  }, true);

  /* ---------- product animations: reveal on scroll ---------- */
  var rvObs = null;
  function reveal() {
    var nodes = document.querySelectorAll('.product-card:not([data-rv]), .offer-tile:not([data-rv])');
    if (!nodes.length) return;
    if (!('IntersectionObserver' in window) ||
        (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      for (var k = 0; k < nodes.length; k++) nodes[k].setAttribute('data-rv', '1');
      return;
    }
    if (!rvObs) {
      rvObs = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('mk-in'); rvObs.unobserve(e.target); }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    }
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      n.setAttribute('data-rv', '1');
      n.style.setProperty('--d', (i % 6) * 70 + 'ms');
      n.classList.add('mk-rv');
      rvObs.observe(n);
    }
  }

  /* ---------- start ---------- */

  function run() {
    buildStrip();
    buildMarquee();
    buildList();
    buildQuickFilters();
    decorate();
    reveal();
    paintRail();
  }

  /* home: background photo only behind the hero; it scrolls away with it */
  function heroBg() {
    if (document.body.getAttribute('data-page') !== 'home') return;
    var hero = document.querySelector('.hero');
    if (!hero) return;
    function size() {
      var r = hero.getBoundingClientRect();
      var h = Math.max(0, Math.round(r.bottom + (window.pageYOffset || 0)));
      document.documentElement.style.setProperty('--hero-h', h + 'px');
    }
    size();
    window.addEventListener('resize', size);
    window.addEventListener('load', size);
    setTimeout(size, 600);
    setTimeout(size, 1800);
  }

  function start() {
    heroBg();
    run();
    window.addEventListener('resize', headerHeight);
    setTimeout(headerHeight, 400);
    if ('MutationObserver' in window) {
      var wait = false;
      new MutationObserver(function () {
        if (wait) return;
        wait = true;
        requestAnimationFrame(function () { wait = false; run(); });
      }).observe(document.body, { childList: true, subtree: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
