import { Component, OnInit, computed, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ReporteService, FacturacionDiaria } from '../../services/reporte.service';

@Component({
  imports: [CurrencyPipe, DecimalPipe],
  selector: 'app-reporte-facturacion',
  templateUrl: './reporte-facturacion.component.html',
  styleUrl: './reporte-facturacion.component.css',
})
export class ReporteFacturacionComponent implements OnInit {
  filas = signal<FacturacionDiaria[]>([]);
  cargando = signal(true);
  error = signal('');
  facturacionTotal = computed(() =>
    this.filas().reduce((total, fila) => total + fila.facturacion, 0),
  );
  entradasTotal = computed(() =>
    this.filas().reduce((total, fila) => total + fila.entradasVendidas, 0),
  );

  constructor(private reporteService: ReporteService) {}

  ngOnInit(): void {
    void this.cargarReporte();
  }

  private async cargarReporte(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    try {
      this.filas.set(await this.reporteService.obtenerFacturacionDiaria());
    } catch (error) {
      console.error('No se pudo cargar el reporte de facturación', error);
      this.error.set(
        'No se pudo cargar el reporte. Verificá los permisos y la función SQL de reportes en Supabase.',
      );
    } finally {
      this.cargando.set(false);
    }
  }

  fechaLegible(fecha: string): string {
    return fecha.split('-').reverse().join('/');
  }
}
