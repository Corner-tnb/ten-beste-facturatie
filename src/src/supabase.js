import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dcxifkkjfyeudwensnb.supabase.co";

const supabaseKey =
  "HIER_JOUW_ANON_KEY_PLAKKEN";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
