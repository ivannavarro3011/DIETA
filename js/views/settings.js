import { getSettings, saveSettings } from '../store.js';
import { renderProfileForm } from './profile-form.js';

export async function openSettingsModal(onSaved) {
  const s = await getSettings();
  const modalRoot = document.getElementById('modal-root');
  modalRoot.innerHTML = `
    <div class="modal-backdrop" id="modalBackdrop">
      <div class="modal">
        <div class="modal-header">
          <span>Mis datos</span>
          <button class="icon-btn" id="closeModal">✕</button>
        </div>
        <div id="settingsForm"></div>
      </div>
    </div>
  `;

  const close = () => { modalRoot.innerHTML = ''; };
  document.getElementById('modalBackdrop').onclick = (e) => { if (e.target.id === 'modalBackdrop') close(); };
  document.getElementById('closeModal').onclick = close;

  renderProfileForm(document.getElementById('settingsForm'), s, {
    submitLabel: 'Guardar',
    onSubmit: async (data) => {
      await saveSettings(data);
      close();
      if (onSaved) onSaved();
    },
  });
}
