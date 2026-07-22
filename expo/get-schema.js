import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = fs.readFileSync(path.join(__dirname, '../lekkside-admin/.env'), 'utf-8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const supabaseKey = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/)[1];

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: columns, error } = await supabase.rpc('get_columns', { table_name: 'booth_leads' });
  if (error) {
    console.log('RPC failed, trying generic query...');
    // We can't query information_schema directly from supabase-js unless it's exposed. 
    // Just try inserting a bad row to get columns in error maybe, or fetch a row using an empty table.
    // wait, we can just do a REST query with headers: Prefer: return=representation
    const { data, error: err2 } = await supabase.from('booth_leads').select('*').limit(0);
    console.log('booth_leads columns via empty array (no help usually):', data);
    
    // Actually let me query using the admin CLI if possible, or I can guess based on LeadScanner.tsx
  } else {
    console.log(columns);
  }
}
run();
