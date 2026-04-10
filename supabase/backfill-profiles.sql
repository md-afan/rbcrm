insert into public.profiles (id, email, full_name, role)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data ->> 'full_name', split_part(coalesce(u.email, ''), '@', 1), 'Team Member'),
  case
    when lower(trim(coalesce(u.raw_user_meta_data ->> 'role', 'lead_generator'))) in ('caller', 'coller') then 'caller'::user_role
    when lower(trim(coalesce(u.raw_user_meta_data ->> 'role', 'lead_generator'))) = 'demo' then 'demo'::user_role
    when lower(trim(coalesce(u.raw_user_meta_data ->> 'role', 'lead_generator'))) = 'owner' then 'owner'::user_role
    else 'lead_generator'::user_role
  end
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

update public.profiles p
set
  email = coalesce(u.email, p.email),
  full_name = coalesce(u.raw_user_meta_data ->> 'full_name', p.full_name),
  role = case
    when lower(trim(coalesce(u.raw_user_meta_data ->> 'role', p.role::text))) in ('caller', 'coller') then 'caller'::user_role
    when lower(trim(coalesce(u.raw_user_meta_data ->> 'role', p.role::text))) = 'demo' then 'demo'::user_role
    when lower(trim(coalesce(u.raw_user_meta_data ->> 'role', p.role::text))) = 'owner' then 'owner'::user_role
    else 'lead_generator'::user_role
  end
from auth.users u
where p.id = u.id;
