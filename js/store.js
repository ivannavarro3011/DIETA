import { db } from './db.js';
import { SEED_FOODS } from './seed-foods.js';
import { SEED_RECIPES } from './seed-recipes.js';
import { defaultTurnoForDate } from './shifts.js';
import { slotCategory } from './meal-category.js';
import { uid } from './utils.js';

const SETTINGS_ID = 'main';

export const DEFAULT_SETTINGS = {
  id: SETTINGS_ID,
  pesoActual: 88,
  pesoObjetivo: 95,
  altura: 190,
  kcalObjetivo: 3700,
  proteinaObjetivo: 160,
  carbosObjetivo: 515,
  grasaObjetivo: 118,
};

export async function ensureInitialized() {
  const existing = await db.get(db.STORES.settings, SETTINGS_ID);
  if (!existing) {
    await db.put(db.STORES.settings, DEFAULT_SETTINGS);
  }
  const foodCount = await db.count(db.STORES.foods);
  if (foodCount === 0) {
    for (const f of SEED_FOODS) {
      await db.add(db.STORES.foods, f);
    }
  }
  const recipeCount = await db.count(db.STORES.recipes);
  if (recipeCount === 0) {
    const foods = await db.getAll(db.STORES.foods);
    const foodIdByName = new Map(foods.map((f) => [f.nombre, f.id]));
    for (const r of SEED_RECIPES) {
      const items = r.items
        .map((i) => ({ foodId: foodIdByName.get(i.food), gramos: i.gramos }))
        .filter((i) => i.foodId != null);
      if (items.length) {
        await db.add(db.STORES.recipes, { nombre: r.nombre, categoria: r.categoria, items });
      }
    }
  }
}

export async function getSettings() {
  const s = await db.get(db.STORES.settings, SETTINGS_ID);
  return s || DEFAULT_SETTINGS;
}

export async function saveSettings(partial) {
  const current = await getSettings();
  const updated = { ...current, ...partial, id: SETTINGS_ID };
  await db.put(db.STORES.settings, updated);
  return updated;
}

export async function getAllFoods() {
  const foods = await db.getAll(db.STORES.foods);
  return foods.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export async function addFood(food) {
  return db.add(db.STORES.foods, food);
}

export async function updateFood(food) {
  return db.put(db.STORES.foods, food);
}

export async function deleteFood(id) {
  return db.delete(db.STORES.foods, id);
}

export async function getDayMeals(dateStr) {
  const existing = await db.get(db.STORES.dayMeals, dateStr);
  if (existing) return existing;
  return { date: dateStr, turno: defaultTurnoForDate(dateStr), entries: [] };
}

export async function saveDayMeals(dayMeals) {
  await db.put(db.STORES.dayMeals, dayMeals);
  return dayMeals;
}

export async function setDayTurno(dateStr, turno) {
  const day = await getDayMeals(dateStr);
  day.turno = turno;
  await saveDayMeals(day);
  return day;
}

export async function addItemToSlot(dateStr, slotName, item) {
  const day = await getDayMeals(dateStr);
  let entry = day.entries.find((e) => e.slotName === slotName);
  if (!entry) {
    entry = { slotName, items: [] };
    day.entries.push(entry);
  }
  entry.items.push({ id: uid(), ...item });
  await saveDayMeals(day);
  return day;
}

export async function removeItemFromSlot(dateStr, slotName, itemId) {
  const day = await getDayMeals(dateStr);
  const entry = day.entries.find((e) => e.slotName === slotName);
  if (entry) {
    entry.items = entry.items.filter((i) => i.id !== itemId);
  }
  await saveDayMeals(day);
  return day;
}

export async function getAllDayMeals() {
  return db.getAll(db.STORES.dayMeals);
}

export async function getAllWeights() {
  const w = await db.getAll(db.STORES.weights);
  return w.sort((a, b) => (a.date < b.date ? -1 : 1));
}

export async function addWeight(dateStr, kg) {
  const all = await getAllWeights();
  const existing = all.find((w) => w.date === dateStr);
  if (existing) {
    existing.kg = kg;
    await db.put(db.STORES.weights, existing);
    return existing;
  }
  const id = await db.add(db.STORES.weights, { date: dateStr, kg });
  return { id, date: dateStr, kg };
}

export async function deleteWeight(id) {
  return db.delete(db.STORES.weights, id);
}

export async function getShoppingChecks(week) {
  const all = await db.getAll(db.STORES.shoppingChecks);
  return all.filter((c) => c.week === week);
}

export async function setShoppingCheck(week, key, comprado) {
  const id = `${week}:${key}`;
  await db.put(db.STORES.shoppingChecks, { id, week, key, comprado });
}

export async function getShoppingExtras(week) {
  const all = await db.getAll(db.STORES.shoppingExtras);
  return all.filter((e) => e.week === week);
}

export async function addShoppingExtra(week, nombre, cantidad) {
  return db.add(db.STORES.shoppingExtras, { week, nombre, cantidad, comprado: false });
}

export async function toggleShoppingExtra(item) {
  item.comprado = !item.comprado;
  await db.put(db.STORES.shoppingExtras, item);
  return item;
}

export async function deleteShoppingExtra(id) {
  return db.delete(db.STORES.shoppingExtras, id);
}

export async function getAllRecipes() {
  return db.getAll(db.STORES.recipes);
}

export async function addRecipe(recipe) {
  return db.add(db.STORES.recipes, recipe);
}

export async function updateRecipe(recipe) {
  return db.put(db.STORES.recipes, recipe);
}

export async function deleteRecipe(id) {
  return db.delete(db.STORES.recipes, id);
}

export function computeRecipeTotals(recipe, foodsById) {
  let kcal = 0, prot = 0, carbs = 0, grasa = 0;
  for (const item of recipe.items) {
    const food = foodsById.get(item.foodId);
    if (!food) continue;
    const factor = item.gramos / 100;
    kcal += food.kcal100 * factor;
    prot += food.prot100 * factor;
    carbs += food.carbs100 * factor;
    grasa += food.grasa100 * factor;
  }
  return { kcal, prot, carbs, grasa };
}

// Elige una receta "distinta" cada día para una franja, de forma determinista
// (misma fecha+franja siempre da la misma sugerencia, pero varía día a día).
export function pickRecipeForSlot(dateStr, slotName, recipes) {
  const category = slotCategory(slotName);
  const candidates = recipes.filter((r) => r.categoria === category);
  if (candidates.length === 0) return null;
  const seed = `${dateStr}:${slotName}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return candidates[hash % candidates.length];
}

export async function applyRecipeToSlot(dateStr, slotName, recipe) {
  const day = await getDayMeals(dateStr);
  let entry = day.entries.find((e) => e.slotName === slotName);
  if (!entry) {
    entry = { slotName, items: [] };
    day.entries.push(entry);
  }
  for (const item of recipe.items) {
    entry.items.push({ id: uid(), foodId: item.foodId, gramos: item.gramos, recipeNombre: recipe.nombre });
  }
  await saveDayMeals(day);
  return day;
}

// Rellena con sugerencias todas las franjas vacías del día (menú completo de un toque)
export async function generateDayMenu(dateStr, slots) {
  const recipes = await getAllRecipes();
  let day = await getDayMeals(dateStr);
  for (const slot of slots) {
    const entry = day.entries.find((e) => e.slotName === slot.name);
    if (entry && entry.items.length > 0) continue;
    const recipe = pickRecipeForSlot(dateStr, slot.name, recipes);
    if (recipe) {
      day = await applyRecipeToSlot(dateStr, slot.name, recipe);
    }
  }
  return day;
}

// Calcula macros totales de un día a partir de entries + base de alimentos
export function computeDayTotals(day, foodsById) {
  let kcal = 0, prot = 0, carbs = 0, grasa = 0;
  for (const entry of day.entries) {
    for (const item of entry.items) {
      const food = foodsById.get(item.foodId);
      if (!food) continue;
      const factor = item.gramos / 100;
      kcal += food.kcal100 * factor;
      prot += food.prot100 * factor;
      carbs += food.carbs100 * factor;
      grasa += food.grasa100 * factor;
    }
  }
  return { kcal, prot, carbs, grasa };
}
