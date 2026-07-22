-- Allow universities to view all student screenings
CREATE POLICY "Universities can view all student screenings"
ON student_screenings
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid() AND profiles.role = 'university'
  )
);
