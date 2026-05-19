import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dcxifkkjfyeudwensnb.supabase.co";

const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
