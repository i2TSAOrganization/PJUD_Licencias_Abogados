import { Component, computed, effect, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FilaValidada, ValidacionLote } from '../../../../../interfaces/lote';
import { FechaArPipe } from '../../../../../pipes/fecha-ar.pipe';
import { nombreProfesional } from '../../../../../interfaces/tipo-profesional';
import { celdaCsv, descargar, paginar } from '../../../../../services/utils/utils';

/** Marca UTF-8 para que Excel abra bien las tildes. */
const BOM = String.fromCharCode(0xfeff);
const SALTO = String.fromCharCode(13, 10);

const CABECERA_REPORTE = [
  'fila',
  'colegio',
  'apellido_y_nombre',
  'matricula',
  'tipo_de_profesional',
  'tipo_de_licencia',
  'error',
];

/** CU-08 pasos 4 a 6: revisar fila por fila antes de guardar. Nada se guarda hasta confirmar. */
@Component({
  selector: 'app-previsualizacion-lote',
  imports: [MatButtonModule, MatCheckboxModule, MatPaginatorModule, FechaArPipe],
  templateUrl: './previsualizacion-lote.component.html',
})
export class PrevisualizacionLoteComponent {
  readonly validacion = input.required<ValidacionLote>();
  readonly confirmando = input(false);
  readonly confirmar = output<string>();
  readonly cancelar = output<void>();

  protected readonly soloProblemas = signal(false);
  protected readonly page = signal(1);
  protected readonly size = signal(10);

  protected readonly filas = computed(() => {
    const filas = this.validacion().filas;
    return this.soloProblemas() ? filas.filter((f) => f.resultado !== 'ok') : filas;
  });
  protected readonly pagina = computed(() => paginar(this.filas(), this.page(), this.size()));
  /** Se cargan las correctas y las que solo tienen aviso (RN-14). */
  protected readonly aCargar = computed(
    () => this.validacion().correctas + this.validacion().avisos,
  );

  constructor() {
    // Archivo nuevo: vuelve a la primera página y muestra todas las filas
    effect(() => {
      this.validacion();
      this.page.set(1);
      this.soloProblemas.set(false);
    });
  }

  protected alternarSoloProblemas(valor: boolean): void {
    this.soloProblemas.set(valor);
    this.page.set(1);
  }

  protected cambiarPagina(e: PageEvent): void {
    const cambioTamano = e.pageSize !== this.size();
    this.size.set(e.pageSize);
    this.page.set(cambioTamano ? 1 : e.pageIndex + 1);
  }

  protected readonly profesional = nombreProfesional;

  protected claseFila(f: FilaValidada): string {
    return f.resultado === 'error' ? 'res-error' : f.resultado === 'aviso' ? 'res-aviso' : 'res-ok';
  }

  /** Reporte de las filas con errores (las que no se cargan), para corregir el archivo. */
  protected descargarReporte(): void {
    const v = this.validacion();
    const filas = v.filas
      .filter((f) => f.resultado === 'error')
      .map((f) => [
        f.fila,
        f.colegio,
        f.apellidoNombre,
        f.matricula,
        nombreProfesional(f.tipoProfesional),
        f.tipo,
        f.mensajes.join(' | '),
      ]);
    const csv = [CABECERA_REPORTE, ...filas].map((r) => r.map(celdaCsv).join(';')).join(SALTO);
    descargar(new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' }), 'reporte_errores.csv');
  }
}
