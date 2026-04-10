import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { SupabaseConfigNotice } from "@/components/setup/supabase-config-notice";
import { getSupabaseEnv } from "@/lib/env";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const { isConfigured } = getSupabaseEnv();

  if (!isConfigured) {
    return <SupabaseConfigNotice />;
  }

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="grid-fade panel grid w-full max-w-5xl overflow-hidden border-none bg-[linear-gradient(145deg,rgba(255,255,255,0.93),rgba(216,240,244,0.9))] md:grid-cols-[1.1fr_0.9fr]">
        <section className="flex min-h-[420px] flex-col justify-between p-8 md:p-12">
          <div className="space-y-5">
            <span className="inline-flex w-fit rounded-full bg-ink px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white">
              Ruban Core
            </span>
            <div className="space-y-3">
              <h1 className="max-w-xl font-[var(--font-display)] text-4xl font-bold tracking-tight text-ink md:text-5xl">
                One client row. Full operating rhythm.
              </h1>
              <p className="max-w-xl text-sm leading-7 text-ink/70 md:text-base">
                Centralize lead capture, calling, demos, closures, and payment visibility
                in one secure role-based workspace powered by Supabase.
              </p>
            </div>
          </div>
          <div className="grid gap-3 text-sm text-ink/75 md:grid-cols-3">
            <div className="rounded-2xl bg-white/75 p-4">
              <p className="font-semibold">Single table lifecycle</p>
              <p className="mt-1 text-ink/60">Lead to payment without fragmented records.</p>
            </div>
            <div className="rounded-2xl bg-white/75 p-4">
              <p className="font-semibold">Strict role control</p>
              <p className="mt-1 text-ink/60">Everyone sees all, edits only their section.</p>
            </div>
            <div className="rounded-2xl bg-white/75 p-4">
              <p className="font-semibold">Realtime updates</p>
              <p className="mt-1 text-ink/60">Shared pipeline without manual refreshes.</p>
            </div>
          </div>
          <div className="rounded-2xl bg-white/75 p-4 text-sm text-ink/70">
            Need a new team account?{" "}
            <Link href="/signup" className="font-semibold text-ocean underline-offset-4 hover:underline">
              Create one here
            </Link>
            .
          </div>
        </section>
        <section className="border-t border-ink/10 bg-white/70 p-8 md:border-l md:border-t-0 md:p-12">
          <Suspense>
            <LoginForm nextPath={params.next} />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
