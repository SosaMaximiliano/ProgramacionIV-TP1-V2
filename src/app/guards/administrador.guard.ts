import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PerfilService } from '../services/perfil.service';

export const administradorGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const perfilService = inject(PerfilService);

  try {
    const rol = await perfilService.obtenerRolActual();

    if (rol === 'administrador') {
      return true;
    }

    return router.createUrlTree(['/inicio']);
  } catch (error) {
    console.error('No se pudo comprobar el rol del usuario', error);
    return router.createUrlTree(['/inicio']);
  }
};
