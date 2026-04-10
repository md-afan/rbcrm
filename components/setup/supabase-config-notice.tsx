import { AlertTriangle } from "lucide-react";

export function SupabaseConfigNotice() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="panel p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
            <AlertTriangle className="size-5" />
          </div>
          <div className="space-y-3">
            <div>
              <h1 className="font-[var(--font-display)] text-2xl font-semibold text-ink">
                Supabase setup required
              </h1>
              <p className="mt-2 text-sm leading-7 text-ink/65">
                Add your Supabase project values to <code className="rounded bg-white px-1.5 py-0.5 text-xs text-ink">.env.local</code>{" "}
                before using auth, dashboards, or realtime CRM updates.
              </p>
            </div>
            <div className="rounded-2xl bg-sand p-4">
              <p className="mb-3 text-sm font-medium text-ink/70">Add these values:</p>
              <pre className="overflow-x-auto rounded-xl bg-white/70 p-4 text-sm leading-7 text-ink/80">
                <code>{`NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`}</code>
              </pre>
              <p className="mt-3 text-sm text-ink/60">
                Then restart the dev server with <code className="rounded bg-white px-1.5 py-0.5 text-xs text-ink">npm run dev</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
