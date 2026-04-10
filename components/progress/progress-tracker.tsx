import { CheckCircle2, Circle } from "lucide-react";
import { progressSteps } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { LeadRecord } from "@/types/crm";

type StepTone = "pending" | "completed";

function getStepState(lead: LeadRecord, step: (typeof progressSteps)[number]["key"]): StepTone {
  switch (step) {
    case "lead":
      return lead.business_name && lead.phone ? "completed" : "pending";
    case "caller":
      return lead.status !== "New" ? "completed" : "pending";
    case "demo":
      return lead.demo_status && lead.demo_status !== "Cancelled" ? "completed" : "pending";
    case "owner":
      return lead.deal_closed || lead.status === "Lost" ? "completed" : "pending";
  }
}

export function ProgressTracker({ lead }: { lead: LeadRecord }) {
  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      {progressSteps.map((step, index) => {
        const active = getStepState(lead, step.key);
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-center gap-2 sm:gap-3">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-2.5 py-2 text-[11px] font-semibold sm:px-3 sm:text-xs",
                active === "completed" ? "bg-moss/15 text-moss" : "bg-ink/5 text-ink/45"
              )}
            >
              {active === "completed" ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
              <Icon className="size-4" />
              {step.label}
            </div>
            {index < progressSteps.length - 1 ? (
              <span className="text-ink/30">→</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
