import { createClient } from '@supabase/supabase-js';

// Test seam: an end-to-end harness may publish a Supabase configuration on
// `window` before the app boots so the "Supabase is configured" code path can
// be exercised deterministically without build-time environment variables or
// real credentials. Production loads stay on `import.meta.env`.
const runtimeConfig = typeof window !== 'undefined' ? window.__SUPABASE_RUNTIME_CONFIG__ : null;

const url = runtimeConfig?.url ?? import.meta.env.VITE_SUPABASE_URL;
const key = runtimeConfig?.key ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

// null when neither a runtime override nor env vars are configured
// — callers must guard against this
export const supabase = url && key ? createClient(url, key) : null;
