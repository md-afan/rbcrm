"use client";

import { useActionState, useEffect } from "react";
import { X } from "lucide-react";
import { upsertLeadAction, type LeadActionState } from "@/app/actions/leads";
import {
  callerSectionFields,
  demoSectionFields,
  leadSectionFields,
  ownerSectionFields,
  roleLabels
} from "@/lib/constants";
import { cn, toTitleCase } from "@/lib/utils";
import {
  demoStatuses,
  leadQualities,
  leadStatuses,
  planOptions,
  paymentStatuses
} from "@/types/crm";
import type { LeadFormMode, LeadRecord, UserProfile } from "@/types/crm";

const initialState: LeadActionState = {
  error: "",
  success: false
};

const fieldLabels: Record<string, string> = {
  group_id: "Group",
  business_name: "Business Name",
  business_type: "Business Type",
  owner_name: "Owner Name",
  phone: "Phone",
  city: "City",
  address: "Address",
  location: "Location",
  source: "Source",
  lead_quality: "Lead Quality",
  assigned_to: "Assigned To",
  status: "Status",
  interest: "Interest",
  budget: "Budget",
  attempts_count: "Attempts Count",
  next_followup_date: "Next Follow-up Date",
  demo_status: "Demo Status",
  demo_feedback: "Demo Feedback",
  deal_closed: "Deal Closed",
  selected_plan: "Selected Plan",
  deal_amount: "Deal Amount",
  discount_given: "Discount Given (%)",
  payment_status: "Payment Status",
  advance_amount: "Advance Amount",
  closing_date: "Closing Date",
  lost_reason: "Lost Reason",
  final_remarks: "Final Remarks"
};

export function LeadEditorDrawer({
  open,
  mode,
  lead,
  profile,
  groupOptions,
  assigneeOptions,
  groups,
  users,
  onClose
}: {
  open: boolean;
  mode: LeadFormMode;
  lead: LeadRecord | null;
  profile: UserProfile;
  groupOptions: { label: string; value: string }[];
  assigneeOptions: { label: string; value: string }[];
  groups: Array<{
    id: string;
    group_name: string;
    lead_user_id: string;
    caller_user_id: string;
    demo_user_id: string;
    created_at: string;
  }>;
  users: Array<{ id: string; name: string; role: string }>;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(upsertLeadAction, initialState);
  const sections = getRoleSectionsByMode(profile.role, mode);
  const activeGroup = lead ? groups.find((group) => group.id === lead.group_id) ?? null : null;
  const roleTheme = getRoleTheme(profile.role);

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [onClose, state.success]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/45 backdrop-blur-sm sm:items-stretch">
      <div className="h-[92vh] w-full overflow-y-auto rounded-t-[2rem] border border-black/10 bg-white p-4 shadow-2xl sm:h-full sm:max-w-2xl sm:rounded-none sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={cn("text-sm uppercase tracking-[0.2em]", roleTheme.kickerClass)}>
              {roleLabels[profile.role]}
            </p>
            <h2 className="mt-2 font-[var(--font-display)] text-xl font-semibold sm:text-2xl">
              {mode === "create" ? "Create lead" : `Update ${lead?.business_name ?? "record"}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-black/10 p-2 text-ink/60 transition hover:bg-neutral-100"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className={cn("mt-5 rounded-[1.75rem] border px-4 py-4", roleTheme.bannerClass)}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em]">Update lane</p>
          <p className="mt-2 text-sm leading-6">
            {roleTheme.description}
          </p>
        </div>

        <form
          action={(formData) => {
            action({
              mode,
              leadId: lead?.id,
              values: Object.fromEntries(formData.entries())
            });
          }}
          className="mt-6 space-y-6"
        >
          {profile.role === "owner" && activeGroup ? (
            <section className="space-y-4 rounded-[1.75rem] border border-black/10 bg-neutral-50 p-4 sm:p-5">
              <div>
                <h3 className="font-semibold text-ink">Assigned group members</h3>
                <p className="text-sm text-ink/55">
                  Team working on this lead under {activeGroup.group_name}.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <MemberCard
                  label="Lead"
                  user={users.find((user) => user.id === activeGroup.lead_user_id)}
                  fallbackId={activeGroup.lead_user_id}
                />
                <MemberCard
                  label="Caller"
                  user={users.find((user) => user.id === activeGroup.caller_user_id)}
                  fallbackId={activeGroup.caller_user_id}
                />
                <MemberCard
                  label="Demo"
                  user={users.find((user) => user.id === activeGroup.demo_user_id)}
                  fallbackId={activeGroup.demo_user_id}
                />
              </div>
            </section>
          ) : null}

          {sections.map((section) => (
            <section
              key={section.title}
              className={cn(
                "space-y-4 rounded-[1.75rem] border p-4 sm:p-5",
                roleTheme.sectionClass
              )}
            >
              <div>
                <h3 className="font-semibold text-ink">{section.title}</h3>
                <p className="text-sm text-ink/55">{section.description}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <label key={field} className={cn("block space-y-2", field.includes("notes") && "sm:col-span-2")}>
                    <span className="text-sm font-medium text-ink/70">
                      {fieldLabels[field] ?? toTitleCase(field)}
                    </span>
                    <FieldInput
                      field={field}
                      value={readValue(lead, field)}
                      groupOptions={groupOptions}
                      assigneeOptions={assigneeOptions}
                      users={users}
                    />
                  </label>
                ))}
              </div>
            </section>
          ))}

          {state.error ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className={cn(
              "w-full rounded-2xl px-5 py-3 font-medium transition disabled:opacity-75",
              roleTheme.buttonClass
            )}
          >
            {pending ? "Saving..." : mode === "create" ? "Create lead" : "Save updates"}
          </button>
        </form>
      </div>
    </div>
  );
}

function getRoleTheme(role: UserProfile["role"]) {
  switch (role) {
    case "lead":
      return {
        kickerClass: "text-black/55",
        bannerClass: "border-black bg-black text-white",
        sectionClass: "border-black/10 bg-white",
        buttonClass: "bg-black text-white hover:bg-neutral-800",
        description: "Lead role can capture and refine foundational business information only."
      };
    case "caller":
      return {
        kickerClass: "text-black/55",
        bannerClass: "border-black/10 bg-neutral-100 text-black",
        sectionClass: "border-black/10 bg-neutral-50",
        buttonClass: "bg-neutral-900 text-white hover:bg-black",
        description: "Caller role focuses on qualification, contact movement, and follow-up planning."
      };
    case "demo":
      return {
        kickerClass: "text-black/55",
        bannerClass: "border-black/10 bg-neutral-200 text-black",
        sectionClass: "border-black/10 bg-white",
        buttonClass: "bg-black text-white hover:bg-neutral-700",
        description: "Demo role handles demo outcomes, buyer readiness, and feedback capture."
      };
    default:
      return {
        kickerClass: "text-black/55",
        bannerClass: "border-black bg-black text-white",
        sectionClass: "border-black/10 bg-neutral-50",
        buttonClass: "bg-black text-white hover:bg-neutral-800",
        description: "Owner role can manage the full lifecycle, payment state, and group oversight."
      };
  }
}

function MemberCard({
  label,
  user,
  fallbackId
}: {
  label: string;
  user: { id: string; name: string; role: string } | undefined;
  fallbackId: string;
}) {
  const code = (user?.id ?? fallbackId).slice(0, 8).toUpperCase();

  return (
    <div className="rounded-[1.4rem] border border-ink/10 bg-white/90 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">{label}</p>
      <p className="mt-2 font-medium text-ink">{user?.name ?? "Unknown member"}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ink/45">
        {user?.role ?? "unassigned"}
      </p>
      <p className="mt-3 text-sm font-semibold text-ocean">Code: {code}</p>
    </div>
  );
}

function getRoleSectionsByMode(role: UserProfile["role"], mode: LeadFormMode) {
  if (mode === "create") {
    return [
      {
        title: "Lead form",
        description: "Create and enrich new leads with initial business details.",
        fields: leadSectionFields.filter((field) => field !== "lead_by")
      }
    ];
  }

  if (role === "owner") {
    return [
      {
        title: "Lead section",
        description: "Foundational business capture fields.",
        fields: leadSectionFields.filter((field) => field !== "lead_by")
      },
      {
        title: "Caller section",
        description: "Qualification, contact attempts, and follow-up planning.",
        fields: callerSectionFields.filter((field) => field !== "assigned_to")
      },
      {
        title: "Demo section",
        description: "Scheduling, delivery status, objections, and feedback.",
        fields: [...demoSectionFields]
      },
      {
        title: "Owner section",
        description: "Closure, payment, and retention details.",
        fields: [...ownerSectionFields]
      }
    ];
  }

  if (role === "caller") {
    return [
      {
        title: "Caller panel",
        description: "Update interaction status, notes, follow-up, and attempts.",
        fields: callerSectionFields.filter((field) => field !== "assigned_to")
      }
    ];
  }

  if (role === "demo") {
    return [
      {
        title: "Demo panel",
        description: "Schedule demos and capture readiness feedback.",
        fields: [...demoSectionFields]
      }
    ];
  }

  return [
    {
      title: "Lead form",
      description: "Create and enrich new leads with initial business details.",
      fields: leadSectionFields.filter((field) => field !== "lead_by")
    }
  ];
}

function readValue(lead: LeadRecord | null, field: string) {
  const value = lead?.[field as keyof LeadRecord];
  return value === null || value === undefined ? "" : String(value);
}

function FieldInput({
  field,
  value,
  groupOptions,
  assigneeOptions,
  users
}: {
  field: string;
  value: string;
  groupOptions: { label: string; value: string }[];
  assigneeOptions: { label: string; value: string }[];
  users: Array<{ id: string; name: string; role: string }>;
}) {
  const commonClassName =
    "w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-ocean";

  if (field === "group_id") {
    return (
      <select name={field} defaultValue={value} className={commonClassName}>
        <option value="">Select group</option>
        {groupOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field === "assigned_to") {
    return (
      <select name={field} defaultValue={value} className={commonClassName}>
        <option value="">Auto assign from group</option>
        {assigneeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.includes("notes") || field.includes("summary") || field.includes("feedback") || field.includes("remarks") || field.includes("reason") || field === "address") {
    return <textarea name={field} defaultValue={value} className={cn(commonClassName, "min-h-28 resize-y")} />;
  }

  if (field.includes("date")) {
    return <input name={field} type="datetime-local" defaultValue={value ? value.slice(0, 16) : ""} className={commonClassName} />;
  }

  if (["deal_amount", "attempts_count", "discount_given", "advance_amount"].includes(field)) {
    return (
      <input
        name={field}
        type="number"
        min="0"
        max={field === "discount_given" ? "100" : undefined}
        step={field === "attempts_count" ? "1" : "0.01"}
        placeholder={
          field === "deal_amount"
            ? "Enter deal amount"
            : field === "discount_given"
              ? "Enter discount percentage"
              : undefined
        }
        defaultValue={value}
        className={commonClassName}
      />
    );
  }

  if (field === "selected_plan") {
    return <SelectField field={field} value={value} options={planOptions} />;
  }

  if (field === "lead_quality") {
    return <SelectField field={field} value={value} options={leadQualities} />;
  }

  if (field === "status") {
    return <SelectField field={field} value={value} options={leadStatuses} />;
  }

  if (field === "demo_status") {
    return <SelectField field={field} value={value} options={demoStatuses} />;
  }

  if (field === "payment_status") {
    return <SelectField field={field} value={value} options={paymentStatuses} />;
  }

  if (field === "deal_closed") {
    return (
      <select name={field} defaultValue={value} className={commonClassName}>
        <option value="">Not set</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }

  return <input name={field} defaultValue={value} className={commonClassName} />;
}

function SelectField({
  field,
  value,
  options
}: {
  field: string;
  value: string;
  options: readonly string[];
}) {
  return (
    <select name={field} defaultValue={value} className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-ocean">
      <option value="">Select</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
