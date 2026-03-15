# Instrucciones para Deploy en Vercel

## 📦 Configuración de Variables de Entorno

1. **Crear cuenta en Vercel (gratis)**:
   - Ir a: https://vercel.com/signup
   - Conectar con GitHub

2. **Importar el repositorio**:
   - Clic en "**Add New Project**"
   - Seleccionar el repositorio: `bitacora-informacion`
   - Framework Preset: Dejar en "**Other**" (no es necesario build Angular para las functions)

3. **Configurar Variables de Entorno**:
   - En la configuración del proyecto, ir a "**Settings**" → "**Environment Variables**"
   - Agregar las siguientes variables:

   ```
   NOTION_TOKEN=<TU_TOKEN_DE_NOTION>
   NOTION_DATABASE_ID=<TU_DATABASE_ID>
   ```

   **Nota**: Reemplaza `<TU_TOKEN_DE_NOTION>` con el token que obtuviste de la integración de Notion.
   
   - Guardar

4. **Deploy**:
   - Clic en "**Deploy**"
   - Esperar 1-2 minutos
   - Copiar la URL del proyecto (ejemplo: `https://bitacora-informacion.vercel.app`)

5. **Actualizar environment.prod.ts**:
   - Editar el archivo `src/environments/environment.prod.ts`
   - Reemplazar la URL:
   ```typescript
   notionApiUrl: 'https://TU-PROYECTO.vercel.app/api/notion-sync'
   ```
   - Hacer commit y push a GitHub

## 🔧 Verificar Database en Notion

Asegúrate de que tu base de datos en Notion tenga estas columnas **EXACTAMENTE con estos nombres**:

- **Analista** (Tipo: Title/Título)
- **Total Incidentes** (Tipo: Number/Número)
- **Críticos** (Tipo: Number/Número)
- **Altos** (Tipo: Number/Número)
- **Medios** (Tipo: Number/Número)
- **Bajos** (Tipo: Number/Número)
- **Fecha Migración** (Tipo: Date/Fecha)
- **Incidentes** (Tipo: Text/Texto)

## ✅ Probar la Integración

1. Ir a tu app: `https://juanpge123.github.io/bitacora-informacion/`
2. Navegar a "**Por Analista**"
3. Clic en el botón "**📤 Migrar a Notion**"
4. Verificar en Notion que se crearon los registros

## 🐛 Troubleshooting

Si no funciona:
- Verificar que las variables de entorno estén configuradas en Vercel
- Verificar en la consola del navegador (F12) si hay errores
- Verificar los logs en Vercel Dashboard → Functions → Logs
- Verificar que la integración esté conectada con la base de datos en Notion

## 📝 Notas

- La función serverless es **GRATIS** en Vercel (hasta 100GB de bandwidth/mes)
- Los datos viajan: Angular → Vercel Function → Notion API
- El token de Notion NUNCA se expone en el navegador (está en el servidor de Vercel)
