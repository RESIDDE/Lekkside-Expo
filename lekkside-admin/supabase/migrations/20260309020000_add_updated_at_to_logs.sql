-- Add updated_at to broadcast_logs
ALTER TABLE public.broadcast_logs 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
