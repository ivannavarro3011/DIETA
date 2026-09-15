import { getSettings, saveSettings } from '../store.js';

export function openSettingsModal(onSaved) {
  getSettings().then((s) => {
    const modalRoot = document.getElementById('modal-root');
    modalRoot.innerHTML = `
      <div class="modal-backdrop" id="modalBackdrop">
        <div class="modal">
          <div class="modal-header">
            <span>Ajustes</span>
            <button class="icon-btn" id="closeModal">✕</button>
          </div>
          <label class="field-label">Peso actual (kg)</label>
          <input type="number" id="sPesoActual" class="input" value="${s.pesoActual}" step="0.1" />
          <label class="field-label">Peso objetivo (kg)</label>
          <input type="number" id="sPesoObjetivo" class="input" value="${s.pesoObjetivo}" step="0.1" />
          <label class="field-label">Altura (cm)</label>
          <input type="number" id="sAltura" class="input" value="${s.altura}" />
          <div class="macro-inputs">
            <div><label class="field-label">Kcal objetivo</label><input type="number" id="sKcal" class="input" value="${s.kcalObjetivo}" /></div>
            <div><label class="field-label">Proteína (g)</label><input type="number" id="sProt" class="input" value="${s.proteinaObjetivo}" /></div>
            <div><label class="field-label">Carbs (g)</label><input type="number" id="sCarbs" class="input" value="${s.carbosObjetivo}" /></div>
            <div><label class="field-label">Grasa (g)</label><input type="number" id="sGrasa" class="input" value="${s.grasaObjetivo}" /></div>
          </div>
          <button class="primary-btn" id="saveSettingsBtn">Guardar</button>
        </div>
      </div>
    `;

    const close = () => { modalRoot.innerHTML = ''; };
    document.getElementById('modalBackdrop').onclick = (e) => { if (e.target.id === 'modalBackdrop') close(); };
    document.getElementById('closeModal').onclick = close;

    document.getElementById('saveSettingsBtn').onclick = async () => {
      await saveSettings({
        pesoActual: Number(document.getElementById('sPesoActual').value) || s.pesoActual,
        pesoObjetivo: Number(document.getElementById('sPesoObjetivo').value) || s.pesoObjetivo,
        altura: Number(document.getElementById('sAltura').value) || s.altura,
        kcalObjetivo: Number(document.getElementById('sKcal').value) || s.kcalObjetivo,
        proteinaObjetivo: Number(document.getElementById('sProt').value) || s.proteinaObjetivo,
        carbosObjetivo: Number(document.getElementById('sCarbs').value) || s.carbosObjetivo,
        grasaObjetivo: Number(document.getElementById('sGrasa').value) || s.grasaObjetivo,
      });
      close();
      if (onSaved) onSaved();
    };
  });
}
