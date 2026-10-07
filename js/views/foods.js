import { getAllFoods, addFood, updateFood, deleteFood } from '../store.js';
import { CATEGORIES } from '../seed-foods.js';
import { guessCategory } from '../food-lookup.js';
import { mountProductLookup } from './product-lookup.js';
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

function openFoodModal(container, food) {
  const modalRoot = document.getElementById('modal-root');
  const isNew = !food;
  const f = food || { nombre: '', categoria: 'Proteína', kcal100: '', prot100: '', carbs100: '', grasa100: '' };
  let appliedProduct = null;

  modalRoot.innerHTML = `
    <div class="modal-backdrop" id="modalBackdrop">
      <div class="modal">
        <div class="modal-header">
          <span>${isNew ? 'Nuevo alimento' : 'Editar alimento'}</span>
          <button class="icon-btn" id="closeModal">✕</button>
        </div>

        <div id="productLookup"></div>

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

  const lookup = mountProductLookup($('productLookup'), {
    title: 'Rellenar macros automáticamente',
    onSelect: (p) => {
      appliedProduct = p;
      $('fNombre').value = p.nombre;
      $('fCategoria').value = guessCategory(p);
      $('fKcal').value = p.kcal100;
      $('fProt').value = p.prot100;
      $('fCarbs').value = p.carbs100;
      $('fGrasa').value = p.grasa100;
      lookup.setStatus('Datos de Open Food Facts por 100 g. Revísalos con la etiqueta antes de guardar.');
    },
  });

  const close = () => {
    lookup.destroy();
    modalRoot.innerHTML = '';
  };
  $('modalBackdrop').onclick = (e) => { if (e.target.id === 'modalBackdrop') close(); };
  $('closeModal').onclick = close;

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
    if (appliedProduct) {
      payload.codigo = appliedProduct.code;
      payload.porciones = appliedProduct.porciones;
    }
    // Un producto escaneado que ya estaba guardado se actualiza en vez de duplicarse.
    const target = isNew && payload.codigo
      ? (await getAllFoods()).find((x) => x.codigo === payload.codigo)
      : food;
    if (target) {
      await updateFood({ ...target, ...payload, id: target.id });
    } else {
      await addFood(payload);
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
