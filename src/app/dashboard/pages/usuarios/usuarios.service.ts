import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';

export interface PersonaSinUsuario {
  id_persona: number;
  tipo_persona: string;
  rif?: string | null;
  nombre_o_razon_social?: string | null;
  apellido_o_comercial?: string | null;
  [key: string]: string | number | boolean | null | undefined;
}

export interface PersonaConUsuario extends PersonaSinUsuario {
  id_usuario?: number | null;
  id_rol?: number | null;
  nombre_usuario?: string | null;
  nombre_rol?: string | null;
}

export interface CrearUsuarioPayload {
  personaId: number;
  tipoPersona: string;
  nombreUsuario: string;
  contrasenaUsuario: string;
  rolId: number;
}


export interface UsuariosActionResult {
  ok: boolean;
  mensaje: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.SUPABASE_URL, environment.SUPABASE_KEY);
  }

  async consultarPersonasSinUsuario(): Promise<PersonaSinUsuario[]> {
    const { data, error } = await this.supabase.rpc('consultar_personas_sin_usuario');

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as PersonaSinUsuario[];
  }

  async consultarPersonasConUsuario(): Promise<PersonaConUsuario[]> {
    const { data, error } = await this.supabase.rpc('consultar_personas_con_usuario');

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as PersonaConUsuario[];
  }

  async verificarNombreUsuarioExiste(nombreUsuario: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('verificar_nombre_usuario_existe', {
      p_nombre_usuario: nombreUsuario
    });

    if (error) {
      throw new Error(error.message);
    }

    return this.obtenerBooleanoRpc(data, 'verificar_nombre_usuario_existe');
  }

  async crearUsuario(payload: CrearUsuarioPayload): Promise<UsuariosActionResult> {
    const { data, error } = await this.supabase.rpc('insertar_nuevo_usuario', {
      p_id_persona: payload.personaId,
      p_tipo_persona: payload.tipoPersona,
      p_nombre_usuario: payload.nombreUsuario,
      p_contrasena_usuario: payload.contrasenaUsuario,
      p_id_rol: payload.rolId
    });

    if (error) {
      throw new Error(error.message);
    }

    return this.obtenerResultadoAccion(data);
  }


  private obtenerBooleanoRpc(data: unknown, key: string): boolean {
    if (typeof data === 'boolean') {
      return data;
    }

    if (typeof data === 'string') {
      return data.toLowerCase() === 'true';
    }

    if (Array.isArray(data)) {
      return data.some((item) => this.obtenerBooleanoRpc(item, key));
    }

    if (data && typeof data === 'object') {
      const value = (data as Record<string, unknown>)[key];
      return this.obtenerBooleanoRpc(value, key);
    }

    return false;
  }

  private obtenerResultadoAccion(data: unknown): UsuariosActionResult {
    const result = Array.isArray(data) ? data[0] : data;

    if (result && typeof result === 'object' && 'ok' in result && 'mensaje' in result) {
      return result as UsuariosActionResult;
    }

    return {
      ok: false,
      mensaje: 'La base de datos no devolvio una respuesta valida.'
    };
  }
}

