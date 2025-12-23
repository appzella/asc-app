-- ASC Skiclub: Tour Difficulties Extension
-- Adds difficulties table linked to tour types
-- Run this in Supabase SQL Editor AFTER schema.sql

-- ============================================
-- TOUR DIFFICULTIES TABLE
-- ============================================
create table if not exists public.tour_difficulties (
  id uuid primary key default gen_random_uuid(),
  tour_type_id uuid references public.tour_types(id) on delete cascade,
  name text not null,
  description text,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.tour_difficulties enable row level security;

create policy "Tour difficulties are viewable by everyone"
  on public.tour_difficulties for select
  to authenticated
  using (true);

create policy "Admins can manage tour difficulties"
  on public.tour_difficulties for all
  to authenticated
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- ============================================
-- SEED DIFFICULTIES FOR EACH TOUR TYPE
-- ============================================

-- Ski tour difficulties (SAC scale)
INSERT INTO public.tour_difficulties (tour_type_id, name, description, sort_order)
SELECT t.id, d.name, d.description, d.sort_order
FROM public.tour_types t
CROSS JOIN (VALUES
  ('L', 'Bis 30°, keine Ausrutschgefahr', 1),
  ('WS', 'Ab 30°, kürzere Rutschwege', 2),
  ('ZS', 'Ab 35°, längere Rutschwege', 3),
  ('S', 'Ab 40°, lange Rutschwege, Lebensgefahr', 4),
  ('SS', 'Ab 45°, Rutschwege in Steilstufen abbrechend', 5),
  ('AS', 'Ab 50°, äußerst ausgesetzt', 6),
  ('EX', 'Ab 55°, extrem ausgesetzt, eventuell Abseilen nötig', 7)
) AS d(name, description, sort_order)
WHERE t.name = 'ski'
ON CONFLICT DO NOTHING;

-- Snowshoe difficulties (WT scale)
INSERT INTO public.tour_difficulties (tour_type_id, name, description, sort_order)
SELECT t.id, d.name, d.description, d.sort_order
FROM public.tour_types t
CROSS JOIN (VALUES
  ('WT1', 'Leichte Schneeschuhwanderung', 1),
  ('WT2', 'Schneeschuhwanderung', 2),
  ('WT3', 'Anspruchsvolle Schneeschuhwanderung', 3),
  ('WT4', 'Schneeschuhtour', 4),
  ('WT5', 'Alpine Schneeschuhtour', 5),
  ('WT6', 'Anspruchsvolle alpine Schneeschuhtour', 6)
) AS d(name, description, sort_order)
WHERE t.name = 'snowshoe'
ON CONFLICT DO NOTHING;

-- Hike difficulties (T scale)
INSERT INTO public.tour_difficulties (tour_type_id, name, description, sort_order)
SELECT t.id, d.name, d.description, d.sort_order
FROM public.tour_types t
CROSS JOIN (VALUES
  ('T1', 'Wege meist eben oder schwach geneigt', 1),
  ('T2', 'Meist steile Fußwege', 2),
  ('T3', 'Steil, stellenweise exponiert', 3),
  ('T4', 'Steil, exponiert, teilweise mit Seilen gesichert', 4),
  ('T5', 'Sehr steil, sehr exponiert, oft mit Seilen gesichert', 5),
  ('T6', 'Extrem steil, extrem exponiert, Kletterpassagen', 6)
) AS d(name, description, sort_order)
WHERE t.name = 'hike'
ON CONFLICT DO NOTHING;

-- Bike difficulties
INSERT INTO public.tour_difficulties (tour_type_id, name, description, sort_order)
SELECT t.id, d.name, d.description, d.sort_order
FROM public.tour_types t
CROSS JOIN (VALUES
  ('L', 'Einfach, flach bis leicht hügelig', 1),
  ('M', 'Mittel, hügelig mit moderaten Anstiegen', 2),
  ('S', 'Schwer, steil und technisch anspruchsvoll', 3)
) AS d(name, description, sort_order)
WHERE t.name = 'bike'
ON CONFLICT DO NOTHING;
