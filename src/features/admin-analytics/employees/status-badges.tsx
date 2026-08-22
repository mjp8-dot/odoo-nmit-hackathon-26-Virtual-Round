import { Building2, Home, Shuffle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { EmploymentStatus, WorkMode } from "@/types/domain"

const EMPLOYMENT_STATUS_LABEL: Record<EmploymentStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  on_leave: "On leave",
  terminated: "Terminated",
}

const EMPLOYMENT_STATUS_VARIANT: Record<
  EmploymentStatus,
  "secondary" | "outline" | "destructive"
> = {
  active: "secondary",
  inactive: "outline",
  on_leave: "outline",
  terminated: "destructive",
}

export function EmploymentStatusBadge({ status }: { status: EmploymentStatus }) {
  return (
    <Badge variant={EMPLOYMENT_STATUS_VARIANT[status]}>
      {EMPLOYMENT_STATUS_LABEL[status]}
    </Badge>
  )
}

const WORK_MODE_LABEL: Record<WorkMode, string> = {
  office: "Office",
  remote: "Remote",
  hybrid: "Hybrid",
}

const WORK_MODE_ICON: Record<WorkMode, typeof Building2> = {
  office: Building2,
  remote: Home,
  hybrid: Shuffle,
}

export function WorkModeBadge({ mode }: { mode: WorkMode }) {
  const Icon = WORK_MODE_ICON[mode]

  return (
    <Badge variant="outline">
      <Icon />
      {WORK_MODE_LABEL[mode]}
    </Badge>
  )
}
