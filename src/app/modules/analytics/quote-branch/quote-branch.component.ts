import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncidentService } from '../../../core/services/incident.service';
import { Incident } from '../../../core/models/incident.model';

interface QuoteBranch {
  branch: string;
  incidents: Incident[];
  count: number;
  expanded: boolean;
}

@Component({
  selector: 'app-quote-branch',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './quote-branch.component.html',
  styleUrls: ['./quote-branch.component.scss']
})
export class QuoteBranchComponent implements OnInit {
  quoteBranches: QuoteBranch[] = [];
  copiedMessage: string = '';

  constructor(private incidentService: IncidentService) {}

  ngOnInit(): void {
    this.loadQuoteBranchData();
  }

  loadQuoteBranchData(): void {
    this.incidentService.getOpenIncidentsObservable().subscribe(incidents => {
      // Filtrar incidentes que NO sean de Soporte Aus o Soporte AVA
      const validIncidents = incidents.filter(incident => {
        const group = incident.assignedGroup || '';
        const analyst = incident.assignedAnalyst || '';
        return !group.toUpperCase().includes('AVA') && 
               !group.toUpperCase().includes('AUS') &&
               !analyst.toUpperCase().includes('AVA') &&
               !analyst.toUpperCase().includes('AUS');
      });

      const branches = new Map<string, Incident[]>();

      validIncidents.forEach(incident => {
        const description = incident.description || '';
        let branch = 'Otros';

        // Buscar códigos numéricos en la descripción
        if (description.includes('040') || description.includes('900') || description.includes('800')) {
          branch = 'Incidentes Cotizador Autos';
        } else if (description.includes('080') || description.includes('081')) {
          branch = 'Incidentes Cotizador Plan Vive/PCP';
        } else if (description.includes('083') || description.includes('099')) {
          branch = 'Incidentes Cotizador Vida Grupo PES / Ingreso Digital';
        } else if (description.includes('084')) {
          branch = 'Incidentes Cotizador Accidentes Personales';
        } else if (description.includes('090')) {
          branch = 'Incidentes Cotizador Salud';
        } else if (description.includes('193')) {
          branch = 'Incidentes Cotizador Pensión';
        } else if (description.includes('196')) {
          branch = 'Incidentes Cotizador Educación';
        }

        if (!branches.has(branch)) {
          branches.set(branch, []);
        }
        branches.get(branch)!.push(incident);
      });

      this.quoteBranches = Array.from(branches.entries())
        .map(([branch, incidents]) => ({
          branch,
          incidents: incidents.sort((a, b) => 
            new Date(a.openDate).getTime() - new Date(b.openDate).getTime()
          ),
          count: incidents.length,
          expanded: false
        }))
        .sort((a, b) => b.count - a.count);
    });
  }

  toggleQuoteBranch(branch: QuoteBranch): void {
    branch.expanded = !branch.expanded;
  }

  copyBranchIncidents(branch: QuoteBranch): void {
    const text = this.formatIncidentsForCopy(branch.incidents);
    this.copyToClipboard(text, `Incidentes de ${branch.branch} copiados`);
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
