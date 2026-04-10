"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeUserRole } from "@/types/crm";

export type GroupActionState = {
  error?: string;
  success?: boolean;
};

const groupBaseSchema = z.object({
  group_id: z.string().uuid().optional(),
  group_name: z.string().min(2, "Group name is required."),
  lead_user_id: z.string().uuid("Select a lead user."),
  caller_user_id: z.string().uuid("Select a caller."),
  demo_user_id: z.string().uuid("Select a demo user.")
});

const groupSchema = groupBaseSchema
  .superRefine((value, ctx) => {
    const uniqueIds = new Set([value.lead_user_id, value.caller_user_id, value.demo_user_id]);

    if (uniqueIds.size !== 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Lead, caller, and demo users must all be different."
      });
    }
  });

export async function createGroupAction(
  _previousState: GroupActionState,
  formData: FormData
) {
  const parsed = groupBaseSchema.omit({ group_id: true }).safeParse({
    group_name: formData.get("group_name"),
    lead_user_id: formData.get("lead_user_id"),
    caller_user_id: formData.get("caller_user_id"),
    demo_user_id: formData.get("demo_user_id")
  });

  if (parsed.success) {
    const uniqueIds = new Set([parsed.data.lead_user_id, parsed.data.caller_user_id, parsed.data.demo_user_id]);

    if (uniqueIds.size !== 3) {
      return {
        error: "Lead, caller, and demo users must all be different."
      };
    }
  }

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid group details."
    };
  }

  const supabase = await createSupabaseServerClient();
  const selectedUserIds = [
    parsed.data.lead_user_id,
    parsed.data.caller_user_id,
    parsed.data.demo_user_id
  ];

  const usersLookup = supabase.from("users") as unknown as {
    select: (
      columns: string
    ) => {
      in: (
        column: string,
        values: string[]
      ) => Promise<{ data: Array<{ id: string }> | null; error: { message: string } | null }>;
    };
  };
  const existingUsersResponse = await usersLookup.select("id").in("id", selectedUserIds);

  if (existingUsersResponse.error) {
    return {
      error: existingUsersResponse.error.message
    };
  }

  const existingUserIds = new Set((existingUsersResponse.data ?? []).map((user) => user.id));
  const missingUserIds = selectedUserIds.filter((id) => !existingUserIds.has(id));

  if (missingUserIds.length > 0) {
    const legacyProfilesTable = supabase.from("profiles") as unknown as {
      select: (
        columns: string
      ) => {
        in: (
          column: string,
          values: string[]
        ) => Promise<{
          data: Array<{ id: string; full_name: string; email: string; role: string }> | null;
          error: { message: string } | null;
        }>;
      };
    };

    const legacyProfilesResponse = await legacyProfilesTable
      .select("id, full_name, email, role")
      .in("id", missingUserIds);

    if (legacyProfilesResponse.error) {
      return {
        error: legacyProfilesResponse.error.message
      };
    }

    if ((legacyProfilesResponse.data ?? []).length !== missingUserIds.length) {
      return {
        error: "Some selected employees are missing from the synced users table."
      };
    }

    const usersTable = supabase.from("users") as unknown as {
      upsert: (
        values: Array<{ id: string; name: string; email: string; role: string }>,
        options?: { onConflict?: string }
      ) => Promise<{ error: { message: string } | null }>;
    };

    const syncResponse = await usersTable.upsert(
      (legacyProfilesResponse.data ?? []).map((profile) => ({
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        role: normalizeUserRole(profile.role)
      })),
      { onConflict: "id" }
    );

    if (syncResponse.error) {
      return {
        error: syncResponse.error.message
      };
    }
  }

  const groupsTable = supabase.from("groups") as unknown as {
    insert: (value: typeof parsed.data) => Promise<{ error: { message: string } | null }>;
  };
  const { error } = await groupsTable.insert(parsed.data);

  if (error) {
    return {
      error: error.message
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/crm");

  return {
    success: true
  };
}

export async function updateGroupAction(
  _previousState: GroupActionState,
  formData: FormData
) {
  const parsed = groupSchema.safeParse({
    group_id: formData.get("group_id"),
    group_name: formData.get("group_name"),
    lead_user_id: formData.get("lead_user_id"),
    caller_user_id: formData.get("caller_user_id"),
    demo_user_id: formData.get("demo_user_id")
  });

  if (!parsed.success || !parsed.data.group_id) {
    return {
      error: parsed.error?.issues[0]?.message ?? "Invalid group details."
    };
  }

  const supabase = await createSupabaseServerClient();
  const groupsTable = supabase.from("groups") as unknown as {
    update: (
      value: Omit<typeof parsed.data, "group_id">
    ) => {
      eq: (
        column: "id",
        value: string
      ) => Promise<{ error: { message: string } | null }>;
    };
  };

  const { error } = await groupsTable
    .update({
      group_name: parsed.data.group_name,
      lead_user_id: parsed.data.lead_user_id,
      caller_user_id: parsed.data.caller_user_id,
      demo_user_id: parsed.data.demo_user_id
    })
    .eq("id", parsed.data.group_id);

  if (error) {
    return {
      error: error.message
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/groups");
  revalidatePath("/crm");

  return {
    success: true
  };
}
