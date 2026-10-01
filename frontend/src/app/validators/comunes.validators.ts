import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Número entero (vacío es válido: lo controla required). */
export const entero = (c: AbstractControl): ValidationErrors | null =>
  c.value === null || c.value === '' || Number.isInteger(Number(c.value)) ? null : { entero: true };

/** Texto que no sea solo espacios (se informa como required). */
export const noVacio = (c: AbstractControl): ValidationErrors | null =>
  typeof c.value === 'string' && c.value.trim() === '' ? { required: true } : null;
