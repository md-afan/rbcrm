import { ArrowRight, CalendarClock } from "lucide-react";
import Link from "next/link";
import { ProgressTracker } from "@/components/progress/progress-tracker";
import { Badge } from "@/components/ui/badge";
import { metricIcons, roleLabels, statusStyles } from "@/lib/constants";
import { describeLeadTask } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";
import type {
  DashboardMetric,
  EarningsSummary,
  LeadRecord,
  TransactionRecord,
  UserProfile
} from "@/types/crm";

export function RoleDashboardRefined({
  profile,
  metrics,
  leads,
  earningsSummary,
  transactions,
  closedRevenue
}: {
  profile: UserProfile;
  metrics: DashboardMetric[];
  leads: LeadRecord[];
  earningsSummary: EarningsSummary;
  transactions: TransactionRecord[];
  closedRevenue?: number;
}) {
  const metricIconStyles = [
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-sky-100 text-sky-700",
    "bg-violet-100 text-violet-700"
  ];

  return (
    <div className="dashboard-stack">
      <section className="page-shell">
        <div className="page-header">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Badge className="bg-neutral-100 text-ink">{roleLabels[profile.role]}</Badge>
              <h1 className="font-[var(--font-display)] text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Same workflow, same workspace, clear role boundaries.
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-ink/60">
                Every team member works from the same lifecycle view while edits stay limited to the correct lane.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {profile.role === "owner" && closedRevenue !== undefined ? (
                <div className="min-w-[11rem] border border-black/10 bg-neutral-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Closed revenue</p>
                  <p className="mt-2 text-xl font-semibold text-ink">
                    {formatCurrency(closedRevenue)}
                  </p>
                </div>
              ) : null}
              <Link
                href="/crm"
                className="inline-flex items-center gap-2 border border-black bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Open CRM table
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        {metrics.map((metric, index) => {
          const Icon = Object.values(metricIcons)[index];

          return (
            <article key={metric.label} className="border border-black/10 bg-neutral-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-ink/55">{metric.label}</p>
                  <p className="mt-2 break-words text-2xl font-semibold text-ink">
                    {metric.value}
                  </p>
                </div>
                <div className={`rounded-xl p-2.5 ${metricIconStyles[index] ?? "bg-neutral-100 text-neutral-700"}`}>
                  <Icon className="size-5" />
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-ink/60">{metric.helper}</p>
            </article>
          );
        })}
      </section>

      <section className="content-grid">
        <div className="table-shell md:col-span-4 xl:col-span-8">
          <div className="border-b border-ink/10 px-5 py-4">
            <h2 className="font-[var(--font-display)] text-xl font-semibold text-ink">
              Assigned leads
            </h2>
          </div>
          <div className="divide-y divide-ink/10">
            {leads.length ? (
              leads.map((lead) => (
                <div key={lead.id} className="space-y-4 px-5 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{lead.business_name}</p>
                      <p className="text-sm text-ink/60">
                        {lead.owner_name} / {lead.location}
                      </p>
                    </div>
                    <Badge className={statusStyles[lead.status]}>{lead.status}</Badge>
                  </div>
                  <ProgressTracker lead={lead} />
                </div>
              ))
            ) : (
              <div className="px-5 py-10 text-sm text-ink/60">No leads available yet.</div>
            )}
          </div>
        </div>

        <aside className="md:col-span-2 xl:col-span-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-100 p-2.5 text-rose-700">
              <CalendarClock className="size-5" />
            </div>
            <div>
              <h2 className="font-[var(--font-display)] text-xl font-semibold text-ink">
                Daily tasks
              </h2>
              <p className="text-sm text-ink/55">
                High-signal next actions from your visible rows.
              </p>
            </div>
          </div>
          <div className="mt-5 border border-black/10">
            {leads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="border-b border-black/10 px-4 py-4 last:border-b-0">
                <p className="font-medium text-ink">{lead.business_name}</p>
                <p className="mt-1 text-sm leading-6 text-ink/60">{describeLeadTask(lead)}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="content-grid">
        <div className="md:col-span-2 xl:col-span-4 border border-black/10 bg-white p-5">
          <p className="text-sm uppercase tracking-[0.2em] text-ink/45">
            {profile.role === "owner" ? "Profit snapshot" : "Earning snapshot"}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="muted-block p-4">
              <p className="text-sm text-ink/55">{earningsSummary.primaryLabel}</p>
              <p className="mt-2 text-2xl font-semibold text-ink">
                {formatCurrency(
                  profile.role === "owner"
                    ? (earningsSummary.totalCommission ?? 0)
                    : earningsSummary.totalEarnings
                )}
              </p>
            </div>
            <div className="muted-block p-4">
              <p className="text-sm text-ink/55">{earningsSummary.secondaryLabel}</p>
              <p className="mt-2 text-2xl font-semibold text-ink">
                {formatCurrency(
                  profile.role === "owner"
                    ? (earningsSummary.netProfit ?? 0)
                    : earningsSummary.monthlyEarnings
                )}
              </p>
            </div>
          </div>
          <div className="mt-4 border-t border-black/10 pt-4 text-sm text-ink/60">
            {profile.role === "owner"
              ? `Commission posted across ${earningsSummary.dealsCount} fully paid deals.`
              : `You have ${earningsSummary.dealsCount} commission entries in your ledger.`}
          </div>
        </div>

        <div className="table-shell md:col-span-4 xl:col-span-8">
          <div className="border-b border-ink/10 px-5 py-4">
            <h2 className="font-[var(--font-display)] text-xl font-semibold text-ink">
              {profile.role === "owner" ? "Commission ledger" : "Commission history"}
            </h2>
          </div>
          <div className="divide-y divide-ink/10">
            {transactions.length ? (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink">
                      {transaction.lead?.business_name ?? "Commission entry"}
                    </p>
                    <p className="mt-1 text-sm text-ink/55">
                      {transaction.role.toUpperCase()} / {new Date(transaction.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-ink">
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              ))
            ) : (
              <div className="px-5 py-10 text-sm text-ink/60">
                No commission history is available yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
