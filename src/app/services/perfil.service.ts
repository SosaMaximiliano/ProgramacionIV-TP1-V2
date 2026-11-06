import { Service } from '@angular/core';
import { RolUsuario } from '../models/usuario.model';
import { getSupabaseClient } from './supabase-client';

@Service()
export class PerfilService {
  async obtenerRolActual(): Promise<RolUsuario | null> {
    const supabase = await getSupabaseClient();

    const {
      data: { user },
      error: errorAuth,
    } = await supabase.auth.getUser();

    if (errorAuth) throw errorAuth;
    if (!user || user.is_anonymous) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('rol')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;

    const rol = data?.rol;

    if (rol === 'usuario' || rol === 'empleado' || rol === 'administrador') {
      return rol;
    }

    return null;
  }
}
