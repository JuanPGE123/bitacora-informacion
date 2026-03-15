# Incident Analytics Dashboard - Documentación Técnica

## 🏗️ Arquitectura del Sistema

### Patrón de Diseño

El proyecto sigue una **arquitectura modular** basada en:

- **Standalone Components** (Angular 17+)
- **Reactive Programming** (RxJS)
- **Service Layer Pattern**
- **Smart/Dumb Components**

### Estructura de Carpetas

```
src/app/
├── core/                           # Núcleo de la aplicación
│   ├── models/                    # Interfaces y tipos TypeScript
│   │   ├── incident.model.ts     # Modelos de incidentes
│   │   ├── chart.model.ts        # Configuraciones de gráficos
│   │   └── table.model.ts        # Configuraciones de tablas
│   └── services/                  # Servicios principales
│       ├── file-parser.service.ts    # Procesamiento CSV/Excel
│       ├── incident.service.ts       # Gestión de incidentes
│       ├── kpi.service.ts           # Cálculo de KPIs
│       ├── analytics.service.ts     # Generación de gráficos
│       ├── file-history.service.ts  # Historial de archivos
│       └── export.service.ts        # Exportación de datos
├── modules/                        # Módulos funcionales
│   ├── upload/                    # Carga de archivos
│   ├── dashboard/                 # Dashboard principal
│   ├── open-incidents/            # Incidentes abiertos
│   ├── resolved-incidents/        # Incidentes resueltos
│   ├── analytics/                 # Análisis gráfico
│   └── history/                   # Historial
└── shared/                         # Componentes compartidos
    └── components/
        └── incident-table/        # Tabla reutilizable
```

## 🔧 Servicios Principales

### 1. FileParserService

**Responsabilidad**: Procesar archivos CSV y Excel

```typescript
async parseFile(file: File): Promise<FileProcessResult>
```

**Características**:
- Soporta CSV (PapaParse) y Excel (XLSX)
- Validación de formato
- Normalización de datos
- Manejo inteligente de nombres de columnas
- Conversión de fechas (incluyendo formato Excel)

**Flujo**:
1. Validar archivo (tipo y tamaño)
2. Parsear según extensión
3. Mapear datos a modelo Incident
4. Normalizar estados y prioridades
5. Retornar resultado con errores/warnings

### 2. IncidentService

**Responsabilidad**: Gestión centralizada de incidentes

```typescript
setIncidents(incidents: Incident[]): void
applyFilter(filter: IncidentFilter): void
getOpenIncidents(): Incident[]
getResolvedIncidents(): Incident[]
```

**Características**:
- Estado reactivo con BehaviorSubject
- Filtrado dinámico
- Búsqueda por múltiples criterios
- Observables para componentes

### 3. KpiService

**Responsabilidad**: Cálculo de indicadores

```typescript
getDashboardKPIs(): Observable<DashboardKPI>
getAnalystStats(): Observable<AnalystStats[]>
getPriorityDistribution(): Observable<PriorityDistribution[]>
getDailyTrend(days: number): Observable<DailyTrend[]>
```

**KPIs Calculados**:
- Total incidentes
- Abiertos/Resueltos
- Tasa de resolución
- Tiempo promedio de resolución
- Analistas activos
- Distribuciones (prioridad, categoría)
- Tendencias temporales

### 4. AnalyticsService

**Responsabilidad**: Generación de configuraciones de gráficos

```typescript
getIncidentsByAnalystChart(): Observable<ChartConfig>
getPriorityDistributionChart(): Observable<ChartConfig>
getDailyTrendChart(days: number): Observable<ChartConfig>
```

**Gráficos**:
- Barras: Incidentes por analista
- Dona: Distribución por prioridad
- Línea: Tendencia temporal
- Barras comparativas: Abiertos vs Resueltos

### 5. ExportService

**Responsabilidad**: Exportación de datos

```typescript
exportToExcel(incidents: Incident[], filename: string): void
exportToCSV(incidents: Incident[], filename: string): void
```

## 📊 Modelos de Datos

### Interface Incident

```typescript
interface Incident {
  id: string;
  analyst: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  category: string;
  createdDate: Date;
  resolvedDate?: Date;
  description?: string;
  title?: string;
}
```

### Enums

```typescript
enum IncidentStatus {
  OPEN = 'Open',
  RESOLVED = 'Resolved',
  IN_PROGRESS = 'In Progress',
  PENDING = 'Pending',
  CLOSED = 'Closed'
}

enum IncidentPriority {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}
```

## 🎨 Componentes

### Componentes Smart (Containers)

**DashboardComponent**
- Obtiene KPIs del servicio
- Formatea datos para presentación
- No contiene lógica de negocio

**AnalyticsComponent**
- Suscribe a observables de gráficos
- Maneja exportación
- Coordina múltiples gráficos

### Componentes Dumb (Presentational)

**IncidentTableComponent**
- Recibe datos vía @Input
- Emite eventos vía @Output
- Filtrado y ordenamiento local
- Paginación
- Completamente reutilizable

## 🔄 Flujo de Datos

```
Usuario carga archivo
    ↓
FileParserService.parseFile()
    ↓
Validación y parseo
    ↓
Conversión a Incident[]
    ↓
IncidentService.addIncidents()
    ↓
BehaviorSubject actualiza
    ↓
Componentes suscritos reaccionan
    ↓
Vista actualizada
```

## 🎯 Patrones Implementados

### 1. Observable Pattern

Todos los servicios exponen Observables para reactividad:

```typescript
incidents$: Observable<Incident[]>;
kpis$: Observable<DashboardKPI>;
```

### 2. Service Layer

Lógica de negocio centralizada en servicios:

- FileParserService: Procesamiento
- IncidentService: Estado
- KpiService: Cálculos
- AnalyticsService: Transformaciones

### 3. Dependency Injection

Angular DI para servicios singleton:

```typescript
@Injectable({ providedIn: 'root' })
```

### 4. Smart/Dumb Components

- **Smart**: Coordinan, obtienen datos, manejan estado
- **Dumb**: Solo presentan, reciben inputs, emiten outputs

## 📦 Librerías Externas

### Chart.js + ng2-charts

```typescript
import { BaseChartDirective } from 'ng2-charts';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);
```

**Uso**:
```html
<canvas 
  baseChart
  [type]="chartConfig.type"
  [data]="chartConfig.data"
  [options]="chartConfig.options">
</canvas>
```

### PapaParse

```typescript
import * as Papa from 'papaparse';

Papa.parse(file, {
  header: true,
  complete: (results) => { /* ... */ }
});
```

### XLSX

```typescript
import * as XLSX from 'xlsx';

const workbook = XLSX.read(data, { type: 'array' });
const json = XLSX.utils.sheet_to_json(firstSheet);
```

## 🚀 Optimizaciones

### 1. Lazy Loading (Preparado)

Estructura modular lista para lazy loading:

```typescript
const routes: Routes = [
  {
    path: 'analytics',
    loadComponent: () => import('./modules/analytics/...').then(m => m.AnalyticsComponent)
  }
];
```

### 2. OnPush Change Detection (Recomendado)

Para componentes de solo lectura:

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

### 3. TrackBy en ngFor

```typescript
trackByIncidentId(index: number, incident: Incident): string {
  return incident.id;
}
```

### 4. Async Pipe

Previene memory leaks:

```html
<div *ngIf="incidents$ | async as incidents">
```

## 🧪 Testing (Preparado)

### Estructura para Tests

```typescript
describe('IncidentService', () => {
  let service: IncidentService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IncidentService);
  });
  
  it('should calculate KPIs correctly', () => {
    // Test implementation
  });
});
```

## 🔐 Seguridad

### Validaciones Implementadas

1. **Tamaño de archivo**: Máximo 10MB
2. **Tipos permitidos**: Solo CSV y Excel
3. **Sanitización**: Datos parseados son tipados
4. **LocalStorage**: Solo metadatos, no datos sensibles

### Mejoras Futuras

1. **Autenticación JWT**
2. **Roles y permisos**
3. **Encriptación de datos sensibles**
4. **Rate limiting en uploads**

## 📈 Escalabilidad

### Preparado para Crecer

1. **Virtual Scrolling**: Para grandes datasets
2. **Backend API**: Estructura lista para HTTP
3. **Estado Global**: NgRx/Akita fácilmente integrable
4. **Microservicios**: Servicios desacoplados

### Integración con Backend

```typescript
// Ejemplo de integración futura
@Injectable()
export class IncidentApiService {
  constructor(private http: HttpClient) {}
  
  getIncidents(): Observable<Incident[]> {
    return this.http.get<Incident[]>('/api/incidents');
  }
}
```

## 🎓 Mejores Prácticas Aplicadas

1. ✅ **Standalone Components**
2. ✅ **TypeScript Strict Mode**
3. ✅ **RxJS para reactividad**
4. ✅ **SCSS modularizado**
5. ✅ **Interfaces para todos los modelos**
6. ✅ **Servicios desacoplados**
7. ✅ **Componentes reutilizables**
8. ✅ **Responsive design**

---

Desarrollado con Angular 17 y TypeScript 5
