import { Service } from '@angular/core';
import { Sala } from '../models/sala.model';
import { getSupabaseClient } from './supabase-client';

@Service()
export class SalaService {
  async obtenerTodas(): Promise<Sala[]> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from('salas').select('*').order('id');
    if (error) throw error;
    return (data ?? []).map((sala) => this.mapearSala(sala));
  }

  async obtenerPorId(id: number): Promise<Sala | undefined> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from('salas').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? this.mapearSala(data) : undefined;
  }

  private mapearSala(sala: any): Sala {
    // Indicar `Sala` como tipo de retorno no sirve para manejar las columnas que devuelve
    // Supabase: puedo acceder a las propiedades, pero no tienen el contenido de la tabla.
    // Este mapeo asigna a cada propiedad el valor de la columna correspondiente.
    return {
      id: sala.id,
      nombre: sala.nombre,
      filas: sala.filas,
    };
  }
}
