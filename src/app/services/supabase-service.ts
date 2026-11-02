import { Usuario, DatosRegistro } from './../models/usuario-model';
import { Service, signal } from '@angular/core';
import {
  AuthChangeEvent,
  createClient,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface Profile {
  id?: string;
  username: string;
  website: string;
  avatar_url: string;
}

@Service()
export class SupabaseService {
  supabase: SupabaseClient;
  readonly usuarioActual = signal<User | null>(null);

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabasePublishableKey);
  }

  async iniciarSesion(correo: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: correo,
      password: password,
    });
    if (error) throw error;

    this.usuarioActual.set(data.user);
  }

  async registrarse(datos: DatosRegistro) {
    const { data, error } = await this.supabase.auth.signUp({
      email: datos.correo,
      password: datos.password,
      options: {
        data: {
          nombre: datos.nombre,
          apellido: datos.apellido,
          fecha_nacimiento: datos.fechaNacimiento,
          tipo_sangre: datos.tipoSangre,
          color_ojos: datos.colorOjos,
          dias_vacaciones: datos.diasVacaciones,
        },
      },
    });

    if (error) throw error;

    this.usuarioActual.set(data.session?.user ?? null);
    return data.session !== null;
  }

  async cerrarSesion() {
    const { error } = await this.supabase.auth.signOut({ scope: 'local' });

    if (error) throw error;

    this.usuarioActual.set(null);
  }
}
