# 🚀 INSTRUCCIONES DE INICIO - Analizador de Backlog

## ✅ Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior)
  - Descarga: https://nodejs.org/
  - Verifica: `node --version`

- **npm** (incluido con Node.js)
  - Verifica: `npm --version`

- **Angular CLI** (opcional pero recomendado)
  - Instala: `npm install -g @angular/cli`
  - Verifica: `ng version`

## 📦 Instalación

### Paso 1: Instalar Dependencias

Abre una terminal/PowerShell en la carpeta del proyecto y ejecuta:

```bash
npm install
```

Este comando instalará todas las dependencias necesarias:
- Angular 17
- TypeScript
- Chart.js
- PapaParse
- XLSX
- Y todas las demás librerías

**Tiempo estimado**: 2-5 minutos (dependiendo de tu conexión)

### Paso 2: Verificar Instalación

```bash
npm list --depth=0
```

Deberías ver todas las dependencias listadas sin errores.

## 🎯 Ejecución

### Modo Desarrollo

```bash
npm start
```

O alternativamente:

```bash
ng serve
```

**Resultado**: 
- La aplicación se compilará
- Se abrirá automáticamente en tu navegador
- URL: `http://localhost:4202`

**Nota**: El servidor se recargará automáticamente cuando hagas cambios en el código.

### Modo Producción (Build)

```bash
npm run build
```

Los archivos compilados se generarán en la carpeta `dist/`.

## 📝 Primer Uso

### 1. Cargar Datos de Ejemplo

1. Inicia la aplicación (`npm start`)
2. En el navegador, ve a `http://localhost:4202`
3. Haz clic en **"Cargar Archivo"** en el menú lateral
4. Carga el archivo de ejemplo: `sample-data/incidentes_ejemplo.csv`
5. Haz clic en **"Procesar Archivo"**
6. ¡Verás el mensaje de éxito!

### 2. Explorar el Dashboard

1. Navega a **"Dashboard"** en el menú
2. Observa los KPIs calculados automáticamente
3. Explora las diferentes secciones

### 3. Ver Gráficos Analíticos

1. Ve a **"Análisis"** en el menú
2. Observa los gráficos generados
3. Prueba exportar los datos

## 🔧 Solución de Problemas

### Error: "Cannot find module"

**Solución**:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Puerto 4202 ya en uso

**Solución**: Usa otro puerto:
```bash
ng serve --port 4300
```

### Error al compilar TypeScript

**Solución**: Verifica la versión de Node.js:
```bash
node --version  # Debe ser v18 o superior
```

### Gráficos no se muestran

**Solución**: Reinstala Chart.js:
```bash
npm install chart.js ng2-charts --save
```

## 📂 Estructura de Archivos Clave

```
bitacora-informacion/
├── src/
│   ├── app/
│   │   ├── core/              # Servicios y modelos
│   │   ├── modules/           # Componentes por funcionalidad
│   │   ├── shared/            # Componentes reutilizables
│   │   ├── app.component.ts   # Componente principal
│   │   └── app.routes.ts      # Configuración de rutas
│   ├── index.html             # HTML principal
│   ├── main.ts               # Punto de entrada
│   └── styles.scss           # Estilos globales
├── sample-data/              # Datos de ejemplo
├── package.json              # Dependencias
├── angular.json              # Configuración Angular
└── tsconfig.json            # Configuración TypeScript
```

## 📚 Recursos Adicionales

- **README.md**: Descripción general del proyecto
- **GUIA_DE_USO.md**: Manual de usuario completo
- **ARQUITECTURA.md**: Documentación técnica detallada

## 🎓 Próximos Pasos

1. ✅ Ejecuta el proyecto
2. ✅ Carga el archivo de ejemplo
3. ✅ Explora todas las funcionalidades
4. 🔧 Personaliza según tus necesidades
5. 🚀 Despliega en producción

## ❓ Comandos Útiles

```bash
# Instalar dependencias
npm install

# Iniciar servidor desarrollo
npm start

# Build de producción
npm run build

# Ver cambios en tiempo real
npm run watch

# Limpiar caché de npm
npm cache clean --force
```

## 📞 Soporte

Si encuentras problemas:

1. **Revisa la consola** del navegador (F12)
2. **Verifica la terminal** donde corre `npm start`
3. **Consulta la documentación** en los archivos .md
4. **Revisa que todas las dependencias** estén instaladas

## ✨ ¡Listo!

Tu sistema de análisis de incidentes está completo y listo para usar.

**Disfruta analizando tus datos** 📊🚀

---

**Nota**: Este es un sistema funcional listo para desarrollo. Para producción, considera agregar:
- Autenticación de usuarios
- Conexión a base de datos
- API REST backend
- Tests unitarios
- CI/CD pipeline
