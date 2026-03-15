import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Incident, IncidentFilter, IncidentStatus, IncidentPriority } from '../models/incident.model';

@Injectable({
  providedIn: 'root'
})
export class IncidentService {
  // Datasets separados para incidentes abiertos y resueltos
  private openIncidents$ = new BehaviorSubject<Incident[]>([]);
  private resolvedIncidents$ = new BehaviorSubject<Incident[]>([]);
  
  // Todos los incidentes combinados
  private allIncidents$ = new BehaviorSubject<Incident[]>([]);
  
  private filteredIncidents$ = new BehaviorSubject<Incident[]>([]);
  private currentFilter: IncidentFilter = {};

  constructor() { }

  /**
   * Obtiene todos los incidentes (abiertos + resueltos)
   */
  getIncidents(): Observable<Incident[]> {
    return this.allIncidents$.asObservable();
  }

  /**
   * Obtiene solo incidentes abiertos
   */
  getOpenIncidentsObservable(): Observable<Incident[]> {
    return this.openIncidents$.asObservable();
  }

  /**
   * Obtiene solo incidentes resueltos
   */
  getResolvedIncidentsObservable(): Observable<Incident[]> {
    return this.resolvedIncidents$.asObservable();
  }

  /**
   * Obtiene incidentes filtrados
   */
  getFilteredIncidents(): Observable<Incident[]> {
    return this.filteredIncidents$.asObservable();
  }

  /**
   * Establece incidentes abiertos
   */
  setOpenIncidents(incidents: Incident[]): void {
    this.openIncidents$.next(incidents);
    this.updateAllIncidents();
  }

  /**
   * Establece incidentes resueltos
   */
  setResolvedIncidents(incidents: Incident[]): void {
    this.resolvedIncidents$.next(incidents);
    this.updateAllIncidents();
  }

  /**
   * Agrega incidentes abiertos
   */
  addOpenIncidents(incidents: Incident[]): void {
    const current = this.openIncidents$.value;
    this.openIncidents$.next([...current, ...incidents]);
    this.updateAllIncidents();
  }

  /**
   * Agrega incidentes resueltos
   */
  addResolvedIncidents(incidents: Incident[]): void {
    const current = this.resolvedIncidents$.value;
    this.resolvedIncidents$.next([...current, ...incidents]);
    this.updateAllIncidents();
  }

  /**
   * Actualiza todos los incidentes combinando abiertos y resueltos
   */
  private updateAllIncidents(): void {
    const open = this.openIncidents$.value;
    const resolved = this.resolvedIncidents$.value;
    const all = [...open, ...resolved];
    this.allIncidents$.next(all);
    this.applyFilter(this.currentFilter);
  }

  /**
   * Establece los incidentes (método legacy para compatibilidad)
   */
  setIncidents(incidents: Incident[]): void {
    // Separar automáticamente por estado
    const open = incidents.filter(i => 
      i.status === IncidentStatus.OPEN || 
      i.status === IncidentStatus.IN_PROGRESS || 
      i.status === IncidentStatus.PENDING
    );
    const resolved = incidents.filter(i => 
      i.status === IncidentStatus.RESOLVED || 
      i.status === IncidentStatus.CLOSED ||
      i.status === IncidentStatus.CANCELLED
    );
    
    this.openIncidents$.next(open);
    this.resolvedIncidents$.next(resolved);
    this.updateAllIncidents();
  }

  /**
   * Agrega nuevos incidentes a los existentes (método legacy)
   */
  addIncidents(incidents: Incident[]): void {
    // Separar automáticamente por estado
    const open = incidents.filter(i => 
      i.status === IncidentStatus.OPEN || 
      i.status === IncidentStatus.IN_PROGRESS || 
      i.status === IncidentStatus.PENDING
    );
    const resolved = incidents.filter(i => 
      i.status === IncidentStatus.RESOLVED || 
      i.status === IncidentStatus.CLOSED ||
      i.status === IncidentStatus.CANCELLED
    );
    
    if (open.length > 0) this.addOpenIncidents(open);
    if (resolved.length > 0) this.addResolvedIncidents(resolved);
  }

  /**
   * Aplica filtros a los incidentes
   */
  applyFilter(filter: IncidentFilter): void {
    this.currentFilter = filter;
    const incidents = this.allIncidents$.value;
    const filtered = this.filterIncidents(incidents, filter);
    this.filteredIncidents$.next(filtered);
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters(): void {
    this.currentFilter = {};
    this.filteredIncidents$.next(this.allIncidents$.value);
  }

  /**
   * Obtiene incidentes abiertos
   */
  getOpenIncidents(): Incident[] {
    return this.openIncidents$.value;
  }

  /**
   * Obtiene incidentes resueltos
   */
  getResolvedIncidents(): Incident[] {
    return this.resolvedIncidents$.value;
  }

  /**
   * Obtiene incidentes por analista
   */
  getIncidentsByAnalyst(analyst: string): Incident[] {
    return this.allIncidents$.value.filter(i => i.assignedAnalyst === analyst);
  }

  /**
   * Obtiene incidentes por prioridad
   */
  getIncidentsByPriority(priority: IncidentPriority): Incident[] {
    return this.allIncidents$.value.filter(i => i.priority === priority);
  }

  /**
   * Obtiene incidentes por categoría
   */
  getIncidentsByCategory(category: string): Incident[] {
    return this.allIncidents$.value.filter(i => 
      i.productCategory === category || 
      i.operationalCategory1 === category ||
      i.operationalCategory2 === category
    );
  }

  /**
   * Obtiene lista única de analistas
   */
  getUniqueAnalysts(): string[] {
    const analysts = this.allIncidents$.value.map(i => i.assignedAnalyst).filter(a => a) as string[];
    return [...new Set(analysts)].sort();
  }

  /**
   * Obtiene lista única de categorías
   */
  getUniqueCategories(): string[] {
    const categories = this.allIncidents$.value
      .map(i => i.productCategory)
      .filter(c => c) as string[];
    return [...new Set(categories)].sort();
  }

  /**
   * Busca incidentes por texto
   */
  searchIncidents(searchText: string): Incident[] {
    const text = searchText.toLowerCase();
    return this.allIncidents$.value.filter(i => 
      i.incidentNumber.toLowerCase().includes(text) ||
      i.assignedAnalyst?.toLowerCase().includes(text) ||
      i.productCategory?.toLowerCase().includes(text) ||
      i.description?.toLowerCase().includes(text) ||
      i.summary?.toLowerCase().includes(text)
    );
  }

  /**
   * Filtra incidentes según criterios
   */
  private filterIncidents(incidents: Incident[], filter: IncidentFilter): Incident[] {
    let filtered = [...incidents];

    // Filtrar por analista
    if (filter.analyst && filter.analyst.length > 0) {
      filtered = filtered.filter(i => i.assignedAnalyst && filter.analyst!.includes(i.assignedAnalyst));
    }

    // Filtrar por prioridad
    if (filter.priority && filter.priority.length > 0) {
      filtered = filtered.filter(i => filter.priority!.includes(i.priority));
    }

    // Filtrar por categoría (productCategory)
    if (filter.category && filter.category.length > 0) {
      filtered = filtered.filter(i => i.productCategory && filter.category!.includes(i.productCategory));
    }

    // Filtrar por estado
    if (filter.status && filter.status.length > 0) {
      filtered = filtered.filter(i => filter.status!.includes(i.status));
    }

    // Filtrar por rango de fechas (openDate)
    if (filter.dateFrom) {
      filtered = filtered.filter(i => i.openDate >= filter.dateFrom!);
    }

    if (filter.dateTo) {
      filtered = filtered.filter(i => i.openDate <= filter.dateTo!);
    }

    // Filtrar por texto de búsqueda
    if (filter.searchText && filter.searchText.trim()) {
      const text = filter.searchText.toLowerCase();
      filtered = filtered.filter(i => 
        i.incidentNumber.toLowerCase().includes(text) ||
        i.assignedAnalyst?.toLowerCase().includes(text) ||
        i.productCategory?.toLowerCase().includes(text) ||
        i.description?.toLowerCase().includes(text) ||
        i.summary?.toLowerCase().includes(text)
      );
    }

    return filtered;
  }

  /**
   * Limpia todos los incidentes
   */
  clearIncidents(): void {
    this.openIncidents$.next([]);
    this.resolvedIncidents$.next([]);
    this.allIncidents$.next([]);
    this.filteredIncidents$.next([]);
    this.currentFilter = {};
  }
}
