import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';

export interface ReporteInventarioCajaMaster {
  sku: number;
  caja_master: number | string;
}

export interface ReporteProductosB2BPorCategoria {
  cantidad: number;
  nombre_categoria: string;
}

export interface ReporteInventarioTransitoPorTonoPiel {
  nombre_color: string;
  porcentaje: number | string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportesService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.SUPABASE_URL, environment.SUPABASE_KEY);
  }

  async consultarInventarioCajaMaster(): Promise<ReporteInventarioCajaMaster> {
    const { data, error } = await this.supabase.rpc('reporte_inventario_caja_master_para_subasta');

    if (error) {
      throw new Error(error.message);
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (!result || typeof result !== 'object') {
      throw new Error('La base de datos no devolvio datos para el reporte.');
    }

    return result as ReporteInventarioCajaMaster;
  }

  async consultarProductosB2BPorCategoria(fechaInicio: string, fechaFin: string): Promise<ReporteProductosB2BPorCategoria[]> {
    const { data, error } = await this.supabase.rpc('reporte_productos_b2b_por_categoria', {
      p_fecha_inicio: fechaInicio,
      p_fecha_fin: fechaFin
    });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as ReporteProductosB2BPorCategoria[];
  }

  async consultarInventarioTransitoPorTonoPiel(): Promise<ReporteInventarioTransitoPorTonoPiel[]> {
    const { data, error } = await this.supabase.rpc('reporte_inventario_transito_por_tono_piel');

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as ReporteInventarioTransitoPorTonoPiel[];
  }
}
