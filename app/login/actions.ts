"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  next: z.string().optional()
});

export async function loginAction(
  _previousState: { error?: string },
  formData: FormData
) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next")
  });

  if (!parsed.success) {
    return {
      error: "Enter a valid email and password."
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error) {
    return {
      error: error.message
    };
  }

  redirect(parsed.data.next || "/dashboard");
}
