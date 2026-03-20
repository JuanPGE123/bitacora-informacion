import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { KpiService } from './kpi.service';
import { IncidentService } from './incident.service';
import { ChartConfig, ChartType, CHART_COLORS, PRIORITY_COLORS, STATUS_COLORS } from '../models/chart.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor(
    private kpiService: KpiService,
    private incidentService: IncidentService
  ) { }

  /**
   * Obtiene gráfico de incidentes por analista (Barras)
   */
  getIncidentsByAnalystChart(): Observable<ChartConfig> {
    return this.kpiService.getAnalystStats().pipe(
      map(stats => {
        const top10 = stats.slice(0, 10);
        
        return {
          type: 'bar' as ChartType,
          data: {
            labels: top10.map(s => s.analyst),
            datasets: [
              {
                label: 'Total Incidentes',
                data: top10.map(s => s.totalIncidents),
                backgroundColor: CHART_COLORS.primary,
                borderColor: CHART_COLORS.primary,
                borderWidth: 1
              },
              {
                label: 'Abiertos',
                data: top10.map(s => s.openIncidents),
                backgroundColor: CHART_COLORS.warning,
                borderColor: CHART_COLORS.warning,
                borderWidth: 1
              },
              {
                label: 'Resueltos',
                data: top10.map(s => s.resolvedIncidents),
                backgroundColor: CHART_COLORS.success,
                borderColor: CHART_COLORS.success,
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top'
              },
              title: {
                display: true,
                text: 'Incidentes por Analista'
              }
            }
          }
        };
      })
    );
  }

  /**
   * Obtiene gráfico de distribución por prioridad (Pastel/Dona)
   */
  getPriorityDistributionChart(): Observable<ChartConfig> {
    return this.kpiService.getPriorityDistribution().pipe(
      map(distribution => {
        // Mapear prioridades a colores
        const colors = distribution.map(d => {
          const priorityStr = String(d.priority);
          if (priorityStr.includes('Crítico') || priorityStr.includes('Critical') || priorityStr.includes('1')) {
            return '#EF4444';  // Red
          } else if (priorityStr.includes('Alto') || priorityStr.includes('High') || priorityStr.includes('2')) {
            return '#F59E0B';  // Orange
          } else if (priorityStr.includes('Bajo') || priorityStr.includes('Low') || priorityStr.includes('4')) {
            return '#10B981';  // Green
          } else {
            return '#3B82F6';  // Blue (Medium)
          }
        });
        
        return {
          type: 'doughnut' as ChartType,
          data: {
            labels: distribution.map(d => `${d.priority} (${d.count})`),
            datasets: [{
              label: 'Incidentes',
              data: distribution.map(d => d.count),
              backgroundColor: colors,
              borderColor: '#ffffff',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'right'
              },
              title: {
                display: true,
                text: 'Distribución por Prioridad'
              }
            }
          }
        };
      })
    );
  }

  /**
   * Obtiene gráfico de tendencia diaria (Línea)
   */
  getDailyTrendChart(days: number = 30): Observable<ChartConfig> {
    return this.kpiService.getDailyTrend(days).pipe(
      map(trends => {
        return {
          type: 'line' as ChartType,
          data: {
            labels: trends.map(t => this.formatDate(t.date)),
            datasets: [
              {
                label: 'Abiertos',
                data: trends.map(t => t.openCount),
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                borderColor: CHART_COLORS.warning,
                borderWidth: 2
              },
              {
                label: 'Resueltos',
                data: trends.map(t => t.resolvedCount),
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                borderColor: CHART_COLORS.success,
                borderWidth: 2
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top'
              },
              title: {
                display: true,
                text: 'Tendencia de Incidentes (Últimos 30 días)'
              }
            },
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        };
      })
    );
  }

  /**
   * Obtiene gráfico comparativo abiertos vs resueltos
   */
  getOpenVsResolvedChart(): Observable<ChartConfig> {
    return this.kpiService.getDashboardKPIs().pipe(
      map(kpis => {
        return {
          type: 'bar' as ChartType,
          data: {
            labels: ['Estado de Incidentes'],
            datasets: [
              {
                label: 'Abiertos',
                data: [kpis.openIncidents],
                backgroundColor: CHART_COLORS.warning,
                borderColor: CHART_COLORS.warning,
                borderWidth: 1
              },
              {
                label: 'Resueltos',
                data: [kpis.resolvedIncidents],
                backgroundColor: CHART_COLORS.success,
                borderColor: CHART_COLORS.success,
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top'
              },
              title: {
                display: true,
                text: 'Incidentes Abiertos vs Resueltos'
              }
            }
          }
        };
      })
    );
  }

  /**
   * Obtiene gráfico de distribución por categoría
   */
  getCategoryDistributionChart(): Observable<ChartConfig> {
    return this.kpiService.getCategoryDistribution().pipe(
      map(distribution => {
        const top10 = distribution.slice(0, 10);
        
        return {
          type: 'bar' as ChartType,
          data: {
            labels: top10.map(d => d.category),
            datasets: [{
              label: 'Cantidad',
              data: top10.map(d => d.count),
              backgroundColor: CHART_COLORS.info,
              borderColor: CHART_COLORS.info,
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              title: {
                display: true,
                text: 'Top 10 Categorías'
              }
            }
          }
        };
      })
    );
  }

  /**
   * Formatea una fecha para mostrar en gráficos
   */
  private formatDate(date: Date): string {
    const d = new Date(date);
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${day}/${month}`;
  }
}
