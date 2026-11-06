import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Pelicula } from '../../models/pelicula.model';
import { PeliculaService } from '../../services/pelicula.service';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-gestion-peliculas',
  templateUrl: './gestion-peliculas.component.html',
  styleUrl: './gestion-peliculas.component.css',
})
export class GestionPeliculasComponent implements OnInit {
  private fb = inject(FormBuilder);

  peliculas = signal<Pelicula[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  error = signal('');
  editandoId = signal<number | null>(null);

  formulario = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    imagen: ['', Validators.required],
    sinopsis: ['', Validators.required],
    duracion: [90, [Validators.required, Validators.min(1)]],
    genero: ['', Validators.required],
    clasificacionEdad: [0, [Validators.required, Validators.min(0)]],
    fechaEstreno: ['', Validators.required],
    estaDisponible: [true],
  });

  constructor(private peliculaService: PeliculaService) {}

  ngOnInit(): void {
    void this.cargarPeliculas();
  }

  private async cargarPeliculas(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');

    try {
      this.peliculas.set(await this.peliculaService.obtenerTodas());
    } catch (error) {
      console.error(error);
      this.error.set('No se pudieron cargar las películas.');
    } finally {
      this.cargando.set(false);
    }
  }

  async guardarPelicula(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.error.set('');

    try {
      const datos = this.formulario.getRawValue();
      const id = this.editandoId();

      if (id === null) {
        await this.peliculaService.crear(datos);
      } else {
        await this.peliculaService.actualizar(id, datos);
      }

      this.cancelarEdicion();
      await this.cargarPeliculas();
    } catch (error) {
      console.error(error);
      this.error.set('No se pudo guardar la película.');
    } finally {
      this.guardando.set(false);
    }
  }

  editarPelicula(pelicula: Pelicula): void {
    this.editandoId.set(pelicula.id);
    this.formulario.setValue({
      nombre: pelicula.nombre,
      imagen: pelicula.imagen,
      sinopsis: pelicula.sinopsis,
      duracion: pelicula.duracion,
      genero: pelicula.genero,
      clasificacionEdad: pelicula.clasificacionEdad,
      fechaEstreno: pelicula.fechaEstreno,
      estaDisponible: pelicula.estaDisponible,
    });
  }

  cancelarEdicion(): void {
    this.editandoId.set(null);
    this.formulario.reset({
      nombre: '',
      imagen: '',
      sinopsis: '',
      duracion: 90,
      genero: '',
      clasificacionEdad: 0,
      fechaEstreno: '',
      estaDisponible: true,
    });
  }
}
