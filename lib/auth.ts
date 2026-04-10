import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import { normalizeUserRole } from "@/types/crm";
import type { UserProfile } from "@/types/crm";

type AuthUserLike = {
  id: string;
  email?: string;
  user_metadata?: {
    role?: string;
    full_name?: string;
  };
};

export async function ensurePublicUserFromAuthUser(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  user: AuthUserLike
) {
  const metadataRole = normalizeUserRole(user.user_metadata?.role as string | undefined);
  const metadataName = user.user_metadata?.full_name as string | undefined;

  const { data } = await supabase
    .from("users")
    .select("id, email, name, role")
    .eq("id", user.id)
    .maybeSingle();
  let profile = data as Database["public"]["Tables"]["users"]["Row"] | null;

  if (!profile) {
    const usersTable = supabase.from("users") as unknown as {
      upsert: (
        values: Array<{ id: string; name: string; email: string; role: string }>,
        options?: { onConflict?: string }
      ) => Promise<{ error: { message: string } | null }>;
    };

    const upsertResponse = await usersTable.upsert(
      [
        {
          id: user.id,
          name: metadataName ?? "Team Member",
          email: user.email ?? "",
          role: metadataRole
        }
      ],
      { onConflict: "id" }
    );

    if (upsertResponse.error) {
      throw new Error(upsertResponse.error.message);
    }

    const retry = await supabase
      .from("users")
      .select("id, email, name, role")
      .eq("id", user.id)
      .maybeSingle();

    profile = retry.data as Database["public"]["Tables"]["users"]["Row"] | null;
  }

  return {
    id: user.id,
    email: profile?.email ?? user.email ?? "",
    fullName: profile?.name ?? metadataName ?? "Team Member",
    role: normalizeUserRole((profile?.role as string | undefined) ?? metadataRole)
  } satisfies UserProfile;
}

export async function getCurrentUserProfile(): Promise<UserProfile> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return ensurePublicUserFromAuthUser(supabase, user);
}
