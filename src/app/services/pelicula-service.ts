import { Service } from '@angular/core';
import { Pelicula } from '../models/pelicula-model';
import { SupabaseService } from './supabase-service';
import { getSupabaseClient } from './supabase-client';

@Service()
export class PeliculaService {
  async obtenerTodas(): Promise<Pelicula[]> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from('peliculas').select('*').order('id');
    if (error) throw error;
    return data;
  }

  async obtenerPorId(id: number): Promise<Pelicula> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from('peliculas').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  }
}
