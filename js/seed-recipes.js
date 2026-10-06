// Banco de comidas ya pensadas, para no tener que decidir cada día qué comer.
// Los alimentos se referencian por nombre (deben existir en seed-foods.js) y se
// resuelven a foodId durante la inicialización, una vez sembrada la base de alimentos.

export const CATEGORIES_RECIPE = ['desayuno', 'principal', 'cena', 'snack'];

export const SEED_RECIPES = [
  // Desayuno
  {
    nombre: 'Avena con proteína y plátano',
    categoria: 'desayuno',
    items: [
      { food: 'Avena (copos)', gramos: 80 },
      { food: 'Leche entera', gramos: 250 },
      { food: 'Proteína en polvo (whey)', gramos: 30 },
      { food: 'Plátano', gramos: 120 },
    ],
  },
  {
    nombre: 'Huevos revueltos con pan y aguacate',
    categoria: 'desayuno',
    items: [
      { food: 'Huevo entero', gramos: 150 },
      { food: 'Pan integral', gramos: 80 },
      { food: 'Aguacate', gramos: 50 },
      { food: 'Aceite de oliva', gramos: 5 },
    ],
  },
  {
    nombre: 'Tostadas con mantequilla de cacahuete y yogur',
    categoria: 'desayuno',
    items: [
      { food: 'Pan integral', gramos: 100 },
      { food: 'Mantequilla de cacahuete', gramos: 30 },
      { food: 'Yogur griego natural', gramos: 150 },
      { food: 'Fruta variada (media)', gramos: 100 },
    ],
  },

  // Comida principal
  {
    nombre: 'Pollo con arroz y verdura',
    categoria: 'principal',
    items: [
      { food: 'Pechuga de pollo', gramos: 200 },
      { food: 'Arroz blanco (cocido)', gramos: 300 },
      { food: 'Verdura variada (cocida/salteada)', gramos: 150 },
      { food: 'Aceite de oliva', gramos: 10 },
    ],
  },
  {
    nombre: 'Ternera con patata y ensalada',
    categoria: 'principal',
    items: [
      { food: 'Ternera magra', gramos: 180 },
      { food: 'Patata (cocida)', gramos: 300 },
      { food: 'Ensalada mixta', gramos: 150 },
      { food: 'Aceite de oliva', gramos: 10 },
    ],
  },
  {
    nombre: 'Salmón con boniato y verdura',
    categoria: 'principal',
    items: [
      { food: 'Salmón', gramos: 200 },
      { food: 'Boniato (cocido)', gramos: 250 },
      { food: 'Verdura variada (cocida/salteada)', gramos: 150 },
      { food: 'Aceite de oliva', gramos: 8 },
    ],
  },
  {
    nombre: 'Espaguetis carbonara',
    categoria: 'principal',
    items: [
      { food: 'Pasta (cruda)', gramos: 150 },
      { food: 'Bacon / panceta', gramos: 80 },
      { food: 'Huevo entero', gramos: 100 },
      { food: 'Queso parmesano', gramos: 30 },
    ],
  },
  {
    nombre: 'Pasta con atún',
    categoria: 'principal',
    items: [
      { food: 'Pasta (cocida)', gramos: 250 },
      { food: 'Atún al natural (lata)', gramos: 150 },
      { food: 'Ensalada mixta', gramos: 100 },
      { food: 'Aceite de oliva', gramos: 10 },
    ],
  },

  // Cena
  {
    nombre: 'Tortilla de claras con pavo y ensalada',
    categoria: 'cena',
    items: [
      { food: 'Clara de huevo', gramos: 200 },
      { food: 'Pavo (pechuga)', gramos: 100 },
      { food: 'Ensalada mixta', gramos: 150 },
      { food: 'Pan integral', gramos: 50 },
      { food: 'Aceite de oliva', gramos: 10 },
    ],
  },
  {
    nombre: 'Lomo de cerdo con boniato',
    categoria: 'cena',
    items: [
      { food: 'Lomo de cerdo', gramos: 180 },
      { food: 'Boniato (cocido)', gramos: 200 },
      { food: 'Verdura variada (cocida/salteada)', gramos: 150 },
    ],
  },
  {
    nombre: 'Yogur griego con avena y frutos secos',
    categoria: 'cena',
    items: [
      { food: 'Yogur griego natural', gramos: 250 },
      { food: 'Avena (copos)', gramos: 40 },
      { food: 'Frutos secos mixtos', gramos: 30 },
      { food: 'Fruta variada (media)', gramos: 100 },
    ],
  },

  // Snacks
  {
    nombre: 'Batido rápido con plátano',
    categoria: 'snack',
    items: [
      { food: 'Batido de proteína (listo)', gramos: 250 },
      { food: 'Plátano', gramos: 100 },
    ],
  },
  {
    nombre: 'Frutos secos y fruta',
    categoria: 'snack',
    items: [
      { food: 'Frutos secos mixtos', gramos: 40 },
      { food: 'Manzana', gramos: 150 },
    ],
  },
  {
    nombre: 'Bocadillo rápido',
    categoria: 'snack',
    items: [
      { food: 'Bocadillo (pan+fiambre, unidad ~150g)', gramos: 150 },
    ],
  },
  {
    nombre: 'Yogur con frutos secos',
    categoria: 'snack',
    items: [
      { food: 'Yogur griego natural', gramos: 200 },
      { food: 'Almendras', gramos: 25 },
    ],
  },
  {
    nombre: 'Tostada con aceite y atún',
    categoria: 'snack',
    items: [
      { food: 'Tostada con aceite', gramos: 100 },
      { food: 'Atún al natural (lata)', gramos: 80 },
    ],
  },
];
