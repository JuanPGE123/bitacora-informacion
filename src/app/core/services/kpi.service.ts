import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { IncidentService } from './incident.service';
import { 
  DashboardKPI, 
  AnalystStats, 
  PriorityDistribution, 
  CategoryDistribution,
  DailyTrend,
  Incident,
  IncidentStatus,
  IncidentPriority
} from '../models/incident.model';

@Injectable({
  providedIn: 'root'
})
export class KpiService {

  constructor(private incidentService: IncidentService) { }

  /**
   * Calcula todos los KPIs del dashboard
   */
  getDashboardKPIs(): Observable<DashboardKPI> {
    return this.incidentService.getIncidents().pipe(
      map(incidents => this.calculateKPIs(incidents))
    );
  }

  /**
   * Calcula KPIs a partir de los incidentes
   */
  private calculateKPIs(incidents: Incident[]): DashboardKPI {
    const totalIncidents = incidents.length;
    const openIncidents = this.countByStatus(incidents, [
      IncidentStatus.OPEN, 
      IncidentStatus.IN_PROGRESS, 
      IncidentStatus.PENDING
    ]);
    const resolvedIncidents = this.countByStatus(incidents, [
      IncidentStatus.RESOLVED, 
      IncidentStatus.CLOSED
    ]);
    const criticalIncidents = incidents.filter(i => i.priority === IncidentPriority.CRITICAL).length;
    const pendingIncidents = incidents.filter(i => i.status === IncidentStatus.PENDING).length;
    const activeAnalysts = new Set(incidents.map(i => i.assignedAnalyst).filter(a => a)).size;

    const resolutionPercentage = totalIncidents > 0 
      ? (resolvedIncidents / totalIncidents) * 100 
      : 0;

    const averageResolutionTime = this.calculateAverageResolutionTime(incidents);

    return {
      totalIncidents,
      openIncidents,
      resolvedIncidents,
      resolutionPercentage,
      averageResolutionTime,
      activeAnalysts,
      criticalIncidents,
      pendingIncidents
    };
  }

  /**
   * Cuenta incidentes por estado
   */
  private countByStatus(incidents: Incident[], statuses: IncidentStatus[]): number {
    return incidents.filter(i => statuses.includes(i.status)).length;
  }

  /**
   * Calcula el tiempo promedio de resolución en horas
   */
  private calculateAverageResolutionTime(incidents: Incident[]): number {
    // Usar effectiveSolutionTime si está disponible
    const resolvedWithTime = incidents.filter(i => 
      i.effectiveSolutionTime !== undefined && i.effectiveSolutionTime !== null
    );

    if (resolvedWithTime.length === 0) {
      // Si no hay tiempo efectivo, calcular basado en fechas
      const resolvedIncidents = incidents.filter(i => 
        i.solutionDate && (i.status === IncidentStatus.RESOLVED || i.status === IncidentStatus.CLOSED)
      );

      if (resolvedIncidents.length === 0) {
        return 0;
      }

      const totalHours = resolvedIncidents.reduce((sum, incident) => {
        const created = new Date(incident.openDate).getTime();
        const resolved = new Date(incident.solutionDate!).getTime();
        const hours = (resolved - created) / (1000 * 60 * 60);
        return sum + hours;
      }, 0);

      return totalHours / resolvedIncidents.length;
    }

    const totalHours = resolvedWithTime.reduce((sum, incident) => 
      sum + incident.effectiveSolutionTime!, 0
    );

    return totalHours / resolvedWithTime.length;
  }

  /**
   * Obtiene estadísticas por analista
   */
  getAnalystStats(): Observable<AnalystStats[]> {
    return this.incidentService.getIncidents().pipe(
      map(incidents => this.calculateAnalystStats(incidents))
    );
  }

  /**
   * Calcula estadísticas por analista
   */
  private calculateAnalystStats(incidents: Incident[]): AnalystStats[] {
    const analysts = new Set(incidents.map(i => i.assignedAnalyst).filter(a => a));
    const stats: AnalystStats[] = [];

    analysts.forEach(analyst => {
      const analystIncidents = incidents.filter(i => i.assignedAnalyst === analyst);
      const totalIncidents = analystIncidents.length;
      const openIncidents = analystIncidents.filter(i => 
        i.status === IncidentStatus.OPEN || 
        i.status === IncidentStatus.IN_PROGRESS || 
        i.status === IncidentStatus.PENDING
      ).length;
      const resolvedIncidents = analystIncidents.filter(i => 
        i.status === IncidentStatus.RESOLVED || 
        i.status === IncidentStatus.CLOSED
      ).length;
      const averageResolutionTime = this.calculateAverageResolutionTime(analystIncidents);
      const resolutionRate = totalIncidents > 0 
        ? (resolvedIncidents / totalIncidents) * 100 
        : 0;

      stats.push({
        analyst: analyst!,
        totalIncidents,
        openIncidents,
        resolvedIncidents,
        averageResolutionTime,
        resolutionRate
      });
    });

    return stats.sort((a, b) => b.totalIncidents - a.totalIncidents);
  }

  /**
   * Obtiene distribución por prioridad
   */
  getPriorityDistribution(): Observable<PriorityDistribution[]> {
    return this.incidentService.getIncidents().pipe(
      map(incidents => {
        const total = incidents.length;
        const distribution: PriorityDistribution[] = [];

        Object.values(IncidentPriority).forEach(priority => {
          const count = incidents.filter(i => i.priority === priority).length;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          distribution.push({
            priority,
            count,
            percentage
          });
        });

        return distribution.sort((a, b) => b.count - a.count);
      })
    );
  }

  /**
   * Obtiene distribución por categoría
   */
  getCategoryDistribution(): Observable<CategoryDistribution[]> {
    return this.incidentService.getIncidents().pipe(
      map(incidents => {
        const total = incidents.length;
        const categories = new Set(incidents.map(i => i.productCategory).filter(c => c));
        const distribution: CategoryDistribution[] = [];

        categories.forEach(category => {
          const count = incidents.filter(i => i.productCategory === category).length;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          distribution.push({
            category: category!,
            count,
            percentage
          });
        });

        return distribution.sort((a, b) => b.count - a.count);
      })
    );
  }

  /**
   * Obtiene tendencia diaria de incidentes
   */
  getDailyTrend(days: number = 30): Observable<DailyTrend[]> {
    return this.incidentService.getIncidents().pipe(
      map(incidents => {
        const trends: Map<string, DailyTrend> = new Map();
        
        // Generar fechas para los últimos N días
        const today = new Date();
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateKey = this.getDateKey(date);
          
          trends.set(dateKey, {
            date: new Date(date),
            openCount: 0,
            resolvedCount: 0,
            netChange: 0
          });
        }

        // Contar incidentes por día
        incidents.forEach(incident => {
          const createdKey = this.getDateKey(incident.openDate);
          
          if (trends.has(createdKey)) {
            const trend = trends.get(createdKey)!;
            
            if (incident.status === IncidentStatus.OPEN || 
                incident.status === IncidentStatus.IN_PROGRESS || 
                incident.status === IncidentStatus.PENDING) {
              trend.openCount++;
            }
            
            if (incident.solutionDate) {
              const resolvedKey = this.getDateKey(incident.solutionDate);
              if (trends.has(resolvedKey)) {
                trends.get(resolvedKey)!.resolvedCount++;
              }
            }
          }
        });

        // Calcular cambio neto
        trends.forEach(trend => {
          trend.netChange = trend.openCount - trend.resolvedCount;
        });

        return Array.from(trends.values());
      })
    );
  }

  /**
   * Obtiene la clave de fecha en formato YYYY-MM-DD
   */
  private getDateKey(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Obtiene top analistas por cantidad de incidentes
   */
  getTopAnalysts(limit: number = 5): Observable<AnalystStats[]> {
    return this.getAnalystStats().pipe(
      map(stats => stats.slice(0, limit))
    );
  }

  /**
   * Calcula tasa de resolución global
   */
  getResolutionRate(): Observable<number> {
    return this.getDashboardKPIs().pipe(
      map(kpis => kpis.resolutionPercentage)
    );
  }
}
