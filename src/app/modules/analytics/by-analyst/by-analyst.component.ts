import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidentService } from '../../../core/services/incident.service';
import { Incident } from '../../../core/models/incident.model';

interface AnalystGroup {
  analyst: string;
  incidents: Incident[];
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
  analystGroups: AnalystGroup[] = [];
  copiedMessage: string = '';

  constructor(private incidentService: IncidentService) {}

  ngOnInit(): void {
    this.loadAnalystGroups();
  }

  loadAnalystGroups(): void {
    this.incidentService.getOpenIncidentsObservable().subscribe(incidents => {
      const groups = new Map<string, Incident[]>();
      
      incidents.forEach(incident => {
        const analyst = incident.assignedAnalyst || 'Sin Asignar';
        if (!groups.has(analyst)) {
          groups.set(analyst, []);
        }
        groups.get(analyst)!.push(incident);
      });

      this.analystGroups = Array.from(groups.entries())
        .map(([analyst, incidents]) => ({
          analyst,
          incidents: incidents.sort((a, b) => 
            new Date(a.openDate).getTime() - new Date(b.openDate).getTime()
          ),
          count: incidents.length,
          expanded: false
        }))
        .sort((a, b) => b.count - a.count);
    });
  }

  toggleAnalystGroup(group: AnalystGroup): void {
    group.expanded = !group.expanded;
  }

  copyAnalystIncidents(group: AnalystGroup): void {
    const text = this.formatIncidentsForCopy(group.incidents);
    this.copyToClipboard(text, `Incidentes de ${group.analyst} copiados`);
  }

  private formatIncidentsForCopy(incidents: Incident[]): string {
    let text = '| No. Incidente | External Ticket | Fecha Apertura | Analista |\n';
    text += '|---------------|-----------------|----------------|----------|\n';
    incidents.forEach(incident => {
      const ticket = incident.externalTicket || 'Sin External Ticket';
      const date = this.formatDate(incident.openDate);
      const analyst = incident.assignedAnalyst || 'Sin Asignar';
      text += `| ${incident.incidentNumber} | ${ticket} | ${date} | ${analyst} |\n`;
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
