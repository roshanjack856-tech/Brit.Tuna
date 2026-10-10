/* ==========================================================
   cart.js — DEMO cart stored in this browser's localStorage.

   Only product IDs, pack IDs and quantities are stored. Prices are
   always recalculated from products.js, so this is the one place to
   swap in server-verified prices later.

   !! The browser cart is NOT an order. Real totals and payment must
   be created and verified on a trusted backend. !!

   Element IDs used by the pages:
   - cart.html ......... #cart-empty, #cart-content, #cart-items, #cart-summary
   - checkout.html ..... #checkout-summary
   Set <body data-page="cart"> or <body data-page="checkout">.
   ========================================================== */
(function () {
  'use strict';
  var U = window.BTUtil;
  var KEY = 'britTunaCartDemo_v1';
  var MAX_QTY = 99;

  function clampQty(n) {
    n = parseInt(n, 10);
    if (!n || n < 1) return 1;
    return n > MAX_QTY ? MAX_QTY : n;
  }

  /* ---------- Storage ---------- */
  function read() {
    try {
      var raw = window.localStorage.getItem(KEY);
      var arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return [];
      return arr
        .filter(function (i) {
          return i && typeof i.productId === 'string' && typeof i.packId === 'string' &&
            window.BTProducts.getVariant(i.productId, i.packId);
        })
        .map(function (i) {
          return { productId: i.productId, packId: i.packId, qty: clampQty(i.qty) };
        });
    } catch (e) {
      return [];
    }
  }
  function write(items) {
    try { window.localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* storage blocked */ }
    document.dispatchEvent(new CustomEvent('bt:cart-changed'));
  }

  /* ---------- Cart actions ---------- */
  function add(productId, packId, qty) {
    var v = window.BTProducts.getVariant(productId, packId);
    if (!v || v.product.stock === 'out_of_stock') return false;
    var items = read();
    var found = null;
    items.forEach(function (i) { if (i.productId === productId && i.packId === packId) found = i; });
    if (found) found.qty = clampQty(found.qty + clampQty(qty));
    else items.push({ productId: productId, packId: packId, qty: clampQty(qty) });
    write(items);
    return true;
  }
  function setQty(productId, packId, qty) {
    var items = read();
    items.forEach(function (i) {
      if (i.productId === productId && i.packId === packId) i.qty = clampQty(qty);
    });
    write(items);
  }
  function remove(productId, packId) {
    write(read().filter(function (i) { return !(i.productId === productId && i.packId === packId); }));
  }
  function clear() { write([]); }
  function count() {
    return read().reduce(function (n, i) { return n + i.qty; }, 0);
  }

  /* ---------- Calculations (replace with server-verified prices later) ---------- */
  function lines() {
    return read().map(function (i) {
      var v = window.BTProducts.getVariant(i.productId, i.packId);
      var unit = window.BTProducts.salePrice(v.pack.price, v.product.discount);
      return {
        product: v.product,
        pack: v.pack,
        qty: i.qty,
        mrpUnit: v.pack.price,
        unit: unit,
        lineTotal: unit * i.qty
      };
    });
  }
  function totals() {
    var ls = lines();
    var mrp = 0, subtotal = 0, items = 0;
    ls.forEach(function (l) {
      mrp += l.mrpUnit * l.qty;
      subtotal += l.lineTotal;
      items += l.qty;
    });
    // Shipping and taxes are not configured yet, so they are not included.
    return { itemCount: items, mrpTotal: mrp, savings: mrp - subtotal, subtotal: subtotal, total: subtotal };
  }

  /* ---------- Rendering ---------- */
  function lineHTML(l) {
    var url = window.BTProducts.productUrl(l.product);
    return '' +
      '<article class="cart-line" data-product="' + l.product.id + '" data-pack="' + l.pack.id + '">' +
        '<a class="cart-img" href="' + url + '"><img src="' + window.BTProducts.imageFor(l.product) + '" alt="' + U.escapeHtml(l.product.name) + '" width="96" height="72"></a>' +
        '<div class="cart-info">' +
          '<h3><a href="' + url + '">' + U.escapeHtml(l.product.name) + '</a></h3>' +
          '<p class="cart-meta">Pack: ' + U.escapeHtml(l.pack.label) + ' · ' + U.formatINR(l.unit) + ' each</p>' +
          '<button type="button" class="link-btn" data-action="remove">Remove</button>' +
        '</div>' +
        '<div class="qty">' +
          '<button type="button" data-action="dec" aria-label="Decrease quantity">−</button>' +
          '<input type="number" min="1" max="99" value="' + l.qty + '" data-action="set" aria-label="Quantity for ' + U.escapeHtml(l.product.name) + '">' +
          '<button type="button" data-action="inc" aria-label="Increase quantity">+</button>' +
        '</div>' +
        '<p class="cart-total">' + U.formatINR(l.lineTotal) + '</p>' +
      '</article>';
  }

  function summaryRows(t) {
    return '' +
      '<div class="summary-row"><span>Items (' + t.itemCount + ')</span><span>' + U.formatINR(t.mrpTotal) + '</span></div>' +
      (t.savings > 0 ? '<div class="summary-row summary-save"><span>Demo discount</span><span>− ' + U.formatINR(t.savings) + '</span></div>' : '') +
      '<div class="summary-row"><span>Subtotal</span><span>' + U.formatINR(t.subtotal) + '</span></div>' +
      '<div class="summary-row"><span>Shipping</span><span>Not configured yet</span></div>' +
      '<div class="summary-row summary-total"><span>Total</span><span>' + U.formatINR(t.total) + '</span></div>';
  }

  function renderCartPage() {
    var empty = document.getElementById('cart-empty');
    var content = document.getElementById('cart-content');
    var itemsEl = document.getElementById('cart-items');
    var sumEl = document.getElementById('cart-summary');
    if (!itemsEl) return;
    var ls = lines();
    if (!ls.length) {
      if (empty) empty.hidden = false;
      if (content) content.hidden = true;
      return;
    }
    if (empty) empty.hidden = true;
    if (content) content.hidden = false;
    itemsEl.innerHTML = ls.map(lineHTML).join('');
    if (sumEl) {
      sumEl.innerHTML = '<h2>Order summary</h2>' + summaryRows(totals()) +
        '<p class="notice notice-small">Demo prices. Final prices must be verified by the backend before payment.</p>' +
        '<a class="btn btn-primary btn-block" href="checkout.html">Proceed to Checkout</a>' +
        '<a class="btn btn-outline btn-block" href="shop.html">Continue Shopping</a>';
    }
  }

  function renderCheckoutSummary() {
    var el = document.getElementById('checkout-summary');
    if (!el) return;
    var ls = lines();
    if (!ls.length) {
      el.innerHTML = '<h2>Order summary</h2><p>Your cart is empty.</p><a class="btn btn-primary btn-block" href="shop.html">Go to Shop</a>';
      return;
    }
    el.innerHTML = '<h2>Order summary</h2>' +
      '<ul class="summary-list">' + ls.map(function (l) {
        return '<li><span>' + U.escapeHtml(l.product.name) + ' (' + U.escapeHtml(l.pack.label) + ') × ' + l.qty +
          '</span><span>' + U.formatINR(l.lineTotal) + '</span></li>';
      }).join('') + '</ul>' + summaryRows(totals());
  }

  function renderAll() {
    renderCartPage();
    renderCheckoutSummary();
  }

  /* ---------- Cart page events ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    var line = e.target.closest('.cart-line');
    if (!btn || !line) return;
    var pid = line.getAttribute('data-product');
    var kid = line.getAttribute('data-pack');
    var action = btn.getAttribute('data-action');
    var current = 1;
    read().forEach(function (i) { if (i.productId === pid && i.packId === kid) current = i.qty; });
    if (action === 'remove') remove(pid, kid);
    else if (action === 'inc') setQty(pid, kid, current + 1);
    else if (action === 'dec') setQty(pid, kid, current - 1);
  });
  document.addEventListener('change', function (e) {
    var input = e.target.closest('input[data-action="set"]');
    var line = e.target.closest('.cart-line');
    if (!input || !line) return;
    setQty(line.getAttribute('data-product'), line.getAttribute('data-pack'), input.value);
  });
  document.addEventListener('bt:cart-changed', renderAll);
  window.addEventListener('storage', function (e) {
    if (e.key === KEY) {
      document.dispatchEvent(new CustomEvent('bt:cart-changed'));
    }
  });
  document.addEventListener('DOMContentLoaded', renderAll);

  window.BTCart = {
    add: add,
    setQty: setQty,
    remove: remove,
    clear: clear,
    count: count,
    lines: lines,
    totals: totals
  };
})();