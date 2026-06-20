-- Stored procedures para el modulo de usuarios.
-- La tabla USUARIO guarda una FK distinta segun el tipo de persona.

create or replace function public.verificar_nombre_usuario_existe(
  p_nombre_usuario text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if nullif(trim(p_nombre_usuario), '') is null then
    return false;
  end if;

  return exists (
    select 1
    from public.usuario u
    where lower(trim(u.nombre_usuario)) = lower(trim(p_nombre_usuario))
  );
end;
$$;

drop function if exists public.insertar_nuevo_usuario(integer, text, text, integer);

create or replace function public.insertar_nuevo_usuario(
  p_id_persona integer,
  p_tipo_persona text,
  p_nombre_usuario text,
  p_contrasena_usuario text,
  p_id_rol integer
)
returns table (
  ok boolean,
  mensaje text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tipo_persona text := upper(trim(coalesce(p_tipo_persona, '')));
  v_sequence_name text;
  v_max_usuario_id integer;
  v_constraint_name text;
begin
  if p_id_persona is null or p_id_persona <= 0 then
    return query select false, 'Selecciona una persona valida.';
    return;
  end if;

  if v_tipo_persona = '' then
    return query select false, 'No se pudo identificar el tipo de persona.';
    return;
  end if;

  if nullif(trim(p_nombre_usuario), '') is null then
    return query select false, 'Ingresa un nombre de usuario.';
    return;
  end if;

  if nullif(p_contrasena_usuario, '') is null then
    return query select false, 'Ingresa una contrasena.';
    return;
  end if;

  if p_id_rol is null or p_id_rol <= 0 then
    return query select false, 'Selecciona un rol valido.';
    return;
  end if;

  if public.verificar_nombre_usuario_existe(p_nombre_usuario) then
    return query select false, 'El nombre de usuario ya existe.';
    return;
  end if;
  v_sequence_name := pg_get_serial_sequence('public.usuario', 'id_usuario');
  select max(u.id_usuario) into v_max_usuario_id from public.usuario u;

  if v_sequence_name is not null then
    perform setval(v_sequence_name, coalesce(v_max_usuario_id, 1), v_max_usuario_id is not null);
  end if;

  if v_tipo_persona in ('CLIENTE_B2C', 'B2C', 'CLIENTE') then
    if exists (select 1 from public.usuario u where u.fk_persona_natural_cliente = p_id_persona) then
      return query select false, 'La persona seleccionada ya tiene usuario.';
      return;
    end if;

    insert into public.usuario (
      fk_persona_natural_cliente,
      fk_rol,
      nombre_usuario,
      contrasena_usuario
    ) values (
      p_id_persona,
      p_id_rol,
      trim(p_nombre_usuario),
      p_contrasena_usuario
    );
  elsif v_tipo_persona = 'EMPLEADO' then
    if exists (select 1 from public.usuario u where u.fk_persona_natural_empleado = p_id_persona) then
      return query select false, 'La persona seleccionada ya tiene usuario.';
      return;
    end if;

    insert into public.usuario (
      fk_persona_natural_empleado,
      fk_rol,
      nombre_usuario,
      contrasena_usuario
    ) values (
      p_id_persona,
      p_id_rol,
      trim(p_nombre_usuario),
      p_contrasena_usuario
    );
  elsif v_tipo_persona in ('PERSONA_JURIDICA', 'JURIDICA', 'CLIENTE_B2B', 'B2B') then
    if exists (select 1 from public.usuario u where u.fk_persona_juridica = p_id_persona) then
      return query select false, 'La persona seleccionada ya tiene usuario.';
      return;
    end if;

    insert into public.usuario (
      fk_persona_juridica,
      fk_rol,
      nombre_usuario,
      contrasena_usuario
    ) values (
      p_id_persona,
      p_id_rol,
      trim(p_nombre_usuario),
      p_contrasena_usuario
    );
  else
    return query select false, 'Tipo de persona no soportado: ' || p_tipo_persona;
    return;
  end if;

  return query select true, 'Usuario creado correctamente.';
exception
  when foreign_key_violation then
    return query select false, 'La persona o el rol seleccionado no existe.';
  when unique_violation then
    get stacked diagnostics v_constraint_name = constraint_name;

    if lower(coalesce(v_constraint_name, '')) like '%nombre_usuario%' then
      return query select false, 'El nombre de usuario ya existe.';
    elsif lower(coalesce(v_constraint_name, '')) = 'pk_usuario' then
      return query select false, 'No se pudo crear el usuario: la secuencia de ID_USUARIO esta desincronizada. Ejecuta nuevamente este script y reintenta.';
    else
      return query select false, 'No se pudo crear el usuario por restriccion unica: ' || coalesce(v_constraint_name, sqlerrm);
    end if;
  when check_violation then
    return query select false, 'El usuario debe pertenecer a un solo tipo de persona.';
  when others then
    return query select false, 'No se pudo crear el usuario: ' || sqlerrm;
end;
$$;
create or replace function public.modificar_usuario(
  p_id_usuario integer,
  p_nombre_usuario_actual text,
  p_nombre_usuario text,
  p_contrasena_usuario text,
  p_id_rol integer
)
returns table (
  ok boolean,
  mensaje text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id_usuario integer;
  v_nombre_actual text := trim(coalesce(p_nombre_usuario_actual, ''));
  v_nombre_nuevo text := trim(coalesce(p_nombre_usuario, ''));
  v_constraint_name text;
begin
  if v_nombre_nuevo = '' then
    return query select false, 'Ingresa un nombre de usuario.';
    return;
  end if;

  if p_id_rol is null or p_id_rol <= 0 then
    return query select false, 'Selecciona un rol valido.';
    return;
  end if;

  select u.id_usuario
  into v_id_usuario
  from public.usuario u
  where (p_id_usuario is not null and u.id_usuario = p_id_usuario)
     or (p_id_usuario is null and lower(trim(u.nombre_usuario)) = lower(v_nombre_actual))
  limit 1;

  if v_id_usuario is null then
    return query select false, 'No se encontro el usuario a modificar.';
    return;
  end if;

  if exists (
    select 1
    from public.usuario u
    where lower(trim(u.nombre_usuario)) = lower(v_nombre_nuevo)
      and u.id_usuario <> v_id_usuario
  ) then
    return query select false, 'El nombre de usuario ya existe.';
    return;
  end if;

  update public.usuario u
  set nombre_usuario = v_nombre_nuevo,
      contrasena_usuario = case
        when nullif(p_contrasena_usuario, '') is null then u.contrasena_usuario
        else p_contrasena_usuario
      end,
      fk_rol = p_id_rol
  where u.id_usuario = v_id_usuario;

  return query select true, 'Usuario modificado correctamente.';
exception
  when foreign_key_violation then
    return query select false, 'El rol seleccionado no existe.';
  when unique_violation then
    get stacked diagnostics v_constraint_name = constraint_name;

    if lower(coalesce(v_constraint_name, '')) like '%nombre_usuario%' then
      return query select false, 'El nombre de usuario ya existe.';
    else
      return query select false, 'No se pudo modificar el usuario por restriccion unica: ' || coalesce(v_constraint_name, sqlerrm);
    end if;
  when others then
    return query select false, 'No se pudo modificar el usuario: ' || sqlerrm;
end;
$$;