import { Service } from '@angular/core';
import { getSupabaseClient } from './supabase-client';

export interface FacturacionDiaria {
  fecha: string;
  facturacion: number;
  entradasVendidas: number;
}

interface ReporteDesdeSupabase {
  fecha: string;
  facturacion: number | string;
  entradas_vendidas: number | string;
}

@Service()
export class ReporteService {
  async obtenerFacturacionDiaria(): Promise<FacturacionDiaria[]> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.rpc('obtener_reporte_facturacion');
    if (error) throw error;

    return ((data ?? []) as ReporteDesdeSupabase[]).map((fila) => ({
      fecha: fila.fecha,
      facturacion: Number(fila.facturacion),
      entradasVendidas: Number(fila.entradas_vendidas),
    }));
  }
}
