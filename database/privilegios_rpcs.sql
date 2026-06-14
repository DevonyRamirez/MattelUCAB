create or replace function public.consultar_privilegios_por_rol()
returns table (
  id_rol int,
  nombre_rol varchar,
  descripcion_rol varchar,
  privilegios_bd text,
  privilegios_vista text
)
language sql
security definer
as $$
  select
    r.id_rol,
    r.nombre_rol,
    r.descripcion_rol,
    (
      select string_agg(distinct p.descripcion_privilegio, ', ' order by p.descripcion_privilegio)
      from public.privilegio p
      where p.tipo_privilegio in ('Insert', 'Update', 'Delete', 'Select')
        and p.id_privilegio in (
          select rp.fk_privilegio
          from public.rol_privilegio rp
          where rp.fk_rol = r.id_rol
        )
    ) as privilegios_bd,
    (
      select string_agg(distinct p.descripcion_privilegio, ', ' order by p.descripcion_privilegio)
      from public.privilegio p
      where p.tipo_privilegio = 'Vista'
        and p.id_privilegio in (
          select rp.fk_privilegio
          from public.rol_privilegio rp
          where rp.fk_rol = r.id_rol
        )
    ) as privilegios_vista
  from public.rol r
  order by r.nombre_rol;
$$;

create or replace function public.validar_privilegio_vista(
  p_id_rol int,
  p_descripcion_vista text
)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1
    from public.rol_privilegio rp
    where rp.fk_rol = p_id_rol
      and rp.fk_privilegio in (
        select p.id_privilegio
        from public.privilegio p
        where p.tipo_privilegio = 'Vista'
          and p.descripcion_privilegio = p_descripcion_vista
      )
  );
$$;

create or replace function public.consultar_catalogo_privilegios()
returns table (
  id_privilegio int,
  descripcion_privilegio varchar,
  tipo_privilegio varchar
)
language sql
security definer
as $$
  select
    p.id_privilegio,
    p.descripcion_privilegio,
    p.tipo_privilegio
  from public.privilegio p
  order by p.tipo_privilegio, p.descripcion_privilegio;
$$;

create or replace function public.consultar_privilegios_ids_por_rol(
  p_id_rol int
)
returns table (
  id_privilegio int
)
language sql
security definer
as $$
  select rp.fk_privilegio
  from public.rol_privilegio rp
  where rp.fk_rol = p_id_rol
  order by rp.fk_privilegio;
$$;

create or replace function public.asignar_privilegios_a_rol(
  p_id_rol int,
  p_privilegios int[]
)
returns table (
  ok boolean,
  insertados int,
  mensaje text
)
language plpgsql
security definer
as $$
declare
  v_insertados int;
  v_privilegios int[] := coalesce(p_privilegios, array[]::int[]);
begin
  if not exists (select 1 from public.rol where id_rol = p_id_rol) then
    raise exception 'El rol % no existe.', p_id_rol;
  end if;

  if cardinality(v_privilegios) = 0 then
    return query select false, 0, 'No se recibieron privilegios para asignar.'::text;
    return;
  end if;

  if exists (
    select 1
    from unnest(v_privilegios) as seleccionado(id_privilegio)
    where not exists (
      select 1
      from public.privilegio p
      where p.id_privilegio = seleccionado.id_privilegio
    )
  ) then
    raise exception 'Uno o mas privilegios no existen.';
  end if;

  if exists (
    select 1
    from public.rol_privilegio rp
    where rp.fk_rol = p_id_rol
      and rp.fk_privilegio = any(v_privilegios)
  ) then
    raise exception 'Uno o mas privilegios ya estan asignados a este rol.';
  end if;

  lock table public.rol_privilegio in exclusive mode;

  insert into public.rol_privilegio (id_rol_privilegio, fk_privilegio, fk_rol)
  select
    (select coalesce(max(id_rol_privilegio), 0) from public.rol_privilegio)
      + row_number() over (order by seleccionado.id_privilegio),
    seleccionado.id_privilegio,
    p_id_rol
  from (
    select distinct id_privilegio
    from unnest(v_privilegios) as privilegio(id_privilegio)
  ) as seleccionado;

  perform setval(
    pg_get_serial_sequence('public.rol_privilegio', 'id_rol_privilegio'),
    (select max(id_rol_privilegio) from public.rol_privilegio),
    true
  );

  get diagnostics v_insertados = row_count;

  return query select true, v_insertados, ('Se asignaron ' || v_insertados || ' privilegio(s).')::text;
end;
$$;

create or replace function public.modificar_privilegios_de_rol(
  p_id_rol int,
  p_agregar int[],
  p_eliminar int[]
)
returns table (
  ok boolean,
  insertados int,
  eliminados int,
  mensaje text
)
language plpgsql
security definer
as $$
declare
  v_insertados int := 0;
  v_eliminados int := 0;
  v_agregar int[] := coalesce(p_agregar, array[]::int[]);
  v_eliminar int[] := coalesce(p_eliminar, array[]::int[]);
begin
  if not exists (select 1 from public.rol where id_rol = p_id_rol) then
    raise exception 'El rol % no existe.', p_id_rol;
  end if;

  if exists (
    select 1
    from unnest(v_agregar || v_eliminar) as seleccionado(id_privilegio)
    where not exists (
      select 1
      from public.privilegio p
      where p.id_privilegio = seleccionado.id_privilegio
    )
  ) then
    raise exception 'Uno o mas privilegios no existen.';
  end if;

  if exists (
    select 1
    from public.rol_privilegio rp
    where rp.fk_rol = p_id_rol
      and rp.fk_privilegio = any(v_agregar)
  ) then
    raise exception 'Uno o mas privilegios ya estan asignados a este rol.';
  end if;

  lock table public.rol_privilegio in exclusive mode;

  if cardinality(v_eliminar) > 0 then
    delete from public.rol_privilegio rp
    where rp.fk_rol = p_id_rol
      and rp.fk_privilegio = any(v_eliminar);

    get diagnostics v_eliminados = row_count;
  end if;

  if cardinality(v_agregar) > 0 then
    insert into public.rol_privilegio (id_rol_privilegio, fk_privilegio, fk_rol)
    select
      (select coalesce(max(id_rol_privilegio), 0) from public.rol_privilegio)
        + row_number() over (order by seleccionado.id_privilegio),
      seleccionado.id_privilegio,
      p_id_rol
    from (
      select distinct id_privilegio
      from unnest(v_agregar) as privilegio(id_privilegio)
    ) as seleccionado;

    get diagnostics v_insertados = row_count;

    perform setval(
      pg_get_serial_sequence('public.rol_privilegio', 'id_rol_privilegio'),
      (select max(id_rol_privilegio) from public.rol_privilegio),
      true
    );
  end if;

  return query select
    true,
    v_insertados,
    v_eliminados,
    ('Se agregaron ' || v_insertados || ' y se eliminaron ' || v_eliminados || ' privilegio(s).')::text;
end;
$$;

-- Tu RPC public.iniciar_sesion ya devuelve fk_rol, asi que no hace falta
-- reemplazarla para que el frontend pueda validar privilegios por rol.

grant execute on function public.consultar_privilegios_por_rol() to anon, authenticated;
grant execute on function public.validar_privilegio_vista(int, text) to anon, authenticated;
grant execute on function public.consultar_catalogo_privilegios() to anon, authenticated;
grant execute on function public.consultar_privilegios_ids_por_rol(int) to anon, authenticated;
grant execute on function public.asignar_privilegios_a_rol(int, int[]) to anon, authenticated;
grant execute on function public.modificar_privilegios_de_rol(int, int[], int[]) to anon, authenticated;

notify pgrst, 'reload schema';
