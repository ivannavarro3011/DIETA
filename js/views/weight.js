import { getAllWeights, addWeight, deleteWeight, getSettings } from '../store.js';
import { todayStr, round1 } from '../utils.js';

export async function renderWeight(container) {
  const [weights, settings] = await Promise.all([getAllWeights(), getSettings()]);

  container.innerHTML = `
    <div class="card">
      <div class="section-title">Registrar peso</div>
      <div class="weight-form">
        <input type="date" id="weightDate" class="input" value="${todayStr()}" />
        <input type="number" id="weightKg" class="input" placeholder="kg" step="0.1" min="0" />
        <button class="primary-btn" id="addWeightBtn">Guardar</button>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Evolución hacia ${settings.pesoObjetivo} kg</div>
      <canvas id="weightChart" width="600" height="240" class="weight-chart"></canvas>
    </div>

    <div class="card">
      <div class="section-title">Historial</div>
      <div id="weightHistory"></div>
    </div>
  `;

  drawChart(container.querySelector('#weightChart'), weights, settings);
  renderHistory(container.querySelector('#weightHistory'), weights, container);

  container.querySelector('#addWeightBtn').onclick = async () => {
    const date = container.querySelector('#weightDate').value;
    const kg = Number(container.querySelector('#weightKg').value);
    if (!date || !kg) return;
    await addWeight(date, kg);
    renderWeight(container);
  };
}

function renderHistory(el, weights, container) {
  if (weights.length === 0) {
    el.innerHTML = '<div class="empty-hint">Aún no has registrado tu peso</div>';
    return;
  }
  const sorted = [...weights].sort((a, b) => (a.date < b.date ? 1 : -1));
  el.innerHTML = sorted.map((w) => `
    <div class="history-row">
      <span>${w.date}</span>
      <span>${round1(w.kg)} kg</span>
      <button class="remove-item-btn" data-id="${w.id}">✕</button>
    </div>
  `).join('');
  el.querySelectorAll('button[data-id]').forEach((btn) => {
    btn.onclick = async () => {
      await deleteWeight(Number(btn.dataset.id));
      renderWeight(container);
    };
  });
}

function drawChart(canvas, weights, settings) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth || 600;
  const cssHeight = 240;
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  canvas.style.height = cssHeight + 'px';
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const styles = getComputedStyle(document.documentElement);
  const accent = styles.getPropertyValue('--accent').trim() || '#4f8cff';
  const grid = styles.getPropertyValue('--border').trim() || '#333';
  const text = styles.getPropertyValue('--text-muted').trim() || '#888';

  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const w = cssWidth - padding.left - padding.right;
  const h = cssHeight - padding.top - padding.bottom;

  const sorted = [...weights].sort((a, b) => (a.date < b.date ? -1 : 1));
  const values = sorted.map((s) => s.kg);
  const minVal = Math.min(settings.pesoActual, settings.pesoObjetivo, ...(values.length ? values : [settings.pesoActual]));
  const maxVal = Math.max(settings.pesoActual, settings.pesoObjetivo, ...(values.length ? values : [settings.pesoObjetivo]));
  const yMin = Math.floor(minVal - 2);
  const yMax = Math.ceil(maxVal + 2);

  function yToPx(y) {
    return padding.top + h - ((y - yMin) / (yMax - yMin)) * h;
  }
  function xToPx(i, n) {
    if (n <= 1) return padding.left + w / 2;
    return padding.left + (i / (n - 1)) * w;
  }

  // Grid + eje Y
  ctx.strokeStyle = grid;
  ctx.fillStyle = text;
  ctx.font = '11px sans-serif';
  ctx.lineWidth = 1;
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const val = yMin + ((yMax - yMin) * i) / steps;
    const y = yToPx(val);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + w, y);
    ctx.globalAlpha = 0.3;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillText(round1(val).toString(), 4, y + 4);
  }

  // Línea objetivo
  ctx.strokeStyle = text;
  ctx.setLineDash([4, 4]);
  const objY = yToPx(settings.pesoObjetivo);
  ctx.beginPath();
  ctx.moveTo(padding.left, objY);
  ctx.lineTo(padding.left + w, objY);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillText(`Objetivo ${settings.pesoObjetivo}kg`, padding.left + w - 90, objY - 6);

  if (sorted.length === 0) {
    ctx.fillStyle = text;
    ctx.fillText('Añade tu primer registro de peso', padding.left, padding.top + h / 2);
    return;
  }

  // Línea de progreso
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  sorted.forEach((s, i) => {
    const x = xToPx(i, sorted.length);
    const y = yToPx(s.kg);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = accent;
  sorted.forEach((s, i) => {
    const x = xToPx(i, sorted.length);
    const y = yToPx(s.kg);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}
