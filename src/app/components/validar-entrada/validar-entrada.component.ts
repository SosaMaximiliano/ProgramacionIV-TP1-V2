import { Venta } from './../../models/venta.model';
import { Entrada } from './../../models/entrada.model';
import { Component, signal } from '@angular/core';
import { EntradaService } from '../../services/entrada.service';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VentaService } from '../../services/venta.service';

@Component({
  imports: [CurrencyPipe, FormsModule],
  selector: 'app-validar-entrada.component',
  styleUrl: './validar-entrada.component.css',
  templateUrl: './validar-entrada.component.html',
})
export class ValidarEntradaComponent {
  inputId = '';
  entrada = signal<Entrada | null>(null);
  cargando = signal(false);
  mensaje = signal('');

  constructor(
    private entradaService: EntradaService,
    private ventaService: VentaService,
  ) {}

  async buscarEntrada() {
    this.cargando.set(true);
    this.mensaje.set('');
    this.entrada.set(null);
    const id = +this.inputId;

    try {
      this.entrada.set(await this.entradaService.obtenerUna(+id));

      if (this.entrada() === null) {
        this.mensaje.set('No se encontró una entrada con ese ID.');
      }
    } catch (error) {
      console.error(error);
      this.mensaje.set('No se pudo obtener la entrada.');
    } finally {
      this.cargando.set(false);
    }
  }

  async validarEntrada() {
    const entrada = this.entrada();
    this.cargando.set(false);

    if (!entrada) {
      this.mensaje.set('La entrada no existe.');
      return;
    }

    if (entrada.estadoEntrada !== 'emitida') {
      this.mensaje.set(`La entrada ya fué ${entrada.estadoEntrada}.`);
      return;
    }

    this.cargando.set(true);
    this.mensaje.set('Validando entrada...');

    try {
      const venta = await this.ventaService.obtenerUna(entrada.ventaId);

      if (!venta) {
        this.mensaje.set('No se encontró una venta asociada.');
        return;
      }
      if (venta.estaCancelada || !venta.estaPagado) {
        this.mensaje.set('La venta fué cancelada o no está paga.');
        this.cargando.set(false);
        return;
      }

      //Actualizo el estado de la entrada en la base
      await this.entradaService.validar(entrada.id);

      //Actualizo el estado de la entrada que se muestra en pantalla.
      this.entrada.update((e) => (e ? { ...e, estadoEntrada: 'utilizada' } : null));
    } catch (error) {
      console.error(error);
      this.mensaje.set('No se pudo validar la entrada.');
    } finally {
      this.cargando.set(false);
    }
  }
}
