/** A = Abogado/a, P = Procurador/a. */
export type TipoProfesional = 'A' | 'P';

export const TIPOS_PROFESIONAL: { valor: TipoProfesional; nombre: string }[] = [
  { valor: 'A', nombre: 'Abogado/a' },
  { valor: 'P', nombre: 'Procurador/a' },
];

export function nombreProfesional(valor: TipoProfesional | null | undefined): string {
  return TIPOS_PROFESIONAL.find((t) => t.valor === valor)?.nombre ?? '';
}
