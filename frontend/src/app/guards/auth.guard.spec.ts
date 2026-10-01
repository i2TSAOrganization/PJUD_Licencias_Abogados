import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { Observable, firstValueFrom, isObservable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ConfigService } from '../services/config.service';
import { authGuard } from './auth.guard';

function ejecutar(): Promise<boolean | UrlTree> {
  const r = TestBed.runInInjectionContext(() =>
    authGuard({} as ActivatedRouteSnapshot, { url: '/carga' } as RouterStateSnapshot),
  );
  return isObservable(r)
    ? firstValueFrom(r as Observable<boolean | UrlTree>)
    : Promise.resolve(r as boolean | UrlTree);
}

describe('authGuard', () => {
  function configurar(omitirLogin: string, usuario: { rol: string } | null) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ConfigService, useValue: { getConfig: () => omitirLogin } },
        { provide: AuthService, useValue: { cargarSesion: () => of(usuario) } },
      ],
    });
  }

  it('sin sesión manda a /login con la ruta de vuelta', async () => {
    configurar('false', null);
    const r = await ejecutar();
    expect(TestBed.inject(Router).serializeUrl(r as UrlTree)).toBe('/login?volver=%2Fcarga');
  });

  it('deja pasar al contenidista', async () => {
    configurar('false', { rol: 'contenidista' });
    expect(await ejecutar()).toBe(true);
  });

  it('en local con omitir_login deja pasar sin sesión', async () => {
    configurar('true', null);
    expect(await ejecutar()).toBe(true);
  });
});
