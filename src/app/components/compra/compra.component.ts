import { Component, signal, computed } from '@angular/core';
import { Butaca } from '../../models/butaca.model';
import { Funcion } from '../../models/funcion.model';
import { CurrencyPipe } from '@angular/common';
import { VentaService } from '../../services/venta.service';
import { FormaPago } from '../../models/venta.model';
import { Router, RouterLink } from '@angular/router';
import { CarritoService } from '../../services/carrito.service';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { Usuario } from '../../models/usuario.model';
import { getSupabaseClient } from '../../services/supabase-client';

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
  usarSaldo = signal(false);
  procesando = signal(false);
  errorCompra = signal('');
  compraConfirmada = signal(false);
  mostrarModalQr = signal(false);
  ventaId = signal<number | null>(null);
  qrImagen = signal('');
  errorQr = signal('');
  errorPdf = signal('');
  descargandoPdf = signal(false);
  codigoCupon = signal('');
  cuponAplicado = signal<{
    id: number;
    codigo: string;
    descripcion: string | null;
    porcentaje: number;
  } | null>(null);
  validandoCupon = signal(false);
  errorCupon = signal('');
  esUsuarioRegistrado = signal(false);

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

  alternarUsoSaldo(): void {
    const usar = !this.usarSaldo();
    this.usarSaldo.set(usar);

    if (usar && this.totalFinalPago() === 0) {
      this.metodoPago.set(null);
    }
  }

  seleccionarMetodoPago(metodo: FormaPago): void {
    if (this.usarSaldo() && this.totalFinalPago() === 0) return;

    this.metodoPago.update((actual) => (actual === metodo ? null : metodo));
  }

  async confirmarCompra(): Promise<void> {
    if (!this.funcion || this.butacas.length === 0) return;

    if (this.totalFinalPago() > 0 && this.metodoPago() === null) {
      this.errorCompra.set('Seleccioná un medio para pagar el importe restante.');
      return;
    }

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
        metodoPago: this.metodoPago(),
        usarSaldo: this.usarSaldo(),
        total: this.totalCompra(),
        productos: this.carritoService.carrito().map((item) => ({
          productoId: item.producto.id,
          cantidad: item.cantidad,
          precioUnitario: item.producto.precio,
        })),
        codigoCupon: this.cuponAplicado()?.codigo ?? null,
      });

      this.ventaId.set(ventaId);
      this.compraConfirmada.set(true);
      this.mostrarModalQr.set(true);

      try {
        const contenidoQr = JSON.stringify({
          ventaId,
          pelicula: this.nombrePelicula,
          funcion: {
            fecha: this.funcion?.fecha,
            hora: this.funcion?.hora,
            sala: this.funcion?.salaId,
          },
          butacas: this.butacas.map((butaca) => ({
            fila: butaca.fila,
            asiento: butaca.numero,
            precio: this.precioButaca(butaca),
          })),
          productos: this.carritoService.carrito().map((item) => ({
            nombre: item.producto.nombre,
            cantidad: item.cantidad,
            precioUnitario: item.producto.precio,
          })),
          total: this.totalFinalPago(),
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

  descargarComprobantePdf(): void {
    if (!this.ventaId() || !this.funcion) return;
    if (!this.qrImagen()) {
      this.errorPdf.set('El comprobante requiere el código QR, que no pudo generarse.');
      return;
    }

    this.descargandoPdf.set(true);
    this.errorPdf.set('');

    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const margenIzquierdo = 18;
      const margenDerecho = 192;
      let y = 20;

      const agregarLinea = (texto: string, opciones?: { negrita?: boolean; margen?: number }) => {
        if (y > 276) {
          pdf.addPage();
          y = 20;
        }
        pdf.setFont('helvetica', opciones?.negrita ? 'bold' : 'normal');
        pdf.setTextColor(38, 42, 50);
        pdf.text(texto, margenIzquierdo + (opciones?.margen ?? 0), y);
        y += 7;
      };

      const agregarImporte = (etiqueta: string, importe: number, destacado = false) => {
        if (y > 276) {
          pdf.addPage();
          y = 20;
        }
        pdf.setFont('helvetica', destacado ? 'bold' : 'normal');
        pdf.setTextColor(38, 42, 50);
        pdf.text(etiqueta, margenIzquierdo, y);
        pdf.text(this.formatearMoneda(importe), margenDerecho, y, { align: 'right' });
        y += 7;
      };

      pdf.setFillColor(20, 24, 32);
      pdf.rect(0, 0, 210, 49, 'F');
      pdf.setTextColor(245, 194, 89);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(18);
      pdf.text('CINÉFILA', margenIzquierdo, 19);
      pdf.setFontSize(11);
      pdf.setTextColor(255, 255, 255);
      pdf.text('Comprobante de compra', margenIzquierdo, 29);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text(`Compra #${this.ventaId()}`, margenIzquierdo, 38);
      pdf.text(`Emitido: ${new Date().toLocaleString('es-AR')}`, margenIzquierdo, 44);

      if (this.qrImagen()) {
        pdf.addImage(this.qrImagen(), 'PNG', 154, 5, 40, 40);
      }

      y = 60;
      pdf.setFontSize(12);
      agregarLinea('FUNCIÓN', { negrita: true });
      agregarLinea(`Película: ${this.nombrePelicula || 'Película'}`);
      agregarLinea(`Fecha y hora: ${this.funcion.fecha} · ${this.funcion.hora}`);
      agregarLinea(
        `Sala: ${this.funcion.salaId} · ${this.funcion.proyeccion} · ${this.funcion.idioma}`,
      );

      y += 3;
      agregarLinea('BUTACAS', { negrita: true });
      for (const butaca of this.butacas) {
        const tipo = butaca.tipo;
        agregarImporte(
          `Fila ${butaca.fila}, asiento ${butaca.numero} (${tipo})`,
          this.precioButaca(butaca),
        );
      }

      const productos = this.carritoService.carrito();
      if (productos.length > 0) {
        y += 3;
        agregarLinea('CANDY BAR', { negrita: true });
        for (const item of productos) {
          agregarImporte(
            `${item.producto.nombre} × ${item.cantidad}`,
            this.subtotalProducto(item.producto.precio, item.cantidad),
          );
        }
      }

      y += 3;
      agregarLinea('RESUMEN', { negrita: true });
      agregarImporte('Subtotal', this.totalCompra());
      if (this.importeDescuentoCupon() > 0) {
        agregarImporte('Descuento cupón', -this.importeDescuentoCupon());
      }
      if (this.descuentoPrimeraCompra() > 0) {
        agregarImporte('Descuento primera compra', -this.importeDescuentoPrimeraCompra());
      }
      if (this.descuentoMayoresDe50() > 0) {
        agregarImporte('Descuento mayores', -this.importeDescuentoMayoresDe50());
      }
      if (this.creditoAplicado() > 0) {
        agregarImporte('Crédito utilizado', -this.creditoAplicado());
        agregarImporte('Total pagado', this.totalFinalPago(), true);
      }

      y += 7;
      pdf.setFontSize(9);
      pdf.setTextColor(110, 114, 122);
      pdf.text(
        'Presentá el código QR junto con este comprobante. El pago registrado es simulado.',
        margenIzquierdo,
        y,
      );
      pdf.save(`cinefila-compra-${this.ventaId()}.pdf`);
    } catch (error) {
      console.error('No se pudo generar el comprobante PDF', error);
      this.errorPdf.set('La compra quedó registrada, pero no se pudo generar el PDF.');
    } finally {
      this.descargandoPdf.set(false);
    }
  }

  private formatearMoneda(importe: number): string {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(importe);
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

  descuentoPrimeraCompra = signal(0);
  descuentoMayoresDe50 = signal(0);
  saldoCredito = signal(0);
  descuentoPorcentaje = computed(
    () =>
      this.descuentoPrimeraCompra() +
      this.descuentoMayoresDe50() +
      (this.cuponAplicado()?.porcentaje ?? 0),
  );

  async ngOnInit(): Promise<void> {
    const supabase = await getSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    this.esUsuarioRegistrado.set(!!user && !user.is_anonymous);

    try {
      const [descuento, credito] = await Promise.all([
        this.ventaService.obtenerDescuentoAplicable(),
        this.ventaService.obtenerSaldoCredito(),
      ]);
      this.descuentoPrimeraCompra.set(descuento.descuentoPrimeraCompra);
      this.descuentoMayoresDe50.set(descuento.descuentoMayores);
      this.saldoCredito.set(credito);
    } catch (error) {
      console.error(error);
      this.errorCompra.set('No pudimos comprobar si corresponde el descuento.');
    }
  }

  importeDescuento(): number {
    return Math.round(((this.totalCompra() * this.descuentoPorcentaje()) / 100) * 100) / 100;
  }

  importeDescuentoPrimeraCompra(): number {
    return Math.round(((this.totalCompra() * this.descuentoPrimeraCompra()) / 100) * 100) / 100;
  }

  importeDescuentoCupon(): number {
    const porcentaje = this.cuponAplicado()?.porcentaje ?? 0;
    return Math.round(((this.totalCompra() * porcentaje) / 100) * 100) / 100;
  }

  importeDescuentoMayoresDe50(): number {
    return (
      this.importeDescuento() - this.importeDescuentoPrimeraCompra() - this.importeDescuentoCupon()
    );
  }

  totalConDescuento(): number {
    return this.totalCompra() - this.importeDescuento();
  }

  creditoAplicado(): number {
    if (!this.usarSaldo()) return 0;
    return Math.min(this.saldoCredito(), this.totalConDescuento());
  }

  totalFinalPago(): number {
    return this.totalConDescuento() - this.creditoAplicado();
  }

  actualizarCodigoCupon(event: Event): void {
    //Recibo el evento como un objeto HTML para poder usar la propiedad value.
    this.codigoCupon.set((event.target as HTMLInputElement).value);
  }

  async aplicarCupon(): Promise<void> {
    this.errorCupon.set('');

    if (!this.codigoCupon().trim()) {
      this.errorCupon.set('Ingresá un código de cupón.');
      return;
    }

    this.validandoCupon.set(true);

    try {
      const cupon = await this.ventaService.validarCupon(this.codigoCupon());
      this.cuponAplicado.set(cupon);
      this.codigoCupon.set(cupon.codigo);
    } catch (error) {
      console.error(error);
      this.cuponAplicado.set(null);
      this.errorCupon.set(error instanceof Error ? error.message : 'No se pudo validar el cupón.');
    } finally {
      this.validandoCupon.set(false);
    }
  }

  quitarCupon(): void {
    this.cuponAplicado.set(null);
    this.codigoCupon.set('');
    this.errorCupon.set('');
  }
}
