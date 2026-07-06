import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidentService } from '../../../core/services/incident.service';
import { ExportService } from '../../../core/services/export.service';
import { Incident, IncidentUrgency } from '../../../core/models/incident.model';
import { buildIncidentsTsv } from '../../../core/utils/clipboard-table.util';
import { evaluateIncidentSla, nowInBogota } from '../../../core/utils/business-hours.util';

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
  
  // Incidentes Urgentes que Cumplen ANS (Crítica y Alta)
  urgentMeetsSLAGroups: AnalystUrgentGroup[] = [];
  urgentMeetsSLACount: number = 0;
  urgentMeetsSLAExpanded: boolean = false;
  
  // Incidentes Reabiertos
  reopenedIncidents: Incident[] = [];
  reopenedCount: number = 0;
  reopenedExpanded: boolean = false;
  
  copiedMessage: string = '';
  private slaNow: Date = nowInBogota();

  constructor(
    private incidentService: IncidentService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.incidentService.getOpenIncidentsObservable().subscribe(incidents => {
      this.slaNow = nowInBogota();
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
    const tsv = buildIncidentsTsv(this.dynatraceIncidents.map(i => ({
      'No. Incidente': i.incidentNumber,
      'External Ticket': i.externalTicket || 'Sin External Ticket',
      'Fecha Apertura': this.formatDate(i.openDate),
      'Analista': i.assignedAnalyst || 'Sin Asignar',
      'Prioridad': i.priority,
      'Estado SLA': this.getSlaLabel(i)
    })));
    this.copyToClipboard(tsv, `${this.dynatraceCount} incidentes copiados`);
  }

  copyTicketGroupIncidents(group: ExternalTicketGroup): void {
    const tsv = buildIncidentsTsv(group.incidents.map(i => ({
      'No. Incidente': i.incidentNumber,
      'Fecha Apertura': this.formatDate(i.openDate),
      'Analista': i.assignedAnalyst || 'Sin Asignar',
      'Prioridad': i.priority,
      'Estado SLA': this.getSlaLabel(i)
    })));
    this.copyToClipboard(tsv, `${group.count} incidentes copiados`);
  }

  copyAnalystUrgentIncidents(group: AnalystUrgentGroup): void {
    const tsv = buildIncidentsTsv(group.incidents.map(i => ({
      'No. Incidente': i.incidentNumber,
      'Urgencia': i.urgency
    })));
    this.copyToClipboard(tsv, `${group.count} incidentes de ${group.analyst} copiados`);
  }

  copyAllUrgentMeetsSLA(): void {
    const allIncidents = this.urgentMeetsSLAGroups.flatMap(g => g.incidents);
    const tsv = buildIncidentsTsv(allIncidents.map(i => ({
      'No. Incidente': i.incidentNumber,
      'Analista': i.assignedAnalyst || 'Sin Asignar',
      'Urgencia': i.urgency
    })));
    this.copyToClipboard(tsv, `${this.urgentMeetsSLACount} incidentes urgentes copiados`);
  }

  copyReopenedIncidents(): void {
    const tsv = buildIncidentsTsv(this.reopenedIncidents.map(i => ({
      'No. Incidente': i.incidentNumber,
      'Analista': i.assignedAnalyst || 'Sin Asignar',
      'Fecha Reapertura': i.reopenDate ? this.formatDate(i.reopenDate) : '-',
      'Fecha Apertura Original': this.formatDate(i.openDate),
      'Urgencia': i.urgency,
      'Prioridad': i.priority,
      'Estado SLA': this.getSlaLabel(i)
    })));
    this.copyToClipboard(tsv, `${this.reopenedCount} incidentes reabiertos copiados`);
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
      ...this.dynatraceIncidents
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
