begin;

update public.profiles
set name = 'Lucifer',
    role = 'owner',
    status = 'approved',
    active = true,
    reviewed_at = now(),
    reviewed_by = id
where lower(email) = 'lucifer@gmail.com';

do $$
declare
  owner_id uuid;
begin
  select id into owner_id
  from public.profiles
  where lower(email) = 'lucifer@gmail.com' and role = 'owner';

  if owner_id is null then
    raise exception 'Conta owner não encontrada no Supabase Auth.';
  end if;

  insert into public.audit_logs (actor_id, action, target_type, target_id)
  select owner_id, 'owner.bootstrapped', 'user', owner_id::text
  where not exists (
    select 1 from public.audit_logs
    where action = 'owner.bootstrapped' and target_id = owner_id::text
  );
end;
$$;

commit;
