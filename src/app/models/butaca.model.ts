export type TipoButaca = 'general' | 'accesible' | 'vip';
export type BloqueButaca = 'izquierdo' | 'central' | 'derecho';
export interface Butaca {
  id: number;
  salaId: number;
  fila: string;
  numero: number;
  tipo: TipoButaca;
  bloque: BloqueButaca;
}

export interface FilaButacas {
  letra: string;
  tipo: TipoButaca;
  bloques: Butaca[][];
}
