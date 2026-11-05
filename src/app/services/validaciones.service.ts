import { Service } from '@angular/core';

@Service()
export class ValidacionesService {
  //
  requiereAcompanante(fechaNacimiento: string, edadMinima: number): boolean {
    const [yyyy, mm, dd] = fechaNacimiento.split('-').map(Number);

    const nacimiento = new Date(yyyy, mm - 1, dd);
    const hoy = new Date();

    let edad = hoy.getFullYear() - nacimiento.getFullYear();

    const aunNoCumplioEsteAnio =
      hoy.getMonth() < nacimiento.getMonth() ||
      (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());

    if (aunNoCumplioEsteAnio) {
      edad--;
    }

    return edad < edadMinima;
  }
}
