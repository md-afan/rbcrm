import { format, isToday, parseISO } from "date-fns";
import { getFinalDealAmount, isCommissionEligible } from "@/lib/finance";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import type { Database } from "@/types/database";
import { normalizeUserRole } from "@/types/crm";
import type {
  DashboardMetric,
  EarningsSummary,
  FilterOptions,
  GroupRecord,
  LeadRecord,
  LeadStatus,
  TransactionRecord,
  UserProfile,
  UserRole
} from "@/types/crm";

export class MissingSchemaError extends Error {
  constructor(message = "Supabase CRM schema is missing.") {
    super(message);
    this.name = "MissingSchemaError";
  }
}

function isMissingSchemaMessage(message: string) {
  return (
    message.includes("Could not find the table") ||
    message.includes("schema cache") ||
    message.includes("relation") ||
    message.includes("does not exist")
  );
}

type GetLeadsOptions = {
  role: UserRole;
  userId: string;
  limit?: number;
  search?: string;
  status?: string;
  groupId?: string;
  assignedTo?: string;
  leadBy?: string;
};

type GetTransactionsOptions = {
  profile: UserProfile;
  limit?: number;
};

async function getScopedGroups(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  role: UserRole,
  userId: string
) {
  let query = supabase.from("groups").select("*").order("group_name");

  if (role !== "owner") {
    const membershipColumn =
      role === "lead" ? "lead_user_id" : role === "caller" ? "caller_user_id" : "demo_user_id";

    query = query.eq(membershipColumn, userId);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingSchemaMessage(error.message)) {
      throw new MissingSchemaError(error.message);
    }

    throw new Error(error.message);
  }

  return (data ?? []) as GroupRecord[];
}

export async function getLeads(options: GetLeadsOptions) {
  const supabase = await createSupabaseServerClient();
  const accessibleGroups = await getScopedGroups(supabase, options.role, options.userId);
  const accessibleGroupIds = accessibleGroups.map((group) => group.id);

  if (options.role !== "owner" && !accessibleGroupIds.length) {
    return [];
  }

  let query = supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (options.role !== "owner") {
    query = query.in("group_id", accessibleGroupIds);
  }

  if (options.search) {
    query = query.or(
      `business_name.ilike.%${options.search}%,business_type.ilike.%${options.search}%,owner_name.ilike.%${options.search}%,phone.ilike.%${options.search}%,location.ilike.%${options.search}%,city.ilike.%${options.search}%,address.ilike.%${options.search}%`
    );
  }

  if (options.status) {
    query = query.eq("status", options.status as LeadStatus);
  }

  if (options.groupId) {
    query = query.eq("group_id", options.groupId);
  }

  if (options.assignedTo) {
    query = query.eq("assigned_to", options.assignedTo);
  }

  if (options.leadBy) {
    query = query.eq("lead_by", options.leadBy);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingSchemaMessage(error.message)) {
      throw new MissingSchemaError(error.message);
    }

    throw new Error(error.message);
  }

  return (data ?? []) as LeadRecord[];
}

export async function getDashboardMetrics(profile: UserProfile): Promise<DashboardMetric[]> {
  const leads = await getLeads({
    role: profile.role,
    userId: profile.id
  });
  const transactions = await getTransactions({ profile, limit: 500 });

  const groupVisibleLeads = leads;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const totalEarnings = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthlyEarnings = transactions
    .filter((transaction) => {
      const transactionDate = new Date(transaction.created_at);
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
    })
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  if (profile.role === "owner") {
    const eligibleLeads = groupVisibleLeads.filter(isCommissionEligible);
    const totalRevenue = eligibleLeads.reduce(
      (sum, lead) => sum + (getFinalDealAmount(lead.deal_amount, lead.discount_given) ?? 0),
      0
    );
    const totalCommission = eligibleLeads.reduce(
      (sum, lead) => sum + (lead.total_commission ?? 0),
      0
    );
    const netProfit = eligibleLeads.reduce((sum, lead) => sum + (lead.admin_profit ?? 0), 0);

    return [
      {
        label: "Total deals",
        value: String(eligibleLeads.length),
        helper: "Closed deals with commission posted.",
        tone: "default"
      },
      {
        label: "Total revenue",
        value: formatCurrency(totalRevenue),
        helper: "Final amount from closed deals.",
        tone: "success"
      },
      {
        label: "Total commission",
        value: formatCurrency(totalCommission),
        helper: "Payout distributed across lead, caller, and demo roles.",
        tone: "warning"
      },
      {
        label: "Net profit",
        value: formatCurrency(netProfit),
        helper: "Final amount minus total commission for paid deals.",
        tone: "accent"
      }
    ];
  }

  if (profile.role === "lead") {
    const generatedLeads = groupVisibleLeads.filter((lead) => lead.lead_by === profile.id).length;

    return [
      {
        label: "Total leads generated",
        value: String(generatedLeads),
        helper: "Leads captured by you inside your assigned groups.",
        tone: "default"
      },
      {
        label: "Total earnings",
        value: formatCurrency(totalEarnings),
        helper: "Your 6% commission posted after deal closure.",
        tone: "success"
      },
      {
        label: "Monthly earnings",
        value: formatCurrency(monthlyEarnings),
        helper: "Commission earned this month.",
        tone: "warning"
      },
      {
        label: "Commission history",
        value: String(transactions.length),
        helper: "Paid commission entries available in your ledger.",
        tone: "accent"
      }
    ];
  }

  if (profile.role === "caller") {
    const handledLeads = groupVisibleLeads.filter((lead) => lead.assigned_to === profile.id).length;
    const convertedDeals = groupVisibleLeads.filter(
      (lead) => lead.assigned_to === profile.id && isCommissionEligible(lead)
    ).length;

    return [
      {
        label: "Calls handled",
        value: String(handledLeads),
        helper: "Lead rows currently assigned to you as caller.",
        tone: "default"
      },
      {
        label: "Deals converted",
        value: String(convertedDeals),
        helper: "Your closed deals eligible for commission.",
        tone: "success"
      },
      {
        label: "Total earnings",
        value: formatCurrency(totalEarnings),
        helper: "Your 7% caller commission posted so far.",
        tone: "warning"
      },
      {
        label: "Monthly earnings",
        value: formatCurrency(monthlyEarnings),
        helper: "Caller commissions credited this month.",
        tone: "accent"
      }
    ];
  }

  const completedDemos = groupVisibleLeads.filter((lead) => lead.demo_status === "Done").length;
  const closedDeals = groupVisibleLeads.filter(isCommissionEligible).length;

  return [
    {
      label: "Demos completed",
      value: String(completedDemos),
      helper: "Leads where demo status is marked done.",
      tone: "default"
    },
      {
        label: "Deals closed",
        value: String(closedDeals),
        helper: "Closed deals credited to your demo team lane.",
        tone: "success"
      },
      {
        label: "Total earnings",
        value: formatCurrency(totalEarnings),
        helper: "Your 7% demo commission posted so far.",
        tone: "warning"
      },
    {
      label: "Monthly earnings",
      value: formatCurrency(monthlyEarnings),
      helper: "Demo commissions credited this month.",
      tone: "accent"
    }
  ];
}

export async function getTransactions({ profile, limit = 24 }: GetTransactionsOptions) {
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("transactions").select("*").order("created_at", { ascending: false });

  if (profile.role !== "owner") {
    query = query.eq("user_id", profile.id);
  }

  query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    if (isMissingSchemaMessage(error.message)) {
      throw new MissingSchemaError(error.message);
    }

    throw new Error(error.message);
  }

  const transactions = (data ?? []) as TransactionRecord[];

  if (!transactions.length) {
    return [];
  }

  const leadIds = Array.from(new Set(transactions.map((transaction) => transaction.lead_id)));
  const leadsResponse = await supabase
    .from("leads")
    .select("id, business_name, group_id")
    .in("id", leadIds);

  if (leadsResponse.error) {
    if (isMissingSchemaMessage(leadsResponse.error.message)) {
      throw new MissingSchemaError(leadsResponse.error.message);
    }

    throw new Error(leadsResponse.error.message);
  }

  const leadMap = new Map(
    ((leadsResponse.data ?? []) as Array<Pick<LeadRecord, "id" | "business_name" | "group_id">>).map((lead) => [
      lead.id,
      lead
    ])
  );

  return transactions.map((transaction) => ({
    ...transaction,
    lead: leadMap.get(transaction.lead_id) ?? null
  }));
}

export async function getEarningsSummary(profile: UserProfile): Promise<EarningsSummary> {
  const [leads, transactions] = await Promise.all([
    getLeads({ role: profile.role, userId: profile.id }),
    getTransactions({ profile, limit: 500 })
  ]);

  const totalEarnings = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const now = new Date();
  const monthlyEarnings = transactions
    .filter((transaction) => {
      const transactionDate = new Date(transaction.created_at);
      return (
        transactionDate.getMonth() === now.getMonth() &&
        transactionDate.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  if (profile.role === "owner") {
    const eligibleLeads = leads.filter(isCommissionEligible);
    const totalRevenue = eligibleLeads.reduce(
      (sum, lead) => sum + (getFinalDealAmount(lead.deal_amount, lead.discount_given) ?? 0),
      0
    );
    const totalCommission = eligibleLeads.reduce(
      (sum, lead) => sum + (lead.total_commission ?? 0),
      0
    );
    const netProfit = eligibleLeads.reduce((sum, lead) => sum + (lead.admin_profit ?? 0), 0);

    return {
      totalEarnings: 0,
      monthlyEarnings: 0,
      dealsCount: eligibleLeads.length,
      totalRevenue,
      totalCommission,
      netProfit,
      primaryLabel: "Commission distributed",
      secondaryLabel: "Net profit retained"
    };
  }

  return {
    totalEarnings,
    monthlyEarnings,
    dealsCount: transactions.length,
    primaryLabel: "Total earnings",
    secondaryLabel: "Monthly earnings"
  };
}

export async function getFilterOptions(profile: UserProfile): Promise<FilterOptions> {
  const supabase = await createSupabaseServerClient();
  const groups = await getScopedGroups(supabase, profile.role, profile.id);
  const groupIds = groups.map((group) => group.id);
  const memberIds = Array.from(
    new Set(
      groups.flatMap((group) => [group.lead_user_id, group.caller_user_id, group.demo_user_id])
    )
  );

  const [usersResponse, statusesResponse] = await Promise.all([
    profile.role === "owner"
      ? supabase.from("users").select("id, name, role").order("name")
      : memberIds.length
        ? supabase.from("users").select("id, name, role").in("id", memberIds).order("name")
        : Promise.resolve({ data: [], error: null }),
    profile.role === "owner"
      ? supabase.from("leads").select("status")
      : groupIds.length
        ? supabase.from("leads").select("status").in("group_id", groupIds)
        : Promise.resolve({ data: [], error: null })
  ]);

  if (usersResponse.error && isMissingSchemaMessage(usersResponse.error.message)) {
    throw new MissingSchemaError(usersResponse.error.message);
  }

  if (statusesResponse.error && isMissingSchemaMessage(statusesResponse.error.message)) {
    throw new MissingSchemaError(statusesResponse.error.message);
  }

  const users =
    (usersResponse.data as Database["public"]["Tables"]["users"]["Row"][] | null) ?? [];
  const statuses = (statusesResponse.data as Array<{ status: LeadStatus }> | null) ?? [];
  const uniqueStatuses = Array.from(
    new Set(statuses.map((row) => row.status))
  ).filter(Boolean);

  return {
    statuses: uniqueStatuses.map((value) => ({ label: value, value })),
    groups: groups.map((group) => ({
      label: group.group_name,
      value: group.id
    })),
    leadOwners: users.map((user) => ({
      label: user.name,
      value: user.id
    })),
    assignees: users
      .filter((user) => user.role === "caller")
      .map((user) => ({
        label: user.name,
        value: user.id
      }))
  };
}

export async function getUsers() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("users").select("id, name, email, role").order("name");

  if (error) {
    if (isMissingSchemaMessage(error.message)) {
      throw new MissingSchemaError(error.message);
    }

    throw new Error(error.message);
  }

  const users = ((data ?? []) as Array<{ id: string; name: string; email: string; role: string }>).map((user) => ({
    ...user,
    role: normalizeUserRole(user.role)
  }));

  const legacyProfilesTable = supabase.from("profiles") as unknown as {
    select: (
      columns: string
    ) => {
      order: (
        column: string
      ) => Promise<{
        data: Array<{ id: string; full_name: string; role: string }> | null;
        error: { message: string } | null;
      }>;
    };
  };

  const legacyResponse = await legacyProfilesTable
    .select("id, full_name, role")
    .order("full_name");

  if (legacyResponse.error) {
    return users;
  }

  const merged = new Map<string, { id: string; name: string; email: string; role: string }>();

  users.forEach((user) => {
    merged.set(user.id, user);
  });

  (legacyResponse.data ?? []).forEach((user) => {
    if (!merged.has(user.id)) {
      merged.set(user.id, {
        id: user.id,
        name: user.full_name,
        email: "",
        role: normalizeUserRole(user.role)
      });
    }
  });

  return Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getGroups() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("groups").select("*").order("created_at", { ascending: false });

  if (error) {
    if (isMissingSchemaMessage(error.message)) {
      throw new MissingSchemaError(error.message);
    }

    throw new Error(error.message);
  }

  return (data ?? []) as GroupRecord[];
}

export function describeLeadTask(lead: LeadRecord) {
  if (lead.status === "Follow-up" && lead.next_followup_date) {
    return `Follow up on ${format(parseISO(lead.next_followup_date), "dd MMM, p")}`;
  }

  if (lead.demo_status === "Pending") {
    return "Demo is pending completion";
  }

  if (lead.deal_closed) {
    return "Closed deal in payment tracking";
  }

  return "Lead needs next action";
}
