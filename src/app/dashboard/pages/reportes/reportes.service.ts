import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';

export interface CajasMasterRow {
  sku: number;
  cajas_master: number;
}

export interface SkusB2bRow {
  nombre_categoria: string;
  cantidad_skus: number;
}

export interface InventarioTonoRow {
  nombre_color: string;
  porcentaje: number;
}

/**
 * Consume las stored procedures de reporte (SECURITY DEFINER) vía Supabase RPC.
 * No accede a tablas directamente.
 */
@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.SUPABASE_URL, environment.SUPABASE_KEY);
  }

  async cajasMasterSubastas(): Promise<CajasMasterRow[]> {
    const { data, error } = await this.supabase.rpc('reporte_cajas_master_subastas');
    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []) as CajasMasterRow[];
  }

  async skusB2bPorCategoria(fechaInicio: string, fechaFin: string): Promise<SkusB2bRow[]> {
    const { data, error } = await this.supabase.rpc('reporte_skus_b2b_por_categoria', {
      p_fecha_inicio: fechaInicio,
      p_fecha_fin: fechaFin
    });
    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []) as SkusB2bRow[];
  }

  async inventarioTransitoPorTono(): Promise<InventarioTonoRow[]> {
    const { data, error } = await this.supabase.rpc('reporte_inventario_transito_por_tono');
    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []) as InventarioTonoRow[];
  }
}
