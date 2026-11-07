export interface Resena {
  id: number;
  peliculaId: number;
  usuarioId: string;
  puntuacion: number;
  comentario: string | null;
}

export type DatosResena = Pick<Resena, 'peliculaId' | 'usuarioId' | 'puntuacion' | 'comentario'>;
