// Cálculo de calorías y macros a partir del perfil (Mifflin-St Jeor + factor de actividad).

export const SEXOS = {
  hombre: { label: 'Hombre' },
  mujer: { label: 'Mujer' },
};

export const TRABAJOS = {
  sedentario: { label: 'Sedentario (oficina, sentado)', factor: 1.2 },
  activo: { label: 'Activo (de pie, caminando)', factor: 1.35 },
  fisico: { label: 'Físico (obra, soldadura, carga)', factor: 1.5 },
};

export const ENTRENOS = {
  ninguno: { label: 'No entreno', extra: 0 },
  ligero: { label: '1-2 días por semana', extra: 0.075 },
  moderado: { label: '3-4 días por semana', extra: 0.15 },
  alto: { label: '5-6 días por semana', extra: 0.2 },
  diario: { label: 'Todos los días (1h30 o más)', extra: 0.25 },
};

export const OBJETIVOS = {
  ganar: { label: 'Ganar peso / músculo', ajusteKcal: 300, protPorKg: 1.8 },
  mantener: { label: 'Mantener peso', ajusteKcal: 0, protPorKg: 1.8 },
  perder: { label: 'Perder grasa', ajusteKcal: -500, protPorKg: 2.0 },
};

const GRASA_PCT_KCAL = 0.28;

export function isProfileComplete(p) {
  return p.edad > 0 && p.altura > 0 && p.pesoActual > 0
    && SEXOS[p.sexo] && TRABAJOS[p.trabajo] && ENTRENOS[p.entreno] && OBJETIVOS[p.objetivo];
}

export function calcTargets(p) {
  const tmb = 10 * p.pesoActual + 6.25 * p.altura - 5 * p.edad + (p.sexo === 'mujer' ? -161 : 5);
  const gasto = tmb * (TRABAJOS[p.trabajo].factor + ENTRENOS[p.entreno].extra);
  const objetivo = OBJETIVOS[p.objetivo];
  const kcal = Math.max(Math.round((gasto + objetivo.ajusteKcal) / 50) * 50, Math.round(tmb));
  const prot = Math.round(p.pesoActual * objetivo.protPorKg);
  const grasa = Math.round((kcal * GRASA_PCT_KCAL) / 9);
  const carbs = Math.max(0, Math.round((kcal - prot * 4 - grasa * 9) / 4));
  return {
    tmb: Math.round(tmb),
    gasto: Math.round(gasto),
    kcalObjetivo: kcal,
    proteinaObjetivo: prot,
    grasaObjetivo: grasa,
    carbosObjetivo: carbs,
  };
}
