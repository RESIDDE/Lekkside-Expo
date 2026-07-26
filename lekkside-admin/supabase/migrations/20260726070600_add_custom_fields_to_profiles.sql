-- Add custom_fields to profiles to hold student registration data
ALTER TABLE public.profiles ADD COLUMN custom_fields JSONB DEFAULT '{}'::jsonb;
