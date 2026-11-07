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
    return {
      id: sala.id,
      nombre: sala.nombre,
      filas: sala.filas,
    };
  }
}
