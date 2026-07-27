import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('../lekkside-admin/.env', 'utf-8');
const env = Object.fromEntries(
  envContent.split('\n').filter(line => line && !line.startsWith('#')).map(line => line.split('='))
);

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_PUBLISHABLE_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPolicies() {
  const query = `
    DROP POLICY IF EXISTS "Students can update their own applications" ON university_applications;
    CREATE POLICY "Students can update their own applications" 
    ON university_applications 
    FOR UPDATE 
    USING (auth.uid() = student_id);
  `;
  const { error } = await supabase.rpc('exec_sql', { query });
  if (error) {
    console.error('Error fixing policies:', error);
  } else {
    console.log('Successfully fixed policies.');
  }
}

fixPolicies();
