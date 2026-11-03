import { Routes } from '@angular/router';

export const PELICULA_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full',
  },

  {
    path: ':id',
    loadComponent: () =>
      import('../detalle-pelicula-component/detalle-pelicula.component').then(
        (m) => m.DetallePeliculaComponent,
      ),
  },
];
