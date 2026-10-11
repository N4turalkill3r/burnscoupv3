const pad = (n: number) => String(n).padStart(2, '0');

/** Fecha → valor para <input type="datetime-local"> en hora local (YYYY-MM-DDTHH:mm). */
export function toLocalInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function nowLocalInputValue(): string {
  return toLocalInputValue(new Date());
}

/** Valor de <input type="datetime-local"> → Date (hora local). Null si está vacío o es inválido. */
export function parseLocalInput(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Horas transcurridas entre dos valores datetime-local. Null si falta alguno. */
export function hoursBetween(startValue: string, endValue: string): number | null {
  const start = parseLocalInput(startValue);
  const end = parseLocalInput(endValue);
  if (!start || !end) return null;
  return (end.getTime() - start.getTime()) / 3_600_000;
}

/** Resta minutos a un valor datetime-local. */
export function minusMinutes(value: string, minutes: number): string {
  const date = parseLocalInput(value);
  if (!date) return '';
  return toLocalInputValue(new Date(date.getTime() - minutes * 60_000));
}

/** Valor datetime-local + horas → "08/10 14:30" (hora local). Cadena vacía si falta la hora base. */
export function clockAfter(value: string, hours: number): string {
  const date = parseLocalInput(value);
  if (!date) return '';
  const result = new Date(date.getTime() + hours * 3_600_000);
  return `${pad(result.getDate())}/${pad(result.getMonth() + 1)} ${pad(result.getHours())}:${pad(
    result.getMinutes(),
  )}`;
}

/** 3.25 → "3 h 15 min". */
export function formatHours(hours: number): string {
  const totalMinutes = Math.round(Math.abs(hours) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}
