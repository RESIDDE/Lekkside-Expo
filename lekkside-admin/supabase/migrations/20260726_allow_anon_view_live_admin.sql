-- Allow anonymous users to view live admin profiles for the broadcast banner
CREATE POLICY "Public can view live admin profiles" 
  ON public.profiles FOR SELECT 
  TO anon
  USING (role = 'member' AND is_live = true);
