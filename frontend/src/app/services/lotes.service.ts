import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Pagina } from '../interfaces/api-response';
import { ConfirmacionLote, Lote, ValidacionLote } from '../interfaces/lote';
import { ConfigService } from './config.service';
import { backPendiente, paginaVacia } from './utils/back-pendiente';

/** Carga masiva por archivo (CU-08) y reversión de lotes (CU-09). */
@Injectable({ providedIn: 'root' })
export class LotesService {
  // Se usan al completar las llamadas
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  /** Plantilla Excel que genera el back con el catálogo vigente. */
  descargarPlantilla(): Observable<Blob> {
    // TODO(back): GET {apiUrl}/api/carga/plantilla  (responseType: 'blob')
    return backPendiente('descargar la plantilla');
  }

  /** Valida todas las filas sin guardar nada (RN-13). Enviar como FormData con el campo 'archivo'. */
  validarArchivo(archivo: File): Observable<ValidacionLote> {
    // TODO(back): POST {apiUrl}/api/carga/lotes/validar  (multipart/form-data)
    void archivo;
    return backPendiente('validar el archivo');
  }

  /** Guarda las filas correctas y con aviso en un lote numerado. */
  confirmar(token: string): Observable<ConfirmacionLote> {
    // TODO(back): POST {apiUrl}/api/carga/lotes/:token/confirmar
    void token;
    return backPendiente('confirmar la carga');
  }

  obtenerLotes(page: number, size: number): Observable<Pagina<Lote>> {
    // TODO(back): GET {apiUrl}/api/carga/lotes?page&size
    return of(paginaVacia<Lote>(page, size));
  }

  /** Anula las licencias activas del lote, sin borrarlas (RN-16). */
  revertir(id: number): Observable<Lote> {
    // TODO(back): POST {apiUrl}/api/carga/lotes/:id/revertir
    void id;
    return backPendiente('revertir el lote');
  }
}
