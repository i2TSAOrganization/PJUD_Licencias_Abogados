import { Pipe, PipeTransform } from '@angular/core';
import { fechaAr } from '../services/utils/utils';

/** 'AAAA-MM-DD' -> 'DD/MM/AAAA'. */
@Pipe({ name: 'fechaAr' })
export class FechaArPipe implements PipeTransform {
  transform(iso: string | null | undefined): string {
    return fechaAr(iso);
  }
}
