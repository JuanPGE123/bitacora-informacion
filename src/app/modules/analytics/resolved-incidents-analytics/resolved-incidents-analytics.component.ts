import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { ExportService } from '../../../core/services/export.service';
import { IncidentService } from '../../../core/services/incident.service';
import { KpiService } from '../../../core/services/kpi.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { Incident, IncidentPriority } from '../../../core/models/incident.model';

// Registrar componentes de Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-resolved-incidents-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resolved-incidents-analytics.component.html',
  styleUrls: ['./resolved-incidents-analytics.component.scss']
})
export class ResolvedIncidentsAnalyticsComponent implements OnInit, AfterViewInit {
  @ViewChild('resolutionTimeChart') resolutionTimeChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('analystChart') analystChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendChart') trendChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('slaChart') slaChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('priorityChart') priorityChartRef!: ElementRef<HTMLCanvasElement>;

  private charts: Chart[] = [];
  dataLoaded = false;
  
  // KPIs de incidentes resueltos
  totalResolved = 0;
  averageResolutionTime = 0;
  slaCompliance = 0;
  resolvedToday = 0;

  constructor(
    private analyticsService: AnalyticsService,
    private exportService: ExportService,
    private incidentService: IncidentService,
    private kpiService: KpiService
  ) {}

  ngOnInit(): void {
    this.loadKPIs();
  }

  ngAfterViewInit(): void {
    // Esperar un tick para asegurar que las vistas estén listas
    setTimeout(() => this.loadCharts(), 100);
  }

  loadKPIs(): void {
    this.incidentService.getResolvedIncidentsObservable().subscribe(incidents => {
      this.totalResolved = incidents.length;
      this.averageResolutionTime = this.calculateAverageResolutionTime(incidents);
      this.slaCompliance = this.calculateSLACompliance(incidents);
      this.resolvedToday = this.calculateResolvedToday(incidents);
    });
  }

  loadCharts(): void {
    this.createResolutionTimeChart();
    this.createAnalystChart();
    this.createTrendChart();
    this.createSLAChart();
    this.createCategoryChart();
    this.createPriorityChart();
    this.dataLoaded = true;
  }

  private createResolutionTimeChart(): void {
    this.incidentService.getResolvedIncidentsObservable().subscribe(incidents => {
      const timeBuckets = {
        '< 24 hrs': 0,
        '1-3 días': 0,
        '4-7 días': 0,
        '8-15 días': 0,
        '> 15 días': 0
      };

      incidents.forEach(incident => {
        const hours = incident.effectiveSolutionTime || 0;
        
        if (hours < 24) timeBuckets['< 24 hrs']++;
        else if (hours < 72) timeBuckets['1-3 días']++;
        else if (hours < 168) timeBuckets['4-7 días']++;
        else if (hours < 360) timeBuckets['8-15 días']++;
        else timeBuckets['> 15 días']++;
      });

      const ctx = this.resolutionTimeChartRef.nativeElement.getContext('2d');
      if (ctx) {
        const chartConfig: ChartConfiguration = {
          type: 'bar',
          data: {
            labels: Object.keys(timeBuckets),
            datasets: [{
              label: 'Número de Incidentes',
              data: Object.values(timeBuckets),
              backgroundColor: [
                'rgba(34, 197, 94, 0.8)',   // Verde - muy rápido
                'rgba(59, 130, 246, 0.8)',  // Azul
                'rgba(234, 179, 8, 0.8)',   // Amarillo
                'rgba(249, 115, 22, 0.8)',  // Naranja
                'rgba(239, 68, 68, 0.8)'    // Rojo - lento
              ],
              borderColor: [
                'rgba(34, 197, 94, 1)',
                'rgba(59, 130, 246, 1)',
                'rgba(234, 179, 8, 1)',
                'rgba(249, 115, 22, 1)',
                'rgba(239, 68, 68, 1)'
              ],
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }
        };
        this.charts.push(new Chart(ctx, chartConfig));
      }
    });
  }

  private createAnalystChart(): void {
    this.incidentService.getResolvedIncidentsObservable().subscribe(incidents => {
      const analystCounts = this.getAnalystCounts(incidents);
      const sortedAnalysts = Object.entries(analystCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      const ctx = this.analystChartRef.nativeElement.getContext('2d');
      if (ctx) {
        const chartConfig: ChartConfiguration = {
          type: 'bar',
          data: {
            labels: sortedAnalysts.map(([name]) => name),
            datasets: [{
              label: 'Incidentes Resueltos',
              data: sortedAnalysts.map(([, count]) => count),
              backgroundColor: 'rgba(34, 197, 94, 0.8)',
              borderColor: 'rgba(34, 197, 94, 1)',
              borderWidth: 2
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              x: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }
        };
        this.charts.push(new Chart(ctx, chartConfig));
      }
    });
  }

  private createTrendChart(): void {
    this.incidentService.getResolvedIncidentsObservable().subscribe(incidents => {
      const last30Days = this.getLast30Days();
      const dailyCounts = this.getDailyResolvedCounts(incidents, last30Days);
      
      const ctx = this.trendChartRef.nativeElement.getContext('2d');
      if (ctx) {
        const chartConfig: ChartConfiguration = {
          type: 'line',
          data: {
            labels: last30Days,
            datasets: [{
              label: 'Incidentes Resueltos',
              data: dailyCounts,
              borderColor: 'rgba(34, 197, 94, 1)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.3
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }
        };
        this.charts.push(new Chart(ctx, chartConfig));
      }
    });
  }

  private createSLAChart(): void {
    this.incidentService.getResolvedIncidentsObservable().subscribe(incidents => {
      const slaCompliance = {
        'Cumple SLA': incidents.filter(i => i.meetsSla).length,
        'No Cumple SLA': incidents.filter(i => !i.meetsSla).length
      };

      const ctx = this.slaChartRef.nativeElement.getContext('2d');
      if (ctx) {
        const chartConfig: ChartConfiguration = {
          type: 'doughnut',
          data: {
            labels: Object.keys(slaCompliance),
            datasets: [{
              label: 'Cumplimiento SLA',
              data: Object.values(slaCompliance),
              backgroundColor: [
                'rgba(34, 197, 94, 0.8)',   // Verde - cumple
                'rgba(239, 68, 68, 0.8)'    // Rojo - no cumple
              ],
              borderColor: [
                'rgba(34, 197, 94, 1)',
                'rgba(239, 68, 68, 1)'
              ],
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        };
        this.charts.push(new Chart(ctx, chartConfig));
      }
    });
  }

  private createCategoryChart(): void {
    this.incidentService.getResolvedIncidentsObservable().subscribe(incidents => {
      const categoryCounts = this.getCategoryCounts(incidents);
      const sortedCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
      
      const ctx = this.categoryChartRef.nativeElement.getContext('2d');
      if (ctx) {
        const chartConfig: ChartConfiguration = {
          type: 'bar',
          data: {
            labels: sortedCategories.map(([name]) => name),
            datasets: [{
              label: 'Incidentes Resueltos por Categoría',
              data: sortedCategories.map(([, count]) => count),
              backgroundColor: 'rgba(168, 85, 247, 0.8)',
              borderColor: 'rgba(168, 85, 247, 1)',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  stepSize: 1
                }
              }
            }
          }
        };
        this.charts.push(new Chart(ctx, chartConfig));
      }
    });
  }

  private createPriorityChart(): void {
    this.incidentService.getResolvedIncidentsObservable().subscribe(incidents => {
      const priorityCounts = this.getPriorityCounts(incidents);
      
      const ctx = this.priorityChartRef.nativeElement.getContext('2d');
      if (ctx) {
        const chartConfig: ChartConfiguration = {
          type: 'doughnut',
          data: {
            labels: Object.keys(priorityCounts),
            datasets: [{
              label: 'Incidentes por Prioridad',
              data: Object.values(priorityCounts),
              backgroundColor: [
                'rgba(220, 38, 38, 0.8)',   // Critical - Rojo
                'rgba(249, 115, 22, 0.8)',  // High - Naranja
                'rgba(234, 179, 8, 0.8)',   // Medium - Amarillo
                'rgba(34, 197, 94, 0.8)'    // Low - Verde
              ],
              borderColor: [
                'rgba(220, 38, 38, 1)',
                'rgba(249, 115, 22, 1)',
                'rgba(234, 179, 8, 1)',
                'rgba(34, 197, 94, 1)'
              ],
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        };
        this.charts.push(new Chart(ctx, chartConfig));
      }
    });
  }

  private getPriorityCounts(incidents: Incident[]): Record<string, number> {
    const counts: Record<string, number> = {};
    incidents.forEach(incident => {
      const priority = incident.priority || 'Sin Prioridad';
      counts[priority] = (counts[priority] || 0) + 1;
    });
    return counts;
  }

  private getAnalystCounts(incidents: Incident[]): Record<string, number> {
    const counts: Record<string, number> = {};
    incidents.forEach(incident => {
      const analyst = incident.assignedAnalyst || 'Sin Asignar';
      counts[analyst] = (counts[analyst] || 0) + 1;
    });
    return counts;
  }

  private getCategoryCounts(incidents: Incident[]): Record<string, number> {
    const counts: Record<string, number> = {};
    incidents.forEach(incident => {
      const category = incident.productCategory || 'Sin Categoría';
      counts[category] = (counts[category] || 0) + 1;
    });
    return counts;
  }

  private calculateAverageResolutionTime(incidents: Incident[]): number {
    if (incidents.length === 0) return 0;
    
    const totalHours = incidents.reduce((sum, incident) => {
      const hours = incident.effectiveSolutionTime || 0;
      return sum + hours;
    }, 0);
    
    return Math.round(totalHours / incidents.length);
  }

  private calculateSLACompliance(incidents: Incident[]): number {
    if (incidents.length === 0) return 0;
    
    const compliant = incidents.filter(i => i.meetsSla).length;
    return Math.round((compliant / incidents.length) * 100);
  }

  private calculateResolvedToday(incidents: Incident[]): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return incidents.filter(incident => {
      if (!incident.solutionDate) return false;
      const solutionDate = new Date(incident.solutionDate);
      solutionDate.setHours(0, 0, 0, 0);
      return solutionDate.getTime() === today.getTime();
    }).length;
  }

  private getLast30Days(): string[] {
    const days: string[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }));
    }
    
    return days;
  }

  private getDailyResolvedCounts(incidents: Incident[], last30Days: string[]): number[] {
    const counts: number[] = new Array(30).fill(0);
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (29 - i));
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      counts[i] = incidents.filter(incident => {
        if (!incident.solutionDate) return false;
        const solutionDate = new Date(incident.solutionDate);
        solutionDate.setHours(0, 0, 0, 0);
        return solutionDate.getTime() === date.getTime();
      }).length;
    }
    
    return counts;
  }

  exportData(format: 'csv' | 'xlsx'): void {
    this.incidentService.getResolvedIncidentsObservable().subscribe(incidents => {
      this.exportService.export(incidents, { format, includeFilters: false }, 'incidentes_resueltos');
    });
  }

  ngOnDestroy(): void {
    // Limpiar gráficos al destruir el componente
    this.charts.forEach(chart => chart.destroy());
  }
}
