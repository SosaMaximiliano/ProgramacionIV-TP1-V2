import { PeliculaService } from './../../services/pelicula.service';
import { SupabaseService } from './../../services/supabase.service';
import { Component, computed, signal } from '@angular/core';
import { Butaca, FilaButacas } from '../../models/butaca.model';
import { ButacaService } from '../../services/butaca.service';
import { ButacaFuncionService } from '../../services/butaca-funcion.service';
import { Sala } from '../../models/sala.model';
import { SalaService } from '../../services/sala.service';
import { Funcion } from '../../models/funcion.model';
import { FuncionService } from '../../services/funcion.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { ValidacionesService } from '../../services/validaciones.service';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
@Component({
  imports: [CurrencyPipe, ReactiveFormsModule],
  selector: 'app-seleccionar-butacas-component',
  styleUrl: './seleccionar-butacas.component.css',
  templateUrl: './seleccionar-butacas.component.html',
})
export class SeleccionarButacasComponent {
  funcionId!: number;
  funcion?: Funcion;
  filasButacas = signal<FilaButacas[]>([]);
  sala?: Sala;
  butacasOcupadas = signal<number[]>([]);
  butacasSeleccionadas = signal<Butaca[]>([]);
  peliculaId!: number;
  nombrePelicula: string | undefined = '';
  errorCarga = '';
  mostrarResumen = signal(false);
  mostrarModalEdad = signal(false);
  totalSeleccionado = computed(() =>
    this.butacasSeleccionadas().reduce((total, butaca) => total + this.precioButaca(butaca), 0),
  );
  mensajeAcceso = signal('');
  edadMinima = signal(0);
  noCumpleEdadMinima = signal<boolean | null>(null);
  formularioEdad = new FormGroup({
    fechaNacimiento: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private funcionService: FuncionService,
    private salaService: SalaService,
    private butacaService: ButacaService,
    private butacaFuncionService: ButacaFuncionService,
    private peliculaService: PeliculaService,
    private supabaseService: SupabaseService,
    private validacionesService: ValidacionesService,
  ) {}

  precioButaca(butaca: Butaca): number {
    const RECARGO_VIP = 2000;
    const precioBase = this.funcion?.precioEntrada ?? 0;

    return butaca.tipo === 'vip' ? precioBase + RECARGO_VIP : precioBase;
  }

  async ngOnInit(): Promise<void> {
    await this.cargarDatos();
  }
  private async cargarDatos(): Promise<void> {
    //Obtengo el id de la función desde URL
    this.funcionId = Number(this.route.snapshot.paramMap.get('id'));

    try {
      this.funcion = await this.funcionService.obtenerPorId(this.funcionId);
      if (!this.funcion) {
        this.errorCarga = 'No encontramos esa función.';
        return;
      }

      //Obtengo el id de la película.
      this.peliculaId = this.funcion.peliculaId;

      //Obtengo la sala a partir de la función.
      this.sala = await this.salaService.obtenerPorId(this.funcion.salaId);
      if (!this.sala) {
        this.errorCarga = 'No encontramos la sala de esta función.';
        return;
      }

      //Las butacas se generan con la distribución configurada para la sala.
      this.filasButacas.set(this.butacaService.obtenerButacasDeSala(this.sala));

      //Por ahora la ocupación todavía se conserva localmente.
      this.butacasOcupadas.set(
        await this.butacaFuncionService.obtenerButacasOcupadas(this.funcionId, this.filasButacas()),
      );

      const pelicula = await this.peliculaService.obtenerPorId(this.peliculaId);
      this.nombrePelicula = pelicula?.nombre;
      this.edadMinima.set(pelicula?.clasificacionEdad ?? 0);
    } catch {
      this.errorCarga = 'No pudimos cargar la función. Revisá la conexión con Supabase.';
    }
  }

  estaOcupada(butacaId: number): boolean {
    return this.butacasOcupadas().includes(butacaId);
  }

  seleccionarButaca(butaca: Butaca) {
    if (this.estaOcupada(butaca.id)) return;

    this.butacasSeleccionadas.update((s) => {
      const yaSeleccionada = s.some((b) => b.id === butaca.id);
      return yaSeleccionada ? s.filter((b) => b.id !== butaca.id) : [...s, butaca];
    });
  }

  estaSeleccionada(butacaId: number): boolean {
    return this.butacasSeleccionadas().some((b) => b.id === butacaId);
  }

  mostrarOcultarResumen() {
    if (!this.mostrarResumen() && this.butacasSeleccionadas().length === 0) return;
    this.mostrarResumen.set(!this.mostrarResumen());
  }
  haySesionActiva(): boolean {
    const usuario = this.supabaseService.usuarioActual();
    return usuario !== null && !usuario.is_anonymous;
  }

  //Método que guarda los datos que se mandan a compra
  private datosCompra() {
    return {
      funcion: this.funcion,
      nombrePelicula: this.nombrePelicula,
      butacas: this.butacasSeleccionadas(),
      total: this.totalSeleccionado(),
    };
  }

  //Si no ingresó al principio
  irAIngresar() {
    if (!this.funcion || this.butacasSeleccionadas().length === 0) return;

    this.router.navigate(['/login'], {
      state: { datosCompra: this.datosCompra() },
    });
  }

  //Envia los datos a compra
  async continuarCompra(): Promise<void> {
    if (!this.funcion || this.butacasSeleccionadas().length === 0) return;

    if (this.edadMinima() > 0) {
      const usuario = this.supabaseService.usuarioActual();
      const fechaNacimiento = usuario?.user_metadata?.['fecha_nacimiento'];

      if (typeof fechaNacimiento !== 'string') {
        this.mensajeAcceso.set('No encontramos tu fecha de nacimiento para validar la edad.');
        return;
      }

      const requiereAcompanante = await this.validarEdad(fechaNacimiento);

      if (requiereAcompanante === null) {
        this.mensajeAcceso.set('No pudimos validar tu edad. No podemos continuar.');
        return;
      }

      this.noCumpleEdadMinima.set(requiereAcompanante);

      if (requiereAcompanante) {
        this.mostrarModalEdad.set(true);
        return;
      }
    }

    this.navegarACompra();
  }

  private navegarACompra(): void {
    this.router.navigate(['/compra'], {
      state: { datosCompra: this.datosCompra() },
    });
  }
  //Si sigue como invitado
  async seguirComoInvitado(): Promise<void> {
    this.mensajeAcceso.set('');

    if (this.edadMinima() > 0) {
      const control = this.formularioEdad.controls.fechaNacimiento;
      control.markAsTouched();

      if (control.invalid) return;

      const requiereAcompanante = await this.validarEdad(control.value);

      if (requiereAcompanante === null) {
        this.mensajeAcceso.set('No pudimos validar la fecha de nacimiento.');
        return;
      }

      this.noCumpleEdadMinima.set(requiereAcompanante);

      if (requiereAcompanante) {
        this.mostrarModalEdad.set(true);
        return;
      }
    }

    try {
      if (!this.supabaseService.usuarioActual()) {
        await this.supabaseService.iniciarSesionInvitado();
      }

      this.navegarACompra();
    } catch (error) {
      console.error(error);
      this.mensajeAcceso.set('No se pudo iniciar la compra como invitado. Intentá de nuevo.');
    }
  }

  cancelarContinuacionEdad(): void {
    this.mostrarModalEdad.set(false);
    this.noCumpleEdadMinima.set(null);
    this.router.navigateByUrl('/cartelera');
  }

  async confirmarAcompanamiento(): Promise<void> {
    this.mostrarModalEdad.set(false);
    this.noCumpleEdadMinima.set(false);

    try {
      if (!this.supabaseService.usuarioActual()) {
        await this.supabaseService.iniciarSesionInvitado();
      }

      this.navegarACompra();
    } catch (error) {
      console.error(error);
      this.mensajeAcceso.set('No se pudo continuar con la compra.');
    }
  }

  private async validarEdad(fechaNacimiento: string): Promise<boolean | null> {
    const edadMinima = this.edadMinima();

    if (edadMinima === 0) return false;
    if (!fechaNacimiento) return null;

    return this.validacionesService.requiereAcompanante(fechaNacimiento, edadMinima);
  }
}
