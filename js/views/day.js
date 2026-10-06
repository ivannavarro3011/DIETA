import { SHIFTS } from '../shifts.js';
import { formatDateHuman, addDays, todayStr, round1 } from '../utils.js';
import {
  getDayMeals, setDayTurno, addItemToSlot, removeItemFromSlot,
  getAllFoods, getSettings, computeDayTotals,
  getAllRecipes, applyRecipeToSlot, generateDayMenu,
} from '../store.js';
import { slotCategory } from '../meal-category.js';
import { recipeMatches, scaleRecipe, slotShareKcal, totalsOf } from '../menu-planner.js';

let state = {
  date: todayStr(),
  day: null,
  foods: [],
  settings: null,
  recipes: [],
};

export async function renderDay(container) {
  state.date = state.date || todayStr();
  const [day, foods, settings, recipes] = await Promise.all([
    getDayMeals(state.date), getAllFoods(), getSettings(), getAllRecipes(),
  ]);
  state.day = day;
  state.foods = foods;
  state.settings = settings;
  state.recipes = recipes;

  const foodsById = new Map(foods.map((f) => [f.id, f]));
  const totals = computeDayTotals(day, foodsById);

  container.innerHTML = `
    <div class="day-header">
      <button class="icon-btn" id="prevDay">‹</button>
      <div class="day-title">
        <div class="day-date">${formatDateHuman(state.date)}</div>
        ${state.date === todayStr() ? '<div class="day-badge">Hoy</div>' : ''}
      </div>
      <button class="icon-btn" id="nextDay">›</button>
    </div>

    <div class="card">
      <label class="field-label">Turno</label>
      <select id="turnoSelect" class="select">
        ${Object.entries(SHIFTS).map(([key, s]) => `
          <option value="${key}" ${key === day.turno ? 'selected' : ''}>${s.label}</option>
        `).join('')}
      </select>
    </div>

    <div class="card summary-card">
      ${macroBar('Calorías', totals.kcal, settings.kcalObjetivo, 'kcal')}
      ${macroBar('Proteína', totals.prot, settings.proteinaObjetivo, 'g')}
      ${macroBar('Carbohidratos', totals.carbs, settings.carbosObjetivo, 'g')}
      ${macroBar('Grasas', totals.grasa, settings.grasaObjetivo, 'g')}
    </div>

    ${day.turno !== 'libre' ? `
      <button class="generate-menu-btn" id="generateMenuBtn">
        🍽️ Generar menú del día
      </button>
    ` : ''}

    <div id="slotsContainer"></div>
  `;

  container.querySelector('#prevDay').onclick = () => { state.date = addDays(state.date, -1); renderDay(container); };
  container.querySelector('#nextDay').onclick = () => { state.date = addDays(state.date, 1); renderDay(container); };
  container.querySelector('#turnoSelect').onchange = async (e) => {
    await setDayTurno(state.date, e.target.value);
    renderDay(container);
  };
  const generateBtn = container.querySelector('#generateMenuBtn');
  if (generateBtn) {
    generateBtn.onclick = async () => {
      const slots = SHIFTS[state.day.turno]?.slots || [];
      await generateDayMenu(state.date, slots);
      renderDay(container);
    };
  }

  renderSlots(container.querySelector('#slotsContainer'), foodsById);
}

function macroBar(label, value, objetivo, unit) {
  const pct = objetivo > 0 ? Math.min(100, Math.round((value / objetivo) * 100)) : 0;
  return `
    <div class="macro-row">
      <div class="macro-row-top">
        <span>${label}</span>
        <span>${round1(value)} / ${round1(objetivo)} ${unit}</span>
      </div>
      <div class="progress"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>
  `;
}

function renderSlots(el, foodsById) {
  const slots = SHIFTS[state.day.turno]?.slots || SHIFTS.libre.slots;

  el.innerHTML = slots.map((slot) => {
    const entry = state.day.entries.find((e) => e.slotName === slot.name);
    const items = entry ? entry.items : [];
    const slotTotal = items.reduce((acc, item) => {
      const f = foodsById.get(item.foodId);
      if (!f) return acc;
      const factor = item.gramos / 100;
      return acc + f.kcal100 * factor;
    }, 0);

    return `
      <div class="card slot-card">
        <div class="slot-header">
          <div>
            <div class="slot-name">${slot.name}</div>
            ${slot.hora ? `<div class="slot-hora">${slot.hora}</div>` : ''}
          </div>
          <div class="slot-kcal">${round1(slotTotal)} kcal</div>
        </div>
        <div class="slot-items">
          ${items.map((item) => {
            const f = foodsById.get(item.foodId);
            return `
              <div class="slot-item" data-slot="${slot.name}" data-item="${item.id}">
                <span>${f ? f.nombre : '(alimento eliminado)'} · ${item.gramos}g</span>
                <button class="remove-item-btn" data-slot="${slot.name}" data-item="${item.id}">✕</button>
              </div>
            `;
          }).join('') || '<div class="empty-hint">Sin alimentos añadidos</div>'}
        </div>
        <div class="slot-actions">
          <button class="suggest-btn" data-slot="${slot.name}">🍳 Sugerencias</button>
          <button class="add-food-btn" data-slot="${slot.name}">+ Alimento suelto</button>
        </div>
      </div>
    `;
  }).join('');

  el.querySelectorAll('.add-food-btn').forEach((btn) => {
    btn.onclick = () => openAddFoodModal(btn.dataset.slot, el);
  });
  el.querySelectorAll('.suggest-btn').forEach((btn) => {
    btn.onclick = () => openSuggestionsModal(btn.dataset.slot);
  });
  el.querySelectorAll('.remove-item-btn').forEach((btn) => {
    btn.onclick = async () => {
      await removeItemFromSlot(state.date, btn.dataset.slot, btn.dataset.item);
      state.day = await getDayMeals(state.date);
      renderSlots(el, new Map(state.foods.map((f) => [f.id, f])));
      refreshSummary();
    };
  });
}

async function refreshSummary() {
  const container = document.getElementById('view-container');
  if (container) renderDay(container);
}

function openSuggestionsModal(slotName) {
  const modalRoot = document.getElementById('modal-root');
  const foodsById = new Map(state.foods.map((f) => [f.id, f]));
  const category = slotCategory(slotName);
  const slots = SHIFTS[state.day.turno]?.slots || SHIFTS.libre.slots;
  const targetKcal = slotShareKcal(slots, slotName, state.settings.kcalObjetivo);
  const candidates = state.recipes
    .filter((r) => recipeMatches(r, category))
    .map((r) => scaleRecipe(r, targetKcal, foodsById));

  modalRoot.innerHTML = `
    <div class="modal-backdrop" id="modalBackdrop">
      <div class="modal">
        <div class="modal-header">
          <span>Sugerencias para ${slotName}</span>
          <button class="icon-btn" id="closeModal">✕</button>
        </div>
        <div class="empty-hint">Cantidades ajustadas a unas ${Math.round(targetKcal)} kcal para esta comida.</div>
        <div class="recipe-results">
          ${candidates.map((r) => {
            const totals = totalsOf(r.items, foodsById);
            const ingredientes = r.items.map((i) => {
              const f = foodsById.get(i.foodId);
              return f ? `${f.nombre} ${i.gramos}g` : null;
            }).filter(Boolean).join(' · ');
            return `
              <div class="recipe-card">
                <div class="recipe-card-header">
                  <span class="recipe-name">${r.nombre}</span>
                  <span class="recipe-kcal">${round1(totals.kcal)} kcal</span>
                </div>
                <div class="recipe-macros">P${round1(totals.prot)}g · C${round1(totals.carbs)}g · G${round1(totals.grasa)}g</div>
                <div class="recipe-ingredients">${ingredientes}</div>
                <button class="primary-btn small recipe-add-btn" data-recipe="${r.id}">Añadir esta comida</button>
              </div>
            `;
          }).join('') || '<div class="empty-hint">No hay recetas para esta franja todavía. Añádelas en la pestaña Alimentos o edita seed-recipes.js.</div>'}
        </div>
      </div>
    </div>
  `;

  const close = () => { modalRoot.innerHTML = ''; };
  document.getElementById('modalBackdrop').onclick = (e) => { if (e.target.id === 'modalBackdrop') close(); };
  document.getElementById('closeModal').onclick = close;

  modalRoot.querySelectorAll('.recipe-add-btn').forEach((btn) => {
    btn.onclick = async () => {
      const recipe = candidates.find((r) => r.id === Number(btn.dataset.recipe));
      if (!recipe) return;
      await applyRecipeToSlot(state.date, slotName, recipe);
      close();
      const container = document.getElementById('view-container');
      renderDay(container);
    };
  });
}

function openAddFoodModal(slotName, slotsEl) {
  const modalRoot = document.getElementById('modal-root');
  modalRoot.innerHTML = `
    <div class="modal-backdrop" id="modalBackdrop">
      <div class="modal">
        <div class="modal-header">
          <span>Añadir a ${slotName}</span>
          <button class="icon-btn" id="closeModal">✕</button>
        </div>
        <input type="text" id="foodSearch" class="input" placeholder="Buscar alimento..." autofocus />
        <div id="foodResults" class="food-results"></div>
      </div>
    </div>
  `;

  const backdrop = document.getElementById('modalBackdrop');
  backdrop.onclick = (e) => { if (e.target === backdrop) closeModal(); };
  document.getElementById('closeModal').onclick = closeModal;

  const searchInput = document.getElementById('foodSearch');
  const resultsEl = document.getElementById('foodResults');

  function renderResults(query) {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? state.foods.filter((f) => f.nombre.toLowerCase().includes(q))
      : state.foods;
    resultsEl.innerHTML = filtered.slice(0, 50).map((f) => `
      <div class="food-result" data-id="${f.id}">
        <span>${f.nombre}</span>
        <span class="food-result-kcal">${f.kcal100} kcal/100g</span>
      </div>
    `).join('') || '<div class="empty-hint">Sin resultados</div>';

    resultsEl.querySelectorAll('.food-result').forEach((row) => {
      row.onclick = () => selectFood(Number(row.dataset.id));
    });
  }

  function selectFood(foodId) {
    const food = state.foods.find((f) => f.id === foodId);
    modalRoot.querySelector('.modal').innerHTML = `
      <div class="modal-header">
        <span>${food.nombre}</span>
        <button class="icon-btn" id="closeModal2">✕</button>
      </div>
      <label class="field-label">Cantidad (gramos)</label>
      <input type="number" id="gramosInput" class="input" value="100" min="1" step="1" autofocus />
      <div class="modal-preview" id="modalPreview"></div>
      <button class="primary-btn" id="confirmAddFood">Añadir</button>
    `;
    document.getElementById('closeModal2').onclick = closeModal;
    const gramosInput = document.getElementById('gramosInput');
    const preview = document.getElementById('modalPreview');
    function updatePreview() {
      const g = Number(gramosInput.value) || 0;
      const factor = g / 100;
      preview.innerHTML = `${round1(food.kcal100 * factor)} kcal · P ${round1(food.prot100 * factor)}g · C ${round1(food.carbs100 * factor)}g · G ${round1(food.grasa100 * factor)}g`;
    }
    gramosInput.oninput = updatePreview;
    updatePreview();
    gramosInput.focus();
    gramosInput.select();

    document.getElementById('confirmAddFood').onclick = async () => {
      const gramos = Number(gramosInput.value) || 0;
      if (gramos <= 0) return;
      await addItemToSlot(state.date, slotName, { foodId, gramos });
      state.day = await getDayMeals(state.date);
      closeModal();
      const container = document.getElementById('view-container');
      renderDay(container);
    };
  }

  function closeModal() {
    modalRoot.innerHTML = '';
  }

  searchInput.oninput = () => renderResults(searchInput.value);
  renderResults('');
}
