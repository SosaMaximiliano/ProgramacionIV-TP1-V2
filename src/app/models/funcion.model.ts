export type IdiomaFuncion = 'castellano' | 'subtitulado';
export type ProyeccionFuncion = '2D' | '3D' | '4D' | '5D';

export interface Funcion {
  id: number;
  peliculaId: number;
  salaId: number;
  fecha: string;
  hora: string;
  precioEntrada: number;
  idioma: IdiomaFuncion;
  proyeccion: ProyeccionFuncion;
}
