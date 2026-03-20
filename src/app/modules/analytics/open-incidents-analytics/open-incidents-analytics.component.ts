import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidentService } from '../../../core/services/incident.service';
import { ExportService } from '../../../core/services/export.service';
import { Incident, IncidentUrgency } from '../../../core/models/incident.model';

interface ExternalTicketGroup {
  ticketName: string;
  count: number;
  incidents: Incident[];
  expanded: boolean;
}

interface AnalystUrgentGroup {
  analyst: string;
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
  
  // Incidentes Urgentes que Cumplen ANS (Crítica y Alta)
  urgentMeetsSLAGroups: AnalystUrgentGroup[] = [];
  urgentMeetsSLACount: number = 0;
  urgentMeetsSLAExpanded: boolean = false;
  
  // Incidentes Reabiertos
  reopenedIncidents: Incident[] = [];
  reopenedCount: number = 0;
  reopenedExpanded: boolean = false;
  
  copiedMessage: string = '';

  constructor(
    private incidentService: IncidentService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.incidentService.getOpenIncidentsObservable().subscribe(incidents => {
      // 1. Contadores de External Ticket
      this.incidentsWithExternalTicket = incidents.filter(i => i.externalTicket && i.externalTicket.trim() !== '').length;
      this.incidentsWithoutExternalTicket = incidents.filter(i => !i.externalTicket || i.externalTicket.trim() === '').length;
      
      // 2. Agrupar por External Ticket (incluyendo los que no tienen)
      const ticketGroups = new Map<string, Incident[]>();
      incidents.forEach(incident => {
        const ticket = incident.externalTicket?.trim() || 'Sin External Ticket';
        if (!ticketGroups.has(ticket)) {
          ticketGroups.set(ticket, []);
        }
        ticketGroups.get(ticket)!.push(incident);
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
      
      // 5. Filtrar incidentes urgentes (Crítica y Alta) que cumplen ANS, agrupar por analista
      const urgentMeetsSLA = incidents.filter(i => 
        (i.urgency === IncidentUrgency.CRITICAL || i.urgency === IncidentUrgency.HIGH) && 
        i.meetsSla === true
      );
      
      const analystGroups = new Map<string, Incident[]>();
      urgentMeetsSLA.forEach(incident => {
        const analyst = incident.assignedAnalyst || 'Sin Asignar';
        if (!analystGroups.has(analyst)) {
          analystGroups.set(analyst, []);
        }
        analystGroups.get(analyst)!.push(incident);
      });
      
      this.urgentMeetsSLAGroups = Array.from(analystGroups.entries())
        .map(([analyst, incidents]) => ({
          analyst,
          count: incidents.length,
          incidents: incidents.sort((a, b) => 
            (a.incidentNumber || '').localeCompare(b.incidentNumber || '')
          ),
          expanded: false
        }))
        .sort((a, b) => b.count - a.count);
      
      this.urgentMeetsSLACount = urgentMeetsSLA.length;
      
      // 6. Filtrar incidentes reabiertos
      this.reopenedIncidents = incidents.filter(i => 
        i.reopenDate !== undefined && i.reopenDate !== null
      ).sort((a, b) => {
        const dateA = new Date(a.reopenDate!).getTime();
        const dateB = new Date(b.reopenDate!).getTime();
        return dateB - dateA; // Más recientes primero
      });
      this.reopenedCount = this.reopenedIncidents.length;
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

  toggleUrgentMeetsSLA(): void {
    this.urgentMeetsSLAExpanded = !this.urgentMeetsSLAExpanded;
  }

  toggleAnalystUrgentGroup(group: AnalystUrgentGroup): void {
    group.expanded = !group.expanded;
  }

  toggleReopened(): void {
    this.reopenedExpanded = !this.reopenedExpanded;
  }

  copyDynatraceIncidents(): void {
    const incidentNumbers = this.dynatraceIncidents.map(i => i.incidentNumber).join(', ');
    this.copyToClipboard(incidentNumbers, `${this.dynatraceCount} números de incidente copiados`);
  }

  copyHighSLAIncidents(): void {
    const incidentNumbers = this.highSLAIncidents.map(i => i.incidentNumber).join(', ');
    this.copyToClipboard(incidentNumbers, `${this.highSLACount} números de incidente copiados`);
  }

  copyTicketGroupIncidents(group: ExternalTicketGroup): void {
    const incidentNumbers = group.incidents.map(i => i.incidentNumber).join(', ');
    this.copyToClipboard(incidentNumbers, `${group.count} números de incidente copiados`);
  }

  copyAnalystUrgentIncidents(group: AnalystUrgentGroup): void {
    const incidentList = group.incidents.map(i => i.incidentNumber).join('\n');
    this.copyToClipboard(incidentList, `${group.count} incidentes de ${group.analyst} copiados`);
  }

  copyAllUrgentMeetsSLA(): void {
    const allIncidents = this.urgentMeetsSLAGroups.flatMap(g => g.incidents);
    const incidentList = allIncidents.map(i => i.incidentNumber).join('\n');
    this.copyToClipboard(incidentList, `${this.urgentMeetsSLACount} incidentes urgentes copiados`);
  }

  copyReopenedIncidents(): void {
    const incidentList = this.reopenedIncidents.map(i => i.incidentNumber).join('\n');
    this.copyToClipboard(incidentList, `${this.reopenedCount} incidentes reabiertos copiados`);
  }

  // Métodos de exportación Excel
  exportTicketGroupsToExcel(): void {
    const allIncidents: Incident[] = [];
    this.externalTicketGroups.forEach(group => {
      allIncidents.push(...group.incidents);
    });
    this.exportService.exportToExcel(allIncidents, 'incidentes_por_external_ticket');
  }

  exportDynatraceToExcel(): void {
    this.exportService.exportToExcel(this.dynatraceIncidents, 'incidentes_dynatrace');
  }

  exportHighSLAToExcel(): void {
    this.exportService.exportToExcel(this.highSLAIncidents, 'incidentes_ans_alto');
  }

  exportUrgentMeetsSLAToExcel(): void {
    const allIncidents = this.urgentMeetsSLAGroups.flatMap(g => g.incidents);
    this.exportService.exportToExcel(allIncidents, 'incidentes_urgentes_cumplen_ans');
  }

  exportReopenedToExcel(): void {
    this.exportService.exportToExcel(this.reopenedIncidents, 'incidentes_reabiertos');
  }

  exportAllSectionsToExcel(): void {
    const allIncidents = [
      ...this.externalTicketGroups.flatMap(g => g.incidents),
      ...this.dynatraceIncidents,
      ...this.highSLAIncidents
    ];
    // Eliminar duplicados
    const unique = Array.from(new Set(allIncidents.map(i => i.incidentNumber)))
      .map(number => allIncidents.find(i => i.incidentNumber === number)!);
    this.exportService.exportToExcel(unique, 'analisis_abiertos_completo');
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
