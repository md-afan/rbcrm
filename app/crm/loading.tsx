import { AppLoading } from "@/components/ui/app-loading";

export default function CrmLoading() {
  return (
    <AppLoading
      title="Loading CRM workspace"
      subtitle="Syncing lead rows, filters, and role-based editing access."
    />
  );
}
