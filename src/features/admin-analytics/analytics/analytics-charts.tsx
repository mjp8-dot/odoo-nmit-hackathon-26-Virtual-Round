"use client"

import type { ReactNode } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { AnalyticsOverview } from "./get-analytics-overview"

interface AnalyticsChartsProps {
  overview: AnalyticsOverview
}

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

function ChartFrame({
  children,
  description,
  title,
}: {
  children: ReactNode
  description: string
  title: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-72">{children}</CardContent>
    </Card>
  )
}

export function AnalyticsCharts({ overview }: AnalyticsChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <ChartFrame
        description="Present and partial attendance across the last seven days."
        title="Attendance trend"
      >
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={overview.attendanceTrend}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} />
            <YAxis allowDecimals={false} tickLine={false} />
            <Tooltip />
            <Legend />
            <Line
              dataKey="attendanceRate"
              name="Attendance %"
              stroke="var(--chart-1)"
              strokeWidth={2}
              type="monotone"
            />
            <Line
              dataKey="remote"
              name="Remote"
              stroke="var(--chart-4)"
              strokeWidth={2}
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartFrame>

      <ChartFrame
        description="Leave requests grouped by request week and decision state."
        title="Leave trend"
      >
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={overview.leaveTrend}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} />
            <YAxis allowDecimals={false} tickLine={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="pending" fill="var(--chart-3)" name="Pending" stackId="a" />
            <Bar dataKey="approved" fill="var(--chart-2)" name="Approved" stackId="a" />
            <Bar dataKey="rejected" fill="var(--chart-5)" name="Rejected" stackId="a" />
            <Bar dataKey="cancelled" fill="var(--chart-4)" name="Cancelled" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>

      <ChartFrame
        description="Active and inactive workforce distribution by department."
        title="Workforce distribution"
      >
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={overview.departmentDistribution} layout="vertical">
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis allowDecimals={false} type="number" />
            <YAxis
              dataKey="name"
              tickLine={false}
              type="category"
              width={110}
            />
            <Tooltip />
            <Bar dataKey="value" fill="var(--chart-1)" name="Employees" />
          </BarChart>
        </ResponsiveContainer>
      </ChartFrame>

      <ChartFrame
        description="Default work mode mix for active employees."
        title="Work mode mix"
      >
        <ResponsiveContainer height="100%" width="100%">
          <PieChart>
            <Tooltip />
            <Legend />
            <Pie
              data={overview.workModeDistribution}
              dataKey="value"
              innerRadius={56}
              nameKey="name"
              outerRadius={92}
              paddingAngle={2}
            >
              {overview.workModeDistribution.map((entry, index) => (
                <Cell
                  fill={COLORS[index % COLORS.length]}
                  key={entry.name}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </ChartFrame>
    </div>
  )
}
