import { Observable, throwError } from 'rxjs';
import { Pagina } from '../../interfaces/api-response';

/**
 * Las llamadas al back quedan vacías hasta que la API esté lista.
 * Las consultas devuelven resultados vacíos; las operaciones que modifican datos fallan con
 * este error, para que la pantalla no muestre un "guardado" que no ocurrió.
 */
export class BackPendienteError extends Error {
  constructor(operacion: string) {
    super(`Pendiente de integrar con el back: ${operacion}.`);
    this.name = 'BackPendienteError';
  }
}

export function backPendiente<T>(operacion: string): Observable<T> {
  return throwError(() => new BackPendienteError(operacion));
}

export function paginaVacia<T>(page: number, size: number): Pagina<T> {
  return { items: [], total: 0, page, size, pages: 1 };
}
