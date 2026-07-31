-- Add is_active column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add RLS policy for admins to UPDATE profiles
CREATE POLICY "Admins can update all profiles" 
  ON public.profiles FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'member')
    )
  );

-- Add RLS policy for admins to DELETE profiles
CREATE POLICY "Admins can delete all profiles" 
  ON public.profiles FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.user_id = auth.uid() AND p.role IN ('admin', 'member')
    )
  );
