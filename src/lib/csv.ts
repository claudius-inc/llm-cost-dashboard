/**
 * Simple CSV generation utility.
 * Handles proper escaping of quotes, commas, and newlines per RFC 4180.
 */

/**
 * Escape a single cell value for CSV.
 * If the value contains a comma, double-quote, or newline, wrap it in double-quotes
 * and escape any internal double-quotes by doubling them.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert headers and rows into a CSV string.
 * @param headers - Column header names
 * @param rows - Array of row arrays (each row is an array of cell values)
 * @returns CSV string with CRLF line endings per RFC 4180
 */
export function toCsv(headers: string[], rows: unknown[][]): string {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const dataLines = rows.map(row => row.map(escapeCsvCell).join(','));
  return [headerLine, ...dataLines].join('\r\n');
}
