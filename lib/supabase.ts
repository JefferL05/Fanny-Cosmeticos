import { createClient } from "@supabase/supabase-js";

// Publishable credentials identify the project; RLS enforces access in the database.
// Deployment defaults keep static exports reproducible. Override for another project.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ylcoubtyvfnoqmwkkmcn.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_nlTrjLvNQJu3LuxHJ1v_gA__mqgB284",
);
