import Image from "next/image";
import { signOutAction } from "@/app/actions/auth";
import { AppNav } from "@/components/layout/app-nav";
import { roleDescriptions, roleLabels } from "@/lib/constants";
import type { UserProfile } from "@/types/crm";

export function AppShell({
  children,
  profile
}: {
  children: React.ReactNode;
  profile: UserProfile;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-ink/10 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
            <div className="flex items-start gap-4 min-w-0">
              <div className="inline-flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-black/10 bg-white">
                <Image
                  src="/ruban-core-logo.png"
                  alt="Ruban Core logo"
                  width={48}
                  height={48}
                  className="size-full object-cover"
                />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="font-[var(--font-display)] text-xl font-semibold tracking-tight text-ink">
                  Ruban Core CRM
                </p>
                <p className="max-w-2xl text-sm leading-6 text-ink/60">
                  {roleDescriptions[profile.role]}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 xl:min-w-[28rem] xl:items-end">
              <AppNav role={profile.role} />

              <div className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between xl:min-w-[22rem]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{profile.fullName}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-ink/45">
                    {roleLabels[profile.role]}
                  </p>
                </div>
                <form action={signOutAction}>
                  <button className="w-full rounded-full border border-ink/10 px-4 py-2 text-sm font-medium text-ink transition hover:bg-white sm:w-auto">
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
