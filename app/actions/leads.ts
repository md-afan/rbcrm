"use server";

import { revalidatePath } from "next/cache";
import { ensurePublicUserFromAuthUser, getCurrentUserProfile } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  assertRoleCanEditPayload,
  buildLeadPayload,
  leadInsertSchema,
  prunePayloadByRole,
  leadUpdateSchema,
  validateDealClosure,
  validatePipelineState,
  validatePipelineStateWithTouches
} from "@/lib/validation";
import type { LeadInsert, LeadUpdate } from "@/types/database";
import type { LeadFormMode } from "@/types/crm";

export type LeadActionState = {
  error: string;
  success: boolean;
};

type CommissionableLead = {
  id: string;
  group_id: string | null;
  deal_closed: boolean;
  deal_amount: number | null;
  discount_given: number | null;
};

type GroupMembers = {
  lead_user_id: string;
  caller_user_id: string;
  demo_user_id: string;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function omitFields<T extends Record<string, unknown>>(payload: T, fields: string[]) {
  const blocked = new Set(fields);

  return Object.fromEntries(
    Object.entries(payload).filter(([field]) => !blocked.has(field))
  ) as T;
}

function normalizeFieldValueForComparison(field: string, value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "string" && field.includes("date")) {
    return value.slice(0, 16);
  }

  return String(value);
}

function omitUnchangedFields(
  payload: LeadUpdate,
  existingLead: Record<string, unknown>
): LeadUpdate {
  return Object.fromEntries(
    Object.entries(payload).filter(([field, nextValue]) => {
      const currentValue = existingLead[field];

      return (
        normalizeFieldValueForComparison(field, nextValue) !==
        normalizeFieldValueForComparison(field, currentValue)
      );
    })
  ) as LeadUpdate;
}

async function getGroupForLeadCreation(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  groupId: string | null | undefined
) {
  if (!groupId) {
    return {
      data: null,
      error: { message: "Group is required when creating a lead." }
    };
  }

  const groupsTable = supabase.from("groups") as unknown as {
    select: (
      columns: "id, lead_user_id, caller_user_id, demo_user_id"
    ) => {
      eq: (
        column: "id",
        value: string
      ) => {
        maybeSingle: () => Promise<{
          data: {
            id: string;
            lead_user_id: string;
            caller_user_id: string;
            demo_user_id: string;
          } | null;
          error: { message: string } | null;
        }>;
      };
    };
  };

  return await groupsTable
    .select("id, lead_user_id, caller_user_id, demo_user_id")
    .eq("id", groupId)
    .maybeSingle();
}

async function insertLead(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  payload: LeadInsert
) {
  const leadsTable = supabase.from("leads") as unknown as {
    insert: (
      value: LeadInsert
    ) => {
      select: (
        columns: "id"
      ) => { single: () => Promise<{ error: { message: string } | null; data: { id: string } | null }> };
    };
  };

  return await leadsTable.insert(payload).select("id").single();
}

async function updateLead(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  leadId: string | undefined,
  payload: LeadUpdate
) {
  const leadsTable = supabase.from("leads") as unknown as {
    update: (
      value: LeadUpdate
    ) => {
      eq: (
        column: "id",
        value: string | undefined
      ) => {
        select: (
          columns: "id"
        ) => { maybeSingle: () => Promise<{ error: { message: string } | null; data: { id: string } | null }> };
      };
    };
  };

  return await leadsTable.update(payload).eq("id", leadId).select("id").maybeSingle();
}

async function getLeadForCommissionSync(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  leadId: string
) {
  const leadsTable = supabase.from("leads") as unknown as {
    select: (
      columns: "id, group_id, deal_closed, deal_amount, discount_given"
    ) => {
      eq: (
        column: "id",
        value: string
      ) => {
        maybeSingle: () => Promise<{
          data: CommissionableLead | null;
          error: { message: string } | null;
        }>;
      };
    };
  };

  return await leadsTable
    .select("id, group_id, deal_closed, deal_amount, discount_given")
    .eq("id", leadId)
    .maybeSingle();
}

async function getGroupMembersForCommissionSync(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  groupId: string
) {
  const groupsTable = supabase.from("groups") as unknown as {
    select: (
      columns: "lead_user_id, caller_user_id, demo_user_id"
    ) => {
      eq: (
        column: "id",
        value: string
      ) => {
        maybeSingle: () => Promise<{
          data: GroupMembers | null;
          error: { message: string } | null;
        }>;
      };
    };
  };

  return await groupsTable
    .select("lead_user_id, caller_user_id, demo_user_id")
    .eq("id", groupId)
    .maybeSingle();
}

async function writeCommissionSnapshot(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  leadId: string,
  payload: Pick<
    LeadUpdate,
    "lead_commission" | "caller_commission" | "demo_commission" | "total_commission" | "admin_profit"
  >
) {
  const leadsTable = supabase.from("leads") as unknown as {
    update: (
      value: Pick<
        LeadUpdate,
        "lead_commission" | "caller_commission" | "demo_commission" | "total_commission" | "admin_profit"
      >
    ) => {
      eq: (
        column: "id",
        value: string
      ) => Promise<{ error: { message: string } | null }>;
    };
  };

  return await leadsTable.update(payload).eq("id", leadId);
}

async function replaceCommissionTransactions(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  leadId: string,
  group: GroupMembers,
  commissions: { lead: number; caller: number; demo: number }
) {
  const transactionsTable = supabase.from("transactions") as unknown as {
    delete: () => {
      eq: (
        column: "lead_id",
        value: string
      ) => Promise<{ error: { message: string } | null }>;
    };
    insert: (
      value: Array<{ lead_id: string; user_id: string; role: "lead" | "caller" | "demo"; amount: number }>
    ) => Promise<{ error: { message: string } | null }>;
  };

  const deleteResponse = await transactionsTable.delete().eq("lead_id", leadId);

  if (deleteResponse.error) {
    return deleteResponse;
  }

  return await transactionsTable.insert([
    { lead_id: leadId, user_id: group.lead_user_id, role: "lead", amount: commissions.lead },
    { lead_id: leadId, user_id: group.caller_user_id, role: "caller", amount: commissions.caller },
    { lead_id: leadId, user_id: group.demo_user_id, role: "demo", amount: commissions.demo }
  ]);
}

async function syncLeadCommissionDistribution(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  leadId: string
) {
  const leadResponse = await getLeadForCommissionSync(supabase, leadId);

  if (leadResponse.error) {
    throw new Error(leadResponse.error.message);
  }

  const lead = leadResponse.data;

  if (!lead) {
    throw new Error("Lead record not found for commission sync.");
  }

  if (!lead.group_id) {
    return;
  }

  if (lead.deal_closed !== true || lead.deal_amount === null) {
    const resetResponse = await writeCommissionSnapshot(supabase, leadId, {
      lead_commission: null,
      caller_commission: null,
      demo_commission: null,
      total_commission: null,
      admin_profit: null
    });

    if (resetResponse.error) {
      throw new Error(resetResponse.error.message);
    }

    const deleteResponse = await (supabase.from("transactions") as unknown as {
      delete: () => {
        eq: (
          column: "lead_id",
          value: string
        ) => Promise<{ error: { message: string } | null }>;
      };
    }).delete().eq("lead_id", leadId);

    if (deleteResponse.error) {
      throw new Error(deleteResponse.error.message);
    }

    return;
  }

  const finalAmount = roundCurrency(
    lead.deal_amount - (lead.deal_amount * Math.min(Math.max(lead.discount_given ?? 0, 0), 100)) / 100
  );
  const commissions = {
    lead: roundCurrency(finalAmount * 0.06),
    caller: roundCurrency(finalAmount * 0.07),
    demo: roundCurrency(finalAmount * 0.07)
  };
  const totalCommission = roundCurrency(commissions.lead + commissions.caller + commissions.demo);
  const adminProfit = roundCurrency(finalAmount - totalCommission);

  const snapshotResponse = await writeCommissionSnapshot(supabase, leadId, {
    lead_commission: commissions.lead,
    caller_commission: commissions.caller,
    demo_commission: commissions.demo,
    total_commission: totalCommission,
    admin_profit: adminProfit
  });

  if (snapshotResponse.error) {
    throw new Error(snapshotResponse.error.message);
  }

  const groupResponse = await getGroupMembersForCommissionSync(supabase, lead.group_id);

  if (groupResponse.error) {
    throw new Error(groupResponse.error.message);
  }

  if (!groupResponse.data) {
    throw new Error("Group members were not found for commission sync.");
  }

  const transactionResponse = await replaceCommissionTransactions(
    supabase,
    leadId,
    groupResponse.data,
    commissions
  );

  if (transactionResponse.error) {
    throw new Error(transactionResponse.error.message);
  }
}

export async function upsertLeadAction(
  _previousState: LeadActionState,
  input: {
    mode: LeadFormMode;
    leadId?: string;
    values: Record<string, unknown>;
  }
) {
  if (
    Object.prototype.hasOwnProperty.call(input.values, "balance_amount") &&
    input.values.balance_amount !== undefined &&
    input.values.balance_amount !== null &&
    input.values.balance_amount !== ""
  ) {
    return {
      error: "Balance amount is generated automatically and cannot be updated manually.",
      success: false
    };
  }

  const supabase = await createSupabaseServerClient();
  const profile = await getCurrentUserProfile();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const schema = input.mode === "create" ? leadInsertSchema : leadUpdateSchema;
  const parsed = schema.safeParse(input.values);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid lead data.",
      success: false
    };
  }

  let payload: LeadInsert | LeadUpdate;
  let existingLead: Record<string, unknown> | null = null;

  try {
    payload = buildLeadPayload(parsed.data, input.mode);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to save lead.",
      success: false
    };
  }

  if (input.mode === "create") {
    payload = omitFields(payload, [
      "deal_closed",
      "selected_plan",
      "deal_amount",
      "discount_given",
      "payment_status",
      "advance_amount",
      "closing_date",
      "lost_reason",
      "final_remarks"
    ]);
  }

  payload = prunePayloadByRole(profile.role, payload);
  const roleError = assertRoleCanEditPayload(profile.role, payload);

  if (roleError) {
    return { error: roleError, success: false };
  }

  if (input.mode === "edit") {
    if (!input.leadId) {
      return { error: "Lead ID is required for updates.", success: false };
    }

    const currentLeadResponse = await supabase
      .from("leads")
      .select("*")
      .eq("id", input.leadId)
      .maybeSingle();

    if (currentLeadResponse.error) {
      return { error: currentLeadResponse.error.message, success: false };
    }

    existingLead = currentLeadResponse.data as Record<string, unknown> | null;

    if (!existingLead) {
      return { error: "Lead record not found.", success: false };
    }
  }

  let error: { message: string } | null = null;

  if (input.mode === "create") {
    if (!user) {
      return { error: "You need to sign in again before creating a lead.", success: false };
    }

    try {
      await ensurePublicUserFromAuthUser(supabase, user);
    } catch (syncError) {
      return {
        error:
          syncError instanceof Error ? syncError.message : "Unable to verify your user record.",
        success: false
      };
    }

    const groupResponse = await getGroupForLeadCreation(supabase, payload.group_id as string | null | undefined);

    if (groupResponse.error) {
      return { error: groupResponse.error.message, success: false };
    }

    if (!groupResponse.data) {
      return { error: "Selected group was not found.", success: false };
    }

    const insertPayload: LeadInsert = {
      ...(payload as LeadInsert),
      group_id: groupResponse.data.id,
      lead_by: user.id
    };

    if (!insertPayload.assigned_to) {
      insertPayload.assigned_to = groupResponse.data.caller_user_id;
    }

    insertPayload.deal_closed = false;

    try {
      validatePipelineState(insertPayload);
    } catch (pipelineError) {
      return {
        error:
          pipelineError instanceof Error ? pipelineError.message : "Pipeline validation failed.",
        success: false
      };
    }

    const response = await insertLead(supabase, insertPayload);
    error = response.error;
  } else {
    const updatePayload: LeadUpdate = omitUnchangedFields(payload as LeadUpdate, existingLead ?? {});

    if (profile.role === "owner") {
      if (updatePayload.deal_closed === true) {
        updatePayload.status = "Closed";
      }
    }

    if (!Object.keys(updatePayload).length) {
      return { error: "", success: true };
    }

    if (profile.role === "owner") {
      try {
        validateDealClosure({
          deal_closed:
            updatePayload.deal_closed === undefined
              ? (existingLead?.deal_closed as boolean | undefined)
              : updatePayload.deal_closed,
          deal_amount:
            updatePayload.deal_amount === undefined
              ? (existingLead?.deal_amount as number | null | undefined)
              : updatePayload.deal_amount,
          selected_plan:
            updatePayload.selected_plan === undefined
              ? (existingLead?.selected_plan as LeadUpdate["selected_plan"])
              : updatePayload.selected_plan,
          closing_date:
            updatePayload.closing_date === undefined
              ? (existingLead?.closing_date as string | null | undefined)
              : updatePayload.closing_date,
          payment_status:
            updatePayload.payment_status === undefined
              ? (existingLead?.payment_status as LeadUpdate["payment_status"])
              : updatePayload.payment_status,
          advance_amount:
            updatePayload.advance_amount === undefined
              ? (existingLead?.advance_amount as number | null | undefined)
              : updatePayload.advance_amount,
          discount_given:
            updatePayload.discount_given === undefined
              ? (existingLead?.discount_given as number | null | undefined)
              : updatePayload.discount_given,
          status:
            updatePayload.status === undefined
              ? (existingLead?.status as LeadUpdate["status"])
              : updatePayload.status,
          lost_reason:
            updatePayload.lost_reason === undefined
              ? (existingLead?.lost_reason as string | null | undefined)
              : updatePayload.lost_reason
          });
      } catch (pipelineError) {
        return {
          error:
            pipelineError instanceof Error ? pipelineError.message : "Pipeline validation failed.",
          success: false
        };
      }
    }

    if (profile.role !== "owner") {
      try {
        validatePipelineStateWithTouches({
          ...(existingLead ?? {}),
          ...updatePayload
        }, Object.keys(updatePayload));
      } catch (pipelineError) {
        return {
          error:
            pipelineError instanceof Error ? pipelineError.message : "Pipeline validation failed.",
          success: false
        };
      }
    }

    const response = await updateLead(supabase, input.leadId, updatePayload);
    error =
      response.error ??
      (!response.data
        ? { message: "Update was blocked or no matching lead row was changed in Supabase." }
        : null);
  }

  if (error) {
    return { error: error.message, success: false };
  }

  if (input.mode === "edit" && profile.role === "owner" && input.leadId) {
    try {
      await syncLeadCommissionDistribution(supabase, input.leadId);
    } catch (syncError) {
      return {
        error:
          syncError instanceof Error
            ? syncError.message
            : "Lead updated, but commission distribution could not be synchronized.",
        success: false
      };
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/crm");

  return { error: "", success: true };
}
