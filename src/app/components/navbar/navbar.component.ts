import { RouterLink, Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { Component, effect, signal } from '@angular/core';
import { RolUsuario } from '../../models/usuario.model';
import { PerfilService } from '../../services/perfil.service';

@Component({
  imports: [RouterLink],
  selector: 'app-navbar-component',
  styleUrl: './navbar.component.css',
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  mensaje = '';
  rolActual = signal<RolUsuario | null>(null);

  constructor(
    public supabaseService: SupabaseService,
    private router: Router,
    private perfilService: PerfilService,
  ) {
    effect(() => {
      const usuario = this.supabaseService.usuarioActual();

      if (!usuario || usuario.is_anonymous) {
        this.rolActual.set(null);
        return;
      }

      void this.cargarRol(usuario.id);
    });
  }

  private async cargarRol(usuarioId: string): Promise<void> {
    try {
      const rol = await this.perfilService.obtenerRolActual();

      if (this.supabaseService.usuarioActual()?.id === usuarioId) {
        this.rolActual.set(rol);
      }
    } catch (error) {
      console.error('No se pudo obtener el rol del perfil', error);
      this.rolActual.set(null);
    }
  }

  async cerrarSesion(): Promise<void> {
    this.mensaje = '';

    try {
      await this.supabaseService.cerrarSesion();
      await this.router.navigateByUrl('/inicio');
    } catch {
      this.mensaje = 'No se pudo cerrar la sesión.';
    }
  }
}
