import { Service } from '@angular/core';
import { Pelicula } from '../models/pelicula.model';
import { getSupabaseClient } from './supabase-client';

@Service()
export class PeliculaService {
  async obtenerTodas(): Promise<Pelicula[]> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from('peliculas').select('*').order('id');
    if (error) throw error;
    return (data ?? []).map((pelicula) => ({
      id: pelicula.id,
      nombre: pelicula.nombre,
      imagen: pelicula.imagen,
      sinopsis: pelicula.sinopsis,
      duracion: pelicula.duracion,
      genero: pelicula.genero,
      clasificacionEdad: pelicula.clasificacion_edad,
      fechaEstreno: pelicula.fecha_estreno,
      estaDisponible: pelicula.esta_disponible,
    }));
  }

  async obtenerPorId(id: number): Promise<Pelicula> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from('peliculas').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return {
      id: data.id,
      nombre: data.nombre,
      imagen: data.imagen,
      sinopsis: data.sinopsis,
      duracion: data.duracion,
      genero: data.genero,
      clasificacionEdad: data.clasificacion_edad,
      fechaEstreno: data.fecha_estreno,
      estaDisponible: data.esta_disponible,
    };
  }
}
