import type { ISODateTime, UUID } from "./common"

export const APPROVAL_ENTITY_TYPES = [
  "leave_request",
  "attendance_adjustment",
  "profile_change",
] as const

export const APPROVAL_DECISIONS = ["approved", "rejected"] as const

export type ApprovalEntityType = (typeof APPROVAL_ENTITY_TYPES)[number]
export type ApprovalDecision = (typeof APPROVAL_DECISIONS)[number]

export interface ApprovalAction {
  id: UUID
  entityType: ApprovalEntityType
  entityId: UUID
  actorId: UUID
  decision: ApprovalDecision
  comment: string | null
  createdAt: ISODateTime
}

