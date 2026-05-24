/**
 * Global Supabase configuration.
 * Reads credentials from Vite environment variables.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in environment."
  );
}

export const SUPABASE_CONFIG = {
  url: supabaseUrl,
  publishableKey: supabasePublishableKey,
} as const;
