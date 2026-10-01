import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Pagina } from '../interfaces/api-response';
import { ControlCarga, ControlCargaRequest } from '../interfaces/control-carga';
import {
  FiltrosLicencia,
  LicenciaCarga,
  LicenciaPublica,
  LicenciaRequest,
  Orden,
  PaginaGestion,
} from '../interfaces/licencia';
import { ConfigService } from './config.service';
import { backPendiente, paginaVacia } from './utils/back-pendiente';

/** Consulta libre, gestión del contenidista y carga individual. */
@Injectable({ providedIn: 'root' })
export class LicenciasService {
  // Se usan al completar las llamadas (armar parámetros con aParams de utils)
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  /** CU-01. Excluye anuladas; no trae tipo ni observación. Orden y paginación en el servidor. */
  consultar(
    filtros: FiltrosLicencia,
    orden: Orden,
    page: number,
    size: number,
  ): Observable<Pagina<LicenciaPublica>> {
    // TODO(back): GET {apiUrl}/api/licencias
    //   ?nombre&matricula&tipoProfesional&colegioId&fecha&dias&sort&dir&page&size
    void filtros;
    void orden;
    return of(paginaVacia<LicenciaPublica>(page, size));
  }

  /** CU-06. Mismos filtros que la consulta, más anuladas, tipo, observación, lote y resumen. */
  obtenerGestion(
    filtros: FiltrosLicencia,
    orden: Orden,
    page: number,
    size: number,
  ): Observable<PaginaGestion> {
    // TODO(back): GET {apiUrl}/api/carga/licencias  (mismos parámetros que /api/licencias)
    void filtros;
    void orden;
    return of({ ...paginaVacia<LicenciaCarga>(page, size), resumen: { activas: 0, anuladas: 0 } });
  }

  /**
   * Exportar PDF: todas las licencias vigentes de la búsqueda aplicada, en el orden elegido,
   * solo con campos públicos. Recorrer las páginas de /api/licencias con size=100.
   */
  obtenerParaExportar(filtros: FiltrosLicencia, orden: Orden): Observable<LicenciaPublica[]> {
    // TODO(back): recorrer GET {apiUrl}/api/licencias?...&size=100&page=1..N (o un endpoint de exportación)
    void filtros;
    void orden;
    return of([]);
  }

  /** Aviso de carga repetida y de tope anual mientras se completa el formulario. */
  controlar(datos: ControlCargaRequest): Observable<ControlCarga> {
    // TODO(back): GET {apiUrl}/api/carga/licencias/control
    //   ?colegioId&matricula&fechaComienzo&tipoLicenciaId&diasHabiles&excluirId
    void datos;
    return of({ repetida: null, tope: null });
  }

  /** CU-03. */
  crear(datos: LicenciaRequest): Observable<LicenciaCarga> {
    // TODO(back): POST {apiUrl}/api/carga/licencias
    void datos;
    return backPendiente('guardar la licencia');
  }

  /** CU-04. */
  corregir(id: number, datos: LicenciaRequest): Observable<LicenciaCarga> {
    // TODO(back): PATCH {apiUrl}/api/carga/licencias/:id
    void id;
    void datos;
    return backPendiente('guardar la corrección');
  }

  /** CU-05. No borra: marca como anulada. */
  anular(id: number, motivo?: string): Observable<void> {
    // TODO(back): POST {apiUrl}/api/carga/licencias/:id/anular  { motivo }
    void id;
    void motivo;
    return backPendiente('anular la licencia');
  }
}
