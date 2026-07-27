-- Add status column to chat_conversations
ALTER TABLE public.chat_conversations 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
