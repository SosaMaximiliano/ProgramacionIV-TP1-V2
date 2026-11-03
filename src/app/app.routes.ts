import { Routes } from '@angular/router';
import { authGuard } from './guards/usuario-registrado.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full',
  },
  {
    path: 'inicio',
    loadComponent: () =>
      import('./components/inicio/inicio.component').then((m) => m.InicioComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./components/registro/registro.component').then((m) => m.RegistroComponent),
  },
  {
    path: 'cartelera',
    loadComponent: () =>
      import('./components/cartelera/cartelera.component').then((m) => m.CarteleraComponent),
  },
  {
    path: 'detalle',
    loadChildren: () =>
      import('./components/pelicula/pelicula.routes').then((m) => m.PELICULA_ROUTES),
  },
  {
    path: 'seleccionar-butacas',
    loadChildren: () =>
      import('./components/seleccionar-butacas/seleccionar-butacas.routes').then(
        (m) => m.BUTACAS_ROUTES,
      ),
  },

  {
    path: 'compra',
    loadComponent: () =>
      import('./components/compra/compra.component').then((m) => m.CompraComponent),
  },

  {
    path: 'mis-compras',
    loadComponent: () =>
      import('./components/mis-compras/mis-compras.component').then((m) => m.MisComprasComponent),
    canActivate: [authGuard],
  },
  {
    path: 'error',
    loadComponent: () => import('./components/error/error.component').then((m) => m.ErrorComponent),
  },
  {
    path: '**',
    redirectTo: 'error',
  },
];
