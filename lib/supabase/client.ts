"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export function createSupabaseBrowserClient() {
  const { url, anonKey, isConfigured } = getSupabaseEnv();

  if (!isConfigured) {
    return null;
  }

  return createBrowserClient<Database>(
    url!,
    anonKey!
  );
}
