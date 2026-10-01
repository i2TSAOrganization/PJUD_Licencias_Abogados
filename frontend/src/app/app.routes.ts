import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'consulta' },
  {
    path: 'consulta',
    title: 'Consulta · Licencias de abogados',
    loadComponent: () =>
      import('./components/pages/consulta/consulta.component').then((m) => m.ConsultaComponent),
  },
  {
    path: 'login',
    title: 'Ingresar · Licencias de abogados',
    loadComponent: () =>
      import('./components/pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'carga',
    title: 'Carga · Licencias de abogados',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/pages/carga/carga.component').then((m) => m.CargaComponent),
  },
  { path: '**', redirectTo: 'consulta' },
];
