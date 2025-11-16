-- Migration: Remove Chat Functionality
-- Entfernt alle Chat-bezogenen Tabellen, Views und Realtime-Subscriptions

-- Entferne Realtime-Publikationen für Chat-Tabellen
DO $$
BEGIN
  -- Entferne chat_messages aus der Publikation
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.chat_messages;
  END IF;

  -- Entferne chat_read_messages aus der Publikation
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'chat_read_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.chat_read_messages;
  END IF;
END $$;

-- Lösche View (CASCADE entfernt abhängige Objekte)
DROP VIEW IF EXISTS public.chat_messages_with_user CASCADE;

-- Lösche RLS Policies für chat_messages
DROP POLICY IF EXISTS "Users can view messages for tours they participate in" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages to tours they participate in" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can delete any message" ON public.chat_messages;

-- Lösche RLS Policies für chat_read_messages
DROP POLICY IF EXISTS "Users can view their own read status" ON public.chat_read_messages;
DROP POLICY IF EXISTS "Users can insert their own read status" ON public.chat_read_messages;
DROP POLICY IF EXISTS "Users can update their own read status" ON public.chat_read_messages;
DROP POLICY IF EXISTS "Admins can view all read status" ON public.chat_read_messages;

-- Lösche Trigger für chat_read_messages
DROP TRIGGER IF EXISTS chat_read_messages_updated_at ON public.chat_read_messages;
DROP FUNCTION IF EXISTS update_chat_read_messages_updated_at();

-- Lösche Indizes
DROP INDEX IF EXISTS idx_chat_messages_tour_id;
DROP INDEX IF EXISTS idx_chat_messages_created_at;
DROP INDEX IF EXISTS idx_chat_read_messages_user_tour;
DROP INDEX IF EXISTS idx_chat_read_messages_tour;

-- Lösche Tabellen (CASCADE entfernt abhängige Objekte)
DROP TABLE IF EXISTS public.chat_read_messages CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;

