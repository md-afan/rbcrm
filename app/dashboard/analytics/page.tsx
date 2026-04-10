import type { ComponentType } from "react";
import { redirect } from "next/navigation";
import { BarChart3, CircleDollarSign, Presentation, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/layout/app-shell";
import { SchemaSetupNotice } from "@/components/setup/schema-setup-notice";
import { getCurrentUserProfile } from "@/lib/auth";
import { getFinalDealAmount, isCommissionEligible } from "@/lib/finance";
import { getGroups, getLeads, MissingSchemaError } from "@/lib/data";
import { statusStyles } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { LeadStatus } from "@/types/crm";

export default async function OwnerAnalyticsPage() {
  const profile = await getCurrentUserProfile();

  if (profile.role !== "owner") {
    redirect("/dashboard");
  }

  try {
    const [leads, groups] = await Promise.all([
      getLeads({ role: profile.role, userId: profile.id }),
      getGroups()
    ]);

    const eligibleLeads = leads.filter(isCommissionEligible);
    const closedRevenue = eligibleLeads
      .filter((lead) => lead.deal_closed)
      .reduce((sum, lead) => sum + (getFinalDealAmount(lead.deal_amount, lead.discount_given) ?? 0), 0);
    const totalCommission = eligibleLeads.reduce((sum, lead) => sum + (lead.total_commission ?? 0), 0);
    const netProfit = eligibleLeads.reduce((sum, lead) => sum + (lead.admin_profit ?? 0), 0);
    const closedDeals = eligibleLeads.length;
    const statusBreakdown = ([
      "New",
      "Interested",
      "Follow-up",
      "Demo",
      "Closed",
      "Lost"
    ] as LeadStatus[]).map((status) => ({
      status,
      count: leads.filter((lead) => lead.status === status).length
    }));
    const groupPerformance = groups
      .map((group) => {
        const groupLeads = leads.filter((lead) => lead.group_id === group.id);
        const groupRevenue = groupLeads.reduce((sum, lead) => sum + (getFinalDealAmount(lead.deal_amount, lead.discount_given) ?? 0), 0);

        return {
          id: group.id,
          name: group.group_name,
          totalLeads: groupLeads.length,
          closedDeals: groupLeads.filter((lead) => lead.deal_closed).length,
          revenue: groupRevenue
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    return (
      <AppShell profile={profile}>
        <div className="space-y-6">
          <section className="panel grid gap-6 overflow-hidden p-6 md:grid-cols-[1.05fr_0.95fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-ink/45">Revenue analytics</p>
              <h1 className="mt-3 font-[var(--font-display)] text-3xl font-semibold text-ink">
                Executive visibility into pipeline volume, demo pressure, and closed revenue.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-ink/62">
                This owner view helps you understand where deals are clustering, which groups are
                converting, and how much revenue is already flowing out of the pipeline.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard
                label="Closed revenue"
                value={formatCurrency(closedRevenue)}
                icon={CircleDollarSign}
              />
              <MetricCard label="Total commission" value={formatCurrency(totalCommission)} icon={TrendingUp} />
              <MetricCard label="Net profit" value={formatCurrency(netProfit)} icon={Presentation} />
              <MetricCard label="Tracked leads" value={String(leads.length)} icon={BarChart3} />
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="panel p-6">
              <h2 className="font-[var(--font-display)] text-xl font-semibold text-ink">
                Pipeline by status
              </h2>
              <div className="mt-5 space-y-3">
                {statusBreakdown.map((item) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between rounded-[1.5rem] border border-ink/10 bg-white/80 px-4 py-3"
                  >
                    <Badge className={statusStyles[item.status as LeadStatus]}>{item.status}</Badge>
                    <span className="text-lg font-semibold text-ink">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel overflow-hidden">
              <div className="border-b border-ink/10 px-6 py-4">
                <h2 className="font-[var(--font-display)] text-xl font-semibold text-ink">
                  Group performance
                </h2>
              </div>
              <div className="divide-y divide-ink/10">
                {groupPerformance.length ? (
                  groupPerformance.map((group) => (
                    <div key={group.id} className="grid gap-4 px-6 py-5 md:grid-cols-4 md:items-center">
                      <div>
                        <p className="font-semibold text-ink">{group.name}</p>
                        <p className="mt-1 text-sm text-ink/55">Leads handled: {group.totalLeads}</p>
                      </div>
                      <div>
                        <p className="text-sm text-ink/55">Closed deals</p>
                        <p className="mt-1 text-lg font-semibold text-ink">{group.closedDeals}</p>
                      </div>
                      <div>
                        <p className="text-sm text-ink/55">Revenue</p>
                        <p className="mt-1 text-lg font-semibold text-ink">
                          {formatCurrency(group.revenue)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-ink/55">Conversion</p>
                        <p className="mt-1 text-lg font-semibold text-ink">
                          {group.totalLeads ? Math.round((group.closedDeals / group.totalLeads) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-10 text-sm text-ink/55">
                    No group analytics are available yet.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </AppShell>
    );
  } catch (error) {
    if (error instanceof MissingSchemaError) {
      return (
        <AppShell profile={profile}>
          <SchemaSetupNotice title="Analytics workspace is not ready yet" details={error.message} />
        </AppShell>
      );
    }

    throw error;
  }
}

function MetricCard({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-[1.75rem] border border-ink/10 bg-white/85 p-5">
      <div className="inline-flex rounded-2xl bg-sky p-3 text-ocean">
        <Icon className="size-5" />
      </div>
      <p className="mt-4 text-sm text-ink/55">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
