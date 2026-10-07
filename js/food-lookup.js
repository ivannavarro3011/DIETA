// Búsqueda de macros en Open Food Facts (base de datos abierta, incluye supermercados
// españoles y alemanes). Solo se usa al dar de alta alimentos: requiere conexión.

const OFF = 'https://world.openfoodfacts.org';
const FIELDS = 'code,product_name,product_name_es,product_name_de,brands,countries_tags,nutriments';
const PREFERRED_COUNTRIES = ['en:spain', 'en:germany'];
// El buscador de OFF suele devolver 503 cuando está saturado; reintentando unas veces responde.
const MAX_ATTEMPTS = 4;
const RETRY_DELAY_MS = 1000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJsonWithRetry(url) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
      lastError = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastError = e;
    }
    if (!navigator.onLine) throw new Error('offline');
    if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS);
  }
  throw lastError;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null;
}

export function parseProduct(p) {
  const n = p.nutriments || {};
  let kcal = num(n['energy-kcal_100g']);
  if (kcal === null && num(n['energy_100g']) !== null) kcal = num(n['energy_100g'] / 4.184);
  const prot = num(n.proteins_100g);
  const carbs = num(n.carbohydrates_100g);
  const grasa = num(n.fat_100g);
  if (kcal === null || (prot === null && carbs === null && grasa === null)) return null;

  const name = (p.product_name_es || p.product_name || p.product_name_de || '').trim();
  if (!name) return null;
  const brand = (Array.isArray(p.brands) ? p.brands[0] : (p.brands || '').split(',')[0]).trim();
  return {
    code: p.code,
    nombre: brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${name} (${brand})` : name,
    kcal100: kcal,
    prot100: prot ?? 0,
    carbs100: carbs ?? 0,
    grasa100: grasa ?? 0,
    countries: p.countries_tags || [],
  };
}

function countryScore(product) {
  return PREFERRED_COUNTRIES.some((c) => product.countries.includes(c)) ? 0 : 1;
}

export async function searchProducts(term) {
  const url = `${OFF}/cgi/search.pl?search_terms=${encodeURIComponent(term)}`
    + `&search_simple=1&action=process&json=1&page_size=30&fields=${FIELDS}`;
  const data = await fetchJsonWithRetry(url);
  return (data.products || [])
    .map(parseProduct)
    .filter(Boolean)
    .sort((a, b) => countryScore(a) - countryScore(b))
    .slice(0, 15);
}

export async function getProductByBarcode(code) {
  const data = await fetchJsonWithRetry(`${OFF}/api/v2/product/${encodeURIComponent(code)}?fields=${FIELDS}`);
  return data.status === 1 && data.product ? parseProduct({ code, ...data.product }) : null;
}

// Categoría orientativa según de dónde vienen la mayoría de calorías.
export function guessCategory({ kcal100, prot100, carbs100, grasa100 }) {
  if (kcal100 < 50 && prot100 < 5) return 'Verdura';
  const fromProt = prot100 * 4;
  const fromCarbs = carbs100 * 4;
  const fromFat = grasa100 * 9;
  if (fromProt >= fromCarbs && fromProt >= fromFat) return 'Proteína';
  if (fromFat > fromCarbs) return 'Grasas';
  return 'Hidratos';
}
