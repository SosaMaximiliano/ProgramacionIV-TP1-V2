import { Service } from '@angular/core';
import { DatosResena, Resena } from '../models/resena.model';
import { getSupabaseClient } from './supabase-client';

@Service()
export class ResenaService {
  async obtenerPorPelicula(peliculaId: number): Promise<Resena[]> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('resenas')
      .select('id, pelicula_id, usuario_id, puntuacion, comentario')
      .eq('pelicula_id', peliculaId)
      .order('id', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row) => this.mapear(row));
  }

  async obtenerPropia(peliculaId: number, usuarioId: string): Promise<Resena | null> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('resenas')
      .select('id, pelicula_id, usuario_id, puntuacion, comentario')
      .eq('pelicula_id', peliculaId)
      .eq('usuario_id', usuarioId)
      .maybeSingle();

    if (error) throw error;
    return data ? this.mapear(data) : null;
  }

  async crear(resena: DatosResena): Promise<void> {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.from('resenas').insert(this.aRegistro(resena));
    if (error) throw error;
  }

  async actualizar(id: number, resena: DatosResena): Promise<void> {
    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from('resenas')
      .update({ puntuacion: resena.puntuacion, comentario: resena.comentario })
      .eq('id', id)
      .eq('usuario_id', resena.usuarioId);
    if (error) throw error;
  }

  private aRegistro(resena: DatosResena) {
    return {
      pelicula_id: resena.peliculaId,
      usuario_id: resena.usuarioId,
      puntuacion: resena.puntuacion,
      comentario: resena.comentario,
    };
  }

  private mapear(row: any): Resena {
    return {
      id: row.id,
      peliculaId: row.pelicula_id,
      usuarioId: row.usuario_id,
      puntuacion: row.puntuacion,
      comentario: row.comentario,
    };
  }
}
