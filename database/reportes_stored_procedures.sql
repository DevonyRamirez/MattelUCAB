-- Stored procedures para el modulo de reportes.

create or replace function public.reporte_inventario_caja_master_para_subasta()
returns table (
  sku bigint,
  caja_master numeric
)
language sql
security definer
set search_path = public
as $$
  select
    count(*) as sku,
    round(count(*)::numeric / 12, 2) as caja_master
  from public.producto p
  join public.historico_inv_producto h
    on p.id_producto = h.fk_producto
  join public.estatus_inventario ei
    on h.fk_estatus_inventario = ei.id_estatus_inventario
  where ei.id_estatus_inventario = 6;
$$;

-- Calcular la cantidad de productos comprados por categoria en un rango de fechas.
create or replace function public.reporte_productos_b2b_por_categoria(
  p_fecha_inicio date,
  p_fecha_fin date
)
returns table (
  cantidad bigint,
  nombre_categoria text
)
language sql
security definer
set search_path = public
as $$
  select
    count(*) as cantidad,
    c.nombre_categoria
  from public.detalle_orden_b2b d
  join public.producto p
    on d.fk_producto = p.id_producto
  join public.orden_compra_b2b o
    on d.fk_orden_compra_b2b = o.id_orden_compra_b2b
  join public.categoria_basediseno cd
    on cd.id_categoria_basediseno = p.fk_categoria_basediseno
  join public.categoria c
    on cd.fk_categoria = c.id_categoria
  where o.fechahora_orden_compra_b2b >= p_fecha_inicio
    and o.fechahora_orden_compra_b2b < (p_fecha_fin + interval '1 day')
  group by c.nombre_categoria
  order by cantidad desc, c.nombre_categoria asc;
$$;

-- Distribucion porcentual del inventario en transito agrupado por tono de piel.
create or replace function public.reporte_inventario_transito_por_tono_piel()
returns table (
  nombre_color text,
  porcentaje numeric
)
language sql
security definer
set search_path = public
as $$
  with total_estatus as (
    select count(*)::numeric as total_filas
    from public.historico_inv_producto
    where fk_estatus_inventario = 3
  )
  select
    c.nombre_color,
    round((count(*)::numeric / nullif(t.total_filas, 0)) * 100, 2) as porcentaje
  from public.historico_inv_producto h
  join public.producto p
    on h.fk_producto = p.id_producto
  join public.estatus_inventario ei
    on h.fk_estatus_inventario = ei.id_estatus_inventario
  join public.base_diseno bd
    on p.fk_basediseno = bd.id_basediseno
  join public.color c
    on bd.fk_color_tonopiel = c.id_color
  cross join total_estatus t
  where ei.id_estatus_inventario = 3
  group by c.nombre_color, t.total_filas
  order by porcentaje desc, c.nombre_color asc;
$$;
