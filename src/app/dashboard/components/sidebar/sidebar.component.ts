import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { PrivilegiosService } from '../../pages/privilegios/privilegios.service';

interface NavItem {
  label: string;
  route: string;
  icon: 'home' | 'reportes' | 'disenos' | 'usuarios' | 'privilegios';
  exact?: boolean;
  privilegiosVista?: string[];
  visible: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  navItems: NavItem[] = [
    { label: 'Inicio', route: '/dashboard/inicio', icon: 'home', exact: true, visible: true },
    { label: 'Reportes', route: '/dashboard/reportes', icon: 'reportes', privilegiosVista: ['Reportes'], visible: false },
    { label: 'Dise\u00f1o', route: '/dashboard/disenos', icon: 'disenos', privilegiosVista: ['Dise\u00f1o', 'Dise\u00f1os', 'Disenos'], visible: false },
    { label: 'Usuarios', route: '/dashboard/usuarios', icon: 'usuarios', privilegiosVista: ['Usuarios'], visible: false },
    { label: 'Privilegios', route: '/dashboard/privilegios', icon: 'privilegios', privilegiosVista: ['Privilegios'], visible: false }
  ];

  constructor(
    private authService: AuthService,
    private privilegiosService: PrivilegiosService,
    private router: Router
  ) {}

  async ngOnInit() {
    const roleId = Number(localStorage.getItem('roleId'));

    if (!roleId) {
      return;
    }

    await Promise.all(
      this.navItems
        .filter((item) => item.privilegiosVista?.length)
        .map(async (item) => {
          item.visible = await this.tieneAlgunaVista(roleId, item.privilegiosVista ?? []);
        })
    );
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private async tieneAlgunaVista(roleId: number, privilegiosVista: string[]) {
    for (const privilegioVista of privilegiosVista) {
      if (await this.privilegiosService.validarPrivilegioVista(roleId, privilegioVista)) {
        return true;
      }
    }

    return false;
  }
}
