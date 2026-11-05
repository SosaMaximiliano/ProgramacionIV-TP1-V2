import { inject, Service, signal } from '@angular/core';
import { ItemCarrito } from '../models/item-carrito.model';
import { CandyBarService } from './candy-bar.service';

@Service()
export class CarritoService {
  carrito = signal<ItemCarrito[]>([]);
  private candyBarService = inject(CandyBarService);

  async agregarItem(productoId: string): Promise<void> {
    const producto = await this.candyBarService.obtenerPorId(productoId);
    if (!producto) return;

    this.carrito.update((items) => {
      const existe = items.some((item) => item.producto.id === productoId);

      if (existe) {
        return items.map((item) =>
          item.producto.id === productoId ? { ...item, cantidad: item.cantidad + 1 } : item,
        );
      }

      return [...items, { producto, cantidad: 1 }];
    });
  }

  quitarUnidad(productoId: string): void {
    this.carrito.update((items) => {
      const item = items.find((actual) => actual.producto.id === productoId);
      if (!item) return items;

      if (item.cantidad === 1) {
        return items.filter((actual) => actual.producto.id !== productoId);
      }

      return items.map((actual) =>
        actual.producto.id === productoId ? { ...actual, cantidad: actual.cantidad - 1 } : actual,
      );
    });
  }

  cantidadDe(productoId: string): number {
    return this.carrito().find((item) => item.producto.id === productoId)?.cantidad ?? 0;
  }

  limpiar(): void {
    this.carrito.set([]);
  }

  obtenerProductos() {
    return this.carrito();
  }
}
