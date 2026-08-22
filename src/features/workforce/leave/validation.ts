import "server-only"

import { z } from "zod"

import { LEAVE_TYPES } from "@/types/domain"

export const submitLeaveRequestSchema = z
  .object({
    leaveType: z.enum(LEAVE_TYPES, {
      error: "Choose a valid leave type.",
    }),
    startDate: z.iso.date("Enter a valid start date."),
    endDate: z.iso.date("Enter a valid end date."),
    reason: z
      .string()
      .trim()
      .min(3, "Reason must be at least 3 characters."),
  })
  .refine((value) => value.startDate <= value.endDate, {
    message: "Start date must be on or before the end date.",
    path: ["endDate"],
  })

export type SubmitLeaveRequestInput = z.infer<typeof submitLeaveRequestSchema>

export const reviewLeaveRequestSchema = z.object({
  leaveRequestId: z.uuid("Enter a valid leave request id."),
  decision: z.enum(["approved", "rejected"], {
    error: "Decision must be approved or rejected.",
  }),
  note: z
    .string()
    .trim()
    .max(2000, "Note must be 2000 characters or fewer.")
    .optional(),
})

export type ReviewLeaveRequestInput = z.infer<typeof reviewLeaveRequestSchema>

export const cancelLeaveRequestSchema = z.uuid(
  "Enter a valid leave request id.",
)
