import { Component, OnInit, signal } from '@angular/core';
import { VentaService } from '../../services/venta.service';
import { CurrencyPipe } from '@angular/common';

//Crea un modelo auxiliar a partir de lo que recibe desde el método de VentaService
type ComprasUsuario = Awaited<ReturnType<VentaService['obtenerMisCompras']>>;

@Component({
  imports: [CurrencyPipe],
  selector: 'app-mis-compras-component',
  styleUrl: './mis-compras.component.css',
  templateUrl: './mis-compras.component.html',
})
export class MisComprasComponent implements OnInit {
  misCompras = signal<ComprasUsuario>([]);
  cargando = signal(true);
  error = signal('');

  constructor(private ventaService: VentaService) {}

  ngOnInit(): void {
    void this.cargarCompras();
  }

  private async cargarCompras(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');

    try {
      this.misCompras.set(await this.ventaService.obtenerMisCompras());
    } catch (error) {
      console.error(error);
      this.error.set('No se pudieron cargar tus compras.');
    } finally {
      this.cargando.set(false);
    }
  }
}
