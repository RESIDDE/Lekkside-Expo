import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('/Users/samswift/Documents/Development/React/Lekkside-Expo/lekkside-admin/.env', 'utf-8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const supabaseKey = env.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.*)/);
const key = supabaseKey ? supabaseKey[1] : env.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1];

const supabase = createClient(supabaseUrl, key);

async function run() {
  const { data: apps, error: fetchErr } = await supabase.from('university_applications').select('*');
  console.log("All applications length:", apps ? apps.length : 0);
  console.log("Fetch err:", fetchErr);
}
run();
