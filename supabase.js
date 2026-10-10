/* ==========================================================
   supabase.js — optional Supabase connection (frontend only).

   - The website works WITHOUT Supabase. Nothing here runs unless
     you fill in BT_CONFIG.supabase in config.js.
   - Only the PUBLIC anon/publishable key belongs in the browser.
     Never put a service-role key or any secret here.
   - The Supabase library is loaded from a CDN only when needed.
   ========================================================== */
(function () {
  'use strict';

  var LIB_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
  var NOT_CONFIGURED =
    'Supabase is not connected yet. Add your project URL and public anon key in config.js to enable this feature.';

  var client = null;
  var loading = null;

  function settings() {
    return (window.BT_CONFIG && window.BT_CONFIG.supabase) || {};
  }

  // Rejects service-role keys (decodes the JWT payload and checks the role).
  function looksLikeSecretKey(key) {
    if (/service_role/i.test(key)) return true;
    try {
      var part = key.split('.')[1];
      if (!part) return false;
      var json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
      return /"role"\s*:\s*"service_role"/.test(json);
    } catch (e) {
      return false;
    }
  }

  function isConfigured() {
    var s = settings();
    return !!(s.url && s.anonKey && /^https?:\/\//.test(s.url) && !looksLikeSecretKey(s.anonKey));
  }

  function loadLibrary() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = LIB_URL;
      s.async = true;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Could not load the Supabase library.')); };
      document.head.appendChild(s);
    });
  }

  // Resolves with the Supabase client, or rejects with a readable message.
  function getClient() {
    if (!isConfigured()) return Promise.reject(new Error(NOT_CONFIGURED));
    if (client) return Promise.resolve(client);
    if (!loading) {
      loading = loadLibrary().then(function () {
        var s = settings();
        client = window.supabase.createClient(s.url, s.anonKey, {
          auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
        });
        return client;
      });
    }
    return loading;
  }

  function getSession() {
    return getClient().then(function (c) {
      return c.auth.getSession();
    }).then(function (res) {
      return res && res.data ? res.data.session : null;
    });
  }

  // Shows the "not connected" message inside an element (or selector).
  function showNotice(target) {
    var el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    el.textContent = NOT_CONFIGURED;
    el.hidden = false;
  }

  window.BTSupabase = {
    isConfigured: isConfigured,
    getClient: getClient,
    getSession: getSession,
    showNotice: showNotice,
    notConfiguredMessage: NOT_CONFIGURED
  };
})();