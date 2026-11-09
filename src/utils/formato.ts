const quetzales = new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' });
const ZONA = 'America/Guatemala';

/** Dinero en quetzales: q(1234.5) → "Q 1,234.50". */
export function q(valor: number | null | undefined): string {
  return quetzales.format(valor ?? 0);
}

/** Fecha y hora en hora de Guatemala. Las fechas llegan en UTC desde la API. */
export function fechaHora(valor: string | null | undefined): string {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '—';
  return new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short', timeZone: ZONA }).format(fecha);
}

export function soloFecha(valor: string | null | undefined): string {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '—';
  return new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeZone: ZONA }).format(fecha);
}

/** AAAA-MM-DD (en Guatemala) de una fecha que llega en UTC: sirve para llenar <input type="date">. */
export function fechaGT(valor: string | null | undefined): string {
  if (!valor) return '';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(fecha);
}

/** AAAA-MM-DD del día de hoy en Guatemala (el formato que pide la API para rangos de fechas). */
export function hoyISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date());
}

/** AAAA-MM-DD de hace `dias` días, en Guatemala. */
export function haceDiasISO(dias: number): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(new Date(Date.now() - dias * 24 * 60 * 60 * 1000));
}

/** Texto vacío → undefined (los campos opcionales no deben viajar como cadena vacía). */
export function opcional(valor: string | undefined | null): string | undefined {
  const limpio = valor?.trim();
  return limpio ? limpio : undefined;
}
