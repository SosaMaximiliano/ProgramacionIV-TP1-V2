-- Ejecutar en Supabase SQL Editor.
-- La compra base existente (cinco parámetros) sigue registrando entradas y Candy Bar.
-- Este saldo separado evita que el cliente pueda editar el crédito directamente.

create table if not exists public.credito_clientes (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  saldo numeric(12, 2) not null default 0 check (saldo >= 0),
  actualizado_en timestamptz not null default now()
);

alter table public.credito_clientes enable row level security;
revoke all on table public.credito_clientes from anon, authenticated;
grant select on table public.credito_clientes to authenticated;

drop policy if exists "Cada cliente consulta su propio crédito" on public.credito_clientes;
create policy "Cada cliente consulta su propio crédito"
  on public.credito_clientes for select to authenticated
  using (usuario_id = (select auth.uid()));

create or replace function public.obtener_saldo_credito()
returns numeric
language sql
stable
security definer
set search_path to ''
as $function$
  select coalesce((
    select c.saldo
    from public.credito_clientes c
    where c.usuario_id = auth.uid()
  ), 0)::numeric;
$function$;

revoke all on function public.obtener_saldo_credito() from public, anon;
grant execute on function public.obtener_saldo_credito() to authenticated;

-- Wrapper transaccional: conserva el descuento de primera compra de la función actual,
-- luego aplica el saldo y descuenta el crédito en la misma transacción.
create or replace function public.confirmar_compra_con_credito(
  p_funcion_id bigint,
  p_butacas jsonb,
  p_productos jsonb,
  p_forma_pago smallint,
  p_total numeric
)
returns bigint
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_usuario_id uuid := auth.uid();
  v_es_anonimo boolean;
  v_saldo numeric(12, 2) := 0;
  v_venta_id bigint;
  v_precio_final numeric(12, 2);
  v_credito_usado numeric(12, 2) := 0;
begin
  if v_usuario_id is null then
    raise exception 'Se requiere una sesión para comprar.' using errcode = '28000';
  end if;

  v_es_anonimo := coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true);

  if not v_es_anonimo then
    insert into public.credito_clientes (usuario_id, saldo)
    values (v_usuario_id, 0)
    on conflict (usuario_id) do nothing;

    select c.saldo into v_saldo
    from public.credito_clientes c
    where c.usuario_id = v_usuario_id
    for update;
  end if;

  -- Es la sobrecarga usada por la aplicación: 5 argumentos, incluye detalle de productos.
  v_venta_id := public.confirmar_compra(
    p_funcion_id, p_butacas, p_productos, p_forma_pago, p_total
  );

  select v.precio_final into v_precio_final
  from public.ventas v
  where v.id = v_venta_id;

  v_credito_usado := least(v_saldo, v_precio_final);

  if v_credito_usado > 0 then
    update public.credito_clientes
    set saldo = saldo - v_credito_usado,
        actualizado_en = now()
    where usuario_id = v_usuario_id;

    update public.ventas
    set precio_final = precio_final - v_credito_usado
    where id = v_venta_id;
  end if;

  return v_venta_id;
end;
$function$;

revoke all on function public.confirmar_compra_con_credito(bigint, jsonb, jsonb, smallint, numeric) from public, anon;
grant execute on function public.confirmar_compra_con_credito(bigint, jsonb, jsonb, smallint, numeric) to authenticated;

create or replace function public.cancelar_compra(p_venta_id bigint)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_usuario_id uuid := auth.uid();
  v_venta public.ventas%rowtype;
  v_inicio_funcion timestamptz;
  v_cantidad_entradas integer;
  v_funciones integer;
  v_credito numeric(12, 2);
  v_saldo numeric(12, 2);
begin
  if v_usuario_id is null
     or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, true) then
    raise exception 'La cancelación está disponible para clientes registrados.' using errcode = '42501';
  end if;

  select v.* into v_venta
  from public.ventas v
  where v.id = p_venta_id and v.cliente_id = v_usuario_id
  for update;

  if not found then
    raise exception 'No se encontró la compra.' using errcode = 'P0002';
  end if;
  if not v_venta.esta_pagado or v_venta.esta_cancelada then
    raise exception 'La compra no está pagada o ya fue cancelada.' using errcode = '22023';
  end if;

  perform 1 from public.entradas e where e.venta_id = p_venta_id for update;

  select count(*)::integer,
         count(distinct e.funcion_id)::integer,
         min((f.fecha::date + f.hora::time) at time zone 'America/Argentina/Buenos_Aires')
  into v_cantidad_entradas, v_funciones, v_inicio_funcion
  from public.entradas e
  join public.funciones f on f.id = e.funcion_id
  where e.venta_id = p_venta_id;

  if v_cantidad_entradas = 0 then
    raise exception 'La compra no tiene entradas asociadas.' using errcode = '22023';
  end if;
  if v_funciones <> 1 then
    raise exception 'La compra contiene entradas de más de una función.' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.entradas e
    where e.venta_id = p_venta_id and e.estado_entrada <> 'emitida'
  ) then
    raise exception 'La compra contiene entradas que ya no se pueden cancelar.' using errcode = '22023';
  end if;

  if v_inicio_funcion is null or v_inicio_funcion <= now() + interval '2 hours' then
    raise exception 'La compra solo se puede cancelar hasta 2 horas antes de la función.' using errcode = '22023';
  end if;

  insert into public.credito_clientes (usuario_id, saldo)
  values (v_usuario_id, 0)
  on conflict (usuario_id) do nothing;

  select c.saldo into v_saldo
  from public.credito_clientes c
  where c.usuario_id = v_usuario_id
  for update;

  -- El precio final contiene entradas y los productos de Candy Bar de esa venta.
  -- subtotal - descuento conserva el importe completo aunque se haya usado crédito al comprar.
  v_credito := v_venta.subtotal - coalesce(v_venta.descuento_importe, 0);
  update public.credito_clientes
  set saldo = saldo + v_credito,
      actualizado_en = now()
  where usuario_id = v_usuario_id
  returning saldo into v_saldo;

  update public.entradas
  set estado_entrada = 'cancelada'
  where venta_id = p_venta_id;

  update public.ventas
  set esta_cancelada = true
  where id = p_venta_id;

  return jsonb_build_object(
    'credito_acreditado', v_credito,
    'saldo_credito', v_saldo
  );
end;
$function$;

revoke all on function public.cancelar_compra(bigint) from public, anon;
grant execute on function public.cancelar_compra(bigint) to authenticated;

-- Asegura que las butacas canceladas vuelvan a aparecer como disponibles.
create or replace function public.obtener_butacas_ocupadas(p_funcion_id bigint)
returns table (fila text, asiento integer)
language sql
stable
security definer
set search_path to ''
as $function$
  select e.fila, e.asiento::integer
  from public.entradas e
  join public.ventas v on v.id = e.venta_id
  where e.funcion_id = p_funcion_id
    and e.estado_entrada = 'emitida'
    and v.esta_pagado = true
    and v.esta_cancelada = false;
$function$;

revoke all on function public.obtener_butacas_ocupadas(bigint) from public;
grant execute on function public.obtener_butacas_ocupadas(bigint) to anon, authenticated;
