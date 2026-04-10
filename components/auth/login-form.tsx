"use client";

import { useActionState } from "react";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { loginAction } from "@/app/login/actions";

const initialState = {
  error: ""
};

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <div className="inline-flex rounded-2xl bg-sky px-3 py-2 text-ocean">
          <LockKeyhole className="size-5" />
        </div>
        <h2 className="font-[var(--font-display)] text-3xl font-semibold text-ink">
          Secure sign in
        </h2>
        <p className="text-sm leading-6 text-ink/65">
          Use your assigned Supabase account. Role-based routing happens automatically
          after login.
        </p>
      </div>

      <input type="hidden" name="next" value={nextPath ?? ""} />

      <label className="block space-y-2 text-sm">
        <span className="font-medium text-ink/80">Email</span>
        <input
          name="email"
          type="email"
          className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 outline-none ring-0 transition focus:border-ocean"
          placeholder="team@rubancore.com"
          required
        />
      </label>

      <label className="block space-y-2 text-sm">
        <span className="font-medium text-ink/80">Password</span>
        <input
          name="password"
          type="password"
          className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 outline-none ring-0 transition focus:border-ocean"
          placeholder="Minimum 8 characters"
          required
        />
      </label>

      {state.error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-4 py-3 font-medium text-white transition hover:bg-ocean disabled:cursor-not-allowed disabled:opacity-75"
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
        Continue to workspace
      </button>
    </form>
  );
}
