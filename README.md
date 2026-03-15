# Sistema de Análisis de Incidentes - BI Dashboard

## ✅ Sistema Actualizado

El sistema ha sido actualizado con las siguientes mejoras:

### 1. **Modelo de Datos Completo (46 Columnas)**
Ahora el sistema soporta todas las columnas del formato estándar de incidentes:
- A-D: Identificación (No. Incidente, ID Petición, Estado, Motivo)
- E-F: Incidente Mayor
- G-K: Fechas (Apertura, Solución, Cierre, Reapertura)
- L-O: Tiempos y SLA
- P-U: Asignación (Grupo, Analista, Supervisor)
- V-X: CI y Problemas
- Y-AA: Clasificación (Impacto, Urgencia, Prioridad)
- AB-AD: Origen
- AE-AG: Categorización Operacional
- AH-AI: Categorías
- AJ-AL: Descripción (Resumen, Descripción, Nota de Resolución)
- AM-AR: Usuario
- AS-AT: Corrección y Causa

### 2. **Carga Independiente de Archivos**
Ahora puede cargar archivos por separado:
- **Incidentes Abiertos**: Archivo con incidentes en estado Abierto, En Proceso o Pendiente
- **Incidentes Resueltos**: Archivo con incidentes en estado Resuelto o Cerrado

Esta separación facilita la gestión y análisis de los datos.

### 3. **Parser CSV Nativo**
Se eliminó la dependencia de PapaParse y se implementó un parser CSV nativo que:
- Maneja correctamente comillas y caracteres especiales
- Procesa grandes archivos eficientemente
- Es 100% compatible con el sistema de build de Angular

## 🚀 Inicio Rápido

### Instalación
```bash
npm install
```

### Desarrollo
```bash
npm start
```
El sistema se abrirá en `http://localhost:4202`

### Compilación
```bash
npm run build
```

## 📁 Archivos de Ejemplo

Se incluyen dos archivos CSV de ejemplo:

1. **`incidentes_abiertos_ejemplo.csv`**: 10 incidentes en estado Abierto/En Proceso/Pendiente
2. **`incidentes_resueltos_ejemplo.csv`**: 10 incidentes en estado Resuelto/Cerrado

Ambos archivos contienen las 46 columnas requeridas con datos de prueba realistas.

## 📊 Uso del Sistema

### 1. Cargar Archivos
1. Vaya a la sección "Cargar Archivos"
2. Verá dos áreas de carga independientes:
   - **Incidentes Abiertos** (izquierda)
   - **Incidentes Resueltos** (derecha)
3. Arrastre o seleccione el archivo CSV/Excel correspondiente
4. Haga clic en "Procesar Archivo"

### 2. Ver Dashboard
El dashboard muestra automáticamente:
- **KPIs principales**: Total, Abiertos, Resueltos, % Resolución
- **Tiempo promedio de resolución**
- **Incidentes críticos**
- **Analistas activos**

### 3. Analizar Datos
- **Gráficos interactivos**: Distribución por prioridad, analista, tendencias
- **Tablas filtrables**: Busque por texto, filtre por estado, prioridad, categoría
- **Exportación**: Exporte los datos filtrados a Excel o CSV

### 4. Historial
Vea el historial de archivos cargados con:
- Nombre del archivo
- Fecha de carga
- Cantidad de incidentes procesados

## 🗂️ Estructura de Columnas CSV/Excel

### Columnas Obligatorias
- **No. Incidente** (Columna A)
- **Estado** (Columna C)
- **Resumen** (Columna AJ)

### Columnas Opcionales
Todas las demás 43 columnas son opcionales. Si están vacías, se mostrarán como "-" en el sistema.

### Formato de Datos

#### Estados Aceptados
- Abierto / Open
- En Proceso / In Progress
- Pendiente / Pending
- Resuelto / Resolved
- Cerrado / Closed
- Cancelado / Cancelled

#### Prioridades/Impacto/Urgencia
- `1-Crítico` o simplemente `1`, `Crítico`, `Critical`
- `2-Alto` o `2`, `Alto`, `High`
- `3-Medio` o `3`, `Medio`, `Medium`
- `4-Bajo` o `4`, `Bajo`, `Low`

#### Fechas
- Formato preferido: `YYYY-MM-DD` (ej: `2024-01-15`)
- También acepta: `DD/MM/YYYY`, `MM/DD/YYYY`
- Formato Excel (número serial) también es soportado

#### Booleanos (Incidente mayor, Cumple ANS)
- Verdadero: `true`, `yes`, `sí`, `si`, `1`, `x`
- Falso: `false`, `no`, `0`, (vacío)

## 📱 Características Principales

### Dashboard Interactivo
- Visualización en tiempo real de métricas clave
- Gráficos de barras, donas y líneas con Chart.js
- Diseño responsive adaptable a cualquier dispositivo

### Gestión de Incidentes
- Vista separada para incidentes abiertos y resueltos
- Búsqueda y filtrado avanzado
- Ordenamiento por cualquier columna
- Paginación configurable

### Análisis Avanzado
- Distribución por prioridad, impacto y urgencia
- Estadísticas por analista y grupo
- Tendencias diarias
- Cumplimiento de SLA

### Exportación
- Exportar a Excel (.xlsx)
- Exportar a CSV
- Mantiene los filtros aplicados
- Estructura personalizable

## 🛠️ Tecnologías

- **Angular 17**: Framework principal
- **TypeScript 5.2**: Lenguaje de desarrollo
- **Chart.js 4.4**: Visualización de datos
- **XLSX**: Procesamiento de archivos Excel
- **RxJS**: Programación reactiva
- **SCSS**: Estilos modulares

## 📝 Notas Importantes

1. **Tamaño máximo de archivo**: 10 MB
2. **Formatos soportados**: CSV, XLSX, XLS
3. **Separación de archivos**: Los archivos de abiertos y resueltos se cargan independientemente
4. **Persistencia**: Los datos se mantienen en memoria durante la sesión
5. **Validación**: El sistema valida que existan las columnas obligatorias

## 🐛 Solución de Problemas

### Error: "Formato de archivo no soportado"
- Asegúrese de usar archivos CSV o Excel (.xlsx, .xls)

### Error: "Fila X omitida: datos incompletos"
- Verifique que la fila tenga al menos: No. Incidente, Estado y Resumen

### El archivo no se procesa
- Revise que la primera fila contenga los nombres de las columnas
- Verifique que las columnas estén separadas por comas (CSV)

### Los gráficos no muestran datos
- Asegúrese de haber cargado al menos un archivo
- Verifique que haya incidentes procesados exitosamente

## 📧 Soporte

Para más información o soporte, consulte la documentación completa en la carpeta `/docs`.

---

**Versión**: 2.0  
**Última actualización**: Marzo 2026
