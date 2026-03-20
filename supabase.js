import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://ipfarkclogesomyvzknv.supabase.co";
const supabaseKey = "sb_publishable_qirvbDjAUPFMCOR0orzixg_E784q5Hd";

export const supabase = createClient(supabaseUrl, supabaseKey);