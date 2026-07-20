import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('/Users/samswift/Documents/Development/React/Lekkside-Expo/lekkside-admin/.env', 'utf-8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const supabaseKey = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('university_applications')
    .select('*, student:profiles!university_applications_student_id_fkey(full_name), university:profiles!university_applications_university_id_fkey(full_name, university_name)')
    .order('created_at', { ascending: false });
  console.log("Data:", data);
  console.log("Error:", error);
}
run();
