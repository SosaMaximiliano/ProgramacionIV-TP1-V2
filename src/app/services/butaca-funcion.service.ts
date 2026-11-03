import { Service } from '@angular/core';
import { FilaButacas } from '../models/butaca.model';
import { getSupabaseClient } from './supabase-client';

@Service()
export class ButacaFuncionService {
  async obtenerButacasOcupadas(funcionId: number, filas: FilaButacas[]): Promise<number[]> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.rpc('obtener_butacas_ocupadas', {
      p_funcion_id: funcionId,
    });

    if (error) throw error;

    const butacasDeLaSala = filas.flatMap((fila) => fila.bloques.flat());

    return (data ?? []).flatMap((ocupada: { fila: string; asiento: number }) => {
      const butaca = butacasDeLaSala.find(
        (item) => item.fila === ocupada.fila && item.numero === ocupada.asiento,
      );

      return butaca ? [butaca.id] : [];
    });
  }
}
