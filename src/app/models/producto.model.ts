export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  categoria: string;
}

export interface DetalleProductoDesdeSupabase {
  id: number;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  producto: {
    nombre: string;
    categoria: string;
  } | null;
}

export interface ProductoCompra {
  productoId: string;
  cantidad: number;
  precioUnitario: number;
}
