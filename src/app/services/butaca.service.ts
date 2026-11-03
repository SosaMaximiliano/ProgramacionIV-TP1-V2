import { Service } from '@angular/core';
import { Sala } from '../models/sala.model';
import { Butaca, FilaButacas, BloqueButaca, TipoButaca } from '../models/butaca.model';

@Service()
export class ButacaService {
  obtenerButacasDeSala(sala: Sala): FilaButacas[] {
    const filasButacas: FilaButacas[] = [];
    const filasVip = ['R', 'S', 'T'];

    const bloques: BloqueButaca[] = ['izquierdo', 'central', 'derecho'];
    let idButaca = 1;

    for (let fila = 0; fila < sala.filas; fila++) {
      const letraOriginal = String.fromCharCode(65 + fila);

      // Las filas J y K se reemplazan por una única fila accesible.
      if (letraOriginal === 'K') continue;

      const esAccesible = letraOriginal === 'J';
      const letraFila = esAccesible ? 'J/K' : letraOriginal;
      const esVip = filasVip.includes(letraOriginal);
      const tipoFila: TipoButaca = esAccesible ? 'accesible' : esVip ? 'vip' : 'general';
      const cantidadPorBloque = esAccesible ? [2, 10, 2] : [4, 20, 4];
      const bloquesDeFila: Butaca[][] = [];
      let numero = 1;

      for (let bloque = 0; bloque < bloques.length; bloque++) {
        const butacasDelBloque: Butaca[] = [];

        for (let asiento = 0; asiento < cantidadPorBloque[bloque]; asiento++) {
          butacasDelBloque.push({
            id: idButaca,
            salaId: sala.id,
            fila: letraFila,
            numero,
            tipo: tipoFila,
            bloque: bloques[bloque],
          });

          idButaca++;
          numero++;
        }

        bloquesDeFila.push(butacasDelBloque);
      }

      filasButacas.push({ letra: letraFila, tipo: tipoFila, bloques: bloquesDeFila });
    }

    return filasButacas;
  }
}
