import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PrivilegiosService } from '../../dashboard/pages/privilegios/privilegios.service';

export const vistaPrivilegioGuard: CanActivateFn = async (route) => {
  const router = inject(Router);
  const privilegiosService = inject(PrivilegiosService);
  const roleId = Number(localStorage.getItem('roleId'));
  const descripcionVista = route.data['privilegioVista'];
  const descripcionesVista = Array.isArray(descripcionVista)
    ? descripcionVista
    : [String(descripcionVista ?? '')];

  if (!roleId || descripcionesVista.length === 0 || !descripcionesVista[0]) {
    return router.createUrlTree(['/login']);
  }

  let tieneAcceso = false;

  for (const descripcion of descripcionesVista) {
    tieneAcceso = await privilegiosService.validarPrivilegioVista(roleId, descripcion);

    if (tieneAcceso) {
      break;
    }
  }

  if (!tieneAcceso) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
