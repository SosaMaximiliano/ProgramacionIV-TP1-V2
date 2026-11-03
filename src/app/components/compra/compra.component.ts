import { Component, signal } from '@angular/core';
import { Butaca } from '../../models/butaca.model';
import { Funcion } from '../../models/funcion.model';
import { CurrencyPipe } from '@angular/common';
import { VentaService } from '../../services/venta.service';
import { FormaPago } from '../../models/venta.model';

@Component({
  imports: [CurrencyPipe],
  selector: 'app-compra-component',
  styleUrl: './compra.component.css',
  templateUrl: './compra.component.html',
})
export class CompraComponent {
  readonly formasPago = FormaPago;
  funcion?: Funcion;
  nombrePelicula = '';
  butacas: Butaca[] = [];
  total: number = 0;
  metodoPago = signal<FormaPago | null>(null);
  procesando = signal(false);
  errorCompra = signal('');
  compraConfirmada = signal(false);

  constructor(private ventaService: VentaService) {
    const state = history.state as {
      datosCompra?: {
        funcion?: Funcion;
        nombrePelicula?: string;
        butacas?: Butaca[];
        total?: number;
      };
    };

    const datosCompra = state.datosCompra;

    this.funcion = datosCompra?.funcion;
    this.nombrePelicula = datosCompra?.nombrePelicula ?? '';
    this.butacas = datosCompra?.butacas ?? [];
    this.total = datosCompra?.total ?? 0;
  }

  precioButaca(butaca: Butaca): number {
    const RECARGO_VIP = 2000;
    const precioBase = this.funcion?.precioEntrada ?? 0;

    return butaca.tipo === 'vip' ? precioBase + RECARGO_VIP : precioBase;
  }

  async confirmarCompra(): Promise<void> {
    if (this.metodoPago() === null || !this.funcion || this.butacas.length === 0) return;

    this.procesando.set(true);
    this.errorCompra.set('');
    try {
      await this.ventaService.registrarVentaYEntradas({
        funcionId: this.funcion.id,
        butacas: this.butacas.map((butaca) => ({
          fila: butaca.fila,
          asiento: butaca.numero,
          precio: this.precioButaca(butaca),
        })),
        metodoPago: this.metodoPago()!,
        total: this.total,
      });
      this.compraConfirmada.set(true);
    } catch (error) {
      console.error(error);
      this.errorCompra.set(
        'No se pudo registrar la compra. Revisá tu sesión y las restricciones de Supabase.',
      );
    } finally {
      this.procesando.set(false);
    }
  }
}
