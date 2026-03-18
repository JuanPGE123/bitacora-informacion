import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { IncidentService } from '../../../core/services/incident.service';
import { NotionService, AnalystNotionData } from '../../../core/services/notion.service';
import { ExportService } from '../../../core/services/export.service';
import { Incident, IncidentPriority } from '../../../core/models/incident.model';

interface AnalystGroup {
  analyst: string;
  incidents: Incident[];
  count: number;
  expanded: boolean;
}

@Component({
  selector: 'app-by-analyst',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './by-analyst.component.html',
  styleUrls: ['./by-analyst.component.scss']
})
export class ByAnalystComponent implements OnInit {
  analystGroups: AnalystGroup[] = [];
  copiedMessage: string = '';
  isSyncingNotion: boolean = false;

  constructor(
    private incidentService: IncidentService,
    private notionService: NotionService,
    private exportService: ExportService
  ) {}

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
    const incidentNumbers = group.incidents.map(i => i.incidentNumber).join(', ');
    this.copyToClipboard(incidentNumbers, `${group.count} números de incidente copiados`);
  }

  exportAnalystToExcel(group: AnalystGroup): void {
    this.exportService.exportToExcel(group.incidents, `incidentes_${group.analyst.replace(/\s+/g, '_')}`);
  }

  migrateToNotion(): void {
    if (this.isSyncingNotion) return;

    this.isSyncingNotion = true;
    this.copiedMessage = '⏳ Migrando a Notion...';

    const analystsData: AnalystNotionData[] = this.analystGroups.map(group => {
      const priorityCounts = this.getPriorityCounts(group.incidents);
      return {
        analyst: group.analyst,
        totalIncidents: group.count,
        critical: priorityCounts.critical,
        high: priorityCounts.high,
        medium: priorityCounts.medium,
        low: priorityCounts.low,
        incidents: group.incidents.map(i => i.incidentNumber || '')
      };
    });

    this.notionService.syncAnalystsToNotion(analystsData).subscribe({
      next: (response) => {
        this.isSyncingNotion = false;
        this.copiedMessage = `✅ ${response.message}`;
        setTimeout(() => {
          this.copiedMessage = '';
        }, 5000);
      },
      error: (error) => {
        this.isSyncingNotion = false;
        console.error('Error al migrar a Notion:', error);
        this.copiedMessage = '❌ Error al migrar a Notion. Verifica la consola.';
        setTimeout(() => {
          this.copiedMessage = '';
        }, 5000);
      }
    });
  }

  private getPriorityCounts(incidents: Incident[]): { critical: number, high: number, medium: number, low: number } {
    return {
      critical: incidents.filter(i => i.priority === IncidentPriority.CRITICAL).length,
      high: incidents.filter(i => i.priority === IncidentPriority.HIGH).length,
      medium: incidents.filter(i => i.priority === IncidentPriority.MEDIUM).length,
      low: incidents.filter(i => i.priority === IncidentPriority.LOW).length
    };
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
