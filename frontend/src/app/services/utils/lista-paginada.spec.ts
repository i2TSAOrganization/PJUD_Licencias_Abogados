import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Pagina } from '../../interfaces/api-response';
import { FiltrosLicencia, Orden } from '../../interfaces/licencia';
import { ListaPaginada, TAMANO_INICIAL } from './lista-paginada';

describe('ListaPaginada', () => {
  const pedidos: { f: FiltrosLicencia; o: Orden; p: number; s: number }[] = [];
  let lista: ListaPaginada<Pagina<number>>;

  beforeEach(() => {
    pedidos.length = 0;
    lista = TestBed.runInInjectionContext(
      () =>
        new ListaPaginada<Pagina<number>>((f, o, p, s) => {
          pedidos.push({ f, o, p, s });
          return of({ items: [], total: 300, page: p, size: s, pages: Math.ceil(300 / s) });
        }),
    );
  });

  it('empieza con 10 filas, ordenada por fecha de comienzo descendente', () => {
    lista.recargar();
    expect(pedidos[0]).toMatchObject({
      p: 1,
      s: TAMANO_INICIAL,
      o: { campo: 'fechaComienzo', dir: 'desc' },
    });
  });

  it('buscar y ordenar vuelven a la página 1', () => {
    lista.cambiarPagina({ pageIndex: 4, pageSize: 10, length: 300 });
    expect(pedidos.at(-1)?.p).toBe(5);
    lista.ordenar({ active: 'nombre', direction: 'asc' });
    expect(pedidos.at(-1)).toMatchObject({ p: 1, o: { campo: 'nombre', dir: 'asc' } });
    lista.cambiarPagina({ pageIndex: 2, pageSize: 10, length: 300 });
    lista.buscar({ nombre: 'sosa' });
    expect(pedidos.at(-1)).toMatchObject({ p: 1, f: { nombre: 'sosa' } });
  });

  it('cambiar el tamaño de página vuelve a la página 1', () => {
    lista.cambiarPagina({ pageIndex: 3, pageSize: 25, length: 300 });
    expect(pedidos.at(-1)).toMatchObject({ p: 1, s: 25 });
  });
});
