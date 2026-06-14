import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function validarConfirmacionContrasena(
  campoContrasena = 'contrasena',
  campoConfirmacion = 'confirmarContrasena'
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const contrasena = control.get(campoContrasena)?.value;
    const confirmacion = control.get(campoConfirmacion)?.value;

    if (!contrasena || !confirmacion || contrasena === confirmacion) {
      return null;
    }

    return { contrasenasDistintas: true };
  };
}
