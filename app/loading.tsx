import { AppLoading } from "@/components/ui/app-loading";

export default function AppRouteLoading() {
  return (
    <main className="min-h-screen">
      <AppLoading
        title="Preparing Ruban Core CRM"
        subtitle="Loading your workspace, security context, and live pipeline data."
      />
    </main>
  );
}
