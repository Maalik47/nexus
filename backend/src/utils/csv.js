'use strict';

/**
 * Minimal RFC-4180-ish CSV helpers (no external dependency).
 * Handles quoted fields, escaped quotes and commas/newlines inside quotes.
 */

function escapeValue(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(rows, columns) {
  const cols = columns || (rows.length ? Object.keys(rows[0]) : []);
  const header = cols.map(escapeValue).join(',');
  const body = rows.map((row) => cols.map((c) => escapeValue(row[c])).join(','));
  return [header, ...body].join('\r\n');
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const input = String(text).replace(/^\uFEFF/, '');

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char === '\r') {
      // ignore, \n handles the row break
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const nonEmpty = rows.filter((r) => r.some((c) => String(c).trim() !== ''));
  if (nonEmpty.length === 0) return [];

  const header = nonEmpty[0].map((h) => h.trim());
  return nonEmpty.slice(1).map((cells) => {
    const obj = {};
    header.forEach((key, index) => {
      obj[key] = (cells[index] ?? '').trim();
    });
    return obj;
  });
}

module.exports = { toCsv, parseCsv, escapeValue };
