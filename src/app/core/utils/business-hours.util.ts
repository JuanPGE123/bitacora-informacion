import { IncidentPriority } from '../models/incident.model';
import { isColombiaHoliday } from './colombia-holidays.util';

const BUSINESS_START_HOUR = 7;
const BUSINESS_START_MINUTE = 30;
const BUSINESS_END_HOUR = 17;

/** Horas hábiles de ANS permitidas por prioridad antes de incumplir */
export const SLA_HOURS_BY_PRIORITY: Record<IncidentPriority, number> = {
  [IncidentPriority.CRITICAL]: 9,
  [IncidentPriority.HIGH]: 9,
  [IncidentPriority.MEDIUM]: 12,
  [IncidentPriority.LOW]: 18,
};

/**
 * Hora actual de Colombia (Bogotá, UTC-5 fijo, sin horario de verano), representada
 * con los mismos getters UTC* que usan las fechas leídas del Excel (ver file-parser.service.ts).
 */
export function nowInBogota(): Date {
  return new Date(Date.now() - 5 * 60 * 60 * 1000);
}

/**
 * Horas hábiles (decimales) entre start y end, contando solo Lun-Vie,
 * 7:30am-5:00pm, excluyendo festivos de Colombia. start/end deben venir con la
 * hora de pared de Colombia codificada en los campos UTC (misma convención del proyecto).
 */
export function businessHoursBetween(start: Date, end: Date): number {
  if (end.getTime() <= start.getTime()) return 0;

  let total = 0;
  let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

  while (cursor.getTime() <= lastDay.getTime()) {
    const dow = cursor.getUTCDay();
    if (dow !== 0 && dow !== 6 && !isColombiaHoliday(cursor)) {
      const windowStart = new Date(Date.UTC(
        cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate(),
        BUSINESS_START_HOUR, BUSINESS_START_MINUTE
      ));
      const windowEnd = new Date(Date.UTC(
        cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate(),
        BUSINESS_END_HOUR, 0
      ));
      const segStart = start.getTime() > windowStart.getTime() ? start : windowStart;
      const segEnd = end.getTime() < windowEnd.getTime() ? end : windowEnd;
      if (segEnd.getTime() > segStart.getTime()) {
        total += (segEnd.getTime() - segStart.getTime()) / (1000 * 60 * 60);
      }
    }
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate() + 1));
  }

  return total;
}

/** Formatea horas decimales como "Xd Yh Zm" / "Yh Zm" / "Zm" */
export function formatHoursDuration(hours: number): string {
  const totalMinutes = Math.round(Math.abs(hours) * 60);
  const days = Math.floor(totalMinutes / (24 * 60));
  const h = Math.floor((totalMinutes % (24 * 60)) / 60);
  const m = totalMinutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (h > 0 || days > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(' ');
}
