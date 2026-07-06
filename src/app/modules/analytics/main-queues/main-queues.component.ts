import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidentService } from '../../../core/services/incident.service';
import { ExportService } from '../../../core/services/export.service';
import { Incident } from '../../../core/models/incident.model';
import { buildIncidentsTsv } from '../../../core/utils/clipboard-table.util';

@Component({
  selector: 'app-main-queues',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main-queues.component.html',
  styleUrls: ['./main-queues.component.scss']
})
export class MainQueuesComponent implements OnInit {
  mainQueueNames = [
    'Soporte Plataforma Automatización de Procesos',
    'Soporte Aus',
    'Soporte AVA'
  ];
  mainQueuesIncidents: Incident[] = [];
  copiedMessage: string = '';

  constructor(
    private incidentService: IncidentService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.loadMainQueuesData();
  }

  loadMainQueuesData(): void {
    this.incidentService.getOpenIncidentsObservable().subscribe(incidents => {
      this.mainQueuesIncidents = incidents.filter(incident => {
        const group = incident.assignedGroup || '';
        return this.mainQueueNames.some(queueName => group.includes(queueName));
      });
    });
  }

  copyAllIncidents(): void {
    const tsv = buildIncidentsTsv(this.mainQueuesIncidents.map(i => ({
      'No. Incidente': i.incidentNumber,
      'External Ticket': i.externalTicket || 'Sin External Ticket',
      'Fecha Apertura': this.formatDate(i.openDate),
      'Bandeja': i.assignedGroup || '-',
      'Analista': i.assignedAnalyst || '-',
      'Prioridad': i.priority
    })));
    this.copyToClipboard(tsv, `${this.mainQueuesIncidents.length} incidentes copiados`);
  }

  exportToExcel(): void {
    this.exportService.exportToExcel(this.mainQueuesIncidents, 'incidentes_bandejas_principales');
  }

  formatDate(date: Date): string {
    if (!date) return '-';
    const d = new Date(date);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
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
