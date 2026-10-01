import { addDays, format, isValid, parseISO, startOfDay } from 'date-fns';

/** Hoy a las 00:00 (hora local). */
export function hoy(): Date {
  return startOfDay(new Date());
}

/** Mañana a las 00:00 (hora local). */
export function manana(): Date {
  return addDays(hoy(), 1);
}

/** Date del datepicker -> 'AAAA-MM-DD' para la API. */
export function aIso(d: Date | null | undefined): string | null {
  return d && isValid(d) ? format(d, 'yyyy-MM-dd') : null;
}

/** 'AAAA-MM-DD' de la API -> Date local (sin corrimiento de zona horaria). */
export function desdeIso(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = parseISO(iso);
  return isValid(d) ? startOfDay(d) : null;
}

/** 'AAAA-MM-DD' -> 'DD/MM/AAAA', sin pasar por Date. */
export function fechaAr(iso: string | null | undefined): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}
