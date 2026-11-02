import { Component, signal } from '@angular/core';
import { Butaca } from '../../models/butaca-model';
import { ButacaService } from '../../services/butaca-service';
import { Sala } from '../../models/sala-model';
import { SalaService } from '../../services/sala-service';

@Component({
  imports: [],
  selector: 'app-seleccionar-butacas-component',
  styleUrl: './seleccionar-butacas-component.css',
  templateUrl: './seleccionar-butacas-component.html',
})
export class SeleccionarButacasComponent {}
