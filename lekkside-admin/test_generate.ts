import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/std@0.190.0/dotenv/load.ts";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

async function run() {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: 'new_test_user_777@lekkside.com'
  });
  console.log("generateLink for new:", data?.user?.id, error);
}

run();
