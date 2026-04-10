import { z } from "zod";
import {
  callerSectionFields,
  demoSectionFields,
  leadSectionFields,
  ownerSectionFields
} from "@/lib/constants";
import {
  demoStatuses,
  leadQualities,
  leadStatuses,
  planOptions,
  paymentStatuses,
  userRoles
} from "@/types/crm";
import type { LeadInsert, LeadUpdate } from "@/types/database";
import type { LeadFormMode, UserRole } from "@/types/crm";
import { getFinalDealAmount } from "@/lib/finance";

const nullableString = z.string().trim().optional().nullable();
const nullableUuid = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().uuid().optional().nullable()
);
const optionalEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.enum(values).optional()
  );
const nullableDate = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().optional().nullable()
);
const nullableNumber = z.preprocess(
  (value) => (value === "" ? null : value),
  z.coerce.number().optional().nullable()
);
const booleanFromForm = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  if (value === "true" || value === true) {
    return true;
  }

  if (value === "false" || value === false) {
    return false;
  }

  return value;
}, z.boolean().optional());
export const leadBaseSchema = z.object({
  group_id: nullableUuid,
  business_name: z.string().min(1, "Business name is required."),
  business_type: nullableString,
  owner_name: z.string().min(1, "Owner name is required."),
  phone: z.string().min(1, "Phone is required."),
  city: nullableString,
  address: nullableString,
  location: z.string().min(1, "Location is required."),
  source: z.string().min(1, "Source is required."),
  lead_by: nullableUuid,
  lead_quality: optionalEnum(leadQualities).default("Medium"),
  assigned_to: nullableUuid,
  status: optionalEnum(leadStatuses).default("New"),
  interest: nullableString,
  budget: nullableString,
  attempts_count: z.coerce.number().min(0).default(0),
  next_followup_date: nullableDate,
  demo_status: z.preprocess(
    (value) => (value === "" ? null : value),
    z.enum(demoStatuses).optional().nullable()
  ),
  demo_feedback: nullableString,
  deal_closed: booleanFromForm.default(false),
  deal_amount: nullableNumber,
  selected_plan: z.preprocess(
    (value) => (value === "" ? null : value),
    z.enum(planOptions).optional().nullable()
  ),
  discount_given: nullableNumber.refine(
    (value) => value === null || value === undefined || (value >= 0 && value <= 100),
    "Discount must be between 0 and 100."
  ),
  payment_status: z.preprocess(
    (value) => (value === "" ? null : value),
    z.enum(paymentStatuses).optional().nullable()
  ),
  advance_amount: nullableNumber.default(0),
  closing_date: nullableDate,
  lost_reason: nullableString,
  final_remarks: nullableString,
  created_at: nullableDate
});

export const leadInsertSchema = leadBaseSchema;
export const leadUpdateSchema = leadBaseSchema.partial();

export function assertRoleCanEditPayload(role: UserRole, payload: Record<string, unknown>) {
  if (role === "owner") {
    return null;
  }

  const systemManagedFields = new Set<string>([
    "attempts_count",
    "assigned_to",
    "lead_by",
    "created_at"
  ]);

  const editableByRole = {
    lead: new Set<string>(leadSectionFields),
    caller: new Set<string>(callerSectionFields),
    demo: new Set<string>(demoSectionFields)
  } satisfies Record<Exclude<UserRole, "owner">, Set<string>>;

  const invalidField = Object.keys(payload).find(
    (field) => !editableByRole[role].has(field) && !systemManagedFields.has(field)
  );

  return invalidField ? `You cannot edit ${invalidField} as ${role}.` : null;
}

export function prunePayloadByRole(role: UserRole, payload: Record<string, unknown>) {
  const systemManagedFields = new Set<string>([
    "attempts_count",
    "assigned_to",
    "lead_by",
    "created_at"
  ]);

  const editableByRole = {
    lead: new Set<string>(leadSectionFields),
    caller: new Set<string>(callerSectionFields),
    demo: new Set<string>(demoSectionFields),
    owner: new Set<string>([
      ...leadSectionFields,
      ...callerSectionFields,
      ...demoSectionFields,
      ...ownerSectionFields
    ])
  } satisfies Record<UserRole, Set<string>>;

  return Object.fromEntries(
    Object.entries(payload).filter(
      ([field, value]) =>
        value !== undefined &&
        (editableByRole[role].has(field) || systemManagedFields.has(field))
    )
  );
}

export function buildLeadPayload(
  values: z.infer<typeof leadInsertSchema> | z.infer<typeof leadUpdateSchema>,
  mode: LeadFormMode
): LeadInsert | LeadUpdate {
  const payload: Partial<LeadInsert> = {};

  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined) {
      payload[key as keyof LeadInsert] = (value === "" ? null : value) as never;
    }
  });

  if (mode === "create") {
    payload.created_at = new Date().toISOString();
  }

  return mode === "create" ? (payload as LeadInsert) : (payload as LeadUpdate);
}

type PipelineLeadState = Partial<
  Pick<
    LeadInsert,
    | "group_id"
    | "business_name"
    | "business_type"
    | "owner_name"
    | "phone"
    | "city"
    | "address"
    | "location"
    | "source"
    | "status"
    | "next_followup_date"
    | "demo_status"
    | "demo_feedback"
    | "deal_closed"
    | "selected_plan"
    | "deal_amount"
    | "discount_given"
    | "payment_status"
    | "advance_amount"
    | "closing_date"
    | "lost_reason"
    | "final_remarks"
  >
>;

export function validatePipelineState(state: PipelineLeadState) {
  return validatePipelineStateWithTouches(state);
}

export function validatePipelineStateWithTouches(
  state: PipelineLeadState,
  touchedFields?: string[]
) {
  const hasTouch = (...fields: string[]) =>
    !touchedFields || fields.some((field) => touchedFields.includes(field));

  if (
    !state.group_id ||
    !state.business_name ||
    !state.owner_name ||
    !state.phone ||
    !state.location ||
    !state.source
  ) {
    throw new Error("Lead section is incomplete. Select a group and fill business name, owner, phone, location, and source.");
  }

  if (
    hasTouch("status", "next_followup_date") &&
    state.status === "Follow-up" &&
    !state.next_followup_date
  ) {
    throw new Error("Next follow-up date is required when status is Follow-up.");
  }

  if (
    hasTouch("demo_status", "demo_feedback") &&
    state.demo_status === "Done" &&
    !state.demo_feedback
  ) {
    throw new Error("Demo feedback is required when demo status is Done.");
  }
}

export function validateDealClosure(
  state: Pick<
    PipelineLeadState,
    | "deal_closed"
    | "deal_amount"
    | "selected_plan"
    | "closing_date"
    | "payment_status"
    | "advance_amount"
    | "discount_given"
    | "status"
    | "lost_reason"
  >
) {
  if (state.deal_closed === true && (state.deal_amount === null || state.deal_amount === undefined)) {
    throw new Error("Deal amount is required before closing a deal.");
  }

  if (state.deal_closed === true && !state.selected_plan) {
    throw new Error("Selected plan is required before closing a deal.");
  }

  if (state.deal_closed === true && !state.closing_date) {
    throw new Error("Closing date is required before closing a deal.");
  }

  if (state.deal_closed !== true && state.status === "Lost" && !state.lost_reason) {
    throw new Error("Lost reason is required when a lead is marked as Lost.");
  }

  if (state.payment_status === "Paid") {
    const finalAmount = getFinalDealAmount(state.deal_amount, state.discount_given);

    if (finalAmount === null) {
      throw new Error("Deal amount is required before marking payment as Paid.");
    }

    if ((state.advance_amount ?? 0) !== finalAmount) {
      throw new Error("Advance amount must equal the final amount when payment status is Paid.");
    }
  }
}
export const roleSchema = z.enum(userRoles);
