import { Service } from '@angular/core';
import { Funcion } from '../models/funcion.model';
import { getSupabaseClient } from './supabase-client';

@Service()
export class FuncionService {
  //
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
    if (!data) return undefined;

    return {
      id: data.id,
      peliculaId: data.pelicula_id,
      salaId: data.sala_id,
      fecha: data.fecha,
      hora: data.hora,
      precioEntrada: data.precio_entrada,
    };
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
