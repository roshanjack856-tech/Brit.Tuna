/* ==========================================================
   config.js — EDIT THIS FILE with your real business details.
   Never put secret keys here (no Razorpay secret, no Supabase
   service-role key). Only public/publishable keys are allowed.
   ========================================================== */
window.BT_CONFIG = {
  brandName: 'Brit.Tuna',
  tagline: 'Peanuts, Mango Pickles, Red Chilli & Rice',

  // Currency settings
  currency: 'INR',
  currencySymbol: '₹',
  locale: 'en-IN',

  // Set to false only after the real backend is connected.
  demoMode: true,

  // DEMO PLACEHOLDERS — leave empty until you have real details.
  // WhatsApp numbers: digits only with country code, e.g. 91XXXXXXXXXX
  contact: {
    phone1: '',
    phone2: '',
    whatsapp1: '',
    whatsapp2: '',
    email: '',
    address: '',
    hours: ''
  },

  // Supabase (public/publishable key only). Leave empty until configured.
  supabase: {
    url: '',      // e.g. https://xxxxxxxx.supabase.co
    anonKey: ''   // the public anon / publishable key
  }
};

/* ----------------------------------------------------------
   Small shared helpers (used by every page)
   ---------------------------------------------------------- */
window.BTUtil = (function () {
  var cfg = window.BT_CONFIG;

  function formatINR(n) {
    n = Number(n) || 0;
    var whole = Math.abs(n - Math.round(n)) < 0.005;
    try {
      return new Intl.NumberFormat(cfg.locale, {
        style: 'currency',
        currency: cfg.currency,
        minimumFractionDigits: whole ? 0 : 2,
        maximumFractionDigits: whole ? 0 : 2
      }).format(n);
    } catch (e) {
      return cfg.currencySymbol + n.toFixed(whole ? 0 : 2);
    }
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function digits(s) {
    return String(s || '').replace(/\D/g, '');
  }

  // which = 1 or 2 (selects whatsapp1 / whatsapp2 from config)
  function whatsappLink(message, which) {
    var key = which === 2 ? 'whatsapp2' : 'whatsapp1';
    var number = digits(cfg.contact[key]);
    return 'https://wa.me/' + number + '?text=' + encodeURIComponent(message || '');
  }

  function isWhatsappConfigured(which) {
    return digits(cfg.contact[which === 2 ? 'whatsapp2' : 'whatsapp1']).length > 6;
  }

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  return {
    formatINR: formatINR,
    escapeHtml: escapeHtml,
    digits: digits,
    whatsappLink: whatsappLink,
    isWhatsappConfigured: isWhatsappConfigured,
    getParam: getParam
  };
})();