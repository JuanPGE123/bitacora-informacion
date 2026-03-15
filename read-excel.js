const XLSX = require('xlsx');
const path = require('path');

// Leer el archivo Excel
const workbook = XLSX.readFile('09 1.xlsx');

// Obtener la primera hoja
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convertir a JSON
const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

console.log('=== INFORMACIÓN DEL ARCHIVO ===');
console.log('Nombre de la hoja:', sheetName);
console.log('Total de registros:', data.length);
console.log('\n=== COLUMNAS ENCONTRADAS ===');

if (data.length > 0) {
  const columns = Object.keys(data[0]);
  columns.forEach((col, index) => {
    console.log(`${index + 1}. ${col}`);
  });
  
  console.log('\n=== PRIMER REGISTRO (EJEMPLO) ===');
  console.log(JSON.stringify(data[0], null, 2));
  
  console.log('\n=== TIPOS DE DATOS DETECTADOS ===');
  const firstRow = data[0];
  Object.entries(firstRow).forEach(([key, value]) => {
    const type = typeof value;
    const sample = type === 'string' ? `"${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"` : value;
    console.log(`${key}: ${type} - Ejemplo: ${sample}`);
  });
}
