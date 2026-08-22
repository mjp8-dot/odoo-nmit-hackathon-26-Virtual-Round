import "server-only"

import { z } from "zod"

import { WORK_MODES } from "@/types/domain"

const geoPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().nonnegative().optional(),
  label: z.string().max(200).optional(),
})

export const checkInSchema = z.object({
  workMode: z.enum(WORK_MODES),
  occurredAt: z.iso.datetime({ offset: true }).optional(),
  location: geoPointSchema.optional(),
  notes: z.string().max(2000).optional(),
})

export const checkOutSchema = z.object({
  attendanceId: z.uuid(),
  occurredAt: z.iso.datetime({ offset: true }).optional(),
  location: geoPointSchema.optional(),
})

export type CheckInParsedInput = z.infer<typeof checkInSchema>
export type CheckOutParsedInput = z.infer<typeof checkOutSchema>
