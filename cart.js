/* ==========================================================
   cart.js — Brit.Tuna frontend cart

   Customer must be logged in before adding products.

   If customer is not logged in:
   1. Save pending cart action
   2. Redirect to login.html
   3. After login, pending action can be restored

   Cart data is stored in localStorage for now.

   IMPORTANT:
   This browser cart is NOT a real order.
   Prices and payments must later be verified by the backend.
   ========================================================== */

(function () {
  'use strict';

  var U = window.BTUtil;

  var KEY = 'britTunaCartDemo_v1';
  var PENDING_KEY = 'britTunaPendingCartAction';
  var AFTER_LOGIN_KEY = 'britTunaAfterLogin';

  var MAX_QTY = 99;


  /* ==========================================================
     QUANTITY
     ========================================================== */

  function clampQty(n) {
    n = parseInt(n, 10);

    if (!n || n < 1) {
      return 1;
    }

    if (n > MAX_QTY) {
      return MAX_QTY;
    }

    return n;
  }


  /* ==========================================================
     STORAGE
     ========================================================== */

  function read() {
    try {
      var raw = window.localStorage.getItem(KEY);

      var arr = raw ? JSON.parse(raw) : [];

      if (!Array.isArray(arr)) {
        return [];
      }

      return arr
        .filter(function (i) {
          return (
            i &&
            typeof i.productId === 'string' &&
            typeof i.packId === 'string' &&
            window.BTProducts &&
            window.BTProducts.getVariant(
              i.productId,
              i.packId
            )
          );
        })
        .map(function (i) {
          return {
            productId: i.productId,
            packId: i.packId,
            qty: clampQty(i.qty)
          };
        });

    } catch (e) {
      console.error(
        'Brit.Tuna: Could not read cart.',
        e
      );

      return [];
    }
  }


  function write(items) {
    try {
      window.localStorage.setItem(
        KEY,
        JSON.stringify(items)
      );

    } catch (e) {
      console.error(
        'Brit.Tuna: Could not save cart.',
        e
      );
    }

    document.dispatchEvent(
      new CustomEvent('bt:cart-changed')
    );
  }


  /* ==========================================================
     AUTH
     ========================================================== */

  async function getSession() {

    if (!window.supabaseClient) {
      console.error(
        'Brit.Tuna: Supabase client is not available.'
      );

      return null;
    }

    try {

      var result =
        await window.supabaseClient.auth.getSession();

      if (result.error) {
        console.error(
          'Brit.Tuna: Session error:',
          result.error
        );

        return null;
      }

      return result.data.session;

    } catch (error) {

      console.error(
        'Brit.Tuna: Unable to check login session.',
        error
      );

      return null;
    }
  }


  /* ==========================================================
     SAVE PENDING ADD-TO-CART ACTION
     ========================================================== */

  function savePendingCartAction(
    productId,
    packId,
    qty
  ) {

    try {

      window.localStorage.setItem(
        PENDING_KEY,
        JSON.stringify({
          productId: productId,
          packId: packId,
          qty: clampQty(qty)
        })
      );

      /*
       After successful login,
       customer should continue to cart.html
      */

      window.localStorage.setItem(
        AFTER_LOGIN_KEY,
        'cart.html'
      );

    } catch (error) {

      console.error(
        'Brit.Tuna: Could not save pending cart action.',
        error
      );
    }
  }


  /* ==========================================================
     INTERNAL ADD
     No authentication check here.

     Used after customer is already authenticated.
     ========================================================== */

  function addDirect(
    productId,
    packId,
    qty
  ) {

    if (!window.BTProducts) {
      console.error(
        'Brit.Tuna: BTProducts is not available.'
      );

      return false;
    }

    var v =
      window.BTProducts.getVariant(
        productId,
        packId
      );

    if (!v) {
      console.error(
        'Brit.Tuna: Product variant not found.'
      );

      return false;
    }

    if (
      v.product.stock === 'out_of_stock'
    ) {
      return false;
    }

    var items = read();

    var found = null;

    items.forEach(function (i) {

      if (
        i.productId === productId &&
        i.packId === packId
      ) {
        found = i;
      }

    });


    if (found) {

      found.qty =
        clampQty(
          found.qty +
          clampQty(qty)
        );

    } else {

      items.push({
        productId: productId,
        packId: packId,
        qty: clampQty(qty)
      });

    }

    write(items);

    return true;
  }


  /* ==========================================================
     ADD TO CART

     Login required.
     ========================================================== */

  async function add(
    productId,
    packId,
    qty
  ) {

    /*
      First validate product
    */

    if (!window.BTProducts) {

      console.error(
        'Brit.Tuna: Products are not loaded.'
      );

      return false;
    }


    var variant =
      window.BTProducts.getVariant(
        productId,
        packId
      );


    if (!variant) {

      console.error(
        'Brit.Tuna: Invalid product or pack.'
      );

      return false;
    }


    if (
      variant.product.stock ===
      'out_of_stock'
    ) {

      return false;
    }


    /*
      Check login
    */

    var session =
      await getSession();


    /*
      NOT LOGGED IN
    */

    if (!session) {

      savePendingCartAction(
        productId,
        packId,
        qty
      );


      /*
        Redirect to login page
      */

      window.location.href =
        'login.html';

      return false;
    }


    /*
      LOGGED IN
      Add normally
    */

    return addDirect(
      productId,
      packId,
      qty
    );
  }


  /* ==========================================================
     RESTORE PENDING CART ACTION

     We will call this after successful login.
     ========================================================== */

  async function restorePendingAction() {

    var session =
      await getSession();


    if (!session) {
      return false;
    }


    var raw = null;

    try {

      raw =
        window.localStorage.getItem(
          PENDING_KEY
        );

    } catch (error) {

      return false;
    }


    if (!raw) {
      return false;
    }


    var pending = null;


    try {

      pending =
        JSON.parse(raw);

    } catch (error) {

      window.localStorage.removeItem(
        PENDING_KEY
      );

      return false;
    }


    if (
      !pending ||
      !pending.productId ||
      !pending.packId
    ) {

      window.localStorage.removeItem(
        PENDING_KEY
      );

      return false;
    }


    var success =
      addDirect(
        pending.productId,
        pending.packId,
        pending.qty
      );


    if (success) {

      window.localStorage.removeItem(
        PENDING_KEY
      );

      return true;
    }


    return false;
  }


  /* ==========================================================
     SET QUANTITY
     ========================================================== */

  function setQty(
    productId,
    packId,
    qty
  ) {

    var items = read();


    items.forEach(function (i) {

      if (
        i.productId === productId &&
        i.packId === packId
      ) {

        i.qty =
          clampQty(qty);
      }

    });


    write(items);
  }


  /* ==========================================================
     REMOVE
     ========================================================== */

  function remove(
    productId,
    packId
  ) {

    var items =
      read().filter(
        function (i) {

          return !(
            i.productId === productId &&
            i.packId === packId
          );

        }
      );


    write(items);
  }


  /* ==========================================================
     CLEAR CART
     ========================================================== */

  function clear() {

    write([]);

  }


  /* ==========================================================
     CART COUNT
     ========================================================== */

  function count() {

    return read().reduce(
      function (n, i) {

        return n + i.qty;

      },
      0
    );
  }


  /* ==========================================================
     CART LINES
     ========================================================== */

  function lines() {

    if (!window.BTProducts) {
      return [];
    }


    return read().map(
      function (i) {

        var v =
          window.BTProducts.getVariant(
            i.productId,
            i.packId
          );


        var unit =
          window.BTProducts.salePrice(
            v.pack.price,
            v.product.discount
          );


        return {

          product: v.product,

          pack: v.pack,

          qty: i.qty,

          mrpUnit:
            v.pack.price,

          unit: unit,

          lineTotal:
            unit * i.qty

        };

      }
    );
  }


  /* ==========================================================
     TOTALS
     ========================================================== */

  function totals() {

    var ls = lines();

    var mrp = 0;

    var subtotal = 0;

    var items = 0;


    ls.forEach(
      function (l) {

        mrp +=
          l.mrpUnit *
          l.qty;


        subtotal +=
          l.lineTotal;


        items +=
          l.qty;

      }
    );


    return {

      itemCount: items,

      mrpTotal: mrp,

      savings:
        mrp - subtotal,

      subtotal: subtotal,

      total: subtotal

    };
  }


  /* ==========================================================
     CART LINE HTML
     ========================================================== */

  function lineHTML(l) {

    var url =
      window.BTProducts.productUrl(
        l.product
      );


    return '' +

      '<article class="cart-line" ' +

      'data-product="' +
      l.product.id +

      '" data-pack="' +
      l.pack.id +

      '">' +


      '<a class="cart-img" href="' +
      url +
      '">' +

      '<img src="' +
      window.BTProducts.imageFor(
        l.product
      ) +

      '" alt="' +
      U.escapeHtml(
        l.product.name
      ) +

      '" width="96" height="72">' +

      '</a>' +


      '<div class="cart-info">' +

      '<h3>' +

      '<a href="' +
      url +
      '">' +

      U.escapeHtml(
        l.product.name
      ) +

      '</a>' +

      '</h3>' +


      '<p class="cart-meta">' +

      'Pack: ' +

      U.escapeHtml(
        l.pack.label
      ) +

      ' · ' +

      U.formatINR(
        l.unit
      ) +

      ' each' +

      '</p>' +


      '<button type="button" ' +

      'class="link-btn" ' +

      'data-action="remove">' +

      'Remove' +

      '</button>' +

      '</div>' +


      '<div class="qty">' +

      '<button type="button" ' +

      'data-action="dec" ' +

      'aria-label="Decrease quantity">' +

      '−' +

      '</button>' +


      '<input type="number" ' +

      'min="1" ' +

      'max="99" ' +

      'value="' +
      l.qty +

      '" data-action="set" ' +

      'aria-label="Quantity for ' +

      U.escapeHtml(
        l.product.name
      ) +

      '">' +


      '<button type="button" ' +

      'data-action="inc" ' +

      'aria-label="Increase quantity">' +

      '+' +

      '</button>' +

      '</div>' +


      '<p class="cart-total">' +

      U.formatINR(
        l.lineTotal
      ) +

      '</p>' +


      '</article>';
  }


  /* ==========================================================
     SUMMARY
     ========================================================== */

  function summaryRows(t) {

    return '' +

      '<div class="summary-row">' +

      '<span>Items (' +
      t.itemCount +
      ')</span>' +

      '<span>' +
      U.formatINR(
        t.mrpTotal
      ) +
      '</span>' +

      '</div>' +


      (
        t.savings > 0

          ?

          '<div class="summary-row summary-save">' +

          '<span>Demo discount</span>' +

          '<span>− ' +

          U.formatINR(
            t.savings
          ) +

          '</span>' +

          '</div>'

          :

          ''
      ) +


      '<div class="summary-row">' +

      '<span>Subtotal</span>' +

      '<span>' +

      U.formatINR(
        t.subtotal
      ) +

      '</span>' +

      '</div>' +


      '<div class="summary-row">' +

      '<span>Shipping</span>' +

      '<span>Not configured yet</span>' +

      '</div>' +


      '<div class="summary-row summary-total">' +

      '<span>Total</span>' +

      '<span>' +

      U.formatINR(
        t.total
      ) +

      '</span>' +

      '</div>';
  }


  /* ==========================================================
     RENDER CART PAGE
     ========================================================== */

  function renderCartPage() {

    var empty =
      document.getElementById(
        'cart-empty'
      );


    var content =
      document.getElementById(
        'cart-content'
      );


    var itemsEl =
      document.getElementById(
        'cart-items'
      );


    var sumEl =
      document.getElementById(
        'cart-summary'
      );


    if (!itemsEl) {
      return;
    }


    var ls = lines();


    if (!ls.length) {

      if (empty) {
        empty.hidden = false;
      }

      if (content) {
        content.hidden = true;
      }

      return;
    }


    if (empty) {
      empty.hidden = true;
    }


    if (content) {
      content.hidden = false;
    }


    itemsEl.innerHTML =
      ls.map(
        lineHTML
      ).join('');


    if (sumEl) {

      sumEl.innerHTML =

        '<h2>Order summary</h2>' +

        summaryRows(
          totals()
        ) +

        '<p class="notice notice-small">' +

        'Demo prices. Final prices must be verified by the backend before payment.' +

        '</p>' +

        '<a class="btn btn-primary btn-block" ' +

        'href="checkout.html">' +

        'Proceed to Checkout' +

        '</a>' +

        '<a class="btn btn-outline btn-block" ' +

        'href="shop.html">' +

        'Continue Shopping' +

        '</a>';

    }
  }


  /* ==========================================================
     CHECKOUT SUMMARY
     ========================================================== */

  function renderCheckoutSummary() {

    var el =
      document.getElementById(
        'checkout-summary'
      );


    if (!el) {
      return;
    }


    var ls = lines();


    if (!ls.length) {

      el.innerHTML =

        '<h2>Order summary</h2>' +

        '<p>Your cart is empty.</p>' +

        '<a class="btn btn-primary btn-block" ' +

        'href="shop.html">' +

        'Go to Shop' +

        '</a>';


      return;
    }


    el.innerHTML =

      '<h2>Order summary</h2>' +

      '<ul class="summary-list">' +

      ls.map(
        function (l) {

          return (

            '<li>' +

            '<span>' +

            U.escapeHtml(
              l.product.name
            ) +

            ' (' +

            U.escapeHtml(
              l.pack.label
            ) +

            ') × ' +

            l.qty +

            '</span>' +

            '<span>' +

            U.formatINR(
              l.lineTotal
            ) +

            '</span>' +

            '</li>'

          );

        }
      ).join('') +

      '</ul>' +

      summaryRows(
        totals()
      );
  }


  /* ==========================================================
     RENDER ALL
     ========================================================== */

  function renderAll() {

    renderCartPage();

    renderCheckoutSummary();

  }


  /* ==========================================================
     CART BUTTON EVENTS
     ========================================================== */

  document.addEventListener(
    'click',
    function (e) {

      var btn =
        e.target.closest(
          '[data-action]'
        );


      var line =
        e.target.closest(
          '.cart-line'
        );


      if (
        !btn ||
        !line
      ) {
        return;
      }


      var pid =
        line.getAttribute(
          'data-product'
        );


      var kid =
        line.getAttribute(
          'data-pack'
        );


      var action =
        btn.getAttribute(
          'data-action'
        );


      var current = 1;


      read().forEach(
        function (i) {

          if (
            i.productId === pid &&
            i.packId === kid
          ) {

            current =
              i.qty;
          }

        }
      );


      if (
        action === 'remove'
      ) {

        remove(
          pid,
          kid
        );

      } else if (
        action === 'inc'
      ) {

        setQty(
          pid,
          kid,
          current + 1
        );

      } else if (
        action === 'dec'
      ) {

        setQty(
          pid,
          kid,
          current - 1
        );

      }

    }
  );


  /* ==========================================================
     QUANTITY INPUT
     ========================================================== */

  document.addEventListener(
    'change',
    function (e) {

      var input =
        e.target.closest(
          'input[data-action="set"]'
        );


      var line =
        e.target.closest(
          '.cart-line'
        );


      if (
        !input ||
        !line
      ) {
        return;
      }


      setQty(

        line.getAttribute(
          'data-product'
        ),

        line.getAttribute(
          'data-pack'
        ),

        input.value

      );

    }
  );


  /* ==========================================================
     CART CHANGE
     ========================================================== */

  document.addEventListener(
    'bt:cart-changed',
    renderAll
  );


  /* ==========================================================
     OTHER TAB CART CHANGE
     ========================================================== */

  window.addEventListener(
    'storage',
    function (e) {

      if (
        e.key === KEY
      ) {

        document.dispatchEvent(
          new CustomEvent(
            'bt:cart-changed'
          )
        );

      }

    }
  );


  /* ==========================================================
     PAGE LOAD
     ========================================================== */

  document.addEventListener(
    'DOMContentLoaded',
    renderAll
  );


  /* ==========================================================
     PUBLIC API
     ========================================================== */

  window.BTCart = {

    add: add,

    addDirect: addDirect,

    restorePendingAction:
      restorePendingAction,

    setQty: setQty,

    remove: remove,

    clear: clear,

    count: count,

    lines: lines,

    totals: totals

  };

})();
