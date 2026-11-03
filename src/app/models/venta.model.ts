import { Entrada } from './entrada.model';

export enum FormaPago {
  Efectivo = 1,
  Debito = 2,
  Credito = 3,
  Transferencia = 4,
  Otro = 9,
}
export interface Venta {
  id: number;
  clienteId: string;
  fechaVenta: string;
  subtotal: number;
  descuentoPorcentaje: number;
  descuentoImporte: number;
  precioFinal: number;
  formaPago: FormaPago;
  estaPagado: boolean;
  estaCancelada: boolean;
  entradas: Entrada[];
}

export type CompraVista = Pick<Venta, 'id' | 'fechaVenta' | 'precioFinal'> & {
  entradas: (Pick<Entrada, 'id' | 'fila' | 'asiento' | 'precio' | 'funcionId'> & {
    funcion: {
      fecha: string;
      hora: string;
      pelicula: { nombre: string } | null;
    } | null;
  })[];
};
