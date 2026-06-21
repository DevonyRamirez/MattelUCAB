import { Routes } from '@angular/router';
import { LoginComponent } from './auth/pages/login/login.component';
import { vistaPrivilegioGuard } from './auth/guards/vista-privilegio.guard';
import { LayoutComponent } from './dashboard/layout/layout.component';
import { DisenosComponent } from './dashboard/pages/disenos/disenos.component';
import { PrivilegiosComponent } from './dashboard/pages/privilegios/privilegios.component';
import { ReportesComponent } from './dashboard/pages/reportes/reportes.component';
import { UsuariosComponent } from './dashboard/pages/usuarios/usuarios.component';

import { InicioComponent } from './dashboard/pages/inicio/inicio.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: LayoutComponent,
    children: [
      {
        path: 'inicio',
        component: InicioComponent
      },
      {
        path: '', 
        redirectTo: 'inicio', 
        pathMatch: 'full' 
      },
      {
        path: 'reportes',
        component: ReportesComponent,
        canActivate: [vistaPrivilegioGuard],
        data: { privilegioVista: 'Reportes' }
      },
      {
        path: 'disenos',
        component: DisenosComponent,
        canActivate: [vistaPrivilegioGuard],
        data: { privilegioVista: ['Dise\u00f1o', 'Dise\u00f1os', 'Disenos'] }
      },
      {
        path: 'usuarios',
        component: UsuariosComponent,
        canActivate: [vistaPrivilegioGuard],
        data: { privilegioVista: 'Usuarios' }
      },
      {
        path: 'privilegios',
        component: PrivilegiosComponent,
        canActivate: [vistaPrivilegioGuard],
        data: { privilegioVista: 'Privilegios' }
      }
    ]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];