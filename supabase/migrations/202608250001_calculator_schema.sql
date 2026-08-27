begin;

create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) >= 2),
  email text not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  active boolean not null default true,
  requested_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_email_lower_key on public.profiles (lower(email));
create unique index profiles_single_owner_key on public.profiles (role) where role = 'owner';

create table public.cities (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 2),
  currency text not null check (currency in ('BRL', 'USD', 'GBP', 'EUR')),
  discount numeric(8,4) not null default 0 check (discount >= 0 and discount < 100),
  tebex_multiplier numeric(12,6) check (tebex_multiplier is null or tebex_multiplier >= 0),
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create unique index cities_name_lower_key on public.cities (lower(name));
create unique index cities_position_key on public.cities (position);

create table public.exchange_rates (
  pair text primary key check (pair ~ '^[A-Z]{3}-[A-Z]{3}$'),
  base_currency text not null check (base_currency in ('BRL', 'USD', 'GBP', 'EUR')),
  quote_currency text not null check (quote_currency in ('BRL', 'USD', 'GBP', 'EUR')),
  rate numeric(20,10) not null check (rate > 0),
  source text not null check (source in ('AwesomeAPI', 'Manual')),
  fetched_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index audit_logs_actor_id_idx on public.audit_logs (actor_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger cities_touch_updated_at
before update on public.cities
for each row execute function public.touch_updated_at();

create trigger exchange_rates_touch_updated_at
before update on public.exchange_rates
for each row execute function public.touch_updated_at();

create or replace function public.protect_owner_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and old.role = 'owner' then
    raise exception 'A conta owner não pode ser excluída.' using errcode = 'P0001';
  end if;

  if tg_op = 'UPDATE' and old.role = 'owner' and (
    new.role <> 'owner' or
    new.status <> 'approved' or
    not new.active
  ) then
    raise exception 'A conta owner não pode ser alterada.' using errcode = 'P0001';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger protect_owner_profile_trigger
before update or delete on public.profiles
for each row execute function public.protect_owner_profile();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    name,
    email,
    role,
    status,
    active,
    requested_at
  ) values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)),
    lower(new.email),
    'member',
    'pending',
    true,
    now()
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid());
$$;

create or replace function public.current_user_is_approved()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select status = 'approved' and active from public.profiles where id = (select auth.uid())),
    false
  );
$$;

create or replace function public.review_user(target_user_id uuid, review_action text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.profiles;
begin
  if public.current_user_role() <> 'owner' or not public.current_user_is_approved() then
    raise exception 'Acesso exclusivo do owner.' using errcode = '42501';
  end if;
  if review_action not in ('approve', 'reject') then
    raise exception 'Ação de revisão inválida.' using errcode = '22023';
  end if;
  if exists (select 1 from public.profiles where id = target_user_id and role = 'owner') then
    raise exception 'A conta owner não pode ser revisada.' using errcode = 'P0001';
  end if;

  update public.profiles
  set status = case review_action when 'approve' then 'approved' else 'rejected' end,
      reviewed_at = now(),
      reviewed_by = (select auth.uid())
  where id = target_user_id
  returning * into result;

  if result.id is null then
    raise exception 'Usuário não encontrado.' using errcode = 'P0002';
  end if;

  insert into public.audit_logs (actor_id, action, target_type, target_id)
  values ((select auth.uid()), 'user.' || result.status, 'user', result.id::text);
  return result;
end;
$$;

create or replace function public.change_user_role(target_user_id uuid, next_role text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.profiles;
begin
  if public.current_user_role() <> 'owner' or not public.current_user_is_approved() then
    raise exception 'Acesso exclusivo do owner.' using errcode = '42501';
  end if;
  if next_role not in ('admin', 'member') then
    raise exception 'Função inválida.' using errcode = '22023';
  end if;

  update public.profiles
  set role = next_role
  where id = target_user_id
    and role <> 'owner'
    and status = 'approved'
    and active
  returning * into result;

  if result.id is null then
    raise exception 'Usuário indisponível para alteração de função.' using errcode = 'P0002';
  end if;

  insert into public.audit_logs (actor_id, action, target_type, target_id, details)
  values (
    (select auth.uid()),
    'user.role_changed',
    'user',
    result.id::text,
    jsonb_build_object('role', next_role)
  );
  return result;
end;
$$;

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

alter table public.profiles enable row level security;
alter table public.cities enable row level security;
alter table public.exchange_rates enable row level security;
alter table public.audit_logs enable row level security;

revoke all on public.profiles, public.cities, public.exchange_rates, public.audit_logs from anon, authenticated;
grant select on public.profiles, public.cities, public.exchange_rates, public.audit_logs to authenticated;
grant insert, update, delete on public.cities to authenticated;
grant usage, select on sequence public.audit_logs_id_seq to authenticated;

revoke all on function public.review_user(uuid, text) from public, anon;
revoke all on function public.change_user_role(uuid, text) from public, anon;
revoke all on function public.save_cities(jsonb) from public, anon;
grant execute on function public.review_user(uuid, text) to authenticated;
grant execute on function public.change_user_role(uuid, text) to authenticated;
grant execute on function public.save_cities(jsonb) to authenticated;

create policy profiles_select_own_or_owner
on public.profiles for select
to authenticated
using (
  id = (select auth.uid())
  or (
    public.current_user_role() = 'owner'
    and public.current_user_is_approved()
  )
);

create policy cities_select_approved
on public.cities for select
to authenticated
using (public.current_user_is_approved());

create policy cities_insert_configurator
on public.cities for insert
to authenticated
with check (
  public.current_user_is_approved()
  and public.current_user_role() in ('owner', 'admin')
);

create policy cities_update_configurator
on public.cities for update
to authenticated
using (
  public.current_user_is_approved()
  and public.current_user_role() in ('owner', 'admin')
)
with check (
  public.current_user_is_approved()
  and public.current_user_role() in ('owner', 'admin')
);

create policy cities_delete_configurator
on public.cities for delete
to authenticated
using (
  public.current_user_is_approved()
  and public.current_user_role() in ('owner', 'admin')
);

create policy exchange_rates_select_approved
on public.exchange_rates for select
to authenticated
using (public.current_user_is_approved());

create policy audit_logs_select_owner
on public.audit_logs for select
to authenticated
using (
  public.current_user_role() = 'owner'
  and public.current_user_is_approved()
);

commit;
