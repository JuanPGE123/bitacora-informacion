/**
 * Modelo principal de Incidente con todas las columnas del sistema
 */
export interface Incident {
  // Columnas A-D: Identificación básica
  incidentNumber: string;                    // A: No. Incidente
  requestId?: string;                        // B: ID de petición
  status: IncidentStatus;                    // C: Estado
  statusReason?: string;                     // D: Motivo de estatus
  
  // Columnas E-F: Incidente mayor
  isMajor: boolean;                          // E: Incidente mayor
  majorIncidentId?: string;                  // F: Incidente Mayor Asociado
  
  // Columnas G-K: Fechas
  openDate: Date;                            // G: Fecha de apertura
  majorMarkedDate?: Date;                    // H: Fecha marcación como mayor
  solutionDate?: Date;                       // I: Fecha de solución
  reopenDate?: Date;                         // J: Fecha de reapertura
  closeDate?: Date;                          // K: Fecha de cierre
  
  // Columnas L-O: Tiempos y SLA
  suspendedTime?: number;                    // L: Tiempo Suspendido (Hr)
  effectiveSolutionTime?: number;            // M: Tiempo efectivo solución (Hr)
  slaTime?: number;                          // N: Tiempo ANS
  meetsSla: boolean;                         // O: Cumple ANS
  
  // Columnas P-U: Asignación
  domain?: string;                           // P: Dominio
  assignedGroup?: string;                    // Q: Grupo asignado
  supervisor?: string;                       // R: Supervisor
  groupType?: string;                        // S: Tipo de Grupo
  groupLevel?: number;                       // T: Nivel del grupo
  assignedAnalyst?: string;                  // U: Analista asignado
  
  // Columnas V-X: CI y problema
  configurationItem?: string;                // V: Elemento de configuración (CI)
  specialTreatment?: string;                 // W: Tratamiento especial
  associatedProblem?: string;                // X: Caso Problema Asociado
  
  // Columnas Y-AA: Clasificación
  impact: IncidentImpact;                    // Y: Impacto
  urgency: IncidentUrgency;                  // Z: Urgencia
  priority: IncidentPriority;                // AA: Prioridad
  
  // Columnas AB-AD: Origen
  reportedSource?: string;                   // AB: Fuente reportada
  templateName?: string;                     // AC: Nombre Plantilla
  externalTicket?: string;                   // AD: External System Ticket
  
  // Columnas AE-AG: Categorización operacional
  operationalCategory1?: string;             // AE: C. Operacional Nivel 1 Compañia
  operationalCategory2?: string;             // AF: C. Operacional Nivel 2 Aplicación
  operationalCategory3?: string;             // AG: C. Operacional Nivel 3 Síntoma
  
  // Columnas AH-AI: Categorías
  productCategory?: string;                  // AH: Categoría Producto
  resolutionCategory?: string;               // AI: Categoría de resolución
  
  // Columnas AJ-AL: Descripción
  summary: string;                           // AJ: Resumen
  description?: string;                      // AK: Descripción
  resolutionNote?: string;                   // AL: Nota de resolución
  
  // Columnas AM-AR: Usuario
  user?: string;                             // AM: Usuario
  userId?: string;                           // AN: ID Usuario
  region?: string;                           // AO: Regional
  department?: string;                       // AP: Departamento
  location?: string;                         // AQ: Ubicación
  contactPhone?: string;                     // AR: Teléfono de contacto
  
  // Columnas AS-AT: Corrección y causa
  fixedBy?: string;                          // AS: Corregido Por
  causedBy?: string;                         // AT: Causado Por
}

/**
 * Estados posibles de un incidente
 */
export enum IncidentStatus {
  OPEN = 'Abierto',
  RESOLVED = 'Resuelto',
  IN_PROGRESS = 'En Proceso',
  PENDING = 'Pendiente',
  CLOSED = 'Cerrado',
  CANCELLED = 'Cancelado'
}

/**
 * Niveles de impacto
 */
export enum IncidentImpact {
  CRITICAL = '1-Crítico',
  HIGH = '2-Alto',
  MEDIUM = '3-Medio',
  LOW = '4-Bajo'
}

/**
 * Niveles de urgencia
 */
export enum IncidentUrgency {
  CRITICAL = '1-Crítico',
  HIGH = '2-Alto',
  MEDIUM = '3-Medio',
  LOW = '4-Bajo'
}

/**
 * Prioridades de incidentes
 */
export enum IncidentPriority {
  CRITICAL = '1-Crítico',
  HIGH = '2-Alto',
  MEDIUM = '3-Medio',
  LOW = '4-Bajo'
}

/**
 * Modelo de archivo cargado
 */
export interface FileUpload {
  id: string;
  fileName: string;
  uploadDate: Date;
  incidentCount: number;
  uploadedBy?: string;
  fileSize: number;
}

/**
 * Modelo de KPIs del dashboard
 */
export interface DashboardKPI {
  totalIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  resolutionPercentage: number;
  averageResolutionTime: number; // en horas
  activeAnalysts: number;
  criticalIncidents: number;
  pendingIncidents: number;
}

/**
 * Datos agregados por analista
 */
export interface AnalystStats {
  analyst: string;
  totalIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  averageResolutionTime: number;
  resolutionRate: number;
}

/**
 * Distribución por prioridad
 */
export interface PriorityDistribution {
  priority: IncidentPriority;
  count: number;
  percentage: number;
}

/**
 * Distribución por categoría
 */
export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

/**
 * Tendencia diaria de incidentes
 */
export interface DailyTrend {
  date: Date;
  openCount: number;
  resolvedCount: number;
  netChange: number;
}

/**
 * Filtros para búsqueda de incidentes
 */
export interface IncidentFilter {
  analyst?: string[];
  priority?: IncidentPriority[];
  category?: string[];
  status?: IncidentStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  searchText?: string;
}

/**
 * Opciones de exportación
 */
export interface ExportOptions {
  format: 'csv' | 'xlsx';
  includeFilters: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

/**
 * Resultado del procesamiento de archivo
 */
export interface FileProcessResult {
  success: boolean;
  incidents: Incident[];
  errors: string[];
  warnings: string[];
  processedRows: number;
  skippedRows: number;
}
