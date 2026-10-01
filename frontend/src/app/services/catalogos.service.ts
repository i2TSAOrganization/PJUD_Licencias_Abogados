import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Colegio } from '../interfaces/colegio';
import { TipoLicencia } from '../interfaces/tipo-licencia';
import { ConfigService } from './config.service';

/** Colegios y tipos de licencia. */
@Injectable({ providedIn: 'root' })
export class CatalogosService {
  // Se usan al completar las llamadas
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  /** Los cinco Colegios, para los selectores. Público. */
  obtenerColegios(): Observable<Colegio[]> {
    // TODO(back): GET {apiUrl}/api/colegios
    return of([]);
  }

  /** Catálogo de tipos con días fijos, máximo anual y si bloquea (RN-18 a RN-24). Solo contenidista. */
  obtenerTiposLicencia(): Observable<TipoLicencia[]> {
    // TODO(back): GET {apiUrl}/api/carga/tipos-licencia
    return of([]);
  }
}
