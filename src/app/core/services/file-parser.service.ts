import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { Incident, FileProcessResult, IncidentStatus, IncidentPriority, IncidentImpact, IncidentUrgency } from '../models/incident.model';

@Injectable({
  providedIn: 'root'
})
export class FileParserService {

  constructor() { }

  /**
   * Procesa un archivo CSV o Excel y retorna incidentes
   */
  async parseFile(file: File): Promise<FileProcessResult> {
    const fileExtension = this.getFileExtension(file.name);
    
    try {
      let data: any[];
      
      if (fileExtension === 'csv') {
        data = await this.parseCSV(file);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        data = await this.parseExcel(file);
      } else {
        return {
          success: false,
          incidents: [],
          errors: ['Formato de archivo no soportado. Use CSV o Excel.'],
          warnings: [],
          processedRows: 0,
          skippedRows: 0
        };
      }

      return this.processData(data);
    } catch (error) {
      return {
        success: false,
        incidents: [],
        errors: [`Error al procesar el archivo: ${error}`],
        warnings: [],
        processedRows: 0,
        skippedRows: 0
      };
    }
  }

  /**
   * Parsea archivo CSV usando una implementación simple
   */
  private parseCSV(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        try {
          const text = e.target.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length === 0) {
            resolve([]);
            return;
          }
          
          // Primera línea como headers
          const headers = this.parseCSVLine(lines[0]);
          const data: any[] = [];
          
          // Procesar cada línea
          for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length > 0) {
              const row: any = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || '';
              });
              data.push(row);
            }
          }
          
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Parsea una línea CSV considerando comillas
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Parsea archivo Excel usando XLSX
   */
  private parseExcel(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Buscar hoja "1-Untitled" primero, si no existe usar la primera hoja
          let targetSheet: any;
          if (workbook.SheetNames.includes('1-Untitled')) {
            targetSheet = workbook.Sheets['1-Untitled'];
          } else {
            // Fallback a la primera hoja que no sea resumen
            const sheetName = workbook.SheetNames.find(name => 
              !name.toLowerCase().includes('hoja1') && 
              !name.toLowerCase().includes('resumen') &&
              !name.toLowerCase().includes('summary')
            ) || workbook.SheetNames[0];
            targetSheet = workbook.Sheets[sheetName];
          }
          
          const jsonData = XLSX.utils.sheet_to_json(targetSheet);
          
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Procesa los datos crudos y los convierte a incidentes
   */
  private processData(data: any[]): FileProcessResult {
    const incidents: Incident[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let skippedRows = 0;

    data.forEach((row, index) => {
      try {
        const incident = this.mapToIncident(row, index);
        
        if (incident) {
          incidents.push(incident);
        } else {
          skippedRows++;
          warnings.push(`Fila ${index + 2} omitida: datos incompletos`);
        }
      } catch (error) {
        skippedRows++;
        errors.push(`Error en fila ${index + 2}: ${error}`);
      }
    });

    return {
      success: incidents.length > 0,
      incidents,
      errors,
      warnings,
      processedRows: incidents.length,
      skippedRows
    };
  }

  /**
   * Mapea una fila de datos a un objeto Incident
   * Mapea todas las 46 columnas del CSV/Excel (A-AT)
   */
  private mapToIncident(row: any, index: number): Incident | null {
    // Columna A: No. Incidente (obligatorio)
    const incidentNumber = this.findField(row, ['No. Incidente', 'No Incidente', 'Incident Number', 'Numero Incidente']);
    if (!incidentNumber) {
      return null; // Campo obligatorio
    }

    // Columna C: Estado (obligatorio)
    const status = this.findField(row, ['Estado', 'Status', 'State']);
    if (!status) {
      return null; // Campo obligatorio
    }

    // Columna AJ: Resumen (obligatorio)
    const summary = this.findField(row, ['Resumen', 'Summary', 'Título', 'Title']);
    if (!summary) {
      return null; // Campo obligatorio
    }

    // Construir el objeto Incident con todas las columnas
    return {
      // Columnas A-D: Identificación básica
      incidentNumber: String(incidentNumber),
      requestId: this.getStringValue(row, ['ID de petición', 'ID Peticion', 'Request ID']),
      status: this.normalizeStatus(status),
      statusReason: this.getStringValue(row, ['Motivo de estatus', 'Motivo Estatus', 'Status Reason']),
      
      // Columnas E-F: Incidente mayor
      isMajor: this.getBooleanValue(row, ['Incidente mayor', 'Incidente Mayor', 'Is Major']),
      majorIncidentId: this.getStringValue(row, ['Incidente Mayor Asociado', 'Major Incident ID']),
      
      // Columnas G-K: Fechas
      openDate: this.getDateValue(row, ['Fecha de apertura', 'Fecha Apertura', 'Open Date']),
      majorMarkedDate: this.getOptionalDateValue(row, ['Fecha marcación como mayor', 'Major Marked Date']),
      solutionDate: this.getOptionalDateValue(row, ['Fecha de solución', 'Fecha Solucion', 'Solution Date']),
      reopenDate: this.getOptionalDateValue(row, ['Fecha de reapertura', 'Fecha Reapertura', 'Reopen Date']),
      closeDate: this.getOptionalDateValue(row, ['Fecha de cierre', 'Fecha Cierre', 'Close Date']),
      
      // Columnas L-O: Tiempos y SLA
      suspendedTime: this.getNumberValue(row, ['Tiempo Suspendido (Hr)', 'Tiempo Suspendido', 'Suspended Time']),
      effectiveSolutionTime: this.getNumberValue(row, ['Tiempo efectivo solución (Hr)', 'Tiempo Efectivo Solucion', 'Effective Solution Time']),
      slaTime: this.getNumberValue(row, ['Tiempo ANS', 'SLA Time']),
      meetsSla: this.getBooleanValue(row, ['Cumple ANS', 'Meets SLA', 'SLA Met']),
      
      // Columnas P-U: Asignación
      domain: this.getStringValue(row, ['Dominio', 'Domain']),
      assignedGroup: this.getStringValue(row, ['Grupo asignado', 'Grupo Asignado', 'Assigned Group']),
      supervisor: this.getStringValue(row, ['Supervisor']),
      groupType: this.getStringValue(row, ['Tipo de Grupo', 'Tipo Grupo', 'Group Type']),
      groupLevel: this.getNumberValue(row, ['Nivel del grupo', 'Nivel Grupo', 'Group Level']),
      assignedAnalyst: this.getStringValue(row, ['Analista asignado', 'Analista Asignado', 'Assigned Analyst']),
      
      // Columnas V-X: CI y problema
      configurationItem: this.getStringValue(row, ['Elemento de configuración (CI)', 'Configuration Item', 'CI']),
      specialTreatment: this.getStringValue(row, ['Tratamiento especial', 'Special Treatment']),
      associatedProblem: this.getStringValue(row, ['Caso Problema Asociado', 'Associated Problem']),
      
      // Columnas Y-AA: Clasificación
      impact: this.normalizeImpact(this.findField(row, ['Impacto', 'Impact'])),
      urgency: this.normalizeUrgency(this.findField(row, ['Urgencia', 'Urgency'])),
      priority: this.normalizePriority(this.findField(row, ['Prioridad', 'Priority'])),
      
      // Columnas AB-AD: Origen
      reportedSource: this.getStringValue(row, ['Fuente reportada', 'Fuente Reportada', 'Reported Source']),
      templateName: this.getStringValue(row, ['Nombre Plantilla', 'Template Name']),
      externalTicket: this.getStringValue(row, ['External System Ticket', 'External Ticket']),
      
      // Columnas AE-AG: Categorización operacional
      operationalCategory1: this.getStringValue(row, ['C. Operacional Nivel 1 Compañia', 'C. Operacional Nivel 1 Compania', 'Operational Category 1']),
      operationalCategory2: this.getStringValue(row, ['C. Operacional Nivel 2 Aplicación', 'C. Operacional Nivel 2 Aplicacion', 'Operational Category 2']),
      operationalCategory3: this.getStringValue(row, ['C. Operacional Nivel 3 Síntoma', 'C. Operacional Nivel 3 Sintoma', 'Operational Category 3']),
      
      // Columnas AH-AI: Categorías
      productCategory: this.getStringValue(row, ['Categoría Producto', 'Categoria Producto', 'Product Category']),
      resolutionCategory: this.getStringValue(row, ['Categoría de resolución', 'Categoria Resolucion', 'Resolution Category']),
      
      // Columnas AJ-AL: Descripción
      summary: String(summary),
      description: this.getStringValue(row, ['Descripción', 'Descripcion', 'Description']),
      resolutionNote: this.getStringValue(row, ['Nota de resolución', 'Nota Resolucion', 'Resolution Note']),
      
      // Columnas AM-AR: Usuario
      user: this.getStringValue(row, ['Usuario', 'User']),
      userId: this.getStringValue(row, ['ID Usuario', 'User ID']),
      region: this.getStringValue(row, ['Regional', 'Region']),
      department: this.getStringValue(row, ['Departamento', 'Department']),
      location: this.getStringValue(row, ['Ubicación', 'Ubicacion', 'Location']),
      contactPhone: this.getStringValue(row, ['Teléfono de contacto', 'Telefono de Contacto', 'Contact Phone']),
      
      // Columnas AS-AT: Corrección y causa
      fixedBy: this.getStringValue(row, ['Corregido Por', 'Fixed By']),
      causedBy: this.getStringValue(row, ['Causado Por', 'Caused By'])
    };
  }

  /**
   * Obtiene un valor string de la fila, retorna undefined si no existe
   */
  private getStringValue(row: any, possibleNames: string[]): string | undefined {
    const value = this.findField(row, possibleNames);
    return value ? String(value).trim() : undefined;
  }

  /**
   * Obtiene un valor número de la fila
   */
  private getNumberValue(row: any, possibleNames: string[]): number | undefined {
    const value = this.findField(row, possibleNames);
    if (!value || value === '') return undefined;
    
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
    return isNaN(num) ? undefined : num;
  }

  /**
   * Obtiene un valor booleano de la fila
   */
  private getBooleanValue(row: any, possibleNames: string[]): boolean {
    const value = this.findField(row, possibleNames);
    if (!value || value === '') return false;
    
    const normalized = String(value).toLowerCase().trim();
    return normalized === 'true' || normalized === 'yes' || normalized === 'sí' || 
           normalized === 'si' || normalized === '1' || normalized === 'x';
  }

  /**
   * Obtiene una fecha obligatoria
   */
  private getDateValue(row: any, possibleNames: string[]): Date {
    const value = this.findField(row, possibleNames);
    return this.parseDate(value);
  }

  /**
   * Obtiene una fecha opcional
   */
  private getOptionalDateValue(row: any, possibleNames: string[]): Date | undefined {
    const value = this.findField(row, possibleNames);
    if (!value || value === '') return undefined;
    return this.parseDate(value);
  }

  /**
   * Busca un campo en la fila usando múltiples posibles nombres
   */
  private findField(row: any, possibleNames: string[]): any {
    for (const name of possibleNames) {
      // Búsqueda case-insensitive
      const key = Object.keys(row).find(k => k.toLowerCase() === name.toLowerCase());
      if (key && row[key]) {
        return row[key];
      }
    }
    return null;
  }

  /**
   * Normaliza el estado del incidente
   */
  private normalizeStatus(status: string): IncidentStatus {
    if (!status) return IncidentStatus.OPEN;
    
    const normalized = String(status).toLowerCase().trim();
    
    if (normalized.includes('abierto') || normalized.includes('open') || normalized.includes('nueva')) {
      return IncidentStatus.OPEN;
    }
    if (normalized.includes('resuelto') || normalized.includes('resolved')) {
      return IncidentStatus.RESOLVED;
    }
    if (normalized.includes('proceso') || normalized.includes('progress') || normalized.includes('asignado')) {
      return IncidentStatus.IN_PROGRESS;
    }
    if (normalized.includes('pendiente') || normalized.includes('pending') || normalized.includes('espera')) {
      return IncidentStatus.PENDING;
    }
    if (normalized.includes('cerrado') || normalized.includes('closed')) {
      return IncidentStatus.CLOSED;
    }
    if (normalized.includes('cancelado') || normalized.includes('cancelled')) {
      return IncidentStatus.CANCELLED;
    }
    
    return IncidentStatus.OPEN;
  }

  /**
   * Normaliza el impacto del incidente
   */
  private normalizeImpact(impact: string): IncidentImpact {
    if (!impact) return IncidentImpact.MEDIUM;
    
    const normalized = String(impact).toLowerCase().trim();
    
    if (normalized.includes('1') || normalized.includes('crítico') || normalized.includes('critico') || normalized.includes('critical')) {
      return IncidentImpact.CRITICAL;
    }
    if (normalized.includes('2') || normalized.includes('alto') || normalized.includes('high')) {
      return IncidentImpact.HIGH;
    }
    if (normalized.includes('4') || normalized.includes('bajo') || normalized.includes('low')) {
      return IncidentImpact.LOW;
    }
    
    return IncidentImpact.MEDIUM;
  }

  /**
   * Normaliza la urgencia del incidente
   */
  private normalizeUrgency(urgency: string): IncidentUrgency {
    if (!urgency) return IncidentUrgency.MEDIUM;
    
    const normalized = String(urgency).toLowerCase().trim();
    
    if (normalized.includes('1') || normalized.includes('crítico') || normalized.includes('critico') || normalized.includes('critical')) {
      return IncidentUrgency.CRITICAL;
    }
    if (normalized.includes('2') || normalized.includes('alto') || normalized.includes('high')) {
      return IncidentUrgency.HIGH;
    }
    if (normalized.includes('4') || normalized.includes('bajo') || normalized.includes('low')) {
      return IncidentUrgency.LOW;
    }
    
    return IncidentUrgency.MEDIUM;
  }

  /**
   * Normaliza la prioridad del incidente
   */
  private normalizePriority(priority: string): IncidentPriority {
    if (!priority) return IncidentPriority.MEDIUM;
    
    const normalized = String(priority).toLowerCase().trim();
    
    if (normalized.includes('1') || normalized.includes('crítico') || normalized.includes('critico') || normalized.includes('critical')) {
      return IncidentPriority.CRITICAL;
    }
    if (normalized.includes('2') || normalized.includes('alto') || normalized.includes('alta') || normalized.includes('high')) {
      return IncidentPriority.HIGH;
    }
    if (normalized.includes('4') || normalized.includes('bajo') || normalized.includes('baja') || normalized.includes('low')) {
      return IncidentPriority.LOW;
    }
    
    return IncidentPriority.MEDIUM;
  }

  /**
   * Parsea una fecha de múltiples formatos posibles
   */
  private parseDate(dateValue: any): Date {
    if (!dateValue) {
      return new Date();
    }

    // Si ya es una fecha
    if (dateValue instanceof Date) {
      return dateValue;
    }

    // Si es un número (Excel serial date)
    if (typeof dateValue === 'number') {
      return this.excelDateToJSDate(dateValue);
    }

    // Si es string, intentar parsear
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    // Por defecto, fecha actual
    return new Date();
  }

  /**
   * Convierte fecha serial de Excel a Date de JavaScript
   */
  private excelDateToJSDate(serial: number): Date {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
  }

  /**
   * Obtiene la extensión del archivo
   */
  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Valida que el archivo sea del tipo correcto
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    const validExtensions = ['csv', 'xlsx', 'xls'];
    const extension = this.getFileExtension(file.name);
    
    if (!validExtensions.includes(extension)) {
      return {
        valid: false,
        error: `Formato no válido. Solo se permiten archivos: ${validExtensions.join(', ')}`
      };
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'El archivo es demasiado grande. Tamaño máximo: 10MB'
      };
    }

    return { valid: true };
  }
}
