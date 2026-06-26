/* =============================================================
   api.js — VESTRA Product API Layer
   -------------------------------------------------------------
   HOW TO ACTIVATE JSONBIN:
   1. Go to https://jsonbin.io and create a free account.
   2. Create a new Bin containing:  { "products": [], "_nextId": 1 }
   3. Copy your Bin ID and Master API Key into the two constants below.
   4. Set USE_JSONBIN = true.
   5. Done — no other file needs to change.
   ============================================================= */

/* ── STEP 1: Paste your credentials here ─────────────────── */
const BIN_ID  = "6a3defedda38895dfe00b5f6";          // e.g. "6642f3a5acd3cb34a83f1234"
const API_KEY = "$2a$10$FoNOKxVnZzAjrsZmByPJN.d7ecOY7va6zniXhQ.HGGWOFdlq0kES6";         // e.g. "$2a$10$abc...xyz"
/* ─────────────────────────────────────────────────────────── */

/* ── STEP 2: Flip to true once credentials are set ────────── */
const USE_JSONBIN = true;
/* ─────────────────────────────────────────────────────────── */

const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

const JSONBIN_HEADERS = {
  "Content-Type": "application/json",
  "X-Master-Key": API_KEY,
  "X-Bin-Versioning": "false"   // always overwrites; no version history clutter
};

/* =============================================================
   LOCAL FALLBACK STORE
   Used when USE_JSONBIN = false.
   Mirrors the exact same shape as the JSONBin bin.
   ============================================================= */
const _local = {
  products: [
    {
      id: 1, name: "Wool Tailored Overcoat", cat: "Outerwear",
      desc: "Hand-finished in a double-faced wool blend. A silhouette built to last.",
      img: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=900&auto=format&fit=crop",
      price: 8200, discount: 15
    },
    {
      id: 2, name: "Silk Evening Shirt", cat: "Tailoring",
      desc: "Pure silk, woven in Portugal. Cut for a clean, composed drape.",
      img: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=900&auto=format&fit=crop",
      price: 3400, discount: 0
    },
    {
      id: 3, name: "Cashmere Turtleneck", cat: "Knitwear",
      desc: "Mongolian cashmere, 12-gauge knit. Soft enough to wear against bare skin.",
      img: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=900&auto=format&fit=crop",
      price: 4600, discount: 10
    },
    {
      id: 4, name: "Leather Crossbody", cat: "Accessories",
      desc: "Full-grain vegetable-tanned leather. Ages into something personal.",
      img: "https://images.unsplash.com/photo-1547949003-9792a18a2645?q=80&w=900&auto=format&fit=crop",
      price: 5200, discount: 0
    },
    {
      id: 5, name: "Pleated Wide Trousers", cat: "Tailoring",
      desc: "Wide-leg, high-rise. A silhouette borrowed from the finest Italian tailoring.",
      img: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=900&auto=format&fit=crop",
      price: 2900, discount: 0
    },
    {
      id: 6, name: "Structured Blazer", cat: "Outerwear",
      desc: "A canvas-front construction that holds its shape — season after season.",
      img: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=900&auto=format&fit=crop",
      price: 7100, discount: 20
    },
    {
      id: 7, name: "Minimal Leather Belt", cat: "Accessories",
      desc: "Single-piece calfskin, blind-stitched edges. No logo, just craft.",
      img: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?q=80&w=900&auto=format&fit=crop",
      price: 1450, discount: 0
    },
    {
      id: 8, name: "Merino Crewneck", cat: "Knitwear",
      desc: "Extra-fine merino from New Zealand. Layers invisibly, stands alone beautifully.",
      img: "https://images.unsplash.com/photo-1638503587600-c01a3c2c8b2e?q=80&w=900&auto=format&fit=crop",
      price: 2600, discount: 0
    }
  ],
  _nextId: 9
};

/* =============================================================
   INTERNAL HELPERS
   ============================================================= */

/**
 * Fetch the full bin from JSONBin and return the parsed record.
 * @returns {Promise<{products: Product[], _nextId: number}>}
 */
async function _fetchBin() {
  const res = await fetch(JSONBIN_URL, {
    method: "GET",
    headers: JSONBIN_HEADERS
  });
  if (!res.ok) throw new Error(`JSONBin GET failed: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.record;                   // JSONBin wraps the bin in { record: {...} }
}

/**
 * Write the full record back to JSONBin.
 * @param {{products: Product[], _nextId: number}} record
 * @returns {Promise<void>}
 */
async function _writeBin(record) {
  const res = await fetch(JSONBIN_URL, {
    method: "PUT",
    headers: JSONBIN_HEADERS,
    body: JSON.stringify(record)
  });
  if (!res.ok) throw new Error(`JSONBin PUT failed: ${res.status} ${res.statusText}`);
}

/* =============================================================
   PUBLIC API
   All five functions are async and return Promises.
   index.html calls them with await inside async handlers.
   ============================================================= */

/**
 * loadProducts()
 * Returns the full products array.
 * ─ Local  : reads from _local.products
 * ─ JSONBin: GET /v3/b/{BIN_ID}  →  record.products
 *
 * @returns {Promise<Product[]>}
 */
async function loadProducts() {
  if (!USE_JSONBIN) {
    return _local.products.slice();
  }
  const record = await _fetchBin();
  // Sync the in-memory counter so new IDs don't collide
  _local._nextId = record._nextId || (_local._nextId);
  return record.products || [];
}

/**
 * saveProducts(products)
 * Overwrites the full products array. Used for bulk operations.
 * ─ Local  : replaces _local.products
 * ─ JSONBin: PUT /v3/b/{BIN_ID}  body = { products, _nextId }
 *
 * @param {Product[]} products
 * @returns {Promise<void>}
 */
async function saveProducts(products) {
  if (!USE_JSONBIN) {
    _local.products = products;
    return;
  }
  await _writeBin({ products, _nextId: _local._nextId });
}

/**
 * addProduct(data)
 * Creates a new product and appends it.
 * ─ Local  : pushes into _local.products with auto-incremented id
 * ─ JSONBin: read → append → PUT
 *
 * @param {{name:string, cat:string, desc:string, img:string, price:number, discount:number}} data
 * @returns {Promise<Product>}  the newly created product (with its assigned id)
 */
async function addProduct(data) {
  if (!USE_JSONBIN) {
    const product = { id: _local._nextId++, ...data };
    _local.products.push(product);
    return product;
  }
  const record = await _fetchBin();
  const product = { id: record._nextId++, ...data };
  record.products.push(product);
  // Sync local counter
  _local._nextId = record._nextId;
  await _writeBin(record);
  return product;
}

/**
 * updateProduct(data)
 * Merges changed fields into the product matching data.id.
 * ─ Local  : finds index and Object.assign's in place
 * ─ JSONBin: read → mutate → PUT
 *
 * @param {{id:number, [key:string]:any}} data  must include id + any fields to change
 * @returns {Promise<Product>}  the updated product
 */
async function updateProduct(data) {
  if (!USE_JSONBIN) {
    const idx = _local.products.findIndex(p => p.id === data.id);
    if (idx === -1) throw new Error(`Product id ${data.id} not found`);
    _local.products[idx] = { ..._local.products[idx], ...data };
    return _local.products[idx];
  }
  const record = await _fetchBin();
  const idx = record.products.findIndex(p => p.id === data.id);
  if (idx === -1) throw new Error(`Product id ${data.id} not found in bin`);
  record.products[idx] = { ...record.products[idx], ...data };
  await _writeBin(record);
  return record.products[idx];
}

/**
 * deleteProduct(id)
 * Removes the product with the given id.
 * ─ Local  : filters _local.products
 * ─ JSONBin: read → filter → PUT
 *
 * @param {number} id
 * @returns {Promise<void>}
 */
async function deleteProduct(id) {
  if (!USE_JSONBIN) {
    _local.products = _local.products.filter(p => p.id !== id);
    return;
  }
  const record = await _fetchBin();
  record.products = record.products.filter(p => p.id !== id);
  await _writeBin(record);
}