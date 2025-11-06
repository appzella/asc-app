-- Enable Realtime for chat_messages and chat_read_messages tables
-- This allows clients to subscribe to changes in real-time

-- Check if supabase_realtime publication exists, create if not
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete');
  END IF;
END $$;

-- Add chat_messages table to the publication
-- This will only add it if it's not already there (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  END IF;
END $$;

-- Add chat_read_messages table to the publication
-- This will only add it if it's not already there (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'chat_read_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_read_messages;
  END IF;
END $$;

-- Verify that it's enabled
SELECT 
  t.tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = t.tablename
    ) THEN 'Enabled ✓'
    ELSE 'Not Enabled ✗'
  END as realtime_status
FROM pg_tables t
WHERE t.schemaname = 'public' 
AND t.tablename IN ('chat_messages', 'chat_read_messages');

