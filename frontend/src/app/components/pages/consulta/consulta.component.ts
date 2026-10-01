import { Component, inject, signal } from '@angular/core';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { Pagina } from '../../../interfaces/api-response';
import { Colegio } from '../../../interfaces/colegio';
import { LicenciaPublica } from '../../../interfaces/licencia';
import { nombreProfesional } from '../../../interfaces/tipo-profesional';
import { FechaArPipe } from '../../../pipes/fecha-ar.pipe';
import { CatalogosService } from '../../../services/catalogos.service';
import { LicenciasService } from '../../../services/licencias.service';
import { exportarLicenciasPdf } from '../../../services/utils/exportar-pdf';
import { ListaPaginada } from '../../../services/utils/lista-paginada';
import { SnackbarService } from '../../../services/utils/snackbar.service';
import { mensajeError } from '../../../services/utils/utils';
import {
  FiltrosLicenciasComponent,
  describirFiltros,
} from '../../shared/filtros-licencias/filtros-licencias.component';

/** CU-01 · Consultar licencias. Libre, solo lectura, paginada y ordenada en el servidor. */
@Component({
  selector: 'app-consulta',
  imports: [FiltrosLicenciasComponent, MatSortModule, MatPaginatorModule, FechaArPipe],
  templateUrl: './consulta.component.html',
})
export class ConsultaComponent {
  private readonly licenciasService = inject(LicenciasService);
  private readonly snackbar = inject(SnackbarService);

  protected readonly colegios = signal<Colegio[]>([]);
  protected readonly profesional = nombreProfesional;
  protected readonly lista = new ListaPaginada<Pagina<LicenciaPublica>>((f, o, p, s) =>
    this.licenciasService.consultar(f, o, p, s),
  );

  constructor() {
    inject(CatalogosService)
      .obtenerColegios()
      .subscribe({ next: (c) => this.colegios.set(c) });
    this.lista.recargar();
  }

  /** Exporta todas las licencias de la búsqueda aplicada (no solo la página visible). */
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
}
