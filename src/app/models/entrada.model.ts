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
