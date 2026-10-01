import { addDays } from 'date-fns';
import { LicenciaCarga } from '../../../../interfaces/licencia';
import { aIso, hoy } from '../../../../services/utils/fechas';
import { TipoLicencia } from '../../../../interfaces/tipo-licencia';
import {
  aRequest,
  aplicarTipo,
  cargarEnForm,
  crearFormLicencia,
  limpiarForm,
  minimoComienzo,
  separarNombre,
  unirNombre,
} from './carga-individual.form';

const EN_10_DIAS = aIso(addDays(hoy(), 10))!;
const HACE_10_DIAS = aIso(addDays(hoy(), -10))!;

const FALLECIMIENTO: TipoLicencia = {
  id: 1,
  codigo: 'FALL',
  nombre: 'Fallecimiento de familiar directo',
  diasHabiles: 3,
  maximoAnual: 3,
  bloqueaTope: false,
};
const MATERNIDAD: TipoLicencia = {
  id: 2,
  codigo: 'MAT',
  nombre: 'Maternidad, paternidad o adopción',
  diasHabiles: 30,
  maximoAnual: null,
  bloqueaTope: false,
};
const OTRO: TipoLicencia = {
  id: 9,
  codigo: 'OTRO',
  nombre: 'Otro (días a mano)',
  diasHabiles: null,
  maximoAnual: null,
  bloqueaTope: false,
};

describe('formulario de licencia', () => {
  let form: ReturnType<typeof crearFormLicencia>;

  beforeEach(() => (form = crearFormLicencia()));

  it('sin tipo, los días están deshabilitados', () => {
    expect(form.controls.diasHabiles.disabled).toBe(true);
  });

  it('un tipo con días fijos completa los días y no deja escribirlos (RN-19)', () => {
    aplicarTipo(form, FALLECIMIENTO);
    expect(form.controls.diasHabiles.value).toBe(3);
    expect(form.controls.diasHabiles.disabled).toBe(true);
    expect(form.controls.observacion.hasError('required')).toBe(false);
  });

  it('«Otro» habilita los días y vuelve obligatoria la observación (RN-20)', () => {
    aplicarTipo(form, OTRO);
    expect(form.controls.diasHabiles.enabled).toBe(true);
    expect(form.controls.diasHabiles.value).toBeNull();
    expect(form.controls.observacion.hasError('required')).toBe(true);
    form.controls.observacion.setValue('   ');
    expect(form.controls.observacion.hasError('required')).toBe(true);
    form.controls.observacion.setValue('Licencia por capacitación');
    expect(form.controls.observacion.valid).toBe(true);
  });

  it('pasar de «Otro» a un tipo fijo usa los días del tipo', () => {
    aplicarTipo(form, OTRO);
    form.controls.diasHabiles.setValue(12);
    aplicarTipo(form, MATERNIDAD);
    expect(form.controls.diasHabiles.value).toBe(30);
    expect(form.controls.observacion.hasError('required')).toBe(false);
  });

  it('rechaza 0 y 2,5 días (RN-02)', () => {
    aplicarTipo(form, OTRO);
    form.controls.diasHabiles.setValue(0);
    expect(form.controls.diasHabiles.hasError('min')).toBe(true);
    form.controls.diasHabiles.setValue(2.5);
    expect(form.controls.diasHabiles.hasError('entero')).toBe(true);
    form.controls.diasHabiles.setValue(5);
    expect(form.controls.diasHabiles.valid).toBe(true);
  });

  it('al corregir trae todos los datos, incluidos tipo «Otro», días y observación (CU-04)', () => {
    const l: LicenciaCarga = {
      id: 7,
      colegio: { id: 2, nombre: 'Rosario', circunscripcion: 2 },
      apellidoNombre: 'ALCARAZ, Sofía',
      matricula: 'R-4412',
      tipoProfesional: 'P',
      fechaComienzo: EN_10_DIAS,
      diasHabiles: 5,
      tipo: { id: 9, nombre: 'Otro (días a mano)' },
      observacion: 'Licencia por capacitación',
      anulada: false,
      loteNumero: null,
    };
    cargarEnForm(form, l, OTRO);
    expect(form.valid).toBe(true);
    expect(aRequest(form)).toEqual({
      colegioId: 2,
      apellidoNombre: 'ALCARAZ, Sofía',
      matricula: 'R-4412',
      tipoProfesional: 'P',
      fechaComienzo: EN_10_DIAS,
      tipoLicenciaId: 9,
      diasHabiles: 5,
      observacion: 'Licencia por capacitación',
    });
  });

  it('aRequest recorta espacios y manda observación vacía como null', () => {
    form.patchValue({
      colegioId: 1,
      nombre: ' Juan ',
      apellido: ' pérez ',
      tipoProfesional: 'A',
      matricula: ' T° 1 ',
      fechaComienzo: addDays(hoy(), 3),
      tipoLicenciaId: 1,
    });
    aplicarTipo(form, FALLECIMIENTO);
    form.controls.observacion.setValue('   ');
    expect(aRequest(form)).toMatchObject({
      apellidoNombre: 'PÉREZ, Juan',
      matricula: 'T° 1',
      diasHabiles: 3,
      observacion: null,
    });
  });

  describe('fecha de comienzo', () => {
    it('en un alta tiene que ser posterior a hoy', () => {
      const c = form.controls.fechaComienzo;
      c.setValue(hoy());
      expect(c.hasError('fechaMinima')).toBe(true);
      c.setValue(addDays(hoy(), 1));
      expect(c.valid).toBe(true);
      expect(minimoComienzo(null)).toEqual(addDays(hoy(), 1));
    });

    it('al corregir una licencia que ya empezó se puede conservar su fecha, pero no ir más atrás', () => {
      const l = {
        id: 3,
        colegio: { id: 1, nombre: 'Santa Fe', circunscripcion: 1 },
        apellidoNombre: 'SOSA, Javier',
        matricula: 'T° 17 F° 279',
        tipoProfesional: 'A',
        fechaComienzo: HACE_10_DIAS,
        diasHabiles: 3,
        tipo: { id: 1, nombre: 'Fallecimiento de familiar directo' },
        observacion: null,
        anulada: false,
        loteNumero: null,
      } satisfies LicenciaCarga;
      cargarEnForm(form, l, FALLECIMIENTO);
      const c = form.controls.fechaComienzo;
      expect(c.valid).toBe(true);
      c.setValue(addDays(hoy(), -11));
      expect(c.hasError('fechaMinima')).toBe(true);

      limpiarForm(form);
      c.setValue(addDays(hoy(), -10));
      expect(c.hasError('fechaMinima')).toBe(true);
    });
  });

  it('nombre y apellido: se separan al corregir y se unen como «APELLIDO, Nombre»', () => {
    expect(separarNombre('LEDESMA FERRARI, Ana María')).toEqual(['LEDESMA FERRARI', 'Ana María']);
    expect(separarNombre('SIN COMA')).toEqual(['SIN COMA', '']);
    expect(unirNombre(' núñez ', ' Inés ')).toBe('NÚÑEZ, Inés');
  });
});
