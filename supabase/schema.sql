-- Run once in the Supabase SQL editor. The application uses only the anon key.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text not null,
  email_confirmed_at timestamptz
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  owner_email text not null,
  name text not null check (length(trim(name)) between 1 and 120),
  initial_budget numeric(15,2) not null check (initial_budget >= 0),
  budget numeric(15,2) not null check (budget >= 0),
  contractors integer not null default 0 check (contractors between 0 and 10000),
  unit text not null default 'Lakhs' check (unit in ('Lakhs', 'Cr')),
  created_at timestamptz not null default now()
);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null check (role in ('manager', 'viewer')),
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  stage text not null check (length(trim(stage)) between 1 and 120),
  category text not null check (length(trim(category)) between 1 and 80),
  material_cost numeric(15,2) not null check (material_cost >= 0),
  labor_cost numeric(15,2) not null check (labor_cost >= 0),
  status text not null default 'In Progress' check (status in ('Completed', 'In Progress', 'Over Budget')),
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  item text not null,
  vendor text not null,
  total text not null,
  advance_paid text not null,
  balance_due text not null,
  due_date text not null,
  created_at timestamptz not null default now()
);

create or replace function public.sync_auth_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email is null then
    return new;
  end if;
  insert into public.profiles (id, email, name, email_confirmed_at)
  values (new.id, lower(new.email), coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1)), new.email_confirmed_at)
  on conflict (id) do update set email = excluded.email, name = excluded.name,
    email_confirmed_at = excluded.email_confirmed_at;
  update public.project_members
  set email = lower(new.email), name = coalesce(nullif(new.raw_user_meta_data->>'name', ''), split_part(new.email, '@', 1))
  where user_id = new.id;
  return new;
end;
$$;

drop trigger if exists auth_profile_sync on auth.users;
create trigger auth_profile_sync after insert or update of email, raw_user_meta_data, email_confirmed_at
on auth.users for each row execute function public.sync_auth_profile();

insert into public.profiles (id, email, name, email_confirmed_at)
select id, lower(email), coalesce(nullif(raw_user_meta_data->>'name', ''), split_part(email, '@', 1)), email_confirmed_at
from auth.users where email is not null
on conflict (id) do update set email = excluded.email, name = excluded.name,
  email_confirmed_at = excluded.email_confirmed_at;

create index if not exists project_members_user_idx on public.project_members(user_id);
create index if not exists expenses_project_idx on public.expenses(project_id);
create index if not exists payments_project_idx on public.payments(project_id);

create or replace function public.is_project_owner(project_uuid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.projects p
    where p.id = project_uuid and p.owner_id = (select auth.uid())
  );
$$;

create or replace function public.can_view_project(project_uuid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_project_owner(project_uuid) or exists (
    select 1 from public.project_members m
    where m.project_id = project_uuid
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.can_edit_project(project_uuid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.is_project_owner(project_uuid) or exists (
    select 1 from public.project_members m
    where m.project_id = project_uuid
      and m.user_id = (select auth.uid())
      and m.role = 'manager'
  );
$$;

revoke all on function public.is_project_owner(uuid) from public, anon;
revoke all on function public.can_view_project(uuid) from public, anon;
revoke all on function public.can_edit_project(uuid) from public, anon;
grant execute on function public.is_project_owner(uuid) to authenticated;
grant execute on function public.can_view_project(uuid) to authenticated;
grant execute on function public.can_edit_project(uuid) to authenticated;

create or replace function public.add_project_member(project_uuid uuid, member_email text, member_role text)
returns public.project_members language plpgsql security definer set search_path = '' as $$
declare
  profile_record public.profiles%rowtype;
  created public.project_members%rowtype;
begin
  if not public.is_project_owner(project_uuid) then
    raise exception 'Only the project owner can manage roles.' using errcode = '42501';
  end if;
  if member_role not in ('manager', 'viewer') then
    raise exception 'Choose manager or viewer.';
  end if;
  select * into profile_record from public.profiles
    where email = lower(trim(member_email)) and email_confirmed_at is not null;
  if not found then
    raise exception 'No confirmed account has that email.';
  end if;
  if profile_record.id = (select auth.uid()) then
    raise exception 'The owner already has access.';
  end if;
  insert into public.project_members (project_id, user_id, email, name, role)
  values (project_uuid, profile_record.id, profile_record.email, profile_record.name, member_role)
  returning * into created;
  return created;
end;
$$;

revoke all on function public.add_project_member(uuid, text, text) from public, anon;
grant execute on function public.add_project_member(uuid, text, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.expenses enable row level security;
alter table public.payments enable row level security;

revoke all on public.profiles, public.projects, public.project_members, public.expenses, public.payments from anon, authenticated;
grant select, insert on public.projects to authenticated;
grant update (name, initial_budget, budget, contractors) on public.projects to authenticated;
grant select, delete on public.project_members to authenticated;
grant update (role) on public.project_members to authenticated;
grant select, insert on public.expenses to authenticated;
grant update (stage, category, material_cost, labor_cost, status) on public.expenses to authenticated;
grant select on public.payments to authenticated;

drop policy if exists projects_read on public.projects;
create policy projects_read on public.projects for select to authenticated
using (public.can_view_project(id));
drop policy if exists projects_create on public.projects;
create policy projects_create on public.projects for insert to authenticated
with check (owner_id = (select auth.uid()) and owner_email = lower((select auth.jwt()->>'email')));
drop policy if exists projects_edit on public.projects;
create policy projects_edit on public.projects for update to authenticated
using (public.can_edit_project(id)) with check (public.can_edit_project(id));

drop policy if exists members_read on public.project_members;
create policy members_read on public.project_members for select to authenticated
using (public.can_view_project(project_id));
drop policy if exists members_edit on public.project_members;
create policy members_edit on public.project_members for update to authenticated
using (public.is_project_owner(project_id)) with check (public.is_project_owner(project_id));
drop policy if exists members_remove on public.project_members;
create policy members_remove on public.project_members for delete to authenticated
using (public.is_project_owner(project_id));

drop policy if exists expenses_read on public.expenses;
create policy expenses_read on public.expenses for select to authenticated
using (public.can_view_project(project_id));
drop policy if exists expenses_create on public.expenses;
create policy expenses_create on public.expenses for insert to authenticated
with check (public.can_edit_project(project_id));
drop policy if exists expenses_edit on public.expenses;
create policy expenses_edit on public.expenses for update to authenticated
using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

drop policy if exists payments_read on public.payments;
create policy payments_read on public.payments for select to authenticated
using (public.can_view_project(project_id));
