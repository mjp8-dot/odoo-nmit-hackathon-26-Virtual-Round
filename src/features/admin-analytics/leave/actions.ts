"use server"

import { reviewLeaveRequest } from "@/features/workforce/leave/actions"

/**
 * Thin FormData adapter around reviewLeaveRequest so the review controls in
 * leave-request-table.tsx can submit a plain progressive-enhancement
 * <form action={...}> without needing a client component. reviewLeaveRequest
 * itself already enforces hr/admin authorization (requireRole) and legal
 * state transitions — this wrapper does no additional validation, it only
 * reshapes the submitted fields into LeaveDecisionInput.
 *
 * Errors (not found / already decided / forbidden) are intentionally
 * swallowed here: the row simply re-renders with whatever status the
 * request actually ended up in once the form action's built-in page
 * refresh completes, which keeps this admin-analytics-owned surface small
 * and self-contained.
 */
export async function reviewLeaveRequestFormAction(
  formData: FormData,
): Promise<void> {
  const leaveRequestId = String(formData.get("leaveRequestId") ?? "")
  const rawDecision = formData.get("decision")
  const decision = rawDecision === "approved" ? "approved" : "rejected"
  const rawNote = formData.get("note")
  const note =
    typeof rawNote === "string" && rawNote.trim().length > 0
      ? rawNote.trim()
      : undefined

  if (!leaveRequestId) {
    return
  }

  await reviewLeaveRequest({ leaveRequestId, decision, note })
}
