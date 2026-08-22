"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { isSupabaseConfigured } from "@/lib/supabase/env"
import { createServerSupabaseClient } from "@/lib/supabase/server"

import { getSafeRedirectPath } from "./redirects"
import type { SignInActionState } from "./types"

const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
  next: z.string().optional(),
})

export async function signIn(
  _previousState: SignInActionState,
  formData: FormData,
): Promise<SignInActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  })

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message:
        "Authentication is not configured yet. Add the Supabase values from .env.example.",
    }
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    return {
      status: "error",
      message: "The email or password is incorrect.",
    }
  }

  redirect(getSafeRedirectPath(parsed.data.next))
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.signOut()
  }

  redirect("/sign-in")
}

