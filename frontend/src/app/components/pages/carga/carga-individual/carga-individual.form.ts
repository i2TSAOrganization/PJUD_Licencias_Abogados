import { FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { isAfter } from 'date-fns';
import { LicenciaCarga, LicenciaRequest } from '../../../../interfaces/licencia';
import { TipoLicencia } from '../../../../interfaces/tipo-licencia';
import { TipoProfesional } from '../../../../interfaces/tipo-profesional';
import { aIso, desdeIso, hoy, manana } from '../../../../services/utils/fechas';
import { entero, noVacio } from '../../../../validators/comunes.validators';
import { fechaMinima } from '../../../../validators/fechas.validators';

/** Nombres de los campos, en el orden del formulario, para «Falta completar: …». */
export const ETIQUETAS: Record<string, string> = {
  nombre: 'Nombre',
  apellido: 'Apellido',
  matricula: 'Matrícula',
  tipoProfesional: 'Tipo de profesional',
  colegioId: 'Colegio / circunscripción',
  fechaComienzo: 'Fecha de comienzo',
  tipoLicenciaId: 'Tipo de licencia',
  diasHabiles: 'Cantidad de días hábiles',
  observacion: 'Observación (describa el tipo de licencia)',
};

/**
 * La fecha de comienzo tiene que ser posterior a hoy. Al corregir una licencia que ya empezó
 * (CU-04) se permite conservar su fecha original, para poder arreglar otros datos.
 */
export function reglaComienzo(original: Date | null): ValidatorFn {
  return original && !isAfter(original, hoy()) ? fechaMinima(original) : fechaMinima(hoy, false);
}

/** Primer día elegible en el calendario. */
export function minimoComienzo(original: Date | null): Date {
  return original && !isAfter(original, hoy()) ? original : manana();
}

const texto = (max: number) =>
  new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, noVacio, Validators.maxLength(max)],
  });

/** Formulario de alta y corrección. Todos obligatorios salvo la observación (según el tipo). */
export function crearFormLicencia() {
  return new FormGroup({
    nombre: texto(60),
    apellido: texto(60),
    matricula: texto(40),
    tipoProfesional: new FormControl<TipoProfesional | null>(null, Validators.required),
    colegioId: new FormControl<number | null>(null, Validators.required),
    fechaComienzo: new FormControl<Date | null>(null, [Validators.required, reglaComienzo(null)]),
    tipoLicenciaId: new FormControl<number | null>(null, Validators.required),
    diasHabiles: new FormControl<number | null>({ value: null, disabled: true }, [
      Validators.required,
      Validators.min(1),
      entero,
    ]),
    observacion: new FormControl('', { nonNullable: true, validators: Validators.maxLength(255) }),
  });
}

export type FormLicencia = ReturnType<typeof crearFormLicencia>;

/**
 * El tipo define los días; «Otro (días a mano)» los pide y exige observación.
 * Lee el valor del control (no el del grupo): el del control se actualiza primero.
 */
export function aplicarTipo(form: FormLicencia, tipo: TipoLicencia | null): void {
  const dias = form.controls.diasHabiles;
  const obs = form.controls.observacion;

  if (!tipo) {
    dias.reset({ value: null, disabled: true });
  } else if (tipo.diasHabiles !== null) {
    dias.reset({ value: tipo.diasHabiles, disabled: true });
  } else if (dias.disabled) {
    dias.reset({ value: null, disabled: false });
  }

  const obligatoria = !!tipo && tipo.diasHabiles === null;
  obs.setValidators(
    obligatoria
      ? [Validators.required, noVacio, Validators.maxLength(255)]
      : [Validators.maxLength(255)],
  );
  obs.updateValueAndValidity();
}

/** Vacía el formulario para un alta nueva. */
export function limpiarForm(form: FormLicencia): void {
  form.controls.fechaComienzo.setValidators([Validators.required, reglaComienzo(null)]);
  form.reset();
  aplicarTipo(form, null);
}

/** «APELLIDO, Nombre» → [apellido, nombre]. */
export function separarNombre(apellidoNombre: string): [string, string] {
  const i = apellidoNombre.indexOf(',');
  return i < 0
    ? [apellidoNombre.trim(), '']
    : [apellidoNombre.slice(0, i).trim(), apellidoNombre.slice(i + 1).trim()];
}

/** Apellido y nombre se cargan por separado y se guardan como «APELLIDO, Nombre». */
export function unirNombre(apellido: string, nombre: string): string {
  return `${apellido.trim().toLocaleUpperCase('es')}, ${nombre.trim()}`;
}

/** Lleva una licencia de la gestión al formulario (CU-04). */
export function cargarEnForm(
  form: FormLicencia,
  l: LicenciaCarga,
  tipo: TipoLicencia | null,
): void {
  const comienzo = desdeIso(l.fechaComienzo);
  const [apellido, nombre] = separarNombre(l.apellidoNombre);
  form.controls.fechaComienzo.setValidators([Validators.required, reglaComienzo(comienzo)]);
  form.patchValue({
    nombre,
    apellido,
    matricula: l.matricula,
    tipoProfesional: l.tipoProfesional,
    colegioId: l.colegio.id,
    fechaComienzo: comienzo,
    tipoLicenciaId: l.tipo.id,
    observacion: l.observacion ?? '',
  });
  aplicarTipo(form, tipo);
  if (tipo?.diasHabiles === null) form.controls.diasHabiles.setValue(l.diasHabiles);
}

export function aRequest(form: FormLicencia): LicenciaRequest {
  const v = form.getRawValue();
  return {
    colegioId: Number(v.colegioId),
    apellidoNombre: unirNombre(v.apellido, v.nombre),
    matricula: v.matricula.trim(),
    tipoProfesional: v.tipoProfesional as TipoProfesional,
    fechaComienzo: aIso(v.fechaComienzo) ?? '',
    tipoLicenciaId: Number(v.tipoLicenciaId),
    diasHabiles: v.diasHabiles === null ? null : Number(v.diasHabiles),
    observacion: v.observacion.trim() || null,
  };
}
