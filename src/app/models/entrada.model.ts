export type EstadoEntrada = 'disponible' | 'emitida' | 'utilizada' | 'cancelada';

export interface Entrada {
  id: number;
  funcionId: number;
  fila: string;
  asiento: number;
  precio: number;
  ventaId: number;
  estadoEntrada: EstadoEntrada;
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
    pelicula: string;
  };
}
