begin;

create or replace function public.save_cities(city_items jsonb)
returns setof public.cities
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_role text;
begin
  actor_role := public.current_user_role();
  if actor_role not in ('owner', 'admin') or not public.current_user_is_approved() then
    raise exception 'Acesso exclusivo de owner ou administrador.' using errcode = '42501';
  end if;
  if jsonb_typeof(city_items) <> 'array' then
    raise exception 'Lista de cidades inválida.' using errcode = '22023';
  end if;

  delete from public.cities where id is not null;
  insert into public.cities (
    id,
    name,
    currency,
    discount,
    tebex_multiplier,
    position,
    updated_by
  )
  select
    coalesce(nullif(item.value ->> 'id', '')::uuid, extensions.gen_random_uuid()),
    trim(item.value ->> 'name'),
    upper(item.value ->> 'currency'),
    coalesce((item.value ->> 'discount')::numeric, 0),
    case
      when nullif(item.value ->> 'tebexMultiplier', '') is null then null
      else (item.value ->> 'tebexMultiplier')::numeric
    end,
    item.ordinality::integer - 1,
    (select auth.uid())
  from jsonb_array_elements(city_items) with ordinality as item(value, ordinality);

  insert into public.audit_logs (actor_id, action, target_type, target_id, details)
  values (
    (select auth.uid()),
    'configuration.saved',
    'cities',
    'global',
    jsonb_build_object('count', jsonb_array_length(city_items))
  );

  return query select * from public.cities order by position;
end;
$$;

revoke all on function public.save_cities(jsonb) from public, anon;
grant execute on function public.save_cities(jsonb) to authenticated, service_role;

commit;
