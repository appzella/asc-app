-- ASC Skiclub Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. USERS TABLE (extends auth.users)
-- ============================================
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  name text,
  role text default 'member' check (role in ('admin', 'leader', 'member')),
  phone text,
  emergency_contact text,
  profile_photo text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.users enable row level security;

-- Policies: Everyone can read, users can update own record
create policy "Users are viewable by authenticated users"
  on public.users for select
  to authenticated
  using (true);

create policy "Users can update own record"
  on public.users for update
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert own record"
  on public.users for insert
  to authenticated
  with check (auth.uid() = id);

-- ============================================
-- 2. TOUR TYPES TABLE
-- ============================================
create table if not exists public.tour_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  label text not null,
  icon text,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.tour_types enable row level security;

create policy "Tour types are viewable by everyone"
  on public.tour_types for select
  to authenticated
  using (true);

create policy "Admins can manage tour types"
  on public.tour_types for all
  to authenticated
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- Seed tour types
insert into public.tour_types (name, label, icon, sort_order) values
  ('ski', 'Skitour', 'mountain-snow', 1),
  ('snowshoe', 'Schneeschuhtour', 'footprints', 2),
  ('hike', 'Wanderung', 'map-pin', 3),
  ('bike', 'Velotour', 'bike', 4)
on conflict do nothing;

-- ============================================
-- 3. TOUR LENGTHS TABLE
-- ============================================
create table if not exists public.tour_lengths (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  label text not null,
  description text,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.tour_lengths enable row level security;

create policy "Tour lengths are viewable by everyone"
  on public.tour_lengths for select
  to authenticated
  using (true);

create policy "Admins can manage tour lengths"
  on public.tour_lengths for all
  to authenticated
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- Seed tour lengths
insert into public.tour_lengths (name, label, description, sort_order) values
  ('short', 'Kurz', '2-4 Stunden', 1),
  ('medium', 'Mittel', '4-6 Stunden', 2),
  ('long', 'Lang', '6+ Stunden', 3)
on conflict do nothing;

-- ============================================
-- 4. TOURS TABLE
-- ============================================
create table if not exists public.tours (
  id text primary key default 'tour_' || gen_random_uuid()::text,
  title text not null,
  description text,
  date date,
  time text,
  type text,
  difficulty text,
  length text,
  peak text,
  peak_elevation integer,
  ascent integer,
  descent integer,
  duration text,
  max_participants integer default 10,
  meeting_point text,
  meeting_point_link text,
  gpx_url text,
  whatsapp_link text,
  status text default 'published' check (status in ('draft', 'published', 'cancelled', 'completed')),
  leader_id uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tours enable row level security;

-- Everyone can read published tours
create policy "Published tours are viewable by everyone"
  on public.tours for select
  to authenticated
  using (status = 'published' or leader_id = auth.uid() or 
         exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'leader')));

-- Leaders can create tours
create policy "Leaders can create tours"
  on public.tours for insert
  to authenticated
  with check (exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'leader')));

-- Leaders can update own tours, admins can update all
create policy "Leaders can update own tours"
  on public.tours for update
  to authenticated
  using (leader_id = auth.uid() or 
         exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- Admins can delete tours
create policy "Admins can delete tours"
  on public.tours for delete
  to authenticated
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- ============================================
-- 5. TOUR PARTICIPANTS TABLE
-- ============================================
create table if not exists public.tour_participants (
  tour_id text references public.tours(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  is_waitlist boolean default false,
  joined_at timestamptz default now(),
  primary key (tour_id, user_id)
);

alter table public.tour_participants enable row level security;

create policy "Participants are viewable by authenticated users"
  on public.tour_participants for select
  to authenticated
  using (true);

create policy "Users can join tours"
  on public.tour_participants for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can leave tours"
  on public.tour_participants for delete
  to authenticated
  using (auth.uid() = user_id or 
         exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- ============================================
-- 6. INVITATIONS TABLE
-- ============================================
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text unique not null default gen_random_uuid()::text,
  used boolean default false,
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

alter table public.invitations enable row level security;

create policy "Admins can manage invitations"
  on public.invitations for all
  to authenticated
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "Anyone can read invitation by token"
  on public.invitations for select
  using (true); -- Allow checking token validity during registration

-- ============================================
-- 7. NOTIFICATIONS TABLE
-- ============================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  title text not null,
  message text,
  type text default 'info',
  read boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "Users can see own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id);

-- ============================================
-- 8. TRIGGER: Auto-create user profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
