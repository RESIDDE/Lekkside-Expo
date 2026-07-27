import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../lekkside-admin/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: booths, error: boothError } = await supabase
    .from('exhibition_booths')
    .select('id');
  console.log('Booths without auth:', booths?.length, boothError);

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'university')
    .eq('is_active', true);
  console.log('Profiles without auth:', profiles?.length, profileError);
}
test();
