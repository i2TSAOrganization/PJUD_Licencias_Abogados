import { HttpErrorResponse } from '@angular/common/http';
import { BackPendienteError } from './back-pendiente';
import {
  aParams,
  celdaCsv,
  fechaAr,
  mensajeError,
  normMatricula,
  paginar,
  sinTildes,
} from './utils';

describe('utils', () => {
  it('fechaAr no corre el día por zona horaria', () => {
    expect(fechaAr('2026-10-13')).toBe('13/10/2026');
    expect(fechaAr(null)).toBe('');
  });

  it('normMatricula ignora puntuación, espacios y mayúsculas', () => {
    expect(normMatricula('T° 7 F° 280')).toBe('t7f280');
    expect(normMatricula('R-4412')).toBe('r4412');
  });

  it('sinTildes', () => {
    expect(sinTildes('García ÑANDÚ')).toBe('garcia nandu');
  });

  it('mensajeError lee message, returnset.mensaje y errores comunes', () => {
    expect(
      mensajeError(new HttpErrorResponse({ status: 400, error: { message: ['a', 'b'] } })),
    ).toBe('a b');
    expect(
      mensajeError(
        new HttpErrorResponse({ status: 422, error: { returnset: { mensaje: 'Tope' } } }),
      ),
    ).toBe('Tope');
    expect(mensajeError(new HttpErrorResponse({ status: 0 }))).toBe(
      'No hay conexión con el servidor.',
    );
    expect(mensajeError(new BackPendienteError('guardar'))).toBe(
      'Pendiente de integrar con el back: guardar.',
    );
  });

  it('celdaCsv escapa separador y comillas', () => {
    expect(celdaCsv('a;b')).toBe('"a;b"');
    expect(celdaCsv('di "x"')).toBe('"di ""x"""');
    expect(celdaCsv(null)).toBe('');
  });

  it('aParams omite vacíos', () => {
    const p = aParams({ page: 1, nombre: '  ', colegioId: '', dias: null, matricula: ' R-1 ' });
    expect(p.keys()).toEqual(['page', 'matricula']);
    expect(p.get('matricula')).toBe('R-1');
  });

  describe('paginar', () => {
    const filas = Array.from({ length: 60 }, (_, i) => i + 1);

    it('corta la página pedida', () => {
      expect(paginar(filas, 3, 25)).toMatchObject({
        items: filas.slice(50),
        total: 60,
        page: 3,
        pages: 3,
      });
    });

    it('una página fuera de rango devuelve la última', () => {
      expect(paginar(filas, 9, 25).page).toBe(3);
    });

    it('sin filas devuelve una página vacía', () => {
      expect(paginar([], 1, 25)).toMatchObject({ items: [], total: 0, page: 1, pages: 1 });
    });
  });
});
