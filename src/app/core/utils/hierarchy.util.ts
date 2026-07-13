import { Incident } from '../models/incident.model';

export const SIN_GRUPO = 'Sin Grupo';
export const SIN_ASIGNAR = 'Sin Asignar';

export interface AnalystNode {
  analyst: string;
  incidents: Incident[];
  count: number;
}

export interface GroupNode {
  group: string;
  analysts: AnalystNode[];
  count: number;
}

/**
 * Agrupa incidentes en jerarquía estricta Grupo -> Analista.
 * Un analista solo aparece dentro de los grupos a los que realmente pertenece
 * (comparación exacta de assignedGroup), nunca mezclado entre grupos distintos.
 */
export function groupByGroupThenAnalyst(incidents: Incident[]): GroupNode[] {
  const groupMap = new Map<string, Map<string, Incident[]>>();

  for (const incident of incidents) {
    const group = incident.assignedGroup?.trim() || SIN_GRUPO;
    const analyst = incident.assignedAnalyst?.trim() || SIN_ASIGNAR;

    if (!groupMap.has(group)) {
      groupMap.set(group, new Map());
    }
    const analystMap = groupMap.get(group)!;

    if (!analystMap.has(analyst)) {
      analystMap.set(analyst, []);
    }
    analystMap.get(analyst)!.push(incident);
  }

  const groups: GroupNode[] = Array.from(groupMap.entries()).map(([group, analystMap]) => {
    const analysts: AnalystNode[] = Array.from(analystMap.entries())
      .map(([analyst, incidents]) => ({ analyst, incidents, count: incidents.length }))
      .sort((a, b) => b.count - a.count);

    const count = analysts.reduce((sum, a) => sum + a.count, 0);
    return { group, analysts, count };
  });

  return groups.sort((a, b) => b.count - a.count);
}
