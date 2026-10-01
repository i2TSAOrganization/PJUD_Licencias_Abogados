import { Provider } from '@angular/core';
import { provideDateFnsAdapter } from '@angular/material-date-fns-adapter';
import { MAT_DATE_LOCALE, MatDateFormats } from '@angular/material/core';
import { es } from 'date-fns/locale';

/** Fechas como en CAS_Gestion_Usuarios_UI: dd/MM/yyyy, calendario en castellano. */
export const FORMATOS_FECHA: MatDateFormats = {
  parse: { dateInput: 'dd/MM/yyyy' },
  display: {
    dateInput: 'dd/MM/yyyy',
    monthYearLabel: 'MMM yyyy',
    dateA11yLabel: 'PPP',
    monthYearA11yLabel: 'MMMM yyyy',
  },
};

/** Datepicker de Material con date-fns. Usar en app.config y en las pruebas con datepicker. */
export function provideFechas(): Provider[] {
  return [provideDateFnsAdapter(FORMATOS_FECHA), { provide: MAT_DATE_LOCALE, useValue: es }];
}
