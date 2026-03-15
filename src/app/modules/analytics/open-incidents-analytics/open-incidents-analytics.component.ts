import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidentService } from '../../../core/services/incident.service';
import { Incident } from '../../../core/models/incident.model';

interface ExternalTicketGroup {
  ticketName: string;
  count: number;
  incidents: Incident[];
  expanded: boolean;
}

@Component({
  selector: 'app-open-incidents-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './open-incidents-analytics.component.html',
  styleUrls: ['./open-incidents-analytics.component.scss']
})
export class OpenIncidentsAnalyticsComponent implements OnInit {
  // Contadores de External Ticket
  incidentsWithExternalTicket: number = 0;
  incidentsWithoutExternalTicket: number = 0;
  
  // Agrupación por External Ticket
  externalTicketGroups: ExternalTicketGroup[] = [];
  
  // Incidentes Dynatrace
  dynatraceIncidents: Incident[] = [];
  dynatraceCount: number = 0;
  dynatraceExpanded: boolean = false;
  
  // Incidentes con ANS >= 66.5
  highSLAIncidents: Incident[] = [];
  highSLACount: number = 0;
  highSLAExpanded: boolean = false;
  
  copiedMessage: string = '';

  constructor(private incidentService: IncidentService) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.incidentService.getOpenIncidentsObservable().subscribe(incidents => {
      // 1. Contadores de External Ticket
      this.incidentsWithExternalTicket = incidents.filter(i => i.externalTicket && i.externalTicket.trim() !== '').length;
      this.incidentsWithoutExternalTicket = incidents.filter(i => !i.externalTicket || i.externalTicket.trim() === '').length;
      
      // 2. Agrupar por External Ticket
      const ticketGroups = new Map<string, Incident[]>();
      incidents.forEach(incident => {
        const ticket = incident.externalTicket?.trim();
        if (ticket) {
          if (!ticketGroups.has(ticket)) {
            ticketGroups.set(ticket, []);
          }
          ticketGroups.get(ticket)!.push(incident);
        }
      });
      
      this.externalTicketGroups = Array.from(ticketGroups.entries())
        .map(([ticketName, incidents]) => ({
          ticketName,
          count: incidents.length,
          incidents: incidents.sort((a, b) => 
            (a.incidentNumber || '').localeCompare(b.incidentNumber || '')
          ),
          expanded: false
        }))
        .sort((a, b) => b.count - a.count);
      
      // 3. Filtrar incidentes Dynatrace
      this.dynatraceIncidents = incidents.filter(i => 
        i.operationalCategory2?.trim().toLowerCase() === 'dynatrace'
      ).sort((a, b) => (a.incidentNumber || '').localeCompare(b.incidentNumber || ''));
      this.dynatraceCount = this.dynatraceIncidents.length;
      
      // 4. Filtrar incidentes con ANS >= 66.5
      this.highSLAIncidents = incidents.filter(i => 
        i.slaTime !== undefined && i.slaTime >= 66.5
      ).sort((a, b) => (b.slaTime || 0) - (a.slaTime || 0));
      this.highSLACount = this.highSLAIncidents.length;
    });
  }

  toggleTicketGroup(group: ExternalTicketGroup): void {
    group.expanded = !group.expanded;
  }

  toggleDynatrace(): void {
    this.dynatraceExpanded = !this.dynatraceExpanded;
  }

  toggleHighSLA(): void {
    this.highSLAExpanded = !this.highSLAExpanded;
  }

  copyDynatraceIncidents(): void {
    const text = this.formatIncidentsForCopy(this.dynatraceIncidents);
    this.copyToClipboard(text, 'Incidentes Dynatrace copiados');
  }

  copyHighSLAIncidents(): void {
    const incidents = this.highSLAIncidents.map(i => ({
      incident: i.incidentNumber,
      analyst: i.assignedAnalyst || 'Sin Asignar',
      slaTime: i.slaTime || 0
    }));
    
    let text = '| No. Incidente | Analista Asignado | Tiempo ANS |\n';
    text += '|---------------|-------------------|------------|\n';
    incidents.forEach(item => {
      text += `| ${item.incident} | ${item.analyst} | ${item.slaTime.toFixed(2)} |\n`;
    });
    
    this.copyToClipboard(text, 'Incidentes con ANS >= 66.5 copiados');
  }

  copyTicketGroupIncidents(group: ExternalTicketGroup): void {
    const text = this.formatIncidentsForCopy(group.incidents);
    this.copyToClipboard(text, `Incidentes de ${group.ticketName} copiados`);
  }

  private formatIncidentsForCopy(incidents: Incident[]): string {
    let text = '| No. Incidente | External Ticket | Fecha Apertura | Analista | Prioridad |\n';
    text += '|---------------|-----------------|----------------|----------|----------|\n';
    incidents.forEach(incident => {
      const ticket = incident.externalTicket || 'Sin External Ticket';
      const openDate = this.formatDate(incident.openDate);
      const analyst = incident.assignedAnalyst || 'Sin Asignar';
      text += `| ${incident.incidentNumber} | ${ticket} | ${openDate} | ${analyst} | ${incident.priority} |\n`;
    });
    return text;
  }

  formatDate(date: Date): string {
    if (!date) return '-';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  private copyToClipboard(text: string, message: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedMessage = message;
      setTimeout(() => {
        this.copiedMessage = '';
      }, 3000);
    }).catch(err => {
      console.error('Error al copiar:', err);
      this.copiedMessage = 'Error al copiar';
      setTimeout(() => {
        this.copiedMessage = '';
      }, 3000);
    });
  }
}

  toggleQuoteBranch(branch: QuoteBranch): void {
    branch.expanded = !branch.expanded;
  }

  copyAnalystIncidents(group: AnalystGroup): void {
    const text = this.formatIncidentsForCopy(group.incidents);
    this.copyToClipboard(text, `Incidentes de ${group.analyst} copiados`);
  }

  copyBranchIncidents(branch: QuoteBranch): void {
    const text = this.formatIncidentsForCopy(branch.incidents);
    this.copyToClipboard(text, `Incidentes de ${branch.branch} copiados`);
  }

  copyMainQueuesIncidents(): void {
    const text = this.formatIncidentsForCopy(this.mainQueuesIncidents);
    this.copyToClipboard(text, 'Incidentes de bandejas principales copiados');
  }

  copyOtherAnalystsIncidents(): void {
    const text = this.formatIncidentsForCopy(this.otherAnalystsIncidents);
    this.copyToClipboard(text, 'Incidentes de otros analistas copiados');
  }

  private formatIncidentsForCopy(incidents: Incident[]): string {
    let text = 'No. Incidente\tExternal Ticket\tFecha Apertura\tAnalista\n';
    incidents.forEach(incident => {
      const ticket = incident.externalTicket || 'Sin External Ticket';
      const date = this.formatDate(incident.openDate);
      const analyst = incident.assignedAnalyst || 'Sin Asignar';
      text += `${incident.incidentNumber}\t${ticket}\t${date}\t${analyst}\n`;
    });
    return text;
  }

  private copyToClipboard(text: string, message: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedMessage = message;
      setTimeout(() => {
        this.copiedMessage = '';
      }, 3000);
    }).catch(err => {
      console.error('Error al copiar:', err);
      this.copiedMessage = 'Error al copiar';
      setTimeout(() => {
        this.copiedMessage = '';
      }, 3000);
    });
  }

  loadKPIs(): void {
    this.incidentService.getOpenIncidentsObservable().subscribe(incidents => {
      this.totalOpen = incidents.length;
      this.criticalCount = incidents.filter(i => i.priority === IncidentPriority.CRITICAL).length;
      this.averageAge = this.calculateAverageAge(incidents);
      this.slaAtRisk = incidents.filter(i => !i.meetsSla).length;
    });
  }

  loadCharts(): void {
    this.createPriorityChart();
    this.createAnalystChart();
    this.createAgingChart();
    this.createSLAChart();
    this.createCategoryChart();
    this.createTrendChart();
    this.dataLoaded = true;
  }

  private createPriorityChart(): void {
    this.incidentService.getOpenIncidentsObservable().subscribe(incidents => {
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
              },
              title: {
                display: false
              }
            }
          }
        };
        this.charts.push(new Chart(ctx, chartConfig));
      }
    });
  }

  private createAnalystChart(): void {
    this.incidentService.getOpenIncidentsObservable().subscribe(incidents => {
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
              label: 'Incidentes Abiertos',
              data: sortedAnalysts.map(([, count]) => count),
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderColor: 'rgba(59, 130, 246, 1)',
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

  private createAgingChart(): void {
    this.incidentService.getOpenIncidentsObservable().subscribe(incidents => {
      const agingBuckets = {
        '0-7 días': 0,
        '8-15 días': 0,
        '16-30 días': 0,
        '31-60 días': 0,
        '> 60 días': 0
      };

      const now = new Date();
      incidents.forEach(incident => {
        const age = Math.floor((now.getTime() - incident.openDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (age <= 7) agingBuckets['0-7 días']++;
        else if (age <= 15) agingBuckets['8-15 días']++;
        else if (age <= 30) agingBuckets['16-30 días']++;
        else if (age <= 60) agingBuckets['31-60 días']++;
        else agingBuckets['> 60 días']++;
      });

      const ctx = this.agingChartRef.nativeElement.getContext('2d');
      if (ctx) {
        const chartConfig: ChartConfiguration = {
          type: 'bar',
          data: {
            labels: Object.keys(agingBuckets),
            datasets: [{
              label: 'Número de Incidentes',
              data: Object.values(agingBuckets),
              backgroundColor: [
                'rgba(34, 197, 94, 0.8)',   // Verde - reciente
                'rgba(234, 179, 8, 0.8)',   // Amarillo
                'rgba(249, 115, 22, 0.8)',  // Naranja
                'rgba(239, 68, 68, 0.8)',   // Rojo claro
                'rgba(220, 38, 38, 0.8)'    // Rojo oscuro - crítico
              ],
              borderColor: [
                'rgba(34, 197, 94, 1)',
                'rgba(234, 179, 8, 1)',
                'rgba(249, 115, 22, 1)',
                'rgba(239, 68, 68, 1)',
                'rgba(220, 38, 38, 1)'
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

  private createSLAChart(): void {
    this.incidentService.getOpenIncidentsObservable().subscribe(incidents => {
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
    this.incidentService.getOpenIncidentsObservable().subscribe(incidents => {
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
              label: 'Incidentes por Categoría',
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

  private createTrendChart(): void {
    this.incidentService.getOpenIncidentsObservable().subscribe(incidents => {
      const last30Days = this.getLast30Days();
      const dailyCounts = this.getDailyOpenCounts(incidents, last30Days);
      
      const ctx = this.trendChartRef.nativeElement.getContext('2d');
      if (ctx) {
        const chartConfig: ChartConfiguration = {
          type: 'line',
          data: {
            labels: last30Days,
            datasets: [{
              label: 'Incidentes Abiertos',
              data: dailyCounts,
              borderColor: 'rgba(59, 130, 246, 1)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
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

  private calculateAverageAge(incidents: Incident[]): number {
    if (incidents.length === 0) return 0;
    
    const now = new Date();
    const totalAge = incidents.reduce((sum, incident) => {
      const age = Math.floor((now.getTime() - incident.openDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + age;
    }, 0);
    
    return Math.round(totalAge / incidents.length);
  }

  formatDate(date: Date): string {
    if (!date) return '-';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
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

  private getDailyOpenCounts(incidents: Incident[], last30Days: string[]): number[] {
    const counts: number[] = new Array(30).fill(0);
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (29 - i));
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      counts[i] = incidents.filter(incident => {
        const openDate = new Date(incident.openDate);
        openDate.setHours(0, 0, 0, 0);
        return openDate.getTime() === date.getTime();
      }).length;
    }
    
    return counts;
  }

  exportData(format: 'csv' | 'xlsx'): void {
    this.incidentService.getOpenIncidentsObservable().subscribe(incidents => {
      this.exportService.export(incidents, { format, includeFilters: false }, 'incidentes_abiertos');
    });
  }

  ngOnDestroy(): void {
    // Limpiar gráficos al destruir el componente
    this.charts.forEach(chart => chart.destroy());
  }
}
