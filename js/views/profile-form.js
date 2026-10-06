import { SEXOS, TRABAJOS, ENTRENOS, OBJETIVOS, calcTargets, isProfileComplete } from '../nutrition.js';
import { escapeHtml } from '../utils.js';

function selectOptions(map, selected) {
  return Object.entries(map)
    .map(([key, v]) => `<option value="${key}" ${key === selected ? 'selected' : ''}>${v.label}</option>`)
    .join('');
}

function guessObjetivo(s) {
  if (!(s.pesoActual > 0 && s.pesoObjetivo > 0)) return 'mantener';
  if (s.pesoObjetivo > s.pesoActual) return 'ganar';
  if (s.pesoObjetivo < s.pesoActual) return 'perder';
  return 'mantener';
}

// Formulario de datos personales + macros. Los macros se recalculan solos al cambiar
// los datos; si el usuario los edita a mano, se quedan fijos hasta que pulse "volver a automático".
export function renderProfileForm(el, initial, { submitLabel, onSubmit }) {
  let macrosAuto = initial.macrosAuto !== false;
  const num = (v) => (v === undefined || v === null ? '' : v);

  el.innerHTML = `
    <label class="field-label">Nombre</label>
    <input id="pNombre" class="input" value="${escapeHtml(initial.nombre || '')}" placeholder="Tu nombre" maxlength="30" />
    <div class="macro-inputs">
      <div><label class="field-label">Sexo</label><select id="pSexo" class="select">${selectOptions(SEXOS, initial.sexo || 'hombre')}</select></div>
      <div><label class="field-label">Edad</label><input id="pEdad" type="number" inputmode="numeric" class="input" value="${num(initial.edad)}" min="14" max="99" /></div>
      <div><label class="field-label">Altura (cm)</label><input id="pAltura" type="number" inputmode="numeric" class="input" value="${num(initial.altura)}" min="100" max="250" /></div>
      <div><label class="field-label">Peso actual (kg)</label><input id="pPeso" type="number" inputmode="decimal" class="input" value="${num(initial.pesoActual)}" step="0.1" /></div>
    </div>
    <label class="field-label">Tipo de trabajo</label>
    <select id="pTrabajo" class="select">${selectOptions(TRABAJOS, initial.trabajo || 'activo')}</select>
    <label class="field-label">Entrenamiento</label>
    <select id="pEntreno" class="select">${selectOptions(ENTRENOS, initial.entreno || 'moderado')}</select>
    <div class="macro-inputs">
      <div><label class="field-label">Objetivo</label><select id="pObjetivo" class="select">${selectOptions(OBJETIVOS, initial.objetivo || guessObjetivo(initial))}</select></div>
      <div><label class="field-label">Peso objetivo (kg)</label><input id="pPesoObjetivo" type="number" inputmode="decimal" class="input" value="${num(initial.pesoObjetivo)}" step="0.1" /></div>
    </div>

    <div class="section-title macros-title">Tus objetivos diarios</div>
    <div class="calc-hint" id="calcHint"></div>
    <div class="macro-inputs">
      <div><label class="field-label">Calorías (kcal)</label><input id="mKcal" type="number" inputmode="numeric" class="input" value="${num(initial.kcalObjetivo)}" /></div>
      <div><label class="field-label">Proteína (g)</label><input id="mProt" type="number" inputmode="numeric" class="input" value="${num(initial.proteinaObjetivo)}" /></div>
      <div><label class="field-label">Carbohidratos (g)</label><input id="mCarbs" type="number" inputmode="numeric" class="input" value="${num(initial.carbosObjetivo)}" /></div>
      <div><label class="field-label">Grasas (g)</label><input id="mGrasa" type="number" inputmode="numeric" class="input" value="${num(initial.grasaObjetivo)}" /></div>
    </div>
    <button type="button" class="link-btn" id="pAuto" hidden>Volver a calcular automáticamente</button>
    <div class="form-error" id="pError" hidden></div>
    <button type="button" class="primary-btn" id="pSubmit">${submitLabel}</button>
  `;

  const $ = (id) => el.querySelector(`#${id}`);
  const macroIds = ['mKcal', 'mProt', 'mCarbs', 'mGrasa'];

  function readProfile() {
    return {
      nombre: $('pNombre').value.trim(),
      sexo: $('pSexo').value,
      edad: Number($('pEdad').value) || 0,
      altura: Number($('pAltura').value) || 0,
      pesoActual: Number($('pPeso').value) || 0,
      trabajo: $('pTrabajo').value,
      entreno: $('pEntreno').value,
      objetivo: $('pObjetivo').value,
      pesoObjetivo: Number($('pPesoObjetivo').value) || 0,
    };
  }

  function recalc() {
    const profile = readProfile();
    $('pAuto').hidden = macrosAuto;
    if (!isProfileComplete(profile)) {
      $('calcHint').textContent = 'Rellena edad, altura y peso para calcular tus macros.';
      return;
    }
    const t = calcTargets(profile);
    $('calcHint').textContent = macrosAuto
      ? `Gastas unas ${t.gasto} kcal al día. Calculado automáticamente según tus datos.`
      : `Gastas unas ${t.gasto} kcal al día. Estás usando tus macros manuales.`;
    if (macrosAuto) {
      $('mKcal').value = t.kcalObjetivo;
      $('mProt').value = t.proteinaObjetivo;
      $('mCarbs').value = t.carbosObjetivo;
      $('mGrasa').value = t.grasaObjetivo;
    }
  }

  ['pSexo', 'pEdad', 'pAltura', 'pPeso', 'pTrabajo', 'pEntreno', 'pObjetivo'].forEach((id) => {
    $(id).addEventListener('input', recalc);
    $(id).addEventListener('change', recalc);
  });
  macroIds.forEach((id) => {
    $(id).addEventListener('input', () => { macrosAuto = false; recalc(); });
  });
  $('pAuto').onclick = () => { macrosAuto = true; recalc(); };

  $('pSubmit').onclick = () => {
    const profile = readProfile();
    const macros = {
      kcalObjetivo: Number($('mKcal').value) || 0,
      proteinaObjetivo: Number($('mProt').value) || 0,
      carbosObjetivo: Number($('mCarbs').value) || 0,
      grasaObjetivo: Number($('mGrasa').value) || 0,
    };
    const error = !isProfileComplete(profile)
      ? 'Te falta rellenar edad, altura o peso.'
      : macros.kcalObjetivo <= 0
        ? 'Las calorías objetivo tienen que ser mayores que 0.'
        : '';
    $('pError').hidden = !error;
    $('pError').textContent = error;
    if (error) return;
    onSubmit({
      ...profile,
      pesoObjetivo: profile.pesoObjetivo || profile.pesoActual,
      ...macros,
      macrosAuto,
      onboarded: true,
    });
  };

  recalc();
}
