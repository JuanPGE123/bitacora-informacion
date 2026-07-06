/**
 * Cálculo de festivos de Colombia (Ley Emiliani incluida), por año, sin listas hardcodeadas.
 * Todas las fechas se manejan en UTC puro (día calendario), sin hora.
 */

function addDays(date: Date, days: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

function toKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Domingo de Pascua (algoritmo anónimo gregoriano / Meeus-Jones-Butcher)
 */
export function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = marzo, 4 = abril
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

/** Ley Emiliani: si no cae en lunes, se traslada al lunes siguiente */
function toNextMondayIfNeeded(date: Date): Date {
  const dow = date.getUTCDay(); // 0=domingo, 1=lunes ... 6=sábado
  if (dow === 1) return date;
  const daysUntilMonday = (8 - dow) % 7 || 7;
  return addDays(date, daysUntilMonday);
}

const holidaysCache = new Map<number, Set<string>>();

/**
 * Devuelve el set de festivos ('YYYY-MM-DD') de Colombia para el año dado.
 */
export function getColombiaHolidays(year: number): Set<string> {
  const cached = holidaysCache.get(year);
  if (cached) return cached;

  const easter = getEasterSunday(year);
  const holidays = new Set<string>();

  // Fijos, no se mueven
  holidays.add(toKey(new Date(Date.UTC(year, 0, 1))));    // Año Nuevo
  holidays.add(toKey(addDays(easter, -3)));               // Jueves Santo
  holidays.add(toKey(addDays(easter, -2)));               // Viernes Santo
  holidays.add(toKey(new Date(Date.UTC(year, 4, 1))));    // Día del Trabajo
  holidays.add(toKey(new Date(Date.UTC(year, 6, 20))));   // Independencia
  holidays.add(toKey(new Date(Date.UTC(year, 7, 7))));    // Batalla de Boyacá
  holidays.add(toKey(new Date(Date.UTC(year, 11, 8))));   // Inmaculada Concepción
  holidays.add(toKey(new Date(Date.UTC(year, 11, 25))));  // Navidad

  // Ley Emiliani: se trasladan al lunes siguiente si no caen en lunes
  const movable = [
    new Date(Date.UTC(year, 0, 6)),    // Reyes Magos
    new Date(Date.UTC(year, 2, 19)),   // San José
    addDays(easter, 39),               // Ascensión del Señor
    addDays(easter, 60),               // Corpus Christi
    addDays(easter, 68),               // Sagrado Corazón
    new Date(Date.UTC(year, 5, 29)),   // San Pedro y San Pablo
    new Date(Date.UTC(year, 7, 15)),   // Asunción de la Virgen
    new Date(Date.UTC(year, 9, 12)),   // Día de la Raza
    new Date(Date.UTC(year, 10, 1)),   // Todos los Santos
    new Date(Date.UTC(year, 10, 11)),  // Independencia de Cartagena
  ];

  for (const date of movable) {
    holidays.add(toKey(toNextMondayIfNeeded(date)));
  }

  holidaysCache.set(year, holidays);
  return holidays;
}

export function isColombiaHoliday(date: Date): boolean {
  return getColombiaHolidays(date.getUTCFullYear()).has(toKey(date));
}
