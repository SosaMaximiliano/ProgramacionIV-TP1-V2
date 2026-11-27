import { Service, inject } from '@angular/core';
import { FormaPago, CompraVista, Venta } from '../models/venta.model';
import { getSupabaseClient } from './supabase-client';
import { Cupon } from '../models/cupon.model';
import { Butaca } from '../models/butaca.model';
import { Producto, DetalleProductoDesdeSupabase } from '../models/producto.model';
import { Entrada } from '../models/entrada.model';
import { DatosCompra } from '../models/venta.model';
import { EntradaDesdeSupabase } from '../models/entrada.model';

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

    const { data, error } = await supabase.rpc('confirmar_compra_con_credito', {
      p_funcion_id: compra.funcionId,
      p_butacas: compra.butacas,
      p_productos: compra.productos.map((item) => ({
        producto_id: item.productoId,
        cantidad: item.cantidad,
        precio_unitario: item.precioUnitario,
      })),
      p_forma_pago: compra.metodoPago,
      p_usar_saldo: compra.usarSaldo,
      p_total: compra.total,
      p_codigo_cupon: compra.codigoCupon,
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
        `*,entradas(*,funcion:funciones(fecha,hora,pelicula:peliculas(id,nombre))),
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

    // Indicar `CompraVista[]` como tipo de retorno no sirve para manejar las columnas que devuelve
    // Supabase: puedo acceder a las propiedades, pero no tienen el contenido esperado.
    // Este mapeo asigna los valores de las columnas y relaciones al modelo de la aplicación.
    return (data ?? []).map((venta) => ({
      id: venta.id,
      fechaVenta: venta.fecha_venta,
      precioFinal: venta.precio_final,
      importeAcreditable: Number(venta.subtotal) - Number(venta.descuento_importe ?? 0),
      estaPagado: venta.esta_pagado,
      estaCancelada: venta.esta_cancelada,

      entradas: (venta.entradas ?? []).map((entrada: EntradaDesdeSupabase) => ({
        id: entrada.id,
        fila: entrada.fila,
        asiento: entrada.asiento,
        precio: entrada.precio,
        funcionId: entrada.funcion_id,
        estadoEntrada: entrada.estado_entrada,
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

  async cancelarCompra(
    ventaId: number,
  ): Promise<{ creditoAcreditado: number; saldoCredito: number }> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.rpc('cancelar_compra', {
      p_venta_id: ventaId,
    });

    if (error) throw error;
    return {
      creditoAcreditado: Number(data.credito_acreditado),
      saldoCredito: Number(data.saldo_credito),
    };
  }

  async obtenerSaldoCredito(): Promise<number> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.rpc('obtener_saldo_credito');
    if (error) throw error;
    return Number(data ?? 0);
  }

  async obtenerDescuentoAplicable(): Promise<{
    descuentoPrimeraCompra: number;
    descuentoMayores: number;
  }> {
    const supabase = await getSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user || user.is_anonymous) {
      return { descuentoPrimeraCompra: 0, descuentoMayores: 0 };
    }

    const [perfilResultado, ventasResultado] = await Promise.all([
      supabase.from('profiles').select('fecha_nacimiento').eq('id', user.id).maybeSingle(),
      supabase
        .from('ventas')
        .select('id', { count: 'exact', head: true })
        .eq('cliente_id', user.id)
        .eq('esta_pagado', true)
        .eq('esta_cancelada', false),
    ]);

    if (perfilResultado.error) throw perfilResultado.error;
    if (ventasResultado.error) throw ventasResultado.error;

    const descuentoPrimeraCompra = ventasResultado.count === 0 ? 20 : 0;
    const fechaNacimiento = perfilResultado.data?.fecha_nacimiento;
    const descuentoMayores = fechaNacimiento && this.esMayorDe50(fechaNacimiento) ? 10 : 0;

    return { descuentoPrimeraCompra, descuentoMayores };
  }

  private esMayorDe50(fechaNacimiento: string): boolean {
    const [anio, mes, dia] = fechaNacimiento.split('-').map(Number);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    let edad = hoy.getFullYear() - anio;
    const cumpleEsteAnio = new Date(hoy.getFullYear(), mes - 1, dia);

    if (hoy < cumpleEsteAnio) edad--;

    return edad > 50;
  }

  async obtenerUna(id: number): Promise<Venta | null> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.from('ventas').select('*').eq('id', id).maybeSingle();

    if (error) return null;

    // Indicar `Venta` como tipo de retorno no sirve para manejar las columnas que devuelve
    // Supabase: puedo acceder a las propiedades, pero no tienen el contenido de la tabla.
    // Este mapeo asigna a cada propiedad el valor de su columna correspondiente.
    return {
      id: data.id,
      clienteId: data.cliente_id,
      fechaVenta: data.fecha_venta,
      subtotal: Number(data.subtotal),
      descuentoPorcentaje: data.descuento_porcentaje,
      descuentoImporte: Number(data.descuento_importe),
      precioFinal: Number(data.precio_final),
      formaPago: data.forma_pago,
      estaPagado: data.esta_pagado,
      estaCancelada: data.esta_cancelada,
      entradas: [],
    };
  }

  async validarCupon(codigo: string): Promise<Cupon> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.rpc('validar_cupon', {
      p_codigo: codigo.trim(),
    });

    if (error) throw error;
    if (!data) throw new Error('Supabase no devolvió los datos del cupón.');

    return {
      id: data.id,
      codigo: data.codigo,
      descripcion: data.descripcion,
      porcentaje: data.porcentaje,
    };
  }
}
