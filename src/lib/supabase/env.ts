export interface SupabaseEnvironment {
  url: string
  publishableKey: string
}

function readSupabaseEnvironment(): Partial<SupabaseEnvironment> {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
}

export function isSupabaseConfigured(): boolean {
  const environment = readSupabaseEnvironment()

  return Boolean(environment.url && environment.publishableKey)
}

export function getSupabaseEnvironment(): SupabaseEnvironment {
  const environment = readSupabaseEnvironment()

  if (!environment.url || !environment.publishableKey) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and add the project URL and publishable key.",
    )
  }

  return {
    url: environment.url,
    publishableKey: environment.publishableKey,
  }
}

