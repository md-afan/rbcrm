"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { userRoles } from "@/types/crm";

const signupSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  role: z.enum(userRoles).default("lead")
});

export async function signupAction(
  _previousState: { error?: string },
  formData: FormData
) {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Enter valid sign up details."
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        role: parsed.data.role
      }
    }
  });

  if (error) {
    return {
      error: error.message
    };
  }

  redirect("/dashboard");
}
