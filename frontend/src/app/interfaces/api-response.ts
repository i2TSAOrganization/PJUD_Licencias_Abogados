/** Respuesta estándar de las APIs de i2T. A confirmar con el back. */
export interface ApiResponse<T> {
  dataset: T;
  returnset: {
    codigo: number;
    mensaje: string;
    id: string | null;
  };
}

/** Página de resultados (paginación del lado del servidor, RN-08). */
export interface Pagina<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
