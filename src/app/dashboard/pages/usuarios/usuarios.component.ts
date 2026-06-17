import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Necesario para usar [(ngModel)]
import { AuthService } from '../../../auth/services/auth.service'; // Ajusta la ruta si es necesario

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [FormsModule], // Asegúrate de importar esto
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.css'
})
export class UsuariosComponent {
  // Variables que estarán en tu HTML
  username: string = '';
  contrasena: string = '';
  idRol: number = 0;

  constructor(private authService: AuthService) {}

  async registrarUsuario() {
    if (!this.username || !this.contrasena || this.idRol === 0) {
      alert('Por favor, completa todos los campos');
      return;
    }

    const resultado = await this.authService.crearUsuario(this.username, this.contrasena, this.idRol);
    
    if (resultado.success) {
      alert('Usuario creado correctamente');
      // Limpiar campos después de éxito
      this.username = ''; this.contrasena = ''; this.idRol = 0;
    } else {
      alert('Error: ' + resultado.error);
    }
  }
}
