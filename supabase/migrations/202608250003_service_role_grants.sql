begin;

grant usage on schema public to service_role;
grant all on table public.profiles to service_role;
grant all on table public.cities to service_role;
grant all on table public.exchange_rates to service_role;
grant all on table public.audit_logs to service_role;
grant usage, select on sequence public.audit_logs_id_seq to service_role;

grant execute on function public.review_user(uuid, text) to service_role;
grant execute on function public.change_user_role(uuid, text) to service_role;
grant execute on function public.save_cities(jsonb) to service_role;

commit;
