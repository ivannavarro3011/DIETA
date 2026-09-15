// Base de alimentos precargada (macros por 100g). Fuentes orientativas estándar.
// kcal, proteína(g), carbohidratos(g), grasas(g) por 100g.

export const CATEGORIES = ['Proteína', 'Hidratos', 'Grasas', 'Extras', 'Verdura'];

export const SEED_FOODS = [
  // Proteína
  { nombre: 'Pechuga de pollo', categoria: 'Proteína', kcal100: 165, prot100: 31, carbs100: 0, grasa100: 3.6 },
  { nombre: 'Muslo de pollo', categoria: 'Proteína', kcal100: 209, prot100: 26, carbs100: 0, grasa100: 10.9 },
  { nombre: 'Huevo entero', categoria: 'Proteína', kcal100: 155, prot100: 13, carbs100: 1.1, grasa100: 11 },
  { nombre: 'Clara de huevo', categoria: 'Proteína', kcal100: 52, prot100: 11, carbs100: 0.7, grasa100: 0.2 },
  { nombre: 'Atún al natural (lata)', categoria: 'Proteína', kcal100: 116, prot100: 26, carbs100: 0, grasa100: 1 },
  { nombre: 'Salmón', categoria: 'Proteína', kcal100: 208, prot100: 20, carbs100: 0, grasa100: 13 },
  { nombre: 'Ternera magra', categoria: 'Proteína', kcal100: 187, prot100: 26, carbs100: 0, grasa100: 8.7 },
  { nombre: 'Lomo de cerdo', categoria: 'Proteína', kcal100: 143, prot100: 21, carbs100: 0, grasa100: 6 },
  { nombre: 'Pavo (pechuga)', categoria: 'Proteína', kcal100: 135, prot100: 29, carbs100: 0, grasa100: 1.7 },
  { nombre: 'Yogur griego natural', categoria: 'Proteína', kcal100: 97, prot100: 9, carbs100: 3.6, grasa100: 5 },
  { nombre: 'Queso fresco batido 0%', categoria: 'Proteína', kcal100: 45, prot100: 8, carbs100: 4, grasa100: 0.2 },
  { nombre: 'Queso curado', categoria: 'Proteína', kcal100: 400, prot100: 25, carbs100: 1.3, grasa100: 33 },
  { nombre: 'Lentejas cocidas', categoria: 'Proteína', kcal100: 116, prot100: 9, carbs100: 20, grasa100: 0.4 },
  { nombre: 'Garbanzos cocidos', categoria: 'Proteína', kcal100: 164, prot100: 8.9, carbs100: 27, grasa100: 2.6 },
  { nombre: 'Proteína en polvo (whey)', categoria: 'Proteína', kcal100: 380, prot100: 75, carbs100: 8, grasa100: 6 },
  { nombre: 'Leche entera', categoria: 'Proteína', kcal100: 64, prot100: 3.3, carbs100: 4.8, grasa100: 3.6 },

  // Hidratos
  { nombre: 'Avena (copos)', categoria: 'Hidratos', kcal100: 389, prot100: 17, carbs100: 66, grasa100: 7 },
  { nombre: 'Arroz blanco (crudo)', categoria: 'Hidratos', kcal100: 360, prot100: 7, carbs100: 79, grasa100: 0.6 },
  { nombre: 'Arroz blanco (cocido)', categoria: 'Hidratos', kcal100: 130, prot100: 2.7, carbs100: 28, grasa100: 0.3 },
  { nombre: 'Pasta (cruda)', categoria: 'Hidratos', kcal100: 371, prot100: 13, carbs100: 75, grasa100: 1.5 },
  { nombre: 'Pasta (cocida)', categoria: 'Hidratos', kcal100: 158, prot100: 5.8, carbs100: 31, grasa100: 0.9 },
  { nombre: 'Pan integral', categoria: 'Hidratos', kcal100: 247, prot100: 13, carbs100: 41, grasa100: 3.4 },
  { nombre: 'Pan blanco', categoria: 'Hidratos', kcal100: 265, prot100: 9, carbs100: 49, grasa100: 3.2 },
  { nombre: 'Patata (cocida)', categoria: 'Hidratos', kcal100: 87, prot100: 1.9, carbs100: 20, grasa100: 0.1 },
  { nombre: 'Boniato (cocido)', categoria: 'Hidratos', kcal100: 90, prot100: 2, carbs100: 21, grasa100: 0.1 },
  { nombre: 'Plátano', categoria: 'Hidratos', kcal100: 89, prot100: 1.1, carbs100: 23, grasa100: 0.3 },
  { nombre: 'Manzana', categoria: 'Hidratos', kcal100: 52, prot100: 0.3, carbs100: 14, grasa100: 0.2 },
  { nombre: 'Fruta variada (media)', categoria: 'Hidratos', kcal100: 60, prot100: 0.6, carbs100: 15, grasa100: 0.3 },

  // Grasas
  { nombre: 'Aceite de oliva', categoria: 'Grasas', kcal100: 884, prot100: 0, carbs100: 0, grasa100: 100 },
  { nombre: 'Frutos secos mixtos', categoria: 'Grasas', kcal100: 607, prot100: 20, carbs100: 18, grasa100: 54 },
  { nombre: 'Almendras', categoria: 'Grasas', kcal100: 579, prot100: 21, carbs100: 22, grasa100: 50 },
  { nombre: 'Cacahuetes', categoria: 'Grasas', kcal100: 567, prot100: 26, carbs100: 16, grasa100: 49 },
  { nombre: 'Mantequilla de cacahuete', categoria: 'Grasas', kcal100: 588, prot100: 25, carbs100: 20, grasa100: 50 },
  { nombre: 'Aguacate', categoria: 'Grasas', kcal100: 160, prot100: 2, carbs100: 8.5, grasa100: 15 },

  // Extras calóricos / snacks
  { nombre: 'Batido de proteína (listo)', categoria: 'Extras', kcal100: 75, prot100: 6, carbs100: 7, grasa100: 2 },
  { nombre: 'Barrita de cereales/proteína', categoria: 'Extras', kcal100: 380, prot100: 20, carbs100: 40, grasa100: 14 },
  { nombre: 'Bocadillo (pan+fiambre, unidad ~150g)', categoria: 'Extras', kcal100: 260, prot100: 12, carbs100: 35, grasa100: 8 },
  { nombre: 'Tostada con aceite', categoria: 'Extras', kcal100: 300, prot100: 8, carbs100: 40, grasa100: 12 },

  // Verdura
  { nombre: 'Verdura variada (cocida/salteada)', categoria: 'Verdura', kcal100: 35, prot100: 2, carbs100: 5, grasa100: 0.5 },
  { nombre: 'Ensalada mixta', categoria: 'Verdura', kcal100: 20, prot100: 1.2, carbs100: 3, grasa100: 0.2 },
];
