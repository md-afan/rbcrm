import {
  Building2,
  CircleDashed,
  CircleDollarSign,
  Headphones,
  Presentation,
  ShieldCheck
} from "lucide-react";
import type { LeadStatus, UserRole } from "@/types/crm";

export const roleLabels: Record<UserRole, string> = {
  lead: "Lead Generator",
  caller: "Caller",
  demo: "Demo Team",
  owner: "Owner"
};

export const roleDescriptions: Record<UserRole, string> = {
  lead: "Capture leads and route them into the right group pipeline.",
  caller: "Drive response, qualification, follow-ups, and demo readiness.",
  demo: "Handle scheduling, demo delivery, objections, and buyer readiness.",
  owner: "Manage groups, oversee revenue, and control the full system."
};

export const statusStyles: Record<LeadStatus, string> = {
  New: "bg-white text-ink border border-black/10",
  Interested: "bg-black text-white",
  "Follow-up": "bg-neutral-200 text-black",
  Demo: "bg-neutral-300 text-black",
  Closed: "bg-black text-white",
  Lost: "bg-neutral-800 text-white"
};

export const progressSteps = [
  { key: "lead", label: "Lead", icon: Building2 },
  { key: "caller", label: "Caller", icon: Headphones },
  { key: "demo", label: "Demo", icon: Presentation },
  { key: "owner", label: "Owner", icon: CircleDollarSign }
] as const;

export const metricIcons = {
  leads: Building2,
  followups: CircleDashed,
  demos: Presentation,
  revenue: ShieldCheck
};

export const leadSectionFields = [
  "group_id",
  "business_name",
  "business_type",
  "owner_name",
  "phone",
  "city",
  "address",
  "location",
  "lead_by",
  "source",
  "lead_quality"
] as const;

export const callerSectionFields = [
  "assigned_to",
  "status",
  "interest",
  "budget",
  "attempts_count",
  "next_followup_date"
] as const;

export const demoSectionFields = [
  "demo_status",
  "demo_feedback"
] as const;

export const ownerSectionFields = [
  "deal_closed",
  "selected_plan",
  "deal_amount",
  "discount_given",
  "payment_status",
  "advance_amount",
  "closing_date",
  "lost_reason",
  "final_remarks"
] as const;
