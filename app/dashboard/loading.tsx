import { AppLoading } from "@/components/ui/app-loading";

export default function DashboardLoading() {
  return (
    <AppLoading
      title="Loading dashboard"
      subtitle="Pulling group metrics, lead progress, and the next actions for your team."
    />
  );
}
