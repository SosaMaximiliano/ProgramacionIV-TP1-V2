import { Component } from '@angular/core';
import { SupabaseService } from '../../services/supabase-service';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-login-component',
  styleUrl: './login-component.css',
  templateUrl: './login-component.html',
})
export class LoginComponent {
  correo = '';
  password = '';
  mensaje = '';
  procesando = false;

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
  ) {}

  async iniciarSesion(): Promise<void> {
    this.mensaje = '';
    this.procesando = true;

    try {
      await this.supabaseService.iniciarSesion(this.correo, this.password);
      await this.router.navigateByUrl('/inicio');
    } catch (error) {
      this.mensaje = 'No se pudo iniciar sesión. Revisá el correo y la contraseña.';
      console.log(error);
    } finally {
      this.procesando = false;
    }
  }
}
