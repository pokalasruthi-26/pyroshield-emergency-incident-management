# Fire Reporting App

## Run Locally

1. Install dependencies:
	 - `npm install`
2. Start app:
	 - `npm run dev`

## Supabase Setup (Fix Image Upload Errors)

If image upload fails with messages like `bucket not found`, `new row violates row-level security`, or `403`, complete this setup in Supabase SQL editor.

Quick option: run the script in [supabase/fix_storage_and_rls.sql](supabase/fix_storage_and_rls.sql).

### 1. Required tables

```sql
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
```

### 2. Create storage bucket for images

```sql
insert into storage.buckets (id, name, public)
values ('incident-images', 'incident-images', true)
on conflict (id) do nothing;
```

### 3. Storage policies for uploads and reads

```sql
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
```

### 4. Table RLS policies

```sql
alter table public.incidents enable row level security;
alter table public.status_logs enable row level security;
alter table public.profiles enable row level security;

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
```

## Notes

- The report form has a dedicated Submit button under image upload.
- User reports are written to `incidents` and `status_logs` and are visible in the admin dashboard.
- If Storage upload fails, the app still submits the report using inline compressed image data so the admin can analyze immediately.
