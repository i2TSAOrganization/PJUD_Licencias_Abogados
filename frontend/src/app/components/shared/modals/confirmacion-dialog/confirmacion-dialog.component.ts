import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface ConfirmacionDialogData {
  /** Pregunta, por ejemplo «¿Anular esta licencia?». */
  titulo: string;
  mensaje: string;
}

/** Confirmación Sí / No. Uso: dialog.open(..., { data }).afterClosed() → true si responde Sí. */
@Component({
  selector: 'app-confirmacion-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.titulo }}</h2>
    <mat-dialog-content>
      @for (linea of data.mensaje.split('\\n'); track $index) {
        <p class="conf-linea">{{ linea }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" [mat-dialog-close]="false" cdkFocusInitial>
        No
      </button>
      <button mat-flat-button type="button" [mat-dialog-close]="true">Sí</button>
    </mat-dialog-actions>
  `,
  styles: `
    .conf-linea {
      margin: 0 0 4px;
    }
  `,
})
export class ConfirmacionDialogComponent {
  protected readonly data = inject<ConfirmacionDialogData>(MAT_DIALOG_DATA);
}
