import type { ComponentType } from "react";
import { redirect } from "next/navigation";
import { Boxes, Layers3, Users2 } from "lucide-react";
import { OwnerGroupManager } from "@/components/groups/owner-group-manager";
import { AppShell } from "@/components/layout/app-shell";
import { SchemaSetupNotice } from "@/components/setup/schema-setup-notice";
import { getCurrentUserProfile } from "@/lib/auth";
import { getGroups, getUsers, MissingSchemaError } from "@/lib/data";

export default async function OwnerGroupsPage() {
  const profile = await getCurrentUserProfile();

  if (profile.role !== "owner") {
    redirect("/dashboard");
  }

  try {
    const [users, groups] = await Promise.all([getUsers(), getGroups()]);

    return (
      <AppShell profile={profile}>
        <div className="space-y-6">
          <section className="panel grid gap-6 overflow-hidden p-6 md:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-ink/45">Group command</p>
              <h1 className="mt-3 font-[var(--font-display)] text-3xl font-semibold text-ink">
                Build disciplined operating units for lead, caller, and demo ownership.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-ink/62">
                This page is your control room for team structure. Assign role coverage clearly so
                every incoming lead lands inside a group that can work the lifecycle end to end.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
              <SummaryCard label="Configured groups" value={String(groups.length)} icon={Boxes} />
              <SummaryCard label="Available users" value={String(users.length)} icon={Users2} />
              <SummaryCard
                label="Avg members per group"
                value={groups.length ? "3 fixed" : "0"}
                icon={Layers3}
              />
            </div>
          </section>

          <OwnerGroupManager users={users} groups={groups} />
        </div>
      </AppShell>
    );
  } catch (error) {
    if (error instanceof MissingSchemaError) {
      return (
        <AppShell profile={profile}>
          <SchemaSetupNotice title="Group workspace is not ready yet" details={error.message} />
        </AppShell>
      );
    }

    throw error;
  }
}

function SummaryCard({
  label,
  value,
  icon: Icon
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-[1.75rem] border border-ink/10 bg-white/85 p-4">
      <div className="inline-flex rounded-2xl bg-sky p-3 text-ocean">
        <Icon className="size-5" />
      </div>
      <p className="mt-4 text-sm text-ink/55">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}
