import { BUTACAS_ROUTES } from './components/seleccionar-butacas-component/seleccionar-butacas-routes';
import { DetallePeliculaComponent } from './components/detalle-pelicula-component/detalle-pelicula-component';
import { LoginComponent } from './components/login-component/login-component';
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full',
  },
  {
    path: 'inicio',
    loadComponent: () =>
      import('./components/inicio-component/inicio-component').then((m) => m.InicioComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login-component/login-component').then((m) => m.LoginComponent),
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./components/registro-component/registro-component').then((m) => m.RegistroComponent),
  },
  {
    path: 'cartelera',
    loadComponent: () =>
      import('./components/cartelera-component/cartelera-component').then(
        (m) => m.CarteleraComponent,
      ),
  },
  {
    path: 'detalle',
    loadChildren: () =>
      import('./components/pelicula-component/pelicula-routes').then((m) => m.PELICULA_ROUTES),
  },
  {
    path: 'seleccionar-butacas',
    loadChildren: () =>
      import('./components/seleccionar-butacas-component/seleccionar-butacas-routes').then(
        (m) => m.BUTACAS_ROUTES,
      ),
  },

  {
    path: 'mis-compras',
    loadComponent: () =>
      import('./components/mis-compras-component/mis-compras-component').then(
        (m) => m.MisComprasComponent,
      ),
  },
  {
    path: 'error',
    loadComponent: () =>
      import('./components/error-component/error-component').then((m) => m.ErrorComponent),
  },
  {
    path: '**',
    redirectTo: 'error',
  },
];
