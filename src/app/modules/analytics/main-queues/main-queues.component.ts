import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidentService } from '../../../core/services/incident.service';
import { ExportService } from '../../../core/services/export.service';
import { Incident } from '../../../core/models/incident.model';

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
    const incidentNumbers = this.mainQueuesIncidents.map(i => i.incidentNumber).join(', ');
    this.copyToClipboard(incidentNumbers, `${this.mainQueuesIncidents.length} números de incidente copiados`);
  }

  exportToExcel(): void {
    this.exportService.exportToExcel(this.mainQueuesIncidents, 'incidentes_bandejas_principales');
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
