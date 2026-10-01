import {
  provideHttpClient,
  withFetch,
  withInterceptors,
  withXsrfConfiguration,
} from '@angular/common/http';
import {
  ApplicationConfig,
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { apiInterceptor } from './interceptors/api.interceptor';
import { ConfigService } from './services/config.service';
import { provideFechas } from './services/utils/fechas.providers';
import { CustomPaginatorIntl } from './services/utils/paginator-intl';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([apiInterceptor]),
      // Sesión por cookie: el back emite la cookie XSRF-TOKEN y valida el header en POST/PATCH
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
    ),
    provideAppInitializer(() => inject(ConfigService).load()),
    { provide: MatPaginatorIntl, useClass: CustomPaginatorIntl },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline', subscriptSizing: 'dynamic', floatLabel: 'always' },
    },
    { provide: LOCALE_ID, useValue: 'es-AR' },
    ...provideFechas(),
    // Los errores se muestran apenas se modifica el campo, no recién al salir de él
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher },
  ],
};
