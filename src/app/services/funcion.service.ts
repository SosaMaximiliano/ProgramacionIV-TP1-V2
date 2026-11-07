import { Service } from '@angular/core';
import { Funcion } from '../models/funcion.model';
import { getSupabaseClient } from './supabase-client';

export type DatosFuncion = Omit<Funcion, 'id'>;

@Service()
export class FuncionService {
  //
  async obtenerTodas(): Promise<Funcion[]> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from('funciones').select('*').order('id');
    if (error) throw error;
    return (data ?? []).map((funcion) => this.mapearFuncion(funcion));
  }

  async obtenerPorId(id: number): Promise<Funcion | undefined> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from('funciones').select('*').eq('id', id).maybeSingle();

    if (error) throw error;
    if (!data) return undefined;

    return this.mapearFuncion(data);
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
    return (data ?? []).map((funcion) => this.mapearFuncion(funcion));
  }

  async crear(funcion: DatosFuncion): Promise<void> {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.from('funciones').insert(this.aRegistro(funcion));
    if (error) throw error;
  }

  async actualizar(id: number, funcion: DatosFuncion): Promise<void> {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.from('funciones').update(this.aRegistro(funcion)).eq('id', id);
    if (error) throw error;
  }

  async eliminar(id: number): Promise<void> {
    const supabase = await getSupabaseClient();
    const { error } = await supabase.from('funciones').delete().eq('id', id);
    if (error) throw error;
  }

  private aRegistro(funcion: DatosFuncion) {
    return {
      pelicula_id: funcion.peliculaId,
      sala_id: funcion.salaId,
      fecha: funcion.fecha,
      hora: funcion.hora,
      precio_entrada: funcion.precioEntrada,
      idioma: funcion.idioma,
      proyeccion: funcion.proyeccion,
    };
  }

  private mapearFuncion(funcion: any): Funcion {
    return {
      id: funcion.id,
      peliculaId: funcion.pelicula_id,
      salaId: funcion.sala_id,
      fecha: funcion.fecha,
      hora: funcion.hora,
      precioEntrada: Number(funcion.precio_entrada),
      idioma: funcion.idioma,
      proyeccion: funcion.proyeccion,
    };
  }
}
