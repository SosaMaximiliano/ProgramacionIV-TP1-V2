import { PeliculaService } from './../../services/pelicula.service';
import { PeliculaComponent } from '../pelicula/pelicula.component';
import { Component, signal, computed } from '@angular/core';
import { Pelicula } from './../../models/pelicula.model';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [PeliculaComponent, FormsModule],
  selector: 'app-cartelera-component',
  styleUrl: './cartelera.component.css',
  templateUrl: './cartelera.component.html',
})
export class CarteleraComponent {
  peliculasObtenidas = signal<Pelicula[]>([]);
  busqueda = signal('');
  cargando = signal(true);
  errorCarga = signal('');
  generoSeleccionado = signal('');

  peliculasFiltradas = computed(() => {
    const texto = this.busqueda().trim().toLocaleLowerCase();

    const genero = this.generoSeleccionado().toLocaleLowerCase();

    return this.peliculasObtenidas().filter((pelicula) => {
      const coincideBusqueda =
        pelicula.nombre.toLocaleLowerCase().includes(texto) ||
        pelicula.genero.toLocaleLowerCase().includes(texto);

      const coincideGenero = !genero || pelicula.genero.toLocaleLowerCase() === genero;

      return coincideBusqueda && coincideGenero;
    });
  });

  constructor(
    private readonly peliculaService: PeliculaService,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.peliculasObtenidas.set(await this.peliculaService.obtenerTodas());
    } catch {
      this.errorCarga.set('No pudimos cargar la cartelera.');
    } finally {
      this.cargando.set(false);
    }
  }

  peliculaRecibida(pelicula: Pelicula) {
    this.router.navigate(['/detalle', pelicula.id]);
  }

  generos = computed(() =>
    [...new Set(this.peliculasObtenidas().map((pelicula) => pelicula.genero))]
      .filter(Boolean)
      .sort(),
  );
}
