-- Allow anonymous users to view active university profiles
CREATE POLICY "Public can view active university profiles" 
  ON public.profiles FOR SELECT 
  TO anon
  USING (role = 'university' AND is_active = true);

-- Allow anonymous users to view exhibition booths
CREATE POLICY "Public can view exhibition booths"
  ON public.exhibition_booths FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to view exhibitors
CREATE POLICY "Public can view exhibitors"
  ON public.exhibitors FOR SELECT
  TO anon
  USING (true);
