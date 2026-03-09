-- Create broadcasts table
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sending, sent, failed
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create broadcast_logs table for individual recipient tracking
CREATE TABLE IF NOT EXISTS public.broadcast_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID NOT NULL REFERENCES public.broadcasts(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed, opened, clicked
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for broadcasts
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view own broadcasts" 
  ON public.broadcasts FOR SELECT TO authenticated
  USING (event_id IN (SELECT id FROM events WHERE created_by = auth.uid()));

CREATE POLICY "Authenticated users can create broadcasts" 
  ON public.broadcasts FOR INSERT TO authenticated
  WITH CHECK (event_id IN (SELECT id FROM events WHERE created_by = auth.uid()));

CREATE POLICY "Authenticated users can update own broadcasts" 
  ON public.broadcasts FOR UPDATE TO authenticated
  USING (event_id IN (SELECT id FROM events WHERE created_by = auth.uid()))
  WITH CHECK (event_id IN (SELECT id FROM events WHERE created_by = auth.uid()));

CREATE POLICY "Authenticated users can delete own broadcasts" 
  ON public.broadcasts FOR DELETE TO authenticated
  USING (event_id IN (SELECT id FROM events WHERE created_by = auth.uid()));

-- Add RLS policies for broadcast_logs
ALTER TABLE public.broadcast_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view own broadcast logs" 
  ON public.broadcast_logs FOR SELECT TO authenticated
  USING (broadcast_id IN (SELECT id FROM broadcasts WHERE event_id IN (SELECT id FROM events WHERE created_by = auth.uid())));

-- Allow the tracking function (which might be called publicly via pixel) to update logs?
-- Actually, the tracking function runs on the server side (Edge Function) with service role key, so it bypasses RLS.
-- But we need to allow public access for tracking pixel if we implement it directly via SQL (which we won't).
-- So standard authenticated policies are fine for the dashboard.
