import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { catchError, debounceTime, merge, of, switchMap } from 'rxjs';
import { Colegio } from '../../../../interfaces/colegio';
import { ControlCarga } from '../../../../interfaces/control-carga';
import { LicenciaCarga } from '../../../../interfaces/licencia';
import { TIPOS_PROFESIONAL } from '../../../../interfaces/tipo-profesional';
import { TipoLicencia } from '../../../../interfaces/tipo-licencia';
import { LicenciasService } from '../../../../services/licencias.service';
import { aIso, desdeIso } from '../../../../services/utils/fechas';
import { mensajeError } from '../../../../services/utils/utils';
import { mensajeErrorFecha } from '../../../../validators/fechas.validators';
import {
  ETIQUETAS,
  aRequest,
  aplicarTipo,
  cargarEnForm,
  crearFormLicencia,
  limpiarForm,
  minimoComienzo,
} from './carga-individual.form';

/**
 * CU-03 · Cargar una licencia y CU-04 · Corregir una licencia (dentro del modal de Alta).
 * «Falta completar» se muestra recién después de pulsar Guardar.
 */
@Component({
  selector: 'app-carga-individual',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
  ],
  templateUrl: './carga-individual.component.html',
})
export class CargaIndividualComponent {
  private readonly licenciasService = inject(LicenciasService);

  readonly colegios = input.required<Colegio[]>();
  readonly tipos = input.required<TipoLicencia[]>();
  /** Licencia a corregir; null = alta nueva. */
  readonly editar = input<LicenciaCarga | null>(null);
  readonly guardado = output<string>();
  readonly cancelado = output<void>();

  protected readonly profesionales = TIPOS_PROFESIONAL;
  protected readonly form = crearFormLicencia();
  /** Se pulsó Guardar al menos una vez. */
  protected readonly intentado = signal(false);
  private readonly valor = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  protected readonly tipoSeleccionado = computed(() => this.tipoDe(this.valor().tipoLicenciaId));
  /** RN-20: «Otro (días a mano)». */
  protected readonly diasAMano = computed(() => this.tipoSeleccionado()?.diasHabiles === null);
  protected readonly faltantes = computed(() => {
    this.valor();
    return Object.entries(this.form.controls)
      .filter(([, c]) => c.enabled && c.hasError('required'))
      .map(([k]) => ETIQUETAS[k]);
  });
  protected readonly diasInvalidos = computed(() => {
    this.valor();
    const c = this.form.controls.diasHabiles;
    return c.enabled && c.value !== null && (c.hasError('min') || c.hasError('entero'));
  });

  protected readonly control = signal<ControlCarga | null>(null);
  protected readonly topeBloquea = computed(() => !!this.control()?.tope?.bloquea);
  /** Primer día elegible en el calendario (posterior a hoy, o la fecha original al corregir). */
  protected readonly minComienzo = computed(() =>
    minimoComienzo(desdeIso(this.editar()?.fechaComienzo)),
  );
  protected readonly mensajeFecha = mensajeErrorFecha;
  protected readonly guardando = signal(false);
  protected readonly error = signal('');

  constructor() {
    const c = this.form.controls;
    c.tipoLicenciaId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((id) => aplicarTipo(this.form, this.tipoDe(id)));

    // A3 y A5: avisos de carga repetida y de tope anual; el back vuelve a controlar al guardar
    merge(
      c.colegioId.valueChanges,
      c.matricula.valueChanges,
      c.fechaComienzo.valueChanges,
      c.tipoLicenciaId.valueChanges,
      c.diasHabiles.valueChanges,
    )
      .pipe(
        debounceTime(300),
        switchMap(() => this.pedirControl()),
        takeUntilDestroyed(),
      )
      .subscribe((r) => this.control.set(r));

    effect(() => {
      const l = this.editar();
      untracked(() => this.cargar(l));
    });
  }

  protected guardar(): void {
    this.intentado.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid || this.guardando() || this.topeBloquea()) return;
    const edit = this.editar();
    const datos = aRequest(this.form);
    this.guardando.set(true);
    this.error.set('');
    const pedido = edit
      ? this.licenciasService.corregir(edit.id, datos)
      : this.licenciasService.crear(datos);
    pedido.subscribe({
      next: () => {
        this.guardando.set(false);
        this.guardado.emit(
          edit ? 'Corrección guardada.' : 'Licencia guardada. Ya se ve en la consulta libre.',
        );
        if (!edit) this.cargar(null);
      },
      error: (e) => {
        this.guardando.set(false);
        this.error.set(mensajeError(e, 'No se pudo guardar la licencia.'));
      },
    });
  }

  protected cancelar(): void {
    this.cancelado.emit();
  }

  private tipoDe(id: number | null | undefined): TipoLicencia | null {
    return this.tipos().find((t) => t.id === Number(id)) ?? null;
  }

  private pedirControl() {
    const v = this.form.getRawValue();
    const dias = Number(v.diasHabiles);
    const completo = v.colegioId && v.matricula.trim() && v.fechaComienzo && v.tipoLicenciaId;
    if (!completo || !Number.isInteger(dias) || dias < 1) return of(null);
    return this.licenciasService
      .controlar({
        colegioId: Number(v.colegioId),
        matricula: v.matricula.trim(),
        fechaComienzo: aIso(v.fechaComienzo) ?? '',
        tipoLicenciaId: Number(v.tipoLicenciaId),
        diasHabiles: dias,
        excluirId: this.editar()?.id ?? null,
      })
      .pipe(catchError(() => of(null)));
  }

  private cargar(l: LicenciaCarga | null): void {
    this.error.set('');
    this.intentado.set(false);
    this.control.set(null);
    if (l) {
      cargarEnForm(this.form, l, this.tipoDe(l.tipo.id));
    } else {
      limpiarForm(this.form);
    }
  }
}
