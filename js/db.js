// Capa de acceso a IndexedDB. Sin librerías externas para garantizar offline 100% fiable.

const DB_NAME = 'dieta-ivan-db';
const DB_VERSION = 2;

const STORES = {
  settings: 'settings',
  foods: 'foods',
  dayMeals: 'dayMeals', // { id: `${date}`, date, turno, entries: [{slotName, items:[{foodId,gramos}]}] }
  weights: 'weights', // { id, date, kg }
  shoppingChecks: 'shoppingChecks', // { id: `${week}:${key}`, week, key, comprado }
  shoppingExtras: 'shoppingExtras', // { id, week, nombre, cantidad, comprado }
  recipes: 'recipes', // { id, nombre, categoria, items:[{foodId,gramos}] }
};

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORES.settings)) {
        db.createObjectStore(STORES.settings, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.foods)) {
        const foodsStore = db.createObjectStore(STORES.foods, { keyPath: 'id', autoIncrement: true });
        foodsStore.createIndex('nombre', 'nombre', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.dayMeals)) {
        db.createObjectStore(STORES.dayMeals, { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains(STORES.weights)) {
        const weightsStore = db.createObjectStore(STORES.weights, { keyPath: 'id', autoIncrement: true });
        weightsStore.createIndex('date', 'date', { unique: true });
      }
      if (!db.objectStoreNames.contains(STORES.shoppingChecks)) {
        db.createObjectStore(STORES.shoppingChecks, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.shoppingExtras)) {
        db.createObjectStore(STORES.shoppingExtras, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(STORES.recipes)) {
        const recipesStore = db.createObjectStore(STORES.recipes, { keyPath: 'id', autoIncrement: true });
        recipesStore.createIndex('categoria', 'categoria', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(storeName, mode = 'readonly') {
  return openDb().then((db) => db.transaction(storeName, mode).objectStore(storeName));
}

function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const db = {
  STORES,

  async get(storeName, key) {
    const store = await tx(storeName);
    return reqToPromise(store.get(key));
  },

  async getAll(storeName) {
    const store = await tx(storeName);
    return reqToPromise(store.getAll());
  },

  async put(storeName, value) {
    const store = await tx(storeName, 'readwrite');
    return reqToPromise(store.put(value));
  },

  async add(storeName, value) {
    const store = await tx(storeName, 'readwrite');
    return reqToPromise(store.add(value));
  },

  async delete(storeName, key) {
    const store = await tx(storeName, 'readwrite');
    return reqToPromise(store.delete(key));
  },

  async clear(storeName) {
    const store = await tx(storeName, 'readwrite');
    return reqToPromise(store.clear());
  },

  async count(storeName) {
    const store = await tx(storeName);
    return reqToPromise(store.count());
  },
};
