import { AbstractControl, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { format, isAfter, isBefore, isValid, startOfDay } from 'date-fns';

/** Un límite fijo o calculado al validar (por ejemplo, "hoy" cambia si la pantalla queda abierta). */
type Limite = Date | (() => Date);

const valorLimite = (l: Limite): Date => startOfDay(typeof l === 'function' ? l() : l);
const comoFecha = (v: unknown): Date | null =>
  v instanceof Date && isValid(v) ? startOfDay(v) : null;
const dmy = (d: Date): string => format(d, 'dd/MM/yyyy');

/** La fecha no puede ser anterior a `min` (si se incluye) o tiene que ser posterior (si no). */
export function fechaMinima(min: Limite, incluye = true): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    const v = comoFecha(c.value);
    if (!v) return null;
    const m = valorLimite(min);
    const falla = incluye ? isBefore(v, m) : !isAfter(v, m);
    return falla ? { fechaMinima: { min: m, incluye } } : null;
  };
}

/** La fecha no puede ser posterior a `max`. */
export function fechaMaxima(max: Limite): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    const v = comoFecha(c.value);
    if (!v) return null;
    const m = valorLimite(max);
    return isAfter(v, m) ? { fechaMaxima: { max: m } } : null;
  };
}

/**
 * Para el "hasta" de un rango: no puede ser anterior al control hermano `desde`.
 * Usar con `vincularRango` para que se revalide cuando cambia el "desde".
 */
export function noAnteriorA(controlDesde: string): ValidatorFn {
  return (c: AbstractControl): ValidationErrors | null => {
    const hasta = comoFecha(c.value);
    const desde = comoFecha(c.parent?.get(controlDesde)?.value);
    if (!hasta || !desde) return null;
    return isBefore(hasta, desde) ? { rangoFechas: { desde } } : null;
  };
}

/** Revalida el "hasta" cada vez que cambia el "desde". Devuelve la suscripción. */
export function vincularRango(form: FormGroup, desde: string, hasta: string) {
  return form
    .get(desde)!
    .valueChanges.subscribe(() => form.get(hasta)!.updateValueAndValidity({ emitEvent: false }));
}

/** Mensaje para mostrar en un mat-error de un campo fecha. */
export function mensajeErrorFecha(errors: ValidationErrors | null | undefined): string {
  if (!errors) return '';
  if (errors['matDatepickerParse']) return 'Fecha inválida. Use el formato DD/MM/AAAA.';
  if (errors['required']) return 'La fecha es obligatoria.';
  const min = errors['fechaMinima'] as { min: Date; incluye: boolean } | undefined;
  if (min)
    return min.incluye
      ? `No puede ser anterior al ${dmy(min.min)}.`
      : `Tiene que ser posterior al ${dmy(min.min)}.`;
  const max = errors['fechaMaxima'] as { max: Date } | undefined;
  if (max) return `No puede ser posterior al ${dmy(max.max)}.`;
  if (errors['rangoFechas']) return 'No puede ser anterior a la fecha desde.';
  if (errors['matDatepickerMin'] || errors['matDatepickerMax'])
    return 'Fecha fuera del rango permitido.';
  return 'Fecha inválida.';
}
