import { SHIFTS } from '../shifts.js';
import { startOfWeek, weekDates, addDays, formatDateHuman, todayStr, round1 } from '../utils.js';
import {
  getDayMeals, setDayTurno, getAllFoods, computeDayTotals,
  getShoppingChecks, setShoppingCheck, getShoppingExtras, addShoppingExtra,
  toggleShoppingExtra, deleteShoppingExtra,
} from '../store.js';

let state = {
  monday: startOfWeek(todayStr()),
};

export async function renderWeek(container) {
  const monday = state.monday;
  const dates = weekDates(monday);
  const [foods, days] = await Promise.all([
    getAllFoods(),
    Promise.all(dates.map((d) => getDayMeals(d))),
  ]);
  const foodsById = new Map(foods.map((f) => [f.id, f]));

  container.innerHTML = `
    <div class="day-header">
      <button class="icon-btn" id="prevWeek">‹</button>
      <div class="day-title">
        <div class="day-date">Semana del ${formatShort(monday)} al ${formatShort(dates[6])}</div>
      </div>
      <button class="icon-btn" id="nextWeek">›</button>
    </div>

    <div class="card">
      <div class="section-title">Planificación por día</div>
      <div id="weekDays"></div>
    </div>

    <div class="card">
      <div class="section-title">Lista de la compra</div>
      <div class="empty-hint">Generada a partir de las comidas planificadas esta semana</div>
      <div id="shoppingList"></div>
      <div class="add-extra-row">
        <input type="text" id="extraName" class="input" placeholder="Añadir producto manual..." />
        <button class="primary-btn small" id="addExtraBtn">+</button>
      </div>
    </div>
  `;

  container.querySelector('#prevWeek').onclick = () => { state.monday = addDays(state.monday, -7); renderWeek(container); };
  container.querySelector('#nextWeek').onclick = () => { state.monday = addDays(state.monday, 7); renderWeek(container); };

  renderWeekDays(container.querySelector('#weekDays'), dates, days, foodsById, container);
  await renderShoppingList(container.querySelector('#shoppingList'), monday, days, foodsById);

  container.querySelector('#addExtraBtn').onclick = async () => {
    const input = container.querySelector('#extraName');
    const name = input.value.trim();
    if (!name) return;
    await addShoppingExtra(monday, name, '');
    input.value = '';
    await renderShoppingList(container.querySelector('#shoppingList'), monday, days, foodsById);
  };
}

function formatShort(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function renderWeekDays(el, dates, days, foodsById, container) {
  const weekdayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  el.innerHTML = dates.map((date, i) => {
    const day = days[i];
    const totals = computeDayTotals(day, foodsById);
    return `
      <div class="week-day-row">
        <div class="week-day-label">
          <div class="week-day-name">${weekdayNames[i]}</div>
          <div class="week-day-date">${formatShort(date)}</div>
        </div>
        <select class="select small" data-date="${date}">
          ${Object.entries(SHIFTS).map(([key, s]) => `
            <option value="${key}" ${key === day.turno ? 'selected' : ''}>${s.label.split(' (')[0]}</option>
          `).join('')}
        </select>
        <div class="week-day-kcal">${round1(totals.kcal)} kcal</div>
      </div>
    `;
  }).join('');

  el.querySelectorAll('select[data-date]').forEach((sel) => {
    sel.onchange = async () => {
      await setDayTurno(sel.dataset.date, sel.value);
      renderWeek(container);
    };
  });
}

async function renderShoppingList(el, monday, days, foodsById) {
  // Agrega gramos por alimento a partir de todas las comidas de la semana
  const totalsByFood = new Map();
  for (const day of days) {
    for (const entry of day.entries) {
      for (const item of entry.items) {
        const prev = totalsByFood.get(item.foodId) || 0;
        totalsByFood.set(item.foodId, prev + item.gramos);
      }
    }
  }

  const [checks, extras] = await Promise.all([getShoppingChecks(monday), getShoppingExtras(monday)]);
  const checksByKey = new Map(checks.map((c) => [c.key, c.comprado]));

  const byCategory = {};
  for (const [foodId, grams] of totalsByFood.entries()) {
    const food = foodsById.get(foodId);
    if (!food) continue;
    const cat = food.categoria || 'Otros';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push({ key: `food:${foodId}`, nombre: food.nombre, cantidad: formatQuantity(grams) });
  }
  if (extras.length) {
    byCategory['Manual'] = extras.map((e) => ({ key: `extra:${e.id}`, nombre: e.nombre, cantidad: e.cantidad, extraId: e.id }));
  }

  const categories = Object.keys(byCategory);
  if (categories.length === 0) {
    el.innerHTML = '<div class="empty-hint">Aún no hay comidas planificadas esta semana</div>';
    return;
  }

  el.innerHTML = categories.map((cat) => `
    <div class="shopping-category">
      <div class="shopping-category-title">${cat}</div>
      ${byCategory[cat].map((item) => {
        const checked = checksByKey.get(item.key) || false;
        return `
          <div class="shopping-item ${checked ? 'checked' : ''}">
            <label class="shopping-item-label">
              <input type="checkbox" data-key="${item.key}" ${checked ? 'checked' : ''} />
              <span>${item.nombre}${item.cantidad ? ` · ${item.cantidad}` : ''}</span>
            </label>
            ${item.extraId ? `<button class="remove-item-btn" data-extra="${item.extraId}">✕</button>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `).join('');

  el.querySelectorAll('input[type=checkbox]').forEach((cb) => {
    cb.onchange = async () => {
      await setShoppingCheck(monday, cb.dataset.key, cb.checked);
      cb.closest('.shopping-item').classList.toggle('checked', cb.checked);
    };
  });
  el.querySelectorAll('button[data-extra]').forEach((btn) => {
    btn.onclick = async () => {
      await deleteShoppingExtra(Number(btn.dataset.extra));
      await renderShoppingList(el, monday, days, foodsById);
    };
  });
}

function formatQuantity(grams) {
  if (grams >= 1000) return `${round1(grams / 1000)} kg`;
  return `${round1(grams)} g`;
}
