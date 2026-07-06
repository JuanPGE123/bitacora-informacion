/**
 * Arma texto separado por tabulador (encabezado + filas) para que al pegarlo en
 * Excel/Word quede en columnas, igual que si se copiara directamente del Excel.
 */
export function buildIncidentsTsv(rows: Record<string, string | number>[]): string {
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]);
  const lines = [headers.join('\t')];

  for (const row of rows) {
    lines.push(headers.map(h => String(row[h] ?? '')).join('\t'));
  }

  return lines.join('\n');
}
