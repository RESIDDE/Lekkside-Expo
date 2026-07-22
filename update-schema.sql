ALTER TABLE profiles ADD COLUMN IF NOT EXISTS university_name text;

ALTER TABLE booth_leads ADD COLUMN IF NOT EXISTS status text DEFAULT 'New';
ALTER TABLE booth_leads ADD COLUMN IF NOT EXISTS notes text;

CREATE TABLE IF NOT EXISTS meeting_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE,
  student_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  requested_time timestamptz NOT NULL,
  message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
