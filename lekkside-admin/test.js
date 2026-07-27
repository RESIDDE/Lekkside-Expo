import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('/Users/samswift/Documents/Development/React/Lekkside-Expo/lekkside-admin/.env', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length > 0) {
    env[key.trim()] = value.join('=').trim().replace(/['"]/g, '');
  }
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_PUBLISHABLE_KEY']);

async function main() {
  const { data: existing } = await supabase.from('system_settings').select('*');
  if (existing && existing.length === 0) {
    console.log('Inserting row...');
    const { data, error } = await supabase.from('system_settings').insert([{ video_rooms_enabled: true }]).select('*');
    console.log('Insert:', data, error);
  } else {
    console.log('Row exists:', existing);
  }
}
main();
