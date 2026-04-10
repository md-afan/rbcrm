"use client";

import { createContext, useContext } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type BrowserSupabaseClient = ReturnType<typeof createSupabaseBrowserClient>;

export const SupabaseContext = createContext<BrowserSupabaseClient>(null);

export function useSupabase() {
  return useContext(SupabaseContext);
}
