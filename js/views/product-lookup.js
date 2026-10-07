import { searchProducts, getProductByBarcode } from '../food-lookup.js';
import { startScanner } from '../barcode-scanner.js';
import { escapeHtml } from '../utils.js';

function lookupErrorMessage(err) {
  if (err?.message === 'offline' || !navigator.onLine) return 'Sin conexión. Para buscar productos necesitas internet.';
  return 'El buscador de Open Food Facts está saturado ahora mismo. Prueba otra vez en un momento o escanea el código.';
}

// Buscador de supermercado (Open Food Facts) + escáner de códigos de barras.
// Llama a onSelect(producto) cuando el usuario elige uno. Devuelve { setQuery, setStatus, destroy }.
export function mountProductLookup(el, { onSelect, title = 'Buscar en supermercados', placeholder = 'Ej: skyr, Milsani quark, pechuga pavo' }) {
  let stopScan = null;

  el.innerHTML = `
    <div class="lookup-box">
      <div class="field-label">${escapeHtml(title)}</div>
      <div class="lookup-row">
        <input type="search" class="input" data-role="query" placeholder="${escapeHtml(placeholder)}" enterkeyhint="search" />
        <button class="primary-btn small" data-role="search">Buscar</button>
      </div>
      <button class="suggest-btn scan-btn" data-role="scan">📷 Escanear código de barras</button>
      <div class="scanner-area" data-role="scanner" hidden>
        <video class="scan-video" data-role="video" playsinline muted></video>
        <div class="lookup-row">
          <input type="text" class="input" data-role="code" inputmode="numeric" placeholder="O escribe el número del código" />
          <button class="primary-btn small" data-role="code-ok">OK</button>
        </div>
        <button class="link-btn" data-role="cancel-scan">Cancelar escaneo</button>
      </div>
      <div class="empty-hint" data-role="status" hidden></div>
      <div class="food-results" data-role="results"></div>
    </div>
  `;

  const $ = (role) => el.querySelector(`[data-role="${role}"]`);
  const alive = () => el.isConnected;

  const setStatus = (text) => {
    if (!alive()) return;
    $('status').hidden = !text;
    $('status').textContent = text || '';
  };

  const stopScanner = () => {
    if (stopScan) { stopScan(); stopScan = null; }
    if (alive()) $('scanner').hidden = true;
  };

  const select = (product) => {
    stopScanner();
    $('results').innerHTML = '';
    onSelect(product);
  };

  function renderResults(products) {
    $('results').innerHTML = products.map((p, i) => `
      <div class="food-result lookup-result" data-idx="${i}">
        <span>${escapeHtml(p.nombre)}</span>
        <span class="food-result-kcal">${p.kcal100} kcal · P${p.prot100} C${p.carbs100} G${p.grasa100}</span>
      </div>
    `).join('');
    $('results').querySelectorAll('.lookup-result').forEach((row) => {
      row.onclick = () => select(products[Number(row.dataset.idx)]);
    });
  }

  async function runSearch() {
    const term = $('query').value.trim();
    if (!term) return;
    stopScanner();
    $('results').innerHTML = '';
    setStatus('Buscando…');
    $('search').disabled = true;
    try {
      const products = await searchProducts(term);
      if (!alive()) return;
      setStatus(products.length
        ? 'Elige el producto (primero salen los de España y Alemania), valores por 100 g:'
        : 'No he encontrado nada con macros. Prueba con otras palabras (vale en alemán) o escanea el código.');
      renderResults(products);
    } catch (err) {
      setStatus(lookupErrorMessage(err));
    } finally {
      if (alive()) $('search').disabled = false;
    }
  }

  async function lookupBarcode(code) {
    stopScanner();
    $('results').innerHTML = '';
    setStatus(`Buscando el código ${code}…`);
    try {
      const product = await getProductByBarcode(code);
      if (!alive()) return;
      if (product) select(product);
      else setStatus(`El código ${code} no está en Open Food Facts o no tiene macros. Puedes crearlo a mano en Alimentos.`);
    } catch (err) {
      setStatus(lookupErrorMessage(err));
    }
  }

  $('search').onclick = runSearch;
  $('query').onkeydown = (e) => { if (e.key === 'Enter') runSearch(); };

  $('scan').onclick = () => {
    if (stopScan) return;
    $('results').innerHTML = '';
    setStatus('Apunta la cámara al código de barras…');
    $('scanner').hidden = false;
    $('video').hidden = false;
    stopScan = startScanner(
      $('video'),
      (code) => { stopScan = null; lookupBarcode(code); },
      () => {
        stopScan = null;
        if (!alive()) return;
        $('video').hidden = true;
        setStatus('No he podido usar la cámara. Revisa el permiso de cámara o escribe el número del código.');
      },
    );
  };
  $('cancel-scan').onclick = () => { stopScanner(); setStatus(''); };
  $('code-ok').onclick = () => {
    const code = $('code').value.replace(/\D/g, '');
    if (code.length >= 8) lookupBarcode(code);
    else setStatus('El código de barras tiene 8 o 13 números.');
  };

  return {
    setQuery: (text) => { $('query').value = text; },
    setStatus,
    destroy: stopScanner,
  };
}
