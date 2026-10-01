import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Colegio } from '../../../interfaces/colegio';
import { FiltrosLicencia } from '../../../interfaces/licencia';
import { provideFechas } from '../../../services/utils/fechas.providers';
import { FiltrosLicenciasComponent, describirFiltros } from './filtros-licencias.component';

const COLEGIOS: Colegio[] = [{ id: 2, codigo: 'ROS', nombre: 'Rosario', circunscripcion: 2 }];

describe('FiltrosLicenciasComponent', () => {
  let fixture: ComponentFixture<FiltrosLicenciasComponent>;
  let emitidos: FiltrosLicencia[];

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [FiltrosLicenciasComponent],
      providers: [...provideFechas()],
    });
    fixture = TestBed.createComponent(FiltrosLicenciasComponent);
    fixture.componentRef.setInput('colegios', COLEGIOS);
    emitidos = [];
    fixture.componentInstance.buscar.subscribe((f) => emitidos.push(f));
    await fixture.whenStable();
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = () => (fixture.componentInstance as any).form;

  it('no busca al tipear: solo al pulsar Buscar, con la fecha en AAAA-MM-DD', () => {
    form().patchValue({ nombre: ' ocampo ', fecha: new Date(2026, 9, 13), tipoProfesional: 'P' });
    expect(emitidos).toHaveLength(0);
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')!
      .dispatchEvent(new Event('submit'));
    expect(emitidos[0]).toMatchObject({
      nombre: 'ocampo',
      fecha: '2026-10-13',
      tipoProfesional: 'P',
    });
  });

  it('Limpiar vacía los filtros y vuelve a buscar sin filtros', () => {
    form().patchValue({ matricula: 'R-1' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fixture.componentInstance as any).limpiar();
    expect(form().getRawValue().matricula).toBe('');
    expect(emitidos.at(-1)).toEqual({});
  });

  it('con días inválidos no busca', () => {
    form().patchValue({ dias: '0' });
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')!
      .dispatchEvent(new Event('submit'));
    expect(emitidos).toHaveLength(0);
  });

  it('describirFiltros arma el texto para el PDF', () => {
    expect(
      describirFiltros(
        { nombre: 'ocampo', colegioId: '2', fecha: '2026-10-13', tipoProfesional: 'A' },
        COLEGIOS,
      ),
    ).toEqual([
      'Nombre: ocampo',
      'Tipo de profesional: Abogado/a',
      'Colegio: 2ª · Rosario',
      'Fecha de comienzo: 13/10/2026',
    ]);
  });
});
