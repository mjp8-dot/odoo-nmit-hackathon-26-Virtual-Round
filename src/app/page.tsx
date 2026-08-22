import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Database,
  GitBranch,
  ShieldCheck,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { isSupabaseConfigured } from "@/lib/supabase/env"

const modules = [
  {
    owner: "Laptop 2",
    title: "Employee experience",
    description:
      "Employee dashboard, profile, attendance, leave, and payroll presentation.",
    icon: BriefcaseBusiness,
  },
  {
    owner: "Laptop 3",
    title: "Workforce operations",
    description:
      "Attendance, leave, payroll, database operations, migrations, and RLS.",
    icon: Database,
  },
  {
    owner: "Laptop 4",
    title: "HR and analytics",
    description:
      "Admin dashboard, employee management, approvals, and workforce insights.",
    icon: BarChart3,
  },
] as const

export default function Home() {
  const supabaseConfigured = isSupabaseConfigured()

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-6 py-8 sm:px-8 lg:py-12">
        <header className="flex items-center justify-between gap-4">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
              D
            </span>
            <span>
              <span className="block font-heading text-sm font-semibold">
                Dayflow
              </span>
              <span className="block text-xs text-muted-foreground">
                Intelligent HRMS
              </span>
            </span>
          </Link>

          <Button asChild variant="outline">
            <Link href="/sign-in">
              Sign in
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        </header>

        <section className="grid gap-10 py-20 lg:grid-cols-[1.3fr_0.7fr] lg:items-end lg:py-28">
          <div className="max-w-3xl space-y-6">
            <Badge variant="outline">Foundation v0.1</Badge>
            <div className="space-y-4">
              <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
                One workday, one clear flow.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                The shared Dayflow architecture is ready for parallel feature
                development, with typed contracts and authentication boundaries
                already in place.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/sign-in">
                  Open authentication
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a
                  href="https://github.com/mjp8-dot/odoo-nmit-hackathon-26-Virtual-Round"
                  rel="noreferrer"
                  target="_blank"
                >
                  <GitBranch data-icon="inline-start" />
                  Repository
                </a>
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                Integration status
              </CardTitle>
              <CardDescription>
                The public shell builds without secrets. Auth activates when the
                environment is configured.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Supabase</span>
                <Badge variant={supabaseConfigured ? "default" : "secondary"}>
                  {supabaseConfigured ? "Configured" : "Awaiting keys"}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Shared contracts</span>
                <Badge>Ready</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Feature modules</span>
                <Badge>Isolated</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="module-heading" className="space-y-6">
          <div>
            <p className="text-sm font-medium text-primary">Parallel ownership</p>
            <h2
              className="mt-2 font-heading text-2xl font-semibold tracking-tight"
              id="module-heading"
            >
              Three independent feature lanes
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {modules.map(({ owner, title, description, icon: Icon }) => (
              <Card key={owner}>
                <CardHeader>
                  <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline">{owner}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <footer className="mt-20 border-t py-8 text-sm text-muted-foreground">
          Dayflow foundation · Odoo NMIT Hackathon 2026
        </footer>
      </div>
    </main>
  )
}

