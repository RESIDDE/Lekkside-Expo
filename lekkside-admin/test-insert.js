import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('/Users/samswift/Documents/Development/React/Lekkside-Expo/lekkside-admin/.env', 'utf-8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const supabaseKey = env.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const key = supabaseKey ? supabaseKey[1] : env.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1];

const supabase = createClient(supabaseUrl, key);

async function run() {
  const { data: profiles } = await supabase.from('profiles').select('user_id').limit(2);
  if (profiles && profiles.length >= 2) {
    const { error } = await supabase.from('university_applications').insert({
        student_id: profiles[0].user_id,
        university_id: profiles[1].user_id,
        program_name: 'Test Program',
        status: 'draft',
        payment_status: 'pending'
    });
    console.log("Insert Error:", error);
  } else {
    console.log("Not enough profiles to test insert");
  }
}
run();
