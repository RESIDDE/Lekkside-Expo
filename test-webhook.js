const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'lekkside-admin/.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
async function run() {
  const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(5);
  console.log(data, error);
}
run();
