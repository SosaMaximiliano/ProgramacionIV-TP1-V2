import { Service } from '@angular/core';
import { Sala } from '../models/sala.model';
import { getSupabaseClient } from './supabase-client';

@Service()
export class SalaService {
  async obtenerTodas() {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from('salas').select('*').order('id');
    if (error) throw error;
    return data;
  }

  async obtenerPorId(id: number): Promise<Sala | undefined> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from('salas').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? data : undefined;
  }
}
