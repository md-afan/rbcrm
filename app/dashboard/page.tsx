import Link from "next/link";
import { ArrowRight, BarChart3, Boxes, Users2 } from "lucide-react";
import { RoleDashboardRefined } from "@/components/dashboard/role-dashboard-refined";
import { OwnerGroupManager } from "@/components/groups/owner-group-manager";
import { AppShell } from "@/components/layout/app-shell";
import { SchemaSetupNotice } from "@/components/setup/schema-setup-notice";
import { getCurrentUserProfile } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import {
  getEarningsSummary,
  getDashboardMetrics,
  getGroups,
  getLeads,
  getTransactions,
  getUsers,
  MissingSchemaError
} from "@/lib/data";

export default async function DashboardPage() {
  const profile = await getCurrentUserProfile();

  try {
    const [metrics, leads] = await Promise.all([
      getDashboardMetrics(profile),
      getLeads({
        role: profile.role,
        userId: profile.id,
        limit: 8
      })
    ]);
    const [earningsSummary, transactions] = await Promise.all([
      getEarningsSummary(profile),
      getTransactions({ profile, limit: 10 })
    ]);

    let users: Awaited<ReturnType<typeof getUsers>> = [];
    let groups: Awaited<ReturnType<typeof getGroups>> = [];
    let ownerSetupIssue = "";

    if (profile.role === "owner") {
      try {
        [users, groups] = await Promise.all([getUsers(), getGroups()]);
      } catch (error) {
        if (error instanceof MissingSchemaError) {
          ownerSetupIssue = error.message;
        } else {
          throw error;
        }
      }
    }

    return (
      <AppShell profile={profile}>
        <RoleDashboardRefined
          profile={profile}
          metrics={metrics}
          leads={leads}
          earningsSummary={earningsSummary}
          transactions={transactions}
          closedRevenue={profile.role === "owner" ? (earningsSummary.totalRevenue ?? 0) : undefined}
        />
        {profile.role === "owner" ? (
          <OwnerCommandDeck
            totalGroups={groups.length}
            totalUsers={users.length}
            revenue={earningsSummary.totalRevenue ?? 0}
            groupLeadCounts={groups.map((group) => ({
              id: group.id,
              groupName: group.group_name,
              leadCount: leads.filter((lead) => lead.group_id === group.id).length
            }))}
          />
        ) : null}
        {profile.role === "owner" ? (
          <OwnerGroupManager users={users} groups={groups} setupIssue={ownerSetupIssue} />
        ) : null}
      </AppShell>
    );
  } catch (error) {
    if (error instanceof MissingSchemaError) {
      return (
        <AppShell profile={profile}>
          <SchemaSetupNotice details={error.message} />
        </AppShell>
      );
    }

    throw error;
  }
}

function OwnerCommandDeck({
  totalGroups,
  totalUsers,
  revenue,
  groupLeadCounts
}: {
  totalGroups: number;
  totalUsers: number;
  revenue: number;
  groupLeadCounts: Array<{ id: string; groupName: string; leadCount: number }>;
}) {
  const links = [
    {
      href: "/dashboard/groups",
      label: "Group Command",
      description: "Create team units, review assignments, and shape how leads are routed.",
      icon: Boxes,
      iconClass: "bg-sky-100 text-sky-700"
    },
    {
      href: "/dashboard/team",
      label: "Team Directory",
      description: "Review every employee, role assignment, and operational coverage in one place.",
      icon: Users2,
      iconClass: "bg-emerald-100 text-emerald-700"
    },
    {
      href: "/dashboard/analytics",
      label: "Revenue Analytics",
      description: "Track pipeline movement, deal closure health, and performance by group.",
      icon: BarChart3,
      iconClass: "bg-violet-100 text-violet-700"
    }
  ];

  return (
    <section className="overflow-hidden border border-black/10 bg-white">
      <div className="grid grid-cols-1 xl:grid-cols-[15rem_16rem_minmax(0,1fr)]">
        <aside className="border-b border-black/10 bg-[#171c2a] px-5 py-6 text-white xl:border-b-0 xl:border-r xl:border-black/10">
          <p className="text-xs uppercase tracking-[0.22em] text-white/45">Owner panel</p>
          <h2 className="mt-3 font-[var(--font-display)] text-2xl font-semibold">
            Admin workspace
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/65">
            Manage groups, team structure, and revenue visibility from one compact command area.
          </p>

          <div className="mt-6 space-y-2">
            {links.map((link) => {
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between border border-white/10 px-3 py-3 text-sm text-white/78 transition hover:bg-white/5 hover:text-white"
                >
                  <span className="inline-flex items-center gap-3">
                    <span className={`inline-flex rounded-lg p-2 ${link.iconClass}`}>
                      <Icon className="size-4" />
                    </span>
                    {link.label}
                  </span>
                  <ArrowRight className="size-4 text-white/35" />
                </Link>
              );
            })}
          </div>
        </aside>

        <div className="border-b border-black/10 bg-neutral-50 px-5 py-6 xl:border-b-0 xl:border-r xl:border-black/10">
          <p className="text-xs uppercase tracking-[0.22em] text-ink/45">Overview</p>
          <div className="mt-4 space-y-3">
            <OwnerStatCard label="Active groups" value={String(totalGroups)} />
            <OwnerStatCard label="People in system" value={String(totalUsers)} />
            <OwnerStatCard label="Closed revenue" value={formatCurrency(revenue)} />
          </div>
        </div>

        <div className="px-5 py-6">
          <div className="flex flex-col gap-2 border-b border-black/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-ink/45">Group workload</p>
              <h3 className="mt-2 font-[var(--font-display)] text-2xl font-semibold text-ink">
                Leads worked by each group
              </h3>
            </div>
            <p className="text-sm text-ink/50">Live count from current CRM rows</p>
          </div>

          <div className="divide-y divide-black/10">
            {groupLeadCounts.length ? (
              groupLeadCounts
                .sort((a, b) => b.leadCount - a.leadCount)
                .map((group, index) => (
                  <div
                    key={group.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 px-1 py-4 sm:grid-cols-[4rem_minmax(0,1fr)_auto]"
                  >
                    <div className="hidden text-sm font-medium text-ink/35 sm:block">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink">{group.groupName}</p>
                      <p className="mt-1 text-sm text-ink/50">Assigned group pipeline</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-ink">{group.leadCount}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-ink/45">Leads</p>
                    </div>
                  </div>
                ))
            ) : (
              <div className="px-1 py-10 text-sm text-ink/55">
                No groups have worked on leads yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function OwnerStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-ink/10 bg-white px-4 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-ink/45">{label}</p>
      <p className="mt-2 break-words text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
