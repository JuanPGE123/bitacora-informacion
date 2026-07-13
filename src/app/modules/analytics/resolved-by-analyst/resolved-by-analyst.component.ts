import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidentService } from '../../../core/services/incident.service';
import { Incident } from '../../../core/models/incident.model';
import { buildIncidentsTsv } from '../../../core/utils/clipboard-table.util';
import { evaluateIncidentSla, nowInBogota } from '../../../core/utils/business-hours.util';
import { groupByGroupThenAnalyst } from '../../../core/utils/hierarchy.util';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

interface DateBucket {
  date: string;
  incidents: Incident[];
  count: number;
  expanded: boolean;
}

interface AnalystInfo {
  analyst: string;
  count: number;
  dateBuckets: DateBucket[];
  expanded: boolean;
}

interface GroupBucket {
  group: string;
  count: number;
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
  
  groupBuckets: GroupBucket[] = [];
  copiedMessage: string = '';
  private slaNow: Date = nowInBogota();
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
      this.slaNow = nowInBogota();
      const resolvedIncidents = incidents.filter(i => !!i.solutionDate);

      this.groupBuckets = groupByGroupThenAnalyst(resolvedIncidents).map(groupNode => ({
        group: groupNode.group,
        count: groupNode.count,
        expanded: false,
        analysts: groupNode.analysts.map(analystNode => {
          const dateMap = new Map<string, Incident[]>();
          analystNode.incidents.forEach(incident => {
            const date = this.formatDate(incident.solutionDate!);
            if (!dateMap.has(date)) dateMap.set(date, []);
            dateMap.get(date)!.push(incident);
          });

          const dateBuckets: DateBucket[] = Array.from(dateMap.entries())
            .map(([date, incidents]) => ({
              date,
              incidents: incidents.sort((a, b) =>
                (a.incidentNumber || '').localeCompare(b.incidentNumber || '')
              ),
              count: incidents.length,
              expanded: false
            }))
            .sort((a, b) => b.date.localeCompare(a.date)); // fecha más reciente primero

          return {
            analyst: analystNode.analyst,
            count: analystNode.count,
            dateBuckets,
            expanded: false
          };
        })
      }));

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

    // Agrupar por analista (agregado informativo entre todos los grupos)
    const analystCounts = new Map<string, number>();
    this.groupBuckets.forEach(bucket => {
      bucket.analysts.forEach(analystInfo => {
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

    // Agrupar por fecha (agregado informativo entre todos los grupos/analistas)
    const dateCounts = new Map<string, number>();
    this.groupBuckets.forEach(bucket => {
      bucket.analysts.forEach(analystInfo => {
        analystInfo.dateBuckets.forEach(db => {
          dateCounts.set(db.date, (dateCounts.get(db.date) || 0) + db.count);
        });
      });
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

  toggleGroupBucket(bucket: GroupBucket): void {
    bucket.expanded = !bucket.expanded;
  }

  toggleAnalyst(analyst: AnalystInfo): void {
    analyst.expanded = !analyst.expanded;
  }

  toggleDateBucket(bucket: DateBucket): void {
    bucket.expanded = !bucket.expanded;
  }

  copyAnalystIncidents(analyst: AnalystInfo): void {
    const allIncidents = analyst.dateBuckets.flatMap(d => d.incidents);
    const text = this.formatIncidentsForCopy(allIncidents);
    this.copyToClipboard(text, `Incidentes de ${analyst.analyst} copiados (${analyst.count} total)`);
  }

  copyDateBucketIncidents(analyst: AnalystInfo, dateBucket: DateBucket): void {
    const text = this.formatIncidentsForCopy(dateBucket.incidents);
    this.copyToClipboard(text, `Incidentes de ${analyst.analyst} - ${dateBucket.date} copiados`);
  }

  private formatIncidentsForCopy(incidents: Incident[]): string {
    return buildIncidentsTsv(incidents.map(incident => ({
      'No. Incidente': incident.incidentNumber,
      'External Ticket': incident.externalTicket || 'Sin External Ticket',
      'Fecha Apertura': this.formatDate(incident.openDate),
      'Fecha Solución': incident.solutionDate ? this.formatDate(incident.solutionDate) : '-',
      'Analista': incident.assignedAnalyst || 'Sin Asignar',
      'Prioridad': incident.priority,
      'Cumplió ANS': this.getSlaLabel(incident)
    })));
  }

  formatDate(date: Date): string {
    if (!date) return '-';
    const d = new Date(date);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }

  getSlaLabel(incident: Incident): string {
    return evaluateIncidentSla(incident, this.slaNow).meetsSla ? '🟢 Cumple ANS' : '🔴 No cumple ANS';
  }

  getSlaClass(incident: Incident): string {
    return evaluateIncidentSla(incident, this.slaNow).meetsSla ? 'badge-success' : 'badge-danger';
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
