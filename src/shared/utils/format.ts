const formatters = new Map<number, Intl.NumberFormat>();

function formatterFor(digits: number): Intl.NumberFormat {
  let f = formatters.get(digits);
  if (!f) {
    f = new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
    formatters.set(digits, f);
  }
  return f;
}

/** Número con coma decimal (p. ej. 12,5). */
export function formatNumber(value: number, digits = 1): string {
  return formatterFor(digits).format(value);
}

/** Porcentaje de superficie corporal (p. ej. "18,5 %"). */
export function formatPercent(value: number, digits = 1): string {
  return `${formatNumber(value, digits)} %`;
}

export function formatMl(value: number): string {
  return `${formatNumber(Math.round(value), 0)} ml`;
}

export function formatMlPerHour(value: number): string {
  return `${formatNumber(value, 0)} ml/h`;
}

/** Lee un número escrito con coma o punto decimal. Devuelve null si no es válido. */
export function parseDecimal(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (normalized === '') return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}
