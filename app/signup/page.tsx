import Link from "next/link";
import { Suspense } from "react";
import { UserPlus2 } from "lucide-react";
import { SignupForm } from "@/components/auth/signup-form";
import { SupabaseConfigNotice } from "@/components/setup/supabase-config-notice";
import { getSupabaseEnv } from "@/lib/env";

export default function SignupPage() {
  const { isConfigured } = getSupabaseEnv();

  if (!isConfigured) {
    return <SupabaseConfigNotice />;
  }

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="grid-fade panel grid w-full max-w-5xl overflow-hidden border-none bg-[linear-gradient(145deg,rgba(255,255,255,0.93),rgba(216,240,244,0.9))] md:grid-cols-[1.05fr_0.95fr]">
        <section className="flex min-h-[420px] flex-col justify-between p-8 md:p-12">
          <div className="space-y-5">
            <span className="inline-flex w-fit rounded-full bg-ink px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white">
              Ruban Core
            </span>
            <div className="space-y-3">
              <div className="inline-flex rounded-2xl bg-sky px-3 py-2 text-ocean">
                <UserPlus2 className="size-5" />
              </div>
              <h1 className="max-w-xl font-[var(--font-display)] text-4xl font-bold tracking-tight text-ink md:text-5xl">
                Create a role-based CRM account.
              </h1>
              <p className="max-w-xl text-sm leading-7 text-ink/70 md:text-base">
                Add a team member with email and password, seed their role metadata,
                and let Supabase create the linked profile automatically.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white/75 p-4 text-sm text-ink/70">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-ocean underline-offset-4 hover:underline">
              Sign in here
            </Link>
            .
          </div>
        </section>

        <section className="border-t border-ink/10 bg-white/70 p-8 md:border-l md:border-t-0 md:p-12">
          <Suspense>
            <SignupForm />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
