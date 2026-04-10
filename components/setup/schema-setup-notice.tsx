import { DatabaseZap } from "lucide-react";

export function SchemaSetupNotice({
  title = "Supabase schema setup required",
  description = "Your project is connected, but the CRM tables are not available yet. Run the SQL files in your Supabase SQL editor, then refresh the app.",
  details
}: {
  title?: string;
  description?: string;
  details?: string;
}) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="panel p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="rounded-2xl bg-sky p-3 text-ocean">
            <DatabaseZap className="size-5" />
          </div>
          <div className="space-y-4">
            <div>
              <h1 className="font-[var(--font-display)] text-2xl font-semibold text-ink">
                {title}
              </h1>
              <p className="mt-2 text-sm leading-7 text-ink/65">{description}</p>
            </div>

            <div className="rounded-2xl bg-sand p-4 text-sm text-ink/75">
              <p className="font-medium text-ink/80">Run these files in Supabase:</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <code>supabase/schema.sql</code>
                </li>
                <li>
                  <code>supabase/rls.sql</code>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl bg-white p-4 text-sm text-ink/70">
              <p className="font-medium text-ink/80">Expected tables:</p>
              <p className="mt-2">
                <code>public.users</code>, <code>public.groups</code>, and <code>public.leads</code>
              </p>
            </div>

            {details ? (
              <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
                <p className="font-medium">Current error</p>
                <p className="mt-2 break-words">{details}</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
