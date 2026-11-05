import { Component, signal } from '@angular/core';
import { Butaca } from '../../models/butaca.model';
import { Funcion } from '../../models/funcion.model';
import { CurrencyPipe } from '@angular/common';
import { VentaService } from '../../services/venta.service';
import { FormaPago } from '../../models/venta.model';
import { Router, RouterLink } from '@angular/router';
import { CarritoService } from '../../services/carrito.service';

@Component({
  imports: [CurrencyPipe, RouterLink],
  selector: 'app-compra-component',
  styleUrl: './compra.component.css',
  templateUrl: './compra.component.html',
})
export class CompraComponent {
  readonly formasPago = FormaPago;
  funcion?: Funcion;
  nombrePelicula = '';
  butacas: Butaca[] = [];
  total = 0;
  metodoPago = signal<FormaPago | null>(null);
  procesando = signal(false);
  errorCompra = signal('');
  compraConfirmada = signal(false);
  mostrarModalQr = signal(false);
  ventaId = signal<number | null>(null);
  qrImagen = signal('');
  errorQr = signal('');

  constructor(
    private ventaService: VentaService,
    private carritoService: CarritoService,
    private router: Router,
  ) {
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
      const ventaId = await this.ventaService.registrarVentaYEntradas({
        funcionId: this.funcion.id,
        butacas: this.butacas.map((butaca) => ({
          fila: butaca.fila,
          asiento: butaca.numero,
          precio: this.precioButaca(butaca),
        })),
        metodoPago: this.metodoPago()!,
        total: this.totalCompra(),
        productos: this.carritoService.carrito().map((item) => ({
          productoId: item.producto.id,
          cantidad: item.cantidad,
          precioUnitario: item.producto.precio,
        })),
      });

      this.ventaId.set(ventaId);
      this.compraConfirmada.set(true);
      this.mostrarModalQr.set(true);

      try {
        const QRCode = await import('qrcode');
        const contenidoQr = JSON.stringify({
          ventaId,
          pelicula: this.nombrePelicula,
          funcion: {
            fecha: this.funcion?.fecha,
            hora: this.funcion?.hora,
          },
          butacas: this.butacas.map((butaca) => ({
            fila: butaca.fila,
            asiento: butaca.numero,
            precio: this.precioButaca(butaca),
          })),
          total: this.totalConDescuento(),
        });

        const imagen = await QRCode.toDataURL(contenidoQr, {
          width: 220,
          margin: 2,
          errorCorrectionLevel: 'M',
        });

        this.qrImagen.set(imagen);
      } catch (errorQr) {
        console.error('No se pudo generar el QR', errorQr);
        this.errorQr.set('La compra quedó registrada, pero no se pudo generar el código QR.');
      }
    } catch (error) {
      console.error(error);
      this.errorCompra.set(
        'No se pudo registrar la compra. Revisá tu sesión y las restricciones de Supabase.',
      );
    } finally {
      this.procesando.set(false);
    }
  }

  subtotalProducto(precio: number, cantidad: number): number {
    return precio * cantidad;
  }

  subtotalCarrito(): number {
    return this.carritoService
      .carrito()
      .reduce(
        (acumulado, item) => acumulado + this.subtotalProducto(item.producto.precio, item.cantidad),
        0,
      );
  }

  totalCompra(): number {
    return this.total + this.subtotalCarrito();
  }

  cerrarModalQr() {
    this.mostrarModalQr.set(false);
    this.carritoService.limpiar();
    this.router.navigateByUrl('/inicio');
  }

  descuentoPorcentaje = signal(0);

  async ngOnInit(): Promise<void> {
    try {
      this.descuentoPorcentaje.set(await this.ventaService.obtenerDescuentoPrimeraCompra());
    } catch (error) {
      console.error(error);
      this.errorCompra.set('No pudimos comprobar si corresponde el descuento.');
    }
  }

  importeDescuento(): number {
    return Math.round(((this.totalCompra() * this.descuentoPorcentaje()) / 100) * 100) / 100;
  }

  totalConDescuento(): number {
    return this.totalCompra() - this.importeDescuento();
  }
}
