import { redirect } from "next/navigation";
import { ShieldCheck, Users2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/layout/app-shell";
import { SchemaSetupNotice } from "@/components/setup/schema-setup-notice";
import { getCurrentUserProfile } from "@/lib/auth";
import { getGroups, getTransactions, getUsers, MissingSchemaError } from "@/lib/data";
import { roleLabels } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { UserRole } from "@/types/crm";

export default async function OwnerTeamPage() {
  const profile = await getCurrentUserProfile();

  if (profile.role !== "owner") {
    redirect("/dashboard");
  }

  try {
    const [users, groups, transactions] = await Promise.all([
      getUsers(),
      getGroups(),
      getTransactions({ profile, limit: 500 })
    ]);
    const assignments = new Map<string, number>();
    const earnings = new Map<string, number>();

    groups.forEach((group) => {
      [group.lead_user_id, group.caller_user_id, group.demo_user_id].forEach((id) => {
        assignments.set(id, (assignments.get(id) ?? 0) + 1);
      });
    });

    transactions.forEach((transaction) => {
      earnings.set(transaction.user_id, (earnings.get(transaction.user_id) ?? 0) + transaction.amount);
    });

    return (
      <AppShell profile={profile}>
        <div className="space-y-6">
          <section className="panel grid gap-6 overflow-hidden p-6 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-ink/45">Team directory</p>
              <h1 className="mt-3 font-[var(--font-display)] text-3xl font-semibold text-ink">
                Review employee coverage, role mix, and assignment load from one admin view.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-ink/62">
                Use this roster to confirm the right people exist in the system before you assign
                them to active groups. It is the cleanest way to spot missing roles or overloaded
                coverage.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.75rem] border border-ink/10 bg-white/85 p-5">
                <div className="inline-flex rounded-2xl bg-sky p-3 text-ocean">
                  <Users2 className="size-5" />
                </div>
                <p className="mt-4 text-sm text-ink/55">People in workspace</p>
                <p className="mt-2 text-2xl font-semibold text-ink">{users.length}</p>
              </div>

              <div className="rounded-[1.75rem] border border-ink/10 bg-white/85 p-5">
                <div className="inline-flex rounded-2xl bg-sky p-3 text-ocean">
                  <ShieldCheck className="size-5" />
                </div>
                <p className="mt-4 text-sm text-ink/55">Assigned to groups</p>
                <p className="mt-2 text-2xl font-semibold text-ink">
                  {users.filter((user) => assignments.has(user.id)).length}
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {users.map((user) => (
              <article key={user.id} className="panel p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-[var(--font-display)] text-lg font-semibold text-ink">
                      {user.name}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ink/45">
                      Member ID ending {user.id.slice(-6)}
                    </p>
                  </div>
                  <Badge className="bg-sky text-ocean">
                    {roleLabels[user.role as UserRole]}
                  </Badge>
                </div>

                <div className="mt-5 rounded-[1.5rem] bg-sand/75 p-4">
                  <p className="text-sm text-ink/55">Group assignments</p>
                  <p className="mt-2 text-2xl font-semibold text-ink">
                    {assignments.get(user.id) ?? 0}
                  </p>
                </div>

                <div className="mt-4 rounded-[1.5rem] border border-ink/10 bg-white/85 p-4">
                  <p className="text-sm text-ink/55">Commission earned</p>
                  <p className="mt-2 text-xl font-semibold text-ink">
                    {formatCurrency(earnings.get(user.id) ?? 0)}
                  </p>
                </div>
              </article>
            ))}
          </section>
        </div>
      </AppShell>
    );
  } catch (error) {
    if (error instanceof MissingSchemaError) {
      return (
        <AppShell profile={profile}>
          <SchemaSetupNotice title="Team workspace is not ready yet" details={error.message} />
        </AppShell>
      );
    }

    throw error;
  }
}
