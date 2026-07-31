import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
// actually, anon key won't let us see policies. We need to query Postgres directly or check schema.
// or we can just try it with the service role key.
// But wait, what if I just execute sql on the supabase-mcp-server?
