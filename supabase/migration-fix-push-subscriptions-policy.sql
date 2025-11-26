-- Migration: Add UPDATE policy for push_subscriptions
-- Required for upsert operations

CREATE POLICY "Users can update their own subscriptions"
  ON public.push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);
