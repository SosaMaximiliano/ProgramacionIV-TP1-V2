export type EstadoEntrada = 'disponible' | 'emitida' | 'utilizada' | 'cancelada';

export interface Entrada {
  id: number;
  funcionId: number;
  fila: string;
  asiento: number;
  precio: number;
  ventaId: number;
  estadoEntrada: EstadoEntrada;
  funcion?: {
    fecha: string;
    hora: string;
    salaId: number;
    proyeccion: string;
    idioma: string;
    pelicula: { nombre: string; imagen: string } | null;
  } | null;
}

export interface EntradaDesdeSupabase {
  id: number;
  fila: string;
  asiento: number;
  precio: number;
  funcion_id: number;
  estado_entrada: EstadoEntrada;
  funcion: {
    fecha: string;
    hora: string;
    sala_id: number;
    proyeccion: string;
    idioma: string;
    pelicula: { nombre: string; imagen: string } | null;
  } | null;
}
