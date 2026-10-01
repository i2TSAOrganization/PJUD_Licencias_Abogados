import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Pagina } from '../../interfaces/api-response';

export { fechaAr } from './fechas';

/** Minúsculas y sin tildes. */
export function sinTildes(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** Matrícula normalizada: minúsculas, solo letras y números (como matricula_norm en la base). */
export function normMatricula(s: string): string {
  return sinTildes(s).replace(/[^a-z0-9]/g, '');
}

/** Mensaje legible de un error: de la API ({ message } o returnset.mensaje) o de un Error. */
export function mensajeError(
  e: unknown,
  porDefecto = 'No se pudo completar la operación.',
): string {
  if (e instanceof HttpErrorResponse) {
    if (e.status === 0) return 'No hay conexión con el servidor.';
    const cuerpo = e.error as { message?: unknown; returnset?: { mensaje?: unknown } } | null;
    const m = cuerpo?.message ?? cuerpo?.returnset?.mensaje;
    if (Array.isArray(m)) return m.join(' ');
    if (typeof m === 'string') return m;
    return porDefecto;
  }
  if (e instanceof Error && e.message) return e.message;
  return porDefecto;
}

/** Parámetros de consulta omitiendo los vacíos. */
export function aParams(valores: Record<string, unknown>): HttpParams {
  let params = new HttpParams();
  for (const [k, v] of Object.entries(valores)) {
    if (v === null || v === undefined) continue;
    const texto = String(v).trim();
    if (texto !== '') params = params.set(k, texto);
  }
  return params;
}

/** Pagina en memoria (por ejemplo, la previsualización de un archivo ya validado). */
export function paginar<T>(items: T[], page: number, size: number): Pagina<T> {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const p = Math.min(Math.max(page, 1), pages);
  return {
    items: items.slice((p - 1) * size, p * size),
    total: items.length,
    page: p,
    size,
    pages,
  };
}

/** Descarga un Blob como archivo. */
export function descargar(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Celda CSV con separador ';' (Excel en español). */
export function celdaCsv(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
