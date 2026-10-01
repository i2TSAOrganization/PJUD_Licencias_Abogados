import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { filter, forkJoin, switchMap } from 'rxjs';
import { Colegio } from '../../../interfaces/colegio';
import { LicenciaCarga, PaginaGestion } from '../../../interfaces/licencia';
import { TipoLicencia } from '../../../interfaces/tipo-licencia';
import { CatalogosService } from '../../../services/catalogos.service';
import { LicenciasService } from '../../../services/licencias.service';
import { exportarLicenciasPdf } from '../../../services/utils/exportar-pdf';
import { fechaAr } from '../../../services/utils/fechas';
import { ListaPaginada } from '../../../services/utils/lista-paginada';
import { SnackbarService } from '../../../services/utils/snackbar.service';
import { mensajeError } from '../../../services/utils/utils';
import {
  FiltrosLicenciasComponent,
  describirFiltros,
} from '../../shared/filtros-licencias/filtros-licencias.component';
import {
  ConfirmacionDialogComponent,
  ConfirmacionDialogData,
} from '../../shared/modals/confirmacion-dialog/confirmacion-dialog.component';
import {
  AltaLicenciaData,
  AltaLicenciaDialogComponent,
} from './alta-licencia-dialog/alta-licencia-dialog.component';
import { TablaGestionComponent } from './tabla-gestion/tabla-gestion.component';

/**
 * Gestión del contenidista: igual que la Consulta (mismos filtros y tabla) más anuladas,
 * tipo de licencia y las acciones Corregir y Anular. «Alta» abre la ventana de carga.
 */
@Component({
  selector: 'app-carga',
  imports: [MatButtonModule, FiltrosLicenciasComponent, TablaGestionComponent],
  templateUrl: './carga.component.html',
})
export class CargaComponent {
  private readonly catalogosService = inject(CatalogosService);
  private readonly licenciasService = inject(LicenciasService);
  private readonly snackbar = inject(SnackbarService);
  private readonly dialog = inject(MatDialog);

  protected readonly colegios = signal<Colegio[]>([]);
  protected readonly tipos = signal<TipoLicencia[]>([]);
  protected readonly lista = new ListaPaginada<PaginaGestion>(
    (f, o, p, s) => this.licenciasService.obtenerGestion(f, o, p, s),
    'No se pudieron traer las licencias cargadas.',
  );

  constructor() {
    forkJoin({
      colegios: this.catalogosService.obtenerColegios(),
      tipos: this.catalogosService.obtenerTiposLicencia(),
    }).subscribe({
      next: ({ colegios, tipos }) => {
        this.colegios.set(colegios);
        this.tipos.set(tipos);
      },
      error: (e) => this.snackbar.error(mensajeError(e, 'No se pudieron traer los catálogos.')),
    });
    this.lista.recargar();
  }

  /** «Alta»: ventana con carga individual y masiva. */
  protected alta(): void {
    this.abrirVentana(null);
  }

  /** «Corregir» (lápiz): la misma ventana con los datos de la licencia (CU-04). */
  protected corregir(l: LicenciaCarga): void {
    this.abrirVentana(l);
  }

  /** «Anular» (papelera): pide confirmación Sí / No; anular no borra (CU-05). */
  protected anular(l: LicenciaCarga): void {
    const data: ConfirmacionDialogData = {
      titulo: '¿Anular esta licencia?',
      mensaje: `${l.apellidoNombre} · ${l.matricula} · ${fechaAr(l.fechaComienzo)}.\nDeja de verse en la consulta libre y no se borra.`,
    };
    this.dialog
      .open(ConfirmacionDialogComponent, { data, width: '400px' })
      .afterClosed()
      .pipe(
        filter((ok) => ok === true),
        switchMap(() => this.licenciasService.anular(l.id)),
      )
      .subscribe({
        next: () => this.avisar('Licencia anulada.'),
        error: (e) => this.snackbar.error(mensajeError(e, 'No se pudo anular la licencia.')),
      });
  }

  /** En la gestión exporta solo las licencias vigentes, con los campos públicos. */
  protected exportar(): void {
    const filtros = this.lista.filtros();
    this.licenciasService.obtenerParaExportar(filtros, this.lista.orden()).subscribe({
      next: (items) => {
        if (!items.length) {
          this.snackbar.error('No hay resultados para exportar con estos filtros.');
          return;
        }
        exportarLicenciasPdf(items, describirFiltros(filtros, this.colegios()));
      },
      error: (e) => this.snackbar.error(mensajeError(e, 'No se pudo exportar.')),
    });
  }

  private abrirVentana(editar: LicenciaCarga | null): void {
    const data: AltaLicenciaData = { colegios: this.colegios(), tipos: this.tipos(), editar };
    const ref = this.dialog.open(AltaLicenciaDialogComponent, {
      data,
      width: editar ? '700px' : '900px',
      maxWidth: '96vw',
      panelClass: 'alta-dialog',
      autoFocus: 'first-tabbable',
    });
    const sub = ref.componentInstance?.cambio.subscribe((m) => this.avisar(m));
    ref.afterClosed().subscribe((mensaje?: string) => {
      sub?.unsubscribe();
      if (mensaje) this.avisar(mensaje);
    });
  }

  private avisar(mensaje: string): void {
    this.snackbar.success(mensaje);
    this.lista.recargar();
  }
}
