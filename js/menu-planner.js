import { slotCategory } from './meal-category.js';

// Peso relativo de cada tipo de comida en el reparto de calorías del día.
export const SLOT_WEIGHTS = { desayuno: 1, principal: 1.5, cena: 1.1, snack: 0.6 };

// Las raciones se escalan solo dentro de este rango para que sigan siendo platos realistas.
const MIN_SCALE = 0.5;
const MAX_SCALE = 2;
const MAX_COMBOS = 50000;

export function recipeMatches(recipe, category) {
  return (recipe.categorias || [recipe.categoria]).includes(category);
}

export function totalsOf(items, foodsById) {
  let kcal = 0, prot = 0, carbs = 0, grasa = 0;
  for (const item of items) {
    const f = foodsById.get(item.foodId);
    if (!f) continue;
    const factor = item.gramos / 100;
    kcal += f.kcal100 * factor;
    prot += f.prot100 * factor;
    carbs += f.carbs100 * factor;
    grasa += f.grasa100 * factor;
  }
  return { kcal, prot, carbs, grasa };
}

function roundGrams(g) {
  return g < 20 ? Math.max(1, Math.round(g)) : Math.round(g / 5) * 5;
}

export function scaleRecipe(recipe, targetKcal, foodsById) {
  const base = totalsOf(recipe.items, foodsById);
  if (base.kcal <= 0 || !(targetKcal > 0)) return recipe;
  const factor = Math.min(MAX_SCALE, Math.max(MIN_SCALE, targetKcal / base.kcal));
  return { ...recipe, items: recipe.items.map((i) => ({ ...i, gramos: roundGrams(i.gramos * factor) })) };
}

function slotWeight(slotName) {
  return SLOT_WEIGHTS[slotCategory(slotName)];
}

// Calorías que le tocan a una franja dentro del objetivo diario completo.
export function slotShareKcal(slots, slotName, kcalObjetivo) {
  const total = slots.reduce((acc, s) => acc + slotWeight(s.name), 0);
  return total ? (kcalObjetivo * slotWeight(slotName)) / total : 0;
}

function seededRandom(seedStr) {
  let h = 1779033703;
  for (let i = 0; i < seedStr.length; i++) h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

// Elige una receta por franja vacía y escala sus cantidades para que el día
// se acerque lo máximo posible a las calorías y macros objetivo.
export function planDay({ dateStr, slots, day, recipes, foodsById, settings }) {
  const filledSlots = new Set(day.entries.filter((e) => e.items.length).map((e) => e.slotName));
  const base = totalsOf(day.entries.flatMap((e) => e.items), foodsById);
  const emptySlots = slots.filter((s) => !filledSlots.has(s.name));
  const remainingKcal = Math.max(0, settings.kcalObjetivo - base.kcal);
  const emptyWeight = emptySlots.reduce((acc, s) => acc + slotWeight(s.name), 0);

  const options = emptySlots
    .map((slot) => {
      const target = emptyWeight ? (remainingKcal * slotWeight(slot.name)) / emptyWeight : 0;
      const candidates = recipes
        .filter((r) => recipeMatches(r, slotCategory(slot.name)))
        .map((r) => {
          const scaled = scaleRecipe(r, target, foodsById);
          return { recipe: scaled, totals: totalsOf(scaled.items, foodsById) };
        });
      return { slot, candidates };
    })
    .filter((o) => o.candidates.length > 0);

  if (options.length === 0) return new Map();

  const goal = {
    kcal: settings.kcalObjetivo,
    prot: settings.proteinaObjetivo,
    carbs: settings.carbosObjetivo,
    grasa: settings.grasaObjetivo,
  };
  const rng = seededRandom(dateStr);
  // Pequeño ruido por receta y fecha: entre menús casi igual de buenos, varía de un día a otro.
  const variety = new Map(recipes.map((r) => [r.id, rng() * 0.01]));

  function score(picks) {
    const t = { ...base };
    const seen = new Set();
    let penalty = 0;
    picks.forEach((pick, idx) => {
      const c = options[idx].candidates[pick];
      t.kcal += c.totals.kcal;
      t.prot += c.totals.prot;
      t.carbs += c.totals.carbs;
      t.grasa += c.totals.grasa;
      if (seen.has(c.recipe.id)) penalty += 0.05;
      seen.add(c.recipe.id);
      penalty += variety.get(c.recipe.id) || 0;
    });
    const err = (k) => (goal[k] > 0 ? ((t[k] - goal[k]) / goal[k]) ** 2 : 0);
    return 2 * err('kcal') + err('prot') + err('carbs') + err('grasa') + penalty;
  }

  let best = null;
  let bestScore = Infinity;
  const consider = (picks) => {
    const s = score(picks);
    if (s < bestScore) { bestScore = s; best = [...picks]; }
  };

  const combos = options.reduce((acc, o) => acc * o.candidates.length, 1);
  if (combos <= MAX_COMBOS) {
    const picks = [];
    const walk = (idx) => {
      if (idx === options.length) { consider(picks); return; }
      for (let i = 0; i < options[idx].candidates.length; i++) {
        picks[idx] = i;
        walk(idx + 1);
      }
    };
    walk(0);
  } else {
    for (let n = 0; n < MAX_COMBOS; n++) {
      consider(options.map((o) => Math.floor(rng() * o.candidates.length)));
    }
  }

  return new Map(options.map((o, idx) => [o.slot.name, o.candidates[best[idx]].recipe]));
}
