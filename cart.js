/* ==========================================================
   cart.js — Brit.Tuna
   Supabase-ready frontend cart

   IMPORTANT:
   - Cart is stored in localStorage.
   - Login is required before Add to Cart.
   - Product/variant prices come from BTProducts.
   - This does NOT create a real order.
   - Backend must verify price and stock before payment.
   ========================================================== */

(function () {
  'use strict';

  var KEY = 'britTunaCartDemo_v1';
  var PENDING_KEY = 'britTunaPendingCartAction';
  var AFTER_LOGIN_KEY = 'britTunaAfterLogin';

  var MAX_QTY = 99;

  /* ==========================================================
     UTILITIES
  ========================================================== */

  function getUtil() {
    return window.BTUtil || null;
  }

  function escapeHtml(value) {
    var U = getUtil();

    if (
      U &&
      typeof U.escapeHtml === 'function'
    ) {
      return U.escapeHtml(
        String(value || '')
      );
    }

    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatINR(value) {
    var U = getUtil();

    if (
      U &&
      typeof U.formatINR === 'function'
    ) {
      return U.formatINR(
        Number(value || 0)
      );
    }

    try {
      return new Intl.NumberFormat(
        'en-IN',
        {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0
        }
      ).format(
        Number(value || 0)
      );
    } catch (error) {
      return (
        '₹' +
        Number(value || 0)
      );
    }
  }

  function clampQty(value) {
    var qty =
      parseInt(
        value,
        10
      );

    if (
      !qty ||
      qty < 1
    ) {
      qty = 1;
    }

    if (
      qty > MAX_QTY
    ) {
      qty = MAX_QTY;
    }

    return qty;
  }

  function normalizeId(value) {
    return String(
      value === null ||
      value === undefined
        ? ''
        : value
    );
  }

  /* ==========================================================
     RAW STORAGE

     IMPORTANT:
     Do NOT validate against BTProducts here.

     Supabase products may still be loading when
     localStorage is first read.
  ========================================================== */

  function readRaw() {
    try {
      var raw =
        window.localStorage.getItem(
          KEY
        );

      if (!raw) {
        return [];
      }

      var data =
        JSON.parse(raw);

      if (
        !Array.isArray(data)
      ) {
        return [];
      }

      return data
        .filter(function (item) {
          return (
            item &&
            item.productId !== undefined &&
            item.productId !== null &&
            item.packId !== undefined &&
            item.packId !== null
          );
        })
        .map(function (item) {
          return {
            productId:
              normalizeId(
                item.productId
              ),

            packId:
              normalizeId(
                item.packId
              ),

            qty:
              clampQty(
                item.qty
              )
          };
        });
    } catch (error) {
      console.error(
        'Brit.Tuna: Could not read cart.',
        error
      );

      return [];
    }
  }

  function write(items) {
    var clean =
      (items || [])
        .filter(function (item) {
          return (
            item &&
            item.productId !== undefined &&
            item.packId !== undefined
          );
        })
        .map(function (item) {
          return {
            productId:
              normalizeId(
                item.productId
              ),

            packId:
              normalizeId(
                item.packId
              ),

            qty:
              clampQty(
                item.qty
              )
          };
        });

    try {
      window.localStorage.setItem(
        KEY,
        JSON.stringify(clean)
      );
    } catch (error) {
      console.error(
        'Brit.Tuna: Could not save cart.',
        error
      );
    }

    document.dispatchEvent(
      new CustomEvent(
        'bt:cart-changed'
      )
    );
  }

  /* ==========================================================
     PRODUCT READY
  ========================================================== */

  async function ensureProductsLoaded() {
    if (
      !window.BTProducts
    ) {
      console.error(
        'Brit.Tuna: BTProducts is not available.'
      );

      return false;
    }

    if (
      typeof window.BTProducts.load ===
      'function'
    ) {
      try {
        await window.BTProducts.load();
      } catch (error) {
        console.error(
          'Brit.Tuna: Could not load products for cart.',
          error
        );

        return false;
      }
    }

    return true;
  }

  /* ==========================================================
     GET VARIANT
  ========================================================== */

  function getVariant(
    productId,
    packId
  ) {
    if (
      !window.BTProducts ||
      typeof window.BTProducts.getVariant !==
        'function'
    ) {
      return null;
    }

    return window.BTProducts.getVariant(
      normalizeId(productId),
      normalizeId(packId)
    );
  }

  /* ==========================================================
     VALID CART ITEMS

     Validation happens AFTER products are ready.
  ========================================================== */

  function read() {
    var items =
      readRaw();

    if (
      !window.BTProducts
    ) {
      return items;
    }

    return items.filter(
      function (item) {
        return !!getVariant(
          item.productId,
          item.packId
        );
      }
    );
  }

  /* ==========================================================
     SESSION
  ========================================================== */

  async function getSession() {
    if (
      !window.supabaseClient
    ) {
      console.error(
        'Brit.Tuna: Supabase client is not available.'
      );

      return null;
    }

    try {
      var result =
        await window.supabaseClient
          .auth
          .getSession();

      if (result.error) {
        console.error(
          'Brit.Tuna: Session error:',
          result.error
        );

        return null;
      }

      return (
        result.data
          ? result.data.session
          : null
      );
    } catch (error) {
      console.error(
        'Brit.Tuna: Unable to check login session.',
        error
      );

      return null;
    }
  }

  /* ==========================================================
     PENDING ADD TO CART
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
          productId:
            normalizeId(
              productId
            ),

          packId:
            normalizeId(
              packId
            ),

          qty:
            clampQty(
              qty
            )
        })
      );

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
     STOCK HELPERS
  ========================================================== */

  function availableStock(pack) {
    if (
      !pack ||
      pack.stockQuantity === null ||
      pack.stockQuantity === undefined
    ) {
      return null;
    }

    var stock =
      Number(
        pack.stockQuantity
      );

    if (
      !Number.isFinite(stock)
    ) {
      return null;
    }

    return Math.max(
      0,
      Math.floor(stock)
    );
  }

  function safeQtyForPack(
    qty,
    pack
  ) {
    qty =
      clampQty(qty);

    var stock =
      availableStock(
        pack
      );

    if (
      stock === null
    ) {
      return qty;
    }

    if (
      stock <= 0
    ) {
      return 0;
    }

    return Math.min(
      qty,
      stock,
      MAX_QTY
    );
  }

  /* ==========================================================
     INTERNAL ADD
  ========================================================== */

  function addDirect(
    productId,
    packId,
    qty
  ) {
    productId =
      normalizeId(
        productId
      );

    packId =
      normalizeId(
        packId
      );

    var variant =
      getVariant(
        productId,
        packId
      );

    if (!variant) {
      console.error(
        'Brit.Tuna: Product variant not found.',
        {
          productId:
            productId,

          packId:
            packId
        }
      );

      return false;
    }

    if (
      variant.product.stock ===
      'out_of_stock'
    ) {
      return false;
    }

    var stock =
      availableStock(
        variant.pack
      );

    if (
      stock !== null &&
      stock <= 0
    ) {
      return false;
    }

    var items =
      readRaw();

    var found =
      null;

    items.forEach(
      function (item) {
        if (
          normalizeId(
            item.productId
          ) === productId &&
          normalizeId(
            item.packId
          ) === packId
        ) {
          found =
            item;
        }
      }
    );

    var addQty =
      clampQty(
        qty
      );

    if (found) {
      var requested =
        clampQty(
          found.qty +
          addQty
        );

      found.qty =
        safeQtyForPack(
          requested,
          variant.pack
        );
    } else {
      var firstQty =
        safeQtyForPack(
          addQty,
          variant.pack
        );

      if (
        firstQty <= 0
      ) {
        return false;
      }

      items.push({
        productId:
          productId,

        packId:
          packId,

        qty:
          firstQty
      });
    }

    write(
      items
    );

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
    var ready =
      await ensureProductsLoaded();

    if (!ready) {
      return false;
    }

    productId =
      normalizeId(
        productId
      );

    packId =
      normalizeId(
        packId
      );

    var variant =
      getVariant(
        productId,
        packId
      );

    if (!variant) {
      console.error(
        'Brit.Tuna: Invalid product or pack.',
        {
          productId:
            productId,

          packId:
            packId
        }
      );

      return false;
    }

    var stock =
      availableStock(
        variant.pack
      );

    if (
      variant.product.stock ===
        'out_of_stock' ||
      (
        stock !== null &&
        stock <= 0
      )
    ) {
      return false;
    }

    var session =
      await getSession();

    if (!session) {
      savePendingCartAction(
        productId,
        packId,
        qty
      );

      window.location.href =
        'login.html';

      return false;
    }

    return addDirect(
      productId,
      packId,
      qty
    );
  }

  /* ==========================================================
     RESTORE PENDING ACTION
  ========================================================== */

  async function restorePendingAction() {
    var session =
      await getSession();

    if (!session) {
      return false;
    }

    var ready =
      await ensureProductsLoaded();

    if (!ready) {
      return false;
    }

    var raw =
      null;

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

    var pending =
      null;

    try {
      pending =
        JSON.parse(raw);
    } catch (error) {
      try {
        window.localStorage.removeItem(
          PENDING_KEY
        );
      } catch (removeError) {
        /* Ignore */
      }

      return false;
    }

    if (
      !pending ||
      pending.productId === undefined ||
      pending.packId === undefined
    ) {
      try {
        window.localStorage.removeItem(
          PENDING_KEY
        );
      } catch (removeError) {
        /* Ignore */
      }

      return false;
    }

    var success =
      addDirect(
        normalizeId(
          pending.productId
        ),

        normalizeId(
          pending.packId
        ),

        pending.qty
      );

    if (success) {
      try {
        window.localStorage.removeItem(
          PENDING_KEY
        );
      } catch (error) {
        /* Ignore */
      }

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
    productId =
      normalizeId(
        productId
      );

    packId =
      normalizeId(
        packId
      );

    var variant =
      getVariant(
        productId,
        packId
      );

    if (!variant) {
      return false;
    }

    var nextQty =
      safeQtyForPack(
        qty,
        variant.pack
      );

    if (
      nextQty <= 0
    ) {
      remove(
        productId,
        packId
      );

      return false;
    }

    var items =
      readRaw();

    items.forEach(
      function (item) {
        if (
          normalizeId(
            item.productId
          ) === productId &&
          normalizeId(
            item.packId
          ) === packId
        ) {
          item.qty =
            nextQty;
        }
      }
    );

    write(
      items
    );

    return true;
  }

  /* ==========================================================
     REMOVE
  ========================================================== */

  function remove(
    productId,
    packId
  ) {
    productId =
      normalizeId(
        productId
      );

    packId =
      normalizeId(
        packId
      );

    var items =
      readRaw().filter(
        function (item) {
          return !(
            normalizeId(
              item.productId
            ) === productId &&
            normalizeId(
              item.packId
            ) === packId
          );
        }
      );

    write(
      items
    );
  }

  /* ==========================================================
     CLEAR
  ========================================================== */

  function clear() {
    write([]);
  }

  /* ==========================================================
     COUNT
  ========================================================== */

  function count() {
    return readRaw().reduce(
      function (
        total,
        item
      ) {
        return (
          total +
          clampQty(
            item.qty
          )
        );
      },
      0
    );
  }

  /* ==========================================================
     CART LINES
  ========================================================== */

  function lines() {
    if (
      !window.BTProducts
    ) {
      return [];
    }

    var result =
      [];

    readRaw().forEach(
      function (item) {
        var variant =
          getVariant(
            item.productId,
            item.packId
          );

        /*
          Product may have been removed,
          disabled or variant deleted.
          Skip it safely.
        */

        if (!variant) {
          return;
        }

        var qty =
          safeQtyForPack(
            item.qty,
            variant.pack
          );

        if (
          qty <= 0
        ) {
          return;
        }

        var unit =
          window.BTProducts.salePrice(
            variant.pack.price,
            variant.product.discount
          );

        result.push({
          product:
            variant.product,

          pack:
            variant.pack,

          qty:
            qty,

          mrpUnit:
            Number(
              variant.pack.price
            ),

          unit:
            Number(
              unit
            ),

          lineTotal:
            Number(unit) *
            qty
        });
      }
    );

    return result;
  }

  /* ==========================================================
     TOTALS
  ========================================================== */

  function totals() {
    var cartLines =
      lines();

    var mrp =
      0;

    var subtotal =
      0;

    var items =
      0;

    cartLines.forEach(
      function (line) {
        mrp +=
          line.mrpUnit *
          line.qty;

        subtotal +=
          line.lineTotal;

        items +=
          line.qty;
      }
    );

    return {
      itemCount:
        items,

      mrpTotal:
        mrp,

      savings:
        Math.max(
          0,
          mrp - subtotal
        ),

      subtotal:
        subtotal,

      total:
        subtotal
    };
  }

  /* ==========================================================
     CART LINE HTML
  ========================================================== */

  function lineHTML(line) {
    var url =
      window.BTProducts.productUrl(
        line.product
      );

    var stock =
      availableStock(
        line.pack
      );

    var stockText =
      '';

    if (
      stock !== null
    ) {
      stockText =
        '<span class="cart-stock">' +
        escapeHtml(
          String(stock)
        ) +
        ' available</span>';
    }

    return (
      '<article class="cart-line" ' +

      'data-product="' +
      escapeHtml(
        String(
          line.product.id
        )
      ) +

      '" data-pack="' +
      escapeHtml(
        String(
          line.pack.id
        )
      ) +

      '">' +

      '<a class="cart-img" href="' +
      url +
      '">' +

      '<img src="' +
      window.BTProducts.imageFor(
        line.product
      ) +

      '" alt="' +
      escapeHtml(
        line.product.name
      ) +

      '" width="96" height="72">' +

      '</a>' +

      '<div class="cart-info">' +

      '<h3>' +

      '<a href="' +
      url +
      '">' +

      escapeHtml(
        line.product.name
      ) +

      '</a>' +

      '</h3>' +

      '<p class="cart-meta">' +

      'Pack: ' +

      escapeHtml(
        line.pack.label
      ) +

      ' · ' +

      formatINR(
        line.unit
      ) +

      ' each' +

      '</p>' +

      stockText +

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
      'max="' +
      (
        stock !== null
          ? Math.min(
              MAX_QTY,
              Math.max(
                1,
                stock
              )
            )
          : MAX_QTY
      ) +
      '" ' +

      'value="' +
      line.qty +
      '" ' +

      'data-action="set" ' +

      'aria-label="Quantity for ' +
      escapeHtml(
        line.product.name
      ) +
      '">' +

      '<button type="button" ' +
      'data-action="inc" ' +
      'aria-label="Increase quantity">' +
      '+' +
      '</button>' +

      '</div>' +

      '<p class="cart-total">' +

      formatINR(
        line.lineTotal
      ) +

      '</p>' +

      '</article>'
    );
  }

  /* ==========================================================
     SUMMARY
  ========================================================== */

  function summaryRows(t) {
    return (
      '<div class="summary-row">' +

      '<span>Items (' +
      t.itemCount +
      ')</span>' +

      '<span>' +
      formatINR(
        t.mrpTotal
      ) +
      '</span>' +

      '</div>' +

      (
        t.savings > 0
          ?
            '<div class="summary-row summary-save">' +

            '<span>Discount</span>' +

            '<span>− ' +
            formatINR(
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
      formatINR(
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
      formatINR(
        t.total
      ) +
      '</span>' +

      '</div>'
    );
  }

  /* ==========================================================
     CART PAGE RENDER
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

    var summaryEl =
      document.getElementById(
        'cart-summary'
      );

    /*
      Not cart.html.
    */

    if (!itemsEl) {
      return;
    }

    var cartLines =
      lines();

    if (
      !cartLines.length
    ) {
      if (empty) {
        empty.hidden =
          false;
      }

      if (content) {
        content.hidden =
          true;
      }

      itemsEl.innerHTML =
        '';

      if (summaryEl) {
        summaryEl.innerHTML =
          '';
      }

      return;
    }

    if (empty) {
      empty.hidden =
        true;
    }

    if (content) {
      content.hidden =
        false;
    }

    itemsEl.innerHTML =
      cartLines
        .map(lineHTML)
        .join('');

    if (summaryEl) {
      summaryEl.innerHTML =
        '<h2>Order summary</h2>' +

        summaryRows(
          totals()
        ) +

        '<p class="notice notice-small">' +

        'Cart prices are loaded from the current product catalogue. Final price and stock must still be verified securely before payment.' +

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

    var cartLines =
      lines();

    if (
      !cartLines.length
    ) {
      el.innerHTML =
        '<h2>Order summary</h2>' +

        '<p>Your cart is empty.</p>' +

        '<a class="btn btn-primary btn-block" href="shop.html">' +

        'Go to Shop' +

        '</a>';

      return;
    }

    el.innerHTML =
      '<h2>Order summary</h2>' +

      '<ul class="summary-list">' +

      cartLines
        .map(function (line) {
          return (
            '<li>' +

            '<span>' +

            escapeHtml(
              line.product.name
            ) +

            ' (' +

            escapeHtml(
              line.pack.label
            ) +

            ') × ' +

            line.qty +

            '</span>' +

            '<span>' +

            formatINR(
              line.lineTotal
            ) +

            '</span>' +

            '</li>'
          );
        })
        .join('') +

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
     ASYNC INITIAL RENDER

     Wait for Supabase products/variants.
  ========================================================== */

  async function initializeCart() {
    var ready =
      await ensureProductsLoaded();

    if (!ready) {
      /*
        Even if products failed,
        allow the page to display its
        empty/fallback state.
      */

      renderAll();
      return;
    }

    renderAll();

    document.dispatchEvent(
      new CustomEvent(
        'bt:cart-ready'
      )
    );

    console.log(
      'Brit.Tuna: Cart ready.'
    );
  }

  /* ==========================================================
     CART BUTTON EVENTS
  ========================================================== */

  document.addEventListener(
    'click',
    function (event) {
      var button =
        event.target.closest(
          '[data-action]'
        );

      var line =
        event.target.closest(
          '.cart-line'
        );

      if (
        !button ||
        !line
      ) {
        return;
      }

      var productId =
        normalizeId(
          line.getAttribute(
            'data-product'
          )
        );

      var packId =
        normalizeId(
          line.getAttribute(
            'data-pack'
          )
        );

      var action =
        button.getAttribute(
          'data-action'
        );

      var current =
        1;

      readRaw().forEach(
        function (item) {
          if (
            normalizeId(
              item.productId
            ) === productId &&
            normalizeId(
              item.packId
            ) === packId
          ) {
            current =
              clampQty(
                item.qty
              );
          }
        }
      );

      if (
        action ===
        'remove'
      ) {
        remove(
          productId,
          packId
        );
      } else if (
        action ===
        'inc'
      ) {
        setQty(
          productId,
          packId,
          current + 1
        );
      } else if (
        action ===
        'dec'
      ) {
        /*
          Quantity 1 -> minus:
          keep minimum quantity at 1.
          Customer can use Remove button.
        */

        setQty(
          productId,
          packId,
          Math.max(
            1,
            current - 1
          )
        );
      }
    }
  );

  /* ==========================================================
     QUANTITY INPUT
  ========================================================== */

  document.addEventListener(
    'change',
    function (event) {
      var input =
        event.target.closest(
          'input[data-action="set"]'
        );

      var line =
        event.target.closest(
          '.cart-line'
        );

      if (
        !input ||
        !line
      ) {
        return;
      }

      setQty(
        normalizeId(
          line.getAttribute(
            'data-product'
          )
        ),

        normalizeId(
          line.getAttribute(
            'data-pack'
          )
        ),

        input.value
      );
    }
  );

  /* ==========================================================
     CART CHANGED
  ========================================================== */

  document.addEventListener(
    'bt:cart-changed',
    function () {
      renderAll();
    }
  );

  /* ==========================================================
     OTHER TAB STORAGE CHANGE
  ========================================================== */

  window.addEventListener(
    'storage',
    function (event) {
      if (
        event.key === KEY
      ) {
        renderAll();

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
    function () {
      initializeCart()
        .catch(function (error) {
          console.error(
            'Brit.Tuna: Cart initialization failed.',
            error
          );

          renderAll();
        });
    }
  );

  /* ==========================================================
     PUBLIC API
  ========================================================== */

  window.BTCart = {
    add:
      add,

    addDirect:
      addDirect,

    restorePendingAction:
      restorePendingAction,

    setQty:
      setQty,

    remove:
      remove,

    clear:
      clear,

    count:
      count,

    lines:
      lines,

    totals:
      totals,

    render:
      renderAll,

    initialize:
      initializeCart
  };
})();
