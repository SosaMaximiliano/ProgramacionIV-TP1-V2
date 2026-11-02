import { SupabaseService } from './../../services/supabase-service';
import { DatosRegistro, Usuario } from './../../models/usuario-model';
import { Component, inject, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

@Component({
  imports: [ReactiveFormsModule, FormsModule, RouterLink],
  selector: 'app-registro-component',
  styleUrl: './registro-component.css',
  templateUrl: './registro-component.html',
})
export class RegistroComponent {
  datosRegistro = {
    correo: '',
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    tipoSangre: '',
    colorOjos: '',
    diasVacaciones: 0,
  };
  password = '';
  repetirPassword = '';
  mensaje = '';
  registroCompletado = signal<boolean>(false);
  procesando = false;

  private fb = inject(FormBuilder);

  constructor(
    private supabaseService: SupabaseService,
    private router: Router,
  ) {}

  formRegistro: FormGroup = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: ['', [Validators.required, Validators.minLength(2)]],
    correo: ['', [Validators.required, Validators.email]],
    fechaNacimiento: ['', [Validators.required]],
    tipoSangre: ['', [Validators.required]],
    colorOjos: ['', [Validators.required]],
    diasVacaciones: ['', [Validators.required, Validators.min(0), Validators.max(365)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    repetirPassword: ['', [Validators.required, Validators.minLength(8)]],
  });

  esCampoInvalido(nombreCampo: string): boolean {
    const campo = this.formRegistro.get(nombreCampo);
    return !!(campo && campo.invalid && (campo.dirty || campo.touched));
  }

  private moverValoresControl() {
    this.datosRegistro.nombre = this.formRegistro.get('nombre')?.value;
    this.datosRegistro.apellido = this.formRegistro.get('apellido')?.value;
    this.datosRegistro.correo = this.formRegistro.get('correo')?.value;
    this.datosRegistro.fechaNacimiento = this.formRegistro.get('fechaNacimiento')?.value;
    this.datosRegistro.tipoSangre = this.formRegistro.get('tipoSangre')?.value;
    this.datosRegistro.colorOjos = this.formRegistro.get('colorOjos')?.value;
    this.datosRegistro.diasVacaciones = this.formRegistro.get('diasVacaciones')?.value;
    this.password = this.formRegistro.get('password')?.value;
  }

  async registrarse() {
    this.mensaje = '';

    if (this.password !== this.repetirPassword) {
      this.mensaje = 'Las contraseñas no coinciden.';
      return;
    }

    this.procesando = true;

    this.moverValoresControl();

    try {
      const datos: DatosRegistro = { ...this.datosRegistro, password: this.password };
      const sesionIniciada = await this.supabaseService.registrarse(datos);

      if (sesionIniciada) {
        this.mensaje = 'Registro exitoso.';
        await this.router.navigateByUrl('/inicio');
      }
    } catch (error) {
      this.mensaje = 'No se pudo completar el registro.';
      console.log(error);
    } finally {
      this.procesando = false;
    }
  }
}
