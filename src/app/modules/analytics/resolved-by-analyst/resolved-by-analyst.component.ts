import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidentService } from '../../../core/services/incident.service';
import { Incident } from '../../../core/models/incident.model';

interface AnalystDateGroup {
  analyst: string;
  date: string;
  count: number;
  incidents: Incident[];
  expanded: boolean;
}

@Component({
  selector: 'app-resolved-by-analyst',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resolved-by-analyst.component.html',
  styleUrls: ['./resolved-by-analyst.component.scss']
})
export class ResolvedByAnalystComponent implements OnInit {
  analystDateGroups: AnalystDateGroup[] = [];
  copiedMessage: string = '';

  constructor(private incidentService: IncidentService) {}

  ngOnInit(): void {
    this.loadAnalystDateGroups();
  }

  loadAnalystDateGroups(): void {
    this.incidentService.getResolvedIncidentsObservable().subscribe(incidents => {
      const groups = new Map<string, Incident[]>();
      
      incidents.forEach(incident => {
        if (incident.closeDate) {
          const analyst = incident.assignedAnalyst || 'Sin Asignar';
          const date = this.formatDate(incident.closeDate);
          const key = `${analyst}|${date}`;
          
          if (!groups.has(key)) {
            groups.set(key, []);
          }
          groups.get(key)!.push(incident);
        }
      });

      this.analystDateGroups = Array.from(groups.entries())
        .map(([key, incidents]) => {
          const [analyst, date] = key.split('|');
          return {
            analyst,
            date,
            count: incidents.length,
            incidents: incidents.sort((a, b) => 
              (a.incidentNumber || '').localeCompare(b.incidentNumber || '')
            ),
            expanded: false
          };
        })
        .sort((a, b) => {
          // Ordenar por analista y luego por fecha (más reciente primero)
          if (a.analyst !== b.analyst) {
            return a.analyst.localeCompare(b.analyst);
          }
          return b.date.localeCompare(a.date);
        });
    });
  }

  toggleGroup(group: AnalystDateGroup): void {
    group.expanded = !group.expanded;
  }

  copyGroupIncidents(group: AnalystDateGroup): void {
    const text = this.formatIncidentsForCopy(group.incidents);
    this.copyToClipboard(text, `Incidentes de ${group.analyst} - ${group.date} copiados`);
  }

  private formatIncidentsForCopy(incidents: Incident[]): string {
    let text = '| No. Incidente | External Ticket | Fecha Apertura | Fecha Cierre | Analista |\n';
    text += '|---------------|-----------------|----------------|--------------|----------|\n';
    incidents.forEach(incident => {
      const ticket = incident.externalTicket || 'Sin External Ticket';
      const openDate = this.formatDate(incident.openDate);
      const closeDate = incident.closeDate ? this.formatDate(incident.closeDate) : '-';
      const analyst = incident.assignedAnalyst || 'Sin Asignar';
      text += `| ${incident.incidentNumber} | ${ticket} | ${openDate} | ${closeDate} | ${analyst} |\n`;
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
