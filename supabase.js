/* ==========================================================
   supabase.js — Brit.Tuna Supabase Connection
   ==========================================================

   Required before this file:

   1. Supabase JavaScript library
   2. config.js / supabase-config.js

   IMPORTANT:
   Frontend must use ONLY the publishable key.
   NEVER use service_role or secret key here.
   ========================================================== */


(function () {

  "use strict";


  /* ========================================================
     CHECK SUPABASE LIBRARY
     ======================================================== */

  if (!window.supabase) {

    console.error(
      "Brit.Tuna: Supabase JavaScript library is not loaded."
    );

    return;

  }


  /* ========================================================
     CHECK CONFIG
     ======================================================== */

  if (!window.BT_SUPABASE) {

    console.error(
      "Brit.Tuna: Supabase configuration was not found."
    );

    return;

  }


  /* ========================================================
     GET PROJECT URL AND PUBLISHABLE KEY
     ======================================================== */

  const supabaseUrl =
    window.BT_SUPABASE.url;


  const supabaseKey =
    window.BT_SUPABASE.anonKey;


  /* ========================================================
     CHECK PROJECT URL
     ======================================================== */

  if (
    !supabaseUrl ||
    supabaseUrl.includes("PASTE_YOUR")
  ) {

    console.error(
      "https://wrzxlmviwpeiggzgycpl.supabase.co"
    );

    return;

  }


  /* ========================================================
     CHECK PUBLISHABLE KEY
     ======================================================== */

  if (
    !supabaseKey ||
    supabaseKey.includes("PASTE_YOUR")
  ) {

    console.error(
      "sb_publishable_js68PKxlcJMbq_BqBRHrpQ_cgCig1es"
    );

    return;

  }


  /* ========================================================
     CREATE SUPABASE CLIENT
     ======================================================== */

  try {

    window.supabaseClient =
      window.supabase.createClient(
        supabaseUrl,
        supabaseKey
      );


    console.log(
      "Brit.Tuna: Supabase connected successfully."
    );

  }

  catch (error) {

    console.error(
      "Brit.Tuna: Supabase connection failed:",
      error
    );

  }


})();
