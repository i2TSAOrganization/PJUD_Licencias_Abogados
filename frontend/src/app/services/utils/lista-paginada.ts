import { DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { Observable, Subject, catchError, of, switchMap, tap } from 'rxjs';
import { Pagina } from '../../interfaces/api-response';
import { CampoOrden, FiltrosLicencia, ORDEN_INICIAL, Orden } from '../../interfaces/licencia';
import { mensajeError } from './utils';

export const TAMANO_INICIAL = 10;

type Pedido<T> = (
  filtros: FiltrosLicencia,
  orden: Orden,
  page: number,
  size: number,
) => Observable<T>;

/**
 * Estado de una lista paginada en el servidor: filtros aplicados, orden, página y resultado.
 * Buscar u ordenar vuelve a la página 1. Crear en un contexto de inyección (campo de componente).
 */
export class ListaPaginada<T extends Pagina<unknown>> {
  readonly filtros = signal<FiltrosLicencia>({});
  readonly orden = signal<Orden>(ORDEN_INICIAL);
  readonly page = signal(1);
  readonly size = signal(TAMANO_INICIAL);
  readonly pagina = signal<T | null>(null);
  readonly cargando = signal(false);
  readonly error = signal('');

  private readonly pedir$ = new Subject<void>();

  constructor(
    pedido: Pedido<T>,
    mensajeFallo = 'No se pudo consultar. Intente de nuevo en unos minutos.',
  ) {
    this.pedir$
      .pipe(
        tap(() => {
          this.cargando.set(true);
          this.error.set('');
        }),
        // switchMap descarta la respuesta anterior si llega un pedido nuevo
        switchMap(() =>
          pedido(this.filtros(), this.orden(), this.page(), this.size()).pipe(
            catchError((e) => {
              this.error.set(mensajeError(e, mensajeFallo));
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((r) => {
        this.cargando.set(false);
        if (!r) return;
        this.pagina.set(r);
        this.page.set(r.page);
      });
  }

  buscar(filtros: FiltrosLicencia): void {
    this.filtros.set(filtros);
    this.page.set(1);
    this.recargar();
  }

  /** Encabezado de MatSort: primer clic ascendente, segundo descendente. */
  ordenar(s: Sort): void {
    this.orden.set({ campo: s.active as CampoOrden, dir: s.direction || 'asc' });
    this.page.set(1);
    this.recargar();
  }

  cambiarPagina(e: PageEvent): void {
    if (e.pageSize !== this.size()) {
      this.size.set(e.pageSize);
      this.page.set(1);
    } else {
      this.page.set(e.pageIndex + 1);
    }
    this.recargar();
  }

  recargar(): void {
    this.pedir$.next();
  }
}
