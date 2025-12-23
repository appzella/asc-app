-- Seed file for fictional tours in Switzerland
-- Runs in Supabase SQL Editor

-- Helper to get a valid leader ID (uses the first found user, often the admin)
WITH first_user AS (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
INSERT INTO public.tours (
  title, description, date, time, type, difficulty, length, 
  peak, peak_elevation, ascent, descent, duration, 
  max_participants, meeting_point, status, leader_id
)
SELECT
  t.title, t.description, t.date, t.time, t.type, t.difficulty, t.length,
  t.peak, t.peak_elevation, t.ascent, t.descent, t.duration,
  t.max_participants, t.meeting_point, t.status, fu.id
FROM first_user fu, (VALUES
  -- PAST TOURS (3)
  (
    'Skitour Piz Trovat', 
    'Schöne Eingehtour im Engadin mit Blick auf den Morteratschgletscher.', 
    (current_date - interval '10 days')::date, '08:00', 'ski', 'WS', 'medium', 
    'Piz Trovat', 3146, 950, 950, '4 h', 
    8, 'Diavolezza Talstation', 'completed'
  ),
  (
    'Schneeschuhwanderung Rigi', 
    'Gemütliche Runde auf der Rigi, perfekt für Einsteiger.', 
    (current_date - interval '5 days')::date, '09:30', 'snowshoe', 'WT2', 'short', 
    'Rigi Kulm', 1797, 400, 400, '3 h', 
    12, 'Rigi Kaltbad', 'completed'
  ),
  (
    'Wanderung Creux du Van', 
    'Klassiker im Jura, spektakuläre Felsenarena.', 
    (current_date - interval '2 days')::date, '09:00', 'hike', 'T2', 'medium', 
    'Le Soliat', 1463, 700, 700, '4.5 h', 
    15, 'Noiraigue Bahnhof', 'completed'
  ),

  -- FUTURE TOURS (7)
  (
    'Skitour Vilan', 
    'Beliebte Skitour im Prättigau mit toller Aussicht.', 
    (current_date + interval '3 days')::date, '08:30', 'ski', 'L', 'medium', 
    'Vilan', 2376, 1000, 1000, '4 h', 
    10, 'Seewis Dorf', 'published'
  ),
  (
    'Skitour Mutteristock', 
    'Der Klassiker im Wägital. Kann bei guten Verhältnissen überlaufen sein.', 
    (current_date + interval '7 days')::date, '07:30', 'ski', 'WS', 'long', 
    'Mutteristock', 2294, 1300, 1300, '5.5 h', 
    8, 'Innerthal Staumauer', 'published'
  ),
  (
    'Schneeschuhtour Tanzboden', 
    'Aussichtsreiche Tour im Toggenburg mit Einkehrmöglichkeit.', 
    (current_date + interval '14 days')::date, '09:00', 'snowshoe', 'WT2', 'short', 
    'Tanzboden', 1443, 600, 600, '3.5 h', 
    12, 'Ebnat-Kappel', 'published'
  ),
  (
    'Skitour Groß Leckihorn', 
    'Anspruchsvolle Tour im Furkagebiet.', 
    (current_date + interval '21 days')::date, '06:00', 'ski', 'ZS', 'long', 
    'Gross Leckihorn', 3068, 1500, 1500, '7 h', 
    6, 'Realp', 'published'
  ),
  (
    'Wanderung Mythen', 
    'Steiler Aufstieg auf den Grossen Mythen, Trittsicherheit erforderlich.', 
    (current_date + interval '30 days')::date, '08:00', 'hike', 'T3', 'short', 
    'Grosser Mythen', 1898, 800, 800, '3 h', 
    10, 'Brunni Talstation', 'published'
  ),
  (
    'Velotour Bodensee', 
    'Flache Runde am See entlang, ideal für den Saisonstart.', 
    (current_date + interval '45 days')::date, '10:00', 'bike', 'L', 'long', 
    'Pfänder (Blick)', 400, 100, 100, '5 h', 
    15, 'Rorschach Hafen', 'published'
  ),
  (
    'Hochtour Tödi', 
    'König der Glarner Alpen. Übernachtung in der Fridolinshütte.', 
    (current_date + interval '60 days')::date, '05:00', 'ski', 'S', 'long', 
    'Tödi', 3614, 1800, 1800, '9 h', 
    4, 'Linthal', 'published'
  )
) as t(title, description, date, time, type, difficulty, length, peak, peak_elevation, ascent, descent, duration, max_participants, meeting_point, status);
