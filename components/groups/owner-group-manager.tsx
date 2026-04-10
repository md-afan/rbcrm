"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Boxes, PencilLine } from "lucide-react";
import {
  createGroupAction,
  updateGroupAction,
  type GroupActionState
} from "@/app/actions/groups";
import type { GroupRecord } from "@/types/crm";

const initialState: GroupActionState = {
  error: "",
  success: false
};

export function OwnerGroupManager({
  users,
  groups,
  setupIssue = ""
}: {
  users: Array<{ id: string; name: string; role: string }>;
  groups: GroupRecord[];
  setupIssue?: string;
}) {
  const [state, action, pending] = useActionState(createGroupAction, initialState);
  const leadUsers = users.filter((user) => user.role === "lead");
  const callerUsers = users.filter((user) => user.role === "caller");
  const demoUsers = users.filter((user) => user.role === "demo");
  const leadOptions = leadUsers.length ? leadUsers : users;
  const callerOptions = callerUsers.length ? callerUsers : users;
  const demoOptions = demoUsers.length ? demoUsers : users;
  const hasEnoughDistinctUsers = new Set(users.map((user) => user.id)).size >= 3;
  const userLookup = new Map(users.map((user) => [user.id, user] as const));

  useEffect(() => {
    if (state.success) {
      const form = document.getElementById("owner-group-form") as HTMLFormElement | null;
      form?.reset();
    }
  }, [state.success]);

  return (
    <section className="overflow-hidden border border-black/10 bg-white">
      <div className="grid grid-cols-1 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <div className="border-b border-black/10 bg-neutral-50 px-5 py-6 xl:border-b-0 xl:border-r xl:border-black/10">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-100 p-2.5 text-violet-700">
            <Boxes className="size-5" />
            </div>
            <div>
              <h2 className="font-[var(--font-display)] text-xl font-semibold">Create Group</h2>
              <p className="text-sm text-ink/55">Assign one lead, one caller, and one demo user.</p>
            </div>
          </div>

          <form id="owner-group-form" action={action} className="mt-5 space-y-4">
            {setupIssue ? (
              <p className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Group setup is still incomplete in Supabase. The main dashboard is available, but
                group management is paused until this is fixed.
                <span className="mt-2 block break-words font-medium text-amber-800">{setupIssue}</span>
              </p>
            ) : null}

            <Field label="Group Name" name="group_name" placeholder="North Team" />
            <SelectField
              label="Lead User"
              name="lead_user_id"
              options={leadOptions}
              emptyLabel="No users found"
            />
            <SelectField
              label="Caller User"
              name="caller_user_id"
              options={callerOptions}
              emptyLabel="No users found"
            />
            <SelectField
              label="Demo User"
              name="demo_user_id"
              options={demoOptions}
              emptyLabel="No users found"
            />

            {state.error ? (
              <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p>
            ) : null}

            {!users.length ? (
              <p className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                No users were found in `public.users` or legacy `profiles`. Create users first or
                verify the migration.
              </p>
            ) : null}

            {users.length > 0 && !hasEnoughDistinctUsers ? (
              <p className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                You need at least 3 different users to create a group with separate lead, caller,
                and demo members. Create more accounts from{" "}
                <Link href="/signup" className="font-semibold underline underline-offset-4">
                  Sign Up
                </Link>
                .
              </p>
            ) : null}

            {users.length && (!leadUsers.length || !callerUsers.length || !demoUsers.length) ? (
              <p className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Role-matched users were not found for one or more slots, so all available users are
                shown as a fallback. Update user roles later for stricter assignment.
              </p>
            ) : null}

            <button
              type="submit"
              disabled={pending || !users.length || !hasEnoughDistinctUsers || Boolean(setupIssue)}
              className="w-full border border-black bg-black px-5 py-3 font-medium text-white transition hover:bg-neutral-800 disabled:opacity-75"
            >
              {pending ? "Creating..." : "Create Group"}
            </button>
          </form>
        </div>

        <div className="px-5 py-6">
          <div className="border-b border-black/10 pb-4">
            <p className="text-xs uppercase tracking-[0.22em] text-ink/45">Existing Groups</p>
            <h2 className="mt-2 font-[var(--font-display)] text-2xl font-semibold">Team units</h2>
          </div>
          <div className="divide-y divide-ink/10">
            {groups.length ? (
              groups.map((group) => (
                <EditableGroupRow
                  key={group.id}
                  group={group}
                  users={users}
                  userLookup={userLookup}
                  leadOptions={leadOptions}
                  callerOptions={callerOptions}
                  demoOptions={demoOptions}
                />
              ))
            ) : (
              <div className="py-10 text-sm text-ink/55">No groups created yet.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function EditableGroupRow({
  group,
  users,
  userLookup,
  leadOptions,
  callerOptions,
  demoOptions
}: {
  group: GroupRecord;
  users: Array<{ id: string; name: string; role: string }>;
  userLookup: Map<string, { id: string; name: string; role: string }>;
  leadOptions: Array<{ id: string; name: string; role: string }>;
  callerOptions: Array<{ id: string; name: string; role: string }>;
  demoOptions: Array<{ id: string; name: string; role: string }>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, action, pending] = useActionState(updateGroupAction, initialState);

  useEffect(() => {
    if (state.success) {
      setIsEditing(false);
    }
  }, [state.success]);

  return (
    <div className="py-4 text-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-ink">{group.group_name}</p>
          <p className="mt-1 text-sm text-ink/50">Group ID ending {group.id.slice(-6)}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing((current) => !current)}
          className="inline-flex items-center gap-2 border border-ink/10 px-4 py-2 text-sm font-medium text-ink transition hover:bg-neutral-50"
        >
          <PencilLine className="size-4 text-amber-600" />
          {isEditing ? "Close Edit" : "Edit"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <MemberPill
          label="Lead"
          user={userLookup.get(group.lead_user_id)}
          fallbackId={group.lead_user_id}
        />
        <MemberPill
          label="Caller"
          user={userLookup.get(group.caller_user_id)}
          fallbackId={group.caller_user_id}
        />
        <MemberPill
          label="Demo"
          user={userLookup.get(group.demo_user_id)}
          fallbackId={group.demo_user_id}
        />
      </div>

      {isEditing ? (
        <form action={action} className="mt-4 space-y-4 border border-ink/10 bg-neutral-50 p-4">
          <input type="hidden" name="group_id" value={group.id} />
          <Field label="Group Name" name="group_name" placeholder="North Team" defaultValue={group.group_name} />
          <SelectField
            label="Lead User"
            name="lead_user_id"
            options={leadOptions.length ? leadOptions : users}
            emptyLabel="No users found"
            defaultValue={group.lead_user_id}
          />
          <SelectField
            label="Caller User"
            name="caller_user_id"
            options={callerOptions.length ? callerOptions : users}
            emptyLabel="No users found"
            defaultValue={group.caller_user_id}
          />
          <SelectField
            label="Demo User"
            name="demo_user_id"
            options={demoOptions.length ? demoOptions : users}
            emptyLabel="No users found"
            defaultValue={group.demo_user_id}
          />

          {state.error ? (
            <p className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full border border-black bg-black px-5 py-3 font-medium text-white transition hover:bg-neutral-800 disabled:opacity-75"
          >
            {pending ? "Saving..." : "Save Group Changes"}
          </button>
        </form>
      ) : null}
    </div>
  );
}

function MemberPill({
  label,
  user,
  fallbackId
}: {
  label: string;
  user: { id: string; name: string; role?: string } | undefined;
  fallbackId: string;
}) {
  return (
    <div className="border border-ink/10 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">{label}</p>
      <p className="mt-2 break-words font-medium text-ink">{user?.name ?? "Unknown member"}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ink/45">
        {user?.role ?? "unassigned"}
      </p>
      {!user ? <p className="mt-2 break-all text-xs text-ink/35">{fallbackId}</p> : null}
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  defaultValue
}: {
  label: string;
  name: string;
  placeholder: string;
  defaultValue?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-ink/70">{label}</span>
      <input
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-ocean"
      />
    </label>
  );
}

function SelectField({
  label,
  name,
  options,
  emptyLabel,
  defaultValue
}: {
  label: string;
  name: string;
  options: Array<{ id: string; name: string; role?: string }>;
  emptyLabel: string;
  defaultValue?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-ink/70">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-ocean"
      >
        <option value="">{options.length ? "Select" : emptyLabel}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
            {option.role ? ` (${option.role})` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
