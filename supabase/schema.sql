create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('lead_generator', 'lead', 'caller', 'demo', 'owner');
  else
    begin
      alter type user_role add value if not exists 'lead_generator';
    exception
      when duplicate_object then null;
    end;
    begin
      alter type user_role add value if not exists 'lead';
    exception
      when duplicate_object then null;
    end;
    begin
      alter type user_role add value if not exists 'caller';
    exception
      when duplicate_object then null;
    end;
    begin
      alter type user_role add value if not exists 'demo';
    exception
      when duplicate_object then null;
    end;
    begin
      alter type user_role add value if not exists 'owner';
    exception
      when duplicate_object then null;
    end;
  end if;
  if not exists (select 1 from pg_type where typname = 'lead_quality') then
    create type lead_quality as enum ('High', 'Medium', 'Low');
  end if;
  if not exists (select 1 from pg_type where typname = 'lead_status') then
    create type lead_status as enum ('New', 'Interested', 'Follow-up', 'Demo', 'Closed', 'Lost');
  end if;
  if not exists (select 1 from pg_type where typname = 'demo_status') then
    create type demo_status as enum ('Pending', 'Done', 'Cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum ('Pending', 'Partial', 'Paid');
  end if;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null unique,
  role user_role not null default 'lead_generator',
  created_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'profiles'
  ) then
    insert into public.users (id, name, email, role, created_at)
    select
      p.id,
      p.full_name,
      p.email,
      case
        when p.role::text in ('lead', 'creator') then 'lead_generator'::user_role
        else p.role::user_role
      end,
      coalesce(p.created_at, timezone('utc', now()))
    from public.profiles p
    on conflict (id) do update
    set
      name = excluded.name,
      email = excluded.email,
      role = excluded.role;
  end if;
end $$;

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  group_name text not null unique,
  lead_user_id uuid not null references public.users (id) on delete restrict,
  caller_user_id uuid not null references public.users (id) on delete restrict,
  demo_user_id uuid not null references public.users (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  constraint groups_unique_members check (
    lead_user_id <> caller_user_id
    and lead_user_id <> demo_user_id
    and caller_user_id <> demo_user_id
  )
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups (id) on delete cascade,
  business_name text not null,
  business_type text,
  owner_name text not null,
  phone text not null,
  city text,
  address text,
  location text not null,
  source text not null,
  lead_by uuid not null references auth.users (id) on delete restrict,
  lead_quality lead_quality not null default 'Medium',
  status lead_status not null default 'New',
  interest text,
  budget text,
  assigned_to uuid references public.users (id) on delete set null,
  attempts_count integer not null default 0 check (attempts_count >= 0),
  next_followup_date timestamptz,
  demo_status demo_status,
  demo_feedback text,
  deal_closed boolean not null default false,
  selected_plan text,
  deal_amount numeric(12, 2),
  discount_given numeric(5, 2) default 0 check (discount_given >= 0 and discount_given <= 100),
  payment_status payment_status,
  advance_amount numeric(12, 2) not null default 0,
  balance_amount numeric(12, 2) generated always as (
    round(
      (
        deal_amount
        - (deal_amount * coalesce(discount_given, 0) / 100)
        - coalesce(advance_amount, 0)
      )::numeric,
      2
    )
  ) stored,
  lead_commission numeric(12, 2),
  caller_commission numeric(12, 2),
  demo_commission numeric(12, 2),
  total_commission numeric(12, 2),
  admin_profit numeric(12, 2),
  closing_date timestamptz,
  lost_reason text,
  final_remarks text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null check (role in ('lead', 'caller', 'demo')),
  amount numeric(12, 2) not null,
  created_at timestamptz not null default timezone('utc', now())
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leads'
      and column_name = 'lead_id'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leads'
      and column_name = 'id'
  ) then
    alter table public.leads rename column lead_id to id;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leads'
      and column_name = 'date'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leads'
      and column_name = 'created_at'
  ) then
    alter table public.leads rename column date to created_at;
  end if;
end $$;

alter table public.leads add column if not exists group_id uuid;
alter table public.leads add column if not exists business_type text;
alter table public.leads add column if not exists interest text;
alter table public.leads add column if not exists budget text;
alter table public.leads add column if not exists city text;
alter table public.leads add column if not exists address text;
alter table public.leads add column if not exists deal_amount numeric(12, 2);
alter table public.leads add column if not exists selected_plan text;
alter table public.leads add column if not exists discount_given numeric(5, 2) default 0;
alter table public.leads add column if not exists advance_amount numeric(12, 2) default 0;
alter table public.leads add column if not exists lead_commission numeric(12, 2);
alter table public.leads add column if not exists caller_commission numeric(12, 2);
alter table public.leads add column if not exists demo_commission numeric(12, 2);
alter table public.leads add column if not exists total_commission numeric(12, 2);
alter table public.leads add column if not exists admin_profit numeric(12, 2);
alter table public.leads add column if not exists closing_date timestamptz;
alter table public.leads add column if not exists lost_reason text;
alter table public.leads add column if not exists final_remarks text;
alter table public.leads add column if not exists created_at timestamptz default timezone('utc', now());

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leads'
      and column_name = 'interest_level'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leads'
      and column_name = 'interest'
  ) then
    alter table public.leads rename column interest_level to interest;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leads'
      and column_name = 'budget_range'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leads'
      and column_name = 'budget'
  ) then
    alter table public.leads rename column budget_range to budget;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leads'
      and column_name = 'amount'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leads'
      and column_name = 'deal_amount'
  ) then
    alter table public.leads rename column amount to deal_amount;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leads'
      and column_name = 'balance_amount'
  ) then
    alter table public.leads drop column balance_amount;
  end if;
end $$;

alter table public.leads
  alter column group_id drop not null;

alter table public.leads
  alter column advance_amount set default 0;

alter table public.leads drop column if exists service_start_date;
alter table public.leads drop column if exists delivery_deadline;
alter table public.leads drop column if exists delivery_status;
alter table public.leads drop column if exists creator_user_id;
alter table public.leads drop column if exists is_creator_deal;
alter table public.leads drop column if exists commission_percentage;
alter table public.leads drop column if exists commission_amount;
alter table public.leads drop column if exists commission_status;
alter table public.leads drop column if exists project_delivered;

alter table public.leads drop constraint if exists leads_lead_by_fkey;
alter table public.leads
  add constraint leads_lead_by_fkey
  foreign key (lead_by) references auth.users (id) on delete restrict;

update public.leads
set
  advance_amount = coalesce(advance_amount, 0),
  discount_given = coalesce(discount_given, 0)
where advance_amount is null
  or discount_given is null;

alter table public.leads
  add column balance_amount numeric(12, 2) generated always as (
    round(
      (
        deal_amount
        - (deal_amount * coalesce(discount_given, 0) / 100)
        - coalesce(advance_amount, 0)
      )::numeric,
      2
    )
  ) stored;

create index if not exists idx_leads_group_id on public.leads (group_id);
create index if not exists idx_leads_status on public.leads (status);
create index if not exists idx_leads_assigned_to on public.leads (assigned_to);
create index if not exists idx_transactions_user_id on public.transactions (user_id);
create index if not exists idx_transactions_lead_id on public.transactions (lead_id);
create unique index if not exists idx_transactions_unique_role_per_lead
  on public.transactions (lead_id, user_id, role);

update public.users
set role = 'lead_generator'
where role::text = 'creator';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    case
      when coalesce(new.raw_user_meta_data ->> 'role', '') in ('creator', 'lead') then 'lead_generator'::user_role
      when new.raw_user_meta_data ? 'role' then (new.raw_user_meta_data ->> 'role')::user_role
      else 'lead_generator'::user_role
    end
  )
  on conflict (id) do update
  set
    name = excluded.name,
    email = excluded.email,
    role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.get_my_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.increment_attempts()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status and public.get_my_role() = 'caller' then
    new.attempts_count := coalesce(old.attempts_count, 0) + 1;
  end if;

  return new;
end;
$$;

drop trigger if exists leads_attempts_counter on public.leads;
create trigger leads_attempts_counter
  before update on public.leads
  for each row execute procedure public.increment_attempts();

create or replace function public.apply_commission_snapshot()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  final_amount numeric(12, 2);
begin
  if new.deal_closed = true and new.deal_amount is not null then
    final_amount := round(
      (
        new.deal_amount
        - (new.deal_amount * coalesce(new.discount_given, 0) / 100)
      )::numeric,
      2
    );

    new.lead_commission := round((final_amount * 0.06)::numeric, 2);
    new.caller_commission := round((final_amount * 0.07)::numeric, 2);
    new.demo_commission := round((final_amount * 0.07)::numeric, 2);
    new.total_commission := round(
      (coalesce(new.lead_commission, 0) + coalesce(new.caller_commission, 0) + coalesce(new.demo_commission, 0))::numeric,
      2
    );
    new.admin_profit := round((final_amount - coalesce(new.total_commission, 0))::numeric, 2);
  else
    new.lead_commission := null;
    new.caller_commission := null;
    new.demo_commission := null;
    new.total_commission := null;
    new.admin_profit := null;
  end if;

  return new;
end;
$$;

drop trigger if exists leads_commission_snapshot on public.leads;
create trigger leads_commission_snapshot
  before insert or update on public.leads
  for each row execute procedure public.apply_commission_snapshot();

create or replace function public.sync_commission_transactions()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  team_group public.groups%rowtype;
begin
  delete from public.transactions where lead_id = new.id;

  if not (new.deal_closed = true and new.total_commission is not null) then
    return new;
  end if;

  select *
  into team_group
  from public.groups
  where id = new.group_id;

  if not found then
    return new;
  end if;

  insert into public.transactions (lead_id, user_id, role, amount)
  values
    (new.id, team_group.lead_user_id, 'lead', coalesce(new.lead_commission, 0)),
    (new.id, team_group.caller_user_id, 'caller', coalesce(new.caller_commission, 0)),
    (new.id, team_group.demo_user_id, 'demo', coalesce(new.demo_commission, 0));

  return new;
end;
$$;

drop trigger if exists leads_commission_transactions on public.leads;
create trigger leads_commission_transactions
  after insert or update on public.leads
  for each row execute procedure public.sync_commission_transactions();
