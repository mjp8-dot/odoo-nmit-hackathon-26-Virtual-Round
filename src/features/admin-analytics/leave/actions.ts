"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { reviewLeaveRequest } from "@/features/workforce/leave/actions"

/**
 * Thin FormData adapter around reviewLeaveRequest so the review controls in
 * leave-request-table.tsx can submit a plain progressive-enhancement
 * <form action={...}> without needing a client component. reviewLeaveRequest
 * itself already enforces hr/admin authorization (requireRole) and legal
 * state transitions — this wrapper does no additional validation, it only
 * reshapes the submitted fields into LeaveDecisionInput.
 *
 * Failed decisions redirect back with a safe message instead of appearing
 * to succeed. The workforce action remains the authorization, validation,
 * and persistence boundary.
 */
export async function reviewLeaveRequestFormAction(
  formData: FormData,
): Promise<void> {
  const leaveRequestId = String(formData.get("leaveRequestId") ?? "")
  const rawDecision = formData.get("decision")
  if (rawDecision !== "approved" && rawDecision !== "rejected") {
    redirect("/admin/leave?error=Choose+a+valid+leave+decision.")
  }
  const rawNote = formData.get("note")
  const note =
    typeof rawNote === "string" && rawNote.trim().length > 0
      ? rawNote.trim()
      : undefined

  if (!leaveRequestId) {
    redirect("/admin/leave?error=Leave+request+id+is+missing.")
  }

  const result = await reviewLeaveRequest({
    leaveRequestId,
    decision: rawDecision,
    note,
  })

  if (!result.ok) {
    redirect(`/admin/leave?error=${encodeURIComponent(result.error.message)}`)
  }

  revalidatePath("/admin/leave")
}
