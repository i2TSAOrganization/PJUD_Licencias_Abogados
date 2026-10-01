import { Component, effect, inject, input, output, signal, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { filter, switchMap } from 'rxjs';
import { Pagina } from '../../../../../interfaces/api-response';
import { Lote } from '../../../../../interfaces/lote';
import { LotesService } from '../../../../../services/lotes.service';
import { mensajeError } from '../../../../../services/utils/utils';
import {
  ConfirmacionDialogComponent,
  ConfirmacionDialogData,
} from '../../../../shared/modals/confirmacion-dialog/confirmacion-dialog.component';

const TAMANO_PAGINA = 5;

/** Lista de lotes cargados y CU-09 · Revertir un lote. */
@Component({
  selector: 'app-lotes-cargados',
  imports: [MatButtonModule, MatPaginatorModule],
  templateUrl: './lotes-cargados.component.html',
})
export class LotesCargadosComponent {
  private readonly lotesService = inject(LotesService);
  private readonly dialog = inject(MatDialog);

  readonly refrescar = input(0);
  readonly cambio = output<string>();

  protected readonly lotes = signal<Pagina<Lote> | null>(null);
  protected readonly error = signal('');
  private page = 1;

  constructor() {
    effect(() => {
      this.refrescar();
      untracked(() => this.cargar(1));
    });
  }

  protected cambiarPagina(e: PageEvent): void {
    this.cargar(e.pageIndex + 1);
  }

  protected revertir(l: Lote): void {
    const data: ConfirmacionDialogData = {
      titulo: '¿Revertir este lote?',
      mensaje: `Lote ${l.numero}: sus licencias se anulan (no se borran) y dejan de verse en la consulta libre.`,
    };
    this.dialog
      .open(ConfirmacionDialogComponent, { data, width: '400px' })
      .afterClosed()
      .pipe(
        filter((ok) => ok === true),
        switchMap(() => this.lotesService.revertir(l.id)),
      )
      .subscribe({
        next: () => {
          this.cargar(this.page);
          this.cambio.emit(`Lote ${l.numero} revertido: sus licencias quedaron anuladas.`);
        },
        error: (e) => this.error.set(mensajeError(e, 'No se pudo revertir el lote.')),
      });
  }

  private cargar(page: number): void {
    this.page = page;
    this.lotesService.obtenerLotes(page, TAMANO_PAGINA).subscribe({
      next: (l) => {
        this.error.set('');
        this.lotes.set(l);
      },
      error: (e) => this.error.set(mensajeError(e, 'No se pudieron traer los lotes.')),
    });
  }
}
