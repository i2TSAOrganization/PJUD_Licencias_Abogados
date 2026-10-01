export interface Usuario {
  id: number;
  usuario: string;
  nombre: string;
  rol: string;
}

export interface LoginResponse {
  otpEnviado: boolean;
  /** Correo enmascarado al que se envió el código. */
  destino: string;
}
