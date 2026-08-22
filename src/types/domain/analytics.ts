import type { DateRange } from "./common"

export interface AnalyticsQuery {
  range: DateRange
  departmentId?: string
}

export interface WorkforceSnapshot {
  totalEmployees: number
  activeEmployees: number
  presentToday: number
  remoteToday: number
  onLeaveToday: number
  pendingApprovals: number
  attendanceRate: number
}

export interface MetricPoint {
  label: string
  value: number
}

