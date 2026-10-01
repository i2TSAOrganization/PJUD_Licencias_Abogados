import { Component, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Colegio } from '../../../interfaces/colegio';
import { FiltrosLicencia } from '../../../interfaces/licencia';
import {
  TIPOS_PROFESIONAL,
  TipoProfesional,
  nombreProfesional,
} from '../../../interfaces/tipo-profesional';
import { aIso, fechaAr } from '../../../services/utils/fechas';
import { entero } from '../../../validators/comunes.validators';
import { mensajeErrorFecha } from '../../../validators/fechas.validators';

/** Texto de los filtros aplicados, para el encabezado del PDF. */
export function describirFiltros(f: FiltrosLicencia, colegios: Colegio[]): string[] {
  const colegio = colegios.find((c) => String(c.id) === String(f.colegioId));
  return [
    f.nombre && `Nombre: ${f.nombre}`,
    f.matricula && `Matrícula: ${f.matricula}`,
    f.tipoProfesional && `Tipo de profesional: ${nombreProfesional(f.tipoProfesional)}`,
    colegio && `Colegio: ${colegio.circunscripcion}ª · ${colegio.nombre}`,
    f.fecha && `Fecha de comienzo: ${fechaAr(f.fecha)}`,
    f.dias && `Días hábiles: ${f.dias}`,
  ].filter((x): x is string => !!x);
}

/**
 * Filtros de Consulta y de Gestión: dos filas de tres. Se aplican al pulsar Buscar o Enter,
 * no al tipear. La fecha de comienzo es una sola fecha.
 */
@Component({
  selector: 'app-filtros-licencias',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
  ],
  templateUrl: './filtros-licencias.component.html',
})
export class FiltrosLicenciasComponent {
  readonly colegios = input.required<Colegio[]>();
  readonly buscar = output<FiltrosLicencia>();
  readonly exportar = output<void>();

  protected readonly profesionales = TIPOS_PROFESIONAL;
  protected readonly mensajeFecha = mensajeErrorFecha;

  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly form = this.fb.group({
    nombre: '',
    matricula: '',
    tipoProfesional: '' as TipoProfesional | '',
    colegioId: '',
    fecha: this.fb.control<Date | null>(null),
    dias: this.fb.control('', [Validators.min(1), entero]),
  });

  protected aplicar(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.buscar.emit({
      ...v,
      nombre: v.nombre.trim(),
      matricula: v.matricula.trim(),
      fecha: aIso(v.fecha),
    });
  }

  protected limpiar(): void {
    this.form.reset();
    this.buscar.emit({});
  }
}
