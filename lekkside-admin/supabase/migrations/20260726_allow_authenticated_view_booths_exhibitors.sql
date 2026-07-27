-- Allow authenticated users to view all exhibition booths
CREATE POLICY "Authenticated users can view exhibition booths"
  ON public.exhibition_booths FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to view all exhibitors
CREATE POLICY "Authenticated users can view exhibitors"
  ON public.exhibitors FOR SELECT
  TO authenticated
  USING (true);
