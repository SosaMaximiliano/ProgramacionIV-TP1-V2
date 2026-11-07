import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Funcion, IdiomaFuncion, ProyeccionFuncion } from '../../models/funcion.model';
import { Pelicula } from '../../models/pelicula.model';
import { Sala } from '../../models/sala.model';
import { FuncionService } from '../../services/funcion.service';
import { PeliculaService } from '../../services/pelicula.service';
import { SalaService } from '../../services/sala.service';

const INTERVALO_ENTRE_FUNCIONES_MINUTOS = 30;

@Component({
  imports: [ReactiveFormsModule, CurrencyPipe],
  selector: 'app-gestion-funciones',
  templateUrl: './gestion-funciones.component.html',
  styleUrl: './gestion-funciones.component.css',
})
export class GestionFuncionesComponent implements OnInit {
  private fb = inject(FormBuilder);
  peliculas = signal<Pelicula[]>([]);
  salas = signal<Sala[]>([]);
  funciones = signal<Funcion[]>([]);
  cargando = signal(true);
  guardando = signal(false);
  eliminandoId = signal<number | null>(null);
  editandoId = signal<number | null>(null);
  salaAsignadaId = signal<number | null>(null);
  error = signal('');
  mensaje = signal('');

  formulario = this.fb.nonNullable.group({
    peliculaId: [0, [Validators.required, Validators.min(1)]],
    fecha: ['', Validators.required],
    hora: ['', Validators.required],
    precioEntrada: [0, [Validators.required, Validators.min(0.01)]],
    idioma: ['castellano' as IdiomaFuncion, Validators.required],
    proyeccion: ['2D' as ProyeccionFuncion, Validators.required],
  });

  constructor(
    private funcionService: FuncionService,
    private peliculaService: PeliculaService,
    private salaService: SalaService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargarDatos();
  }

  private async cargarDatos(): Promise<void> {
    this.cargando.set(true);
    this.error.set('');
    try {
      const [peliculas, salas, funciones] = await Promise.all([
        this.peliculaService.obtenerTodas(),
        this.salaService.obtenerTodas(),
        this.funcionService.obtenerTodas(),
      ]);
      this.peliculas.set(peliculas);
      this.salas.set(salas);
      this.funciones.set(funciones);
      this.calcularSala();
    } catch (error) {
      console.error(error);
      this.error.set('No se pudieron cargar películas, salas y funciones desde Supabase.');
    } finally {
      this.cargando.set(false);
    }
  }

  calcularSala(): void {
    const { peliculaId, fecha, hora } = this.formulario.getRawValue();
    const pelicula = this.peliculas().find((item) => item.id === Number(peliculaId));
    if (!pelicula || !fecha || !hora) {
      this.salaAsignadaId.set(null);
      return;
    }

    const inicioNuevo = this.instanteEnMinutos(fecha, hora);
    const finNuevo = inicioNuevo + pelicula.duracion;
    const funcionesOrdenadas = [...this.funciones()].sort((a, b) => a.salaId - b.salaId);

    const salaDisponible = this.salas().find((sala) => {
      return !funcionesOrdenadas.some((funcion) => {
        if (funcion.salaId !== sala.id || funcion.id === this.editandoId()) {
          return false;
        }
        const peliculaExistente = this.peliculas().find((item) => item.id === funcion.peliculaId);
        if (!peliculaExistente) return true;

        const inicioExistente = this.instanteEnMinutos(funcion.fecha, funcion.hora);
        const finExistente = inicioExistente + peliculaExistente.duracion;
        return (
          inicioNuevo < finExistente + INTERVALO_ENTRE_FUNCIONES_MINUTOS &&
          inicioExistente < finNuevo + INTERVALO_ENTRE_FUNCIONES_MINUTOS
        );
      });
    });

    this.salaAsignadaId.set(salaDisponible?.id ?? null);
  }

  private instanteEnMinutos(fecha: string, hora: string): number {
    return Date.parse(`${fecha}T${hora}:00`) / 60_000;
  }

  nombrePelicula(id: number): string {
    return this.peliculas().find((pelicula) => pelicula.id === id)?.nombre ?? 'Película no disponible';
  }

  nombreSala(id: number): string {
    return this.salas().find((sala) => sala.id === id)?.nombre ?? `Sala ${id}`;
  }

  async guardarFuncion(): Promise<void> {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.calcularSala();
    const salaId = this.salaAsignadaId();
    if (salaId === null) {
      this.error.set('No hay una sala disponible para ese horario y duración.');
      return;
    }

    const valores = this.formulario.getRawValue();
    const datos = {
      peliculaId: Number(valores.peliculaId),
      salaId,
      fecha: valores.fecha,
      hora: valores.hora,
      precioEntrada: Number(valores.precioEntrada),
      idioma: valores.idioma,
      proyeccion: valores.proyeccion,
    };

    this.guardando.set(true);
    this.error.set('');
    this.mensaje.set('');
    try {
      if (this.editandoId() === null) {
        await this.funcionService.crear(datos);
        this.mensaje.set('La función se programó correctamente.');
      } else {
        await this.funcionService.actualizar(this.editandoId()!, datos);
        this.mensaje.set('La función se actualizó correctamente.');
      }
      this.cancelarEdicion();
      await this.cargarDatos();
    } catch (error) {
      console.error(error);
      this.error.set('No se pudo guardar la función. Revisá los permisos y las restricciones de Supabase.');
    } finally {
      this.guardando.set(false);
    }
  }

  editarFuncion(funcion: Funcion): void {
    this.error.set('');
    this.mensaje.set('');
    this.editandoId.set(funcion.id);
    this.formulario.setValue({
      peliculaId: funcion.peliculaId,
      fecha: funcion.fecha,
      hora: funcion.hora.slice(0, 5),
      precioEntrada: funcion.precioEntrada,
      idioma: funcion.idioma,
      proyeccion: funcion.proyeccion,
    });
    this.calcularSala();
  }

  cancelarEdicion(): void {
    this.editandoId.set(null);
    this.formulario.reset({
      peliculaId: 0,
      fecha: '',
      hora: '',
      precioEntrada: 0,
      idioma: 'castellano',
      proyeccion: '2D',
    });
    this.salaAsignadaId.set(null);
  }

  async eliminarFuncion(funcion: Funcion): Promise<void> {
    if (!window.confirm(`¿Eliminar la función del ${funcion.fecha} a las ${funcion.hora}?`)) return;
    this.eliminandoId.set(funcion.id);
    this.error.set('');
    this.mensaje.set('');
    try {
      await this.funcionService.eliminar(funcion.id);
      if (this.editandoId() === funcion.id) this.cancelarEdicion();
      this.funciones.update((lista) => lista.filter((item) => item.id !== funcion.id));
      this.mensaje.set('La función se eliminó.');
    } catch (error) {
      console.error(error);
      this.error.set('No se pudo eliminar la función. Puede tener entradas u otros registros asociados.');
    } finally {
      this.eliminandoId.set(null);
    }
  }
}
