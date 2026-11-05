import { Service } from '@angular/core';
import { Producto } from '../models/producto.model';
import { getSupabaseClient } from './supabase-client';

@Service()
export class CandyBarService {
  async obtenerProductos() {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from('productos').select('*').order('id');
    if (error) throw error;
    return (data ?? []) as Producto[];
  }

  async obtenerPorId(id: string): Promise<Producto | null> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from('productos').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as Producto | null;
  }
}
