-- Cranellz schema (PRD section 6). Run once in Supabase SQL Editor.
create extension if not exists "pgcrypto";

create table if not exists categories (
  code text primary key,
  name jsonb not null,
  name_jp text,
  sort int not null default 0
);
create table if not exists version_groups (
  label text primary key,
  label_jp text,
  sort int not null default 0
);
create table if not exists versions (
  version text primary key,
  name text,
  release_date date
);
create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  width int, height int,
  crop jsonb,
  alt jsonb,
  credit text
);
create table if not exists site_settings (
  id int primary key default 1 check (id = 1),
  brand_latin text not null default 'CRANELLZ',
  brand_cjk text,
  top_right_label jsonb,
  back_link_url text,
  social_links jsonb not null default '[]'::jsonb,
  disclaimer jsonb,
  default_story_slug text,
  default_locale text not null default 'en',
  locales text[] not null default '{en,id}'
);
do $$ begin
  create type story_status as enum ('draft','scheduled','published');
exception when duplicate_object then null; end $$;

create table if not exists stories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  category text not null references categories(code),
  chapter_label text,
  title jsonb not null,
  original_title text,
  original_title_lang text check (original_title_lang in ('zh-Hans','ja')),
  romanised_title text,
  version text not null,
  version_group text references version_groups(label),
  region text,
  characters text[] not null default '{}',
  est_minutes int,
  release_date date,
  synopsis jsonb not null default '{}'::jsonb,
  body jsonb not null default '{"en":null,"id":null}'::jsonb,
  spine_media_id uuid references media(id),
  cover_media_id uuid references media(id),
  sort_key numeric not null,
  status story_status not null default 'draft',
  publish_at timestamptz,
  needs_review boolean not null default false,
  source_url text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  -- publish rule: both titles and both synopses required
  constraint publish_rule check (
    status = 'draft' or (
      coalesce(title->>'en','') <> '' and coalesce(title->>'id','') <> '' and
      coalesce(synopsis->>'en','') <> '' and coalesce(synopsis->>'id','') <> ''
    )
  )
);
create index if not exists stories_sort_idx on stories (sort_key);
create index if not exists stories_status_idx on stories (status);
create index if not exists stories_group_idx on stories (version_group);

-- ---------- roles ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null check (role in ('admin','editor'))
);

create or replace function is_editor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid());
$$;
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- owner becomes admin automatically on first sign-in; everyone else gets no profile (read-only)
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if lower(new.email) = 'pasifik.bayu19@gmail.com' then
    insert into profiles (id, email, role) values (new.id, new.email, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
-- if the owner already signed in before this script ran:
insert into profiles (id, email, role)
  select id, email, 'admin' from auth.users where lower(email) = 'pasifik.bayu19@gmail.com'
  on conflict do nothing;

create or replace function touch_story() returns trigger language plpgsql as $$
begin new.updated_at = now(); new.updated_by = auth.uid(); return new; end $$;
drop trigger if exists stories_touch on stories;
create trigger stories_touch before insert or update on stories
  for each row execute function touch_story();

-- ---------- RLS ----------
alter table categories enable row level security;
alter table version_groups enable row level security;
alter table versions enable row level security;
alter table media enable row level security;
alter table site_settings enable row level security;
alter table stories enable row level security;
alter table profiles enable row level security;

-- public read
create policy "read categories" on categories for select using (true);
create policy "read version_groups" on version_groups for select using (true);
create policy "read versions" on versions for select using (true);
create policy "read media" on media for select using (true);
create policy "read settings" on site_settings for select using (true);
create policy "read live stories" on stories for select using (
  status = 'published' or (status = 'scheduled' and publish_at <= now()) or is_editor()
);
-- editor / admin writes
create policy "write categories" on categories for all using (is_editor()) with check (is_editor());
create policy "write version_groups" on version_groups for all using (is_editor()) with check (is_editor());
create policy "write versions" on versions for all using (is_editor()) with check (is_editor());
create policy "write media" on media for all using (is_editor()) with check (is_editor());
create policy "write settings" on site_settings for all using (is_admin()) with check (is_admin());
create policy "write stories" on stories for all using (is_editor()) with check (is_editor());
-- profiles: read own, admin manages
create policy "read own profile" on profiles for select using (id = auth.uid() or is_admin());
create policy "admin manages profiles" on profiles for all using (is_admin()) with check (is_admin());

-- ---------- storage bucket for art ----------
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict do nothing;
create policy "public read media files" on storage.objects for select using (bucket_id = 'media');
create policy "editors upload media files" on storage.objects for insert with check (bucket_id = 'media' and is_editor());
create policy "editors update media files" on storage.objects for update using (bucket_id = 'media' and is_editor());
create policy "editors delete media files" on storage.objects for delete using (bucket_id = 'media' and is_editor());
