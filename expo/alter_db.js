import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('../lekkside-admin/.env', 'utf-8');
const env = Object.fromEntries(
  envContent.split('\n').filter(line => line && !line.startsWith('#'))
    .map(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) return [match[1].trim(), match[2].trim().replace(/^["']|["']$/g, '')];
      return [];
    })
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function checkProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log(data);
}

checkProfiles();
