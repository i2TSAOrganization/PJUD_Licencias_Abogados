import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

/** Textos del paginador en castellano: "Mostrando 26–50 de 294". */
@Injectable()
export class CustomPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Por página';
  override nextPageLabel = 'Siguiente';
  override previousPageLabel = 'Anterior';
  override firstPageLabel = 'Primera página';
  override lastPageLabel = 'Última página';

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0) return 'Sin resultados';
    const desde = page * pageSize + 1;
    const hasta = Math.min((page + 1) * pageSize, length);
    return `Mostrando ${desde}–${hasta} de ${length}`;
  };
}
