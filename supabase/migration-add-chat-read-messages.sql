    -- Migration: Chat Read Messages Table
    -- Speichert welche Nachrichten von welchen Benutzern gelesen wurden
    -- Ermöglicht geräteübergreifende Synchronisation

    CREATE TABLE IF NOT EXISTS public.chat_read_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tour_id)
    );

    -- Index für schnelle Abfragen
    CREATE INDEX IF NOT EXISTS idx_chat_read_messages_user_tour ON public.chat_read_messages(user_id, tour_id);
    CREATE INDEX IF NOT EXISTS idx_chat_read_messages_tour ON public.chat_read_messages(tour_id);

    -- Enable RLS
    ALTER TABLE public.chat_read_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Drop existing policies if they exist (für idempotente Migration)
DROP POLICY IF EXISTS "Users can view their own read status" ON public.chat_read_messages;
DROP POLICY IF EXISTS "Users can insert their own read status" ON public.chat_read_messages;
DROP POLICY IF EXISTS "Users can update their own read status" ON public.chat_read_messages;
DROP POLICY IF EXISTS "Admins can view all read status" ON public.chat_read_messages;

-- Benutzer können ihren eigenen Read-Status sehen und aktualisieren
CREATE POLICY "Users can view their own read status"
ON public.chat_read_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own read status"
ON public.chat_read_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own read status"
ON public.chat_read_messages FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins können alle Read-Status sehen
CREATE POLICY "Admins can view all read status"
ON public.chat_read_messages FOR SELECT
USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_chat_read_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS chat_read_messages_updated_at ON public.chat_read_messages;
CREATE TRIGGER chat_read_messages_updated_at
  BEFORE UPDATE ON public.chat_read_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_read_messages_updated_at();

    -- Kommentare
    COMMENT ON TABLE public.chat_read_messages IS 'Speichert den letzten gelesenen Timestamp für jeden Benutzer pro Tour';
    COMMENT ON COLUMN public.chat_read_messages.last_read_at IS 'Timestamp der letzten gelesenen Nachricht für diese Tour';

