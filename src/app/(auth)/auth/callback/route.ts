import { type NextRequest, NextResponse } from "next/server"

import { getSafeRedirectPath } from "@/features/auth/redirects"
import { isSupabaseConfigured } from "@/lib/supabase/env"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const nextPath = getSafeRedirectPath(
    request.nextUrl.searchParams.get("next"),
  )

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(
      new URL("/sign-in?error=configuration", request.url),
    )
  }

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(nextPath, request.url))
    }
  }

  return NextResponse.redirect(new URL("/sign-in?error=callback", request.url))
}

