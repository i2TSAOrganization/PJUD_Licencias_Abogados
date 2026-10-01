import { ComponentFixture, TestBed } from '@angular/core/testing';
import { addDays } from 'date-fns';
import { of } from 'rxjs';
import { hoy } from '../../../../services/utils/fechas';
import { provideFechas } from '../../../../services/utils/fechas.providers';
import { ControlCarga } from '../../../../interfaces/control-carga';
import { TipoLicencia } from '../../../../interfaces/tipo-licencia';
import { LicenciasService } from '../../../../services/licencias.service';
import { CargaIndividualComponent } from './carga-individual.component';

const TIPOS: TipoLicencia[] = [
  {
    id: 1,
    codigo: 'FALL',
    nombre: 'Fallecimiento de familiar directo',
    diasHabiles: 3,
    maximoAnual: 3,
    bloqueaTope: false,
  },
  {
    id: 9,
    codigo: 'OTRO',
    nombre: 'Otro (días a mano)',
    diasHabiles: null,
    maximoAnual: null,
    bloqueaTope: false,
  },
];

const TOPE: ControlCarga = {
  repetida: null,
  tope: {
    anio: 2026,
    tipoNombre: 'Fallecimiento de familiar directo',
    acumulado: 3,
    total: 6,
    maximo: 3,
    bloquea: true,
  },
};

describe('CargaIndividualComponent', () => {
  let fixture: ComponentFixture<CargaIndividualComponent>;
  const controlar = vi.fn(() => of(TOPE));

  beforeEach(async () => {
    controlar.mockClear();
    TestBed.configureTestingModule({
      imports: [CargaIndividualComponent],
      providers: [...provideFechas(), { provide: LicenciasService, useValue: { controlar } }],
    });
    fixture = TestBed.createComponent(CargaIndividualComponent);
    fixture.componentRef.setInput('colegios', [
      { id: 2, codigo: 'ROS', nombre: 'Rosario', circunscripcion: 2 },
    ]);
    fixture.componentRef.setInput('tipos', TIPOS);
    await fixture.whenStable();
  });

  it('elegir un tipo fijo completa los días', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const form = (fixture.componentInstance as any).form;
    form.controls.tipoLicenciaId.setValue(1);
    expect(form.controls.diasHabiles.value).toBe(3);
  });

  it('con los datos completos pide el control y un tope que bloquea deshabilita Guardar', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const comp = fixture.componentInstance as any;
    comp.form.patchValue({
      colegioId: 2,
      nombre: 'Luis',
      apellido: 'BARRAZA',
      tipoProfesional: 'A',
      matricula: 'R-1093',
      fechaComienzo: addDays(hoy(), 5),
      tipoLicenciaId: 1,
    });
    await new Promise((r) => setTimeout(r, 350)); // debounce de 300 ms
    expect(controlar).toHaveBeenCalledWith(
      expect.objectContaining({ matricula: 'R-1093', diasHabiles: 3, excluirId: null }),
    );
    expect(comp.topeBloquea()).toBe(true);

    await fixture.whenStable();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('serían 6 de 3');
    expect(html.querySelector<HTMLButtonElement>('button[type=submit]')?.disabled).toBe(true);
  });
});
