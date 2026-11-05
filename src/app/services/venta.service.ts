import { Service } from '@angular/core';
import { FormaPago, CompraVista } from '../models/venta.model';
import { getSupabaseClient } from './supabase-client';

interface ButacaCompra {
  fila: string;
  asiento: number;
  precio: number;
}

interface ProductoCompra {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
}

interface DatosCompra {
  funcionId: number;
  butacas: ButacaCompra[];
  metodoPago: FormaPago;
  total: number;
  productos: ProductoCompra[];
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

interface DetalleProductoDesdeSupabase {
  id: number;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  producto: {
    nombre: string;
    categoria: string;
  } | null;
}

@Service()
export class VentaService {
  async registrarVentaYEntradas(compra: DatosCompra): Promise<number> {
    const supabase = await getSupabaseClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error('Se requiere una sesión para comprar.');

    const { data, error } = await supabase.rpc('confirmar_compra', {
      p_funcion_id: compra.funcionId,
      p_butacas: compra.butacas,
      p_productos: compra.productos.map((item) => ({
        producto_id: item.productoId,
        cantidad: item.cantidad,
        precio_unitario: item.precioUnitario,
      })),
      p_forma_pago: compra.metodoPago,
      p_total: compra.total,
    });

    if (error) throw error;
    if (data === null) throw new Error('Supabase no devolvió el ID de la venta.');

    return data;
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
      .select(
        `*,entradas(*,funcion:funciones(fecha,hora,pelicula:peliculas(nombre))),
             detalle_venta(
              id,
              producto_id,
              cantidad,
              precio_unitario,
              producto:productos(nombre,categoria)
            )
          `,
      )
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

      productos: (venta.detalle_venta ?? []).map((detalle: DetalleProductoDesdeSupabase) => ({
        id: detalle.id,
        productoId: detalle.producto_id,
        nombre: detalle.producto?.nombre ?? 'Producto',
        categoria: detalle.producto?.categoria ?? '',
        cantidad: Number(detalle.cantidad),
        precioUnitario: Number(detalle.precio_unitario),
        subtotal: Number(detalle.cantidad) * Number(detalle.precio_unitario),
      })),
    }));
  }

  async obtenerDescuentoPrimeraCompra(): Promise<number> {
    const supabase = await getSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user || user.is_anonymous) return 0;

    const { count, error } = await supabase
      .from('ventas')
      .select('id', { count: 'exact', head: true })
      .eq('cliente_id', user.id)
      .eq('esta_pagado', true)
      .eq('esta_cancelada', false);

    if (error) throw error;

    return count === 0 ? 20 : 0;
  }
}
