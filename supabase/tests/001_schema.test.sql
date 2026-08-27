begin;
select plan(12);

select has_table('public', 'profiles');
select has_table('public', 'cities');
select has_table('public', 'exchange_rates');
select has_table('public', 'audit_logs');
select has_column('public', 'profiles', 'role');
select has_column('public', 'profiles', 'status');
select has_column('public', 'cities', 'tebex_multiplier');
select has_column('public', 'cities', 'position');
select has_function('public', 'current_user_role', array[]::text[]);
select has_function('public', 'current_user_is_approved', array[]::text[]);
select has_function('public', 'review_user', array['uuid', 'text']);
select has_function('public', 'save_cities', array['jsonb']);

select * from finish();
rollback;
