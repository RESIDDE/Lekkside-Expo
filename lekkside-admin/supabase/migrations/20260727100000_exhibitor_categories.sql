-- Add institution_type to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS institution_type text DEFAULT 'University';

-- Ensure chat_conversations CASCADE on university deletion
ALTER TABLE public.chat_conversations
DROP CONSTRAINT IF EXISTS chat_conversations_university_id_fkey,
ADD CONSTRAINT chat_conversations_university_id_fkey
FOREIGN KEY (university_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Ensure chat_conversations CASCADE on student deletion
ALTER TABLE public.chat_conversations
DROP CONSTRAINT IF EXISTS chat_conversations_student_id_fkey,
ADD CONSTRAINT chat_conversations_student_id_fkey
FOREIGN KEY (student_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Ensure chat_messages CASCADE on sender deletion
ALTER TABLE public.chat_messages
DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey,
ADD CONSTRAINT chat_messages_sender_id_fkey
FOREIGN KEY (sender_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
