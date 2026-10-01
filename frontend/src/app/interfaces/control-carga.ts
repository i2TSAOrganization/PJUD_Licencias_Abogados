/** Datos para los controles que avisan mientras se carga (RN-04, RN-24 a RN-28). */
export interface ControlCargaRequest {
  colegioId: number;
  matricula: string;
  fechaComienzo: string;
  tipoLicenciaId: number;
  diasHabiles: number;
  /** Licencia que se corrige: no cuenta contra sí misma. */
  excluirId?: number | null;
}

export interface TopeAnual {
  anio: number;
  tipoNombre: string;
  /** Días activos ya cargados del abogado, tipo y año. */
  acumulado: number;
  /** acumulado + días de esta licencia. */
  total: number;
  maximo: number;
  bloquea: boolean;
}

export interface ControlCarga {
  repetida: { id: number; apellidoNombre: string; diasHabiles: number } | null;
  /** null si el tipo no tiene máximo o no se supera. */
  tope: TopeAnual | null;
}
