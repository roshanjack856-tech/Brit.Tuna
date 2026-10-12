/* ==========================================================
   config.js — Brit.Tuna Website Configuration

   IMPORTANT:
   - Supabase Publishable Key is allowed here.
   - NEVER put Supabase secret/service_role key here.
   - NEVER put Razorpay secret here.
   ========================================================== */

window.BT_CONFIG = {

  /* --------------------------------------------------------
     BRAND
  --------------------------------------------------------- */

  brandName: 'Brit.Tuna',

  tagline: 'Peanuts, Mango Pickles, Red Chilli & Rice',


  /* --------------------------------------------------------
     CURRENCY
  --------------------------------------------------------- */

  currency: 'INR',

  currencySymbol: '₹',

  locale: 'en-IN',


  /* --------------------------------------------------------
     DEMO MODE

     Keep true for now.
     We can change this later when the complete backend,
     orders and payment system are ready.
  --------------------------------------------------------- */

  demoMode: true,


  /* --------------------------------------------------------
     HOME PAGE HERO SLIDES
  --------------------------------------------------------- */

  heroSlides: [

    {
      label: 'Peanuts',
      icon: '🥜',
      image: ''
    },

    {
      label: 'Mango Pickles',
      icon: '🥭',
      image: ''
    },

    {
      label: 'Rice',
      icon: '🍚',
      image: ''
    },

    {
      label: 'Red Chilli',
      icon: '🌶️',
      image: ''
    }

  ],


  heroSlideInterval: 1000,


  /* --------------------------------------------------------
     CONTACT DETAILS
  --------------------------------------------------------- */

  contact: {

    phone1: '9082844086',

    phone2: '',

    whatsapp1: '',

    whatsapp2: '',

    email: '',

    address: '',

    hours: ''

  },


  /* --------------------------------------------------------
     SUPABASE

     Use ONLY:
     sb_publishable_...

     NEVER USE:
     sb_secret_...
     service_role
  --------------------------------------------------------- */

  supabase: {

    url: 'https://wrzxlmviwpeiggzgycpl.supabase.co',

    anonKey: 'sb_publishable_js68PKxlcJMbq_BqBRHrpQ_cgCig1es'

  }

};



/* ==========================================================
   SHARED WEBSITE HELPERS
========================================================== */

window.BTUtil = (function () {

  'use strict';


  var cfg = window.BT_CONFIG;



  /* --------------------------------------------------------
     FORMAT INR
  --------------------------------------------------------- */

  function formatINR(n) {

    n = Number(n) || 0;


    var whole =
      Math.abs(
        n - Math.round(n)
      ) < 0.005;


    try {

      return new Intl.NumberFormat(
        cfg.locale,
        {

          style: 'currency',

          currency: cfg.currency,

          minimumFractionDigits:
            whole ? 0 : 2,

          maximumFractionDigits:
            whole ? 0 : 2

        }
      ).format(n);

    }

    catch (e) {

      return (
        cfg.currencySymbol +
        n.toFixed(
          whole ? 0 : 2
        )
      );

    }

  }



  /* --------------------------------------------------------
     ESCAPE HTML
  --------------------------------------------------------- */

  function escapeHtml(s) {

    return String(
      s == null ? '' : s
    )

      .replace(/&/g, '&amp;')

      .replace(/</g, '&lt;')

      .replace(/>/g, '&gt;')

      .replace(/"/g, '&quot;')

      .replace(/'/g, '&#39;');

  }



  /* --------------------------------------------------------
     NUMBERS ONLY
  --------------------------------------------------------- */

  function digits(s) {

    return String(
      s || ''
    ).replace(
      /\D/g,
      ''
    );

  }



  /* --------------------------------------------------------
     WHATSAPP LINK
  --------------------------------------------------------- */

  function whatsappLink(
    message,
    which
  ) {

    var key =
      which === 2
        ? 'whatsapp2'
        : 'whatsapp1';


    var number =
      digits(
        cfg.contact[key]
      );


    return (
      'https://wa.me/' +
      number +
      '?text=' +
      encodeURIComponent(
        message || ''
      )
    );

  }



  /* --------------------------------------------------------
     CHECK WHATSAPP
  --------------------------------------------------------- */

  function isWhatsappConfigured(
    which
  ) {

    return digits(

      cfg.contact[
        which === 2
          ? 'whatsapp2'
          : 'whatsapp1'
      ]

    ).length > 6;

  }



  /* --------------------------------------------------------
     URL PARAMETER
  --------------------------------------------------------- */

  function getParam(name) {

    return new URLSearchParams(
      window.location.search
    ).get(name);

  }



  /* --------------------------------------------------------
     RETURN HELPERS
  --------------------------------------------------------- */

  return {

    formatINR:
      formatINR,

    escapeHtml:
      escapeHtml,

    digits:
      digits,

    whatsappLink:
      whatsappLink,

    isWhatsappConfigured:
      isWhatsappConfigured,

    getParam:
      getParam

  };


})();
