"use client";

import { useEffect, useState } from "react";
import { useSupabase } from "@/components/supabase-context";
import type { LeadRecord } from "@/types/crm";

export function useRealtimeLeads(initialLeads: LeadRecord[]) {
  const supabase = useSupabase();
  const [leads, setLeads] = useState(initialLeads);

  useEffect(() => {
    setLeads(initialLeads);
  }, [initialLeads]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel("leads-stream")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leads"
        },
        async () => {
          const { data } = await supabase
            .from("leads")
            .select("*")
            .order("created_at", { ascending: false });

          setLeads(data ?? []);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  return leads;
}
