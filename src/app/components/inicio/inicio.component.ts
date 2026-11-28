import { Component, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PeliculaService } from '../../services/pelicula.service';
import { Pelicula } from '../../models/pelicula.model';
import { PeliculaComponent } from '../pelicula/pelicula.component';

@Component({
  imports: [RouterLink, PeliculaComponent],
  selector: 'app-inicio-component',
  styleUrl: './inicio.component.css',
  templateUrl: './inicio.component.html',
})
export class InicioComponent implements OnInit {
  topPeliculas = signal<Pelicula[]>([]);
  peliculasProximas = signal<Pelicula[]>([]);
  cargandoProximas = signal(true);
  errorProximas = signal('');

  constructor(
    private peliculaService: PeliculaService,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    const topTres = await this.peliculaService.obtenerTresMasVendidas();
    const peliculas = await this.peliculaService.obtenerTodas();
    // const proximas = this.filtrarProximas(peliculas);
    const proximas = peliculas.filter((p) => p.estaDisponible === false && this.esProxima(p));

    this.peliculasProximas.set(
      proximas.sort((a, b) => a.fechaEstreno.localeCompare(b.fechaEstreno)),
    );
    this.topPeliculas.set(topTres);

    this.cargandoProximas.set(false);
  }

  private esProxima(pelicula: Pelicula) {
    const hoy = new Date();
    const fechaHoy = [
      hoy.getFullYear(),
      String(hoy.getMonth() + 1).padStart(2, '0'),
      String(hoy.getDate()).padStart(2, '0'),
    ];

    const fechaEstreno = pelicula.fechaEstreno.replaceAll('-', '');

    return +fechaEstreno > +fechaHoy.join('');
  }

  private filtrarProximas(peliculas: Pelicula[]): Pelicula[] {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const limite = new Date(hoy);
    limite.setDate(limite.getDate() + 28);

    const desde = this.fechaLocalISO(hoy);
    const hasta = this.fechaLocalISO(limite);

    return peliculas
      .filter(
        (pelicula) =>
          !pelicula.estaDisponible &&
          pelicula.fechaEstreno > desde &&
          pelicula.fechaEstreno <= hasta,
      )
      .sort((a, b) => a.fechaEstreno.localeCompare(b.fechaEstreno));
  }

  private fechaLocalISO(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  seleccionarPelicula(pelicula: Pelicula): void {
    this.router.navigate(['/detalle', pelicula.id]);
  }
}
