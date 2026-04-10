"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LoaderCircle, UserPlus2 } from "lucide-react";
import { signupAction } from "@/app/signup/actions";

const initialState = {
  error: ""
};

export function SignupForm() {
  const [state, action, pending] = useActionState(signupAction, initialState);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <div className="inline-flex rounded-2xl bg-sky px-3 py-2 text-ocean">
          <UserPlus2 className="size-5" />
        </div>
        <h2 className="font-[var(--font-display)] text-3xl font-semibold text-ink">
          Create account
        </h2>
        <p className="text-sm leading-6 text-ink/65">
          Use email and password to create a CRM user. Role metadata is stored at sign up.
        </p>
      </div>

      <label className="block space-y-2 text-sm">
        <span className="font-medium text-ink/80">Full name</span>
        <input
          name="fullName"
          type="text"
          className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 outline-none ring-0 transition focus:border-ocean"
          placeholder="Aman Sharma"
          required
        />
      </label>

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

      <label className="block space-y-2 text-sm">
        <span className="font-medium text-ink/80">Role</span>
        <select
          name="role"
          defaultValue="lead"
          className="w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 outline-none ring-0 transition focus:border-ocean"
        >
          <option value="lead">Lead Generator</option>
          <option value="caller">Caller</option>
          <option value="demo">Demo</option>
            <option value="owner">Owner</option>
        </select>
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
        Create account
      </button>

      <p className="text-center text-sm text-ink/60">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-ocean underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
