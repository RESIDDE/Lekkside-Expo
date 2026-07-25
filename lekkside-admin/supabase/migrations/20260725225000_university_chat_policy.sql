-- Add policy to allow universities to initiate conversations
CREATE POLICY "Universities can create conversations" 
ON chat_conversations 
FOR INSERT 
TO public 
WITH CHECK (auth.uid() = university_id);
