"use client";

import { type PropsWithChildren, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { SupabaseContext } from "@/components/supabase-context";

export function Providers({ children }: PropsWithChildren) {
  const [client] = useState(() => createSupabaseBrowserClient());

  return <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>;
}
