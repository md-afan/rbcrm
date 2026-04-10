"use client";

import { format } from "date-fns";
import { PencilLine } from "lucide-react";
import { ProgressTracker } from "@/components/progress/progress-tracker";
import { Badge } from "@/components/ui/badge";
import { statusStyles } from "@/lib/constants";
import { getBalanceAmount, getFinalDealAmount } from "@/lib/finance";
import { formatCurrency } from "@/lib/utils";
import type { LeadRecord, UserProfile } from "@/types/crm";

export function CrmTable({
  leads,
  profile,
  onOpen
}: {
  leads: LeadRecord[];
  profile: UserProfile;
  onOpen: (lead: LeadRecord) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:hidden">
        {leads.length ? (
          leads.map((lead) => (
            <article key={lead.id} className="border border-black/10 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{lead.business_name}</p>
                  <p className="mt-1 text-sm text-ink/60">{lead.owner_name}</p>
                  <p className="mt-1 text-sm text-ink/45">{lead.phone}</p>
                </div>
                <Badge className={statusStyles[lead.status]}>{lead.status}</Badge>
              </div>

              <div className="mt-4 grid gap-3 border border-black/10 bg-neutral-50 p-4 text-sm text-ink/70 sm:grid-cols-2">
                <div>
                  <p className="text-ink/45">Location</p>
                  <p className="mt-1">{lead.location}</p>
                </div>
                <div>
                  <p className="text-ink/45">Source</p>
                  <p className="mt-1">{lead.source}</p>
                </div>
                <div>
                  <p className="text-ink/45">Demo</p>
                  <p className="mt-1">{lead.demo_status ?? "Pending"}</p>
                </div>
                <div>
                  <p className="text-ink/45">Revenue</p>
                  <p className="mt-1 font-semibold text-ink">
                    {formatCurrency(getFinalDealAmount(lead.deal_amount, lead.discount_given))}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <ProgressTracker lead={lead} />
              </div>

              <button
                onClick={() => onOpen(lead)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 border border-ink/10 px-4 py-3 text-sm font-medium text-ink transition hover:bg-neutral-50"
              >
                <PencilLine className="size-4" />
                {profile.role === "owner" ? "Manage Lead" : "Update Lead"}
              </button>
            </article>
          ))
        ) : (
          <div className="border border-black/10 px-5 py-10 text-center text-sm text-ink/55">
            No rows match the current filters.
          </div>
        )}
      </div>

      <div className="table-shell hidden lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-[1240px] w-full border-collapse">
            <thead className="sticky top-0 z-10 border-b border-black/10 bg-white text-left text-xs uppercase tracking-[0.18em] text-ink/50">
              <tr>
                {[
                  "Business",
                  "Lead",
                  "Caller",
                  "Demo",
                  "Owner",
                  "Progress",
                  "Revenue",
                  "Action"
                ].map((column) => (
                  <th key={column} className="px-4 py-4 font-medium">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10 bg-white">
              {leads.map((lead) => (
                <tr key={lead.id} className="align-top transition hover:bg-neutral-50">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-ink">{lead.business_name}</p>
                    <p className="mt-1 text-sm text-ink/60">{lead.owner_name}</p>
                    <p className="mt-1 text-sm text-ink/45">{lead.phone}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-ink/70">
                    <p>{lead.source}</p>
                    <p className="mt-2">{lead.location}</p>
                    <p className="mt-2 text-ink/45">
                      {format(new Date(lead.created_at), "dd MMM yyyy")}
                    </p>
                  </td>
                  <td className="space-y-3 px-4 py-4 text-sm text-ink/70">
                    <Badge className={statusStyles[lead.status]}>{lead.status}</Badge>
                    <p className="mt-3">Attempts: {lead.attempts_count}</p>
                    <p className="mt-1 text-ink/55">
                      Follow-up:{" "}
                      {lead.next_followup_date
                        ? format(new Date(lead.next_followup_date), "dd MMM")
                        : "Not set"}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-sm text-ink/70">
                    <p>Status: {lead.demo_status ?? "Pending"}</p>
                    <p className="mt-2 text-ink/55">{lead.demo_feedback ?? "Awaiting demo update"}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-ink/70">
                    <p>{lead.deal_closed ? "Closed" : "Open deal"}</p>
                    <p className="mt-2">{lead.payment_status ?? "Pending payment"}</p>
                    <p className="mt-2 text-ink/55">
                      {lead.selected_plan ?? lead.budget ?? lead.interest ?? "No plan selected"}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <ProgressTracker lead={lead} />
                  </td>
                  <td className="px-4 py-4 text-sm text-ink/70">
                    <p className="font-semibold text-ink">
                      {formatCurrency(getFinalDealAmount(lead.deal_amount, lead.discount_given))}
                    </p>
                    <p className="mt-2 text-ink/55">
                      Balance {formatCurrency(getBalanceAmount(lead))}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => onOpen(lead)}
                      className="inline-flex items-center gap-2 border border-ink/10 px-3 py-2 text-sm font-medium text-ink transition hover:bg-neutral-100"
                    >
                      <PencilLine className="size-4" />
                      {profile.role === "owner" ? "Manage" : "Update"}
                    </button>
                  </td>
                </tr>
              ))}
              {!leads.length ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-ink/55">
                    No rows match the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
