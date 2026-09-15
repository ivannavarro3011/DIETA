import { ensureInitialized } from './store.js';
import { renderDay } from './views/day.js';
import { renderWeek } from './views/week.js';
import { renderWeight } from './views/weight.js';
import { renderFoods } from './views/foods.js';
import { openSettingsModal } from './views/settings.js';

const TABS = {
  hoy: { label: 'Hoy', icon: '🍽️', render: renderDay },
  semana: { label: 'Semana', icon: '📅', render: renderWeek },
  peso: { label: 'Peso', icon: '📈', render: renderWeight },
  alimentos: { label: 'Alimentos', icon: '🥗', render: renderFoods },
};

let activeTab = 'hoy';

async function init() {
  await ensureInitialized();
  renderShell();
  await renderActiveTab();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

function renderShell() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <header class="app-header">
      <div class="app-title">Dieta Ivan</div>
      <button class="icon-btn" id="settingsBtn">⚙️</button>
    </header>
    <main id="view-container" class="view-container"></main>
    <nav class="bottom-nav" id="bottomNav">
      ${Object.entries(TABS).map(([key, t]) => `
        <button class="nav-btn ${key === activeTab ? 'active' : ''}" data-tab="${key}">
          <span class="nav-icon">${t.icon}</span>
          <span class="nav-label">${t.label}</span>
        </button>
      `).join('')}
    </nav>
    <div id="modal-root"></div>
  `;

  document.getElementById('settingsBtn').onclick = () => openSettingsModal(renderActiveTab);

  app.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.onclick = () => {
      activeTab = btn.dataset.tab;
      app.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === activeTab));
      renderActiveTab();
    };
  });
}

async function renderActiveTab() {
  const container = document.getElementById('view-container');
  container.innerHTML = '<div class="loading">Cargando...</div>';
  await TABS[activeTab].render(container);
}

init();
