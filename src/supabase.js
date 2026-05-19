import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dcxifkkjfyeudwensnb.supabase.co";

const supabaseKey =
  "PLAK_HIER_VOLLEDIGE_ANON_KEY";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
