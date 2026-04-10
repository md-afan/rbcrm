alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.leads enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "users_self_or_owner" on public.users;
create policy "users_self_or_owner"
on public.users
for select
to authenticated
using (id = auth.uid() or public.get_my_role() = 'owner');

drop policy if exists "users_self_bootstrap" on public.users;
create policy "users_self_bootstrap"
on public.users
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "users_self_update" on public.users;
create policy "users_self_update"
on public.users
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "users_owner_manage" on public.users;
create policy "users_owner_manage"
on public.users
for all
to authenticated
using (public.get_my_role() = 'owner')
with check (public.get_my_role() = 'owner');

drop policy if exists "groups_visible_to_members" on public.groups;
create policy "groups_visible_to_members"
on public.groups
for select
to authenticated
using (
  public.get_my_role() = 'owner'
  or lead_user_id = auth.uid()
  or caller_user_id = auth.uid()
  or demo_user_id = auth.uid()
);

drop policy if exists "groups_owner_manage" on public.groups;
create policy "groups_owner_manage"
on public.groups
for all
to authenticated
using (public.get_my_role() = 'owner')
with check (public.get_my_role() = 'owner');

drop policy if exists "view_group_leads" on public.leads;
create policy "view_group_leads"
on public.leads
for select
to authenticated
using (
  public.get_my_role() = 'owner'
  or exists (
    select 1
    from public.groups g
    where g.id = leads.group_id
      and (
        g.lead_user_id = auth.uid()
        or g.caller_user_id = auth.uid()
        or g.demo_user_id = auth.uid()
      )
  )
);

drop policy if exists "lead_insert" on public.leads;
create policy "lead_insert"
on public.leads
for insert
to authenticated
with check (
  public.get_my_role() in ('lead', 'owner')
);

drop policy if exists "lead_update" on public.leads;
create policy "lead_update"
on public.leads
for update
to authenticated
using (
  exists (
    select 1 from public.groups g
    where g.id = leads.group_id
      and g.lead_user_id = auth.uid()
  )
);

drop policy if exists "caller_update" on public.leads;
create policy "caller_update"
on public.leads
for update
to authenticated
using (
  exists (
    select 1 from public.groups g
    where g.id = leads.group_id
      and g.caller_user_id = auth.uid()
  )
);

drop policy if exists "demo_update" on public.leads;
create policy "demo_update"
on public.leads
for update
to authenticated
using (
  exists (
    select 1 from public.groups g
    where g.id = leads.group_id
      and g.demo_user_id = auth.uid()
  )
);

drop policy if exists "owner_full_access" on public.leads;
create policy "owner_full_access"
on public.leads
for all
to authenticated
using (public.get_my_role() = 'owner')
with check (public.get_my_role() = 'owner');

drop policy if exists "transactions_self_or_owner" on public.transactions;
create policy "transactions_self_or_owner"
on public.transactions
for select
to authenticated
using (user_id = auth.uid() or public.get_my_role() = 'owner');

drop policy if exists "transactions_owner_manage" on public.transactions;
create policy "transactions_owner_manage"
on public.transactions
for all
to authenticated
using (public.get_my_role() = 'owner')
with check (public.get_my_role() = 'owner');
