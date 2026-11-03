import { Service } from '@angular/core';
import { FormaPago, CompraVista } from '../models/venta.model';
import { getSupabaseClient } from './supabase-client';

interface ButacaCompra {
  fila: string;
  asiento: number;
  precio: number;
}

interface DatosCompra {
  funcionId: number;
  butacas: ButacaCompra[];
  metodoPago: FormaPago;
  total: number;
}

interface EntradaDesdeSupabase {
  id: number;
  fila: string;
  asiento: number;
  precio: number;
  funcion_id: number;
  funcion: {
    fecha: string;
    hora: string;
    pelicula: string;
  };
}

@Service()
export class VentaService {
  async registrarVentaYEntradas(compra: DatosCompra): Promise<number> {
    const supabase = await getSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!authData.user) throw new Error('Se requiere una sesión para comprar entradas.');

    const { data: venta, error: ventaError } = await supabase
      .from('ventas')
      .insert({
        cliente_id: authData.user.id,
        fecha_venta: new Date().toISOString(),
        subtotal: compra.total,
        precio_final: compra.total,
        forma_pago: compra.metodoPago,
        esta_pagado: true,
        esta_cancelada: false,
        descuento_porcentaje: 0,
        descuento_importe: 0,
      })
      .select('id')
      .single();

    if (ventaError) throw ventaError;

    const entradas = compra.butacas.map((butaca) => ({
      venta_id: venta.id,
      funcion_id: compra.funcionId,
      fila: butaca.fila,
      asiento: butaca.asiento,
      precio: butaca.precio,
      estado_entrada: 'emitida',
    }));

    const { error: entradasError } = await supabase.from('entradas').insert(entradas);
    if (entradasError) throw entradasError;

    return venta.id;
  }

  async obtenerMisCompras(): Promise<CompraVista[]> {
    const supabase = await getSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) throw authError;

    const usuario = authData.user;
    if (!usuario || usuario.is_anonymous) {
      throw new Error('Se necesita una cuenta para consultar las compras.');
    }

    const { data, error } = await supabase
      .from('ventas')
      .select(`*,entradas(*,funcion:funciones(fecha,hora,pelicula:peliculas(nombre)))`)
      .eq('cliente_id', usuario.id)
      .order('fecha_venta', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((venta) => ({
      id: venta.id,
      fechaVenta: venta.fecha_venta,
      precioFinal: venta.precio_final,
      entradas: (venta.entradas ?? []).map((entrada: EntradaDesdeSupabase) => ({
        id: entrada.id,
        fila: entrada.fila,
        asiento: entrada.asiento,
        precio: entrada.precio,
        funcionId: entrada.funcion_id,
        funcion: entrada.funcion
          ? {
              fecha: entrada.funcion.fecha,
              hora: entrada.funcion.hora,
              pelicula: entrada.funcion.pelicula,
            }
          : null,
      })),
    }));
  }
}
