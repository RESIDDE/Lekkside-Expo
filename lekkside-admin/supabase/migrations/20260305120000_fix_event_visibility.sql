-- Restore authenticated access to events (allow all logged-in users to see all events)
DROP POLICY IF EXISTS "Event owners can view events" ON public.events;

CREATE POLICY "Authenticated users can view all events" 
  ON public.events FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Restore authenticated access to guests (allow all logged-in users to see all guests)
DROP POLICY IF EXISTS "Event owners can view guests" ON public.guests;

CREATE POLICY "Authenticated users can view all guests" 
  ON public.guests FOR SELECT 
  USING (auth.uid() IS NOT NULL);
