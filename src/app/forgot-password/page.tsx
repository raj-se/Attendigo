"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setSubmitting(false);
    setMessage(data.message ?? "If an account exists for that email, we've sent a reset link.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-lg font-semibold text-ink">
          Rollcall
        </Link>
        <h1 className="mt-6 font-display text-2xl text-ink">Reset your password</h1>
        <p className="mt-2 text-sm text-ink-500">
          Enter the email you signed up with and we'll send you a reset link.
        </p>

        {message ? (
          <p className="mt-6 rounded border border-ink-100 bg-paper-dim px-4 py-3 text-sm text-ink-600">
            {message}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-ink-600">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input mt-1"
                autoComplete="email"
              />
            </label>
            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-sm text-ink-500">
          <Link href="/login" className="text-ink underline underline-offset-4">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}