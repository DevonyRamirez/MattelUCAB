import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';

export interface CatalogoDescripcion {
  [key: string]: string | number | null | undefined;
}

export interface Era extends CatalogoDescripcion {
  id_era: number;
  nombre_era: string;
  descripcion_era: string;
}

export interface Coleccion extends CatalogoDescripcion {
  id_coleccion: number;
  nombre_coleccion: string;
  descripcion_coleccion: string;
}

export interface ColorCatalogo extends CatalogoDescripcion {
  id_color: number;
  nombre_color: string;
  codigo_hex: string;
}

export interface TipoCuerpo extends CatalogoDescripcion {
  id_tipo_cuerpo: number;
  nombre_tipo_cuerpo: string;
  descripcion_tipo_cuerpo: string;
}

export interface MateriaPrima extends CatalogoDescripcion {
  id_materiaprima: number;
  nombre_materiaprima: string;
  descripcion_materiaprima: string;
}

export interface Molde extends CatalogoDescripcion {
  id_molde: number;
  nombre_molde: string;
  descripcion_molde: string;
}

export interface Pieza extends CatalogoDescripcion {
  id_pieza: number;
  nombre_pieza: string;
  descripcion_pieza: string;
}

export interface Profesion extends CatalogoDescripcion {
  id_profesion: number;
  nombre_profesion: string;
  descripcion_profesion: string;
}

export interface Clasificacion extends CatalogoDescripcion {
  id_clasificacion: number;
  nombre_clasificacion: string;
  descripcion_clasificacion: string;
}

export interface Categoria extends CatalogoDescripcion {
  id_categoria: number;
  nombre_categoria: string;
  descripcion_categoria: string;
}

export interface SetRegalo extends CatalogoDescripcion {
  id_setregalo: number;
  nombre_setregalo: string;
}

export interface Caracteristica extends CatalogoDescripcion {
  id_caracteristica: number;
  nombre_caracteristica: string;
  descripcion_caracteristica: string;
}

export interface Prueba extends CatalogoDescripcion {
  id_prueba: number;
  nombre_prueba: string;
  descripcion_prueba: string;
}

export interface Fase extends CatalogoDescripcion {
  id_fase: number;
  nombre_fase: string;
  descripcion_fase: string;
}

export interface Cargo extends CatalogoDescripcion {
  id_cargo: number;
  nombre_cargo: string;
  descripcion_cargo: string;
}

export interface DisenoResumen {
  id_basediseno: number;
  nombre_basediseno: string;
  descripcion_basediseno: string;
  alto_basediseno: number | string;
  ancho_basediseno: number | string;
  profundidad_basediseno: number | string;
  nombre_era?: string | null;
  nombre_coleccion?: string | null;
  nombre_tipo_cuerpo?: string | null;
  color_ojos?: string | null;
  color_tonopiel?: string | null;
  diseno_relacionado?: string | null;
}

export interface ConstruccionItem {
  piezaId: number;
  moldeId: number;
  materiaPrimaId: number;
  cantidadMateriaPrima: number;
}

export interface CaracteristicaItem {
  caracteristicaId: number;
  valor: string;
}

export interface FaseDisenoItem {
  pruebaId: number;
  faseId: number;
  cargoId: number;
  cantidadCargo: number;
}

export interface BaseDisenoPayload {
  idBasediseno: number | null;
  eraId: number;
  baseDisenoId: number | null;
  tipoCuerpoId: number | null;
  coleccionId: number;
  colorOjosId: number | null;
  colorTonoPielId: number | null;
  nombre: string;
  descripcion: string;
  alto: number | null;
  ancho: number | null;
  profundidad: number | null;
}

export interface CaracteristicasPayload {
  profesionIds: number[];
  clasificacionIds: number[];
  categoriaIds: number[];
  setRegaloIds: number[];
  caracteristicas: CaracteristicaItem[];
}

export interface DisenoDetalle extends BaseDisenoPayload {
  construccion: ConstruccionItem[];
  profesionIds: number[];
  clasificacionIds: number[];
  categoriaIds: number[];
  setRegaloIds: number[];
  caracteristicas: CaracteristicaItem[];
  fases: FaseDisenoItem[];
}

export interface DisenosCatalogos {
  eras: Era[];
  colecciones: Coleccion[];
  colores: ColorCatalogo[];
  tiposCuerpo: TipoCuerpo[];
  materiasPrimas: MateriaPrima[];
  moldes: Molde[];
  piezas: Pieza[];
  profesiones: Profesion[];
  clasificaciones: Clasificacion[];
  categorias: Categoria[];
  setsRegalo: SetRegalo[];
  caracteristicas: Caracteristica[];
  pruebas: Prueba[];
  fases: Fase[];
  cargos: Cargo[];
}

export interface DisenosActionResult {
  ok: boolean;
  mensaje: string;
  id_basediseno: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class DisenosService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.SUPABASE_URL, environment.SUPABASE_KEY);
  }

  async consultarCatalogos(): Promise<DisenosCatalogos> {
    const [
      eras,
      colecciones,
      colores,
      tiposCuerpo,
      materiasPrimas,
      moldes,
      piezas,
      profesiones,
      clasificaciones,
      categorias,
      setsRegalo,
      caracteristicas,
      pruebas,
      fases,
      cargos
    ] = await Promise.all([
      this.rpcLista<Era>('consultar_era'),
      this.rpcLista<Coleccion>('consultar_coleccion'),
      this.rpcLista<ColorCatalogo>('consultar_color'),
      this.rpcLista<TipoCuerpo>('consultar_tipo_cuerpo'),
      this.rpcLista<MateriaPrima>('consultar_materia_prima'),
      this.rpcLista<Molde>('consultar_molde'),
      this.rpcLista<Pieza>('consultar_pieza'),
      this.rpcLista<Profesion>('consultar_profesion'),
      this.rpcLista<Clasificacion>('consultar_clasificacion'),
      this.rpcLista<Categoria>('consultar_categoria'),
      this.rpcLista<SetRegalo>('consultar_setregalo'),
      this.rpcLista<Caracteristica>('consultar_caracteristicas_basediseno'),
      this.rpcLista<Prueba>('consultar_prueba'),
      this.rpcLista<Fase>('consultar_fase'),
      this.rpcLista<Cargo>('consultar_cargo')
    ]);

    return {
      eras,
      colecciones,
      colores,
      tiposCuerpo,
      materiasPrimas,
      moldes,
      piezas,
      profesiones,
      clasificaciones,
      categorias,
      setsRegalo,
      caracteristicas,
      pruebas,
      fases,
      cargos
    };
  }

  async consultarDisenos(): Promise<DisenoResumen[]> {
    return this.rpcLista<DisenoResumen>('consultar_base_disenos');
  }

  async consultarDetalleDiseno(idBasediseno: number): Promise<DisenoDetalle> {
    const { data, error } = await this.supabase.rpc('consultar_detalle_basediseno', {
      p_id_basediseno: idBasediseno
    });

    if (error) {
      throw new Error(error.message);
    }

    const result = Array.isArray(data) ? data[0] : data;

    if (!result || typeof result !== 'object') {
      throw new Error('No se encontro el diseno seleccionado.');
    }

    const detalle = result as Record<string, unknown>;

    return {
      idBasediseno: this.numero(detalle['id_basediseno']),
      eraId: this.numero(detalle['fk_era']),
      baseDisenoId: this.numeroONull(detalle['fk_basediseno']),
      tipoCuerpoId: this.numeroONull(detalle['fk_tipo_cuerpo']),
      coleccionId: this.numero(detalle['fk_coleccion']),
      colorOjosId: this.numeroONull(detalle['fk_color_ojos']),
      colorTonoPielId: this.numeroONull(detalle['fk_color_tonopiel']),
      nombre: String(detalle['nombre_basediseno'] ?? ''),
      descripcion: String(detalle['descripcion_basediseno'] ?? ''),
      alto: this.numeroONull(detalle['alto_basediseno']),
      ancho: this.numeroONull(detalle['ancho_basediseno']),
      profundidad: this.numeroONull(detalle['profundidad_basediseno']),
      construccion: this.lista<ConstruccionItem>(detalle['construccion']),
      profesionIds: this.listaNumeros(detalle['profesion_ids']),
      clasificacionIds: this.listaNumeros(detalle['clasificacion_ids']),
      categoriaIds: this.listaNumeros(detalle['categoria_ids']),
      setRegaloIds: this.listaNumeros(detalle['setregalo_ids']),
      caracteristicas: this.lista<CaracteristicaItem>(detalle['caracteristicas']),
      fases: this.lista<FaseDisenoItem>(detalle['fases'])
    };
  }

  async guardarBaseDiseno(payload: BaseDisenoPayload): Promise<DisenosActionResult> {
    const { data, error } = await this.supabase.rpc('guardar_basediseno', {
      p_id_basediseno: payload.idBasediseno,
      p_fk_era: payload.eraId,
      p_fk_basediseno: payload.baseDisenoId,
      p_fk_tipo_cuerpo: payload.tipoCuerpoId,
      p_fk_coleccion: payload.coleccionId,
      p_fk_color_ojos: payload.colorOjosId,
      p_fk_color_tonopiel: payload.colorTonoPielId,
      p_nombre_basediseno: payload.nombre,
      p_descripcion_basediseno: payload.descripcion,
      p_alto_basediseno: payload.alto,
      p_ancho_basediseno: payload.ancho,
      p_profundidad_basediseno: payload.profundidad
    });

    if (error) {
      throw new Error(error.message);
    }

    return this.obtenerResultadoAccion(data);
  }

  async guardarConstruccion(idBasediseno: number, items: ConstruccionItem[]): Promise<DisenosActionResult> {
    const { data, error } = await this.supabase.rpc('guardar_basediseno_construccion', {
      p_id_basediseno: idBasediseno,
      p_items: items
    });

    if (error) {
      throw new Error(error.message);
    }

    return this.obtenerResultadoAccion(data);
  }

  async guardarCaracteristicas(idBasediseno: number, payload: CaracteristicasPayload): Promise<DisenosActionResult> {
    const { data, error } = await this.supabase.rpc('guardar_basediseno_caracteristicas', {
      p_id_basediseno: idBasediseno,
      p_profesion_ids: payload.profesionIds,
      p_clasificacion_ids: payload.clasificacionIds,
      p_categoria_ids: payload.categoriaIds,
      p_setregalo_ids: payload.setRegaloIds,
      p_caracteristicas: payload.caracteristicas
    });

    if (error) {
      throw new Error(error.message);
    }

    return this.obtenerResultadoAccion(data);
  }

  async guardarFases(idBasediseno: number, items: FaseDisenoItem[]): Promise<DisenosActionResult> {
    const { data, error } = await this.supabase.rpc('guardar_fase_diseno', {
      p_id_basediseno: idBasediseno,
      p_items: items
    });

    if (error) {
      throw new Error(error.message);
    }

    return this.obtenerResultadoAccion(data);
  }

  private async rpcLista<T>(nombre: string): Promise<T[]> {
    const { data, error } = await this.supabase.rpc(nombre);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as T[];
  }

  private obtenerResultadoAccion(data: unknown): DisenosActionResult {
    const result = Array.isArray(data) ? data[0] : data;

    if (result && typeof result === 'object' && 'ok' in result && 'mensaje' in result) {
      return result as DisenosActionResult;
    }

    return {
      ok: false,
      mensaje: 'La base de datos no devolvio una respuesta valida.',
      id_basediseno: null
    };
  }

  private lista<T>(value: unknown): T[] {
    return Array.isArray(value) ? (value as T[]) : [];
  }

  private listaNumeros(value: unknown): number[] {
    return this.lista<unknown>(value)
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item > 0);
  }

  private numero(value: unknown): number {
    return Number(value ?? 0);
  }

  private numeroONull(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }
}
