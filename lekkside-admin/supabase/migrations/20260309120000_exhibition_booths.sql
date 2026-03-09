-- Create exhibition_booths table
CREATE TABLE public.exhibition_booths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  booth_number TEXT NOT NULL,
  booth_name TEXT NOT NULL,
  company_name TEXT,
  description TEXT,
  invitation_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, booth_number)
);

-- Create exhibitors table (users who manage booths)
CREATE TABLE public.exhibitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  booth_id UUID NOT NULL REFERENCES public.exhibition_booths(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_position TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create booth_leads table (tracks which guests are leads for which booths)
CREATE TABLE public.booth_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booth_id UUID NOT NULL REFERENCES public.exhibition_booths(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  is_relevant BOOLEAN NOT NULL DEFAULT false,
  lead_score INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(booth_id, guest_id)
);

-- Create lead_notes table (notes on specific leads)
CREATE TABLE public.lead_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booth_lead_id UUID NOT NULL REFERENCES public.booth_leads(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.exhibition_booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exhibitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booth_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exhibition_booths
-- Admins can view all booths
CREATE POLICY "Admins can view all exhibition booths" 
  ON public.exhibition_booths FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'member')
    )
  );

-- Exhibitors can view their own booths
CREATE POLICY "Exhibitors can view their booths" 
  ON public.exhibition_booths FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.exhibitors 
      WHERE exhibitors.booth_id = exhibition_booths.id 
      AND exhibitors.user_id = auth.uid()
    )
  );

-- Admins can create booths
CREATE POLICY "Admins can create exhibition booths" 
  ON public.exhibition_booths FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'member')
    )
  );

-- Admins can update booths
CREATE POLICY "Admins can update exhibition booths" 
  ON public.exhibition_booths FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'member')
    )
  );

-- Admins can delete booths
CREATE POLICY "Admins can delete exhibition booths" 
  ON public.exhibition_booths FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'member')
    )
  );

-- RLS Policies for exhibitors
-- Admins can view all exhibitors
CREATE POLICY "Admins can view all exhibitors" 
  ON public.exhibitors FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'member')
    )
  );

-- Exhibitors can view themselves
CREATE POLICY "Exhibitors can view their own profile" 
  ON public.exhibitors FOR SELECT 
  USING (user_id = auth.uid());

-- Admins can create exhibitors
CREATE POLICY "Admins can create exhibitors" 
  ON public.exhibitors FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'member')
    )
  );

-- Allow exhibitor signup via invitation
CREATE POLICY "Users can create exhibitor profile with valid token" 
  ON public.exhibitors FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exhibition_booths 
      WHERE exhibition_booths.id = booth_id 
      AND exhibition_booths.is_active = true
    )
  );

-- Exhibitors can update their own profile
CREATE POLICY "Exhibitors can update their own profile" 
  ON public.exhibitors FOR UPDATE 
  USING (user_id = auth.uid());

-- RLS Policies for booth_leads
-- Exhibitors can view leads for their booths
CREATE POLICY "Exhibitors can view their booth leads" 
  ON public.booth_leads FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.exhibitors 
      WHERE exhibitors.booth_id = booth_leads.booth_id 
      AND exhibitors.user_id = auth.uid()
    )
  );

-- Admins can view all leads
CREATE POLICY "Admins can view all booth leads" 
  ON public.booth_leads FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'member')
    )
  );

-- Exhibitors can create leads for their booths
CREATE POLICY "Exhibitors can create leads for their booths" 
  ON public.booth_leads FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exhibitors 
      WHERE exhibitors.booth_id = booth_leads.booth_id 
      AND exhibitors.user_id = auth.uid()
    )
  );

-- Exhibitors can update leads for their booths
CREATE POLICY "Exhibitors can update their booth leads" 
  ON public.booth_leads FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.exhibitors 
      WHERE exhibitors.booth_id = booth_leads.booth_id 
      AND exhibitors.user_id = auth.uid()
    )
  );

-- Exhibitors can delete leads for their booths
CREATE POLICY "Exhibitors can delete their booth leads" 
  ON public.booth_leads FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.exhibitors 
      WHERE exhibitors.booth_id = booth_leads.booth_id 
      AND exhibitors.user_id = auth.uid()
    )
  );

-- RLS Policies for lead_notes
-- Exhibitors can view notes for their booth leads
CREATE POLICY "Exhibitors can view notes for their booth leads" 
  ON public.lead_notes FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.booth_leads 
      JOIN public.exhibitors ON exhibitors.booth_id = booth_leads.booth_id
      WHERE booth_leads.id = lead_notes.booth_lead_id 
      AND exhibitors.user_id = auth.uid()
    )
  );

-- Admins can view all notes
CREATE POLICY "Admins can view all lead notes" 
  ON public.lead_notes FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('admin', 'member')
    )
  );

-- Exhibitors can create notes for their booth leads
CREATE POLICY "Exhibitors can create notes for their booth leads" 
  ON public.lead_notes FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.booth_leads 
      JOIN public.exhibitors ON exhibitors.booth_id = booth_leads.booth_id
      WHERE booth_leads.id = lead_notes.booth_lead_id 
      AND exhibitors.user_id = auth.uid()
    )
  );

-- Exhibitors can update their own notes
CREATE POLICY "Exhibitors can update their own notes" 
  ON public.lead_notes FOR UPDATE 
  USING (created_by = auth.uid());

-- Exhibitors can delete their own notes
CREATE POLICY "Exhibitors can delete their own notes" 
  ON public.lead_notes FOR DELETE 
  USING (created_by = auth.uid());

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_exhibition_booths_updated_at
  BEFORE UPDATE ON public.exhibition_booths
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exhibitors_updated_at
  BEFORE UPDATE ON public.exhibitors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_booth_leads_updated_at
  BEFORE UPDATE ON public.booth_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lead_notes_updated_at
  BEFORE UPDATE ON public.lead_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_exhibition_booths_event_id ON public.exhibition_booths(event_id);
CREATE INDEX idx_exhibition_booths_invitation_token ON public.exhibition_booths(invitation_token);
CREATE INDEX idx_exhibitors_user_id ON public.exhibitors(user_id);
CREATE INDEX idx_exhibitors_booth_id ON public.exhibitors(booth_id);
CREATE INDEX idx_booth_leads_booth_id ON public.booth_leads(booth_id);
CREATE INDEX idx_booth_leads_guest_id ON public.booth_leads(guest_id);
CREATE INDEX idx_booth_leads_is_relevant ON public.booth_leads(is_relevant);
CREATE INDEX idx_lead_notes_booth_lead_id ON public.lead_notes(booth_lead_id);

-- Create function to get booth attendees with lead status
CREATE OR REPLACE FUNCTION public.get_booth_attendees(p_booth_id UUID)
RETURNS TABLE (
  guest_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  ticket_type TEXT,
  checked_in BOOLEAN,
  is_lead BOOLEAN,
  is_relevant BOOLEAN,
  lead_score INTEGER,
  tags TEXT[],
  notes_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id as guest_id,
    g.first_name,
    g.last_name,
    g.email,
    g.phone,
    g.ticket_type,
    g.checked_in,
    (bl.id IS NOT NULL) as is_lead,
    COALESCE(bl.is_relevant, false) as is_relevant,
    COALESCE(bl.lead_score, 0) as lead_score,
    COALESCE(bl.tags, '{}') as tags,
    COALESCE(
      (SELECT COUNT(*) FROM public.lead_notes WHERE booth_lead_id = bl.id),
      0
    ) as notes_count
  FROM public.guests g
  JOIN public.exhibition_booths eb ON eb.id = p_booth_id
  LEFT JOIN public.booth_leads bl ON bl.guest_id = g.id AND bl.booth_id = p_booth_id
  WHERE g.event_id = eb.event_id
  ORDER BY bl.is_relevant DESC NULLS LAST, g.last_name, g.first_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable realtime for booth_leads and lead_notes
ALTER PUBLICATION supabase_realtime ADD TABLE public.booth_leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lead_notes;
