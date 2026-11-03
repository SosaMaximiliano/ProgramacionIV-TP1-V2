import { Pelicula } from './../../models/pelicula.model';
import { Component, signal } from '@angular/core';
import { PeliculaService } from '../../services/pelicula.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FuncionService } from '../../services/funcion.service';
import { Funcion } from '../../models/funcion.model';

@Component({
  imports: [RouterLink],
  selector: 'app-detalle-pelicula-component',
  styleUrl: './detalle-pelicula.component.css',
  templateUrl: './detalle-pelicula.component.html',
})
export class DetallePeliculaComponent {
  pelicula = signal<Pelicula | undefined>(undefined);
  funciones = signal<Funcion[]>([]);

  constructor(
    private readonly peliculaService: PeliculaService,
    private readonly funcionService: FuncionService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  async cargarDetalle() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.pelicula.set(await this.peliculaService.obtenerPorId(id));
    this.funciones.set(await this.funcionService.obtenerPorIdPelicula(id));
    return;
  }

  seleccionarFuncion(funcion: Funcion) {
    this.router.navigate(['/seleccionar-butacas', funcion.id]);
  }

  ngOnInit(): void {
    this.cargarDetalle();
  }
}
