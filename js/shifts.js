// Plantillas de turno: horarios de comida por turno de trabajo (según planificación).

export const SHIFTS = {
  manana: {
    label: 'Mañana (06:00 - 14:00)',
    slots: [
      { name: 'Desayuno fuerte', hora: '05:15' },
      { name: 'Snack en turno', hora: '09:30' },
      { name: 'Comida principal', hora: '14:15' },
      { name: 'Snack pre-entreno', hora: '15:00' },
      { name: 'Recuperación post-entreno', hora: '17:15' },
      { name: 'Cena', hora: '20:30' },
    ],
  },
  tarde: {
    label: 'Tarde (14:00 - 22:00)',
    slots: [
      { name: 'Desayuno', hora: '08:00' },
      { name: 'Snack pre-entreno', hora: '09:45' },
      { name: 'Comida principal', hora: '12:00' },
      { name: 'Snack pre-turno', hora: '13:30' },
      { name: 'Cena/snack en turno', hora: '18:30' },
      { name: 'Snack final al salir', hora: '22:15' },
    ],
  },
  noche: {
    label: 'Noche (22:00 - 06:00)',
    slots: [
      { name: 'Comida principal', hora: '14:00' },
      { name: 'Snack pre-entreno', hora: '17:15' },
      { name: 'Cena/recuperación post-entreno', hora: '20:00' },
      { name: 'Snack en turno', hora: '00:00' },
      { name: 'Segundo snack en turno', hora: '03:30' },
      { name: 'Snack ligero al salir', hora: '06:30' },
    ],
  },
  libre: {
    label: 'Domingo / día libre',
    slots: [
      { name: 'Comida libre', hora: '' },
    ],
  },
};

export function defaultTurnoForDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.getDay() === 0 ? 'libre' : 'manana';
}
