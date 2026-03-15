import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Incident, IncidentPriority, IncidentStatus } from '../../../core/models/incident.model';
import { SortOptions, PaginationOptions } from '../../../core/models/table.model';

@Component({
  selector: 'app-incident-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './incident-table.component.html',
  styleUrls: ['./incident-table.component.scss']
})
export class IncidentTableComponent implements OnInit, OnChanges {
  @Input() incidents: Incident[] = [];
  @Input() title: string = 'Incidentes';
  @Input() showResolved: boolean = false;

  Math = Math;

  filteredIncidents: Incident[] = [];
  displayedIncidents: Incident[] = [];
  
  searchText: string = '';
  selectedAnalyst: string = '';
  selectedPriority: string = '';
  selectedExternalTicket: string = '';

  analysts: string[] = [];
  priorities: string[] = Object.values(IncidentPriority);
  externalTickets: string[] = [];
  
  // Contador de incidentes sin external ticket
  incidentsWithoutExternalTicket: number = 0;

  sortOptions: SortOptions = { field: 'createdDate', direction: 'desc' };
  
  pagination: PaginationOptions = {
    page: 0,
    pageSize: 10,
    totalItems: 0,
    pageSizeOptions: [10, 25, 50, 100]
  };

  ngOnInit(): void {
    this.initializeFilters();
    this.applyFilters();
  }

  ngOnChanges(): void {
    this.initializeFilters();
    this.applyFilters();
  }

  initializeFilters(): void {
    const uniqueAnalysts = new Set(this.incidents.map(i => i.assignedAnalyst).filter(a => a));
    this.analysts = Array.from(uniqueAnalysts).sort() as string[];
    
    const uniqueTickets = new Set(this.incidents.map(i => i.externalTicket).filter(t => t));
    this.externalTickets = Array.from(uniqueTickets).sort() as string[];
    
    // Contar incidentes sin external ticket
    this.incidentsWithoutExternalTicket = this.incidents.filter(i => !i.externalTicket || i.externalTicket.trim() === '').length;
  }

  applyFilters(): void {
    let filtered = [...this.incidents];

    // Búsqueda de texto
    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(i =>
        i.incidentNumber.toLowerCase().includes(search) ||
        i.assignedAnalyst?.toLowerCase().includes(search) ||
        i.externalTicket?.toLowerCase().includes(search) ||
        i.summary?.toLowerCase().includes(search)
      );
    }

    // Filtro por analista
    if (this.selectedAnalyst) {
      filtered = filtered.filter(i => i.assignedAnalyst === this.selectedAnalyst);
    }

    // Filtro por prioridad
    if (this.selectedPriority) {
      filtered = filtered.filter(i => i.priority === this.selectedPriority);
    }

    // Filtro por external ticket
    if (this.selectedExternalTicket) {
      filtered = filtered.filter(i => i.externalTicket === this.selectedExternalTicket);
    }

    this.filteredIncidents = filtered;
    this.pagination.totalItems = filtered.length;
    this.sortIncidents();
    this.updateDisplayedIncidents();
  }

  sortIncidents(): void {
    this.filteredIncidents.sort((a, b) => {
      const aValue = this.getFieldValue(a, this.sortOptions.field);
      const bValue = this.getFieldValue(b, this.sortOptions.field);

      if (aValue < bValue) return this.sortOptions.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortOptions.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  getFieldValue(incident: Incident, field: string): any {
    switch (field) {
      case 'openDate':
      case 'createdDate':
        return new Date(incident.openDate).getTime();
      case 'solutionDate':
      case 'resolvedDate':
        return incident.solutionDate ? new Date(incident.solutionDate).getTime() : 0;
      default:
        return (incident as any)[field];
    }
  }

  sortBy(field: string): void {
    if (this.sortOptions.field === field) {
      this.sortOptions.direction = this.sortOptions.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortOptions.field = field;
      this.sortOptions.direction = 'asc';
    }
    this.sortIncidents();
    this.updateDisplayedIncidents();
  }

  updateDisplayedIncidents(): void {
    const start = this.pagination.page * this.pagination.pageSize;
    const end = start + this.pagination.pageSize;
    this.displayedIncidents = this.filteredIncidents.slice(start, end);
  }

  changePage(page: number): void {
    this.pagination.page = page;
    this.updateDisplayedIncidents();
  }

  changePageSize(size: number): void {
    this.pagination.pageSize = size;
    this.pagination.page = 0;
    this.updateDisplayedIncidents();
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedAnalyst = '';
    this.selectedPriority = '';
    this.selectedExternalTicket = '';
    this.applyFilters();
  }

  filterByNoExternalTicket(): void {
    this.clearFilters();
    this.filteredIncidents = this.incidents.filter(i => !i.externalTicket || i.externalTicket.trim() === '');
    this.pagination.totalItems = this.filteredIncidents.length;
    this.pagination.page = 0;
    this.sortIncidents();
    this.updateDisplayedIncidents();
  }

  get totalPages(): number {
    return Math.ceil(this.pagination.totalItems / this.pagination.pageSize);
  }

  get pages(): number[] {
    const total = this.totalPages;
    const current = this.pagination.page;
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 0; i < total; i++) {
        pages.push(i);
      }
    } else {
      if (current < 3) {
        pages.push(0, 1, 2, 3, -1, total - 1);
      } else if (current >= total - 3) {
        pages.push(0, -1, total - 4, total - 3, total - 2, total - 1);
      } else {
        pages.push(0, -1, current - 1, current, current + 1, -1, total - 1);
      }
    }

    return pages;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  getPriorityClass(priority: IncidentPriority): string {
    return `priority-${priority.toLowerCase()}`;
  }

  getStatusClass(status: IncidentStatus): string {
    return `status-${status.toLowerCase().replace(' ', '-')}`;
  }
}
