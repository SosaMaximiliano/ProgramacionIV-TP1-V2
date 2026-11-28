import { Service } from '@angular/core';
import { getSupabaseClient } from './supabase-client';
import { Entrada } from '../models/entrada.model';

@Service()
export class EntradaService {
  async obtenerUna(id: number): Promise<Entrada | null> {
    const supabase = await getSupabaseClient();

    const { data, error } = await supabase
      .from('entradas')
      .select(
        `*,
        funcion:funciones(
          fecha,
          hora,
          sala_id,
          proyeccion,
          idioma,
          pelicula:peliculas(nombre, imagen)
        )`,
      )
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    // Indicar `Entrada` como tipo de retorno no sirve para manejar las columnas que devuelve
    // Supabase: puedo acceder a las propiedades, pero no tienen el contenido de la tabla.
    // Este mapeo asigna a cada propiedad el valor de la columna correspondiente.
    return {
      id: data.id,
      ventaId: data.venta_id,
      funcionId: data.funcion_id,
      fila: data.fila,
      asiento: data.asiento,
      precio: Number(data.precio),
      estadoEntrada: data.estado_entrada,
      funcion: data.funcion
        ? {
            fecha: data.funcion.fecha,
            hora: data.funcion.hora,
            salaId: data.funcion.sala_id,
            proyeccion: data.funcion.proyeccion,
            idioma: data.funcion.idioma,
            pelicula: data.funcion.pelicula,
          }
        : null,
    };
  }

  async validar(id: number): Promise<void> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase.rpc('validar_entrada', { p_entrada_id: id });

    if (error) throw error;
    return data;
  }
}
