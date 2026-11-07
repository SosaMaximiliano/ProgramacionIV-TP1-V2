-- Ejecutar en Supabase SQL Editor para habilitar el reporte de administración.
-- Devuelve solo agregados diarios; no expone datos personales ni ventas individuales.

create or replace function public.obtener_reporte_facturacion()
returns table (
  fecha date,
  facturacion numeric,
  entradas_vendidas bigint
)
language plpgsql
stable
security definer
set search_path to ''
as $function$
begin
  if auth.uid() is null
     or not exists (
       select 1
       from public.profiles p
       where p.id = auth.uid()
         and p.rol = 'administrador'
     ) then
    raise exception 'Solo un administrador puede consultar este reporte.' using errcode = '42501';
  end if;

  return query
  with ventas_diarias as (
    select
      (v.fecha_venta at time zone 'America/Argentina/Buenos_Aires')::date as dia,
      sum(v.subtotal - coalesce(v.descuento_importe, 0))::numeric as total_facturado
    from public.ventas v
    where v.esta_pagado = true
      and v.esta_cancelada = false
    group by 1
  ),
  entradas_diarias as (
    select
      (v.fecha_venta at time zone 'America/Argentina/Buenos_Aires')::date as dia,
      count(e.id)::bigint as cantidad_entradas
    from public.ventas v
    join public.entradas e on e.venta_id = v.id
    where v.esta_pagado = true
      and v.esta_cancelada = false
      and e.estado_entrada <> 'cancelada'
    group by 1
  )
  select
    coalesce(v.dia, e.dia),
    coalesce(v.total_facturado, 0),
    coalesce(e.cantidad_entradas, 0)
  from ventas_diarias v
  full outer join entradas_diarias e on e.dia = v.dia
  order by 1 desc;
end;
$function$;

revoke all on function public.obtener_reporte_facturacion() from public, anon;
grant execute on function public.obtener_reporte_facturacion() to authenticated;
