/* ==========================================================
   script.js — shared layout and UI behaviour for every page.

   - Builds header
   - Mobile menu
   - Footer
   - Floating WhatsApp button
   - FAQ accordion
   - Toast messages
   - Cart badge
   - Supabase authentication header
   - Logged-in account display
   ========================================================== */

(function () {

  'use strict';


  var CFG =
    window.BT_CONFIG || {};


  var U =
    window.BTUtil;



  /* ==========================================================
     ICONS
  ========================================================== */

  function icon(paths, size) {

    size =
      size || 20;


    return (
      '<svg viewBox="0 0 24 24" ' +
      'width="' + size + '" ' +
      'height="' + size + '" ' +
      'fill="none" ' +
      'stroke="currentColor" ' +
      'stroke-width="2" ' +
      'stroke-linecap="round" ' +
      'stroke-linejoin="round" ' +
      'aria-hidden="true" ' +
      'focusable="false">' +
      paths +
      '</svg>'
    );

  }



  var ICON = {

    search:
      icon(
        '<circle cx="11" cy="11" r="7"/>' +
        '<path d="m21 21-4.3-4.3"/>'
      ),


    cart:
      icon(
        '<circle cx="9" cy="21" r="1"/>' +
        '<circle cx="20" cy="21" r="1"/>' +
        '<path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
        22
      ),


    user:
      icon(
        '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>' +
        '<circle cx="12" cy="7" r="4"/>',
        22
      ),


    menu:
      icon(
        '<path d="M3 6h18M3 12h18M3 18h18"/>',
        28
      ),


    close:
      icon(
        '<path d="M18 6 6 18M6 6l12 12"/>',
        28
      ),


    chevron:
      icon(
        '<path d="m6 9 6 6 6-6"/>',
        18
      ),


    chat:
      icon(
        '<path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 20l1.1-5.1A8.4 8.4 0 1 1 21 11.5z"/>',
        28
      )

  };



  /* ==========================================================
     MAIN NAVIGATION
  ========================================================== */

  var NAV = [

    {
      href: 'index.html',
      label: 'Home'
    },

    {
      href: 'shop.html',
      label: 'Shop'
    },

    {
      href: 'products.html',
      label: 'Products'
    },

    {
      href: 'services.html',
      label: 'Services'
    },

    {
      href: 'about.html',
      label: 'About'
    },

    {
      href: 'contact.html',
      label: 'Contact'
    },

    {
      href: 'faq.html',
      label: 'FAQs'
    }

  ];



  /* ==========================================================
     CURRENT PAGE
  ========================================================== */

  function currentFile() {

    var file =
      window.location.pathname
        .split('/')
        .pop();


    return file || 'index.html';

  }



  /* ==========================================================
     HEADER
  ========================================================== */

  function headerHTML() {

    var file =
      currentFile();


    var cats =
      (
        window.BTProducts &&
        window.BTProducts.categories
      ) || [];


    var tabs =
      NAV.map(function (n) {

        return (
          '<a class="nav-tab' +
          (n.href === file ? ' active' : '') +
          '" href="' +
          n.href +
          '"' +
          (
            n.href === file
              ? ' aria-current="page"'
              : ''
          ) +
          '>' +
          n.label +
          '</a>'
        );

      }).join('');



    var chips =
      cats.map(function (c) {

        return (
          '<a class="chip" href="products.html?category=' +
          c.id +
          '">' +
          c.name +
          '</a>'
        );

      }).join('');



    return (

      '<div class="topbar">' +

        '<div class="container">' +

          U.escapeHtml(
            CFG.tagline || ''
          ) +

          ' · Up to 8% OFF on selected products' +

        '</div>' +

      '</div>' +


      '<div class="header-main container">' +


        '<a class="logo" href="index.html" aria-label="' +
        U.escapeHtml(
          CFG.brandName
        ) +
        ' home">' +

          'Brit<span>.</span>Tuna' +

        '</a>' +



        '<form class="search-pill" role="search" action="shop.html" method="get">' +

          '<label class="sr-only" for="header-search">' +
            'Search products' +
          '</label>' +

          '<input ' +
            'id="header-search" ' +
            'type="search" ' +
            'name="q" ' +
            'placeholder="Search peanuts, pickles, chilli, rice" ' +
            'autocomplete="off">' +

          '<button type="submit" aria-label="Search">' +

            ICON.search +

            '<span class="search-label">' +
              'Search' +
            '</span>' +

          '</button>' +

        '</form>' +



        '<div class="header-actions">' +


          /* ACCOUNT */

          '<a ' +
            'class="icon-link" ' +
            'id="account-link" ' +
            'href="login.html">' +

            ICON.user +

            '<span class="icon-text">' +
              'Sign in' +
            '</span>' +

          '</a>' +



          /* CART */

          '<a ' +
            'class="icon-link cart-link" ' +
            'href="cart.html" ' +
            'aria-label="Shopping cart">' +

            ICON.cart +

            '<span ' +
              'class="cart-count" ' +
              'data-cart-count ' +
              'hidden>' +
              '0' +
            '</span>' +

          '</a>' +



          /* CREATE ACCOUNT */

          '<a ' +
            'class="btn btn-primary btn-sm desktop-only" ' +
            'id="header-register-link" ' +
            'href="register.html">' +

            'Create account' +

          '</a>' +



          /* MOBILE MENU */

          '<button ' +
            'type="button" ' +
            'class="hamburger" ' +
            'id="menu-open" ' +
            'aria-label="Open menu" ' +
            'aria-expanded="false" ' +
            'aria-controls="mobile-menu">' +

            ICON.menu +

          '</button>' +


        '</div>' +

      '</div>' +



      '<nav class="nav-row" aria-label="Main navigation">' +

        '<div class="container nav-row-inner">' +

          tabs +

          '<span class="nav-sep" aria-hidden="true"></span>' +

          chips +

        '</div>' +

      '</nav>'

    );

  }



  /* ==========================================================
     MOBILE MENU
  ========================================================== */

  function mobileMenuHTML() {

    var file =
      currentFile();


    var cats =
      (
        window.BTProducts &&
        window.BTProducts.categories
      ) || [];


    var all =
      (
        window.BTProducts &&
        window.BTProducts.getAll()
      ) || [];



    var links =
      NAV.map(function (n) {

        return (

          '<li>' +

            '<a class="drawer-link' +
            (
              n.href === file
                ? ' active'
                : ''
            ) +
            '" href="' +
            n.href +
            '">' +

              n.label +

            '</a>' +

          '</li>'

        );

      }).join('');



    var catHTML =
      cats.map(function (c) {


        var items =
          all
            .filter(function (p) {

              return (
                p.category === c.id
              );

            })
            .map(function (p) {

              return (

                '<li>' +

                  '<a class="drawer-sublink" href="' +
                  window.BTProducts.productUrl(p) +
                  '">' +

                    U.escapeHtml(
                      p.name
                    ) +

                  '</a>' +

                '</li>'

              );

            })
            .join('');



        return (

          '<li>' +

            '<button ' +
              'type="button" ' +
              'class="drawer-link drawer-toggle" ' +
              'aria-expanded="false" ' +
              'aria-controls="sub-' +
              c.id +
              '">' +

              '<span>' +

                c.icon +
                ' ' +
                c.name +

              '</span>' +

              ICON.chevron +

            '</button>' +


            '<ul ' +
              'class="drawer-sub" ' +
              'id="sub-' +
              c.id +
              '" hidden>' +

              '<li>' +

                '<a class="drawer-sublink strong" href="products.html?category=' +
                c.id +
                '">' +

                  'All ' +
                  c.name +

                '</a>' +

              '</li>' +

              items +

            '</ul>' +

          '</li>'

        );

      }).join('');



    var wa =
      U.whatsappLink(
        'Hello Brit.Tuna, I have a question.'
      );



    return (

      '<div ' +
        'class="mobile-menu" ' +
        'id="mobile-menu" ' +
        'aria-hidden="true">' +


        '<div ' +
          'class="mobile-backdrop" ' +
          'id="menu-backdrop">' +
        '</div>' +



        '<aside ' +
          'class="mobile-drawer" ' +
          'role="dialog" ' +
          'aria-modal="true" ' +
          'aria-label="Site menu">' +



          '<div class="drawer-head">' +


            '<a class="logo" href="index.html">' +

              'Brit<span>.</span>Tuna' +

            '</a>' +



            '<div class="drawer-icons">' +


              '<a ' +
                'class="icon-link" ' +
                'href="shop.html" ' +
                'aria-label="Search products">' +

                ICON.search +

              '</a>' +



              '<a ' +
                'class="icon-link cart-link" ' +
                'href="cart.html" ' +
                'aria-label="Shopping cart">' +

                ICON.cart +

                '<span ' +
                  'class="cart-count" ' +
                  'data-cart-count ' +
                  'hidden>' +

                  '0' +

                '</span>' +

              '</a>' +



              '<button ' +
                'type="button" ' +
                'class="drawer-close" ' +
                'id="menu-close" ' +
                'aria-label="Close menu">' +

                ICON.close +

              '</button>' +


            '</div>' +


          '</div>' +



          '<form ' +
            'class="drawer-search" ' +
            'role="search" ' +
            'action="shop.html" ' +
            'method="get">' +


            '<label ' +
              'class="sr-only" ' +
              'for="drawer-search-input">' +

              'Search products' +

            '</label>' +


            '<input ' +
              'id="drawer-search-input" ' +
              'type="search" ' +
              'name="q" ' +
              'placeholder="Search products">' +


            '<button ' +
              'type="submit" ' +
              'aria-label="Search">' +

              ICON.search +

            '</button>' +


          '</form>' +



          '<nav ' +
            'class="drawer-nav" ' +
            'aria-label="Mobile navigation">' +


            '<ul>' +

              links +

            '</ul>' +



            '<p class="drawer-heading">' +
              'Product categories' +
            '</p>' +


            '<ul>' +

              catHTML +

            '</ul>' +



            '<p class="drawer-heading">' +
              'Account' +
            '</p>' +



            '<ul id="mobile-account-menu">' +


              '<li id="mobile-signin-item">' +

                '<a ' +
                  'class="drawer-link" ' +
                  'href="login.html">' +

                  'Sign in' +

                '</a>' +

              '</li>' +



              '<li id="mobile-register-item">' +

                '<a ' +
                  'class="drawer-link" ' +
                  'href="register.html">' +

                  'Create account' +

                '</a>' +

              '</li>' +



              '<li ' +
                'id="mobile-account-item" ' +
                'hidden>' +

                '<a ' +
                  'class="drawer-link" ' +
                  'href="account.html">' +

                  'My Account' +

                '</a>' +

              '</li>' +



              '<li ' +
                'id="mobile-signout-item" ' +
                'hidden>' +

                '<button ' +
                  'type="button" ' +
                  'class="drawer-link" ' +
                  'id="mobile-signout-button">' +

                  'Sign out' +

                '</button>' +

              '</li>' +


            '</ul>' +


          '</nav>' +



          '<a ' +
            'class="btn btn-whatsapp drawer-wa" ' +
            'href="' +
            wa +
            '" ' +
            'target="_blank" ' +
            'rel="noopener">' +

            'Chat on WhatsApp' +

          '</a>' +


        '</aside>' +


      '</div>'

    );

  }



  /* ==========================================================
     MOBILE MENU SETUP
  ========================================================== */

  function setupMobileMenu() {

    var menu =
      document.getElementById(
        'mobile-menu'
      );


    var openBtn =
      document.getElementById(
        'menu-open'
      );


    var closeBtn =
      document.getElementById(
        'menu-close'
      );


    var backdrop =
      document.getElementById(
        'menu-backdrop'
      );



    if (
      !menu ||
      !openBtn ||
      !closeBtn ||
      !backdrop
    ) {

      return;

    }



    var lastFocus =
      null;



    function open() {

      lastFocus =
        document.activeElement;


      menu.classList.add(
        'is-open'
      );


      menu.setAttribute(
        'aria-hidden',
        'false'
      );


      openBtn.setAttribute(
        'aria-expanded',
        'true'
      );


      document.documentElement
        .classList
        .add('no-scroll');


      document.body
        .classList
        .add('no-scroll');


      closeBtn.focus();

    }



    function close() {

      menu.classList.remove(
        'is-open'
      );


      menu.setAttribute(
        'aria-hidden',
        'true'
      );


      openBtn.setAttribute(
        'aria-expanded',
        'false'
      );


      document.documentElement
        .classList
        .remove('no-scroll');


      document.body
        .classList
        .remove('no-scroll');


      if (
        lastFocus &&
        lastFocus.focus
      ) {

        lastFocus.focus();

      }

    }



    function isOpen() {

      return (
        menu.classList.contains(
          'is-open'
        )
      );

    }



    openBtn.addEventListener(
      'click',
      open
    );


    closeBtn.addEventListener(
      'click',
      close
    );


    backdrop.addEventListener(
      'click',
      close
    );



    /* CLOSE WHEN LINK CLICKED */

    menu.addEventListener(
      'click',
      function (e) {

        if (
          e.target.closest('a')
        ) {

          close();

        }

      }
    );



    /* EXPAND CATEGORIES */

    menu.addEventListener(
      'click',
      function (e) {


        var toggle =
          e.target.closest(
            '.drawer-toggle'
          );


        if (!toggle) {
          return;
        }


        var sub =
          document.getElementById(
            toggle.getAttribute(
              'aria-controls'
            )
          );


        var expanded =
          toggle.getAttribute(
            'aria-expanded'
          ) === 'true';


        toggle.setAttribute(
          'aria-expanded',
          String(!expanded)
        );


        if (sub) {

          sub.hidden =
            expanded;

        }

      }
    );



    /* ESCAPE + FOCUS */

    document.addEventListener(
      'keydown',
      function (e) {


        if (!isOpen()) {
          return;
        }


        if (
          e.key === 'Escape'
        ) {

          close();

          return;

        }


        if (
          e.key !== 'Tab'
        ) {

          return;

        }



        var focusable =
          menu.querySelectorAll(
            'a[href], button:not([disabled]), input'
          );


        var visible =
          Array.prototype.filter.call(
            focusable,
            function (el) {

              return (
                el.offsetParent !== null
              );

            }
          );


        if (!visible.length) {
          return;
        }


        var first =
          visible[0];


        var last =
          visible[
            visible.length - 1
          ];


        if (
          e.shiftKey &&
          document.activeElement === first
        ) {

          e.preventDefault();

          last.focus();

        }

        else if (
          !e.shiftKey &&
          document.activeElement === last
        ) {

          e.preventDefault();

          first.focus();

        }

      }
    );



    /* DESKTOP RESIZE */

    window.addEventListener(
      'resize',
      function () {

        if (
          isOpen() &&
          window.innerWidth > 900
        ) {

          close();

        }

      }
    );

  }



  /* ==========================================================
     FOOTER
  ========================================================== */

  function footerHTML() {

    var c =
      CFG.contact || {};


    var cats =
      (
        window.BTProducts &&
        window.BTProducts.categories
      ) || [];


    var contact =
      '';



    if (c.email) {

      contact +=
        '<li>' +
          '<a href="mailto:' +
          U.escapeHtml(c.email) +
          '">' +
          U.escapeHtml(c.email) +
          '</a>' +
        '</li>';

    }



    if (c.phone1) {

      contact +=
        '<li>' +
          '<a href="tel:' +
          U.escapeHtml(c.phone1) +
          '">' +
          U.escapeHtml(c.phone1) +
          '</a>' +
        '</li>';

    }



    if (c.phone2) {

      contact +=
        '<li>' +
          '<a href="tel:' +
          U.escapeHtml(c.phone2) +
          '">' +
          U.escapeHtml(c.phone2) +
          '</a>' +
        '</li>';

    }



    if (c.address) {

      contact +=
        '<li>' +
          U.escapeHtml(c.address) +
        '</li>';

    }



    if (!contact) {

      contact =
        '<li>' +
          'Contact details will appear here once added in config.js.' +
        '</li>';

    }



    return (

      '<footer class="site-footer">' +


        '<div class="container footer-grid">' +


          '<div>' +

            '<a ' +
              'class="logo logo-light" ' +
              'href="index.html">' +

              'Brit<span>.</span>Tuna' +

            '</a>' +

            '<p class="footer-text">' +

              U.escapeHtml(
                CFG.tagline || ''
              ) +

            '</p>' +

          '</div>' +



          '<div>' +

            '<h3>Shop</h3>' +

            '<ul>' +

              cats.map(
                function (x) {

                  return (

                    '<li>' +

                      '<a href="products.html?category=' +
                      x.id +
                      '">' +

                        x.name +

                      '</a>' +

                    '</li>'

                  );

                }
              ).join('') +

            '</ul>' +

          '</div>' +



          '<div>' +

            '<h3>Company</h3>' +

            '<ul>' +

              '<li>' +
                '<a href="about.html">About us</a>' +
              '</li>' +

              '<li>' +
                '<a href="services.html">Services</a>' +
              '</li>' +

              '<li>' +
                '<a href="contact.html">Contact us</a>' +
              '</li>' +

              '<li>' +
                '<a href="faq.html">FAQs</a>' +
              '</li>' +

              '<li>' +
                '<a href="privacy-policy.html">Privacy policy</a>' +
              '</li>' +

              '<li>' +
                '<a href="refund-policy.html">Refund and return policy</a>' +
              '</li>' +

            '</ul>' +

          '</div>' +



          '<div>' +

            '<h3>Contact</h3>' +

            '<ul>' +

              contact +

            '</ul>' +

          '</div>' +


        '</div>' +



        '<div class="footer-bottom">' +

          '<div class="container">' +

            '© ' +

            '<span data-year></span> ' +

            U.escapeHtml(
              CFG.brandName
            ) +

            '. All rights reserved.' +

          '</div>' +

        '</div>' +


      '</footer>'

    );

  }



  /* ==========================================================
     WHATSAPP FLOAT BUTTON
  ========================================================== */

  function whatsappFloatHTML() {

    return (

      '<a ' +
        'class="wa-float" ' +
        'href="' +
        U.whatsappLink(
          'Hello Brit.Tuna, I have a question.'
        ) +
        '" ' +
        'target="_blank" ' +
        'rel="noopener" ' +
        'aria-label="Chat with ' +
        U.escapeHtml(
          CFG.brandName
        ) +
        ' on WhatsApp">' +

        ICON.chat +

      '</a>'

    );

  }



  /* ==========================================================
     TOAST
  ========================================================== */

  var toastTimer =
    null;



  function toast(message) {

    var el =
      document.getElementById(
        'toast'
      );


    if (!el) {

      el =
        document.createElement(
          'div'
        );


      el.id =
        'toast';


      el.className =
        'toast';


      el.setAttribute(
        'role',
        'status'
      );


      el.setAttribute(
        'aria-live',
        'polite'
      );


      document.body.appendChild(
        el
      );

    }



    el.textContent =
      message;


    el.classList.add(
      'show'
    );


    clearTimeout(
      toastTimer
    );


    toastTimer =
      setTimeout(
        function () {

          el.classList.remove(
            'show'
          );

        },
        2600
      );

  }



  /* ==========================================================
     CART BADGE
  ========================================================== */

  function updateCartBadge() {

    var n =
      window.BTCart
        ? window.BTCart.count()
        : 0;


    var badges =
      document.querySelectorAll(
        '[data-cart-count]'
      );


    Array.prototype.forEach.call(
      badges,
      function (badge) {

        badge.textContent =
          n;


        badge.hidden =
          n === 0;

      }
    );

  }



  /* ==========================================================
     WHATSAPP LINKS
  ========================================================== */

  function setupWhatsappLinks() {

    var links =
      document.querySelectorAll(
        '[data-whatsapp]'
      );


    Array.prototype.forEach.call(
      links,
      function (a) {


        var which =
          parseInt(
            a.getAttribute(
              'data-whatsapp'
            ),
            10
          ) === 2
            ? 2
            : 1;


        a.href =
          U.whatsappLink(
            a.getAttribute(
              'data-message'
            ) ||
            'Hello Brit.Tuna',
            which
          );


        a.target =
          '_blank';


        a.rel =
          'noopener';


        if (
          !U.isWhatsappConfigured(
            which
          )
        ) {

          a.title =
            'WhatsApp number is not set yet (edit config.js)';

        }

      }
    );

  }



  /* ==========================================================
     FAQ
  ========================================================== */

  function setupFaq() {

    document.addEventListener(
      'click',
      function (e) {


        var q =
          e.target.closest(
            '.faq-q'
          );


        if (!q) {
          return;
        }


        var a =
          q.parentNode.querySelector(
            '.faq-a'
          );


        var open =
          q.getAttribute(
            'aria-expanded'
          ) === 'true';


        q.setAttribute(
          'aria-expanded',
          String(!open)
        );


        if (a) {

          a.hidden =
            open;

        }

      }
    );

  }



  /* ==========================================================
     AUTH UI — LOGGED OUT
  ========================================================== */

  function showLoggedOutHeader() {

    var accountLink =
      document.getElementById(
        'account-link'
      );


    var registerLink =
      document.getElementById(
        'header-register-link'
      );


    var mobileSignIn =
      document.getElementById(
        'mobile-signin-item'
      );


    var mobileRegister =
      document.getElementById(
        'mobile-register-item'
      );


    var mobileAccount =
      document.getElementById(
        'mobile-account-item'
      );


    var mobileSignOut =
      document.getElementById(
        'mobile-signout-item'
      );



    /* DESKTOP */

    if (accountLink) {

      accountLink.href =
        'login.html';


      var accountText =
        accountLink.querySelector(
          '.icon-text'
        );


      if (accountText) {

        accountText.textContent =
          'Sign in';

      }

    }



    if (registerLink) {

      registerLink.hidden =
        false;

    }



    /* MOBILE */

    if (mobileSignIn) {

      mobileSignIn.hidden =
        false;

    }


    if (mobileRegister) {

      mobileRegister.hidden =
        false;

    }


    if (mobileAccount) {

      mobileAccount.hidden =
        true;

    }


    if (mobileSignOut) {

      mobileSignOut.hidden =
        true;

    }

  }



  /* ==========================================================
     AUTH UI — LOGGED IN
  ========================================================== */

  function showLoggedInHeader(user) {

    var accountLink =
      document.getElementById(
        'account-link'
      );


    var registerLink =
      document.getElementById(
        'header-register-link'
      );


    var mobileSignIn =
      document.getElementById(
        'mobile-signin-item'
      );


    var mobileRegister =
      document.getElementById(
        'mobile-register-item'
      );


    var mobileAccount =
      document.getElementById(
        'mobile-account-item'
      );


    var mobileSignOut =
      document.getElementById(
        'mobile-signout-item'
      );



    /* GET USER NAME */

    var userName =
      'My Account';


    if (
      user &&
      user.user_metadata
    ) {

      userName =
        user.user_metadata.full_name ||
        user.user_metadata.name ||
        'My Account';

    }



    /* DESKTOP */

    if (accountLink) {

      accountLink.href =
        'account.html';


      var accountText =
        accountLink.querySelector(
          '.icon-text'
        );


      if (accountText) {

        accountText.textContent =
          userName;

      }

    }



    /* HIDE CREATE ACCOUNT */

    if (registerLink) {

      registerLink.hidden =
        true;

    }



    /* MOBILE */

    if (mobileSignIn) {

      mobileSignIn.hidden =
        true;

    }


    if (mobileRegister) {

      mobileRegister.hidden =
        true;

    }


    if (mobileAccount) {

      mobileAccount.hidden =
        false;


      var mobileAccountLink =
        mobileAccount.querySelector(
          'a'
        );


      if (mobileAccountLink) {

        mobileAccountLink.textContent =
          'My Account';

      }

    }


    if (mobileSignOut) {

      mobileSignOut.hidden =
        false;

    }

  }



  /* ==========================================================
     CHECK SUPABASE SESSION
  ========================================================== */

  function updateAccountLink() {

    if (
      !window.supabaseClient
    ) {

      showLoggedOutHeader();

      return;

    }



    window.supabaseClient
      .auth
      .getSession()
      .then(
        function (result) {


          if (
            result.error
          ) {

            console.error(
              'Brit.Tuna session error:',
              result.error
            );


            showLoggedOutHeader();

            return;

          }



          var session =
            result.data &&
            result.data.session;



          if (
            !session ||
            !session.user
          ) {

            showLoggedOutHeader();

            return;

          }



          console.log(
            'Brit.Tuna header: signed in user:',
            session.user.id
          );


          showLoggedInHeader(
            session.user
          );


        }
      )
      .catch(
        function (error) {


          console.error(
            'Brit.Tuna header session error:',
            error
          );


          showLoggedOutHeader();

        }
      );

  }



  /* ==========================================================
     AUTH STATE LISTENER
  ========================================================== */

  function setupAuthHeaderListener() {

    if (
      !window.supabaseClient
    ) {

      return;

    }



    window.supabaseClient
      .auth
      .onAuthStateChange(

        function (
          event,
          session
        ) {


          console.log(
            'Brit.Tuna header auth event:',
            event
          );



          if (
            session &&
            session.user
          ) {

            showLoggedInHeader(
              session.user
            );

          }

          else {

            showLoggedOutHeader();

          }

        }

      );

  }



  /* ==========================================================
     MOBILE SIGN OUT
  ========================================================== */

  function setupMobileSignOut() {

    var button =
      document.getElementById(
        'mobile-signout-button'
      );


    if (!button) {

      return;

    }



    button.addEventListener(

      'click',

      async function () {


        if (
          !window.supabaseClient
        ) {

          return;

        }



        button.disabled =
          true;


        button.textContent =
          'Signing out...';



        try {


          var result =
            await window.supabaseClient
              .auth
              .signOut();



          if (
            result.error
          ) {


            console.error(
              'Brit.Tuna sign out error:',
              result.error
            );


            button.disabled =
              false;


            button.textContent =
              'Sign out';


            return;

          }



          window.location.href =
            'index.html';


        }

        catch (error) {


          console.error(
            'Brit.Tuna sign out error:',
            error
          );


          button.disabled =
            false;


          button.textContent =
            'Sign out';

        }


      }

    );

  }



  /* ==========================================================
     BACKGROUND SLIDESHOW
  ========================================================== */

  var SLIDES = [

    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1600&q=70',

    'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1600&q=70',

    'https://images.unsplash.com/photo-1567892320421-1c657571ea4a?auto=format&fit=crop&w=1600&q=70',

    'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=1600&q=70',

    'https://images.unsplash.com/photo-1532336414038-cf19250c5757?auto=format&fit=crop&w=1600&q=70'

  ];



  var SLIDE_MS =
    1000;



  /* ==========================================================
     PAGE BACKGROUND
  ========================================================== */

  function setupPageBackground() {

    var box =
      document.createElement(
        'div'
      );


    box.className =
      'bg-slides';


    box.setAttribute(
      'aria-hidden',
      'true'
    );



    var start =
      2;



    box.innerHTML =
      SLIDES.map(
        function (src, i) {

          return (

            '<img src="' +
            src +
            '" alt=""' +
            (
              i === start
                ? ' class="active"'
                : ''
            ) +
            '>'

          );

        }
      ).join('');



    document.body.insertBefore(
      box,
      document.body.firstChild
    );



    var imgs =
      box.querySelectorAll(
        'img'
      );


    var cur =
      start;



    setInterval(

      function () {


        if (
          !imgs.length
        ) {

          return;

        }


        imgs[cur]
          .classList
          .remove('active');


        cur =
          (cur + 1) %
          imgs.length;


        imgs[cur]
          .classList
          .add('active');


      },

      SLIDE_MS

    );

  }



  /* ==========================================================
     BOOT
  ========================================================== */

  function boot() {


    /* HEADER */

    var header =
      document.getElementById(
        'site-header'
      );


    if (header) {

      header.className =
        'site-header';


      header.innerHTML =
        headerHTML();

    }



    /* FOOTER */

    var footer =
      document.getElementById(
        'site-footer'
      );


    if (footer) {

      footer.innerHTML =
        footerHTML();

    }



    /* MOBILE MENU */

    document.body.insertAdjacentHTML(
      'beforeend',
      mobileMenuHTML()
    );



    /* WHATSAPP */

    document.body.insertAdjacentHTML(
      'beforeend',
      whatsappFloatHTML()
    );



    /* SEARCH QUERY */

    var q =
      U.getParam('q');


    var input =
      document.getElementById(
        'header-search'
      );


    if (
      input &&
      q
    ) {

      input.value =
        q;

    }



    /* YEAR */

    Array.prototype.forEach.call(

      document.querySelectorAll(
        '[data-year]'
      ),

      function (el) {

        el.textContent =
          new Date().getFullYear();

      }

    );



    /* NORMAL WEBSITE FEATURES */

    setupPageBackground();

    setupMobileMenu();

    setupWhatsappLinks();

    setupFaq();

    updateCartBadge();



    /* SUPABASE AUTH */

    updateAccountLink();

    setupAuthHeaderListener();

    setupMobileSignOut();

  }



  /* ==========================================================
     START
  ========================================================== */

  document.addEventListener(
    'DOMContentLoaded',
    boot
  );



  document.addEventListener(
    'bt:cart-changed',
    updateCartBadge
  );



  /* ==========================================================
     GLOBAL BTUI
  ========================================================== */

  window.BTUI = {

    toast:
      toast,

    updateCartBadge:
      updateCartBadge,

    updateAccountLink:
      updateAccountLink

  };


})();
