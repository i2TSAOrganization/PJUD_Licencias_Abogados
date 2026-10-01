import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly config: MatSnackBarConfig = {
    duration: 5000,
    horizontalPosition: 'center',
    verticalPosition: 'bottom',
  };

  /** Verde: la operación salió bien. */
  success(message: string): void {
    this.snackBar.open(message, 'Cerrar', { ...this.config, panelClass: ['success-snackbar'] });
  }

  /** Rojo: algo falló o no se pudo hacer. */
  error(message: string): void {
    this.snackBar.open(message, 'Cerrar', { ...this.config, panelClass: ['error-snackbar'] });
  }
}
