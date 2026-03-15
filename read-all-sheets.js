const XLSX = require('xlsx');

// Leer el archivo Excel
const workbook = XLSX.readFile('09 1.xlsx');

console.log('=== TODAS LAS HOJAS DEL ARCHIVO ===');
workbook.SheetNames.forEach((name, index) => {
  console.log(`${index + 1}. ${name}`);
});

console.log('\n=== ANALIZANDO CADA HOJA ===\n');

workbook.SheetNames.forEach((sheetName) => {
  console.log(`\n--- HOJA: ${sheetName} ---`);
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  
  console.log(`Total de registros: ${data.length}`);
  
  if (data.length > 0) {
    console.log('Columnas:', Object.keys(data[0]).join(', '));
    console.log('\nPrimeros 5 registros:');
    data.slice(0, 5).forEach((row, i) => {
      console.log(`\nRegistro ${i + 1}:`);
      console.log(JSON.stringify(row, null, 2));
    });
  }
});
