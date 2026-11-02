import { Service } from '@angular/core';
import { Sala } from '../models/sala-model';
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

  async obtenerButacas(salaId: number) {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('butacas')
      .select('*')
      .eq('salaId', salaId)
      .order('numero');
    if (error) throw error;
    return data;
  }

  async obtenerButacasOcupadas(salaId: number) {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('butacas')
      .select('*')
      .eq('salaId', salaId)
      .eq('estaOcupada', true)
      .order('numero');
    if (error) throw error;
    return data;
  }

  async obtenerButacasLibres(salaId: number) {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('butacas')
      .select('*')
      .eq('salaId', salaId)
      .eq('estaOcupada', true)
      .order('numero');
    if (error) throw error;
    return data;
  }

  async obtenerButacaPorId(butacaId: number) {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from('butacas').select('*').eq('id', butacaId);
    if (error) throw error;
    return data;
  }
}
