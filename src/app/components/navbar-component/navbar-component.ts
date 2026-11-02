import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase-service';

@Component({
  imports: [RouterLink],
  selector: 'app-navbar-component',
  styleUrl: './navbar-component.css',
  templateUrl: './navbar-component.html',
})
export class NavbarComponent {
  mensaje = '';

  constructor(
    public supabaseService: SupabaseService,
    private router: Router,
  ) {}

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
