enum E_TipoButaca {
  general = 'G',
  accesible = 'A',
  vip = 'V',
}

enum E_SectorButaca {
  izquierdo = 'I',
  central = 'C',
  derecho = 'D',
}

export interface Butaca {
  id: number;
  salaId: number;
  fila: string;
  numero: number;
  tipo: E_TipoButaca;
  sector: E_SectorButaca;
}
