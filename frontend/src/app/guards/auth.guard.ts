import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService, ROL_CONTENIDISTA } from '../services/auth.service';
import { ConfigService } from '../services/config.service';

/**
 * Solo el contenidista entra a Carga (RN-07).
 * En local, con "omitir_login": "true" en env.local.json, se deja pasar para ver las pantallas
 * mientras el login no esté integrado. Nunca en un build de producción.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const config = inject(ConfigService);

  if (!environment.production && config.getConfig('omitir_login') === 'true') return true;

  return auth
    .cargarSesion()
    .pipe(
      map((u) =>
        u?.rol === ROL_CONTENIDISTA
          ? true
          : router.createUrlTree(['/login'], { queryParams: { volver: state.url } }),
      ),
    );
};
