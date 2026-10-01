import { TipoProfesional } from './tipo-profesional';

export type ResultadoFila = 'ok' | 'aviso' | 'error';

export interface FilaValidada {
  fila: number;
  colegio: string;
  apellidoNombre: string;
  matricula: string;
  tipoProfesional: TipoProfesional | null;
  fechaComienzo: string | null;
  tipo: string;
  observacion: string | null;
  diasHabiles: number | null;
  resultado: ResultadoFila;
  mensajes: string[];
}

/** Resultado de validar un archivo, todavía sin guardar (CU-08). */
export interface ValidacionLote {
  token: string;
  archivo: string;
  total: number;
  correctas: number;
  avisos: number;
  errores: number;
  filas: FilaValidada[];
}

export interface Lote {
  id: number;
  /** AAAA-MM-DD-NN (RN-16). */
  numero: string;
  archivo: string;
  creadoEn: string;
  cantidad: number;
  activas: number;
  revertido: boolean;
}

export interface ConfirmacionLote {
  lote: Lote;
  cargadas: number;
  /** Filas que al confirmar ya no entraban en un tope que bloquea (RN-27). */
  omitidas: { fila: number; mensaje: string }[];
}
