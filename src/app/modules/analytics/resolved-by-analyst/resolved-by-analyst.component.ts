import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidentService } from '../../../core/services/incident.service';
import { Incident } from '../../../core/models/incident.model';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

interface AnalystInfo {
  analyst: string;
  count: number;
  incidents: Incident[];
  expanded: boolean;
}

interface DateGroup {
  date: string;
  totalCount: number;
  analysts: AnalystInfo[];
  expanded: boolean;
}

@Component({
  selector: 'app-resolved-by-analyst',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resolved-by-analyst.component.html',
  styleUrls: ['./resolved-by-analyst.component.scss']
})
export class ResolvedByAnalystComponent implements OnInit, AfterViewInit {
  @ViewChild('analystChart') analystChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dateChart') dateChartRef!: ElementRef<HTMLCanvasElement>;
  
  dateGroups: DateGroup[] = [];
  copiedMessage: string = '';
  private analystChart: Chart | null = null;
  private dateChart: Chart | null = null;

  constructor(private incidentService: IncidentService) {}

  ngOnInit(): void {
    this.loadAnalystDateGroups();
  }

  ngAfterViewInit(): void {
    // Las gráficas se crearán después de cargar los datos
  }

  loadAnalystDateGroups(): void {
    this.incidentService.getResolvedIncidentsObservable().subscribe(incidents => {
      // Primer agrupamiento: por fecha
      const dateMap = new Map<string, Map<string, Incident[]>>();
      
      incidents.forEach(incident => {
        if (incident.solutionDate) {
          const date = this.formatDate(incident.solutionDate);
          const analyst = incident.assignedAnalyst || 'Sin Asignar';
          
          if (!dateMap.has(date)) {
            dateMap.set(date, new Map<string, Incident[]>());
          }
          
          const analystMap = dateMap.get(date)!;
          if (!analystMap.has(analyst)) {
            analystMap.set(analyst, []);
          }
          
          analystMap.get(analyst)!.push(incident);
        }
      });

      // Convertir a estructura DateGroup
      this.dateGroups = Array.from(dateMap.entries())
        .map(([date, analystMap]) => {
          const analysts: AnalystInfo[] = Array.from(analystMap.entries())
            .map(([analyst, incidents]) => ({
              analyst,
              count: incidents.length,
              incidents: incidents.sort((a, b) => 
                (a.incidentNumber || '').localeCompare(b.incidentNumber || '')
              ),
              expanded: false
            }))
            .sort((a, b) => b.count - a.count); // Ordenar analistas por cantidad (mayor primero)
          
          const totalCount = analysts.reduce((sum, a) => sum + a.count, 0);
          
          return {
            date,
            totalCount,
            analysts,
            expanded: false
          };
        })
        .sort((a, b) => b.date.localeCompare(a.date)); // Ordenar fechas (más reciente primero)
      
      // Crear gráficas después de cargar los datos
      setTimeout(() => this.createCharts(), 100);
    });
  }

  private createCharts(): void {
    this.createAnalystChart();
    this.createDateChart();
  }

  private createAnalystChart(): void {
    if (!this.analystChartRef) return;

    // Agrupar por analista
    const analystCounts = new Map<string, number>();
    this.dateGroups.forEach(dateGroup => {
      dateGroup.analysts.forEach(analystInfo => {
        const current = analystCounts.get(analystInfo.analyst) || 0;
        analystCounts.set(analystInfo.analyst, current + analystInfo.count);
      });
    });

    const sortedAnalysts = Array.from(analystCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Top 10 analistas

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: sortedAnalysts.map(([analyst]) => analyst),
        datasets: [{
          label: 'Incidentes Resueltos',
          data: sortedAnalysts.map(([, count]) => count),
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgba(16, 185, 129, 1)',
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
            text: 'Top 10 Analistas por Incidentes Resueltos'
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

    if (this.analystChart) {
      this.analystChart.destroy();
    }
    this.analystChart = new Chart(this.analystChartRef.nativeElement, config);
  }

  private createDateChart(): void {
    if (!this.dateChartRef) return;

    // Agrupar por fecha
    const dateCounts = new Map<string, number>();
    this.dateGroups.forEach(group => {
      dateCounts.set(group.date, group.totalCount);
    });

    const sortedDates = Array.from(dateCounts.entries())
      .sort((a, b) => {
        const [dayA, monthA, yearA] = a[0].split('/').map(Number);
        const [dayB, monthB, yearB] = b[0].split('/').map(Number);
        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 15); // Últimas 15 fechas

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: sortedDates.map(([date]) => date).reverse(),
        datasets: [{
          label: 'Incidentes Resueltos',
          data: sortedDates.map(([, count]) => count).reverse(),
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
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
            text: 'Tendencia de Resolución por Fecha'
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

    if (this.dateChart) {
      this.dateChart.destroy();
    }
    this.dateChart = new Chart(this.dateChartRef.nativeElement, config);
  }

  toggleDateGroup(group: DateGroup): void {
    group.expanded = !group.expanded;
  }

  toggleAnalyst(analyst: AnalystInfo): void {
    analyst.expanded = !analyst.expanded;
  }

  copyDateGroupIncidents(group: DateGroup): void {
    const allIncidents = group.analysts.flatMap(a => a.incidents);
    const text = this.formatIncidentsForCopy(allIncidents);
    this.copyToClipboard(text, `Incidentes del ${group.date} copiados (${group.totalCount} total)`);
  }

  copyAnalystIncidents(analyst: AnalystInfo, date: string): void {
    const text = this.formatIncidentsForCopy(analyst.incidents);
    this.copyToClipboard(text, `Incidentes de ${analyst.analyst} - ${date} copiados`);
  }

  private formatIncidentsForCopy(incidents: Incident[]): string {
    let text = '| No. Incidente | External Ticket | Fecha Apertura | Fecha Solución | Analista |\n';
    text += '|---------------|-----------------|----------------|----------------|----------|\n';
    incidents.forEach(incident => {
      const ticket = incident.externalTicket || 'Sin External Ticket';
      const openDate = this.formatDate(incident.openDate);
      const solutionDate = incident.solutionDate ? this.formatDate(incident.solutionDate) : '-';
      const analyst = incident.assignedAnalyst || 'Sin Asignar';
      text += `| ${incident.incidentNumber} | ${ticket} | ${openDate} | ${solutionDate} | ${analyst} |\n`;
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
