import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Pelicula } from '../../models/pelicula.model';

@Component({
  imports: [],
  selector: 'app-pelicula-component',
  styleUrl: './pelicula.component.css',
  templateUrl: './pelicula.component.html',
})
export class PeliculaComponent {
  @Input() pelicula!: Pelicula;

  @Output() peliculaSeleccionada = new EventEmitter<Pelicula>();

  emitirSeleccion() {
    this.peliculaSeleccionada.emit(this.pelicula);
  }
}
