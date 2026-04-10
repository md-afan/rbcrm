import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

type CookieMutation = {
  name: string;
  value: string;
  options?: Parameters<(typeof cookies extends () => Promise<infer T> ? T : never)["set"]>[2];
};

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { url, anonKey, isConfigured } = getSupabaseEnv();

  if (!isConfigured) {
    throw new Error(
      "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createServerClient<Database>(
    url!,
    anonKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieMutation[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        }
      }
    }
  );
}
