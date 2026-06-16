import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';

export interface RolPrivilegios {
  id_rol: number;
  nombre_rol: string;
  descripcion_rol: string | null;
  privilegios_bd: string[] | string | null;
  privilegios_vista: string[] | string | null;
}

export interface Privilegio {
  id_privilegio: number;
  descripcion_privilegio: string;
  tipo_privilegio: string;
}

export interface AsignarPrivilegiosResult {
  ok: boolean;
  insertados: number;
  eliminados?: number;
  mensaje: string;
}

export interface CrearRolResult {
  ok: boolean;
  id_rol?: number;
  mensaje: string;
}

@Injectable({
  providedIn: 'root'
})
export class PrivilegiosService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.SUPABASE_URL, environment.SUPABASE_KEY);
  }

  async consultarPrivilegiosPorRol(): Promise<RolPrivilegios[]> {
    const { data, error } = await this.supabase.rpc('consultar_privilegios_por_rol');

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as RolPrivilegios[];
  }

  async validarPrivilegioVista(roleId: number, descripcionVista: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('validar_privilegio_vista', {
      p_id_rol: roleId,
      p_descripcion_vista: descripcionVista
    });

    if (error) {
      return false;
    }

    return Boolean(data);
  }

  async consultarCatalogoPrivilegios(): Promise<Privilegio[]> {
    const { data, error } = await this.supabase.rpc('consultar_catalogo_privilegios');

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as Privilegio[];
  }

  async crearRol(nombreRol: string, descripcionRol: string | null): Promise<CrearRolResult> {
    const { data, error } = await this.supabase.rpc('crear_rol', {
      p_nombre_rol: nombreRol,
      p_descripcion_rol: descripcionRol
    });

    if (error) {
      throw new Error(error.message);
    }

    const result = Array.isArray(data) ? data[0] : data;
    return result as CrearRolResult;
  }

  async consultarPrivilegiosIdsPorRol(roleId: number): Promise<number[]> {
    const { data, error } = await this.supabase.rpc('consultar_privilegios_ids_por_rol', {
      p_id_rol: roleId
    });

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as Array<{ id_privilegio: number } | number>).map((item) =>
      typeof item === 'number' ? item : item.id_privilegio
    );
  }

  async asignarPrivilegiosARol(roleId: number, privilegeIds: number[]): Promise<AsignarPrivilegiosResult> {
    const { data, error } = await this.supabase.rpc('asignar_privilegios_a_rol', {
      p_id_rol: roleId,
      p_privilegios: privilegeIds
    });

    if (error) {
      throw new Error(error.message);
    }

    const result = Array.isArray(data) ? data[0] : data;
    return result as AsignarPrivilegiosResult;
  }

  async modificarPrivilegiosDeRol(
    roleId: number,
    agregarIds: number[],
    eliminarIds: number[]
  ): Promise<AsignarPrivilegiosResult> {
    const { data, error } = await this.supabase.rpc('modificar_privilegios_de_rol', {
      p_id_rol: roleId,
      p_agregar: agregarIds,
      p_eliminar: eliminarIds
    });

    if (error) {
      throw new Error(error.message);
    }

    const result = Array.isArray(data) ? data[0] : data;
    return result as AsignarPrivilegiosResult;
  }
}
