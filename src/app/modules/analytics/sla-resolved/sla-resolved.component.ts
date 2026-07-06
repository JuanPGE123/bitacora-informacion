import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncidentService } from '../../../core/services/incident.service';
import { ExportService } from '../../../core/services/export.service';
import { Incident, IncidentPriority } from '../../../core/models/incident.model';
import { businessHoursBetween, formatHoursDuration, SLA_HOURS_BY_PRIORITY } from '../../../core/utils/business-hours.util';
import { buildIncidentsTsv } from '../../../core/utils/clipboard-table.util';

interface SlaResolvedRow {
  incident: Incident;
  elapsedBusinessHours: number;
  thresholdHours: number;
  meetsSlaComputed: boolean;
}

@Component({
  selector: 'app-sla-resolved',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sla-resolved.component.html',
  styleUrls: ['./sla-resolved.component.scss']
})
export class SlaResolvedComponent implements OnInit {
  rows: SlaResolvedRow[] = [];
  filteredRows: SlaResolvedRow[] = [];

  priorities: IncidentPriority[] = Object.values(IncidentPriority);
  analysts: string[] = [];

  searchText: string = '';
  selectedPriority: string = '';
  selectedAnalyst: string = '';
  selectedStatus: string = '';

  totalCount = 0;
  meetsCount = 0;
  missesCount = 0;
  compliancePercentage = 0;

  copiedMessage: string = '';

  constructor(
    private incidentService: IncidentService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.incidentService.getResolvedIncidentsObservable().subscribe(incidents => {
      this.buildRows(incidents.filter(i => !!i.solutionDate));
    });
  }

  private buildRows(incidents: Incident[]): void {
    this.rows = incidents.map(incident => {
      const elapsedBusinessHours = businessHoursBetween(incident.openDate, incident.solutionDate!);
      const thresholdHours = SLA_HOURS_BY_PRIORITY[incident.priority] ?? SLA_HOURS_BY_PRIORITY[IncidentPriority.MEDIUM];
      return {
        incident,
        elapsedBusinessHours,
        thresholdHours,
        meetsSlaComputed: elapsedBusinessHours < thresholdHours
      };
    });

    this.totalCount = this.rows.length;
    this.meetsCount = this.rows.filter(r => r.meetsSlaComputed).length;
    this.missesCount = this.totalCount - this.meetsCount;
    this.compliancePercentage = this.totalCount === 0 ? 0 : Math.round((this.meetsCount / this.totalCount) * 100);

    const uniqueAnalysts = new Set(incidents.map(i => i.assignedAnalyst).filter(a => a));
    this.analysts = Array.from(uniqueAnalysts).sort() as string[];

    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.rows];

    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(r =>
        r.incident.incidentNumber.toLowerCase().includes(search) ||
        r.incident.assignedAnalyst?.toLowerCase().includes(search)
      );
    }

    if (this.selectedPriority) {
      filtered = filtered.filter(r => r.incident.priority === this.selectedPriority);
    }

    if (this.selectedAnalyst) {
      filtered = filtered.filter(r => r.incident.assignedAnalyst === this.selectedAnalyst);
    }

    if (this.selectedStatus === 'cumple') {
      filtered = filtered.filter(r => r.meetsSlaComputed);
    } else if (this.selectedStatus === 'incumple') {
      filtered = filtered.filter(r => !r.meetsSlaComputed);
    }

    this.filteredRows = filtered.sort((a, b) =>
      new Date(b.incident.solutionDate!).getTime() - new Date(a.incident.solutionDate!).getTime()
    );
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedPriority = '';
    this.selectedAnalyst = '';
    this.selectedStatus = '';
    this.applyFilters();
  }

  formatDate(date: Date): string {
    if (!date) return '-';
    const d = new Date(date);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }

  formatDuration(hours: number): string {
    return formatHoursDuration(hours);
  }

  private buildExportRows(): Record<string, string | number>[] {
    return this.filteredRows.map(r => ({
      'No. Incidente': r.incident.incidentNumber,
      'Analista': r.incident.assignedAnalyst || 'Sin Asignar',
      'Prioridad': r.incident.priority,
      'Fecha Apertura': this.formatDate(r.incident.openDate),
      'Fecha Solución': this.formatDate(r.incident.solutionDate!),
      'Horas Hábiles Transcurridas': r.elapsedBusinessHours.toFixed(2),
      'Cumplió ANS': r.meetsSlaComputed ? 'Sí' : 'No'
    }));
  }

  copyToClipboardTable(): void {
    const tsv = buildIncidentsTsv(this.buildExportRows());
    this.copyToClipboard(tsv, `${this.filteredRows.length} incidentes copiados`);
  }

  exportToExcel(): void {
    this.exportService.exportRowsToExcel(this.buildExportRows(), 'sla_ans_resueltos');
  }

  private copyToClipboard(text: string, message: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.copiedMessage = message;
      setTimeout(() => { this.copiedMessage = ''; }, 3000);
    }).catch(err => {
      console.error('Error al copiar:', err);
      this.copiedMessage = 'Error al copiar';
      setTimeout(() => { this.copiedMessage = ''; }, 3000);
    });
  }
}
