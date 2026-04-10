import { ArrowRight, CalendarClock } from "lucide-react";
import Link from "next/link";
import { describeLeadTask } from "@/lib/data";
import { getFinalDealAmount } from "@/lib/finance";
import { metricIcons, roleLabels, statusStyles } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { ProgressTracker } from "@/components/progress/progress-tracker";
import { Badge } from "@/components/ui/badge";
import type { DashboardMetric, LeadRecord, UserProfile } from "@/types/crm";

export function RoleDashboard({
  profile,
  metrics,
  leads
}: {
  profile: UserProfile;
  metrics: DashboardMetric[];
  leads: LeadRecord[];
}) {
  return (
    <div className="space-y-6">
      <section className="panel grid gap-6 overflow-hidden p-5 sm:p-6 md:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-4">
          <Badge className="bg-sky text-ocean">{roleLabels[profile.role]}</Badge>
          <div className="space-y-2">
            <h1 className="font-[var(--font-display)] text-2xl font-semibold tracking-tight sm:text-3xl">
              Keep every client moving through the lifecycle without losing context.
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-ink/65">
              This workspace gives you full visibility and role-restricted updates on the
              same master record, so everyone works from the same source of truth.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/crm"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-ocean"
            >
              Open CRM table
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] bg-ink p-6 text-white">
          <p className="text-sm uppercase tracking-[0.2em] text-white/55">Role focus</p>
          <h2 className="mt-3 font-[var(--font-display)] text-2xl font-semibold">
            {roleLabels[profile.role]}
          </h2>
          <p className="mt-3 text-sm leading-7 text-white/75">
            Use the dashboard for quick situational awareness, then work the shared CRM
            table for updates, assignments, and lifecycle progression.
          </p>
          <div className="mt-6 rounded-3xl bg-white/10 p-4">
            <p className="text-sm text-white/70">Closed revenue snapshot</p>
            <p className="mt-2 text-2xl font-semibold sm:text-3xl">
              {formatCurrency(
                leads
                  .filter((lead) => lead.deal_closed)
                  .reduce((sum, lead) => sum + (getFinalDealAmount(lead.deal_amount, lead.discount_given) ?? 0), 0)
              )}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = Object.values(metricIcons)[index];
          return (
            <article key={metric.label} className="panel p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-ink/55">{metric.label}</p>
                  <p className="mt-2 break-words text-2xl font-semibold sm:text-3xl">{metric.value}</p>
                </div>
                <div className="rounded-2xl bg-sky p-3 text-ocean">
                  <Icon className="size-5" />
                </div>
              </div>
              <p className="mt-4 text-sm text-ink/60">{metric.helper}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel overflow-hidden">
          <div className="border-b border-ink/10 px-6 py-4">
            <h2 className="font-[var(--font-display)] text-xl font-semibold">Assigned leads</h2>
          </div>
          <div className="divide-y divide-ink/10">
            {leads.length ? (
              leads.map((lead) => (
                <div key={lead.id} className="space-y-4 px-6 py-5">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <p className="font-semibold text-ink">{lead.business_name}</p>
                      <p className="text-sm text-ink/60">
                        {lead.owner_name} • {lead.location}
                      </p>
                    </div>
                    <Badge className={statusStyles[lead.status]}>{lead.status}</Badge>
                  </div>
                  <ProgressTracker lead={lead} />
                </div>
              ))
            ) : (
              <div className="px-6 py-10 text-sm text-ink/60">No leads available yet.</div>
            )}
          </div>
        </div>

        <aside className="panel p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-coral/15 p-3 text-coral">
              <CalendarClock className="size-5" />
            </div>
            <div>
              <h2 className="font-[var(--font-display)] text-xl font-semibold">Daily tasks</h2>
              <p className="text-sm text-ink/55">High-signal next actions from your visible rows.</p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {leads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="rounded-3xl bg-sand/80 p-4">
                <p className="font-medium text-ink">{lead.business_name}</p>
                <p className="mt-1 text-sm text-ink/60">{describeLeadTask(lead)}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
