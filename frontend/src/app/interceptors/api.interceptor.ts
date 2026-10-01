import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TimeoutError, catchError, finalize, throwError, timeout } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { LoadingService } from '../services/utils/loading.service';
import { SnackbarService } from '../services/utils/snackbar.service';

const TIMEOUT_MS = 30000;

/**
 * Pedidos al back: viajan con la cookie de sesión, muestran la barra de carga y,
 * si la sesión venció (401 en /api/carga), mandan a ingresar.
 * Los errores de negocio (400, 422) los muestra cada pantalla.
 */
export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/assets/')) return next(req);

  const auth = inject(AuthService);
  const router = inject(Router);
  const loading = inject(LoadingService);
  const snackbar = inject(SnackbarService);

  loading.show();
  return next(req.clone({ withCredentials: true })).pipe(
    timeout(TIMEOUT_MS),
    catchError((e: unknown) => {
      if (e instanceof TimeoutError) {
        snackbar.error('La solicitud tardó demasiado. Intente nuevamente.');
      } else if (
        e instanceof HttpErrorResponse &&
        e.status === 401 &&
        req.url.includes('/api/carga')
      ) {
        auth.sesionVencida();
        snackbar.error('La sesión venció. Vuelva a ingresar.');
        router.navigate(['/login'], { queryParams: { volver: '/carga' } });
      } else if (e instanceof HttpErrorResponse && e.status >= 500) {
        snackbar.error('Error interno del servidor. Intente más tarde.');
      }
      return throwError(() => e);
    }),
    finalize(() => loading.hide()),
  );
};
