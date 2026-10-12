/* ==========================================================
   supabase.js — Brit.Tuna Supabase Connection

   LOAD ORDER:

   1. Supabase CDN
   2. config.js
   3. supabase.js
   4. Other website JavaScript

   ========================================================== */

(function () {

  'use strict';



  /* ========================================================
     CHECK SUPABASE JAVASCRIPT LIBRARY
  ======================================================== */

  if (!window.supabase) {

    console.error(
      'Brit.Tuna: Supabase JavaScript library is not loaded.'
    );

    return;

  }



  /* ========================================================
     CHECK BRIT.TUNA CONFIG
  ======================================================== */

  if (!window.BT_CONFIG) {

    console.error(
      'Brit.Tuna: BT_CONFIG was not found. Check config.js.'
    );

    return;

  }



  /* ========================================================
     CHECK SUPABASE CONFIG
  ======================================================== */

  if (!window.BT_CONFIG.supabase) {

    console.error(
      'Brit.Tuna: Supabase configuration was not found inside BT_CONFIG.'
    );

    return;

  }



  /* ========================================================
     GET SUPABASE DETAILS
  ======================================================== */

  const supabaseUrl =
    window.BT_CONFIG.supabase.url;


  const supabaseKey =
    window.BT_CONFIG.supabase.anonKey;



  /* ========================================================
     CHECK PROJECT URL
  ======================================================== */

  if (
    !supabaseUrl ||
    supabaseUrl.trim() === ''
  ) {

    console.error(
      'Brit.Tuna: Supabase Project URL is missing.'
    );

    return;

  }



  if (
    !supabaseUrl.startsWith(
      'https://'
    )
  ) {

    console.error(
      'Brit.Tuna: Supabase Project URL is invalid.'
    );

    return;

  }



  /* ========================================================
     CHECK PUBLISHABLE KEY
  ======================================================== */

  if (
    !supabaseKey ||
    supabaseKey.trim() === ''
  ) {

    console.error(
      'Brit.Tuna: Supabase Publishable Key is missing.'
    );

    return;

  }



  if (
    supabaseKey.includes(
      'PASTE_YOUR'
    )
  ) {

    console.error(
      'Brit.Tuna: Replace the Supabase key placeholder in config.js.'
    );

    return;

  }



  /* ========================================================
     PROTECT AGAINST SECRET KEY IN FRONTEND
  ======================================================== */

  if (
    supabaseKey.startsWith(
      'sb_secret_'
    )
  ) {

    console.error(
      'SECURITY ERROR: Never use a Supabase secret key in frontend code.'
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
      'Brit.Tuna: Supabase connected successfully.'
    );

  }

  catch (error) {

    console.error(
      'Brit.Tuna: Failed to create Supabase client:',
      error
    );

  }


})();
