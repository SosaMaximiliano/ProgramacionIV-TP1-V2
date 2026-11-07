import { Service } from '@angular/core';
import { Pelicula } from '../models/pelicula.model';
import { getSupabaseClient } from './supabase-client';

type DatosPelicula = Omit<Pelicula, 'id'>;

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

  async crear(pelicula: DatosPelicula): Promise<void> {
    const supabase = await getSupabaseClient();

    const { error } = await supabase.from('peliculas').insert({
      nombre: pelicula.nombre,
      imagen: pelicula.imagen,
      sinopsis: pelicula.sinopsis,
      duracion: pelicula.duracion,
      genero: pelicula.genero,
      clasificacion_edad: pelicula.clasificacionEdad,
      fecha_estreno: pelicula.fechaEstreno,
      esta_disponible: pelicula.estaDisponible,
    });

    if (error) throw error;
  }

  async actualizar(id: number, pelicula: DatosPelicula): Promise<void> {
    const supabase = await getSupabaseClient();

    const { error } = await supabase
      .from('peliculas')
      .update({
        nombre: pelicula.nombre,
        imagen: pelicula.imagen,
        sinopsis: pelicula.sinopsis,
        duracion: pelicula.duracion,
        genero: pelicula.genero,
        clasificacion_edad: pelicula.clasificacionEdad,
        fecha_estreno: pelicula.fechaEstreno,
        esta_disponible: pelicula.estaDisponible,
      })
      .eq('id', id);

    if (error) throw error;
  }

  async eliminar(id: number): Promise<void> {
    const supabase = await getSupabaseClient();

    const { error } = await supabase.from('peliculas').delete().eq('id', id);

    if (error) throw error;
  }

  async obtenerTresMasVendidas() {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('peliculas_mas_vendidas')
      .select('*')
      .order('entradas_vendidas', { ascending: false })
      .order('id', { ascending: true })
      .limit(3);

    if (error) throw error;

    return data ?? [];
  }
}
