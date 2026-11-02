import { Service } from '@angular/core';
import { Funcion } from '../models/funcion.model';
import { getSupabaseClient } from './supabase-client';

@Service()
export class FuncionService {
  async obtenerTodas(): Promise<Funcion[]> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from('funciones').select('*').order('id');
    if (error) throw error;
    return data;
  }

  async obtenerPorId(id: number): Promise<Funcion | undefined> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from('funciones').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? data : undefined;
  }

  async obtenerPorIdPelicula(peliculaId: number): Promise<Funcion[]> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('funciones')
      .select('*')
      .eq('pelicula_id', peliculaId)
      .order('fecha')
      .order('hora');
    if (error) throw error;
    return data;
  }
}
