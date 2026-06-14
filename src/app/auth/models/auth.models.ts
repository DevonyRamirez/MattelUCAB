export interface Lugar {
  ID_LUGAR: number;
  LUG_ID_LUGAR: number | null;
  NOMBRE_LUGAR: string;
  TIPO_LUGAR: string;
}

export type NaturalPersonType = 'cliente' | 'empleado';

export interface LoginPayload {
  nombre_usuario: string;
  correo: string;
  contrasena: string;
  recordarme: boolean;
}

export interface NaturalRegisterPayload {
  tipo_persona_natural: NaturalPersonType;
  rif_persona_natural: string;
  cedula_persona_natural: string;
  p_nombre_persona_natural: string;
  s_nombre_persona_natural: string | null;
  p_apellido_persona_natural: string;
  s_apellido_persona_natural: string | null;
  fecha_nac_persona_natural: string;
  id_lugar: number;
  direccion_persona_natural: string;
  codigo_area_telefono: string;
  numero_telefono: string;
  nombre_usuario: string;
  contrasena_usuario: string;
}

export interface LegalRegisterPayload {
  razon_social_persona_juridica: string;
  denom_comercial_perjur: string;
  rif_persona_juridica: string;
  id_lugar: number;
  lug_id_lugar: number;
  dir_fisica_persona_juridica: string;
  dir_fiscal_persona_juridica: string;
  codigo_area_telefono: string;
  numero_telefono: string;
  nombre_usuario: string;
  contrasena_usuario: string;
}

export interface PendingRpcResult {
  ok: true;
  pending: true;
  message: string;
}
