import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  "https://dcxifkkjfyeudwensnb.supabase.co";

const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjeGlma2tqZmp5ZXVkd2Vuc25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTU2MDMsImV4cCI6MjA5NDc5MTYwM30.WrTXb4Gy9Mu2BmYY6IBabkqFbCO1T3TglHYZW-WEHgE";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
