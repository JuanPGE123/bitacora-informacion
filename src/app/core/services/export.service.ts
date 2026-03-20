import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { Incident, ExportOptions } from '../models/incident.model';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  /**
   * Exporta incidentes a Excel
   */
  exportToExcel(incidents: Incident[], filename: string = 'incidentes'): void {
    const data = this.prepareDataForExport(incidents);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Incidentes');
    
    XLSX.writeFile(wb, `${filename}_${this.getTimestamp()}.xlsx`);
  }

  /**
   * Exporta incidentes a CSV
   */
  exportToCSV(incidents: Incident[], filename: string = 'incidentes'): void {
    const data = this.prepareDataForExport(incidents);
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    
    this.downloadFile(csv, `${filename}_${this.getTimestamp()}.csv`, 'text/csv');
  }

  /**
   * Exporta según las opciones especificadas
   */
  export(incidents: Incident[], options: ExportOptions, filename: string = 'incidentes'): void {
    if (options.format === 'xlsx') {
      this.exportToExcel(incidents, filename);
    } else {
      this.exportToCSV(incidents, filename);
    }
  }

  /**
   * Prepara los datos para exportación
   */
  private prepareDataForExport(incidents: Incident[]): any[] {
    return incidents.map(incident => ({
      'No. Incidente': incident.incidentNumber,
      'ID Petición': incident.requestId || '',
      'Estado': incident.status,
      'Prioridad': incident.priority,
      'Impacto': incident.impact,
      'Urgencia': incident.urgency,
      'Analista Asignado': incident.assignedAnalyst || '',
      'Grupo Asignado': incident.assignedGroup || '',
      'Categoría Producto': incident.productCategory || '',
      'Resumen': incident.summary,
      'Descripción': incident.description || '',
      'Fecha Apertura': this.formatDate(incident.openDate),
      'Fecha Solución': incident.solutionDate ? this.formatDate(incident.solutionDate) : '',
      'Fecha Cierre': incident.closeDate ? this.formatDate(incident.closeDate) : '',
      'Tiempo Efectivo Solución (Hr)': incident.effectiveSolutionTime || '',
      'Cumple SLA': incident.meetsSla ? 'Sí' : 'No',
      'Usuario': incident.user || '',
      'Departamento': incident.department || '',
      'Regional': incident.region || ''
    }));
  }

  /**
   * Formatea una fecha para exportación
   */
  private formatDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  /**
   * Calcula horas de resolución
   */
  private calculateResolutionHours(created: Date, resolved: Date): number {
    const diff = new Date(resolved).getTime() - new Date(created).getTime();
    return Math.round(diff / (1000 * 60 * 60) * 100) / 100;
  }

  /**
   * Descarga un archivo
   */
  private downloadFile(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Obtiene timestamp para nombres de archivo
   */
  private getTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}`;
  }
}
