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
  saldoCredito = signal(0);
  cargando = signal(true);
  error = signal('');
  mensajeCancelacion = signal('');
  cancelandoId = signal<number | null>(null);

  constructor(private ventaService: VentaService) {}

  ngOnInit(): void {
    void this.cargarCompras();
  }

  private async cargarCompras(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');

    try {
      this.misCompras.set(await this.ventaService.obtenerMisCompras());
      this.saldoCredito.set(await this.ventaService.obtenerSaldoCredito());
    } catch (error) {
      console.error(error);
      this.error.set('No se pudieron cargar tus compras.');
    } finally {
      this.cargando.set(false);
    }
  }

  puedeCancelar(venta: ComprasUsuario[number]): boolean {
    if (!venta.estaPagado || venta.estaCancelada || venta.entradas.length === 0) return false;
    const funcion = venta.entradas[0].funcion;
    if (!funcion || venta.entradas.some((entrada) =>
      entrada.funcion?.fecha !== funcion.fecha || entrada.funcion?.hora !== funcion.hora
    )) return false;

    // Las funciones del sistema se interpretan en horario de Argentina (UTC-3).
    const inicio = new Date(`${funcion.fecha}T${funcion.hora}-03:00`).getTime();
    return Number.isFinite(inicio) && inicio - Date.now() >= 2 * 60 * 60 * 1000;
  }

  async cancelarCompra(venta: ComprasUsuario[number]): Promise<void> {
    if (!this.puedeCancelar(venta) || this.cancelandoId() !== null) return;
    const confirmado = window.confirm(
      `¿Cancelar la compra #${venta.id}? Se acreditarán ${venta.importeAcreditable.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })} para futuras compras y no se reintegrará en dinero.`,
    );
    if (!confirmado) return;

    this.cancelandoId.set(venta.id);
    this.mensajeCancelacion.set('');
    try {
      const resultado = await this.ventaService.cancelarCompra(venta.id);
      this.saldoCredito.set(resultado.saldoCredito);
      this.mensajeCancelacion.set(
        `Compra cancelada. Se acreditaron ${resultado.creditoAcreditado.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}.`,
      );
      this.misCompras.set(await this.ventaService.obtenerMisCompras());
    } catch (error) {
      console.error(error);
      this.mensajeCancelacion.set(
        typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : 'No se pudo cancelar la compra. Intentá nuevamente.',
      );
    } finally {
      this.cancelandoId.set(null);
    }
  }
}
