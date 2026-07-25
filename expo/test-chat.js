require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('chat_conversations').insert({
      university_id: '00000000-0000-0000-0000-000000000000',
      student_id: '00000000-0000-0000-0000-000000000000',
      student_name: 'Test',
      student_email: 'test@test.com',
      last_message: 'test',
      last_message_at: new Date().toISOString()
  });
  console.log("Error:", error);
}
run();
