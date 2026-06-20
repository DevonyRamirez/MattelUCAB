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

  // --- CREACIÓN DE USUARIO VIA STORED PROCEDURE ---
  async crearUsuario(username: string, contrasena: string, idRol: number) {
    const { data, error } = await this.supabase
      .rpc('crear_usuario_con_rol', {
        p_nombre_usuario: username,
        p_contrasena: contrasena,
        p_id_rol: idRol,
        p_fk_persona_natural_empleado: 1 // Usamos el ID del empleado de prueba
      });

    // Verificamos si hubo un error de conexión con Supabase
    if (error) {
      return { success: false, error: error.message };
    }

    // Verificamos la respuesta lógica que aparece en SQL
    if (data && data.length > 0) {
      const resultadoSQL = data[0]; // Extraemos la fila que retorna el procedure
      
      // Si SQL devolvió ok = false, lanzamos ese error al componente
      if (resultadoSQL.ok === false) {
        return { success: false, error: resultadoSQL.mensaje };
      }
    }

    // Solo si todo lo anterior pasó, decimos que fue un éxito
    return { success: true, data: data };
  }

  logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('roleId');
  }
}
