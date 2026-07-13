import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidentService } from '../../../core/services/incident.service';
import { ExportService } from '../../../core/services/export.service';
import { Incident } from '../../../core/models/incident.model';
import { buildIncidentsTsv } from '../../../core/utils/clipboard-table.util';
import { evaluateIncidentSla, nowInBogota } from '../../../core/utils/business-hours.util';
import { groupByGroupThenAnalyst, GroupNode } from '../../../core/utils/hierarchy.util';
import { GroupAnalystTreeComponent } from '../../../shared/components/group-analyst-tree/group-analyst-tree.component';

@Component({
  selector: 'app-other-analysts',
  standalone: true,
  imports: [CommonModule, GroupAnalystTreeComponent],
  templateUrl: './other-analysts.component.html',
  styleUrls: ['./other-analysts.component.scss']
})
export class OtherAnalystsComponent implements OnInit {
  /** Nombres exactos de bandeja "principales" a excluir (comparación exacta, no substring) */
  mainQueueNames = [
    'Soporte Plataforma Automatización de Procesos',
    'Soporte Aus',
    'Soporte AVA'
  ];
  otherAnalystsIncidents: Incident[] = [];
  groups: GroupNode[] = [];
  copiedMessage: string = '';
  private slaNow: Date = nowInBogota();

  constructor(
    private incidentService: IncidentService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.loadOtherAnalystsData();
  }

  loadOtherAnalystsData(): void {
    this.incidentService.getOpenIncidentsObservable().subscribe(incidents => {
      this.slaNow = nowInBogota();
      this.otherAnalystsIncidents = incidents.filter(incident =>
        !this.mainQueueNames.includes((incident.assignedGroup || '').trim())
      );
      this.groups = groupByGroupThenAnalyst(this.otherAnalystsIncidents);
    });
  }

  copyAllIncidents(): void {
    const tsv = buildIncidentsTsv(this.otherAnalystsIncidents.map(i => ({
      'No. Incidente': i.incidentNumber,
      'External Ticket': i.externalTicket || 'Sin External Ticket',
      'Fecha Apertura': this.formatDate(i.openDate),
      'Bandeja': i.assignedGroup || '-',
      'Analista': i.assignedAnalyst || '-',
      'Prioridad': i.priority,
      'Estado SLA': this.getSlaLabel(i)
    })));
    this.copyToClipboard(tsv, `${this.otherAnalystsIncidents.length} incidentes copiados`);
  }

  exportToExcel(): void {
    this.exportService.exportToExcel(this.otherAnalystsIncidents, 'incidentes_otros_analistas');
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
