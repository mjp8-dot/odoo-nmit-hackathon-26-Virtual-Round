"use client"

import {
  CalendarCheck,
  Clock,
  LayoutDashboard,
  Users,
  Wallet,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/employees", label: "Employees", icon: Users },
  { href: "/admin/attendance", label: "Attendance", icon: Clock },
  { href: "/admin/leave", label: "Leave requests", icon: CalendarCheck },
  { href: "/admin/payroll", label: "Payroll", icon: Wallet },
] as const

/**
 * Persistent admin navigation. Client component only so it can highlight
 * the active route with usePathname — it renders no data of its own and
 * carries no authorization logic (that lives server-side in the layout's
 * requireRole call).
 */
export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(`${item.href}/`)

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
