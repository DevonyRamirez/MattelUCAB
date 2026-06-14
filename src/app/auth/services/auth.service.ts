import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.SUPABASE_URL, environment.SUPABASE_KEY);
  }

  // --- AUTENTICACIÓN MANUAL VIA STORED PROCEDURE ---
  // Llama a la lógica de negocio que vive en la base de datos de Supabase
  async login(username: string, contrasena: string) {
    const { data, error } = await this.supabase
      .rpc('iniciar_sesion', {
        p_usuario: username,
        p_contrasena: contrasena
      });

    if (error) {
      return { success: false, error: error.message, user: null };
    }

    if (data && data.length > 0) {
      // Si la base de datos nos devuelve datos, coinciden las credenciales
      return { success: true, error: null, user: data[0] };
    } else {
      return { success: false, error: 'Usuario o contraseña incorrectos', user: null };
    }
  }

  logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('roleId');
  }
}
