import { ensureInitialized, getSettings, saveSettings } from './store.js';
import { renderDay } from './views/day.js';
import { renderWeek } from './views/week.js';
import { renderWeight } from './views/weight.js';
import { renderFoods } from './views/foods.js';
import { openSettingsModal } from './views/settings.js';
import { renderProfileForm } from './views/profile-form.js';
import { escapeHtml } from './utils.js';

const TABS = {
  hoy: { label: 'Hoy', icon: '🍽️', render: renderDay },
  semana: { label: 'Semana', icon: '📅', render: renderWeek },
  peso: { label: 'Peso', icon: '📈', render: renderWeight },
  alimentos: { label: 'Alimentos', icon: '🥗', render: renderFoods },
};

let activeTab = 'hoy';

async function init() {
  await ensureInitialized();
  const settings = await getSettings();
  if (settings.onboarded) {
    await startApp(settings);
  } else {
    renderOnboarding(settings);
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

function appTitle(settings) {
  return settings.nombre ? `Dieta de ${escapeHtml(settings.nombre)}` : 'Mi dieta';
}

function renderOnboarding(settings) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="onboarding">
      <div class="onboarding-intro">
        <div class="app-title">Bienvenido 👋</div>
        <p>Cuéntame un poco sobre ti y calculo las calorías y macros que necesitas cada día.</p>
      </div>
      <div class="card" id="onboardingForm"></div>
    </div>
  `;
  renderProfileForm(document.getElementById('onboardingForm'), settings, {
    submitLabel: 'Empezar',
    onSubmit: async (data) => {
      const saved = await saveSettings(data);
      await startApp(saved);
    },
  });
}

async function startApp(settings) {
  renderShell(settings);
  await renderActiveTab();
}

function renderShell(settings) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <header class="app-header">
      <div class="app-title" id="appTitle">${appTitle(settings)}</div>
      <button class="icon-btn" id="settingsBtn" aria-label="Mis datos">⚙️</button>
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

  document.getElementById('settingsBtn').onclick = () => openSettingsModal(async () => {
    document.getElementById('appTitle').innerHTML = appTitle(await getSettings());
    renderActiveTab();
  });

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
