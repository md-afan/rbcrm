export const userRoles = ["lead", "caller", "demo", "owner"] as const;
export type UserRole = (typeof userRoles)[number];

export function normalizeUserRole(role: string | null | undefined): UserRole {
  if (role === "coller") {
    return "caller";
  }

  if (role === "lead_generator") {
    return "lead";
  }

  if (role === "creater" || role === "creator") {
    return "lead";
  }

  if (role && (userRoles as readonly string[]).includes(role)) {
    return role as UserRole;
  }

  return "lead";
}

export const leadQualities = ["High", "Medium", "Low"] as const;
export type LeadQuality = (typeof leadQualities)[number];

export const priorities = ["High", "Medium", "Low"] as const;
export type Priority = (typeof priorities)[number];

export const leadStatuses = [
  "New",
  "Interested",
  "Follow-up",
  "Demo",
  "Closed",
  "Lost"
] as const;
export type LeadStatus = (typeof leadStatuses)[number];

export const demoStatuses = ["Pending", "Done", "Cancelled"] as const;
export type DemoStatus = (typeof demoStatuses)[number];

export const paymentStatuses = ["Pending", "Partial", "Paid"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export const planOptions = ["Basic", "Standard", "Premium"] as const;
export type PlanOption = (typeof planOptions)[number];

export type LeadFormMode = "create" | "edit";

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
};

export type GroupRecord = {
  id: string;
  group_name: string;
  lead_user_id: string;
  caller_user_id: string;
  demo_user_id: string;
  created_at: string;
};

export type LeadRecord = {
  id: string;
  group_id: string | null;
  business_name: string;
  business_type: string | null;
  owner_name: string;
  phone: string;
  city: string | null;
  address: string | null;
  location: string;
  source: string;
  lead_by: string | null;
  lead_quality: LeadQuality;
  assigned_to: string | null;
  status: LeadStatus;
  interest: string | null;
  budget: string | null;
  attempts_count: number;
  next_followup_date: string | null;
  demo_status: DemoStatus | null;
  demo_feedback: string | null;
  deal_closed: boolean;
  deal_amount: number | null;
  selected_plan: PlanOption | null;
  discount_given: number | null;
  payment_status: PaymentStatus | null;
  advance_amount: number | null;
  balance_amount: number | null;
  lead_commission: number | null;
  caller_commission: number | null;
  demo_commission: number | null;
  total_commission: number | null;
  admin_profit: number | null;
  closing_date: string | null;
  lost_reason: string | null;
  final_remarks: string | null;
  created_at: string;
  group?: GroupRecord | null;
};

export type TransactionRole = "lead" | "caller" | "demo";

export type TransactionRecord = {
  id: string;
  lead_id: string;
  user_id: string;
  role: TransactionRole;
  amount: number;
  created_at: string;
  lead?: Pick<LeadRecord, "id" | "business_name" | "group_id"> | null;
};

export type EarningsSummary = {
  totalEarnings: number;
  monthlyEarnings: number;
  dealsCount: number;
  totalRevenue?: number;
  totalCommission?: number;
  netProfit?: number;
  primaryLabel: string;
  secondaryLabel: string;
};

export type DashboardMetric = {
  label: string;
  value: string;
  tone: "default" | "success" | "warning" | "accent";
  helper: string;
};

export type FilterOption = {
  label: string;
  value: string;
};

export type FilterOptions = {
  statuses: FilterOption[];
  groups: FilterOption[];
  leadOwners: FilterOption[];
  assignees: FilterOption[];
};
