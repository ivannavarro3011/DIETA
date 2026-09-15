// Deduce la categoría de receta adecuada según el nombre de la franja de comida
// (los nombres de franja vienen de shifts.js y varían según el turno).

export function slotCategory(slotName) {
  const s = slotName.toLowerCase();
  if (s.includes('desayuno')) return 'desayuno';
  if (s.includes('principal')) return 'principal';
  if (s.includes('cena')) return 'cena';
  return 'snack';
}
