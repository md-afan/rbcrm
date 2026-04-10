"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, Plus, Search } from "lucide-react";
import { CrmTable } from "@/components/crm/crm-table";
import { LeadEditorDrawer } from "@/components/crm/lead-editor-drawer";
import { useRealtimeLeads } from "@/hooks/use-realtime-leads";
import type { FilterOptions, LeadRecord, UserProfile } from "@/types/crm";

export function CrmWorkspace({
  profile,
  initialLeads,
  filterOptions,
  groups,
  users
}: {
  profile: UserProfile;
  initialLeads: LeadRecord[];
  filterOptions: FilterOptions;
  groups: Array<{
    id: string;
    group_name: string;
    lead_user_id: string;
    caller_user_id: string;
    demo_user_id: string;
    created_at: string;
  }>;
  users: Array<{ id: string; name: string; role: string }>;
}) {
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("edit");
  const [drawerInstance, setDrawerInstance] = useState(0);
  const leads = useRealtimeLeads(initialLeads);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const currentFilters = useMemo(
    () => ({
      search: searchParams.get("search") ?? "",
      status: searchParams.get("status") ?? "",
      groupId: searchParams.get("groupId") ?? "",
      leadBy: searchParams.get("leadBy") ?? "",
      assignedTo: searchParams.get("assignedTo") ?? ""
    }),
    [searchParams]
  );

  function updateFilter(name: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());

    if (value) {
      next.set(name, value);
    } else {
      next.delete(name);
    }

    startTransition(() => {
      router.replace(`/crm?${next.toString()}`);
    });
  }

  return (
    <div className="space-y-6">
      <section className="page-shell">
        <div className="page-header">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
            <div>
              <h1 className="font-[var(--font-display)] text-2xl font-semibold tracking-tight sm:text-3xl">
                Master CRM table
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-ink/60">
                One row holds the full client lifecycle, and every role sees the same structure with role-based editing only.
              </p>
            </div>

            {profile.role === "lead" || profile.role === "owner" ? (
              <button
                onClick={() => {
                  setSelectedLead(null);
                  setDrawerMode("create");
                  setDrawerInstance((current) => current + 1);
                }}
                className="inline-flex items-center gap-2 border border-black bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                <Plus className="size-4" />
                New lead
              </button>
            ) : null}
          </div>
        </div>

        <div className="stats-grid">
          <label className="relative block xl:col-span-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink/40" />
            <input
              defaultValue={currentFilters.search}
              onBlur={(event) => updateFilter("search", event.target.value)}
              placeholder="Search business, owner, phone, location"
              className="w-full border border-ink/10 bg-white px-11 py-3 text-sm outline-none transition focus:border-ocean"
            />
          </label>

          <FilterSelect
            label="Status"
            value={currentFilters.status}
            options={filterOptions.statuses}
            onChange={(value) => updateFilter("status", value)}
          />
          <FilterSelect
            label="Group"
            value={currentFilters.groupId}
            options={filterOptions.groups}
            onChange={(value) => updateFilter("groupId", value)}
          />
          <FilterSelect
            label="Lead By"
            value={currentFilters.leadBy}
            options={filterOptions.leadOwners}
            onChange={(value) => updateFilter("leadBy", value)}
          />
          <FilterSelect
            label="Assigned To"
            value={currentFilters.assignedTo}
            options={filterOptions.assignees}
            onChange={(value) => updateFilter("assignedTo", value)}
          />
        </div>

        {pending ? (
          <div className="col-span-full inline-flex items-center gap-2 text-sm text-ink/55">
            <Filter className="size-4 animate-pulse" />
            Refreshing filtered results...
          </div>
        ) : null}
      </section>

      <CrmTable
        leads={leads}
        profile={profile}
        onOpen={(lead) => {
          setSelectedLead(lead);
          setDrawerMode("edit");
          setDrawerInstance((current) => current + 1);
        }}
      />

      <LeadEditorDrawer
        key={`${drawerMode}-${selectedLead?.id ?? "new"}-${drawerInstance}`}
        open={Boolean(selectedLead) || drawerMode === "create"}
        mode={drawerMode}
        lead={selectedLead}
        profile={profile}
        groupOptions={filterOptions.groups}
        assigneeOptions={filterOptions.assignees}
        groups={groups}
        users={users}
        onClose={() => {
          setSelectedLead(null);
          setDrawerMode("edit");
        }}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-ink/60">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-ocean"
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
