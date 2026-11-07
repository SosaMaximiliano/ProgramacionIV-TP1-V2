import { Routes } from '@angular/router';
import { authGuard } from './guards/usuario-registrado.guard';
import { administradorGuard } from './guards/administrador.guard';

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
    path: 'candy-bar',
    loadComponent: () =>
      import('./components/candy-bar/candy-bar.component').then((m) => m.CandyBarComponent),
  },
  {
    path: 'admin/peliculas',
    loadComponent: () =>
      import('./components/gestion-peliculas/gestion-peliculas.component').then(
        (m) => m.GestionPeliculasComponent,
      ),
    canActivate: [administradorGuard],
  },
  {
    path: 'admin/funciones',
    loadComponent: () =>
      import('./components/gestion-funciones/gestion-funciones.component').then(
        (m) => m.GestionFuncionesComponent,
      ),
    canActivate: [administradorGuard],
  },
  {
    path: 'admin/reportes',
    loadComponent: () =>
      import('./components/reporte-facturacion/reporte-facturacion.component').then(
        (m) => m.ReporteFacturacionComponent,
      ),
    canActivate: [administradorGuard],
  },
  {
    path: '**',
    redirectTo: 'error',
  },
];
