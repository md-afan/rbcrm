do $$
begin
  begin
    alter type user_role rename value 'coller' to 'caller';
  exception
    when invalid_parameter_value then
      null;
    when undefined_object then
      null;
  end;
end $$;

update auth.users
set raw_user_meta_data = jsonb_set(
  coalesce(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"caller"'::jsonb,
  true
)
where raw_user_meta_data ->> 'role' = 'coller';
