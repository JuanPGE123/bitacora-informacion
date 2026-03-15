# Sistema de Análisis de Incidentes - Actualización v2.0

## 📋 Resumen de Cambios

Esta versión incluye importantes mejoras en el sistema, especialmente en la visualización y análisis de incidentes.

### ✨ Nuevas Funcionalidades

#### 1. Pestañas de Análisis Separadas

El sistema ahora incluye **tres opciones de análisis independientes**:

- **Análisis de Incidentes Abiertos** (`/analytics/open`)
  - Visualización dedicada exclusivamente a incidentes en estado abierto
  - Gráficos específicos para analizar trabajo pendiente
  
- **Análisis de Incidentes Resueltos** (`/analytics/resolved`)
  - Visualización dedicada exclusivamente a incidentes cerrados/solucionados
  - Métricas de eficiencia y tiempo de resolución
  
- **Análisis General** (`/analytics`)
  - Vista combinada de todos los incidentes
  - Comparativas y tendencias globales

#### 2. Parser Mejorado para Excel

- Ahora el sistema lee automáticamente la hoja **"1-Untitled"** del archivo Excel
- Soporte para fechas en formato Excel serial (números como 45749.385729166665)
- Conversión automática de fechas de Excel a formato JavaScript
- Manejo inteligente de hojas múltiples

---

## 🗂️ Estructura de Análisis

### Análisis de Incidentes Abiertos

**Ubicación:** `Menú → Análisis Abiertos`

**KPIs Principales:**
- **Total Abiertos**: Cantidad total de incidentes pendientes
- **Críticos**: Número de incidentes con prioridad crítica
- **Días Promedio Abierto**: Antigüedad promedio de los incidentes abiertos
- **En Riesgo SLA**: Incidentes que no cumplen con el tiempo ANS

**Gráficos Incluidos:**

1. **Distribución por Prioridad** (Doughnut Chart)
   - Visualiza la proporción de incidentes por nivel de prioridad
   - Colores: Rojo (Crítico), Naranja (Alto), Amarillo (Medio), Verde (Bajo)

2. **Top 10 Analistas** (Horizontal Bar Chart)
   - Muestra los analistas con más incidentes abiertos asignados
   - Útil para identificar carga de trabajo

3. **Antigüedad de Incidentes** (Bar Chart)
   - Agrupa incidentes por tiempo abierto
   - Rangos: 0-7 días, 8-15 días, 16-30 días, 31-60 días, >60 días
   - Código de colores progresivo (verde a rojo)

4. **Cumplimiento SLA** (Doughnut Chart)
   - Proporción de incidentes que cumplen vs no cumplen el ANS
   - Verde: Cumple, Rojo: No cumple

5. **Top 8 Categorías** (Bar Chart)
   - Categorías de producto con más incidentes abiertos
   - Identifica áreas problemáticas

6. **Tendencia de Apertura** (Line Chart)
   - Evolución diaria de incidentes abiertos en los últimos 30 días
   - Identifica patrones y picos de incidentes

**Acciones Disponibles:**
- Exportar a Excel (solo incidentes abiertos)
- Exportar a CSV (solo incidentes abiertos)

---

### Análisis de Incidentes Resueltos

**Ubicación:** `Menú → Análisis Resueltos`

**KPIs Principales:**
- **Total Resueltos**: Cantidad total de incidentes cerrados
- **Tiempo Promedio Resolución**: Horas promedio de solución (en horas)
- **Cumplimiento SLA**: Porcentaje de incidentes resueltos dentro del ANS
- **Resueltos Hoy**: Incidentes solucionados en el día actual

**Gráficos Incluidos:**

1. **Distribución por Tiempo de Resolución** (Bar Chart)
   - Agrupa incidentes por velocidad de resolución
   - Rangos: <24 hrs, 1-3 días, 4-7 días, 8-15 días, >15 días
   - Código de colores: Verde (rápido) a Rojo (lento)

2. **Top 10 Analistas** (Horizontal Bar Chart)
   - Analistas con más incidentes resueltos
   - Métrica de productividad

3. **Tendencia de Resolución** (Line Chart)
   - Evolución diaria de incidentes resueltos en los últimos 30 días
   - Identifica días de mayor productividad

4. **Cumplimiento SLA** (Doughnut Chart)
   - Proporción de resoluciones dentro del tiempo ANS
   - Verde: Cumple, Rojo: No cumple

5. **Distribución por Prioridad** (Doughnut Chart)
   - Clasificación de incidentes resueltos según prioridad original
   - Útil para análisis de backlog

6. **Top 8 Categorías de Producto** (Bar Chart)
   - Categorías con más incidentes resueltos
   - Identifica áreas de mayor volumen de trabajo

**Acciones Disponibles:**
- Exportar a Excel (solo incidentes resueltos)
- Exportar a CSV (solo incidentes resueltos)

---

## 📊 Estructura de Datos del Excel

### Archivo Esperado: `09 1.xlsx`

**Hoja de Datos:** `1-Untitled`

El sistema lee automáticamente la hoja que contiene los incidentes, ignorando hojas de resumen como "Hoja1".

**Columnas Requeridas (46 columnas A-AT):**

| Columna | Nombre | Tipo | Obligatorio |
|---------|--------|------|-------------|
| A | No. Incidente | String | ✅ Sí |
| B | ID de petición | String | No |
| C | Estado | String | ✅ Sí |
| D | Motivo de estatus | String | No |
| E | Incidente mayor | Boolean | No |
| F | Incidente Mayor Asociado | String | No |
| G | Fecha de apertura | Date | ✅ Sí |
| H | Fecha marcación como mayor | Date | No |
| I | Fecha de solución | Date | No |
| J | Fecha de reapertura | Date | No |
| K | Fecha de cierre | Date | No |
| L | Tiempo Suspendido (Hr) | Number | No |
| M | Tiempo efectivo solución (Hr) | Number | No |
| N | Tiempo ANS | Number | No |
| O | Cumple ANS | Boolean | No |
| P | Dominio | String | No |
| Q | Grupo asignado | String | No |
| R | Supervisor | String | No |
| S | Tipo de Grupo | String | No |
| T | Nivel del grupo | Number | No |
| U | Analista asignado | String | No |
| V | Elemento de configuración (CI) | String | No |
| W | Tratamiento especial | String | No |
| X | Caso Problema Asociado | String | No |
| Y | Impacto | String | No |
| Z | Urgencia | String | No |
| AA | Prioridad | String | No |
| AB | Fuente reportada | String | No |
| AC | Nombre Plantilla | String | No |
| AD | External System Ticket | String | No |
| AE | C. Operacional Nivel 1 Compañía | String | No |
| AF | C. Operacional Nivel 2 Aplicación | String | No |
| AG | C. Operacional Nivel 3 Síntoma | String | No |
| AH | Categoría Producto | String | No |
| AI | Categoría de resolución | String | No |
| AJ | Resumen | String | ✅ Sí |
| AK | Descripción | String | No |
| AL | Nota de resolución | String | No |
| AM | Usuario | String | No |
| AN | ID Usuario | String | No |
| AO | Regional | String | No |
| AP | Departamento | String | No |
| AQ | Ubicación | String | No |
| AR | Teléfono de contacto | String | No |
| AS | Corregido Por | String | No |
| AT | Causado Por | String | No |

### Formato de Fechas

El sistema maneja automáticamente **dos formatos de fecha**:

1. **Fecha Serial de Excel** (Ejemplo: `45749.385729166665`)
   - Formato numérico que usa Excel internamente
   - El sistema convierte automáticamente a fecha JavaScript

2. **Fecha de Texto** (Ejemplo: `"2025-01-10"` o `"10/01/2025"`)
   - Formatos de fecha estándar
   - Parseo automático

### Estados de Incidente

El sistema normaliza automáticamente los siguientes estados:

| Estado Original | Estado Normalizado |
|-----------------|-------------------|
| Abierto, Open, Nueva | OPEN |
| Asignado, En proceso, In Progress | IN_PROGRESS |
| Pendiente, Pending, En espera | PENDING |
| Resuelto, Resolved | RESOLVED |
| Cerrado, Closed | CLOSED |
| Cancelado, Cancelled | CANCELLED |

---

## 🚀 Flujo de Trabajo Recomendado

### 1. Carga de Datos

1. Ir a `Menú → Cargar Archivo`
2. **Área Incidentes Abiertos:**
   - Arrastrar archivo Excel con incidentes abiertos
   - O hacer clic para seleccionar archivo
   - Sistema lee automáticamente la hoja "1-Untitled"
3. **Área Incidentes Resueltos:**
   - Arrastrar archivo Excel con incidentes resueltos
   - Sistema procesa y almacena por separado

### 2. Análisis de Incidentes Abiertos

1. Ir a `Menú → Análisis Abiertos`
2. Revisar **KPIs principales** en la parte superior:
   - Identificar total de incidentes pendientes
   - Verificar cantidad de críticos
   - Revisar promedio de días abiertos
   - Detectar incidentes en riesgo de SLA

3. **Análisis de Antigüedad:**
   - Revisar gráfico de antigüedad
   - Identificar incidentes >30 días (potenciales problemas)
   - Priorizar atención a incidentes >60 días

4. **Distribución de Carga:**
   - Revisar top 10 analistas
   - Identificar sobrecarga de trabajo
   - Redistribuir casos si es necesario

5. **Cumplimiento SLA:**
   - Revisar gráfico de cumplimiento
   - Tomar acción sobre incidentes en riesgo

6. **Exportar si es necesario:**
   - Clic en "Exportar Excel" para análisis offline
   - Incluye solo incidentes abiertos

### 3. Análisis de Incidentes Resueltos

1. Ir a `Menú → Análisis Resueltos`
2. Revisar **KPIs de rendimiento**:
   - Verificar tiempo promedio de resolución
   - Revisar porcentaje de cumplimiento SLA
   - Celebrar resueltos del día

3. **Análisis de Eficiencia:**
   - Revisar distribución de tiempos de resolución
   - Identificar casos que tomaron >15 días
   - Analizar causas de demoras

4. **Productividad:**
   - Revisar top 10 analistas por resoluciones
   - Identificar mejores prácticas
   - Reconocer alto desempeño

5. **Tendencias:**
   - Revisar tendencia de 30 días
   - Identificar días de alta/baja productividad
   - Correlacionar con eventos o recursos

---

## 🎨 Navegación del Sistema

### Menú Principal

```
📊 Dashboard
   └─ Vista general con KPIs globales

📤 Cargar Archivo
   ├─ Área: Incidentes Abiertos
   └─ Área: Incidentes Resueltos

🔴 Abiertos
   └─ Tabla detallada de incidentes abiertos

✅ Resueltos
   └─ Tabla detallada de incidentes resueltos

📈 Análisis Abiertos (NUEVO)
   └─ Dashboards y gráficos de incidentes abiertos

📉 Análisis Resueltos (NUEVO)
   └─ Dashboards y gráficos de incidentes resueltos

📊 Análisis General
   └─ Vista combinada de todos los incidentes

🕒 Historial
   └─ Registro de cargas de archivos
```

---

## 🔧 Características Técnicas

### Tecnologías

- **Angular 17.0.0**: Framework principal
- **TypeScript 5.2.2**: Tipado estático
- **Chart.js 4.4.0**: Visualizaciones interactivas
- **XLSX 0.18.5**: Procesamiento de archivos Excel
- **RxJS 7.8.0**: Programación reactiva

### Arquitectura

- **Componentes Standalone**: No requiere módulos NgModule
- **Lazy Loading**: Carga diferida de componentes
- **Servicios Singleton**: Estado centralizado
- **Observables**: Datos reactivos en tiempo real

### Servicios Core

1. **IncidentService**: Gestión de estado de incidentes
   - `getOpenIncidentsObservable()`: Stream de incidentes abiertos
   - `getResolvedIncidentsObservable()`: Stream de incidentes resueltos
   - `setOpenIncidents()`: Almacenar incidentes abiertos
   - `setResolvedIncidents()`: Almacenar incidentes resueltos

2. **FileParserService**: Procesamiento de archivos
   - `parseFile()`: Leer CSV o Excel
   - `parseExcel()`: Extrae hoja "1-Untitled"
   - `excelDateToJSDate()`: Convierte fechas de Excel
   - `mapToIncident()`: Mapea 46 columnas a modelo

3. **AnalyticsService**: Generación de gráficos
   - Métodos para cada tipo de gráfico
   - Configuraciones de Chart.js

4. **KpiService**: Cálculo de métricas
   - KPIs calculados en tiempo real
   - Agregaciones por analista, prioridad, categoría

5. **ExportService**: Exportación de datos
   - Exportar a Excel (XLSX)
   - Exportar a CSV

---

## 📝 Notas Importantes

### Separación de Datasets

- Los **incidentes abiertos** y **resueltos** se almacenan en datasets independientes
- Cada área de análisis filtra automáticamente su dataset correspondiente
- No hay mezcla de datos entre análisis de abiertos y resueltos

### Actualización en Tiempo Real

- Los gráficos se actualizan automáticamente al cargar nuevos archivos
- Los KPIs se recalculan instantáneamente
- No requiere refrescar la página

### Rendimiento

- Los gráficos se destruyen al salir del componente (libera memoria)
- Paginación en tablas para grandes volúmenes
- Procesamiento asíncrono de archivos

### Compatibilidad

- **Navegadores:** Chrome, Firefox, Edge, Safari (últimas 2 versiones)
- **Archivos:** Excel (.xlsx, .xls), CSV (.csv)
- **Tamaño máximo recomendado:** 10 MB por archivo
- **Registros:** Probado hasta 10,000 incidentes

---

## 🐛 Solución de Problemas

### El archivo no se carga

**Problema:** Al arrastrar el archivo no se procesa

**Solución:**
1. Verificar que el archivo sea Excel (.xlsx) o CSV
2. Verificar que tenga la hoja "1-Untitled"
3. Revisar que las columnas obligatorias estén presentes:
   - No. Incidente
   - Estado
   - Resumen

### Las fechas se ven incorrectas

**Problema:** Las fechas aparecen como números raros

**Solución:**
- El sistema convierte automáticamente fechas de Excel
- Si persiste, verificar que la columna tenga formato de fecha en Excel

### Los gráficos no aparecen

**Problema:** Los gráficos están en blanco

**Solución:**
1. Verificar que el archivo tenga datos
2. Refrescar la página (F5)
3. Limpiar caché del navegador

### KPIs muestran 0

**Problema:** Los indicadores están en cero

**Solución:**
1. Verificar que se haya cargado un archivo
2. Revisar que los incidentes tengan el estado correcto
3. Para análisis abiertos: verificar que existan incidentes con estado "Abierto", "Asignado" o "En proceso"
4. Para análisis resueltos: verificar que existan incidentes con estado "Resuelto" o "Cerrado"

---

## 📚 Glosario

- **ANS**: Acuerdo de Nivel de Servicio (SLA en inglés)
- **KPI**: Indicador Clave de Desempeño
- **CI**: Configuration Item (Elemento de Configuración)
- **Tiempo Efectivo de Solución**: Horas reales dedicadas a resolver el incidente (excluyendo tiempo suspendido)
- **Antigüedad**: Días transcurridos desde la apertura del incidente
- **Cumple SLA**: El incidente fue resuelto dentro del tiempo ANS establecido

---

## 🔄 Actualizaciones Futuras (Roadmap)

### Versión 2.1 (Planificada)
- [ ] Filtros avanzados en gráficos
- [ ] Comparación de períodos (mes anterior, año anterior)
- [ ] Alertas automáticas de SLA
- [ ] Reportes programados por email

### Versión 2.2 (Planificada)
- [ ] Dashboard configurable por usuario
- [ ] Exportar gráficos como imagen
- [ ] Integración con API deTicketing
- [ ] Modo oscuro

---

## 📞 Soporte

Para consultas o problemas, contactar al equipo de desarrollo.

**Versión del Sistema:** 2.0  
**Fecha de Actualización:** Enero 2025  
**Última Revisión:** 16/01/2025

---

## 📄 Licencia

© 2025 Incident Analytics. Todos los derechos reservados.
