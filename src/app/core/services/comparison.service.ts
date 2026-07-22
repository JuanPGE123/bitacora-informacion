import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Incident, IncidentPriority } from '../models/incident.model';
import { businessHoursBetween, nowInBogota, SLA_HOURS_BY_PRIORITY } from '../utils/business-hours.util';

/** Resultado de OLA para un incidente que desapareció del archivo de abiertos */
export interface ComparisonIncidentResult {
  incidentNumber: string;
  summary: string;
  priority: IncidentPriority;
  assignedAnalyst?: string;
  assignedGroup?: string;
  openDate: Date;
  closeDate?: Date;
  closeDateSource: 'resueltos' | 'archivo-anterior' | 'sin-dato';
  elapsedBusinessHours: number;
  thresholdHours: number;
  /** true = a tiempo, false = fuera de tiempo, null = no se pudo determinar (sin fecha de cierre) */
  onTime: boolean | null;
}

export interface ComparisonResult {
  generatedAt: Date;
  previousFileCount: number;
  newFileCount: number;
  closedIncidents: ComparisonIncidentResult[];
  onTimeCount: number;
  overdueCount: number;
  indeterminateCount: number;
  /** % sobre incidentes con fecha de cierre conocida (excluye indeterminados) */
  compliancePercentage: number;
}

/**
 * Compara el dataset de incidentes "abiertos" antes y después de cargar un
 * nuevo archivo, para identificar cuáles ya no aparecen (se resolvieron/cerraron
 * entre versiones) y valida su cumplimiento de OLA.
 */
@Injectable({
  providedIn: 'root'
})
export class ComparisonService {
  private lastComparison$ = new BehaviorSubject<ComparisonResult | null>(null);

  getLastComparison(): Observable<ComparisonResult | null> {
    return this.lastComparison$.asObservable();
  }

  /**
   * Algoritmo de comparación:
   * 1. Diferencial: cualquier incidente presente en `previousOpen` cuyo
   *    `incidentNumber` ya no está en `newOpen` se considera cerrado/resuelto
   *    entre la versión anterior y la nueva.
   * 2. Fecha de cierre: se busca primero en `resolvedPool` (el dataset de
   *    "Resueltos" actualmente cargado, que es la fuente de verdad de
   *    solutionDate/closeDate). Si no aparece ahí, se usa la propia
   *    solutionDate/closeDate que ya traía el registro en el archivo viejo
   *    (por si el incidente llegó cerrado con datos de solución embebidos).
   *    Si ninguna existe, el incidente queda "indeterminado".
   * 3. Validación OLA: horas hábiles (Colombia, excluye fines de semana y
   *    festivos) entre openDate y closeDate, comparadas contra el umbral de
   *    SLA_HOURS_BY_PRIORITY de la prioridad del incidente (misma config que
   *    usan los módulos OLA Abiertos/Resueltos).
   */
  computeComparison(previousOpen: Incident[], newOpen: Incident[], resolvedPool: Incident[]): ComparisonResult {
    const newIds = new Set(newOpen.map(i => i.incidentNumber));
    const resolvedByNumber = new Map(resolvedPool.map(i => [i.incidentNumber, i]));
    const now = nowInBogota();

    const closedIncidents: ComparisonIncidentResult[] = previousOpen
      .filter(incident => !newIds.has(incident.incidentNumber))
      .map(incident => this.evaluateClosedIncident(incident, resolvedByNumber, now));

    const onTimeCount = closedIncidents.filter(c => c.onTime === true).length;
    const overdueCount = closedIncidents.filter(c => c.onTime === false).length;
    const indeterminateCount = closedIncidents.filter(c => c.onTime === null).length;
    const determinateTotal = onTimeCount + overdueCount;

    const result: ComparisonResult = {
      generatedAt: now,
      previousFileCount: previousOpen.length,
      newFileCount: newOpen.length,
      closedIncidents,
      onTimeCount,
      overdueCount,
      indeterminateCount,
      compliancePercentage: determinateTotal > 0 ? Math.round((onTimeCount / determinateTotal) * 1000) / 10 : 0
    };

    this.lastComparison$.next(result);
    return result;
  }

  private evaluateClosedIncident(
    incident: Incident,
    resolvedByNumber: Map<string, Incident>,
    now: Date
  ): ComparisonIncidentResult {
    const resolvedMatch = resolvedByNumber.get(incident.incidentNumber);

    let closeDate: Date | undefined;
    let closeDateSource: ComparisonIncidentResult['closeDateSource'];

    if (resolvedMatch?.solutionDate || resolvedMatch?.closeDate) {
      closeDate = resolvedMatch.solutionDate ?? resolvedMatch.closeDate;
      closeDateSource = 'resueltos';
    } else if (incident.solutionDate || incident.closeDate) {
      closeDate = incident.solutionDate ?? incident.closeDate;
      closeDateSource = 'archivo-anterior';
    } else {
      closeDateSource = 'sin-dato';
    }

    const thresholdHours = SLA_HOURS_BY_PRIORITY[incident.priority] ?? SLA_HOURS_BY_PRIORITY[IncidentPriority.MEDIUM];
    const elapsedBusinessHours = closeDate ? businessHoursBetween(incident.openDate, closeDate) : 0;

    return {
      incidentNumber: incident.incidentNumber,
      summary: incident.summary,
      priority: incident.priority,
      assignedAnalyst: incident.assignedAnalyst,
      assignedGroup: incident.assignedGroup,
      openDate: incident.openDate,
      closeDate,
      closeDateSource,
      elapsedBusinessHours,
      thresholdHours,
      onTime: closeDate ? elapsedBusinessHours <= thresholdHours : null
    };
  }

  clear(): void {
    this.lastComparison$.next(null);
  }
}
