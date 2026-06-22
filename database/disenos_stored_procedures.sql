-- Stored procedures para el modulo de disenos.


-- Sincroniza secuencias SERIAL cuando la data fue cargada con IDs manuales.
create or replace function public.sincronizar_secuencia_serial(
  p_table regclass,
  p_column text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sequence_name text;
  v_max_id bigint;
begin
  v_sequence_name := pg_get_serial_sequence(p_table::text, p_column);

  if v_sequence_name is null then
    return;
  end if;

  execute format('select max(%I) from %s', p_column, p_table)
  into v_max_id;

  perform setval(v_sequence_name, coalesce(v_max_id, 1), v_max_id is not null);
end;
$$;

create or replace function public.consultar_era()
returns table (
  id_era integer,
  nombre_era varchar,
  descripcion_era varchar
)
language sql
security definer
set search_path = public
as $$
  select e.id_era, e.nombre_era, e.descripcion_era
  from public.era e
  order by e.nombre_era;
$$;

create or replace function public.consultar_coleccion()
returns table (
  id_coleccion integer,
  nombre_coleccion varchar,
  descripcion_coleccion varchar
)
language sql
security definer
set search_path = public
as $$
  select c.id_coleccion, c.nombre_coleccion, c.descripcion_coleccion
  from public.coleccion c
  order by c.nombre_coleccion;
$$;

create or replace function public.consultar_color()
returns table (
  id_color integer,
  nombre_color varchar,
  codigo_hex varchar
)
language sql
security definer
set search_path = public
as $$
  select c.id_color, c.nombre_color, c.codigo_hex
  from public.color c
  order by c.nombre_color;
$$;

create or replace function public.consultar_tipo_cuerpo()
returns table (
  id_tipo_cuerpo integer,
  nombre_tipo_cuerpo varchar,
  descripcion_tipo_cuerpo varchar
)
language sql
security definer
set search_path = public
as $$
  select tc.id_tipo_cuerpo, tc.nombre_tipo_cuerpo, tc.descripcion_tipo_cuerpo
  from public.tipo_cuerpo tc
  order by tc.nombre_tipo_cuerpo;
$$;

create or replace function public.consultar_materia_prima()
returns table (
  id_materiaprima integer,
  nombre_materiaprima varchar,
  descripcion_materiaprima varchar
)
language sql
security definer
set search_path = public
as $$
  select m.id_materiaprima, m.nombre_materiaprima, m.descripcion_materiaprima
  from public.materiaprima m
  order by m.nombre_materiaprima;
$$;

create or replace function public.consultar_molde()
returns table (
  id_molde integer,
  nombre_molde varchar,
  descripcion_molde varchar
)
language sql
security definer
set search_path = public
as $$
  select m.id_molde, m.nombre_molde, m.descripcion_molde
  from public.molde m
  order by m.nombre_molde;
$$;

create or replace function public.consultar_pieza()
returns table (
  id_pieza integer,
  nombre_pieza varchar,
  descripcion_pieza varchar
)
language sql
security definer
set search_path = public
as $$
  select p.id_pieza, p.nombre_pieza, p.descripcion_pieza
  from public.pieza p
  order by p.nombre_pieza;
$$;

create or replace function public.consultar_profesion()
returns table (
  id_profesion integer,
  nombre_profesion varchar,
  descripcion_profesion varchar
)
language sql
security definer
set search_path = public
as $$
  select p.id_profesion, p.nombre_profesion, p.descripcion_profesion
  from public.profesion p
  order by p.nombre_profesion;
$$;

create or replace function public.consultar_clasificacion()
returns table (
  id_clasificacion integer,
  nombre_clasificacion varchar,
  descripcion_clasificacion varchar
)
language sql
security definer
set search_path = public
as $$
  select c.id_clasificacion, c.nombre_clasificacion, c.descripcion_clasificacion
  from public.clasificacion c
  order by c.nombre_clasificacion;
$$;

create or replace function public.consultar_categoria()
returns table (
  id_categoria integer,
  nombre_categoria varchar,
  descripcion_categoria varchar
)
language sql
security definer
set search_path = public
as $$
  select c.id_categoria, c.nombre_categoria, c.descripcion_categoria
  from public.categoria c
  order by c.nombre_categoria;
$$;

create or replace function public.consultar_setregalo()
returns table (
  id_setregalo integer,
  nombre_setregalo varchar
)
language sql
security definer
set search_path = public
as $$
  select sr.id_set_regalo, sr.nombre_set_regalo
  from public.set_regalo sr
  order by sr.nombre_set_regalo;
$$;

create or replace function public.consultar_caracteristicas_basediseno()
returns table (
  id_caracteristica integer,
  nombre_caracteristica varchar,
  descripcion_caracteristica varchar
)
language sql
security definer
set search_path = public
as $$
  select c.id_caracteristica, c.nombre_caracteristica, c.descripcion_caracteristica
  from public.caracteristica c
  order by c.nombre_caracteristica;
$$;

create or replace function public.consultar_prueba()
returns table (
  id_prueba integer,
  nombre_prueba varchar,
  descripcion_prueba varchar
)
language sql
security definer
set search_path = public
as $$
  select p.id_prueba, p.nombre_prueba, p.descripcion_prueba
  from public.prueba p
  order by p.nombre_prueba;
$$;

create or replace function public.consultar_fase()
returns table (
  id_fase integer,
  nombre_fase varchar,
  descripcion_fase varchar
)
language sql
security definer
set search_path = public
as $$
  select f.id_fase, f.nombre_fase, f.descripcion_fase
  from public.fase f
  order by f.nombre_fase;
$$;

create or replace function public.consultar_cargo()
returns table (
  id_cargo integer,
  nombre_cargo varchar,
  descripcion_cargo varchar
)
language sql
security definer
set search_path = public
as $$
  select c.id_cargo, c.nombre_cargo, c.descripcion_cargo
  from public.cargo c
  order by c.nombre_cargo;
$$;

create or replace function public.consultar_base_disenos()
returns table (
  id_basediseno integer,
  nombre_basediseno varchar,
  descripcion_basediseno varchar,
  alto_basediseno numeric,
  ancho_basediseno numeric,
  profundidad_basediseno numeric,
  nombre_era varchar,
  nombre_coleccion varchar,
  nombre_tipo_cuerpo varchar,
  color_ojos varchar,
  color_tonopiel varchar,
  diseno_relacionado varchar
)
language sql
security definer
set search_path = public
as $$
  select
    bd.id_basediseno,
    bd.nombre_basediseno,
    bd.descripcion_basediseno,
    bd.alto_basediseno,
    bd.ancho_basediseno,
    bd.profundidad_basediseno,
    e.nombre_era,
    co.nombre_coleccion,
    tc.nombre_tipo_cuerpo,
    ojos.nombre_color as color_ojos,
    piel.nombre_color as color_tonopiel,
    rel.nombre_basediseno as diseno_relacionado
  from public.base_diseno bd
  join public.era e on e.id_era = bd.fk_era
  join public.coleccion co on co.id_coleccion = bd.fk_coleccion
  left join public.tipo_cuerpo tc on tc.id_tipo_cuerpo = bd.fk_tipo_cuerpo
  left join public.color ojos on ojos.id_color = bd.fk_color_ojos
  left join public.color piel on piel.id_color = bd.fk_color_tonopiel
  left join public.base_diseno rel on rel.id_basediseno = bd.fk_basediseno
  order by bd.id_basediseno desc;
$$;

create or replace function public.consultar_detalle_basediseno(
  p_id_basediseno integer
)
returns table (
  id_basediseno integer,
  fk_era integer,
  fk_basediseno integer,
  fk_tipo_cuerpo integer,
  fk_coleccion integer,
  fk_color_ojos integer,
  fk_color_tonopiel integer,
  nombre_basediseno varchar,
  descripcion_basediseno varchar,
  alto_basediseno numeric,
  ancho_basediseno numeric,
  profundidad_basediseno numeric,
  construccion jsonb,
  profesion_ids jsonb,
  clasificacion_ids jsonb,
  categoria_ids jsonb,
  setregalo_ids jsonb,
  caracteristicas jsonb,
  fases jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    bd.id_basediseno,
    bd.fk_era,
    bd.fk_basediseno,
    bd.fk_tipo_cuerpo,
    bd.fk_coleccion,
    bd.fk_color_ojos,
    bd.fk_color_tonopiel,
    bd.nombre_basediseno,
    bd.descripcion_basediseno,
    bd.alto_basediseno,
    bd.ancho_basediseno,
    bd.profundidad_basediseno,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'piezaId', bdc.pfk_pieza,
        'moldeId', bdc.pfk_molde,
        'materiaPrimaId', bdc.pfk_materiaprima,
        'cantidadMateriaPrima', bdc.cantidad_materiaprima
      ) order by bdc.id_basediseno_construccion)
      from public.base_diseno_construccion bdc
      where bdc.pfk_basediseno = bd.id_basediseno
    ), '[]'::jsonb) as construccion,
    coalesce((
      select jsonb_agg(pb.fk_profesion order by pb.fk_profesion)
      from public.profesion_basediseno pb
      where pb.fk_basediseno = bd.id_basediseno
    ), '[]'::jsonb) as profesion_ids,
    coalesce((
      select jsonb_agg(cb.fk_clasificacion order by cb.fk_clasificacion)
      from public.clasificacion_basediseno cb
      where cb.fk_basediseno = bd.id_basediseno
    ), '[]'::jsonb) as clasificacion_ids,
    coalesce((
      select jsonb_agg(cb.fk_categoria order by cb.fk_categoria)
      from public.categoria_basediseno cb
      where cb.fk_basediseno = bd.id_basediseno
    ), '[]'::jsonb) as categoria_ids,
    coalesce((
      select jsonb_agg(bs.fk_set_regalo order by bs.fk_set_regalo)
      from public.basediseno_setregalo bs
      where bs.fk_basediseno = bd.id_basediseno
    ), '[]'::jsonb) as setregalo_ids,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'caracteristicaId', cb.fk_caracteristica,
        'valor', cb.valor_caracterisitica
      ) order by cb.id_caracteristica_basediseno)
      from public.caracteristica_basediseno cb
      where cb.fk_basediseno = bd.id_basediseno
    ), '[]'::jsonb) as caracteristicas,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'pruebaId', fd.fk_prueba,
        'faseId', fd.fk_fase,
        'cargoId', fd.fk_cargo,
        'cantidadCargo', fd.cantidad_cargo
      ) order by fd.id_fase_diseno)
      from public.fase_diseno fd
      where fd.fk_basediseno = bd.id_basediseno
    ), '[]'::jsonb) as fases
  from public.base_diseno bd
  where bd.id_basediseno = p_id_basediseno;
$$;

create or replace function public.guardar_basediseno(
  p_id_basediseno integer,
  p_fk_era integer,
  p_fk_basediseno integer,
  p_fk_tipo_cuerpo integer,
  p_fk_coleccion integer,
  p_fk_color_ojos integer,
  p_fk_color_tonopiel integer,
  p_nombre_basediseno text,
  p_descripcion_basediseno text,
  p_alto_basediseno numeric,
  p_ancho_basediseno numeric,
  p_profundidad_basediseno numeric
)
returns table (
  ok boolean,
  mensaje text,
  id_basediseno integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id_basediseno integer;
  v_constraint_name text;
begin
  if p_fk_era is null or p_fk_era <= 0 then
    return query select false, 'Selecciona una era.', null::integer;
    return;
  end if;

  if p_fk_coleccion is null or p_fk_coleccion <= 0 then
    return query select false, 'Selecciona una coleccion.', null::integer;
    return;
  end if;

  if nullif(trim(p_nombre_basediseno), '') is null then
    return query select false, 'Ingresa el nombre del diseno.', null::integer;
    return;
  end if;

  if nullif(trim(p_descripcion_basediseno), '') is null then
    return query select false, 'Ingresa la descripcion del diseno.', null::integer;
    return;
  end if;

  if coalesce(p_alto_basediseno, 0) <= 0 or coalesce(p_ancho_basediseno, 0) <= 0 or coalesce(p_profundidad_basediseno, 0) <= 0 then
    return query select false, 'Ingresa medidas mayores a cero.', null::integer;
    return;
  end if;

  if p_id_basediseno is null or p_id_basediseno <= 0 then
    perform public.sincronizar_secuencia_serial('public.base_diseno'::regclass, 'id_basediseno');

    insert into public.base_diseno (
      fk_era,
      fk_basediseno,
      fk_tipo_cuerpo,
      fk_coleccion,
      fk_color_ojos,
      fk_color_tonopiel,
      nombre_basediseno,
      descripcion_basediseno,
      alto_basediseno,
      ancho_basediseno,
      profundidad_basediseno
    ) values (
      p_fk_era,
      nullif(p_fk_basediseno, 0),
      nullif(p_fk_tipo_cuerpo, 0),
      p_fk_coleccion,
      nullif(p_fk_color_ojos, 0),
      nullif(p_fk_color_tonopiel, 0),
      trim(p_nombre_basediseno),
      trim(p_descripcion_basediseno),
      p_alto_basediseno,
      p_ancho_basediseno,
      p_profundidad_basediseno
    )
    returning base_diseno.id_basediseno into v_id_basediseno;

    return query select true, 'Base de diseno creada correctamente.', v_id_basediseno;
    return;
  end if;

  update public.base_diseno bd
  set fk_era = p_fk_era,
      fk_basediseno = nullif(p_fk_basediseno, 0),
      fk_tipo_cuerpo = nullif(p_fk_tipo_cuerpo, 0),
      fk_coleccion = p_fk_coleccion,
      fk_color_ojos = nullif(p_fk_color_ojos, 0),
      fk_color_tonopiel = nullif(p_fk_color_tonopiel, 0),
      nombre_basediseno = trim(p_nombre_basediseno),
      descripcion_basediseno = trim(p_descripcion_basediseno),
      alto_basediseno = p_alto_basediseno,
      ancho_basediseno = p_ancho_basediseno,
      profundidad_basediseno = p_profundidad_basediseno
  where bd.id_basediseno = p_id_basediseno;

  if not found then
    return query select false, 'No se encontro la base de diseno a modificar.', p_id_basediseno;
    return;
  end if;

  return query select true, 'Base de diseno actualizada correctamente.', p_id_basediseno;
exception
  when foreign_key_violation then
    return query select false, 'Uno de los catalogos seleccionados no existe.', coalesce(p_id_basediseno, v_id_basediseno);
  when unique_violation then
    get stacked diagnostics v_constraint_name = constraint_name;

    if lower(coalesce(v_constraint_name, '')) = 'pk_base_diseno' then
      return query select false, 'No se pudo crear el diseno: la secuencia de ID_BASEDISENO esta desincronizada. Ejecuta nuevamente este script y reintenta.', coalesce(p_id_basediseno, v_id_basediseno);
    end if;

    return query select false, 'No se pudo guardar la base de diseno por restriccion unica: ' || coalesce(v_constraint_name, sqlerrm), coalesce(p_id_basediseno, v_id_basediseno);
  when others then
    return query select false, 'No se pudo guardar la base de diseno: ' || sqlerrm, coalesce(p_id_basediseno, v_id_basediseno);
end;
$$;

create or replace function public.guardar_basediseno_construccion(
  p_id_basediseno integer,
  p_items jsonb
)
returns table (
  ok boolean,
  mensaje text,
  id_basediseno integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
begin
  if p_id_basediseno is null or p_id_basediseno <= 0 then
    return query select false, 'Primero guarda la fase 1.', p_id_basediseno;
    return;
  end if;

  if not exists (select 1 from public.base_diseno bd where bd.id_basediseno = p_id_basediseno) then
    return query select false, 'La base de diseno no existe.', p_id_basediseno;
    return;
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return query select false, 'Agrega al menos una pieza de construccion.', p_id_basediseno;
    return;
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if coalesce((v_item->>'piezaId')::integer, 0) <= 0
       or coalesce((v_item->>'moldeId')::integer, 0) <= 0
       or coalesce((v_item->>'materiaPrimaId')::integer, 0) <= 0
       or coalesce((v_item->>'cantidadMateriaPrima')::integer, 0) <= 0 then
      return query select false, 'Completa pieza, molde, materia prima y cantidad en construccion.', p_id_basediseno;
      return;
    end if;
  end loop;

  delete from public.base_diseno_construccion bdc
  where bdc.pfk_basediseno = p_id_basediseno;

  perform public.sincronizar_secuencia_serial('public.base_diseno_construccion'::regclass, 'id_basediseno_construccion');

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    insert into public.base_diseno_construccion (
      pfk_pieza,
      pfk_molde,
      pfk_materiaprima,
      pfk_basediseno,
      cantidad_materiaprima
    ) values (
      (v_item->>'piezaId')::integer,
      (v_item->>'moldeId')::integer,
      (v_item->>'materiaPrimaId')::integer,
      p_id_basediseno,
      (v_item->>'cantidadMateriaPrima')::integer
    );
  end loop;

  return query select true, 'Construccion guardada correctamente.', p_id_basediseno;
exception
  when foreign_key_violation then
    return query select false, 'Una pieza, molde o materia prima seleccionada no existe.', p_id_basediseno;
  when others then
    return query select false, 'No se pudo guardar la construccion: ' || sqlerrm, p_id_basediseno;
end;
$$;

create or replace function public.guardar_basediseno_caracteristicas(
  p_id_basediseno integer,
  p_profesion_ids integer[],
  p_clasificacion_ids integer[],
  p_categoria_ids integer[],
  p_setregalo_ids integer[],
  p_caracteristicas jsonb
)
returns table (
  ok boolean,
  mensaje text,
  id_basediseno integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id integer;
  v_item jsonb;
begin
  if p_id_basediseno is null or p_id_basediseno <= 0 then
    return query select false, 'Primero guarda la fase 1.', p_id_basediseno;
    return;
  end if;

  if not exists (select 1 from public.base_diseno bd where bd.id_basediseno = p_id_basediseno) then
    return query select false, 'La base de diseno no existe.', p_id_basediseno;
    return;
  end if;

  delete from public.profesion_basediseno pb where pb.fk_basediseno = p_id_basediseno;
  delete from public.clasificacion_basediseno cb where cb.fk_basediseno = p_id_basediseno;
  delete from public.categoria_basediseno cb where cb.fk_basediseno = p_id_basediseno;
  delete from public.basediseno_setregalo bs where bs.fk_basediseno = p_id_basediseno;
  delete from public.caracteristica_basediseno cb where cb.fk_basediseno = p_id_basediseno;

  perform public.sincronizar_secuencia_serial('public.profesion_basediseno'::regclass, 'id_profesion_basediseno');
  perform public.sincronizar_secuencia_serial('public.clasificacion_basediseno'::regclass, 'id_clasificacion_basediseno');
  perform public.sincronizar_secuencia_serial('public.categoria_basediseno'::regclass, 'id_categoria_basediseno');
  perform public.sincronizar_secuencia_serial('public.basediseno_setregalo'::regclass, 'id_basediseno_setregalo');
  perform public.sincronizar_secuencia_serial('public.caracteristica_basediseno'::regclass, 'id_caracteristica_basediseno');

  foreach v_id in array coalesce(p_profesion_ids, array[]::integer[])
  loop
    if v_id is not null and v_id > 0 then
      insert into public.profesion_basediseno (fk_profesion, fk_basediseno)
      values (v_id, p_id_basediseno);
    end if;
  end loop;

  foreach v_id in array coalesce(p_clasificacion_ids, array[]::integer[])
  loop
    if v_id is not null and v_id > 0 then
      insert into public.clasificacion_basediseno (fk_basediseno, fk_clasificacion)
      values (p_id_basediseno, v_id);
    end if;
  end loop;

  foreach v_id in array coalesce(p_categoria_ids, array[]::integer[])
  loop
    if v_id is not null and v_id > 0 then
      insert into public.categoria_basediseno (fk_basediseno, fk_categoria)
      values (p_id_basediseno, v_id);
    end if;
  end loop;

  foreach v_id in array coalesce(p_setregalo_ids, array[]::integer[])
  loop
    if v_id is not null and v_id > 0 then
      insert into public.basediseno_setregalo (fk_basediseno, fk_set_regalo)
      values (p_id_basediseno, v_id);
    end if;
  end loop;

  if p_caracteristicas is not null and jsonb_typeof(p_caracteristicas) = 'array' then
    for v_item in select value from jsonb_array_elements(p_caracteristicas)
    loop
      if coalesce((v_item->>'caracteristicaId')::integer, 0) > 0 and nullif(trim(v_item->>'valor'), '') is not null then
        insert into public.caracteristica_basediseno (
          fk_basediseno,
          fk_caracteristica,
          valor_caracterisitica
        ) values (
          p_id_basediseno,
          (v_item->>'caracteristicaId')::integer,
          trim(v_item->>'valor')
        );
      end if;
    end loop;
  end if;

  return query select true, 'Caracteristicas guardadas correctamente.', p_id_basediseno;
exception
  when foreign_key_violation then
    return query select false, 'Una caracteristica seleccionada no existe.', p_id_basediseno;
  when others then
    return query select false, 'No se pudieron guardar las caracteristicas: ' || sqlerrm, p_id_basediseno;
end;
$$;

create or replace function public.guardar_fase_diseno(
  p_id_basediseno integer,
  p_items jsonb
)
returns table (
  ok boolean,
  mensaje text,
  id_basediseno integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
begin
  if p_id_basediseno is null or p_id_basediseno <= 0 then
    return query select false, 'Primero guarda la fase 1.', p_id_basediseno;
    return;
  end if;

  if not exists (select 1 from public.base_diseno bd where bd.id_basediseno = p_id_basediseno) then
    return query select false, 'La base de diseno no existe.', p_id_basediseno;
    return;
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    return query select false, 'Agrega al menos una fase de diseno.', p_id_basediseno;
    return;
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if coalesce((v_item->>'pruebaId')::integer, 0) <= 0
       or coalesce((v_item->>'faseId')::integer, 0) <= 0
       or coalesce((v_item->>'cargoId')::integer, 0) <= 0
       or coalesce((v_item->>'cantidadCargo')::integer, 0) <= 0 then
      return query select false, 'Completa prueba, fase, cargo y cantidad.', p_id_basediseno;
      return;
    end if;
  end loop;

  delete from public.fase_diseno fd
  where fd.fk_basediseno = p_id_basediseno;

  perform public.sincronizar_secuencia_serial('public.fase_diseno'::regclass, 'id_fase_diseno');

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    insert into public.fase_diseno (
      fk_prueba,
      fk_basediseno,
      fk_fase,
      fk_cargo,
      cantidad_cargo
    ) values (
      (v_item->>'pruebaId')::integer,
      p_id_basediseno,
      (v_item->>'faseId')::integer,
      (v_item->>'cargoId')::integer,
      (v_item->>'cantidadCargo')::integer
    );
  end loop;

  return query select true, 'Fases de diseno guardadas correctamente.', p_id_basediseno;
exception
  when foreign_key_violation then
    return query select false, 'Una prueba, fase o cargo seleccionado no existe.', p_id_basediseno;
  when others then
    return query select false, 'No se pudieron guardar las fases: ' || sqlerrm, p_id_basediseno;
end;
$$;
