"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-lg font-semibold text-ink">
          Rollcall
        </Link>
        <h1 className="mt-6 font-display text-2xl text-ink">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          For instructors running classes or workshops.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input"
              autoComplete="name"
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input"
              autoComplete="email"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="input"
              autoComplete="new-password"
            />
          </Field>

          {error && (
            <p className="rounded bg-absent-bg px-3 py-2 text-sm text-absent">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-ink px-4 py-3 text-sm font-medium text-paper hover:bg-ink-700 disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink-500">
          Already have an account?{" "}
          <Link href="/login" className="text-ink underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
