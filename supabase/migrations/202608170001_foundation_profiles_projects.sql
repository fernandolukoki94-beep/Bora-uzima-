-- Fernando Lucoco Music — Supabase foundation
-- Safe, additive migration for profiles and local-first Studio project manifests.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text not null default '',
  avatar_url text,
  bio text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_username_length check (username is null or char_length(username) between 3 and 32),
  constraint profiles_display_name_length check (char_length(display_name) <= 120),
  constraint profiles_bio_length check (char_length(bio) <= 500)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text not null default '',
  status text not null default 'draft',
  visibility text not null default 'private',
  manifest jsonb not null default '{}'::jsonb,
  audio_asset_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint projects_name_length check (char_length(name) between 1 and 160),
  constraint projects_description_length check (char_length(description) <= 2000),
  constraint projects_status_check check (status in ('draft', 'archived')), 
  constraint projects_visibility_check check (visibility in ('private', 'unlisted', 'public')),
  constraint projects_manifest_object check (jsonb_typeof(manifest) = 'object'),
  constraint projects_audio_asset_ids_array check (jsonb_typeof(audio_asset_ids) = 'array')
);

create index if not exists projects_owner_updated_idx
  on public.projects (owner_id, updated_at desc, id desc);

create index if not exists projects_public_updated_idx
  on public.projects (updated_at desc, id desc)
  where visibility = 'public' and status = 'draft';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;

drop policy if exists profiles_select_own_or_public on public.profiles;
create policy profiles_select_own_or_public
on public.profiles for select
to authenticated
using (id = (select auth.uid()));

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles for insert
to authenticated
with check (id = (select auth.uid()));

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists projects_select_own_or_public on public.projects;
create policy projects_select_own_or_public
on public.projects for select
to authenticated
using (owner_id = (select auth.uid()) or visibility = 'public');

drop policy if exists projects_insert_own on public.projects;
create policy projects_insert_own
on public.projects for insert
to authenticated
with check (owner_id = (select auth.uid()));

drop policy if exists projects_update_own on public.projects;
create policy projects_update_own
on public.projects for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists projects_delete_own on public.projects;
create policy projects_delete_own
on public.projects for delete
to authenticated
using (owner_id = (select auth.uid()));
