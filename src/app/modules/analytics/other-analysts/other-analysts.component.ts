import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidentService } from '../../../core/services/incident.service';
import { Incident } from '../../../core/models/incident.model';

@Component({
  selector: 'app-other-analysts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './other-analysts.component.html',
  styleUrls: ['./other-analysts.component.scss']
})
export class OtherAnalystsComponent implements OnInit {
  mainQueueNames = [
    'Soporte Plataforma Automatización de Procesos',
    'Soporte Aus',
    'Soporte AVA'
  ];
  otherAnalystsIncidents: Incident[] = [];
  copiedMessage: string = '';

  constructor(private incidentService: IncidentService) {}

  ngOnInit(): void {
    this.loadOtherAnalystsData();
  }

  loadOtherAnalystsData(): void {
    this.incidentService.getOpenIncidentsObservable().subscribe(incidents => {
      this.otherAnalystsIncidents = incidents.filter(incident => {
        const group = incident.assignedGroup || '';
        return !this.mainQueueNames.some(queueName => group.includes(queueName));
      });
    });
  }

  copyAllIncidents(): void {
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
