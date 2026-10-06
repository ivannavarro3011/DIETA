import { db } from './db.js';
import { SEED_FOODS } from './seed-foods.js';
import { SEED_RECIPES } from './seed-recipes.js';
import { defaultTurnoForDate } from './shifts.js';
import { planDay, totalsOf } from './menu-planner.js';
import { calcTargets, isProfileComplete } from './nutrition.js';
import { uid } from './utils.js';

const SETTINGS_ID = 'main';

// Sin datos personales: cada usuario los rellena en el formulario de bienvenida.
export const DEFAULT_SETTINGS = {
  id: SETTINGS_ID,
  onboarded: false,
  macrosAuto: true,
};

export async function ensureInitialized() {
  const existing = await db.get(db.STORES.settings, SETTINGS_ID);
  if (!existing) {
    await db.put(db.STORES.settings, DEFAULT_SETTINGS);
  }
  // Siembra incremental: añade solo los elementos de serie que nunca se sembraron,
  // para que las actualizaciones lleguen sin resucitar lo que el usuario borró.
  const settings = await getSettings();
  const seededFoods = new Set(settings.seededFoods || []);
  const seededRecipes = new Set(settings.seededRecipes || []);

  const existingFoods = await db.getAll(db.STORES.foods);
  const existingFoodNames = new Set(existingFoods.map((f) => f.nombre));
  for (const f of SEED_FOODS) {
    if (!seededFoods.has(f.nombre) && !existingFoodNames.has(f.nombre)) {
      await db.add(db.STORES.foods, f);
    }
  }

  const foods = await db.getAll(db.STORES.foods);
  const foodIdByName = new Map(foods.map((f) => [f.nombre, f.id]));
  const existingRecipeNames = new Set((await db.getAll(db.STORES.recipes)).map((r) => r.nombre));
  for (const r of SEED_RECIPES) {
    if (seededRecipes.has(r.nombre) || existingRecipeNames.has(r.nombre)) continue;
    const items = r.items
      .map((i) => ({ foodId: foodIdByName.get(i.food), gramos: i.gramos }))
      .filter((i) => i.foodId != null);
    if (items.length) {
      await db.add(db.STORES.recipes, {
        nombre: r.nombre,
        categoria: r.categoria ?? r.categorias[0],
        categorias: r.categorias,
        items,
      });
    }
  }

  await saveSettings({
    seededFoods: SEED_FOODS.map((f) => f.nombre),
    seededRecipes: SEED_RECIPES.map((r) => r.nombre),
  });
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
  } else {
    await db.add(db.STORES.weights, { date: dateStr, kg });
  }
  const isLatest = all.every((w) => w.date <= dateStr);
  if (isLatest) await updateCurrentWeight(kg);
}

// El registro más reciente pasa a ser el peso actual; si los macros son automáticos, se recalculan.
async function updateCurrentWeight(kg) {
  const settings = await getSettings();
  const updated = { ...settings, pesoActual: kg };
  if (updated.macrosAuto !== false && isProfileComplete(updated)) {
    const { kcalObjetivo, proteinaObjetivo, carbosObjetivo, grasaObjetivo } = calcTargets(updated);
    Object.assign(updated, { kcalObjetivo, proteinaObjetivo, carbosObjetivo, grasaObjetivo });
  }
  await saveSettings(updated);
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

function addRecipeItems(day, slotName, recipe) {
  let entry = day.entries.find((e) => e.slotName === slotName);
  if (!entry) {
    entry = { slotName, items: [] };
    day.entries.push(entry);
  }
  for (const item of recipe.items) {
    entry.items.push({ id: uid(), foodId: item.foodId, gramos: item.gramos, recipeNombre: recipe.nombre });
  }
}

export async function applyRecipeToSlot(dateStr, slotName, recipe) {
  const day = await getDayMeals(dateStr);
  addRecipeItems(day, slotName, recipe);
  await saveDayMeals(day);
  return day;
}

// Rellena las franjas vacías del día con recetas escaladas a los macros objetivo.
export async function generateDayMenu(dateStr, slots) {
  const [recipes, foods, settings, day] = await Promise.all([
    getAllRecipes(), db.getAll(db.STORES.foods), getSettings(), getDayMeals(dateStr),
  ]);
  const foodsById = new Map(foods.map((f) => [f.id, f]));
  const plan = planDay({ dateStr, slots, day, recipes, foodsById, settings });
  for (const [slotName, recipe] of plan) addRecipeItems(day, slotName, recipe);
  await saveDayMeals(day);
  return day;
}

export function computeDayTotals(day, foodsById) {
  return totalsOf(day.entries.flatMap((e) => e.items), foodsById);
}
