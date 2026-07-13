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
  groups: string[] = [];
  analysts: string[] = [];

  searchText: string = '';
  selectedPriority: string = '';
  selectedGroup: string = '';
  selectedAnalyst: string = '';
  selectedStatus: string = '';

  sortField: string = 'solutionDate';
  sortDirection: 'asc' | 'desc' = 'desc';

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

    const uniqueGroups = new Set(incidents.map(i => i.assignedGroup).filter(g => g));
    this.groups = Array.from(uniqueGroups).sort() as string[];
    this.refreshAnalystOptions();

    this.applyFilters();
  }

  /** Recalcula la lista de analistas disponible, restringida al grupo seleccionado (aislamiento) */
  private refreshAnalystOptions(): void {
    const scoped = this.selectedGroup
      ? this.rows.filter(r => r.incident.assignedGroup === this.selectedGroup)
      : this.rows;
    const uniqueAnalysts = new Set(scoped.map(r => r.incident.assignedAnalyst).filter(a => a));
    this.analysts = Array.from(uniqueAnalysts).sort() as string[];

    if (this.selectedAnalyst && !this.analysts.includes(this.selectedAnalyst)) {
      this.selectedAnalyst = '';
    }
  }

  onGroupChange(): void {
    this.refreshAnalystOptions();
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

    if (this.selectedGroup) {
      filtered = filtered.filter(r => r.incident.assignedGroup === this.selectedGroup);
    }

    if (this.selectedAnalyst) {
      filtered = filtered.filter(r => r.incident.assignedAnalyst === this.selectedAnalyst);
    }

    if (this.selectedStatus === 'cumple') {
      filtered = filtered.filter(r => r.meetsSlaComputed);
    } else if (this.selectedStatus === 'incumple') {
      filtered = filtered.filter(r => !r.meetsSlaComputed);
    }

    this.filteredRows = filtered.sort((a, b) => {
      const av = this.getSortValue(a, this.sortField);
      const bv = this.getSortValue(b, this.sortField);
      if (av < bv) return this.sortDirection === 'asc' ? -1 : 1;
      if (av > bv) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  private getSortValue(row: SlaResolvedRow, field: string): number | string {
    switch (field) {
      case 'incidentNumber': return row.incident.incidentNumber || '';
      case 'analyst': return row.incident.assignedAnalyst || '';
      case 'priority': return row.incident.priority || '';
      case 'openDate': return new Date(row.incident.openDate).getTime();
      case 'solutionDate': return new Date(row.incident.solutionDate!).getTime();
      case 'elapsedBusinessHours': return row.elapsedBusinessHours;
      case 'meetsSla': return row.meetsSlaComputed ? 1 : 0;
      default: return '';
    }
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedPriority = '';
    this.selectedGroup = '';
    this.selectedAnalyst = '';
    this.selectedStatus = '';
    this.refreshAnalystOptions();
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
