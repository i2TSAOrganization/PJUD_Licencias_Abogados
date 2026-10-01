export interface TipoLicencia {
  id: number;
  codigo: string;
  nombre: string;
  /** Días hábiles fijos. null = «Otro (días a mano)»: se escriben y la observación es obligatoria (RN-19, RN-20). */
  diasHabiles: number | null;
  /** Máximo de días hábiles por año y por abogado. null = sin máximo (RN-24). */
  maximoAnual: number | null;
  /** true = superar el máximo es error; false = solo avisa (RN-26). */
  bloqueaTope: boolean;
}
