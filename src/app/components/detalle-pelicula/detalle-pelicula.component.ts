import { Pelicula } from './../../models/pelicula.model';
import { Component, computed, signal } from '@angular/core';
import { PeliculaService } from '../../services/pelicula.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FuncionService } from '../../services/funcion.service';
import { Funcion } from '../../models/funcion.model';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { Resena } from '../../models/resena.model';
import { ResenaService } from '../../services/resena.service';
import { SupabaseService } from '../../services/supabase.service';
import { DecimalPipe } from '@angular/common';

@Component({
  imports: [RouterLink, ReactiveFormsModule, DecimalPipe],
  selector: 'app-detalle-pelicula-component',
  styleUrl: './detalle-pelicula.component.css',
  templateUrl: './detalle-pelicula.component.html',
})
export class DetallePeliculaComponent {
  pelicula = signal<Pelicula | undefined>(undefined);
  funciones = signal<Funcion[]>([]);
  resenas = signal<Resena[]>([]);
  resenaPropia = signal<Resena | null>(null);
  cargandoResenas = signal(true);
  guardandoResena = signal(false);
  errorResenas = signal('');
  mensajeResena = signal('');
  promedioResenas = computed(() => {
    const lista = this.resenas();
    return lista.length
      ? lista.reduce((total, resena) => total + resena.puntuacion, 0) / lista.length
      : null;
  });
  formularioResena = new FormGroup({
    puntuacion: new FormControl(5, { nonNullable: true, validators: [Validators.required, Validators.min(1), Validators.max(5)] }),
    comentario: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(300)] }),
  });

  constructor(
    private readonly peliculaService: PeliculaService,
    private readonly funcionService: FuncionService,
    private readonly resenaService: ResenaService,
    public readonly supabaseService: SupabaseService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  async cargarDetalle() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const [resultadoPelicula, resultadoFunciones] = await Promise.allSettled([
      this.peliculaService.obtenerPorId(id),
      this.funcionService.obtenerPorIdPelicula(id),
    ]);

    if (resultadoPelicula.status === 'fulfilled') {
      this.pelicula.set(resultadoPelicula.value);
    } else {
      console.error('No se pudo cargar la película', resultadoPelicula.reason);
    }

    if (resultadoFunciones.status === 'fulfilled') {
      this.funciones.set(resultadoFunciones.value);
    } else {
      console.error('No se pudieron cargar las funciones', resultadoFunciones.reason);
    }

    // La consulta de funciones no debe impedir que se carguen las reseñas.
    await this.cargarResenas(id);
  }

  private async cargarResenas(peliculaId: number): Promise<void> {
    this.cargandoResenas.set(true);
    this.errorResenas.set('');
    try {
      this.resenas.set(await this.resenaService.obtenerPorPelicula(peliculaId));
      const usuario = this.supabaseService.usuarioActual();
      if (usuario && !usuario.is_anonymous) {
        const propia = await this.resenaService.obtenerPropia(peliculaId, usuario.id);
        this.resenaPropia.set(propia);
        if (propia) {
          this.formularioResena.setValue({
            puntuacion: propia.puntuacion,
            comentario: propia.comentario ?? '',
          });
        }
      }
    } catch (error) {
      console.error(error);
      const detalle =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Error desconocido al consultar Supabase.';
      this.errorResenas.set(`No se pudieron cargar las reseñas: ${detalle}`);
    } finally {
      this.cargandoResenas.set(false);
    }
  }

  puedeResenar(): boolean {
    const usuario = this.supabaseService.usuarioActual();
    return !!usuario && !usuario.is_anonymous;
  }

  async guardarResena(): Promise<void> {
    const pelicula = this.pelicula();
    const usuario = this.supabaseService.usuarioActual();
    if (!pelicula || !usuario || usuario.is_anonymous) return;
    if (this.formularioResena.invalid) {
      this.formularioResena.markAllAsTouched();
      return;
    }

    this.guardandoResena.set(true);
    this.errorResenas.set('');
    this.mensajeResena.set('');
    const valores = this.formularioResena.getRawValue();
    const datos = {
      peliculaId: pelicula.id,
      usuarioId: usuario.id,
      puntuacion: valores.puntuacion,
      comentario: valores.comentario.trim() || null,
    };

    try {
      const propia = this.resenaPropia();
      if (propia) {
        await this.resenaService.actualizar(propia.id, datos);
        this.mensajeResena.set('Tu reseña se actualizó.');
      } else {
        await this.resenaService.crear(datos);
        this.mensajeResena.set('Gracias por compartir tu opinión.');
      }
      await this.cargarResenas(pelicula.id);
    } catch (error) {
      console.error(error);
      this.errorResenas.set('No se pudo guardar la reseña. Revisá tu sesión y los permisos de Supabase.');
    } finally {
      this.guardandoResena.set(false);
    }
  }

  seleccionarFuncion(funcion: Funcion) {
    this.router.navigate(['/seleccionar-butacas', funcion.id]);
  }

  ngOnInit(): void {
    this.cargarDetalle();
  }
}
