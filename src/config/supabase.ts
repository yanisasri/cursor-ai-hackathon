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

/**
 * Agent debug logging configuration (local-only runtime instrumentation).
 * Not related to Supabase credentials.
 */
export const DEBUG_CONFIG = {
  endpoint:
    import.meta.env.VITE_AGENT_DEBUG_ENDPOINT ??
    "http://127.0.0.1:7428/ingest/46843c5a-56c0-4390-abc6-7ddd29f3315e",
  sessionId: import.meta.env.VITE_AGENT_DEBUG_SESSION_ID ?? "ca7e84",
} as const;
