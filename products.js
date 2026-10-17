/* ==========================================================
   products.js — Brit.Tuna
   Product catalogue + Supabase products + product variants
   ========================================================== */

(function () {
  'use strict';

  var U = window.BTUtil;
  var CFG = window.BT_CONFIG;

  /* ==========================================================
     CATEGORIES
  ========================================================== */

  var CATEGORIES = [
    {
      id: 'peanuts',
      name: 'Peanuts',
      icon: '🥜',
      color: '#f4e3c1',
      photo:
        'https://images.unsplash.com/photo-1567892320421-1c657571ea4a?auto=format&fit=crop&w=700&q=70',
      blurb:
        'Raw, premium, roasted, skinless and wholesale peanuts.'
    },
    {
      id: 'mango-pickles',
      name: 'Mango Pickles',
      icon: '🥭',
      color: '#fbe3a6',
      photo:
        'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=70',
      blurb:
        'Five mango pickle styles.'
    },
    {
      id: 'red-chilli',
      name: 'Red Chilli',
      icon: '🌶️',
      color: '#f6cbc4',
      photo:
        'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=700&q=70',
      blurb:
        'Whole, dried, powder, premium and wholesale chilli.'
    },
    {
      id: 'rice',
      name: 'Rice',
      icon: '🍚',
      color: '#edf0dc',
      photo:
        'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=700&q=70',
      blurb:
        'Ponni, idli, basmati, sona masoori, raw and parboiled rice.'
    }
  ];

  /* ==========================================================
     STOCK LABELS
  ========================================================== */

  var STOCK_LABELS = {
    in_stock: 'In stock',
    low_stock: 'Low stock',
    out_of_stock: 'Out of stock'
  };

  /* ==========================================================
     PRICE FILTERS
  ========================================================== */

  var PRICE_RANGES = [
    {
      id: 'all',
      label: 'All prices',
      min: 0,
      max: Infinity
    },
    {
      id: 'u200',
      label: 'Under ₹200',
      min: 0,
      max: 200
    },
    {
      id: '200-500',
      label: '₹200 – ₹500',
      min: 200,
      max: 500
    },
    {
      id: '500-1000',
      label: '₹500 – ₹1,000',
      min: 500,
      max: 1000
    },
    {
      id: 'o1000',
      label: 'Above ₹1,000',
      min: 1000,
      max: Infinity
    }
  ];

  /* ==========================================================
     IMAGES
  ========================================================== */

  function ph(id) {
    return (
      'https://images.unsplash.com/photo-' +
      id +
      '?auto=format&fit=crop&w=800&q=70'
    );
  }

  var CAT_IMG = {
    peanuts: [
      '1567892320421-1c657571ea4a',
      '1626082927389-6cd097cdc6ec'
    ],

    'mango-pickles': [
      '1553279768-865429fa0078',
      '1601050690597-df0568f70950'
    ],

    'red-chilli': [
      '1588252303782-cb80119abd6d',
      '1583119022894-919a68a3d0e3'
    ],

    rice: [
      '1586201375761-83865001e31c',
      '1536304993881-ff6e9eefa2a6'
    ]
  };

  /* ==========================================================
     CATEGORY INFO
  ========================================================== */

  var CAT_INFO = {
    peanuts: {
      extra:
        ' Packed fresh and sealed to keep the crunch. Available in retail and bulk sizes.',
      ingredients: 'Peanuts',
      allergens: 'Contains peanuts.',
      storage:
        'Store in a cool, dry place in an airtight container.'
    },

    'mango-pickles': {
      extra:
        ' Made with raw mangoes and traditional spices. Enjoy with curd rice, rotis and parathas.',
      ingredients: '',
      allergens: '',
      storage:
        'Keep in a cool, dry place. Use a dry spoon and keep the jar closed after use.'
    },

    'red-chilli': {
      extra:
        ' Adds colour and heat to curries, chutneys and masalas. Sealed packs for freshness.',
      ingredients: 'Red chilli',
      allergens: '',
      storage:
        'Store in a cool, dry place in an airtight container away from moisture.'
    },

    rice: {
      extra:
        ' Cleaned and packed for everyday kitchens, families, caterers and hotels.',
      ingredients: 'Rice',
      allergens: '',
      storage:
        'Store in a cool, dry place in a sealed container.'
    }
  };

  var EXTRA_DISC = {
    'Raw Peanuts': 5,
    'Roasted Peanuts': 7,
    'Traditional Mango Pickle': 5,
    'Red Chilli Powder': 8,
    'Ponni Rice': 5,
    'Sona Masoori Rice': 6
  };

  function catImage(cat, name) {
    var list = CAT_IMG[cat] || [];

    if (!list.length) {
      return '';
    }

    var h = 0;

    for (var i = 0; i < name.length; i++) {
      h = (h + name.charCodeAt(i)) % 97;
    }

    return ph(list[h % list.length]);
  }

  /* ==========================================================
     SLUG
  ========================================================== */

  function slugify(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /* ==========================================================
     NORMALIZE DATABASE CATEGORY
  ========================================================== */

  function normalizeCategory(value) {
    var text = String(value || '')
      .trim()
      .toLowerCase();

    var map = {
      peanut: 'peanuts',
      peanuts: 'peanuts',

      'mango pickle': 'mango-pickles',
      'mango pickles': 'mango-pickles',
      'mango-pickle': 'mango-pickles',
      'mango-pickles': 'mango-pickles',

      'red chilli': 'red-chilli',
      'red chillies': 'red-chilli',
      'red chili': 'red-chilli',
      'red chilies': 'red-chilli',
      'red-chilli': 'red-chilli',

      rice: 'rice'
    };

    return map[text] || slugify(text);
  }

  /* ==========================================================
     STOCK / PACK HELPERS
     NEW:
     Never automatically choose an out-of-stock variant.
  ========================================================== */

  function packHasStock(pack) {
    if (!pack) {
      return false;
    }

    if (pack.active === false) {
      return false;
    }

    /*
      Demo products use stockQuantity = null.

      null means stock is not variant-managed yet,
      so keep demo behaviour working.
    */

    if (
      pack.stockQuantity === null ||
      pack.stockQuantity === undefined
    ) {
      return true;
    }

    return Number(pack.stockQuantity) > 0;
  }


  function availablePacks(product) {
    if (
      !product ||
      !Array.isArray(product.packs)
    ) {
      return [];
    }

    return product.packs.filter(
      function (pack) {
        return packHasStock(pack);
      }
    );
  }


  function firstAvailablePack(product) {
    var available =
      availablePacks(product);

    if (available.length) {
      return available[0];
    }

    return null;
  }


  function hasAvailableStock(product) {
    return !!firstAvailablePack(product);
  }


  function packStockLabel(pack) {
    if (!pack) {
      return 'Out of stock';
    }

    if (
      pack.stockQuantity === null ||
      pack.stockQuantity === undefined
    ) {
      return 'In stock';
    }

    var quantity =
      Number(pack.stockQuantity);

    if (quantity <= 0) {
      return 'Out of stock';
    }

    if (quantity <= 10) {
      return 'Low stock';
    }

    return 'In stock';
  }


  /* ==========================================================
     DEMO PRODUCT BUILDER
  ========================================================== */

  function P(category, name, short, description, packs, opts) {
    opts = opts || {};

    var id = 'p-' + slugify(name);

    return {
      id: id,
      databaseId: null,
      source: 'demo',

      slug: slugify(name),
      name: name,
      category: category,
      short: short,

      description:
        description +
        ((CAT_INFO[category] || {}).extra || ''),

      image:
        opts.image ||
        catImage(category, name),

      discount:
        opts.discount ||
        EXTRA_DISC[name] ||
        0,

      stock:
        opts.stock ||
        'in_stock',

      featured:
        !!opts.featured,

      bestseller:
        !!opts.bestseller,

      wholesale:
        !!opts.wholesale,

      active: true,

      productType: 'demo',
      status: 'active',
      brandId: null,
      sellerId: null,

      ingredients:
        (CAT_INFO[category] || {}).ingredients || '',

      allergens:
        (CAT_INFO[category] || {}).allergens || '',

      storage:
        (CAT_INFO[category] || {}).storage || '',

      packs:
        packs.map(function (p) {
          return {
            id:
              id +
              '-' +
              slugify(p[0]),

            variantId: null,
            label: p[0],
            price: Number(p[1]),

            /*
              Demo catalogue has no real inventory.
            */
            stockQuantity: null,

            active: true
          };
        })
    };
  }

  /* ==========================================================
     DEMO PRODUCTS
  ========================================================== */

  var DEFAULT_PRODUCTS = [

    /* PEANUTS */

    P(
      'peanuts',
      'Raw Peanuts',
      'Raw peanut kernels for everyday cooking.',
      'Raw peanut kernels that can be used for cooking, chutneys or roasting at home.',
      [
        ['500 g', 90],
        ['1 kg', 170],
        ['5 kg', 800]
      ],
      {
        featured: true,
        bestseller: true
      }
    ),

    P(
      'peanuts',
      'Premium Peanuts',
      'Carefully selected larger peanuts.',
      'A premium grade of peanuts for snacking and gifting.',
      [
        ['500 g', 120],
        ['1 kg', 230],
        ['5 kg', 1100]
      ],
      {
        featured: true,
        discount: 10
      }
    ),

    P(
      'peanuts',
      'Roasted Peanuts',
      'Ready-to-eat roasted peanuts.',
      'Roasted peanuts ready to eat as a snack.',
      [
        ['250 g', 70],
        ['500 g', 130],
        ['1 kg', 250]
      ],
      {
        bestseller: true
      }
    ),

    P(
      'peanuts',
      'Skinless Peanuts',
      'Peanut kernels without the red skin.',
      'Skinless peanut kernels for cooking and preparing sweets and sauces.',
      [
        ['500 g', 110],
        ['1 kg', 210]
      ],
      {}
    ),

    P(
      'peanuts',
      'Wholesale Peanuts',
      'Bulk peanuts for businesses.',
      'Bulk quantities of peanuts for shops, caterers and food businesses. Contact us for current wholesale rates.',
      [
        ['25 kg', 3900],
        ['50 kg', 7600]
      ],
      {
        wholesale: true
      }
    ),

    /* MANGO PICKLES */

    P(
      'mango-pickles',
      'Traditional Mango Pickle',
      'Classic mango pickle in a traditional style.',
      'A traditional-style mango pickle for everyday meals.',
      [
        ['250 g', 140],
        ['500 g', 260],
        ['1 kg', 480]
      ],
      {
        featured: true,
        bestseller: true
      }
    ),

    P(
      'mango-pickles',
      'Spicy Mango Pickle',
      'Mango pickle with a stronger spice level.',
      'A spicier mango pickle for those who like extra heat.',
      [
        ['250 g', 150],
        ['500 g', 280],
        ['1 kg', 520]
      ],
      {
        featured: true
      }
    ),

    P(
      'mango-pickles',
      'Garlic Mango Pickle',
      'Mango pickle prepared with garlic.',
      'A mango pickle prepared with garlic.',
      [
        ['250 g', 160],
        ['500 g', 300],
        ['1 kg', 560]
      ],
      {
        discount: 5
      }
    ),

    P(
      'mango-pickles',
      'Sweet Mango Pickle',
      'Mild and sweet mango pickle.',
      'A sweeter, milder mango pickle.',
      [
        ['250 g', 140],
        ['500 g', 260],
        ['1 kg', 480]
      ],
      {
        stock: 'low_stock'
      }
    ),

    P(
      'mango-pickles',
      'Homemade-Style Mango Pickle',
      'Mango pickle in a homemade style.',
      'A mango pickle made in a homemade style.',
      [
        ['250 g', 170],
        ['500 g', 320],
        ['1 kg', 600]
      ],
      {
        featured: true
      }
    ),

    /* RED CHILLI */

    P(
      'red-chilli',
      'Whole Red Chilli',
      'Whole red chillies for cooking.',
      'Whole red chillies for tempering and cooking.',
      [
        ['100 g', 50],
        ['250 g', 120],
        ['500 g', 230],
        ['1 kg', 440]
      ],
      {}
    ),

    P(
      'red-chilli',
      'Dried Red Chilli',
      'Sun-dried style red chillies.',
      'Dried red chillies for everyday cooking.',
      [
        ['100 g', 55],
        ['250 g', 130],
        ['500 g', 250],
        ['1 kg', 480]
      ],
      {}
    ),

    P(
      'red-chilli',
      'Red Chilli Powder',
      'Ground red chilli powder.',
      'Ground red chilli powder for curries and masalas.',
      [
        ['100 g', 60],
        ['250 g', 140],
        ['500 g', 270],
        ['1 kg', 520]
      ],
      {
        featured: true,
        bestseller: true
      }
    ),

    P(
      'red-chilli',
      'Premium Red Chilli',
      'Selected premium-grade red chillies.',
      'A premium selection of red chillies.',
      [
        ['100 g', 80],
        ['250 g', 190],
        ['500 g', 360]
      ],
      {
        discount: 10
      }
    ),

    P(
      'red-chilli',
      'Wholesale Red Chilli',
      'Bulk red chilli for businesses.',
      'Bulk quantities of red chilli for shops, caterers and food businesses. Contact us for current wholesale rates.',
      [
        ['10 kg', 1900],
        ['25 kg', 4600]
      ],
      {
        wholesale: true,
        stock: 'out_of_stock'
      }
    ),

    /* RICE */

    P(
      'rice',
      'Ponni Rice',
      'Everyday Ponni rice.',
      'Ponni rice for everyday meals.',
      [
        ['5 kg', 320],
        ['10 kg', 620],
        ['25 kg', 1500]
      ],
      {
        featured: true,
        bestseller: true
      }
    ),

    P(
      'rice',
      'Idli Rice',
      'Rice suited for idli and dosa batter.',
      'Rice commonly used for idli and dosa batter.',
      [
        ['5 kg', 300],
        ['10 kg', 580],
        ['25 kg', 1400]
      ],
      {}
    ),

    P(
      'rice',
      'Basmati Rice',
      'Long-grain basmati rice.',
      'Long-grain basmati rice for biryani and pulao.',
      [
        ['1 kg', 140],
        ['5 kg', 680],
        ['10 kg', 1320]
      ],
      {
        featured: true,
        discount: 8
      }
    ),

    P(
      'rice',
      'Sona Masoori Rice',
      'Light, everyday Sona Masoori rice.',
      'Sona Masoori rice for daily cooking.',
      [
        ['5 kg', 360],
        ['10 kg', 700],
        ['25 kg', 1700]
      ],
      {
        bestseller: true
      }
    ),

    P(
      'rice',
      'Raw Rice',
      'Raw (unparboiled) rice.',
      'Raw rice for everyday cooking.',
      [
        ['5 kg', 280],
        ['10 kg', 540],
        ['25 kg', 1300]
      ],
      {}
    ),

    P(
      'rice',
      'Parboiled Rice',
      'Parboiled rice for daily meals.',
      'Parboiled rice for daily meals.',
      [
        ['5 kg', 290],
        ['10 kg', 560],
        ['25 kg', 1350]
      ],
      {}
    )
  ];


  /* ==========================================================
     PRODUCT CACHE
  ========================================================== */

  var cache =
    DEFAULT_PRODUCTS.filter(
      function (p) {
        return p.active;
      }
    );


  /* ==========================================================
     CONVERT SUPABASE PRODUCT
  ========================================================== */

  function fromRow(r) {

    var slug =
      slugify(r.name);

    var id =
      String(r.id);

    var category =
      normalizeCategory(
        r.category
      );

    var variants =
      Array.isArray(
        r.product_variants
      )
        ? r.product_variants
        : [];


    /*
      Keep active variants including stock 0.

      This allows the product details page to
      show that a specific pack is out of stock.
    */

    variants =
      variants.filter(
        function (variant) {
          return (
            variant.is_active !==
            false
          );
        }
      );


    var packs =
      variants.map(
        function (variant) {

          return {

            /*
              REAL product_variants.id
            */

            id:
              String(
                variant.id
              ),

            variantId:
              Number(
                variant.id
              ),

            productId:
              Number(
                r.id
              ),

            label:
              String(
                variant.pack_size ||
                ''
              ),

            price:
              Number(
                variant.price
              ),

            stockQuantity:
              Number(
                variant.stock_quantity
              ) || 0,

            active:
              variant.is_active !==
              false

          };

        }
      );


    packs.sort(
      function (a, b) {
        return (
          Number(a.variantId) -
          Number(b.variantId)
        );
      }
    );


    var totalStock =
      packs.reduce(
        function (total, pack) {

          return (
            total +
            (
              packHasStock(pack)
                ? Number(
                    pack.stockQuantity
                  )
                : 0
            )
          );

        },
        0
      );


    var stock =
      'in_stock';


    if (totalStock <= 0) {

      stock =
        'out_of_stock';

    } else if (totalStock <= 10) {

      stock =
        'low_stock';

    }


    var info =
      CAT_INFO[category] ||
      {};


    return {

      id:
        id,

      databaseId:
        Number(r.id),

      source:
        'supabase',

      slug:
        slug,

      name:
        r.name ||
        'Product',

      category:
        category,

      short:
        r.description ||
        '',

      description:
        r.description ||
        '',

      image:
        r.image_url ||
        catImage(
          category,
          r.name || ''
        ),

      discount:
        0,

      stock:
        stock,

      featured:
        false,

      bestseller:
        false,

      wholesale:
        false,

      active:
        r.is_active !==
        false,

      productType:
        r.product_type ||
        'own',

      status:
        r.status ||
        '',

      brandId:
        r.brand_id ||
        null,

      sellerId:
        r.seller_id ||
        null,

      affiliateUrl:
        r.affiliate_url ||
        '',

      ingredients:
        info.ingredients ||
        '',

      allergens:
        info.allergens ||
        '',

      storage:
        info.storage ||
        '',

      packs:
        packs

    };

  }
     /* ==========================================================
     LOAD PRODUCTS FROM SUPABASE
  ========================================================== */

  async function load() {

    if (!window.supabaseClient) {

      console.warn(
        'Brit.Tuna: Supabase client unavailable. Using demo products.'
      );

      return cache;
    }


    try {

      var result =
        await window.supabaseClient
          .from('products')
          .select(`
            id,
            name,
            description,
            category,
            price,
            image_url,
            affiliate_url,
            is_active,
            brand_id,
            seller_id,
            product_type,
            status,
            created_at,
            updated_at,
            product_variants (
              id,
              product_id,
              pack_size,
              price,
              stock_quantity,
              is_active,
              created_at,
              updated_at
            )
          `)
          .eq(
            'status',
            'active'
          )
          .eq(
            'is_active',
            true
          )
          .order(
            'id',
            {
              ascending: true
            }
          );


      if (result.error) {

        console.warn(
          'Brit.Tuna: Supabase products unavailable. Using demo products.',
          result.error
        );

        return cache;
      }


      var rows =
        result.data || [];


      var databaseProducts =
        rows
          .map(fromRow)
          .filter(
            function (product) {

              return (
                product.active &&
                product.status === 'active' &&
                product.packs.length > 0
              );

            }
          );


      /*
        Once Supabase contains usable active
        products, use Supabase instead of
        mixing them with demo products.
      */

      if (
        databaseProducts.length > 0
      ) {

        cache =
          databaseProducts;


        console.log(
          'Brit.Tuna: Loaded ' +
          databaseProducts.length +
          ' product(s) from Supabase.'
        );


        return cache;
      }


      console.warn(
        'Brit.Tuna: No active Supabase products with variants. Using demo catalogue.'
      );


      return cache;


    } catch (error) {

      console.warn(
        'Brit.Tuna: Product loading failed. Using demo catalogue.',
        error
      );


      return cache;
    }
  }


  /* ==========================================================
     GET PRODUCTS
  ========================================================== */

  function getAll() {

    return cache.slice();

  }


  function getById(id) {

    id =
      String(id);


    for (
      var i = 0;
      i < cache.length;
      i++
    ) {

      if (
        String(
          cache[i].id
        ) === id
      ) {

        return cache[i];

      }

    }


    return null;
  }


  function getBySlug(slug) {

    slug =
      String(
        slug || ''
      );


    for (
      var i = 0;
      i < cache.length;
      i++
    ) {

      if (
        cache[i].slug ===
        slug
      ) {

        return cache[i];

      }

    }


    return null;
  }


  function getCategory(id) {

    for (
      var i = 0;
      i < CATEGORIES.length;
      i++
    ) {

      if (
        CATEGORIES[i].id ===
        id
      ) {

        return CATEGORIES[i];

      }

    }


    return null;
  }


  function getVariant(
    productId,
    packId
  ) {

    var product =
      getById(
        productId
      );


    if (!product) {

      return null;

    }


    packId =
      String(
        packId
      );


    for (
      var i = 0;
      i < product.packs.length;
      i++
    ) {

      if (
        String(
          product.packs[i].id
        ) === packId
      ) {

        return {
          product:
            product,

          pack:
            product.packs[i]
        };

      }

    }


    return null;
  }


  /* ==========================================================
     PRICING
  ========================================================== */

  function salePrice(
    price,
    discount
  ) {

    return Math.round(
      Number(price) *
      (
        100 -
        Number(
          discount || 0
        )
      ) /
      100
    );

  }


  /*
    IMPORTANT FIX

    Before:
    All packs were used for "From" price.

    Example:

    250g = ₹70, stock 0
    500g = ₹120, stock 40

    Old result:
    From ₹70

    New result:
    From ₹120

    Only AVAILABLE packs are considered.
  */

  function fromPrice(p) {

    if (
      !p ||
      !Array.isArray(p.packs)
    ) {

      return 0;

    }


    var packs =
      availablePacks(p);


    /*
      If the whole product is out of stock,
      keep a display price available.

      Customer still cannot Add to Cart.
    */

    if (!packs.length) {

      packs =
        p.packs.filter(
          function (pack) {

            return (
              pack &&
              pack.active !== false
            );

          }
        );

    }


    var min =
      Infinity;


    packs.forEach(
      function (pack) {

        var price =
          salePrice(
            pack.price,
            p.discount
          );


        if (price < min) {

          min =
            price;

        }

      }
    );


    return (
      min === Infinity
        ? 0
        : min
    );

  }


  /*
    MRP also uses the same available pack
    selection logic.

    This prevents the old MRP from belonging
    to a different out-of-stock variant.
  */

  function fromMrp(p) {

    if (
      !p ||
      !Array.isArray(p.packs)
    ) {

      return 0;

    }


    var packs =
      availablePacks(p);


    if (!packs.length) {

      packs =
        p.packs.filter(
          function (pack) {

            return (
              pack &&
              pack.active !== false
            );

          }
        );

    }


    var min =
      Infinity;


    packs.forEach(
      function (pack) {

        var price =
          Number(
            pack.price
          );


        if (
          Number.isFinite(price) &&
          price < min
        ) {

          min =
            price;

        }

      }
    );


    return (
      min === Infinity
        ? 0
        : min
    );

  }


  /* ==========================================================
     PRODUCT STOCK
  ========================================================== */

  function productStockStatus(product) {

    if (!product) {

      return 'out_of_stock';

    }


    /*
      For real Supabase products,
      calculate stock from variants.
    */

    if (
      product.source ===
      'supabase'
    ) {

      var available =
        availablePacks(
          product
        );


      if (!available.length) {

        return 'out_of_stock';

      }


      var total =
        available.reduce(
          function (
            sum,
            pack
          ) {

            return (
              sum +
              Number(
                pack.stockQuantity ||
                0
              )
            );

          },
          0
        );


      if (
        total > 0 &&
        total <= 10
      ) {

        return 'low_stock';

      }


      return 'in_stock';

    }


    /*
      Demo products keep their existing
      manual stock status.
    */

    return (
      product.stock ||
      'in_stock'
    );

  }


  function stockLabel(p) {

    var status =
      productStockStatus(
        p
      );


    return (
      STOCK_LABELS[status] ||
      'Stock unknown'
    );

  }


  /* ==========================================================
     PRODUCT IMAGE
  ========================================================== */

  function xmlEscape(s) {

    return String(s)
      .replace(
        /&/g,
        '&amp;'
      )
      .replace(
        /</g,
        '&lt;'
      )
      .replace(
        />/g,
        '&gt;'
      );

  }


  function imageFor(p) {

    if (p.image) {

      return p.image;

    }


    var cat =
      getCategory(
        p.category
      ) || {
        icon:
          '🛒',

        color:
          '#f3ead4'
      };


    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +

      '<rect width="400" height="300" fill="' +
      cat.color +
      '"/>' +

      '<text x="200" y="165" font-size="110" text-anchor="middle">' +
      cat.icon +
      '</text>' +

      '<text x="200" y="262" font-size="22" text-anchor="middle" fill="#7a1f2b" font-family="sans-serif">' +
      xmlEscape(
        p.name
      ) +
      '</text>' +

      '</svg>';


    return (
      'data:image/svg+xml;charset=utf-8,' +
      encodeURIComponent(
        svg
      )
    );

  }


  /* ==========================================================
     FILTER / SEARCH / SORT
  ========================================================== */

  function filter(opts) {

    opts =
      opts || {};


    var q =
      String(
        opts.q || ''
      )
        .toLowerCase()
        .trim();


    var range =
      null;


    PRICE_RANGES.forEach(
      function (r) {

        if (
          r.id ===
          opts.price
        ) {

          range =
            r;

        }

      }
    );


    var list =
      cache.filter(
        function (p) {

          if (
            opts.category &&
            opts.category !== 'all' &&
            p.category !==
              opts.category
          ) {

            return false;

          }


          if (q) {

            var cat =
              getCategory(
                p.category
              );


            var hay =
              (
                p.name +
                ' ' +
                p.short +
                ' ' +
                (
                  cat
                    ? cat.name
                    : ''
                )
              )
                .toLowerCase();


            var ok =
              q
                .split(/\s+/)
                .every(
                  function (word) {

                    return (
                      hay.indexOf(
                        word
                      ) !== -1
                    );

                  }
                );


            if (!ok) {

              return false;

            }

          }


          if (range) {

            /*
              Uses first AVAILABLE price.
            */

            var price =
              fromPrice(
                p
              );


            if (
              price < range.min ||
              price > range.max
            ) {

              return false;

            }

          }


          return true;

        }
      );


    switch (
      opts.sort
    ) {

      case 'price-asc':

        list.sort(
          function (a, b) {

            return (
              fromPrice(a) -
              fromPrice(b)
            );

          }
        );

        break;


      case 'price-desc':

        list.sort(
          function (a, b) {

            return (
              fromPrice(b) -
              fromPrice(a)
            );

          }
        );

        break;


      case 'name-asc':

        list.sort(
          function (a, b) {

            return (
              a.name.localeCompare(
                b.name
              )
            );

          }
        );

        break;


      case 'name-desc':

        list.sort(
          function (a, b) {

            return (
              b.name.localeCompare(
                a.name
              )
            );

          }
        );

        break;


      default:

        break;

    }


    return list;

  }


  /* ==========================================================
     URL HELPERS
  ========================================================== */

  function absoluteUrl(path) {

    try {

      return new URL(
        path,
        window.location.href
      ).href;

    } catch (error) {

      return path;

    }

  }


  function productUrl(p) {

    return (
      'product-details.html?slug=' +
      encodeURIComponent(
        p.slug
      )
    );

  }


  /* ==========================================================
     PRODUCT CARD
     IMPORTANT:
     First AVAILABLE pack is used for
     Add to Cart and WhatsApp.
  ========================================================== */

  function cardHTML(p) {

    if (
      !p ||
      !p.packs.length
    ) {

      return '';

    }


    var cat =
      getCategory(
        p.category
      );


    var productStatus =
      productStockStatus(
        p
      );


    var out =
      productStatus ===
      'out_of_stock';


    /*
      IMPORTANT FIX:

      Do NOT use:

      p.packs[0]

      because first pack can have stock 0.
    */

    var first =
      firstAvailablePack(
        p
      );


    /*
      If every pack is sold out,
      use first pack only for displaying
      WhatsApp information.

      Add to Cart remains disabled.
    */

    var displayPack =
      first ||
      p.packs[0];


    var msg =
      'Hello Brit.Tuna, I would like to order:\n' +
      'Product: ' +
      p.name +
      '\nPack size: ' +
      (
        displayPack
          ? displayPack.label
          : ''
      ) +
      '\nQuantity: 1' +
      '\nLink: ' +
      absoluteUrl(
        productUrl(p)
      );


    var mrp =
      fromMrp(
        p
      );


    var now =
      fromPrice(
        p
      );


    var packText =
      p.packs
        .map(
          function (pack) {

            var text =
              U.escapeHtml(
                pack.label
              );


            if (
              !packHasStock(
                pack
              )
            ) {

              text +=
                ' (Out of stock)';

            }


            return text;

          }
        )
        .join(' · ');


    return (
      '<article class="product-card">' +

      '<a class="pc-img" href="' +
      productUrl(p) +
      '">' +

      '<img src="' +
      imageFor(p) +
      '" alt="' +
      U.escapeHtml(
        p.name
      ) +
      '" loading="lazy" width="400" height="300" data-pid="' +
      U.escapeHtml(
        String(
          p.id
        )
      ) +
      '">' +

      (
        p.discount
          ? '<span class="pc-badge">' +
            p.discount +
            '% OFF</span>'
          : ''
      ) +

      '</a>' +

      '<div class="pc-body">' +

      '<p class="pc-cat">' +
      U.escapeHtml(
        cat
          ? cat.name
          : ''
      ) +
      '</p>' +

      '<h3 class="pc-name">' +

      '<a href="' +
      productUrl(p) +
      '">' +

      U.escapeHtml(
        p.name
      ) +

      '</a>' +

      '</h3>' +

      '<p class="pc-short">' +
      U.escapeHtml(
        p.short
      ) +
      '</p>' +

      '<p class="pc-packs">Packs: ' +
      packText +
      '</p>' +

      '<p class="pc-price">' +

      '<span class="price-from">From</span> ' +

      '<span class="price-now">' +
      U.formatINR(
        now
      ) +
      '</span>' +

      (
        p.discount
          ? ' <span class="price-old">' +
            U.formatINR(
              mrp
            ) +
            '</span>'
          : ''
      ) +

      '</p>' +

      '<p class="stock stock-' +
      productStatus +
      '">' +

      STOCK_LABELS[
        productStatus
      ] +

      '</p>' +

      '<div class="pc-actions">' +

      '<button type="button" class="btn btn-primary btn-sm js-add-card" data-product-id="' +
      U.escapeHtml(
        String(
          p.id
        )
      ) +
      '"' +

      (
        out
          ? ' disabled'
          : ''
      ) +

      '>' +

      (
        out
          ? 'Out of stock'
          : 'Add to Cart'
      ) +

      '</button>' +

      '<a class="btn btn-whatsapp btn-sm" href="' +
      U.whatsappLink(
        msg
      ) +
      '" target="_blank" rel="noopener">WhatsApp</a>' +

      '</div>' +

      '</div>' +

      '</article>'
    );

  }


  /* ==========================================================
     IMAGE FALLBACK
  ========================================================== */

  function placeholderFor(id) {

    var product =
      getById(
        id
      );


    if (!product) {

      return '';

    }


    var category =
      getCategory(
        product.category
      );


    if (!category) {

      return '';

    }


    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +

      '<rect width="400" height="300" fill="' +
      category.color +
      '"/>' +

      '<text x="200" y="165" font-size="110" text-anchor="middle">' +
      category.icon +
      '</text>' +

      '</svg>';


    return (
      'data:image/svg+xml;charset=utf-8,' +
      encodeURIComponent(
        svg
      )
    );

  }


  document.addEventListener(
    'error',

    function (e) {

      var target =
        e.target;


      if (
        target &&
        target.tagName === 'IMG' &&
        target.getAttribute(
          'data-pid'
        ) &&
        !target.getAttribute(
          'data-fb'
        )
      ) {

        target.setAttribute(
          'data-fb',
          '1'
        );


        target.src =
          placeholderFor(
            target.getAttribute(
              'data-pid'
            )
          );

      }

    },

    true
  );


  /* ==========================================================
     OFFERS
  ========================================================== */

  function offersHTML() {

    return cache
      .filter(
        function (product) {

          return (
            product.discount > 0
          );

        }
      )
      .slice(
        0,
        8
      )
      .map(
        function (product) {

          return (
            '<a class="offer-tile" href="' +
            productUrl(
              product
            ) +
            '">' +

            '<img src="' +
            imageFor(
              product
            ) +
            '" alt="" loading="lazy" data-pid="' +
            product.id +
            '">' +

            '<span class="offer-pct">' +
            product.discount +
            '% OFF</span>' +

            '<h3>' +
            U.escapeHtml(
              product.name
            ) +
            '</h3>' +

            '<p>From ' +

            U.formatINR(
              fromPrice(
                product
              )
            ) +

            (
              product.discount
                ? ' <s>' +
                  U.formatINR(
                    fromMrp(
                      product
                    )
                  ) +
                  '</s>'
                : ''
            ) +

            '</p>' +

            '</a>'
          );

        }
      )
      .join('');

  }


  /* ==========================================================
     GRID
  ========================================================== */

  function renderGrid(
    el,
    list
  ) {

    if (!el) {

      return;

    }


    el.innerHTML =
      list
        .map(
          cardHTML
        )
        .join('');

  }


  /* ==========================================================
     TOAST
  ========================================================== */

  function toast(message) {

    if (
      window.BTUI &&
      window.BTUI.toast
    ) {

      window.BTUI.toast(
        message
      );

    }

  }
     /* ==========================================================
     HOME PAGE
  ========================================================== */

  function initHome() {

    var featuredGrid =
      document.getElementById(
        'featured-products'
      );

var bestsellerGrid =
  document.getElementById(
    'bestsellers-grid'
  );


    if (featuredGrid) {

      var featured =
        cache.filter(
          function (product) {

            return (
              product.featured ||
              product.source ===
                'supabase'
            );

          }
        );


      renderGrid(
        featuredGrid,
        featured.slice(
          0,
          8
        )
      );

    }


    if (bestsellerGrid) {

      var bestsellers =
        cache.filter(
          function (product) {

            return (
              product.bestseller ||
              product.source ===
                'supabase'
            );

          }
        );


      renderGrid(
        bestsellerGrid,
        bestsellers.slice(
          0,
          8
        )
      );

    }


    var offers =
      document.getElementById(
        'offers-grid'
      );


    if (offers) {

      offers.innerHTML =
        offersHTML();

    }

  }


  /* ==========================================================
     SHOP PAGE
  ========================================================== */

  function initShop() {

  var grid =
    document.getElementById(
      'product-grid'
    );

  if (!grid) {
    console.warn(
      'Brit.Tuna: product-grid not found.'
    );
    return;
  }


  var searchInput =
    document.getElementById(
      'search-input'
    );


  var categorySelect =
    document.getElementById(
      'category-filter'
    );


  var priceSelect =
    document.getElementById(
      'price-filter'
    );


  var sortSelect =
    document.getElementById(
      'sort-select'
    );


  var empty =
    document.getElementById(
      'empty-state'
    );


  var count =
    document.getElementById(
      'result-count'
    );


  /*
    Fill category options
  */
  if (categorySelect) {

    categorySelect.innerHTML =
      '<option value="all">All categories</option>';

    CATEGORIES.forEach(
      function (category) {

        var option =
          document.createElement(
            'option'
          );

        option.value =
          category.id;

        option.textContent =
          category.name;

        categorySelect.appendChild(
          option
        );

      }
    );

  }


  /*
    Fill price options
  */
  if (priceSelect) {

    priceSelect.innerHTML = '';

    PRICE_RANGES.forEach(
      function (range) {

        var option =
          document.createElement(
            'option'
          );

        option.value =
          range.id;

        option.textContent =
          range.label;

        priceSelect.appendChild(
          option
        );

      }
    );

  }


  /*
    Fill sort options
  */
  if (sortSelect) {

    sortSelect.innerHTML = '';

    var sortOptions = [

      {
        id: 'default',
        name: 'Sort: Featured'
      },

      {
        id: 'price-asc',
        name: 'Price: Low to High'
      },

      {
        id: 'price-desc',
        name: 'Price: High to Low'
      },

      {
        id: 'name-asc',
        name: 'Name: A to Z'
      },

      {
        id: 'name-desc',
        name: 'Name: Z to A'
      }

    ];


    sortOptions.forEach(
      function (item) {

        var option =
          document.createElement(
            'option'
          );

        option.value =
          item.id;

        option.textContent =
          item.name;

        sortSelect.appendChild(
          option
        );

      }
    );

  }


  /*
    Read URL parameters
  */
  var params =
    new URLSearchParams(
      window.location.search
    );


  /*
    Search from URL
    Example:
    shop.html?q=peanuts
  */
  var urlSearch =
    params.get('q');


  if (
    searchInput &&
    urlSearch
  ) {

    searchInput.value =
      urlSearch;

  }


  /*
    Category from URL
    Example:
    shop.html?category=peanuts
  */
  var urlCategory =
    params.get(
      'category'
    );


  if (
    categorySelect &&
    urlCategory
  ) {

    var normalizedCategory =
      normalizeCategory(
        urlCategory
      );


    if (
      getCategory(
        normalizedCategory
      )
    ) {

      categorySelect.value =
        normalizedCategory;

    }

  }


  /*
    Render products
  */
  function render() {

    try {

      var list =
        filter({

          q:
            searchInput
              ? searchInput.value
              : '',

          category:
            categorySelect
              ? categorySelect.value
              : 'all',

          price:
            priceSelect
              ? priceSelect.value
              : 'all',

          sort:
            sortSelect
              ? sortSelect.value
              : 'default'

        });


      /*
        Render product cards
      */
      renderGrid(
        grid,
        list
      );


      /*
        Product count
      */
      if (count) {

        count.textContent =
          'Showing ' +
          list.length +
          ' of ' +
          cache.length +
          ' products';

      }


      /*
        Empty search result
      */
      if (empty) {

        empty.hidden =
          list.length > 0;

      }


      /*
        Show / hide grid
      */
      grid.hidden =
        list.length === 0;


    } catch (error) {

      console.error(
        'Brit.Tuna: Shop render error.',
        error
      );


      grid.hidden =
        false;


      grid.innerHTML =
        '<p class="state-error" role="alert">' +
        'Sorry, products could not be loaded. Please refresh the page.' +
        '</p>';

    }

  }


  /*
    Search event
  */
  if (searchInput) {

    searchInput.addEventListener(
      'input',
      render
    );

  }


  /*
    Category event
  */
  if (categorySelect) {

    categorySelect.addEventListener(
      'change',
      render
    );

  }


  /*
    Price event
  */
  if (priceSelect) {

    priceSelect.addEventListener(
      'change',
      render
    );

  }


  /*
    Sort event
  */
  if (sortSelect) {

    sortSelect.addEventListener(
      'change',
      render
    );

  }


  /*
    Initial product render
  */
  render();

}


  /* ==========================================================
     PRODUCTS PAGE
  ========================================================== */

 function initProducts() {

  var grid =
    document.getElementById(
      'product-grid'
    );

  if (!grid) {
    console.warn(
      'Brit.Tuna: Products product-grid not found.'
    );
    return;
  }


  var empty =
    document.getElementById(
      'empty-state'
    );


  var count =
    document.getElementById(
      'result-count'
    );


  var sortSelect =
    document.getElementById(
      'sort-select'
    );


  /*
    Get category from URL
    Example:
    products.html?category=peanuts
  */
  var category =
    new URLSearchParams(
      window.location.search
    ).get(
      'category'
    );


  /*
    Add Sort By options
  */
  if (sortSelect) {

    sortSelect.innerHTML = '';

    var sortOptions = [
      {
        id: 'default',
        name: 'Sort: Featured'
      },
      {
        id: 'price-asc',
        name: 'Price: Low to High'
      },
      {
        id: 'price-desc',
        name: 'Price: High to Low'
      },
      {
        id: 'name-asc',
        name: 'Name: A to Z'
      },
      {
        id: 'name-desc',
        name: 'Name: Z to A'
      }
    ];


    sortOptions.forEach(
      function (item) {

        var option =
          document.createElement(
            'option'
          );

        option.value =
          item.id;

        option.textContent =
          item.name;

        sortSelect.appendChild(
          option
        );

      }
    );

  }


  /*
    Render products
  */
  function render() {

    var list =
      filter({

        category:
          category
            ? normalizeCategory(
                category
              )
            : 'all',

        price:
          'all',

        sort:
          sortSelect
            ? sortSelect.value
            : 'default'

      });


    renderGrid(
      grid,
      list
    );


    /*
      Result count
    */
    if (count) {

      count.textContent =
        'Showing ' +
        list.length +
        ' of ' +
        cache.length +
        ' products';

    }


    /*
      Empty state
    */
    if (empty) {

      empty.hidden =
        list.length > 0;

    }


    /*
      Product grid
    */
    grid.hidden =
      list.length === 0;

  }


  /*
    Sort change
  */
  if (sortSelect) {

    sortSelect.addEventListener(
      'change',
      render
    );

  }


  /*
    Initial render
  */
  render();

}
  /* ==========================================================
     PRODUCT DETAILS
  ========================================================== */

  function initDetails() {

    var box =
      document.getElementById(
        'product-detail'
      );


    if (!box) {

      return;

    }


    var params =
      new URLSearchParams(
        window.location.search
      );


    var slug =
      params.get(
        'slug'
      );


    var id =
      params.get(
        'id'
      );


    var p =
      slug
        ? getBySlug(slug)
        : getById(id);


    if (!p) {

      box.innerHTML =
        '<div class="empty-state">' +

        '<h2>Product not found</h2>' +

        '<p>This product may no longer be available.</p>' +

        '<a class="btn btn-primary" href="shop.html">Back to Shop</a>' +

        '</div>';


      return;

    }


    if (
      !p.packs ||
      !p.packs.length
    ) {

      box.innerHTML =
        '<div class="empty-state">' +

        '<h2>Product unavailable</h2>' +

        '<p>No active pack sizes are currently available for this product.</p>' +

        '<a class="btn btn-primary" href="shop.html">Back to Shop</a>' +

        '</div>';


      return;

    }


    var cat =
      getCategory(
        p.category
      );


    /*
      IMPORTANT FIX:

      Select first IN-STOCK pack.

      Premium Peanuts example:

      250g = stock 0
      500g = stock 40

      Default becomes 500g.
    */

    var selectedPack =
      firstAvailablePack(
        p
      );


    /*
      If everything is out of stock,
      keep first pack for display only.
    */

    if (!selectedPack) {

      selectedPack =
        p.packs[0];

    }


    var state = {

      packId:
        String(
          selectedPack.id
        ),

      qty:
        1

    };


    var productStatus =
      productStockStatus(
        p
      );


    var allOut =
      productStatus ===
      'out_of_stock';


    /* ======================================================
       PACK OPTIONS

       Stock 0 variants stay visible,
       but radio is disabled.
    ====================================================== */

    var packOptions =
      p.packs
        .map(
          function (pack) {

            var available =
              packHasStock(
                pack
              );


            var checked =
              String(
                pack.id
              ) ===
              String(
                state.packId
              );


            var packPrice =
              salePrice(
                pack.price,
                p.discount
              );


            return (
              '<label class="pack-option' +
              (
                !available
                  ? ' pack-option-disabled'
                  : ''
              ) +
              '">' +

              '<input type="radio" name="pack" value="' +
              U.escapeHtml(
                String(
                  pack.id
                )
              ) +
              '"' +

              (
                checked
                  ? ' checked'
                  : ''
              ) +

              (
                !available
                  ? ' disabled'
                  : ''
              ) +

              '>' +

              '<span class="pack-option-main">' +

              '<span class="pack-option-name">' +
              U.escapeHtml(
                pack.label
              ) +
              '</span>' +

              '<span class="pack-option-price">' +
              U.formatINR(
                packPrice
              ) +
              '</span>' +

              '</span>' +

              '<span class="pack-option-stock">' +
              U.escapeHtml(
                packStockLabel(
                  pack
                )
              ) +
              '</span>' +

              '</label>'
            );

          }
        )
        .join('');


    var selectedNow =
      salePrice(
        selectedPack.price,
        p.discount
      );


    var selectedMrp =
      Number(
        selectedPack.price
      );


    var detailStockText =
      packStockLabel(
        selectedPack
      );


    var detailsWhatsappMessage =
      'Hello Brit.Tuna, I would like to order:\n' +
      'Product: ' +
      p.name +
      '\nPack size: ' +
      selectedPack.label +
      '\nQuantity: 1' +
      '\nLink: ' +
      absoluteUrl(
        productUrl(p)
      );


    /* ======================================================
       DETAILS HTML
    ====================================================== */

    box.innerHTML =
      '<div class="product-detail-grid">' +


      /* IMAGE */

      '<div class="product-detail-media">' +

      '<div class="product-detail-main-image">' +

      '<img id="pd-image" src="' +
      imageFor(p) +
      '" alt="' +
      U.escapeHtml(
        p.name
      ) +
      '" data-pid="' +
      U.escapeHtml(
        String(
          p.id
        )
      ) +
      '">' +

      (
        p.discount
          ? '<span class="pc-badge">' +
            p.discount +
            '% OFF</span>'
          : ''
      ) +

      '</div>' +

      '</div>' +


      /* CONTENT */

      '<div class="product-detail-content">' +

      '<p class="pc-cat">' +
      U.escapeHtml(
        cat
          ? cat.name
          : ''
      ) +
      '</p>' +

      '<h1>' +
      U.escapeHtml(
        p.name
      ) +
      '</h1>' +

      '<p class="product-detail-short">' +
      U.escapeHtml(
        p.short
      ) +
      '</p>' +


      /* PRICE */

      '<div class="product-detail-price">' +

      '<span id="pd-price" class="price-now">' +
      U.formatINR(
        selectedNow
      ) +
      '</span> ' +

      '<span id="pd-mrp" class="price-old">' +

      (
        p.discount
          ? U.formatINR(
              selectedMrp
            )
          : ''
      ) +

      '</span>' +

      '</div>' +


      /* SELECTED STOCK */

      '<p id="pd-stock" class="stock stock-' +
      (
        packHasStock(
          selectedPack
        )
          ? 'in_stock'
          : 'out_of_stock'
      ) +
      '">' +

      U.escapeHtml(
        detailStockText
      ) +

      '</p>' +


      /* PACK SELECTOR */

      '<div class="product-pack-section">' +

      '<h3>Select pack size</h3>' +

      '<div class="pack-options">' +
      packOptions +
      '</div>' +

      '</div>' +


      /* QUANTITY */

      '<div class="product-qty-section">' +

      '<h3>Quantity</h3>' +

      '<div class="qty-control">' +

      '<button type="button" id="qty-dec" aria-label="Decrease quantity">−</button>' +

      '<input id="qty-input" type="number" min="1" max="99" value="1" inputmode="numeric" aria-label="Quantity">' +

      '<button type="button" id="qty-inc" aria-label="Increase quantity">+</button>' +

      '</div>' +

      '</div>' +


      /* TOTAL */

      '<div class="product-detail-total">' +

      '<span>Total</span>' +

      '<strong id="pd-total">' +
      U.formatINR(
        selectedNow
      ) +
      '</strong>' +

      '</div>' +


      /* ACTIONS */

      '<div class="product-detail-actions">' +

      '<button type="button" id="pd-add" class="btn btn-primary"' +

      (
        allOut
          ? ' disabled'
          : ''
      ) +

      '>' +

      (
        allOut
          ? 'Out of stock'
          : 'Add to Cart'
      ) +

      '</button>' +

      '<a id="pd-whatsapp" class="btn btn-whatsapp" href="' +
      U.whatsappLink(
        detailsWhatsappMessage
      ) +
      '" target="_blank" rel="noopener">WhatsApp</a>' +

      '</div>' +


      /* DESCRIPTION */

      '<div class="product-detail-description">' +

      '<h2>Product Details</h2>' +

      '<p>' +
      U.escapeHtml(
        p.description
      ) +
      '</p>' +

      '</div>' +


      (
        p.ingredients
          ? '<div class="product-info-row">' +
            '<strong>Ingredients:</strong> ' +
            U.escapeHtml(
              p.ingredients
            ) +
            '</div>'
          : ''
      ) +


      (
        p.allergens
          ? '<div class="product-info-row">' +
            '<strong>Allergen information:</strong> ' +
            U.escapeHtml(
              p.allergens
            ) +
            '</div>'
          : ''
      ) +


      (
        p.storage
          ? '<div class="product-info-row">' +
            '<strong>Storage:</strong> ' +
            U.escapeHtml(
              p.storage
            ) +
            '</div>'
          : ''
      ) +


      '</div>' +

      '</div>';


    /* ======================================================
       DETAILS ELEMENTS
    ====================================================== */

    var priceEl =
      document.getElementById(
        'pd-price'
      );


    var mrpEl =
      document.getElementById(
        'pd-mrp'
      );


    var totalEl =
      document.getElementById(
        'pd-total'
      );


    var stockEl =
      document.getElementById(
        'pd-stock'
      );


    var waEl =
      document.getElementById(
        'pd-whatsapp'
      );


    var qtyEl =
      document.getElementById(
        'qty-input'
      );


    var addButton =
      document.getElementById(
        'pd-add'
      );


    /* ======================================================
       CURRENT PACK

       IMPORTANT:
       Never silently fall back to p.packs[0]
       when a valid selected pack exists.
    ====================================================== */

    function currentPack() {

      var variant =
        getVariant(
          p.id,
          state.packId
        );


      if (
        variant &&
        variant.pack
      ) {

        return variant.pack;

      }


      return (
        firstAvailablePack(
          p
        ) ||
        p.packs[0]
      );

    }


    /* ======================================================
       UPDATE PRODUCT DETAILS
    ====================================================== */

    function update() {

      var pack =
        currentPack();


      if (!pack) {

        return;

      }


      var available =
        packHasStock(
          pack
        );


      var now =
        salePrice(
          pack.price,
          p.discount
        );


      priceEl.textContent =
        U.formatINR(
          now
        );


      mrpEl.textContent =
        p.discount
          ? U.formatINR(
              pack.price
            )
          : '';


      totalEl.textContent =
        U.formatINR(
          now *
          state.qty
        );


      /* SELECTED PACK STOCK */

      if (stockEl) {

        stockEl.textContent =
          packStockLabel(
            pack
          );


        stockEl.className =
          'stock ' +
          (
            available
              ? 'stock-in_stock'
              : 'stock-out_of_stock'
          );

      }


      /*
        Add button depends on SELECTED PACK,
        not only overall product stock.
      */

      if (addButton) {

        addButton.disabled =
          !available;


        addButton.textContent =
          available
            ? 'Add to Cart'
            : 'Out of stock';

      }


      /* WHATSAPP MESSAGE */

      var msg =
        'Hello Brit.Tuna, I would like to order:\n' +
        'Product: ' +
        p.name +
        '\nPack size: ' +
        pack.label +
        '\nQuantity: ' +
        state.qty +
        '\nLink: ' +
        absoluteUrl(
          productUrl(p)
        );


      if (waEl) {

        waEl.href =
          U.whatsappLink(
            msg
          );

      }

    }


    /* ======================================================
       QUANTITY
    ====================================================== */

    function setQty(number) {

      number =
        parseInt(
          number,
          10
        );


      if (
        !number ||
        number < 1
      ) {

        number =
          1;

      }


      if (
        number > 99
      ) {

        number =
          99;

      }


      var pack =
        currentPack();


      if (!pack) {

        return;

      }


      /*
        Do not allow quantity above
        database variant stock.
      */

      if (
        pack.stockQuantity !== null &&
        pack.stockQuantity !== undefined &&
        number >
          Number(
            pack.stockQuantity
          )
      ) {

        number =
          Number(
            pack.stockQuantity
          );


        if (number < 1) {

          number =
            1;

        }


        toast(
          'Only ' +
          pack.stockQuantity +
          ' available in this pack.'
        );

      }


      state.qty =
        number;


      qtyEl.value =
        number;


      update();

    }


    /* ======================================================
       PACK CHANGE
    ====================================================== */

    box.addEventListener(
      'change',

      function (e) {

        if (
          e.target.name !==
          'pack'
        ) {

          return;

        }


        var selected =
          getVariant(
            p.id,
            e.target.value
          );


        if (
          !selected ||
          !selected.pack
        ) {

          return;

        }


        /*
          Extra protection.

          Disabled radios normally cannot
          trigger this, but still verify stock.
        */

        if (
          !packHasStock(
            selected.pack
          )
        ) {

          toast(
            'This pack is currently out of stock.'
          );

          return;

        }


        state.packId =
          String(
            selected.pack.id
          );


        state.qty =
          1;


        qtyEl.value =
          1;


        update();

      }
    );


    /* ======================================================
       QUANTITY BUTTONS
    ====================================================== */

    document
      .getElementById(
        'qty-dec'
      )
      .addEventListener(
        'click',

        function () {

          setQty(
            state.qty - 1
          );

        }
      );


    document
      .getElementById(
        'qty-inc'
      )
      .addEventListener(
        'click',

        function () {

          setQty(
            state.qty + 1
          );

        }
      );


    qtyEl.addEventListener(
      'change',

      function () {

        setQty(
          qtyEl.value
        );

      }
    );


    /* ======================================================
       ADD TO CART — PRODUCT DETAILS
    ====================================================== */

    addButton.addEventListener(
      'click',

      async function () {

        if (
          !window.BTCart
        ) {

          console.error(
            'Brit.Tuna: Cart is not available.'
          );

          toast(
            'Cart is unavailable. Please refresh the page.'
          );

          return;

        }


        var button =
          this;


        var oldText =
          button.textContent;


        var pack =
          currentPack();


        if (
          !pack ||
          !packHasStock(
            pack
          )
        ) {

          toast(
            'This pack is currently out of stock.'
          );


          button.disabled =
            true;


          button.textContent =
            'Out of stock';


          return;

        }


        button.disabled =
          true;


        button.textContent =
          'Adding...';


        try {

          var ok =
            await window.BTCart.add(
              p.id,
              pack.id,
              state.qty
            );


          if (ok) {

            toast(
              p.name +
              ' (' +
              pack.label +
              ') × ' +
              state.qty +
              ' added to cart'
            );

          }


        } catch (error) {

          console.error(
            'Brit.Tuna: Add to cart failed.',
            error
          );


          toast(
            'Unable to add this product. Please try again.'
          );


        } finally {

          /*
            Re-check selected variant.

            Do NOT use only p.stock here.
          */

          var current =
            currentPack();


          var available =
            current &&
            packHasStock(
              current
            );


          button.disabled =
            !available;


          button.textContent =
            available
              ? 'Add to Cart'
              : 'Out of stock';

        }

      }
    );


    /* ======================================================
       INITIAL DETAILS UPDATE
    ====================================================== */

    update();


    /* ======================================================
       RELATED PRODUCTS
    ====================================================== */

    var related =
      document.getElementById(
        'related-grid'
      );


    if (related) {

      var same =
        cache.filter(
          function (item) {

            return (
              item.category ===
                p.category &&
              item.id !==
                p.id
            );

          }
        );


      var others =
        cache.filter(
          function (item) {

            return (
              item.category !==
              p.category
            );

          }
        );


      renderGrid(
        related,

        same
          .concat(
            others
          )
          .slice(
            0,
            4
          )
      );

    }

  }
     /* ==========================================================
     PRODUCT CARD ADD TO CART

     IMPORTANT FIX:
     Never automatically add product.packs[0].

     Always find the first pack that actually
     has stock.

     Example:
     Premium Peanuts

     250g -> stock 0
     500g -> stock 40

     Result:
     Add to Cart -> 500g
  ========================================================== */

  document.addEventListener(
    'click',

    async function (e) {

      var button =
        e.target.closest(
          '.js-add-card'
        );


      if (!button) {

        return;

      }


      var product =
        getById(
          button.getAttribute(
            'data-product-id'
          )
        );


      if (
        !product ||
        !product.packs ||
        !product.packs.length
      ) {

        toast(
          'Product is unavailable.'
        );

        return;

      }


      if (!window.BTCart) {

        console.error(
          'Brit.Tuna: Cart is not available.'
        );


        toast(
          'Cart is unavailable. Please refresh the page.'
        );

        return;

      }


      /*
        IMPORTANT:

        Do not use:
        product.packs[0]

        because the first variant may have
        stock_quantity = 0.
      */

      var pack =
        firstAvailablePack(
          product
        );


      /*
        No pack with stock means the whole
        product is unavailable.
      */

      if (!pack) {

        toast(
          'This product is currently out of stock.'
        );


        button.disabled =
          true;


        button.textContent =
          'Out of stock';


        return;

      }


      /*
        Extra protection.

        firstAvailablePack() already checks this,
        but verify again before adding.
      */

      if (
        !packHasStock(
          pack
        )
      ) {

        toast(
          pack.label +
          ' is currently out of stock.'
        );


        return;

      }


      var oldText =
        button.textContent;


      button.disabled =
        true;


      button.textContent =
        'Adding...';


      try {

        var ok =
          await window.BTCart.add(
            product.id,
            pack.id,
            1
          );


        if (ok) {

          toast(
            product.name +
            ' (' +
            pack.label +
            ') added to cart'
          );

        }


      } catch (error) {

        console.error(
          'Brit.Tuna: Add to cart failed.',
          error
        );


        toast(
          'Unable to add this product. Please try again.'
        );


      } finally {

        /*
          Re-check stock status after the
          cart operation.
        */

        var stillAvailable =
          firstAvailablePack(
            product
          );


        button.disabled =
          !stillAvailable;


        button.textContent =
          stillAvailable
            ? 'Add to Cart'
            : 'Out of stock';

      }

    }
  );


  /* ==========================================================
     BOOT
  ========================================================== */

  document.addEventListener(
    'DOMContentLoaded',

    function () {

      var page =
        document.body.getAttribute(
          'data-page'
        );


      load()
        .then(
          function () {

            if (
              page ===
              'home'
            ) {

              initHome();

            } else if (
              page ===
              'shop'
            ) {

              initShop();

            } else if (
              page ===
              'products'
            ) {

              initProducts();

            } else if (
              page ===
              'product-details'
            ) {

              initDetails();

            }

          }
        )
        .catch(
          function (error) {

            console.error(
              'Brit.Tuna: Product initialization failed.',
              error
            );

          }
        );

    }
  );


  /* ==========================================================
     PUBLIC API
  ========================================================== */

  window.BTProducts = {

    categories:
      CATEGORIES,

    priceRanges:
      PRICE_RANGES,

    load:
      load,

    getAll:
      getAll,

    getById:
      getById,

    getBySlug:
      getBySlug,

    getCategory:
      getCategory,

    getVariant:
      getVariant,

    salePrice:
      salePrice,

    fromPrice:
      fromPrice,

    imageFor:
      imageFor,

    stockLabel:
      stockLabel,

    filter:
      filter,

    cardHTML:
      cardHTML,

    productUrl:
      productUrl,


    /*
      Stock helper functions are exposed
      because cart.js can use these later.
    */

    packHasStock:
      packHasStock,

    availablePacks:
      availablePacks,

    firstAvailablePack:
      firstAvailablePack,

    hasAvailableStock:
      hasAvailableStock,

    packStockLabel:
      packStockLabel,

    productStockStatus:
      productStockStatus

  };


})();
