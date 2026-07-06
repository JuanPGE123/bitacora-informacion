import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IncidentService } from '../../../core/services/incident.service';
import { ExportService } from '../../../core/services/export.service';
import { Incident, IncidentPriority } from '../../../core/models/incident.model';
import { businessHoursBetween, formatHoursDuration, nowInBogota, SLA_HOURS_BY_PRIORITY } from '../../../core/utils/business-hours.util';
import { buildIncidentsTsv } from '../../../core/utils/clipboard-table.util';

interface SlaOpenRow {
  incident: Incident;
  elapsedBusinessHours: number;
  thresholdHours: number;
  remainingHours: number;
  isOverdue: boolean;
}

const AUTO_REFRESH_MS = 60000;

@Component({
  selector: 'app-sla-open',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sla-open.component.html',
  styleUrls: ['./sla-open.component.scss']
})
export class SlaOpenComponent implements OnInit, OnDestroy {
  rows: SlaOpenRow[] = [];
  filteredRows: SlaOpenRow[] = [];

  priorities: IncidentPriority[] = Object.values(IncidentPriority);
  analysts: string[] = [];

  searchText: string = '';
  selectedPriority: string = '';
  selectedAnalyst: string = '';
  selectedStatus: string = '';

  totalCount = 0;
  overdueCount = 0;
  onTimeCount = 0;

  copiedMessage: string = '';
  lastUpdated: Date = new Date();

  private refreshHandle: ReturnType<typeof setInterval> | null = null;

  constructor(
    private incidentService: IncidentService,
    private exportService: ExportService
  ) {}

  ngOnInit(): void {
    this.incidentService.getOpenIncidentsObservable().subscribe(incidents => {
      this.buildRows(incidents);
    });

    this.refreshHandle = setInterval(() => this.buildRows(this.rows.map(r => r.incident)), AUTO_REFRESH_MS);
  }

  ngOnDestroy(): void {
    if (this.refreshHandle) clearInterval(this.refreshHandle);
  }

  private buildRows(incidents: Incident[]): void {
    const now = nowInBogota();
    this.rows = incidents.map(incident => {
      const elapsedBusinessHours = businessHoursBetween(incident.openDate, now);
      const thresholdHours = SLA_HOURS_BY_PRIORITY[incident.priority] ?? SLA_HOURS_BY_PRIORITY[IncidentPriority.MEDIUM];
      const remainingHours = thresholdHours - elapsedBusinessHours;
      return {
        incident,
        elapsedBusinessHours,
        thresholdHours,
        remainingHours,
        isOverdue: remainingHours <= 0
      };
    });

    this.totalCount = this.rows.length;
    this.overdueCount = this.rows.filter(r => r.isOverdue).length;
    this.onTimeCount = this.totalCount - this.overdueCount;
    this.lastUpdated = now;

    const uniqueAnalysts = new Set(incidents.map(i => i.assignedAnalyst).filter(a => a));
    this.analysts = Array.from(uniqueAnalysts).sort() as string[];

    this.applyFilters();
  }

  refreshNow(): void {
    this.buildRows(this.rows.map(r => r.incident));
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

    if (this.selectedStatus === 'vencido') {
      filtered = filtered.filter(r => r.isOverdue);
    } else if (this.selectedStatus === 'atiempo') {
      filtered = filtered.filter(r => !r.isOverdue);
    }

    this.filteredRows = filtered.sort((a, b) => a.remainingHours - b.remainingHours);
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
      'Horas Hábiles Transcurridas': r.elapsedBusinessHours.toFixed(2),
      'Estado': r.isOverdue ? 'Vencido' : 'A tiempo',
      'Tiempo Restante/Vencido': (r.isOverdue ? 'Vencido hace ' : 'Faltan ') + this.formatDuration(r.remainingHours)
    }));
  }

  copyToClipboardTable(): void {
    const tsv = buildIncidentsTsv(this.buildExportRows());
    this.copyToClipboard(tsv, `${this.filteredRows.length} incidentes copiados`);
  }

  exportToExcel(): void {
    this.exportService.exportRowsToExcel(this.buildExportRows(), 'sla_ans_abiertos');
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
