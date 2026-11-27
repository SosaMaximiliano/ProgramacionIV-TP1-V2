import { Service, signal, inject, OnInit } from '@angular/core';
import { Pelicula } from '../models/pelicula.model';
import { VentaService } from './venta.service';
import { Venta } from '../models/venta.model';
import { Usuario } from '../models/usuario.model';
import { CompraVista } from '../models/venta.model';
import { EntradaService } from './entrada.service';

@Service()
export class UsuarioService {
  peliculasVistas = signal<Pelicula[]>([]);
  usuarioActual = signal<Usuario | null>(null);
  ventaService = inject(VentaService);
  entradaService = inject(EntradaService);

  async ngOnInit(): Promise<void> {
    await this.obtenerPeliculasVistas();
  }

  async obtenerPeliculasVistas(): Promise<{ id: number; nombre: string }[]> {
    const compras = await this.ventaService.obtenerMisCompras();
    const peliculasPorId = new Map<number, { id: number; nombre: string }>();

    for (const compra of compras) {
      for (const entrada of compra.entradas) {
        if (entrada.estadoEntrada !== 'utilizada') continue;

        const pelicula = entrada.funcion?.pelicula;

        if (pelicula) {
          peliculasPorId.set(pelicula.id, {
            id: pelicula.id,
            nombre: pelicula.nombre,
          });
        }
      }
    }

    return [...peliculasPorId.values()];
  }
}
