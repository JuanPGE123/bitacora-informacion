# 📊 Guía de Uso - Incident Analytics Dashboard

## 🚀 Inicio Rápido

### 1. Instalación de Dependencias

```bash
npm install
```

### 2. Ejecutar la Aplicación

```bash
npm start
```

La aplicación se abrirá en: `http://localhost:4202`

## 📝 Uso del Sistema

### Paso 1: Cargar Archivo de Incidentes

1. Navega a **"Cargar Archivo"** en el menú lateral
2. Arrastra y suelta un archivo CSV o Excel, o haz clic en "Seleccionar Archivo"
3. Haz clic en **"Procesar Archivo"**
4. Espera la confirmación de carga exitosa

**Archivo de Prueba**: Encuentra un ejemplo en `sample-data/incidentes_ejemplo.csv`

### Paso 2: Visualizar el Dashboard

1. Ve a **"Dashboard"** en el menú
2. Observa los KPIs principales:
   - Total de incidentes
   - Incidentes abiertos
   - Incidentes resueltos
   - Porcentaje de resolución
   - Tiempo promedio de resolución
   - Analistas activos
   - Incidentes críticos
   - Incidentes pendientes

### Paso 3: Explorar Incidentes Abiertos

1. Navega a **"Abiertos"**
2. Usa los filtros para buscar:
   - Por analista
   - Por prioridad
   - Por categoría
   - Por texto (ID, nombre, etc.)
3. Ordena columnas haciendo clic en los encabezados
4. Navega con la paginación

### Paso 4: Revisar Incidentes Resueltos

1. Ve a **"Resueltos"**
2. Revisa los incidentes completados
3. Observa las fechas de resolución
4. Aplica filtros según necesites

### Paso 5: Analizar Gráficos

1. Accede a **"Análisis"**
2. Visualiza:
   - **Incidentes por Analista**: Gráfico de barras
   - **Distribución por Prioridad**: Gráfico de dona
   - **Tendencia de Incidentes**: Gráfico de línea
   - **Abiertos vs Resueltos**: Gráfico comparativo
3. Exporta datos en Excel o CSV

### Paso 6: Consultar Historial

1. Ve a **"Historial"**
2. Revisa todos los archivos cargados
3. Ve estadísticas de cada carga
4. Elimina archivos del historial si lo deseas

## 📋 Formato del Archivo CSV/Excel

### Columnas Requeridas

| Columna | Descripción | Obligatorio |
|---------|-------------|-------------|
| `id` | ID único del incidente | ✅ Sí |
| `analyst` | Nombre del analista | ✅ Sí |
| `status` | Estado (Open, Resolved, etc.) | ✅ Sí |
| `priority` | Prioridad (Critical, High, Medium, Low) | ⚠️ Recomendado |
| `category` | Categoría del incidente | ⚠️ Recomendado |
| `created_date` | Fecha de creación | ⚠️ Recomendado |
| `resolved_date` | Fecha de resolución | ❌ Opcional |
| `title` | Título del incidente | ❌ Opcional |
| `description` | Descripción detallada | ❌ Opcional |

### Nombres Alternativos de Columnas

El sistema reconoce automáticamente nombres alternativos:

- **ID**: `id`, `incident_id`, `incidente_id`, `ticket_id`
- **Analista**: `analyst`, `analista`, `assignee`, `asignado`
- **Estado**: `status`, `estado`, `state`
- **Prioridad**: `priority`, `prioridad`
- **Categoría**: `category`, `categoria`, `type`, `tipo`
- **Fecha Creación**: `created_date`, `fecha_creacion`, `open_date`, `created`
- **Fecha Resolución**: `resolved_date`, `fecha_resolucion`, `close_date`, `resolved`

### Valores de Estado Reconocidos

- **Abierto**: "Open", "Abierto"
- **Resuelto**: "Resolved", "Resuelto", "Closed", "Cerrado"
- **En Progreso**: "In Progress", "En Progreso"
- **Pendiente**: "Pending", "Pendiente"

### Valores de Prioridad

- **Crítica**: "Critical", "Crítico"
- **Alta**: "High", "Alta", "Alto"
- **Media**: "Medium", "Media", "Medio"
- **Baja**: "Low", "Baja", "Bajo"

## 🎨 Características Principales

### Dashboard KPI

- **Tarjetas Interactivas**: Visualización clara de métricas clave
- **Código de Colores**: Identificación rápida de estados
- **Barra de Progreso**: Tasa de resolución visual

### Tablas Inteligentes

- **Ordenamiento**: Haz clic en cualquier columna
- **Filtros Múltiples**: Combina varios criterios
- **Búsqueda Rápida**: Encuentra incidentes al instante
- **Paginación**: Navega grandes volúmenes de datos

### Gráficos Analíticos

- **Chart.js**: Visualizaciones profesionales
- **Interactivos**: Hover para ver detalles
- **Responsivos**: Se adaptan a cualquier pantalla

### Exportación

- **Excel (.xlsx)**: Formato completo con formato
- **CSV**: Compatible con cualquier herramienta

## 🛠️ Comandos Disponibles

```bash
# Desarrollo
npm start                # Inicia servidor de desarrollo
npm run watch           # Build en modo watch

# Producción
npm run build           # Build de producción
```

## 📱 Responsive Design

El sistema es completamente responsive y funciona en:

- 🖥️ **Desktop**: Experiencia completa
- 📱 **Tablet**: Navegación optimizada
- 📱 **Mobile**: Menú adaptativo

## ⚙️ Configuración Avanzada

### Cambiar Puerto

Edita `angular.json`:

```json
"serve": {
  "options": {
    "port": 4300
  }
}
```

### Límites de Archivo

Por defecto, el sistema acepta archivos hasta **10MB**.

Para cambiarlo, edita `src/app/core/services/file-parser.service.ts`:

```typescript
const maxSize = 20 * 1024 * 1024; // 20MB
```

## 🔧 Solución de Problemas

### El archivo no se procesa

1. Verifica que el archivo sea CSV o Excel (.xlsx, .xls)
2. Asegúrate de que las columnas obligatorias existan
3. Revisa que no haya caracteres especiales en los nombres de columnas

### Los gráficos no se muestran

1. Asegúrate de haber cargado datos
2. Verifica que Chart.js esté instalado: `npm install chart.js ng2-charts`

### Error al exportar

1. Verifica que XLSX esté instalado: `npm install xlsx`

## 📞 Soporte

Para problemas o sugerencias, revisa los logs de la consola del navegador (F12).

## 🎓 Próximos Pasos

1. **Autenticación**: Agrega login de usuarios
2. **Base de Datos**: Conecta a SQL Server o MongoDB
3. **API REST**: Integra con backend
4. **Alertas**: Notificaciones automáticas
5. **ITSM**: Integración con ServiceNow/Jira

---

¡Disfruta usando Incident Analytics Dashboard! 🚀
