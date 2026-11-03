import { Routes } from '@angular/router';

export const BUTACAS_ROUTES: Routes = [
  {
    path: ':id',
    loadComponent: () =>
      import('./seleccionar-butacas.component').then((m) => m.SeleccionarButacasComponent),
  },
];
