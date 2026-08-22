import { Lightbulb } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface HrInsightListProps {
  insights: string[]
}

export function HrInsightList({ insights }: HrInsightListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>HR insights</CardTitle>
        <CardDescription>
          Deterministic workforce signals generated from current HRMS data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {insights.map((insight) => (
            <li
              className="flex gap-3 rounded-lg border border-border bg-muted/30 p-3"
              key={insight}
            >
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="text-sm leading-6">{insight}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
