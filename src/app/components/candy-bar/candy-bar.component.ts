import { Component, OnInit, signal } from '@angular/core';
import { CurrencyPipe, Location } from '@angular/common';
import { CandyBarService } from '../../services/candy-bar.service';
import { Producto } from '../../models/producto.model';
import { CarritoService } from '../../services/carrito.service';

@Component({
  imports: [CurrencyPipe],
  selector: 'app-candy-bar',
  styleUrl: './candy-bar.component.css',
  templateUrl: './candy-bar.component.html',
})
export class CandyBarComponent implements OnInit {
  productos = signal<Producto[]>([]);
  cargando = signal(true);
  errorCarga = signal('');

  constructor(
    private candyBarService: CandyBarService,
    public carritoService: CarritoService,
    private location: Location,
  ) {}

  ngOnInit(): void {
    void this.cargarProductos();
  }

  private async cargarProductos(): Promise<void> {
    this.cargando.set(true);
    this.errorCarga.set('');

    try {
      this.productos.set(await this.candyBarService.obtenerProductos());
    } catch (error) {
      console.error(error);
      this.errorCarga.set('No se pudieron cargar los productos. Intentá de nuevo más tarde.');
    } finally {
      this.cargando.set(false);
    }
  }

  totalCarrito(): number {
    return this.carritoService.carrito().reduce(
      (total, item) => total + item.producto.precio * item.cantidad,
      0,
    );
  }

  unidadesEnCarrito(): number {
    return this.carritoService.carrito().reduce((total, item) => total + item.cantidad, 0);
  }

  volverACompra(): void {
    this.location.back();
  }
}
