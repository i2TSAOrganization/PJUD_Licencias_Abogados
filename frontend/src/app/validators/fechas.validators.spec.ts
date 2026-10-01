import { FormControl, FormGroup } from '@angular/forms';
import { addDays, startOfDay } from 'date-fns';
import {
  fechaMaxima,
  fechaMinima,
  mensajeErrorFecha,
  noAnteriorA,
  vincularRango,
} from './fechas.validators';

const HOY = startOfDay(new Date());
const AYER = addDays(HOY, -1);
const MANANA = addDays(HOY, 1);

describe('validadores de fecha', () => {
  it('fechaMinima excluyente: hoy no, mañana sí', () => {
    const v = fechaMinima(() => HOY, false);
    expect(v(new FormControl(HOY))).toEqual({ fechaMinima: { min: HOY, incluye: false } });
    expect(v(new FormControl(MANANA))).toBeNull();
  });

  it('fechaMinima incluyente: el mismo día vale', () => {
    expect(fechaMinima(HOY)(new FormControl(HOY))).toBeNull();
    expect(fechaMinima(HOY)(new FormControl(AYER))).not.toBeNull();
  });

  it('fechaMaxima: hoy vale, mañana no', () => {
    expect(fechaMaxima(() => HOY)(new FormControl(HOY))).toBeNull();
    expect(fechaMaxima(() => HOY)(new FormControl(MANANA))).toEqual({ fechaMaxima: { max: HOY } });
  });

  it('vacío no es error (lo controla required)', () => {
    expect(fechaMinima(HOY)(new FormControl(null))).toBeNull();
    expect(fechaMaxima(HOY)(new FormControl(null))).toBeNull();
  });

  it('noAnteriorA + vincularRango: el hasta se revalida al cambiar el desde', () => {
    const form = new FormGroup({
      desde: new FormControl<Date | null>(AYER),
      hasta: new FormControl<Date | null>(HOY, noAnteriorA('desde')),
    });
    vincularRango(form, 'desde', 'hasta');
    expect(form.controls.hasta.valid).toBe(true);
    form.controls.desde.setValue(MANANA);
    expect(form.controls.hasta.hasError('rangoFechas')).toBe(true);
    form.controls.desde.setValue(HOY);
    expect(form.controls.hasta.valid).toBe(true);
  });

  it('mensajeErrorFecha', () => {
    expect(mensajeErrorFecha({ fechaMinima: { min: new Date(2026, 9, 1), incluye: false } })).toBe(
      'Tiene que ser posterior al 01/10/2026.',
    );
    expect(mensajeErrorFecha({ fechaMaxima: { max: new Date(2026, 9, 1) } })).toBe(
      'No puede ser posterior al 01/10/2026.',
    );
    expect(mensajeErrorFecha({ rangoFechas: {} })).toBe('No puede ser anterior a la fecha desde.');
    expect(mensajeErrorFecha({ matDatepickerParse: {} })).toContain('DD/MM/AAAA');
    expect(mensajeErrorFecha(null)).toBe('');
  });
});
