import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../services/auth.service';
import { ConfigService } from '../../../services/config.service';

/**
 * Encabezado: logo del Poder Judicial a la izquierda y, a la derecha, el botón que corresponde:
 * en la Consulta «Carga de licencias»; en la Carga, el usuario, «Salir» y «Volver a la consulta».
 */
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, MatButtonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly config = inject(ConfigService);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  protected readonly enConsulta = computed(() => this.url().startsWith('/consulta'));

  protected readonly loginOmitido =
    !environment.production && this.config.getConfig('omitir_login') === 'true';

  /** CU-07 · Cerrar sesión. */
  protected salir(): void {
    this.auth.logout().subscribe(() => this.router.navigate(['/consulta']));
  }
}
