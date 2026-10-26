(function () {

  "use strict";


  var listeners = [];

  var wishlistIds =
    new Set();

  var initialized =
    false;

  var currentUser =
    null;


  /* ======================================================
     SUPABASE
     ====================================================== */

  function getClient() {

    return (
      window.supabaseClient ||
      null
    );

  }


  /* ======================================================
     PRODUCT ID

     Supabase products.id is bigint.

     JavaScript receives the value from HTML
     data attributes as a string, so normalize
     it before using it with Supabase.
     ====================================================== */

  function normalizeProductId(
    productId
  ) {

    var id =
      Number(
        productId
      );


    if (
      !Number.isSafeInteger(id) ||
      id <= 0
    ) {

      return null;

    }


    return id;

  }


  /* ======================================================
     NOTIFY UI
     ====================================================== */

  function notify() {

    var detail = {
      count:
        wishlistIds.size,

      ids:
        Array.from(
          wishlistIds
        )
    };


    listeners.forEach(
      function (callback) {

        try {

          callback(
            detail
          );

        } catch (error) {

          console.error(
            "Brit.Tuna wishlist listener error:",
            error
          );

        }

      }
    );


    document.dispatchEvent(

      new CustomEvent(
        "bt:wishlist-change",
        {
          detail:
            detail
        }
      )

    );

  }


  /* ======================================================
     GET CURRENT USER
     ====================================================== */

  async function getCurrentUser() {

    var client =
      getClient();


    if (
      !client ||
      !client.auth
    ) {

      currentUser =
        null;

      return null;

    }


    var result =
      await client.auth
        .getSession();


    if (
      result.error
    ) {

      console.error(
        "Brit.Tuna wishlist session error:",
        result.error
      );


      currentUser =
        null;


      return null;

    }


    var session =
      result.data &&
      result.data.session;


    currentUser =
      session &&
      session.user

        ? session.user

        : null;


    return currentUser;

  }


  /* ======================================================
     LOAD WISHLIST
     ====================================================== */

  async function load() {

    var client =
      getClient();


    if (!client) {

      wishlistIds.clear();

      initialized =
        true;

      notify();

      return [];

    }


    var user =
      await getCurrentUser();


    if (!user) {

      wishlistIds.clear();

      initialized =
        true;

      notify();

      return [];

    }


    var result =
      await client

        .from(
          "wishlist_items"
        )

        .select(
          "product_id"
        )

        .eq(
          "user_id",
          user.id
        )

        .order(
          "created_at",
          {
            ascending:
              false
          }
        );


    if (
      result.error
    ) {

      console.error(
        "Brit.Tuna wishlist load error:",
        result.error
      );


      throw result.error;

    }


    wishlistIds.clear();


    (
      result.data ||
      []
    ).forEach(

      function (row) {

        var id =
          normalizeProductId(
            row.product_id
          );


        if (id) {

          wishlistIds.add(
            id
          );

        }

      }

    );


    initialized =
      true;


    notify();


    return Array.from(
      wishlistIds
    );

  }


  /* ======================================================
     LOGIN REDIRECT
     ====================================================== */

  function goToLogin() {

    var next =
      window.location.pathname
        .split("/")
        .pop() ||
      "index.html";


    next +=
      window.location.search ||
      "";


    window.location.href =
      "login.html?next=" +
      encodeURIComponent(
        next
      );

  }


  /* ======================================================
     IS WISHLISTED
     ====================================================== */

  function has(
    productId
  ) {

    var id =
      normalizeProductId(
        productId
      );


    if (!id) {

      return false;

    }


    return wishlistIds.has(
      id
    );

  }


  /* ======================================================
     ADD TO WISHLIST
     ====================================================== */

  async function add(
    productId
  ) {

    var id =
      normalizeProductId(
        productId
      );


    if (!id) {

      throw new Error(
        "Invalid product ID."
      );

    }


    var client =
      getClient();


    if (!client) {

      throw new Error(
        "Supabase connection is not available."
      );

    }


    var user =
      await getCurrentUser();


    if (!user) {

      goToLogin();


      return {
        loginRequired:
          true
      };

    }


    /*
      Product already exists in the local
      wishlist cache.

      Do not send another database request.
    */

    if (
      wishlistIds.has(
        id
      )
    ) {

      return {
        added:
          false,

        exists:
          true
      };

    }


    /*
      Use INSERT instead of UPSERT.

      wishlist_items already has:

      UNIQUE(user_id, product_id)

      so the same product cannot be stored
      twice for the same customer.
    */

    var result =
      await client

        .from(
          "wishlist_items"
        )

        .insert({
          user_id:
            user.id,

          product_id:
            id
        });


    if (
      result.error
    ) {

      /*
        PostgreSQL error 23505 means:

        unique constraint violation.

        The product already exists in the
        customer's wishlist.

        Treat it as wishlisted instead of
        showing an error.
      */

      if (
        result.error.code ===
        "23505"
      ) {

        wishlistIds.add(
          id
        );


        notify();


        return {
          added:
            false,

          exists:
            true
        };

      }


      console.error(
        "Brit.Tuna wishlist add error:",
        result.error
      );


      throw result.error;

    }


    wishlistIds.add(
      id
    );


    notify();


    return {
      added:
        true
    };

  }


  /* ======================================================
     REMOVE FROM WISHLIST
     ====================================================== */

  async function remove(
    productId
  ) {

    var id =
      normalizeProductId(
        productId
      );


    if (!id) {

      return {
        removed:
          false
      };

    }


    var client =
      getClient();


    if (!client) {

      throw new Error(
        "Supabase connection is not available."
      );

    }


    var user =
      await getCurrentUser();


    if (!user) {

      goToLogin();


      return {
        loginRequired:
          true
      };

    }


    var result =
      await client

        .from(
          "wishlist_items"
        )

        .delete()

        .eq(
          "user_id",
          user.id
        )

        .eq(
          "product_id",
          id
        );


    if (
      result.error
    ) {

      console.error(
        "Brit.Tuna wishlist remove error:",
        result.error
      );


      throw result.error;

    }


    wishlistIds.delete(
      id
    );


    notify();


    return {
      removed:
        true
    };

  }


  /* ======================================================
     TOGGLE
     ====================================================== */

  async function toggle(
    productId
  ) {

    var id =
      normalizeProductId(
        productId
      );


    if (!id) {

      throw new Error(
        "Invalid product ID."
      );

    }


    if (
      wishlistIds.has(
        id
      )
    ) {

      return remove(
        id
      );

    }


    return add(
      id
    );

  }


  /* ======================================================
     COUNT
     ====================================================== */

  function count() {

    return wishlistIds.size;

  }


  /* ======================================================
     GET IDS
     ====================================================== */

  function getIds() {

    return Array.from(
      wishlistIds
    );

  }


  /* ======================================================
     SUBSCRIBE
     ====================================================== */

  function subscribe(
    callback
  ) {

    if (
      typeof callback !==
      "function"
    ) {

      return function () {};

    }


    listeners.push(
      callback
    );


    /*
      Immediately provide the current state
      to the subscriber.
    */

    try {

      callback({
        count:
          wishlistIds.size,

        ids:
          Array.from(
            wishlistIds
          )
      });

    } catch (error) {

      console.error(
        "Brit.Tuna wishlist subscriber error:",
        error
      );

    }


    return function () {

      listeners =
        listeners.filter(

          function (item) {

            return (
              item !== callback
            );

          }

        );

    };

  }


  /* ======================================================
     INITIALIZE
     ====================================================== */

  async function initialize() {

    if (
      initialized
    ) {

      return getIds();

    }


    return load();

  }


  /* ======================================================
     AUTH CHANGE
     ====================================================== */

  function watchAuth() {

    var client =
      getClient();


    if (
      !client ||
      !client.auth
    ) {

      return;

    }


    client.auth
      .onAuthStateChange(

        function (
          event,
          session
        ) {

          currentUser =
            session &&
            session.user

              ? session.user

              : null;


          /*
            Customer logged out.
          */

          if (
            event ===
            "SIGNED_OUT"
          ) {

            wishlistIds.clear();

            initialized =
              false;

            notify();

            return;

          }


          /*
            Customer logged in.

            Reload their wishlist from
            Supabase.
          */

          if (
            event ===
            "SIGNED_IN"
          ) {

            initialized =
              false;


            setTimeout(

              function () {

                load()
                  .catch(

                    function (
                      error
                    ) {

                      console.error(
                        "Brit.Tuna wishlist reload error:",
                        error
                      );

                    }

                  );

              },

              0

            );

          }

        }

      );

  }


  /* ======================================================
     PUBLIC API
     ====================================================== */

  window.BTWishlist = {

    initialize:
      initialize,

    load:
      load,

    add:
      add,

    remove:
      remove,

    toggle:
      toggle,

    has:
      has,

    count:
      count,

    getIds:
      getIds,

    subscribe:
      subscribe

  };


  /* ======================================================
     START AUTH WATCHER
     ====================================================== */

  watchAuth();


})();
