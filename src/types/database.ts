import type {
  ApprovalDecision,
  ApprovalEntityType,
  AttendanceStatus,
  EmploymentStatus,
  LeaveStatus,
  LeaveType,
  PayrollStatus,
  UserRole,
  WorkMode,
} from "./domain"

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type DepartmentRow = {
  id: string
  name: string
  code: string
  manager_id: string | null
  created_at: string
  updated_at: string
}

type ProfileRow = {
  id: string
  employee_code: string
  email: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  role: UserRole
  department_id: string | null
  designation: string
  manager_id: string | null
  joining_date: string
  employment_status: EmploymentStatus
  default_work_mode: WorkMode
  created_at: string
  updated_at: string
}

type AttendanceRow = {
  id: string
  employee_id: string
  work_date: string
  work_mode: WorkMode
  check_in_at: string | null
  check_out_at: string | null
  worked_minutes: number
  status: AttendanceStatus
  notes: string | null
  location: Json | null
  created_at: string
  updated_at: string
}

type LeaveRequestRow = {
  id: string
  employee_id: string
  leave_type: LeaveType
  start_date: string
  end_date: string
  day_count: number
  reason: string
  status: LeaveStatus
  reviewed_by: string | null
  reviewed_at: string | null
  review_note: string | null
  created_at: string
  updated_at: string
}

type PayrollRow = {
  id: string
  employee_id: string
  period_start: string
  period_end: string
  gross_pay_minor: number
  deductions_minor: number
  net_pay_minor: number
  currency: string
  status: PayrollStatus
  payslip_url: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

type ApprovalActionRow = {
  id: string
  entity_type: ApprovalEntityType
  entity_id: string
  actor_id: string
  decision: ApprovalDecision
  comment: string | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      departments: {
        Row: DepartmentRow
        Insert: Partial<DepartmentRow> & Pick<DepartmentRow, "name" | "code">
        Update: Partial<DepartmentRow>
        Relationships: []
      }
      profiles: {
        Row: ProfileRow
        Insert: Partial<ProfileRow> &
          Pick<
            ProfileRow,
            | "id"
            | "employee_code"
            | "email"
            | "full_name"
            | "designation"
            | "joining_date"
          >
        Update: Partial<ProfileRow>
        Relationships: []
      }
      attendance_records: {
        Row: AttendanceRow
        Insert: Partial<AttendanceRow> &
          Pick<
            AttendanceRow,
            "employee_id" | "work_date" | "work_mode" | "status"
          >
        Update: Partial<AttendanceRow>
        Relationships: []
      }
      leave_requests: {
        Row: LeaveRequestRow
        Insert: Partial<LeaveRequestRow> &
          Pick<
            LeaveRequestRow,
            | "employee_id"
            | "leave_type"
            | "start_date"
            | "end_date"
            | "day_count"
            | "reason"
          >
        Update: Partial<LeaveRequestRow>
        Relationships: []
      }
      payroll_records: {
        Row: PayrollRow
        Insert: Partial<PayrollRow> &
          Pick<
            PayrollRow,
            | "employee_id"
            | "period_start"
            | "period_end"
            | "gross_pay_minor"
            | "deductions_minor"
            | "net_pay_minor"
            | "currency"
          >
        Update: Partial<PayrollRow>
        Relationships: []
      }
      approval_actions: {
        Row: ApprovalActionRow
        Insert: Partial<ApprovalActionRow> &
          Pick<
            ApprovalActionRow,
            | "entity_type"
            | "entity_id"
            | "actor_id"
            | "decision"
          >
        Update: Partial<ApprovalActionRow>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: UserRole
      employment_status: EmploymentStatus
      work_mode: WorkMode
      attendance_status: AttendanceStatus
      leave_type: LeaveType
      leave_status: LeaveStatus
      payroll_status: PayrollStatus
      approval_entity_type: ApprovalEntityType
      approval_decision: ApprovalDecision
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Row"]

export type TablesInsert<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Insert"]

export type TablesUpdate<
  TableName extends keyof Database["public"]["Tables"],
> = Database["public"]["Tables"][TableName]["Update"]

