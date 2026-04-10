import { CrmWorkspace } from "@/components/crm/crm-workspace";
import { AppShell } from "@/components/layout/app-shell";
import { SchemaSetupNotice } from "@/components/setup/schema-setup-notice";
import { getCurrentUserProfile } from "@/lib/auth";
import {
  getFilterOptions,
  getGroups,
  getLeads,
  getUsers,
  MissingSchemaError
} from "@/lib/data";

type CrmPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CrmPage({ searchParams }: CrmPageProps) {
  const params = await searchParams;
  const profile = await getCurrentUserProfile();

  try {
    const [leads, filters, groups, users] = await Promise.all([
      getLeads({
        role: profile.role,
        userId: profile.id,
        search: typeof params.search === "string" ? params.search : undefined,
        status: typeof params.status === "string" ? params.status : undefined,
        groupId: typeof params.groupId === "string" ? params.groupId : undefined,
        assignedTo:
          typeof params.assignedTo === "string" ? params.assignedTo : undefined,
        leadBy: typeof params.leadBy === "string" ? params.leadBy : undefined
      }),
      getFilterOptions(profile),
      profile.role === "owner" ? getGroups() : Promise.resolve([]),
      profile.role === "owner" ? getUsers() : Promise.resolve([])
    ]);

    return (
      <AppShell profile={profile}>
        <CrmWorkspace
          profile={profile}
          initialLeads={leads}
          filterOptions={filters}
          groups={groups}
          users={users}
        />
      </AppShell>
    );
  } catch (error) {
    if (error instanceof MissingSchemaError) {
      return (
        <AppShell profile={profile}>
          <SchemaSetupNotice title="CRM tables are not ready yet" details={error.message} />
        </AppShell>
      );
    }

    throw error;
  }
}
