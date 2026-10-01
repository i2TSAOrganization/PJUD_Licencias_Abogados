import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LicenciaCarga, Orden, PaginaGestion } from '../../../../interfaces/licencia';
import { nombreProfesional } from '../../../../interfaces/tipo-profesional';
import { FechaArPipe } from '../../../../pipes/fecha-ar.pipe';

/** «Otro (días a mano)» → «Otro»: en la tabla el tipo va sin las aclaraciones entre paréntesis. */
export const sinAclaracion = (s: string): string => s.replace(/\s*\([^)]*\)/g, '').trim();

/** CU-06 · Tabla de la gestión: incluye anuladas, tipo de licencia, lote y acciones. */
@Component({
  selector: 'app-tabla-gestion',
  imports: [MatSortModule, MatPaginatorModule, MatButtonModule, MatTooltipModule, FechaArPipe],
  templateUrl: './tabla-gestion.component.html',
})
export class TablaGestionComponent {
  readonly pagina = input.required<PaginaGestion>();
  readonly orden = input.required<Orden>();
  readonly cargando = input(false);
  readonly ordenar = output<Sort>();
  readonly cambiarPagina = output<PageEvent>();
  readonly corregir = output<LicenciaCarga>();
  readonly anular = output<LicenciaCarga>();

  protected readonly profesional = nombreProfesional;
  protected readonly corto = sinAclaracion;
}
