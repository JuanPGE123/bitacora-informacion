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
