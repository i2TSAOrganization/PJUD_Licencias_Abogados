import { Pagina } from './api-response';
import { Colegio } from './colegio';
import { TipoLicencia } from './tipo-licencia';
import { TipoProfesional } from './tipo-profesional';

/** Fila de la consulta libre: solo campos públicos (sin tipo ni observación). Fechas 'AAAA-MM-DD'. */
export interface LicenciaPublica {
  id: number;
  colegio: Pick<Colegio, 'id' | 'nombre' | 'circunscripcion'>;
  /** «APELLIDO, Nombre». */
  apellidoNombre: string;
  matricula: string;
  tipoProfesional: TipoProfesional;
  fechaComienzo: string;
  diasHabiles: number;
}

/** Fila de la gestión del contenidista. */
export interface LicenciaCarga extends LicenciaPublica {
  tipo: Pick<TipoLicencia, 'id' | 'nombre'>;
  observacion: string | null;
  anulada: boolean;
  loteNumero: string | null;
}

export interface PaginaGestion extends Pagina<LicenciaCarga> {
  resumen: { activas: number; anuladas: number };
}

/** Filtros de Consulta y de Gestión. Se aplican al pulsar Buscar. */
export interface FiltrosLicencia {
  nombre?: string | null;
  matricula?: string | null;
  tipoProfesional?: TipoProfesional | '' | null;
  colegioId?: number | string | null;
  /** Una sola fecha de comienzo, 'AAAA-MM-DD'. */
  fecha?: string | null;
  dias?: number | string | null;
}

export type CampoOrden =
  | 'colegio'
  | 'nombre'
  | 'matricula'
  | 'tipoProfesional'
  | 'fechaComienzo'
  | 'diasHabiles'
  | 'tipoLicencia';

/** Orden del lado del servidor. Primer clic ascendente, segundo descendente. */
export interface Orden {
  campo: CampoOrden;
  dir: 'asc' | 'desc';
}

export const ORDEN_INICIAL: Orden = { campo: 'fechaComienzo', dir: 'desc' };

/** Alta y corrección (CU-03, CU-04). */
export interface LicenciaRequest {
  colegioId: number;
  /** Se arma como «APELLIDO, Nombre» con los dos campos del formulario. */
  apellidoNombre: string;
  matricula: string;
  tipoProfesional: TipoProfesional;
  fechaComienzo: string;
  tipoLicenciaId: number;
  /** Solo cuenta si el tipo no tiene días fijos. */
  diasHabiles: number | null;
  observacion: string | null;
}
