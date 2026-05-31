-- Fire Reporting: Supabase Storage + RLS setup
-- Run this entire script in Supabase SQL Editor.

-- Ensure extensions for UUID helpers are available.
create extension if not exists pgcrypto;

-- Required app tables.
create table if not exists public.profiles (
  id uuid primary key,
  name text,
  email text,
  role text default 'public',
  trust_score int default 80,
  created_at timestamptz default now()
);

create table if not exists public.incidents (
  id uuid primary key default gen_random_uuid(),
  description text not null,
  latitude double precision not null,
  longitude double precision not null,
  address text,
  image_url text,
  priority text default 'low',
  status text default 'active',
  reporter_id uuid,
  reporter_name text,
  created_at timestamptz default now()
);

create table if not exists public.status_logs (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid references public.incidents(id) on delete cascade,
  status text not null,
  message text not null,
  updated_at timestamptz default now()
);

-- Enable RLS.
alter table public.profiles enable row level security;
alter table public.incidents enable row level security;
alter table public.status_logs enable row level security;

-- Recreate table policies safely.
drop policy if exists "Read incidents" on public.incidents;
drop policy if exists "Insert incidents" on public.incidents;
drop policy if exists "Read status logs" on public.status_logs;
drop policy if exists "Insert status logs" on public.status_logs;

create policy "Read incidents"
on public.incidents
for select
to authenticated
using (true);

create policy "Insert incidents"
on public.incidents
for insert
to authenticated
with check (true);

create policy "Read status logs"
on public.status_logs
for select
to authenticated
using (true);

create policy "Insert status logs"
on public.status_logs
for insert
to authenticated
with check (true);

-- Ensure storage bucket exists and is public for reads.
insert into storage.buckets (id, name, public)
values ('incident-images', 'incident-images', true)
on conflict (id) do update set public = true;

-- Recreate storage policies safely.
drop policy if exists "Public read incident images" on storage.objects;
drop policy if exists "Authenticated upload incident images" on storage.objects;

create policy "Public read incident images"
on storage.objects
for select
to public
using (bucket_id = 'incident-images');

create policy "Authenticated upload incident images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'incident-images');

-- Optional: allow authenticated users to update/delete their own incident images.
drop policy if exists "Authenticated update incident images" on storage.objects;
drop policy if exists "Authenticated delete incident images" on storage.objects;

create policy "Authenticated update incident images"
on storage.objects
for update
to authenticated
using (bucket_id = 'incident-images')
with check (bucket_id = 'incident-images');

create policy "Authenticated delete incident images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'incident-images');

-- Quick verification query.
select id, name, public from storage.buckets where id = 'incident-images';
