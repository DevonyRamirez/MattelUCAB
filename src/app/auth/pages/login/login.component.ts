import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  mostrarContrasena = false;

  constructor(private authService: AuthService, private router: Router) {}

  toggleContrasena() {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  async onSubmit() {
    const response = await this.authService.login(this.username, this.password);

    if (!response.success) {
      alert('Error: ' + response.error);
    } else {
      alert('¡Bienvenid@ ' + response.user.nombre_usuario + '!');
      console.log('Datos de usuario obtenidos de la DB:', response.user);
      
      // Guardar información relevante de la sesión
      localStorage.setItem('userId', response.user.id_usuario);
      localStorage.setItem('userName', response.user.nombre_usuario);
      localStorage.setItem('roleId', String(response.user.fk_rol ?? response.user.FK_ROL ?? response.user.id_rol));
      
      this.router.navigate(['/dashboard']);
    }
  }
}
