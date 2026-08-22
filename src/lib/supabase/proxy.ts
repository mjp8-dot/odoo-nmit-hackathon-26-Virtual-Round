import { createServerClient } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

import type { Database } from "@/types/database"

import { getSupabaseEnvironment, isSupabaseConfigured } from "./env"

const PROTECTED_ROUTE_PREFIXES = ["/employee", "/admin", "/dashboard"]
const AUTH_ROUTE_PREFIXES = ["/sign-in"]

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  )
}

export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  if (!isSupabaseConfigured()) {
    return response
  }

  const { url, publishableKey } = getSupabaseEnvironment()
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })

        response = NextResponse.next({ request })

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  const pathname = request.nextUrl.pathname
  const isProtectedRoute = matchesPrefix(pathname, PROTECTED_ROUTE_PREFIXES)
  const isAuthRoute = matchesPrefix(pathname, AUTH_ROUTE_PREFIXES)

  if (!claims?.sub && isProtectedRoute) {
    const signInUrl = new URL("/sign-in", request.url)
    signInUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(signInUrl)
  }

  if (claims?.sub && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return response
}

