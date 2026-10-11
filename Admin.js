/* ==========================================================================
   BRIT.TUNA ADMIN — admin.js (shared by admin-login.html and admin.html)

   Connected to your site:
   • Reads the Supabase URL + anon key from config.js  (window.BT_CONFIG.supabase)
   • Uses supabase.js (window.BTSupabase) — the same client/session as login.html
   • Load order on both admin pages:  config.js → supabase.js → admin.js

   MODES
   • Supabase mode (config.js has url + anonKey): sign in with a Supabase Auth
     account. ONLY emails listed in the `admins` table get in — customers who
     registered on register.html are rejected. Run the SQL at the bottom once.
   • Local test mode (config.js keys empty): PIN login, products stored in this
     browser only. A PIN in front-end code is NOT real security.
   ========================================================================== */
(function () {
  "use strict";

  /* ------------------------------ CONFIG ------------------------------ */
  var CONFIG = {
    productsTable: "products",
    imageBucket: "product-images",      // public Storage bucket
    localPin: "change-me-123",          // local test mode only
    currency: (window.BT_CONFIG && window.BT_CONFIG.currencySymbol) || "₹",
    categories: ["Peanuts", "Mango Pickles", "Red Chilli", "Rice"],   // suggestions only; any text allowed
    maxImageMB: 5,
    loginPage: "admin-login.html",
    dashboardPage: "admin.html"
  };

  var SB_ON = !!(window.BTSupabase && window.BTSupabase.isConfigured && window.BTSupabase.isConfigured());
  var KEY_LOCAL_SESSION = "bt_admin_local_session";
  var KEY_PRODUCTS = "brittuna_products";
  var client = null;

  /* ------------------------------ helpers ------------------------------ */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function money(n) { return CONFIG.currency + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 }); }
  function jget(store, key, fb) { try { var v = store.getItem(key); return v == null ? fb : JSON.parse(v); } catch (e) { return fb; } }
  function jset(store, key, val) { try { store.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; } }
  function newId() { return "p-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function safeUrl(u) { return /^https?:\/\//i.test(String(u || "").trim()) ? String(u).trim() : ""; }
  function safeImg(u) { u = String(u || "").trim(); return /^(https?:\/\/|data:image\/(jpeg|png|webp|gif);base64,|[\w\-./]+$)/i.test(u) ? u : ""; }

  function localSession() {
    var s = jget(sessionStorage, KEY_LOCAL_SESSION, null);
    if (s && s.exp && Date.now() > s.exp) { try { sessionStorage.removeItem(KEY_LOCAL_SESSION); } catch (e) { /* ignore */ } return null; }
    return s;
  }
  function goLogin(msg) {
    if (msg) { try { sessionStorage.setItem("bt_admin_msg", msg); } catch (e) { /* ignore */ } }
    location.replace(CONFIG.loginPage);
  }
  function signOutThen(fn) {
    try { sessionStorage.removeItem(KEY_LOCAL_SESSION); } catch (e) { /* ignore */ }
    if (SB_ON) { BTSupabase.getClient().then(function (c) { return c.auth.signOut(); }).then(fn, fn); } else fn();
  }
  function toast(msg, type) {
    var wrap = $("#toasts");
    if (!wrap) { alert(msg); return; }
    var t = document.createElement("div");
    t.className = "toast" + (type === "error" ? " error" : "");
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(function () { t.remove(); }, 3200);
  }

  /* supabase-js returns {data, error}; turn errors into thrown Errors */
  function un(res) {
    if (res && res.error) { var e = new Error(res.error.message || "Request failed"); e.status = res.status || res.error.status || 0; e.code = res.error.code; throw e; }
    return res ? res.data : null;
  }
  function onErr(err, what) {
    var m = (err && err.message) || "";
    if (err && (err.status === 401 || /jwt|not authenticated/i.test(m))) { signOutThen(function () { goLogin("Your session expired. Please sign in again."); }); return; }
    if (err && (err.status === 403 || err.code === "42501" || /row-level security|policy|permission/i.test(m))) { toast("Not allowed — this account is not an admin (check the admins table and RLS policies).", "error"); return; }
    toast((what || "Something went wrong") + (m ? ": " + m : ""), "error");
  }
  function checkAdmin(c) {
    return c.rpc("is_admin").then(function (r) {
      if (r.error) { var e = new Error("Admin check failed: " + r.error.message + " (run the SQL setup at the bottom of admin.js)"); throw e; }
      return r.data === true;
    });
  }

  /* ============================== LOGIN PAGE ============================== */
  function initLogin() {
    var form = $("#loginForm"), alertBox = $("#loginAlert"), email = $("#email"), pass = $("#password"), btn = $("#loginBtn");
    function showAlert(m) { alertBox.textContent = m; alertBox.classList.remove("hidden"); }
    function setInvalid(input, bad) { input.closest(".field").classList.toggle("invalid", bad); }

    var pending = null;
    try { pending = sessionStorage.getItem("bt_admin_msg"); sessionStorage.removeItem("bt_admin_msg"); } catch (e) { /* ignore */ }
    if (pending) showAlert(pending);

    if (!SB_ON) {
      $("#emailField").classList.add("hidden");
      $("#passLabel").innerHTML = 'PIN <span class="req">*</span>';
      pass.autocomplete = "off";
      $("#loginHint").textContent = "Local test mode — Supabase is not set up in config.js. Enter the admin PIN from admin.js.";
      if (localSession()) { location.replace(CONFIG.dashboardPage); return; }
    } else {
      // already signed in as an admin? skip the form
      BTSupabase.getClient().then(function (c) {
        return c.auth.getSession().then(function (r) {
          if (r.data && r.data.session) return checkAdmin(c).then(function (ok) { if (ok) location.replace(CONFIG.dashboardPage); });
        });
      }).catch(function () { /* show the form */ });
    }

    $("#pwToggle").addEventListener("click", function () {
      var show = pass.type === "password";
      pass.type = show ? "text" : "password";
      this.textContent = show ? "Hide" : "Show";
      this.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      alertBox.classList.add("hidden");
      var okEmail = !SB_ON || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
      setInvalid(email, !okEmail); setInvalid(pass, !pass.value);
      if (!okEmail) { email.focus(); return; }
      if (!pass.value) { pass.focus(); return; }

      btn.disabled = true; var label = btn.textContent; btn.innerHTML = '<span class="spinner"></span> Signing in…';
      function done() { btn.disabled = false; btn.textContent = label; }

      if (!SB_ON) {
        if (pass.value === CONFIG.localPin) { jset(sessionStorage, KEY_LOCAL_SESSION, { email: "Local admin", exp: Date.now() + 8 * 3600e3 }); location.replace(CONFIG.dashboardPage); }
        else { done(); showAlert("Incorrect PIN."); }
        return;
      }
      var c;
      BTSupabase.getClient().then(function (cl) {
        c = cl;
        return c.auth.signInWithPassword({ email: email.value.trim(), password: pass.value });
      }).then(function (r) {
        if (r.error) throw new Error(/invalid login/i.test(r.error.message) ? "Incorrect email or password." : r.error.message);
        return checkAdmin(c).then(function (ok) {
          if (!ok) return c.auth.signOut().then(function () { throw new Error("This account does not have admin access."); });
          location.replace(CONFIG.dashboardPage);
        });
      }).catch(function (err) {
        done(); showAlert(err.message === "Failed to fetch" ? "Cannot reach the server. Check your connection." : (err.message || "Login failed"));
      });
    });
    (SB_ON ? email : pass).focus();
  }

  /* ============================== DASHBOARD ============================== */
  var state = { products: [], editingId: null, imageFile: null, imageData: "", imageUrl: "" };

  function initDashboard() {
    $("#logoutBtn").addEventListener("click", function () { signOutThen(function () { goLogin(); }); });
    if (!SB_ON) {
      var ls = localSession();
      if (!ls) { goLogin(); return; }
      start(ls.email);
      return;
    }
    BTSupabase.getClient().then(function (c) {
      client = c;
      return c.auth.getSession().then(function (r) {
        var s = r.data && r.data.session;
        if (!s) { goLogin(); return; }
        return checkAdmin(c).then(function (ok) {
          if (!ok) return c.auth.signOut().then(function () { goLogin("This account does not have admin access."); });
          start(s.user && s.user.email);
        });
      });
    }).catch(function (err) {
      $("#app").innerHTML = '<div class="alert alert-error">' + esc(err.message || "Could not connect to Supabase.") + '</div><a class="btn btn-outline" href="' + CONFIG.loginPage + '">Back to login</a>';
    });
  }
  function start(who) {
    $("#whoami").textContent = who || "";
    renderShell();
    loadProducts();
  }

  function normProduct(p) {
    return {
      id: String(p.id), name: p.name || "", category: p.category || "", price: Number(p.price) || 0,
      image: p.image || "", affiliate_link: p.affiliate_link || "", description: p.description || "",
      status: p.status === "inactive" ? "inactive" : "active"
    };
  }
  function loadProducts() {
    var p = SB_ON
      ? client.from(CONFIG.productsTable).select("*").order("name", { ascending: true }).then(function (r) { return (un(r) || []).map(normProduct); })
      : Promise.resolve((jget(localStorage, KEY_PRODUCTS, []) || []).map(normProduct));
    p.then(function (list) { state.products = list; renderList(); })
      .catch(function (err) {
        if (err.status === 401) return onErr(err);
        $("#list").innerHTML = '<div class="alert alert-error">Could not load products: ' + esc(err.message) + '</div>';
      });
  }

  function renderShell() {
    var warn = "";
    if (!SB_ON) warn = '<div class="alert alert-warn"><strong>Local test mode.</strong> Supabase is not set up in <code>config.js</code>, so products are saved only in this browser and the PIN is visible in <code>admin.js</code>. Add your Supabase URL and anon key to <code>config.js</code> for shared, secure admin.</div>' +
      (CONFIG.localPin === "change-me-123" ? '<div class="alert alert-warn">You are using the default PIN — change <code>localPin</code> in <code>admin.js</code>.</div>' : "");

    $("#app").innerHTML = warn +
      '<section class="card" aria-labelledby="formTitle"><h2 id="formTitle">Products</h2>' +
      '<form id="pf" novalidate>' +
      '<div class="alert alert-error hidden" id="perr" role="alert"></div>' +
      '<div class="field"><label for="pname">Product Name <span class="req">*</span></label><input id="pname" type="text" placeholder="Mango Pickle" maxlength="120" autocomplete="off"><div class="field-error"></div></div>' +
      '<div class="field"><label for="pcat">Category <span class="req">*</span></label><input id="pcat" type="text" list="catlist" placeholder="Pickles" maxlength="60" autocomplete="off"><datalist id="catlist">' + CONFIG.categories.map(function (c) { return '<option value="' + esc(c) + '">'; }).join("") + '</datalist><div class="field-error"></div></div>' +
      '<div class="field"><label for="pprice">Price (' + esc(CONFIG.currency) + ') <span class="req">*</span></label><input id="pprice" type="number" min="0" step="0.01" inputmode="decimal" placeholder="299"><div class="field-error"></div></div>' +
      '<div class="field"><label for="pimg">Product Image</label>' +
      '<div class="upload"><label class="btn btn-outline btn-sm" for="pimg">Upload Image</label><input id="pimg" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="sr-only"><span class="muted" id="imgName">No image chosen</span></div>' +
      '<div class="preview hidden" id="preview"><img alt="Product preview" id="previewImg"><button type="button" class="btn btn-danger btn-sm" id="rmImg">Remove image</button></div><div class="field-error"></div></div>' +
      '<div class="field"><label for="plink">Affiliate Link</label><input id="plink" type="url" placeholder="https://…" maxlength="1000" autocomplete="off"><div class="field-error"></div></div>' +
      '<div class="field"><label for="pdesc">Description</label><textarea id="pdesc" placeholder="Short description" maxlength="2000"></textarea></div>' +
      '<div class="field"><label for="pstatus">Status</label><select id="pstatus"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>' +
      '<div class="form-actions"><button type="submit" class="btn btn-primary" id="save">ADD PRODUCT</button><button type="button" class="btn btn-outline hidden" id="cancel">Cancel edit</button></div>' +
      '</form></section>' +
      '<section aria-labelledby="listTitle"><h2 id="listTitle">Existing Products</h2><div id="list"><div class="page-loader"><span class="spinner dark"></span> Loading products…</div></div></section>';

    $("#pf").addEventListener("submit", submitForm);
    $("#cancel").addEventListener("click", resetForm);
    $("#pimg").addEventListener("change", onImagePicked);
    $("#rmImg").addEventListener("click", function () { state.imageFile = null; state.imageData = ""; state.imageUrl = ""; $("#pimg").value = ""; refreshPreview(); });
    $("#list").addEventListener("click", function (e) {
      var row = e.target.closest("[data-id]"); if (!row) return;
      if (e.target.closest(".edit")) startEdit(row.dataset.id);
      else if (e.target.closest(".del")) removeProduct(row.dataset.id);
    });
  }

  /* ---------- image handling ---------- */
  function refreshPreview() {
    var src = state.imageData || state.imageUrl;
    var box = $("#preview");
    if (src && safeImg(src)) { $("#previewImg").src = src; box.classList.remove("hidden"); $("#imgName").textContent = state.imageFile ? state.imageFile.name : "Current image"; }
    else { box.classList.add("hidden"); $("#previewImg").removeAttribute("src"); $("#imgName").textContent = "No image chosen"; }
  }
  function setFieldError(input, msg) {
    var f = input.closest(".field"); if (!f) return;
    f.classList.toggle("invalid", !!msg);
    var e = f.querySelector(".field-error"); if (e) e.textContent = msg || "";
  }
  function onImagePicked() {
    var file = this.files && this.files[0];
    if (!file) return;
    var input = this;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) { setFieldError(input, "Choose a JPG, PNG, WebP or GIF image."); input.value = ""; return; }
    if (file.size > CONFIG.maxImageMB * 1024 * 1024) { setFieldError(input, "Image must be under " + CONFIG.maxImageMB + " MB."); input.value = ""; return; }
    setFieldError(input, "");
    state.imageFile = file;
    var reader = new FileReader();
    reader.onload = function () { state.imageData = reader.result; refreshPreview(); };
    reader.onerror = function () { setFieldError(input, "Could not read that image."); };
    reader.readAsDataURL(file);
  }
  function shrinkImage(dataUrl) {   // local mode: max 800px JPEG so it fits in browser storage
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        var max = 800, r = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement("canvas"); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        var ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = function () { resolve(dataUrl); };
      img.src = dataUrl;
    });
  }
  function uploadImage(file) {
    var ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "jpg";
    var path = Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8) + "." + ext;
    return client.storage.from(CONFIG.imageBucket).upload(path, file, { contentType: file.type, upsert: false }).then(function (r) {
      un(r);
      return client.storage.from(CONFIG.imageBucket).getPublicUrl(path).data.publicUrl;
    });
  }

  /* ---------- form: add / edit ---------- */
  function resetForm() {
    state.editingId = null; state.imageFile = null; state.imageData = ""; state.imageUrl = "";
    $("#pf").reset();
    $$(".field.invalid").forEach(function (f) { f.classList.remove("invalid"); });
    $("#perr").classList.add("hidden");
    $("#save").textContent = "ADD PRODUCT";
    $("#cancel").classList.add("hidden");
    $("#formTitle").textContent = "Products";
    refreshPreview();
  }
  function startEdit(id) {
    var p = state.products.find(function (x) { return x.id === id; }); if (!p) return;
    resetForm();
    state.editingId = id; state.imageUrl = p.image;
    $("#pname").value = p.name; $("#pcat").value = p.category; $("#pprice").value = p.price;
    $("#plink").value = p.affiliate_link; $("#pdesc").value = p.description; $("#pstatus").value = p.status;
    $("#save").textContent = "UPDATE PRODUCT";
    $("#cancel").classList.remove("hidden");
    $("#formTitle").textContent = "Edit product";
    refreshPreview();
    $("#pf").scrollIntoView({ behavior: "smooth", block: "start" });
    $("#pname").focus({ preventScroll: true });
  }
  function submitForm(e) {
    e.preventDefault();
    var box = $("#perr"); box.classList.add("hidden");
    var name = $("#pname").value.trim(), cat = $("#pcat").value.trim(), price = $("#pprice").value, link = $("#plink").value.trim();
    var bad = null;
    function chk(input, msg) { setFieldError(input, msg); if (msg && !bad) bad = input; }
    chk($("#pname"), name.length < 2 ? "Enter the product name." : "");
    chk($("#pcat"), cat.length < 2 ? "Enter a category." : "");
    chk($("#pprice"), (price === "" || isNaN(Number(price)) || Number(price) < 0) ? "Enter a valid price." : "");
    chk($("#plink"), link && !safeUrl(link) ? "Link must start with http:// or https://" : "");
    if (bad) { bad.focus(); return; }

    var btn = $("#save");
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Saving…';
    var editing = state.editingId;
    var prod = { id: editing || newId(), name: name, category: cat, price: Number(price), image: state.imageUrl || "", affiliate_link: link, description: $("#pdesc").value.trim(), status: $("#pstatus").value };

    var step = Promise.resolve();
    if (state.imageFile) {
      step = SB_ON ? uploadImage(state.imageFile).then(function (url) { prod.image = url; })
                   : shrinkImage(state.imageData).then(function (d) { prod.image = d; });
    }
    step.then(function () {
      if (SB_ON) return client.from(CONFIG.productsTable).upsert(prod, { onConflict: "id" }).then(un);
    }).then(function () {
      var i = state.products.findIndex(function (x) { return x.id === prod.id; });
      var before = state.products.slice();
      if (i >= 0) state.products[i] = prod; else state.products.unshift(prod);
      if (!SB_ON && !jset(localStorage, KEY_PRODUCTS, state.products)) { state.products = before; throw new Error("Browser storage is full — use a smaller image"); }
      toast(editing ? "Product updated" : "Product added");
      resetForm(); renderList();
    }).catch(function (err) {
      if (err.status === 401) return onErr(err);
      box.textContent = (err.message || "Could not save") + (SB_ON && /bucket|storage/i.test(err.message || "") ? ' — check that the "' + CONFIG.imageBucket + '" bucket exists and is public.' : "");
      box.classList.remove("hidden");
    }).then(function () { btn.disabled = false; btn.textContent = state.editingId ? "UPDATE PRODUCT" : "ADD PRODUCT"; });
  }

  /* ---------- existing products ---------- */
  function renderList() {
    var list = $("#list"); if (!list) return;
    if (!state.products.length) { list.innerHTML = '<div class="empty card">No products yet. Add your first product above.</div>'; return; }
    list.innerHTML = '<ul class="plist">' + state.products.map(function (p) {
      var img = safeImg(p.image), link = safeUrl(p.affiliate_link);
      return '<li class="prow" data-id="' + esc(p.id) + '">' +
        (img ? '<img class="thumb" src="' + esc(img) + '" alt="" onerror="this.style.visibility=\'hidden\'">' : '<span class="thumb ph" aria-hidden="true">No image</span>') +
        '<div class="pinfo"><div class="ptitle"><strong>' + esc(p.name) + '</strong><span class="price">' + esc(money(p.price)) + '</span></div>' +
        '<div class="pmeta"><span>' + esc(p.category) + '</span><span class="pill ' + p.status + '">' + (p.status === "active" ? "Active" : "Inactive") + '</span>' +
        (link ? '<a href="' + esc(link) + '" target="_blank" rel="noopener noreferrer sponsored">Affiliate link ↗</a>' : "") + '</div></div>' +
        '<div class="actions"><button type="button" class="btn btn-outline btn-sm edit" aria-label="Edit ' + esc(p.name) + '">Edit</button>' +
        '<button type="button" class="btn btn-danger btn-sm del" aria-label="Delete ' + esc(p.name) + '">Delete</button></div></li>';
    }).join("") + "</ul>";
  }
  function removeProduct(id) {
    var p = state.products.find(function (x) { return x.id === id; });
    if (!confirm('Delete "' + (p ? p.name : id) + '"? This cannot be undone.')) return;
    var done = SB_ON ? client.from(CONFIG.productsTable).delete().eq("id", id).then(un) : Promise.resolve();
    done.then(function () {
      state.products = state.products.filter(function (x) { return x.id !== id; });
      if (!SB_ON) jset(localStorage, KEY_PRODUCTS, state.products);
      if (state.editingId === id) resetForm();
      toast("Product deleted"); renderList();
    }).catch(function (err) { onErr(err, "Could not delete"); });
  }

  /* ------------------------------ boot ------------------------------ */
  var page = document.body.getAttribute("data-page");
  if (page === "login") initLogin();
  else if (page === "dashboard") initDashboard();
})();

/* ==========================================================================
   SUPABASE SETUP — run once in Supabase → SQL Editor
   --------------------------------------------------------------------------
   create table if not exists public.products (
     id text primary key, name text not null, category text, price numeric default 0,
     image text, affiliate_link text, description text,
     status text not null default 'active' check (status in ('active','inactive')),
     created_at timestamptz default now()
   );

   -- Who is an admin. Customers from register.html are NOT admins.
   create table if not exists public.admins (email text primary key);
   insert into public.admins values ('you@example.com') on conflict do nothing;  -- << YOUR admin email

   create or replace function public.is_admin() returns boolean
     language sql stable security definer set search_path = public as
     $$ select exists (select 1 from public.admins where lower(email) = lower(auth.jwt()->>'email')) $$;
   grant execute on function public.is_admin() to authenticated;

   alter table public.products enable row level security;
   alter table public.admins   enable row level security;   -- no policies = not readable from the browser
   create policy "products read"        on public.products for select using (status = 'active' or public.is_admin());
   create policy "products admin write" on public.products for all using (public.is_admin()) with check (public.is_admin());

   -- Image storage (public bucket)
   insert into storage.buckets (id, name, public) values ('product-images','product-images', true) on conflict do nothing;
   create policy "images read"         on storage.objects for select using (bucket_id = 'product-images');
   create policy "images admin upload" on storage.objects for insert with check (bucket_id = 'product-images' and public.is_admin());
   create policy "images admin delete" on storage.objects for delete using (bucket_id = 'product-images' and public.is_admin());

   -- Then create the admin user: Authentication → Users → Add user (same email as above).
   ========================================================================== */
