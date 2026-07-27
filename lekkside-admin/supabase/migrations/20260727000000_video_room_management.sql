-- Add video_access_enabled to profiles
ALTER TABLE public.profiles ADD COLUMN video_access_enabled BOOLEAN DEFAULT false;

-- Create system_settings table
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_rooms_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read settings
CREATE POLICY "Authenticated users can read system_settings"
  ON public.system_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to update settings (assume admin can update)
CREATE POLICY "Authenticated users can update system_settings"
  ON public.system_settings FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert system_settings"
  ON public.system_settings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Add initial row
INSERT INTO public.system_settings (video_rooms_enabled) VALUES (false);
