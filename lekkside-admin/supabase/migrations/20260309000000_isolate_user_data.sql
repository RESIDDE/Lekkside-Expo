-- Events table policies
DROP POLICY IF EXISTS "Authenticated users can view all events" ON public.events;

CREATE POLICY "Authenticated users can view own events" 
  ON public.events FOR SELECT TO authenticated
  USING (created_by = auth.uid());

-- Guests table policies
DROP POLICY IF EXISTS "Authenticated users can view all guests" ON public.guests;

CREATE POLICY "Authenticated users can view own guests" 
  ON public.guests FOR SELECT TO authenticated
  USING (event_id IN (SELECT id FROM events WHERE created_by = auth.uid()));

-- Checkin Stations table policies
DROP POLICY IF EXISTS "Authenticated users can view all stations" ON public.checkin_stations;
DROP POLICY IF EXISTS "Authenticated users can create stations" ON public.checkin_stations;
DROP POLICY IF EXISTS "Authenticated users can update stations" ON public.checkin_stations;
DROP POLICY IF EXISTS "Authenticated users can delete stations" ON public.checkin_stations;

CREATE POLICY "Authenticated users can view own stations" 
  ON public.checkin_stations FOR SELECT TO authenticated
  USING (event_id IN (SELECT id FROM events WHERE created_by = auth.uid()));

CREATE POLICY "Authenticated users can create stations" 
  ON public.checkin_stations FOR INSERT TO authenticated
  WITH CHECK (event_id IN (SELECT id FROM events WHERE created_by = auth.uid()));

CREATE POLICY "Authenticated users can update stations" 
  ON public.checkin_stations FOR UPDATE TO authenticated
  USING (event_id IN (SELECT id FROM events WHERE created_by = auth.uid()))
  WITH CHECK (event_id IN (SELECT id FROM events WHERE created_by = auth.uid()));

CREATE POLICY "Authenticated users can delete stations" 
  ON public.checkin_stations FOR DELETE TO authenticated
  USING (event_id IN (SELECT id FROM events WHERE created_by = auth.uid()));

-- Event Forms table policies
DROP POLICY IF EXISTS "Authenticated users can view forms" ON public.event_forms;
DROP POLICY IF EXISTS "Authenticated users can create forms" ON public.event_forms;
DROP POLICY IF EXISTS "Authenticated users can update forms" ON public.event_forms;
DROP POLICY IF EXISTS "Authenticated users can delete forms" ON public.event_forms;

CREATE POLICY "Authenticated users can view own forms" 
  ON public.event_forms FOR SELECT TO authenticated
  USING (event_id IN (SELECT id FROM events WHERE created_by = auth.uid()));

CREATE POLICY "Authenticated users can create forms" 
  ON public.event_forms FOR INSERT TO authenticated
  WITH CHECK (event_id IN (SELECT id FROM events WHERE created_by = auth.uid()));

CREATE POLICY "Authenticated users can update forms" 
  ON public.event_forms FOR UPDATE TO authenticated
  USING (event_id IN (SELECT id FROM events WHERE created_by = auth.uid()))
  WITH CHECK (event_id IN (SELECT id FROM events WHERE created_by = auth.uid()));

CREATE POLICY "Authenticated users can delete forms" 
  ON public.event_forms FOR DELETE TO authenticated
  USING (event_id IN (SELECT id FROM events WHERE created_by = auth.uid()));
