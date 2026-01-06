import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  // During build time without env vars, return a dummy client
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase credentials not found. Using placeholder client.")
    // Return a minimal client that won't crash during SSR/build
    return createBrowserClient("https://placeholder.supabase.co", "placeholder-key")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
