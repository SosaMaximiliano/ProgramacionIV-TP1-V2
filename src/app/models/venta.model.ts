import { ButacaCompra } from './butaca.model';
import { Entrada } from './entrada.model';
import { ProductoCompra } from './producto.model';

export enum FormaPago {
  Efectivo = 1,
  Debito = 2,
  Credito = 3,
  Transferencia = 4,
  Saldo = 5,
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

export type CompraVista = Pick<
  Venta,
  'id' | 'fechaVenta' | 'precioFinal' | 'estaPagado' | 'estaCancelada'
> & {
  importeAcreditable: number;
  entradas: (Pick<Entrada, 'id' | 'fila' | 'asiento' | 'precio' | 'funcionId' | 'estadoEntrada'> & {
    funcion: {
      fecha: string;
      hora: string;
      pelicula: { id: number; nombre: string } | null;
    } | null;
  })[];
  productos: ProductoCompraVista[];
};

export interface ProductoCompraVista {
  id: number;
  productoId: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface DatosCompra {
  funcionId: number;
  butacas: ButacaCompra[];
  metodoPago: FormaPago | null;
  usarSaldo: boolean;
  total: number;
  productos: ProductoCompra[];
  codigoCupon: string | null;
}
