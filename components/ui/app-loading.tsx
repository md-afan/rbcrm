import { BriefcaseBusiness } from "lucide-react";

export function AppLoading({
  title,
  subtitle
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="panel overflow-hidden p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-5">
            <div className="inline-flex size-14 items-center justify-center rounded-3xl bg-ink text-white float-pulse">
              <BriefcaseBusiness className="size-6" />
            </div>
            <div className="space-y-3">
              <div className="soft-shimmer h-4 w-28 rounded-full" />
              <h1 className="font-[var(--font-display)] text-2xl font-semibold text-ink sm:text-3xl">
                {title}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-ink/60">{subtitle}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="soft-shimmer h-24 rounded-3xl" />
              <div className="soft-shimmer h-24 rounded-3xl" />
            </div>
          </div>

          <div className="grid gap-4">
            <div className="soft-shimmer h-24 rounded-3xl" />
            <div className="soft-shimmer h-24 rounded-3xl" />
            <div className="soft-shimmer h-48 rounded-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
