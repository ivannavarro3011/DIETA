import { getAllFoods, addFood, updateFood, deleteFood } from '../store.js';
import { CATEGORIES } from '../seed-foods.js';
import { searchProducts, getProductByBarcode, guessCategory } from '../food-lookup.js';
import { startScanner } from '../barcode-scanner.js';
import { escapeHtml } from '../utils.js';

let searchQuery = '';

export async function renderFoods(container) {
  const foods = await getAllFoods();

  container.innerHTML = `
    <div class="card">
      <div class="section-title">Base de alimentos</div>
      <input type="text" id="foodsSearch" class="input" placeholder="Buscar..." value="${escapeHtml(searchQuery)}" />
    </div>
    <div class="card">
      <div id="foodsList"></div>
      <button class="add-food-btn" id="newFoodBtn">+ Nuevo alimento</button>
    </div>
  `;

  renderList(container, foods);

  container.querySelector('#foodsSearch').oninput = (e) => {
    searchQuery = e.target.value;
    renderList(container, foods);
  };
  container.querySelector('#newFoodBtn').onclick = () => openFoodModal(container, null);
}

function renderList(container, foods) {
  const el = container.querySelector('#foodsList');
  const q = searchQuery.trim().toLowerCase();
  const filtered = q ? foods.filter((f) => f.nombre.toLowerCase().includes(q)) : foods;

  el.innerHTML = filtered.map((f) => `
    <div class="food-row" data-id="${f.id}">
      <div>
        <div class="food-row-name">${escapeHtml(f.nombre)}</div>
        <div class="food-row-macros">${f.kcal100} kcal · P${f.prot100} C${f.carbs100} G${f.grasa100} /100g</div>
      </div>
      <span class="food-row-cat">${escapeHtml(f.categoria || '')}</span>
    </div>
  `).join('') || '<div class="empty-hint">Sin resultados</div>';

  el.querySelectorAll('.food-row').forEach((row) => {
    row.onclick = () => {
      const food = foods.find((f) => f.id === Number(row.dataset.id));
      openFoodModal(container, food);
    };
  });
}

function lookupErrorMessage(err) {
  if (err?.message === 'offline' || !navigator.onLine) return 'Sin conexión. Para buscar los macros necesitas internet; puedes rellenarlos a mano.';
  return 'El buscador de Open Food Facts está saturado ahora mismo. Prueba otra vez en un momento, escanea el código o rellena a mano.';
}

function openFoodModal(container, food) {
  const modalRoot = document.getElementById('modal-root');
  const isNew = !food;
  const f = food || { nombre: '', categoria: 'Proteína', kcal100: '', prot100: '', carbs100: '', grasa100: '' };
  let stopScan = null;

  modalRoot.innerHTML = `
    <div class="modal-backdrop" id="modalBackdrop">
      <div class="modal">
        <div class="modal-header">
          <span>${isNew ? 'Nuevo alimento' : 'Editar alimento'}</span>
          <button class="icon-btn" id="closeModal">✕</button>
        </div>

        <div class="lookup-box">
          <div class="field-label">Rellenar macros automáticamente</div>
          <div class="lookup-row">
            <input type="search" id="lookupQuery" class="input" placeholder="Ej: skyr, Milsani quark, pechuga pavo" enterkeyhint="search" />
            <button class="primary-btn small" id="lookupBtn">Buscar</button>
          </div>
          <button class="suggest-btn scan-btn" id="scanBtn">📷 Escanear código de barras</button>
          <div id="scannerArea" class="scanner-area" hidden>
            <video id="scanVideo" class="scan-video" playsinline muted></video>
            <div class="lookup-row">
              <input type="text" id="manualCode" class="input" inputmode="numeric" placeholder="O escribe el número del código" />
              <button class="primary-btn small" id="manualCodeBtn">OK</button>
            </div>
            <button class="link-btn" id="cancelScanBtn">Cancelar escaneo</button>
          </div>
          <div id="lookupStatus" class="empty-hint" hidden></div>
          <div id="lookupResults" class="food-results"></div>
        </div>

        <label class="field-label">Nombre</label>
        <input type="text" id="fNombre" class="input" value="${escapeHtml(f.nombre)}" />
        <label class="field-label">Categoría</label>
        <select id="fCategoria" class="select">
          ${CATEGORIES.map((c) => `<option value="${c}" ${c === f.categoria ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
        <div class="macro-inputs">
          <div><label class="field-label">Kcal/100g</label><input type="number" id="fKcal" class="input" value="${f.kcal100}" /></div>
          <div><label class="field-label">Prot/100g</label><input type="number" id="fProt" class="input" value="${f.prot100}" /></div>
          <div><label class="field-label">Carbs/100g</label><input type="number" id="fCarbs" class="input" value="${f.carbs100}" /></div>
          <div><label class="field-label">Grasa/100g</label><input type="number" id="fGrasa" class="input" value="${f.grasa100}" /></div>
        </div>
        <button class="primary-btn" id="saveFoodBtn">${isNew ? 'Añadir' : 'Guardar cambios'}</button>
        ${!isNew ? '<button class="danger-btn" id="deleteFoodBtn">Eliminar alimento</button>' : ''}
      </div>
    </div>
  `;

  const $ = (id) => document.getElementById(id);
  const statusEl = $('lookupStatus');
  const resultsEl = $('lookupResults');

  const setStatus = (text) => {
    statusEl.hidden = !text;
    statusEl.textContent = text || '';
  };

  const stopScanner = () => {
    if (stopScan) { stopScan(); stopScan = null; }
    $('scannerArea').hidden = true;
  };

  const close = () => {
    stopScanner();
    modalRoot.innerHTML = '';
  };
  $('modalBackdrop').onclick = (e) => { if (e.target.id === 'modalBackdrop') close(); };
  $('closeModal').onclick = close;

  function applyProduct(p) {
    $('fNombre').value = p.nombre;
    $('fCategoria').value = guessCategory(p);
    $('fKcal').value = p.kcal100;
    $('fProt').value = p.prot100;
    $('fCarbs').value = p.carbs100;
    $('fGrasa').value = p.grasa100;
    resultsEl.innerHTML = '';
    setStatus('Datos de Open Food Facts por 100 g. Revísalos con la etiqueta antes de guardar.');
  }

  function renderResults(products) {
    resultsEl.innerHTML = products.map((p, i) => `
      <div class="food-result lookup-result" data-idx="${i}">
        <span>${escapeHtml(p.nombre)}</span>
        <span class="food-result-kcal">${p.kcal100} kcal · P${p.prot100} C${p.carbs100} G${p.grasa100}</span>
      </div>
    `).join('');
    resultsEl.querySelectorAll('.lookup-result').forEach((row) => {
      row.onclick = () => applyProduct(products[Number(row.dataset.idx)]);
    });
  }

  async function runSearch() {
    const term = $('lookupQuery').value.trim();
    if (!term) return;
    stopScanner();
    resultsEl.innerHTML = '';
    setStatus('Buscando…');
    $('lookupBtn').disabled = true;
    try {
      const products = await searchProducts(term);
      if (!$('lookupBtn')) return;
      setStatus(products.length
        ? 'Elige el producto (primero salen los de España y Alemania):'
        : 'No he encontrado nada con macros. Prueba con otras palabras (vale en alemán) o escanea el código.');
      renderResults(products);
    } catch (err) {
      if ($('lookupBtn')) setStatus(lookupErrorMessage(err));
    } finally {
      if ($('lookupBtn')) $('lookupBtn').disabled = false;
    }
  }

  async function lookupBarcode(code) {
    stopScanner();
    resultsEl.innerHTML = '';
    setStatus(`Buscando el código ${code}…`);
    try {
      const product = await getProductByBarcode(code);
      if (!$('lookupStatus')) return;
      if (product) applyProduct(product);
      else setStatus(`El código ${code} no está en Open Food Facts o no tiene macros. Rellénalos a mano con la etiqueta.`);
    } catch (err) {
      if ($('lookupStatus')) setStatus(lookupErrorMessage(err));
    }
  }

  $('lookupBtn').onclick = runSearch;
  $('lookupQuery').onkeydown = (e) => { if (e.key === 'Enter') runSearch(); };

  $('scanBtn').onclick = () => {
    if (stopScan) return;
    resultsEl.innerHTML = '';
    setStatus('Apunta la cámara al código de barras…');
    $('scannerArea').hidden = false;
    $('scanVideo').hidden = false;
    stopScan = startScanner(
      $('scanVideo'),
      (code) => { stopScan = null; lookupBarcode(code); },
      () => {
        stopScan = null;
        $('scanVideo').hidden = true;
        setStatus('No he podido usar la cámara. Revisa el permiso de cámara o escribe el número del código.');
      },
    );
  };
  $('cancelScanBtn').onclick = () => { stopScanner(); setStatus(''); };
  $('manualCodeBtn').onclick = () => {
    const code = $('manualCode').value.replace(/\D/g, '');
    if (code.length >= 8) lookupBarcode(code);
    else setStatus('El código de barras tiene 8 o 13 números.');
  };

  $('saveFoodBtn').onclick = async () => {
    const payload = {
      nombre: $('fNombre').value.trim(),
      categoria: $('fCategoria').value,
      kcal100: Number($('fKcal').value) || 0,
      prot100: Number($('fProt').value) || 0,
      carbs100: Number($('fCarbs').value) || 0,
      grasa100: Number($('fGrasa').value) || 0,
    };
    if (!payload.nombre) return;
    if (isNew) {
      await addFood(payload);
    } else {
      await updateFood({ ...payload, id: food.id });
    }
    close();
    renderFoods(container);
  };

  if (!isNew) {
    $('deleteFoodBtn').onclick = async () => {
      await deleteFood(food.id);
      close();
      renderFoods(container);
    };
  }
}
