import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { LoginResponse, Usuario } from '../interfaces/usuario';
import { ConfigService } from './config.service';
import { backPendiente } from './utils/back-pendiente';

export const ROL_CONTENIDISTA = 'contenidista';

/**
 * Sesión del contenidista: usuario y contraseña (tabla de usuarios propia, bcrypt en el back) y
 * después un código OTP nuevo por correo.
 *
 * La sesión es solo una cookie HttpOnly que pone el back. El front no guarda nada en
 * localStorage ni sessionStorage: el usuario vive en memoria y se recupera con /api/auth/yo.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Se usan al completar las llamadas
  private readonly http = inject(HttpClient);
  private readonly config = inject(ConfigService);

  /** undefined = todavía no se consultó al back. */
  private readonly _usuario = signal<Usuario | null | undefined>(undefined);
  readonly usuario = this._usuario.asReadonly();
  readonly esContenidista = computed(() => this._usuario()?.rol === ROL_CONTENIDISTA);

  /** Averigua una sola vez si hay sesión abierta. */
  cargarSesion(): Observable<Usuario | null> {
    const actual = this._usuario();
    if (actual !== undefined) return of(actual);
    // TODO(back): GET {apiUrl}/api/auth/yo  (401 = sin sesión → null)
    return of(null).pipe(tap((u) => this._usuario.set(u)));
  }

  /** Paso 1: usuario y contraseña; el back envía el código por correo. */
  login(usuario: string, password: string): Observable<LoginResponse> {
    // TODO(back): POST {apiUrl}/api/auth/login  { usuario, password }
    void usuario;
    void password;
    return backPendiente('ingresar');
  }

  /** Paso 2: código OTP; el back abre la sesión. Al completar: tap(u => this._usuario.set(u)). */
  verificarOtp(usuario: string, codigo: string): Observable<Usuario> {
    // TODO(back): POST {apiUrl}/api/auth/otp  { usuario, codigo }
    void usuario;
    void codigo;
    return backPendiente('verificar el código');
  }

  logout(): Observable<unknown> {
    // TODO(back): POST {apiUrl}/api/auth/logout
    this._usuario.set(null);
    return of(null);
  }

  /** El back respondió 401: la sesión venció. */
  sesionVencida(): void {
    this._usuario.set(null);
  }
}
