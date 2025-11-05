    -- Migration: Add DELETE policy for users table
-- Allows admins to delete users

-- RLS Policy for users DELETE
CREATE POLICY "Admins can delete users"
  ON public.users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

