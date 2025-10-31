-- Enable Realtime for chat_messages table
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

-- Verify that it's enabled
SELECT 
  tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'chat_messages'
    ) THEN 'Enabled ✓'
    ELSE 'Not Enabled ✗'
  END as realtime_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'chat_messages';

