import { Component, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmacionLote, ValidacionLote } from '../../../../interfaces/lote';
import { TipoLicencia } from '../../../../interfaces/tipo-licencia';
import { LotesService } from '../../../../services/lotes.service';
import { SnackbarService } from '../../../../services/utils/snackbar.service';
import { descargar, mensajeError } from '../../../../services/utils/utils';
import { LotesCargadosComponent } from './lotes-cargados/lotes-cargados.component';
import { PrevisualizacionLoteComponent } from './previsualizacion-lote/previsualizacion-lote.component';

const MAX_BYTES = 1024 * 1024; // RN-12
const EXTENSIONES = /\.(xlsx|csv)$/i;

/** CU-08 · Cargar licencias por archivo: plantilla, subida, revisión y confirmación. */
@Component({
  selector: 'app-carga-masiva',
  imports: [MatButtonModule, PrevisualizacionLoteComponent, LotesCargadosComponent],
  templateUrl: './carga-masiva.component.html',
})
export class CargaMasivaComponent {
  private readonly lotesService = inject(LotesService);
  private readonly snackbar = inject(SnackbarService);

  readonly tipos = input.required<TipoLicencia[]>();
  readonly cambio = output<string>();

  protected readonly archivo = signal<File | null>(null);
  protected readonly validando = signal(false);
  protected readonly confirmando = signal(false);
  protected readonly error = signal('');
  protected readonly validacion = signal<ValidacionLote | null>(null);
  protected readonly resultado = signal<(ConfirmacionLote & { conErrores: number }) | null>(null);
  protected readonly refrescarLotes = signal(0);

  protected descargarPlantilla(): void {
    this.lotesService.descargarPlantilla().subscribe({
      next: (b) => {
        descargar(b, 'plantilla_licencias.xlsx');
        this.snackbar.success(
          'Planilla descargada: las listas y la columna de estado están bloqueadas.',
        );
      },
      error: (e) => this.error.set(mensajeError(e, 'No se pudo descargar la plantilla.')),
    });
  }

  protected elegirArchivo(ev: Event): void {
    const inputEl = ev.target as HTMLInputElement;
    const f = inputEl.files?.[0] ?? null;
    this.error.set('');
    this.resultado.set(null);
    this.validacion.set(null);
    const problema = !f
      ? ''
      : !EXTENSIONES.test(f.name)
        ? 'El archivo debe ser la plantilla Excel (.xlsx) o un .csv.'
        : f.size > MAX_BYTES
          ? 'El archivo supera 1 MB. Divídalo en varios archivos.'
          : '';
    if (problema) {
      this.error.set(problema);
      inputEl.value = '';
    }
    this.archivo.set(problema ? null : f);
  }

  protected validar(): void {
    const f = this.archivo();
    if (!f || this.validando()) return;
    this.validando.set(true);
    this.error.set('');
    this.resultado.set(null);
    this.lotesService.validarArchivo(f).subscribe({
      next: (v) => {
        this.validando.set(false);
        this.validacion.set(v);
      },
      error: (e) => {
        this.validando.set(false);
        // A1, A2 y A3: el archivo se rechaza completo
        this.error.set(mensajeError(e, 'No se pudo leer el archivo.'));
      },
    });
  }

  protected confirmar(token: string): void {
    if (this.confirmando()) return;
    const conErrores = this.validacion()?.errores ?? 0;
    this.confirmando.set(true);
    this.lotesService.confirmar(token).subscribe({
      next: (r) => {
        this.confirmando.set(false);
        this.validacion.set(null);
        this.archivo.set(null);
        this.resultado.set({ ...r, conErrores });
        this.refrescarLotes.update((n) => n + 1);
        this.cambio.emit(`Lote ${r.lote.numero} cargado: ${r.cargadas} licencias.`);
      },
      error: (e) => {
        this.confirmando.set(false);
        this.error.set(mensajeError(e, 'No se pudo confirmar la carga.'));
      },
    });
  }

  /** A5: no se guarda nada. */
  protected cancelar(): void {
    this.validacion.set(null);
    this.archivo.set(null);
    this.error.set('');
  }
}
