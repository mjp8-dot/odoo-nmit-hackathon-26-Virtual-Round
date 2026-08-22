export function getSafeRedirectPath(
  candidate: string | null | undefined,
  fallback = "/",
) {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback
  }

  return candidate
}

