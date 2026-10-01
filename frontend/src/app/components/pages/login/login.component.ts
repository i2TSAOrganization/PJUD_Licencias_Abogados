import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { mensajeError } from '../../../services/utils/utils';

/** CU-02 · Ingresar: usuario y contraseña, después un código OTP nuevo enviado por correo. */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly paso = signal<'credenciales' | 'codigo'>('credenciales');
  protected readonly destino = signal('');
  protected readonly enviando = signal(false);
  protected readonly error = signal('');

  protected readonly credenciales = this.fb.group({
    usuario: ['', Validators.required],
    password: ['', Validators.required],
  });
  protected readonly codigo = this.fb.group({
    codigo: ['', [Validators.required, Validators.pattern(/^\d{4,8}$/)]],
  });

  protected enviarCredenciales(): void {
    if (this.credenciales.invalid || this.enviando()) return;
    const { usuario, password } = this.credenciales.getRawValue();
    this.iniciar();
    this.auth.login(usuario.trim(), password).subscribe({
      next: (r) => {
        this.enviando.set(false);
        this.destino.set(r.destino);
        this.paso.set('codigo');
      },
      // A1 y A3: no se dice cuál de los dos datos falló
      error: (e) => this.fallar(e, 'Usuario o contraseña incorrectos.'),
    });
  }

  protected enviarCodigo(): void {
    if (this.codigo.invalid || this.enviando()) return;
    const usuario = this.credenciales.getRawValue().usuario.trim();
    this.iniciar();
    this.auth.verificarOtp(usuario, this.codigo.getRawValue().codigo).subscribe({
      next: () => {
        this.enviando.set(false);
        const volver = this.route.snapshot.queryParamMap.get('volver');
        this.router.navigateByUrl(volver?.startsWith('/') ? volver : '/carga');
      },
      error: (e) => this.fallar(e, 'El código es incorrecto o venció.'),
    });
  }

  /** A2: pedir otro código. */
  protected reenviar(): void {
    this.codigo.reset();
    this.enviarCredenciales();
  }

  protected cambiarUsuario(): void {
    this.codigo.reset();
    this.error.set('');
    this.paso.set('credenciales');
  }

  private iniciar(): void {
    this.enviando.set(true);
    this.error.set('');
  }

  private fallar(e: unknown, porDefecto: string): void {
    this.enviando.set(false);
    this.error.set(mensajeError(e, porDefecto));
  }
}
