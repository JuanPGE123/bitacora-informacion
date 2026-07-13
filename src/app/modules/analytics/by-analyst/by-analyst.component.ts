import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidentService } from '../../../core/services/incident.service';
import { ExportService } from '../../../core/services/export.service';
import { Incident } from '../../../core/models/incident.model';
import { buildIncidentsTsv } from '../../../core/utils/clipboard-table.util';
import { evaluateIncidentSla, nowInBogota } from '../../../core/utils/business-hours.util';
import { groupByGroupThenAnalyst } from '../../../core/utils/hierarchy.util';

interface AnalystGroup {
  analyst: string;
  incidents: Incident[];
  count: number;
  expanded: boolean;
}

interface GroupBucket {
  group: string;
  analystGroups: AnalystGroup[];
  count: number;
  expanded: boolean;
}

@Component({
  selector: 'app-by-analyst',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './by-analyst.component.html',
  styleUrls: ['./by-analyst.component.scss']
})
export class ByAnalystComponent implements OnInit {
  groupBuckets: GroupBucket[] = [];
  copiedMessage: string = '';
  private slaNow: Date = nowInBogota();

  constructor(
    private incidentService: IncidentService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.loadAnalystGroups();
  }

  /** Todos los analistas de todos los grupos, aplanado para acciones globales */
  get allAnalystGroups(): AnalystGroup[] {
    return this.groupBuckets.flatMap(g => g.analystGroups);
  }

  loadAnalystGroups(): void {
    this.incidentService.getOpenIncidentsObservable().subscribe(incidents => {
      this.slaNow = nowInBogota();

      this.groupBuckets = groupByGroupThenAnalyst(incidents).map(groupNode => ({
        group: groupNode.group,
        count: groupNode.count,
        expanded: false,
        analystGroups: groupNode.analysts.map(analystNode => ({
          analyst: analystNode.analyst,
          incidents: analystNode.incidents.sort((a, b) =>
            new Date(a.openDate).getTime() - new Date(b.openDate).getTime()
          ),
          count: analystNode.count,
          expanded: false
        }))
      }));
    });
  }

  toggleGroupBucket(bucket: GroupBucket): void {
    bucket.expanded = !bucket.expanded;
  }

  toggleAnalystGroup(group: AnalystGroup): void {
    group.expanded = !group.expanded;
  }

  copyAnalystIncidents(group: AnalystGroup): void {
    const tsv = buildIncidentsTsv(group.incidents.map(i => ({
      'No. Incidente': i.incidentNumber,
      'External Ticket': i.externalTicket || 'Sin External Ticket',
      'Fecha Apertura': this.formatDate(i.openDate),
      'Prioridad': i.priority,
      'Estado SLA': this.getSlaLabel(i)
    })));
    this.copyToClipboard(tsv, `${group.count} incidentes copiados`);
  }

  exportAnalystToExcel(group: AnalystGroup): void {
    this.exportService.exportToExcel(group.incidents, `incidentes_${group.analyst.replace(/\s+/g, '_')}`);
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
    return evaluateIncidentSla(incident, this.slaNow).meetsSla ? '🟢 A tiempo' : '🔴 Vencido';
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
