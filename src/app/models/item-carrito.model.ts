import { Producto } from './producto.model';

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}
