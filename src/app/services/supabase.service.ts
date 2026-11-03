import { Usuario, DatosRegistro } from './../models/usuario.model';
import { Service, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { getSupabaseClient } from './supabase-client';

export interface Profile {
  id?: string;
  username: string;
  website: string;
  avatar_url: string;
}

@Service()
export class SupabaseService {
  readonly usuarioActual = signal<User | null>(null);

  async iniciarSesion(correo: string, password: string) {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo,
      password: password,
    });
    if (error) throw error;

    this.usuarioActual.set(data.user);
  }

  async iniciarSesionInvitado(): Promise<void> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) throw error;

    this.usuarioActual.set(data.user);
  }

  async registrarse(datos: DatosRegistro) {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
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
    const supabase = await getSupabaseClient();
    const { error } = await supabase.auth.signOut({ scope: 'local' });

    if (error) throw error;

    this.usuarioActual.set(null);
  }
}
