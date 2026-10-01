import { Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { Colegio } from '../../../../interfaces/colegio';
import { LicenciaCarga } from '../../../../interfaces/licencia';
import { TipoLicencia } from '../../../../interfaces/tipo-licencia';
import { CargaIndividualComponent } from '../carga-individual/carga-individual.component';
import { CargaMasivaComponent } from '../carga-masiva/carga-masiva.component';

export interface AltaLicenciaData {
  colegios: Colegio[];
  tipos: TipoLicencia[];
  /** Licencia a corregir; sin ella es un alta (con pestañas individual y masiva). */
  editar?: LicenciaCarga | null;
}

/**
 * Ventana de Alta: pestañas «Carga individual» y «Carga masiva por archivo».
 * «Corregir» abre la misma ventana, solo con el formulario y los datos de la licencia.
 * Se cierra con el mensaje de lo guardado; la carga masiva avisa por `cambio` sin cerrar.
 */
@Component({
  selector: 'app-alta-licencia-dialog',
  imports: [
    MatDialogModule,
    MatTabsModule,
    MatButtonModule,
    CargaIndividualComponent,
    CargaMasivaComponent,
  ],
  templateUrl: './alta-licencia-dialog.component.html',
  styleUrl: './alta-licencia-dialog.component.scss',
})
export class AltaLicenciaDialogComponent {
  protected readonly data = inject<AltaLicenciaData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<AltaLicenciaDialogComponent, string>);

  /** Un lote se confirmó o se revirtió: la gestión se recarga y la ventana sigue abierta. */
  readonly cambio = output<string>();

  protected guardado(mensaje: string): void {
    this.ref.close(mensaje);
  }

  protected cerrar(): void {
    this.ref.close();
  }
}
